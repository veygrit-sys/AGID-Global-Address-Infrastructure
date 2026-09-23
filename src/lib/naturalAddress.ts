type Landmark = {
  name?: string;
  type?: string;
  distance?: number;
};

export type NaturalAddressResult = {
  kind: 'marine' | 'mountain' | 'island' | 'lake' | 'river' | 'waterfall' | 'waterfront' | 'desert' | 'sparse_natural' | 'nature';
  label: string;
  lines: string[];
  sources: string[];
  confidence: number;
};

export type NaturalAddressDisplayClass = 'marine' | 'mountain' | 'waterside' | 'island' | 'natural';

export type NaturalAddressDisplayProfile = {
  kind: NaturalAddressResult['kind'];
  displayClass: NaturalAddressDisplayClass;
  title: string;
  primaryLine: string;
  secondaryLine: string;
  deliveryInstruction: string;
  verificationMode: string;
  addressPriority: string[];
  evidence: string[];
  confidenceLabel: 'High' | 'Medium' | 'Review';
};

export type NaturalAddressDisplayContext = {
  agid?: string;
  countryCode?: string;
  isSea?: boolean;
  regionName?: string;
  lat?: number;
  lon?: number;
};

type SparseNaturalConfig = {
  keys: string[];
  values: string[];
  mapKinds: string[];
  contextKeys: string[];
  areaLabel: string;
  nearbyLabel: string;
};

const hasValue = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const cleanName = (value: unknown) =>
  hasValue(value) ? value.trim().replace(/\s+/g, ' ') : '';

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const formatDistance = (distance?: number) => {
  if (typeof distance !== 'number' || !Number.isFinite(distance) || distance <= 0) return '';
  if (distance < 1000) return `${Math.round(distance)} m`;
  return `${(distance / 1000).toFixed(distance < 10000 ? 1 : 0)} km`;
};

const marineTypeLabels: Record<string, string> = {
  ocean: 'Ocean',
  sea: 'Sea',
  gulf: 'Gulf',
  bay: 'Bay',
  strait: 'Strait',
  channel: 'Channel',
  trench: 'Trench',
  ridge: 'Ridge',
  seamount: 'Seamount',
  reef: 'Reef',
  deep: 'Deep',
};

const marineAreaRank: Record<string, number> = {
  Ocean: 1,
  Sea: 2,
  Gulf: 3,
  Bay: 4,
  Strait: 5,
  Channel: 5,
};

const normalizeMarineType = (value: unknown) => {
  const cleaned = cleanName(value);
  if (!cleaned) return '';
  const normalized = cleaned.toLowerCase().replace(/[_-]+/g, ' ');
  return marineTypeLabels[normalized] || cleaned.replace(/\b\w/g, char => char.toUpperCase());
};

const isGenericOpenOcean = (value: string) => /^open\s+ocean$/i.test(value);

const getCoordinateLine = (details: any) => {
  const lat = Number(details.lat ?? details.latitude ?? details.coordinates?.lat ?? details.coords?.lat);
  const lon = Number(details.lon ?? details.lng ?? details.longitude ?? details.coordinates?.lon ?? details.coords?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return '';
  return `Coordinates: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
};

const landmarkLabel = (landmark: Landmark) => {
  const name = cleanName(landmark.name);
  if (!name || name === 'Unnamed Feature') return '';
  const type = cleanName(landmark.type);
  const distance = formatDistance(landmark.distance);
  return [name, type && type !== name ? `(${type})` : '', distance ? `- ${distance}` : '']
    .filter(Boolean)
    .join(' ');
};

const getNearbyLine = (label: string, landmarks: Landmark[] = []) => {
  const values = unique(landmarks.map(landmarkLabel)).slice(0, 3);
  return values.length ? `${label}: ${values.join('; ')}` : '';
};

const marineLandmarkLabel = (landmark: Landmark) => {
  const name = cleanName(landmark.name);
  if (!name || name === 'Unnamed Feature') return '';
  const type = normalizeMarineType(landmark.type);
  const distance = formatDistance(landmark.distance);
  return [name, type && type !== name ? `(${type})` : '', distance ? `- ${distance}` : '']
    .filter(Boolean)
    .join(' ');
};

const getNearbyMarineLine = (label: string, landmarks: Landmark[] = []) => {
  const values = unique(landmarks.map(marineLandmarkLabel)).slice(0, 3);
  return values.length ? `${label}: ${values.join('; ')}` : '';
};

const getMarineAreaFeatures = (features: Landmark[] = []) =>
  features
    .map(feature => ({ ...feature, type: normalizeMarineType(feature.type) }))
    .filter(feature => cleanName(feature.name) && marineAreaRank[feature.type || ''])
    .sort((a, b) => marineAreaRank[a.type || ''] - marineAreaRank[b.type || '']);

const getMarineHierarchyLine = (features: Landmark[] = []) => {
  const names = unique(getMarineAreaFeatures(features).map(feature => cleanName(feature.name)));
  return names.length > 1 ? `Marine hierarchy: ${names.join(' > ')}` : '';
};

const getMarineLabel = (seaContext: any, areaFeatures: Landmark[]) => {
  const explicitName = cleanName(seaContext.sea_name);
  if (explicitName && !isGenericOpenOcean(explicitName)) {
    const explicitType = normalizeMarineType(areaFeatures.find(feature => cleanName(feature.name) === explicitName)?.type);
    const moreSpecific = areaFeatures
      .filter(feature => marineAreaRank[normalizeMarineType(feature.type)] > (marineAreaRank[explicitType] || 0))
      .at(-1);
    return cleanName(moreSpecific?.name) || explicitName;
  }

  return cleanName(areaFeatures.at(-1)?.name) || 'Open ocean';
};

const getAreaLine = (details: any) => {
  const area = [
    cleanName(details.suburb || details.neighbourhood || details.city_district || details.district),
    cleanName(details.city || details.town || details.village || details.county),
    cleanName(details.state || details.province || details.region),
    cleanName(details.country),
  ];
  return unique(area).join(', ');
};

const hasStreetAddress = (details: any) =>
  hasValue(details.house_number) || hasValue(details.road) || hasValue(details.street);

const waterNaturalValues = new Set([
  'water',
  'lake',
  'salt_lake',
  'saline_lake',
  'reservoir',
  'lagoon',
  'oxbow',
  'pond',
  'basin',
  'pool',
  'bay',
  'strait',
  'coastline',
  'beach',
  'spring',
  'river',
  'stream',
  'canal',
  'brook',
  'creek',
  'wadi',
  'waterfall',
]);

const sparseNaturalConfigs: SparseNaturalConfig[] = [
  {
    keys: ['dryland', 'wilderness', 'salt_lake', 'salt_flat', 'salt_pan', 'dry_lake', 'badlands', 'bare_rock', 'scree', 'shingle'],
    values: ['dryland', 'wilderness', 'wasteland', 'moor', 'moorland', 'salt_lake', 'saline_lake', 'salt_flat', 'salt_pan', 'dry_lake', 'badlands', 'bare_rock', 'scree', 'shingle', 'playa', 'mudflat'],
    mapKinds: ['dryland'],
    contextKeys: ['drylands'],
    areaLabel: 'Dryland / bare-ground natural address area',
    nearbyLabel: 'Nearby dryland or bare-ground features',
  },
  {
    keys: ['grassland', 'steppe', 'savanna', 'scrub', 'heath', 'tundra'],
    values: ['grassland', 'steppe', 'savanna', 'scrub', 'heath', 'tundra', 'prairie', 'fell'],
    mapKinds: ['grassland'],
    contextKeys: ['grasslands', 'drylands'],
    areaLabel: 'Grassland / open natural address area',
    nearbyLabel: 'Nearby grassland or open-land features',
  },
  {
    keys: ['forest'],
    values: ['forest', 'wood', 'woodland'],
    mapKinds: ['forest'],
    contextKeys: ['forests'],
    areaLabel: 'Forest / woodland natural address area',
    nearbyLabel: 'Nearby forest or woodland features',
  },
  {
    keys: ['wetland'],
    values: ['wetland', 'marsh', 'swamp', 'bog', 'fen', 'reedbed', 'mangrove', 'saltmarsh', 'tidalflat'],
    mapKinds: ['wetland'],
    contextKeys: ['wetlands'],
    areaLabel: 'Wetland / marsh natural address area',
    nearbyLabel: 'Nearby wetland or marsh features',
  },
  {
    keys: ['glacier', 'ice_field'],
    values: ['glacier', 'ice_shelf', 'ice_field', 'icefield', 'ice_cap', 'ice_sheet', 'snowfield', 'firn'],
    mapKinds: ['glacier'],
    contextKeys: ['glaciers'],
    areaLabel: 'Glacier / ice natural address area',
    nearbyLabel: 'Nearby glacier or ice features',
  },
  {
    keys: ['cave', 'valley', 'reef', 'spring', 'beach'],
    values: ['cave', 'cave_entrance', 'valley', 'gorge', 'canyon', 'reef', 'spring', 'hot_spring', 'geyser', 'beach'],
    mapKinds: ['cave', 'valley', 'reef', 'spring', 'beach'],
    contextKeys: ['naturalAreas'],
    areaLabel: 'Named natural feature address area',
    nearbyLabel: 'Nearby named natural features',
  },
];

const contextLandmarks = (natureContext: any, keys: string[]) =>
  keys.flatMap(key => Array.isArray(natureContext?.[key]) ? natureContext[key] : []);

const islandNaturalValues = new Set([
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

const getIslandName = (details: any, natureContext: any) => {
  const explicitName = cleanName(
    details.island ||
    details.islet ||
    details.archipelago ||
    details.island_group ||
    details.atoll ||
    details.cay ||
    details.key
  );
  if (explicitName) return explicitName;

  const mapKind = cleanName(details.map_feature_kind).toLowerCase();
  const mapFeatureName = cleanName(details.map_feature_name) || cleanName(details.natural_feature);
  const typedValue = cleanName(details.place || details.natural || details.class || details.category).toLowerCase();
  if ((mapKind === 'island' || islandNaturalValues.has(typedValue)) && mapFeatureName) return mapFeatureName;

  return cleanName(natureContext?.islands?.[0]?.name);
};

const inlandWaterValues = new Set(['lake', 'salt_lake', 'saline_lake', 'reservoir', 'lagoon', 'oxbow', 'pond', 'basin', 'pool']);
const watercourseValues = new Set(['river', 'stream', 'canal', 'brook', 'creek', 'wadi']);
const waterfallValues = new Set(['waterfall']);

const looksLikeNamedInlandWater = (value: string) =>
  /\b(lake|salt\s*lake|saline\s*lake|reservoir|lagoon|oxbow|pond)\b|湖|塩湖|池|貯水池|潟湖|ラグーン/i.test(value);

const looksLikeNamedRiver = (value: string) =>
  /\b(river|stream|brook|creek|wadi|canal)\b|川|河|水路|運河/i.test(value);

const looksLikeNamedWaterfall = (value: string) =>
  /\b(waterfall|falls|cascade|cataract)\b|滝|瀑布/i.test(value);

const getInlandWaterName = (details: any, natureContext: any) => {
  const explicitName = cleanName(details.salt_lake || details.lake || details.reservoir || details.lagoon || details.oxbow || details.pond);
  if (explicitName) return explicitName;

  const mapKind = cleanName(details.map_feature_kind).toLowerCase();
  const rawWater = cleanName(details.water);
  const waterValue = rawWater.toLowerCase();
  const namedWater = rawWater && !inlandWaterValues.has(waterValue) && looksLikeNamedInlandWater(rawWater)
    ? rawWater
    : '';
  if (namedWater) return namedWater;

  const typedWater = cleanName(details.water || details.natural || details.class || details.category).toLowerCase();
  if (mapKind === 'lake' || mapKind === 'pond' || inlandWaterValues.has(typedWater)) {
    return cleanName(details.map_feature_name || details.natural_feature);
  }

  return cleanName(natureContext?.lakes?.[0]?.name);
};

const getRiverName = (details: any) => {
  const explicitName = cleanName(details.river || details.stream || details.canal);
  if (explicitName) return explicitName;

  const rawWaterway = cleanName(details.waterway);
  const waterwayValue = rawWaterway.toLowerCase();
  if (rawWaterway && !watercourseValues.has(waterwayValue) && looksLikeNamedRiver(rawWaterway)) return rawWaterway;

  const mapKind = cleanName(details.map_feature_kind).toLowerCase();
  const mapFeatureName = cleanName(details.map_feature_name) || cleanName(details.natural_feature);
  const typedWatercourse = cleanName(details.waterway || details.water || details.natural || details.class || details.category).toLowerCase();
  if (mapKind === 'river' || watercourseValues.has(typedWatercourse)) return mapFeatureName;

  return '';
};

const getWaterfallName = (details: any) => {
  const explicitName = cleanName(details.waterfall);
  if (explicitName) return explicitName;

  const rawWaterway = cleanName(details.waterway);
  if (rawWaterway && rawWaterway.toLowerCase() !== 'waterfall' && looksLikeNamedWaterfall(rawWaterway)) return rawWaterway;

  const mapKind = cleanName(details.map_feature_kind).toLowerCase();
  const mapFeatureName = cleanName(details.map_feature_name) || cleanName(details.natural_feature);
  const typedWaterfall = cleanName(details.waterway || details.natural || details.class || details.category).toLowerCase();
  if (mapKind === 'waterfall' || waterfallValues.has(typedWaterfall)) return mapFeatureName;

  return '';
};

const findSparseNaturalAddress = (details: any, natureContext: any) => {
  const mapKind = cleanName(details.map_feature_kind).toLowerCase();
  const naturalValue = cleanName(details.natural || details.landcover || details.landuse || details.land_cover).toLowerCase();
  const mapFeatureName = cleanName(details.map_feature_name) || cleanName(details.natural_feature);

  for (const config of sparseNaturalConfigs) {
    const explicitName = config.keys.map(key => cleanName(details[key])).find(Boolean);
    const nearby = contextLandmarks(natureContext, config.contextKeys);
    const matchesMapKind = config.mapKinds.includes(mapKind);
    const matchesNaturalValue = config.values.includes(naturalValue);
    const label = explicitName ||
      (matchesMapKind || matchesNaturalValue ? mapFeatureName : '') ||
      cleanName(nearby[0]?.name);

    if (label) return { ...config, label, nearby };
  }

  return null;
};

export function buildNaturalAddress(details: any): NaturalAddressResult | null {
  if (!details || typeof details !== 'object') return null;

  const seaContext = details.sea_context;
  const natureContext = details.nature_context;
  const plusCode = cleanName(details.plus_code?.global_code || details.plus_code?.plus_code || details.plus_code);
  const areaLine = getAreaLine(details);
  const sources = new Set<string>();

  if (seaContext) {
    sources.add('Marine Regions');
    sources.add('OpenStreetMap');
    if (typeof seaContext.bathymetry === 'number') sources.add('GEBCO/open bathymetry');
    if (plusCode) sources.add('Google Open Location Code');

    const seaFeatures: Landmark[] = seaContext.features ?? [];
    const marineAreaFeatures = getMarineAreaFeatures(seaFeatures);
    const marineAreaNames = new Set(marineAreaFeatures.map(feature => cleanName(feature.name)));
    const seabedFeatures = seaFeatures.filter(feature => !marineAreaNames.has(cleanName(feature.name)));
    const seaName = getMarineLabel(seaContext, marineAreaFeatures);
    const depth = typeof seaContext.bathymetry === 'number' && seaContext.bathymetry < 0
      ? `Depth: ${Math.round(Math.abs(seaContext.bathymetry))} m below sea level`
      : '';

    const lines = [
      seaName,
      'Marine address area (non-postal)',
      getMarineHierarchyLine(seaFeatures),
      cleanName(seaContext.marine_protected_area) ? `Marine protected area: ${cleanName(seaContext.marine_protected_area)}` : '',
      getNearbyMarineLine('Nearby marine or seabed features', seabedFeatures),
      depth,
      areaLine,
      getCoordinateLine(details),
      plusCode ? `Plus Code: ${plusCode}` : '',
      `Sources: ${Array.from(sources).join(', ')}`,
    ].filter(Boolean);

    return {
      kind: 'marine',
      label: seaName,
      lines,
      sources: Array.from(sources),
      confidence: seaName === 'Open ocean' ? 0.66 : 0.86,
    };
  }

  const mountainName = cleanName(details.mountain_name) || cleanName(natureContext?.mountains?.[0]?.name);
  if (mountainName && !hasStreetAddress(details)) {
    sources.add('OpenStreetMap');
    if (typeof details.elevation === 'number') sources.add('open elevation');

    const elevation = typeof details.elevation === 'number'
      ? `Elevation: ${Math.round(details.elevation)} m`
      : '';
    const lines = [
      mountainName,
      'Mountain / highland address area',
      elevation,
      getNearbyLine('Nearby peaks', natureContext?.mountains),
      getNearbyLine('Nearby shelters or landmarks', details.mountain_context?.landmarks),
      areaLine,
      getCoordinateLine(details),
      plusCode ? `Plus Code: ${plusCode}` : '',
      `Sources: ${Array.from(sources).join(', ')}`,
    ].filter(Boolean);

    return {
      kind: 'mountain',
      label: mountainName,
      lines,
      sources: Array.from(sources),
      confidence: 0.82,
    };
  }

  const islands: Landmark[] = natureContext?.islands ?? [];
  const beaches: Landmark[] = natureContext?.beaches ?? [];
  const ports: Landmark[] = natureContext?.ports ?? [];
  const rivers: Landmark[] = natureContext?.rivers ?? [];
  const waterfalls: Landmark[] = natureContext?.waterfalls ?? [];
  const lakes: Landmark[] = natureContext?.lakes ?? [];
  const islandName = getIslandName(details, natureContext);
  if ((islandName || islands.length > 0) && !hasStreetAddress(details)) {
    sources.add('OpenStreetMap');
    if (islands.length > 0) sources.add('open island gazetteer');
    if (plusCode) sources.add('Google Open Location Code');

    const label = islandName || cleanName(islands[0]?.name) || 'Island area';
    const lines = [
      label,
      'Island / archipelago address area',
      getNearbyLine('Nearby islands or archipelagos', islands),
      getNearbyLine('Nearby beaches', beaches),
      getNearbyLine('Nearby ports or harbours', ports),
      areaLine,
      getCoordinateLine(details),
      plusCode ? `Plus Code: ${plusCode}` : '',
      `Sources: ${Array.from(sources).join(', ')}`,
    ].filter(Boolean);

    return {
      kind: 'island',
      label,
      lines,
      sources: Array.from(sources),
      confidence: islandName ? 0.8 : 0.7,
    };
  }

  const explicitWaterfallName = getWaterfallName(details);
  if (explicitWaterfallName && !hasStreetAddress(details)) {
    sources.add('OpenStreetMap');
    sources.add('open hydrology data');
    if (hasValue(details.flood_risk)) sources.add('open water-risk model');
    if (plusCode) sources.add('Google Open Location Code');

    const lines = [
      explicitWaterfallName,
      'Waterfall / hydrology address area',
      getNearbyLine('Nearby waterfalls', waterfalls),
      getNearbyLine('Nearby rivers or watercourses', rivers),
      getNearbyLine('Nearby lakes or reservoirs', lakes),
      hasValue(details.flood_risk) ? `Water risk: ${details.flood_risk}` : '',
      areaLine,
      getCoordinateLine(details),
      plusCode ? `Plus Code: ${plusCode}` : '',
      `Sources: ${Array.from(sources).join(', ')}`,
    ].filter(Boolean);

    return {
      kind: 'waterfall',
      label: explicitWaterfallName,
      lines,
      sources: Array.from(sources),
      confidence: 0.8,
    };
  }

  const explicitRiverName = getRiverName(details);
  if (explicitRiverName && !hasStreetAddress(details)) {
    sources.add('OpenStreetMap');
    sources.add('open hydrology data');
    if (hasValue(details.flood_risk)) sources.add('open water-risk model');
    if (plusCode) sources.add('Google Open Location Code');

    const lines = [
      explicitRiverName,
      'River / watercourse address area',
      getNearbyLine('Nearby rivers or watercourses', rivers),
      getNearbyLine('Nearby waterfalls', waterfalls),
      getNearbyLine('Nearby lakes or reservoirs', lakes),
      hasValue(details.flood_risk) ? `Water risk: ${details.flood_risk}` : '',
      areaLine,
      getCoordinateLine(details),
      plusCode ? `Plus Code: ${plusCode}` : '',
      `Sources: ${Array.from(sources).join(', ')}`,
    ].filter(Boolean);

    return {
      kind: 'river',
      label: explicitRiverName,
      lines,
      sources: Array.from(sources),
      confidence: 0.79,
    };
  }

  const inlandWaterName = getInlandWaterName(details, natureContext);
  if ((inlandWaterName || lakes.length > 0) && !hasStreetAddress(details)) {
    sources.add('OpenStreetMap');
    if (lakes.length > 0 || cleanName(details.water || details.natural)) sources.add('open hydrology data');
    if (hasValue(details.flood_risk)) sources.add('open water-risk model');
    if (plusCode) sources.add('Google Open Location Code');

    const label = inlandWaterName || cleanName(lakes[0]?.name) || 'Inland water area';
    const areaLabel = cleanName(details.salt_lake) ? 'Lake / salt-lake inland water address area' : 'Lake / inland water address area';
    const lines = [
      label,
      areaLabel,
      getNearbyLine('Nearby lakes or reservoirs', lakes),
      getNearbyLine('Nearby beaches', beaches),
      getNearbyLine('Nearby ports or harbours', ports),
      hasValue(details.flood_risk) ? `Water risk: ${details.flood_risk}` : '',
      areaLine,
      getCoordinateLine(details),
      plusCode ? `Plus Code: ${plusCode}` : '',
      `Sources: ${Array.from(sources).join(', ')}`,
    ].filter(Boolean);

    return {
      kind: 'lake',
      label,
      lines,
      sources: Array.from(sources),
      confidence: inlandWaterName ? 0.8 : 0.7,
    };
  }

  if ((waterfalls.length > 0 || rivers.length > 0) && !hasStreetAddress(details)) {
    sources.add('OpenStreetMap');
    sources.add('open hydrology data');
    if (hasValue(details.flood_risk)) sources.add('open water-risk model');
    if (plusCode) sources.add('Google Open Location Code');

    const isWaterfall = waterfalls.length > 0;
    const label = cleanName((isWaterfall ? waterfalls[0] : rivers[0])?.name) || (isWaterfall ? 'Waterfall area' : 'River area');
    const lines = [
      label,
      isWaterfall ? 'Waterfall / hydrology address area' : 'River / watercourse address area',
      getNearbyLine('Nearby waterfalls', waterfalls),
      getNearbyLine('Nearby rivers or watercourses', rivers),
      getNearbyLine('Nearby lakes or reservoirs', lakes),
      hasValue(details.flood_risk) ? `Water risk: ${details.flood_risk}` : '',
      areaLine,
      getCoordinateLine(details),
      plusCode ? `Plus Code: ${plusCode}` : '',
      `Sources: ${Array.from(sources).join(', ')}`,
    ].filter(Boolean);

    return {
      kind: isWaterfall ? 'waterfall' : 'river',
      label,
      lines,
      sources: Array.from(sources),
      confidence: isWaterfall ? 0.74 : 0.72,
    };
  }

  const waterName = cleanName(
    details.waterfall ||
    details.waterway ||
    details.river ||
    details.stream ||
    details.canal ||
    details.lake ||
    details.reservoir ||
    details.lagoon ||
    details.oxbow ||
    details.pond ||
    details.bay ||
    details.water ||
    (waterNaturalValues.has(cleanName(details.natural).toLowerCase()) ? details.natural : '')
  );
  const hasWaterfrontContext = waterName || beaches.length > 0 || ports.length > 0 || hasValue(details.flood_risk);

  if (hasWaterfrontContext && !hasStreetAddress(details)) {
    sources.add('OpenStreetMap');
    if (hasValue(details.flood_risk)) sources.add('open water-risk model');
    const label = waterName || cleanName(beaches[0]?.name) || cleanName(ports[0]?.name) || 'Waterfront area';
    const lines = [
      label,
      'Waterfront / hydrology address area',
      getNearbyLine('Nearby beaches', beaches),
      getNearbyLine('Nearby ports or harbours', ports),
      hasValue(details.flood_risk) ? `Water risk: ${details.flood_risk}` : '',
      areaLine,
      plusCode ? `Plus Code: ${plusCode}` : '',
      `Sources: ${Array.from(sources).join(', ')}`,
    ].filter(Boolean);

    return {
      kind: 'waterfront',
      label,
      lines,
      sources: Array.from(sources),
      confidence: waterName ? 0.78 : 0.68,
    };
  }

  const deserts: Landmark[] = natureContext?.deserts ?? [];
  const desertName = cleanName(details.desert || details.dune) || cleanName(deserts[0]?.name);
  if (desertName && !hasStreetAddress(details)) {
    sources.add('OpenStreetMap');
    if (plusCode) sources.add('Google Open Location Code');
    const lines = [
      desertName,
      'Desert / arid natural address area',
      getNearbyLine('Nearby desert or dune features', deserts),
      areaLine,
      getCoordinateLine(details),
      plusCode ? `Plus Code: ${plusCode}` : '',
      `Sources: ${Array.from(sources).join(', ')}`,
    ].filter(Boolean);

    return {
      kind: 'desert',
      label: desertName,
      lines,
      sources: Array.from(sources),
      confidence: deserts.length > 0 ? 0.74 : 0.68,
    };
  }

  const sparseNatural = findSparseNaturalAddress(details, natureContext);
  if (sparseNatural && !hasStreetAddress(details)) {
    sources.add('OpenStreetMap');
    if (cleanName(details.land_cover || details.landcover || details.landuse || natureContext?.landCover)) {
      sources.add('open land-cover data');
    }
    if (plusCode) sources.add('Google Open Location Code');

    const lines = [
      sparseNatural.label,
      sparseNatural.areaLabel,
      getNearbyLine(sparseNatural.nearbyLabel, sparseNatural.nearby),
      areaLine,
      getCoordinateLine(details),
      plusCode ? `Plus Code: ${plusCode}` : '',
      `Sources: ${Array.from(sources).join(', ')}`,
    ].filter(Boolean);

    return {
      kind: 'sparse_natural',
      label: sparseNatural.label,
      lines,
      sources: Array.from(sources),
      confidence: sparseNatural.nearby.length > 0 ? 0.72 : 0.64,
    };
  }

  return null;
}

const naturalDisplayRules: Record<NaturalAddressResult['kind'], {
  displayClass: NaturalAddressDisplayClass;
  title: string;
  deliveryInstruction: string;
  verificationMode: string;
  addressPriority: string[];
}> = {
  marine: {
    displayClass: 'marine',
    title: 'Marine / offshore address',
    deliveryInstruction: 'Use AGID, coordinates, marine area, and nearest port or shore handoff; postal code is secondary.',
    verificationMode: 'AGID + marine region + coordinate verification',
    addressPriority: ['AGID cell', 'Marine area', 'Coordinates', 'Port/shore handoff'],
  },
  mountain: {
    displayClass: 'mountain',
    title: 'Mountain / highland address',
    deliveryInstruction: 'Use peak, trail, shelter or trailhead context with AGID; route access matters more than street order.',
    verificationMode: 'AGID + elevation + nearby peak/trail evidence',
    addressPriority: ['AGID cell', 'Peak/highland name', 'Trail/shelter context', 'Nearest settlement'],
  },
  island: {
    displayClass: 'island',
    title: 'Island / archipelago address',
    deliveryInstruction: 'Use island hierarchy, harbour or beach landing context, AGID, and country or territory name.',
    verificationMode: 'AGID + island gazetteer + coastal feature evidence',
    addressPriority: ['Island/atoll', 'Landing point', 'Country/territory', 'AGID cell'],
  },
  lake: {
    displayClass: 'waterside',
    title: 'Lake / inland-water address',
    deliveryInstruction: 'Use waterbody name, side or shore context, reachable road or landing point, and AGID.',
    verificationMode: 'AGID + hydrology + nearby shore/port evidence',
    addressPriority: ['Water feature', 'Shore/side context', 'Reachable road or landing', 'AGID cell'],
  },
  river: {
    displayClass: 'waterside',
    title: 'River / watercourse address',
    deliveryInstruction: 'Use river or canal name, bank/bridge/landing context, nearby settlement, and AGID.',
    verificationMode: 'AGID + hydrology + bridge/landing evidence',
    addressPriority: ['Watercourse', 'Bank/bridge/landing', 'Nearest settlement', 'AGID cell'],
  },
  waterfall: {
    displayClass: 'waterside',
    title: 'Waterfall / hydrology address',
    deliveryInstruction: 'Use waterfall name, trail or viewing-area context, water-risk evidence, and AGID.',
    verificationMode: 'AGID + hydrology + trail/access evidence',
    addressPriority: ['Waterfall', 'Trail/access point', 'Water risk', 'AGID cell'],
  },
  waterfront: {
    displayClass: 'waterside',
    title: 'Waterfront / coastal address',
    deliveryInstruction: 'Use beach, pier, marina, harbour or shore context with AGID and the nearest road or settlement.',
    verificationMode: 'AGID + waterfront feature + access evidence',
    addressPriority: ['Waterfront feature', 'Access point', 'Nearest road/settlement', 'AGID cell'],
  },
  desert: {
    displayClass: 'natural',
    title: 'Sparse natural address',
    deliveryInstruction: 'Use named natural feature, AGID, coordinates, and the closest reachable handoff point.',
    verificationMode: 'AGID + natural feature + coordinate verification',
    addressPriority: ['Natural feature', 'Coordinates', 'Handoff point', 'AGID cell'],
  },
  sparse_natural: {
    displayClass: 'natural',
    title: 'Sparse natural address',
    deliveryInstruction: 'Use named natural feature, AGID, coordinates, and the closest reachable handoff point.',
    verificationMode: 'AGID + natural feature + coordinate verification',
    addressPriority: ['Natural feature', 'Coordinates', 'Handoff point', 'AGID cell'],
  },
  nature: {
    displayClass: 'natural',
    title: 'Natural address',
    deliveryInstruction: 'Use the strongest named feature, AGID, coordinates, and access evidence.',
    verificationMode: 'AGID + open-source feature evidence',
    addressPriority: ['Named feature', 'Coordinates', 'Access context', 'AGID cell'],
  },
};

const confidenceLabel = (confidence: number): NaturalAddressDisplayProfile['confidenceLabel'] => {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.68) return 'Medium';
  return 'Review';
};

const sourceLinesRemoved = (lines: string[]) => lines.filter(line => !/^Sources:/i.test(line));

const collectNaturalEvidence = (details: any, result: NaturalAddressResult | null, context: NaturalAddressDisplayContext) => {
  const evidence = [
    ...(result?.sources || []),
    context.agid ? 'AGID cell' : '',
    context.isSea ? 'AGID sea region' : '',
    cleanName(details?.map_feature_source),
    ...(Array.isArray(details?.map_feature_sources) ? details.map_feature_sources.map(cleanName) : []),
    ...(Array.isArray(details?.address_analysis?.sources) ? details.address_analysis.sources.map(cleanName) : []),
  ];
  return unique(evidence).slice(0, 8);
};

const coordinateDisplayLine = (details: any, context: NaturalAddressDisplayContext) => {
  const existing = getCoordinateLine(details || {});
  if (existing) return existing;
  if (typeof context.lat !== 'number' || typeof context.lon !== 'number') return '';
  if (!Number.isFinite(context.lat) || !Number.isFinite(context.lon)) return '';
  return `Coordinates: ${context.lat.toFixed(5)}, ${context.lon.toFixed(5)}`;
};

function buildMarineFallbackProfile(
  details: any,
  context: NaturalAddressDisplayContext,
): NaturalAddressDisplayProfile | null {
  if (!context.isSea && !cleanName(context.regionName)) return null;
  const rule = naturalDisplayRules.marine;
  const label = cleanName(context.regionName) || 'Marine area';
  const coordinateLine = coordinateDisplayLine(details, context);
  const evidence = collectNaturalEvidence(details, null, context);

  return {
    kind: 'marine',
    displayClass: rule.displayClass,
    title: rule.title,
    primaryLine: label,
    secondaryLine: coordinateLine || 'Marine address area (non-postal)',
    deliveryInstruction: rule.deliveryInstruction,
    verificationMode: rule.verificationMode,
    addressPriority: rule.addressPriority,
    evidence: evidence.length ? evidence : ['AGID sea region'],
    confidenceLabel: 'Review',
  };
}

export function buildNaturalAddressDisplayProfile(
  details: any,
  context: NaturalAddressDisplayContext = {},
): NaturalAddressDisplayProfile | null {
  const normalizedDetails = details && typeof details === 'object' ? details : {};
  const naturalAddress = buildNaturalAddress(normalizedDetails);
  if (!naturalAddress) return buildMarineFallbackProfile(normalizedDetails, context);

  const rule = naturalDisplayRules[naturalAddress.kind];
  const visibleLines = sourceLinesRemoved(naturalAddress.lines);
  const coordinateLine = coordinateDisplayLine(normalizedDetails, context);
  const secondaryLine =
    visibleLines.find(line => /address area/i.test(line)) ||
    visibleLines.find(line => /^Nearby|^Marine hierarchy|^Water risk|^Elevation|^Depth/i.test(line)) ||
    coordinateLine ||
    rule.title;

  return {
    kind: naturalAddress.kind,
    displayClass: rule.displayClass,
    title: rule.title,
    primaryLine: visibleLines[0] || naturalAddress.label,
    secondaryLine,
    deliveryInstruction: rule.deliveryInstruction,
    verificationMode: rule.verificationMode,
    addressPriority: rule.addressPriority,
    evidence: collectNaturalEvidence(normalizedDetails, naturalAddress, context),
    confidenceLabel: confidenceLabel(naturalAddress.confidence),
  };
}

export function formatNaturalAddress(details: any): string | null {
  const naturalAddress = buildNaturalAddress(details);
  return naturalAddress ? naturalAddress.lines.join('\n') : null;
}
