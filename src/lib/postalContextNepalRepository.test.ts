import assert from 'node:assert/strict';import {test} from 'node:test';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {parse} from 'yaml';
import {ASIA_OPEN_GEO_SOURCES,getAsiaOpenSourceIds} from '../data/asiaOpenGeoSources';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry,getPreferredPostalSourceIdsForCountry} from './officialPostalSourceCatalog';
import {isPostalContextCountryCode} from './postalContextCountryPolicy';
const read=(path:string)=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');const json=(path:string)=>JSON.parse(read(path));
const root='data/postal_country_packs/np/postal-context/',manifest=json(root+'repository-manifest.json'),config=json(root+'m2-source-review.json'),profile=json(root+'source-profile.json');
const reportPath='reports/postal-context-m2/np-source-review-2026-08-28.json',report=json(reportPath);
test('NP has its own unfulfilled M2 criterion, not automatic runtime enablement',()=>{
  assert.equal(manifest.repository.country_code,'NP');assert.equal(manifest.promotion.current_stage,'M1_metadata');assert.equal(manifest.release_scope.metadata_only,true);
  for(const field of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[field],false);
  assert.deepEqual(manifest.promotion.stages.find((s:{id:string})=>s.id.startsWith('M2')),config.m2_criterion);assert.equal(config.definition_basis.previous_m2_definition,null);assert.equal(isPostalContextCountryCode('NP'),false);
});
test('NP country format admits five/seven digits but preserves legacy ambiguity and language fields',()=>{
  const path='src/data/address_formats/asia/south_asia/NP',j=json(path+'.json'),y=parse(read(path+'.yaml'));assert.deepEqual(j,y);
  const regex=new RegExp(j.postalCode.regex);for(const s of ['12345','1234501','00123','0012301'])assert.ok(regex.test(s));for(const s of ['1234','123456','12345678','१२३४५','１２３４５','12345-01'])assert.ok(!regex.test(s));
  assert.match(j.postalCode.source,/no verified machine API.*Legacy/);assert.deepEqual(j.addressRules.languages.map((l:{code:string})=>l.code),['ne','en']);assert.equal(j.addressRules.openSourceIds,undefined);
  assert.equal(j.english.fields.find((f:{key:string})=>f.key==='houseNumber').required,false);for(const id of getAsiaOpenSourceIds('NP'))assert.ok(j.openSourceIds.includes(id));
});
test('NP precise metadata URLs, aliases and IDs cannot confer strong assignment authority',()=>{
  const sources=getOfficialPostalSourcesForCountry('NP').filter(s=>s.countryCodes.includes('NP')),preferred=getPreferredPostalSourceIdsForCountry('NP');assert.equal(sources.length,11);
  for(const ref of config.references){const source=sources.find(s=>s.id===ref.source_id);assert.ok(source);assert.equal(source.validationReadiness,'metadata-only');assert.ok(!preferred.includes(source.id));for(const input of [{sourceIds:[source.id]},{url:ref.url},{source:ref.url},{source:source.label},{source:'UPU',url:ref.url}])assert.equal(classifyPostalSourceTrust({countryCode:'NP',...input}).strength,'weak',JSON.stringify(input));}
  for(const source of ['Nepal Post','Nepal Postal Service Postcode','General Post Office Nepal'])assert.equal(classifyPostalSourceTrust({countryCode:'NP',source}).strength,'weak');
});
test('NP registry maintains community licence and separates official-source discovery from data readiness',()=>{
  assert.equal(ASIA_OPEN_GEO_SOURCES['osm-nepal'].license,'ODbL');const ids=getAsiaOpenSourceIds('NP');
  for(const s of profile.sources){assert.ok(ids.includes(s.open_source_id));assert.equal(s.bundled_here,false);assert.equal(s.redistribution_rights,'unverified');assert.equal(ASIA_OPEN_GEO_SOURCES[s.open_source_id as keyof typeof ASIA_OPEN_GEO_SOURCES].usage,'reference');}
});
test('NP keeps federal office/ward, legacy and administrative identities separate',()=>{
  assert.deepEqual(manifest.identifier_namespaces.map((n:{id:string})=>n.id),['nepal_legacy_postcode','nepal_federal_local_unit','nepal_federal_ward','nepal_administrative']);assert.deepEqual(manifest.authority_model.geometry_authority,['official','derived','virtual','none']);
  assert.ok(manifest.promotion.hard_blockers.includes('legacy-federal-five-digit-code-collision'));assert.ok(manifest.promotion.m2_required_evidence.includes('independent-permitted-civic-building-relations-before-display'));assert.match(profile.address_display.building,/no nearest-building/);
});
test('NP records actual reference observations and structural totals without claiming M2',()=>{
  assert.equal(report.references.length,11);assert.equal(report.references.filter((r:{contentVerified:boolean})=>r.contentVerified).length,8);assert.equal(report.references.filter((r:{status:string})=>r.status==='acquisition-failed').length,2);
  for(const r of report.references){const ref=config.references.find((c:{id:string})=>c.id===r.id);assert.equal(r.url,ref.url);assert.equal(r.observedAt,ref.reviewed_observed_at);if(r.responseDigest)assert.equal(r.responseDigest,ref.reviewed_digest);}
  const q=report.assignmentQuality;assert.equal(q.observedLocalUnitRows,753);assert.equal(q.structurallyValidRows,753);assert.equal(q.headingRows,84);assert.equal(q.distinctOfficeCodes,753);assert.equal(q.provinceDistrictKeys,77);assert.equal(q.arithmeticWardCandidatesFromValidRows,6743);assert.equal(q.materializedWardRecords,0);assert.equal(q.repeatedLocalityLabelsAcrossContexts,13);assert.deepEqual(q.issues,[]);
  assert.equal(report.countryM2Achieved,false);assert.equal(report.realAgidRuntimeVerified,false);assert.equal(q.currentAssignmentValidityVerified,false);assert.equal(q.nationalCoverageIndependentlyVerified,false);assert.equal(report.edition.sourceEffectiveDates,null);
  for(const key of ['sourceRowValuesPersistedInGit','licensedProductionAssignments','productionGeometryRecords','civicBuildingRelations','publishedImmutableArtifacts','authenticatedRequests','featureQueries','paidOperations'])assert.equal(report[key],0);
});
test('NP PDF reviews distinguish printed editions, metadata and incomplete row validation',()=>{
  const upu=report.references.find((r:{id:string})=>r.id==='upu-np').profile;assert.equal(upu.printedEdition,'06/2012');assert.equal(upu.examplesImported,0);
  const federal=report.references.find((r:{id:string})=>r.id==='rasuwa-federal-pdf').profile;assert.equal(federal.completePdfRowsParsed,false);assert.equal(federal.htmlPdfRowParityVerified,false);
  const directive=report.references.find((r:{id:string})=>r.id==='survey-directive-pdf').profile;assert.deepEqual(directive.visuallyReviewedPages,[5,18]);assert.equal(directive.notABlanketOpenDataLicense,true);assert.equal(directive.currentProductApplicabilityVerified,false);
});
test('NP blocked ledger hashes actual report bytes, keeps evidence empty and specifies retry conditions',()=>{
  const row=json('docs/postal-context-m2-rollout.json').countries.find((c:{countryCode:string})=>c.countryCode==='NP');assert.equal(row.status,'blocked');assert.equal(row.evidence,null);assert.deepEqual(row.m2Definition,config.m2_criterion);assert.equal(row.lastAttempt.report,reportPath);assert.equal(row.lastAttempt.reportDigest,'sha256:'+createHash('sha256').update(read(reportPath)).digest('hex'));assert.ok(Date.parse(row.blocker.retryAfter)>Date.parse(row.blocker.observedAt));assert.equal(row.blocker.requiresExplicitApproval,false);
});
