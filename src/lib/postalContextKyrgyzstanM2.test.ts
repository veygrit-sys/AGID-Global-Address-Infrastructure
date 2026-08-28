import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry, getPreferredPostalSourceIdsForCountry } from './officialPostalSourceCatalog';
const read=(p:string)=>readFileSync(new URL('../../'+p,import.meta.url),'utf8').replaceAll('\r\n','\n');
const json=(p:string)=>JSON.parse(read(p));
const config=json('data/postal_country_packs/kg/postal-context/m2-source-review.json'),manifest=json('data/postal_country_packs/kg/postal-context/repository-manifest.json');
const reportPath='reports/postal-context-m2/kg-source-review-2026-08-28.json',report=json(reportPath);
test('KG named M2 retains prior geometry, topology, crosswalk, building/privacy and all ten hard blockers',()=>{
  assert.deepEqual(manifest.promotion.stages,[config.m2_definition]);assert.match(config.m2_definition.definition,/independently licensed point\/route\/area geometry.*CRS\/topology.*administrative crosswalk.*civic-address\/building-link review/);
  assert.match(config.m2_definition.definition,/actual AGID loader\/API/);assert.equal(manifest.promotion.hard_blockers.length,10);assert.equal(manifest.promotion.current_stage,'M1_metadata');
  for(const key of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[key],false);
  assert.ok(!config.allowed_hosts.some((s:string)=>s.includes('nsdi.kg')));
});
test('KG directory name, URL and ID no longer substitute for a verified current assignment',()=>{
  const source=getOfficialPostalSourcesForCountry('KG').find(s=>s.id==='kyrgyz-post-new-postal-codes-2025')!;
  assert.equal(source.authority,'postal-operator');assert.equal(source.trustTier,'authoritative');assert.equal(source.validationReadiness,'metadata-only');assert.ok(!getPreferredPostalSourceIdsForCountry('KG').includes(source.id));
  for(const value of [{sourceIds:[source.id]},{source:source.label},{url:source.url}])assert.equal(classifyPostalSourceTrust({countryCode:'KG',...value}).strength,'weak');
});
test('KG actual full directory counts keep many-to-one codes, mobile exceptions and duplicate rows separate',()=>{
  assert.equal(report.directoryDownloads.length,2);for(const d of report.directoryDownloads){const q=d.quality;assert.equal(q.rows,2059);assert.equal(q.numericCodeRows,2049);assert.equal(q.mobileMarkerRows,10);assert.equal(q.numericCodes.distinct,871);assert.equal(q.numericCodes.repeatedGroups,452);assert.equal(q.numericCodes.excessOccurrences,1178);assert.equal(q.leadingZeroCodeRows,1);assert.equal(q.exactObservationKeys.excessOccurrences,26);assert.equal(q.normalizedObservationKeys.excessOccurrences,26);assert.equal(q.rates.exactDuplicateExcess,26/2059);assert.equal(q.rates.unknownNonNumeric,0);assert.equal(q.tableLiteralDigest,'sha256:3c87e44e27ddba9fa4329ecd1ccb91b9db343e02ddc14ae0f3cd4805ba7a437f');assert.equal(q.completeForCapturedLiteral,true);assert.equal(q.nationalCoverageVerified,false);assert.equal(q.productionEligible,false);assert.equal(q.dates.validFrom,null);}
  assert.equal(report.repeatComparison.literalDigestMatches,true);assert.equal(report.repeatComparison.publicationMetadataMatches,true);assert.equal(report.currentAssignmentRowsValidated,0);assert.equal(report.assignmentQuality.missingCodeRate,null);
});
test('KG PDF is digest/visually reviewed, failed directory and bounded search do not prove absence',()=>{
  const upu=report.references.find((r:{id:string})=>r.id==='upu-kyrgyzstan-addressing-2019');assert.equal(upu.contentVerified,true);assert.equal(upu.edition,'03/2019');assert.deepEqual(upu.visuallyReviewedPages,[1]);assert.equal(upu.sourceDocumentDigest,'sha256:3bbe1f5f962162e0f42d6ab65f66ad6327e468aeec167be351a2b9d16d655ddd');
  const failed=report.references.find((r:{id:string})=>r.id==='upu-kyrgyzstan-designated-operators');assert.equal(failed.httpStatus,500);assert.equal(failed.sourceDocumentDigest,null);
  const index=report.catalogQueries.find((r:{query:string})=>r.query==='индекс').profile;assert.equal(index.count,117);assert.equal(index.returned,20);assert.equal(index.completeForQuery,false);assert.equal(index.notNationalAbsenceProof,true);
  assert.equal(config.rights_review.exact_directory_reuse_rights_verified,false);assert.equal(config.rights_review.blanket_reuse_ban_inferred,false);assert.equal(config.rights_review.privacy_use_acceptance_clause_present,true);
});
test('KG ledger pins actual report, blocks M2 and restricts retry to public references after pending pass',()=>{
  const kg=json('docs/postal-context-m2-rollout.json').countries.find((c:{countryCode:string})=>c.countryCode==='KG');assert.equal(kg.status,'blocked');assert.equal(kg.attempts,1);assert.equal(kg.evidence,null);assert.deepEqual(kg.m2Definition,config.m2_definition);assert.equal(kg.lastAttempt.reportDigest,'sha256:'+createHash('sha256').update(read(reportPath)).digest('hex'));assert.equal(Date.parse(kg.blocker.retryAfter)-Date.parse(kg.blocker.observedAt),7*86400000);assert.equal(kg.blocker.requiresExplicitApproval,false);assert.match(kg.blocker.retryPolicy,/after all pending.*does not authorize restricted access or publication/);
  for(const key of ['sourceRowsPersisted','publishedDataArtifacts','productionGeometryRecords','civicBuildingRelations','paidOperations','authenticatedRequests','privateQueries'])assert.equal(report[key],0);assert.equal(report.realAgidRuntimeVerified,false);assert.equal(report.countryM2Achieved,false);assert.doesNotMatch(read(reportPath),/SYN_BRANCH|recipient_name|owner_name|maintainer_email|raw_html|"records"\s*:/);
});
