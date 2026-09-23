import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fetchCnOutletPage, inspectCnPageContract, inspectCnSources, parseCnOutletResponse, profileCnOutlets } from './inspect-postal-context-cn-sources.mjs';

const p = JSON.parse(readFileSync(new URL('../data/postal_country_packs/cn/postal-context/m2-source-review.json', import.meta.url)));
const l = p.locator_probe;
const row = (i = 0) => ({ ...Object.fromEntries(l.row_string_fields.map(k => [k, ''])),
  ...Object.fromEntries(l.row_integer_fields.map(k => [k, 0])), dayFlags: Array(7).fill(false),
  province: 'Synthetic province', cities: 'Synthetic city', county: 'Synthetic county', sitename: 'Synthetic office ' + i,
  zipcode: '000001', address: 'SENTINEL_ADDRESS_NOT_TO_RETAIN', phone: 'SENTINEL_PHONE_NOT_TO_RETAIN' });
const envelope = (page = 1, total = 20) => ({ code: 0, success: true, page, size: 10, total,
  list: Array.from({ length: Math.max(0, Math.min(10, total - (page - 1) * 10)) }, (_, i) => row(i + (page - 1) * 10)) });
const bytes = value => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value));
const response = (value, mime = 'text/json', extra = {}) => new Response(bytes(value), { headers: { 'content-type': mime }, ...extra });
const validHtml = l.page_markers.join('\n');
const mockFetch = (change = () => {}) => async (url, options = {}) => {
  const override = change(url, options); if (override) return override;
  if (url === l.page_url) return response(validHtml, 'text/html');
  if (url === l.search_url) return response(envelope(Number(new URLSearchParams(options.body).get('page'))));
  const reference = p.reference_probes.find(r => r.url === url); assert.ok(reference, 'unreviewed URL');
  return response(reference.markers.join(' '), 'text/html');
};

test('CN page contract checks reviewed markers without executing provider JavaScript', () => {
  assert.deepEqual(inspectCnPageContract(bytes(validHtml)), { reviewedMarkersPresent: true, javascriptExecuted: false, endpointDerivedFromUntrustedInput: false });
  for (const marker of l.page_markers) assert.throws(() => inspectCnPageContract(bytes(validHtml.replace(marker, 'changed'))), /contract-drift/);
});

test('CN preserves leading-zero code strings while discarding addresses and contacts immediately', () => {
  const result = parseCnOutletResponse(bytes(envelope()), 1);
  assert.equal(result.rows[0].code, '000001'); assert.equal(result.rows[0].addressPresent, true);
  assert.ok(!JSON.stringify(result).includes('SENTINEL_'));
  const q = profileCnOutlets(result.rows);
  assert.equal(q.observedRows, 10); assert.equal(q.distinctPostcodes, 1); assert.equal(q.distinctOfficeLabelTuples, 10);
  assert.equal(q.postcodesSharedByDifferentOfficeLabels, 1); assert.equal(q.geometryType, 'none');
});

test('CN malformed UTF-8 and JSON fail without echoing source contents', () => {
  assert.throws(() => parseCnOutletResponse(Buffer.from([0xff]), 1), /^Error: cn-invalid-utf8$/);
  assert.throws(() => parseCnOutletResponse(bytes('{PRIVATE_CONTENT'), 1), /^Error: cn-invalid-json$/);
  assert.throws(() => parseCnOutletResponse(bytes(null), 1), /response-schema/);
});

test('CN changes in envelope keys, success, pagination or types cannot pass as observed data', () => {
  for (const mutate of [j => { j.code = 1; }, j => { j.success = 'true'; }, j => { j.page = 2; },
    j => { j.size = 100; }, j => { j.total = -1; }, j => { j.total = 1.5; }, j => { j.total = '20'; },
    j => { j.total = 10000001; }, j => { j.extra = 'unexpected'; }, j => { delete j.total; }]) {
    const j = envelope(); mutate(j); assert.throws(() => parseCnOutletResponse(bytes(j), 1), /response-schema/);
  }
});

test('CN non-reviewed pages are refused before any HTTP request', async () => {
  for (const page of [0, 3, '1', 1.1, 5464]) {
    assert.throws(() => parseCnOutletResponse(bytes(envelope()), page), /page-not-reviewed/);
    await assert.rejects(fetchCnOutletPage(page, () => assert.fail('unexpected network')), /page-not-reviewed/);
  }
});

test('CN reported page length is reconciled including an empty directory and partial last page', () => {
  assert.equal(parseCnOutletResponse(bytes(envelope(2, 14)), 2).rows.length, 4);
  assert.equal(parseCnOutletResponse(bytes(envelope(1, 0)), 1).rows.length, 0);
  const j = envelope(); j.list.pop(); assert.throws(() => parseCnOutletResponse(bytes(j), 1), /page-length/);
  j.list.push(row(), row()); assert.throws(() => parseCnOutletResponse(bytes(j), 1), /page-length/);
});

test('CN schema rejects new geometry/private fields, missing fields and non-string codes', () => {
  for (const mutate of [r => { r.geometry = {}; }, r => { r.owner = 'private'; }, r => { delete r.phone; },
    r => { r.zipcode = 1; }, r => { r.address = null; }, r => { r.phone = {}; }, r => { r.state = 0.5; },
    r => { r.dayFlags = [true]; }, r => { r.dayFlags[0] = 1; }, r => { r.sitename = 'x'.repeat(2001); }, r => { r.phone = '\u0000'; }]) {
    const j = envelope(); mutate(j.list[0]); assert.throws(() => parseCnOutletResponse(bytes(j), 1), /row-schema/);
  }
});

test('CN duplicate label tuples and missing fields are counted rather than silently corrected', () => {
  const j = envelope(1, 2); j.list[1] = structuredClone(j.list[0]);
  for (const r of j.list) { r.county = ''; r.address = ''; }
  const q = profileCnOutlets(parseCnOutletResponse(bytes(j), 1).rows);
  assert.equal(q.excessDuplicateComparisonRows, 1); assert.equal(q.duplicateComparisonExcessRate, 0.5);
  assert.equal(q.missingFieldRows.county, 2); assert.equal(q.missingFieldRates.address, 1); assert.equal(q.rowsDeduplicated, 0);
});

test('CN invalid and whitespace-padded postcode strings are profiled but never repaired', () => {
  const j = envelope(1, 3); j.list[0].zipcode = 'CN-000001'; j.list[1].zipcode = ' 000001 '; j.list[2].zipcode = '';
  const parsed = parseCnOutletResponse(bytes(j), 1), q = profileCnOutlets(parsed.rows);
  assert.equal(parsed.rows[1].code, ' 000001 '); assert.equal(q.invalidPostcodeRows, 1);
  assert.equal(q.invalidPostcodeRate, 1 / 3); assert.equal(q.noncanonicalPostcodeRows, 1); assert.equal(q.missingFieldRows.zipcode, 1);
  assert.equal(q.postcodesInferred, 0);
});

test('CN service suspension/resumption fields are not postal validity or building relations', () => {
  const j = envelope(1, 1); j.list[0].ztstop = 'SYNTHETIC_DATE'; j.list[0].hfstart = 'SYNTHETIC_DATE';
  const q = profileCnOutlets(parseCnOutletResponse(bytes(j), 1).rows);
  assert.equal(q.serviceSuspensionLabelRows, 1); assert.equal(q.serviceResumptionLabelRows, 1);
  assert.equal(q.serviceDatesArePostalValidity, false); assert.equal(q.sourceAssignmentEdition, null);
  assert.equal(q.civicAddressRelations, 0); assert.equal(q.exactBuildingRelations, 0); assert.equal(q.postalGeometryRecords, 0);
});

test('CN empty and oversized aggregate inputs do not imply national completeness', () => {
  assert.equal(profileCnOutlets([]).missingFieldRates.zipcode, null);
  assert.equal(profileCnOutlets([]).currentNationalCoverageVerified, false);
  assert.throws(() => profileCnOutlets(Array(21).fill({})), /profile-limit/);
  assert.throws(() => profileCnOutlets([{}]), /profile-row/);
});

test('CN HTTP uses only fixed read-only public-search fields without cookies or redirects', async () => {
  let calls = 0;
  const result = await fetchCnOutletPage(1, async (url, options) => {
    calls++; assert.equal(url, l.search_url); assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'manual'); assert.equal(options.credentials, 'omit');
    assert.deepEqual(options.headers, { 'Content-Type': 'application/x-www-form-urlencoded' });
    assert.deepEqual(Object.fromEntries(new URLSearchParams(options.body)), { act: 'list', page: '1', size: '10', community: 'ChinaPostJT' });
    return response(envelope());
  });
  assert.equal(calls, 1); assert.match(result.observation.responseDigest, /^sha256:[0-9a-f]{64}$/);
  assert.ok(!JSON.stringify(result).includes('SENTINEL_'));
});

test('CN non-success HTTP, redirects and unexpected MIME fail closed', async () => {
  for (const make of [() => response(envelope(), 'text/html'), () => response(envelope(), 'application/json'),
    () => response(envelope(), 'text/json', { status: 401 }), () => new Response(null, { status: 302, headers: { location: 'https://private.invalid/' } }),
    () => new Response(null, { status: 204 })]) await assert.rejects(fetchCnOutletPage(1, async () => make()), /search-http-or-mime/);
});

test('CN byte limits apply to declared and streamed content, as well as parser inputs', async () => {
  const large = Buffer.alloc(p.limits.max_response_bytes + 1, 32);
  await assert.rejects(fetchCnOutletPage(1, async () => new Response('{}', { headers: { 'content-type': 'text/json', 'content-length': String(large.length) } })), /byte-limit/);
  await assert.rejects(fetchCnOutletPage(1, async () => response(large.toString())), /byte-limit/);
  assert.throws(() => parseCnOutletResponse(large, 1), /byte-limit/);
});

test('CN inspector keeps a bounded sample and repeated page separate from national coverage', async () => {
  let posts = 0;
  const r = await inspectCnSources(mockFetch(url => { if (url === l.search_url) posts++; }));
  const q = r.locatorObservation;
  assert.equal(posts, 3); assert.equal(q.aggregate.observedRows, 20); assert.equal(q.successfulPages, 2);
  assert.equal(q.repeatedPage.byteIdenticalToFirstResponse, true); assert.equal(q.reportedTotalsAgree, true);
  assert.equal(q.fractionIsNationalPostalCoverage, false); assert.equal(q.atomicSnapshotVerified, false);
  assert.equal(q.sourceRowsPersisted, 0); assert.ok(!JSON.stringify(r).includes('SENTINEL_'));
  for (const flag of ['countryM2Achieved', 'realAgidRuntimeVerified', 'rightsForPublicM2ArtifactCleared', 'authenticationPerformed', 'privateQueriesPerformed', 'contractAcceptancePerformed']) assert.equal(r[flag], false);
});

test('CN changed page contract stops before querying the API', async () => {
  const r = await inspectCnSources(mockFetch(url => {
    if (url === l.search_url) assert.fail('unexpected POST');
    if (url === l.page_url) return response('changed UI', 'text/html');
  }));
  assert.equal(r.locatorObservation.successfulPages, 0);
  assert.equal(r.locatorObservation.pages[0].error, 'cn-page-contract-drift');
});

test('CN drift in total or repeated body is visible and never repaired into an atomic edition', async () => {
  let posts = 0;
  const r = await inspectCnSources(mockFetch((url, options) => {
    if (url !== l.search_url) return;
    posts++; const j = envelope(Number(new URLSearchParams(options.body).get('page')), posts === 1 ? 20 : 21);
    if (posts === 3) j.list[0].phone = 'CHANGED_PRIVATE_CONTACT';
    return response(j);
  }));
  assert.equal(r.locatorObservation.reportedTotalsAgree, false);
  assert.equal(r.locatorObservation.repeatedPage.byteIdenticalToFirstResponse, false);
  assert.equal(r.locatorObservation.atomicSnapshotVerified, false);
  assert.ok(!JSON.stringify(r).includes('CHANGED_PRIVATE_CONTACT'));
});

test('CN errors and unexpected reference pages are recorded without leaking response contents', async () => {
  const first = p.reference_probes[0].url;
  const r = await inspectCnSources(mockFetch(url => {
    if (url === first) return response('unrelated document', 'text/html');
    if (url === l.search_url) throw new Error('PRIVATE_NETWORK_CONTENT');
  }));
  assert.equal(r.references[0].contentVerified, false);
  assert.equal(r.locatorObservation.pages[0].error, 'network-or-parser-error');
  assert.ok(!JSON.stringify(r).includes('PRIVATE_NETWORK_CONTENT')); assert.equal(r.countryM2Achieved, false);
});
