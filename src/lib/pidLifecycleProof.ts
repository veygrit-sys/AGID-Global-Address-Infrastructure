export const PID_LIFECYCLE_PROOF_VERSION = 'pid-lifecycle-proof-v1';
export const PID_LIFECYCLE_SIGNATURE_ALGORITHM = 'HMAC-SHA-256';
export const PID_LIFECYCLE_COMMITMENT_ALGORITHM = 'sha256-salted-pid-lifecycle-commitment-v1';
export const PID_LIFECYCLE_WORKFLOW_VERSION = 'address-morphism-pid-lifecycle-v1';

export type PidLifecycleOperationKind = 'history-update' | 'merge' | 'split';

export type PidLifecycleStatus =
  | 'verified'
  | 'partial'
  | 'retired'
  | 'redirected'
  | 'merged'
  | 'split';

export type PidLifecycleActorScope = 'owner-device' | 'server-audit' | 'local-only';

export type PidLifecyclePrivacyField =
  | 'history-roots'
  | 'raw-history-events'
  | 'raw-candidates'
  | 'raw-clusters'
  | 'split-partitions'
  | 'address'
  | 'recipient'
  | 'aoid'
  | 'owner-device-secret'
  | 'proof-salt';

export type PidLifecycleHistoryWitness = {
  previousHistoryRoot: string;
  nextHistoryRoot: string;
  previousSequence: number;
  nextSequence: number;
  eventCount: number;
  updatedAt?: Date | string;
  actorScope?: PidLifecycleActorScope;
};

export type PidHistoryUpdateOperationWitness = {
  kind: 'history-update';
  pid: string;
  previousStatus: PidLifecycleStatus;
  nextStatus: PidLifecycleStatus;
  reasonCode?: string;
  hiddenEventIds?: string[];
};

export type PidMergeConflictResolution = 'same-place' | 'manual-audit' | 'delivery-evidence';

export type PidMergeOperationWitness = {
  kind: 'merge';
  fromPids: string[];
  intoPid: string;
  reasonCode?: string;
  hiddenSourceHistoryRoots?: string[];
  hiddenTargetHistoryRoot?: string;
  allSourcePidsRetired: boolean;
  targetLineageIncludesSources: boolean;
  conflictResolution: PidMergeConflictResolution;
};

export type PidSplitPartitionWitness = {
  targetPid: string;
  hiddenCandidateIds: string[];
};

export type PidSplitOperationWitness = {
  kind: 'split';
  sourcePid: string;
  targetPids: string[];
  reasonCode?: string;
  partitions: PidSplitPartitionWitness[];
  sourcePidRetired: boolean;
  targetLineageIncludesSource: boolean;
};

export type PidLifecycleOperationWitness =
  | PidHistoryUpdateOperationWitness
  | PidMergeOperationWitness
  | PidSplitOperationWitness;

export type PidLifecycleCommitments = {
  historyTransition: string;
  operationWitness: string;
  lineageWitness: string;
};

export type PidLifecycleProofHint = {
  zkReady: true;
  zkpGenerated: false;
  statement: 'pid-history-update-merge-split-gates-passed-with-hidden-witnesses';
};

export type PidLifecycleClaim = {
  version: typeof PID_LIFECYCLE_PROOF_VERSION;
  workflowVersion: typeof PID_LIFECYCLE_WORKFLOW_VERSION;
  operation: {
    kind: PidLifecycleOperationKind;
    primaryPid: string;
    sourcePids?: string[];
    targetPids?: string[];
    reasonCode: string;
  };
  issuedAt: string;
  expiresAt?: string;
  history: {
    previousSequence: number;
    nextSequence: number;
    eventCount: number;
    updatedAt: string;
    actorScope: PidLifecycleActorScope;
  };
  commitments: PidLifecycleCommitments;
  policy: {
    sequenceAdvancedByEventCount: boolean;
    historyRootChanged: boolean;
    mergeSourcesRetired?: boolean;
    splitSourceRetired?: boolean;
    lineagePreserved?: boolean;
    partitionsDisjoint?: boolean;
    partitionCount?: number;
    partitionAssignments?: number;
    conflictResolution?: PidMergeConflictResolution;
  };
  privacy: {
    hides: PidLifecyclePrivacyField[];
    reveals: Array<
      | 'operation-kind'
      | 'pid-lineage'
      | 'history-sequence'
      | 'event-count'
      | 'policy-gates'
      | 'commitments'
      | 'issuer'
    >;
  };
  proofHint: PidLifecycleProofHint;
};

export type PidLifecycleSignature = {
  algorithm: typeof PID_LIFECYCLE_SIGNATURE_ALGORITHM;
  issuerId: string;
  value: string;
};

export type PidLifecycleEnvelope = {
  claim: PidLifecycleClaim;
  signature: PidLifecycleSignature;
  privateLifecycleSalt?: string;
  localCacheKey?: string;
};

export type CreatePidLifecycleProofInput = {
  issuerId: string;
  issuerSecret: string;
  operation: PidLifecycleOperationWitness;
  history: PidLifecycleHistoryWitness;
  issuedAt?: Date | string;
  ttlSeconds?: number;
  privateLifecycleSalt?: string;
};

export type VerifyPidLifecycleProofOptions = {
  issuerId?: string;
  issuerSecret?: string;
  expectedKind?: PidLifecycleOperationKind;
  expectedPrimaryPid?: string;
  now?: Date | string;
};

export type PidLifecycleVerificationResult = {
  valid: boolean;
  signatureValid: boolean | null;
  expired: boolean;
  lifecyclePassed: boolean;
  privacyPreserved: boolean;
  proofCost: 'none';
  errors: string[];
  warnings: string[];
};

const PID_PATTERN = /^AMT-[0-9A-F]{32}$/;
const textEncoder = new TextEncoder();

function getCrypto() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle || !cryptoApi.getRandomValues) {
    throw new Error('Web Crypto API is required for PID lifecycle proofs.');
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

function normalizePid(value: unknown) {
  return normalizeText(value).toUpperCase();
}

function normalizeReasonCode(value: unknown) {
  const text = normalizeText(value || 'lifecycle-update').toLowerCase();
  return text.replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'lifecycle-update';
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

function assertSafeInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`PID lifecycle proof requires an integer ${label}.`);
  }
}

function assertValidPid(pid: string, label: string) {
  if (!PID_PATTERN.test(pid)) {
    throw new Error(`PID lifecycle proof requires a valid ${label}.`);
  }
}

function assertUniquePids(pids: string[], label: string) {
  const seen = new Set(pids);
  if (seen.size !== pids.length) {
    throw new Error(`PID lifecycle proof requires distinct ${label}.`);
  }
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

function generateLifecycleSalt(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

async function saltedCommitment(kind: keyof PidLifecycleCommitments, salt: string, value: unknown) {
  return sha256Base64Url(stableStringify({
    algorithm: PID_LIFECYCLE_COMMITMENT_ALGORITHM,
    kind,
    salt,
    value,
  }));
}

function signingPayload(claim: PidLifecycleClaim) {
  return stableStringify(claim);
}

function normalizeHistory(input: PidLifecycleHistoryWitness, issuedAt: string) {
  const previousSequence = Math.trunc(input.previousSequence);
  const nextSequence = Math.trunc(input.nextSequence);
  const eventCount = Math.trunc(input.eventCount);
  assertSafeInteger(previousSequence, 'previousSequence');
  assertSafeInteger(nextSequence, 'nextSequence');
  assertSafeInteger(eventCount, 'eventCount');
  if (previousSequence < 0 || nextSequence < 0 || eventCount < 1) {
    throw new Error('PID lifecycle proof requires a positive history transition.');
  }
  if (nextSequence !== previousSequence + eventCount) {
    throw new Error('PID lifecycle proof requires nextSequence to advance by eventCount.');
  }

  const previousHistoryRoot = normalizeText(input.previousHistoryRoot);
  const nextHistoryRoot = normalizeText(input.nextHistoryRoot);
  if (!previousHistoryRoot || !nextHistoryRoot || previousHistoryRoot === nextHistoryRoot) {
    throw new Error('PID lifecycle proof requires changed hidden history roots.');
  }

  return {
    previousHistoryRoot,
    nextHistoryRoot,
    previousSequence,
    nextSequence,
    eventCount,
    updatedAt: input.updatedAt ? toIsoDate(input.updatedAt) : issuedAt,
    actorScope: input.actorScope ?? 'server-audit',
  };
}

function normalizePartitionIds(partitions: PidSplitPartitionWitness[]) {
  return partitions.map(partition => ({
    targetPid: normalizePid(partition.targetPid),
    hiddenCandidateIds: partition.hiddenCandidateIds.map(normalizeText).filter(Boolean),
  }));
}

function operationClaim(operation: PidLifecycleOperationWitness): PidLifecycleClaim['operation'] {
  if (operation.kind === 'history-update') {
    return {
      kind: operation.kind,
      primaryPid: normalizePid(operation.pid),
      reasonCode: normalizeReasonCode(operation.reasonCode),
    };
  }

  if (operation.kind === 'merge') {
    return {
      kind: operation.kind,
      primaryPid: normalizePid(operation.intoPid),
      sourcePids: operation.fromPids.map(normalizePid),
      reasonCode: normalizeReasonCode(operation.reasonCode),
    };
  }

  return {
    kind: operation.kind,
    primaryPid: normalizePid(operation.sourcePid),
    targetPids: operation.targetPids.map(normalizePid),
    reasonCode: normalizeReasonCode(operation.reasonCode),
  };
}

function lineageWitness(operation: PidLifecycleOperationWitness) {
  if (operation.kind === 'history-update') {
    return {
      kind: operation.kind,
      pid: normalizePid(operation.pid),
      previousStatus: operation.previousStatus,
      nextStatus: operation.nextStatus,
      hiddenEventIds: (operation.hiddenEventIds ?? []).map(normalizeText).filter(Boolean).sort(),
    };
  }

  if (operation.kind === 'merge') {
    return {
      kind: operation.kind,
      fromPids: operation.fromPids.map(normalizePid).sort(),
      intoPid: normalizePid(operation.intoPid),
      hiddenSourceHistoryRoots: (operation.hiddenSourceHistoryRoots ?? []).map(normalizeText).filter(Boolean).sort(),
      hiddenTargetHistoryRoot: normalizeText(operation.hiddenTargetHistoryRoot),
      allSourcePidsRetired: operation.allSourcePidsRetired,
      targetLineageIncludesSources: operation.targetLineageIncludesSources,
      conflictResolution: operation.conflictResolution,
    };
  }

  return {
    kind: operation.kind,
    sourcePid: normalizePid(operation.sourcePid),
    targetPids: operation.targetPids.map(normalizePid).sort(),
    partitions: normalizePartitionIds(operation.partitions).map(partition => ({
      targetPid: partition.targetPid,
      hiddenCandidateIds: [...partition.hiddenCandidateIds].sort(),
    })),
    sourcePidRetired: operation.sourcePidRetired,
    targetLineageIncludesSource: operation.targetLineageIncludesSource,
  };
}

function validateHistoryUpdate(operation: PidHistoryUpdateOperationWitness) {
  const pid = normalizePid(operation.pid);
  assertValidPid(pid, 'history update PID');
  if (!operation.previousStatus || !operation.nextStatus) {
    throw new Error('PID lifecycle proof requires history update statuses.');
  }
}

function validateMerge(operation: PidMergeOperationWitness) {
  const fromPids = operation.fromPids.map(normalizePid);
  const intoPid = normalizePid(operation.intoPid);
  if (fromPids.length < 1) {
    throw new Error('PID lifecycle proof requires at least one source PID for merge.');
  }
  fromPids.forEach(pid => assertValidPid(pid, 'merge source PID'));
  assertValidPid(intoPid, 'merge target PID');
  assertUniquePids(fromPids, 'merge source PIDs');
  if (fromPids.includes(intoPid)) {
    throw new Error('PID lifecycle proof requires merge target outside retired source PIDs.');
  }
  if (!operation.allSourcePidsRetired) {
    throw new Error('PID lifecycle proof requires retired source PIDs for merge.');
  }
  if (!operation.targetLineageIncludesSources) {
    throw new Error('PID lifecycle proof requires merge lineage preservation.');
  }
  if (!['same-place', 'manual-audit', 'delivery-evidence'].includes(operation.conflictResolution)) {
    throw new Error('PID lifecycle proof requires a supported merge conflict resolution.');
  }
}

function validateSplit(operation: PidSplitOperationWitness) {
  const sourcePid = normalizePid(operation.sourcePid);
  const targetPids = operation.targetPids.map(normalizePid);
  assertValidPid(sourcePid, 'split source PID');
  if (targetPids.length < 2) {
    throw new Error('PID lifecycle proof requires at least two target PIDs for split.');
  }
  targetPids.forEach(pid => assertValidPid(pid, 'split target PID'));
  assertUniquePids(targetPids, 'split target PIDs');
  if (targetPids.includes(sourcePid)) {
    throw new Error('PID lifecycle proof requires split targets outside the retired source PID.');
  }
  if (!operation.sourcePidRetired) {
    throw new Error('PID lifecycle proof requires retired source PID for split.');
  }
  if (!operation.targetLineageIncludesSource) {
    throw new Error('PID lifecycle proof requires split lineage preservation.');
  }

  const partitions = normalizePartitionIds(operation.partitions);
  if (partitions.length !== targetPids.length) {
    throw new Error('PID lifecycle proof requires one hidden split partition per target PID.');
  }
  const partitionTargets = partitions.map(partition => partition.targetPid);
  assertUniquePids(partitionTargets, 'split partition targets');
  if (!targetPids.every(pid => partitionTargets.includes(pid))) {
    throw new Error('PID lifecycle proof requires split partitions to match target PIDs.');
  }

  const assignments = partitions.flatMap(partition => partition.hiddenCandidateIds);
  if (assignments.length < targetPids.length || partitions.some(partition => partition.hiddenCandidateIds.length < 1)) {
    throw new Error('PID lifecycle proof requires non-empty hidden split partitions.');
  }
  if (new Set(assignments).size !== assignments.length) {
    throw new Error('PID lifecycle proof requires disjoint partitions for split.');
  }
}

function validateOperation(operation: PidLifecycleOperationWitness) {
  if (operation.kind === 'history-update') validateHistoryUpdate(operation);
  else if (operation.kind === 'merge') validateMerge(operation);
  else validateSplit(operation);
}

function policyFor(operation: PidLifecycleOperationWitness, history: ReturnType<typeof normalizeHistory>): PidLifecycleClaim['policy'] {
  const base = {
    sequenceAdvancedByEventCount: history.nextSequence === history.previousSequence + history.eventCount,
    historyRootChanged: history.previousHistoryRoot !== history.nextHistoryRoot,
  };

  if (operation.kind === 'merge') {
    return {
      ...base,
      mergeSourcesRetired: operation.allSourcePidsRetired,
      lineagePreserved: operation.targetLineageIncludesSources,
      conflictResolution: operation.conflictResolution,
    };
  }

  if (operation.kind === 'split') {
    const partitions = normalizePartitionIds(operation.partitions);
    const assignments = partitions.flatMap(partition => partition.hiddenCandidateIds);
    return {
      ...base,
      splitSourceRetired: operation.sourcePidRetired,
      lineagePreserved: operation.targetLineageIncludesSource,
      partitionsDisjoint: new Set(assignments).size === assignments.length,
      partitionCount: partitions.length,
      partitionAssignments: assignments.length,
    };
  }

  return base;
}

function publicLifecyclePassed(claim: PidLifecycleClaim) {
  if (!claim.policy.sequenceAdvancedByEventCount || !claim.policy.historyRootChanged) return false;
  const operation = claim.operation;
  if (!PID_PATTERN.test(operation.primaryPid)) return false;

  if (operation.kind === 'history-update') return true;

  if (operation.kind === 'merge') {
    const sourcePids = operation.sourcePids ?? [];
    return sourcePids.length >= 1
      && sourcePids.every(pid => PID_PATTERN.test(pid))
      && new Set(sourcePids).size === sourcePids.length
      && !sourcePids.includes(operation.primaryPid)
      && claim.policy.mergeSourcesRetired === true
      && claim.policy.lineagePreserved === true;
  }

  const targetPids = operation.targetPids ?? [];
  return targetPids.length >= 2
    && targetPids.every(pid => PID_PATTERN.test(pid))
    && new Set(targetPids).size === targetPids.length
    && !targetPids.includes(operation.primaryPid)
    && claim.policy.splitSourceRetired === true
    && claim.policy.lineagePreserved === true
    && claim.policy.partitionsDisjoint === true
    && claim.policy.partitionCount === targetPids.length
    && (claim.policy.partitionAssignments ?? 0) >= targetPids.length;
}

function privacyFields() {
  return [
    'history-roots',
    'raw-history-events',
    'raw-candidates',
    'raw-clusters',
    'split-partitions',
    'address',
    'recipient',
    'aoid',
    'owner-device-secret',
    'proof-salt',
  ] satisfies PidLifecyclePrivacyField[];
}

export async function createPidLifecycleProof(
  input: CreatePidLifecycleProofInput
): Promise<PidLifecycleEnvelope> {
  validateOperation(input.operation);
  const issuedAt = toIsoDate(input.issuedAt);
  const history = normalizeHistory(input.history, issuedAt);
  const privateLifecycleSalt = input.privateLifecycleSalt ?? generateLifecycleSalt();
  const operation = operationClaim(input.operation);

  const commitments: PidLifecycleCommitments = {
    historyTransition: await saltedCommitment('historyTransition', privateLifecycleSalt, history),
    operationWitness: await saltedCommitment('operationWitness', privateLifecycleSalt, {
      operation: input.operation,
      reasonCode: operation.reasonCode,
    }),
    lineageWitness: await saltedCommitment('lineageWitness', privateLifecycleSalt, lineageWitness(input.operation)),
  };

  const claim: PidLifecycleClaim = {
    version: PID_LIFECYCLE_PROOF_VERSION,
    workflowVersion: PID_LIFECYCLE_WORKFLOW_VERSION,
    operation,
    issuedAt,
    ...(input.ttlSeconds ? { expiresAt: addSeconds(issuedAt, input.ttlSeconds) } : {}),
    history: {
      previousSequence: history.previousSequence,
      nextSequence: history.nextSequence,
      eventCount: history.eventCount,
      updatedAt: history.updatedAt,
      actorScope: history.actorScope,
    },
    commitments,
    policy: policyFor(input.operation, history),
    privacy: {
      hides: privacyFields(),
      reveals: ['operation-kind', 'pid-lineage', 'history-sequence', 'event-count', 'policy-gates', 'commitments', 'issuer'],
    },
    proofHint: {
      zkReady: true,
      zkpGenerated: false,
      statement: 'pid-history-update-merge-split-gates-passed-with-hidden-witnesses',
    },
  };

  return {
    claim,
    privateLifecycleSalt,
    localCacheKey: `pid-lifecycle:${await sha256Base64Url(stableStringify({
      operation: claim.operation,
      history: claim.history,
      commitments,
      issuerId: input.issuerId,
    }))}`,
    signature: {
      algorithm: PID_LIFECYCLE_SIGNATURE_ALGORITHM,
      issuerId: input.issuerId,
      value: await hmacSha256Base64Url(input.issuerSecret, signingPayload(claim)),
    },
  };
}

export function stripPrivatePidLifecycleProofMaterial(
  envelope: PidLifecycleEnvelope
): Omit<PidLifecycleEnvelope, 'privateLifecycleSalt' | 'localCacheKey'> {
  return {
    claim: envelope.claim,
    signature: envelope.signature,
  };
}

async function verifyPidLifecycleProofUnchecked(
  envelope: PidLifecycleEnvelope,
  options: VerifyPidLifecycleProofOptions = {}
): Promise<PidLifecycleVerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const claim = envelope.claim;

  if (claim.version !== PID_LIFECYCLE_PROOF_VERSION) errors.push('unsupported-pid-lifecycle-version');
  if (claim.workflowVersion !== PID_LIFECYCLE_WORKFLOW_VERSION) errors.push('unsupported-pid-lifecycle-workflow-version');
  if (envelope.signature.algorithm !== PID_LIFECYCLE_SIGNATURE_ALGORITHM) errors.push('unsupported-signature-algorithm');
  if (options.issuerId && options.issuerId !== envelope.signature.issuerId) errors.push('issuer-mismatch');
  if (options.expectedKind && options.expectedKind !== claim.operation.kind) errors.push('operation-kind-mismatch');
  if (options.expectedPrimaryPid && normalizePid(options.expectedPrimaryPid) !== claim.operation.primaryPid) {
    errors.push('primary-pid-mismatch');
  }

  if (!PID_PATTERN.test(claim.operation.primaryPid)) errors.push('invalid-primary-pid');
  if (claim.operation.sourcePids?.some(pid => !PID_PATTERN.test(pid))) errors.push('invalid-source-pid');
  if (claim.operation.targetPids?.some(pid => !PID_PATTERN.test(pid))) errors.push('invalid-target-pid');

  const sequenceAdvanced = claim.history.nextSequence === claim.history.previousSequence + claim.history.eventCount;
  if (!sequenceAdvanced || !claim.policy.sequenceAdvancedByEventCount) errors.push('history-sequence-invalid');
  if (claim.history.eventCount < 1) errors.push('history-event-count-invalid');
  if (!claim.policy.historyRootChanged) errors.push('history-root-not-changed');

  const lifecyclePassed = publicLifecyclePassed(claim);
  if (!lifecyclePassed) errors.push('pid-lifecycle-gates-not-passed');

  const now = options.now ? new Date(options.now) : new Date();
  const expired = Boolean(claim.expiresAt && new Date(claim.expiresAt).getTime() <= now.getTime());
  if (expired) errors.push('pid-lifecycle-proof-expired');

  let signatureValid: boolean | null = null;
  if (options.issuerSecret) {
    signatureValid = await verifyHmacSha256(options.issuerSecret, signingPayload(claim), envelope.signature.value);
    if (!signatureValid) errors.push('signature-invalid');
  } else {
    warnings.push('issuer-secret-not-provided');
  }

  const publicEnvelope = stripPrivatePidLifecycleProofMaterial(envelope);
  const publicText = stableStringify(publicEnvelope);
  const hiddenKeysAbsent = !/"(?:previousHistoryRoot|nextHistoryRoot|hiddenEventIds|hiddenCandidateIds|hiddenSourceHistoryRoots|hiddenTargetHistoryRoot|partitions|privateLifecycleSalt|localCacheKey|inputAddress|addressText|recipient|phone|aoid|ownerSecret|deviceSecret)"\s*:/iu.test(publicText);
  const privacyPreserved = !('privateLifecycleSalt' in envelope)
    && !('localCacheKey' in envelope)
    && hiddenKeysAbsent
    && privacyFields().every(field => claim.privacy.hides.includes(field));
  if (!privacyPreserved) errors.push('privacy-fields-not-hidden');

  return {
    valid: errors.length === 0 && signatureValid === true,
    signatureValid,
    expired,
    lifecyclePassed,
    privacyPreserved,
    proofCost: 'none',
    errors,
    warnings,
  };
}

export async function verifyPidLifecycleProof(
  envelope: PidLifecycleEnvelope,
  options: VerifyPidLifecycleProofOptions = {}
): Promise<PidLifecycleVerificationResult> {
  try {
    return await verifyPidLifecycleProofUnchecked(envelope, options);
  } catch {
    return {
      valid: false,
      signatureValid: null,
      expired: false,
      lifecyclePassed: false,
      privacyPreserved: false,
      proofCost: 'none',
      errors: ['malformed-pid-lifecycle-proof'],
      warnings: ['verification-runtime-guarded'],
    };
  }
}
