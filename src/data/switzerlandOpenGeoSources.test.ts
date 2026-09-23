import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Switzerland registry separates Swiss Post, PLZO, address, GWR, building, and admin evidence', () => {
  const ids = getEuropeOpenSourceIds('CH');
  const swissPost = EUROPE_OPEN_GEO_SOURCES['swiss-post-postcodes'];
  const plzo = EUROPE_OPEN_GEO_SOURCES['swisstopo-plzo-postal-localities'];
  const addresses = EUROPE_OPEN_GEO_SOURCES['swisstopo-building-address-directory'];
  const gwr = EUROPE_OPEN_GEO_SOURCES['swiss-federal-gwr'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['swisstopo-swissbuildings3d'];
  const boundaries = EUROPE_OPEN_GEO_SOURCES['swisstopo-swissboundaries3d'];

  for (const id of [swissPost.id, plzo.id, addresses.id, gwr.id, buildings.id, boundaries.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(swissPost.kind, 'postal-code');
  assert.match(swissPost.notes, /contract-partitioned/i);
  assert.equal(plzo.kind, 'postal-code');
  assert.match(plzo.notes, /domicile-address postcode types/i);
  assert.equal(addresses.kind, 'address');
  assert.match(addresses.notes, /EGAID.*EGID plus EDID/i);
  assert.equal(gwr.kind, 'building');
  assert.match(gwr.notes, /nationwide unique/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /same EGID/i);
  assert.equal(boundaries.kind, 'admin-boundary');
  assert.match(boundaries.notes, /never replaces a PLZO/i);
});

test('Switzerland official catalog exposes operator, PLZO, building-address, GWR, and geometry sources', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('CH').map(source => [source.id, source]));

  assert.equal(sources.get('swiss-post-postcodes')?.authority, 'postal-operator');
  assert.equal(sources.get('swisstopo-plzo-postal-localities')?.depth, 'postcode');
  assert.equal(sources.get('swisstopo-building-address-directory')?.depth, 'address');
  assert.equal(sources.get('swiss-federal-gwr')?.depth, 'building');
  assert.equal(sources.get('swisstopo-swissbuildings3d')?.depth, 'building');
  assert.equal(sources.get('swisstopo-swissboundaries3d')?.depth, 'geo-only');
});

test('Switzerland address metadata points to official swisstopo sources and removes the generic fallback', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/central_europe/CH.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
  };

  assert.equal(
    profile.postalCode.api,
    'https://www.swisstopo.admin.ch/en/official-directory-of-towns-and-cities',
  );
  assert.match(profile.postalCode.source, /Swiss Post.*PLZO_CH.*Building Addresses/i);
  assert.ok(profile.openSourceIds.includes('swiss-post-postcodes'));
  assert.ok(profile.openSourceIds.includes('swisstopo-plzo-postal-localities'));
  assert.ok(profile.openSourceIds.includes('swisstopo-building-address-directory'));
  assert.ok(profile.openSourceIds.includes('swisstopo-swissbuildings3d'));
  assert.equal(profile.openSourceIds.includes('openplzapi'), false);
});
