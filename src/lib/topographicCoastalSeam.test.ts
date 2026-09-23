import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AGID_SYNTHETIC_TOPO_SOURCE,
  type TopographicSourceRecord,
} from './topographicExport';
import {
  COASTAL_SURFACE_BREAKLINE,
  COASTAL_SURFACE_LAND,
  COASTAL_SURFACE_OCEAN,
  createCoastalGridLattice,
  hashCoastalGridLattice,
  reconcileCoastalElevationGrids,
} from './topographicCoastalSeam';
import {
  createSyntheticCoastalTerrainGltfBundle,
  serializeCoastalSeamManifest,
  serializeCoastalTerrainGltfBundle,
  serializeCoastalTerrainGltfEvidenceBundle,
} from './topographicCoastalExport';
import type { CoastlineLegendPromotionEvidence } from './topographicCoastlineLegendPromotion';
import type { NormalizedElevationGrid } from './topographicElevationVectorizer';

const bounds = {
  south: 0,
  west: 0,
  north: 0.01,
  east: 0.01,
};
const landDigest = `sha256:${'a'.repeat(64)}` as const;
const bathymetryDigest = `sha256:${'b'.repeat(64)}` as const;
const coastlineDigest = `sha256:${'c'.repeat(64)}` as const;
const coastlineSourceId = 'synthetic-coastline';

function source(
  sourceId: string,
  digest: string,
  layerIds: TopographicSourceRecord['layerIds'],
  relatedArtifactSha256: `sha256:${string}`[] = [],
): TopographicSourceRecord {
  return {
    ...AGID_SYNTHETIC_TOPO_SOURCE,
    sourceId,
    layerIds,
    snapshotEvidence: {
      contentSha256: digest as `sha256:${string}`,
      adapterVersion: 'synthetic-coastal-test-adapter-v1',
      verifiedAt: '2026-07-27T08:00:00.000Z',
      horizontalCrs: 'EPSG:4326',
      verticalDatum: layerIds.includes('terrain-mesh')
        ? 'synthetic-mean-sea-level'
        : 'not-applicable: coastline classification',
      ...(relatedArtifactSha256.length === 0
        ? {}
        : { relatedArtifactSha256 }),
    },
    notes: [...(AGID_SYNTHETIC_TOPO_SOURCE.notes ?? []), `Snapshot digest: ${digest}.`],
  };
}

const landSource = source('synthetic-land-dem', landDigest, ['terrain-mesh']);
const bathymetrySource = source(
  'synthetic-bathymetry',
  bathymetryDigest,
  ['terrain-mesh'],
);
function grid(
  gridId: string,
  elevationsMeters: number[],
  sourceRecord: TopographicSourceRecord,
): NormalizedElevationGrid {
  return {
    gridId,
    title: gridId,
    bounds,
    width: 3,
    height: 3,
    elevationsMeters,
    rowOrder: 'north-to-south',
    horizontalCrs: 'EPSG:4326',
    verticalDatum: 'synthetic-mean-sea-level',
    sourceRecord,
    generatedAt: '2026-07-27T08:00:00.000Z',
  };
}

async function sha256(bytes: Uint8Array) {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    Uint8Array.from(bytes).buffer,
  );
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

const classes = Uint8Array.from([
  COASTAL_SURFACE_LAND,
  COASTAL_SURFACE_BREAKLINE,
  COASTAL_SURFACE_OCEAN,
  COASTAL_SURFACE_LAND,
  COASTAL_SURFACE_BREAKLINE,
  COASTAL_SURFACE_OCEAN,
  COASTAL_SURFACE_LAND,
  COASTAL_SURFACE_BREAKLINE,
  COASTAL_SURFACE_OCEAN,
]);

async function request(overrides: Record<string, unknown> = {}) {
  const landGrid = grid(
    'land',
    [5, 1, 0, 6, 0.5, 0, 7, 1.5, 0],
    landSource,
  );
  const bathymetryGrid = grid(
    'bathymetry',
    [0, -1, -5, 0, -0.5, -6, 0, -1.5, -7],
    bathymetrySource,
  );
  const coordinateLattice = createCoastalGridLattice(landGrid);
  const coordinateLatticeSha256 = await hashCoastalGridLattice(
    coordinateLattice,
  );
  const coastlineSource = source(
    coastlineSourceId,
    coastlineDigest,
    ['waterways'],
    [coordinateLatticeSha256],
  );
  return {
    land: {
      grid: landGrid,
      sourceSnapshotSha256: landDigest,
    },
    bathymetry: {
      grid: bathymetryGrid,
      sourceSnapshotSha256: bathymetryDigest,
    },
    coastline: {
      maskId: 'synthetic-coastline-mask',
      width: 3,
      height: 3,
      bounds,
      rowOrder: 'north-to-south' as const,
      horizontalCrs: 'EPSG:4326' as const,
      coordinateLattice,
      expectedCoordinateLatticeSha256: coordinateLatticeSha256,
      classes,
      sourceRecord: coastlineSource,
      sourceSnapshotSha256: coastlineDigest,
      expectedClassificationSha256: await sha256(classes),
      adapterVersion: 'synthetic-coastline-adapter-v1',
      shorelineEpoch: '2026-01-01T00:00:00.000Z',
      legendPromotion: null as CoastlineLegendPromotionEvidence | null,
    },
    targetVerticalDatum: 'synthetic-mean-sea-level',
    generatedAt: '2026-07-27T08:10:00.000Z',
    maximumAdjustmentMeters: 2,
    ...overrides,
  };
}

test('coastal seam reconciles land and bathymetry through an evidenced breakline', async () => {
  const result = await reconcileCoastalElevationGrids(await request());

  assert.equal(result.sourceGates.land.status, 'ready');
  assert.equal(result.sourceGates.bathymetry.status, 'ready');
  assert.equal(result.sourceGates.coastline.status, 'ready');
  assert.deepEqual(Array.from(result.grid.elevationsMeters), [
    5, 0, -5,
    6, 0, -6,
    7, 0, -7,
  ]);
  assert.equal(result.metrics.landCellCount, 3);
  assert.equal(result.metrics.breaklineCellCount, 3);
  assert.equal(result.metrics.oceanCellCount, 3);
  assert.equal(result.metrics.maximumLandBreaklineAdjustmentMeters, 1.5);
  assert.equal(result.metrics.maximumBathymetryBreaklineAdjustmentMeters, 1.5);
  assert.equal(result.provenance.landSnapshotSha256, landDigest);
  assert.match(result.provenance.coordinateLatticeSha256, /^sha256:[a-f0-9]{64}$/);
  assert.equal(result.provenance.coastlineAdapterVersion, 'synthetic-coastline-adapter-v1');
  assert.equal(result.grid.sourceIds.coastline, coastlineSourceId);
  assert.doesNotMatch(
    JSON.stringify({
      grid: result.grid,
      provenance: result.provenance,
      metrics: result.metrics,
    }),
    /recipient|room_number|delivery_instruction|private_key|proof_secret/i,
  );
});

test('coastal seam rejects datum mismatch, unbound snapshot evidence, and unbound coordinate lattices', async () => {
  const mismatched = await request();
  mismatched.bathymetry.grid.verticalDatum = 'different-datum';
  await assert.rejects(
    () => reconcileCoastalElevationGrids(mismatched),
    /target vertical datum/,
  );

  const unbound = await request();
  unbound.land.sourceSnapshotSha256 = `sha256:${'d'.repeat(64)}`;
  await assert.rejects(
    () => reconcileCoastalElevationGrids(unbound),
    /not bound to the promoted source record/,
  );

  const unboundLattice = await request();
  unboundLattice.coastline.sourceRecord = source(
    coastlineSourceId,
    coastlineDigest,
    ['waterways'],
  );
  await assert.rejects(
    () => reconcileCoastalElevationGrids(unboundLattice),
    /not bound to the promoted source record/,
  );

  const alteredLattice = await request();
  alteredLattice.coastline.coordinateLattice = structuredClone(
    alteredLattice.coastline.coordinateLattice,
  );
  alteredLattice.coastline.coordinateLattice.bounds.north = 0.009;
  await assert.rejects(
    () => reconcileCoastalElevationGrids(alteredLattice),
    /coordinate lattice SHA-256 does not match/,
  );
});

test('coastal seam permits curvilinear grids only through a source-bound shared lattice', async () => {
  const curvilinear = await request();
  const longitudeLatitudeDegreesByCell = [
    [0, 0.01], [0.0051, 0.0099], [0.01, 0.01],
    [0.0001, 0.005], [0.005, 0.0051], [0.0099, 0.005],
    [0, 0], [0.0051, 0.0001], [0.01, 0],
  ] as const;
  const curvilinearSourceGrid = {
    sourceCrs: 'EPSG:32631',
    sourceCenterExtent: {
      minimumX: 500000,
      minimumY: 0,
      maximumX: 501000,
      maximumY: 1000,
    },
    library: 'proj4js' as const,
    interpolation: 'source-affine-linear-inverse-projection' as const,
  };
  for (const elevation of [curvilinear.land, curvilinear.bathymetry]) {
    elevation.grid.coordinateModel = 'per-grid-node';
    elevation.grid.longitudeLatitudeDegreesByCell = longitudeLatitudeDegreesByCell;
    elevation.grid.curvilinearSourceGrid = curvilinearSourceGrid;
  }
  const coordinateLattice = createCoastalGridLattice(curvilinear.land.grid);
  const coordinateLatticeSha256 = await hashCoastalGridLattice(
    coordinateLattice,
  );
  curvilinear.coastline.coordinateLattice = coordinateLattice;
  curvilinear.coastline.expectedCoordinateLatticeSha256 =
    coordinateLatticeSha256;
  curvilinear.coastline.sourceRecord = source(
    coastlineSourceId,
    coastlineDigest,
    ['waterways'],
    [coordinateLatticeSha256],
  );

  const result = await reconcileCoastalElevationGrids(curvilinear);

  assert.equal(result.grid.coordinateModel, 'per-grid-node');
  assert.deepEqual(
    result.grid.longitudeLatitudeDegreesByCell,
    longitudeLatitudeDegreesByCell,
  );
  assert.equal(
    result.provenance.coordinateLatticeSha256,
    coordinateLatticeSha256,
  );
  assert.match(
    result.warnings.join(' '),
    /only when the classified grid lattice exactly matches/,
  );
});

test('coastal seam rejects altered classifications and missing breakline separation', async () => {
  const altered = await request();
  altered.coastline.classes = Uint8Array.from(altered.coastline.classes);
  altered.coastline.classes[0] = COASTAL_SURFACE_OCEAN;
  await assert.rejects(
    () => reconcileCoastalElevationGrids(altered),
    /SHA-256 does not match/,
  );

  const directContact = await request();
  directContact.coastline.classes = Uint8Array.from([
    COASTAL_SURFACE_LAND,
    COASTAL_SURFACE_LAND,
    COASTAL_SURFACE_OCEAN,
    COASTAL_SURFACE_LAND,
    COASTAL_SURFACE_BREAKLINE,
    COASTAL_SURFACE_OCEAN,
    COASTAL_SURFACE_LAND,
    COASTAL_SURFACE_BREAKLINE,
    COASTAL_SURFACE_OCEAN,
  ]);
  directContact.coastline.expectedClassificationSha256 = await sha256(
    directContact.coastline.classes,
  );
  await assert.rejects(
    () => reconcileCoastalElevationGrids(directContact),
    /touch without a breakline/,
  );
});

test('coastal manifest preserves all source evidence without exporting elevations', async () => {
  const seam = await reconcileCoastalElevationGrids(await request());
  const first = await serializeCoastalSeamManifest(seam);
  const second = await serializeCoastalSeamManifest(seam);
  const manifest = JSON.parse(first.data);

  assert.equal(first.data, second.data);
  assert.equal(first.contentSha256, second.contentSha256);
  assert.equal(first.byteLength, new TextEncoder().encode(first.data).byteLength);
  assert.deepEqual(
    manifest.sources.map((item: { role: string }) => item.role),
    ['land', 'bathymetry', 'coastline'],
  );
  assert.deepEqual(
    manifest.sources.map(
      (item: { snapshotSha256: string }) => item.snapshotSha256,
    ),
    [landDigest, bathymetryDigest, coastlineDigest],
  );
  assert.equal(manifest.grid.horizontalCrs, 'EPSG:4326');
  assert.equal(manifest.grid.verticalDatum, 'synthetic-mean-sea-level');
  assert.equal(manifest.grid.coordinateModel, 'rectilinear-axes');
  assert.equal(
    manifest.coastlineEvidence.coordinateLatticeSha256,
    seam.provenance.coordinateLatticeSha256,
  );
  assert.equal(
    manifest.coastlineEvidence.coordinateLatticeBinding,
    'coastline-related-artifact',
  );
  assert.equal(manifest.coastlineEvidence.adapterVersion, 'synthetic-coastline-adapter-v1');
  assert.equal(manifest.coastlineEvidence.legendPromotion, null);
  assert.equal(manifest.metrics.gridCellCount, 9);
  assert.equal('elevationsMeters' in manifest.grid, false);
  assert.doesNotMatch(
    first.data,
    /room_number|delivery_instruction|private_key|proof_secret/i,
  );

  const inconsistent = structuredClone(seam);
  inconsistent.metrics.landCellCount = 4;
  await assert.rejects(
    () => serializeCoastalSeamManifest(inconsistent),
    /inconsistent cell counts/,
  );

  const blocked = structuredClone(seam);
  blocked.sourceGates.coastline.status = 'blocked';
  await assert.rejects(
    () => serializeCoastalSeamManifest(blocked),
    /source gate must be ready/,
  );
});

test('coastal glTF binds deterministic TIN geometry to the three-source manifest', async () => {
  const seam = await reconcileCoastalElevationGrids(await request());
  const first = await serializeCoastalTerrainGltfBundle(seam);
  const second = await serializeCoastalTerrainGltfBundle(seam);
  const gltf = JSON.parse(first.model.data);
  const evidence = gltf.asset.extras.agidCoastalEvidence;

  assert.equal(first.model.data, second.model.data);
  assert.equal(first.model.contentSha256, second.model.contentSha256);
  assert.equal(first.manifest.contentSha256, second.manifest.contentSha256);
  assert.equal(gltf.asset.version, '2.0');
  assert.equal(gltf.accessors[0].count, 9);
  assert.equal(gltf.accessors[1].count, 24);
  assert.equal(evidence.manifestSha256, first.manifest.contentSha256);
  assert.deepEqual(evidence.sourceIds, {
    land: landSource.sourceId,
    bathymetry: bathymetrySource.sourceId,
    coastline: coastlineSourceId,
  });
  assert.equal(evidence.horizontalCrs, 'EPSG:4326');
  assert.equal(evidence.verticalDatum, 'synthetic-mean-sea-level');
  assert.doesNotMatch(
    `${first.model.data}${first.manifest.data}`,
    /room_number|delivery_instruction|private_key|proof_secret/i,
  );
});

test('coastal evidence sidecar binds output artifacts and source provenance without geometry payloads', async () => {
  const seam = await reconcileCoastalElevationGrids(await request());
  const first = await serializeCoastalTerrainGltfEvidenceBundle(seam);
  const second = await serializeCoastalTerrainGltfEvidenceBundle(seam);
  const sidecar = JSON.parse(first.evidenceSidecar.data);

  assert.equal(first.evidenceSidecar.data, second.evidenceSidecar.data);
  assert.equal(
    first.evidenceSidecar.contentSha256,
    second.evidenceSidecar.contentSha256,
  );
  assert.equal(
    sidecar.entities.output.contentSha256,
    first.model.contentSha256,
  );
  assert.equal(
    sidecar.entities.manifest.contentSha256,
    first.manifest.contentSha256,
  );
  assert.equal(
    sidecar.derivation.coordinateLatticeSha256,
    seam.provenance.coordinateLatticeSha256,
  );
  assert.deepEqual(
    sidecar.derivation.usedSourceRoles,
    ['land', 'bathymetry', 'coastline'],
  );
  assert.deepEqual(sidecar.sourceGateStatus, {
    land: 'ready',
    bathymetry: 'ready',
    coastline: 'ready',
  });
  assert.equal(sidecar.derivation.coastlineLegendPromotion, null);
  assert.doesNotMatch(
    first.evidenceSidecar.data,
    /elevationsMeters|longitudeLatitudeDegreesByCell|recipient|room_number|delivery_instruction|private_key|proof_secret/i,
  );

  const tampered = structuredClone(seam);
  tampered.provenance.coordinateLatticeSha256 = `sha256:${'d'.repeat(64)}`;
  await assert.rejects(
    () => serializeCoastalTerrainGltfEvidenceBundle(tampered),
    /coordinate lattice digest as related evidence/,
  );
});

test('source-backed coastal exports preserve an approved legend promotion receipt chain', async () => {
  const sourceBacked = await request();
  const receiptSha256 = `sha256:${'e'.repeat(64)}` as const;
  const promotionDigest = `sha256:${'f'.repeat(64)}` as const;

  sourceBacked.land.grid.sourceRecord = {
    ...sourceBacked.land.grid.sourceRecord,
    syntheticOnly: false,
  };
  sourceBacked.bathymetry.grid.sourceRecord = {
    ...sourceBacked.bathymetry.grid.sourceRecord,
    syntheticOnly: false,
  };
  sourceBacked.coastline.sourceRecord = {
    ...sourceBacked.coastline.sourceRecord,
    syntheticOnly: false,
    snapshotEvidence: {
      ...sourceBacked.coastline.sourceRecord.snapshotEvidence!,
      relatedArtifactSha256: [
        sourceBacked.coastline.expectedCoordinateLatticeSha256,
        receiptSha256,
        promotionDigest,
      ],
    },
  };
  sourceBacked.coastline.legendPromotion = {
    schemaVersion: 'agid-topographic-coastline-legend-promotion-evidence-v1',
    status: 'approved',
    sourceId: sourceBacked.coastline.sourceRecord.sourceId,
    sourceVersion: sourceBacked.coastline.sourceRecord.version,
    classificationGeoTiffSha256: sourceBacked.coastline.sourceSnapshotSha256,
    receiptSha256,
    promotionDigest,
    sequence: 7,
    verifiedSignatureCount: 3,
    minimumSignatures: 2,
  };

  const seam = await reconcileCoastalElevationGrids(sourceBacked);
  const bundle = await serializeCoastalTerrainGltfEvidenceBundle(seam);
  const manifest = JSON.parse(bundle.manifest.data);
  const sidecar = JSON.parse(bundle.evidenceSidecar.data);

  assert.deepEqual(manifest.coastlineEvidence.legendPromotion, {
    schemaVersion: 'agid-topographic-coastline-legend-promotion-evidence-v1',
    status: 'approved',
    receiptSha256,
    promotionDigest,
    sequence: 7,
    verifiedSignatureCount: 3,
    minimumSignatures: 2,
  });
  assert.deepEqual(
    sidecar.derivation.coastlineLegendPromotion,
    manifest.coastlineEvidence.legendPromotion,
  );
  assert.doesNotMatch(
    `${bundle.manifest.data}${bundle.evidenceSidecar.data}`,
    /elevationsMeters|longitudeLatitudeDegreesByCell|recipient|room_number|delivery_instruction|private_key|proof_secret/i,
  );

  const missingPromotion = await request();
  missingPromotion.coastline.sourceRecord = {
    ...missingPromotion.coastline.sourceRecord,
    syntheticOnly: false,
  };
  await assert.rejects(
    () => reconcileCoastalElevationGrids(missingPromotion),
    /requires independent legend promotion evidence/,
  );
});

test('synthetic Studio fixture produces a bounded two-file coastal bundle', async () => {
  const bundle = await createSyntheticCoastalTerrainGltfBundle({
    bounds,
    countryCode: 'JP',
    generatedAt: '2026-07-27T09:30:00.000Z',
  });
  const manifest = JSON.parse(bundle.manifest.data);

  assert.equal(manifest.grid.countryCode, 'JP');
  assert.equal(manifest.sources.length, 3);
  assert.ok(
    manifest.sources.every(
      (source: { syntheticOnly: boolean }) => source.syntheticOnly,
    ),
  );
  assert.equal(JSON.parse(bundle.model.data).asset.extras.synthetic, true);
  assert.match(bundle.model.contentSha256, /^sha256:[a-f0-9]{64}$/);
  assert.match(bundle.manifest.contentSha256, /^sha256:[a-f0-9]{64}$/);
});
