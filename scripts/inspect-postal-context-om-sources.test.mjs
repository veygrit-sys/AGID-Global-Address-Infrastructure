import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {config, inspectOmanObservations, inspectOmanSources, profileOmanLayer, profileOmanReference} from './inspect-postal-context-om-sources.mjs';
import {sourceDigest} from './lib/postal-context-source-probe.mjs';

const fixture = (id, text, mime='text/html') => {
  const bytes = Buffer.from(text), ref = structuredClone(config.references.find(r => r.id === id));
  ref.reviewed_bytes = bytes.length; ref.reviewed_digest = sourceDigest(bytes); ref.accepted_mime = [mime];
  return {bytes, ref, mime};
};
const terms = '<html><head><title>privacy and policy | Oman Post</title></head><body>Company Name Website.com viewing publishing harvesting<svg><title>Icon</title></svg></body></html>';

test('Oman M2 criterion is retained and actual POI rows cannot promote it', () => {
  const manifest = JSON.parse(readFileSync(new URL('../data/postal_country_packs/om/postal-context/repository-manifest.json', import.meta.url)));
  assert.deepEqual(config.m2_criterion, manifest.promotion.stages.find(s => s.id.startsWith('M2_')));
  assert.equal(config.country_m2_achieved, false);
  const p = config.references.find(r => r.id === 'dg-workbook').reviewed_profile;
  assert.equal(p.rows, 12); assert.equal(p.uniqueCoordinatePairs, 11);
  assert.equal(p.missingArabicNames, 1); assert.equal(p.missingTownLabels, 2);
  assert.equal(p.postalCodeColumnPresent, false); assert.equal(p.countryM2Achieved, false);
  assert.equal(p.sourceCrs, null); assert.equal(p.nationalCoverageVerified, false);
});

test('restricted locator is excluded from automated downloads', () => {
  assert.ok(!config.references.some(r => /office-locator/.test(r.url)));
  assert.equal(config.unqueried_sources[0].bulkRowsExtracted, 0);
  assert.equal(config.unqueried_sources[0].automatedDirectoryDownload, false);
});

test('governorate and national portal licences are distinct scoped documents', () => {
  const dg = config.references.find(r => r.id === 'dg-license');
  const portal = config.references.find(r => r.id === 'portal-license');
  assert.notEqual(dg.reviewed_digest, portal.reviewed_digest);
  assert.ok(dg.reviewed_profile.thirdPartyRightsReserved);
  assert.ok(portal.reviewed_profile.excludesPersonalRestrictedIdentityLogoAndProtectedIP);
  assert.ok(config.references.find(r => r.id === 'data-terms').reviewed_profile.doesNotLicenseOmanPostOrOtherHosts);
});

test('HTML title comes from head, not unrelated SVG titles', () => {
  const {bytes, ref, mime} = fixture('post-terms', terms);
  assert.equal(profileOmanReference(bytes, ref, mime).profile.bulkReusePermissionVerified, false);
});

test('changed bytes fail before any semantic promotion', () => {
  const {bytes, ref, mime} = fixture('post-terms', terms);
  assert.throws(() => profileOmanReference(Buffer.concat([bytes, Buffer.from('!')]), ref, mime), /content-drift/);
});

test('wrong mime is rejected even when bytes and hash match', () => {
  const {bytes, ref} = fixture('post-terms', terms);
  assert.throws(() => profileOmanReference(bytes, ref, 'application/json'), /om-mime/);
});

test('login/error page with rewritten digest still fails title', () => {
  const {bytes, ref, mime} = fixture('post-terms', '<html><head><title>Login</title></head></html>');
  assert.throws(() => profileOmanReference(bytes, ref, mime), /om-title/);
});

test('a matching title alone is not sufficient terms evidence', () => {
  const {bytes, ref, mime} = fixture('post-terms', '<head><title>privacy and policy | Oman Post</title></head>');
  assert.throws(() => profileOmanReference(bytes, ref, mime), /html-markers/);
});

test('PDF MIME is not enough without a PDF signature', () => {
  const {bytes, ref, mime} = fixture('upu', '<html>error</html>', 'application/pdf');
  assert.throws(() => profileOmanReference(bytes, ref, mime), /pdf-header/);
});

test('workbook profile binding rejects invented postal assignments', () => {
  const {bytes, ref, mime} = fixture('dg-workbook', 'PK\x03\x04', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  assert.throws(() => profileOmanReference(bytes, ref, mime, {...ref.reviewed_profile, postalAssignmentsValidated:12}), /workbook-profile-binding/);
  assert.equal(profileOmanReference(bytes, ref, mime).profile.structureRecomputed, false);
});

test('layer service errors and wrong layer identity fail closed', () => {
  assert.throws(() => profileOmanLayer({error:{code:403}}), /layer-envelope/);
  assert.throws(() => profileOmanLayer({layers:[{id:0}],tables:[]}), /layer-identity/);
});

test('observation sets must be complete, unique and time-bound', () => {
  assert.throws(() => inspectOmanObservations([]), /observation-set/);
  assert.throws(() => inspectOmanObservations(Array(10).fill({id:'upu'})), /observation-set/);
  const observations = config.references.map(r => ({id:r.id, requestedUrl:r.url, observedAt:'2999-01-01T00:00:00Z'}));
  assert.throws(() => inspectOmanObservations(observations), /observation-binding/);
});

test('failed licence/listing suppress workbook GET and never scrape the locator', async () => {
  const calls = [];
  const result = await inspectOmanSources(async (url, options) => { calls.push(url); assert.equal(options.redirect, 'manual'); return new Response('denied', {status:403}); });
  assert.equal(calls.length, 8);
  assert.ok(calls.every(url => !/office-locator|post_office_locations|\/query/.test(url)));
  assert.equal(result.countryM2Achieved, false); assert.equal(result.realAgidRuntimeVerified, false);
  assert.equal(result.currentPostalAssignmentsValidated, 0);
  assert.equal(result.references.find(r => r.id === 'dg-workbook').status, 'not-requested-review-required');
});

test('cross-host redirects cannot fetch an unapproved source', async () => {
  const calls = [];
  const result = await inspectOmanSources(async url => { calls.push(url); return new Response(null, {status:302,headers:{location:'https://invalid.example/private'}}); });
  assert.ok(calls.every(url => !url.includes('invalid.example')));
  assert.ok(result.references.filter(r => r.status === 'review-failed').every(r => r.failureKind === 'unapproved-reference-host'));
  assert.equal(result.countryM2Achieved, false);
});


test('reviewed source report, receipts and country ledger are hash-bound without M2 promotion', () => {
  const reportBytes = readFileSync(new URL('../reports/postal-context-m2/om-source-review-2026-08-28.json', import.meta.url));
  const report = JSON.parse(reportBytes);
  const ledger = JSON.parse(readFileSync(new URL('../docs/postal-context-m2-rollout.json', import.meta.url)));
  const country = ledger.countries.find(c => c.countryCode === 'OM');
  assert.equal(country.status, 'blocked'); assert.equal(country.evidence, null);
  assert.equal(country.lastAttempt.reportDigest, sourceDigest(reportBytes));
  assert.equal(report.countryM2Achieved, false); assert.equal(report.realAgidRuntimeVerified, false);
  assert.equal(report.references.filter(r => r.contentVerified).length, 9);
  for (const ref of config.references) {
    const receipt = report.references.find(r => r.id === ref.id);
    assert.equal(receipt.requestedUrl, ref.url); assert.equal(receipt.observedAt, ref.reviewed_observed_at);
    assert.equal(receipt.sourceDocumentDigest, ref.reviewed_digest);
  }
  const profile = report.references.find(r => r.id === 'dg-workbook').profile;
  assert.equal(profile.structureRecomputed, true); assert.equal(profile.priorAggregateReviewReusedByExactBytes, false);
  assert.equal(profile.postalAssignmentsValidated, 0); assert.equal(profile.geometriesMaterialized, 0);
});

test('extra layer fields and changed CRS are not accepted as reviewed schema', () => {
  const report = JSON.parse(readFileSync(new URL('../reports/postal-context-m2/om-source-review-2026-08-28.json', import.meta.url)));
  const schema = report.references.find(r => r.id === 'ncsi-layer').profile.fieldSchema;
  const layer = {id:3, name:'WilayatB', type:'Feature Layer', geometryType:'esriGeometryPolygon', objectIdField:'OBJECTID', globalIdField:'GLOBALID',
    extent:{spatialReference:{wkid:4326,latestWkid:4326}}, relationships:[], fields:schema,
    copyrightText:'[Ministry of Interior] [National Center for Statistics and Information ]'};
  assert.equal(profileOmanLayer({layers:[layer], tables:[]}).postalCodeFieldPresent, false);
  assert.throws(() => profileOmanLayer({layers:[{...layer,fields:[...schema,{name:'OWNER',type:'esriFieldTypeString',nullable:true}]}],tables:[]}), /layer-fields/);
  assert.throws(() => profileOmanLayer({layers:[{...layer,extent:{spatialReference:{wkid:3857,latestWkid:3857}}}],tables:[]}), /layer-identity/);
  assert.throws(() => profileOmanLayer({layers:[{...layer,fields:schema.map(f => f.name === 'WilayaID' ? {...f,type:'esriFieldTypeString'} : f)}],tables:[]}), /layer-fields/);
});
