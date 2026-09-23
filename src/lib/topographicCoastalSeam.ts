import {
  buildTopographicExportPlan,
  topographicSourceBindsDigest,
  type TopographicBounds,
  type TopographicExportPlan,
  type TopographicSourceRecord,
} from './topographicExport';
import {
  MAX_ELEVATION_GRID_CELLS,
  type NormalizedElevationGrid,
} from './topographicElevationVectorizer';
import {
  TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_EVIDENCE_VERSION,
  type CoastlineLegendPromotionEvidence,
} from './topographicCoastlineLegendPromotionContract';

export const TOPOGRAPHIC_COASTAL_SEAM_VERSION =
  'agid-topographic-coastal-seam-v0.2';
export const TOPOGRAPHIC_COASTAL_LATTICE_SCHEMA =
  'agid-coastal-grid-lattice-v0.1';
export const COASTAL_SURFACE_OCEAN = 0;
export const COASTAL_SURFACE_BREAKLINE = 1;
export const COASTAL_SURFACE_LAND = 2;
export const MAX_COASTLINE_ADJUSTMENT_METERS = 100;

export type CoastalElevationInput = {
  grid: NormalizedElevationGrid;
  sourceSnapshotSha256: `sha256:${string}`;
};

export type CoastalGridLattice = {
  schemaVersion: typeof TOPOGRAPHIC_COASTAL_LATTICE_SCHEMA;
  width: number;
  height: number;
  bounds: TopographicBounds;
  rowOrder: NormalizedElevationGrid['rowOrder'];
  horizontalCrs: 'EPSG:4326';
  coordinateModel: 'rectilinear-axes' | 'per-grid-node';
  longitudeDegreesByColumn?: number[];
  latitudeDegreesByRow?: number[];
  longitudeLatitudeDegreesByCell?: Array<[number, number]>;
  curvilinearSourceGrid?: NonNullable<
    NormalizedElevationGrid['curvilinearSourceGrid']
  >;
};

export type CoastlineClassificationInput = {
  maskId: string;
  width: number;
  height: number;
  bounds: TopographicBounds;
  rowOrder: NormalizedElevationGrid['rowOrder'];
  horizontalCrs: 'EPSG:4326';
  coordinateLattice: CoastalGridLattice;
  expectedCoordinateLatticeSha256: `sha256:${string}`;
  classes: Uint8Array;
  sourceRecord: TopographicSourceRecord;
  sourceSnapshotSha256: `sha256:${string}`;
  expectedClassificationSha256: `sha256:${string}`;
  adapterVersion: string;
  shorelineEpoch: string;
  legendPromotion?: CoastlineLegendPromotionEvidence | null;
};

export type CoastalSeamRequest = {
  land: CoastalElevationInput;
  bathymetry: CoastalElevationInput;
  coastline: CoastlineClassificationInput;
  targetVerticalDatum: string;
  generatedAt: string;
  coastlineElevationMeters?: number;
  maximumAdjustmentMeters?: number;
};

export type ReconciledCoastalElevationGrid = Omit<
  NormalizedElevationGrid,
  'sourceRecord'
> & {
  sourceIds: {
    land: string;
    bathymetry: string;
    coastline: string;
  };
};

export type CoastalSeamMetrics = {
  gridCellCount: number;
  landCellCount: number;
  oceanCellCount: number;
  breaklineCellCount: number;
  maximumLandBreaklineAdjustmentMeters: number;
  maximumBathymetryBreaklineAdjustmentMeters: number;
};

export type CoastalSeamResult = {
  seamVersion: string;
  grid: ReconciledCoastalElevationGrid;
  sourceGates: {
    land: TopographicExportPlan;
    bathymetry: TopographicExportPlan;
    coastline: TopographicExportPlan;
  };
  provenance: {
    landSourceId: string;
    landSourceVersion: string;
    landSnapshotSha256: `sha256:${string}`;
    bathymetrySourceId: string;
    bathymetrySourceVersion: string;
    bathymetrySnapshotSha256: `sha256:${string}`;
    coastlineSourceId: string;
    coastlineSourceVersion: string;
    coastlineSnapshotSha256: `sha256:${string}`;
    classificationSha256: `sha256:${string}`;
    coordinateLatticeSha256: `sha256:${string}`;
    coastlineAdapterVersion: string;
    shorelineEpoch: string;
    coastlineLegendPromotion: CoastlineLegendPromotionEvidence | null;
    targetVerticalDatum: string;
    sourceTermsUrls: string[];
    sourceCorrectionUrls: string[];
  };
  metrics: CoastalSeamMetrics;
  warnings: string[];
};

function requireIsoTimestamp(field: string, value: string) {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be an ISO timestamp.`);
  }
}

function equalBounds(left: TopographicBounds, right: TopographicBounds) {
  return (
    left.south === right.south &&
    left.west === right.west &&
    left.north === right.north &&
    left.east === right.east
  );
}

function cloneBounds(bounds: TopographicBounds): TopographicBounds {
  return {
    south: bounds.south,
    west: bounds.west,
    north: bounds.north,
    east: bounds.east,
  };
}

function validateCoastalGridLattice(lattice: CoastalGridLattice) {
  if (lattice.schemaVersion !== TOPOGRAPHIC_COASTAL_LATTICE_SCHEMA) {
    throw new Error('Coastline coordinate lattice schema version is unsupported.');
  }
  if (
    !Number.isInteger(lattice.width) ||
    !Number.isInteger(lattice.height) ||
    lattice.width < 2 ||
    lattice.height < 2
  ) {
    throw new Error('Coastline coordinate lattice dimensions must be integers of at least 2.');
  }
  if (lattice.rowOrder !== 'north-to-south' && lattice.rowOrder !== 'south-to-north') {
    throw new Error('Coastline coordinate lattice rowOrder is unsupported.');
  }
  if (lattice.horizontalCrs !== 'EPSG:4326') {
    throw new Error('Coastline coordinate lattice must use EPSG:4326.');
  }
  if (
    !Number.isFinite(lattice.bounds.south) ||
    !Number.isFinite(lattice.bounds.west) ||
    !Number.isFinite(lattice.bounds.north) ||
    !Number.isFinite(lattice.bounds.east) ||
    lattice.bounds.south >= lattice.bounds.north ||
    lattice.bounds.west >= lattice.bounds.east
  ) {
    throw new Error('Coastline coordinate lattice bounds must be increasing finite values.');
  }

  if (lattice.coordinateModel === 'rectilinear-axes') {
    if (
      lattice.longitudeLatitudeDegreesByCell !== undefined ||
      lattice.curvilinearSourceGrid !== undefined
    ) {
      throw new Error('Rectilinear coastline lattices cannot contain curvilinear coordinates.');
    }
    if (lattice.longitudeDegreesByColumn !== undefined) {
      if (lattice.longitudeDegreesByColumn.length !== lattice.width) {
        throw new Error('Coastline longitude axis length does not match lattice width.');
      }
      for (let index = 0; index < lattice.longitudeDegreesByColumn.length; index += 1) {
        const value = lattice.longitudeDegreesByColumn[index];
        if (
          !Number.isFinite(value) ||
          value < lattice.bounds.west ||
          value > lattice.bounds.east ||
          (index > 0 && value <= lattice.longitudeDegreesByColumn[index - 1])
        ) {
          throw new Error(`Invalid coastline longitude axis value at ${index}.`);
        }
      }
    }
    if (lattice.latitudeDegreesByRow !== undefined) {
      if (lattice.latitudeDegreesByRow.length !== lattice.height) {
        throw new Error('Coastline latitude axis length does not match lattice height.');
      }
      for (let index = 0; index < lattice.latitudeDegreesByRow.length; index += 1) {
        const value = lattice.latitudeDegreesByRow[index];
        if (
          !Number.isFinite(value) ||
          value < lattice.bounds.south ||
          value > lattice.bounds.north ||
          (index > 0 &&
            (lattice.rowOrder === 'north-to-south'
              ? value >= lattice.latitudeDegreesByRow[index - 1]
              : value <= lattice.latitudeDegreesByRow[index - 1]))
        ) {
          throw new Error(`Invalid coastline latitude axis value at ${index}.`);
        }
      }
    }
    return;
  }

  if (lattice.coordinateModel !== 'per-grid-node') {
    throw new Error('Coastline coordinate lattice coordinateModel is unsupported.');
  }
  if (
    lattice.longitudeDegreesByColumn !== undefined ||
    lattice.latitudeDegreesByRow !== undefined ||
    lattice.longitudeLatitudeDegreesByCell === undefined ||
    lattice.curvilinearSourceGrid === undefined
  ) {
    throw new Error(
      'Curvilinear coastline lattices require per-grid-node coordinates and source-frame evidence.',
    );
  }
  if (
    lattice.longitudeLatitudeDegreesByCell.length !==
    lattice.width * lattice.height
  ) {
    throw new Error('Coastline per-grid-node coordinate count does not match lattice dimensions.');
  }
  for (let index = 0; index < lattice.longitudeLatitudeDegreesByCell.length; index += 1) {
    const [longitude, latitude] = lattice.longitudeLatitudeDegreesByCell[index];
    if (
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      longitude < lattice.bounds.west ||
      longitude > lattice.bounds.east ||
      latitude < lattice.bounds.south ||
      latitude > lattice.bounds.north
    ) {
      throw new Error(`Invalid coastline per-grid-node coordinate at ${index}.`);
    }
  }
  const { sourceCenterExtent } = lattice.curvilinearSourceGrid;
  if (
    lattice.curvilinearSourceGrid.library !== 'proj4js' ||
    lattice.curvilinearSourceGrid.interpolation !==
      'source-affine-linear-inverse-projection' ||
    !lattice.curvilinearSourceGrid.sourceCrs.trim() ||
    !Number.isFinite(sourceCenterExtent.minimumX) ||
    !Number.isFinite(sourceCenterExtent.minimumY) ||
    !Number.isFinite(sourceCenterExtent.maximumX) ||
    !Number.isFinite(sourceCenterExtent.maximumY) ||
    sourceCenterExtent.minimumX >= sourceCenterExtent.maximumX ||
    sourceCenterExtent.minimumY >= sourceCenterExtent.maximumY
  ) {
    throw new Error('Curvilinear coastline lattice source-frame evidence is invalid.');
  }
}

function canonicalizeCoastalGridLattice(
  lattice: CoastalGridLattice,
): CoastalGridLattice {
  validateCoastalGridLattice(lattice);
  const common = {
    schemaVersion: TOPOGRAPHIC_COASTAL_LATTICE_SCHEMA as typeof TOPOGRAPHIC_COASTAL_LATTICE_SCHEMA,
    width: lattice.width,
    height: lattice.height,
    bounds: cloneBounds(lattice.bounds),
    rowOrder: lattice.rowOrder,
    horizontalCrs: 'EPSG:4326' as const,
    coordinateModel: lattice.coordinateModel,
  };
  if (lattice.coordinateModel === 'rectilinear-axes') {
    return {
      ...common,
      coordinateModel: 'rectilinear-axes',
      ...(lattice.longitudeDegreesByColumn === undefined
        ? {}
        : { longitudeDegreesByColumn: [...lattice.longitudeDegreesByColumn] }),
      ...(lattice.latitudeDegreesByRow === undefined
        ? {}
        : { latitudeDegreesByRow: [...lattice.latitudeDegreesByRow] }),
    };
  }
  return {
    ...common,
    coordinateModel: 'per-grid-node',
    longitudeLatitudeDegreesByCell: lattice.longitudeLatitudeDegreesByCell!.map(
      ([longitude, latitude]) => [longitude, latitude],
    ),
    curvilinearSourceGrid: {
      sourceCrs: lattice.curvilinearSourceGrid!.sourceCrs,
      sourceCenterExtent: {
        ...lattice.curvilinearSourceGrid!.sourceCenterExtent,
      },
      library: 'proj4js',
      interpolation: 'source-affine-linear-inverse-projection',
    },
  };
}

function canonicalCoastalGridLatticeJson(lattice: CoastalGridLattice) {
  return JSON.stringify(canonicalizeCoastalGridLattice(lattice));
}

export function createCoastalGridLattice(
  grid: NormalizedElevationGrid,
): CoastalGridLattice {
  return canonicalizeCoastalGridLattice({
    schemaVersion: TOPOGRAPHIC_COASTAL_LATTICE_SCHEMA,
    width: grid.width,
    height: grid.height,
    bounds: cloneBounds(grid.bounds),
    rowOrder: grid.rowOrder,
    horizontalCrs: grid.horizontalCrs,
    coordinateModel: grid.coordinateModel ?? 'rectilinear-axes',
    ...(grid.longitudeDegreesByColumn === undefined
      ? {}
      : { longitudeDegreesByColumn: [...grid.longitudeDegreesByColumn] }),
    ...(grid.latitudeDegreesByRow === undefined
      ? {}
      : { latitudeDegreesByRow: [...grid.latitudeDegreesByRow] }),
    ...(grid.longitudeLatitudeDegreesByCell === undefined
      ? {}
      : {
          longitudeLatitudeDegreesByCell:
            grid.longitudeLatitudeDegreesByCell.map(([longitude, latitude]) => [
              longitude,
              latitude,
            ]),
        }),
    ...(grid.curvilinearSourceGrid === undefined
      ? {}
      : {
          curvilinearSourceGrid: {
            sourceCrs: grid.curvilinearSourceGrid.sourceCrs,
            sourceCenterExtent: {
              ...grid.curvilinearSourceGrid.sourceCenterExtent,
            },
            library: grid.curvilinearSourceGrid.library,
            interpolation: grid.curvilinearSourceGrid.interpolation,
          },
        }),
  });
}

function validateGridStructure(
  role: 'land' | 'bathymetry',
  grid: NormalizedElevationGrid,
) {
  if (!Number.isInteger(grid.width) || !Number.isInteger(grid.height)) {
    throw new Error(`${role} grid dimensions must be integers.`);
  }
  if (grid.width < 2 || grid.height < 2) {
    throw new Error(`${role} grid must be at least 2x2.`);
  }
  const cellCount = grid.width * grid.height;
  if (cellCount > MAX_ELEVATION_GRID_CELLS) {
    throw new Error(`${role} grid exceeds ${MAX_ELEVATION_GRID_CELLS} cells.`);
  }
  if (grid.elevationsMeters.length !== cellCount) {
    throw new Error(`${role} grid must contain ${cellCount} elevation values.`);
  }
  for (let index = 0; index < cellCount; index += 1) {
    if (!Number.isFinite(grid.elevationsMeters[index])) {
      throw new Error(`${role} grid contains a non-finite value at ${index}.`);
    }
  }
}

function validateSourceDigest(
  role: string,
  sourceRecord: TopographicSourceRecord,
  digest: string,
) {
  if (!/^sha256:[a-f0-9]{64}$/i.test(digest)) {
    throw new Error(`${role} source snapshot requires a SHA-256 digest.`);
  }
  if (!topographicSourceBindsDigest(sourceRecord, digest)) {
    throw new Error(
      `${role} source snapshot digest is not bound to the promoted source record.`,
    );
  }
}

function sourceBindsRelatedArtifactDigest(
  sourceRecord: TopographicSourceRecord,
  digest: string,
) {
  return (
    sourceRecord.snapshotEvidence?.relatedArtifactSha256?.some(
      value => value.toLowerCase() === digest.toLowerCase(),
    ) === true
  );
}

function validateCoastlineLegendPromotion(
  sourceRecord: TopographicSourceRecord,
  sourceSnapshotSha256: `sha256:${string}`,
  promotion: CoastlineLegendPromotionEvidence | null | undefined,
) {
  if (sourceRecord.syntheticOnly === true) {
    if (promotion !== null && promotion !== undefined) {
      throw new Error(
        'Synthetic coastline classifications must not assert independent legend promotion evidence.',
      );
    }
    return null;
  }
  if (!promotion) {
    throw new Error(
      'Source-backed coastline classification requires independent legend promotion evidence.',
    );
  }
  if (
    promotion.schemaVersion
      !== TOPOGRAPHIC_COASTLINE_LEGEND_PROMOTION_EVIDENCE_VERSION
    || promotion.status !== 'approved'
    || promotion.sourceId !== sourceRecord.sourceId
    || promotion.sourceVersion !== sourceRecord.version
    || promotion.classificationGeoTiffSha256.toLowerCase()
      !== sourceSnapshotSha256.toLowerCase()
  ) {
    throw new Error(
      'Coastline legend promotion evidence does not match the source-backed classification.',
    );
  }
  for (const [label, digest] of [
    ['classification GeoTIFF', promotion.classificationGeoTiffSha256],
    ['legend receipt', promotion.receiptSha256],
    ['promotion', promotion.promotionDigest],
  ] as const) {
    if (!/^sha256:[a-f0-9]{64}$/i.test(digest)) {
      throw new Error(`Coastline ${label} promotion evidence must be a SHA-256 digest.`);
    }
  }
  if (
    !Number.isSafeInteger(promotion.sequence)
    || promotion.sequence < 1
    || !Number.isSafeInteger(promotion.minimumSignatures)
    || promotion.minimumSignatures < 2
    || !Number.isSafeInteger(promotion.verifiedSignatureCount)
    || promotion.verifiedSignatureCount < promotion.minimumSignatures
  ) {
    throw new Error('Coastline legend promotion quorum evidence is invalid.');
  }
  if (
    !sourceBindsRelatedArtifactDigest(sourceRecord, promotion.receiptSha256)
    || !sourceBindsRelatedArtifactDigest(sourceRecord, promotion.promotionDigest)
  ) {
    throw new Error(
      'Source-backed coastline record must bind the receipt and promotion digests as related evidence.',
    );
  }
  return promotion;
}

function buildSourceGate(
  sourceRecord: TopographicSourceRecord,
  bounds: TopographicBounds,
  countryCode: string | undefined,
  layerId: 'terrain-mesh' | 'waterways',
  generatedAt: string,
) {
  const gate = buildTopographicExportPlan({
    bounds,
    countryCode,
    crs: 'EPSG:4326',
    format: layerId === 'waterways' ? 'geojson' : 'txt',
    layerIds: [layerId],
    sourceRecords: [sourceRecord],
    dataMode: sourceRecord.syntheticOnly ? 'synthetic' : 'source-backed',
    now: generatedAt,
  });
  if (gate.status !== 'ready') {
    throw new Error(
      `${sourceRecord.sourceId} source gate blocked: ${gate.issues
        .map(issue => `${issue.code}: ${issue.message}`)
        .join('; ')}`,
    );
  }
  return gate;
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

export async function hashCoastalGridLattice(
  lattice: CoastalGridLattice,
): Promise<`sha256:${string}`> {
  return sha256Bytes(
    new TextEncoder().encode(canonicalCoastalGridLatticeJson(lattice)),
  );
}

function resultCoordinateFields(lattice: CoastalGridLattice) {
  const canonical = canonicalizeCoastalGridLattice(lattice);
  if (canonical.coordinateModel === 'per-grid-node') {
    return {
      coordinateModel: 'per-grid-node' as const,
      longitudeLatitudeDegreesByCell:
        canonical.longitudeLatitudeDegreesByCell!.map(([longitude, latitude]) => [
          longitude,
          latitude,
        ] as [number, number]),
      curvilinearSourceGrid: {
        sourceCrs: canonical.curvilinearSourceGrid!.sourceCrs,
        sourceCenterExtent: {
          ...canonical.curvilinearSourceGrid!.sourceCenterExtent,
        },
        library: 'proj4js' as const,
        interpolation: 'source-affine-linear-inverse-projection' as const,
      },
    };
  }
  return {
    coordinateModel: 'rectilinear-axes' as const,
    ...(canonical.longitudeDegreesByColumn === undefined
      ? {}
      : { longitudeDegreesByColumn: [...canonical.longitudeDegreesByColumn] }),
    ...(canonical.latitudeDegreesByRow === undefined
      ? {}
      : { latitudeDegreesByRow: [...canonical.latitudeDegreesByRow] }),
  };
}

function neighbors(
  index: number,
  width: number,
  height: number,
  includeDiagonals: boolean,
) {
  const row = Math.floor(index / width);
  const column = index % width;
  const result: number[] = [];
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) continue;
      if (!includeDiagonals && rowOffset !== 0 && columnOffset !== 0) continue;
      const neighborRow = row + rowOffset;
      const neighborColumn = column + columnOffset;
      if (
        neighborRow >= 0 &&
        neighborRow < height &&
        neighborColumn >= 0 &&
        neighborColumn < width
      ) {
        result.push(neighborRow * width + neighborColumn);
      }
    }
  }
  return result;
}

export async function reconcileCoastalElevationGrids(
  request: CoastalSeamRequest,
): Promise<CoastalSeamResult> {
  const { land, bathymetry, coastline } = request;
  validateGridStructure('land', land.grid);
  validateGridStructure('bathymetry', bathymetry.grid);
  const landLattice = createCoastalGridLattice(land.grid);
  const bathymetryLattice = createCoastalGridLattice(bathymetry.grid);
  const coastlineLattice = canonicalizeCoastalGridLattice(
    coastline.coordinateLattice,
  );
  const [landCoordinateLatticeSha256, bathymetryCoordinateLatticeSha256, coastlineCoordinateLatticeSha256] =
    await Promise.all([
      hashCoastalGridLattice(landLattice),
      hashCoastalGridLattice(bathymetryLattice),
      hashCoastalGridLattice(coastlineLattice),
    ]);
  if (landCoordinateLatticeSha256 !== bathymetryCoordinateLatticeSha256) {
    throw new Error(
      'Land and bathymetry grids must share an identical coordinate lattice.',
    );
  }
  if (
    coastlineCoordinateLatticeSha256.toLowerCase() !==
    coastline.expectedCoordinateLatticeSha256.toLowerCase()
  ) {
    throw new Error(
      'Coastline coordinate lattice SHA-256 does not match its declared lattice.',
    );
  }
  if (coastlineCoordinateLatticeSha256 !== landCoordinateLatticeSha256) {
    throw new Error(
      'Coastline classification coordinate lattice does not match land and bathymetry grids.',
    );
  }
  requireIsoTimestamp('generatedAt', request.generatedAt);
  requireIsoTimestamp('shorelineEpoch', coastline.shorelineEpoch);

  if (!request.targetVerticalDatum.trim()) {
    throw new Error('targetVerticalDatum is required.');
  }
  if (
    land.grid.verticalDatum !== request.targetVerticalDatum ||
    bathymetry.grid.verticalDatum !== request.targetVerticalDatum
  ) {
    throw new Error(
      'Land and bathymetry grids must already use the declared target vertical datum.',
    );
  }
  if (
    land.grid.width !== bathymetry.grid.width ||
    land.grid.height !== bathymetry.grid.height ||
    !equalBounds(land.grid.bounds, bathymetry.grid.bounds) ||
    land.grid.rowOrder !== bathymetry.grid.rowOrder ||
    land.grid.horizontalCrs !== bathymetry.grid.horizontalCrs
  ) {
    throw new Error(
      'Land and bathymetry grids must share dimensions, bounds, row order, and CRS.',
    );
  }
  if (land.grid.sourceRecord.sourceId === bathymetry.grid.sourceRecord.sourceId) {
    throw new Error('Coastal reconciliation requires distinct land and bathymetry sources.');
  }
  if (
    coastline.width !== land.grid.width ||
    coastline.height !== land.grid.height ||
    !equalBounds(coastline.bounds, land.grid.bounds) ||
    coastline.rowOrder !== land.grid.rowOrder ||
    coastline.horizontalCrs !== land.grid.horizontalCrs
  ) {
    throw new Error(
      'Coastline classification must share the normalized elevation grid lattice.',
    );
  }
  if (
    coastlineLattice.width !== coastline.width ||
    coastlineLattice.height !== coastline.height ||
    !equalBounds(coastlineLattice.bounds, coastline.bounds) ||
    coastlineLattice.rowOrder !== coastline.rowOrder ||
    coastlineLattice.horizontalCrs !== coastline.horizontalCrs
  ) {
    throw new Error(
      'Coastline coordinate lattice metadata must match the classification metadata.',
    );
  }
  if (coastline.classes.length !== coastline.width * coastline.height) {
    throw new Error('Coastline classification length does not match its grid.');
  }
  if (!coastline.adapterVersion.trim()) {
    throw new Error('Coastline adapter version is required.');
  }

  validateSourceDigest(
    'land',
    land.grid.sourceRecord,
    land.sourceSnapshotSha256,
  );
  validateSourceDigest(
    'bathymetry',
    bathymetry.grid.sourceRecord,
    bathymetry.sourceSnapshotSha256,
  );
  validateSourceDigest(
    'coastline',
    coastline.sourceRecord,
    coastline.sourceSnapshotSha256,
  );
  const coastlineLegendPromotion = validateCoastlineLegendPromotion(
    coastline.sourceRecord,
    coastline.sourceSnapshotSha256,
    coastline.legendPromotion,
  );
  if (
    !sourceBindsRelatedArtifactDigest(
      coastline.sourceRecord,
      coastline.expectedCoordinateLatticeSha256,
    )
  ) {
    throw new Error(
      'Coastline coordinate lattice digest is not bound to the promoted source record.',
    );
  }
  const classificationSha256 = await sha256Bytes(coastline.classes);
  if (
    classificationSha256.toLowerCase() !==
    coastline.expectedClassificationSha256.toLowerCase()
  ) {
    throw new Error('Coastline classification SHA-256 does not match its bytes.');
  }

  const countryCode =
    land.grid.countryCode === bathymetry.grid.countryCode
      ? land.grid.countryCode
      : undefined;
  const sourceGates = {
    land: buildSourceGate(
      land.grid.sourceRecord,
      land.grid.bounds,
      countryCode,
      'terrain-mesh',
      request.generatedAt,
    ),
    bathymetry: buildSourceGate(
      bathymetry.grid.sourceRecord,
      land.grid.bounds,
      countryCode,
      'terrain-mesh',
      request.generatedAt,
    ),
    coastline: buildSourceGate(
      coastline.sourceRecord,
      land.grid.bounds,
      countryCode,
      'waterways',
      request.generatedAt,
    ),
  };

  const coastlineElevationMeters = request.coastlineElevationMeters ?? 0;
  const maximumAdjustmentMeters = request.maximumAdjustmentMeters ?? 10;
  if (!Number.isFinite(coastlineElevationMeters)) {
    throw new Error('coastlineElevationMeters must be finite.');
  }
  if (
    !Number.isFinite(maximumAdjustmentMeters) ||
    maximumAdjustmentMeters < 0 ||
    maximumAdjustmentMeters > MAX_COASTLINE_ADJUSTMENT_METERS
  ) {
    throw new Error(
      `maximumAdjustmentMeters must be between 0 and ${MAX_COASTLINE_ADJUSTMENT_METERS}.`,
    );
  }

  let landCellCount = 0;
  let oceanCellCount = 0;
  let breaklineCellCount = 0;
  let maximumLandBreaklineAdjustmentMeters = 0;
  let maximumBathymetryBreaklineAdjustmentMeters = 0;
  const elevationsMeters = new Float64Array(coastline.classes.length);

  for (let index = 0; index < coastline.classes.length; index += 1) {
    const surfaceClass = coastline.classes[index];
    if (
      surfaceClass !== COASTAL_SURFACE_OCEAN &&
      surfaceClass !== COASTAL_SURFACE_BREAKLINE &&
      surfaceClass !== COASTAL_SURFACE_LAND
    ) {
      throw new Error(`Unknown coastline surface class ${surfaceClass} at ${index}.`);
    }
    if (surfaceClass === COASTAL_SURFACE_LAND) {
      landCellCount += 1;
      const elevation = land.grid.elevationsMeters[index];
      if (elevation < coastlineElevationMeters - maximumAdjustmentMeters) {
        throw new Error(`Land elevation is inverted beyond tolerance at ${index}.`);
      }
      elevationsMeters[index] = elevation;
      continue;
    }
    if (surfaceClass === COASTAL_SURFACE_OCEAN) {
      oceanCellCount += 1;
      const elevation = bathymetry.grid.elevationsMeters[index];
      if (elevation > coastlineElevationMeters + maximumAdjustmentMeters) {
        throw new Error(`Bathymetry elevation is inverted beyond tolerance at ${index}.`);
      }
      elevationsMeters[index] = elevation;
      continue;
    }

    breaklineCellCount += 1;
    const landAdjustment = Math.abs(
      land.grid.elevationsMeters[index] - coastlineElevationMeters,
    );
    const bathymetryAdjustment = Math.abs(
      bathymetry.grid.elevationsMeters[index] - coastlineElevationMeters,
    );
    if (
      landAdjustment > maximumAdjustmentMeters ||
      bathymetryAdjustment > maximumAdjustmentMeters
    ) {
      throw new Error(
        `Coastline breakline adjustment exceeds tolerance at ${index}.`,
      );
    }
    maximumLandBreaklineAdjustmentMeters = Math.max(
      maximumLandBreaklineAdjustmentMeters,
      landAdjustment,
    );
    maximumBathymetryBreaklineAdjustmentMeters = Math.max(
      maximumBathymetryBreaklineAdjustmentMeters,
      bathymetryAdjustment,
    );
    elevationsMeters[index] = coastlineElevationMeters;
  }

  if (landCellCount === 0 || oceanCellCount === 0 || breaklineCellCount === 0) {
    throw new Error(
      'A coastal grid must contain land, ocean, and coastline breakline cells.',
    );
  }

  for (let index = 0; index < coastline.classes.length; index += 1) {
    const surfaceClass = coastline.classes[index];
    const adjacentClasses = neighbors(
      index,
      coastline.width,
      coastline.height,
      false,
    ).map(neighbor => coastline.classes[neighbor]);
    if (
      (surfaceClass === COASTAL_SURFACE_LAND &&
        adjacentClasses.includes(COASTAL_SURFACE_OCEAN)) ||
      (surfaceClass === COASTAL_SURFACE_OCEAN &&
        adjacentClasses.includes(COASTAL_SURFACE_LAND))
    ) {
      throw new Error(`Land and ocean touch without a breakline at ${index}.`);
    }
    if (surfaceClass === COASTAL_SURFACE_BREAKLINE) {
      const nearbyClasses = neighbors(
        index,
        coastline.width,
        coastline.height,
        true,
      ).map(neighbor => coastline.classes[neighbor]);
      if (
        !nearbyClasses.includes(COASTAL_SURFACE_LAND) ||
        !nearbyClasses.includes(COASTAL_SURFACE_OCEAN)
      ) {
        throw new Error(
          `Coastline breakline cell ${index} must separate land and ocean.`,
        );
      }
    }
  }

  return {
    seamVersion: TOPOGRAPHIC_COASTAL_SEAM_VERSION,
    grid: {
      gridId: `${land.grid.gridId}-${bathymetry.grid.gridId}-coastal`,
      title: `${land.grid.title} and ${bathymetry.grid.title} coastal seam`,
      bounds: { ...land.grid.bounds },
      width: land.grid.width,
      height: land.grid.height,
      elevationsMeters,
      rowOrder: land.grid.rowOrder,
      horizontalCrs: land.grid.horizontalCrs,
      verticalDatum: request.targetVerticalDatum,
      generatedAt: request.generatedAt,
      countryCode,
      ...resultCoordinateFields(landLattice),
      sourceIds: {
        land: land.grid.sourceRecord.sourceId,
        bathymetry: bathymetry.grid.sourceRecord.sourceId,
        coastline: coastline.sourceRecord.sourceId,
      },
    },
    sourceGates,
    provenance: {
      landSourceId: land.grid.sourceRecord.sourceId,
      landSourceVersion: land.grid.sourceRecord.version,
      landSnapshotSha256: land.sourceSnapshotSha256,
      bathymetrySourceId: bathymetry.grid.sourceRecord.sourceId,
      bathymetrySourceVersion: bathymetry.grid.sourceRecord.version,
      bathymetrySnapshotSha256: bathymetry.sourceSnapshotSha256,
      coastlineSourceId: coastline.sourceRecord.sourceId,
      coastlineSourceVersion: coastline.sourceRecord.version,
      coastlineSnapshotSha256: coastline.sourceSnapshotSha256,
      classificationSha256,
      coordinateLatticeSha256: landCoordinateLatticeSha256,
      coastlineAdapterVersion: coastline.adapterVersion,
      shorelineEpoch: coastline.shorelineEpoch,
      coastlineLegendPromotion,
      targetVerticalDatum: request.targetVerticalDatum,
      sourceTermsUrls: [
        land.grid.sourceRecord.termsUrl,
        bathymetry.grid.sourceRecord.termsUrl,
        coastline.sourceRecord.termsUrl,
      ],
      sourceCorrectionUrls: [
        land.grid.sourceRecord.correctionUrl,
        bathymetry.grid.sourceRecord.correctionUrl,
        coastline.sourceRecord.correctionUrl,
      ],
    },
    metrics: {
      gridCellCount: coastline.classes.length,
      landCellCount,
      oceanCellCount,
      breaklineCellCount,
      maximumLandBreaklineAdjustmentMeters,
      maximumBathymetryBreaklineAdjustmentMeters,
    },
    warnings: [
      'The reconciled grid is non-navigational and does not replace a hydrographic chart.',
      'The result preserves three-source provenance and is not yet a directly exportable TopographicDataset.',
      'Curvilinear coastline reconciliation is allowed only when the classified grid lattice exactly matches the land and bathymetry lattices and its digest is bound to the coastline source record.',
      'Terrain context does not prove an address, entrance, recipient, or delivery point.',
    ],
  };
}
