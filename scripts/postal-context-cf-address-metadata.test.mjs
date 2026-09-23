import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root=new URL('../',import.meta.url);
const json=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const address=json('src/data/address_formats/africa/central_africa/CF.json');
const hierarchy=json('src/data/address_hierarchy/africa.json');
const country=Object.values(hierarchy.subregions).flatMap(region=>region.countries).find(item=>item.code==='CF');

test('CF metadata represents no postcode and keeps BP inside the address object',()=>{
 assert.equal(address.postalCode.format,null); assert.equal(address.postalCode.regex,null);
 assert.deepEqual(address.addressRules.nativeOrder,['recipient','street','city','country']);
 assert.equal(address.addressRules.postalCode,null);
 assert.match(address.native.fields.find(field=>field.key==='street').label,/BP/);
});

test('Africa hierarchy embeds the same no-postcode CF definition',()=>{
 assert.ok(country); assert.deepEqual(country.addressFormat,address);
});
