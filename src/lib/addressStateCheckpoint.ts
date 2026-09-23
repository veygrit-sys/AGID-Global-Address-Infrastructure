export const ADDRESS_STATE_CHECKPOINT_VERSION = 'address-state-checkpoint-v0.1';

export type AddressAuthorityKind =
  | 'issuer'
  | 'revocation'
  | 'area'
  | 'postal_zone'
  | 'translation_profile'
  | 'carrier'
  | 'customs';

export type AddressStateCheckpoint = {
  version: typeof ADDRESS_STATE_CHECKPOINT_VERSION;
  logId: string;
  authorityKind: AddressAuthorityKind;
  epoch: number;
  treeSize: number;
  rootHash: string;
  previousRootHash: string | null;
  policyVersion: string;
  boundaryEpoch: number;
  issuedAt: string;
  maxMergeDelaySeconds: number;
};

export type CheckpointEvidence = {
  signatureVerified: boolean;
  inclusionVerified: boolean;
  consistencyVerified: boolean;
  witnessCosignaturesVerified: number;
  observedAt: string;
  /** Audit exchange must never contain a queried address, holder, or status index. */
  sharedMetadataKinds: string[];
};

export type CheckpointPolicy = {
  expectedLogId: string;
  expectedAuthorityKind: AddressAuthorityKind;
  expectedPolicyVersion: string;
  expectedBoundaryEpoch: number;
  minimumWitnessCosignatures: number;
  now: string;
};

export type CheckpointDecision = {
  status: 'accept' | 'manual_review' | 'block';
  errors: string[];
  forkEvidence: boolean;
};

const PRIVATE_AUDIT_METADATA = /address|recipient|holder|credential|status[_-]?index|witness|private[_-]?key/i;

function validIsoInstant(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)
    && Number.isFinite(Date.parse(value));
}

export function verifyAddressStateCheckpoint(
  checkpoint: AddressStateCheckpoint,
  evidence: CheckpointEvidence,
  policy: CheckpointPolicy,
  previous?: AddressStateCheckpoint,
  peerViews: AddressStateCheckpoint[] = [],
): CheckpointDecision {
  const errors: string[] = [];

  if (checkpoint.version !== ADDRESS_STATE_CHECKPOINT_VERSION) errors.push('unsupported-version');
  if (checkpoint.logId !== policy.expectedLogId) errors.push('log-id-mismatch');
  if (checkpoint.authorityKind !== policy.expectedAuthorityKind) errors.push('authority-kind-mismatch');
  if (checkpoint.policyVersion !== policy.expectedPolicyVersion) errors.push('policy-version-mismatch');
  if (checkpoint.boundaryEpoch !== policy.expectedBoundaryEpoch) errors.push('boundary-epoch-mismatch');
  if (!Number.isSafeInteger(checkpoint.epoch) || checkpoint.epoch < 0) errors.push('invalid-epoch');
  if (!Number.isSafeInteger(checkpoint.treeSize) || checkpoint.treeSize < 1) errors.push('invalid-tree-size');
  if (!validIsoInstant(checkpoint.issuedAt) || !validIsoInstant(evidence.observedAt) || !validIsoInstant(policy.now)) {
    errors.push('invalid-time');
  } else {
    const ageSeconds = (Date.parse(policy.now) - Date.parse(checkpoint.issuedAt)) / 1000;
    if (ageSeconds < 0 || ageSeconds > checkpoint.maxMergeDelaySeconds) errors.push('checkpoint-stale-or-future');
  }
  if (!evidence.signatureVerified) errors.push('signature-unverified');
  if (!evidence.inclusionVerified) errors.push('inclusion-unverified');
  if (previous && !evidence.consistencyVerified) errors.push('consistency-unverified');
  if (evidence.witnessCosignaturesVerified < policy.minimumWitnessCosignatures) errors.push('insufficient-witness-quorum');
  if (evidence.sharedMetadataKinds.some(kind => PRIVATE_AUDIT_METADATA.test(kind))) errors.push('private-audit-metadata');

  if (previous) {
    if (previous.logId !== checkpoint.logId || previous.authorityKind !== checkpoint.authorityKind) errors.push('previous-log-mismatch');
    if (checkpoint.epoch <= previous.epoch) errors.push('epoch-rollback');
    if (checkpoint.treeSize < previous.treeSize) errors.push('tree-size-rollback');
    if (checkpoint.previousRootHash !== previous.rootHash) errors.push('previous-root-mismatch');
    if (checkpoint.boundaryEpoch < previous.boundaryEpoch) errors.push('boundary-rollback');
  }

  const forkEvidence = peerViews.some(peer =>
    peer.logId === checkpoint.logId
    && peer.epoch === checkpoint.epoch
    && peer.treeSize === checkpoint.treeSize
    && peer.rootHash !== checkpoint.rootHash,
  );
  if (forkEvidence) errors.push('signed-fork-detected');

  const hardBlock = forkEvidence
    || errors.some(error => ['signature-unverified', 'inclusion-unverified', 'private-audit-metadata', 'epoch-rollback', 'tree-size-rollback'].includes(error));

  return {
    status: errors.length === 0 ? 'accept' : hardBlock ? 'block' : 'manual_review',
    errors,
    forkEvidence,
  };
}

export function createSyntheticAddressStateCheckpoint(
  overrides: Partial<AddressStateCheckpoint> = {},
): AddressStateCheckpoint {
  return {
    version: ADDRESS_STATE_CHECKPOINT_VERSION,
    logId: 'synthetic:postal-zone-log',
    authorityKind: 'postal_zone',
    epoch: 8,
    treeSize: 128,
    rootHash: 'sha256:synthetic-root-8',
    previousRootHash: 'sha256:synthetic-root-7',
    policyVersion: 'synthetic-policy-v2',
    boundaryEpoch: 4,
    issuedAt: '2026-07-23T00:00:00Z',
    maxMergeDelaySeconds: 86_400,
    ...overrides,
  };
}
