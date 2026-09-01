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
      provenance: string;
      sourceDate: string;
      confidence: number | null;
      accuracyMeters: number | null;
    };
  }>;
};

export type PostalAreaLookupCandidate = {
  countryCode: string;
  postalCode: string;
};

function samePosition(a: unknown, b: unknown) {
  return Array.isArray(a) && Array.isArray(b)
    && a.length >= 2 && b.length >= 2
    && a[0] === b[0] && a[1] === b[1];
}

function validPosition(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length >= 2
    && typeof value[0] === 'number' && Number.isFinite(value[0])
    && typeof value[1] === 'number' && Number.isFinite(value[1])
    && value[0] >= -180 && value[0] <= 180
    && value[1] >= -90 && value[1] <= 90;
}

function validRing(value: unknown) {
  return Array.isArray(value) && value.length >= 4
    && value.every(validPosition)
    && samePosition(value[0], value.at(-1));
}

function validPolygon(value: unknown) {
  return Array.isArray(value) && value.length > 0 && value.every(validRing);
}

export function isRenderablePostalAreaGeometry(value: unknown): value is PostalAreaGeometry {
  const geometry = record(value);
  if (geometry.type === 'Polygon') return validPolygon(geometry.coordinates);
  return geometry.type === 'MultiPolygon'
    && Array.isArray(geometry.coordinates)
    && geometry.coordinates.length > 0
    && geometry.coordinates.every(validPolygon);
}

export function hasInvalidPostalAreaGeometry(lookup: PostalContextLookupResponse) {
  return lookup.geometries.some(item => item.node.kind === 'postal_feature'
    && (item.geometry.type === 'Polygon' || item.geometry.type === 'MultiPolygon')
    && !isRenderablePostalAreaGeometry(item.geometry));
}

export function postalAreaUnavailableDetail(lookup: PostalContextLookupResponse) {
  if (hasInvalidPostalAreaGeometry(lookup)) {
    return 'APIが返した郵便区域geometryが無効なため表示を拒否しました。点・建物データから面を補完していません。';
  }
  const kinds = new Set([
    ...lookup.postalFeatures.map(feature => feature.featureKind),
    ...lookup.alternatives.map(alternative => alternative.postalFeature.featureKind),
  ]);
  if (kinds.has('po_box')) {
    return 'この郵便番号はPO Box分類で、公開済みのPolygon/MultiPolygonがありません。周辺に面を捏造していません。';
  }
  if (kinds.has('organization') || kinds.has('large_user')) {
    return 'この郵便番号は法人・大口利用者分類で、公開済みのPolygon/MultiPolygonがありません。建物や敷地を郵便区域に代用していません。';
  }
  if (kinds.has('route')) {
    return 'この郵便番号は集配・返信・端末等の非面分類で、公開済みのPolygon/MultiPolygonがありません。経路や拠点から面を捏造していません。';
  }
  if (kinds.has('standard_area')) {
    return '現行の通常郵便番号ですが、選択中の公開境界版には対応するPolygon/MultiPolygonがありません。自治体や近隣区域で補完していません。';
  }
  return 'この郵便番号には公開済みのPolygon/MultiPolygonがありません。点・建物データを郵便区域として表示していません。';
}

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
      if (!isRenderablePostalAreaGeometry(item.geometry)) return [];
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
          provenance: item.quality.status,
          sourceDate: item.source.sourceDate ?? item.validTime.from.slice(0, 10),
          confidence: item.quality.confidence ?? null,
          accuracyMeters: item.quality.accuracyMeters ?? null,
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

function syncPostalAreaMapLayerReady(
  map: maplibregl.Map,
  collection: PostalAreaFeatureCollection | null,
) {
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

export function syncPostalAreaMapLayer(
  map: maplibregl.Map,
  collection: PostalAreaFeatureCollection | null,
) {
  if (!map.isStyleLoaded()) return;
  syncPostalAreaMapLayerReady(map, collection);
}

export function subscribePostalAreaMapLayer(
  map: maplibregl.Map,
  collection: PostalAreaFeatureCollection | null,
) {
  const clearRetry = () => {
    map.off('styledata', retryWhenPossible);
    map.off('idle', syncWhenReady);
  };
  const syncWhenReady = () => {
    try {
      syncPostalAreaMapLayerReady(map, collection);
      clearRetry();
      return true;
    } catch (error) {
      if (map.isStyleLoaded()) throw error;
      return false;
    }
  };
  function retryWhenPossible() {
    syncWhenReady();
  }
  const syncOnStyleLoad = () => {
    if (syncWhenReady()) return;
    map.on('styledata', retryWhenPossible);
    map.on('idle', syncWhenReady);
  };

  syncOnStyleLoad();
  map.on('style.load', syncOnStyleLoad);

  return () => {
    map.off('style.load', syncOnStyleLoad);
    clearRetry();
  };
}
