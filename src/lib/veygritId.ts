import { sha256Hex } from './sha256';

export const VEYGRIT_ID_VERSION = 'veygrit-id-address-social-login-v1';

export const VEYGRIT_ID_AUTH_PROVIDERS = [
  'google',
  'apple',
] as const;
export const VEYGRIT_ID_SCOPES = [
  'profile.basic',
  'profile.travel',
  'address.shipping',
  'address.billing',
  'company.info',
  'hotel.delivery',
  'contact.phone',
  'locale',
  'temporary.address',
] as const;
export const VEYGRIT_ID_PARTNER_STATUSES = [
  'applicant',
  'needs-domain-verification',
  'needs-security-review',
  'approved',
  'rejected',
  'suspended',
] as const;
export const VEYGRIT_ID_SITE_CATEGORIES = [
  'ec',
  'travel',
  'hotel',
  'airline',
  'ticketing',
  'insurance',
  'corporate-purchase',
  'public-service',
  'startup-reviewed',
  'personal-site',
  'anonymous-site',
  'adult',
  'high-risk',
] as const;
export const VEYGRIT_ID_GRANT_STATUSES = [
  'requires-login',
  'requires-partner-approval',
  'requires-domain-verification',
  'requires-consent',
  'requires-reauth',
  'ready-to-fill',
  'denied',
  'expired',
] as const;
export const VEYGRIT_ID_NEXT_ACTIONS = [
  'sign-in',
  'review-partner',
  'verify-domain',
  'show-consent',
  'reauthenticate',
  'post-sealed-claims',
  'deny',
  'refresh-request',
  'none',
] as const;

export type VeygritIdAuthProvider = typeof VEYGRIT_ID_AUTH_PROVIDERS[number];
export type VeygritIdScope = typeof VEYGRIT_ID_SCOPES[number];
export type VeygritIdPartnerStatus = typeof VEYGRIT_ID_PARTNER_STATUSES[number];
export type VeygritIdSiteCategory = typeof VEYGRIT_ID_SITE_CATEGORIES[number];
export type VeygritIdGrantStatus = typeof VEYGRIT_ID_GRANT_STATUSES[number];
export type VeygritIdNextAction = typeof VEYGRIT_ID_NEXT_ACTIONS[number];
export type VeygritIdAddressKind = 'home' | 'work' | 'hotel' | 'temporary' | 'billing';
export type VeygritIdAccountAssurance = 'basic' | 'verified-email' | 'mfa' | 'passkey' | 'manual-review';

export type VeygritIdStoredAddressInput = {
  addressId?: unknown;
  kind?: unknown;
  ownerRelationship?: unknown;
  countryCode?: unknown;
  language?: unknown;
  addressCommitment?: unknown;
  agidCommitment?: unknown;
  aoidCommitment?: unknown;
  qualityDecision?: unknown;
  validFrom?: unknown;
  expiresAt?: unknown;
  rawAddress?: unknown;
  recipientName?: unknown;
  phone?: unknown;
};

export type VeygritIdAccountInput = {
  subjectId?: unknown;
  displayAlias?: unknown;
  loginProviders?: unknown;
  primaryProvider?: unknown;
  emailVerified?: unknown;
  mfaEnabled?: unknown;
  passkeyEnabled?: unknown;
  locale?: unknown;
  countryCode?: unknown;
  basicProfileCommitment?: unknown;
  travelProfileCommitment?: unknown;
  passportNameCommitment?: unknown;
  companyProfileCommitment?: unknown;
  addresses?: unknown;
  passportNumber?: unknown;
  rawName?: unknown;
  rawEmail?: unknown;
  rawPhone?: unknown;
};

export type VeygritIdPartnerApplicationInput = {
  partnerId?: unknown;
  legalName?: unknown;
  displayName?: unknown;
  siteCategory?: unknown;
  domains?: unknown;
  verifiedDomains?: unknown;
  requestedScopes?: unknown;
  privacyPolicyUrl?: unknown;
  termsUrl?: unknown;
  supportUrl?: unknown;
  securityContact?: unknown;
  httpsOnly?: unknown;
  dataRetentionDays?: unknown;
  businessVerified?: unknown;
  kybVerified?: unknown;
  contentReviewed?: unknown;
  fraudReviewPassed?: unknown;
  privacyPolicyReviewed?: unknown;
  securityReviewed?: unknown;
  apiKeyIssued?: unknown;
  clientId?: unknown;
  redirectUris?: unknown;
  anonymousOperator?: unknown;
  individualOperator?: unknown;
  adultContent?: unknown;
  highRiskCategory?: unknown;
  rawWebhookSecret?: unknown;
  rawApiKey?: unknown;
};

export type VeygritIdAuthorizationRequestInput = {
  requestId?: unknown;
  clientId?: unknown;
  origin?: unknown;
  redirectUri?: unknown;
  requestedScopes?: unknown;
  purpose?: unknown;
  nonce?: unknown;
  state?: unknown;
  createdAt?: unknown;
  expiresAt?: unknown;
  userLoggedIn?: unknown;
  reauthenticatedAt?: unknown;
  highRiskMode?: unknown;
};

export type VeygritIdConsentInput = {
  approvedScopes?: unknown;
  deniedScopes?: unknown;
  selectedAddressId?: unknown;
  selectedProfileIds?: unknown;
  consentedAt?: unknown;
  userConfirmed?: unknown;
};

export type VeygritIdStoredAddress = {
  addressId: string;
  kind: VeygritIdAddressKind;
  ownerRelationship: 'self';
  countryCode: string;
  language: string;
  addressCommitment: string;
  agidCommitment?: string;
  aoidCommitment?: string;
  qualityDecision: 'verified' | 'partial' | 'needs-review';
  validFrom?: string;
  expiresAt?: string;
};

export type VeygritIdAccount = {
  modelVersion: typeof VEYGRIT_ID_VERSION;
  subjectId: string;
  displayAlias: string;
  loginProviders: VeygritIdAuthProvider[];
  primaryProvider: VeygritIdAuthProvider;
  assurance: VeygritIdAccountAssurance;
  locale: string;
  countryCode: string;
  profileCommitments: {
    basic?: string;
    travel?: string;
    passportName?: string;
    company?: string;
  };
  addresses: VeygritIdStoredAddress[];
  warnings: string[];
  errors: string[];
  privacy: {
    rawNameStored: false;
    rawEmailStored: false;
    rawPhoneStored: false;
    rawPassportNumberStored: false;
    rawAddressStored: false;
    storesOnlySelfAddresses: true;
  };
};

export type VeygritIdPartnerApplication = {
  modelVersion: typeof VEYGRIT_ID_VERSION;
  partnerId: string;
  legalName: string;
  displayName: string;
  siteCategory: VeygritIdSiteCategory;
  status: VeygritIdPartnerStatus;
  domains: string[];
  verifiedDomains: string[];
  requestedScopes: VeygritIdScope[];
  clientId?: string;
  redirectUris: string[];
  apiKeyIssued: boolean;
  review: {
    businessVerified: boolean;
    kybVerified: boolean;
    contentReviewed: boolean;
    fraudReviewPassed: boolean;
    privacyPolicyReviewed: boolean;
    securityReviewed: boolean;
    httpsOnly: boolean;
    dataRetentionDays: number;
  };
  errors: string[];
  warnings: string[];
  privacy: {
    storesApiSecret: false;
    storesWebhookSecret: false;
    exposesPersonalAddressData: false;
  };
};

export type VeygritIdAuthorizationRequest = {
  modelVersion: typeof VEYGRIT_ID_VERSION;
  requestId: string;
  clientId: string;
  origin: string;
  redirectUri: string;
  requestedScopes: VeygritIdScope[];
  purpose: string;
  nonce: string;
  stateHash: string;
  createdAt: string;
  expiresAt: string;
  userLoggedIn: boolean;
  reauthenticatedAt?: string;
  highRiskMode: boolean;
};

export type VeygritIdConsentGrant = {
  modelVersion: typeof VEYGRIT_ID_VERSION;
  grantId: string;
  status: VeygritIdGrantStatus;
  nextAction: VeygritIdNextAction;
  partnerId: string;
  clientId: string;
  subjectId: string;
  requestedScopes: VeygritIdScope[];
  approvedScopes: VeygritIdScope[];
  deniedScopes: Array<{
    scope: VeygritIdScope;
    reason: string;
  }>;
  selectedAddressId?: string;
  consentedAt?: string;
  expiresAt: string;
  requiresReauthentication: boolean;
  claimKinds: Array<
    | 'basic-profile'
    | 'travel-profile'
    | 'shipping-address'
    | 'billing-address'
    | 'company-info'
    | 'hotel-delivery'
    | 'phone-contact'
    | 'locale'
    | 'temporary-address'
  >;
  sealedClaimEnvelope: {
    envelopeId: string;
    deliveryMode: 'direct-post-to-approved-client';
    audience: string;
    redirectUri: string;
    containsPlaintextForRecipientOnly: true;
    loggedPlaintext: false;
    ttlSeconds: number;
  };
  warnings: string[];
  errors: string[];
  privacy: {
    publicSurface: 'scopes-commitments-consent-status-and-sealed-claim-reference-only';
    rawAddressLogged: false;
    rawTravelNameLogged: false;
    rawPhoneLogged: false;
    merchantCanPullWithoutUserConsent: false;
    partnerMustBeReviewedEntity: true;
  };
};

export type VeygritIdIntegrationPlan = {
  modelVersion: typeof VEYGRIT_ID_VERSION;
  packageName: '@veygrit/id';
  buttonLabel: string;
  accountCreationProviders: VeygritIdAuthProvider[];
  components: string[];
  backendEndpoints: string[];
  requiredPartnerGates: string[];
  recommendedFlow: string[];
  notes: string[];
};

export type VeygritIdSessionInput = {
  account: VeygritIdAccount;
  provider?: unknown;
  providerSubject?: unknown;
  deviceBindingRef?: unknown;
  createdAt?: unknown;
  expiresAt?: unknown;
  authenticatedAt?: unknown;
  stepUpAt?: unknown;
  stepUpMethods?: unknown;
  providerIdToken?: unknown;
  providerAccessToken?: unknown;
  providerRefreshToken?: unknown;
  rawProviderProfile?: unknown;
};

export type VeygritIdSession = {
  modelVersion: typeof VEYGRIT_ID_VERSION;
  sessionRef: string;
  status: 'active' | 'blocked' | 'expired';
  subjectId: string;
  provider: VeygritIdAuthProvider;
  providerSubjectHash: string;
  walletSessionRef: string;
  deviceBindingRef?: string;
  assurance: VeygritIdAccountAssurance;
  createdAt: string;
  authenticatedAt: string;
  expiresAt: string;
  sessionFreshUntil: string;
  stepUpAt?: string;
  stepUpMethods: Array<'passkey' | 'mfa' | 'device-bound'>;
  errors: string[];
  warnings: string[];
  privacy: {
    storesProviderIdToken: false;
    storesProviderAccessToken: false;
    storesProviderRefreshToken: false;
    storesRawProviderProfile: false;
    providerSubjectStoredAsHash: true;
  };
};

export type VeygritIdPairwiseSubjectAlias = {
  modelVersion: typeof VEYGRIT_ID_VERSION;
  pairwiseSubjectAlias: string;
  subjectId: string;
  partnerId: string;
  clientId: string;
  origin: string;
  stableFor: 'partner-client-origin';
  merchantVisible: true;
  privacy: {
    globalSubjectIdExposedToMerchant: false;
    rawEmailExposedToMerchant: false;
    rawPhoneExposedToMerchant: false;
  };
};

export type VeygritIdAuthorizationCode = {
  modelVersion: typeof VEYGRIT_ID_VERSION;
  status: 'issued' | 'blocked' | 'expired';
  nextAction: 'exchange-code' | 'repair-session' | 'repair-grant' | 'refresh-request' | 'deny';
  authorizationCodeRef?: string;
  codeHash?: string;
  pairwiseSubjectAlias: string;
  walletSessionRef: string;
  grantId: string;
  clientId: string;
  redirectUri: string;
  stateHash: string;
  nonceHash: string;
  pkceChallengeHash: string;
  approvedScopes: VeygritIdScope[];
  claimKinds: VeygritIdConsentGrant['claimKinds'];
  selectedAddressId?: string;
  issuedAt: string;
  expiresAt: string;
  errors: string[];
  warnings: string[];
  privacy: {
    rawAuthorizationCodeLogged: false;
    rawAddressIncluded: false;
    providerTokenIncluded: false;
  };
};

export type VeygritIdTokenExchange = {
  modelVersion: typeof VEYGRIT_ID_VERSION;
  status: 'issued' | 'blocked' | 'expired';
  tokenType: 'bearer-ref';
  accessTokenRef?: string;
  idTokenRef?: string;
  addressCredentialRef?: string;
  walletSessionRef: string;
  pairwiseSubjectAlias: string;
  expiresInSeconds: number;
  claims: {
    iss: 'https://id.veygrit.example';
    aud: string;
    sub: string;
    nonceHash: string;
    authTime: string;
    scopeRefs: VeygritIdScope[];
    claimKinds: VeygritIdConsentGrant['claimKinds'];
  };
  errors: string[];
  warnings: string[];
  privacy: {
    rawAccessTokenLogged: false;
    rawIdTokenLogged: false;
    rawAddressIncluded: false;
    refreshTokenIssued: false;
  };
};

export type VeygritIdGuestCheckoutHandoff = {
  modelVersion: typeof VEYGRIT_ID_VERSION;
  mode: 'ec-guest-checkout';
  status: 'ready' | 'blocked';
  nextAction: 'create-guest-order' | 'repair-token-exchange' | 'request-address-consent' | 'deny';
  partnerId: string;
  clientId: string;
  pairwiseSubjectAlias: string;
  guestCheckoutAlias: string;
  walletSessionRef: string;
  walletConsentRef: string;
  addressCredentialRef?: string;
  carrierHandoffRef?: string;
  scopeRefs: VeygritIdScope[];
  claimKinds: VeygritIdConsentGrant['claimKinds'];
  merchantAccountCreationRequired: false;
  ecPasswordRequired: false;
  walletLoginRequired: true;
  ttlSeconds: number;
  errors: string[];
  warnings: string[];
  privacy: {
    rawAddressSharedWithMerchant: false;
    rawPhoneSharedWithMerchant: false;
    globalSubjectIdExposedToMerchant: false;
    merchantCanCreateAccountSilently: false;
    carrierCredentialsSharedWithMerchant: false;
    oneTimeUse: true;
  };
};

export type VeygritIdConnectionRevocation = {
  modelVersion: typeof VEYGRIT_ID_VERSION;
  revocationRef: string;
  subjectId: string;
  partnerId: string;
  clientId: string;
  pairwiseSubjectAlias: string;
  revokedGrantId?: string;
  revokedAt: string;
  reason: 'user-disconnect' | 'partner-suspended' | 'scope-reduced' | 'security-risk';
  merchantDeletionRefs: string[];
  walletEffects: string[];
  nextAction: 'notify-merchant-and-invalidate-refs';
  privacy: {
    rawAddressRevealedDuringRevocation: false;
    merchantCanContinuePullingAddress: false;
  };
};

const DEFAULT_TIME = '2026-06-20T00:00:00.000Z';
const FORBIDDEN_ACCOUNT_KEYS = [
  'passportNumber',
  'rawName',
  'rawEmail',
  'rawPhone',
  'rawAddress',
  'recipientName',
  'phone',
] as const;
const FORBIDDEN_PARTNER_KEYS = ['rawWebhookSecret', 'rawApiKey'] as const;
const FORBIDDEN_SESSION_KEYS = ['providerIdToken', 'providerAccessToken', 'providerRefreshToken', 'rawProviderProfile'] as const;
const PRIVATE_VALUE_RE = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+\d[\d ().-]{7,}\d|\b\d{2,4}[-().\s]\d{2,4}[-().\s]\d{2,6}\b|\bA(?:GID|OID)[-_][A-Z0-9]{6,}\b|\b-?\d{1,2}\.\d{4,}[ \t]*,[ \t]*-?\d{1,3}\.\d{4,})/i;

const SENSITIVE_SCOPES = new Set<VeygritIdScope>([
  'profile.travel',
  'address.shipping',
  'address.billing',
  'company.info',
  'hotel.delivery',
  'contact.phone',
  'temporary.address',
]);

const SCOPE_CLAIM_KIND: Record<VeygritIdScope, VeygritIdConsentGrant['claimKinds'][number]> = {
  'profile.basic': 'basic-profile',
  'profile.travel': 'travel-profile',
  'address.shipping': 'shipping-address',
  'address.billing': 'billing-address',
  'company.info': 'company-info',
  'hotel.delivery': 'hotel-delivery',
  'contact.phone': 'phone-contact',
  locale: 'locale',
  'temporary.address': 'temporary-address',
};

function clean(value: unknown, maxLength = 180) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
    .join(',')}}`;
}

function compactHash(value: unknown, prefix: string) {
  return `${prefix}_${sha256Hex(stableJson(value)).slice(0, 24).toUpperCase()}`;
}

function validIsoOrUndefined(value: unknown) {
  const text = clean(value, 64);
  return text && !Number.isNaN(Date.parse(text)) ? text : undefined;
}

function validIsoOrDefault(value: unknown, fallback = DEFAULT_TIME) {
  return validIsoOrUndefined(value) ?? fallback;
}

function normalizeProvider(value: unknown): VeygritIdAuthProvider | undefined {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (VEYGRIT_ID_AUTH_PROVIDERS.includes(text as VeygritIdAuthProvider)) return text as VeygritIdAuthProvider;
  return undefined;
}

function normalizeProviders(value: unknown): VeygritIdAuthProvider[] {
  const providers = unique(asArray<unknown>(value).map(normalizeProvider).filter(Boolean) as VeygritIdAuthProvider[]);
  return providers.length ? providers : ['google'];
}

function unsupportedAccountCreationProviders(value: unknown): string[] {
  return unique(asArray<unknown>(value)
    .map(item => clean(item).toLowerCase().replace(/[_\s]+/g, '-'))
    .filter(Boolean)
    .filter(item => !VEYGRIT_ID_AUTH_PROVIDERS.includes(item as VeygritIdAuthProvider)));
}

function normalizeScope(value: unknown): VeygritIdScope | undefined {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '.');
  if (VEYGRIT_ID_SCOPES.includes(text as VeygritIdScope)) return text as VeygritIdScope;
  if (text === 'profile' || text === 'basic') return 'profile.basic';
  if (text === 'travel') return 'profile.travel';
  if (text === 'shipping' || text === 'address') return 'address.shipping';
  if (text === 'billing') return 'address.billing';
  if (text === 'company') return 'company.info';
  if (text === 'hotel') return 'hotel.delivery';
  if (text === 'phone') return 'contact.phone';
  if (text === 'temporary') return 'temporary.address';
  return undefined;
}

function normalizeScopes(value: unknown, fallback: VeygritIdScope[] = []): VeygritIdScope[] {
  const scopes = asArray<unknown>(value).map(normalizeScope).filter(Boolean) as VeygritIdScope[];
  return unique(scopes.length ? scopes : fallback);
}

function normalizeSiteCategory(value: unknown): VeygritIdSiteCategory {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (VEYGRIT_ID_SITE_CATEGORIES.includes(text as VeygritIdSiteCategory)) return text as VeygritIdSiteCategory;
  return 'ec';
}

function normalizeAddressKind(value: unknown): VeygritIdAddressKind {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if (text === 'work' || text === 'hotel' || text === 'temporary' || text === 'billing') return text;
  return 'home';
}

function normalizeCountry(value: unknown) {
  const text = clean(value, 8).toUpperCase();
  return /^[A-Z]{2,3}$/.test(text) ? text : '';
}

function normalizeLanguage(value: unknown) {
  const text = clean(value, 16).toLowerCase();
  return /^[a-z]{2}(?:-[a-z0-9]{2,8})?$/.test(text) ? text : 'en';
}

function normalizedDomain(value: unknown) {
  const text = clean(value, 120).toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(text) ? text : '';
}

function normalizedHttpsUrl(value: unknown) {
  const text = clean(value, 240);
  try {
    const url = new URL(text);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function idFrom(prefix: string, value: unknown, seed: string) {
  const explicit = clean(value, 100).toUpperCase();
  if (/^[A-Z0-9][A-Z0-9_.:-]{2,99}$/.test(explicit)) return explicit;
  return `${prefix}-${sha256Hex(seed).slice(0, 18).toUpperCase()}`;
}

function hasForbiddenValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return PRIVATE_VALUE_RE.test(value);
  if (typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasForbiddenValue);
  return Object.values(value as Record<string, unknown>).some(hasForbiddenValue);
}

function normalizeAddress(input: VeygritIdStoredAddressInput, subjectId: string, index: number): {
  address?: VeygritIdStoredAddress;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const key of ['rawAddress', 'recipientName', 'phone'] as const) {
    if (clean(input[key])) errors.push('raw-private-address-material-not-allowed');
  }
  if (hasForbiddenValue(input)) errors.push('raw-private-address-material-not-allowed');
  const owner = clean(input.ownerRelationship).toLowerCase() || 'self';
  if (owner !== 'self') errors.push('only-self-addresses-allowed-in-mvp');
  const addressCommitment = clean(input.addressCommitment, 160);
  if (!addressCommitment) errors.push('address-commitment-required');
  const quality = clean(input.qualityDecision).toLowerCase().replace(/[_\s]+/g, '-');
  const qualityDecision = quality === 'partial' || quality === 'needs-review' ? quality : 'verified';
  if (qualityDecision !== 'verified') warnings.push('address-quality-requires-review-before-autofill');

  if (errors.length > 0) return { errors, warnings };
  return {
    address: {
      addressId: idFrom('VADDR', input.addressId, `${subjectId}:address:${index}:${addressCommitment}`),
      kind: normalizeAddressKind(input.kind),
      ownerRelationship: 'self',
      countryCode: normalizeCountry(input.countryCode),
      language: normalizeLanguage(input.language),
      addressCommitment,
      ...(clean(input.agidCommitment, 160) ? { agidCommitment: clean(input.agidCommitment, 160) } : {}),
      ...(clean(input.aoidCommitment, 160) ? { aoidCommitment: clean(input.aoidCommitment, 160) } : {}),
      qualityDecision,
      ...(validIsoOrUndefined(input.validFrom) ? { validFrom: validIsoOrUndefined(input.validFrom) } : {}),
      ...(validIsoOrUndefined(input.expiresAt) ? { expiresAt: validIsoOrUndefined(input.expiresAt) } : {}),
    },
    errors,
    warnings,
  };
}

export function buildVeygritIdAccount(input: VeygritIdAccountInput = {}): VeygritIdAccount {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const key of FORBIDDEN_ACCOUNT_KEYS) {
    if (clean(input[key])) errors.push(`${key}-not-allowed-in-veygrit-id-account`);
  }
  if (hasForbiddenValue(input)) errors.push('veygrit-id-account-private-input-rejected');
  const loginProviders = normalizeProviders(input.loginProviders);
  errors.push(...unsupportedAccountCreationProviders(input.loginProviders)
    .map(provider => `unsupported-account-creation-provider:${provider}`));
  const requestedPrimaryProvider = clean(input.primaryProvider).toLowerCase().replace(/[_\s]+/g, '-');
  if (requestedPrimaryProvider && !normalizeProvider(requestedPrimaryProvider)) {
    errors.push(`unsupported-primary-account-creation-provider:${requestedPrimaryProvider}`);
  }
  const primaryProvider = normalizeProvider(input.primaryProvider) ?? loginProviders[0];
  const subjectId = idFrom('VGUSER', input.subjectId, stableJson({
    displayAlias: input.displayAlias,
    loginProviders,
    basicProfileCommitment: input.basicProfileCommitment,
  }));
  const normalizedAddresses = asArray<VeygritIdStoredAddressInput>(input.addresses)
    .map((address, index) => normalizeAddress(address, subjectId, index));
  errors.push(...normalizedAddresses.flatMap(item => item.errors));
  warnings.push(...normalizedAddresses.flatMap(item => item.warnings));

  let assurance: VeygritIdAccountAssurance = 'basic';
  if (input.emailVerified) assurance = 'verified-email';
  if (input.mfaEnabled) assurance = 'mfa';
  if (input.passkeyEnabled) assurance = 'passkey';

  return {
    modelVersion: VEYGRIT_ID_VERSION,
    subjectId,
    displayAlias: clean(input.displayAlias, 80) || 'Veygrit user',
    loginProviders,
    primaryProvider,
    assurance,
    locale: normalizeLanguage(input.locale),
    countryCode: normalizeCountry(input.countryCode),
    profileCommitments: {
      ...(clean(input.basicProfileCommitment, 160) ? { basic: clean(input.basicProfileCommitment, 160) } : {}),
      ...(clean(input.travelProfileCommitment, 160) ? { travel: clean(input.travelProfileCommitment, 160) } : {}),
      ...(clean(input.passportNameCommitment, 160) ? { passportName: clean(input.passportNameCommitment, 160) } : {}),
      ...(clean(input.companyProfileCommitment, 160) ? { company: clean(input.companyProfileCommitment, 160) } : {}),
    },
    addresses: normalizedAddresses.map(item => item.address).filter(Boolean) as VeygritIdStoredAddress[],
    warnings: unique(warnings),
    errors: unique(errors),
    privacy: {
      rawNameStored: false,
      rawEmailStored: false,
      rawPhoneStored: false,
      rawPassportNumberStored: false,
      rawAddressStored: false,
      storesOnlySelfAddresses: true,
    },
  };
}

export function buildVeygritIdPartnerApplication(
  input: VeygritIdPartnerApplicationInput = {},
): VeygritIdPartnerApplication {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const key of FORBIDDEN_PARTNER_KEYS) {
    if (clean(input[key])) errors.push(`${key}-not-allowed-in-veygrit-id-partner`);
  }
  const siteCategory = normalizeSiteCategory(input.siteCategory);
  const bannedCategory = siteCategory === 'personal-site'
    || siteCategory === 'anonymous-site'
    || siteCategory === 'adult'
    || siteCategory === 'high-risk'
    || input.anonymousOperator
    || input.individualOperator
    || input.adultContent
    || input.highRiskCategory;
  if (bannedCategory) errors.push('partner-category-not-eligible-for-veygrit-id');
  const domains = unique(asArray<unknown>(input.domains).map(normalizedDomain).filter(Boolean));
  const verifiedDomains = unique(asArray<unknown>(input.verifiedDomains).map(normalizedDomain).filter(Boolean));
  const requestedScopes = normalizeScopes(input.requestedScopes, ['profile.basic', 'address.shipping']);
  const redirectUris = unique(asArray<unknown>(input.redirectUris).map(normalizedHttpsUrl).filter(Boolean));
  const dataRetentionDays = Math.max(1, Math.round(Number(clean(input.dataRetentionDays, 20)) || 30));
  if (domains.length === 0) errors.push('partner-domain-required');
  if (requestedScopes.length === 0) errors.push('partner-scopes-required');
  if (redirectUris.length === 0) warnings.push('redirect-uri-required-before-production');
  if (dataRetentionDays > 90) warnings.push('partner-data-retention-too-long-for-autofill');
  const reviewComplete = Boolean(
    input.businessVerified
    && input.kybVerified
    && input.contentReviewed
    && input.fraudReviewPassed
    && input.privacyPolicyReviewed
    && input.securityReviewed
    && input.httpsOnly
    && verifiedDomains.length > 0,
  );
  let status: VeygritIdPartnerStatus = 'applicant';
  if (errors.length > 0) status = 'rejected';
  else if (domains.some(domain => !verifiedDomains.includes(domain))) status = 'needs-domain-verification';
  else if (!reviewComplete) status = 'needs-security-review';
  else status = 'approved';

  return {
    modelVersion: VEYGRIT_ID_VERSION,
    partnerId: idFrom('VGPARTNER', input.partnerId, stableJson({ legalName: input.legalName, domains })),
    legalName: clean(input.legalName, 120) || 'Unreviewed organization',
    displayName: clean(input.displayName, 80) || clean(input.legalName, 80) || 'Veygrit partner',
    siteCategory,
    status,
    domains,
    verifiedDomains,
    requestedScopes,
    ...(clean(input.clientId, 120) ? { clientId: clean(input.clientId, 120) } : {}),
    redirectUris,
    apiKeyIssued: Boolean(input.apiKeyIssued && status === 'approved'),
    review: {
      businessVerified: Boolean(input.businessVerified),
      kybVerified: Boolean(input.kybVerified),
      contentReviewed: Boolean(input.contentReviewed),
      fraudReviewPassed: Boolean(input.fraudReviewPassed),
      privacyPolicyReviewed: Boolean(input.privacyPolicyReviewed),
      securityReviewed: Boolean(input.securityReviewed),
      httpsOnly: Boolean(input.httpsOnly),
      dataRetentionDays,
    },
    errors: unique(errors),
    warnings: unique(warnings),
    privacy: {
      storesApiSecret: false,
      storesWebhookSecret: false,
      exposesPersonalAddressData: false,
    },
  };
}

export function buildVeygritIdAuthorizationRequest(
  input: VeygritIdAuthorizationRequestInput = {},
): VeygritIdAuthorizationRequest {
  const createdAt = validIsoOrDefault(input.createdAt);
  const expiresAt = validIsoOrDefault(input.expiresAt, new Date(Date.parse(createdAt) + 10 * 60 * 1000).toISOString());
  const state = clean(input.state, 240) || compactHash({ createdAt, clientId: input.clientId }, 'state');
  const nonce = clean(input.nonce, 120) || compactHash({ state, createdAt }, 'nonce');
  return {
    modelVersion: VEYGRIT_ID_VERSION,
    requestId: idFrom('VGREQ', input.requestId, stableJson({ clientId: input.clientId, state, createdAt })),
    clientId: clean(input.clientId, 120),
    origin: normalizedDomain(input.origin),
    redirectUri: normalizedHttpsUrl(input.redirectUri),
    requestedScopes: normalizeScopes(input.requestedScopes, ['profile.basic']),
    purpose: clean(input.purpose, 120) || 'address-autofill',
    nonce,
    stateHash: sha256Hex(state),
    createdAt,
    expiresAt,
    userLoggedIn: Boolean(input.userLoggedIn),
    ...(validIsoOrUndefined(input.reauthenticatedAt) ? { reauthenticatedAt: validIsoOrUndefined(input.reauthenticatedAt) } : {}),
    highRiskMode: Boolean(input.highRiskMode),
  };
}

function hasFreshReauth(request: VeygritIdAuthorizationRequest, now: string) {
  if (!request.reauthenticatedAt) return false;
  return Date.parse(now) - Date.parse(request.reauthenticatedAt) <= 5 * 60 * 1000;
}

function scopeAvailableForAccount(scope: VeygritIdScope, account: VeygritIdAccount, selectedAddress?: VeygritIdStoredAddress) {
  if (scope === 'profile.basic') return Boolean(account.profileCommitments.basic);
  if (scope === 'profile.travel') return Boolean(account.profileCommitments.travel || account.profileCommitments.passportName);
  if (scope === 'company.info') return Boolean(account.profileCommitments.company);
  if (scope === 'locale') return true;
  if (scope === 'contact.phone') return account.assurance === 'mfa' || account.assurance === 'passkey';
  if (scope === 'address.shipping') return Boolean(selectedAddress && (selectedAddress.kind === 'home' || selectedAddress.kind === 'work' || selectedAddress.kind === 'temporary' || selectedAddress.kind === 'hotel'));
  if (scope === 'address.billing') return Boolean(selectedAddress && (selectedAddress.kind === 'billing' || selectedAddress.kind === 'home' || selectedAddress.kind === 'work'));
  if (scope === 'hotel.delivery') return Boolean(selectedAddress?.kind === 'hotel');
  if (scope === 'temporary.address') return Boolean(selectedAddress?.kind === 'temporary');
  return false;
}

export function buildVeygritIdConsentGrant(input: {
  account: VeygritIdAccount;
  partner: VeygritIdPartnerApplication;
  request: VeygritIdAuthorizationRequest;
  consent?: VeygritIdConsentInput;
  now?: unknown;
}): VeygritIdConsentGrant {
  const now = validIsoOrDefault(input.now, input.request.createdAt);
  const errors: string[] = [];
  const warnings: string[] = [];
  const requestedScopes = input.request.requestedScopes;
  const approvedScopes = normalizeScopes(input.consent?.approvedScopes, []);
  const deniedExplicit = new Set(normalizeScopes(input.consent?.deniedScopes, []));
  const selectedAddressId = clean(input.consent?.selectedAddressId, 100);
  const selectedAddress = input.account.addresses.find(address => address.addressId === selectedAddressId)
    ?? input.account.addresses.find(address => address.kind === 'home')
    ?? input.account.addresses[0];
  const deniedScopes: VeygritIdConsentGrant['deniedScopes'] = [];

  if (input.partner.status !== 'approved') errors.push('partner-not-approved');
  if (!input.partner.clientId || input.partner.clientId !== input.request.clientId) errors.push('client-id-not-approved-for-partner');
  if (!input.partner.verifiedDomains.includes(input.request.origin)) errors.push('origin-domain-not-verified');
  if (!input.partner.redirectUris.includes(input.request.redirectUri)) errors.push('redirect-uri-not-registered');
  if (!input.request.userLoggedIn) errors.push('user-not-logged-in');
  if (Date.parse(input.request.expiresAt) <= Date.parse(now)) errors.push('authorization-request-expired');
  if (!input.consent?.userConfirmed) errors.push('user-consent-not-confirmed');

  const requiresReauthentication = requestedScopes.some(scope => SENSITIVE_SCOPES.has(scope))
    || input.request.highRiskMode;
  if (requiresReauthentication && !hasFreshReauth(input.request, now)) errors.push('fresh-reauthentication-required');

  const grantedScopes = requestedScopes.filter((scope) => {
    if (deniedExplicit.has(scope)) {
      deniedScopes.push({ scope, reason: 'user-denied' });
      return false;
    }
    if (!approvedScopes.includes(scope)) {
      deniedScopes.push({ scope, reason: 'not-approved-by-user' });
      return false;
    }
    if (!input.partner.requestedScopes.includes(scope)) {
      deniedScopes.push({ scope, reason: 'scope-not-approved-for-partner' });
      return false;
    }
    if (!scopeAvailableForAccount(scope, input.account, selectedAddress)) {
      deniedScopes.push({ scope, reason: 'scope-data-not-available' });
      return false;
    }
    return true;
  });

  if (selectedAddress?.qualityDecision !== 'verified' && grantedScopes.some(scope => scope.startsWith('address.') || scope === 'hotel.delivery' || scope === 'temporary.address')) {
    warnings.push('selected-address-quality-not-verified');
  }

  let status: VeygritIdGrantStatus = 'ready-to-fill';
  if (errors.includes('user-not-logged-in')) status = 'requires-login';
  else if (errors.includes('partner-not-approved') || errors.includes('client-id-not-approved-for-partner')) status = 'requires-partner-approval';
  else if (errors.includes('origin-domain-not-verified') || errors.includes('redirect-uri-not-registered')) status = 'requires-domain-verification';
  else if (errors.includes('user-consent-not-confirmed')) status = 'requires-consent';
  else if (errors.includes('fresh-reauthentication-required')) status = 'requires-reauth';
  else if (errors.includes('authorization-request-expired')) status = 'expired';
  else if (grantedScopes.length === 0) status = 'denied';

  const nextAction: VeygritIdNextAction = status === 'requires-login'
    ? 'sign-in'
    : status === 'requires-partner-approval'
      ? 'review-partner'
      : status === 'requires-domain-verification'
        ? 'verify-domain'
        : status === 'requires-consent'
          ? 'show-consent'
          : status === 'requires-reauth'
            ? 'reauthenticate'
            : status === 'ready-to-fill'
              ? 'post-sealed-claims'
              : status === 'expired'
                ? 'refresh-request'
                : status === 'denied'
                  ? 'deny'
                  : 'none';

  return {
    modelVersion: VEYGRIT_ID_VERSION,
    grantId: idFrom('VGGRANT', undefined, stableJson({
      subjectId: input.account.subjectId,
      partnerId: input.partner.partnerId,
      requestId: input.request.requestId,
      grantedScopes,
      now,
    })),
    status,
    nextAction,
    partnerId: input.partner.partnerId,
    clientId: input.request.clientId,
    subjectId: input.account.subjectId,
    requestedScopes,
    approvedScopes: grantedScopes,
    deniedScopes,
    ...(selectedAddress && grantedScopes.some(scope => scope.includes('address') || scope === 'hotel.delivery') ? { selectedAddressId: selectedAddress.addressId } : {}),
    ...(validIsoOrUndefined(input.consent?.consentedAt) ? { consentedAt: validIsoOrUndefined(input.consent?.consentedAt) } : {}),
    expiresAt: input.request.expiresAt,
    requiresReauthentication,
    claimKinds: unique(grantedScopes.map(scope => SCOPE_CLAIM_KIND[scope])),
    sealedClaimEnvelope: {
      envelopeId: compactHash({
        grant: input.request.requestId,
        audience: input.request.clientId,
        scopes: grantedScopes,
        selectedAddressId: selectedAddress?.addressId,
      }, 'vg_sealed_claim'),
      deliveryMode: 'direct-post-to-approved-client',
      audience: input.request.clientId,
      redirectUri: input.request.redirectUri,
      containsPlaintextForRecipientOnly: true,
      loggedPlaintext: false,
      ttlSeconds: Math.max(1, Math.floor((Date.parse(input.request.expiresAt) - Date.parse(now)) / 1000)),
    },
    warnings: unique(warnings),
    errors: unique(errors),
    privacy: {
      publicSurface: 'scopes-commitments-consent-status-and-sealed-claim-reference-only',
      rawAddressLogged: false,
      rawTravelNameLogged: false,
      rawPhoneLogged: false,
      merchantCanPullWithoutUserConsent: false,
      partnerMustBeReviewedEntity: true,
    },
  };
}

function normalizeStepUpMethods(value: unknown): VeygritIdSession['stepUpMethods'] {
  const methods = unique(asArray<unknown>(value)
    .map(item => clean(item).toLowerCase().replace(/[_\s]+/g, '-'))
    .filter((item): item is VeygritIdSession['stepUpMethods'][number] => (
      item === 'passkey' || item === 'mfa' || item === 'device-bound'
    )));
  return methods;
}

export function buildVeygritIdSession(input: VeygritIdSessionInput): VeygritIdSession {
  const createdAt = validIsoOrDefault(input.createdAt);
  const authenticatedAt = validIsoOrDefault(input.authenticatedAt, createdAt);
  const expiresAt = validIsoOrDefault(input.expiresAt, new Date(Date.parse(authenticatedAt) + 24 * 60 * 60 * 1000).toISOString());
  const errors: string[] = [];
  const warnings: string[] = [];
  const provider = normalizeProvider(input.provider) ?? input.account.primaryProvider;

  for (const key of FORBIDDEN_SESSION_KEYS) {
    if (clean(input[key])) errors.push(`${key}-not-allowed-in-veygrit-id-session`);
  }
  if (!input.account.loginProviders.includes(provider)) errors.push('provider-not-linked-to-account');
  if (input.account.errors.length > 0) errors.push('account-has-blocking-errors');
  if (!clean(input.providerSubject, 240)) errors.push('provider-subject-required');
  if (hasForbiddenValue({
    providerSubject: input.providerSubject,
    deviceBindingRef: input.deviceBindingRef,
  })) {
    errors.push('veygrit-id-session-private-input-rejected');
  }

  const stepUpAt = validIsoOrUndefined(input.stepUpAt);
  const stepUpMethods = normalizeStepUpMethods(input.stepUpMethods);
  if (stepUpAt && stepUpMethods.length === 0) warnings.push('step-up-time-present-without-method');

  const status: VeygritIdSession['status'] = Date.parse(expiresAt) <= Date.parse(authenticatedAt)
    ? 'expired'
    : errors.length > 0
      ? 'blocked'
      : 'active';
  const sessionFreshSource = stepUpAt ?? authenticatedAt;

  return {
    modelVersion: VEYGRIT_ID_VERSION,
    sessionRef: compactHash({
      subjectId: input.account.subjectId,
      provider,
      providerSubjectHash: sha256Hex(clean(input.providerSubject, 240)),
      authenticatedAt,
    }, 'vey_session'),
    status,
    subjectId: input.account.subjectId,
    provider,
    providerSubjectHash: sha256Hex(clean(input.providerSubject, 240)),
    walletSessionRef: compactHash({ subjectId: input.account.subjectId, authenticatedAt }, 'wallet_session'),
    ...(clean(input.deviceBindingRef, 120) ? { deviceBindingRef: clean(input.deviceBindingRef, 120) } : {}),
    assurance: input.account.assurance,
    createdAt,
    authenticatedAt,
    expiresAt,
    sessionFreshUntil: new Date(Date.parse(sessionFreshSource) + 5 * 60 * 1000).toISOString(),
    ...(stepUpAt ? { stepUpAt } : {}),
    stepUpMethods,
    errors: unique(errors),
    warnings: unique(warnings),
    privacy: {
      storesProviderIdToken: false,
      storesProviderAccessToken: false,
      storesProviderRefreshToken: false,
      storesRawProviderProfile: false,
      providerSubjectStoredAsHash: true,
    },
  };
}

export function buildVeygritIdPairwiseSubjectAlias(input: {
  account: VeygritIdAccount;
  partner: VeygritIdPartnerApplication;
  origin?: unknown;
}): VeygritIdPairwiseSubjectAlias {
  const origin = normalizedDomain(input.origin) || input.partner.verifiedDomains[0] || input.partner.domains[0] || 'unverified.example';
  const clientId = input.partner.clientId ?? compactHash({ partnerId: input.partner.partnerId }, 'client');

  return {
    modelVersion: VEYGRIT_ID_VERSION,
    pairwiseSubjectAlias: compactHash({
      subjectId: input.account.subjectId,
      partnerId: input.partner.partnerId,
      clientId,
      origin,
    }, 'pairwise_subject'),
    subjectId: input.account.subjectId,
    partnerId: input.partner.partnerId,
    clientId,
    origin,
    stableFor: 'partner-client-origin',
    merchantVisible: true,
    privacy: {
      globalSubjectIdExposedToMerchant: false,
      rawEmailExposedToMerchant: false,
      rawPhoneExposedToMerchant: false,
    },
  };
}

export function issueVeygritIdAuthorizationCode(input: {
  session: VeygritIdSession;
  grant: VeygritIdConsentGrant;
  account: VeygritIdAccount;
  partner: VeygritIdPartnerApplication;
  request: VeygritIdAuthorizationRequest;
  pkceChallenge?: unknown;
  now?: unknown;
}): VeygritIdAuthorizationCode {
  const now = validIsoOrDefault(input.now, input.request.createdAt);
  const errors: string[] = [];
  const warnings: string[] = [...input.grant.warnings];
  const pairwise = buildVeygritIdPairwiseSubjectAlias({
    account: input.account,
    partner: input.partner,
    origin: input.request.origin,
  });
  const pkceChallenge = clean(input.pkceChallenge, 180);

  if (input.session.status !== 'active') errors.push('session-not-active');
  if (input.session.subjectId !== input.account.subjectId) errors.push('session-subject-mismatch');
  if (input.grant.status !== 'ready-to-fill') errors.push('grant-not-ready');
  if (input.grant.subjectId !== input.account.subjectId) errors.push('grant-subject-mismatch');
  if (input.grant.clientId !== input.request.clientId) errors.push('grant-client-mismatch');
  if (!pkceChallenge) errors.push('pkce-challenge-required');
  if (Date.parse(input.request.expiresAt) <= Date.parse(now)) errors.push('authorization-request-expired');

  const expiresAt = new Date(Math.min(
    Date.parse(input.grant.expiresAt),
    Date.parse(now) + 5 * 60 * 1000,
  )).toISOString();
  const status: VeygritIdAuthorizationCode['status'] = errors.includes('authorization-request-expired')
    ? 'expired'
    : errors.length > 0
      ? 'blocked'
      : 'issued';
  const authorizationCodeRef = compactHash({
    grantId: input.grant.grantId,
    sessionRef: input.session.sessionRef,
    pairwiseSubjectAlias: pairwise.pairwiseSubjectAlias,
    now,
  }, 'vey_auth_code');

  return {
    modelVersion: VEYGRIT_ID_VERSION,
    status,
    nextAction: status === 'issued'
      ? 'exchange-code'
      : status === 'expired'
        ? 'refresh-request'
        : errors.some(error => /session/.test(error))
          ? 'repair-session'
          : errors.some(error => /grant/.test(error))
            ? 'repair-grant'
            : 'deny',
    ...(status === 'issued' ? { authorizationCodeRef } : {}),
    ...(status === 'issued' ? { codeHash: sha256Hex(authorizationCodeRef) } : {}),
    pairwiseSubjectAlias: pairwise.pairwiseSubjectAlias,
    walletSessionRef: input.session.walletSessionRef,
    grantId: input.grant.grantId,
    clientId: input.request.clientId,
    redirectUri: input.request.redirectUri,
    stateHash: input.request.stateHash,
    nonceHash: sha256Hex(input.request.nonce),
    pkceChallengeHash: sha256Hex(pkceChallenge),
    approvedScopes: input.grant.approvedScopes,
    claimKinds: input.grant.claimKinds,
    ...(input.grant.selectedAddressId ? { selectedAddressId: input.grant.selectedAddressId } : {}),
    issuedAt: now,
    expiresAt,
    errors: unique(errors),
    warnings: unique(warnings),
    privacy: {
      rawAuthorizationCodeLogged: false,
      rawAddressIncluded: false,
      providerTokenIncluded: false,
    },
  };
}

export function exchangeVeygritIdAuthorizationCode(input: {
  authorizationCode: VeygritIdAuthorizationCode;
  clientId?: unknown;
  redirectUri?: unknown;
  pkceChallenge?: unknown;
  authTime?: unknown;
  now?: unknown;
}): VeygritIdTokenExchange {
  const now = validIsoOrDefault(input.now, input.authorizationCode.issuedAt);
  const errors: string[] = [];
  const pkceChallenge = clean(input.pkceChallenge, 180);
  const clientId = clean(input.clientId, 120);
  const redirectUri = normalizedHttpsUrl(input.redirectUri);

  if (input.authorizationCode.status !== 'issued') errors.push('authorization-code-not-issued');
  if (!input.authorizationCode.authorizationCodeRef) errors.push('authorization-code-ref-missing');
  if (clientId !== input.authorizationCode.clientId) errors.push('client-id-mismatch');
  if (redirectUri !== input.authorizationCode.redirectUri) errors.push('redirect-uri-mismatch');
  if (!pkceChallenge || sha256Hex(pkceChallenge) !== input.authorizationCode.pkceChallengeHash) errors.push('pkce-challenge-mismatch');
  if (Date.parse(input.authorizationCode.expiresAt) <= Date.parse(now)) errors.push('authorization-code-expired');

  const status: VeygritIdTokenExchange['status'] = errors.includes('authorization-code-expired')
    ? 'expired'
    : errors.length > 0
      ? 'blocked'
      : 'issued';
  const authTime = validIsoOrDefault(input.authTime, input.authorizationCode.issuedAt);
  const accessTokenRef = compactHash({
    codeHash: input.authorizationCode.codeHash,
    clientId: input.authorizationCode.clientId,
    now,
    kind: 'access',
  }, 'vey_access_token');
  const idTokenRef = compactHash({
    codeHash: input.authorizationCode.codeHash,
    pairwiseSubjectAlias: input.authorizationCode.pairwiseSubjectAlias,
    nonceHash: input.authorizationCode.nonceHash,
    kind: 'id',
  }, 'vey_id_token');
  const addressCredentialRef = input.authorizationCode.claimKinds.some(kind => kind.includes('address') || kind === 'hotel-delivery')
    ? compactHash({
      grantId: input.authorizationCode.grantId,
      selectedAddressId: input.authorizationCode.selectedAddressId,
      claimKinds: input.authorizationCode.claimKinds,
    }, 'address_credential')
    : undefined;

  return {
    modelVersion: VEYGRIT_ID_VERSION,
    status,
    tokenType: 'bearer-ref',
    ...(status === 'issued' ? { accessTokenRef } : {}),
    ...(status === 'issued' ? { idTokenRef } : {}),
    ...(status === 'issued' && addressCredentialRef ? { addressCredentialRef } : {}),
    walletSessionRef: input.authorizationCode.walletSessionRef,
    pairwiseSubjectAlias: input.authorizationCode.pairwiseSubjectAlias,
    expiresInSeconds: status === 'issued'
      ? Math.max(1, Math.min(600, Math.floor((Date.parse(input.authorizationCode.expiresAt) - Date.parse(now)) / 1000)))
      : 0,
    claims: {
      iss: 'https://id.veygrit.example',
      aud: input.authorizationCode.clientId,
      sub: input.authorizationCode.pairwiseSubjectAlias,
      nonceHash: input.authorizationCode.nonceHash,
      authTime,
      scopeRefs: input.authorizationCode.approvedScopes,
      claimKinds: input.authorizationCode.claimKinds,
    },
    errors: unique(errors),
    warnings: [...input.authorizationCode.warnings],
    privacy: {
      rawAccessTokenLogged: false,
      rawIdTokenLogged: false,
      rawAddressIncluded: false,
      refreshTokenIssued: false,
    },
  };
}

export function buildVeygritIdGuestCheckoutHandoff(input: {
  tokenExchange: VeygritIdTokenExchange;
  grant: VeygritIdConsentGrant;
  partner: VeygritIdPartnerApplication;
  orderRef?: unknown;
}): VeygritIdGuestCheckoutHandoff {
  const errors: string[] = [];
  const warnings: string[] = [...input.tokenExchange.warnings, ...input.grant.warnings];
  const orderRef = clean(input.orderRef, 120);

  if (input.tokenExchange.status !== 'issued') errors.push('token-exchange-not-issued');
  if (input.grant.status !== 'ready-to-fill') errors.push('grant-not-ready-for-guest-checkout');
  if (input.partner.status !== 'approved') errors.push('partner-not-approved');
  if (input.tokenExchange.claims.aud !== input.partner.clientId) errors.push('token-audience-client-mismatch');
  if (input.grant.clientId !== input.partner.clientId) errors.push('grant-client-mismatch');
  if (!input.tokenExchange.addressCredentialRef) errors.push('address-credential-ref-required');
  if (!input.grant.approvedScopes.some(scope => scope === 'address.shipping' || scope === 'address.billing' || scope === 'hotel.delivery' || scope === 'temporary.address')) {
    errors.push('address-scope-required-for-guest-checkout');
  }
  if (hasForbiddenValue({ orderRef })) errors.push('guest-checkout-order-ref-private-material-not-allowed');
  if (input.partner.siteCategory !== 'ec') warnings.push('guest-checkout-partner-is-not-ec-category');

  const status: VeygritIdGuestCheckoutHandoff['status'] = errors.length > 0 ? 'blocked' : 'ready';
  const nextAction: VeygritIdGuestCheckoutHandoff['nextAction'] = status === 'ready'
    ? 'create-guest-order'
    : errors.some(error => /token/.test(error))
      ? 'repair-token-exchange'
      : errors.some(error => /grant|address/.test(error))
        ? 'request-address-consent'
        : 'deny';
  const walletConsentRef = compactHash({
    grantId: input.grant.grantId,
    clientId: input.partner.clientId,
    partnerId: input.partner.partnerId,
  }, 'wallet_consent');
  const guestCheckoutAlias = compactHash({
    pairwiseSubjectAlias: input.tokenExchange.pairwiseSubjectAlias,
    walletConsentRef,
    orderRefHash: orderRef ? sha256Hex(orderRef) : undefined,
  }, 'vey_guest_checkout');
  const carrierHandoffRef = input.tokenExchange.addressCredentialRef
    ? compactHash({
      guestCheckoutAlias,
      addressCredentialRef: input.tokenExchange.addressCredentialRef,
      partnerId: input.partner.partnerId,
    }, 'carrier_handoff')
    : undefined;

  return {
    modelVersion: VEYGRIT_ID_VERSION,
    mode: 'ec-guest-checkout',
    status,
    nextAction,
    partnerId: input.partner.partnerId,
    clientId: input.partner.clientId ?? input.grant.clientId,
    pairwiseSubjectAlias: input.tokenExchange.pairwiseSubjectAlias,
    guestCheckoutAlias,
    walletSessionRef: input.tokenExchange.walletSessionRef,
    walletConsentRef,
    ...(status === 'ready' && input.tokenExchange.addressCredentialRef ? { addressCredentialRef: input.tokenExchange.addressCredentialRef } : {}),
    ...(status === 'ready' && carrierHandoffRef ? { carrierHandoffRef } : {}),
    scopeRefs: input.tokenExchange.claims.scopeRefs,
    claimKinds: input.tokenExchange.claims.claimKinds,
    merchantAccountCreationRequired: false,
    ecPasswordRequired: false,
    walletLoginRequired: true,
    ttlSeconds: status === 'ready' ? Math.max(1, Math.min(600, input.tokenExchange.expiresInSeconds)) : 0,
    errors: unique(errors),
    warnings: unique(warnings),
    privacy: {
      rawAddressSharedWithMerchant: false,
      rawPhoneSharedWithMerchant: false,
      globalSubjectIdExposedToMerchant: false,
      merchantCanCreateAccountSilently: false,
      carrierCredentialsSharedWithMerchant: false,
      oneTimeUse: true,
    },
  };
}

export function revokeVeygritIdConnection(input: {
  account: VeygritIdAccount;
  partner: VeygritIdPartnerApplication;
  grant?: VeygritIdConsentGrant;
  reason?: VeygritIdConnectionRevocation['reason'];
  now?: unknown;
}): VeygritIdConnectionRevocation {
  const revokedAt = validIsoOrDefault(input.now);
  const pairwise = buildVeygritIdPairwiseSubjectAlias({ account: input.account, partner: input.partner });

  return {
    modelVersion: VEYGRIT_ID_VERSION,
    revocationRef: compactHash({
      subjectId: input.account.subjectId,
      partnerId: input.partner.partnerId,
      grantId: input.grant?.grantId,
      revokedAt,
    }, 'vey_revocation'),
    subjectId: input.account.subjectId,
    partnerId: input.partner.partnerId,
    clientId: pairwise.clientId,
    pairwiseSubjectAlias: pairwise.pairwiseSubjectAlias,
    ...(input.grant?.grantId ? { revokedGrantId: input.grant.grantId } : {}),
    revokedAt,
    reason: input.reason ?? 'user-disconnect',
    merchantDeletionRefs: [
      'pairwiseSubjectAlias',
      'walletConsentRef',
      'addressCredentialRef',
      'carrierHandoffRef',
    ],
    walletEffects: [
      'invalidate-active-consents-for-partner',
      'stop-address-autofill-for-client',
      'reject-stale-carrier-handoff-refs',
      'record-user-visible-revocation-receipt',
    ],
    nextAction: 'notify-merchant-and-invalidate-refs',
    privacy: {
      rawAddressRevealedDuringRevocation: false,
      merchantCanContinuePullingAddress: false,
    },
  };
}

export function buildVeygritIdIntegrationPlan(): VeygritIdIntegrationPlan {
  return {
    modelVersion: VEYGRIT_ID_VERSION,
    packageName: '@veygrit/id',
    buttonLabel: 'Veygritで住所入力',
    accountCreationProviders: ['google', 'apple'],
    components: [
      '<VeygritSignIn />',
      '<VeygritAddressButton />',
      '<VeygritGuestCheckoutButton />',
      '<VeygritConsentDialog />',
      '<VeygritConnectedSites />',
      '<VeygritConnectionRevocation />',
    ],
    backendEndpoints: [
      'GET /.well-known/veygrit-client.json',
      'POST /veygrit/oauth/callback',
      'POST /veygrit/oauth/token',
      'POST /veygrit/address-fill/exchange',
      'POST /veygrit/guest-checkout/handoff',
      'POST /veygrit/connections/revoke',
      'POST /veygrit/webhooks',
    ],
    requiredPartnerGates: [
      '法人確認',
      'KYB',
      'ドメイン確認',
      'HTTPS',
      'プライバシーポリシー審査',
      '利用目的とscope審査',
      '不正/詐欺リスク審査',
    ],
    recommendedFlow: [
      'Partner applies and receives reviewed client_id',
      'Site renders Vey ID address-fill button',
      'User creates or opens a Vey ID account with Google or Apple only',
      'Vey ID creates a wallet session and pairwise subject alias for that EC client',
      'Veygrit shows requested scopes and selected address/profile',
      'Sensitive scopes require fresh reauthentication',
      'Veygrit issues authorizationCodeRef and exchanges it with PKCE for token refs',
      'Veygrit posts sealed claims to registered redirect URI',
      'For EC guest checkout, merchant creates an order from guestCheckoutAlias and addressCredentialRef without creating an EC account',
      'User can revoke, export, or delete the connection in Veygrit Portal',
    ],
    notes: [
      'Do not offer email/password, phone-only, or passkey-only account creation.',
      'Guest checkout means no EC account/password is required; Veygrit wallet login and consent still happen.',
      'Do not allow unreviewed personal sites to embed the button.',
      'Do not log plaintext address, phone, passport name, or travel profile claims.',
      'Use OAuth/OIDC state and nonce concepts for request integrity.',
      'Treat address autofill as consented data delivery, not as public profile sharing.',
    ],
  };
}

export function validateVeygritIdGrant(grant: VeygritIdConsentGrant) {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (grant.modelVersion !== VEYGRIT_ID_VERSION) errors.push('veygrit-id-version-mismatch');
  if (grant.privacy.rawAddressLogged !== false) errors.push('raw-address-logged');
  if (grant.privacy.rawTravelNameLogged !== false) errors.push('raw-travel-name-logged');
  if (grant.privacy.rawPhoneLogged !== false) errors.push('raw-phone-logged');
  if (grant.privacy.merchantCanPullWithoutUserConsent !== false) errors.push('merchant-pull-without-consent');
  if (grant.sealedClaimEnvelope.loggedPlaintext !== false) errors.push('sealed-claim-plaintext-logged');
  if (grant.sealedClaimEnvelope.ttlSeconds > 600) warnings.push('sealed-claim-ttl-longer-than-ten-minutes');

  const publicText = [
    grant.grantId,
    grant.partnerId,
    grant.clientId,
    grant.subjectId,
    grant.selectedAddressId,
    grant.sealedClaimEnvelope.envelopeId,
    grant.sealedClaimEnvelope.redirectUri,
    ...grant.errors,
    ...grant.warnings,
  ].filter(Boolean).join('\n');
  if (PRIVATE_VALUE_RE.test(publicText)) errors.push('veygrit-id-public-surface-contains-private-token');

  return {
    ok: errors.length === 0 && grant.status === 'ready-to-fill',
    errors,
    warnings,
    auditRef: compactHash({
      grantId: grant.grantId,
      status: grant.status,
      scopes: grant.approvedScopes,
      claimKinds: grant.claimKinds,
    }, 'veygrit_id_audit'),
  };
}
