import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const json = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const address = json('src/data/address_formats/africa/western_africa/CV.json');
const hierarchy = json('src/data/address_hierarchy/africa.json');
const country = Object.values(hierarchy.subregions).flatMap(region => region.countries).find(item => item.code === 'CV');

test('CV metadata retains the four-digit canonical postcode and typed identifier split', () => {
  assert.equal(address.postalCode.format, 'NNNN');
  assert.equal(address.postalCode.regex, '^\\d{4}$');
  assert.equal(address.native.fields.some(field => field.key === 'postcode'), true);
  assert.match(address.addressRules.postalCode.label, /4 digits.*NNNN-NNN.*georeferenced CIP.*separate/i);
  for (const item of [
    'typedFourDigitPostcode',
    'operatorPublishedExtendedIdentifier',
    'privateCIPOrNoCIP',
    'officialPostalSurfaceOrNoCanonicalGeometry',
    'explicitRightsClearedBuildingOrParcel',
  ]) {
    assert.ok(address.addressRules.regionalHierarchy.includes(item));
  }
  for (const id of [
    'correios-cabo-verde',
    'correios-cabo-verde-contact-identifiers',
    'correios-cabo-verde-cip',
    'upu-cabo-verde-postcode-length-2026',
    'ingt-cabo-verde-admin-feature-service',
  ]) {
    assert.ok(address.openSourceIds.includes(id));
  }
});

test('Africa hierarchy embeds the same CV address definition', () => {
  assert.ok(country);
  assert.deepEqual(country.addressFormat, address);
});
