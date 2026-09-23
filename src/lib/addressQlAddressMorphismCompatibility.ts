import {
  ADDRESSQL_OFFICIAL_PLACE_NAME_CATALOG_VERSION,
  addressQlPlaceNameSourceState,
  buildAddressQlPlaceNameCatalogReceipt,
  validateAddressQlOfficialPlaceNameCatalog,
  type AddressQlOfficialPlaceNameCatalog,
  type AddressQlPlaceNameCandidate,
  type AddressQlPlaceNameRankingResult,
  type AddressQlPlaceNameSource,
  type AddressQlPlaceNameSourceState,
} from './addressQlOfficialPlaceNames';
import {
  evaluateChapter5CandidatePolicy,
  type CandidatePolicyResult,
  type SourcePolicyState,
} from './addressMorphismV2Chapter5CandidatePolicy';

export const ADDRESSQL_ADDRESS_MORPHISM_COMPATIBILITY_VERSION =
  'addressql-address-morphism-compatibility-v0.1';

export const ADDRESSQL_ADDRESS_MORPHISM_RESEARCH_BASIS = {
  maturity: 'research-c2-external-verification-pending',
  allowedUse: 'schema-and-safety-boundary-only',
  countrySpecificFactsVerified: false,
  postalDeliveryFactsVerified: false,
} as const;

const MAX_PUBLIC_CANDIDATES = 20;

export type AddressQlMorphismEvidenceIntegrity = 'verified' | 'rejected';

export type AddressQlMorphismCandidateCoverageState =
  | 'not-established'
  | 'ambiguous'
  | 'unmatched'
  | 'rejected-evidence';

export type AddressQlMorphismResolutionConclusion =
  | 'resolved'
  | 'ambiguous'
  | 'unresolved'
  | 'rejected-evidence';

export type AddressQlMorphismOperationalDecision =
  | 'manual-review'
  | 'request-administrative-context'
  | 'abstain'
  | 'stop';

export type AddressQlMorphismNameFormState =
  | 'official-name-form'
  | 'standardized-transliteration'
  | 'generated-transliteration'
  | 'not-established';

export type AddressQlMorphismEvidenceSource = {
  sourceId: string;
  authority: string;
  sourceVersion: string;
  datasetDigest: string;
  reuseStatus: AddressQlPlaceNameSource['reuseStatus'];
  checkedAt: string;
  validUntil: string;
  correctionUrl: string;
  state: AddressQlPlaceNameSourceState;
  attestationVerified: boolean;
  holdoutVerified: boolean;
};

export type AddressQlAddressMorphismCompatibilityReport = {
  version: typeof ADDRESSQL_ADDRESS_MORPHISM_COMPATIBILITY_VERSION;
  researchBasis: typeof ADDRESSQL_ADDRESS_MORPHISM_RESEARCH_BASIS;
  catalog: {
    catalogId: string;
    catalogVersion: string;
    catalogDigest: string;
    evidenceIntegrity: AddressQlMorphismEvidenceIntegrity;
  };
  task: {
    countryCode: string;
    targetLanguage: string;
    purpose: 'domestic' | 'international-shipping';
  };
  candidateSet: {
    rankingStatus: AddressQlPlaceNameRankingResult['status'];
    candidatePlaceIds: string[];
    candidateCount: number;
    coverageState: AddressQlMorphismCandidateCoverageState;
    policy: CandidatePolicyResult;
  };
  evidence: {
    sources: AddressQlMorphismEvidenceSource[];
    correctionRouteAvailable: boolean;
  };
  resolution: {
    conclusion: AddressQlMorphismResolutionConclusion;
    operationalDecision: AddressQlMorphismOperationalDecision;
    automaticUseAllowed: false;
    translationPerformed: false;
    nameForm: AddressQlMorphismNameFormState;
    officialAliasPreferred: boolean;
    generatedTransliterationUsed: boolean;
  };
  preservation: {
    officialNameAuthority: 'preserved' | 'approximate' | 'not-established';
    administrativeHierarchy: 'candidate-scoped' | 'not-established';
    temporalEvidence: 'current' | 'review-required' | 'not-established';
  };
  loss: {
    required: boolean;
    reasons: string[];
  };
  disclosure: {
    publicPlaceMetadataOnly: true;
    queryEchoed: false;
    privateDeliveryDataHandled: false;
    personDataHandled: false;
    agidIssued: false;
    aoidHandled: false;
  };
  nonClaims: string[];
};

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function sameStrings(left: readonly string[], right: readonly string[]) {
  const normalizedLeft = uniqueSorted(left);
  const normalizedRight = uniqueSorted(right);
  return normalizedLeft.length === normalizedRight.length
    && normalizedLeft.every((value, index) => value === normalizedRight[index]);
}

function sourcePolicyState(
  sources: readonly AddressQlMorphismEvidenceSource[],
): SourcePolicyState {
  if (!sources.length) return 'fail';
  if (sources.some(source => source.state === 'expired' || source.state === 'invalid')) {
    return 'fail';
  }
  return sources.every(source => source.state === 'active') ? 'pass' : 'unknown';
}

function candidateMatchesCatalog(
  candidate: AddressQlPlaceNameCandidate,
  catalog: AddressQlOfficialPlaceNameCatalog,
) {
  const place = catalog.places.find(item => item.placeId === candidate.placeId);
  if (
    !place
    || place.countryCode !== candidate.countryCode
    || place.hierarchyLevel !== candidate.hierarchyLevel
    || !sameStrings(place.parentPlaceIds, candidate.parentPlaceIds)
    || !candidate.sourceIds.length
  ) {
    return false;
  }
  const sourceMap = new Map(catalog.sources.map(source => [source.sourceId, source]));
  if (candidate.sourceIds.some(sourceId => !sourceMap.has(sourceId))) return false;
  return sameStrings(
    candidate.sourceVersions,
    candidate.sourceIds.map(sourceId => sourceMap.get(sourceId)!.sourceVersion),
  );
}

function evidenceIntegrityIssues(input: {
  catalog: AddressQlOfficialPlaceNameCatalog;
  ranking: AddressQlPlaceNameRankingResult;
  now: string | number | Date;
}) {
  const receipt = buildAddressQlPlaceNameCatalogReceipt(input.catalog);
  const issues: string[] = [];
  if (validateAddressQlOfficialPlaceNameCatalog(input.catalog, input.now).length) {
    issues.push('catalog-validation-failed');
  }
  if (
    input.ranking.version !== ADDRESSQL_OFFICIAL_PLACE_NAME_CATALOG_VERSION
    || input.ranking.catalogId !== receipt.catalogId
    || input.ranking.catalogVersion !== receipt.catalogVersion
    || input.ranking.catalogDigest !== receipt.catalogDigest
  ) {
    issues.push('catalog-receipt-mismatch');
  }
  if (
    input.ranking.candidates.some(candidate =>
      !candidateMatchesCatalog(candidate, input.catalog))
  ) {
    issues.push('candidate-provenance-mismatch');
  }
  return uniqueSorted(issues);
}

function candidateCoverageState(
  status: AddressQlPlaceNameRankingResult['status'],
): AddressQlMorphismCandidateCoverageState {
  switch (status) {
    case 'ranked':
      return 'not-established';
    case 'ambiguous':
      return 'ambiguous';
    case 'unmatched':
      return 'unmatched';
    case 'rejected-evidence':
      return 'rejected-evidence';
  }
}

function resolutionFor(
  status: AddressQlPlaceNameRankingResult['status'],
): Pick<
  AddressQlAddressMorphismCompatibilityReport['resolution'],
  'conclusion' | 'operationalDecision'
> {
  switch (status) {
    case 'ranked':
      return { conclusion: 'resolved', operationalDecision: 'manual-review' };
    case 'ambiguous':
      return {
        conclusion: 'ambiguous',
        operationalDecision: 'request-administrative-context',
      };
    case 'unmatched':
      return { conclusion: 'unresolved', operationalDecision: 'abstain' };
    case 'rejected-evidence':
      return { conclusion: 'rejected-evidence', operationalDecision: 'stop' };
  }
}

function nameFormFor(
  candidates: readonly AddressQlPlaceNameCandidate[],
): AddressQlMorphismNameFormState {
  if (!candidates.length) return 'not-established';
  if (candidates.some(candidate => candidate.generatedTransliterationUsed)) {
    return 'generated-transliteration';
  }
  if (candidates.some(candidate =>
    candidate.displayNameKind === 'standardized-transliteration')) {
    return 'standardized-transliteration';
  }
  return 'official-name-form';
}

function lossReasons(input: {
  status: AddressQlPlaceNameRankingResult['status'];
  candidates: readonly AddressQlPlaceNameCandidate[];
  sourceState: SourcePolicyState;
}) {
  const reasons: string[] = [];
  if (input.status === 'rejected-evidence') reasons.push('evidence-rejected');
  if (input.status === 'ambiguous') reasons.push('administrative-context-required');
  if (input.status === 'unmatched') reasons.push('official-name-form-not-found');
  if (input.candidates.some(candidate => candidate.generatedTransliterationUsed)) {
    reasons.push('generated-transliteration');
  }
  if (input.sourceState !== 'pass') reasons.push('candidate-coverage-not-established');
  return uniqueSorted(reasons);
}

/**
 * Projects a public official-place-name ranking into the Address Morphism
 * vocabulary without retaining the query or exposing any delivery-private data.
 * The projection is deliberately non-authoritative for country facts and never
 * upgrades a ranking into an identity or delivery decision.
 */
export function projectAddressQlPlaceNameRankingToMorphism(input: {
  catalog: AddressQlOfficialPlaceNameCatalog;
  ranking: AddressQlPlaceNameRankingResult;
  now?: string | number | Date;
}): AddressQlAddressMorphismCompatibilityReport {
  const now = input.now ?? Date.now();
  const receipt = buildAddressQlPlaceNameCatalogReceipt(input.catalog);
  const integrityIssues = evidenceIntegrityIssues({
    catalog: input.catalog,
    ranking: input.ranking,
    now,
  });
  const evidenceIntegrity: AddressQlMorphismEvidenceIntegrity = integrityIssues.length
    ? 'rejected'
    : 'verified';
  const rankingStatus = evidenceIntegrity === 'verified'
    ? input.ranking.status
    : 'rejected-evidence';
  const candidates = evidenceIntegrity === 'verified'
    ? input.ranking.candidates.slice(0, MAX_PUBLIC_CANDIDATES)
    : [];
  const candidateSourceIds = uniqueSorted(
    candidates.flatMap(candidate => candidate.sourceIds),
  );
  const sourceMap = new Map(
    input.catalog.sources.map(source => [source.sourceId, source]),
  );
  const sources = candidateSourceIds.map(sourceId => {
    const source = sourceMap.get(sourceId)!;
    return {
      sourceId: source.sourceId,
      authority: source.authority,
      sourceVersion: source.sourceVersion,
      datasetDigest: source.datasetDigest,
      reuseStatus: source.reuseStatus,
      checkedAt: source.checkedAt,
      validUntil: source.validUntil,
      correctionUrl: source.correctionUrl,
      state: addressQlPlaceNameSourceState(source, now),
      attestationVerified: source.attestationVerified,
      holdoutVerified: source.holdoutVerified,
    } satisfies AddressQlMorphismEvidenceSource;
  });
  const sourceState = evidenceIntegrity === 'verified'
    ? sourcePolicyState(sources)
    : 'fail';
  const coverageOk: SourcePolicyState = rankingStatus === 'ranked'
    || rankingStatus === 'ambiguous'
    ? 'unknown'
    : 'fail';
  const policy = evaluateChapter5CandidatePolicy({
    normalized: rankingStatus === 'rejected-evidence' ? 'fail' : 'pass',
    coverageOk,
    licenseOk: sourceState,
    freshnessOk: sourceState,
    privacyOk: 'pass',
    finiteCandidates: candidates.length && candidates.length <= MAX_PUBLIC_CANDIDATES
      ? 'pass'
      : 'fail',
    candidateCount: candidates.length,
    maxCandidates: MAX_PUBLIC_CANDIDATES,
    multilingualExpansionCount: candidates.length,
  });
  const resolution = resolutionFor(rankingStatus);
  const nameForm = nameFormFor(candidates);
  const losses = lossReasons({
    status: rankingStatus,
    candidates,
    sourceState,
  });

  return {
    version: ADDRESSQL_ADDRESS_MORPHISM_COMPATIBILITY_VERSION,
    researchBasis: ADDRESSQL_ADDRESS_MORPHISM_RESEARCH_BASIS,
    catalog: {
      catalogId: receipt.catalogId,
      catalogVersion: receipt.catalogVersion,
      catalogDigest: receipt.catalogDigest,
      evidenceIntegrity,
    },
    task: {
      countryCode: input.ranking.countryCode,
      targetLanguage: input.ranking.targetLanguage,
      purpose: input.ranking.purpose,
    },
    candidateSet: {
      rankingStatus,
      candidatePlaceIds: uniqueSorted(candidates.map(candidate => candidate.placeId)),
      candidateCount: candidates.length,
      coverageState: candidateCoverageState(rankingStatus),
      policy,
    },
    evidence: {
      sources,
      correctionRouteAvailable: sources.length > 0,
    },
    resolution: {
      ...resolution,
      automaticUseAllowed: false,
      translationPerformed: false,
      nameForm,
      officialAliasPreferred: candidates.some(candidate => candidate.officialAliasPreferred),
      generatedTransliterationUsed: candidates.some(
        candidate => candidate.generatedTransliterationUsed,
      ),
    },
    preservation: {
      officialNameAuthority: nameForm === 'official-name-form'
        ? 'preserved'
        : nameForm === 'not-established'
        ? 'not-established'
        : 'approximate',
      administrativeHierarchy: candidates.length
        ? 'candidate-scoped'
        : 'not-established',
      temporalEvidence: sourceState === 'pass'
        ? 'current'
        : sources.length
        ? 'review-required'
        : 'not-established',
    },
    loss: {
      required: losses.length > 0,
      reasons: losses,
    },
    disclosure: {
      publicPlaceMetadataOnly: true,
      queryEchoed: false,
      privateDeliveryDataHandled: false,
      personDataHandled: false,
      agidIssued: false,
      aoidHandled: false,
    },
    nonClaims: uniqueSorted([
      'Research-basis metadata is a compatibility boundary, not external proof of country-specific facts.',
      'A ranked public place name does not establish complete candidate coverage.',
      'This projection does not validate a full address, prove delivery, or prove identity.',
      'No machine translation is performed; official aliases and romanizations remain distinct from translation.',
      'No AGID is issued and no AOID or private delivery information is handled.',
      ...(integrityIssues.length
        ? ['Catalog or ranking provenance did not pass the compatibility evidence gate.']
        : []),
    ]),
  };
}
