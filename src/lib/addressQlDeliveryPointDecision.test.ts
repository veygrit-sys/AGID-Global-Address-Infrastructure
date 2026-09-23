import assert from 'node:assert/strict';
import {
  generateKeyPairSync,
  sign,
  type KeyObject,
} from 'node:crypto';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { type TestContext } from 'node:test';

import {
  ADDRESSQL_CARRIER_TRUST_STORE_VERSION,
  ADDRESSQL_L5_CARRIER_ASSERTION_VERSION,
  ADDRESSQL_L5_DELIVERY_POINT_REQUEST_VERSION,
  buildAddressQlL5CarrierAssertionPayload,
  loadAddressQlDeliveryPointVerifier,
  type AddressQlL5CarrierAssertion,
} from './addressQlDeliveryPointDecision';

const NOW = '2026-07-27T00:00:00Z';
const ASSESSED_AT = '2026-07-26T23:55:00Z';
const EXPIRES_AT = '2026-07-27T01:00:00Z';
const COMMITMENT = `sha256:${'a'.repeat(64)}`;
const digest = (character: string) => `sha256:${character.repeat(64)}`;

function publicPem(key: KeyObject) {
  return key.export({ type: 'spki', format: 'pem' }).toString();
}

function fixture(context: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), 'addressql-l5-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const carrierA = generateKeyPairSync('ed25519');
  const carrierB = generateKeyPairSync('ed25519');
  const trustStorePath = join(directory, 'carrier-trust.json');
  writeFileSync(trustStorePath, `${JSON.stringify({
    version: ADDRESSQL_CARRIER_TRUST_STORE_VERSION,
    keys: {
      'carrier-a-key': {
        carrierId: 'carrier-a',
        countryCodes: ['JP'],
        publicKey: publicPem(carrierA.publicKey),
        status: 'active',
        validFrom: '2026-07-01T00:00:00Z',
        validUntil: '2027-07-01T00:00:00Z',
      },
      'carrier-b-key': {
        carrierId: 'carrier-b',
        countryCodes: ['JP'],
        publicKey: publicPem(carrierB.publicKey),
        status: 'active',
        validFrom: '2026-07-01T00:00:00Z',
        validUntil: '2027-07-01T00:00:00Z',
      },
    },
  }, null, 2)}\n`);
  return {
    trustStorePath,
    verifier: loadAddressQlDeliveryPointVerifier(trustStorePath, { now: NOW }),
    carrierA,
    carrierB,
  };
}

function assertion(input: {
  carrierId: string;
  keyId: string;
  privateKey: KeyObject;
  decision: AddressQlL5CarrierAssertion['decision'];
  assertionId?: string;
  commitment?: string;
  assessedAt?: string;
  expiresAt?: string;
}) {
  const unsigned: Omit<AddressQlL5CarrierAssertion, 'signature'> = {
    version: ADDRESSQL_L5_CARRIER_ASSERTION_VERSION,
    assertionId: input.assertionId ?? `${input.carrierId}-assertion`,
    carrierId: input.carrierId,
    keyId: input.keyId,
    countryCode: 'JP',
    deliveryPointCommitment: input.commitment ?? COMMITMENT,
    serviceLevel: 'standard',
    decision: input.decision,
    sourceVersion: 'synthetic-v1',
    evidenceDigest: digest(input.carrierId === 'carrier-a' ? 'b' : 'c'),
    assessedAt: input.assessedAt ?? ASSESSED_AT,
    expiresAt: input.expiresAt ?? EXPIRES_AT,
  };
  return {
    ...unsigned,
    signature: sign(
      null,
      Buffer.from(buildAddressQlL5CarrierAssertionPayload(unsigned), 'utf8'),
      input.privateKey,
    ).toString('base64'),
  };
}

function request(assertions: AddressQlL5CarrierAssertion[]) {
  return {
    version: ADDRESSQL_L5_DELIVERY_POINT_REQUEST_VERSION,
    countryCode: 'JP',
    deliveryPointCommitment: COMMITMENT,
    serviceLevel: 'standard',
    assertions,
  };
}

test('signed L5 carrier assertion yields a commitment-only point decision', context => {
  const files = fixture(context);
  const output = files.verifier.assess(request([
    assertion({
      carrierId: 'carrier-a',
      keyId: 'carrier-a-key',
      privateKey: files.carrierA.privateKey,
      decision: 'reachable',
    }),
  ]));

  assert.equal(output.level, 'L5');
  assert.equal(output.scope, 'delivery-point');
  assert.equal(output.status, 'pass');
  assert.equal(output.signatureVerified, true);
  assert.equal(output.stopProcessing, false);
  assert.equal(output.boundaries.l4DeliveryAreaNotEvaluated, true);
  assert.equal(output.privacy.acceptsRawAddress, false);
  assert.doesNotMatch(JSON.stringify(output), new RegExp(COMMITMENT));
});

test('different carrier decisions become conflict and stop processing', context => {
  const files = fixture(context);
  const output = files.verifier.assess(request([
    assertion({
      carrierId: 'carrier-a',
      keyId: 'carrier-a-key',
      privateKey: files.carrierA.privateKey,
      decision: 'reachable',
    }),
    assertion({
      carrierId: 'carrier-b',
      keyId: 'carrier-b-key',
      privateKey: files.carrierB.privateKey,
      decision: 'unreachable',
    }),
  ]));

  assert.equal(output.status, 'conflict');
  assert.equal(output.decision, 'conflict');
  assert.equal(output.processingDirective, 'stop_conflict');
  assert.equal(output.stopProcessing, true);
  assert.deepEqual(output.carrierIds, ['carrier-a', 'carrier-b']);
});

test('unknown disagreement is also fail-closed as conflict', context => {
  const files = fixture(context);
  const output = files.verifier.assess(request([
    assertion({
      carrierId: 'carrier-a',
      keyId: 'carrier-a-key',
      privateKey: files.carrierA.privateKey,
      decision: 'reachable',
    }),
    assertion({
      carrierId: 'carrier-b',
      keyId: 'carrier-b-key',
      privateKey: files.carrierB.privateKey,
      decision: 'unknown',
    }),
  ]));

  assert.equal(output.status, 'conflict');
  assert.equal(output.stopProcessing, true);
});

test('tampering, scope mismatch, and duplicate carrier assertions are rejected', context => {
  const files = fixture(context);
  const signed = assertion({
    carrierId: 'carrier-a',
    keyId: 'carrier-a-key',
    privateKey: files.carrierA.privateKey,
    decision: 'reachable',
  });

  assert.throws(
    () => files.verifier.assess(request([
      { ...signed, decision: 'unreachable' },
    ])),
    /signature is invalid/,
  );
  assert.throws(
    () => files.verifier.assess({
      ...request([signed]),
      deliveryPointCommitment: digest('d'),
    }),
    /does not match/,
  );
  assert.throws(
    () => files.verifier.assess(request([
      signed,
      { ...signed, assertionId: 'carrier-a-duplicate' },
    ])),
    /at most one assertion per carrier/,
  );
});

test('duplicate assertion ids are rejected even when carriers differ', context => {
  const files = fixture(context);
  const assertionId = 'shared-assertion-id';

  assert.throws(
    () => files.verifier.assess(request([
      assertion({
        assertionId,
        carrierId: 'carrier-a',
        keyId: 'carrier-a-key',
        privateKey: files.carrierA.privateKey,
        decision: 'reachable',
      }),
      assertion({
        assertionId,
        carrierId: 'carrier-b',
        keyId: 'carrier-b-key',
        privateKey: files.carrierB.privateKey,
        decision: 'reachable',
      }),
    ])),
    /duplicate assertion ids/,
  );
});

test('a carrier trust store without an active key fails closed', context => {
  const directory = mkdtempSync(join(tmpdir(), 'addressql-l5-no-active-key-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const carrier = generateKeyPairSync('ed25519');
  const trustStorePath = join(directory, 'carrier-trust.json');
  writeFileSync(trustStorePath, `${JSON.stringify({
    version: ADDRESSQL_CARRIER_TRUST_STORE_VERSION,
    keys: {
      'carrier-a-key': {
        carrierId: 'carrier-a',
        countryCodes: ['JP'],
        publicKey: publicPem(carrier.publicKey),
        status: 'revoked',
        validFrom: '2026-07-01T00:00:00Z',
        validUntil: '2027-07-01T00:00:00Z',
      },
    },
  }, null, 2)}\n`);

  assert.throws(
    () => loadAddressQlDeliveryPointVerifier(trustStorePath, { now: NOW }),
    /no active keys/,
  );
});

test('assertion expiry is evaluated at each assessment, not only at startup', context => {
  const directory = mkdtempSync(join(tmpdir(), 'addressql-l5-clock-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const carrier = generateKeyPairSync('ed25519');
  const trustStorePath = join(directory, 'carrier-trust.json');
  writeFileSync(trustStorePath, `${JSON.stringify({
    version: ADDRESSQL_CARRIER_TRUST_STORE_VERSION,
    keys: {
      'carrier-a-key': {
        carrierId: 'carrier-a',
        countryCodes: ['JP'],
        publicKey: publicPem(carrier.publicKey),
        status: 'active',
        validFrom: '2026-07-01T00:00:00Z',
        validUntil: '2027-07-01T00:00:00Z',
      },
    },
  }, null, 2)}\n`);
  let now = NOW;
  const verifier = loadAddressQlDeliveryPointVerifier(
    trustStorePath,
    { now: () => now },
  );
  const signed = assertion({
    carrierId: 'carrier-a',
    keyId: 'carrier-a-key',
    privateKey: carrier.privateKey,
    decision: 'reachable',
  });

  assert.equal(verifier.assess(request([signed])).status, 'pass');
  now = '2026-07-27T02:00:00Z';
  assert.throws(
    () => verifier.assess(request([signed])),
    /stale or outside key validity/,
  );
});

test('raw address fields and expired assertions never enter the L5 contract', context => {
  const files = fixture(context);
  const signed = assertion({
    carrierId: 'carrier-a',
    keyId: 'carrier-a-key',
    privateKey: files.carrierA.privateKey,
    decision: 'reachable',
  });

  assert.throws(
    () => files.verifier.assess({
      ...request([signed]),
      rawAddress: 'not accepted',
    }),
    /unsupported fields/,
  );
  const expired = assertion({
    carrierId: 'carrier-a',
    keyId: 'carrier-a-key',
    privateKey: files.carrierA.privateKey,
    decision: 'reachable',
    assessedAt: '2026-07-26T21:00:00Z',
    expiresAt: '2026-07-26T22:00:00Z',
  });
  assert.throws(
    () => files.verifier.assess(request([expired])),
    /stale or outside key validity/,
  );
});
