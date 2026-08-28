import type { AddressFormat } from '../data/address_formats';

type PostalCodeMetadata = NonNullable<AddressFormat['postalCode']>;

export type PostcodeInputConfig =
  | {
      kind: 'none';
      pattern: null;
      fixedValue: null;
      source: null;
    }
  | {
      kind: 'segmented';
      pattern: string;
      fixedValue: null;
      source: string | null;
    }
  | {
      kind: 'fixed';
      pattern: string;
      fixedValue: string;
      source: string | null;
    };

const NONE_CONFIG: PostcodeInputConfig = {
  kind: 'none',
  pattern: null,
  fixedValue: null,
  source: null,
};

const NO_POSTCODE_FORMATS = [
  'none',
  'null',
  'not used',
  'no postal code',
  'no postcode',
  'country specific or not used',
];

const POSTCODE_PATTERN_OVERRIDES: Record<string, string> = {
  'A1A-style optional carrier/local code': 'ANA',
  'NNN(NN)': 'NNNNN',
  'NNN (or NNNN)': 'NNNN',
  'NNNN (or NNNN NNNN)': 'NNNN NNNN',
  'ANNN (or NNNNN)': '?????',
  'AN NAA, ANA NAA, ANN NAA, AAN NAA, AANA NAA, AANN NAA': '???? NAA',
  '9170-9179 / JM-###': '??????',
};

function cleanPostalFormat(format: string | null | undefined) {
  return (format || '').trim();
}

function isNoPostcodeFormat(format: string) {
  const normalized = format.toLowerCase();
  return !format || normalized === 'optional' || NO_POSTCODE_FORMATS.some(value => normalized === value || normalized.includes(value));
}

function literalFromRegex(regex: string | null | undefined) {
  if (!regex) return null;
  const body = regex.trim().replace(/^\^/, '').replace(/\$$/, '');
  const literal = body
    .replace(/\\s\?/g, ' ')
    .replace(/\\s\+/g, ' ')
    .replace(/\\s/g, ' ')
    .replace(/\\-/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  return /^[A-Z0-9 -]+$/i.test(literal) ? literal.toUpperCase() : null;
}

function literalFromFormat(format: string, regex: string | null | undefined) {
  if (regex) return null;
  if (/[NA?#]/.test(format)) return null;
  if (/\bor\b/i.test(format) || /\d+\s*-\s*\d+/.test(format)) return null;
  return /^[A-Z0-9 -]+$/i.test(format) ? format.toUpperCase() : null;
}

function patternFromFormat(format: string) {
  const override = POSTCODE_PATTERN_OVERRIDES[format];
  if (override) return override;

  const firstAlternative = format.split(/\s+or\s+/i)[0] || format;
  const numericRange = firstAlternative.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (numericRange) {
    return 'N'.repeat(numericRange[1].length);
  }

  const expandedOptional = firstAlternative.replace(/\[([^\]]+)\]/g, '$1');
  const trimmed = expandedOptional.trim();
  const containsAlphaToken = trimmed.includes('A');

  return trimmed
    .replace(/#/g, 'N')
    .replace(/9/g, 'N')
    .replace(containsAlphaToken ? /0/g : /(?!)0/g, 'N')
    .toUpperCase();
}

function hasEditablePostcodeTokens(pattern: string) {
  return /[NA?]/.test(pattern);
}

function isSafePostcodePattern(pattern: string) {
  return /^[A-Z0-9 ?-]+$/.test(pattern) && pattern.length <= 12;
}

function repeated(token: string, count: string | number) {
  return token.repeat(Number(count));
}

function patternFromRegex(regex: string | null | undefined) {
  if (!regex) return null;

  let body = regex.trim().replace(/^\^/, '').replace(/\$$/, '');
  if (body.includes('|')) return null;
  body = body.replace(/^\((.*)\)$/, '$1');
  body = body.replace(/\(([^|()]+)\)\?/g, '$1');
  body = body
    .replace(/\\s\?/g, ' ')
    .replace(/\\s\+/g, ' ')
    .replace(/\\s/g, ' ')
    .replace(/\\-/g, '-')
    .replace(/\\d\?/g, 'N')
    .replace(/\[A-Z\\d\]\?/gi, '?')
    .replace(/\[A-Z\\d\]\{(\d+),(\d+)\}/gi, (_match, _min, max) => repeated('?', max))
    .replace(/\[A-Z\\d\]\{(\d+)\}/gi, (_match, count) => repeated('?', count))
    .replace(/\[A-Z\\d\]/gi, '?')
    .replace(/\[A-Z\]\?/gi, 'A')
    .replace(/\[A-Z\]\{(\d+),(\d+)\}/gi, (_match, _min, max) => repeated('A', max))
    .replace(/\[A-Z\]\{(\d+)\}/gi, (_match, count) => repeated('A', count))
    .replace(/\[A-Z\]/gi, 'A')
    .replace(/\\d\{(\d+),(\d+)\}/g, (_match, _min, max) => repeated('N', max))
    .replace(/\\d\{(\d+)\}/g, (_match, count) => repeated('N', count))
    .replace(/\\d/g, 'N')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  return hasEditablePostcodeTokens(body) && isSafePostcodePattern(body) ? body : null;
}

export function getPostcodeInputConfig(format: Partial<AddressFormat> | null | undefined): PostcodeInputConfig {
  const postalCode = format?.postalCode as PostalCodeMetadata | undefined;
  const rawFormat = cleanPostalFormat(postalCode?.format);

  if (!postalCode || isNoPostcodeFormat(rawFormat)) {
    return NONE_CONFIG;
  }

  const fixedValue = literalFromRegex(postalCode.regex) || literalFromFormat(rawFormat, postalCode.regex);
  if (fixedValue) {
    return {
      kind: 'fixed',
      pattern: fixedValue,
      fixedValue,
      source: postalCode.source || null,
    };
  }

  const formatPattern = patternFromFormat(rawFormat);
  const pattern = hasEditablePostcodeTokens(formatPattern) && isSafePostcodePattern(formatPattern)
    ? formatPattern
    : patternFromRegex(postalCode.regex) || formatPattern;
  if (!hasEditablePostcodeTokens(pattern) || !isSafePostcodePattern(pattern)) {
    return NONE_CONFIG;
  }

  return {
    kind: 'segmented',
    pattern,
    fixedValue: null,
    source: postalCode.source || null,
  };
}
