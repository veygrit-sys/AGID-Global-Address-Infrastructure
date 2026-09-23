import type {
  AddressMorphismCandidate,
  AddressMorphismContext,
  AddressMorphismStatus,
} from './addressMorphism';
import { resolveAddressMorphism } from './addressMorphism';
import { sha256Hex } from './sha256';

export const AMN_MODEL_VERSION = 'address-morphism-network-v1';
export const AMN_RESOLUTION_POLICY_VERSION = 'amn-resolution-policy-v1';
export const AMN_COMMITMENT_ALGORITHM = 'sha256-amn-commitment-v1';
export const AMN_REGISTRY_VERSION = 'amn-resolution-registry-v1';

export type AmnResolutionPolicy = {
  policyVersion?: string;
  resolverVersion?: string;
  purpose?: AddressMorphismContext['purpose'] | string;
  qualityThreshold?: number;
  unresolvedPolicy?: 'do-not-issue-pid-for-unresolved' | 'allow-unresolved-reference' | string;
  privacyMode?: 'commitments-only' | 'zk-ready-public-envelope' | string;
};

export type AmnEvidenceRecord = {
  sourceId: string;
  evidenceType: string;
  subjectCommitment: string;
  confidence?: number;
  observedAt?: string;
};

export type AmnHistoryUpdate = {
  previousHistoryRoot?: string;
  nextHistoryRoot?: string;
  eventCount?: number;
  updatedAt?: string;
};

export type CreateAmnResolutionEnvelopeInput = {
  inputAddress: string;
  candidates: AddressMorphismCandidate[];
  context?: AddressMorphismContext;
  policy?: AmnResolutionPolicy;
  evidence?: AmnEvidenceRecord[];
  historyUpdate?: AmnHistoryUpdate;
  proofBundleId?: string;
  issuedAt?: string;
  expiresAt?: string;
  privateSalt?: string;
};

export type AmnWorkflowStep = {
  step: 'candidate-generation' | 'clustering' | 'unresolved-gate' | 'history-update' | 'pid-issuance';
  passed: boolean;
  commitment: string;
  publicReason?: string;
};

export type AmnResolutionSummary = {
  status: AddressMorphismStatus;
  pid: string | null;
  rpid: string | null;
  dpid: string | null;
  confidence: number;
  risk: number;
  evidence: number;
  probability: number;
  entropy: number;
  clusterCount: number;
  candidateCount: number;
  selectedClusterCommitment: string | null;
  selectedSourceCount: number;
};

export type AmnEvidenceCommitment = {
  sourceId: string;
  evidenceType: string;
  confidence: number;
  observedAt?: string;
  commitment: string;
};

export type AmnResolutionEnvelopeClaim = {
  modelVersion: typeof AMN_MODEL_VERSION;
  envelopeId: string;
  issuedAt: string;
  expiresAt?: string;
  policy: Required<AmnResolutionPolicy>;
  policyHash: string;
  evidenceRoot: string;
  proofBundleId?: string;
  commitmentAlgorithm: typeof AMN_COMMITMENT_ALGORITHM;
  commitments: {
    inputAddress: string;
    candidateSet: string;
    clusterSet: string;
    historyUpdate: string;
  };
  evidenceCommitments: AmnEvidenceCommitment[];
  workflow: AmnWorkflowStep[];
  resolution: AmnResolutionSummary;
  privacy: {
    mode: string;
    hides: string[];
    publicPayloadRule: string;
  };
};

export type AmnResolutionEnvelope = {
  claim: AmnResolutionEnvelopeClaim;
  privateSalt?: string;
  localCacheKey?: string;
};

export type AmnPublicResolutionEnvelope = {
  claim: AmnResolutionEnvelopeClaim;
};

export type VerifyAmnResolutionEnvelopeOptions = {
  expectedPolicyHash?: string;
  expectedEvidenceRoot?: string;
  minimumConfidence?: number;
  now?: string;
};

export type AmnEnvelopeVerification = {
  registryVersion: typeof AMN_REGISTRY_VERSION;
  envelopeId: string;
  valid: boolean;
  workflowPassed: boolean;
  privacyPreserved: boolean;
  errors: string[];
  warnings: string[];
};

export type AmnRegistryRecord = {
  registryVersion: typeof AMN_REGISTRY_VERSION;
  envelopeId: string;
  policyHash: string;
  evidenceRoot: string;
  proofBundleId?: string;
  status: 'active';
  resolutionStatus: AddressMorphismStatus;
  pid: string | null;
  rpid: string | null;
  dpid: string | null;
  confidence: number;
  registeredAt: string;
  rawEnvelopeStored: false;
  commitmentHash: string;
};

export type AmnRegistryRegistration = {
  registryVersion: typeof AMN_REGISTRY_VERSION;
  status: 'registered' | 'already_registered' | 'rejected';
  envelopeId: string | null;
  record: AmnRegistryRecord | null;
  verification: AmnEnvelopeVerification;
  errors: string[];
  warnings: string[];
};

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`).join(',')}}`;
}

function hashObject(value: unknown) {
  return sha256Hex(stableStringify(value));
}

function shortUpperHash(value: unknown, length: number) {
  return hashObject(value).slice(0, length).toUpperCase();
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function nowIso() {
  return new Date().toISOString();
}

function normalizePolicy(policy: AmnResolutionPolicy | undefined): Required<AmnResolutionPolicy> {
  return {
    policyVersion: policy?.policyVersion ?? AMN_RESOLUTION_POLICY_VERSION,
    resolverVersion: policy?.resolverVersion ?? 'amt-reference-resolver-v1',
    purpose: policy?.purpose ?? 'registration',
    qualityThreshold: typeof policy?.qualityThreshold === 'number' ? policy.qualityThreshold : 0.78,
    unresolvedPolicy: policy?.unresolvedPolicy ?? 'do-not-issue-pid-for-unresolved',
    privacyMode: policy?.privacyMode ?? 'commitments-only',
  };
}

function commitment(kind: string, privateSalt: string, value: unknown) {
  return hashObject({
    algorithm: AMN_COMMITMENT_ALGORITHM,
    kind,
    privateSalt,
    value,
  });
}

function publicCandidateCommitmentMaterial(candidates: AddressMorphismCandidate[]) {
  return candidates.map(candidate => ({
    id: candidate.id,
    canonical: candidate.canonical,
    latBucket: typeof candidate.lat === 'number' ? Number(candidate.lat.toFixed(3)) : undefined,
    lonBucket: typeof candidate.lon === 'number' ? Number(candidate.lon.toFixed(3)) : undefined,
    sources: candidate.sources?.slice().sort(),
    confidence: candidate.confidence,
    validationScore: candidate.validationScore,
  }));
}

function publicClusterCommitmentMaterial(result: ReturnType<typeof resolveAddressMorphism>) {
  return result.clusters.map(cluster => ({
    id: cluster.id,
    canonical: cluster.canonical,
    sourceCount: cluster.sources.length,
    candidateCount: cluster.candidates.length,
    support: cluster.support,
    confidence: cluster.confidence,
    probability: cluster.probability,
    energy: Number(cluster.energy.toFixed(8)),
    pid: cluster.pid,
  }));
}

function evidenceCommitments(evidence: AmnEvidenceRecord[], privateSalt: string): AmnEvidenceCommitment[] {
  return evidence
    .map(record => ({
      sourceId: record.sourceId,
      evidenceType: record.evidenceType,
      confidence: clamp(record.confidence ?? 0.5),
      observedAt: record.observedAt,
      commitment: commitment('evidence-record', privateSalt, {
        sourceId: record.sourceId,
        evidenceType: record.evidenceType,
        subjectCommitment: record.subjectCommitment,
        confidence: record.confidence,
        observedAt: record.observedAt,
      }),
    }))
    .sort((left, right) =>
      `${left.sourceId}:${left.evidenceType}:${left.commitment}`.localeCompare(
        `${right.sourceId}:${right.evidenceType}:${right.commitment}`,
      )
    );
}

function workflowSteps({
  candidateCount,
  clusterCount,
  status,
  pid,
  historyUpdate,
  privateSalt,
  commitments,
}: {
  candidateCount: number;
  clusterCount: number;
  status: AddressMorphismStatus;
  pid: string | null;
  historyUpdate?: AmnHistoryUpdate;
  privateSalt: string;
  commitments: AmnResolutionEnvelopeClaim['commitments'];
}): AmnWorkflowStep[] {
  const historyPassed = Boolean(historyUpdate?.nextHistoryRoot && (historyUpdate.eventCount ?? 0) > 0);
  const pidPassed = Boolean(pid);
  return [
    {
      step: 'candidate-generation',
      passed: candidateCount > 0,
      commitment: commitments.candidateSet,
      publicReason: candidateCount > 0 ? 'candidate-set-committed' : 'no-candidates',
    },
    {
      step: 'clustering',
      passed: clusterCount > 0,
      commitment: commitments.clusterSet,
      publicReason: clusterCount > 0 ? 'cluster-set-committed' : 'no-clusters',
    },
    {
      step: 'unresolved-gate',
      passed: status !== 'unresolved',
      commitment: commitment('unresolved-gate', privateSalt, { status }),
      publicReason: status !== 'unresolved' ? 'resolution-status-accepted' : 'unresolved',
    },
    {
      step: 'history-update',
      passed: historyPassed,
      commitment: commitments.historyUpdate,
      publicReason: historyPassed ? 'history-root-updated' : 'history-update-missing',
    },
    {
      step: 'pid-issuance',
      passed: pidPassed,
      commitment: commitment('pid-issuance', privateSalt, { pid }),
      publicReason: pidPassed ? 'pid-issued' : 'pid-not-issued',
    },
  ];
}

function createDefaultPrivateSalt(input: CreateAmnResolutionEnvelopeInput) {
  return hashObject({
    inputAddress: input.inputAddress,
    candidateCount: input.candidates.length,
    issuedAt: input.issuedAt,
    proofBundleId: input.proofBundleId,
  });
}

function buildResolutionSummary(
  result: ReturnType<typeof resolveAddressMorphism>,
  policyHash: string,
  evidenceRoot: string,
  selectedClusterCommitment: string | null,
): AmnResolutionSummary {
  const pid = result.pid;
  const rpid = pid ? `RPID-${shortUpperHash({ pid, policyHash, evidenceRoot, type: 'rpid' }, 32)}` : null;
  const dpid = pid ? `DPID-${shortUpperHash({ pid, selectedClusterCommitment, type: 'delivery-pid' }, 32)}` : null;

  return {
    status: result.status,
    pid,
    rpid,
    dpid,
    confidence: clamp(result.confidence),
    risk: clamp(result.decision.risk),
    evidence: clamp(result.decision.evidence),
    probability: clamp(result.decision.probability),
    entropy: Number(result.entropy.toFixed(8)),
    clusterCount: result.clusters.length,
    candidateCount: result.clusters.reduce((sum, cluster) => sum + cluster.candidates.length, 0),
    selectedClusterCommitment,
    selectedSourceCount: result.selected?.sources.length ?? 0,
  };
}

export function createAmnResolutionEnvelope(input: CreateAmnResolutionEnvelopeInput): AmnResolutionEnvelope {
  if (!input.inputAddress || typeof input.inputAddress !== 'string') {
    throw new Error('inputAddress is required');
  }
  if (!Array.isArray(input.candidates) || input.candidates.length === 0) {
    throw new Error('at least one candidate is required');
  }

  const issuedAt = input.issuedAt ?? nowIso();
  const privateSalt = input.privateSalt ?? createDefaultPrivateSalt({ ...input, issuedAt });
  const policy = normalizePolicy(input.policy);
  const policyHash = hashObject(policy);
  const evidence = evidenceCommitments(input.evidence ?? [], privateSalt);
  const evidenceRoot = hashObject(evidence);
  const result = resolveAddressMorphism({
    input: input.inputAddress,
    candidates: input.candidates,
    context: input.context,
  });
  const selectedClusterCommitment = result.selected
    ? commitment('selected-cluster', privateSalt, {
      id: result.selected.id,
      canonical: result.selected.canonical,
      sourceCount: result.selected.sources.length,
      candidateCount: result.selected.candidates.length,
      pid: result.selected.pid,
    })
    : null;
  const commitments = {
    inputAddress: commitment('input-address', privateSalt, {
      inputAddress: input.inputAddress,
      context: input.context,
    }),
    candidateSet: commitment('candidate-set', privateSalt, publicCandidateCommitmentMaterial(input.candidates)),
    clusterSet: commitment('cluster-set', privateSalt, publicClusterCommitmentMaterial(result)),
    historyUpdate: commitment('history-update', privateSalt, input.historyUpdate ?? {}),
  };
  const resolution = buildResolutionSummary(result, policyHash, evidenceRoot, selectedClusterCommitment);
  const workflow = workflowSteps({
    candidateCount: resolution.candidateCount,
    clusterCount: resolution.clusterCount,
    status: result.status,
    pid: result.pid,
    historyUpdate: input.historyUpdate,
    privateSalt,
    commitments,
  });
  const claimWithoutId: Omit<AmnResolutionEnvelopeClaim, 'envelopeId'> = {
    modelVersion: AMN_MODEL_VERSION,
    issuedAt,
    expiresAt: input.expiresAt,
    policy,
    policyHash,
    evidenceRoot,
    proofBundleId: input.proofBundleId,
    commitmentAlgorithm: AMN_COMMITMENT_ALGORITHM,
    commitments,
    evidenceCommitments: evidence,
    workflow,
    resolution,
    privacy: {
      mode: 'public-commitments-only',
      hides: [
        'input-address',
        'raw-candidates',
        'raw-clusters',
        'recipient',
        'aoid',
        'phone',
        'exact-private-coordinates',
      ],
      publicPayloadRule: 'publish policy hashes, evidence roots, workflow decisions, proof bundle ids, and opaque commitments only',
    },
  };
  const envelopeId = `AMN-${shortUpperHash(claimWithoutId, 24)}`;

  return {
    claim: {
      ...claimWithoutId,
      envelopeId,
    },
    privateSalt,
    localCacheKey: `AMN-CACHE-${shortUpperHash({ envelopeId, privateSalt }, 24)}`,
  };
}

export function stripPrivateAmnEnvelopeMaterial(
  envelope: AmnResolutionEnvelope | AmnPublicResolutionEnvelope,
): AmnPublicResolutionEnvelope {
  return {
    claim: envelope.claim,
  };
}

function isHex64(value: unknown) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
}

function isEnvelopeId(value: unknown) {
  return typeof value === 'string' && /^AMN-[0-9A-F]{24}$/u.test(value);
}

export function verifyAmnResolutionEnvelope(
  envelope: AmnResolutionEnvelope | AmnPublicResolutionEnvelope,
  options: VerifyAmnResolutionEnvelopeOptions = {},
): AmnEnvelopeVerification {
  const publicEnvelope = stripPrivateAmnEnvelopeMaterial(envelope);
  const { claim } = publicEnvelope;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!claim || typeof claim !== 'object') errors.push('missing-claim');
  if (claim?.modelVersion !== AMN_MODEL_VERSION) errors.push('unsupported-model-version');
  if (!isEnvelopeId(claim?.envelopeId)) errors.push('invalid-envelope-id');
  if (!isHex64(claim?.policyHash)) errors.push('invalid-policy-hash');
  if (!isHex64(claim?.evidenceRoot)) errors.push('invalid-evidence-root');
  if (claim?.policyHash && claim?.policy && hashObject(claim.policy) !== claim.policyHash) {
    errors.push('policy-hash-recompute-mismatch');
  }
  if (claim?.evidenceRoot && Array.isArray(claim.evidenceCommitments) && hashObject(claim.evidenceCommitments) !== claim.evidenceRoot) {
    errors.push('evidence-root-recompute-mismatch');
  }
  if (options.expectedPolicyHash && options.expectedPolicyHash !== claim?.policyHash) {
    errors.push('policy-hash-mismatch');
  }
  if (options.expectedEvidenceRoot && options.expectedEvidenceRoot !== claim?.evidenceRoot) {
    errors.push('evidence-root-mismatch');
  }
  if (typeof options.minimumConfidence === 'number' && (claim?.resolution?.confidence ?? 0) < options.minimumConfidence) {
    errors.push('minimum-confidence-not-met');
  }

  const nowMs = options.now ? new Date(options.now).getTime() : Date.now();
  if (claim?.expiresAt) {
    const expiresAtMs = new Date(claim.expiresAt).getTime();
    if (Number.isFinite(nowMs) && Number.isFinite(expiresAtMs) && expiresAtMs < nowMs) {
      errors.push('envelope-expired');
    }
  }

  const workflowPassed = Array.isArray(claim?.workflow) && claim.workflow.length > 0 && claim.workflow.every(step => step.passed);
  if (!workflowPassed) errors.push('workflow-not-passed');

  const hidden = new Set(claim?.privacy?.hides ?? []);
  const privacyPreserved = [
    'input-address',
    'raw-candidates',
    'raw-clusters',
    'recipient',
    'aoid',
    'phone',
    'exact-private-coordinates',
  ].every(item => hidden.has(item));
  if (!privacyPreserved) errors.push('privacy-boundary-incomplete');

  if (claim?.resolution?.status === 'unresolved' && claim?.policy?.unresolvedPolicy === 'do-not-issue-pid-for-unresolved') {
    warnings.push('unresolved-envelope-has-no-pid');
  }

  return {
    registryVersion: AMN_REGISTRY_VERSION,
    envelopeId: claim?.envelopeId ?? '',
    valid: errors.length === 0,
    workflowPassed,
    privacyPreserved,
    errors,
    warnings,
  };
}

export function createInMemoryAmnRegistry() {
  const records = new Map<string, AmnRegistryRecord>();
  let rejectedEnvelopes = 0;

  function registerEnvelope(envelope: AmnResolutionEnvelope | AmnPublicResolutionEnvelope): AmnRegistryRegistration {
    const publicEnvelope = stripPrivateAmnEnvelopeMaterial(envelope);
    const verification = verifyAmnResolutionEnvelope(publicEnvelope);
    const envelopeId = publicEnvelope.claim?.envelopeId ?? null;

    if (!verification.valid || !envelopeId) {
      rejectedEnvelopes += 1;
      return {
        registryVersion: AMN_REGISTRY_VERSION,
        status: 'rejected',
        envelopeId,
        record: null,
        verification,
        errors: verification.errors,
        warnings: verification.warnings,
      };
    }

    const existing = records.get(envelopeId);
    if (existing) {
      return {
        registryVersion: AMN_REGISTRY_VERSION,
        status: 'already_registered',
        envelopeId,
        record: existing,
        verification,
        errors: [],
        warnings: verification.warnings,
      };
    }

    const record: AmnRegistryRecord = {
      registryVersion: AMN_REGISTRY_VERSION,
      envelopeId,
      policyHash: publicEnvelope.claim.policyHash,
      evidenceRoot: publicEnvelope.claim.evidenceRoot,
      proofBundleId: publicEnvelope.claim.proofBundleId,
      status: 'active',
      resolutionStatus: publicEnvelope.claim.resolution.status,
      pid: publicEnvelope.claim.resolution.pid,
      rpid: publicEnvelope.claim.resolution.rpid,
      dpid: publicEnvelope.claim.resolution.dpid,
      confidence: publicEnvelope.claim.resolution.confidence,
      registeredAt: nowIso(),
      rawEnvelopeStored: false,
      commitmentHash: hashObject({
        envelopeId,
        policyHash: publicEnvelope.claim.policyHash,
        evidenceRoot: publicEnvelope.claim.evidenceRoot,
        proofBundleId: publicEnvelope.claim.proofBundleId,
        resolution: publicEnvelope.claim.resolution,
      }),
    };
    records.set(envelopeId, record);

    return {
      registryVersion: AMN_REGISTRY_VERSION,
      status: 'registered',
      envelopeId,
      record,
      verification,
      errors: [],
      warnings: verification.warnings,
    };
  }

  function verifyEnvelope(envelopeId: string): AmnEnvelopeVerification {
    const record = records.get(envelopeId);
    if (!record) {
      return {
        registryVersion: AMN_REGISTRY_VERSION,
        envelopeId,
        valid: false,
        workflowPassed: false,
        privacyPreserved: true,
        errors: ['envelope-not-registered'],
        warnings: [],
      };
    }
    return {
      registryVersion: AMN_REGISTRY_VERSION,
      envelopeId,
      valid: true,
      workflowPassed: true,
      privacyPreserved: true,
      errors: [],
      warnings: [],
    };
  }

  function getRecord(envelopeId: string) {
    return records.get(envelopeId) ?? null;
  }

  function getStats() {
    return {
      registryVersion: AMN_REGISTRY_VERSION,
      totalEnvelopes: records.size,
      activeEnvelopes: [...records.values()].filter(record => record.status === 'active').length,
      rejectedEnvelopes,
      rawEnvelopeStorage: 'forbidden',
    };
  }

  return {
    registerEnvelope,
    verifyEnvelope,
    getRecord,
    getStats,
  };
}
