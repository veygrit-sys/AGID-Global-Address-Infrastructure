export type ProxySecurityResult<T = string> =
  | { ok: true; url: T }
  | { ok: false; error: string };

export type OverpassValidationResult =
  | { ok: true; normalizedQuery: string }
  | { ok: false; error: string };

const REQUEST_ID_MAX_LENGTH = 120;
const OVERPASS_QUERY_MAX_LENGTH = 16_000;
const OVERPASS_MAX_TIMEOUT_SECONDS = 120;
const OVERPASS_MAX_AROUND_RADIUS_METERS = 60_000;
const GEBCO_MAX_IMAGE_SIZE = 2048;

const GEBCO_ALLOWED_KEYS = new Set([
  'bbox',
  'bgcolor',
  'crs',
  'exceptions',
  'format',
  'height',
  'layers',
  'request',
  'service',
  'srs',
  'styles',
  'time',
  'transparent',
  'version',
  'width',
]);

const GEBCO_ALLOWED_REQUESTS = new Set(['getmap', 'getcapabilities']);
const GEBCO_ALLOWED_FORMATS = new Set(['image/png', 'image/jpeg', 'image/jpg']);

function firstValue(value: unknown) {
  if (Array.isArray(value)) return firstValue(value[0]);
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : '';
}

function finiteNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isFiniteLat(lat: number) {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

function isFiniteLon(lon: number) {
  return Number.isFinite(lon) && lon >= -180 && lon <= 180;
}

function cleanPlainText(value: unknown, maxLength: number) {
  return firstValue(value)
    .normalize('NFKC')
    .trim()
    .replace(/[\u0000-\u001f\u007f\s]+/g, '')
    .slice(0, maxLength);
}

export function sanitizeRequestId(value: unknown) {
  const cleaned = cleanPlainText(value, REQUEST_ID_MAX_LENGTH)
    .replace(/[^A-Za-z0-9._:-]/g, '-');
  return cleaned || undefined;
}

function normalizedCep(value: unknown) {
  const digits = firstValue(value).replace(/\D/g, '');
  return /^\d{8}$/.test(digits) ? digits : null;
}

function normalizedPincode(value: unknown) {
  const digits = firstValue(value).trim();
  return /^\d{6}$/.test(digits) ? digits : null;
}

function normalizedCountry(value: unknown) {
  const text = firstValue(value).trim().toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : null;
}

function normalizedPostcode(value: unknown, maxLength = 16) {
  const text = firstValue(value).normalize('NFKC').trim().toUpperCase();
  return /^[A-Z0-9][A-Z0-9 -]{0,30}[A-Z0-9]$/.test(text) && text.length <= maxLength
    ? text.replace(/\s+/g, ' ')
    : null;
}

export function buildPostalProxyUrl(
  kind: 'br-viacep' | 'in-pincode' | 'uk-postcode' | 'zippopotam',
  params: Record<string, unknown>,
): ProxySecurityResult {
  if (kind === 'br-viacep') {
    const cep = normalizedCep(params.cep);
    return cep
      ? { ok: true, url: `https://viacep.com.br/ws/${cep}/json/` }
      : { ok: false, error: 'CEP must be exactly 8 digits.' };
  }

  if (kind === 'in-pincode') {
    const pincode = normalizedPincode(params.pincode);
    return pincode
      ? { ok: true, url: `https://api.postalpincode.in/pincode/${pincode}` }
      : { ok: false, error: 'PIN code must be exactly 6 digits.' };
  }

  if (kind === 'uk-postcode') {
    const postcode = normalizedPostcode(params.postcode, 8);
    return postcode
      ? { ok: true, url: `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}` }
      : { ok: false, error: 'UK postcode format is invalid.' };
  }

  const country = normalizedCountry(params.country);
  const postcode = normalizedPostcode(params.postcode, 16);
  return country && postcode
    ? { ok: true, url: `https://api.zippopotam.us/${country}/${encodeURIComponent(postcode)}` }
    : { ok: false, error: 'Zippopotam lookup requires ISO 3166-1 alpha-2 country and bounded postcode.' };
}

function buildQueryParams(params: Record<string, unknown>) {
  const output = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const normalizedKey = key.toLowerCase();
    if (!GEBCO_ALLOWED_KEYS.has(normalizedKey)) {
      return { ok: false as const, error: `GEBCO parameter is not allowed: ${key}` };
    }
    const text = firstValue(value).trim();
    if (!text || text.length > 256) {
      return { ok: false as const, error: `GEBCO parameter is empty or too long: ${key}` };
    }
    output.set(normalizedKey, text);
  }
  return { ok: true as const, params: output };
}

function validateGebcoBbox(value: string) {
  const parts = value.split(',').map(part => finiteNumber(part.trim()));
  if (parts.length !== 4 || parts.some(part => part === null)) return false;
  const [minLon, minLat, maxLon, maxLat] = parts as number[];
  return isFiniteLon(minLon)
    && isFiniteLon(maxLon)
    && isFiniteLat(minLat)
    && isFiniteLat(maxLat)
    && minLon < maxLon
    && minLat < maxLat;
}

export function buildGebcoProxyUrl(query: Record<string, unknown>): ProxySecurityResult {
  const built = buildQueryParams(query);
  if (built.ok === false) return { ok: false, error: built.error };

  const request = (built.params.get('request') || '').toLowerCase();
  if (!GEBCO_ALLOWED_REQUESTS.has(request)) {
    return { ok: false, error: 'GEBCO proxy allows only GetMap and GetCapabilities.' };
  }

  const width = Number(built.params.get('width') ?? '0');
  const height = Number(built.params.get('height') ?? '0');
  if (request === 'getmap' && (
    !Number.isFinite(width) || !Number.isFinite(height)
    || width < 1 || height < 1
    || width > GEBCO_MAX_IMAGE_SIZE || height > GEBCO_MAX_IMAGE_SIZE
  )) {
    return { ok: false, error: 'GEBCO image dimensions are outside the allowed range.' };
  }

  const format = (built.params.get('format') || 'image/png').toLowerCase();
  if (request === 'getmap' && !GEBCO_ALLOWED_FORMATS.has(format)) {
    return { ok: false, error: 'GEBCO format is not allowed.' };
  }

  const bbox = built.params.get('bbox');
  if (request === 'getmap' && (!bbox || !validateGebcoBbox(bbox))) {
    return { ok: false, error: 'GEBCO GetMap requires a valid lon/lat bbox.' };
  }

  return {
    ok: true,
    url: `https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?${built.params.toString()}`,
  };
}

function overpassTimeoutSeconds(query: string) {
  const match = query.match(/\[\s*timeout\s*:\s*(\d+)\s*\]/i);
  return match ? Number(match[1]) : null;
}

function hasBoundedBbox(query: string) {
  const bboxPattern = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = bboxPattern.exec(query))) {
    const [, southText, westText, northText, eastText] = match;
    const south = Number(southText);
    const west = Number(westText);
    const north = Number(northText);
    const east = Number(eastText);
    if (
      isFiniteLat(south)
      && isFiniteLat(north)
      && isFiniteLon(west)
      && isFiniteLon(east)
      && south < north
      && west < east
      && north - south <= 5
      && east - west <= 5
    ) {
      return true;
    }
  }
  return false;
}

function aroundRadii(query: string) {
  return Array.from(query.matchAll(/around\s*:\s*(\d+(?:\.\d+)?)/gi))
    .map(match => Number(match[1]))
    .filter(Number.isFinite);
}

export function validateOverpassProxyQuery(query: unknown): OverpassValidationResult {
  const normalizedQuery = typeof query === 'string'
    ? query.normalize('NFKC').trim()
    : '';
  if (!normalizedQuery) return { ok: false, error: 'Overpass query is required.' };
  if (normalizedQuery.length > OVERPASS_QUERY_MAX_LENGTH) {
    return { ok: false, error: 'Overpass query is too large.' };
  }
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(normalizedQuery)) {
    return { ok: false, error: 'Overpass query contains control characters.' };
  }
  if (/\bout\s+meta\b/i.test(normalizedQuery)) {
    return { ok: false, error: 'Overpass proxy does not allow out meta dumps.' };
  }
  if (/\b(?:adiff|diff|timeline|retro|foreach|complete)\b/i.test(normalizedQuery)) {
    return { ok: false, error: 'Overpass proxy allows bounded read-only lookup queries only.' };
  }

  const timeoutSeconds = overpassTimeoutSeconds(normalizedQuery);
  if (timeoutSeconds !== null && timeoutSeconds > OVERPASS_MAX_TIMEOUT_SECONDS) {
    return { ok: false, error: 'Overpass timeout is too large.' };
  }

  const radii = aroundRadii(normalizedQuery);
  if (radii.some(radius => radius > OVERPASS_MAX_AROUND_RADIUS_METERS)) {
    return { ok: false, error: 'Overpass around radius is too large.' };
  }
  if (radii.length === 0 && !hasBoundedBbox(normalizedQuery)) {
    return { ok: false, error: 'Overpass query must include a bounded bbox or around radius.' };
  }

  return { ok: true, normalizedQuery };
}
