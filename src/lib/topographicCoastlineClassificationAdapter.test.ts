import assert from 'node:assert/strict';
import {
  generateKeyPairSync,
  sign,
} from 'node:crypto';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { writeArrayBuffer } from 'geotiff';
import proj4 from 'proj4';

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
  adaptCoastlineClassificationGrid,
  decodeGeoTiffCoastlineClassification,
  TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA,
  type CoastlineClassificationSemanticEvidence,
  type GeoTiffCoastlineClassificationDecodeRequest,
} from './topographicCoastlineClassificationAdapter';
import {
  bindCoastlineClassificationLegendReceipt,
  createCoastlineClassificationLegendReceipt,
} from './topographicCoastlineClassificationSemantics';
import {
  buildCoastlineLegendPromotionPayload,
  hashCoastlineLegendPromotion,
} from './topographicCoastlineLegendPromotion';
import {
  TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_LEDGER_VERSION,
  verifyAndAdvanceCoastlineLegendPromotion,
  type CoastlineLegendPromotionLedger,
} from './topographicCoastlineLegendPromotionWorkflow';
import type { NormalizedElevationGrid } from './topographicElevationVectorizer';

const bounds = { south: 0, west: 0, north: 0.01, east: 0.01 };
const landDigest = `sha256:${'a'.repeat(64)}` as const;
const bathymetryDigest = `sha256:${'b'.repeat(64)}` as const;
const coastlineDigest = `sha256:${'c'.repeat(64)}` as const;
const coastlineLegendDigest = `sha256:${'f'.repeat(64)}` as const;

function classificationSemantics(
  bandIndex = 0,
): CoastlineClassificationSemanticEvidence {
  return {
    schemaVersion: TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA,
    bandIndex,
    legend: {
      url: 'https://example.test/public-coastline-classification-legend-v1',
      version: 'synthetic-legend-v1',
      publishedAt: '2026-01-01T00:00:00.000Z',
      sha256: coastlineLegendDigest,
    },
    classes: [
      { value: COASTAL_SURFACE_OCEAN, meaning: 'ocean' },
      { value: COASTAL_SURFACE_BREAKLINE, meaning: 'breakline' },
      { value: COASTAL_SURFACE_LAND, meaning: 'land' },
    ],
  };
}

function source(
  sourceId: string,
  digest: `sha256:${string}`,
  layerIds: TopographicSourceRecord['layerIds'],
  relatedArtifactSha256: `sha256:${string}`[] = [],
  horizontalCrs = 'EPSG:4326',
): TopographicSourceRecord {
  return {
    ...AGID_SYNTHETIC_TOPO_SOURCE,
    sourceId,
    layerIds,
    snapshotEvidence: {
      contentSha256: digest,
      adapterVersion: 'synthetic-coastline-classification-test-v1',
      verifiedAt: '2026-07-27T12:00:00.000Z',
      horizontalCrs,
      verticalDatum: layerIds.includes('terrain-mesh')
        ? 'synthetic-mean-sea-level'
        : 'not-applicable: coastline classification',
      ...(relatedArtifactSha256.length === 0
        ? {}
        : { relatedArtifactSha256 }),
    },
  };
}

const landSource = source('synthetic-adapter-land', landDigest, ['terrain-mesh']);
const bathymetrySource = source(
  'synthetic-adapter-bathymetry',
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
    generatedAt: '2026-07-27T12:00:00.000Z',
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

async function request() {
  const referenceGrid = grid(
    'synthetic-adapter-land-grid',
    [5, 1, 0, 6, 0.5, 0, 7, 1.5, 0],
    landSource,
  );
  const coordinateLatticeSha256 = await hashCoastalGridLattice(
    createCoastalGridLattice(referenceGrid),
  );
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
  return {
    maskId: 'synthetic-classified-coastline',
    referenceGrid,
    classes,
    expectedClassificationSha256: await sha256(classes),
    sourceRecord: source(
      'synthetic-adapter-coastline',
      coastlineDigest,
      ['waterways'],
      [coordinateLatticeSha256, coastlineLegendDigest],
    ),
    sourceSnapshotSha256: coastlineDigest,
    adapterVersion: 'synthetic-classified-grid-adapter-v1',
    shorelineEpoch: '2026-01-01T00:00:00.000Z',
    classificationSemantics: classificationSemantics(),
  };
}

function writeClassificationGeoTiff(
  values: Uint8Array,
  options: {
    modelTiepoint?: [number, number, number, number, number, number];
  } = {},
) {
  return writeArrayBuffer(values, {
    width: 3,
    height: 3,
    ModelPixelScale: [0.005, 0.005, 0],
    ModelTiepoint: options.modelTiepoint ?? [0, 0, 0, -0.0025, 0.0125, 0],
    GTModelTypeGeoKey: 2,
    GeographicTypeGeoKey: 4326,
    GTRasterTypeGeoKey: 1,
    GDAL_NODATA: '255',
    SampleFormat: [1],
    BitsPerSample: [8],
  });
}

function writeUtmClassificationGeoTiff(
  values: Uint8Array,
  options: {
    modelTiepoint?: [number, number, number, number, number, number];
  } = {},
) {
  return writeArrayBuffer(values, {
    width: 3,
    height: 3,
    ModelPixelScale: [500, 500, 0],
    ModelTiepoint: options.modelTiepoint ?? [0, 0, 0, 584250, 4500750, 0],
    GTModelTypeGeoKey: 1,
    ProjectedCSTypeGeoKey: 32618,
    GTRasterTypeGeoKey: 1,
    GDAL_NODATA: '255',
    SampleFormat: [1],
    BitsPerSample: [8],
  });
}

function utmReferenceGrid(
  sourceRecord: TopographicSourceRecord,
): NormalizedElevationGrid {
  const sourceCenterExtent = {
    minimumX: 584500,
    minimumY: 4499500,
    maximumX: 585500,
    maximumY: 4500500,
  };
  const sourceToWgs84 = proj4(
    '+proj=utm +zone=18 +datum=WGS84 +units=m +no_defs',
    'EPSG:4326',
  );
  const longitudeLatitudeDegreesByCell = Array.from(
    { length: 9 },
    (_, index) => {
      const row = Math.floor(index / 3);
      const column = index % 3;
      return sourceToWgs84.forward([
        sourceCenterExtent.minimumX + column * 500,
        sourceCenterExtent.maximumY - row * 500,
      ]) as [number, number];
    },
  );
  const longitudes = longitudeLatitudeDegreesByCell.map(value => value[0]);
  const latitudes = longitudeLatitudeDegreesByCell.map(value => value[1]);
  return {
    gridId: 'synthetic-utm-classification-reference-grid',
    title: 'synthetic-utm-classification-reference-grid',
    bounds: {
      west: Math.min(...longitudes),
      south: Math.min(...latitudes),
      east: Math.max(...longitudes),
      north: Math.max(...latitudes),
    },
    width: 3,
    height: 3,
    elevationsMeters: [5, 1, 0, 6, 0.5, 0, 7, 1.5, 0],
    rowOrder: 'north-to-south',
    horizontalCrs: 'EPSG:4326',
    coordinateModel: 'per-grid-node',
    longitudeLatitudeDegreesByCell,
    curvilinearSourceGrid: {
      sourceCrs: 'EPSG:32618',
      sourceCenterExtent,
      library: 'proj4js',
      interpolation: 'source-affine-linear-inverse-projection',
    },
    verticalDatum: 'synthetic-mean-sea-level',
    sourceRecord,
    generatedAt: '2026-07-27T12:00:00.000Z',
  };
}

async function geoTiffRequest(
  values = Uint8Array.from([
    COASTAL_SURFACE_LAND,
    COASTAL_SURFACE_BREAKLINE,
    COASTAL_SURFACE_OCEAN,
    COASTAL_SURFACE_LAND,
    COASTAL_SURFACE_BREAKLINE,
    COASTAL_SURFACE_OCEAN,
    COASTAL_SURFACE_LAND,
    COASTAL_SURFACE_BREAKLINE,
    COASTAL_SURFACE_OCEAN,
  ]),
  options: {
    modelTiepoint?: [number, number, number, number, number, number];
    withCogReceipt?: boolean;
  } = {},
): Promise<GeoTiffCoastlineClassificationDecodeRequest> {
  const referenceGrid = grid(
    'synthetic-geotiff-reference-grid',
    [5, 1, 0, 6, 0.5, 0, 7, 1.5, 0],
    landSource,
  );
  const arrayBuffer = writeClassificationGeoTiff(values, options);
  const contentSha256 = await sha256(new Uint8Array(arrayBuffer));
  const coordinateLatticeSha256 = await hashCoastalGridLattice(
    createCoastalGridLattice(referenceGrid),
  );
  const receiptSha256 = `sha256:${'d'.repeat(64)}` as const;
  const sourceRecord = source(
    'synthetic-geotiff-coastline',
    contentSha256,
    ['waterways'],
    options.withCogReceipt
      ? [coordinateLatticeSha256, receiptSha256, coastlineLegendDigest]
      : [coordinateLatticeSha256, coastlineLegendDigest],
  );
  return {
    arrayBuffer,
    expectedGeoTiffSha256: contentSha256,
    maskId: 'synthetic-geotiff-coastline-mask',
    referenceGrid,
    sourceRecord,
    sourceSnapshotSha256: contentSha256,
    adapterVersion: 'synthetic-geotiff-coastline-adapter-v1',
    shorelineEpoch: '2026-01-01T00:00:00.000Z',
    classificationSemantics: classificationSemantics(),
    ...(options.withCogReceipt
      ? {
          cogValidation: {
            receipt: {
              schemaVersion: 'agid-topographic-cog-validation-receipt-v0.1',
              validatedAt: '2026-07-27T12:00:00.000Z',
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
                fileName: 'synthetic-cog-validation.txt',
                sha256: `sha256:${'e'.repeat(64)}`,
                byteLength: 1,
              },
              result: {
                status: 'passed',
                exitCode: 0,
                warningCount: 0,
                errorCount: 0,
              },
            },
            receiptSha256,
          },
        }
      : {}),
  } satisfies GeoTiffCoastlineClassificationDecodeRequest;
}

test('classified-grid adapter binds source, classification bytes, and grid lattice for seam reconciliation', async () => {
  const adapterRequest = await request();
  const result = await adaptCoastlineClassificationGrid(adapterRequest);

  assert.equal(result.sourceGate.status, 'ready');
  assert.equal(result.classification.width, 3);
  assert.equal(
    result.provenance.classificationSha256,
    adapterRequest.expectedClassificationSha256,
  );
  assert.equal(
    result.classification.expectedCoordinateLatticeSha256,
    result.provenance.coordinateLatticeSha256,
  );
  assert.deepEqual(result.provenance.classificationSemantics, {
    schemaVersion: TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA,
    bandIndex: 0,
    legendSha256: coastlineLegendDigest,
    legendVersion: 'synthetic-legend-v1',
  });
  assert.doesNotMatch(
    JSON.stringify({ provenance: result.provenance, warnings: result.warnings }),
    /recipient|room_number|delivery_instruction|private_key|proof_secret/i,
  );

  const seam = await reconcileCoastalElevationGrids({
    land: {
      grid: adapterRequest.referenceGrid,
      sourceSnapshotSha256: landDigest,
    },
    bathymetry: {
      grid: grid(
        'synthetic-adapter-bathymetry-grid',
        [0, -1, -5, 0, -0.5, -6, 0, -1.5, -7],
        bathymetrySource,
      ),
      sourceSnapshotSha256: bathymetryDigest,
    },
    coastline: result.classification,
    targetVerticalDatum: 'synthetic-mean-sea-level',
    generatedAt: '2026-07-27T12:05:00.000Z',
    maximumAdjustmentMeters: 2,
  });
  assert.equal(seam.metrics.breaklineCellCount, 3);
});

test('classified-grid adapter fails closed for altered bytes, unsupported classes, and missing lattice evidence', async () => {
  const altered = await request();
  altered.classes = Uint8Array.from(altered.classes);
  altered.classes[0] = COASTAL_SURFACE_OCEAN;
  await assert.rejects(
    () => adaptCoastlineClassificationGrid(altered),
    /SHA-256 does not match/,
  );

  const unsupported = await request();
  unsupported.classes = Uint8Array.from(unsupported.classes);
  unsupported.classes[0] = 99;
  unsupported.expectedClassificationSha256 = await sha256(unsupported.classes);
  await assert.rejects(
    () => adaptCoastlineClassificationGrid(unsupported),
    /Unsupported coastline surface class/,
  );

  const unboundLattice = await request();
  unboundLattice.sourceRecord = source(
    'synthetic-adapter-coastline',
    coastlineDigest,
    ['waterways'],
    [coastlineLegendDigest],
  );
  await assert.rejects(
    () => adaptCoastlineClassificationGrid(unboundLattice),
    /coordinate lattice digest as related evidence/,
  );

  const unboundLegend = await request();
  unboundLegend.sourceRecord = source(
    'synthetic-adapter-coastline',
    coastlineDigest,
    ['waterways'],
    [
      await hashCoastalGridLattice(
        createCoastalGridLattice(unboundLegend.referenceGrid),
      ),
    ],
  );
  await assert.rejects(
    () => adaptCoastlineClassificationGrid(unboundLegend),
    /reviewed legend digest as related evidence/,
  );
});

test('GeoTIFF class-band reader requires a bound reviewed legend and the declared selected band', async () => {
  const missingLegend = await geoTiffRequest();
  missingLegend.sourceRecord = source(
    'synthetic-geotiff-coastline-without-legend',
    missingLegend.expectedGeoTiffSha256,
    ['waterways'],
    [
      await hashCoastalGridLattice(
        createCoastalGridLattice(missingLegend.referenceGrid),
      ),
    ],
  );
  await assert.rejects(
    () => decodeGeoTiffCoastlineClassification(missingLegend),
    /reviewed legend digest as related evidence/,
  );

  const wrongBand = await geoTiffRequest();
  wrongBand.classificationSemantics = classificationSemantics(1);
  await assert.rejects(
    () => decodeGeoTiffCoastlineClassification(wrongBand),
    /semantics bandIndex does not match the selected GeoTIFF band/,
  );

  const wrongMeaning = await request();
  wrongMeaning.classificationSemantics = {
    ...classificationSemantics(),
    classes: [
      { value: COASTAL_SURFACE_OCEAN, meaning: 'land' },
      { value: COASTAL_SURFACE_BREAKLINE, meaning: 'breakline' },
      { value: COASTAL_SURFACE_LAND, meaning: 'ocean' },
    ],
  };
  await assert.rejects(
    () => adaptCoastlineClassificationGrid(wrongMeaning),
    /class mapping is not the approved ocean\/breakline\/land mapping/,
  );
});

test('local legend receipt binds retained public legend bytes to a source-ledger candidate before decoding', async () => {
  const input = await geoTiffRequest();
  const coordinateLatticeSha256 = await hashCoastalGridLattice(
    createCoastalGridLattice(input.referenceGrid),
  );
  const sourceRecord = source(
    'synthetic-geotiff-coastline-local-legend-receipt',
    input.expectedGeoTiffSha256,
    ['waterways'],
    [coordinateLatticeSha256],
  );
  const legendBytes = new TextEncoder().encode(
    '{"schema":"synthetic-public-coastline-legend-v1"}',
  );
  const semanticEvidence = classificationSemantics();
  semanticEvidence.legend = {
    ...semanticEvidence.legend,
    sha256: await sha256(legendBytes),
  };
  const { receipt, receiptSha256 } = await createCoastlineClassificationLegendReceipt({
    sourceRecord,
    classificationGeoTiff: input.arrayBuffer,
    legendBytes,
    classificationSemantics: semanticEvidence,
    validatedAt: '2026-07-27T22:00:00.000Z',
  });
  const boundSourceRecord = await bindCoastlineClassificationLegendReceipt({
    sourceRecord,
    receipt,
    expectedReceiptSha256: receiptSha256,
  });
  assert.ok(
    boundSourceRecord.snapshotEvidence?.relatedArtifactSha256?.includes(
      semanticEvidence.legend.sha256,
    ),
  );
  assert.ok(
    boundSourceRecord.snapshotEvidence?.relatedArtifactSha256?.includes(
      receiptSha256,
    ),
  );

  const result = await decodeGeoTiffCoastlineClassification({
    ...input,
    sourceRecord: boundSourceRecord,
    classificationSemantics: semanticEvidence,
  });
  assert.equal(result.sourceGate.status, 'ready');
  assert.equal(
    result.provenance.classificationSemantics.legendSha256,
    semanticEvidence.legend.sha256,
  );

  await assert.rejects(
    () => bindCoastlineClassificationLegendReceipt({
      sourceRecord,
      receipt: {
        ...receipt,
        legend: { ...receipt.legend, byteLength: receipt.legend.byteLength + 1 },
      },
      expectedReceiptSha256: receiptSha256,
    }),
    /receipt SHA-256 does not match its content/,
  );
});

test('GeoTIFF class-band reader preserves exact grid co-registration and optional strict COG evidence', async () => {
  const input = await geoTiffRequest(undefined, { withCogReceipt: true });
  const result = await decodeGeoTiffCoastlineClassification(input);

  assert.equal(result.sourceGate.status, 'ready');
  assert.equal(result.input.contentSha256, input.expectedGeoTiffSha256);
  assert.equal(result.input.selectedBandIndex, 0);
  assert.equal(result.input.pixelInterpretation, 'area');
  assert.equal(result.input.cogValidation?.gdalVersion, '3.13.0');
  assert.deepEqual(Array.from(result.classification.classes), [
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
  assert.doesNotMatch(
    JSON.stringify({ input: result.input, provenance: result.provenance, warnings: result.warnings }),
    /recipient|room_number|delivery_instruction|private_key|proof_secret/i,
  );
});

test('source-backed GeoTIFF classification requires a current signed legend promotion', async () => {
  const input = await geoTiffRequest();
  const coordinateLatticeSha256 = await hashCoastalGridLattice(
    createCoastalGridLattice(input.referenceGrid),
  );
  const sourceRecord: TopographicSourceRecord = {
    ...input.sourceRecord,
    syntheticOnly: false,
    snapshotEvidence: {
      ...input.sourceRecord.snapshotEvidence!,
      relatedArtifactSha256: [coordinateLatticeSha256],
    },
  };
  await assert.rejects(
    () => decodeGeoTiffCoastlineClassification({
      ...input,
      sourceRecord,
    }),
    /requires a verified independent legend promotion/,
  );

  const directory = mkdtempSync(join(tmpdir(), 'agid-source-backed-coastline-'));
  try {
    const legendBytes = new TextEncoder().encode(
      '{"classes":{"0":"ocean","1":"breakline","2":"land"}}',
    );
    const semanticEvidence = {
      ...classificationSemantics(),
      legend: {
        ...classificationSemantics().legend,
        sha256: await sha256(legendBytes),
      },
    };
    const created = await createCoastlineClassificationLegendReceipt({
      sourceRecord,
      classificationGeoTiff: input.arrayBuffer,
      legendBytes,
      classificationSemantics: semanticEvidence,
      validatedAt: '2026-07-28T00:00:00.000Z',
    });
    const reviewers = ['reviewer-a', 'reviewer-b'].map((reviewerId, index) => ({
      reviewerId,
      keyId: `independent-${index + 1}`,
      ...generateKeyPairSync('ed25519'),
    }));
    const payload = {
      version: 'agid-coastline-legend-promotion-payload-v1' as const,
      promotionId: 'source-backed-coastline-v1',
      sequence: 1,
      previousPromotionDigest: null,
      source: created.receipt.source,
      legendReceiptSha256: created.receiptSha256,
      createdAt: '2026-07-28T00:00:00.000Z',
      validFrom: '2026-07-28T00:00:00.000Z',
      validUntil: '2026-08-01T00:00:00.000Z',
      minimumSignatures: 2,
    };
    const canonical = buildCoastlineLegendPromotionPayload(payload);
    const signatures = reviewers.map(reviewer => ({
      keyId: reviewer.keyId,
      reviewerId: reviewer.reviewerId,
      signature: sign(null, Buffer.from(canonical, 'utf8'), reviewer.privateKey)
        .toString('base64'),
    }));
    const ledger: CoastlineLegendPromotionLedger = {
      version: TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_LEDGER_VERSION,
      payload,
      signatures,
      promotionDigest: hashCoastlineLegendPromotion(payload, signatures),
    };
    const trustStorePath = join(directory, 'trust-store.json');
    const statePath = join(directory, 'promotion-state.json');
    writeFileSync(trustStorePath, `${JSON.stringify({
      version: 'addressql-trust-store-v2',
      policy: { minimumSignatures: 2 },
      keys: Object.fromEntries(reviewers.map(reviewer => [reviewer.keyId, {
        reviewerId: reviewer.reviewerId,
        publicKey: reviewer.publicKey.export({ type: 'spki', format: 'pem' }),
        status: 'active',
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
        addedAt: '2026-01-01T00:00:00.000Z',
      }])),
    }, null, 2)}\n`);
    await verifyAndAdvanceCoastlineLegendPromotion({
      sourceRecord,
      receipt: created.receipt,
      ledger,
      trustStorePath,
      statePath,
      now: '2026-07-28T00:00:00.000Z',
    });

    const result = await decodeGeoTiffCoastlineClassification({
      ...input,
      sourceRecord,
      classificationSemantics: semanticEvidence,
      legendPromotion: {
        receipt: created.receipt,
        receiptSha256: created.receiptSha256,
        ledger,
        trustStorePath,
        statePath,
        verifiedAt: '2026-07-28T00:00:00.000Z',
      },
    });
    assert.equal(result.sourceGate.status, 'ready');
    assert.equal(
      result.provenance.legendPromotion?.promotionDigest,
      ledger.promotionDigest,
    );
    assert.equal(
      result.classification.legendPromotion?.promotionDigest,
      ledger.promotionDigest,
    );
    assert.equal(
      result.classification.sourceRecord.snapshotEvidence?.relatedArtifactSha256?.includes(
        ledger.promotionDigest,
      ),
      true,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('GeoTIFF class-band reader accepts only an exactly matching WGS84 UTM curvilinear reference grid', async () => {
  const values = Uint8Array.from([
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
  const arrayBuffer = writeUtmClassificationGeoTiff(values);
  const contentSha256 = await sha256(new Uint8Array(arrayBuffer));
  const referenceGrid = utmReferenceGrid(landSource);
  const coordinateLatticeSha256 = await hashCoastalGridLattice(
    createCoastalGridLattice(referenceGrid),
  );
  const sourceRecord = source(
    'synthetic-utm-geotiff-coastline',
    contentSha256,
    ['waterways'],
    [coordinateLatticeSha256, coastlineLegendDigest],
    'EPSG:32618',
  );
  const request: GeoTiffCoastlineClassificationDecodeRequest = {
    arrayBuffer,
    expectedGeoTiffSha256: contentSha256,
    maskId: 'synthetic-utm-geotiff-coastline-mask',
    referenceGrid,
    sourceRecord,
    sourceSnapshotSha256: contentSha256,
    adapterVersion: 'synthetic-utm-geotiff-coastline-adapter-v1',
    shorelineEpoch: '2026-01-01T00:00:00.000Z',
    classificationSemantics: classificationSemantics(),
  };
  const result = await decodeGeoTiffCoastlineClassification(request);

  assert.equal(result.input.sourceHorizontalCrs, 'EPSG:32618');
  assert.equal(result.classification.coordinateLattice.coordinateModel, 'per-grid-node');
  assert.deepEqual(Array.from(result.classification.classes), Array.from(values));

  const driftedArrayBuffer = writeUtmClassificationGeoTiff(values, {
    modelTiepoint: [0, 0, 0, 584251, 4500750, 0],
  });
  const driftedContentSha256 = await sha256(new Uint8Array(driftedArrayBuffer));
  const driftedSourceRecord = source(
    'synthetic-utm-geotiff-coastline-drifted',
    driftedContentSha256,
    ['waterways'],
    [coordinateLatticeSha256, coastlineLegendDigest],
    'EPSG:32618',
  );
  await assert.rejects(
    () => decodeGeoTiffCoastlineClassification({
      ...request,
      arrayBuffer: driftedArrayBuffer,
      expectedGeoTiffSha256: driftedContentSha256,
      sourceRecord: driftedSourceRecord,
      sourceSnapshotSha256: driftedContentSha256,
    }),
    /source extent differs/,
  );
});

test('GeoTIFF class-band reader rejects co-registration drift and NoData instead of resampling or filling', async () => {
  const drifted = await geoTiffRequest(undefined, {
    modelTiepoint: [0, 0, 0, -0.002, 0.0125, 0],
  });
  await assert.rejects(
    () => decodeGeoTiffCoastlineClassification(drifted),
    /longitude axis differs/,
  );

  const noData = await geoTiffRequest(Uint8Array.from([
    255,
    COASTAL_SURFACE_BREAKLINE,
    COASTAL_SURFACE_OCEAN,
    COASTAL_SURFACE_LAND,
    COASTAL_SURFACE_BREAKLINE,
    COASTAL_SURFACE_OCEAN,
    COASTAL_SURFACE_LAND,
    COASTAL_SURFACE_BREAKLINE,
    COASTAL_SURFACE_OCEAN,
  ]));
  await assert.rejects(
    () => decodeGeoTiffCoastlineClassification(noData),
    /has NoData/,
  );

  const unboundCogReceipt = await geoTiffRequest(undefined, {
    withCogReceipt: true,
  });
  unboundCogReceipt.sourceRecord = source(
    'synthetic-geotiff-coastline',
    unboundCogReceipt.expectedGeoTiffSha256,
    ['waterways'],
    [
      await hashCoastalGridLattice(
        createCoastalGridLattice(unboundCogReceipt.referenceGrid),
      ),
      coastlineLegendDigest,
    ],
  );
  await assert.rejects(
    () => decodeGeoTiffCoastlineClassification(unboundCogReceipt),
    /COG receipt digest is not bound/,
  );
});
