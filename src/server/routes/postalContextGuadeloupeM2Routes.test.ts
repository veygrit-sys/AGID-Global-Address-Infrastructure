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

const descriptorDigest = 'sha256:2cb4b29c35dfbf4daeb085f3d85fc3a7f82111a898bdc52d206961c693b8d0d8';
const validAt = '2026-09-01T04:04:46.227Z';
let server: Server; let baseUrl: string;
async function lookup(postalCode: string, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}/api/postal/GP/${encodeURIComponent(postalCode)}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, expectedStatus);
  return envelope.data;
}
before(async () => {
  const loaded = loadPostalContextPack(resolve('data/postal_country_packs/gp/postal-context/m2/descriptor.json'), descriptorDigest,
    { expectedCountryCode: 'GP', allowExperimental: true });
  const app = express(); app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(loaded.runtime) });
  server = app.listen(0); await new Promise<void>(done => server.once('listening', done));
  const address = server.address(); assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});
after(async () => { await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())); });

test('real GP lookup reaches API, app conversion, fit, translucent paint, clear and re-search', async () => {
  const data = await lookup('９７１ １０');
  assert.equal(data.status, 'unique');
  assert.equal(data.normalizedPostalCode, '97110');
  assert.equal(data.postalFeatures.length, 1); assert.equal(data.geometries.length, 1);
  assert.equal(data.geometries[0].geometry.type, 'MultiPolygon');
  assert.equal(data.geometries[0].quality.status, 'derived');
  assert.equal(data.geometries[0].quality.confidence, 0.9);
  assert.equal(data.geometries[0].source.sourceType, 'derived');
  assert.equal(data.geometries[0].source.assignmentAuthority, 'official_postal_operator');
  assert.equal(data.geometries[0].source.geometryAuthority, 'official_mapping_geometry');
  assert.equal(data.geometries[0].source.sourceDate, '2026-08-08');
  assert.match(data.geometries[0].node.label ?? '', /derived commune display surface/u);
  const collection = createPostalAreaFeatureCollection(data);
  assert.equal(collection.features.length, 1);
  assert.equal(collection.features[0].properties.postalCode, '97110');
  assert.equal(collection.features[0].properties.geometryType, 'MultiPolygon');
  assert.equal(collection.features[0].properties.provenance, 'derived');
  assert.equal(collection.features[0].properties.sourceDate, '2026-08-08');
  assert.equal(collection.features[0].properties.confidence, 0.9);
  assert.deepEqual(postalAreaBounds(collection), [[-61.557972, 16.213163], [-61.525526, 16.253081]]);
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
  syncPostalAreaMapLayer(map as never, null); assert.equal(sources.size, 0); assert.equal(layers.size, 0);
  const second = createPostalAreaFeatureCollection(await lookup('97190'));
  syncPostalAreaMapLayer(map as never, second);
  assert.equal(second.features[0].properties.postalCode, '97190'); assert.equal(sources.size, 1); assert.equal(layers.size, 2);
});

test('GP shared commune codes stay distinct in lookup while returning the disclosed same surface', async () => {
  const abymesPrimary = await lookup('97139'); const abymesSecondary = await lookup('97142');
  assert.equal(abymesPrimary.normalizedPostalCode, '97139'); assert.equal(abymesSecondary.normalizedPostalCode, '97142');
  assert.deepEqual(abymesPrimary.geometries[0].geometry, abymesSecondary.geometries[0].geometry);
  assert.notEqual(abymesPrimary.postalFeatures[0].id, abymesSecondary.postalFeatures[0].id);
  assert.equal(abymesPrimary.geometries[0].quality.confidence, 0.9);
});

test('GP returns no match for an unassigned structural code and rejects malformed or cross-country input', async () => {
  const missing = await lookup('97199'); assert.equal(missing.status, 'no_match'); assert.deepEqual(missing.geometries, []);
  for (const invalid of ['971-00', '97300', '97133', '97150']) {
    const response = await fetch(`${baseUrl}/api/postal/GP/${encodeURIComponent(invalid)}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
    const envelope = await response.json() as { ok: boolean; error: string; warnings: string[] };
    assert.equal(response.status, 400); assert.equal(envelope.ok, false); assert.equal(envelope.error, 'Invalid postal code');
    assert.deepEqual(envelope.warnings, ['invalid-postal-code']);
  }
});

test('GP invalid Polygon/MultiPolygon input is refused before map rendering', async () => {
  const invalid = structuredClone(await lookup('97110'));
  const geometry = invalid.geometries[0].geometry as unknown as { type: 'MultiPolygon'; coordinates: number[][][][] };
  geometry.coordinates[0][0] = geometry.coordinates[0][0].slice(0, 3);
  assert.equal(hasInvalidPostalAreaGeometry(invalid), true);
  assert.equal(createPostalAreaFeatureCollection(invalid).features.length, 0);
});
