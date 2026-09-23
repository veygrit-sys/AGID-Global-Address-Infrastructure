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

const descriptorDigest = 'sha256:22e0ebf3386c6bfda50d84a102202da4a7f6846a4a0ea3aaf9c1aee409723758';
const validAt = '2026-09-01T13:07:27.205Z';
let server: Server; let baseUrl: string;
async function lookup(postalCode: string, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}/api/postal/MQ/${encodeURIComponent(postalCode)}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, expectedStatus);
  return envelope.data;
}
before(async () => {
  const loaded = loadPostalContextPack(resolve('data/postal_country_packs/mq/postal-context/m2/descriptor.json'), descriptorDigest,
    { expectedCountryCode: 'MQ', allowExperimental: true });
  const app = express(); app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(loaded.runtime) });
  server = app.listen(0); await new Promise<void>(done => server.once('listening', done));
  const address = server.address(); assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});
after(async () => { await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())); });

test('real MQ lookup reaches API, app conversion, fit, translucent paint, clear and re-search', async () => {
  const data = await lookup('９７２ １８');
  assert.equal(data.status, 'ambiguous');
  assert.equal(data.normalizedPostalCode, '97218');
  assert.equal(data.postalFeatures.length, 3); assert.equal(data.geometries.length, 3); assert.equal(data.alternatives.length, 3);
  assert.equal(data.geometries.every(item => item.quality.status === 'derived' && item.quality.confidence === 0.9), true);
  assert.equal(data.geometries.every(item => item.source.sourceType === 'derived' && item.source.assignmentAuthority === 'official_postal_operator' && item.source.geometryAuthority === 'official_mapping_geometry'), true);
  assert.equal(data.geometries.every(item => item.source.sourceDate === '2026-08-08'), true);
  assert.equal(data.geometries.every(item => /derived commune display surface/u.test(item.node.label ?? '')), true);
  const collection = createPostalAreaFeatureCollection(data);
  assert.equal(collection.features.length, 3);
  assert.equal(collection.features.every(feature => feature.properties.postalCode === '97218'), true);
  assert.equal(collection.features.every(feature => ['Polygon', 'MultiPolygon'].includes(feature.properties.geometryType)), true);
  assert.equal(collection.features.every(feature => feature.properties.provenance === 'derived' && feature.properties.sourceDate === '2026-08-08' && feature.properties.confidence === 0.9), true);
  assert.deepEqual(postalAreaBounds(collection), [[-61.204045, 14.808342], [-61.083423, 14.878716]]);
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
  const second = createPostalAreaFeatureCollection(await lookup('97290'));
  syncPostalAreaMapLayer(map as never, second);
  assert.equal(second.features[0].properties.postalCode, '97290'); assert.equal(sources.size, 1); assert.equal(layers.size, 2);
});

test('MQ shared commune codes stay distinct in lookup while returning the disclosed same surface', async () => {
  const abymesPrimary = await lookup('97200'); const abymesSecondary = await lookup('97234');
  assert.equal(abymesPrimary.normalizedPostalCode, '97200'); assert.equal(abymesSecondary.normalizedPostalCode, '97234');
  assert.deepEqual(abymesPrimary.geometries[0].geometry, abymesSecondary.geometries[0].geometry);
  assert.notEqual(abymesPrimary.postalFeatures[0].id, abymesSecondary.postalFeatures[0].id);
  assert.equal(abymesPrimary.geometries[0].quality.confidence, 0.9);
});

test('MQ returns no match for an unassigned structural code and rejects malformed or cross-country input', async () => {
  const missing = await lookup('97299'); assert.equal(missing.status, 'no_match'); assert.deepEqual(missing.geometries, []);
  for (const invalid of ['972-00', '97300', '97100']) {
    const response = await fetch(`${baseUrl}/api/postal/MQ/${encodeURIComponent(invalid)}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
    const envelope = await response.json() as { ok: boolean; error: string; warnings: string[] };
    assert.equal(response.status, 400); assert.equal(envelope.ok, false); assert.equal(envelope.error, 'Invalid postal code');
    assert.deepEqual(envelope.warnings, ['invalid-postal-code']);
  }
});

test('MQ invalid Polygon/MultiPolygon input is refused before map rendering', async () => {
  const invalid = structuredClone(await lookup('97218'));
  const geometry = invalid.geometries[0].geometry as unknown as { coordinates: unknown[] };
  geometry.coordinates[0] = [];
  assert.equal(hasInvalidPostalAreaGeometry(invalid), true);
  assert.equal(createPostalAreaFeatureCollection(invalid).features.length, 2);
});
