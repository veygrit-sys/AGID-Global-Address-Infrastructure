import {
  createPrivateAddressPredicateProof,
  stripPrivateAddressPredicateProofMaterial,
  verifyPrivateAddressPredicateProof,
  type CreatePrivateAddressPredicateProofInput,
  type CreatePrivateAddressPredicateRequest,
  type PrivateAddressPredicateIdentityBindingClaim,
  type PrivateAddressPredicateIdentityProvider,
  type PrivateAddressPredicateProofEnvelope,
  type PrivateAddressPredicateRegion,
  type PrivateAddressPredicateStatement,
  type PrivateAddressPredicateProofVerificationResult,
  type VerifyPrivateAddressPredicateProofOptions,
  type VerifyPrivateAddressPredicateRequirement,
} from './privateAddressPredicateProof';

export const ZK_ADDRESS_PROOF_SCOPE = 'ZK-ADDRESS-PROOF';
export const ZK_RESIDENCE_PROOF_SCOPE = 'ZK-RESIDENCE-PROOF';
export const ZK_DELIVERY_ELIGIBILITY_SCOPE = 'ZK-DELIVERY-ELIGIBILITY';

export type ZkAddressProofEnvelope = PrivateAddressPredicateProofEnvelope;
export type ZkResidenceProofEnvelope = PrivateAddressPredicateProofEnvelope;
export type ZkDeliveryEligibilityProofEnvelope = PrivateAddressPredicateProofEnvelope;
export type ZkDeliveryEligibilityRegion = PrivateAddressPredicateRegion;
export type ZkIdentityBindingClaim = PrivateAddressPredicateIdentityBindingClaim;

export type ZkIdentityExpectation = {
  provider?: PrivateAddressPredicateIdentityProvider;
  issuer?: string;
  audience?: string;
  subjectCommitment?: string;
  bindingCommitment?: string;
};

export type CreateZkAddressProofInput = Omit<CreatePrivateAddressPredicateProofInput, 'predicates' | 'point'>;

export type CreateZkResidenceProofInput = Omit<CreatePrivateAddressPredicateProofInput, 'predicates' | 'point'> & {
  sameAddressGroupId?: string;
  countryCode?: string;
  city?: string;
};

export type CreateZkDeliveryEligibilityProofInput = Omit<CreatePrivateAddressPredicateProofInput, 'predicates'> & {
  deliveryRegion: PrivateAddressPredicateRegion;
};

export type VerifyZkAddressProofOptions = Omit<
  VerifyPrivateAddressPredicateProofOptions,
  'expectedScope' | 'requiredPredicates'
> & {
  expectedScope?: string;
  expectedIdentity?: ZkIdentityExpectation;
};

export type VerifyZkResidenceProofOptions = VerifyZkAddressProofOptions & {
  expectedSameAddressGroupId?: string;
  expectedCountryCode?: string;
  expectedCity?: string;
};

export type VerifyZkDeliveryEligibilityProofOptions = VerifyZkAddressProofOptions & {
  expectedRegionId?: string;
};

function withDefaultScope(scope: string | undefined, defaultScope: string) {
  return scope || defaultScope;
}

function appendVerificationError(
  result: PrivateAddressPredicateProofVerificationResult,
  error: string
): PrivateAddressPredicateProofVerificationResult {
  if (result.errors.includes(error)) return result;
  return {
    ...result,
    valid: false,
    predicatesSatisfied: false,
    errors: [...result.errors, error],
  };
}

function appendProofError(
  result: PrivateAddressPredicateProofVerificationResult,
  error: string
): PrivateAddressPredicateProofVerificationResult {
  if (result.errors.includes(error)) return result;
  return {
    ...result,
    valid: false,
    errors: [...result.errors, error],
  };
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value)
    .normalize('NFKC')
    .replace(/[\u3000\s]+/g, ' ')
    .trim();
}

function normalizeToken(value: unknown) {
  return normalizeText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9:_.*/-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeIdentityProvider(value: unknown): PrivateAddressPredicateIdentityProvider {
  const provider = normalizeToken(value);
  if (
    provider === 'AGID'
    || provider === 'AOID'
    || provider === 'DID'
    || provider === 'OIDC'
    || provider === 'VC'
  ) {
    return provider;
  }
  return 'CUSTOM';
}

function verifyIdentityExpectation(
  envelope: PrivateAddressPredicateProofEnvelope,
  result: PrivateAddressPredicateProofVerificationResult,
  expectedIdentity?: ZkIdentityExpectation
) {
  if (!expectedIdentity) return result;

  const binding = envelope.claim?.identityBinding;
  if (!binding) return appendProofError(result, 'identity-binding-missing');

  let next = result;
  if (expectedIdentity.provider && binding.provider !== normalizeIdentityProvider(expectedIdentity.provider)) {
    next = appendProofError(next, 'identity-provider-mismatch');
  }
  if (expectedIdentity.issuer && binding.issuer !== normalizeText(expectedIdentity.issuer)) {
    next = appendProofError(next, 'identity-issuer-mismatch');
  }
  if (expectedIdentity.audience && binding.audience !== normalizeToken(expectedIdentity.audience)) {
    next = appendProofError(next, 'identity-audience-mismatch');
  }
  if (expectedIdentity.subjectCommitment && binding.subjectCommitment !== expectedIdentity.subjectCommitment) {
    next = appendProofError(next, 'identity-subject-commitment-mismatch');
  }
  if (expectedIdentity.bindingCommitment && binding.bindingCommitment !== expectedIdentity.bindingCommitment) {
    next = appendProofError(next, 'identity-binding-commitment-mismatch');
  }
  return next;
}

function hasAnyPredicate(
  envelope: PrivateAddressPredicateProofEnvelope,
  predicateKinds: PrivateAddressPredicateStatement['kind'][]
) {
  return envelope.claim?.predicates?.some(predicate => predicateKinds.includes(predicate.kind)) === true;
}

function residenceRequirements(options: VerifyZkResidenceProofOptions): VerifyPrivateAddressPredicateRequirement[] {
  const requirements: VerifyPrivateAddressPredicateRequirement[] = [];
  if (options.expectedSameAddressGroupId) {
    requirements.push({ kind: 'same-address-resident', groupId: options.expectedSameAddressGroupId });
  }
  if (options.expectedCountryCode) {
    requirements.push({ kind: 'country-resident', countryCode: options.expectedCountryCode });
  }
  if (options.expectedCity) {
    requirements.push({
      kind: 'city-resident',
      ...(options.expectedCountryCode ? { countryCode: options.expectedCountryCode } : {}),
      city: options.expectedCity,
    });
  }
  return requirements;
}

export async function createZkAddressProof(
  input: CreateZkAddressProofInput
): Promise<ZkAddressProofEnvelope> {
  return createPrivateAddressPredicateProof({
    ...input,
    scope: withDefaultScope(input.scope, ZK_ADDRESS_PROOF_SCOPE),
    predicates: [{ kind: 'verified-address' }],
  });
}

export async function createZkResidenceProof(
  input: CreateZkResidenceProofInput
): Promise<ZkResidenceProofEnvelope> {
  const predicates: CreatePrivateAddressPredicateRequest[] = [];
  if (input.sameAddressGroupId) {
    predicates.push({ kind: 'same-address-resident', groupId: input.sameAddressGroupId });
  }
  if (input.countryCode) {
    predicates.push({ kind: 'country-resident', countryCode: input.countryCode });
  }
  if (input.city) {
    predicates.push({
      kind: 'city-resident',
      ...(input.countryCode ? { countryCode: input.countryCode } : {}),
      city: input.city,
    });
  }
  if (predicates.length === 0) {
    throw new Error('ZK Residence Proof requires a same-address group, country, or city predicate.');
  }

  return createPrivateAddressPredicateProof({
    ...input,
    scope: withDefaultScope(input.scope, ZK_RESIDENCE_PROOF_SCOPE),
    predicates,
  });
}

export async function createZkDeliveryEligibilityProof(
  input: CreateZkDeliveryEligibilityProofInput
): Promise<ZkDeliveryEligibilityProofEnvelope> {
  return createPrivateAddressPredicateProof({
    ...input,
    scope: withDefaultScope(input.scope, ZK_DELIVERY_ELIGIBILITY_SCOPE),
    predicates: [{ kind: 'delivery-region', region: input.deliveryRegion }],
  });
}

export function stripPrivateZkAddressProofMaterial(envelope: ZkAddressProofEnvelope) {
  return stripPrivateAddressPredicateProofMaterial(envelope);
}

export function stripPrivateZkResidenceProofMaterial(envelope: ZkResidenceProofEnvelope) {
  return stripPrivateAddressPredicateProofMaterial(envelope);
}

export function stripPrivateZkDeliveryEligibilityProofMaterial(envelope: ZkDeliveryEligibilityProofEnvelope) {
  return stripPrivateAddressPredicateProofMaterial(envelope);
}

export async function verifyZkAddressProof(
  envelope: ZkAddressProofEnvelope,
  options: VerifyZkAddressProofOptions = {}
): Promise<PrivateAddressPredicateProofVerificationResult> {
  const { expectedIdentity, ...privateOptions } = options;
  const result = await verifyPrivateAddressPredicateProof(envelope, {
    ...privateOptions,
    expectedScope: withDefaultScope(options.expectedScope, ZK_ADDRESS_PROOF_SCOPE),
    requiredPredicates: [{ kind: 'verified-address' }],
  });
  return verifyIdentityExpectation(envelope, result, expectedIdentity);
}

export async function verifyZkResidenceProof(
  envelope: ZkResidenceProofEnvelope,
  options: VerifyZkResidenceProofOptions = {}
): Promise<PrivateAddressPredicateProofVerificationResult> {
  const { expectedIdentity, ...privateOptions } = options;
  const result = await verifyPrivateAddressPredicateProof(envelope, {
    ...privateOptions,
    expectedScope: withDefaultScope(options.expectedScope, ZK_RESIDENCE_PROOF_SCOPE),
    requiredPredicates: residenceRequirements(options),
  });

  if (!hasAnyPredicate(envelope, ['same-address-resident', 'country-resident', 'city-resident'])) {
    return appendVerificationError(result, 'residence-predicate-missing');
  }
  return verifyIdentityExpectation(envelope, result, expectedIdentity);
}

export async function verifyZkDeliveryEligibilityProof(
  envelope: ZkDeliveryEligibilityProofEnvelope,
  options: VerifyZkDeliveryEligibilityProofOptions = {}
): Promise<PrivateAddressPredicateProofVerificationResult> {
  const { expectedIdentity, ...privateOptions } = options;
  const requiredPredicates = options.expectedRegionId
    ? [{ kind: 'delivery-region' as const, regionId: options.expectedRegionId }]
    : [];
  const result = await verifyPrivateAddressPredicateProof(envelope, {
    ...privateOptions,
    expectedScope: withDefaultScope(options.expectedScope, ZK_DELIVERY_ELIGIBILITY_SCOPE),
    requiredPredicates,
  });

  if (!hasAnyPredicate(envelope, ['delivery-region'])) {
    return appendVerificationError(result, 'delivery-eligibility-predicate-missing');
  }
  return verifyIdentityExpectation(envelope, result, expectedIdentity);
}
