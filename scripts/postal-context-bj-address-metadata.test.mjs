import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const bj = readJson('src/data/address_formats/africa/western_africa/BJ.json');
const hierarchy = readJson('src/data/address_hierarchy/africa.json');

test('BJ address metadata represents the current no-postcode UPU format', () => {
  assert.equal(bj.postalCode.format, 'None'); assert.equal(bj.postalCode.regex, null); assert.equal(bj.postalCode.api, null);
  assert.match(bj.postalCode.source, /La Poste du Bénin.*UPU Benin.*11\/2025.*no postal codes required/i);
  assert.equal(bj.addressRules.postalCode, null);
  assert.ok(!bj.addressRules.nativeOrder.includes('postcode'));
  assert.ok(!bj.addressRules.englishOrder.includes('postcode'));
  for (const format of [bj.native, bj.english]) {
    assert.ok(format.fields.every(field => field.key !== 'postcode'));
    assert.ok(format.fields.some(field => field.key === 'deliveryService'));
    assert.ok(format.fields.some(field => field.key === 'squareNumber'));
    assert.ok(format.fields.some(field => field.key === 'arrondissement'));
    assert.ok(format.fields.some(field => field.key === 'locality'));
  }
});

test('generated Africa hierarchy embeds the corrected BJ metadata', () => {
  const match = Object.values(hierarchy.subregions).flatMap(region => region.countries ?? []).find(country => country.code === 'BJ');
  assert.ok(match, 'BJ hierarchy entry is required');
  assert.deepEqual(match.addressFormat, bj);
});
