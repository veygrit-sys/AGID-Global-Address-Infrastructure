import {
  collectOfficialPostalSourceCoverage,
  OfficialPostalSourceCoverageEntry,
  OfficialPostalSourceCoverageInput,
  PostalSourceContinent,
  summarizeOfficialPostalSourceCoverage,
} from './officialPostalSourceCoverage';
import { PostalSourceTrustTier } from './officialPostalSourceCatalog';

export const POSTAL_FALLBACK_REPLACEMENT_PLAN_VERSION = 'postal-fallback-replacement-plan-v0.1' as const;

export type PostalReplacementSourceKind =
  | 'national-postal-operator-api'
  | 'government-postcode-api'
  | 'official-bulk-postcode-dataset'
  | 'official-address-register'
  | 'official-territory-or-parent-authority-source';

export type PostalFallbackReplacementGate = {
  id: string;
  label: string;
  requirement: string;
};

export type PostalFallbackReplacementCandidate = {
  countryCode: string;
  countryName: string;
  continent: PostalSourceContinent;
  continents: PostalSourceContinent[];
  relativePath: string;
  profilePaths: string[];
  currentStatus: OfficialPostalSourceCoverageEntry['status'];
  currentBestTrustTier: PostalSourceTrustTier;
  postalCodeRequired: boolean;
  hasPostalCodeMetadata: boolean;
  currentFallbackEvidenceIds: string[];
  replacementSourceKinds: PostalReplacementSourceKind[];
  requiredGateIds: string[];
  specialHandling: 'standard-country' | 'territory-or-subregion' | 'disputed-or-sensitive-region';
  nextAction: string;
  nonClaims: string[];
};

export type PostalFallbackReplacementPlanSummary = {
  version: typeof POSTAL_FALLBACK_REPLACEMENT_PLAN_VERSION;
  totalProfilesChecked: number;
  fallbackDependentCount: number;
  fallbackDependentProfileCount: number;
  byContinent: Record<PostalSourceContinent, number>;
  disputedOrSensitiveCount: number;
  territoryOrSubregionCount: number;
  standardCountryCount: number;
};

export type PostalFallbackReplacementPlan = {
  summary: PostalFallbackReplacementPlanSummary;
  gates: PostalFallbackReplacementGate[];
  entries: PostalFallbackReplacementCandidate[];
};

const DISPUTED_OR_SENSITIVE_CODES = new Set([
  'CRIM',
  'DONB',
  'EH',
  'PMR',
  'SLND',
  'TRNC',
  'XD',
  'XK',
  'XU',
]);

export const POSTAL_FALLBACK_REPLACEMENT_GATES: PostalFallbackReplacementGate[] = [
  {
    id: 'country-specific-official-source-required',
    label: 'Country-specific official source',
    requirement:
      'Replacement evidence must name the target country/territory code explicitly; global wildcard sources cannot satisfy this gate.',
  },
  {
    id: 'official-authority-required',
    label: 'Official authority',
    requirement:
      'Replacement evidence must come from a national postal operator, government agency, official address register, or official bulk postcode dataset.',
  },
  {
    id: 'strong-trust-tier-required',
    label: 'Strong trust tier',
    requirement:
      'Replacement evidence must classify as authoritative, official, or official-derived with strong trust strength.',
  },
  {
    id: 'redistribution-policy-recorded',
    label: 'Redistribution policy recorded',
    requirement:
      'License, redistribution, bulk download, API credential, and rate-limit status must be recorded before bundling data or exposing automated checks.',
  },
  {
    id: 'freshness-and-version-recorded',
    label: 'Freshness and version recorded',
    requirement:
      'Source version, update cadence, retrieval date, and stale-data policy must be recorded for each replacement source.',
  },
  {
    id: 'non-claim-recorded',
    label: 'Non-claim recorded',
    requirement:
      'The catalog entry must state that source registration is not a complete proof that every real postcode/address is bundled locally.',
  },
];

function emptyContinentCounts() {
  return {
    africa: 0,
    americas: 0,
    asia: 0,
    europe: 0,
    oceania: 0,
    antarctica: 0,
    special: 0,
  } as Record<PostalSourceContinent, number>;
}

function classifySpecialHandling(countryCode: string): PostalFallbackReplacementCandidate['specialHandling'] {
  if (DISPUTED_OR_SENSITIVE_CODES.has(countryCode)) return 'disputed-or-sensitive-region';
  if (countryCode.includes('-') || countryCode.length > 2) return 'territory-or-subregion';
  return 'standard-country';
}

function replacementSourceKindsFor(
  specialHandling: PostalFallbackReplacementCandidate['specialHandling'],
): PostalReplacementSourceKind[] {
  const base: PostalReplacementSourceKind[] = [
    'national-postal-operator-api',
    'government-postcode-api',
    'official-bulk-postcode-dataset',
    'official-address-register',
  ];

  return specialHandling === 'standard-country'
    ? base
    : [...base, 'official-territory-or-parent-authority-source'];
}

function nextActionFor(entry: OfficialPostalSourceCoverageEntry, specialHandling: PostalFallbackReplacementCandidate['specialHandling']) {
  if (specialHandling === 'disputed-or-sensitive-region') {
    return `Find a neutral, explicitly scoped official or postal-operator source for ${entry.countryCode}; if authority is contested, record the source boundary and do not claim political recognition.`;
  }

  if (specialHandling === 'territory-or-subregion') {
    return `Find the postal operator, governing authority, or parent-authority official dataset that explicitly covers ${entry.countryCode}; avoid inheriting the parent country source unless the coverage statement names this territory/subregion.`;
  }

  return `Replace the global fallback for ${entry.countryCode} with a national postal operator API, government postcode API, official bulk postcode dataset, or official address register entry in officialPostalSourceCatalog.`;
}

function nonClaimsFor(entry: OfficialPostalSourceCoverageEntry): string[] {
  return [
    `${entry.countryCode} replacement is a source-readiness improvement, not proof that every postcode or delivery point is bundled locally.`,
    'Postal-code existence, address-to-postcode matching, carrier deliverability, and AGID postal-equivalent checks remain separate gates.',
    'Credentialed or rate-limited official APIs may be referenced without bundling private tokens, scraped responses, or restricted bulk data.',
  ];
}

function toCandidate(entry: OfficialPostalSourceCoverageEntry): PostalFallbackReplacementCandidate {
  const specialHandling = classifySpecialHandling(entry.countryCode);

  return {
    countryCode: entry.countryCode,
    countryName: entry.countryName,
    continent: entry.continent,
    continents: [entry.continent],
    relativePath: entry.relativePath,
    profilePaths: [entry.relativePath],
    currentStatus: entry.status,
    currentBestTrustTier: entry.bestTrustTier,
    postalCodeRequired: entry.postalCodeRequired,
    hasPostalCodeMetadata: entry.hasPostalCodeMetadata,
    currentFallbackEvidenceIds: entry.evidence
      .filter(source => source.appliesGlobally && source.trustStrength === 'strong')
      .map(source => source.id),
    replacementSourceKinds: replacementSourceKindsFor(specialHandling),
    requiredGateIds: POSTAL_FALLBACK_REPLACEMENT_GATES.map(gate => gate.id),
    specialHandling,
    nextAction: nextActionFor(entry, specialHandling),
    nonClaims: nonClaimsFor(entry),
  };
}

function mergeCandidatesByCountryCode(
  candidates: PostalFallbackReplacementCandidate[],
): PostalFallbackReplacementCandidate[] {
  const byCode = new Map<string, PostalFallbackReplacementCandidate>();

  for (const candidate of candidates) {
    const existing = byCode.get(candidate.countryCode);
    if (!existing) {
      byCode.set(candidate.countryCode, candidate);
      continue;
    }

    const specialHandling = existing.specialHandling === 'disputed-or-sensitive-region' ||
      candidate.specialHandling === 'disputed-or-sensitive-region'
      ? 'disputed-or-sensitive-region'
      : existing.specialHandling === 'territory-or-subregion' || candidate.specialHandling === 'territory-or-subregion'
        ? 'territory-or-subregion'
        : 'standard-country';

    byCode.set(candidate.countryCode, {
      ...existing,
      continents: [...new Set([...existing.continents, ...candidate.continents])],
      profilePaths: [...new Set([...existing.profilePaths, ...candidate.profilePaths])],
      postalCodeRequired: existing.postalCodeRequired || candidate.postalCodeRequired,
      hasPostalCodeMetadata: existing.hasPostalCodeMetadata || candidate.hasPostalCodeMetadata,
      currentFallbackEvidenceIds: [...new Set([
        ...existing.currentFallbackEvidenceIds,
        ...candidate.currentFallbackEvidenceIds,
      ])],
      replacementSourceKinds: [...new Set([
        ...existing.replacementSourceKinds,
        ...replacementSourceKindsFor(specialHandling),
      ])],
      specialHandling,
      nextAction: nextActionFor({
        countryCode: existing.countryCode,
        countryName: existing.countryName,
      } as OfficialPostalSourceCoverageEntry, specialHandling),
      nonClaims: [...new Set([...existing.nonClaims, ...candidate.nonClaims])],
    });
  }

  return [...byCode.values()];
}

export function buildPostalFallbackReplacementPlan(
  inputs: OfficialPostalSourceCoverageInput[],
): PostalFallbackReplacementPlan {
  const coverageEntries = collectOfficialPostalSourceCoverage(inputs);
  const coverageSummary = summarizeOfficialPostalSourceCoverage(coverageEntries);
  const rawEntries = coverageEntries
    .filter(entry => entry.usesGlobalOfficialFallback)
    .map(toCandidate);
  const entries = mergeCandidatesByCountryCode(rawEntries);
  const byContinent = emptyContinentCounts();
  let disputedOrSensitiveCount = 0;
  let territoryOrSubregionCount = 0;
  let standardCountryCount = 0;

  for (const entry of entries) {
    byContinent[entry.continent] += 1;
    if (entry.specialHandling === 'disputed-or-sensitive-region') {
      disputedOrSensitiveCount += 1;
    } else if (entry.specialHandling === 'territory-or-subregion') {
      territoryOrSubregionCount += 1;
    } else {
      standardCountryCount += 1;
    }
  }

  return {
    summary: {
      version: POSTAL_FALLBACK_REPLACEMENT_PLAN_VERSION,
      totalProfilesChecked: coverageSummary.total,
      fallbackDependentCount: entries.length,
      fallbackDependentProfileCount: rawEntries.length,
      byContinent,
      disputedOrSensitiveCount,
      territoryOrSubregionCount,
      standardCountryCount,
    },
    gates: POSTAL_FALLBACK_REPLACEMENT_GATES,
    entries,
  };
}

export function validatePostalFallbackReplacementPlan(plan: PostalFallbackReplacementPlan): string[] {
  const errors: string[] = [];
  const gateIds = new Set(plan.gates.map(gate => gate.id));

  for (const entry of plan.entries) {
    if (!entry.countryCode) errors.push(`${entry.relativePath}: missing countryCode`);
    if (!entry.currentFallbackEvidenceIds.length) {
      errors.push(`${entry.countryCode}: replacement target is missing current global fallback evidence`);
    }
    for (const gateId of entry.requiredGateIds) {
      if (!gateIds.has(gateId)) errors.push(`${entry.countryCode}: unknown replacement gate ${gateId}`);
    }
    if (entry.replacementSourceKinds.includes('official-territory-or-parent-authority-source') && entry.specialHandling === 'standard-country') {
      errors.push(`${entry.countryCode}: standard countries must not rely on parent-authority replacement kinds`);
    }
    if (!entry.nonClaims.some(nonClaim => /not proof/i.test(nonClaim))) {
      errors.push(`${entry.countryCode}: missing source-readiness non-claim`);
    }
  }

  const counted = Object.values(plan.summary.byContinent).reduce((sum, count) => sum + count, 0);
  if (counted !== plan.summary.fallbackDependentCount) {
    errors.push(`continent counts ${counted} do not match fallback count ${plan.summary.fallbackDependentCount}`);
  }
  if (plan.entries.length !== plan.summary.fallbackDependentCount) {
    errors.push(`entry count ${plan.entries.length} does not match summary ${plan.summary.fallbackDependentCount}`);
  }
  const profileCount = plan.entries.reduce((sum, entry) => sum + entry.profilePaths.length, 0);
  if (profileCount !== plan.summary.fallbackDependentProfileCount) {
    errors.push(`profile count ${profileCount} does not match summary ${plan.summary.fallbackDependentProfileCount}`);
  }

  return errors;
}
