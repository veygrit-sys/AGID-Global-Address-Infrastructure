import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { parse } from 'yaml';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CATALOG = [
  'incm-mozambique-cep-2024',
  'incm-mozambique-postal-law-2016',
  'incm-mozambique-corre-universal-2024',
  'incm-mozambique-postal-operators',
  'mozambique-correios-dissolution-2021',
  'correios-mocambique-codigos-postais',
  'incm-mozambique-cep-rollout-2019-2022',
  'ine-mozambique-admin-cartography',
  'fnds-mozambique-land-cadastre',
  'intic-mozambique-data-protection-status-2026',
] as const;

test('Mozambique registry separates current CEP law, operator transition, legacy systems, administration, land, privacy and ODbL data', () => {
  const ids = new Set(getAfricaOpenSourceIds('MZ'));
  for (const id of [...CATALOG, 'osm-mozambique'] as const) assert.ok(ids.has(id), id);
  assert.match(AFRICA_OPEN_GEO_SOURCES['incm-mozambique-cep-2024'].notes, /eight digits.*five.*three.*territorial.*urban.*not.*boundary.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['incm-mozambique-postal-law-2016'].notes, /INCM.*regulator.*not.*assignment.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['incm-mozambique-corre-universal-2024'].notes, /CORRE.*universal.*2024.*not.*assignment.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['incm-mozambique-postal-operators'].notes, /licensed.*facility.*not.*catchment.*customer.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['mozambique-correios-dissolution-2021'].notes, /extinguish.*2021.*legacy.*not.*current/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['correios-mocambique-codigos-postais'].notes, /historical.*four-digit.*legacy.*not.*current.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['incm-mozambique-cep-rollout-2019-2022'].notes, /six-digit.*revoked.*pilot.*doors.*not.*national.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['ine-mozambique-admin-cartography'].notes, /administrative.*edition.*not.*postal.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['fnds-mozambique-land-cadastre'].notes, /land.*parcel.*holder.*restricted.*not.*postcode.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['intic-mozambique-data-protection-status-2026'].notes, /2026.*bill.*legislative.*constitutional.*personal.*query/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-mozambique'].license ?? '', /ODbL.*separate/i);
});

test('Mozambique official catalog keeps current assignment evidence separate from operator, legacy, admin, land and privacy context', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('MZ').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('incm-mozambique-cep-2024')?.sourceRole, 'postal-reference-data');
  assert.equal(sources.get('incm-mozambique-cep-2024')?.validationReadiness, 'reference-eligible');
  assert.equal(sources.get('incm-mozambique-corre-universal-2024')?.sourceRole, 'context-only');
  assert.equal(sources.get('correios-mocambique-codigos-postais')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('incm-mozambique-cep-rollout-2019-2022')?.sourceRole, 'context-only');
  assert.equal(sources.get('ine-mozambique-admin-cartography')?.depth, 'geo-only');
  assert.equal(sources.get('fnds-mozambique-land-cadastre')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('intic-mozambique-data-protection-status-2026')?.sourceRole, 'legal-framework-only');
});

test('Mozambique address JSON, YAML and hierarchy preserve current eight-digit CEP and evidence gates', () => {
  const json = JSON.parse(readFileSync(resolve(root, 'src/data/address_formats/africa/southern_africa/MZ.json'), 'utf8')) as any;
  const yaml = parse(readFileSync(resolve(root, 'src/data/address_formats/africa/southern_africa/MZ.yaml'), 'utf8'));
  assert.deepEqual(yaml, json);
  assert.equal(json.postalCode.format, 'NNNNN-NNN');
  assert.equal(json.postalCode.regex, '^\\d{5}-\\d{3}$');
  assert.equal(json.postalCode.api, 'https://www.incm.gov.mz/documentos-do-sector-postal/');
  assert.match(json.postalCode.source, /74\/2024.*eight digits.*supersedes.*six-digit.*four-digit.*does not prove.*boundary.*building/i);
  assert.match(json.addressRules.postalCode.label, /eight digits.*NNNNN-NNN.*territorial.*urban.*capital.*legacy four-digit.*NNNN-NN.*not current.*building/i);
  assert.deepEqual(json.addressRules.regionalHierarchy, ['country', 'addressingZone', 'province', 'urbanOrNonUrbanZone', 'districtCityOrTown', 'administrativeOrMunicipalPost', 'localityOrBairro', 'currentIncmCepAssignment', 'officialTerritorialOrUrbanSurfaceOrNoCanonicalGeometry', 'explicitCivicAddressPoint', 'explicitAddressLinkedBuildingFeature', 'exactRightsClearedBuilding', 'agidCell']);
});
