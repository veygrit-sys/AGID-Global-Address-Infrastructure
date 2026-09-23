import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildOracleOperaAddressPayload,
  buildOracleOperaHeaders,
  maskOracleOperaConfig,
  resetOracleOperaRuntimeState,
  syncAddressToOracleOpera,
  type OracleOperaFetch,
} from './OracleOperaService';

test('Oracle OPERA runtime state is reset for deterministic tests', () => {
  resetOracleOperaRuntimeState();
  assert.ok(true);
});

test('Oracle OPERA integration stays in dry-run when credentials or write path are missing', async () => {
  resetOracleOperaRuntimeState();
  const result = await syncAddressToOracleOpera({
    agid: 'JP05AV8TJGH8',
    countryCode: 'JP',
    language: 'ja',
    address: {
      recipient: 'Test Guest',
      building: 'Tokyo Station',
      city: 'Chiyoda-ku',
      state: 'Tokyo',
      postalCode: '100-0005',
    },
    sources: ['agid-address-quality'],
  }, {
    env: { OPERA_DRY_RUN: 'true' } as NodeJS.ProcessEnv,
  });

  assert.equal(result.ok, true);
  assert.equal(result.mode, 'dry-run');
  assert.equal(result.requestSummary.sourceSystem, 'AGID');
  assert.equal(result.requestSummary.addressLineCount > 0, true);
  assert.equal(result.requestSummary.countryCode, 'JP');
  assert.equal(result.requestSummary.postalCodePresent, true);
  assert.ok(result.warnings.some(warning => warning.includes('OPERA_DRY_RUN')));
  assert.ok(result.warnings.some(warning => warning.includes('OPERA_BASE_URL')));
  assert.doesNotMatch(JSON.stringify(result), /Test Guest|Tokyo Station|100-0005/);
});

test('Oracle OPERA payload keeps AGID address details in a stable hotel-PMS envelope', () => {
  resetOracleOperaRuntimeState();
  const payload = buildOracleOperaAddressPayload({
    agid: 'GB05HOTEL123',
    countryCode: 'GB',
    language: 'en',
    profileId: 'PROFILE-1',
    reservationId: 'RES-1',
    address: {
      recipient: 'Alex Smith',
      company: 'AGID Labs',
      building: 'Kings Cross Station',
      houseNumber: '1',
      street: 'Euston Road',
      city: 'London',
      postalCode: 'N1C 4TB',
    },
    coordinates: { lat: 51.5317, lon: -0.1246 },
    confidence: 0.88,
  }, { hotelId: 'HOTEL1' });

  assert.equal(payload.externalReferenceId, 'GB05HOTEL123');
  assert.equal(payload.profileId, 'PROFILE-1');
  assert.equal(payload.reservationId, 'RES-1');
  assert.equal(payload.hotelId, 'HOTEL1');
  assert.equal(payload.address.countryCode, 'GB');
  assert.equal(payload.address.coordinates?.lat, 51.5317);
  assert.ok(payload.address.lines.includes('Kings Cross Station'));
  assert.ok(payload.address.lines.includes('1 Euston Road'));
});

test('Oracle OPERA live sync requests OAuth token and posts to configured OHIP path', async () => {
  resetOracleOperaRuntimeState();
  const calls: Array<{ url: string; options?: RequestInit; retries?: number }> = [];
  const fetcher: OracleOperaFetch = async (url, options, _timeoutMs, retries) => {
    calls.push({ url, options, retries });
    if (url === 'https://id.example.test/oauth2/token') {
      return Response.json({ access_token: 'opera-token', expires_in: 3600 });
    }
    return Response.json({ accepted: true }, { status: 200 });
  };

  const result = await syncAddressToOracleOpera({
    agid: 'US05OPERA1',
    countryCode: 'US',
    language: 'en',
    profileId: 'P100',
    address: {
      recipient: 'Guest Name',
      line1: '1 Hotel Way',
      city: 'Orlando',
      state: 'FL',
      postalCode: '32830',
    },
  }, {
    fetcher,
    env: {
      OPERA_DRY_RUN: 'false',
      OPERA_BASE_URL: 'https://opera.example.test',
      OPERA_TOKEN_URL: 'https://id.example.test/oauth2/token',
      OPERA_CLIENT_ID: 'client-id',
      OPERA_CLIENT_SECRET: 'client-secret',
      OPERA_APP_KEY: 'app-key',
      OPERA_HOTEL_ID: 'HOTEL1',
      OPERA_ADDRESS_SYNC_PATH: '/ohip/v1/hotels/{hotelId}/profiles/{profileId}/addresses',
      OPERA_RETURN_RAW_RESPONSE: 'true',
      OPERA_SECRET_STORAGE: 'vault',
    } as NodeJS.ProcessEnv,
  });

  assert.equal(result.ok, true);
  assert.equal(result.mode, 'live');
  assert.equal(result.endpoint, 'https://opera.example.test/ohip/v1/hotels/HOTEL1/profiles/P100/addresses');
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://id.example.test/oauth2/token');
  assert.equal(calls[1].url, result.endpoint);
  const headers = calls[1].options?.headers as Record<string, string>;
  assert.equal(headers.Authorization, 'Bearer opera-token');
  assert.equal(headers['x-app-key'], 'app-key');
  assert.equal(headers['x-hotelid'], 'HOTEL1');
  assert.equal(headers['Cache-Control'], 'no-store');
  assert.equal(calls[1].retries, 0);
  assert.equal(JSON.parse(String(calls[1].options?.body)).profileAddress.address.postalCode, '32830');
  assert.equal(result.response?.bodyReturned, false);
  assert.equal(result.response?.bodyRedacted, true);
  assert.doesNotMatch(JSON.stringify(result), /Guest Name|1 Hotel Way|accepted/);
});

test('Oracle OPERA public config mask reports readiness without exposing secrets', () => {
  resetOracleOperaRuntimeState();
  const health = maskOracleOperaConfig({
    enabled: true,
    dryRun: false,
    endpointKind: 'profile-address',
    baseUrl: 'https://opera.example.test/ohip',
    tokenUrl: 'https://id.example.test/token',
    clientId: 'client',
    clientSecret: 'secret',
    appKey: 'app-key',
    hotelId: 'HOTEL1',
    addressSyncPath: '/profiles/{profileId}/addresses',
    addressSyncMethod: 'POST',
    timeoutMs: 15000,
    retries: 1,
    returnRawResponse: false,
    gatewayAllowlist: ['opera.example.test', 'id.example.test'],
    secretStorage: 'vault',
    allowedAddressTypes: ['HOME', 'BUSINESS', 'OTHER'],
    circuitBreakerFailureThreshold: 3,
    circuitBreakerCooldownMs: 60000,
  });

  assert.equal(health.liveWritesEnabled, true);
  assert.equal(health.baseUrlHost, 'opera.example.test');
  assert.deepEqual(health.missingEnvVars, []);
  assert.doesNotMatch(JSON.stringify(health), /"secret"|"client"|"app-key"/i);
  assert.equal(health.endpointKind, 'profile-address');
  assert.equal(health.secretStorage, 'vault');
});

test('Oracle OPERA headers include only configured OPERA routing metadata', () => {
  resetOracleOperaRuntimeState();
  const headers = buildOracleOperaHeaders({
    enabled: true,
    dryRun: false,
    endpointKind: 'profile-address',
    appKey: 'app-key',
    hotelId: 'HOTEL1',
    enterpriseId: 'ENT1',
    addressSyncMethod: 'POST',
    timeoutMs: 15000,
    retries: 1,
    returnRawResponse: false,
    gatewayAllowlist: [],
    secretStorage: 'vault',
    allowedAddressTypes: ['HOME', 'BUSINESS', 'OTHER'],
    circuitBreakerFailureThreshold: 3,
    circuitBreakerCooldownMs: 60000,
  }, 'token');

  assert.equal(headers.Authorization, 'Bearer token');
  assert.equal(headers['x-app-key'], 'app-key');
  assert.equal(headers['x-hotelid'], 'HOTEL1');
  assert.equal(headers['x-enterprise-id'], 'ENT1');
  assert.equal(headers['Cache-Control'], 'no-store');
});

test('Oracle OPERA 429 responses expose Retry-After and move the attempt to a redacted dead-letter record', async () => {
  resetOracleOperaRuntimeState();
  const fetcher: OracleOperaFetch = async (url) => {
    if (url === 'https://id.example.test/oauth2/token') {
      return Response.json({ access_token: 'opera-token', expires_in: 3600 });
    }
    return Response.json({ rawOracleError: 'do not expose' }, {
      status: 429,
      headers: { 'Retry-After': '45' },
    });
  };

  const result = await syncAddressToOracleOpera({
    agid: 'US05OPERA429',
    countryCode: 'US',
    language: 'en',
    profileId: 'P429',
    address: {
      line1: '1 Hotel Way',
      city: 'Orlando',
      state: 'FL',
      postalCode: '32830',
    },
  }, {
    fetcher,
    env: {
      OPERA_DRY_RUN: 'false',
      OPERA_BASE_URL: 'https://opera.example.test',
      OPERA_TOKEN_URL: 'https://id.example.test/oauth2/token',
      OPERA_CLIENT_ID: 'client-id',
      OPERA_CLIENT_SECRET: 'client-secret',
      OPERA_APP_KEY: 'app-key',
      OPERA_HOTEL_ID: 'HOTEL1',
      OPERA_SECRET_STORAGE: 'vault',
    } as NodeJS.ProcessEnv,
  });

  assert.equal(result.ok, false);
  assert.equal(result.errorCode, 'OPERA_RATE_LIMITED');
  assert.equal(result.response?.retryAfterSeconds, 45);
  assert.equal(result.deadLetter?.reasonCode, 'OPERA_RATE_LIMITED');
  assert.doesNotMatch(JSON.stringify(result), /rawOracleError|1 Hotel Way|32830/);
});
