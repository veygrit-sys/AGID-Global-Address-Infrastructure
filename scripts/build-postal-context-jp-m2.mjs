import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { csvFromJapanPostArchive, digest, fetchOfficialBounded, JAPAN_POST_M2_URLS, normalizeJapanPostAssignments, verifyJapanPostReference } from './intake-postal-context-jp-m2.mjs';
import { buildJapanPostM2Pack, materializeJapanPostM2Pack } from './lib/postal-context-jp-m2-pack.ts';
import { rewriteApiV1RequestUrl } from '../src/lib/apiVersion.ts';
import { createConfiguredPostalContextPackStore, loadPostalContextPack } from '../src/server/postalContextPackStore.ts';
import { registerPostalContextRoutes } from '../src/server/routes/postalContextRoutes.ts';

export async function buildAndVerifyJapanM2({ intakePath, municipalityCodes, outputDirectory, archivePath }) {
  if (existsSync(outputDirectory)) throw new Error('output-already-exists');
  const intakeBytes = readFileSync(intakePath);
  const receipt = JSON.parse(intakeBytes);
  if (receipt.synthetic !== false) throw new Error('real-source-receipt-required');
  let archive;
  if (archivePath) {
    const stat = statSync(archivePath);
    if (!stat.isFile() || stat.size > 16 * 1024 * 1024) throw new Error('local-archive-byte-limit');
    archive = readFileSync(archivePath);
  } else {
    const responses = await Promise.all([
      fetchOfficialBounded(JAPAN_POST_M2_URLS.archive, 16 * 1024 * 1024),
      fetchOfficialBounded(JAPAN_POST_M2_URLS.release, 4 * 1024 * 1024),
      fetchOfficialBounded(JAPAN_POST_M2_URLS.terms, 4 * 1024 * 1024),
    ]);
    archive = responses[0].data;
    if (verifyJapanPostReference(responses[1].data.toString('utf8'), responses[2].data.toString('utf8')) !== receipt.sourceRelease) throw new Error('pinned-source-release-mismatch');
    if (responses[1].digest !== receipt.sources.releasePage.digest || responses[2].digest !== receipt.sources.termsPage.digest) throw new Error('reference-pages-changed-review-required');
  }
  if (digest(archive) !== receipt.sources.archive.digest || archive.length !== receipt.sources.archive.byteLength) throw new Error('pinned-archive-mismatch');
  const expanded = csvFromJapanPostArchive(archive);
  if (expanded.digest !== receipt.sources.expandedCsv.digest || expanded.byteLength !== receipt.sources.expandedCsv.byteLength) throw new Error('pinned-csv-mismatch');
  const rows = normalizeJapanPostAssignments(expanded.csv);
  const built = buildJapanPostM2Pack(rows, receipt, municipalityCodes);
  const replay = buildJapanPostM2Pack(rows, receipt, municipalityCodes);
  for (const [name, bytes] of built.files) assert.deepEqual(bytes, replay.files.get(name), 'nondeterministic-build');
  mkdirSync(dirname(outputDirectory), { recursive: true });
  const loaded = materializeJapanPostM2Pack(outputDirectory, built);
  writeFileSync(join(outputDirectory, 'japan-post-utf-ken-all.zip'), archive, { flag: 'wx' });
  writeFileSync(join(outputDirectory, 'intake-receipt.json'), intakeBytes, { flag: 'wx' });
  const validAt = receipt.observedAt;
  const codes = [...new Set(built.selectedRows.map(row => row.postalCode))];
  const outcomes = { unique: 0, ambiguous: 0 };
  for (const code of codes) {
    const found = loaded.runtime.lookupPostalCode(code, validAt, validAt, true);
    assert.ok(['unique','ambiguous'].includes(found.status), `lookup-rejected-source-code:${code}`);
    outcomes[found.status]++;
    assert.deepEqual(found.geometries, []);
    const contexts = found.alternatives.flatMap(a => a.contexts);
    for (const row of built.selectedRows.filter(r => r.postalCode === code)) {
      assert.ok(contexts.some(c => c.label === row.municipality), 'source-municipality-lost');
      if (!['fallback_not_a_town','no_town_designator'].includes(row.classification)) assert.ok(contexts.some(c => c.label === row.townLabel), 'source-locality-lost');
    }
    assert.ok(!contexts.some(c => ['building','address_record','address_point'].includes(c.kind)));
  }
  const sample = built.selectedRows.find(r => r.classification === 'ordinary_locality_context_only') ?? built.selectedRows[0];
  const outsideCode = rows.find(r => !codes.includes(r.postalCode))?.postalCode;
  assert.ok(outsideCode, 'outside-scope-control-required');
  assert.equal(loaded.runtime.lookupPostalCode(outsideCode, validAt).status, 'no_match');
  const before = new Date(Date.parse(validAt) - 1).toISOString();
  const after = new Date(Date.parse(validAt) + 1).toISOString();
  assert.equal(loaded.runtime.lookupPostalCode(sample.postalCode, before).status, 'no_match');
  assert.equal(loaded.runtime.lookupPostalCode(sample.postalCode, after).status, 'no_match');
  assert.equal(loaded.runtime.lookupPostalCode(sample.postalCode, validAt, before).status, 'no_match');
  const descriptorPath = join(outputDirectory, 'descriptor.json');
  assert.throws(() => loadPostalContextPack(descriptorPath, built.descriptorDigest, { expectedCountryCode: 'JP' }), /experimental-pack-not-enabled/);
  assert.throws(() => loadPostalContextPack(descriptorPath, `sha256:${'0'.repeat(64)}`, { expectedCountryCode: 'JP', allowExperimental: true }), /descriptor-digest-mismatch/);
  const graphPath = join(outputDirectory, 'graph.json');
  const graphBytes = built.files.get('graph.json');
  const tampered = Buffer.from(graphBytes); tampered[tampered.length - 2] ^= 1;
  try {
    writeFileSync(graphPath, tampered);
    assert.throws(() => loadPostalContextPack(descriptorPath, built.descriptorDigest, { expectedCountryCode: 'JP', allowExperimental: true }), /artifact-digest-mismatch/);
  } finally { writeFileSync(graphPath, graphBytes); }

  const store = createConfiguredPostalContextPackStore({
    AGID_POSTAL_CONTEXT_JP_DESCRIPTOR_PATH: descriptorPath,
    AGID_POSTAL_CONTEXT_JP_DESCRIPTOR_DIGEST: built.descriptorDigest,
    AGID_POSTAL_CONTEXT_ALLOW_EXPERIMENTAL: 'true',
  });
  assert.equal(store.countryStatus('JP').state, 'ready', JSON.stringify(store.countryStatus('JP')));
  const app = express();
  app.use((req, res, next) => { req.url = rewriteApiV1RequestUrl(req.url); next(); });
  app.use(express.json()); registerPostalContextRoutes(app, { store });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/v1/postal`;
    const query = new URLSearchParams({ validAt, geometry: 'geojson' });
    const response = await fetch(`${base}/JP/${sample.postalCode}?${query}`);
    assert.equal(response.status, 200);
    const lookup = await response.json();
    assert.equal(lookup.ok, true); assert.equal(lookup.data.normalizedPostalCode, loaded.runtime.normalizePostalCode(sample.postalCode));
    assert.deepEqual(lookup.data.geometries, []);
    const resolveResponse = await fetch(`${base}/resolve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ countryCode: 'JP', latitude: 35.6812, longitude: 139.7671, purpose: 'display', validAt }) });
    assert.equal(resolveResponse.status, 200);
    const resolved = await resolveResponse.json();
    assert.equal(resolved.data.status, 'no_match'); assert.equal(resolved.data.resolvedLevel, 'none');
    assert.ok(resolved.data.agid.cellId); assert.equal(resolved.data.agid.canonicalPostalGeometry, false);
    assert.match(resolveResponse.headers.get('cache-control'), /private, no-store/);
    const intersects = await fetch(`${base}/intersects?${new URLSearchParams({ country: 'JP', bbox: '139.7,35.6,139.8,35.7', validAt })}`);
    assert.equal(intersects.status, 200); assert.deepEqual((await intersects.json()).data.matches, []);
  } finally { await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
  return {
    schemaVersion: 'postal-context-jp-m2-validation/v1', countryCode: 'JP', status: 'local_runtime_verified_publication_pending',
    observedAt: new Date().toISOString(), synthetic: false, sourceRelease: receipt.sourceRelease,
    sourceVerification: { mode: archivePath ? 'offline-pinned-replay' : 'online-pinned-reference', currentReferencePagesRechecked: !archivePath, sourceArchiveAndCsvDigestsVerified: true },
    intakeDigest: digest(intakeBytes), descriptorDigest: built.descriptorDigest, graphManifestDigest: built.graph.release.manifestDigest,
    releaseId: built.descriptor.releaseId, scope: built.scope,
    artifacts: [...built.files].map(([path, bytes]) => ({ path, digest: digest(bytes), bytes: bytes.length })),
    sourceArchive: { path: 'japan-post-utf-ken-all.zip', digest: digest(archive), bytes: archive.length },
    validation: { allSelectedPostalCodesChecked: codes.length, outcomes, sourceLabelsPreserved: true, reproducibleBuild: true, syntheticOptInRequired: false, experimentalOptInRequired: true, pinnedLoader: true, descriptorTamperingRejected: true, artifactTamperingRejected: true, outOfScopeRejected: true, outsideObservationRejected: true, futureKnowledgeRejected: true, agidApiV1Lookup: true, noInventedPostalGeometry: true, coordinateResolveNoMatch: true, independentAgidReference: true, privateNoStore: true },
    publication: { published: false, containsSourceLocalityRowsInReport: false, countryM2Achieved: false, nextRequirement: 'Approved external country-data publication, retained source/terms evidence and remote artifact digest verification.' },
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const args = process.argv.slice(2), values = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--intake','--municipality','--output','--report','--archive'].includes(args[i]) || !args[i + 1] || values[args[i]]) throw new Error('invalid-or-duplicate-build-argument');
    values[args[i]] = args[i + 1];
  }
  for (const key of ['--intake','--municipality','--output','--report']) if (!values[key]) throw new Error(`missing:${key}`);
  if (existsSync(resolve(values['--report']))) throw new Error('report-already-exists');
  const report = await buildAndVerifyJapanM2({ intakePath: resolve(values['--intake']), municipalityCodes: values['--municipality'].split(','), outputDirectory: resolve(values['--output']), archivePath: values['--archive'] ? resolve(values['--archive']) : null });
  mkdirSync(dirname(resolve(values['--report'])), { recursive: true });
  writeFileSync(resolve(values['--report']), `${JSON.stringify(report, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  console.log(JSON.stringify({ status: report.status, sourceRows: report.scope.nationalRowsValidated, selectedRows: report.scope.selectedRows, verifiedPostalCodes: report.validation.allSelectedPostalCodesChecked, descriptorDigest: report.descriptorDigest, countryM2Achieved: false }, null, 2));
}
