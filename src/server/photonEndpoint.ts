export const DEFAULT_PHOTON_SEARCH_URL = 'https://photon.komoot.io/api/';

export type PhotonSearchUrlInput = {
  endpoint?: string;
  query: string;
  limit?: string | number;
  lat?: string | number;
  lon?: string | number;
};

function isLoopback(hostname: string) {
  return ['127.0.0.1', '::1', '[::1]', 'localhost'].includes(hostname.toLowerCase());
}

function safeLimit(value: string | number | undefined) {
  const parsed = Number.parseInt(String(value ?? 5), 10);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(20, Math.max(1, parsed));
}

/**
 * Allows the public HTTPS service or an explicitly configured HTTPS/loopback
 * Photon deployment. This keeps the environment variable from becoming an
 * unrestricted server-side request target.
 */
export function buildPhotonSearchUrl(input: PhotonSearchUrlInput) {
  const endpoint = input.endpoint?.trim() || DEFAULT_PHOTON_SEARCH_URL;
  const url = new URL(endpoint);
  const allowedProtocol =
    url.protocol === 'https:' || (url.protocol === 'http:' && isLoopback(url.hostname));

  if (!allowedProtocol || url.username || url.password) {
    throw new Error('Photon endpoint must be HTTPS or loopback HTTP without URL credentials.');
  }
  if (url.search || url.hash) {
    throw new Error('Photon endpoint must not include query parameters or a fragment.');
  }

  url.searchParams.set('q', input.query.trim());
  url.searchParams.set('limit', String(safeLimit(input.limit)));

  const lat = Number(input.lat);
  const lon = Number(input.lon);
  if (input.lat !== undefined && input.lon !== undefined && Number.isFinite(lat) && Number.isFinite(lon)) {
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
  }

  return url.toString();
}
