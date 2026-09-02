import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const bw = readJson('src/data/address_formats/africa/southern_africa/BW.json');
const hierarchy = readJson('src/data/address_hierarchy/africa.json');

test('BW address metadata represents the current no-postcode UPU format', () => {
  assert.equal(bw.postalCode.format, 'None'); assert.equal(bw.postalCode.regex, null); assert.equal(bw.postalCode.api, null);
  assert.match(bw.postalCode.source, /BotswanaPost.*UPU Botswana.*09\/2004.*no postal codes required/i);
  assert.equal(bw.addressRules.postalCode, null);
  assert.ok(!bw.addressRules.nativeOrder.includes('postcode'));
  assert.ok(!bw.addressRules.englishOrder.includes('postcode'));
  for (const format of [bw.native, bw.english]) {
    assert.ok(format.fields.every(field => field.key !== 'postcode'));
    assert.ok(format.fields.some(field => field.key === 'deliveryService'));
    assert.ok(format.fields.some(field => field.key === 'plotNumber'));
    assert.ok(format.fields.some(field => field.key === 'street'));
    assert.ok(format.fields.some(field => field.key === 'locality'));
  }
});

test('generated Africa hierarchy embeds the corrected BW metadata', () => {
  const match = Object.values(hierarchy.subregions).flatMap(region => region.countries ?? []).find(country => country.code === 'BW');
  assert.ok(match, 'BW hierarchy entry is required');
  assert.deepEqual(match.addressFormat, bw);
});
