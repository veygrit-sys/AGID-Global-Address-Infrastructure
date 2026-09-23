import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  loadExternalPosRuntimeConfig,
  normalizeExternalPosManifest,
  normalizeExternalPosResponse,
  publicExternalPosProfile,
  runExternalPosOperation,
} from './externalPosIntegration';

test('external POS manifest accepts metadata-only provider adapters', () => {
  const result = normalizeExternalPosManifest({
    id: 'store-pos',
    providerId: 'store-pos',
    name: 'Store POS',
    adapter: 'agid-pos-json-v1',
    operations: ['handoff-complete', 'receipt-export'],
    supportedCountries: ['jp', 'us'],
    privacyMode: 'redacted-order',
    endpointId: 'store-pos-prod',
    dataRetention: 'ephemeral',
  });

  assert.equal(result.accepted, true);
  assert.equal(result.manifest?.id, 'store-pos');
  assert.deepEqual(result.manifest?.supportedCountries, ['JP', 'US']);
});

test('external POS manifest rejects URLs, secrets, and private customer material', () => {
  const result = normalizeExternalPosManifest({
    id: 'unsafe-pos',
    providerId: 'unsafe-pos',
    name: 'Unsafe POS',
    adapter: 'generic-json',
    operations: ['handoff-complete'],
    privacyMode: 'redacted-order',
    endpoint: 'https://pos.example/sync',
    token: 'secret',
    customer: { name: 'Private Receiver', phone: '+81-3-secret' },
    address: { street: 'Private Street 1' },
  });

  assert.equal(result.accepted, false);
  assert.match(result.errors.join('\n'), /endpoint/);
  assert.match(result.errors.join('\n'), /token/);
  assert.match(result.errors.join('\n'), /customer/);
  assert.match(result.errors.join('\n'), /address/);
});

test('runtime POS profiles redact endpoints and key env names', () => {
  const loaded = loadExternalPosRuntimeConfig(JSON.stringify([
    {
      id: 'store-pos',
      providerId: 'store-pos',
      name: 'Store POS',
      adapter: 'agid-pos-json-v1',
      operations: ['receipt-export'],
      privacyMode: 'receipt-only',
      endpoint: 'https://pos.example/receipt',
      apiKeyEnv: 'AGID_TEST_POS_KEY',
    },
  ]));

  assert.equal(loaded.errors.length, 0);
  assert.equal(loaded.apis.length, 1);
  const profile = publicExternalPosProfile(loaded.apis[0]);
  assert.equal('endpoint' in profile, false);
  assert.equal('apiKeyEnv' in profile, false);
  assert.equal(profile.serverConfigured, true);
});

test('POS integration response suppresses raw provider body unless explicitly allowed', () => {
  const suppressed = normalizeExternalPosResponse(
    { id: 'store-pos', providerId: 'store-pos', allowRawResponseReturn: true },
    'receipt-export',
    {
      ok: true,
      status: 'received',
      receiptId: 'receipt-1',
      customerPhone: '+81-3-secret',
    },
  );

  assert.equal(suppressed.rawResponseReturned, false);
  assert.equal(suppressed.rawResponse, undefined);
  assert.ok(suppressed.warnings.includes('raw-pos-response-suppressed'));

  const returned = normalizeExternalPosResponse(
    { id: 'store-pos', providerId: 'store-pos', allowRawResponseReturn: true },
    'receipt-export',
    { status: 'received' },
    true,
  );
  assert.equal(returned.rawResponseReturned, true);
  assert.deepEqual(returned.rawResponse, { status: 'received' });
});

test('POS integration runner sends redacted receipt and order payloads by default', async () => {
  const loaded = loadExternalPosRuntimeConfig(JSON.stringify([
    {
      id: 'store-pos',
      providerId: 'store-pos',
      name: 'Store POS',
      adapter: 'agid-pos-json-v1',
      operations: ['handoff-complete'],
      privacyMode: 'redacted-order',
      endpoint: 'https://pos.example/handoff',
    },
  ]));
  const calls: any[] = [];

  const result = await runExternalPosOperation({
    apis: loaded.apis,
    operation: 'handoff-complete',
    input: {
      receipt: {
        receiptId: 'receipt-1',
        accepted: true,
        status: 'accepted',
        channel: 'qr',
        terminalId: 'terminal-1',
        record: {
          recordType: 'ADDRESS',
          entityIdTail: 'TJGH8',
          agidTail: '8TJGH8',
          country: 'JP',
          city: 'Tokyo',
          postcode: '1000001',
          label: 'Address',
          rawPayloadStored: false,
        },
      },
      order: {
        orderId: 'order-1',
        customerName: 'Private Receiver',
        amount: 1200,
        currency: 'JPY',
      },
      customer: { name: 'Private Receiver', phone: '+81-3-secret' },
      address: {
        countryCode: 'JP',
        city: 'Tokyo',
        postcode: '1000001',
        street: 'Private Street 1',
        building: 'Private Building',
      },
    },
    fetcher: async (_url, options) => {
      calls.push(JSON.parse(String(options?.body ?? '{}')));
      return new Response(JSON.stringify({
        ok: true,
        status: 'synced',
        providerReference: 'pos-sync-1',
      }), { status: 200 });
    },
  });

  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].ok, true);
  assert.equal(calls[0].operation, 'handoff-complete');
  assert.equal(calls[0].customer, undefined);
  assert.equal(calls[0].recipient, undefined);
  assert.equal(calls[0].address, undefined);
  assert.equal(calls[0].order.customerName, undefined);
  assert.equal(calls[0].addressReference.city, 'Tokyo');
  assert.equal(calls[0].addressReference.postcode, '1000001');
  assert.equal(calls[0].addressReference.street, undefined);
});

test('plaintext POS APIs are skipped unless explicitly allowed', async () => {
  const loaded = loadExternalPosRuntimeConfig(JSON.stringify([
    {
      id: 'store-pos-plaintext',
      providerId: 'store-pos-plaintext',
      name: 'Store POS Plaintext',
      adapter: 'generic-json',
      operations: ['customer-note'],
      privacyMode: 'plaintext-address-required',
      endpoint: 'https://pos.example/customer-note',
    },
  ]));
  let called = false;
  const result = await runExternalPosOperation({
    apis: loaded.apis,
    operation: 'customer-note',
    input: {
      customer: { name: 'Private Receiver', phone: '+81-3-secret' },
      address: { street: 'Private Street 1' },
    },
    fetcher: async () => {
      called = true;
      return new Response('{}');
    },
  });

  assert.equal(called, false);
  assert.equal(result.results[0].ok, false);
  assert.match(result.warnings.join('\n'), /plaintext external POS calls were not explicitly allowed/);
});
