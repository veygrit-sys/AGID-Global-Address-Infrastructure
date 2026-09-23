import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { registerMachineAgidAoidRoutes } from './machineAgidAoidRoutes';

let server: Server;
let baseUrl = '';

async function getJson(path: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'X-AGID-Request-ID': 'machine-comms-route-test' },
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'machine-comms-route-test',
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

before(async () => {
  const app = express();
  app.use(express.json());
  registerMachineAgidAoidRoutes(app);
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('machine AGID/AOID routes expose capabilities and demo handshakes', async () => {
  const capabilities = await getJson('/api/machine/agid-aoid/capabilities');
  assert.equal(capabilities.status, 200);
  assert.equal(capabilities.body.ok, true);
  assert.ok(capabilities.body.data.roles.includes('pos-terminal'));
  assert.ok(capabilities.body.data.capabilities.includes('open-locker'));
  assert.equal(capabilities.body.data.privacy.rawAddressStored, false);

  const demo = await getJson('/api/machine/agid-aoid/demo');
  assert.equal(demo.status, 200);
  assert.equal(demo.body.ok, true);
  assert.equal(demo.body.data.handshakes[0].decision, 'accept');
  assert.equal(demo.body.data.handshakes[0].nextAction, 'open-locker');
  assert.equal(demo.body.data.envelopes[0].privacy.rawAgidStored, false);
});

test('machine AGID/AOID routes create an envelope and negotiate a handshake', async () => {
  const envelopeResponse = await postJson('/api/machine/agid-aoid/envelope', {
    from: {
      role: 'pos-terminal',
      nodeId: 'NODE-POS-ROUTE',
      trustLevel: 'organization-trusted',
      capabilities: ['verify-waybill-alias', 'check-revocation-freshness'],
    },
    to: {
      role: 'locker-controller',
      nodeId: 'NODE-LOCKER-ROUTE',
      trustLevel: 'paired',
      capabilities: ['verify-aoid-reference', 'open-locker'],
    },
    purpose: 'locker-release',
    operation: 'locker-release-request',
    createdAt: '2026-06-20T09:00:00.000Z',
    publicPayload: {
      aoidCommitment: 'AOC-ROUTE-001',
      waybillAlias: 'WBA-ROUTE-001',
    },
  });

  assert.equal(envelopeResponse.status, 200);
  assert.equal(envelopeResponse.body.ok, true);
  assert.deepEqual(envelopeResponse.body.data.payloadKeys, ['aoidCommitment', 'waybillAlias']);

  const handshakeResponse = await postJson('/api/machine/agid-aoid/handshake', {
    envelope: envelopeResponse.body.data,
    now: '2026-06-20T09:00:05.000Z',
  });

  assert.equal(handshakeResponse.status, 200);
  assert.equal(handshakeResponse.body.ok, true);
  assert.equal(handshakeResponse.body.data.decision, 'accept');
  assert.equal(handshakeResponse.body.data.receipt.privacy.rawAddressStored, false);
});

test('machine AGID/AOID route redacts private-material errors', async () => {
  const blocked = await postJson('/api/machine/agid-aoid/envelope', {
    from: { role: 'pos-terminal' },
    to: { role: 'field-device' },
    purpose: 'delivery-handoff',
    operation: 'handoff-request',
    publicPayload: {
      address: 'private-location-line',
      proofSecret: 'recipient-secret',
    },
  });

  assert.equal(blocked.status, 400);
  assert.equal(blocked.body.ok, false);
  assert.match(blocked.body.error, /private material/i);
  assert.ok(blocked.body.warnings.includes('machine-envelope-input-redacted-from-error-response'));
  assert.doesNotMatch(JSON.stringify(blocked.body), /private-location-line|recipient-secret/);
});
