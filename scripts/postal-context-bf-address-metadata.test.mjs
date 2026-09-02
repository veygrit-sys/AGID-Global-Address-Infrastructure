import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const bf = readJson('src/data/address_formats/africa/western_africa/BF.json');
const hierarchy = readJson('src/data/address_hierarchy/africa.json');

test('BF address metadata represents the current typed five-digit format', () => {
  assert.equal(bf.postalCode.format, 'NNNNN');
  assert.equal(bf.postalCode.regex, '^\\d{5}$');
  assert.equal(bf.postalCode.api, 'https://laposte.bf/code-postal/');
  assert.match(bf.postalCode.source, /complete assignment register.*postal-area geometry licence/i);
  assert.match(bf.native.addressFormat, /\{\{deliveryService\}\}\n\{\{postcode\}\} \{\{city\}\}/);
  assert.match(bf.english.addressFormat, /\{\{deliveryService\}\}\n\{\{postcode\}\} \{\{city\}\}/);
  for (const format of [bf.native, bf.english]) {
    assert.ok(format.fields.some(field => field.key === 'postcode' && field.required === false));
    assert.ok(format.fields.some(field => field.key === 'deliveryService' && field.required === false));
  }
  assert.ok(bf.addressRules.nativeOrder.includes('postcode'));
  assert.ok(bf.addressRules.regionalHierarchy.includes('officialPostalSurfaceOrNoCanonicalGeometry'));
  assert.ok(bf.addressRules.regionalHierarchy.includes('agidCell'));
});

test('generated Africa hierarchy embeds the corrected BF metadata', () => {
  const match = Object.values(hierarchy.subregions).flatMap(region => region.countries ?? []).find(country => country.code === 'BF');
  assert.ok(match, 'BF hierarchy entry is required');
  assert.deepEqual(match.addressFormat, bf);
});
