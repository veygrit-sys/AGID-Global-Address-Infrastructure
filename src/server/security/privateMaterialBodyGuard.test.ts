import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertNoPrivateMaterialBodyKeys,
  containsPrivateMaterialBodyKey,
  PRIVATE_MATERIAL_BODY_ERROR,
} from './privateMaterialBodyGuard';

test('private material body guard accepts normal OAuth callback fields', () => {
  const callbackBody = {
    request_ref: 'vey_auth_req_safe_callback',
    state: 'state-value-1234567890',
    code: 'provider-code-reference',
    code_verifier: 'v'.repeat(64),
    nonce: 'nonce-value-1234567890',
    client_secret: 'oauth-client-secret-field-name-allowed-outside-guard-keyset',
  };

  assert.equal(containsPrivateMaterialBodyKey(callbackBody), false);
  assert.doesNotThrow(() => assertNoPrivateMaterialBodyKeys(callbackBody));
});

test('private material body guard detects nested object and array keys without inspecting values', () => {
  const nestedBody = {
    request_ref: 'vey_auth_req_nested_callback',
    state: 'state-value-abcdefgh',
    metadata: [
      { safe_ref: 'field-name-only' },
      {
        wallet: {
          proof_secret: null,
        },
      },
    ],
  };

  assert.equal(containsPrivateMaterialBodyKey(nestedBody), true);
  assert.throws(() => assertNoPrivateMaterialBodyKeys(nestedBody), new RegExp(PRIVATE_MATERIAL_BODY_ERROR));
});
