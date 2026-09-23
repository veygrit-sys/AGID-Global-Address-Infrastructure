import assert from 'node:assert/strict';
import test from 'node:test';

import { writeArrayBuffer } from 'geotiff';

import {
  NYC_BOROUGH_SCOPE_EVIDENCE,
  createNyc3depSourceLedger,
} from './topographicNyc3depCaseStudy';
import {
  parseTopographicSourceLedger,
  runLocalGeoTiffWorkflow,
} from './topographicLocalGeoTiffWorkflow';

const receipt = {
  sourceAssetUrl:
    'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage',
  metadataUrl:
    'https://www.usgs.gov/ngp-standards-and-specifications/3dep-product-metadata',
  versionId: 'USGS_3DEP_13_20260727_fixture',
  publishedAt: '2026-07-20T00:00:00.000Z',
  retrievedAt: '2026-07-27T10:00:00.000Z',
  verifiedAt: '2026-07-27T10:01:00.000Z',
  contentSha256: `sha256:${'a'.repeat(64)}` as const,
  recordOrCellCount: 4,
  horizontalCrs: 'EPSG:4269' as const,
  verticalDatum: 'NAVD88' as const,
};

async function sha256(arrayBuffer: ArrayBuffer) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', arrayBuffer);
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

test('NYC 3DEP receipt produces an importable, source-backed local GeoTIFF ledger', () => {
  const ledger = createNyc3depSourceLedger(receipt);
  const parsed = parseTopographicSourceLedger(JSON.stringify(ledger), {
    now: '2026-07-27T10:02:00.000Z',
  });

  assert.equal(parsed.records.length, 1);
  assert.equal(parsed.records[0].sourceId, 'usgs-3dep');
  assert.equal(parsed.records[0].reuseStatus, 'approved');
  assert.equal(parsed.records[0].snapshotEvidence?.horizontalCrs, 'EPSG:4269');
  assert.equal(parsed.records[0].snapshotEvidence?.verticalDatum, 'NAVD88');
  assert.match(parsed.records[0].notes?.join(' ') ?? '', /Exact public asset/);
  assert.match(parsed.records[0].notes?.join(' ') ?? '', /No NYC boundary geometry/);
  assert.equal(NYC_BOROUGH_SCOPE_EVIDENCE.version, '26B');
});

test('NYC 3DEP receipt promotes the explicit 1-meter NAD83 UTM profile only with its matching CRS', () => {
  const ledger = createNyc3depSourceLedger({
    ...receipt,
    versionId: 'USGS_3DEP_1M_NYC_20260728_fixture',
    horizontalCrs: 'EPSG:26918',
    productProfile: '1-meter',
  });
  const parsed = parseTopographicSourceLedger(JSON.stringify(ledger), {
    now: '2026-07-27T10:02:00.000Z',
  });

  assert.equal(parsed.records[0].product, 'USGS 3DEP 1 meter bare-earth DEM');
  assert.equal(parsed.records[0].snapshotEvidence?.horizontalCrs, 'EPSG:26918');
  assert.match(parsed.records[0].notes?.join(' ') ?? '', /1-meter \(EPSG:26918\)/);
  assert.throws(
    () => createNyc3depSourceLedger({
      ...receipt,
      horizontalCrs: 'EPSG:4269',
      productProfile: '1-meter',
    }),
    /1-meter profile must declare EPSG:26918/,
  );
});

test('NYC 3DEP receipt rejects non-official hosts, generic versions, secrets, and datum mismatch', () => {
  assert.doesNotThrow(() => createNyc3depSourceLedger({
    ...receipt,
    metadataUrl: 'https://www.sciencebase.gov/catalog/item/4f70aa9fe4b058caae3f8de5',
  }));
  assert.throws(
    () => createNyc3depSourceLedger({
      ...receipt,
      sourceAssetUrl: 'https://example.com/terrain.tif',
    }),
    /approved official USGS or National Map host/,
  );
  assert.throws(
    () => createNyc3depSourceLedger({
      ...receipt,
      sourceAssetUrl: `${receipt.sourceAssetUrl}?token=not-accepted`,
    }),
    /must not contain credentials/,
  );
  assert.throws(
    () => createNyc3depSourceLedger({
      ...receipt,
      versionId: '3dep-products',
    }),
    /immutable, resolved 3DEP product version/,
  );
  assert.throws(
    () => createNyc3depSourceLedger({
      ...receipt,
      verticalDatum: 'EGM96' as never,
    }),
    /NAVD88 vertical datum/,
  );
});

test('NAD83 receipt, local GeoTIFF, and source-backed terrain workflow stay bound end to end', async () => {
  const fixtureGeoTiff = writeArrayBuffer(
    new Float32Array([
      1, 2, 3,
      2, 3, 4,
      3, 4, 5,
    ]),
    {
      width: 3,
      height: 3,
      ModelPixelScale: [0.01, 0.01, 0],
      ModelTiepoint: [0, 0, 0, -74, 40.73, 0],
      GTModelTypeGeoKey: 2,
      GeographicTypeGeoKey: 4269,
      GTRasterTypeGeoKey: 1,
      GDAL_NODATA: '-9999',
      SampleFormat: [3],
      BitsPerSample: [32],
    },
  );
  const contentSha256 = await sha256(fixtureGeoTiff);
  const ledger = createNyc3depSourceLedger({
    ...receipt,
    contentSha256,
    recordOrCellCount: 9,
  });
  const sourceRecord = parseTopographicSourceLedger(JSON.stringify(ledger), {
    now: '2026-07-27T10:02:00.000Z',
  }).records[0];
  const result = await runLocalGeoTiffWorkflow({
    arrayBuffer: fixtureGeoTiff,
    sourceRecord,
    gridId: 'synthetic-nyc-3dep-crs-contract',
    title: 'Synthetic NYC 3DEP CRS contract fixture',
    generatedAt: '2026-07-27T10:03:00.000Z',
    countryCode: 'US',
    format: 'gltf',
    layerIds: ['terrain-mesh', 'contour-lines'],
    contourIntervalMeters: 1,
    meshLodStrides: [1, 2],
    meshMaxVerticalErrorMeters: 1,
  });

  assert.equal(result.plan.status, 'ready');
  assert.equal(result.decoded.metadata.sourceHorizontalCrs, 'EPSG:4269');
  assert.equal(result.decoded.metadata.horizontalCrs, 'EPSG:4326');
  assert.equal(
    result.decoded.metadata.coordinateNormalization.method,
    'geographic-datum-transform',
  );
  assert.equal(result.evidence.manifest.source.verticalDatum, 'NAVD88');
  assert.match(result.evidence.data, /not a survey-grade horizontal datum accuracy claim/);
});
