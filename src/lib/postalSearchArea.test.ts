import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PostalContextLookupResponse } from '../services/PostalContextService';
import {
  POSTAL_SEARCH_AREA_FILL_LAYER_ID,
  POSTAL_SEARCH_AREA_OUTLINE_LAYER_ID,
  POSTAL_SEARCH_AREA_SOURCE_ID,
  createPostalAreaFeatureCollection,
  postalAreaBounds,
  resolvePostalAreaLookupCandidate,
  syncPostalAreaMapLayer,
} from './postalSearchArea';

const digest = `sha256:${'a'.repeat(64)}` as `sha256:${string}`;

function lookup(geometries: PostalContextLookupResponse['geometries']): PostalContextLookupResponse {
  return {
    status: 'unique',
    countryCode: 'JP',
    normalizedPostalCode: '100-0001',
    validAt: '2026-08-29T00:00:00.000Z',
    knownAt: '2026-08-29T00:00:00.000Z',
    release: {
      countryCode: 'JP',
      repositoryId: 'postal-jp',
      releaseId: '2026-08',
      manifestDigest: digest,
      policyVersion: 'v1',
      releasedAt: '2026-08-01T00:00:00.000Z',
      validTime: { from: '2026-08-01T00:00:00.000Z', to: null },
    },
    postalFeatures: [],
    contexts: [],
    assertionIds: [],
    alternatives: [],
    geometries,
    errors: [],
    warnings: [],
  };
}

const source = { sourceId: 'official-postal', licenseId: 'ODL-1.0', digest };

test('postal area lookup is attempted only when the query matches a result postcode', () => {
  const result = {
    display_name: 'Chiyoda, Tokyo',
    lat: '35.68',
    lon: '139.75',
    address: { postcode: '100-0001', country_code: 'jp' },
  };
  assert.deepEqual(resolvePostalAreaLookupCandidate(result, '1000001'), {
    countryCode: 'JP',
    postalCode: '100-0001',
  });
  assert.equal(resolvePostalAreaLookupCandidate(result, 'Tokyo'), null);
});

test('single explicit country filter can bind a postal result without a country field', () => {
  const result = {
    display_name: 'Postal result',
    lat: '1',
    lon: '2',
    postcode: '12345',
  };
  assert.deepEqual(resolvePostalAreaLookupCandidate(result, '12345', 'de'), {
    countryCode: 'DE',
    postalCode: '12345',
  });
  assert.equal(resolvePostalAreaLookupCandidate(result, '12345', 'de,fr'), null);
});

test('only postal Polygon and MultiPolygon geometries become map features', () => {
  const collection = createPostalAreaFeatureCollection(lookup([
    {
      node: { id: 'postal', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'polygon', postalCode: '100-0001' },
      geometry: { type: 'Polygon', coordinates: [[[139, 35], [140, 35], [140, 36], [139, 35]]] },
      source,
    },
    {
      node: { id: 'postal-point', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'point', postalCode: '100-0001' },
      geometry: { type: 'Point', coordinates: [139.5, 35.5] },
      source,
    },
    {
      node: { id: 'building', kind: 'building', featureKind: 'building', geometryType: 'polygon' },
      geometry: { type: 'Polygon', coordinates: [[[139.4, 35.4], [139.6, 35.4], [139.6, 35.6], [139.4, 35.4]]] },
      source,
    },
    {
      node: { id: 'postal-multi', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'multipolygon', postalCode: '100-0001' },
      geometry: { type: 'MultiPolygon', coordinates: [[[[138, 34], [138.5, 34], [138.5, 34.5], [138, 34]]]] },
      source,
    },
  ]));
  assert.deepEqual(collection.features.map(feature => feature.geometry.type), ['Polygon', 'MultiPolygon']);
  assert.deepEqual(postalAreaBounds(collection), [[138, 34], [140, 36]]);
});

test('point-only lookup has no drawable postal area', () => {
  const collection = createPostalAreaFeatureCollection(lookup([{
    node: { id: 'postal-point', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'point', postalCode: '100-0001' },
    geometry: { type: 'Point', coordinates: [139.5, 35.5] },
    source,
  }]));
  assert.equal(collection.features.length, 0);
  assert.equal(postalAreaBounds(collection), null);
});

test('map sync installs a translucent fill and a visible outline, then removes both', () => {
  const collection = createPostalAreaFeatureCollection(lookup([{
    node: { id: 'postal', kind: 'postal_feature', featureKind: 'standard_area', geometryType: 'polygon', postalCode: '100-0001' },
    geometry: { type: 'Polygon', coordinates: [[[139, 35], [140, 35], [140, 36], [139, 35]]] },
    source,
  }]));
  const sources = new Map<string, { setData: (value: unknown) => void; data: unknown }>();
  const layers = new Map<string, Record<string, unknown>>();
  const map = {
    isStyleLoaded: () => true,
    getSource: (id: string) => sources.get(id),
    addSource: (id: string, sourceDefinition: { data: unknown }) => {
      const stored = {
        data: sourceDefinition.data,
        setData(value: unknown) { stored.data = value; },
      };
      sources.set(id, stored);
    },
    removeSource: (id: string) => { sources.delete(id); },
    getLayer: (id: string) => layers.get(id),
    addLayer: (layer: Record<string, unknown>) => { layers.set(String(layer.id), layer); },
    removeLayer: (id: string) => { layers.delete(id); },
  };

  syncPostalAreaMapLayer(map as never, collection);
  assert.equal(sources.get(POSTAL_SEARCH_AREA_SOURCE_ID)?.data, collection);
  assert.deepEqual(layers.get(POSTAL_SEARCH_AREA_FILL_LAYER_ID)?.paint, {
    'fill-color': '#2563eb',
    'fill-opacity': 0.22,
  });
  assert.deepEqual(layers.get(POSTAL_SEARCH_AREA_OUTLINE_LAYER_ID)?.paint, {
    'line-color': '#1d4ed8',
    'line-opacity': 0.95,
    'line-width': 3,
  });

  syncPostalAreaMapLayer(map as never, null);
  assert.equal(layers.size, 0);
  assert.equal(sources.size, 0);
});
