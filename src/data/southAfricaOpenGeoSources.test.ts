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
  'upu-south-africa-postal-addressing',
  'sapo-postcodes',
  'sapo-website-terms',
  'postafind-za',
  'ngi-south-africa',
  'stats-sa-geography',
  'stats-sa-census-2022-geography',
  'mdb-south-africa-wards-2025',
  'csg-south-africa-cadastre',
  'south-africa-popia-2013',
  'osm-south-africa',
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
  assert.match(sapo.notes, /downloadable.*Excel.*TXT.*digest.*delivery type.*written reuse.*not geometry/i);
  assert.equal(fallback.usage, 'validation');
  assert.match(fallback.notes, /third-party.*not.*authority/i);
  assert.match(ngi.notes, /mapping.*geodetic.*not.*postal.*building link/i);
  assert.equal(stats.kind, 'admin-boundary');
  assert.match(stats.notes, /statistical.*not.*postal/i);
  assert.match(sasdi.notes, /governance.*not.*dataset licence/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['sapo-website-terms'].notes, /personal non-commercial.*written permission.*not postal assignment/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['stats-sa-census-2022-geography'].notes, /Census 2022.*not.*SAPO.*postcode.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['mdb-south-africa-wards-2025'].notes, /December 2025.*gazette.*ward.*not.*postcode.*catchment/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['csg-south-africa-cadastre'].notes, /parcels.*servitudes.*not postcode.*building.*holders/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['south-africa-popia-2013'].notes, /physical address.*location.*personal information.*minimisation.*no postcode.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-south-africa'].license ?? '', /ODbL.*separate.*share-alike/i);
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
  assert.equal(sources.get('sapo-website-terms')?.sourceRole, 'legal-framework-only');
  assert.equal(sources.get('stats-sa-census-2022-geography')?.depth, 'geo-only');
  assert.equal(sources.get('mdb-south-africa-wards-2025')?.depth, 'geo-only');
  assert.equal(sources.get('csg-south-africa-cadastre')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('south-africa-popia-2013')?.sourceRole, 'legal-framework-only');
});

test('South Africa address metadata gates delivery types, polygons, and building claims', () => {
  const format = JSON.parse(readFileSync(
    resolve(root, 'src/data/address_formats/africa/southern_africa/ZA.json'), 'utf8',
  )) as {
    postalCode: { format: string; regex: string; api: string; source: string };
    openSourceIds: string[];
    addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } };
  };
  const yamlFormat = parse(readFileSync(
    resolve(root, 'src/data/address_formats/africa/southern_africa/ZA.yaml'), 'utf8',
  ));
  assert.deepEqual(yamlFormat, format);
  assert.equal(format.postalCode.format, 'NNNN');
  assert.equal(format.postalCode.regex, '^\\d{4}$');
  assert.equal(format.postalCode.api, 'https://www.postoffice.co.za/Tools/postalcodes.html');
  assert.match(format.postalCode.source, /UPU.*South African Post Office.*website terms.*NGI.*Census 2022.*MDB 2025.*CSG.*POPIA.*OSM/i);
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
    'agidCell',
  ]);
  for (const sourceId of EXPECTED_SOURCE_IDS) assert.ok(format.openSourceIds.includes(sourceId));
});
