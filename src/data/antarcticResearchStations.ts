import antarcticResearchStations from './antarcticResearchStations.json';

export type AntarcticResearchFacilityType =
  | 'airfield-camp'
  | 'camp'
  | 'depot'
  | 'laboratory'
  | 'refuge'
  | 'station';

export type AntarcticResearchFacilitySeasonality = 'seasonal' | 'year-round';

export type AntarcticResearchFacilityStatus = 'open' | 'temporarily-closed';

export interface AntarcticResearchFacility {
  id: string;
  sourceRecordId: number;
  name: string;
  sourceEnglishName: string;
  officialName: string | null;
  aliases: string[];
  operatorCountry: string | null;
  operatorCountryCode: string | null;
  additionalOperators: string[];
  type: AntarcticResearchFacilityType;
  seasonality: AntarcticResearchFacilitySeasonality;
  status: AntarcticResearchFacilityStatus;
  yearEstablished: number | null;
  antarcticRegion: string | null;
  coordinates: {
    lat: number;
    lon: number;
    latDdm: string | null;
    lonDdm: string | null;
  };
  elevationMeters: number | null;
  peakPopulation: number | null;
  insideAntarcticTreatyArea: boolean;
  addressComponents: {
    stationOrBase: string;
    region: string | null;
    country: 'Antarctica';
  };
  sourceIds: string[];
  sourceModifiedAt: string | null;
}

export interface AntarcticResearchFacilityCandidate extends AntarcticResearchFacility {
  distanceKm: number;
}

export interface NearbyAntarcticFacilityOptions {
  includeSubantarctic?: boolean;
  limit?: number;
  statuses?: readonly AntarcticResearchFacilityStatus[];
  types?: readonly AntarcticResearchFacilityType[];
}

type AntarcticResearchStationData = {
  sourceIds: string[];
  facilities: AntarcticResearchFacility[];
};

const data = antarcticResearchStations as AntarcticResearchStationData;

export const ANTARCTIC_RESEARCH_STATION_SOURCE_IDS = data.sourceIds;
export const ANTARCTIC_RESEARCH_FACILITIES = data.facilities;

export function getNearbyAntarcticFacilities(
  lat: number,
  lon: number,
  radiusKm = 50,
  options: NearbyAntarcticFacilityOptions = {},
): AntarcticResearchFacilityCandidate[] {
  const statuses = new Set(options.statuses ?? ['open']);
  const types = options.types ? new Set(options.types) : null;
  const limit = options.limit ?? 5;

  return ANTARCTIC_RESEARCH_FACILITIES
    .filter(facility => options.includeSubantarctic || facility.insideAntarcticTreatyArea)
    .filter(facility => statuses.has(facility.status))
    .filter(facility => !types || types.has(facility.type))
    .map(facility => ({
      ...facility,
      distanceKm: haversineKm(lat, lon, facility.coordinates.lat, facility.coordinates.lon),
    }))
    .filter(candidate => candidate.distanceKm <= radiusKm)
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, limit);
}

export function getNearestAntarcticFacility(
  lat: number,
  lon: number,
  radiusKm = 50,
  options: Omit<NearbyAntarcticFacilityOptions, 'limit'> = {},
): AntarcticResearchFacilityCandidate | null {
  return getNearbyAntarcticFacilities(lat, lon, radiusKm, { ...options, limit: 1 })[0] ?? null;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radiusKm = 6371;
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);
  const a = Math.sin(deltaPhi / 2) ** 2
    + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return value * Math.PI / 180;
}
