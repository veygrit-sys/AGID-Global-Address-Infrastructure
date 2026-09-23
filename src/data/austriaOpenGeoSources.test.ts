import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Austria registry separates Post, BEV, statistical, boundary, and GWR evidence', () => {
  const ids = getEuropeOpenSourceIds('AT');
  const postal = EUROPE_OPEN_GEO_SOURCES['austrian-post-postcode'];
  const postAddress = EUROPE_OPEN_GEO_SOURCES['austrian-post-address-data'];
  const bevAddress = EUROPE_OPEN_GEO_SOURCES['bev-austria-address-register'];
  const postcodeRegions = EUROPE_OPEN_GEO_SOURCES['statistics-austria-postcode-regions'];
  const boundaries = EUROPE_OPEN_GEO_SOURCES['bev-austria-administrative-boundaries'];
  const gwr = EUROPE_OPEN_GEO_SOURCES['statistics-austria-gwr'];

  for (const id of [postal.id, postAddress.id, bevAddress.id, postcodeRegions.id, boundaries.id, gwr.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postal.kind, 'postal-code');
  assert.match(postal.notes, /four-digit.*text.*destination.*not.*polygon/i);
  assert.equal(postAddress.kind, 'address');
  assert.match(postAddress.notes, /contract.*PAC.*household.*public/i);
  assert.equal(bevAddress.kind, 'address');
  assert.match(bevAddress.notes, /Adresscode.*Subcode.*address coordinate.*building coordinate/i);
  assert.equal(postcodeRegions.kind, 'postal-code');
  assert.match(postcodeRegions.notes, /official statistical.*not.*Austrian Post perimeter/i);
  assert.equal(boundaries.kind, 'admin-boundary');
  assert.match(boundaries.notes, /not.*postal membership/i);
  assert.equal(gwr.kind, 'building');
  assert.match(gwr.notes, /individual.*restricted.*aggregate/i);
});

test('Austria official catalog exposes distinct national source authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('AT').map(source => [source.id, source]));

  assert.equal(sources.get('austrian-post-postcode')?.authority, 'postal-operator');
  assert.equal(sources.get('austrian-post-postcode')?.depth, 'postcode');
  assert.equal(sources.get('austrian-post-address-data')?.depth, 'address');
  assert.equal(sources.get('bev-austria-address-register')?.authority, 'official-open-data');
  assert.equal(sources.get('bev-austria-address-register')?.depth, 'building');
  assert.equal(sources.get('statistics-austria-postcode-regions')?.authority, 'official-open-data');
  assert.equal(sources.get('statistics-austria-postcode-regions')?.depth, 'postcode');
  assert.equal(sources.get('bev-austria-administrative-boundaries')?.depth, 'geo-only');
  assert.equal(sources.get('statistics-austria-gwr')?.availability, 'commercial-or-restricted');
});

test('Austria address metadata uses official sources and a building-aware hierarchy', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/central_europe/AT.json'),
    'utf8',
  )) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.format, 'NNNN');
  assert.equal(profile.postalCode.regex, '^\\d{4}$');
  assert.equal(profile.postalCode.api, 'https://www.post.at/en/g/c/postal-encyclopedia');
  assert.match(profile.postalCode.source, /Österreichische Post.*BEV.*Statistik Austria/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, [
    'federalState',
    'politicalDistrictOrStatutoryCity',
    'municipality',
    'locality',
    'street',
    'orientationNumber',
    'building',
    'staircase',
    'doorOrUnit',
  ]);
  assert.match(profile.addressRules.postalCode.label, /4 digits.*assignment.*area requires source evidence/i);
  for (const id of [
    'austrian-post-postcode',
    'austrian-post-address-data',
    'bev-austria-address-register',
    'statistics-austria-postcode-regions',
    'bev-austria-administrative-boundaries',
    'statistics-austria-gwr',
  ]) {
    assert.ok(profile.openSourceIds.includes(id));
  }
  assert.equal(profile.openSourceIds.includes('openplzapi'), true);
});
