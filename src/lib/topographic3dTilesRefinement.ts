import type {
  LocalGeoTiffMeshLodManifest,
} from './topographicLocalGeoTiffWorkflow';

export const TOPOGRAPHIC_3D_TILES_REFINEMENT_VERSION =
  'agid-topographic-3d-tiles-refinement-v0.1';

export const TOPOGRAPHIC_3D_TILES_REFERENCE_SSE_PROFILE = {
  viewportHeightPixels: 1080,
  verticalFieldOfViewDegrees: 60,
  pixelRatio: 1,
  maximumScreenSpaceErrorPixels: 16,
} as const;

const ERROR_TOLERANCE_METERS = 1e-9;
const ROUNDING_SCALE = 1_000_000_000;

export type TopographicPerspectiveScreenSpaceErrorInput = {
  geometricErrorMeters: number;
  distanceToTileMeters: number;
  viewportHeightPixels: number;
  verticalFieldOfViewDegrees: number;
  pixelRatio: number;
};

export type TopographicPerspectiveRefinementDistanceInput = Omit<
  TopographicPerspectiveScreenSpaceErrorInput,
  'distanceToTileMeters'
> & {
  maximumScreenSpaceErrorPixels: number;
};

export type Topographic3dTilesRefinementContract = {
  version: typeof TOPOGRAPHIC_3D_TILES_REFINEMENT_VERSION;
  mode: 'REPLACE';
  hierarchy: 'coarsest-root-to-lod0-leaf';
  geometricErrorMethod:
    'all-grid-point-vertical-residual-monotonic-upper-envelope-v0.1';
  sourceMetric: 'regular-grid-tin-all-node-vertical-residual-v0.1';
  sampleBasis: 'all-normalized-grid-points';
  units: 'metres';
  tilesetGeometricErrorMeters: number;
  levels: Array<{
    level: number;
    stride: number;
    sourceSampleCount: number;
    observedMaximumVerticalResidualMeters: number;
    geometricErrorMeters: number;
    monotonicAdjustmentMeters: number;
  }>;
  screenSpaceReference: {
    implementationModel: 'cesium-perspective-sse-v0.1';
    formula:
      'geometricError*viewportHeight/(distance*2*tan(verticalFov/2)*pixelRatio)';
    dynamicScreenSpaceError: false;
    profile: typeof TOPOGRAPHIC_3D_TILES_REFERENCE_SSE_PROFILE;
    sseDenominator: number;
    levels: Array<{
      level: number;
      geometricErrorMeters: number;
      refinementDistanceThresholdMeters: number;
    }>;
  };
  nonClaims: string[];
};

function roundMetric(value: number) {
  return Math.round(value * ROUNDING_SCALE) / ROUNDING_SCALE;
}

function requireNonNegativeFinite(field: string, value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a finite nonnegative number.`);
  }
}

function requirePositiveFinite(field: string, value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${field} must be a finite positive number.`);
  }
}

function perspectiveSseDenominator(verticalFieldOfViewDegrees: number) {
  if (
    !Number.isFinite(verticalFieldOfViewDegrees)
    || verticalFieldOfViewDegrees <= 0
    || verticalFieldOfViewDegrees >= 180
  ) {
    throw new Error(
      'verticalFieldOfViewDegrees must be greater than 0 and less than 180.',
    );
  }
  return 2 * Math.tan(
    verticalFieldOfViewDegrees * Math.PI / 360,
  );
}

export function calculateTopographicPerspectiveScreenSpaceError(
  input: TopographicPerspectiveScreenSpaceErrorInput,
) {
  requireNonNegativeFinite(
    'geometricErrorMeters',
    input.geometricErrorMeters,
  );
  requirePositiveFinite('distanceToTileMeters', input.distanceToTileMeters);
  requirePositiveFinite('viewportHeightPixels', input.viewportHeightPixels);
  requirePositiveFinite('pixelRatio', input.pixelRatio);
  const denominator = perspectiveSseDenominator(
    input.verticalFieldOfViewDegrees,
  );
  return (
    input.geometricErrorMeters
    * input.viewportHeightPixels
    / (input.distanceToTileMeters * denominator * input.pixelRatio)
  );
}

export function calculateTopographicPerspectiveRefinementDistance(
  input: TopographicPerspectiveRefinementDistanceInput,
) {
  requireNonNegativeFinite(
    'geometricErrorMeters',
    input.geometricErrorMeters,
  );
  requirePositiveFinite('viewportHeightPixels', input.viewportHeightPixels);
  requirePositiveFinite('pixelRatio', input.pixelRatio);
  requirePositiveFinite(
    'maximumScreenSpaceErrorPixels',
    input.maximumScreenSpaceErrorPixels,
  );
  const denominator = perspectiveSseDenominator(
    input.verticalFieldOfViewDegrees,
  );
  if (input.geometricErrorMeters === 0) return 0;
  return (
    input.geometricErrorMeters
    * input.viewportHeightPixels
    / (
      input.maximumScreenSpaceErrorPixels
      * denominator
      * input.pixelRatio
    )
  );
}

export function buildTopographic3dTilesRefinementContract(
  manifest: LocalGeoTiffMeshLodManifest,
): Topographic3dTilesRefinementContract {
  if (manifest.levels.length === 0) {
    throw new Error('3D Tiles refinement requires at least one LOD level.');
  }
  requirePositiveFinite(
    'maximumAllowedVerticalErrorMeters',
    manifest.output.maximumAllowedVerticalErrorMeters,
  );

  let monotonicUpperEnvelopeMeters = 0;
  const levels = manifest.levels.map((level, index) => {
    if (
      level.level !== index
      || !Number.isInteger(level.stride)
      || level.stride < 1
      || !Number.isInteger(level.sourceSampleCount)
      || level.sourceSampleCount < 1
    ) {
      throw new Error(`LOD${index} refinement metadata is invalid.`);
    }
    requireNonNegativeFinite(
      `LOD${index} maximumAbsoluteVerticalErrorMeters`,
      level.maximumAbsoluteVerticalErrorMeters,
    );
    if (
      index === 0
      && level.maximumAbsoluteVerticalErrorMeters > ERROR_TOLERANCE_METERS
    ) {
      throw new Error('LOD0 geometric error must be zero.');
    }
    if (
      index > 0
      && level.maximumAbsoluteVerticalErrorMeters
        > manifest.output.maximumAllowedVerticalErrorMeters
          + ERROR_TOLERANCE_METERS
    ) {
      throw new Error(
        `LOD${index} vertical residual exceeds its evidenced error budget.`,
      );
    }

    const observedMaximumVerticalResidualMeters =
      roundMetric(level.maximumAbsoluteVerticalErrorMeters);
    monotonicUpperEnvelopeMeters = index === 0
      ? 0
      : Math.max(
          monotonicUpperEnvelopeMeters,
          observedMaximumVerticalResidualMeters,
        );
    const geometricErrorMeters = roundMetric(
      monotonicUpperEnvelopeMeters,
    );
    return {
      level: level.level,
      stride: level.stride,
      sourceSampleCount: level.sourceSampleCount,
      observedMaximumVerticalResidualMeters,
      geometricErrorMeters,
      monotonicAdjustmentMeters: roundMetric(
        geometricErrorMeters - observedMaximumVerticalResidualMeters,
      ),
    };
  });

  const profile = TOPOGRAPHIC_3D_TILES_REFERENCE_SSE_PROFILE;
  const sseDenominator = perspectiveSseDenominator(
    profile.verticalFieldOfViewDegrees,
  );
  const tilesetGeometricErrorMeters =
    levels.at(-1)?.geometricErrorMeters ?? 0;

  return {
    version: TOPOGRAPHIC_3D_TILES_REFINEMENT_VERSION,
    mode: 'REPLACE',
    hierarchy: 'coarsest-root-to-lod0-leaf',
    geometricErrorMethod:
      'all-grid-point-vertical-residual-monotonic-upper-envelope-v0.1',
    sourceMetric: 'regular-grid-tin-all-node-vertical-residual-v0.1',
    sampleBasis: 'all-normalized-grid-points',
    units: 'metres',
    tilesetGeometricErrorMeters,
    levels,
    screenSpaceReference: {
      implementationModel: 'cesium-perspective-sse-v0.1',
      formula:
        'geometricError*viewportHeight/(distance*2*tan(verticalFov/2)*pixelRatio)',
      dynamicScreenSpaceError: false,
      profile,
      sseDenominator: roundMetric(sseDenominator),
      levels: levels.map(level => ({
        level: level.level,
        geometricErrorMeters: level.geometricErrorMeters,
        refinementDistanceThresholdMeters: roundMetric(
          calculateTopographicPerspectiveRefinementDistance({
            geometricErrorMeters: level.geometricErrorMeters,
            ...profile,
          }),
        ),
      })),
    },
    nonClaims: [
      'The reference SSE profile is a deterministic projection model, not a renderer attestation.',
      'The geometric error bounds vertical residual at every normalized source-grid point; it is not a continuous bidirectional Hausdorff-distance proof.',
      'Dynamic, foveated, orthographic, and device-specific renderer adjustments are outside this reference profile.',
    ],
  };
}
