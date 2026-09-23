import { apiV1Path } from './apiVersion';

export type AdvancedSearchCategory =
  | 'all'
  | 'address'
  | 'place'
  | 'business'
  | 'transport'
  | 'nature';

export interface AdvancedSearchOptions {
  countryCodes: string;
  category: AdvancedSearchCategory;
  nearbyOnly: boolean;
  radiusKm: number;
  limit: number;
}

export const DEFAULT_ADVANCED_SEARCH_OPTIONS: AdvancedSearchOptions = {
  countryCodes: '',
  category: 'all',
  nearbyOnly: false,
  radiusKm: 25,
  limit: 12,
};

export function normalizeAdvancedSearchOptions(options?: Partial<AdvancedSearchOptions>): AdvancedSearchOptions {
  const rawCountryCodes = options?.countryCodes ?? DEFAULT_ADVANCED_SEARCH_OPTIONS.countryCodes;
  const countryCodes = rawCountryCodes
    .split(/[,\s]+/)
    .map(code => code.trim().toLowerCase())
    .filter(code => /^[a-z]{2}$/.test(code))
    .filter((code, index, list) => list.indexOf(code) === index)
    .join(',');

  const category = options?.category ?? DEFAULT_ADVANCED_SEARCH_OPTIONS.category;
  const radiusKm = Number.isFinite(options?.radiusKm)
    ? Math.min(500, Math.max(1, Math.round(Number(options?.radiusKm))))
    : DEFAULT_ADVANCED_SEARCH_OPTIONS.radiusKm;
  const limit = Number.isFinite(options?.limit)
    ? Math.min(50, Math.max(3, Math.round(Number(options?.limit))))
    : DEFAULT_ADVANCED_SEARCH_OPTIONS.limit;

  return {
    countryCodes,
    category,
    nearbyOnly: Boolean(options?.nearbyOnly),
    radiusKm,
    limit,
  };
}

function normalizeText(value: unknown) {
  return String(value ?? '').toLowerCase();
}

const CATEGORY_MATCHERS: Record<AdvancedSearchCategory, string[]> = {
  all: [],
  address: ['house', 'street', 'road', 'postcode', 'postal', 'address', 'building', 'highway'],
  place: ['place', 'boundary', 'city', 'town', 'village', 'suburb', 'neighbourhood', 'locality'],
  business: ['amenity', 'shop', 'office', 'tourism', 'leisure', 'craft', 'healthcare'],
  transport: ['railway', 'station', 'airport', 'aeroway', 'public_transport', 'bus', 'ferry', 'harbour', 'port'],
  nature: ['natural', 'waterway', 'peak', 'mountain', 'beach', 'bay', 'water', 'sea', 'park', 'protected_area'],
};

export function matchesAdvancedSearchCategory(result: any, options?: Partial<AdvancedSearchOptions>) {
  const normalized = normalizeAdvancedSearchOptions(options);
  if (normalized.category === 'all') return true;

  const searchable = [
    result?.category,
    result?.type,
    result?.class,
    result?.type_name,
    result?.osm_type,
    result?.display_name,
    ...Object.keys(result?.tags ?? {}),
    ...Object.values(result?.tags ?? {}),
  ].map(normalizeText).join(' ');

  return CATEGORY_MATCHERS[normalized.category].some(token => searchable.includes(token));
}

export function distanceKmBetween(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusKm = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function matchesAdvancedSearchLocation(
  result: { lat?: number | string; lon?: number | string },
  lat?: number,
  lon?: number,
  options?: Partial<AdvancedSearchOptions>,
) {
  const normalized = normalizeAdvancedSearchOptions(options);
  if (!normalized.nearbyOnly || lat === undefined || lon === undefined) return true;

  const resultLat = Number(result.lat);
  const resultLon = Number(result.lon);
  if (!Number.isFinite(resultLat) || !Number.isFinite(resultLon)) return false;
  return distanceKmBetween(lat, lon, resultLat, resultLon) <= normalized.radiusKm;
}

export function buildNominatimSearchUrl(
  candidate: string,
  lat?: number,
  lon?: number,
  options?: Partial<AdvancedSearchOptions>,
  acceptLanguage?: string,
) {
  const normalized = normalizeAdvancedSearchOptions(options);
  const params = new URLSearchParams({
    q: candidate,
    limit: String(Math.min(10, normalized.limit)),
  });

  if (normalized.countryCodes) {
    params.set('countrycodes', normalized.countryCodes);
  }

  if (acceptLanguage) {
    params.set('accept_language', acceptLanguage);
  }

  if (lat !== undefined && lon !== undefined) {
    const delta = Math.max(0.02, normalized.radiusKm / 111);
    params.set('viewbox', `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`);
    params.set('bounded', normalized.nearbyOnly ? '1' : '0');
  }

  return `${apiV1Path('/osm-search')}?${params.toString()}`;
}

export function describeAdvancedSearchOptions(options?: Partial<AdvancedSearchOptions>) {
  const normalized = normalizeAdvancedSearchOptions(options);
  return [
    normalized.countryCodes ? normalized.countryCodes.toUpperCase() : 'GLOBAL',
    normalized.category,
    normalized.nearbyOnly ? `${normalized.radiusKm}km` : 'bias',
    `${normalized.limit} results`,
  ].join(' / ');
}
