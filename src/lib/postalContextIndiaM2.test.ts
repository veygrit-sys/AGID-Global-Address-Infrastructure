import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry,getPreferredPostalSourceIdsForCountry} from './officialPostalSourceCatalog';
const read=(p:string)=>readFileSync(new URL('../../'+p,import.meta.url),'utf8').replaceAll('\r\n','\n');
const parse=(p:string)=>JSON.parse(read(p));
const manifest=parse('data/postal_country_packs/in/postal-context/repository-manifest.json');
const contract=parse('data/postal_country_packs/in/postal-context/m2-source-review.json');
const reportPath='reports/postal-context-m2/in-source-review-2026-08-28.json',report=parse(reportPath);

test('IN preserves complete typed-assignment M2, separate geometry/building stages and all blockers',()=>{
 assert.deepEqual(contract.m2_definition,{id:'M2_assignment',definition:'A complete rights-cleared PIN and typed office assignment passes authority, coverage, freshness, licence and digest gates.'});
 assert.deepEqual(manifest.promotion.stages.find((s:{id:string})=>s.id==='M2_assignment'),contract.m2_definition);
 assert.equal(manifest.repository.maturity,'M1_metadata');assert.equal(manifest.promotion.current_stage,'M1_metadata');assert.equal(manifest.promotion.hard_blockers.length,13);
 assert.deepEqual(manifest.promotion.stages.map((s:{id:string})=>s.id),['M1_metadata','M2_assignment','M3_geometry_and_address','M4_building']);
 for(const key of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[key],false);
});
test('IN metadata identities stay weak; present web references do not claim verified bulk availability',()=>{
 const sources=getOfficialPostalSourcesForCountry('IN'),preferred=getPreferredPostalSourceIdsForCountry('IN');
 const ids=new Set(parse('data/postal_country_packs/in/postal-context/source-profile.json').sources.map((s:{source_id:string})=>s.source_id));
 const reviewed=sources.filter(s=>ids.has(s.id));assert.equal(reviewed.length,8);
 for(const s of reviewed){assert.equal(s.validationReadiness,'metadata-only');assert.ok(!preferred.includes(s.id));
  for(const input of [{sourceIds:[s.id]},{url:s.url},{source:s.label}])assert.equal(classifyPostalSourceTrust({countryCode:'IN',...input}).strength,'weak');}
 for(const id of ['data-gov-in-pincode','data-gov-in-pincode-boundary']){const s=sources.find(s=>s.id===id);assert.equal(s?.availability,'web-search');assert.equal(s?.trustTier,'authoritative');assert.match(s?.notes?.join(' ')??'',/2026-08-28.*sandbox|2026-08-28.*empty-result/);}
});
test('IN real HTTP 200 portal shells fail closed instead of proving a current directory or boundary',()=>{
 assert.equal(report.portals.length,6);assert.equal(report.portals.filter((r:{profile:{sandboxBannerPresent:boolean}})=>r.profile.sandboxBannerPresent).length,5);
 for(const r of report.portals){assert.equal(r.httpStatus,200);assert.match(r.responseDigest,/^sha256:[a-f0-9]{64}$/);assert.equal(r.profile.referenceTextComplete,false);assert.ok(r.profile.blockReasons.length>0);
  assert.equal(r.profile.staticDirectDataLinkCount,0);assert.equal(r.profile.completeAssignmentVerified,false);assert.equal(r.profile.assignmentEdition,null);assert.equal(r.profile.datesAreAssignmentValidity,false);}
 const catalog=report.portals.find((r:{id:string})=>r.id==='directory-catalog');assert.equal(catalog.profile.catalogPublishedDate,'2020-12-04');assert.equal(catalog.profile.catalogUpdatedDate,'2025-10-03');
 assert.equal(report.portals[0].profile.expectedBodyMarkerPresent,false);assert.equal(report.portals[0].profile.godlFooterOrTextPresent,true);
});
test('IN reviewed GODL and Swagger define reference rights/access, not current data or credential authority',()=>{
 assert.equal(report.godl.profile.legalTextComplete,true);assert.equal(report.godl.profile.attributionRequired,true);assert.equal(report.godl.profile.exactDatasetLicenseBound,false);
 const p=report.swagger.profile;assert.equal(p.catalogId,contract.swagger.catalog_id);assert.equal(p.parameterCount,15);assert.equal(p.queryFilterCount,11);
 assert.equal(p.apiKeyRequired,true);assert.equal(p.credentialValuesExported,false);assert.equal(p.apiSpecificationVersion,null);assert.equal(p.pinFilterType,'number');assert.equal(p.pinResponseTypeVerified,false);assert.equal(p.pinStorageType,'six-digit-string');
 assert.equal(report.keylessCatalog.httpStatus,400);assert.equal(report.keylessCatalog.responseDigest,null);assert.equal(report.catalogProbeRequests,1);
 assert.equal(report.references.length,3);assert.ok(report.references.every((r:{contentVerified:boolean})=>r.contentVerified));
 assert.equal(report.assignmentRowsValidated,0);assert.equal(report.assignmentQuality.missingPinRate,null);assert.equal(report.assignmentQuality.duplicateOfficeRate,null);assert.equal(report.assignmentQuality.invalidPinRate,null);
 for(const key of ['sourceRowsPersisted','sourceSnapshotsRetained','authenticatedRequests','bulkDownloads','thirdPartyLookupRequests','locationQueries','publishedDataArtifacts','paidOperations'])assert.equal(report[key],0);
 for(const key of ['credentialValuesPersisted','contractAcceptancePerformed','realAgidRuntimeVerified','countryM2Achieved'])assert.equal(report[key],false);
 assert.doesNotMatch(read(reportPath),/SYNTHETIC-KEY|PRIVATE@|maintainer_email|"default"\s*:/);
});
test('IN ledger pins source receipts and keeps the retry date separate from authentication/publication approval',()=>{
 const entry=parse('docs/postal-context-m2-rollout.json').countries.find((c:{countryCode:string})=>c.countryCode==='IN');
 assert.equal(entry.status,'blocked');assert.equal(entry.evidence,null);assert.equal(entry.attempts,1);assert.deepEqual(entry.m2Definition,contract.m2_definition);
 assert.equal(entry.lastAttempt.reportDigest,'sha256:'+createHash('sha256').update(read(reportPath)).digest('hex'));assert.equal(entry.blocker.evidence.swaggerDigest,report.swagger.responseDigest);
 assert.equal(entry.blocker.evidence.assignmentRowsValidated,0);assert.equal(entry.blocker.evidence.keylessCatalogHttpStatus,400);
 assert.equal(Date.parse(entry.blocker.retryAfter)-Date.parse(entry.blocker.observedAt),7*86400000);assert.equal(entry.blocker.requiresExplicitApproval,false);
 assert.match(entry.blocker.retryPolicy,/after all pending.*does not authorize authenticated access or publication/);
});
