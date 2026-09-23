import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {parse} from 'yaml';
import type {AddressFormat} from '../data/address_formats';
import {buildAddressElementFormFields,getAddressElementPostalCodePolicy} from './addressElementCountryForm';
import {normalizePostalContextPostalCode,POSTAL_CONTEXT_COUNTRY_CODES} from './postalContextCountryPolicy';

const read=(file:string)=>JSON.parse(readFileSync(file,'utf8'));
const path='src/data/address_formats/asia/middle_east/PS';
const format=read(path+'.json') as AddressFormat;
const pack='data/postal_country_packs/ps/postal-context/';

test('PS JSON and YAML retain identity and agree on the actual P3/P7 grammar',()=>{
  assert.equal(format.countryCode,'PS');assert.equal(format.name,'Palestine');
  assert.deepEqual(parse(readFileSync(path+'.yaml','utf8')),format);
  const re=new RegExp(format.postalCode!.regex!);
  for(const code of ['P001','P999','P0010001','P9999999'])assert.ok(re.test(code),code);
  for(const code of ['001','10000','A123','P12','P1234','P12345','P123456','P12345678','P126xxxx','Px','p001'])assert.equal(re.test(code),false,code);
  assert.equal(format.addressRules?.postalCode?.required,false);
});

test('PS address input exposes optional textual postcode with room for full P7 including P',()=>{
  const policy=getAddressElementPostalCodePolicy(format);
  assert.equal(policy.available,true);assert.equal(policy.required,false);
  assert.equal(policy.inputMode,'text');assert.equal(policy.characterSlots,8);
  for(const language of ['local','en']){
    const fields=buildAddressElementFormFields(format,language);
    const postcode=fields.find(f=>f.key==='postcode');assert.ok(postcode);
    assert.equal(postcode.maxLength,8);assert.equal(postcode.required,false);
    assert.ok(new RegExp(postcode.pattern!).test('P0010001'));
    assert.ok(new RegExp(postcode.pattern!).test('P001'));
    assert.equal(fields.find(f=>f.key==='houseNumber')?.fixedValue,undefined);
    assert.equal(fields.find(f=>f.key==='building')?.fixedValue,undefined);
  }
});

test('PS country-specific M2 needs official complete P3 geometry, not P7 or synthetic substitution',()=>{
  const manifest=read(pack+'repository-manifest.json'),config=read(pack+'m2-source-review.json');
  const m2=manifest.promotion.stages.find((s:{id:string})=>s.id.startsWith('M2_'));
  assert.deepEqual(m2,config.m2_criterion);
  assert.equal(m2.id,'M2_official_p3_postal_areas');
  assert.match(m2.definition,/current, complete, rights-cleared/);
  assert.match(m2.definition,/immutable.*real PS AGID/);
  assert.equal(manifest.release_scope.contains_production_geometry,false);
  assert.equal(manifest.promotion.data_completion_verified,false);
  assert.equal(manifest.repository.external_repository_created,false);
});

test('PS source review separates observed 2021 relation counts from current production evidence',()=>{
  const report=read('reports/postal-context-m2/ps-source-review-2026-08-28.json');
  const list=report.references.find((r:{id:string})=>r.id==='p3-list').profile;
  assert.equal(list.rows,755);assert.equal(list.distinctP3Codes,603);
  assert.equal(list.sharedCodeGroups,93);assert.equal(list.rowsDropped,0);
  assert.equal(list.emptyFields.Coverage,534);assert.equal(list.currentValidity,null);
  assert.equal(report.references.filter((r:{contentVerified:boolean})=>r.contentVerified).length,6);
  const geometry=report.references.find((r:{id:string})=>r.id==='p3-geometry');
  assert.equal(geometry.sourceDocumentDigest,null);assert.equal(geometry.contentVerified,false);
  assert.equal(report.countryM2Achieved,false);assert.equal(report.productionGeometryRecords,0);
  assert.equal(report.p7ResourcesDownloaded,0);assert.equal(report.realAgidRuntimeVerified,false);
});

test('PS metadata and input fix do not enable an unverified production Postal Context pack',()=>{
  assert.equal((POSTAL_CONTEXT_COUNTRY_CODES as readonly string[]).includes('PS'),false);
  assert.equal(normalizePostalContextPostalCode('PS','P0010001'),null);
  const usage=format.addressRules!.postalCode!.usage;
  assert.match(usage,/suffixes are not house numbers/);
  assert.match(usage,/explicit relations are required/);
});
