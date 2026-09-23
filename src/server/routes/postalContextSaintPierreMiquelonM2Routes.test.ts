import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { resolve } from 'node:path';
import {
  POSTAL_SEARCH_AREA_FILL_LAYER_ID, POSTAL_SEARCH_AREA_OUTLINE_LAYER_ID, POSTAL_SEARCH_AREA_SOURCE_ID,
  createPostalAreaFeatureCollection, postalAreaBounds, syncPostalAreaMapLayer,
} from '../../lib/postalSearchArea';
import type { PostalContextLookupResponse } from '../../services/PostalContextService';
import { createInMemoryPostalContextPackStore, loadPostalContextPack } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

const descriptorDigest = 'sha256:eefdebc10d77d0adb486c788f9c8a2c6b2129e247b18cec2c6d69f3815b64f1d';
const validAt = '2026-09-01T19:06:03.583Z';
let server: Server;
let baseUrl: string;
async function lookup(postalCode: string, expectedStatus = 200) {
  const response = await fetch(baseUrl + '/api/postal/PM/' + encodeURIComponent(postalCode) + '?validAt=' + encodeURIComponent(validAt) + '&geometry=geojson');
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, expectedStatus);
  return envelope.data;
}
before(async () => {
  const loaded = loadPostalContextPack(resolve('data/postal_country_packs/pm/postal-context/m2/descriptor.json'), descriptorDigest,
    { expectedCountryCode: 'PM', allowExperimental: true });
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, { store: createInMemoryPostalContextPackStore(loaded.runtime) });
  server = app.listen(0);
  await new Promise<void>(done => server.once('listening', done));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = 'http://127.0.0.1:' + address.port;
});
after(async () => { await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done())); });

test('real PM lookup reaches API, exposes IDs, renders, fits, clears and re-searches', async () => {
  const data = await lookup('９７ ５００');
  assert.equal(data.status, 'ambiguous');
  assert.equal(data.normalizedPostalCode, '97500');
  assert.equal(data.postalFeatures.length, 1);
  assert.equal(data.postalFeatures[0].id, 'postal-pm-97500');
  assert.equal(data.alternatives.length, 2);
  assert.deepEqual(data.alternatives.map(item => item.contexts.map(context => [context.id, context.label])), [
    [['admin-pm-insee-97501', 'Miquelon-Langlade']],
    [['admin-pm-insee-97502', 'Saint-Pierre']],
  ]);
  assert.deepEqual(data.alternatives.map(item => item.assertionIds), [
    ['laposte-pm-20260808-97500-admin-within-97501'],
    ['laposte-pm-20260808-97500-admin-within-97502'],
  ]);
  assert.equal(data.release.releaseId, 'pm-laposte-geoapi-single-postcode-20260901');
  assert.equal(data.geometries.length, 1);
  assert.equal(data.geometries[0].geometry.type, 'MultiPolygon');
  assert.equal(data.geometries[0].quality.status, 'derived');
  assert.equal(data.geometries[0].quality.confidence, 0.95);
  assert.equal(data.geometries[0].source.sourceType, 'derived');
  assert.equal(data.geometries[0].source.assignmentAuthority, 'derived_spatial_assignment');
  assert.equal(data.geometries[0].source.geometryAuthority, 'derived_geometry');
  assert.equal(data.geometries[0].source.sourceDate, '2026-09-01');
  const collection = createPostalAreaFeatureCollection(data);
  assert.equal(collection.features.length, 1);
  assert.equal(collection.features[0].properties.contextId, 'postal-pm-97500');
  assert.equal(collection.features[0].properties.linkedContextIds, 'admin-pm-insee-97501,admin-pm-insee-97502');
  assert.equal(collection.features[0].properties.assertionIds,
    'laposte-pm-20260808-97500-admin-within-97501,laposte-pm-20260808-97500-admin-within-97502');
  assert.equal(collection.features[0].properties.releaseId, 'pm-laposte-geoapi-single-postcode-20260901');
  assert.equal(collection.features[0].properties.provenance, 'derived');
  assert.deepEqual(postalAreaBounds(collection), [[-56.518569, 46.749454], [-56.119017, 47.144249]]);
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
  syncPostalAreaMapLayer(map as never, null);
  assert.equal(sources.size, 0);
  assert.equal(layers.size, 0);
  syncPostalAreaMapLayer(map as never, collection);
  assert.equal(sources.size, 1);
  assert.equal(layers.size, 2);
});

test('PM invalid postcode is rejected without a fabricated area', async () => {
  const response = await fetch(baseUrl + '/api/postal/PM/97501?validAt=' + encodeURIComponent(validAt) + '&geometry=geojson');
  const envelope = await response.json() as { ok: boolean; error: string; warnings: string[] };
  assert.equal(response.status, 400);
  assert.equal(envelope.ok, false);
  assert.equal(envelope.error, 'Invalid postal code');
  assert.deepEqual(envelope.warnings, ['invalid-postal-code']);
});
