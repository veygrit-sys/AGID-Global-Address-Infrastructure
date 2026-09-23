export type MapAddressFeatureKind =
  | 'building'
  | 'road'
  | 'bridge'
  | 'mountain'
  | 'river'
  | 'lake'
  | 'pond'
  | 'bay'
  | 'water'
  | 'waterfall'
  | 'park'
  | 'grassland'
  | 'desert'
  | 'dryland'
  | 'forest'
  | 'wetland'
  | 'beach'
  | 'island'
  | 'cave'
  | 'valley'
  | 'glacier'
  | 'reef'
  | 'spring'
  | 'heritage'
  | 'ruins'
  | 'landmark'
  | 'transit'
  | 'place'
  | 'natural';

export type MapAddressFeatureCandidate = {
  name: string;
  nameEn?: string;
  kind: MapAddressFeatureKind;
  source: string;
  category?: string;
  distanceMeters?: number;
  osmId?: number | string;
  osmType?: string;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
};

export type MapAddressFeatureSummary = {
  primary?: MapAddressFeatureCandidate;
  features: MapAddressFeatureCandidate[];
  byKind: Partial<Record<MapAddressFeatureKind, MapAddressFeatureCandidate>>;
  hierarchy: string[];
  sources: string[];
};

export type MapFeatureAddressFields = {
  map_feature_name?: string;
  map_feature_name_en?: string;
  map_feature_kind?: MapAddressFeatureKind;
  map_feature_source?: string;
  map_feature_data?: MapAddressFeatureCandidate;
  map_feature_candidates?: MapAddressFeatureCandidate[];
  map_feature_by_kind?: Partial<Record<MapAddressFeatureKind, MapAddressFeatureCandidate>>;
  map_feature_hierarchy?: string[];
  map_feature_sources?: string[];
  bridge?: string;
  mountain?: string;
  mountain_name?: string;
  river?: string;
  stream?: string;
  canal?: string;
  lake?: string;
  reservoir?: string;
  lagoon?: string;
  oxbow?: string;
  pond?: string;
  bay?: string;
  water?: string;
  waterway?: string;
  waterfall?: string;
  park?: string;
  grassland?: string;
  desert?: string;
  dryland?: string;
  salt_lake?: string;
  salt_flat?: string;
  salt_pan?: string;
  dry_lake?: string;
  badlands?: string;
  bare_rock?: string;
  scree?: string;
  shingle?: string;
  wilderness?: string;
  forest?: string;
  wetland?: string;
  beach?: string;
  island?: string;
  islet?: string;
  archipelago?: string;
  island_group?: string;
  atoll?: string;
  cay?: string;
  key?: string;
  cave?: string;
  valley?: string;
  glacier?: string;
  ice_field?: string;
  reef?: string;
  spring?: string;
  natural_feature?: string;
  heritage_site?: string;
  ruins?: string;
  road?: string;
  building?: string;
  building_en?: string;
  poi?: string;
};

const KIND_PRIORITY: Record<MapAddressFeatureKind, number> = {
  building: 0,
  bridge: 1,
  road: 2,
  heritage: 3,
  ruins: 4,
  park: 5,
  river: 6,
  lake: 7,
  pond: 8,
  bay: 9,
  waterfall: 10,
  spring: 11,
  water: 12,
  mountain: 13,
  glacier: 14,
  reef: 15,
  desert: 16,
  dryland: 17,
  grassland: 18,
  forest: 19,
  wetland: 20,
  beach: 21,
  island: 22,
  cave: 23,
  valley: 24,
  transit: 25,
  landmark: 26,
  place: 27,
  natural: 28,
};

function distanceBucket(candidate: MapAddressFeatureCandidate) {
  if (candidate.distanceMeters === undefined) return 1;
  if (candidate.distanceMeters <= 15) return 0;
  if (candidate.distanceMeters <= 60) return 1;
  return 2;
}

const GENERIC_NAME_VALUES = new Set([
  'yes',
  'no',
  'true',
  'false',
  'building',
  'road',
  'street',
  'bridge',
  'water',
  'park',
  'forest',
  'natural',
  'peak',
  'river',
  'stream',
  'canal',
  'lake',
  'salt lake',
  'salt_lake',
  'saline lake',
  'saline_lake',
  'pond',
  'bay',
  'waterfall',
  'grassland',
  'desert',
  'dryland',
  'wilderness',
  'wasteland',
  'moor',
  'moorland',
  'forest',
  'wood',
  'wetland',
  'beach',
  'island',
  'islet',
  'archipelago',
  'atoll',
  'cay',
  'key',
  'cave',
  'valley',
  'glacier',
  'ice field',
  'ice_field',
  'icefield',
  'ice cap',
  'ice_cap',
  'ice sheet',
  'ice_sheet',
  'snowfield',
  'reef',
  'spring',
  'heritage',
  'world heritage',
  'ruins',
]);

const MOUNTAIN_NATURAL_VALUES = new Set(['peak', 'ridge', 'volcano', 'cliff', 'saddle']);
const RIVER_VALUES = new Set(['river', 'stream', 'canal', 'brook', 'creek', 'wadi']);
const SALT_LAKE_VALUES = new Set(['salt_lake', 'saline_lake', 'salt lake', 'saline lake']);
const LAKE_VALUES = new Set(['lake', 'reservoir', 'lagoon', 'oxbow', ...SALT_LAKE_VALUES]);
const POND_VALUES = new Set(['pond', 'basin', 'pool']);
const BAY_VALUES = new Set(['bay', 'fjord']);
const WATERFALL_VALUES = new Set(['waterfall']);
const WATER_NATURAL_VALUES = new Set([
  'water',
  'strait',
  'coastline',
]);
const WATER_CLASS_VALUES = new Set(['river', 'stream', 'canal', 'lake', 'reservoir', 'pond', 'water', 'bay', 'sea', 'ocean', ...SALT_LAKE_VALUES]);
const PARK_VALUES = new Set(['park', 'garden', 'nature_reserve', 'recreation_ground', 'national_park', 'protected_area']);
const GRASSLAND_VALUES = new Set(['grassland', 'meadow', 'grass', 'prairie', 'savanna', 'heath']);
const DESERT_VALUES = new Set(['desert', 'dune', 'sand']);
const DRYLAND_VALUES = new Set([
  'dryland',
  'semi_desert',
  'badlands',
  'wilderness',
  'wasteland',
  'moor',
  'moorland',
  'salt_flat',
  'salt_pan',
  'salt_lake',
  'saline_lake',
  'playa',
  'dry_lake',
  'bare_rock',
  'scree',
  'shingle',
  'mudflat',
  'fell',
  'scrub',
  'shrubland',
  'tundra',
]);
const FOREST_VALUES = new Set(['wood', 'forest']);
const WETLAND_VALUES = new Set(['wetland', 'marsh', 'swamp', 'bog', 'fen', 'reedbed', 'mangrove', 'saltmarsh', 'tidalflat']);
const BEACH_VALUES = new Set(['beach', 'sandbar']);
const ISLAND_VALUES = new Set([
  'island',
  'islands',
  'isle',
  'islet',
  'islets',
  'archipelago',
  'atoll',
  'cay',
  'cays',
  'cayo',
  'caye',
  'key',
  'keys',
  'holm',
  'skerry',
  'ait',
  'eyot',
]);
const CAVE_VALUES = new Set(['cave', 'cave_entrance']);
const VALLEY_VALUES = new Set(['valley', 'gorge', 'canyon']);
const GLACIER_VALUES = new Set(['glacier', 'ice_shelf', 'ice_field', 'icefield', 'ice_cap', 'ice_sheet', 'snowfield', 'firn']);
const ICE_FIELD_VALUES = new Set(['ice_shelf', 'ice_field', 'icefield', 'ice_cap', 'ice_sheet', 'snowfield', 'firn']);
const REEF_VALUES = new Set(['reef']);
const SPRING_VALUES = new Set(['spring', 'hot_spring', 'geyser']);
const RUINS_VALUES = new Set(['ruins', 'archaeological_site', 'battlefield']);
const TRANSIT_VALUES = new Set(['station', 'halt', 'tram_stop', 'airport', 'bus_stop', 'platform', 'subway']);

function cleanName(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value)
    .normalize('NFKC')
    .replace(/[\u3000\s]+/g, ' ')
    .trim();
}

function languageTag(langCode = '') {
  const normalized = langCode.toLowerCase();
  if (!normalized || normalized === 'local' || normalized === 'international' || normalized === 'intl_en') return '';
  if (normalized.startsWith('zh-hans')) return 'zh-Hans';
  if (normalized.startsWith('zh-hant')) return 'zh-Hant';
  if (normalized.startsWith('en')) return 'en';
  return normalized.split('-')[0];
}

function asTagRecord(rawTags: Record<string, unknown> = {}) {
  return Object.fromEntries(
    Object.entries(rawTags).map(([key, value]) => [key, cleanName(value)]),
  ) as Record<string, string>;
}

function tagValue(tags: Record<string, string>, key: string) {
  return cleanName(tags[key]).toLowerCase();
}

function truthyTag(tags: Record<string, string>, key: string) {
  const value = tagValue(tags, key);
  return Boolean(value && !['no', 'false', '0'].includes(value));
}

function isGenericName(value: string) {
  return GENERIC_NAME_VALUES.has(value.toLowerCase());
}

function nameKeysForLanguage(langCode = '') {
  const lang = languageTag(langCode);
  const keys = ['addr:housename', 'housename', 'building:name', 'building_name', 'bridge:name', 'bridge_name'];
  if (lang) keys.push(`name:${lang}`, `name_${lang}`, `name:${lang.toLowerCase()}`, `name_${lang.toLowerCase()}`);
  if (lang !== 'en') keys.push('name:en', 'name_en');
  keys.push(
    'name:en',
    'name_en',
    'name:latin',
    'name_latin',
    'name:nonlatin',
    'name_nonlatin',
    'official_name',
    'name',
    'loc_name',
    'alt_name',
    'brand',
  );
  return Array.from(new Set(keys));
}

function firstNamedValue(tags: Record<string, string>, langCode = '') {
  for (const key of nameKeysForLanguage(langCode)) {
    const value = cleanName(tags[key]);
    if (!value || isGenericName(value)) continue;
    return { name: value, source: key };
  }
  return null;
}

function featureProperties(feature: any) {
  return asTagRecord(feature?.properties || {});
}

function openMapLayerId(feature: any) {
  return cleanName(feature?.sourceLayer || feature?.sourceLayerId || feature?.layer?.['source-layer'] || feature?.layer?.sourceLayer || feature?.layer?.id);
}

function featureCenter(feature: any): { lat?: number; lon?: number } {
  const geometry = feature?.geometry;
  if (!geometry) return {};
  if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
    return { lon: Number(geometry.coordinates[0]), lat: Number(geometry.coordinates[1]) };
  }
  return {};
}

function isOneOf(value: string, set: Set<string>) {
  return Boolean(value && set.has(value));
}

export function classifyMapAddressFeature(
  rawTags: Record<string, unknown> = {},
  layerId = '',
): MapAddressFeatureKind {
  const tags = asTagRecord(rawTags);
  const layer = cleanName(layerId).toLowerCase();
  const natural = tagValue(tags, 'natural');
  const place = tagValue(tags, 'place');
  const cls = tagValue(tags, 'class');
  const subclass = tagValue(tags, 'subclass');
  const kind = tagValue(tags, 'kind');
  const landuse = tagValue(tags, 'landuse');
  const landcover = tagValue(tags, 'landcover');
  const leisure = tagValue(tags, 'leisure');
  const boundary = tagValue(tags, 'boundary');
  const glacierType = tagValue(tags, 'glacier:type');
  const railway = tagValue(tags, 'railway');
  const aeroway = tagValue(tags, 'aeroway');
  const water = tagValue(tags, 'water');
  const waterway = tagValue(tags, 'waterway');
  const tourism = tagValue(tags, 'tourism');
  const historic = tagValue(tags, 'historic');
  const heritageOperator = tagValue(tags, 'heritage:operator');
  const protectionTitle = tagValue(tags, 'protection_title');

  if (
    truthyTag(tags, 'heritage') ||
    truthyTag(tags, 'world_heritage_site') ||
    truthyTag(tags, 'unesco_world_heritage') ||
    truthyTag(tags, 'whc') ||
    truthyTag(tags, 'unesco') ||
    heritageOperator.includes('whc') ||
    heritageOperator.includes('unesco') ||
    protectionTitle.includes('world heritage')
  ) {
    return 'heritage';
  }

  if (
    isOneOf(historic, RUINS_VALUES) ||
    truthyTag(tags, 'ruins') ||
    truthyTag(tags, 'archaeological_site') ||
    tourism === 'archaeological_site' ||
    layer.includes('archaeolog') ||
    layer.includes('ruins')
  ) {
    return 'ruins';
  }

  if (truthyTag(tags, 'bridge') || tagValue(tags, 'man_made') === 'bridge' || tagValue(tags, 'brunnel') === 'bridge' || subclass === 'bridge') {
    return 'bridge';
  }

  if (truthyTag(tags, 'highway') || layer.includes('transportation') || layer.includes('road')) {
    return 'road';
  }

  if (isOneOf(natural, MOUNTAIN_NATURAL_VALUES) || place === 'mountain' || cls === 'mountain' || subclass === 'peak' || kind === 'mountain') {
    return 'mountain';
  }

  if (
    isOneOf(water, RIVER_VALUES) ||
    isOneOf(waterway, RIVER_VALUES) ||
    isOneOf(cls, RIVER_VALUES) ||
    isOneOf(subclass, RIVER_VALUES) ||
    kind === 'river' ||
    layer.includes('river')
  ) {
    return 'river';
  }

  if (
    isOneOf(water, POND_VALUES) ||
    isOneOf(cls, POND_VALUES) ||
    isOneOf(subclass, POND_VALUES) ||
    kind === 'pond'
  ) {
    return 'pond';
  }

  if (
    isOneOf(water, LAKE_VALUES) ||
    isOneOf(natural, SALT_LAKE_VALUES) ||
    isOneOf(cls, LAKE_VALUES) ||
    isOneOf(subclass, LAKE_VALUES) ||
    kind === 'lake' ||
    layer.includes('lake')
  ) {
    return 'lake';
  }

  if (
    isOneOf(water, BAY_VALUES) ||
    isOneOf(place, BAY_VALUES) ||
    isOneOf(natural, BAY_VALUES) ||
    isOneOf(cls, BAY_VALUES) ||
    isOneOf(subclass, BAY_VALUES) ||
    layer.includes('bay')
  ) {
    return 'bay';
  }

  if (
    isOneOf(waterway, WATERFALL_VALUES) ||
    isOneOf(natural, WATERFALL_VALUES) ||
    isOneOf(cls, WATERFALL_VALUES) ||
    isOneOf(subclass, WATERFALL_VALUES) ||
    layer.includes('waterfall')
  ) {
    return 'waterfall';
  }

  if (
    isOneOf(natural, SPRING_VALUES) ||
    isOneOf(cls, SPRING_VALUES) ||
    isOneOf(subclass, SPRING_VALUES) ||
    layer.includes('spring')
  ) {
    return 'spring';
  }

  if (
    truthyTag(tags, 'waterway') ||
    isOneOf(natural, WATER_NATURAL_VALUES) ||
    truthyTag(tags, 'water') ||
    ['sea', 'ocean', 'bay', 'strait'].includes(place) ||
    isOneOf(cls, WATER_CLASS_VALUES) ||
    isOneOf(subclass, WATER_CLASS_VALUES) ||
    layer.includes('water')
  ) {
    return 'water';
  }

  if (
    isOneOf(leisure, PARK_VALUES) ||
    boundary === 'national_park' ||
    boundary === 'protected_area' ||
    isOneOf(landuse, PARK_VALUES) ||
    isOneOf(cls, PARK_VALUES) ||
    isOneOf(subclass, PARK_VALUES) ||
    layer.includes('park')
  ) {
    return 'park';
  }

  if (
    isOneOf(natural, DESERT_VALUES) ||
    isOneOf(place, DESERT_VALUES) ||
    isOneOf(cls, DESERT_VALUES) ||
    isOneOf(subclass, DESERT_VALUES) ||
    isOneOf(landcover, DESERT_VALUES) ||
    layer.includes('desert')
  ) {
    return 'desert';
  }

  if (
    isOneOf(natural, DRYLAND_VALUES) ||
    isOneOf(place, DRYLAND_VALUES) ||
    isOneOf(landuse, DRYLAND_VALUES) ||
    isOneOf(landcover, DRYLAND_VALUES) ||
    isOneOf(cls, DRYLAND_VALUES) ||
    isOneOf(subclass, DRYLAND_VALUES) ||
    layer.includes('dryland') ||
    layer.includes('badland') ||
    layer.includes('wilderness') ||
    layer.includes('wasteland') ||
    layer.includes('moor') ||
    layer.includes('salt') ||
    layer.includes('bare')
  ) {
    return 'dryland';
  }

  if (
    isOneOf(natural, GRASSLAND_VALUES) ||
    isOneOf(landuse, GRASSLAND_VALUES) ||
    isOneOf(landcover, GRASSLAND_VALUES) ||
    isOneOf(cls, GRASSLAND_VALUES) ||
    isOneOf(subclass, GRASSLAND_VALUES) ||
    layer.includes('grass') ||
    layer.includes('meadow')
  ) {
    return 'grassland';
  }

  if (
    isOneOf(natural, FOREST_VALUES) ||
    isOneOf(landuse, FOREST_VALUES) ||
    isOneOf(landcover, FOREST_VALUES) ||
    isOneOf(cls, FOREST_VALUES) ||
    isOneOf(subclass, FOREST_VALUES) ||
    layer.includes('forest') ||
    layer.includes('wood')
  ) {
    return 'forest';
  }

  if (
    isOneOf(natural, WETLAND_VALUES) ||
    isOneOf(cls, WETLAND_VALUES) ||
    isOneOf(subclass, WETLAND_VALUES) ||
    layer.includes('wetland') ||
    layer.includes('marsh')
  ) {
    return 'wetland';
  }

  if (
    isOneOf(natural, BEACH_VALUES) ||
    isOneOf(cls, BEACH_VALUES) ||
    isOneOf(subclass, BEACH_VALUES) ||
    layer.includes('beach')
  ) {
    return 'beach';
  }

  if (
    isOneOf(place, ISLAND_VALUES) ||
    isOneOf(natural, ISLAND_VALUES) ||
    isOneOf(cls, ISLAND_VALUES) ||
    isOneOf(subclass, ISLAND_VALUES) ||
    layer.includes('island')
  ) {
    return 'island';
  }

  if (
    isOneOf(natural, CAVE_VALUES) ||
    isOneOf(cls, CAVE_VALUES) ||
    isOneOf(subclass, CAVE_VALUES) ||
    layer.includes('cave')
  ) {
    return 'cave';
  }

  if (
    isOneOf(natural, VALLEY_VALUES) ||
    isOneOf(cls, VALLEY_VALUES) ||
    isOneOf(subclass, VALLEY_VALUES) ||
    layer.includes('valley') ||
    layer.includes('canyon')
  ) {
    return 'valley';
  }

  if (
    isOneOf(natural, GLACIER_VALUES) ||
    isOneOf(glacierType, GLACIER_VALUES) ||
    isOneOf(cls, GLACIER_VALUES) ||
    isOneOf(subclass, GLACIER_VALUES) ||
    layer.includes('glacier') ||
    layer.includes('icefield') ||
    layer.includes('ice_field') ||
    layer.includes('snowfield')
  ) {
    return 'glacier';
  }

  if (
    isOneOf(natural, REEF_VALUES) ||
    isOneOf(cls, REEF_VALUES) ||
    isOneOf(subclass, REEF_VALUES) ||
    layer.includes('reef')
  ) {
    return 'reef';
  }

  if (truthyTag(tags, 'building') || truthyTag(tags, 'addr:housename') || layer.includes('building')) {
    return 'building';
  }

  if (
    truthyTag(tags, 'public_transport') ||
    isOneOf(railway, TRANSIT_VALUES) ||
    isOneOf(aeroway, TRANSIT_VALUES) ||
    layer.includes('transit') ||
    layer.includes('railway')
  ) {
    return 'transit';
  }

  if (truthyTag(tags, 'amenity') || truthyTag(tags, 'shop') || truthyTag(tags, 'tourism') || truthyTag(tags, 'office') || truthyTag(tags, 'historic')) {
    return 'landmark';
  }

  if (natural) return 'natural';
  if (place || layer.includes('place')) return 'place';
  return 'landmark';
}

function categoryFromTags(tags: Record<string, string>, kind: MapAddressFeatureKind, layerId = '') {
  if (kind === 'bridge') return tagValue(tags, 'man_made') === 'bridge' ? 'man_made:bridge' : 'bridge';
  if (kind === 'road') return cleanName(tags.highway) || 'road';
  if (kind === 'mountain') return cleanName(tags.natural || tags.place || tags.class || tags.subclass) || 'mountain';
  if (kind === 'river') return cleanName(tags.waterway || tags.class || tags.subclass) || 'river';
  if (kind === 'lake') return cleanName(tags.water || tags.natural || tags.class || tags.subclass || tags.salt) || 'lake';
  if (kind === 'pond') return cleanName(tags.water || tags.class || tags.subclass || tags.natural) || 'pond';
  if (kind === 'bay') return cleanName(tags.natural || tags.place || tags.water || tags.class || tags.subclass) || 'bay';
  if (kind === 'water') return cleanName(tags.waterway || tags.natural || tags.water || tags.place || tags.class || tags.subclass) || 'water';
  if (kind === 'waterfall') return cleanName(tags.waterway || tags.natural || tags.class || tags.subclass) || 'waterfall';
  if (kind === 'park') return cleanName(tags.leisure || tags.boundary || tags.landuse || tags.class || tags.subclass) || 'park';
  if (kind === 'grassland') return cleanName(tags.natural || tags.landuse || tags.landcover || tags.class || tags.subclass) || 'grassland';
  if (kind === 'desert') return cleanName(tags.natural || tags.place || tags.landcover || tags.class || tags.subclass) || 'desert';
  if (kind === 'dryland') return cleanName(tags.natural || tags.place || tags.landuse || tags.landcover || tags.class || tags.subclass) || 'dryland';
  if (kind === 'forest') return cleanName(tags.natural || tags.landuse || tags.landcover || tags.class || tags.subclass) || 'forest';
  if (kind === 'wetland') return cleanName(tags.natural || tags.class || tags.subclass) || 'wetland';
  if (kind === 'beach') return cleanName(tags.natural || tags.class || tags.subclass) || 'beach';
  if (kind === 'island') return cleanName(tags['island:type'] || tags.place || tags.natural || tags.class || tags.subclass) || 'island';
  if (kind === 'cave') return cleanName(tags.natural || tags.class || tags.subclass) || 'cave';
  if (kind === 'valley') return cleanName(tags.natural || tags.class || tags.subclass) || 'valley';
  if (kind === 'glacier') return cleanName(tags['glacier:type'] || tags.natural || tags.class || tags.subclass) || 'glacier';
  if (kind === 'reef') return cleanName(tags.natural || tags.class || tags.subclass) || 'reef';
  if (kind === 'spring') return cleanName(tags.natural || tags.class || tags.subclass) || 'spring';
  if (kind === 'heritage') return cleanName(tags.heritage || tags['heritage:operator'] || tags.protection_title || tags.tourism || tags.historic) || 'heritage';
  if (kind === 'ruins') return cleanName(tags.historic || tags.tourism || tags.site_type || tags.archaeological_site) || 'ruins';
  if (kind === 'building') return cleanName(tags.building || tags['addr:housename']) || 'building';
  if (kind === 'transit') return cleanName(tags.railway || tags.aeroway || tags.public_transport || tags.class || tags.subclass) || 'transit';
  return cleanName(tags.amenity || tags.shop || tags.tourism || tags.office || tags.historic || tags.place || tags.natural || layerId) || kind;
}

export function mapAddressFeatureCandidateFromOsmElement(
  element: any,
  langCode = '',
  distanceMeters?: number,
): MapAddressFeatureCandidate | null {
  const tags = asTagRecord(element?.tags || {});
  const best = firstNamedValue(tags, langCode);
  if (!best) return null;

  const kind = classifyMapAddressFeature(tags);
  const nameEn = cleanName(tags['name:en']) || cleanName(tags.name_en) || (languageTag(langCode) === 'en' ? best.name : '');
  const rawLat = element?.lat ?? element?.center?.lat;
  const rawLon = element?.lon ?? element?.center?.lon;
  const lat = rawLat === undefined ? undefined : Number(rawLat);
  const lon = rawLon === undefined ? undefined : Number(rawLon);

  return {
    name: best.name,
    ...(nameEn ? { nameEn } : {}),
    kind,
    source: `osm:${kind}:${best.source}`,
    category: categoryFromTags(tags, kind),
    distanceMeters,
    osmId: element?.id,
    osmType: element?.type,
    lat: Number.isFinite(lat) ? lat : undefined,
    lon: Number.isFinite(lon) ? lon : undefined,
    tags,
  };
}

export function mapAddressFeatureCandidateFromOpenMapFeature(
  feature: any,
  langCode = '',
  distanceMeters?: number,
): MapAddressFeatureCandidate | null {
  const props = featureProperties(feature);
  const best = firstNamedValue(props, langCode);
  if (!best) return null;

  const layerId = openMapLayerId(feature);
  const kind = classifyMapAddressFeature(props, layerId);
  const nameEn = cleanName(props['name:en']) || cleanName(props.name_en) || (languageTag(langCode) === 'en' ? best.name : '');
  const center = featureCenter(feature);

  return {
    name: best.name,
    ...(nameEn ? { nameEn } : {}),
    kind,
    source: `openfreemap:${kind}`,
    category: categoryFromTags(props, kind, layerId),
    distanceMeters,
    osmId: typeof feature?.id === 'number' || typeof feature?.id === 'string' ? feature.id : undefined,
    osmType: layerId || undefined,
    ...center,
    tags: props,
  };
}

export function queryRenderedMapAddressFeatures(
  mapLike: {
    project?: (lngLat: [number, number]) => { x: number; y: number };
    queryRenderedFeatures?: (geometry?: unknown, options?: unknown) => any[];
  } | null | undefined,
  lat: number,
  lon: number,
  langCode = '',
  pixelRadius = 32,
): MapAddressFeatureCandidate[] {
  if (!mapLike?.project || !mapLike.queryRenderedFeatures) return [];
  try {
    const point = mapLike.project([lon, lat]);
    const r = Math.max(4, Math.min(pixelRadius, 80));
    const features = mapLike.queryRenderedFeatures([
      [point.x - r, point.y - r],
      [point.x + r, point.y + r],
    ]);
    const deduped = new Map<string, MapAddressFeatureCandidate>();
    for (const feature of features || []) {
      const candidate = mapAddressFeatureCandidateFromOpenMapFeature(feature, langCode, 0);
      if (!candidate) continue;
      const key = `${candidate.kind}|${candidate.source}|${candidate.name.toLocaleLowerCase()}|${candidate.osmId || ''}`;
      if (!deduped.has(key)) deduped.set(key, candidate);
    }
    return Array.from(deduped.values());
  } catch (error) {
    console.warn('Failed to query rendered map address features:', error);
    return [];
  }
}

export function rankMapAddressFeatureCandidates(candidates: MapAddressFeatureCandidate[]) {
  return [...candidates]
    .filter(candidate => cleanName(candidate.name))
    .sort((a, b) => {
      const bucketDiff = distanceBucket(a) - distanceBucket(b);
      if (bucketDiff !== 0) return bucketDiff;
      const kindDiff = KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind];
      if (kindDiff !== 0) return kindDiff;
      return (a.distanceMeters ?? Number.POSITIVE_INFINITY) - (b.distanceMeters ?? Number.POSITIVE_INFINITY);
    });
}

function mapFeatureDedupeKey(candidate: MapAddressFeatureCandidate) {
  const idPart = candidate.osmId !== undefined ? `${candidate.osmType || ''}:${candidate.osmId}` : '';
  const namePart = cleanName(candidate.name).toLocaleLowerCase();
  return `${candidate.kind}|${candidate.source}|${namePart}|${idPart}`;
}

export function summarizeMapAddressFeatures(
  candidates: MapAddressFeatureCandidate[] | null | undefined,
  limit = 8,
): MapAddressFeatureSummary {
  const deduped: MapAddressFeatureCandidate[] = [];
  const seen = new Set<string>();
  for (const candidate of rankMapAddressFeatureCandidates(candidates || [])) {
    const key = mapFeatureDedupeKey(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(candidate);
    if (deduped.length >= limit) break;
  }

  const byKind: Partial<Record<MapAddressFeatureKind, MapAddressFeatureCandidate>> = {};
  const hierarchy: string[] = [];
  const hierarchySeen = new Set<string>();
  const sources: string[] = [];
  const sourceSeen = new Set<string>();

  for (const feature of deduped) {
    if (!byKind[feature.kind]) byKind[feature.kind] = feature;

    const label = cleanName(feature.name);
    const labelKey = label.toLocaleLowerCase();
    if (label && !hierarchySeen.has(labelKey)) {
      hierarchySeen.add(labelKey);
      hierarchy.push(label);
    }

    if (feature.source && !sourceSeen.has(feature.source)) {
      sourceSeen.add(feature.source);
      sources.push(feature.source);
    }
  }

  return {
    primary: deduped[0],
    features: deduped,
    byKind,
    hierarchy,
    sources,
  };
}

export function buildMapFeatureAddressOverpassQuery(lat: number, lon: number, radius = 140) {
  return `
    [out:json][timeout:25];
    (
      way["highway"]["name"](around:${radius},${lat},${lon});
      relation["highway"]["name"](around:${radius},${lat},${lon});
      node["bridge"]["name"](around:${radius},${lat},${lon});
      way["bridge"]["name"](around:${radius},${lat},${lon});
      relation["bridge"]["name"](around:${radius},${lat},${lon});
      node["man_made"="bridge"]["name"](around:${radius},${lat},${lon});
      way["man_made"="bridge"]["name"](around:${radius},${lat},${lon});
      relation["man_made"="bridge"]["name"](around:${radius},${lat},${lon});
      node["natural"~"peak|ridge|volcano|cliff|valley|gorge|canyon|saddle|water|waterfall|bay|strait|coastline|beach|wetland|marsh|swamp|reef|spring|glacier|ice_field|icefield|ice_cap|ice_sheet|snowfield|grassland|heath|desert|dune|sand|wood|scrub|wilderness|wasteland|moor|moorland|salt_lake|saline_lake|bare_rock|scree|shingle|mudflat|fell|tundra|cave_entrance|island|islet|archipelago|atoll|cay|key"]["name"](around:${radius},${lat},${lon});
      way["natural"~"peak|ridge|volcano|cliff|valley|gorge|canyon|saddle|water|waterfall|bay|strait|coastline|beach|wetland|marsh|swamp|reef|spring|glacier|ice_field|icefield|ice_cap|ice_sheet|snowfield|grassland|heath|desert|dune|sand|wood|scrub|wilderness|wasteland|moor|moorland|salt_lake|saline_lake|bare_rock|scree|shingle|mudflat|fell|tundra|cave_entrance|island|islet|archipelago|atoll|cay|key"]["name"](around:${radius},${lat},${lon});
      relation["natural"~"peak|ridge|volcano|cliff|valley|gorge|canyon|saddle|water|waterfall|bay|strait|coastline|beach|wetland|marsh|swamp|reef|spring|glacier|ice_field|icefield|ice_cap|ice_sheet|snowfield|grassland|heath|desert|dune|sand|wood|scrub|wilderness|wasteland|moor|moorland|salt_lake|saline_lake|bare_rock|scree|shingle|mudflat|fell|tundra|cave_entrance|island|islet|archipelago|atoll|cay|key"]["name"](around:${radius},${lat},${lon});
      node["water"~"river|stream|canal|lake|salt_lake|saline_lake|reservoir|lagoon|pond|basin|pool|bay"]["name"](around:${radius},${lat},${lon});
      way["water"~"river|stream|canal|lake|salt_lake|saline_lake|reservoir|lagoon|pond|basin|pool|bay"]["name"](around:${radius},${lat},${lon});
      relation["water"~"river|stream|canal|lake|salt_lake|saline_lake|reservoir|lagoon|pond|basin|pool|bay"]["name"](around:${radius},${lat},${lon});
      node["waterway"]["name"](around:${radius},${lat},${lon});
      way["waterway"]["name"](around:${radius},${lat},${lon});
      relation["waterway"]["name"](around:${radius},${lat},${lon});
      node["waterway"="waterfall"]["name"](around:${radius},${lat},${lon});
      way["waterway"="waterfall"]["name"](around:${radius},${lat},${lon});
      relation["waterway"="waterfall"]["name"](around:${radius},${lat},${lon});
      node["place"~"island|islet|archipelago|atoll|cay|key|cayo|caye|sea|ocean|bay|strait|mountain|desert"]["name"](around:${radius},${lat},${lon});
      way["place"~"island|islet|archipelago|atoll|cay|key|cayo|caye|sea|ocean|bay|strait|mountain|desert"]["name"](around:${radius},${lat},${lon});
      relation["place"~"island|islet|archipelago|atoll|cay|key|cayo|caye|sea|ocean|bay|strait|mountain|desert"]["name"](around:${radius},${lat},${lon});
      node["leisure"~"park|garden|nature_reserve"]["name"](around:${radius},${lat},${lon});
      way["leisure"~"park|garden|nature_reserve"]["name"](around:${radius},${lat},${lon});
      relation["leisure"~"park|garden|nature_reserve"]["name"](around:${radius},${lat},${lon});
      way["boundary"~"national_park|protected_area"]["name"](around:${radius},${lat},${lon});
      relation["boundary"~"national_park|protected_area"]["name"](around:${radius},${lat},${lon});
      way["landuse"~"recreation_ground|forest|grass|meadow|scrub|shrubland|wilderness|wasteland|moor|moorland|salt_flat|salt_lake|dryland"]["name"](around:${radius},${lat},${lon});
      relation["landuse"~"recreation_ground|forest|grass|meadow|scrub|shrubland|wilderness|wasteland|moor|moorland|salt_flat|salt_lake|dryland"]["name"](around:${radius},${lat},${lon});
      way["landcover"~"grassland|grass|meadow|forest|wood|desert|sand|scrub|shrubland|bare_rock|scree|shingle|tundra|wilderness|wasteland|moor|moorland|salt_flat|salt_lake|dryland|ice|snow|snowfield"]["name"](around:${radius},${lat},${lon});
      relation["landcover"~"grassland|grass|meadow|forest|wood|desert|sand|scrub|shrubland|bare_rock|scree|shingle|tundra|wilderness|wasteland|moor|moorland|salt_flat|salt_lake|dryland|ice|snow|snowfield"]["name"](around:${radius},${lat},${lon});
      node["building"]["name"](around:${radius},${lat},${lon});
      way["building"]["name"](around:${radius},${lat},${lon});
      relation["building"]["name"](around:${radius},${lat},${lon});
      node["amenity"]["name"](around:${radius},${lat},${lon});
      way["amenity"]["name"](around:${radius},${lat},${lon});
      relation["amenity"]["name"](around:${radius},${lat},${lon});
      node["shop"]["name"](around:${radius},${lat},${lon});
      way["shop"]["name"](around:${radius},${lat},${lon});
      relation["shop"]["name"](around:${radius},${lat},${lon});
      node["tourism"]["name"](around:${radius},${lat},${lon});
      way["tourism"]["name"](around:${radius},${lat},${lon});
      relation["tourism"]["name"](around:${radius},${lat},${lon});
      node["historic"]["name"](around:${radius},${lat},${lon});
      way["historic"]["name"](around:${radius},${lat},${lon});
      relation["historic"]["name"](around:${radius},${lat},${lon});
      node["heritage"]["name"](around:${radius},${lat},${lon});
      way["heritage"]["name"](around:${radius},${lat},${lon});
      relation["heritage"]["name"](around:${radius},${lat},${lon});
      node["heritage:operator"~"whc|WHC|unesco|UNESCO"]["name"](around:${radius},${lat},${lon});
      way["heritage:operator"~"whc|WHC|unesco|UNESCO"]["name"](around:${radius},${lat},${lon});
      relation["heritage:operator"~"whc|WHC|unesco|UNESCO"]["name"](around:${radius},${lat},${lon});
      node["world_heritage_site"]["name"](around:${radius},${lat},${lon});
      way["world_heritage_site"]["name"](around:${radius},${lat},${lon});
      relation["world_heritage_site"]["name"](around:${radius},${lat},${lon});
      node["unesco_world_heritage"]["name"](around:${radius},${lat},${lon});
      way["unesco_world_heritage"]["name"](around:${radius},${lat},${lon});
      relation["unesco_world_heritage"]["name"](around:${radius},${lat},${lon});
      node["whc"]["name"](around:${radius},${lat},${lon});
      way["whc"]["name"](around:${radius},${lat},${lon});
      relation["whc"]["name"](around:${radius},${lat},${lon});
      node["unesco"]["name"](around:${radius},${lat},${lon});
      way["unesco"]["name"](around:${radius},${lat},${lon});
      relation["unesco"]["name"](around:${radius},${lat},${lon});
      node["public_transport"]["name"](around:${radius},${lat},${lon});
      way["public_transport"]["name"](around:${radius},${lat},${lon});
      relation["public_transport"]["name"](around:${radius},${lat},${lon});
      node["railway"~"station|halt|tram_stop"]["name"](around:${radius},${lat},${lon});
      way["railway"~"station|halt|tram_stop"]["name"](around:${radius},${lat},${lon});
      relation["railway"~"station|halt|tram_stop"]["name"](around:${radius},${lat},${lon});
    );
    out center tags;
  `;
}

function setAddressFeatureLabel(next: Record<string, any>, key: keyof MapFeatureAddressFields, value: string) {
  if (!cleanName(next[key])) next[key] = value;
}

function categorySpecificDrylandField(category: string): keyof MapFeatureAddressFields | null {
  if (category === 'salt_flat') return 'salt_flat';
  if (category === 'salt_pan') return 'salt_pan';
  if (category === 'dry_lake' || category === 'playa') return 'dry_lake';
  if (category === 'badlands') return 'badlands';
  if (category === 'bare_rock') return 'bare_rock';
  if (category === 'scree') return 'scree';
  if (category === 'shingle') return 'shingle';
  if (category === 'wilderness' || category === 'wasteland' || category === 'moor' || category === 'moorland') return 'wilderness';
  return null;
}

export function applyMapAddressFeatureToAddress<T extends Record<string, any>>(
  address: T,
  feature: MapAddressFeatureCandidate | null | undefined,
): T & Partial<MapFeatureAddressFields> {
  if (!feature?.name) return address as T & Partial<MapFeatureAddressFields>;

  const next: Record<string, any> = {
    ...address,
    map_feature_name: feature.name,
    map_feature_kind: feature.kind,
    map_feature_source: feature.source,
    map_feature_data: feature,
  };
  if (feature.nameEn && !next.map_feature_name_en) {
    next.map_feature_name_en = feature.nameEn;
  }

  if (feature.kind === 'building') {
    if (!cleanName(next.building)) next.building = feature.name;
    if (feature.nameEn && !cleanName(next.building_en)) next.building_en = feature.nameEn;
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'road') {
    if (!cleanName(next.road)) next.road = feature.name;
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'bridge') {
    setAddressFeatureLabel(next, 'bridge', feature.name);
    setAddressFeatureLabel(next, 'road', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'mountain') {
    setAddressFeatureLabel(next, 'mountain', feature.name);
    setAddressFeatureLabel(next, 'mountain_name', feature.name);
    setAddressFeatureLabel(next, 'natural_feature', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'river') {
    const category = cleanName(feature.category).toLowerCase();
    setAddressFeatureLabel(next, 'river', feature.name);
    if (category === 'stream' || category === 'brook' || category === 'creek') {
      setAddressFeatureLabel(next, 'stream', feature.name);
    }
    if (category === 'canal') setAddressFeatureLabel(next, 'canal', feature.name);
    setAddressFeatureLabel(next, 'waterway', feature.name);
    setAddressFeatureLabel(next, 'water', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'lake') {
    setAddressFeatureLabel(next, 'lake', feature.name);
    const category = cleanName(feature.category).toLowerCase();
    if (SALT_LAKE_VALUES.has(category) || (category === 'lake' && feature.tags && truthyTag(feature.tags, 'salt'))) {
      setAddressFeatureLabel(next, 'salt_lake', feature.name);
    }
    if (category === 'reservoir') setAddressFeatureLabel(next, 'reservoir', feature.name);
    if (category === 'lagoon') setAddressFeatureLabel(next, 'lagoon', feature.name);
    if (category === 'oxbow') setAddressFeatureLabel(next, 'oxbow', feature.name);
    setAddressFeatureLabel(next, 'water', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'pond') {
    setAddressFeatureLabel(next, 'pond', feature.name);
    setAddressFeatureLabel(next, 'water', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'bay') {
    setAddressFeatureLabel(next, 'bay', feature.name);
    setAddressFeatureLabel(next, 'water', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'island') {
    const category = cleanName(feature.category).toLowerCase();
    setAddressFeatureLabel(next, 'island', feature.name);
    if (category === 'islet' || category === 'islets') setAddressFeatureLabel(next, 'islet', feature.name);
    if (category === 'archipelago' || category === 'islands' || category === 'isles') {
      setAddressFeatureLabel(next, 'archipelago', feature.name);
      setAddressFeatureLabel(next, 'island_group', feature.name);
    }
    if (category === 'atoll') setAddressFeatureLabel(next, 'atoll', feature.name);
    if (category === 'cay' || category === 'cays' || category === 'cayo' || category === 'caye') setAddressFeatureLabel(next, 'cay', feature.name);
    if (category === 'key' || category === 'keys') setAddressFeatureLabel(next, 'key', feature.name);
    setAddressFeatureLabel(next, 'natural_feature', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'waterfall') {
    setAddressFeatureLabel(next, 'waterfall', feature.name);
    setAddressFeatureLabel(next, 'waterway', feature.name);
    setAddressFeatureLabel(next, 'natural_feature', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'water') {
    setAddressFeatureLabel(next, 'water', feature.name);
    if (feature.tags?.waterway) setAddressFeatureLabel(next, 'waterway', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'park') {
    setAddressFeatureLabel(next, 'park', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'dryland') {
    const category = cleanName(feature.category).toLowerCase();
    setAddressFeatureLabel(next, 'dryland', feature.name);
    const categoryField = categorySpecificDrylandField(category);
    if (categoryField) setAddressFeatureLabel(next, categoryField, feature.name);
    if (SALT_LAKE_VALUES.has(category)) setAddressFeatureLabel(next, 'salt_lake', feature.name);
    setAddressFeatureLabel(next, 'natural_feature', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'glacier') {
    const category = cleanName(feature.category).toLowerCase();
    setAddressFeatureLabel(next, 'glacier', feature.name);
    if (ICE_FIELD_VALUES.has(category)) setAddressFeatureLabel(next, 'ice_field', feature.name);
    setAddressFeatureLabel(next, 'natural_feature', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (
    feature.kind === 'grassland' ||
    feature.kind === 'desert' ||
    feature.kind === 'forest' ||
    feature.kind === 'wetland' ||
    feature.kind === 'beach' ||
    feature.kind === 'cave' ||
    feature.kind === 'valley' ||
    feature.kind === 'reef' ||
    feature.kind === 'spring'
  ) {
    setAddressFeatureLabel(next, feature.kind, feature.name);
    setAddressFeatureLabel(next, 'natural_feature', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'heritage') {
    setAddressFeatureLabel(next, 'heritage_site', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (feature.kind === 'ruins') {
    setAddressFeatureLabel(next, 'ruins', feature.name);
    setAddressFeatureLabel(next, 'poi', feature.name);
    return next as T & Partial<MapFeatureAddressFields>;
  }

  if (!cleanName(next.poi)) next.poi = feature.name;
  return next as T & Partial<MapFeatureAddressFields>;
}

export function applyMapAddressFeaturesToAddress<T extends Record<string, any>>(
  address: T,
  features: MapAddressFeatureCandidate[] | MapAddressFeatureSummary | null | undefined,
): T & Partial<MapFeatureAddressFields> {
  const summary = Array.isArray(features)
    ? summarizeMapAddressFeatures(features)
    : features;
  const primary = summary?.primary || summary?.features?.[0];
  if (!primary) return address as T & Partial<MapFeatureAddressFields>;

  let next = address as T & Partial<MapFeatureAddressFields>;
  for (const feature of summary.features) {
    next = applyMapAddressFeatureToAddress(next, feature);
  }

  next.map_feature_name = primary.name;
  next.map_feature_name_en = primary.nameEn || next.map_feature_name_en;
  next.map_feature_kind = primary.kind;
  next.map_feature_source = primary.source;
  next.map_feature_data = primary;
  next.map_feature_candidates = summary.features;
  next.map_feature_by_kind = summary.byKind;
  next.map_feature_hierarchy = summary.hierarchy;
  next.map_feature_sources = summary.sources;

  return next;
}
