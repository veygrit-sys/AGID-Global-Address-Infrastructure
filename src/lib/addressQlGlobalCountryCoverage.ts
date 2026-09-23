import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import {
  ADDRESSQL_CORE_COUNTRY_REGION_CODES,
  buildAddressQlGlobalCountryPreloadProfiles,
  type AddressQlGlobalCountryPreloadProfile,
} from './addressQlGlobalCountryPreload';
import {
  buildAddressQlCountryDataPromotionIndex,
  validateAddressQlCountryDataPromotions,
  type AddressQlCountryDataPromotionRecord,
} from './addressQlCountryDataPromotion';

export const ADDRESSQL_GLOBAL_COUNTRY_COVERAGE_VERSION =
  'addressql-global-country-coverage-v0.1';
export const ADDRESSQL_CAPABILITY_LEVELS = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'] as const;

export type AddressQlCapabilityLevel = (typeof ADDRESSQL_CAPABILITY_LEVELS)[number];

export type AddressQlCapabilityState =
  | 'enabled'
  | 'not_applicable'
  | 'manual_review'
  | 'blocked';

export type AddressQlCountryPackState =
  | 'absent'
  | 'draft_metadata_only'
  | 'reviewed_metadata_only'
  | 'rejected';

export type AddressQlCountryPackMetadata = {
  countryCode: string;
  directoryCode: string;
  sourcePath: string;
  state: Exclude<AddressQlCountryPackState, 'absent'>;
  officialStatus: string;
  containsPersonalData: boolean | null;
  containsRawThirdPartyData: boolean | null;
};

export type AddressQlCountryCapabilityGate = {
  level: AddressQlCapabilityLevel;
  capability:
    | 'country-profile'
    | 'format-and-syntax'
    | 'postal-existence'
    | 'admin-locality-consistency'
    | 'delivery-area'
    | 'delivery-point';
  state: AddressQlCapabilityState;
  requiredEvidence: string[];
  observedEvidence: string[];
  approvedEvidence: string[];
};

export type AddressQlGlobalCountryCoverage = {
  version: typeof ADDRESSQL_GLOBAL_COUNTRY_COVERAGE_VERSION;
  countryCode: string;
  scope: 'core-country-region' | 'extended-neutral-scope';
  profileSource: 'local' | 'seed-only';
  nativeAddressFormat: AddressQlCapabilityState;
  internationalEnglishFormat: AddressQlCapabilityState;
  postalFormatValidation: AddressQlCapabilityState;
  postalExistenceLookup: AddressQlCapabilityState;
  deliveryPointValidation: AddressQlCapabilityState;
  highestEnabledLevel: AddressQlCapabilityLevel;
  capabilityGates: AddressQlCountryCapabilityGate[];
  countryPackState: AddressQlCountryPackState;
  countryPackPath: string | null;
  dataPromotion: AddressQlCountryDataPromotionRecord;
  blockers: string[];
  nonClaims: string[];
};

export type AddressQlGlobalCountryCoverageSummary = {
  version: typeof ADDRESSQL_GLOBAL_COUNTRY_COVERAGE_VERSION;
  totalProfiles: number;
  coreCountryRegionProfiles: number;
  extendedProfiles: number;
  localProfiles: number;
  metadataPackProfiles: number;
  postalFormatEnabledProfiles: number;
  postalEquivalentProfiles: number;
  postalExistenceEnabledProfiles: number;
  deliveryPointEnabledProfiles: number;
  dataPromotionReviewCandidateProfiles: number;
  dataPromotionEnabledProfiles: number;
  manualReviewProfiles: number;
};

export type AddressQlGlobalCountryCoverageOptions = {
  now?: string | number | Date;
};

type RawCountryPackManifest = {
  countryCode?: string;
  officialStatus?: string;
  containsPersonalData?: boolean;
  containsRawThirdPartyData?: boolean;
};

function normalizeCountryCode(value: string | undefined) {
  return String(value || '').trim().toUpperCase();
}

function addressFormatState(
  available: boolean,
  profile: AddressQlGlobalCountryPreloadProfile,
): AddressQlCapabilityState {
  if (available) return 'enabled';
  if (
    profile.sourcePath
    && profile.postalStatus === 'no_postal_code'
    && profile.requiredComponents.length === 0
  ) {
    return 'not_applicable';
  }
  return 'manual_review';
}

function capabilityGate(input: AddressQlCountryCapabilityGate): AddressQlCountryCapabilityGate {
  return {
    ...input,
    requiredEvidence: [...new Set(input.requiredEvidence)].sort(),
    observedEvidence: [...new Set(input.observedEvidence)].sort(),
    approvedEvidence: [...new Set(input.approvedEvidence)].sort(),
  };
}

export function loadAddressQlCountryPackMetadata(
  root = process.cwd(),
): AddressQlCountryPackMetadata[] {
  const packRoot = join(root, 'data', 'postal_country_packs');
  if (!existsSync(packRoot)) return [];

  return readdirSync(packRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map((entry): AddressQlCountryPackMetadata | null => {
      const manifestPath = join(packRoot, entry.name, 'manifest.json');
      if (!existsSync(manifestPath)) return null;
      const directoryCode = normalizeCountryCode(entry.name);
      const sourcePath = relative(root, manifestPath).replace(/\\/g, '/');
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as RawCountryPackManifest;
        const countryCode = normalizeCountryCode(manifest.countryCode);
        const safeMetadata = (
          countryCode === directoryCode
          && manifest.containsPersonalData === false
          && manifest.containsRawThirdPartyData === false
        );
        return {
          countryCode: countryCode || directoryCode,
          directoryCode,
          sourcePath,
          state: !safeMetadata
            ? 'rejected'
            : manifest.officialStatus === 'draft'
              ? 'draft_metadata_only'
              : 'reviewed_metadata_only',
          officialStatus: String(manifest.officialStatus || 'unknown'),
          containsPersonalData: manifest.containsPersonalData ?? null,
          containsRawThirdPartyData: manifest.containsRawThirdPartyData ?? null,
        };
      } catch {
        return {
          countryCode: directoryCode,
          directoryCode,
          sourcePath,
          state: 'rejected',
          officialStatus: 'invalid-manifest',
          containsPersonalData: null,
          containsRawThirdPartyData: null,
        };
      }
    })
    .filter((record): record is AddressQlCountryPackMetadata => record !== null)
    .sort((left, right) => left.countryCode.localeCompare(right.countryCode));
}

export function buildAddressQlGlobalCountryCoverage(
  root = process.cwd(),
  options: AddressQlGlobalCountryCoverageOptions = {},
): AddressQlGlobalCountryCoverage[] {
  const coreCodes = new Set(ADDRESSQL_CORE_COUNTRY_REGION_CODES);
  const packsByCountry = new Map(
    loadAddressQlCountryPackMetadata(root).map(pack => [pack.countryCode, pack]),
  );
  const profiles = buildAddressQlGlobalCountryPreloadProfiles(root);
  const promotionsByCountry = new Map(
    buildAddressQlCountryDataPromotionIndex(
      profiles.map(profile => profile.countryCode),
      options.now,
    ).map(promotion => [promotion.countryCode, promotion]),
  );

  return profiles.map((profile) => {
    const pack = packsByCountry.get(profile.countryCode);
    const dataPromotion = promotionsByCountry.get(profile.countryCode)!;
    const administrativePromotion = dataPromotion.targets
      .find(target => target.level === 'L3')!;
    const nativeAddressFormat = addressFormatState(profile.nativeInputAvailable, profile);
    const internationalEnglishFormat = addressFormatState(profile.englishInputAvailable, profile);
    const postalFormatValidation: AddressQlCapabilityState =
      profile.postalStatus === 'no_postal_code'
        ? 'not_applicable'
        : profile.postalRegexAvailable
          ? 'enabled'
          : 'manual_review';
    const postalExistenceLookup: AddressQlCapabilityState =
      profile.postalStatus === 'no_postal_code' ? 'not_applicable' : 'blocked';
    const formatAndSyntax: AddressQlCapabilityState = (
      postalFormatValidation !== 'manual_review'
      && [nativeAddressFormat, internationalEnglishFormat].includes('enabled')
    )
      ? 'enabled'
      : (
        nativeAddressFormat === 'not_applicable'
        && internationalEnglishFormat === 'not_applicable'
          ? 'not_applicable'
          : 'manual_review'
      );
    const profileEvidence = profile.sourcePath ? [profile.sourcePath] : [];
    const packEvidence = pack ? [pack.sourcePath] : [];
    const capabilityGates = [
      capabilityGate({
        level: 'L0',
        capability: 'country-profile',
        state: profile.sourcePath ? 'enabled' : 'manual_review',
        requiredEvidence: ['local-country-profile'],
        observedEvidence: profileEvidence,
        approvedEvidence: profile.sourcePath ? ['local-country-profile'] : [],
      }),
      capabilityGate({
        level: 'L1',
        capability: 'format-and-syntax',
        state: formatAndSyntax,
        requiredEvidence: ['country-address-format', 'country-postal-policy'],
        observedEvidence: profileEvidence,
        approvedEvidence: formatAndSyntax === 'enabled'
          ? ['country-address-format', 'country-postal-policy']
          : [],
      }),
      capabilityGate({
        level: 'L2',
        capability: 'postal-existence',
        state: postalExistenceLookup,
        requiredEvidence: [
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
        observedEvidence: packEvidence,
        approvedEvidence: [],
      }),
      capabilityGate({
        level: 'L3',
        capability: 'admin-locality-consistency',
        state: administrativePromotion.state === 'enabled' ? 'enabled' : 'blocked',
        requiredEvidence: [
          'approved-administrative-keys',
          'hierarchy-version',
          'alias-policy',
          'synthetic-holdout',
          'independent-signature',
          'runtime-adapter',
        ],
        observedEvidence: [
          ...(profile.regionalHierarchy.length ? profileEvidence : []),
          ...administrativePromotion.observedEvidence,
        ],
        approvedEvidence: administrativePromotion.approvedEvidence,
      }),
      capabilityGate({
        level: 'L4',
        capability: 'delivery-area',
        state: 'blocked',
        requiredEvidence: [
          'delivery-area-source',
          'reuse-rights',
          'freshness-window',
          'coverage-statement',
          'correction-path',
          'synthetic-holdout',
          'independent-signature',
          'runtime-adapter',
        ],
        observedEvidence: packEvidence,
        approvedEvidence: [],
      }),
      capabilityGate({
        level: 'L5',
        capability: 'delivery-point',
        state: 'blocked',
        requiredEvidence: [
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
        observedEvidence: [],
        approvedEvidence: [],
      }),
    ];
    const blockers = new Set<string>();

    if (!profile.sourcePath) blockers.add('local-country-profile-required');
    if (nativeAddressFormat === 'manual_review') blockers.add('native-address-format-required');
    if (internationalEnglishFormat === 'manual_review') {
      blockers.add('international-english-format-required');
    }
    if (postalFormatValidation === 'manual_review') blockers.add('postal-format-evidence-required');
    if (postalExistenceLookup === 'blocked') {
      blockers.add(pack
        ? 'country-pack-is-metadata-only'
        : 'country-postal-pack-required');
      blockers.add('approved-postal-existence-source-required');
    }
    blockers.add('approved-delivery-source-required');
    if (administrativePromotion.state === 'review_candidate') {
      blockers.add('country-data-promotion-review-candidate:L3');
      for (const missing of administrativePromotion.missingEvidence) {
        blockers.add(`country-data-promotion:L3:${missing}`);
      }
    }

    return {
      version: ADDRESSQL_GLOBAL_COUNTRY_COVERAGE_VERSION,
      countryCode: profile.countryCode,
      scope: coreCodes.has(profile.countryCode)
        ? 'core-country-region'
        : 'extended-neutral-scope',
      profileSource: profile.sourcePath ? 'local' : 'seed-only',
      nativeAddressFormat,
      internationalEnglishFormat,
      postalFormatValidation,
      postalExistenceLookup,
      deliveryPointValidation: 'blocked',
      highestEnabledLevel: formatAndSyntax === 'enabled' ? 'L1' : 'L0',
      capabilityGates,
      countryPackState: pack?.state || 'absent',
      countryPackPath: pack?.sourcePath || null,
      dataPromotion,
      blockers: [...blockers].sort(),
      nonClaims: [
        'Country-profile support does not imply postal-code existence lookup.',
        'Postal-format validation does not imply address existence or delivery-point reachability.',
        'Delivery-point validation remains blocked until country-specific source, rights, freshness, coverage, correction, and quality gates pass.',
      ],
    };
  });
}

export function summarizeAddressQlGlobalCountryCoverage(
  root = process.cwd(),
  options: AddressQlGlobalCountryCoverageOptions = {},
): AddressQlGlobalCountryCoverageSummary {
  const records = buildAddressQlGlobalCountryCoverage(root, options);
  return {
    version: ADDRESSQL_GLOBAL_COUNTRY_COVERAGE_VERSION,
    totalProfiles: records.length,
    coreCountryRegionProfiles: records.filter(record => record.scope === 'core-country-region').length,
    extendedProfiles: records.filter(record => record.scope === 'extended-neutral-scope').length,
    localProfiles: records.filter(record => record.profileSource === 'local').length,
    metadataPackProfiles: records.filter(record =>
      record.countryPackState === 'draft_metadata_only'
      || record.countryPackState === 'reviewed_metadata_only').length,
    postalFormatEnabledProfiles: records.filter(record => record.postalFormatValidation === 'enabled').length,
    postalEquivalentProfiles: records.filter(record => record.postalFormatValidation === 'not_applicable').length,
    postalExistenceEnabledProfiles: records.filter(record => record.postalExistenceLookup === 'enabled').length,
    deliveryPointEnabledProfiles: records.filter(record => record.deliveryPointValidation === 'enabled').length,
    dataPromotionReviewCandidateProfiles: records.filter(record =>
      record.dataPromotion.highestReviewCandidateLevel !== null).length,
    dataPromotionEnabledProfiles: records.filter(record =>
      record.dataPromotion.highestEnabledLevel !== null).length,
    manualReviewProfiles: records.filter(record =>
      record.nativeAddressFormat === 'manual_review'
      || record.internationalEnglishFormat === 'manual_review'
      || record.postalFormatValidation === 'manual_review').length,
  };
}

export function validateAddressQlGlobalCountryCoverage(
  records = buildAddressQlGlobalCountryCoverage(),
  root = process.cwd(),
): string[] {
  const errors: string[] = [];
  errors.push(...validateAddressQlCountryDataPromotions(
    records.map(record => record.dataPromotion),
  ));
  const byCode = new Map(records.map(record => [record.countryCode, record]));
  if (byCode.size !== records.length) errors.push('duplicate-country-coverage-record');

  for (const countryCode of ADDRESSQL_CORE_COUNTRY_REGION_CODES) {
    const record = byCode.get(countryCode);
    if (!record) {
      errors.push(`missing-core-country-region:${countryCode}`);
      continue;
    }
    if (record.profileSource !== 'local') {
      errors.push(`${countryCode}:local-country-profile-required`);
    }
  }

  const profileCodes = new Set(records.map(record => record.countryCode));
  for (const pack of loadAddressQlCountryPackMetadata(root)) {
    if (!profileCodes.has(pack.countryCode)) errors.push(`orphan-country-pack:${pack.countryCode}`);
    if (pack.state === 'rejected') errors.push(`rejected-country-pack:${pack.directoryCode}`);
  }

  for (const record of records) {
    if (record.nonClaims.length < 3) errors.push(`${record.countryCode}:missing-non-claims`);
    if (
      record.capabilityGates.length !== ADDRESSQL_CAPABILITY_LEVELS.length
      || record.capabilityGates.some((gate, index) => gate.level !== ADDRESSQL_CAPABILITY_LEVELS[index])
    ) {
      errors.push(`${record.countryCode}:capability-level-sequence-invalid`);
    }
    const gateByLevel = new Map(record.capabilityGates.map(gate => [gate.level, gate]));
    if (gateByLevel.get('L2')?.state !== record.postalExistenceLookup) {
      errors.push(`${record.countryCode}:L2-capability-state-mismatch`);
    }
    if (gateByLevel.get('L5')?.state !== record.deliveryPointValidation) {
      errors.push(`${record.countryCode}:L5-capability-state-mismatch`);
    }
    const l3Promotion = record.dataPromotion.targets.find(target => target.level === 'L3');
    const l3Gate = gateByLevel.get('L3');
    if (
      !l3Promotion
      || !l3Gate
      || JSON.stringify(l3Gate.approvedEvidence) !== JSON.stringify(l3Promotion.approvedEvidence)
    ) {
      errors.push(`${record.countryCode}:L3-promotion-evidence-mismatch`);
    }
    for (const gate of record.capabilityGates) {
      if (gate.state !== 'enabled') continue;
      const approved = new Set(gate.approvedEvidence);
      for (const requirement of gate.requiredEvidence) {
        if (!approved.has(requirement)) {
          errors.push(`${record.countryCode}:${gate.level}:missing-approved-evidence:${requirement}`);
        }
      }
    }
    const expectedHighestEnabledLevel = [...record.capabilityGates]
      .reverse()
      .find(gate => gate.state === 'enabled')?.level || 'L0';
    if (record.highestEnabledLevel !== expectedHighestEnabledLevel) {
      errors.push(`${record.countryCode}:highest-enabled-level-mismatch`);
    }
    if (
      record.postalFormatValidation === 'not_applicable'
      && record.postalExistenceLookup !== 'not_applicable'
    ) {
      errors.push(`${record.countryCode}:no-postal-capabilities-inconsistent`);
    }
  }

  return [...new Set(errors)].sort();
}
