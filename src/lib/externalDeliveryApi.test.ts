import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  loadExternalDeliveryApiRuntimeConfig,
  normalizeExternalDeliveryApiManifest,
  normalizeExternalDeliveryApiResponse,
  publicExternalDeliveryApiProfile,
  runExternalDeliveryApiOperation,
} from './externalDeliveryApi';

test('external delivery API manifest accepts metadata-only carrier adapters', () => {
  const result = normalizeExternalDeliveryApiManifest({
    id: 'carrier-demo',
    carrierId: 'carrier-demo',
    name: 'Carrier Demo',
    adapter: 'agid-delivery-json-v1',
    operations: ['rate-quote', 'tracking', 'shipment-create'],
    supportedCountries: ['jp', 'us'],
    privacyMode: 'redacted-shipping',
    endpointId: 'carrier-demo-prod',
    dataRetention: 'ephemeral',
  });

  assert.equal(result.accepted, true);
  assert.equal(result.manifest?.id, 'carrier-demo');
  assert.deepEqual(result.manifest?.supportedCountries, ['JP', 'US']);
});

test('external delivery API manifest rejects URLs, secrets, and shipment payload fields', () => {
  const result = normalizeExternalDeliveryApiManifest({
    id: 'unsafe-carrier',
    carrierId: 'unsafe-carrier',
    name: 'Unsafe Carrier',
    adapter: 'generic-json',
    operations: ['shipment-create'],
    privacyMode: 'redacted-shipping',
    endpoint: 'https://carrier.example/ship',
    token: 'secret',
    recipient: { name: 'Private Receiver', phone: '+81-3-secret' },
    address: { street: 'Private Street 1' },
  });

  assert.equal(result.accepted, false);
  assert.match(result.errors.join('\n'), /endpoint/);
  assert.match(result.errors.join('\n'), /token/);
  assert.match(result.errors.join('\n'), /recipient/);
  assert.match(result.errors.join('\n'), /address/);
});

test('runtime delivery API profiles redact endpoints and key env names', () => {
  const loaded = loadExternalDeliveryApiRuntimeConfig(JSON.stringify([
    {
      id: 'carrier-demo',
      carrierId: 'carrier-demo',
      name: 'Carrier Demo',
      adapter: 'agid-delivery-json-v1',
      operations: ['tracking'],
      privacyMode: 'commitment-only',
      endpoint: 'https://carrier.example/track',
      apiKeyEnv: 'AGID_TEST_CARRIER_KEY',
    },
  ]));

  assert.equal(loaded.errors.length, 0);
  assert.equal(loaded.apis.length, 1);
  const profile = publicExternalDeliveryApiProfile(loaded.apis[0]);
  assert.equal('endpoint' in profile, false);
  assert.equal('apiKeyEnv' in profile, false);
  assert.equal(profile.serverConfigured, true);
});

test('delivery API response suppresses raw label payload unless explicitly allowed', () => {
  const suppressed = normalizeExternalDeliveryApiResponse(
    { id: 'carrier-demo', carrierId: 'carrier-demo', allowRawLabelPayloadReturn: true },
    'shipment-create',
    {
      ok: true,
      status: 'accepted',
      shipmentId: 'ship-123',
      trackingNumber: 'TRK123',
      label: {
        format: 'pdf',
        payload: 'base64-private-label',
      },
    },
  );

  assert.equal(suppressed.label?.rawPayloadReturned, false);
  assert.equal(suppressed.label?.payload, undefined);
  assert.ok(suppressed.warnings.includes('raw-label-payload-suppressed'));

  const returned = normalizeExternalDeliveryApiResponse(
    { id: 'carrier-demo', carrierId: 'carrier-demo', allowRawLabelPayloadReturn: true },
    'shipment-create',
    { label: { format: 'pdf', payload: 'base64-private-label' } },
    true,
  );
  assert.equal(returned.label?.rawPayloadReturned, true);
  assert.equal(returned.label?.payload, 'base64-private-label');
});

test('delivery API runner sends redacted shipment payloads by default', async () => {
  const loaded = loadExternalDeliveryApiRuntimeConfig(JSON.stringify([
    {
      id: 'carrier-demo',
      carrierId: 'carrier-demo',
      name: 'Carrier Demo',
      adapter: 'agid-delivery-json-v1',
      operations: ['shipment-create'],
      privacyMode: 'redacted-shipping',
      endpoint: 'https://carrier.example/ship',
    },
  ]));
  const calls: any[] = [];

  const result = await runExternalDeliveryApiOperation({
    apis: loaded.apis,
    operation: 'shipment-create',
    input: {
      waybillAlias: 'WBA-123456789ABC',
      addressReferenceCommitment: 'addr-ref-commitment',
      recipient: { name: 'Private Receiver', phone: '+81-3-secret' },
      destination: {
        countryCode: 'JP',
        state: 'Tokyo',
        city: 'Chiyoda',
        street: 'Marunouchi',
        houseNumber: '1-9-1',
        postcode: '1000005',
      },
      parcel: { weightGrams: 500, declaredValue: 1200, currency: 'JPY' },
    },
    fetcher: async (_url, options) => {
      calls.push(JSON.parse(String(options?.body ?? '{}')));
      return new Response(JSON.stringify({
        ok: true,
        status: 'accepted',
        shipmentId: 'ship-123',
        trackingNumber: 'TRK123',
      }), { status: 200 });
    },
  });

  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].ok, true);
  assert.equal(calls[0].recipient, undefined);
  assert.equal(calls[0].destination.street, undefined);
  assert.equal(calls[0].destination.houseNumber, undefined);
  assert.equal(calls[0].destination.city, 'Chiyoda');
  assert.equal(calls[0].parcel.weightGrams, 500);
});

test('delivery API runner sends special destination metadata without private hotel or baggage details', async () => {
  const loaded = loadExternalDeliveryApiRuntimeConfig(JSON.stringify([
    {
      id: 'carrier-resort',
      carrierId: 'carrier-resort',
      name: 'Carrier Resort',
      adapter: 'agid-delivery-json-v1',
      operations: ['shipment-create'],
      privacyMode: 'redacted-shipping',
      endpoint: 'https://carrier.example/resort',
    },
  ]));
  const calls: any[] = [];

  const result = await runExternalDeliveryApiOperation({
    apis: loaded.apis,
    operation: 'shipment-create',
    input: {
      waybillAlias: 'WBA-SPORTS-1',
      addressReferenceCommitment: 'addr-ref-commitment',
      recipient: { name: 'Private Hotel Guest', phone: '+81-3-secret' },
      destination: {
        countryCode: 'JP',
        state: 'Hokkaido',
        city: 'Kutchan',
        street: 'Private hotel street',
        placeLabel: 'Niseko ski resort lodge',
      },
      destinationProfile: {
        destinationKind: 'ski-resort',
        parcelKind: 'ski-equipment',
        handoffPoint: 'rental counter',
        bookingReference: 'PRIVATE-BOOKING-123',
      },
      parcel: { weightGrams: 12000, contentsCategory: 'ski-equipment' },
    },
    fetcher: async (_url, options) => {
      calls.push(JSON.parse(String(options?.body ?? '{}')));
      return new Response(JSON.stringify({ ok: true, shipmentId: 'ship-ski-1' }), { status: 200 });
    },
  });

  assert.equal(result.results[0].ok, true);
  assert.equal(calls[0].specialDelivery.destinationKind, 'ski-resort');
  assert.equal(calls[0].specialDelivery.parcelKind, 'ski-equipment');
  assert.equal(calls[0].specialDelivery.handoffPoint, 'rental-counter');
  assert.ok(calls[0].specialDelivery.requiredSkills.includes('ski-equipment-handling'));
  assert.ok(calls[0].specialDelivery.specialHandlingCodes.includes('seasonal-road-status-required'));
  assert.equal(calls[0].recipient, undefined);
  assert.equal(calls[0].destination.street, undefined);
  assert.doesNotMatch(JSON.stringify(calls[0]), /Private Hotel Guest|PRIVATE-BOOKING-123|Private hotel street/);
});

test('plaintext carrier APIs are skipped unless explicitly allowed', async () => {
  const loaded = loadExternalDeliveryApiRuntimeConfig(JSON.stringify([
    {
      id: 'carrier-plaintext',
      carrierId: 'carrier-plaintext',
      name: 'Carrier Plaintext',
      adapter: 'generic-json',
      operations: ['shipment-create'],
      privacyMode: 'plaintext-shipping-required',
      endpoint: 'https://carrier.example/ship',
    },
  ]));
  let called = false;
  const result = await runExternalDeliveryApiOperation({
    apis: loaded.apis,
    operation: 'shipment-create',
    input: {
      recipient: { name: 'Private Receiver', phone: '+81-3-secret' },
      destination: { street: 'Private Street 1' },
    },
    fetcher: async () => {
      called = true;
      return new Response('{}');
    },
  });

  assert.equal(called, false);
  assert.equal(result.results[0].ok, false);
  assert.match(result.warnings.join('\n'), /plaintext external delivery API calls were not explicitly allowed/);
});
