import type {
  CountryGeographicMetadataEvaluationIndex,
  CountryGeographicMetadataReadinessEvidence,
} from './countryGeographicMetadataEvaluationIndex';
import { sha256Hex } from './sha256';

export const COUNTRY_VALIDATION_QUALITY_GATE_VERSION = 'country-validation-quality-gate-v3';
export const COUNTRY_VALIDATION_HOLDOUT_DIGEST_ALGORITHM = 'sha256-country-admin-holdout-v1';

export type CountryValidationQualityGateId =
  | 'reuse-terms'
  | 'source-version-and-freshness'
  | 'country-or-territory-scope'
  | 'correction-path'
  | 'multilingual-standardization-policy'
  | 'neutral-scope-policy'
  | 'synthetic-holdout';

export type CountryValidationQualityGateStatus = 'passed' | 'blocked';

export type CountryValidationQualityPolicy = {
  countryCode: string;
  multilingualStandardization: {
    aliasEvidence: 'source-gated';
    normalization: 'reversible-unicode-normalization-required';
    automaticTypoCorrection: 'disabled-until-country-holdout-evidence';
  };
  neutralScope: {
    geographicScope: 'registry-label-only';
    sovereigntyDetermination: false;
    boundaryDetermination: false;
    deliveryClaimsEnabled: false;
  };
};

export type CountryValidationQualityGateResult = {
  id: CountryValidationQualityGateId;
  status: CountryValidationQualityGateStatus;
  sourceIds: string[];
  reason: string;
  nextGate: string;
};

export type CountryValidationQualityReport = {
  version: typeof COUNTRY_VALIDATION_QUALITY_GATE_VERSION;
  countryCode: string;
  policy: CountryValidationQualityPolicy | null;
  sourceIds: string[];
  gates: CountryValidationQualityGateResult[];
  syntheticAdministrativeEvaluationEligible: boolean;
  syntheticHoldoutDigestAlgorithm: typeof COUNTRY_VALIDATION_HOLDOUT_DIGEST_ALGORITHM | null;
  syntheticHoldoutDigest: string | null;
  geographicMetadataReadiness: CountryGeographicMetadataReadinessEvidence[];
  postalLookupEnabled: false;
  addressValidationEnabled: false;
  deliveryClaimsEnabled: false;
  nonClaims: string[];
};

export type CountryValidationQualityCoverageReport = {
  version: typeof COUNTRY_VALIDATION_QUALITY_GATE_VERSION;
  countryCodes: string[];
  reports: CountryValidationQualityReport[];
  syntheticAdministrativeEvaluationEligibleCountryCodes: string[];
  blockedCountryCodes: string[];
  postalLookupEnabled: false;
  addressValidationEnabled: false;
  deliveryClaimsEnabled: false;
  nonClaims: string[];
};

const COUNTRY_VALIDATION_QUALITY_POLICY_TEMPLATE = {
  multilingualStandardization: {
    aliasEvidence: 'source-gated',
    normalization: 'reversible-unicode-normalization-required',
    automaticTypoCorrection: 'disabled-until-country-holdout-evidence',
  },
  neutralScope: {
    geographicScope: 'registry-label-only',
    sovereigntyDetermination: false,
    boundaryDetermination: false,
    deliveryClaimsEnabled: false,
  },
} as const;

function normalizeCountryCode(value: string) {
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values)].sort();
}

function gate(
  id: CountryValidationQualityGateId,
  status: CountryValidationQualityGateStatus,
  sourceIds: string[],
  reason: string,
  nextGate: string,
): CountryValidationQualityGateResult {
  return { id, status, sourceIds: uniqueSorted(sourceIds), reason, nextGate };
}

export function createCountryValidationQualityPolicy(countryCode: string): CountryValidationQualityPolicy | null {
  const normalized = normalizeCountryCode(countryCode);
  if (!normalized) return null;

  return {
    countryCode: normalized,
    multilingualStandardization: { ...COUNTRY_VALIDATION_QUALITY_POLICY_TEMPLATE.multilingualStandardization },
    neutralScope: { ...COUNTRY_VALIDATION_QUALITY_POLICY_TEMPLATE.neutralScope },
  };
}

// This evaluates metadata and synthetic-fixture readiness only. It deliberately
// cannot promote a country to postal lookup, address validation, or delivery.
export function buildCountryValidationQualityReport(
  index: CountryGeographicMetadataEvaluationIndex,
  countryCode: string,
  now: string | number | Date = new Date(),
): CountryValidationQualityReport {
  const normalized = normalizeCountryCode(countryCode);
  if (!normalized) throw new Error('country validation quality requires an ISO 3166-1 alpha-2 country code');

  const evaluatedAt = new Date(now).getTime();
  if (!Number.isFinite(evaluatedAt)) throw new Error('country validation quality requires a valid evaluation time');

  const sources = index.sources.filter(source => source.countryCode === normalized);
  const sourceIds = uniqueSorted(sources.map(source => source.sourceId));
  const policy = createCountryValidationQualityPolicy(normalized);
  const everySource = (predicate: (source: typeof sources[number]) => boolean) => (
    sources.length > 0 && sources.every(predicate)
  );
  const hasSyntheticHoldoutForEverySource = everySource(source => (
    source.approvedAdministrativeKeyKinds.every(keyKind => (
      index.syntheticAdministrativeKeys.some(key => (
        key.countryCode === normalized
        && key.sourceId === source.sourceId
        && key.keyKind === keyKind
        && key.deliveryClaimsEnabled === false
      ))
    ))
  ));

  const gates: CountryValidationQualityGateResult[] = [
    gate(
      'reuse-terms',
      everySource(source => Boolean(source.reuseLicense) && Boolean(source.reuseTermsUrl)) ? 'passed' : 'blocked',
      sourceIds,
      'Every attached source must retain explicit approved reuse terms and attribution evidence.',
      'Record explicit reusable terms and attribution for every country source.',
    ),
    gate(
      'source-version-and-freshness',
      everySource(source => Boolean(source.sourceVersion) && Date.parse(source.reviewBy) > evaluatedAt) ? 'passed' : 'blocked',
      sourceIds,
      'Every attached source must have a version and an unexpired review window.',
      'Refresh the source version and complete a new review before the review window expires.',
    ),
    gate(
      'country-or-territory-scope',
      everySource(source => source.declaredScope === 'country' || source.declaredScope === 'territory') ? 'passed' : 'blocked',
      sourceIds,
      'Every attached source must declare a country or territory scope without inferring a boundary decision.',
      'Record declared coverage and keep country and territory labels registry-scoped.',
    ),
    gate(
      'correction-path',
      everySource(source => Boolean(source.correctionUrl) && Boolean(source.correctionPathStatus)) ? 'passed' : 'blocked',
      sourceIds,
      'Every attached source must expose a source-specific correction route or publisher contact route.',
      'Record a usable correction route for every attached source.',
    ),
    gate(
      'multilingual-standardization-policy',
      policy ? 'passed' : 'blocked',
      [],
      'Aliases remain source-gated, reversible normalization is required, and automatic typo correction remains disabled pending holdout evidence.',
      'Add a country policy that defines source-gated aliases and reversible normalization.',
    ),
    gate(
      'neutral-scope-policy',
      policy?.neutralScope.geographicScope === 'registry-label-only'
        && policy.neutralScope.sovereigntyDetermination === false
        && policy.neutralScope.boundaryDetermination === false
        && policy.neutralScope.deliveryClaimsEnabled === false
        ? 'passed'
        : 'blocked',
      [],
      'Country and territory labels remain registry-scoped and cannot determine sovereignty, boundaries, or delivery.',
      'Add a neutral registry-label scope policy with delivery claims disabled.',
    ),
    gate(
      'synthetic-holdout',
      hasSyntheticHoldoutForEverySource ? 'passed' : 'blocked',
      sourceIds,
      'Every attached source must have an approved synthetic holdout for each administrative key kind it declares.',
      'Add approved synthetic holdouts for every declared administrative key kind without storing real administrative keys.',
    ),
  ];

  const syntheticAdministrativeEvaluationEligible = gates.every(result => result.status === 'passed');
  const syntheticHoldoutDigest = syntheticAdministrativeEvaluationEligible
    ? `sha256:${sha256Hex(JSON.stringify({
        algorithm: COUNTRY_VALIDATION_HOLDOUT_DIGEST_ALGORITHM,
        countryCode: normalized,
        indexVersion: index.indexVersion,
        sources: sources
          .map(source => ({
            sourceId: source.sourceId,
            sourceVersion: source.sourceVersion,
            reviewBy: source.reviewBy,
          }))
          .sort((left, right) => left.sourceId.localeCompare(right.sourceId)),
        holdouts: index.syntheticAdministrativeKeys
          .filter(key => key.countryCode === normalized && sourceIds.includes(key.sourceId))
          .map(key => ({
            keyId: key.keyId,
            sourceId: key.sourceId,
            keyKind: key.keyKind,
            syntheticKeyToken: key.syntheticKeyToken,
          }))
          .sort((left, right) => left.keyId.localeCompare(right.keyId)),
      }))}`
    : null;
  const geographicMetadataReadiness = syntheticAdministrativeEvaluationEligible
    ? sources.map(source => ({
        countryCode: source.countryCode,
        sourceId: source.sourceId,
        sourceOrigin: source.sourceOrigin,
        approvedAdministrativeKeyCount: source.syntheticAdministrativeKeyCount,
        syntheticAdministrativeEvaluationEligible: true as const,
        deliveryClaimsEnabled: false as const,
      }))
    : [];

  return {
    version: COUNTRY_VALIDATION_QUALITY_GATE_VERSION,
    countryCode: normalized,
    policy,
    sourceIds,
    gates,
    syntheticAdministrativeEvaluationEligible,
    syntheticHoldoutDigestAlgorithm: syntheticAdministrativeEvaluationEligible
      ? COUNTRY_VALIDATION_HOLDOUT_DIGEST_ALGORITHM
      : null,
    syntheticHoldoutDigest,
    geographicMetadataReadiness,
    postalLookupEnabled: false,
    addressValidationEnabled: false,
    deliveryClaimsEnabled: false,
    nonClaims: [
      'This report evaluates source metadata, policy controls, and synthetic holdouts only.',
      'It does not establish postal lookup, an address match, correction of a user address, coordinates, routing, or delivery-point reachability.',
      'No raw address, recipient, building, residential location, precise coordinate, credential, secret, or query log is accepted or emitted.',
    ],
  };
}

export function buildAllCountryValidationQualityReports(
  index: CountryGeographicMetadataEvaluationIndex,
  countryCodes: readonly string[],
  now: string | number | Date = new Date(),
): CountryValidationQualityCoverageReport {
  const normalizedCodes = uniqueSorted(countryCodes
    .map(normalizeCountryCode)
    .filter((countryCode): countryCode is string => countryCode !== null));
  const reports = normalizedCodes.map(countryCode => (
    buildCountryValidationQualityReport(index, countryCode, now)
  ));
  const syntheticAdministrativeEvaluationEligibleCountryCodes = reports
    .filter(report => report.syntheticAdministrativeEvaluationEligible)
    .map(report => report.countryCode);

  return {
    version: COUNTRY_VALIDATION_QUALITY_GATE_VERSION,
    countryCodes: normalizedCodes,
    reports,
    syntheticAdministrativeEvaluationEligibleCountryCodes,
    blockedCountryCodes: reports
      .filter(report => !report.syntheticAdministrativeEvaluationEligible)
      .map(report => report.countryCode),
    postalLookupEnabled: false,
    addressValidationEnabled: false,
    deliveryClaimsEnabled: false,
    nonClaims: [
      'Every ISO country code receives the same multilingual and neutral-scope policy template.',
      'A policy template does not supply reuse terms, source freshness, coverage, correction evidence, or a synthetic holdout.',
      'Countries without all source gates remain blocked for synthetic administrative evaluation and cannot enable postal lookup, address validation, or delivery claims.',
    ],
  };
}
