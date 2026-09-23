import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { inspectAzSources, probeAzReference, profileAzBranchHtml, summarizeAzBranches } from './inspect-postal-context-az-sources.mjs';

const branch = (id = 0, code = 'AZ0001') => ({
  id, title: 'Synthetic office', city: 'Synthetic city', city_id: '0', type: '', region: 'Synthetic region',
  address: 'PRIVATE OFFICE SENTINEL', post_index: code, coordinates: { latitude: '1.1', longitude: '2.2' },
  streets: [{ street_name: 'PRIVATE STREET SENTINEL', street_numbers: 'PRIVATE NUMBER SENTINEL' }],
});
const data = (branches = [branch()]) => ({ branches, cities: [], regions: [], search_url: '/never-query' });
const html = value => Buffer.from('<office-search :branches="' + JSON.stringify(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;') + '"></office-search>');
const reference = { id: 'synthetic-reference', url: 'https://www.azerpost.az/reference', mime: 'text/html', markers: ['synthetic reference'] };
const response = bytes => new Response(bytes, { headers: { 'content-type': 'text/html' } });

test('AZ branch profile counts duplicates and leading zeroes without treating codes or indexes as stable object IDs', () => {
  const result = profileAzBranchHtml(html(data([branch(), branch(1), branch(2, 'AZ1234')])));
  assert.equal(result.observedBranchRows, 3);
  assert.equal(result.distinctPostcodes, 2);
  assert.equal(result.leadingZeroRows, 2);
  assert.equal(result.duplicatePostcodeGroups, 1);
  assert.equal(result.rowsInDuplicatePostcodeGroups, 2);
  assert.equal(result.postcodeUniqueWithinResponse, false);
  assert.equal(result.presentationIdsMatchRowIndexes, true);
  assert.equal(result.stableProviderObjectIdsVerified, false);
  assert.equal(result.emptyTypeRows, 3);
  assert.equal(result.postalRecordClassesVerified, false);
  assert.equal(result.streetEntries, 3);
  assert.equal(result.codeAndBasicRowChecksPassed, true);
  assert.match(result.responseDigest, /^sha256:[a-f0-9]{64}$/);
  assert.match(result.embeddedJsonDigest, /^sha256:[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(result).includes('SENTINEL'));
  assert.ok(!JSON.stringify(result).includes('1.1'));
  for (const key of ['currentAssignmentVerified', 'readyForAddressContextIngestion', 'spatialCoverageVerified', 'coordinateAccuracyVerified', 'responseIsRetainedSourceSnapshot']) assert.equal(result[key], false);
  for (const key of ['sourceEdition', 'validFrom', 'validTo', 'coordinateReferenceSystem']) assert.equal(result[key], null);
  for (const key of ['postalGeometryRecords', 'civicAddressesVerified', 'buildingLinksVerified']) assert.equal(result[key], 0);
});

test('AZ blank and malformed coordinates never silently become a valid origin or a location claim', () => {
  const pairs = [['', ''], ['', '2'], ['NaN', '2'], ['1e1', '2'], ['91', '2'], ['1', '-181'], ['0', '-0'], ['1', '2']];
  const input = pairs.map(([latitude, longitude], id) => ({ ...branch(id), coordinates: { latitude, longitude } }));
  assert.deepEqual(summarizeAzBranches(data(input)).coordinates, { missingBoth: 1, missingOne: 1, invalidDecimal: 2, outOfRange: 2, zeroPair: 1, rangeValid: 1 });
});

test('AZ provider code syntax and missing context fail the basic checks without repairing values', () => {
  const input = [branch(0, '0001'), branch(0, 'AZ 0001'), branch(2, 'AZ0001 '), { ...branch(3), title: '', city: '', region: '', address: '' }];
  const result = summarizeAzBranches(data(input));
  assert.equal(result.invalidPostcodeRows, 3);
  assert.equal(result.duplicatePresentationIdGroups, 1);
  assert.equal(result.missingOfficeAddressRows, 1);
  assert.equal(result.codeAndBasicRowChecksPassed, false);
  assert.throws(() => summarizeAzBranches(data([{ ...branch(), post_index: 1 }])), /branch-record-schema/);
  assert.equal(summarizeAzBranches(data([])).codeAndBasicRowChecksPassed, false);
});

test('AZ rejects unknown or changed branch, coordinate and street schemas', () => {
  for (const value of [null, {}, { ...data(), unexpected: true }, { ...data(), branches: {} }]) assert.throws(() => summarizeAzBranches(value), /branch-root-schema/);
  for (const row of [{ ...branch(), protected_field: 'DO NOT LEAK' }, { ...branch(), coordinates: null }, { ...branch(), id: -1 }, { ...branch(), coordinates: { latitude: 1, longitude: 2 } }]) assert.throws(() => summarizeAzBranches(data([row])), /branch-record-schema/);
  assert.throws(() => summarizeAzBranches(data([{ ...branch(), streets: [{ street_name: 'X', street_numbers: 1 }] }])), /branch-street-schema/);
  const result = summarizeAzBranches(data([{ ...branch(), streets: [{ street_name: '', street_numbers: ' ' }] }]));
  assert.equal(result.streetEntriesMissingName, 1);
  assert.equal(result.streetEntriesMissingNumbers, 1);
});

test('AZ input bytes, branches and street details have explicit bounds', () => {
  assert.throws(() => profileAzBranchHtml(Buffer.alloc(4194305)), /reference-byte-limit/);
  assert.throws(() => summarizeAzBranches(data(Array(10001).fill(branch()))), /branch-row-limit/);
  assert.throws(() => summarizeAzBranches(data([{ ...branch(), streets: Array(100001).fill({ street_name: '', street_numbers: '' }) }])), /branch-street-limit/);
  assert.throws(() => profileAzBranchHtml(Buffer.from([0xff])), /branch-invalid-utf8/);
});

test('AZ requires exactly one branches attribute, rejects scripts as JSON and decodes entities once', () => {
  assert.throws(() => profileAzBranchHtml(Buffer.from('<html>login</html>')), /branch-attribute-count/);
  assert.throws(() => profileAzBranchHtml(Buffer.concat([html(data()), html(data())])), /branch-attribute-count/);
  assert.throws(() => profileAzBranchHtml(Buffer.from('<x :branches="(()=>{throw 1})()"></x>')), /branch-json-invalid/);
  const double = html(data()).toString().replaceAll('&quot;', '&amp;quot;');
  assert.throws(() => profileAzBranchHtml(Buffer.from(double)), /branch-json-invalid/);
  const numericEntities = html(data()).toString().replaceAll('&quot;', '&#34;');
  assert.equal(profileAzBranchHtml(Buffer.from(numericEntities)).observedBranchRows, 1);
  const input = data([{ ...branch(), address: '&quot; nested text <script> must not run' }]);
  assert.equal(profileAzBranchHtml(html(input)).observedBranchRows, 1);
});

test('AZ reference access and document hashes do not become source data or rights', async () => {
  const result = await probeAzReference(reference, async () => response('<p>synthetic reference</p>'));
  assert.equal(result.status, 'reference-verified-not-data');
  assert.equal(result.sourceDataRecords, 0);
  assert.match(result.sourceDocumentDigest, /^sha256:[a-f0-9]{64}$/);
});

test('AZ rejects altered pinned PDF, login content, non-200 data, unapproved hosts and oversized responses', async () => {
  const pdf = { ...reference, mime: 'application/pdf', markers: [], expectedDigest: 'sha256:' + '0'.repeat(64) };
  assert.equal((await probeAzReference(pdf, async () => response('login'))).contentVerified, false);
  assert.equal((await probeAzReference(pdf, async () => new Response('%PDF-changed', { headers: { 'content-type': 'application/pdf' } }))).contentVerified, false);
  assert.equal((await probeAzReference(reference, async () => new Response('partial', { status: 206 }))).status, 'http-error');
  await assert.rejects(() => probeAzReference(reference, async () => new Response(null, { status: 302, headers: { location: 'https://unapproved.invalid/records' } })), /unapproved-reference-host/);
  await assert.rejects(() => probeAzReference({ ...reference, url: 'http://www.azerpost.az/' }), /unapproved-reference-host/);
  await assert.rejects(() => probeAzReference(reference, async () => new Response('x', { headers: { 'content-length': '4194305' } })), /reference-byte-limit/);
  await assert.rejects(() => probeAzReference(reference, async () => response(Buffer.alloc(4194305))), /reference-byte-limit/);
});

test('AZ fixed-scope review sanitizes errors and cannot claim M2 on network or TLS failures', async () => {
  const profile = JSON.parse(readFileSync(new URL('../data/postal_country_packs/az/postal-context/m2-source-review.json', import.meta.url)));
  const visited = [];
  const result = await inspectAzSources(async url => { visited.push(url); throw new Error('PRIVATE upstream error', { cause: { code: 'CERT_HAS_EXPIRED' } }); });
  assert.deepEqual(visited.sort(), [...profile.reference_probes.map(r => r.url), profile.branch_probe.url].sort());
  assert.equal(result.branchObservation.error, 'tls-certificate-expired');
  assert.ok(!JSON.stringify(result).includes('PRIVATE'));
  for (const key of ['countryM2Achieved', 'rightsForPublicTransformedArtifactsCleared', 'realAgidRuntimeVerified']) assert.equal(result[key], false);
  for (const key of ['sourceDataSnapshotsPersisted', 'publishedDataArtifacts']) assert.equal(result[key], 0);
});

test('AZ even a clean live branch response is not M2, geography or a civic-address/building dataset', async () => {
  const result = await inspectAzSources(async () => response(html(data())));
  assert.equal(result.branchObservation.status, 'branch-directory-observed-not-m2');
  assert.equal(result.branchObservation.validation.codeAndBasicRowChecksPassed, true);
  assert.equal(result.branchObservation.validation.readyForAddressContextIngestion, false);
  assert.equal(result.countryM2Achieved, false);
  assert.ok(!JSON.stringify(result).includes('SENTINEL'));
});

test('AZ successful HTTP with missing or changed branch data retains only a digest and fails closed', async () => {
  const result = await inspectAzSources(async () => response('<html>application changed</html>'));
  assert.equal(result.branchObservation.status, 'preflight-error');
  assert.equal(result.branchObservation.error, 'branch-attribute-count');
  assert.match(result.branchObservation.responseDigest, /^sha256:/);
  assert.equal(result.branchObservation.validation, undefined);
  assert.equal(result.countryM2Achieved, false);
});
