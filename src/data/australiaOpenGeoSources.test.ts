import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { OCEANIA_OPEN_GEO_SOURCES, getOceaniaOpenSourceIds } from './oceaniaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Australia registry separates operator, address, POA, building, and administrative evidence', () => {
  const ids = getOceaniaOpenSourceIds('AU');
  const postcode = OCEANIA_OPEN_GEO_SOURCES['auspost-postcode'];
  const paf = OCEANIA_OPEN_GEO_SOURCES['auspost-paf'];
  const gnaf = OCEANIA_OPEN_GEO_SOURCES['gnaf-au'];
  const poa = OCEANIA_OPEN_GEO_SOURCES['abs-au-postal-areas'];
  const buildings = OCEANIA_OPEN_GEO_SOURCES['geoscape-au-buildings'];
  const boundaries = OCEANIA_OPEN_GEO_SOURCES['abs-au-boundaries'];

  for (const id of [postcode.id, paf.id, gnaf.id, poa.id, buildings.id, boundaries.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postcode.kind, 'postal-code');
  assert.match(postcode.notes, /allocation.*not.*boundary/i);
  assert.equal(paf.kind, 'address');
  assert.match(paf.notes, /licensed.*monthly/i);
  assert.equal(gnaf.kind, 'address');
  assert.match(gnaf.notes, /secondary.*mail/i);
  assert.equal(poa.kind, 'postal-code');
  assert.match(poa.notes, /Mesh Block.*not.*Australia Post/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /licensed.*building_address/i);
  assert.equal(boundaries.kind, 'admin-boundary');
  assert.match(boundaries.notes, /cannot.*postcode/i);
});

test('Australia official catalog exposes all authority-separated source families', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('AU').map(source => [source.id, source]));

  assert.equal(sources.get('australia-post-postcode-data')?.authority, 'postal-operator');
  assert.equal(sources.get('australia-post-postcode-data')?.depth, 'postcode');
  assert.equal(sources.get('australia-post-paf')?.depth, 'delivery-point');
  assert.equal(sources.get('gnaf-au')?.depth, 'address');
  assert.equal(sources.get('abs-asgs-postal-areas')?.trustTier, 'official-derived');
  assert.equal(sources.get('abs-asgs-postal-areas')?.depth, 'postcode');
  assert.equal(sources.get('geoscape-au-buildings')?.depth, 'building');
  assert.equal(sources.get('geoscape-au-buildings')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('abs-asgs-boundaries')?.depth, 'geo-only');
});

test('Australia address metadata exposes source and evidence boundaries', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/oceania/oceania/AU.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.api, 'https://auspost.com.au/business/services/data-services/address-data/postcode-data');
  assert.match(profile.postalCode.source, /Australia Post.*G-NAF.*ABS.*Geoscape/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['stateOrTerritory', 'localGovernmentArea', 'suburbOrLocality']);
  assert.match(profile.addressRules.postalCode.label, /4 digits.*leading zero.*delivery category/i);
  for (const id of ['auspost-postcode', 'auspost-paf', 'gnaf-au', 'abs-au-postal-areas', 'geoscape-au-buildings', 'abs-au-boundaries']) {
    assert.ok(profile.openSourceIds.includes(id));
  }
});
