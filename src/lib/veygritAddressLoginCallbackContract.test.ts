import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  VEYGRIT_ADDRESS_LOGIN_CALLBACK_NON_CLAIMS,
  VEYGRIT_ADDRESS_LOGIN_CALLBACK_PARAM_ALIASES,
  VEYGRIT_ADDRESS_LOGIN_CANONICAL_CALLBACK_PARAMS,
  VEYGRIT_ADDRESS_LOGIN_FORBIDDEN_CALLBACK_PARAM_EXAMPLES,
  getVeygritAddressLoginAcceptedCallbackParams,
  isForbiddenVeygritAddressLoginCallbackMaterial,
  isForbiddenVeygritAddressLoginCallbackParam,
  validateVeygritAddressLoginCallbackParams,
} from './veygritAddressLoginCallbackContract';

test('Veygrit Address Login callback contract defines canonical refs, aliases, and non-claims', () => {
  assert.deepEqual(
    VEYGRIT_ADDRESS_LOGIN_CANONICAL_CALLBACK_PARAMS.filter(param =>
      ['code', 'state', 'iss', 'session_ref', 'credential_ref', 'proof_bundle_ref', 'carrier_handoff_ref'].includes(param),
    ),
    ['code', 'state', 'iss', 'session_ref', 'credential_ref', 'proof_bundle_ref', 'carrier_handoff_ref'],
  );

  assert.deepEqual(VEYGRIT_ADDRESS_LOGIN_CALLBACK_PARAM_ALIASES.proofBundleRef, ['proof_ref']);
  assert.deepEqual(VEYGRIT_ADDRESS_LOGIN_CALLBACK_PARAM_ALIASES.carrierHandoffRef, ['handoff_ref']);
  assert.ok(VEYGRIT_ADDRESS_LOGIN_CALLBACK_NON_CLAIMS.some(nonClaim => /not address resolution evidence/i.test(nonClaim)));
});

test('Veygrit Address Login callback contract rejects private material names', () => {
  for (const forbiddenParam of VEYGRIT_ADDRESS_LOGIN_FORBIDDEN_CALLBACK_PARAM_EXAMPLES) {
    assert.equal(isForbiddenVeygritAddressLoginCallbackParam(forbiddenParam), true, forbiddenParam);
  }

  for (const safeParam of getVeygritAddressLoginAcceptedCallbackParams()) {
    assert.equal(isForbiddenVeygritAddressLoginCallbackParam(safeParam), false, safeParam);
  }

  assert.equal(isForbiddenVeygritAddressLoginCallbackMaterial('proof_secret_fixture_value'), true);
  assert.equal(isForbiddenVeygritAddressLoginCallbackMaterial('cred_ref_synthetic_address_001'), false);
});

test('React and Next.js SDKs accept the shared callback reference parameter contract', () => {
  const reactSource = readFileSync('sdk/veygrit-address-login-react/src/index.ts', 'utf8');
  const nextSource = readFileSync('sdk/veygrit-address-login-nextjs/src/server.ts', 'utf8');

  for (const requiredParam of ['session_ref', 'credential_ref', 'proof_bundle_ref', 'proof_ref', 'carrier_handoff_ref', 'handoff_ref']) {
    assert.match(reactSource, new RegExp(requiredParam), `React SDK missing ${requiredParam}`);
    assert.match(nextSource, new RegExp(requiredParam), `Next.js SDK missing ${requiredParam}`);
  }

  assert.match(reactSource, /params\.get\('proof_bundle_ref'\) \?\? params\.get\('proof_ref'\)/);
  assert.match(reactSource, /params\.get\('carrier_handoff_ref'\) \?\? params\.get\('handoff_ref'\)/);
  assert.match(nextSource, /params\.get\('proof_bundle_ref'\) \?\? params\.get\('proof_ref'\)/);
  assert.match(nextSource, /params\.get\('carrier_handoff_ref'\) \?\? params\.get\('handoff_ref'\)/);
});

test('offline callback validator normalizes aliases and rejects unsafe params', () => {
  const valid = validateVeygritAddressLoginCallbackParams(
    {
      code: 'code_ref_synthetic_shipping_001',
      state: 'state_synthetic_shipping_001',
      issuer: 'https://login.veygrit.example',
      session_ref: 'session_ref_synthetic_shipping_001',
      credential_ref: 'cred_ref_synthetic_address_001',
      proof_ref: 'proof_ref_synthetic_shipping_001',
      handoff_ref: 'handoff_ref_synthetic_shipping_001',
    },
    {
      expectedState: 'state_synthetic_shipping_001',
      allowedIssuer: 'https://login.veygrit.example',
      requireCode: true,
      requireSessionRef: true,
      requireCredentialRef: true,
      requireProofBundleRef: true,
      requireCarrierHandoffRef: true,
    },
  );

  assert.equal(valid.status, 'accepted');
  assert.deepEqual(valid.errors, []);
  assert.equal(valid.normalizedParams.iss, 'https://login.veygrit.example');
  assert.equal(valid.normalizedParams.proof_bundle_ref, 'proof_ref_synthetic_shipping_001');
  assert.equal(valid.normalizedParams.carrier_handoff_ref, 'handoff_ref_synthetic_shipping_001');

  const badState = validateVeygritAddressLoginCallbackParams(
    {
      code: 'code_ref_synthetic_shipping_001',
      state: 'state_synthetic_tampered_001',
      iss: 'https://login.veygrit.example',
      credential_ref: 'cred_ref_synthetic_address_001',
      proof_bundle_ref: 'proof_ref_synthetic_shipping_001',
    },
    {
      expectedState: 'state_synthetic_shipping_001',
      allowedIssuer: 'https://login.veygrit.example',
      requireCode: true,
      requireCredentialRef: true,
      requireProofBundleRef: true,
    },
  );
  assert.equal(badState.status, 'rejected');
  assert.ok(badState.errors.includes('state_mismatch'));

  const forbidden = validateVeygritAddressLoginCallbackParams({
    code: 'code_ref_synthetic_shipping_001',
    state: 'state_synthetic_shipping_001',
    iss: 'https://login.veygrit.example',
    raw_address: 'blocked_fixture_value',
  });
  assert.equal(forbidden.status, 'rejected');
  assert.ok(forbidden.errors.includes('forbidden_callback_param'));
  assert.deepEqual(forbidden.forbiddenParams, ['raw_address']);

  const forbiddenValue = validateVeygritAddressLoginCallbackParams({
    code: 'code_ref_synthetic_shipping_001',
    state: 'state_synthetic_shipping_001',
    iss: 'https://login.veygrit.example',
    credential_ref: 'proof_secret_fixture_value',
  });
  assert.equal(forbiddenValue.status, 'rejected');
  assert.ok(forbiddenValue.errors.includes('forbidden_callback_param'));
  assert.deepEqual(forbiddenValue.forbiddenParams, ['credential_ref']);
  assert.equal(forbiddenValue.normalizedParams.credential_ref, undefined);
});
