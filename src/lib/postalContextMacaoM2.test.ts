import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {getAsiaOpenSourceIds} from '../data/asiaOpenGeoSources';
import {classifyPostalSourceTrust,getOfficialPostalSourcesForCountry} from './officialPostalSourceCatalog';
import {isPostalContextCountryCode,normalizePostalContextPostalCode} from './postalContextCountryPolicy';
const json=(p:string)=>JSON.parse(readFileSync(new URL('../../'+p,import.meta.url),'utf8')),root='data/postal_country_packs/mo/postal-context/';
test('MO no-postcode identity and scoped real-address criterion never invent postal regions',()=>{
  const m=json(root+'repository-manifest.json'),c=json(root+'m2-source-review.json');assert.equal(m.repository.country_code,'MO');assert.equal(m.repository.country_name,'Macau');assert.equal(m.promotion.current_stage,'M1_metadata');assert.equal(m.promotion.target_stage,'M2_scoped_address_context');assert.deepEqual(m.promotion.stages.find((s:{id:string})=>s.id==='M2_scoped_address_context'),c.m2_criterion);assert.equal(m.postal_system.postal_code,null);assert.equal(m.postal_system.official_postal_geometry,'none');assert.equal(m.promotion.hard_blockers.length,9);assert.equal(m.promotion.data_completion_verified,false);
  for(const term of ['rights-cleared','Traditional Chinese/Portuguese','SHA-256','000000','2026-06-01','immutable','AGID','House numbers','Synthetic'])assert.ok(c.m2_criterion.definition.includes(term));
});
test('MO existing address fields and no-postcode runtime exclusion are preserved',()=>{
  const f=json('src/data/address_formats/asia/east_asia/MO.json');assert.equal(f.postalCode.format,'None');assert.equal(f.postalCode.regex,null);assert.equal(f.postalCode.api,null);assert.equal(f.addressRules.postalCode,null);assert.deepEqual(f.addressRules.languages.map((l:{code:string})=>l.code),['zh-Hant','pt']);assert.deepEqual(f.native.fields.map((x:{key:string})=>x.key),['city','street','houseNumber','organization']);
  assert.equal(isPostalContextCountryCode('MO'),false);for(const value of ['000000','853','999078','MO-virtual',null])assert.equal(normalizePostalContextPostalCode('MO',value),null);
});
test('MO legacy source IDs and new authority references remain metadata-only for address trust',()=>{
  for(const id of ['dscc-macao','geoguide-macao','osm-macau','ctt-macao-no-postcode','dsscu-macao','macao-dsscu-regulation-2026','macao-mapping-reproduction-2026'])assert.ok(getAsiaOpenSourceIds('MO').includes(id as 'dscc-macao'));
  const sources=getOfficialPostalSourcesForCountry('MO').filter(x=>x.countryCodes.includes('MO'));assert.equal(sources.length,8);
  for(const s of sources){assert.equal(s.validationReadiness,'metadata-only');for(const source of [s.url,s.label])assert.notEqual(classifyPostalSourceTrust({countryCode:'MO',source}).strength,'strong',source);assert.notEqual(classifyPostalSourceTrust({countryCode:'MO',source:'official',url:s.url}).strength,'strong');}
});
test('MO evidence distinguishes real policy, failed acquisition and duplicated HTML shells',()=>{
  const r=json('reports/postal-context-m2/mo-source-review-2026-08-28.json');assert.equal(r.references.filter((x:{contentVerified:boolean})=>x.contentVerified).length,6);assert.equal(r.references.filter((x:{status:string})=>x.status==='html-shell-not-reviewed-content').length,4);assert.equal(r.references.filter((x:{status:string})=>x.status==='acquisition-failed').length,3);assert.equal(r.countryM2Achieved,false);assert.equal(r.publishedDataArtifacts,0);assert.equal(r.realAgidRuntimeVerified,false);assert.equal(r.currentAddressRowsValidated,0);assert.equal(r.quality.postalCodeMissingness,'not-applicable-no-postcode-system');assert.equal(r.quality.nationalCoverage,null);
  const refs=new Map(r.references.map((x:{id:string;responseDigest?:string})=>[x.id,x.responseDigest]));assert.equal(refs.get('dsscu-macao'),refs.get('dsscu-macao-history'));assert.equal(refs.get('macao-data-portal'),refs.get('macao-data-terms'));
  assert.ok(r.references.every((x:{networkRequestsDuringVerification:number})=>x.networkRequestsDuringVerification===0));assert.equal(r.rightsGate.mapping_reproduction_permission_obtained,false);assert.equal(r.rightsGate.automated_feature_or_address_queries_enabled,false);
});
