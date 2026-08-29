import type maplibregl from 'maplibre-gl';
import type { PostalContextLookupResponse } from '../services/PostalContextService';
import type { SearchResultFeature } from '../types/navigation';

export const POSTAL_SEARCH_AREA_SOURCE_ID = 'postal-search-area';
export const POSTAL_SEARCH_AREA_FILL_LAYER_ID = 'postal-search-area-fill';
export const POSTAL_SEARCH_AREA_OUTLINE_LAYER_ID = 'postal-search-area-outline';

type PostalAreaGeometry = Extract<
  PostalContextLookupResponse['geometries'][number]['geometry'],
  { type: 'Polygon' | 'MultiPolygon' }
>;

export type PostalAreaFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: PostalAreaGeometry;
    properties: {
      postalCode: string;
      label: string;
      sourceId: string;
      licenseId: string;
      sourceDigest: string;
      geometryType: PostalAreaGeometry['type'];
    };
  }>;
};

export type PostalAreaLookupCandidate = {
  countryCode: string;
  postalCode: string;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown) {
  const normalized = String(value ?? '').trim();
  return normalized || undefined;
}

function postalKey(value: unknown) {
  return String(value ?? '').normalize('NFKC').toUpperCase().replace(/[^0-9A-Z]/g, '');
}

function singleCountryFallback(value: string | undefined) {
  const countries = String(value ?? '')
    .split(',')
    .map(country => country.trim().toUpperCase())
    .filter(country => /^[A-Z]{2}$/.test(country));
  return countries.length === 1 ? countries[0] : undefined;
}

export function resolvePostalAreaLookupCandidate(
  result: SearchResultFeature,
  query: string,
  countryFilter?: string,
): PostalAreaLookupCandidate | null {
  const address = record(result.address);
  const tags = record(result.tags);
  const postalCode = text(address.postcode)
    ?? text(result.postcode)
    ?? text(result.postal_code);
  if (!postalCode || !postalKey(query) || postalKey(query) !== postalKey(postalCode)) return null;

  const countryCode = (
    text(address.country_code)
    ?? text(result.country_code)
    ?? text(result.countrycode)
    ?? text(tags.countrycode)
    ?? text(tags['addr:country'])
    ?? singleCountryFallback(countryFilter)
  )?.toUpperCase();
  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) return null;
  return { countryCode, postalCode };
}

export function createPostalAreaFeatureCollection(
  lookup: PostalContextLookupResponse,
): PostalAreaFeatureCollection {
  const postalCode = lookup.normalizedPostalCode ?? '';
  return {
    type: 'FeatureCollection',
    features: lookup.geometries.flatMap(item => {
      if (item.node.kind !== 'postal_feature') return [];
      if (item.geometry.type !== 'Polygon' && item.geometry.type !== 'MultiPolygon') return [];
      return [{
        type: 'Feature' as const,
        geometry: item.geometry,
        properties: {
          postalCode: item.node.postalCode ?? postalCode,
          label: item.node.label ?? postalCode,
          sourceId: item.source.sourceId,
          licenseId: item.source.licenseId,
          sourceDigest: item.source.digest,
          geometryType: item.geometry.type,
        },
      }];
    }),
  };
}

export function postalAreaBounds(
  collection: PostalAreaFeatureCollection,
): [[number, number], [number, number]] | null {
  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;
  const visit = (value: unknown): void => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      const [longitude, latitude] = value;
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return;
      west = Math.min(west, longitude);
      south = Math.min(south, latitude);
      east = Math.max(east, longitude);
      north = Math.max(north, latitude);
      return;
    }
    value.forEach(visit);
  };
  collection.features.forEach(feature => visit(feature.geometry.coordinates));
  return Number.isFinite(west) ? [[west, south], [east, north]] : null;
}

export function syncPostalAreaMapLayer(
  map: maplibregl.Map,
  collection: PostalAreaFeatureCollection | null,
) {
  if (!map.isStyleLoaded()) return;
  if (!collection?.features.length) {
    if (map.getLayer(POSTAL_SEARCH_AREA_OUTLINE_LAYER_ID)) map.removeLayer(POSTAL_SEARCH_AREA_OUTLINE_LAYER_ID);
    if (map.getLayer(POSTAL_SEARCH_AREA_FILL_LAYER_ID)) map.removeLayer(POSTAL_SEARCH_AREA_FILL_LAYER_ID);
    if (map.getSource(POSTAL_SEARCH_AREA_SOURCE_ID)) map.removeSource(POSTAL_SEARCH_AREA_SOURCE_ID);
    return;
  }

  const source = map.getSource(POSTAL_SEARCH_AREA_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  if (source) {
    source.setData(collection as never);
  } else {
    map.addSource(POSTAL_SEARCH_AREA_SOURCE_ID, { type: 'geojson', data: collection as never });
  }
  if (!map.getLayer(POSTAL_SEARCH_AREA_FILL_LAYER_ID)) {
    map.addLayer({
      id: POSTAL_SEARCH_AREA_FILL_LAYER_ID,
      type: 'fill',
      source: POSTAL_SEARCH_AREA_SOURCE_ID,
      paint: {
        'fill-color': '#2563eb',
        'fill-opacity': 0.22,
      },
    });
  }
  if (!map.getLayer(POSTAL_SEARCH_AREA_OUTLINE_LAYER_ID)) {
    map.addLayer({
      id: POSTAL_SEARCH_AREA_OUTLINE_LAYER_ID,
      type: 'line',
      source: POSTAL_SEARCH_AREA_SOURCE_ID,
      paint: {
        'line-color': '#1d4ed8',
        'line-opacity': 0.95,
        'line-width': 3,
      },
    });
  }
}
