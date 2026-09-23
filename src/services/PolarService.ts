
import {
  getNearbyAntarcticFacilities,
  getNearestAntarcticFacility,
  type AntarcticResearchFacilityCandidate,
} from '../data/antarcticResearchStations';
import {
  type PolarOpenGeoSource,
  getPolarOpenGeoSourcesForCoordinate,
  getPolarOpenSourceIdsForCoordinate,
} from '../data/polarOpenGeoSources';
import { fetchWithRetry } from '../lib/utils';
import { RegionalLandmark } from './WestAsiaService';

export interface PolarContext {
  region: string;
  features: RegionalLandmark[];
  seaIce?: string;
  bathymetry?: string;
  openSourceIds?: string[];
  openSources?: PolarOpenGeoSource[];
  naturalSources?: PolarOpenGeoSource[];
  facilitySources?: PolarOpenGeoSource[];
  researchFacilities?: AntarcticResearchFacilityCandidate[];
}

/**
 * Fetch context for Polar Regions (Arctic and Antarctic)
 */
export async function fetchPolarContext(lat: number, lon: number): Promise<PolarContext | null> {
  const isArctic = lat > 60;
  const isAntarctic = lat < -60;

  if (!isArctic && !isAntarctic) return null;

  const features: RegionalLandmark[] = [];
  let region = isArctic ? "Arctic Region" : "Antarctic Region";
  const openSourceIds = getPolarOpenSourceIdsForCoordinate(lat);
  const openSources = getPolarOpenGeoSourcesForCoordinate(lat);
  const naturalSources = openSources.filter(source => source.kind !== 'facility');
  const facilitySources = openSources.filter(source => source.kind === 'facility');
  let researchFacilities: AntarcticResearchFacilityCandidate[] = [];

  try {
    // 1. Marine Regions API via Proxy
    const marineRes = await fetchWithRetry(`/api/marine-regions?lat=${lat}&lon=${lon}`);
    if (marineRes.ok) {
      const data = await marineRes.json();
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          features.push({
            name: item.preferredGazetteerName,
            type: item.placeType,
            distance: 0, // Approximate
          });
          if (item.placeType === 'Ocean' || item.placeType === 'Sea') {
            region = item.preferredGazetteerName;
          }
        });
      }
    }
  } catch (e) {
    console.error('Marine Regions API error:', e);
  }

  // 2. SCAR Composite Gazetteer of Antarctica (CGA)
  if (isAntarctic) {
    try {
      // SCAR Gazetteer search (Simplified fallback to OSM if API is complex)
      // For now, we rely on Nominatim but we can add specialized Antarctic data here
      features.push({
        name: "Antarctic Treaty Area",
        type: "Territory",
        distance: 0,
      });
      researchFacilities = getNearbyAntarcticFacilities(lat, lon, 100, {
        includeSubantarctic: true,
        limit: 5,
      });
      for (const facility of researchFacilities) {
        features.push({
          name: facility.name,
          type: `Research ${facility.type.replaceAll('-', ' ')}`,
          distance: Math.round(facility.distanceKm * 1000),
          tags: {
            operatorCountry: facility.operatorCountry ?? '',
            seasonality: facility.seasonality,
            status: facility.status,
            source: 'antarcticResearchStations.json',
          },
        });
      }
    } catch (e) {
      console.error('SCAR Gazetteer error:', e);
    }
  }

  // 3. Arctic Data (General)
  if (isArctic) {
    features.push({
      name: "Arctic Circle Region",
      type: "Region",
      distance: 0,
    });
  }

  return {
    region,
    features,
    seaIce: "Data available via NSIDC polar datasets (satellite observation required)",
    bathymetry: isAntarctic
      ? "Data available via IBCSO and GEBCO"
      : "Data available via IBCAO and GEBCO",
    openSourceIds,
    openSources,
    naturalSources,
    facilitySources,
    researchFacilities,
  };
}

/**
 * Fetch official address-like data for polar research stations
 */
export async function fetchPolarOfficialData(lat: number, lon: number): Promise<any> {
  // Research stations often have specific names but no traditional "address"
  // We use Overpass API to find research stations nearby
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="research_station"](around:50000,${lat},${lon});
      way["amenity"="research_station"](around:50000,${lat},${lon});
      relation["amenity"="research_station"](around:50000,${lat},${lon});
    );
    out center;
  `;

  try {
    const res = await fetchWithRetry('/api/overpass', {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.elements && data.elements.length > 0) {
        const station = data.elements[0];
        const tags = station.tags || {};
        return {
          address: {
            research_station: tags.name || tags['name:en'] || "Unnamed Research Station",
            operator: tags.operator || tags.owner,
            country: tags['addr:country'] || tags.country,
            type: "Polar Research Station"
          }
        };
      }
    }
  } catch (e) {
    console.error('Polar Overpass error:', e);
  }

  const localStation = getNearestAntarcticFacility(lat, lon, 50, {
    includeSubantarctic: true,
  });

  if (!localStation) return null;

  return {
    address: {
      research_station: localStation.name,
      operator: localStation.operatorCountry,
      operator_country_code: localStation.operatorCountryCode,
      country: "Antarctica",
      type: "Polar Research Station",
      facility_type: localStation.type,
      seasonality: localStation.seasonality,
      source: "antarcticResearchStations.json",
      source_record_id: localStation.sourceRecordId,
      distance_meters: Math.round(localStation.distanceKm * 1000),
    }
  };
}
