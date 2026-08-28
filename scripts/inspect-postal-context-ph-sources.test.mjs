import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {config, inspectPhilippinesObservations, inspectPhilippinesSources, profilePhilippinesReference} from './inspect-postal-context-ph-sources.mjs';
import {sourceDigest} from './lib/postal-context-source-probe.mjs';

const sourceReport = JSON.parse(readFileSync(new URL('../reports/postal-context-m2/ph-source-review-2026-08-28.json', import.meta.url)));
const ref = id => structuredClone(config.references.find(r => r.id === id));
function fixture(id='zip-ph-announcement', body='March 6, 2024 seven (7) digit alphanumeric old four (4) digit', prefix='') {
  const r = ref(id);
  const bytes = Buffer.from(`${prefix}<head><title>${r.title}</title></head><body>${body}</body>`);
  r.reviewed_digest = sourceDigest(bytes); r.reviewed_bytes = bytes.length;
  return {r, bytes};
}
function receipts() {
  return config.references.map(r => ({id:r.id, requestedUrl:r.url, finalUrl:r.url, redirects:[], observedAt:r.reviewed_observed_at,
    httpStatus:r.reviewed_http_status, contentType:r.accepted_mime[0], byteLength:r.reviewed_bytes,
    responseDigest:r.reviewed_digest, ...(r.kind === 'http-denied' ? {} : {bytes:Buffer.from('not the source')})}));
}

test('PH keeps its existing country-specific M2 target and incomplete state', () => {
  const manifest = JSON.parse(readFileSync(new URL('../data/postal_country_packs/ph/postal-context/repository-manifest.json', import.meta.url)));
  assert.deepEqual(config.m2_criterion, manifest.promotion.stages.find(s => s.id === 'M2_assignment'));
  assert.equal(config.decision.country_m2_achieved, false);
  assert.equal(sourceReport.countryM2Achieved, false);
  assert.equal(sourceReport.realAgidRuntimeVerified, false);
});

test('snapshot data-quality observations are not current assignment validation', () => {
  const p = sourceReport.references.find(r => r.id === 'locator').profile;
  assert.equal(p.htmlBodyRows, p.populatedRows + p.allBlankRows);
  assert.equal(p.populatedRows, p.fourDigitRows + p.invalidOrMissingCodeRows);
  assert.equal(p.allBlankRows, 440); assert.equal(p.invalidOrMissingCodeRows, 1);
  assert.equal(p.distinctFourDigitCodes, 958); assert.equal(p.duplicateRowsBeyondFirst, 1);
  assert.equal(p.invalidRows[0].bodyRow, 628);
  assert.equal(p.structureRecomputed, true);
  assert.equal(sourceReport.currentPostalAssignmentsValidated, 0);
  assert.equal(sourceReport.publishedImmutableDataArtifacts, 0);
  assert.equal(sourceReport.quality.nationalCompleteness, null);
});

test('public-domain notice, copyright notice and profit condition remain separate', () => {
  assert.equal(ref('locator').reviewed_profile.publicDomainNoticePresent, true);
  assert.equal(ref('locator').reviewed_profile.copyrightNoticeAlsoPresent, true);
  assert.equal(ref('locator').reviewed_profile.blanketCommercialRedistributionEstablished, false);
  assert.equal(ref('ip-code').reviewed_profile.profitExploitationApprovalConditionPresent, true);
});

test('UPU printed edition is not its PDF creation time', () => {
  const p = ref('upu').reviewed_profile;
  assert.equal(p.printedEdition, '09/2004');
  assert.deepEqual(p.visuallyReviewedPages, [1,2]);
  assert.equal(p.pdfTimestampIsAssignmentEdition, false);
  assert.equal(p.examplesUsedAsRealAddresses, false);
});

test('head title is scoped; an SVG title does not replace document identity', () => {
  const {r, bytes} = fixture(undefined, undefined, '<svg><title>map title</title></svg>');
  assert.equal(profilePhilippinesReference(bytes, r, 'text/html; charset=UTF-8').contentVerified, true);
});

test('changed and truncated bytes fail closed', () => {
  const {r, bytes} = fixture();
  for (const b of [Buffer.concat([bytes, Buffer.from('x')]), bytes.subarray(0, bytes.length-1)])
    assert.throws(() => profilePhilippinesReference(b, r, 'text/html'), /ph-content-drift/);
});

test('wrong MIME and missing markers fail closed', () => {
  const good = fixture();
  assert.throws(() => profilePhilippinesReference(good.bytes, good.r, 'application/json'), /ph-mime/);
  const bad = fixture('zip-ph-announcement', 'login');
  assert.throws(() => profilePhilippinesReference(bad.bytes, bad.r, 'text/html'), /ph-html-markers/);
});

test('title mismatch cannot pass by matching article body', () => {
  const {r, bytes} = fixture(); r.title = 'different';
  assert.throws(() => profilePhilippinesReference(bytes, r, 'text/html'), /ph-title/);
});

test('PDF needs a PDF header even after matching hash', () => {
  const r = ref('upu'), bytes = Buffer.from('not a PDF');
  r.reviewed_bytes=bytes.length; r.reviewed_digest=sourceDigest(bytes);
  assert.throws(() => profilePhilippinesReference(bytes, r, 'application/pdf'), /ph-pdf-header/);
});

test('receipt set cannot omit, duplicate or forge observations', () => {
  assert.throws(() => inspectPhilippinesObservations([]), /ph-observation-set/);
  const values=receipts(); values[1]=values[0];
  assert.throws(() => inspectPhilippinesObservations(values), /ph-observation-set/);
  assert.throws(() => inspectPhilippinesObservations(receipts()), /ph-receipt-binding/);
});

test('receipt URL and observation time are bound to reviewed source', () => {
  for (const change of [{requestedUrl:'https://attacker.invalid/'},{observedAt:'2099-01-01T00:00:00Z'}]) {
    const values=receipts(); Object.assign(values[0], change);
    assert.throws(() => inspectPhilippinesObservations(values), /ph-observation-binding/);
  }
});

test('synthetic successful HTTP response is not verified source data', async () => {
  const requested=[];
  const result=await inspectPhilippinesSources(async url => {requested.push(url); return new Response('<html>example</html>', {headers:{'content-type':'text/html'}});});
  assert.equal(requested.length,4);
  assert.equal(requested.some(url => url.includes('psa.gov.ph')), false);
  assert.equal(result.references.filter(r => r.status === 'not-retried-prior-http-denial').length, 2);
  assert.ok(result.references.every(r => r.contentVerified === false));
  assert.equal(result.countryM2Achieved,false);
});

test('403 response is never a dataset and is not retried through alternate hosts', async () => {
  let requests=0;
  const result=await inspectPhilippinesSources(async () => {requests++; return new Response('Denied',{status:403});});
  assert.equal(requests,4);
  assert.equal(result.references.filter(r => r.status === 'http-error').length,4);
  assert.equal(result.currentPostalAssignmentsValidated,0);
});

test('redirect to an unapproved host is rejected before the second fetch', async () => {
  let requests=0;
  const result=await inspectPhilippinesSources(async () => {requests++; return new Response(null,{status:302,headers:{location:'https://attacker.invalid/'}});});
  assert.equal(requests,4);
  assert.equal(result.references.filter(r => r.failureKind === 'unapproved-reference-host').length,4);
});

test('network error output cannot disclose arbitrary exception text', async () => {
  const result=await inspectPhilippinesSources(async () => {throw Error('sensitive-query-text');});
  assert.ok(!JSON.stringify(result).includes('sensitive-query-text'));
  assert.equal(result.references[0].failureKind,'network-or-parser-error');
});

test('source reports exclude raw source documents and personal data', () => {
  assert.equal(sourceReport.rawSourceRowsInGit,0);
  assert.equal(sourceReport.rawSourceDocumentsInGit,0);
  assert.equal(sourceReport.privatePostalIdRecordsIngested,0);
  assert.equal(sourceReport.paidOperations,0);
  assert.equal(sourceReport.references.filter(r=>r.transportBytesVerified).length,4);
  assert.equal(sourceReport.references.filter(r=>r.status==='http-denied').length,2);
});
