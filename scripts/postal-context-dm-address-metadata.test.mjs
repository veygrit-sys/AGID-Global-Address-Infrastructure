import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const dm = readJson('src/data/address_formats/americas/caribbean/DM.json');
const hierarchy = readJson('src/data/address_hierarchy/americas.json');
const yaml = readFileSync(new URL('src/data/address_formats/americas/caribbean/DM.yaml', root), 'utf8');

test('DM JSON and Americas hierarchy represent the current no-postcode address format', () => {
  assert.deepEqual(dm.postalCode, {
    format: 'None',
    regex: null,
    api: null,
    source: 'Dominica Postal Service / UPU Universal DataBase Sep. 2025 (No postal codes required)',
  });
  assert.equal(dm.addressRules.postalCode, null);
  assert.ok(dm.native.fields.every(field => field.key !== 'postcode'));
  assert.ok(dm.english.fields.every(field => field.key !== 'postcode'));
  assert.doesNotMatch(dm.native.addressFormat, /postcode/i);
  assert.doesNotMatch(dm.english.addressFormat, /postcode/i);
  assert.ok(!dm.addressRules.nativeOrder.includes('postcode'));
  assert.ok(!dm.addressRules.englishOrder.includes('postcode'));
  const match = Object.values(hierarchy.subregions)
    .flatMap(region => region.countries ?? []).find(country => country.code === 'DM');
  assert.ok(match, 'DM hierarchy entry is required');
  assert.deepEqual(match.addressFormat, dm);
});

test('DM YAML removes the unsupported postcode token, field, orders, regex and API', () => {
  assert.match(yaml, /postalCode:\r?\n  format: None\r?\n  regex: null\r?\n  api: null/);
  assert.match(yaml, /source: Dominica Postal Service \/ UPU Universal DataBase Sep\. 2025 \(No postal codes required\)/);
  assert.match(yaml, /addressRules:[\s\S]*?  postalCode: null/);
  assert.doesNotMatch(yaml, /\{\{postcode\}\}|key: postcode|    - postcode|country specific or not used/);
});
