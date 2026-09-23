import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { inspectAmSources, probeAmReference, profileAmDirectoryBytes, summarizeAmDirectoryPages } from './inspect-postal-context-am-sources.mjs';

const cell = (str, x, y = 100) => ({ str, transform: [1, 0, 0, 1, x, y] });
const row = (code, y = 100) => [cell('Synthetic region', 53, y), cell('Synthetic office', 170, y), cell(code, 334.44, y), cell('Private test value must not leak', 379, y)];
const pages = () => Array.from({ length: 9 }, (_, i) => row('000' + i));
const reference = { id: 'synthetic-am-reference', url: 'https://www.cadastre.am/example', mime: 'text/html', markers: ['synthetic reference'] };

test('AM directory preflight preserves leading zeroes and counts postcode multiplicity', () => {
  const input = pages(); input[0].push(...row('0001', 80), cell('P/O', 334, 200));
  const result = summarizeAmDirectoryPages(input);
  assert.equal(result.observedDirectoryRows, 10);
  assert.equal(result.distinctPostcodes, 9);
  assert.equal(result.leadingZeroRows, 10);
  assert.equal(result.duplicatePostcodeGroups, 1);
  assert.equal(result.rowsInDuplicateGroups, 2);
  assert.equal(result.postcodeIsUniqueKey, false);
  assert.equal(result.codeAndBasicRowChecksPassed, true);
  assert.equal(result.fullRowReconstructionVerified, false);
  assert.equal(result.currentAssignmentVerified, false);
  assert.equal(result.postalGeometryRecords, 0);
  assert.equal(result.civicAddressesVerified, 0);
  assert.equal(result.buildingLinksVerified, 0);
  assert.ok(!JSON.stringify(result).includes('Private test'));
});

test('AM column checks reject numeric truncation and missing row context', () => {
  const input = pages();
  input[0] = row('1'); input[1] = [cell('0001', 334)];
  input[2].push(cell('1234', 400, 50)); // A house number outside the P/O column is not a code.
  const result = summarizeAmDirectoryPages(input);
  assert.equal(result.invalidCodeCells, 1);
  assert.equal(result.missingContextRows, 1);
  assert.equal(result.observedDirectoryRows, 8);
  assert.equal(result.codeAndBasicRowChecksPassed, false);
});

test('AM page layout, item bounds and coordinates fail closed', () => {
  assert.throws(() => summarizeAmDirectoryPages([]), /directory-page-count/);
  const input = pages(); input[0] = Array(10_001).fill(cell('x', 334));
  assert.throws(() => summarizeAmDirectoryPages(input), /directory-item-limit/);
  input[0] = [{ str: '0001', transform: [1, 0, 0, 1, NaN, 2] }];
  assert.throws(() => summarizeAmDirectoryPages(input), /directory-invalid-position/);
  assert.equal(summarizeAmDirectoryPages(Array.from({ length: 9 }, () => [])).codeAndBasicRowChecksPassed, false);
});

test('AM changed PDF bytes never reach the layout parser', async () => {
  let parsed = false;
  await assert.rejects(() => profileAmDirectoryBytes(Buffer.from('%PDF-changed'), { getDocument() { parsed = true; } }), /directory-digest-or-format-mismatch/);
  assert.equal(parsed, false);
});

test('AM reference availability does not grant data rights or allocation', async () => {
  const result = await probeAmReference(reference, async () => new Response('<p>synthetic reference</p>', { headers: { 'content-type': 'text/html' } }));
  assert.equal(result.status, 'reference-verified-not-data');
  assert.equal(result.sourceDataRecords, 0);
  assert.match(result.sourceDocumentDigest, /^sha256:[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(result).includes('<p>'));
});

test('AM rejects login HTML, partial PDFs, altered editions and off-host redirects', async () => {
  const pdf = { ...reference, mime: 'application/pdf', markers: [], expectedDigest: 'sha256:' + '0'.repeat(64) };
  assert.equal((await probeAmReference(pdf, async () => new Response('login', { headers: { 'content-type': 'text/html' } }))).contentVerified, false);
  assert.equal((await probeAmReference(pdf, async () => new Response('%PDF-new', { headers: { 'content-type': 'application/pdf' } }))).contentVerified, false);
  assert.equal((await probeAmReference(pdf, async () => new Response('%PDF-part', { status: 206 }))).status, 'http-error');
  await assert.rejects(() => probeAmReference(reference, async () => new Response(null, { status: 302, headers: { location: 'https://unapproved.invalid/records' } })), /unapproved-reference-host/);
  await assert.rejects(() => probeAmReference({ ...reference, url: 'http://www.cadastre.am/example' }), /unapproved-reference-host/);
});

test('AM review is fixed-scope, omits source bodies and cannot certify M2 on errors', async () => {
  const config = JSON.parse(readFileSync(new URL('../data/postal_country_packs/am/postal-context/m2-source-review.json', import.meta.url)));
  const visited = [];
  const result = await inspectAmSources({}, async url => { visited.push(url); throw new Error('private upstream error'); });
  assert.deepEqual(visited.sort(), [...config.reference_probes.map(r => r.url), config.directory_probe.url].sort());
  assert.equal(result.countryM2Achieved, false);
  assert.equal(result.rightsForPublicTransformedArtifactsCleared, false);
  assert.equal(result.realAgidRuntimeVerified, false);
  assert.equal(result.sourceDataSnapshotsPersisted, 0);
  assert.equal(result.publishedDataArtifacts, 0);
  assert.ok(result.references.every(r => r.contentVerified === false));
  assert.ok(!JSON.stringify(result).includes('private upstream error'));
});

test('AM report never treats a directory HTTP 200 with changed bytes as a reviewed edition', async () => {
  const result = await inspectAmSources({}, async () => new Response('%PDF-unreviewed', { headers: { 'content-type': 'application/pdf' } }));
  assert.equal(result.directoryObservation.status, 'unexpected-content-or-edition');
  assert.equal(result.directoryObservation.validation, undefined);
  assert.equal(result.countryM2Achieved, false);
});
