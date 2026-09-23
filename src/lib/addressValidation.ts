import { classifyAddressCoveragePolicy,hasAddressPostalCodeMetadata } from './addressCoveragePolicy';
import { normalizeEnglishAddressPart } from './addressEnglish';
import type { CanonicalAddressParts } from './addressIntelligence';

type AddressFieldRule = {
  key: string;
  label?: string;
  required?: boolean;
};

type LanguageAddressFormat = {
  addressFormat: string;
  fields?: AddressFieldRule[];
};

type OpenAddressFormat = {
  countryCode?: string;
  name?: string;
  native?: LanguageAddressFormat;
  english?: LanguageAddressFormat;
  postalCode?: {
    regex?: string | null;
    source?: string;
    api?: string | null;
    format?: string | null;
  };
  openSourceIds?: string[];
  addressRules?: {
    openSourceIds?: string[];
    postalCode?: {
      label?: string;
      required?: boolean;
      usage?: 'required' | 'recommended' | 'used' | 'partial' | 'optional';
    } | null;
  };
};

export type AddressVerificationQualityMode =
  | 'postal-verified'
  | 'partial-postal'
  | 'geo-verified'
  | 'manual-required'
  | 'no-postal-code';

export type AddressVerificationQuality = {
  mode: AddressVerificationQualityMode;
  label: 'Verified' | 'Partial' | 'Geo Verified' | 'Manual Required' | 'No Postal Code';
  reason: string;
  canAutofill: boolean;
  shouldOverwriteUserInput: boolean;
};

export type AddressValidationResult = {
  status: 'verified' | 'partial';
  score: number;
  postalCodeValid: boolean | null;
  missingRequiredFields: string[];
  warnings: string[];
  checkedWith: string[];
  quality: AddressVerificationQuality;
  displays: {
    native?: string;
    english?: string;
  };
};

type AddressValidationOptions = {
  referenceMatches?: Array<{
    source: string;
    confidence: number;
  }>;
};

const clean = (value: unknown) => String(value ?? '').normalize('NFKC').replace(/[\u3000\s]+/g, ' ').trim();

function maxReferenceConfidence(options: AddressValidationOptions) {
  return Math.max(0, ...(options.referenceMatches || []).map(match => match.confidence));
}

function hasEnoughGeoFields(address: CanonicalAddressParts) {
  const geoDetailKeys: Array<keyof CanonicalAddressParts> = [
    'state',
    'city',
    'district',
    'subdistrict',
    'suburb',
    'road',
    'building',
    'poi',
    'plus_code',
  ];
  return geoDetailKeys.filter(key => clean(address[key])).length >= 2;
}

function statusForQuality(mode: AddressVerificationQualityMode): AddressValidationResult['status'] {
  return mode === 'postal-verified' || mode === 'geo-verified' || mode === 'no-postal-code'
    ? 'verified'
    : 'partial';
}

function classifyAddressQuality({
  address,
  format,
  sources,
  checkedWith,
  postalCodeValid,
  missingRequiredFields,
  options,
}: {
  address: CanonicalAddressParts;
  format?: OpenAddressFormat | null;
  sources: string[];
  checkedWith: string[];
  postalCodeValid: boolean | null;
  missingRequiredFields: string[];
  options: AddressValidationOptions;
}): AddressVerificationQuality {
  const coveragePolicy = classifyAddressCoveragePolicy(format, {
    sources: [...sources, ...checkedWith],
    referenceConfidence: maxReferenceConfidence(options),
  });
  const hasPostalMetadata = hasAddressPostalCodeMetadata(format);
  const hasPostcodeValue = Boolean(clean(address.postcode));
  const hasReliablePostalEvidence = coveragePolicy.id === 'postal-reliable-api';
  const hasStrongGeoEvidence = coveragePolicy.id === 'no-postal-strong-geo';

  if (hasPostalMetadata) {
    if (postalCodeValid === false) {
      return {
        mode: 'partial-postal',
        label: 'Partial',
        reason: 'Postal code format did not match the selected country rules.',
        canAutofill: false,
        shouldOverwriteUserInput: false,
      };
    }

    if (missingRequiredFields.length > 0) {
      return {
        mode: 'partial-postal',
        label: 'Partial',
        reason: `Required address fields are missing: ${missingRequiredFields.join(', ')}.`,
        canAutofill: false,
        shouldOverwriteUserInput: false,
      };
    }

    if (!hasPostcodeValue) {
      return {
        mode: 'partial-postal',
        label: 'Partial',
        reason: 'This country uses postal codes, but no postal code was supplied.',
        canAutofill: false,
        shouldOverwriteUserInput: false,
      };
    }

    if (hasReliablePostalEvidence) {
      return {
        mode: 'postal-verified',
        label: 'Verified',
        reason: coveragePolicy.reason,
        canAutofill: true,
        shouldOverwriteUserInput: false,
      };
    }

    return {
      mode: 'partial-postal',
      label: 'Partial',
      reason: coveragePolicy.reason,
      canAutofill: false,
      shouldOverwriteUserInput: false,
    };
  }

  if (hasStrongGeoEvidence && hasEnoughGeoFields(address) && missingRequiredFields.length === 0) {
    return {
      mode: 'geo-verified',
      label: 'Geo Verified',
      reason: coveragePolicy.reason,
      canAutofill: false,
      shouldOverwriteUserInput: false,
    };
  }

  return {
    mode: 'manual-required',
    label: 'Manual Required',
    reason: coveragePolicy.reason,
    canAutofill: false,
    shouldOverwriteUserInput: false,
  };
}

function valueForField(address: CanonicalAddressParts, field: string) {
  const key =
    field === 'street'
      ? 'road'
      : field === 'houseNumber'
        ? 'house_number'
        : field === 'countryCode'
          ? 'country_code'
          : field;
  return clean(address[key as keyof CanonicalAddressParts]);
}

function templateValues(address: CanonicalAddressParts, english = false) {
  const countryCode = clean(address.country_code).toUpperCase();
  const value = (raw: unknown) => english ? normalizeEnglishAddressPart(raw, countryCode) : clean(raw);

  return {
    country: value(address.country),
    countryCode,
    state: value(address.state),
    city: value(address.city),
    district: value(address.district),
    subdistrict: value(address.subdistrict || address.suburb),
    suburb: value(address.suburb),
    street: value(address.road),
    houseNumber: value(address.house_number),
    organization: value(address.building || address.poi),
    postcode: clean(address.postcode),
  };
}

function renderTemplate(format: string | undefined, address: CanonicalAddressParts, english = false) {
  if (!format) return undefined;
  const values = templateValues(address, english);
  const rendered = format.replace(/{{(\w+)}}/g, (_, key: keyof typeof values) => values[key] || '');
  return rendered
    .split('\n')
    .map(line => line
      .replace(/[ \t]+/g, ' ')
      .replace(/\s+,/g, ',')
      .replace(/^[,，、]\s*/g, '')
      .replace(/,\s*$/g, '')
      .trim()
    )
    .filter(Boolean)
    .join('\n');
}

function requiredMissing(format: OpenAddressFormat | null | undefined, address: CanonicalAddressParts) {
  const fields = format?.native?.fields || [];
  return fields
    .filter(field => field.required)
    .map(field => field.key)
    .filter(key => !valueForField(address, key));
}

function validatePostcode(format: OpenAddressFormat | null | undefined, address: CanonicalAddressParts) {
  const postcode = clean(address.postcode);
  const regex = format?.postalCode?.regex;
  if (!postcode || !regex) return { valid: null, ruleUnavailable: false };
  try {
    return { valid: new RegExp(regex).test(postcode), ruleUnavailable: false };
  } catch {
    return { valid: null, ruleUnavailable: true };
  }
}

export function validateAddressWithOpenSourceRules(
  address: CanonicalAddressParts,
  format?: OpenAddressFormat | null,
  sources: string[] = [],
  options: AddressValidationOptions = {}
): AddressValidationResult {
  const missingRequiredFields = requiredMissing(format, address);
  const postcodeResult = validatePostcode(format, address);
  const postalCodeValid = postcodeResult.valid;
  const warnings: string[] = [];

  if (missingRequiredFields.length) {
    warnings.push(`Missing required fields: ${missingRequiredFields.join(', ')}`);
  }

  if (postalCodeValid === false) {
    warnings.push('Invalid postcode format for the selected country');
  }

  if (postcodeResult.ruleUnavailable) {
    warnings.push('Postal code rule is unavailable for this open-source metadata');
  }

  const checkedWith = Array.from(new Set([
    ...sources.filter(Boolean),
    ...(options.referenceMatches || []).map(match => match.source),
    format?.name,
    format?.postalCode?.source,
    format?.postalCode?.api,
    ...(format?.openSourceIds || []),
    ...(format?.addressRules?.openSourceIds || []),
    'open-address-format-rules',
  ].filter(Boolean) as string[]));

  const filledCoreFields = ['country_code', 'postcode', 'state', 'city', 'road', 'house_number']
    .filter(key => clean(address[key as keyof CanonicalAddressParts])).length;
  const fieldScore = filledCoreFields / 6;
  const penalty = missingRequiredFields.length * 0.18 + (postalCodeValid === false ? 0.2 : 0);
  const referenceBoost = Math.max(0, ...(options.referenceMatches || []).map(match => match.confidence));
  const baseScore = fieldScore - penalty + Math.min(checkedWith.length, 3) * 0.03;
  const score = Math.max(0, Math.min(0.99, Math.round(Math.max(baseScore, referenceBoost) * 100) / 100));
  const quality = classifyAddressQuality({
    address,
    format,
    sources: [
      ...sources.filter(Boolean),
      ...(options.referenceMatches || []).map(match => match.source),
    ],
    checkedWith,
    postalCodeValid,
    missingRequiredFields,
    options,
  });

  if (
    (quality.mode === 'partial-postal' || quality.mode === 'manual-required') &&
    !warnings.includes(quality.reason)
  ) {
    warnings.push(quality.reason);
  }

  return {
    status: statusForQuality(quality.mode),
    score,
    postalCodeValid,
    missingRequiredFields,
    warnings,
    checkedWith,
    quality,
    displays: {
      native: renderTemplate(format?.native?.addressFormat, address),
      english: renderTemplate(format?.english?.addressFormat, address, true),
    },
  };
}
