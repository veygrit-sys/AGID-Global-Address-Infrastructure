import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const root = new URL('../', import.meta.url);
const json = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const address = json('src/data/address_formats/africa/eastern_africa/DJ.json');
const hierarchy = json('src/data/address_hierarchy/africa.json');
const country = Object.values(hierarchy.subregions).flatMap(region => region.countries).find(item => item.code === 'DJ');

test('DJ metadata keeps postcode, geocoded address, PO box, geometry and building identity separate', () => {
  assert.equal(address.postalCode.format, 'NNNNN');
  assert.equal(address.postalCode.regex, '^\\d{5}$');
  for (const key of ['street', 'poBox', 'postcode', 'city']) assert.ok(address.native.fields.some(field => field.key === key));
  assert.match(address.native.addressFormat, /\{\{poBox\}\}\n\{\{postcode\}\} \{\{city\}\}/);
  assert.match(address.addressRules.postalCode.label, /first digit country.*region.*post office.*P\.O\. box remain separate/i);
  for (const id of ['upu-djibouti-addressing-2020', 'upu-djibouti-postcode-length-2026', 'upu-postcode-database-licensing-2026', 'djibouti-decentralisation-cartography', 'osm-djibouti']) assert.ok(address.openSourceIds.includes(id));
});

test('Africa hierarchy embeds the same DJ definition', () => {
  assert.ok(country);
  assert.deepEqual(country.addressFormat, address);
});
