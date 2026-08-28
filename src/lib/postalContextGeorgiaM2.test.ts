import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry, getPreferredPostalSourceIdsForCountry } from './officialPostalSourceCatalog';
const read=(p:string)=>readFileSync(new URL('../../'+p,import.meta.url),'utf8').replaceAll('\r\n','\n');
const manifest=JSON.parse(read('data/postal_country_packs/ge/postal-context/repository-manifest.json'));
const profile=JSON.parse(read('data/postal_country_packs/ge/postal-context/m2-source-review.json'));
const reportPath='reports/postal-context-m2/ge-source-review-2026-08-28.json';
const report=JSON.parse(read(reportPath));
const geIds=['georgian-post-postcode-finder','georgian-post-addressing-guide','napr-georgia-address-registry','nsdi-georgia-address-layer','nsdi-georgia-registered-buildings','nsdi-georgia-registered-parcels','nsdi-georgia-administrative-boundaries','geostat-georgia-administrative-classification'];

test('GE retains its original scoped experimental M2 criterion and all fourteen hard blockers',()=>{
  assert.deepEqual(profile.m2_definition,{id:'M2_experimental',definition:'Pinned rights-cleared snapshots reproduce experimental packs with complete lineage.'});
  assert.deepEqual(manifest.promotion.stages.find((s:{id:string})=>s.id==='M2_experimental'),profile.m2_definition);
  assert.equal(manifest.promotion.hard_blockers.length,14);assert.equal(manifest.repository.maturity,'M1_metadata');
  for(const flag of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[flag],false);
});
test('GE current finder URL is synchronized without granting reference metadata address-validation authority',()=>{
  const current='https://www.gpost.ge/help/postal-codes';
  assert.equal(JSON.parse(read('src/data/address_formats/asia/caucasus/GE.json')).postalCode.api,current);
  assert.ok(read('src/data/address_formats/asia/caucasus/GE.yaml').includes('api: '+current));
  assert.ok(read('src/data/address_hierarchy/asia.json').includes(current));
  const sources=getOfficialPostalSourcesForCountry('GE'), preferred=getPreferredPostalSourceIdsForCountry('GE');
  for(const id of geIds){const source=sources.find(s=>s.id===id);assert.ok(source);assert.equal(source.validationReadiness,'metadata-only');assert.ok(!preferred.includes(id));
    for(const input of [{sourceIds:[id]},{url:source.url},{source:source.label}])assert.equal(classifyPostalSourceTrust({countryCode:'GE',...input}).strength,'weak');}
  assert.equal(sources.find(s=>s.id==='georgian-post-postcode-finder')?.trustTier,'authoritative');
  assert.equal(classifyPostalSourceTrust({countryCode:'GE',url:profile.postal_probe.legacy_url}).strength,'weak');
  assert.equal(classifyPostalSourceTrust({countryCode:'GE',source:'Georgian Post'}).strength,'weak');
});
test('GE live query accounts for hidden cards and leading zeroes without making civic or geometry claims',()=>{
  const p=report.postalSearch.first.profile;assert.equal(p.observedRows,64);assert.equal(p.distinctCodes,11);assert.deepEqual(p.groupSizes,[46,16,2]);
  assert.equal(p.leadingZeroRows,46);assert.equal(p.initiallyHiddenRows,50);assert.equal(p.numericLocatorLabelRows,5);
  for(const k of ['missingCodeRows','missingLocationRows','invalidCodeRows','excessDuplicateComparisonRows','sourceRowsPersisted','postalGeometryRecords','exactCivicAddressRelations','exactBuildingRelations'])assert.equal(p[k],0);
  assert.equal(p.geometryType,'none');assert.equal(p.assignmentEdition,null);assert.equal(p.currentNationalCoverageVerified,false);
  assert.equal(report.postalSearch.byteIdenticalRepeat,true);assert.equal(report.postalSearch.atomicSnapshotVerified,false);
  assert.equal(report.anonymousFormSessionUsed,true);assert.equal(report.userAuthenticationPerformed,false);assert.equal(report.sessionValuesPersisted,false);
  assert.equal(report.legacyFinder.containsSearchForm,false);assert.equal(report.legacyFinder.linksCurrentFinder,true);
});
test('GE NSDI roles and exact noncommercial licence conditions stay resource-specific',()=>{
  const c=report.nsdi.catalog.profile;assert.equal(c.reportedPublishedResources,159);assert.equal(c.distinctMetadataIds,159);assert.equal(c.themeOccurrences,217);assert.equal(c.repeatedThemeOccurrences,58);
  for(const id of [92,35,80]){const r=report.nsdi['license'+id],spec=profile.nsdi_probe.resources.find((s:{id:number})=>s.id===id);
    assert.equal(r.responseDigest,spec.expected_response_digest);assert.equal(r.profile.declaredLicense,spec.expected_license);
    assert.equal(r.profile.commercialUsePermitted,false);assert.equal(r.profile.publicationRightsForAgidPackCleared,false);assert.equal(r.profile.declaredLicenseUrl,null);}
  assert.equal(report.nsdi.license92.profile.adaptedSharingPermittedByReviewedConditions,false);
  assert.equal(report.nsdi.license35.profile.adaptedSharingPermittedByReviewedConditions,false);
  assert.equal(report.nsdi.license80.profile.adaptedSharingPermittedByReviewedConditions,true);
  assert.equal(report.nsdi.terms.profile.blanketDataReuseLicense,false);
});
test('GE ledger pins real inspection bytes but does not turn passing synthetic tests into M2',()=>{
  const ledger=JSON.parse(read('docs/postal-context-m2-rollout.json')),ge=ledger.countries.find((c:{countryCode:string})=>c.countryCode==='GE');
  assert.equal(ge.status,'blocked');assert.equal(ge.evidence,null);assert.equal(ge.attempts,1);assert.deepEqual(ge.m2Definition,profile.m2_definition);
  assert.equal(ge.lastAttempt.reportDigest,'sha256:'+createHash('sha256').update(read(reportPath)).digest('hex'));
  assert.equal(Date.parse(ge.blocker.retryAfter)-Date.parse(ge.blocker.observedAt),7*86400000);assert.equal(ge.blocker.requiresExplicitApproval,false);
  assert.equal(report.references.filter((r:{contentVerified:boolean})=>r.contentVerified).length,4);
  assert.equal(report.countryM2Achieved,false);assert.equal(report.realAgidRuntimeVerified,false);assert.equal(report.publishedDataArtifacts,0);assert.equal(report.paidOperations,0);
});
