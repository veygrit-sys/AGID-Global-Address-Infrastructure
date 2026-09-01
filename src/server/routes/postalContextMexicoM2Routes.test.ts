import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { resolve } from 'node:path';
import {
  POSTAL_SEARCH_AREA_FILL_LAYER_ID, POSTAL_SEARCH_AREA_OUTLINE_LAYER_ID, POSTAL_SEARCH_AREA_SOURCE_ID,
  createPostalAreaFeatureCollection, hasInvalidPostalAreaGeometry, postalAreaBounds, syncPostalAreaMapLayer,
} from '../../lib/postalSearchArea';
import type { PostalContextLookupResponse } from '../../services/PostalContextService';
import { createInMemoryPostalContextPackStore, loadPostalContextPack } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

const descriptorDigest = 'sha256:2f5dc6bd36f5700ff8b97accd936c4f7b9defbdd0247288f174dc417a4d1ca37';
const validAt = '2026-09-01T14:44:58.852Z';
let server: Server; let baseUrl: string;
async function lookup(postalCode: string, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}/api/postal/MX/${encodeURIComponent(postalCode)}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, expectedStatus);
  return envelope.data;
}
before(async () => {
  const loaded = loadPostalContextPack(resolve('data/postal_country_packs/mx/postal-context/m2/descriptor.json'), descriptorDigest,
    { expectedCountryCode: 'MX', allowExperimental: true });
  const app = express(); app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(loaded.runtime) });
  server = app.listen(0); await new Promise<void>(done => server.once('listening', done));
  const address = server.address(); assert.ok(address && typeof address === 'object'); baseUrl = `http://127.0.0.1:${address.port}`;
});
after(async () => { await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())); });

test('real MX lookup reaches API, app conversion, fit, translucent paint, clear and re-search', async () => {
  const data = await lookup('０６ ０００');
  assert.equal(data.status, 'unique');
  assert.equal(data.normalizedPostalCode, '06000');
  assert.equal(data.postalFeatures.length, 1); assert.equal(data.geometries.length, 1); assert.equal(data.alternatives.length, 1);
  assert.equal(data.geometries[0].quality.status, 'derived'); assert.equal(data.geometries[0].quality.confidence, 0.92); assert.equal(data.geometries[0].quality.accuracyMeters, 250);
  assert.equal(data.geometries[0].source.sourceType, 'derived');
  assert.equal(data.geometries[0].source.assignmentAuthority, 'official_postal_mapping_authority');
  assert.equal(data.geometries[0].source.geometryAuthority, 'official_postal_geometry');
  assert.equal(data.geometries[0].source.sourceDate, '2025-01-01');
  const collection = createPostalAreaFeatureCollection(data);
  assert.equal(collection.features.length, 1);
  assert.equal(collection.features[0].properties.postalCode, '06000');
  assert.ok(['Polygon', 'MultiPolygon'].includes(collection.features[0].properties.geometryType));
  assert.equal(collection.features[0].properties.provenance, 'derived');
  const bounds = postalAreaBounds(collection); assert.ok(bounds); assert.ok(bounds[0][0] < bounds[1][0] && bounds[0][1] < bounds[1][1]);
  const sources = new Map<string, { data: unknown; setData(value: unknown): void }>(); const layers = new Map<string, Record<string, any>>();
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
  syncPostalAreaMapLayer(map as never, null); assert.equal(sources.size, 0); assert.equal(layers.size, 0);
  const second = createPostalAreaFeatureCollection(await lookup('01000')); syncPostalAreaMapLayer(map as never, second);
  assert.equal(second.features[0].properties.postalCode, '01000'); assert.equal(sources.size, 1); assert.equal(layers.size, 2);
});

test('MX returns no match, rejects malformed input and refuses invalid geometry', async () => {
  const missing = await lookup('00000'); assert.equal(missing.status, 'no_match'); assert.deepEqual(missing.geometries, []);
  const response = await fetch(`${baseUrl}/api/postal/MX/060-00?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; error: string; warnings: string[] };
  assert.equal(response.status, 400); assert.equal(envelope.ok, false); assert.equal(envelope.error, 'Invalid postal code');
  const invalid = structuredClone(await lookup('06000'));
  const geometry = invalid.geometries[0].geometry as unknown as { coordinates: unknown[] }; geometry.coordinates[0] = [];
  assert.equal(hasInvalidPostalAreaGeometry(invalid), true); assert.equal(createPostalAreaFeatureCollection(invalid).features.length, 0);
});
