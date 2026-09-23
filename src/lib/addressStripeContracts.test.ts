import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createShipmentIntentSandbox } from './addressStripeFoundation';

type JsonSchema = {
  title?: string;
  type?: string;
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  enum?: string[];
  const?: unknown;
  additionalProperties?: boolean;
  minItems?: number;
  minLength?: number;
};

function readSchema(path: string): JsonSchema {
  return JSON.parse(readFileSync(path, 'utf8')) as JsonSchema;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

function validateFixtureAgainstSchema(value: unknown, schema: JsonSchema, path = '$'): string[] {
  const errors: string[] = [];

  if (Object.hasOwn(schema, 'const') && value !== schema.const) {
    errors.push(`${path}: expected const ${String(schema.const)}`);
  }
  if (schema.enum && !schema.enum.includes(value as string)) {
    errors.push(`${path}: expected one of ${schema.enum.join(', ')}`);
  }
  if (schema.type === 'object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return [`${path}: expected object`];
    const record = value as Record<string, unknown>;
    for (const required of schema.required ?? []) {
      if (!Object.hasOwn(record, required)) errors.push(`${path}: missing required ${required}`);
    }
    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(record)) {
        if (!Object.hasOwn(schema.properties, key)) errors.push(`${path}.${key}: additional property not allowed`);
      }
    }
    for (const [key, childSchema] of Object.entries(schema.properties ?? {})) {
      if (Object.hasOwn(record, key)) {
        errors.push(...validateFixtureAgainstSchema(record[key], childSchema, `${path}.${key}`));
      }
    }
  }
  if (schema.type === 'array') {
    if (!Array.isArray(value)) return [`${path}: expected array`];
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path}: expected at least ${schema.minItems} items`);
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateFixtureAgainstSchema(item, schema.items!, `${path}[${index}]`));
      });
    }
  }
  if (schema.type === 'string') {
    if (typeof value !== 'string') errors.push(`${path}: expected string`);
    else if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path}: expected minLength ${schema.minLength}`);
  }
  if (schema.type === 'number' && typeof value !== 'number') errors.push(`${path}: expected number`);
  if (schema.type === 'boolean' && typeof value !== 'boolean') errors.push(`${path}: expected boolean`);

  return errors;
}

const contractPairs = [
  ['ShipmentIntent v0.1', 'docs/specs/schemas/shipment-intent-v0.1.schema.json', 'docs/specs/fixtures/shipment-intent-v0.1.json'],
  ['RateQuote v0.1', 'docs/specs/schemas/rate-quote-v0.1.schema.json', 'docs/specs/fixtures/rate-quote-v0.1.json'],
  ['CarrierAllocation v0.1', 'docs/specs/schemas/carrier-allocation-v0.1.schema.json', 'docs/specs/fixtures/carrier-allocation-v0.1.json'],
] as const;

test('Address Stripe starter contracts validate their synthetic fixtures', () => {
  for (const [title, schemaPath, fixturePath] of contractPairs) {
    const schema = readSchema(schemaPath);
    const fixture = readJson(fixturePath);

    assert.equal(schema.title, title);
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual(validateFixtureAgainstSchema(fixture, schema), [], `${title} fixture should match schema`);
  }
});

test('Address Stripe starter contracts reject public raw-address and carrier-secret surfaces by construction', () => {
  for (const [, schemaPath, fixturePath] of contractPairs) {
    const schemaText = readFileSync(schemaPath, 'utf8');
    const fixtureText = readFileSync(fixturePath, 'utf8');

    assert.doesNotMatch(schemaText, /"raw_address"|"recipient_phone"|"carrier_api_key"|"proof_witness"|"private_key"|"proof_secret"/i);
    assert.doesNotMatch(fixtureText, /recipientPhone|carrierApiKey|proofWitness|privateKey|proofSecret|production carrier/i);
    assert.match(fixtureText, /"contains_raw_address": false/);
    assert.match(fixtureText, /"production_traffic": false/);
  }
});

test('ShipmentIntent, RateQuote, and CarrierAllocation are linked by refs', () => {
  const shipmentIntent = readJson('docs/specs/fixtures/shipment-intent-v0.1.json') as Record<string, unknown>;
  const rateQuote = readJson('docs/specs/fixtures/rate-quote-v0.1.json') as Record<string, unknown>;
  const allocation = readJson('docs/specs/fixtures/carrier-allocation-v0.1.json') as Record<string, unknown>;

  assert.equal(rateQuote.shipment_intent_ref, shipmentIntent.intent_id);
  assert.equal(allocation.shipment_intent_ref, shipmentIntent.intent_id);
  assert.equal(allocation.rate_quote_ref, rateQuote.rate_quote_ref);
  assert.equal(allocation.wallet_consent_ref, shipmentIntent.wallet_consent_ref);
});

test('Address Stripe starter contracts preserve explicit non-claims', () => {
  const combined = contractPairs
    .map(([, , fixturePath]) => JSON.stringify(readJson(fixturePath)))
    .join('\n');

  assert.match(combined, /not a carrier label purchase/);
  assert.match(combined, /not a carrier SLA/);
  assert.match(combined, /not final settlement/);
  assert.match(combined, /not wallet consent/);
});

test('createShipmentIntentSandbox creates a schema-compatible shipment intent body from refs', () => {
  const response = createShipmentIntentSandbox({
    merchantRef: 'merchant_synthetic_demo',
    recipientTokenRef: 'rectok_synthetic_friend_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_001',
    addressValidationRef: 'addrval_synthetic_001',
    walletConsentRef: 'consent_synthetic_001',
    servicePreference: 'cheapest',
    requestedAt: '2026-07-04T00:00:00.000Z',
  });

  assert.equal(response.ok, true);
  assert.equal(response.status, 201);
  if (!response.ok) throw new Error('expected success');

  const schema = readSchema('docs/specs/schemas/shipment-intent-v0.1.schema.json');
  const schemaBody = {
    version: response.body.version,
    intent_id: response.body.intent_id,
    merchant_ref: response.body.merchant_ref,
    recipient_token_ref: response.body.recipient_token_ref,
    parcel_profile_ref: response.body.parcel_profile_ref,
    service_preference: response.body.service_preference,
    address_validation_ref: response.body.address_validation_ref,
    wallet_consent_ref: response.body.wallet_consent_ref,
    status: response.body.status,
    required_next_action: response.body.required_next_action,
    privacy: response.body.privacy,
    non_claims: response.body.non_claims,
  };

  assert.deepEqual(validateFixtureAgainstSchema(schemaBody, schema), []);
  assert.equal(response.body.status, 'ready_for_rate_quote');
  assert.equal(response.body.required_next_action, 'quote_rates');
  assert.equal(response.body.privacy.contains_raw_address, false);
  assert.equal(response.body.local_only, true);
});

test('createShipmentIntentSandbox can pause on missing wallet consent without exposing address', () => {
  const response = createShipmentIntentSandbox({
    merchantRef: 'merchant_synthetic_demo',
    recipientTokenRef: 'rectok_synthetic_friend_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_001',
    addressValidationRef: 'addrval_synthetic_001',
  });

  assert.equal(response.ok, true);
  if (!response.ok) throw new Error('expected success');
  assert.equal(response.body.wallet_consent_ref, 'consent_required');
  assert.equal(response.body.status, 'requires_wallet_consent');
  assert.equal(response.body.required_next_action, 'request_wallet_consent');
  assert.equal(response.body.privacy.contains_raw_address, false);
});

test('createShipmentIntentSandbox rejects raw address, carrier secrets, and proof material', () => {
  const response = createShipmentIntentSandbox({
    merchantRef: 'merchant_synthetic_demo',
    recipientTokenRef: 'rectok_synthetic_friend_001',
    parcelProfileRef: 'parcel_profile_synthetic_small_001',
    addressValidationRef: 'addrval_synthetic_001',
    rawAddress: 'SYNTHETIC BUT STILL FORBIDDEN',
    carrierApiKey: 'carrier_test_secret_forbidden',
    nested: {
      proofWitness: 'forbidden',
      privateKey: 'forbidden',
    },
  });

  assert.equal(response.ok, false);
  assert.equal(response.status, 400);
  if (response.ok) throw new Error('expected rejection');
  assert.equal(response.error, 'private_material_rejected');
  assert.ok(response.rejectedKeys?.includes('rawAddress'));
  assert.ok(response.rejectedKeys?.includes('carrierApiKey'));
  assert.ok(response.rejectedKeys?.includes('proofWitness'));
  assert.ok(response.rejectedKeys?.includes('privateKey'));
});
