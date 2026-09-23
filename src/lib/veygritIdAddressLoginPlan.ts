import {
  ADDRESS_LOGIN_ENDPOINTS,
  ADDRESS_LOGIN_MERCHANT_FEATURES,
  ADDRESS_LOGIN_REQUIREMENTS,
  ADDRESS_LOGIN_USER_EXPERIENCE_STEPS,
  requiredClaimsForAddressLogin,
  type AddressLoginDisclosureMode,
  type AddressLoginPurpose,
  type AddressLoginRiskLevel,
} from './addressLoginSpec';
import {
  buildAddressWalletFriendDeliveryPlan,
  validateAddressWalletFriendDeliveryPlan,
  type AddressWalletFriendDeliveryPlan,
} from './addressWalletFriendDelivery';

export const VEYGRIT_ID_ADDRESS_LOGIN_PLAN_VERSION = 'veygrit-id-address-login-plan-v0.1';

export type VeygritIdProductLayer =
  | 'identity-wallet'
  | 'hosted-address-login'
  | 'credential-registry'
  | 'consent-policy-compiler'
  | 'carrier-handoff'
  | 'merchant-console'
  | 'developer-platform'
  | 'audit-and-revocation';

export type VeygritIdBoundary = 'oss' | 'commercial' | 'shared-contract';

export type VeygritIdStandardTrack =
  | 'oauth-oidc-pattern'
  | 'pkce-state-nonce'
  | 'webauthn-passkey'
  | 'verifiable-credentials'
  | 'did-optional'
  | 'sd-jwt-selective-disclosure'
  | 'zk-proof-hook'
  | 'webhook-hmac';

export type VeygritIdMilestoneId =
  | 'm0-oss-contract'
  | 'm1-hosted-login-mvp'
  | 'm2-wallet-credential-beta'
  | 'm3-merchant-console-beta'
  | 'm4-carrier-handoff-beta'
  | 'm5-zk-proof-hook-beta'
  | 'm6-enterprise-hardening';

export type VeygritIdPlanLayer = {
  id: VeygritIdProductLayer;
  boundary: VeygritIdBoundary;
  role: string;
  owns: string[];
  publicInputs: string[];
  safeOutputs: string[];
  blockedOutputs: string[];
  releaseGate: string[];
};

export type VeygritIdProtocolDecision = {
  id: string;
  decision: string;
  rationale: string;
  default: boolean;
  nonClaims: string[];
};

export type VeygritIdGoToMarketSegment = {
  segment: 'ec' | 'marketplace' | 'hotel-travel' | 'carrier' | 'government-pilot' | 'developer-oss';
  buyer: string;
  pain: string;
  entryOffer: string;
  proofOfValue: string[];
  blockedPromise: string;
};

export type VeygritIdDeveloperIntegrationMode =
  | 'hosted-redirect'
  | 'drop-in-react'
  | 'headless-hooks'
  | 'nextjs-server-helper'
  | 'webhook-verification'
  | 'local-sandbox-mock';

export type VeygritIdSdkPackage = {
  packageName: string;
  boundary: VeygritIdBoundary;
  audience: string;
  installCommand: string;
  primaryExports: string[];
  quickstartSnippet: string;
  blockedResponsibilities: string[];
  releaseGates: string[];
};

export type VeygritIdDeveloperAdoptionPlan = {
  positioning: string;
  primaryPromise: string;
  integrationModes: VeygritIdDeveloperIntegrationMode[];
  packages: VeygritIdSdkPackage[];
  firstUseCase: string;
  dashboardSetupChecklist: string[];
  documentationPages: string[];
  validationGates: string[];
  nonClaims: string[];
};

export type VeygritIdImplementationTraceability = {
  productPlanPath: string;
  packageManifestPath: string;
  packageVerifierCommand: string;
  aggregateVerifierCommand: string;
  implementationPackages: string[];
  publishReadinessClaim: 'oss-prep-local-not-production-ready';
  commitCandidatePaths: string[];
  githubUpdatePreflightCommands: string[];
  blockedActions: string[];
};

export type VeygritIdAccountCreationProvider = 'google' | 'apple';

export type VeygritIdAccountCreationPolicy = {
  allowedProviders: VeygritIdAccountCreationProvider[];
  passwordSignupEnabled: false;
  emailPasswordSignupEnabled: false;
  phoneSignupEnabled: false;
  merchantEmbeddableVeyId: true;
  addressWalletReuseRequired: true;
  merchantReceives: string[];
  merchantNeverReceives: string[];
};

export type VeygritIdGuestCheckoutPolicy = {
  enabled: true;
  accountRequiredBeforeCheckout: false;
  walletConsentRequired: true;
  guestSessionRefRequired: true;
  optionalUpgradeProviders: VeygritIdAccountCreationProvider[];
  allowedGuestActions: Array<
    | 'start_checkout'
    | 'request_address_login'
    | 'approve_wallet_consent'
    | 'create_carrier_handoff'
  >;
  blockedGuestActions: Array<
    | 'save_address_without_account'
    | 'persist_raw_address'
    | 'create_wallet_account_without_google_or_apple'
    | 'friend_delivery_without_recipient_approval'
  >;
  merchantReceives: string[];
  merchantNeverReceives: string[];
};

export type VeygritIdCommerceBoundary = {
  playlistCommerceRole: 'discover_manage_ec';
  ecSocialLoginRole: 'login_address_autofill_at_ec';
  playlistCommerceStartPoint: 'veygrit_app';
  ecSocialLoginStartPoint: 'merchant_ec_site';
  playlistCommerceRequiresLoginButtonToShop: false;
  ecSocialLoginRequiresContinueWithVeygrit: true;
  ecSocialLoginRequiresVeyIdForWalletAddressReuse: true;
  accountCreationProviders: VeygritIdAccountCreationProvider[];
  sharedRails: string[];
  merchantReceives: string[];
  merchantNeverReceives: string[];
  nonClaims: string[];
};

export type VeygritIdMilestone = {
  id: VeygritIdMilestoneId;
  title: string;
  timeframe: string;
  scope: string[];
  exitCriteria: string[];
  riskControls: string[];
};

export type VeygritIdAddressLoginPlan = {
  version: typeof VEYGRIT_ID_ADDRESS_LOGIN_PLAN_VERSION;
  productName: 'Veygrit ID / Address Login';
  thesis: string;
  boundaries: {
    oss: string[];
    commercial: string[];
    sharedContract: string[];
  };
  standards: VeygritIdStandardTrack[];
  layers: VeygritIdPlanLayer[];
  protocolDecisions: VeygritIdProtocolDecision[];
  priorityUseCases: Array<{
    purpose: AddressLoginPurpose;
    riskLevel: AddressLoginRiskLevel;
    disclosureMode: AddressLoginDisclosureMode;
    requiredClaims: string[];
    merchantSees: string[];
    walletKeepsPrivate: string[];
  }>;
  accountCreation: VeygritIdAccountCreationPolicy;
  guestCheckout: VeygritIdGuestCheckoutPolicy;
  commerceBoundary: VeygritIdCommerceBoundary;
  developerAdoption: VeygritIdDeveloperAdoptionPlan;
  implementationTraceability: VeygritIdImplementationTraceability;
  friendDelivery: AddressWalletFriendDeliveryPlan;
  goToMarket: VeygritIdGoToMarketSegment[];
  milestones: VeygritIdMilestone[];
  validationGates: string[];
  nonClaims: string[];
};

export const VEYGRIT_ID_ADDRESS_LOGIN_LAYERS: VeygritIdPlanLayer[] = [
  {
    id: 'identity-wallet',
    boundary: 'commercial',
    role: 'User-facing wallet for address aliases, credentials, consent history, passkeys, proof references, and revocation actions.',
    owns: ['address aliases', 'credential references', 'device-bound approval', 'consent history', 'proof/disclosure review'],
    publicInputs: ['merchant request', 'purpose', 'requested claims', 'risk level', 'display language mode'],
    safeOutputs: ['approval decision', 'consent envelope reference', 'pairwise subject alias', 'proof bundle reference'],
    blockedOutputs: ['raw address to merchant by default', 'private key', 'proof witness', 'recipient phone in callback'],
    releaseGate: ['wallet-consent-review-tested', 'passkey-or-device-binding-ready', 'no-raw-address-screen-scan'],
  },
  {
    id: 'hosted-address-login',
    boundary: 'commercial',
    role: 'Hosted OAuth-style authorization surface for merchants that do not want to run the protocol themselves.',
    owns: ['authorize endpoint', 'token exchange', 'session binding', 'hosted redirect UX', 'redacted login result'],
    publicInputs: ['clientId', 'redirectUri', 'state', 'nonce', 'purpose', 'claims'],
    safeOutputs: ['authorization code', 'redacted token response', 'safe callback preview'],
    blockedOutputs: ['merchant-visible address as default', 'unscoped decrypt material', 'long-lived address tokens'],
    releaseGate: ['redirect-uri-allowlist', 'state-and-nonce-required', 'pkce-required-for-public-clients'],
  },
  {
    id: 'credential-registry',
    boundary: 'commercial',
    role: 'Hosted registry for issuer trust, credential status, revocation, freshness, and public-key discovery.',
    owns: ['issuer trust registry', 'revocation root', 'freshness root', 'credential status API', 'public keys'],
    publicInputs: ['credentialRef', 'issuerRef', 'sourceVersion', 'revocation query'],
    safeOutputs: ['active/revoked/expired state', 'root references', 'issuer metadata'],
    blockedOutputs: ['raw credential body', 'document image', 'address evidence payload'],
    releaseGate: ['revocation-latency-slo', 'issuer-key-rotation-tested', 'registry-no-raw-address-storage'],
  },
  {
    id: 'consent-policy-compiler',
    boundary: 'shared-contract',
    role: 'Policy engine that chooses proof-only, selective disclosure, or carrier-only decryption from purpose, risk, role, and jurisdiction.',
    owns: ['claim selection', 'disclosure mode selection', 'risk controls', 'non-claim attachment', 'proof plan'],
    publicInputs: ['purpose', 'riskLevel', 'requestedClaims', 'merchant policy', 'country hints'],
    safeOutputs: ['proof plan', 'required claims', 'warnings', 'next action'],
    blockedOutputs: ['silent privilege escalation', 'merchant-visible fallback without user approval', 'policy without non-claims'],
    releaseGate: ['policy-test-vectors', 'merchant-visible-exception-review', 'non-claim-required'],
  },
  {
    id: 'carrier-handoff',
    boundary: 'commercial',
    role: 'Scoped handoff where only an authorized carrier can decrypt or receive the minimum address material for execution.',
    owns: ['carrier decrypt authorization', 'delivery session binding', 'handoff receipt', 'expiry', 'carrier audit log'],
    publicInputs: ['carrierId', 'deliveryId', 'consentEnvelopeId', 'decrypt request'],
    safeOutputs: ['carrier decrypt reference', 'handoff receipt', 'result state'],
    blockedOutputs: ['merchant decrypt ability', 'analytics payload with address', 'reuse outside delivery purpose'],
    releaseGate: ['carrier-scope-bound', 'decrypt-expiry-enforced', 'carrier-handoff-audit-tested'],
  },
  {
    id: 'merchant-console',
    boundary: 'commercial',
    role: 'Enterprise console for client setup, policies, webhook monitoring, test vectors, support review, and billing handoff.',
    owns: ['client registration', 'allowed purposes', 'allowed disclosure modes', 'webhooks', 'team roles', 'logs'],
    publicInputs: ['tenant settings', 'redirect URI', 'webhook URL', 'carrier IDs', 'policy selections'],
    safeOutputs: ['clientId', 'policy state', 'redacted events', 'test vector status'],
    blockedOutputs: ['raw address export', 'credential dump', 'proof witness replay'],
    releaseGate: ['rbac-ready', 'webhook-hmac-verified', 'redacted-log-retention-policy'],
  },
  {
    id: 'developer-platform',
    boundary: 'oss',
    role: 'Open SDK, protocol docs, local verifier hooks, synthetic fixtures, and conformance tests.',
    owns: ['SDK APIs', 'OpenAPI/spec docs', 'test vectors', 'local validation', 'sample callback validator'],
    publicInputs: ['synthetic fixtures', 'developer config', 'local proof references'],
    safeOutputs: ['SDK result types', 'fixture reports', 'conformance status'],
    blockedOutputs: ['production credentials', 'private recipient records', 'commercial hosted registry data'],
    releaseGate: ['oss-license-boundary', 'synthetic-fixtures-only', 'local-conformance-tests-pass'],
  },
  {
    id: 'audit-and-revocation',
    boundary: 'commercial',
    role: 'Managed audit, revocation, incident, and legal/emergency handling without storing raw address in public logs.',
    owns: ['audit events', 'revocation workflows', 'incident queue', 'legal/emergency policy', 'retention controls'],
    publicInputs: ['actor', 'action', 'credentialRef', 'consentEnvelopeId', 'result'],
    safeOutputs: ['redacted audit trail', 'revocation receipt', 'incident state'],
    blockedOutputs: ['raw address in logs', 'biometric data', 'private delivery notes'],
    releaseGate: ['redacted-audit-schema', 'revocation-receipt-tested', 'emergency-access-dual-control'],
  },
];

export const VEYGRIT_ID_PROTOCOL_DECISIONS: VeygritIdProtocolDecision[] = [
  {
    id: 'social-login-is-bootstrap-not-trust-root',
    decision: 'Vey ID account creation is Google/Apple only; social identity is bootstrap and recovery context, not address trust.',
    rationale: 'Google/Apple identity reduces onboarding friction for EC checkout, but address trust requires Address Wallet consent, issuer evidence, revocation, and freshness.',
    default: true,
    nonClaims: ['Google or Apple login is not proof of residence.', 'Email ownership is not address verification.', 'Passkey approval is not account creation by itself.'],
  },
  {
    id: 'passkey-first-wallet-approval',
    decision: 'Passkeys or device-bound approval are the default wallet authorization mechanism for high-risk and regulated flows.',
    rationale: 'Address Login must bind consent to a device/wallet approval rather than only a reusable password or email session.',
    default: true,
    nonClaims: ['Passkey approval is not proof that the address itself is correct.'],
  },
  {
    id: 'oauth-style-session-binding',
    decision: 'Hosted Address Login follows an OAuth/OIDC-style redirect pattern with redirect URI allowlist, state, nonce, and PKCE for public clients.',
    rationale: 'Merchants understand this integration shape, and it gives replay and callback confusion defenses.',
    default: true,
    nonClaims: ['OAuth-style flow does not mean Veygrit ID exposes a general social profile by default.'],
  },
  {
    id: 'proof-plan-before-disclosure',
    decision: 'The system compiles a proof/disclosure plan before user approval and shows who sees what.',
    rationale: 'The product advantage is not hiding everything; it is selecting the least-disclosing method that still completes the job.',
    default: true,
    nonClaims: ['Proof-only deliverability is not carrier SLA or residence proof.'],
  },
  {
    id: 'carrier-only-decrypt-for-shipping',
    decision: 'Shipping defaults to carrier-only decryption when full address material is required for execution.',
    rationale: 'This gives merchants conversion benefits without turning every merchant into an address database.',
    default: true,
    nonClaims: ['Carrier-only decrypt does not remove carrier operational responsibility.'],
  },
];

export const VEYGRIT_ID_DEVELOPER_ADOPTION: VeygritIdDeveloperAdoptionPlan = {
  positioning: 'Embeddable Vey ID for EC checkout: merchants add guest checkout plus one address-wallet login that reuses Address Wallet addresses without receiving raw address data.',
  primaryPromise: 'Add privacy-preserving guest checkout and Address Login in minutes: no forced account creation, no raw address storage for merchants, carrier-only execution access, and synthetic conformance tests.',
  integrationModes: [
    'hosted-redirect',
    'drop-in-react',
    'headless-hooks',
    'nextjs-server-helper',
    'webhook-verification',
    'local-sandbox-mock',
  ],
  packages: [
    {
      packageName: '@veygrit/address-login-react',
      boundary: 'oss',
      audience: 'React checkout and account surfaces that want a prebuilt Address Login button or modal.',
      installCommand: 'npm install @veygrit/address-login-react',
      primaryExports: [
        'VeygritProvider',
        'VeyIdSignInButton',
        'AddressLoginButton',
        'AddressLoginModal',
        'AddressLoginStatus',
        'useAddressLogin',
        'useFriendDelivery',
        'createFriendDeliveryController',
        'createFriendDeliveryRequestPayload',
        'createFriendDeliveryApprovalPayload',
      ],
      quickstartSnippet: '<VeygritProvider publishableKey={VEYGRIT_PUBLISHABLE_KEY} accountProviders={["google","apple"]}><VeyIdSignInButton /><AddressLoginButton purpose="shipping" disclosureMode="carrier_decryptable" requestedClaims={["deliverable","not_revoked","freshness"]} /></VeygritProvider>',
      blockedResponsibilities: ['issuing production credentials', 'carrier decryption', 'storing raw address material', 'verifying proof witnesses in the browser'],
      releaseGates: ['prebuilt-button-demo', 'no-raw-address-result-type', 'hosted-redirect-state-nonce-pkce'],
    },
    {
      packageName: '@veygrit/address-login-nextjs',
      boundary: 'oss',
      audience: 'Next.js apps that need server helpers for callback verification, route handlers, and middleware-style guards.',
      installCommand: 'npm install @veygrit/address-login-nextjs',
      primaryExports: [
        'verifyAddressLoginCallback',
        'createAddressLoginRouteHandler',
        'requireAddressClaims',
        'verifyVeygritWebhook',
        'requestFriendDelivery',
        'approveFriendDelivery',
        'createFriendDeliveryRequestPayload',
        'createFriendDeliveryApprovalPayload',
      ],
      quickstartSnippet: 'const result = await verifyAddressLoginCallback(request, { requiredClaims: ["deliverable", "not_revoked"] });',
      blockedResponsibilities: ['long-lived merchant address cache', 'raw address logging', 'social-login-as-address-proof'],
      releaseGates: ['callback-validator-tests', 'webhook-hmac-tests', 'friend-delivery-server-helper-tests', 'redacted-logging-default'],
    },
    {
      packageName: '@veygrit/address-login-js',
      boundary: 'oss',
      audience: 'Framework-neutral browser integrations and hosted redirect builders.',
      installCommand: 'npm install @veygrit/address-login-js',
      primaryExports: ['createAddressLoginClient', 'buildAuthorizeUrl', 'parseAddressLoginResult', 'assertNoRawAddress'],
      quickstartSnippet: 'const url = client.buildAuthorizeUrl({ purpose: "shipping", disclosureMode: "carrier_decryptable", requestedClaims: ["deliverable"] });',
      blockedResponsibilities: ['secret management', 'server-side token exchange', 'carrier decrypt authorization'],
      releaseGates: ['authorize-url-fixture-test', 'redaction-guard-test', 'browser-no-secret-config'],
    },
    {
      packageName: '@veygrit/address-login-node',
      boundary: 'oss',
      audience: 'Backend services that exchange codes, verify proof references, and validate webhooks against hosted Veygrit ID.',
      installCommand: 'npm install @veygrit/address-login-node',
      primaryExports: ['exchangeAddressLoginCode', 'verifyProofReference', 'requestCarrierHandoff', 'verifyWebhookSignature'],
      quickstartSnippet: 'const login = await exchangeAddressLoginCode({ code, codeVerifier, clientAssertion });',
      blockedResponsibilities: ['holding carrier private keys', 'bypassing consent policy', 'accepting production credentials in tests'],
      releaseGates: ['token-exchange-contract-test', 'proof-verify-contract-test', 'carrier-handoff-boundary-test'],
    },
  ],
  firstUseCase: 'Let a guest checkout start without account creation, then replace the shipping address form with a carrier-decryptable Address Login flow for one merchant sandbox.',
  dashboardSetupChecklist: [
    'enable guest checkout',
    'create sandbox tenant',
    'copy publishable key',
    'register redirect URI',
    'choose allowed purposes',
    'choose disclosure modes',
    'configure webhook endpoint',
    'run synthetic test vectors',
    'review redacted callback preview',
  ],
  documentationPages: [
    'quickstart/react-address-login-button',
    'quickstart/nextjs-callback',
    'use-cases/address-wallet-friend-delivery',
    'concepts/address-login-vs-social-login',
    'concepts/carrier-only-handoff',
    'reference/requested-claims',
    'reference/webhook-signatures',
    'testing/synthetic-fixtures-and-local-mock',
  ],
  validationGates: [
    'guest checkout never requires Vey ID account creation before checkout',
    'quickstart snippet compiles without hosted secrets',
    'SDK public result types contain no raw address fields',
    'hosted redirect requires state nonce and PKCE',
    'webhook verification rejects unsigned payloads',
    'local mock covers 200 400 401 and 409 outcomes',
    'npm run verify:address-wallet-friend-delivery',
  ],
  nonClaims: [
    'Veygrit packages are not a general social network or broad identity provider replacement.',
    'Vey ID account creation is Google/Apple only in the MVP.',
    'Guest checkout is not silent address reuse; wallet consent is still required before delivery handoff.',
    'Publishable keys do not authorize carrier decryption.',
    'A successful Address Login callback is not a proof of residence unless the requested claim and issuer policy say so.',
  ],
};

export const VEYGRIT_ID_IMPLEMENTATION_TRACEABILITY: VeygritIdImplementationTraceability = {
  productPlanPath: 'docs/product/veygrit-id-address-login-plan.md',
  packageManifestPath: 'sdk/veygrit-address-login-packages.manifest.json',
  packageVerifierCommand: 'npm run verify:veygrit-address-login-packages',
  aggregateVerifierCommand: 'npm run verify:address-login-spec',
  implementationPackages: [
    '@veygrit/address-login-react',
    '@veygrit/address-login-nextjs',
  ],
  publishReadinessClaim: 'oss-prep-local-not-production-ready',
  commitCandidatePaths: [
    'docs/product/veygrit-id-address-login-plan.md',
    'src/lib/veygritIdAddressLoginPlan.ts',
    'src/lib/veygritIdAddressLoginPlan.test.ts',
    'scripts/verify-veygrit-address-login-test-helpers.ts',
    'scripts/verify-veygrit-address-login-packages.ts',
    'sdk/veygrit-address-login-test-helpers/README.md',
    'sdk/veygrit-address-login-test-helpers/hostedCallbackValidationVectors.ts',
    'sdk/veygrit-address-login-test-helpers/merchantVisibleRedactionFixtures.ts',
    'sdk/veygrit-address-login-react/README.md',
    'sdk/veygrit-address-login-nextjs/README.md',
  ],
  githubUpdatePreflightCommands: [
    'npm run verify:veygrit-address-login-packages',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-commit-candidates',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-commit-summary',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-stage-plan',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-diff-scope',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-github-update-memo',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-final-local-check',
    'npx tsx --test src/lib/veygritIdAddressLoginPlan.test.ts',
  ],
  blockedActions: [
    'claiming production readiness',
    'publishing packages without package verifier',
    'adding hosted service availability claims to OSS-prep evidence',
    'staging mixed root package.json changes without separate review',
    'staging or committing without an explicit current user request',
    'pushing branches, opening PRs, or creating/deleting GitHub repositories without an explicit current user request',
    'including raw address, recipient, witness, private-key, proof-secret, or production credential material',
  ],
};

export const VEYGRIT_ID_ACCOUNT_CREATION_POLICY: VeygritIdAccountCreationPolicy = {
  allowedProviders: ['google', 'apple'],
  passwordSignupEnabled: false,
  emailPasswordSignupEnabled: false,
  phoneSignupEnabled: false,
  merchantEmbeddableVeyId: true,
  addressWalletReuseRequired: true,
  merchantReceives: ['pairwise subject alias', 'recipient_id', 'walletConsentRef', 'addressCredentialRef'],
  merchantNeverReceives: ['rawAddress', 'recipientPhone', 'savedAddressBody', 'proofSecret', 'carrierCredential'],
};

export const VEYGRIT_ID_GUEST_CHECKOUT_POLICY: VeygritIdGuestCheckoutPolicy = {
  enabled: true,
  accountRequiredBeforeCheckout: false,
  walletConsentRequired: true,
  guestSessionRefRequired: true,
  optionalUpgradeProviders: ['google', 'apple'],
  allowedGuestActions: [
    'start_checkout',
    'request_address_login',
    'approve_wallet_consent',
    'create_carrier_handoff',
  ],
  blockedGuestActions: [
    'save_address_without_account',
    'persist_raw_address',
    'create_wallet_account_without_google_or_apple',
    'friend_delivery_without_recipient_approval',
  ],
  merchantReceives: ['guestCheckoutRef', 'checkoutAlias', 'pairwise subject alias', 'walletConsentRef', 'carrierHandoffRef'],
  merchantNeverReceives: ['rawAddress', 'recipientPhone', 'savedAddressBody', 'proofSecret', 'carrierCredential'],
};

export const VEYGRIT_ID_COMMERCE_BOUNDARY: VeygritIdCommerceBoundary = {
  playlistCommerceRole: 'discover_manage_ec',
  ecSocialLoginRole: 'login_address_autofill_at_ec',
  playlistCommerceStartPoint: 'veygrit_app',
  ecSocialLoginStartPoint: 'merchant_ec_site',
  playlistCommerceRequiresLoginButtonToShop: false,
  ecSocialLoginRequiresContinueWithVeygrit: true,
  ecSocialLoginRequiresVeyIdForWalletAddressReuse: true,
  accountCreationProviders: ['google', 'apple'],
  sharedRails: ['Vey ID', 'Address Wallet', 'Friends', 'QR', 'Delivery Gateway', 'WooCommerce', 'Shopify', 'SDK'],
  merchantReceives: ['pairwise subject alias', 'recipient_id', 'walletConsentRef', 'addressCredentialRef', 'carrierHandoffRef'],
  merchantNeverReceives: ['rawAddress', 'recipientPhone', 'savedAddressBody', 'proofSecret', 'carrierCredential'],
  nonClaims: [
    'Playlist Commerce is not EC Social Login.',
    'Playlist Commerce can let users shop and choose stores without pressing a login button.',
    'EC Social Login requires Continue with Veygrit when the EC wants wallet address reuse or address autofill.',
    'Google/Apple sign-in is not address verification.',
  ],
};

export const VEYGRIT_ID_GO_TO_MARKET: VeygritIdGoToMarketSegment[] = [
  {
    segment: 'ec',
    buyer: 'EC platform owner, checkout product manager, privacy/security lead',
    pain: 'Repeated address entry, cart abandonment, privacy exposure, poor international address forms.',
    entryOffer: 'Address Login button plus Address Wallet Friend Delivery for carrier-decryptable checkout and gift shipping without address exchange.',
    proofOfValue: ['checkout completion rate', 'address-entry time reduction', 'friend-delivery approval rate', 'support tickets avoided', 'raw-address storage reduced'],
    blockedPromise: 'Do not promise full global postal correctness or delivery success on day one.',
  },
  {
    segment: 'marketplace',
    buyer: 'Marketplace trust and safety / seller platform team',
    pain: 'Gift, anonymous delivery, fraud, returns, and multi-carrier handoff create address exposure and support load.',
    entryOffer: 'Anonymous shipping and redacted address claims with carrier handoff receipts.',
    proofOfValue: ['merchant never sees address', 'carrier handoff success', 'fraud review reason codes', 'revocation receipts'],
    blockedPromise: 'Do not claim anonymity against colluding parties without a formal threat model.',
  },
  {
    segment: 'hotel-travel',
    buyer: 'Hotel PMS, travel platform, airport service integrator',
    pain: 'Guests repeatedly type address and travel data, while hotels need only scoped check-in or delivery facts.',
    entryOffer: 'Travel Check-in + hotel delivery proof-only flow using native/English display modes.',
    proofOfValue: ['check-in time reduction', 'guest consent audit', 'PMS raw-address minimization'],
    blockedPromise: 'Do not replace legal guest registration requirements without jurisdiction-specific review.',
  },
  {
    segment: 'carrier',
    buyer: 'Carrier API/platform, last-mile operator, locker/PUDO operator',
    pain: 'Merchants send inconsistent address strings; carriers need scoped execution data and audit receipts.',
    entryOffer: 'Carrier decrypt request API, delivery session binding, and scoped handoff receipt.',
    proofOfValue: ['decrypt authorization latency', 'handoff receipt integrity', 'fewer bad labels', 'address exposure boundary'],
    blockedPromise: 'Do not claim carrier routing optimization unless integrated with carrier network data.',
  },
  {
    segment: 'government-pilot',
    buyer: 'Digital government identity or address service pilot owner',
    pain: 'Address proof is over-disclosed; services ask for full address when region or eligibility facts would suffice.',
    entryOffer: 'Proof-only region/freshness/not-revoked pilot with explicit issuer and revocation boundaries.',
    proofOfValue: ['least-disclosure audit', 'revocation freshness', 'policy explainability', 'citizen consent trace'],
    blockedPromise: 'Do not claim legal validity before external review and statutory mapping.',
  },
  {
    segment: 'developer-oss',
    buyer: 'Open-source developer, standards evaluator, grant reviewer',
    pain: 'Address privacy products are often closed, unverifiable, and hand-wavy.',
    entryOffer: 'OSS Address Login spec, SDK skeleton, conformance tests, no-raw-address validators, and synthetic fixtures.',
    proofOfValue: ['tests pass locally', 'fixtures are synthetic', 'callbacks are redacted', 'commercial boundary is clear'],
    blockedPromise: 'Do not put hosted user data or commercial registry state in OSS fixtures.',
  },
];

export const VEYGRIT_ID_MILESTONES: VeygritIdMilestone[] = [
  {
    id: 'm0-oss-contract',
    title: 'OSS contract and local conformance',
    timeframe: '0-2 weeks',
    scope: ['Address Login spec', 'SDK request/result types', 'synthetic fixtures', 'callback validator', 'no-raw-address tests'],
    exitCriteria: ['npm run verify:address-login-spec passes', 'OSS/commercial boundary documented', 'all public callbacks redacted'],
    riskControls: ['synthetic fixtures only', 'merchant_visible marked high-risk', 'no hosted secrets'],
  },
  {
    id: 'm1-hosted-login-mvp',
    title: 'Hosted Address Login MVP',
    timeframe: '2-6 weeks',
    scope: ['authorize endpoint', 'token endpoint', 'state/nonce/PKCE', 'hosted consent UI', 'redacted callback'],
    exitCriteria: ['merchant demo completes carrier-decryptable flow', 'callback validator rejects raw address fields', 'webhook HMAC verified'],
    riskControls: ['redirect URI allowlist', 'pairwise subject alias', 'short-lived authorization code'],
  },
  {
    id: 'm2-wallet-credential-beta',
    title: 'Identity Wallet credential beta',
    timeframe: '6-10 weeks',
    scope: ['address aliases', 'credential refs', 'passkey approval', 'consent history', 'revocation UX'],
    exitCriteria: ['user can approve/revoke consent', 'credential status can be checked', 'wallet shows who sees what'],
    riskControls: ['device-bound approval', 'no witness storage', 'credential refs only in merchant result'],
  },
  {
    id: 'm3-merchant-console-beta',
    title: 'Merchant Console beta',
    timeframe: '8-12 weeks',
    scope: ['client registration', 'policy configuration', 'webhooks', 'test vectors', 'redacted logs', 'team roles'],
    exitCriteria: ['merchant can self-serve sandbox setup', 'test vector suite passes', 'redacted logs searchable'],
    riskControls: ['RBAC', 'webhook HMAC', 'audit retention policy'],
  },
  {
    id: 'm4-carrier-handoff-beta',
    title: 'Carrier handoff beta',
    timeframe: '10-16 weeks',
    scope: ['carrier decrypt request', 'delivery session binding', 'handoff receipt', 'expiry', 'carrier audit'],
    exitCriteria: ['carrier can receive scoped decrypt reference', 'merchant cannot decrypt', 'handoff receipt is auditable'],
    riskControls: ['purpose-bound decrypt', 'short expiry', 'carrier allowlist'],
  },
  {
    id: 'm5-zk-proof-hook-beta',
    title: 'ZK proof hook beta',
    timeframe: '14-22 weeks',
    scope: ['proof input schema', 'external verifier hook', 'proof-only claims', 'non-claim tests'],
    exitCriteria: ['schema-only and external-verifier paths both pass', 'private material rejected', 'real circuit work remains explicit'],
    riskControls: ['no audited-circuit claim', 'no raw witness', 'verifier policy hash bound'],
  },
  {
    id: 'm6-enterprise-hardening',
    title: 'Enterprise hardening and first paid pilots',
    timeframe: '20-32 weeks',
    scope: ['SLA boundaries', 'incident response', 'issuer onboarding', 'data retention', 'billing handoff', 'support review'],
    exitCriteria: ['two paid pilots', 'security review complete', 'runbooks ready', 'SLO dashboards live'],
    riskControls: ['private deployment option', 'dual-control emergency access', 'customer data processing boundary'],
  },
];

export function buildVeygritIdAddressLoginPlan(): VeygritIdAddressLoginPlan {
  const friendDelivery = buildAddressWalletFriendDeliveryPlan();

  return {
    version: VEYGRIT_ID_ADDRESS_LOGIN_PLAN_VERSION,
    productName: 'Veygrit ID / Address Login',
    thesis: 'Veygrit ID turns address use into a consented, purpose-bound proof and handoff flow: merchants ask for address facts, wallets keep private address material, and carriers receive only scoped execution access.',
    boundaries: {
      oss: [
        'Address Login protocol docs',
        'SDK request/result types',
        'synthetic conformance fixtures',
        'local callback validator',
        'proof input schema and verifier hook contracts',
      ],
      commercial: [
        'hosted login',
        'Identity Wallet account and credential management',
        'issuer/credential registry',
        'merchant console',
        'carrier decrypt/handoff service',
        'managed audit, revocation, support, and enterprise deployment',
      ],
      sharedContract: [
        'claim taxonomy',
        'consent envelope schema',
        'policy and proof compiler semantics',
        'redacted webhook schema',
        'non-claim boundaries',
      ],
    },
    standards: [
      'oauth-oidc-pattern',
      'pkce-state-nonce',
      'webauthn-passkey',
      'verifiable-credentials',
      'did-optional',
      'sd-jwt-selective-disclosure',
      'zk-proof-hook',
      'webhook-hmac',
    ],
    layers: VEYGRIT_ID_ADDRESS_LOGIN_LAYERS,
    protocolDecisions: VEYGRIT_ID_PROTOCOL_DECISIONS,
    priorityUseCases: [
      {
        purpose: 'shipping',
        riskLevel: 'standard',
        disclosureMode: 'carrier_decryptable',
        requiredClaims: requiredClaimsForAddressLogin('shipping', 'standard', 'carrier_decryptable'),
        merchantSees: ['pairwise subject alias', 'deliverable', 'proof reference', 'carrier handoff reference'],
        walletKeepsPrivate: ['raw address', 'recipient phone', 'unit detail', 'proof witness', 'device private key'],
      },
      {
        purpose: 'anonymous_shipping',
        riskLevel: 'high',
        disclosureMode: 'carrier_decryptable',
        requiredClaims: requiredClaimsForAddressLogin('anonymous_shipping', 'high', 'carrier_decryptable'),
        merchantSees: ['friend delivery request reference', 'recipient alias', 'deliverability claim', 'carrier handoff reference', 'delivery receipt reference'],
        walletKeepsPrivate: ['recipient raw address', 'recipient phone', 'selected address list', 'private delivery notes', 'proof witness'],
      },
      {
        purpose: 'hotel_delivery',
        riskLevel: 'standard',
        disclosureMode: 'selective_disclosure',
        requiredClaims: requiredClaimsForAddressLogin('hotel_delivery', 'standard', 'selective_disclosure'),
        merchantSees: ['hotel delivery alias', 'arrival window claim', 'deliverable'],
        walletKeepsPrivate: ['home address', 'full travel document', 'private hotel notes'],
      },
      {
        purpose: 'identity_verification',
        riskLevel: 'regulated',
        disclosureMode: 'proof_only',
        requiredClaims: requiredClaimsForAddressLogin('identity_verification', 'regulated', 'proof_only'),
        merchantSees: ['region membership proof', 'not revoked', 'freshness', 'device bound'],
        walletKeepsPrivate: ['full address', 'document image', 'credential witness'],
      },
    ],
    accountCreation: VEYGRIT_ID_ACCOUNT_CREATION_POLICY,
    guestCheckout: VEYGRIT_ID_GUEST_CHECKOUT_POLICY,
    commerceBoundary: VEYGRIT_ID_COMMERCE_BOUNDARY,
    developerAdoption: VEYGRIT_ID_DEVELOPER_ADOPTION,
    implementationTraceability: VEYGRIT_ID_IMPLEMENTATION_TRACEABILITY,
    friendDelivery,
    goToMarket: VEYGRIT_ID_GO_TO_MARKET,
    milestones: VEYGRIT_ID_MILESTONES,
    validationGates: [
      'npm run verify:address-login-spec',
      'npm run verify:address-wallet-friend-delivery',
      'no raw address in public callbacks or webhooks',
      'merchant_visible requires elevated explicit policy',
      'Vey ID account creation accepts Google/Apple only',
      'social login is bootstrap only, not address trust root',
      'carrier decrypt is purpose-bound, time-bound, and audited',
      'OSS fixtures remain synthetic',
    ],
    nonClaims: [
      'Veygrit ID is not proof of residence unless an issuer policy and legal context explicitly define that claim.',
      'Address Login does not make every global address complete or deliverable.',
      'Google/Apple sign-in does not verify an address.',
      'Carrier-only decrypt does not guarantee carrier SLA.',
      'ZK hook readiness is not audited circuit verification.',
    ],
  };
}

export function validateVeygritIdAddressLoginPlan(plan = buildVeygritIdAddressLoginPlan()): string[] {
  const errors: string[] = [];
  const layerIds = new Set(plan.layers.map(layer => layer.id));
  const boundaries = new Set(plan.layers.map(layer => layer.boundary));
  const milestoneIds = new Set(plan.milestones.map(milestone => milestone.id));

  for (const layer of [
    'identity-wallet',
    'hosted-address-login',
    'credential-registry',
    'consent-policy-compiler',
    'carrier-handoff',
    'merchant-console',
    'developer-platform',
    'audit-and-revocation',
  ] as const) {
    if (!layerIds.has(layer)) errors.push(`missing-layer:${layer}`);
  }

  for (const boundary of ['oss', 'commercial', 'shared-contract'] as const) {
    if (!boundaries.has(boundary)) errors.push(`missing-boundary:${boundary}`);
  }

  if (plan.layers.find(layer => layer.id === 'developer-platform')?.boundary !== 'oss') {
    errors.push('developer-platform-must-remain-oss');
  }
  if (plan.layers.find(layer => layer.id === 'hosted-address-login')?.boundary !== 'commercial') {
    errors.push('hosted-address-login-must-remain-commercial');
  }
  if (!plan.protocolDecisions.some(decision => decision.id === 'social-login-is-bootstrap-not-trust-root' && decision.default)) {
    errors.push('social-login-boundary-missing');
  }
  if (plan.accountCreation.allowedProviders.join(',') !== 'google,apple') {
    errors.push('account-creation-must-be-google-apple-only');
  }
  if (plan.accountCreation.passwordSignupEnabled || plan.accountCreation.emailPasswordSignupEnabled || plan.accountCreation.phoneSignupEnabled) {
    errors.push('account-creation-must-disable-password-email-and-phone-signup');
  }
  if (!plan.accountCreation.merchantEmbeddableVeyId) errors.push('vey-id-must-be-merchant-embeddable');
  if (!plan.accountCreation.addressWalletReuseRequired) errors.push('address-wallet-reuse-required');
  for (const output of ['pairwise subject alias', 'recipient_id', 'walletConsentRef']) {
    if (!plan.accountCreation.merchantReceives.includes(output)) errors.push(`account-creation-missing-safe-output:${output}`);
  }
  for (const blocked of ['rawAddress', 'recipientPhone', 'savedAddressBody']) {
    if (!plan.accountCreation.merchantNeverReceives.includes(blocked)) errors.push(`account-creation-missing-blocked-output:${blocked}`);
  }
  if (!plan.guestCheckout.enabled) errors.push('guest-checkout-disabled');
  if (plan.guestCheckout.accountRequiredBeforeCheckout !== false) errors.push('guest-checkout-must-not-require-account-before-checkout');
  if (!plan.guestCheckout.walletConsentRequired) errors.push('guest-checkout-missing-wallet-consent');
  if (!plan.guestCheckout.guestSessionRefRequired) errors.push('guest-checkout-missing-session-ref');
  if (plan.guestCheckout.optionalUpgradeProviders.join(',') !== 'google,apple') {
    errors.push('guest-checkout-upgrade-must-be-google-apple-only');
  }
  for (const action of ['start_checkout', 'request_address_login', 'approve_wallet_consent', 'create_carrier_handoff'] as const) {
    if (!plan.guestCheckout.allowedGuestActions.includes(action)) errors.push(`guest-checkout-missing-action:${action}`);
  }
  for (const blocked of ['save_address_without_account', 'persist_raw_address', 'create_wallet_account_without_google_or_apple'] as const) {
    if (!plan.guestCheckout.blockedGuestActions.includes(blocked)) errors.push(`guest-checkout-missing-blocked-action:${blocked}`);
  }
  for (const output of ['guestCheckoutRef', 'checkoutAlias', 'walletConsentRef']) {
    if (!plan.guestCheckout.merchantReceives.includes(output)) errors.push(`guest-checkout-missing-safe-output:${output}`);
  }
  for (const blocked of ['rawAddress', 'recipientPhone', 'savedAddressBody']) {
    if (!plan.guestCheckout.merchantNeverReceives.includes(blocked)) errors.push(`guest-checkout-missing-blocked-output:${blocked}`);
  }
  if (plan.commerceBoundary.playlistCommerceRequiresLoginButtonToShop !== false) {
    errors.push('playlist-commerce-must-not-require-login-button-to-shop');
  }
  if (!plan.commerceBoundary.ecSocialLoginRequiresContinueWithVeygrit) {
    errors.push('ec-social-login-must-require-continue-with-veygrit');
  }
  if (!plan.commerceBoundary.ecSocialLoginRequiresVeyIdForWalletAddressReuse) {
    errors.push('ec-social-login-must-require-vey-id-for-wallet-address-reuse');
  }
  if (plan.commerceBoundary.accountCreationProviders.join(',') !== 'google,apple') {
    errors.push('commerce-boundary-account-creation-must-be-google-apple-only');
  }
  for (const shared of ['Vey ID', 'Address Wallet', 'Delivery Gateway', 'WooCommerce', 'Shopify', 'SDK']) {
    if (!plan.commerceBoundary.sharedRails.includes(shared)) errors.push(`commerce-boundary-missing-shared-rail:${shared}`);
  }
  if (!plan.commerceBoundary.nonClaims.some(nonClaim => /Playlist Commerce is not EC Social Login/i.test(nonClaim))) {
    errors.push('commerce-boundary-missing-product-distinction');
  }
  if (!plan.commerceBoundary.nonClaims.some(nonClaim => /Continue with Veygrit/i.test(nonClaim))) {
    errors.push('commerce-boundary-missing-ec-login-rule');
  }
  for (const blocked of ['rawAddress', 'recipientPhone', 'savedAddressBody']) {
    if (plan.commerceBoundary.merchantReceives.includes(blocked)) errors.push(`commerce-boundary-merchant-receives-forbidden:${blocked}`);
    if (!plan.commerceBoundary.merchantNeverReceives.includes(blocked)) errors.push(`commerce-boundary-missing-blocked-output:${blocked}`);
  }

  for (const standard of ['oauth-oidc-pattern', 'pkce-state-nonce', 'webauthn-passkey', 'zk-proof-hook', 'webhook-hmac'] as const) {
    if (!plan.standards.includes(standard)) errors.push(`missing-standard-track:${standard}`);
  }

  for (const milestone of ['m0-oss-contract', 'm1-hosted-login-mvp', 'm4-carrier-handoff-beta', 'm6-enterprise-hardening'] as const) {
    if (!milestoneIds.has(milestone)) errors.push(`missing-milestone:${milestone}`);
  }

  if (plan.priorityUseCases.length < 4) errors.push('needs-at-least-four-priority-use-cases');
  for (const useCase of plan.priorityUseCases) {
    if (!useCase.requiredClaims.includes('address_credential_valid')) errors.push(`${useCase.purpose}:missing-address-credential-valid`);
    if (useCase.merchantSees.join(' ').match(/raw address|phone|unit detail/i)) errors.push(`${useCase.purpose}:merchant-sees-private-material`);
    if (useCase.walletKeepsPrivate.length < 3) errors.push(`${useCase.purpose}:weak-private-boundary`);
  }

  if (plan.goToMarket.length < 6) errors.push('go-to-market-needs-six-segments');
  errors.push(...validateAddressWalletFriendDeliveryPlan(plan.friendDelivery).map(error => `friend-delivery:${error}`));
  if (plan.friendDelivery.ssoPolicy.checkoutReauthRequiredWhenWalletSessionFresh) {
    errors.push('friend-delivery-must-not-require-checkout-reauth-when-session-fresh');
  }
  if (plan.friendDelivery.defaultDisclosureMode !== 'carrier_decryptable_preferred') {
    errors.push('friend-delivery-default-must-be-carrier-decryptable-preferred');
  }
  if (!plan.priorityUseCases.some(useCase =>
    useCase.purpose === 'anonymous_shipping'
    && useCase.disclosureMode === 'carrier_decryptable'
    && useCase.merchantSees.some(output => /friend delivery request/i.test(output))
  )) {
    errors.push('friend-delivery-priority-use-case-missing');
  }
  if (!plan.developerAdoption.primaryPromise.match(/minutes/i)) errors.push('developer-adoption-must-promise-fast-setup');
  for (const mode of ['hosted-redirect', 'drop-in-react', 'headless-hooks', 'nextjs-server-helper', 'webhook-verification', 'local-sandbox-mock'] as const) {
    if (!plan.developerAdoption.integrationModes.includes(mode)) errors.push(`missing-developer-integration-mode:${mode}`);
  }
  for (const packageName of ['@veygrit/address-login-react', '@veygrit/address-login-nextjs', '@veygrit/address-login-js', '@veygrit/address-login-node']) {
    if (!plan.developerAdoption.packages.some(pkg => pkg.packageName === packageName)) errors.push(`missing-sdk-package:${packageName}`);
  }
  if (!plan.developerAdoption.packages.some(pkg => pkg.primaryExports.includes('AddressLoginButton'))) {
    errors.push('missing-drop-in-address-login-button');
  }
  if (!plan.developerAdoption.packages.some(pkg => pkg.primaryExports.includes('useAddressLogin'))) {
    errors.push('missing-headless-use-address-login-hook');
  }
  if (!plan.developerAdoption.packages.some(pkg => pkg.primaryExports.includes('verifyAddressLoginCallback'))) {
    errors.push('missing-nextjs-callback-helper');
  }
  if (!plan.developerAdoption.packages.every(pkg => pkg.boundary === 'oss')) {
    errors.push('developer-sdk-packages-must-remain-oss');
  }
  if (!plan.developerAdoption.validationGates.some(gate => /no raw address/i.test(gate))) {
    errors.push('developer-adoption-missing-no-raw-address-gate');
  }
  if (!plan.developerAdoption.validationGates.some(gate => /guest checkout/i.test(gate))) {
    errors.push('developer-adoption-missing-guest-checkout-gate');
  }
  if (!plan.developerAdoption.validationGates.includes('npm run verify:address-wallet-friend-delivery')) {
    errors.push('developer-adoption-missing-friend-delivery-gate');
  }
  if (!plan.developerAdoption.nonClaims.some(nonClaim => /not a general social network|provider replacement/i.test(nonClaim))) {
    errors.push('developer-adoption-missing-auth-non-claim');
  }
  if (plan.implementationTraceability.productPlanPath !== 'docs/product/veygrit-id-address-login-plan.md') {
    errors.push('implementation-traceability-product-plan-path-mismatch');
  }
  if (plan.implementationTraceability.packageManifestPath !== 'sdk/veygrit-address-login-packages.manifest.json') {
    errors.push('implementation-traceability-package-manifest-path-mismatch');
  }
  if (plan.implementationTraceability.packageVerifierCommand !== 'npm run verify:veygrit-address-login-packages') {
    errors.push('implementation-traceability-package-verifier-mismatch');
  }
  if (plan.implementationTraceability.aggregateVerifierCommand !== 'npm run verify:address-login-spec') {
    errors.push('implementation-traceability-aggregate-verifier-mismatch');
  }
  for (const packageName of ['@veygrit/address-login-react', '@veygrit/address-login-nextjs']) {
    if (!plan.implementationTraceability.implementationPackages.includes(packageName)) {
      errors.push(`implementation-traceability-missing-package:${packageName}`);
    }
  }
  if (plan.implementationTraceability.publishReadinessClaim !== 'oss-prep-local-not-production-ready') {
    errors.push('implementation-traceability-must-not-claim-production-readiness');
  }
  for (const path of [
    'docs/product/veygrit-id-address-login-plan.md',
    'src/lib/veygritIdAddressLoginPlan.ts',
    'src/lib/veygritIdAddressLoginPlan.test.ts',
    'scripts/verify-veygrit-address-login-test-helpers.ts',
    'scripts/verify-veygrit-address-login-packages.ts',
    'sdk/veygrit-address-login-test-helpers/README.md',
    'sdk/veygrit-address-login-test-helpers/hostedCallbackValidationVectors.ts',
    'sdk/veygrit-address-login-test-helpers/merchantVisibleRedactionFixtures.ts',
  ]) {
    if (!plan.implementationTraceability.commitCandidatePaths.includes(path)) {
      errors.push(`implementation-traceability-missing-commit-candidate:${path}`);
    }
  }
  for (const command of [
    'npm run verify:veygrit-address-login-packages',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-commit-candidates',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-commit-summary',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-stage-plan',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-diff-scope',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-github-update-memo',
    'npx tsx scripts/verify-veygrit-address-login-packages.ts --report-final-local-check',
    'npx tsx --test src/lib/veygritIdAddressLoginPlan.test.ts',
  ]) {
    if (!plan.implementationTraceability.githubUpdatePreflightCommands.includes(command)) {
      errors.push(`implementation-traceability-missing-github-preflight:${command}`);
    }
  }
  if (!plan.implementationTraceability.blockedActions.some(action => /raw address/i.test(action))) {
    errors.push('implementation-traceability-missing-private-material-block');
  }
  if (!plan.implementationTraceability.blockedActions.some(action => /explicit current user request/i.test(action))) {
    errors.push('implementation-traceability-missing-explicit-user-action-boundary');
  }
  if (!plan.validationGates.includes('npm run verify:address-login-spec')) errors.push('missing-address-login-verification-gate');
  if (!plan.validationGates.includes('npm run verify:address-wallet-friend-delivery')) {
    errors.push('missing-friend-delivery-verification-gate');
  }
  if (!plan.nonClaims.some(nonClaim => /Google\/Apple sign-in does not verify an address/i.test(nonClaim))) {
    errors.push('missing-social-login-non-claim');
  }

  if (!ADDRESS_LOGIN_ENDPOINTS.every(endpoint => !endpoint.rawAddressAllowed)) errors.push('address-login-endpoint-allows-raw-address');
  if (ADDRESS_LOGIN_REQUIREMENTS.length < 10) errors.push('address-login-requirements-too-thin');
  if (ADDRESS_LOGIN_USER_EXPERIENCE_STEPS.length < 5) errors.push('address-login-ux-too-thin');
  if (ADDRESS_LOGIN_MERCHANT_FEATURES.length < 6) errors.push('address-login-merchant-console-too-thin');

  return errors;
}
