import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Iceland registry separates Pósturinn, IS 50V, HMS address, building, and statistics evidence', () => {
  const ids = getEuropeOpenSourceIds('IS');
  const postal = EUROPE_OPEN_GEO_SOURCES['posturinn-iceland-postcodes'];
  const areas = EUROPE_OPEN_GEO_SOURCES['natt-is50v-postcode-boundaries'];
  const addresses = EUROPE_OPEN_GEO_SOURCES['hms-iceland-address-register'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['natt-is50v-buildings'];
  const statistics = EUROPE_OPEN_GEO_SOURCES['statistics-iceland-geography'];

  for (const id of [postal.id, areas.id, addresses.id, buildings.id, statistics.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postal.kind, 'postal-code');
  assert.equal(areas.kind, 'postal-code');
  assert.match(areas.license ?? '', /public-sector reuse/i);
  assert.equal(addresses.kind, 'address');
  assert.match(addresses.notes, /coordinate type/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /not.*exact address/i);
  assert.equal(statistics.kind, 'admin-boundary');
});

test('Iceland official catalog distinguishes assignment, polygon, address, and building sources', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('IS').map(source => [source.id, source]));

  assert.equal(sources.get('posturinn-is-postcodes')?.authority, 'postal-operator');
  assert.equal(sources.get('natt-is50v-postcode-boundaries')?.depth, 'postcode');
  assert.equal(sources.get('hms-is-address-register')?.depth, 'address');
  assert.equal(sources.get('natt-is50v-buildings')?.depth, 'building');
});

test('Iceland address metadata points to current official postal and geospatial sources', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/northern_europe/IS.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
  };

  assert.match(profile.postalCode.api, /^https:\/\/posturinn\.is\//);
  assert.match(profile.postalCode.source, /Pósturinn.*HMS.*IS 50V/i);
  assert.ok(profile.openSourceIds.includes('posturinn-iceland-postcodes'));
  assert.ok(profile.openSourceIds.includes('hms-iceland-address-register'));
  assert.ok(profile.openSourceIds.includes('natt-is50v-postcode-boundaries'));
  assert.ok(profile.openSourceIds.includes('natt-is50v-buildings'));
});
