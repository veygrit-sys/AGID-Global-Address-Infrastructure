import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry,getPreferredPostalSourceIdsForCountry} from './officialPostalSourceCatalog';
const read=(p:string)=>readFileSync(new URL('../../'+p,import.meta.url),'utf8').replaceAll('\r\n','\n');
const json=(p:string)=>JSON.parse(read(p));
const config=json('data/postal_country_packs/kz/postal-context/m2-source-review.json');
const manifest=json('data/postal_country_packs/kz/postal-context/repository-manifest.json');
const reportPath='reports/postal-context-m2/kz-source-review-2026-08-28.json',report=json(reportPath);

test('KZ formalizes its existing typed-assignment and independent-geometry M2 without weakening ten blockers',()=>{
  assert.deepEqual(manifest.promotion.stages.find((s:any)=>s.id==='M2_typed_assignment_geometry'),config.m2_criterion);
  assert.match(config.m2_criterion.definition,/point or area geometry.*current-versus-legacy.*RKA\/building-link review.*actual AGID/);
  assert.equal(config.definition_basis.section,'Promotion');assert.match(config.definition_basis.rule,/pre-existing.*ten hard blockers.*no forced polygon/);
  assert.equal(manifest.promotion.current_stage,'M1_metadata');assert.equal(manifest.promotion.hard_blockers.length,10);
  for(const key of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[key],false);
});
test('KZ eleven official discovery sources do not by themselves assert a strong current assignment',()=>{
  const sources=getOfficialPostalSourcesForCountry('KZ');assert.equal(config.references.length,11);
  for(const r of config.references){const s=sources.find(s=>s.id===r.id)!;assert.ok(s);assert.equal(s.validationReadiness,'metadata-only');assert.ok(!getPreferredPostalSourceIdsForCountry('KZ').includes(s.id));
    for(const input of [{sourceIds:[s.id]},{source:s.label},{url:s.url}])assert.equal(classifyPostalSourceTrust({countryCode:'KZ',...input}).strength,'weak');
  }
  assert.equal(sources.find(s=>s.id==='post-kz')?.trustTier,'authoritative');
});
test('KZ actual legal/PDF receipts pin content and edition, not shells, failures or database footers',()=>{
  assert.equal(report.references.length,11);assert.equal(report.references.filter((r:any)=>r.contentVerified).length,7);
  for(const r of report.references.filter((r:any)=>r.contentVerified)){assert.equal(r.httpStatus,200);assert.equal(r.sourceDocumentDigest,r.responseDigest);assert.match(r.responseDigest,/^sha256:[a-f0-9]{64}$/);assert.equal(r.sourceDataRecords,0);}
  for(const c of config.references.filter((r:any)=>r.kind==='reviewed-legal')){const p=report.references.find((r:any)=>r.id===c.id).profile;assert.equal(p.articleDigest,c.expected_article_digest);assert.equal(p.articleBytes,c.reviewed_article_bytes);assert.deepEqual(p.effectiveDates,c.effective_dates);assert.equal(p.httpLastModifiedIsNotLegalEdition,true);}
  const pdf=report.references.find((r:any)=>r.id==='upu-kazakhstan-addressing-2025');assert.equal(pdf.responseDigest,config.references.find((r:any)=>r.kind==='reviewed-pdf').expected_digest);assert.equal(pdf.profile.printedEdition,'07/2025');assert.deepEqual(pdf.profile.visuallyReviewedPages,[1,2]);
  const shells=report.references.filter((r:any)=>r.status==='application-shell-not-data');assert.equal(shells.length,3);assert.ok(shells.every((r:any)=>!r.contentVerified&&r.sourceDocumentDigest===null&&r.profile.emptyHtmlDoesNotMeanDataAbsent));
  const failed=report.references.find((r:any)=>r.id==='kazakhstan-post-law');assert.equal(failed.failureKind,'curl-tls-verification-failed');assert.equal(failed.sourceDocumentDigest,null);
});
test('KZ public documentation null coordinates and malformed schematic are not live data diagnostics',()=>{
  const p=report.apiDocumentation;assert.equal(p.captureDigest,'sha256:2780a87eedff1cd1158b1351e9a5d2f609b5f634f6d0a16a7a2f8b612b7c0234');assert.equal(p.captureBytes,6940);assert.equal(p.bearerRequired,true);assert.equal(p.documentationExamples,2);assert.equal(p.documentedNullCoordinatePairs,2);assert.equal(p.nullCoordinatePairRate,1);assert.equal(p.declaredStructureParseableJson,false);assert.ok(p.documentedCoordinateTypes.every((t:any)=>t.declaredString));
  for(const k of ['liveRequestsMade','exampleCoordinatesConvertedToZero','exampleCodesImported','exampleAddressesImported','currentAssignmentRowsValidated','productionGeometryRecords'])assert.equal(p[k],0);
  for(const k of ['rawHttpDataBytesVerified','immutableDataArtifact','coordinateReferenceSystemVerified','countryM2Achieved'])assert.equal(p[k],false);
  for(const k of ['sourceRowsPersisted','currentAssignmentRowsValidated','productionGeometryRecords','civicBuildingRelations','publishedDataArtifacts','paidOperations','authenticatedRequests','privateQueries'])assert.equal(report[k],0);
  assert.equal(report.assignmentQuality.missingCodeRate,null);assert.equal(report.assignmentQuality.duplicateAssignmentRate,null);assert.equal(report.realAgidRuntimeVerified,false);assert.equal(report.countryM2Achieved,false);assert.equal(report.contractAcceptancePerformed,false);assert.equal(report.rightsReview.exact_public_data_artifact_rights_verified,false);
  assert.doesNotMatch(read(reportPath),/SYN_KAZ|"rows"\s*:|"records"\s*:|"raw_html"\s*:|owner_name|recipient_name/);
});
test('KZ RKA descriptive length is characters; dual postcode identity and validators are unchanged',()=>{
  const rule=config.references.find((r:any)=>r.id==='kazakhstan-addressing-rules-2026').semantics;assert.equal(rule.rkaLength,16);assert.equal(rule.rkaLengthUnit,'characters');assert.equal(rule.rkaAlphabetVerified,false);assert.equal(rule.rkaIsNotPostcode,true);
  for(const p of ['data/postal_country_packs/kz/postal-context/repository-manifest.json','data/postal_country_packs/kz/postal-context/source-profile.json','src/data/address_formats/asia/central_asia/KZ.json','src/data/address_formats/asia/central_asia/KZ.yaml','docs/postal-context-kazakhstan-runtime.md']){assert.match(read(p),/16-character/);assert.doesNotMatch(read(p),/16-digit/);}
  const f=json('src/data/address_formats/asia/central_asia/KZ.json');assert.equal(f.postalCode.format,'LNNLNLN or NNNNNN');assert.equal(f.postalCode.regex,'^(?:[A-Z]\\d{2}[A-Z]\\d[A-Z]\\d|\\d{6})$');assert.match(manifest.postal_system.geometry_rule,/Neither.*guaranteed.*Never generate/);
});
test('KZ blocked ledger pins real receipts, retains reviewed definition and delays public-only reconsideration',()=>{
  const kz=json('docs/postal-context-m2-rollout.json').countries.find((c:any)=>c.countryCode==='KZ');assert.equal(kz.status,'blocked');assert.equal(kz.attempts,1);assert.equal(kz.declaredStage,'M1_metadata');assert.equal(kz.evidence,null);assert.deepEqual(kz.m2Definition,config.m2_criterion);
  assert.equal(kz.lastAttempt.reportDigest,'sha256:'+createHash('sha256').update(read(reportPath)).digest('hex'));assert.equal(kz.blocker.observedAt,report.completedAt);assert.equal(Date.parse(kz.blocker.retryAfter)-Date.parse(kz.blocker.observedAt),7*86400000);assert.equal(kz.blocker.requiresExplicitApproval,false);assert.match(kz.blocker.retryPolicy,/after all pending.*does not authorize restricted access or publication/);
});
