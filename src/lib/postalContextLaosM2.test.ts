import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry,getPreferredPostalSourceIdsForCountry} from './officialPostalSourceCatalog';
const read=(p:string)=>readFileSync(new URL('../../'+p,import.meta.url),'utf8').replaceAll('\r\n','\n');
const json=(p:string)=>JSON.parse(read(p));
const config=json('data/postal_country_packs/la/postal-context/m2-source-review.json'),manifest=json('data/postal_country_packs/la/postal-context/repository-manifest.json');
const reportPath='reports/postal-context-m2/la-source-review-2026-08-28.json',report=json(reportPath);

test('LA preserves existing independent-geometry M2 conditions, eight blockers and five-digit syntax',()=>{
  assert.deepEqual(manifest.promotion.stages.find((s:any)=>s.id==='M2_assignment_geometry'),config.m2_criterion);assert.match(config.m2_criterion.definition,/point, route or area geometry.*CRS\/topology.*privacy.*actual AGID/);assert.equal(config.definition_basis.section,'Promotion');assert.match(config.definition_basis.rule,/eight hard blockers/);assert.equal(manifest.promotion.current_stage,'M1_metadata');assert.equal(manifest.promotion.hard_blockers.length,8);
  for(const key of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[key],false);
  const f=json('src/data/address_formats/asia/southeast_asia/LA.json');assert.equal(f.postalCode.format,'NNNNN');assert.equal(f.postalCode.regex,'^\\d{5}$');assert.match(manifest.postal_system.geometry_rule,/point, route or non-area/);
});
test('LA seven official catalog sources do not themselves prove strong current assignments',()=>{
  const sources=getOfficialPostalSourcesForCountry('LA');assert.equal(new Set(config.references.map((r:any)=>r.catalog_source_id??r.id)).size,7);assert.equal(config.references.length,11);
  for(const r of config.references){const s=sources.find(s=>s.id===(r.catalog_source_id??r.id))!;assert.ok(s);assert.equal(s.validationReadiness,'metadata-only');assert.ok(!getPreferredPostalSourceIdsForCountry('LA').includes(s.id));for(const input of [{sourceIds:[s.id]},{source:s.label},{url:s.url}])assert.equal(classifyPostalSourceTrust({countryCode:'LA',...input}).strength,'weak');}
  assert.equal(sources.find(s=>s.id==='lao-post-postcode')?.trustTier,'authoritative');
});
test('LA verified reference receipts bind legal section and both wiki revisions, not shells or failed documents',()=>{
  assert.equal(report.references.length,11);assert.equal(report.references.filter((r:any)=>r.contentVerified).length,8);
  for(const r of report.references.filter((r:any)=>r.contentVerified)){assert.equal(r.httpStatus,200);assert.equal(r.sourceDocumentDigest,r.responseDigest);assert.match(r.responseDigest,/^sha256:[a-f0-9]{64}$/);assert.equal(r.sourceDataRecords,0);}
  for(const r of config.references.filter((r:any)=>r.kind==='wiki-article')){const p=report.references.find((x:any)=>x.id===r.id).profile;assert.equal(p.articleDigest,r.expected_article_digest);assert.equal(p.articleBytes,r.reviewed_article_bytes);assert.equal(p.revision,1784);}
  assert.equal(report.currentAndLinkedWikiRevisionMatch,true);const law=report.references.find((r:any)=>r.id==='laos-postal-service-law-2013').profile;assert.equal(law.sectionDigest,config.references.find((r:any)=>r.kind==='legal-section').expected_section_digest);assert.equal(law.sectionBytes,1582);assert.equal(law.currentLegalStatusVerified,false);assert.equal(law.effectiveDate,null);assert.equal(law.translationSupersessionWordingNeedsReview,true);
  const shell=report.references[0];assert.equal(shell.contentVerified,false);assert.equal(shell.profile.emptyHtmlDoesNotMeanDataAbsent,true);assert.equal(shell.sourceDocumentDigest,null);
  for(const id of ['laolandreg-laos','laos-electronic-data-law']){const r=report.references.find((r:any)=>r.id===id);assert.equal(r.contentVerified,false);assert.equal(r.sourceDocumentDigest,null);assert.equal(r.status,'review-failed');}
});
test('LA public samples have explicit observation grain and no automatic range expansion, deduplication or repair',()=>{
  const p=report.operatorObservation;assert.equal(p.captureDigest,'sha256:2861fe4fde5d768de6aef60fdc021b8f80be9f443bb22e16cb0a605f8b8ed958');assert.equal(p.captureBytes,3987);assert.equal(p.regionCards.length,18);assert.equal(p.advertisedRegionalRowSum,8172);assert.equal(p.uniqueNationalPostcodes,null);assert.equal(p.sampleRows,10);assert.equal(p.sampleRegionAdvertisedRows,457);assert.equal(p.uniqueObservedCodes,1);assert.equal(p.distinctObservedRowTexts,10);assert.equal(p.duplicateRowTextExcess,0);assert.equal(p.repeatedCodesAreNotDuplicateAssignments,true);assert.equal(p.leadingZeroRows,10);assert.equal(p.zeroPaddingPerformed,0);assert.equal(p.sampleRowsDeduplicated,0);assert.equal(p.loadMorePresent,true);assert.equal(p.completeNationalSnapshot,false);assert.equal(p.immutableDataArtifact,false);assert.equal(p.rawHttpDataBytesVerified,false);
  const w=report.references.find((r:any)=>r.id==='laopedia-laos-postcodes').profile;assert.equal(w.geographicHeadings,3);assert.equal(w.headingsWithoutDetailLists,2);assert.equal(w.explicitZoneRows,5);assert.equal(w.statedRangeCardinality,7);assert.equal(w.rangeIsNotExpanded,true);assert.equal(w.missingVillageDetailRate,.4);assert.equal(w.villageTokenObservations,27);assert.equal(w.duplicateVillageTokenExcessWithinRows,1);assert.equal(w.unclosedVillageLists,1);assert.equal(w.rowsRepaired,0);
});
test('LA administrative metadata and PCode never become postal authority, buildings or production data',()=>{
  const layers=report.references.filter((r:any)=>r.profile?.layerId);assert.equal(layers.length,4);for(const r of layers){const p=r.profile;assert.equal(p.spatialReference.latestWkid,3857);assert.equal(p.postalRelationVerified,false);assert.equal(p.rightsVerified,false);assert.equal(p.featureRequestsMade,0);assert.equal(p.productionGeometryRecords,0);}
  assert.equal(layers.find((r:any)=>r.profile.layerId===245).profile.declaredGeometryType,null);assert.equal(layers.find((r:any)=>r.profile.layerId===247).profile.pcodeFieldPresent,true);
  for(const k of ['sourceRowsPersisted','currentAssignmentRowsValidated','productionGeometryRecords','civicBuildingRelations','publishedDataArtifacts','paidOperations','authenticatedRequests','privateQueries'])assert.equal(report[k],0);
  assert.equal(report.assignmentQuality.missingCodeRate,null);assert.equal(report.assignmentQuality.duplicateAssignmentRate,null);assert.equal(report.realAgidRuntimeVerified,false);assert.equal(report.countryM2Achieved,false);assert.equal(report.contractAcceptancePerformed,false);assert.equal(report.rightsReview.exact_public_data_artifact_rights_verified,false);assert.doesNotMatch(read(reportPath),/"paragraphs"\s*:|"mainText"\s*:|"rows"\s*:|"records"\s*:|owner_name|recipient_name/);
});
test('LA blocked ledger pins actual receipt digest, unchanged criterion and public-only delayed retry',()=>{
  const c=json('docs/postal-context-m2-rollout.json').countries.find((c:any)=>c.countryCode==='LA');assert.equal(c.status,'blocked');assert.equal(c.attempts,1);assert.equal(c.declaredStage,'M1_metadata');assert.equal(c.evidence,null);assert.deepEqual(c.m2Definition,config.m2_criterion);assert.equal(c.lastAttempt.reportDigest,'sha256:'+createHash('sha256').update(read(reportPath)).digest('hex'));assert.equal(c.blocker.observedAt,report.completedAt);assert.equal(Date.parse(c.blocker.retryAfter)-Date.parse(c.blocker.observedAt),7*86400000);assert.equal(c.blocker.requiresExplicitApproval,false);assert.match(c.blocker.retryPolicy,/after all pending.*does not authorize restricted access or publication/);
});
