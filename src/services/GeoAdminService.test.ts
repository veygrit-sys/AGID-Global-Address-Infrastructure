import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
fetchCountryBoundary,
fetchCountryCities,
fetchCountryStats,
fetchDataQualityReport,
searchOsmRegion,
} from './GeoAdminService';

function jsonResponse(value: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => value,
  } as Response;
}

test('GeoAdminService routes country admin requests through typed endpoint helpers', async () => {
  const called: string[] = [];
  const fetcher = (async (url: RequestInfo | URL) => {
    called.push(String(url));
    if (String(url).includes('country-cities')) return jsonResponse([{ name: 'Tokyo', lat: 35.6, lon: 139.7 }]);
    if (String(url).includes('country-boundary')) return jsonResponse({ type: 'Polygon', coordinates: [] });
    if (String(url).includes('country-stats')) return jsonResponse({ population: 1, area: 2, region: 'Asia' });
    return jsonResponse(null);
  }) as typeof fetch;

  assert.deepEqual(await fetchCountryCities('jp', { fetcher }), [{ name: 'Tokyo', lat: 35.6, lon: 139.7 }]);
  assert.deepEqual(await fetchCountryBoundary('jp', { fetcher }), { type: 'Polygon', coordinates: [] });
  assert.deepEqual(await fetchCountryStats('jp', { fetcher }), { population: 1, area: 2, region: 'Asia' });
  assert.deepEqual(called, [
    '/api/v1/country-cities?cc=JP',
    '/api/v1/country-boundary?cc=JP',
    '/api/v1/country-stats?cc=JP',
  ]);
});

test('GeoAdminService exposes quality report and OSM region search', async () => {
  const called: string[] = [];
  const fetcher = (async (url: RequestInfo | URL) => {
    called.push(String(url));
    if (String(url).includes('data-quality')) return jsonResponse({
      timestamp: 1,
      report: 'ok',
      stats: {},
      continentQuality: {},
    });
    return jsonResponse([{ lat: '35.6', lon: '139.7', geojson: { type: 'Point', coordinates: [139.7, 35.6] } }]);
  }) as typeof fetch;

  assert.equal((await fetchDataQualityReport({ fetcher }))?.report, 'ok');
  assert.equal((await searchOsmRegion('Shinjuku, Japan', { fetcher })).length, 1);
  assert.equal(called[0], '/api/v1/data-quality/report');
  assert.equal(called[1], '/api/v1/osm-search?q=Shinjuku%2C+Japan&limit=1&polygon_geojson=1');
});
