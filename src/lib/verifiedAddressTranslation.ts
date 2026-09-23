import { getAddressFormat,type AddressFormat } from '../data/address_formats';
import { AddressRenderer,createCanonicalAddress,type CanonicalAddress } from './addressRendering';
import { analyzeAddress,type CanonicalAddressParts } from './addressIntelligence';
import { validateAddressWithOpenSourceRules,type AddressValidationResult } from './addressValidation';
import { countryName } from './addressEnglish';
import { INTERNATIONAL_SHIPPING_ENGLISH_TAB,isEnglishAddressCountry } from './languageTabs';

export type VerifiedAddressTranslationFormat = AddressFormat;

export type VerifiedAddressTranslationStageId = 'parse' | 'normalize' | 'verify' | 'transform' | 'render';

export type VerifiedAddressTranslationStage = {
  id: VerifiedAddressTranslationStageId;
  label: string;
  status: 'ok' | 'partial';
  sources: string[];
};

export type VerifiedAddressTranslationPurpose =
  | 'international_shipping'
  | 'domestic_delivery'
  | 'ecommerce_form'
  | 'identity_verification'
  | 'map_search'
  | 'zk_address_proof';

export type VerifiedAddressTranslationOutputFormat =
  | 'shipping_label'
  | 'form_fields'
  | 'single_line'
  | 'canonical_json';

export type VerifiedAddressTranslationPostalCodeMatch =
  | 'valid'
  | 'invalid'
  | 'missing'
  | 'unverified'
  | 'not_applicable';

export type VerifiedAddressTranslationDeliveryRisk = 'low' | 'medium' | 'high';

export type VerifiedAddressMachineTranslationInterlingua = {
  agid: string;
  country: string;
  adminPath: string[];
  postalCode: string;
  geo: {
    lat: number | null;
    lon: number | null;
    plusCode: string;
  };
  deliveryZone: string;
  privacyLevel: 'country_only' | 'admin_area' | 'postal_area' | 'building_required' | 'unit_required';
};

export type VerifiedAddressMachineTranslationEvaluation = {
  postalMatchRate: number;
  geocodeMatchRate: number;
  adminMatchRate: number;
  formFillSuccess: number;
  carrierAcceptance: number;
  privacyPreservation: number;
  ambiguityDetected: boolean;
};

export type VerifiedAddressTranslationNormalized = {
  country: string;
  countryCode: string;
  postalCode: string;
  adminLevel1: string;
  adminLevel2: string;
  adminLevel3: string;
  locality: string;
  street: string;
  houseNumber: string;
  building: string;
  unit: string;
};

export type VerifiedAddressTranslationGraph = {
  country: {
    code: string;
    name: string;
  };
  postal: {
    code: string;
    valid: boolean | null;
  };
  admin: {
    level1: string;
    level2: string;
    level3: string;
  };
  locality: {
    primary: string;
    secondary: string;
  };
  deliveryObject: {
    building: string;
    poi: string;
    street: string;
    houseNumber: string;
  };
  geo: {
    lat: number | null;
    lon: number | null;
    plusCode: string;
    hasCoordinateOrCode: boolean;
    fieldCount: number;
  };
};

export type VerifiedAddressTranslationRenderings = {
  native: string;
  domesticEnglish?: string;
  internationalEnglish: string;
  shippingLabel: string;
};

export type VerifiedAddressTranslationInput = {
  countryCode?: string;
  language?: string;
  targetLanguage?: string;
  purpose?: VerifiedAddressTranslationPurpose;
  outputFormat?: VerifiedAddressTranslationOutputFormat;
  countryModel?: string;
  sourceCountry?: string;
  inputAddress?: string;
  inputLanguage?: string;
  address?: string;
  input_address?: string;
  input_language?: string;
  target_language?: string;
  output_format?: VerifiedAddressTranslationOutputFormat;
  country_model?: string;
  source_country?: string;
  details?: Record<string, unknown> | null;
  text?: string;
  format?: VerifiedAddressTranslationFormat | null;
  sources?: string[];
  referenceMatches?: Array<{
    source: string;
    confidence: number;
  }>;
};

export type VerifiedAddressTranslationSyncInput = Omit<VerifiedAddressTranslationInput, 'format'> & {
  format?: VerifiedAddressTranslationFormat | null;
};

export type VerifiedAddressTranslationResult = {
  canonical: CanonicalAddress;
  structured: VerifiedAddressTranslationNormalized;
  normalized: VerifiedAddressTranslationNormalized;
  graph: VerifiedAddressTranslationGraph;
  interlingua: VerifiedAddressMachineTranslationInterlingua;
  evaluation: VerifiedAddressMachineTranslationEvaluation;
  validation: AddressValidationResult;
  purpose: VerifiedAddressTranslationPurpose;
  outputFormat: VerifiedAddressTranslationOutputFormat;
  targetLanguage: string;
  renderings: VerifiedAddressTranslationRenderings;
  formatted: string[];
  formFields?: Record<string, string>;
  orders: {
    native: string[];
    internationalEnglish: string[];
  };
  confidence: number;
  unverifiedFields: string[];
  postalCodeMatch: VerifiedAddressTranslationPostalCodeMatch;
  deliveryRisk: VerifiedAddressTranslationDeliveryRisk;
  sources: string[];
  warnings: string[];
  pipeline: VerifiedAddressTranslationStage[];
};

function clean(value: unknown) {
  return String(value ?? '').normalize('NFKC').replace(/[\u3000\s]+/g, ' ').trim();
}

function cleanCode(value: unknown) {
  return clean(value).replace(/^country:/i, '').toUpperCase();
}

function numberOrNull(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstValue(...values: unknown[]) {
  for (const value of values) {
    const cleaned = clean(value);
    if (cleaned) return cleaned;
  }
  return '';
}

function normalizePurpose(value: unknown): VerifiedAddressTranslationPurpose {
  const purpose = clean(value).replace(/-/g, '_').toLowerCase();
  if (purpose === 'domestic_delivery') return 'domestic_delivery';
  if (purpose === 'ecommerce_form' || purpose === 'checkout') return 'ecommerce_form';
  if (purpose === 'identity_verification' || purpose === 'kyc') return 'identity_verification';
  if (purpose === 'map_search' || purpose === 'geocoding') return 'map_search';
  if (purpose === 'zk_address_proof' || purpose === 'zkp') return 'zk_address_proof';
  return 'international_shipping';
}

function normalizeOutputFormat(value: unknown): VerifiedAddressTranslationOutputFormat {
  const format = clean(value).replace(/-/g, '_').toLowerCase();
  if (format === 'form_fields') return 'form_fields';
  if (format === 'single_line') return 'single_line';
  if (format === 'canonical_json') return 'canonical_json';
  return 'shipping_label';
}

function nestedCoordinate(details: Record<string, unknown>, key: 'lat' | 'lon' | 'lng') {
  const coordinates = details.coordinates;
  if (!coordinates || typeof coordinates !== 'object') return undefined;
  return (coordinates as Record<string, unknown>)[key];
}

function readLatitude(details: Record<string, unknown>) {
  return numberOrNull(
    details.lat ??
    details.latitude ??
    nestedCoordinate(details, 'lat')
  );
}

function readLongitude(details: Record<string, unknown>) {
  return numberOrNull(
    details.lon ??
    details.lng ??
    details.longitude ??
    nestedCoordinate(details, 'lon') ??
    nestedCoordinate(details, 'lng')
  );
}

function mergeDetailsWithAnalysis(
  details: Record<string, unknown>,
  parsed: CanonicalAddressParts,
  countryCode: string,
) {
  return {
    ...details,
    ...Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => clean(value)),
    ),
    country_code: countryCode || parsed.country_code || details.country_code,
  };
}

function defaultNativeLanguage(format: VerifiedAddressTranslationFormat | null | undefined, fallback?: string) {
  const preferred = clean(fallback);
  if (preferred) return preferred;
  return format?.addressRules?.languages?.[0]?.code || 'local';
}

function renderNativeAddress(
  language: string,
  canonical: CanonicalAddress,
  validation: AddressValidationResult,
  format: VerifiedAddressTranslationFormat | null | undefined,
) {
  if (validation.displays.native) return validation.displays.native;
  const rendered = AddressRenderer.render(language, canonical, format);
  return rendered || AddressRenderer.renderPartialAddress(language, canonical);
}

function buildSources(
  inputSources: string[],
  format: VerifiedAddressTranslationFormat | null,
  validation: AddressValidationResult,
) {
  return Array.from(new Set([
    ...inputSources,
    ...(format?.openSourceIds || []),
    ...(format?.addressRules?.openSourceIds || []),
    ...validation.checkedWith,
  ].map(clean).filter(Boolean)));
}

function buildGraph(canonical: CanonicalAddress, validation: AddressValidationResult): VerifiedAddressTranslationGraph {
  const lat = numberOrNull((canonical as unknown as Record<string, unknown>).lat);
  const lon = numberOrNull((canonical as unknown as Record<string, unknown>).lon);
  const plusCode = clean(canonical.plus_code);
  const geoFieldCount = [
    canonical.state,
    canonical.city,
    canonical.district,
    canonical.subdistrict,
    canonical.suburb,
    canonical.road,
    canonical.building,
    canonical.poi,
    plusCode,
  ].filter(value => clean(value)).length;
  const code = cleanCode(canonical.country_code);

  return {
    country: {
      code,
      name: firstValue(canonical.country, countryName(code, code)),
    },
    postal: {
      code: clean(canonical.postcode),
      valid: validation.postalCodeValid,
    },
    admin: {
      level1: clean(canonical.state),
      level2: clean(canonical.city || canonical.district),
      level3: clean(canonical.district && canonical.city ? canonical.district : canonical.subdistrict),
    },
    locality: {
      primary: clean(canonical.subdistrict || canonical.suburb || canonical.road),
      secondary: clean(canonical.road && (canonical.subdistrict || canonical.suburb) ? canonical.road : ''),
    },
    deliveryObject: {
      building: clean(canonical.building),
      poi: clean(canonical.poi),
      street: clean(canonical.road),
      houseNumber: clean(canonical.house_number),
    },
    geo: {
      lat,
      lon,
      plusCode,
      hasCoordinateOrCode: Boolean((lat !== null && lon !== null) || plusCode),
      fieldCount: geoFieldCount,
    },
  };
}

function buildNormalized(canonical: CanonicalAddress) {
  const countryCode = cleanCode(canonical.country_code);
  return {
    country: firstValue(canonical.country, countryName(countryCode, countryCode)),
    countryCode,
    postalCode: clean(canonical.postcode),
    adminLevel1: clean(canonical.state),
    adminLevel2: clean(canonical.city || canonical.district),
    adminLevel3: clean(canonical.district && canonical.city ? canonical.district : canonical.subdistrict),
    locality: clean(canonical.subdistrict || canonical.suburb),
    street: clean(canonical.road),
    houseNumber: clean(canonical.house_number),
    building: clean(canonical.building),
    unit: '',
  };
}

function slug(value: unknown) {
  return clean(value)
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();
}

function buildInterlingua(
  canonical: CanonicalAddress,
  graph: VerifiedAddressTranslationGraph,
): VerifiedAddressMachineTranslationInterlingua {
  const country = cleanCode(canonical.country_code);
  const adminPath = [
    canonical.state,
    canonical.city || canonical.district,
    canonical.subdistrict || canonical.suburb,
  ].map(clean).filter(Boolean);
  const addressKey = [
    country,
    ...adminPath.map(slug),
    slug(canonical.road),
    slug(canonical.house_number),
  ].filter(Boolean).join('-');
  const hasUnit = Boolean(clean((canonical as unknown as Record<string, unknown>).unit));
  const privacyLevel = hasUnit
    ? 'unit_required'
    : clean(canonical.building || canonical.house_number)
      ? 'building_required'
      : clean(canonical.postcode)
        ? 'postal_area'
        : adminPath.length
          ? 'admin_area'
          : 'country_only';

  return {
    agid: addressKey ? `AGID-${addressKey}` : `AGID-${country || 'UNRESOLVED'}`,
    country,
    adminPath,
    postalCode: clean(canonical.postcode),
    geo: {
      lat: graph.geo.lat,
      lon: graph.geo.lon,
      plusCode: graph.geo.plusCode,
    },
    deliveryZone: [
      country,
      slug(canonical.state),
      slug(canonical.city || canonical.district),
      slug(canonical.postcode || canonical.subdistrict || canonical.suburb),
    ].filter(Boolean).join('-'),
    privacyLevel,
  };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

function buildEvaluation(
  validation: AddressValidationResult,
  graph: VerifiedAddressTranslationGraph,
  missingFields: string[],
): VerifiedAddressMachineTranslationEvaluation {
  const postalMatchRate = validation.postalCodeValid === true
    ? 1
    : validation.postalCodeValid === false
      ? 0
      : graph.postal.code
        ? 0.5
        : 0;
  const geocodeMatchRate = graph.geo.hasCoordinateOrCode ? 1 : Math.min(0.8, graph.geo.fieldCount / 8);
  const adminMatchRate = [graph.admin.level1, graph.admin.level2, graph.admin.level3].filter(Boolean).length / 3;
  const formFillSuccess = missingFields.length === 0 ? 1 : Math.max(0, 1 - missingFields.length * 0.18);
  const carrierAcceptance = validation.quality.label === 'Verified'
    ? 0.95
    : validation.quality.label === 'Geo Verified'
      ? 0.82
      : validation.status === 'partial'
        ? 0.6
        : 0.35;
  const privacyPreservation = 1;

  return {
    postalMatchRate: clampScore(postalMatchRate),
    geocodeMatchRate: clampScore(geocodeMatchRate),
    adminMatchRate: clampScore(adminMatchRate),
    formFillSuccess: clampScore(formFillSuccess),
    carrierAcceptance: clampScore(carrierAcceptance),
    privacyPreservation,
    ambiguityDetected: missingFields.length > 0 || validation.warnings.length > 0,
  };
}

function postalCodeMatch(validation: AddressValidationResult): VerifiedAddressTranslationPostalCodeMatch {
  if (validation.quality.mode === 'no-postal-code' || validation.postalCodeValid === null) return 'not_applicable';
  if (validation.postalCodeValid === true) return 'valid';
  if (validation.postalCodeValid === false) return 'invalid';
  return 'unverified';
}

function unverifiedFields(canonical: CanonicalAddress, validation: AddressValidationResult) {
  const missing = new Set(validation.missingRequiredFields);
  const critical: Array<[string, unknown]> = [
    ['country', canonical.country || canonical.country_code],
    ['adminLevel1', canonical.state],
    ['adminLevel2', canonical.city || canonical.district],
    ['streetOrLocality', canonical.road || canonical.subdistrict || canonical.suburb],
    ['deliveryObject', canonical.house_number || canonical.building || canonical.poi || canonical.plus_code],
  ];
  critical.forEach(([field, value]) => {
    if (!clean(value)) missing.add(field);
  });
  if (validation.postalCodeValid === false) missing.add('postalCode');
  return Array.from(missing);
}

function deliveryRisk(
  validation: AddressValidationResult,
  missingFields: string[],
): VerifiedAddressTranslationDeliveryRisk {
  if (validation.postalCodeValid === false || validation.quality.mode === 'manual-required') return 'high';
  if (missingFields.length >= 3) return 'high';
  if (validation.status === 'partial' || validation.quality.mode === 'partial-postal' || missingFields.length > 0) return 'medium';
  return 'low';
}

function lines(value: string) {
  return value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function buildFormFields(canonical: CanonicalAddress) {
  return {
    addressLine1: [canonical.house_number, canonical.road || canonical.subdistrict || canonical.suburb].map(clean).filter(Boolean).join(' '),
    addressLine2: clean(canonical.building),
    city: clean(canonical.city || canonical.district),
    stateProvince: clean(canonical.state),
    postalCode: clean(canonical.postcode),
    country: firstValue(canonical.country, countryName(cleanCode(canonical.country_code), cleanCode(canonical.country_code))),
  };
}

function buildFormattedOutput({
  outputFormat,
  purpose,
  renderings,
  canonical,
}: {
  outputFormat: VerifiedAddressTranslationOutputFormat;
  purpose: VerifiedAddressTranslationPurpose;
  renderings: VerifiedAddressTranslationRenderings;
  canonical: CanonicalAddress;
}) {
  if (outputFormat === 'single_line') {
    return [lines(renderings.internationalEnglish || renderings.shippingLabel).join(', ')];
  }
  if (outputFormat === 'form_fields') {
    return Object.values(buildFormFields(canonical)).filter(Boolean);
  }
  if (purpose === 'map_search') {
    return [lines(renderings.internationalEnglish).join(', ')];
  }
  if (purpose === 'domestic_delivery') {
    return lines(renderings.native);
  }
  if (purpose === 'identity_verification') {
    return lines(renderings.native || renderings.internationalEnglish);
  }
  if (purpose === 'zk_address_proof') {
    return [
      `country:${cleanCode(canonical.country_code)}`,
      canonical.postcode ? 'postal_code:present' : 'postal_code:not_disclosed',
      'raw_address:not_returned',
    ];
  }
  return lines(renderings.shippingLabel || renderings.internationalEnglish);
}

function stage(
  id: VerifiedAddressTranslationStageId,
  label: string,
  status: VerifiedAddressTranslationStage['status'],
  sources: string[],
): VerifiedAddressTranslationStage {
  return { id, label, status, sources: Array.from(new Set(sources.filter(Boolean))) };
}

function buildPipeline({
  analysisSources,
  validation,
  renderSources,
}: {
  analysisSources: string[];
  validation: AddressValidationResult;
  renderSources: string[];
}) {
  return [
    stage('parse', 'Address text and API fields were parsed into address components.', 'ok', analysisSources),
    stage('normalize', 'Components were normalized into one canonical address graph.', 'ok', ['canonical-address-graph']),
    stage('verify', 'Postal, open-source, and geography evidence were evaluated.', validation.status === 'verified' ? 'ok' : 'partial', validation.checkedWith),
    stage('transform', 'The verified graph was transformed through the AGID address interlingua.', validation.status === 'verified' ? 'ok' : 'partial', ['agid-address-interlingua']),
    stage('render', 'Country-specific native and international English displays were regenerated.', 'ok', renderSources),
  ];
}

export function executeVerifiedAddressTranslationSync(
  input: VerifiedAddressTranslationSyncInput,
): VerifiedAddressTranslationResult {
  const details = input.details && typeof input.details === 'object' ? input.details : {};
  const inputAddress = firstValue(input.inputAddress, input.input_address, input.address, input.text, details.display_name, details.name, details.formatted);
  const purpose = normalizePurpose(input.purpose);
  const outputFormat = normalizeOutputFormat(input.outputFormat || input.output_format);
  const targetLanguage = firstValue(input.targetLanguage, input.target_language, INTERNATIONAL_SHIPPING_ENGLISH_TAB);
  const inputLanguage = firstValue(input.inputLanguage, input.input_language, input.language);
  const analysis = analyzeAddress({
    apiAddress: details,
    displayName: inputAddress,
    sources: input.sources || [],
  });
  const code = cleanCode(input.countryModel || input.country_model || input.sourceCountry || input.source_country || input.countryCode || details.country_code || analysis.canonical.country_code);
  const format = input.format ?? null;
  const mergedDetails = mergeDetailsWithAnalysis(details, analysis.canonical, code);
  const canonical = createCanonicalAddress(mergedDetails);
  const canonicalWithGeo = canonical as CanonicalAddress & { lat?: number; lon?: number };
  const lat = readLatitude(details);
  const lon = readLongitude(details);

  if (code && !canonical.country_code) canonical.country_code = code;
  canonical.country_code = cleanCode(canonical.country_code || code);
  if (lat !== null) canonicalWithGeo.lat = lat;
  if (lon !== null) canonicalWithGeo.lon = lon;
  if (!canonical.country && canonical.country_code) {
    canonical.country = countryName(canonical.country_code, canonical.country_code);
  }

  const validation = validateAddressWithOpenSourceRules(
    canonical,
    format,
    input.sources || [],
    { referenceMatches: input.referenceMatches || [] },
  );
  const nativeLanguage = defaultNativeLanguage(format, inputLanguage);
  const native = renderNativeAddress(nativeLanguage, canonical, validation, format);
  const domesticEnglish = isEnglishAddressCountry(canonical.country_code)
    ? AddressRenderer.render('en_domestic', canonical, format)
    : undefined;
  const internationalEnglish = AddressRenderer.render(INTERNATIONAL_SHIPPING_ENGLISH_TAB, canonical, format)
    || validation.displays.english
    || AddressRenderer.renderPartialAddress(INTERNATIONAL_SHIPPING_ENGLISH_TAB, canonical);
  const shippingLabel = AddressRenderer.renderInternationalShippingEnglish(canonical);
  const sources = buildSources(input.sources || [], format, validation);
  const graph = buildGraph(canonical, validation);
  const normalized = buildNormalized(canonical);
  const renderings = {
    native,
    domesticEnglish,
    internationalEnglish,
    shippingLabel,
  };
  const missingFields = unverifiedFields(canonical, validation);
  const interlingua = buildInterlingua(canonical, graph);
  const confidence = Math.max(
    validation.score,
    analysis.confidence,
    Math.min(0.99, graph.geo.hasCoordinateOrCode ? validation.score + 0.05 : validation.score),
  );

  return {
    canonical,
    structured: normalized,
    normalized,
    graph,
    interlingua,
    evaluation: buildEvaluation(validation, graph, missingFields),
    validation,
    purpose,
    outputFormat,
    targetLanguage,
    renderings,
    formatted: buildFormattedOutput({
      outputFormat,
      purpose,
      renderings,
      canonical,
    }),
    formFields: outputFormat === 'form_fields' ? buildFormFields(canonical) : undefined,
    orders: {
      native: format?.addressRules?.nativeOrder || [],
      internationalEnglish: format?.addressRules?.englishOrder || [],
    },
    confidence: Math.round(confidence * 100) / 100,
    unverifiedFields: missingFields,
    postalCodeMatch: postalCodeMatch(validation),
    deliveryRisk: deliveryRisk(validation, missingFields),
    sources,
    warnings: validation.warnings,
    pipeline: buildPipeline({
      analysisSources: analysis.sources,
      validation,
      renderSources: ['country-address-rules', 'address-renderer', 'international-shipping-english'],
    }),
  };
}

export async function executeVerifiedAddressTranslation(
  input: VerifiedAddressTranslationInput,
): Promise<VerifiedAddressTranslationResult> {
  const details = input.details && typeof input.details === 'object' ? input.details : {};
  const analysis = analyzeAddress({
    apiAddress: details,
    displayName: firstValue(input.inputAddress, input.input_address, input.address, input.text, details.display_name, details.name, details.formatted),
    sources: input.sources || [],
  });
  const code = cleanCode(input.countryModel || input.country_model || input.sourceCountry || input.source_country || input.countryCode || details.country_code || analysis.canonical.country_code);
  const format = input.format !== undefined
    ? input.format
    : (code ? await getAddressFormat(code) : null);

  return executeVerifiedAddressTranslationSync({
    ...input,
    format,
  });
}
