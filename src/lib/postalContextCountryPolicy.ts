export const POSTAL_CONTEXT_COUNTRY_CODES = ['JP', 'SG'] as const;

export type PostalContextCountryCode = typeof POSTAL_CONTEXT_COUNTRY_CODES[number];

export type PostalContextCountryPolicy = {
  countryCode: PostalContextCountryCode;
  postalCodeFormat: string;
  fullCodeGeometrySemantics: 'area-or-non-area' | 'delivery-point-first';
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

export function normalizePostalContextPostalCode(countryCode: string, value: unknown) {
  const normalizedCountry = countryCode.toUpperCase();
  if (normalizedCountry === 'JP') return normalizeJapanPostalCode(value);
  if (normalizedCountry === 'SG') return normalizeSingaporePostalCode(value);
  return null;
}
