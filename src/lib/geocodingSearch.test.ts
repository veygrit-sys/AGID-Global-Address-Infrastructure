import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
dedupeGeocodingSearchResults,
geocodingSearchResultKey,
photonFeatureToGeocodingResult,
} from './geocodingSearch';

test('converts Photon features into geocoding search results', () => {
  const result = photonFeatureToGeocodingResult(
    {
      geometry: { coordinates: [139.767, 35.681] },
      properties: {
        name: 'Tokyo Station',
        street: 'Marunouchi',
        housenumber: '1',
        city: 'Chiyoda',
        state: 'Tokyo',
        country: 'Japan',
        countrycode: 'JP',
        postcode: '100-0005',
        osm_type: 'N',
        osm_id: 123,
        osm_key: 'railway',
        osm_value: 'station',
      },
    },
    'Tokyo Station',
    ['Tokyo Station'],
  );

  assert.equal(result?.source, 'photon');
  assert.equal(result?.osm_type, 'N');
  assert.equal(result?.osm_id, '123');
  assert.equal(result?.lat, '35.681');
  assert.equal(result?.lon, '139.767');
  assert.equal(result?.address?.country_code, 'jp');
  assert.equal(result?.address?.road, 'Marunouchi');
  assert.equal(result?.type, 'station');
  assert.ok((result?.confidence ?? 0) > 0.6);
});

test('rejects Photon features without valid point coordinates', () => {
  assert.equal(
    photonFeatureToGeocodingResult(
      { geometry: { coordinates: [139.767] }, properties: { name: 'Broken' } },
      'Broken',
      ['Broken'],
    ),
    null,
  );
});

test('deduplicates geocoding results by OSM identity and prefers stronger confidence', () => {
  const low = {
    source: 'osm_nominatim',
    osm_type: 'node',
    osm_id: 100,
    display_name: 'Candidate A',
    lat: '35.000001',
    lon: '139.000001',
    confidence: 0.42,
  };
  const high = {
    source: 'photon',
    osm_type: 'node',
    osm_id: 100,
    display_name: 'Candidate A, enriched',
    lat: '35.000002',
    lon: '139.000002',
    confidence: 0.8,
  };

  const results = dedupeGeocodingSearchResults([low, high]);
  assert.equal(results.length, 1);
  assert.equal(results[0].source, 'photon');
  assert.equal(geocodingSearchResultKey(high), 'osm|node|100');
});
