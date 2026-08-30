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
  hasInvalidPostalAreaGeometry,
  postalAreaBounds,
  syncPostalAreaMapLayer,
} from '../../lib/postalSearchArea';
import type { PostalContextLookupResponse } from '../../services/PostalContextService';
import { createInMemoryPostalContextPackStore, loadPostalContextPack } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

const descriptorDigest = 'sha256:671dbc84b9bdd9d9b48f0530615da314be2d3bfdabd27a64ae53974119371d43';
const validAt = '2026-08-30T06:52:44.942Z';
let server: Server;
let baseUrl: string;

async function lookup(postalCode: string, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}/api/postal/FR/${encodeURIComponent(postalCode)}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, expectedStatus);
  return envelope.data;
}

before(async () => {
  const loaded = loadPostalContextPack(
    resolve('data/postal_country_packs/fr/postal-context/m2/descriptor.json'),
    descriptorDigest,
    { expectedCountryCode: 'FR', allowExperimental: true },
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

test('real FR lookup reaches API, app conversion, fit, translucent paint, clear and re-search', async () => {
  const data = await lookup('７５ ００１');
  assert.equal(data.status, 'unique');
  assert.equal(data.normalizedPostalCode, '75001');
  assert.equal(data.geometries.length, 1);
  assert.equal(data.geometries[0].geometry.type, 'MultiPolygon');
  assert.equal(data.geometries[0].quality.status, 'derived');
  assert.equal(data.geometries[0].quality.confidence, 0.99);
  assert.equal(data.geometries[0].source.sourceType, 'derived');
  assert.equal(data.geometries[0].source.assignmentAuthority, 'official_postal_operator');
  assert.equal(data.geometries[0].source.geometryAuthority, 'official_mapping_geometry');
  assert.equal(data.geometries[0].source.sourceDate, '2026-08-08');
  assert.match(data.geometries[0].node.label ?? '', /derived administrative display surface/u);

  const collection = createPostalAreaFeatureCollection(data);
  assert.equal(collection.features.length, 1);
  assert.equal(collection.features[0].properties.postalCode, '75001');
  assert.equal(collection.features[0].properties.geometryType, 'MultiPolygon');
  assert.equal(collection.features[0].properties.provenance, 'derived');
  assert.equal(collection.features[0].properties.sourceDate, '2026-08-08');
  assert.equal(collection.features[0].properties.confidence, 0.99);
  const bounds = postalAreaBounds(collection);
  assert.ok(bounds);
  assert.ok(bounds[0][0] >= 2.2 && bounds[1][0] <= 2.5);
  assert.ok(bounds[0][1] >= 48.7 && bounds[1][1] <= 49.0);

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
  const second = createPostalAreaFeatureCollection(await lookup('75020'));
  syncPostalAreaMapLayer(map as never, second);
  assert.equal(second.features[0].properties.postalCode, '75020');
  assert.equal(sources.size, 1);
  assert.equal(layers.size, 2);
});

test('FR scoped release returns no match outside 75001-75020 and rejects invalid input', async () => {
  const missing = await lookup('69001');
  assert.equal(missing.status, 'no_match');
  assert.deepEqual(missing.geometries, []);

  const invalidResponse = await fetch(`${baseUrl}/api/postal/FR/750-01?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const invalidEnvelope = await invalidResponse.json() as { ok: boolean; error: string; warnings: string[] };
  assert.equal(invalidResponse.status, 400);
  assert.equal(invalidEnvelope.ok, false);
  assert.equal(invalidEnvelope.error, 'Invalid postal code');
  assert.deepEqual(invalidEnvelope.warnings, ['invalid-postal-code']);
});

test('FR committed pack contains no address/building rows and invalid map geometry is refused', async () => {
  const data = await lookup('75012');
  assert.equal(data.geometries.length, 1);
  assert.equal(data.postalFeatures.every(node => node.kind === 'postal_feature'), true);
  const invalid = structuredClone(data);
  const geometry = invalid.geometries[0].geometry as unknown as { type: 'MultiPolygon'; coordinates: number[][][][] };
  geometry.coordinates[0][0] = geometry.coordinates[0][0].slice(0, 3);
  assert.equal(hasInvalidPostalAreaGeometry(invalid), true);
  assert.equal(createPostalAreaFeatureCollection(invalid).features.length, 0);
});
