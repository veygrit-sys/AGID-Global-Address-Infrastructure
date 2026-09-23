import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry,getPreferredPostalSourceIdsForCountry} from './officialPostalSourceCatalog';
import {normalizeLebanonPostalCode} from './postalContextPackRuntime';
const read=(p:string)=>readFileSync(new URL('../../'+p,import.meta.url),'utf8').replaceAll('\r\n','\n');
const json=(p:string)=>JSON.parse(read(p));
const config=json('data/postal_country_packs/lb/postal-context/m2-source-review.json'),manifest=json('data/postal_country_packs/lb/postal-context/repository-manifest.json');
const reportPath='reports/postal-context-m2/lb-source-review-2026-08-28.json',report=json(reportPath);
const byId=(id:string)=>report.references.find((r:any)=>r.id===id);

test('LB formalizes existing assignment and independent geometry gates without promoting data or altering formats',()=>{
  assert.deepEqual(manifest.promotion.stages.find((s:any)=>s.id==='M2_assignment_geometry'),config.m2_criterion);assert.match(config.m2_criterion.definition,/typed assignments.*point, route or area.*CRS\/topology.*privacy.*actual AGID/);assert.equal(config.definition_basis.section,'Promotion');assert.match(config.definition_basis.rule,/eight hard blockers/);assert.equal(manifest.promotion.hard_blockers.length,8);assert.equal(manifest.promotion.current_stage,'M1_metadata');assert.equal(manifest.repository.maturity,'M1_metadata');
  for(const k of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[k],false);
  const f=json('src/data/address_formats/asia/middle_east/LB.json');assert.equal(f.postalCode.regex,'^(?:\\d{4}|\\d{2} \\d{3} \\d{3})$');assert.match(f.postalCode.source,/August 2026/);
  for(const [input,expected] of [['0000','0000'],['٠٠٠٠','0000'],['۰۰۰۰۰۰۰۰','00 000 000'],['００００００００','00 000 000'],['00 000 000','00 000 000']])assert.equal(normalizeLebanonPostalCode(input),expected);
  for(const input of ['0000000000','LB-0000','000-00000'])assert.equal(normalizeLebanonPostalCode(input),null);
});
test('LB all eight official discovery sources remain weak metadata without losing publisher identity',()=>{
  const ids=new Set(config.references.map((r:any)=>r.catalog_source_id??r.id));assert.equal(ids.size,8);const sources=getOfficialPostalSourcesForCountry('LB');
  for(const id of ids){const s=sources.find(s=>s.id===id)!;assert.ok(s);assert.equal(s.validationReadiness,'metadata-only');assert.ok(!getPreferredPostalSourceIdsForCountry('LB').includes(s.id));for(const input of [{sourceIds:[s.id]},{source:s.label},{url:s.url}])assert.equal(classifyPostalSourceTrust({countryCode:'LB',...input}).strength,'weak');}
  assert.equal(sources.find(s=>s.id==='libanpost')?.trustTier,'authoritative');assert.equal(sources.find(s=>s.id==='lebanon-atlas-admin-boundaries-2026')?.trustTier,'official-derived');
});
test('LB live receipts bind fourteen reviewed references, PDF editions and two explicit failures',()=>{
  assert.equal(report.references.length,16);assert.equal(report.references.filter((r:any)=>r.contentVerified).length,14);
  for(const r of report.references.filter((r:any)=>r.contentVerified)){assert.equal(r.httpStatus,200);assert.equal(r.sourceDocumentDigest,r.responseDigest);assert.match(r.responseDigest,/^sha256:[a-f0-9]{64}$/);assert.ok(r.byteLength>0);assert.equal(r.sourceDataRecords,0);}
  for(const ref of config.references.filter((r:any)=>r.kind==='reviewed-pdf')){const r=byId(ref.id);assert.equal(r.responseDigest,ref.expected_digest);assert.equal(r.byteLength,ref.byte_length);assert.deepEqual(r.profile.visuallyReviewedPhysicalPages,ref.visually_reviewed_physical_pages);assert.equal(r.profile.visualReviewBoundByExactBytes,true);}
  const p=byId('upu-lebanon-postcode-formats-2025').profile;assert.deepEqual(p.numericDigitLengths,[4,8]);assert.deepEqual(p.formattedCharacterLengths,[4,10]);assert.equal(p.physicalPages,12);assert.match(p.printedEdition,/August 2026/);assert.equal(byId('upu-lebanon-addressing').profile.printedEdition,'08/2018');
  assert.equal(byId('dlrc-lebanon-cadastre').failureKind,'curl-network-error');assert.equal(byId('lebanon-law-81-2018-personal-data').httpStatus,403);for(const id of ['dlrc-lebanon-cadastre','lebanon-law-81-2018-personal-data'])assert.equal(byId(id).sourceDocumentDigest,null);
});
test('LB form controls and administrative metadata have distinct grains and never create postal/building assignments',()=>{
  const form=byId('libanpost-address-and-nac').profile;assert.deepEqual(form.dropdowns.map((d:any)=>d.nonemptyOptions),[7,26,0,0]);assert.equal(form.controls[1].disabled,true);assert.equal(form.controls[1].maxlength,40);assert.equal(form.valuesPersisted,0);assert.equal(form.optionLabelsPersisted,0);assert.equal(form.browserRuntimeVerified,false);assert.equal(form.disabledAndEmptyDoNotProveAbsence,true);
  assert.equal(byId('libanpost-po-box-page').profile.unavailableListingDoesNotProveServiceAbsence,true);
  for(const id of [2,3,4]){const p=byId('moph-lb-layer-'+id).profile;assert.equal(p.spatialReference.latestWkid,3857);assert.equal(p.pcodeIsNotPostcode,true);assert.equal(p.nonNullableSchemaIsNotMissingRate,true);assert.equal(p.referentialIntegrityVerified,false);assert.equal(p.featureRequestsMade,0);}
  assert.equal(byId('lebanon-atlas-admin-boundaries-2026').profile.spatialReference.latestWkid,4326);
  const p=byId('lb-atlas-item').profile;assert.deepEqual(p.advertisedAdminCounts,[8,26,1627]);assert.equal(p.countsAreMetadataNotQueriedFeatures,true);assert.equal(p.attributedInformationalSharingAdaptationTermsObserved,true);assert.equal(p.legalCadastralAuthoritativeBoundaryUseDisclaimed,true);assert.equal(p.olderPcodeStandardsCaveat,true);assert.equal(p.postalRelationVerified,false);
});
test('LB HDX lineage and licence observations do not equal a verified production artifact',()=>{
  const p=byId('lb-hdx-upstream').profile;assert.equal(p.licenseId,'cc-by-igo');assert.equal(p.documentedDatasetVersion,'02');assert.equal(p.documentedSourceBoundaryDate,'2014-05-02');assert.equal(p.documentedReviewDate,'2025-10-30');assert.equal(p.metadataModificationIsNotBoundaryDate,true);assert.equal(p.resourceCount,4);assert.deepEqual(p.advertisedHashLengths,[8,8,8,32]);assert.equal(p.advertisedHashIsNotVerifiedSha256,true);assert.equal(p.resourceDownloads,0);assert.equal(p.postalRelationVerified,false);
  for(const k of ['sourceRowsPersisted','currentAssignmentRowsValidated','productionGeometryRecords','civicBuildingRelations','publishedDataArtifacts','paidOperations','authenticatedRequests','privateQueries','formSubmissions'])assert.equal(report[k],0);assert.equal(report.assignmentQuality.missingCodeRate,null);assert.equal(report.assignmentQuality.duplicateAssignmentRate,null);assert.equal(report.realAgidRuntimeVerified,false);assert.equal(report.countryM2Achieved,false);assert.equal(report.contractAcceptancePerformed,false);assert.equal(report.rightsReview.exact_public_postal_data_artifact_rights_verified,false);
  const policy=byId('libanpost-privacy-policy').profile;assert.equal(policy.sectionDigest,config.references.find((r:any)=>r.kind==='privacy-section').expected_section_digest);assert.equal(policy.sectionBytes,9191);assert.equal(policy.processingOrPortabilityIsNotRedistributionPermission,true);assert.equal(policy.currentLegalStatusVerified,false);assert.doesNotMatch(read(reportPath),/__VIEWSTATE|"features"\s*:|"records"\s*:|"value"\s*:|"licenseInfo"\s*:|"description"\s*:|"notes"\s*:/);
});
test('LB blocked ledger pins the actual receipt and preserves public-only delayed retry',()=>{
  const c=json('docs/postal-context-m2-rollout.json').countries.find((c:any)=>c.countryCode==='LB');assert.equal(c.status,'blocked');assert.equal(c.attempts,1);assert.equal(c.evidence,null);assert.equal(c.declaredStage,'M1_metadata');assert.deepEqual(c.m2Definition,config.m2_criterion);assert.equal(c.lastAttempt.reportDigest,'sha256:'+createHash('sha256').update(read(reportPath)).digest('hex'));assert.equal(c.blocker.observedAt,report.completedAt);assert.equal(Date.parse(c.blocker.retryAfter)-Date.parse(c.blocker.observedAt),7*86400000);assert.equal(c.blocker.requiresExplicitApproval,false);assert.match(c.blocker.retryPolicy,/after all pending.*does not authorize restricted access or publication/);
});
