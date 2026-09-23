import { assessAddressDisplayQuality } from './addressDisplay';

export const ADDRESS_MAP_QUALITY_LAYER_VERSION = 'agid-address-map-quality-layer-v1';

export const ADDRESS_MAP_QUALITY_SOURCES = [
  'geocoding',
  'places',
  'address-validation',
  'routes',
  'reverse-geocoding',
  'boundary',
  'postal',
  'agid',
  'map-feature',
  'search-federation',
] as const;

export const ADDRESS_MAP_QUALITY_ACTIONS = [
  'accept',
  'show-warning',
  'request-manual-review',
  'run-address-validation',
  'run-forward-geocoding',
  'run-reverse-geocoding',
  'run-route-check',
  'run-boundary-check',
  'confirm-delivery-point',
  'reverify-boundary',
  'ask-user-to-complete-address',
  'use-coarse-mode',
] as const;

export type AddressMapQualitySource = typeof ADDRESS_MAP_QUALITY_SOURCES[number];
export type AddressMapQualityAction = typeof ADDRESS_MAP_QUALITY_ACTIONS[number];
export type AddressMapQualityEvidenceStatus = 'verified' | 'partial' | 'failed' | 'not-run';
export type AddressMapQualityDecision = 'accept' | 'warn' | 'review' | 'reject';
export type AddressMapQualityStatus = 'verified' | 'good' | 'partial' | 'needs-review' | 'unavailable';
export type AddressMapQualityBoundaryRisk = 'inside' | 'near-boundary' | 'outside' | 'unknown';
export type AddressMapQualityDeliveryEligibility = 'eligible' | 'partial' | 'not-eligible' | 'unknown';
export type AddressMapQualityPrecision =
  | 'rooftop'
  | 'parcel'
  | 'entrance'
  | 'street'
  | 'locality'
  | 'region'
  | 'country'
  | 'natural-feature'
  | 'water'
  | 'unknown';

export type AddressMapQualityAddressInput = {
  countryCode?: string;
  city?: string;
  postcode?: string;
  agid?: string;
  displayText?: string;
  lat?: number;
  lng?: number;
};

export type AddressMapQualityEvidence = {
  source?: AddressMapQualitySource | string;
  status?: AddressMapQualityEvidenceStatus | string;
  provider?: string;
  confidence?: number;
  precision?: AddressMapQualityPrecision | string;
  matchedCountryCode?: string;
  matchedCity?: string;
  matchedPostcode?: string;
  deliverable?: boolean;
  reachable?: boolean;
  insideBoundary?: boolean;
  distanceToBoundaryMeters?: number;
  placeType?: string;
  reason?: string;
};

export type AddressMapQualityInput = {
  address?: AddressMapQualityAddressInput;
  evidence?: AddressMapQualityEvidence[];
  displayQualityScore?: number;
  highRiskMode?: boolean;
  deliveryRequired?: boolean;
  borderBufferMeters?: number;
};

export type AddressMapQualityLayerResult = {
  source: AddressMapQualitySource;
  state: AddressMapQualityEvidenceStatus;
  score: number;
  confidence: number;
  provider?: string;
  precision?: AddressMapQualityPrecision;
  reasons: string[];
};

export type AddressMapQualityAssessment = {
  version: typeof ADDRESS_MAP_QUALITY_LAYER_VERSION;
  status: AddressMapQualityStatus;
  decision: AddressMapQualityDecision;
  deliveryEligibility: AddressMapQualityDeliveryEligibility;
  boundaryRisk: AddressMapQualityBoundaryRisk;
  internalScore: number;
  scoreVisibleToUser: false;
  layers: {
    geocoding: AddressMapQualityLayerResult;
    places: AddressMapQualityLayerResult;
    addressValidation: AddressMapQualityLayerResult;
    routes: AddressMapQualityLayerResult;
    reverseGeocoding: AddressMapQualityLayerResult;
    boundary: AddressMapQualityLayerResult & {
      distanceToBoundaryMeters?: number;
      insideBoundary?: boolean;
    };
    display: {
      state: AddressMapQualityEvidenceStatus;
      score: number;
      isWeak: boolean;
      reasons: string[];
    };
  };
  actions: AddressMapQualityAction[];
  warnings: string[];
  reasons: string[];
  sources: AddressMapQualitySource[];
  privacy: {
    preciseCoordinatesExposed: false;
    rawAddressLogged: false;
    userScoreVisible: false;
    highRiskMode: boolean;
    recommendedPublicMode: 'decision-only' | 'coarse-decision-only';
  };
};

const SOURCE_ALIASES: Record<string, AddressMapQualitySource> = {
  geocode: 'geocoding',
  forward: 'geocoding',
  place: 'places',
  poi: 'places',
  validation: 'address-validation',
  addressvalidation: 'address-validation',
  route: 'routes',
  routing: 'routes',
  reverse: 'reverse-geocoding',
  reversegeocode: 'reverse-geocoding',
  reversegeocoding: 'reverse-geocoding',
  border: 'boundary',
  boundarycheck: 'boundary',
  postcode: 'postal',
  postalcode: 'postal',
  mapfeature: 'map-feature',
  search: 'search-federation',
};

const PRECISION_WEIGHTS: Record<AddressMapQualityPrecision, number> = {
  rooftop: 1,
  parcel: 0.96,
  entrance: 0.94,
  street: 0.78,
  locality: 0.56,
  region: 0.38,
  country: 0.24,
  'natural-feature': 0.48,
  water: 0.34,
  unknown: 0.42,
};

function clean(value: unknown) {
  return String(value ?? '').normalize('NFKC').replace(/[\u3000\s]+/g, ' ').trim();
}

function normalizeComparable(value: unknown) {
  return clean(value).toUpperCase().replace(/[^A-Z0-9]+/g, '');
}

function normalizeTextComparable(value: unknown) {
  return clean(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

function normalizeSource(value: unknown): AddressMapQualitySource | undefined {
  const raw = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if ((ADDRESS_MAP_QUALITY_SOURCES as readonly string[]).includes(raw)) return raw as AddressMapQualitySource;
  const compact = raw.replace(/-/g, '');
  return SOURCE_ALIASES[compact];
}

function normalizeState(value: unknown): AddressMapQualityEvidenceStatus {
  const raw = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (raw === 'ok' || raw === 'pass' || raw === 'passed' || raw === 'confirmed') return 'verified';
  if (raw === 'warning' || raw === 'review' || raw === 'candidate') return 'partial';
  if (raw === 'fail' || raw === 'rejected' || raw === 'invalid' || raw === 'unreachable') return 'failed';
  if (raw === 'verified' || raw === 'partial' || raw === 'failed' || raw === 'not-run') return raw;
  return 'not-run';
}

function normalizePrecision(value: unknown): AddressMapQualityPrecision {
  const raw = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (
    raw === 'rooftop'
    || raw === 'parcel'
    || raw === 'entrance'
    || raw === 'street'
    || raw === 'locality'
    || raw === 'region'
    || raw === 'country'
    || raw === 'natural-feature'
    || raw === 'water'
  ) return raw;
  if (raw === 'house' || raw === 'premise' || raw === 'building') return 'rooftop';
  if (raw === 'point-of-interest' || raw === 'poi') return 'entrance';
  return 'unknown';
}

function clamp01(value: unknown, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(1, number));
}

function stateBaseScore(state: AddressMapQualityEvidenceStatus) {
  if (state === 'verified') return 1;
  if (state === 'partial') return 0.55;
  if (state === 'failed') return 0;
  return 0.18;
}

function sourceWeight(source: AddressMapQualitySource) {
  if (source === 'address-validation') return 0.24;
  if (source === 'geocoding') return 0.17;
  if (source === 'routes') return 0.18;
  if (source === 'reverse-geocoding') return 0.13;
  if (source === 'boundary') return 0.12;
  if (source === 'places') return 0.08;
  if (source === 'postal') return 0.05;
  if (source === 'agid') return 0.05;
  return 0.04;
}

function bestEvidence(evidence: AddressMapQualityEvidence[], source: AddressMapQualitySource) {
  const candidates = evidence.filter(item => normalizeSource(item.source) === source);
  return candidates.sort((a, b) => evidenceScore(b, source).score - evidenceScore(a, source).score)[0];
}

function evidenceScore(evidence: AddressMapQualityEvidence | undefined, source: AddressMapQualitySource): AddressMapQualityLayerResult {
  if (!evidence) {
    return {
      source,
      state: 'not-run',
      score: stateBaseScore('not-run') * sourceWeight(source),
      confidence: 0,
      reasons: [`${source}:not-run`],
    };
  }

  const state = normalizeState(evidence.status);
  const confidence = clamp01(evidence.confidence, state === 'verified' ? 0.9 : state === 'partial' ? 0.55 : 0);
  const precision = normalizePrecision(evidence.precision);
  const precisionBoost = source === 'geocoding' || source === 'reverse-geocoding'
    ? PRECISION_WEIGHTS[precision]
    : 1;
  const reachableBoost = source === 'routes' && evidence.reachable === false ? 0 : 1;
  const deliverableBoost = source === 'address-validation' && evidence.deliverable === false ? 0.35 : 1;
  const score = sourceWeight(source)
    * stateBaseScore(state)
    * (0.55 + confidence * 0.45)
    * (0.72 + precisionBoost * 0.28)
    * reachableBoost
    * deliverableBoost;

  return {
    source,
    state,
    score,
    confidence,
    ...(evidence.provider ? { provider: clean(evidence.provider) } : {}),
    ...(precision ? { precision } : {}),
    reasons: [
      `${source}:${state}`,
      evidence.reason ? `${source}:${clean(evidence.reason)}` : undefined,
      evidence.deliverable === true ? `${source}:deliverable` : undefined,
      evidence.deliverable === false ? `${source}:not-deliverable` : undefined,
      evidence.reachable === true ? `${source}:reachable` : undefined,
      evidence.reachable === false ? `${source}:unreachable` : undefined,
      precision !== 'unknown' ? `${source}:precision:${precision}` : undefined,
    ].filter((reason): reason is string => Boolean(reason)),
  };
}

function boundaryLayer(evidence: AddressMapQualityEvidence | undefined, borderBufferMeters: number) {
  const base = evidenceScore(evidence, 'boundary') as AddressMapQualityAssessment['layers']['boundary'];
  const insideBoundary = evidence?.insideBoundary;
  const distance = typeof evidence?.distanceToBoundaryMeters === 'number' && Number.isFinite(evidence.distanceToBoundaryMeters)
    ? Math.max(0, evidence.distanceToBoundaryMeters)
    : undefined;
  const boundaryRisk: AddressMapQualityBoundaryRisk =
    insideBoundary === false
      ? 'outside'
      : insideBoundary === true && distance !== undefined && distance <= borderBufferMeters
        ? 'near-boundary'
        : insideBoundary === true
          ? 'inside'
          : 'unknown';

  const adjustedScore =
    boundaryRisk === 'inside'
      ? Math.max(base.score, sourceWeight('boundary') * 0.9)
      : boundaryRisk === 'near-boundary'
        ? sourceWeight('boundary') * 0.45
        : boundaryRisk === 'outside'
          ? 0
          : base.score;

  return {
    layer: {
      ...base,
      state: boundaryRisk === 'outside' ? 'failed' as const : base.state,
      score: adjustedScore,
      ...(insideBoundary !== undefined ? { insideBoundary } : {}),
      ...(distance !== undefined ? { distanceToBoundaryMeters: distance } : {}),
      reasons: [...base.reasons, `boundary-risk:${boundaryRisk}`],
    },
    boundaryRisk,
  };
}

function displayLayer(input: AddressMapQualityInput) {
  const displayText = clean(input.address?.displayText);
  const explicitScore = typeof input.displayQualityScore === 'number' && Number.isFinite(input.displayQualityScore)
    ? clamp01(input.displayQualityScore)
    : undefined;
  const assessed = displayText
    ? assessAddressDisplayQuality(displayText, { countryCode: input.address?.countryCode })
    : undefined;
  const score = explicitScore ?? assessed?.score ?? 0.18;
  const isWeak = assessed?.isWeak ?? score < 0.35;
  const state: AddressMapQualityEvidenceStatus = score >= 0.75 ? 'verified' : score >= 0.4 ? 'partial' : 'failed';
  return {
    state,
    score: score * 0.08,
    isWeak,
    reasons: [
      `display:${state}`,
      isWeak ? 'display:weak' : 'display:usable',
    ],
  };
}

function sourceConflicts(address: AddressMapQualityAddressInput | undefined, evidence: AddressMapQualityEvidence[]) {
  const warnings: string[] = [];
  const addressCountry = normalizeComparable(address?.countryCode);
  const addressPostcode = normalizeComparable(address?.postcode);
  const addressCity = normalizeTextComparable(address?.city);

  const matchedCountries = new Set(evidence.map(item => normalizeComparable(item.matchedCountryCode)).filter(Boolean));
  const matchedPostcodes = new Set(evidence.map(item => normalizeComparable(item.matchedPostcode)).filter(Boolean));
  const matchedCities = new Set(evidence.map(item => normalizeTextComparable(item.matchedCity)).filter(Boolean));

  if (addressCountry && matchedCountries.size > 0 && !matchedCountries.has(addressCountry)) {
    warnings.push('map-quality-country-conflict');
  }
  if (matchedCountries.size > 1) warnings.push('map-quality-cross-source-country-conflict');
  if (addressPostcode && matchedPostcodes.size > 0 && !matchedPostcodes.has(addressPostcode)) {
    warnings.push('map-quality-postcode-conflict');
  }
  if (matchedPostcodes.size > 1) warnings.push('map-quality-cross-source-postcode-conflict');
  if (addressCity && matchedCities.size > 0 && !matchedCities.has(addressCity)) {
    warnings.push('map-quality-city-conflict');
  }
  return warnings;
}

function unique<T>(values: Array<T | undefined | false | null | ''>) {
  return Array.from(new Set(values.filter(Boolean))) as T[];
}

function determineDeliveryEligibility({
  validation,
  routes,
}: {
  validation: AddressMapQualityEvidence | undefined;
  routes: AddressMapQualityEvidence | undefined;
}): AddressMapQualityDeliveryEligibility {
  if (validation?.deliverable === false || routes?.reachable === false) return 'not-eligible';
  if (validation?.deliverable === true && routes?.reachable === true) return 'eligible';
  if (normalizeState(validation?.status) === 'partial' || normalizeState(routes?.status) === 'partial') return 'partial';
  return 'unknown';
}

function statusFromScore(score: number, hardWarnings: string[]): AddressMapQualityStatus {
  if (hardWarnings.length > 0) return 'needs-review';
  if (score >= 0.78) return 'verified';
  if (score >= 0.62) return 'good';
  if (score >= 0.36) return 'partial';
  if (score > 0.12) return 'needs-review';
  return 'unavailable';
}

function decisionFrom(status: AddressMapQualityStatus, boundaryRisk: AddressMapQualityBoundaryRisk, eligibility: AddressMapQualityDeliveryEligibility) {
  if (boundaryRisk === 'outside' || eligibility === 'not-eligible') return 'reject';
  if (status === 'verified') return 'accept';
  if (status === 'good' || status === 'partial') return 'warn';
  return 'review';
}

export function evaluateAddressMapQualityLayer(input: AddressMapQualityInput): AddressMapQualityAssessment {
  const evidence = input.evidence ?? [];
  const borderBufferMeters = typeof input.borderBufferMeters === 'number' && Number.isFinite(input.borderBufferMeters)
    ? Math.max(0, input.borderBufferMeters)
    : 100;
  const geocodingEvidence = bestEvidence(evidence, 'geocoding');
  const placesEvidence = bestEvidence(evidence, 'places');
  const validationEvidence = bestEvidence(evidence, 'address-validation');
  const routesEvidence = bestEvidence(evidence, 'routes');
  const reverseEvidence = bestEvidence(evidence, 'reverse-geocoding');
  const boundaryEvidence = bestEvidence(evidence, 'boundary');

  const geocoding = evidenceScore(geocodingEvidence, 'geocoding');
  const places = evidenceScore(placesEvidence, 'places');
  const addressValidation = evidenceScore(validationEvidence, 'address-validation');
  const routes = evidenceScore(routesEvidence, 'routes');
  const reverseGeocoding = evidenceScore(reverseEvidence, 'reverse-geocoding');
  const { layer: boundary, boundaryRisk } = boundaryLayer(boundaryEvidence, borderBufferMeters);
  const display = displayLayer(input);
  const warnings = unique([
    ...sourceConflicts(input.address, evidence),
    boundaryRisk === 'near-boundary' ? 'map-quality-near-boundary' : undefined,
    boundaryRisk === 'outside' ? 'map-quality-outside-boundary' : undefined,
    validationEvidence?.deliverable === false ? 'map-quality-address-not-deliverable' : undefined,
    routesEvidence?.reachable === false ? 'map-quality-route-unreachable' : undefined,
    geocoding.state === 'not-run' ? 'map-quality-forward-geocoding-not-run' : undefined,
    reverseGeocoding.state === 'not-run' && input.address?.agid ? 'map-quality-reverse-geocoding-not-run' : undefined,
    addressValidation.state === 'not-run' ? 'map-quality-address-validation-not-run' : undefined,
    routes.state === 'not-run' && input.deliveryRequired ? 'map-quality-route-check-not-run' : undefined,
    display.isWeak ? 'map-quality-display-weak' : undefined,
  ]);

  const hardWarnings = warnings.filter(warning =>
    warning.includes('conflict')
    || warning === 'map-quality-outside-boundary'
    || warning === 'map-quality-address-not-deliverable'
    || warning === 'map-quality-route-unreachable'
  );
  const internalScore = Math.max(0, Math.min(1,
    geocoding.score
    + places.score
    + addressValidation.score
    + routes.score
    + reverseGeocoding.score
    + boundary.score
    + display.score
  ));
  const deliveryEligibility = determineDeliveryEligibility({
    validation: validationEvidence,
    routes: routesEvidence,
  });
  const status = statusFromScore(internalScore, hardWarnings);
  const decision = decisionFrom(status, boundaryRisk, deliveryEligibility);

  const actions = unique<AddressMapQualityAction>([
    decision === 'accept' ? 'accept' : undefined,
    decision === 'warn' ? 'show-warning' : undefined,
    decision === 'review' ? 'request-manual-review' : undefined,
    decision === 'reject' ? 'request-manual-review' : undefined,
    geocoding.state === 'not-run' ? 'run-forward-geocoding' : undefined,
    reverseGeocoding.state === 'not-run' && input.address?.agid ? 'run-reverse-geocoding' : undefined,
    addressValidation.state === 'not-run' ? 'run-address-validation' : undefined,
    routes.state === 'not-run' && input.deliveryRequired ? 'run-route-check' : undefined,
    boundary.state === 'not-run' ? 'run-boundary-check' : undefined,
    boundaryRisk === 'near-boundary' ? 'reverify-boundary' : undefined,
    display.isWeak ? 'ask-user-to-complete-address' : undefined,
    deliveryEligibility === 'partial' || deliveryEligibility === 'unknown' ? 'confirm-delivery-point' : undefined,
    input.highRiskMode ? 'use-coarse-mode' : undefined,
  ]);
  const sources = unique(evidence.map(item => normalizeSource(item.source)));
  const reasons = unique([
    ...geocoding.reasons,
    ...places.reasons,
    ...addressValidation.reasons,
    ...routes.reasons,
    ...reverseGeocoding.reasons,
    ...boundary.reasons,
    ...display.reasons,
  ]);

  return {
    version: ADDRESS_MAP_QUALITY_LAYER_VERSION,
    status,
    decision,
    deliveryEligibility,
    boundaryRisk,
    internalScore: Math.round(internalScore * 1000) / 1000,
    scoreVisibleToUser: false,
    layers: {
      geocoding,
      places,
      addressValidation,
      routes,
      reverseGeocoding,
      boundary,
      display,
    },
    actions,
    warnings,
    reasons,
    sources,
    privacy: {
      preciseCoordinatesExposed: false,
      rawAddressLogged: false,
      userScoreVisible: false,
      highRiskMode: Boolean(input.highRiskMode),
      recommendedPublicMode: input.highRiskMode ? 'coarse-decision-only' : 'decision-only',
    },
  };
}
