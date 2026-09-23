import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Latvia registry separates operator, civic-address, building, and administrative evidence', () => {
  const ids = getEuropeOpenSourceIds('LV');
  const post = EUROPE_OPEN_GEO_SOURCES['latvijas-pasts-check-address'];
  const addresses = EUROPE_OPEN_GEO_SOURCES['vzd-latvia-address-register'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['vzd-latvia-cadastral-buildings'];
  const boundaries = EUROPE_OPEN_GEO_SOURCES['vzd-latvia-administrative-boundaries'];

  for (const id of [post.id, addresses.id, buildings.id, boundaries.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(post.kind, 'postal-code');
  assert.match(post.notes, /address.*membership.*not.*boundary/i);
  assert.equal(addresses.kind, 'address');
  assert.equal(addresses.usage, 'primary');
  assert.match(addresses.notes, /CC BY 4\.0.*weekly.*postcode/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /external contours.*explicit.*relation/i);
  assert.equal(boundaries.kind, 'admin-boundary');
  assert.match(boundaries.notes, /cannot.*postcode/i);
});

test('Latvia official catalog exposes authority-separated source families', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('LV').map(source => [source.id, source]));

  assert.equal(sources.get('latvijas-pasts-check-address')?.authority, 'postal-operator');
  assert.equal(sources.get('latvijas-pasts-check-address')?.depth, 'address');
  assert.equal(sources.get('vzd-latvia-address-register')?.authority, 'government');
  assert.equal(sources.get('vzd-latvia-address-register')?.depth, 'address');
  assert.equal(sources.get('vzd-latvia-cadastral-buildings')?.depth, 'building');
  assert.equal(sources.get('vzd-latvia-administrative-boundaries')?.depth, 'geo-only');
});

test('Latvia address metadata exposes source and evidence boundaries', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/northern_europe/LV.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.api, 'https://pasts.lv/en/services/tariffs-and-information/postcode-book');
  assert.match(profile.postalCode.source, /Latvijas Pasts.*VZD.*Address Register.*Cadastre/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['municipality', 'cityOrVillage', 'street', 'premise']);
  assert.match(profile.addressRules.postalCode.label, /LV-NNNN.*address membership.*special organization/i);
  for (const id of ['latvijas-pasts-check-address', 'vzd-latvia-address-register', 'vzd-latvia-cadastral-buildings', 'vzd-latvia-administrative-boundaries']) {
    assert.ok(profile.openSourceIds.includes(id));
  }
});
