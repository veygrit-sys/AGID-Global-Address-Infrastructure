import { fromArrayBuffer } from 'geotiff';
import proj4 from 'proj4';

import {
  buildTopographicExportPlan,
  topographicSourceBindsDigest,
  type TopographicExportPlan,
  type TopographicSourceRecord,
} from './topographicExport';
import {
  COASTAL_SURFACE_BREAKLINE,
  COASTAL_SURFACE_LAND,
  COASTAL_SURFACE_OCEAN,
  createCoastalGridLattice,
  hashCoastalGridLattice,
  type CoastlineClassificationInput,
} from './topographicCoastalSeam';
import { MAX_ELEVATION_GRID_CELLS, type NormalizedElevationGrid } from './topographicElevationVectorizer';
import {
  bindPassedTopographicCogValidationEvidence,
  type TopographicCogValidationEvidence,
  type TopographicCogValidationReceipt,
} from './topographicCogValidation';
import {
  requireSourceBoundCoastlineClassificationSemantics,
  sourceBindsRelatedArtifactDigest,
  TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA,
  validateCoastlineClassificationSemantics,
  type CoastlineClassificationLegendReceipt,
  type CoastlineClassificationSemanticEvidence,
} from './topographicCoastlineClassificationSemantics';
import { MAX_GEOTIFF_BYTE_LENGTH } from './topographicGeoTiffAdapter';
import {
  TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_EVIDENCE_VERSION,
  verifyCoastlineLegendPromotion,
  type CoastlineLegendPromotionEvidence,
} from './topographicCoastlineLegendPromotion';
import {
  readCoastlineLegendPromotionState,
  type CoastlineLegendPromotionLedger,
} from './topographicCoastlineLegendPromotionWorkflow';

export {
  TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA,
  type CoastlineClassificationSemanticEvidence,
} from './topographicCoastlineClassificationSemantics';

export const TOPOGRAPHIC_COASTLINE_CLASSIFICATION_ADAPTER_VERSION =
  'agid-topographic-coastline-classification-adapter-v0.1';
export const TOPOGRAPHIC_COASTLINE_CLASSIFICATION_ENCODING =
  'agid-coastal-surface-class-byte-v1';

export type CoastlineClassificationAdapterRequest = {
  maskId: string;
  referenceGrid: NormalizedElevationGrid;
  classes: Uint8Array;
  expectedClassificationSha256: `sha256:${string}`;
  sourceRecord: TopographicSourceRecord;
  sourceSnapshotSha256: `sha256:${string}`;
  adapterVersion: string;
  shorelineEpoch: string;
  classificationSemantics: CoastlineClassificationSemanticEvidence;
  legendPromotion?: CoastlineLegendPromotionGate;
};

export type CoastlineLegendPromotionGate = {
  receipt: CoastlineClassificationLegendReceipt;
  receiptSha256: `sha256:${string}`;
  ledger: CoastlineLegendPromotionLedger;
  trustStorePath: string;
  statePath: string;
  verifiedAt: string;
};

export type CoastlineClassificationAdapterResult = {
  classification: CoastlineClassificationInput;
  sourceGate: TopographicExportPlan;
  provenance: {
    adapterVersion: string;
    encoding: typeof TOPOGRAPHIC_COASTLINE_CLASSIFICATION_ENCODING;
    sourceId: string;
    sourceVersion: string;
    sourceSnapshotSha256: `sha256:${string}`;
    classificationSha256: `sha256:${string}`;
    coordinateLatticeSha256: `sha256:${string}`;
    shorelineEpoch: string;
    classificationSemantics: {
      schemaVersion: typeof TOPOGRAPHIC_COASTLINE_CLASSIFICATION_SEMANTICS_SCHEMA;
      bandIndex: number;
      legendSha256: `sha256:${string}`;
      legendVersion: string;
    };
    legendPromotion: CoastlineLegendPromotionEvidence | null;
  };
  warnings: string[];
};

export type GeoTiffCoastlineClassificationDecodeRequest = Omit<
  CoastlineClassificationAdapterRequest,
  'classes' | 'expectedClassificationSha256'
> & {
  arrayBuffer: ArrayBuffer;
  expectedGeoTiffSha256: `sha256:${string}`;
  bandIndex?: number;
  cogValidation?: {
    receipt: TopographicCogValidationReceipt;
    receiptSha256: `sha256:${string}`;
  };
};

export type GeoTiffCoastlineClassificationDecodeResult =
  CoastlineClassificationAdapterResult & {
    input: {
      contentSha256: `sha256:${string}`;
      byteLength: number;
      selectedBandIndex: number;
      width: number;
      height: number;
      pixelInterpretation: 'area' | 'point';
      sourceHorizontalCrs:
        | 'EPSG:4326'
        | `EPSG:326${string}`
        | `EPSG:327${string}`;
      cogValidation: TopographicCogValidationEvidence | null;
    };
  };

function requireIsoTimestamp(field: string, value: string) {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be an ISO timestamp.`);
  }
}

function requireSha256(field: string, value: string) {
  if (!/^sha256:[a-f0-9]{64}$/i.test(value)) {
    throw new Error(`${field} must be a SHA-256 digest.`);
  }
}

async function sha256Bytes(bytes: Uint8Array) {
  const copiedBytes = Uint8Array.from(bytes);
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    copiedBytes.buffer,
  );
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

async function sha256ArrayBuffer(arrayBuffer: ArrayBuffer) {
  return sha256Bytes(new Uint8Array(arrayBuffer));
}

async function resolvePromotedCoastlineSource(input: {
  sourceRecord: TopographicSourceRecord;
  legendPromotion?: CoastlineLegendPromotionGate;
}) {
  if (input.sourceRecord.syntheticOnly) {
    return {
      sourceRecord: input.sourceRecord,
      promotionEvidence: null,
    };
  }
  if (!input.legendPromotion) {
    throw new Error(
      'Source-backed coastline classification requires a verified independent legend promotion.',
    );
  }
  const state = readCoastlineLegendPromotionState(
    input.legendPromotion.statePath,
  );
  if (!state) {
    throw new Error(
      'Source-backed coastline classification requires an existing promotion state.',
    );
  }
  if (
    input.legendPromotion.receiptSha256
    !== input.legendPromotion.ledger.payload.legendReceiptSha256
  ) {
    throw new Error('Coastline legend promotion gate receipt digest does not match its ledger.');
  }
  const promotion = await verifyCoastlineLegendPromotion({
    sourceRecord: input.sourceRecord,
    receipt: input.legendPromotion.receipt,
    payload: input.legendPromotion.ledger.payload,
    signatures: input.legendPromotion.ledger.signatures,
    trustStorePath: input.legendPromotion.trustStorePath,
    now: input.legendPromotion.verifiedAt,
    previousState: state,
  });
  if (
    promotion.promotionEvidence.schemaVersion
      !== TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_EVIDENCE_VERSION
    || promotion.promotionDigest !== state.lastPromotionDigest
    || promotion.receiptSha256 !== state.lastReceiptSha256
    || promotion.sequence !== state.lastSequence
  ) {
    throw new Error('Coastline legend promotion does not match the persisted approval state.');
  }
  if (!sourceBindsRelatedArtifactDigest(
    promotion.sourceRecord,
    promotion.promotionDigest,
  )) {
    throw new Error('Coastline promoted source record does not bind its promotion digest.');
  }
  return {
    sourceRecord: promotion.sourceRecord,
    promotionEvidence: promotion.promotionEvidence,
  };
}

function validateSurfaceClasses(classes: Uint8Array, expectedLength: number) {
  if (classes.length !== expectedLength) {
    throw new Error(
      'Coastline classification byte count must match the reference grid dimensions.',
    );
  }
  const counts = {
    land: 0,
    breakline: 0,
    ocean: 0,
  };
  for (let index = 0; index < classes.length; index += 1) {
    switch (classes[index]) {
      case COASTAL_SURFACE_LAND:
        counts.land += 1;
        break;
      case COASTAL_SURFACE_BREAKLINE:
        counts.breakline += 1;
        break;
      case COASTAL_SURFACE_OCEAN:
        counts.ocean += 1;
        break;
      default:
        throw new Error(`Unsupported coastline surface class at ${index}.`);
    }
  }
  if (counts.land === 0 || counts.breakline === 0 || counts.ocean === 0) {
    throw new Error(
      'Coastline classification must contain land, breakline, and ocean cells.',
    );
  }
}

function approximatelyEqual(left: number, right: number) {
  return Math.abs(left - right) <= 1e-12;
}

function referenceLongitude(grid: NormalizedElevationGrid, column: number) {
  return grid.longitudeDegreesByColumn?.[column]
    ?? grid.bounds.west +
      ((grid.bounds.east - grid.bounds.west) * column) / (grid.width - 1);
}

function referenceLatitude(grid: NormalizedElevationGrid, row: number) {
  const northToSouthLatitude = grid.bounds.north -
    ((grid.bounds.north - grid.bounds.south) * row) / (grid.height - 1);
  if (grid.rowOrder === 'north-to-south') {
    return grid.latitudeDegreesByRow?.[row] ?? northToSouthLatitude;
  }
  return grid.latitudeDegreesByRow?.[row]
    ?? grid.bounds.south +
      ((grid.bounds.north - grid.bounds.south) * row) / (grid.height - 1);
}

function validateReferenceGrid(grid: NormalizedElevationGrid) {
  if (grid.horizontalCrs !== 'EPSG:4326') {
    throw new Error('GeoTIFF coastline classification requires an EPSG:4326 reference grid.');
  }
  if (grid.rowOrder !== 'north-to-south') {
    throw new Error('GeoTIFF coastline classification requires north-to-south row order.');
  }
  if (
    !Number.isInteger(grid.width) ||
    !Number.isInteger(grid.height) ||
    grid.width < 2 ||
    grid.height < 2 ||
    grid.width * grid.height > MAX_ELEVATION_GRID_CELLS
  ) {
    throw new Error('GeoTIFF coastline classification reference grid dimensions are unsupported.');
  }
}

function validateRectilinearReferenceGrid(grid: NormalizedElevationGrid) {
  validateReferenceGrid(grid);
  if (grid.coordinateModel === 'per-grid-node') {
    throw new Error('GeoTIFF coastline classification requires rectilinear reference grid coordinates.');
  }
}

function parseWgs84UtmSourceCrs(value: string) {
  const match = /^EPSG:(326|327)(0[1-9]|[1-5]\d|60)$/.exec(value);
  if (!match) return null;
  return {
    zone: Number(match[2]),
    hemisphere: match[1] === '326' ? 'north' : 'south',
  } as const;
}

function utmProjectionDefinition(sourceCrs: string) {
  const utm = parseWgs84UtmSourceCrs(sourceCrs);
  if (!utm) return null;
  return [
    '+proj=utm',
    `+zone=${utm.zone}`,
    utm.hemisphere === 'south' ? '+south' : '',
    '+datum=WGS84',
    '+units=m',
    '+no_defs',
  ].filter(Boolean).join(' ');
}

function readClassificationSourceCrs(
  geoKeys: Record<string, unknown> | null,
) {
  const modelType = Number(geoKeys?.GTModelTypeGeoKey);
  const geographicCode = Number(
    geoKeys?.GeodeticCRSGeoKey ?? geoKeys?.GeographicTypeGeoKey,
  );
  if (modelType === 2 && geographicCode === 4326) return 'EPSG:4326' as const;
  const projectedCode = Number(
    geoKeys?.ProjectedCRSGeoKey ?? geoKeys?.ProjectedCSTypeGeoKey,
  );
  const projectedCrs = `EPSG:${projectedCode}`;
  if (modelType === 1 && parseWgs84UtmSourceCrs(projectedCrs)) {
    return projectedCrs as `EPSG:326${string}` | `EPSG:327${string}`;
  }
  throw new Error(
    'GeoTIFF coastline classification supports only EPSG:4326 or WGS84 UTM EPSG:32601-32660 / EPSG:32701-32760.',
  );
}

function asWgs84CenterBounds(
  values: readonly number[],
  resolution: readonly number[],
  pixelInterpretation: 'area' | 'point',
) {
  if (
    values.length < 4 ||
    resolution.length < 2 ||
    values.slice(0, 4).some(value => !Number.isFinite(value)) ||
    !Number.isFinite(resolution[0]) ||
    !Number.isFinite(resolution[1])
  ) {
    throw new Error('GeoTIFF coastline classification requires finite affine bounds and resolution.');
  }
  const [west, south, east, north] = values;
  const resolutionX = Number(resolution[0]);
  const resolutionY = Number(resolution[1]);
  if (west >= east || south >= north || resolutionX <= 0 || resolutionY >= 0) {
    throw new Error('GeoTIFF coastline classification requires an unrotated north-up grid.');
  }
  const halfX = Math.abs(resolutionX) / 2;
  const halfY = Math.abs(resolutionY) / 2;
  const centerBounds = pixelInterpretation === 'area'
    ? {
        west: west + halfX,
        south: south + halfY,
        east: east - halfX,
        north: north - halfY,
      }
    : { west, south, east, north };
  if (
    centerBounds.west >= centerBounds.east ||
    centerBounds.south >= centerBounds.north ||
    centerBounds.west < -180 ||
    centerBounds.east > 180 ||
    centerBounds.south < -90 ||
    centerBounds.north > 90
  ) {
    throw new Error('GeoTIFF coastline classification WGS84 center bounds are invalid.');
  }
  return { centerBounds, resolutionX, resolutionY };
}

function asProjectedCenterExtent(
  values: readonly number[],
  resolution: readonly number[],
  pixelInterpretation: 'area' | 'point',
) {
  if (
    values.length < 4 ||
    resolution.length < 2 ||
    values.slice(0, 4).some(value => !Number.isFinite(value)) ||
    !Number.isFinite(resolution[0]) ||
    !Number.isFinite(resolution[1])
  ) {
    throw new Error('GeoTIFF coastline classification requires finite affine bounds and resolution.');
  }
  const [minimumX, minimumY, maximumX, maximumY] = values;
  const resolutionX = Number(resolution[0]);
  const resolutionY = Number(resolution[1]);
  if (
    minimumX >= maximumX ||
    minimumY >= maximumY ||
    resolutionX <= 0 ||
    resolutionY >= 0
  ) {
    throw new Error('GeoTIFF coastline classification requires an unrotated north-up grid.');
  }
  const halfX = Math.abs(resolutionX) / 2;
  const halfY = Math.abs(resolutionY) / 2;
  const centerExtent = pixelInterpretation === 'area'
    ? {
        minimumX: minimumX + halfX,
        minimumY: minimumY + halfY,
        maximumX: maximumX - halfX,
        maximumY: maximumY - halfY,
      }
    : { minimumX, minimumY, maximumX, maximumY };
  if (
    centerExtent.minimumX >= centerExtent.maximumX ||
    centerExtent.minimumY >= centerExtent.maximumY
  ) {
    throw new Error('GeoTIFF coastline classification projected center extent is invalid.');
  }
  return { centerExtent, resolutionX, resolutionY };
}

/**
 * Accepts an already classified local grid. It deliberately does not infer
 * coastline classes from elevation values or download source material.
 */
export async function adaptCoastlineClassificationGrid(
  request: CoastlineClassificationAdapterRequest,
): Promise<CoastlineClassificationAdapterResult> {
  if (!request.maskId.trim()) {
    throw new Error('maskId is required.');
  }
  if (!request.adapterVersion.trim()) {
    throw new Error('adapterVersion is required.');
  }
  requireIsoTimestamp('referenceGrid.generatedAt', request.referenceGrid.generatedAt);
  requireIsoTimestamp('shorelineEpoch', request.shorelineEpoch);
  requireSha256('source snapshot', request.sourceSnapshotSha256);
  requireSha256('classification', request.expectedClassificationSha256);
  const promoted = await resolvePromotedCoastlineSource({
    sourceRecord: request.sourceRecord,
    legendPromotion: request.legendPromotion,
  });
  const sourceRecord = promoted.sourceRecord;
  requireSourceBoundCoastlineClassificationSemantics(
    request.classificationSemantics,
    sourceRecord,
  );

  const coordinateLattice = createCoastalGridLattice(request.referenceGrid);
  const coordinateLatticeSha256 = await hashCoastalGridLattice(
    coordinateLattice,
  );
  validateSurfaceClasses(
    request.classes,
    request.referenceGrid.width * request.referenceGrid.height,
  );
  const classificationSha256 = await sha256Bytes(request.classes);
  if (
    classificationSha256.toLowerCase() !==
    request.expectedClassificationSha256.toLowerCase()
  ) {
    throw new Error('Coastline classification SHA-256 does not match its bytes.');
  }
  if (!topographicSourceBindsDigest(sourceRecord, request.sourceSnapshotSha256)) {
    throw new Error(
      'Coastline source snapshot digest is not bound to the promoted source record.',
    );
  }
  if (
    !sourceBindsRelatedArtifactDigest(
      sourceRecord,
      coordinateLatticeSha256,
    )
  ) {
    throw new Error(
      'Coastline source must bind the coordinate lattice digest as related evidence.',
    );
  }

  const sourceGate = buildTopographicExportPlan({
    bounds: request.referenceGrid.bounds,
    countryCode: request.referenceGrid.countryCode,
    crs: request.referenceGrid.horizontalCrs,
    format: 'geojson',
    layerIds: ['waterways'],
    sourceRecords: [sourceRecord],
    dataMode: sourceRecord.syntheticOnly ? 'synthetic' : 'source-backed',
    now: request.referenceGrid.generatedAt,
  });
  if (sourceGate.status !== 'ready') {
    throw new Error(
      `Coastline source gate blocked: ${sourceGate.issues
        .map(issue => `${issue.code}: ${issue.message}`)
        .join('; ')}`,
    );
  }

  return {
    classification: {
      maskId: request.maskId,
      width: request.referenceGrid.width,
      height: request.referenceGrid.height,
      bounds: { ...request.referenceGrid.bounds },
      rowOrder: request.referenceGrid.rowOrder,
      horizontalCrs: request.referenceGrid.horizontalCrs,
      coordinateLattice,
      expectedCoordinateLatticeSha256: coordinateLatticeSha256,
      classes: Uint8Array.from(request.classes),
      sourceRecord,
      sourceSnapshotSha256: request.sourceSnapshotSha256,
      expectedClassificationSha256: classificationSha256,
      adapterVersion: request.adapterVersion,
      shorelineEpoch: request.shorelineEpoch,
      legendPromotion: promoted.promotionEvidence,
    },
    sourceGate,
    provenance: {
      adapterVersion: request.adapterVersion,
      encoding: TOPOGRAPHIC_COASTLINE_CLASSIFICATION_ENCODING,
      sourceId: sourceRecord.sourceId,
      sourceVersion: sourceRecord.version,
      sourceSnapshotSha256: request.sourceSnapshotSha256,
      classificationSha256,
      coordinateLatticeSha256,
      shorelineEpoch: request.shorelineEpoch,
      classificationSemantics: {
        schemaVersion: request.classificationSemantics.schemaVersion,
        bandIndex: request.classificationSemantics.bandIndex,
        legendSha256: request.classificationSemantics.legend.sha256,
        legendVersion: request.classificationSemantics.legend.version,
      },
      legendPromotion: promoted.promotionEvidence,
    },
    warnings: [
      'This adapter accepts an already classified local grid and does not infer coastline classes from elevation.',
      'A ready source gate proves the reviewed source metadata contract only; it does not prove navigational, cadastral, or delivery accuracy.',
      'The result retains classification bytes in memory for seam reconciliation and must not be logged as a location dataset.',
    ],
  };
}

/**
 * Reads one categorical GeoTIFF band only when it is exactly co-registered
 * with the supplied WGS84 reference grid. WGS84 UTM inputs are compared at
 * every inverse-projected grid node. No resampling occurs.
 */
export async function decodeGeoTiffCoastlineClassification(
  request: GeoTiffCoastlineClassificationDecodeRequest,
): Promise<GeoTiffCoastlineClassificationDecodeResult> {
  validateReferenceGrid(request.referenceGrid);
  requireSha256('expected GeoTIFF', request.expectedGeoTiffSha256);
  if (
    request.arrayBuffer.byteLength === 0 ||
    request.arrayBuffer.byteLength > MAX_GEOTIFF_BYTE_LENGTH
  ) {
    throw new Error(
      `GeoTIFF coastline classification must be between 1 and ${MAX_GEOTIFF_BYTE_LENGTH} bytes.`,
    );
  }
  const contentSha256 = await sha256ArrayBuffer(request.arrayBuffer);
  if (
    contentSha256.toLowerCase() !==
    request.expectedGeoTiffSha256.toLowerCase()
  ) {
    throw new Error('GeoTIFF coastline classification digest does not match its bytes.');
  }
  if (
    request.sourceSnapshotSha256.toLowerCase() !== contentSha256.toLowerCase()
  ) {
    throw new Error('Coastline source snapshot must be the exact GeoTIFF digest.');
  }
  if (!topographicSourceBindsDigest(request.sourceRecord, contentSha256)) {
    throw new Error(
      'GeoTIFF coastline classification digest is not bound to the promoted source record.',
    );
  }
  let geotiff;
  try {
    geotiff = await fromArrayBuffer(request.arrayBuffer);
  } catch (error) {
    throw new Error(
      `GeoTIFF coastline classification parse failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const imageCount = await geotiff.getImageCount();
  if (imageCount < 1) {
    throw new Error('GeoTIFF coastline classification has no images.');
  }
  const image = await geotiff.getImage(0);
  if (image.getFileDirectory().hasTag('ModelTransformation')) {
    throw new Error('GeoTIFF coastline classification does not support rotated grids.');
  }
  const geoKeys = image.getGeoKeys() as Record<string, unknown> | null;
  const sourceHorizontalCrs = readClassificationSourceCrs(geoKeys);
  if (
    request.sourceRecord.snapshotEvidence?.horizontalCrs !== sourceHorizontalCrs
  ) {
    throw new Error(
      `GeoTIFF coastline classification source CRS ${sourceHorizontalCrs} does not match source evidence ${request.sourceRecord.snapshotEvidence?.horizontalCrs ?? 'missing'}.`,
    );
  }
  const width = image.getWidth();
  const height = image.getHeight();
  if (
    width !== request.referenceGrid.width ||
    height !== request.referenceGrid.height
  ) {
    throw new Error('GeoTIFF coastline classification dimensions do not match the reference grid.');
  }
  const samplesPerPixel = image.getSamplesPerPixel();
  const selectedBandIndex = request.bandIndex ?? 0;
  if (
    !Number.isInteger(selectedBandIndex) ||
    selectedBandIndex < 0 ||
    selectedBandIndex >= samplesPerPixel
  ) {
    throw new Error(
      `GeoTIFF coastline classification bandIndex must be between 0 and ${samplesPerPixel - 1}.`,
    );
  }
  validateCoastlineClassificationSemantics(request.classificationSemantics);
  if (request.classificationSemantics.bandIndex !== selectedBandIndex) {
    throw new Error('Coastline classification semantics bandIndex does not match the selected GeoTIFF band.');
  }
  const pixelInterpretation = image.pixelIsArea() ? 'area' as const : 'point' as const;
  if (sourceHorizontalCrs === 'EPSG:4326') {
    validateRectilinearReferenceGrid(request.referenceGrid);
    const { centerBounds, resolutionX, resolutionY } = asWgs84CenterBounds(
      image.getBoundingBox(),
      image.getResolution(),
      pixelInterpretation,
    );
    for (let column = 0; column < width; column += 1) {
      const longitude = centerBounds.west + column * resolutionX;
      if (!approximatelyEqual(longitude, referenceLongitude(request.referenceGrid, column))) {
        throw new Error(`GeoTIFF coastline classification longitude axis differs at ${column}.`);
      }
    }
    for (let row = 0; row < height; row += 1) {
      const latitude = centerBounds.north - row * Math.abs(resolutionY);
      if (!approximatelyEqual(latitude, referenceLatitude(request.referenceGrid, row))) {
        throw new Error(`GeoTIFF coastline classification latitude axis differs at ${row}.`);
      }
    }
  } else {
    const sourceGrid = request.referenceGrid.curvilinearSourceGrid;
    if (
      request.referenceGrid.coordinateModel !== 'per-grid-node' ||
      !request.referenceGrid.longitudeLatitudeDegreesByCell ||
      !sourceGrid ||
      sourceGrid.sourceCrs !== sourceHorizontalCrs
    ) {
      throw new Error(
        'Projected GeoTIFF coastline classification requires matching per-grid-node UTM reference evidence.',
      );
    }
    const definition = utmProjectionDefinition(sourceHorizontalCrs);
    if (!definition) {
      throw new Error('Projected GeoTIFF coastline classification requires a WGS84 UTM source CRS.');
    }
    const { centerExtent, resolutionX, resolutionY } = asProjectedCenterExtent(
      image.getBoundingBox(),
      image.getResolution(),
      pixelInterpretation,
    );
    const referenceExtent = sourceGrid.sourceCenterExtent;
    if (
      !approximatelyEqual(centerExtent.minimumX, referenceExtent.minimumX) ||
      !approximatelyEqual(centerExtent.minimumY, referenceExtent.minimumY) ||
      !approximatelyEqual(centerExtent.maximumX, referenceExtent.maximumX) ||
      !approximatelyEqual(centerExtent.maximumY, referenceExtent.maximumY)
    ) {
      throw new Error('Projected GeoTIFF coastline classification source extent differs from the reference grid.');
    }
    const sourceToWgs84 = proj4(definition, 'EPSG:4326');
    for (let row = 0; row < height; row += 1) {
      for (let column = 0; column < width; column += 1) {
        const sourceX = centerExtent.minimumX + column * resolutionX;
        const sourceY = centerExtent.maximumY - row * Math.abs(resolutionY);
        const coordinate = sourceToWgs84.forward([sourceX, sourceY]);
        const reference = request.referenceGrid.longitudeLatitudeDegreesByCell[
          row * width + column
        ];
        if (
          !reference ||
          !approximatelyEqual(Number(coordinate[0]), reference[0]) ||
          !approximatelyEqual(Number(coordinate[1]), reference[1])
        ) {
          throw new Error(`Projected GeoTIFF coastline classification grid node differs at ${row * width + column}.`);
        }
      }
    }
  }

  const noDataValue = image.getGDALNoData();
  const rasters = await image.readRasters({
    samples: [selectedBandIndex],
    interleave: true,
  });
  const classes = new Uint8Array(width * height);
  for (let index = 0; index < classes.length; index += 1) {
    const value = Number(rasters[index]);
    if (
      !Number.isFinite(value) ||
      (noDataValue !== null && value === Number(noDataValue))
    ) {
      throw new Error(`GeoTIFF coastline classification has NoData at ${index}.`);
    }
    if (!Number.isInteger(value) || value < 0 || value > 255) {
      throw new Error(`GeoTIFF coastline classification value is not an unsigned byte at ${index}.`);
    }
    classes[index] = value;
  }
  const classificationSha256 = await sha256Bytes(classes);
  const adapted = await adaptCoastlineClassificationGrid({
    maskId: request.maskId,
    referenceGrid: request.referenceGrid,
    classes,
    expectedClassificationSha256: classificationSha256,
    sourceRecord: request.sourceRecord,
    sourceSnapshotSha256: request.sourceSnapshotSha256,
    adapterVersion: request.adapterVersion,
    shorelineEpoch: request.shorelineEpoch,
    classificationSemantics: request.classificationSemantics,
    legendPromotion: request.legendPromotion,
  });
  const cogValidation = request.cogValidation
    ? bindPassedTopographicCogValidationEvidence({
        receipt: request.cogValidation.receipt,
        receiptSha256: request.cogValidation.receiptSha256,
        expectedContentSha256: contentSha256,
        expectedByteLength: request.arrayBuffer.byteLength,
      })
    : null;
  if (
    cogValidation &&
    !sourceBindsRelatedArtifactDigest(
      adapted.classification.sourceRecord,
      cogValidation.receiptSha256,
    )
  ) {
    throw new Error(
      'GeoTIFF coastline COG receipt digest is not bound as related source evidence.',
    );
  }

  return {
    ...adapted,
    input: {
      contentSha256,
      byteLength: request.arrayBuffer.byteLength,
      selectedBandIndex,
      width,
      height,
      pixelInterpretation,
      sourceHorizontalCrs,
      cogValidation,
    },
    warnings: [
      ...adapted.warnings,
      'The GeoTIFF class-band reader accepts only exact WGS84 or WGS84 UTM co-registration and a source-bound reviewed class legend; it performs no resampling.',
      ...(cogValidation
        ? ['A strict GDAL COG receipt is bound by digest; its raw validator report remains separate.']
        : ['No COG conformance claim is made without a supplied strict GDAL receipt.']),
    ],
  };
}
