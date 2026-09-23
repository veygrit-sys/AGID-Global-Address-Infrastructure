/**
 * The toolchain contract is intentionally capability-only. It never treats an
 * installed binary as proof that a source is official, current, or reusable.
 */
export const OPEN_GEO_OSS_TOOLCHAIN_VERSION = 'agid-open-geo-oss-toolchain-v1';

export type OpenGeoOssToolId =
  | 'gdal'
  | 'proj'
  | 'postgis'
  | 'osm2pgsql'
  | 'libpostal'
  | 'cosign';

export type OpenGeoOssCapability =
  | 'source-backed-terrain'
  | 'versioned-spatial-index'
  | 'local-multilingual-parser'
  | 'signed-artifact-release';

export type OpenGeoOssToolStatus = 'available' | 'missing' | 'unverified';

export type OpenGeoOssToolProbe = {
  tool: OpenGeoOssToolId;
  status: OpenGeoOssToolStatus;
  version?: string;
  evidenceSha256?: `sha256:${string}`;
};

export type OpenGeoOssCapabilityAssessment = {
  capability: OpenGeoOssCapability;
  status: 'ready' | 'blocked';
  requiredTools: OpenGeoOssToolId[];
  blockingReasons: string[];
};

export type OpenGeoOssToolchainAssessment = {
  version: typeof OPEN_GEO_OSS_TOOLCHAIN_VERSION;
  capabilities: OpenGeoOssCapabilityAssessment[];
  sourcePromotion: {
    toolchainAlonePermitsPromotion: false;
    requiredSeparateEvidence: readonly [
      'license',
      'version',
      'scope',
      'correction-path',
      'source-approval',
    ];
  };
};

const SHA256 = /^sha256:[a-f0-9]{64}$/i;
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

export const OPEN_GEO_OSS_MINIMUM_VERSIONS: Readonly<Partial<Record<OpenGeoOssToolId, string>>> = {
  gdal: '3.13.0',
  proj: '9.0.0',
};

function compareVersions(left: string, right: string) {
  const leftMatch = left.match(SEMVER);
  const rightMatch = right.match(SEMVER);
  if (!leftMatch || !rightMatch) return undefined;
  for (let index = 1; index <= 3; index += 1) {
    const difference = Number(leftMatch[index]) - Number(rightMatch[index]);
    if (difference !== 0) return difference;
  }
  return 0;
}

function byTool(probes: readonly OpenGeoOssToolProbe[], tool: OpenGeoOssToolId) {
  return probes.find(candidate => candidate.tool === tool);
}

function toolBlockingReasons(
  probes: readonly OpenGeoOssToolProbe[],
  tools: readonly OpenGeoOssToolId[],
) {
  const reasons: string[] = [];
  for (const tool of tools) {
    const probe = byTool(probes, tool);
    if (!probe || probe.status !== 'available') {
      reasons.push(`${tool}-not-available`);
      continue;
    }
    if (probe.evidenceSha256 && !SHA256.test(probe.evidenceSha256)) {
      reasons.push(`${tool}-invalid-evidence-digest`);
      continue;
    }
    const minimum = OPEN_GEO_OSS_MINIMUM_VERSIONS[tool];
    if (minimum) {
      if (!probe.version || compareVersions(probe.version, minimum) === undefined) {
        reasons.push(`${tool}-version-unparseable`);
      } else if (compareVersions(probe.version, minimum)! < 0) {
        reasons.push(`${tool}-version-below-${minimum}`);
      }
    }
  }
  return reasons;
}

function assessment(
  capability: OpenGeoOssCapability,
  requiredTools: OpenGeoOssToolId[],
  reasons: string[],
): OpenGeoOssCapabilityAssessment {
  return {
    capability,
    status: reasons.length ? 'blocked' : 'ready',
    requiredTools,
    blockingReasons: reasons,
  };
}

/**
 * Builds a conservative readiness snapshot from sanitized local probes. The
 * snapshot contains no data paths, connection strings, source payloads, or
 * address material.
 */
export function assessOpenGeoOssToolchain(input: {
  probes: readonly OpenGeoOssToolProbe[];
  projDatabaseReady: boolean;
  tufMetadataReady: boolean;
}): OpenGeoOssToolchainAssessment {
  const terrainReasons = toolBlockingReasons(input.probes, ['gdal', 'proj']);
  if (!input.projDatabaseReady) terrainReasons.push('proj-data-not-ready');

  const spatialReasons = toolBlockingReasons(input.probes, ['postgis', 'osm2pgsql']);
  const parserReasons = toolBlockingReasons(input.probes, ['libpostal']);
  const releaseReasons = toolBlockingReasons(input.probes, ['cosign']);
  if (!input.tufMetadataReady) releaseReasons.push('tuf-metadata-not-ready');

  return {
    version: OPEN_GEO_OSS_TOOLCHAIN_VERSION,
    capabilities: [
      assessment('source-backed-terrain', ['gdal', 'proj'], terrainReasons),
      assessment('versioned-spatial-index', ['postgis', 'osm2pgsql'], spatialReasons),
      assessment('local-multilingual-parser', ['libpostal'], parserReasons),
      assessment('signed-artifact-release', ['cosign'], releaseReasons),
    ],
    sourcePromotion: {
      toolchainAlonePermitsPromotion: false,
      requiredSeparateEvidence: [
        'license',
        'version',
        'scope',
        'correction-path',
        'source-approval',
      ],
    },
  };
}

export function requireOpenGeoOssCapability(
  assessment: OpenGeoOssToolchainAssessment,
  capability: OpenGeoOssCapability,
) {
  const result = assessment.capabilities.find(item => item.capability === capability);
  if (!result) throw new Error(`Unknown open geo OSS capability: ${capability}.`);
  if (result.status !== 'ready') {
    throw new Error(`Open geo OSS capability ${capability} is blocked: ${result.blockingReasons.join(', ')}.`);
  }
  return result;
}
