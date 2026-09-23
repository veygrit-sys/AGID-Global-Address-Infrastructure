import assert from 'node:assert/strict';
import test from 'node:test';

import { writeArrayBuffer } from 'geotiff';

import type { TopographicSourceRecord } from './topographicExport';
import { GEOTIFF_GDAL_VALIDITY_MASK_ENCODING } from './topographicGeoTiffAdapter';
import { createTopographicCogValidationReceipt } from './topographicCogValidation';
import {
  TOPOGRAPHIC_LOCAL_EVIDENCE_SCHEMA,
  TOPOGRAPHIC_MESH_LOD_BUNDLE_SCHEMA,
  TOPOGRAPHIC_SOURCE_LEDGER_SCHEMA,
  parseTopographicSourceLedger,
  runLocalGeoTiffWorkflow,
  verifyLocalGeoTiffMeshLodBundle,
} from './topographicLocalGeoTiffWorkflow';

async function sha256(arrayBuffer: ArrayBuffer) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', arrayBuffer);
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

function elevationGeoTiff() {
  return writeArrayBuffer(
    new Float32Array([
      0, 1, 2,
      2, 3, 4,
      4, 5, 6,
    ]),
    {
      width: 3,
      height: 3,
      ModelPixelScale: [0.01, 0.01, 0],
      ModelTiepoint: [0, 0, 0, 139, 35.03, 0],
      GTModelTypeGeoKey: 2,
      GeographicTypeGeoKey: 4326,
      GTRasterTypeGeoKey: 1,
      GDAL_NODATA: '-9999',
      SampleFormat: [3],
      BitsPerSample: [32],
    },
  );
}

function spikeElevationGeoTiff() {
  return writeArrayBuffer(
    new Float32Array([
      0, 0, 0,
      0, 100, 0,
      0, 0, 0,
    ]),
    {
      width: 3,
      height: 3,
      ModelPixelScale: [0.01, 0.01, 0],
      ModelTiepoint: [0, 0, 0, 139, 35.03, 0],
      GTModelTypeGeoKey: 2,
      GeographicTypeGeoKey: 4326,
      GTRasterTypeGeoKey: 1,
      GDAL_NODATA: '-9999',
      SampleFormat: [3],
      BitsPerSample: [32],
    },
  );
}

function webMercatorElevationGeoTiff() {
  return writeArrayBuffer(
    new Float32Array([
      0, 1, 2,
      2, 3, 4,
      4, 5, 6,
    ]),
    {
      width: 3,
      height: 3,
      ModelPixelScale: [1000, 1000, 0],
      ModelTiepoint: [0, 0, 0, 0, 3000, 0],
      GTModelTypeGeoKey: 1,
      ProjectedCSTypeGeoKey: 3857,
      GTRasterTypeGeoKey: 1,
      GDAL_NODATA: '-9999',
      SampleFormat: [3],
      BitsPerSample: [32],
    },
  );
}

function utmElevationGeoTiff(projectedCrs: 32618 | 26918) {
  return writeArrayBuffer(
    new Float32Array([
      0, 1, 2,
      2, 3, 4,
      4, 5, 6,
    ]),
    {
      width: 3,
      height: 3,
      ModelPixelScale: [1000, 1000, 0],
      ModelTiepoint: [0, 0, 0, 584000, 4501000, 0],
      GTModelTypeGeoKey: 1,
      ProjectedCSTypeGeoKey: projectedCrs,
      GTRasterTypeGeoKey: 1,
      GDAL_NODATA: '-9999',
      SampleFormat: [3],
      BitsPerSample: [32],
    },
  );
}

function wgs84UtmElevationGeoTiff() {
  return utmElevationGeoTiff(32618);
}

function nad83UtmElevationGeoTiff() {
  return utmElevationGeoTiff(26918);
}

function elevationGeoTiffWithIsolatedNoData() {
  const values = new Float32Array(
    Array.from({ length: 25 }, (_, index) => index),
  );
  values[12] = -9999;
  return writeArrayBuffer(values, {
    width: 5,
    height: 5,
    ModelPixelScale: [0.01, 0.01, 0],
    ModelTiepoint: [0, 0, 0, 139, 35.05, 0],
    GTModelTypeGeoKey: 2,
    GeographicTypeGeoKey: 4326,
    GTRasterTypeGeoKey: 1,
    GDAL_NODATA: '-9999',
    SampleFormat: [3],
    BitsPerSample: [32],
  });
}

function sourceRecord(
  digest: `sha256:${string}`,
  overrides: Partial<TopographicSourceRecord> = {},
  horizontalCrs = 'EPSG:4326',
  relatedArtifactSha256: `sha256:${string}`[] = [],
): TopographicSourceRecord {
  return {
    sourceId: 'local-evidenced-dem',
    publisher: 'AGID test publisher',
    product: 'Local evidenced DEM',
    sourceUrl: 'https://example.test/source',
    termsUrl: 'https://example.test/terms',
    licenseId: 'CC-BY-4.0',
    version: '2026-07-27',
    publishedAt: '2026-07-01T00:00:00.000Z',
    retrievedAt: '2026-07-27T09:00:00.000Z',
    freshUntil: '2030-01-01T00:00:00.000Z',
    attribution: 'AGID test publisher',
    correctionUrl: 'https://example.test/corrections',
    coverage: {
      scope: 'country',
      countryCodes: ['JP'],
      description: 'Synthetic public test extent in Japan.',
    },
    layerIds: ['terrain-mesh', 'contour-lines'],
    allowedFormats: ['tiff', 'gltf', 'geojson', 'obj', 'stl', 'txt'],
    reuseStatus: 'approved',
    snapshotEvidence: {
      contentSha256: digest,
      adapterVersion: 'local-evidenced-dem-adapter-v1',
      verifiedAt: '2026-07-27T09:00:00.000Z',
      horizontalCrs,
      verticalDatum: 'synthetic-test-datum',
      relatedArtifactSha256,
    },
    ...overrides,
  };
}

function ledgerJson(record: TopographicSourceRecord) {
  return JSON.stringify({
    schemaVersion: TOPOGRAPHIC_SOURCE_LEDGER_SCHEMA,
    generatedAt: '2026-07-27T09:00:00.000Z',
    records: [record],
  });
}

test('source ledger imports only current, approved, evidenced source records', async () => {
  const arrayBuffer = elevationGeoTiff();
  const record = sourceRecord(await sha256(arrayBuffer));
  const ledger = parseTopographicSourceLedger(ledgerJson(record), {
    now: '2026-07-27T10:00:00.000Z',
  });

  assert.equal(ledger.records.length, 1);
  assert.equal(ledger.records[0].sourceId, 'local-evidenced-dem');
  assert.equal(
    ledger.records[0].snapshotEvidence?.contentSha256,
    record.snapshotEvidence?.contentSha256,
  );
});

test('source ledger fails closed for duplicate, pending, or stale records', async () => {
  const arrayBuffer = elevationGeoTiff();
  const record = sourceRecord(await sha256(arrayBuffer));
  const duplicate = JSON.stringify({
    schemaVersion: TOPOGRAPHIC_SOURCE_LEDGER_SCHEMA,
    generatedAt: '2026-07-27T09:00:00.000Z',
    records: [record, record],
  });
  assert.throws(
    () => parseTopographicSourceLedger(duplicate, {
      now: '2026-07-27T10:00:00.000Z',
    }),
    /duplicate sourceId/,
  );
  assert.throws(
    () => parseTopographicSourceLedger(
      ledgerJson(sourceRecord(record.snapshotEvidence!.contentSha256, {
        reuseStatus: 'pending',
      })),
      { now: '2026-07-27T10:00:00.000Z' },
    ),
    /reuseStatus must be approved/,
  );
  assert.throws(
    () => parseTopographicSourceLedger(
      ledgerJson(sourceRecord(record.snapshotEvidence!.contentSha256, {
        freshUntil: '2026-07-27T09:30:00.000Z',
      })),
      { now: '2026-07-27T10:00:00.000Z' },
    ),
    /passed its freshness deadline/,
  );

  const unsupported = JSON.parse(ledgerJson(record));
  unsupported.records[0].recipient = 'must-not-enter-topography';
  assert.throws(
    () => parseTopographicSourceLedger(JSON.stringify(unsupported), {
      now: '2026-07-27T10:00:00.000Z',
    }),
    /unsupported field recipient/,
  );
});

test('local GeoTIFF workflow emits source-backed glTF and evidence without elevation arrays', async () => {
  const arrayBuffer = elevationGeoTiff();
  const record = sourceRecord(await sha256(arrayBuffer));
  const result = await runLocalGeoTiffWorkflow({
    arrayBuffer,
    sourceRecord: record,
    gridId: 'local-evidenced-grid',
    title: 'Local evidenced terrain',
    generatedAt: '2026-07-27T10:00:00.000Z',
    countryCode: 'JP',
    format: 'gltf',
    layerIds: ['terrain-mesh', 'contour-lines'],
    contourIntervalMeters: 2,
    meshLodStrides: [1, 2],
    meshMaxVerticalErrorMeters: 1,
  });

  assert.equal(result.plan.status, 'ready');
  assert.equal(result.vectorized.dataset.synthetic, false);
  assert.equal(result.vectorized.metrics.gridCellCount, 9);
  assert.equal(result.vectorized.metrics.meshLodCount, 2);
  assert.equal(result.vectorized.meshLodQuality.passed, true);
  assert.equal(
    result.evidence.manifest.derivation.meshLodQuality
      .maximumAllowedVerticalErrorMeters,
    1,
  );
  assert.equal(
    result.evidence.manifest.derivation.meshLodQuality.levels.length,
    2,
  );
  assert.equal(
    result.evidence.manifest.derivation.contourTopology.lineFeatureCount,
    result.vectorized.metrics.contourFeatureCount,
  );
  assert.equal(
    result.evidence.manifest.derivation.contourTopology.interiorEndpointCount,
    0,
  );
  assert.equal(
    result.evidence.manifest.derivation.contourTopology.duplicateSegmentCount,
    0,
  );
  assert.equal(result.output.format, 'gltf');
  assert.match(String(result.output.data), /"version": "2\.0"/);
  assert.equal(
    result.meshLodBundle?.manifest.manifest.schemaVersion,
    TOPOGRAPHIC_MESH_LOD_BUNDLE_SCHEMA,
  );
  assert.deepEqual(result.meshLodBundle?.manifest.manifest.terrain, {
    minimumElevationMeters: 0,
    maximumElevationMeters: 6,
  });
  assert.equal(result.meshLodBundle?.artifacts.length, 2);
  assert.deepEqual(
    result.meshLodBundle?.artifacts.map(artifact => ({
      level: artifact.level,
      stride: artifact.stride,
      includedLayers: artifact.output.includedLayers,
    })),
    [
      { level: 0, stride: 1, includedLayers: ['terrain-mesh'] },
      { level: 1, stride: 2, includedLayers: ['terrain-mesh'] },
    ],
  );
  assert.deepEqual(
    result.meshLodBundle?.manifest.manifest.levels.map(level => ({
      level: level.level,
      stride: level.stride,
      vertexCount: level.vertexCount,
      triangleCount: level.triangleCount,
      maximumAbsoluteVerticalErrorMeters:
        level.maximumAbsoluteVerticalErrorMeters,
    })),
    [
      {
        level: 0,
        stride: 1,
        vertexCount: 9,
        triangleCount: 8,
        maximumAbsoluteVerticalErrorMeters: 0,
      },
      {
        level: 1,
        stride: 2,
        vertexCount: 4,
        triangleCount: 2,
        maximumAbsoluteVerticalErrorMeters: 0,
      },
    ],
  );
  assert.match(
    result.meshLodBundle?.manifest.sha256 ?? '',
    /^sha256:[a-f0-9]{64}$/,
  );
  assert.notEqual(
    result.meshLodBundle?.artifacts[0].sha256,
    result.meshLodBundle?.artifacts[1].sha256,
  );
  await verifyLocalGeoTiffMeshLodBundle(result.meshLodBundle!);
  assert.equal(
    result.evidence.manifest.schemaVersion,
    TOPOGRAPHIC_LOCAL_EVIDENCE_SCHEMA,
  );
  assert.equal(
    result.evidence.manifest.input.contentSha256,
    record.snapshotEvidence?.contentSha256,
  );
  assert.equal(result.evidence.manifest.input.cogValidation, null);
  assert.match(result.evidence.manifest.output.sha256, /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(result.evidence.manifest.output.meshLodBundle, {
    schemaVersion: TOPOGRAPHIC_MESH_LOD_BUNDLE_SCHEMA,
    artifactCount: 2,
    manifestFileName:
      'local-evidenced-grid-vectorized.terrain-lods.json',
    manifestSha256: result.meshLodBundle?.manifest.sha256,
  });
  assert.deepEqual(result.threeDTiles, {
    status: 'blocked',
    issues: [{
      code: 'vertical-datum-not-epsg4979',
      message:
        '3D Tiles region placement requires evidenced EPSG:4979 WGS 84 ellipsoidal heights.',
    }],
    bundle: null,
  });
  assert.deepEqual(result.evidence.manifest.output.threeDTiles, {
    status: 'blocked',
    issueCodes: ['vertical-datum-not-epsg4979'],
  });
  assert.doesNotMatch(
    result.evidence.data,
    /elevationsMeters|"recipient"|"address_line"/i,
  );
  assert.match(result.evidence.data, /"boundaryContacts"/);
  assert.match(
    result.evidence.data,
    /regular-grid-tin-all-node-vertical-residual-v0\.1/,
  );
});

test('local GeoTIFF workflow retains WGS84 UTM grid-node provenance for terrain and contour export', async () => {
  const arrayBuffer = wgs84UtmElevationGeoTiff();
  const record = sourceRecord(
    await sha256(arrayBuffer),
    {
      layerIds: ['terrain-mesh', 'contour-lines'],
      coverage: {
        scope: 'country',
        countryCodes: ['US'],
        description: 'Synthetic public test extent in the United States.',
      },
    },
    'EPSG:32618',
  );
  const result = await runLocalGeoTiffWorkflow({
    arrayBuffer,
    sourceRecord: record,
    gridId: 'utm-evidenced-grid',
    title: 'WGS84 UTM terrain',
    generatedAt: '2026-07-27T10:00:00.000Z',
    countryCode: 'US',
    format: 'gltf',
    layerIds: ['terrain-mesh', 'contour-lines'],
    contourIntervalMeters: 2,
    meshLodStrides: [1, 2],
    meshMaxVerticalErrorMeters: 1,
  });

  assert.equal(result.plan.status, 'ready');
  assert.equal(result.decoded.metadata.gridCoordinateModel, 'curvilinear-per-grid-node');
  assert.equal(result.vectorized.meshLodQuality.coordinateBasis, 'adapter-provided-epsg4326-grid-nodes');
  assert.equal(
    result.vectorized.contourTopology.coordinateRemapping,
    'source-affine-inverse-projection',
  );
  assert.equal(result.evidence.manifest.input.sourceHorizontalCrs, 'EPSG:32618');
  assert.equal(result.evidence.manifest.input.gridCoordinateModel, 'curvilinear-per-grid-node');
  assert.deepEqual(result.output.includedLayers, ['contour-lines', 'terrain-mesh']);
});

test('local GeoTIFF workflow carries NAD83 UTM 3DEP-style grids through terrain and contour export', async () => {
  const arrayBuffer = nad83UtmElevationGeoTiff();
  const record = sourceRecord(
    await sha256(arrayBuffer),
    {
      layerIds: ['terrain-mesh', 'contour-lines'],
      coverage: {
        scope: 'country',
        countryCodes: ['US'],
        description: 'Synthetic public test extent in the United States.',
      },
    },
    'EPSG:26918',
  );
  const result = await runLocalGeoTiffWorkflow({
    arrayBuffer,
    sourceRecord: record,
    gridId: 'nad83-utm-evidenced-grid',
    title: 'NAD83 UTM terrain',
    generatedAt: '2026-07-28T02:30:00.000Z',
    countryCode: 'US',
    format: 'gltf',
    layerIds: ['terrain-mesh', 'contour-lines'],
    contourIntervalMeters: 2,
    meshLodStrides: [1, 2],
    meshMaxVerticalErrorMeters: 1,
  });

  assert.equal(result.plan.status, 'ready');
  assert.equal(result.decoded.metadata.sourceHorizontalCrs, 'EPSG:26918');
  assert.equal(result.decoded.metadata.gridCoordinateModel, 'curvilinear-per-grid-node');
  assert.equal(result.vectorized.meshLodQuality.coordinateBasis, 'adapter-provided-epsg4326-grid-nodes');
  assert.equal(
    result.vectorized.contourTopology.coordinateRemapping,
    'source-affine-inverse-projection',
  );
  assert.equal(result.evidence.manifest.input.sourceHorizontalCrs, 'EPSG:26918');
  assert.deepEqual(result.output.includedLayers, ['contour-lines', 'terrain-mesh']);
});

test('local workflow carries a hash-bound strict COG receipt without copying its raw report', async () => {
  const arrayBuffer = elevationGeoTiff();
  const contentSha256 = await sha256(arrayBuffer);
  const record = sourceRecord(contentSha256);
  const result = await runLocalGeoTiffWorkflow({
    arrayBuffer,
    sourceRecord: record,
    gridId: 'local-cog-receipt-grid',
    title: 'Local COG receipt contract fixture',
    generatedAt: '2026-07-27T18:01:00.000Z',
    countryCode: 'JP',
    format: 'gltf',
    layerIds: ['terrain-mesh'],
    contourIntervalMeters: 2,
    meshLodStrides: [1],
    meshMaxVerticalErrorMeters: 0.01,
    cogValidation: {
      receipt: createTopographicCogValidationReceipt({
        schemaVersion: 'agid-topographic-cog-validation-receipt-v0.1',
        validatedAt: '2026-07-27T18:00:00.000Z',
        validator: {
          command: 'gdal driver cog validate',
          gdalVersion: '3.13.0',
          fullCheck: 'yes',
        },
        input: {
          contentSha256,
          byteLength: arrayBuffer.byteLength,
        },
        rawReport: {
          fileName: 'gdal-cog-validator.txt',
          sha256: `sha256:${'d'.repeat(64)}`,
          byteLength: 64,
        },
        result: {
          status: 'passed',
          exitCode: 0,
          warningCount: 0,
          errorCount: 0,
        },
      }),
      receiptSha256: `sha256:${'e'.repeat(64)}`,
    },
  });

  assert.deepEqual(result.evidence.manifest.input.cogValidation, {
    receiptSha256: `sha256:${'e'.repeat(64)}`,
    validatedAt: '2026-07-27T18:00:00.000Z',
    gdalVersion: '3.13.0',
    fullCheck: 'yes',
    rawReportSha256: `sha256:${'d'.repeat(64)}`,
    rawReportByteLength: 64,
  });
  assert.doesNotMatch(result.evidence.data, /gdal-cog-validator\.txt/);
});

test('mesh LOD bundle verifier rejects altered artifact bytes', async () => {
  const arrayBuffer = elevationGeoTiff();
  const record = sourceRecord(await sha256(arrayBuffer));
  const result = await runLocalGeoTiffWorkflow({
    arrayBuffer,
    sourceRecord: record,
    gridId: 'local-lod-integrity-grid',
    title: 'Local LOD integrity terrain',
    generatedAt: '2026-07-27T10:00:00.000Z',
    countryCode: 'JP',
    format: 'gltf',
    layerIds: ['terrain-mesh'],
    contourIntervalMeters: 2,
    meshLodStrides: [1, 2],
    meshMaxVerticalErrorMeters: 1,
  });
  const original = result.meshLodBundle!;
  const tampered = {
    ...original,
    artifacts: original.artifacts.map((artifact, index) => index === 1
      ? {
          ...artifact,
          output: {
            ...artifact.output,
            data: `${String(artifact.output.data)} `,
          },
        }
      : artifact),
  };

  await assert.rejects(
    () => verifyLocalGeoTiffMeshLodBundle(tampered),
    /artifact 1 digest mismatch/,
  );
});

test('local workflow converts evidenced EPSG:3857 input to WGS 84 output', async () => {
  const arrayBuffer = webMercatorElevationGeoTiff();
  const record = sourceRecord(
    await sha256(arrayBuffer),
    {},
    'EPSG:3857',
  );
  const result = await runLocalGeoTiffWorkflow({
    arrayBuffer,
    sourceRecord: record,
    gridId: 'local-web-mercator-grid',
    title: 'Local Web Mercator terrain',
    generatedAt: '2026-07-27T10:00:00.000Z',
    countryCode: 'JP',
    format: 'gltf',
    layerIds: ['terrain-mesh', 'contour-lines'],
    contourIntervalMeters: 2,
    meshLodStrides: [1, 2],
    meshMaxVerticalErrorMeters: 1,
  });

  assert.equal(result.plan.status, 'ready');
  assert.equal(result.plan.request.crs, 'EPSG:4326');
  assert.equal(result.evidence.manifest.source.horizontalCrs, 'EPSG:3857');
  assert.equal(
    result.evidence.manifest.input.sourceHorizontalCrs,
    'EPSG:3857',
  );
  assert.equal(result.evidence.manifest.input.horizontalCrs, 'EPSG:4326');
  assert.deepEqual(
    result.evidence.manifest.input.coordinateNormalization,
    {
      sourceCrs: 'EPSG:3857',
      targetCrs: 'EPSG:4326',
      library: 'proj4js',
      method: 'inverse-projection',
      axisOrder: 'x-y-to-longitude-latitude',
    },
  );
  assert.match(result.evidence.data, /EPSG:3857/);
  assert.match(result.evidence.data, /inverse-projection/);
});

test('local workflow fails closed before serialization when an LOD exceeds its vertical error cap', async () => {
  const arrayBuffer = spikeElevationGeoTiff();
  const record = sourceRecord(await sha256(arrayBuffer));

  await assert.rejects(
    () => runLocalGeoTiffWorkflow({
      arrayBuffer,
      sourceRecord: record,
      gridId: 'local-spike-grid',
      title: 'Local spike terrain',
      generatedAt: '2026-07-27T10:00:00.000Z',
      countryCode: 'JP',
      format: 'gltf',
      layerIds: ['terrain-mesh'],
      contourIntervalMeters: 2,
      meshLodStrides: [1, 2],
      meshMaxVerticalErrorMeters: 10,
    }),
    /LOD1 vertical error 100m exceeds 10m/,
  );
});

test('local workflow applies a source-bound GDAL validity mask and records aggregate evidence', async () => {
  const arrayBuffer = elevationGeoTiffWithIsolatedNoData();
  const qualityMask = new Uint8Array(25).fill(255);
  qualityMask[12] = 0;
  const maskArrayBuffer = qualityMask.slice().buffer as ArrayBuffer;
  const maskDigest = await sha256(maskArrayBuffer);
  const record = sourceRecord(
    await sha256(arrayBuffer),
    {},
    'EPSG:4326',
    [maskDigest],
  );
  const result = await runLocalGeoTiffWorkflow({
    arrayBuffer,
    sourceRecord: record,
    gridId: 'local-masked-grid',
    title: 'Local masked terrain',
    generatedAt: '2026-07-27T10:00:00.000Z',
    countryCode: 'JP',
    format: 'gltf',
    layerIds: ['terrain-mesh', 'contour-lines'],
    contourIntervalMeters: 2,
    meshLodStrides: [1, 2],
    meshMaxVerticalErrorMeters: 1,
    qualityMask: {
      arrayBuffer: maskArrayBuffer,
      encoding: GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
      maxResolvedCells: 1,
      maxResolvedFraction: 0.04,
    },
  });

  assert.equal(result.decoded.grid.elevationsMeters[12], 12);
  assert.equal(result.evidence.manifest.input.qualityMaskByteLength, 25);
  assert.equal(result.evidence.manifest.input.imageLayout.imageIndex, 0);
  assert.equal(result.evidence.manifest.input.imageLayout.imageCount, 1);
  assert.deepEqual(result.evidence.manifest.input.noDataResolution, {
    method: 'isolated-cardinal-mean-v1',
    maskEncoding: GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
    qualityMaskSha256: maskDigest,
    maskOrigin: 'provided',
    resolvedCellCount: 1,
    resolvedCellFraction: 0.04,
  });
  assert.match(result.evidence.data, /gdal-rfc15-validity-byte-mask-v1/);
  assert.doesNotMatch(result.evidence.data, /elevationsMeters/);
});

test('local workflow derives a GDAL validity mask only from tagged source NoData', async () => {
  const arrayBuffer = elevationGeoTiffWithIsolatedNoData();
  const record = sourceRecord(await sha256(arrayBuffer));

  const result = await runLocalGeoTiffWorkflow({
    arrayBuffer,
    sourceRecord: record,
    gridId: 'local-source-derived-mask-grid',
    title: 'Local source-derived mask terrain',
    generatedAt: '2026-07-27T10:00:00.000Z',
    countryCode: 'JP',
    format: 'gltf',
    layerIds: ['terrain-mesh'],
    contourIntervalMeters: 2,
    meshLodStrides: [1],
    meshMaxVerticalErrorMeters: 0.01,
    qualityMask: {
      encoding: GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
      sourceDerivedNoDataMask: true,
      maxResolvedCells: 1,
      maxResolvedFraction: 0.04,
    },
  });

  assert.equal(result.decoded.grid.elevationsMeters[12], 12);
  assert.equal(result.evidence.manifest.input.qualityMaskByteLength, 25);
  assert.equal(
    result.evidence.manifest.input.noDataResolution.maskOrigin,
    'source-nodata-derived',
  );
  assert.match(
    result.evidence.manifest.input.noDataResolution.qualityMaskSha256 ?? '',
    /^sha256:[a-f0-9]{64}$/,
  );
});

test('local GeoTIFF workflow rejects bytes not bound to the selected source', async () => {
  const arrayBuffer = elevationGeoTiff();
  const record = sourceRecord(`sha256:${'a'.repeat(64)}`);

  await assert.rejects(
    () => runLocalGeoTiffWorkflow({
      arrayBuffer,
      sourceRecord: record,
      gridId: 'mismatched-grid',
      title: 'Mismatched terrain',
      generatedAt: '2026-07-27T10:00:00.000Z',
      countryCode: 'JP',
      format: 'gltf',
      layerIds: ['terrain-mesh'],
      contourIntervalMeters: 2,
    }),
    /digest mismatch/,
  );
});
