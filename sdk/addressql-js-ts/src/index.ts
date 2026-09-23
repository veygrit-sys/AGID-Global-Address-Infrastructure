export type PostalStatus = "official" | "weak" | "none" | "carrier_specific" | "unknown";
export * from "./api-client";
export type AddressFormatCoverage =
  | "native_and_english_preloaded"
  | "native_only_preloaded"
  | "english_only_preloaded"
  | "seed_profile_required";
export type ValidationReadiness =
  | "format_only"
  | "metadata_gated"
  | "postal_equivalent_required"
  | "delivery_source_required"
  | "manual_review_required"
  | "unknown";

export type CountryProfile = {
  countryCode: string;
  countryName: string;
  nativeName?: string;
  aliases: string[];
  languages: string[];
  addressFormatCoverage: AddressFormatCoverage;
  validationReadiness: ValidationReadiness;
  postalStatus: PostalStatus;
  postalRequiredDefault: boolean;
  postalExample?: string;
  postalEquivalentStrategy: string;
  nativeInputAvailable: boolean;
  englishInputAvailable: boolean;
  requiredComponents: string[];
  sourceVersion: string;
};

export type CountryResolution = {
  input: string;
  countryCode: string;
  confidence: number;
  sourceVersion: string;
  warnings: string[];
  nonClaims: string[];
};

export type PostalValidation = {
  valid: boolean;
  formatValid: boolean;
  exists: boolean | null;
  validationScope: "format_only" | "policy_only" | "postal_equivalent_required" | "country_profile_missing";
  postalCode: string;
  country: string;
  regionHint?: string;
  sourceVersion: string;
  warnings: string[];
  nonClaims: string[];
};

export type PostalEquivalent = {
  regionRef: string;
  country: string;
  confidence: number;
  sourceVersion: string;
  nonClaims: string[];
};

export type NormalizedAddress = {
  normalizedText: string;
  country: string;
  locale: string;
  sourceVersion: string;
  warnings: string[];
  nonClaims: string[];
};

export type AddressMatchDecision = {
  match: boolean;
  confidence: number;
  purpose: string;
  sourceVersion: string;
  nonClaims: string[];
};

export type DistanceEstimate = {
  distanceKm: number | null;
  metric: "haversine";
  confidence: number;
  sourceVersion: string;
  warnings: string[];
  nonClaims: string[];
};

export type DeliveryAvailability = {
  available: boolean;
  carrier: string;
  serviceLevel: string;
  reasons: string[];
  sourceVersion: string;
  nonClaims: string[];
};

const SOURCE_VERSION = "synthetic-addressql-sdk-v0.4";

const COUNTRY_PROFILES: CountryProfile[] = [
  {
    countryCode: "JP",
    countryName: "Japan",
    nativeName: "日本",
    aliases: ["Nippon", "Nihon", "日本国"],
    languages: ["ja", "en"],
    addressFormatCoverage: "native_and_english_preloaded",
    validationReadiness: "format_only",
    postalStatus: "official",
    postalRequiredDefault: true,
    postalExample: "100-0001",
    postalEquivalentStrategy: "official_postal_code",
    nativeInputAvailable: true,
    englishInputAvailable: true,
    requiredComponents: ["postcode", "state", "city"],
    sourceVersion: SOURCE_VERSION,
  },
  {
    countryCode: "US",
    countryName: "United States",
    nativeName: "United States",
    aliases: ["USA", "United States of America"],
    languages: ["en", "es"],
    addressFormatCoverage: "native_and_english_preloaded",
    validationReadiness: "format_only",
    postalStatus: "official",
    postalRequiredDefault: true,
    postalExample: "94105",
    postalEquivalentStrategy: "official_postal_code",
    nativeInputAvailable: true,
    englishInputAvailable: true,
    requiredComponents: ["postcode", "state", "city"],
    sourceVersion: SOURCE_VERSION,
  },
  {
    countryCode: "HK",
    countryName: "Hong Kong",
    nativeName: "香港",
    aliases: ["Hong Kong SAR", "香港特別行政区"],
    languages: ["zh-Hant", "en"],
    addressFormatCoverage: "native_and_english_preloaded",
    validationReadiness: "postal_equivalent_required",
    postalStatus: "none",
    postalRequiredDefault: false,
    postalEquivalentStrategy: "agid_region_postal_equivalent",
    nativeInputAvailable: true,
    englishInputAvailable: true,
    requiredComponents: ["district", "street", "building"],
    sourceVersion: SOURCE_VERSION,
  },
  {
    countryCode: "AE",
    countryName: "United Arab Emirates",
    nativeName: "الإمارات العربية المتحدة",
    aliases: ["UAE"],
    languages: ["ar", "en"],
    addressFormatCoverage: "native_and_english_preloaded",
    validationReadiness: "postal_equivalent_required",
    postalStatus: "none",
    postalRequiredDefault: false,
    postalEquivalentStrategy: "agid_region_postal_equivalent",
    nativeInputAvailable: true,
    englishInputAvailable: true,
    requiredComponents: ["emirate", "area", "street"],
    sourceVersion: SOURCE_VERSION,
  },
  {
    countryCode: "GH",
    countryName: "Ghana",
    nativeName: "Ghana",
    aliases: [],
    languages: ["en"],
    addressFormatCoverage: "english_only_preloaded",
    validationReadiness: "metadata_gated",
    postalStatus: "weak",
    postalRequiredDefault: false,
    postalEquivalentStrategy: "digital_address_or_agid_region",
    nativeInputAvailable: true,
    englishInputAvailable: true,
    requiredComponents: ["region", "locality"],
    sourceVersion: SOURCE_VERSION,
  },
];

export function cleanText(input: unknown): string {
  return typeof input === "string" ? input.trim().replace(/\s+/g, " ") : "";
}

const ADDRESS_TOKEN_ALIASES: Readonly<Record<string, string>> = {
  avenue: "avenue",
  ave: "avenue",
  boulevard: "boulevard",
  blvd: "boulevard",
  road: "road",
  rd: "road",
  street: "street",
  st: "street",
  strasse: "street",
  straße: "street",
};

function normalizeAddressMatchText(input: unknown): string {
  const normalized = cleanText(input)
    .normalize("NFKC")
    .toLocaleLowerCase("und")
    .replace(/[\p{P}\p{S}]+/gu, " ");
  return cleanText(normalized)
    .split(" ")
    .filter(Boolean)
    .map(token => ADDRESS_TOKEN_ALIASES[token] ?? token)
    .join(" ");
}

function editDistance(left: string, right: string): number {
  if (!left) return right.length;
  if (!right) return left.length;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitution = previous[rightIndex - 1]
        + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1);
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        substitution,
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length];
}

function addressSimilarity(left: string, right: string): number {
  if (!left || !right) return 0;
  if (left === right) return 1;

  const leftTokens = new Set(left.split(" "));
  const rightTokens = new Set(right.split(" "));
  const sharedTokens = [...leftTokens].filter(token => rightTokens.has(token)).length;
  const tokenDice = (2 * sharedTokens) / (leftTokens.size + rightTokens.size);
  const maxLength = Math.max(left.length, right.length);
  const characterSimilarity = maxLength
    ? 1 - editDistance(left, right) / maxLength
    : 1;

  return Math.max(0, Math.min(1, tokenDice * 0.4 + characterSimilarity * 0.6));
}

export function normalizeCountry(input: unknown): string {
  return cleanText(input).toUpperCase();
}

export function countryAddressProfile(countryCode: unknown): CountryProfile | null {
  const country = normalizeCountry(countryCode);
  return COUNTRY_PROFILES.find(profile => profile.countryCode === country) ?? null;
}

export function countryResolve(countryInput: unknown): CountryResolution {
  const input = cleanText(countryInput);
  const lower = input.toLowerCase();
  const profile = COUNTRY_PROFILES.find(item =>
    item.countryCode.toLowerCase() === lower
    || item.countryName.toLowerCase() === lower
    || item.nativeName?.toLowerCase() === lower
    || item.aliases.some(alias => alias.toLowerCase() === lower)
  );

  return {
    input,
    countryCode: profile?.countryCode ?? normalizeCountry(input),
    confidence: profile ? 1 : 0.2,
    sourceVersion: SOURCE_VERSION,
    warnings: profile ? [] : ["country_not_found_in_source_version"],
    nonClaims: ["Country resolution is not sovereignty adjudication."],
  };
}

export function postalStatus(countryCode: unknown): PostalStatus {
  return countryAddressProfile(countryCode)?.postalStatus ?? "unknown";
}

export function countryValidationReadiness(countryCode: unknown): ValidationReadiness {
  return countryAddressProfile(countryCode)?.validationReadiness ?? "unknown";
}

export function postalNormalize(postalCode: unknown, countryCode: unknown): string {
  const country = normalizeCountry(countryCode);
  let postal = cleanText(postalCode).toUpperCase();
  if (country === "JP") {
    const digits = postal.replace(/\D/g, "");
    if (digits.length === 7) postal = `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return postal;
}

export function postalValidate(postalCode: unknown, countryCode: unknown): PostalValidation {
  const country = normalizeCountry(countryCode);
  const profile = countryAddressProfile(country);
  const postal = postalNormalize(postalCode, country);
  const warnings: string[] = [];
  const formatValid = postalFormatValidate(postal, country);
  const exists = postalExists(postal, country);
  const validationScope = !profile
    ? "country_profile_missing"
    : profile.postalStatus === "none"
      ? "postal_equivalent_required"
      : profile.postalRequiredDefault
        ? "format_only"
        : "policy_only";
  let valid = false;

  if (!profile) {
    warnings.push("country_profile_missing");
  } else if (profile.postalStatus === "none" && !postal) {
    valid = true;
  } else if (!postal) {
    valid = !profile.postalRequiredDefault;
    if (!valid) warnings.push("postal_required_but_missing");
  } else if (profile.postalStatus === "none") {
    valid = false;
    warnings.push("country_has_no_postal_code_system", "postal_equivalent_required");
  } else if (!formatValid) {
    valid = false;
  } else {
    valid = true;
  }

  if (postal && formatValid && profile?.postalStatus !== "none") {
    warnings.push("postal_existence_evidence_required");
  }

  return {
    valid,
    formatValid,
    exists,
    validationScope,
    postalCode: postal,
    country,
    sourceVersion: SOURCE_VERSION,
    warnings,
    nonClaims: profile?.postalStatus === "none"
      ? ["Do not invent an official postal code for a no-postal-code country."]
      : ["Postal validity is not full address identity."],
  };
}

export function postalFormatValidate(postalCode: unknown, countryCode: unknown): boolean {
  const country = normalizeCountry(countryCode);
  const profile = countryAddressProfile(country);
  const postal = postalNormalize(postalCode, country);

  if (!profile) return false;
  if (profile.postalStatus === "none") return postal.length === 0;
  if (!postal) return !profile.postalRequiredDefault;
  if (country === "JP") return /^\d{3}-\d{4}$/.test(postal);
  if (country === "US") return /^\d{5}(-\d{4})?$/.test(postal);
  if (country === "GH") return /^[A-Z]{2}-\d{3,4}-\d{4}$/.test(postal);
  return true;
}

export function postalExists(postalCode: unknown, countryCode: unknown): boolean | null {
  void postalCode;
  void countryCode;
  return null;
}

export function postalEquivalent(regionRef: unknown, countryCode: unknown): PostalEquivalent {
  const country = normalizeCountry(countryCode);
  const region = cleanText(regionRef) || `agid-country-${country.toLowerCase()}-postal-equivalent`;
  return {
    regionRef: region,
    country,
    confidence: 0.6,
    sourceVersion: SOURCE_VERSION,
    nonClaims: ["Postal-equivalent regions are fallback operational regions, not official postal codes."],
  };
}

export function normalizeAddress(addressText: unknown, countryCode: unknown): NormalizedAddress {
  const normalizedText = cleanText(addressText).normalize("NFKC");
  return {
    normalizedText,
    country: normalizeCountry(countryCode),
    locale: "und",
    sourceVersion: SOURCE_VERSION,
    warnings: normalizedText ? [] : ["address_text_empty"],
    nonClaims: ["Normalization is not referent resolution."],
  };
}

export function addressMatch(addressA: NormalizedAddress, addressB: NormalizedAddress, purpose = "delivery"): AddressMatchDecision {
  const sameCountry = !addressA.country || !addressB.country || addressA.country === addressB.country;
  const left = normalizeAddressMatchText(addressA.normalizedText);
  const right = normalizeAddressMatchText(addressB.normalizedText);
  const similarity = sameCountry
    ? addressSimilarity(left, right)
    : 0;
  const match = Boolean(left && right && similarity >= 0.84);
  return {
    match,
    confidence: Number(similarity.toFixed(4)),
    purpose: cleanText(purpose),
    sourceVersion: SOURCE_VERSION,
    nonClaims: [
      "A match decision is purpose-relative and not proof of residence.",
      "Fuzzy lexical similarity is not delivery-point identity.",
    ],
  };
}

export function addressDistanceKm(latA: number, lonA: number, latB: number, lonB: number): DistanceEstimate {
  if (![latA, lonA, latB, lonB].every(Number.isFinite) || Math.abs(latA) > 90 || Math.abs(latB) > 90 || Math.abs(lonA) > 180 || Math.abs(lonB) > 180) {
    return {
      distanceKm: null,
      metric: "haversine",
      confidence: 0,
      sourceVersion: SOURCE_VERSION,
      warnings: ["invalid_coordinates"],
      nonClaims: ["Distance is metric-dependent and not route availability."],
    };
  }
  const toRad = (value: number) => value * Math.PI / 180;
  const dLat = toRad(latB - latA);
  const dLon = toRad(lonB - lonA);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(latA)) * Math.cos(toRad(latB)) * Math.sin(dLon / 2) ** 2;
  return {
    distanceKm: 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(h))),
    metric: "haversine",
    confidence: 0.75,
    sourceVersion: SOURCE_VERSION,
    warnings: [],
    nonClaims: ["Distance is metric-dependent and not route availability."],
  };
}

export function deliveryAvailable(countryCode: unknown, postalCode: unknown, carrier = "synthetic_carrier", serviceLevel = "standard"): DeliveryAvailability {
  const country = normalizeCountry(countryCode);
  const profile = countryAddressProfile(country);
  const validation = postalValidate(postalCode, country);
  const reasons: string[] = [];
  let available = false;

  if (!profile) {
    reasons.push("country_profile_missing");
  }
  if (profile?.postalRequiredDefault && !validation.valid) {
    reasons.push("postal_required_but_invalid_or_missing");
  }
  reasons.push("approved_delivery_source_required");

  return {
    available,
    carrier: cleanText(carrier),
    serviceLevel: cleanText(serviceLevel),
    reasons,
    sourceVersion: SOURCE_VERSION,
    nonClaims: ["Deliverability is not proof of residence or identity."],
  };
}
