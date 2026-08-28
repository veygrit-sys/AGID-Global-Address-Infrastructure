import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry,getPreferredPostalSourceIdsForCountry} from './officialPostalSourceCatalog';
const read=(p:string)=>readFileSync(new URL('../../'+p,import.meta.url),'utf8').replaceAll('\r\n','\n');
const parse=(p:string)=>JSON.parse(read(p));
const manifest=parse('data/postal_country_packs/iq/postal-context/repository-manifest.json');
const contract=parse('data/postal_country_packs/iq/postal-context/m2-source-review.json');
const path='reports/postal-context-m2/iq-source-review-2026-08-28.json',report=parse(path);
test('IQ reviewed M2 criterion preserves non-area, migration, privacy and jurisdiction boundaries',()=>{
 assert.deepEqual(manifest.promotion.stages.find((s:{id:string})=>s.id==='M2_licensed_assignment'),contract.m2_definition);
 assert.match(contract.m2_definition.definition,/Iraq Post assignment release.*declared source and jurisdiction.*five-digit strings.*AGID loader\/API/);
 assert.match(contract.m2_definition.definition,/independent authority.*no polygon, universal coverage or territorial authority/);
 assert.equal(manifest.repository.maturity,'M1_metadata');assert.equal(manifest.promotion.current_stage,'M1_metadata');assert.equal(manifest.promotion.hard_blockers.length,9);
 assert.match(manifest.postal_system.transition_rule,/unverified migration candidate.*rejected/);assert.match(manifest.postal_system.territorial_rule,/not a sovereignty.*Kurdistan Region/);
 for(const k of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[k],false);
});
test('IQ source names, IDs and URLs alone cannot provide strong current validation',()=>{
 const sources=getOfficialPostalSourcesForCountry('IQ'),preferred=getPreferredPostalSourceIdsForCountry('IQ');
 const ids=new Set(parse('data/postal_country_packs/iq/postal-context/source-profile.json').sources.map((s:{source_id:string})=>s.source_id));
 const reviewed=sources.filter(s=>ids.has(s.id));assert.equal(reviewed.length,10);
 for(const s of reviewed){assert.equal(s.validationReadiness,'metadata-only');assert.ok(!preferred.includes(s.id));
  for(const input of [{sourceIds:[s.id]},{url:s.url},{source:s.label}])assert.equal(classifyPostalSourceTrust({countryCode:'IQ',...input}).strength,'weak');}
 assert.equal(sources.find(s=>s.id==='iraq-post')?.trustTier,'authoritative');assert.equal(sources.find(s=>s.id==='iraq-open-government-portal')?.availability,'bulk-open-data');
});
test('IQ current public catalogue metadata is measured without inventing assignment quality or coverage',()=>{
 assert.equal(report.policy.profile.legalSummaryVerified,true);assert.equal(report.policy.profile.attachmentReviewed,false);
 assert.equal(report.apiDocumentation.profile.documentationVerified,true);assert.equal(report.apiDocumentation.profile.apiKeyRequired,false);
 assert.equal(report.apiDocumentation.profile.individualFileTermsMustBeReviewed,true);assert.equal(report.apiDocumentation.profile.exactPostalArtifactRightsBound,false);
 assert.deepEqual(report.discovery.profile.reportedTotals,{datasets:41,resources:88,organizations:17,categories:7});assert.equal(report.discovery.profile.reportedTotalsArePostalCoverage,false);
 assert.deepEqual(report.catalogSearches.map((r:{term:string})=>r.term),['postal','postcode','البريد']);
 for(const r of report.catalogSearches){assert.equal(r.httpStatus,200);assert.match(r.responseDigest,/^sha256:[a-f0-9]{64}$/);assert.equal(r.profile.observedCatalogRows,0);assert.equal(r.profile.reportedMatchingDatasets,0);assert.equal(r.profile.missingOrInvalidIdRate,null);assert.equal(r.profile.fullCatalogScanned,false);assert.equal(r.profile.noMatchesProveNationalAbsence,false);}
 for(const k of ['missingCodeRate','duplicateAssignmentRate','invalidCodeRate'])assert.equal(report.assignmentQuality[k],null);
});
test('IQ dated and public references remain reference-only, not reusable postcode polygons or buildings',()=>{
 const refs=new Map<string,any>(report.references.map((r:{id:string})=>[r.id,r]));assert.equal(refs.get('iraq-post').httpStatus,403);assert.equal(report.references.filter((r:{contentVerified:boolean})=>r.contentVerified).length,6);
 const upu=refs.get('upu-iraq-addressing-2005');assert.equal(upu.digestMatches,true);assert.match(upu.edition,/03\/2005.*visual review/);assert.equal(upu.byteLength,92084);
 assert.equal(report.arcgisItems.length,2);
 for(const r of report.arcgisItems){assert.equal(r.httpStatus,200);assert.equal(r.profile.access,'public');assert.equal(r.profile.licenseFieldState,'null');assert.equal(r.profile.accessInformationFieldState,'null');assert.equal(r.profile.expectedOwnerMatches,true);
  for(const k of ['exactRightsReviewed','officialAssignmentAuthorityVerified','officialDeploymentVerified','itemDataFetched','itemTimestampsAreAssignmentValidity'])assert.equal(r.profile[k],false);}
 assert.equal(report.arcgisItems[1].profile.modifiedAt,'2019-05-01T10:10:58.000Z');
 for(const k of ['assignmentRowsValidated','sourceRowsPersisted','sourceDataSnapshotsRetained','authenticatedRequests','bulkDownloads','privatePlatformRequests','locationQueries','publishedDataArtifacts','paidOperations'])assert.equal(report[k],0);
 for(const k of ['tlsVerificationDisabled','httpDowngradePerformed','contractAcceptancePerformed','realAgidRuntimeVerified','countryM2Achieved'])assert.equal(report[k],false);
 assert.match(report.transport,/windows-dotnet-default-tls/);assert.doesNotMatch(read(path),/bodyBase64|PRIVATE@|recipient_name|"features"\s*:/);
});
test('IQ ledger pins exact source receipts and does not automatically authorize later restricted access',()=>{
 const iq=parse('docs/postal-context-m2-rollout.json').countries.find((c:{countryCode:string})=>c.countryCode==='IQ');
 assert.equal(iq.status,'blocked');assert.equal(iq.evidence,null);assert.equal(iq.attempts,1);assert.deepEqual(iq.m2Definition,contract.m2_definition);
 assert.equal(iq.lastAttempt.reportDigest,'sha256:'+createHash('sha256').update(read(path)).digest('hex'));
 assert.equal(iq.blocker.evidence.discoveryDigest,report.discovery.responseDigest);assert.equal(iq.blocker.evidence.validatedAssignmentRows,0);
 assert.equal(Date.parse(iq.blocker.retryAfter)-Date.parse(iq.blocker.observedAt),7*86400000);assert.equal(iq.blocker.requiresExplicitApproval,false);
 assert.match(iq.blocker.retryPolicy,/after all pending.*does not authorize restricted access or publication/);
});
