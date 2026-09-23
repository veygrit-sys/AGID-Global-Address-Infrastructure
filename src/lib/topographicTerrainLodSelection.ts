import type {
  ElevationMeshLod,
  ElevationVectorizationResult,
  MeshLodErrorLevel,
} from './topographicElevationVectorizer';

export type AuditedTerrainPreviewLod = {
  level: number;
  stride: number;
  mesh: ElevationMeshLod['mesh'];
  vertexCount: number;
  triangleCount: number;
  quality: MeshLodErrorLevel;
};

export type AuditedTerrainPreviewLodResolution =
  | {
      status: 'ready';
      available: AuditedTerrainPreviewLod[];
      selected: AuditedTerrainPreviewLod;
    }
  | {
      status: 'blocked';
      issueCode:
        | 'terrain-lod-audit-not-passed'
        | 'terrain-lod-audit-cap-missing'
        | 'terrain-lod-audit-count-mismatch'
        | 'terrain-lod-audit-level-invalid'
        | 'terrain-lod-request-not-audited';
      message: string;
    };

type LodQualityInput = Pick<
  ElevationVectorizationResult,
  'meshLods' | 'meshLodQuality'
>;

function blocked(
  issueCode: Extract<AuditedTerrainPreviewLodResolution, { status: 'blocked' }>['issueCode'],
  message: string,
): AuditedTerrainPreviewLodResolution {
  return { status: 'blocked', issueCode, message };
}

function hasFiniteNonNegativeQuality(quality: MeshLodErrorLevel) {
  return [
    quality.sourceSampleCount,
    quality.maximumAbsoluteVerticalErrorMeters,
    quality.meanAbsoluteVerticalErrorMeters,
    quality.rootMeanSquareVerticalErrorMeters,
    quality.maximumAllowedVerticalErrorMeters,
  ].every(value => Number.isFinite(value) && value >= 0);
}

/**
 * Resolves only LODs whose measured all-grid-point residual audits are bound to
 * the mesh. This intentionally does not treat that residual as 3D Tiles SSE or
 * geometricError.
 */
export function resolveAuditedTerrainPreviewLod(
  vectorized: LodQualityInput,
  requestedLevel?: number,
): AuditedTerrainPreviewLodResolution {
  const { meshLods, meshLodQuality } = vectorized;
  if (!meshLodQuality.passed) {
    return blocked(
      'terrain-lod-audit-not-passed',
      'Terrain LOD preview requires a passed all-grid-point vertical residual audit.',
    );
  }
  if (
    meshLodQuality.maximumAllowedVerticalErrorMeters === null
    || !Number.isFinite(meshLodQuality.maximumAllowedVerticalErrorMeters)
    || meshLodQuality.maximumAllowedVerticalErrorMeters <= 0
  ) {
    return blocked(
      'terrain-lod-audit-cap-missing',
      'Terrain LOD preview requires an explicit positive vertical residual cap.',
    );
  }
  if (
    meshLods.length === 0
    || meshLodQuality.levels.length !== meshLods.length
  ) {
    return blocked(
      'terrain-lod-audit-count-mismatch',
      'Terrain LOD meshes and their audit records must have the same non-zero count.',
    );
  }

  const qualityByLevel = new Map(
    meshLodQuality.levels.map(quality => [quality.level, quality]),
  );
  const available: AuditedTerrainPreviewLod[] = [];
  const seenLevels = new Set<number>();
  for (const lod of meshLods) {
    const quality = qualityByLevel.get(lod.level);
    if (
      !quality
      || seenLevels.has(lod.level)
      || lod.level < 0
      || !Number.isInteger(lod.level)
      || lod.stride < 1
      || !Number.isInteger(lod.stride)
      || quality.level !== lod.level
      || quality.stride !== lod.stride
      || !quality.passed
      || !hasFiniteNonNegativeQuality(quality)
      || quality.maximumAbsoluteVerticalErrorMeters
        > quality.maximumAllowedVerticalErrorMeters
    ) {
      return blocked(
        'terrain-lod-audit-level-invalid',
        `Terrain LOD${lod.level} does not have a matching passed residual audit.`,
      );
    }
    seenLevels.add(lod.level);
    available.push({
      level: lod.level,
      stride: lod.stride,
      mesh: lod.mesh,
      vertexCount: lod.vertexCount,
      triangleCount: lod.triangleCount,
      quality,
    });
  }
  available.sort((left, right) => left.level - right.level);
  const selected = requestedLevel === undefined
    ? available[0]
    : available.find(lod => lod.level === requestedLevel);
  if (!selected) {
    return blocked(
      'terrain-lod-request-not-audited',
      `Requested terrain LOD${requestedLevel} is not an audited preview option.`,
    );
  }
  return { status: 'ready', available, selected };
}
