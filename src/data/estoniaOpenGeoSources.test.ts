import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Estonia registry separates Omniva, postal assignment, area, ADS object, building, and EHAK evidence', () => {
  const ids = getEuropeOpenSourceIds('EE');
  const omniva = EUROPE_OPEN_GEO_SOURCES['omniva-estonia-postcodes'];
  const assignments = EUROPE_OPEN_GEO_SOURCES['estonia-aks-postal-codes'];
  const areas = EUROPE_OPEN_GEO_SOURCES['estonia-aks-postal-areas'];
  const addresses = EUROPE_OPEN_GEO_SOURCES['estonia-aks-address-objects'];
  const buildings = EUROPE_OPEN_GEO_SOURCES['estonia-aks-building-shapes'];
  const administration = EUROPE_OPEN_GEO_SOURCES['estonia-ehak-admin-boundaries'];

  for (const id of [omniva.id, assignments.id, areas.id, addresses.id, buildings.id, administration.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(omniva.kind, 'postal-code');
  assert.match(omniva.notes, /distinct from ADS geometry/i);
  assert.equal(assignments.kind, 'postal-code');
  assert.match(assignments.notes, /ADR_ID/i);
  assert.equal(areas.kind, 'postal-code');
  assert.match(areas.notes, /official public AKS OGC/i);
  assert.equal(addresses.kind, 'address');
  assert.match(addresses.notes, /ADS_OID.*ADOB_ID/i);
  assert.equal(buildings.kind, 'building');
  assert.match(buildings.notes, /not proximity/i);
  assert.equal(administration.kind, 'admin-boundary');
  assert.match(administration.notes, /not a postal-code boundary/i);
});

test('Estonia official catalog exposes current operator, AKS, ADS, building, and EHAK sources', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('EE').map(source => [source.id, source]));

  assert.equal(sources.get('omniva-estonia-postcodes')?.authority, 'postal-operator');
  assert.equal(sources.get('estonia-aks-postal-codes')?.depth, 'address');
  assert.equal(sources.get('estonia-aks-postal-areas')?.depth, 'postcode');
  assert.equal(sources.get('estonia-aks-address-objects')?.depth, 'address');
  assert.equal(sources.get('estonia-aks-building-shapes')?.depth, 'building');
  assert.equal(sources.get('estonia-ehak-admin-boundaries')?.depth, 'geo-only');
});

test('Estonia address metadata points to current AKS sources and removes the Baltic fallback', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/northern_europe/EE.json'),
    'utf8',
  )) as {
    postalCode: { api: string; source: string };
    openSourceIds: string[];
  };

  assert.equal(
    profile.postalCode.api,
    'https://geoportaal.maaamet.ee/eng/spatial-data/address-data/postal-codes-p661.html',
  );
  assert.match(profile.postalCode.source, /Omniva.*AKS.*ADS/i);
  assert.ok(profile.openSourceIds.includes('omniva-estonia-postcodes'));
  assert.ok(profile.openSourceIds.includes('estonia-aks-postal-areas'));
  assert.ok(profile.openSourceIds.includes('estonia-aks-address-objects'));
  assert.ok(profile.openSourceIds.includes('estonia-aks-building-shapes'));
  assert.equal(profile.openSourceIds.includes('kartes-lv-postal-codes'), false);
});
