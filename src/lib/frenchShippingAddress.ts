import type { CanonicalAddress } from './addressRendering';

export type FrenchShippingMode = 'domestic' | 'international-shipping';

export type FrenchAddressFamily =
  | 'france'
  | 'french-overseas'
  | 'western-europe'
  | 'canada'
  | 'west-africa'
  | 'central-africa'
  | 'indian-ocean'
  | 'haiti'
  | 'pacific';

export type FrenchDeliveryLanguageRole =
  | 'primary'
  | 'co-official'
  | 'postal-operational';

export type FrenchShippingProfile = {
  countryCode: string;
  nativeCountryName: string;
  englishCountryName: string;
  family: FrenchAddressFamily;
  deliveryLanguageRole: FrenchDeliveryLanguageRole;
  postcodePattern: string | null;
  postcodeRequired: boolean;
  maxAddressLines: 6;
  maxInternationalAddressLines: 7;
  maxLineLength: 38 | 40;
  specialDeliveryScope: boolean;
  evidenceAuthority: string;
  evidenceUrl: string;
  evidenceCheckedOn: '2026-07-25';
  evidenceScope: 'destination-format-and-postcode-shape-only';
};

export type FrenchShippingWarning =
  | 'delivery_point_not_validated'
  | 'unsupported_country_profile'
  | 'missing_delivery_line'
  | 'missing_locality'
  | 'missing_postcode'
  | 'postcode_format_unconfirmed'
  | 'address_line_limit_exceeded'
  | 'line_length_exceeds_profile_limit'
  | 'special_territory_delivery_scope';

export type FrenchShippingComponentLabels = {
  organization: string;
  streetLine: string;
  secondaryUnit: string;
  deliveryArea: string;
  locality: string;
  administrativeArea: string;
  postcode: string;
  country: string;
};

export type FrenchShippingAddressResult = {
  mode: FrenchShippingMode;
  outputLanguage: 'fr' | 'en';
  profile: FrenchShippingProfile | null;
  componentLabels: FrenchShippingComponentLabels;
  normalized: CanonicalAddress;
  lines: string[];
  formatted: string;
  changedFields: Array<keyof CanonicalAddress>;
  translatedFields: Array<'country'>;
  preservedDeliveryFields: Array<
    'building' | 'road' | 'house_number' | 'subdistrict' | 'district' | 'city' | 'state'
  >;
  appliedRules: string[];
  warnings: FrenchShippingWarning[];
  formatStatus: 'format-ready' | 'needs-review';
  deliveryPointValidated: false;
};

const UPU_EVIDENCE_URL =
  'https://www.upu.int/en/Postal-Solutions/Programmes-Services/Addressing-Solutions?cid=144&csid=20';

const profile = (
  countryCode: string,
  nativeCountryName: string,
  englishCountryName: string,
  family: FrenchAddressFamily,
  deliveryLanguageRole: FrenchDeliveryLanguageRole,
  postcodePattern: string | null,
  postcodeRequired: boolean,
  options: {
    maxLineLength?: 38 | 40;
    specialDeliveryScope?: boolean;
    evidenceAuthority?: string;
    evidenceUrl?: string;
  } = {},
): FrenchShippingProfile => ({
  countryCode,
  nativeCountryName,
  englishCountryName,
  family,
  deliveryLanguageRole,
  postcodePattern,
  postcodeRequired,
  maxAddressLines: 6,
  maxInternationalAddressLines: 7,
  maxLineLength: options.maxLineLength ?? 40,
  specialDeliveryScope: options.specialDeliveryScope ?? false,
  evidenceAuthority: options.evidenceAuthority ?? 'UPU Postal Addressing Systems',
  evidenceUrl: options.evidenceUrl ?? UPU_EVIDENCE_URL,
  evidenceCheckedOn: '2026-07-25',
  evidenceScope: 'destination-format-and-postcode-shape-only',
});

const laPosteProfile = (
  countryCode: string,
  nativeCountryName: string,
  englishCountryName: string,
  postcodePattern: string | null,
  specialDeliveryScope = false,
) => profile(
  countryCode,
  nativeCountryName,
  englishCountryName,
  countryCode === 'FR' ? 'france' : 'french-overseas',
  'primary',
  postcodePattern,
  Boolean(postcodePattern),
  {
    maxLineLength: 38,
    specialDeliveryScope,
    evidenceAuthority: countryCode === 'FR' ? 'La Poste and UPU' : 'UPU designated operator profile',
    evidenceUrl: countryCode === 'FR'
      ? 'https://www.laposte.fr/conseils-pratiques/bien-rediger-l-adresse-d-une-lettre-ou-d-un-colis'
      : UPU_EVIDENCE_URL,
  },
);

const FRENCH_SHIPPING_PROFILES: Record<string, FrenchShippingProfile> = {
  FR: laPosteProfile('FR', 'France', 'France', '^\\d{5}$'),
  MC: profile(
    'MC',
    'Monaco',
    'Monaco',
    'france',
    'primary',
    '^980\\d{2}$',
    true,
    { maxLineLength: 38 },
  ),
  BE: profile(
    'BE',
    'Belgique',
    'Belgium',
    'western-europe',
    'co-official',
    '^\\d{4}$',
    true,
    {
      evidenceAuthority: 'bpost',
      evidenceUrl: 'https://www.bpost.be/fr/tout-sur-les-adresses',
    },
  ),
  CH: profile('CH', 'Suisse', 'Switzerland', 'western-europe', 'co-official', '^\\d{4}$', true),
  LU: profile(
    'LU',
    'Luxembourg',
    'Luxembourg',
    'western-europe',
    'co-official',
    '^\\d{4}$',
    false,
    {
      evidenceAuthority: 'POST Luxembourg and UPU',
      evidenceUrl: 'https://www.post.lu/en/particuliers/colis-courrier/rechercher-un-code-postal#/search',
    },
  ),
  CA: profile(
    'CA',
    'Canada',
    'Canada',
    'canada',
    'co-official',
    '^[ABCEGHJKLMNPRSTVXY]\\d[ABCEGHJKLMNPRSTVWXYZ] \\d[ABCEGHJKLMNPRSTVWXYZ]\\d$',
    true,
    {
      evidenceAuthority: 'Canada Post',
      evidenceUrl:
        'https://www.canadapost-postescanada.ca/cpc/en/support/articles/addressing-guidelines/civic-address.page',
    },
  ),
  GP: laPosteProfile('GP', 'Guadeloupe', 'Guadeloupe', '^971\\d{2}$'),
  MQ: laPosteProfile('MQ', 'Martinique', 'Martinique', '^972\\d{2}$'),
  GF: laPosteProfile('GF', 'Guyane française', 'French Guiana', '^973\\d{2}$'),
  RE: laPosteProfile('RE', 'La Réunion', 'Reunion', '^974\\d{2}$'),
  YT: laPosteProfile('YT', 'Mayotte', 'Mayotte', '^976\\d{2}$'),
  PF: laPosteProfile('PF', 'Polynésie française', 'French Polynesia', '^987\\d{2}$'),
  NC: laPosteProfile('NC', 'Nouvelle-Calédonie', 'New Caledonia', '^988\\d{2}$'),
  WF: laPosteProfile('WF', 'Wallis-et-Futuna', 'Wallis and Futuna', '^986\\d{2}$'),
  MF: laPosteProfile('MF', 'Saint-Martin', 'Saint Martin', '^97150$'),
  BL: laPosteProfile('BL', 'Saint-Barthélemy', 'Saint Barthelemy', '^97133$'),
  PM: laPosteProfile('PM', 'Saint-Pierre-et-Miquelon', 'Saint Pierre and Miquelon', '^97500$'),
  TF: laPosteProfile(
    'TF',
    'Terres australes et antarctiques françaises',
    'French Southern Territories',
    '^984\\d{2}$',
    true,
  ),
  CP: laPosteProfile(
    'CP',
    'Île de la Passion-Clipperton',
    'Clipperton Island',
    null,
    true,
  ),
  CI: profile(
    'CI',
    'Côte d’Ivoire',
    'Côte d’Ivoire',
    'west-africa',
    'primary',
    '^\\d{5}$',
    false,
    {
      evidenceAuthority: 'La Poste de Côte d’Ivoire and UPU',
      evidenceUrl: 'https://www.laposte.ci/',
    },
  ),
  SN: profile(
    'SN',
    'Sénégal',
    'Senegal',
    'west-africa',
    'primary',
    '^\\d{5}$',
    false,
    {
      evidenceAuthority: 'La Poste Sénégal',
      evidenceUrl: 'https://www.laposte.sn/code-postal-senegal/',
    },
  ),
  BF: profile(
    'BF',
    'Burkina Faso',
    'Burkina Faso',
    'west-africa',
    'primary',
    '^\\d{5}$',
    false,
    {
      evidenceAuthority: 'La Poste Burkina Faso',
      evidenceUrl: 'https://codespostaux.laposte.bf/',
    },
  ),
  ML: profile(
    'ML',
    'Mali',
    'Mali',
    'west-africa',
    'primary',
    '^\\d{5}$',
    false,
    {
      evidenceAuthority: 'La Poste du Mali',
      evidenceUrl: 'https://laposte.ml/',
    },
  ),
  NE: profile(
    'NE',
    'Niger',
    'Niger',
    'west-africa',
    'primary',
    '^\\d{4}$',
    false,
    {
      evidenceAuthority: 'Niger Poste',
      evidenceUrl: 'https://nigerposte.ne/',
    },
  ),
  TG: profile(
    'TG',
    'Togo',
    'Togo',
    'west-africa',
    'primary',
    '^\\d{4}$',
    false,
    {
      evidenceAuthority: 'Société des Postes du Togo',
      evidenceUrl: 'https://www.laposte.tg/bureaux-poste',
    },
  ),
  BJ: profile(
    'BJ',
    'Bénin',
    'Benin',
    'west-africa',
    'primary',
    '^\\d{4}$',
    false,
    {
      evidenceAuthority: 'La Poste du Bénin',
      evidenceUrl: 'https://laposte.bj/nos-agences/',
    },
  ),
  GN: profile(
    'GN',
    'Guinée',
    'Guinea',
    'west-africa',
    'primary',
    '^\\d{4}$',
    false,
    {
      evidenceAuthority: 'La Poste Guinéenne',
      evidenceUrl: 'https://www.laposte.gn/',
    },
  ),
  CM: profile('CM', 'Cameroun', 'Cameroon', 'central-africa', 'co-official', null, false),
  CF: profile(
    'CF',
    'République centrafricaine',
    'Central African Republic',
    'central-africa',
    'co-official',
    null,
    false,
  ),
  TD: profile('TD', 'Tchad', 'Chad', 'central-africa', 'co-official', null, false),
  CG: profile(
    'CG',
    'République du Congo',
    'Republic of the Congo',
    'central-africa',
    'primary',
    null,
    false,
  ),
  CD: profile(
    'CD',
    'République démocratique du Congo',
    'Democratic Republic of the Congo',
    'central-africa',
    'primary',
    null,
    false,
  ),
  GA: profile('GA', 'Gabon', 'Gabon', 'central-africa', 'primary', null, false),
  KM: profile(
    'KM',
    'Comores',
    'Comoros',
    'indian-ocean',
    'co-official',
    '^\\d{5}$',
    false,
    {
      evidenceAuthority: 'SNPSF Comores and UPU',
      evidenceUrl: 'https://www.snpsf.com/poste',
    },
  ),
  DJ: profile('DJ', 'Djibouti', 'Djibouti', 'indian-ocean', 'co-official', '^\\d{5}$', false),
  MG: profile(
    'MG',
    'Madagascar',
    'Madagascar',
    'indian-ocean',
    'co-official',
    '^\\d{3}$',
    true,
  ),
  MU: profile(
    'MU',
    'Maurice',
    'Mauritius',
    'indian-ocean',
    'postal-operational',
    '^\\d{5}$',
    true,
  ),
  RW: profile('RW', 'Rwanda', 'Rwanda', 'indian-ocean', 'co-official', '^\\d{4}$', false),
  SC: profile(
    'SC',
    'Seychelles',
    'Seychelles',
    'indian-ocean',
    'co-official',
    null,
    false,
    {
      evidenceAuthority: 'Seychelles Postal Regulator National Addressing System',
      evidenceUrl: 'https://seychellespostalregulator.com/pages/national-addressing-system',
    },
  ),
  BI: profile('BI', 'Burundi', 'Burundi', 'indian-ocean', 'co-official', null, false),
  HT: profile('HT', 'Haïti', 'Haiti', 'haiti', 'co-official', null, false),
  VU: profile('VU', 'Vanuatu', 'Vanuatu', 'pacific', 'co-official', null, false),
};

export const FRENCH_SHIPPING_COUNTRY_CODES = Object.freeze(
  Object.keys(FRENCH_SHIPPING_PROFILES),
);

const clean = (value: unknown) =>
  String(value ?? '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();

function baseCountryCode(countryCode: string) {
  const code = clean(countryCode).toUpperCase().replace(/-/g, '_');
  if (/^(FR|CA|BE|CH|LU)_/.test(code)) return code.slice(0, 2);
  return code;
}

export function isFrenchShippingCountry(countryCode: string) {
  return Boolean(FRENCH_SHIPPING_PROFILES[baseCountryCode(countryCode)]);
}

export function getFrenchShippingProfile(countryCode: string) {
  return FRENCH_SHIPPING_PROFILES[baseCountryCode(countryCode)] || null;
}

function normalizePostcode(value: unknown, shippingProfile: FrenchShippingProfile | null) {
  const original = clean(value).normalize('NFKC').toUpperCase();
  if (!original || !shippingProfile) return original;

  if (shippingProfile.countryCode === 'CA') {
    const compact = original.replace(/[\s-]+/g, '');
    if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(compact)) {
      return `${compact.slice(0, 3)} ${compact.slice(3)}`;
    }
    return original;
  }
  if (shippingProfile.postcodePattern?.includes('\\d')) {
    return original.replace(/\s+/g, '');
  }
  return original;
}

function normalizedCountryName(
  text: string,
  shippingProfile: FrenchShippingProfile,
  mode: FrenchShippingMode,
) {
  if (mode === 'international-shipping') return shippingProfile.englishCountryName;
  return shippingProfile.nativeCountryName || text;
}

export function normalizeFrenchShippingField(input: {
  countryCode: string;
  fieldKey: string;
  text: unknown;
  mode: FrenchShippingMode;
}) {
  const shippingProfile = getFrenchShippingProfile(input.countryCode);
  const fieldKey = clean(input.fieldKey).toLowerCase();
  const text = clean(input.text);
  if (!text) return '';

  if (fieldKey === 'country_code') return shippingProfile?.countryCode || baseCountryCode(text);
  if (fieldKey === 'postcode' || fieldKey === 'postal_code' || fieldKey === 'zip') {
    return normalizePostcode(text, shippingProfile);
  }
  if (fieldKey === 'country' && shippingProfile) {
    return normalizedCountryName(text, shippingProfile, input.mode);
  }

  // Official street, locality, municipality, and administrative names are delivery
  // keys. Roman-script French names remain unchanged for international mail.
  return text;
}

function labelsForProfile(
  shippingProfile: FrenchShippingProfile | null,
  mode: FrenchShippingMode,
): FrenchShippingComponentLabels {
  if (mode === 'international-shipping') {
    return {
      organization: 'Organization',
      streetLine: 'Delivery address',
      secondaryUnit: 'Unit, floor, or building',
      deliveryArea: 'Neighborhood, locality, or delivery area',
      locality: 'City or municipality',
      administrativeArea: 'Province, region, department, or territory',
      postcode: 'Postal code',
      country: 'Country',
    };
  }

  const family = shippingProfile?.family;
  return {
    organization: 'Société ou organisation',
    streetLine: 'Numéro et voie',
    secondaryUnit: 'Appartement, étage ou bâtiment',
    deliveryArea:
      family === 'west-africa' || family === 'central-africa'
        ? 'Quartier, commune ou arrondissement'
        : family === 'canada'
          ? 'Unité ou secteur de livraison'
          : 'Quartier, lieu-dit ou secteur de livraison',
    locality: family === 'canada' ? 'Municipalité' : 'Ville ou localité',
    administrativeArea:
      family === 'canada'
        ? 'Province ou territoire'
        : family === 'western-europe'
          ? 'Région, canton ou province'
          : 'Région, département ou province',
    postcode: 'Code postal',
    country: 'Pays',
  };
}

export function getFrenchShippingComponentLabels(
  countryCode: string,
  mode: FrenchShippingMode,
) {
  return labelsForProfile(getFrenchShippingProfile(countryCode), mode);
}

function comparable(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function uniqueLines(lines: string[]) {
  const seen = new Set<string>();
  return lines
    .map(line => String(line ?? '').normalize('NFC').trim())
    .filter(Boolean)
    .filter(line => {
      const key = comparable(line);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function streetLine(data: CanonicalAddress, shippingProfile: FrenchShippingProfile) {
  const road = clean(data.road);
  const houseNumber = clean(data.house_number);
  if (!road) return houseNumber;
  if (!houseNumber) return road;

  if (shippingProfile.family === 'western-europe') {
    return `${road} ${houseNumber}`;
  }
  return `${houseNumber} ${road}`;
}

function postcodeLocality(data: CanonicalAddress) {
  return [data.postcode, data.city].filter(Boolean).join(' ');
}

function renderDomesticLines(
  data: CanonicalAddress,
  shippingProfile: FrenchShippingProfile,
) {
  const organization = data.building || data.poi;
  const street = streetLine(data, shippingProfile);
  const deliveryArea = data.subdistrict || data.suburb;
  const district = data.district;

  if (shippingProfile.family === 'canada') {
    const municipalityLine = [
      [data.city, data.state].filter(Boolean).join(' '),
      data.postcode,
    ].filter(Boolean).join('  ');
    return uniqueLines([organization, deliveryArea, street, district, municipalityLine]);
  }
  if (shippingProfile.family === 'western-europe') {
    return uniqueLines([
      organization,
      street,
      deliveryArea,
      district,
      postcodeLocality(data),
      data.state,
    ]);
  }
  if (
    shippingProfile.family === 'france' ||
    shippingProfile.family === 'french-overseas'
  ) {
    return uniqueLines([
      organization,
      street,
      deliveryArea,
      district,
      postcodeLocality(data),
    ]);
  }

  return uniqueLines([
    organization,
    street,
    deliveryArea,
    district,
    postcodeLocality(data) || data.city,
    data.state,
  ]);
}

function normalizeCanonical(
  data: CanonicalAddress,
  shippingProfile: FrenchShippingProfile,
  mode: FrenchShippingMode,
) {
  const normalized: CanonicalAddress = {
    country_code: shippingProfile.countryCode,
    country: normalizedCountryName(clean(data.country), shippingProfile, mode),
    state: clean(data.state),
    city: clean(data.city),
    district: clean(data.district),
    subdistrict: clean(data.subdistrict),
    suburb: clean(data.suburb),
    road: clean(data.road),
    house_number: clean(data.house_number),
    building: clean(data.building),
    postcode: normalizePostcode(data.postcode, shippingProfile),
    poi: clean(data.poi),
    plus_code: clean(data.plus_code),
  };
  const changedFields = (Object.keys(normalized) as Array<keyof CanonicalAddress>).filter(
    key => clean(data[key]) !== clean(normalized[key]),
  );
  return { normalized, changedFields };
}

export function buildFrenchShippingAddress(
  data: CanonicalAddress,
  mode: FrenchShippingMode,
): FrenchShippingAddressResult {
  const shippingProfile = getFrenchShippingProfile(data.country_code);
  if (!shippingProfile) {
    const normalized = { ...data };
    const lines = uniqueLines([
      normalized.building || normalized.poi,
      [normalized.house_number, normalized.road].filter(Boolean).join(' '),
      normalized.subdistrict || normalized.suburb,
      normalized.district,
      postcodeLocality(normalized) || normalized.city,
      normalized.state,
      mode === 'international-shipping' ? clean(normalized.country).toUpperCase() : '',
    ]);
    return {
      mode,
      outputLanguage: mode === 'domestic' ? 'fr' : 'en',
      profile: null,
      componentLabels: labelsForProfile(null, mode),
      normalized,
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
      appliedRules: ['conservative-french-address-fallback'],
      warnings: ['delivery_point_not_validated', 'unsupported_country_profile'],
      formatStatus: 'needs-review',
      deliveryPointValidated: false,
    };
  }

  const { normalized, changedFields } = normalizeCanonical(data, shippingProfile, mode);
  const domesticLines = renderDomesticLines(normalized, shippingProfile);
  const lines = mode === 'international-shipping'
    ? uniqueLines([...domesticLines, shippingProfile.englishCountryName.toUpperCase()])
    : domesticLines;
  const warnings: FrenchShippingWarning[] = ['delivery_point_not_validated'];
  const hasDeliveryLine =
    Boolean(normalized.road) ||
    /^(?:BP|BO[IÎ]TE POSTALE|CASE POSTALE|POSTE RESTANTE|PO BOX)\b/i.test(normalized.building);
  const hasLocality = Boolean(
    normalized.city || normalized.district || normalized.subdistrict || normalized.suburb,
  );

  if (!hasDeliveryLine) warnings.push('missing_delivery_line');
  if (!hasLocality) warnings.push('missing_locality');
  if (shippingProfile.postcodeRequired && !normalized.postcode) {
    warnings.push('missing_postcode');
  } else if (
    normalized.postcode &&
    shippingProfile.postcodePattern &&
    !new RegExp(shippingProfile.postcodePattern, 'i').test(normalized.postcode)
  ) {
    warnings.push('postcode_format_unconfirmed');
  }
  const lineLimit = mode === 'international-shipping'
    ? shippingProfile.maxInternationalAddressLines
    : shippingProfile.maxAddressLines;
  if (lines.length > lineLimit) warnings.push('address_line_limit_exceeded');
  if (lines.some(line => line.length > shippingProfile.maxLineLength)) {
    warnings.push('line_length_exceeds_profile_limit');
  }
  if (shippingProfile.specialDeliveryScope) {
    warnings.push('special_territory_delivery_scope');
  }

  const reviewWarnings = warnings.filter(warning => warning !== 'delivery_point_not_validated');
  return {
    mode,
    outputLanguage: mode === 'domestic' ? 'fr' : 'en',
    profile: shippingProfile,
    componentLabels: labelsForProfile(shippingProfile, mode),
    normalized,
    lines,
    formatted: lines.join('\n'),
    changedFields,
    translatedFields: mode === 'international-shipping' ? ['country'] : [],
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
      'preserve-destination-country-delivery-names',
      'preserve-french-diacritics-and-ligatures',
      'omit-country-for-domestic-mail',
      'append-english-uppercase-country-for-international-mail',
      'never-claim-delivery-point-validation-from-formatting',
    ],
    warnings,
    formatStatus: reviewWarnings.length === 0 ? 'format-ready' : 'needs-review',
    deliveryPointValidated: false,
  };
}
