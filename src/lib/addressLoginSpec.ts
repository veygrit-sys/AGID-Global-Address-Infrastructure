import type { AddressFormat } from '../data/address_formats';
import {
  buildAddressElementFormFields,
  buildAddressElementLanguageTabs,
  describeAddressElementCountryForm,
} from './addressElementCountryForm';
import {
  VEYGRIT_ADDRESS_LOGIN_CALLBACK_CONTRACT_VERSION,
  VEYGRIT_ADDRESS_LOGIN_CALLBACK_NON_CLAIMS,
  VEYGRIT_ADDRESS_LOGIN_CALLBACK_PARAM_ALIASES,
  VEYGRIT_ADDRESS_LOGIN_CANONICAL_CALLBACK_PARAMS,
  VEYGRIT_ADDRESS_LOGIN_FORBIDDEN_CALLBACK_PARAM_EXAMPLES,
} from './veygritAddressLoginCallbackContract';

export type AddressLoginPurpose =
  | 'shipping'
  | 'anonymous_shipping'
  | 'pickup'
  | 'return'
  | 'hotel_delivery'
  | 'travel_checkin'
  | 'identity_verification'
  | 'customs';

export type AddressLoginClaim =
  | 'address_credential_valid'
  | 'user_approved'
  | 'deliverable'
  | 'country'
  | 'region_membership'
  | 'postal_equivalent'
  | 'quality_threshold'
  | 'not_revoked'
  | 'freshness'
  | 'device_bound'
  | 'carrier_decryptable_address'
  | 'customs_minimum_fields';

export type AddressLoginDisclosureMode =
  | 'proof_only'
  | 'selective_disclosure'
  | 'carrier_decryptable'
  | 'merchant_visible';

export type AddressLoginRiskLevel = 'low' | 'standard' | 'high' | 'regulated' | 'emergency';

export type AddressLoginFormSourceRef =
  | 'address-element-country-form'
  | 'src-data-address-formats'
  | 'agid-country-pack'
  | 'p0-gazetteer-pack'
  | 'official-postal-source-catalog'
  | 'agid-poi-graph'
  | 'safe-geofence-policy'
  | 'address-spatial-intelligence';

export type AddressLoginRequirement = {
  id: string;
  category: 'functional' | 'privacy' | 'security' | 'internationalization' | 'developer-experience' | 'operations' | 'accessibility';
  priority: 'MUST' | 'SHOULD' | 'MAY';
  statement: string;
  acceptance: string[];
};

export type AddressLoginApiEndpoint = {
  method: 'GET' | 'POST';
  path: string;
  purpose: string;
  rawAddressAllowed: boolean;
};

export type AddressLoginRequest = {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  purpose: AddressLoginPurpose;
  requestedClaims: AddressLoginClaim[];
  disclosureMode: AddressLoginDisclosureMode;
  riskLevel: AddressLoginRiskLevel;
  locale?: string;
  displayLanguageMode?: 'native' | 'english' | 'native_and_english';
  countryHints?: string[];
  carrierId?: string;
  maxCredentialAgeSeconds?: number;
};

export type AddressLoginFormCapability = {
  countryCode: string;
  countryName: string;
  selectedLanguage: string;
  displayLanguageMode: NonNullable<AddressLoginRequest['displayLanguageMode']>;
  nativeInputSupported: boolean;
  englishInputSupported: boolean;
  bilingualInputSupported: boolean;
  fallbackFormUsed: boolean;
  fieldCount: number;
  publicFieldKeys: string[];
  privateFieldKeys: string[];
  requiredFieldLabels: string[];
  postalCode: {
    available: boolean;
    required: boolean;
    format: string;
    fixedValue?: string;
  };
  ordering: 'big-to-small' | 'small-to-big' | string;
  sourceRefs: AddressLoginFormSourceRef[];
  warnings: string[];
};

export type AddressLoginResult = {
  status: 'approved' | 'needs_review' | 'denied' | 'expired';
  subjectAlias: string;
  consentEnvelopeId: string;
  credentialRef?: string;
  proofBundleRef?: string;
  publicClaims: Partial<Record<AddressLoginClaim, boolean | string | number>>;
  encryptedAddressForCarrierRef?: string;
  safeDisplayLines: string[];
  warnings: string[];
  nextAction: 'continue_checkout' | 'carrier_handoff' | 'manual_review' | 'request_consent_again' | 'deny';
};

export type AddressLoginUserExperienceStep = {
  id: string;
  actor: 'merchant' | 'wallet' | 'carrier';
  title: string;
  screen: string;
  primaryAction: string;
  safeVisibleData: string[];
  blockedData: string[];
  nextEvents: string[];
};

export type AddressLoginMerchantFeature = {
  id: string;
  area: 'setup' | 'policy' | 'testing' | 'operations' | 'support';
  label: string;
  description: string;
  controls: string[];
  safeOutputs: string[];
  blockedOutputs: string[];
  readiness: 'mvp' | 'production-hardening' | 'future';
};

export type AddressLoginMerchantSetupPreflight = {
  callbackUrl: string;
  callbackContractVersion: typeof VEYGRIT_ADDRESS_LOGIN_CALLBACK_CONTRACT_VERSION;
  checks: Array<{
    id: string;
    label: string;
    status: 'pass' | 'warn' | 'fail';
    detail: string;
    safeInputRef: string;
  }>;
  testVectorCommand: string;
  testVectorIds: string[];
  runButtonLabel: string;
};

export type AddressLoginWebhookHmacValidationCase = {
  id: string;
  label: string;
  event: string;
  payloadFingerprint: string;
  signatureHeader: string;
  signingKeyRef: string;
  expected: 'pass' | 'fail';
  reason: string;
  safeInputs: string[];
};

export type AddressLoginWebhookHmacValidator = {
  signingKeyRef: string;
  algorithm: 'hmac-sha256';
  headerName: 'x-veygrit-signature';
  timestampHeaderName: 'x-veygrit-timestamp';
  replayWindowSeconds: number;
  cases: AddressLoginWebhookHmacValidationCase[];
  negativeCaseId: string;
  nonClaims: string[];
};

export type AddressLoginMerchantIntegration = {
  request: AddressLoginRequest;
  validation: ReturnType<typeof validateAddressLoginRequest>;
  buttonCopy: {
    primary: string;
    secondary: string;
  };
  walletConsentSummary: string[];
  userExperience: AddressLoginUserExperienceStep[];
  merchantFeatures: AddressLoginMerchantFeature[];
  sdkSnippet: string;
  safeCallbackPreview: AddressLoginResult;
  callbackContract: {
    version: typeof VEYGRIT_ADDRESS_LOGIN_CALLBACK_CONTRACT_VERSION;
    canonicalParams: string[];
    acceptedAliases: Record<string, string[]>;
    forbiddenParams: string[];
    nonClaims: string[];
  };
  webhookEvents: string[];
  webhookHmacValidator: AddressLoginWebhookHmacValidator;
  requiredDashboardGates: string[];
  setupPreflight: AddressLoginMerchantSetupPreflight;
};

export const ADDRESS_LOGIN_REQUIREMENTS: AddressLoginRequirement[] = [
  {
    id: 'AL-FR-001',
    category: 'functional',
    priority: 'MUST',
    statement: 'Merchant can request address-related claims without receiving raw address text by default.',
    acceptance: ['default disclosure mode is proof_only or carrier_decryptable', 'merchant-visible raw address requires explicit elevated policy'],
  },
  {
    id: 'AL-FR-002',
    category: 'functional',
    priority: 'MUST',
    statement: 'User can choose a wallet address credential, approve purpose, and return a login result to the merchant.',
    acceptance: ['request has state and nonce', 'result has consentEnvelopeId', 'result has subjectAlias'],
  },
  {
    id: 'AL-FR-003',
    category: 'functional',
    priority: 'MUST',
    statement: 'Carrier-only decryption is supported for shipping flows where the merchant must not see the address.',
    acceptance: ['carrier_decryptable mode requires carrierId', 'result may include encryptedAddressForCarrierRef only as a reference'],
  },
  {
    id: 'AL-PR-001',
    category: 'privacy',
    priority: 'MUST',
    statement: 'Public events, audit logs, and merchant callbacks must not contain raw address, recipient, private key, or proof witness material.',
    acceptance: ['endpoint catalog marks rawAddressAllowed false for public APIs', 'safeDisplayLines contain only status/claim text'],
  },
  {
    id: 'AL-PR-002',
    category: 'privacy',
    priority: 'MUST',
    statement: 'Disclosure must be purpose-bound and revocable through an Address Consent Envelope.',
    acceptance: ['result includes consentEnvelopeId', 'request includes purpose', 'revocation endpoint exists'],
  },
  {
    id: 'AL-SEC-001',
    category: 'security',
    priority: 'MUST',
    statement: 'Every login transaction is bound to state, nonce, client, redirect URI, and wallet/device approval.',
    acceptance: ['request includes state and nonce', 'device_bound claim is available', 'result aliases are pairwise or purpose-scoped'],
  },
  {
    id: 'AL-SEC-002',
    category: 'security',
    priority: 'SHOULD',
    statement: 'High-risk flows require passkey or device-bound proof and may require ZK predicate verification.',
    acceptance: ['riskLevel high/regulated changes required claims', 'proofBundleRef is present when proof-only claims are requested'],
  },
  {
    id: 'AL-I18N-001',
    category: 'internationalization',
    priority: 'MUST',
    statement: 'Address Login supports native language, English, or native-and-English display modes for every country, territory, and special-region pack.',
    acceptance: ['request has displayLanguageMode', 'safe display is separated from raw address storage', 'fallback form is available when a country-specific format is missing'],
  },
  {
    id: 'AL-I18N-002',
    category: 'internationalization',
    priority: 'MUST',
    statement: 'Address Login reuses the Address Element country-form model so every national address order, postal-code policy, and local label set can be rendered at login time.',
    acceptance: ['form capability includes public/private field split', 'postal-code unavailable and fixed-code territories are represented without forcing a wrong input'],
  },
  {
    id: 'AL-I18N-003',
    category: 'internationalization',
    priority: 'SHOULD',
    statement: 'Address Login can cite AGID open-source country packs, P0 gazetteer packs, official postal-source catalog entries, POI graph data, and spatial-intelligence outputs as source references.',
    acceptance: ['form capability exposes sourceRefs', 'open-source references do not bypass privacy gates'],
  },
  {
    id: 'AL-DX-001',
    category: 'developer-experience',
    priority: 'MUST',
    statement: 'Developers can integrate with a button, hosted wallet redirect, SDK callback, webhook, and local test fixture.',
    acceptance: ['endpoint catalog includes authorize/token/verify/webhook/test vectors', 'spec has a quickstart flow'],
  },
  {
    id: 'AL-OPS-001',
    category: 'operations',
    priority: 'SHOULD',
    statement: 'Manual review, safe geofence, fraud risk, and address quality states are returned as next actions, not as confusing raw scores.',
    acceptance: ['result.nextAction is finite', 'warnings are machine-readable and redacted'],
  },
  {
    id: 'AL-A11Y-001',
    category: 'accessibility',
    priority: 'SHOULD',
    statement: 'Consent and address choice screens are keyboard-accessible, screen-reader-safe, and usable on mobile.',
    acceptance: ['primary actions are explicit', 'proof/disclosure state is text-visible, not color-only'],
  },
];

export const ADDRESS_LOGIN_ENDPOINTS: AddressLoginApiEndpoint[] = [
  { method: 'GET', path: '/address-login/authorize', purpose: 'start wallet authorization request', rawAddressAllowed: false },
  { method: 'POST', path: '/address-login/token', purpose: 'exchange authorization code for redacted login result', rawAddressAllowed: false },
  { method: 'POST', path: '/address-login/proof/verify', purpose: 'verify proof bundle and credential state', rawAddressAllowed: false },
  { method: 'POST', path: '/address-login/consent/revoke', purpose: 'revoke purpose-bound consent envelope', rawAddressAllowed: false },
  { method: 'POST', path: '/address-login/carrier/decrypt-request', purpose: 'request carrier-only decryption authorization', rawAddressAllowed: false },
  { method: 'POST', path: '/address-login/webhooks', purpose: 'deliver redacted login lifecycle events', rawAddressAllowed: false },
  { method: 'GET', path: '/address-login/test-vectors', purpose: 'download synthetic conformance fixtures', rawAddressAllowed: false },
];

export const ADDRESS_LOGIN_USER_EXPERIENCE_STEPS: AddressLoginUserExperienceStep[] = [
  {
    id: 'merchant-starts-request',
    actor: 'merchant',
    title: 'Merchant requests claims, not an address string',
    screen: 'Checkout or service form',
    primaryAction: 'Address Login',
    safeVisibleData: ['merchant name', 'purpose', 'requested claims', 'risk level'],
    blockedData: ['full address text', 'recipient phone', 'private delivery notes'],
    nextEvents: ['authorize request created', 'state and nonce bound'],
  },
  {
    id: 'wallet-opens-consent',
    actor: 'wallet',
    title: 'Wallet opens a purpose-bound consent sheet',
    screen: 'Identity Wallet consent sheet',
    primaryAction: 'Choose credential',
    safeVisibleData: ['address alias', 'verification state', 'language display mode', 'who can see what'],
    blockedData: ['private witness', 'device private key', 'hidden salt'],
    nextEvents: ['credential selected', 'proof plan compiled'],
  },
  {
    id: 'user-approves-proof-plan',
    actor: 'wallet',
    title: 'User approves proof, selective disclosure, or carrier-only decrypt',
    screen: 'Proof and disclosure review',
    primaryAction: 'Approve and continue',
    safeVisibleData: ['claims to prove', 'expiry', 'revocation path', 'carrier decryptability'],
    blockedData: ['raw credential payload', 'proof witness', 'unscoped carrier payload'],
    nextEvents: ['consent envelope issued', 'proof bundle reference minted'],
  },
  {
    id: 'merchant-receives-redacted-result',
    actor: 'merchant',
    title: 'Merchant receives a redacted login result',
    screen: 'Merchant checkout callback',
    primaryAction: 'Continue checkout',
    safeVisibleData: ['pairwise subject alias', 'deliverable flag', 'proof reference', 'next action'],
    blockedData: ['full address text', 'building/unit detail', 'carrier decrypt material'],
    nextEvents: ['redacted webhook emitted', 'audit event recorded'],
  },
  {
    id: 'carrier-handoff-if-needed',
    actor: 'carrier',
    title: 'Carrier-only disclosure happens after user approval',
    screen: 'Carrier handoff',
    primaryAction: 'Request scoped decrypt',
    safeVisibleData: ['delivery id', 'carrier id', 'decrypt authorization reference', 'expiry'],
    blockedData: ['merchant-visible delivery address', 'long-lived decrypt token', 'analytics payload with address material'],
    nextEvents: ['carrier decrypt request verified', 'handoff receipt created'],
  },
];

export const ADDRESS_LOGIN_MERCHANT_FEATURES: AddressLoginMerchantFeature[] = [
  {
    id: 'client-registration',
    area: 'setup',
    label: 'Client registration',
    description: 'Register redirect URIs, environment, client id, allowed purposes, and pairwise alias settings.',
    controls: ['redirect URI allowlist', 'sandbox/live environment', 'client status', 'pairwise subject aliases'],
    safeOutputs: ['clientId', 'environment', 'allowedPurposes', 'aliasMode'],
    blockedOutputs: ['shared user profile id', 'address credential body'],
    readiness: 'mvp',
  },
  {
    id: 'disclosure-policy',
    area: 'policy',
    label: 'Disclosure policy',
    description: 'Choose whether a merchant receives proof-only, selected fields, or carrier-only decryptable delivery references.',
    controls: ['allowed disclosure modes', 'risk level defaults', 'carrier ids', 'merchant-visible legacy exception'],
    safeOutputs: ['disclosureMode', 'riskLevel', 'carrierId', 'policy warnings'],
    blockedOutputs: ['default merchant-visible address', 'unbounded decrypt capability'],
    readiness: 'mvp',
  },
  {
    id: 'country-form-coverage',
    area: 'setup',
    label: 'Global country-form coverage',
    description: 'Reuse Address Element country forms, native/English display modes, postal-code policy, and fallback forms.',
    controls: ['country hints', 'native/English/bilingual display', 'fallback review', 'postal-code unavailable handling'],
    safeOutputs: ['countryCode', 'fieldCount', 'postalCode policy', 'sourceRefs'],
    blockedOutputs: ['forced postal field for no-postcode regions', 'country model claimed verified without source'],
    readiness: 'mvp',
  },
  {
    id: 'test-vectors',
    area: 'testing',
    label: 'Synthetic test vectors',
    description: 'Download fixtures for proof-only, carrier-decryptable, no-postcode, regulated, denied, and expired flows.',
    controls: ['fixture download', 'SDK conformance command', 'callback validator', 'webhook replay'],
    safeOutputs: ['fixtureRef', 'expectedClaims', 'safe callback JSON'],
    blockedOutputs: ['real recipient address', 'live witness material'],
    readiness: 'mvp',
  },
  {
    id: 'callback-contract-gate',
    area: 'testing',
    label: 'Callback contract gate',
    description: 'Pin the hosted callback version, canonical reference params, compatibility aliases, forbidden params, and non-claims before enabling live traffic.',
    controls: ['callback contract version', 'canonical params', 'compatibility aliases', 'forbidden param scan'],
    safeOutputs: ['callbackContractVersion', 'canonicalParams', 'acceptedAliases', 'nonClaims'],
    blockedOutputs: ['private callback fields', 'merchant decrypt authority', 'address storage claim'],
    readiness: 'mvp',
  },
  {
    id: 'webhook-and-audit',
    area: 'operations',
    label: 'Webhook and audit operations',
    description: 'Monitor redacted lifecycle events, retries, dead letters, and consent revocation without address material.',
    controls: ['webhook endpoint', 'HMAC verification', 'negative signature fixture', 'retry policy', 'dead-letter queue'],
    safeOutputs: ['eventId', 'deliveryId', 'consentEnvelopeId', 'result', 'payloadFingerprint', 'signingKeyRef'],
    blockedOutputs: ['address lines', 'phone number', 'proof witness', 'decrypt token'],
    readiness: 'production-hardening',
  },
  {
    id: 'support-review',
    area: 'support',
    label: 'Support and manual review',
    description: 'Let support see reason codes and next actions while keeping private address evidence inside the wallet or issuer boundary.',
    controls: ['manual review queue', 'reason codes', 'revocation link', 'user re-consent request'],
    safeOutputs: ['needs_review', 'warning codes', 'sourceRefs', 'nextAction'],
    blockedOutputs: ['private delivery notes', 'document image', 'raw evidence'],
    readiness: 'production-hardening',
  },
];

export function buildAddressLoginSdkSnippet(request: AddressLoginRequest) {
  const countryHints = request.countryHints?.length
    ? `[${request.countryHints.map(country => `'${country}'`).join(', ')}]`
    : '[]';
  return `import { createAddressLogin } from '@agid/address-login';

const addressLogin = createAddressLogin({
  clientId: '${request.clientId}',
  redirectUri: '${request.redirectUri}',
  purpose: '${request.purpose}',
  disclosureMode: '${request.disclosureMode}',
  riskLevel: '${request.riskLevel}',
  displayLanguageMode: '${request.displayLanguageMode ?? 'native_and_english'}',
  countryHints: ${countryHints},
});

const result = await addressLogin.authorize({
  state: '${request.state}',
  nonce: '${request.nonce}',
  requestedClaims: ${JSON.stringify(request.requestedClaims, null, 2).replace(/\n/g, '\n  ')},
});

// result contains aliases, claims, proof refs, and carrier refs only.`;
}

function findForbiddenCallbackUrlParams(redirectUri: string, forbiddenParams: string[]) {
  try {
    const url = new URL(redirectUri);
    const forbidden = new Set(forbiddenParams.map(param => param.toLowerCase()));
    return [...url.searchParams.keys()].filter(param => forbidden.has(param.toLowerCase()));
  } catch {
    return [];
  }
}

export function buildAddressLoginMerchantSetupPreflight(
  request: AddressLoginRequest,
): AddressLoginMerchantSetupPreflight {
  const callbackUrl = request.redirectUri;
  const callbackUrlIsHttps = /^https:\/\//i.test(callbackUrl);
  const forbiddenUrlParams = findForbiddenCallbackUrlParams(
    callbackUrl,
    [...VEYGRIT_ADDRESS_LOGIN_FORBIDDEN_CALLBACK_PARAM_EXAMPLES],
  );

  return {
    callbackUrl,
    callbackContractVersion: VEYGRIT_ADDRESS_LOGIN_CALLBACK_CONTRACT_VERSION,
    checks: [
      {
        id: 'callback-url-https',
        label: 'Callback URL uses HTTPS',
        status: callbackUrlIsHttps ? 'pass' : 'fail',
        detail: callbackUrlIsHttps ? 'Redirect URI is HTTPS-bound.' : 'Redirect URI must use HTTPS before live traffic.',
        safeInputRef: 'redirectUri',
      },
      {
        id: 'callback-contract-version-pinned',
        label: 'Callback contract version pinned',
        status: 'pass',
        detail: VEYGRIT_ADDRESS_LOGIN_CALLBACK_CONTRACT_VERSION,
        safeInputRef: 'callbackContract.version',
      },
      {
        id: 'callback-url-forbidden-param-scan',
        label: 'Forbidden callback params absent',
        status: forbiddenUrlParams.length ? 'fail' : 'pass',
        detail: forbiddenUrlParams.length
          ? `Remove forbidden query params: ${forbiddenUrlParams.join(', ')}`
          : 'No forbidden callback params detected in redirect URI.',
        safeInputRef: 'redirectUri.query',
      },
      {
        id: 'synthetic-test-vectors-ready',
        label: 'Synthetic test vectors ready',
        status: 'pass',
        detail: 'Run before enabling production callbacks.',
        safeInputRef: 'synthetic-fixture-suite',
      },
    ],
    testVectorCommand: 'npm run verify:address-login-spec',
    testVectorIds: [
      'carrier-decryptable-shipping',
      'proof-only-regulated',
      'no-postcode-fallback',
      'forbidden-callback-param-negative',
      'callback_forbidden_value_negative',
    ],
    runButtonLabel: 'Run synthetic test vectors',
  };
}

export function buildAddressLoginWebhookHmacValidator(
  webhookEvents = ['address_login.result_issued'],
): AddressLoginWebhookHmacValidator {
  const event = webhookEvents[0] ?? 'address_login.result_issued';

  return {
    signingKeyRef: 'whkey_ref_demo',
    algorithm: 'hmac-sha256',
    headerName: 'x-veygrit-signature',
    timestampHeaderName: 'x-veygrit-timestamp',
    replayWindowSeconds: 300,
    negativeCaseId: 'hmac-signature-mismatch-negative',
    nonClaims: [
      'Webhook HMAC validation authenticates event transport, not address truth.',
      'The signing key is referenced by id; secret material is not displayed.',
      'Failed HMAC validation must stop processing before callback or carrier handoff actions.',
    ],
    cases: [
      {
        id: 'hmac-valid-redacted-event',
        label: 'Valid redacted event',
        event,
        payloadFingerprint: 'payload_fp_demo_001',
        signatureHeader: 'v1=valid_fixture_signature_ref',
        signingKeyRef: 'whkey_ref_demo',
        expected: 'pass',
        reason: 'signature header matches payload fingerprint and timestamp window',
        safeInputs: ['eventRef', 'payloadFingerprint', 'timestamp', 'signingKeyRef'],
      },
      {
        id: 'hmac-signature-mismatch-negative',
        label: 'Signature mismatch negative fixture',
        event,
        payloadFingerprint: 'payload_fp_demo_001',
        signatureHeader: 'v1=wrong_fixture_signature_ref',
        signingKeyRef: 'whkey_ref_demo',
        expected: 'fail',
        reason: 'signature header does not match payload fingerprint',
        safeInputs: ['eventRef', 'payloadFingerprint', 'timestamp', 'signingKeyRef'],
      },
    ],
  };
}

export function buildAddressLoginMerchantIntegration(input?: Partial<AddressLoginRequest>): AddressLoginMerchantIntegration {
  const purpose = input?.purpose ?? 'shipping';
  const riskLevel = input?.riskLevel ?? 'standard';
  const disclosureMode = input?.disclosureMode ?? 'carrier_decryptable';
  const request: AddressLoginRequest = {
    clientId: input?.clientId ?? 'merchant_demo',
    redirectUri: input?.redirectUri ?? 'https://merchant.example/callback',
    state: input?.state ?? 'state_demo',
    nonce: input?.nonce ?? 'nonce_demo',
    purpose,
    requestedClaims: input?.requestedClaims ?? requiredClaimsForAddressLogin(purpose, riskLevel, disclosureMode),
    disclosureMode,
    riskLevel,
    locale: input?.locale ?? 'ja-JP',
    displayLanguageMode: input?.displayLanguageMode ?? 'native_and_english',
    countryHints: input?.countryHints ?? ['JP', 'US', 'HK'],
    carrierId: input?.carrierId ?? (disclosureMode === 'carrier_decryptable' ? 'carrier_demo' : undefined),
    maxCredentialAgeSeconds: input?.maxCredentialAgeSeconds ?? 2_592_000,
  };
  const validation = validateAddressLoginRequest(request);
  const claims = Object.fromEntries(
    request.requestedClaims.map(claim => [claim, claim === 'country' ? request.countryHints?.[0] ?? 'JP' : true]),
  ) as AddressLoginResult['publicClaims'];
  const safeCallbackPreview: AddressLoginResult = {
    status: validation.valid ? 'approved' : 'needs_review',
    subjectAlias: 'pairwise_sub_demo_8f3c',
    consentEnvelopeId: 'ace_demo_20260702',
    credentialRef: 'cred_ref_demo',
    proofBundleRef: request.disclosureMode === 'merchant_visible' ? undefined : 'proof_ref_demo',
    publicClaims: claims,
    encryptedAddressForCarrierRef: request.disclosureMode === 'carrier_decryptable' ? 'carrier_blob_ref_demo' : undefined,
    safeDisplayLines: [
      'deliverable=true',
      request.disclosureMode === 'carrier_decryptable' ? 'merchant cannot decrypt address' : `mode=${request.disclosureMode}`,
      `next=${validation.valid ? 'continue_checkout' : 'manual_review'}`,
    ],
    warnings: validation.warnings,
    nextAction: validation.valid
      ? request.disclosureMode === 'carrier_decryptable'
        ? 'carrier_handoff'
        : 'continue_checkout'
      : 'manual_review',
  };
  const webhookEvents = [
    'address_login.requested',
    'address_login.wallet_opened',
    'address_login.consent_granted',
    'address_login.result_issued',
    'address_login.consent_revoked',
    'address_login.carrier_decrypt_requested',
  ];

  return {
    request,
    validation,
    buttonCopy: {
      primary: 'Address Login',
      secondary: '住所を入力せず、ウォレットで配送先を承認',
    },
    walletConsentSummary: [
      `Purpose: ${request.purpose}`,
      `Disclosure: ${request.disclosureMode}`,
      `Risk: ${request.riskLevel}`,
      `Claims: ${request.requestedClaims.length}`,
      `Language: ${request.displayLanguageMode ?? 'native_and_english'}`,
    ],
    userExperience: ADDRESS_LOGIN_USER_EXPERIENCE_STEPS,
    merchantFeatures: ADDRESS_LOGIN_MERCHANT_FEATURES,
    sdkSnippet: buildAddressLoginSdkSnippet(request),
    safeCallbackPreview,
    callbackContract: {
      version: VEYGRIT_ADDRESS_LOGIN_CALLBACK_CONTRACT_VERSION,
      canonicalParams: [...VEYGRIT_ADDRESS_LOGIN_CANONICAL_CALLBACK_PARAMS],
      acceptedAliases: Object.fromEntries(
        Object.entries(VEYGRIT_ADDRESS_LOGIN_CALLBACK_PARAM_ALIASES)
          .map(([key, value]) => [key, [...value]]),
      ),
      forbiddenParams: [...VEYGRIT_ADDRESS_LOGIN_FORBIDDEN_CALLBACK_PARAM_EXAMPLES],
      nonClaims: [...VEYGRIT_ADDRESS_LOGIN_CALLBACK_NON_CLAIMS],
    },
    webhookEvents,
    webhookHmacValidator: buildAddressLoginWebhookHmacValidator(webhookEvents),
    requiredDashboardGates: [
      'redirect-uri-allowlist',
      'state-and-nonce-required',
      'no-raw-address-callback-validator',
      'callback-contract-v0.1-pinned',
      'pairwise-subject-alias',
      'webhook-hmac-verified',
      'webhook-hmac-negative-fixture',
      'carrier-decrypt-scope-bound',
      'synthetic-test-vector-passing',
    ],
    setupPreflight: buildAddressLoginMerchantSetupPreflight(request),
  };
}

export function requiredClaimsForAddressLogin(
  purpose: AddressLoginPurpose,
  riskLevel: AddressLoginRiskLevel,
  disclosureMode: AddressLoginDisclosureMode,
): AddressLoginClaim[] {
  const claims = new Set<AddressLoginClaim>([
    'address_credential_valid',
    'user_approved',
    'not_revoked',
    'freshness',
  ]);

  if (['shipping', 'anonymous_shipping', 'pickup', 'return', 'hotel_delivery'].includes(purpose)) {
    claims.add('deliverable');
    claims.add('quality_threshold');
  }
  if (purpose === 'customs') claims.add('customs_minimum_fields');
  if (disclosureMode === 'carrier_decryptable') claims.add('carrier_decryptable_address');
  if (disclosureMode === 'proof_only') claims.add('postal_equivalent');
  if (riskLevel === 'high' || riskLevel === 'regulated' || riskLevel === 'emergency') claims.add('device_bound');
  if (riskLevel === 'regulated') claims.add('region_membership');

  return [...claims];
}

export function validateAddressLoginRequest(request: AddressLoginRequest) {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!request.clientId) errors.push('client-id-required');
  if (!request.redirectUri) errors.push('redirect-uri-required');
  if (!request.state) errors.push('state-required');
  if (!request.nonce) errors.push('nonce-required');
  if (request.disclosureMode === 'carrier_decryptable' && !request.carrierId) {
    errors.push('carrier-id-required-for-carrier-decryptable');
  }
  if (request.disclosureMode === 'merchant_visible') {
    warnings.push('merchant-visible-address-is-high-risk-and-not-default');
  }

  const required = requiredClaimsForAddressLogin(request.purpose, request.riskLevel, request.disclosureMode);
  const missingClaims = required.filter(claim => !request.requestedClaims.includes(claim));
  if (missingClaims.length) errors.push(`missing-required-claims:${missingClaims.join(',')}`);

  return { valid: errors.length === 0, errors, warnings, requiredClaims: required };
}

function normalizeCountryCode(countryCode: string | undefined, format: AddressFormat | null | undefined) {
  return String(countryCode || format?.countryCode || 'ZZ').trim().toUpperCase() || 'ZZ';
}

function languageModeFor(mode: AddressLoginRequest['displayLanguageMode'] | undefined) {
  return mode ?? 'native_and_english';
}

export function buildAddressLoginFormCapability(input: {
  countryCode?: string;
  format?: AddressFormat | null;
  requestedLanguage?: string;
  displayLanguageMode?: AddressLoginRequest['displayLanguageMode'];
  includeP0GazetteerPack?: boolean;
  includePoiGraph?: boolean;
  includeSpatialIntelligence?: boolean;
}): AddressLoginFormCapability {
  const countryCode = normalizeCountryCode(input.countryCode, input.format);
  const displayLanguageMode = languageModeFor(input.displayLanguageMode);
  const tabs = buildAddressElementLanguageTabs(input.format, countryCode);
  const selectedLanguage = input.requestedLanguage && tabs.some(tab => tab.language === input.requestedLanguage)
    ? input.requestedLanguage
    : displayLanguageMode === 'english'
      ? tabs.find(tab => tab.source === 'english-shipping' || tab.source === 'english-domestic')?.language ?? tabs[0]?.language ?? 'en'
      : tabs[0]?.language ?? 'local';
  const fields = buildAddressElementFormFields(input.format, selectedLanguage);
  const summary = describeAddressElementCountryForm(input.format, selectedLanguage);
  const sourceRefs: AddressLoginFormSourceRef[] = [
    'address-element-country-form',
    'src-data-address-formats',
    'official-postal-source-catalog',
    'agid-country-pack',
  ];
  if (input.includeP0GazetteerPack) sourceRefs.push('p0-gazetteer-pack');
  if (input.includePoiGraph) sourceRefs.push('agid-poi-graph', 'safe-geofence-policy');
  if (input.includeSpatialIntelligence) sourceRefs.push('address-spatial-intelligence');

  const englishInputSupported = tabs.some(tab => tab.source === 'english-shipping' || tab.source === 'english-domestic' || tab.language.startsWith('en'));
  const nativeInputSupported = !input.format || tabs.some(tab => (
    tab.source === 'native' ||
    tab.language === 'local' ||
    !tab.language.startsWith('en')
  ));
  const postalCode = summary.postalCodePolicy;

  return {
    countryCode,
    countryName: summary.countryName,
    selectedLanguage,
    displayLanguageMode,
    nativeInputSupported,
    englishInputSupported,
    bilingualInputSupported: nativeInputSupported && englishInputSupported,
    fallbackFormUsed: !input.format,
    fieldCount: fields.length,
    publicFieldKeys: fields.filter(field => !field.private).map(field => field.key),
    privateFieldKeys: fields.filter(field => field.private).map(field => field.key),
    requiredFieldLabels: summary.requiredFields,
    postalCode: {
      available: postalCode.available,
      required: postalCode.required,
      format: summary.postalCodeFormat,
      ...(postalCode.fixedValue ? { fixedValue: postalCode.fixedValue } : {}),
    },
    ordering: summary.ordering,
    sourceRefs,
    warnings: [
      ...(!input.format ? ['country-specific-format-missing-fallback-form-used'] : []),
      ...(displayLanguageMode === 'native' && !nativeInputSupported ? ['native-input-tab-missing'] : []),
      ...(displayLanguageMode === 'english' && !englishInputSupported ? ['english-input-tab-missing'] : []),
    ],
  };
}
