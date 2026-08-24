import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Albania registry separates postal, address-system, cadastral-building, and boundary evidence', () => {
  const ids = getEuropeOpenSourceIds('AL');
  const postal = EUROPE_OPEN_GEO_SOURCES['posta-shqiptare-postcodes'];
  const address = EUROPE_OPEN_GEO_SOURCES['albania-national-address-system'];
  const cadastre = EUROPE_OPEN_GEO_SOURCES['ashk-albania-cadastral-buildings'];
  const asig = EUROPE_OPEN_GEO_SOURCES['asig-albania'];

  for (const id of [postal.id, address.id, cadastre.id, asig.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postal.kind, 'postal-code');
  assert.match(postal.notes, /office.*branch.*not.*polygon/i);
  assert.equal(address.kind, 'address');
  assert.match(address.notes, /address-building.*not.*bulk/i);
  assert.equal(cadastre.kind, 'building');
  assert.match(cadastre.notes, /explicit.*identifier.*proximity/i);
  assert.equal(asig.kind, 'admin-boundary');
  assert.match(asig.notes, /layer-by-layer.*license/i);
});

test('Albania official catalog exposes distinct national source authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('AL').map(source => [source.id, source]));

  assert.equal(sources.get('posta-shqiptare-postcodes')?.authority, 'postal-operator');
  assert.equal(sources.get('posta-shqiptare-postcodes')?.depth, 'postcode');
  assert.equal(sources.get('albania-national-address-system')?.authority, 'government');
  assert.equal(sources.get('albania-national-address-system')?.depth, 'address');
  assert.equal(sources.get('ashk-albania-cadastral-buildings')?.depth, 'building');
  assert.equal(sources.get('asig-albania')?.depth, 'geo-only');
});

test('Albania address metadata uses official sources and an address-system hierarchy', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/southern_europe/AL.json'),
    'utf8',
  )) as {
    native: { addressFormat: string };
    postalCode: { format: string; regex: string; api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.format, 'NNNN');
  assert.equal(profile.postalCode.regex, '^\\d{4}$');
  assert.equal(profile.postalCode.api, 'https://www.postashqiptare.al/c/45/kodi-postar');
  assert.match(profile.postalCode.source, /Posta Shqiptare.*National Address System.*ASHK/i);
  assert.match(profile.native.addressFormat, /\{\{postcode\}\}\n\{\{city\}\}/);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['county', 'municipality', 'administrativeUnit', 'cityOrVillage', 'street', 'buildingEntrance']);
  assert.match(profile.addressRules.postalCode.label, /4 digits.*delivery office.*area requires source evidence/i);
  for (const id of [
    'posta-shqiptare-postcodes',
    'albania-national-address-system',
    'ashk-albania-cadastral-buildings',
    'asig-albania',
  ]) {
    assert.ok(profile.openSourceIds.includes(id));
  }
  assert.equal(profile.openSourceIds.includes('spotzi-postal-codes'), false);
});
