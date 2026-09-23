import assert from 'node:assert/strict';
import test from 'node:test';

import { AGID_SYNTHETIC_TOPO_SOURCE } from './topographicExport';
import {
  type NormalizedElevationGrid,
  vectorizeNormalizedElevationGrid,
} from './topographicElevationVectorizer';
import { resolveAuditedTerrainPreviewLod } from './topographicTerrainLodSelection';

const grid: NormalizedElevationGrid = {
  gridId: 'lod-preview-fixture',
  title: 'LOD preview fixture',
  bounds: { south: 35, west: 139, north: 35.01, east: 139.01 },
  width: 4,
  height: 4,
  elevationsMeters: [
    0, 5, 5, 0,
    5, 20, 20, 5,
    5, 20, 20, 5,
    0, 5, 5, 0,
  ],
  rowOrder: 'north-to-south',
  horizontalCrs: 'EPSG:4326',
  verticalDatum: 'synthetic-local-datum',
  sourceRecord: AGID_SYNTHETIC_TOPO_SOURCE,
  generatedAt: '2026-07-27T15:00:00.000Z',
  countryCode: 'JP',
};

function createVectorizedFixture() {
  return vectorizeNormalizedElevationGrid(grid, {
    contourIntervalMeters: 5,
    includeContours: false,
    meshLodStrides: [1, 2],
    meshMaxVerticalErrorMeters: 20,
  });
}

test('terrain preview resolves only mesh LODs with matching passed audits', () => {
  const result = resolveAuditedTerrainPreviewLod(createVectorizedFixture(), 1);

  assert.equal(result.status, 'ready');
  if (result.status !== 'ready') return;
  assert.deepEqual(result.available.map(lod => lod.level), [0, 1]);
  assert.equal(result.selected.level, 1);
  assert.equal(result.selected.stride, 2);
  assert.equal(result.selected.quality.passed, true);
  assert.ok(result.selected.quality.maximumAbsoluteVerticalErrorMeters > 0);
  assert.ok(
    result.selected.quality.maximumAbsoluteVerticalErrorMeters
      <= result.selected.quality.maximumAllowedVerticalErrorMeters,
  );
});

test('terrain preview blocks a requested LOD that is not audited', () => {
  const result = resolveAuditedTerrainPreviewLod(createVectorizedFixture(), 2);

  assert.equal(result.status, 'blocked');
  if (result.status !== 'blocked') return;
  assert.equal(result.issueCode, 'terrain-lod-request-not-audited');
});

test('terrain preview blocks an aggregate audit without an explicit cap', () => {
  const vectorized = createVectorizedFixture();
  const result = resolveAuditedTerrainPreviewLod({
    ...vectorized,
    meshLodQuality: {
      ...vectorized.meshLodQuality,
      maximumAllowedVerticalErrorMeters: null,
    },
  });

  assert.equal(result.status, 'blocked');
  if (result.status !== 'blocked') return;
  assert.equal(result.issueCode, 'terrain-lod-audit-cap-missing');
});
