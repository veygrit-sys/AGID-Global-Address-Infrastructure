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

const descriptorDigest = 'sha256:d225a9de69e70e80ce487be5b90c5ce69aa2ddf9c045944d946e95c135cb404c';
const validAt = '2026-09-01T02:54:50.355Z';
let server: Server; let baseUrl: string;
async function lookup(postalCode: string, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}/api/postal/GF/${encodeURIComponent(postalCode)}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, expectedStatus);
  return envelope.data;
}
before(async () => {
  const loaded = loadPostalContextPack(resolve('data/postal_country_packs/gf/postal-context/m2/descriptor.json'), descriptorDigest,
    { expectedCountryCode: 'GF', allowExperimental: true });
  const app = express(); app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(loaded.runtime) });
  server = app.listen(0); await new Promise<void>(done => server.once('listening', done));
  const address = server.address(); assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});
after(async () => { await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())); });

test('real GF lookup reaches API, app conversion, fit, translucent paint, clear and re-search', async () => {
  const data = await lookup('９７３ ００');
  assert.equal(data.status, 'unique');
  assert.equal(data.normalizedPostalCode, '97300');
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
  assert.equal(collection.features[0].properties.postalCode, '97300');
  assert.equal(collection.features[0].properties.geometryType, 'MultiPolygon');
  assert.equal(collection.features[0].properties.provenance, 'derived');
  assert.equal(collection.features[0].properties.sourceDate, '2026-08-08');
  assert.equal(collection.features[0].properties.confidence, 0.9);
  assert.deepEqual(postalAreaBounds(collection), [[-52.593833, 4.886669], [-52.163557, 5.297322]]);
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
  const second = createPostalAreaFeatureCollection(await lookup('97370'));
  syncPostalAreaMapLayer(map as never, second);
  assert.equal(second.features[0].properties.postalCode, '97370'); assert.equal(sources.size, 1); assert.equal(layers.size, 2);
});

test('GF shared commune codes stay distinct in lookup while returning the disclosed same surface', async () => {
  const roura = await lookup('97311'); const cacao = await lookup('97352');
  assert.equal(roura.normalizedPostalCode, '97311'); assert.equal(cacao.normalizedPostalCode, '97352');
  assert.deepEqual(roura.geometries[0].geometry, cacao.geometries[0].geometry);
  assert.notEqual(roura.postalFeatures[0].id, cacao.postalFeatures[0].id);
  assert.equal(roura.geometries[0].quality.confidence, 0.9);
});

test('GF returns no match for an unassigned structural code and rejects malformed or cross-country input', async () => {
  const missing = await lookup('97399'); assert.equal(missing.status, 'no_match'); assert.deepEqual(missing.geometries, []);
  for (const invalid of ['973-00', '75001']) {
    const response = await fetch(`${baseUrl}/api/postal/GF/${encodeURIComponent(invalid)}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
    const envelope = await response.json() as { ok: boolean; error: string; warnings: string[] };
    assert.equal(response.status, 400); assert.equal(envelope.ok, false); assert.equal(envelope.error, 'Invalid postal code');
    assert.deepEqual(envelope.warnings, ['invalid-postal-code']);
  }
});

test('GF invalid Polygon/MultiPolygon input is refused before map rendering', async () => {
  const invalid = structuredClone(await lookup('97300'));
  const geometry = invalid.geometries[0].geometry as unknown as { type: 'MultiPolygon'; coordinates: number[][][][] };
  geometry.coordinates[0][0] = geometry.coordinates[0][0].slice(0, 3);
  assert.equal(hasInvalidPostalAreaGeometry(invalid), true);
  assert.equal(createPostalAreaFeatureCollection(invalid).features.length, 0);
});
