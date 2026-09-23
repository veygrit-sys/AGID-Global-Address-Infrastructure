import assert from 'node:assert/strict';
import { afterEach,test } from 'node:test';

import { fetchNearbyBuildingName,fetchNearbyBuildingNameCandidates,fetchNearbyMapAddressFeature,fetchNearbyMapAddressFeatures } from './GeocodingService';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('fetchNearbyBuildingName uses Overpass OSM data and prefers named buildings', async () => {
  let body = '';
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('/api/overture/building-name')) {
      return new Response(JSON.stringify({ error: 'not configured' }), {
        status: 503,
        headers: { 'content-type': 'application/json' },
      });
    }

    body = String(init?.body || '');
    return new Response(JSON.stringify({
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 10.00002,
          lon: 20.00002,
          tags: {
            shop: 'coffee',
            name: 'Coffee Stand',
          },
        },
        {
          type: 'way',
          id: 2,
          center: { lat: 10.0002, lon: 20.0002 },
          tags: {
            building: 'yes',
            'building:name': 'Landmark 81',
            'name:en': 'Landmark 81',
          },
        },
      ],
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const result = await fetchNearbyBuildingName(10, 20, 'en', 90);

  assert.match(body, /"query"/);
  assert.equal(result?.name, 'Landmark 81');
  assert.equal(result?.source, 'building:name');
  assert.equal(result?.category, 'building');
});

test('fetchNearbyBuildingName can prefer Overture Maps named buildings over nearby OSM POIs', async () => {
  globalThis.fetch = async (url) => {
    if (String(url).includes('/api/overture/building-name')) {
      return new Response(JSON.stringify({
        candidates: [{
          id: 'overture:building:landmark-81',
          names: { primary: 'Landmark 81' },
          theme: 'buildings',
          type: 'building',
          distanceMeters: 30,
        }],
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      elements: [{
        type: 'node',
        id: 3,
        lat: 10.00001,
        lon: 20.00001,
        tags: {
          shop: 'coffee',
          name: 'Coffee Stand',
        },
      }],
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const result = await fetchNearbyBuildingName(10, 20, 'en', 90);

  assert.equal(result?.name, 'Landmark 81');
  assert.equal(result?.source, 'overture:buildings');
  assert.equal(result?.category, 'building');
});

test('fetchNearbyBuildingNameCandidates returns ranked OSM and Overture options', async () => {
  globalThis.fetch = async (url) => {
    if (String(url).includes('/api/overture/building-name')) {
      return new Response(JSON.stringify({
        candidates: [{
          id: 'overture:building:landmark-81',
          names: { primary: 'Landmark 81', common: [{ language: 'en', value: 'Landmark 81' }] },
          theme: 'buildings',
          type: 'building',
          distanceMeters: 30,
        }],
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      elements: [
        {
          type: 'way',
          id: 10,
          center: { lat: 10.00002, lon: 20.00002 },
          tags: {
            building: 'yes',
            'building:name': 'OSM Tower',
          },
        },
        {
          type: 'node',
          id: 11,
          lat: 10.00003,
          lon: 20.00003,
          tags: {
            tourism: 'hotel',
            name: 'Hotel Candidate',
          },
        },
      ],
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const candidates = await fetchNearbyBuildingNameCandidates(10, 20, 'en', 90);

  assert.equal(candidates[0]?.name, 'Landmark 81');
  assert.ok(candidates.some(candidate => candidate.name === 'OSM Tower'));
  assert.ok(candidates.some(candidate => candidate.source === 'building:name'));
  assert.ok(candidates.length >= 3);
});

test('fetchNearbyMapAddressFeature uses Overpass data for roads, bridges, and parks', async () => {
  let body = '';
  globalThis.fetch = async (_url, init) => {
    body = String(init?.body || '');
    return new Response(JSON.stringify({
      elements: [
        {
          type: 'way',
          id: 4,
          center: { lat: 10.00001, lon: 20.00001 },
          tags: {
            highway: 'residential',
            name: 'Main Street',
          },
        },
        {
          type: 'way',
          id: 5,
          center: { lat: 10.00003, lon: 20.00003 },
          tags: {
            highway: 'primary',
            bridge: 'yes',
            name: 'Harbor Bridge',
          },
        },
        {
          type: 'relation',
          id: 6,
          center: { lat: 10.00002, lon: 20.00002 },
          tags: {
            leisure: 'park',
            name: 'Riverside Park',
          },
        },
      ],
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const result = await fetchNearbyMapAddressFeature(10, 20, 'en', 140);
  const query = JSON.parse(body).query;

  assert.match(query, /way\["highway"\]\["name"\]/);
  assert.match(query, /way\["bridge"\]\["name"\]/);
  assert.equal(result?.name, 'Harbor Bridge');
  assert.equal(result?.kind, 'bridge');
  assert.equal(result?.source, 'osm:bridge:name');
});

test('fetchNearbyMapAddressFeatures returns ranked context candidates for reverse geocoding', async () => {
  globalThis.fetch = async () => {
    return new Response(JSON.stringify({
      elements: [
        {
          type: 'way',
          id: 7,
          center: { lat: 10.00001, lon: 20.00001 },
          tags: {
            highway: 'residential',
            name: 'Main Street',
          },
        },
        {
          type: 'way',
          id: 8,
          center: { lat: 10.00003, lon: 20.00003 },
          tags: {
            waterway: 'river',
            name: 'Blue River',
          },
        },
        {
          type: 'relation',
          id: 9,
          center: { lat: 10.00002, lon: 20.00002 },
          tags: {
            historic: 'ruins',
            name: 'Old Fort Ruins',
          },
        },
      ],
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  const summary = await fetchNearbyMapAddressFeatures(10, 20, 'en', 220);

  assert.equal(summary.primary?.name, 'Main Street');
  assert.equal(summary.features.length, 3);
  assert.equal(summary.byKind.river?.name, 'Blue River');
  assert.equal(summary.byKind.ruins?.name, 'Old Fort Ruins');
  assert.deepEqual(summary.hierarchy, ['Main Street', 'Old Fort Ruins', 'Blue River']);
  assert.ok(summary.sources.includes('osm:road:name'));
  assert.ok(summary.sources.includes('osm:river:name'));
});
