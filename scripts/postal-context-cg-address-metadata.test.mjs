import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root=new URL('../',import.meta.url);
const json=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const address=json('src/data/address_formats/africa/central_africa/CG.json');
const hierarchy=json('src/data/address_hierarchy/africa.json');
const country=Object.values(hierarchy.subregions).flatMap(region=>region.countries).find(item=>item.code==='CG');

test('CG metadata represents no postcode and keeps physical address inside the address object',()=>{
 assert.equal(address.postalCode.format,null); assert.equal(address.postalCode.regex,null);
 assert.deepEqual(address.addressRules.nativeOrder,['recipient','street','city','country']);
 assert.equal(address.addressRules.postalCode,null);
 assert.equal(address.native.fields.some(field=>field.key==='postalCode'),false);
});

test('Africa hierarchy embeds the same no-postcode CG definition',()=>{
 assert.ok(country); assert.deepEqual(country.addressFormat,address);
});
