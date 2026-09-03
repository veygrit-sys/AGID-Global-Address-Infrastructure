import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root=new URL('../',import.meta.url);
const json=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const address=json('src/data/address_formats/africa/central_africa/CM.json');
const hierarchy=json('src/data/address_hierarchy/africa.json');
const country=Object.values(hierarchy.subregions).flatMap(region=>region.countries).find(item=>item.code==='CM');

test('CM metadata represents no postcode and keeps BP inside the address object',()=>{
 assert.equal(address.postalCode.format,null); assert.equal(address.postalCode.regex,null);
 assert.deepEqual(address.addressRules.nativeOrder,['recipient','street','city','country']);
 assert.equal(address.addressRules.postalCode,null);
 assert.equal(address.native.fields.some(field=>field.key==='postalCode'),false);
 assert.match(address.native.fields.find(field=>field.key==='street').placeholder,/BP/);
 for(const id of ['upu-cameroon-no-postcode-2026','upu-cameroon-addressing-2002','minpostel-cameroon-postal-operators-2024','minesup-cameroon-bp-address-example','osm-cameroon']) {
  assert.ok(address.openSourceIds.includes(id));
 }
});

test('Africa hierarchy embeds the same no-postcode CM definition',()=>{
 assert.ok(country); assert.deepEqual(country.addressFormat,address);
});
