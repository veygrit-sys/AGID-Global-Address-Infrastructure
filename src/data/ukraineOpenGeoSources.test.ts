import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { EUROPE_OPEN_GEO_SOURCES, getEuropeOpenSourceIds } from './europeOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Ukraine registry separates postal, address, building, operational, and NSDI evidence', () => {
  const ids = getEuropeOpenSourceIds('UA');
  const postal = EUROPE_OPEN_GEO_SOURCES['ukrposhta-postcodes-open-data'];
  const operatorApi = EUROPE_OPEN_GEO_SOURCES['ukrposhta-index-and-address-api'];
  const address = EUROPE_OPEN_GEO_SOURCES['ukraine-unified-address-register'];
  const building = EUROPE_OPEN_GEO_SOURCES['ukraine-building-register'];
  const nsdi = EUROPE_OPEN_GEO_SOURCES['ukraine-nsdi'];

  for (const id of [postal.id, operatorApi.id, address.id, building.id, nsdi.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postal.kind, 'postal-code');
  assert.match(postal.notes, /five-digit.*text.*not.*polygon/i);
  assert.equal(operatorApi.kind, 'address');
  assert.match(operatorApi.notes, /LOCK_CODE.*operational.*not.*territorial/i);
  assert.equal(address.kind, 'address');
  assert.match(address.notes, /authoritative identifier.*not.*bulk/i);
  assert.equal(building.kind, 'building');
  assert.match(building.notes, /explicit.*crosswalk.*proximity/i);
  assert.equal(nsdi.kind, 'admin-boundary');
  assert.match(nsdi.notes, /wartime.*restricted.*layer-by-layer/i);
});

test('Ukraine official catalog exposes distinct national source authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('UA').map(source => [source.id, source]));

  assert.equal(sources.get('ukrposhta-postcodes-open-data')?.authority, 'postal-operator');
  assert.equal(sources.get('ukrposhta-postcodes-open-data')?.depth, 'postcode');
  assert.equal(sources.get('ukrposhta-index-and-address-api')?.depth, 'address');
  assert.equal(sources.get('ukraine-unified-address-register')?.authority, 'government');
  assert.equal(sources.get('ukraine-unified-address-register')?.depth, 'address');
  assert.equal(sources.get('ukraine-building-register')?.depth, 'building');
  assert.equal(sources.get('ukraine-nsdi')?.depth, 'geo-only');
});

test('Ukraine address metadata uses official sources and a building-aware hierarchy', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/europe/eastern_europe/UA.json'),
    'utf8',
  )) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.format, 'NNNNN');
  assert.equal(profile.postalCode.regex, '^\\d{5}$');
  assert.equal(profile.postalCode.api, 'https://index.ukrposhta.ua/');
  assert.match(profile.postalCode.source, /Ukrposhta.*UPU.*Unified State Address Register.*NSDI/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, [
    'oblastOrSpecialStatusCity',
    'raion',
    'territorialCommunity',
    'settlement',
    'street',
    'addressNumber',
    'buildingOrStructure',
    'entrance',
    'unit',
  ]);
  assert.match(profile.addressRules.postalCode.label, /5 digits.*routing.*service status.*area requires source evidence/i);
  for (const id of [
    'ukrposhta-postcodes-open-data',
    'ukrposhta-index-and-address-api',
    'ukraine-unified-address-register',
    'ukraine-building-register',
    'ukraine-nsdi',
  ]) {
    assert.ok(profile.openSourceIds.includes(id));
  }
  assert.equal(profile.openSourceIds.includes('geonames-postal'), true);
});
