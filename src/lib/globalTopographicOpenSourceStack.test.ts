import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  GLOBAL_TOPOGRAPHIC_OPEN_SOURCE_IDS,
  GLOBAL_TOPOGRAPHIC_OPEN_SOURCES,
  auditGlobalTopographicOpenSources,
  buildGlobalTopographicFusionPlan,
  promoteGlobalTopographicSnapshot,
  type GlobalTopographicSnapshotEvidence,
} from './globalTopographicOpenSourceStack';
import type { TopographicLayerId } from './topographicExport';

const CORE_LAYERS: TopographicLayerId[] = [
  'satellite-imagery',
  'buildings',
  'roads',
  'railways',
  'waterways',
  'trees-green-spaces',
  'contour-lines',
  'terrain-mesh',
];

function evidence(
  overrides: Partial<GlobalTopographicSnapshotEvidence> = {},
): GlobalTopographicSnapshotEvidence {
  return {
    sourceId: 'overture-2026-07-22',
    versionId: '2026-07-22.0',
    publishedAt: '2026-07-22T00:00:00.000Z',
    retrievedAt: '2026-07-26T00:00:00.000Z',
    verifiedAt: '2026-07-26T01:00:00.000Z',
    sha256: `sha256:${'a'.repeat(64)}`,
    adapterVersion: 'agid-overture-adapter-v0.1',
    featureCount: 42,
    coverage: {
      scope: 'bbox',
      bounds: { south: 35.6, west: 139.6, north: 35.8, east: 139.9 },
      description: 'Verified synthetic test extent metadata; no bundled raw location fixture.',
    },
    licenseEvidenceUrl: 'https://docs.overturemaps.org/attribution/',
    horizontalCrs: 'EPSG:4326',
    verticalDatum: 'not-applicable: vector features',
    ...overrides,
  };
}

test('global open source catalog has complete executable evidence metadata', () => {
  assert.ok(GLOBAL_TOPOGRAPHIC_OPEN_SOURCE_IDS.length >= 14);
  assert.deepEqual(auditGlobalTopographicOpenSources(), []);

  for (const source of Object.values(GLOBAL_TOPOGRAPHIC_OPEN_SOURCES)) {
    assert.ok(source.license.id);
    assert.ok(source.version.id);
    assert.ok(source.coverage);
    assert.ok(source.correctionUrl);
    assert.ok(source.limitations.length > 0);
  }
});

test('core export layers have open source coverage and independent corroboration', () => {
  const plan = buildGlobalTopographicFusionPlan(CORE_LAYERS);

  assert.equal(plan.state, 'catalog-ready');
  assert.ok(plan.sourceIds.length >= 8);

  for (const layer of plan.layers) {
    assert.equal(layer.state, 'corroborated', `${layer.layerId} should be independently corroborated`);
    assert.ok(layer.preferredSourceId, `${layer.layerId} should have a preferred export source`);
  }

  const buildings = plan.layers.find(layer => layer.layerId === 'buildings');
  const terrain = plan.layers.find(layer => layer.layerId === 'terrain-mesh');
  assert.ok((buildings?.exportSourceIds.length ?? 0) >= 4);
  assert.ok((terrain?.exportSourceIds.length ?? 0) >= 2);
});

test('cadastral and LoD2 gaps remain explicit instead of becoming unsupported claims', () => {
  const plan = buildGlobalTopographicFusionPlan([
    'cadastral-parcels',
    'building-roofs-lod2',
  ]);

  assert.equal(plan.state, 'catalog-gaps');
  assert.equal(plan.layers[0]?.state, 'gap');
  assert.equal(plan.layers[1]?.state, 'gap');
  assert.ok(plan.nonClaims.some(nonClaim => nonClaim.includes('delivery-point')));
});

test('verified immutable evidence promotes an open source into the export gate', () => {
  const promoted = promoteGlobalTopographicSnapshot(evidence());

  assert.equal(promoted.reuseStatus, 'approved');
  assert.equal(promoted.version, '2026-07-22.0');
  assert.ok(promoted.layerIds.includes('buildings'));
  assert.ok(promoted.allowedFormats.includes('geojson'));
  assert.equal(promoted.snapshotEvidence?.contentSha256, `sha256:${'a'.repeat(64)}`);
  assert.equal(promoted.snapshotEvidence?.horizontalCrs, 'EPSG:4326');
  assert.equal(promoted.freshUntil, '2026-09-09T00:00:00.000Z');
});

test('catalog registration alone cannot promote validation-only or unverified data', () => {
  assert.throws(
    () => promoteGlobalTopographicSnapshot(evidence({
      sourceId: 'ghsl-p2023a',
      versionId: 'P2023A',
    })),
    /validation-only/,
  );

  assert.throws(
    () => promoteGlobalTopographicSnapshot(evidence({
      sha256: 'sha256:not-a-digest',
    })),
    /sha256 content digest/,
  );

  assert.throws(
    () => promoteGlobalTopographicSnapshot(evidence({
      versionId: 'latest',
    })),
    /requires version 2026-07-22.0/,
  );
});

test('rolling sources require a resolved snapshot version', () => {
  assert.throws(
    () => promoteGlobalTopographicSnapshot(evidence({
      sourceId: 'openstreetmap-weekly-planet',
      versionId: 'weekly-planet',
      licenseEvidenceUrl: 'https://www.openstreetmap.org/copyright',
    })),
    /resolved immutable version identifier/,
  );

  const promoted = promoteGlobalTopographicSnapshot(evidence({
    sourceId: 'openstreetmap-weekly-planet',
    versionId: 'planet-260724',
    licenseEvidenceUrl: 'https://www.openstreetmap.org/copyright',
  }));

  assert.equal(promoted.version, 'planet-260724');
  assert.equal(promoted.licenseId, 'ODbL-1.0');
});
