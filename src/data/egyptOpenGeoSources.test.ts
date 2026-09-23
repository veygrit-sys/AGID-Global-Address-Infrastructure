import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const EXPECTED = ['upu-egypt-postal-addressing-2023', 'egypt-post-new-postcode-guide', 'egypt-post', 'capmas-egypt-gis', 'esa-egypt-geoportal', 'egy-list'] as const;

test('Egypt registry separates seven-digit semantics, lookup, operator, statistics, survey, and community sources', () => {
  const ids = getAfricaOpenSourceIds('EG');
  for (const id of EXPECTED) {
    const source = AFRICA_OPEN_GEO_SOURCES[id];
    assert.ok(ids.includes(source.id));
    assert.match(source.url, /^https?:\/\//);
  }
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-egypt-postal-addressing-2023'].notes, /seven digits.*province.*locality.*neighbourhood.*community.*not.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['egypt-post-new-postcode-guide'].notes, /GPS.*address.*point.*not.*surface.*bulk/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['egypt-post'].notes, /official.*record.*not.*geometry.*licence/i);
  assert.equal(AFRICA_OPEN_GEO_SOURCES['capmas-egypt-gis'].kind, 'admin-boundary');
  assert.match(AFRICA_OPEN_GEO_SOURCES['capmas-egypt-gis'].notes, /statistical.*building-level.*not.*postal.*licence/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['esa-egypt-geoportal'].notes, /survey.*cadastral.*not.*postal.*redistribution/i);
  assert.equal(AFRICA_OPEN_GEO_SOURCES['egy-list'].usage, 'validation');
});

test('Egypt official catalog exposes matching authority boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('EG').map(source => [source.id, source]));
  assert.equal(sources.get('upu-egypt-postal-addressing-2023')?.authority, 'postal-operator');
  assert.equal(sources.get('upu-egypt-postal-addressing-2023')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('egypt-post-new-postcode-guide')?.depth, 'address');
  assert.equal(sources.get('egypt-post')?.authority, 'postal-operator');
  assert.equal(sources.get('capmas-egypt-gis')?.depth, 'geo-only');
  assert.equal(sources.get('esa-egypt-geoportal')?.depth, 'geo-only');
  assert.equal(sources.get('egy-list')?.authority, 'community');
});

test('Egypt address metadata migrates to seven digits and gates derived polygons and buildings', () => {
  const format = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/africa/northern_africa/EG.json'), 'utf8')) as { postalCode: { format: string; regex: string; api: string; source: string }; openSourceIds: string[]; addressRules: { regionalHierarchy: string[]; postalCode: { label: string; required: boolean; usage: string } } };
  assert.equal(format.postalCode.format, 'NNNNNNN');
  assert.equal(format.postalCode.regex, '^\\d{7}$');
  assert.equal(format.postalCode.api, 'https://www.egyptpost.org/');
  assert.match(format.postalCode.source, /UPU.*Egypt Post.*CAPMAS.*Survey Authority/i);
  assert.match(format.addressRules.postalCode.label, /7 digits.*province.*locality.*neighbourhood.*community.*legacy.*not.*polygon.*building.*explicit/i);
  assert.equal(format.addressRules.postalCode.required, true);
  assert.equal(format.addressRules.postalCode.usage, 'required');
  assert.deepEqual(format.addressRules.regionalHierarchy, ['governorate', 'locality', 'neighbourhood', 'community', 'sevenDigitPostcode', 'officialPostalAreaOrNoCanonicalGeometry', 'explicitCivicAddressPoint', 'explicitAddressLinkedBuildingFeature', 'exactRightsClearedBuilding']);
  for (const id of EXPECTED) assert.ok(format.openSourceIds.includes(id));
});
