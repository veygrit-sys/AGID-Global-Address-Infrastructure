import { getAgidWasmCore } from './agidWasm';
import { getLanguageDecision, shouldRefactorFromTypeScript } from './programmingLanguagePolicy';

export const ZK_PROOF_RUNTIME_PROFILE_VERSION = 'zk-proof-runtime-profile-v1';

export type ZkPredicateBackend = 'rust-wasm' | 'typescript-fallback';
export type ZkProofRuntimeTask =
  | 'proof-envelope-api'
  | 'public-proof-bundle-registry'
  | 'witness-predicate-evaluation'
  | 'formal-zk-circuit';

export type ZkProofRuntimeRecommendation = {
  task: ZkProofRuntimeTask;
  rewriteFromTypeScript: boolean;
  preferredBackends: string[];
  reason: string;
};

export type ZkProofRuntimeProfile = {
  version: typeof ZK_PROOF_RUNTIME_PROFILE_VERSION;
  envelopeRuntime: {
    primaryLanguage: 'TypeScript';
    preferredLanguage: 'TypeScript';
    reason: string;
  };
  registryRuntime: {
    primaryLanguage: 'TypeScript';
    preferredLanguage: 'TypeScript';
    reason: string;
  };
  predicateRuntime: {
    primaryLanguage: 'Rust' | 'TypeScript';
    preferredLanguage: 'Rust';
    activeBackend: ZkPredicateBackend;
    reason: string;
  };
  formalProofRuntime: {
    primaryLanguage: 'Noir/Circom/Rust-ZKVM';
    preferredLanguage: 'Noir/Circom/Rust-ZKVM';
    reason: string;
  };
};

export type ZkPredicateResult = {
  satisfied: boolean;
  backend: ZkPredicateBackend;
};

export type ZkProofPoint = {
  lat: number;
  lon: number;
};

export type ZkProofBoundingBox = {
  north: number;
  south: number;
  west: number;
  east: number;
};

const EARTH_RADIUS_METERS = 6_371_008.8;

type AgidWasmCore = NonNullable<ReturnType<typeof getAgidWasmCore>>;
type AgidZkPredicateWasmCore = AgidWasmCore & Required<Pick<
  AgidWasmCore,
  'agid_zkp_quality_threshold_satisfied' | 'agid_zkp_point_in_bbox' | 'agid_zkp_point_in_circle'
>>;

function hasZkPredicateWasmExports(core: ReturnType<typeof getAgidWasmCore>): core is AgidZkPredicateWasmCore {
  return Boolean(
    core?.agid_zkp_quality_threshold_satisfied
      && core.agid_zkp_point_in_bbox
      && core.agid_zkp_point_in_circle
  );
}

function finiteNumber(value: number) {
  return Number.isFinite(value);
}

function validPercent(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 100;
}

function validLatLon(point: ZkProofPoint) {
  return finiteNumber(point.lat)
    && finiteNumber(point.lon)
    && point.lat >= -90
    && point.lat <= 90;
}

function normalizeLongitude(lon: number) {
  if (!finiteNumber(lon)) return lon;
  const normalized = ((((lon + 180) % 360) + 360) % 360) - 180;
  return Object.is(normalized, -0) ? 0 : normalized;
}

function fallbackPointInBoundingBox(point: ZkProofPoint, box: ZkProofBoundingBox) {
  if (!validLatLon(point)) return false;
  if (
    !finiteNumber(box.north)
    || !finiteNumber(box.south)
    || !finiteNumber(box.west)
    || !finiteNumber(box.east)
    || box.north < box.south
    || box.north > 90
    || box.south < -90
  ) {
    return false;
  }

  if (point.lat < box.south || point.lat > box.north) return false;

  const lon = normalizeLongitude(point.lon);
  const west = normalizeLongitude(box.west);
  const east = normalizeLongitude(box.east);
  if (west <= east) return lon >= west && lon <= east;
  return lon >= west || lon <= east;
}

function distanceMeters(a: ZkProofPoint, b: ZkProofPoint) {
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const deltaLat = (b.lat - a.lat) * Math.PI / 180;
  const deltaLon = (b.lon - a.lon) * Math.PI / 180;
  const h = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

function fallbackPointInCircle(point: ZkProofPoint, center: ZkProofPoint, radiusMeters: number) {
  if (!validLatLon(point) || !validLatLon(center)) return false;
  if (!finiteNumber(radiusMeters) || radiusMeters < 0) return false;
  return distanceMeters(point, center) <= radiusMeters;
}

export function getActiveZkPredicateBackend(): ZkPredicateBackend {
  return hasZkPredicateWasmExports(getAgidWasmCore()) ? 'rust-wasm' : 'typescript-fallback';
}

export function qualityThresholdSatisfied(scorePercent: number, thresholdPercent: number): ZkPredicateResult {
  const backend = getActiveZkPredicateBackend();
  if (!validPercent(scorePercent) || !validPercent(thresholdPercent)) {
    return { satisfied: false, backend };
  }

  const core = getAgidWasmCore();
  if (hasZkPredicateWasmExports(core)) {
    return {
      satisfied: core.agid_zkp_quality_threshold_satisfied(scorePercent, thresholdPercent) === 1,
      backend,
    };
  }

  return { satisfied: scorePercent >= thresholdPercent, backend };
}

export function pointInZkBoundingBox(point: ZkProofPoint, box: ZkProofBoundingBox): ZkPredicateResult {
  const backend = getActiveZkPredicateBackend();
  const core = getAgidWasmCore();
  if (hasZkPredicateWasmExports(core)) {
    return {
      satisfied: core.agid_zkp_point_in_bbox(
        point.lat,
        point.lon,
        box.north,
        box.south,
        box.west,
        box.east
      ) === 1,
      backend,
    };
  }

  return { satisfied: fallbackPointInBoundingBox(point, box), backend };
}

export function pointInZkCircle(
  point: ZkProofPoint,
  center: ZkProofPoint,
  radiusMeters: number
): ZkPredicateResult {
  const backend = getActiveZkPredicateBackend();
  const core = getAgidWasmCore();
  if (hasZkPredicateWasmExports(core)) {
    return {
      satisfied: core.agid_zkp_point_in_circle(
        point.lat,
        point.lon,
        center.lat,
        center.lon,
        radiusMeters
      ) === 1,
      backend,
    };
  }

  return { satisfied: fallbackPointInCircle(point, center, radiusMeters), backend };
}

export function getZkProofRuntimeProfile(): ZkProofRuntimeProfile {
  const activeBackend = getActiveZkPredicateBackend();
  return {
    version: ZK_PROOF_RUNTIME_PROFILE_VERSION,
    envelopeRuntime: {
      primaryLanguage: 'TypeScript',
      preferredLanguage: 'TypeScript',
      reason: getLanguageDecision('api-orchestration').reason,
    },
    registryRuntime: {
      primaryLanguage: 'TypeScript',
      preferredLanguage: 'TypeScript',
      reason: getLanguageDecision('address-policy').reason,
    },
    predicateRuntime: {
      primaryLanguage: activeBackend === 'rust-wasm' ? 'Rust' : 'TypeScript',
      preferredLanguage: 'Rust',
      activeBackend,
      reason: getLanguageDecision('deterministic-geo-core').reason,
    },
    formalProofRuntime: {
      primaryLanguage: 'Noir/Circom/Rust-ZKVM',
      preferredLanguage: 'Noir/Circom/Rust-ZKVM',
      reason: getLanguageDecision('zk-circuit').reason,
    },
  };
}

export function getZkProofRuntimeRecommendation(task: ZkProofRuntimeTask): ZkProofRuntimeRecommendation {
  if (task === 'proof-envelope-api') {
    return {
      task,
      rewriteFromTypeScript: shouldRefactorFromTypeScript({ domain: 'api-orchestration' }),
      preferredBackends: ['typescript'],
      reason: 'Envelope signing, API schemas, and public error handling are not the proof bottleneck.',
    };
  }

  if (task === 'public-proof-bundle-registry') {
    return {
      task,
      rewriteFromTypeScript: shouldRefactorFromTypeScript({ domain: 'address-policy' }),
      preferredBackends: ['typescript', 'rust-native-after-persistence'],
      reason: 'The current in-memory registry is policy logic; Rust is useful later for high-volume persisted registries.',
    };
  }

  if (task === 'witness-predicate-evaluation') {
    return {
      task,
      rewriteFromTypeScript: shouldRefactorFromTypeScript({
        domain: 'deterministic-geo-core',
        deterministicNumeric: true,
        performanceCritical: true,
        browserRequired: true,
      }),
      preferredBackends: ['rust-wasm', 'rust-native'],
      reason: 'Quality thresholds and hidden region predicates benefit from deterministic native numeric code.',
    };
  }

  return {
    task,
    rewriteFromTypeScript: shouldRefactorFromTypeScript({
      domain: 'zk-circuit',
      cryptographicPrimitive: true,
    }),
    preferredBackends: ['noir', 'circom', 'halo2', 'risc0', 'sp1'],
    reason: 'Formal ZK proof generation and verification should be implemented as circuits or ZKVM programs.',
  };
}
