import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry,getPreferredPostalSourceIdsForCountry} from './officialPostalSourceCatalog';
const read=(p:string)=>readFileSync(new URL('../../'+p,import.meta.url),'utf8').replaceAll('\r\n','\n');
const json=(p:string)=>JSON.parse(read(p));
const config=json('data/postal_country_packs/kr/postal-context/m2-source-review.json');
const manifest=json('data/postal_country_packs/kr/postal-context/repository-manifest.json');
const reportPath='reports/postal-context-m2/kr-source-review-2026-08-28.json',report=json(reportPath);

test('KR keeps original M2 assignment-plus-National-Basic-District definition and ten hard blockers',()=>{
  const criterion=manifest.promotion.stages.find((s:any)=>s.id==='M2_postal_geometry');
  assert.equal(criterion.definition,'Pinned Korea Post assignment and MOIS National Basic District geometry pass identity, licence, approval, coverage, topology, CRS, freshness and digest gates.');
  assert.equal(manifest.promotion.current_stage,'M1_metadata');assert.equal(manifest.promotion.hard_blockers.length,10);
  for(const key of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[key],false);
});
test('KR eight catalog sources retain discovery but cannot assert strong validation by ID, name or URL',()=>{
  const sources=getOfficialPostalSourcesForCountry('KR');
  for(const ref of config.references.filter((r:any)=>r.id!=='epost-download-index')){
    const s=sources.find(s=>s.id===ref.id)!;assert.ok(s);assert.equal(s.validationReadiness,'metadata-only');assert.ok(!getPreferredPostalSourceIdsForCountry('KR').includes(s.id));
    for(const input of [{sourceIds:[s.id]},{source:s.label},{url:s.url}])assert.equal(classifyPostalSourceTrust({countryCode:'KR',...input}).strength,'weak');
  }
});
test('KR exact public reference receipts distinguish catalog licence, access review and current data',()=>{
  assert.equal(report.references.length,10);assert.equal(report.references.filter((r:any)=>r.contentVerified&&!r.repeat).length,7);
  const map=report.references.find((r:any)=>r.id==='mois-juso-electronic-map');assert.equal(map.profile.licence,'KOGL-Type-1');assert.equal(map.profile.listedFormat,'PPTX');assert.equal(map.profile.catalogRowCount,1);assert.equal(map.profile.modifiedDate,'2025-12-08');assert.equal(map.profile.applicationAndPurposeReview,true);assert.equal(map.profile.identityConfirmation,true);assert.equal(map.profile.currentDataEditionVerified,false);
  for(const r of report.references.filter((r:any)=>r.contentVerified)){assert.equal(r.httpStatus,200);assert.equal(r.sourceDocumentDigest,r.responseDigest);assert.match(r.sourceDocumentDigest,/^sha256:[a-f0-9]{64}$/);assert.equal(r.sourceDataRecords,0);}
  for(const r of report.references.filter((r:any)=>!r.contentVerified)){assert.equal(r.failureKind,'curl-network-error');assert.equal(r.sourceDocumentDigest,null);}
});
test('KR actual PO-box counts, entry hashes, duplicates and blank endpoints stay at source-observation grain',()=>{
  assert.equal(report.poboxDownloads.length,2);assert.equal(report.repeatComparison.archiveBytesMatch,true);assert.equal(report.repeatComparison.indexEditionMatches,true);
  for(const d of report.poboxDownloads){assert.equal(d.responseDigest,config.pobox.expected_zip_digest);assert.equal(d.byteLength,18548);assert.equal(d.profile.allEntriesCrcVerified,true);assert.equal(d.profile.hwpContentReviewed,false);assert.equal(d.profile.filenameDate,'2026-08-11');
    const q=d.profile.text;assert.equal(q.rows,996);assert.equal(q.distinctPostcodes,432);assert.equal(q.leadingZeroRows,55);assert.equal(q.multipleObservationPostcodes,104);assert.equal(q.exactDuplicateExcess,21);assert.equal(q.rates.exactDuplicateExcess,21/996);assert.deepEqual(q.missingByColumn.map((c:any)=>c.count),[0,0,3,373,0,0,523,533,843,996]);
    assert.equal(q.textDigest,'sha256:87bdda47afaa8d1c40feb206e0dcb158034de04a60e5d31024f4278916a74a71');assert.equal(q.comparableFullEndpoints,150);assert.equal(q.invertedFullEndpoints,0);assert.equal(q.rowsDeduplicated,0);assert.equal(q.emptyEndpointsFilled,0);assert.equal(q.geometryType,'po_box');assert.equal(q.coordinateGeometry,'none');assert.equal(q.productionEligible,false);
  }
});
test('KR missing national geometry, civic/building links and publication cannot be inferred from PO-box profiling',()=>{
  for(const key of ['sourceRowsPersisted','currentAssignmentRowsValidated','productionGeometryRecords','civicBuildingRelations','publishedDataArtifacts','paidOperations','authenticatedRequests','privateQueries'])assert.equal(report[key],0);
  assert.equal(report.assignmentQuality.missingCodeRate,null);assert.equal(report.assignmentQuality.duplicateAssignmentRate,null);assert.equal(report.realAgidRuntimeVerified,false);assert.equal(report.countryM2Achieved,false);assert.equal(report.contractAcceptancePerformed,false);assert.equal(report.rightsReview.exact_public_data_artifact_rights_verified,false);
  assert.doesNotMatch(read(reportPath),/SYN_PROVINCE|SYN_BOX|owner_name|recipient_name|raw_html|"records"\s*:|;jsessionid=(?!REDACTED)/);
});
test('KR ledger binds actual report and original criterion while retaining public-only delayed retry',()=>{
  const kr=json('docs/postal-context-m2-rollout.json').countries.find((c:any)=>c.countryCode==='KR');assert.equal(kr.status,'blocked');assert.equal(kr.attempts,1);assert.equal(kr.declaredStage,'M1_metadata');assert.equal(kr.evidence,null);assert.deepEqual(kr.m2Definition,manifest.promotion.stages.find((s:any)=>s.id==='M2_postal_geometry'));
  assert.equal(kr.lastAttempt.reportDigest,'sha256:'+createHash('sha256').update(read(reportPath)).digest('hex'));assert.equal(Date.parse(kr.blocker.retryAfter)-Date.parse(kr.blocker.observedAt),7*86400000);assert.equal(kr.blocker.requiresExplicitApproval,false);assert.match(kr.blocker.retryPolicy,/after all pending.*does not authorize restricted access or publication/);
});
