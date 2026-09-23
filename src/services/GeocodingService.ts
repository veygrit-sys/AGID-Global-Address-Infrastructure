import Dexie,{ Table } from 'dexie';
import { getAddressFormat } from '../data/address_formats';
import { analyzeAddress } from '../lib/addressIntelligence';
import { rankAddressCandidatesByMorphism,type AddressMorphismCandidate } from '../lib/addressMorphism';
import { buildMorphismCandidateFromSources,detectNaturalAddressContext } from '../lib/addressMorphismSources';
import {
AdvancedSearchOptions,
buildNominatimSearchUrl,
matchesAdvancedSearchCategory,
matchesAdvancedSearchLocation,
normalizeAdvancedSearchOptions,
} from '../lib/advancedSearch';
import type { BuildingNameCandidate } from '../lib/buildingName';
import type {
MapAddressFeatureCandidate,
MapAddressFeatureSummary,
} from '../lib/mapFeatureAddress';
import { parseAddressWithOptionalLibpostal } from '../lib/libpostalGateway';
import { latLonToOSGrid } from '../lib/osgrid';
import { buildPlaceSearchLanguageProfile } from '../lib/placeSearchLanguage';
import { expandSearchQuery,normalizeSearchText,scoreSearchCandidate } from '../lib/searchQuery';
import { getCachedAddressRetrieval } from '../lib/addressRetrievalCache';
import {
ADDRESS_RETRIEVAL_RETRIES,
ADDRESS_RETRIEVAL_TIMEOUTS,
withAddressLookupTimeout,
} from '../lib/addressRetrievalPolicy';
import { AfricaContext,fetchAfricaContext,fetchAfricaOfficialAddress,fetchEgyptAddress,fetchSouthAfricaAddress } from './AfricaService';
import { CaribbeanContext,fetchCaribbeanContext,fetchCaribbeanOfficialAddress } from './CaribbeanService';
import { CentralAmericaContext,fetchCentralAmericaContext,fetchCentralAmericaOfficialAddress } from './CentralAmericaService';
import { CentralAsiaContext,fetchCentralAsiaContext } from './CentralAsiaService';
import type { EastAsiaContext } from './EastAsiaService';
import { fetchAustrianAddress,fetchBelgianAddress,fetchBelgiumBestAddress,fetchCypriotAddress,fetchCzechRuianAddress,fetchDutchAddress,fetchEEBalkanAddress,fetchEstonianAddress,fetchFrenchAddress,fetchGermanAddress,fetchGreekAddress,fetchIcelandicAddress,fetchIrelandAddress,fetchItalianAddress,fetchLatvianAddress,fetchLithuanianAddress,fetchLuxembourgAddress,fetchMalteseAddress,fetchMicrostateAddress,fetchPolishAddress,fetchPortugueseAddress,fetchSpainCatastroAddress,fetchSpanishAddress,fetchSwedishAddress,fetchSwissAddress,fetchUKAddress } from './EuropePostalService';
import { fetchHeritageContext,HeritageContext } from './HeritageService';
import { fetchJapaneseGeoContext,JapaneseGeoContext } from './JapaneseGeoService';
import { fetchNatureContext,NatureContext } from './NatureService';
import { fetchDanishAddress,fetchFinnishAddress,fetchNordicContext,fetchNordicWeather,fetchNorwegianAddress,NordicContext } from './NordicService';
import { fetchCanadaOfficialAddress,fetchMexicoOfficialAddress,fetchNorthAmericaContext,fetchUSCensusData,NorthAmericaContext } from './NorthAmericaService';
import { fetchOceaniaContext,OceaniaContext } from './OceaniaService';
import { fetchPolarContext,fetchPolarOfficialData,PolarContext } from './PolarService';
import { fetchRussiaContext,RussiaContext } from './RussiaService';
import { fetchSeaContext,SeaContext } from './SeaService';
import { fetchBrazilOfficialAddress,fetchBrazilViaCEP,fetchSouthAmericaContext,fetchSouthAmericaOfficialAddress,SouthAmericaContext } from './SouthAmericaService';
import { fetchIndiaOfficialAddress,fetchSouthAsiaContext,SouthAsiaContext } from './SouthAsiaService';
import { fetchSoutheastAsiaContext,fetchSoutheastAsiaOfficialAddress,SoutheastAsiaContext } from './SoutheastAsiaService';
import { fetchUKIrelandContext,fetchUKPostcodeDetails,UKIrelandContext } from './UKIrelandService';
import { fetchWestAsiaContext,RegionalLandmark } from './WestAsiaService';

// --- Types ---

export interface OSMPlace {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat: number;
  lon: number;
  name: string;
  nameEn?: string;
  category: string;
  type_name: string;
  address?: Record<string, string>;
  tags: Record<string, string>;
  lastUpdated: number;
}

import { calculateMountainClass } from '../lib/agid';

import { fetchGlobalContext,fetchGlobalPostcodeDetails,fetchPlusCode,GlobalWeather,LocalTimeInfo } from './GlobalContextService';
import { apiEndpoints } from '../lib/apiEndpoints';
import { dedupeGeocodingSearchResults,photonFeatureToGeocodingResult,type GeocodingSearchResult } from '../lib/geocodingSearch';

type MapFeatureAddressModule = typeof import('../lib/mapFeatureAddress');
let mapFeatureAddressModulePromise: Promise<MapFeatureAddressModule> | null = null;

function loadMapFeatureAddressModule() {
  mapFeatureAddressModulePromise ??= import('../lib/mapFeatureAddress');
  return mapFeatureAddressModulePromise;
}

type BuildingNameModule = typeof import('../lib/buildingName');
let buildingNameModulePromise: Promise<BuildingNameModule> | null = null;

function loadBuildingNameModule() {
  buildingNameModulePromise ??= import('../lib/buildingName');
  return buildingNameModulePromise;
}

type OvertureMapsModule = typeof import('../lib/overtureMaps');
let overtureMapsModulePromise: Promise<OvertureMapsModule> | null = null;

function loadOvertureMapsModule() {
  overtureMapsModulePromise ??= import('../lib/overtureMaps');
  return overtureMapsModulePromise;
}

async function enrichAnalysisWithOptionalLibpostal(analysis: ReturnType<typeof analyzeAddress>, displayName?: string, countryCode?: string) {
  if (!displayName) return analysis;

  const parsed = await parseAddressWithOptionalLibpostal({
    text: displayName,
    countryCode,
    endpoint: '/api/address/parse',
  });

  if (!parsed.available) return analysis;

  return {
    ...analysis,
    parsed: {
      ...analysis.parsed,
      ...parsed.canonical,
    },
    canonical: {
      ...parsed.canonical,
      ...analysis.canonical,
    },
    sources: Array.from(new Set([...analysis.sources, 'libpostal'])),
    confidence: Math.max(analysis.confidence, 0.9),
  };
}

export interface ParsedAddress {
  houseNumber?: string;
  road?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  plus_code?: string | null;
  country?: string;
  building?: string;
  building_en?: string;
  building_name_source?: string;
  building_name_data?: BuildingNameCandidate | null;
  map_feature_name?: string;
  map_feature_name_en?: string;
  map_feature_kind?: string;
  map_feature_source?: string;
  map_feature_data?: MapAddressFeatureCandidate | null;
  map_feature_candidates?: MapAddressFeatureCandidate[];
  map_feature_by_kind?: MapAddressFeatureSummary['byKind'];
  map_feature_hierarchy?: string[];
  map_feature_sources?: string[];
  poi?: string;
  elevation?: number;
  mountain_class?: number;
  confidence?: number;
  entropy?: number;
  delivery_difficulty?: string;
  flood_risk?: string;
  mountain_name?: string;
  landslide_risk?: string;
  seismic_risk?: string;
  land_cover?: string;
  global_context?: { weather: GlobalWeather | null, time: LocalTimeInfo | null };
  west_asia_context?: RegionalLandmark[];
  russia_context?: RussiaContext;
  central_asia_context?: CentralAsiaContext;
  south_asia_context?: SouthAsiaContext;
  uk_ireland_context?: UKIrelandContext;
  nordic_context?: NordicContext;
  asia_oceania_data?: any;
  oceania_context?: OceaniaContext;
  east_asia_context?: EastAsiaContext;
  north_america_context?: NorthAmericaContext;
  south_america_context?: SouthAmericaContext;
  caribbean_context?: CaribbeanContext;
  central_america_context?: CentralAmericaContext;
  southeast_asia_context?: SoutheastAsiaContext;
  africa_context?: AfricaContext;
  us_census_data?: any;
  official_regional_data?: any;
  polar_context?: PolarContext;
  polar_official_data?: any;
  nature_context?: NatureContext;
  sea_context?: SeaContext | null;
  heritage_context?: HeritageContext;
  japanese_geo_context?: JapaneseGeoContext | null;
}

// --- Database ---

class PlaceDatabase extends Dexie {
  places!: Table<OSMPlace>;

  constructor() {
    super('AGID_PlaceDB');
    this.version(1).stores({
      places: 'id, name, category, [lat+lon]'
    });
  }
}

export const db = new PlaceDatabase();

// --- Normalization & Parsing (libpostal-like) ---

/**
 * Normalizes address text by standardizing common abbreviations and formatting.
 */
export function normalizeAddress(text: string): string {
  return normalizeSearchText(text);
}

/**
 * Parses an address string into components.
 * This is a rule-based parser as a lightweight alternative to libpostal.
 */
export function parseAddress(text: string): ParsedAddress {
  const parsed = analyzeAddress({ displayName: text, sources: ['parser'] }).canonical;
  return {
    houseNumber: parsed.house_number,
    road: parsed.road,
    suburb: parsed.suburb || parsed.subdistrict,
    city: parsed.city,
    state: parsed.state,
    postcode: parsed.postcode,
    country: parsed.country,
    poi: parsed.poi,
  };
}

// --- OSM Data (Overpass API) ---

import { fetchWithRetry } from '../lib/utils';

/**
 * Fetches nearby OSM places using the server-side Overpass proxy.
 */
export async function fetchNearbyOSMPlaces(lat: number, lon: number, radius: number = 500): Promise<OSMPlace[]> {
  const query = `
    [out:json][timeout:25];
    (
      node["name"](around:${radius},${lat},${lon});
      way["name"](around:${radius},${lat},${lon});
      relation["name"](around:${radius},${lat},${lon});
    );
    out center;
  `;

  try {
    const response = await fetchWithRetry('/api/overpass', {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Overpass Proxy error (${response.status})`;
      try {
        const errJson = JSON.parse(errorText);
        if (errJson.error) errorMessage += `: ${errJson.error}`;
      } catch (e) {
        if (errorText) errorMessage += `: ${errorText.substring(0, 100)}`;
      }
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.elements) return [];

    const places: OSMPlace[] = data.elements.map((el: any) => ({
      id: el.id,
      type: el.type,
      lat: el.lat || el.center?.lat,
      lon: el.lon || el.center?.lon,
      name: el.tags.name,
      nameEn: el.tags['name:en'],
      category: el.tags.amenity || el.tags.shop || el.tags.tourism || el.tags.leisure || 'place',
      type_name: el.tags.place || el.tags.highway || 'other',
      tags: el.tags,
      lastUpdated: Date.now()
    }));

    // Save to local DB
    if (places.length > 0) {
      await db.places.bulkPut(places);
    }

    return places;
  } catch (error) {
    console.error(`Failed to fetch from Overpass Proxy:`, error);
    return [];
  }
}

/**
 * Fetches the nearest road way and its geometry.
 */
export async function fetchNearestRoad(lat: number, lon: number, radius: number = 200): Promise<{ name: string, type: string, distance: number, point: [number, number], geometry: [number, number][] } | null> {
  const query = `
    [out:json][timeout:30];
    way["highway"](around:${radius},${lat},${lon});
    out geom;
  `;

  try {
    const response = await fetchWithRetry('/api/overpass', {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (!data.elements || data.elements.length === 0) return null;

    let minDistance = Infinity;
    let nearestRoad: any = null;
    let nearestPoint: [number, number] = [0, 0];

    data.elements.forEach((way: any) => {
      if (way.type === 'way' && way.geometry) {
        way.geometry.forEach((pt: any) => {
          const d = calculateDistance(lat, lon, pt.lat, pt.lon);
          if (d < minDistance) {
            minDistance = d;
            nearestRoad = way;
            nearestPoint = [pt.lon, pt.lat];
          }
        });
      }
    });

    if (!nearestRoad) return null;

    return {
      name: nearestRoad.tags.name || 'Unnamed Road',
      type: nearestRoad.tags.highway,
      distance: minDistance,
      point: nearestPoint,
      geometry: nearestRoad.geometry.map((pt: any) => [pt.lon, pt.lat])
    };
  } catch (error) {
    console.error('Failed to fetch nearest road:', error);
    return null;
  }
}

/**
 * Calculates the distance between two points using the Haversine formula.
 * (Copied here for use within the service without importing from lib to avoid circular deps if they exist)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Search Integration ---

/**
 * Searches for a place using local DB first, then Nominatim.
 */
export async function smartSearch(query: string, lat?: number, lon?: number, options?: Partial<AdvancedSearchOptions>): Promise<any[]> {
  const searchProfile = buildPlaceSearchLanguageProfile(query);
  const queryCandidates = searchProfile.queryVariants.length
    ? searchProfile.queryVariants
    : expandSearchQuery(query).slice(0, 6);
  const normalizedQuery = normalizeAddress(queryCandidates[0] || query);
  const advancedOptions = normalizeAdvancedSearchOptions(options);

  // 1. Search Local DB
  const localResults = await db.places
    .filter(place => {
      const localizedNames = Object.entries(place.tags ?? {})
        .filter(([key, value]) => (key === 'name' || key.startsWith('name:')) && typeof value === 'string')
        .map(([, value]) => value as string);
      const labels = [place.name, place.nameEn, ...localizedNames]
        .filter(Boolean)
        .join(' ');
      const countryCode = place.address?.country_code || place.tags?.['addr:country'];
      const matchesCountry = !advancedOptions.countryCodes || (
        typeof countryCode === 'string' &&
        advancedOptions.countryCodes.split(',').includes(countryCode.toLowerCase())
      );
      return matchesCountry &&
        matchesAdvancedSearchCategory(place, advancedOptions) &&
        matchesAdvancedSearchLocation(place, lat, lon, advancedOptions) &&
        (scoreSearchCandidate(labels, queryCandidates) >= 0.6 || normalizeAddress(labels).includes(normalizedQuery));
    })
    .limit(Math.max(20, advancedOptions.limit * 2))
    .toArray();

  const formattedLocal: GeocodingSearchResult[] = localResults
    .map(p => ({
      display_name: `${p.nameEn || p.name} (${p.category})`,
      lat: p.lat.toString(),
      lon: p.lon.toString(),
      source: 'local_db',
      type: p.category,
      confidence: scoreSearchCandidate(`${p.name} ${p.nameEn || ''}`, queryCandidates),
      matched_query: queryCandidates.find(candidate => scoreSearchCandidate(`${p.name} ${p.nameEn || ''}`, [candidate]) >= 0.6) || query,
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, Math.min(8, advancedOptions.limit));

  // 2. Search Nominatim via Proxy
  let nominatimResults: any[] = [];
  try {
    for (const candidate of queryCandidates) {
      const res = await fetchWithRetry(buildNominatimSearchUrl(
        candidate,
        lat,
        lon,
        advancedOptions,
        searchProfile.acceptLanguage,
      ));
      if (res.ok) {
        const results = await res.json();
        nominatimResults.push(
          ...results
            .filter((result: any) =>
              matchesAdvancedSearchCategory(result, advancedOptions) &&
              matchesAdvancedSearchLocation(result, lat, lon, advancedOptions)
            )
            .map((result: any) => ({
              ...result,
              source: result.source || 'osm_nominatim',
              matched_query: candidate,
              confidence: scoreSearchCandidate(result.display_name || '', queryCandidates),
            })),
        );
      }
      if (nominatimResults.length >= advancedOptions.limit) break;
    }
  } catch (e) {
    console.error('Nominatim search error:', e);
  }

  // 3. Search Photon via Proxy. Photon often resolves multilingual place names,
  // streets, POIs, and island/natural feature labels that Nominatim may rank lower.
  let photonResults: GeocodingSearchResult[] = [];
  try {
    const photonLimit = Math.min(8, Math.max(3, advancedOptions.limit));
    for (const candidate of queryCandidates.slice(0, 4)) {
      const res = await fetchWithRetry(apiEndpoints.photonSearch(candidate, photonLimit, lat, lon), {
        timeout: 15000,
      });
      if (res.ok) {
        const data = await res.json();
        const features = Array.isArray(data?.features) ? data.features : [];
        const countryCodes = advancedOptions.countryCodes.split(',').filter(Boolean);
        photonResults.push(
          ...features
            .map((feature: any) => photonFeatureToGeocodingResult(feature, candidate, queryCandidates))
            .filter((result: GeocodingSearchResult | null): result is GeocodingSearchResult => {
              if (!result) return false;
              const countryCode = String(result.address?.country_code || result.tags?.countrycode || '').toLowerCase();
              const matchesCountry = !countryCodes.length || countryCodes.includes(countryCode);
              return matchesCountry &&
                matchesAdvancedSearchCategory(result, advancedOptions) &&
                matchesAdvancedSearchLocation(result, lat, lon, advancedOptions);
            }),
        );
      }
      if (photonResults.length >= advancedOptions.limit) break;
    }
  } catch (e) {
    console.error('Photon search error:', e);
  }

  const dedupedResults = dedupeGeocodingSearchResults([
    ...formattedLocal,
    ...nominatimResults,
    ...photonResults,
  ]);
  const addressFormatCache = new Map<string, Awaited<ReturnType<typeof getAddressFormat>>>();
  const loadAddressFormat = async (countryCode?: string) => {
    const code = String(countryCode || '').trim().toUpperCase();
    if (!code) return null;
    if (!addressFormatCache.has(code)) {
      addressFormatCache.set(code, await getAddressFormat(code));
    }
    return addressFormatCache.get(code) || null;
  };

  const morphismCandidates: AddressMorphismCandidate[] = await Promise.all(dedupedResults.map(async (result, index) => {
    const analysis = analyzeAddress({
      apiAddress: result.address || {},
      displayName: result.display_name || result.name || '',
      sources: [result.source || 'search'],
    });
    const countryCode = analysis.canonical.country_code || advancedOptions.countryCodes.split(',')[0];
    const addressFormat = await loadAddressFormat(countryCode);
    return buildMorphismCandidateFromSources({
      id: result.place_id ? String(result.place_id) : `${result.source || 'search'}-${index}`,
      label: result.display_name || result.name || '',
      canonical: analysis.canonical,
      lat: Number(result.lat),
      lon: Number(result.lon),
      sources: analysis.sources.length ? analysis.sources : [result.source || 'search'],
      confidence: Math.max(result.confidence ?? 0, analysis.confidence),
      addressFormat,
      naturalContext: detectNaturalAddressContext({
        tags: result.tags || {},
        category: result.category || result.class,
        type: result.type_name || result.type,
        displayName: result.display_name || result.name || '',
      }),
    });
  }));
  const rankedByMorphism = rankAddressCandidatesByMorphism(
    query,
    morphismCandidates,
    { lat, lon, countryCode: advancedOptions.countryCodes.split(',')[0] || undefined },
  );
  const morphismById = new Map(rankedByMorphism.map(candidate => [candidate.id, candidate]));

  return dedupedResults
    .map((result, index) => {
      const id = result.place_id ? String(result.place_id) : `${result.source || 'search'}-${index}`;
      const morphism = morphismById.get(id);
      return {
        ...result,
        morphism_energy: morphism?.morphism_energy,
        morphism_probability: morphism?.morphism_probability,
        morphism_status: morphism?.morphism_status,
        morphism_pid: morphism?.morphism_pid,
      };
    })
    .sort((a, b) => {
      const energyDiff = (a.morphism_energy ?? Number.POSITIVE_INFINITY) - (b.morphism_energy ?? Number.POSITIVE_INFINITY);
      if (energyDiff !== 0) return energyDiff;
      return (b.confidence ?? 0) - (a.confidence ?? 0);
    })
    .slice(0, advancedOptions.limit);
}

async function dedupeBuildingNameCandidates(candidates: BuildingNameCandidate[]) {
  const { rankBuildingNameCandidates } = await loadBuildingNameModule();
  const deduped = new Map<string, BuildingNameCandidate>();
  for (const candidate of rankBuildingNameCandidates(candidates)) {
    const nameKey = String(candidate.name || '').normalize('NFKC').trim().toLocaleLowerCase();
    const key = [
      candidate.source,
      nameKey,
      candidate.osmType || '',
      candidate.osmId || '',
    ].join('|');
    if (!deduped.has(key)) deduped.set(key, candidate);
  }
  return Array.from(deduped.values());
}

/**
 * Fetches open-source building or housename candidates near the coordinate.
 * Uses OSM/Overpass tags only and omits generic building types.
 */
async function fetchNearbyOsmBuildingNameCandidates(
  lat: number,
  lon: number,
  langCode: string = 'en',
  radius: number = 90,
): Promise<BuildingNameCandidate[]> {
  try {
    const {
      buildBuildingNameOverpassQuery,
      buildingNameCandidateFromOsmElement,
    } = await loadBuildingNameModule();
    const response = await fetchWithRetry('/api/overpass', {
      method: 'POST',
      body: JSON.stringify({ query: buildBuildingNameOverpassQuery(lat, lon, radius) }),
      headers: { 'Content-Type': 'application/json' },
      timeout: 45000,
    });

    if (!response.ok) return [];
    const data = await response.json();
    const elements = Array.isArray(data?.elements) ? data.elements : [];
    const candidates = elements
      .map((element: any) => {
        const elLat = element.lat || element.center?.lat;
        const elLon = element.lon || element.center?.lon;
        const distanceMeters = elLat && elLon ? Math.round(calculateDistance(lat, lon, elLat, elLon) * 1000) : undefined;
        return buildingNameCandidateFromOsmElement(element, langCode, distanceMeters);
      })
      .filter(Boolean) as BuildingNameCandidate[];

    return (await dedupeBuildingNameCandidates(candidates)).slice(0, 8);
  } catch (error) {
    console.warn('Failed to fetch nearby building name:', error);
    return [];
  }
}

export async function fetchNearbyOvertureBuildingNameCandidates(
  lat: number,
  lon: number,
  langCode: string = 'en',
  radius: number = 90,
): Promise<BuildingNameCandidate[]> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      lang: langCode,
      radius: String(radius),
    });
    const response = await fetchWithRetry(`/api/overture/building-name?${params.toString()}`, {
      timeout: 45000,
    }, 0);

    if (!response.ok) return [];
    const data = await response.json();
    const rawCandidates = Array.isArray(data)
      ? data
      : Array.isArray(data?.candidates)
        ? data.candidates
        : data?.candidate
          ? [data.candidate]
          : Array.isArray(data?.features)
            ? data.features
            : [];
    const { buildingNameCandidateFromOvertureFeature } = await loadOvertureMapsModule();
    const candidates = rawCandidates
      .map((feature: any) => buildingNameCandidateFromOvertureFeature(feature, langCode))
      .filter(Boolean) as BuildingNameCandidate[];

    return (await dedupeBuildingNameCandidates(candidates)).slice(0, 8);
  } catch (error) {
    console.warn('Failed to fetch Overture building name:', error);
    return [];
  }
}

export async function fetchNearbyOvertureBuildingName(
  lat: number,
  lon: number,
  langCode: string = 'en',
  radius: number = 90,
): Promise<BuildingNameCandidate | null> {
  const candidates = await fetchNearbyOvertureBuildingNameCandidates(lat, lon, langCode, radius);
  return candidates[0] || null;
}

export async function fetchNearbyBuildingNameCandidates(
  lat: number,
  lon: number,
  langCode: string = 'en',
  radius: number = 90,
): Promise<BuildingNameCandidate[]> {
  const results = await Promise.allSettled([
    fetchNearbyOvertureBuildingNameCandidates(lat, lon, langCode, radius),
    fetchNearbyOsmBuildingNameCandidates(lat, lon, langCode, radius),
  ]);
  const candidates = results
    .filter((result): result is PromiseFulfilledResult<BuildingNameCandidate[]> => result.status === 'fulfilled')
    .flatMap(result => result.value);

  return (await dedupeBuildingNameCandidates(candidates)).slice(0, 8);
}

/**
 * Fetches the strongest open-source building or housename candidate near the coordinate.
 * Uses OSM/Overture sources and returns null when only generic building types are available.
 */
export async function fetchNearbyBuildingName(
  lat: number,
  lon: number,
  langCode: string = 'en',
  radius: number = 90,
): Promise<BuildingNameCandidate | null> {
  const candidates = await fetchNearbyBuildingNameCandidates(lat, lon, langCode, radius);
  return candidates[0] || null;
}

export async function fetchNearbyMapAddressFeatures(
  lat: number,
  lon: number,
  langCode: string = 'en',
  radius: number = 140,
): Promise<MapAddressFeatureSummary> {
  const {
    buildMapFeatureAddressOverpassQuery,
    mapAddressFeatureCandidateFromOsmElement,
    summarizeMapAddressFeatures,
  } = await loadMapFeatureAddressModule();
  try {
    const response = await fetchWithRetry('/api/overpass', {
      method: 'POST',
      body: JSON.stringify({ query: buildMapFeatureAddressOverpassQuery(lat, lon, radius) }),
      headers: { 'Content-Type': 'application/json' },
      timeout: 45000,
    });

    if (!response.ok) return summarizeMapAddressFeatures([]);
    const data = await response.json();
    const elements = Array.isArray(data?.elements) ? data.elements : [];
    const candidates = elements
      .map((element: any) => {
        const elLat = element.lat ?? element.center?.lat;
        const elLon = element.lon ?? element.center?.lon;
        const hasCoordinates = elLat !== undefined && elLon !== undefined;
        const distanceMeters = hasCoordinates ? Math.round(calculateDistance(lat, lon, Number(elLat), Number(elLon)) * 1000) : undefined;
        return mapAddressFeatureCandidateFromOsmElement(element, langCode, distanceMeters);
      })
      .filter(Boolean) as MapAddressFeatureCandidate[];

    return summarizeMapAddressFeatures(candidates);
  } catch (error) {
    console.warn('Failed to fetch nearby map address features:', error);
    return summarizeMapAddressFeatures([]);
  }
}

export async function fetchNearbyMapAddressFeature(
  lat: number,
  lon: number,
  langCode: string = 'en',
  radius: number = 140,
): Promise<MapAddressFeatureCandidate | null> {
  const summary = await fetchNearbyMapAddressFeatures(lat, lon, langCode, radius);
  return summary.primary || null;
}

// --- Regional Geocoding ---

/**
 * Performs reverse geocoding using regional APIs if available, falling back to Nominatim.
 */
export async function regionalReverseGeocode(lat: number, lon: number, langCode: string, countryCode: string): Promise<any> {
  return getCachedAddressRetrieval(
    { lat, lon, langCode, countryCode },
    () => fetchRegionalReverseGeocode(lat, lon, langCode, countryCode),
  );
}

async function fetchRegionalReverseGeocode(lat: number, lon: number, langCode: string, countryCode: string): Promise<any> {
  const cc = countryCode.toLowerCase();

  // 1. Japan (HeartRails Geo API via Proxy)
  // Only supports Japanese. If language is not Japanese, fallback to Nominatim.
  if (cc === 'jp' && langCode === 'ja') {
    try {
      const res = await fetchWithRetry(`/api/jp-heartrails?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.response && data.response.location && data.response.location.length > 0) {
          const loc = data.response.location[0];
          // Construct a Nominatim-like address object
          return {
            address: {
              country_code: 'jp',
              country: '日本',
              province: loc.prefecture,
              city: loc.city,
              suburb: loc.town,
              postcode: loc.postal
            }
          };
        }
      }
    } catch (e) {
      console.error('HeartRails API error:', e);
    }
  }

  // 2. Taiwan (NLSC API via Proxy)
  // Only supports Traditional Chinese.
  if (cc === 'tw' && langCode === 'zh-Hant') {
    try {
      const res = await fetchWithRetry(`/api/tw-nlsc?lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const xmlText = await res.text();
        // Simple XML parsing
        const getTag = (tag: string) => {
          const match = xmlText.match(new RegExp(`<${tag}>(.*?)</${tag}>`));
          return match ? match[1] : '';
        };
        const ctyName = getTag('ctyName');
        const townName = getTag('townName');
        const villageName = getTag('villageName');

        if (ctyName || townName) {
          return {
            address: {
              country_code: 'tw',
              country: '台灣',
              state: ctyName,
              city: townName,
              suburb: villageName
            }
          };
        }
      }
    } catch (e) {
      console.error('NLSC API error:', e);
    }
  }

  // 3. Parallel fetch for Self-Hosted Postal Code DB, Zippopotam, Nominatim, Elevation, Water Risk, and Mountains
  let localData: any = null;
  let zippoData: any = null;
  let nominatimData: any = null;
  let elevationData: any = null;
  let waterData: any = null;
  let mountainData: any = null;
  let geoRiskData: any = null;
  let westAsiaContext: RegionalLandmark[] = [];
  let russiaContext: RussiaContext | null = null;
  let centralAsiaContext: CentralAsiaContext | null = null;
  let southAsiaContext: SouthAsiaContext | null = null;
  let ukIrelandContext: UKIrelandContext | null = null;
  let nordicContext: NordicContext | null = null;
  let europeanPostalData: any = null;
  let asiaOceaniaData: any = null;
  let oceaniaContext: OceaniaContext | null = null;
  let eastAsiaContext: EastAsiaContext | null = null;
  let northAmericaContext: NorthAmericaContext | null = null;
  let southAmericaContext: SouthAmericaContext | null = null;
  let caribbeanContext: CaribbeanContext | null = null;
  let centralAmericaContext: CentralAmericaContext | null = null;
  let southeastAsiaContext: SoutheastAsiaContext | null = null;
  let africaContext: AfricaContext | null = null;
  let usCensusData: any = null;
  let officialRegionalData: any = null;
  let polarContext: PolarContext | null = null;
  let polarOfficialData: any = null;
  let natureContext: NatureContext | null = null;
  let seaContext: SeaContext | null = null;
  let heritageContext: HeritageContext | null = null;
  let japaneseGeoContext: JapaneseGeoContext | null = null;
  let buildingNameData: BuildingNameCandidate | null = null;
  let mapAddressFeatureData: MapAddressFeatureCandidate | null = null;
  let mapAddressFeatureSummary: MapAddressFeatureSummary | null = null;

  const westAsiaCountries = ['sa', 'ae', 'tr', 'ir', 'il', 'iq', 'sy', 'jo', 'lb', 'ye', 'om', 'kw', 'qa', 'bh'];
  const centralAsiaCountries = ['kz', 'uz', 'kg', 'tj', 'tm'];
  const southAsiaCountries = ['in', 'pk', 'bd', 'lk', 'np', 'bt', 'af', 'mv'];
  const ukIrelandCountries = ['gb', 'ie'];
  const nordicCountries = ['no', 'se', 'dk', 'fi', 'is'];
  const europeanPostalCountries = ['fr', 'nl', 'de', 'be', 'ch', 'at', 'li', 'ee', 'lv', 'lt', 'is', 'it', 'es', 'pt', 'gr', 'mt', 'cy', 'mc', 'sm', 'va', 'ad', 'ro', 'bg', 'ua', 'md', 'by', 'ru', 'rs', 'ba', 'me', 'xk', 'al', 'mk', 'pl', 'cz', 'sk', 'hu', 'si', 'hr', 'am', 'az', 'ge'];
  const asiaOceaniaCountries = ['jp', 'cn', 'kr', 'tw', 'hk', 'mo', 'mn', 'vn', 'th', 'my', 'sg', 'id', 'ph', 'kh', 'la', 'mm', 'bn', 'tl', 'au', 'nz', 'fj', 'pg', 'sb', 'vu', 'ws', 'to'];

  let results: PromiseSettledResult<any>[] = [];
  let globalContextIdx = -1;
  let plusCodeIdx = -1;
  let hkAlsIdx = -1;
  let buildingNameIdx = -1;
  let mapFeatureIdx = -1;

  try {
    const promises: Promise<any>[] = [
      fetchWithRetry(
        `/api/osm-reverse?lat=${lat}&lon=${lon}&lang=${langCode}&cc=${cc}`,
        { timeout: ADDRESS_RETRIEVAL_TIMEOUTS.coreReverseMs },
        ADDRESS_RETRIEVAL_RETRIES.coreReverse,
      ),
      fetchWithRetry(
        `/api/elevation?lat=${lat}&lon=${lon}`,
        { timeout: ADDRESS_RETRIEVAL_TIMEOUTS.optionalGeoMs },
        ADDRESS_RETRIEVAL_RETRIES.optional,
      ),
      fetchWithRetry(
        `/api/water-risk?lat=${lat}&lon=${lon}`,
        { timeout: ADDRESS_RETRIEVAL_TIMEOUTS.optionalGeoMs },
        ADDRESS_RETRIEVAL_RETRIES.optional,
      ),
      fetchWithRetry(
        `/api/mountain/nearby?lat=${lat}&lon=${lon}`,
        { timeout: ADDRESS_RETRIEVAL_TIMEOUTS.optionalGeoMs },
        ADDRESS_RETRIEVAL_RETRIES.optional,
      ),
      fetchWithRetry(
        `/api/geological-risk?lat=${lat}&lon=${lon}`,
        { timeout: ADDRESS_RETRIEVAL_TIMEOUTS.optionalGeoMs },
        ADDRESS_RETRIEVAL_RETRIES.optional,
      )
    ];

    // Only add postal code fetch if cc is a standard 2-letter land country code (e.g. 'JP', 'US').
    // Numeric codes like '74' represent sea/other regions and don't have Geonames postal data.
    if (/^[a-z]{2}$/i.test(cc)) {
      promises.unshift(fetchWithRetry(
        `/api/postal-code/nearest?lat=${lat}&lon=${lon}&cc=${cc}`,
        { timeout: ADDRESS_RETRIEVAL_TIMEOUTS.postalNearestMs },
        ADDRESS_RETRIEVAL_RETRIES.optional,
      ));
    } else {
      // Push a dummy promise that resolves to an empty response to maintain index alignment
      // But wait, the indices depend on the order.
      // Actually, looking at the code later:
      // data = await results[0].value.json(); // localData (postal)
      // nominatimData = await results[1].value.json(); // nominatim
      // ...
      // So we should maintain the array length and order if the logic expects results[0] to be postal.
      promises.unshift(Promise.resolve({ ok: false }));
    }

    if (westAsiaCountries.includes(cc)) {
      promises.push(fetchWestAsiaContext(lat, lon));
    } else if (cc === 'ru') {
      promises.push(fetchRussiaContext(lat, lon));
    } else if (centralAsiaCountries.includes(cc)) {
      promises.push(fetchCentralAsiaContext(lat, lon));
    } else if (southAsiaCountries.includes(cc)) {
      promises.push(fetchSouthAsiaContext(lat, lon));
    } else if (ukIrelandCountries.includes(cc)) {
      promises.push(fetchUKIrelandContext(lat, lon));
      if (cc === 'gb') promises.push(fetchUKAddress(lat, lon));
      else if (cc === 'ie') promises.push(fetchIrelandAddress(lat, lon));
    } else if (nordicCountries.includes(cc)) {
      promises.push(fetchNordicContext(lat, lon));
      promises.push(fetchNordicWeather(lat, lon));
      if (cc === 'dk') promises.push(fetchDanishAddress(lat, lon));
      else if (cc === 'no') promises.push(fetchNorwegianAddress(lat, lon));
      else if (cc === 'fi') promises.push(fetchFinnishAddress(lat, lon));
    } else if (cc === 'fr') {
      promises.push(fetchFrenchAddress(lat, lon));
    } else if (cc === 'za') {
      promises.push(fetchSouthAfricaAddress(lat, lon));
    } else if (cc === 'eg') {
      promises.push(fetchEgyptAddress(lat, lon));
    } else if (cc === 'lu') {
      promises.push(fetchLuxembourgAddress(lat, lon));
    } else if (cc === 'nl') {
      promises.push(fetchDutchAddress(lat, lon));
    } else if (cc === 'de') {
      promises.push(fetchGermanAddress(lat, lon));
    } else if (cc === 'be') {
      promises.push(fetchBelgianAddress(lat, lon));
      promises.push(fetchBelgiumBestAddress(lat, lon));
    } else if (cc === 'ch' || cc === 'li') {
      promises.push(fetchSwissAddress(lat, lon));
    } else if (cc === 'at') {
      promises.push(fetchAustrianAddress(lat, lon));
    } else if (cc === 'se') {
      promises.push(fetchSwedishAddress(lat, lon));
    } else if (cc === 'ee') {
      promises.push(fetchEstonianAddress(lat, lon));
    } else if (cc === 'lv') {
      promises.push(fetchLatvianAddress(lat, lon));
    } else if (cc === 'lt') {
      promises.push(fetchLithuanianAddress(lat, lon));
    } else if (cc === 'is') {
      promises.push(fetchIcelandicAddress(lat, lon));
    } else if (cc === 'it') {
      promises.push(fetchItalianAddress(lat, lon));
    } else if (cc === 'es') {
      promises.push(fetchSpanishAddress(lat, lon));
      promises.push(fetchSpainCatastroAddress(lat, lon));
    } else if (cc === 'pt') {
      promises.push(fetchPortugueseAddress(lat, lon));
    } else if (cc === 'gr') {
      promises.push(fetchGreekAddress(lat, lon));
    } else if (cc === 'mt') {
      promises.push(fetchMalteseAddress(lat, lon));
    } else if (cc === 'cy') {
      promises.push(fetchCypriotAddress(lat, lon));
    } else if (['mc', 'sm', 'va', 'ad'].includes(cc)) {
      promises.push(fetchMicrostateAddress(lat, lon, cc));
    } else if (['ro', 'bg', 'ua', 'md', 'by', 'ru', 'rs', 'ba', 'me', 'xk', 'al', 'mk', 'pl', 'cz', 'sk', 'hu', 'si', 'hr', 'am', 'az', 'ge'].includes(cc)) {
      promises.push(fetchEEBalkanAddress(lat, lon, cc));
      if (cc === 'cz') {
        promises.push(fetchCzechRuianAddress(lat, lon));
      } else if (cc === 'pl') {
        promises.push(fetchPolishAddress(lat, lon));
      }
    } else if (['us', 'ca', 'mx', 'gl'].includes(cc)) {
      promises.push(fetchNorthAmericaContext(lat, lon));
      if (cc === 'us') {
        promises.push(fetchUSCensusData(lat, lon));
      } else if (cc === 'ca') {
        promises.push(fetchCanadaOfficialAddress(lat, lon));
      } else if (cc === 'mx') {
        promises.push(fetchMexicoOfficialAddress(lat, lon));
      }
    } else if (cc === 'br') {
      promises.push(fetchSouthAmericaContext(lat, lon));
      promises.push(fetchBrazilOfficialAddress(lat, lon));
    } else if (['ar', 'cl', 'co', 'pe', 've', 'ec', 'bo', 'py', 'uy', 'sr', 'gy', 'gf'].includes(cc)) {
      promises.push(fetchSouthAmericaContext(lat, lon));
      promises.push(fetchSouthAmericaOfficialAddress(lat, lon, cc));
    } else if (['cu', 'do', 'pr', 'jm', 'tt', 'bs', 'bb', 'lc', 'gd', 'vc', 'ag', 'kn', 'dm', 'ht', 'ky', 'tc', 'vg', 'vi', 'bm', 'gp', 'mq', 'cw', 'aw', 'sx', 'bl', 'mf'].includes(cc)) {
      promises.push(fetchCaribbeanContext(lat, lon));
      promises.push(fetchCaribbeanOfficialAddress(lat, lon, cc));
      if (cc === 'pr' || cc === 'vi') {
        promises.push(fetchUSCensusData(lat, lon));
      }
    } else if (['gt', 'bz', 'sv', 'hn', 'ni', 'cr', 'pa'].includes(cc)) {
      promises.push(fetchCentralAmericaContext(lat, lon));
      promises.push(fetchCentralAmericaOfficialAddress(lat, lon, cc));
    } else if (['th', 'id', 'vn', 'my', 'ph', 'sg', 'mm', 'kh', 'la', 'bn', 'tl'].includes(cc)) {
      promises.push(fetchSoutheastAsiaContext(lat, lon));
      promises.push(fetchSoutheastAsiaOfficialAddress(lat, lon, cc));
    } else if (['za', 'ng', 'ke', 'eg', 'ma', 'dz', 'tn', 'ly', 'sd', 'et', 'gh', 'ci', 'sn', 'ug', 'tz', 'zm', 'zw', 'na', 'bw', 'ao', 'mz', 'cm', 'ga', 'cd', 'cg', 'rw', 'bi', 'mw', 'mg', 'mu', 'sc', 'cv', 'gm', 'gn', 'sl', 'lr', 'bf', 'ne', 'td', 'ml', 'mr', 'eh', 'dj', 'er', 'so', 'sz', 'ls', 'km', 'st', 'gq', 'bj', 'tg'].includes(cc)) {
      promises.push(fetchAfricaContext(lat, lon));
      promises.push(fetchAfricaOfficialAddress(lat, lon, cc));
    } else if (asiaOceaniaCountries.includes(cc)) {
      const { fetchAsiaOceaniaAddress } = await import('./AsiaOceaniaService');
      promises.push(fetchAsiaOceaniaAddress(lat, lon, cc));
      if (['au', 'nz'].includes(cc)) {
        promises.push(fetchOceaniaContext(lat, lon, cc));
      } else if (['cn', 'kr'].includes(cc)) {
        const eastAsiaService = await import('./EastAsiaService');
        promises.push(eastAsiaService.fetchEastAsiaContext(lat, lon, cc));
        if (cc === 'cn') {
          promises.push(eastAsiaService.fetchTiandituAddress(lat, lon));
        } else if (cc === 'kr') {
          promises.push(eastAsiaService.fetchKoreaOfficialAddress(lat, lon));
        }
      }
    }

    // 4. Polar Regions (Arctic/Antarctic)
    let polarIdx = -1;
    let polarOfficialIdx = -1;
    if (lat > 60 || lat < -60) {
      polarIdx = promises.length;
      promises.push(fetchPolarContext(lat, lon).catch(() => null));
      polarOfficialIdx = promises.length;
      promises.push(fetchPolarOfficialData(lat, lon).catch(() => null));
    }

    // 5. Nature Features
    const natureIdx = promises.length;
    promises.push(fetchNatureContext(lat, lon).catch(() => ({
      mountains: [], beaches: [], ports: [], seas: [], deserts: []
    })));

    // 6. Deep Sea Context
    const seaIdx = promises.length;
    promises.push(fetchSeaContext(lat, lon, elevationData?.elevation).catch(() => null));

    // 7. World Heritage Context
    const heritageIdx = promises.length;
    promises.push(fetchHeritageContext(lat, lon).catch(() => ({ unescoSites: [], historicSites: [] })));

    // 8. Japanese Geo Context
    let japanGeoIdx = -1;
    if (cc === 'jp') {
      japanGeoIdx = promises.length;
      promises.push(fetchJapaneseGeoContext(lat, lon).catch(() => null));
    }

    // 9. Global Real-time Context (Weather & Time)
    globalContextIdx = promises.length;
    promises.push(fetchGlobalContext(lat, lon).catch(() => ({ weather: null, time: null })));

    // 10. Global Plus Code (Vital for areas without postal codes)
    plusCodeIdx = promises.length;
    promises.push(fetchPlusCode(lat, lon).catch(() => null));

    // 11. Hong Kong ALS (Official Address lookup for HK which has no postcodes)
    if (cc === 'hk') {
      const { fetchHKOfficialAddress } = await import('./EastAsiaService');
      hkAlsIdx = promises.length;
      promises.push(fetchHKOfficialAddress(lat, lon).catch(() => null));
    }

    // 12. OSM building/housename lookup. Keep this after regional index-sensitive
    // promises so the existing results[6]/[7]/[8] regional unpacking remains stable.
    buildingNameIdx = promises.length;
    promises.push(fetchNearbyBuildingName(lat, lon, langCode, 90).catch(() => null));

    // 13. Public map feature labels for roads, bridges, water, natural
    // features, heritage/ruins, parks, and other named public features that
    // can explain an otherwise weak address.
    mapFeatureIdx = promises.length;
    promises.push(fetchNearbyMapAddressFeatures(lat, lon, langCode, 220).catch(async () => {
      const { summarizeMapAddressFeatures } = await loadMapFeatureAddressModule();
      return summarizeMapAddressFeatures([]);
    }));

    results = await Promise.allSettled(promises.map((promise, index) => {
      if (index <= 5) return promise;
      const timeoutMs = (index === buildingNameIdx || index === mapFeatureIdx)
        ? ADDRESS_RETRIEVAL_TIMEOUTS.buildingNameMs
        : (index === globalContextIdx || index === plusCodeIdx)
          ? ADDRESS_RETRIEVAL_TIMEOUTS.globalContextMs
          : ADDRESS_RETRIEVAL_TIMEOUTS.regionalContextMs;

      return withAddressLookupTimeout(promise, timeoutMs, null);
    }));

    const safeJson = async (result: any) => {
      if (result.status !== 'fulfilled' || !result.value || !result.value.ok) return null;
      const contentType = result.value.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return null;
      try {
        return await result.value.json();
      } catch (e) {
        return null;
      }
    };

    localData = await safeJson(results[0]);
    nominatimData = await safeJson(results[1]);
    elevationData = await safeJson(results[2]);
    waterData = await safeJson(results[3]);
    mountainData = await safeJson(results[4]);
    geoRiskData = await safeJson(results[5]);

    // Handle Sea and Nature results
    if (results[seaIdx] && results[seaIdx].status === 'fulfilled') {
      seaContext = results[seaIdx].value;
    }
    if (results[natureIdx] && results[natureIdx].status === 'fulfilled') {
      natureContext = results[natureIdx].value;
    }

    // Handle Heritage results
    if (results[heritageIdx] && results[heritageIdx].status === 'fulfilled') {
      heritageContext = results[heritageIdx].value;
    }

    // Handle Japanese Geo results
    if (japanGeoIdx !== -1 && results[japanGeoIdx] && results[japanGeoIdx].status === 'fulfilled') {
      japaneseGeoContext = (results[japanGeoIdx] as PromiseFulfilledResult<any>).value;
    }

    if (buildingNameIdx !== -1 && results[buildingNameIdx] && results[buildingNameIdx].status === 'fulfilled') {
      buildingNameData = (results[buildingNameIdx] as PromiseFulfilledResult<any>).value;
    }
    if (mapFeatureIdx !== -1 && results[mapFeatureIdx] && results[mapFeatureIdx].status === 'fulfilled') {
      mapAddressFeatureSummary = (results[mapFeatureIdx] as PromiseFulfilledResult<MapAddressFeatureSummary>).value || null;
      mapAddressFeatureData = mapAddressFeatureSummary?.primary || null;
    }

    // Handle Polar results
    if (polarIdx !== -1 && results[polarIdx] && results[polarIdx].status === 'fulfilled') {
      polarContext = (results[polarIdx] as PromiseFulfilledResult<any>).value;
    }
    if (polarOfficialIdx !== -1 && results[polarOfficialIdx] && results[polarOfficialIdx].status === 'fulfilled') {
      polarOfficialData = (results[polarOfficialIdx] as PromiseFulfilledResult<any>).value;
    }

    if (results[6] && results[6].status === 'fulfilled') {
      const res6 = (results[6] as PromiseFulfilledResult<any>).value;
      if (westAsiaCountries.includes(cc)) {
        westAsiaContext = res6;
        if (westAsiaContext && westAsiaContext.length > 0) {
          const mainContext = westAsiaContext[0];
          if (mainContext.type === "Dubai Makani" || mainContext.type === "Saudi National Address Point") {
            officialRegionalData = { ...officialRegionalData, ...mainContext.tags };
            // Inject building number into address if missing
            if (nominatimData && nominatimData.address && !nominatimData.address.house_number) {
              nominatimData.address.house_number = mainContext.tags?.['addr:housenumber'] || mainContext.tags?.['addr:building_number'] || mainContext.tags?.['addr:makani'];
            }
          }
        }
      } else if (cc === 'ru') {
        russiaContext = res6;
      } else if (centralAsiaCountries.includes(cc)) {
        centralAsiaContext = res6;
      } else if (southAsiaCountries.includes(cc)) {
        southAsiaContext = res6;
      } else if (ukIrelandCountries.includes(cc)) {
        ukIrelandContext = res6;
        if (results[7] && results[7].status === 'fulfilled') {
          europeanPostalData = (results[7] as PromiseFulfilledResult<any>).value;
        }
      } else if (nordicCountries.includes(cc)) {
        nordicContext = res6;
        if (results[7] && results[7].status === 'fulfilled' && nordicContext) {
          nordicContext.weather = (results[7] as PromiseFulfilledResult<any>).value;
        }
        if (results[8] && results[8].status === 'fulfilled' && nordicContext) {
          nordicContext.addressDetails = (results[8] as PromiseFulfilledResult<any>).value;
        }
      } else if (europeanPostalCountries.includes(cc)) {
        europeanPostalData = res6;
        // Merge specialized data if available
        if (cc === 'be' && results[7] && results[7].status === 'fulfilled') {
          europeanPostalData = { ...europeanPostalData, ...(results[7] as PromiseFulfilledResult<any>).value };
        } else if (cc === 'es' && results[7] && results[7].status === 'fulfilled') {
          europeanPostalData = { ...europeanPostalData, ...(results[7] as PromiseFulfilledResult<any>).value };
        } else if (cc === 'cz' && results[7] && results[7].status === 'fulfilled') {
          europeanPostalData = { ...europeanPostalData, ...(results[7] as PromiseFulfilledResult<any>).value };
        } else if (cc === 'pl' && results[7] && results[7].status === 'fulfilled') {
          europeanPostalData = { ...europeanPostalData, ...(results[7] as PromiseFulfilledResult<any>).value };
        }
      } else if (['us', 'ca', 'mx'].includes(cc)) {
        northAmericaContext = res6;
        if (cc === 'us' && results[7] && results[7].status === 'fulfilled') {
          usCensusData = (results[7] as PromiseFulfilledResult<any>).value;
        } else if (['ca', 'mx'].includes(cc) && results[7] && results[7].status === 'fulfilled') {
          officialRegionalData = (results[7] as PromiseFulfilledResult<any>).value;
        }
      } else if (cc === 'br') {
        southAmericaContext = res6;
        if (results[7] && results[7].status === 'fulfilled') {
          officialRegionalData = (results[7] as PromiseFulfilledResult<any>).value;
        }
      } else if (['ar', 'cl', 'co', 'pe', 've', 'ec', 'bo', 'py', 'uy', 'sr', 'gy'].includes(cc)) {
        southAmericaContext = res6;
        if (results[7] && results[7].status === 'fulfilled') {
          officialRegionalData = (results[7] as PromiseFulfilledResult<any>).value;
        }
      } else if (['cu', 'do', 'pr', 'jm', 'tt', 'bs', 'bb', 'lc', 'gd', 'vc', 'ag', 'kn', 'dm', 'ht', 'ky', 'tc', 'vg', 'vi', 'bm', 'gp', 'mq', 'cw', 'aw', 'sx', 'bl', 'mf'].includes(cc)) {
        caribbeanContext = res6;
        if (results[7] && results[7].status === 'fulfilled') {
          officialRegionalData = (results[7] as PromiseFulfilledResult<any>).value;
        }
        if ((cc === 'pr' || cc === 'vi') && results[8] && results[8].status === 'fulfilled') {
          usCensusData = (results[8] as PromiseFulfilledResult<any>).value;
        }
      } else if (['gt', 'bz', 'sv', 'hn', 'ni', 'cr', 'pa'].includes(cc)) {
        centralAmericaContext = res6;
        if (results[7] && results[7].status === 'fulfilled') {
          officialRegionalData = (results[7] as PromiseFulfilledResult<any>).value;
        }
      } else if (['th', 'id', 'vn', 'my', 'ph', 'sg', 'mm', 'kh', 'la', 'bn', 'tl'].includes(cc)) {
        southeastAsiaContext = res6;
        if (results[7] && results[7].status === 'fulfilled') {
          officialRegionalData = (results[7] as PromiseFulfilledResult<any>).value;
        }
      } else if (['za', 'ng', 'ke', 'eg', 'ma', 'dz', 'tn', 'ly', 'sd', 'et', 'gh', 'ci', 'sn', 'ug', 'tz', 'zm', 'zw', 'na', 'bw', 'ao', 'mz', 'cm', 'ga', 'cd', 'cg', 'rw', 'bi', 'mw', 'mg', 'mu', 'sc', 'cv', 'gm', 'gn', 'sl', 'lr', 'bf', 'ne', 'td', 'ml', 'mr', 'eh', 'dj', 'er', 'so', 'sz', 'ls', 'km', 'st', 'gq', 'bj', 'tg'].includes(cc)) {
        africaContext = res6;
        if (results[7] && results[7].status === 'fulfilled') {
          officialRegionalData = (results[7] as PromiseFulfilledResult<any>).value;
        }
      } else if (asiaOceaniaCountries.includes(cc)) {
        asiaOceaniaData = res6;
        if (['au', 'nz'].includes(cc) && results[7] && results[7].status === 'fulfilled') {
          oceaniaContext = (results[7] as PromiseFulfilledResult<any>).value;
        } else if (['cn', 'kr'].includes(cc) && results[7] && results[7].status === 'fulfilled') {
          eastAsiaContext = (results[7] as PromiseFulfilledResult<any>).value;
          // results[8] would be Tianditu for China or KoreaOfficial for Korea
          if (results[8] && results[8].status === 'fulfilled') {
            if (cc === 'cn') {
              if (asiaOceaniaData) {
                asiaOceaniaData.tiandituDetails = (results[8] as PromiseFulfilledResult<any>).value;
              } else {
                asiaOceaniaData = { tiandituDetails: (results[8] as PromiseFulfilledResult<any>).value };
              }
            } else if (cc === 'kr') {
              officialRegionalData = (results[8] as PromiseFulfilledResult<any>).value;
            }
          }
        }
      }
    }

    // If we have a postcode from Nominatim or local DB, try Zippopotam for enrichment
    const pc = nominatimData?.address?.postcode || localData?.postalCode || europeanPostalData?.postcode || nordicContext?.addressDetails?.postcode || asiaOceaniaData?.postcode;
    if (pc) {
      try {
        // For Japan, try specialized zipcloud enrichment if we have a postcode
        if (cc === 'jp') {
          const { fetchJapanPostcode } = await import('./AsiaOceaniaService');
          const jpAddr = await fetchJapanPostcode(pc.replace('-', ''));
          if (jpAddr) {
            if (asiaOceaniaData) {
              asiaOceaniaData.japanDetails = jpAddr;
            } else {
              asiaOceaniaData = { japanDetails: jpAddr };
            }
          }
        }

        // For China, try specialized postcode enrichment
        if (cc === 'cn') {
          const { fetchChinaPostcode, getChinaProvinceByPostcode } = await import('./EastAsiaService');
          const cnAddr = await fetchChinaPostcode(pc);
          const provinceHint = getChinaProvinceByPostcode(pc);

          if (cnAddr || provinceHint) {
            if (asiaOceaniaData) {
              asiaOceaniaData.chinaDetails = { ...cnAddr, provinceHint };
            } else {
              asiaOceaniaData = { chinaDetails: { ...cnAddr, provinceHint } };
            }
          }
        }

        // For UK, also try postcodes.io for even more detail
        if (cc === 'gb') {
          const ukPcRes = await fetchUKPostcodeDetails(pc);
          if (ukPcRes && ukIrelandContext) {
            ukIrelandContext.postcodeDetails = ukPcRes;
          } else if (ukPcRes) {
            ukIrelandContext = { landmarks: [], postcodeDetails: ukPcRes };
          }
        }

        // For Brazil, use ViaCEP for more detailed address
        if (cc === 'br') {
          const brPcRes = await fetchBrazilViaCEP(pc);
          if (brPcRes) {
            if (officialRegionalData) {
              officialRegionalData = { ...officialRegionalData, viaCEP: brPcRes };
            } else {
              officialRegionalData = { viaCEP: brPcRes };
            }
          }
        }

        // For India, use Pincode API
        if (cc === 'in') {
          const inPcRes = await fetchIndiaOfficialAddress(pc);
          if (inPcRes) {
            officialRegionalData = inPcRes;
          }
        }

        // Fetch Global Enrichment via Zippopotam
        const globalZippo = await fetchGlobalPostcodeDetails(cc, pc);
        if (globalZippo) {
          zippoData = globalZippo;
        }
      } catch (e) {}
    }

    // Add OS Grid Reference for UK
    if (cc === 'gb') {
      const grid = latLonToOSGrid(lat, lon);
      if (grid) {
        if (ukIrelandContext) {
          ukIrelandContext.osGridRef = grid.gridRef;
        } else {
          ukIrelandContext = { landmarks: [], osGridRef: grid.gridRef };
        }
      }
    }
  } catch (e) {
    console.error('API fetch error:', e);
  }

  // Calculate delivery difficulty based on elevation and water risk (mock logic for AGID integration)
  let deliveryDifficulty = 'Normal';
  if (elevationData && elevationData.elevation !== undefined) {
    const elev = elevationData.elevation;
    if (elev > 2000) deliveryDifficulty = 'Extreme (High Altitude)';
    else if (elev > 1000) deliveryDifficulty = 'Hard (Mountainous)';
    else if (elev > 500) deliveryDifficulty = 'Moderate (Hilly)';
  }

  let floodRisk = 'Low';
  if (waterData && waterData.risk_level) {
    floodRisk = waterData.risk_level;
    if (floodRisk.includes('High')) {
      deliveryDifficulty = deliveryDifficulty === 'Normal' ? 'Hard (Flood Risk)' : `Extreme (Alt + Flood)`;
    } else if (floodRisk.includes('Moderate') && deliveryDifficulty === 'Normal') {
      deliveryDifficulty = 'Moderate (Water Proximity)';
    }
  }

  // If we have Nominatim data, enrich it with our local Postal Code DB, Zippopotam, Elevation, and Flood Risk
  if (nominatimData && nominatimData.address) {
    // Nordic specialized enrichment
    if (nordicContext?.addressDetails) {
      const nAddr = nordicContext.addressDetails;
      if (!nominatimData.address.postcode && nAddr.postcode) nominatimData.address.postcode = nAddr.postcode;
      if (!nominatimData.address.city && nAddr.city) nominatimData.address.city = nAddr.city;
      if (!nominatimData.address.road && nAddr.street) nominatimData.address.road = nAddr.street;
      if (!nominatimData.address.house_number && nAddr.houseNumber) nominatimData.address.house_number = nAddr.houseNumber;
      if (!nominatimData.address.municipality && nAddr.municipality) nominatimData.address.municipality = nAddr.municipality;
    }

    // European Postal enrichment
    if (europeanPostalData) {
      if (!nominatimData.address.postcode && europeanPostalData.postcode) nominatimData.address.postcode = europeanPostalData.postcode;
      if (!nominatimData.address.city && europeanPostalData.city) nominatimData.address.city = europeanPostalData.city;
      if (!nominatimData.address.road && europeanPostalData.street) nominatimData.address.road = europeanPostalData.street;
      if (!nominatimData.address.house_number && europeanPostalData.houseNumber) nominatimData.address.house_number = europeanPostalData.houseNumber;
      if (cc === 'fr' && europeanPostalData.context) nominatimData.address.state = europeanPostalData.context;
    }

    // Asia/Oceania enrichment
    if (asiaOceaniaData) {
      if (!nominatimData.address.postcode && asiaOceaniaData.postcode) nominatimData.address.postcode = asiaOceaniaData.postcode;
      if (!nominatimData.address.city && asiaOceaniaData.city) nominatimData.address.city = asiaOceaniaData.city;
      if (!nominatimData.address.road && asiaOceaniaData.street) nominatimData.address.road = asiaOceaniaData.street;
      if (!nominatimData.address.house_number && asiaOceaniaData.houseNumber) nominatimData.address.house_number = asiaOceaniaData.houseNumber;
      if (!nominatimData.address.suburb && asiaOceaniaData.suburb) nominatimData.address.suburb = asiaOceaniaData.suburb;
      if (!nominatimData.address.state && asiaOceaniaData.state) nominatimData.address.state = asiaOceaniaData.state;

      // Japan specific Zipcloud & Overpass Context enrichment
      if (cc === 'jp') {
        const jp = asiaOceaniaData.japanDetails;
        const jg = japaneseGeoContext;

        if (jp) {
          if (!nominatimData.address.state) nominatimData.address.state = jp.address1;
          if (!nominatimData.address.city) nominatimData.address.city = jp.address2;
          if (!nominatimData.address.suburb) nominatimData.address.suburb = jp.address3;
          nominatimData.address.kana = `${jp.kana1} ${jp.kana2} ${jp.kana3}`;
        }

        // Overpass context is usually more precise for exact building/ward/block
        if (jg) {
          if (jg.prefecture) nominatimData.address.state = jg.prefecture;
          if (jg.city) nominatimData.address.city = jg.city;
          if (jg.ward) nominatimData.address.city_district = jg.ward;
          if (jg.town) nominatimData.address.suburb = jg.town;
          if (jg.chome) nominatimData.address.neighbourhood = jg.chome;
          if (jg.building) nominatimData.address.building = jg.building;

          // Special field for Japanese formatting
          nominatimData.address.jp_chome = jg.chome;
          nominatimData.address.jp_block = jg.block;
          nominatimData.address.jp_number = jg.number;
        }
      }
    }

    // Zippopotam enrichment
    if (zippoData && zippoData.places && zippoData.places.length > 0) {
      const place = zippoData.places[0];
      if (!nominatimData.address.state && place.state) nominatimData.address.state = place.state;
      if (!nominatimData.address.city && place['place name']) nominatimData.address.city = place['place name'];
    }

    // Fallback to local DB
    if (localData && localData.postalCode) {
      if (!nominatimData.address.postcode) nominatimData.address.postcode = localData.postalCode;
      if (!nominatimData.address.state && !nominatimData.address.province && localData.adminName1) nominatimData.address.state = localData.adminName1;
      if (!nominatimData.address.city && !nominatimData.address.town && localData.adminName2) nominatimData.address.city = localData.adminName2;
    }

    // Attach elevation, difficulty, flood risk, and mountain info
    if (elevationData) {
      nominatimData.elevation = elevationData.elevation;
      nominatimData.mountain_class = calculateMountainClass(elevationData.elevation);
      if (!nominatimData.official_regional_data) nominatimData.official_regional_data = {};
      nominatimData.official_regional_data.elevation_source = elevationData.source;
    }
    nominatimData.delivery_difficulty = deliveryDifficulty;
    nominatimData.flood_risk = floodRisk;

    if (mountainData && mountainData.peaks && mountainData.peaks.length > 0) {
      nominatimData.mountain_name = mountainData.peaks[0].name;
    }

    // Prioritize official European address data
    if (europeanPostalData) {
      if (europeanPostalData.postcode) nominatimData.address.postcode = europeanPostalData.postcode;
      if (europeanPostalData.city) nominatimData.address.city = europeanPostalData.city;
      if (europeanPostalData.street) nominatimData.address.road = europeanPostalData.street;
      if (europeanPostalData.houseNumber) nominatimData.address.house_number = europeanPostalData.houseNumber;
      if (europeanPostalData.label) nominatimData.display_name = europeanPostalData.label;
    }

    // Prioritize official Nordic address data
    if (nordicContext?.addressDetails) {
      const ad = nordicContext.addressDetails;
      if (ad.postcode) nominatimData.address.postcode = ad.postcode;
      if (ad.city) nominatimData.address.city = ad.city;
      if (ad.street) nominatimData.address.road = ad.street;
      if (ad.houseNumber) nominatimData.address.house_number = ad.houseNumber;
    }

    if (geoRiskData) {
      nominatimData.landslide_risk = geoRiskData.risks?.landslide;
      nominatimData.seismic_risk = geoRiskData.risks?.seismic;
      nominatimData.land_cover = geoRiskData.land_cover;
    }

    nominatimData.west_asia_context = westAsiaContext;
    nominatimData.russia_context = russiaContext;
    nominatimData.central_asia_context = centralAsiaContext;
    nominatimData.south_asia_context = southAsiaContext;
    nominatimData.uk_ireland_context = ukIrelandContext;
    nominatimData.nordic_context = nordicContext;
    nominatimData.local_postal_data = localData;
    nominatimData.zippopotam_data = zippoData;
    nominatimData.european_postal_data = europeanPostalData;
    nominatimData.asia_oceania_data = asiaOceaniaData;
    nominatimData.oceania_context = oceaniaContext;
    nominatimData.east_asia_context = eastAsiaContext;
    nominatimData.north_america_context = northAmericaContext;
    nominatimData.south_america_context = southAmericaContext;
    nominatimData.caribbean_context = caribbeanContext;
    nominatimData.central_america_context = centralAmericaContext;
    nominatimData.southeast_asia_context = southeastAsiaContext;
    nominatimData.africa_context = africaContext;
    nominatimData.us_census_data = usCensusData;
    nominatimData.official_regional_data = officialRegionalData;
    nominatimData.polar_context = polarContext;
    nominatimData.polar_official_data = polarOfficialData;
    nominatimData.nature_context = natureContext;
    nominatimData.sea_context = seaContext;
    nominatimData.heritage_context = heritageContext;
    nominatimData.japanese_geo_context = japaneseGeoContext;

    if (globalContextIdx !== -1 && results[globalContextIdx] && results[globalContextIdx].status === 'fulfilled') {
      nominatimData.global_context = (results[globalContextIdx] as PromiseFulfilledResult<any>).value;
    }

    if (plusCodeIdx !== -1 && results[plusCodeIdx] && results[plusCodeIdx].status === 'fulfilled') {
      nominatimData.plus_code = (results[plusCodeIdx] as PromiseFulfilledResult<any>).value;
    }

    if (hkAlsIdx !== -1 && results[hkAlsIdx] && results[hkAlsIdx].status === 'fulfilled') {
      const hkData = (results[hkAlsIdx] as PromiseFulfilledResult<any>).value;
      if (hkData) {
        nominatimData.official_regional_data = { ...nominatimData.official_regional_data, hkALS: hkData };
        // Improve search labels for countries without postcodes
        if (!nominatimData.address.suburb && hkData.district) {
          nominatimData.address.suburb = hkData.district;
        }
      }
    }

    const { extractBuildingNameFromReverseGeocode } = await loadBuildingNameModule();
    const reverseBuilding = extractBuildingNameFromReverseGeocode(nominatimData, langCode);
    const preferredBuilding = buildingNameData || (reverseBuilding ? { ...reverseBuilding, category: 'address' } : null);
    if (preferredBuilding?.name) {
      if (!nominatimData.address.building) nominatimData.address.building = preferredBuilding.name;
      if (preferredBuilding.nameEn && !nominatimData.address.building_en) {
        nominatimData.address.building_en = preferredBuilding.nameEn;
      }
      nominatimData.building_name_data = preferredBuilding;
      nominatimData.building_name_source = preferredBuilding.source;
    }
    const { applyMapAddressFeaturesToAddress } = await loadMapFeatureAddressModule();
    nominatimData.address = applyMapAddressFeaturesToAddress(nominatimData.address, mapAddressFeatureSummary);
    if (mapAddressFeatureData?.name) {
      nominatimData.map_feature_name = mapAddressFeatureData.name;
      nominatimData.map_feature_kind = mapAddressFeatureData.kind;
      nominatimData.map_feature_source = mapAddressFeatureData.source;
      nominatimData.map_feature_data = mapAddressFeatureData;
      nominatimData.map_feature_candidates = mapAddressFeatureSummary?.features || [];
      nominatimData.map_feature_by_kind = mapAddressFeatureSummary?.byKind || {};
      nominatimData.map_feature_hierarchy = mapAddressFeatureSummary?.hierarchy || [];
      nominatimData.map_feature_sources = mapAddressFeatureSummary?.sources || [];
    }

    const addressSources = [
      'nominatim',
      localData?.postalCode ? 'geonames-postal' : '',
      zippoData ? 'zippopotam' : '',
      europeanPostalData ? 'regional-open-data' : '',
      asiaOceaniaData ? 'asia-oceania-open-data' : '',
      nordicContext?.addressDetails ? 'nordic-open-data' : '',
      officialRegionalData ? 'official-regional-api' : '',
      usCensusData ? 'us-census' : '',
      japaneseGeoContext ? 'japanese-open-data' : '',
      preferredBuilding ? 'osm-building-name' : '',
      mapAddressFeatureSummary?.features.length ? 'osm-map-feature-name' : '',
    ].filter(Boolean) as string[];
    nominatimData.address_analysis = await enrichAnalysisWithOptionalLibpostal(analyzeAddress({
      apiAddress: nominatimData.address,
      displayName: nominatimData.display_name,
      sources: addressSources,
    }), nominatimData.display_name, cc);
    nominatimData.address = {
      ...nominatimData.address,
      ...nominatimData.address_analysis.canonical,
      building_en: nominatimData.address.building_en,
      building_name_source: nominatimData.building_name_source,
      building_name_data: nominatimData.building_name_data,
      map_feature_name: nominatimData.address.map_feature_name,
      map_feature_name_en: nominatimData.address.map_feature_name_en,
      map_feature_kind: nominatimData.address.map_feature_kind,
      map_feature_source: nominatimData.address.map_feature_source,
      map_feature_data: nominatimData.address.map_feature_data,
      map_feature_candidates: nominatimData.address.map_feature_candidates,
      map_feature_by_kind: nominatimData.address.map_feature_by_kind,
      map_feature_hierarchy: nominatimData.address.map_feature_hierarchy,
      map_feature_sources: nominatimData.address.map_feature_sources,
    };

    return nominatimData;
  }

  // If Nominatim failed but we have local data as fallback
  if (localData && localData.postalCode) {
    const finalOfficialData = officialRegionalData || {};
    if (elevationData) finalOfficialData.elevation_source = elevationData.source;
    const { applyMapAddressFeaturesToAddress } = await loadMapFeatureAddressModule();
    const address = applyMapAddressFeaturesToAddress({
      country_code: localData.countryCode.toLowerCase(),
      country: localData.countryCode,
      state: localData.adminName1,
      city: localData.adminName2 || localData.placeName,
      suburb: localData.adminName3 || (localData.adminName2 ? localData.placeName : ''),
      postcode: localData.postalCode,
      building: buildingNameData?.name || '',
      building_en: buildingNameData?.nameEn || '',
      building_name_source: buildingNameData?.source || '',
      building_name_data: buildingNameData,
    }, mapAddressFeatureSummary);
    const displayName = [address.building || address.poi || address.map_feature_name, address.postcode, address.suburb, address.city, address.state, address.country].filter(Boolean).join(', ');
    const addressAnalysis = await enrichAnalysisWithOptionalLibpostal(analyzeAddress({
      apiAddress: address,
      displayName,
      sources: ['geonames-postal', buildingNameData ? 'osm-building-name' : '', mapAddressFeatureSummary?.features.length ? 'osm-map-feature-name' : ''].filter(Boolean),
    }), displayName, localData.countryCode);

    return {
      elevation: elevationData?.elevation,
      delivery_difficulty: deliveryDifficulty,
      plus_code: (results[plusCodeIdx] && results[plusCodeIdx].status === 'fulfilled') ? (results[plusCodeIdx] as PromiseFulfilledResult<any>).value : null,
      flood_risk: floodRisk,
      mountain_name: mountainData?.peaks?.[0]?.name,
      landslide_risk: geoRiskData?.risks?.landslide,
      seismic_risk: geoRiskData?.risks?.seismic,
      land_cover: geoRiskData?.land_cover,
      west_asia_context: westAsiaContext,
      russia_context: russiaContext,
      central_asia_context: centralAsiaContext,
      south_asia_context: southAsiaContext,
      uk_ireland_context: ukIrelandContext,
      nordic_context: nordicContext,
      local_postal_data: localData,
      zippopotam_data: zippoData,
      european_postal_data: europeanPostalData,
      asia_oceania_data: asiaOceaniaData,
      oceania_context: oceaniaContext,
      east_asia_context: eastAsiaContext,
      north_america_context: northAmericaContext,
      south_america_context: southAmericaContext,
      caribbean_context: caribbeanContext,
      central_america_context: centralAmericaContext,
      southeast_asia_context: southeastAsiaContext,
      africa_context: africaContext,
      us_census_data: usCensusData,
      official_regional_data: finalOfficialData,
      polar_context: polarContext,
      polar_official_data: polarOfficialData,
      nature_context: natureContext,
      sea_context: seaContext,
      heritage_context: heritageContext,
      address_analysis: addressAnalysis,
      address: {
        ...address,
        ...addressAnalysis.canonical,
        building_en: address.building_en,
        building_name_source: address.building_name_source,
        building_name_data: address.building_name_data,
        map_feature_name: address.map_feature_name,
        map_feature_name_en: address.map_feature_name_en,
        map_feature_kind: address.map_feature_kind,
        map_feature_source: address.map_feature_source,
        map_feature_data: address.map_feature_data,
        map_feature_candidates: address.map_feature_candidates,
        map_feature_by_kind: address.map_feature_by_kind,
        map_feature_hierarchy: address.map_feature_hierarchy,
        map_feature_sources: address.map_feature_sources,
      }
    };
  }

  if (buildingNameData || mapAddressFeatureSummary?.features.length) {
    const { applyMapAddressFeaturesToAddress } = await loadMapFeatureAddressModule();
    const address = applyMapAddressFeaturesToAddress({
      country_code: cc,
      country: countryCode.toUpperCase(),
      building: buildingNameData?.name || '',
      building_en: buildingNameData?.nameEn || '',
      building_name_source: buildingNameData?.source || '',
      building_name_data: buildingNameData,
    }, mapAddressFeatureSummary);
    const displayName = address.building || address.poi || address.map_feature_name || '';
    const addressAnalysis = await enrichAnalysisWithOptionalLibpostal(analyzeAddress({
      apiAddress: address,
      displayName,
      sources: [buildingNameData ? 'osm-building-name' : '', mapAddressFeatureSummary?.features.length ? 'osm-map-feature-name' : ''].filter(Boolean),
    }), displayName, cc);

    return {
      elevation: elevationData?.elevation,
      delivery_difficulty: deliveryDifficulty,
      plus_code: (results[plusCodeIdx] && results[plusCodeIdx].status === 'fulfilled') ? (results[plusCodeIdx] as PromiseFulfilledResult<any>).value : null,
      flood_risk: floodRisk,
      mountain_name: mountainData?.peaks?.[0]?.name,
      landslide_risk: geoRiskData?.risks?.landslide,
      seismic_risk: geoRiskData?.risks?.seismic,
      land_cover: geoRiskData?.land_cover,
      nature_context: natureContext,
      sea_context: seaContext,
      heritage_context: heritageContext,
      address_analysis: addressAnalysis,
      building_name_data: buildingNameData,
      building_name_source: buildingNameData?.source,
      map_feature_name: address.map_feature_name,
      map_feature_kind: address.map_feature_kind,
      map_feature_source: address.map_feature_source,
      map_feature_data: address.map_feature_data,
      map_feature_candidates: address.map_feature_candidates,
      map_feature_by_kind: address.map_feature_by_kind,
      map_feature_hierarchy: address.map_feature_hierarchy,
      map_feature_sources: address.map_feature_sources,
      address: {
        ...address,
        ...addressAnalysis.canonical,
        building_en: address.building_en,
        building_name_source: address.building_name_source,
        building_name_data: address.building_name_data,
        map_feature_name: address.map_feature_name,
        map_feature_name_en: address.map_feature_name_en,
        map_feature_kind: address.map_feature_kind,
        map_feature_source: address.map_feature_source,
        map_feature_data: address.map_feature_data,
        map_feature_candidates: address.map_feature_candidates,
        map_feature_by_kind: address.map_feature_by_kind,
        map_feature_hierarchy: address.map_feature_hierarchy,
        map_feature_sources: address.map_feature_sources,
      }
    };
  }

  // If all address APIs failed but we have physical-geography context, return a
  // natural address shell so seas, mountains, and waterfront areas can still be displayed.
  if (elevationData || waterData || natureContext || seaContext) {
    return {
      elevation: elevationData?.elevation,
      delivery_difficulty: deliveryDifficulty,
      plus_code: (results[plusCodeIdx] && results[plusCodeIdx].status === 'fulfilled') ? (results[plusCodeIdx] as PromiseFulfilledResult<any>).value : null,
      flood_risk: floodRisk,
      mountain_name: mountainData?.peaks?.[0]?.name,
      landslide_risk: geoRiskData?.risks?.landslide,
      seismic_risk: geoRiskData?.risks?.seismic,
      land_cover: geoRiskData?.land_cover,
      nature_context: natureContext,
      sea_context: seaContext,
      address: {}
    };
  }

  return null;
}
