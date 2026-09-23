import {
  classifyPostalSourceTrust,
  getOfficialPostalSourcesForCountry,
  isStrongPostalTrustTier,
  isPostalReferenceDataSource,
  type OfficialPostalSourceProfile,
  type PostalSourceAvailability,
  type PostalSourceDepth,
  type PostalSourceTrustTier,
} from './officialPostalSourceCatalog';

export const ADDRESS_DATA_LOAD_PLAN_VERSION = 'address-data-load-plan-v1';

export type AddressDataPostalMode =
  | 'none'
  | 'format-only'
  | 'format-and-lookup'
  | 'geo-only'
  | 'manual';

export type AddressDataServiceKind =
  | 'format-rules'
  | 'official-postal-api'
  | 'official-postal-bulk'
  | 'open-address-reference'
  | 'community-postal-api'
  | 'geocoder'
  | 'licensed-postal'
  | 'manual-review';

export type AddressDataLoadMode =
  | 'blocking'
  | 'background'
  | 'on-demand'
  | 'disabled';

export type AddressDataLoadWeight = 'light' | 'medium' | 'heavy';

export type AddressDataLoadFormatLike = {
  countryCode?: string;
  name?: string;
  postalCode?: {
    source?: string | null;
    api?: string | null;
  };
  openSourceIds?: string[];
  addressRules?: {
    openSourceIds?: string[];
  };
};

export type AddressDataLoadPolicyLike = {
  countryCode: string;
  enabled: boolean;
  label: string;
  postalMode: AddressDataPostalMode;
  lookupSources: string[];
};

export type AddressDataLoadPlanOptions = {
  countryCode?: string;
  targetCountries?: string[];
  format?: AddressDataLoadFormatLike | null;
  policy?: AddressDataLoadPolicyLike | null;
  postalMode?: AddressDataPostalMode;
  lookupRequired?: boolean;
  hasPostalCode?: boolean;
  allowCredentialedSources?: boolean;
  includeGlobalFallbacks?: boolean;
  preloadOfficialBulk?: boolean;
  maxBlockingSources?: number;
};

export type AddressDataLoadSource = {
  id: string;
  label: string;
  kind: AddressDataServiceKind;
  mode: AddressDataLoadMode;
  trustTier: PostalSourceTrustTier | 'local';
  availability: PostalSourceAvailability | 'local';
  depth: PostalSourceDepth | 'format';
  countryCodes: string[];
  priority: number;
  blocking: boolean;
  networked: boolean;
  requiresCredential: boolean;
  weight: AddressDataLoadWeight;
  ttlMs: number;
  staleWhileRevalidateMs: number;
  url?: string;
  reason: string;
};

export type AddressDataLoadPlan = {
  planVersion: string;
  countryCode: string | null;
  targetCountries: string[];
  targetAllowed: boolean;
  lookupRequired: boolean;
  hasPostalCode: boolean;
  cachePolicy: {
    memoryTtlMs: number;
    persistentTtlMs: number;
    staleWhileRevalidateMs: number;
    maxEntries: number;
  };
  blocking: AddressDataLoadSource[];
  background: AddressDataLoadSource[];
  onDemand: AddressDataLoadSource[];
  disabled: AddressDataLoadSource[];
  warnings: string[];
  nextActions: string[];
};

const DEFAULT_CACHE_POLICY = {
  memoryTtlMs: 45_000,
  persistentTtlMs: 24 * 60 * 60 * 1000,
  staleWhileRevalidateMs: 7 * 24 * 60 * 60 * 1000,
  maxEntries: 800,
};

const clean = (value: unknown) => String(value ?? '').normalize('NFKC').replace(/[\u3000\s]+/g, ' ').trim();

function normalizeCountryCode(value: unknown) {
  const normalized = clean(value).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  return normalized === 'UK' ? 'GB' : normalized;
}

function normalizeSourceId(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function sourceWeight(availability: PostalSourceAvailability): AddressDataLoadWeight {
  if (availability === 'bulk-open-data' || availability === 'licensed-bulk-data') return 'heavy';
  if (availability === 'auth-required-api' || availability === 'commercial-or-restricted') return 'medium';
  return 'light';
}

function sourceNetworked(availability: PostalSourceAvailability | 'local') {
  return availability !== 'local' && availability !== 'no-normal-postcode';
}

function sourceKind(profile: OfficialPostalSourceProfile): AddressDataServiceKind {
  if (profile.id === 'openaddresses') return 'open-address-reference';
  if (profile.id === 'osm-nominatim') return 'geocoder';
  if (profile.availability === 'licensed-bulk-data' || profile.availability === 'commercial-or-restricted') {
    return 'licensed-postal';
  }
  if (profile.availability === 'bulk-open-data') return 'official-postal-bulk';
  if (profile.trustTier === 'community' || profile.trustTier === 'weak') return 'community-postal-api';
  if (profile.depth === 'geo-only' || profile.availability === 'no-normal-postcode') return 'geocoder';
  return 'official-postal-api';
}

function modeForProfile(
  profile: OfficialPostalSourceProfile,
  options: Pick<AddressDataLoadPlanOptions, 'allowCredentialedSources' | 'preloadOfficialBulk'>,
): AddressDataLoadMode {
  if (
    profile.requiresCredential ||
    profile.availability === 'auth-required-api' ||
    profile.availability === 'licensed-bulk-data' ||
    profile.availability === 'commercial-or-restricted'
  ) {
    return options.allowCredentialedSources
      ? profile.availability === 'licensed-bulk-data' ? 'background' : 'on-demand'
      : 'disabled';
  }

  if (profile.availability === 'web-search') return 'disabled';
  if (profile.availability === 'bulk-open-data') return 'background';
  return 'on-demand';
}

function ttlForSource(source: Pick<AddressDataLoadSource, 'availability' | 'weight' | 'kind'>) {
  if (source.availability === 'local') return DEFAULT_CACHE_POLICY.persistentTtlMs;
  if (source.kind === 'open-address-reference') return 30 * 24 * 60 * 60 * 1000;
  if (source.weight === 'heavy') return 7 * 24 * 60 * 60 * 1000;
  return DEFAULT_CACHE_POLICY.persistentTtlMs;
}

function profileToSource(
  profile: OfficialPostalSourceProfile,
  options: Pick<AddressDataLoadPlanOptions, 'allowCredentialedSources' | 'preloadOfficialBulk'>,
  priority: number,
): AddressDataLoadSource {
  const mode = modeForProfile(profile, options);
  const kind = sourceKind(profile);
  const weight = sourceWeight(profile.availability);
  const source: AddressDataLoadSource = {
    id: profile.id,
    label: profile.label,
    kind,
    mode,
    trustTier: profile.trustTier,
    availability: profile.availability,
    depth: profile.depth,
    countryCodes: profile.countryCodes,
    priority,
    blocking: mode === 'blocking',
    networked: sourceNetworked(profile.availability),
    requiresCredential: profile.requiresCredential,
    weight,
    ttlMs: DEFAULT_CACHE_POLICY.persistentTtlMs,
    staleWhileRevalidateMs: DEFAULT_CACHE_POLICY.staleWhileRevalidateMs,
    url: profile.url,
    reason: profile.notes[0] || `${profile.label} is available as ${profile.availability}.`,
  };
  return { ...source, ttlMs: ttlForSource(source) };
}

function localFormatSource(priority: number, countryCode: string | null): AddressDataLoadSource {
  return {
    id: 'local-address-format-rules',
    label: 'Local address format and postal pattern rules',
    kind: 'format-rules',
    mode: 'blocking',
    trustTier: 'local',
    availability: 'local',
    depth: 'format',
    countryCodes: countryCode ? [countryCode] : ['*'],
    priority,
    blocking: true,
    networked: false,
    requiresCredential: false,
    weight: 'light',
    ttlMs: DEFAULT_CACHE_POLICY.persistentTtlMs,
    staleWhileRevalidateMs: DEFAULT_CACHE_POLICY.staleWhileRevalidateMs,
    reason: 'Format validation is local, cheap, and required before any networked lookup can be trusted.',
  };
}

function collectFormatSourceIds(format: AddressDataLoadFormatLike | null | undefined) {
  return unique([
    format?.postalCode?.source,
    format?.postalCode?.api,
    ...(format?.openSourceIds || []),
    ...(format?.addressRules?.openSourceIds || []),
  ]);
}

function formatSourceToLoadSource(
  rawSource: string,
  countryCode: string | null,
  priority: number,
): AddressDataLoadSource {
  const trust = classifyPostalSourceTrust({
    countryCode: countryCode || undefined,
    source: rawSource,
    sourceIds: [rawSource],
    url: /^https?:\/\//i.test(rawSource) ? rawSource : undefined,
  });
  const id = normalizeSourceId(rawSource) || `format-source-${priority}`;
  const strong = trust.strength === 'strong';
  const source: AddressDataLoadSource = {
    id,
    label: rawSource,
    kind: strong ? 'official-postal-api' : 'community-postal-api',
    mode: 'on-demand',
    trustTier: trust.tier,
    availability: /^https?:\/\//i.test(rawSource) ? 'public-api' : 'unknown',
    depth: 'postcode',
    countryCodes: countryCode ? [countryCode] : ['*'],
    priority,
    blocking: false,
    networked: /^https?:\/\//i.test(rawSource),
    requiresCredential: false,
    weight: 'light',
    ttlMs: DEFAULT_CACHE_POLICY.persistentTtlMs,
    staleWhileRevalidateMs: DEFAULT_CACHE_POLICY.staleWhileRevalidateMs,
    url: /^https?:\/\//i.test(rawSource) ? rawSource : undefined,
    reason: trust.reason,
  };
  return source;
}

function addSource(
  buckets: Record<AddressDataLoadMode, AddressDataLoadSource[]>,
  seen: Set<string>,
  source: AddressDataLoadSource,
) {
  const key = normalizeSourceId(source.id);
  if (seen.has(key)) return;
  seen.add(key);
  buckets[source.mode].push(source);
}

function sorted(sources: AddressDataLoadSource[]) {
  return [...sources].sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
}

export function buildAddressDataLoadPlan(options: AddressDataLoadPlanOptions = {}): AddressDataLoadPlan {
  const countryCode = normalizeCountryCode(
    options.countryCode || options.policy?.countryCode || options.format?.countryCode,
  ) || null;
  const targetCountries = unique((options.targetCountries || []).map(normalizeCountryCode));
  const targetAllowed = Boolean(countryCode) && (!targetCountries.length || targetCountries.includes(countryCode));
  const postalMode = options.postalMode || options.policy?.postalMode || 'manual';
  const hasPostalCode = Boolean(options.hasPostalCode);
  const lookupRequired = Boolean(options.lookupRequired);
  const includeGlobalFallbacks = options.includeGlobalFallbacks !== false;
  const buckets: Record<AddressDataLoadMode, AddressDataLoadSource[]> = {
    blocking: [],
    background: [],
    'on-demand': [],
    disabled: [],
  };
  const seen = new Set<string>();
  let priority = 1;

  addSource(buckets, seen, localFormatSource(priority++, countryCode));

  const catalogSources = countryCode
    ? getOfficialPostalSourcesForCountry(countryCode)
      .filter(source => includeGlobalFallbacks || !source.countryCodes.includes('*'))
      .filter(isPostalReferenceDataSource)
    : [];
  for (const source of catalogSources) {
    addSource(buckets, seen, profileToSource(source, options, priority++));
  }

  for (const sourceId of [
    ...(options.policy?.lookupSources || []),
    ...collectFormatSourceIds(options.format),
  ]) {
    addSource(buckets, seen, formatSourceToLoadSource(sourceId, countryCode, priority++));
  }

  const usableLookupSources = [
    ...buckets['on-demand'],
    ...buckets.background,
  ].filter(source => source.trustTier !== 'weak' && source.trustTier !== 'community');
  const credentiallessStrongSources = usableLookupSources.filter(source => (
    source.trustTier === 'local' ||
    (source.trustTier !== 'open-reference' && isStrongPostalTrustTier(source.trustTier))
  ));
  const onlyHeavyStrongSources = credentiallessStrongSources.length > 0 &&
    credentiallessStrongSources.every(source => source.weight === 'heavy');
  const disabledSources = buckets.disabled;

  const warnings = unique([
    countryCode ? null : 'Country code is required before country-specific source loading can be planned.',
    targetAllowed ? null : `Country ${countryCode || '(unknown)'} is outside the selected target countries.`,
    postalMode === 'geo-only' || postalMode === 'none'
      ? 'This target is geo or non-postal; do not force a postal dataset before coordinate/open-geodata verification.'
      : null,
    lookupRequired && !credentiallessStrongSources.length
      ? 'No credential-free strong postal lookup source is currently available in the load plan.'
      : null,
    lookupRequired && onlyHeavyStrongSources
      ? 'Strong lookup depends on heavy bulk data; keep request-time verification partial until the background index is ready.'
      : null,
    disabledSources.length
      ? `${disabledSources.length} credentialed or restricted source(s) were kept disabled.`
      : null,
  ]);

  const nextActions = unique([
    countryCode ? null : 'resolve-country-before-loading',
    targetAllowed ? null : 'select-enabled-target-country',
    lookupRequired && !credentiallessStrongSources.length ? 'configure-credentialless-official-source' : null,
    lookupRequired ? 'run-on-demand-postal-lookup-or-address-reference' : null,
    buckets.background.length ? 'schedule-background-address-data-refresh' : null,
    disabledSources.length ? 'review-disabled-source-policy' : null,
  ]);

  return {
    planVersion: ADDRESS_DATA_LOAD_PLAN_VERSION,
    countryCode,
    targetCountries,
    targetAllowed,
    lookupRequired,
    hasPostalCode,
    cachePolicy: { ...DEFAULT_CACHE_POLICY },
    blocking: sorted(buckets.blocking).slice(0, options.maxBlockingSources || Number.POSITIVE_INFINITY),
    background: sorted(buckets.background),
    onDemand: sorted(buckets['on-demand']),
    disabled: sorted(buckets.disabled),
    warnings,
    nextActions,
  };
}

export function summarizeAddressDataLoadPlan(plan: AddressDataLoadPlan) {
  return {
    planVersion: plan.planVersion,
    countryCode: plan.countryCode,
    lookupRequired: plan.lookupRequired,
    blocking: plan.blocking.map(source => source.id),
    background: plan.background.map(source => source.id),
    onDemand: plan.onDemand.map(source => source.id),
    disabled: plan.disabled.map(source => source.id),
    warnings: plan.warnings,
    nextActions: plan.nextActions,
  };
}
