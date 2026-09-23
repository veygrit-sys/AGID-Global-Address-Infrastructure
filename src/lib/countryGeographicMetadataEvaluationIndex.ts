export const COUNTRY_GEOGRAPHIC_METADATA_EVALUATION_INDEX_VERSION =
  'country-geographic-metadata-evaluation-index-v3';

export type AdministrativeKeyKind =
  | 'country'
  | 'first-order-subdivision'
  | 'second-order-subdivision'
  | 'municipality'
  | 'district';

export type AdministrativeCorrectionPathStatus =
  | 'source-specific-confirmed'
  | 'source-record-publisher-contact-confirmed';

export type GeographicMetadataSourceOrigin =
  | 'official-publication'
  | 'maintained-open-source'
  | 'open-source-composite';

export type GeographicMetadataSourceStewardship =
  | 'official-country-or-territory'
  | 'open-source-maintainer';

// Candidate records retain evidence metadata only. They never contain geometry,
// coordinates, locality names, addresses, or delivery data. For non-official
// records, the authority fields identify accountable project stewardship, not a
// governmental authority claim.
export type CountryGeographicMetadataSourceCandidate = {
  countryCode: string;
  sourceId: string;
  sourceOrigin: GeographicMetadataSourceOrigin;
  componentSourceIds: string[];
  sourceUrl: string;
  authorityEvidenceUrl: string;
  authorityStatus: GeographicMetadataSourceStewardship;
  sourceVersion: string;
  versionStatus: 'verified-current';
  reuseLicense: string;
  reuseTermsUrl: string;
  reuseStatus: 'reuse-approved';
  declaredScope: 'country' | 'territory';
  coverageStatus: 'country-or-territory-coverage-evidenced';
  correctionUrl: string;
  correctionPathStatus: AdministrativeCorrectionPathStatus;
  approvalStatus: 'approved-for-synthetic-administrative-evaluation';
  approvedAdministrativeKeyKinds: AdministrativeKeyKind[];
  reviewedAt: string;
  reviewBy: string;
  rawPrivateMaterialStored: false;
};

// The evaluation index accepts synthetic tokens only. A production administrative
// key dataset is a separate, country-specific ingestion and rights-review concern.
export type SyntheticAdministrativeKeyCandidate = {
  keyId: string;
  countryCode: string;
  sourceId: string;
  keyKind: AdministrativeKeyKind;
  syntheticKeyToken: string;
  synthetic: true;
  approvalStatus: 'approved';
};

export type ApprovedCountryGeographicMetadataSource = {
  countryCode: string;
  sourceId: string;
  sourceOrigin: GeographicMetadataSourceOrigin;
  componentSourceIds: string[];
  sourceVersion: string;
  sourceUrl: string;
  authorityEvidenceUrl: string;
  reuseLicense: string;
  reuseTermsUrl: string;
  declaredScope: 'country' | 'territory';
  correctionUrl: string;
  correctionPathStatus: AdministrativeCorrectionPathStatus;
  approvedAdministrativeKeyKinds: AdministrativeKeyKind[];
  reviewedAt: string;
  reviewBy: string;
  syntheticAdministrativeKeyCount: number;
  deliveryClaimsEnabled: false;
};

export type ApprovedSyntheticAdministrativeKey = {
  keyId: string;
  countryCode: string;
  sourceId: string;
  keyKind: AdministrativeKeyKind;
  syntheticKeyToken: string;
  deliveryClaimsEnabled: false;
};

export type BlockedCountryGeographicMetadataCandidate = {
  countryCode: string | null;
  sourceId: string | null;
  reason: string;
};

export type CountryGeographicMetadataEvaluationIndex = {
  indexVersion: typeof COUNTRY_GEOGRAPHIC_METADATA_EVALUATION_INDEX_VERSION;
  sources: ApprovedCountryGeographicMetadataSource[];
  syntheticAdministrativeKeys: ApprovedSyntheticAdministrativeKey[];
  blockedCandidates: BlockedCountryGeographicMetadataCandidate[];
  privacyBoundary: {
    rawAddressDataAllowed: false;
    recipientDataAllowed: false;
    preciseCoordinatesAllowed: false;
    deliveryClaimsEnabled: false;
  };
  nonClaims: string[];
};

// This compact projection is the only geographic index evidence the validation
// engine may consume. It intentionally cannot carry a source URL, key token, or
// geographic payload.
export type CountryGeographicMetadataReadinessEvidence = {
  countryCode: string;
  sourceId: string;
  sourceOrigin: GeographicMetadataSourceOrigin;
  approvedAdministrativeKeyCount: number;
  syntheticAdministrativeEvaluationEligible: true;
  deliveryClaimsEnabled: false;
};

const SOURCE_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,127}$/;
const SYNTHETIC_KEY_ID_PATTERN = /^synthetic-admin-key:[a-z]{2}:[a-z0-9][a-z0-9._-]{0,127}:[a-z0-9][a-z0-9._-]{0,127}$/;
const SYNTHETIC_TOKEN_PATTERN = /^synthetic:[A-Z]{2}:[a-z0-9._-]{1,64}$/;
const ADMINISTRATIVE_KEY_KINDS = new Set<AdministrativeKeyKind>([
  'country',
  'first-order-subdivision',
  'second-order-subdivision',
  'municipality',
  'district',
]);

const SOURCE_FIELDS = new Set([
  'countryCode',
  'sourceId',
  'sourceOrigin',
  'componentSourceIds',
  'sourceUrl',
  'authorityEvidenceUrl',
  'authorityStatus',
  'sourceVersion',
  'versionStatus',
  'reuseLicense',
  'reuseTermsUrl',
  'reuseStatus',
  'declaredScope',
  'coverageStatus',
  'correctionUrl',
  'correctionPathStatus',
  'approvalStatus',
  'approvedAdministrativeKeyKinds',
  'reviewedAt',
  'reviewBy',
  'rawPrivateMaterialStored',
]);

const KEY_FIELDS = new Set([
  'keyId',
  'countryCode',
  'sourceId',
  'keyKind',
  'syntheticKeyToken',
  'synthetic',
  'approvalStatus',
]);

function normalizedCountryCode(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function normalizedSourceId(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return SOURCE_ID_PATTERN.test(normalized) ? normalized : null;
}

function isNonEmptyText(value: unknown, maximumLength = 512) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maximumLength;
}

function isSafeHttpsUrl(value: unknown) {
  if (typeof value !== 'string' || !isNonEmptyText(value, 2_048)) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function timestamp(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
}

function assertOnlyFields(record: Record<string, unknown>, allowedFields: Set<string>, kind: string) {
  const unknownField = Object.keys(record).find(field => !allowedFields.has(field));
  if (unknownField) {
    throw new Error(`${kind} contains disallowed field ${unknownField}; the index is metadata-only`);
  }
}

function sourceGateFailure(candidate: CountryGeographicMetadataSourceCandidate, now: number) {
  const countryCode = normalizedCountryCode(candidate.countryCode);
  const sourceId = normalizedSourceId(candidate.sourceId);
  if (!countryCode) return 'invalid-country-code';
  if (!sourceId) return 'invalid-source-id';
  if (!isSafeHttpsUrl(candidate.sourceUrl) || !isSafeHttpsUrl(candidate.authorityEvidenceUrl)) return 'source-stewardship-evidence-url-required';
  if (!['official-publication', 'maintained-open-source', 'open-source-composite'].includes(candidate.sourceOrigin)) return 'source-origin-required';
  if (!Array.isArray(candidate.componentSourceIds)) return 'source-composition-components-required';
  const componentSourceIds = candidate.componentSourceIds.map(normalizedSourceId);
  if (componentSourceIds.some(componentSourceId => !componentSourceId)) return 'invalid-source-composition-component';
  const uniqueComponentSourceIds = new Set(componentSourceIds);
  if (candidate.sourceOrigin === 'open-source-composite') {
    if (componentSourceIds.length < 2 || uniqueComponentSourceIds.size !== componentSourceIds.length || uniqueComponentSourceIds.has(sourceId)) return 'approved-open-source-composition-components-required';
  } else if (componentSourceIds.length > 0) {
    return 'single-source-component-list-prohibited';
  }
  if (!isNonEmptyText(candidate.sourceVersion, 128) || candidate.versionStatus !== 'verified-current') return 'verified-source-version-required';
  if (!isNonEmptyText(candidate.reuseLicense, 256) || !isSafeHttpsUrl(candidate.reuseTermsUrl) || candidate.reuseStatus !== 'reuse-approved') return 'reuse-terms-required';
  if (candidate.sourceOrigin === 'official-publication' && candidate.authorityStatus !== 'official-country-or-territory') return 'official-authority-evidence-required';
  if (candidate.sourceOrigin !== 'official-publication' && candidate.authorityStatus !== 'open-source-maintainer') return 'open-source-stewardship-evidence-required';
  if (!['country', 'territory'].includes(candidate.declaredScope) || candidate.coverageStatus !== 'country-or-territory-coverage-evidenced') return 'declared-scope-and-coverage-required';
  if (
    !isSafeHttpsUrl(candidate.correctionUrl)
    || ![
      'source-specific-confirmed',
      'source-record-publisher-contact-confirmed',
    ].includes(candidate.correctionPathStatus)
  ) return 'source-record-correction-path-required';
  if (candidate.approvalStatus !== 'approved-for-synthetic-administrative-evaluation') return 'approval-required';
  if (!Array.isArray(candidate.approvedAdministrativeKeyKinds) || !candidate.approvedAdministrativeKeyKinds.length || candidate.approvedAdministrativeKeyKinds.some(kind => !ADMINISTRATIVE_KEY_KINDS.has(kind))) return 'approved-administrative-key-kinds-required';
  if (candidate.rawPrivateMaterialStored !== false) return 'private-material-prohibited';

  const reviewedAt = timestamp(candidate.reviewedAt);
  const reviewBy = timestamp(candidate.reviewBy);
  if (reviewedAt === null || reviewBy === null || reviewBy <= reviewedAt || reviewBy <= now) return 'current-review-required';
  return null;
}

function hasApprovedOpenSourceComposition(
  candidate: CountryGeographicMetadataSourceCandidate,
  approvedSourceCandidates: ReadonlyMap<string, CountryGeographicMetadataSourceCandidate>,
) {
  if (candidate.sourceOrigin !== 'open-source-composite') return true;
  const countryCode = normalizedCountryCode(candidate.countryCode);
  if (!countryCode) return false;
  return candidate.componentSourceIds.every(componentSourceId => {
    const component = approvedSourceCandidates.get(`${countryCode}:${componentSourceId}`);
    return component !== undefined && component.sourceOrigin !== 'open-source-composite';
  });
}

function keyGateFailure(
  candidate: SyntheticAdministrativeKeyCandidate,
  approvedSource: CountryGeographicMetadataSourceCandidate | undefined,
) {
  const countryCode = normalizedCountryCode(candidate.countryCode);
  const sourceId = normalizedSourceId(candidate.sourceId);
  if (!countryCode) return 'invalid-country-code';
  if (!sourceId) return 'invalid-source-id';
  if (!SYNTHETIC_KEY_ID_PATTERN.test(candidate.keyId)) return 'synthetic-key-id-required';
  if (!SYNTHETIC_TOKEN_PATTERN.test(candidate.syntheticKeyToken)) return 'synthetic-key-token-required';
  if (candidate.synthetic !== true || candidate.approvalStatus !== 'approved') return 'approved-synthetic-key-required';
  if (!ADMINISTRATIVE_KEY_KINDS.has(candidate.keyKind)) return 'invalid-administrative-key-kind';
  if (!approvedSource) return 'approved-source-required';
  if (approvedSource.countryCode !== countryCode || approvedSource.sourceId !== sourceId) return 'source-country-mismatch';
  if (!approvedSource.approvedAdministrativeKeyKinds.includes(candidate.keyKind)) return 'key-kind-not-approved-by-source';
  return null;
}

function uniqueSorted<T>(values: readonly T[]) {
  return Array.from(new Set(values)).sort();
}

export function buildCountryGeographicMetadataEvaluationIndex(input: {
  sources: readonly CountryGeographicMetadataSourceCandidate[];
  syntheticAdministrativeKeys: readonly SyntheticAdministrativeKeyCandidate[];
  now?: string | number | Date;
}): CountryGeographicMetadataEvaluationIndex {
  const now = input.now === undefined
    ? Date.now()
    : input.now instanceof Date
      ? input.now.getTime()
      : typeof input.now === 'number'
        ? input.now
        : Date.parse(input.now);
  if (!Number.isFinite(now)) throw new Error('country geographic metadata index now must be a valid timestamp');

  const blockedCandidates: BlockedCountryGeographicMetadataCandidate[] = [];
  const sourceCandidates = input.sources.map(candidate => {
    assertOnlyFields(candidate as unknown as Record<string, unknown>, SOURCE_FIELDS, 'geographic source candidate');
    return candidate;
  });
  const duplicateSourceKeys = new Set<string>();
  const seenSourceKeys = new Set<string>();
  for (const candidate of sourceCandidates) {
    const countryCode = normalizedCountryCode(candidate.countryCode);
    const sourceId = normalizedSourceId(candidate.sourceId);
    const key = countryCode && sourceId ? `${countryCode}:${sourceId}` : null;
    if (key && seenSourceKeys.has(key)) duplicateSourceKeys.add(key);
    if (key) seenSourceKeys.add(key);
  }

  const approvedSourceCandidates = new Map<string, CountryGeographicMetadataSourceCandidate>();
  for (const candidate of sourceCandidates) {
    const countryCode = normalizedCountryCode(candidate.countryCode);
    const sourceId = normalizedSourceId(candidate.sourceId);
    const sourceKey = countryCode && sourceId ? `${countryCode}:${sourceId}` : null;
    const reason = sourceKey && duplicateSourceKeys.has(sourceKey)
      ? 'duplicate-country-source-candidate'
      : sourceGateFailure(candidate, now);
    if (reason) {
      blockedCandidates.push({ countryCode, sourceId, reason });
      continue;
    }
    approvedSourceCandidates.set(sourceKey!, candidate);
  }
  for (const [sourceKey, candidate] of approvedSourceCandidates) {
    if (hasApprovedOpenSourceComposition(candidate, approvedSourceCandidates)) continue;
    approvedSourceCandidates.delete(sourceKey);
    blockedCandidates.push({
      countryCode: normalizedCountryCode(candidate.countryCode),
      sourceId: normalizedSourceId(candidate.sourceId),
      reason: 'approved-open-source-composition-components-required',
    });
  }

  const approvedKeys: ApprovedSyntheticAdministrativeKey[] = [];
  const keyCandidates = input.syntheticAdministrativeKeys.map(candidate => {
    assertOnlyFields(candidate as unknown as Record<string, unknown>, KEY_FIELDS, 'synthetic administrative key candidate');
    return candidate;
  });
  const duplicateKeyIds = new Set<string>();
  const seenKeyIds = new Set<string>();
  const duplicateSyntheticTokens = new Set<string>();
  const seenSyntheticTokens = new Set<string>();
  for (const candidate of keyCandidates) {
    if (seenKeyIds.has(candidate.keyId)) duplicateKeyIds.add(candidate.keyId);
    seenKeyIds.add(candidate.keyId);
    if (seenSyntheticTokens.has(candidate.syntheticKeyToken)) {
      duplicateSyntheticTokens.add(candidate.syntheticKeyToken);
    }
    seenSyntheticTokens.add(candidate.syntheticKeyToken);
  }
  for (const candidate of keyCandidates) {
    const countryCode = normalizedCountryCode(candidate.countryCode);
    const sourceId = normalizedSourceId(candidate.sourceId);
    const source = countryCode && sourceId ? approvedSourceCandidates.get(`${countryCode}:${sourceId}`) : undefined;
    const reason = duplicateKeyIds.has(candidate.keyId)
      ? 'duplicate-synthetic-key-id'
      : duplicateSyntheticTokens.has(candidate.syntheticKeyToken)
        ? 'duplicate-synthetic-key-token'
      : keyGateFailure(candidate, source);
    if (reason) {
      blockedCandidates.push({ countryCode, sourceId, reason });
      continue;
    }
    approvedKeys.push({
      keyId: candidate.keyId,
      countryCode: countryCode!,
      sourceId: sourceId!,
      keyKind: candidate.keyKind,
      syntheticKeyToken: candidate.syntheticKeyToken,
      deliveryClaimsEnabled: false,
    });
  }

  const keyCountBySource = new Map<string, number>();
  for (const key of approvedKeys) {
    const sourceKey = `${key.countryCode}:${key.sourceId}`;
    keyCountBySource.set(sourceKey, (keyCountBySource.get(sourceKey) || 0) + 1);
  }
  for (const [sourceKey, candidate] of approvedSourceCandidates) {
    if ((keyCountBySource.get(sourceKey) || 0) === 0) {
      blockedCandidates.push({
        countryCode: normalizedCountryCode(candidate.countryCode),
        sourceId: normalizedSourceId(candidate.sourceId),
        reason: 'approved-synthetic-administrative-key-required',
      });
    }
  }
  const sources = [...approvedSourceCandidates.entries()]
    .filter(([sourceKey]) => (keyCountBySource.get(sourceKey) || 0) > 0)
    .map(([sourceKey, candidate]) => {
      const countryCode = normalizedCountryCode(candidate.countryCode)!;
      const sourceId = normalizedSourceId(candidate.sourceId)!;
      return {
        countryCode,
        sourceId,
        sourceOrigin: candidate.sourceOrigin,
        componentSourceIds: [...candidate.componentSourceIds].sort(),
        sourceVersion: candidate.sourceVersion.trim(),
        sourceUrl: candidate.sourceUrl.trim(),
        authorityEvidenceUrl: candidate.authorityEvidenceUrl.trim(),
        reuseLicense: candidate.reuseLicense.trim(),
        reuseTermsUrl: candidate.reuseTermsUrl.trim(),
        declaredScope: candidate.declaredScope,
        correctionUrl: candidate.correctionUrl.trim(),
        correctionPathStatus: candidate.correctionPathStatus,
        approvedAdministrativeKeyKinds: uniqueSorted(candidate.approvedAdministrativeKeyKinds),
        reviewedAt: candidate.reviewedAt,
        reviewBy: candidate.reviewBy,
        syntheticAdministrativeKeyCount: keyCountBySource.get(sourceKey) || 0,
        deliveryClaimsEnabled: false as const,
      };
    })
    .sort((left, right) => left.countryCode.localeCompare(right.countryCode) || left.sourceId.localeCompare(right.sourceId));
  const acceptedSourceKeys = new Set(sources.map(source => `${source.countryCode}:${source.sourceId}`));

  return {
    indexVersion: COUNTRY_GEOGRAPHIC_METADATA_EVALUATION_INDEX_VERSION,
    sources,
    syntheticAdministrativeKeys: approvedKeys
      .filter(key => acceptedSourceKeys.has(`${key.countryCode}:${key.sourceId}`))
      .sort((left, right) => left.countryCode.localeCompare(right.countryCode) || left.keyId.localeCompare(right.keyId)),
    blockedCandidates: blockedCandidates.sort((left, right) => (
      (left.countryCode || '').localeCompare(right.countryCode || '')
      || (left.sourceId || '').localeCompare(right.sourceId || '')
      || left.reason.localeCompare(right.reason)
    )),
    privacyBoundary: {
      rawAddressDataAllowed: false,
      recipientDataAllowed: false,
      preciseCoordinatesAllowed: false,
      deliveryClaimsEnabled: false,
    },
    nonClaims: [
      'Only approved official or explicitly stewarded open-source metadata and synthetic administrative key fixtures are indexed.',
      'This index does not establish postal existence, postal lookup, address validity, geographic coordinates, deliverability, or delivery-point reachability.',
      'Raw addresses, recipients, building or residential locations, precise coordinates, credentials, secrets, and query logs are not accepted.',
    ],
  };
}

export function projectCountryGeographicMetadataReadiness(
  index: CountryGeographicMetadataEvaluationIndex,
  countryCode: string,
): CountryGeographicMetadataReadinessEvidence[] {
  const normalized = normalizedCountryCode(countryCode);
  if (!normalized) throw new Error('country geographic metadata readiness requires an ISO 3166-1 alpha-2 country code');

  return index.sources
    .filter(source => source.countryCode === normalized && source.syntheticAdministrativeKeyCount > 0)
    .map(source => ({
      countryCode: source.countryCode,
      sourceId: source.sourceId,
      sourceOrigin: source.sourceOrigin,
      approvedAdministrativeKeyCount: source.syntheticAdministrativeKeyCount,
      syntheticAdministrativeEvaluationEligible: true as const,
      deliveryClaimsEnabled: false as const,
    }));
}
