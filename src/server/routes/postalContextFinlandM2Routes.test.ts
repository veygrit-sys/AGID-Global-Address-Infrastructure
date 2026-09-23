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
  postalAreaUnavailableDetail,
  syncPostalAreaMapLayer,
} from '../../lib/postalSearchArea';
import type { PostalContextLookupResponse } from '../../services/PostalContextService';
import { createInMemoryPostalContextPackStore, loadPostalContextPack } from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

const descriptorDigest = 'sha256:1080c3d5e9bb32894fd398eb30dd21cfde5c73bbdd98826bdd41f136cc72f004';
const validAt = '2026-08-30T05:10:43.249Z';
let server: Server;
let baseUrl: string;

async function lookup(postalCode: string) {
  const response = await fetch(`${baseUrl}/api/postal/FI/${encodeURIComponent(postalCode)}?validAt=${encodeURIComponent(validAt)}&geometry=geojson`);
  const envelope = await response.json() as { ok: boolean; data: PostalContextLookupResponse };
  assert.equal(response.status, 200);
  assert.equal(envelope.ok, true);
  return envelope.data;
}

before(async () => {
  const loaded = loadPostalContextPack(
    resolve('data/postal_country_packs/fi/postal-context/m2/descriptor.json'),
    descriptorDigest,
    { expectedCountryCode: 'FI', allowExperimental: true },
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

test('real FI lookup reaches API, app conversion, fit bounds, translucent paint, clear and re-search', async () => {
  const data = await lookup('00 100');
  assert.equal(data.status, 'unique');
  assert.equal(data.normalizedPostalCode, '00100');
  assert.equal(data.geometries.length, 1);
  assert.equal(data.geometries[0].geometry.type, 'Polygon');
  assert.equal(data.geometries[0].quality.status, 'derived');
  assert.equal(data.geometries[0].quality.confidence, 0.95);
  assert.equal(data.geometries[0].source.assignmentAuthority, 'official_postal_operator');
  assert.equal(data.geometries[0].source.geometryAuthority, 'derived_geometry');
  assert.equal(data.geometries[0].source.sourceDate, '2026-08-29');

  const collection = createPostalAreaFeatureCollection(data);
  assert.equal(collection.features.length, 1);
  assert.equal(collection.features[0].properties.provenance, 'derived');
  assert.equal(collection.features[0].properties.confidence, 0.95);
  const bounds = postalAreaBounds(collection);
  assert.ok(bounds);
  assert.ok(bounds[0][0] > 24.8 && bounds[1][0] < 25.1);
  assert.ok(bounds[0][1] > 60.1 && bounds[1][1] < 60.3);

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

test('real FI corporate and unmatched normal assignments remain honest non-areas', async () => {
  const corporate = await lookup('00022');
  assert.equal(corporate.status, 'unique');
  assert.equal(corporate.alternatives[0].postalFeature.featureKind, 'organization');
  assert.deepEqual(corporate.geometries, []);
  assert.match(postalAreaUnavailableDetail(corporate), /法人・大口利用者.*建物や敷地/u);

  const missingPaavo = await lookup('42720');
  assert.equal(missingPaavo.status, 'unique');
  assert.equal(missingPaavo.alternatives[0].postalFeature.featureKind, 'standard_area');
  assert.deepEqual(missingPaavo.geometries, []);
  assert.match(postalAreaUnavailableDetail(missingPaavo), /現行の通常郵便番号.*自治体や近隣区域/u);
});

test('FI runtime excludes Aland instead of merging the PCF and Paavo records', async () => {
  const data = await lookup('22100');
  assert.equal(data.status, 'no_match');
  assert.deepEqual(data.geometries, []);
});
