import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Malta registry separates operator, address register, building, and admin evidence', () => {
  const ids = getEuropeOpenSourceIds('MT');
  const post = EUROPE_OPEN_GEO_SOURCES['maltapost-postcode-finder'];
  const oar = EUROPE_OPEN_GEO_SOURCES['malta-office-address-registrar'];
  const locations = EUROPE_OPEN_GEO_SOURCES['malta-oar-location-registers'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['malta-pa-large-scale-topography-buildings'];
  const map = EUROPE_OPEN_GEO_SOURCES['pa-malta-geoserver'];
  const statistics = EUROPE_OPEN_GEO_SOURCES['nso-malta-geodata'];

  for (const id of [post.id, oar.id, locations.id, buildings.id, map.id, statistics.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(post.kind, 'postal-code');
  assert.match(post.notes, /assignment.*not polygon/i);
  assert.equal(oar.kind, 'address');
  assert.match(oar.notes, /primary source.*work in progress.*confirmation/i);
  assert.equal(locations.kind, 'admin-boundary');
  assert.match(locations.notes, /regions.*localities.*streets.*not postal geometry/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /WFS.*explicit.*proximity.*candidate/i);
  assert.equal(map.kind, 'geocoding');
  assert.match(map.notes, /planning.*not.*address or postal authority/i);
  assert.equal(ids.includes('eurostat-gisco-postcodes'), false);
  assert.equal(ids.includes('identity-malta-addressing'), false);
});

test('Malta official catalog exposes postal, address, building, and administrative sources', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('MT').map(source => [source.id, source]));

  assert.equal(sources.get('maltapost-postcode-finder')?.authority, 'postal-operator');
  assert.equal(sources.get('malta-office-address-registrar')?.depth, 'address');
  assert.equal(sources.get('malta-office-address-registrar')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('malta-oar-location-registers')?.depth, 'geo-only');
  assert.equal(sources.get('malta-pa-large-scale-topography-buildings')?.depth, 'building');
  assert.equal(sources.get('nso-malta-spatial-divisions')?.depth, 'geo-only');
});

test('Malta address metadata points to official and evidence-separated sources', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/southern_europe/MT.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    addressRules: { regionalHierarchy: string[] };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.api, 'https://www.maltapost.com/postcode/?l=1');
  assert.match(profile.postalCode.source, /MaltaPost.*Address Registrar.*Planning Authority/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['region', 'localCouncil', 'locality']);
  assert.ok(profile.openSourceIds.includes('maltapost-postcode-finder'));
  assert.ok(profile.openSourceIds.includes('malta-office-address-registrar'));
  assert.ok(profile.openSourceIds.includes('malta-oar-location-registers'));
  assert.ok(profile.openSourceIds.includes('malta-pa-large-scale-topography-buildings'));
  assert.ok(profile.openSourceIds.includes('nso-malta-geodata'));
});
