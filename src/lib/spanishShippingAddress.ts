import type { CanonicalAddress } from './addressRendering';

export type SpanishShippingMode = 'domestic' | 'international-shipping';

export type SpanishAddressFamily =
  | 'iberia'
  | 'mexico'
  | 'central-america'
  | 'caribbean'
  | 'usps-puerto-rico'
  | 'colombia'
  | 'andean'
  | 'southern-cone'
  | 'paraguay'
  | 'equatorial-guinea';

export type SpanishShippingProfile = {
  countryCode: string;
  nativeCountryName: string;
  englishCountryName: string;
  family: SpanishAddressFamily;
  postcodePattern: string | null;
  postcodeRequired: boolean;
  evidenceAuthority: string;
  evidenceUrl: string;
  evidenceCheckedOn: '2026-07-25';
  evidenceScope: 'destination-format-and-postcode-shape-only';
};

export type SpanishShippingWarning =
  | 'delivery_point_not_validated'
  | 'unsupported_country_profile'
  | 'missing_delivery_line'
  | 'missing_locality'
  | 'missing_postcode'
  | 'postcode_format_unconfirmed'
  | 'line_length_exceeds_40_characters';

export type SpanishShippingComponentLabels = {
  organization: string;
  streetLine: string;
  secondaryUnit: string;
  neighborhood: string;
  locality: string;
  administrativeArea: string;
  postcode: string;
  country: string;
};

export type SpanishShippingAddressResult = {
  mode: SpanishShippingMode;
  outputLanguage: 'es' | 'en';
  profile: SpanishShippingProfile | null;
  componentLabels: SpanishShippingComponentLabels;
  normalized: CanonicalAddress;
  lines: string[];
  formatted: string;
  changedFields: Array<keyof CanonicalAddress>;
  translatedFields: Array<'country'>;
  preservedDeliveryFields: Array<
    'building' | 'road' | 'house_number' | 'subdistrict' | 'district' | 'city' | 'state'
  >;
  appliedRules: string[];
  warnings: SpanishShippingWarning[];
  formatStatus: 'format-ready' | 'needs-review';
  deliveryPointValidated: false;
};

const UPU_EVIDENCE_URL =
  'https://www.upu.int/en/postal-solutions/programmes-services/addressing-solutions';

const profile = (
  countryCode: string,
  nativeCountryName: string,
  englishCountryName: string,
  family: SpanishAddressFamily,
  postcodePattern: string | null,
  postcodeRequired: boolean,
  evidenceAuthority = 'UPU Postal Addressing Systems',
  evidenceUrl = UPU_EVIDENCE_URL,
): SpanishShippingProfile => ({
  countryCode,
  nativeCountryName,
  englishCountryName,
  family,
  postcodePattern,
  postcodeRequired,
  evidenceAuthority,
  evidenceUrl,
  evidenceCheckedOn: '2026-07-25',
  evidenceScope: 'destination-format-and-postcode-shape-only',
});

const SPANISH_SHIPPING_PROFILES: Record<string, SpanishShippingProfile> = {
  ES: profile(
    'ES',
    'España',
    'Spain',
    'iberia',
    '^\\d{5}$',
    true,
    'Correos and UPU Postal Addressing Systems',
    'https://mioficina.correos.es/es/en/home/help/help-guides/import-delivery-files-retrieve-recipients',
  ),
  MX: profile(
    'MX',
    'México',
    'Mexico',
    'mexico',
    '^\\d{5}$',
    true,
    'Servicio Postal Mexicano',
    'https://www.correosdemexico.gob.mx/SSLServicios/ConsultaCP/ConsultaCP.aspx',
  ),
  GT: profile('GT', 'Guatemala', 'Guatemala', 'central-america', '^\\d{5}$', true),
  HN: profile('HN', 'Honduras', 'Honduras', 'central-america', '^\\d{5}$', true),
  SV: profile('SV', 'El Salvador', 'El Salvador', 'central-america', '^\\d{4}$', true),
  NI: profile('NI', 'Nicaragua', 'Nicaragua', 'central-america', '^\\d{5}$', true),
  CR: profile('CR', 'Costa Rica', 'Costa Rica', 'central-america', '^\\d{5}$', true),
  PA: profile('PA', 'Panamá', 'Panama', 'central-america', '^\\d{4}$', true),
  CU: profile('CU', 'Cuba', 'Cuba', 'caribbean', null, false),
  DO: profile('DO', 'República Dominicana', 'Dominican Republic', 'caribbean', null, false),
  PR: profile(
    'PR',
    'Puerto Rico',
    'Puerto Rico',
    'usps-puerto-rico',
    '^\\d{5}(?:-\\d{4})?$',
    true,
    'United States Postal Service Publication 28',
    'https://pe.usps.com/text/pub28/29c2_001.htm',
  ),
  CO: profile('CO', 'Colombia', 'Colombia', 'colombia', '^\\d{6}$', true),
  VE: profile('VE', 'Venezuela', 'Venezuela', 'andean', '^\\d{4}$', true),
  EC: profile('EC', 'Ecuador', 'Ecuador', 'andean', '^\\d{6}$', true),
  PE: profile('PE', 'Perú', 'Peru', 'andean', '^\\d{5}$', true),
  BO: profile('BO', 'Bolivia', 'Bolivia', 'andean', null, false),
  PY: profile('PY', 'Paraguay', 'Paraguay', 'paraguay', '^\\d{6}$', true),
  UY: profile('UY', 'Uruguay', 'Uruguay', 'southern-cone', '^\\d{5}$', true),
  AR: profile(
    'AR',
    'Argentina',
    'Argentina',
    'southern-cone',
    '^(?:[A-Z]\\d{4}[A-Z]{3}|\\d{4})$',
    true,
  ),
  CL: profile('CL', 'Chile', 'Chile', 'southern-cone', '^\\d{7}$', true),
  GQ: profile('GQ', 'Guinea Ecuatorial', 'Equatorial Guinea', 'equatorial-guinea', null, false),
};

export const SPANISH_SHIPPING_COUNTRY_CODES = Object.freeze(
  Object.keys(SPANISH_SHIPPING_PROFILES),
);

const clean = (value: unknown) =>
  String(value ?? '')
    .normalize('NFC')
    .replace(/\s+/g, ' ')
    .trim();

function baseCountryCode(countryCode: string) {
  const code = clean(countryCode).toUpperCase().replace(/-/g, '_');
  if (code.startsWith('ES_')) return 'ES';
  if (code.startsWith('CL_')) return 'CL';
  return code;
}

export function isSpanishShippingCountry(countryCode: string) {
  return Boolean(SPANISH_SHIPPING_PROFILES[baseCountryCode(countryCode)]);
}

export function getSpanishShippingProfile(countryCode: string) {
  return SPANISH_SHIPPING_PROFILES[baseCountryCode(countryCode)] || null;
}

function normalizePostcode(value: unknown, shippingProfile: SpanishShippingProfile | null) {
  const original = clean(value).normalize('NFKC').toUpperCase();
  if (!original || !shippingProfile) return original;

  if (shippingProfile.countryCode === 'PR') {
    const compact = original.replace(/[\s-]+/g, '');
    if (/^\d{9}$/.test(compact)) return `${compact.slice(0, 5)}-${compact.slice(5)}`;
    return compact;
  }
  if (shippingProfile.countryCode === 'AR') return original.replace(/\s+/g, '');
  if (shippingProfile.postcodePattern?.includes('\\d')) return original.replace(/\s+/g, '');
  return original;
}

function normalizedCountryName(
  text: string,
  shippingProfile: SpanishShippingProfile,
  mode: SpanishShippingMode,
) {
  if (mode === 'international-shipping') return shippingProfile.englishCountryName;
  return shippingProfile.nativeCountryName || text;
}

export function normalizeSpanishShippingField(input: {
  countryCode: string;
  fieldKey: string;
  text: unknown;
  mode: SpanishShippingMode;
}) {
  const shippingProfile = getSpanishShippingProfile(input.countryCode);
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

  // Spanish-speaking destinations already use Roman script. Delivery names stay in
  // their official spelling; only the structural UI and destination-country line change.
  return text;
}

function labelsForFamily(
  shippingProfile: SpanishShippingProfile | null,
  mode: SpanishShippingMode,
): SpanishShippingComponentLabels {
  if (mode === 'international-shipping') {
    return {
      organization: 'Organization',
      streetLine: 'Street and number',
      secondaryUnit: 'Unit, floor, or door',
      neighborhood: 'Neighborhood or delivery area',
      locality: 'City or locality',
      administrativeArea: 'State, province, department, or region',
      postcode: 'Postal code',
      country: 'Country',
    };
  }

  const family = shippingProfile?.family;
  const neighborhood =
    family === 'mexico'
      ? 'Colonia o asentamiento'
      : family === 'colombia'
        ? 'Barrio o localidad'
        : family === 'southern-cone' && shippingProfile?.countryCode === 'CL'
          ? 'Comuna'
          : family === 'usps-puerto-rico'
            ? 'Urbanización'
            : 'Barrio, colonia o zona';
  const administrativeArea =
    family === 'iberia'
      ? 'Provincia o comunidad autónoma'
      : family === 'mexico'
        ? 'Estado'
        : family === 'southern-cone' && shippingProfile?.countryCode === 'CL'
          ? 'Región'
          : family === 'colombia' || family === 'central-america'
            ? 'Departamento o provincia'
            : 'Estado, provincia o departamento';

  return {
    organization: 'Organización',
    streetLine: 'Vía y número',
    secondaryUnit: 'Interior, piso o puerta',
    neighborhood,
    locality: 'Ciudad o localidad',
    administrativeArea,
    postcode: 'Código postal',
    country: 'País',
  };
}

export function getSpanishShippingComponentLabels(
  countryCode: string,
  mode: SpanishShippingMode,
) {
  return labelsForFamily(getSpanishShippingProfile(countryCode), mode);
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
    .map(line => clean(line))
    .filter(Boolean)
    .filter(line => {
      const key = comparable(line);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function streetLine(data: CanonicalAddress, shippingProfile: SpanishShippingProfile) {
  const road = clean(data.road);
  const houseNumber = clean(data.house_number);
  if (!road) return houseNumber;
  if (!houseNumber) return road;

  if (shippingProfile.family === 'usps-puerto-rico') {
    return `${houseNumber} ${road}`;
  }
  if (shippingProfile.family === 'colombia') {
    const number = houseNumber.startsWith('#') ? houseNumber : `# ${houseNumber}`;
    return `${road} ${number}`;
  }
  return `${road} ${houseNumber}`;
}

function cityState(data: CanonicalAddress) {
  return [data.city, data.state].filter(Boolean).join(', ');
}

function renderDomesticLines(
  data: CanonicalAddress,
  shippingProfile: SpanishShippingProfile,
) {
  const organization = data.building || data.poi;
  const street = streetLine(data, shippingProfile);
  const neighborhood = data.subdistrict || data.suburb;
  const district = data.district;
  const postcodeCity = [data.postcode, data.city].filter(Boolean).join(' ');

  if (shippingProfile.family === 'iberia') {
    return uniqueLines([organization, street, neighborhood, postcodeCity, data.state]);
  }
  if (shippingProfile.family === 'mexico') {
    return uniqueLines([
      organization,
      street,
      neighborhood,
      [postcodeCity, data.state].filter(Boolean).join(', '),
    ]);
  }
  if (shippingProfile.family === 'usps-puerto-rico') {
    const lastLine = [data.city, 'PR', data.postcode]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();
    return uniqueLines([organization, neighborhood, street, district, lastLine]);
  }
  if (shippingProfile.family === 'colombia') {
    return uniqueLines([
      organization,
      street,
      neighborhood,
      district,
      cityState(data),
      data.postcode,
    ]);
  }
  if (shippingProfile.family === 'southern-cone') {
    return uniqueLines([
      organization,
      street,
      neighborhood,
      district,
      postcodeCity,
      data.state,
    ]);
  }
  if (shippingProfile.family === 'equatorial-guinea') {
    return uniqueLines([organization, street, neighborhood, district, data.city, data.state]);
  }

  return uniqueLines([
    organization,
    street,
    neighborhood,
    district,
    cityState(data),
    data.postcode,
  ]);
}

function normalizeCanonical(
  data: CanonicalAddress,
  shippingProfile: SpanishShippingProfile,
  mode: SpanishShippingMode,
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

export function buildSpanishShippingAddress(
  data: CanonicalAddress,
  mode: SpanishShippingMode,
): SpanishShippingAddressResult {
  const shippingProfile = getSpanishShippingProfile(data.country_code);
  if (!shippingProfile) {
    const normalized = { ...data };
    const lines = uniqueLines([
      normalized.building || normalized.poi,
      [normalized.road, normalized.house_number].filter(Boolean).join(' '),
      normalized.subdistrict || normalized.suburb,
      normalized.district,
      cityState(normalized),
      normalized.postcode,
      mode === 'international-shipping' ? clean(normalized.country).toUpperCase() : '',
    ]);
    return {
      mode,
      outputLanguage: mode === 'domestic' ? 'es' : 'en',
      profile: null,
      componentLabels: labelsForFamily(null, mode),
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
      appliedRules: ['conservative-spanish-address-fallback'],
      warnings: ['delivery_point_not_validated', 'unsupported_country_profile'],
      formatStatus: 'needs-review',
      deliveryPointValidated: false,
    };
  }

  const { normalized, changedFields } = normalizeCanonical(data, shippingProfile, mode);
  const domesticLines = renderDomesticLines(normalized, shippingProfile);
  const lines =
    mode === 'international-shipping'
      ? uniqueLines([...domesticLines, shippingProfile.englishCountryName.toUpperCase()])
      : domesticLines;
  const warnings: SpanishShippingWarning[] = ['delivery_point_not_validated'];
  const hasDeliveryLine =
    Boolean(normalized.road) ||
    /^(APARTADO|CASILLA|PO BOX|URBANIZACI[ÓO]N)\b/i.test(normalized.building);
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
  if (lines.some(line => line.replace(/\s/g, '').length > 40)) {
    warnings.push('line_length_exceeds_40_characters');
  }

  const reviewWarnings = warnings.filter(warning => warning !== 'delivery_point_not_validated');
  return {
    mode,
    outputLanguage: mode === 'domestic' ? 'es' : 'en',
    profile: shippingProfile,
    componentLabels: labelsForFamily(shippingProfile, mode),
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
      'preserve-spanish-diacritics',
      'omit-country-for-domestic-mail',
      'append-english-uppercase-country-for-international-mail',
      'never-claim-delivery-point-validation-from-formatting',
    ],
    warnings,
    formatStatus: reviewWarnings.length === 0 ? 'format-ready' : 'needs-review',
    deliveryPointValidated: false,
  };
}
