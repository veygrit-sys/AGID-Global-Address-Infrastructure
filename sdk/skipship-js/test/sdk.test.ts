import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  createSkipshipClient,
  SkipshipApiError,
  type SkipshipCarrierAllocationResult,
  type SkipshipRateQuoteResult,
  type SkipshipShipmentCreateResult,
  type SkipshipShipmentIntentCreateResult,
  type SkipshipTransportRequest,
} from '../src/index';
import { handleSkipshipMockRequest } from '../../../src/lib/deliveryGatewayCarrierApi';
import { createShipmentIntentSandbox } from '../../../src/lib/addressStripeFoundation';

type CreateShipmentFixture = {
  fixtureId: string;
  openApiPath: 'POST /v1/shipments';
  developerCall: 'shipping.createShipment';
  localOnly: true;
  productionTraffic: false;
  rawAddressFixtures: false;
  request: {
    recipientId: string;
    addressFormVersion: string;
    parcelProfileRef: string;
    walletConsentRef: string;
    servicePreference: 'fastest' | 'cheapest' | 'balanced';
    requestedAt: string;
  };
  response: SkipshipShipmentCreateResult;
  forbiddenPublicMaterial: string[];
  nonClaims: string[];
};

type ShipmentIntentRateAllocationChainFixture = {
  fixtureId: 'skipship-shipment-intent-rate-allocation-chain-v0.1';
  openApiPaths: ['POST /v1/shipment-intents', 'POST /v1/delivery/rates', 'POST /v1/delivery/allocate'];
  developerCalls: ['skipship.createShipmentIntent', 'skipship.quoteRates', 'skipship.createCarrierAllocation'];
  localOnly: true;
  productionTraffic: false;
  rawAddressFixtures: false;
  shipmentIntentRequest: Parameters<ReturnType<typeof createSkipshipClient>['createShipmentIntent']>[0];
  shipmentIntentResponse: SkipshipShipmentIntentCreateResult;
  rateQuoteRequest: Parameters<ReturnType<typeof createSkipshipClient>['quoteRates']>[0];
  rateQuoteResponse: SkipshipRateQuoteResult;
  carrierAllocationRequest: Parameters<ReturnType<typeof createSkipshipClient>['createCarrierAllocation']>[0];
  carrierAllocationResponse: SkipshipCarrierAllocationResult;
  forbiddenPublicMaterial: string[];
  nonClaims: string[];
};

function readFixture<T>(filename: string): T {
  const candidates = [
    join('sdk/skipship-js/fixtures', filename),
    join('..', 'fixtures', filename),
  ];
  const fixturePath = candidates.find(candidate => existsSync(candidate));
  assert.ok(fixturePath, `${filename} fixture is required`);
  return JSON.parse(readFileSync(fixturePath, 'utf8')) as T;
}

const fixture = readFixture<CreateShipmentFixture>('create-shipment-sandbox-v0.1.json');
const chainFixture = readFixture<ShipmentIntentRateAllocationChainFixture>('shipment-intent-rate-allocation-chain-v0.1.json');
const syntheticShipment = fixture.response;

const syntheticShipmentIntent = createShipmentIntentSandbox({
  ...chainFixture.shipmentIntentRequest,
});
if (!syntheticShipmentIntent.ok) {
  throw new Error('synthetic shipment intent fixture should be buildable');
}

test('createShipmentIntent calls the OpenAPI /v1/shipment-intents facade with safe refs', async () => {
  let captured: SkipshipTransportRequest | undefined;
  const client = createSkipshipClient({
    baseUrl: 'https://api.veygrit.example/',
    publishableKey: 'pk_test_synthetic',
    transport: async request => {
      captured = request;
      return { status: 201, body: syntheticShipmentIntent.body };
    },
  });

  const intent = await client.createShipmentIntent({
    ...chainFixture.shipmentIntentRequest,
  });

  assert.equal(captured?.method, 'POST');
  assert.equal(captured?.url, 'https://api.veygrit.example/v1/shipment-intents');
  assert.equal(captured?.headers.authorization, 'Bearer pk_test_synthetic');
  assert.equal(
    (captured?.body as { parcelProfileRef?: string } | undefined)?.parcelProfileRef,
    'parcel_profile_synthetic_small_001',
  );
  assert.equal(intent.version, 'shipment-intent-v0.1');
  assert.equal(intent.status, 'ready_for_rate_quote');
  assert.equal(intent.privacy.contains_raw_address, false);
});

test('request options attach an idempotency key without adding it to the public body', async () => {
  let captured: SkipshipTransportRequest | undefined;
  const client = createSkipshipClient({
    baseUrl: 'https://api.veygrit.example',
    publishableKey: 'pk_test_synthetic',
    transport: async request => {
      captured = request;
      return { status: 201, body: syntheticShipmentIntent.body as SkipshipShipmentIntentCreateResult };
    },
  });

  await client.createShipmentIntent(chainFixture.shipmentIntentRequest, {
    idempotencyKey: 'idem_synthetic_checkout_001',
  });

  assert.equal(captured?.headers['idempotency-key'], 'idem_synthetic_checkout_001');
  assert.doesNotMatch(JSON.stringify(captured?.body), /idem_synthetic_checkout_001/);
});

test('createShipmentIntent rejects raw address or proof material before transport', async () => {
  let called = false;
  const client = createSkipshipClient({
    baseUrl: 'https://api.veygrit.example',
    publishableKey: 'pk_test_synthetic',
    transport: async () => {
      called = true;
      return { status: 201, body: syntheticShipmentIntent.body as SkipshipShipmentIntentCreateResult };
    },
  });

  await assert.rejects(
    () => client.createShipmentIntent({
    ...chainFixture.shipmentIntentRequest,
    proofWitness: 'blocked',
  } as never),
    /Unsafe Skipship createShipmentIntent payload keys: proofWitness/,
  );
  assert.equal(called, false);
});

test('ShipmentIntent to RateQuote to CarrierAllocation chain round-trips through the mock gateway', async () => {
  const client = createSkipshipClient({
    baseUrl: 'https://api.veygrit.example',
    publishableKey: 'pk_test_synthetic',
    transport: async request => {
      if (new URL(request.url).pathname === '/v1/shipment-intents') {
        return {
          status: 201,
          body: syntheticShipmentIntent.body as SkipshipShipmentIntentCreateResult,
        };
      }
      const response = handleSkipshipMockRequest({
        method: request.method,
        path: new URL(request.url).pathname,
        headers: request.headers,
        body: request.body as unknown as Record<string, unknown>,
      });
      return {
        status: response.status,
        body: response.body as unknown as SkipshipRateQuoteResult | SkipshipCarrierAllocationResult,
      };
    },
  });

  const intent = await client.createShipmentIntent(chainFixture.shipmentIntentRequest);
  const quote = await client.quoteRates(chainFixture.rateQuoteRequest);
  const allocation = await client.createCarrierAllocation(chainFixture.carrierAllocationRequest);

  assert.deepEqual(intent, chainFixture.shipmentIntentResponse);
  assert.deepEqual(quote, chainFixture.rateQuoteResponse);
  assert.deepEqual(allocation, chainFixture.carrierAllocationResponse);
  assert.equal(chainFixture.rateQuoteRequest.addressAliasRef, intent.recipient_token_ref.replace('rectok_', 'addr_alias_'));
  assert.equal(chainFixture.carrierAllocationRequest.rateRef, quote.rateRef);
  assert.equal(chainFixture.carrierAllocationRequest.walletConsentRef, intent.wallet_consent_ref);
});

test('quoteRates and createCarrierAllocation reject carrier secrets before transport', async () => {
  let called = false;
  const client = createSkipshipClient({
    baseUrl: 'https://api.veygrit.example',
    publishableKey: 'pk_test_synthetic',
    transport: async () => {
      called = true;
      return { status: 200, body: {} as never };
    },
  });

  await assert.rejects(
    () => client.quoteRates({
      addressAliasRef: 'addr_alias_synthetic_only',
      parcelProfileRef: 'parcel_profile_synthetic_only',
      objective: 'cheapest',
      requestedServiceLevels: ['economy'],
      carrierCredential: 'blocked',
    } as never),
    /Unsafe Skipship quoteRates payload keys: carrierCredential/,
  );
  await assert.rejects(
    () => client.createCarrierAllocation({
      rateRef: 'rate_dadbd84bc23fa9d12f6c0c54',
      walletConsentRef: 'consent_synthetic_only',
      objective: 'cheapest',
      merchantPolicyRef: 'merchant_policy_demo',
      commercialRateSecret: 'blocked',
    } as never),
    /Unsafe Skipship createCarrierAllocation payload keys: commercialRateSecret/,
  );
  assert.equal(called, false);
});

test('non-2xx transport responses throw a structured SkipshipApiError', async () => {
  const client = createSkipshipClient({
    baseUrl: 'https://api.veygrit.example',
    publishableKey: 'pk_test_synthetic',
    transport: async () => ({
      status: 401,
      body: {
        error: 'auth_required',
        requestId: 'req_synthetic_auth_failure',
      },
    }),
  });

  await assert.rejects(
    () => client.createShipmentIntent(chainFixture.shipmentIntentRequest),
    (error: unknown) => {
      assert.ok(error instanceof SkipshipApiError);
      assert.equal(error.operation, 'createShipmentIntent');
      assert.equal(error.status, 401);
      assert.deepEqual(error.body, {
        error: 'auth_required',
        requestId: 'req_synthetic_auth_failure',
      });
      assert.equal(error.message, 'Skipship createShipmentIntent failed with status 401');
      return true;
    },
  );
});

test('createShipment calls the OpenAPI /v1/shipments facade with safe refs', async () => {
  let captured: SkipshipTransportRequest | undefined;
  const client = createSkipshipClient({
    baseUrl: 'https://api.veygrit.example/',
    publishableKey: 'pk_test_synthetic',
    transport: async request => {
      captured = request;
      return { status: 201, body: syntheticShipment };
    },
  });

  const shipment = await client.createShipment({
    recipientId: fixture.request.recipientId,
    addressFormVersion: fixture.request.addressFormVersion,
    parcelProfileRef: fixture.request.parcelProfileRef,
    walletConsentRef: fixture.request.walletConsentRef,
    servicePreference: fixture.request.servicePreference,
  });

  assert.equal(captured?.method, 'POST');
  assert.equal(captured?.url, 'https://api.veygrit.example/v1/shipments');
  assert.equal(captured?.headers.authorization, 'Bearer pk_test_synthetic');
  assert.equal((captured?.body as { recipientId?: string } | undefined)?.recipientId, fixture.request.recipientId);
  assert.equal(
    (captured?.body as { addressFormVersion?: string } | undefined)?.addressFormVersion,
    fixture.request.addressFormVersion,
  );
  assert.equal(shipment.developerCall, fixture.developerCall);
  assert.equal(shipment.safeRefs.labelRef, fixture.response.safeRefs.labelRef);
  assert.doesNotMatch(JSON.stringify(captured?.body), new RegExp(fixture.forbiddenPublicMaterial.join('|')));
});

test('createShipment rejects raw address or carrier credential material before transport', async () => {
  let called = false;
  const client = createSkipshipClient({
    baseUrl: 'https://api.veygrit.example',
    publishableKey: 'pk_test_synthetic',
    transport: async () => {
      called = true;
      return { status: 201, body: syntheticShipment };
    },
  });

  await assert.rejects(
    () => client.createShipment({
      recipientId: 'ship_recipient_synthetic_001',
      parcelProfileRef: 'parcel_profile_synthetic_small_box_001',
      walletConsentRef: 'consent_synthetic_skipship_001',
      rawAddress: 'blocked',
    } as never),
    /Unsafe Skipship createShipment payload keys: rawAddress/,
  );
  assert.equal(called, false);
});

test('package fixture is redacted and aligned with the OpenAPI shipment facade', () => {
  const readme = readFileSync('sdk/skipship-js/README.md', 'utf8');

  assert.equal(fixture.fixtureId, 'skipship-create-shipment-sandbox-v0.1');
  assert.equal(fixture.openApiPath, 'POST /v1/shipments');
  assert.match(fixture.request.addressFormVersion, /^wallet_country_form_ref_/);
  assert.match(readme, /addressFormVersion: "wallet_country_form_ref_synthetic_001"/);
  assert.doesNotMatch(readme, /rawAddress:|carrierApiKey:|proofWitness:|privateKey:|proofSecret:/);
  assert.equal(fixture.localOnly, true);
  assert.equal(fixture.productionTraffic, false);
  assert.equal(fixture.rawAddressFixtures, false);
  assert.equal(fixture.response.developerCall, 'shipping.createShipment');
  assert.equal(fixture.response.localOnly, true);
  assert.equal(fixture.response.productionTraffic, false);
  assert.equal(fixture.response.rawAddressFixtures, false);
  assert.deepEqual(fixture.response.validationErrors, []);
  assert.ok(fixture.response.webhookEvents.includes('shipment.label_created'));
  assert.ok(fixture.nonClaims.some(nonClaim => /does not buy a real label/i.test(nonClaim)));
  assert.doesNotMatch(JSON.stringify(fixture.request), new RegExp(fixture.forbiddenPublicMaterial.join('|')));
  assert.doesNotMatch(JSON.stringify(fixture.response.safeRefs), new RegExp(fixture.forbiddenPublicMaterial.join('|')));
});

test('chain fixture is redacted and aligned with the three-step OpenAPI facade', () => {
  assert.equal(chainFixture.fixtureId, 'skipship-shipment-intent-rate-allocation-chain-v0.1');
  assert.deepEqual(chainFixture.openApiPaths, [
    'POST /v1/shipment-intents',
    'POST /v1/delivery/rates',
    'POST /v1/delivery/allocate',
  ]);
  assert.equal(chainFixture.localOnly, true);
  assert.equal(chainFixture.productionTraffic, false);
  assert.equal(chainFixture.rawAddressFixtures, false);
  assert.equal(chainFixture.shipmentIntentResponse.privacy.contains_raw_address, false);
  assert.equal(chainFixture.shipmentIntentResponse.privacy.production_traffic, false);
  assert.equal(chainFixture.rateQuoteResponse.carrierAlias, 'sandbox-carrier');
  assert.equal(chainFixture.carrierAllocationResponse.selectedCarrierAlias, 'sandbox-carrier');
  assert.ok(chainFixture.nonClaims.some(nonClaim => /does not buy a real label/i.test(nonClaim)));
  assert.ok(chainFixture.nonClaims.some(nonClaim => /not final settlement/i.test(nonClaim)));
  assert.doesNotMatch(JSON.stringify(chainFixture.shipmentIntentRequest), new RegExp(chainFixture.forbiddenPublicMaterial.join('|')));
  assert.doesNotMatch(JSON.stringify(chainFixture.rateQuoteRequest), new RegExp(chainFixture.forbiddenPublicMaterial.join('|')));
  assert.doesNotMatch(JSON.stringify(chainFixture.carrierAllocationRequest), new RegExp(chainFixture.forbiddenPublicMaterial.join('|')));
});

test('OpenAPI exposes the ShipmentIntent facade used by the SDK', () => {
  const openapi = readFileSync('docs/specs/delivery-gateway-carrier-api.openapi.yaml', 'utf8');

  assert.match(openapi, /\/v1\/shipment-intents:/);
  assert.match(openapi, /operationId: createShipmentIntent/);
  assert.match(openapi, /ShipmentIntentCreateRequest/);
  assert.match(openapi, /ShipmentIntentResult/);
  assert.match(openapi, /src\/lib\/addressStripeFoundation\.ts#createShipmentIntentSandbox/);
  assert.match(openapi, /name: Idempotency-Key/);
  assert.match(openapi, /skipship-idempotency-replayed/);
  assert.match(openapi, /idempotency_key_conflict/);
  assert.match(openapi, /#\/components\/responses\/IdempotencyConflict/);
});

test('createShipment fixture request round-trips through the Skipship mock handler', async () => {
  const client = createSkipshipClient({
    baseUrl: 'https://api.veygrit.example',
    publishableKey: 'pk_test_synthetic',
    transport: async request => {
      const response = handleSkipshipMockRequest({
        method: request.method,
        path: new URL(request.url).pathname,
        headers: request.headers,
        body: request.body as unknown as Record<string, unknown>,
      });
      return {
        status: response.status,
        body: response.body as unknown as SkipshipShipmentCreateResult,
      };
    },
  });

  const shipment = await client.createShipment(fixture.request);

  assert.equal(shipment.shipmentId, fixture.response.shipmentId);
  assert.equal(shipment.status, 'sandbox_label_ready');
  assert.equal(shipment.developerCall, 'shipping.createShipment');
  assert.equal(shipment.safeRefs.labelRef, fixture.response.safeRefs.labelRef);
  assert.deepEqual(shipment.validationErrors, []);
  assert.equal(shipment.productionTraffic, false);
});
