import { agidFetch } from '../lib/agidHttpClient';
import { apiEndpoints } from '../lib/apiEndpoints';
import { buildPlaceSearchLanguageProfile } from '../lib/placeSearchLanguage';
import type { Coordinates,NamedCoordinates,OsrmRoute,PhotonFeature } from '../types/navigation';

type PhotonResponse = {
  features?: PhotonFeature[];
};

type OsrmRouteResponse = {
  code?: string;
  routes?: OsrmRoute[];
};

type FetchOptions = {
  fetcher?: typeof fetch;
};

export function shouldSuggestCurrentLocation(query: string) {
  const normalized = query.trim().toLowerCase();
  return normalized.length > 0 && (
    'my location'.includes(normalized)
    || normalized.includes('current')
  );
}

export function buildCurrentLocationPhotonFeature(location: Coordinates): PhotonFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [location.lng, location.lat],
    },
    properties: {
      name: 'My Location',
      city: 'Current GPS Position',
    },
  };
}

export function prependCurrentLocationSuggestion(
  query: string,
  features: PhotonFeature[],
  userLocation: Coordinates | null | undefined,
) {
  if (!userLocation || !shouldSuggestCurrentLocation(query)) return features;
  return [buildCurrentLocationPhotonFeature(userLocation), ...features];
}

export function photonFeatureToNamedCoordinates(feature: PhotonFeature): Required<NamedCoordinates> {
  const [lng, lat] = feature.geometry.coordinates;
  const primary = feature.properties.name || 'Selected location';
  const city = feature.properties.city;
  return {
    lat,
    lng,
    name: city ? `${primary}, ${city}` : primary,
  };
}

export async function fetchPhotonFeatures(query: string, limit = 5, options: FetchOptions = {}) {
  const profile = buildPlaceSearchLanguageProfile(query);
  const variants = profile.queryVariants.length ? profile.queryVariants.slice(0, 3) : [query];
  const seen = new Set<string>();
  const features: PhotonFeature[] = [];

  for (const variant of variants) {
    const response = await agidFetch<PhotonResponse>(apiEndpoints.photonSearch(variant, limit), {
      source: 'photon',
      timeoutMs: 8000,
      retries: 1,
      fetcher: options.fetcher,
    });

    for (const feature of response.data?.features || []) {
      const [lng, lat] = feature.geometry.coordinates;
      const key = `${lat.toFixed(6)}|${lng.toFixed(6)}|${feature.properties.name || ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      features.push(feature);
    }

    if (features.length > 0) break;
  }

  return features.slice(0, limit);
}

export async function fetchOsrmRoute(
  start: Coordinates,
  end: Coordinates,
  profile: string,
  options: FetchOptions = {},
) {
  const response = await agidFetch<OsrmRouteResponse>(apiEndpoints.osrmRoute(start, end, profile), {
    source: 'osrm',
    timeoutMs: 15000,
    retries: 1,
    fetcher: options.fetcher,
  });
  const data = response.data;
  if (data?.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
    return data.routes[0];
  }
  return null;
}
