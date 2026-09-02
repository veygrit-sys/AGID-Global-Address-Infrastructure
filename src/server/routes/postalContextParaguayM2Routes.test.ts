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

const descriptorDigest = 'sha256:d12690e3f4a6cf79cab02e756bc7b6b49203561110b8a68c14002ed10d151c99';
const validAt = '2026-09-02T05:02:03.144Z';
let server: Server;
let baseUrl: string;

async function lookup(postalCode: string, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}/api/postal/PY/${encodeURIComponent(postalCode)}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, expectedStatus);
  return envelope.data;
}

before(async () => {
  const loaded = loadPostalContextPack(
    resolve('data/postal_country_packs/py/postal-context/m2/descriptor.json'),
    descriptorDigest,
    { expectedCountryCode: 'PY', allowExperimental: true },
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
  if (!server) return;
  await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
});

test('real PY lookup reaches API, detailed IDs, app conversion, fit, translucent paint, clear and re-search', async () => {
  const data = await lookup('００１ ５１８');
  assert.equal(data.status, 'unique');
  assert.equal(data.normalizedPostalCode, '001518');
  assert.equal(data.postalFeatures.length, 1);
  assert.equal(data.postalFeatures[0]?.id, 'postal-py-001518');
  assert.equal(data.geometries.length, 1);
  assert.equal(data.geometries[0].id, 'dinacopa-py-derived-001518');
  assert.equal(data.geometries[0].geometry.type, 'MultiPolygon');
  assert.equal(data.geometries[0].source.sourceType, 'derived');
  assert.equal(data.geometries[0].source.assignmentAuthority, 'official_postal_operator');
  assert.equal(data.geometries[0].source.geometryAuthority, 'derived_geometry');
  assert.equal(data.geometries[0].source.sourceDate, '2018-02-19');
  assert.equal(data.geometries[0].quality.status, 'derived');
  assert.equal(data.geometries[0].quality.confidence, 0.98);
  assert.ok(data.alternatives[0]?.contexts.some(item => item.id === 'locality-py-001518-0000052-052-row-00001'
    && item.label?.includes('SANTA ROSA — postal 001518; cod_bar 0000052; BARLOC 052')));
  assert.ok(data.alternatives[0]?.contexts.some(item => item.id === 'admin-py-district-0015'));
  assert.ok(data.alternatives[0]?.contexts.some(item => item.id === 'admin-py-department-00'));

  const collection = createPostalAreaFeatureCollection(data);
  assert.equal(collection.features.length, 1);
  assert.equal(collection.features[0].properties.contextId, 'postal-py-001518');
  assert.equal(collection.features[0].properties.geometryFeatureId, 'dinacopa-py-derived-001518');
  assert.match(collection.features[0].properties.linkedContextIds, /locality-py-001518-0000052-052-row-00001/);
  assert.match(collection.features[0].properties.linkedContextIds, /admin-py-district-0015/);
  assert.match(collection.features[0].properties.assertionIds, /dinacopa-py-001518-row-00001-part-of-locality/);
  assert.equal(collection.features[0].properties.provenance, 'derived');
  assert.equal(collection.features[0].properties.confidence, 0.98);
  assert.deepEqual(postalAreaBounds(collection), [[-57.5898855, -25.2569718], [-57.5782528, -25.2472184]]);

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

test('PY invalid input is rejected without a fabricated surface', async () => {
  const response = await fetch(`${baseUrl}/api/postal/PY/001-518?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; error: string; warnings: string[] };
  assert.equal(response.status, 400);
  assert.equal(envelope.ok, false);
  assert.equal(envelope.error, 'Invalid postal code');
  assert.deepEqual(envelope.warnings, ['invalid-postal-code']);
});
