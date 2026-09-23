import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test, type TestContext } from 'node:test';
import { normalizeJapanPostAssignments, summarizeJapanPostAssignments } from '../intake-postal-context-jp-m2.mjs';
import { buildJapanPostM2Pack, materializeJapanPostM2Pack, type JapanPostM2Receipt } from './postal-context-jp-m2-pack';
import { loadPostalContextPack } from '../../src/server/postalContextPackStore';

const INSTANT = '2026-08-28T00:58:13.580Z';
const DIGEST = `sha256:${'a'.repeat(64)}`;
const csv = (code: string, town: string, municipality = '00001', multiTown = '0') =>
  [municipality,'000',code,'カクウ','カクウ','カクウ','架空都','架空市',town,'0','0','0',multiTown,'0','0'].map(s => `"${s}"`).join(',');
function fixture() {
  const rows = normalizeJapanPostAssignments([
    csv('0000001','架空町'), csv('0000002','以下に掲載がない場合'),
    csv('0000003','架空北町','00001','1'), csv('0000003','架空南町','00001','1'),
    csv('0000004','架空村一円'), csv('0000005','架空町（例外区画）'),
  ].join('\n'));
  const receipt: JapanPostM2Receipt = {
    schemaVersion: 'postal-context-jp-m2-intake/v1', countryCode: 'JP', status: 'intake_validated_not_m2',
    observedAt: INSTANT, sourceRelease: '2026-07-31', synthetic: true,
    sources: {
      archive: { digest: DIGEST, byteLength: 100, url: 'https://example.invalid/synthetic.zip' },
      releasePage: { digest: DIGEST, url: 'https://example.invalid/release' },
      termsPage: { digest: DIGEST, url: 'https://example.invalid/terms' },
      expandedCsv: { digest: DIGEST, byteLength: 100 },
    },
    summary: summarizeJapanPostAssignments(rows),
  };
  return { rows, receipt };
}
function materialized(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'agid-jp-m2-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { rows, receipt } = fixture();
  const built = buildJapanPostM2Pack(rows, receipt, ['00001']);
  const path = join(root, 'pack');
  return { built, path, loaded: materializeJapanPostM2Pack(path, built) };
}

test('builder is deterministic and keeps synthetic fixtures non-promotable', () => {
  const { rows, receipt } = fixture();
  const a = buildJapanPostM2Pack(rows, receipt, ['00001']);
  const b = buildJapanPostM2Pack(rows, receipt, ['00001']);
  assert.equal(a.descriptorDigest, b.descriptorDigest);
  for (const [name, bytes] of a.files) assert.deepEqual(bytes, b.files.get(name));
  const evidenceRows = a.files.get('assignments.jsonl')!.toString('utf8').trim().split('\n').map(line => JSON.parse(line));
  assert.deepEqual(evidenceRows, rows);
  assert.equal(evidenceRows.at(-1).classification, 'partial_or_qualified_town');
  assert.equal(a.descriptor.synthetic, true); assert.equal(a.descriptor.promotionEligible, false);
  assert.ok(a.graph.nodes.every(n => !['building','address_record','address_point','agid_cell'].includes(n.kind)));
  assert.ok(a.graph.nodes.every(n => n.geometryType === 'none'));
});
test('loader serves locality, preserves ambiguous branches, and never turns a fallback into a locality', t => {
  const { loaded } = materialized(t);
  const single = loaded.runtime.lookupPostalCode('000-0001', INSTANT, INSTANT, true);
  assert.equal(single.status, 'unique'); assert.equal(single.normalizedPostalCode, '000-0001');
  assert.ok(single.contexts.some(c => c.label === '架空町'));
  assert.deepEqual(single.geometries, []);
  const multiple = loaded.runtime.lookupPostalCode('0000003', INSTANT);
  assert.equal(multiple.status, 'ambiguous'); assert.equal(multiple.alternatives.length, 2);
  assert.ok(!multiple.contexts.some(c => c.kind === 'locality'));
  for (const code of ['0000002','0000004']) assert.ok(!loaded.runtime.lookupPostalCode(code, INSTANT).contexts.some(c => c.kind === 'locality'));
});
test('observation-only validity and known-time boundaries fail closed', t => {
  const { loaded } = materialized(t);
  const before = new Date(Date.parse(INSTANT) - 1).toISOString();
  const after = new Date(Date.parse(INSTANT) + 1).toISOString();
  assert.equal(loaded.runtime.lookupPostalCode('0000001', before).status, 'no_match');
  assert.equal(loaded.runtime.lookupPostalCode('0000001', after).status, 'no_match');
  assert.equal(loaded.runtime.lookupPostalCode('0000001', INSTANT, before).status, 'no_match');
  assert.equal(loaded.runtime.lookupPostalCode('9999999', INSTANT).status, 'no_match');
});
test('an altered source or an incomplete postcode scope is rejected before building', () => {
  const { rows, receipt } = fixture();
  const tampered = structuredClone(rows); tampered[0].townLabel = 'wrong';
  assert.throws(() => buildJapanPostM2Pack(tampered, receipt, ['00001']), /normalized-source-mismatch/);
  const more = normalizeJapanPostAssignments([csv('0000001','架空東町','00001'), csv('0000001','架空西町','00002')].join('\n'));
  const changed = { ...receipt, summary: summarizeJapanPostAssignments(more) };
  assert.throws(() => buildJapanPostM2Pack(more, changed, ['00001']), /crosses-scope/);
  assert.throws(() => buildJapanPostM2Pack(rows, receipt, ['99999']), /scope-not-in-source/);
});
test('materialization never overwrites existing output and refuses synthetic use without opt-in', t => {
  const { path, built } = materialized(t);
  assert.throws(() => materializeJapanPostM2Pack(path, built), /EEXIST/);
  assert.throws(() => loadPostalContextPack(join(path, 'descriptor.json'), built.descriptorDigest, { expectedCountryCode: 'JP', allowExperimental: true }), /synthetic-pack-not-enabled/);
});
test('same-size graph tampering is caught by the real pinned loader', t => {
  const { path, built } = materialized(t);
  const graphPath = join(path, 'graph.json');
  const original = readFileSync(graphPath, 'utf8');
  writeFileSync(graphPath, original.replace('架空町','偽造町'));
  assert.throws(() => loadPostalContextPack(join(path, 'descriptor.json'), built.descriptorDigest, { expectedCountryCode: 'JP', allowExperimental: true, allowSynthetic: true }), /artifact-digest-mismatch/);
});

test('invalid source metadata fails before materialization', () => {
  const { rows, receipt } = fixture();
  assert.throws(() => buildJapanPostM2Pack(rows, { ...receipt, sourceRelease: '2026-02-30' }, ['00001']), /source-version-invalid/);
  assert.throws(() => buildJapanPostM2Pack(rows, { ...receipt, synthetic: false }, ['00001']), /official-source-url-required/);
  const missing = structuredClone(receipt); delete missing.sources.termsPage;
  assert.throws(() => buildJapanPostM2Pack(rows, missing, ['00001']), /source-digest-invalid/);
  const oversized = structuredClone(receipt); oversized.sources.archive.byteLength = 100 * 1024 * 1024;
  assert.throws(() => buildJapanPostM2Pack(rows, oversized, ['00001']), /source-size-invalid/);
});
test('qualifiers never create civic, building, floor or unit identity', t => {
  const { loaded, built } = materialized(t);
  const found = loaded.runtime.lookupPostalCode('0000005', INSTANT);
  assert.ok(found.contexts.some(c => c.label === '架空町（例外区画）'));
  assert.ok(!found.contexts.some(c => ['building', 'building_part', 'address_record', 'address_point', 'entrance', 'unit'].includes(c.kind)));
  const assignments = built.files.get('assignments.jsonl')!.toString('utf8').trim().split('\n').map(line => JSON.parse(line));
  assert.equal(assignments.at(-1).geometry, null);
  assert.equal(assignments.at(-1).geometryAuthority, 'none');
});
