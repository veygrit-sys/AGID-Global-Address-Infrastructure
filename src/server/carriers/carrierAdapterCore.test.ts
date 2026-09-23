import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CarrierAdapterCoreError,
  createAmazonShippingCarrierAdapter,
  createCourierGuyCarrierAdapter,
  createDelhiveryCarrierAdapter,
  createExpandedAmericasCarrierAdapter,
  createExpandedAfricaCarrierAdapter,
  createExpandedMenaCarrierAdapter,
  createExpandedPrivateAsiaCarrierAdapter,
  createExpandedPrivateEuropeCarrierAdapter,
  createExpandedPrivateGreaterChinaCarrierAdapter,
  createExpandedAsiaPacificCarrierAdapter,
  createExpandedEuropeCarrierAdapter,
  createFourPxCarrierAdapter,
  createInPostCarrierAdapter,
  createLoggiCarrierAdapter,
  createNinjaVanCarrierAdapter,
  createOfficialCarrierAdapterRegistry,
  createPargoCarrierAdapter,
  createRoyalMailCarrierAdapter,
  createSfExpressCarrierAdapter,
  createUpsCarrierAdapter,
} from './carrierAdapterCore';
import {
  ExpandedAmericasConnector,
  type ExpandedAmericasCarrierId,
} from './americas/expandedAmericasConnector';
import {
  ExpandedEuropeConnector,
  type ExpandedEuropeCarrierId,
} from './europe/expandedEuropeConnector';
import {
  ExpandedAsiaPacificConnector,
  type ExpandedAsiaPacificCarrierId,
} from './asia/expandedAsiaPacificConnector';
import {
  ExpandedAfricaConnector,
  type ExpandedAfricaCarrierId,
} from './africa/expandedAfricaConnector';
import {
  ExpandedMenaConnector,
  type ExpandedMenaCarrierId,
} from './mena/expandedMenaConnector';
import {
  ExpandedPrivateAsiaConnector,
  type ExpandedPrivateAsiaCarrierId,
} from './asia/expandedPrivateAsiaConnector';
import {
  ExpandedPrivateEuropeConnector,
  type ExpandedPrivateEuropeCarrierId,
} from './europe/expandedPrivateEuropeConnector';
import {
  ExpandedPrivateGreaterChinaConnector,
  type ExpandedPrivateGreaterChinaCarrierId,
} from './greaterChina/expandedPrivateGreaterChinaConnector';

const connection = { id: 'carrier_connection_sandbox_ups', carrier: 'ups' as const, environment: 'sandbox' as const, secretRef: 'secret-ref://carrier/ups/sandbox' };

test('official registry publishes capabilities without exposing credentials or enabling production', () => {
  const registry = createOfficialCarrierAdapterRegistry();
  const fedex = registry.list().find(adapter => adapter.id === 'fedex');
  assert.deepEqual(Object.keys(fedex ?? {}).sort(), ['capabilities', 'id', 'productionTrafficDefault', 'serverSideOnly', 'status']);
  assert.equal(fedex?.status, 'planned');
  assert.equal(fedex?.productionTrafficDefault, false);
  assert.equal(JSON.stringify(registry.list()).includes('secretRef'), false);
});

test('planned adapters are never a fabricated carrier success', async () => {
  const registry = createOfficialCarrierAdapterRegistry();
  await assert.rejects(
    registry.get('fedex').execute({ operation: 'rate', connection: { ...connection, carrier: 'fedex' }, requestId: 'req-fedex', serverPayload: {} }),
    (error: unknown) => error instanceof CarrierAdapterCoreError && error.code === 'adapter_not_configured',
  );
});

test('live UPS adapter requires an idempotency key and rejects credential-shaped payloads', async () => {
  const connector = {
    validateAddress: async () => ({ requestId: 'ups-1', status: 200, data: {} }),
    getRates: async () => ({ requestId: 'ups-1', status: 200, data: {} }),
    createShipment: async () => ({ requestId: 'ups-1', status: 200, data: {} }),
    track: async () => ({ requestId: 'ups-1', status: 200, data: {} }),
    voidShipment: async () => ({ requestId: 'ups-1', status: 200, data: {} }),
  } as never;
  const adapter = createUpsCarrierAdapter(connector);
  await assert.rejects(
    adapter.execute({ operation: 'shipment', connection, requestId: 'req-1', serverPayload: {} }),
    (error: unknown) => error instanceof CarrierAdapterCoreError && error.code === 'idempotency_key_required',
  );
  await assert.rejects(
    adapter.execute({ operation: 'rate', connection, requestId: 'req-2', serverPayload: { clientSecret: 'never-accepted' } }),
    (error: unknown) => error instanceof CarrierAdapterCoreError && error.code === 'unsafe_input_rejected',
  );
});

test('Americas official adapters are available through the same server-only registry', async () => {
  const amazon = createAmazonShippingCarrierAdapter({
    getRates: async () => ({ carrier: 'amazon_shipping', operation: 'rate', requestId: 'amazon-1', status: 200, data: { rates: [] }, retryable: false, outcomeUnknown: false }),
    purchaseShipment: async () => ({ carrier: 'amazon_shipping', operation: 'shipment', requestId: 'amazon-2', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    cancelShipment: async () => ({ carrier: 'amazon_shipping', operation: 'void', requestId: 'amazon-3', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    getTracking: async () => ({ carrier: 'amazon_shipping', operation: 'tracking', requestId: 'amazon-4', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
  } as never);
  const loggi = createLoggiCarrierAdapter({
    getRates: async () => ({ carrier: 'loggi', operation: 'rate', requestId: 'loggi-1', status: 200, data: { quotations: [] }, retryable: false, outcomeUnknown: false }),
    createShipment: async () => ({ carrier: 'loggi', operation: 'shipment', requestId: 'loggi-2', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    cancelShipment: async () => ({ carrier: 'loggi', operation: 'void', requestId: 'loggi-3', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    track: async () => ({ carrier: 'loggi', operation: 'tracking', requestId: 'loggi-4', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
  } as never);
  const registry = createOfficialCarrierAdapterRegistry({ amazon_shipping: amazon, loggi });

  const amazonResult = await registry.get('amazon_shipping').execute({
    operation: 'rate', requestId: 'req-amazon', connection: { id: 'conn-amazon', carrier: 'amazon_shipping', environment: 'sandbox', secretRef: 'secretref_amazon_001' }, serverPayload: { shipment: 'server-created' },
  });
  const loggiResult = await registry.get('loggi').execute({
    operation: 'rate', requestId: 'req-loggi', connection: { id: 'conn-loggi', carrier: 'loggi', environment: 'sandbox', secretRef: 'secretref_loggi_001' }, serverPayload: { shipment: 'server-created' },
  });
  assert.equal(amazonResult.carrier, 'amazon_shipping');
  assert.equal(loggiResult.carrier, 'loggi');
  assert.equal(registry.list().find(item => item.id === 'amazon_shipping')?.status, 'available');
  assert.equal(registry.list().find(item => item.id === 'loggi')?.serverSideOnly, true);
});

test('European official adapters are available through the same server-only registry', async () => {
  const royalMail = createRoyalMailCarrierAdapter({
    createShipment: async () => ({ carrier: 'royal_mail', operation: 'shipment', requestId: 'rm-1', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    getLabel: async () => ({ carrier: 'royal_mail', operation: 'label', requestId: 'rm-label', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    cancelShipment: async () => ({ carrier: 'royal_mail', operation: 'void', requestId: 'rm-2', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    track: async () => ({ carrier: 'royal_mail', operation: 'tracking', requestId: 'rm-3', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    createManifest: async () => ({ carrier: 'royal_mail', operation: 'manifest', requestId: 'rm-4', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
  } as never);
  const inpost = createInPostCarrierAdapter({
    createShipment: async () => ({ carrier: 'inpost', operation: 'shipment', requestId: 'inpost-1', status: 201, data: {}, retryable: false, outcomeUnknown: false }),
    getLabel: async () => ({ carrier: 'inpost', operation: 'label', requestId: 'inpost-label', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    getShipment: async () => ({ carrier: 'inpost', operation: 'tracking', requestId: 'inpost-2', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
  } as never);
  const registry = createOfficialCarrierAdapterRegistry({ royal_mail: royalMail, inpost });

  const royalResult = await registry.get('royal_mail').execute({
    operation: 'tracking', requestId: 'req-rm', connection: { id: 'conn-rm', carrier: 'royal_mail', environment: 'sandbox', secretRef: 'secretref_royal_mail_001' }, serverPayload: { mailPieceId: 'synthetic' },
  });
  const inpostResult = await registry.get('inpost').execute({
    operation: 'label', requestId: 'req-inpost', connection: { id: 'conn-inpost', carrier: 'inpost', environment: 'sandbox', secretRef: 'secretref_inpost_001' }, serverPayload: { trackingNumber: 'synthetic' },
  });
  assert.equal(royalResult.carrier, 'royal_mail');
  assert.equal(inpostResult.carrier, 'inpost');
  assert.equal(registry.list().find(item => item.id === 'royal_mail')?.status, 'available');
  assert.equal(registry.list().find(item => item.id === 'inpost')?.serverSideOnly, true);
});

test('Asian official adapters are available through the same server-only registry', async () => {
  const ninjaVan = createNinjaVanCarrierAdapter({
    createOrder: async () => ({ carrier: 'ninja_van', operation: 'shipment', requestId: 'ninja-1', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    cancelOrder: async () => ({ carrier: 'ninja_van', operation: 'void', requestId: 'ninja-2', status: 204, data: {}, retryable: false, outcomeUnknown: false }),
  } as never);
  const delhivery = createDelhiveryCarrierAdapter({
    getRates: async () => ({ carrier: 'delhivery', operation: 'rate', requestId: 'delhivery-1', status: 200, data: [], retryable: false, outcomeUnknown: false }),
    createShipment: async () => ({ carrier: 'delhivery', operation: 'shipment', requestId: 'delhivery-2', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    getLabel: async () => ({ carrier: 'delhivery', operation: 'label', requestId: 'delhivery-3', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    track: async () => ({ carrier: 'delhivery', operation: 'tracking', requestId: 'delhivery-4', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
  } as never);
  const registry = createOfficialCarrierAdapterRegistry({ ninja_van: ninjaVan, delhivery });

  const ninjaResult = await registry.get('ninja_van').execute({
    operation: 'shipment',
    requestId: 'req-ninja',
    idempotencyKey: 'idem-ninja',
    connection: { id: 'conn-ninja', carrier: 'ninja_van', environment: 'sandbox', secretRef: 'secretref_ninja_van_001' },
    serverPayload: { requested_tracking_number: 'synthetic' },
  });
  const delhiveryResult = await registry.get('delhivery').execute({
    operation: 'tracking',
    requestId: 'req-delhivery',
    connection: { id: 'conn-delhivery', carrier: 'delhivery', environment: 'sandbox', secretRef: 'secretref_delhivery_001' },
    serverPayload: { waybill: 'synthetic' },
  });

  assert.equal(ninjaResult.carrier, 'ninja_van');
  assert.equal(delhiveryResult.carrier, 'delhivery');
  assert.equal(registry.list().find(item => item.id === 'ninja_van')?.status, 'available');
  assert.equal(registry.list().find(item => item.id === 'delhivery')?.serverSideOnly, true);
});

test('African official adapters are available through the same server-only registry', async () => {
  const pargo = createPargoCarrierAdapter({
    getQuotation: async () => ({ carrier: 'pargo', operation: 'rate', requestId: 'pargo-1', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    createOrder: async (_payload: unknown, operation = 'shipment') => ({ carrier: 'pargo', operation, requestId: 'pargo-2', status: 201, data: {}, retryable: false, outcomeUnknown: false }),
    cancelOrder: async () => ({ carrier: 'pargo', operation: 'void', requestId: 'pargo-3', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    getLabel: async () => ({ carrier: 'pargo', operation: 'label', requestId: 'pargo-4', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
  } as never);
  const courierGuy = createCourierGuyCarrierAdapter({
    getRates: async () => ({ carrier: 'courier_guy', operation: 'rate', requestId: 'tcg-1', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    createShipment: async (_payload: unknown, operation = 'shipment') => ({ carrier: 'courier_guy', operation, requestId: 'tcg-2', status: 201, data: {}, retryable: false, outcomeUnknown: false }),
    track: async () => ({ carrier: 'courier_guy', operation: 'tracking', requestId: 'tcg-3', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    getLabel: async () => ({ carrier: 'courier_guy', operation: 'label', requestId: 'tcg-4', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
  } as never);
  const registry = createOfficialCarrierAdapterRegistry({ pargo, courier_guy: courierGuy });

  const pargoResult = await registry.get('pargo').execute({
    operation: 'shipment',
    requestId: 'req-pargo',
    idempotencyKey: 'idem-pargo',
    connection: { id: 'conn-pargo', carrier: 'pargo', environment: 'sandbox', secretRef: 'secretref_pargo_001' },
    serverPayload: { data: { type: 'W2P' } },
  });
  const courierGuyResult = await registry.get('courier_guy').execute({
    operation: 'tracking',
    requestId: 'req-tcg',
    connection: { id: 'conn-tcg', carrier: 'courier_guy', environment: 'sandbox', secretRef: 'secretref_courier_guy_001' },
    serverPayload: { trackingReference: 'synthetic' },
  });

  assert.equal(pargoResult.carrier, 'pargo');
  assert.equal(courierGuyResult.carrier, 'courier_guy');
  assert.equal(registry.list().find(item => item.id === 'pargo')?.status, 'available');
  assert.equal(registry.list().find(item => item.id === 'courier_guy')?.serverSideOnly, true);
});

test('Greater China official adapters are available through the same server-only registry', async () => {
  const sfExpress = createSfExpressCarrierAdapter({
    getFreight: async () => ({ carrier: 'sf_express', operation: 'rate', requestId: 'sf-1', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    createOrder: async () => ({ carrier: 'sf_express', operation: 'shipment', requestId: 'sf-2', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    cancelOrder: async () => ({ carrier: 'sf_express', operation: 'void', requestId: 'sf-3', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    track: async () => ({ carrier: 'sf_express', operation: 'tracking', requestId: 'sf-4', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
  } as never);
  const fourPx = createFourPxCarrierAdapter({
    getRates: async () => ({ carrier: 'four_px', operation: 'rate', requestId: '4px-1', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    createOrder: async () => ({ carrier: 'four_px', operation: 'shipment', requestId: '4px-2', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    cancelOrder: async () => ({ carrier: 'four_px', operation: 'void', requestId: '4px-3', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    track: async () => ({ carrier: 'four_px', operation: 'tracking', requestId: '4px-4', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
    getLabel: async () => ({ carrier: 'four_px', operation: 'label', requestId: '4px-5', status: 200, data: {}, retryable: false, outcomeUnknown: false }),
  } as never);
  const registry = createOfficialCarrierAdapterRegistry({ sf_express: sfExpress, four_px: fourPx });

  const sfResult = await registry.get('sf_express').execute({
    operation: 'tracking',
    requestId: 'req-sf',
    connection: { id: 'conn-sf', carrier: 'sf_express', environment: 'sandbox', secretRef: 'secretref_sf_express_001' },
    serverPayload: { trackingType: '1', trackingNumber: ['synthetic'] },
  });
  const fourPxResult = await registry.get('four_px').execute({
    operation: 'label',
    requestId: 'req-4px',
    connection: { id: 'conn-4px', carrier: 'four_px', environment: 'sandbox', secretRef: 'secretref_four_px_001' },
    serverPayload: { ref_no: 'synthetic' },
  });

  assert.equal(sfResult.carrier, 'sf_express');
  assert.equal(fourPxResult.carrier, 'four_px');
  assert.equal(registry.list().find(item => item.id === 'sf_express')?.status, 'available');
  assert.equal(registry.list().find(item => item.id === 'four_px')?.serverSideOnly, true);
  await assert.rejects(
    registry.get('four_px').execute({
      operation: 'label',
      requestId: 'req-unsafe-4px',
      connection: { id: 'conn-4px', carrier: 'four_px', environment: 'sandbox', secretRef: 'secretref_four_px_001' },
      serverPayload: { appSecret: 'must-not-come-from-browser' },
    }),
    (error: unknown) => error instanceof CarrierAdapterCoreError && error.code === 'unsafe_input_rejected',
  );
});

test('twelve expanded Americas carriers share the official server-only registry boundary', async () => {
  const carrierOperations: Record<ExpandedAmericasCarrierId, 'rate' | 'shipment'> = {
    chilexpress: 'rate',
    coordinadora: 'shipment',
    oca: 'rate',
    ninety_nine_minutos: 'rate',
    redpack: 'shipment',
    estafeta: 'shipment',
    jadlog: 'rate',
    total_express: 'rate',
    roadie: 'rate',
    andreani: 'rate',
    servientrega: 'shipment',
    blue_express: 'rate',
  };
  const adapters = Object.fromEntries(
    Object.entries(carrierOperations).map(([carrier, operation]) => {
      const id = carrier as ExpandedAmericasCarrierId;
      const connector = new ExpandedAmericasConnector({
        carrier: id,
        environment: 'sandbox',
        baseUrl: `https://${id.replaceAll('_', '-')}.sandbox.example`,
        auth: { type: 'api_key', headerName: 'x-test-key', value: 'synthetic-key' },
        routes: { [operation]: { method: 'POST', path: '/official', safeToRetry: operation === 'rate' } },
      }, {
        requestId: () => `${id}-request`,
        fetch: async () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }),
      });
      return [id, createExpandedAmericasCarrierAdapter(id, connector)];
    }),
  );
  const registry = createOfficialCarrierAdapterRegistry(adapters);

  for (const [carrier, operation] of Object.entries(carrierOperations)) {
    const result = await registry.get(carrier as ExpandedAmericasCarrierId).execute({
      operation,
      requestId: `${carrier}-core-request`,
      idempotencyKey: operation === 'shipment' ? `${carrier}-idempotency` : undefined,
      connection: {
        id: `${carrier}-connection`,
        carrier: carrier as ExpandedAmericasCarrierId,
        environment: 'sandbox',
        secretRef: `secretref_${carrier}_001`,
      },
      serverPayload: { reference: 'server-created' },
    });
    assert.equal(result.carrier, carrier);
    assert.equal(registry.list().find(item => item.id === carrier)?.status, 'available');
  }

  await assert.rejects(
    registry.get('roadie').execute({
      operation: 'rate',
      requestId: 'roadie-unsafe',
      connection: { id: 'roadie-connection', carrier: 'roadie', environment: 'sandbox', secretRef: 'secretref_roadie_001' },
      serverPayload: { accessToken: 'must-never-come-from-browser' },
    }),
    (error: unknown) => error instanceof CarrierAdapterCoreError && error.code === 'unsafe_input_rejected',
  );
});

test('eight expanded Europe carriers share the official server-only registry boundary', async () => {
  const carrierOperations: Record<ExpandedEuropeCarrierId, 'tracking' | 'shipment' | 'pickup_point'> = {
    gls: 'tracking',
    dpd: 'pickup_point',
    hermes_de: 'tracking',
    paack: 'tracking',
    mondial_relay: 'pickup_point',
    packeta: 'tracking',
    dsv: 'tracking',
    geodis: 'shipment',
  };
  const adapters = Object.fromEntries(
    Object.entries(carrierOperations).map(([carrier, operation]) => {
      const id = carrier as ExpandedEuropeCarrierId;
      const connector = new ExpandedEuropeConnector({
        carrier: id,
        environment: 'sandbox',
        baseUrl: `https://${id.replaceAll('_', '-')}.sandbox.example`,
        auth: { type: 'api_key', headerName: 'x-test-key', value: 'synthetic-key' },
        routes: { [operation]: { method: 'POST', path: '/official', safeToRetry: operation !== 'shipment' } },
      }, {
        requestId: () => `${id}-request`,
        fetch: async () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }),
      });
      return [id, createExpandedEuropeCarrierAdapter(id, connector)];
    }),
  );
  const registry = createOfficialCarrierAdapterRegistry(adapters);

  for (const [carrier, operation] of Object.entries(carrierOperations)) {
    const result = await registry.get(carrier as ExpandedEuropeCarrierId).execute({
      operation,
      requestId: `${carrier}-core-request`,
      idempotencyKey: operation === 'shipment' ? `${carrier}-idempotency` : undefined,
      connection: {
        id: `${carrier}-connection`,
        carrier: carrier as ExpandedEuropeCarrierId,
        environment: 'sandbox',
        secretRef: `secretref_${carrier}_001`,
      },
      serverPayload: { reference: 'server-created' },
    });
    assert.equal(result.carrier, carrier);
    assert.equal(registry.list().find(item => item.id === carrier)?.status, 'available');
  }

});

test('five expanded Asia-Pacific carriers share the official server-only registry boundary', async () => {
  const carrierOperations: Record<ExpandedAsiaPacificCarrierId, 'rate' | 'shipment' | 'tracking' | 'pickup_point'> = {
    lalamove: 'rate',
    aramex_anz: 'shipment',
    nz_couriers: 'pickup_point',
    jt_express: 'tracking',
    yamato: 'shipment',
  };
  const adapters = Object.fromEntries(
    Object.entries(carrierOperations).map(([carrier, operation]) => {
      const id = carrier as ExpandedAsiaPacificCarrierId;
      const connector = new ExpandedAsiaPacificConnector({
        carrier: id,
        environment: 'sandbox',
        baseUrl: `https://${id.replaceAll('_', '-')}.sandbox.example`,
        auth: { type: 'api_key', headerName: 'x-test-key', value: 'synthetic-key' },
        routes: { [operation]: { method: 'POST', path: '/official', safeToRetry: operation !== 'shipment' } },
      }, {
        requestId: () => `${id}-request`,
        fetch: async () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }),
      });
      return [id, createExpandedAsiaPacificCarrierAdapter(id, connector)];
    }),
  );
  const registry = createOfficialCarrierAdapterRegistry(adapters);

  for (const [carrier, operation] of Object.entries(carrierOperations)) {
    const result = await registry.get(carrier as ExpandedAsiaPacificCarrierId).execute({
      operation,
      requestId: `${carrier}-core-request`,
      idempotencyKey: operation === 'shipment' ? `${carrier}-idempotency` : undefined,
      connection: {
        id: `${carrier}-connection`,
        carrier: carrier as ExpandedAsiaPacificCarrierId,
        environment: 'sandbox',
        secretRef: `secretref_${carrier}_001`,
      },
      serverPayload: { reference: 'server-created' },
    });
    assert.equal(result.carrier, carrier);
    assert.equal(registry.list().find(item => item.id === carrier)?.status, 'available');
  }

  await assert.rejects(
    registry.get('lalamove').execute({
      operation: 'rate',
      requestId: 'lalamove-unsafe',
      connection: { id: 'lalamove-connection', carrier: 'lalamove', environment: 'sandbox', secretRef: 'secretref_lalamove_001' },
      serverPayload: { apiSecret: 'must-never-come-from-browser' },
    }),
    (error: unknown) => error instanceof CarrierAdapterCoreError && error.code === 'unsafe_input_rejected',
  );
});

test('eight expanded African carriers share the official server-only registry boundary', async () => {
  const carrierOperations: Record<
    ExpandedAfricaCarrierId,
    'rate' | 'shipment' | 'tracking' | 'eta'
  > = {
    collivery: 'rate',
    ram_couriers: 'shipment',
    lilwa_delivery: 'eta',
    fez_delivery: 'tracking',
    haulstow: 'rate',
    kwik_delivery: 'shipment',
    gigl: 'rate',
    dodo_tanzania: 'tracking',
  };
  const adapters = Object.fromEntries(
    Object.entries(carrierOperations).map(([carrier, operation]) => {
      const id = carrier as ExpandedAfricaCarrierId;
      const connector = new ExpandedAfricaConnector({
        carrier: id,
        environment: 'sandbox',
        baseUrl: `https://${id.replaceAll('_', '-')}.sandbox.example`,
        auth: { type: 'api_key', headerName: 'x-test-key', value: 'synthetic-key' },
        routes: { [operation]: { method: 'POST', path: '/official', safeToRetry: operation !== 'shipment' } },
      }, {
        requestId: () => `${id}-request`,
        fetch: async () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }),
      });
      return [id, createExpandedAfricaCarrierAdapter(id, connector)];
    }),
  );
  const registry = createOfficialCarrierAdapterRegistry(adapters);

  for (const [carrier, operation] of Object.entries(carrierOperations)) {
    const result = await registry.get(carrier as ExpandedAfricaCarrierId).execute({
      operation,
      requestId: `${carrier}-core-request`,
      idempotencyKey: operation === 'shipment' ? `${carrier}-idempotency` : undefined,
      connection: {
        id: `${carrier}-connection`,
        carrier: carrier as ExpandedAfricaCarrierId,
        environment: 'sandbox',
        secretRef: `secretref_${carrier}_001`,
      },
      serverPayload: { reference: 'server-created' },
    });
    assert.equal(result.carrier, carrier);
    assert.equal(registry.list().find(item => item.id === carrier)?.status, 'available');
  }

  await assert.rejects(
    registry.get('collivery').execute({
      operation: 'rate',
      requestId: 'collivery-unsafe',
      connection: { id: 'collivery-connection', carrier: 'collivery', environment: 'sandbox', secretRef: 'secretref_collivery_001' },
      serverPayload: { apiToken: 'must-never-come-from-browser' },
    }),
    (error: unknown) => error instanceof CarrierAdapterCoreError && error.code === 'unsafe_input_rejected',
  );
});

test('six MENA carriers share the official server-only registry boundary', async () => {
  const carrierOperations: Record<ExpandedMenaCarrierId, 'rate' | 'shipment' | 'tracking'> = {
    aramex_mena: 'rate',
    smsa_express: 'tracking',
    naqel_express: 'shipment',
    emirates_post: 'rate',
    bosta: 'shipment',
    mylerz: 'tracking',
  };
  const adapters = Object.fromEntries(
    Object.entries(carrierOperations).map(([carrier, operation]) => {
      const id = carrier as ExpandedMenaCarrierId;
      const connector = new ExpandedMenaConnector({
        carrier: id,
        environment: 'sandbox',
        baseUrl: `https://${id.replaceAll('_', '-')}.sandbox.example`,
        auth: { type: 'api_key', headerName: 'x-test-key', value: 'synthetic-key' },
        routes: { [operation]: { method: 'POST', path: '/official', safeToRetry: operation !== 'shipment' } },
      }, {
        requestId: () => `${id}-request`,
        fetch: async () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } }),
      });
      return [id, createExpandedMenaCarrierAdapter(id, connector)];
    }),
  );
  const registry = createOfficialCarrierAdapterRegistry(adapters);

  for (const [carrier, operation] of Object.entries(carrierOperations)) {
    const result = await registry.get(carrier as ExpandedMenaCarrierId).execute({
      operation,
      requestId: `${carrier}-core-request`,
      idempotencyKey: operation === 'shipment' ? `${carrier}-idempotency` : undefined,
      connection: {
        id: `${carrier}-connection`,
        carrier: carrier as ExpandedMenaCarrierId,
        environment: 'sandbox',
        secretRef: `secretref_${carrier}_001`,
      },
      serverPayload: { reference: 'server-created' },
    });
    assert.equal(result.carrier, carrier);
    assert.equal(registry.list().find(item => item.id === carrier)?.status, 'available');
  }

  await assert.rejects(
    registry.get('smsa_express').execute({
      operation: 'tracking',
      requestId: 'smsa-unsafe',
      connection: {
        id: 'smsa-connection',
        carrier: 'smsa_express',
        environment: 'sandbox',
        secretRef: 'secretref_smsa_001',
      },
      serverPayload: { passKey: 'must-never-come-from-browser' },
    }),
    (error: unknown) => error instanceof CarrierAdapterCoreError && error.code === 'unsafe_input_rejected',
  );
});

test('fourteen additional private Asian carriers share the official server-only registry boundary', async () => {
  const carrierOperations: Record<ExpandedPrivateAsiaCarrierId, 'rate' | 'shipment' | 'tracking'> = {
    blue_dart: 'tracking',
    dtdc: 'shipment',
    gdex: 'rate',
    jne: 'tracking',
    ghn: 'rate',
    ghtk: 'tracking',
    grab_express: 'rate',
    gosend: 'shipment',
    flash_express: 'tracking',
    pathao_courier: 'rate',
    ecourier_bd: 'tracking',
    leopards_courier: 'tracking',
    domex_lk: 'tracking',
    nepal_can_move: 'shipment',
  };
  const adapters = Object.fromEntries(
    Object.entries(carrierOperations).map(([carrier, operation]) => {
      const id = carrier as ExpandedPrivateAsiaCarrierId;
      const connector = new ExpandedPrivateAsiaConnector({
        carrier: id,
        environment: 'sandbox',
        baseUrl: `https://${id.replaceAll('_', '-')}.sandbox.example`,
        auth: { type: 'api_key', headerName: 'x-test-key', value: 'synthetic-key' },
        routes: {
          [operation]: {
            method: 'POST',
            path: '/official',
            safeToRetry: operation !== 'shipment',
          },
        },
      }, {
        requestId: () => `${id}-request`,
        fetch: async () => new Response('{"ok":true}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      });
      return [id, createExpandedPrivateAsiaCarrierAdapter(id, connector)];
    }),
  );
  const registry = createOfficialCarrierAdapterRegistry(adapters);

  for (const [carrier, operation] of Object.entries(carrierOperations)) {
    const result = await registry.get(carrier as ExpandedPrivateAsiaCarrierId).execute({
      operation,
      requestId: `${carrier}-core-request`,
      idempotencyKey: operation === 'shipment' ? `${carrier}-idempotency` : undefined,
      connection: {
        id: `${carrier}-connection`,
        carrier: carrier as ExpandedPrivateAsiaCarrierId,
        environment: 'sandbox',
        secretRef: `secretref_${carrier}_001`,
      },
      serverPayload: { reference: 'server-created' },
    });
    assert.equal(result.carrier, carrier);
    assert.equal(registry.list().find(item => item.id === carrier)?.status, 'available');
  }

  await assert.rejects(
    registry.get('gdex').execute({
      operation: 'rate',
      requestId: 'gdex-unsafe',
      connection: {
        id: 'gdex-connection',
        carrier: 'gdex',
        environment: 'sandbox',
        secretRef: 'secretref_gdex_001',
      },
      serverPayload: { apiKey: 'must-never-come-from-browser' },
    }),
    (error: unknown) => error instanceof CarrierAdapterCoreError && error.code === 'unsafe_input_rejected',
  );
});

test('eighteen additional European carriers share the official server-only registry boundary', async () => {
  const carrierOperations: Record<ExpandedPrivateEuropeCarrierId, 'label' | 'rate' | 'shipment' | 'tracking'> = {
    yodel: 'tracking',
    fan_courier: 'rate',
    acs_courier: 'shipment',
    dachser: 'tracking',
    sameday: 'shipment',
    dhl_parcel_de: 'shipment',
    colissimo: 'tracking',
    poste_italiane: 'shipment',
    correos: 'tracking',
    postnl: 'shipment',
    bpost: 'tracking',
    postnord: 'shipment',
    swiss_post: 'label',
    austrian_post: 'shipment',
    ppl_cz: 'tracking',
    omniva: 'tracking',
    an_post: 'shipment',
    ctt_portugal: 'rate',
  };
  const adapters = Object.fromEntries(
    Object.entries(carrierOperations).map(([carrier, operation]) => {
      const id = carrier as ExpandedPrivateEuropeCarrierId;
      const connector = new ExpandedPrivateEuropeConnector({
        carrier: id,
        environment: 'sandbox',
        baseUrl: `https://${id.replaceAll('_', '-')}.sandbox.example`,
        auth: { type: 'api_key', headerName: 'x-test-key', value: 'synthetic-key' },
        routes: {
          [operation]: {
            method: 'POST',
            path: '/official',
            safeToRetry: operation !== 'shipment',
          },
        },
      }, {
        requestId: () => `${id}-request`,
        fetch: async () => new Response('{"ok":true}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      });
      return [id, createExpandedPrivateEuropeCarrierAdapter(id, connector)];
    }),
  );
  const registry = createOfficialCarrierAdapterRegistry(adapters);

  for (const [carrier, operation] of Object.entries(carrierOperations)) {
    const result = await registry.get(carrier as ExpandedPrivateEuropeCarrierId).execute({
      operation,
      requestId: `${carrier}-core-request`,
      idempotencyKey: operation === 'shipment' ? `${carrier}-idempotency` : undefined,
      connection: {
        id: `${carrier}-connection`,
        carrier: carrier as ExpandedPrivateEuropeCarrierId,
        environment: 'sandbox',
        secretRef: `secretref_${carrier}_001`,
      },
      serverPayload: { reference: 'server-created' },
    });
    assert.equal(result.carrier, carrier);
    assert.equal(registry.list().find(item => item.id === carrier)?.status, 'available');
  }

  await assert.rejects(
    registry.get('fan_courier').execute({
      operation: 'rate',
      requestId: 'fan-unsafe',
      connection: {
        id: 'fan-connection',
        carrier: 'fan_courier',
        environment: 'sandbox',
        secretRef: 'secretref_fan_001',
      },
      serverPayload: { bearerToken: 'must-never-come-from-browser' },
    }),
    (error: unknown) => error instanceof CarrierAdapterCoreError && error.code === 'unsafe_input_rejected',
  );
});

test('six additional Greater China carriers share the official server-only registry boundary', async () => {
  const carrierOperations: Record<
    ExpandedPrivateGreaterChinaCarrierId,
    'address_validation' | 'rate' | 'shipment' | 'tracking'
  > = {
    zto_express: 'address_validation',
    yto_express: 'rate',
    sto_express: 'shipment',
    deppon: 'tracking',
    jd_logistics: 'shipment',
    cainiao_express: 'tracking',
  };
  const adapters = Object.fromEntries(
    Object.entries(carrierOperations).map(([carrier, operation]) => {
      const id = carrier as ExpandedPrivateGreaterChinaCarrierId;
      const connector = new ExpandedPrivateGreaterChinaConnector({
        carrier: id,
        environment: 'sandbox',
        baseUrl: `https://${id.replaceAll('_', '-')}.sandbox.example`,
        auth: { type: 'api_key', headerName: 'x-test-key', value: 'synthetic-key' },
        routes: {
          [operation]: {
            method: 'POST',
            path: '/official',
            safeToRetry: operation !== 'shipment',
          },
        },
      }, {
        requestId: () => `${id}-request`,
        fetch: async () => new Response('{"ok":true}', {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      });
      return [id, createExpandedPrivateGreaterChinaCarrierAdapter(id, connector)];
    }),
  );
  const registry = createOfficialCarrierAdapterRegistry(adapters);

  for (const [carrier, operation] of Object.entries(carrierOperations)) {
    const result = await registry.get(carrier as ExpandedPrivateGreaterChinaCarrierId).execute({
      operation,
      requestId: `${carrier}-core-request`,
      idempotencyKey: operation === 'shipment' ? `${carrier}-idempotency` : undefined,
      connection: {
        id: `${carrier}-connection`,
        carrier: carrier as ExpandedPrivateGreaterChinaCarrierId,
        environment: 'sandbox',
        secretRef: `secretref_${carrier}_001`,
      },
      serverPayload: { reference: 'server-created' },
    });
    assert.equal(result.carrier, carrier);
    assert.equal(registry.list().find(item => item.id === carrier)?.status, 'available');
  }

  await assert.rejects(
    registry.get('jd_logistics').execute({
      operation: 'rate',
      requestId: 'jdl-unsafe',
      connection: {
        id: 'jdl-connection',
        carrier: 'jd_logistics',
        environment: 'sandbox',
        secretRef: 'secretref_jdl_001',
      },
      serverPayload: { appSecret: 'must-never-come-from-browser' },
    }),
    (error: unknown) => error instanceof CarrierAdapterCoreError && error.code === 'unsafe_input_rejected',
  );
});

test('shared direct adapter boundary rejects a connector response for another carrier', async () => {
  const adapter = createExpandedPrivateEuropeCarrierAdapter('yodel', {
    config: { carrier: 'yodel' },
    execute: async () => ({
      carrier: 'sameday',
      operation: 'tracking',
      requestId: 'mismatched-response',
      status: 200,
      data: {},
      retryable: false,
      outcomeUnknown: false,
    }),
  } as never);

  await assert.rejects(
    adapter.execute({
      operation: 'tracking',
      requestId: 'shared-boundary-request',
      connection: {
        id: 'yodel-connection',
        carrier: 'yodel',
        environment: 'sandbox',
        secretRef: 'secretref_yodel_001',
      },
      serverPayload: { reference: 'synthetic' },
    }),
    (error: unknown) => error instanceof CarrierAdapterCoreError && error.code === 'connection_mismatch',
  );
});

test('shared direct adapter boundary preserves carrier-specific payload mapping hooks', async () => {
  let receivedPayload: Record<string, unknown> | undefined;
  const adapter = createExpandedAfricaCarrierAdapter('collivery', {
    config: { carrier: 'collivery' },
    execute: async (_operation: unknown, payload: Record<string, unknown>) => {
      receivedPayload = payload;
      return {
        carrier: 'collivery',
        operation: 'void',
        requestId: 'collivery-void',
        status: 200,
        data: {},
        retryable: false,
        outcomeUnknown: false,
      };
    },
  } as never);

  await adapter.execute({
    operation: 'void',
    requestId: 'collivery-void-request',
    idempotencyKey: 'collivery-void-idempotency',
    connection: {
      id: 'collivery-connection',
      carrier: 'collivery',
      environment: 'sandbox',
      secretRef: 'secretref_collivery_001',
    },
    serverPayload: { waybill: 'synthetic' },
  });

  assert.deepEqual(receivedPayload, { waybill: 'synthetic', status_id: 5 });
});
