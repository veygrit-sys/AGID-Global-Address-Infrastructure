import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
fetchOsrmRoute,
fetchPhotonFeatures,
photonFeatureToNamedCoordinates,
prependCurrentLocationSuggestion,
} from './RouteSearchService';

function jsonResponse(value: unknown) {
  return {
    ok: true,
    json: async () => value,
  } as Response;
}

test('RouteSearchService fetches Photon features through endpoint helpers', async () => {
  const requested: string[] = [];
  const features = await fetchPhotonFeatures('Tokyo Station', 3, {
    fetcher: async (url) => {
      requested.push(String(url));
      return jsonResponse({
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [139.767, 35.681] },
            properties: { name: 'Tokyo Station', city: 'Tokyo' },
          },
        ],
      });
    },
  });

  assert.equal(requested[0], '/api/v1/photon?q=Tokyo+Station&limit=3');
  assert.equal(features[0].properties.name, 'Tokyo Station');
});

test('RouteSearchService retries Photon with search-only multilingual variants', async () => {
  const requested: string[] = [];
  const features = await fetchPhotonFeatures('東京都', 3, {
    fetcher: async (url) => {
      requested.push(String(url));
      const parsed = new URL(String(url), 'http://localhost');
      if (parsed.searchParams.get('q') !== 'Tokyo') {
        return jsonResponse({ features: [] });
      }
      return jsonResponse({
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [139.6917, 35.6895] },
            properties: { name: 'Tokyo', city: 'Tokyo' },
          },
        ],
      });
    },
  });

  assert.equal(new URL(requested[0], 'http://localhost').searchParams.get('q'), '東京都');
  assert.equal(new URL(requested[1], 'http://localhost').searchParams.get('q'), 'Tokyo');
  assert.equal(features[0].properties.name, 'Tokyo');
});

test('RouteSearchService converts Photon features and prepends current location candidates', () => {
  const features = prependCurrentLocationSuggestion('current', [], { lat: 35.681, lng: 139.767 });
  assert.equal(features.length, 1);
  assert.deepEqual(features[0].geometry.coordinates, [139.767, 35.681]);

  const point = photonFeatureToNamedCoordinates(features[0]);
  assert.equal(point.name, 'My Location, Current GPS Position');
});

test('RouteSearchService returns the first valid OSRM route', async () => {
  const requested: string[] = [];
  const route = await fetchOsrmRoute(
    { lat: 35.681, lng: 139.767 },
    { lat: 35.69, lng: 139.7 },
    'driving',
    {
      fetcher: async (url) => {
        requested.push(String(url));
        return jsonResponse({
          code: 'Ok',
          routes: [
            {
              geometry: { type: 'LineString', coordinates: [[139.767, 35.681], [139.7, 35.69]] },
              distance: 1200,
              duration: 300,
            },
          ],
        });
      },
    },
  );

  assert.equal(
    requested[0],
    '/api/v1/osrm/route?start=139.767%2C35.681&end=139.7%2C35.69&profile=driving',
  );
  assert.equal(route?.distance, 1200);
});
