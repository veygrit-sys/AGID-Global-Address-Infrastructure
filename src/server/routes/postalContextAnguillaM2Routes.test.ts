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

const descriptorDigest = 'sha256:19afd7f8455a9314d179f05e4ebd29cdfa619287daf314fa15294efbfd99b6c5';
const validAt = '2026-08-31T06:30:16.139Z';
let server: Server;
let baseUrl: string;

async function lookup(postalCode: string, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}/api/postal/AI/${encodeURIComponent(postalCode)}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, expectedStatus);
  return envelope.data;
}

before(async () => {
  const loaded = loadPostalContextPack(
    resolve('data/postal_country_packs/ai/postal-context/m2/descriptor.json'),
    descriptorDigest,
    { expectedCountryCode: 'AI', allowExperimental: true },
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

test('real AI lookup reaches API, app conversion, union fit, translucent paint, clear and re-search', async () => {
  const data = await lookup('ＡＩ ２６４０');
  assert.equal(data.status, 'unique');
  assert.equal(data.normalizedPostalCode, 'AI-2640');
  assert.equal(data.postalFeatures.length, 1);
  assert.equal(data.geometries.length, 2);
  assert.ok(data.geometries.every(item => item.geometry.type === 'MultiPolygon'));
  assert.ok(data.geometries.every(item => item.quality.status === 'derived'));
  assert.ok(data.geometries.every(item => item.quality.confidence === 0.92));
  assert.ok(data.geometries.every(item => item.source.sourceType === 'derived'));
  assert.ok(data.geometries.every(item => item.source.assignmentAuthority === 'derived_spatial_assignment'));
  assert.ok(data.geometries.every(item => item.source.geometryAuthority === 'derived_geometry'));
  assert.ok(data.geometries.every(item => item.source.sourceDate === '2021'));

  const collection = createPostalAreaFeatureCollection(data);
  assert.equal(collection.features.length, 2);
  assert.ok(collection.features.every(item => item.properties.provenance === 'derived'));
  assert.ok(collection.features.every(item => item.properties.confidence === 0.92));
  const bounds = postalAreaBounds(collection);
  assert.deepEqual(bounds, [[-63.42901273399514, 18.155156419596608], [-62.926366790615475, 18.595112128484345]]);

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

test('AI alternate accepted form normalizes and invalid codes are rejected without a fabricated area', async () => {
  const normalized = await lookup('ai2640');
  assert.equal(normalized.normalizedPostalCode, 'AI-2640');
  assert.equal(normalized.geometries.length, 2);

  const invalidResponse = await fetch(`${baseUrl}/api/postal/AI/AI-2641?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const invalidEnvelope = await invalidResponse.json() as { ok: boolean; error: string; warnings: string[] };
  assert.equal(invalidResponse.status, 400);
  assert.equal(invalidEnvelope.ok, false);
  assert.equal(invalidEnvelope.error, 'Invalid postal code');
  assert.deepEqual(invalidEnvelope.warnings, ['invalid-postal-code']);
});
