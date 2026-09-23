import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { verifyVeygritIdProductionOpenApiText } from './verify-veygrit-id-production-openapi';

const productionOpenApi = readFileSync('docs/specs/veygrit-id-production.openapi.yaml', 'utf8');

test('production OpenAPI verifier accepts the checked-in Google/Apple-only contract', () => {
  const result = verifyVeygritIdProductionOpenApiText(productionOpenApi, { openApiPath: 'inline-production-openapi' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test('production OpenAPI verifier fails if social providers expand beyond Google/Apple', () => {
  const unsafeOpenApi = productionOpenApi.replace('enum: [google, apple]', 'enum: [google, apple, github]');
  const result = verifyVeygritIdProductionOpenApiText(unsafeOpenApi, { openApiPath: 'inline-unsafe-provider-openapi' });

  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /social-callback-provider-enum-must-equal:google,apple/);
  assert.match(result.errors.join('\n'), /openapi-banned-pattern/);
});

test('production OpenAPI verifier fails if private wallet material fields appear', () => {
  const unsafeOpenApi = productionOpenApi.replace(
    '                code: { type: string, minLength: 1 }\n                code_verifier: { type: string, minLength: 43, maxLength: 128 }',
    [
      '                code: { type: string, minLength: 1 }',
      '                privateKey: { type: string }',
      '                proof_secret: { type: string }',
      '                rawRecipient: { type: object }',
      '                code_verifier: { type: string, minLength: 43, maxLength: 128 }',
    ].join('\n'),
  );
  const result = verifyVeygritIdProductionOpenApiText(unsafeOpenApi, {
    openApiPath: 'inline-private-material-openapi',
  });

  assert.equal(result.ok, false);
  const errors = result.errors.join('\n');
  assert.match(errors, /openapi-banned-pattern/);
  assert.match(errors, /privateKey\|private_key/);
  assert.match(errors, /proofSecret\|proof_secret/);
  assert.match(errors, /rawRecipient\|raw_recipient/);
});
