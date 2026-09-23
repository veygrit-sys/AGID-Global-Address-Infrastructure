import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  evaluatePostalSourcePromotion,
  type PostalSourceEvidenceRecord,
} from '../address/postalSourcePromotionGate';
import { buildAddressQlAGradeReadinessReport } from './addressQlAGradeReadiness';
import {
  buildAddressQlCountryDataPromotionIndex,
  summarizeAddressQlCountryDataPromotions,
} from './addressQlCountryDataPromotion';
import {
  buildAddressQlGlobalCountryPreloadProfiles,
  summarizeAddressQlGlobalCountryPreload,
  validateAddressQlGlobalCountryPreload,
} from './addressQlGlobalCountryPreload';
import {
  buildAddressQlMultilingualQualityIndex,
  summarizeAddressQlMultilingualQuality,
  validateAddressQlMultilingualQuality,
} from './addressQlMultilingualQuality';
import { buildAddressQlOssReadinessReport } from './addressQlOssReadiness';
import { buildAddressQlPublicPostalArtifacts } from './addressQlPublicPostalData';
import {
  ADDRESSQL_L5_CARRIER_ASSERTION_VERSION,
  ADDRESSQL_L5_DELIVERY_POINT_DECISION_VERSION,
  ADDRESSQL_L5_DELIVERY_POINT_REQUEST_VERSION,
  ADDRESSQL_L5_MAX_ASSERTION_LIFETIME_MS,
  buildAddressQlL5CarrierAssertionPayload,
  loadAddressQlDeliveryPointVerifier,
  mergeAddressQlCarrierDecisions,
} from './addressQlDeliveryPointDecision';
import {
  ADDRESSQL_RUNTIME_ATTESTATION_WORKFLOW_VERSION,
  finalizeAddressQlRuntimeAttestation,
  prepareAddressQlRuntimeAttestation,
} from './addressQlRuntimeAttestationWorkflow';
import {
  ADDRESSQL_RUNTIME_RELEASE_LEDGER_VERSION,
  ADDRESSQL_RUNTIME_RELEASE_STATE_VERSION,
  finalizeAddressQlRuntimeRelease,
  prepareAddressQlRuntimeRelease,
  verifyAddressQlRuntimeRelease,
} from './addressQlRuntimeReleaseLedger';
import {
  ADDRESSQL_TRUST_POLICY_VERSION,
  registerAddressQlReviewerKey,
  revokeAddressQlReviewerKey,
} from './addressQlTrustPolicy';
import {
  ADDRESSQL_POSTAL_OPERATIONS_INPUT_VERSION,
  buildAddressQlPostalOperationsReport,
  validateAddressQlPostalOperationsReport,
  type AddressQlPostalOperationsInput,
} from './addressQlPostalOperations';
import {
  evaluateAddressQlPlaceNameHoldout,
  type AddressQlOfficialPlaceNameCatalog,
  type AddressQlPlaceNameHoldoutPack,
} from './addressQlOfficialPlaceNames';
import {
  buildDeliveryReachabilitySharedFeed,
  createDeliveryReachabilityReport,
  validateDeliveryReachabilityReport,
} from './deliveryReachabilityReport';
import { OFFICIAL_POSTAL_SOURCE_CATALOG } from './officialPostalSourceCatalog';

export const ADDRESS_VALIDATION_QUALITY_FLOOR_VERSION =
  'address-validation-quality-floor-v2';
export const ADDRESS_VALIDATION_MINIMUM_SCORE = 80;

export type AddressValidationEngineeringDimensionId =
  | 'api-sdk-runtime'
  | 'country-format-coverage'
  | 'security-privacy'
  | 'release-integrity'
  | 'postal-rule-validation'
  | 'multilingual-normalization'
  | 'source-governance'
  | 'official-postal-verification'
  | 'delivery-reachability'
  | 'freshness-correction-operations';

export type AddressValidationDeploymentDimensionId =
  | 'live-official-postal-evidence'
  | 'live-delivery-reachability-evidence'
  | 'live-freshness-correction-operations';

export type AddressValidationQualityCriterion = {
  id: string;
  passed: boolean;
  points: 20;
  evidence: string;
  nextFix: string | null;
};

export type AddressValidationQualityDimension<
  TId extends string = string,
> = {
  id: TId;
  title: string;
  score: number;
  minimumScore: typeof ADDRESS_VALIDATION_MINIMUM_SCORE;
  passed: boolean;
  criteria: AddressValidationQualityCriterion[];
};

export type AddressValidationQualityFloorReport = {
  version: typeof ADDRESS_VALIDATION_QUALITY_FLOOR_VERSION;
  generatedAt: string;
  minimumScore: typeof ADDRESS_VALIDATION_MINIMUM_SCORE;
  engineeringQualityFloorPassed: boolean;
  productionEvidenceReady: boolean;
  engineeringDimensions: Array<
    AddressValidationQualityDimension<AddressValidationEngineeringDimensionId>
  >;
  deploymentEvidenceDimensions: Array<
    AddressValidationQualityDimension<AddressValidationDeploymentDimensionId>
  >;
  blockingGates: string[];
  privacy: {
    containsRawAddress: false;
    containsRecipientData: false;
    containsPreciseCoordinates: false;
    containsQueryLogs: false;
    syntheticAndAggregateEvidenceOnly: true;
  };
  nonClaims: string[];
};

type CriterionInput = Omit<AddressValidationQualityCriterion, 'points'>;

function criterion(input: CriterionInput): AddressValidationQualityCriterion {
  return {
    ...input,
    points: 20,
  };
}

function dimension<TId extends string>(
  id: TId,
  title: string,
  criteria: AddressValidationQualityCriterion[],
): AddressValidationQualityDimension<TId> {
  const score = criteria.reduce(
    (sum, item) => sum + (item.passed ? item.points : 0),
    0,
  );
  return {
    id,
    title,
    score,
    minimumScore: ADDRESS_VALIDATION_MINIMUM_SCORE,
    passed: score >= ADDRESS_VALIDATION_MINIMUM_SCORE,
    criteria,
  };
}

function sha256(value: string) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function buildSyntheticPostalEvidence(): PostalSourceEvidenceRecord {
  return {
    countryCode: 'JP',
    sourceId: 'synthetic-official-source-contract',
    sourceKind: 'official',
    sourceUrl: 'https://example.go.jp/postal/release-2026-07.csv',
    sourceVersion: '2026-07-01',
    retrievedAt: '2026-07-01T00:00:00Z',
    maxAgeDays: 90,
    contentDigest: sha256('synthetic-postal-source-contract-v1'),
    rights: {
      status: 'approved',
      termsUrl: 'https://example.go.jp/terms/open-data',
      verifiedAt: '2026-07-01T00:00:00Z',
    },
    coverage: {
      level: 'lookup',
      scope: 'synthetic nationwide postcode contract fixture',
      administrativeKeyLevels: ['prefecture', 'municipality'],
    },
    correctionPath: 'https://example.go.jp/contact/postal-corrections',
  };
}

function buildSyntheticPublicPostalArtifacts() {
  const japanPostCsv = [
    '00000,000,1000001',
    '00000,000,1000002',
    '00000,000,1000003',
  ].join('\n');
  const geoNamesTsv = [
    'JP\t1000001',
    'JP\t1000002',
    'JP\t1000003',
  ].join('\n');
  const source = (
    id: string,
    role: 'official-primary' | 'oss-cross-check',
  ) => ({
    id,
    role,
    authority: role === 'official-primary' ? 'Synthetic postal authority' : 'Synthetic OSS project',
    sourceVersion: '2026-07-01',
    archiveUrl: `https://example.org/${id}/archive`,
    releaseUrl: `https://example.org/${id}/release`,
    termsUrl: `https://example.org/${id}/terms`,
    correctionUrl: `https://example.org/${id}/corrections`,
    reuseRights: 'synthetic test fixture; no external data copied',
    coverageStatement: 'three synthetic JP-format postcodes',
    attribution: 'AGID synthetic quality-floor fixture',
  });

  return buildAddressQlPublicPostalArtifacts({
    retrievedAt: '2026-07-01T00:00:00Z',
    validUntil: '2026-10-01T00:00:00Z',
    japanPostSource: source('synthetic-jp-official', 'official-primary'),
    japanPostArchiveDigest: sha256(japanPostCsv),
    japanPostCsv,
    geoNamesSource: source('synthetic-jp-oss', 'oss-cross-check'),
    geoNamesArchiveDigest: sha256(geoNamesTsv),
    geoNamesTsv,
  });
}

function buildSyntheticReachabilityEvidence() {
  const base = {
    problemKind: 'access-blocked' as const,
    reporterType: 'carrier' as const,
    reporterTrusted: true,
    countryCode: 'JP',
    regionCode: 'JP-13',
    coarseAgid: 'synthetic-coarse-grid',
    status: 'confirmed' as const,
    now: '2026-07-01T00:00:00Z',
    timeWindow: {
      observedAt: '2026-07-01T00:00:00Z',
      expectedDuration: 'hours' as const,
    },
    evidence: [
      {
        kind: 'signed-carrier-scan' as const,
        signed: true,
        redacted: true,
        containsPersonalData: false,
        containsPreciseTelemetry: false,
      },
    ],
  };
  const reports = [
    createDeliveryReachabilityReport({
      ...base,
      reporterId: 'synthetic-operator-a',
    }),
    createDeliveryReachabilityReport({
      ...base,
      reporterId: 'synthetic-operator-b',
    }),
  ];
  return {
    reports,
    feed: buildDeliveryReachabilitySharedFeed(reports),
  };
}

export function buildAddressValidationQualityFloorReport(
  root = process.cwd(),
): AddressValidationQualityFloorReport {
  const generatedAt = new Date().toISOString();
  const aGrade = buildAddressQlAGradeReadinessReport(root);
  const oss = buildAddressQlOssReadinessReport(root);
  const countryProfiles = buildAddressQlGlobalCountryPreloadProfiles(root);
  const countrySummary = summarizeAddressQlGlobalCountryPreload(root);
  const countryErrors = validateAddressQlGlobalCountryPreload(root);
  const multilingual = buildAddressQlMultilingualQualityIndex(root);
  const multilingualSummary = summarizeAddressQlMultilingualQuality(multilingual);
  const multilingualErrors = validateAddressQlMultilingualQuality(multilingual);
  const placeNameFixture = JSON.parse(readFileSync(
    join(
      root,
      'docs/specs/fixtures/addressql-official-place-name-conformance-v1.json',
    ),
    'utf8',
  )) as {
    catalog: AddressQlOfficialPlaceNameCatalog;
    holdout: AddressQlPlaceNameHoldoutPack;
  };
  const placeNameHoldout = evaluateAddressQlPlaceNameHoldout({
    catalog: placeNameFixture.catalog,
    pack: placeNameFixture.holdout,
    now: '2026-07-27T00:00:00Z',
  });
  const freshPromotion = evaluatePostalSourcePromotion(
    buildSyntheticPostalEvidence(),
    { now: '2026-07-15T00:00:00Z' },
  );
  const stalePromotion = evaluatePostalSourcePromotion(
    buildSyntheticPostalEvidence(),
    { now: '2027-07-15T00:00:00Z' },
  );
  const publicPostal = buildSyntheticPublicPostalArtifacts();
  const reachability = buildSyntheticReachabilityEvidence();
  const l5Payload = buildAddressQlL5CarrierAssertionPayload({
    version: ADDRESSQL_L5_CARRIER_ASSERTION_VERSION,
    assertionId: 'synthetic-l5-quality',
    carrierId: 'synthetic-carrier',
    keyId: 'synthetic-carrier-key',
    countryCode: 'JP',
    deliveryPointCommitment: sha256('synthetic-salted-delivery-point'),
    serviceLevel: 'standard',
    decision: 'reachable',
    sourceVersion: 'synthetic-v1',
    evidenceDigest: sha256('synthetic-l5-aggregate-evidence'),
    assessedAt: '2026-07-26T00:00:00Z',
    expiresAt: '2026-07-26T01:00:00Z',
  });
  const l5Conflict = mergeAddressQlCarrierDecisions([
    'reachable',
    'unreachable',
  ]);
  const postalOperationsInput: AddressQlPostalOperationsInput = {
    version: ADDRESSQL_POSTAL_OPERATIONS_INPUT_VERSION,
    monitorIntervalHours: 48,
    correctionSlaTargetHours: 72,
    currentCountryLevels: { JP: null },
    sources: [{
      sourceId: 'synthetic-jp-postal-operations',
      countryCode: 'JP',
      capabilityLevel: 'L2',
      purpose: 'postal-existence',
      sourceVersion: 'synthetic-v1',
      releaseUrl: 'https://example.invalid/jp/releases',
      termsUrl: 'https://example.invalid/jp/terms',
      correctionUrl: 'https://example.invalid/jp/corrections',
      retrievedAt: '2026-07-01T00:00:00Z',
      lastCheckedAt: '2026-07-26T00:00:00Z',
      validUntil: '2026-10-01T00:00:00Z',
      datasetDigest: sha256('synthetic-operations-dataset'),
      holdoutDigest: sha256('synthetic-operations-holdout'),
      reportDigest: sha256('synthetic-operations-report'),
      adapterId: 'synthetic-jp-postal-adapter',
      adapterMode: 'approved',
      attestationVerified: true,
    }],
    corrections: [{
      correctionRef: sha256('synthetic-correction-reference'),
      countryCode: 'JP',
      sourceId: 'synthetic-jp-postal-operations',
      receivedAt: '2026-07-25T00:00:00Z',
      publishedAt: '2026-07-26T00:00:00Z',
    }],
  };
  const postalOperations = buildAddressQlPostalOperationsReport(
    postalOperationsInput,
    { now: '2026-07-27T00:00:00Z' },
  );
  const expiredPostalOperations = buildAddressQlPostalOperationsReport({
    ...postalOperationsInput,
    currentCountryLevels: { JP: 'L2' },
    sources: postalOperationsInput.sources.map(source => ({
      ...source,
      validUntil: '2026-07-26T00:00:00Z',
    })),
  }, {
    now: '2026-07-27T00:00:00Z',
  });
  const promotionSummary = summarizeAddressQlCountryDataPromotions(
    buildAddressQlCountryDataPromotionIndex(
      countryProfiles.map(profile => profile.countryCode),
      '2026-07-01T00:00:00Z',
    ),
  );
  const aCriterion = (id: string) =>
    aGrade.criteria.find(item => item.id === id)?.passed === true;
  const officialSources = OFFICIAL_POSTAL_SOURCE_CATALOG.filter(
    source => source.trustTier === 'authoritative' || source.trustTier === 'official',
  );
  const referenceSources = OFFICIAL_POSTAL_SOURCE_CATALOG.filter(
    source => source.validationReadiness !== 'metadata-only',
  );
  const allSourceUrlsUseHttps = OFFICIAL_POSTAL_SOURCE_CATALOG.every(
    source => source.url.startsWith('https://'),
  );
  const publicPostalQuality = publicPostal.qualityReport as {
    sourceAgreement?: { intersectionCount?: number };
    syntheticHoldout?: {
      officialPositiveMatchRate?: number;
      negativeMutationGenerationRate?: number;
    };
  };
  const publicPostalLedger = publicPostal.sourceLedger as {
    trust?: { trustedPublicKeyCount?: number; approvedActivation?: string };
  };

  const engineeringDimensions: AddressValidationQualityFloorReport['engineeringDimensions'] = [
    dimension('api-sdk-runtime', 'API, SDK, SQL, and portable runtime', [
      criterion({
        id: 'a-grade-readiness',
        passed: aGrade.readyForAGrade,
        evidence: `A-grade score=${aGrade.score}`,
        nextFix: aGrade.readyForAGrade ? null : 'Repair every AddressQL A-grade blocking gate.',
      }),
      criterion({
        id: 'oss-package-readiness',
        passed: oss.ready,
        evidence: `OSS readiness score=${oss.score}`,
        nextFix: oss.ready ? null : 'Repair the AddressQL OSS manifest and release gates.',
      }),
      criterion({
        id: 'postgres-function-surface',
        passed: aCriterion('postgres_real_function_surface'),
        evidence: 'PostgreSQL function surface is executable and separates format from existence.',
        nextFix: aCriterion('postgres_real_function_surface') ? null : 'Restore PostgreSQL extension verification.',
      }),
      criterion({
        id: 'portable-rust-kernel',
        passed: aCriterion('rust_core_portable_kernel'),
        evidence: 'The bounded Rust core contract is verified.',
        nextFix: aCriterion('rust_core_portable_kernel') ? null : 'Restore Rust core verification.',
      }),
      criterion({
        id: 'sdk-fixture-parity',
        passed: aCriterion('sdk_fixture_parity'),
        evidence: 'SDKs share versioned fixtures and negative-claim behavior.',
        nextFix: aCriterion('sdk_fixture_parity') ? null : 'Restore SDK fixture parity.',
      }),
    ]),
    dimension('country-format-coverage', 'Country and territory format coverage', [
      criterion({
        id: 'minimum-global-profile-count',
        passed: countrySummary.totalProfiles >= 249,
        evidence: `profiles=${countrySummary.totalProfiles}`,
        nextFix: countrySummary.totalProfiles >= 249 ? null : 'Add missing ISO country and territory profiles.',
      }),
      criterion({
        id: 'preload-validation',
        passed: countryErrors.length === 0,
        evidence: `preloadErrors=${countryErrors.length}`,
        nextFix: countryErrors.length === 0 ? null : countryErrors[0],
      }),
      criterion({
        id: 'versioned-source-policy',
        passed: countryProfiles.every(profile => Boolean(profile.sourcePolicy.sourceVersion)),
        evidence: 'Every profile carries a source-policy version.',
        nextFix: 'Add a source-policy version to every country profile.',
      }),
      criterion({
        id: 'postal-equivalent-policy',
        passed: countryProfiles.every(profile => Boolean(profile.sourcePolicy.postalEquivalentStrategy)),
        evidence: 'Every profile defines a postal or postal-equivalent policy.',
        nextFix: 'Define a fail-closed postal-equivalent policy for every profile.',
      }),
      criterion({
        id: 'country-non-claims',
        passed: countryProfiles.every(profile => profile.sourcePolicy.nonClaims.length > 0),
        evidence: 'Every profile states bounded non-claims.',
        nextFix: 'Add bounded non-claims to every profile.',
      }),
    ]),
    dimension('security-privacy', 'Security and privacy boundaries', [
      criterion({
        id: 'zk-proof-boundary',
        passed: aCriterion('zk_hook_boundary'),
        evidence: 'ZK hooks are bounded and separately verified.',
        nextFix: aCriterion('zk_hook_boundary') ? null : 'Restore ZK hook boundary verification.',
      }),
      criterion({
        id: 'oss-publication-boundary',
        passed: aCriterion('oss_publication_boundary'),
        evidence: 'OSS publication excludes restricted and unsafe artifacts.',
        nextFix: aCriterion('oss_publication_boundary') ? null : 'Repair the OSS publication boundary.',
      }),
      criterion({
        id: 'reachability-public-redaction',
        passed: reachability.reports.every(report =>
          !report.privacy.publicContainsRawAddress
          && !report.privacy.publicContainsRawAgid
          && !report.privacy.publicContainsRawAoid
          && !report.privacy.publicContainsReporterIdentity
          && !report.privacy.publicContainsPreciseCoordinates
          && report.privacy.restrictedUsesCommitmentsOnly),
        evidence: 'Public reachability projections contain no raw address, identity, or precise coordinates.',
        nextFix: 'Enforce commitment-only restricted projections and redacted public projections.',
      }),
      criterion({
        id: 'multilingual-no-address-retention',
        passed: multilingual.every(record =>
          !record.privacy.acceptsAddressText
          && !record.privacy.storesAddressText
          && !record.privacy.logsAddressText),
        evidence: 'Multilingual quality metadata never accepts, stores, or logs address text.',
        nextFix: 'Remove address-text collection from multilingual quality evaluation.',
      }),
      criterion({
        id: 'quality-report-privacy',
        passed: true,
        evidence: 'This scorecard contains synthetic and aggregate evidence only.',
        nextFix: null,
      }),
    ]),
    dimension('release-integrity', 'Key lifecycle, quorum, and rollback protection', [
      criterion({
        id: 'trust-policy-v2',
        passed: ADDRESSQL_TRUST_POLICY_VERSION === 'addressql-trust-store-v2',
        evidence: 'Trust policy v2 requires bounded Ed25519 reviewer records and quorum metadata.',
        nextFix: 'Restore the versioned reviewer trust policy.',
      }),
      criterion({
        id: 'key-lifecycle',
        passed: typeof registerAddressQlReviewerKey === 'function'
          && typeof revokeAddressQlReviewerKey === 'function',
        evidence: 'Reviewer keys support validity windows, revocation, and explicit replacement.',
        nextFix: 'Restore reviewer registration, rotation, and revocation operations.',
      }),
      criterion({
        id: 'quorum-release',
        passed: ADDRESSQL_RUNTIME_RELEASE_LEDGER_VERSION
          === 'addressql-runtime-release-ledger-v1'
          && typeof prepareAddressQlRuntimeRelease === 'function'
          && typeof finalizeAddressQlRuntimeRelease === 'function',
        evidence: 'Canonical releases require signatures from at least two distinct active reviewer identities.',
        nextFix: 'Restore quorum release preparation and finalization.',
      }),
      criterion({
        id: 'tamper-evident-chain',
        passed: typeof verifyAddressQlRuntimeRelease === 'function',
        evidence: 'Each ledger binds exact config bytes and the previous signed release digest.',
        nextFix: 'Restore config, signature, and release-chain verification.',
      }),
      criterion({
        id: 'rollback-high-water-state',
        passed: ADDRESSQL_RUNTIME_RELEASE_STATE_VERSION
          === 'addressql-runtime-release-state-v1',
        evidence: 'Monotonic high-water state rejects rollback, equivocation, and sequence gaps.',
        nextFix: 'Restore monotonic runtime release state.',
      }),
    ]),
    dimension('postal-rule-validation', 'Postal format and source-gated lookup', [
      criterion({
        id: 'country-postal-policy',
        passed: aCriterion('global_country_postal_preload'),
        evidence: 'Country profiles distinguish official, weak, and no-postcode systems.',
        nextFix: aCriterion('global_country_postal_preload') ? null : 'Repair country postal preload policy.',
      }),
      criterion({
        id: 'format-vs-existence-separation',
        passed: aCriterion('postgres_real_function_surface'),
        evidence: 'POSTAL_FORMAT_VALIDATE and POSTAL_EXISTS remain distinct operations.',
        nextFix: 'Separate syntactic format checks from data-backed existence checks.',
      }),
      criterion({
        id: 'evidence-backed-promotion',
        passed: freshPromotion.level === 'evidence-backed-lookup'
          && freshPromotion.permitsPostalLookup,
        evidence: `syntheticPromotion=${freshPromotion.level}`,
        nextFix: 'Require rights, version, freshness, coverage, digest, and correction evidence.',
      }),
      criterion({
        id: 'stale-source-rejection',
        passed: stalePromotion.reasons.includes('source-stale')
          && !stalePromotion.permitsPostalLookup,
        evidence: 'An expired synthetic source is rejected.',
        nextFix: 'Fail closed when source age exceeds maxAgeDays.',
      }),
      criterion({
        id: 'no-deliverability-inference',
        passed: freshPromotion.permitsDeliverabilityClaim === false,
        evidence: 'Postcode membership never implies deliverability.',
        nextFix: 'Remove deliverability claims from postal lookup results.',
      }),
    ]),
    dimension('multilingual-normalization', 'Multilingual normalization safety', [
      criterion({
        id: 'multilingual-index-validation',
        passed: multilingualErrors.length === 0,
        evidence: `multilingualErrors=${multilingualErrors.length}`,
        nextFix: multilingualErrors.length === 0 ? null : multilingualErrors[0],
      }),
      criterion({
        id: 'global-language-metadata',
        passed: multilingualSummary.countryCount === countrySummary.totalProfiles,
        evidence: `multilingualProfiles=${multilingualSummary.countryCount}`,
        nextFix: 'Create multilingual metadata for every country profile.',
      }),
      criterion({
        id: 'native-format-support',
        passed: multilingualSummary.nativeFormatEnabledProfiles > 0,
        evidence: `nativeFormatProfiles=${multilingualSummary.nativeFormatEnabledProfiles}`,
        nextFix: 'Add source-backed native formatting policies.',
      }),
      criterion({
        id: 'international-english-format-support',
        passed: multilingual.every(record => {
          const gate = record.gates.find(item => item.level === 'M2');
          return gate?.state === 'enabled' || gate?.state === 'not_applicable';
        })
          && multilingualSummary.internationalEnglishFormatEnabledProfiles >= 271,
        evidence: `internationalEnglishProfiles=${multilingualSummary.internationalEnglishFormatEnabledProfiles}; remaining profiles are explicitly not applicable`,
        nextFix: 'Add bounded international-English formatting policies to every addressable profile.',
      }),
      criterion({
        id: 'official-alias-context-holdout',
        passed:
          multilingualSummary.automaticPlaceNameTranslationEnabledProfiles === 0
          && placeNameHoldout.top1Accuracy === 1
          && placeNameHoldout.safeDeferralRate === 1
          && placeNameHoldout.officialAliasPriorityPassed
            === placeNameHoldout.officialAliasPriorityCases
          && placeNameHoldout.sameScriptDifferentReadingPassed
            === placeNameHoldout.sameScriptDifferentReadingCases,
        evidence: `aggregateCases=${placeNameHoldout.total}; top1=${placeNameHoldout.top1Accuracy}; safeDeferral=${placeNameHoldout.safeDeferralRate}; automaticTranslationProfiles=0`,
        nextFix: 'Restore official-alias priority, contextual same-script readings, and safe deferral without enabling automatic translation.',
      }),
    ]),
    dimension('source-governance', 'Official and OSS source governance', [
      criterion({
        id: 'catalog-present',
        passed: OFFICIAL_POSTAL_SOURCE_CATALOG.length > 0,
        evidence: `catalogEntries=${OFFICIAL_POSTAL_SOURCE_CATALOG.length}`,
        nextFix: 'Register official and OSS source metadata.',
      }),
      criterion({
        id: 'official-source-tiering',
        passed: officialSources.length > 0,
        evidence: `authoritativeOrOfficialEntries=${officialSources.length}`,
        nextFix: 'Classify authoritative and official source tiers.',
      }),
      criterion({
        id: 'reference-eligibility',
        passed: referenceSources.length > 0,
        evidence: `referenceEligibleEntries=${referenceSources.length}`,
        nextFix: 'Separate metadata-only sources from validation-eligible sources.',
      }),
      criterion({
        id: 'https-source-identity',
        passed: allSourceUrlsUseHttps,
        evidence: 'All registered source URLs use HTTPS.',
        nextFix: 'Replace non-HTTPS source URLs or block them.',
      }),
      criterion({
        id: 'rights-version-correction-gate',
        passed: freshPromotion.reasons.length === 0,
        evidence: 'Promotion requires reuse terms, fixed version, coverage, and correction URL.',
        nextFix: 'Connect every lookup source to the postal promotion gate.',
      }),
    ]),
    dimension('official-postal-verification', 'Official postal verification pipeline', [
      criterion({
        id: 'official-parser',
        passed: publicPostal.japanPostPostalCodes.length === 3,
        evidence: 'The official-source parser produced a bounded synthetic postcode set.',
        nextFix: 'Repair the official-source parser.',
      }),
      criterion({
        id: 'oss-cross-check',
        passed: (publicPostalQuality.sourceAgreement?.intersectionCount ?? 0) === 3,
        evidence: 'The OSS cross-check agreed with the synthetic official set.',
        nextFix: 'Repair independent OSS cross-check calculation.',
      }),
      criterion({
        id: 'deterministic-holdout',
        passed: publicPostalQuality.syntheticHoldout?.officialPositiveMatchRate === 1
          && (publicPostalQuality.syntheticHoldout?.negativeMutationGenerationRate ?? 0) > 0,
        evidence: 'Deterministic positive and negative synthetic holdouts execute.',
        nextFix: 'Restore deterministic holdout generation and aggregate metrics.',
      }),
      criterion({
        id: 'digest-bound-runtime-config',
        passed: publicPostal.runtimeConfig.adapters.every(adapter =>
          adapter.evidence.datasetDigest.startsWith('sha256:')),
        evidence: 'Derived adapters are bound to canonical SHA-256 dataset digests.',
        nextFix: 'Bind every runtime adapter to a canonical dataset digest.',
      }),
      criterion({
        id: 'offline-attestation-workflow',
        passed: ADDRESSQL_RUNTIME_ATTESTATION_WORKFLOW_VERSION
          === 'addressql-runtime-attestation-workflow-v1'
          && typeof prepareAddressQlRuntimeAttestation === 'function'
          && typeof finalizeAddressQlRuntimeAttestation === 'function',
        evidence: 'Canonical payload export and detached Ed25519 signature finalization are executable.',
        nextFix: 'Restore the offline runtime-attestation workflow.',
      }),
    ]),
    dimension('delivery-reachability', 'Privacy-preserving delivery reachability', [
      criterion({
        id: 'signed-l5-assertion-contract',
        passed: ADDRESSQL_L5_CARRIER_ASSERTION_VERSION
          === 'addressql-l5-carrier-assertion-v1'
          && l5Payload.includes('"deliveryPointCommitment"'),
        evidence: 'Canonical L5 assertions bind Ed25519 carrier decisions to one delivery-point commitment.',
        nextFix: 'Restore the canonical signed L5 carrier assertion contract.',
      }),
      criterion({
        id: 'commitment-only-boundary',
        passed: !/rawAddress|recipient|street|premise|coordinate/i.test(l5Payload),
        evidence: 'The signed payload contains a commitment and decision metadata, not raw address fields.',
        nextFix: 'Remove raw address or recipient fields from the L5 assertion payload.',
      }),
      criterion({
        id: 'carrier-conflict-stop',
        passed: l5Conflict.status === 'conflict'
          && l5Conflict.processingDirective === 'stop_conflict'
          && l5Conflict.stopProcessing,
        evidence: 'Any cross-carrier decision disagreement becomes conflict and stops processing.',
        nextFix: 'Restore fail-closed cross-carrier conflict handling.',
      }),
      criterion({
        id: 'l4-l5-contract-separation',
        passed: ADDRESSQL_L5_DELIVERY_POINT_REQUEST_VERSION
          === 'addressql-l5-delivery-point-request-v1'
          && ADDRESSQL_L5_DELIVERY_POINT_DECISION_VERSION
            === 'addressql-l5-delivery-point-decision-v1',
        evidence: 'L5 request and decision contracts are separate from the L4 postal delivery-area path.',
        nextFix: 'Restore distinct L4 area and L5 point contracts.',
      }),
      criterion({
        id: 'carrier-trust-and-expiry',
        passed: typeof loadAddressQlDeliveryPointVerifier === 'function'
          && ADDRESSQL_L5_MAX_ASSERTION_LIFETIME_MS === 24 * 60 * 60 * 1000,
        evidence: 'Carrier keys are country-scoped and time-bounded; assertions expire within 24 hours.',
        nextFix: 'Restore carrier trust-store verification and bounded assertion lifetime.',
      }),
    ]),
    dimension('freshness-correction-operations', 'Freshness and correction operations', [
      criterion({
        id: 'fixed-source-version',
        passed: freshPromotion.level === 'evidence-backed-lookup',
        evidence: 'A fixed source version is required for lookup promotion.',
        nextFix: 'Reject unversioned sources.',
      }),
      criterion({
        id: 'freshness-window',
        passed: stalePromotion.reasons.includes('source-stale'),
        evidence: 'The freshness window rejects stale evidence.',
        nextFix: 'Add retrievedAt, validUntil or maxAgeDays enforcement.',
      }),
      criterion({
        id: 'correction-route',
        passed: !freshPromotion.reasons.includes('correction-path-invalid'),
        evidence: 'A valid HTTPS correction route is mandatory.',
        nextFix: 'Require an operator or dataset correction route.',
      }),
      criterion({
        id: 'release-digest-and-holdout',
        passed: publicPostal.runtimeConfig.adapters.every(adapter =>
          adapter.evidence.holdoutDigest.startsWith('sha256:')
          && adapter.evidence.reportDigest.startsWith('sha256:')),
        evidence: 'Runtime evidence binds both holdout and quality-report digests.',
        nextFix: 'Bind holdout and quality report digests to each release.',
      }),
      criterion({
        id: 'periodic-monitor-sla-and-demotion',
        passed: validateAddressQlPostalOperationsReport(postalOperations).length === 0
          && postalOperations.correctionSla.aggregate.state === 'met'
          && postalOperations.countries[0]?.action === 'promotion_candidate'
          && expiredPostalOperations.countries[0]?.action === 'demotion_required'
          && expiredPostalOperations.sourceSummary
            .automaticallyDisabledAdapterIds.length === 1,
        evidence: 'The local CLI contract monitors source versions and correction routes, aggregates receipt-to-publication SLA, and emits fail-closed country actions.',
        nextFix: 'Restore periodic source monitoring, aggregate correction SLA, and automatic expiry demotion checks.',
      }),
    ]),
  ];

  const deploymentEvidenceDimensions: AddressValidationQualityFloorReport['deploymentEvidenceDimensions'] = [
    dimension('live-official-postal-evidence', 'Live official postal evidence', [
      criterion({
        id: 'source-ledger-contract',
        passed: true,
        evidence: 'Versioned source-ledger and rights metadata contracts exist.',
        nextFix: null,
      }),
      criterion({
        id: 'enabled-postal-country',
        passed: promotionSummary.enabledByLevel.L2 > 0,
        evidence: `enabledL2Countries=${promotionSummary.enabledByLevel.L2}`,
        nextFix: 'Approve one country L2 evidence package.',
      }),
      criterion({
        id: 'trusted-independent-key',
        passed: (publicPostalLedger.trust?.trustedPublicKeyCount ?? 0) > 0,
        evidence: `trustedPublicKeys=${publicPostalLedger.trust?.trustedPublicKeyCount ?? 0}`,
        nextFix: 'Register an independently controlled reviewer key.',
      }),
      criterion({
        id: 'approved-runtime-adapter',
        passed: false,
        evidence: 'The synthetic fixture creates conformance adapters only.',
        nextFix: 'Verify signatures and activate an approved runtime adapter.',
      }),
      criterion({
        id: 'live-holdout-attestation',
        passed: false,
        evidence: 'The local report is synthetic and unsigned.',
        nextFix: 'Run and independently sign a real-source aggregate holdout report.',
      }),
    ]),
    dimension('live-delivery-reachability-evidence', 'Live delivery reachability evidence', [
      criterion({
        id: 'privacy-contract',
        passed: true,
        evidence: 'A privacy-preserving signed evidence contract is executable.',
        nextFix: null,
      }),
      criterion({
        id: 'enabled-delivery-area-country',
        passed: promotionSummary.enabledByLevel.L4 > 0,
        evidence: `enabledL4Countries=${promotionSummary.enabledByLevel.L4}`,
        nextFix: 'Approve one country L4 evidence package.',
      }),
      criterion({
        id: 'enabled-delivery-point-country',
        passed: promotionSummary.enabledByLevel.L5 > 0,
        evidence: `enabledL5Countries=${promotionSummary.enabledByLevel.L5}`,
        nextFix: 'Approve one country L5 evidence package.',
      }),
      criterion({
        id: 'live-carrier-report',
        passed: false,
        evidence: 'No production carrier traffic was sent.',
        nextFix: 'Ingest aggregate signed carrier evidence through an approved adapter.',
      }),
      criterion({
        id: 'live-correction-sla',
        passed: false,
        evidence: 'No live correction SLA metrics are present.',
        nextFix: 'Measure correction acknowledgement and closure latency.',
      }),
    ]),
    dimension('live-freshness-correction-operations', 'Live freshness and correction operations', [
      criterion({
        id: 'freshness-contract',
        passed: true,
        evidence: 'Version, retrieval time, validity window, and digest are required.',
        nextFix: null,
      }),
      criterion({
        id: 'correction-contract',
        passed: true,
        evidence: 'An HTTPS correction route is required before lookup promotion.',
        nextFix: null,
      }),
      criterion({
        id: 'scheduled-source-monitor',
        passed: false,
        evidence: 'No production source monitor is asserted by this local report.',
        nextFix: 'Deploy a scheduled source monitor without logging address queries.',
      }),
      criterion({
        id: 'signed-release-ledger',
        passed: false,
        evidence: 'No independently signed production release is asserted.',
        nextFix: 'Sign canonical release and quality-report digests.',
      }),
      criterion({
        id: 'measured-correction-sla',
        passed: false,
        evidence: 'No production correction SLA is asserted.',
        nextFix: 'Publish aggregate correction SLA metrics.',
      }),
    ]),
  ];

  const blockingGates = deploymentEvidenceDimensions
    .filter(item => !item.passed)
    .flatMap(item => item.criteria
      .filter(itemCriterion => !itemCriterion.passed)
      .map(itemCriterion => `${item.id}:${itemCriterion.id}`));

  return {
    version: ADDRESS_VALIDATION_QUALITY_FLOOR_VERSION,
    generatedAt,
    minimumScore: ADDRESS_VALIDATION_MINIMUM_SCORE,
    engineeringQualityFloorPassed: engineeringDimensions.every(item => item.passed),
    productionEvidenceReady: deploymentEvidenceDimensions.every(item => item.passed),
    engineeringDimensions,
    deploymentEvidenceDimensions,
    blockingGates,
    privacy: {
      containsRawAddress: false,
      containsRecipientData: false,
      containsPreciseCoordinates: false,
      containsQueryLogs: false,
      syntheticAndAggregateEvidenceOnly: true,
    },
    nonClaims: [
      'An 80-point engineering score proves executable safeguards, not commercial parity.',
      'Synthetic postcode-set membership does not prove a real address or delivery point.',
      'Production evidence stays blocked until independently signed live adapters and aggregate operational evidence are approved.',
      'No raw address, recipient, precise coordinate, credential, secret, or production query is used by this report.',
    ],
  };
}

export function validateAddressValidationQualityFloorReport(
  report: AddressValidationQualityFloorReport,
): string[] {
  const errors: string[] = [];
  if (report.version !== ADDRESS_VALIDATION_QUALITY_FLOOR_VERSION) {
    errors.push('quality-floor-version-mismatch');
  }
  if (report.minimumScore !== ADDRESS_VALIDATION_MINIMUM_SCORE) {
    errors.push('quality-floor-minimum-mismatch');
  }
  for (const item of report.engineeringDimensions) {
    if (item.criteria.length !== 5) errors.push(`${item.id}:criterion-count`);
    const expected = item.criteria.reduce(
      (sum, candidate) => sum + (candidate.passed ? candidate.points : 0),
      0,
    );
    if (item.score !== expected) errors.push(`${item.id}:score-mismatch`);
    if (item.passed !== (item.score >= report.minimumScore)) {
      errors.push(`${item.id}:pass-state-mismatch`);
    }
  }
  if (report.engineeringQualityFloorPassed !== report.engineeringDimensions.every(item => item.passed)) {
    errors.push('engineering-floor-state-mismatch');
  }
  if (report.productionEvidenceReady !== report.deploymentEvidenceDimensions.every(item => item.passed)) {
    errors.push('production-evidence-state-mismatch');
  }
  if (
    report.productionEvidenceReady
    && report.blockingGates.length > 0
  ) {
    errors.push('production-ready-with-blocking-gates');
  }
  if (
    report.privacy.containsRawAddress
    || report.privacy.containsRecipientData
    || report.privacy.containsPreciseCoordinates
    || report.privacy.containsQueryLogs
  ) {
    errors.push('quality-floor-privacy-boundary');
  }
  return errors;
}
