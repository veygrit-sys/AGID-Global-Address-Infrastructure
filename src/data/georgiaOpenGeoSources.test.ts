import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { ASIA_OPEN_GEO_SOURCES, getAsiaOpenSourceIds } from './asiaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('Georgia registry separates operator, address, building, parcel, administration, and statistics evidence', () => {
  const ids = getAsiaOpenSourceIds('GE');
  const postal = ASIA_OPEN_GEO_SOURCES['georgian-post-postcode-finder'];
  const guide = ASIA_OPEN_GEO_SOURCES['georgian-post-addressing-guide'];
  const registry = ASIA_OPEN_GEO_SOURCES['napr-georgia-address-registry'];
  const address = ASIA_OPEN_GEO_SOURCES['nsdi-georgia-address-layer'];
  const building = ASIA_OPEN_GEO_SOURCES['nsdi-georgia-registered-buildings'];
  const parcel = ASIA_OPEN_GEO_SOURCES['nsdi-georgia-registered-parcels'];
  const administration = ASIA_OPEN_GEO_SOURCES['nsdi-georgia-administrative-boundaries'];
  const statistics = ASIA_OPEN_GEO_SOURCES['geostat-georgia-administrative-classification'];

  for (const id of [postal.id, guide.id, registry.id, address.id, building.id, parcel.id, administration.id, statistics.id]) {
    assert.ok(ids.includes(id));
  }
  assert.equal(postal.kind, 'postal-code');
  assert.match(postal.notes, /four-digit.*not.*polygon.*bulk/i);
  assert.equal(guide.kind, 'standard');
  assert.match(guide.notes, /postcode before.*locality.*not.*allocation/i);
  assert.equal(registry.kind, 'address');
  assert.match(registry.notes, /unique text record.*not.*bulk release.*building footprint/i);
  assert.equal(address.kind, 'address');
  assert.match(address.notes, /resource-specific access licence.*not.*blanket open/i);
  assert.equal(building.kind, 'building');
  assert.match(building.notes, /explicit relationship.*common authoritative identifier.*proximity.*candidate/i);
  assert.match(parcel.notes, /not a building.*address link.*postcode area.*owner|rightsholder/i);
  assert.match(administration.notes, /never create postcode membership.*sovereignty.*coverage gap/i);
  assert.match(statistics.notes, /classification.*not postal.*geometry/i);
});

test('Georgia official catalog exposes distinct source authorities', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('GE').map(source => [source.id, source]));

  assert.equal(sources.get('georgian-post-postcode-finder')?.authority, 'postal-operator');
  assert.equal(sources.get('georgian-post-postcode-finder')?.depth, 'postcode');
  assert.equal(sources.get('napr-georgia-address-registry')?.depth, 'address');
  assert.equal(sources.get('nsdi-georgia-address-layer')?.depth, 'address');
  assert.equal(sources.get('nsdi-georgia-registered-buildings')?.depth, 'building');
  assert.equal(sources.get('nsdi-georgia-registered-parcels')?.depth, 'geo-only');
  assert.equal(sources.get('nsdi-georgia-administrative-boundaries')?.depth, 'geo-only');
});

test('Georgia address metadata uses official sources and a building-aware hierarchy', () => {
  const profile = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/asia/caucasus/GE.json'),
    'utf8',
  )) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string } };
    openSourceIds: string[];
  };

  assert.equal(profile.postalCode.format, 'NNNN');
  assert.equal(profile.postalCode.regex, '^\\d{4}$');
  assert.equal(profile.postalCode.api, 'https://www.gpost.ge/help/postal-codes');
  assert.match(profile.postalCode.source, /Georgian Post.*NAPR Address Registry.*NSDI/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, [
    'regionOrAutonomousRepublic',
    'municipality',
    'cityTownVillageOrSettlement',
    'namedGeographicObjectOrStreet',
    'houseOrBuildingNumber',
    'registeredAddress',
    'buildingOrStructure',
    'entranceFloorOrUnit',
  ]);
  assert.match(profile.addressRules.postalCode.label, /4 digits.*operator assignment.*derived.*resource-specific.*building.*parcel.*separate/i);
  for (const id of [
    'georgian-post-postcode-finder',
    'georgian-post-addressing-guide',
    'napr-georgia-address-registry',
    'nsdi-georgia-address-layer',
    'nsdi-georgia-registered-buildings',
    'nsdi-georgia-registered-parcels',
    'nsdi-georgia-administrative-boundaries',
    'geostat-georgia-administrative-classification',
  ]) {
    assert.ok(profile.openSourceIds.includes(id));
  }
});
