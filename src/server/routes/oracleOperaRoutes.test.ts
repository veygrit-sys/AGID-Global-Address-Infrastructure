import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import express from 'express';

import { registerOracleOperaRoutes } from './oracleOperaRoutes';
import { resetOracleOperaRuntimeState, type OracleOperaFetch } from '../../services/OracleOperaService';

let server: Server;
let baseUrl = '';

const ADMIN_TOKEN = 'opera-admin-test-token';

async function getJson(path: string, token = ADMIN_TOKEN) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'X-AGID-Request-ID': 'oracle-opera-route-test',
      ...(token ? { 'X-AGID-OPERA-Admin-Token': token } : {}),
    },
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

async function postJson(path: string, body: unknown, token = ADMIN_TOKEN) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'oracle-opera-route-test',
      ...(token ? { 'X-AGID-OPERA-Admin-Token': token } : {}),
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: await response.json(),
  };
}

before(async () => {
  resetOracleOperaRuntimeState();
  const app = express();
  app.use(express.json());
  registerOracleOperaRoutes(app, {
    env: {
      OPERA_DRY_RUN: 'true',
      OPERA_ADMIN_TOKEN: ADMIN_TOKEN,
      OPERA_HOTEL_ID: 'HOTEL1',
      OPERA_ALLOWED_HOTEL_IDS: 'HOTEL1',
      OPERA_ALLOWED_TENANT_IDS: 'tenant-a',
    } as NodeJS.ProcessEnv,
  });
  server = app.listen(0);
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test('Oracle OPERA routes expose masked health and dry-run address sync', async () => {
  const health = await getJson('/api/integrations/oracle-opera/health');
  assert.equal(health.status, 200);
  assert.equal(health.body.ok, true);
  assert.equal(health.body.data.liveWritesEnabled, false);
  assert.ok(health.body.data.missingEnvVars.includes('OPERA_BASE_URL'));
  assert.doesNotMatch(JSON.stringify(health.body), /client-secret|app-key/i);

  const sync = await postJson('/api/integrations/oracle-opera/address', {
    agid: 'US05OPERA1',
    countryCode: 'US',
    language: 'en',
    tenantId: 'tenant-a',
    hotelId: 'HOTEL1',
    address: {
      recipient: 'Guest Name',
      line1: '1 Hotel Way',
      city: 'Orlando',
      postalCode: '32830',
    },
  });
  assert.equal(sync.status, 200);
  assert.equal(sync.body.ok, true);
  assert.equal(sync.body.data.mode, 'dry-run');
  assert.equal(sync.body.data.requestSummary.countryCode, 'US');
  assert.equal(sync.body.data.audit.outcome, 'dry-run');
  assert.doesNotMatch(JSON.stringify(sync.body), /Guest Name|1 Hotel Way|32830/);
});

test('Oracle OPERA route rejects missing address payloads', async () => {
  const response = await postJson('/api/integrations/oracle-opera/address', {
    agid: 'NO-ADDRESS',
    tenantId: 'tenant-a',
    hotelId: 'HOTEL1',
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.ok, false);
  assert.match(response.body.error, /Missing address/);
});

test('Oracle OPERA routes require admin token and tenant permissions', async () => {
  const unauthorized = await getJson('/api/integrations/oracle-opera/health', '');
  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorized.body.ok, false);

  const forbidden = await postJson('/api/integrations/oracle-opera/address', {
    agid: 'US05OPERA2',
    countryCode: 'US',
    language: 'en',
    tenantId: 'tenant-b',
    hotelId: 'HOTEL2',
    addressText: '1 Hotel Way, Orlando FL 32830',
  });
  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.body.ok, false);
});

test('Oracle OPERA route moves rate limits to redacted dead-letter records', async () => {
  resetOracleOperaRuntimeState();
  const app = express();
  app.use(express.json());
  const fetcher: OracleOperaFetch = async (url) => {
    if (url === 'https://id.example.test/oauth2/token') {
      return Response.json({ access_token: 'opera-token', expires_in: 3600 });
    }
    return Response.json({ rawOracleError: 'private upstream detail' }, {
      status: 429,
      headers: { 'Retry-After': '30' },
    });
  };
  registerOracleOperaRoutes(app, {
    fetcher,
    env: {
      OPERA_DRY_RUN: 'false',
      OPERA_ADMIN_TOKEN: ADMIN_TOKEN,
      OPERA_BASE_URL: 'https://opera.example.test',
      OPERA_TOKEN_URL: 'https://id.example.test/oauth2/token',
      OPERA_CLIENT_ID: 'client-id',
      OPERA_CLIENT_SECRET: 'client-secret',
      OPERA_APP_KEY: 'app-key',
      OPERA_HOTEL_ID: 'HOTEL1',
      OPERA_ALLOWED_HOTEL_IDS: 'HOTEL1',
      OPERA_ALLOWED_TENANT_IDS: 'tenant-a',
      OPERA_SECRET_STORAGE: 'vault',
    } as NodeJS.ProcessEnv,
  });
  const localServer = app.listen(0);
  await new Promise<void>(resolve => localServer.once('listening', resolve));
  const address = localServer.address();
  assert.ok(address && typeof address === 'object');
  const localBaseUrl = `http://127.0.0.1:${address.port}`;

  const syncResponse = await fetch(`${localBaseUrl}/api/integrations/oracle-opera/address`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-AGID-Request-ID': 'oracle-opera-route-test-429',
      'X-AGID-OPERA-Admin-Token': ADMIN_TOKEN,
    },
    body: JSON.stringify({
      agid: 'US05OPERA429',
      countryCode: 'US',
      language: 'en',
      tenantId: 'tenant-a',
      hotelId: 'HOTEL1',
      profileId: 'P429',
      address: {
        line1: '1 Hotel Way',
        city: 'Orlando',
        postalCode: '32830',
      },
    }),
  });
  const sync = await syncResponse.json();
  assert.equal(syncResponse.status, 429);
  assert.equal(sync.ok, false);
  assert.equal(sync.data.errorCode, 'OPERA_RATE_LIMITED');
  assert.equal(sync.data.response.retryAfterSeconds, 30);
  assert.doesNotMatch(JSON.stringify(sync), /private upstream detail|1 Hotel Way|32830/);

  const dlqResponse = await fetch(`${localBaseUrl}/api/integrations/oracle-opera/dead-letter`, {
    headers: {
      'X-AGID-Request-ID': 'oracle-opera-route-test-dlq',
      'X-AGID-OPERA-Admin-Token': ADMIN_TOKEN,
    },
  });
  const dlq = await dlqResponse.json();
  assert.equal(dlqResponse.status, 200);
  assert.equal(dlq.data.records[0].reasonCode, 'OPERA_RATE_LIMITED');
  assert.doesNotMatch(JSON.stringify(dlq), /1 Hotel Way|32830|private upstream detail/);

  await new Promise<void>(resolve => localServer.close(() => resolve()));
});
