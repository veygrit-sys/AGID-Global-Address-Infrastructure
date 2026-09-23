import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import express from 'express';
import type { Server } from 'node:http';

import { createInMemoryAgidRegistryApiStore } from '../../lib/agidRegistryApi';
import { createInMemoryAddressResolutionLedgerStore } from '../addressResolutionLedgerStore';
import { registerAddressResolutionSystemRoutes } from './addressResolutionSystemRoutes';

let server: Server;
let baseUrl = '';
const ledgerStore = createInMemoryAddressResolutionLedgerStore();

before(async () => {
  const app = express();
  app.use(express.json());
  registerAddressResolutionSystemRoutes(app, {
    registryStore: createInMemoryAgidRegistryApiStore(),
    ledgerStore,
  });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('test server did not bind to a TCP port');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
});

async function getJson(path: string) {
  const response = await fetch(`${baseUrl}${path}`);
  return {
    response,
    body: await response.json() as any,
  };
}

async function postJson(path: string, body: unknown, headers: Record<string, string> = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return {
    response,
    body: await response.json() as any,
  };
}

test('address resolution routes expose capabilities', async () => {
  const { response, body } = await getJson('/api/address-resolution/capabilities');

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.ok(body.data.modes.includes('local-only'));
  assert.equal(body.data.privacy.rawAddressToFederation, false);
});

test('address resolution route resolves a local-only AGID/address request', async () => {
  const { response, body } = await postJson('/api/address-resolution/resolve', {
    mode: 'local-only',
    domain: 'pos:route-test',
    language: 'ja',
    addressText: '100-0005 Tokyo Chiyoda Marunouchi 1-9-1',
    address: {
      country_code: 'JP',
      state: 'Tokyo',
      city: 'Chiyoda',
      road: 'Marunouchi',
      house_number: '1-9-1',
      postcode: '100-0005',
    },
    countryCode: 'JP',
    targetCountries: ['JP'],
    postalCode: '100-0005',
    postalEvidence: [{
      source: 'japan-postcode-api',
      sourceId: 'japan-postcode-api',
      countryCode: 'JP',
      postalCode: '100-0005',
      state: 'Tokyo',
      city: 'Chiyoda',
      confidence: 0.97,
    }],
    lat: 35.681236,
    lon: 139.767125,
    now: '2026-06-17T00:00:00.000Z',
  });

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.data.mode, 'local-only');
  assert.equal(body.data.status, 'resolved');
  assert.equal(body.data.displayHints.language, 'ja');
  assert.ok(body.data.agid.id);
  assert.equal(body.data.ledger.recorded, true);
  assert.equal(body.data.ledger.rawAddressStored, false);
  assert.ok(body.data.ledger.streamId.startsWith('arl-stream:'));
  assert.equal(body.data.ledger.temporalSequence, 1);
});

test('address resolution route applies Accept-Language header to address display language', async () => {
  const { response, body } = await postJson('/api/address-resolution/resolve', {
    mode: 'local-only',
    domain: 'pos:language-header',
    language: 'en',
    availableLanguages: ['en', 'ja-JP'],
    addressText: '100-0005 Tokyo Chiyoda Marunouchi 1-9-1',
    address: {
      country_code: 'JP',
      state: 'Tokyo',
      city: 'Chiyoda',
      road: 'Marunouchi',
      house_number: '1-9-1',
      postcode: '100-0005',
    },
    countryCode: 'JP',
    targetCountries: ['JP'],
    postalCode: '100-0005',
    lat: 35.681236,
    lon: 139.767125,
    now: '2026-06-17T00:00:00.000Z',
  }, {
    'Accept-Language': 'ja-JP, en;q=0.6',
  });

  assert.equal(response.status, 206);
  assert.equal(body.ok, true);
  assert.equal(body.data.displayHints.language, 'ja-jp');
  assert.equal(body.data.internetProtocols.contentLanguage.fallback, false);
});

test('address resolution routes expose commitment-only ledger records', async () => {
  const { response, body } = await postJson('/api/address-resolution/resolve', {
    mode: 'local-only',
    domain: 'pos:ledger-route-test',
    language: 'en',
    addressText: '100-0005 Tokyo Chiyoda Marunouchi 1-9-1',
    address: {
      country_code: 'JP',
      state: 'Tokyo',
      city: 'Chiyoda',
      road: 'Marunouchi',
      house_number: '1-9-1',
      postcode: '100-0005',
    },
    countryCode: 'JP',
    targetCountries: ['JP'],
    postalCode: '100-0005',
    lat: 35.681236,
    lon: 139.767125,
    now: '2026-06-17T00:00:00.000Z',
    nullifierHash: '0xroute-ledger-nullifier',
    scope: 'delivery:route-ledger',
  });

  assert.equal(response.status, 206);
  assert.equal(body.ok, true);
  assert.equal(body.data.ledger.recorded, true);

  const status = await getJson('/api/address-resolution/ledger/status');
  assert.equal(status.response.status, 200);
  assert.ok(status.body.data.resolutionCount >= 1);
  assert.ok(status.body.data.eventCount >= 1);
  assert.ok(status.body.data.snapshotCount >= 1);
  assert.equal(status.body.data.rawAddressStored, false);

  const entry = await getJson(`/api/address-resolution/ledger/${body.data.resolutionId}`);
  const serialized = JSON.stringify(entry.body.data);
  assert.equal(entry.response.status, 200);
  assert.equal(entry.body.data.resolution.resolutionId, body.data.resolutionId);
  assert.equal(entry.body.data.nullifiers[0].nullifierHash, '0xroute-ledger-nullifier');
  assert.doesNotMatch(serialized, /Tokyo|Chiyoda|Marunouchi|100-0005|35\.681236|139\.767125/);
  assert.doesNotMatch(serialized, new RegExp(body.data.agid.id));

  const events = await getJson(`/api/address-resolution/ledger/streams/${body.data.ledger.streamId}/events`);
  assert.equal(events.response.status, 200);
  assert.equal(events.body.data.streamId, body.data.ledger.streamId);
  assert.ok(events.body.data.events.some((event: any) => event.eventType === 'resolution-recorded'));

  const snapshot = await getJson(`/api/address-resolution/ledger/streams/${body.data.ledger.streamId}/snapshot`);
  assert.equal(snapshot.response.status, 200);
  assert.equal(snapshot.body.data.streamId, body.data.ledger.streamId);
  assert.equal(snapshot.body.data.resolutionId, body.data.resolutionId);
});
