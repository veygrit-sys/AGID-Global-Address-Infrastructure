import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type HostedCallbackValidationVector = {
  id: string;
  input: Record<string, string>;
  options: {
    expectedState?: string;
    allowedIssuer?: string;
    [key: string]: unknown;
  };
  expectedResult: 'accepted' | 'rejected';
  expectedError?: 'state_mismatch' | 'forbidden_callback_param' | 'missing_code';
  expectedNormalizedParams?: Record<string, string>;
};

const FORBIDDEN_NORMALIZED_CALLBACK_MATERIAL_PATTERN =
  /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret|provider.?id.?token|provider.?access.?token|provider.?refresh.?token|raw.?provider.?profile|carrier.?api.?key|production.?credential/i;

export function loadHostedCallbackValidationVectors(): HostedCallbackValidationVector[] {
  const fixturePath = [
    'docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json',
    join('..', '..', 'docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json'),
  ].find(candidate => existsSync(candidate));
  assert.ok(fixturePath, 'hosted Address Login fixture is required');
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
    callbackValidationVectors: HostedCallbackValidationVector[];
  };
  return fixture.callbackValidationVectors;
}

export function assertHostedCallbackNormalizedParamsAreRedacted(
  vectors = loadHostedCallbackValidationVectors(),
): void {
  const acceptedVectors = vectors.filter(vector => vector.expectedResult === 'accepted');
  assert.ok(acceptedVectors.length > 0, 'at least one accepted hosted callback vector is required');

  for (const vector of acceptedVectors) {
    assert.ok(vector.expectedNormalizedParams, `${vector.id} should declare normalized callback params`);
    for (const [key, value] of Object.entries(vector.expectedNormalizedParams)) {
      assert.doesNotMatch(key, FORBIDDEN_NORMALIZED_CALLBACK_MATERIAL_PATTERN, `${vector.id}:${key}`);
      assert.doesNotMatch(value, FORBIDDEN_NORMALIZED_CALLBACK_MATERIAL_PATTERN, `${vector.id}:${key}`);
    }
  }
}

export function expectedCallbackErrorPattern(vector: HostedCallbackValidationVector): RegExp {
  switch (vector.expectedError) {
    case 'state_mismatch':
      return /state mismatch/;
    case 'forbidden_callback_param':
      return /Unsafe Address Login callback parameter/;
    case 'missing_code':
      return /missing authorization code/;
    default:
      return /Address Login callback/;
  }
}
