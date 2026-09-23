import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const bi = readJson('src/data/address_formats/africa/eastern_africa/BI.json');
const hierarchy = readJson('src/data/address_hierarchy/africa.json');

test('BI address metadata represents the current no-postcode UPU format', () => {
  assert.equal(bi.postalCode.format, 'None'); assert.equal(bi.postalCode.regex, null); assert.equal(bi.postalCode.api, null);
  assert.match(bi.postalCode.source, /Régie nationale des postes.*UPU Burundi.*11\/2025.*no postal codes required/i);
  assert.equal(bi.addressRules.postalCode, null);
  assert.ok(!bi.addressRules.nativeOrder.includes('postcode'));
  assert.ok(!bi.addressRules.englishOrder.includes('postcode'));
  for (const format of [bi.native, bi.english]) {
    assert.ok(format.fields.every(field => field.key !== 'postcode'));
    assert.ok(format.fields.some(field => field.key === 'deliveryService'));
    assert.ok(format.fields.some(field => field.key === 'commune'));
    assert.ok(format.fields.some(field => field.key === 'province'));
  }
});

test('generated Africa hierarchy embeds the corrected BI metadata', () => {
  const match = Object.values(hierarchy.subregions).flatMap(region => region.countries ?? []).find(country => country.code === 'BI');
  assert.ok(match, 'BI hierarchy entry is required');
  assert.deepEqual(match.addressFormat, bi);
});
