import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classifyPostalSourceTrust, getOfficialPostalSourcesForCountry, getPreferredPostalSourceIdsForCountry } from './officialPostalSourceCatalog';
const read=(p:string)=>readFileSync(new URL('../../'+p,import.meta.url),'utf8').replaceAll('\r\n','\n');
const json=(p:string)=>JSON.parse(read(p));
const config=json('data/postal_country_packs/kh/postal-context/m2-source-review.json'),manifest=json('data/postal_country_packs/kh/postal-context/repository-manifest.json');
const reportPath='reports/postal-context-m2/kh-source-review-2026-08-28.json',report=json(reportPath);
test('KH M2 retains geometry, CRS/topology, crosswalk, civic/privacy and all nine hard blockers',()=>{
  assert.deepEqual(manifest.promotion.stages,[config.m2_definition]);assert.match(config.m2_definition.definition,/independently licensed point\/area geometry.*CRS\/topology.*administrative crosswalk.*civic-address\/building-link review/);assert.match(config.m2_definition.definition,/actual AGID loader\/API/);assert.equal(manifest.promotion.hard_blockers.length,9);assert.equal(manifest.promotion.current_stage,'M1_metadata');
  for(const key of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[key],false);
  assert.ok(!config.allowed_hosts.some((s:string)=>s.includes('mlmupc')));
});
test('KH authoritative origins cannot become strong runtime evidence without a verified release',()=>{
  for(const id of ['cambodia-post','mptc-cambodia-prakas-77-2025']){
    const source=getOfficialPostalSourcesForCountry('KH').find(s=>s.id===id)!;assert.equal(source.trustTier,'authoritative');assert.equal(source.validationReadiness,'metadata-only');assert.ok(!getPreferredPostalSourceIdsForCountry('KH').includes(id));
    for(const value of [{sourceIds:[id]},{source:source.label},{url:source.url}])assert.equal(classifyPostalSourceTrust({countryCode:'KH',...value}).strength,'weak');
  }
});
test('KH actual CSVs preserve aliases, padding, leading zeroes and all-row source-grain metrics',()=>{
  assert.equal(report.uniqueCapturedTables,3);assert.equal(report.uniqueCapturedRows,1887);assert.equal(report.tableDownloads.length,7);assert.ok(report.aliasGroups.every((g:any)=>g.byteIdentical&&g.countedOnce));
  const q=(level:string)=>report.tableDownloads.find((d:any)=>d.level===level).quality;
  assert.equal(q('province').rows,25);assert.equal(q('district').rows,210);assert.equal(q('commune').rows,1652);assert.equal(q('district').blankLogicalRecords,791);assert.equal(q('district').postalCodes.excess,1);assert.deepEqual(q('district').postalCodes.duplicateOrdinals,[[69,78]]);
  assert.equal(q('province').leadingZeroPostalCodes,9);assert.equal(q('district').leadingZeroPostalCodes,88);assert.equal(q('commune').leadingZeroPostalCodes,768);assert.equal(q('commune').postalVsAdministrativeCodeDisagreement,43);assert.equal(q('commune').rates.postalVsAdministrativeCodeDisagreement,43/1652);
  for(const level of ['province','district','commune']){assert.equal(q(level).missingFields,0);assert.equal(q(level).invalidPostalCodes,0);assert.equal(q(level).currentAssignmentRowsValidated,0);assert.equal(q(level).productionEligible,false);}
  assert.equal(report.crossTableChecks.communeToDistrict.postalParentMismatchRows,38);assert.equal(report.crossTableChecks.communeToDistrict.rates.postalParentMismatch,38/1652);assert.equal(report.tableDownloads.filter((d:any)=>!d.repeat&&!d.metadataSizeMatches).length,3);
  assert.equal(report.repeatComparison.districtDigestMatches,true);assert.equal(report.repeatComparison.metadataProfileMatches,true);assert.equal(report.currentAssignmentRowsValidated,0);assert.equal(report.assignmentQuality.missingCodeRate,null);
});
test('KH digest-bound manual PDF exception is not a full-data reconciliation or automatic repair',()=>{
  const p=report.references.find((r:any)=>r.id==='prakas');assert.equal(p.pages,59);assert.equal(p.pagesWithExtractableText,0);assert.equal(p.contentVerified,true);assert.deepEqual(p.visuallyReviewedPages,[1,2,3,26,27,28,58,59]);assert.equal(p.fullRowReconciliation,false);
  assert.equal(report.primaryComparison.manualExceptionBoundToCapturedDigests,true);assert.equal(report.primaryComparison.expectedException.source_record_ordinal,78);assert.equal(report.primaryComparison.expectedException.official_pdf_physical_page,26);assert.equal(report.primaryComparison.automaticCorrections,0);
  const u=report.references.find((r:any)=>r.id==='upu');assert.equal(u.contentVerified,true);assert.equal(u.edition,'11/2018');assert.equal(u.sourceDocumentDigest,'sha256:a669ccada40f39d913991046f117d403d89a8753f4cbbbc0c21c6616699c1e0c');assert.deepEqual(u.visuallyReviewedPages,[1]);assert.equal(u.currentAssignmentVerified,false);
  assert.equal(report.metadataDownloads[1].profile.licenceId,'notspecified');assert.equal(config.rights_review.commercial_restriction_and_cc_grant_scope_unresolved,true);assert.equal(config.rights_review.blanket_reuse_ban_inferred,false);
});
test('KH ledger blocks M2, pins actual receipt and preserves public-only retry after pending pass',()=>{
  const kh=json('docs/postal-context-m2-rollout.json').countries.find((c:any)=>c.countryCode==='KH');assert.equal(kh.status,'blocked');assert.equal(kh.attempts,1);assert.equal(kh.evidence,null);assert.deepEqual(kh.m2Definition,config.m2_definition);assert.equal(kh.lastAttempt.reportDigest,'sha256:'+createHash('sha256').update(read(reportPath)).digest('hex'));assert.equal(Date.parse(kh.blocker.retryAfter)-Date.parse(kh.blocker.observedAt),7*86400000);assert.equal(kh.blocker.requiresExplicitApproval,false);assert.match(kh.blocker.retryPolicy,/after all pending.*does not authorize restricted access or publication/);
  for(const key of ['sourceRowsPersisted','publishedDataArtifacts','productionGeometryRecords','civicBuildingRelations','paidOperations','authenticatedRequests','privateQueries'])assert.equal(report[key],0);assert.equal(report.realAgidRuntimeVerified,false);assert.equal(report.countryM2Achieved,false);assert.doesNotMatch(read(reportPath),/SYN_LATIN|recipient_name|owner_name|maintainer_email|raw_html|"records"\s*:/);
});
