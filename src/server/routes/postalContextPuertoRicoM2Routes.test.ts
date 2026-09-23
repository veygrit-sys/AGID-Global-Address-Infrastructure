import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { resolve } from 'node:path';
import {
  POSTAL_SEARCH_AREA_FILL_LAYER_ID, POSTAL_SEARCH_AREA_OUTLINE_LAYER_ID,
  createPostalAreaFeatureCollection, postalAreaBounds, syncPostalAreaMapLayer,
} from '../../lib/postalSearchArea';
import type { PostalContextLookupResponse } from '../../services/PostalContextService';
import { createInMemoryPostalContextPackStore, loadPostalContextPack } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

const descriptorDigest = 'sha256:876abe3dafe711d950d6de645103355d2bdaecbe48f92d48ec70e0df40864309';
const validAt = '2026-09-02T01:30:00.000Z';
let server: Server;
let baseUrl: string;
async function lookup(postalCode: string, expectedStatus = 200) {
  const response = await fetch(baseUrl + '/api/postal/PR/' + encodeURIComponent(postalCode)
    + '?validAt=' + encodeURIComponent(validAt) + '&geometry=geojson');
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse; error?: string };
  assert.equal(response.status, expectedStatus);
  return envelope;
}
before(async () => {
  const loaded = loadPostalContextPack(resolve('data/postal_country_packs/pr/postal-context/m2/descriptor.json'),
    descriptorDigest, { expectedCountryCode: 'PR', allowExperimental: true });
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

test('real PR lookup exposes detailed labels and IDs, renders, fits, clears and re-searches', async () => {
  const envelope = await lookup('００９２６－３２３２');
  assert.equal(envelope.ok, true);
  const data = envelope.data;
  assert.equal(data.status, 'unique');
  assert.equal(data.normalizedPostalCode, '00926');
  assert.equal(data.postalFeatures[0].id, 'postal-pr-census-zcta-00926');
  assert.match(data.postalFeatures[0].label ?? '', /population 96,732.*housing 45,969.*land 60\.12 km².*water 0\.22 km²/);
  assert.equal(data.alternatives[0].contexts[0].id, 'country-pr');
  assert.deepEqual(data.alternatives[0].assertionIds, ['census-pr-zcta-2020-00926-part-of-pr']);
  assert.equal(data.geometries[0].id, 'census-pr-zcta-2020-00926');
  assert.equal(data.geometries[0].geometry.type, 'Polygon');
  assert.equal(data.geometries[0].source.sourceType, 'derived');
  assert.equal(data.geometries[0].source.geometryAuthority, 'official_mapping_geometry');
  assert.equal(data.geometries[0].quality.confidence, 0.9);
  const collection = createPostalAreaFeatureCollection(data);
  assert.equal(collection.features[0].properties.contextId, 'postal-pr-census-zcta-00926');
  assert.equal(collection.features[0].properties.geometryFeatureId, 'census-pr-zcta-2020-00926');
  assert.equal(collection.features[0].properties.linkedContextIds, 'country-pr');
  assert.equal(collection.features[0].properties.licenseId, 'us-census-public-use-attribution');
  assert.deepEqual(postalAreaBounds(collection), [
    [-66.10244799956124, 18.30192300028008], [-66.00346400025006, 18.396658999825014],
  ]);
  const sources = new Map<string, { data: unknown; setData(value: unknown): void }>();
  const layers = new Map<string, Record<string, any>>();
  const map = {
    isStyleLoaded: () => true, getSource: (id: string) => sources.get(id),
    addSource: (id: string, definition: { data: unknown }) => {
      const stored = { data: definition.data, setData(value: unknown) { stored.data = value; } };
      sources.set(id, stored);
    },
    removeSource: (id: string) => { sources.delete(id); }, getLayer: (id: string) => layers.get(id),
    addLayer: (layer: Record<string, any>) => { layers.set(String(layer.id), layer); },
    removeLayer: (id: string) => { layers.delete(id); },
  };
  syncPostalAreaMapLayer(map as never, collection);
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

test('PR codes without a fixed 2020 Census ZCTA return no match instead of fabricated geometry', async () => {
  const envelope = await lookup('00902');
  assert.equal(envelope.ok, true);
  assert.equal(envelope.data.status, 'no_match');
  assert.deepEqual(envelope.data.geometries, []);
});
