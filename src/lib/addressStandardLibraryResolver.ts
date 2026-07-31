import {
  buildAddressDataLoadPlan,
  type AddressDataLoadMode,
  type AddressDataLoadPlan,
  type AddressDataLoadPlanOptions,
  type AddressDataLoadSource,
  type AddressDataServiceKind,
} from './addressDataLoadPlan';
import {
  buildOpenSourceAddressResolutionPipeline,
  type OpenSourceAddressResolutionStep,
  type OpenSourceAddressResolutionStepKind,
} from './openSourceAddressResolutionStrategy';
import type {
  PostalSourceAvailability,
  PostalSourceDepth,
  PostalSourceTrustTier,
} from './officialPostalSourceCatalog';

export const ADDRESS_STANDARD_LIBRARY_RESOLUTION_VERSION = 'address-standard-library-resolution-v1';

export type AddressStandardLibraryStage =
  | 'parse'
  | 'normalize'
  | 'format'
  | 'postal'
  | 'reference'
  | 'geodata'
  | 'translation'
  | 'transliteration'
  | 'validation';

export type AddressStandardLibraryMode = AddressDataLoadMode;

export type AddressStandardLibraryEntry = {
  id: string;
  label: string;
  stage: AddressStandardLibraryStage;
  mode: AddressStandardLibraryMode;
  priority: number;
  networked: boolean;
  openSourceOrFree: boolean;
  requiresCredential: boolean;
  trustTier?: PostalSourceTrustTier | 'local' | 'standard-library';
  availability?: PostalSourceAvailability | 'local' | 'optional-service';
  depth?: PostalSourceDepth | 'format' | 'parse' | 'translation';
  source: 'standard-library' | 'data-load-plan' | 'open-source-pipeline';
  reason: string;
};

export type AddressStandardLibraryResolutionInput = Pick<
  AddressDataLoadPlanOptions,
  | 'countryCode'
  | 'targetCountries'
  | 'format'
  | 'policy'
  | 'postalMode'
  | 'lookupRequired'
  | 'allowCredentialedSources'
  | 'includeGlobalFallbacks'
  | 'preloadOfficialBulk'
  | 'maxBlockingSources'
> & {
  hasPostcode?: boolean;
  hasCoordinates?: boolean;
  addressText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  hasCustomTranslator?: boolean;
  needsNaturalGeographyContext?: boolean;
  sparseOrRemoteArea?: boolean;
  libpostalEndpointConfigured?: boolean;
};

export type AddressStandardLibraryResolution = {
  modelVersion: string;
  countryCode: string | null;
  targetCountries: string[];
  freeOnly: boolean;
  canParseLocally: boolean;
  canResolveOffline: boolean;
  requiresNetworkForStrongVerification: boolean;
  requestedCapabilities: AddressStandardLibraryStage[];
  primary: AddressStandardLibraryEntry[];
  fallback: AddressStandardLibraryEntry[];
  background: AddressStandardLibraryEntry[];
  disabled: AddressStandardLibraryEntry[];
  warnings: string[];
  nextActions: string[];
  dataLoadPlan: Pick<
    AddressDataLoadPlan,
    'planVersion' | 'lookupRequired' | 'hasPostalCode' | 'cachePolicy'
  >;
};

function clean(value: unknown) {
  return String(value ?? '').normalize('NFKC').replace(/[\u3000\s]+/g, ' ').trim();
}

function normalizeCountryCode(value: unknown) {
  const normalized = clean(value).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  return normalized === 'UK' ? 'GB' : normalized;
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function uniqueEntries(entries: AddressStandardLibraryEntry[]) {
  const seen = new Set<string>();
  const result: AddressStandardLibraryEntry[] = [];
  for (const entry of entries.sort((a, b) => a.priority - b.priority)) {
    const key = `${entry.mode}:${entry.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result;
}

function stageForDataSourceKind(kind: AddressDataServiceKind): AddressStandardLibraryStage {
  switch (kind) {
    case 'format-rules':
      return 'format';
    case 'official-postal-api':
    case 'official-postal-bulk':
    case 'community-postal-api':
    case 'licensed-postal':
      return 'postal';
    case 'open-address-reference':
      return 'reference';
    case 'geocoder':
      return 'geodata';
    case 'manual-review':
      return 'validation';
  }
}

function stageForPipelineKind(kind: OpenSourceAddressResolutionStepKind): AddressStandardLibraryStage {
  switch (kind) {
    case 'postal-api':
    case 'postal-dataset':
      return 'postal';
    case 'geodata':
    case 'space-agency-geodata':
      return 'geodata';
    case 'machine-translation':
      return 'translation';
    case 'transliteration':
      return 'transliteration';
    case 'format-rules':
      return 'format';
    case 'dictionary-fallback':
      return 'validation';
  }
}

function modeForPipelineStep(step: OpenSourceAddressResolutionStep): AddressStandardLibraryMode {
  if (step.kind === 'dictionary-fallback') return 'disabled';
  if (step.networked) return 'on-demand';
  return 'blocking';
}

function dataSourceToEntry(source: AddressDataLoadSource, index: number): AddressStandardLibraryEntry {
  return {
    id: source.id,
    label: source.label,
    stage: stageForDataSourceKind(source.kind),
    mode: source.mode,
    priority: 100 + index + source.priority,
    networked: source.networked,
    openSourceOrFree: source.kind !== 'licensed-postal'
      && source.availability !== 'commercial-or-restricted'
      && source.availability !== 'licensed-bulk-data',
    requiresCredential: source.requiresCredential,
    trustTier: source.trustTier,
    availability: source.availability,
    depth: source.depth,
    source: 'data-load-plan',
    reason: source.reason,
  };
}

function pipelineStepToEntry(step: OpenSourceAddressResolutionStep, index: number): AddressStandardLibraryEntry {
  const mode = modeForPipelineStep(step);
  return {
    id: step.id,
    label: step.label,
    stage: stageForPipelineKind(step.kind),
    mode,
    priority: 300 + index + step.priority,
    networked: step.networked,
    openSourceOrFree: step.openSourceOrFree,
    requiresCredential: false,
    trustTier: step.openSourceOrFree ? 'community' : 'weak',
    availability: step.networked ? 'public-api' : 'local',
    depth: step.kind === 'machine-translation' || step.kind === 'transliteration'
      ? 'translation'
      : step.kind === 'format-rules'
        ? 'format'
        : undefined,
    source: 'open-source-pipeline',
    reason: step.dictionaryDependent
      ? 'Dictionary fallback is intentionally not a strong verification source.'
      : 'Open-source resolution strategy selected this step for the requested address context.',
  };
}

function localParserEntry(): AddressStandardLibraryEntry {
  return {
    id: 'local-address-parser',
    label: 'Built-in canonical address parser',
    stage: 'parse',
    mode: 'blocking',
    priority: 1,
    networked: false,
    openSourceOrFree: true,
    requiresCredential: false,
    trustTier: 'standard-library',
    availability: 'local',
    depth: 'parse',
    source: 'standard-library',
    reason: 'Always run local parsing first so address text can be normalized without network access.',
  };
}

function localNormalizerEntry(): AddressStandardLibraryEntry {
  return {
    id: 'local-unicode-address-normalizer',
    label: 'Built-in Unicode, whitespace, and country-code normalizer',
    stage: 'normalize',
    mode: 'blocking',
    priority: 2,
    networked: false,
    openSourceOrFree: true,
    requiresCredential: false,
    trustTier: 'standard-library',
    availability: 'local',
    depth: 'parse',
    source: 'standard-library',
    reason: 'NFKC and country-code normalization are deterministic and safe to apply before all lookups.',
  };
}

function libpostalEntry(configured: boolean): AddressStandardLibraryEntry {
  return {
    id: 'libpostal-compatible-parser',
    label: 'Optional libpostal-compatible parser service',
    stage: 'parse',
    mode: configured ? 'on-demand' : 'disabled',
    priority: configured ? 40 : 900,
    networked: configured,
    openSourceOrFree: true,
    requiresCredential: false,
    trustTier: 'community',
    availability: 'optional-service',
    depth: 'parse',
    source: 'standard-library',
    reason: configured
      ? 'A configured local libpostal sidecar can improve multilingual free-form parsing.'
      : 'No local libpostal sidecar is configured; the built-in parser remains the default.',
  };
}

function requestedCapabilities(input: AddressStandardLibraryResolutionInput): AddressStandardLibraryStage[] {
  const stages: AddressStandardLibraryStage[] = ['parse', 'normalize', 'format'];
  if (input.hasPostcode || input.lookupRequired) stages.push('postal');
  if (input.hasCoordinates || input.needsNaturalGeographyContext || input.sparseOrRemoteArea) stages.push('geodata');
  if (input.sourceLanguage || input.targetLanguage) stages.push('translation', 'transliteration');
  if (input.addressText) stages.push('validation');
  return Array.from(new Set(stages));
}

function warningMessages(input: AddressStandardLibraryResolutionInput, dataLoad: AddressDataLoadPlan) {
  return unique([
    ...dataLoad.warnings,
    normalizeCountryCode(input.countryCode) ? null : 'Country code was not supplied; standard-library resolution will stay generic.',
    input.libpostalEndpointConfigured ? null : 'Optional local libpostal sidecar is not configured.',
    dataLoad.lookupRequired && !dataLoad.onDemand.length && !dataLoad.background.length
      ? 'Strong postal verification needs an official/open lookup source for this country.'
      : null,
    'Local parsing and format checks do not by themselves prove delivery-point existence.',
  ]);
}

function nextActions(input: AddressStandardLibraryResolutionInput, dataLoad: AddressDataLoadPlan) {
  return unique([
    ...dataLoad.nextActions,
    input.libpostalEndpointConfigured ? null : 'Configure AGID_LIBPOSTAL_LOCAL_URL and AGID_LIBPOSTAL_LOCAL_ENABLED only when multilingual free-text parsing needs higher recall.',
    dataLoad.lookupRequired ? 'Attach official postal evidence, OpenAddresses records, or geodata evidence before claiming strong verification.' : null,
    input.needsNaturalGeographyContext || input.sparseOrRemoteArea
      ? 'Prefer open geodata and Earth-observation context for sparse, desert, ice, wetland, island, mountain, and water-feature addresses.'
      : null,
  ]);
}

export function buildAddressStandardLibraryResolution(
  input: AddressStandardLibraryResolutionInput = {},
): AddressStandardLibraryResolution {
  const countryCode = normalizeCountryCode(input.countryCode) || null;
  const targetCountries = unique((input.targetCountries || []).map(normalizeCountryCode));
  const dataLoad = buildAddressDataLoadPlan({
    ...input,
    countryCode: countryCode || undefined,
    targetCountries,
    hasPostalCode: Boolean(input.hasPostcode),
  });
  const openSourcePipeline = buildOpenSourceAddressResolutionPipeline({
    countryCode: countryCode || undefined,
    hasPostcode: Boolean(input.hasPostcode),
    hasCoordinates: Boolean(input.hasCoordinates),
    sourceLanguage: input.sourceLanguage,
    targetLanguage: input.targetLanguage,
    hasCustomTranslator: input.hasCustomTranslator,
    needsNaturalGeographyContext: input.needsNaturalGeographyContext,
    sparseOrRemoteArea: input.sparseOrRemoteArea,
  });

  const blockingEntries = [
    localParserEntry(),
    localNormalizerEntry(),
    ...dataLoad.blocking.map(dataSourceToEntry),
    ...openSourcePipeline.map(pipelineStepToEntry).filter(entry => entry.mode === 'blocking'),
  ];
  const fallbackEntries = [
    libpostalEntry(Boolean(input.libpostalEndpointConfigured)),
    ...dataLoad.onDemand.map(dataSourceToEntry),
    ...openSourcePipeline.map(pipelineStepToEntry).filter(entry => entry.mode === 'on-demand'),
  ];
  const backgroundEntries = dataLoad.background.map(dataSourceToEntry);
  const disabledEntries = [
    ...dataLoad.disabled.map(dataSourceToEntry),
    ...openSourcePipeline.map(pipelineStepToEntry).filter(entry => entry.mode === 'disabled'),
    ...(input.libpostalEndpointConfigured ? [] : [libpostalEntry(false)]),
  ];

  const primary = uniqueEntries(blockingEntries);
  const fallback = uniqueEntries(fallbackEntries).filter(entry => entry.mode !== 'disabled');
  const background = uniqueEntries(backgroundEntries);
  const disabled = uniqueEntries(disabledEntries);
  const requiresNetworkForStrongVerification = [
    ...fallback,
    ...background,
  ].some(entry => entry.networked && (entry.stage === 'postal' || entry.stage === 'reference' || entry.stage === 'geodata'));
  const canResolveOffline = !requiresNetworkForStrongVerification && primary.some(entry => entry.stage === 'format');

  return {
    modelVersion: ADDRESS_STANDARD_LIBRARY_RESOLUTION_VERSION,
    countryCode,
    targetCountries,
    freeOnly: [...primary, ...fallback, ...background].every(entry => entry.openSourceOrFree && !entry.requiresCredential),
    canParseLocally: primary.some(entry => entry.id === 'local-address-parser'),
    canResolveOffline,
    requiresNetworkForStrongVerification,
    requestedCapabilities: requestedCapabilities(input),
    primary,
    fallback,
    background,
    disabled,
    warnings: warningMessages(input, dataLoad),
    nextActions: nextActions(input, dataLoad),
    dataLoadPlan: {
      planVersion: dataLoad.planVersion,
      lookupRequired: dataLoad.lookupRequired,
      hasPostalCode: dataLoad.hasPostalCode,
      cachePolicy: dataLoad.cachePolicy,
    },
  };
}
