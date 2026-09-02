import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root=new URL('../',import.meta.url); const json=path=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
const address=json('src/data/address_formats/africa/central_africa/CD.json'); const hierarchy=json('src/data/address_hierarchy/africa.json');
const country=Object.values(hierarchy.subregions).flatMap(region=>region.countries).find(item=>item.code==='CD');

test('CD metadata uses official seven digits and separates detailed address fields',()=>{
 assert.equal(address.postalCode.format,'NNNNNNN'); assert.equal(address.postalCode.regex,'^\\d{7}$');
 assert.match(address.postalCode.api,/codepostal\.cd/); assert.deepEqual(address.addressRules.nativeOrder,['recipient','street','subLocality','locality','postcode','province','country']);
 assert.equal(address.native.fields.find(field=>field.key==='recipient').placeholder,'Nom du destinataire');
 assert.ok(!JSON.stringify(address).includes('Félix Tshisekedi'));
});

test('Africa hierarchy embeds the corrected CD definition exactly',()=>{
 assert.ok(country); assert.deepEqual(country.addressFormat,address);
});
