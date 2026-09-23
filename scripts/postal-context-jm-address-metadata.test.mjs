import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const jm = readJson('src/data/address_formats/americas/caribbean/JM.json');
const hierarchy = readJson('src/data/address_hierarchy/americas.json');
const yaml = readFileSync(new URL('src/data/address_formats/americas/caribbean/JM.yaml', root), 'utf8');

test('JM JSON and Americas hierarchy represent the current no-postcode address format', () => {
  assert.deepEqual(jm.postalCode, {
    format: 'None', regex: null, api: null,
    source: 'Jamaica Post / UPU Universal DataBase Sep. 2025 (No postal codes required; Kingston sector codes are not postcodes)',
  });
  assert.equal(jm.addressRules.postalCode, null);
  for (const format of [jm.native, jm.english]) {
    assert.ok(format.fields.every(field => field.key !== 'postcode'));
    assert.doesNotMatch(format.addressFormat, /postcode/i);
  }
  assert.ok(!jm.addressRules.nativeOrder.includes('postcode'));
  assert.ok(!jm.addressRules.englishOrder.includes('postcode'));
  const match = Object.values(hierarchy.subregions).flatMap(region => region.countries ?? []).find(country => country.code === 'JM');
  assert.ok(match, 'JM hierarchy entry is required');
  assert.deepEqual(match.addressFormat, jm);
});

test('JM YAML removes the unsupported postcode token, field, orders, regex and API', () => {
  assert.match(yaml, /postalCode:\r?\n  format: None\r?\n  regex: null\r?\n  api: null/);
  assert.match(yaml, /Kingston sector codes are not postcodes/);
  assert.match(yaml, /addressRules:[\s\S]*?  postalCode: null/);
  assert.doesNotMatch(yaml, /\{\{postcode\}\}|key: postcode|    - postcode|country specific or not used/);
});
