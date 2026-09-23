import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const root=new URL('../',import.meta.url); const readJson=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const ky=readJson('src/data/address_formats/americas/caribbean/KY.json'); const hierarchy=readJson('src/data/address_hierarchy/americas.json'); const yaml=readFileSync(new URL('src/data/address_formats/americas/caribbean/KY.yaml',root),'utf8');
test('KY metadata follows the official P.O. Box, island and integral postcode form',()=>{
  assert.equal(ky.postalCode.format,'KYN-NNNN'); assert.equal(ky.postalCode.regex,'^KY\\d-\\d{4}$'); assert.equal(ky.postalCode.api,null);
  for(const format of [ky.native,ky.english]){assert.deepEqual(format.fields.map(x=>x.key),['organization','poBox','state','postcode']); assert.equal(format.fields.find(x=>x.key==='poBox').required,true); assert.equal(format.fields.find(x=>x.key==='state').placeholder,'Grand Cayman'); assert.match(format.addressFormat,/\{\{state\}\}  \{\{postcode\}\}/); assert.doesNotMatch(format.addressFormat,/street|houseNumber|city/);}
  const matches=[]; const visit=value=>{if(!value||typeof value!=='object')return;if(value.countryCode==='KY')matches.push(value);else Object.values(value).forEach(visit)}; visit(hierarchy); assert.equal(matches.length,1); assert.deepEqual(matches[0],ky);
});
test('KY YAML preserves delivery and no-proxy semantics',()=>{assert.match(yaml,/format: KYN-NNNN\r?\n  regex: \^KY\\d-\\d\{4\}\$/); assert.match(yaml,/key: poBox/); assert.match(yaml,/ordinary street-only address is undeliverable/); assert.match(yaml,/Company unique postcodes are non-area/); assert.match(yaml,/AGID remains an independent spatial index/);});
