import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry,getPreferredPostalSourceIdsForCountry} from './officialPostalSourceCatalog';
const read=(p:string)=>readFileSync(new URL('../../'+p,import.meta.url),'utf8').replaceAll('\r\n','\n');
const json=(p:string)=>JSON.parse(read(p));
const config=json('data/postal_country_packs/kw/postal-context/m2-source-review.json');
const manifest=json('data/postal_country_packs/kw/postal-context/repository-manifest.json');
const reportPath='reports/postal-context-m2/kw-source-review-2026-08-28.json',report=json(reportPath);

test('KW retains assignment-only M2, twelve blockers and five-digit identity; geometry is separate',()=>{
  assert.equal(manifest.promotion.stages.find((s:any)=>s.id==='M2_assignment').definition,'Complete rights-cleared current block and P.O. box assignment tables pass authority, class, coverage, freshness, licence and digest gates.');
  assert.equal(manifest.promotion.current_stage,'M1_metadata');assert.equal(manifest.promotion.hard_blockers.length,12);
  const f=json('src/data/address_formats/asia/middle_east/KW.json');assert.equal(f.postalCode.regex,'^\\d{5}$');assert.equal(f.postalCode.format,'NNNNN');
  for(const key of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[key],false);
});
test('KW seven catalog sources preserve discovery but names, IDs and URLs are not strong validation',()=>{
  const sources=getOfficialPostalSourcesForCountry('KW');assert.equal(config.references.filter((r:any)=>r.id!=='moc-policy-placeholder').length,7);
  for(const r of config.references.filter((r:any)=>r.id!=='moc-policy-placeholder')){
    const s=sources.find(s=>s.id===r.id)!;assert.ok(s);assert.equal(s.validationReadiness,'metadata-only');assert.ok(!getPreferredPostalSourceIdsForCountry('KW').includes(s.id));
    for(const input of [{sourceIds:[s.id]},{source:s.label},{url:s.url}])assert.equal(classifyPostalSourceTrust({countryCode:'KW',...input}).strength,'weak');
  }
});
test('KW reference receipts bind real bytes, UI placeholders, unavailable policy and reviewed PDF edition',()=>{
  assert.equal(report.references.length,8);assert.equal(report.references.filter((r:any)=>r.contentVerified).length,7);
  for(const r of report.references.filter((r:any)=>r.contentVerified)){assert.equal(r.httpStatus,200);assert.equal(r.sourceDocumentDigest,r.responseDigest);assert.match(r.responseDigest,/^sha256:[a-f0-9]{64}$/);assert.equal(r.sourceDataRecords,0);}
  const moc=report.references.find((r:any)=>r.id==='kuwait-post').profile;assert.equal(moc.rightsReservedFooter,true);assert.equal(moc.privacyPolicyPlaceholderLink,true);assert.equal(moc.datasetEditionVerified,false);assert.ok(moc.tables.every((t:any)=>t.initialHtmlDataRows===0&&t.initialHtmlPlaceholderRows===6));
  const pdf=report.references.find((r:any)=>r.id==='upu-kuwait-addressing');assert.equal(pdf.responseDigest,config.references.find((r:any)=>r.id==='upu-kuwait-addressing').expected_digest);assert.equal(pdf.profile.printedEdition,'07/2002');assert.deepEqual(pdf.profile.visuallyReviewedPages,[1]);
  const unavailable=report.references.find((r:any)=>r.id==='kuwait-municipality-parcels');assert.equal(unavailable.failureKind,'curl-network-error');assert.equal(unavailable.sourceDocumentDigest,null);
  assert.equal(report.references.find((r:any)=>r.id==='moc-policy-placeholder').profile.policyContentAvailable,false);
});
test('KW actual partial observation counts do not become national coverage or repaired postal codes',()=>{
  const q=report.uiObservations;assert.equal(q.captureDigest,'sha256:9a75df522dbc872a2e7fd3a40438b8035c869b931a5209bb71586967a1cb763a');assert.equal(q.captureBytes,9825);assert.equal(q.totalSampleRows,28);assert.equal(q.totalInvalidCodes,8);
  assert.deepEqual(q.tables.map((t:any)=>t.advertisedTotal),[4262,1396]);assert.deepEqual(q.tables.map((t:any)=>t.sampleRows),[12,16]);assert.deepEqual(q.tables.map((t:any)=>t.sampleRates.invalidCode),[2/12,6/16]);assert.deepEqual(q.tables[0].invalidObservations.map((r:any)=>r.ordinal),[4261,4262]);assert.deepEqual(q.tables[1].invalidObservations.map((r:any)=>r.ordinal),[1391,1392,1393,1394,1395,1396]);
  for(const t of q.tables){assert.ok(t.invalidObservations.every((r:any)=>r.codeLength===4));assert.equal(t.zeroPaddingPerformed,0);assert.equal(t.coordinateGeometry,'none');assert.equal(t.productionEligible,false);assert.equal(t.rowsDeduplicated,0);}
  assert.equal(q.nationalQuality.invalidCodeRate,null);assert.equal(q.completeNationalSnapshot,false);assert.equal(q.rawHttpDataBytesVerified,false);assert.equal(q.immutableDataArtifact,false);
});
test('KW metadata and sampled assignment observations cannot imply licensed data, buildings or deployment',()=>{
  for(const key of ['sourceRowsPersisted','currentAssignmentRowsValidated','productionGeometryRecords','civicBuildingRelations','publishedDataArtifacts','paidOperations','authenticatedRequests','privateQueries'])assert.equal(report[key],0);
  assert.equal(report.countryM2Achieved,false);assert.equal(report.realAgidRuntimeVerified,false);assert.equal(report.contractAcceptancePerformed,false);assert.equal(report.rightsReview.exact_public_data_artifact_rights_verified,false);
  assert.equal(report.assignmentQuality.missingCodeRate,null);assert.equal(report.assignmentQuality.duplicateAssignmentRate,null);
  assert.doesNotMatch(read(reportPath),/SYN_GOV|SYN_AREA|"rows"\s*:|"records"\s*:|"raw_html"\s*:|owner_name|recipient_name/);
});
test('KW ledger pins the actual report, retains M2 definition and schedules a public-only delayed review',()=>{
  const kw=json('docs/postal-context-m2-rollout.json').countries.find((c:any)=>c.countryCode==='KW');assert.equal(kw.status,'blocked');assert.equal(kw.attempts,1);assert.equal(kw.declaredStage,'M1_metadata');assert.equal(kw.evidence,null);assert.deepEqual(kw.m2Definition,manifest.promotion.stages.find((s:any)=>s.id==='M2_assignment'));
  assert.equal(kw.lastAttempt.reportDigest,'sha256:'+createHash('sha256').update(read(reportPath)).digest('hex'));assert.equal(Date.parse(kw.blocker.retryAfter)-Date.parse(kw.blocker.observedAt),7*86400000);assert.equal(kw.blocker.requiresExplicitApproval,false);assert.match(kw.blocker.retryPolicy,/after all pending.*does not authorize restricted access or publication/);
});
