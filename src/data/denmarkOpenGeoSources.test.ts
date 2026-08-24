import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Denmark registry separates operator, DAGI area, DAR address, BBR, building, and admin evidence', () => {
  const ids = getEuropeOpenSourceIds('DK');
  const postnord = EUROPE_OPEN_GEO_SOURCES['postnord-dk-postcode-finder'];
  const postcodeAreas = EUROPE_OPEN_GEO_SOURCES['dagi-denmark-postcode-areas'];
  const dawa = EUROPE_OPEN_GEO_SOURCES['dataforsyningen-denmark'];
  const dar = EUROPE_OPEN_GEO_SOURCES['danish-address-register-dar'];
  const bbr = EUROPE_OPEN_GEO_SOURCES['bbr-denmark-buildings'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['geodanmark-buildings'];
  const boundaries = EUROPE_OPEN_GEO_SOURCES['dagi-denmark-boundaries'];

  for (const id of [postnord.id, postcodeAreas.id, dawa.id, dar.id, bbr.id, buildings.id, boundaries.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postnord.kind, 'postal-code');
  assert.match(postnord.notes, /assignment.*not polygon/i);
  assert.equal(postcodeAreas.kind, 'postal-code');
  assert.match(postcodeAreas.notes, /MultiSurface.*gadepostnummer.*bitemporal/i);
  assert.equal(dawa.kind, 'geocoding');
  assert.match(dawa.notes, /DAGI.*DAR.*not independent authority/i);
  assert.equal(dar.kind, 'address');
  assert.match(dar.notes, /UUID.*building references.*not footprint/i);
  assert.equal(bbr.kind, 'building');
  assert.match(bbr.notes, /statutory.*public building/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /explicit DAR or BBR.*proximity/i);
  assert.equal(boundaries.kind, 'admin-boundary');
  assert.match(boundaries.notes, /never postal geometry/i);
  assert.equal(ids.includes('postcode-eu'), false);
});

test('Denmark official catalog exposes postcode, address, building, and administrative sources', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('DK').map(source => [source.id, source]));

  assert.equal(sources.get('postnord-dk-postcode-finder')?.authority, 'postal-operator');
  assert.equal(sources.get('dagi-denmark-postcode-areas')?.depth, 'postcode');
  assert.equal(sources.get('dawa-denmark')?.depth, 'address');
  assert.equal(sources.get('danish-address-register-dar')?.depth, 'address');
  assert.equal(sources.get('bbr-denmark-buildings')?.depth, 'building');
  assert.equal(sources.get('geodanmark-buildings')?.depth, 'building');
  assert.equal(sources.get('dagi-denmark-boundaries')?.depth, 'geo-only');
});

test('Denmark address metadata points to official and evidence-separated sources', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/northern_europe/DK.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    addressRules: { regionalHierarchy: string[] };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.api, 'https://api.dataforsyningen.dk/postnumre');
  assert.match(profile.postalCode.source, /PostNord.*DAGI.*DAR.*GeoDanmark/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['region', 'municipality', 'city']);
  assert.ok(profile.openSourceIds.includes('postnord-dk-postcode-finder'));
  assert.ok(profile.openSourceIds.includes('dagi-denmark-postcode-areas'));
  assert.ok(profile.openSourceIds.includes('danish-address-register-dar'));
  assert.ok(profile.openSourceIds.includes('bbr-denmark-buildings'));
  assert.ok(profile.openSourceIds.includes('geodanmark-buildings'));
  assert.ok(profile.openSourceIds.includes('dagi-denmark-boundaries'));
});
