import {
  classifyAddressCoveragePolicy,
  hasAddressPostalCodeMetadata,
  type AddressCoverageFormatLike,
} from './addressCoveragePolicy';
import {
  buildAddressDataLoadPlan,
  summarizeAddressDataLoadPlan,
  type AddressDataLoadPlan,
  type AddressDataLoadPlanOptions,
  type AddressDataPostalMode,
} from './addressDataLoadPlan';
import { isStrongPostalTrustTier } from './officialPostalSourceCatalog';

export const ADDRESS_SYSTEM_CONNECTION_VERSION = 'address-system-connection-v1';

export type AddressSystemConnectionPurpose =
  | 'display'
  | 'registration'
  | 'delivery'
  | 'verification'
  | 'audit';

export type AddressSystemConnectionMode =
  | 'postal-authoritative'
  | 'postal-format-bridge'
  | 'geo-official-reference'
  | 'agid-manual-bridge'
  | 'manual-review'
  | 'unsupported';

export type AddressSystemConnectionLayer =
  | 'legal-jurisdiction'
  | 'address-format'
  | 'source-loading'
  | 'postal-routing'
  | 'administrative-boundary'
  | 'agid-spatial-cell'
  | 'aoid-delivery-object'
  | 'lineage-history'
  | 'audit-trail';

export type AddressSystemConnectionStatus =
  | 'connected'
  | 'partial'
  | 'blocked'
  | 'not-needed';

export type AddressSystemConnectionTrust =
  | 'authoritative'
  | 'official'
  | 'open-reference'
  | 'local'
  | 'manual'
  | 'none';

export type AddressSystemConnectionStage = {
  layer: AddressSystemConnectionLayer;
  status: AddressSystemConnectionStatus;
  method: string;
  trust: AddressSystemConnectionTrust;
  evidence: string[];
  note: string;
};

export type AddressSystemConnectionInput = {
  countryCode?: string;
  targetCountries?: string[];
  format?: AddressCoverageFormatLike | null;
  postalMode?: AddressDataPostalMode;
  hasPostalCode?: boolean;
  hasCoordinates?: boolean;
  hasAgid?: boolean;
  hasAoid?: boolean;
  hasAddressReference?: boolean;
  hasLineageEvidence?: boolean;
  sources?: string[];
  purpose?: AddressSystemConnectionPurpose;
  dataLoad?: Pick<
    AddressDataLoadPlanOptions,
    'allowCredentialedSources' | 'includeGlobalFallbacks' | 'preloadOfficialBulk' | 'maxBlockingSources'
  >;
};

export type AddressSystemConnectionPlan = {
  planVersion: string;
  countryCode: string | null;
  purpose: AddressSystemConnectionPurpose;
  mode: AddressSystemConnectionMode;
  coveragePolicyId: string;
  score: number;
  canIssuePid: boolean;
  canBindAoid: boolean;
  requiresManualConfirmation: boolean;
  dataLoading: AddressDataLoadPlan;
  stages: AddressSystemConnectionStage[];
  warnings: string[];
  nextActions: string[];
};

const clean = (value: unknown) => String(value ?? '').normalize('NFKC').replace(/[\u3000\s]+/g, ' ').trim();

function normalizeCountryCode(value: unknown) {
  const normalized = clean(value).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  return normalized === 'UK' ? 'GB' : normalized;
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function sourceTexts(input: AddressSystemConnectionInput) {
  return unique([
    ...(input.sources || []),
    input.format?.postalCode?.source,
    input.format?.postalCode?.api,
    ...(input.format?.openSourceIds || []),
    ...(input.format?.addressRules?.openSourceIds || []),
  ]).map(value => value.toLowerCase());
}

function hasGeoOfficialSignal(input: AddressSystemConnectionInput) {
  const text = sourceTexts(input).join(' ');
  return /(official|government|national|cadastre|cadastral|survey|geoportal|geodata|openaddresses|overture|osm|nominatim|geoboundaries|natural-earth|landsd|csdi|onemap|one map)/i.test(text);
}

function hasCredentialFreeStrongPostalSource(plan: AddressDataLoadPlan) {
  return [...plan.onDemand, ...plan.background].some(source => (
    source.trustTier !== 'local' &&
    source.trustTier !== 'open-reference' &&
    isStrongPostalTrustTier(source.trustTier) &&
    !source.requiresCredential
  ));
}

function bestPostalTrust(plan: AddressDataLoadPlan): AddressSystemConnectionTrust {
  const sources = [...plan.onDemand, ...plan.background, ...plan.disabled];
  if (sources.some(source => source.trustTier === 'authoritative')) return 'authoritative';
  if (sources.some(source => source.trustTier === 'official' || source.trustTier === 'official-derived')) return 'official';
  if (sources.some(source => source.trustTier === 'open-reference')) return 'open-reference';
  return 'none';
}

function statusScore(status: AddressSystemConnectionStatus) {
  switch (status) {
    case 'connected': return 1;
    case 'partial': return 0.55;
    case 'not-needed': return 0.75;
    case 'blocked': return 0;
  }
}

function stage(
  layer: AddressSystemConnectionLayer,
  status: AddressSystemConnectionStatus,
  method: string,
  trust: AddressSystemConnectionTrust,
  evidence: string[],
  note: string,
): AddressSystemConnectionStage {
  return { layer, status, method, trust, evidence: unique(evidence), note };
}

function connectionMode(input: {
  countryCode: string | null;
  hasPostalMetadata: boolean;
  hasStrongPostalRoute: boolean;
  hasGeoRoute: boolean;
  hasSpatialAnchor: boolean;
}): AddressSystemConnectionMode {
  if (!input.countryCode) return 'unsupported';
  if (input.hasPostalMetadata && input.hasStrongPostalRoute) return 'postal-authoritative';
  if (input.hasPostalMetadata) return 'postal-format-bridge';
  if (input.hasGeoRoute && input.hasSpatialAnchor) return 'geo-official-reference';
  if (input.hasSpatialAnchor) return 'agid-manual-bridge';
  return 'manual-review';
}

export function buildAddressSystemConnectionPlan(
  input: AddressSystemConnectionInput = {},
): AddressSystemConnectionPlan {
  const countryCode = normalizeCountryCode(input.countryCode || input.format?.countryCode) || null;
  const purpose = input.purpose || 'verification';
  const hasPostalMetadata = hasAddressPostalCodeMetadata(input.format);
  const hasPostalCode = Boolean(input.hasPostalCode);
  const postalMode = input.postalMode || (hasPostalMetadata ? 'format-and-lookup' : 'geo-only');
  const lookupRequired = hasPostalMetadata && postalMode === 'format-and-lookup';
  const dataLoading = buildAddressDataLoadPlan({
    ...input.dataLoad,
    countryCode: countryCode || undefined,
    targetCountries: input.targetCountries,
    format: input.format,
    postalMode,
    lookupRequired,
    hasPostalCode,
  });
  const coveragePolicy = classifyAddressCoveragePolicy(input.format, { sources: input.sources });
  const hasStrongPostalRoute =
    coveragePolicy.id === 'postal-reliable-api' ||
    hasCredentialFreeStrongPostalSource(dataLoading);
  const hasSpatialAnchor = Boolean(input.hasAgid || input.hasCoordinates);
  const hasGeoRoute = coveragePolicy.id === 'no-postal-strong-geo' || hasGeoOfficialSignal(input);
  const mode = connectionMode({
    countryCode,
    hasPostalMetadata,
    hasStrongPostalRoute,
    hasGeoRoute,
    hasSpatialAnchor,
  });
  const postalTrust = bestPostalTrust(dataLoading);
  const aoidNeeded = purpose === 'delivery' || purpose === 'registration';

  const stages: AddressSystemConnectionStage[] = [
    stage(
      'legal-jurisdiction',
      countryCode ? 'connected' : 'blocked',
      'country-code-or-jurisdiction-selection',
      countryCode ? 'local' : 'none',
      countryCode ? [countryCode] : [],
      'Connect every address claim to a legal jurisdiction before applying country-specific rules.',
    ),
    stage(
      'address-format',
      input.format ? 'connected' : 'partial',
      'local-format-and-required-field-rules',
      'local',
      input.format ? [input.format.countryCode || countryCode || 'format'] : [],
      'Use local format rules as the first gate; never let AGID rewrite user-facing legal address text.',
    ),
    stage(
      'source-loading',
      dataLoading.warnings.length ? 'partial' : 'connected',
      'lazy-load-official-and-open-reference-sources',
      dataLoading.onDemand.length || dataLoading.background.length ? postalTrust : 'local',
      [
        ...summarizeAddressDataLoadPlan(dataLoading).onDemand,
        ...summarizeAddressDataLoadPlan(dataLoading).background,
      ],
      'Load source evidence by policy: format rules block, official APIs run on demand, bulk data refreshes in background.',
    ),
    stage(
      'postal-routing',
      hasPostalMetadata
        ? hasStrongPostalRoute && hasPostalCode ? 'connected' : 'partial'
        : 'not-needed',
      hasPostalMetadata ? 'postcode-format-plus-official-source-evidence' : 'non-postal-or-geo-first-target',
      hasPostalMetadata ? postalTrust : 'none',
      dataLoading.onDemand.concat(dataLoading.background).map(source => source.id),
      hasPostalMetadata
        ? 'Postal systems connect through postcode format, official source lookup, and address-reference agreement.'
        : 'Some jurisdictions do not use normal postal codes; connect through geospatial and administrative evidence instead.',
    ),
    stage(
      'administrative-boundary',
      hasGeoRoute || hasSpatialAnchor ? 'connected' : 'partial',
      'country-region-city-boundary-containment',
      hasGeoRoute ? 'official' : hasSpatialAnchor ? 'local' : 'none',
      input.sources || [],
      'Bind parsed administrative components to boundary/gazetteer evidence when postal evidence is weak or absent.',
    ),
    stage(
      'agid-spatial-cell',
      hasSpatialAnchor ? 'connected' : 'blocked',
      input.hasAgid ? 'existing-agid-binding' : 'coordinate-to-agid-encoding',
      hasSpatialAnchor ? 'local' : 'none',
      input.hasAgid ? ['agid'] : input.hasCoordinates ? ['coordinates'] : [],
      'AGID is the spatial anchor. It should support, not replace, the official address string.',
    ),
    stage(
      'aoid-delivery-object',
      input.hasAoid ? 'connected' : aoidNeeded ? 'partial' : 'not-needed',
      'aoid-object-binding-and-delivery-permission',
      input.hasAoid ? 'local' : 'none',
      input.hasAoid ? ['aoid'] : [],
      'AOID binds a delivery object or registered destination after the address/AGID claim is sufficiently connected.',
    ),
    stage(
      'lineage-history',
      input.hasLineageEvidence ? 'connected' : 'partial',
      'address-lineage-and-change-history',
      input.hasLineageEvidence ? 'official' : 'manual',
      input.hasLineageEvidence ? ['lineage'] : [],
      'Administrative renames, merges, splits, and old/new address transitions stay in a lineage graph.',
    ),
    stage(
      'audit-trail',
      'connected',
      'source-policy-and-decision-audit',
      'local',
      [ADDRESS_SYSTEM_CONNECTION_VERSION, dataLoading.planVersion],
      'Keep every connection decision auditable so unsupported claims remain unresolved rather than silently verified.',
    ),
  ];

  const score = Math.round(
    stages.reduce((sum, item) => sum + statusScore(item.status), 0) / stages.length * 100,
  ) / 100;
  const canIssuePid = Boolean(countryCode && hasSpatialAnchor && mode !== 'unsupported');
  const canBindAoid = canIssuePid && (input.hasAoid || !aoidNeeded);
  const requiresManualConfirmation =
    mode === 'manual-review' ||
    mode === 'agid-manual-bridge' ||
    stages.some(item => item.status === 'blocked' || (item.layer === 'postal-routing' && item.status === 'partial'));
  const warnings = unique([
    countryCode ? null : 'Country or jurisdiction must be resolved before connecting to an address system.',
    dataLoading.targetAllowed ? null : `Country ${countryCode || '(unknown)'} is outside the selected target countries.`,
    hasPostalMetadata && !hasPostalCode ? 'This address system uses postal codes, but no postal code was provided.' : null,
    hasPostalMetadata && !hasStrongPostalRoute ? 'Postal format exists, but no strong credential-free postal source is available.' : null,
    !hasPostalMetadata && !hasGeoRoute ? 'No normal postal code route or strong geospatial source was found.' : null,
    !hasSpatialAnchor ? 'AGID or coordinates are required before issuing a stable PID/AOID binding.' : null,
    aoidNeeded && !input.hasAoid ? 'AOID binding is needed for registration or delivery but is not present yet.' : null,
    ...dataLoading.warnings,
  ]);
  const nextActions = unique([
    countryCode ? null : 'resolve-jurisdiction',
    hasPostalMetadata && !hasPostalCode ? 'collect-postal-code' : null,
    hasPostalMetadata && !hasStrongPostalRoute ? 'configure-official-postal-source-or-address-reference' : null,
    !hasPostalMetadata && !hasGeoRoute ? 'add-official-geodata-or-open-address-reference' : null,
    !hasSpatialAnchor ? 'encode-coordinate-to-agid' : null,
    aoidNeeded && !input.hasAoid ? 'bind-or-issue-aoid' : null,
    input.hasLineageEvidence ? null : 'record-address-lineage-evidence-when-available',
    ...dataLoading.nextActions,
  ]);

  return {
    planVersion: ADDRESS_SYSTEM_CONNECTION_VERSION,
    countryCode,
    purpose,
    mode,
    coveragePolicyId: coveragePolicy.id,
    score,
    canIssuePid,
    canBindAoid,
    requiresManualConfirmation,
    dataLoading,
    stages,
    warnings,
    nextActions,
  };
}
