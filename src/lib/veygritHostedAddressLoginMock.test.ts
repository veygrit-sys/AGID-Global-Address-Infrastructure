import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parse } from 'yaml';

import type { HostedAddressLoginFixtureSet } from './veygritHostedAddressLoginContract';
import { buildHostedAddressLoginPublicTestVectorResult } from './veygritHostedAddressLoginContract';
import {
  buildFriendDeliveryMerchantIntegrationChecklist,
  createHostedAddressLoginMock,
  type HostedAddressLoginMockRequest,
  runFriendDeliveryMerchantScenarioSmoke,
  runHostedAddressLoginMockSmoke,
} from './veygritHostedAddressLoginMock';

function loadFixtures(): HostedAddressLoginFixtureSet {
  return JSON.parse(readFileSync('docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json', 'utf8')) as HostedAddressLoginFixtureSet;
}

type OpenApiSchema = {
  $ref?: string;
  type?: 'object' | 'array' | 'string' | 'number' | 'boolean';
  required?: string[];
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  additionalProperties?: boolean | OpenApiSchema;
  enum?: unknown[];
  const?: unknown;
  oneOf?: OpenApiSchema[];
};

type OpenApiResponse = {
  $ref?: string;
  content?: {
    'application/json'?: {
      schema?: OpenApiSchema;
    };
  };
};

type OpenApiOperation = {
  parameters?: Array<{ name: string; required?: boolean }>;
  responses?: Record<string, OpenApiResponse>;
};

type OpenApiPathItem = {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
};

type OpenApiObject = {
  paths: Record<string, OpenApiPathItem>;
  components: {
    responses: Record<string, OpenApiResponse>;
    schemas: Record<string, OpenApiSchema>;
  };
};

function loadOpenApi(): OpenApiObject {
  return parse(readFileSync('docs/specs/veygrit-address-login-hosted.openapi.yaml', 'utf8')) as OpenApiObject;
}

function authorizeQueryFromFixture(vector: HostedAddressLoginFixtureSet['authorizeRequests'][number]) {
  return {
    client_id: vector.clientId,
    redirect_uri: vector.redirectUri,
    response_type: vector.responseType as string,
    state: vector.state,
    nonce: vector.nonce,
    code_challenge: vector.codeChallenge,
    code_challenge_method: vector.codeChallengeMethod,
    purpose: String(vector.purpose),
    disclosure_mode: vector.disclosureMode,
    risk_level: String(vector.riskLevel),
    requested_claims: vector.requestedClaims.join(' '),
    display_language_mode: String(vector.displayLanguageMode),
  };
}

function withoutKey<T extends Record<string, unknown>>(value: T, key: string): Record<string, unknown> {
  const clone = { ...value };
  delete clone[key];
  return clone;
}

function successRouteInputs(fixtures: HostedAddressLoginFixtureSet): Record<string, HostedAddressLoginMockRequest> {
  const shippingAuth = fixtures.authorizeRequests.find(vector => vector.disclosureMode === 'carrier_decryptable');
  assert.ok(shippingAuth);

  return {
    'GET /capabilities': { method: 'GET', path: '/capabilities' },
    'GET /authorize': { method: 'GET', path: '/authorize', query: authorizeQueryFromFixture(shippingAuth) },
    'POST /token': { method: 'POST', path: '/token', headers: { authorization: 'Bearer synthetic_client_assertion' }, body: fixtures.tokenRequests[0] },
    'POST /proof/verify': { method: 'POST', path: '/proof/verify', body: fixtures.proofVerifyRequests[0] },
    'POST /consent/revoke': { method: 'POST', path: '/consent/revoke', headers: { authorization: 'Bearer synthetic_user_or_admin' }, body: fixtures.consentRevocationRequests[0] },
    'POST /carrier/decrypt-request': { method: 'POST', path: '/carrier/decrypt-request', headers: { authorization: 'Bearer synthetic_carrier_assertion' }, body: fixtures.carrierDecryptRequests[0] },
    'POST /friend-delivery/requests': { method: 'POST', path: '/friend-delivery/requests', headers: { authorization: 'Bearer synthetic_client_assertion' }, body: fixtures.friendDeliveryRequests[0] },
    'POST /friend-delivery/approvals': { method: 'POST', path: '/friend-delivery/approvals', headers: { authorization: 'Bearer synthetic_user_or_admin' }, body: fixtures.friendDeliveryApprovals[0] },
    'GET /test-vectors': { method: 'GET', path: '/test-vectors' },
  };
}

function errorRouteInputs(fixtures: HostedAddressLoginFixtureSet): Array<[string, HostedAddressLoginMockRequest, number]> {
  const shippingAuth = fixtures.authorizeRequests.find(vector => vector.disclosureMode === 'carrier_decryptable');
  assert.ok(shippingAuth);

  return [
    ['GET /authorize', { method: 'GET', path: '/authorize', query: withoutKey(authorizeQueryFromFixture(shippingAuth), 'state') as Record<string, string> }, 400],
    ['POST /token', { method: 'POST', path: '/token', headers: { authorization: 'Bearer synthetic_client_assertion' }, body: { ...fixtures.tokenRequests[0], codeVerifier: 'wrong_verifier_value' } }, 400],
    ['POST /token', { method: 'POST', path: '/token', body: fixtures.tokenRequests[0] }, 401],
    ['POST /proof/verify', { method: 'POST', path: '/proof/verify', body: { ...fixtures.proofVerifyRequests[0], proofBundleRef: 'missing_proof_ref' } }, 400],
    ['POST /proof/verify', { method: 'POST', path: '/proof/verify', body: { ...fixtures.proofVerifyRequests[0], proofBundleRef: 'proof_ref_synthetic_stale_001' } }, 409],
    ['POST /consent/revoke', { method: 'POST', path: '/consent/revoke', headers: { authorization: 'Bearer synthetic_user_or_admin' }, body: { ...fixtures.consentRevocationRequests[0], reason: 'merchant_requested' } }, 400],
    ['POST /consent/revoke', { method: 'POST', path: '/consent/revoke', body: fixtures.consentRevocationRequests[0] }, 401],
    ['POST /carrier/decrypt-request', { method: 'POST', path: '/carrier/decrypt-request', headers: { authorization: 'Bearer synthetic_carrier_assertion' }, body: { ...fixtures.carrierDecryptRequests[0], carrierId: 'carrier_unknown' } }, 400],
    ['POST /carrier/decrypt-request', { method: 'POST', path: '/carrier/decrypt-request', body: fixtures.carrierDecryptRequests[0] }, 401],
    ['POST /carrier/decrypt-request', { method: 'POST', path: '/carrier/decrypt-request', headers: { authorization: 'Bearer synthetic_carrier_assertion' }, body: { ...fixtures.carrierDecryptRequests[0], consentEnvelopeRef: 'ace_synthetic_expired_001' } }, 409],
    ['POST /friend-delivery/requests', { method: 'POST', path: '/friend-delivery/requests', headers: { authorization: 'Bearer synthetic_client_assertion' }, body: { ...fixtures.friendDeliveryRequests[0], friendAlias: 'friend_alias_unknown' } }, 400],
    ['POST /friend-delivery/requests', { method: 'POST', path: '/friend-delivery/requests', body: fixtures.friendDeliveryRequests[0] }, 401],
    ['POST /friend-delivery/approvals', { method: 'POST', path: '/friend-delivery/approvals', headers: { authorization: 'Bearer synthetic_user_or_admin' }, body: { ...fixtures.friendDeliveryApprovals[0], approvalRef: 'approval_ref_unknown' } }, 400],
    ['POST /friend-delivery/approvals', { method: 'POST', path: '/friend-delivery/approvals', body: fixtures.friendDeliveryApprovals[0] }, 401],
    ['POST /friend-delivery/approvals', { method: 'POST', path: '/friend-delivery/approvals', headers: { authorization: 'Bearer synthetic_user_or_admin' }, body: { ...fixtures.friendDeliveryApprovals[0], friendDeliveryRequestRef: 'fdr_synthetic_expired_001' } }, 409],
    ['POST /token', { method: 'POST', path: '/token', body: { ...fixtures.tokenRequests[0], rawAddress: 'forbidden synthetic private material' } }, 400],
  ];
}

function resolveSchema(openapi: OpenApiObject, schema: OpenApiSchema): OpenApiSchema {
  if (!schema.$ref) return schema;
  const schemaName = schema.$ref.replace('#/components/schemas/', '');
  const resolved = openapi.components.schemas[schemaName];
  assert.ok(resolved, `schema ${schema.$ref} should resolve`);
  return resolveSchema(openapi, resolved);
}

function sameJsonValue(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function validateAgainstSchema(openapi: OpenApiObject, value: unknown, schema: OpenApiSchema, path = '$'): string[] {
  const resolved = resolveSchema(openapi, schema);
  const errors: string[] = [];

  if ('const' in resolved && !sameJsonValue(value, resolved.const)) {
    errors.push(`${path}: expected const ${JSON.stringify(resolved.const)}`);
  }
  if (resolved.enum && !resolved.enum.some(option => sameJsonValue(option, value))) {
    errors.push(`${path}: expected enum member`);
  }
  if (resolved.oneOf) {
    const matching = resolved.oneOf.filter(option => validateAgainstSchema(openapi, value, option, path).length === 0);
    if (matching.length === 0) errors.push(`${path}: expected oneOf match`);
    return errors;
  }

  if (resolved.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [`${path}: expected object`];
    const record = value as Record<string, unknown>;
    const properties = resolved.properties ?? {};
    for (const required of resolved.required ?? []) {
      if (!(required in record)) errors.push(`${path}.${required}: missing required property`);
    }
    if (resolved.additionalProperties === false) {
      const allowed = new Set(Object.keys(properties));
      for (const key of Object.keys(record)) {
        if (!allowed.has(key)) errors.push(`${path}.${key}: unexpected property`);
      }
    }
    for (const [key, propertySchema] of Object.entries(properties)) {
      if (key in record) errors.push(...validateAgainstSchema(openapi, record[key], propertySchema, `${path}.${key}`));
    }
    if (typeof resolved.additionalProperties === 'object') {
      for (const [key, propertyValue] of Object.entries(record)) {
        if (!(key in properties)) errors.push(...validateAgainstSchema(openapi, propertyValue, resolved.additionalProperties, `${path}.${key}`));
      }
    }
  }

  if (resolved.type === 'array') {
    if (!Array.isArray(value)) return [`${path}: expected array`];
    if (resolved.items) {
      value.forEach((item, index) => errors.push(...validateAgainstSchema(openapi, item, resolved.items as OpenApiSchema, `${path}[${index}]`)));
    }
  }

  if (resolved.type === 'string' && typeof value !== 'string') errors.push(`${path}: expected string`);
  if (resolved.type === 'number' && typeof value !== 'number') errors.push(`${path}: expected number`);
  if (resolved.type === 'boolean' && typeof value !== 'boolean') errors.push(`${path}: expected boolean`);

  return errors;
}

function resolveResponse(openapi: OpenApiObject, response: OpenApiResponse | undefined): OpenApiResponse | undefined {
  if (!response?.$ref) return response;
  const responseName = response.$ref.replace('#/components/responses/', '');
  const resolved = openapi.components.responses[responseName];
  assert.ok(resolved, `response ${response.$ref} should resolve`);
  return resolveResponse(openapi, resolved);
}

function responseSchemaFor(openapi: OpenApiObject, route: string, status: number): OpenApiSchema | undefined {
  const [method, path] = route.split(' ');
  const operation = openapi.paths[path]?.[method.toLowerCase() as 'get' | 'post'];
  return resolveResponse(openapi, operation?.responses?.[String(status)])?.content?.['application/json']?.schema;
}

test('Hosted Address Login mock runs authorize through carrier handoff without private material', () => {
  const fixtures = loadFixtures();
  const report = runHostedAddressLoginMockSmoke(fixtures);

  assert.equal(report.status, 'pass');
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.steps, ['authorize', 'token', 'proof-verify', 'carrier-decrypt', 'test-vectors']);
});

test('Hosted Address Login mock exposes capabilities from fixture contract', () => {
  const fixtures = loadFixtures();
  const handle = createHostedAddressLoginMock(fixtures);
  const response = handle({ method: 'GET', path: '/capabilities' });

  assert.equal(response.status, 200);
  assert.equal(response.body.mode, 'hosted-address-login');
  assert.equal(response.body.version, '0.1.0');
  assert.deepEqual(response.body.privacy, fixtures.privacyPosture);
  assert.deepEqual(response.body.callbackContract, fixtures.callbackContract);
  assert.ok(Array.isArray(response.body.supportedDisclosureModes));
  assert.ok((response.body.supportedDisclosureModes as string[]).includes('carrier_decryptable'));
  assert.ok((response.body.supportedStandards as string[]).includes('veygrit-address-login-callback-v0.1'));
});

test('Hosted Address Login mock rejects mismatched token requests', () => {
  const fixtures = loadFixtures();
  const handle = createHostedAddressLoginMock(fixtures);
  const token = { ...fixtures.tokenRequests[0], codeVerifier: 'wrong_verifier_value' };
  const response = handle({
    method: 'POST',
    path: '/token',
    headers: { authorization: 'Bearer synthetic_client_assertion' },
    body: token,
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'bad_request');
  assert.equal(response.body.message, 'token-vector-not-found');
});

test('Hosted Address Login mock rejects private material before route handling', () => {
  const fixtures = loadFixtures();
  const handle = createHostedAddressLoginMock(fixtures);
  const response = handle({
    method: 'POST',
    path: '/token',
    body: {
      ...fixtures.tokenRequests[0],
      rawAddress: 'forbidden synthetic private material',
    },
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'private_material_rejected');
  assert.deepEqual(response.body.rejectedKeys, ['rawAddress']);
});

test('Hosted Address Login mock rejects nested proof-secret material', () => {
  const handle = createHostedAddressLoginMock(loadFixtures());
  const response = handle({
    method: 'POST',
    path: '/proof/verify',
    body: {
      proofBundleRef: 'proof_ref_synthetic_shipping_001',
      unsafe: {
        proofSecret: 'forbidden synthetic secret',
      },
    },
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'private_material_rejected');
  assert.deepEqual(response.body.rejectedKeys, ['proofSecret']);
});

test('Hosted Address Login mock returns 404 for endpoints outside the hosted contract', () => {
  const handle = createHostedAddressLoginMock(loadFixtures());
  const response = handle({ method: 'POST', path: '/addresses/raw' });

  assert.equal(response.status, 404);
  assert.equal(response.body.error, 'not_found');
});

test('Hosted Address Login mock covers every OpenAPI endpoint method', () => {
  const openapi = loadOpenApi();
  const fixtures = loadFixtures();
  const handle = createHostedAddressLoginMock(fixtures);
  const routeInputs = successRouteInputs(fixtures);

  const openApiRoutes = Object.entries(openapi.paths).flatMap(([path, item]) =>
    (['get', 'post'] as const).filter(method => item[method]).map(method => `${method.toUpperCase()} ${path}`)
  );

  for (const route of openApiRoutes) {
    const input = routeInputs[route];
    assert.ok(input, `${route} missing from mock drift inputs`);
    assert.notEqual(handle(input).status, 404, `${route} returned 404`);
  }
});

test('Hosted Address Login mock success responses satisfy OpenAPI response schemas', () => {
  const openapi = loadOpenApi();
  const fixtures = loadFixtures();
  const handle = createHostedAddressLoginMock(fixtures);

  for (const [route, input] of Object.entries(successRouteInputs(fixtures))) {
    const response = handle(input);
    const schema = responseSchemaFor(openapi, route, response.status);
    if (!schema) continue;
    assert.deepEqual(validateAgainstSchema(openapi, response.body, schema, route), []);
  }
});

test('Hosted Address Login mock error responses satisfy OpenAPI ErrorResult schemas', () => {
  const openapi = loadOpenApi();
  const fixtures = loadFixtures();
  const handle = createHostedAddressLoginMock(fixtures);

  for (const [route, input, expectedStatus] of errorRouteInputs(fixtures)) {
    const response = handle(input);
    const schema = responseSchemaFor(openapi, route, response.status);
    assert.equal(response.status, expectedStatus, `${route} should produce a ${expectedStatus} vector`);
    assert.ok(schema, `${route} should expose a ${expectedStatus} response schema`);
    assert.deepEqual(validateAgainstSchema(openapi, response.body, schema), []);
  }
});

test('Hosted Address Login mock returns OpenAPI-shaped test vector summaries', () => {
  const fixtures = loadFixtures();
  const handle = createHostedAddressLoginMock(fixtures);
  const response = handle({ method: 'GET', path: '/test-vectors' });
  const expected = buildHostedAddressLoginPublicTestVectorResult(fixtures);

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, expected as unknown as Record<string, unknown>);
  assert.equal(response.body.fixtureSet, 'synthetic-veygrit-address-login-hosted-v0.1');
  assert.ok(!('endpoint' in response.body));
  assert.ok(Array.isArray(response.body.vectors));
  assert.ok(Array.isArray(response.body.scenarioVectors));
  assert.ok((response.body.vectors as Array<Record<string, unknown>>).every(vector =>
    typeof vector.id === 'string'
    && typeof vector.purpose === 'string'
    && typeof vector.disclosureMode === 'string'
    && typeof vector.riskLevel === 'string'
    && Array.isArray(vector.expectedClaims)
    && typeof vector.expectedNextAction === 'string'
  ));
  assert.ok((response.body.scenarioVectors as Array<Record<string, unknown>>).some(vector =>
    vector.id === 'friend_delivery_merchant_scenario_gift_001'
    && vector.purpose === 'anonymous_shipping'
    && vector.disclosureMode === 'carrier_decryptable_preferred'
    && Array.isArray(vector.checkedRefs)
    && vector.checkedRefs.includes('handoff_ref_synthetic_friend_delivery_001')
    && Array.isArray(vector.steps)
    && vector.steps.map((step: Record<string, unknown>) => step.id).join('>') === 'checkout-select-friend>server-create-request>wallet-notify>wallet-approve>server-receive-handoff'
    && vector.expectedNextAction === 'carrier_handoff'
  ));
  assert.deepEqual(response.body.privacy, expected.privacy);
});

test('Hosted Address Login mock builds a scenario-driven merchant integration checklist', () => {
  const checklist = buildFriendDeliveryMerchantIntegrationChecklist(loadFixtures());

  assert.equal(checklist.source, 'GET /test-vectors');
  assert.equal(checklist.scenarioId, 'friend_delivery_merchant_scenario_gift_001');
  assert.equal(checklist.expectedNextAction, 'carrier_handoff');
  assert.ok(checklist.checkedRefs.includes('handoff_ref_synthetic_friend_delivery_001'));
  assert.deepEqual(checklist.steps.map(step => step.stepId), [
    'checkout-select-friend',
    'server-create-request',
    'wallet-notify',
    'wallet-approve',
    'server-receive-handoff',
  ]);
  assert.equal(
    checklist.steps.find(step => step.stepId === 'checkout-select-friend')?.examplePath,
    'sdk/veygrit-address-login-react/examples/checkout-friend-delivery/CheckoutFriendDelivery.tsx',
  );
  assert.equal(
    checklist.steps.find(step => step.stepId === 'server-create-request')?.merchantRoute,
    '/friend-delivery/requests',
  );
  assert.equal(
    checklist.steps.find(step => step.stepId === 'server-receive-handoff')?.merchantRoute,
    '/friend-delivery/approvals',
  );
  assert.ok(checklist.nonClaims.some(nonClaim => /not proof of residence/i.test(nonClaim)));
  assert.doesNotMatch(JSON.stringify(checklist), /rawAddress|recipientPhone|proofWitness|privateKey|proofSecret|sk_live/i);
});

test('Hosted Address Login mock executes Friend Delivery merchant scenario smoke', () => {
  const report = runFriendDeliveryMerchantScenarioSmoke(loadFixtures());

  assert.equal(report.status, 'pass');
  assert.equal(report.scenarioId, 'friend_delivery_merchant_scenario_gift_001');
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.steps, [
    'test-vectors',
    'checkout-select-friend',
    'server-create-request',
    'wallet-notify',
    'wallet-approve',
    'server-receive-handoff',
  ]);
  assert.equal(report.requestRef, 'fdr_synthetic_gift_001');
  assert.equal(report.approvalRef, 'approval_ref_synthetic_gift_001');
  assert.equal(report.carrierHandoffRef, 'handoff_ref_synthetic_friend_delivery_001');
  assert.equal(report.deliveryReceiptRef, 'delivery_receipt_ref_synthetic_friend_delivery_001');
  assert.doesNotMatch(JSON.stringify(report), /rawAddress|recipientPhone|proofWitness|privateKey|proofSecret|sk_live/i);
});

test('Hosted Address Login mock enforces OpenAPI required request fields', () => {
  const openapi = loadOpenApi();
  const fixtures = loadFixtures();
  const handle = createHostedAddressLoginMock(fixtures);
  const shippingAuth = fixtures.authorizeRequests.find(vector => vector.disclosureMode === 'carrier_decryptable');
  assert.ok(shippingAuth);

  const authorizeQuery = authorizeQueryFromFixture(shippingAuth);
  const authorizeParams = (openapi.paths['/authorize'].get?.parameters ?? []).filter(parameter => parameter.required);
  for (const parameter of authorizeParams) {
    const response = handle({
      method: 'GET',
      path: '/authorize',
      query: withoutKey(authorizeQuery, parameter.name) as Record<string, string>,
    });
    assert.equal(response.status, 400, `/authorize should reject missing ${parameter.name}`);
  }

  const bodyFixtures: Array<[string, Record<string, unknown>, string]> = [
    ['TokenRequest', fixtures.tokenRequests[0], '/token'],
    ['ProofVerifyRequest', fixtures.proofVerifyRequests[0], '/proof/verify'],
    ['RevokeConsentRequest', fixtures.consentRevocationRequests[0], '/consent/revoke'],
    ['CarrierDecryptRequest', fixtures.carrierDecryptRequests[0], '/carrier/decrypt-request'],
    ['FriendDeliveryRequest', fixtures.friendDeliveryRequests[0], '/friend-delivery/requests'],
    ['FriendDeliveryApproval', fixtures.friendDeliveryApprovals[0], '/friend-delivery/approvals'],
  ];
  for (const [schemaName, vector, path] of bodyFixtures) {
    for (const required of openapi.components.schemas[schemaName].required ?? []) {
      const response = handle({
        method: 'POST',
        path,
        headers: path === '/token'
          ? { authorization: 'Bearer synthetic_client_assertion' }
          : path === '/carrier/decrypt-request'
            ? { authorization: 'Bearer synthetic_carrier_assertion' }
            : path === '/consent/revoke' || path === '/friend-delivery/approvals'
              ? { authorization: 'Bearer synthetic_user_or_admin' }
              : path === '/friend-delivery/requests'
                ? { authorization: 'Bearer synthetic_client_assertion' }
              : undefined,
        body: withoutKey(vector, required),
      });
      assert.equal(response.status, 400, `${path} should reject missing ${required}`);
    }
  }
});
