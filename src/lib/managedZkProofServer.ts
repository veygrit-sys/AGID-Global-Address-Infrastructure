import { addressConnectPrivateMaterialPaths } from './addressConnect';
import { sha256Hex } from './sha256';
import { getZkProofRuntimeProfile } from './zkProofRuntime';

export const MANAGED_ZK_PROOF_SERVER_VERSION = 'agid-managed-zk-proof-server-v1';

export const MANAGED_ZK_PROOF_FAMILIES = [
  'private-address-predicate',
  'zk-address',
  'zk-residence',
  'zk-delivery-eligibility',
  'aoid-ownership',
  'duplicate-nullifier',
  'quality-threshold',
  'pid-issuance-audit',
  'pid-lifecycle',
  'revocation-freshness',
  'consent-purpose-scope',
  'anonymous-rate-limit',
  'proof-bundle',
] as const;

export const MANAGED_ZK_BACKENDS = [
  'circom-snarkjs',
  'noir',
  'halo2',
  'risc0',
  'sp1',
  'mock-dev',
] as const;

export const MANAGED_ZK_DEPLOYMENT_PROFILES = [
  'self-hosted',
  'private-municipality',
  'private-ngo',
  'private-carrier',
  'private-enterprise',
  'managed-saas',
] as const;

export const MANAGED_ZK_WITNESS_MODES = [
  'client-side-witness',
  'remote-encrypted-witness',
  'server-held-witness',
] as const;

export type ManagedZkProofFamily = (typeof MANAGED_ZK_PROOF_FAMILIES)[number];
export type ManagedZkBackend = (typeof MANAGED_ZK_BACKENDS)[number];
export type ManagedZkDeploymentProfile = (typeof MANAGED_ZK_DEPLOYMENT_PROFILES)[number];
export type ManagedZkWitnessMode = (typeof MANAGED_ZK_WITNESS_MODES)[number];
export type ManagedZkProofJobStatus =
  | 'queued'
  | 'requires-client-proof'
  | 'requires-private-deployment'
  | 'rejected';
export type ManagedZkProofPriority = 'low' | 'normal' | 'high' | 'emergency';

export type ManagedZkProofJobInput = {
  [key: string]: unknown;
  requestedAt?: unknown;
  tenantId?: unknown;
  requestId?: unknown;
  proofFamily?: unknown;
  backend?: unknown;
  deploymentProfile?: unknown;
  witnessMode?: unknown;
  confidentialCompute?: unknown;
  publicInputs?: unknown;
  commitments?: unknown;
  registryRoots?: unknown;
  policy?: unknown;
  circuit?: unknown;
  artifactRefs?: unknown;
  priority?: unknown;
  maxRuntimeSeconds?: unknown;
  ttlSeconds?: unknown;
  retryAttempts?: unknown;
  artifactRetentionSeconds?: unknown;
};

export type ManagedZkProofJob = {
  modelVersion: typeof MANAGED_ZK_PROOF_SERVER_VERSION;
  accepted: boolean;
  status: ManagedZkProofJobStatus;
  jobId: string;
  requestedAt: string;
  tenantId: string;
  requestId: string;
  proofFamily: ManagedZkProofFamily;
  backend: ManagedZkBackend;
  deploymentProfile: ManagedZkDeploymentProfile;
  witnessMode: ManagedZkWitnessMode;
  publicStatement: {
    publicInputs: Record<string, unknown>;
    commitments: Record<string, unknown>;
    registryRoots: Record<string, unknown>;
    policyHash: string;
    circuitId: string;
    verifierKeyRef: string;
  };
  queue: {
    priority: ManagedZkProofPriority;
    maxRuntimeSeconds: number;
    ttlSeconds: number;
    retryAttempts: number;
    idempotencyKey: string;
  };
  artifactPolicy: {
    storeProof: boolean;
    storePublicInputs: boolean;
    storeWitness: false;
    storeRawAddress: false;
    storeRawAgid: false;
    storeRawAoid: false;
    artifactRetentionSeconds: number;
  };
  execution: {
    orchestrationLanguage: 'typescript';
    recommendedProverRuntime: string;
    workerIsolation: string[];
    requiredEnvVars: string[];
  };
  security: {
    privateMaterialAccepted: false;
    serverHeldWitnessAllowed: false;
    domainSeparationRequired: true;
    publicOnlyJobContract: true;
    controls: string[];
  };
  warnings: string[];
  errors: string[];
  jobRoot: string;
};

const MANAGED_ZK_FORBIDDEN_PUBLIC_KEYS = new Set([
  'witness',
  'witnessjson',
  'witnessbytes',
  'witnesspayload',
  'encryptedwitness',
  'privateinput',
  'privateinputs',
  'privatewitness',
  'rawwitness',
  'rawproof',
  'provingkey',
  'zkey',
  'ptau',
  'holdersecret',
  'credentialsecret',
  'nullifiersecret',
]);

const DEFAULT_PUBLIC_INPUTS = Object.freeze({});

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`).join(',')}}`;
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanBoolean(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function cleanNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === 'number' ? value : Number(cleanString(value));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function cleanEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const cleaned = cleanString(value) as T;
  return allowed.includes(cleaned) ? cleaned : fallback;
}

function objectOrEmpty(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : { ...DEFAULT_PUBLIC_INPUTS };
}

function stableId(prefix: string, seed: string) {
  return `${prefix}-${sha256Hex(seed).slice(0, 20).toUpperCase()}`;
}

function collectManagedZkPrivateMaterialPaths(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectManagedZkPrivateMaterialPaths(item, `${prefix}[${index}]`));
  }

  const paths: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (MANAGED_ZK_FORBIDDEN_PUBLIC_KEYS.has(normalizedKey)) paths.push(path);
    paths.push(...collectManagedZkPrivateMaterialPaths(nested, path));
  }
  return Array.from(new Set(paths));
}

export function collectManagedZkProofServerPrivateMaterialErrors(value: unknown): string[] {
  const paths = Array.from(new Set([
    ...addressConnectPrivateMaterialPaths(value),
    ...collectManagedZkPrivateMaterialPaths(value),
  ]));
  return paths.map(path => `${path} is private proof or address material; submit only commitments, registry roots, public inputs, and object references.`);
}

function circuitMetadata(value: unknown, proofFamily: ManagedZkProofFamily, backend: ManagedZkBackend) {
  const circuit = objectOrEmpty(value);
  const circuitId = cleanString(circuit.circuitId ?? circuit.id)
    || `${proofFamily}:${backend}:v1`;
  const verifierKeyRef = cleanString(circuit.verifierKeyRef ?? circuit.vkRef ?? circuit.verificationKeyRef)
    || `vk://${proofFamily}/${backend}/v1`;
  return { circuitId, verifierKeyRef };
}

function defaultMaxRuntimeSeconds(backend: ManagedZkBackend, priority: ManagedZkProofPriority) {
  if (backend === 'mock-dev') return 5;
  if (priority === 'emergency') return 20;
  if (backend === 'risc0' || backend === 'sp1') return 180;
  return 90;
}

function defaultArtifactRetentionSeconds(deploymentProfile: ManagedZkDeploymentProfile, witnessMode: ManagedZkWitnessMode) {
  if (witnessMode === 'remote-encrypted-witness') return 300;
  if (deploymentProfile === 'managed-saas') return 3_600;
  return 86_400;
}

function requiredEnvVarsFor(backend: ManagedZkBackend, deploymentProfile: ManagedZkDeploymentProfile) {
  const base = ['AGID_MANAGED_ZK_JOB_STORE'];
  const backendVars: Record<ManagedZkBackend, string[]> = {
    'circom-snarkjs': ['AGID_ZK_CIRCOM_ARTIFACT_ROOT', 'AGID_ZK_SNARKJS_WORKER_CMD'],
    noir: ['AGID_ZK_NOIR_ARTIFACT_ROOT', 'AGID_ZK_NOIR_WORKER_CMD'],
    halo2: ['AGID_ZK_HALO2_ARTIFACT_ROOT', 'AGID_ZK_HALO2_WORKER_CMD'],
    risc0: ['AGID_ZK_RISC0_IMAGE_ID', 'AGID_ZK_RISC0_WORKER_CMD'],
    sp1: ['AGID_ZK_SP1_ELF_ROOT', 'AGID_ZK_SP1_WORKER_CMD'],
    'mock-dev': [],
  };
  if (deploymentProfile.startsWith('private-') || deploymentProfile === 'self-hosted') {
    return [...base, ...backendVars[backend], 'AGID_ZK_PRIVATE_DEPLOYMENT_ID'];
  }
  return [...base, ...backendVars[backend]];
}

export function listManagedZkProofServerCapabilities() {
  const runtime = getZkProofRuntimeProfile();
  return {
    modelVersion: MANAGED_ZK_PROOF_SERVER_VERSION,
    proofFamilies: MANAGED_ZK_PROOF_FAMILIES,
    backends: MANAGED_ZK_BACKENDS,
    deploymentProfiles: MANAGED_ZK_DEPLOYMENT_PROFILES,
    witnessModes: MANAGED_ZK_WITNESS_MODES,
    recommendedDefault: {
      witnessMode: 'client-side-witness',
      backend: 'circom-snarkjs',
      deploymentProfile: 'self-hosted',
    },
    privacy: {
      rawAddressAccepted: false,
      rawAgidAccepted: false,
      rawAoidAccepted: false,
      rawWitnessAccepted: false,
      serverHeldWitnessAllowed: false,
      publicJobMaterialOnly: true,
    },
    runtime,
    requiredControls: [
      'client-side-witness-preferred',
      'server-held-witness-rejected',
      'encrypted-witness-reference-only',
      'domain-separated-nullifier-and-commitment-inputs',
      'short-artifact-retention',
      'append-only-job-audit-without-raw-proof-material',
      'worker-sandbox-and-timeout',
      'verifier-key-pinning',
    ],
    privateDeploymentUseCases: [
      'municipality-residence-proof',
      'ngo-humanitarian-eligibility',
      'carrier-delivery-eligibility',
      'enterprise-private-aoid-ownership',
    ],
  };
}

export function buildManagedZkProofJob(input: ManagedZkProofJobInput = {}): ManagedZkProofJob {
  const requestedAt = cleanString(input.requestedAt) || new Date(0).toISOString();
  const tenantId = cleanString(input.tenantId) || 'local-dev-tenant';
  const proofFamily = cleanEnum(input.proofFamily, MANAGED_ZK_PROOF_FAMILIES, 'private-address-predicate');
  const backend = cleanEnum(input.backend, MANAGED_ZK_BACKENDS, 'circom-snarkjs');
  const deploymentProfile = cleanEnum(input.deploymentProfile, MANAGED_ZK_DEPLOYMENT_PROFILES, 'self-hosted');
  const witnessMode = cleanEnum(input.witnessMode, MANAGED_ZK_WITNESS_MODES, 'client-side-witness');
  const priority = cleanEnum(input.priority, ['low', 'normal', 'high', 'emergency'] as const, 'normal');
  const confidentialCompute = cleanBoolean(input.confidentialCompute);
  const publicInputs = objectOrEmpty(input.publicInputs);
  const commitments = objectOrEmpty(input.commitments);
  const registryRoots = objectOrEmpty(input.registryRoots);
  const policy = objectOrEmpty(input.policy);
  const { circuitId, verifierKeyRef } = circuitMetadata(input.circuit, proofFamily, backend);
  const maxRuntimeSeconds = cleanNumber(
    input.maxRuntimeSeconds,
    defaultMaxRuntimeSeconds(backend, priority),
    1,
    3_600,
  );
  const ttlSeconds = cleanNumber(input.ttlSeconds, priority === 'emergency' ? 300 : 900, 30, 86_400);
  const retryAttempts = cleanNumber(input.retryAttempts, priority === 'emergency' ? 1 : 3, 0, 8);
  const artifactRetentionSeconds = cleanNumber(
    input.artifactRetentionSeconds,
    defaultArtifactRetentionSeconds(deploymentProfile, witnessMode),
    0,
    604_800,
  );

  const warnings: string[] = [];
  const errors = collectManagedZkProofServerPrivateMaterialErrors(input);

  if (witnessMode === 'server-held-witness') {
    errors.push('server-held-witness is rejected; use client-side-witness or remote-encrypted-witness reference mode.');
  }

  if (witnessMode === 'remote-encrypted-witness') {
    warnings.push('remote-encrypted-witness-requires-reference-only-payload-and-short-retention');
    if (deploymentProfile === 'managed-saas' && !confidentialCompute) {
      errors.push('remote-encrypted-witness on managed-saas requires confidentialCompute or a private deployment profile.');
    }
  }

  if (backend === 'mock-dev') {
    warnings.push('mock-dev-backend-for-tests-only');
  }

  if (proofFamily === 'pid-issuance-audit' || proofFamily === 'pid-lifecycle') {
    warnings.push('pid-proof-jobs-require-deterministic-resolution-transcript-commitments');
  }

  const policyHash = sha256Hex(stableJson({
    proofFamily,
    backend,
    deploymentProfile,
    policy,
  }));
  const requestSeed = stableJson({
    modelVersion: MANAGED_ZK_PROOF_SERVER_VERSION,
    tenantId,
    requestedAt,
    proofFamily,
    backend,
    deploymentProfile,
    witnessMode,
    publicInputs,
    commitments,
    registryRoots,
    policyHash,
    circuitId,
    verifierKeyRef,
  });
  const jobId = cleanString(input.requestId) || stableId('MZK', requestSeed);
  const accepted = errors.length === 0;
  const status: ManagedZkProofJobStatus = !accepted
    ? (errors.some(error => error.includes('managed-saas requires confidentialCompute')) ? 'requires-private-deployment' : 'rejected')
    : witnessMode === 'client-side-witness'
      ? 'requires-client-proof'
      : 'queued';
  const controls = [
    'reject-private-material-in-public-api',
    'store-commitments-roots-and-policy-hashes-only',
    'domain-separated-job-id-and-idempotency-key',
    'no-witness-storage',
    'verifier-key-reference-pinning',
    'bounded-runtime-and-artifact-retention',
    ...(witnessMode === 'remote-encrypted-witness' ? ['encrypted-witness-reference-only'] : []),
    ...(deploymentProfile.startsWith('private-') ? ['private-deployment-boundary'] : []),
  ];
  const jobRoot = sha256Hex(stableJson({
    jobId,
    accepted,
    status,
    publicInputs,
    commitments,
    registryRoots,
    policyHash,
    circuitId,
    verifierKeyRef,
    errors,
    warnings,
  }));

  return {
    modelVersion: MANAGED_ZK_PROOF_SERVER_VERSION,
    accepted,
    status,
    jobId,
    requestedAt,
    tenantId,
    requestId: jobId,
    proofFamily,
    backend,
    deploymentProfile,
    witnessMode,
    publicStatement: {
      publicInputs,
      commitments,
      registryRoots,
      policyHash,
      circuitId,
      verifierKeyRef,
    },
    queue: {
      priority,
      maxRuntimeSeconds,
      ttlSeconds,
      retryAttempts,
      idempotencyKey: sha256Hex(`managed-zk-proof-job:${tenantId}:${jobId}`).slice(0, 32),
    },
    artifactPolicy: {
      storeProof: witnessMode !== 'client-side-witness',
      storePublicInputs: true,
      storeWitness: false,
      storeRawAddress: false,
      storeRawAgid: false,
      storeRawAoid: false,
      artifactRetentionSeconds,
    },
    execution: {
      orchestrationLanguage: 'typescript',
      recommendedProverRuntime: backend === 'circom-snarkjs'
        ? 'node-worker-snarkjs'
        : backend === 'mock-dev'
          ? 'in-process-test-double'
          : `${backend}-worker`,
      workerIsolation: [
        'separate-process',
        'memory-limit',
        'wall-clock-timeout',
        'no-request-body-logging',
        'artifact-refs-not-inline-witness',
      ],
      requiredEnvVars: requiredEnvVarsFor(backend, deploymentProfile),
    },
    security: {
      privateMaterialAccepted: false,
      serverHeldWitnessAllowed: false,
      domainSeparationRequired: true,
      publicOnlyJobContract: true,
      controls,
    },
    warnings,
    errors,
    jobRoot,
  };
}
