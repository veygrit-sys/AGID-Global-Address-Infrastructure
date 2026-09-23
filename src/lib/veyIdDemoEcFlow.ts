import {
  buildVeygritIdAccount,
  buildVeygritIdAuthorizationRequest,
  buildVeygritIdConsentGrant,
  buildVeygritIdGuestCheckoutHandoff,
  buildVeygritIdPartnerApplication,
  buildVeygritIdSession,
  exchangeVeygritIdAuthorizationCode,
  issueVeygritIdAuthorizationCode,
  revokeVeygritIdConnection,
  validateVeygritIdGrant,
  type VeygritIdAuthProvider,
  type VeygritIdScope,
} from './veygritId';

export const VEY_ID_DEMO_EC_FLOW_VERSION = 'vey-id-demo-ec-flow-v0.1';

export type VeyIdDemoEcFlowStatus = 'ready' | 'blocked';
export type VeyIdDemoEcActor = 'shopper' | 'merchant-ec' | 'vey-id' | 'address-wallet' | 'carrier-gateway';

export type VeyIdDemoEcStep = {
  id: string;
  actor: VeyIdDemoEcActor;
  label: string;
  merchantVisible: boolean;
  emitsRefs: string[];
  nextAction: string;
};

export type VeyIdDemoEcMerchantVisibleRedactionAffordance = {
  boundaryGateId: 'merchant-visible-redaction';
  boundarySource: 'src/lib/veyIdAddressWalletFoundation.ts#privacyThreatBoundaryGates';
  displayFields: [
    'pairwiseSubjectAlias',
    'guestCheckoutAlias',
    'walletConsentRef',
    'addressCredentialRef',
    'carrierHandoffRef',
  ];
  displayRefs: string[];
  blockedMaterial: string[];
  requiredNextAction: 'create-guest-order-from-refs' | 'request-address-wallet-consent';
  nonClaims: string[];
};

export type VeyIdDemoEcFlow = {
  version: typeof VEY_ID_DEMO_EC_FLOW_VERSION;
  demoName: 'Vey ID guest EC checkout with Address Wallet reuse';
  status: VeyIdDemoEcFlowStatus;
  accountPolicy: {
    allowedCreationProviders: ['google', 'apple'];
    selectedProvider: VeygritIdAuthProvider;
    emailPasswordSignupEnabled: false;
    walletLoginRequiredForAddressReuse: true;
  };
  merchantPolicy: {
    playlistCommerceStartWithoutLogin: true;
    ecIntegrationRequiresVeyIdButtonForAddressReuse: true;
    merchantAccountRequiredBeforeCheckout: false;
    passwordRequiredBeforeCheckout: false;
    canCreateAccountSilently: false;
  };
  coreRefs: {
    partnerId: string;
    clientId?: string;
    sessionRef?: string;
    walletSessionRef?: string;
    pairwiseSubjectAlias?: string;
    authorizationCodeRef?: string;
    accessTokenRef?: string;
    idTokenRef?: string;
    addressCredentialRef?: string;
    walletConsentRef?: string;
    guestCheckoutAlias?: string;
    carrierHandoffRef?: string;
    revocationRef?: string;
  };
  merchantVisibleRefs: string[];
  merchantVisibleRedactionAffordance: VeyIdDemoEcMerchantVisibleRedactionAffordance;
  walletPrivateMaterial: string[];
  merchantBlockedMaterial: string[];
  steps: VeyIdDemoEcStep[];
  privacy: {
    rawAddressVisibleToMerchant: false;
    rawPhoneVisibleToMerchant: false;
    providerTokenVisibleToMerchant: false;
    carrierCredentialVisibleToMerchant: false;
    productionTraffic: false;
  };
  validationGates: string[];
  nonClaims: string[];
  errors: string[];
  warnings: string[];
};

export type VeyIdDemoEcFlowOptions = {
  provider?: VeygritIdAuthProvider;
  includeAddressConsent?: boolean;
};

export type VeyIdDemoEcValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

const DEMO_TIME = '2026-07-18T00:00:00.000Z';
const DEMO_REAUTH_TIME = '2026-07-18T00:00:20.000Z';
const DEMO_CONSENT_TIME = '2026-07-18T00:01:00.000Z';
const DEMO_CODE_TIME = '2026-07-18T00:01:30.000Z';
const DEMO_EXCHANGE_TIME = '2026-07-18T00:02:00.000Z';

const DEMO_SCOPES = ['profile.basic', 'address.shipping', 'locale'] as const satisfies VeygritIdScope[];
const DEMO_PROFILE_ONLY_SCOPES = ['profile.basic', 'locale'] as const satisfies VeygritIdScope[];

const MERCHANT_FORBIDDEN_VALUE_PATTERNS = [
  /rawAddressValue/i,
  /recipientNameValue/i,
  /providerTokenValue/i,
  /providerAccessTokenValue/i,
  /providerRefreshTokenValue/i,
  /privateKeyValue/i,
  /proofSecretValue/i,
  /carrierApiKeyValue/i,
  /productionCredentialValue/i,
  /-----BEGIN/i,
  /sk_live_/i,
] as const;

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function buildSteps(flow: {
  includeAddressConsent: boolean;
  pairwiseSubjectAlias?: string;
  authorizationCodeRef?: string;
  accessTokenRef?: string;
  idTokenRef?: string;
  addressCredentialRef?: string;
  walletConsentRef?: string;
  guestCheckoutAlias?: string;
  carrierHandoffRef?: string;
}): VeyIdDemoEcStep[] {
  return [
    {
      id: 'open-ec-cart',
      actor: 'shopper',
      label: 'Shopper opens the demo EC cart and can continue as a guest.',
      merchantVisible: true,
      emitsRefs: [],
      nextAction: 'show-guest-checkout-and-vey-id-address-button',
    },
    {
      id: 'continue-with-vey-id',
      actor: 'merchant-ec',
      label: 'Merchant redirects to Vey ID only when the shopper wants Address Wallet reuse.',
      merchantVisible: true,
      emitsRefs: flow.pairwiseSubjectAlias ? [flow.pairwiseSubjectAlias] : [],
      nextAction: 'start-pkce-authorization-request',
    },
    {
      id: 'wallet-login',
      actor: 'vey-id',
      label: 'Vey ID opens or creates the account with Google or Apple only.',
      merchantVisible: false,
      emitsRefs: flow.authorizationCodeRef ? [flow.authorizationCodeRef] : [],
      nextAction: 'show-address-consent-sheet',
    },
    {
      id: 'address-consent',
      actor: 'address-wallet',
      label: flow.includeAddressConsent
        ? 'Address Wallet consent approves one shipping-address credential ref.'
        : 'Address Wallet blocks the flow until shipping-address consent is added.',
      merchantVisible: false,
      emitsRefs: flow.addressCredentialRef ? [flow.addressCredentialRef] : [],
      nextAction: flow.includeAddressConsent ? 'return-scoped-refs-to-merchant' : 'request-address-consent',
    },
    {
      id: 'guest-order',
      actor: 'merchant-ec',
      label: 'Merchant creates a guest order from refs without saving an EC password.',
      merchantVisible: true,
      emitsRefs: unique([flow.accessTokenRef, flow.idTokenRef, flow.guestCheckoutAlias, flow.walletConsentRef]),
      nextAction: flow.carrierHandoffRef ? 'send-carrier-handoff-ref' : 'wait-for-wallet-consent',
    },
    {
      id: 'carrier-handoff',
      actor: 'carrier-gateway',
      label: 'Carrier gateway receives the delivery handoff ref; merchant never receives carrier credentials.',
      merchantVisible: true,
      emitsRefs: flow.carrierHandoffRef ? [flow.carrierHandoffRef] : [],
      nextAction: flow.carrierHandoffRef ? 'create-sandbox-shipment-intent' : 'none',
    },
  ];
}

export function buildVeyIdDemoEcFlow(options: VeyIdDemoEcFlowOptions = {}): VeyIdDemoEcFlow {
  const provider = options.provider ?? 'google';
  const includeAddressConsent = options.includeAddressConsent !== false;

  const account = buildVeygritIdAccount({
    displayAlias: 'demo-checkout-user',
    loginProviders: ['google', 'apple'],
    primaryProvider: provider,
    emailVerified: true,
    mfaEnabled: true,
    locale: 'ja-JP',
    countryCode: 'JP',
    basicProfileCommitment: 'profile_basic_commitment_demo_v1',
    addresses: [
      {
        addressId: 'DEMO-HOME-REF',
        kind: 'home',
        ownerRelationship: 'self',
        countryCode: 'JP',
        language: 'ja-JP',
        addressCommitment: 'address_commitment_demo_home_v1',
        agidCommitment: 'agid_commitment_demo_home_v1',
        qualityDecision: 'verified',
      },
    ],
  });

  const partner = buildVeygritIdPartnerApplication({
    legalName: 'Vey Demo Commerce Inc.',
    displayName: 'Vey Demo Shop',
    siteCategory: 'ec',
    domains: ['vey-demo-shop.example'],
    verifiedDomains: ['vey-demo-shop.example'],
    requestedScopes: [...DEMO_SCOPES],
    privacyPolicyUrl: 'https://vey-demo-shop.example/privacy',
    termsUrl: 'https://vey-demo-shop.example/terms',
    businessVerified: true,
    kybVerified: true,
    contentReviewed: true,
    fraudReviewPassed: true,
    privacyPolicyReviewed: true,
    securityReviewed: true,
    httpsOnly: true,
    dataRetentionDays: 14,
    apiKeyIssued: true,
    clientId: 'vg_client_vey_demo_shop',
    redirectUris: ['https://vey-demo-shop.example/vey-id/callback'],
  });

  const session = buildVeygritIdSession({
    account,
    provider,
    providerSubject: `${provider}-subject-demo-ref-001`,
    deviceBindingRef: 'device_binding_ref_demo_checkout_001',
    authenticatedAt: DEMO_TIME,
    stepUpAt: DEMO_REAUTH_TIME,
    stepUpMethods: ['mfa', 'device-bound'],
  });

  const request = buildVeygritIdAuthorizationRequest({
    clientId: 'vg_client_vey_demo_shop',
    origin: 'https://vey-demo-shop.example',
    redirectUri: 'https://vey-demo-shop.example/vey-id/callback',
    requestedScopes: [...DEMO_SCOPES],
    purpose: 'ec-guest-checkout-address-wallet-reuse',
    state: 'state_vey_demo_shop_001',
    nonce: 'nonce_vey_demo_shop_001',
    createdAt: DEMO_TIME,
    expiresAt: '2026-07-18T00:10:00.000Z',
    userLoggedIn: true,
    reauthenticatedAt: DEMO_REAUTH_TIME,
  });

  const grant = buildVeygritIdConsentGrant({
    account,
    partner,
    request,
    now: DEMO_CONSENT_TIME,
    consent: {
      approvedScopes: includeAddressConsent ? [...DEMO_SCOPES] : [...DEMO_PROFILE_ONLY_SCOPES],
      selectedAddressId: includeAddressConsent ? account.addresses[0]?.addressId : undefined,
      userConfirmed: true,
      consentedAt: DEMO_CONSENT_TIME,
    },
  });

  const code = issueVeygritIdAuthorizationCode({
    session,
    grant,
    account,
    partner,
    request,
    pkceChallenge: 'pkce_challenge_s256_vey_demo',
    now: DEMO_CODE_TIME,
  });

  const exchange = exchangeVeygritIdAuthorizationCode({
    authorizationCode: code,
    clientId: 'vg_client_vey_demo_shop',
    redirectUri: 'https://vey-demo-shop.example/vey-id/callback',
    pkceChallenge: 'pkce_challenge_s256_vey_demo',
    authTime: session.authenticatedAt,
    now: DEMO_EXCHANGE_TIME,
  });

  const handoff = buildVeygritIdGuestCheckoutHandoff({
    tokenExchange: exchange,
    grant,
    partner,
    orderRef: 'order_ref_vey_demo_001',
  });

  const revocation = revokeVeygritIdConnection({
    account,
    partner,
    grant,
    now: '2026-07-18T00:03:00.000Z',
  });

  const grantValidation = validateVeygritIdGrant(grant);
  const errors = unique([
    ...account.errors,
    ...partner.errors,
    ...session.errors,
    ...grant.errors,
    ...code.errors,
    ...exchange.errors,
    ...handoff.errors,
    ...grantValidation.errors,
  ]);
  const warnings = unique([
    ...account.warnings,
    ...partner.warnings,
    ...session.warnings,
    ...grant.warnings,
    ...code.warnings,
    ...exchange.warnings,
    ...handoff.warnings,
  ]);

  const status: VeyIdDemoEcFlowStatus =
    account.errors.length === 0
      && partner.status === 'approved'
      && session.status === 'active'
      && grant.status === 'ready-to-fill'
      && code.status === 'issued'
      && exchange.status === 'issued'
      && handoff.status === 'ready'
      ? 'ready'
      : 'blocked';

  const coreRefs: VeyIdDemoEcFlow['coreRefs'] = {
    partnerId: partner.partnerId,
    clientId: partner.clientId,
    sessionRef: session.status === 'active' ? session.sessionRef : undefined,
    walletSessionRef: session.status === 'active' ? session.walletSessionRef : undefined,
    pairwiseSubjectAlias: code.pairwiseSubjectAlias,
    authorizationCodeRef: code.authorizationCodeRef,
    accessTokenRef: exchange.accessTokenRef,
    idTokenRef: exchange.idTokenRef,
    addressCredentialRef: exchange.addressCredentialRef,
    walletConsentRef: handoff.walletConsentRef,
    guestCheckoutAlias: handoff.guestCheckoutAlias,
    carrierHandoffRef: handoff.carrierHandoffRef,
    revocationRef: revocation.revocationRef,
  };
  const merchantVisibleRefs = unique([
    coreRefs.pairwiseSubjectAlias,
    coreRefs.accessTokenRef,
    coreRefs.idTokenRef,
    coreRefs.addressCredentialRef,
    coreRefs.walletConsentRef,
    coreRefs.guestCheckoutAlias,
    coreRefs.carrierHandoffRef,
  ]);
  const merchantBlockedMaterial = [
    'rawAddress',
    'recipientName',
    'recipientPhone',
    'providerToken',
    'privateKey',
    'proofSecret',
    'carrierCredential',
    'productionCredential',
  ];

  return {
    version: VEY_ID_DEMO_EC_FLOW_VERSION,
    demoName: 'Vey ID guest EC checkout with Address Wallet reuse',
    status,
    accountPolicy: {
      allowedCreationProviders: ['google', 'apple'],
      selectedProvider: provider,
      emailPasswordSignupEnabled: false,
      walletLoginRequiredForAddressReuse: true,
    },
    merchantPolicy: {
      playlistCommerceStartWithoutLogin: true,
      ecIntegrationRequiresVeyIdButtonForAddressReuse: true,
      merchantAccountRequiredBeforeCheckout: false,
      passwordRequiredBeforeCheckout: false,
      canCreateAccountSilently: false,
    },
    coreRefs,
    merchantVisibleRefs,
    merchantVisibleRedactionAffordance: {
      boundaryGateId: 'merchant-visible-redaction',
      boundarySource: 'src/lib/veyIdAddressWalletFoundation.ts#privacyThreatBoundaryGates',
      displayFields: [
        'pairwiseSubjectAlias',
        'guestCheckoutAlias',
        'walletConsentRef',
        'addressCredentialRef',
        'carrierHandoffRef',
      ],
      displayRefs: unique([
        coreRefs.pairwiseSubjectAlias,
        coreRefs.guestCheckoutAlias,
        coreRefs.walletConsentRef,
        coreRefs.addressCredentialRef,
        coreRefs.carrierHandoffRef,
      ]),
      blockedMaterial: merchantBlockedMaterial,
      requiredNextAction: status === 'ready' ? 'create-guest-order-from-refs' : 'request-address-wallet-consent',
      nonClaims: [
        'Merchant-visible refs are not raw address disclosure, residence proof, or reusable marketing consent.',
        'Guest checkout display does not expose provider tokens, carrier credentials, proof secrets, private keys, or production credentials.',
      ],
    },
    walletPrivateMaterial: [
      'address commitment preimage',
      'selected address body',
      'provider id/access/refresh tokens',
      'device private key',
      'proof witness and proof secret',
      'production carrier credentials',
    ],
    merchantBlockedMaterial,
    steps: buildSteps({
      includeAddressConsent,
      pairwiseSubjectAlias: coreRefs.pairwiseSubjectAlias,
      authorizationCodeRef: coreRefs.authorizationCodeRef,
      accessTokenRef: coreRefs.accessTokenRef,
      idTokenRef: coreRefs.idTokenRef,
      addressCredentialRef: coreRefs.addressCredentialRef,
      walletConsentRef: coreRefs.walletConsentRef,
      guestCheckoutAlias: coreRefs.guestCheckoutAlias,
      carrierHandoffRef: coreRefs.carrierHandoffRef,
    }),
    privacy: {
      rawAddressVisibleToMerchant: false,
      rawPhoneVisibleToMerchant: false,
      providerTokenVisibleToMerchant: false,
      carrierCredentialVisibleToMerchant: false,
      productionTraffic: false,
    },
    validationGates: [
      'npx tsx --test src/lib/veyIdDemoEcFlow.test.ts',
      'npm run verify:veygrit-id',
      'npm run verify:address-login-spec',
    ],
    nonClaims: [
      'This demo is not a production identity provider.',
      'Vey ID is not proof of residence or legal KYC without a separate approved claim.',
      'Guest checkout does not mean address reuse without Wallet consent.',
      'Carrier handoff refs do not guarantee delivery, customs clearance, or carrier acceptance.',
    ],
    errors,
    warnings,
  };
}

export function validateVeyIdDemoEcFlow(flow: VeyIdDemoEcFlow): VeyIdDemoEcValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const merchantSurface = JSON.stringify({
    coreRefs: flow.coreRefs,
    merchantVisibleRefs: flow.merchantVisibleRefs,
    merchantVisibleRedactionAffordance: flow.merchantVisibleRedactionAffordance,
    merchantPolicy: flow.merchantPolicy,
    steps: flow.steps
      .filter(step => step.merchantVisible)
      .map(step => ({ id: step.id, emitsRefs: step.emitsRefs, nextAction: step.nextAction })),
  });

  if (MERCHANT_FORBIDDEN_VALUE_PATTERNS.some(pattern => pattern.test(merchantSurface))) {
    errors.push('merchant-surface-contains-forbidden-private-material');
  }
  if (flow.accountPolicy.allowedCreationProviders.join(',') !== 'google,apple') {
    errors.push('account-creation-provider-policy-must-remain-google-apple-only');
  }
  if (flow.accountPolicy.emailPasswordSignupEnabled) {
    errors.push('email-password-signup-must-remain-disabled');
  }
  if (flow.merchantPolicy.merchantAccountRequiredBeforeCheckout) {
    errors.push('guest-checkout-must-not-require-merchant-account-before-checkout');
  }
  if (flow.merchantPolicy.canCreateAccountSilently) {
    errors.push('merchant-silent-account-creation-must-remain-disabled');
  }
  if (flow.merchantVisibleRedactionAffordance.boundaryGateId !== 'merchant-visible-redaction') {
    errors.push('merchant-visible-redaction-boundary-id-mismatch');
  }
  if (flow.merchantVisibleRedactionAffordance.boundarySource !== 'src/lib/veyIdAddressWalletFoundation.ts#privacyThreatBoundaryGates') {
    errors.push('merchant-visible-redaction-boundary-source-mismatch');
  }
  for (const field of ['pairwiseSubjectAlias', 'guestCheckoutAlias', 'walletConsentRef', 'addressCredentialRef', 'carrierHandoffRef']) {
    if (!flow.merchantVisibleRedactionAffordance.displayFields.includes(field as never)) {
      errors.push(`merchant-visible-redaction-missing-display-field:${field}`);
    }
  }
  for (const material of ['rawAddress', 'recipientName', 'recipientPhone', 'privateKey', 'proofSecret', 'carrierCredential', 'productionCredential']) {
    if (!flow.merchantVisibleRedactionAffordance.blockedMaterial.includes(material)) {
      errors.push(`merchant-visible-redaction-missing-blocked-material:${material}`);
    }
  }
  if (flow.merchantVisibleRedactionAffordance.displayRefs.some(ref => !flow.merchantVisibleRefs.includes(ref))) {
    errors.push('merchant-visible-redaction-display-ref-not-in-merchant-visible-refs');
  }
  if (!flow.merchantVisibleRedactionAffordance.nonClaims.some(nonClaim => /not raw address disclosure/i.test(nonClaim))) {
    errors.push('merchant-visible-redaction-missing-non-claim');
  }
  if (flow.status === 'ready' && flow.merchantVisibleRedactionAffordance.requiredNextAction !== 'create-guest-order-from-refs') {
    errors.push('merchant-visible-redaction-ready-next-action-mismatch');
  }
  if (flow.status === 'blocked' && flow.merchantVisibleRedactionAffordance.requiredNextAction !== 'request-address-wallet-consent') {
    errors.push('merchant-visible-redaction-blocked-next-action-mismatch');
  }
  if (flow.privacy.rawAddressVisibleToMerchant) {
    errors.push('raw-address-must-not-be-visible-to-merchant');
  }
  if (flow.privacy.providerTokenVisibleToMerchant) {
    errors.push('provider-token-must-not-be-visible-to-merchant');
  }
  if (flow.privacy.carrierCredentialVisibleToMerchant) {
    errors.push('carrier-credential-must-not-be-visible-to-merchant');
  }
  if (flow.privacy.productionTraffic) {
    errors.push('demo-flow-must-not-send-production-traffic');
  }
  if (flow.status === 'ready' && !flow.coreRefs.carrierHandoffRef) {
    errors.push('ready-flow-must-include-carrier-handoff-ref');
  }
  if (flow.status === 'ready' && !flow.coreRefs.addressCredentialRef) {
    errors.push('ready-flow-must-include-address-credential-ref');
  }
  if (flow.status === 'ready' && flow.errors.length > 0) {
    errors.push('ready-flow-must-not-carry-core-errors');
  }
  if (flow.status === 'blocked' && flow.errors.length === 0) {
    warnings.push('blocked-flow-has-no-core-error-detail');
  }

  return { ok: errors.length === 0, errors, warnings };
}
