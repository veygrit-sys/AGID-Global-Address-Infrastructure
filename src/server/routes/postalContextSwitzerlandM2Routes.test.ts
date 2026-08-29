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

const descriptorDigest = 'sha256:346306624091007d44eeac14b9d094f03614251b42cfbb78b2984302a335c839';
const validAt = '2026-08-29T12:17:58.307Z';
let server: Server;
let baseUrl: string;

before(async () => {
  const loaded = loadPostalContextPack(
    resolve('data/postal_country_packs/ch/postal-context/m2/descriptor.json'),
    descriptorDigest,
    { expectedCountryCode: 'CH', allowExperimental: true },
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

test('real CH lookup reaches API, app conversion, fit, translucent paint, clear and re-search', async () => {
  const response = await fetch(`${baseUrl}/api/postal/CH/1000?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, 200);
  assert.equal(envelope.ok, true);
  assert.equal(envelope.data.status, 'unique');
  assert.equal(envelope.data.normalizedPostalCode, '1000');
  assert.equal(envelope.data.geometries.length, 1);
  assert.equal(envelope.data.geometries[0].geometry.type, 'MultiPolygon');
  assert.equal(envelope.data.geometries[0].quality.status, 'derived');
  assert.equal(envelope.data.geometries[0].quality.confidence, 0.99);
  assert.equal(envelope.data.geometries[0].source.sourceDate, '2026-08-11');
  assert.equal(envelope.data.geometries[0].source.licenseId, 'swisstopo-ogd-conditions');

  const collection = createPostalAreaFeatureCollection(envelope.data);
  assert.equal(collection.features.length, 1);
  assert.equal(collection.features[0].properties.provenance, 'derived');
  assert.equal(collection.features[0].properties.sourceDate, '2026-08-11');
  assert.equal(collection.features[0].properties.confidence, 0.99);
  const bounds = postalAreaBounds(collection);
  assert.ok(bounds);
  assert.ok(bounds[0][0] > 5.8 && bounds[1][0] < 7.1);
  assert.ok(bounds[0][1] > 45.9 && bounds[1][1] < 47.0);

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

test('CH runtime excludes Liechtenstein instead of merging the shared source', async () => {
  const response = await fetch(`${baseUrl}/api/postal/CH/9490?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, 200);
  assert.equal(envelope.ok, true);
  assert.equal(envelope.data.status, 'no_match');
  assert.deepEqual(envelope.data.geometries, []);
});
