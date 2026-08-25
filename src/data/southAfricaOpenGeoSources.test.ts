import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXPECTED_SOURCE_IDS = [
  'upu-south-africa-postal-addressing',
  'sapo-postcodes',
  'postafind-za',
  'ngi-south-africa',
  'stats-sa-geography',
  'sasdi-south-africa',
  'nspdr-south-africa-terms',
] as const;

test('South Africa registry separates postal semantics, assignments, fallback, mapping, administration, and legal terms', () => {
  const ids = getAfricaOpenSourceIds('ZA');
  for (const sourceId of EXPECTED_SOURCE_IDS) {
    const source = AFRICA_OPEN_GEO_SOURCES[sourceId];
    assert.ok(ids.includes(source.id));
    assert.match(source.url, /^https?:\/\//);
  }

  const upu = AFRICA_OPEN_GEO_SOURCES['upu-south-africa-postal-addressing'];
  const sapo = AFRICA_OPEN_GEO_SOURCES['sapo-postcodes'];
  const fallback = AFRICA_OPEN_GEO_SOURCES['postafind-za'];
  const ngi = AFRICA_OPEN_GEO_SOURCES['ngi-south-africa'];
  const stats = AFRICA_OPEN_GEO_SOURCES['stats-sa-geography'];
  const sasdi = AFRICA_OPEN_GEO_SOURCES['sasdi-south-africa'];
  assert.equal(upu.kind, 'standard');
  assert.match(upu.notes, /four digits.*physical.*rural.*PO Box.*Private Bag.*not.*polygon/i);
  assert.equal(sapo.kind, 'postal-code');
  assert.match(sapo.notes, /official.*delivery type.*licence.*not.*geometry/i);
  assert.equal(fallback.usage, 'validation');
  assert.match(fallback.notes, /third-party.*not.*authority/i);
  assert.match(ngi.notes, /mapping.*geodetic.*not.*postal.*building link/i);
  assert.equal(stats.kind, 'admin-boundary');
  assert.match(stats.notes, /statistical.*not.*postal/i);
  assert.match(sasdi.notes, /governance.*not.*dataset licence/i);
});

test('South Africa official catalog exposes the same authority boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('ZA').map(source => [source.id, source]));
  assert.equal(sources.get('upu-south-africa-postal-addressing')?.authority, 'postal-operator');
  assert.equal(sources.get('upu-south-africa-postal-addressing')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('sapo-postcodes')?.authority, 'postal-operator');
  assert.equal(sources.get('sapo-postcodes')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('postafind-za')?.authority, 'commercial-or-restricted');
  assert.equal(sources.get('ngi-south-africa')?.depth, 'geo-only');
  assert.equal(sources.get('stats-sa-geography')?.depth, 'geo-only');
  assert.equal(sources.get('sasdi-south-africa')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('nspdr-south-africa-terms')?.sourceRole, 'legal-framework-only');
});

test('South Africa address metadata gates delivery types, polygons, and building claims', () => {
  const format = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/africa/southern_africa/ZA.json'), 'utf8',
  )) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } };
  };
  assert.equal(format.postalCode.format, 'NNNN');
  assert.equal(format.postalCode.regex, '^\\d{4}$');
  assert.equal(format.postalCode.api, 'https://www.postoffice.co.za/');
  assert.match(format.postalCode.source, /UPU.*South African Post Office.*NGI.*Stats SA.*SASDI/i);
  assert.match(format.addressRules.postalCode.label, /4 digits.*physical.*rural.*PO Box.*Private Bag.*not.*polygon.*building.*explicit/i);
  assert.equal(format.addressRules.postalCode.required, true);
  assert.equal(format.addressRules.postalCode.usage, 'required');
  assert.deepEqual(format.addressRules.regionalHierarchy, [
    'province',
    'districtOrMetropolitanMunicipality',
    'localMunicipality',
    'deliveryLocalityOrPostOffice',
    'fourDigitPostcode',
    'deliveryTypePhysicalRuralPoBoxOrPrivateBag',
    'officialPostalAreaPointOrNoCanonicalGeometry',
    'explicitCivicAddressPoint',
    'explicitAddressLinkedBuildingFeature',
    'exactRightsClearedBuilding',
  ]);
  for (const sourceId of EXPECTED_SOURCE_IDS) assert.ok(format.openSourceIds.includes(sourceId));
});
