import assert from 'node:assert/strict';
import { test } from 'node:test';

import { resolveSourceLicenseStatus } from './sourceLicensePolicy';
import {
GLOBAL_SPACE_AGENCY_OPEN_SOURCE_IDS,
NASA_DIRECT_OPEN_SOURCE_IDS,
SPACE_AGENCY_DATA_USAGE_PLAN,
SPACE_AGENCY_OPEN_GEO_SOURCES,
getRedistributableSpaceAgencyOpenGeoSources,
getSpaceAgencyOpenGeoSourcesForUse,
getSpaceAgencySourceIdsForWorkflow,
} from './spaceAgencyOpenGeoSources';

const OFFICIAL_SOURCE_URL =
  /^https:\/\/(?:www\.)?(?:earthdata\.nasa\.gov|cmr\.earthdata\.nasa\.gov|nasa-gibs\.github\.io|firms\.modaps\.eosdis\.nasa\.gov|esa-worldcover\.org|dataspace\.copernicus\.eu|documentation\.dataspace\.copernicus\.eu|eorc\.jaxa\.jp|usgs\.gov)\//;

test('NASA direct open Earth-observation sources are registered for AGID enrichment', () => {
  assert.ok(NASA_DIRECT_OPEN_SOURCE_IDS.length >= 5);

  for (const sourceId of NASA_DIRECT_OPEN_SOURCE_IDS) {
    const source = SPACE_AGENCY_OPEN_GEO_SOURCES[sourceId];

    assert.equal(source.agency, 'NASA');
    assert.match(source.url, OFFICIAL_SOURCE_URL, `${sourceId} should use an official NASA URL`);
    assert.ok(source.agidUses.length > 0, `${sourceId} should declare AGID usage`);
    assert.ok(source.license?.trim(), `${sourceId} should include license metadata`);
  }
});

test('global space-agency registry includes ESA Copernicus JAXA and USGS sources', () => {
  const sourceIds = new Set(GLOBAL_SPACE_AGENCY_OPEN_SOURCE_IDS);

  for (const sourceId of [
    'esa-worldcover',
    'copernicus-data-space-stac',
    'copernicus-dem',
    'jaxa-aw3d30',
    'usgs-landsat-collection2',
  ] as const) {
    assert.ok(sourceIds.has(sourceId), `${sourceId} should be registered`);
    assert.match(SPACE_AGENCY_OPEN_GEO_SOURCES[sourceId].url, OFFICIAL_SOURCE_URL);
  }
});

test('space-agency usage plan maps each workflow to registered sources', () => {
  for (const workflow of Object.values(SPACE_AGENCY_DATA_USAGE_PLAN)) {
    assert.ok(workflow.sourceIds.length > 0, `${workflow.id} should name source ids`);
    assert.ok(workflow.outputSignals.length > 0, `${workflow.id} should define derived signals`);

    for (const sourceId of workflow.sourceIds) {
      assert.ok(SPACE_AGENCY_OPEN_GEO_SOURCES[sourceId], `${workflow.id} references ${sourceId}`);
    }
  }

  assert.ok(getSpaceAgencySourceIdsForWorkflow('terrain-and-relief').includes('nasa-nasadem-srtm'));
  assert.ok(getSpaceAgencySourceIdsForWorkflow('water-and-wetland').includes('nasa-gibs-worldview'));
});

test('license helper only treats clearly redistributable space-agency sources as bundle-safe', () => {
  const redistributableIds = getRedistributableSpaceAgencyOpenGeoSources().map(source => source.id);

  assert.ok(redistributableIds.includes('nasa-nasadem-srtm'));
  assert.ok(redistributableIds.includes('nasa-modis-land-cover'));
  assert.ok(redistributableIds.includes('esa-worldcover'));
  assert.ok(redistributableIds.includes('usgs-landsat-collection2'));

  assert.ok(!redistributableIds.includes('nasa-earthdata-cmr'));
  assert.ok(!redistributableIds.includes('nasa-gibs-worldview'));
  assert.ok(!redistributableIds.includes('copernicus-data-space-stac'));
  assert.ok(!redistributableIds.includes('jaxa-aw3d30'));
});

test('review-required labels stay outside redistributable data packs', () => {
  for (const sourceId of [
    'nasa-earthdata-cmr',
    'nasa-gibs-worldview',
    'nasa-firms-fire',
    'copernicus-data-space-stac',
    'copernicus-dem',
    'jaxa-aw3d30',
  ] as const) {
    const status = resolveSourceLicenseStatus(SPACE_AGENCY_OPEN_GEO_SOURCES[sourceId]);

    assert.equal(status.redistributable, false, `${sourceId} should require review`);
    assert.equal(status.requiresReview, true, `${sourceId} should require review`);
  }
});

test('natural geography uses can select focused space-agency source subsets', () => {
  const waterSourceIds = getSpaceAgencyOpenGeoSourcesForUse('water-context').map(source => source.id);
  const terrainSourceIds = getSpaceAgencyOpenGeoSourcesForUse('terrain-context').map(source => source.id);

  assert.ok(waterSourceIds.includes('esa-worldcover'));
  assert.ok(waterSourceIds.includes('usgs-landsat-collection2'));
  assert.ok(waterSourceIds.includes('copernicus-data-space-stac'));

  assert.ok(terrainSourceIds.includes('nasa-nasadem-srtm'));
  assert.ok(terrainSourceIds.includes('jaxa-aw3d30'));
  assert.ok(terrainSourceIds.includes('copernicus-dem'));
});
