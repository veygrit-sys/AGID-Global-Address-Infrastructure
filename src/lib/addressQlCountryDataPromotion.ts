import {
  buildApprovedCountryGeographicMetadataEvaluationIndex,
} from './countryGeographicMetadataEvaluationCatalog';
import {
  COUNTRY_VALIDATION_QUALITY_GATE_VERSION,
  buildCountryValidationQualityReport,
} from './countryValidationQualityGate';

export const ADDRESSQL_COUNTRY_DATA_PROMOTION_VERSION =
  'addressql-country-data-promotion-v0.1';

export const ADDRESSQL_PROMOTABLE_LEVELS = ['L2', 'L3', 'L4', 'L5'] as const;

export type AddressQlPromotableLevel = (typeof ADDRESSQL_PROMOTABLE_LEVELS)[number];
export type AddressQlCountryDataPromotionState =
  | 'blocked'
  | 'review_candidate'
  | 'enabled';

export type AddressQlCountryDataPromotionTarget = {
  level: AddressQlPromotableLevel;
  capability:
    | 'postal-existence'
    | 'admin-locality-consistency'
    | 'delivery-area'
    | 'delivery-point';
  state: AddressQlCountryDataPromotionState;
  requiredEvidence: string[];
  observedEvidence: string[];
  approvedEvidence: string[];
  missingEvidence: string[];
  sourceIds: string[];
  runtimeAdapterId: string | null;
  independentAttestationVerified: false;
};

export type AddressQlCountryDataPromotionRecord = {
  version: typeof ADDRESSQL_COUNTRY_DATA_PROMOTION_VERSION;
  countryCode: string;
  targets: AddressQlCountryDataPromotionTarget[];
  highestReviewCandidateLevel: AddressQlPromotableLevel | null;
  highestEnabledLevel: null;
  syntheticAdministrativeEvaluationEligible: boolean;
  syntheticHoldoutDigest: string | null;
  qualityReportVersion: typeof COUNTRY_VALIDATION_QUALITY_GATE_VERSION;
  reviewBy: string | null;
  blockers: string[];
  privacy: {
    containsRawAddress: false;
    containsRecipientData: false;
    containsPreciseCoordinates: false;
    containsQueryLogs: false;
  };
  nonClaims: string[];
};

export type AddressQlCountryDataPromotionSummary = {
  version: typeof ADDRESSQL_COUNTRY_DATA_PROMOTION_VERSION;
  countryCount: number;
  reviewCandidateCountryCodes: string[];
  enabledCountryCodes: string[];
  enabledByLevel: Record<AddressQlPromotableLevel, number>;
};

const REQUIREMENTS: Record<AddressQlPromotableLevel, {
  capability: AddressQlCountryDataPromotionTarget['capability'];
  evidence: string[];
}> = {
  L2: {
    capability: 'postal-existence',
    evidence: [
      'source-identity',
      'reuse-rights',
      'source-version',
      'freshness-window',
      'coverage-statement',
      'correction-path',
      'synthetic-holdout',
      'independent-signature',
      'runtime-adapter',
    ],
  },
  L3: {
    capability: 'admin-locality-consistency',
    evidence: [
      'approved-administrative-keys',
      'hierarchy-version',
      'alias-policy',
      'synthetic-holdout',
      'independent-signature',
      'runtime-adapter',
    ],
  },
  L4: {
    capability: 'delivery-area',
    evidence: [
      'delivery-area-source',
      'reuse-rights',
      'freshness-window',
      'coverage-statement',
      'correction-path',
      'synthetic-holdout',
      'independent-signature',
      'runtime-adapter',
    ],
  },
  L5: {
    capability: 'delivery-point',
    evidence: [
      'delivery-point-source',
      'purpose-limitation',
      'reuse-rights',
      'freshness-window',
      'coverage-statement',
      'correction-path',
      'privacy-review',
      'synthetic-holdout',
      'independent-signature',
      'runtime-adapter',
    ],
  },
};

function normalizeCountryCode(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_/-]{0,15}$/.test(normalized)) {
    throw new Error('country data promotion requires a bounded country or neutral-scope code');
  }
  return normalized;
}

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values)].sort();
}

function target(input: {
  level: AddressQlPromotableLevel;
  approvedEvidence?: string[];
  observedEvidence?: string[];
  sourceIds?: string[];
}): AddressQlCountryDataPromotionTarget {
  const requirement = REQUIREMENTS[input.level];
  const requiredEvidence = uniqueSorted(requirement.evidence);
  const approvedEvidence = uniqueSorted(input.approvedEvidence || [])
    .filter(item => requiredEvidence.includes(item));
  const missingEvidence = requiredEvidence
    .filter(item => !approvedEvidence.includes(item));
  const reviewCandidate = (
    input.level === 'L3'
    && approvedEvidence.includes('hierarchy-version')
    && approvedEvidence.includes('alias-policy')
    && approvedEvidence.includes('synthetic-holdout')
  );

  return {
    level: input.level,
    capability: requirement.capability,
    state: reviewCandidate ? 'review_candidate' : 'blocked',
    requiredEvidence,
    observedEvidence: uniqueSorted(input.observedEvidence || []),
    approvedEvidence,
    missingEvidence,
    sourceIds: uniqueSorted(input.sourceIds || []),
    runtimeAdapterId: null,
    independentAttestationVerified: false,
  };
}

export function buildAddressQlCountryDataPromotionRecord(
  countryCode: string,
  now: string | number | Date = new Date(),
): AddressQlCountryDataPromotionRecord {
  const normalized = normalizeCountryCode(countryCode);
  if (!/^[A-Z]{2}$/.test(normalized)) {
    const targets = ADDRESSQL_PROMOTABLE_LEVELS.map(level => target({ level }));
    return {
      version: ADDRESSQL_COUNTRY_DATA_PROMOTION_VERSION,
      countryCode: normalized,
      targets,
      highestReviewCandidateLevel: null,
      highestEnabledLevel: null,
      syntheticAdministrativeEvaluationEligible: false,
      syntheticHoldoutDigest: null,
      qualityReportVersion: COUNTRY_VALIDATION_QUALITY_GATE_VERSION,
      reviewBy: null,
      blockers: uniqueSorted(targets.flatMap(item =>
        item.missingEvidence.map(evidence => `${item.level}:${evidence}`))),
      privacy: {
        containsRawAddress: false,
        containsRecipientData: false,
        containsPreciseCoordinates: false,
        containsQueryLogs: false,
      },
      nonClaims: [
        'A neutral-scope record is not an ISO country-data approval.',
        'A review candidate is not an enabled country capability.',
        'No postal existence, address existence, routing, delivery-area, or delivery-point claim is enabled.',
      ],
    };
  }
  const index = buildApprovedCountryGeographicMetadataEvaluationIndex({ now });
  const quality = buildCountryValidationQualityReport(index, normalized, now);
  const sources = index.sources.filter(source => source.countryCode === normalized);
  const sourceIds = uniqueSorted(sources.map(source => source.sourceId));
  const qualityGateEvidence = quality.gates
    .filter(gate => gate.status === 'passed')
    .map(gate => `quality-gate:${gate.id}`);
  const administrativeApprovedEvidence = quality.syntheticAdministrativeEvaluationEligible
    ? ['hierarchy-version', 'alias-policy', 'synthetic-holdout']
    : [];
  const administrativeObservedEvidence = [
    ...qualityGateEvidence,
    ...sourceIds.map(sourceId => `source:${sourceId}`),
    ...(quality.syntheticHoldoutDigest
      ? [`holdout:${quality.syntheticHoldoutDigest}`]
      : []),
    ...(sources.length
      ? ['approved-administrative-key-kinds']
      : []),
  ];
  const targets = ADDRESSQL_PROMOTABLE_LEVELS.map(level => target({
    level,
    approvedEvidence: level === 'L3' ? administrativeApprovedEvidence : [],
    observedEvidence: level === 'L3' ? administrativeObservedEvidence : [],
    sourceIds: level === 'L3' ? sourceIds : [],
  }));
  const reviewCandidates = targets.filter(item => item.state === 'review_candidate');

  return {
    version: ADDRESSQL_COUNTRY_DATA_PROMOTION_VERSION,
    countryCode: normalized,
    targets,
    highestReviewCandidateLevel: reviewCandidates.at(-1)?.level || null,
    highestEnabledLevel: null,
    syntheticAdministrativeEvaluationEligible:
      quality.syntheticAdministrativeEvaluationEligible,
    syntheticHoldoutDigest: quality.syntheticHoldoutDigest,
    qualityReportVersion: quality.version,
    reviewBy: sources.length
      ? sources.map(source => source.reviewBy).sort()[0]
      : null,
    blockers: uniqueSorted(targets.flatMap(item =>
      item.missingEvidence.map(evidence => `${item.level}:${evidence}`))),
    privacy: {
      containsRawAddress: false,
      containsRecipientData: false,
      containsPreciseCoordinates: false,
      containsQueryLogs: false,
    },
    nonClaims: [
      'A review candidate is not an enabled country capability.',
      'Synthetic administrative holdouts do not contain or prove real administrative keys.',
      'No postal existence, address existence, routing, delivery-area, or delivery-point claim is enabled.',
    ],
  };
}

export function buildAddressQlCountryDataPromotionIndex(
  countryCodes: readonly string[],
  now: string | number | Date = new Date(),
): AddressQlCountryDataPromotionRecord[] {
  return uniqueSorted(countryCodes.map(normalizeCountryCode))
    .map(countryCode => buildAddressQlCountryDataPromotionRecord(countryCode, now));
}

export function summarizeAddressQlCountryDataPromotions(
  records: readonly AddressQlCountryDataPromotionRecord[],
): AddressQlCountryDataPromotionSummary {
  return {
    version: ADDRESSQL_COUNTRY_DATA_PROMOTION_VERSION,
    countryCount: records.length,
    reviewCandidateCountryCodes: records
      .filter(record => record.highestReviewCandidateLevel !== null)
      .map(record => record.countryCode)
      .sort(),
    enabledCountryCodes: records
      .filter(record => record.highestEnabledLevel !== null)
      .map(record => record.countryCode)
      .sort(),
    enabledByLevel: {
      L2: records.filter(record =>
        record.targets.some(targetRecord =>
          targetRecord.level === 'L2' && targetRecord.state === 'enabled')).length,
      L3: records.filter(record =>
        record.targets.some(targetRecord =>
          targetRecord.level === 'L3' && targetRecord.state === 'enabled')).length,
      L4: records.filter(record =>
        record.targets.some(targetRecord =>
          targetRecord.level === 'L4' && targetRecord.state === 'enabled')).length,
      L5: records.filter(record =>
        record.targets.some(targetRecord =>
          targetRecord.level === 'L5' && targetRecord.state === 'enabled')).length,
    },
  };
}

export function validateAddressQlCountryDataPromotions(
  records: readonly AddressQlCountryDataPromotionRecord[],
): string[] {
  const errors: string[] = [];
  const countryCodes = new Set<string>();

  for (const record of records) {
    if (countryCodes.has(record.countryCode)) {
      errors.push(`duplicate-country-promotion:${record.countryCode}`);
    }
    countryCodes.add(record.countryCode);
    if (record.targets.length !== ADDRESSQL_PROMOTABLE_LEVELS.length) {
      errors.push(`${record.countryCode}:promotion-target-count`);
    }
    for (const targetRecord of record.targets) {
      const approved = new Set(targetRecord.approvedEvidence);
      const expectedMissing = targetRecord.requiredEvidence
        .filter(item => !approved.has(item));
      if (JSON.stringify(expectedMissing) !== JSON.stringify(targetRecord.missingEvidence)) {
        errors.push(`${record.countryCode}:${targetRecord.level}:missing-evidence-mismatch`);
      }
      if (targetRecord.state === 'enabled') {
        if (targetRecord.missingEvidence.length) {
          errors.push(`${record.countryCode}:${targetRecord.level}:enabled-with-missing-evidence`);
        }
        if (!targetRecord.runtimeAdapterId) {
          errors.push(`${record.countryCode}:${targetRecord.level}:enabled-without-runtime-adapter`);
        }
        if (!targetRecord.independentAttestationVerified) {
          errors.push(`${record.countryCode}:${targetRecord.level}:enabled-without-independent-attestation`);
        }
      }
      if (
        targetRecord.state === 'review_candidate'
        && targetRecord.level !== 'L3'
      ) {
        errors.push(`${record.countryCode}:${targetRecord.level}:unsupported-review-candidate`);
      }
    }
    if (
      record.privacy.containsRawAddress
      || record.privacy.containsRecipientData
      || record.privacy.containsPreciseCoordinates
      || record.privacy.containsQueryLogs
    ) {
      errors.push(`${record.countryCode}:privacy-boundary-violation`);
    }
  }

  return uniqueSorted(errors);
}
