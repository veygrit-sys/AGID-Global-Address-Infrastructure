import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { parse } from 'yaml';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXPECTED_SOURCE_IDS = [
  'upu-liberia-addressing-2017',
  'mopt-liberia-postal-services',
  'mopt-liberia-service-charter-2025',
  'mopt-liberia-digital-postal-address-contract-2022',
  'lisgis-liberia-census-2022-geography',
  'lla-liberia-land-administration',
  'liberia-data-governance-policy-2026-draft',
  'osm-liberia',
] as const;

test('Liberia registry separates format, authority, services, digital-address project, administration, land, privacy and ODbL', () => {
  const ids = getAfricaOpenSourceIds('LR');
  for (const sourceId of EXPECTED_SOURCE_IDS) {
    const source = AFRICA_OPEN_GEO_SOURCES[sourceId];
    assert.ok(ids.includes(source.id));
    assert.match(source.url, /^https?:\/\//);
  }
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-liberia-addressing-2017'].notes, /four digits.*left.*locality.*not.*assignment.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['mopt-liberia-postal-services'].notes, /government.*postal authority.*not.*assignment.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['mopt-liberia-service-charter-2025'].notes, /regional offices.*privacy.*not.*postcode.*catchment/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['mopt-liberia-digital-postal-address-contract-2022'].notes, /contract.*not.*deployed.*public.*register.*coverage/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['lisgis-liberia-census-2022-geography'].notes, /Census 2022.*administrative.*structure.*not.*postal.*address/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['lla-liberia-land-administration'].notes, /cadastre.*land.*not.*postcode.*building.*holder/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['liberia-data-governance-policy-2026-draft'].notes, /draft.*not enacted.*personal.*no postal.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-liberia'].license ?? '', /ODbL.*separate.*share-alike/i);
});

test('Liberia official catalog exposes the same authority boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('LR').map(source => [source.id, source]));
  assert.equal(sources.get('upu-liberia-addressing-2017')?.authority, 'postal-operator');
  assert.equal(sources.get('upu-liberia-addressing-2017')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('mopt-liberia-postal-services')?.authority, 'government');
  assert.equal(sources.get('mopt-liberia-service-charter-2025')?.sourceRole, 'context-only');
  assert.equal(sources.get('mopt-liberia-digital-postal-address-contract-2022')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('lisgis-liberia-census-2022-geography')?.depth, 'geo-only');
  assert.equal(sources.get('lla-liberia-land-administration')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('liberia-data-governance-policy-2026-draft')?.sourceRole, 'legal-framework-only');
});

test('Liberia address metadata gates postcodes, polygons, personal contacts, buildings and AGID', () => {
  const format = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/africa/western_africa/LR.json'), 'utf8')) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } };
  };
  const yamlFormat = parse(readFileSync(resolve(root, 'src/data/address_formats/africa/western_africa/LR.yaml'), 'utf8'));
  assert.deepEqual(yamlFormat, format);
  assert.equal(format.postalCode.format, 'NNNN');
  assert.equal(format.postalCode.regex, '^\\d{4}$');
  assert.equal(format.postalCode.api, 'https://mopt.gov.lr/about-us/');
  assert.match(format.postalCode.source, /UPU Liberia 2017.*Ministry.*service charter.*digital postal address contract.*LISGIS.*Land Authority.*data governance.*OSM/i);
  assert.match(format.addressRules.postalCode.label, /4 digits.*left.*locality.*assignment.*not.*polygon.*building.*explicit/i);
  assert.equal(format.addressRules.postalCode.required, false);
  assert.equal(format.addressRules.postalCode.usage, 'used');
  assert.deepEqual(format.addressRules.regionalHierarchy, [
    'county',
    'districtOrClan',
    'cityTownOrLocality',
    'fourDigitPostcode',
    'deliveryTypeStreetPoBoxOrServicePoint',
    'officialPostalAreaPointOrNoCanonicalGeometry',
    'explicitCivicAddressPoint',
    'explicitAddressLinkedBuildingFeature',
    'exactRightsClearedBuilding',
    'agidCell',
  ]);
  for (const sourceId of EXPECTED_SOURCE_IDS) assert.ok(format.openSourceIds.includes(sourceId));
});
