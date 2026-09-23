import type { CanonicalAddress } from './addressRendering';
import {
buildEnglishShippingAddress,
normalizeEnglishShippingField,
} from './englishShippingAddress';
import { getEnglishAddressCircle,type EnglishAddressCircle } from './languageTabs';

export {
buildEnglishShippingAddress,
EXTENDED_ENGLISH_SHIPPING_COUNTRIES,
getEnglishShippingProfile,
normalizeEnglishShippingField,
} from './englishShippingAddress';
export type {
EnglishShippingAddressResult,
EnglishShippingLayout,
EnglishShippingPostcodePolicy,
EnglishShippingProfile,
EnglishShippingProfileId,
EnglishShippingWarning,
} from './englishShippingAddress';

export type EnglishAddressMode = 'domestic' | 'international-shipping';

export type EnglishAddressModeProfile = {
  countryCode: string;
  circle: EnglishAddressCircle;
  domesticTab: 'en_domestic';
  internationalTab: 'en';
  normalizerId: 'english-address-normalizer-v1';
  buildingNormalizerId: 'english-building-name-normalizer-v1';
  domesticIncludesCountry: false;
  internationalIncludesCountry: true;
};

export function getEnglishAddressModeProfile(countryCode: string): EnglishAddressModeProfile {
  const requestedCountry = countryCode.toUpperCase();
  const country = requestedCountry === 'UK' ? 'GB' : requestedCountry;

  return {
    countryCode: country,
    circle: getEnglishAddressCircle(country),
    domesticTab: 'en_domestic',
    internationalTab: 'en',
    normalizerId: 'english-address-normalizer-v1',
    buildingNormalizerId: 'english-building-name-normalizer-v1',
    domesticIncludesCountry: false,
    internationalIncludesCountry: true,
  };
}

export function normalizeEnglishAddressModeField(input: {
  countryCode: string;
  fieldKey: string;
  text: unknown;
  mode: EnglishAddressMode;
}) {
  const country = input.countryCode.toUpperCase();
  const text = String(input.text ?? '').trim();
  if (!text) return '';

  return normalizeEnglishShippingField({
    countryCode: country,
    fieldKey: input.fieldKey,
    text,
  });
}

export function renderEnglishAddressMode(data: CanonicalAddress, mode: EnglishAddressMode) {
  return buildEnglishShippingAddress(data, mode).formatted;
}
