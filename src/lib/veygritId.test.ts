import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildVeygritIdAccount,
  buildVeygritIdAuthorizationRequest,
  buildVeygritIdConsentGrant,
  buildVeygritIdGuestCheckoutHandoff,
  buildVeygritIdIntegrationPlan,
  buildVeygritIdPartnerApplication,
  buildVeygritIdPairwiseSubjectAlias,
  buildVeygritIdSession,
  exchangeVeygritIdAuthorizationCode,
  issueVeygritIdAuthorizationCode,
  revokeVeygritIdConnection,
  validateVeygritIdGrant,
} from './veygritId';

test('Veygrit ID issues a reviewed address-fill grant for an approved EC partner', () => {
  const account = buildVeygritIdAccount({
    displayAlias: 'traveler-user',
    loginProviders: ['google', 'apple'],
    primaryProvider: 'google',
    emailVerified: true,
    mfaEnabled: true,
    locale: 'ja-JP',
    countryCode: 'JP',
    basicProfileCommitment: 'profile_basic_commitment',
    travelProfileCommitment: 'profile_travel_commitment',
    passportNameCommitment: 'passport_name_commitment',
    addresses: [
      {
        addressId: 'HOME-JP',
        kind: 'home',
        ownerRelationship: 'self',
        countryCode: 'JP',
        language: 'ja-JP',
        addressCommitment: 'address_commitment_home',
        agidCommitment: 'agid_commitment_home',
        aoidCommitment: 'aoid_commitment_home',
        qualityDecision: 'verified',
      },
    ],
  });
  const partner = buildVeygritIdPartnerApplication({
    legalName: 'Example Shop Inc.',
    displayName: 'Example Shop',
    siteCategory: 'ec',
    domains: ['example-shop.com'],
    verifiedDomains: ['example-shop.com'],
    requestedScopes: ['profile.basic', 'address.shipping', 'contact.phone', 'locale'],
    privacyPolicyUrl: 'https://example-shop.com/privacy',
    termsUrl: 'https://example-shop.com/terms',
    businessVerified: true,
    kybVerified: true,
    contentReviewed: true,
    fraudReviewPassed: true,
    privacyPolicyReviewed: true,
    securityReviewed: true,
    httpsOnly: true,
    dataRetentionDays: 30,
    apiKeyIssued: true,
    clientId: 'vg_client_example_shop',
    redirectUris: ['https://example-shop.com/veygrit/callback'],
  });
  const request = buildVeygritIdAuthorizationRequest({
    clientId: 'vg_client_example_shop',
    origin: 'https://example-shop.com',
    redirectUri: 'https://example-shop.com/veygrit/callback',
    requestedScopes: ['profile.basic', 'address.shipping', 'contact.phone', 'locale'],
    purpose: 'checkout-address-autofill',
    state: 'state-token-001',
    nonce: 'nonce-token-001',
    createdAt: '2026-06-20T00:00:00.000Z',
    expiresAt: '2026-06-20T00:10:00.000Z',
    userLoggedIn: true,
    reauthenticatedAt: '2026-06-20T00:00:30.000Z',
  });
  const grant = buildVeygritIdConsentGrant({
    account,
    partner,
    request,
    now: '2026-06-20T00:01:00.000Z',
    consent: {
      approvedScopes: ['profile.basic', 'address.shipping', 'contact.phone', 'locale'],
      selectedAddressId: account.addresses[0].addressId,
      userConfirmed: true,
      consentedAt: '2026-06-20T00:01:00.000Z',
    },
  });

  assert.equal(account.errors.length, 0);
  assert.equal(partner.status, 'approved');
  assert.equal(grant.status, 'ready-to-fill');
  assert.equal(grant.nextAction, 'post-sealed-claims');
  assert.deepEqual(grant.approvedScopes, ['profile.basic', 'address.shipping', 'contact.phone', 'locale']);
  assert.ok(grant.claimKinds.includes('shipping-address'));
  assert.equal(grant.sealedClaimEnvelope.loggedPlaintext, false);
  assert.equal(grant.sealedClaimEnvelope.containsPlaintextForRecipientOnly, true);
  assert.equal(validateVeygritIdGrant(grant).ok, true);
});

test('Vey ID core issues session, pairwise alias, auth code, token refs, and wallet-side revocation', () => {
  const account = buildVeygritIdAccount({
    displayAlias: 'checkout-user',
    loginProviders: ['google'],
    primaryProvider: 'google',
    emailVerified: true,
    mfaEnabled: true,
    basicProfileCommitment: 'profile_basic_commitment',
    addresses: [
      {
        addressId: 'HOME-US',
        kind: 'home',
        ownerRelationship: 'self',
        countryCode: 'US',
        language: 'en-US',
        addressCommitment: 'address_commitment_us_home',
        qualityDecision: 'verified',
      },
    ],
  });
  const partner = buildVeygritIdPartnerApplication({
    legalName: 'Serious Commerce Inc.',
    displayName: 'Serious Commerce',
    siteCategory: 'ec',
    domains: ['serious-commerce.example'],
    verifiedDomains: ['serious-commerce.example'],
    requestedScopes: ['profile.basic', 'address.shipping', 'locale'],
    businessVerified: true,
    kybVerified: true,
    contentReviewed: true,
    fraudReviewPassed: true,
    privacyPolicyReviewed: true,
    securityReviewed: true,
    httpsOnly: true,
    dataRetentionDays: 14,
    apiKeyIssued: true,
    clientId: 'vg_client_serious_commerce',
    redirectUris: ['https://serious-commerce.example/veygrit/callback'],
  });
  const session = buildVeygritIdSession({
    account,
    provider: 'google',
    providerSubject: 'google-subject-synthetic-001',
    deviceBindingRef: 'device_binding_ref_checkout_001',
    authenticatedAt: '2026-06-20T00:00:00.000Z',
    stepUpAt: '2026-06-20T00:00:20.000Z',
    stepUpMethods: ['mfa', 'device-bound'],
  });
  const request = buildVeygritIdAuthorizationRequest({
    clientId: 'vg_client_serious_commerce',
    origin: 'https://serious-commerce.example',
    redirectUri: 'https://serious-commerce.example/veygrit/callback',
    requestedScopes: ['profile.basic', 'address.shipping', 'locale'],
    purpose: 'ec-social-login-address-autofill',
    state: 'state-serious-commerce-001',
    nonce: 'nonce-serious-commerce-001',
    createdAt: '2026-06-20T00:01:00.000Z',
    expiresAt: '2026-06-20T00:11:00.000Z',
    userLoggedIn: true,
    reauthenticatedAt: '2026-06-20T00:01:10.000Z',
  });
  const grant = buildVeygritIdConsentGrant({
    account,
    partner,
    request,
    now: '2026-06-20T00:02:00.000Z',
    consent: {
      approvedScopes: ['profile.basic', 'address.shipping', 'locale'],
      selectedAddressId: 'HOME-US',
      userConfirmed: true,
      consentedAt: '2026-06-20T00:02:00.000Z',
    },
  });
  const pairwise = buildVeygritIdPairwiseSubjectAlias({ account, partner, origin: request.origin });
  const code = issueVeygritIdAuthorizationCode({
    session,
    grant,
    account,
    partner,
    request,
    pkceChallenge: 'pkce_challenge_s256_demo',
    now: '2026-06-20T00:02:30.000Z',
  });
  const exchange = exchangeVeygritIdAuthorizationCode({
    authorizationCode: code,
    clientId: 'vg_client_serious_commerce',
    redirectUri: 'https://serious-commerce.example/veygrit/callback',
    pkceChallenge: 'pkce_challenge_s256_demo',
    authTime: session.authenticatedAt,
    now: '2026-06-20T00:03:00.000Z',
  });
  const guestCheckout = buildVeygritIdGuestCheckoutHandoff({
    tokenExchange: exchange,
    grant,
    partner,
    orderRef: 'order_ref_demo_001',
  });
  const revocation = revokeVeygritIdConnection({
    account,
    partner,
    grant,
    now: '2026-06-20T00:04:00.000Z',
  });

  assert.equal(session.status, 'active');
  assert.equal(session.provider, 'google');
  assert.match(session.sessionRef, /^vey_session_/);
  assert.match(session.walletSessionRef, /^wallet_session_/);
  assert.equal(session.privacy.storesProviderIdToken, false);
  assert.equal(session.privacy.providerSubjectStoredAsHash, true);
  assert.equal(partner.status, 'approved');
  assert.equal(grant.status, 'ready-to-fill');
  assert.equal(pairwise.pairwiseSubjectAlias, code.pairwiseSubjectAlias);
  assert.equal(pairwise.privacy.globalSubjectIdExposedToMerchant, false);
  assert.equal(code.status, 'issued');
  assert.equal(code.nextAction, 'exchange-code');
  assert.match(code.authorizationCodeRef ?? '', /^vey_auth_code_/);
  assert.equal(code.privacy.rawAuthorizationCodeLogged, false);
  assert.equal(exchange.status, 'issued');
  assert.equal(exchange.tokenType, 'bearer-ref');
  assert.match(exchange.accessTokenRef ?? '', /^vey_access_token_/);
  assert.match(exchange.idTokenRef ?? '', /^vey_id_token_/);
  assert.match(exchange.addressCredentialRef ?? '', /^address_credential_/);
  assert.equal(exchange.claims.sub, pairwise.pairwiseSubjectAlias);
  assert.deepEqual(exchange.claims.scopeRefs, ['profile.basic', 'address.shipping', 'locale']);
  assert.equal(exchange.privacy.refreshTokenIssued, false);
  assert.equal(guestCheckout.status, 'ready');
  assert.equal(guestCheckout.mode, 'ec-guest-checkout');
  assert.equal(guestCheckout.nextAction, 'create-guest-order');
  assert.equal(guestCheckout.merchantAccountCreationRequired, false);
  assert.equal(guestCheckout.ecPasswordRequired, false);
  assert.equal(guestCheckout.walletLoginRequired, true);
  assert.match(guestCheckout.guestCheckoutAlias, /^vey_guest_checkout_/);
  assert.match(guestCheckout.walletConsentRef, /^wallet_consent_/);
  assert.match(guestCheckout.carrierHandoffRef ?? '', /^carrier_handoff_/);
  assert.equal(guestCheckout.addressCredentialRef, exchange.addressCredentialRef);
  assert.equal(guestCheckout.privacy.rawAddressSharedWithMerchant, false);
  assert.equal(guestCheckout.privacy.merchantCanCreateAccountSilently, false);
  assert.equal(revocation.nextAction, 'notify-merchant-and-invalidate-refs');
  assert.ok(revocation.merchantDeletionRefs.includes('pairwiseSubjectAlias'));
  assert.ok(revocation.merchantDeletionRefs.includes('addressCredentialRef'));
  assert.equal(revocation.privacy.merchantCanContinuePullingAddress, false);
  assert.doesNotMatch(JSON.stringify({ session, code, exchange, guestCheckout, revocation }), /rawAddressValue|providerTokenValue|providerAccessTokenValue|providerRefreshTokenValue|privateKeyValue|proofSecretValue/);
});

test('Veygrit ID blocks guest checkout handoff without address consent or issued token refs', () => {
  const account = buildVeygritIdAccount({
    loginProviders: ['google'],
    emailVerified: true,
    basicProfileCommitment: 'profile_basic_commitment',
  });
  const partner = buildVeygritIdPartnerApplication({
    legalName: 'Guest Shop Inc.',
    displayName: 'Guest Shop',
    siteCategory: 'ec',
    domains: ['guest-shop.example'],
    verifiedDomains: ['guest-shop.example'],
    requestedScopes: ['profile.basic'],
    businessVerified: true,
    kybVerified: true,
    contentReviewed: true,
    fraudReviewPassed: true,
    privacyPolicyReviewed: true,
    securityReviewed: true,
    httpsOnly: true,
    dataRetentionDays: 7,
    apiKeyIssued: true,
    clientId: 'vg_client_guest_shop',
    redirectUris: ['https://guest-shop.example/veygrit/callback'],
  });
  const request = buildVeygritIdAuthorizationRequest({
    clientId: 'vg_client_guest_shop',
    origin: 'https://guest-shop.example',
    redirectUri: 'https://guest-shop.example/veygrit/callback',
    requestedScopes: ['profile.basic'],
    purpose: 'guest-checkout',
    state: 'state-guest-shop-001',
    nonce: 'nonce-guest-shop-001',
    createdAt: '2026-06-20T00:01:00.000Z',
    expiresAt: '2026-06-20T00:11:00.000Z',
    userLoggedIn: true,
  });
  const grant = buildVeygritIdConsentGrant({
    account,
    partner,
    request,
    now: '2026-06-20T00:02:00.000Z',
    consent: {
      approvedScopes: ['profile.basic'],
      userConfirmed: true,
      consentedAt: '2026-06-20T00:02:00.000Z',
    },
  });
  const exchange = exchangeVeygritIdAuthorizationCode({
    authorizationCode: {
      modelVersion: grant.modelVersion,
      status: 'blocked',
      nextAction: 'repair-grant',
      pairwiseSubjectAlias: 'pairwise_subject_BLOCKED',
      walletSessionRef: 'wallet_session_BLOCKED',
      grantId: grant.grantId,
      clientId: 'vg_client_guest_shop',
      redirectUri: 'https://guest-shop.example/veygrit/callback',
      stateHash: request.stateHash,
      nonceHash: 'nonce_hash_BLOCKED',
      pkceChallengeHash: 'pkce_hash_BLOCKED',
      approvedScopes: ['profile.basic'],
      claimKinds: ['basic-profile'],
      issuedAt: '2026-06-20T00:03:00.000Z',
      expiresAt: '2026-06-20T00:08:00.000Z',
      errors: ['grant-not-ready'],
      warnings: [],
      privacy: {
        rawAuthorizationCodeLogged: false,
        rawAddressIncluded: false,
        providerTokenIncluded: false,
      },
    },
    clientId: 'vg_client_guest_shop',
    redirectUri: 'https://guest-shop.example/veygrit/callback',
    pkceChallenge: 'pkce_challenge_s256_demo',
    now: '2026-06-20T00:03:30.000Z',
  });
  const guestCheckout = buildVeygritIdGuestCheckoutHandoff({
    tokenExchange: exchange,
    grant,
    partner,
    orderRef: 'buyer@example.com',
  });

  assert.equal(guestCheckout.status, 'blocked');
  assert.equal(guestCheckout.nextAction, 'repair-token-exchange');
  assert.ok(guestCheckout.errors.includes('token-exchange-not-issued'));
  assert.ok(guestCheckout.errors.includes('address-credential-ref-required'));
  assert.ok(guestCheckout.errors.includes('address-scope-required-for-guest-checkout'));
  assert.ok(guestCheckout.errors.includes('guest-checkout-order-ref-private-material-not-allowed'));
  assert.equal(guestCheckout.ttlSeconds, 0);
  assert.equal(guestCheckout.privacy.rawAddressSharedWithMerchant, false);
});

test('Veygrit ID requires reviewed legal entities and rejects personal or anonymous embed sites', () => {
  const partner = buildVeygritIdPartnerApplication({
    legalName: 'Anonymous personal checkout',
    siteCategory: 'personal-site',
    domains: ['personal.example'],
    verifiedDomains: ['personal.example'],
    requestedScopes: ['address.shipping'],
    businessVerified: false,
    anonymousOperator: true,
    httpsOnly: true,
  });

  assert.equal(partner.status, 'rejected');
  assert.ok(partner.errors.includes('partner-category-not-eligible-for-veygrit-id'));
  assert.equal(partner.apiKeyIssued, false);
  assert.equal(partner.privacy.exposesPersonalAddressData, false);
});

test('Veygrit ID account stores only self address commitments and rejects raw private material', () => {
  const account = buildVeygritIdAccount({
    loginProviders: ['email'],
    passportNumber: 'AB1234567',
    rawEmail: 'alice@example.com',
    addresses: [
      {
        kind: 'home',
        ownerRelationship: 'family',
        rawAddress: '1-1 Chiyoda Tokyo',
        addressCommitment: 'address_commitment_family',
      },
    ],
  });

  assert.ok(account.errors.includes('unsupported-account-creation-provider:email'));
  assert.ok(account.errors.includes('passportNumber-not-allowed-in-veygrit-id-account'));
  assert.ok(account.errors.includes('rawEmail-not-allowed-in-veygrit-id-account'));
  assert.ok(account.errors.includes('only-self-addresses-allowed-in-mvp'));
  assert.ok(account.errors.includes('raw-private-address-material-not-allowed'));
  assert.equal(account.addresses.length, 0);
  assert.deepEqual(account.loginProviders, ['google']);
  assert.equal(account.privacy.storesOnlySelfAddresses, true);
});

test('Vey ID session rejects provider tokens and raw provider profiles', () => {
  const account = buildVeygritIdAccount({
    loginProviders: ['apple'],
    primaryProvider: 'apple',
    emailVerified: true,
  });
  const session = buildVeygritIdSession({
    account,
    provider: 'apple',
    providerSubject: 'apple-subject-synthetic-001',
    providerIdToken: 'blocked provider token',
    providerAccessToken: 'blocked provider access token',
    providerRefreshToken: 'blocked provider refresh token',
    rawProviderProfile: { name: 'blocked raw profile' },
  });

  assert.equal(session.status, 'blocked');
  assert.ok(session.errors.includes('providerIdToken-not-allowed-in-veygrit-id-session'));
  assert.ok(session.errors.includes('providerAccessToken-not-allowed-in-veygrit-id-session'));
  assert.ok(session.errors.includes('providerRefreshToken-not-allowed-in-veygrit-id-session'));
  assert.ok(session.errors.includes('rawProviderProfile-not-allowed-in-veygrit-id-session'));
  assert.equal(session.privacy.storesProviderIdToken, false);
  assert.equal(session.privacy.storesRawProviderProfile, false);
  assert.doesNotMatch(JSON.stringify(session), /blocked provider token|blocked provider access token|blocked provider refresh token|blocked raw profile/);
});

test('Veygrit ID account creation accepts Google and Apple only', () => {
  const account = buildVeygritIdAccount({
    loginProviders: ['google', 'apple', 'github', 'email', 'passkey', 'line'],
    primaryProvider: 'passkey',
    passkeyEnabled: true,
  });

  assert.deepEqual(account.loginProviders, ['google', 'apple']);
  assert.equal(account.primaryProvider, 'google');
  assert.equal(account.assurance, 'passkey');
  assert.ok(account.errors.includes('unsupported-account-creation-provider:github'));
  assert.ok(account.errors.includes('unsupported-account-creation-provider:email'));
  assert.ok(account.errors.includes('unsupported-account-creation-provider:passkey'));
  assert.ok(account.errors.includes('unsupported-account-creation-provider:line'));
  assert.ok(account.errors.includes('unsupported-primary-account-creation-provider:passkey'));
});

test('Veygrit ID provider whitelist fixture keeps EC Social Login separate from Playlist Commerce', () => {
  const plan = buildVeygritIdIntegrationPlan();
  const account = buildVeygritIdAccount({
    loginProviders: ['github', 'line'],
    primaryProvider: 'github',
  });

  assert.deepEqual(plan.accountCreationProviders, ['google', 'apple']);
  assert.equal(plan.recommendedFlow.some(step => /Playlist Commerce/i.test(step)), false);
  assert.ok(plan.recommendedFlow.some(step => /EC guest checkout/i.test(step)));
  assert.deepEqual(account.loginProviders, ['google']);
  assert.equal(account.primaryProvider, 'google');
  assert.ok(account.errors.includes('unsupported-account-creation-provider:github'));
  assert.ok(account.errors.includes('unsupported-account-creation-provider:line'));
  assert.ok(account.errors.includes('unsupported-primary-account-creation-provider:github'));
});

test('Veygrit ID blocks address autofill when fresh reauthentication or user consent is missing', () => {
  const account = buildVeygritIdAccount({
    loginProviders: ['google'],
    emailVerified: true,
    basicProfileCommitment: 'profile_basic_commitment',
    addresses: [
      {
        kind: 'home',
        ownerRelationship: 'self',
        countryCode: 'JP',
        addressCommitment: 'address_commitment_home',
      },
    ],
  });
  const partner = buildVeygritIdPartnerApplication({
    legalName: 'Example Travel Inc.',
    displayName: 'Example Travel',
    siteCategory: 'travel',
    domains: ['travel.example'],
    verifiedDomains: ['travel.example'],
    requestedScopes: ['profile.basic', 'profile.travel', 'address.shipping'],
    businessVerified: true,
    kybVerified: true,
    contentReviewed: true,
    fraudReviewPassed: true,
    privacyPolicyReviewed: true,
    securityReviewed: true,
    httpsOnly: true,
    clientId: 'vg_client_travel',
    redirectUris: ['https://travel.example/veygrit/callback'],
  });
  const request = buildVeygritIdAuthorizationRequest({
    clientId: 'vg_client_travel',
    origin: 'travel.example',
    redirectUri: 'https://travel.example/veygrit/callback',
    requestedScopes: ['profile.basic', 'profile.travel', 'address.shipping'],
    createdAt: '2026-06-20T00:00:00.000Z',
    expiresAt: '2026-06-20T00:10:00.000Z',
    userLoggedIn: true,
  });
  const grant = buildVeygritIdConsentGrant({
    account,
    partner,
    request,
    now: '2026-06-20T00:01:00.000Z',
    consent: {
      approvedScopes: ['profile.basic', 'profile.travel', 'address.shipping'],
      userConfirmed: false,
    },
  });

  assert.equal(grant.status, 'requires-consent');
  assert.ok(grant.errors.includes('user-consent-not-confirmed'));
  assert.ok(grant.errors.includes('fresh-reauthentication-required'));
  assert.equal(validateVeygritIdGrant(grant).ok, false);
});

test('Veygrit ID integration plan is Clerk-like but partner-gated', () => {
  const plan = buildVeygritIdIntegrationPlan();

  assert.equal(plan.packageName, '@veygrit/id');
  assert.equal(plan.buttonLabel, 'Veygritで住所入力');
  assert.deepEqual(plan.accountCreationProviders, ['google', 'apple']);
  assert.ok(plan.components.includes('<VeygritAddressButton />'));
  assert.ok(plan.components.includes('<VeygritGuestCheckoutButton />'));
  assert.ok(plan.components.includes('<VeygritConnectionRevocation />'));
  assert.ok(plan.backendEndpoints.includes('POST /veygrit/address-fill/exchange'));
  assert.ok(plan.backendEndpoints.includes('POST /veygrit/guest-checkout/handoff'));
  assert.ok(plan.backendEndpoints.includes('POST /veygrit/oauth/token'));
  assert.ok(plan.backendEndpoints.includes('POST /veygrit/connections/revoke'));
  assert.ok(plan.requiredPartnerGates.includes('法人確認'));
  assert.ok(plan.recommendedFlow.some(step => step.includes('Google or Apple only')));
  assert.ok(plan.recommendedFlow.some(step => step.includes('pairwise subject alias')));
  assert.ok(plan.recommendedFlow.some(step => step.includes('authorizationCodeRef')));
  assert.ok(plan.notes.some(note => note.includes('email/password')));
  assert.ok(plan.notes.some(note => note.includes('no EC account/password')));
  assert.ok(plan.recommendedFlow.some(step => step.includes('sealed claims')));
  assert.ok(plan.recommendedFlow.some(step => step.includes('guestCheckoutAlias')));
});

test('Veygrit ID core docs and verification gate are present', () => {
  const conceptDoc = readFileSync('docs/veygrit-id-address-social-login-ja.md', 'utf8');
  const foundationDoc = readFileSync('docs/product/vey-id-address-wallet-foundation.md', 'utf8');
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };

  assert.match(conceptDoc, /本格IDコア/);
  assert.match(conceptDoc, /pairwiseSubjectAlias/);
  assert.match(conceptDoc, /authorizationCodeRef/);
  assert.match(conceptDoc, /accessTokenRef/);
  assert.match(conceptDoc, /addressCredentialRef/);
  assert.match(conceptDoc, /wallet-side revocation/);
  assert.match(conceptDoc, /ECゲストチェックアウト/);
  assert.match(conceptDoc, /guestCheckoutAlias/);
  assert.match(conceptDoc, /EC password: not required/);
  assert.match(foundationDoc, /PKCE/);
  assert.match(foundationDoc, /provider subject/);
  assert.match(foundationDoc, /Google\/Apple の provider token/);
  assert.match(foundationDoc, /walletConsentRef/);
  assert.doesNotMatch(conceptDoc, /sk_live|privateKeyValue|proofSecretValue|providerTokenValue/);
  assert.equal(packageJson.scripts?.['verify:veygrit-id'], 'tsx --test src/lib/veygritId.test.ts');
});
