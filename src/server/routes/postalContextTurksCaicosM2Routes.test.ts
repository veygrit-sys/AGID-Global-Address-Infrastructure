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

const descriptorDigest = 'sha256:bae55b493e9303a8d47bc20ef34371d56fbbcfcd9e012e0b8629b5ce8f4437ac';
const validAt = '2026-09-02T08:30:58.215Z';
let server: Server;
let baseUrl: string;

async function lookup(postalCode: string, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}/api/postal/TC/${encodeURIComponent(postalCode)}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, expectedStatus);
  return envelope.data;
}

before(async () => {
  const loaded = loadPostalContextPack(
    resolve('data/postal_country_packs/tc/postal-context/m2/descriptor.json'),
    descriptorDigest,
    { expectedCountryCode: 'TC', allowExperimental: true },
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

test('real TC lookup reaches API, ID-rich app conversion, union fit, translucent paint, clear and re-search', async () => {
  const data = await lookup('ＴＫＣＡ １ＺＺ');
  assert.equal(data.status, 'unique');
  assert.equal(data.normalizedPostalCode, 'TKCA 1ZZ');
  assert.equal(data.postalFeatures.length, 1);
  assert.equal(data.postalFeatures[0].id, 'postal-tc-tkca-1zz');
  assert.equal(data.geometries.length, 2);
  assert.equal(new Set(data.geometries.map(item => item.id)).size, 2);
  assert.deepEqual(data.contexts.map(item => item.id), ['country-tc']);
  assert.deepEqual(data.assertionIds, ['upu-tc-202510-tkca-1zz-admin-within-tc']);
  assert.equal(data.alternatives.length, 1);
  assert.ok(data.geometries.every(item => item.geometry.type === 'MultiPolygon'));
  assert.ok(data.geometries.every(item => item.quality.status === 'derived'));
  assert.ok(data.geometries.every(item => item.quality.confidence === 0.9));
  assert.ok(data.geometries.every(item => item.source.sourceType === 'derived'));
  assert.ok(data.geometries.every(item => item.source.assignmentAuthority === 'derived_spatial_assignment'));
  assert.ok(data.geometries.every(item => item.source.geometryAuthority === 'derived_geometry'));
  assert.ok(data.geometries.every(item => item.source.sourceDate === '2020-12-02'));

  const collection = createPostalAreaFeatureCollection(data);
  assert.equal(collection.features.length, 2);
  assert.ok(collection.features.every(item => item.properties.provenance === 'derived'));
  assert.ok(collection.features.every(item => item.properties.confidence === 0.9));
  const bounds = postalAreaBounds(collection);
  assert.deepEqual(bounds, [[-72.48277771282113, 21.17765818467751], [-71.07836651670135, 21.962492454937887]]);

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

test('TC whitespace-free alias normalizes and invalid codes are rejected without fabricated geometry', async () => {
  const normalized = await lookup('tkca1zz');
  assert.equal(normalized.normalizedPostalCode, 'TKCA 1ZZ');
  assert.equal(normalized.geometries.length, 2);

  const invalidResponse = await fetch(`${baseUrl}/api/postal/TC/TKCA%202ZZ?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const invalidEnvelope = await invalidResponse.json() as { ok: boolean; error: string; warnings: string[] };
  assert.equal(invalidResponse.status, 400);
  assert.equal(invalidEnvelope.ok, false);
  assert.equal(invalidEnvelope.error, 'Invalid postal code');
  assert.deepEqual(invalidEnvelope.warnings, ['invalid-postal-code']);
});
