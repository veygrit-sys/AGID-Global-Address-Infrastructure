import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  AddressLoginButton,
  GuestCheckoutButton,
  VeygritProvider,
  buildAddressLoginAuthorizeUrl,
  buildVeyIdAuthorizeUrl,
  buildVeyIdConnectionRevocationUrl,
  buildVeyIdGuestCheckoutHandoffUrl,
  buildVeyIdTokenUrl,
  buildFriendDeliveryApprovalUrl,
  buildFriendDeliveryRequestUrl,
  createAddressLoginRequest,
  createGuestCheckoutHandoffHttpTransport,
  createMerchantVisibleRedactionDisplayModel,
  createVeyIdAuthorizeRequest,
  createVeyIdConnectionRevocationPayload,
  createVeyIdGuestCheckoutHandoffPayload,
  createVeyIdTokenRequestPayload,
  createFriendDeliveryController,
  createFriendDeliveryApprovalPayload,
  createFriendDeliveryRequestPayload,
  parseAddressLoginCallback,
  parseVeyIdCallback,
  useAddressLogin,
  useGuestCheckoutHandoff,
  useFriendDelivery,
  type AddressLoginAuthorizeRequest,
  type AddressLoginButtonProps,
  type VeyIdMerchantVisibleRedactionAffordance,
} from '../src/index';
import { MerchantVisibleRedactionCard } from '../examples/merchant-visible-redaction/MerchantVisibleRedactionCard';
import {
  assertHostedCallbackNormalizedParamsAreRedacted,
  expectedCallbackErrorPattern,
  loadHostedCallbackValidationVectors,
} from '../../veygrit-address-login-test-helpers/hostedCallbackValidationVectors';
import { createVeyIdCoreMerchantVisibleRedactionAdapterFixture } from '../../veygrit-address-login-test-helpers/merchantVisibleRedactionFixtures';

function readPackageFile(path: string): string {
  const candidates = [
    join('sdk/veygrit-address-login-react', path),
    path,
    join('..', path),
  ];
  const filePath = candidates.find(candidate => existsSync(candidate));
  assert.ok(filePath, `${path} is required`);
  return readFileSync(filePath, 'utf8');
}

function createMerchantVisibleRedactionAffordanceFixture(): VeyIdMerchantVisibleRedactionAffordance {
  return {
    boundaryGateId: 'merchant-visible-redaction',
    displayFields: [
      'pairwiseSubjectAlias',
      'guestCheckoutAlias',
      'walletConsentRef',
      'addressCredentialRef',
      'carrierHandoffRef',
    ],
    displayRefs: [
      'pairwise_synthetic_001',
      'guest_checkout_alias_synthetic_001',
      'consent_synthetic_001',
      'addr_cred_synthetic_001',
      'carrier_handoff_synthetic_001',
    ],
    blockedMaterial: [
      'rawAddress',
      'recipientPhone',
      'providerAccessToken',
      'privateKey',
      'proofWitness',
    ],
    requiredNextAction: 'create-guest-order-from-refs',
    nonClaims: [
      'Merchant-visible refs are not raw address disclosure.',
      'Guest checkout display does not expose provider tokens.',
    ],
  };
}

test('Veygrit React SDK exports provider, button, hook, and URL builder', () => {
  assert.equal(typeof VeygritProvider, 'function');
  assert.equal(typeof AddressLoginButton, 'function');
  assert.equal(typeof GuestCheckoutButton, 'function');
  assert.equal(typeof useAddressLogin, 'function');
  assert.equal(typeof useGuestCheckoutHandoff, 'function');
  assert.equal(typeof useFriendDelivery, 'function');
  assert.equal(typeof buildAddressLoginAuthorizeUrl, 'function');
  assert.equal(typeof buildVeyIdAuthorizeUrl, 'function');
  assert.equal(typeof buildVeyIdTokenUrl, 'function');
  assert.equal(typeof buildVeyIdConnectionRevocationUrl, 'function');
  assert.equal(typeof buildVeyIdGuestCheckoutHandoffUrl, 'function');
  assert.equal(typeof createVeyIdAuthorizeRequest, 'function');
  assert.equal(typeof createGuestCheckoutHandoffHttpTransport, 'function');
  assert.equal(typeof createVeyIdTokenRequestPayload, 'function');
  assert.equal(typeof createVeyIdConnectionRevocationPayload, 'function');
  assert.equal(typeof createVeyIdGuestCheckoutHandoffPayload, 'function');
  assert.equal(typeof createMerchantVisibleRedactionDisplayModel, 'function');
  assert.equal(typeof createFriendDeliveryRequestPayload, 'function');
  assert.equal(typeof createFriendDeliveryApprovalPayload, 'function');
  assert.equal(typeof createFriendDeliveryController, 'function');
  assert.equal(typeof buildFriendDeliveryRequestUrl, 'function');
  assert.equal(typeof buildFriendDeliveryApprovalUrl, 'function');
  assert.equal(typeof parseAddressLoginCallback, 'function');
  assert.equal(typeof parseVeyIdCallback, 'function');
});

test('React SDK package metadata resolves to built ESM and types entrypoints', () => {
  const packageJson = JSON.parse(readPackageFile('package.json')) as {
    main: string;
    types: string;
    exports: {
      '.': {
        types: string;
        import: string;
      };
    };
    files: string[];
  };

  assert.equal(packageJson.main, './dist/src/index.js');
  assert.equal(packageJson.types, './dist/src/index.d.ts');
  assert.deepEqual(packageJson.exports, {
    '.': {
      types: './dist/src/index.d.ts',
      import: './dist/src/index.js',
    },
  });
  assert.deepEqual(packageJson.files, ['dist', 'examples', 'README.md']);
});

test('AddressLoginButton can be created as a Clerk-like drop-in component', () => {
  const onAuthorizeUrl = (url: string, request: AddressLoginAuthorizeRequest) => {
    assert.match(url, /address-login\/authorize/);
    assert.equal(request.disclosureMode, 'carrier_decryptable');
  };

  const buttonProps: AddressLoginButtonProps = {
    purpose: 'shipping',
    disclosureMode: 'carrier_decryptable',
    requestedClaims: ['deliverable', 'not_revoked', 'freshness'],
    carrierId: 'carrier_test',
    redirectMode: 'manual',
    onAuthorizeUrl,
  };

  const element = React.createElement(
    VeygritProvider,
    { publishableKey: 'pk_test_veygrit', redirectUri: 'https://merchant.example/callback' },
    React.createElement(AddressLoginButton, buttonProps),
  );

  assert.equal(element.type, VeygritProvider);
  assert.equal(React.isValidElement(element), true);
});

test('GuestCheckoutButton can be rendered as a wallet-address checkout control', () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      VeygritProvider,
      {
        publishableKey: 'pk_test_veygrit',
        redirectUri: 'https://merchant.example/callback',
        veyIdApiBaseUrl: 'https://login.veygrit.example',
      },
      React.createElement(GuestCheckoutButton, {
        input: {
          clientId: 'merchant_demo',
          pairwiseSubjectAlias: 'pairwise_synthetic_001',
          walletConsentRef: 'consent_synthetic_001',
          addressCredentialRef: 'addr_cred_synthetic_001',
          accessTokenRef: 'access_token_ref_synthetic_001',
          orderRef: 'order_ref_guest_001',
        },
        transport: async () => ({
          mode: 'ec-guest-checkout',
          status: 'ready',
          nextAction: 'create-guest-order',
          guestCheckoutAlias: 'guest_checkout_alias_synthetic_001',
          walletConsentRef: 'consent_synthetic_001',
          addressCredentialRef: 'addr_cred_synthetic_001',
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
        } as const),
        onGuestCheckoutBlocked: result => {
          assert.equal(result.status, 'blocked');
        },
      }),
    ),
  );

  assert.match(markup, /data-veygrit-guest-checkout="button"/);
  assert.match(markup, /data-veygrit-status="idle"/);
  assert.match(markup, /Use wallet address/);
});

test('merchant-visible redaction helper builds ref-only display model without blocked material names', () => {
  const affordance = createMerchantVisibleRedactionAffordanceFixture();
  const model = createMerchantVisibleRedactionDisplayModel(affordance, {
    pairwiseSubjectAlias: 'pairwise_synthetic_001',
    guestCheckoutAlias: 'guest_checkout_alias_synthetic_001',
    walletConsentRef: 'consent_synthetic_001',
    addressCredentialRef: 'addr_cred_synthetic_001',
    carrierHandoffRef: 'carrier_handoff_synthetic_001',
  });

  assert.equal(model.boundaryGateId, 'merchant-visible-redaction');
  assert.equal(model.requiredNextAction, 'create-guest-order-from-refs');
  assert.equal(model.visibleRefCount, 5);
  assert.equal(model.blockedClassCount, 5);
  assert.equal(model.nonClaimCount, 2);
  assert.equal(model.consentBound, true);
  assert.deepEqual(model.rows.map(row => row.status), [
    'visible_ref',
    'visible_ref',
    'visible_ref',
    'visible_ref',
    'visible_ref',
  ]);
  assert.doesNotMatch(
    JSON.stringify(model),
    /rawAddress|recipientPhone|providerAccessToken|privateKey|proofWitness|raw.?address|recipient|phone|provider.?access.?token|witness|private.?key|proof.?secret/i,
  );
});

test('Vey ID Core fixture display contract feeds SDK helper without React rendering', () => {
  const {
    boundaryGate,
    displayContract: contract,
    affordance,
    refs,
    displayRefs,
  } = createVeyIdCoreMerchantVisibleRedactionAdapterFixture();

  assert.equal(contract.sdkPackage, '@veygrit/address-login-react');
  assert.equal(contract.sdkHelper, 'createMerchantVisibleRedactionDisplayModel');
  assert.equal(
    contract.example,
    'sdk/veygrit-address-login-react/examples/merchant-visible-redaction/MerchantVisibleRedactionCard.tsx',
  );
  assert.equal(contract.boundaryGateId, boundaryGate.id);
  assert.deepEqual(contract.displayFields, boundaryGate.safeEvidenceRefs);
  assert.equal(contract.blockedClassCount, boundaryGate.requiredBlockedMaterial.length);
  assert.equal(contract.nonClaimCount, boundaryGate.nonClaims.length);
  assert.equal(contract.renderedMaterialPolicy.copyBlockedMaterialNames, false);
  assert.equal(contract.renderedMaterialPolicy.copyNonClaimText, false);
  assert.equal(contract.renderedMaterialPolicy.showCountsOnly, true);

  const model = createMerchantVisibleRedactionDisplayModel(affordance, refs);

  assert.equal(model.boundaryGateId, contract.boundaryGateId);
  assert.equal(model.requiredNextAction, contract.requiredNextAction);
  assert.equal(model.visibleRefCount, contract.displayFields.length);
  assert.equal(model.blockedClassCount, contract.blockedClassCount);
  assert.equal(model.nonClaimCount, contract.nonClaimCount);
  assert.equal(model.consentBound, true);
  assert.deepEqual(model.rows.map(row => row.field), contract.displayFields);
  assert.deepEqual(model.rows.map(row => row.ref), displayRefs);
  assert.doesNotMatch(
    JSON.stringify(model),
    /rawAddress|recipientName|recipientPhone|privateDeliveryNotes|proofWitness|proofSecret|privateKey|raw.?address|recipient|phone|witness|proof.?secret|private.?key/i,
  );
});

test('merchant-visible redaction example renders refs without blocked material names', () => {
  const markup = renderToStaticMarkup(
    React.createElement(MerchantVisibleRedactionCard, {
      affordance: createMerchantVisibleRedactionAffordanceFixture(),
      refs: {
        pairwiseSubjectAlias: 'pairwise_synthetic_001',
        guestCheckoutAlias: 'guest_checkout_alias_synthetic_001',
        walletConsentRef: 'consent_synthetic_001',
        addressCredentialRef: 'addr_cred_synthetic_001',
        carrierHandoffRef: 'carrier_handoff_synthetic_001',
      },
    }),
  );

  assert.match(markup, /data-veygrit-merchant-visible-redaction="card"/);
  assert.match(markup, /Merchant-visible redaction/);
  assert.match(markup, /merchant-visible-redaction/);
  assert.match(markup, /create-guest-order-from-refs/);
  assert.match(markup, /guest_checkout_alias_synthetic_001/);
  assert.match(markup, /5 visible refs/);
  assert.match(markup, /5 blocked classes/);
  assert.match(markup, /consent-bound/);
  assert.doesNotMatch(
    markup,
    /rawAddress|recipientPhone|providerAccessToken|privateKey|proofWitness|raw.?address|recipient|phone|provider.?access.?token|witness|private.?key|proof.?secret/i,
  );
});

test('guest checkout HTTP transport posts only to same-origin merchant endpoint', async () => {
  const seen: Array<{ input: string; init: RequestInit }> = [];
  const transport = createGuestCheckoutHandoffHttpTransport({
    endpoint: '/api/veygrit/guest-checkout/handoff',
    fetcher: (async (input, init) => {
      seen.push({ input: String(input), init: init ?? {} });
      return {
        ok: true,
        json: async () => ({
          mode: 'ec-guest-checkout',
          status: 'ready',
          nextAction: 'create-guest-order',
          guestCheckoutAlias: 'guest_checkout_alias_synthetic_001',
          walletConsentRef: 'consent_synthetic_001',
          addressCredentialRef: 'addr_cred_synthetic_001',
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
      } as Response;
    }) as typeof fetch,
  });

  const payload = createVeyIdGuestCheckoutHandoffPayload({
    clientId: 'merchant_demo',
    pairwiseSubjectAlias: 'pairwise_synthetic_001',
    walletConsentRef: 'consent_synthetic_001',
    addressCredentialRef: 'addr_cred_synthetic_001',
    accessTokenRef: 'access_token_ref_synthetic_001',
    orderRef: 'order_ref_guest_001',
  });

  const result = await transport({
    url: 'https://login.veygrit.example/veygrit/guest-checkout/handoff',
    payload,
  });

  assert.equal(result.status, 'ready');
  assert.equal(seen.length, 1);
  assert.equal(seen[0]?.input, '/api/veygrit/guest-checkout/handoff');
  assert.equal(seen[0]?.init.method, 'POST');
  assert.equal(seen[0]?.init.body, JSON.stringify(payload));
  assert.doesNotMatch(JSON.stringify(seen), /login\.veygrit\.example|raw.?address|recipient|phone|witness|private.?key|proof.?secret/i);
  assert.throws(
    () => createGuestCheckoutHandoffHttpTransport({ endpoint: 'https://login.veygrit.example/veygrit/guest-checkout/handoff' }),
    /same-origin relative path/,
  );
});

test('guest checkout HTTP transport returns redacted blocked state from merchant route failure', async () => {
  const transport = createGuestCheckoutHandoffHttpTransport({
    endpoint: '/api/veygrit/guest-checkout/handoff',
    fetcher: (async () =>
      new Response(
        JSON.stringify({
          mode: 'ec-guest-checkout',
          status: 'blocked',
          nextAction: 'repair-token-exchange',
          errorCode: 'guest_checkout_handoff_failed',
        }),
        { status: 502, headers: { 'content-type': 'application/json' } },
      )) as typeof fetch,
  });

  const result = await transport({
    url: 'https://login.veygrit.example/veygrit/guest-checkout/handoff',
    payload: createVeyIdGuestCheckoutHandoffPayload({
      clientId: 'merchant_demo',
      pairwiseSubjectAlias: 'pairwise_synthetic_blocked_001',
      walletConsentRef: 'consent_synthetic_blocked_001',
      addressCredentialRef: 'addr_cred_synthetic_blocked_001',
      accessTokenRef: 'access_token_ref_synthetic_blocked_001',
      orderRef: 'order_ref_guest_blocked_001',
    }),
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.nextAction, 'repair-token-exchange');
  assert.equal(result.errorCode, 'guest_checkout_handoff_failed');
  assert.doesNotMatch(
    JSON.stringify(result),
    /raw.?address|address.?line|recipient|phone|email|witness|private.?key|proof.?secret|provider.?id.?token|provider.?access.?token|provider.?refresh.?token|raw.?provider.?profile/i,
  );
});

test('authorize URL contains only public claims and redacted handoff references', () => {
  const request = createAddressLoginRequest(
    {
      publishableKey: 'pk_test_veygrit',
      authorizeEndpoint: 'https://login.veygrit.example/address-login/authorize',
      redirectUri: 'https://merchant.example/callback',
      locale: 'ja-JP',
      defaultCountryHints: ['JP'],
    },
    {
      purpose: 'shipping',
      disclosureMode: 'proof_only',
      requestedClaims: ['deliverable', 'not_revoked'],
      state: 'state_test',
      nonce: 'nonce_test',
      redirectMode: 'manual',
    },
  );

  const url = buildAddressLoginAuthorizeUrl(request);
  const parsed = new URL(url);

  assert.equal(parsed.searchParams.get('client_id'), 'pk_test_veygrit');
  assert.equal(parsed.searchParams.get('purpose'), 'shipping');
  assert.equal(parsed.searchParams.get('disclosure_mode'), 'proof_only');
  assert.equal(parsed.searchParams.get('claims'), 'deliverable,not_revoked');
  assert.equal(parsed.searchParams.get('country_hints'), 'JP');
  assert.doesNotMatch(url, /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret/i);
});

test('SDK rejects secret-looking or unsafe public request material', () => {
  assert.throws(
    () =>
      createAddressLoginRequest(
        { publishableKey: 'sk_test_not_public' },
        { purpose: 'shipping', redirectMode: 'manual' },
      ),
    /publishableKey/,
  );

  assert.throws(
    () =>
      buildAddressLoginAuthorizeUrl({
        publishableKey: 'pk_test_veygrit',
        authorizeEndpoint: 'https://login.veygrit.example/address-login/authorize',
        purpose: 'shipping',
        disclosureMode: 'proof_only',
        requestedClaims: ['deliverable'],
        riskLevel: 'standard',
        state: 'state_test',
        nonce: 'nonce_test',
        rawAddress: 'blocked',
      } as unknown as AddressLoginAuthorizeRequest),
    /Unsafe Address Login public request field/,
  );
});

test('friend delivery helpers build hosted API payloads without private address material', () => {
  const request = createFriendDeliveryRequestPayload({
    purchaserSubjectAlias: 'pairwise_sub_synthetic_buyer_001',
    friendAlias: 'friend_alias_synthetic_001',
    cartRef: 'cart_ref_synthetic_gift_001',
    requestedAt: '2026-07-02T12:05:00Z',
  });
  const approval = createFriendDeliveryApprovalPayload({
    friendDeliveryRequestRef: 'fdr_synthetic_gift_001',
    approvalRef: 'approval_ref_synthetic_gift_001',
    selectedAddressRef: 'address_ref_synthetic_friend_selected_001',
    consentEnvelopeRef: 'ace_synthetic_friend_delivery_001',
    approvedAt: '2026-07-02T12:08:00Z',
  });

  assert.equal(request.purpose, 'anonymous_shipping');
  assert.equal(request.disclosureMode, 'carrier_decryptable');
  assert.ok(request.requestedClaims.includes('carrier_decryptable_address'));
  assert.ok(approval.approvedClaims.includes('user_approved'));
  assert.equal(
    buildFriendDeliveryRequestUrl('https://login.veygrit.example/api/veygrit/address-login'),
    'https://login.veygrit.example/api/veygrit/address-login/friend-delivery/requests',
  );
  assert.equal(
    buildFriendDeliveryApprovalUrl('https://login.veygrit.example/api/veygrit/address-login/'),
    'https://login.veygrit.example/api/veygrit/address-login/friend-delivery/approvals',
  );
  assert.doesNotMatch(JSON.stringify({ request, approval }), /raw.?address|recipient|phone|email|witness|private.?key|proof.?secret/i);
});

test('Vey ID Core helpers build authorize URL, token payload, and wallet revocation payload', () => {
  const authorizeRequest = createVeyIdAuthorizeRequest(
    {
      publishableKey: 'pk_test_veygrit',
      veyIdAuthorizeEndpoint: 'https://login.veygrit.example/veygrit/oauth/authorize',
      redirectUri: 'https://merchant.example/veygrit/callback',
    },
    {
      codeChallenge: 'pkce_challenge_synthetic_abcdefghijklmnopqrstuvwxyz',
      origin: 'https://merchant.example',
      state: 'state_test',
      nonce: 'nonce_test',
      loginHint: 'google',
    },
  );

  const authorizeUrl = buildVeyIdAuthorizeUrl(authorizeRequest);
  const parsed = new URL(authorizeUrl);

  assert.equal(parsed.pathname, '/veygrit/oauth/authorize');
  assert.equal(parsed.searchParams.get('client_id'), 'pk_test_veygrit');
  assert.equal(parsed.searchParams.get('scope'), 'openid address:read address:autofill');
  assert.equal(parsed.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(parsed.searchParams.get('origin'), 'https://merchant.example');
  assert.equal(parsed.searchParams.get('login_hint'), 'google');

  const tokenPayload = createVeyIdTokenRequestPayload({
    authorizationCodeRef: 'vey_auth_code_synthetic_001',
    clientId: 'merchant_demo',
    redirectUri: 'https://merchant.example/veygrit/callback',
    pkceVerifier: 'pkce_verifier_synthetic_abcdefghijklmnopqrstuvwxyz',
  });
  const revocationPayload = createVeyIdConnectionRevocationPayload({
    clientId: 'merchant_demo',
    pairwiseSubjectAlias: 'pairwise_synthetic_001',
    walletConsentRef: 'consent_synthetic_001',
  });
  const guestCheckoutPayload = createVeyIdGuestCheckoutHandoffPayload({
    clientId: 'merchant_demo',
    pairwiseSubjectAlias: 'pairwise_synthetic_001',
    walletConsentRef: 'consent_synthetic_001',
    addressCredentialRef: 'addr_cred_synthetic_001',
    accessTokenRef: 'access_token_ref_synthetic_001',
    orderRef: 'order_ref_guest_001',
  });

  assert.equal(tokenPayload.grantType, 'authorization_code');
  assert.equal(tokenPayload.authorizationCodeRef, 'vey_auth_code_synthetic_001');
  assert.equal(buildVeyIdTokenUrl('https://login.veygrit.example'), 'https://login.veygrit.example/veygrit/oauth/token');
  assert.equal(revocationPayload.reason, 'user_wallet_unlink');
  assert.equal(
    buildVeyIdConnectionRevocationUrl('https://login.veygrit.example'),
    'https://login.veygrit.example/veygrit/connections/revoke',
  );
  assert.equal(guestCheckoutPayload.pairwiseSubjectAlias, 'pairwise_synthetic_001');
  assert.equal(guestCheckoutPayload.addressCredentialRef, 'addr_cred_synthetic_001');
  assert.equal(
    buildVeyIdGuestCheckoutHandoffUrl('https://login.veygrit.example'),
    'https://login.veygrit.example/veygrit/guest-checkout/handoff',
  );
  assert.doesNotMatch(
    JSON.stringify({ authorizeRequest, tokenPayload, revocationPayload, guestCheckoutPayload }),
    /raw.?address|recipient|phone|email|witness|private.?key|proof.?secret|provider.*token|raw.?provider.?profile/i,
  );
});

test('Vey ID Core helpers reject provider tokens and parse only authorization refs', () => {
  assert.throws(
    () =>
      buildVeyIdAuthorizeUrl({
        publishableKey: 'pk_test_veygrit',
        authorizeEndpoint: 'https://login.veygrit.example/veygrit/oauth/authorize',
        scopes: ['openid'],
        state: 'state_test',
        nonce: 'nonce_test',
        codeChallenge: 'pkce_challenge_synthetic_abcdefghijklmnopqrstuvwxyz',
        origin: 'https://merchant.example',
        providerIdToken: 'blocked',
      } as never),
    /Unsafe Address Login public request field/,
  );

  assert.throws(
    () =>
      createVeyIdTokenRequestPayload({
        authorizationCodeRef: 'vey_auth_code_synthetic_001',
        clientId: 'merchant_demo',
        redirectUri: 'https://merchant.example/veygrit/callback',
        pkceVerifier: 'providerAccessToken_attempt',
      }),
    /Unsafe Address Login public request value/,
  );

  assert.throws(
    () =>
      createVeyIdGuestCheckoutHandoffPayload({
        clientId: 'merchant_demo',
        pairwiseSubjectAlias: 'pairwise_synthetic_001',
        walletConsentRef: 'consent_synthetic_001',
        addressCredentialRef: 'addr_cred_synthetic_001',
        accessTokenRef: 'access_token_ref_synthetic_001',
        orderRef: 'raw_address_attempt',
      }),
    /Unsafe Address Login public request value/,
  );

  const callback = parseVeyIdCallback(
    'https://merchant.example/veygrit/callback?authorization_code_ref=vey_auth_code_synthetic_001&state=state_test&iss=https%3A%2F%2Fid.veygrit.example&pairwise_subject_alias=pairwise_synthetic_001&wallet_session_ref=wallet_session_synthetic_001',
    {
      expectedState: 'state_test',
      allowedIssuer: 'https://id.veygrit.example',
    },
  );

  assert.equal(callback.status, 'authorized');
  assert.equal(callback.authorizationCodeRef, 'vey_auth_code_synthetic_001');
  assert.equal(callback.pairwiseSubjectAlias, 'pairwise_synthetic_001');
  assert.equal(callback.walletSessionRef, 'wallet_session_synthetic_001');

  assert.throws(
    () => parseVeyIdCallback('?authorization_code_ref=vey_auth_code_synthetic_001&state=state_test&providerAccessToken=blocked'),
    /Unsafe Address Login callback parameter/,
  );
});

test('friend delivery helpers reject unsafe value material before transport', () => {
  assert.throws(
    () =>
      createFriendDeliveryRequestPayload({
        purchaserSubjectAlias: 'pairwise_sub_synthetic_buyer_001',
        friendAlias: 'friend_alias_synthetic_001',
        cartRef: 'raw_address_attempt',
      }),
    /Unsafe Address Login public request value/,
  );

  assert.throws(
    () =>
      createFriendDeliveryApprovalPayload({
        friendDeliveryRequestRef: 'fdr_synthetic_gift_001',
        approvalRef: 'approval_ref_synthetic_gift_001',
        selectedAddressRef: 'recipient_phone_attempt',
        consentEnvelopeRef: 'ace_synthetic_friend_delivery_001',
      }),
    /Unsafe Address Login public request value/,
  );
});

test('useFriendDelivery is available inside VeygritProvider with idle initial state', () => {
  function FriendDeliveryStatusProbe() {
    const friendDelivery = useFriendDelivery({
      apiBaseUrl: 'https://login.veygrit.example/api/veygrit/address-login',
      requestTransport: async () => ({
        status: 'notified',
        friendDeliveryRequestRef: 'fdr_synthetic_gift_001',
        friendAlias: 'friend_alias_synthetic_001',
        consentEnvelopeRef: 'ace_synthetic_friend_delivery_001',
        notificationRef: 'wallet_notification_ref_synthetic_gift_001',
        expiresAt: '2026-07-02T12:35:00Z',
      }),
      approvalTransport: async () => ({
        status: 'approved',
        friendDeliveryRequestRef: 'fdr_synthetic_gift_001',
        approvalRef: 'approval_ref_synthetic_gift_001',
        carrierHandoffRef: 'handoff_ref_synthetic_friend_delivery_001',
        deliveryReceiptRef: 'delivery_receipt_ref_synthetic_friend_delivery_001',
        publicClaims: { deliverable: true },
      }),
    });

    return React.createElement('span', {
      'data-status': friendDelivery.status,
      'data-loading': String(friendDelivery.isLoading),
      'data-has-request': String(Boolean(friendDelivery.lastRequestResult)),
    });
  }

  const markup = renderToStaticMarkup(
    React.createElement(
      VeygritProvider,
      { publishableKey: 'pk_test_veygrit', redirectUri: 'https://merchant.example/callback' },
      React.createElement(FriendDeliveryStatusProbe),
    ),
  );

  assert.match(markup, /data-status="idle"/);
  assert.match(markup, /data-loading="false"/);
  assert.match(markup, /data-has-request="false"/);
});

test('useGuestCheckoutHandoff is available inside VeygritProvider with idle initial state', () => {
  function GuestCheckoutStatusProbe() {
    const guestCheckout = useGuestCheckoutHandoff({
      apiBaseUrl: 'https://login.veygrit.example',
      transport: async () => ({
        mode: 'ec-guest-checkout',
        status: 'ready',
        nextAction: 'create-guest-order',
        guestCheckoutAlias: 'guest_checkout_alias_synthetic_001',
        walletConsentRef: 'consent_synthetic_001',
        addressCredentialRef: 'addr_cred_synthetic_001',
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
    });

    return React.createElement('span', {
      'data-status': guestCheckout.status,
      'data-loading': String(guestCheckout.isLoading),
      'data-has-result': String(Boolean(guestCheckout.lastResult)),
    });
  }

  const markup = renderToStaticMarkup(
    React.createElement(
      VeygritProvider,
      { publishableKey: 'pk_test_veygrit', redirectUri: 'https://merchant.example/callback' },
      React.createElement(GuestCheckoutStatusProbe),
    ),
  );

  assert.match(markup, /data-status="idle"/);
  assert.match(markup, /data-loading="false"/);
  assert.match(markup, /data-has-result="false"/);
});

test('friend delivery controller proves request and approval state transitions with mock transports', async () => {
  const seen: string[] = [];
  const controller = createFriendDeliveryController({
    apiBaseUrl: 'https://login.veygrit.example/api/veygrit/address-login',
    requestTransport: async ({ url, payload }) => {
      seen.push(`request:${url}:${payload.friendAlias}`);
      assert.equal(controller.getSnapshot().status, 'requesting');
      return {
        status: 'notified',
        friendDeliveryRequestRef: 'fdr_synthetic_gift_001',
        friendAlias: payload.friendAlias,
        consentEnvelopeRef: 'ace_synthetic_friend_delivery_001',
        notificationRef: 'wallet_notification_ref_synthetic_gift_001',
        expiresAt: '2026-07-02T12:35:00Z',
      };
    },
    approvalTransport: async ({ url, payload }) => {
      seen.push(`approval:${url}:${payload.approvalRef}`);
      assert.equal(controller.getSnapshot().status, 'approving');
      return {
        status: 'approved',
        friendDeliveryRequestRef: payload.friendDeliveryRequestRef,
        approvalRef: payload.approvalRef,
        carrierHandoffRef: 'handoff_ref_synthetic_friend_delivery_001',
        deliveryReceiptRef: 'delivery_receipt_ref_synthetic_friend_delivery_001',
        publicClaims: { deliverable: true, user_approved: true },
      };
    },
  });

  assert.equal(controller.getSnapshot().status, 'idle');
  const requestResult = await controller.requestFriendDelivery({
    purchaserSubjectAlias: 'pairwise_sub_synthetic_buyer_001',
    friendAlias: 'friend_alias_synthetic_001',
    cartRef: 'cart_ref_synthetic_gift_001',
    requestedAt: '2026-07-02T12:05:00Z',
  });
  assert.equal(requestResult.status, 'notified');
  assert.equal(controller.getSnapshot().status, 'notified');
  assert.equal(controller.getSnapshot().lastRequestPayload?.purpose, 'anonymous_shipping');

  const approvalResult = await controller.approveFriendDelivery({
    friendDeliveryRequestRef: requestResult.friendDeliveryRequestRef,
    approvalRef: 'approval_ref_synthetic_gift_001',
    selectedAddressRef: 'address_ref_synthetic_friend_selected_001',
    consentEnvelopeRef: requestResult.consentEnvelopeRef,
    approvedAt: '2026-07-02T12:08:00Z',
  });
  assert.equal(approvalResult.status, 'approved');
  assert.equal(controller.getSnapshot().status, 'approved');
  assert.equal(controller.getSnapshot().lastApprovalResult?.deliveryReceiptRef, 'delivery_receipt_ref_synthetic_friend_delivery_001');
  assert.deepEqual(seen, [
    'request:https://login.veygrit.example/api/veygrit/address-login/friend-delivery/requests:friend_alias_synthetic_001',
    'approval:https://login.veygrit.example/api/veygrit/address-login/friend-delivery/approvals:approval_ref_synthetic_gift_001',
  ]);

  controller.reset();
  assert.equal(controller.getSnapshot().status, 'idle');
  assert.equal(controller.getSnapshot().lastRequestPayload, null);
});

test('checkout Friend Delivery example is package-visible and server-routed', () => {
  const example = readPackageFile('examples/checkout-friend-delivery/CheckoutFriendDelivery.tsx');
  const packageJson = JSON.parse(readPackageFile('package.json')) as { files: string[] };

  assert.ok(packageJson.files.includes('examples'));
  assert.match(example, /useFriendDelivery/);
  assert.match(example, /\/api\/veygrit\/friend-delivery\/request/);
  assert.match(example, /VeygritProvider/);
  assert.doesNotMatch(example, /serverAccessToken|VEYGRIT_SERVER_ACCESS_TOKEN|raw.?address|witness|private.?key|proof.?secret/i);
});

test('React SDK README documents package publication-safety verification', () => {
  const readme = readPackageFile('README.md');

  assert.match(readme, /npm run verify:veygrit-address-login-test-helpers/);
  assert.match(readme, /shared test-helper boundary/);
  assert.match(readme, /npm run verify:veygrit-address-login-react/);
  assert.match(readme, /npm run verify:veygrit-address-login-react-package/);
  assert.match(readme, /npm run verify:veygrit-address-login-packages/);
  assert.match(readme, /npm pack/);
  assert.match(readme, /files allowlist/);
  assert.match(readme, /not a publishing,\s+hosted-service, or production readiness claim/);
});

test('checkout Guest Checkout example is package-visible and server-routed', () => {
  const example = readPackageFile('examples/checkout-guest-checkout/CheckoutGuestCheckout.tsx');
  const packageJson = JSON.parse(readPackageFile('package.json')) as { files: string[] };

  assert.ok(packageJson.files.includes('examples'));
  assert.match(example, /GuestCheckoutButton/);
  assert.match(example, /createGuestCheckoutHandoffHttpTransport/);
  assert.match(example, /onGuestCheckoutBlocked/);
  assert.match(example, /Guest checkout blocked/);
  assert.match(example, /\/api\/veygrit\/guest-checkout\/handoff/);
  assert.match(example, /VeygritProvider/);
  assert.doesNotMatch(
    example,
    /serverAccessToken|VEYGRIT_SERVER_ACCESS_TOKEN|raw.?address|recipient|phone|witness|private.?key|proof.?secret|carrier.?api.?key/i,
  );
});

test('merchant-visible redaction example is package-visible and ref-only', () => {
  const example = readPackageFile('examples/merchant-visible-redaction/MerchantVisibleRedactionCard.tsx');
  const packageJson = JSON.parse(readPackageFile('package.json')) as { files: string[] };

  assert.ok(packageJson.files.includes('examples'));
  assert.match(example, /createMerchantVisibleRedactionDisplayModel/);
  assert.match(example, /data-veygrit-merchant-visible-redaction/);
  assert.match(example, /visible refs/);
  assert.match(example, /blocked classes/);
  assert.match(example, /consent-bound/);
  assert.doesNotMatch(
    example,
    /serverAccessToken|VEYGRIT_SERVER_ACCESS_TOKEN|raw.?address|recipient|phone|witness|private.?key|proof.?secret|carrier.?api.?key|provider.?access.?token/i,
  );
});

test('callback parser accepts only authorization code and safe handoff references', () => {
  const callback = parseAddressLoginCallback(
    'https://merchant.example/callback?code=code_test&state=state_test&iss=https%3A%2F%2Flogin.veygrit.example&session_ref=sess_ref_001&credential_ref=cred_ref_001&proof_bundle_ref=proof_ref_001&carrier_handoff_ref=carrier_handoff_001',
    {
      expectedState: 'state_test',
      allowedIssuer: 'https://login.veygrit.example',
    },
  );

  assert.equal(callback.status, 'authorized');
  assert.equal(callback.code, 'code_test');
  assert.equal(callback.state, 'state_test');
  assert.equal(callback.sessionRef, 'sess_ref_001');
  assert.equal(callback.credentialRef, 'cred_ref_001');
  assert.equal(callback.proofRef, 'proof_ref_001');
  assert.equal(callback.handoffRef, 'carrier_handoff_001');
});

test('callback parser accepts legacy proof and handoff ref aliases for compatibility', () => {
  const callback = parseAddressLoginCallback(
    '?code=code_test&state=state_test&proof_ref=proof_ref_legacy&handoff_ref=handoff_ref_legacy',
  );

  assert.equal(callback.status, 'authorized');
  assert.equal(callback.proofRef, 'proof_ref_legacy');
  assert.equal(callback.handoffRef, 'handoff_ref_legacy');
});

test('callback parser rejects state mismatch and raw recipient or address parameters', () => {
  assert.throws(
    () => parseAddressLoginCallback('?code=code_test&state=wrong_state', { expectedState: 'state_test' }),
    /state mismatch/,
  );

  assert.throws(
    () => parseAddressLoginCallback('?code=code_test&state=state_test&raw_address=blocked'),
    /Unsafe Address Login callback parameter/,
  );

  assert.throws(
    () => parseAddressLoginCallback('?code=code_test&state=state_test&recipient=blocked'),
    /Unsafe Address Login callback parameter/,
  );
});

test('hosted callback validation vectors expose redacted normalized params only', () => {
  assertHostedCallbackNormalizedParamsAreRedacted();
});

test('callback parser conforms to hosted callback validation vectors', () => {
  for (const vector of loadHostedCallbackValidationVectors()) {
    const parse = () => parseAddressLoginCallback(new URLSearchParams(vector.input), vector.options);

    if (vector.expectedResult === 'rejected') {
      assert.throws(parse, expectedCallbackErrorPattern(vector), vector.id);
      continue;
    }

    const callback = parse();
    const expected = vector.expectedNormalizedParams;
    assert.ok(expected, `${vector.id} should declare normalized callback params`);
    assert.equal(callback.status, 'authorized', vector.id);
    assert.equal(callback.code, expected.code, vector.id);
    assert.equal(callback.state, expected.state, vector.id);
    assert.equal(callback.issuer, expected.iss, vector.id);
    assert.equal(callback.sessionRef, expected.session_ref, vector.id);
    assert.equal(callback.credentialRef, expected.credential_ref, vector.id);
    assert.equal(callback.proofRef, expected.proof_bundle_ref, vector.id);
    assert.equal(callback.handoffRef, expected.carrier_handoff_ref, vector.id);
  }
});
