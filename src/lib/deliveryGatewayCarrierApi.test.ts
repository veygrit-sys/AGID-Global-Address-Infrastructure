import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { buildCarrierLabelIntent, validateCarrierLabelIntent } from './carrierLabelIntent';
import {
  buildCarrierOnlyHandoffRefEvidence,
  buildDeliveryGatewayCarrierApiRegistry,
  createSkipshipShipment,
  handleSkipshipMockRequest,
  type SandboxCarrierGatewaySmokeInput,
  runSandboxCarrierGatewaySmoke,
  validateCarrierOnlyHandoffRefEvidence,
  signTrackingWebhookSandbox,
  validateDeliveryGatewayCarrierApiRegistry,
  verifyTrackingWebhookSignature,
} from './deliveryGatewayCarrierApi';
import { buildVeyEcosystemResearch } from './veyEcosystemResearch';

type JsonSchemaSubset = {
  const?: unknown;
  enum?: unknown[];
  type?: 'object' | 'array' | 'string' | 'integer' | 'boolean';
  required?: string[];
  properties?: Record<string, JsonSchemaSubset>;
  additionalProperties?: boolean;
  items?: JsonSchemaSubset;
  contains?: JsonSchemaSubset;
  allOf?: JsonSchemaSubset[];
  pattern?: string;
  minItems?: number;
  maxItems?: number;
};

function validateJsonWithSchemaSubset(value: unknown, schema: JsonSchemaSubset, path = '$'): string[] {
  const errors: string[] = [];

  if ('const' in schema && value !== schema.const) errors.push(`${path}:const`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path}:enum`);
  if (schema.type === 'object' && (typeof value !== 'object' || value === null || Array.isArray(value))) errors.push(`${path}:object`);
  if (schema.type === 'array' && !Array.isArray(value)) errors.push(`${path}:array`);
  if (schema.type === 'string' && typeof value !== 'string') errors.push(`${path}:string`);
  if (schema.type === 'boolean' && typeof value !== 'boolean') errors.push(`${path}:boolean`);

  if (schema.pattern && typeof value === 'string' && !new RegExp(schema.pattern).test(value)) {
    errors.push(`${path}:pattern`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path}:minItems`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path}:maxItems`);
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateJsonWithSchemaSubset(item, schema.items as JsonSchemaSubset, `${path}[${index}]`));
      });
    }
    if (schema.contains && !value.some(item => validateJsonWithSchemaSubset(item, schema.contains as JsonSchemaSubset, path).length === 0)) {
      errors.push(`${path}:contains`);
    }
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const objectValue = value as Record<string, unknown>;
    for (const required of schema.required ?? []) {
      if (!(required in objectValue)) errors.push(`${path}:missing:${required}`);
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(objectValue)) {
        if (!(key in schema.properties)) errors.push(`${path}:additional:${key}`);
      }
    }
    for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
      if (key in objectValue) errors.push(...validateJsonWithSchemaSubset(objectValue[key], childSchema, `${path}.${key}`));
    }
  }

  for (const childSchema of schema.allOf ?? []) {
    errors.push(...validateJsonWithSchemaSubset(value, childSchema, path));
  }

  return errors;
}

test('Delivery Gateway carrier API registry validates as a Stripe-like carrier contract', () => {
  const registry = buildDeliveryGatewayCarrierApiRegistry();

  assert.deepEqual(validateDeliveryGatewayCarrierApiRegistry(registry), []);
  assert.equal(registry.version, 'delivery-gateway-carrier-api-v0.1');
  assert.ok(registry.objectives.includes('fastest'));
  assert.ok(registry.objectives.includes('cheapest'));
  assert.equal(registry.safety.rawAddressAllowedInMerchantCallback, false);
  assert.equal(registry.safety.carrierCredentialsAllowedInClient, false);
});

test('carrier API surfaces cover rates, allocation, labels, tracking, proof, disputes, and capabilities', () => {
  const registry = buildDeliveryGatewayCarrierApiRegistry();
  const surfaces = new Map(registry.apiSurfaces.map(surface => [surface.id, surface]));

  for (const required of [
    'rate-quote',
    'carrier-allocation',
    'label-create',
    'pickup-schedule',
    'tracking-webhook',
    'delivery-proof',
    'refund-dispute',
    'carrier-capability',
  ]) {
    assert.ok(surfaces.has(required as never), `${required} should exist`);
  }

  assert.equal(surfaces.get('rate-quote')?.path, '/v1/delivery/rates');
  assert.equal(surfaces.get('label-create')?.boundary, 'commercial-managed');
  assert.match(surfaces.get('carrier-allocation')?.purpose ?? '', /fastest, cheapest/);
});

test('every surface blocks private address, proof, label, or carrier credential material', () => {
  const registry = buildDeliveryGatewayCarrierApiRegistry();

  for (const surface of registry.apiSurfaces) {
    assert.ok(surface.blockedFields.length > 0, `${surface.id} should block private fields`);
    assert.ok(surface.nonClaims.length > 0, `${surface.id} should have non-claims`);
  }

  const blocked = registry.apiSurfaces.flatMap(surface => surface.blockedFields);
  assert.ok(blocked.includes('rawAddress'));
  assert.ok(blocked.includes('carrierApiKey'));
  assert.ok(blocked.includes('proofWitness'));
  assert.ok(blocked.includes('rawLabelPayload'));
});

test('lifecycle states map onto CarrierLabelIntent statuses and evidence types', () => {
  const registry = buildDeliveryGatewayCarrierApiRegistry();
  const labelIntent = buildCarrierLabelIntent({
    carrier: {
      carrierId: 'sandbox-carrier',
      adapter: 'carrier-rest-compatible',
      acceptanceStatus: 'accepted',
      carrierReceiptRef: 'carrier-receipt:accepted:gateway',
    },
    label: {
      waybillAlias: 'WBA-GATEWAY-001',
      waybillCommitment: 'waybill-cmt-gateway',
      labelQrCommitment: 'labelqr_abcdefabcdefabcdefabcdefabcdefab',
    },
    evidence: [
      { type: 'address-verification', status: 'passed', safeFingerprint: 'addr-cmt-gateway' },
      { type: 'agid-aoid-check', status: 'passed', safeFingerprint: 'agid-aoid-cmt-gateway' },
      { type: 'carrier-acceptance', status: 'passed', receiptRef: 'carrier-receipt:accepted:gateway', signed: true },
      { type: 'label-qr-issued', status: 'passed', safeFingerprint: 'label-cmt-gateway' },
    ],
    createdAt: '2026-07-03T00:00:00.000Z',
    updatedAt: '2026-07-03T00:00:00.000Z',
  });

  assert.equal(validateCarrierLabelIntent(labelIntent).ok, true);
  assert.ok(registry.lifecycle.some(state => state.mapsToIntentStatuses.includes(labelIntent.status)));
});

test('registry is linked from Vey ecosystem as the commerce delivery build unit', () => {
  const registry = buildDeliveryGatewayCarrierApiRegistry();
  const ecosystem = buildVeyEcosystemResearch();
  const deliveryUnit = ecosystem.buildUnits.find(unit => unit.id === 'commerce-and-delivery');
  const carrierProduct = ecosystem.products.find(product => product.id === 'carrier-api-stripe');

  assert.equal(deliveryUnit?.packageName, registry.buildPlan.packageName);
  assert.match(deliveryUnit?.firstReleaseGate ?? '', /label sandbox|webhook evidence|rate/i);
  assert.ok(carrierProduct?.exposes.includes('carrier adapter contract'));
  assert.ok(carrierProduct?.blockedData.includes('production carrier keys in fixtures'));
});

test('strategy document and package script expose the delivery gateway carrier API gate', () => {
  const strategy = readFileSync('docs/product/vey-ecosystem-strategy.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

  assert.match(strategy, /Carrier API Stripe/);
  assert.match(strategy, /verify:delivery-gateway-carrier-api/);
  assert.match(strategy, /sandbox-carrier/);
  assert.match(strategy, /rate -> allocate -> label ->/);
  assert.equal(packageJson.scripts?.['verify:delivery-gateway-carrier-api'], 'tsx scripts/verify-delivery-gateway-carrier-api.ts');
  assert.equal(packageJson.scripts?.['verify:skipship-idempotency-openapi'], 'tsx scripts/verify-skipship-idempotency-openapi.ts');
  assert.match(readFileSync('scripts/verify-delivery-gateway-carrier-api.ts', 'utf8'), /deliveryGatewayCarrierApi\.test\.ts/);
  assert.match(readFileSync('scripts/verify-delivery-gateway-carrier-api.ts', 'utf8'), /verify-skipship-idempotency-openapi\.ts/);
});

test('sandbox carrier gateway smoke runs rate to proof without production traffic', () => {
  const smoke = runSandboxCarrierGatewaySmoke({
    objective: 'cheapest',
    addressAliasRef: 'addr_alias_synthetic_only',
    walletConsentRef: 'consent_synthetic_only',
  });

  assert.equal(smoke.carrierId, 'sandbox-carrier');
  assert.equal(smoke.objective, 'cheapest');
  assert.equal(smoke.localOnly, true);
  assert.equal(smoke.productionTraffic, false);
  assert.equal(smoke.rawAddressFixtures, false);
  assert.deepEqual(smoke.validationErrors, []);
  assert.deepEqual(smoke.steps.map(step => step.surface), [
    'rate-quote',
    'carrier-allocation',
    'label-create',
    'tracking-webhook',
    'delivery-proof',
  ]);
  assert.equal(smoke.labelIntent.status, 'completed');
  assert.equal(validateCarrierLabelIntent(smoke.labelIntent).ok, true);
});

test('sandbox carrier gateway smoke exposes only safe references to merchants', () => {
  const smoke = runSandboxCarrierGatewaySmoke();
  const merchantJson = JSON.stringify(smoke.merchantVisible);

  assert.match(merchantJson, /rate_/);
  assert.match(merchantJson, /alloc_/);
  assert.match(merchantJson, /label_/);
  assert.ok(smoke.blockedMaterial.includes('rawAddress'));
  assert.doesNotMatch(merchantJson, /rawAddress|recipientName|carrierApiKey|proofWitness|rawLabelPayload/);
});

test('carrier-only handoff evidence derives deterministic refs outside merchant-visible output', () => {
  const input = {
    carrierAlias: 'sandbox-carrier',
    addressAliasRef: 'addr_alias_handoff_synthetic_001',
    walletConsentRef: 'consent_handoff_synthetic_001',
    carrierCapabilityRef: 'carrier_capability_synthetic_001',
    allocationRef: 'alloc_handoff_synthetic_001',
    labelRef: 'label_handoff_synthetic_001',
    createdAt: '2026-07-03T00:00:00.000Z',
  };
  const evidence = buildCarrierOnlyHandoffRefEvidence(input);
  const replay = buildCarrierOnlyHandoffRefEvidence(input);
  const merchantJson = JSON.stringify(evidence.merchantVisibleRefs);

  assert.equal(evidence.carrierHandoffRef, replay.carrierHandoffRef);
  assert.match(evidence.carrierHandoffRef, /^carrier_handoff_[0-9a-f]{24}$/);
  assert.equal(evidence.visibleTo, 'carrier-adapter-only');
  assert.equal(evidence.carrierOnly, true);
  assert.equal(evidence.localOnly, true);
  assert.equal(evidence.productionTraffic, false);
  assert.equal(evidence.rawAddressFixtures, false);
  assert.deepEqual(evidence.validationErrors, []);
  assert.deepEqual(validateCarrierOnlyHandoffRefEvidence(evidence), []);
  assert.equal('carrierHandoffRef' in evidence.merchantVisibleRefs, false);
  assert.match(merchantJson, /alloc_handoff_synthetic_001/);
  assert.match(merchantJson, /label_handoff_synthetic_001/);
  assert.doesNotMatch(merchantJson, /carrierHandoffRef|rawAddress|recipientName|recipientPhone|carrierApiKey|proofWitness|privateKey|proofSecret|rawCarrierPayload/);
  assert.ok(evidence.blockedMaterial.includes('rawCarrierPayload'));
});

test('carrier-only handoff validator rejects merchant-visible handoff refs and private markers', () => {
  const evidence = buildCarrierOnlyHandoffRefEvidence();
  const unsafe = {
    ...evidence,
    carrierOnly: false,
    productionTraffic: true,
    merchantVisibleRefs: {
      ...evidence.merchantVisibleRefs,
      carrierHandoffRef: evidence.carrierHandoffRef,
      rawAddress: 'blocked_private_material_marker',
    },
    blockedMaterial: evidence.blockedMaterial.filter(key => key !== 'rawCarrierPayload'),
  } as unknown as Parameters<typeof validateCarrierOnlyHandoffRefEvidence>[0];
  const errors = validateCarrierOnlyHandoffRefEvidence(unsafe);

  assert.ok(errors.includes('carrier-handoff-not-carrier-only'));
  assert.ok(errors.includes('carrier-handoff-production-traffic-not-false'));
  assert.ok(errors.includes('carrier-handoff-ref-merchant-visible'));
  assert.ok(errors.includes('carrier-handoff-merchant-visible-private-material-key'));
  assert.ok(errors.includes('carrier-handoff-blocked-material-missing:rawCarrierPayload'));
});

test('Skipship createShipment facade maps recipient id to the sandbox carrier gateway', () => {
  const shipment = createSkipshipShipment({
    recipientId: 'ship_recipient_synthetic_001',
    addressFormVersion: 'wallet_country_form_ref_synthetic_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_box_001',
    walletConsentRef: 'consent_synthetic_skipship_001',
    servicePreference: 'cheapest',
    requestedAt: '2026-07-03T00:00:00.000Z',
  });

  assert.equal(shipment.developerCall, 'shipping.createShipment');
  assert.equal(shipment.status, 'sandbox_label_ready');
  assert.equal(shipment.servicePreference, 'cheapest');
  assert.equal(shipment.carrierAlias, 'sandbox-carrier');
  assert.equal(shipment.recipientId, 'ship_recipient_synthetic_001');
  assert.equal(shipment.localOnly, true);
  assert.equal(shipment.productionTraffic, false);
  assert.equal(shipment.rawAddressFixtures, false);
  assert.deepEqual(shipment.validationErrors, []);
  assert.deepEqual(shipment.webhookEvents, [
    'shipment.created',
    'shipment.rated',
    'shipment.label_created',
    'shipment.in_transit',
    'shipment.delivered',
  ]);
  assert.match(shipment.safeRefs.rateRef, /^rate_/);
  assert.match(shipment.safeRefs.allocationRef, /^alloc_/);
  assert.match(shipment.safeRefs.labelRef, /^label_/);
  assert.ok(shipment.blockedMaterial.includes('rawAddress'));
  assert.ok(shipment.nonClaims.some(nonClaim => /not a production carrier purchase/i.test(nonClaim)));
  assert.doesNotMatch(JSON.stringify(shipment.safeRefs), /rawAddress|recipientName|recipientPhone|carrierApiKey|proofWitness|rawLabelPayload|privateKey|proofSecret/);
});

test('Skipship mock handler creates a sandbox shipment and rejects unsafe input', () => {
  const success = handleSkipshipMockRequest({
    method: 'POST',
    path: '/v1/shipments',
    headers: { authorization: 'Bearer pk_test_synthetic' },
    body: {
      recipientId: 'ship_recipient_synthetic_001',
      addressFormVersion: 'wallet_country_form_ref_synthetic_001',
      parcelProfileRef: 'parcel_profile_synthetic_small_box_001',
      walletConsentRef: 'consent_synthetic_skipship_001',
      servicePreference: 'cheapest',
      requestedAt: '2026-07-03T00:00:00.000Z',
    },
  });

  assert.equal(success.status, 201);
  assert.equal(success.body.developerCall, 'shipping.createShipment');
  assert.equal(success.body.productionTraffic, false);
  assert.equal((success.body.safeRefs as Record<string, string>).labelRef, 'label_f0d0c869c6985eb6d885fa35');

  const unsafe = handleSkipshipMockRequest({
    method: 'POST',
    path: '/v1/shipments',
    headers: { authorization: 'Bearer pk_test_synthetic' },
    body: {
      recipientId: 'ship_recipient_synthetic_001',
      parcelProfileRef: 'parcel_profile_synthetic_small_box_001',
      walletConsentRef: 'consent_synthetic_skipship_001',
      rawAddress: 'blocked synthetic private material',
    },
  });

  assert.equal(unsafe.status, 400);
  assert.equal(unsafe.body.error, 'private_material_rejected');
  assert.deepEqual(unsafe.body.rejectedKeys, ['rawAddress']);
});

test('Skipship mock handler replays deterministic safe refs and rejects nested private material', () => {
  const request = {
    method: 'POST',
    path: '/v1/shipments',
    headers: { authorization: 'Bearer pk_test_synthetic' },
    body: {
      recipientId: 'ship_recipient_synthetic_replay_001',
      addressFormVersion: 'wallet_country_form_ref_synthetic_replay_001',
      parcelProfileRef: 'parcel_profile_synthetic_replay_small_box_001',
      walletConsentRef: 'consent_synthetic_replay_001',
      servicePreference: 'balanced',
      requestedAt: '2026-07-03T00:00:00.000Z',
    },
  };
  const first = handleSkipshipMockRequest(request);
  const replay = handleSkipshipMockRequest(request);

  assert.equal(first.status, 201);
  assert.deepEqual(replay.body, first.body);
  assert.equal(replay.status, first.status);
  assert.equal(first.body.productionTraffic, false);
  assert.equal(first.body.rawAddressFixtures, false);
  assert.doesNotMatch(JSON.stringify(first.body.safeRefs), /rawAddress|recipientName|recipientPhone|carrierApiKey|proofWitness|rawLabelPayload|privateKey|proofSecret/);

  const nestedUnsafe = handleSkipshipMockRequest({
    method: 'POST',
    path: '/v1/shipments',
    headers: { authorization: 'Bearer pk_test_synthetic' },
    body: {
      recipientId: 'ship_recipient_synthetic_replay_001',
      parcelProfileRef: 'parcel_profile_synthetic_replay_small_box_001',
      walletConsentRef: 'consent_synthetic_replay_001',
      metadata: {
        carrierApiKey: 'blocked_synthetic_key_ref',
        proofWitness: 'blocked_synthetic_witness_ref',
      },
    },
  });

  assert.equal(nestedUnsafe.status, 400);
  assert.equal(nestedUnsafe.body.error, 'private_material_rejected');
  assert.deepEqual(nestedUnsafe.body.rejectedKeys, ['carrierApiKey', 'proofWitness']);
  assert.doesNotMatch(JSON.stringify(nestedUnsafe.body), /blocked_synthetic_key_ref|blocked_synthetic_witness_ref/);
});

test('tracking webhook sandbox signatures verify normalized safe events', () => {
  const body = {
    eventId: 'evt_tracking_synthetic_001',
    carrierAlias: 'sandbox-carrier',
    trackingAlias: 'tracking_receipt_synthetic_001',
    status: 'in_transit' as const,
    occurredAt: '2026-07-04T08:00:00.000Z',
  };
  const timestamp = '1783152000';
  const signature = signTrackingWebhookSandbox({ timestamp, body });
  const verified = verifyTrackingWebhookSignature(signature, { timestamp, body });

  assert.match(signature, /^t=1783152000,v1=[0-9a-f]{64}$/);
  assert.equal(verified.ok, true);
  assert.match(verified.eventFingerprint ?? '', /^evtfp_[0-9a-f]{24}$/);

  assert.deepEqual(verifyTrackingWebhookSignature(undefined, { timestamp, body }), {
    ok: false,
    error: 'missing_signature',
  });
  assert.deepEqual(verifyTrackingWebhookSignature('not-a-signature', { timestamp, body }), {
    ok: false,
    error: 'malformed_signature',
  });
  assert.deepEqual(verifyTrackingWebhookSignature(signature.replace('1783152000', '1783152001'), { timestamp, body }), {
    ok: false,
    error: 'timestamp_mismatch',
  });
  assert.deepEqual(verifyTrackingWebhookSignature(signature, {
    timestamp,
    body: {
      ...body,
      status: 'delivered',
    },
  }), {
    ok: false,
    error: 'signature_mismatch',
  });
});

test('sandbox carrier gateway smoke fixture is deterministic and redacted', () => {
  const fixture = JSON.parse(readFileSync('docs/specs/fixtures/delivery-gateway-sandbox-carrier-smoke-v0.1.json', 'utf8')) as {
    input: SandboxCarrierGatewaySmokeInput;
    expected: {
      id: string;
      carrierId: string;
      objective: string;
      stepSurfaces: string[];
      stepRefs: string[];
      merchantVisible: Record<string, string>;
      blockedMaterial: string[];
      labelIntent: {
        id: string;
        status: string;
        proofLevel: string;
        evidenceTypes: string[];
        privacy: Record<string, boolean>;
      };
      localOnly: boolean;
      productionTraffic: boolean;
      rawAddressFixtures: boolean;
      validationErrors: string[];
    };
  };
  const smoke = runSandboxCarrierGatewaySmoke(fixture.input);
  assert.equal(fixture.input.addressFormVersion, 'wallet_country_form_ref_synthetic_only');
  const summary = {
    id: smoke.id,
    carrierId: smoke.carrierId,
    objective: smoke.objective,
    stepSurfaces: smoke.steps.map(step => step.surface),
    stepRefs: smoke.steps.map(step => step.ref),
    merchantVisible: smoke.merchantVisible,
    blockedMaterial: smoke.blockedMaterial,
    labelIntent: {
      id: smoke.labelIntent.id,
      status: smoke.labelIntent.status,
      proofLevel: smoke.labelIntent.proofLevel,
      evidenceTypes: smoke.labelIntent.evidence.map(evidence => evidence.type),
      privacy: {
        rawAddressStored: smoke.labelIntent.privacy.rawAddressStored,
        rawAgidStored: smoke.labelIntent.privacy.rawAgidStored,
        rawAoidStored: smoke.labelIntent.privacy.rawAoidStored,
        rawRecipientStored: smoke.labelIntent.privacy.rawRecipientStored,
        rawProofCodeStored: smoke.labelIntent.privacy.rawProofCodeStored,
        rawLabelPayloadStored: smoke.labelIntent.privacy.rawLabelPayloadStored,
        carrierApiKeyStored: smoke.labelIntent.privacy.carrierApiKeyStored,
      },
    },
    localOnly: smoke.localOnly,
    productionTraffic: smoke.productionTraffic,
    rawAddressFixtures: smoke.rawAddressFixtures,
    validationErrors: smoke.validationErrors,
  };

  assert.deepEqual(summary, fixture.expected);
  assert.doesNotMatch(JSON.stringify(fixture.expected.merchantVisible), /rawAddress|recipientName|phone|carrierApiKey|rawLabelPayload|proofWitness/);
  assert.equal(fixture.expected.productionTraffic, false);
});

test('sandbox carrier gateway smoke fixture conforms to its schema contract', () => {
  const fixture = JSON.parse(readFileSync('docs/specs/fixtures/delivery-gateway-sandbox-carrier-smoke-v0.1.json', 'utf8')) as unknown;
  const schema = JSON.parse(readFileSync('docs/specs/schemas/delivery-gateway-sandbox-carrier-smoke-v0.1.schema.json', 'utf8')) as JsonSchemaSubset & {
    $schema?: string;
    $id?: string;
  };

  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.match(schema.$id ?? '', /delivery-gateway-sandbox-carrier-smoke-v0.1\.schema\.json/);
  assert.deepEqual(validateJsonWithSchemaSubset(fixture, schema), []);
  assert.doesNotMatch(JSON.stringify(schema), /production carrier credential store|raw recipient payload/);
});

test('Delivery Gateway OpenAPI exposes rate quote and carrier allocation without private material', () => {
  const openapi = readFileSync('docs/specs/delivery-gateway-carrier-api.openapi.yaml', 'utf8');

  assert.match(openapi, /\/v1\/delivery\/rates:/);
  assert.match(openapi, /operationId: quoteDeliveryRates/);
  assert.match(openapi, /\/v1\/delivery\/allocate:/);
  assert.match(openapi, /operationId: allocateDeliveryCarrier/);
  assert.match(openapi, /\/v1\/shipments:/);
  assert.match(openapi, /operationId: createSkipshipShipment/);
  assert.match(openapi, /\/v1\/hexaship\/mvp-v0\.1\/shipments:/);
  assert.match(openapi, /operationId: createHexashipMvpV01Shipment/);
  assert.match(openapi, /\/v1\/delivery\/webhooks\/tracking:/);
  assert.match(openapi, /operationId: receiveDeliveryTrackingWebhook/);
  assert.match(openapi, /Skipship-Signature/);
  assert.match(openapi, /TrackingWebhookRequest/);
  assert.match(openapi, /TrackingWebhookReceipt/);
  assert.match(openapi, /RateQuoteRequest/);
  assert.match(openapi, /CarrierAllocationRequest/);
  assert.match(openapi, /SkipshipShipmentCreateRequest/);
  assert.match(openapi, /SkipshipShipmentCreateResult/);
  assert.match(openapi, /HexashipMvpV01ShipmentRequest/);
  assert.match(openapi, /HexashipMvpV01ShipmentResult/);
  assert.match(openapi, /runHexashipMvpV01Sandbox/);
  assert.match(openapi, /addressAliasRef/);
  assert.match(openapi, /recipientId/);
  assert.match(openapi, /addressFormVersion/);
  assert.match(openapi, /wallet_country_form_ref_synthetic_001/);
  assert.match(openapi, /Address Wallet country-form version ref/);
  assert.match(openapi, /walletConsentRef/);
  assert.match(openapi, /shipping\.createShipment/);
  assert.match(openapi, /createShipment/);
  assert.match(openapi, /fastest/);
  assert.match(openapi, /cheapest/);
  assert.match(openapi, /not-real-dhl-or-ups-purchase/);
  assert.match(openapi, /shipment\.label_created/);
  assert.match(openapi, /not-real-label-purchase/);
  assert.doesNotMatch(openapi, /rawAddress:/);
  assert.doesNotMatch(openapi, /recipientPhone:/);
  assert.doesNotMatch(openapi, /carrierApiKey:/);
  assert.doesNotMatch(openapi, /proofWitness:/);
});
