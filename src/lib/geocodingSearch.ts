import { normalizeSearchText,scoreSearchCandidate } from './searchQuery';

export type PhotonSearchFeature = {
  geometry?: {
    coordinates?: number[];
  };
  properties?: Record<string, unknown>;
};

export type GeocodingSearchResult = {
  place_id?: string | number;
  osm_type?: string;
  osm_id?: string | number;
  display_name: string;
  lat: string;
  lon: string;
  source: string;
  type?: string;
  class?: string;
  name?: string;
  category?: string;
  type_name?: string;
  address?: Record<string, string>;
  tags?: Record<string, string>;
  confidence?: number;
  matched_query?: string;
  [key: string]: unknown;
};

const GEOCODING_SOURCE_PRIORITY: Record<string, number> = {
  local_db: 0.82,
  osm_nominatim: 0.8,
  nominatim: 0.8,
  photon: 0.76,
};

function text(value: unknown) {
  const cleaned = String(value ?? '').trim();
  return cleaned || undefined;
}

function finiteCoordinate(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function uniqueParts(parts: Array<string | undefined>) {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    const key = normalizeSearchText(part);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(part);
  }
  return output;
}

function addAddressPart(address: Record<string, string>, key: string, value: unknown) {
  const cleaned = text(value);
  if (cleaned) address[key] = cleaned;
}

function sourcePriority(result: GeocodingSearchResult) {
  return GEOCODING_SOURCE_PRIORITY[String(result.source || '').toLowerCase()] ?? 0.7;
}

export function photonFeatureToGeocodingResult(
  feature: PhotonSearchFeature,
  matchedQuery: string,
  queryCandidates: string[],
): GeocodingSearchResult | null {
  const coordinates = feature.geometry?.coordinates;
  const lon = finiteCoordinate(coordinates?.[0]);
  const lat = finiteCoordinate(coordinates?.[1]);
  if (lat === null || lon === null) return null;

  const properties = feature.properties ?? {};
  const name = text(properties.name);
  const street = text(properties.street);
  const houseNumber = text(properties.housenumber);
  const streetLine = uniqueParts([street, houseNumber]).join(' ');
  const city = text(properties.city) || text(properties.town) || text(properties.village) || text(properties.municipality);
  const district = text(properties.district) || text(properties.suburb) || text(properties.neighbourhood);
  const state = text(properties.state);
  const country = text(properties.country);
  const primary = name || streetLine || city || state || country || matchedQuery;
  const displayName = uniqueParts([
    primary,
    streetLine && streetLine !== primary ? streetLine : undefined,
    district,
    city,
    state,
    country,
  ]).join(', ');
  const type = text(properties.osm_value) || text(properties.type) || text(properties.category) || 'place';
  const osmType = text(properties.osm_type);
  const osmId = text(properties.osm_id);
  const countryCode = text(properties.countrycode)?.toLowerCase();
  const address: Record<string, string> = {};

  addAddressPart(address, 'house_number', properties.housenumber);
  addAddressPart(address, 'road', properties.street);
  addAddressPart(address, 'suburb', properties.suburb ?? properties.neighbourhood);
  addAddressPart(address, 'district', properties.district);
  addAddressPart(address, 'city', city);
  addAddressPart(address, 'state', properties.state);
  addAddressPart(address, 'postcode', properties.postcode);
  addAddressPart(address, 'country', properties.country);
  addAddressPart(address, 'country_code', countryCode);

  const tags: Record<string, string> = {};
  for (const [key, value] of Object.entries(properties)) {
    const cleaned = text(value);
    if (cleaned) tags[key] = cleaned;
  }

  const rawScore = scoreSearchCandidate(
    [displayName, name, street, city, state, country, type].filter(Boolean).join(' '),
    queryCandidates,
  );
  const confidence = Math.max(0.38, Math.min(1, 0.38 + rawScore * 0.62));

  return {
    place_id: osmType && osmId ? `photon-${osmType}-${osmId}` : `photon-${lat.toFixed(6)}-${lon.toFixed(6)}-${normalizeSearchText(primary)}`,
    osm_type: osmType,
    osm_id: osmId,
    display_name: displayName || matchedQuery,
    lat: String(lat),
    lon: String(lon),
    source: 'photon',
    type,
    class: text(properties.osm_key),
    address,
    tags,
    confidence,
    matched_query: matchedQuery,
  };
}

export function geocodingSearchResultKey(result: GeocodingSearchResult) {
  const osmType = text(result.osm_type);
  const osmId = text(result.osm_id);
  if (osmType && osmId) return `osm|${osmType.toLowerCase()}|${osmId}`;

  const lat = finiteCoordinate(result.lat);
  const lon = finiteCoordinate(result.lon);
  const coordinateKey = lat !== null && lon !== null
    ? `${lat.toFixed(5)}|${lon.toFixed(5)}`
    : '';
  const nameKey = normalizeSearchText(String(result.display_name || result.name || ''));
  return [coordinateKey, nameKey].filter(Boolean).join('|') || nameKey;
}

export function dedupeGeocodingSearchResults(results: GeocodingSearchResult[]) {
  const deduped = new Map<string, GeocodingSearchResult>();
  for (const result of results) {
    const key = geocodingSearchResultKey(result);
    const existing = deduped.get(key);
    const score = (result.confidence ?? 0) + sourcePriority(result) * 0.08;
    const existingScore = existing
      ? (existing.confidence ?? 0) + sourcePriority(existing) * 0.08
      : -Infinity;
    if (!existing || score > existingScore) {
      deduped.set(key, result);
    }
  }
  return Array.from(deduped.values());
}
