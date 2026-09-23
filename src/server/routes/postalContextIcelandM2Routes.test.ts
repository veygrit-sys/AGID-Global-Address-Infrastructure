import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { resolve } from 'node:path';

import {
  POSTAL_SEARCH_AREA_FILL_LAYER_ID,
  POSTAL_SEARCH_AREA_OUTLINE_LAYER_ID,
  POSTAL_SEARCH_AREA_SOURCE_ID,
  createPostalAreaFeatureCollection,
  postalAreaBounds,
  syncPostalAreaMapLayer,
} from '../../lib/postalSearchArea';
import type { PostalContextLookupResponse } from '../../services/PostalContextService';
import { createInMemoryPostalContextPackStore, loadPostalContextPack } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

const descriptorDigest = 'sha256:b3a5e96401d075f70cf3c82d9dbb0c4661cfa4a120b02e2c8055c024c13a6545';
const validAt = '2026-08-30T12:20:57.000Z';
let server: Server;
let baseUrl: string;

async function lookup(postalCode: string, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}/api/postal/IS/${encodeURIComponent(postalCode)}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, expectedStatus);
  return envelope.data;
}

before(async () => {
  const loaded = loadPostalContextPack(
    resolve('data/postal_country_packs/is/postal-context/m2/descriptor.json'),
    descriptorDigest,
    { expectedCountryCode: 'IS', allowExperimental: true },
  );
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(loaded.runtime) });
  server = app.listen(0);
  await new Promise<void>(done => server.once('listening', done));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
});

test('real IS lookup reaches API, app conversion, fit, translucent paint, clear and re-search', async () => {
  const data = await lookup('1 02');
  assert.equal(data.status, 'unique');
  assert.equal(data.normalizedPostalCode, '102');
  assert.equal(data.geometries.length, 1);
  assert.ok(['Polygon', 'MultiPolygon'].includes(data.geometries[0].geometry.type));
  assert.equal(data.geometries[0].quality.status, 'authoritative');
  assert.equal(data.geometries[0].quality.confidence, 1);
  assert.equal(data.geometries[0].source.sourceType, 'official');
  assert.equal(data.geometries[0].source.assignmentAuthority, 'official_postal_mapping_authority');
  assert.equal(data.geometries[0].source.geometryAuthority, 'official_postal_geometry');
  assert.equal(data.geometries[0].source.sourceDate, '2025-05-18');

  const collection = createPostalAreaFeatureCollection(data);
  assert.equal(collection.features.length, 1);
  assert.equal(collection.features[0].properties.provenance, 'authoritative');
  assert.equal(collection.features[0].properties.confidence, 1);
  const bounds = postalAreaBounds(collection);
  assert.ok(bounds);
  assert.ok(bounds[0][0] >= -25 && bounds[1][0] <= -13);
  assert.ok(bounds[0][1] >= 63 && bounds[1][1] <= 67);

  const sources = new Map<string, { data: unknown; setData(value: unknown): void }>();
  const layers = new Map<string, Record<string, any>>();
  const map = {
    isStyleLoaded: () => true,
    getSource: (id: string) => sources.get(id),
    addSource: (id: string, definition: { data: unknown }) => {
      const stored = { data: definition.data, setData(value: unknown) { stored.data = value; } };
      sources.set(id, stored);
    },
    removeSource: (id: string) => { sources.delete(id); },
    getLayer: (id: string) => layers.get(id),
    addLayer: (layer: Record<string, any>) => { layers.set(String(layer.id), layer); },
    removeLayer: (id: string) => { layers.delete(id); },
  };
  syncPostalAreaMapLayer(map as never, collection);
  assert.equal(sources.get(POSTAL_SEARCH_AREA_SOURCE_ID)?.data, collection);
  assert.equal(layers.get(POSTAL_SEARCH_AREA_FILL_LAYER_ID)?.paint['fill-opacity'], 0.22);
  assert.equal(layers.get(POSTAL_SEARCH_AREA_OUTLINE_LAYER_ID)?.paint['line-opacity'], 0.95);
  assert.equal(layers.get(POSTAL_SEARCH_AREA_OUTLINE_LAYER_ID)?.paint['line-width'], 3);
  syncPostalAreaMapLayer(map as never, null);
  assert.equal(sources.size, 0);
  assert.equal(layers.size, 0);
  syncPostalAreaMapLayer(map as never, collection);
  assert.equal(sources.size, 1);
  assert.equal(layers.size, 2);
});

test('IS repaired geometry is explicit derived evidence and missing or invalid searches stay honest', async () => {
  const repaired = await lookup('101');
  assert.equal(repaired.status, 'unique');
  assert.ok(['Polygon', 'MultiPolygon'].includes(repaired.geometries[0].geometry.type));
  assert.equal(repaired.geometries[0].source.sourceType, 'derived');
  assert.equal(repaired.geometries[0].source.geometryAuthority, 'derived_geometry');
  assert.equal(repaired.geometries[0].quality.status, 'derived');
  assert.equal(repaired.geometries[0].quality.confidence, 0.99999);

  const missing = await lookup('999');
  assert.equal(missing.status, 'no_match');
  assert.deepEqual(missing.geometries, []);

  const invalidResponse = await fetch(`${baseUrl}/api/postal/IS/10A?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const invalidEnvelope = await invalidResponse.json() as { ok: boolean; error: string; warnings: string[] };
  assert.equal(invalidResponse.status, 400);
  assert.equal(invalidEnvelope.ok, false);
  assert.equal(invalidEnvelope.error, 'Invalid postal code');
  assert.deepEqual(invalidEnvelope.warnings, ['invalid-postal-code']);
});
