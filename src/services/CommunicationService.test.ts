import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  evaluateAgidAoidCommunication,
  fetchExternalPosCapabilities,
  fetchCommunicationHealth,
  fetchOracleOperaIntegrationHealth,
  getAgidAoidCommunicationGovernanceModel,
  runExternalPosOperation,
  syncAddressToOracleOpera,
} from './CommunicationService';

test('communication health uses the standard AGID API result envelope', async () => {
  const calls: string[] = [];
  const result = await fetchCommunicationHealth(async (url) => {
    calls.push(String(url));
    return Response.json({
      ok: true,
      data: {
        rest: true,
        sse: true,
        localFirstSync: true,
        externalApiProxy: true,
        registrationAudit: true,
        aoidEncryptedSync: true,
        governanceModel: 'agid-aoid-governance-v1',
      },
      sources: ['agid-server'],
      warnings: [],
      requestId: 'req-1',
    });
  });

  assert.deepEqual(calls, ['/api/v1/communication/health']);
  assert.equal(result.ok, true);
  assert.equal(result.data?.rest, true);
  assert.equal(result.data?.sse, true);
  assert.equal(result.data?.registrationAudit, true);
  assert.equal(result.data?.aoidEncryptedSync, true);
  assert.equal(result.data?.governanceModel, 'agid-aoid-governance-v1');
  assert.deepEqual(result.sources, ['agid-server']);
});

test('communication service exposes AGID/AOID governance decisions', () => {
  const model = getAgidAoidCommunicationGovernanceModel();
  const publicAoid = evaluateAgidAoidCommunication({
    layer: 'AOID',
    surface: 'public-api',
    payload: {
      type: 'AOID',
      id: '05AV8TJGH8QZ6M2R',
      agid: 'JP05AV8TJGH8',
      publicHandle: 'aoid:05AV8TJGH8QZ6M2R',
      privacy: 'public-reference',
    },
  });
  const privateAoid = evaluateAgidAoidCommunication({
    layer: 'AOID',
    surface: 'public-api',
    payload: {
      type: 'AOID',
      id: '05AV8TJGH8QZ6M2R',
      recipient: 'Private Receiver',
      phone: '+81 3 0000 0000',
    },
  });

  assert.equal(model.AOID.defaultSurface, 'local-device');
  assert.equal(publicAoid.allowed, true);
  assert.equal(privateAoid.allowed, false);
});

test('Oracle OPERA integration health uses the standard AGID API result envelope', async () => {
  const calls: string[] = [];
  const result = await fetchOracleOperaIntegrationHealth(async (url) => {
    calls.push(String(url));
    return Response.json({
      ok: true,
      data: {
        adapterVersion: 'oracle-opera-ohip-adapter-v1',
        enabled: true,
        dryRun: true,
        credentialsConfigured: false,
        writePathConfigured: false,
        liveWritesEnabled: false,
        hotelIdConfigured: false,
        appKeyConfigured: false,
        supportedOperations: ['address-sync'],
        requiredEnvVars: [],
        optionalEnvVars: [],
        missingEnvVars: ['OPERA_BASE_URL'],
      },
      sources: ['oracle-opera-ohip-adapter'],
      warnings: [],
      requestId: 'req-opera-health',
    });
  });

  assert.deepEqual(calls, ['/api/v1/integrations/oracle-opera/health']);
  assert.equal(result.ok, true);
  assert.equal(result.data?.adapterVersion, 'oracle-opera-ohip-adapter-v1');
  assert.equal(result.data?.liveWritesEnabled, false);
});

test('external POS capabilities use the standard AGID API result envelope', async () => {
  const calls: string[] = [];
  const result = await fetchExternalPosCapabilities(async (url) => {
    calls.push(String(url));
    return Response.json({
      ok: true,
      data: {
        modelVersion: 'external-pos-integration-v1',
        serverConfigured: false,
        apis: [],
        importContract: {},
        privacyDefaults: {},
        operations: ['handoff-complete'],
      },
      sources: ['external-pos-integration-v1'],
      warnings: [],
      requestId: 'req-pos-capabilities',
    });
  });

  assert.deepEqual(calls, ['/api/v1/pos/external/capabilities']);
  assert.equal(result.ok, true);
  assert.equal(result.data?.modelVersion, 'external-pos-integration-v1');
});

test('external POS client posts operations to the integration endpoint', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const result = await runExternalPosOperation({
    operation: 'handoff-complete',
    posApiIds: ['store-pos'],
    receipt: { receiptId: 'receipt-1', status: 'accepted' },
  }, async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json({
      ok: true,
      data: {
        modelVersion: 'external-pos-integration-v1',
        operation: 'handoff-complete',
        attempted: 1,
        results: [{ ok: true, apiId: 'store-pos' }],
        privacy: {},
      },
      sources: ['external-pos-integration-v1'],
      warnings: [],
      requestId: 'req-pos-sync',
    });
  });

  assert.equal(calls[0].url, '/api/v1/pos/external/request');
  assert.equal(calls[0].init?.method, 'POST');
  assert.equal(JSON.parse(String(calls[0].init?.body)).operation, 'handoff-complete');
  assert.equal(result.ok, true);
  assert.equal(result.data?.attempted, 1);
});

test('Oracle OPERA address sync client posts AGID address payloads to the integration endpoint', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const result = await syncAddressToOracleOpera({
    agid: 'US05OPERA1',
    countryCode: 'US',
    language: 'en',
    address: {
      recipient: 'Guest Name',
      line1: '1 Hotel Way',
      city: 'Orlando',
      postalCode: '32830',
    },
  }, async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json({
      ok: true,
      data: {
        ok: true,
        mode: 'dry-run',
        operation: 'address-sync',
        adapterVersion: 'oracle-opera-ohip-adapter-v1',
        method: 'POST',
        requestBody: {},
        warnings: [],
        sources: ['oracle-opera-ohip-adapter'],
      },
      sources: ['oracle-opera-ohip-adapter'],
      warnings: [],
      requestId: 'req-opera-sync',
    });
  });

  assert.equal(calls[0].url, '/api/v1/integrations/oracle-opera/address');
  assert.equal(calls[0].init?.method, 'POST');
  assert.equal(JSON.parse(String(calls[0].init?.body)).agid, 'US05OPERA1');
  assert.equal(result.ok, true);
  assert.equal(result.data?.mode, 'dry-run');
});
