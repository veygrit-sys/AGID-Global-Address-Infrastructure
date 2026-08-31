import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const cw = readJson('src/data/address_formats/americas/caribbean/CW.json');
const hierarchy = readJson('src/data/address_hierarchy/americas.json');
const yaml = readFileSync(new URL('src/data/address_formats/americas/caribbean/CW.yaml', root), 'utf8');

test('CW JSON and Americas hierarchy reject the unverified four-digit postcode format', () => {
  assert.deepEqual(cw.postalCode, {
    format: 'None',
    regex: null,
    api: null,
    source: 'Cpost International / UPU Universal DataBase Sep. 2025 (No postal codes required)',
  });
  assert.equal(cw.addressRules.postalCode, null);
  const match = Object.values(hierarchy.subregions)
    .flatMap(region => region.countries ?? []).find(country => country.code === 'CW');
  assert.ok(match, 'CW hierarchy entry is required');
  assert.deepEqual(match.addressFormat.postalCode, cw.postalCode);
  assert.equal(match.addressFormat.addressRules.postalCode, null);
  assert.doesNotMatch(JSON.stringify(match), /0000-9999 local postcode format used/);
});

test('CW YAML records no postcode regex or API', () => {
  assert.match(yaml, /postalCode:\r?\n  format: None\r?\n  regex: null\r?\n  api: null/);
  assert.match(yaml, /source: Cpost International \/ UPU Universal DataBase Sep\. 2025 \(No postal codes required\)/);
  assert.match(yaml, /addressRules:[\s\S]*?  postalCode: null/);
  assert.doesNotMatch(yaml, /0000-9999|\^\\d\{4\}\$/);
});
