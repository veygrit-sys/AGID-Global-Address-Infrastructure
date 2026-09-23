import {
  HOSTED_ADDRESS_LOGIN_FORBIDDEN_PUBLIC_KEYS,
  buildHostedAddressLoginPublicTestVectorResult,
  runHostedAddressLoginSyntheticSmoke,
  type HostedAddressLoginFriendDeliveryMerchantScenarioStep,
  type HostedAddressLoginAuthorizeVector,
  type HostedAddressLoginCarrierDecryptRequestVector,
  type HostedAddressLoginConsentRevocationRequestVector,
  type HostedAddressLoginFixtureSet,
  type HostedAddressLoginFriendDeliveryMerchantScenarioVector,
  type HostedAddressLoginFriendDeliveryApprovalVector,
  type HostedAddressLoginFriendDeliveryRequestVector,
  type HostedAddressLoginProofVerifyRequestVector,
  type HostedAddressLoginTokenRequestVector,
} from './veygritHostedAddressLoginContract';

export type HostedAddressLoginMockMethod = 'GET' | 'POST';

export type HostedAddressLoginMockRequest = {
  method: HostedAddressLoginMockMethod;
  path:
    | '/capabilities'
    | '/authorize'
    | '/token'
    | '/proof/verify'
    | '/consent/revoke'
    | '/carrier/decrypt-request'
    | '/friend-delivery/requests'
    | '/friend-delivery/approvals'
    | '/test-vectors'
    | string;
  query?: Record<string, string | undefined>;
  headers?: Record<string, string | undefined>;
  body?: Record<string, unknown>;
};

export type HostedAddressLoginMockResponse = {
  status: number;
  body: Record<string, unknown>;
};

export type HostedAddressLoginMockSmokeResult = {
  status: 'pass' | 'fail';
  steps: string[];
  errors: string[];
  warnings: string[];
};

export type FriendDeliveryMerchantIntegrationChecklistItem = {
  stepId: HostedAddressLoginFriendDeliveryMerchantScenarioStep['id'];
  actor: HostedAddressLoginFriendDeliveryMerchantScenarioStep['actor'];
  inputRefs: string[];
  outputRefs: string[];
  examplePath: string;
  merchantRoute: string;
  assertion: string;
};

export type FriendDeliveryMerchantIntegrationChecklist = {
  source: 'GET /test-vectors';
  scenarioId: string;
  checkedRefs: string[];
  expectedNextAction: 'carrier_handoff';
  steps: FriendDeliveryMerchantIntegrationChecklistItem[];
  nonClaims: string[];
};

export type FriendDeliveryMerchantScenarioSmokeResult = {
  status: 'pass' | 'fail';
  scenarioId: string;
  steps: string[];
  requestRef?: string;
  approvalRef?: string;
  carrierHandoffRef?: string;
  deliveryReceiptRef?: string;
  errors: string[];
  warnings: string[];
};

function badRequest(message: string): HostedAddressLoginMockResponse {
  return {
    status: 400,
    body: {
      ok: false,
      error: 'bad_request',
      errors: [message],
      warnings: [],
      message,
    },
  };
}

function authRequired(message: string): HostedAddressLoginMockResponse {
  return {
    status: 401,
    body: {
      ok: false,
      error: 'auth_required',
      errors: [message],
      warnings: [],
      message,
    },
  };
}

function conflict(message: string): HostedAddressLoginMockResponse {
  return {
    status: 409,
    body: {
      ok: false,
      error: 'policy_conflict',
      errors: [message],
      warnings: [],
      message,
    },
  };
}

function notFound(path: string): HostedAddressLoginMockResponse {
  return {
    status: 404,
    body: {
      error: 'not_found',
      path,
    },
  };
}

function collectRequestKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(collectRequestKeys);
  const record = value as Record<string, unknown>;
  return [
    ...Object.keys(record),
    ...Object.values(record).flatMap(collectRequestKeys),
  ];
}

function rejectPrivateMaterial(request: HostedAddressLoginMockRequest): HostedAddressLoginMockResponse | undefined {
  const requestKeys = new Set([
    ...collectRequestKeys(request.query),
    ...collectRequestKeys(request.body),
  ]);
  const rejectedKeys = HOSTED_ADDRESS_LOGIN_FORBIDDEN_PUBLIC_KEYS.filter(key => requestKeys.has(key));
  if (rejectedKeys.length === 0) return undefined;

  return {
    status: 400,
    body: {
      ok: false,
      error: 'private_material_rejected',
      errors: ['private-material-rejected'],
      warnings: [],
      message: 'Hosted Address Login mock accepts references, hashes, claims, and consent handles only.',
      rejectedKeys,
    },
  };
}

function hasSyntheticBearer(request: HostedAddressLoginMockRequest, expectedPurpose: string) {
  return request.headers?.authorization === `Bearer synthetic_${expectedPurpose}`;
}

function staleProofResult(proofBundleRef: string, fixtures: HostedAddressLoginFixtureSet): HostedAddressLoginMockResponse {
  return {
    status: 409,
    body: {
      verified: false,
      status: 'stale',
      proofBundleRef,
      publicClaims: {},
      errors: ['proof-stale'],
      warnings: [],
      privacy: fixtures.privacyPosture,
    },
  };
}

function findTokenForAuthorize(fixtures: HostedAddressLoginFixtureSet, authorize: HostedAddressLoginAuthorizeVector) {
  return fixtures.tokenRequests.find(token =>
    token.clientId === authorize.clientId
    && token.redirectUri === authorize.redirectUri
    && token.id.replace(/^token_/, '') === authorize.id.replace(/^auth_/, '')
  );
}

function findResultForToken(fixtures: HostedAddressLoginFixtureSet, token: HostedAddressLoginTokenRequestVector) {
  return fixtures.addressLoginResults.find(result =>
    result.id.replace(/^result_/, '') === token.id.replace(/^token_/, '')
  );
}

function objectMatchesVector<T extends Record<string, unknown>>(body: Record<string, unknown> | undefined, vector: T, keys: Array<keyof T>) {
  if (!body) return false;
  return keys.every(key => valuesEqual(body[String(key)], vector[key]));
}

function publicFixtureBody<T extends Record<string, unknown>>(vector: T): Record<string, unknown> {
  const { id: _id, endpoint: _endpoint, ...publicBody } = vector;
  return publicBody;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) return JSON.stringify(a) === JSON.stringify(b);
  return a === b;
}

function queryValue(query: Record<string, string | undefined>, camelKey: string, snakeKey: string) {
  return query[camelKey] ?? query[snakeKey];
}

function requestedClaimsQueryValue(query: Record<string, string | undefined>) {
  return query.requestedClaims ?? query.requested_claims;
}

function authorizeQueryMatches(query: Record<string, string | undefined>, authorize: HostedAddressLoginAuthorizeVector) {
  const requestedClaims = requestedClaimsQueryValue(query);
  return queryValue(query, 'clientId', 'client_id') === authorize.clientId
    && queryValue(query, 'redirectUri', 'redirect_uri') === authorize.redirectUri
    && queryValue(query, 'responseType', 'response_type') === 'code'
    && query.state === authorize.state
    && query.nonce === authorize.nonce
    && queryValue(query, 'codeChallenge', 'code_challenge') === authorize.codeChallenge
    && queryValue(query, 'codeChallengeMethod', 'code_challenge_method') === authorize.codeChallengeMethod
    && query.purpose === String(authorize.purpose)
    && queryValue(query, 'disclosureMode', 'disclosure_mode') === authorize.disclosureMode
    && queryValue(query, 'riskLevel', 'risk_level') === String(authorize.riskLevel)
    && requestedClaims === authorize.requestedClaims.join(' ');
}

function scenarioStep(
  scenario: HostedAddressLoginFriendDeliveryMerchantScenarioVector,
  stepId: HostedAddressLoginFriendDeliveryMerchantScenarioStep['id'],
) {
  return scenario.steps.find(step => step.id === stepId);
}

function refListIncludesAll(refs: string[] | undefined, expectedRefs: string[]) {
  if (!refs) return false;
  return expectedRefs.every(ref => refs.includes(ref));
}

export function createHostedAddressLoginMock(fixtures: HostedAddressLoginFixtureSet) {
  const contractReport = runHostedAddressLoginSyntheticSmoke(fixtures);

  return function handleHostedAddressLoginMockRequest(request: HostedAddressLoginMockRequest): HostedAddressLoginMockResponse {
    const privateMaterialRejection = rejectPrivateMaterial(request);
    if (privateMaterialRejection) return privateMaterialRejection;

    if (contractReport.status !== 'pass') {
      return {
        status: 500,
        body: {
          error: 'fixture_contract_failed',
          errors: contractReport.errors,
        },
      };
    }

    if (request.method === 'GET' && request.path === '/capabilities') {
      return {
        status: 200,
        body: {
          mode: 'hosted-address-login',
          version: '0.1.0',
          supportedPurposes: Array.from(new Set(fixtures.authorizeRequests.map(vector => String(vector.purpose)))).sort(),
          supportedDisclosureModes: Array.from(new Set(fixtures.authorizeRequests.map(vector => vector.disclosureMode))).sort(),
          supportedStandards: ['pkce-state-nonce', 'proof-reference-verifier-hook', 'carrier-only-handoff', 'redacted-fixture-contract', fixtures.callbackContract.version],
          callbackContract: fixtures.callbackContract,
          privacy: fixtures.privacyPosture,
        },
      };
    }

    if (request.method === 'GET' && request.path === '/authorize') {
      const query = request.query ?? {};
      const authorize = fixtures.authorizeRequests.find(vector => authorizeQueryMatches(query, vector));
      if (!authorize) return badRequest('authorize-vector-not-found');
      const token = findTokenForAuthorize(fixtures, authorize);
      if (!token) return badRequest('token-vector-not-found-for-authorize');

      return {
        status: 302,
        body: {
          redirectUri: authorize.redirectUri,
          code: token.code,
          state: authorize.state,
          nonce: authorize.nonce,
          disclosureMode: authorize.disclosureMode,
        },
      };
    }

    if (request.method === 'POST' && request.path === '/token') {
      if (!hasSyntheticBearer(request, 'client_assertion')) return authRequired('client-auth-required');
      const tokenRequest = fixtures.tokenRequests.find(vector =>
        objectMatchesVector(request.body, vector, ['grantType', 'code', 'redirectUri', 'clientId', 'codeVerifier'])
      );
      if (!tokenRequest) return badRequest('token-vector-not-found');
      const result = findResultForToken(fixtures, tokenRequest);
      if (!result) return badRequest('address-login-result-not-found-for-token');
      return {
        status: 200,
        body: publicFixtureBody(result),
      };
    }

    if (request.method === 'POST' && request.path === '/proof/verify') {
      if (request.body?.proofBundleRef === 'proof_ref_synthetic_stale_001') {
        return staleProofResult('proof_ref_synthetic_stale_001', fixtures);
      }
      const verifyRequest = fixtures.proofVerifyRequests.find(vector =>
        objectMatchesVector<HostedAddressLoginProofVerifyRequestVector>(request.body, vector, [
          'proofBundleRef',
          'credentialRef',
          'consentEnvelopeRef',
          'verifierPolicyHash',
          'challengeHash',
          'requestedClaims',
        ])
      );
      if (!verifyRequest) return badRequest('proof-verify-vector-not-found');
      const result = fixtures.proofVerifyResults.find(vector => vector.proofBundleRef === verifyRequest.proofBundleRef);
      if (!result) return badRequest('proof-verify-result-not-found');
      return {
        status: 200,
        body: publicFixtureBody(result),
      };
    }

    if (request.method === 'POST' && request.path === '/carrier/decrypt-request') {
      if (!hasSyntheticBearer(request, 'carrier_assertion')) return authRequired('carrier-auth-required');
      if (request.body?.consentEnvelopeRef === 'ace_synthetic_expired_001') return conflict('carrier-consent-expired');
      const carrierRequest = fixtures.carrierDecryptRequests.find(vector =>
        objectMatchesVector<HostedAddressLoginCarrierDecryptRequestVector>(request.body, vector, [
          'carrierId',
          'deliverySessionRef',
          'consentEnvelopeRef',
          'encryptedForCarrierRef',
          'purpose',
          'requestedAt',
        ])
      );
      if (!carrierRequest) return badRequest('carrier-decrypt-vector-not-found');
      const result = fixtures.carrierDecryptResults.find(vector =>
        vector.carrierId === carrierRequest.carrierId
        && vector.deliverySessionRef === carrierRequest.deliverySessionRef
      );
      if (!result) return badRequest('carrier-decrypt-result-not-found');
      return {
        status: 200,
        body: publicFixtureBody(result),
      };
    }

    if (request.method === 'POST' && request.path === '/friend-delivery/requests') {
      if (!hasSyntheticBearer(request, 'client_assertion')) return authRequired('client-auth-required');
      const friendRequest = fixtures.friendDeliveryRequests.find(vector =>
        objectMatchesVector<HostedAddressLoginFriendDeliveryRequestVector>(request.body, vector, [
          'purchaserSubjectAlias',
          'friendAlias',
          'cartRef',
          'purpose',
          'requestedClaims',
          'disclosureMode',
          'requestedAt',
        ])
      );
      if (!friendRequest) return badRequest('friend-delivery-request-vector-not-found');
      const result = fixtures.friendDeliveryRequestResults.find(vector => vector.friendAlias === friendRequest.friendAlias);
      if (!result) return badRequest('friend-delivery-request-result-not-found');
      return {
        status: 202,
        body: publicFixtureBody(result),
      };
    }

    if (request.method === 'POST' && request.path === '/friend-delivery/approvals') {
      if (!hasSyntheticBearer(request, 'user_or_admin')) return authRequired('user-or-admin-auth-required');
      if (request.body?.friendDeliveryRequestRef === 'fdr_synthetic_expired_001') return conflict('friend-delivery-request-expired');
      const approval = fixtures.friendDeliveryApprovals.find(vector =>
        objectMatchesVector<HostedAddressLoginFriendDeliveryApprovalVector>(request.body, vector, [
          'friendDeliveryRequestRef',
          'approvalRef',
          'selectedAddressRef',
          'consentEnvelopeRef',
          'approvedClaims',
          'approvedAt',
        ])
      );
      if (!approval) return badRequest('friend-delivery-approval-vector-not-found');
      const result = fixtures.friendDeliveryApprovalResults.find(vector => vector.approvalRef === approval.approvalRef);
      if (!result) return badRequest('friend-delivery-approval-result-not-found');
      return {
        status: 200,
        body: publicFixtureBody(result),
      };
    }

    if (request.method === 'POST' && request.path === '/consent/revoke') {
      if (!hasSyntheticBearer(request, 'user_or_admin')) return authRequired('user-or-admin-auth-required');
      const revokeRequest = fixtures.consentRevocationRequests.find(vector =>
        objectMatchesVector<HostedAddressLoginConsentRevocationRequestVector>(request.body, vector, ['consentEnvelopeRef', 'reason'])
      );
      if (!revokeRequest) return badRequest('consent-revoke-vector-not-found');
      const result = fixtures.consentRevocationResults.find(vector => vector.consentEnvelopeRef === revokeRequest.consentEnvelopeRef);
      if (!result) return badRequest('consent-revoke-result-not-found');
      return {
        status: 200,
        body: publicFixtureBody(result),
      };
    }

    if (request.method === 'GET' && request.path === '/test-vectors') {
      return {
        status: 200,
        body: buildHostedAddressLoginPublicTestVectorResult(fixtures),
      };
    }

    return notFound(request.path);
  };
}

export function runFriendDeliveryMerchantScenarioSmoke(
  fixtures: HostedAddressLoginFixtureSet,
): FriendDeliveryMerchantScenarioSmokeResult {
  const handle = createHostedAddressLoginMock(fixtures);
  const errors: string[] = [];
  const steps: string[] = [];
  const warnings = fixtures.testVectorResult.warnings ?? [];
  const checklist = buildFriendDeliveryMerchantIntegrationChecklist(fixtures);
  const scenario = fixtures.friendDeliveryMerchantScenarios.find(vector => vector.id === checklist.scenarioId)
    ?? fixtures.friendDeliveryMerchantScenarios[0];

  if (!scenario) {
    return {
      status: 'fail',
      scenarioId: 'missing',
      steps,
      errors: ['friend-delivery-merchant-scenario-not-found'],
      warnings,
    };
  }

  const vectorsResponse = handle({ method: 'GET', path: '/test-vectors' });
  steps.push('test-vectors');
  if (vectorsResponse.status !== 200) errors.push('test-vectors-step-failed');
  if (!checklist.checkedRefs.includes(scenario.carrierHandoffRef)) errors.push('scenario-handoff-ref-missing-from-checklist');

  const checkoutStep = scenarioStep(scenario, 'checkout-select-friend');
  steps.push('checkout-select-friend');
  if (!refListIncludesAll(checkoutStep?.outputRefs, [scenario.friendAlias])) {
    errors.push('checkout-friend-alias-output-missing');
  }

  const requestVector = fixtures.friendDeliveryRequests.find(vector =>
    vector.purchaserSubjectAlias === scenario.purchaserSubjectAlias
    && vector.friendAlias === scenario.friendAlias
    && vector.cartRef === scenario.cartRef
  );
  if (!requestVector) errors.push('friend-delivery-request-vector-not-found-for-scenario');

  const requestResponse = requestVector
    ? handle({
        method: 'POST',
        path: '/friend-delivery/requests',
        headers: { authorization: 'Bearer synthetic_client_assertion' },
        body: requestVector,
      })
    : { status: 400, body: {} };
  steps.push('server-create-request');
  if (requestResponse.status !== 202) errors.push('friend-delivery-request-step-failed');
  if (requestResponse.body.friendDeliveryRequestRef !== scenario.friendDeliveryRequestRef) {
    errors.push('friend-delivery-request-ref-mismatch');
  }
  if (requestResponse.body.notificationRef !== scenario.notificationRef) {
    errors.push('wallet-notification-ref-mismatch');
  }
  if ((requestResponse.body.privacy as { merchantCanDecrypt?: unknown } | undefined)?.merchantCanDecrypt !== false) {
    errors.push('request-privacy-merchant-can-decrypt');
  }

  const notifyStep = scenarioStep(scenario, 'wallet-notify');
  steps.push('wallet-notify');
  if (!refListIncludesAll(notifyStep?.inputRefs, [scenario.friendDeliveryRequestRef])
    || !refListIncludesAll(notifyStep?.outputRefs, [scenario.notificationRef])) {
    errors.push('wallet-notification-step-ref-mismatch');
  }

  const approvalVector = fixtures.friendDeliveryApprovals.find(vector =>
    vector.friendDeliveryRequestRef === scenario.friendDeliveryRequestRef
    && vector.approvalRef === scenario.approvalRef
    && vector.selectedAddressRef === scenario.selectedAddressRef
    && vector.consentEnvelopeRef === scenario.consentEnvelopeRef
  );
  if (!approvalVector) errors.push('friend-delivery-approval-vector-not-found-for-scenario');

  const approvalResponse = approvalVector
    ? handle({
        method: 'POST',
        path: '/friend-delivery/approvals',
        headers: { authorization: 'Bearer synthetic_user_or_admin' },
        body: approvalVector,
      })
    : { status: 400, body: {} };
  steps.push('wallet-approve');
  if (approvalResponse.status !== 200) errors.push('friend-delivery-approval-step-failed');
  if (approvalResponse.body.approvalRef !== scenario.approvalRef) errors.push('friend-delivery-approval-ref-mismatch');
  if (approvalResponse.body.carrierHandoffRef !== scenario.carrierHandoffRef) errors.push('carrier-handoff-ref-mismatch');
  if (approvalResponse.body.deliveryReceiptRef !== scenario.deliveryReceiptRef) errors.push('delivery-receipt-ref-mismatch');
  if ((approvalResponse.body.privacy as { merchantCanDecrypt?: unknown } | undefined)?.merchantCanDecrypt !== false) {
    errors.push('approval-privacy-merchant-can-decrypt');
  }

  const handoffStep = scenarioStep(scenario, 'server-receive-handoff');
  steps.push('server-receive-handoff');
  if (!refListIncludesAll(handoffStep?.outputRefs, [scenario.carrierHandoffRef, scenario.deliveryReceiptRef])) {
    errors.push('server-handoff-step-ref-mismatch');
  }

  return {
    status: errors.length === 0 ? 'pass' : 'fail',
    scenarioId: scenario.id,
    steps,
    requestRef: typeof requestResponse.body.friendDeliveryRequestRef === 'string'
      ? requestResponse.body.friendDeliveryRequestRef
      : undefined,
    approvalRef: typeof approvalResponse.body.approvalRef === 'string'
      ? approvalResponse.body.approvalRef
      : undefined,
    carrierHandoffRef: typeof approvalResponse.body.carrierHandoffRef === 'string'
      ? approvalResponse.body.carrierHandoffRef
      : undefined,
    deliveryReceiptRef: typeof approvalResponse.body.deliveryReceiptRef === 'string'
      ? approvalResponse.body.deliveryReceiptRef
      : undefined,
    errors,
    warnings,
  };
}

export function buildFriendDeliveryMerchantIntegrationChecklist(
  fixtures: HostedAddressLoginFixtureSet,
): FriendDeliveryMerchantIntegrationChecklist {
  const publicVectors = buildHostedAddressLoginPublicTestVectorResult(fixtures);
  const scenario = publicVectors.scenarioVectors.find(vector => vector.id === 'friend_delivery_merchant_scenario_gift_001')
    ?? publicVectors.scenarioVectors[0];
  if (!scenario) {
    throw new Error('friend-delivery-scenario-vector-not-found');
  }

  return {
    source: 'GET /test-vectors',
    scenarioId: scenario.id,
    checkedRefs: scenario.checkedRefs,
    expectedNextAction: 'carrier_handoff',
    steps: scenario.steps.map(step => ({
      stepId: step.id,
      actor: step.actor,
      inputRefs: step.inputRefs,
      outputRefs: step.outputRefs,
      ...merchantIntegrationStepMetadata(step.id),
    })),
    nonClaims: [
      'Checklist steps are synthetic integration guidance, not proof of residence.',
      'Checklist refs are not raw address, recipient contact, witness, private-key, proof-secret, or production credential material.',
      'Carrier handoff refs do not imply merchant decryption capability.',
    ],
  };
}

function merchantIntegrationStepMetadata(
  stepId: HostedAddressLoginFriendDeliveryMerchantScenarioStep['id'],
): Pick<FriendDeliveryMerchantIntegrationChecklistItem, 'examplePath' | 'merchantRoute' | 'assertion'> {
  switch (stepId) {
    case 'checkout-select-friend':
      return {
        examplePath: 'sdk/veygrit-address-login-react/examples/checkout-friend-delivery/CheckoutFriendDelivery.tsx',
        merchantRoute: '/api/veygrit/friend-delivery/request',
        assertion: 'Browser submits purchaserSubjectAlias, friendAlias, and cartRef to the merchant route only.',
      };
    case 'server-create-request':
      return {
        examplePath: 'sdk/veygrit-address-login-nextjs/examples/app-router/friend-delivery/request/route.ts',
        merchantRoute: '/friend-delivery/requests',
        assertion: 'Server route attaches authorization and receives a friendDeliveryRequestRef.',
      };
    case 'wallet-notify':
      return {
        examplePath: 'hosted-address-login-wallet-notification',
        merchantRoute: 'wallet-notification',
        assertion: 'Wallet notification is represented by notificationRef and does not expose delivery material to checkout.',
      };
    case 'wallet-approve':
      return {
        examplePath: 'sdk/veygrit-address-login-nextjs/examples/app-router/friend-delivery/approval/route.ts',
        merchantRoute: '/friend-delivery/approvals',
        assertion: 'Recipient approval binds selectedAddressRef to one friendDeliveryRequestRef.',
      };
    case 'server-receive-handoff':
      return {
        examplePath: 'sdk/veygrit-address-login-nextjs/examples/app-router/friend-delivery/approval/route.ts',
        merchantRoute: '/friend-delivery/approvals',
        assertion: 'Server receives carrierHandoffRef and deliveryReceiptRef after approval.',
      };
  }
}

export function runHostedAddressLoginMockSmoke(fixtures: HostedAddressLoginFixtureSet): HostedAddressLoginMockSmokeResult {
  const handle = createHostedAddressLoginMock(fixtures);
  const errors: string[] = [];
  const steps: string[] = [];

  const shippingAuth = fixtures.authorizeRequests.find(vector => vector.disclosureMode === 'carrier_decryptable');
  if (!shippingAuth) {
    return { status: 'fail', steps, errors: ['missing-carrier-decryptable-authorize-vector'], warnings: [] };
  }

  const authorizeResponse = handle({
    method: 'GET',
    path: '/authorize',
    query: {
      client_id: shippingAuth.clientId,
      redirect_uri: shippingAuth.redirectUri,
      response_type: 'code',
      state: shippingAuth.state,
      nonce: shippingAuth.nonce,
      code_challenge: shippingAuth.codeChallenge,
      code_challenge_method: shippingAuth.codeChallengeMethod,
      purpose: String(shippingAuth.purpose),
      disclosure_mode: shippingAuth.disclosureMode,
      risk_level: String(shippingAuth.riskLevel),
      requested_claims: shippingAuth.requestedClaims.join(' '),
      display_language_mode: String(shippingAuth.displayLanguageMode),
    },
  });
  steps.push('authorize');
  if (authorizeResponse.status !== 302) errors.push('authorize-step-failed');

  const tokenCode = typeof authorizeResponse.body.code === 'string' ? authorizeResponse.body.code : undefined;
  const tokenRequest = fixtures.tokenRequests.find(vector => vector.code === tokenCode);
  if (!tokenRequest) errors.push('token-request-not-found-after-authorize');

  const tokenResponse = tokenRequest
    ? handle({ method: 'POST', path: '/token', headers: { authorization: 'Bearer synthetic_client_assertion' }, body: tokenRequest })
    : { status: 400, body: {} };
  steps.push('token');
  if (tokenResponse.status !== 200) errors.push('token-step-failed');

  const proofBundleRef = tokenResponse.body.proofBundleRef;
  const verifyRequest = fixtures.proofVerifyRequests.find(vector => vector.proofBundleRef === proofBundleRef);
  const proofResponse = verifyRequest
    ? handle({ method: 'POST', path: '/proof/verify', body: verifyRequest })
    : { status: 400, body: {} };
  steps.push('proof-verify');
  if (proofResponse.status !== 200 || proofResponse.body.verified !== true) errors.push('proof-verify-step-failed');

  const carrierRequest = fixtures.carrierDecryptRequests.find(vector =>
    vector.consentEnvelopeRef === tokenResponse.body.consentEnvelopeRef
    && vector.encryptedForCarrierRef === tokenResponse.body.encryptedForCarrierRef
  );
  const carrierResponse = carrierRequest
    ? handle({ method: 'POST', path: '/carrier/decrypt-request', headers: { authorization: 'Bearer synthetic_carrier_assertion' }, body: carrierRequest })
    : { status: 400, body: {} };
  steps.push('carrier-decrypt');
  if (carrierResponse.status !== 200 || carrierResponse.body.authorized !== true) errors.push('carrier-decrypt-step-failed');
  if (tokenResponse.body.privacy && (tokenResponse.body.privacy as { merchantCanDecrypt?: unknown }).merchantCanDecrypt !== false) {
    errors.push('token-privacy-merchant-can-decrypt');
  }

  const vectorsResponse = handle({ method: 'GET', path: '/test-vectors' });
  steps.push('test-vectors');
  if (vectorsResponse.status !== 200 || vectorsResponse.body.fixtureSet !== fixtures.fixtureSet) errors.push('test-vectors-step-failed');

  return {
    status: errors.length === 0 ? 'pass' : 'fail',
    steps,
    errors,
    warnings: fixtures.testVectorResult.warnings ?? [],
  };
}
