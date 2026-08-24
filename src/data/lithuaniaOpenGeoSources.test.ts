import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Lithuania registry separates operator, civic-address, building, and administrative evidence', () => {
  const ids = getEuropeOpenSourceIds('LT');
  const post = EUROPE_OPEN_GEO_SOURCES['lietuvos-pastas-postcode-search'];
  const addresses = EUROPE_OPEN_GEO_SOURCES['registru-centras-address-register'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['registru-centras-ntr-buildings'];
  const boundaries = EUROPE_OPEN_GEO_SOURCES['registru-centras-address-boundaries'];

  for (const id of [post.id, addresses.id, buildings.id, boundaries.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(post.kind, 'postal-code');
  assert.match(post.notes, /address.*municipality.*not.*boundary/i);
  assert.equal(addresses.kind, 'address');
  assert.equal(addresses.usage, 'primary');
  assert.match(addresses.notes, /CC BY 4\.0.*address points.*postal/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /NTR.*boundaries.*explicit.*relation/i);
  assert.equal(boundaries.kind, 'admin-boundary');
  assert.match(boundaries.notes, /cannot.*postcode/i);
});

test('Lithuania official catalog exposes authority-separated source families', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('LT').map(source => [source.id, source]));

  assert.equal(sources.get('lietuvos-pastas-postcode-search')?.authority, 'postal-operator');
  assert.equal(sources.get('lietuvos-pastas-postcode-search')?.depth, 'address');
  assert.equal(sources.get('registru-centras-address-register')?.authority, 'government');
  assert.equal(sources.get('registru-centras-address-register')?.depth, 'address');
  assert.equal(sources.get('registru-centras-ntr-buildings')?.depth, 'building');
  assert.equal(sources.get('registru-centras-address-boundaries')?.depth, 'geo-only');
});

test('Lithuania address metadata exposes source and evidence boundaries', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/northern_europe/LT.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.api, 'https://www.post.lt/post/codes/search');
  assert.match(profile.postalCode.source, /Lietuvos paštas.*Registrų centras.*NTR/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['municipality', 'eldership', 'cityOrSettlement', 'street', 'premise']);
  assert.match(profile.addressRules.postalCode.label, /LT-NNNNN.*address lookup.*official polygon/i);
  for (const id of ['lietuvos-pastas-postcode-search', 'registru-centras-address-register', 'registru-centras-ntr-buildings', 'registru-centras-address-boundaries']) {
    assert.ok(profile.openSourceIds.includes(id));
  }
});
