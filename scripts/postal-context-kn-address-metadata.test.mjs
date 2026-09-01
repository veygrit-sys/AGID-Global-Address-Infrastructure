import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const readJson = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const kn = readJson('src/data/address_formats/americas/caribbean/KN.json');
const hierarchy = readJson('src/data/address_hierarchy/americas.json');
const yaml = readFileSync(new URL('src/data/address_formats/americas/caribbean/KN.yaml', root), 'utf8');

test('KN JSON and Americas hierarchy represent the integral official postcode format', () => {
  assert.equal(kn.postalCode.format, 'KN9999');
  assert.equal(kn.postalCode.regex, '^KN\\d{4}$');
  assert.equal(kn.postalCode.api, null);
  assert.equal(kn.addressRules.postalCode.required, true);
  for (const format of [kn.native, kn.english]) {
    const postcode = format.fields.find(field => field.key === 'postcode');
    assert.equal(postcode.placeholder, 'KN0101');
    assert.equal(postcode.required, true);
    assert.match(format.addressFormat, /\{\{postcode\}\}/);
  }
  const matches = [];
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    if (value.countryCode === 'KN') matches.push(value);
    else Object.values(value).forEach(visit);
  };
  visit(hierarchy);
  assert.equal(matches.length, 1);
  assert.deepEqual(matches[0], kn);
});

test('KN YAML preserves format, regex, examples and no-proxy semantics', () => {
  assert.match(yaml, /postalCode:\r?\n  format: KN9999\r?\n  regex: \^KN\\d\{4\}\$/);
  assert.match(yaml, /placeholder: KN0101/);
  assert.match(yaml, /required: true/);
  assert.match(yaml, /including special code\s+KN7000/);
  assert.match(yaml, /AGID remains\s+an independent spatial index/);
  assert.doesNotMatch(yaml, /country specific or not used/);
});
