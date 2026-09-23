import { Buffer } from 'node:buffer';

import {
  ADDRESSQL_GLOBAL_COUNTRY_COVERAGE_VERSION,
  buildAddressQlGlobalCountryCoverage,
  summarizeAddressQlGlobalCountryCoverage,
  type AddressQlCapabilityLevel,
  type AddressQlCapabilityState,
  type AddressQlCountryCapabilityGate,
  type AddressQlGlobalCountryCoverageOptions,
  type AddressQlGlobalCountryCoverage,
} from './addressQlGlobalCountryCoverage';
import {
  ADDRESSQL_GLOBAL_COUNTRY_PRELOAD_VERSION,
  buildAddressQlGlobalCountryPreloadProfiles,
  type AddressQlGlobalCountryPreloadProfile,
} from './addressQlGlobalCountryPreload';
import {
  ADDRESSQL_COUNTRY_DATA_PROMOTION_VERSION,
  summarizeAddressQlCountryDataPromotions,
} from './addressQlCountryDataPromotion';
import {
  ADDRESSQL_MULTILINGUAL_QUALITY_VERSION,
  assessAddressQlMultilingualRoute,
  buildAddressQlMultilingualQualityIndex,
  normalizeAddressQlLanguageTag,
  summarizeAddressQlMultilingualQuality,
  type AddressQlMultilingualPurpose,
  type AddressQlMultilingualQualityRecord,
} from './addressQlMultilingualQuality';
import {
  createAddressQlRuntimeAdapterRegistry,
  type AddressQlRuntimeAdapter,
  type AddressQlRuntimeAdapterRegistry,
  type AddressQlRuntimeAdapterRegistryOptions,
} from './addressQlRuntimeAdapter';
import {
  ADDRESSQL_L5_DELIVERY_POINT_DECISION_VERSION,
  type AddressQlDeliveryPointVerifier,
} from './addressQlDeliveryPointDecision';
import {
  rankAddressQlOfficialPlaceNameCandidates,
  type AddressQlOfficialPlaceNameCatalog,
  type AddressQlPlaceHierarchyLevel,
} from './addressQlOfficialPlaceNames';
import {
  projectAddressQlPlaceNameRankingToMorphism,
} from './addressQlAddressMorphismCompatibility';

export const ADDRESSQL_PRACTICAL_API_VERSION = 'addressql-practical-api-v1';
export const ADDRESSQL_PRACTICAL_API_LIMITS = {
  maxBodyBytes: 64 * 1024,
  maxBatchSize: 100,
  maxCountryCodeCharacters: 16,
  maxPostalCodeCharacters: 32,
  maxLanguageTagCharacters: 35,
  maxPlaceNameCharacters: 160,
  maxPlaceNameCandidates: 20,
  maxParentPlaceIds: 8,
  maxRequestIdCharacters: 64,
} as const;

export type AddressQlValidationPurpose = 'format' | 'existence' | 'delivery';
export type AddressQlValidationStatus =
  | 'pass'
  | 'fail'
  | 'unknown'
  | 'not_applicable'
  | 'conflict';

export type AddressQlPracticalApiRequest = {
  method: string;
  path: string;
  headers?: Record<string, string | undefined>;
  body?: unknown;
  bodyBytes?: number;
};

export type AddressQlPracticalApiResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

export type AddressQlPostalValidationRequest = {
  countryCode: string;
  postalCode?: string;
  purpose?: AddressQlValidationPurpose;
  requestId?: string;
};

export type AddressQlMultilingualAssessmentRequest = {
  countryCode: string;
  sourceLanguage: string;
  targetLanguage: string;
  purpose?: AddressQlMultilingualPurpose;
  requestId?: string;
};

export type AddressQlPlaceNameRankingRequest = {
  countryCode: string;
  query: string;
  targetLanguage: string;
  purpose?: AddressQlMultilingualPurpose;
  hierarchyLevel?: AddressQlPlaceHierarchyLevel;
  parentPlaceIds?: string[];
  maxCandidates?: number;
  requestId?: string;
};

export type AddressQlValidationResult = {
  version: 'address-validation-result-v0.1';
  purpose: AddressQlValidationPurpose;
  status: AddressQlValidationStatus;
  confidence: number;
  source_refs: string[];
  evidence_level:
    | 'none'
    | 'synthetic_conformance'
    | 'independently_attested';
  field_results: Array<{
    field: 'country' | 'postal_code';
    status: AddressQlValidationStatus;
    reason_code: string;
  }>;
  result_boundaries: {
    format_pass_does_not_imply_existence: true;
    existence_pass_does_not_imply_delivery: true;
    delivery_pass_does_not_imply_identity: true;
    identity_pass_does_not_disclose_full_address: true;
  };
  privacy: {
    contains_raw_address: false;
    log_safe: true;
    disclosure_scope: 'field_status';
  };
  non_claims: string[];
};

export type AddressQlPracticalApiOptions =
  AddressQlGlobalCountryCoverageOptions
  & AddressQlRuntimeAdapterRegistryOptions
  & {
    runtimeAdapters?: readonly AddressQlRuntimeAdapter[];
    deliveryPointVerifier?: AddressQlDeliveryPointVerifier;
    placeNameCatalog?: AddressQlOfficialPlaceNameCatalog;
  };

type CountryRuntime = {
  profile: AddressQlGlobalCountryPreloadProfile;
  coverage: AddressQlGlobalCountryCoverage;
  multilingual: AddressQlMultilingualQualityRecord;
  postalPattern: RegExp | null;
};

type ParsedPostalRequest =
  | { ok: true; request: Required<Omit<AddressQlPostalValidationRequest, 'requestId'>> & { requestId?: string } }
  | { ok: false; code: string; message: string };

const RESPONSE_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
} as const;

const COUNTRY_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_/-]*$/;
const TECHNICAL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const ALLOWED_POSTAL_REQUEST_FIELDS = new Set([
  'countryCode',
  'postalCode',
  'purpose',
  'requestId',
]);
const ALLOWED_MULTILINGUAL_REQUEST_FIELDS = new Set([
  'countryCode',
  'sourceLanguage',
  'targetLanguage',
  'purpose',
  'requestId',
]);
const ALLOWED_PLACE_NAME_REQUEST_FIELDS = new Set([
  'countryCode',
  'query',
  'targetLanguage',
  'purpose',
  'hierarchyLevel',
  'parentPlaceIds',
  'maxCandidates',
  'requestId',
]);
const PLACE_HIERARCHY_LEVELS: readonly AddressQlPlaceHierarchyLevel[] = [
  'country',
  'admin1',
  'admin2',
  'admin3',
  'locality',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function response(statusCode: number, body: Record<string, unknown>): AddressQlPracticalApiResponse {
  return { statusCode, headers: { ...RESPONSE_HEADERS }, body };
}

export function buildAddressQlApiErrorResponse(
  statusCode: number,
  code: string,
  message: string,
  requestId?: string,
): AddressQlPracticalApiResponse {
  return response(statusCode, {
    version: ADDRESSQL_PRACTICAL_API_VERSION,
    error: {
      code,
      message,
      ...(requestId ? { requestId } : {}),
    },
    privacy: {
      containsRawAddress: false,
      logSafe: true,
    },
  });
}

function serializedBodyBytes(body: unknown): number | null {
  if (body === undefined) return 0;
  try {
    return Buffer.byteLength(JSON.stringify(body), 'utf8');
  } catch {
    return null;
  }
}

function normalizeCountryCode(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}

function normalizePostalCode(value: unknown, countryCode: string): string | null {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return null;
  let postalCode = value
    .normalize('NFKC')
    .trim()
    .toUpperCase()
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/\s+/g, ' ');
  if (countryCode === 'JP' && /^\d{7}$/.test(postalCode)) {
    postalCode = `${postalCode.slice(0, 3)}-${postalCode.slice(3)}`;
  }
  if (countryCode === 'US' && /^\d{9}$/.test(postalCode)) {
    postalCode = `${postalCode.slice(0, 5)}-${postalCode.slice(5)}`;
  }
  return postalCode;
}

function requestIdFromHeaders(headers: Record<string, string | undefined> | undefined): string | undefined {
  if (!headers) return undefined;
  const entry = Object.entries(headers)
    .find(([key]) => key.toLowerCase() === 'x-request-id');
  return entry?.[1];
}

function validateTechnicalId(value: unknown): value is string {
  return typeof value === 'string'
    && value.length <= ADDRESSQL_PRACTICAL_API_LIMITS.maxRequestIdCharacters
    && TECHNICAL_ID_PATTERN.test(value);
}

function parsePostalRequest(
  body: unknown,
  headerRequestId?: string,
): ParsedPostalRequest {
  if (!isRecord(body)) {
    return { ok: false, code: 'invalid_body', message: 'Request body must be a JSON object.' };
  }
  const unknownFields = Object.keys(body).filter(key => !ALLOWED_POSTAL_REQUEST_FIELDS.has(key));
  if (unknownFields.length) {
    return {
      ok: false,
      code: 'unknown_field',
      message: 'Request body contains unsupported fields.',
    };
  }

  const countryCode = normalizeCountryCode(body.countryCode);
  if (
    !countryCode
    || countryCode.length > ADDRESSQL_PRACTICAL_API_LIMITS.maxCountryCodeCharacters
    || !COUNTRY_CODE_PATTERN.test(countryCode)
  ) {
    return {
      ok: false,
      code: 'invalid_country_code',
      message: 'countryCode must be a bounded ASCII country or neutral-scope identifier.',
    };
  }

  const postalCode = normalizePostalCode(body.postalCode, countryCode);
  if (postalCode === null || postalCode.length > ADDRESSQL_PRACTICAL_API_LIMITS.maxPostalCodeCharacters) {
    return {
      ok: false,
      code: 'invalid_postal_code',
      message: `postalCode must be a string of at most ${ADDRESSQL_PRACTICAL_API_LIMITS.maxPostalCodeCharacters} characters.`,
    };
  }

  const purpose = body.purpose ?? 'format';
  if (!['format', 'existence', 'delivery'].includes(String(purpose))) {
    return {
      ok: false,
      code: 'invalid_purpose',
      message: 'purpose must be format, existence, or delivery.',
    };
  }

  const bodyRequestId = body.requestId;
  if (bodyRequestId !== undefined && !validateTechnicalId(bodyRequestId)) {
    return {
      ok: false,
      code: 'invalid_request_id',
      message: 'requestId must be a bounded ASCII technical identifier.',
    };
  }
  if (headerRequestId !== undefined && !validateTechnicalId(headerRequestId)) {
    return {
      ok: false,
      code: 'invalid_request_id',
      message: 'X-Request-Id must be a bounded ASCII technical identifier.',
    };
  }
  if (bodyRequestId && headerRequestId && bodyRequestId !== headerRequestId) {
    return {
      ok: false,
      code: 'request_id_conflict',
      message: 'requestId and X-Request-Id must match when both are supplied.',
    };
  }

  return {
    ok: true,
    request: {
      countryCode,
      postalCode,
      purpose: purpose as AddressQlValidationPurpose,
      ...(bodyRequestId || headerRequestId
        ? { requestId: String(bodyRequestId || headerRequestId) }
        : {}),
    },
  };
}

function parseMultilingualRequest(
  body: unknown,
  headerRequestId?: string,
): {
  ok: true;
  request: Required<Omit<AddressQlMultilingualAssessmentRequest, 'requestId'>>
    & { requestId?: string };
} | {
  ok: false;
  code: string;
  message: string;
} {
  if (!isRecord(body)) {
    return { ok: false, code: 'invalid_body', message: 'Request body must be a JSON object.' };
  }
  if (Object.keys(body).some(key => !ALLOWED_MULTILINGUAL_REQUEST_FIELDS.has(key))) {
    return {
      ok: false,
      code: 'unknown_field',
      message: 'Request body contains unsupported fields.',
    };
  }
  const countryCode = normalizeCountryCode(body.countryCode);
  if (
    !countryCode
    || countryCode.length > ADDRESSQL_PRACTICAL_API_LIMITS.maxCountryCodeCharacters
    || !COUNTRY_CODE_PATTERN.test(countryCode)
  ) {
    return {
      ok: false,
      code: 'invalid_country_code',
      message: 'countryCode must be a bounded ASCII country or neutral-scope identifier.',
    };
  }
  const sourceLanguage = typeof body.sourceLanguage === 'string'
    ? normalizeAddressQlLanguageTag(body.sourceLanguage)
    : null;
  const targetLanguage = typeof body.targetLanguage === 'string'
    ? normalizeAddressQlLanguageTag(body.targetLanguage)
    : null;
  if (!sourceLanguage || !targetLanguage) {
    return {
      ok: false,
      code: 'invalid_language_tag',
      message: 'sourceLanguage and targetLanguage must be bounded BCP 47 language tags.',
    };
  }
  const purpose = body.purpose ?? 'international-shipping';
  if (!['domestic', 'international-shipping'].includes(String(purpose))) {
    return {
      ok: false,
      code: 'invalid_multilingual_purpose',
      message: 'purpose must be domestic or international-shipping.',
    };
  }
  const bodyRequestId = body.requestId;
  if (bodyRequestId !== undefined && !validateTechnicalId(bodyRequestId)) {
    return {
      ok: false,
      code: 'invalid_request_id',
      message: 'requestId must be a bounded ASCII technical identifier.',
    };
  }
  if (headerRequestId !== undefined && !validateTechnicalId(headerRequestId)) {
    return {
      ok: false,
      code: 'invalid_request_id',
      message: 'X-Request-Id must be a bounded ASCII technical identifier.',
    };
  }
  if (bodyRequestId && headerRequestId && bodyRequestId !== headerRequestId) {
    return {
      ok: false,
      code: 'request_id_conflict',
      message: 'requestId and X-Request-Id must match when both are supplied.',
    };
  }
  return {
    ok: true,
    request: {
      countryCode,
      sourceLanguage,
      targetLanguage,
      purpose: purpose as AddressQlMultilingualPurpose,
      ...(bodyRequestId || headerRequestId
        ? { requestId: String(bodyRequestId || headerRequestId) }
        : {}),
    },
  };
}

function parsePlaceNameRequest(
  body: unknown,
  headerRequestId?: string,
): {
  ok: true;
  request: Required<Pick<
    AddressQlPlaceNameRankingRequest,
    'countryCode' | 'query' | 'targetLanguage' | 'purpose' | 'maxCandidates'
  >> & Pick<
    AddressQlPlaceNameRankingRequest,
    'hierarchyLevel' | 'parentPlaceIds' | 'requestId'
  >;
} | {
  ok: false;
  code: string;
  message: string;
} {
  if (!isRecord(body)) {
    return {
      ok: false,
      code: 'invalid_body',
      message: 'Request body must be a JSON object.',
    };
  }
  if (Object.keys(body).some(key => !ALLOWED_PLACE_NAME_REQUEST_FIELDS.has(key))) {
    return {
      ok: false,
      code: 'unknown_field',
      message: 'Request body contains unsupported fields.',
    };
  }
  const countryCode = normalizeCountryCode(body.countryCode);
  if (
    !countryCode
    || countryCode.length > ADDRESSQL_PRACTICAL_API_LIMITS.maxCountryCodeCharacters
    || !COUNTRY_CODE_PATTERN.test(countryCode)
  ) {
    return {
      ok: false,
      code: 'invalid_country_code',
      message: 'countryCode must be a bounded ASCII country identifier.',
    };
  }
  if (
    typeof body.query !== 'string'
    || !body.query.trim()
    || body.query.length > ADDRESSQL_PRACTICAL_API_LIMITS.maxPlaceNameCharacters
  ) {
    return {
      ok: false,
      code: 'invalid_place_name',
      message: 'query must be a public place-name token of at most 160 characters.',
    };
  }
  const targetLanguage = typeof body.targetLanguage === 'string'
    ? normalizeAddressQlLanguageTag(body.targetLanguage)
    : null;
  if (!targetLanguage) {
    return {
      ok: false,
      code: 'invalid_language_tag',
      message: 'targetLanguage must be a bounded BCP 47 language tag.',
    };
  }
  const purpose = body.purpose ?? 'international-shipping';
  if (!['domestic', 'international-shipping'].includes(String(purpose))) {
    return {
      ok: false,
      code: 'invalid_multilingual_purpose',
      message: 'purpose must be domestic or international-shipping.',
    };
  }
  const hierarchyLevel = body.hierarchyLevel;
  if (
    hierarchyLevel !== undefined
    && (
      typeof hierarchyLevel !== 'string'
      || !PLACE_HIERARCHY_LEVELS.includes(
        hierarchyLevel as AddressQlPlaceHierarchyLevel,
      )
    )
  ) {
    return {
      ok: false,
      code: 'invalid_hierarchy_level',
      message: 'hierarchyLevel must be country, admin1, admin2, admin3, or locality.',
    };
  }
  const parentPlaceIds = body.parentPlaceIds ?? [];
  if (
    !Array.isArray(parentPlaceIds)
    || parentPlaceIds.length > ADDRESSQL_PRACTICAL_API_LIMITS.maxParentPlaceIds
    || parentPlaceIds.some(item => !validateTechnicalId(item))
    || new Set(parentPlaceIds).size !== parentPlaceIds.length
  ) {
    return {
      ok: false,
      code: 'invalid_parent_context',
      message: 'parentPlaceIds must contain at most 8 unique technical IDs.',
    };
  }
  const maxCandidates = body.maxCandidates
    ?? ADDRESSQL_PRACTICAL_API_LIMITS.maxPlaceNameCandidates;
  if (
    !Number.isInteger(maxCandidates)
    || Number(maxCandidates) < 1
    || Number(maxCandidates)
      > ADDRESSQL_PRACTICAL_API_LIMITS.maxPlaceNameCandidates
  ) {
    return {
      ok: false,
      code: 'invalid_max_candidates',
      message: 'maxCandidates must be an integer from 1 to 20.',
    };
  }
  const bodyRequestId = body.requestId;
  if (bodyRequestId !== undefined && !validateTechnicalId(bodyRequestId)) {
    return {
      ok: false,
      code: 'invalid_request_id',
      message: 'requestId must be a bounded ASCII technical identifier.',
    };
  }
  if (headerRequestId !== undefined && !validateTechnicalId(headerRequestId)) {
    return {
      ok: false,
      code: 'invalid_request_id',
      message: 'X-Request-Id must be a bounded ASCII technical identifier.',
    };
  }
  if (bodyRequestId && headerRequestId && bodyRequestId !== headerRequestId) {
    return {
      ok: false,
      code: 'request_id_conflict',
      message: 'requestId and X-Request-Id must match when both are supplied.',
    };
  }
  return {
    ok: true,
    request: {
      countryCode,
      query: body.query,
      targetLanguage,
      purpose: purpose as AddressQlMultilingualPurpose,
      maxCandidates: Number(maxCandidates),
      ...(hierarchyLevel
        ? { hierarchyLevel: hierarchyLevel as AddressQlPlaceHierarchyLevel }
        : {}),
      ...(parentPlaceIds.length
        ? { parentPlaceIds: parentPlaceIds as string[] }
        : {}),
      ...(bodyRequestId || headerRequestId
        ? { requestId: String(bodyRequestId || headerRequestId) }
        : {}),
    },
  };
}

function compilePostalPattern(profile: AddressQlGlobalCountryPreloadProfile): RegExp | null {
  if (!profile.postalRegex || profile.postalRegex.length > 512) return null;
  try {
    return new RegExp(profile.postalRegex, 'u');
  } catch {
    return null;
  }
}

function gateForPurpose(
  coverage: AddressQlGlobalCountryCoverage,
  purpose: AddressQlValidationPurpose,
): AddressQlCountryCapabilityGate {
  const level: AddressQlCapabilityLevel =
    purpose === 'format' ? 'L1' : purpose === 'existence' ? 'L2' : 'L4';
  return coverage.capabilityGates.find(gate => gate.level === level)!;
}

function missingEvidence(gate: AddressQlCountryCapabilityGate): string[] {
  const approved = new Set(gate.approvedEvidence);
  return gate.requiredEvidence.filter(requirement => !approved.has(requirement));
}

function runtimeCapabilityForLevel(
  adapterRegistry: AddressQlRuntimeAdapterRegistry,
  countryCode: string,
  level: AddressQlCapabilityLevel,
) {
  const purpose = level === 'L2'
    ? 'existence'
    : level === 'L4'
      ? 'delivery'
      : null;
  return purpose
    ? adapterRegistry.capability({ countryCode, purpose })
    : null;
}

function effectiveHighestEnabledLevel(
  runtime: CountryRuntime,
  adapterRegistry: AddressQlRuntimeAdapterRegistry,
): AddressQlCapabilityLevel | null {
  const levels: AddressQlCapabilityLevel[] = ['L5', 'L4', 'L3', 'L2', 'L1'];
  return levels.find(level => {
    const gate = runtime.coverage.capabilityGates.find(item => item.level === level);
    return gate?.state === 'enabled'
      || runtimeCapabilityForLevel(
        adapterRegistry,
        runtime.profile.countryCode,
        level,
      )?.liveEligible === true;
  }) ?? null;
}

function sourceRefs(runtime: CountryRuntime): string[] {
  return [
    ADDRESSQL_GLOBAL_COUNTRY_PRELOAD_VERSION,
    ADDRESSQL_GLOBAL_COUNTRY_COVERAGE_VERSION,
    ...(runtime.profile.sourcePath ? [runtime.profile.sourcePath] : []),
  ];
}

function validationResult(
  runtime: CountryRuntime,
  postalCode: string,
  purpose: AddressQlValidationPurpose,
  adapterRegistry: AddressQlRuntimeAdapterRegistry,
): {
  validation: AddressQlValidationResult;
  capability: {
    requestedLevel: AddressQlCapabilityLevel;
    state: AddressQlCapabilityState;
    missingEvidence: string[];
    adapterIds: string[];
    liveRuntimeEvidence: boolean;
  };
} {
  const gate = gateForPurpose(runtime.coverage, purpose);
  let status: AddressQlValidationStatus = 'unknown';
  let confidence = 0;
  let reasonCode = `${gate.level.toLowerCase()}_evidence_required`;
  let evidenceLevel: AddressQlValidationResult['evidence_level'] = 'none';
  let runtimeSourceRefs: string[] = [];
  let adapterIds: string[] = [];
  let liveRuntimeEvidence = false;

  if (purpose === 'format') {
    if (runtime.profile.postalStatus === 'no_postal_code') {
      status = postalCode ? 'fail' : 'not_applicable';
      confidence = 1;
      reasonCode = postalCode
        ? 'country_has_no_postal_code_system'
        : 'postal_code_not_applicable';
    } else if (gate.state !== 'enabled' || !runtime.postalPattern) {
      status = 'unknown';
      reasonCode = 'postal_format_evidence_required';
    } else if (!postalCode) {
      status = 'fail';
      confidence = 1;
      reasonCode = 'postal_code_missing';
    } else {
      status = runtime.postalPattern.test(postalCode) ? 'pass' : 'fail';
      confidence = 0.95;
      reasonCode = status === 'pass' ? 'postal_format_match' : 'postal_format_mismatch';
    }
  } else if (gate.state === 'not_applicable') {
    status = 'not_applicable';
    confidence = 1;
    reasonCode = `${purpose}_not_applicable`;
  } else {
    const adapterEvaluation = adapterRegistry.evaluate({
      countryCode: runtime.profile.countryCode,
      postalCode,
      purpose,
    });
    if (adapterEvaluation) {
      adapterIds = adapterEvaluation.adapterIds;
      runtimeSourceRefs = adapterEvaluation.sourceRefs;
      evidenceLevel = adapterEvaluation.evidenceLevel;
      liveRuntimeEvidence = adapterEvaluation.liveEligible;
      if (adapterEvaluation.liveEligible) {
        status = adapterEvaluation.status;
        confidence = adapterEvaluation.confidence;
        reasonCode = adapterEvaluation.reasonCode;
      } else {
        reasonCode = `${purpose}_conformance_adapter_not_live`;
      }
    } else if (gate.state === 'enabled') {
      reasonCode = `${purpose}_runtime_adapter_required`;
    }
  }

  return {
    validation: {
      version: 'address-validation-result-v0.1',
      purpose,
      status,
      confidence,
      source_refs: [...sourceRefs(runtime), ...runtimeSourceRefs],
      evidence_level: evidenceLevel,
      field_results: [
        { field: 'country', status: 'pass', reason_code: 'country_profile_resolved' },
        { field: 'postal_code', status, reason_code: reasonCode },
      ],
      result_boundaries: {
        format_pass_does_not_imply_existence: true,
        existence_pass_does_not_imply_delivery: true,
        delivery_pass_does_not_imply_identity: true,
        identity_pass_does_not_disclose_full_address: true,
      },
      privacy: {
        contains_raw_address: false,
        log_safe: true,
        disclosure_scope: 'field_status',
      },
      non_claims: [
        'Postal-format validation does not imply postal-code existence.',
        'Postal-code existence does not imply address or delivery-point existence.',
        'Delivery results do not prove residence, identity, recipient authorization, or a carrier SLA.',
      ],
    },
    capability: {
      requestedLevel: gate.level,
      state: liveRuntimeEvidence ? 'enabled' : gate.state,
      missingEvidence: liveRuntimeEvidence ? [] : missingEvidence(gate),
      adapterIds,
      liveRuntimeEvidence,
    },
  };
}

function countryCapabilityBody(
  runtime: CountryRuntime,
  adapterRegistry: AddressQlRuntimeAdapterRegistry,
): Record<string, unknown> {
  const capabilities = runtime.coverage.capabilityGates.map(gate => {
    const adapterCapability = runtimeCapabilityForLevel(
      adapterRegistry,
      runtime.profile.countryCode,
      gate.level,
    );
    const runtimeEnabled = adapterCapability?.liveEligible === true;
    return {
      level: gate.level,
      capability: gate.capability,
      state: runtimeEnabled ? 'enabled' : gate.state,
      missingEvidence: runtimeEnabled ? [] : missingEvidence(gate),
      promotionState: runtimeEnabled
        ? 'enabled'
        : runtime.coverage.dataPromotion.targets
          .find(target => target.level === gate.level)?.state || null,
      adapterIds: adapterCapability?.adapterIds ?? [],
      evidenceLevel: adapterCapability?.evidenceLevel ?? 'none',
      liveRuntimeEvidence: runtimeEnabled,
    };
  });
  return {
    version: ADDRESSQL_PRACTICAL_API_VERSION,
    country: {
      countryCode: runtime.profile.countryCode,
      displayName: runtime.profile.displayName,
      scope: runtime.coverage.scope,
      addressFormatCoverage: runtime.profile.addressFormatCoverage,
      validationReadiness: runtime.profile.validationReadiness,
      postalStatus: runtime.profile.postalStatus,
      postalFormat: runtime.profile.postalFormat,
      languageCodes: runtime.profile.languageCodes,
      requiredComponents: runtime.profile.requiredComponents,
      highestEnabledLevel: effectiveHighestEnabledLevel(
        runtime,
        adapterRegistry,
      ),
      highestReviewCandidateLevel:
        runtime.coverage.dataPromotion.highestReviewCandidateLevel,
    },
    capabilities,
    blockers: runtime.coverage.blockers,
    nonClaims: runtime.coverage.nonClaims,
  };
}

function countryPromotionBody(
  runtime: CountryRuntime,
  adapterRegistry: AddressQlRuntimeAdapterRegistry,
): Record<string, unknown> {
  const targets = runtime.coverage.dataPromotion.targets.map(target => {
    const adapterCapability = runtimeCapabilityForLevel(
      adapterRegistry,
      runtime.profile.countryCode,
      target.level,
    );
    if (adapterCapability?.liveEligible !== true) {
      return {
        ...target,
        adapterIds: adapterCapability?.adapterIds ?? [],
        evidenceLevel: adapterCapability?.evidenceLevel ?? 'none',
      };
    }
    return {
      ...target,
      state: 'enabled',
      approvedEvidence: target.requiredEvidence,
      missingEvidence: [],
      runtimeAdapterId: adapterCapability.adapterIds[0] ?? null,
      adapterIds: adapterCapability.adapterIds,
      independentAttestationVerified: true,
      evidenceLevel: adapterCapability.evidenceLevel,
    };
  });
  const highestEnabledLevel = [...targets]
    .reverse()
    .find(target => target.state === 'enabled')?.level ?? null;
  const runtimeEnabled = highestEnabledLevel !== null;
  return {
    version: ADDRESSQL_PRACTICAL_API_VERSION,
    promotionVersion: ADDRESSQL_COUNTRY_DATA_PROMOTION_VERSION,
    countryCode: runtime.profile.countryCode,
    highestReviewCandidateLevel:
      runtime.coverage.dataPromotion.highestReviewCandidateLevel,
    highestEnabledLevel,
    syntheticAdministrativeEvaluationEligible:
      runtime.coverage.dataPromotion.syntheticAdministrativeEvaluationEligible,
    syntheticHoldoutDigest:
      runtime.coverage.dataPromotion.syntheticHoldoutDigest,
    reviewBy: runtime.coverage.dataPromotion.reviewBy,
    targets,
    blockers: targets.flatMap(target =>
      target.missingEvidence.map(evidence => `${target.level}:${evidence}`)),
    privacy: runtime.coverage.dataPromotion.privacy,
    nonClaims: runtimeEnabled
      ? [
        'Runtime promotion applies only to the independently attested adapter versions shown.',
        'Postal existence and delivery-area evidence do not prove address, delivery-point, residence, or identity.',
      ]
      : runtime.coverage.dataPromotion.nonClaims,
  };
}

function countryLanguageBody(runtime: CountryRuntime): Record<string, unknown> {
  return {
    version: ADDRESSQL_PRACTICAL_API_VERSION,
    multilingualVersion: ADDRESSQL_MULTILINGUAL_QUALITY_VERSION,
    countryCode: runtime.profile.countryCode,
    languageCodes: runtime.multilingual.languageCodes,
    scriptFamilies: runtime.multilingual.scriptFamilies,
    adapterFamilies: runtime.multilingual.adapterFamilies,
    highestEnabledLevel: runtime.multilingual.highestEnabledLevel,
    highestReviewCandidateLevel:
      runtime.multilingual.highestReviewCandidateLevel,
    automaticPlaceNameTranslationEnabled:
      runtime.multilingual.automaticPlaceNameTranslationEnabled,
    independentQualityAttestationVerified:
      runtime.multilingual.independentQualityAttestationVerified,
    gates: runtime.multilingual.gates,
    privacy: runtime.multilingual.privacy,
    nonClaims: runtime.multilingual.nonClaims,
  };
}

export function createAddressQlPracticalApi(
  root = process.cwd(),
  options: AddressQlPracticalApiOptions = {},
) {
  const profiles = buildAddressQlGlobalCountryPreloadProfiles(root);
  const coverage = buildAddressQlGlobalCountryCoverage(root, options);
  const coverageByCountry = new Map(coverage.map(record => [record.countryCode, record]));
  const multilingual = buildAddressQlMultilingualQualityIndex(root);
  const multilingualByCountry = new Map(
    multilingual.map(record => [record.countryCode, record]),
  );
  const promotionSummary = summarizeAddressQlCountryDataPromotions(
    coverage.map(record => record.dataPromotion),
  );
  const multilingualSummary = summarizeAddressQlMultilingualQuality(multilingual);
  const adapterRegistry = createAddressQlRuntimeAdapterRegistry(
    options.runtimeAdapters,
    options,
  );
  const runtimes = new Map<string, CountryRuntime>();

  for (const profile of profiles) {
    const countryCoverage = coverageByCountry.get(profile.countryCode);
    const countryMultilingual = multilingualByCountry.get(profile.countryCode);
    if (!countryCoverage || !countryMultilingual) continue;
    runtimes.set(profile.countryCode, {
      profile,
      coverage: countryCoverage,
      multilingual: countryMultilingual,
      postalPattern: compilePostalPattern(profile),
    });
  }

  function runtimeEnabledCountryCodes(level: AddressQlCapabilityLevel) {
    return [...runtimes.values()]
      .filter(runtime =>
        runtimeCapabilityForLevel(
          adapterRegistry,
          runtime.profile.countryCode,
          level,
        )?.liveEligible === true)
      .map(runtime => runtime.profile.countryCode)
      .sort();
  }

  function validateOne(
    body: unknown,
    headerRequestId?: string,
  ): AddressQlPracticalApiResponse {
    const parsed = parsePostalRequest(body, headerRequestId);
    if (parsed.ok === false) {
      return buildAddressQlApiErrorResponse(400, parsed.code, parsed.message);
    }
    const runtime = runtimes.get(parsed.request.countryCode);
    if (!runtime) {
      return buildAddressQlApiErrorResponse(
        404,
        'country_not_found',
        'No country or neutral-scope profile exists for countryCode.',
        parsed.request.requestId,
      );
    }
    const evaluated = validationResult(
      runtime,
      parsed.request.postalCode,
      parsed.request.purpose,
      adapterRegistry,
    );
    return response(200, {
      version: ADDRESSQL_PRACTICAL_API_VERSION,
      ...(parsed.request.requestId ? { requestId: parsed.request.requestId } : {}),
      countryCode: runtime.profile.countryCode,
      highestEnabledLevel: effectiveHighestEnabledLevel(
        runtime,
        adapterRegistry,
      ),
      capability: evaluated.capability,
      validation: evaluated.validation,
    });
  }

  function handle(request: AddressQlPracticalApiRequest): AddressQlPracticalApiResponse {
    const method = request.method.trim().toUpperCase();
    const path = request.path.split('?', 1)[0].replace(/\/+$/, '') || '/';
    const bodyBytes = request.bodyBytes ?? serializedBodyBytes(request.body);
    if (bodyBytes === null) {
      return buildAddressQlApiErrorResponse(400, 'invalid_body', 'Request body must be JSON serializable.');
    }
    if (bodyBytes > ADDRESSQL_PRACTICAL_API_LIMITS.maxBodyBytes) {
      return buildAddressQlApiErrorResponse(413, 'body_too_large', 'Request body exceeds the API byte limit.');
    }

    if (method === 'GET' && path === '/v1/health') {
      const summary = summarizeAddressQlGlobalCountryCoverage(root, options);
      const runtimeL2Countries = runtimeEnabledCountryCodes('L2');
      const runtimeL4Countries = runtimeEnabledCountryCodes('L4');
      const runtimeEnabledCountries = new Set([
        ...runtimeL2Countries,
        ...runtimeL4Countries,
      ]);
      const effectivePostalExistenceProfiles = [...runtimes.values()]
        .filter(runtime =>
          runtime.coverage.capabilityGates.some(
            gate => gate.level === 'L2' && gate.state === 'enabled',
          )
          || runtimeL2Countries.includes(runtime.profile.countryCode))
        .length;
      const effectivePromotionProfiles = [...runtimes.values()]
        .filter(runtime =>
          runtime.coverage.dataPromotion.highestEnabledLevel !== null
          || runtimeEnabledCountries.has(runtime.profile.countryCode))
        .length;
      return response(200, {
        version: ADDRESSQL_PRACTICAL_API_VERSION,
        status: 'ok',
        profileCount: runtimes.size,
        coverageVersion: summary.version,
        postalExistenceEnabledProfiles: effectivePostalExistenceProfiles,
        deliveryPointEnabledProfiles: summary.deliveryPointEnabledProfiles,
        dataPromotionReviewCandidateProfiles:
          summary.dataPromotionReviewCandidateProfiles,
        dataPromotionEnabledProfiles: effectivePromotionProfiles,
        multilingualNativeFormatEnabledProfiles:
          multilingualSummary.nativeFormatEnabledProfiles,
        multilingualInternationalEnglishFormatEnabledProfiles:
          multilingualSummary.internationalEnglishFormatEnabledProfiles,
        automaticPlaceNameTranslationEnabledProfiles:
          multilingualSummary.automaticPlaceNameTranslationEnabledProfiles,
        runtimeAdapters: {
          total: adapterRegistry.adapterCount,
          approved: adapterRegistry.approvedAdapterCount,
          conformance: adapterRegistry.conformanceAdapterCount,
        },
        deliveryPointDecisionContract: {
          version: ADDRESSQL_L5_DELIVERY_POINT_DECISION_VERSION,
          configured: Boolean(options.deliveryPointVerifier),
          trustedCarrierCount:
            options.deliveryPointVerifier?.trustedCarrierCount ?? 0,
          trustedKeyCount:
            options.deliveryPointVerifier?.trustedKeyCount ?? 0,
          countryCodes:
            options.deliveryPointVerifier?.countryCodes ?? [],
          level: 'L5',
          scope: 'delivery-point',
        },
        officialPlaceNameCatalog: {
          configured: Boolean(options.placeNameCatalog),
          catalogId: options.placeNameCatalog?.catalogId ?? null,
          catalogVersion: options.placeNameCatalog?.catalogVersion ?? null,
          automaticUseEnabled: false,
        },
        privacy: { storesRequests: false, logsRequestBodies: false },
      });
    }

    if (method === 'GET' && path === '/v1/countries') {
      return response(200, {
        version: ADDRESSQL_PRACTICAL_API_VERSION,
        count: runtimes.size,
        countries: [...runtimes.values()].map(runtime => ({
          countryCode: runtime.profile.countryCode,
          displayName: runtime.profile.displayName,
          highestEnabledLevel: effectiveHighestEnabledLevel(
            runtime,
            adapterRegistry,
          ),
          highestReviewCandidateLevel:
            runtime.coverage.dataPromotion.highestReviewCandidateLevel,
          highestMultilingualEnabledLevel:
            runtime.multilingual.highestEnabledLevel,
          validationReadiness: runtime.profile.validationReadiness,
        })),
      });
    }

    if (method === 'GET' && path === '/v1/promotions') {
      const runtimeL2Countries = runtimeEnabledCountryCodes('L2');
      const runtimeL4Countries = runtimeEnabledCountryCodes('L4');
      const enabledCountryCodes = [...new Set([
        ...promotionSummary.enabledCountryCodes,
        ...runtimeL2Countries,
        ...runtimeL4Countries,
      ])].sort();
      return response(200, {
        version: ADDRESSQL_PRACTICAL_API_VERSION,
        promotionVersion: promotionSummary.version,
        countryCount: promotionSummary.countryCount,
        reviewCandidateCountryCodes:
          promotionSummary.reviewCandidateCountryCodes,
        enabledCountryCodes,
        enabledByLevel: {
          ...promotionSummary.enabledByLevel,
          L2: promotionSummary.enabledByLevel.L2 + runtimeL2Countries.length,
          L4: promotionSummary.enabledByLevel.L4 + runtimeL4Countries.length,
        },
        nonClaims: [
          'Review candidacy is not an enabled validation capability.',
          'Only independently attested runtime adapter versions can enable L2 or L4.',
          'L2 or L4 enablement does not imply L5 delivery-point evidence.',
        ],
      });
    }

    if (method === 'GET' && path === '/v1/multilingual') {
      return response(200, {
        ...multilingualSummary,
        version: ADDRESSQL_PRACTICAL_API_VERSION,
        multilingualVersion: multilingualSummary.version,
        nonClaims: [
          'Native and English templates do not prove place-name translation quality.',
          'No automatic place-name translation is enabled.',
        ],
      });
    }

    const capabilityMatch = path.match(/^\/v1\/countries\/([^/]+)\/capabilities$/);
    if (method === 'GET' && capabilityMatch) {
      let decodedCountryCode: string;
      try {
        decodedCountryCode = decodeURIComponent(capabilityMatch[1]);
      } catch {
        return buildAddressQlApiErrorResponse(400, 'invalid_country_code', 'Invalid countryCode path parameter.');
      }
      const countryCode = normalizeCountryCode(decodedCountryCode);
      if (
        countryCode.length > ADDRESSQL_PRACTICAL_API_LIMITS.maxCountryCodeCharacters
        || !COUNTRY_CODE_PATTERN.test(countryCode)
      ) {
        return buildAddressQlApiErrorResponse(400, 'invalid_country_code', 'Invalid countryCode path parameter.');
      }
      const runtime = runtimes.get(countryCode);
      return runtime
        ? response(200, countryCapabilityBody(runtime, adapterRegistry))
        : buildAddressQlApiErrorResponse(404, 'country_not_found', 'No country or neutral-scope profile exists for countryCode.');
    }

    const promotionMatch = path.match(/^\/v1\/countries\/([^/]+)\/promotions$/);
    if (method === 'GET' && promotionMatch) {
      let decodedCountryCode: string;
      try {
        decodedCountryCode = decodeURIComponent(promotionMatch[1]);
      } catch {
        return buildAddressQlApiErrorResponse(400, 'invalid_country_code', 'Invalid countryCode path parameter.');
      }
      const countryCode = normalizeCountryCode(decodedCountryCode);
      if (
        countryCode.length > ADDRESSQL_PRACTICAL_API_LIMITS.maxCountryCodeCharacters
        || !COUNTRY_CODE_PATTERN.test(countryCode)
      ) {
        return buildAddressQlApiErrorResponse(400, 'invalid_country_code', 'Invalid countryCode path parameter.');
      }
      const runtime = runtimes.get(countryCode);
      return runtime
        ? response(200, countryPromotionBody(runtime, adapterRegistry))
        : buildAddressQlApiErrorResponse(404, 'country_not_found', 'No country or neutral-scope profile exists for countryCode.');
    }

    const languageMatch = path.match(/^\/v1\/countries\/([^/]+)\/languages$/);
    if (method === 'GET' && languageMatch) {
      let decodedCountryCode: string;
      try {
        decodedCountryCode = decodeURIComponent(languageMatch[1]);
      } catch {
        return buildAddressQlApiErrorResponse(400, 'invalid_country_code', 'Invalid countryCode path parameter.');
      }
      const countryCode = normalizeCountryCode(decodedCountryCode);
      if (
        countryCode.length > ADDRESSQL_PRACTICAL_API_LIMITS.maxCountryCodeCharacters
        || !COUNTRY_CODE_PATTERN.test(countryCode)
      ) {
        return buildAddressQlApiErrorResponse(400, 'invalid_country_code', 'Invalid countryCode path parameter.');
      }
      const runtime = runtimes.get(countryCode);
      return runtime
        ? response(200, countryLanguageBody(runtime))
        : buildAddressQlApiErrorResponse(404, 'country_not_found', 'No country or neutral-scope profile exists for countryCode.');
    }

    if (method === 'POST' && path === '/v1/multilingual/assess') {
      const parsed = parseMultilingualRequest(
        request.body,
        requestIdFromHeaders(request.headers),
      );
      if (parsed.ok === false) {
        return buildAddressQlApiErrorResponse(400, parsed.code, parsed.message);
      }
      const runtime = runtimes.get(parsed.request.countryCode);
      if (!runtime) {
        return buildAddressQlApiErrorResponse(
          404,
          'country_not_found',
          'No country or neutral-scope profile exists for countryCode.',
          parsed.request.requestId,
        );
      }
      const assessment = assessAddressQlMultilingualRoute({
        record: runtime.multilingual,
        sourceLanguage: parsed.request.sourceLanguage,
        targetLanguage: parsed.request.targetLanguage,
        purpose: parsed.request.purpose,
      });
      return response(200, {
        version: ADDRESSQL_PRACTICAL_API_VERSION,
        ...(parsed.request.requestId
          ? { requestId: parsed.request.requestId }
          : {}),
        assessment,
        privacy: {
          acceptsAddressText: false,
          storesAddressText: false,
          logsAddressText: false,
        },
      });
    }

    if (method === 'POST' && path === '/v1/place-names/rank') {
      if (!options.placeNameCatalog) {
        return buildAddressQlApiErrorResponse(
          503,
          'place_name_catalog_not_configured',
          'A versioned official place-name catalog is not configured.',
        );
      }
      const parsed = parsePlaceNameRequest(
        request.body,
        requestIdFromHeaders(request.headers),
      );
      if (parsed.ok === false) {
        return buildAddressQlApiErrorResponse(400, parsed.code, parsed.message);
      }
      const now = options.clock?.() ?? options.now;
      const ranking = rankAddressQlOfficialPlaceNameCandidates({
        catalog: options.placeNameCatalog,
        countryCode: parsed.request.countryCode,
        query: parsed.request.query,
        targetLanguage: parsed.request.targetLanguage,
        purpose: parsed.request.purpose,
        hierarchyLevel: parsed.request.hierarchyLevel,
        parentPlaceIds: parsed.request.parentPlaceIds,
        maxCandidates: parsed.request.maxCandidates,
        now,
      });
      if (ranking.status === 'rejected-evidence') {
        return buildAddressQlApiErrorResponse(
          503,
          'place_name_catalog_rejected',
          'The configured place-name catalog failed its evidence gate.',
          parsed.request.requestId,
        );
      }
      return response(200, {
        version: ADDRESSQL_PRACTICAL_API_VERSION,
        ...(parsed.request.requestId
          ? { requestId: parsed.request.requestId }
          : {}),
        ranking,
        addressMorphism: projectAddressQlPlaceNameRankingToMorphism({
          catalog: options.placeNameCatalog,
          ranking,
          now,
        }),
        privacy: {
          acceptsPublicPlaceName: true,
          acceptsRawAddress: false,
          storesPlaceName: false,
          logsPlaceName: false,
        },
      });
    }

    if (method === 'POST' && path === '/v1/delivery-points/assess') {
      if (!options.deliveryPointVerifier) {
        return buildAddressQlApiErrorResponse(
          503,
          'l5_verifier_not_configured',
          'The signed L5 delivery-point verifier is not configured.',
        );
      }
      if (!isRecord(request.body)) {
        return buildAddressQlApiErrorResponse(
          400,
          'invalid_l5_contract',
          'The L5 request must be a JSON object.',
        );
      }
      const countryCode = normalizeCountryCode(request.body.countryCode);
      if (!runtimes.has(countryCode)) {
        return buildAddressQlApiErrorResponse(
          404,
          'country_not_found',
          'No country profile exists for the signed L5 request.',
        );
      }
      try {
        const decision = options.deliveryPointVerifier.assess(request.body);
        return response(200, {
          version: ADDRESSQL_PRACTICAL_API_VERSION,
          countryCode,
          capability: {
            requestedLevel: 'L5',
            scope: 'delivery-point',
            state: decision.status === 'conflict' ? 'conflict' : 'evaluated',
            l4DeliveryAreaEvaluated: false,
            signedCarrierEvidence: true,
          },
          decision,
        });
      } catch {
        return buildAddressQlApiErrorResponse(
          400,
          'invalid_l5_contract',
          'The signed L5 carrier assertion contract could not be verified.',
        );
      }
    }

    if (method === 'POST' && path === '/v1/postal/validate') {
      return validateOne(request.body, requestIdFromHeaders(request.headers));
    }

    if (method === 'POST' && path === '/v1/postal/validate/batch') {
      if (!isRecord(request.body) || Object.keys(request.body).some(key => key !== 'requests')) {
        return buildAddressQlApiErrorResponse(400, 'invalid_batch_body', 'Batch body must contain only requests.');
      }
      if (!Array.isArray(request.body.requests)) {
        return buildAddressQlApiErrorResponse(400, 'invalid_batch_body', 'requests must be an array.');
      }
      if (request.body.requests.length > ADDRESSQL_PRACTICAL_API_LIMITS.maxBatchSize) {
        return buildAddressQlApiErrorResponse(413, 'batch_too_large', 'Batch exceeds the request-count limit.');
      }
      const results = request.body.requests.map(item => {
        const itemResponse = validateOne(item);
        return {
          statusCode: itemResponse.statusCode,
          ...itemResponse.body,
        };
      });
      return response(200, {
        version: ADDRESSQL_PRACTICAL_API_VERSION,
        count: results.length,
        results,
      });
    }

    return buildAddressQlApiErrorResponse(404, 'route_not_found', 'AddressQL API route was not found.');
  }

  return {
    version: ADDRESSQL_PRACTICAL_API_VERSION,
    limits: ADDRESSQL_PRACTICAL_API_LIMITS,
    profileCount: runtimes.size,
    handle,
  };
}
