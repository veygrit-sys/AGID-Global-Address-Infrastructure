import assert from 'node:assert/strict';
import test from 'node:test';

import { writeArrayBuffer } from 'geotiff';
import proj4 from 'proj4';

import {
  AGID_SYNTHETIC_TOPO_SOURCE,
  type TopographicSourceRecord,
} from './topographicExport';
import { vectorizeNormalizedElevationGrid } from './topographicElevationVectorizer';
import {
  decodeGeoTiffElevationGrid,
  GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
  TOPOGRAPHIC_NODATA_RESOLUTION_METHOD,
  type GeoTiffElevationDecodeRequest,
} from './topographicGeoTiffAdapter';

async function sha256(arrayBuffer: ArrayBuffer) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', arrayBuffer);
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

function writeElevationGeoTiff(
  values: Float32Array,
  options: {
    width?: number;
    height?: number;
    noData?: string;
    projectedCrs?: number;
    geographicCrs?: number;
    newSubfileType?: number;
    modelPixelScale?: [number, number, number];
    modelTiepoint?: [number, number, number, number, number, number];
  } = {},
) {
  const metadata = {
    width: options.width ?? 2,
    height: options.height ?? 2,
    ModelPixelScale: options.modelPixelScale ?? [0.01, 0.01, 0],
    ModelTiepoint: options.modelTiepoint ?? [0, 0, 0, 139, 35.02, 0],
    GTModelTypeGeoKey: options.projectedCrs ? 1 : 2,
    ...(options.projectedCrs
      ? { ProjectedCSTypeGeoKey: options.projectedCrs }
      : { GeographicTypeGeoKey: options.geographicCrs ?? 4326 }),
    GTRasterTypeGeoKey: 1,
    GDAL_NODATA: options.noData ?? '-9999',
    SampleFormat: [3],
    BitsPerSample: [32],
    ...(options.newSubfileType === undefined
      ? {}
      // GeoTIFF.js can write Orientation but not NewSubfileType. The fixture
      // rewrites this otherwise nonessential default tag below.
      : { Orientation: 1 }),
  };
  const arrayBuffer = writeArrayBuffer(values, metadata);
  if (options.newSubfileType !== undefined) {
    markFirstImageAsReducedResolution(arrayBuffer, options.newSubfileType);
  }
  return arrayBuffer;
}

const TIFF_TYPE_BYTE_SIZES: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  6: 1,
  7: 1,
  8: 2,
  9: 4,
  10: 8,
  11: 4,
  12: 8,
};

function markFirstImageAsReducedResolution(
  arrayBuffer: ArrayBuffer,
  newSubfileType: number,
) {
  const view = new DataView(arrayBuffer);
  const byteOrder = view.getUint16(0, false);
  assert.ok(byteOrder === 0x4949 || byteOrder === 0x4d4d);
  const littleEndian = byteOrder === 0x4949;
  const ifdOffset = view.getUint32(4, littleEndian);
  const entryCount = view.getUint16(ifdOffset, littleEndian);
  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdOffset + 2 + index * 12;
    if (view.getUint16(entryOffset, littleEndian) === 274) {
      view.setUint16(entryOffset, 254, littleEndian);
      view.setUint16(entryOffset + 2, 4, littleEndian);
      view.setUint32(entryOffset + 4, 1, littleEndian);
      view.setUint32(entryOffset + 8, newSubfileType, littleEndian);
      return;
    }
  }
  throw new Error('Synthetic GeoTIFF fixture did not contain an Orientation tag.');
}

function appendReducedResolutionImage(
  fullResolution: ArrayBuffer,
  reducedResolution: ArrayBuffer,
) {
  const full = new Uint8Array(fullResolution.slice(0));
  const reduced = new Uint8Array(reducedResolution.slice(0));
  const fullView = new DataView(full.buffer);
  const reducedView = new DataView(reduced.buffer);
  const fullByteOrder = fullView.getUint16(0, false);
  const reducedByteOrder = reducedView.getUint16(0, false);
  assert.ok(fullByteOrder === 0x4949 || fullByteOrder === 0x4d4d);
  assert.equal(reducedByteOrder, fullByteOrder);
  const littleEndian = fullByteOrder === 0x4949;

  const reducedIfdOffset = reducedView.getUint32(4, littleEndian);
  const reducedEntryCount = reducedView.getUint16(reducedIfdOffset, littleEndian);
  for (let index = 0; index < reducedEntryCount; index += 1) {
    const entryOffset = reducedIfdOffset + 2 + index * 12;
    const tag = reducedView.getUint16(entryOffset, littleEndian);
    if ([33550, 33922, 34735, 34736, 34737].includes(tag)) {
      // ModelPixelScale, ModelTiepoint, and GeoKey tags belong only to the
      // base IFD in a COG overview. Preserve their bytes but hide the tags.
      reducedView.setUint16(entryOffset, 65_000 + index, littleEndian);
      continue;
    }
    const type = reducedView.getUint16(entryOffset + 2, littleEndian);
    const count = reducedView.getUint32(entryOffset + 4, littleEndian);
    const byteLength = (TIFF_TYPE_BYTE_SIZES[type] ?? 0) * count;
    if (byteLength > 4 || tag === 273 || tag === 324) {
      reducedView.setUint32(
        entryOffset + 8,
        reducedView.getUint32(entryOffset + 8, littleEndian) + full.byteLength,
        littleEndian,
      );
    }
  }

  const fullIfdOffset = fullView.getUint32(4, littleEndian);
  const fullEntryCount = fullView.getUint16(fullIfdOffset, littleEndian);
  fullView.setUint32(
    fullIfdOffset + 2 + fullEntryCount * 12,
    full.byteLength + reducedIfdOffset,
    littleEndian,
  );
  const combined = new Uint8Array(full.byteLength + reduced.byteLength);
  combined.set(full);
  combined.set(reduced, full.byteLength);
  return combined.buffer;
}

function sourceBoundTo(
  digest: `sha256:${string}`,
  overrides: Partial<TopographicSourceRecord> = {},
  additionalDigests: `sha256:${string}`[] = [],
  horizontalCrs = 'EPSG:4326',
): TopographicSourceRecord {
  return {
    ...AGID_SYNTHETIC_TOPO_SOURCE,
    ...overrides,
    snapshotEvidence: {
      contentSha256: digest,
      adapterVersion: 'synthetic-geotiff-test-adapter-v1',
      verifiedAt: '2026-07-27T07:00:00.000Z',
      horizontalCrs,
      verticalDatum: 'synthetic-test-datum',
      relatedArtifactSha256: additionalDigests,
    },
    notes: [
      ...(AGID_SYNTHETIC_TOPO_SOURCE.notes ?? []),
      `Snapshot digest: ${digest}.`,
      ...additionalDigests.map(value => `Quality artifact digest: ${value}.`),
    ],
  };
}

async function requestFor(
  arrayBuffer: ArrayBuffer,
  overrides: Partial<GeoTiffElevationDecodeRequest> = {},
) {
  const digest = await sha256(arrayBuffer);
  return {
    arrayBuffer,
    expectedSha256: digest,
    gridId: 'geotiff-test-grid',
    title: 'GeoTIFF test grid',
    verticalDatum: 'synthetic-test-datum',
    sourceRecord: sourceBoundTo(digest),
    generatedAt: '2026-07-27T07:00:00.000Z',
    countryCode: 'JP',
    ...overrides,
  } satisfies GeoTiffElevationDecodeRequest;
}

test('GeoTIFF bytes decode to a pixel-centred normalized elevation grid', async () => {
  const arrayBuffer = writeElevationGeoTiff(new Float32Array([1, 2, 3, 4]));
  const result = await decodeGeoTiffElevationGrid(await requestFor(arrayBuffer));

  assert.equal(result.sourceGate.status, 'ready');
  assert.equal(result.grid.width, 2);
  assert.equal(result.grid.height, 2);
  assert.deepEqual(Array.from(result.grid.elevationsMeters), [1, 2, 3, 4]);
  assert.equal(result.grid.rowOrder, 'north-to-south');
  assert.equal(result.metadata.pixelInterpretation, 'area');
  assert.equal(result.metadata.noDataValue, -9999);
  assert.deepEqual(result.metadata.imageLayout, {
    imageIndex: 0,
    imageCount: 1,
    isReducedResolution: false,
    storage: 'striped',
    blockWidth: 2,
    blockHeight: 2,
  });
  assert.ok(Math.abs(result.grid.bounds.west - 139.005) < 1e-10);
  assert.ok(Math.abs(result.grid.bounds.east - 139.015) < 1e-10);
  assert.ok(Math.abs(result.grid.bounds.south - 35.005) < 1e-10);
  assert.ok(Math.abs(result.grid.bounds.north - 35.015) < 1e-10);
  assert.match(result.warnings.join(' '), /no network request/i);

  const vectorized = vectorizeNormalizedElevationGrid(result.grid, {
    contourIntervalMeters: 1,
  });
  assert.equal(vectorized.metrics.vertexCount, 4);
  assert.equal(vectorized.metrics.triangleCount, 2);
  assert.ok(vectorized.metrics.contourFeatureCount > 0);
});

test('GeoTIFF read window derives a bounded grid without expanding the full source raster', async () => {
  const arrayBuffer = writeElevationGeoTiff(
    new Float32Array([
      1, 2, 3, 4,
      5, 6, 7, 8,
      9, 10, 11, 12,
      13, 14, 15, 16,
    ]),
    {
      width: 4,
      height: 4,
      modelTiepoint: [0, 0, 0, 139, 35.04, 0],
    },
  );
  const result = await decodeGeoTiffElevationGrid({
    ...await requestFor(arrayBuffer),
    window: { x: 1, y: 1, width: 2, height: 2 },
  });

  assert.equal(result.grid.width, 2);
  assert.equal(result.grid.height, 2);
  assert.deepEqual(Array.from(result.grid.elevationsMeters), [6, 7, 10, 11]);
  assert.equal(result.metadata.sourceImageWidth, 4);
  assert.equal(result.metadata.sourceImageHeight, 4);
  assert.deepEqual(result.metadata.readWindow, {
    x: 1,
    y: 1,
    width: 2,
    height: 2,
  });
  assert.ok(Math.abs(result.grid.bounds.west - 139.015) < 1e-10);
  assert.ok(Math.abs(result.grid.bounds.east - 139.025) < 1e-10);
  assert.ok(Math.abs(result.grid.bounds.south - 35.015) < 1e-10);
  assert.ok(Math.abs(result.grid.bounds.north - 35.025) < 1e-10);
});

test('explicit GeoTIFF IFD selection records a reduced-resolution subfile without resampling', async () => {
  const fullResolution = writeElevationGeoTiff(
    new Float32Array(Array.from({ length: 16 }, (_, index) => index)),
    {
      width: 4,
      height: 4,
      modelTiepoint: [0, 0, 0, 139, 35.04, 0],
    },
  );
  const reducedResolution = writeElevationGeoTiff(
    new Float32Array([100, 101, 102, 103]),
    {
      width: 2,
      height: 2,
      newSubfileType: 1,
      modelPixelScale: [0.02, 0.02, 0],
      modelTiepoint: [0, 0, 0, 139, 35.04, 0],
    },
  );
  const arrayBuffer = appendReducedResolutionImage(
    fullResolution,
    reducedResolution,
  );
  const request = await requestFor(arrayBuffer);
  const result = await decodeGeoTiffElevationGrid({
    ...request,
    imageIndex: 1,
  });

  assert.deepEqual(Array.from(result.grid.elevationsMeters), [100, 101, 102, 103]);
  assert.deepEqual(result.metadata.imageLayout, {
    imageIndex: 1,
    imageCount: 2,
    isReducedResolution: true,
    storage: 'striped',
    blockWidth: 2,
    blockHeight: 2,
  });
  assert.deepEqual(result.metadata.georeferencing, {
    source: 'base-image-inherited',
    baseImageIndex: 0,
  });
  assert.match(result.warnings.join(' '), /reduced-resolution subfile/i);
  assert.match(result.warnings.join(' '), /inherited affine georeferencing/i);
  await assert.rejects(
    () => decodeGeoTiffElevationGrid({
      ...request,
      imageIndex: 2,
    }),
    /imageIndex must be an integer between 0 and 1/,
  );
});

test('EPSG:3857 GeoTIFF is normalized per row and column before vectorization', async () => {
  const arrayBuffer = writeElevationGeoTiff(
    new Float32Array([1, 2, 3, 4]),
    {
      projectedCrs: 3857,
      modelPixelScale: [1000, 1000, 0],
      modelTiepoint: [0, 0, 0, 0, 2000, 0],
    },
  );
  const request = await requestFor(arrayBuffer);
  const result = await decodeGeoTiffElevationGrid({
    ...request,
    sourceRecord: sourceBoundTo(
      request.expectedSha256,
      {},
      [],
      'EPSG:3857',
    ),
  });
  const earthRadiusMeters = 6_378_137;
  const longitudeFor = (x: number) =>
    x / earthRadiusMeters * (180 / Math.PI);
  const latitudeFor = (y: number) =>
    (2 * Math.atan(Math.exp(y / earthRadiusMeters)) - Math.PI / 2)
      * (180 / Math.PI);

  assert.equal(result.metadata.sourceHorizontalCrs, 'EPSG:3857');
  assert.equal(result.metadata.horizontalCrs, 'EPSG:4326');
  assert.equal(
    result.metadata.coordinateNormalization.method,
    'inverse-projection',
  );
  assert.deepEqual(result.metadata.sourceBoundingBox, {
    minimumX: 0,
    minimumY: 0,
    maximumX: 2000,
    maximumY: 2000,
  });
  assert.ok(
    Math.abs(result.grid.longitudeDegreesByColumn![0] - longitudeFor(500))
      < 1e-10,
  );
  assert.ok(
    Math.abs(result.grid.longitudeDegreesByColumn![1] - longitudeFor(1500))
      < 1e-10,
  );
  assert.ok(
    Math.abs(result.grid.latitudeDegreesByRow![0] - latitudeFor(1500))
      < 1e-10,
  );
  assert.ok(
    Math.abs(result.grid.latitudeDegreesByRow![1] - latitudeFor(500))
      < 1e-10,
  );

  const vectorized = vectorizeNormalizedElevationGrid(result.grid, {
    contourIntervalMeters: 1,
  });
  assert.deepEqual(vectorized.dataset.meshes[0].vertices[0], [
    result.grid.longitudeDegreesByColumn![0],
    result.grid.latitudeDegreesByRow![0],
    1,
  ]);
  assert.match(result.warnings.join(' '), /Proj4js/);
});

test('EPSG:4269 GeoTIFF normalizes NAD83 geographic axes before vectorization', async () => {
  const arrayBuffer = writeElevationGeoTiff(
    new Float32Array([1, 2, 3, 4]),
    {
      geographicCrs: 4269,
      modelTiepoint: [0, 0, 0, -74, 40.72, 0],
    },
  );
  const request = await requestFor(arrayBuffer);
  const result = await decodeGeoTiffElevationGrid({
    ...request,
    countryCode: 'US',
    sourceRecord: sourceBoundTo(
      request.expectedSha256,
      {},
      [],
      'EPSG:4269',
    ),
  });

  assert.equal(result.metadata.sourceHorizontalCrs, 'EPSG:4269');
  assert.equal(result.metadata.horizontalCrs, 'EPSG:4326');
  assert.equal(
    result.metadata.coordinateNormalization.method,
    'geographic-datum-transform',
  );
  assert.ok(Math.abs(result.grid.longitudeDegreesByColumn![0] + 73.995) < 1e-10);
  assert.ok(Math.abs(result.grid.latitudeDegreesByRow![0] - 40.715) < 1e-10);
  assert.match(result.warnings.join(' '), /not a survey-grade horizontal datum accuracy claim/i);
});

test('WGS84 UTM GeoTIFF retains exact per-node WGS84 coordinates for terrain and contours', async () => {
  const arrayBuffer = writeElevationGeoTiff(
    new Float32Array([1, 2, 3, 4]),
    {
      projectedCrs: 32618,
      modelPixelScale: [1000, 1000, 0],
      modelTiepoint: [0, 0, 0, 584000, 4501000, 0],
    },
  );
  const request = await requestFor(arrayBuffer);
  const result = await decodeGeoTiffElevationGrid({
    ...request,
    sourceRecord: sourceBoundTo(
      request.expectedSha256,
      {},
      [],
      'EPSG:32618',
    ),
  });
  const transform = proj4(
    '+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs',
    'EPSG:4326',
  );
  const expected = [
    [584500, 4500500],
    [585500, 4500500],
    [584500, 4499500],
    [585500, 4499500],
  ].map(([x, y]) => transform.forward([x, y]) as [number, number]);

  assert.equal(result.metadata.sourceHorizontalCrs, 'EPSG:32618');
  assert.equal(result.metadata.gridCoordinateModel, 'curvilinear-per-grid-node');
  assert.equal(result.grid.coordinateModel, 'per-grid-node');
  assert.equal(result.grid.longitudeDegreesByColumn, undefined);
  assert.equal(result.grid.latitudeDegreesByRow, undefined);
  assert.equal(result.grid.longitudeLatitudeDegreesByCell?.length, 4);
  result.grid.longitudeLatitudeDegreesByCell?.forEach((coordinate, index) => {
    assert.ok(Math.abs(coordinate[0] - expected[index][0]) < 1e-10);
    assert.ok(Math.abs(coordinate[1] - expected[index][1]) < 1e-10);
  });
  assert.notEqual(
    result.grid.longitudeLatitudeDegreesByCell?.[0][0],
    result.grid.longitudeLatitudeDegreesByCell?.[2][0],
  );

  const vectorized = vectorizeNormalizedElevationGrid(result.grid, {
    contourIntervalMeters: 1,
    includeContours: false,
  });
  assert.deepEqual(vectorized.dataset.meshes[0].vertices[0], [...expected[0], 1]);
  assert.equal(
    vectorized.meshLodQuality.coordinateBasis,
    'adapter-provided-epsg4326-grid-nodes',
  );
  const contoured = vectorizeNormalizedElevationGrid(result.grid, {
    contourIntervalMeters: 1,
  });
  assert.ok(contoured.dataset.features.length > 0);
  assert.equal(
    contoured.contourTopology.coordinateRemapping,
    'source-affine-inverse-projection',
  );
  assert.equal(contoured.contourTopology.interiorEndpointCount, 0);
  const inverse = proj4(
    'EPSG:4326',
    '+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs',
  );
  for (const feature of contoured.dataset.features) {
    assert.equal(feature.geometry.type, 'LineString');
    for (const coordinate of feature.geometry.coordinates) {
      const source = inverse.forward([coordinate[0], coordinate[1]]);
      assert.ok(source[0] >= 584500 - 0.01 && source[0] <= 585500 + 0.01);
      assert.ok(source[1] >= 4499500 - 0.01 && source[1] <= 4500500 + 0.01);
    }
  }
  assert.match(result.warnings.join(' '), /every grid node/i);
});

test('NAD83 UTM GeoTIFF retains exact per-node WGS84 coordinates for 3DEP-style terrain', async () => {
  const arrayBuffer = writeElevationGeoTiff(
    new Float32Array([1, 2, 3, 4]),
    {
      projectedCrs: 26918,
      modelPixelScale: [1000, 1000, 0],
      modelTiepoint: [0, 0, 0, 584000, 4501000, 0],
    },
  );
  const request = await requestFor(arrayBuffer);
  const result = await decodeGeoTiffElevationGrid({
    ...request,
    countryCode: 'US',
    sourceRecord: sourceBoundTo(
      request.expectedSha256,
      {},
      [],
      'EPSG:26918',
    ),
  });
  const transform = proj4(
    '+proj=utm +zone=18 +datum=NAD83 +units=m +no_defs',
    'EPSG:4326',
  );
  const expected = [
    [584500, 4500500],
    [585500, 4500500],
    [584500, 4499500],
    [585500, 4499500],
  ].map(([x, y]) => transform.forward([x, y]) as [number, number]);

  assert.equal(result.metadata.sourceHorizontalCrs, 'EPSG:26918');
  assert.equal(result.metadata.gridCoordinateModel, 'curvilinear-per-grid-node');
  assert.equal(result.grid.coordinateModel, 'per-grid-node');
  result.grid.longitudeLatitudeDegreesByCell?.forEach((coordinate, index) => {
    assert.ok(Math.abs(coordinate[0] - expected[index][0]) < 1e-10);
    assert.ok(Math.abs(coordinate[1] - expected[index][1]) < 1e-10);
  });
  assert.match(result.warnings.join(' '), /EPSG:26918 projected UTM coordinates/);
});

test('content digest must match bytes and the source promotion record', async () => {
  const arrayBuffer = writeElevationGeoTiff(new Float32Array([1, 2, 3, 4]));
  const request = await requestFor(arrayBuffer);
  const wrongDigest = `sha256:${'a'.repeat(64)}` as const;

  await assert.rejects(
    () =>
      decodeGeoTiffElevationGrid({
        ...request,
        expectedSha256: wrongDigest,
        sourceRecord: sourceBoundTo(wrongDigest),
      }),
    /digest mismatch/,
  );
  await assert.rejects(
    () =>
      decodeGeoTiffElevationGrid({
        ...request,
        sourceRecord: {
          ...request.sourceRecord,
          snapshotEvidence: undefined,
          notes: [`Snapshot digest: ${request.expectedSha256}.`],
        },
      }),
    /not bound to the source promotion record/,
  );
});

test('unresolved NoData fails before vectorization', async () => {
  const arrayBuffer = writeElevationGeoTiff(
    new Float32Array([1, -9999, 3, 4]),
  );
  const request = await requestFor(arrayBuffer);

  await assert.rejects(
    () => decodeGeoTiffElevationGrid(request),
    /quality-mask adapter first/,
  );
});

test('source-bound quality mask resolves one bounded isolated NoData cell', async () => {
  const values = new Float32Array(
    Array.from({ length: 25 }, (_, index) => index),
  );
  values[12] = -9999;
  const arrayBuffer = writeElevationGeoTiff(values, {
    width: 5,
    height: 5,
  });
  const qualityMask = new Uint8Array(25);
  qualityMask[12] = 1;
  const maskDigest = await sha256(qualityMask.buffer);
  const request = await requestFor(arrayBuffer);
  const result = await decodeGeoTiffElevationGrid({
    ...request,
    sourceRecord: sourceBoundTo(
      request.expectedSha256,
      {},
      [maskDigest],
    ),
    noDataResolution: {
      method: TOPOGRAPHIC_NODATA_RESOLUTION_METHOD,
      qualityMask,
      expectedMaskSha256: maskDigest,
      maxResolvedCells: 1,
      maxResolvedFraction: 0.04,
    },
  });

  assert.equal(result.grid.elevationsMeters[12], 12);
  assert.deepEqual(result.metadata.noDataResolution, {
    method: TOPOGRAPHIC_NODATA_RESOLUTION_METHOD,
    maskEncoding: 'agid-missing-byte-mask-v1',
    qualityMaskSha256: maskDigest,
    maskOrigin: 'provided',
    resolvedCellCount: 1,
    resolvedCellFraction: 0.04,
  });
  assert.match(result.warnings.join(' '), /derived elevations/i);
  assert.equal(
    vectorizeNormalizedElevationGrid(result.grid, {
      contourIntervalMeters: 2,
    }).metrics.vertexCount,
    25,
  );
});

test('GDAL RFC 15 validity mask resolves one source-bound isolated NoData cell', async () => {
  const values = new Float32Array(
    Array.from({ length: 25 }, (_, index) => index),
  );
  values[12] = -9999;
  const arrayBuffer = writeElevationGeoTiff(values, {
    width: 5,
    height: 5,
  });
  const qualityMask = new Uint8Array(25).fill(255);
  qualityMask[12] = 0;
  const maskDigest = await sha256(qualityMask.buffer);
  const request = await requestFor(arrayBuffer);
  const result = await decodeGeoTiffElevationGrid({
    ...request,
    sourceRecord: sourceBoundTo(
      request.expectedSha256,
      {},
      [maskDigest],
    ),
    noDataResolution: {
      method: TOPOGRAPHIC_NODATA_RESOLUTION_METHOD,
      encoding: GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
      qualityMask,
      expectedMaskSha256: maskDigest,
      maxResolvedCells: 1,
      maxResolvedFraction: 0.04,
    },
  });

  assert.equal(result.grid.elevationsMeters[12], 12);
  assert.equal(
    result.metadata.noDataResolution.maskEncoding,
    GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
  );
  assert.equal(
    result.metadata.noDataResolution.qualityMaskSha256,
    maskDigest,
  );
  assert.equal(result.metadata.noDataResolution.maskOrigin, 'provided');
});

test('source-derived GDAL validity mask resolves an isolated tagged NoData cell', async () => {
  const values = new Float32Array(
    Array.from({ length: 25 }, (_, index) => index),
  );
  values[12] = -9999;
  const request = await requestFor(writeElevationGeoTiff(values, {
    width: 5,
    height: 5,
  }));

  const result = await decodeGeoTiffElevationGrid({
    ...request,
    noDataResolution: {
      method: TOPOGRAPHIC_NODATA_RESOLUTION_METHOD,
      encoding: GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
      qualityMask: new Uint8Array(),
      expectedMaskSha256: `sha256:${'0'.repeat(64)}`,
      maxResolvedCells: 1,
      maxResolvedFraction: 0.04,
      sourceDerivedNoDataMask: true,
    },
  });

  assert.equal(result.grid.elevationsMeters[12], 12);
  assert.deepEqual(result.metadata.noDataResolution, {
    method: TOPOGRAPHIC_NODATA_RESOLUTION_METHOD,
    maskEncoding: GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
    qualityMaskSha256: await sha256(
      new Uint8Array(25).fill(255).map((value, index) => index === 12 ? 0 : value).buffer,
    ),
    maskOrigin: 'source-nodata-derived',
    resolvedCellCount: 1,
    resolvedCellFraction: 0.04,
  });
});

test('GDAL validity mask rejects ambiguous values and unnecessary masks', async () => {
  const values = new Float32Array(
    Array.from({ length: 25 }, (_, index) => index),
  );
  values[12] = -9999;
  const arrayBuffer = writeElevationGeoTiff(values, {
    width: 5,
    height: 5,
  });
  const ambiguousMask = new Uint8Array(25).fill(255);
  ambiguousMask[0] = 128;
  ambiguousMask[12] = 0;
  const ambiguousDigest = await sha256(ambiguousMask.buffer);
  const request = await requestFor(arrayBuffer);
  await assert.rejects(
    () => decodeGeoTiffElevationGrid({
      ...request,
      sourceRecord: sourceBoundTo(
        request.expectedSha256,
        {},
        [ambiguousDigest],
      ),
      noDataResolution: {
        method: TOPOGRAPHIC_NODATA_RESOLUTION_METHOD,
        encoding: GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
        qualityMask: ambiguousMask,
        expectedMaskSha256: ambiguousDigest,
        maxResolvedCells: 1,
        maxResolvedFraction: 0.04,
      },
    }),
    /expected 255, received 128/,
  );

  const completeArrayBuffer = writeElevationGeoTiff(
    new Float32Array([1, 2, 3, 4]),
  );
  const allValidMask = new Uint8Array(4).fill(255);
  const allValidDigest = await sha256(allValidMask.buffer);
  const completeRequest = await requestFor(completeArrayBuffer);
  await assert.rejects(
    () => decodeGeoTiffElevationGrid({
      ...completeRequest,
      sourceRecord: sourceBoundTo(
        completeRequest.expectedSha256,
        {},
        [allValidDigest],
      ),
      noDataResolution: {
        method: TOPOGRAPHIC_NODATA_RESOLUTION_METHOD,
        encoding: GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
        qualityMask: allValidMask,
        expectedMaskSha256: allValidDigest,
        maxResolvedCells: 1,
        maxResolvedFraction: 0.25,
      },
    }),
    /provided but the selected band has no NoData cells/,
  );

  await assert.rejects(
    () => decodeGeoTiffElevationGrid({
      ...completeRequest,
      noDataResolution: {
        method: TOPOGRAPHIC_NODATA_RESOLUTION_METHOD,
        encoding: GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
        qualityMask: new Uint8Array(),
        expectedMaskSha256: `sha256:${'0'.repeat(64)}`,
        maxResolvedCells: 1,
        maxResolvedFraction: 0.25,
        sourceDerivedNoDataMask: true,
      },
    }),
    /provided but the selected band has no NoData cells/,
  );
});

test('NoData resolution rejects unbound masks and non-isolated edge gaps', async () => {
  const values = new Float32Array(
    Array.from({ length: 25 }, (_, index) => index),
  );
  values[12] = -9999;
  const arrayBuffer = writeElevationGeoTiff(values, {
    width: 5,
    height: 5,
  });
  const qualityMask = new Uint8Array(25);
  qualityMask[12] = 1;
  const maskDigest = await sha256(qualityMask.buffer);
  const request = await requestFor(arrayBuffer);
  const policy = {
    method: TOPOGRAPHIC_NODATA_RESOLUTION_METHOD,
    qualityMask,
    expectedMaskSha256: maskDigest,
    maxResolvedCells: 1,
    maxResolvedFraction: 0.04,
  } as const;

  await assert.rejects(
    () => decodeGeoTiffElevationGrid({
      ...request,
      noDataResolution: policy,
    }),
    /quality mask digest is not bound/,
  );

  const edgeValues = new Float32Array(
    Array.from({ length: 25 }, (_, index) => index),
  );
  edgeValues[0] = -9999;
  const edgeArrayBuffer = writeElevationGeoTiff(edgeValues, {
    width: 5,
    height: 5,
  });
  const edgeMask = new Uint8Array(25);
  edgeMask[0] = 1;
  const edgeMaskDigest = await sha256(edgeMask.buffer);
  const edgeRequest = await requestFor(edgeArrayBuffer);
  await assert.rejects(
    () => decodeGeoTiffElevationGrid({
      ...edgeRequest,
      sourceRecord: sourceBoundTo(
        edgeRequest.expectedSha256,
        {},
        [edgeMaskDigest],
      ),
      noDataResolution: {
        ...policy,
        qualityMask: edgeMask,
        expectedMaskSha256: edgeMaskDigest,
      },
    }),
    /observed opposing neighbor pair/,
  );
});

test('unsupported or mismatched CRS, invalid-band, and unapproved sources fail closed', async () => {
  const unsupportedProjected = writeElevationGeoTiff(
    new Float32Array([1, 2, 3, 4]),
    { projectedCrs: 32661 },
  );
  const projectedRequest = await requestFor(unsupportedProjected);
  await assert.rejects(
    () => decodeGeoTiffElevationGrid(projectedRequest),
    /source CRS is unsupported/,
  );

  const webMercator = writeElevationGeoTiff(
    new Float32Array([1, 2, 3, 4]),
    {
      projectedCrs: 3857,
      modelPixelScale: [1000, 1000, 0],
      modelTiepoint: [0, 0, 0, 0, 2000, 0],
    },
  );
  const webMercatorRequest = await requestFor(webMercator);
  await assert.rejects(
    () => decodeGeoTiffElevationGrid(webMercatorRequest),
    /does not match snapshot evidence EPSG:4326/,
  );
  const outsideWebMercator = writeElevationGeoTiff(
    new Float32Array([1, 2, 3, 4]),
    {
      projectedCrs: 3857,
      modelPixelScale: [1000, 1000, 0],
      modelTiepoint: [0, 0, 0, 20_038_000, 2000, 0],
    },
  );
  const outsideRequest = await requestFor(outsideWebMercator);
  await assert.rejects(
    () => decodeGeoTiffElevationGrid({
      ...outsideRequest,
      sourceRecord: sourceBoundTo(
        outsideRequest.expectedSha256,
        {},
        [],
        'EPSG:3857',
      ),
    }),
    /exceed the supported Web Mercator world extent/,
  );

  const geographic = writeElevationGeoTiff(new Float32Array([1, 2, 3, 4]));
  const request = await requestFor(geographic);
  await assert.rejects(
    () => decodeGeoTiffElevationGrid({ ...request, bandIndex: 1 }),
    /bandIndex must be between 0 and 0/,
  );
  await assert.rejects(
    () =>
      decodeGeoTiffElevationGrid({
        ...request,
        sourceRecord: sourceBoundTo(request.expectedSha256, {
          reuseStatus: 'pending',
        }),
      }),
    /source reuse must be approved/,
  );
});
