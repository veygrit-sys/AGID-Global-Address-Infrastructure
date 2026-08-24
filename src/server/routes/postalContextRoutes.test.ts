import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { PostalContextPackRuntime } from '../../lib/postalContextPackRuntime';
import {
  POSTAL_CONTEXT_TEST_INSTANT,
  POSTAL_CONTEXT_TEST_POINT,
  createPostalContextRuntimeTestPack,
} from '../../testFixtures/postalContextRuntimeFixture';
import {
  createInMemoryPostalContextPackStore,
  type PostalContextPackStore,
} from '../postalContextPackStore';
import { registerPostalContextRoutes } from './postalContextRoutes';

type RunningServer = {
  server: Server;
  baseUrl: string;
};

let running: RunningServer;

async function startServer(store: PostalContextPackStore): Promise<RunningServer> {
  const app = express();
  app.use(express.json());
  registerPostalContextRoutes(app, { store });
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

async function stopServer(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
}

async function postResolve(baseUrl: string, body: unknown) {
  const response = await fetch(`${baseUrl}/api/postal/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'postal-context-route-test',
    },
    body: JSON.stringify(body),
  });
  return {
    response,
    body: await response.json() as any,
  };
}

async function getJson(baseUrl: string, path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'X-AGID-Request-ID': 'postal-context-route-test' },
  });
  return {
    response,
    body: await response.json() as any,
  };
}

function resolveBody(overrides: Record<string, unknown> = {}) {
  return {
    countryCode: 'JP',
    ...POSTAL_CONTEXT_TEST_POINT,
    purpose: 'display',
    validAt: POSTAL_CONTEXT_TEST_INSTANT,
    ...overrides,
  };
}

before(async () => {
  const pack = createPostalContextRuntimeTestPack();
  const internalPoint = pack.graph.nodes.find(node => node.id === 'address-point-synthetic');
  assert.ok(internalPoint);
  internalPoint.label = 'SECRET_INTERNAL_ADDRESS_POINT_LABEL';
  const runtime = new PostalContextPackRuntime(pack);
  running = await startServer(createInMemoryPostalContextPackStore(runtime));
});

after(async () => {
  await stopServer(running.server);
});

test('Postal Context metadata responses omit uncalibrated confidence', async () => {
  for (const path of ['/api/postal/capabilities', '/api/postal/releases/JP']) {
    const { response, body } = await getJson(running.baseUrl, path);

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(Object.hasOwn(body, 'confidence'), false);
  }
});

test('POST postal resolve returns an exact source-linked public building context', async () => {
  const { response, body } = await postResolve(running.baseUrl, resolveBody());

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(Object.hasOwn(body, 'confidence'), false);
  assert.equal(body.data.status, 'unique');
  assert.equal(body.data.resolvedLevel, 'building');
  assert.equal(body.data.addressPointEvidence.matched, true);
  assert.equal(body.data.selected.components.some(
    (component: { label?: string }) => component.label === '架空AGIDビル',
  ), true);
  assert.equal(body.data.release.countryCode, 'JP');
  assert.equal(body.data.release.releaseId, 'jp-synthetic-2026.01.1');
  assert.match(body.data.release.manifestDigest, /^sha256:[a-f0-9]{64}$/u);
  assert.ok(body.data.agid.cellId);
});

test('POST postal resolve returns partial for polygon-only evidence', async () => {
  const { response, body } = await postResolve(running.baseUrl, resolveBody({
    latitude: 35.685,
    longitude: 139.755,
  }));
  const serialized = JSON.stringify(body);

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.status, 'partial');
  assert.equal(body.data.resolvedLevel, 'postal_area');
  assert.equal(body.data.capabilities.building, false);
  assert.equal(body.data.addressPointEvidence.matched, false);
  assert.ok(body.data.warnings.includes('postal-area-only-no-source-address-point'));
  const geometryComponent = body.data.selected.components.find(
    (component: { method?: string }) => component.method === 'geometry_contains',
  );
  assert.ok(geometryComponent);
  assert.equal(geometryComponent.assertionId, undefined);
  assert.doesNotMatch(serialized, /runtime:(?:pip|query)|postal-jp-syn-0000001/u);
});

test('POST postal resolve preserves boundary ambiguity', async () => {
  const { response, body } = await postResolve(running.baseUrl, resolveBody({
    latitude: 35.68,
    longitude: 139.74,
  }));

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.status, 'ambiguous');
  assert.ok(body.data.warnings.includes('postal-boundary-requires-disambiguation'));
});

test('POST postal resolve returns a normal no-match outcome outside the pack', async () => {
  const { response, body } = await postResolve(running.baseUrl, resolveBody({
    latitude: 36,
    longitude: 140,
  }));

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.status, 'no_match');
  assert.equal(body.data.resolvedLevel, 'none');
  assert.equal(body.data.addressPointEvidence.matched, false);
  assert.deepEqual(body.data.postalEvidence, []);
});

test('POST postal resolve is private no-store and omits coordinates, secrets, and internal IDs', async () => {
  const { response, body } = await postResolve(running.baseUrl, resolveBody());
  const serialized = JSON.stringify(body);

  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.equal(response.headers.get('pragma'), 'no-cache');
  assert.doesNotMatch(serialized, /SECRET_INTERNAL_ADDRESS_POINT_LABEL/u);
  assert.doesNotMatch(serialized, /address-point-synthetic|geometry-address-point-synthetic/u);
  assert.doesNotMatch(serialized, /premise-synthetic|runtime:query/u);
  assert.doesNotMatch(serialized, /"(?:nodeId|pathId|geometryFeatureId|rootAddressRecordId)"/u);
  assert.doesNotMatch(serialized, /"(?:latitude|longitude|coordinates|distanceMeters|matchRadiusMeters)"/u);
  assert.doesNotMatch(serialized, /35\.68|139\.75/u);
});

test('POST postal resolve rejects invalid or private-shaped bodies without echoing them', async () => {
  const secret = 'PRIVATE-RECIPIENT-DO-NOT-ECHO';
  const unknownField = await postResolve(running.baseUrl, {
    ...resolveBody(),
    recipient: secret,
  });
  const invalidCoordinate = await postResolve(running.baseUrl, resolveBody({ latitude: 91 }));

  assert.equal(unknownField.response.status, 400);
  assert.equal(unknownField.body.ok, false);
  assert.match(unknownField.body.error, /Invalid Postal Context resolve body/u);
  assert.doesNotMatch(JSON.stringify(unknownField.body), new RegExp(secret, 'u'));
  assert.doesNotMatch(JSON.stringify(unknownField.body), /35\.68|139\.75/u);
  assert.equal(invalidCoordinate.response.status, 400);
  assert.equal(invalidCoordinate.body.ok, false);
  assert.match(invalidCoordinate.body.error, /Invalid Postal Context resolve input/u);
});

test('POST postal resolve rejects unsupported countries', async () => {
  const { response, body } = await postResolve(running.baseUrl, resolveBody({ countryCode: 'US' }));

  assert.equal(response.status, 404);
  assert.equal(body.ok, false);
  assert.match(body.error, /country is not supported/u);
});

test('POST postal resolve rejects a pinned release mismatch', async () => {
  const { response, body } = await postResolve(running.baseUrl, resolveBody({
    release: {
      mode: 'pinned',
      releaseId: 'jp-synthetic-other-release',
      manifestDigest: `sha256:${'b'.repeat(64)}`,
      policyVersion: 'jp-display-v0.1',
    },
  }));

  assert.equal(response.status, 409);
  assert.equal(body.ok, false);
  assert.match(body.error, /Pinned Postal Context release is not active/u);
});

test('POST postal resolve fails closed when the Japan pack is unavailable', async () => {
  const missingStore: PostalContextPackStore = {
    getRuntime: () => undefined,
    countryStatus: countryCode => ({
      countryCode: countryCode.toUpperCase(),
      state: 'unconfigured',
      errors: ['pack-not-configured'],
      warnings: [],
    }),
    statuses() {
      return [this.countryStatus('JP')];
    },
  };
  const isolated = await startServer(missingStore);
  try {
    const { response, body } = await postResolve(isolated.baseUrl, resolveBody());

    assert.equal(response.status, 503);
    assert.equal(body.ok, false);
    assert.match(body.error, /pack is unavailable/u);
    assert.ok(body.warnings.includes('pack-not-configured'));
    assert.doesNotMatch(JSON.stringify(body), /35\.68|139\.75/u);
  } finally {
    await stopServer(isolated.server);
  }
});

test('postal-code lookup defaults to context-only and requires an explicit GeoJSON opt-in', async () => {
  const query = new URLSearchParams({
    validAt: POSTAL_CONTEXT_TEST_INSTANT,
    knownAt: POSTAL_CONTEXT_TEST_INSTANT,
  });
  const { response, body } = await getJson(
    running.baseUrl,
    `/api/postal/JP/0000001?${query}`,
  );
  const serialized = JSON.stringify(body);

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(Object.hasOwn(body, 'confidence'), false);
  assert.equal(body.data.status, 'unique');
  assert.equal(body.data.normalizedPostalCode, '000-0001');
  assert.equal(body.data.geometries.length, 0);
  assert.equal(body.data.contexts.some(
    (context: { label?: string }) => context.label === '架空都',
  ), true);
  assert.doesNotMatch(serialized, /SECRET_INTERNAL_ADDRESS_POINT_LABEL/u);
  assert.doesNotMatch(serialized, /address-point-synthetic|geometry-address-point-synthetic/u);

  query.set('geometry', 'geojson');
  const withGeometry = await getJson(
    running.baseUrl,
    `/api/postal/JP/0000001?${query}`,
  );
  assert.equal(withGeometry.response.status, 200);
  assert.equal(withGeometry.body.data.geometries.length, 1);
  assert.equal(withGeometry.body.data.geometries[0].geometry.type, 'Polygon');

  query.set('geometry', 'full');
  const invalidMode = await getJson(
    running.baseUrl,
    `/api/postal/JP/0000001?${query}`,
  );
  assert.equal(invalidMode.response.status, 400);
  assert.equal(invalidMode.body.ok, false);
  assert.match(invalidMode.body.error, /geometry mode/u);
});

test('postal bbox intersection returns the intersecting public polygon', async () => {
  const query = new URLSearchParams({
    country: 'JP',
    bbox: '139.745,35.675,139.755,35.685',
    validAt: POSTAL_CONTEXT_TEST_INSTANT,
    knownAt: POSTAL_CONTEXT_TEST_INSTANT,
    limit: '10',
  });
  const { response, body } = await getJson(
    running.baseUrl,
    `/api/postal/intersects?${query}`,
  );

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(Object.hasOwn(body, 'confidence'), false);
  assert.equal(body.data.status, 'unique');
  assert.equal(body.data.matches.length, 1);
  assert.equal(body.data.matches[0].node.postalCode, '000-0001');
  assert.equal(body.data.matches[0].geometry.type, 'Polygon');
  assert.equal(body.data.truncated, false);
  assert.doesNotMatch(JSON.stringify(body), /address-point-synthetic|geometry-address-point-synthetic/u);

  query.set('limit', '17');
  const overLimit = await getJson(
    running.baseUrl,
    `/api/postal/intersects?${query}`,
  );
  assert.equal(overLimit.response.status, 400);
  assert.equal(overLimit.body.ok, false);
  assert.ok(overLimit.body.warnings.includes('invalid-limit'));
});
