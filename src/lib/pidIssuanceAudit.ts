import type {
  AddressMorphismCandidate,
  AddressMorphismContext,
  AddressMorphismResult,
  AddressMorphismStatus,
} from './addressMorphism';

export const PID_ISSUANCE_AUDIT_VERSION = 'pid-issuance-audit-v1';
export const PID_ISSUANCE_AUDIT_SIGNATURE_ALGORITHM = 'HMAC-SHA-256';
export const PID_ISSUANCE_AUDIT_COMMITMENT_ALGORITHM = 'sha256-salted-pid-audit-commitment-v1';
export const PID_ISSUANCE_AUDIT_WORKFLOW_VERSION = 'address-morphism-pid-workflow-v1';

export type PidIssuanceAuditStepName =
  | 'candidate-generation'
  | 'clustering'
  | 'unresolved-gate'
  | 'history-update'
  | 'pid-issuance';

export type PidIssuanceAuditPrivacyField =
  | 'input-address'
  | 'raw-candidates'
  | 'raw-clusters'
  | 'user-history'
  | 'recipient'
  | 'aoid'
  | 'owner-device-secret';

export type PidIssuanceAuditCommitments = {
  inputAddress: string;
  candidateSet: string;
  clusterSet: string;
  historyUpdate: string;
};

export type PidIssuanceAuditStep = {
  name: PidIssuanceAuditStepName;
  passed: boolean;
  commitment?: keyof PidIssuanceAuditCommitments;
  count?: number;
  reasonCode?: string;
};

export type PidHistoryUpdateWitness = {
  previousHistoryRoot?: string;
  nextHistoryRoot: string;
  eventCount: number;
  updatedAt?: Date | string;
  actorScope?: 'owner-device' | 'server-audit' | 'local-only';
};

export type PidCandidateGenerationWitness = {
  generatorVersion?: string;
  generatedAt?: Date | string;
  sourceCount?: number;
};

export type PidIssuanceAuditProofHint = {
  zkReady: true;
  zkpGenerated: false;
  statement: 'pid-was-issued-after-candidate-cluster-unresolved-and-history-gates';
};

export type PidIssuanceAuditClaim = {
  version: typeof PID_ISSUANCE_AUDIT_VERSION;
  workflowVersion: typeof PID_ISSUANCE_AUDIT_WORKFLOW_VERSION;
  pid: string;
  status: Extract<AddressMorphismStatus, 'verified' | 'partial'>;
  issuedAt: string;
  expiresAt?: string;
  commitments: PidIssuanceAuditCommitments;
  steps: PidIssuanceAuditStep[];
  decision: {
    confidence: number;
    entropy: number;
    evidence: number;
    probability: number;
    risk: number;
    margin: number | null;
  };
  selectedCluster: {
    candidateCount: number;
    sourceCount: number;
    support: {
      fieldCompleteness: number;
      sourceReliability: number;
      consensus: number;
      history: number;
      conflictPenalty: number;
    };
  };
  candidateGeneration: {
    generatorVersion: string;
    candidateCount: number;
    sourceCount: number;
  };
  historyUpdate: {
    eventCount: number;
    actorScope: NonNullable<PidHistoryUpdateWitness['actorScope']>;
  };
  privacy: {
    hides: PidIssuanceAuditPrivacyField[];
    reveals: Array<'pid' | 'workflow-steps' | 'quality-metrics' | 'commitments' | 'issuer'>;
  };
  proofHint: PidIssuanceAuditProofHint;
};

export type PidIssuanceAuditSignature = {
  algorithm: typeof PID_ISSUANCE_AUDIT_SIGNATURE_ALGORITHM;
  issuerId: string;
  value: string;
};

export type PidIssuanceAuditEnvelope = {
  claim: PidIssuanceAuditClaim;
  signature: PidIssuanceAuditSignature;
  privateAuditSalt?: string;
  localCacheKey?: string;
};

export type CreatePidIssuanceAuditInput = {
  issuerId: string;
  issuerSecret: string;
  inputAddress: string;
  candidates: AddressMorphismCandidate[];
  result: AddressMorphismResult;
  historyUpdate: PidHistoryUpdateWitness;
  context?: AddressMorphismContext;
  candidateGeneration?: PidCandidateGenerationWitness;
  issuedAt?: Date | string;
  ttlSeconds?: number;
  privateAuditSalt?: string;
};

export type VerifyPidIssuanceAuditOptions = {
  issuerId?: string;
  issuerSecret?: string;
  expectedPid?: string;
  now?: Date | string;
  minimumEvidence?: number;
  minimumConfidence?: number;
};

export type PidIssuanceAuditVerificationResult = {
  valid: boolean;
  signatureValid: boolean | null;
  expired: boolean;
  workflowPassed: boolean;
  privacyPreserved: boolean;
  proofCost: 'none';
  errors: string[];
  warnings: string[];
};

const PID_PATTERN = /^AMT-[0-9A-F]{32}$/;
const REQUIRED_STEPS: PidIssuanceAuditStepName[] = [
  'candidate-generation',
  'clustering',
  'unresolved-gate',
  'history-update',
  'pid-issuance',
];
const textEncoder = new TextEncoder();

function getCrypto() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle || !cryptoApi.getRandomValues) {
    throw new Error('Web Crypto API is required for PID issuance audit.');
  }
  return cryptoApi;
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value)
    .normalize('NFKC')
    .replace(/[\u3000\s]+/g, ' ')
    .trim();
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }

  if (value instanceof Date) return JSON.stringify(value.toISOString());

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).filter(key => record[key] !== undefined).sort();
    return `{${keys.map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
  }

  return JSON.stringify(value);
}

function bytesToBase64Url(bytes: Uint8Array) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }

  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

function base64UrlToBytes(value: string) {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(value, 'base64url'));
  }

  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toIsoDate(value?: Date | string) {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function addSeconds(isoDate: string, ttlSeconds: number) {
  return new Date(new Date(isoDate).getTime() + ttlSeconds * 1000).toISOString();
}

function roundMetric(value: number | null | undefined, precision = 4) {
  if (value === null) return null;
  if (!Number.isFinite(value)) return 0;
  const scale = 10 ** precision;
  return Math.round(Number(value) * scale) / scale;
}

function sanitizeReasonCode(value?: string) {
  const text = normalizeText(value || 'passed').toLowerCase();
  if (!text) return 'passed';
  return text.replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'passed';
}

async function sha256Base64Url(payload: string) {
  const digest = await getCrypto().subtle.digest('SHA-256', textEncoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(digest));
}

async function hmacSha256Base64Url(secret: string, payload: string) {
  const cryptoApi = getCrypto();
  const key = await cryptoApi.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  const signature = await cryptoApi.subtle.sign('HMAC', key, textEncoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function verifyHmacSha256(secret: string, payload: string, signature: string) {
  const cryptoApi = getCrypto();
  const key = await cryptoApi.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  return cryptoApi.subtle.verify(
    'HMAC',
    key,
    base64UrlToBytes(signature),
    textEncoder.encode(payload)
  );
}

function signingPayload(claim: PidIssuanceAuditClaim) {
  return stableStringify(claim);
}

function generateAuditSalt(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function saltedCommitment(kind: keyof PidIssuanceAuditCommitments, salt: string, value: unknown) {
  return sha256Base64Url(stableStringify({
    algorithm: PID_ISSUANCE_AUDIT_COMMITMENT_ALGORITHM,
    kind,
    salt,
    value,
  }));
}

function candidateWitness(candidate: AddressMorphismCandidate) {
  return {
    id: normalizeText(candidate.id),
    label: normalizeText(candidate.label),
    canonical: candidate.canonical,
    lat: Number.isFinite(candidate.lat) ? roundMetric(candidate.lat, 6) : null,
    lon: Number.isFinite(candidate.lon) ? roundMetric(candidate.lon, 6) : null,
    sources: [...(candidate.sources ?? [])].map(normalizeText).sort(),
    confidence: roundMetric(candidate.confidence),
    validationScore: roundMetric(candidate.validationScore),
    deliverySuccesses: Math.max(0, candidate.deliverySuccesses ?? 0),
    deliveryFailures: Math.max(0, candidate.deliveryFailures ?? 0),
    historyEvents: (candidate.historyEvents ?? []).map(event => ({
      kind: event.kind,
      weight: roundMetric(event.weight),
      timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp ?? null,
      source: normalizeText(event.source),
    })),
  };
}

function clusterWitness(result: AddressMorphismResult) {
  return result.clusters.map(cluster => ({
    id: cluster.id,
    pid: cluster.pid,
    canonical: cluster.canonical,
    candidateCount: cluster.candidates.length,
    sources: [...cluster.sources].sort(),
    confidence: roundMetric(cluster.confidence),
    probability: roundMetric(cluster.probability),
    energy: roundMetric(cluster.energy),
    support: cluster.support,
  }));
}

function allSourceCount(candidates: AddressMorphismCandidate[]) {
  return new Set(candidates.flatMap(candidate => candidate.sources ?? []).map(normalizeText).filter(Boolean)).size;
}

function assertIssuablePid(result: AddressMorphismResult) {
  if (!result.pid || !result.selected) {
    throw new Error('PID issuance audit requires a selected PID.');
  }
  if (result.status !== 'verified' && result.status !== 'partial') {
    throw new Error('PID issuance audit requires verified or partial status after unresolved gate.');
  }
  if (!PID_PATTERN.test(result.pid)) {
    throw new Error('PID issuance audit requires a valid AMT PID.');
  }
}

export async function createPidIssuanceAuditProof(
  input: CreatePidIssuanceAuditInput
): Promise<PidIssuanceAuditEnvelope> {
  assertIssuablePid(input.result);
  if (!input.candidates.length) throw new Error('PID issuance audit requires generated candidates.');
  if (!normalizeText(input.inputAddress)) throw new Error('PID issuance audit requires the input address witness.');
  if (!input.historyUpdate || input.historyUpdate.eventCount < 1 || !normalizeText(input.historyUpdate.nextHistoryRoot)) {
    throw new Error('PID issuance audit requires a non-empty history update witness.');
  }

  const privateAuditSalt = input.privateAuditSalt ?? generateAuditSalt();
  const issuedAt = toIsoDate(input.issuedAt);
  const sourceCount = input.candidateGeneration?.sourceCount ?? allSourceCount(input.candidates);
  const selected = input.result.selected;
  const commitments: PidIssuanceAuditCommitments = {
    inputAddress: await saltedCommitment('inputAddress', privateAuditSalt, {
      inputAddress: normalizeText(input.inputAddress),
      context: input.context ?? {},
    }),
    candidateSet: await saltedCommitment('candidateSet', privateAuditSalt, {
      generatorVersion: input.candidateGeneration?.generatorVersion ?? 'unspecified-generator',
      candidates: input.candidates.map(candidateWitness),
    }),
    clusterSet: await saltedCommitment('clusterSet', privateAuditSalt, clusterWitness(input.result)),
    historyUpdate: await saltedCommitment('historyUpdate', privateAuditSalt, {
      previousHistoryRoot: input.historyUpdate.previousHistoryRoot ?? null,
      nextHistoryRoot: input.historyUpdate.nextHistoryRoot,
      eventCount: input.historyUpdate.eventCount,
      updatedAt: input.historyUpdate.updatedAt ? toIsoDate(input.historyUpdate.updatedAt) : issuedAt,
      actorScope: input.historyUpdate.actorScope ?? 'owner-device',
    }),
  };

  const steps: PidIssuanceAuditStep[] = [
    {
      name: 'candidate-generation',
      passed: input.candidates.length > 0,
      commitment: 'candidateSet',
      count: input.candidates.length,
      reasonCode: 'generated-candidate-set',
    },
    {
      name: 'clustering',
      passed: input.result.clusters.length > 0 && Boolean(selected),
      commitment: 'clusterSet',
      count: input.result.clusters.length,
      reasonCode: 'clustered-and-ranked',
    },
    {
      name: 'unresolved-gate',
      passed: input.result.status !== 'unresolved' && input.result.status !== 'ambiguous',
      reasonCode: sanitizeReasonCode(input.result.unresolvedReason || input.result.decision.reason || 'not-unresolved'),
    },
    {
      name: 'history-update',
      passed: input.historyUpdate.eventCount > 0,
      commitment: 'historyUpdate',
      count: input.historyUpdate.eventCount,
      reasonCode: 'history-root-updated',
    },
    {
      name: 'pid-issuance',
      passed: Boolean(input.result.pid && selected?.pid === input.result.pid),
      reasonCode: 'selected-cluster-pid-issued',
    },
  ];

  const claim: PidIssuanceAuditClaim = {
    version: PID_ISSUANCE_AUDIT_VERSION,
    workflowVersion: PID_ISSUANCE_AUDIT_WORKFLOW_VERSION,
    pid: input.result.pid!,
    status: input.result.status as Extract<AddressMorphismStatus, 'verified' | 'partial'>,
    issuedAt,
    ...(input.ttlSeconds ? { expiresAt: addSeconds(issuedAt, input.ttlSeconds) } : {}),
    commitments,
    steps,
    decision: {
      confidence: roundMetric(input.result.confidence),
      entropy: roundMetric(input.result.entropy),
      evidence: roundMetric(input.result.decision.evidence),
      probability: roundMetric(input.result.decision.probability),
      risk: roundMetric(input.result.decision.risk),
      margin: roundMetric(input.result.decision.margin),
    },
    selectedCluster: {
      candidateCount: selected!.candidates.length,
      sourceCount: selected!.sources.length,
      support: {
        fieldCompleteness: roundMetric(selected!.support.fieldCompleteness),
        sourceReliability: roundMetric(selected!.support.sourceReliability),
        consensus: roundMetric(selected!.support.consensus),
        history: roundMetric(selected!.support.history),
        conflictPenalty: roundMetric(selected!.support.conflictPenalty),
      },
    },
    candidateGeneration: {
      generatorVersion: input.candidateGeneration?.generatorVersion ?? 'unspecified-generator',
      candidateCount: input.candidates.length,
      sourceCount,
    },
    historyUpdate: {
      eventCount: input.historyUpdate.eventCount,
      actorScope: input.historyUpdate.actorScope ?? 'owner-device',
    },
    privacy: {
      hides: ['input-address', 'raw-candidates', 'raw-clusters', 'user-history', 'recipient', 'aoid', 'owner-device-secret'],
      reveals: ['pid', 'workflow-steps', 'quality-metrics', 'commitments', 'issuer'],
    },
    proofHint: {
      zkReady: true,
      zkpGenerated: false,
      statement: 'pid-was-issued-after-candidate-cluster-unresolved-and-history-gates',
    },
  };

  return {
    claim,
    privateAuditSalt,
    localCacheKey: `pid-audit:${await sha256Base64Url(stableStringify({
      pid: claim.pid,
      workflowVersion: claim.workflowVersion,
      commitments,
      issuerId: input.issuerId,
    }))}`,
    signature: {
      algorithm: PID_ISSUANCE_AUDIT_SIGNATURE_ALGORITHM,
      issuerId: input.issuerId,
      value: await hmacSha256Base64Url(input.issuerSecret, signingPayload(claim)),
    },
  };
}

export function stripPrivatePidIssuanceAuditMaterial(
  envelope: PidIssuanceAuditEnvelope
): Omit<PidIssuanceAuditEnvelope, 'privateAuditSalt' | 'localCacheKey'> {
  return {
    claim: envelope.claim,
    signature: envelope.signature,
  };
}

export async function verifyPidIssuanceAuditProof(
  envelope: PidIssuanceAuditEnvelope,
  options: VerifyPidIssuanceAuditOptions = {}
): Promise<PidIssuanceAuditVerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const claim = envelope.claim;

  if (claim.version !== PID_ISSUANCE_AUDIT_VERSION) errors.push('unsupported-pid-audit-version');
  if (claim.workflowVersion !== PID_ISSUANCE_AUDIT_WORKFLOW_VERSION) errors.push('unsupported-pid-workflow-version');
  if (!PID_PATTERN.test(claim.pid)) errors.push('invalid-pid');
  if (options.expectedPid && options.expectedPid !== claim.pid) errors.push('pid-mismatch');
  if (options.issuerId && options.issuerId !== envelope.signature.issuerId) errors.push('issuer-mismatch');
  if (envelope.signature.algorithm !== PID_ISSUANCE_AUDIT_SIGNATURE_ALGORITHM) {
    errors.push('unsupported-signature-algorithm');
  }

  const now = options.now ? new Date(options.now) : new Date();
  const expired = Boolean(claim.expiresAt && new Date(claim.expiresAt).getTime() <= now.getTime());
  if (expired) errors.push('pid-audit-expired');

  let signatureValid: boolean | null = null;
  if (options.issuerSecret) {
    signatureValid = await verifyHmacSha256(options.issuerSecret, signingPayload(claim), envelope.signature.value);
    if (!signatureValid) errors.push('signature-invalid');
  } else {
    warnings.push('issuer-secret-not-provided');
  }

  const stepByName = new Map(claim.steps.map(step => [step.name, step]));
  const runtimeStatus = claim.status as AddressMorphismStatus;
  const workflowPassed = REQUIRED_STEPS.every(stepName => stepByName.get(stepName)?.passed === true)
    && runtimeStatus !== 'unresolved'
    && runtimeStatus !== 'ambiguous';
  if (!workflowPassed) errors.push('workflow-gates-not-passed');

  if ((options.minimumEvidence ?? 0) > claim.decision.evidence) errors.push('evidence-too-low');
  if ((options.minimumConfidence ?? 0) > claim.decision.confidence) errors.push('confidence-too-low');

  const privacyPreserved = claim.privacy.hides.includes('input-address')
    && claim.privacy.hides.includes('user-history')
    && claim.privacy.hides.includes('raw-candidates')
    && !('privateAuditSalt' in stripPrivatePidIssuanceAuditMaterial(envelope));
  if (!privacyPreserved) errors.push('privacy-fields-not-hidden');

  return {
    valid: errors.length === 0 && signatureValid === true,
    signatureValid,
    expired,
    workflowPassed,
    privacyPreserved,
    proofCost: 'none',
    errors,
    warnings,
  };
}
