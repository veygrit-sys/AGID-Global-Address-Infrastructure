import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const ao = readJson('src/data/address_formats/africa/central_africa/AO.json');
const hierarchy = readJson('src/data/address_hierarchy/africa.json');

test('AO address metadata represents the current no-postcode format', () => {
  assert.deepEqual(ao.postalCode, {
    format: 'None', regex: null, api: null,
    source: 'Correios de Angola / UPU Universal DataBase Sep. 2025 (updated 20 Aug. 2026; no postal codes required)',
  });
  assert.equal(ao.addressRules.postalCode, null);
  assert.ok(!ao.addressRules.nativeOrder.includes('postcode'));
  assert.ok(!ao.addressRules.englishOrder.includes('postcode'));
  for (const format of [ao.native, ao.english, ao.international.pt]) {
    assert.ok(format.fields.every(field => field.key !== 'postcode'));
    assert.doesNotMatch(format.addressFormat, /postcode/i);
  }
});

test('generated Africa hierarchy embeds the corrected AO metadata', () => {
  const match = Object.values(hierarchy.subregions).flatMap(region => region.countries ?? []).find(country => country.code === 'AO');
  assert.ok(match, 'AO hierarchy entry is required');
  assert.deepEqual(match.addressFormat, ao);
});
