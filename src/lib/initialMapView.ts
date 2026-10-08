export type InitialMapViewSource = 'url' | 'regional' | 'world';

export type InitialMapView = {
  lat: number;
  lng: number;
  zoom: number;
  source: InitialMapViewSource;
  regionCode?: string;
  shouldSelectInitialPoint: boolean;
};

type ResolveInitialMapViewInput = {
  search: string;
  width: number;
  timeZone?: string;
  languages?: readonly string[];
  detailZoom: number;
};

type RegionalOverview = {
  lat: number;
  lng: number;
  zoom: number;
};

const REGIONAL_OVERVIEWS: Record<string, RegionalOverview> = {
  AE: { lat: 24.4, lng: 54.4, zoom: 6 },
  AR: { lat: -38.4, lng: -63.6, zoom: 3.2 },
  AT: { lat: 47.6, lng: 14.1, zoom: 6 },
  AU: { lat: -25.3, lng: 133.8, zoom: 3.6 },
  BE: { lat: 50.6, lng: 4.7, zoom: 6.4 },
  BR: { lat: -14.2, lng: -51.9, zoom: 3.1 },
  CA: { lat: 56.1, lng: -106.3, zoom: 2.8 },
  CH: { lat: 46.8, lng: 8.2, zoom: 6.5 },
  CN: { lat: 35.9, lng: 104.2, zoom: 3.5 },
  DE: { lat: 51.2, lng: 10.4, zoom: 5.3 },
  DK: { lat: 56.0, lng: 10.0, zoom: 6 },
  ES: { lat: 40.4, lng: -3.7, zoom: 5 },
  FI: { lat: 64.0, lng: 26.0, zoom: 4.7 },
  FR: { lat: 46.2, lng: 2.2, zoom: 5 },
  GB: { lat: 54.6, lng: -3.4, zoom: 5 },
  HK: { lat: 22.32, lng: 114.17, zoom: 9.5 },
  ID: { lat: -2.5, lng: 118.0, zoom: 3.7 },
  IE: { lat: 53.4, lng: -8.2, zoom: 6 },
  IN: { lat: 22.9, lng: 78.9, zoom: 4 },
  IT: { lat: 42.8, lng: 12.5, zoom: 5.1 },
  JP: { lat: 37.5, lng: 137.5, zoom: 4.6 },
  KR: { lat: 36.4, lng: 127.8, zoom: 6.2 },
  MX: { lat: 23.6, lng: -102.5, zoom: 4 },
  MY: { lat: 4.2, lng: 102.0, zoom: 5.2 },
  NL: { lat: 52.1, lng: 5.3, zoom: 6.6 },
  NO: { lat: 64.5, lng: 11.5, zoom: 4.1 },
  NZ: { lat: -41.0, lng: 174.0, zoom: 4.7 },
  PH: { lat: 12.9, lng: 122.7, zoom: 5 },
  PL: { lat: 52.1, lng: 19.1, zoom: 5.4 },
  PT: { lat: 39.4, lng: -8.2, zoom: 5.7 },
  RU: { lat: 61.5, lng: 96.0, zoom: 2.6 },
  SE: { lat: 62.0, lng: 15.0, zoom: 4.5 },
  SG: { lat: 1.352, lng: 103.82, zoom: 10.5 },
  TH: { lat: 15.9, lng: 100.9, zoom: 5 },
  TR: { lat: 39.0, lng: 35.2, zoom: 5 },
  TW: { lat: 23.7, lng: 121.0, zoom: 6.3 },
  US: { lat: 39.8, lng: -98.6, zoom: 3.4 },
  VN: { lat: 16.2, lng: 107.8, zoom: 5 },
  ZA: { lat: -30.6, lng: 22.9, zoom: 4.5 },
};

const TIMEZONE_COUNTRY_HINTS: Array<[RegExp, string]> = [
  [/^Asia\/Tokyo$/, 'JP'],
  [/^Asia\/Seoul$/, 'KR'],
  [/^Asia\/Shanghai$/, 'CN'],
  [/^Asia\/Taipei$/, 'TW'],
  [/^Asia\/Hong_Kong$/, 'HK'],
  [/^Asia\/Singapore$/, 'SG'],
  [/^Asia\/Kolkata$/, 'IN'],
  [/^Asia\/Bangkok$/, 'TH'],
  [/^Asia\/Ho_Chi_Minh$/, 'VN'],
  [/^Asia\/Kuala_Lumpur$/, 'MY'],
  [/^Asia\/Dubai$/, 'AE'],
  [/^Europe\/London$/, 'GB'],
  [/^Europe\/Paris$/, 'FR'],
  [/^Europe\/Berlin$/, 'DE'],
  [/^Europe\/Rome$/, 'IT'],
  [/^Europe\/Madrid$/, 'ES'],
  [/^Europe\/Lisbon$/, 'PT'],
  [/^Europe\/Amsterdam$/, 'NL'],
  [/^Europe\/Brussels$/, 'BE'],
  [/^Europe\/Zurich$/, 'CH'],
  [/^Europe\/Vienna$/, 'AT'],
  [/^Europe\/Dublin$/, 'IE'],
  [/^Europe\/Copenhagen$/, 'DK'],
  [/^Europe\/Oslo$/, 'NO'],
  [/^Europe\/Stockholm$/, 'SE'],
  [/^Europe\/Helsinki$/, 'FI'],
  [/^Europe\/Warsaw$/, 'PL'],
  [/^Europe\/Moscow$/, 'RU'],
  [/^Europe\/Istanbul$/, 'TR'],
  [/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage)$/, 'US'],
  [/^America\/(Toronto|Vancouver|Winnipeg|Halifax|Edmonton)$/, 'CA'],
  [/^America\/Mexico_City$/, 'MX'],
  [/^America\/Sao_Paulo$/, 'BR'],
  [/^America\/Argentina\//, 'AR'],
  [/^Australia\//, 'AU'],
  [/^Pacific\/Auckland$/, 'NZ'],
  [/^Africa\/Johannesburg$/, 'ZA'],
];

function parseFiniteNumber(value: string | null) {
  if (value === null || value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeLng(lng: number) {
  let normalized = lng;
  while (normalized > 180) normalized -= 360;
  while (normalized < -180) normalized += 360;
  return normalized;
}

function responsiveWorldZoom(width: number) {
  if (width < 640) return 0;
  if (width < 1024) return 0.5;
  return 1;
}

function responsiveRegionalZoom(baseZoom: number, width: number) {
  if (width < 640) return Math.max(2.2, baseZoom - 1);
  if (width < 1024) return Math.max(2.5, baseZoom - 0.45);
  return baseZoom;
}

function regionFromTimeZone(timeZone?: string) {
  const zone = String(timeZone || '').trim();
  if (!zone) return null;
  return TIMEZONE_COUNTRY_HINTS.find(([pattern]) => pattern.test(zone))?.[1] || null;
}

function regionFromLanguages(languages: readonly string[] = []) {
  for (const language of languages) {
    const match = String(language).match(/[-_]([A-Za-z]{2})\b/);
    const region = match?.[1]?.toUpperCase();
    if (region && REGIONAL_OVERVIEWS[region]) return region;
  }
  // Bare language tags carry no region; use only unambiguous defaults.
  const languageRegions: Record<string, string> = { ja: 'JP', ko: 'KR' };
  for (const language of languages) {
    const region = languageRegions[String(language).toLowerCase()];
    if (region) return region;
  }
  return null;
}

export function resolveInitialMapView(input: ResolveInitialMapViewInput): InitialMapView {
  const params = new URLSearchParams(input.search || '');
  const urlLat = parseFiniteNumber(params.get('lat'));
  const urlLng = parseFiniteNumber(params.get('lng'));
  const urlZoom = parseFiniteNumber(params.get('zoom'));

  if (urlLat !== null && urlLng !== null) {
    return {
      lat: clamp(urlLat, -85, 85),
      lng: normalizeLng(urlLng),
      zoom: clamp(urlZoom ?? input.detailZoom, 1, 22),
      source: 'url',
      shouldSelectInitialPoint: true,
    };
  }

  const regionCode = regionFromTimeZone(input.timeZone) || regionFromLanguages(input.languages);
  const regional = regionCode ? REGIONAL_OVERVIEWS[regionCode] : null;
  if (regional) {
    return {
      ...regional,
      zoom: responsiveRegionalZoom(regional.zoom, input.width),
      source: 'regional',
      regionCode,
      shouldSelectInitialPoint: false,
    };
  }

  return {
    lat: 0,
    lng: 0,
    zoom: responsiveWorldZoom(input.width),
    source: 'world',
    shouldSelectInitialPoint: false,
  };
}
