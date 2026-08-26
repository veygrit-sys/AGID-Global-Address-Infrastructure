export const POSTAL_CONTEXT_COUNTRY_CODES = ['JP', 'US', 'CA', 'CU', 'AR', 'UY', 'EC', 'SV', 'GT', 'SG', 'NL', 'GB', 'FR', 'NZ', 'IS', 'IT', 'EE', 'CH', 'DE', 'CZ', 'SK', 'SI', 'NO', 'HU', 'FI', 'BG', 'BY', 'BE', 'ME', 'RO', 'TW', 'KR', 'SA', 'OM', 'ZA', 'EG', 'MA', 'IN', 'PK', 'BD', 'BT', 'ID', 'PH', 'BN', 'VN', 'MY', 'MM', 'MV', 'MN', 'JO', 'LA', 'LB', 'AF', 'IL', 'IQ', 'IR', 'UZ', 'KZ', 'CN', 'KH', 'KG', 'KW', 'BH', 'DK', 'MT', 'MC', 'AU', 'LV', 'LT', 'LI', 'AZ', 'AL', 'AM', 'AD', 'UA', 'AT', 'CY', 'GR', 'HR', 'RS', 'GE'] as const;

export type PostalContextCountryCode = typeof POSTAL_CONTEXT_COUNTRY_CODES[number];

export type PostalContextCountryPolicy = {
  countryCode: PostalContextCountryCode;
  postalCodeFormat: string;
  fullCodeGeometrySemantics: 'area-or-non-area' | 'delivery-point-first' | 'address-range-first' | 'delivery-unit-first' | 'routing-locality-first' | 'delivery-network-first' | 'postal-area-first';
};

export const POSTAL_CONTEXT_COUNTRY_POLICIES: Record<
  PostalContextCountryCode,
  PostalContextCountryPolicy
> = {
  JP: {
    countryCode: 'JP',
    postalCodeFormat: 'NNN-NNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  US: {
    countryCode: 'US',
    postalCodeFormat: 'NNNNN or NNNNN-NNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  CA: {
    countryCode: 'CA',
    postalCodeFormat: 'ANA NAN',
    fullCodeGeometrySemantics: 'delivery-unit-first',
  },
  CU: {
    countryCode: 'CU',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  AR: {
    countryCode: 'AR',
    postalCodeFormat: 'ANNNNAAA',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  UY: {
    countryCode: 'UY',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  EC: {
    countryCode: 'EC',
    postalCodeFormat: 'NNNNNN',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  SV: {
    countryCode: 'SV',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  GT: {
    countryCode: 'GT',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  SG: {
    countryCode: 'SG',
    postalCodeFormat: 'NNNNNN',
    fullCodeGeometrySemantics: 'delivery-point-first',
  },
  NL: {
    countryCode: 'NL',
    postalCodeFormat: 'NNNN AA',
    fullCodeGeometrySemantics: 'address-range-first',
  },
  GB: {
    countryCode: 'GB',
    postalCodeFormat: 'OUTWARD INWARD',
    fullCodeGeometrySemantics: 'delivery-unit-first',
  },
  FR: {
    countryCode: 'FR',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  NZ: {
    countryCode: 'NZ',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'delivery-network-first',
  },
  IS: {
    countryCode: 'IS',
    postalCodeFormat: 'NNN',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  IT: {
    countryCode: 'IT',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  EE: {
    countryCode: 'EE',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  CH: {
    countryCode: 'CH',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  DE: {
    countryCode: 'DE',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  CZ: {
    countryCode: 'CZ',
    postalCodeFormat: 'NNN NN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  SK: {
    countryCode: 'SK',
    postalCodeFormat: 'NNN NN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  SI: {
    countryCode: 'SI',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  NO: {
    countryCode: 'NO',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  HU: {
    countryCode: 'HU',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  FI: {
    countryCode: 'FI',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  BG: {
    countryCode: 'BG',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  BY: {
    countryCode: 'BY',
    postalCodeFormat: 'NNNNNN',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  BE: {
    countryCode: 'BE',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  ME: {
    countryCode: 'ME',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  RO: {
    countryCode: 'RO',
    postalCodeFormat: 'NNNNNN',
    fullCodeGeometrySemantics: 'address-range-first',
  },
  TW: {
    countryCode: 'TW',
    postalCodeFormat: 'NNN NNN',
    fullCodeGeometrySemantics: 'address-range-first',
  },
  KR: {
    countryCode: 'KR',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  SA: {
    countryCode: 'SA',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'address-range-first',
  },
  OM: {
    countryCode: 'OM',
    postalCodeFormat: 'NNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  ZA: {
    countryCode: 'ZA',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  EG: {
    countryCode: 'EG',
    postalCodeFormat: 'NNNNNNN',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  MA: {
    countryCode: 'MA',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  IN: {
    countryCode: 'IN',
    postalCodeFormat: 'NNNNNN',
    fullCodeGeometrySemantics: 'delivery-network-first',
  },
  PK: {
    countryCode: 'PK',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'delivery-network-first',
  },
  BD: {
    countryCode: 'BD',
    postalCodeFormat: 'NNNN (1000-9999)',
    fullCodeGeometrySemantics: 'delivery-network-first',
  },
  BT: {
    countryCode: 'BT',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'delivery-network-first',
  },
  ID: {
    countryCode: 'ID',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  PH: {
    countryCode: 'PH',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'delivery-network-first',
  },
  BN: {
    countryCode: 'BN',
    postalCodeFormat: 'AANNNN',
    fullCodeGeometrySemantics: 'delivery-network-first',
  },
  VN: {
    countryCode: 'VN',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  MY: {
    countryCode: 'MY',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  MM: {
    countryCode: 'MM',
    postalCodeFormat: 'NNNNNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  MV: {
    countryCode: 'MV',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  MN: {
    countryCode: 'MN',
    postalCodeFormat: 'NNNNN or NNNNN-NNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  JO: {
    countryCode: 'JO',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  LA: {
    countryCode: 'LA',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  LB: {
    countryCode: 'LB',
    postalCodeFormat: 'NNNN or NN NNN NNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  AF: {
    countryCode: 'AF',
    postalCodeFormat: 'NNNNNN',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  IL: {
    countryCode: 'IL',
    postalCodeFormat: 'NNNNNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  IQ: {
    countryCode: 'IQ',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  IR: {
    countryCode: 'IR',
    postalCodeFormat: 'NNNNNNNNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  UZ: {
    countryCode: 'UZ',
    postalCodeFormat: 'NNNNNN',
    fullCodeGeometrySemantics: 'delivery-network-first',
  },
  KZ: {
    countryCode: 'KZ',
    postalCodeFormat: 'LNNLNLN or NNNNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  CN: {
    countryCode: 'CN',
    postalCodeFormat: 'NNNNNN',
    fullCodeGeometrySemantics: 'delivery-network-first',
  },
  KH: {
    countryCode: 'KH',
    postalCodeFormat: 'NNNNNN',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  KG: {
    countryCode: 'KG',
    postalCodeFormat: 'NNNNNN',
    fullCodeGeometrySemantics: 'delivery-network-first',
  },
  KW: {
    countryCode: 'KW',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  BH: {
    countryCode: 'BH',
    postalCodeFormat: 'NNN or NNNN (1XX-12XX)',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  DK: {
    countryCode: 'DK',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  MT: {
    countryCode: 'MT',
    postalCodeFormat: 'AAA NNNN',
    fullCodeGeometrySemantics: 'address-range-first',
  },
  MC: {
    countryCode: 'MC',
    postalCodeFormat: '980NN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  AU: {
    countryCode: 'AU',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'delivery-network-first',
  },
  LV: {
    countryCode: 'LV',
    postalCodeFormat: 'LV-NNNN',
    fullCodeGeometrySemantics: 'address-range-first',
  },
  LT: {
    countryCode: 'LT',
    postalCodeFormat: 'LT-NNNNN',
    fullCodeGeometrySemantics: 'address-range-first',
  },
  LI: {
    countryCode: 'LI',
    postalCodeFormat: '94NN',
    fullCodeGeometrySemantics: 'postal-area-first',
  },
  AZ: {
    countryCode: 'AZ',
    postalCodeFormat: 'AZNNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  AL: {
    countryCode: 'AL',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'delivery-network-first',
  },
  AM: {
    countryCode: 'AM',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'delivery-network-first',
  },
  AD: {
    countryCode: 'AD',
    postalCodeFormat: 'ADNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  UA: {
    countryCode: 'UA',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  AT: {
    countryCode: 'AT',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  CY: {
    countryCode: 'CY',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'address-range-first',
  },
  GR: {
    countryCode: 'GR',
    postalCodeFormat: 'NNN NN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  HR: {
    countryCode: 'HR',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'area-or-non-area',
  },
  RS: {
    countryCode: 'RS',
    postalCodeFormat: 'NNNNN',
    fullCodeGeometrySemantics: 'routing-locality-first',
  },
  GE: {
    countryCode: 'GE',
    postalCodeFormat: 'NNNN',
    fullCodeGeometrySemantics: 'delivery-network-first',
  },
};

export function isPostalContextCountryCode(value: string): value is PostalContextCountryCode {
  return (POSTAL_CONTEXT_COUNTRY_CODES as readonly string[]).includes(value);
}

export function normalizeJapanPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/[\s-]+/g, '');
  if (!/^\d{7}$/.test(normalized)) return null;
  return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
}

export function normalizeSingaporePostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{6}$/.test(normalized) ? normalized : null;
}

export function normalizeNetherlandsPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!/^\d{4}[A-Z]{2}$/.test(normalized)) return null;
  return `${normalized.slice(0, 4)} ${normalized.slice(4)}`;
}

export function normalizeUnitedKingdomPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!/^(?:GIR0AA|[A-Z]{1,2}\d[A-Z\d]?\d[A-Z]{2})$/.test(normalized)) return null;
  return `${normalized.slice(0, -3)} ${normalized.slice(-3)}`;
}

export function normalizeFrancePostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeNewZealandPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizeIcelandPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{3}$/.test(normalized) ? normalized : null;
}
export function normalizeItalyPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeEstoniaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeSwitzerlandPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizeGermanyPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeCzechiaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  if (!/^\d{5}$/.test(normalized)) return null;
  return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
}

export function normalizeSlovakiaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  if (!/^\d{5}$/.test(normalized)) return null;
  return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
}

export function normalizeSloveniaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\s+/g, '');
  if (/^SI(?!-)/.test(normalized)) return null;
  const digits = normalized.startsWith('SI-') ? normalized.slice(3) : normalized;
  return /^\d{4}$/.test(digits) ? digits : null;
}

export function normalizeNorwayPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}
export function normalizeHungaryPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizeFinlandPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeBulgariaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizeBelarusPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{6}$/.test(normalized) ? normalized : null;
}

export function normalizeBelgiumPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizeMontenegroPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeRomaniaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{6}$/.test(normalized) ? normalized : null;
}

export function normalizeTaiwanPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{6}$/.test(normalized) ? normalized : null;
}

export function normalizeKoreaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeSaudiArabiaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeOmanPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{3}$/.test(normalized) ? normalized : null;
}

export function normalizeSouthAfricaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizeEgyptPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{7}$/.test(normalized) ? normalized : null;
}

export function normalizeMoroccoPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeIndiaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^[1-9]\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizePakistanPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeBangladeshPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/[০-৯]/g, digit => String(digit.charCodeAt(0) - 0x09e6))
    .replace(/\s+/g, '');
  return /^[1-9]\d{3}$/.test(normalized) ? normalized : null;
}

export function normalizeBhutanPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeBruneiPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\s+/g, '');
  return /^[BKPT][A-Z]\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizeVietnamPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeMalaysiaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeMyanmarPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/[၀-၉]/g, digit => String('၀၁၂၃၄၅၆၇၈၉'.indexOf(digit)))
    .replace(/\s+/g, '');
  return /^\d{7}$/.test(normalized) ? normalized : null;
}

export function normalizeMaldivesPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeMongoliaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  if (/^\d{5}$/.test(normalized)) return normalized;
  const compact = /^\d{9}$/.test(normalized) ? normalized : normalized.match(/^\d{5}-\d{4}$/)?.[0].replace('-', '');
  return compact ? compact.slice(0, 5) + '-' + compact.slice(5) : null;
}

export function normalizeJordanPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeLaosPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/[໐-໙]/g, digit => String('໐໑໒໓໔໕໖໗໘໙'.indexOf(digit)))
    .replace(/[๐-๙]/g, digit => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(digit)))
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeLebanonPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/\s+/g, '');
  if (/^\d{4}$/.test(normalized)) return normalized;
  if (/^\d{8}$/.test(normalized)) return normalized.slice(0, 2) + ' ' + normalized.slice(2, 5) + ' ' + normalized.slice(5);
  return null;
}

export function normalizeAfghanistanPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/\s+/g, '');
  return /^\d{6}$/.test(normalized) ? normalized : null;
}

export function normalizeIsraelPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/\s+/g, '');
  return /^\d{7}$/.test(normalized) ? normalized : null;
}

export function normalizeIraqPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeIranPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/\s+/g, '');
  return /^\d{10}$/.test(normalized) ? normalized : null;
}

export function normalizeUzbekistanPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{6}$/.test(normalized) ? normalized : null;
}

export function normalizeKazakhstanPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\s+/g, '');
  return /^(?:[A-Z]\d{2}[A-Z]\d[A-Z]\d|\d{6})$/.test(normalized) ? normalized : null;
}

export function normalizeChinaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{6}$/.test(normalized) ? normalized : null;
}

export function normalizeCambodiaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{6}$/.test(normalized) ? normalized : null;
}

export function normalizeUnitedStatesPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  if (/^\d{5}$/.test(normalized)) return normalized;
  if (/^\d{9}$/.test(normalized)) return `${normalized.slice(0, 5)}-${normalized.slice(5)}`;
  return /^\d{5}-\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizeCanadaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTVWXYZ]\d[ABCEGHJ-NPRSTVWXYZ]\d$/.test(normalized)) return null;
  return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
}

export function normalizeCubaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeArgentinaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\s+/g, '');
  return /^[A-HJ-NP-Z]\d{4}[A-Z]{3}$/.test(normalized) ? normalized : null;
}

export function normalizeUruguayPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeEcuadorPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{6}$/.test(normalized) ? normalized : null;
}

export function normalizeElSalvadorPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizeGuatemalaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeKyrgyzstanPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{6}$/.test(normalized) ? normalized : null;
}

export function normalizeIndonesiaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^[1-9]\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizePhilippinesPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizeKuwaitPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeBahrainPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^(?:[1-9]\d{2}|1[0-2]\d{2})$/.test(normalized) ? normalized : null;
}

export type MoroccoPostalCodeDeliveryType =
  | 'home_delivery_sector'
  | 'agency_or_centre'
  | 'large_volume_recipient';

export function classifyMoroccoPostalCode(value: unknown): MoroccoPostalCodeDeliveryType | null {
  const normalized = normalizeMoroccoPostalCode(value);
  if (!normalized) return null;
  const ending = normalized.at(-1)!;
  if ('0178'.includes(ending)) return 'home_delivery_sector';
  if ('23456'.includes(ending)) return 'agency_or_centre';
  return 'large_volume_recipient';
}

export function normalizeDenmarkPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}
export function normalizeMaltaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\s+/g, '');
  if (!/^[A-Z]{3}\d{4}$/.test(normalized)) return null;
  return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
}

export function normalizeMonacoPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^980\d{2}$/.test(normalized) ? normalized : null;
}

export function normalizeAustraliaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizeLatviaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[\s-]+/g, '');
  const digits = normalized.startsWith('LV') ? normalized.slice(2) : normalized;
  if (!/^\d{4}$/.test(digits)) return null;
  return `LV-${digits}`;
}

export function normalizeLithuaniaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[\s-]+/g, '');
  const digits = normalized.startsWith('LT') ? normalized.slice(2) : normalized;
  if (!/^\d{5}$/.test(digits)) return null;
  return `LT-${digits}`;
}

export function normalizeLiechtensteinPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^94\d{2}$/.test(normalized) ? normalized : null;
}

export function normalizeAzerbaijanPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\s+/g, '');
  const digits = normalized.startsWith('AZ') ? normalized.slice(2) : normalized;
  if (!/^\d{4}$/.test(digits)) return null;
  return `AZ${digits}`;
}

export function normalizeAlbaniaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizeArmeniaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizeAndorraPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\s+/g, '');
  const digits = normalized.startsWith('AD') ? normalized.slice(2) : normalized;
  if (!/^\d{3}$/.test(digits)) return null;
  return `AD${digits}`;
}

export function normalizeUkrainePostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeAustriaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizeCyprusPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\s+/g, '');
  if (/^CY(?!-)/.test(normalized)) return null;
  const digits = normalized.startsWith('CY-') ? normalized.slice(3) : normalized;
  return /^\d{4}$/.test(digits) ? digits : null;
}

export function normalizeGreecePostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  if (!/^\d{5}$/.test(normalized)) return null;
  return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
}

export function normalizeCroatiaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .toUpperCase()
    .replace(/\s+/g, '');
  if (/^HR(?!-)/.test(normalized)) return null;
  const digits = normalized.startsWith('HR-') ? normalized.slice(3) : normalized;
  return /^\d{5}$/.test(digits) ? digits : null;
}

export function normalizeSerbiaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{5}$/.test(normalized) ? normalized : null;
}

export function normalizeGeorgiaPostalCode(value: unknown) {
  const normalized = String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/g, '');
  return /^\d{4}$/.test(normalized) ? normalized : null;
}

export function normalizePostalContextPostalCode(countryCode: string, value: unknown) {
  const normalizedCountry = countryCode.toUpperCase();
  if (normalizedCountry === 'JP') return normalizeJapanPostalCode(value);
  if (normalizedCountry === 'US') return normalizeUnitedStatesPostalCode(value);
  if (normalizedCountry === 'CA') return normalizeCanadaPostalCode(value);
  if (normalizedCountry === 'CU') return normalizeCubaPostalCode(value);
  if (normalizedCountry === 'AR') return normalizeArgentinaPostalCode(value);
  if (normalizedCountry === 'UY') return normalizeUruguayPostalCode(value);
  if (normalizedCountry === 'EC') return normalizeEcuadorPostalCode(value);
  if (normalizedCountry === 'SV') return normalizeElSalvadorPostalCode(value);
  if (normalizedCountry === 'GT') return normalizeGuatemalaPostalCode(value);
  if (normalizedCountry === 'SG') return normalizeSingaporePostalCode(value);
  if (normalizedCountry === 'NL') return normalizeNetherlandsPostalCode(value);
  if (normalizedCountry === 'GB') return normalizeUnitedKingdomPostalCode(value);
  if (normalizedCountry === 'FR') return normalizeFrancePostalCode(value);
  if (normalizedCountry === 'NZ') return normalizeNewZealandPostalCode(value);
  if (normalizedCountry === 'IS') return normalizeIcelandPostalCode(value);
  if (normalizedCountry === 'IT') return normalizeItalyPostalCode(value);
  if (normalizedCountry === 'EE') return normalizeEstoniaPostalCode(value);
  if (normalizedCountry === 'CH') return normalizeSwitzerlandPostalCode(value);
  if (normalizedCountry === 'DE') return normalizeGermanyPostalCode(value);
  if (normalizedCountry === 'CZ') return normalizeCzechiaPostalCode(value);
  if (normalizedCountry === 'SK') return normalizeSlovakiaPostalCode(value);
  if (normalizedCountry === 'SI') return normalizeSloveniaPostalCode(value);
  if (normalizedCountry === 'NO') return normalizeNorwayPostalCode(value);
  if (normalizedCountry === 'HU') return normalizeHungaryPostalCode(value);
  if (normalizedCountry === 'FI') return normalizeFinlandPostalCode(value);
  if (normalizedCountry === 'BG') return normalizeBulgariaPostalCode(value);
  if (normalizedCountry === 'BY') return normalizeBelarusPostalCode(value);
  if (normalizedCountry === 'BE') return normalizeBelgiumPostalCode(value);
  if (normalizedCountry === 'ME') return normalizeMontenegroPostalCode(value);
  if (normalizedCountry === 'RO') return normalizeRomaniaPostalCode(value);
  if (normalizedCountry === 'TW') return normalizeTaiwanPostalCode(value);
  if (normalizedCountry === 'KR') return normalizeKoreaPostalCode(value);
  if (normalizedCountry === 'SA') return normalizeSaudiArabiaPostalCode(value);
  if (normalizedCountry === 'OM') return normalizeOmanPostalCode(value);
  if (normalizedCountry === 'ZA') return normalizeSouthAfricaPostalCode(value);
  if (normalizedCountry === 'EG') return normalizeEgyptPostalCode(value);
  if (normalizedCountry === 'MA') return normalizeMoroccoPostalCode(value);
  if (normalizedCountry === 'IN') return normalizeIndiaPostalCode(value);
  if (normalizedCountry === 'PK') return normalizePakistanPostalCode(value);
  if (normalizedCountry === 'BD') return normalizeBangladeshPostalCode(value);
  if (normalizedCountry === 'BT') return normalizeBhutanPostalCode(value);
  if (normalizedCountry === 'ID') return normalizeIndonesiaPostalCode(value);
  if (normalizedCountry === 'PH') return normalizePhilippinesPostalCode(value);
  if (normalizedCountry === 'BN') return normalizeBruneiPostalCode(value);
  if (normalizedCountry === 'VN') return normalizeVietnamPostalCode(value);
  if (normalizedCountry === 'MY') return normalizeMalaysiaPostalCode(value);
  if (normalizedCountry === 'MM') return normalizeMyanmarPostalCode(value);
  if (normalizedCountry === 'MV') return normalizeMaldivesPostalCode(value);
  if (normalizedCountry === 'MN') return normalizeMongoliaPostalCode(value);
  if (normalizedCountry === 'JO') return normalizeJordanPostalCode(value);
  if (normalizedCountry === 'LA') return normalizeLaosPostalCode(value);
  if (normalizedCountry === 'LB') return normalizeLebanonPostalCode(value);
  if (normalizedCountry === 'AF') return normalizeAfghanistanPostalCode(value);
  if (normalizedCountry === 'IL') return normalizeIsraelPostalCode(value);
  if (normalizedCountry === 'IQ') return normalizeIraqPostalCode(value);
  if (normalizedCountry === 'IR') return normalizeIranPostalCode(value);
  if (normalizedCountry === 'UZ') return normalizeUzbekistanPostalCode(value);
  if (normalizedCountry === 'KZ') return normalizeKazakhstanPostalCode(value);
  if (normalizedCountry === 'CN') return normalizeChinaPostalCode(value);
  if (normalizedCountry === 'KH') return normalizeCambodiaPostalCode(value);
  if (normalizedCountry === 'KG') return normalizeKyrgyzstanPostalCode(value);
  if (normalizedCountry === 'KW') return normalizeKuwaitPostalCode(value);
  if (normalizedCountry === 'BH') return normalizeBahrainPostalCode(value);
  if (normalizedCountry === 'DK') return normalizeDenmarkPostalCode(value);
  if (normalizedCountry === 'MT') return normalizeMaltaPostalCode(value);
  if (normalizedCountry === 'MC') return normalizeMonacoPostalCode(value);
  if (normalizedCountry === 'AU') return normalizeAustraliaPostalCode(value);
  if (normalizedCountry === 'LV') return normalizeLatviaPostalCode(value);
  if (normalizedCountry === 'LT') return normalizeLithuaniaPostalCode(value);
  if (normalizedCountry === 'LI') return normalizeLiechtensteinPostalCode(value);
  if (normalizedCountry === 'AZ') return normalizeAzerbaijanPostalCode(value);
  if (normalizedCountry === 'AL') return normalizeAlbaniaPostalCode(value);
  if (normalizedCountry === 'AM') return normalizeArmeniaPostalCode(value);
  if (normalizedCountry === 'AD') return normalizeAndorraPostalCode(value);
  if (normalizedCountry === 'UA') return normalizeUkrainePostalCode(value);
  if (normalizedCountry === 'AT') return normalizeAustriaPostalCode(value);
  if (normalizedCountry === 'CY') return normalizeCyprusPostalCode(value);
  if (normalizedCountry === 'GR') return normalizeGreecePostalCode(value);
  if (normalizedCountry === 'HR') return normalizeCroatiaPostalCode(value);
  if (normalizedCountry === 'RS') return normalizeSerbiaPostalCode(value);
  if (normalizedCountry === 'GE') return normalizeGeorgiaPostalCode(value);
  return null;
}
