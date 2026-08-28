import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { inspectIdSources, profileIdCatalog, profileIdPostalResult, profileIdSearchForm } from './inspect-postal-context-id-sources.mjs';
const P = JSON.parse(readFileSync(new URL('../data/postal_country_packs/id/postal-context/m2-source-review.json', import.meta.url)));
const form = `<form action="${P.postal_probe.search_url}" method="post"><input type="text" name="kodepos"></form><p>All Rights Reserved</p>`;
const row = (ordinal = '1', code = '10000', village = 'SYNTHETIC VILLAGE') => [ordinal, code, village, 'SYNTHETIC DISTRICT', 'SYNTHETIC CITY', 'SYNTHETIC PROVINCE'];
const table = (rows = [row()]) => `<table id="list-data"><thead><tr>${P.postal_probe.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const sample = () => ({ id: P.catalog_probe.dataset_id, name: P.catalog_probe.dataset_name, organization: { title: P.catalog_probe.provider },
  isopen: false, private: true, license_title: null, extras: [{ key: 'review_status', value: 'rejected' }],
  metadata_created: '2024-01-01T00:00:00.123456', metadata_modified: '2024-12-01T00:00:00',
  num_resources: 1, resources: [{ url: 'https://restricted.invalid/do-not-follow', private: true }],
  creator_profile: { apikey: 'SYNTHETIC-SECRET-DO-NOT-RETURN', email: 'synthetic@example.invalid' } });
const catalog = (value = sample(), extra = '') => `<p>Terbuka</p><p>${P.catalog_probe.review_notice}</p><script>self.__next_f.push(${JSON.stringify([1, 'a:T5,hello' + JSON.stringify({ response: value }) + extra])})</script>`;
const bytes = s => Buffer.from(s);
const html = s => new Response(s, { headers: { 'content-type': 'text/html; charset=UTF-8' } });

test('ID search uses only the reviewed anonymous form and ignores commented download navigation', () => {
  const p = profileIdSearchForm(bytes(form + '<!--<a href="/CariKodepos/download">Download</a>-->'));
  assert.equal(p.publicFormVerified, true); assert.equal(p.rightsReservedMarkerPresent, true);
  assert.equal(p.activeDownloadLinkPresent, false); assert.equal(p.redistributionRightsCleared, false);
  for (const h of [form + form, form.replace('method="post"', 'method="get"'), form.replace('CariKodepos', 'restricted'), form.replace('</form>', '<input type="password"></form>')]) assert.throws(() => profileIdSearchForm(bytes(h)), /id-form/);
});

test('ID keeps postcode-to-locality multiplicity and duplicate tuples separate', () => {
  const p = profileIdPostalResult(bytes(table([row(), row('2', '10000', 'SECOND SYNTHETIC VILLAGE'), row('3', '10001'), row('4')])));
  assert.equal(p.observedRows, 4); assert.equal(p.distinctValidCodes, 2); assert.equal(p.distinctLocalityTuples, 2);
  assert.equal(p.codesWithMultipleLocalityTuples, 1); assert.equal(p.localityTuplesWithMultipleCodes, 1);
  assert.equal(p.excessDuplicateTupleRows, 1); assert.equal(p.excessDuplicateTupleRate, 0.25);
  assert.equal(p.observedShapeValid, true); assert.equal(p.geometryType, 'none');
  for (const key of ['geometryRecords', 'civicAddressRelations', 'exactBuildingRelations', 'coordinateRecords', 'sourceRowsPersisted', 'deduplicatedRows', 'inferredCodes']) assert.equal(p[key], 0);
  assert.equal(p.stableRecordIdentityVerified, false); assert.equal(p.currentNationalCoverageVerified, false); assert.equal(p.assignmentValidity, null);
  assert.ok(!JSON.stringify(p).includes('SYNTHETIC VILLAGE'));
});

test('ID detects missing/invalid codes and locality fields without coercion or repair', () => {
  const p = profileIdPostalResult(bytes(table([row('1', ''), row('2', '01234'), row('3', 'ID-10000'), row('4', '10000', '')])));
  assert.equal(p.missingCodeRows, 1); assert.equal(p.invalidCodeRows, 2); assert.equal(p.incompleteLocalityRows, 1); assert.equal(p.observedShapeValid, false);
  assert.equal(p.missingCodeRate, 0.25); assert.equal(p.invalidCodeRate, 0.5);
});

test('ID comparison ignores table order and ordinal but preserves duplicates and labels', () => {
  const a = row(), b = row('2', '10001', 'SECOND');
  const digest = rows => profileIdPostalResult(bytes(table(rows))).normalizedTupleMultisetDigest;
  assert.equal(digest([a, b]), digest([[...b].map((v, i) => i ? v : '1'), [...a].map((v, i) => i ? v : '2')]));
  assert.notEqual(digest([a, b]), digest([a, b, row('3')]));
  assert.equal(profileIdPostalResult(bytes(table([a, a]))).repeatedDisplayOrdinals, 1);
});

test('ID fails closed on table drift, active markup, unsupported entities and unexpected encodings', () => {
  for (const s of [table().replace('Kodepos', 'Postal'), table() + table(), table([row().slice(0, 5)]), table([row('1', '10000', '<b>name</b>')]), table([row('1', '10000', '&unknown;')]), table([]), table().replace('</tbody>', '<script>alert(1)</script></tbody>'), table([row('0')])]) assert.throws(() => profileIdPostalResult(bytes(s)), /id-/);
  assert.throws(() => profileIdPostalResult(Buffer.from([0xc0, 0xaf])), /id-invalid-utf8/);
  assert.throws(() => profileIdPostalResult(Buffer.alloc(P.limits.max_response_bytes + 1)), /id-byte-limit/);
  assert.throws(() => profileIdPostalResult(bytes(table(Array.from({ length: 501 }, (_, i) => row(String(i + 1)))))), /id-result-rows/);
});

test('ID recognizes restricted catalog flags despite the public label and emits only allowed metadata', () => {
  const p = profileIdCatalog(bytes(catalog()));
  assert.equal(p.declaredPrivate, true); assert.equal(p.declaredOpen, false); assert.equal(p.declaredLicenseTitle, null);
  assert.equal(p.reviewStatus, 'rejected'); assert.equal(p.publicLabelConflictsWithAccessFlags, true); assert.equal(p.reviewNoticePresent, true);
  assert.equal(p.metadataTimestampTimezone, 'not-stated'); assert.equal(p.assignmentEdition, null); assert.equal(p.bulkResourceRequests, 0);
  assert.deepEqual(Object.keys(p).sort(), [...P.catalog_probe.allowed_output_fields].sort());
  for (const secret of ['SYNTHETIC-SECRET', 'example.invalid', 'restricted.invalid', 'apikey', 'creator_profile']) assert.ok(!JSON.stringify(p).includes(secret));
});

test('ID catalog open/license metadata alone can never clear rights or current coverage', () => {
  const p = profileIdCatalog(bytes(catalog({ ...sample(), private: false, isopen: true, license_title: 'SYNTHETIC-LICENSE', extras: [{ key: 'review_status', value: 'approved' }] })));
  assert.equal(p.publicLabelConflictsWithAccessFlags, false); assert.equal(p.redistributionRightsCleared, false); assert.equal(p.currentNationalCoverageVerified, false);
});

test('ID catalog rejects ambiguous identity, missing rights flags, malformed JSON and duplicate responses', () => {
  for (const data of [{ ...sample(), id: 'wrong' }, { ...sample(), private: 'false' }, { ...sample(), license_title: undefined }, { ...sample(), num_resources: 2 }, { ...sample(), extras: [] }, { ...sample(), metadata_modified: 'today' }]) assert.throws(() => profileIdCatalog(bytes(catalog(data))), /id-catalog/);
  assert.throws(() => profileIdCatalog(bytes(catalog(sample(), JSON.stringify({ response: sample() })))), /id-catalog-response-count/);
  assert.throws(() => profileIdCatalog(bytes('<script>self.__next_f.push([1,not-json])</script>')), /id-catalog-stream/);
});

test('ID inspector limits public search to three requests, never follows catalog resources and reports repeat provenance', async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    if (url === P.postal_probe.form_url) return html(form);
    if (url === P.postal_probe.search_url) return html(table());
    if (url === P.catalog_probe.url) return html(catalog());
    if (url === P.catalog_probe.publisher_url) return new Response(null, { status: 403 });
    throw new Error('unexpected-request');
  };
  const r = await inspectIdSources(fetcher), searches = calls.filter(c => c.options.method === 'POST');
  assert.equal(searches.length, P.limits.max_postal_search_requests);
  assert.deepEqual(searches.map(s => new URLSearchParams(s.options.body).get('kodepos')), ['40111', 'Menteng', 'Menteng']);
  assert.ok(searches.every(s => s.options.redirect === 'manual' && s.options.credentials === 'omit' && !('Cookie' in s.options.headers)));
  assert.equal(calls.length, 6); assert.equal(r.publisher.httpStatus, 403); assert.equal(r.publisher.responseDigest, null);
  assert.equal(r.repeat.byteIdentical, true); assert.equal(r.repeat.tupleMultisetIdentical, true); assert.equal(r.repeat.atomicOrNationalSnapshotVerified, false);
  assert.equal(r.countryM2Achieved, false); assert.equal(r.realAgidRuntimeVerified, false); assert.equal(r.embeddedAccountFieldsPersisted, false);
  assert.ok(!JSON.stringify(r).includes('SYNTHETIC-SECRET'));
});

test('ID does not follow search redirects or echo network exception content', async () => {
  let posts = 0;
  const r = await inspectIdSources(async (url, options) => {
    if (url === P.postal_probe.form_url) return html(form);
    if (options.method === 'POST') { posts++; return new Response(null, { status: 302, headers: { location: 'https://restricted.invalid/' } }); }
    throw new Error('SYNTHETIC-SECRET-DO-NOT-RETURN');
  });
  assert.equal(posts, 1); assert.equal(r.postalSearch[0].error, 'id-search-status-or-mime'); assert.ok(!JSON.stringify(r).includes('SYNTHETIC-SECRET'));
});

test('ID refuses unapproved reference redirects and skips searching after a form error', async () => {
  const calls = [];
  const r = await inspectIdSources(async url => { calls.push(url); return new Response(null, { status: 302, headers: { location: 'https://restricted.invalid/' } }); });
  assert.equal(calls.length, 3); assert.equal(r.postalSearch.length, 0); assert.equal(r.countryM2Achieved, false);
});
