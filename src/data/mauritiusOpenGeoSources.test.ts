import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { AFRICA_OPEN_GEO_SOURCES, getAfricaOpenSourceIds } from './africaOpenGeoSources';
import { getOfficialPostalSourcesForCountry } from '../lib/officialPostalSourceCatalog';

const CATALOG = [
  'mauritius-post-postcode',
  'upu-mauritius-postcode-rollout-2014',
  'mauritius-open-data-mainland-postcodes',
  'mauritius-open-data-rodrigues-postcodes',
  'mauritius-open-data-agalega-postcodes',
  'mauritius-open-data-post-offices',
  'mauritius-open-data-districts',
  'stats-mauritius-census-2022-admin',
  'mauritius-cadastral-survey-act-dcdb',
  'mauritius-data-protection-act-2017',
] as const;

test('Mauritius registry separates operator, three territory tables, facilities, administration, cadastre, privacy and ODbL data', () => {
  const ids = new Set(getAfricaOpenSourceIds('MU'));
  for (const id of [...CATALOG, 'osm-mauritius'] as const) assert.ok(ids.has(id), id);
  assert.match(AFRICA_OPEN_GEO_SOURCES['mauritius-post-postcode'].notes, /current.*finder.*not.*bulk.*boundary.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['upu-mauritius-postcode-rollout-2014'].notes, /2014.*Mauritius.*Rodrigues.*Agalega.*not.*current.*geometry/i);
  for (const id of ['mauritius-open-data-mainland-postcodes', 'mauritius-open-data-rodrigues-postcodes', 'mauritius-open-data-agalega-postcodes'] as const) {
    assert.match(AFRICA_OPEN_GEO_SOURCES[id].license ?? '', /CC BY-SA 4\.0.*exact.*artifact/i);
    assert.match(AFRICA_OPEN_GEO_SOURCES[id].notes, /assignment.*row.*not.*boundary.*building/i);
  }
  assert.match(AFRICA_OPEN_GEO_SOURCES['mauritius-open-data-post-offices'].notes, /facility.*not.*catchment.*customer.*polygon/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['mauritius-open-data-districts'].notes, /geographical district.*not.*administrative.*postal/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['stats-mauritius-census-2022-admin'].notes, /2022.*ward.*VCA.*changed.*not.*postal/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['mauritius-cadastral-survey-act-dcdb'].notes, /parcel.*street address.*access.*confidentiality.*not.*postcode.*building/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['mauritius-data-protection-act-2017'].notes, /personal.*location.*purpose.*security.*retention.*query/i);
  assert.match(AFRICA_OPEN_GEO_SOURCES['osm-mauritius'].license ?? '', /ODbL.*separate/i);
});

test('Mauritius official catalog preserves assignment, territory, non-geometry and restricted-cadastre boundaries', () => {
  const sources = new Map(getOfficialPostalSourcesForCountry('MU').map(source => [source.id, source]));
  for (const id of CATALOG) assert.ok(sources.has(id), id);
  assert.equal(sources.get('mauritius-post-postcode')?.sourceRole, 'postal-reference-data');
  assert.equal(sources.get('mauritius-post-postcode')?.validationReadiness, 'reference-eligible');
  for (const id of ['mauritius-open-data-mainland-postcodes', 'mauritius-open-data-rodrigues-postcodes', 'mauritius-open-data-agalega-postcodes'] as const) {
    assert.equal(sources.get(id)?.trustTier, 'official');
    assert.equal(sources.get(id)?.validationReadiness, 'reference-eligible');
  }
  assert.equal(sources.get('mauritius-open-data-post-offices')?.sourceRole, 'context-only');
  assert.equal(sources.get('mauritius-open-data-districts')?.depth, 'geo-only');
  assert.equal(sources.get('stats-mauritius-census-2022-admin')?.sourceRole, 'context-only');
  assert.equal(sources.get('mauritius-cadastral-survey-act-dcdb')?.availability, 'commercial-or-restricted');
  assert.equal(sources.get('mauritius-data-protection-act-2017')?.sourceRole, 'legal-framework-only');
});

test('Mauritius address profile preserves outer-island prefixes and keeps postal, administrative and building evidence separate', () => {
  const profile = JSON.parse(readFileSync('src/data/address_formats/africa/eastern_africa/MU.json', 'utf8')) as any;
  assert.equal(profile.postalCode.regex, '^(?:[1-9]\\d{4}|[AR]\\d{4})$');
  assert.equal(profile.postalCode.api, 'https://www.mauritiuspost.mu/find-your-post-code/');
  assert.match(profile.postalCode.source, /current Mauritius Post.*CC BY-SA 4\.0.*do not provide.*boundaries.*address-building/i);
  assert.deepEqual(profile.addressRules.regionalHierarchy, ['country', 'postalTerritoryMainRodriguesOrAgalega', 'statisticalDistrictOrOuterIslandRegion', 'municipalOrDistrictCouncilArea', 'municipalWardVillageCouncilAreaOrLocality', 'sublocality', 'currentMauritiusPostAssignment', 'officialPostalSurfaceOrNoCanonicalGeometry', 'explicitCivicAddressPoint', 'explicitAddressLinkedBuildingFeature', 'exactRightsClearedBuilding', 'agidCell']);
});
