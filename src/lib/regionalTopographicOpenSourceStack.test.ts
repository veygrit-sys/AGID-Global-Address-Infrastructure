import assert from 'node:assert/strict';
import test from 'node:test';

import { AFRICA_OPEN_GEO_SOURCES } from '../data/africaOpenGeoSources';
import { AMERICAS_OPEN_GEO_SOURCES } from '../data/americasOpenGeoSources';
import { ASIA_OPEN_GEO_SOURCES } from '../data/asiaOpenGeoSources';
import { EUROPE_OPEN_GEO_SOURCES } from '../data/europeOpenGeoSources';
import { OCEANIA_OPEN_GEO_SOURCES } from '../data/oceaniaOpenGeoSources';
import { POLAR_OPEN_GEO_SOURCES } from '../data/polarOpenGeoSources';
import {
  REGIONAL_TOPOGRAPHIC_OPEN_SOURCES,
  auditRegionalTopographicOpenSources,
  buildRegionalTopographicOpenSourcePlan,
  promoteRegionalTopographicSnapshot,
  type RegionalCatalogReference,
  type TopographicRegionId,
} from './regionalTopographicOpenSourceStack';
import { buildTopographicExportPlan } from './topographicExport';

const CATALOGS: Record<RegionalCatalogReference['catalog'], Record<string, unknown>> = {
  africa: AFRICA_OPEN_GEO_SOURCES,
  americas: AMERICAS_OPEN_GEO_SOURCES,
  asia: ASIA_OPEN_GEO_SOURCES,
  europe: EUROPE_OPEN_GEO_SOURCES,
  oceania: OCEANIA_OPEN_GEO_SOURCES,
  polar: POLAR_OPEN_GEO_SOURCES,
};

test('regional source registry passes metadata and catalog-reference audit', () => {
  assert.deepEqual(auditRegionalTopographicOpenSources(), []);

  for (const source of Object.values(REGIONAL_TOPOGRAPHIC_OPEN_SOURCES)) {
    for (const reference of source.catalogReferences) {
      assert.ok(
        reference.sourceId in CATALOGS[reference.catalog],
        `${source.id} references missing ${reference.catalog} source ${reference.sourceId}`,
      );
    }
  }
});

test('every continent has a regional or global elevation source and oceans have two bathymetry sources', () => {
  const continents: TopographicRegionId[] = [
    'africa',
    'asia',
    'europe',
    'north-america',
    'south-america',
    'oceania',
    'antarctica',
  ];

  for (const continent of continents) {
    assert.ok(
      Object.values(REGIONAL_TOPOGRAPHIC_OPEN_SOURCES).some(
        source =>
          source.dataKind === 'elevation-raster' &&
          (source.regions.includes(continent) || source.regions.includes('global')),
      ),
      `${continent} lacks an elevation source`,
    );
  }

  assert.ok(
    Object.values(REGIONAL_TOPOGRAPHIC_OPEN_SOURCES).filter(
      source =>
        source.dataKind === 'bathymetry-raster' &&
        (source.regions.includes('ocean') || source.regions.includes('global')),
    ).length >= 2,
  );
});

test('Japan land plan prioritizes GSI and keeps global vector corroboration', () => {
  const plan = buildRegionalTopographicOpenSourcePlan({
    bounds: { south: 35.66, west: 139.74, north: 35.69, east: 139.78 },
    countryCode: 'JP',
    surface: 'land',
    layerIds: ['terrain-mesh', 'contour-lines', 'buildings', 'roads'],
    outputFormat: 'gltf',
    targetCrs: 'EPSG:6677',
    targetResolutionMeters: 5,
  });

  assert.equal(plan.state, 'snapshot-evidence-required');
  assert.ok(plan.regionIds.includes('asia'));
  assert.equal(
    plan.layerPlans.find(layer => layer.layerId === 'terrain-mesh')?.preferredSourceId,
    'gsi-japan-dem',
  );
  assert.ok(
    plan.layerPlans
      .find(layer => layer.layerId === 'buildings')
      ?.globalExportSourceIds.includes('overture-2026-07-22'),
  );
  assert.ok(
    plan.layerPlans
      .find(layer => layer.layerId === 'terrain-mesh')
      ?.conversionStages.includes('triangulate-raster-to-tin'),
  );
});

test('coastal plans require a land DEM, bathymetry, and seam reconciliation', () => {
  const plan = buildRegionalTopographicOpenSourcePlan({
    bounds: { south: 38.68, west: -9.25, north: 38.72, east: -9.19 },
    countryCode: 'PT',
    surface: 'coastal',
    layerIds: ['terrain-mesh', 'contour-lines', 'waterways'],
    outputFormat: 'gltf',
    targetCrs: 'EPSG:3763',
  });
  const terrainSources = plan.layerPlans.find(
    layer => layer.layerId === 'terrain-mesh',
  )?.regionalSourceIds;

  assert.ok(
    terrainSources?.includes('copernicus-dem-glo30'),
    `terrain sources: ${terrainSources?.join(', ')}`,
  );
  assert.ok(
    terrainSources?.includes('emodnet-bathymetry'),
    `terrain sources: ${terrainSources?.join(', ')}`,
  );
  assert.equal(plan.gates.coastlineSeam, 'required');
  assert.ok(
    plan.layerPlans
      .find(layer => layer.layerId === 'terrain-mesh')
      ?.conversionStages.includes('snap-land-and-bathymetry-to-coastline-breakline'),
  );
});

test('Australia coastal plan prefers ELVIS and includes global ocean evidence', () => {
  const plan = buildRegionalTopographicOpenSourcePlan({
    bounds: { south: -33.9, west: 151.16, north: -33.84, east: 151.25 },
    countryCode: 'AU',
    surface: 'coastal',
    layerIds: ['terrain-mesh', 'contour-lines'],
  });
  const terrainSources = plan.layerPlans.find(
    layer => layer.layerId === 'terrain-mesh',
  )?.regionalSourceIds;

  assert.equal(terrainSources?.[0], 'ga-elvis');
  assert.ok(
    terrainSources?.includes('gebco-2025'),
    `terrain sources: ${terrainSources?.join(', ')}`,
  );
});

test('antimeridian AOIs remain in Oceania instead of wrapping to another continent', () => {
  const plan = buildRegionalTopographicOpenSourcePlan({
    bounds: { south: -18.2, west: 179.8, north: -17.8, east: -179.8 },
    surface: 'land',
    layerIds: ['terrain-mesh'],
  });

  assert.ok(plan.regionIds.includes('oceania'));
  assert.ok(plan.regionalSourceIds.includes('copernicus-dem-glo30'));
});

test('polar and ocean requests select the corresponding protected source families', () => {
  const antarctica = buildRegionalTopographicOpenSourcePlan({
    bounds: { south: -78.1, west: 165, north: -77.9, east: 165.4 },
    surface: 'land',
    layerIds: ['terrain-mesh'],
  });
  const arctic = buildRegionalTopographicOpenSourcePlan({
    bounds: { south: 78, west: 14, north: 78.2, east: 14.4 },
    surface: 'land',
    layerIds: ['terrain-mesh'],
  });
  const ocean = buildRegionalTopographicOpenSourcePlan({
    bounds: { south: -20, west: -145, north: -19.8, east: -144.8 },
    surface: 'ocean',
    layerIds: ['terrain-mesh', 'contour-lines'],
  });

  assert.ok(antarctica.regionalSourceIds.includes('rema-antarctica'));
  assert.ok(arctic.regionalSourceIds.includes('arcticdem'));
  assert.ok(ocean.regionalSourceIds.includes('gebco-2025'));
  assert.ok(ocean.regionalSourceIds.includes('noaa-etopo-2022'));
  assert.match(ocean.nonClaims.join(' '), /not for navigation/i);
});

test('snapshot promotion rejects unresolved versions, rights gaps, and invalid digests', () => {
  const common = {
    sourceId: 'gsi-japan-dem' as const,
    versionId: 'gsi-dem-tiles',
    publishedAt: '2026-07-01T00:00:00.000Z',
    retrievedAt: '2026-07-27T00:00:00.000Z',
    verifiedAt: '2026-07-27T01:00:00.000Z',
    sha256: `sha256:${'a'.repeat(64)}` as const,
    adapterVersion: 'gsi-dem-adapter-v1',
    recordOrCellCount: 100,
    coverage: {
      scope: 'bbox' as const,
      bounds: { south: 35.66, west: 139.74, north: 35.67, east: 139.75 },
      description: 'Synthetic test AOI metadata only.',
    },
    licenseEvidenceUrl: 'https://www.gsi.go.jp/ENGLISH/page_e30086.html',
    rightsDecision: 'approved' as const,
    horizontalCrs: 'EPSG:4326',
    verticalDatum: 'Japanese geodetic vertical reference',
  };

  assert.throws(
    () => promoteRegionalTopographicSnapshot(common),
    /immutable resolved version/,
  );
  assert.throws(
    () =>
      promoteRegionalTopographicSnapshot({
        ...common,
        versionId: 'gsi-dem-tiles-2026-07-27',
        rightsDecision: 'pending',
      }),
    /approved rights decision/,
  );
  assert.throws(
    () =>
      promoteRegionalTopographicSnapshot({
        ...common,
        versionId: 'gsi-dem-tiles-2026-07-27',
        sha256: 'sha256:bad',
      }),
    /sha256 content digest/,
  );
});

test('approved GEBCO evidence can back the existing glTF terrain export gate', () => {
  const bounds = { south: -20, west: -145, north: -19.99, east: -144.99 };
  const sourceRecord = promoteRegionalTopographicSnapshot({
    sourceId: 'gebco-2025',
    versionId: 'GEBCO_2025',
    publishedAt: '2025-01-01T00:00:00.000Z',
    retrievedAt: '2026-07-27T00:00:00.000Z',
    verifiedAt: '2026-07-27T01:00:00.000Z',
    sha256: `sha256:${'b'.repeat(64)}`,
    adapterVersion: 'gebco-netcdf-window-v1',
    recordOrCellCount: 400,
    coverage: { scope: 'bbox', bounds, description: 'Synthetic test AOI metadata only.' },
    licenseEvidenceUrl:
      'https://www.gebco.net/data-products/gridded-bathymetry/terms-of-use',
    rightsDecision: 'approved',
    horizontalCrs: 'EPSG:4326',
    verticalDatum: 'GEBCO_2025 documented sea-level reference',
  });
  const exportPlan = buildTopographicExportPlan({
    bounds,
    crs: 'EPSG:4326',
    format: 'gltf',
    layerIds: ['terrain-mesh'],
    sourceRecords: [sourceRecord],
    dataMode: 'source-backed',
    terrainResolutionMeters: 250,
    now: '2026-07-27T02:00:00.000Z',
  });

  assert.equal(
    exportPlan.status,
    'ready',
    exportPlan.issues.map(issue => `${issue.code}: ${issue.message}`).join('\n'),
  );
  assert.equal(exportPlan.sourceByLayer['terrain-mesh'], 'gebco-2025');
  assert.equal(sourceRecord.snapshotEvidence?.contentSha256, `sha256:${'b'.repeat(64)}`);
});
