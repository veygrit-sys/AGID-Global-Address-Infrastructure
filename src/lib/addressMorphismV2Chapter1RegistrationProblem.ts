export const ADDRESS_MORPHISM_V2_CHAPTER1_REGISTRATION_PROBLEM_VERSION =
  'address-morphism-v2-chapter1-registration-problem-v0.1';

export type Chapter1AddressLayer = 'map_location' | 'address_expression' | 'persistent_identifier';

export type Chapter1ReuseState =
  | 'safe_reuse_ready'
  | 'reference_bottleneck'
  | 'disclosure_bottleneck'
  | 'form_only'
  | 'blocked';

export type Chapter1ServiceAddressRecord = {
  serviceId: string;
  hasSurfaceExpression: boolean;
  hasMapLocation: boolean;
  hasReferentBinding: boolean;
  hasPersistentIdentifier: boolean;
  purposeScoped: boolean;
  disclosureBoundaryDefined: boolean;
  safeReusePolicyDefined: boolean;
  storesRawAddressByDefault: boolean;
};

export type Chapter1ReuseEvaluation = {
  state: Chapter1ReuseState;
  reasons: string[];
  nonClaims: string[];
};

export function buildChapter1RegistrationProblemReport(): {
  version: string;
  executableModelKinds: string[];
  thesis: string;
  nonClaims: string[];
} {
  return {
    version: ADDRESS_MORPHISM_V2_CHAPTER1_REGISTRATION_PROBLEM_VERSION,
    executableModelKinds: [
      'repeated registration bottleneck',
      'map/expression/identifier layer separation',
      'reference reuse readiness gate',
      'purpose scope gate',
      'disclosure boundary gate',
      'raw address over-collection detector',
      'form UX non-claim',
    ],
    thesis:
      'Repeated address entry is a reference reuse and disclosure-boundary problem, not merely an address-form UX problem.',
    nonClaims: [
      'AMT is not merely a checkout optimization.',
      'A normalized expression is not a resolved referent.',
      'A coordinate is not a complete address reference.',
      'A persistent identifier must not expose raw private address content by default.',
      'Safe abstention is a correct output when reuse is not justified.',
    ],
  };
}

export function classifyChapter1AddressObject(input: {
  hasCoordinates?: boolean;
  hasHumanExpression?: boolean;
  stableAcrossSystems?: boolean;
  exposesRawAddress?: boolean;
}): Chapter1AddressLayer {
  if (input.stableAcrossSystems && !input.exposesRawAddress) {
    return 'persistent_identifier';
  }
  if (input.hasCoordinates && !input.hasHumanExpression) {
    return 'map_location';
  }
  return 'address_expression';
}

export function evaluateChapter1ReferenceReuse(record: Chapter1ServiceAddressRecord): Chapter1ReuseEvaluation {
  const reasons: string[] = [];

  if (!record.hasSurfaceExpression) {
    reasons.push('missing-surface-expression');
  }
  if (!record.hasReferentBinding) {
    reasons.push('missing-referent-binding');
  }
  if (!record.hasPersistentIdentifier) {
    reasons.push('missing-persistent-identifier');
  }
  if (!record.purposeScoped) {
    reasons.push('missing-purpose-scope');
  }
  if (!record.disclosureBoundaryDefined) {
    reasons.push('missing-disclosure-boundary');
  }
  if (!record.safeReusePolicyDefined) {
    reasons.push('missing-safe-reuse-policy');
  }
  if (record.storesRawAddressByDefault && !record.disclosureBoundaryDefined) {
    reasons.push('raw-address-over-collection');
  }

  const nonClaims = buildChapter1RegistrationProblemReport().nonClaims;

  if (!record.hasSurfaceExpression) {
    return { state: 'blocked', reasons, nonClaims };
  }
  if (record.storesRawAddressByDefault && !record.disclosureBoundaryDefined) {
    return { state: 'disclosure_bottleneck', reasons, nonClaims };
  }
  if (!record.hasReferentBinding || !record.hasPersistentIdentifier) {
    return { state: 'reference_bottleneck', reasons, nonClaims };
  }
  if (!record.purposeScoped || !record.safeReusePolicyDefined) {
    return { state: 'form_only', reasons, nonClaims };
  }

  return {
    state: 'safe_reuse_ready',
    reasons,
    nonClaims,
  };
}

export function chapter1CanReuseBetweenServices(
  source: Chapter1ServiceAddressRecord,
  target: Chapter1ServiceAddressRecord,
): boolean {
  return (
    evaluateChapter1ReferenceReuse(source).state === 'safe_reuse_ready' &&
    evaluateChapter1ReferenceReuse(target).state === 'safe_reuse_ready' &&
    source.hasReferentBinding &&
    target.hasReferentBinding &&
    source.purposeScoped &&
    target.purposeScoped &&
    source.disclosureBoundaryDefined &&
    target.disclosureBoundaryDefined
  );
}

export function chapter1RegistrationProblemIsOnlyFormUx(record: Chapter1ServiceAddressRecord): false {
  void record;
  return false;
}
