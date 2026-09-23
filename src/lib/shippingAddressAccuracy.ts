import { verifyAddressCandidate } from './addressVerificationEngine';

export const SHIPPING_ADDRESS_ACCURACY_MODEL_VERSION = 'agid-shipping-address-accuracy-v1';

export type ShippingAddressAccuracyStatus = 'verified' | 'partial' | 'needs-review';
export type ShippingAddressAccuracyCheckState = 'pass' | 'partial' | 'fail' | 'not-run';
export type ShippingAddressAccuracyDecision = 'accept' | 'review';
export type ShippingAddressAccuracySource =
  | 'postal-code-api'
  | 'country-address-validation'
  | 'agid-reverse-geocoding'
  | 'address-reference';

export type ShippingAddressAccuracySourceEvidence = boolean | {
  status?: 'verified' | 'partial' | 'failed' | 'not-run';
  source?: string;
  country?: string;
  city?: string;
  postcode?: string;
  confidence?: number;
};

export type ShippingAddressAccuracyEvidence = {
  postalCodeApi?: ShippingAddressAccuracySourceEvidence;
  countryAddressValidation?: ShippingAddressAccuracySourceEvidence;
  agidReverseGeocoding?: ShippingAddressAccuracySourceEvidence;
};

export type ShippingAddressAccuracyAddressLike = {
  referenceCommitment?: string;
  entityId?: string;
  agid?: string;
  aoidId?: string;
  country?: string;
  city?: string;
  postcode?: string;
  kind?: string;
};

export type ShippingAddressAccuracyPublicDecision = {
  modelVersion: typeof SHIPPING_ADDRESS_ACCURACY_MODEL_VERSION;
  status: ShippingAddressAccuracyStatus;
  decision: ShippingAddressAccuracyDecision;
  checks: {
    addressReference: ShippingAddressAccuracyCheckState;
    postalCodeApi: ShippingAddressAccuracyCheckState;
    countryAddressValidation: ShippingAddressAccuracyCheckState;
    agidReverseGeocoding: ShippingAddressAccuracyCheckState;
  };
  sources: ShippingAddressAccuracySource[];
  warnings: string[];
  scoreVisibleToUser: false;
};

export type ShippingAddressAccuracyEvaluation = ShippingAddressAccuracyPublicDecision & {
  internalScore: number;
  internalReasons: string[];
};

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCountry(value: unknown) {
  const cleaned = cleanText(value).toUpperCase().replace(/[^A-Z]/g, '');
  return cleaned === 'UK' ? 'GB' : cleaned;
}

function normalizePostcode(value: unknown) {
  return cleanText(value).toUpperCase().replace(/[\s-]+/g, '');
}

function normalizeCity(value: unknown) {
  return cleanText(value).normalize('NFKC').toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, '');
}

function unique<T>(values: Array<T | undefined | null | false | ''>) {
  return Array.from(new Set(values.filter(Boolean))) as T[];
}

function evidenceToState(evidence: ShippingAddressAccuracySourceEvidence | undefined): ShippingAddressAccuracyCheckState {
  if (evidence === true) return 'pass';
  if (evidence === false) return 'fail';
  if (!evidence || typeof evidence !== 'object') return 'not-run';
  if (evidence.status === 'verified') return 'pass';
  if (evidence.status === 'partial') return 'partial';
  if (evidence.status === 'failed') return 'fail';
  return 'not-run';
}

function scoreForState(state: ShippingAddressAccuracyCheckState, passWeight: number, partialWeight: number, failPenalty: number) {
  if (state === 'pass') return passWeight;
  if (state === 'partial') return partialWeight;
  if (state === 'fail') return failPenalty;
  return 0;
}

function hasAddressReference(address: ShippingAddressAccuracyAddressLike) {
  return Boolean(
    cleanText(address.referenceCommitment)
    || cleanText(address.entityId)
    || cleanText(address.agid)
    || cleanText(address.aoidId),
  );
}

function countryValidationEvidence(
  address: ShippingAddressAccuracyAddressLike,
  evidence: ShippingAddressAccuracyEvidence,
): ShippingAddressAccuracySourceEvidence | undefined {
  if (evidence.countryAddressValidation !== undefined) return evidence.countryAddressValidation;
  const country = normalizeCountry(address.country);
  if (!country) return undefined;

  const result = verifyAddressCandidate({
    countryCode: country,
    address: {
      country_code: country,
      country,
      city: cleanText(address.city),
      postcode: cleanText(address.postcode),
    },
    postalCode: cleanText(address.postcode),
    scope: 'address',
    sources: ['shipping-label-address-accuracy'],
    systemConnection: {
      hasAgid: Boolean(cleanText(address.agid)),
      hasAoid: Boolean(cleanText(address.aoidId)),
      purpose: 'delivery',
    },
  });
  if (result.status === 'verified') {
    return { status: 'verified', source: result.engineVersion, confidence: result.score };
  }
  if (result.status === 'partial') {
    return { status: 'partial', source: result.engineVersion, confidence: result.score };
  }
  return { status: 'failed', source: result.engineVersion, confidence: result.score };
}

function evidenceObject(evidence: ShippingAddressAccuracySourceEvidence | undefined) {
  return evidence && typeof evidence === 'object' ? evidence : {};
}

function valuesConflict(left: string, right: string) {
  return Boolean(left && right && left !== right);
}

function collectSourceConflicts(
  address: ShippingAddressAccuracyAddressLike,
  evidence: ShippingAddressAccuracyEvidence,
) {
  const warnings: string[] = [];
  const addressCountry = normalizeCountry(address.country);
  const addressPostcode = normalizePostcode(address.postcode);
  const addressCity = normalizeCity(address.city);
  const postal = evidenceObject(evidence.postalCodeApi);
  const reverse = evidenceObject(evidence.agidReverseGeocoding);

  const postalCountry = normalizeCountry(postal.country);
  const reverseCountry = normalizeCountry(reverse.country);
  const postalPostcode = normalizePostcode(postal.postcode);
  const reversePostcode = normalizePostcode(reverse.postcode);
  const postalCity = normalizeCity(postal.city);
  const reverseCity = normalizeCity(reverse.city);

  if (valuesConflict(addressCountry, postalCountry) || valuesConflict(addressCountry, reverseCountry) || valuesConflict(postalCountry, reverseCountry)) {
    warnings.push('shipping-address-accuracy-country-conflict');
  }
  if (valuesConflict(addressPostcode, postalPostcode) || valuesConflict(addressPostcode, reversePostcode) || valuesConflict(postalPostcode, reversePostcode)) {
    warnings.push('shipping-address-accuracy-postcode-conflict');
  }
  if (valuesConflict(addressCity, postalCity) || valuesConflict(addressCity, reverseCity) || valuesConflict(postalCity, reverseCity)) {
    warnings.push('shipping-address-accuracy-city-conflict');
  }
  return warnings;
}

export function evaluateShippingAddressAccuracy(
  address: ShippingAddressAccuracyAddressLike,
  evidence: ShippingAddressAccuracyEvidence = {},
): ShippingAddressAccuracyEvaluation {
  const addressReference = hasAddressReference(address) ? 'pass' : 'fail';
  const countryEvidence = countryValidationEvidence(address, evidence);
  const postalCodeApi = evidenceToState(evidence.postalCodeApi);
  const countryAddressValidation = evidenceToState(countryEvidence);
  const agidReverseGeocoding = evidenceToState(evidence.agidReverseGeocoding);
  const hasCountry = Boolean(normalizeCountry(address.country));
  const hasCity = Boolean(cleanText(address.city));
  const hasPostcode = Boolean(cleanText(address.postcode));
  const hasAgid = Boolean(cleanText(address.agid));
  const conflictWarnings = collectSourceConflicts(address, evidence);
  const warnings = unique<string>([
    ...conflictWarnings,
    addressReference === 'fail' ? 'shipping-address-accuracy-reference-missing' : undefined,
    hasPostcode && postalCodeApi === 'not-run' ? 'shipping-address-accuracy-postal-api-not-run' : undefined,
    hasAgid && agidReverseGeocoding === 'not-run' ? 'shipping-address-accuracy-reverse-geocoding-not-run' : undefined,
    countryAddressValidation === 'fail' ? 'shipping-address-accuracy-country-validation-failed' : undefined,
    postalCodeApi === 'fail' ? 'shipping-address-accuracy-postal-api-failed' : undefined,
    agidReverseGeocoding === 'fail' ? 'shipping-address-accuracy-reverse-geocoding-failed' : undefined,
  ]);

  const internalScore = Math.max(0, Math.min(1,
    scoreForState(addressReference, 0.15, 0.08, -0.25)
    + scoreForState(countryAddressValidation, 0.28, 0.16, -0.3)
    + scoreForState(postalCodeApi, 0.24, 0.12, -0.25)
    + scoreForState(agidReverseGeocoding, 0.23, 0.12, -0.25)
    + (hasCountry ? 0.07 : 0)
    + (hasCity ? 0.05 : 0)
    + (hasPostcode ? 0.05 : 0)
    + (hasAgid ? 0.08 : 0),
  ));

  const hasHardFailure = addressReference === 'fail'
    || countryAddressValidation === 'fail'
    || postalCodeApi === 'fail'
    || agidReverseGeocoding === 'fail'
    || conflictWarnings.length > 0;
  const strongChecks = [countryAddressValidation, postalCodeApi, agidReverseGeocoding]
    .filter(state => state === 'pass').length;
  const status: ShippingAddressAccuracyStatus = hasHardFailure
    ? 'needs-review'
    : internalScore >= 0.78 && strongChecks >= 2
      ? 'verified'
      : internalScore >= 0.25
        ? 'partial'
        : 'needs-review';

  return {
    modelVersion: SHIPPING_ADDRESS_ACCURACY_MODEL_VERSION,
    status,
    decision: status === 'verified' ? 'accept' : 'review',
    checks: {
      addressReference,
      postalCodeApi,
      countryAddressValidation,
      agidReverseGeocoding,
    },
    sources: unique<ShippingAddressAccuracySource>([
      addressReference === 'pass' ? 'address-reference' : undefined,
      postalCodeApi !== 'not-run' ? 'postal-code-api' : undefined,
      countryAddressValidation !== 'not-run' ? 'country-address-validation' : undefined,
      agidReverseGeocoding !== 'not-run' ? 'agid-reverse-geocoding' : undefined,
    ]),
    warnings,
    scoreVisibleToUser: false,
    internalScore,
    internalReasons: unique([
      hasCountry ? 'country-present' : undefined,
      hasCity ? 'city-present' : undefined,
      hasPostcode ? 'postcode-present' : undefined,
      hasAgid ? 'agid-present' : undefined,
      `address-reference:${addressReference}`,
      `country-validation:${countryAddressValidation}`,
      `postal-api:${postalCodeApi}`,
      `agid-reverse-geocoding:${agidReverseGeocoding}`,
    ]),
  };
}

export function publicShippingAddressAccuracyDecision(
  evaluation: ShippingAddressAccuracyEvaluation,
): ShippingAddressAccuracyPublicDecision {
  return {
    modelVersion: SHIPPING_ADDRESS_ACCURACY_MODEL_VERSION,
    status: evaluation.status,
    decision: evaluation.decision,
    checks: evaluation.checks,
    sources: evaluation.sources,
    warnings: evaluation.warnings,
    scoreVisibleToUser: false,
  };
}

function isState(value: unknown): value is ShippingAddressAccuracyCheckState {
  return value === 'pass' || value === 'partial' || value === 'fail' || value === 'not-run';
}

function isStatus(value: unknown): value is ShippingAddressAccuracyStatus {
  return value === 'verified' || value === 'partial' || value === 'needs-review';
}

function isSource(value: unknown): value is ShippingAddressAccuracySource {
  return value === 'postal-code-api'
    || value === 'country-address-validation'
    || value === 'agid-reverse-geocoding'
    || value === 'address-reference';
}

export function normalizeShippingAddressAccuracyDecision(
  value: unknown,
  fallbackAddress: ShippingAddressAccuracyAddressLike,
): ShippingAddressAccuracyPublicDecision {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return publicShippingAddressAccuracyDecision(evaluateShippingAddressAccuracy(fallbackAddress));
  }
  const record = value as Record<string, unknown>;
  const checks = record.checks && typeof record.checks === 'object' && !Array.isArray(record.checks)
    ? record.checks as Record<string, unknown>
    : {};
  const status = isStatus(record.status) ? record.status : 'needs-review';
  const decision = record.decision === 'accept' && status === 'verified' ? 'accept' : 'review';

  return {
    modelVersion: SHIPPING_ADDRESS_ACCURACY_MODEL_VERSION,
    status,
    decision,
    checks: {
      addressReference: isState(checks.addressReference) ? checks.addressReference : 'not-run',
      postalCodeApi: isState(checks.postalCodeApi) ? checks.postalCodeApi : 'not-run',
      countryAddressValidation: isState(checks.countryAddressValidation) ? checks.countryAddressValidation : 'not-run',
      agidReverseGeocoding: isState(checks.agidReverseGeocoding) ? checks.agidReverseGeocoding : 'not-run',
    },
    sources: Array.isArray(record.sources) ? unique(record.sources.filter(isSource)) : [],
    warnings: Array.isArray(record.warnings) ? unique(record.warnings.map(cleanText).filter(Boolean)) : [],
    scoreVisibleToUser: false,
  };
}
