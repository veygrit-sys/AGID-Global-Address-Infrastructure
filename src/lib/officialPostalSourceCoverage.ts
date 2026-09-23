import {
  AFRICA_OPEN_GEO_SOURCES,
  getAfricaOpenSourceIds,
} from '../data/africaOpenGeoSources';
import {
  AMERICAS_OPEN_GEO_SOURCES,
  getAmericasOpenSourceIds,
} from '../data/americasOpenGeoSources';
import {
  ASIA_OPEN_GEO_SOURCES,
  getAsiaOpenSourceIds,
} from '../data/asiaOpenGeoSources';
import {
  EUROPE_OPEN_GEO_SOURCES,
  getEuropeOpenSourceIds,
} from '../data/europeOpenGeoSources';
import {
  OCEANIA_OPEN_GEO_SOURCES,
  getOceaniaOpenSourceIds,
} from '../data/oceaniaOpenGeoSources';
import {
  POLAR_OPEN_GEO_SOURCES,
  getPolarOpenSourceIds,
} from '../data/polarOpenGeoSources';
import { hasAddressPostalCodeMetadata } from './addressCoveragePolicy';
import {
  classifyPostalSourceTrust,
  getOfficialPostalSourcesForCountry,
  OfficialPostalSourceProfile,
  isStrongPostalTrustTier,
  PostalSourceTrustTier,
} from './officialPostalSourceCatalog';

export const POSTAL_SOURCE_CONTINENT_ORDER = [
  'africa',
  'americas',
  'asia',
  'europe',
  'oceania',
  'antarctica',
  'special',
] as const;

export type PostalSourceContinent = typeof POSTAL_SOURCE_CONTINENT_ORDER[number];

export type PostalSourceCoverageStatus =
  | 'authoritative'
  | 'official'
  | 'official-derived'
  | 'open-reference'
  | 'community'
  | 'needs-official-source'
  | 'no-normal-postcode';

export type PostalSourceRegistryRecord = {
  id: string;
  name: string;
  url: string;
  kind: string;
  coverage: string;
  usage: string;
  license?: string;
  notes?: string;
};

export type OfficialPostalSourceCoverageFormat = {
  countryCode?: string;
  name?: string;
  postalCode?: {
    format?: string | null;
    regex?: string | null;
    api?: string | null;
    source?: string | null;
  };
  openSourceIds?: string[];
  addressRules?: {
    openSourceIds?: string[];
    postalCode?: {
      label?: string;
      required?: boolean;
      usage?: string;
    } | null;
  };
};

export type OfficialPostalSourceCoverageInput = {
  relativePath: string;
  format: OfficialPostalSourceCoverageFormat;
};

export type PostalSourceEvidence = {
  id: string;
  name: string;
  url: string | null;
  kind: 'postal-api' | 'open-source' | 'catalog-remediation';
  sourceKind?: string;
  trustTier: PostalSourceTrustTier;
  trustStrength: 'strong' | 'weak';
  authority?: OfficialPostalSourceProfile['authority'];
  availability?: OfficialPostalSourceProfile['availability'];
  sourceRole?: OfficialPostalSourceProfile['sourceRole'];
  validationReadiness?: OfficialPostalSourceProfile['validationReadiness'];
  appliesGlobally?: boolean;
  requiresCredential?: boolean;
  reason: string;
};

export type OfficialPostalSourceCoverageEntry = {
  continent: PostalSourceContinent;
  relativePath: string;
  countryCode: string;
  countryName: string;
  postalCodeRequired: boolean;
  hasPostalCodeMetadata: boolean;
  status: PostalSourceCoverageStatus;
  bestTrustTier: PostalSourceTrustTier;
  sourceIds: string[];
  evidence: PostalSourceEvidence[];
  missingOfficialSource: boolean;
  usesGlobalOfficialFallback: boolean;
  countrySpecificOfficialEvidence: boolean;
  countrySpecificOfficialSourceMissing: boolean;
  recommendation: string;
};

export type OfficialPostalSourceCoverageSummary = {
  total: number;
  byContinent: Record<PostalSourceContinent, number>;
  byStatus: Record<PostalSourceCoverageStatus, number>;
  missingOfficialSourceCountryCodes: string[];
  missingOfficialSourceCountryCodesByContinent: Record<PostalSourceContinent, string[]>;
  globalOfficialFallbackCountryCodes: string[];
  globalOfficialFallbackCountryCodesByContinent: Record<PostalSourceContinent, string[]>;
  countrySpecificOfficialMissingCountryCodes: string[];
  countrySpecificOfficialMissingCountryCodesByContinent: Record<PostalSourceContinent, string[]>;
};

const CONTINENT_INDEX = Object.fromEntries(
  POSTAL_SOURCE_CONTINENT_ORDER.map((continent, index) => [continent, index]),
) as Record<PostalSourceContinent, number>;

const SOURCE_REGISTRY: Record<string, PostalSourceRegistryRecord> = {
  ...AFRICA_OPEN_GEO_SOURCES,
  ...AMERICAS_OPEN_GEO_SOURCES,
  ...ASIA_OPEN_GEO_SOURCES,
  ...EUROPE_OPEN_GEO_SOURCES,
  ...OCEANIA_OPEN_GEO_SOURCES,
  ...POLAR_OPEN_GEO_SOURCES,
};

const POSTAL_OR_ADDRESS_SOURCE_KINDS = new Set([
  'postal-code',
  'address',
  'geocoding',
]);

const NO_NORMAL_POSTCODE_PATTERN =
  /\b(no postal code|no postal codes|no postcode|without postal|postal code not used|not used|none|n\/a|nothing)\b|なし|無|ない/i;

const TRUST_RANK: Record<PostalSourceTrustTier, number> = {
  authoritative: 6,
  official: 5,
  'official-derived': 4,
  'open-reference': 3,
  community: 2,
  weak: 1,
};

const OFFICIAL_TRUST_TIERS = new Set<PostalSourceTrustTier>([
  'authoritative',
  'official',
  'official-derived',
]);

const unique = <T>(values: T[]) => [...new Set(values)];

function uniqueCountryCodesInEntryOrder(
  entries: OfficialPostalSourceCoverageEntry[],
  predicate: (entry: OfficialPostalSourceCoverageEntry) => boolean,
) {
  const seen = new Set<string>();
  const countryCodes: string[] = [];
  for (const entry of entries) {
    if (!predicate(entry) || seen.has(entry.countryCode)) continue;
    seen.add(entry.countryCode);
    countryCodes.push(entry.countryCode);
  }
  return countryCodes;
}

function countryCodesByContinent(
  entries: OfficialPostalSourceCoverageEntry[],
  predicate: (entry: OfficialPostalSourceCoverageEntry) => boolean,
) {
  const byContinent = Object.fromEntries(
    POSTAL_SOURCE_CONTINENT_ORDER.map(continent => [continent, [] as string[]]),
  ) as Record<PostalSourceContinent, string[]>;
  const seenByContinent = Object.fromEntries(
    POSTAL_SOURCE_CONTINENT_ORDER.map(continent => [continent, new Set<string>()]),
  ) as Record<PostalSourceContinent, Set<string>>;

  for (const entry of entries) {
    if (!predicate(entry) || seenByContinent[entry.continent].has(entry.countryCode)) continue;
    seenByContinent[entry.continent].add(entry.countryCode);
    byContinent[entry.continent].push(entry.countryCode);
  }

  return byContinent;
}

function normalizeCountryCode(value: unknown) {
  return String(value ?? '').normalize('NFKC').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

function normalizePath(path: string) {
  return path.replace(/\\/g, '/');
}

export function getPostalSourceRegistry() {
  return SOURCE_REGISTRY;
}

export function getPostalSourceContinent(relativePath: string): PostalSourceContinent {
  const firstSegment = normalizePath(relativePath).split('/').filter(Boolean)[0];
  if (firstSegment === 'antarctica') return 'antarctica';
  if (POSTAL_SOURCE_CONTINENT_ORDER.includes(firstSegment as PostalSourceContinent)) {
    return firstSegment as PostalSourceContinent;
  }
  return 'special';
}

function getContinentSourceIds(continent: PostalSourceContinent, countryCode: string) {
  switch (continent) {
    case 'africa':
      return getAfricaOpenSourceIds(countryCode);
    case 'americas':
      return getAmericasOpenSourceIds(countryCode);
    case 'asia':
      return getAsiaOpenSourceIds(countryCode);
    case 'europe':
      return getEuropeOpenSourceIds(countryCode);
    case 'oceania':
      return getOceaniaOpenSourceIds(countryCode);
    case 'antarctica':
      return getPolarOpenSourceIds(countryCode || 'AQ');
    case 'special':
      return [];
  }
}

function collectSourceIds(
  format: OfficialPostalSourceCoverageFormat,
  continent: PostalSourceContinent,
  countryCode: string,
) {
  return unique([
    ...(format.openSourceIds ?? []),
    ...(format.addressRules?.openSourceIds ?? []),
    ...getContinentSourceIds(continent, countryCode),
  ].filter(Boolean));
}

function noNormalPostcode(format: OfficialPostalSourceCoverageFormat) {
  const text = [
    format.postalCode?.format,
    format.postalCode?.source,
    format.postalCode?.api,
    format.addressRules?.postalCode?.label,
    format.addressRules?.postalCode?.usage,
  ].filter(Boolean).join(' ');

  return NO_NORMAL_POSTCODE_PATTERN.test(text);
}

function compareEvidence(left: PostalSourceEvidence, right: PostalSourceEvidence) {
  const tierDelta = TRUST_RANK[right.trustTier] - TRUST_RANK[left.trustTier];
  if (tierDelta) return tierDelta;
  const globalDelta = Number(Boolean(left.appliesGlobally)) - Number(Boolean(right.appliesGlobally));
  if (globalDelta) return globalDelta;
  const strengthDelta = Number(right.trustStrength === 'strong') - Number(left.trustStrength === 'strong');
  if (strengthDelta) return strengthDelta;
  return left.id.localeCompare(right.id);
}

function makePostalApiEvidence(format: OfficialPostalSourceCoverageFormat, countryCode: string): PostalSourceEvidence[] {
  if (!format.postalCode?.api && !format.postalCode?.source) return [];
  const classification = classifyPostalSourceTrust({
    countryCode,
    source: format.postalCode?.source,
    url: format.postalCode?.api,
  });

  return [{
    id: `postal-api:${format.postalCode?.api ?? format.postalCode?.source}`,
    name: format.postalCode?.source || format.postalCode?.api || 'Postal API/source',
    url: format.postalCode?.api ?? null,
    kind: 'postal-api',
    trustTier: classification.tier,
    trustStrength: classification.strength,
    reason: classification.reason,
  }];
}

function makeOpenSourceEvidence(sourceIds: string[], countryCode: string) {
  return sourceIds.flatMap((sourceId): PostalSourceEvidence[] => {
    const source = SOURCE_REGISTRY[sourceId];
    if (!source || !POSTAL_OR_ADDRESS_SOURCE_KINDS.has(source.kind)) return [];
    const classification = classifyPostalSourceTrust({
      countryCode,
      source: `${source.name} ${source.notes ?? ''}`,
      url: source.url,
      sourceIds: [source.id],
    });

    return [{
      id: source.id,
      name: source.name,
      url: source.url,
      kind: 'open-source',
      sourceKind: source.kind,
      trustTier: classification.tier,
      trustStrength: classification.strength,
      reason: classification.reason,
    }];
  });
}

function makeCatalogEvidence(countryCode: string): PostalSourceEvidence[] {
  return getOfficialPostalSourcesForCountry(countryCode)
    .filter(source => isStrongPostalTrustTier(source.trustTier))
    .map(source => ({
      id: `catalog:${source.id}`,
      name: source.label,
      url: source.url,
      kind: 'catalog-remediation',
      sourceKind: source.depth,
      trustTier: source.trustTier,
      trustStrength: 'strong',
      authority: source.authority,
      availability: source.availability,
      sourceRole: source.sourceRole ?? 'postal-reference-data',
      validationReadiness: source.validationReadiness ?? 'reference-eligible',
      appliesGlobally: source.countryCodes.includes('*'),
      requiresCredential: source.requiresCredential,
      reason: source.sourceRole === 'legal-framework-only'
        ? `${source.label} is recorded as an official legal framework, not a postal-reference dataset.`
        : `${source.label} is registered in the official postal source catalog (${source.availability}; ${source.validationReadiness ?? 'reference-eligible'}).`,
    }));
}

function isOfficialPostalTrustTier(tier: PostalSourceTrustTier) {
  return OFFICIAL_TRUST_TIERS.has(tier);
}

function isValidationReferenceEligible(source: PostalSourceEvidence) {
  return source.validationReadiness !== 'metadata-only';
}

function hasStrongCountrySpecificOfficialEvidence(evidence: PostalSourceEvidence[]) {
  return evidence.some(source => (
    isValidationReferenceEligible(source) &&
    source.trustStrength === 'strong' &&
    !source.appliesGlobally &&
    isOfficialPostalTrustTier(source.trustTier)
  ));
}

function hasStrongGlobalOfficialFallback(evidence: PostalSourceEvidence[]) {
  return evidence.some(source => (
    isValidationReferenceEligible(source) &&
    source.trustStrength === 'strong' &&
    Boolean(source.appliesGlobally) &&
    isOfficialPostalTrustTier(source.trustTier)
  ));
}

function statusFromEvidence(
  evidence: PostalSourceEvidence[],
  hasPostalCodeMetadata: boolean,
  postalCodeRequired: boolean,
  noNormalPostalCode: boolean,
): PostalSourceCoverageStatus {
  if (noNormalPostalCode && !postalCodeRequired) return 'no-normal-postcode';
  const best = evidence.find(isValidationReferenceEligible);
  if (!best) return postalCodeRequired || hasPostalCodeMetadata ? 'needs-official-source' : 'no-normal-postcode';

  if ((postalCodeRequired || hasPostalCodeMetadata) && (
    best.trustTier === 'open-reference' ||
    best.trustTier === 'community' ||
    best.trustTier === 'weak'
  )) {
    return 'needs-official-source';
  }

  if (!isStrongPostalTrustTier(best.trustTier)) {
    return postalCodeRequired || hasPostalCodeMetadata ? 'needs-official-source' : 'community';
  }
  if (best.trustTier === 'authoritative') return 'authoritative';
  if (best.trustTier === 'official') return 'official';
  if (best.trustTier === 'official-derived') return 'official-derived';
  return 'open-reference';
}

function recommendationFor(entry: Pick<OfficialPostalSourceCoverageEntry,
  'status' | 'postalCodeRequired' | 'hasPostalCodeMetadata' | 'countryCode' | 'countrySpecificOfficialSourceMissing'>) {
  if (entry.countrySpecificOfficialSourceMissing) {
    return entry.postalCodeRequired || entry.hasPostalCodeMetadata
      ? 'Use the global official postal fallback for baseline postcode checks, but add the national postal operator, official government postcode API, or official bulk postcode dataset before claiming country-specific postal proof.'
      : 'Keep AGID/geospatial verification primary and add an official local authority source if normal addresses become available.';
  }
  if (entry.status === 'needs-official-source') {
    return entry.postalCodeRequired || entry.hasPostalCodeMetadata
      ? 'Add the national postal operator, official government postcode API, or official bulk postcode dataset before using strong postal verification.'
      : 'Keep AGID/geospatial verification primary and add an official local authority source if normal addresses become available.';
  }
  if (entry.status === 'no-normal-postcode') {
    return 'Use AGID, coordinates, official geodata, facility/station names, and manual confirmation instead of postcode proof.';
  }
  return `Use ${entry.status} evidence as the primary source tier for ${entry.countryCode}; keep open references as disagreement checks.`;
}

export function collectOfficialPostalSourceCoverage(
  inputs: OfficialPostalSourceCoverageInput[],
): OfficialPostalSourceCoverageEntry[] {
  return inputs.map(({ relativePath, format }) => {
    const continent = getPostalSourceContinent(relativePath);
    const countryCode = normalizeCountryCode(format.countryCode);
    const sourceIds = collectSourceIds(format, continent, countryCode);
    const hasPostalCodeMetadata = hasAddressPostalCodeMetadata(format);
    const postalCodeRequired = Boolean(format.addressRules?.postalCode?.required);
    const evidence = [
      ...makePostalApiEvidence(format, countryCode),
      ...makeOpenSourceEvidence(sourceIds, countryCode),
      ...makeCatalogEvidence(countryCode),
    ].sort(compareEvidence);
    const noNormalPostalCode = noNormalPostcode(format);
    const status = statusFromEvidence(evidence, hasPostalCodeMetadata, postalCodeRequired, noNormalPostalCode);
    const bestTrustTier = evidence.find(isValidationReferenceEligible)?.trustTier ?? 'weak';
    const missingOfficialSource = status === 'needs-official-source';
    const needsPostalSource = postalCodeRequired || hasPostalCodeMetadata;
    const countrySpecificOfficialEvidence = hasStrongCountrySpecificOfficialEvidence(evidence);
    const usesGlobalOfficialFallback = (
      needsPostalSource &&
      status !== 'no-normal-postcode' &&
      !countrySpecificOfficialEvidence &&
      hasStrongGlobalOfficialFallback(evidence)
    );
    const countrySpecificOfficialSourceMissing = (
      needsPostalSource &&
      status !== 'no-normal-postcode' &&
      !countrySpecificOfficialEvidence
    );
    const entryWithoutRecommendation = {
      continent,
      relativePath: normalizePath(relativePath),
      countryCode,
      countryName: format.name ?? countryCode,
      postalCodeRequired,
      hasPostalCodeMetadata,
      status,
      bestTrustTier,
      sourceIds,
      evidence,
      missingOfficialSource,
      usesGlobalOfficialFallback,
      countrySpecificOfficialEvidence,
      countrySpecificOfficialSourceMissing,
    };

    return {
      ...entryWithoutRecommendation,
      recommendation: recommendationFor(entryWithoutRecommendation),
    };
  }).sort((left, right) => {
    const continentDelta = CONTINENT_INDEX[left.continent] - CONTINENT_INDEX[right.continent];
    if (continentDelta) return continentDelta;
    const pathDelta = left.relativePath.localeCompare(right.relativePath);
    if (pathDelta) return pathDelta;
    return left.countryCode.localeCompare(right.countryCode);
  });
}

export function summarizeOfficialPostalSourceCoverage(
  entries: OfficialPostalSourceCoverageEntry[],
): OfficialPostalSourceCoverageSummary {
  const byContinent = Object.fromEntries(
    POSTAL_SOURCE_CONTINENT_ORDER.map(continent => [continent, 0]),
  ) as Record<PostalSourceContinent, number>;

  const statuses: PostalSourceCoverageStatus[] = [
    'authoritative',
    'official',
    'official-derived',
    'open-reference',
    'community',
    'needs-official-source',
    'no-normal-postcode',
  ];
  const byStatus = Object.fromEntries(statuses.map(status => [status, 0])) as Record<PostalSourceCoverageStatus, number>;

  for (const entry of entries) {
    byContinent[entry.continent] += 1;
    byStatus[entry.status] += 1;
  }

  return {
    total: entries.length,
    byContinent,
    byStatus,
    missingOfficialSourceCountryCodes: uniqueCountryCodesInEntryOrder(
      entries,
      entry => entry.missingOfficialSource,
    ),
    missingOfficialSourceCountryCodesByContinent: countryCodesByContinent(
      entries,
      entry => entry.missingOfficialSource,
    ),
    globalOfficialFallbackCountryCodes: uniqueCountryCodesInEntryOrder(
      entries,
      entry => entry.usesGlobalOfficialFallback,
    ),
    globalOfficialFallbackCountryCodesByContinent: countryCodesByContinent(
      entries,
      entry => entry.usesGlobalOfficialFallback,
    ),
    countrySpecificOfficialMissingCountryCodes: uniqueCountryCodesInEntryOrder(
      entries,
      entry => entry.countrySpecificOfficialSourceMissing,
    ),
    countrySpecificOfficialMissingCountryCodesByContinent: countryCodesByContinent(
      entries,
      entry => entry.countrySpecificOfficialSourceMissing,
    ),
  };
}
