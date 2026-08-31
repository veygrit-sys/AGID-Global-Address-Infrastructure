import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { resolve } from 'node:path';
import {
  POSTAL_SEARCH_AREA_FILL_LAYER_ID, POSTAL_SEARCH_AREA_OUTLINE_LAYER_ID, POSTAL_SEARCH_AREA_SOURCE_ID,
  createPostalAreaFeatureCollection, postalAreaBounds, syncPostalAreaMapLayer,
} from '../../lib/postalSearchArea';
import type { PostalContextLookupResponse } from '../../services/PostalContextService';
import { createInMemoryPostalContextPackStore, loadPostalContextPack } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

const descriptorDigest = 'sha256:688cf43fd1a928f08517e18c7d7b2ecab0a9013a8ba2659fe72f64e09aa9c6d8';
const validAt = '2026-08-31T10:26:19.045Z';
let server: Server;
let baseUrl: string;
async function lookup(postalCode: string, expectedStatus = 200) {
  const response = await fetch(baseUrl + '/api/postal/BL/' + encodeURIComponent(postalCode) + '?validAt=' + encodeURIComponent(validAt) + '&geometry=geojson');
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, expectedStatus);
  return envelope.data;
}
before(async () => {
  const loaded = loadPostalContextPack(resolve('data/postal_country_packs/bl/postal-context/m2/descriptor.json'), descriptorDigest,
    { expectedCountryCode: 'BL', allowExperimental: true });
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(loaded.runtime) });
  server = app.listen(0);
  await new Promise<void>(done => server.once('listening', done));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = 'http://127.0.0.1:' + address.port;
});
after(async () => { await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())); });

test('real BL lookup reaches API, app conversion, fit, translucent paint, clear and re-search', async () => {
  const data = await lookup('９７１３３');
  assert.equal(data.status, 'unique');
  assert.equal(data.normalizedPostalCode, '97133');
  assert.equal(data.postalFeatures.length, 1);
  assert.equal(data.geometries.length, 1);
  assert.equal(data.geometries[0].geometry.type, 'MultiPolygon');
  assert.equal(data.geometries[0].quality.status, 'derived');
  assert.equal(data.geometries[0].quality.confidence, 0.97);
  assert.equal(data.geometries[0].source.sourceType, 'derived');
  assert.equal(data.geometries[0].source.assignmentAuthority, 'derived_spatial_assignment');
  assert.equal(data.geometries[0].source.geometryAuthority, 'derived_geometry');
  assert.equal(data.geometries[0].source.sourceDate, '2026-08-31');
  const collection = createPostalAreaFeatureCollection(data);
  assert.equal(collection.features.length, 1);
  assert.equal(collection.features[0].properties.provenance, 'derived');
  assert.equal(collection.features[0].properties.confidence, 0.97);
  assert.deepEqual(postalAreaBounds(collection), [[-62.926554, 17.870779], [-62.789086, 17.974092]]);
  const sources = new Map<string, { data: unknown; setData(value: unknown): void }>();
  const layers = new Map<string, Record<string, any>>();
  const map = {
    isStyleLoaded: () => true, getSource: (id: string) => sources.get(id),
    addSource: (id: string, definition: { data: unknown }) => { const stored = { data: definition.data, setData(value: unknown) { stored.data = value; } }; sources.set(id, stored); },
    removeSource: (id: string) => { sources.delete(id); }, getLayer: (id: string) => layers.get(id),
    addLayer: (layer: Record<string, any>) => { layers.set(String(layer.id), layer); }, removeLayer: (id: string) => { layers.delete(id); },
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

test('BL invalid postcode is rejected without a fabricated area', async () => {
  const invalidResponse = await fetch(baseUrl + '/api/postal/BL/97134?validAt=' + encodeURIComponent(validAt) + '&geometry=geojson');
  const envelope = await invalidResponse.json() as { ok: boolean; error: string; warnings: string[] };
  assert.equal(invalidResponse.status, 400);
  assert.equal(envelope.ok, false);
  assert.equal(envelope.error, 'Invalid postal code');
  assert.deepEqual(envelope.warnings, ['invalid-postal-code']);
});
