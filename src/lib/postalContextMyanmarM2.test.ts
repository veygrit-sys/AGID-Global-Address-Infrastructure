import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {ASIA_OPEN_GEO_SOURCES,getAsiaOpenSourceIds} from '../data/asiaOpenGeoSources';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry} from './officialPostalSourceCatalog';

const json=(path:string)=>JSON.parse(readFileSync(new URL('../../'+path,import.meta.url),'utf8'));
const base='data/postal_country_packs/mm/postal-context/';
test('MM formalizes the existing M2 target without relaxing twelve legacy blockers or promoting synthetic data',()=>{
  const m=json(base+'repository-manifest.json'),config=json(base+'m2-source-review.json');
  assert.equal(m.promotion.target_stage,'M2_source_attested');assert.equal(m.promotion.current_stage,'M1_metadata');assert.equal(m.promotion.data_completion_verified,false);assert.equal(m.promotion.hard_blockers.length,12);
  assert.deepEqual(m.promotion.stages.find((s:{id:string})=>s.id==='M2_source_attested'),config.m2_criterion);
  for(const term of ['seven-character','validity','SHA-256','CRS/topology','official/derived/virtual/none','immutable','AGID','leading zeroes','MIMU','buildings'])assert.ok(config.m2_criterion.definition.includes(term));
  assert.equal(m.release_scope.contains_real_addresses,false);assert.equal(m.release_scope.contains_production_geometry,false);
});
test('MM permission-gates every MIMU source, preserves historical identifiers and corrects the terms reference',()=>{
  const p=json(base+'source-profile.json');assert.equal(p.sources.length,9);
  for(const s of p.sources.filter((s:{source_id:string})=>s.source_id.startsWith('mimu-'))){assert.equal(s.automated_access.enabled,false);assert.equal(s.automated_access.provider_written_permission_obtained,false);}
  const places=p.sources.find((s:{source_id:string})=>s.source_id==='mimu-place-codes-v9-6-2025');assert.equal(places.version_review.listed_version,'9.7');assert.equal(places.version_review.actual_release_rows_acquired,false);
  assert.ok(getAsiaOpenSourceIds('MM').includes('mimu-place-codes-v9-6-2025'));
  assert.equal(ASIA_OPEN_GEO_SOURCES['mimu-terms-and-conditions'].url,'https://www.themimu.info/mimu-terms-conditions');assert.equal(ASIA_OPEN_GEO_SOURCES['ycdc-land-building-services'].coverage,'subnational');
});
test('MM source URL, source name and old terms URL alone never establish an exact assignment or building',()=>{
  const sources=getOfficialPostalSourcesForCountry('MM').filter(s=>s.countryCodes.includes('MM'));
  for(const s of sources){assert.equal(s.validationReadiness,'metadata-only');for(const source of [s.url,s.label]){const trust=classifyPostalSourceTrust({countryCode:'MM',source});assert.notEqual(trust.strength,'strong',source);}}
  assert.notEqual(classifyPostalSourceTrust({countryCode:'MM',source:'https://www.themimu.info/about-us'}).strength,'strong');
});
test('MM source report keeps real-data and publication gates unsatisfied and historical metadata separate',()=>{
  const report=json('reports/postal-context-m2/mm-source-review-2026-08-28.json');
  assert.equal(report.countryM2Achieved,false);assert.equal(report.mode,'offline-verification-of-initial-preflight');assert.equal(report.currentAssignmentRowsValidated,0);assert.equal(report.publishedDataArtifacts,0);assert.equal(report.realAgidRuntimeVerified,false);assert.equal(report.assignmentQuality.duplicateAssignmentRate,null);
  assert.equal(report.references.filter((r:{contentVerified:boolean})=>r.contentVerified).length,7);assert.equal(report.references.filter((r:{status:string})=>r.status==='acquisition-failed').length,3);
  assert.ok(report.references.every((r:{networkRequestsDuringVerification:number})=>r.networkRequestsDuringVerification===0));
  const pc=report.references.find((r:{id:string})=>r.id==='mimu-place-codes-v9-6-2025');assert.equal(pc.profile.withCoordinates,54604);assert.equal(pc.profile.dataRowsInspected,0);assert.equal(pc.profile.nationalPostalCoverageVerified,false);
});
