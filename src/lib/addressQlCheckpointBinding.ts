import { createHash } from 'node:crypto';

import type {
  AddressAuthorityKind,
  AddressStateCheckpoint,
} from './addressStateCheckpoint';

export const ADDRESSQL_CHECKPOINT_BINDING_VERSION = 'addressql-checkpoint-binding-v0.1';
export const ADDRESSQL_CHECKPOINT_DIGEST_DOMAIN = 'AGID/AddressQlCheckpoint/v1';
export const ADDRESSQL_PUBLIC_INPUT_DOMAIN = 'AGID/AddressQlPublicInputBinding/v1';
export const ADDRESSQL_CHECKPOINT_BINDING_LIMITS = {
  maxRefs: 16,
  maxZoneIds: 512,
  maxTargetsPerSource: 32,
  maxUtf8BytesPerString: 4096,
} as const;

export type CheckpointBindingRef = {
  authorityKind: AddressAuthorityKind;
  checkpointDigest: string;
  rootHash: string;
  boundaryEpoch: number;
};

export type AddressQlStatementCheckpointBinding = {
  version: typeof ADDRESSQL_CHECKPOINT_BINDING_VERSION;
  claimKind: 'region_membership' | 'postal_equivalent' | 'deliverable';
  purpose: 'delivery' | 'address_login' | 'locker_pickup' | 'research_fixture';
  refs: CheckpointBindingRef[];
  transition: {
    fromBoundaryEpoch: number;
    toBoundaryEpoch: number;
    sourceZoneIds: string[];
    targetZoneIds: string[];
    /** Every source zone must map to at least one target after a split/merge. */
    sourceToTargets: Record<string, string[]>;
    /** Translation referents observed before and after the boundary change. */
    translatedReferentBefore: string;
    translatedReferentAfter: string;
  } | null;
};

export type CheckpointBindingDecision = {
  status: 'accept' | 'manual_review' | 'block';
  errors: string[];
};

function utf8(value: string): Buffer {
  return Buffer.from(value, 'utf8');
}

function isCanonicalUnicode(value: string): boolean {
  return value === value.normalize('NFC');
}

function validateCanonicalScalar(
  value: string | number,
  path: string,
  errors: string[],
): void {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) errors.push(`invalid-canonical-integer:${path}`);
    return;
  }
  if (!isCanonicalUnicode(value)) errors.push(`non-canonical-unicode:${path}`);
  if (utf8(value).length > ADDRESSQL_CHECKPOINT_BINDING_LIMITS.maxUtf8BytesPerString) {
    errors.push(`canonical-string-too-large:${path}`);
  }
}

/**
 * Canonical field encoding: UTF-8 tag and value, each prefixed by an unsigned
 * 32-bit big-endian byte length. This avoids delimiter and concatenation
 * ambiguity without accepting raw address material.
 */
function canonicalField(tag: string, value: string): Buffer {
  const tagBytes = utf8(tag);
  const valueBytes = utf8(value);
  const encoded = Buffer.allocUnsafe(8 + tagBytes.length + valueBytes.length);
  encoded.writeUInt32BE(tagBytes.length, 0);
  tagBytes.copy(encoded, 4);
  encoded.writeUInt32BE(valueBytes.length, 4 + tagBytes.length);
  valueBytes.copy(encoded, 8 + tagBytes.length);
  return encoded;
}

function domainSeparatedDigest(domain: string, fields: Array<[string, string]>): string {
  const hash = createHash('sha256');
  hash.update(canonicalField('domain', domain));
  for (const [tag, value] of fields) hash.update(canonicalField(tag, value));
  return `sha256:${hash.digest('hex')}`;
}

const REQUIRED_AUTHORITIES: Record<
  AddressQlStatementCheckpointBinding['claimKind'],
  AddressAuthorityKind[]
> = {
  region_membership: ['issuer', 'revocation', 'area'],
  postal_equivalent: ['issuer', 'revocation', 'postal_zone', 'translation_profile'],
  deliverable: ['issuer', 'revocation', 'postal_zone', 'translation_profile', 'carrier', 'customs'],
};

export function checkpointDigest(checkpoint: AddressStateCheckpoint): string {
  return domainSeparatedDigest(ADDRESSQL_CHECKPOINT_DIGEST_DOMAIN, [
    ['version', ADDRESSQL_CHECKPOINT_BINDING_VERSION],
    ['logId', checkpoint.logId],
    ['authorityKind', checkpoint.authorityKind],
    ['epoch', String(checkpoint.epoch)],
    ['treeSize', String(checkpoint.treeSize)],
    ['rootHash', checkpoint.rootHash],
    ['policyVersion', checkpoint.policyVersion],
    ['boundaryEpoch', String(checkpoint.boundaryEpoch)],
  ]);
}

export function checkpointBindingPublicInputCommitment(
  binding: AddressQlStatementCheckpointBinding,
): string {
  const refs = [...binding.refs].sort((left, right) =>
    left.authorityKind.localeCompare(right.authorityKind)
    || left.checkpointDigest.localeCompare(right.checkpointDigest),
  );
  const fields: Array<[string, string]> = [
    ['version', binding.version],
    ['claimKind', binding.claimKind],
    ['purpose', binding.purpose],
  ];
  refs.forEach((ref, index) => {
    fields.push(
      [`ref.${index}.authorityKind`, ref.authorityKind],
      [`ref.${index}.checkpointDigest`, ref.checkpointDigest],
      [`ref.${index}.rootHash`, ref.rootHash],
      [`ref.${index}.boundaryEpoch`, String(ref.boundaryEpoch)],
    );
  });
  if (binding.transition) {
    const sourceZoneIds = [...binding.transition.sourceZoneIds].sort();
    const targetZoneIds = [...binding.transition.targetZoneIds].sort();
    fields.push(
      ['transition.fromBoundaryEpoch', String(binding.transition.fromBoundaryEpoch)],
      ['transition.toBoundaryEpoch', String(binding.transition.toBoundaryEpoch)],
      ['transition.sourceZoneIds', JSON.stringify(sourceZoneIds)],
      ['transition.targetZoneIds', JSON.stringify(targetZoneIds)],
      ['transition.translatedReferentBefore', binding.transition.translatedReferentBefore],
      ['transition.translatedReferentAfter', binding.transition.translatedReferentAfter],
    );
    sourceZoneIds.forEach((source, index) => {
      fields.push(
        [`transition.sourceToTargets.${index}.source`, source],
        [`transition.sourceToTargets.${index}.targets`,
          JSON.stringify([...(binding.transition?.sourceToTargets[source] ?? [])].sort())],
      );
    });
  } else {
    fields.push(['transition', 'none']);
  }
  return domainSeparatedDigest(ADDRESSQL_PUBLIC_INPUT_DOMAIN, fields);
}

export function verifyCheckpointBindingPublicInputCommitment(
  binding: AddressQlStatementCheckpointBinding,
  publicInputCommitment: string,
): CheckpointBindingDecision {
  const expected = checkpointBindingPublicInputCommitment(binding);
  return expected === publicInputCommitment
    ? { status: 'accept', errors: [] }
    : { status: 'block', errors: ['public-input-binding-mismatch'] };
}

export function verifyAddressQlCheckpointBinding(
  binding: AddressQlStatementCheckpointBinding,
  checkpoints: AddressStateCheckpoint[],
): CheckpointBindingDecision {
  const errors: string[] = [];
  const byKind = new Map(checkpoints.map(checkpoint => [checkpoint.authorityKind, checkpoint]));

  if (binding.version !== ADDRESSQL_CHECKPOINT_BINDING_VERSION) errors.push('unsupported-binding-version');
  validateCanonicalScalar(binding.claimKind, 'claimKind', errors);
  validateCanonicalScalar(binding.purpose, 'purpose', errors);
  if (binding.refs.length > ADDRESSQL_CHECKPOINT_BINDING_LIMITS.maxRefs) {
    errors.push('too-many-authority-refs');
  }
  binding.refs.forEach((ref, index) => {
    validateCanonicalScalar(ref.authorityKind, `refs.${index}.authorityKind`, errors);
    validateCanonicalScalar(ref.checkpointDigest, `refs.${index}.checkpointDigest`, errors);
    validateCanonicalScalar(ref.rootHash, `refs.${index}.rootHash`, errors);
    validateCanonicalScalar(ref.boundaryEpoch, `refs.${index}.boundaryEpoch`, errors);
  });

  for (const requiredKind of REQUIRED_AUTHORITIES[binding.claimKind]) {
    const matchingRefs = binding.refs.filter(candidate => candidate.authorityKind === requiredKind);
    const ref = matchingRefs[0];
    const checkpoint = byKind.get(requiredKind);
    if (matchingRefs.length > 1) errors.push(`duplicate-authority-ref:${requiredKind}`);
    if (!ref || !checkpoint) {
      errors.push(`missing-authority:${requiredKind}`);
      continue;
    }
    if (ref.rootHash !== checkpoint.rootHash) errors.push(`root-substitution:${requiredKind}`);
    if (ref.checkpointDigest !== checkpointDigest(checkpoint)) errors.push(`checkpoint-substitution:${requiredKind}`);
    if (ref.boundaryEpoch !== checkpoint.boundaryEpoch) errors.push(`boundary-epoch-replay:${requiredKind}`);
  }

  const relevantEpochs = binding.refs
    .filter(ref => REQUIRED_AUTHORITIES[binding.claimKind].includes(ref.authorityKind))
    .map(ref => ref.boundaryEpoch);
  if (new Set(relevantEpochs).size > 1 && !binding.transition) errors.push('cross-epoch-transition-required');

  if (binding.transition) {
    const transition = binding.transition;
    validateCanonicalScalar(transition.fromBoundaryEpoch, 'transition.fromBoundaryEpoch', errors);
    validateCanonicalScalar(transition.toBoundaryEpoch, 'transition.toBoundaryEpoch', errors);
    validateCanonicalScalar(
      transition.translatedReferentBefore,
      'transition.translatedReferentBefore',
      errors,
    );
    validateCanonicalScalar(
      transition.translatedReferentAfter,
      'transition.translatedReferentAfter',
      errors,
    );
    if (
      transition.sourceZoneIds.length > ADDRESSQL_CHECKPOINT_BINDING_LIMITS.maxZoneIds
      || transition.targetZoneIds.length > ADDRESSQL_CHECKPOINT_BINDING_LIMITS.maxZoneIds
    ) errors.push('transition-zone-limit-exceeded');
    if (new Set(transition.sourceZoneIds).size !== transition.sourceZoneIds.length) {
      errors.push('duplicate-transition-source-zone');
    }
    if (new Set(transition.targetZoneIds).size !== transition.targetZoneIds.length) {
      errors.push('duplicate-transition-target-zone');
    }
    transition.sourceZoneIds.forEach((zone, index) =>
      validateCanonicalScalar(zone, `transition.sourceZoneIds.${index}`, errors));
    transition.targetZoneIds.forEach((zone, index) =>
      validateCanonicalScalar(zone, `transition.targetZoneIds.${index}`, errors));
    for (const [source, targets] of Object.entries(transition.sourceToTargets)) {
      validateCanonicalScalar(source, 'transition.sourceToTargets.source', errors);
      if (targets.length > ADDRESSQL_CHECKPOINT_BINDING_LIMITS.maxTargetsPerSource) {
        errors.push('transition-target-fanout-limit-exceeded');
      }
      if (new Set(targets).size !== targets.length) errors.push('duplicate-transition-target-edge');
      targets.forEach((target, index) =>
        validateCanonicalScalar(target, `transition.sourceToTargets.target.${index}`, errors));
    }
    const missingSources = transition.sourceZoneIds.filter(source =>
      !transition.sourceToTargets[source]?.length,
    );
    if (missingSources.length > 0) errors.push('transition-not-total');

    const unknownTargets = Object.values(transition.sourceToTargets)
      .flat()
      .filter(target => !transition.targetZoneIds.includes(target));
    if (unknownTargets.length > 0) errors.push('transition-target-outside-codomain');

    if (transition.translatedReferentBefore !== transition.translatedReferentAfter) {
      errors.push('translation-naturality-violation');
    }
    if (transition.toBoundaryEpoch <= transition.fromBoundaryEpoch) {
      errors.push('transition-epoch-not-forward');
    }
  }

  const hardBlock = errors.some(error =>
    error.startsWith('root-substitution:')
    || error.startsWith('checkpoint-substitution:')
    || error.startsWith('boundary-epoch-replay:')
    || error.startsWith('invalid-canonical-')
    || error.startsWith('non-canonical-unicode:')
    || error.startsWith('canonical-string-too-large:')
    || error.includes('limit-exceeded')
    || error.startsWith('too-many-')
    || error.startsWith('duplicate-'),
  );

  return {
    status: errors.length === 0 ? 'accept' : hardBlock ? 'block' : 'manual_review',
    errors,
  };
}

export function createCheckpointBindingRef(
  checkpoint: AddressStateCheckpoint,
): CheckpointBindingRef {
  return {
    authorityKind: checkpoint.authorityKind,
    checkpointDigest: checkpointDigest(checkpoint),
    rootHash: checkpoint.rootHash,
    boundaryEpoch: checkpoint.boundaryEpoch,
  };
}
