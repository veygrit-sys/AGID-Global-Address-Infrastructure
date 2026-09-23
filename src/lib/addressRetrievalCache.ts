export interface AddressRetrievalRequest {
  lat: number;
  lon: number;
  langCode: string;
  countryCode?: string;
  highPrecision?: boolean;
}

export interface AddressRetrievalCacheOptions {
  ttlMs?: number;
  now?: () => number;
}

interface CachedAddressValue<T> {
  expiresAt: number;
  value: T;
}

const DEFAULT_TTL_MS = 45_000;
const completedRequests = new Map<string, CachedAddressValue<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function normalizeLanguageCode(langCode: string) {
  return langCode.trim() || 'en';
}

function normalizeCountryCode(countryCode?: string) {
  return (countryCode || '').trim().toLowerCase();
}

function roundedCoordinate(value: number, highPrecision?: boolean) {
  const precision = highPrecision ? 6 : 5;
  return Number.isFinite(value) ? value.toFixed(precision) : '0';
}

export function buildAddressRetrievalKey(request: AddressRetrievalRequest) {
  return [
    roundedCoordinate(request.lat, request.highPrecision),
    roundedCoordinate(request.lon, request.highPrecision),
    normalizeLanguageCode(request.langCode),
    normalizeCountryCode(request.countryCode),
    request.highPrecision ? 'high' : 'normal',
  ].join('|');
}

export function clearAddressRetrievalCache() {
  completedRequests.clear();
  inFlightRequests.clear();
}

export async function getCachedAddressRetrieval<T>(
  request: AddressRetrievalRequest,
  lookup: () => Promise<T>,
  options: AddressRetrievalCacheOptions = {},
): Promise<T> {
  const key = buildAddressRetrievalKey(request);
  const now = options.now?.() ?? Date.now();
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const cached = completedRequests.get(key) as CachedAddressValue<T> | undefined;

  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const inFlight = inFlightRequests.get(key) as Promise<T> | undefined;
  if (inFlight) {
    return inFlight;
  }

  const requestPromise = lookup()
    .then(value => {
      completedRequests.set(key, {
        expiresAt: (options.now?.() ?? Date.now()) + ttlMs,
        value,
      });
      return value;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, requestPromise);
  return requestPromise;
}
