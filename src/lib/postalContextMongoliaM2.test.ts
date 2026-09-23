import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {getAsiaOpenSourceIds} from '../data/asiaOpenGeoSources';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry} from './officialPostalSourceCatalog';
import {normalizeMongoliaPostalCode} from './postalContextCountryPolicy';
const json=(p:string)=>JSON.parse(readFileSync(new URL('../../'+p,import.meta.url),'utf8'));
const root='data/postal_country_packs/mn/postal-context/';

test('MN formalizes the retained target, eleven blockers and real-data gates without M2 promotion',()=>{
  const m=json(root+'repository-manifest.json'),c=json(root+'m2-source-review.json');
  assert.equal(m.promotion.target_stage,'M2_source_attested');assert.equal(m.promotion.current_stage,'M1_metadata');assert.equal(m.promotion.hard_blockers.length,11);assert.equal(m.promotion.data_completion_verified,false);
  assert.deepEqual(m.promotion.stages.find((x:{id:string})=>x.id==='M2_source_attested'),c.m2_criterion);
  for(const term of ['Cyrillic','validity','SHA-256','2019/2024','official/derived/virtual/none','immutable','AGID','leading zeroes','Gazar','NSO','buildings'])assert.ok(c.m2_criterion.definition.includes(term));
  assert.equal(m.release_scope.contains_production_geometry,false);assert.equal(m.release_scope.contains_real_addresses,false);
});
test('MN current and historical references coexist; compatibility is not proof or a repeal',()=>{
  const p=json(root+'source-profile.json'),c=json(root+'m2-source-review.json');assert.equal(p.sources.length,13);assert.equal(c.edition_policy.nineDigitRejectionAuthorized,false);
  for(const id of ['zipcode-mn','crc-mongolia-unified-postcode-2019','crc-mongolia-postcode-2025','crc-mongolia-postal-directory-2024'])assert.ok(getAsiaOpenSourceIds('MN').includes(id as 'zipcode-mn'));
  assert.equal(normalizeMongoliaPostalCode('00001'),'00001');assert.equal(normalizeMongoliaPostalCode('００００１－０００２'),'00001-0002');assert.equal(normalizeMongoliaPostalCode('000010002'),'00001-0002');assert.equal(normalizeMongoliaPostalCode('MN-00001'),null);
});
test('MN official labels, URLs and aliases remain metadata only until exact records pass',()=>{
  const sources=getOfficialPostalSourcesForCountry('MN').filter(s=>s.countryCodes.includes('MN'));assert.equal(sources.length,13);
  for(const s of sources){assert.equal(s.validationReadiness,'metadata-only');for(const source of [s.url,s.label])assert.notEqual(classifyPostalSourceTrust({countryCode:'MN',source}).strength,'strong',source);assert.notEqual(classifyPostalSourceTrust({countryCode:'MN',source:'official',url:s.url}).strength,'strong',s.url);}
  for(const source of ['CRC Mongolia zipcode','https://www.crc.gov.mn/shuudan/suudangiin-negdsen-kod-xaiagzuulalt-2'])assert.notEqual(classifyPostalSourceTrust({countryCode:'MN',source}).strength,'strong');
});
test('MN report verifies references, detects count conflict and does not manufacture production evidence',()=>{
  const r=json('reports/postal-context-m2/mn-source-review-2026-08-28.json');assert.equal(r.countryM2Achieved,false);assert.equal(r.currentAssignmentRowsValidated,0);assert.equal(r.publishedDataArtifacts,0);assert.equal(r.realAgidRuntimeVerified,false);assert.equal(r.assignmentQuality.nationalCoverage,null);
  assert.equal(r.references.filter((x:{contentVerified:boolean})=>x.contentVerified).length,13);assert.equal(r.references.filter((x:{status:string})=>x.status==='acquisition-failed').length,5);assert.ok(r.references.every((x:{networkRequestsDuringVerification:number})=>x.networkRequestsDuringVerification===0));
  const byId=new Map(r.references.map((x:{id:string;profile:Record<string,unknown>})=>[x.id,x.profile]));
  assert.equal((byId.get('crc-mongolia-postcode-2025') as {total:number}).total,2721);assert.equal((byId.get('crc-mongolia-postcode-legacy-current-site') as {total:number}).total,2720);
  assert.equal((byId.get('crc-mongolia-postal-directory-2024') as {fullDirectoryRowsValidated:number}).fullDirectoryRowsValidated,0);assert.equal((byId.get('nso-mongolia-administrative-units') as {resultRowsDownloaded:number}).resultRowsDownloaded,0);
});
