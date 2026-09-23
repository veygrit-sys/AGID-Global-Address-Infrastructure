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

const descriptorDigest = 'sha256:6b0e08e1c8e461e7fee847cc06ea13e5f0f8abc1cb9a5a2ade8bd258c67537e1';
const validAt = '2026-09-02T18:44:27.714Z';
let server: Server;
let baseUrl: string;

async function lookup(postalCode: string, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}/api/postal/AC/${encodeURIComponent(postalCode)}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, expectedStatus);
  return envelope.data;
}

before(async () => {
  const loaded = loadPostalContextPack(
    resolve('data/postal_country_packs/ac/postal-context/m2/descriptor.json'),
    descriptorDigest,
    { expectedCountryCode: 'AC', allowExperimental: true },
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

test('real AC lookup reaches API, app conversion, union fit, translucent paint, clear and re-search', async () => {
  const data = await lookup('ＡＳＣＮ １ＺＺ');
  assert.equal(data.status, 'unique');
  assert.equal(data.normalizedPostalCode, 'ASCN 1ZZ');
  assert.equal(data.postalFeatures.length, 1);
  assert.equal(data.geometries.length, 2);
  assert.ok(data.geometries.every(item => item.geometry.type === 'MultiPolygon'));
  assert.ok(data.geometries.every(item => item.quality.status === 'derived'));
  assert.ok(data.geometries.every(item => item.quality.confidence === 0.91));
  assert.ok(data.geometries.every(item => item.source.sourceType === 'derived'));
  assert.ok(data.geometries.every(item => item.source.assignmentAuthority === 'derived_spatial_assignment'));
  assert.ok(data.geometries.every(item => item.source.geometryAuthority === 'derived_geometry'));
  assert.ok(data.geometries.every(item => item.source.sourceDate === '2021'));

  const collection = createPostalAreaFeatureCollection(data);
  assert.equal(collection.features.length, 2);
  assert.ok(collection.features.every(item => item.properties.provenance === 'derived'));
  assert.ok(collection.features.every(item => item.properties.confidence === 0.91));
  assert.deepEqual(postalAreaBounds(collection), [[-14.420263125670147, -7.992611073283626], [-14.294916449140885, -7.88966415023782]]);

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

test('AC compact form normalizes while unknown codes are rejected without a fabricated area', async () => {
  const normalized = await lookup('ascn1zz');
  assert.equal(normalized.normalizedPostalCode, 'ASCN 1ZZ');
  assert.equal(normalized.geometries.length, 2);

  const response = await fetch(`${baseUrl}/api/postal/AC/${encodeURIComponent('ASCN 1ZY')}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; error: string; warnings: string[] };
  assert.equal(response.status, 400);
  assert.equal(envelope.ok, false);
  assert.equal(envelope.error, 'Invalid postal code');
  assert.deepEqual(envelope.warnings, ['invalid-postal-code']);
});

test('AC invalid geometry is detected and omitted from display', async () => {
  const data = await lookup('ASCN 1ZZ');
  const invalid = structuredClone(data);
  invalid.geometries[0].geometry = { type: 'Polygon', coordinates: [[[0, 0], [1, 1], [0, 1]]] };
  assert.equal(hasInvalidPostalAreaGeometry(invalid), true);
  assert.equal(createPostalAreaFeatureCollection(invalid).features.length, 1);
});
