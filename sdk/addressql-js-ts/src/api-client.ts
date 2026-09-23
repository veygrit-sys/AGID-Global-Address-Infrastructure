export type AddressQlApiValidationPurpose = "format" | "existence" | "delivery";

export type AddressQlApiPostalValidationRequest = {
  countryCode: string;
  postalCode?: string;
  purpose?: AddressQlApiValidationPurpose;
  requestId?: string;
};

export type AddressQlApiMultilingualAssessmentRequest = {
  countryCode: string;
  sourceLanguage: string;
  targetLanguage: string;
  purpose?: "domestic" | "international-shipping";
  requestId?: string;
};

export type AddressQlApiPlaceNameRankingRequest = {
  countryCode: string;
  query: string;
  targetLanguage: string;
  purpose?: "domestic" | "international-shipping";
  hierarchyLevel?: "country" | "admin1" | "admin2" | "admin3" | "locality";
  parentPlaceIds?: string[];
  maxCandidates?: number;
  requestId?: string;
};

export type AddressQlApiPlaceNameKind =
  | "official-native"
  | "official-alias"
  | "official-romanization"
  | "standardized-transliteration"
  | "generated-transliteration"
  | "compatibility-search-alias";

export type AddressQlApiPlaceNameCandidate = {
  placeId: string;
  countryCode: string;
  hierarchyLevel: "country" | "admin1" | "admin2" | "admin3" | "locality";
  parentPlaceIds: string[];
  displayName: string;
  displayLanguage: string;
  displayNameKind: AddressQlApiPlaceNameKind;
  matchedNameKinds: AddressQlApiPlaceNameKind[];
  sourceIds: string[];
  sourceVersions: string[];
  sourceState: "active" | "review-required" | "conformance-only";
  score: number;
  reasonCodes: string[];
  officialAliasPreferred: boolean;
  generatedTransliterationUsed: boolean;
  translationUsed: false;
  automaticUseAllowed: false;
};

export type AddressQlApiPlaceNameRankingResponse = {
  version: "addressql-practical-api-v1";
  requestId?: string;
  ranking: {
    version: "addressql-official-place-name-catalog-v1";
    catalogId: string;
    catalogVersion: string;
    catalogDigest: `sha256:${string}`;
    countryCode: string;
    targetLanguage: string;
    purpose: "domestic" | "international-shipping";
    status: "ranked" | "ambiguous" | "unmatched";
    candidates: AddressQlApiPlaceNameCandidate[];
    requiresReview: boolean;
    issues: string[];
    translationUsed: false;
    automaticUseAllowed: false;
    nonClaims: string[];
  };
  privacy: {
    acceptsPublicPlaceName: true;
    acceptsRawAddress: false;
    storesPlaceName: false;
    logsPlaceName: false;
  };
};

export type AddressQlApiL5CarrierDecision =
  | "reachable"
  | "unreachable"
  | "unknown";

export type AddressQlApiL5CarrierAssertion = {
  version: "addressql-l5-carrier-assertion-v1";
  assertionId: string;
  carrierId: string;
  keyId: string;
  countryCode: string;
  deliveryPointCommitment: `sha256:${string}`;
  serviceLevel: string;
  decision: AddressQlApiL5CarrierDecision;
  sourceVersion: string;
  evidenceDigest: `sha256:${string}`;
  assessedAt: string;
  expiresAt: string;
  signature: string;
};

export type AddressQlApiL5DeliveryPointRequest = {
  version: "addressql-l5-delivery-point-request-v1";
  countryCode: string;
  deliveryPointCommitment: `sha256:${string}`;
  serviceLevel: string;
  assertions: AddressQlApiL5CarrierAssertion[];
};

export type AddressQlApiClientOptions = {
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export class AddressQlApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly response: unknown;

  constructor(status: number, code: string, message: string, response: unknown) {
    super(message);
    this.name = "AddressQlApiError";
    this.status = status;
    this.code = code;
    this.response = response;
  }
}

function validateBaseUrl(value: string): string {
  const parsed = new URL(value);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new TypeError("AddressQL API baseUrl must use HTTP or HTTPS.");
  }
  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString().replace(/\/+$/, "");
}

export class AddressQlApiClient {
  readonly baseUrl: string;
  readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AddressQlApiClientOptions = {}) {
    this.baseUrl = validateBaseUrl(options.baseUrl ?? "http://127.0.0.1:8787");
    this.timeoutMs = options.timeoutMs ?? 5_000;
    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs < 1 || this.timeoutMs > 60_000) {
      throw new TypeError("AddressQL API timeoutMs must be an integer from 1 to 60000.");
    }
    const fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (typeof fetchImpl !== "function") {
      throw new TypeError("AddressQL API client requires a Fetch-compatible implementation.");
    }
    this.fetchImpl = fetchImpl;
  }

  health(): Promise<Record<string, unknown>> {
    return this.request("/v1/health");
  }

  listCountries(): Promise<Record<string, unknown>> {
    return this.request("/v1/countries");
  }

  countryCapabilities(countryCode: string): Promise<Record<string, unknown>> {
    return this.request(`/v1/countries/${encodeURIComponent(countryCode)}/capabilities`);
  }

  listCountryDataPromotions(): Promise<Record<string, unknown>> {
    return this.request("/v1/promotions");
  }

  countryDataPromotion(countryCode: string): Promise<Record<string, unknown>> {
    return this.request(`/v1/countries/${encodeURIComponent(countryCode)}/promotions`);
  }

  listMultilingualQuality(): Promise<Record<string, unknown>> {
    return this.request("/v1/multilingual");
  }

  countryLanguages(countryCode: string): Promise<Record<string, unknown>> {
    return this.request(`/v1/countries/${encodeURIComponent(countryCode)}/languages`);
  }

  assessMultilingual(
    input: AddressQlApiMultilingualAssessmentRequest,
  ): Promise<Record<string, unknown>> {
    return this.request("/v1/multilingual/assess", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  rankPlaceNames(
    input: AddressQlApiPlaceNameRankingRequest,
  ): Promise<AddressQlApiPlaceNameRankingResponse> {
    return this.request<AddressQlApiPlaceNameRankingResponse>("/v1/place-names/rank", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  assessDeliveryPoint(
    input: AddressQlApiL5DeliveryPointRequest,
  ): Promise<Record<string, unknown>> {
    return this.request("/v1/delivery-points/assess", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  validatePostal(input: AddressQlApiPostalValidationRequest): Promise<Record<string, unknown>> {
    return this.request("/v1/postal/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  validatePostalBatch(
    requests: AddressQlApiPostalValidationRequest[],
  ): Promise<Record<string, unknown>> {
    return this.request("/v1/postal/validate/batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requests }),
    });
  }

  private async request<T extends Record<string, unknown> = Record<string, unknown>>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const output = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
      });
      const payload = await output.json() as Record<string, unknown>;
      if (!output.ok) {
        const error = payload.error;
        const code = typeof error === "object" && error !== null && "code" in error
          ? String(error.code)
          : "addressql_api_error";
        const message = typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : `AddressQL API request failed with HTTP ${output.status}.`;
        throw new AddressQlApiError(output.status, code, message, payload);
      }
      return payload as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
