import type { CanonicalAddress } from './addressRendering';
import { transliterate } from './transliteration';

export type MajorEuropeanShippingCountryCode =
  | 'IT'
  | 'SM'
  | 'VA'
  | 'DE'
  | 'AT'
  | 'CH'
  | 'LI'
  | 'PT'
  | 'RU';

export type MajorEuropeanShippingMode = 'domestic' | 'international-shipping';
export type MajorEuropeanAddressFamily = 'italian' | 'german' | 'swiss' | 'portuguese' | 'russian';

export type MajorEuropeanShippingWarning =
  | 'delivery_point_not_validated'
  | 'postcode_locality_pair_not_verified'
  | 'unsupported_country_profile'
  | 'missing_delivery_line'
  | 'missing_locality'
  | 'missing_postcode'
  | 'invalid_postcode_format'
  | 'administrative_code_unverified'
  | 'transliteration_applied'
  | 'transliteration_incomplete'
  | 'address_line_limit_exceeded'
  | 'line_length_exceeds_profile_limit';

export type MajorEuropeanShippingEvidence = {
  authority: string;
  url: string;
  checkedOn: '2026-07-25';
  scope: 'destination-format-postcode-shape-and-script-policy-only';
};

export type MajorEuropeanShippingProfile = {
  countryCode: MajorEuropeanShippingCountryCode;
  nativeLanguage: 'it' | 'de' | 'pt' | 'ru';
  nativeCountryName: string;
  englishCountryName: string;
  family: MajorEuropeanAddressFamily;
  postcodePattern: string;
  postcodeRequired: true;
  maxDomesticLines: number;
  maxInternationalLines: number;
  maxLineLength: number;
  internationalNamePolicy:
    | 'preserve-official-local-latin-names'
    | 'deterministic-cyrillic-to-latin-transliteration';
  uppercasePreferred: boolean;
  evidence: MajorEuropeanShippingEvidence;
};

export type MajorEuropeanShippingComponentLabels = {
  organization: string;
  streetLine: string;
  secondaryUnit: string;
  deliveryArea: string;
  locality: string;
  administrativeArea: string;
  postcode: string;
  country: string;
};

export type MajorEuropeanShippingAddressResult = {
  mode: MajorEuropeanShippingMode;
  outputLanguage: 'it' | 'de' | 'pt' | 'ru' | 'en';
  profile: MajorEuropeanShippingProfile | null;
  componentLabels: MajorEuropeanShippingComponentLabels;
  normalized: CanonicalAddress;
  lines: string[];
  formatted: string;
  changedFields: Array<keyof CanonicalAddress>;
  translatedFields: Array<keyof CanonicalAddress>;
  preservedDeliveryFields: Array<
    'building' | 'road' | 'house_number' | 'subdistrict' | 'district' | 'city' | 'state'
  >;
  appliedRules: string[];
  warnings: MajorEuropeanShippingWarning[];
  formatStatus: 'format-ready' | 'needs-review';
  deliveryPointValidated: false;
  evidence: MajorEuropeanShippingEvidence | null;
};

const POSTE_ITALIANE_EVIDENCE =
  'https://www.poste.it/standard-di-confezionamento/';
const DEUTSCHE_POST_EVIDENCE =
  'https://www.deutschepost.de/de/b/briefumschlag-richtig-beschriften.html';
const AUSTRIAN_POST_EVIDENCE =
  'https://www.post.at/g/c/adresscheck';
const SWISS_POST_EVIDENCE =
  'https://www.post.ch/de/briefe-versenden/adressieren-und-gestalten/sendungen-richtig-adressieren';
const CTT_EVIDENCE =
  'https://www.ctt.pt/particulares/enviar/regras-cuidados-envios/enderecar-objetos-postais';
const RUSSIAN_POST_EVIDENCE =
  'https://info.pochta.ru/support/post-rules/write-address';

const evidence = (
  authority: string,
  url: string,
): MajorEuropeanShippingEvidence => ({
  authority,
  url,
  checkedOn: '2026-07-25',
  scope: 'destination-format-postcode-shape-and-script-policy-only',
});

const profile = (
  countryCode: MajorEuropeanShippingCountryCode,
  nativeLanguage: MajorEuropeanShippingProfile['nativeLanguage'],
  nativeCountryName: string,
  englishCountryName: string,
  family: MajorEuropeanAddressFamily,
  postcodePattern: string,
  options: {
    maxDomesticLines?: number;
    maxInternationalLines?: number;
    maxLineLength?: number;
    internationalNamePolicy?: MajorEuropeanShippingProfile['internationalNamePolicy'];
    uppercasePreferred?: boolean;
    evidence: MajorEuropeanShippingEvidence;
  },
): MajorEuropeanShippingProfile => ({
  countryCode,
  nativeLanguage,
  nativeCountryName,
  englishCountryName,
  family,
  postcodePattern,
  postcodeRequired: true,
  maxDomesticLines: options.maxDomesticLines ?? 6,
  maxInternationalLines: options.maxInternationalLines ?? 7,
  maxLineLength: options.maxLineLength ?? 40,
  internationalNamePolicy:
    options.internationalNamePolicy ?? 'preserve-official-local-latin-names',
  uppercasePreferred: options.uppercasePreferred ?? false,
  evidence: options.evidence,
});

const MAJOR_EUROPEAN_SHIPPING_PROFILES: Record<
  MajorEuropeanShippingCountryCode,
  MajorEuropeanShippingProfile
> = {
  IT: profile('IT', 'it', 'Italia', 'Italy', 'italian', '^\\d{5}$', {
    maxDomesticLines: 5,
    maxInternationalLines: 6,
    uppercasePreferred: true,
    evidence: evidence('Poste Italiane', POSTE_ITALIANE_EVIDENCE),
  }),
  SM: profile('SM', 'it', 'San Marino', 'San Marino', 'italian', '^4789\\d$', {
    maxDomesticLines: 5,
    maxInternationalLines: 6,
    uppercasePreferred: true,
    evidence: evidence('Poste Italiane and UPU destination profile', POSTE_ITALIANE_EVIDENCE),
  }),
  VA: profile('VA', 'it', 'Città del Vaticano', 'Vatican City', 'italian', '^00120$', {
    maxDomesticLines: 5,
    maxInternationalLines: 6,
    uppercasePreferred: true,
    evidence: evidence('Poste Italiane and UPU destination profile', POSTE_ITALIANE_EVIDENCE),
  }),
  DE: profile('DE', 'de', 'Deutschland', 'Germany', 'german', '^\\d{5}$', {
    evidence: evidence('Deutsche Post', DEUTSCHE_POST_EVIDENCE),
  }),
  AT: profile('AT', 'de', 'Österreich', 'Austria', 'german', '^\\d{4}$', {
    evidence: evidence('Österreichische Post', AUSTRIAN_POST_EVIDENCE),
  }),
  CH: profile('CH', 'de', 'Schweiz', 'Switzerland', 'swiss', '^\\d{4}$', {
    maxDomesticLines: 6,
    maxInternationalLines: 7,
    evidence: evidence('Post CH', SWISS_POST_EVIDENCE),
  }),
  LI: profile('LI', 'de', 'Liechtenstein', 'Liechtenstein', 'swiss', '^94\\d{2}$', {
    maxDomesticLines: 6,
    maxInternationalLines: 7,
    evidence: evidence('Post CH and Liechtensteinische Post', SWISS_POST_EVIDENCE),
  }),
  PT: profile('PT', 'pt', 'Portugal', 'Portugal', 'portuguese', '^\\d{4}-\\d{3}$', {
    maxDomesticLines: 6,
    maxInternationalLines: 7,
    uppercasePreferred: true,
    evidence: evidence('CTT Correios de Portugal', CTT_EVIDENCE),
  }),
  RU: profile('RU', 'ru', 'Российская Федерация', 'Russian Federation', 'russian', '^\\d{6}$', {
    maxDomesticLines: 7,
    maxInternationalLines: 7,
    internationalNamePolicy: 'deterministic-cyrillic-to-latin-transliteration',
    evidence: evidence('Почта России', RUSSIAN_POST_EVIDENCE),
  }),
};

export const MAJOR_EUROPEAN_SHIPPING_COUNTRY_CODES = Object.freeze(
  Object.keys(MAJOR_EUROPEAN_SHIPPING_PROFILES) as MajorEuropeanShippingCountryCode[],
);

function clean(value: unknown) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

function profileCountryCode(countryCode: string): MajorEuropeanShippingCountryCode | '' {
  const code = clean(countryCode).toUpperCase().replace(/-/g, '_');
  if (code === 'PT_AZO' || code === 'PT_MAD') return 'PT';
  return MAJOR_EUROPEAN_SHIPPING_COUNTRY_CODES.includes(code as MajorEuropeanShippingCountryCode)
    ? code as MajorEuropeanShippingCountryCode
    : '';
}

export function isMajorEuropeanShippingCountry(countryCode: string) {
  return Boolean(profileCountryCode(countryCode));
}

export function getMajorEuropeanShippingProfile(countryCode: string) {
  const code = profileCountryCode(countryCode);
  return code ? MAJOR_EUROPEAN_SHIPPING_PROFILES[code] : null;
}

function normalizePostcode(value: unknown, shippingProfile: MajorEuropeanShippingProfile | null) {
  const source = clean(value).toUpperCase();
  if (!source || !shippingProfile) return source;

  if (shippingProfile.countryCode === 'PT') {
    const compact = source.replace(/[^\d]/g, '');
    if (compact.length === 7) return `${compact.slice(0, 4)}-${compact.slice(4)}`;
    return source;
  }
  return source.replace(/\s+/g, '');
}

function containsCyrillic(value: string) {
  return /[\u0400-\u052f]/u.test(value);
}

function romanizeRussian(value: string) {
  return transliterate(clean(value), 'ru')
    .replace(/[’`]/g, "'")
    .replace(/'(?=\s|$|[.,])/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCountryName(
  shippingProfile: MajorEuropeanShippingProfile,
  mode: MajorEuropeanShippingMode,
) {
  return mode === 'international-shipping'
    ? shippingProfile.englishCountryName
    : shippingProfile.nativeCountryName;
}

export function normalizeMajorEuropeanShippingField(input: {
  countryCode: string;
  fieldKey: string;
  text: unknown;
  mode: MajorEuropeanShippingMode;
}) {
  const shippingProfile = getMajorEuropeanShippingProfile(input.countryCode);
  const fieldKey = clean(input.fieldKey).toLowerCase();
  const text = clean(input.text);
  if (!text) return '';

  if (fieldKey === 'country_code') {
    return shippingProfile?.countryCode || clean(input.countryCode).toUpperCase();
  }
  if (fieldKey === 'postcode' || fieldKey === 'postal_code' || fieldKey === 'zip') {
    return normalizePostcode(text, shippingProfile);
  }
  if (fieldKey === 'country' && shippingProfile) {
    return normalizeCountryName(shippingProfile, input.mode);
  }
  if (
    shippingProfile?.family === 'russian' &&
    input.mode === 'international-shipping' &&
    fieldKey !== 'house_number'
  ) {
    return romanizeRussian(text);
  }

  // Destination-country road, building, and locality names are routing keys.
  // Latin-script names are intentionally preserved instead of translated to exonyms.
  return text;
}

const LABELS: Record<string, MajorEuropeanShippingComponentLabels> = {
  en: {
    organization: 'Organization',
    streetLine: 'Street and house number',
    secondaryUnit: 'Unit, floor, or building',
    deliveryArea: 'Neighborhood or delivery area',
    locality: 'City or postal locality',
    administrativeArea: 'Province, state, region, or district',
    postcode: 'Postal code',
    country: 'Country',
  },
  it: {
    organization: 'Organizzazione',
    streetLine: 'Via e numero civico',
    secondaryUnit: 'Scala, piano, interno o edificio',
    deliveryArea: 'Frazione o località',
    locality: 'Comune o località',
    administrativeArea: 'Provincia',
    postcode: 'CAP',
    country: 'Paese',
  },
  de: {
    organization: 'Organisation',
    streetLine: 'Straße und Hausnummer',
    secondaryUnit: 'Wohnung, Etage oder Gebäude',
    deliveryArea: 'Ortsteil oder Zustellgebiet',
    locality: 'Ort',
    administrativeArea: 'Bundesland, Kanton oder Bezirk',
    postcode: 'Postleitzahl',
    country: 'Land',
  },
  pt: {
    organization: 'Organização',
    streetLine: 'Arruamento e porta',
    secondaryUnit: 'Alojamento, piso ou edifício',
    deliveryArea: 'Bairro, sítio ou localidade',
    locality: 'Localidade postal',
    administrativeArea: 'Distrito ou região',
    postcode: 'Código postal',
    country: 'País',
  },
  ru: {
    organization: 'Организация',
    streetLine: 'Улица и номер дома',
    secondaryUnit: 'Квартира, офис или строение',
    deliveryArea: 'Район или населенный пункт',
    locality: 'Город или населенный пункт',
    administrativeArea: 'Область, край или республика',
    postcode: 'Почтовый индекс',
    country: 'Страна',
  },
};

function normalizedLanguage(
  shippingProfile: MajorEuropeanShippingProfile | null,
  mode: MajorEuropeanShippingMode,
  domesticLanguage?: string,
): MajorEuropeanShippingAddressResult['outputLanguage'] {
  if (mode === 'international-shipping') return 'en';
  const requested = clean(domesticLanguage).toLowerCase().split(/[-_]/)[0];
  if (requested === 'it' || requested === 'de' || requested === 'pt' || requested === 'ru') {
    return requested;
  }
  return shippingProfile?.nativeLanguage || 'en';
}

export function getMajorEuropeanShippingComponentLabels(
  countryCode: string,
  mode: MajorEuropeanShippingMode,
  domesticLanguage?: string,
) {
  const language = normalizedLanguage(
    getMajorEuropeanShippingProfile(countryCode),
    mode,
    domesticLanguage,
  );
  return LABELS[language] || LABELS.en;
}

function comparable(value: string) {
  return clean(value)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function uniqueLines(lines: string[]) {
  const seen = new Set<string>();
  return lines
    .map(clean)
    .filter(Boolean)
    .filter(line => {
      const key = comparable(line);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeCanonical(
  data: CanonicalAddress,
  shippingProfile: MajorEuropeanShippingProfile,
  mode: MajorEuropeanShippingMode,
) {
  const normalized = {} as CanonicalAddress;
  for (const key of Object.keys(data) as Array<keyof CanonicalAddress>) {
    normalized[key] = normalizeMajorEuropeanShippingField({
      countryCode: shippingProfile.countryCode,
      fieldKey: key,
      text: data[key],
      mode,
    }) as never;
  }
  normalized.country_code = shippingProfile.countryCode;
  normalized.country = normalizeCountryName(shippingProfile, mode);
  normalized.postcode = normalizePostcode(data.postcode, shippingProfile);

  const changedFields = (Object.keys(normalized) as Array<keyof CanonicalAddress>).filter(
    key => clean(data[key]) !== clean(normalized[key]),
  );
  const translatedFields = changedFields.filter(
    key => key !== 'country_code' && key !== 'postcode',
  );
  return { normalized, changedFields, translatedFields };
}

function streetLine(
  data: CanonicalAddress,
  shippingProfile: MajorEuropeanShippingProfile,
  mode: MajorEuropeanShippingMode,
) {
  const road = clean(data.road);
  const houseNumber = clean(data.house_number);
  if (!road) return houseNumber;
  if (!houseNumber) return road;

  if (shippingProfile.family === 'russian') {
    if (/^(?:д\.?|дом|d\.?)\s*/iu.test(houseNumber)) return `${road}, ${houseNumber}`;
    return `${road}, ${mode === 'domestic' ? 'д.' : 'd.'} ${houseNumber}`;
  }
  return `${road} ${houseNumber}`;
}

function italianProvinceCode(data: CanonicalAddress) {
  const candidate = clean(data.state || data.district).toUpperCase();
  return /^[A-Z]{2}$/.test(candidate) ? candidate : '';
}

function renderItalianLines(
  data: CanonicalAddress,
  shippingProfile: MajorEuropeanShippingProfile,
  mode: MajorEuropeanShippingMode,
) {
  const provinceCode = italianProvinceCode(data);
  const administrativeName = !provinceCode ? clean(data.state || data.district) : '';
  return uniqueLines([
    data.building || data.poi,
    data.subdistrict || data.suburb,
    streetLine(data, shippingProfile, mode),
    administrativeName,
    [data.postcode, data.city, provinceCode].filter(Boolean).join(' '),
  ]);
}

function renderGermanicLines(
  data: CanonicalAddress,
  shippingProfile: MajorEuropeanShippingProfile,
  mode: MajorEuropeanShippingMode,
) {
  return uniqueLines([
    data.building || data.poi,
    data.subdistrict || data.suburb || data.district,
    streetLine(data, shippingProfile, mode),
    [data.postcode, data.city].filter(Boolean).join(' '),
  ]);
}

function renderPortugueseLines(
  data: CanonicalAddress,
  shippingProfile: MajorEuropeanShippingProfile,
  mode: MajorEuropeanShippingMode,
) {
  return uniqueLines([
    data.building || data.poi,
    streetLine(data, shippingProfile, mode),
    data.subdistrict || data.suburb || data.district,
    [data.postcode, data.city].filter(Boolean).join(' '),
  ]);
}

function renderRussianLines(
  data: CanonicalAddress,
  shippingProfile: MajorEuropeanShippingProfile,
  mode: MajorEuropeanShippingMode,
) {
  const administrativeLine = [data.district, data.state].filter(Boolean).join(', ');
  if (mode === 'domestic') {
    return uniqueLines([
      data.building || data.poi,
      streetLine(data, shippingProfile, mode),
      data.subdistrict || data.suburb,
      data.city,
      administrativeLine,
      shippingProfile.nativeCountryName,
      data.postcode,
    ]);
  }
  return uniqueLines([
    data.building || data.poi,
    streetLine(data, shippingProfile, mode),
    data.subdistrict || data.suburb,
    data.city,
    administrativeLine,
    data.postcode,
  ]);
}

function renderDomesticLines(
  data: CanonicalAddress,
  shippingProfile: MajorEuropeanShippingProfile,
  mode: MajorEuropeanShippingMode,
) {
  if (shippingProfile.family === 'italian') {
    return renderItalianLines(data, shippingProfile, mode);
  }
  if (shippingProfile.family === 'portuguese') {
    return renderPortugueseLines(data, shippingProfile, mode);
  }
  if (shippingProfile.family === 'russian') {
    return renderRussianLines(data, shippingProfile, mode);
  }
  return renderGermanicLines(data, shippingProfile, mode);
}

function unsupportedResult(
  data: CanonicalAddress,
  mode: MajorEuropeanShippingMode,
): MajorEuropeanShippingAddressResult {
  const lines = uniqueLines([
    data.building || data.poi,
    [data.road, data.house_number].filter(Boolean).join(' '),
    data.subdistrict || data.suburb,
    data.district,
    [data.postcode, data.city].filter(Boolean).join(' '),
    data.state,
    mode === 'international-shipping' ? clean(data.country).toUpperCase() : '',
  ]);
  return {
    mode,
    outputLanguage: mode === 'international-shipping' ? 'en' : 'en',
    profile: null,
    componentLabels: LABELS.en,
    normalized: { ...data },
    lines,
    formatted: lines.join('\n'),
    changedFields: [],
    translatedFields: [],
    preservedDeliveryFields: [
      'building',
      'road',
      'house_number',
      'subdistrict',
      'district',
      'city',
      'state',
    ],
    appliedRules: ['conservative-major-european-address-fallback'],
    warnings: [
      'delivery_point_not_validated',
      'postcode_locality_pair_not_verified',
      'unsupported_country_profile',
    ],
    formatStatus: 'needs-review',
    deliveryPointValidated: false,
    evidence: null,
  };
}

export function buildMajorEuropeanShippingAddress(
  data: CanonicalAddress,
  mode: MajorEuropeanShippingMode,
  options: { domesticLanguage?: string } = {},
): MajorEuropeanShippingAddressResult {
  const shippingProfile = getMajorEuropeanShippingProfile(data.country_code);
  if (!shippingProfile) return unsupportedResult(data, mode);

  const { normalized, changedFields, translatedFields } = normalizeCanonical(
    data,
    shippingProfile,
    mode,
  );
  const domesticLines = renderDomesticLines(normalized, shippingProfile, mode);
  const lines = mode === 'international-shipping'
    ? uniqueLines([...domesticLines, shippingProfile.englishCountryName.toUpperCase()])
    : domesticLines;
  const warnings: MajorEuropeanShippingWarning[] = [
    'delivery_point_not_validated',
    'postcode_locality_pair_not_verified',
  ];

  if (!normalized.road && !/^(?:POSTFACH|CASELLA POSTALE|APARTADO|А\/Я)\b/iu.test(normalized.building)) {
    warnings.push('missing_delivery_line');
  }
  if (!normalized.city && !normalized.subdistrict && !normalized.district) {
    warnings.push('missing_locality');
  }
  if (!normalized.postcode) {
    warnings.push('missing_postcode');
  } else if (!new RegExp(shippingProfile.postcodePattern).test(normalized.postcode)) {
    warnings.push('invalid_postcode_format');
  }
  if (
    shippingProfile.family === 'italian' &&
    (normalized.state || normalized.district) &&
    !italianProvinceCode(normalized)
  ) {
    warnings.push('administrative_code_unverified');
  }
  if (
    mode === 'international-shipping' &&
    shippingProfile.internationalNamePolicy ===
      'deterministic-cyrillic-to-latin-transliteration' &&
    (Object.values(data).some(value => containsCyrillic(clean(value))))
  ) {
    warnings.push('transliteration_applied');
  }
  if (
    mode === 'international-shipping' &&
    lines.some(containsCyrillic)
  ) {
    warnings.push('transliteration_incomplete');
  }

  const lineLimit = mode === 'international-shipping'
    ? shippingProfile.maxInternationalLines
    : shippingProfile.maxDomesticLines;
  if (lines.length > lineLimit) warnings.push('address_line_limit_exceeded');
  if (lines.some(line => line.length > shippingProfile.maxLineLength)) {
    warnings.push('line_length_exceeds_profile_limit');
  }

  const informationalWarnings = new Set<MajorEuropeanShippingWarning>([
    'delivery_point_not_validated',
    'postcode_locality_pair_not_verified',
    'transliteration_applied',
  ]);
  const formatStatus = warnings.some(warning => !informationalWarnings.has(warning))
    ? 'needs-review'
    : 'format-ready';
  const outputLanguage = normalizedLanguage(shippingProfile, mode, options.domesticLanguage);

  return {
    mode,
    outputLanguage,
    profile: shippingProfile,
    componentLabels: LABELS[outputLanguage] || LABELS.en,
    normalized,
    lines,
    formatted: lines.join('\n'),
    changedFields,
    translatedFields,
    preservedDeliveryFields: [
      'building',
      'road',
      'house_number',
      'subdistrict',
      'district',
      'city',
      'state',
    ],
    appliedRules: [
      `${shippingProfile.countryCode.toLowerCase()}-${shippingProfile.family}-postal-presentation-v1`,
      shippingProfile.internationalNamePolicy,
      'preserve-destination-country-delivery-keys',
      'normalize-country-specific-postcode-shape',
      'omit-country-for-latin-script-domestic-mail',
      'append-english-uppercase-country-for-international-mail',
      'never-claim-postcode-locality-or-delivery-point-validation-from-formatting',
    ],
    warnings,
    formatStatus,
    deliveryPointValidated: false,
    evidence: shippingProfile.evidence,
  };
}
