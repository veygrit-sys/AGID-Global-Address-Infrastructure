import { fromArrayBuffer } from 'geotiff';
import proj4 from 'proj4';

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

export const TOPOGRAPHIC_GEOTIFF_ADAPTER_VERSION =
  'agid-topographic-geotiff-adapter-v0.6';
export const TOPOGRAPHIC_NODATA_RESOLUTION_METHOD =
  'isolated-cardinal-mean-v1';
export const GEOTIFF_AGID_MISSING_MASK_ENCODING =
  'agid-missing-byte-mask-v1';
export const GEOTIFF_GDAL_VALIDITY_MASK_ENCODING =
  'gdal-rfc15-validity-byte-mask-v1';
export const SUPPORTED_GEOTIFF_SOURCE_CRS = [
  'EPSG:4326',
  'EPSG:4269',
  'EPSG:3857',
] as const;
export const WGS84_UTM_MIN_EPSG_ZONE = 1;
export const WGS84_UTM_MAX_EPSG_ZONE = 60;
export const NAD83_UTM_MIN_EPSG_ZONE = 1;
export const NAD83_UTM_MAX_EPSG_ZONE = 23;
export const WGS84_UTM_MIN_EASTING_METERS = 0;
export const WGS84_UTM_MAX_EASTING_METERS = 1_000_000;
export const WGS84_UTM_MIN_NORTHING_METERS = 0;
export const WGS84_UTM_MAX_NORTHING_METERS = 10_000_000;
export const MAX_GEOTIFF_BYTE_LENGTH = 256 * 1024 * 1024;
export const MAX_GEOTIFF_RESOLVED_NODATA_CELLS = 4_096;
export const MAX_GEOTIFF_RESOLVED_NODATA_FRACTION = 0.05;
export const WEB_MERCATOR_MAX_ABSOLUTE_METERS = 20_037_508.342789244;

export type GeoTiffNoDataResolutionPolicy = {
  method: typeof TOPOGRAPHIC_NODATA_RESOLUTION_METHOD;
  encoding?:
    | typeof GEOTIFF_AGID_MISSING_MASK_ENCODING
    | typeof GEOTIFF_GDAL_VALIDITY_MASK_ENCODING;
  qualityMask: Uint8Array;
  expectedMaskSha256: `sha256:${string}`;
  maxResolvedCells: number;
  maxResolvedFraction: number;
  sourceDerivedNoDataMask?: boolean;
};

export type GeoTiffReadWindow = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GeoTiffElevationDecodeRequest = {
  arrayBuffer: ArrayBuffer;
  expectedSha256: `sha256:${string}`;
  gridId: string;
  title: string;
  verticalDatum: string;
  sourceRecord: TopographicSourceRecord;
  generatedAt: string;
  countryCode?: string;
  bandIndex?: number;
  imageIndex?: number;
  window?: GeoTiffReadWindow;
  noDataResolution?: GeoTiffNoDataResolutionPolicy;
  signal?: AbortSignal;
};

export type GeoTiffNoDataResolutionMetadata = {
  method: 'reject' | typeof TOPOGRAPHIC_NODATA_RESOLUTION_METHOD;
  maskEncoding:
    | typeof GEOTIFF_AGID_MISSING_MASK_ENCODING
    | typeof GEOTIFF_GDAL_VALIDITY_MASK_ENCODING
    | null;
  qualityMaskSha256: `sha256:${string}` | null;
  maskOrigin: 'provided' | 'source-nodata-derived' | null;
  resolvedCellCount: number;
  resolvedCellFraction: number;
};

export type SupportedGeoTiffSourceCrs =
  | (typeof SUPPORTED_GEOTIFF_SOURCE_CRS)[number]
  | `EPSG:326${string}`
  | `EPSG:327${string}`
  | `EPSG:269${string}`;

export type GeoTiffCoordinateExtent = {
  minimumX: number;
  minimumY: number;
  maximumX: number;
  maximumY: number;
};

export type GeoTiffCoordinateNormalization = {
  sourceCrs: SupportedGeoTiffSourceCrs;
  targetCrs: 'EPSG:4326';
  library: 'proj4js';
  method: 'identity' | 'geographic-datum-transform' | 'inverse-projection';
  axisOrder: 'x-y-to-longitude-latitude';
};

export type GeoTiffGridCoordinateModel =
  | 'rectilinear-axes'
  | 'curvilinear-per-grid-node';

export type GeoTiffImageLayout = {
  imageIndex: number;
  imageCount: number;
  isReducedResolution: boolean;
  storage: 'tiled' | 'striped';
  blockWidth: number;
  blockHeight: number;
};

export type GeoTiffGeoreferencing = {
  source: 'selected-image' | 'base-image-inherited';
  baseImageIndex: 0;
};

export type GeoTiffElevationMetadata = {
  adapterVersion: string;
  contentSha256: `sha256:${string}`;
  sourceId: string;
  sourceVersion: string;
  sourceLicenseId: string;
  sourceTermsUrl: string;
  sourceCorrectionUrl: string;
  width: number;
  height: number;
  sourceImageWidth: number;
  sourceImageHeight: number;
  imageLayout: GeoTiffImageLayout;
  georeferencing: GeoTiffGeoreferencing;
  readWindow: GeoTiffReadWindow;
  samplesPerPixel: number;
  selectedBandIndex: number;
  pixelInterpretation: 'area' | 'point';
  sourceBoundingBox: GeoTiffCoordinateExtent;
  normalizedBoundingBox: TopographicBounds;
  resolution: [number, number];
  noDataValue: number | null;
  noDataResolution: GeoTiffNoDataResolutionMetadata;
  sourceHorizontalCrs: SupportedGeoTiffSourceCrs;
  horizontalCrs: 'EPSG:4326';
  gridCoordinateModel: GeoTiffGridCoordinateModel;
  coordinateNormalization: GeoTiffCoordinateNormalization;
  verticalDatum: string;
};

export type GeoTiffElevationDecodeResult = {
  grid: NormalizedElevationGrid;
  sourceGate: TopographicExportPlan;
  metadata: GeoTiffElevationMetadata;
  warnings: string[];
};

function requireIsoTimestamp(field: string, value: string) {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`${field} must be an ISO timestamp.`);
  }
}

async function sha256ArrayBuffer(arrayBuffer: ArrayBuffer) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', arrayBuffer);
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

async function sha256Bytes(bytes: Uint8Array) {
  const digestBytes = Uint8Array.from(bytes);
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    digestBytes.buffer,
  );
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

function asCoordinateExtent(
  values: number[],
  field: string,
): GeoTiffCoordinateExtent {
  if (values.length < 4 || values.slice(0, 4).some(value => !Number.isFinite(value))) {
    throw new Error(`${field} must contain four finite coordinates.`);
  }
  const [minimumX, minimumY, maximumX, maximumY] = values;
  if (minimumX >= maximumX || minimumY >= maximumY) {
    throw new Error(`${field} must have increasing X and Y coordinates.`);
  }
  return { minimumX, minimumY, maximumX, maximumY };
}

function asWgs84Bounds(
  values: number[],
  field: string,
): TopographicBounds {
  const extent = asCoordinateExtent(values, field);
  if (
    extent.minimumX < -180 ||
    extent.maximumX > 180 ||
    extent.minimumY < -90 ||
    extent.maximumY > 90
  ) {
    throw new Error(`${field} must be a non-antimeridian EPSG:4326 extent.`);
  }
  return {
    west: extent.minimumX,
    south: extent.minimumY,
    east: extent.maximumX,
    north: extent.maximumY,
  };
}

function adjustAreaPixelsToCenters(
  sourceBounds: GeoTiffCoordinateExtent,
  resolutionX: number,
  resolutionY: number,
  width: number,
  height: number,
) {
  if (width < 2 || height < 2) {
    throw new Error('GeoTIFF elevation grids must be at least 2x2.');
  }
  const halfX = Math.abs(resolutionX) / 2;
  const halfY = Math.abs(resolutionY) / 2;
  return asCoordinateExtent(
    [
      sourceBounds.minimumX + halfX,
      sourceBounds.minimumY + halfY,
      sourceBounds.maximumX - halfX,
      sourceBounds.maximumY - halfY,
    ],
    'Pixel-centre bounds',
  );
}

function resolveReadWindow(
  window: GeoTiffReadWindow | undefined,
  sourceImageWidth: number,
  sourceImageHeight: number,
) {
  const resolved = window ?? {
    x: 0,
    y: 0,
    width: sourceImageWidth,
    height: sourceImageHeight,
  };
  if (
    !Number.isInteger(resolved.x)
    || !Number.isInteger(resolved.y)
    || !Number.isInteger(resolved.width)
    || !Number.isInteger(resolved.height)
    || resolved.x < 0
    || resolved.y < 0
    || resolved.width < 2
    || resolved.height < 2
    || resolved.x + resolved.width > sourceImageWidth
    || resolved.y + resolved.height > sourceImageHeight
  ) {
    throw new Error('GeoTIFF read window must be an in-image integer rectangle of at least 2x2 cells.');
  }
  if (resolved.width * resolved.height > MAX_ELEVATION_GRID_CELLS) {
    throw new Error(
      `GeoTIFF read window exceeds ${MAX_ELEVATION_GRID_CELLS} cells.`,
    );
  }
  return { ...resolved };
}

function resolveImageIndex(imageIndex: number | undefined, imageCount: number) {
  const resolved = imageIndex ?? 0;
  if (
    !Number.isInteger(imageCount)
    || imageCount < 1
    || !Number.isInteger(resolved)
    || resolved < 0
    || resolved >= imageCount
  ) {
    throw new Error(
      `GeoTIFF imageIndex must be an integer between 0 and ${Math.max(0, imageCount - 1)}.`,
    );
  }
  return resolved;
}

function readImageLayout(input: {
  imageIndex: number;
  imageCount: number;
  isTiled: boolean;
  blockWidth: number;
  blockHeight: number;
  newSubfileType: unknown;
}): GeoTiffImageLayout {
  if (
    !Number.isInteger(input.blockWidth)
    || !Number.isInteger(input.blockHeight)
    || input.blockWidth < 1
    || input.blockHeight < 1
  ) {
    throw new Error('GeoTIFF selected image has an invalid tile or strip block size.');
  }
  const newSubfileType = input.newSubfileType === undefined
    ? 0
    : Number(input.newSubfileType);
  if (!Number.isInteger(newSubfileType) || newSubfileType < 0) {
    throw new Error('GeoTIFF selected image has an invalid NewSubfileType tag.');
  }
  return {
    imageIndex: input.imageIndex,
    imageCount: input.imageCount,
    isReducedResolution: (newSubfileType & 1) === 1,
    storage: input.isTiled ? 'tiled' : 'striped',
    blockWidth: input.blockWidth,
    blockHeight: input.blockHeight,
  };
}

function hasAffineGeoreferencing(image: {
  getFileDirectory(): {
    hasTag(name: string): boolean;
  };
}) {
  const directory = image.getFileDirectory();
  return directory.hasTag('ModelTransformation')
    || (
      directory.hasTag('ModelPixelScale')
      && directory.hasTag('ModelTiepoint')
    );
}

function windowBoundingBox(input: {
  sourceBoundingBox: GeoTiffCoordinateExtent;
  resolutionX: number;
  resolutionY: number;
  window: GeoTiffReadWindow;
}) {
  const minimumX = input.sourceBoundingBox.minimumX
    + input.window.x * input.resolutionX;
  const maximumX = minimumX + input.window.width * input.resolutionX;
  const maximumY = input.sourceBoundingBox.maximumY
    + input.window.y * input.resolutionY;
  const minimumY = maximumY + input.window.height * input.resolutionY;
  return asCoordinateExtent(
    [minimumX, minimumY, maximumX, maximumY],
    'GeoTIFF read-window bounding box',
  );
}

function parseWgs84UtmSourceCrs(value: string) {
  const match = /^EPSG:(326|327)(\d{2})$/.exec(value);
  if (!match) return null;
  const zone = Number(match[2]);
  if (zone < WGS84_UTM_MIN_EPSG_ZONE || zone > WGS84_UTM_MAX_EPSG_ZONE) {
    return null;
  }
  return {
    zone,
    hemisphere: match[1] === '326' ? 'north' : 'south',
    datum: 'WGS84',
  } as const;
}

function parseNad83UtmSourceCrs(value: string) {
  const match = /^EPSG:269(\d{2})$/.exec(value);
  if (!match) return null;
  const zone = Number(match[1]);
  if (zone < NAD83_UTM_MIN_EPSG_ZONE || zone > NAD83_UTM_MAX_EPSG_ZONE) {
    return null;
  }
  return {
    zone,
    hemisphere: 'north',
    datum: 'NAD83',
  } as const;
}

function parseUtmSourceCrs(value: string) {
  return parseWgs84UtmSourceCrs(value) ?? parseNad83UtmSourceCrs(value);
}

export function isSupportedGeoTiffSourceCrs(value: string): value is SupportedGeoTiffSourceCrs {
  return SUPPORTED_GEOTIFF_SOURCE_CRS.includes(
    value as (typeof SUPPORTED_GEOTIFF_SOURCE_CRS)[number],
  ) || parseUtmSourceCrs(value) !== null;
}

function readSourceCrs(geoKeys: Record<string, unknown> | null | undefined) {
  const modelType = Number(geoKeys?.GTModelTypeGeoKey);
  const geographicCode = Number(
    geoKeys?.GeodeticCRSGeoKey ?? geoKeys?.GeographicTypeGeoKey,
  );
  if (modelType === 2 && geographicCode === 4326) {
    return 'EPSG:4326' as const;
  }
  if (modelType === 2 && geographicCode === 4269) {
    return 'EPSG:4269' as const;
  }
  const projectedCode = Number(
    geoKeys?.ProjectedCRSGeoKey ?? geoKeys?.ProjectedCSTypeGeoKey,
  );
  if (modelType === 1) {
    const projectedCrs = `EPSG:${projectedCode}`;
    if (isSupportedGeoTiffSourceCrs(projectedCrs)) {
      return projectedCrs;
    }
  }
  const declaredCode = modelType === 1 ? projectedCode : geographicCode;
  throw new Error(
    `GeoTIFF source CRS is unsupported (model ${modelType || 'unknown'}, EPSG:${declaredCode || 'unknown'}); supported source CRSs are ${SUPPORTED_GEOTIFF_SOURCE_CRS.join(', ')}, WGS 84 UTM EPSG:32601-32660 and EPSG:32701-32760, or NAD83 UTM EPSG:26901-26923.`,
  );
}

function sourceToWgs84Transform(sourceCrs: SupportedGeoTiffSourceCrs) {
  const utm = parseUtmSourceCrs(sourceCrs);
  if (utm) {
    const definition = [
      '+proj=utm',
      `+zone=${utm.zone}`,
      utm.hemisphere === 'south' ? '+south' : '',
      `+datum=${utm.datum}`,
      '+units=m',
      '+no_defs',
    ].filter(Boolean).join(' ');
    return proj4(definition, 'EPSG:4326');
  }
  return proj4(sourceCrs, 'EPSG:4326');
}

function sourceCoordinateAt(input: {
  sourceCenterExtent: GeoTiffCoordinateExtent;
  width: number;
  height: number;
  row: number;
  column: number;
}) {
  const sourceX = input.sourceCenterExtent.minimumX
    + (input.sourceCenterExtent.maximumX - input.sourceCenterExtent.minimumX)
      * (input.column / (input.width - 1));
  const sourceY = input.sourceCenterExtent.maximumY
    - (input.sourceCenterExtent.maximumY - input.sourceCenterExtent.minimumY)
      * (input.row / (input.height - 1));
  return [sourceX, sourceY] as const;
}

function coordinateMapping(input: {
  sourceCrs: SupportedGeoTiffSourceCrs;
  sourceCenterExtent: GeoTiffCoordinateExtent;
  width: number;
  height: number;
}) {
  if (
    input.sourceCrs === 'EPSG:3857'
    && (
      Math.abs(input.sourceCenterExtent.minimumX) > WEB_MERCATOR_MAX_ABSOLUTE_METERS
      || Math.abs(input.sourceCenterExtent.maximumX) > WEB_MERCATOR_MAX_ABSOLUTE_METERS
      || Math.abs(input.sourceCenterExtent.minimumY) > WEB_MERCATOR_MAX_ABSOLUTE_METERS
      || Math.abs(input.sourceCenterExtent.maximumY) > WEB_MERCATOR_MAX_ABSOLUTE_METERS
    )
  ) {
    throw new Error('EPSG:3857 pixel centres exceed the supported Web Mercator world extent.');
  }
  const utm = parseUtmSourceCrs(input.sourceCrs);
  if (
    utm
    && (
      input.sourceCenterExtent.minimumX < WGS84_UTM_MIN_EASTING_METERS
      || input.sourceCenterExtent.maximumX > WGS84_UTM_MAX_EASTING_METERS
      || input.sourceCenterExtent.minimumY < WGS84_UTM_MIN_NORTHING_METERS
      || input.sourceCenterExtent.maximumY > WGS84_UTM_MAX_NORTHING_METERS
    )
  ) {
    throw new Error(`${utm.datum} UTM pixel centres exceed the supported easting or northing extent.`);
  }
  const transform = sourceToWgs84Transform(input.sourceCrs);
  if (utm) {
    const longitudeLatitudeDegreesByCell: Array<readonly [number, number]> = [];
    let west = Number.POSITIVE_INFINITY;
    let east = Number.NEGATIVE_INFINITY;
    let south = Number.POSITIVE_INFINITY;
    let north = Number.NEGATIVE_INFINITY;
    for (let row = 0; row < input.height; row += 1) {
      for (let column = 0; column < input.width; column += 1) {
        const [sourceX, sourceY] = sourceCoordinateAt({ ...input, row, column });
        const projected = transform.forward([sourceX, sourceY]);
        const longitude = Number(projected[0]);
        const latitude = Number(projected[1]);
        if (
          !Number.isFinite(longitude)
          || !Number.isFinite(latitude)
          || longitude < -180
          || longitude > 180
          || latitude < -90
          || latitude > 90
        ) {
          throw new Error(`${utm.datum} UTM inverse projection produced an invalid coordinate at row ${row}, column ${column}.`);
        }
        west = Math.min(west, longitude);
        east = Math.max(east, longitude);
        south = Math.min(south, latitude);
        north = Math.max(north, latitude);
        longitudeLatitudeDegreesByCell.push([longitude, latitude]);
      }
    }
    return {
      coordinateModel: 'curvilinear-per-grid-node' as const,
      longitudeLatitudeDegreesByCell,
      normalizedBoundingBox: asWgs84Bounds(
        [west, south, east, north],
        `Normalized ${utm.datum} UTM GeoTIFF bounding box`,
      ),
      coordinateNormalization: {
        sourceCrs: input.sourceCrs,
        targetCrs: 'EPSG:4326',
        library: 'proj4js',
        method: 'inverse-projection',
        axisOrder: 'x-y-to-longitude-latitude',
      } satisfies GeoTiffCoordinateNormalization,
    };
  }
  const longitudeDegreesByColumn = Array.from(
    { length: input.width },
    (_, column) => {
      const [sourceX] = sourceCoordinateAt({ ...input, row: 0, column });
      return Number(transform.forward([sourceX, 0])[0]);
    },
  );
  const latitudeDegreesByRow = Array.from(
    { length: input.height },
    (_, row) => {
      const [, sourceY] = sourceCoordinateAt({ ...input, row, column: 0 });
      return Number(transform.forward([0, sourceY])[1]);
    },
  );
  const normalizedBoundingBox = asWgs84Bounds(
    [
      longitudeDegreesByColumn[0],
      latitudeDegreesByRow.at(-1)!,
      longitudeDegreesByColumn.at(-1)!,
      latitudeDegreesByRow[0],
    ],
    'Normalized GeoTIFF bounding box',
  );
  return {
    coordinateModel: 'rectilinear-axes' as const,
    longitudeDegreesByColumn,
    latitudeDegreesByRow,
    normalizedBoundingBox,
    coordinateNormalization: {
      sourceCrs: input.sourceCrs,
      targetCrs: 'EPSG:4326',
      library: 'proj4js',
      method: input.sourceCrs === 'EPSG:4326'
        ? 'identity'
        : input.sourceCrs === 'EPSG:4269'
          ? 'geographic-datum-transform'
          : 'inverse-projection',
      axisOrder: 'x-y-to-longitude-latitude',
    } satisfies GeoTiffCoordinateNormalization,
  };
}

function verifyRequest(request: GeoTiffElevationDecodeRequest) {
  if (!request.gridId.trim()) throw new Error('gridId is required.');
  if (!request.title.trim()) throw new Error('title is required.');
  if (!request.verticalDatum.trim()) throw new Error('verticalDatum is required.');
  if (
    request.arrayBuffer.byteLength < 8 ||
    request.arrayBuffer.byteLength > MAX_GEOTIFF_BYTE_LENGTH
  ) {
    throw new Error(
      `GeoTIFF byte length must be between 8 and ${MAX_GEOTIFF_BYTE_LENGTH}.`,
    );
  }
  if (!/^sha256:[a-f0-9]{64}$/i.test(request.expectedSha256)) {
    throw new Error('expectedSha256 must be a sha256 content digest.');
  }
  if (request.sourceRecord.reuseStatus !== 'approved') {
    throw new Error('GeoTIFF source reuse must be approved.');
  }
  if (!request.sourceRecord.layerIds.includes('terrain-mesh')) {
    throw new Error('GeoTIFF source must be approved for terrain-mesh.');
  }
  if (
    !topographicSourceBindsDigest(request.sourceRecord, request.expectedSha256)
  ) {
    throw new Error('GeoTIFF digest is not bound to the source promotion record.');
  }
  requireIsoTimestamp('generatedAt', request.generatedAt);
}

function cardinalNeighborIndexes(
  index: number,
  width: number,
  height: number,
) {
  const row = Math.floor(index / width);
  const column = index % width;
  return {
    left: column > 0 ? index - 1 : null,
    right: column + 1 < width ? index + 1 : null,
    up: row > 0 ? index - width : null,
    down: row + 1 < height ? index + width : null,
  };
}

async function resolveNoDataCells(input: {
  elevationsMeters: Float64Array;
  noDataIndexes: number[];
  width: number;
  height: number;
  policy: GeoTiffNoDataResolutionPolicy | undefined;
  sourceRecord: TopographicSourceRecord;
}): Promise<GeoTiffNoDataResolutionMetadata> {
  if (!input.noDataIndexes.length) {
    if (input.policy) {
      throw new Error(
        'GeoTIFF quality mask was provided but the selected band has no NoData cells.',
      );
    }
    return {
      method: 'reject',
      maskEncoding: null,
      qualityMaskSha256: null,
      maskOrigin: null,
      resolvedCellCount: 0,
      resolvedCellFraction: 0,
    };
  }
  const policy = input.policy;
  if (!policy) {
    throw new Error(
      `GeoTIFF contains unresolved NoData at index ${input.noDataIndexes[0]}; apply a quality-mask adapter first.`,
    );
  }
  if (policy.method !== TOPOGRAPHIC_NODATA_RESOLUTION_METHOD) {
    throw new Error('GeoTIFF NoData resolution method is unsupported.');
  }
  const maskEncoding =
    policy.encoding ?? GEOTIFF_AGID_MISSING_MASK_ENCODING;
  if (
    maskEncoding !== GEOTIFF_AGID_MISSING_MASK_ENCODING
    && maskEncoding !== GEOTIFF_GDAL_VALIDITY_MASK_ENCODING
  ) {
    throw new Error('GeoTIFF quality mask encoding is unsupported.');
  }
  if (policy.qualityMask.length !== input.elevationsMeters.length) {
    throw new Error('GeoTIFF quality mask length must match the elevation grid.');
  }
  if (!/^sha256:[a-f0-9]{64}$/i.test(policy.expectedMaskSha256)) {
    throw new Error('expectedMaskSha256 must be a sha256 content digest.');
  }
  const qualityMaskSha256 = await sha256Bytes(policy.qualityMask);
  if (qualityMaskSha256.toLowerCase() !== policy.expectedMaskSha256.toLowerCase()) {
    throw new Error(
      `GeoTIFF quality mask digest mismatch: expected ${policy.expectedMaskSha256}, received ${qualityMaskSha256}.`,
    );
  }
  const sourceDerivedNoDataMask = policy.sourceDerivedNoDataMask === true;
  if (
    !sourceDerivedNoDataMask
    && !topographicSourceBindsDigest(input.sourceRecord, qualityMaskSha256)
  ) {
    throw new Error(
      'GeoTIFF quality mask digest is not bound to the source promotion record.',
    );
  }
  if (
    !Number.isSafeInteger(policy.maxResolvedCells)
    || policy.maxResolvedCells < 1
    || policy.maxResolvedCells > MAX_GEOTIFF_RESOLVED_NODATA_CELLS
  ) {
    throw new Error(
      `maxResolvedCells must be between 1 and ${MAX_GEOTIFF_RESOLVED_NODATA_CELLS}.`,
    );
  }
  if (
    !Number.isFinite(policy.maxResolvedFraction)
    || policy.maxResolvedFraction <= 0
    || policy.maxResolvedFraction > MAX_GEOTIFF_RESOLVED_NODATA_FRACTION
  ) {
    throw new Error(
      `maxResolvedFraction must be greater than 0 and at most ${MAX_GEOTIFF_RESOLVED_NODATA_FRACTION}.`,
    );
  }

  const noDataSet = new Set(input.noDataIndexes);
  for (let index = 0; index < policy.qualityMask.length; index += 1) {
    const maskValue = policy.qualityMask[index];
    const missing = noDataSet.has(index);
    const expectedMaskValue =
      maskEncoding === GEOTIFF_GDAL_VALIDITY_MASK_ENCODING
        ? (missing ? 0 : 255)
        : (missing ? 1 : 0);
    if (maskValue !== expectedMaskValue) {
      throw new Error(
        `GeoTIFF ${maskEncoding} and NoData cells disagree at index ${index}; expected ${expectedMaskValue}, received ${maskValue}.`,
      );
    }
  }

  const resolvedCellFraction =
    input.noDataIndexes.length / input.elevationsMeters.length;
  if (
    input.noDataIndexes.length > policy.maxResolvedCells
    || resolvedCellFraction > policy.maxResolvedFraction
  ) {
    throw new Error(
      `GeoTIFF NoData exceeds the approved resolution budget (${input.noDataIndexes.length} cells, ${resolvedCellFraction}).`,
    );
  }

  const original = input.elevationsMeters.slice();
  for (const index of input.noDataIndexes) {
    const neighbors = cardinalNeighborIndexes(
      index,
      input.width,
      input.height,
    );
    const horizontalPair =
      neighbors.left !== null
      && neighbors.right !== null
      && Number.isFinite(original[neighbors.left])
      && Number.isFinite(original[neighbors.right]);
    const verticalPair =
      neighbors.up !== null
      && neighbors.down !== null
      && Number.isFinite(original[neighbors.up])
      && Number.isFinite(original[neighbors.down]);
    if (!horizontalPair && !verticalPair) {
      throw new Error(
        `GeoTIFF NoData at index ${index} is not an isolated cell with an observed opposing neighbor pair.`,
      );
    }
    const observed = [
      neighbors.left,
      neighbors.right,
      neighbors.up,
      neighbors.down,
    ]
      .filter((neighbor): neighbor is number =>
        neighbor !== null && Number.isFinite(original[neighbor]))
      .map(neighbor => original[neighbor]);
    input.elevationsMeters[index] =
      observed.reduce((sum, value) => sum + value, 0) / observed.length;
  }

  return {
    method: policy.method,
    maskEncoding,
    qualityMaskSha256,
    maskOrigin: sourceDerivedNoDataMask ? 'source-nodata-derived' : 'provided',
    resolvedCellCount: input.noDataIndexes.length,
    resolvedCellFraction,
  };
}

export async function decodeGeoTiffElevationGrid(
  request: GeoTiffElevationDecodeRequest,
): Promise<GeoTiffElevationDecodeResult> {
  verifyRequest(request);
  const contentSha256 = await sha256ArrayBuffer(request.arrayBuffer);
  if (contentSha256.toLowerCase() !== request.expectedSha256.toLowerCase()) {
    throw new Error(
      `GeoTIFF digest mismatch: expected ${request.expectedSha256}, received ${contentSha256}.`,
    );
  }

  let geotiff;
  try {
    geotiff = await fromArrayBuffer(request.arrayBuffer, request.signal);
  } catch (error) {
    throw new Error(
      `GeoTIFF parse failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const imageCount = await geotiff.getImageCount();
  const imageIndex = resolveImageIndex(request.imageIndex, imageCount);
  const image = await geotiff.getImage(imageIndex);
  const baseImage = imageIndex === 0 ? image : await geotiff.getImage(0);
  const imageLayout = readImageLayout({
    imageIndex,
    imageCount,
    isTiled: image.isTiled,
    blockWidth: image.getBlockWidth(),
    blockHeight: image.getBlockHeight(0),
    newSubfileType: image.getFileDirectory().getValue('NewSubfileType'),
  });
  const selectedHasAffineGeoreferencing = hasAffineGeoreferencing(image);
  const georeferencing: GeoTiffGeoreferencing = selectedHasAffineGeoreferencing
    ? { source: 'selected-image', baseImageIndex: 0 }
    : { source: 'base-image-inherited', baseImageIndex: 0 };
  if (!selectedHasAffineGeoreferencing && !imageLayout.isReducedResolution) {
    throw new Error(
      'GeoTIFF selected image lacks affine georeferencing and is not a reduced-resolution subfile.',
    );
  }
  if (!selectedHasAffineGeoreferencing && !hasAffineGeoreferencing(baseImage)) {
    throw new Error('GeoTIFF base image lacks affine georeferencing required by the selected overview.');
  }
  const sourceImageWidth = image.getWidth();
  const sourceImageHeight = image.getHeight();
  if (
    !Number.isInteger(sourceImageWidth)
    || !Number.isInteger(sourceImageHeight)
    || sourceImageWidth < 2
    || sourceImageHeight < 2
  ) {
    throw new Error('GeoTIFF elevation image must be at least 2x2.');
  }
  const readWindow = resolveReadWindow(
    request.window,
    sourceImageWidth,
    sourceImageHeight,
  );
  const { width, height } = readWindow;
  const georeferencingImage = georeferencing.source === 'selected-image'
    ? image
    : baseImage;
  if (georeferencingImage.getFileDirectory().hasTag('ModelTransformation')) {
    throw new Error('Rotated or transformed GeoTIFF grids require a reprojection adapter.');
  }

  const geoKeys = georeferencingImage.getGeoKeys();
  const sourceHorizontalCrs = readSourceCrs(
    geoKeys as Record<string, unknown> | null | undefined,
  );
  if (
    request.sourceRecord.snapshotEvidence?.horizontalCrs
    !== sourceHorizontalCrs
  ) {
    throw new Error(
      `GeoTIFF source CRS ${sourceHorizontalCrs} does not match snapshot evidence ${request.sourceRecord.snapshotEvidence?.horizontalCrs ?? 'missing'}.`,
    );
  }
  const samplesPerPixel = image.getSamplesPerPixel();
  const selectedBandIndex = request.bandIndex ?? 0;
  if (
    !Number.isInteger(selectedBandIndex) ||
    selectedBandIndex < 0 ||
    selectedBandIndex >= samplesPerPixel
  ) {
    throw new Error(
      `GeoTIFF bandIndex must be between 0 and ${samplesPerPixel - 1}.`,
    );
  }

  const inheritedFullSourceBoundingBox = georeferencing.source === 'base-image-inherited'
    ? asCoordinateExtent(
      baseImage.getBoundingBox(),
      'GeoTIFF base-image bounding box',
    )
    : null;
  const resolution = georeferencing.source === 'selected-image'
    ? image.getResolution()
    : [
      (inheritedFullSourceBoundingBox!.maximumX - inheritedFullSourceBoundingBox!.minimumX)
        / sourceImageWidth,
      -(
        inheritedFullSourceBoundingBox!.maximumY - inheritedFullSourceBoundingBox!.minimumY
      ) / sourceImageHeight,
      0,
    ];
  const resolutionX = Number(resolution[0]);
  const resolutionY = Number(resolution[1]);
  if (
    !Number.isFinite(resolutionX) ||
    !Number.isFinite(resolutionY) ||
    resolutionX <= 0 ||
    resolutionY >= 0
  ) {
    throw new Error('GeoTIFF v0.1 input must be an unrotated north-up grid.');
  }
  const fullSourceBoundingBox = inheritedFullSourceBoundingBox
    ?? asCoordinateExtent(image.getBoundingBox(), 'GeoTIFF bounding box');
  const pixelInterpretation = georeferencingImage.pixelIsArea() ? 'area' : 'point';
  const sourceBoundingBox = windowBoundingBox({
    sourceBoundingBox: fullSourceBoundingBox,
    resolutionX,
    resolutionY,
    window: readWindow,
  });
  const sourceCenterExtent =
    pixelInterpretation === 'area'
      ? adjustAreaPixelsToCenters(
          sourceBoundingBox,
          resolutionX,
          resolutionY,
          width,
          height,
        )
      : sourceBoundingBox;
  const coordinateMappingResult = coordinateMapping({
    sourceCrs: sourceHorizontalCrs,
    sourceCenterExtent,
    width,
    height,
  });
  const {
    longitudeDegreesByColumn,
    latitudeDegreesByRow,
    normalizedBoundingBox,
    coordinateNormalization,
  } = coordinateMappingResult;
  const noDataValue = image.getGDALNoData();
  const rasters = await image.readRasters({
    samples: [selectedBandIndex],
    interleave: true,
    window: [
      readWindow.x,
      readWindow.y,
      readWindow.x + readWindow.width,
      readWindow.y + readWindow.height,
    ],
    signal: request.signal,
  });
  const elevationsMeters = new Float64Array(width * height);
  const noDataIndexes: number[] = [];
  for (let index = 0; index < elevationsMeters.length; index += 1) {
    const elevation = Number(rasters[index]);
    if (noDataValue !== null && elevation === noDataValue) {
      elevationsMeters[index] = Number.NaN;
      noDataIndexes.push(index);
      continue;
    }
    if (!Number.isFinite(elevation)) {
      throw new Error(`GeoTIFF contains a non-finite elevation at index ${index}.`);
    }
    elevationsMeters[index] = elevation;
  }
  const sourceDerivedQualityMask = request.noDataResolution?.sourceDerivedNoDataMask
    ? Uint8Array.from(
      elevationsMeters,
      elevation => Number.isFinite(elevation) ? 255 : 0,
    )
    : null;
  if (
    sourceDerivedQualityMask
    && request.noDataResolution?.encoding
    && request.noDataResolution.encoding !== GEOTIFF_GDAL_VALIDITY_MASK_ENCODING
  ) {
    throw new Error('Source-derived GeoTIFF NoData masks must use GDAL RFC 15 validity encoding.');
  }
  const noDataResolutionPolicy: GeoTiffNoDataResolutionPolicy | undefined = sourceDerivedQualityMask
    ? {
      ...request.noDataResolution!,
      encoding: GEOTIFF_GDAL_VALIDITY_MASK_ENCODING as typeof GEOTIFF_GDAL_VALIDITY_MASK_ENCODING,
      qualityMask: sourceDerivedQualityMask,
      expectedMaskSha256: await sha256Bytes(sourceDerivedQualityMask),
    }
    : request.noDataResolution;
  const noDataResolution = await resolveNoDataCells({
    elevationsMeters,
    noDataIndexes,
    width,
    height,
    policy: noDataResolutionPolicy,
    sourceRecord: request.sourceRecord,
  });

  const sourceGate = buildTopographicExportPlan({
    bounds: normalizedBoundingBox,
    countryCode: request.countryCode,
    crs: 'EPSG:4326',
    format: 'tiff',
    layerIds: ['terrain-mesh'],
    sourceRecords: [request.sourceRecord],
    dataMode: request.sourceRecord.syntheticOnly ? 'synthetic' : 'source-backed',
    now: request.generatedAt,
  });
  if (sourceGate.status !== 'ready') {
    throw new Error(
      `GeoTIFF source gate blocked: ${sourceGate.issues
        .map(issue => `${issue.code}: ${issue.message}`)
        .join('; ')}`,
    );
  }

  const grid: NormalizedElevationGrid = {
    gridId: request.gridId,
    title: request.title,
    bounds: normalizedBoundingBox,
    width,
    height,
    elevationsMeters,
    rowOrder: 'north-to-south',
    horizontalCrs: 'EPSG:4326',
    coordinateModel: coordinateMappingResult.coordinateModel === 'curvilinear-per-grid-node'
      ? 'per-grid-node'
      : 'rectilinear-axes',
    ...(coordinateMappingResult.coordinateModel === 'curvilinear-per-grid-node'
      ? {
          longitudeLatitudeDegreesByCell:
            coordinateMappingResult.longitudeLatitudeDegreesByCell,
          curvilinearSourceGrid: {
            sourceCrs: sourceHorizontalCrs,
            sourceCenterExtent,
            library: 'proj4js' as const,
            interpolation: 'source-affine-linear-inverse-projection' as const,
          },
        }
      : {
          longitudeDegreesByColumn,
          latitudeDegreesByRow,
        }),
    verticalDatum: request.verticalDatum,
    sourceRecord: request.sourceRecord,
    generatedAt: request.generatedAt,
    countryCode: request.countryCode,
  };

  return {
    grid,
    sourceGate,
    metadata: {
      adapterVersion: TOPOGRAPHIC_GEOTIFF_ADAPTER_VERSION,
      contentSha256,
      sourceId: request.sourceRecord.sourceId,
      sourceVersion: request.sourceRecord.version,
      sourceLicenseId: request.sourceRecord.licenseId,
      sourceTermsUrl: request.sourceRecord.termsUrl,
      sourceCorrectionUrl: request.sourceRecord.correctionUrl,
      width,
      height,
      sourceImageWidth,
      sourceImageHeight,
      imageLayout,
      georeferencing,
      readWindow,
      samplesPerPixel,
      selectedBandIndex,
      pixelInterpretation,
      sourceBoundingBox,
      normalizedBoundingBox,
      resolution: [resolutionX, resolutionY],
      noDataValue,
      noDataResolution,
      sourceHorizontalCrs,
      horizontalCrs: 'EPSG:4326',
      gridCoordinateModel: coordinateMappingResult.coordinateModel,
      coordinateNormalization,
      verticalDatum: request.verticalDatum,
    },
    warnings: [
      'The adapter reads caller-provided bytes only and performs no network request.',
      imageLayout.isReducedResolution
        ? `The selected image IFD ${imageLayout.imageIndex} is a reduced-resolution subfile; no additional resampling was applied.`
        : `The selected image IFD ${imageLayout.imageIndex} is not a reduced-resolution subfile.`,
      georeferencing.source === 'base-image-inherited'
        ? 'The selected reduced-resolution IFD inherited affine georeferencing from IFD 0 as defined by the COG overview model.'
        : 'The selected image IFD supplied its own affine georeferencing.',
      coordinateMappingResult.coordinateModel === 'curvilinear-per-grid-node'
        ? `${sourceHorizontalCrs} projected UTM coordinates were inverse-projected at every grid node; this exact curvilinear lattice is eligible for terrain-mesh output only.`
        : 'The normalized elevation grid uses rectilinear WGS84 coordinate axes.',
      noDataResolution.resolvedCellCount
        ? `${noDataResolution.resolvedCellCount} isolated NoData cells were resolved with a source-bound quality mask; the output contains derived elevations.`
        : 'NoData interpolation was not required.',
      sourceHorizontalCrs === 'EPSG:4326'
        ? 'Source coordinates already use EPSG:4326; coordinate normalization was identity-only.'
        : sourceHorizontalCrs === 'EPSG:4269'
          ? 'NAD83 geographic coordinates were normalized from EPSG:4269 to EPSG:4326 with the bundled Proj4js definition; this is not a survey-grade horizontal datum accuracy claim.'
          : `Source coordinates were transformed from ${sourceHorizontalCrs} to EPSG:4326 with Proj4js before vectorization.`,
      'Decoded elevation does not prove an address, entrance, recipient, or delivery point.',
    ],
  };
}
