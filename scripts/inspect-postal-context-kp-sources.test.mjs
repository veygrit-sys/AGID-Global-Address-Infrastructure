import assert from 'node:assert/strict';
import { test } from 'node:test';
import { config, inspectKpSources, kpFailure, profileKpReference } from './inspect-postal-context-kp-sources.mjs';
import { sourceDigest } from './lib/postal-context-source-probe.mjs';
const ref = id => config.references.find(r => r.id === id);
const member = '<section class="member-countries-detail"><span class="member-countries-value">Dem. People&#39;s Rep. of Korea</span><span class="member-countries-value">KP</span><span class="member-countries-value">06.06.1974</span></section>';
const copyright = '<div class="fr-view">' + ref('copyright').markers.join(' ') + '</div>';
const portal = '<main>' + ref('portal').markers.join(' ') + '</main>';
test('KP PDF checksum binds a selected-page review; changed bytes and HTML never inherit it', () => {
  const bytes = Buffer.from('%PDF-synthetic-unit-test-not-source-data');
  const synthetic = { ...ref('general'), expected_digest: sourceDigest(bytes) };
  const ok = profileKpReference(bytes, synthetic, 'application/pdf');
  assert.equal(ok.contentVerified, true);
  assert.equal(ok.kpTableEdition, 'Sep. 2025');
  assert.equal(ok.otherRequiredCodeTableEdition, 'Aug. 2026');
  assert.equal(ok.currentNationalFrameworkVerified, false);
  assert.equal(ok.permanentAbsenceInferred, false);
  assert.equal(ok.sourceDataRecords, 0);
  for (const value of [bytes, Buffer.from('<html>not a PDF</html>')]) {
    const rejected = profileKpReference(value, ref('general'), 'application/pdf');
    assert.equal(rejected.contentVerified, false); assert.equal(rejected.kpTableEdition, null);
  }
  assert.equal(profileKpReference(bytes, synthetic, 'text/html').status, 'unexpected-mime');
});
test('KP member proof needs the actual country-detail section and cannot accept KR or navigation', () => {
  assert.equal(profileKpReference(Buffer.from(member), ref('member'), 'text/html; charset=utf-8').contentVerified, true);
  for (const html of [member.replace('>KP<', '>KR<'), '<nav>'+member+'</nav>', member+member, '<script>'+member+'</script>']) {
    assert.equal(profileKpReference(Buffer.from(html), ref('member'), 'text/html').contentVerified, false);
  }
});
test('KP rights and discovery checks reject empty, navigation-only and changed reference bodies', () => {
  for (const [id, html] of [['copyright', copyright], ['portal', portal]]) {
    assert.equal(profileKpReference(Buffer.from(html), ref(id), 'text/html').contentVerified, true);
    for (const bad of ['<html>404</html>', '<nav>'+html+'</nav>', '<!--'+html+'-->', html.replace(ref(id).markers[0], '')]) {
      assert.equal(profileKpReference(Buffer.from(bad), ref(id), 'text/html').contentVerified, false);
    }
  }
});
test('KP successful references cannot become M2 data, coverage percentages or real runtime proof', async () => {
  const calls = [];
  const report = await inspectKpSources(async (url, options) => {
    calls.push(url); assert.equal(options.redirect, 'manual'); assert.equal(options.headers, undefined);
    const id = config.references.find(r => r.url === url).id;
    return new Response(id === 'member' ? member : id === 'copyright' ? copyright : id === 'portal' ? portal : '%PDF-synthetic', { headers: { 'content-type': ref(id).mime } });
  });
  assert.equal(calls.length, 4); assert.equal(report.references.filter(r => r.contentVerified).length, 3);
  assert.equal(report.countryM2Achieved, false); assert.equal(report.realAgidRuntimeVerified, false);
  assert.equal(report.currentAssignmentRowsValidated, 0); assert.equal(report.assignmentQuality.missingCodeRate, null);
  assert.equal(report.sourceRowsPersisted, 0); assert.equal(report.publishedDataArtifacts, 0);
});
test('KP HTTP failures and off-host redirects are not digested as documents', async () => {
  const failed = await inspectKpSources(async () => new Response('not-source', { status: 503 }));
  for (const r of failed.references) { assert.equal(r.httpStatus, 503); assert.equal(r.sourceDocumentDigest, null); assert.equal(r.responseDigest, null); }
  let calls = 0;
  const redirected = await inspectKpSources(async () => { calls++; return new Response(null, { status: 302, headers: { location: 'https://unapproved.invalid/source' } }); });
  assert.equal(calls, 4); assert.ok(redirected.references.every(r => r.failureKind === 'unapproved-reference-host'));
});
test('KP oversized bodies and raw errors do not leak source or credentials into reports', async () => {
  const report = await inspectKpSources(async () => new Response('x', { headers: { 'content-length': '4194305' } }));
  assert.ok(report.references.every(r => r.failureKind === 'reference-byte-limit'));
  assert.equal(kpFailure(new Error('sensitive arbitrary provider response')), 'network-or-parser-error');
});
