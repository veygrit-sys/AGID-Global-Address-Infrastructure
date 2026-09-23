import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { writeArrayBuffer } from 'geotiff';

import {
  createNyc3depLocalGeoTiffLedger,
  inspectNyc3depLocalGeoTiff,
  writeNyc3depLocalGeoTiffLedger,
} from './create-nyc-3dep-source-ledger';
import { parseTopographicSourceLedger } from '../src/lib/topographicLocalGeoTiffWorkflow';
import { createTopographicCogValidationReceipt } from '../src/lib/topographicCogValidation';

const officialAssetUrl =
  'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage';
const officialMetadataUrl =
  'https://www.usgs.gov/ngp-standards-and-specifications/3dep-product-metadata';
const scienceBaseMetadataUrl =
  'https://www.sciencebase.gov/catalog/item/USGS_13_n40w074_20260727_fixture';
const productMetadataUrl =
  'https://thor-f5.er.usgs.gov/ngtoc/metadata/USGS_13_n40w074_20260727_fixture.xml';
const fixtureProductId = 'USGS_13_n40w074_20260727_fixture';

function writeCatalogSnapshot(
  directory: string,
  options: {
    assetUrl?: string;
    metadataUrl?: string;
  } = {},
) {
  const catalogPath = join(directory, 'tnmaccess-products.json');
  writeFileSync(catalogPath, JSON.stringify({
    items: [{
      sourceId: 'USGS_13_n40w074_20260727_fixture',
      downloadURL: options.assetUrl ?? officialAssetUrl,
      moreInfo: options.metadataUrl ?? officialMetadataUrl,
    }],
  }));
  return catalogPath;
}

function writeScienceBaseSnapshots(
  directory: string,
  verticalDatum = 'North American Vertical Datum of 1988',
  spatialReference: 'geographic' | 'utm18' = 'geographic',
) {
  const scienceBasePath = join(directory, 'sciencebase-item.json');
  const productMetadataPath = join(directory, 'product-metadata.xml');
  writeFileSync(scienceBasePath, JSON.stringify({
    id: fixtureProductId,
    link: { url: scienceBaseMetadataUrl },
    webLinks: [
      { type: 'download', uri: officialAssetUrl },
      {
        type: 'originalMetadata',
        title: 'Product Metadata',
        uri: productMetadataUrl,
      },
    ],
  }));
  const horizontalReference = spatialReference === 'utm18'
    ? `<grid>
        <gridsysn>Universal Transverse Mercator</gridsysn>
        <utm><utmzone>18</utmzone></utm>
        <geodetic><horizdn>North American Datum of 1983</horizdn></geodetic>
      </grid>`
    : `<geograph><geodetic>
        <horizdn>North American Datum of 1983</horizdn>
      </geodetic></geograph>`;
  writeFileSync(productMetadataPath, `<?xml version="1.0"?>
    <metadata>
      <spref><horizsys>${horizontalReference}</horizsys></spref>
      <spdoinfo><altref>
        <altdatum>${verticalDatum}</altdatum>
      </altref></spdoinfo>
    </metadata>`);
  return { scienceBasePath, productMetadataPath };
}

function createFixtureGeoTiff(geographicCrs = 4269) {
  return writeArrayBuffer(
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
      GeographicTypeGeoKey: geographicCrs,
      GTRasterTypeGeoKey: 1,
      SampleFormat: [3],
      BitsPerSample: [32],
    },
  );
}

function createNad83UtmFixtureGeoTiff() {
  return writeArrayBuffer(
    new Float32Array([
      1, 2, 3,
      2, 3, 4,
      3, 4, 5,
    ]),
    {
      width: 3,
      height: 3,
      ModelPixelScale: [1000, 1000, 0],
      ModelTiepoint: [0, 0, 0, 584000, 4501000, 0],
      GTModelTypeGeoKey: 1,
      ProjectedCSTypeGeoKey: 26918,
      GTRasterTypeGeoKey: 1,
      SampleFormat: [3],
      BitsPerSample: [32],
    },
  );
}

test('NYC local GeoTIFF inspection accepts the 3DEP-style NAD83 UTM zone 18N profile', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-nyc-3dep-utm-'));
  try {
    const assetPath = join(directory, 'nyc-3dep-1m.tif');
    writeFileSync(assetPath, new Uint8Array(createNad83UtmFixtureGeoTiff()));

    const inspection = await inspectNyc3depLocalGeoTiff(assetPath);

    assert.equal(inspection.sourceHorizontalCrs, 'EPSG:26918');
    assert.equal(inspection.recordOrCellCount, 9);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

function writeCogValidationReceipt(
  directory: string,
  contentSha256: `sha256:${string}`,
  byteLength: number,
) {
  const receiptPath = join(directory, 'cog-validation-receipt.json');
  const rawReportPath = join(directory, 'gdal-cog-validator.txt');
  const rawReport = 'COG validation passed\n';
  const rawReportBytes = new TextEncoder().encode(rawReport);
  writeFileSync(rawReportPath, rawReport);
  const receipt = createTopographicCogValidationReceipt({
    schemaVersion: 'agid-topographic-cog-validation-receipt-v0.1',
    validatedAt: '2026-07-27T10:02:00.000Z',
    validator: {
      command: 'gdal driver cog validate',
      gdalVersion: '3.13.0',
      fullCheck: 'yes',
    },
    input: { contentSha256, byteLength },
    rawReport: {
      fileName: 'gdal-cog-validator.txt',
      sha256: `sha256:${createHash('sha256').update(rawReportBytes).digest('hex')}`,
      byteLength: rawReportBytes.byteLength,
    },
    result: {
      status: 'passed',
      exitCode: 0,
      warningCount: 0,
      errorCount: 0,
    },
  });
  writeFileSync(receiptPath, JSON.stringify(receipt));
  return { receiptPath, rawReportPath };
}

test('local NYC 3DEP receipt builder hashes and ledgers a NAD83 GeoTIFF without copying it', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-nyc-3dep-'));
  try {
    const assetPath = join(directory, 'nyc-dem.tif');
    const outputPath = join(directory, 'source-ledger.json');
    const catalogPath = writeCatalogSnapshot(directory, {
      metadataUrl: scienceBaseMetadataUrl,
    });
    const { scienceBasePath, productMetadataPath } = writeScienceBaseSnapshots(directory);
    writeFileSync(assetPath, new Uint8Array(createFixtureGeoTiff()));

    const result = await createNyc3depLocalGeoTiffLedger({
      assetPath,
      sourceAssetUrl: officialAssetUrl,
      metadataUrl: scienceBaseMetadataUrl,
      versionId: fixtureProductId,
      publishedAt: '2026-07-20T00:00:00.000Z',
      retrievedAt: '2026-07-27T10:00:00.000Z',
      verifiedAt: '2026-07-27T10:01:00.000Z',
      tnmAccessCatalogPath: catalogPath,
      tnmAccessProductId: fixtureProductId,
      scienceBaseMetadataPath: scienceBasePath,
      productMetadataXmlPath: productMetadataPath,
    });
    const writtenPath = writeNyc3depLocalGeoTiffLedger(outputPath, result);
    const parsed = parseTopographicSourceLedger(readFileSync(writtenPath, 'utf8'), {
      now: '2026-07-27T10:02:00.000Z',
    });

    assert.equal(result.inspection.recordOrCellCount, 9);
    assert.match(result.inspection.contentSha256, /^sha256:[a-f0-9]{64}$/);
    assert.equal(result.inspection.sourceHorizontalCrs, 'EPSG:4269');
    assert.equal(
      parsed.records[0].snapshotEvidence?.contentSha256,
      result.inspection.contentSha256,
    );
    assert.equal(parsed.records[0].snapshotEvidence?.verticalDatum, 'NAVD88');
    assert.match(parsed.records[0].notes?.join(' ') ?? '', /TNMAccess product/);
    assert.match(
      result.tnmAccessCatalogEvidence?.catalogResponseSha256 ?? '',
      /^sha256:[a-f0-9]{64}$/,
    );
    assert.equal(result.scienceBaseProductEvidence?.productMetadataUrl, productMetadataUrl);
    assert.match(parsed.records[0].notes?.join(' ') ?? '', /ScienceBase response SHA-256/);
    assert.equal(readFileSync(assetPath).byteLength > 0, true);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('local NYC 3DEP receipt builder requires FGDC UTM zone 18 evidence for a 1-meter profile', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-nyc-3dep-1m-'));
  try {
    const assetPath = join(directory, 'nyc-1m-dem.tif');
    const catalogPath = writeCatalogSnapshot(directory, {
      metadataUrl: scienceBaseMetadataUrl,
    });
    const { scienceBasePath, productMetadataPath } = writeScienceBaseSnapshots(
      directory,
      'North American Vertical Datum of 1988',
      'utm18',
    );
    writeFileSync(assetPath, new Uint8Array(createNad83UtmFixtureGeoTiff()));

    const result = await createNyc3depLocalGeoTiffLedger({
      assetPath,
      sourceAssetUrl: officialAssetUrl,
      metadataUrl: scienceBaseMetadataUrl,
      versionId: 'USGS_3DEP_1M_NYC_20260728_fixture',
      publishedAt: '2026-07-20T00:00:00.000Z',
      retrievedAt: '2026-07-27T10:00:00.000Z',
      verifiedAt: '2026-07-27T10:01:00.000Z',
      productProfile: '1-meter',
      tnmAccessCatalogPath: catalogPath,
      tnmAccessProductId: fixtureProductId,
      scienceBaseMetadataPath: scienceBasePath,
      productMetadataXmlPath: productMetadataPath,
    });

    assert.equal(result.inspection.sourceHorizontalCrs, 'EPSG:26918');
    assert.equal(result.ledger.records[0].product, 'USGS 3DEP 1 meter bare-earth DEM');
    assert.match(result.ledger.records[0].notes?.join(' ') ?? '', /1-meter \(EPSG:26918\)/);

    const geographicEvidence = writeScienceBaseSnapshots(directory);
    await assert.rejects(
      () => createNyc3depLocalGeoTiffLedger({
        assetPath,
        sourceAssetUrl: officialAssetUrl,
        metadataUrl: scienceBaseMetadataUrl,
        versionId: 'USGS_3DEP_1M_NYC_20260728_fixture',
        publishedAt: '2026-07-20T00:00:00.000Z',
        retrievedAt: '2026-07-27T10:00:00.000Z',
        verifiedAt: '2026-07-27T10:01:00.000Z',
        productProfile: '1-meter',
        tnmAccessCatalogPath: catalogPath,
        tnmAccessProductId: fixtureProductId,
        scienceBaseMetadataPath: geographicEvidence.scienceBasePath,
        productMetadataXmlPath: geographicEvidence.productMetadataPath,
      }),
      /must declare Universal Transverse Mercator zone 18/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('ScienceBase product evidence rejects metadata without a NAVD88 declaration', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-nyc-3dep-'));
  try {
    const assetPath = join(directory, 'nyc-dem.tif');
    writeFileSync(assetPath, new Uint8Array(createFixtureGeoTiff()));
    const catalogPath = writeCatalogSnapshot(directory, {
      metadataUrl: scienceBaseMetadataUrl,
    });
    const { scienceBasePath, productMetadataPath } = writeScienceBaseSnapshots(
      directory,
      'North American Vertical Datum of 1929',
    );

    await assert.rejects(
      () => createNyc3depLocalGeoTiffLedger({
        assetPath,
        sourceAssetUrl: officialAssetUrl,
        metadataUrl: scienceBaseMetadataUrl,
        versionId: fixtureProductId,
        publishedAt: '2026-07-20T00:00:00.000Z',
        retrievedAt: '2026-07-27T10:00:00.000Z',
        verifiedAt: '2026-07-27T10:01:00.000Z',
        tnmAccessCatalogPath: catalogPath,
        tnmAccessProductId: fixtureProductId,
        scienceBaseMetadataPath: scienceBasePath,
        productMetadataXmlPath: productMetadataPath,
      }),
      /must explicitly declare NAD83 and NAVD88/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('TNMAccess evidence rejects a catalog URL that does not bind the exact source receipt', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-nyc-3dep-'));
  try {
    const assetPath = join(directory, 'nyc-dem.tif');
    writeFileSync(assetPath, new Uint8Array(createFixtureGeoTiff()));
    const catalogPath = writeCatalogSnapshot(directory, {
      assetUrl: 'https://prd-tnm.s3.amazonaws.com/other-product.tif',
    });

    await assert.rejects(
      () => createNyc3depLocalGeoTiffLedger({
        assetPath,
        sourceAssetUrl: officialAssetUrl,
        metadataUrl: officialMetadataUrl,
        versionId: 'USGS_3DEP_13_n40w074_20260727_fixture',
        publishedAt: '2026-07-20T00:00:00.000Z',
        retrievedAt: '2026-07-27T10:00:00.000Z',
        verifiedAt: '2026-07-27T10:01:00.000Z',
        tnmAccessCatalogPath: catalogPath,
        tnmAccessProductId: 'USGS_13_n40w074_20260727_fixture',
      }),
      /must match sourceAssetUrl exactly/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('strict GDAL COG validation receipt is digest-bound before it is linked to the source ledger', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-nyc-3dep-'));
  try {
    const assetPath = join(directory, 'nyc-dem.tif');
    writeFileSync(assetPath, new Uint8Array(createFixtureGeoTiff()));
    const inspection = await inspectNyc3depLocalGeoTiff(assetPath);
    const validationPaths = writeCogValidationReceipt(
      directory,
      inspection.contentSha256,
      inspection.byteLength,
    );
    const cogValidationReceiptPath = validationPaths.receiptPath;
    const rawReportPath = validationPaths.rawReportPath;
    const result = await createNyc3depLocalGeoTiffLedger({
      assetPath,
      sourceAssetUrl: officialAssetUrl,
      metadataUrl: officialMetadataUrl,
      versionId: fixtureProductId,
      publishedAt: '2026-07-20T00:00:00.000Z',
      retrievedAt: '2026-07-27T10:00:00.000Z',
      verifiedAt: '2026-07-27T10:03:00.000Z',
      cogValidationReceiptPath,
      cogValidationRawReportPath: rawReportPath,
    });
    assert.equal(result.cogValidationEvidence?.gdalVersion, '3.13.0');
    assert.ok(
      result.ledger.records[0].snapshotEvidence?.relatedArtifactSha256?.includes(
        result.cogValidationEvidence!.receiptSha256,
      ),
    );
    assert.match(
      result.ledger.records[0].notes?.join(' ') ?? '',
      /GDAL COG validation receipt SHA-256/,
    );

    await assert.rejects(
      () => createNyc3depLocalGeoTiffLedger({
        assetPath,
        sourceAssetUrl: officialAssetUrl,
        metadataUrl: officialMetadataUrl,
        versionId: fixtureProductId,
        publishedAt: '2026-07-20T00:00:00.000Z',
        retrievedAt: '2026-07-27T10:00:00.000Z',
        verifiedAt: '2026-07-27T10:03:00.000Z',
        cogValidationReceiptPath,
      }),
      /must be supplied together/,
    );

    writeCogValidationReceipt(
      directory,
      `sha256:${'e'.repeat(64)}`,
      inspection.byteLength,
    );
    await assert.rejects(
      () => createNyc3depLocalGeoTiffLedger({
        assetPath,
        sourceAssetUrl: officialAssetUrl,
        metadataUrl: officialMetadataUrl,
        versionId: fixtureProductId,
        publishedAt: '2026-07-20T00:00:00.000Z',
        retrievedAt: '2026-07-27T10:00:00.000Z',
        verifiedAt: '2026-07-27T10:03:00.000Z',
        cogValidationReceiptPath,
        cogValidationRawReportPath: rawReportPath,
      }),
      /not bound to the expected GeoTIFF digest/,
    );

    const receiptPaths = writeCogValidationReceipt(
      directory,
      inspection.contentSha256,
      inspection.byteLength,
    );
    writeFileSync(receiptPaths.rawReportPath, 'altered report\n');
    await assert.rejects(
      () => createNyc3depLocalGeoTiffLedger({
        assetPath,
        sourceAssetUrl: officialAssetUrl,
        metadataUrl: officialMetadataUrl,
        versionId: fixtureProductId,
        publishedAt: '2026-07-20T00:00:00.000Z',
        retrievedAt: '2026-07-27T10:00:00.000Z',
        verifiedAt: '2026-07-27T10:03:00.000Z',
        cogValidationReceiptPath: receiptPaths.receiptPath,
        cogValidationRawReportPath: receiptPaths.rawReportPath,
      }),
      /raw report does not match the receipt digest or byte length/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('local NYC 3DEP receipt builder rejects a non-NAD83 source GeoTIFF', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-nyc-3dep-'));
  try {
    const assetPath = join(directory, 'wrong-crs.tif');
    writeFileSync(assetPath, new Uint8Array(createFixtureGeoTiff(4326)));

    await assert.rejects(
      () => inspectNyc3depLocalGeoTiff(assetPath),
      /EPSG:4269/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
