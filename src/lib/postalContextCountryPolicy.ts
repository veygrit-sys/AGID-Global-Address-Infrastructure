export const POSTAL_CONTEXT_COUNTRY_CODES = ['JP', 'SG', 'NL', 'GB', 'FR', 'NZ', 'IS', 'IT', 'EE', 'CH', 'DE', 'CZ', 'SK', 'SI', 'NO', 'HU', 'FI', 'BG', 'BY', 'BE', 'ME', 'DK', 'MT', 'MC', 'AU', 'LV', 'LT', 'LI', 'AZ', 'AL', 'AM', 'AD', 'UA', 'AT', 'CY', 'GR', 'HR', 'RS', 'GE'] as const;

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
