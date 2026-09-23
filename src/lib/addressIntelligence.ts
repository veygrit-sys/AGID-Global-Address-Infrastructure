export type CanonicalAddressParts = {
  country_code?: string;
  country?: string;
  state?: string;
  city?: string;
  district?: string;
  subdistrict?: string;
  suburb?: string;
  road?: string;
  house_number?: string;
  building?: string;
  postcode?: string;
  poi?: string;
  plus_code?: string;
};

export type AddressAnalysis = {
  canonical: CanonicalAddressParts;
  parsed: CanonicalAddressParts;
  sources: string[];
  confidence: number;
};

const FIELD_ALIASES: Record<keyof CanonicalAddressParts, string[]> = {
  country_code: ['country_code', 'countrycode', 'countryCode', 'cc'],
  country: ['country'],
  state: ['state', 'province', 'region', 'department', 'governorate', 'emirate', 'state_district'],
  city: ['city', 'town', 'village', 'municipality', 'locality'],
  district: ['city_district', 'district', 'county', 'subdivision', 'borough'],
  subdistrict: ['subdistrict', 'neighbourhood', 'neighborhood', 'quarter', 'colonia', 'bairro'],
  suburb: ['suburb', 'hamlet', 'colonia', 'bairro'],
  road: ['road', 'street', 'street_name', 'square', 'avenue', 'place'],
  house_number: ['house_number', 'houseNumber', 'housenumber', 'house', 'addr:housenumber'],
  building: ['building', 'organization', 'flats', 'premise'],
  postcode: ['postcode', 'postalcode', 'postal_code', 'postalCode', 'zip', 'zipcode'],
  poi: [
    'poi',
    'map_feature_name',
    'bridge',
    'heritage_site',
    'ruins',
    'park',
    'river',
    'stream',
    'canal',
    'lake',
    'reservoir',
    'lagoon',
    'oxbow',
    'pond',
    'bay',
    'waterfall',
    'water',
    'waterway',
    'mountain',
    'peak',
    'grassland',
    'desert',
    'dryland',
    'wilderness',
    'salt_lake',
    'salt_flat',
    'salt_pan',
    'dry_lake',
    'badlands',
    'bare_rock',
    'scree',
    'shingle',
    'forest',
    'wetland',
    'beach',
    'island',
    'islet',
    'archipelago',
    'island_group',
    'atoll',
    'cay',
    'key',
    'cave',
    'valley',
    'glacier',
    'ice_field',
    'reef',
    'spring',
    'natural_feature',
    'amenity',
    'shop',
    'office',
    'tourism',
    'leisure',
    'railway',
    'aeroway',
    'historic',
    'station',
    'healthcare',
    'natural',
    'name',
  ],
  plus_code: ['plus_code', 'plusCode', 'open_location_code', 'olc'],
};

const ROAD_ABBREVIATIONS: Record<string, string> = {
  st: 'Street',
  street: 'Street',
  rd: 'Road',
  road: 'Road',
  ave: 'Avenue',
  av: 'Avenue',
  avenue: 'Avenue',
  blvd: 'Boulevard',
  dr: 'Drive',
  ln: 'Lane',
  ct: 'Court',
  pl: 'Place',
  sq: 'Square',
};

const POSTCODE_PATTERNS = [
  /\b\d{3}-\d{4}\b/i,
  /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i,
  /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/i,
  /\b\d{5}(?:-\d{4})?\b/i,
  /\b\d{4,6}\b/i,
];

function cleanValue(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value)
    .normalize('NFKC')
    .replace(/[\u3000\s]+/g, ' ')
    .trim();
}

function titleCaseAscii(value: string) {
  return value.replace(/\b([a-z])([a-z]*)/gi, (_, first: string, rest: string) =>
    `${first.toUpperCase()}${rest.toLowerCase()}`
  );
}

function normalizeRoadName(value: string) {
  const cleaned = cleanValue(value);
  if (!cleaned) return '';
  return titleCaseAscii(cleaned)
    .split(' ')
    .map((part, index, parts) => {
      const key = part.toLowerCase().replace(/\.$/, '');
      if (index === parts.length - 1 && ROAD_ABBREVIATIONS[key]) return ROAD_ABBREVIATIONS[key];
      return part;
    })
    .join(' ');
}

function pickFirst(raw: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    const value = cleanValue(raw[alias]);
    if (value) return value;
  }
  return '';
}

export function normalizeApiAddress(raw: Record<string, unknown> = {}): CanonicalAddressParts {
  const normalized: CanonicalAddressParts = {};

  (Object.keys(FIELD_ALIASES) as Array<keyof CanonicalAddressParts>).forEach(key => {
    const value = pickFirst(raw, FIELD_ALIASES[key]);
    if (!value) return;
    normalized[key] = key === 'road' ? normalizeRoadName(value) : value;
  });

  if (normalized.country_code) normalized.country_code = normalized.country_code.toLowerCase();
  return normalized;
}

function removeOnce(text: string, part?: string) {
  if (!part) return text;
  return text.replace(part, ' ').replace(/\s+/g, ' ').trim();
}

export function parseAddressText(text: string): CanonicalAddressParts {
  const original = cleanValue(text);
  if (!original) return {};

  let working = original;
  const parsed: CanonicalAddressParts = {};

  for (const pattern of POSTCODE_PATTERNS) {
    const match = working.match(pattern);
    if (match) {
      parsed.postcode = match[0].toUpperCase().replace(/\s+/, ' ');
      working = removeOnce(working, match[0]);
      break;
    }
  }

  const commaParts = working.split(',').map(part => part.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    parsed.country = commaParts[commaParts.length - 1];
    const maybeCity = commaParts[commaParts.length - 2].replace(/\b[A-Z]{2}\b\s*$/i, '').trim();
    if (maybeCity) parsed.city = maybeCity;
  }

  const firstLine = commaParts[0] || working;
  const streetMatch = firstLine.match(/^\s*([0-9]+[A-Za-z]?(?:[-/][0-9A-Za-z]+)?)\s+(.+?)\s*$/);
  if (streetMatch) {
    parsed.house_number = streetMatch[1];
    parsed.road = normalizeRoadName(streetMatch[2]);
  }

  return parsed;
}

function mergeCanonical(...parts: CanonicalAddressParts[]) {
  const merged: CanonicalAddressParts = {};
  const keys = Object.keys(FIELD_ALIASES) as Array<keyof CanonicalAddressParts>;

  for (const key of keys) {
    for (const part of parts) {
      const value = cleanValue(part[key]);
      if (value) {
        merged[key] = key === 'road' ? normalizeRoadName(value) : value;
        break;
      }
    }
  }

  if (merged.country_code) merged.country_code = merged.country_code.toLowerCase();
  return merged;
}

function confidenceFor(parts: CanonicalAddressParts, sourceCount: number) {
  const weightedFields: Array<[keyof CanonicalAddressParts, number]> = [
    ['country_code', 0.08],
    ['country', 0.08],
    ['postcode', 0.16],
    ['state', 0.1],
    ['city', 0.14],
    ['road', 0.18],
    ['house_number', 0.18],
    ['poi', 0.08],
    ['plus_code', 0.06],
  ];
  const fieldScore = weightedFields.reduce((score, [key, weight]) => score + (parts[key] ? weight : 0), 0);
  return Math.min(0.99, Math.round((fieldScore + Math.min(sourceCount, 3) * 0.05) * 100) / 100);
}

export function analyzeAddress({
  apiAddress,
  displayName,
  sources = [],
}: {
  apiAddress?: Record<string, unknown>;
  displayName?: string;
  sources?: string[];
}): AddressAnalysis {
  const normalized = normalizeApiAddress(apiAddress || {});
  const parsed = parseAddressText(displayName || '');
  const canonical = mergeCanonical(normalized, parsed);
  const mergedSources = Array.from(new Set([...sources.filter(Boolean), ...(Object.keys(parsed).length ? ['parser'] : [])]));

  return {
    canonical,
    parsed,
    sources: mergedSources,
    confidence: confidenceFor(canonical, mergedSources.length),
  };
}
