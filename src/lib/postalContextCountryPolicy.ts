export const POSTAL_CONTEXT_COUNTRY_CODES = ['JP', 'SG', 'NL', 'GB', 'FR', 'NZ', 'IS', 'IT', 'EE', 'CH'] as const;

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

export function normalizePostalContextPostalCode(countryCode: string, value: unknown) {
  const normalizedCountry = countryCode.toUpperCase();
  if (normalizedCountry === 'JP') return normalizeJapanPostalCode(value);
  if (normalizedCountry === 'SG') return normalizeSingaporePostalCode(value);
  if (normalizedCountry === 'NL') return normalizeNetherlandsPostalCode(value);
  if (normalizedCountry === 'GB') return normalizeUnitedKingdomPostalCode(value);
  if (normalizedCountry === 'FR') return normalizeFrancePostalCode(value);
  if (normalizedCountry === 'NZ') return normalizeNewZealandPostalCode(value);
  if (normalizedCountry === 'IS') return normalizeIcelandPostalCode(value);
  if (normalizedCountry === 'IT') return normalizeItalyPostalCode(value);
  if (normalizedCountry === 'EE') return normalizeEstoniaPostalCode(value);
  if (normalizedCountry === 'CH') return normalizeSwitzerlandPostalCode(value);
  return null;
}
