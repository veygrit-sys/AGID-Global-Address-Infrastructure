import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  approveFriendDelivery,
  buildFriendDeliveryApprovalUrl,
  buildFriendDeliveryRequestUrl,
  buildVeyIdConnectionRevocationUrl,
  buildVeyIdGuestCheckoutHandoffUrl,
  buildVeyIdTokenUrl,
  createFriendDeliveryApprovalPayload,
  createFriendDeliveryRequestPayload,
  createVeyIdConnectionRevocationPayload,
  createVeyIdGuestCheckoutHandoff,
  createVeyIdGuestCheckoutHandoffPayload,
  createVeyIdTokenRequestPayload,
  createVeygritWebhookHmacSignature,
  createAddressLoginRouteHandlers,
  createAddressLoginRouteHandler,
  exchangeVeyIdAuthorizationCode,
  parseAddressLoginCallback,
  parseVeyIdCallback,
  requireAddressClaims,
  revokeVeyIdConnection,
  requestFriendDelivery,
  verifyAddressLoginCallback,
  verifyVeygritWebhook,
  verifyVeygritWebhookHmac,
  type FriendDeliveryApprovalPayload,
  type FriendDeliveryRequestPayload,
  type AddressLoginVerifiedResult,
  type VeyIdConnectionRevocationPayload,
  type VeyIdGuestCheckoutHandoffPayload,
  type VeyIdTokenRequestPayload,
} from '../src/server';
import { createGuestCheckoutHandoffHttpTransport } from '../../veygrit-address-login-react/src/index';
import {
  assertHostedCallbackNormalizedParamsAreRedacted,
  expectedCallbackErrorPattern,
  loadHostedCallbackValidationVectors,
} from '../../veygrit-address-login-test-helpers/hostedCallbackValidationVectors';
import {
  createVeyIdCoreMerchantVisibleRedactionAdapterFixture,
  loadHostedAddressLoginMerchantVisibleRedactionDisplayContract,
} from '../../veygrit-address-login-test-helpers/merchantVisibleRedactionFixtures';

type HostedWebhookVector = {
  id: string;
  eventId: string;
  eventType: string;
  payloadFingerprint: string;
  timestamp: string;
  keyId: string;
  signatureHeader: string;
  expectedResult: 'accepted' | 'rejected';
  expectedError?: 'signature_mismatch' | 'duplicate_event_id' | 'timestamp_replay' | 'retired_key';
};

const approvedResult: AddressLoginVerifiedResult = {
  status: 'approved',
  subjectAlias: 'sub_pairwise_test',
  consentEnvelopeId: 'consent_test',
  credentialRef: 'cred_ref_test',
  proofBundleRef: 'proof_ref_test',
  publicClaims: {
    deliverable: true,
    not_revoked: true,
    freshness: true,
  },
  encryptedAddressForCarrierRef: 'carrier_handoff_ref_test',
  safeDisplayLines: ['Deliverable address credential approved'],
  warnings: [],
  nextAction: 'carrier_handoff',
};

function loadHostedWebhookVectors(): HostedWebhookVector[] {
  const fixturePath = [
    'docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json',
    '../../docs/specs/fixtures/veygrit-address-login-hosted-v0.1.json',
  ].find(path => existsSync(path));
  assert.ok(fixturePath, 'hosted Address Login fixture is required');
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as { webhookTestVectors: HostedWebhookVector[] };
  return fixture.webhookTestVectors;
}

function hostedWebhookPayloadText(vector: HostedWebhookVector) {
  return JSON.stringify({
    id: vector.eventId,
    type: vector.eventType,
    createdAt: vector.timestamp,
    data: { payloadFingerprint: vector.payloadFingerprint },
  });
}

function hostedWebhookTimestampHeader(vector: HostedWebhookVector) {
  return String(Date.parse(vector.timestamp) / 1000);
}

function readPackageFile(path: string): string {
  const candidates = [
    join('sdk/veygrit-address-login-nextjs', path),
    path,
    join('..', path),
  ];
  const filePath = candidates.find(candidate => existsSync(candidate));
  assert.ok(filePath, `${path} is required`);
  return readFileSync(filePath, 'utf8');
}

test('Next.js SDK package metadata resolves to built ESM and server entrypoints', () => {
  const packageJson = JSON.parse(readPackageFile('package.json')) as {
    main: string;
    types: string;
    exports: {
      '.': { types: string; import: string };
      './server': { types: string; import: string };
    };
    files: string[];
  };

  assert.equal(packageJson.main, './dist/src/index.js');
  assert.equal(packageJson.types, './dist/src/index.d.ts');
  assert.deepEqual(packageJson.exports, {
    '.': { types: './dist/src/index.d.ts', import: './dist/src/index.js' },
    './server': { types: './dist/src/server.d.ts', import: './dist/src/server.js' },
  });
  assert.deepEqual(packageJson.files, ['dist', 'examples', 'README.md']);
});

test('merchant-visible redaction fixture helper is reusable without React rendering', () => {
  const coreAdapter = createVeyIdCoreMerchantVisibleRedactionAdapterFixture();
  const hostedContract = loadHostedAddressLoginMerchantVisibleRedactionDisplayContract();

  assert.equal(coreAdapter.displayContract.sdkPackage, '@veygrit/address-login-react');
  assert.equal(hostedContract.sdkHelper, coreAdapter.displayContract.sdkHelper);
  assert.deepEqual(hostedContract.displayFields, coreAdapter.displayContract.displayFields);
  assert.equal(hostedContract.boundaryGateId, coreAdapter.displayContract.boundaryGateId);
  assert.equal(hostedContract.requiredNextAction, coreAdapter.displayContract.requiredNextAction);
  assert.equal(hostedContract.blockedClassCount, coreAdapter.displayContract.blockedClassCount);
  assert.equal(hostedContract.nonClaimCount, coreAdapter.displayContract.nonClaimCount);
  assert.equal(hostedContract.renderedMaterialPolicy.copyBlockedMaterialNames, false);
  assert.equal(hostedContract.renderedMaterialPolicy.copyNonClaimText, false);
  assert.equal(hostedContract.renderedMaterialPolicy.showCountsOnly, true);
  assert.deepEqual(
    Object.keys(hostedContract.displayRefsByField).sort(),
    Object.keys(coreAdapter.refs).sort(),
  );
  assert.doesNotMatch(
    JSON.stringify([hostedContract.displayRefsByField, coreAdapter.refs]),
    /rawAddress|addressLine|recipient|phone|email|witness|proofSecret|privateKey|providerAccessToken|carrierApiKey|productionCredential/i,
  );
});

test('verifyAddressLoginCallback accepts a redacted callback result', async () => {
  const result = await verifyAddressLoginCallback(
    {
      state: 'state_test',
      result: approvedResult,
    },
    {
      expectedState: 'state_test',
      requiredClaims: ['deliverable', 'not_revoked'],
    },
  );

  assert.equal(result.subjectAlias, 'sub_pairwise_test');
  assert.equal(result.nextAction, 'carrier_handoff');
});

test('verifyAddressLoginCallback can exchange a code through an explicit local handler', async () => {
  const request = new Request(
    'https://merchant.example/callback?code=code_test&state=state_test&iss=https%3A%2F%2Flogin.veygrit.example&session_ref=sess_ref_test&credential_ref=cred_ref_test&proof_bundle_ref=proof_ref_test&carrier_handoff_ref=carrier_handoff_ref_test',
  );
  const result = await verifyAddressLoginCallback(request, {
    expectedState: 'state_test',
    allowedIssuer: 'https://login.veygrit.example',
    requiredClaims: ['deliverable'],
    exchangeCode: (code, payload) => {
      assert.equal(code, 'code_test');
      assert.equal(payload.state, 'state_test');
      assert.equal(payload.sessionRef, 'sess_ref_test');
      assert.equal(payload.credentialRef, 'cred_ref_test');
      assert.equal(payload.proofBundleRef, 'proof_ref_test');
      assert.equal(payload.encryptedAddressForCarrierRef, 'carrier_handoff_ref_test');
      return approvedResult;
    },
  });

  assert.equal(result.publicClaims.deliverable, true);
});

test('parseAddressLoginCallback reads only safe code and reference parameters', () => {
  const payload = parseAddressLoginCallback(
    'https://merchant.example/callback?code=code_test&state=state_test&iss=https%3A%2F%2Flogin.veygrit.example&session_ref=sess_ref_test&credential_ref=cred_ref_test&proof_bundle_ref=proof_ref_test&carrier_handoff_ref=carrier_handoff_ref_test',
    {
      expectedState: 'state_test',
      allowedIssuer: 'https://login.veygrit.example',
    },
  );

  assert.equal(payload.code, 'code_test');
  assert.equal(payload.state, 'state_test');
  assert.equal(payload.issuer, 'https://login.veygrit.example');
  assert.equal(payload.sessionRef, 'sess_ref_test');
  assert.equal(payload.credentialRef, 'cred_ref_test');
  assert.equal(payload.proofBundleRef, 'proof_ref_test');
  assert.equal(payload.encryptedAddressForCarrierRef, 'carrier_handoff_ref_test');
});

test('parseAddressLoginCallback accepts legacy proof and handoff aliases for compatibility', () => {
  const payload = parseAddressLoginCallback(
    '?code=code_test&state=state_test&proof_ref=proof_ref_legacy&handoff_ref=handoff_ref_legacy',
  );

  assert.equal(payload.proofBundleRef, 'proof_ref_legacy');
  assert.equal(payload.encryptedAddressForCarrierRef, 'handoff_ref_legacy');
});

test('parseAddressLoginCallback rejects unsafe query material before code exchange', () => {
  assert.throws(
    () => parseAddressLoginCallback('?code=code_test&state=state_test&recipient=blocked'),
    /Unsafe Address Login callback parameter/,
  );

  assert.throws(
    () => parseAddressLoginCallback('?code=code_test&state=state_test&proof_secret=blocked'),
    /Unsafe Address Login callback parameter/,
  );

  assert.throws(
    () =>
      parseAddressLoginCallback('?code=code_test&state=state_test&iss=https%3A%2F%2Ffake.example', {
        allowedIssuer: 'https://login.veygrit.example',
      }),
    /issuer is not allowed/,
  );
});

test('hosted callback validation vectors expose redacted normalized params only', () => {
  assertHostedCallbackNormalizedParamsAreRedacted();
});

test('parseAddressLoginCallback conforms to hosted callback validation vectors', () => {
  for (const vector of loadHostedCallbackValidationVectors()) {
    const parse = () => parseAddressLoginCallback(new URLSearchParams(vector.input), vector.options);

    if (vector.expectedResult === 'rejected') {
      assert.throws(parse, expectedCallbackErrorPattern(vector), vector.id);
      continue;
    }

    const payload = parse();
    const expected = vector.expectedNormalizedParams;
    assert.ok(expected, `${vector.id} should declare normalized callback params`);
    assert.equal(payload.code, expected.code, vector.id);
    assert.equal(payload.state, expected.state, vector.id);
    assert.equal(payload.issuer, expected.iss, vector.id);
    assert.equal(payload.sessionRef, expected.session_ref, vector.id);
    assert.equal(payload.credentialRef, expected.credential_ref, vector.id);
    assert.equal(payload.proofBundleRef, expected.proof_bundle_ref, vector.id);
    assert.equal(payload.encryptedAddressForCarrierRef, expected.carrier_handoff_ref, vector.id);
  }
});

test('requireAddressClaims rejects missing claims without exposing address material', () => {
  assert.throws(
    () =>
      requireAddressClaims(
        {
          ...approvedResult,
          publicClaims: { deliverable: true },
        },
        ['deliverable', 'not_revoked'],
      ),
    /missing required claims: not_revoked/,
  );
});

test('createAddressLoginRouteHandler returns a redacted response body', async () => {
  const handler = createAddressLoginRouteHandler({
    requiredClaims: ['deliverable', 'not_revoked'],
  });
  const response = await handler(
    new Request('https://merchant.example/address-login/callback', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ state: 'state_test', result: approvedResult }),
    }),
  );
  const body = await response.text();

  assert.match(body, /sub_pairwise_test/);
  assert.match(body, /carrier_handoff_ref_test/);
  assert.doesNotMatch(body, /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret/i);
});

test('createAddressLoginRouteHandlers exposes Next.js App Router GET and POST handlers', async () => {
  const handlers = createAddressLoginRouteHandlers({
    requiredClaims: ['deliverable'],
    expectedState: 'state_test',
    exchangeCode: (code, payload) => {
      assert.equal(code, 'code_test');
      assert.equal(payload.state, 'state_test');
      return approvedResult;
    },
  });

  assert.equal(typeof handlers.GET, 'function');
  assert.equal(typeof handlers.POST, 'function');

  const response = await handlers.GET(new Request('https://merchant.example/callback?code=code_test&state=state_test'));
  const body = await response.text();
  assert.match(body, /sub_pairwise_test/);
  assert.doesNotMatch(body, /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret/i);
});

test('Friend Delivery payload helpers build redacted hosted API bodies', () => {
  const requestPayload = createFriendDeliveryRequestPayload({
    purchaserSubjectAlias: 'sub_pairwise_purchaser_test',
    friendAlias: 'friend_pairwise_receiver_test',
    cartRef: 'cart_ref_test',
    requestedAt: '2026-07-03T19:57:45.000Z',
  });

  assert.equal(requestPayload.purpose, 'anonymous_shipping');
  assert.equal(requestPayload.disclosureMode, 'carrier_decryptable');
  assert.ok(requestPayload.requestedClaims.includes('carrier_decryptable_address'));
  assert.doesNotMatch(JSON.stringify(requestPayload), /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret/i);

  const approvalPayload = createFriendDeliveryApprovalPayload({
    friendDeliveryRequestRef: 'fdr_ref_test',
    approvalRef: 'approval_ref_test',
    selectedAddressRef: 'addr_ref_receiver_home',
    consentEnvelopeRef: 'consent_ref_test',
    approvedAt: '2026-07-03T19:58:45.000Z',
  });

  assert.equal(approvalPayload.friendDeliveryRequestRef, 'fdr_ref_test');
  assert.equal(approvalPayload.selectedAddressRef, 'addr_ref_receiver_home');
  assert.ok(approvalPayload.approvedClaims.includes('deliverable'));
  assert.doesNotMatch(JSON.stringify(approvalPayload), /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret/i);
});

test('Friend Delivery helpers reject unsafe public payload material', () => {
  assert.throws(
    () =>
      createFriendDeliveryRequestPayload({
        purchaserSubjectAlias: 'sub_pairwise_purchaser_test',
        friendAlias: 'raw_address_value',
        cartRef: 'cart_ref_test',
      }),
    /Unsafe Address Login public value/,
  );

  assert.throws(
    () =>
      createFriendDeliveryApprovalPayload({
        friendDeliveryRequestRef: 'fdr_ref_test',
        approvalRef: 'approval_ref_test',
        selectedAddressRef: 'proof_secret_ref',
        consentEnvelopeRef: 'consent_ref_test',
      }),
    /Unsafe Address Login public value/,
  );
});

test('Friend Delivery server helpers call explicit transport without production traffic', async () => {
  const apiBaseUrl = 'https://login.veygrit.example/api/veygrit/address-login/';
  const requestCalls: FriendDeliveryRequestPayload[] = [];
  const approvalCalls: FriendDeliveryApprovalPayload[] = [];

  const requestResult = await requestFriendDelivery(
    {
      purchaserSubjectAlias: 'sub_pairwise_purchaser_test',
      friendAlias: 'friend_pairwise_receiver_test',
      cartRef: 'cart_ref_test',
      requestedAt: '2026-07-03T19:57:45.000Z',
    },
    {
      apiBaseUrl,
      serverAccessToken: 'synthetic_server_access_token',
      transport: request => {
        assert.equal(request.method, 'POST');
        assert.equal(request.url, buildFriendDeliveryRequestUrl(apiBaseUrl));
        assert.equal(request.headers.authorization, 'Bearer synthetic_server_access_token');
        requestCalls.push(request.payload);
        return {
          friendDeliveryRequestRef: 'fdr_ref_test',
          status: 'pending_recipient_approval',
          consentRequestRef: 'consent_req_ref_test',
          notificationRef: 'notify_ref_test',
          publicClaims: { user_approved: false },
          expiresAt: '2026-07-03T20:57:45.000Z',
          warnings: [],
        };
      },
    },
  );

  assert.equal(requestResult.status, 'pending_recipient_approval');
  assert.equal(requestCalls.length, 1);
  assert.equal(requestCalls[0].disclosureMode, 'carrier_decryptable');

  const approvalResult = await approveFriendDelivery(
    {
      friendDeliveryRequestRef: 'fdr_ref_test',
      approvalRef: 'approval_ref_test',
      selectedAddressRef: 'addr_ref_receiver_home',
      consentEnvelopeRef: 'consent_ref_test',
      approvedAt: '2026-07-03T19:58:45.000Z',
    },
    {
      apiBaseUrl,
      serverAccessToken: 'synthetic_server_access_token',
      transport: request => {
        assert.equal(request.method, 'POST');
        assert.equal(request.url, buildFriendDeliveryApprovalUrl(apiBaseUrl));
        assert.equal(request.headers.authorization, 'Bearer synthetic_server_access_token');
        approvalCalls.push(request.payload);
        return {
          approvalRef: 'approval_ref_test',
          status: 'approved',
          friendDeliveryRequestRef: 'fdr_ref_test',
          consentEnvelopeRef: 'consent_ref_test',
          encryptedAddressForCarrierRef: 'carrier_handoff_ref_test',
          publicClaims: { user_approved: true, deliverable: true },
          warnings: [],
        };
      },
    },
  );

  assert.equal(approvalResult.status, 'approved');
  assert.equal(approvalResult.encryptedAddressForCarrierRef, 'carrier_handoff_ref_test');
  assert.equal(approvalCalls.length, 1);
  assert.doesNotMatch(JSON.stringify({ requestResult, approvalResult, requestCalls, approvalCalls }), /raw.?address|address.?line|witness|private.?key|proof.?secret/i);
});

test('Vey ID server helpers exchange code refs and revoke wallet-side connections through explicit transport', async () => {
  const tokenCalls: VeyIdTokenRequestPayload[] = [];
  const guestCheckoutCalls: VeyIdGuestCheckoutHandoffPayload[] = [];
  const revokeCalls: VeyIdConnectionRevocationPayload[] = [];
  const apiBaseUrl = 'https://login.veygrit.example/';

  const tokenPayload = createVeyIdTokenRequestPayload({
    authorizationCodeRef: 'vey_auth_code_synthetic_001',
    clientId: 'merchant_demo',
    redirectUri: 'https://merchant.example/veygrit/callback',
    pkceVerifier: 'pkce_verifier_synthetic_abcdefghijklmnopqrstuvwxyz',
  });
  assert.equal(tokenPayload.grantType, 'authorization_code');

  const revocationPayload = createVeyIdConnectionRevocationPayload({
    clientId: 'merchant_demo',
    pairwiseSubjectAlias: 'pairwise_synthetic_001',
    walletConsentRef: 'consent_synthetic_001',
  });
  assert.equal(revocationPayload.reason, 'user_wallet_unlink');

  const tokenResult = await exchangeVeyIdAuthorizationCode(
    {
      authorizationCodeRef: 'vey_auth_code_synthetic_001',
      clientId: 'merchant_demo',
      redirectUri: 'https://merchant.example/veygrit/callback',
      pkceVerifier: 'pkce_verifier_synthetic_abcdefghijklmnopqrstuvwxyz',
    },
    {
      apiBaseUrl,
      serverAccessToken: 'synthetic_server_access_token',
      transport: request => {
        assert.equal(request.method, 'POST');
        assert.equal(request.url, buildVeyIdTokenUrl(apiBaseUrl));
        assert.equal(request.headers.authorization, 'Bearer synthetic_server_access_token');
        tokenCalls.push(request.payload);
        return {
          status: 'issued',
          tokenType: 'bearer-ref',
          accessTokenRef: 'vey_access_synthetic_001',
          idTokenRef: 'vey_id_synthetic_001',
          addressCredentialRef: 'addr_cred_synthetic_001',
          expiresAt: '2026-07-17T09:15:00.000Z',
          claims: {
            iss: 'https://id.veygrit.example',
            sub: 'pairwise_synthetic_001',
            aud: 'merchant_demo',
            authTime: '2026-07-17T09:00:00.000Z',
            addressWalletLinked: true,
          },
          privacy: {
            rawAddressExposed: false,
            providerIdTokenStored: false,
            providerAccessTokenStored: false,
            providerRefreshTokenStored: false,
            rawProviderProfileStored: false,
            proofSecretExposed: false,
          },
        };
      },
    },
  );

  assert.equal(tokenResult.accessTokenRef, 'vey_access_synthetic_001');
  assert.equal(tokenCalls.length, 1);
  assert.equal(tokenCalls[0].authorizationCodeRef, 'vey_auth_code_synthetic_001');

  const guestCheckoutPayload = createVeyIdGuestCheckoutHandoffPayload({
    clientId: 'merchant_demo',
    pairwiseSubjectAlias: tokenResult.claims.sub,
    walletConsentRef: 'wallet_consent_synthetic_001',
    addressCredentialRef: 'addr_cred_synthetic_001',
    accessTokenRef: tokenResult.accessTokenRef,
    orderRef: 'order_ref_synthetic_001',
  });
  assert.equal(guestCheckoutPayload.walletConsentRef, 'wallet_consent_synthetic_001');

  const guestCheckoutResult = await createVeyIdGuestCheckoutHandoff(
    {
      clientId: 'merchant_demo',
      pairwiseSubjectAlias: tokenResult.claims.sub,
      walletConsentRef: 'wallet_consent_synthetic_001',
      addressCredentialRef: 'addr_cred_synthetic_001',
      accessTokenRef: tokenResult.accessTokenRef,
      orderRef: 'order_ref_synthetic_001',
    },
    {
      apiBaseUrl,
      serverAccessToken: 'synthetic_server_access_token',
      transport: request => {
        assert.equal(request.method, 'POST');
        assert.equal(request.url, buildVeyIdGuestCheckoutHandoffUrl(apiBaseUrl));
        assert.equal(request.headers.authorization, 'Bearer synthetic_server_access_token');
        guestCheckoutCalls.push(request.payload);
        return {
          mode: 'ec-guest-checkout',
          status: 'ready',
          nextAction: 'create-guest-order',
          guestCheckoutAlias: 'vey_guest_checkout_synthetic_001',
          walletConsentRef: request.payload.walletConsentRef,
          addressCredentialRef: request.payload.addressCredentialRef,
          carrierHandoffRef: 'carrier_handoff_synthetic_001',
          merchantAccountCreationRequired: false,
          ecPasswordRequired: false,
          walletLoginRequired: true,
          ttlSeconds: 600,
          privacy: {
            rawAddressSharedWithMerchant: false,
            rawPhoneSharedWithMerchant: false,
            globalSubjectIdExposedToMerchant: false,
            merchantCanCreateAccountSilently: false,
            carrierCredentialsSharedWithMerchant: false,
            oneTimeUse: true,
          },
        };
      },
    },
  );

  assert.equal(guestCheckoutResult.status, 'ready');
  assert.equal(guestCheckoutResult.merchantAccountCreationRequired, false);
  assert.equal(guestCheckoutResult.ecPasswordRequired, false);
  assert.equal(guestCheckoutResult.walletLoginRequired, true);
  assert.equal(guestCheckoutResult.privacy.carrierCredentialsSharedWithMerchant, false);
  assert.equal(guestCheckoutCalls.length, 1);
  assert.equal(guestCheckoutCalls[0].accessTokenRef, 'vey_access_synthetic_001');

  const revocationResult = await revokeVeyIdConnection(
    {
      clientId: 'merchant_demo',
      pairwiseSubjectAlias: tokenResult.claims.sub,
      walletConsentRef: 'consent_synthetic_001',
    },
    {
      apiBaseUrl,
      serverAccessToken: 'synthetic_server_access_token',
      transport: request => {
        assert.equal(request.method, 'POST');
        assert.equal(request.url, buildVeyIdConnectionRevocationUrl(apiBaseUrl));
        assert.equal(request.headers.authorization, 'Bearer synthetic_server_access_token');
        revokeCalls.push(request.payload);
        return {
          status: 'revoked',
          revocationRef: 'vey_revoke_synthetic_001',
          pairwiseSubjectAlias: request.payload.pairwiseSubjectAlias,
          merchantDeletionRefs: ['pairwiseSubjectAlias', 'walletConsentRef', 'addressCredentialRef', 'carrierHandoffRef'],
          walletEffects: ['invalidate-merchant-consent', 'stop-address-autofill'],
          privacy: tokenResult.privacy,
        };
      },
    },
  );

  assert.equal(revocationResult.status, 'revoked');
  assert.ok(revocationResult.merchantDeletionRefs.includes('addressCredentialRef'));
  assert.equal(revokeCalls.length, 1);
  assert.equal(tokenResult.privacy.providerIdTokenStored, false);
  assert.equal(tokenResult.privacy.providerAccessTokenStored, false);
  assert.equal(tokenResult.privacy.providerRefreshTokenStored, false);
  assert.equal(tokenResult.privacy.rawProviderProfileStored, false);
  const publicText = JSON.stringify({ tokenResult, guestCheckoutResult, revocationResult, tokenCalls, guestCheckoutCalls, revokeCalls });
  assert.doesNotMatch(publicText, /blocked|secret_value|provider_token_value|raw_provider_profile_value|private_key_value|carrier_api_key_value/i);
});

test('Vey ID callback parser and server payload builders reject provider-token material', () => {
  const callback = parseVeyIdCallback(
    'https://merchant.example/veygrit/callback?authorization_code_ref=vey_auth_code_synthetic_001&state=state_test&iss=https%3A%2F%2Fid.veygrit.example&pairwise_subject_alias=pairwise_synthetic_001&wallet_session_ref=wallet_session_synthetic_001',
    {
      expectedState: 'state_test',
      allowedIssuer: 'https://id.veygrit.example',
    },
  );

  assert.equal(callback.authorizationCodeRef, 'vey_auth_code_synthetic_001');
  assert.equal(callback.pairwiseSubjectAlias, 'pairwise_synthetic_001');
  assert.equal(callback.walletSessionRef, 'wallet_session_synthetic_001');

  assert.throws(
    () => parseVeyIdCallback('?authorization_code_ref=vey_auth_code_synthetic_001&state=state_test&providerAccessToken=blocked'),
    /Unsafe Address Login callback parameter/,
  );

  assert.throws(
    () =>
      createVeyIdTokenRequestPayload({
        authorizationCodeRef: 'vey_auth_code_synthetic_001',
        clientId: 'merchant_demo',
        redirectUri: 'https://merchant.example/veygrit/callback',
        pkceVerifier: 'rawProviderProfile_attempt',
      }),
    /Unsafe Address Login public value/,
  );

  assert.throws(
    () =>
      createVeyIdGuestCheckoutHandoffPayload({
        clientId: 'merchant_demo',
        pairwiseSubjectAlias: 'pairwise_synthetic_001',
        walletConsentRef: 'wallet_consent_synthetic_001',
        addressCredentialRef: 'addr_cred_synthetic_001',
        accessTokenRef: 'vey_access_synthetic_001',
        orderRef: 'raw_address_attempt',
      }),
    /Unsafe Address Login public value/,
  );
});

test('Friend Delivery App Router examples are package-visible and redacted', () => {
  const requestRoute = readPackageFile('examples/app-router/friend-delivery/request/route.ts');
  const approvalRoute = readPackageFile('examples/app-router/friend-delivery/approval/route.ts');
  const packageJson = JSON.parse(readPackageFile('package.json')) as { files: string[] };

  assert.ok(packageJson.files.includes('examples'));
  assert.match(requestRoute, /requestFriendDelivery/);
  assert.match(approvalRoute, /approveFriendDelivery/);
  assert.match(requestRoute, /VEYGRIT_SERVER_ACCESS_TOKEN/);
  assert.match(approvalRoute, /VEYGRIT_SERVER_ACCESS_TOKEN/);
  assert.doesNotMatch(requestRoute + approvalRoute, /raw.?address|address.?line|witness|private.?key|proof.?secret/i);
});

test('Vey ID App Router examples keep token exchange and revocation server-side', () => {
  const tokenRoute = readPackageFile('examples/app-router/vey-id/token/route.ts');
  const guestCheckoutRoute = readPackageFile('examples/app-router/vey-id/guest-checkout/route.ts');
  const guestCheckoutGuide = readPackageFile('examples/app-router/vey-id/guest-checkout/README.md');
  const revokeRoute = readPackageFile('examples/app-router/vey-id/revoke/route.ts');
  const readme = readPackageFile('README.md');

  assert.match(tokenRoute, /exchangeVeyIdAuthorizationCode/);
  assert.match(guestCheckoutRoute, /createVeyIdGuestCheckoutHandoff/);
  assert.match(revokeRoute, /revokeVeyIdConnection/);
  assert.match(tokenRoute, /VEYGRIT_SERVER_ACCESS_TOKEN/);
  assert.match(guestCheckoutRoute, /VEYGRIT_SERVER_ACCESS_TOKEN/);
  assert.match(revokeRoute, /VEYGRIT_SERVER_ACCESS_TOKEN/);
  assert.match(tokenRoute, /pkceVerifier/);
  assert.match(guestCheckoutRoute, /guestCheckoutAlias/);
  assert.match(guestCheckoutRoute, /merchantAccountCreationRequired/);
  assert.match(guestCheckoutGuide, /CheckoutGuestCheckout/);
  assert.match(guestCheckoutGuide, /createGuestCheckoutHandoffHttpTransport/);
  assert.match(guestCheckoutGuide, /\/api\/veygrit\/guest-checkout\/handoff/);
  assert.match(guestCheckoutGuide, /createVeyIdGuestCheckoutHandoff/);
  assert.match(guestCheckoutGuide, /VEYGRIT_SERVER_ACCESS_TOKEN/);
  assert.match(guestCheckoutGuide, /no EC account or password is required/);
  assert.match(guestCheckoutGuide, /reference-only and one-time-use/);
  assert.match(revokeRoute, /pairwiseSubjectAlias/);
  assert.match(readme, /createGuestCheckoutOrderRefs/);
  assert.match(readme, /does not require an EC account or password/);
  assert.doesNotMatch(tokenRoute + guestCheckoutRoute + revokeRoute, /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret|provider.?id.?token|provider.?access.?token|provider.?refresh.?token|raw.?provider.?profile/i);
});

test('Next.js SDK README documents package publication-safety verification', () => {
  const readme = readPackageFile('README.md');

  assert.match(readme, /npm run verify:veygrit-address-login-test-helpers/);
  assert.match(readme, /shared test-helper boundary/);
  assert.match(readme, /npm run verify:veygrit-address-login-nextjs/);
  assert.match(readme, /npm run verify:veygrit-address-login-nextjs-package/);
  assert.match(readme, /npm run verify:veygrit-address-login-packages/);
  assert.match(readme, /npm pack/);
  assert.match(readme, /files allowlist/);
  assert.match(readme, /server entrypoint/);
  assert.match(readme, /not a publishing,\s+hosted-service, or production readiness claim/);
});

test('Vey ID guest checkout App Router route executes with mocked hosted transport', async () => {
  const { POST } = await import('../examples/app-router/vey-id/guest-checkout/route');
  const originalFetch = globalThis.fetch;
  const originalServerAccessToken = process.env.VEYGRIT_SERVER_ACCESS_TOKEN;
  const forwarded: Array<{ url: string; init: RequestInit; payload: VeyIdGuestCheckoutHandoffPayload }> = [];

  process.env.VEYGRIT_SERVER_ACCESS_TOKEN = 'test_server_access_ref_001';
  globalThis.fetch = (async (input, init) => {
    const payload = JSON.parse(String(init?.body ?? '{}')) as VeyIdGuestCheckoutHandoffPayload;
    forwarded.push({ url: String(input), init: init ?? {}, payload });
    return new Response(
      JSON.stringify({
        mode: 'ec-guest-checkout',
        status: 'ready',
        nextAction: 'create-guest-order',
        guestCheckoutAlias: 'guest_checkout_alias_synthetic_001',
        walletConsentRef: payload.walletConsentRef,
        addressCredentialRef: payload.addressCredentialRef,
        carrierHandoffRef: 'carrier_handoff_synthetic_001',
        merchantAccountCreationRequired: false,
        ecPasswordRequired: false,
        walletLoginRequired: true,
        ttlSeconds: 600,
        privacy: {
          rawAddressSharedWithMerchant: false,
          rawPhoneSharedWithMerchant: false,
          globalSubjectIdExposedToMerchant: false,
          merchantCanCreateAccountSilently: false,
          carrierCredentialsSharedWithMerchant: false,
          oneTimeUse: true,
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  try {
    const response = await POST(
      new Request('https://merchant.example/api/veygrit/guest-checkout/handoff', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clientId: 'merchant_demo',
          pairwiseSubjectAlias: 'pairwise_synthetic_001',
          walletConsentRef: 'wallet_consent_synthetic_001',
          addressCredentialRef: 'addr_cred_synthetic_001',
          accessTokenRef: 'vey_access_synthetic_001',
          orderRef: 'guest_order_ref_synthetic_001',
        }),
      }),
    );
    const responseBody = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 200);
    assert.equal(forwarded.length, 1);
    assert.equal(forwarded[0]?.url, buildVeyIdGuestCheckoutHandoffUrl());
    assert.equal(forwarded[0]?.init.method, 'POST');
    assert.deepEqual(forwarded[0]?.payload, {
      clientId: 'merchant_demo',
      pairwiseSubjectAlias: 'pairwise_synthetic_001',
      walletConsentRef: 'wallet_consent_synthetic_001',
      addressCredentialRef: 'addr_cred_synthetic_001',
      accessTokenRef: 'vey_access_synthetic_001',
      orderRef: 'guest_order_ref_synthetic_001',
    });
    assert.equal(responseBody.guestCheckoutAlias, 'guest_checkout_alias_synthetic_001');
    assert.equal(responseBody.carrierHandoffRef, 'carrier_handoff_synthetic_001');
    assert.equal(responseBody.merchantAccountCreationRequired, false);
    assert.equal(responseBody.ecPasswordRequired, false);
    assert.equal(responseBody.walletLoginRequired, true);
    assert.doesNotMatch(
      JSON.stringify({ responseBody, forwardedPayload: forwarded[0]?.payload }),
      /raw.?address|address.?line|recipient|phone|email|witness|private.?key|proof.?secret|provider.?id.?token|provider.?access.?token|provider.?refresh.?token|raw.?provider.?profile/i,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalServerAccessToken === undefined) {
      delete process.env.VEYGRIT_SERVER_ACCESS_TOKEN;
    } else {
      process.env.VEYGRIT_SERVER_ACCESS_TOKEN = originalServerAccessToken;
    }
  }
});

test('React guest checkout transport can hand off through mocked Next.js route', async () => {
  const { POST } = await import('../examples/app-router/vey-id/guest-checkout/route');
  const originalFetch = globalThis.fetch;
  const originalServerAccessToken = process.env.VEYGRIT_SERVER_ACCESS_TOKEN;
  const hostedCalls: Array<{ url: string; init: RequestInit; payload: VeyIdGuestCheckoutHandoffPayload }> = [];

  process.env.VEYGRIT_SERVER_ACCESS_TOKEN = 'test_server_access_ref_002';
  globalThis.fetch = (async (input, init) => {
    const payload = JSON.parse(String(init?.body ?? '{}')) as VeyIdGuestCheckoutHandoffPayload;
    hostedCalls.push({ url: String(input), init: init ?? {}, payload });
    return new Response(
      JSON.stringify({
        mode: 'ec-guest-checkout',
        status: 'ready',
        nextAction: 'create-guest-order',
        guestCheckoutAlias: 'guest_checkout_alias_synthetic_cross_001',
        walletConsentRef: payload.walletConsentRef,
        addressCredentialRef: payload.addressCredentialRef,
        carrierHandoffRef: 'carrier_handoff_synthetic_cross_001',
        merchantAccountCreationRequired: false,
        ecPasswordRequired: false,
        walletLoginRequired: true,
        ttlSeconds: 600,
        privacy: {
          rawAddressSharedWithMerchant: false,
          rawPhoneSharedWithMerchant: false,
          globalSubjectIdExposedToMerchant: false,
          merchantCanCreateAccountSilently: false,
          carrierCredentialsSharedWithMerchant: false,
          oneTimeUse: true,
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  try {
    const merchantEndpointCalls: string[] = [];
    const browserTransport = createGuestCheckoutHandoffHttpTransport({
      endpoint: '/api/veygrit/guest-checkout/handoff',
      fetcher: (async (input, init) => {
        merchantEndpointCalls.push(String(input));
        return await POST(
          new Request(`https://merchant.example${String(input)}`, {
            method: init?.method,
            headers: init?.headers,
            body: init?.body,
          }),
        );
      }) as typeof fetch,
    });

    const result = await browserTransport({
      url: buildVeyIdGuestCheckoutHandoffUrl(),
      payload: {
        clientId: 'merchant_demo',
        pairwiseSubjectAlias: 'pairwise_synthetic_cross_001',
        walletConsentRef: 'wallet_consent_synthetic_cross_001',
        addressCredentialRef: 'addr_cred_synthetic_cross_001',
        accessTokenRef: 'vey_access_synthetic_cross_001',
        orderRef: 'guest_order_ref_synthetic_cross_001',
      },
    });

    assert.deepEqual(merchantEndpointCalls, ['/api/veygrit/guest-checkout/handoff']);
    assert.equal(hostedCalls.length, 1);
    assert.equal(hostedCalls[0]?.url, buildVeyIdGuestCheckoutHandoffUrl());
    assert.equal(hostedCalls[0]?.payload.pairwiseSubjectAlias, 'pairwise_synthetic_cross_001');
    assert.equal(result.status, 'ready');
    assert.equal(result.guestCheckoutAlias, 'guest_checkout_alias_synthetic_cross_001');
    assert.equal(result.carrierHandoffRef, 'carrier_handoff_synthetic_cross_001');
    assert.equal(result.merchantAccountCreationRequired, false);
    assert.equal(result.ecPasswordRequired, false);
    assert.equal(result.walletLoginRequired, true);
    assert.doesNotMatch(
      JSON.stringify({ result, hostedPayload: hostedCalls[0]?.payload, merchantEndpointCalls }),
      /raw.?address|address.?line|recipient|phone|email|witness|private.?key|proof.?secret|provider.?id.?token|provider.?access.?token|provider.?refresh.?token|raw.?provider.?profile/i,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalServerAccessToken === undefined) {
      delete process.env.VEYGRIT_SERVER_ACCESS_TOKEN;
    } else {
      process.env.VEYGRIT_SERVER_ACCESS_TOKEN = originalServerAccessToken;
    }
  }
});

test('Vey ID guest checkout App Router route returns redacted failure response', async () => {
  const { POST } = await import('../examples/app-router/vey-id/guest-checkout/route');
  const originalFetch = globalThis.fetch;
  const originalServerAccessToken = process.env.VEYGRIT_SERVER_ACCESS_TOKEN;

  process.env.VEYGRIT_SERVER_ACCESS_TOKEN = 'test_server_access_ref_failure_001';
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        error: 'hosted_failure_with_raw_address_attempt',
      }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    )) as typeof fetch;

  try {
    const response = await POST(
      new Request('https://merchant.example/api/veygrit/guest-checkout/handoff', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clientId: 'merchant_demo',
          pairwiseSubjectAlias: 'pairwise_synthetic_failure_001',
          walletConsentRef: 'wallet_consent_synthetic_failure_001',
          addressCredentialRef: 'addr_cred_synthetic_failure_001',
          accessTokenRef: 'vey_access_synthetic_failure_001',
          orderRef: 'guest_order_ref_synthetic_failure_001',
        }),
      }),
    );
    const responseBody = await response.json() as Record<string, unknown>;

    assert.equal(response.status, 502);
    assert.deepEqual(responseBody, {
      mode: 'ec-guest-checkout',
      status: 'blocked',
      nextAction: 'repair-token-exchange',
      errorCode: 'guest_checkout_handoff_failed',
    });
    assert.doesNotMatch(
      JSON.stringify(responseBody),
      /raw.?address|address.?line|recipient|phone|email|witness|private.?key|proof.?secret|provider.?id.?token|provider.?access.?token|provider.?refresh.?token|raw.?provider.?profile|hosted_failure/i,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalServerAccessToken === undefined) {
      delete process.env.VEYGRIT_SERVER_ACCESS_TOKEN;
    } else {
      process.env.VEYGRIT_SERVER_ACCESS_TOKEN = originalServerAccessToken;
    }
  }
});

test('callback and webhook helpers reject unsafe field names', async () => {
  await assert.rejects(
    () =>
      verifyAddressLoginCallback({
        state: 'state_test',
        result: {
          ...approvedResult,
          rawAddress: 'blocked',
        } as unknown as AddressLoginVerifiedResult,
      }),
    /Unsafe Address Login field/,
  );

  await assert.rejects(
    () =>
      verifyAddressLoginCallback(
        new Request('https://merchant.example/callback?code=code_test&state=state_test&raw_address=blocked'),
        {
          exchangeCode: () => approvedResult,
        },
      ),
    /Unsafe Address Login callback parameter/,
  );

  await assert.rejects(
    () =>
      verifyVeygritWebhook(
        new Request('https://merchant.example/webhook', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'veygrit-signature': 'v1_test' },
          body: JSON.stringify({ id: 'evt_test', type: 'address_login.approved', createdAt: '2026-07-02T00:00:00Z', data: { proofSecret: 'blocked' } }),
        }),
        { verifySignature: () => true },
      ),
    /Unsafe Address Login field/,
  );
});

test('verifyVeygritWebhook delegates signature checks to caller-supplied verifier', async () => {
  const payload = { id: 'evt_test', type: 'address_login.approved', createdAt: '2026-07-02T00:00:00Z', data: { subjectAlias: 'sub_pairwise_test' } };
  const event = await verifyVeygritWebhook(
    new Request('https://merchant.example/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'veygrit-signature': 'v1_test' },
      body: JSON.stringify(payload),
    }),
    {
      verifySignature: (payloadText, signature) => {
        assert.match(payloadText, /address_login\.approved/);
        return signature === 'v1_test';
      },
    },
  );

  assert.equal(event.id, 'evt_test');
});

test('verifyVeygritWebhookHmac accepts a fixture signature and rejects mismatch or replay', async () => {
  const payloadText = JSON.stringify({
    id: 'evt_hmac_fixture',
    type: 'address_login.result_issued',
    createdAt: '2026-07-02T21:37:24.000Z',
    data: { subjectAlias: 'sub_pairwise_test', payloadFingerprint: 'payload_fp_demo_001' },
  });
  const signingSecret = 'fixture_webhook_signing_key_not_production';
  const timestampHeader = String(Date.parse('2026-07-02T21:37:24.000Z') / 1000);
  const now = Date.parse('2026-07-02T21:38:00.000Z');
  const signature = await createVeygritWebhookHmacSignature(payloadText, {
    signingSecret,
    timestampHeader,
  });

  assert.equal(
    await verifyVeygritWebhookHmac(payloadText, signature, {
      signingSecret,
      timestampHeader,
      now,
    }),
    true,
  );
  assert.equal(
    await verifyVeygritWebhookHmac(payloadText, 'v1=wrong_fixture_signature_ref', {
      signingSecret,
      timestampHeader,
      now,
    }),
    false,
  );
  assert.equal(
    await verifyVeygritWebhookHmac(payloadText, signature, {
      signingSecret,
      timestampHeader,
      now: Date.parse('2026-07-02T22:00:00.000Z'),
    }),
    false,
  );
  assert.doesNotMatch(payloadText, /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret/i);
});

test('verifyVeygritWebhook can use built-in HMAC verification with timestamp replay window', async () => {
  const payload = {
    id: 'evt_hmac_route',
    type: 'address_login.result_issued',
    createdAt: '2026-07-02T21:37:24.000Z',
    data: { subjectAlias: 'sub_pairwise_test', payloadFingerprint: 'payload_fp_demo_002' },
  };
  const payloadText = JSON.stringify(payload);
  const signingSecret = 'fixture_webhook_signing_key_not_production';
  const timestampHeader = String(Date.parse('2026-07-02T21:37:24.000Z') / 1000);
  const signature = await createVeygritWebhookHmacSignature(payloadText, {
    signingSecret,
    timestampHeader,
  });

  const event = await verifyVeygritWebhook(
    new Request('https://merchant.example/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-veygrit-signature': signature,
        'x-veygrit-timestamp': timestampHeader,
      },
      body: payloadText,
    }),
    {
      hmac: {
        signingSecret,
        now: Date.parse('2026-07-02T21:38:00.000Z'),
      },
    },
  );

  assert.equal(event.id, 'evt_hmac_route');
  assert.equal(event.data.subjectAlias, 'sub_pairwise_test');

  await assert.rejects(
    () =>
      verifyVeygritWebhook(
        new Request('https://merchant.example/webhook', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-veygrit-signature': 'v1=wrong_fixture_signature_ref',
            'x-veygrit-timestamp': timestampHeader,
          },
          body: payloadText,
        }),
        {
          hmac: {
            signingSecret,
            now: Date.parse('2026-07-02T21:38:00.000Z'),
          },
        },
      ),
    /signature verification failed/,
  );
});

test('verifyVeygritWebhook rejects duplicate event ids through an idempotency store', async () => {
  const payload = {
    id: 'evt_hmac_idempotent',
    type: 'address_login.result_issued',
    createdAt: '2026-07-02T21:57:24.000Z',
    data: { subjectAlias: 'sub_pairwise_test', payloadFingerprint: 'payload_fp_demo_003' },
  };
  const payloadText = JSON.stringify(payload);
  const signingSecret = 'fixture_webhook_signing_key_not_production';
  const timestampHeader = String(Date.parse('2026-07-02T21:57:24.000Z') / 1000);
  const now = Date.parse('2026-07-02T21:58:00.000Z');
  const signature = await createVeygritWebhookHmacSignature(payloadText, {
    signingSecret,
    timestampHeader,
  });
  const seenEvents = new Set<string>();
  const eventIdStore = {
    has: (eventId: string) => seenEvents.has(eventId),
    add: (eventId: string) => {
      seenEvents.add(eventId);
    },
  };
  const request = (signatureHeader: string) => new Request('https://merchant.example/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-veygrit-signature': signatureHeader,
      'x-veygrit-timestamp': timestampHeader,
    },
    body: payloadText,
  });
  const options = {
    hmac: { signingSecret, now },
    eventIdStore,
  };

  await assert.rejects(
    () => verifyVeygritWebhook(request('v1=wrong_fixture_signature_ref'), options),
    /signature verification failed/,
  );
  assert.equal(seenEvents.has(payload.id), false);

  const firstEvent = await verifyVeygritWebhook(request(signature), options);
  assert.equal(firstEvent.id, payload.id);
  assert.equal(seenEvents.has(payload.id), true);

  await assert.rejects(
    () => verifyVeygritWebhook(request(signature), options),
    /already processed/,
  );
  assert.doesNotMatch(payloadText, /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret/i);
});

test('hosted webhook fixture vectors are executable with the SDK HMAC helper', async () => {
  const vectors = loadHostedWebhookVectors();
  const signingKeys: Record<string, { signingSecret: string; status: 'active' | 'retired'; notBefore: string; notAfter: string }> = {
    whkey_fixture_2026_06: {
      signingSecret: 'retired_fixture_webhook_signing_key_not_production',
      status: 'retired',
      notBefore: '2026-06-01T00:00:00Z',
      notAfter: '2026-07-01T00:00:00Z',
    },
    whkey_fixture_2026_07: {
      signingSecret: 'fixture_webhook_signing_key_not_production',
      status: 'active',
      notBefore: '2026-07-01T00:00:00Z',
      notAfter: '2026-08-01T00:00:00Z',
    },
    whkey_fixture_2026_08: {
      signingSecret: 'rotated_fixture_webhook_signing_key_not_production',
      status: 'active',
      notBefore: '2026-07-02T21:30:00Z',
      notAfter: '2026-09-01T00:00:00Z',
    },
  };
  const now = Date.parse('2026-07-02T21:38:00.000Z');
  const accepted = vectors.find(vector => vector.id === 'webhook_result_issued_valid');
  const rotated = vectors.find(vector => vector.id === 'webhook_rotated_key_valid');
  const retiredKey = vectors.find(vector => vector.expectedError === 'retired_key');
  const signatureMismatch = vectors.find(vector => vector.expectedError === 'signature_mismatch');
  const duplicate = vectors.find(vector => vector.expectedError === 'duplicate_event_id');
  const timestampReplay = vectors.find(vector => vector.expectedError === 'timestamp_replay');
  assert.ok(accepted);
  assert.ok(rotated);
  assert.ok(retiredKey);
  assert.ok(signatureMismatch);
  assert.ok(duplicate);
  assert.ok(timestampReplay);

  const acceptedPayload = hostedWebhookPayloadText(accepted);
  const acceptedTimestamp = hostedWebhookTimestampHeader(accepted);
  const generatedAcceptedSignature = await createVeygritWebhookHmacSignature(acceptedPayload, {
    signingSecret: signingKeys[accepted.keyId].signingSecret,
    keyId: accepted.keyId,
    timestampHeader: acceptedTimestamp,
  });
  assert.equal(generatedAcceptedSignature, accepted.signatureHeader);
  assert.equal(
    await verifyVeygritWebhookHmac(acceptedPayload, accepted.signatureHeader, {
      signingKeys,
      timestampHeader: acceptedTimestamp,
      now,
    }),
    true,
  );

  const rotatedPayload = hostedWebhookPayloadText(rotated);
  const rotatedTimestamp = hostedWebhookTimestampHeader(rotated);
  const generatedRotatedSignature = await createVeygritWebhookHmacSignature(rotatedPayload, {
    signingSecret: signingKeys[rotated.keyId].signingSecret,
    keyId: rotated.keyId,
    timestampHeader: rotatedTimestamp,
  });
  assert.equal(generatedRotatedSignature, rotated.signatureHeader);
  assert.equal(
    await verifyVeygritWebhookHmac(rotatedPayload, rotated.signatureHeader, {
      signingKeys,
      timestampHeader: rotatedTimestamp,
      now,
    }),
    true,
  );

  const retiredPayload = hostedWebhookPayloadText(retiredKey);
  const retiredTimestamp = hostedWebhookTimestampHeader(retiredKey);
  const generatedRetiredSignature = await createVeygritWebhookHmacSignature(retiredPayload, {
    signingSecret: signingKeys[retiredKey.keyId].signingSecret,
    keyId: retiredKey.keyId,
    timestampHeader: retiredTimestamp,
  });
  assert.equal(generatedRetiredSignature, retiredKey.signatureHeader);
  assert.equal(
    await verifyVeygritWebhookHmac(retiredPayload, retiredKey.signatureHeader, {
      signingKeys,
      timestampHeader: retiredTimestamp,
      now,
    }),
    false,
  );

  assert.equal(
    await verifyVeygritWebhookHmac(hostedWebhookPayloadText(signatureMismatch), signatureMismatch.signatureHeader, {
      signingKeys,
      timestampHeader: hostedWebhookTimestampHeader(signatureMismatch),
      now,
    }),
    false,
  );

  assert.equal(
    await verifyVeygritWebhookHmac(hostedWebhookPayloadText(timestampReplay), timestampReplay.signatureHeader, {
      signingKeys,
      timestampHeader: hostedWebhookTimestampHeader(timestampReplay),
      now,
    }),
    false,
  );

  const replayGeneratedSignature = await createVeygritWebhookHmacSignature(hostedWebhookPayloadText(timestampReplay), {
    signingSecret: signingKeys[timestampReplay.keyId].signingSecret,
    keyId: timestampReplay.keyId,
    timestampHeader: hostedWebhookTimestampHeader(timestampReplay),
  });
  assert.equal(replayGeneratedSignature, timestampReplay.signatureHeader);

  const seenEvents = new Set<string>();
  const eventIdStore = {
    has: (eventId: string) => seenEvents.has(eventId),
    add: (eventId: string) => {
      seenEvents.add(eventId);
    },
  };
  const requestFor = (vector: HostedWebhookVector) => new Request('https://merchant.example/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-veygrit-signature': vector.signatureHeader,
      'x-veygrit-timestamp': hostedWebhookTimestampHeader(vector),
    },
    body: hostedWebhookPayloadText(vector),
  });

  const event = await verifyVeygritWebhook(requestFor(accepted), {
    hmac: { signingKeys, now },
    eventIdStore,
  });
  assert.equal(event.id, accepted.eventId);

  await assert.rejects(
    () =>
      verifyVeygritWebhook(requestFor(duplicate), {
        hmac: { signingKeys, now },
        eventIdStore,
      }),
    /already processed/,
  );
  assert.doesNotMatch(JSON.stringify(vectors), /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret/i);
});
