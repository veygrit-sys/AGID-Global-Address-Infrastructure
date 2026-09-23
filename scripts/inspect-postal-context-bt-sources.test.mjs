import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fetchBtDistrict, inspectBtSources, parseBtLocatorForm, parseBtLocatorTable, profileBtRows } from './inspect-postal-context-bt-sources.mjs';

const p = JSON.parse(readFileSync(new URL('../data/postal_country_packs/bt/postal-context/m2-source-review.json', import.meta.url)));
const b = text => Buffer.from(text);
const form = (action = 'searchpostcode-exec.php') => `<form action="${action}" method="post"><select name="dzongkhag"><option/>${p.locator_probe.reviewed_dzongkhag_options.map(d => '<option />' + d).join('')}</select><input type="submit" name="submit" value="Search"></form>`;
const header = '<tr>' + p.locator_probe.headers.map(h => '<th>' + h + '</th>').join('') + '</tr>';
const row = (district = 'Bumthang', code = '99999', office = 'Synthetic PO') => [district, 'Synthetic Gewog', office, code];
const cells = values => values.map(s => '<td>' + s + '</td>').join('');
const table = (rows, missingOpening = false) => '<table>' + header + rows.map((r, i) => (missingOpening && i ? '' : '<tr>') + cells(r) + '</tr>').join('') + '</table>';
const response = (text, extra = {}) => new Response(text, { headers: { 'content-type': 'text/html' }, ...extra });

test('BT form preserves every reviewed selector option without executing its legacy loginForm', () => {
  const result = parseBtLocatorForm(b(form()));
  assert.deepEqual(result.options, p.locator_probe.reviewed_dzongkhag_options);
  assert.equal(result.target, p.locator_probe.search_url);
  assert.equal(result.authenticationRequiredByReviewedForm, false);
  assert.deepEqual(parseBtLocatorForm(b(form('')), p.locator_probe.search_url), result);
});
test('BT changed form targets, controls and option sets stop before any search', () => {
  for (const f of [form('https://private.example/login'), form('http://bhutanpost.bt/postcode/searchpostcode-exec.php'),
    form().replace('method="post"', 'method="get"'), form().replace('Bumthang', 'Changed'),
    form().replace('</form>', '<input type="hidden" name="token" value="x"></form>'),
    form().replace('</form>', '<script>alert(1)</script></form>'), form() + form()]) assert.throws(() => parseBtLocatorForm(b(f)), /bt-form/);
});
test('BT ambiguous duplicate attributes and option values fail closed', () => {
  assert.throws(() => parseBtLocatorForm(b(form().replace('method="post"', 'method="post" method="get"'))), /attribute/);
  assert.throws(() => parseBtLocatorForm(b(form().replace('<option />Bumthang', '<option value="private">Bumthang'))), /options/);
});
test('BT parser preserves leading-zero postcode strings and non-geometric source grain', () => {
  const result = parseBtLocatorTable(b(table([row('Bumthang', '00001')])), 'Bumthang');
  assert.equal(result.rows[0][3], '00001');
  assert.equal(result.validation.invalidPostcodeRows, 0);
  assert.equal(result.validation.geometryType, 'none');
  assert.equal(result.validation.exactBuildingRelations, 0);
});
test('BT actual template defect and duplicate tuples are counted, never repaired', () => {
  const result = parseBtLocatorTable(b(table([row(), row()], true)), 'Bumthang');
  assert.equal(result.structure.rowsMissingOpeningTag, 1);
  assert.equal(result.structure.explicitRowStructureValid, false);
  assert.equal(result.validation.exactDuplicateGroups, 1);
  assert.equal(result.validation.excessExactDuplicateRows, 1);
  assert.equal(result.validation.exactDuplicateExcessRate, 0.5);
  assert.equal(result.validation.rowsDeduplicated, 0);
});
test('BT normal tables retain explicit structure checks', () => {
  const result = parseBtLocatorTable(b(table([row()])), 'Bumthang');
  assert.equal(result.structure.explicitRowStructureValid, true);
  assert.equal(result.validation.currentNationalCoverageVerified, false);
});
test('BT changed headers, extra data columns, spans and nested tags fail closed', () => {
  for (const html of [table([row()]).replace('Postal Code', 'House Number'), table([row()]).replace('</tr></table>', '<td>private</td></tr></table>'),
    table([row()]).replace('<td>', '<td colspan="2">'), table([row()]).replace('Synthetic Gewog', '<span>Synthetic Gewog</span>'),
    table([row()]).replace('99999', '<script>99999</script>'), table([row()]) + table([row()])]) assert.throws(() => parseBtLocatorTable(b(html), 'Bumthang'), /bt-/);
});
test('BT missing cells and a partial final row cannot silently disappear', () => {
  assert.throws(() => parseBtLocatorTable(b(table([row()]).replace('<td>99999</td>', '')), 'Bumthang'), /row-schema/);
  assert.throws(() => parseBtLocatorTable(b(table([row()]).replace('</table>', '<tr><td>partial</td></table>')), 'Bumthang'), /partial-row/);
});
test('BT empty result is not evidence of no postal assignments', () => {
  const result = parseBtLocatorTable(b('<table>' + header + '<tr></table>'), 'Bumthang');
  assert.equal(result.validation.observedRows, 0);
  assert.equal(result.structure.danglingEmptyOpeningRow, 1);
  assert.equal(result.validation.currentNationalCoverageVerified, false);
});
test('BT UTF-8, entity and row limits reject malformed or excessive input', () => {
  assert.throws(() => parseBtLocatorTable(Buffer.from([0xff]), 'Bumthang'), /utf8/);
  for (const value of ['&#0;', '&#xD800;', '&#1114112;', '&unknown;']) assert.throws(() => parseBtLocatorTable(b(table([row('Bumthang', '99999', value)])), 'Bumthang'), /entity/);
  assert.throws(() => parseBtLocatorTable(b(table(Array.from({ length: 1001 }, () => row()))), 'Bumthang'), /row-limit/);
  assert.throws(() => parseBtLocatorTable(Buffer.alloc(4194305), 'Bumthang'), /byte-limit/);
});
test('BT explicit entities decode once without introducing HTML or evaluation', () => {
  const r = parseBtLocatorTable(b(table([row('Bumthang', '99999', 'Synthetic &amp; &#x41; PO')])), 'Bumthang');
  assert.equal(r.rows[0][2], 'Synthetic & A PO');
});
test('BT missing fields, invalid codes and cross-district results remain explicit exceptions', () => {
  const q = profileBtRows([['Gasa', '', '', '９９９９９'], row('Bumthang', '1234'), row('Bumthang', '')], 'Bumthang');
  assert.equal(q.invalidPostcodeRows, 2); assert.equal(q.districtMismatchRows, 1);
  assert.equal(q.missingFieldRows.Gewog, 1); assert.equal(q.missingFieldRows['Post Office'], 1); assert.equal(q.missingFieldRows['Postal Code'], 1);
  assert.equal(q.postcodesInferred, 0); assert.equal(q.labelsCorrected, 0);
  assert.throws(() => profileBtRows([['Bumthang', 'Synthetic', 'Synthetic PO', 99999]]), /row-schema/);
});
test('BT postcode reuse across offices is not a unique office ID or a duplicate to drop', () => {
  const q = profileBtRows([row(), row('Bumthang', '99999', 'Synthetic Other CC'), row()]);
  assert.equal(q.distinctPostcodes, 1); assert.equal(q.distinctOfficeTuples, 2);
  assert.equal(q.postcodesWithMultipleOfficeTuples, 1); assert.equal(q.excessExactDuplicateRows, 1);
  assert.equal(q.stableRecordIdentityVerified, false);
});
test('BT POST is restricted to one read-only endpoint and two explicit non-personal fields', async () => {
  const r = await fetchBtDistrict('Bumthang', async (url, init) => {
    assert.equal(url, p.locator_probe.search_url); assert.equal(init.method, 'POST'); assert.equal(init.redirect, 'manual');
    assert.equal(init.credentials, 'omit'); assert.deepEqual(Object.keys(init.headers), ['Content-Type']);
    assert.equal(init.body, 'dzongkhag=Bumthang&submit=Search'); return response('ok');
  });
  assert.equal(r.metadata.redirectsFollowed, 0); assert.match(r.metadata.responseDigest, /^sha256:[a-f0-9]{64}$/);
  await assert.rejects(fetchBtDistrict('Unknown', () => { throw new Error('must not call'); }), /bt-district/);
});
test('BT POST never follows login or other redirects and rejects non-HTML responses', async () => {
  for (const res of [new Response(null, { status: 302, headers: { location: 'https://private.example/' } }), new Response(null, { status: 403 }),
    new Response('{}', { headers: { 'content-type': 'application/json' } }), new Response('fake', { headers: { 'content-type': 'text/htmlish' } })]) {
    let calls = 0; await assert.rejects(fetchBtDistrict('Bumthang', async () => { calls++; return res; }), /http-or-mime/); assert.equal(calls, 1);
  }
});
test('BT POST caps declared and streamed bytes and rejects empty replies', async () => {
  await assert.rejects(fetchBtDistrict('Bumthang', async () => response('small', { headers: { 'content-type': 'text/html', 'content-length': '4194305' } })), /byte-limit/);
  await assert.rejects(fetchBtDistrict('Bumthang', async () => response(Buffer.alloc(4194305))), /byte-limit/);
  await assert.rejects(fetchBtDistrict('Bumthang', async () => response('')), /empty-response/);
});
const fakeFetch = (failureDistrict = null, formDrift = false) => async (url, init) => {
  if (init.method === 'POST') {
    const district = new URLSearchParams(init.body).get('dzongkhag');
    if (district === failureDistrict) return response('unavailable', { status: 503 });
    return response(form('') + table([row(district), row(district)], true));
  }
  if (url === p.locator_probe.form_url) return response(formDrift ? form().replace('Bumthang', 'Changed') : form());
  const probe = p.reference_probes.find(r => r.url === url);
  return probe.mime === 'application/pdf' ? new Response('%PDF-synthetic', { headers: { 'content-type': 'application/pdf' } }) : response(probe.markers.join(' '));
};
test('BT full mocked traversal keeps hashes and aggregates without publishing data or claiming M2', async () => {
  const result = await inspectBtSources(fakeFetch());
  assert.equal(result.locatorObservation.observedDistricts, 20); assert.equal(result.locatorObservation.aggregate.observedRows, 40);
  assert.equal(result.locatorObservation.allReviewedDistrictRequestsSucceeded, true);
  assert.equal(result.locatorObservation.districtFormsUnchanged, true);
  assert.equal(result.locatorObservation.repeatedDistrict.byteIdenticalToFirstResponse, true);
  assert.equal(result.locatorObservation.atomicSnapshotVerified, false);
  assert.equal(result.locatorObservation.explicitTableStructureValid, false);
  for (const key of ['countryM2Achieved', 'realAgidRuntimeVerified', 'rightsForPublicM2ArtifactCleared', 'authenticationPerformed', 'privateQueriesPerformed']) assert.equal(result[key], false);
  assert.equal(result.locatorObservation.sourceRowsPersisted, 0); assert.equal(result.publishedDataArtifacts, 0);
  assert.ok(!JSON.stringify(result).includes('Synthetic Gewog')); assert.ok(!JSON.stringify(result).includes('99999'));
});
test('BT one unavailable district cannot count as a complete traversal', async () => {
  const result = await inspectBtSources(fakeFetch('Haa'));
  assert.equal(result.locatorObservation.observedDistricts, 19); assert.equal(result.locatorObservation.allReviewedDistrictRequestsSucceeded, false);
  assert.equal(result.countryM2Achieved, false);
});
test('BT form drift prevents all search POSTs and never clears reuse rights', async () => {
  let posts = 0; const fake = fakeFetch(null, true);
  const result = await inspectBtSources((url, init) => { if (init.method === 'POST') posts++; return fake(url, init); });
  assert.equal(posts, 0); assert.equal(result.locatorObservation.observedDistricts, 0);
  assert.equal(result.locatorObservation.districts[0].error, 'bt-form-options-drift'); assert.equal(result.rightsForPublicM2ArtifactCleared, false);
});
