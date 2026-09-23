import { decodeAGID } from './agid';
import { isValidAGIDFormat, normalizeAGIDInput } from './agidSecurity';
import { type CanonicalAddressParts } from './addressIntelligence';
import { expandSearchQuery, normalizeSearchText, scoreSearchCandidate } from './searchQuery';

export const SPATIAL_ADDRESS_INDEX_VERSION = 'spatial-address-index-v1';

export type SpatialAddressBounds = {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
};

export type SpatialAddressRecord = {
  id: string;
  label?: string;
  addressText?: string;
  aliases?: string[];
  canonical?: CanonicalAddressParts & Record<string, unknown>;
  countryCode?: string;
  postcode?: string;
  agid?: string;
  lat?: number;
  lon?: number;
  bounds?: SpatialAddressBounds;
  source?: string;
  confidence?: number;
  updatedAt?: string;
  tags?: string[];
  addressReferenceCommitment?: string;
  agidCommitment?: string;
  aoidCommitment?: string;
};

export type SpatialAddressIndexOptions = {
  bucketSizeDegrees?: number;
  maxBucketKeysPerRecord?: number;
  maxQueryBucketKeys?: number;
};

export type SpatialAddressSearchInput = {
  query?: string;
  lat?: number;
  lon?: number;
  radiusKm?: number;
  bounds?: SpatialAddressBounds;
  countryCode?: string;
  postcode?: string;
  agid?: string;
  limit?: number;
  minScore?: number;
};

export type SpatialAddressSearchResult = {
  record: SpatialAddressRecord;
  score: number;
  rank: number;
  reasons: string[];
  distanceKm?: number;
};

export type SpatialAddressIndexStats = {
  version: typeof SPATIAL_ADDRESS_INDEX_VERSION;
  records: number;
  spatialBuckets: number;
  addressTerms: number;
  countries: number;
  postcodes: number;
  agidPrefixes: number;
  bucketSizeDegrees: number;
  privacy: {
    rawAoidIndexed: false;
    rawRecipientIndexed: false;
    rawPhoneIndexed: false;
    publicIndexMaterial: 'address-records-or-domain-separated-commitments';
    recommendedPublicMode: 'commitments-only';
  };
};

type IndexedRecord = {
  record: SpatialAddressRecord;
  document: string;
  normalizedDocument: string;
  terms: Set<string>;
  spatialKeys: Set<string>;
  countryKey?: string;
  postcodeKey?: string;
  agidKeys: Set<string>;
  point?: { lat: number; lon: number };
  bounds?: SpatialAddressBounds;
};

export type SpatialAddressIndex = ReturnType<typeof createSpatialAddressIndex>;

const EARTH_RADIUS_KM = 6371.0088;
const DEFAULT_BUCKET_SIZE_DEGREES = 0.5;
const DEFAULT_RADIUS_KM = 2;
const DEFAULT_LIMIT = 20;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeLongitude(lon: number) {
  let result = lon;
  while (result > 180) result -= 360;
  while (result < -180) result += 360;
  return result;
}

function normalizeLatitude(lat: number) {
  return clamp(lat, -90, 90);
}

function normalizeBounds(bounds: SpatialAddressBounds): SpatialAddressBounds | undefined {
  const minLat = normalizeLatitude(Math.min(bounds.minLat, bounds.maxLat));
  const maxLat = normalizeLatitude(Math.max(bounds.minLat, bounds.maxLat));
  const minLon = normalizeLongitude(bounds.minLon);
  const maxLon = normalizeLongitude(bounds.maxLon);
  if (![minLat, maxLat, minLon, maxLon].every(Number.isFinite)) return undefined;
  return { minLat, maxLat, minLon, maxLon };
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;
  const lat1 = a.lat * toRad;
  const lat2 = b.lat * toRad;
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

function boundsFromPointRadius(lat: number, lon: number, radiusKm: number): SpatialAddressBounds {
  const safeLat = normalizeLatitude(lat);
  const safeLon = normalizeLongitude(lon);
  const latDelta = radiusKm / 110.574;
  const lonDelta = radiusKm / (111.32 * Math.max(0.05, Math.cos(safeLat * Math.PI / 180)));
  return {
    minLat: normalizeLatitude(safeLat - latDelta),
    maxLat: normalizeLatitude(safeLat + latDelta),
    minLon: normalizeLongitude(safeLon - lonDelta),
    maxLon: normalizeLongitude(safeLon + lonDelta),
  };
}

function boundsCenter(bounds: SpatialAddressBounds) {
  const normalized = normalizeBounds(bounds);
  if (!normalized) return undefined;
  const lat = (normalized.minLat + normalized.maxLat) / 2;
  const lonRanges = splitLongitudeRanges(normalized);
  const firstRange = lonRanges[0];
  const lon = firstRange ? normalizeLongitude((firstRange[0] + firstRange[1]) / 2) : 0;
  return { lat, lon };
}

function splitLongitudeRanges(bounds: SpatialAddressBounds): Array<[number, number]> {
  if (bounds.minLon <= bounds.maxLon) return [[bounds.minLon, bounds.maxLon]];
  return [[bounds.minLon, 180], [-180, bounds.maxLon]];
}

function boundsOverlap(a: SpatialAddressBounds, b: SpatialAddressBounds) {
  const normalizedA = normalizeBounds(a);
  const normalizedB = normalizeBounds(b);
  if (!normalizedA || !normalizedB) return false;
  const latOverlap = Math.max(normalizedA.minLat, normalizedB.minLat) <= Math.min(normalizedA.maxLat, normalizedB.maxLat);
  if (!latOverlap) return false;
  return splitLongitudeRanges(normalizedA).some(aRange => (
    splitLongitudeRanges(normalizedB).some(bRange => Math.max(aRange[0], bRange[0]) <= Math.min(aRange[1], bRange[1]))
  ));
}

function pointInBounds(point: { lat: number; lon: number }, bounds: SpatialAddressBounds) {
  const normalized = normalizeBounds(bounds);
  if (!normalized) return false;
  const latOk = point.lat >= normalized.minLat && point.lat <= normalized.maxLat;
  if (!latOk) return false;
  return splitLongitudeRanges(normalized).some(([minLon, maxLon]) => point.lon >= minLon && point.lon <= maxLon);
}

function bucketIndexForLat(lat: number, bucketSize: number) {
  return Math.floor((normalizeLatitude(lat) + 90) / bucketSize);
}

function bucketIndexForLon(lon: number, bucketSize: number) {
  return Math.floor((normalizeLongitude(lon) + 180) / bucketSize);
}

function bucketKey(latIndex: number, lonIndex: number) {
  return `${latIndex}:${lonIndex}`;
}

function bucketKeysForBounds(
  bounds: SpatialAddressBounds,
  bucketSize: number,
  maxKeys: number,
) {
  const normalized = normalizeBounds(bounds);
  if (!normalized) return new Set<string>();
  const keys = new Set<string>();
  const minLatIndex = bucketIndexForLat(normalized.minLat, bucketSize);
  const maxLatIndex = bucketIndexForLat(normalized.maxLat, bucketSize);

  for (const lonRange of splitLongitudeRanges(normalized)) {
    const minLonIndex = bucketIndexForLon(lonRange[0], bucketSize);
    const maxLonIndex = bucketIndexForLon(lonRange[1], bucketSize);
    for (let latIndex = minLatIndex; latIndex <= maxLatIndex; latIndex += 1) {
      for (let lonIndex = minLonIndex; lonIndex <= maxLonIndex; lonIndex += 1) {
        keys.add(bucketKey(latIndex, lonIndex));
        if (keys.size > maxKeys) return new Set([bucketKey(bucketIndexForLat((normalized.minLat + normalized.maxLat) / 2, bucketSize), bucketIndexForLon((lonRange[0] + lonRange[1]) / 2, bucketSize))]);
      }
    }
  }
  return keys;
}

function addToIndex(index: Map<string, Set<string>>, key: string | undefined, id: string) {
  if (!key) return;
  const existing = index.get(key);
  if (existing) existing.add(id);
  else index.set(key, new Set([id]));
}

function removeFromIndex(index: Map<string, Set<string>>, key: string | undefined, id: string) {
  if (!key) return;
  const existing = index.get(key);
  if (!existing) return;
  existing.delete(id);
  if (existing.size === 0) index.delete(key);
}

function normalizeCountry(country?: string) {
  const normalized = country?.trim().toUpperCase();
  return normalized || undefined;
}

function normalizePostcode(postcode?: string) {
  const normalized = postcode?.replace(/\s+/g, '').replace(/-/g, '').toUpperCase();
  return normalized || undefined;
}

function collectCanonicalText(canonical?: SpatialAddressRecord['canonical']) {
  if (!canonical) return [];
  return Object.values(canonical)
    .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
    .map(value => String(value));
}

function tokenSetFromText(text: string) {
  const normalized = normalizeSearchText(text);
  const tokens = new Set<string>();
  for (const token of normalized.split(/[^a-z0-9\p{L}\p{N}]+/u)) {
    if (token.length >= 2) tokens.add(token);
  }
  return tokens;
}

function buildDocument(record: SpatialAddressRecord) {
  return [
    record.id,
    record.label,
    record.addressText,
    ...(record.aliases ?? []),
    ...(record.tags ?? []),
    ...collectCanonicalText(record.canonical),
    record.countryCode,
    record.canonical?.country_code,
    record.postcode,
    record.canonical?.postcode,
    record.agid,
    record.source,
  ].filter(Boolean).join(' ');
}

function agidPrefixKeys(agid?: string) {
  const normalized = normalizeAGIDInput(agid);
  if (!normalized || !isValidAGIDFormat(normalized)) return new Set<string>();
  return new Set([
    normalized.slice(0, 2),
    normalized.slice(0, 4),
    normalized,
  ]);
}

function geometryFromRecord(record: SpatialAddressRecord, maxBucketKeys: number, bucketSize: number) {
  const decoded = record.agid ? decodeAGID(record.agid) : null;
  const lat = Number.isFinite(record.lat) ? Number(record.lat) : decoded?.lat;
  const lon = Number.isFinite(record.lon) ? Number(record.lon) : decoded?.lon;
  const point = Number.isFinite(lat) && Number.isFinite(lon)
    ? { lat: normalizeLatitude(Number(lat)), lon: normalizeLongitude(Number(lon)) }
    : undefined;
  const candidateBounds = record.bounds ?? decoded?.bounds ?? (point
    ? { minLat: point.lat, maxLat: point.lat, minLon: point.lon, maxLon: point.lon }
    : undefined);
  const bounds = candidateBounds ? normalizeBounds(candidateBounds) : undefined;
  const spatialKeys = bounds ? bucketKeysForBounds(bounds, bucketSize, maxBucketKeys) : new Set<string>();
  return { point, bounds, spatialKeys };
}

function queryGeometry(input: SpatialAddressSearchInput) {
  const decoded = input.agid ? decodeAGID(input.agid) : null;
  const lat = Number.isFinite(input.lat) ? Number(input.lat) : decoded?.lat;
  const lon = Number.isFinite(input.lon) ? Number(input.lon) : decoded?.lon;
  const point = Number.isFinite(lat) && Number.isFinite(lon)
    ? { lat: normalizeLatitude(Number(lat)), lon: normalizeLongitude(Number(lon)) }
    : undefined;
  const candidateBounds = input.bounds ?? decoded?.bounds ?? (point
    ? boundsFromPointRadius(point.lat, point.lon, input.radiusKm ?? DEFAULT_RADIUS_KM)
    : undefined);
  const bounds = candidateBounds ? normalizeBounds(candidateBounds) : undefined;
  return { point, bounds };
}

function unionInto(target: Set<string>, source?: Set<string>) {
  if (!source) return;
  for (const value of source) target.add(value);
}

function intersectWith(target: Set<string>, source?: Set<string>) {
  if (!source) {
    target.clear();
    return;
  }
  for (const value of Array.from(target)) {
    if (!source.has(value)) target.delete(value);
  }
}

function scoreIndexedRecord(
  indexed: IndexedRecord,
  input: SpatialAddressSearchInput,
  queryTerms: Set<string>,
  queryCandidates: string[],
  queryPoint?: { lat: number; lon: number },
  queryBounds?: SpatialAddressBounds,
) {
  const reasons = new Set<string>();
  let textScore = 0;
  if (queryCandidates.length > 0) {
    const matchedTerms = Array.from(queryTerms).filter(term => indexed.terms.has(term));
    const coverage = queryTerms.size > 0 ? matchedTerms.length / queryTerms.size : 0;
    const rankScore = scoreSearchCandidate(indexed.document, queryCandidates);
    textScore = Math.max(coverage, rankScore);
    if (matchedTerms.length > 0) reasons.add('address-index:term-match');
    if (rankScore >= 0.55) reasons.add('address-index:ranked-text-match');
  }

  let spatialScore = 0;
  let distanceKm: number | undefined;
  if (queryPoint && indexed.point) {
    distanceKm = haversineKm(queryPoint, indexed.point);
    const radius = input.radiusKm ?? DEFAULT_RADIUS_KM;
    if (distanceKm <= radius) {
      spatialScore = Math.max(spatialScore, 1 - Math.min(1, distanceKm / Math.max(radius, 0.001)));
      reasons.add('spatial-index:radius-match');
    }
  }
  if (queryPoint && indexed.bounds && pointInBounds(queryPoint, indexed.bounds)) {
    spatialScore = Math.max(spatialScore, 0.95);
    reasons.add('spatial-index:point-in-bounds');
  }
  if (queryBounds && indexed.bounds && boundsOverlap(queryBounds, indexed.bounds)) {
    spatialScore = Math.max(spatialScore, 0.78);
    reasons.add('spatial-index:bbox-overlap');
  }

  const countryKey = normalizeCountry(input.countryCode);
  const postcodeKey = normalizePostcode(input.postcode);
  const inputAgidKeys = agidPrefixKeys(input.agid);
  let exactBoost = 0;
  if (countryKey && indexed.countryKey === countryKey) {
    exactBoost += 0.05;
    reasons.add('address-index:country-filter');
  }
  if (postcodeKey && indexed.postcodeKey === postcodeKey) {
    exactBoost += 0.14;
    reasons.add('address-index:postcode-filter');
  }
  if (inputAgidKeys.size > 0 && Array.from(inputAgidKeys).some(key => indexed.agidKeys.has(key))) {
    exactBoost += 0.18;
    reasons.add('address-index:agid-match');
  }

  const confidenceBoost = clamp(indexed.record.confidence ?? 0, 0, 1) * 0.08;
  const hasText = queryCandidates.length > 0;
  const hasSpatial = Boolean(queryPoint || queryBounds);
  let score = 0;
  if (hasText && hasSpatial) score = (0.54 * textScore) + (0.32 * spatialScore);
  else if (hasText) score = textScore;
  else if (hasSpatial) score = spatialScore;
  else score = 0.1;

  score = clamp(score + exactBoost + confidenceBoost, 0, 1);
  if (indexed.record.source) reasons.add(`source:${indexed.record.source}`);
  return { score, reasons: Array.from(reasons), distanceKm };
}

export function createSpatialAddressIndex(
  initialRecords: SpatialAddressRecord[] = [],
  options: SpatialAddressIndexOptions = {},
) {
  const bucketSizeDegrees = options.bucketSizeDegrees ?? DEFAULT_BUCKET_SIZE_DEGREES;
  const maxBucketKeysPerRecord = options.maxBucketKeysPerRecord ?? 4096;
  const maxQueryBucketKeys = options.maxQueryBucketKeys ?? 8192;
  const records = new Map<string, IndexedRecord>();
  const spatialBuckets = new Map<string, Set<string>>();
  const termIndex = new Map<string, Set<string>>();
  const countryIndex = new Map<string, Set<string>>();
  const postcodeIndex = new Map<string, Set<string>>();
  const agidIndex = new Map<string, Set<string>>();

  function remove(id: string) {
    const existing = records.get(id);
    if (!existing) return false;
    for (const key of existing.spatialKeys) removeFromIndex(spatialBuckets, key, id);
    for (const term of existing.terms) removeFromIndex(termIndex, term, id);
    removeFromIndex(countryIndex, existing.countryKey, id);
    removeFromIndex(postcodeIndex, existing.postcodeKey, id);
    for (const key of existing.agidKeys) removeFromIndex(agidIndex, key, id);
    records.delete(id);
    return true;
  }

  function add(record: SpatialAddressRecord) {
    if (!record.id?.trim()) throw new Error('SpatialAddressRecord.id is required');
    remove(record.id);
    const document = buildDocument(record);
    const normalizedDocument = normalizeSearchText(document);
    const terms = tokenSetFromText(document);
    const countryKey = normalizeCountry(record.countryCode ?? record.canonical?.country_code);
    const postcodeKey = normalizePostcode(record.postcode ?? record.canonical?.postcode);
    const agidKeys = agidPrefixKeys(record.agid);
    const { point, bounds, spatialKeys } = geometryFromRecord(record, maxBucketKeysPerRecord, bucketSizeDegrees);

    const indexed: IndexedRecord = {
      record: {
        ...record,
        countryCode: countryKey ?? record.countryCode,
        postcode: record.postcode ?? record.canonical?.postcode,
      },
      document,
      normalizedDocument,
      terms,
      spatialKeys,
      countryKey,
      postcodeKey,
      agidKeys,
      point,
      bounds,
    };

    records.set(record.id, indexed);
    for (const key of spatialKeys) addToIndex(spatialBuckets, key, record.id);
    for (const term of terms) addToIndex(termIndex, term, record.id);
    addToIndex(countryIndex, countryKey, record.id);
    addToIndex(postcodeIndex, postcodeKey, record.id);
    for (const key of agidKeys) addToIndex(agidIndex, key, record.id);
    return indexed.record;
  }

  function candidateIdsForSearch(input: SpatialAddressSearchInput) {
    const seeds: Array<Set<string>> = [];
    const queryCandidates = input.query ? expandSearchQuery(input.query) : [];
    const queryTerms = tokenSetFromText(queryCandidates.join(' '));
    const querySpatial = queryGeometry(input);
    const countryKey = normalizeCountry(input.countryCode);
    const postcodeKey = normalizePostcode(input.postcode);
    const inputAgidKeys = agidPrefixKeys(input.agid);

    if (queryTerms.size > 0) {
      const textCandidates = new Set<string>();
      for (const term of queryTerms) unionInto(textCandidates, termIndex.get(term));
      seeds.push(textCandidates);
    }

    if (querySpatial.bounds) {
      const spatialCandidates = new Set<string>();
      const keys = bucketKeysForBounds(querySpatial.bounds, bucketSizeDegrees, maxQueryBucketKeys);
      for (const key of keys) unionInto(spatialCandidates, spatialBuckets.get(key));
      seeds.push(spatialCandidates);
    }

    if (postcodeKey) seeds.push(new Set(postcodeIndex.get(postcodeKey) ?? []));
    if (inputAgidKeys.size > 0) {
      const agidCandidates = new Set<string>();
      for (const key of inputAgidKeys) unionInto(agidCandidates, agidIndex.get(key));
      seeds.push(agidCandidates);
    }

    const candidateIds = seeds.length > 0
      ? seeds.reduce((acc, seed) => {
        unionInto(acc, seed);
        return acc;
      }, new Set<string>())
      : new Set(records.keys());

    if (countryKey) intersectWith(candidateIds, countryIndex.get(countryKey));
    if (postcodeKey) intersectWith(candidateIds, postcodeIndex.get(postcodeKey));

    return {
      ids: candidateIds,
      queryCandidates,
      queryTerms,
      queryPoint: querySpatial.point,
      queryBounds: querySpatial.bounds,
    };
  }

  function search(input: SpatialAddressSearchInput = {}) {
    const {
      ids,
      queryCandidates,
      queryTerms,
      queryPoint,
      queryBounds,
    } = candidateIdsForSearch(input);
    const minScore = input.minScore ?? (input.query ? 0.08 : 0);
    const limit = Math.max(1, input.limit ?? DEFAULT_LIMIT);

    return Array.from(ids)
      .map(id => records.get(id))
      .filter((indexed): indexed is IndexedRecord => Boolean(indexed))
      .map(indexed => {
        const scored = scoreIndexedRecord(indexed, input, queryTerms, queryCandidates, queryPoint, queryBounds);
        return {
          record: indexed.record,
          score: scored.score,
          rank: 0,
          reasons: scored.reasons,
          distanceKm: scored.distanceKm,
        };
      })
      .filter(result => result.score >= minScore)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
      })
      .slice(0, limit)
      .map((result, index) => ({ ...result, rank: index + 1 }));
  }

  function clear() {
    records.clear();
    spatialBuckets.clear();
    termIndex.clear();
    countryIndex.clear();
    postcodeIndex.clear();
    agidIndex.clear();
  }

  function stats(): SpatialAddressIndexStats {
    return {
      version: SPATIAL_ADDRESS_INDEX_VERSION,
      records: records.size,
      spatialBuckets: spatialBuckets.size,
      addressTerms: termIndex.size,
      countries: countryIndex.size,
      postcodes: postcodeIndex.size,
      agidPrefixes: agidIndex.size,
      bucketSizeDegrees,
      privacy: {
        rawAoidIndexed: false,
        rawRecipientIndexed: false,
        rawPhoneIndexed: false,
        publicIndexMaterial: 'address-records-or-domain-separated-commitments',
        recommendedPublicMode: 'commitments-only',
      },
    };
  }

  for (const record of initialRecords) add(record);

  return {
    version: SPATIAL_ADDRESS_INDEX_VERSION,
    add,
    remove,
    clear,
    search,
    stats,
    get(id: string) {
      return records.get(id)?.record;
    },
    size() {
      return records.size;
    },
  };
}
