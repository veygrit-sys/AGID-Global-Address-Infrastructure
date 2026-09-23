import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Liechtenstein registry separates postal, PLZO, address, building, and sovereign evidence', () => {
  const ids = getEuropeOpenSourceIds('LI');
  const swissPost = EUROPE_OPEN_GEO_SOURCES['swiss-post-postcodes'];
  const plzo = EUROPE_OPEN_GEO_SOURCES['swisstopo-plzo-postal-localities'];
  const localPost = EUROPE_OPEN_GEO_SOURCES['liechtenstein-post-access-points'];
  const addresses = EUROPE_OPEN_GEO_SOURCES['llv-liechtenstein-building-addresses'];
  const gwr = EUROPE_OPEN_GEO_SOURCES['llv-liechtenstein-gwr-public'];
  const survey = EUROPE_OPEN_GEO_SOURCES['llv-liechtenstein-official-survey'];
  const boundary = EUROPE_OPEN_GEO_SOURCES['llv-liechtenstein-sovereign-boundaries'];

  for (const id of [swissPost.id, plzo.id, localPost.id, addresses.id, gwr.id, survey.id, boundary.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(swissPost.kind, 'postal-code');
  assert.match(swissPost.notes, /contract-partitioned/i);
  assert.equal(plzo.kind, 'postal-code');
  assert.match(plzo.notes, /Liechtenstein.*domicile-address/i);
  assert.equal(localPost.kind, 'facility');
  assert.match(localPost.notes, /non-areal/i);
  assert.equal(addresses.kind, 'address');
  assert.match(addresses.notes, /building identifier.*not.*footprint/i);
  assert.equal(gwr.kind, 'building');
  assert.match(gwr.notes, /public fields.*dwelling/i);
  assert.equal(survey.kind, 'building');
  assert.match(survey.notes, /eleven.*link.*explicit.*identifier/i);
  assert.equal(boundary.kind, 'admin-boundary');
  assert.match(boundary.notes, /CH.*AT.*not.*postcode/i);
});

test('Liechtenstein official catalog exposes shared and sovereign source families', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('LI').map(source => [source.id, source]));

  assert.equal(sources.get('swiss-post-postcodes')?.authority, 'postal-operator');
  assert.equal(sources.get('swisstopo-plzo-postal-localities')?.depth, 'postcode');
  assert.equal(sources.get('liechtenstein-post-access-points')?.depth, 'delivery-point');
  assert.equal(sources.get('llv-liechtenstein-building-addresses')?.depth, 'address');
  assert.equal(sources.get('llv-liechtenstein-gwr-public')?.depth, 'building');
  assert.equal(sources.get('llv-liechtenstein-official-survey')?.depth, 'building');
  assert.equal(sources.get('llv-liechtenstein-sovereign-boundaries')?.depth, 'geo-only');
  assert.equal(sources.has('swisstopo-building-address-directory'), false);
  assert.equal(sources.get('swisstopo-swissbuildings3d')?.depth, 'building');
});

test('Liechtenstein address metadata uses official sources and removes the generic fallback', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/central_europe/LI.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.api, 'https://www.swisstopo.admin.ch/en/official-directory-of-towns-and-cities');
  assert.match(profile.postalCode.source, /Swiss Post.*PLZO.*Liechtenstein.*Building Addresses.*GWR/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['municipality', 'locality', 'street', 'buildingEntrance']);
  assert.match(profile.addressRules.postalCode.label, /94xx.*allocation requires source evidence/i);
  for (const id of [
    'swiss-post-postcodes',
    'swisstopo-plzo-postal-localities',
    'liechtenstein-post-access-points',
    'llv-liechtenstein-building-addresses',
    'llv-liechtenstein-gwr-public',
    'llv-liechtenstein-official-survey',
    'llv-liechtenstein-sovereign-boundaries',
  ]) {
    assert.ok(profile.openSourceIds.includes(id));
  }
  assert.equal(profile.openSourceIds.includes('swisstopo-building-address-directory'), false);
  assert.equal(profile.openSourceIds.includes('swisstopo-swissbuildings3d'), true);
  assert.equal(profile.openSourceIds.includes('openplzapi'), false);
});
