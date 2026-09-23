import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import {parse} from 'yaml';
import {ASIA_OPEN_GEO_SOURCES,getAsiaOpenSourceIds} from '../data/asiaOpenGeoSources';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry,getPreferredPostalSourceIdsForCountry} from './officialPostalSourceCatalog';
import {isPostalContextCountryCode} from './postalContextCountryPolicy';

const read=(path:string)=>readFileSync(new URL(`../../${path}`,import.meta.url),'utf8');
const json=(path:string)=>JSON.parse(read(path));
const base='data/postal_country_packs/lk/postal-context/';
const manifest=json(base+'repository-manifest.json'),config=json(base+'m2-source-review.json'),profile=json(base+'source-profile.json');
const reportPath='reports/postal-context-m2/lk-source-review-2026-08-28.json';
const report=json(reportPath);
test('LK M1 contract defines real assignment M2 without enabling runtime',()=>{
  assert.equal(manifest.repository.country_code,'LK');assert.equal(manifest.promotion.current_stage,'M1_metadata');
  assert.equal(manifest.release_scope.metadata_only,true);
  for(const field of ['contains_raw_source_data','contains_real_addresses','contains_personal_data','contains_production_geometry'])assert.equal(manifest.release_scope[field],false);
  assert.deepEqual(manifest.promotion.stages.find((s:{id:string})=>s.id.startsWith('M2')),config.m2_criterion);
  assert.equal(config.definition_basis.previous_m2_definition,null);
  assert.match(config.m2_criterion.definition,/real scoped records.*actual AGID/);
  assert.equal(isPostalContextCountryCode('LK'),false);assert.equal(isPostalContextCountryCode('JP'),true);
});
test('LK metadata references cannot inherit assignment authority from URLs, IDs or aliases',()=>{
  const sources=getOfficialPostalSourcesForCountry('LK'),preferred=getPreferredPostalSourceIdsForCountry('LK');
  for(const ref of config.references){
    const source=sources.find(s=>s.id===ref.id);assert.ok(source,ref.id);
    assert.equal(source.validationReadiness,'metadata-only');assert.ok(!preferred.includes(ref.id));
    for(const input of [{sourceIds:[ref.id]},{url:ref.url},{source:source.label},{source:'UPU',url:ref.url}])assert.equal(classifyPostalSourceTrust({countryCode:'LK',...input}).strength,'weak',JSON.stringify(input));
    assert.ok(!getOfficialPostalSourcesForCountry('LB').some(s=>s.id===ref.id));
  }
  for(const source of ['slpost','Sri Lanka Post','Sri Lanka Post Code Search'])assert.equal(classifyPostalSourceTrust({countryCode:'LK',source}).strength,'weak');
});
test('LK country source registry preserves OSM while marking official references metadata-only',()=>{
  const ids=getAsiaOpenSourceIds('LK');assert.ok(ids.includes('osm-sri-lanka'));
  assert.equal(ASIA_OPEN_GEO_SOURCES['osm-sri-lanka'].license,'ODbL');
  for(const source of profile.sources){assert.equal(source.bundled_here,false);assert.equal(source.redistribution_rights,'unverified');assert.ok(ids.includes(source.open_source_id));}
  for(const id of ids.filter(id=>id.startsWith('sri-lanka-')||['slpost','slpost-postcode-search','survey-department-sri-lanka','data-gov-lk'].includes(id)))assert.equal(ASIA_OPEN_GEO_SOURCES[id].usage,'reference');
});
test('LK format preserves five-digit strings and languages, without a fictional machine API',()=>{
  const path='src/data/address_formats/asia/south_asia/LK',j=json(path+'.json'),y=parse(read(path+'.yaml'));
  assert.deepEqual(j,y);assert.equal(j.postalCode.regex,'^\\d{5}$');assert.equal(j.postalCode.api,'https://slpost.gov.lk/postcode_new/');assert.match(j.postalCode.source,/public HTML.*no verified machine API/);
  const regex=new RegExp(j.postalCode.regex);assert.ok(regex.test('00007'));assert.ok(!regex.test('7'));assert.ok(!regex.test('000007'));assert.ok(!regex.test('00A07'));
  assert.deepEqual(j.addressRules.languages.map((l:{code:string})=>l.code),['si','ta','en']);
  assert.deepEqual(j.openSourceIds,j.addressRules.openSourceIds);
  for(const id of getAsiaOpenSourceIds('LK'))assert.ok(j.openSourceIds.includes(id));
});
test('LK separates postal, administration, civic/building and AGID evidence',()=>{
  assert.deepEqual(manifest.identifier_namespaces.map((n:{id:string})=>n.id),['sri_lanka_postcode','sri_lanka_administrative']);
  assert.deepEqual(manifest.authority_model.geometry_authority,['official','derived','virtual','none']);
  assert.ok(manifest.promotion.m2_required_evidence.includes('independent-permitted-civic-building-relations-before-display'));
  assert.ok(manifest.promotion.hard_blockers.includes('proximity-or-model-used-as-civic-building-proof'));
  assert.match(profile.address_display.building,/no nearest-building/);
  assert.match(profile.data_minimization.future_intake_rule,/not outFields=\*/);
  assert.ok(profile.data_minimization.excluded_fields.includes('gnd_officer_phone'));
});
test('LK recorded source checks prove reference bodies only, not M2 data',()=>{
  assert.deepEqual(report.references.map((r:{id:string})=>r.id),config.references.map((r:{id:string})=>r.id));
  assert.equal(report.references.filter((r:{contentVerified:boolean})=>r.contentVerified).length,13);
  for(const ref of report.references){
    assert.ok(Number.isFinite(Date.parse(ref.observedAt)));
    if(ref.contentVerified){assert.equal(ref.sourceDocumentDigest,ref.responseDigest);const expected=config.references.find((r:{id:string})=>r.id===ref.id);if(expected.kind==='reviewed-section')assert.equal(ref.profile.sectionDigest,expected.expected_section_digest);else assert.equal(ref.responseDigest,expected.expected_digest);}
    else assert.equal(ref.sourceDocumentDigest,null);
    assert.equal(ref.sourceDataRecords,0);
  }
  for(const key of ['sourceRowsPersisted','currentAssignmentRowsValidated','productionGeometryRecords','civicBuildingRelations','publishedDataArtifacts','paidOperations','authenticatedRequests','privateQueries','featureQueries','formSubmissions'])assert.equal(report[key],0);
  assert.equal(report.countryM2Achieved,false);assert.equal(report.realAgidRuntimeVerified,false);
  assert.equal(report.assignmentQuality.missingCodeRate,null);
});
test('LK observed selector totals and schemas cannot claim national coverage or postal polygons',()=>{
  const p=report.references.find((r:{id:string})=>r.id==='slpost-postcode-search').profile;
  assert.deepEqual(p.forms.map((f:{candidateOptions:number})=>f.candidateOptions),[2111,2111]);
  assert.deepEqual(p.forms.map((f:{leadingZeroCodes:number})=>f.leadingZeroCodes),[5,5]);
  assert.equal(p.codeSetsEqual,true);assert.equal(p.nationalCoverageVerified,false);
  const layers=report.references.filter((r:{id:string})=>r.id.startsWith('nsdi-admin-'));
  assert.deepEqual(layers.map((r:{profile:{fieldCount:number}})=>r.profile.fieldCount),[31,12,10,10,8]);
  assert.ok(layers.every((r:{profile:{postalNamedFieldCount:number,postalRelationVerified:boolean}})=>r.profile.postalNamedFieldCount===0&&!r.profile.postalRelationVerified));
  assert.deepEqual(layers[0].profile.personalContactFieldNames,['gnd_officer_name','gnd_officer_phone']);
});
test('LK ledger binds current report bytes and leaves M2 evidence absent',()=>{
  const row=json('docs/postal-context-m2-rollout.json').countries.find((c:{countryCode:string})=>c.countryCode==='LK');
  assert.equal(row.status,'blocked');assert.equal(row.declaredStage,'M1_metadata');assert.equal(row.evidence,null);
  assert.deepEqual(row.m2Definition,config.m2_criterion);
  assert.equal(row.lastAttempt.report,reportPath);
  assert.equal(row.lastAttempt.reportDigest,'sha256:'+createHash('sha256').update(read(reportPath)).digest('hex'));
  assert.equal(row.blocker.requiresExplicitApproval,false);
  assert.ok(Date.parse(row.blocker.retryAfter)>Date.parse(row.blocker.observedAt));
});
