import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const CATALOG = [
  'paositra-malagasy',
  'paositra-malagasy-agencies',
  'upu-madagascar-addressing-2011',
  'openstat-madagascar-postcodes-2021',
  'un-salb-madagascar-ftm',
  'matsf-madagascar-geospatial-land',
  'madagascar-data-protection-2014-038',
] as const;

test('Madagascar registry separates current operator, dated format, community candidates, administration, land, privacy and ODbL data', () => {
  const ids = new Set(getAfricaOpenSourceIds('MG'));
  for (const id of [...CATALOG, 'osm-madagascar'] as const) assert.ok(ids.has(id), id);
  assert.match(AFRICA_OPEN_GEO_SOURCES['paositra-malagasy'].notes, /current.*operator.*101 ANTANANARIVO.*no.*complete.*postcode.*boundary.*licence/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['paositra-malagasy-agencies'].notes, /agency.*not.*assignment.*catchment.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-madagascar-addressing-2011'].notes, /three digits.*left.*historical province.*Fivondronana.*examples.*not current.*geometry/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['openstat-madagascar-postcodes-2021'].notes, /manually collected.*communes may be missing.*CC BY 4\.0.*candidate.*not.*Paositra Malagasy/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['un-salb-madagascar-ftm'].notes, /validated.*administrative.*validity.*not.*postal/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['matsf-madagascar-geospatial-land'].notes, /territorial.*land.*not.*postcode.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['matsf-madagascar-geospatial-land'].license ?? '', /product-specific.*licence.*redistribution/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['madagascar-data-protection-2014-038'].notes, /purpose.*proportionality.*security.*retention.*addresses.*query/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-madagascar'].license ?? '', /ODbL.*separate/i);
});

test('Madagascar official catalog preserves current-assignment, non-geometry and community limitations', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('MG').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('paositra-malagasy')?.sourceRole, 'context-only');
  assert.equal(sources.get('paositra-malagasy')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('paositra-malagasy-agencies')?.sourceRole, 'context-only');
  assert.equal(sources.get('upu-madagascar-addressing-2011')?.sourceRole, 'context-only');
  assert.equal(sources.get('openstat-madagascar-postcodes-2021')?.trustTier, 'open-reference');
  assert.equal(sources.get('openstat-madagascar-postcodes-2021')?.validationReadiness, 'metadata-only');
  assert.equal(sources.get('un-salb-madagascar-ftm')?.depth, 'geo-only');
  assert.equal(sources.get('matsf-madagascar-geospatial-land')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('madagascar-data-protection-2014-038')?.sourceRole, 'legal-framework-only');
});

test('Madagascar address profile requires current assignment evidence and keeps historical administration separate', () => {
  const profile = JSON.parse(readFileSync('src/data/address_formats/africa/eastern_africa/MG.json', 'utf8')) as any;
  assert.equal(profile.postalCode.regex, '^[1-6]\\d{2}$');
  assert.equal(profile.postalCode.api, 'https://www.paositramalagasy.mg/');
  assert.match(profile.postalCode.source, /current.*dated UPU.*no reviewed current nationwide.*boundary.*licence/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['country', 'historicalProvinceSemantics', 'currentRegion', 'currentDistrict', 'commune', 'fokontanyOrLocality', 'paositraThreeDigitAssignment', 'officialPostalSurfaceOrNoCanonicalGeometry', 'explicitCivicAddressPoint', 'explicitAddressLinkedBuildingFeature', 'exactRightsClearedBuilding', 'agidCell']);
});
