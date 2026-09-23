import {
  collectOfficialPostalSourceCoverage,
  OfficialPostalSourceCoverageEntry,
  OfficialPostalSourceCoverageInput,
  POSTAL_SOURCE_CONTINENT_ORDER,
  PostalSourceContinent,
} from './officialPostalSourceCoverage';
import { PostalSourceTrustTier } from './officialPostalSourceCatalog';

export const POSTAL_SELF_BUILD_CANDIDATE_PLAN_VERSION = 'postal-self-build-candidate-plan-v0.1' as const;

export type PostalSelfBuildPriority = 'strict-required' | 'metadata-only';

export type PostalSelfBuildDraftPackState = 'draft-pack-present' | 'draft-pack-missing';

export type PostalSelfBuildSpecialHandling =
  | 'standard-country'
  | 'territory-or-subregion'
  | 'disputed-or-sensitive-region';

export type PostalSelfBuildCandidateGate = {
  id: string;
  label: string;
  requirement: string;
};

export type PostalSelfBuildCandidate = {
  countryCode: string;
  countryName: string;
  continent: PostalSourceContinent;
  continents: PostalSourceContinent[];
  relativePath: string;
  profilePaths: string[];
  priority: PostalSelfBuildPriority;
  existingDraftPackState: PostalSelfBuildDraftPackState;
  currentStatus: OfficialPostalSourceCoverageEntry['status'];
  currentBestTrustTier: PostalSourceTrustTier;
  postalCodeRequired: boolean;
  hasPostalCodeMetadata: boolean;
  countrySpecificOfficialSourceMissing: true;
  requiredGateIds: string[];
  specialHandling: PostalSelfBuildSpecialHandling;
  nextAction: string;
  nonClaims: string[];
};

export type PostalSelfBuildCandidatePlanSummary = {
  version: typeof POSTAL_SELF_BUILD_CANDIDATE_PLAN_VERSION;
  totalProfilesChecked: number;
  candidateCount: number;
  candidateProfileCount: number;
  strictRequiredCount: number;
  metadataOnlyCount: number;
  existingDraftPackCount: number;
  missingDraftPackCount: number;
  byContinent: Record<PostalSourceContinent, number>;
  disputedOrSensitiveCount: number;
  territoryOrSubregionCount: number;
  standardCountryCount: number;
};

export type PostalSelfBuildCandidatePlan = {
  summary: PostalSelfBuildCandidatePlanSummary;
  gates: PostalSelfBuildCandidateGate[];
  entries: PostalSelfBuildCandidate[];
};

export type PostalSelfBuildCandidatePlanOptions = {
  existingDraftPackCountryCodes?: readonly string[];
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

export const POSTAL_SELF_BUILD_CANDIDATE_GATES: PostalSelfBuildCandidateGate[] = [
  {
    id: 'country-specific-official-source-missing',
    label: 'Country-specific official source missing',
    requirement:
      'A self-build candidate is allowed only when AGID lacks country-specific official postal source evidence for the country or region code.',
  },
  {
    id: 'postal-code-required-or-metadata-present',
    label: 'Postal-code signal present',
    requirement:
      'The country profile must either require a postal code or carry postal-code format, regex, API, source, label, or usage metadata.',
  },
  {
    id: 'draft-pack-is-not-official',
    label: 'Draft pack non-claim',
    requirement:
      'AGID draft packs must be labeled as postal-equivalent/open-source fixtures and must not claim to be official national postcode datasets.',
  },
  {
    id: 'public-redistributable-fixtures-only',
    label: 'Public redistributable fixtures only',
    requirement:
      'Self-built fixtures must avoid raw address, recipient, witness, private-key, proof-secret, production credential, scraped, or restricted material.',
  },
  {
    id: 'sensitive-region-neutrality-recorded',
    label: 'Sensitive region neutrality',
    requirement:
      'Disputed or politically sensitive region packs must record source scope and must not claim political recognition.',
  },
];

function emptyContinentCounts() {
  return Object.fromEntries(
    POSTAL_SOURCE_CONTINENT_ORDER.map(continent => [continent, 0]),
  ) as Record<PostalSourceContinent, number>;
}

function normalizeCountryCode(value: string) {
  return value.normalize('NFKC').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

function priorityFor(entry: OfficialPostalSourceCoverageEntry): PostalSelfBuildPriority {
  return entry.postalCodeRequired ? 'strict-required' : 'metadata-only';
}

function classifySpecialHandling(countryCode: string): PostalSelfBuildSpecialHandling {
  if (DISPUTED_OR_SENSITIVE_CODES.has(countryCode)) return 'disputed-or-sensitive-region';
  if (countryCode.includes('-') || countryCode.length > 2) return 'territory-or-subregion';
  return 'standard-country';
}

function highestSpecialHandling(
  first: PostalSelfBuildSpecialHandling,
  second: PostalSelfBuildSpecialHandling,
): PostalSelfBuildSpecialHandling {
  if (first === 'disputed-or-sensitive-region' || second === 'disputed-or-sensitive-region') {
    return 'disputed-or-sensitive-region';
  }

  if (first === 'territory-or-subregion' || second === 'territory-or-subregion') {
    return 'territory-or-subregion';
  }

  return 'standard-country';
}

function draftPackStateFor(
  countryCode: string,
  existingDraftPackCountryCodes: Set<string>,
): PostalSelfBuildDraftPackState {
  return existingDraftPackCountryCodes.has(countryCode) ? 'draft-pack-present' : 'draft-pack-missing';
}

function isSelfBuildCandidate(entry: OfficialPostalSourceCoverageEntry) {
  return entry.countrySpecificOfficialSourceMissing &&
    (entry.postalCodeRequired || entry.hasPostalCodeMetadata);
}

function nextActionFor(candidate: Pick<
  PostalSelfBuildCandidate,
  'countryCode' | 'existingDraftPackState' | 'specialHandling'
>) {
  if (candidate.existingDraftPackState === 'draft-pack-present') {
    return `Audit the existing AGID draft postal-equivalent pack for ${candidate.countryCode}; keep it marked draft until country-specific official source and redistribution evidence pass.`;
  }

  if (candidate.specialHandling === 'disputed-or-sensitive-region') {
    return `Create a neutral AGID draft postal-equivalent pack for ${candidate.countryCode} from public redistributable fixtures; record source scope and do not claim political recognition.`;
  }

  if (candidate.specialHandling === 'territory-or-subregion') {
    return `Create a scoped AGID draft postal-equivalent pack for ${candidate.countryCode}; record territory or parent-authority coverage before treating it as official.`;
  }

  return `Create an AGID draft postal-equivalent pack for ${candidate.countryCode} from public redistributable fixtures, then replace it with country-specific official evidence when license gates pass.`;
}

function nonClaimsFor(countryCode: string): string[] {
  return [
    `${countryCode} is a self-build candidate because AGID lacks country-specific official source evidence, not because no postal codes exist.`,
    'AGID draft packs are postal-equivalent/open-source fixtures and are not official national postcode datasets.',
    'Do not bundle raw address, recipient, witness, private-key, proof-secret, production credential, scraped, or restricted material.',
  ];
}

function toCandidate(
  entry: OfficialPostalSourceCoverageEntry,
  existingDraftPackCountryCodes: Set<string>,
): PostalSelfBuildCandidate {
  const countryCode = normalizeCountryCode(entry.countryCode);
  const specialHandling = classifySpecialHandling(countryCode);
  const existingDraftPackState = draftPackStateFor(countryCode, existingDraftPackCountryCodes);
  const base = {
    countryCode,
    existingDraftPackState,
    specialHandling,
  };

  return {
    countryCode,
    countryName: entry.countryName,
    continent: entry.continent,
    continents: [entry.continent],
    relativePath: entry.relativePath,
    profilePaths: [entry.relativePath],
    priority: priorityFor(entry),
    existingDraftPackState,
    currentStatus: entry.status,
    currentBestTrustTier: entry.bestTrustTier,
    postalCodeRequired: entry.postalCodeRequired,
    hasPostalCodeMetadata: entry.hasPostalCodeMetadata,
    countrySpecificOfficialSourceMissing: true,
    requiredGateIds: POSTAL_SELF_BUILD_CANDIDATE_GATES.map(gate => gate.id),
    specialHandling,
    nextAction: nextActionFor(base),
    nonClaims: nonClaimsFor(countryCode),
  };
}

function mergeCandidatesByCountryCode(candidates: PostalSelfBuildCandidate[]) {
  const byCode = new Map<string, PostalSelfBuildCandidate>();

  for (const candidate of candidates) {
    const existing = byCode.get(candidate.countryCode);
    if (!existing) {
      byCode.set(candidate.countryCode, candidate);
      continue;
    }

    const specialHandling = highestSpecialHandling(existing.specialHandling, candidate.specialHandling);
    const merged = {
      ...existing,
      continents: [...new Set([...existing.continents, ...candidate.continents])],
      profilePaths: [...new Set([...existing.profilePaths, ...candidate.profilePaths])],
      priority: existing.priority === 'strict-required' || candidate.priority === 'strict-required'
        ? 'strict-required'
        : 'metadata-only',
      postalCodeRequired: existing.postalCodeRequired || candidate.postalCodeRequired,
      hasPostalCodeMetadata: existing.hasPostalCodeMetadata || candidate.hasPostalCodeMetadata,
      specialHandling,
      nonClaims: [...new Set([...existing.nonClaims, ...candidate.nonClaims])],
    } satisfies PostalSelfBuildCandidate;

    byCode.set(candidate.countryCode, {
      ...merged,
      nextAction: nextActionFor(merged),
    });
  }

  return [...byCode.values()];
}

export function buildPostalSelfBuildCandidatePlan(
  inputs: OfficialPostalSourceCoverageInput[],
  options: PostalSelfBuildCandidatePlanOptions = {},
): PostalSelfBuildCandidatePlan {
  const existingDraftPackCountryCodes = new Set(
    (options.existingDraftPackCountryCodes ?? []).map(normalizeCountryCode),
  );
  const coverageEntries = collectOfficialPostalSourceCoverage(inputs);
  const rawEntries = coverageEntries
    .filter(isSelfBuildCandidate)
    .map(entry => toCandidate(entry, existingDraftPackCountryCodes));
  const entries = mergeCandidatesByCountryCode(rawEntries);
  const byContinent = emptyContinentCounts();
  let strictRequiredCount = 0;
  let metadataOnlyCount = 0;
  let existingDraftPackCount = 0;
  let missingDraftPackCount = 0;
  let disputedOrSensitiveCount = 0;
  let territoryOrSubregionCount = 0;
  let standardCountryCount = 0;

  for (const entry of entries) {
    byContinent[entry.continent] += 1;
    if (entry.priority === 'strict-required') strictRequiredCount += 1;
    if (entry.priority === 'metadata-only') metadataOnlyCount += 1;
    if (entry.existingDraftPackState === 'draft-pack-present') existingDraftPackCount += 1;
    if (entry.existingDraftPackState === 'draft-pack-missing') missingDraftPackCount += 1;
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
      version: POSTAL_SELF_BUILD_CANDIDATE_PLAN_VERSION,
      totalProfilesChecked: coverageEntries.length,
      candidateCount: entries.length,
      candidateProfileCount: rawEntries.length,
      strictRequiredCount,
      metadataOnlyCount,
      existingDraftPackCount,
      missingDraftPackCount,
      byContinent,
      disputedOrSensitiveCount,
      territoryOrSubregionCount,
      standardCountryCount,
    },
    gates: POSTAL_SELF_BUILD_CANDIDATE_GATES,
    entries,
  };
}

export function validatePostalSelfBuildCandidatePlan(plan: PostalSelfBuildCandidatePlan) {
  const errors: string[] = [];
  const gateIds = new Set(POSTAL_SELF_BUILD_CANDIDATE_GATES.map(gate => gate.id));

  if (plan.summary.version !== POSTAL_SELF_BUILD_CANDIDATE_PLAN_VERSION) {
    errors.push('summary.version must match POSTAL_SELF_BUILD_CANDIDATE_PLAN_VERSION');
  }

  if (plan.entries.length !== plan.summary.candidateCount) {
    errors.push('summary.candidateCount must match entries.length');
  }

  if (plan.gates.length !== POSTAL_SELF_BUILD_CANDIDATE_GATES.length) {
    errors.push('gates must match POSTAL_SELF_BUILD_CANDIDATE_GATES');
  }

  for (const entry of plan.entries) {
    if (!entry.countryCode) errors.push('entry.countryCode is required');
    if (!entry.countrySpecificOfficialSourceMissing) {
      errors.push(`${entry.countryCode} must be missing country-specific official source evidence`);
    }
    if (!entry.postalCodeRequired && !entry.hasPostalCodeMetadata) {
      errors.push(`${entry.countryCode} must have a postal-code requirement or metadata signal`);
    }
    if (!entry.requiredGateIds.every(gateId => gateIds.has(gateId))) {
      errors.push(`${entry.countryCode} contains an unknown gate id`);
    }
    if (!entry.nonClaims.some(nonClaim => nonClaim.includes('not official'))) {
      errors.push(`${entry.countryCode} must record that draft packs are not official datasets`);
    }
    if (entry.existingDraftPackState === 'draft-pack-present' && !entry.nextAction.includes('existing')) {
      errors.push(`${entry.countryCode} existing draft pack next action must mention existing pack audit`);
    }
    if (
      entry.existingDraftPackState === 'draft-pack-missing' &&
      !entry.nextAction.includes('Create') &&
      !entry.nextAction.includes('create')
    ) {
      errors.push(`${entry.countryCode} missing draft pack next action must create a draft pack`);
    }
    if (
      entry.specialHandling === 'disputed-or-sensitive-region' &&
      !entry.nextAction.includes('do not claim political recognition')
    ) {
      errors.push(`${entry.countryCode} sensitive-region next action must deny political recognition claims`);
    }
  }

  return errors;
}
