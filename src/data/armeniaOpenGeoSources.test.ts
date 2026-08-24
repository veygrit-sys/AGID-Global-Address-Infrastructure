import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Armenia registry separates postal, address-register, building, and boundary evidence', () => {
  const ids = getAsiaOpenSourceIds('AM');
  const postal = ASIA_OPEN_GEO_SOURCES['haypost-am'];
  const address = ASIA_OPEN_GEO_SOURCES['armenia-real-estate-address-register'];
  const building = ASIA_OPEN_GEO_SOURCES['armenia-national-geoportal-buildings'];
  const cadastre = ASIA_OPEN_GEO_SOURCES['cadastre-armenia'];

  for (const id of [postal.id, address.id, building.id, cadastre.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postal.kind, 'postal-code');
  assert.match(postal.notes, /postal-region.*post-office.*not.*polygon/i);
  assert.equal(address.kind, 'address');
  assert.match(address.notes, /community.*not.*bulk/i);
  assert.equal(building.kind, 'building');
  assert.match(building.notes, /explicit.*identifier.*proximity/i);
  assert.equal(cadastre.kind, 'admin-boundary');
  assert.match(cadastre.notes, /layer-by-layer.*license|access.*terms/i);
});

test('Armenia official catalog exposes distinct national source authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('AM').map(source => [source.id, source]));

  assert.equal(sources.get('haypost-am')?.authority, 'postal-operator');
  assert.equal(sources.get('haypost-am')?.depth, 'postcode');
  assert.equal(sources.get('armenia-real-estate-address-register')?.authority, 'government');
  assert.equal(sources.get('armenia-real-estate-address-register')?.depth, 'address');
  assert.equal(sources.get('armenia-national-geoportal-buildings')?.depth, 'building');
  assert.equal(sources.get('cadastre-armenia')?.depth, 'geo-only');
});

test('Armenia address metadata uses official sources and a cadastral address hierarchy', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/asia/caucasus/AM.json'),
    'utf8',
  )) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.format, 'NNNN');
  assert.equal(profile.postalCode.regex, '^\\d{4}$');
  assert.equal(profile.postalCode.api, 'https://www.haypost.am/en/find-index');
  assert.match(profile.postalCode.source, /HayPost.*Cadastre Committee.*National Geoportal/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['regionOrYerevan', 'community', 'settlement', 'street', 'realEstateAddress', 'buildingEntrance']);
  assert.match(profile.addressRules.postalCode.label, /4 digits.*postal region.*post office.*area requires source evidence/i);
  for (const id of [
    'haypost-am',
    'haypost-address-reference',
    'armenia-real-estate-address-register',
    'armenia-national-geoportal-buildings',
    'cadastre-armenia',
  ]) {
    assert.ok(profile.openSourceIds.includes(id));
  }
  assert.equal(profile.openSourceIds.includes('geonames-postal'), true);
});
