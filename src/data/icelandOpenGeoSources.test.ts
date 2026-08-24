import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Iceland registry separates Byggðastofnun, Pósturinn, HMS address, IS 50V building, and statistics evidence', () => {
  const ids = getEuropeOpenSourceIds('IS');
  const postal = EUROPE_OPEN_GEO_SOURCES['posturinn-iceland-postcodes'];
  const areas = EUROPE_OPEN_GEO_SOURCES['byggdastofnun-iceland-postcode-register'];
  const addresses = EUROPE_OPEN_GEO_SOURCES['hms-iceland-address-register'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['natt-is50v-buildings'];
  const statistics = EUROPE_OPEN_GEO_SOURCES['statistics-iceland-geography'];

  for (const id of [postal.id, areas.id, addresses.id, buildings.id, statistics.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postal.kind, 'postal-code');
  assert.equal(areas.kind, 'postal-code');
  assert.match(areas.notes, /statutory authority.*boundaries.*register/i);
  assert.equal(ids.some(id => String(id) === 'natt-is50v-postcode-boundaries'), false);
  assert.equal(addresses.kind, 'address');
  assert.match(addresses.notes, /coordinate type/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /not.*exact address/i);
  assert.equal(statistics.kind, 'admin-boundary');
});

test('Iceland official catalog distinguishes assignment, polygon, address, and building sources', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('IS').map(source => [source.id, source]));

  assert.equal(sources.get('posturinn-is-postcodes')?.authority, 'postal-operator');
  assert.equal(sources.get('byggdastofnun-iceland-postcode-register')?.depth, 'postcode');
  assert.equal(sources.get('byggdastofnun-iceland-postcode-register')?.authority, 'government');
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

  assert.equal(profile.postalCode.api, 'https://www.byggdastofnun.is/is/postthjonusta/postnumer');
  assert.match(profile.postalCode.source, /Byggðastofnun.*Pósturinn.*HMS.*IS 50V/i);
  assert.ok(profile.openSourceIds.includes('byggdastofnun-iceland-postcode-register'));
  assert.ok(profile.openSourceIds.includes('posturinn-iceland-postcodes'));
  assert.ok(profile.openSourceIds.includes('hms-iceland-address-register'));
  assert.equal(profile.openSourceIds.includes('natt-is50v-postcode-boundaries'), false);
  assert.ok(profile.openSourceIds.includes('natt-is50v-buildings'));
});
