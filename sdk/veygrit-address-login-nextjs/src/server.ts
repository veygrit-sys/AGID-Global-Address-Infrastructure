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

export type AddressLoginNextAction =
  | 'continue_checkout'
  | 'carrier_handoff'
  | 'manual_review'
  | 'request_consent_again'
  | 'deny';

export type AddressLoginCallbackPayload = {
  code?: string;
  state?: string;
  issuer?: string;
  sessionRef?: string;
  credentialRef?: string;
  proofBundleRef?: string;
  encryptedAddressForCarrierRef?: string;
  error?: string;
  errorDescription?: string;
  result?: AddressLoginVerifiedResult;
};

export type AddressLoginVerifiedResult = {
  status: 'approved' | 'needs_review' | 'denied' | 'expired';
  subjectAlias: string;
  consentEnvelopeId: string;
  credentialRef?: string;
  proofBundleRef?: string;
  publicClaims: Partial<Record<AddressLoginClaim, boolean | string | number>>;
  encryptedAddressForCarrierRef?: string;
  safeDisplayLines: string[];
  warnings: string[];
  nextAction: AddressLoginNextAction;
};

export type VerifyAddressLoginCallbackOptions = {
  requiredClaims?: AddressLoginClaim[];
  expectedState?: string;
  allowedIssuer?: string;
  exchangeCode?: (code: string, payload: AddressLoginCallbackPayload) => Promise<AddressLoginVerifiedResult> | AddressLoginVerifiedResult;
};

export type AddressLoginRouteHandlerOptions = VerifyAddressLoginCallbackOptions & {
  onVerified?: (result: AddressLoginVerifiedResult) => Promise<Response | Record<string, unknown>> | Response | Record<string, unknown>;
};

export type VeygritWebhookPayload = {
  id: string;
  type: string;
  createdAt: string;
  data: Record<string, unknown>;
};

export type VerifyVeygritWebhookOptions = {
  signatureHeader?: string;
  timestampHeader?: string;
  verifySignature?: (payloadText: string, signatureHeader: string) => Promise<boolean> | boolean;
  allowUnsignedSandbox?: boolean;
  hmac?: VerifyVeygritWebhookHmacOptions;
  eventIdStore?: VeygritWebhookEventIdStore;
};

export type VeygritWebhookEventIdStore = {
  has: (eventId: string) => Promise<boolean> | boolean;
  add: (eventId: string) => Promise<void> | void;
};

export type VeygritWebhookSigningKey = {
  signingSecret: string;
  status?: 'active' | 'retired';
  notBefore?: string | number | Date;
  notAfter?: string | number | Date;
};

export type VerifyVeygritWebhookHmacOptions = {
  signingSecret?: string;
  signingSecrets?: Record<string, string>;
  signingKeys?: Record<string, VeygritWebhookSigningKey>;
  keyId?: string;
  timestampHeader?: string;
  toleranceSeconds?: number;
  now?: Date | number;
};

export type CreateVeygritWebhookHmacSignatureOptions = {
  signingSecret: string;
  keyId?: string;
  timestampHeader: string;
};

export type FriendDeliveryRequestInput = {
  purchaserSubjectAlias: string;
  friendAlias: string;
  cartRef: string;
  purpose?: 'anonymous_shipping';
  requestedClaims?: AddressLoginClaim[];
  disclosureMode?: 'carrier_decryptable';
  requestedAt?: string;
};

export type FriendDeliveryRequestPayload = {
  purchaserSubjectAlias: string;
  friendAlias: string;
  cartRef: string;
  purpose: 'anonymous_shipping';
  requestedClaims: AddressLoginClaim[];
  disclosureMode: 'carrier_decryptable';
  requestedAt: string;
};

export type FriendDeliveryRequestResult = {
  friendDeliveryRequestRef: string;
  status: 'pending_recipient_approval';
  consentRequestRef: string;
  notificationRef: string;
  publicClaims: Partial<Record<AddressLoginClaim, boolean | string | number>>;
  expiresAt: string;
  warnings: string[];
};

export type FriendDeliveryApprovalInput = {
  friendDeliveryRequestRef: string;
  approvalRef: string;
  selectedAddressRef: string;
  consentEnvelopeRef: string;
  approvedClaims?: AddressLoginClaim[];
  approvedAt?: string;
};

export type FriendDeliveryApprovalPayload = {
  friendDeliveryRequestRef: string;
  approvalRef: string;
  selectedAddressRef: string;
  consentEnvelopeRef: string;
  approvedClaims: AddressLoginClaim[];
  approvedAt: string;
};

export type FriendDeliveryApprovalResult = {
  approvalRef: string;
  status: 'approved';
  friendDeliveryRequestRef: string;
  consentEnvelopeRef: string;
  encryptedAddressForCarrierRef: string;
  publicClaims: Partial<Record<AddressLoginClaim, boolean | string | number>>;
  warnings: string[];
};

export type VeyIdCallbackPayload = {
  authorizationCodeRef?: string;
  state?: string;
  issuer?: string;
  pairwiseSubjectAlias?: string;
  walletSessionRef?: string;
  error?: string;
  errorDescription?: string;
};

export type VeyIdTokenRequestInput = {
  authorizationCodeRef: string;
  clientId: string;
  redirectUri: string;
  pkceVerifier: string;
};

export type VeyIdTokenRequestPayload = VeyIdTokenRequestInput & {
  grantType: 'authorization_code';
};

export type VeyIdPairwiseClaims = {
  iss: 'https://id.veygrit.example';
  sub: string;
  aud: string;
  authTime: string;
  addressWalletLinked: boolean;
};

export type VeyIdTokenExchangeResult = {
  status: 'issued' | 'blocked';
  tokenType: 'bearer-ref';
  accessTokenRef: string;
  idTokenRef: string;
  addressCredentialRef?: string;
  expiresAt: string;
  claims: VeyIdPairwiseClaims;
  privacy: {
    rawAddressExposed: false;
    providerIdTokenStored: false;
    providerAccessTokenStored: false;
    providerRefreshTokenStored: false;
    rawProviderProfileStored: false;
    proofSecretExposed: false;
  };
  warnings?: string[];
  errors?: string[];
};

export type VeyIdConnectionRevocationInput = {
  clientId: string;
  pairwiseSubjectAlias: string;
  walletConsentRef?: string;
  reason?: 'user_wallet_unlink' | 'merchant_disconnect' | 'account_close' | 'security_event';
};

export type VeyIdConnectionRevocationPayload = Required<Pick<VeyIdConnectionRevocationInput, 'clientId' | 'pairwiseSubjectAlias' | 'reason'>> &
  Omit<VeyIdConnectionRevocationInput, 'clientId' | 'pairwiseSubjectAlias' | 'reason'>;

export type VeyIdConnectionRevocationResult = {
  status: 'revoked' | 'blocked';
  revocationRef: string;
  pairwiseSubjectAlias: string;
  merchantDeletionRefs: Array<'pairwiseSubjectAlias' | 'walletConsentRef' | 'addressCredentialRef' | 'carrierHandoffRef'>;
  walletEffects: string[];
  privacy: VeyIdTokenExchangeResult['privacy'];
  warnings?: string[];
  errors?: string[];
};

export type VeyIdGuestCheckoutHandoffInput = {
  clientId: string;
  pairwiseSubjectAlias: string;
  walletConsentRef: string;
  addressCredentialRef: string;
  accessTokenRef: string;
  orderRef?: string;
};

export type VeyIdGuestCheckoutHandoffPayload = VeyIdGuestCheckoutHandoffInput;

export type VeyIdGuestCheckoutHandoffResult = {
  mode: 'ec-guest-checkout';
  status: 'ready' | 'blocked';
  nextAction: 'create-guest-order' | 'repair-token-exchange' | 'request-address-consent' | 'deny';
  guestCheckoutAlias: string;
  walletConsentRef: string;
  addressCredentialRef: string;
  carrierHandoffRef: string;
  merchantAccountCreationRequired: false;
  ecPasswordRequired: false;
  walletLoginRequired: true;
  ttlSeconds: number;
  privacy: {
    rawAddressSharedWithMerchant: false;
    rawPhoneSharedWithMerchant: false;
    globalSubjectIdExposedToMerchant: false;
    merchantCanCreateAccountSilently: false;
    carrierCredentialsSharedWithMerchant: false;
    oneTimeUse: true;
  };
  warnings?: string[];
  errors?: string[];
};

export type FriendDeliveryTransportRequest<TPayload> = {
  method: 'POST';
  url: string;
  headers: Record<string, string>;
  payload: TPayload;
};

export type FriendDeliveryTransport<TPayload, TResult> = (
  request: FriendDeliveryTransportRequest<TPayload>,
) => Promise<TResult> | TResult;

export type FriendDeliveryServerOptions<TPayload, TResult> = {
  apiBaseUrl?: string;
  serverAccessToken: string;
  transport: FriendDeliveryTransport<TPayload, TResult>;
};

export type VeyIdServerTransportRequest<TPayload> = {
  method: 'POST';
  url: string;
  headers: Record<string, string>;
  payload: TPayload;
};

export type VeyIdServerTransport<TPayload, TResult> = (
  request: VeyIdServerTransportRequest<TPayload>,
) => Promise<TResult> | TResult;

export type VeyIdServerOptions<TPayload, TResult> = {
  apiBaseUrl?: string;
  serverAccessToken: string;
  transport: VeyIdServerTransport<TPayload, TResult>;
};

const FORBIDDEN_FIELD_PATTERN = /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret|provider.?id.?token|provider.?access.?token|provider.?refresh.?token|raw.?provider.?profile|carrier.?api.?key|production.?credential/i;
const DEFAULT_FRIEND_DELIVERY_CLAIMS: AddressLoginClaim[] = ['deliverable', 'not_revoked', 'freshness', 'carrier_decryptable_address'];
const DEFAULT_HOSTED_API_BASE_URL = 'https://login.veygrit.example/api/veygrit/address-login';
const DEFAULT_VEY_ID_API_BASE_URL = 'https://login.veygrit.example';
const DEFAULT_WEBHOOK_REPLAY_TOLERANCE_SECONDS = 300;

export function parseAddressLoginCallback(
  input: string | URL | URLSearchParams,
  options: Pick<VerifyAddressLoginCallbackOptions, 'expectedState' | 'allowedIssuer'> = {},
): AddressLoginCallbackPayload {
  const params = toSearchParams(input);
  assertNoForbiddenSearchParams(params);

  const payload: AddressLoginCallbackPayload = {
    code: params.get('code') ?? undefined,
    state: params.get('state') ?? undefined,
    issuer: params.get('iss') ?? params.get('issuer') ?? undefined,
    sessionRef: params.get('session_ref') ?? undefined,
    credentialRef: params.get('credential_ref') ?? undefined,
    proofBundleRef: params.get('proof_bundle_ref') ?? params.get('proof_ref') ?? undefined,
    encryptedAddressForCarrierRef: params.get('carrier_handoff_ref') ?? params.get('handoff_ref') ?? undefined,
    error: params.get('error') ?? undefined,
    errorDescription: params.get('error_description') ?? undefined,
  };

  assertExpectedStateAndIssuer(payload, options);
  if (!payload.error && !payload.code) {
    throw new Error('Address Login callback is missing authorization code.');
  }
  return payload;
}

export function parseVeyIdCallback(
  input: string | URL | URLSearchParams,
  options: Pick<VerifyAddressLoginCallbackOptions, 'expectedState' | 'allowedIssuer'> = {},
): VeyIdCallbackPayload {
  const params = toSearchParams(input);
  assertNoForbiddenSearchParams(params);

  const payload: VeyIdCallbackPayload = {
    authorizationCodeRef: params.get('authorization_code_ref') ?? params.get('code') ?? undefined,
    state: params.get('state') ?? undefined,
    issuer: params.get('iss') ?? params.get('issuer') ?? undefined,
    pairwiseSubjectAlias: params.get('pairwise_subject_alias') ?? undefined,
    walletSessionRef: params.get('wallet_session_ref') ?? undefined,
    error: params.get('error') ?? undefined,
    errorDescription: params.get('error_description') ?? undefined,
  };

  assertExpectedVeyIdStateAndIssuer(payload, options);
  return payload;
}

export async function verifyAddressLoginCallback(
  request: Request | AddressLoginCallbackPayload,
  options: VerifyAddressLoginCallbackOptions = {},
): Promise<AddressLoginVerifiedResult> {
  const payload = await readCallbackPayload(request);
  assertNoForbiddenFields(payload);

  assertExpectedStateAndIssuer(payload, options);

  if (payload.error) {
    throw new Error(`Address Login callback error: ${payload.errorDescription ?? payload.error}`);
  }

  const result = payload.result ?? (payload.code ? await options.exchangeCode?.(payload.code, payload) : undefined);
  if (!result) {
    throw new Error('Address Login callback requires a redacted result or an explicit exchangeCode handler.');
  }

  assertNoForbiddenFields(result);
  requireAddressClaims(result, options.requiredClaims ?? []);
  return result;
}

export function requireAddressClaims(
  result: AddressLoginVerifiedResult,
  requiredClaims: AddressLoginClaim[],
): AddressLoginVerifiedResult {
  const missing = requiredClaims.filter(claim => result.publicClaims[claim] !== true);
  if (missing.length > 0) {
    throw new Error(`Address Login callback is missing required claims: ${missing.join(', ')}`);
  }
  return result;
}

export function createAddressLoginRouteHandler(options: AddressLoginRouteHandlerOptions = {}) {
  return async function addressLoginRouteHandler(request: Request): Promise<Response> {
    const result = await verifyAddressLoginCallback(request, options);
    const response = await options.onVerified?.(result);

    if (response instanceof Response) {
      return response;
    }

    return Response.json(
      response ?? {
        subjectAlias: result.subjectAlias,
        publicClaims: result.publicClaims,
        proofBundleRef: result.proofBundleRef,
        encryptedAddressForCarrierRef: result.encryptedAddressForCarrierRef,
        nextAction: result.nextAction,
      },
    );
  };
}

export function createAddressLoginRouteHandlers(options: AddressLoginRouteHandlerOptions = {}) {
  const handler = createAddressLoginRouteHandler(options);
  return {
    GET: handler,
    POST: handler,
  };
}

export async function verifyVeygritWebhook(
  request: Request,
  options: VerifyVeygritWebhookOptions = {},
): Promise<VeygritWebhookPayload> {
  const payloadText = await request.text();
  const signatureHeader = options.signatureHeader
    ?? request.headers.get('x-veygrit-signature')
    ?? request.headers.get('veygrit-signature')
    ?? '';
  const timestampHeader = options.timestampHeader
    ?? request.headers.get('x-veygrit-timestamp')
    ?? request.headers.get('veygrit-timestamp')
    ?? '';

  if (!options.allowUnsignedSandbox) {
    if (!signatureHeader) {
      throw new Error('Veygrit webhook signature is required.');
    }
    const valid = options.hmac
      ? await verifyVeygritWebhookHmac(payloadText, signatureHeader, {
        ...options.hmac,
        timestampHeader: options.hmac.timestampHeader || timestampHeader,
      })
      : await options.verifySignature?.(payloadText, signatureHeader);
    if (valid !== true) {
      throw new Error('Veygrit webhook signature verification failed.');
    }
  }

  const payload = JSON.parse(payloadText) as VeygritWebhookPayload;
  assertNoForbiddenFields(payload);
  await rejectDuplicateWebhookEvent(payload.id, options.eventIdStore);
  return payload;
}

export async function createVeygritWebhookHmacSignature(
  payloadText: string,
  options: CreateVeygritWebhookHmacSignatureOptions,
): Promise<string> {
  assertSafeSigningOptions(options.signingSecret, options.timestampHeader);
  const digest = await hmacSha256Hex(options.signingSecret, webhookSigningPayload(payloadText, options.timestampHeader));
  return options.keyId ? `kid=${options.keyId},v1=${digest}` : `v1=${digest}`;
}

export async function verifyVeygritWebhookHmac(
  payloadText: string,
  signatureHeader: string,
  options: VerifyVeygritWebhookHmacOptions,
): Promise<boolean> {
  const timestampHeader = options.timestampHeader;
  if (!signatureHeader || !timestampHeader) {
    return false;
  }

  const parsedSignature = parseWebhookSignatureHeader(signatureHeader);
  const keyId = options.keyId ?? parsedSignature.keyId;
  const signingKey = resolveWebhookSigningKey(options, keyId);
  if (!signingKey || !parsedSignature.v1 || !webhookSigningKeyAllowsTimestamp(signingKey, timestampHeader)) {
    return false;
  }

  const signingSecret = signingKey.signingSecret;
  assertSafeSigningOptions(signingSecret, timestampHeader);
  if (!timestampWithinTolerance(timestampHeader, options.now, options.toleranceSeconds)) {
    return false;
  }

  const expected = await createVeygritWebhookHmacSignature(payloadText, {
    signingSecret,
    keyId,
    timestampHeader,
  });
  return safeEqual(parsedSignature.v1, parseWebhookSignatureHeader(expected).v1);
}

export function createFriendDeliveryRequestPayload(input: FriendDeliveryRequestInput): FriendDeliveryRequestPayload {
  const payload: FriendDeliveryRequestPayload = {
    purchaserSubjectAlias: requiredText(input.purchaserSubjectAlias, 'purchaserSubjectAlias'),
    friendAlias: requiredText(input.friendAlias, 'friendAlias'),
    cartRef: requiredText(input.cartRef, 'cartRef'),
    purpose: input.purpose ?? 'anonymous_shipping',
    requestedClaims: input.requestedClaims ?? DEFAULT_FRIEND_DELIVERY_CLAIMS,
    disclosureMode: input.disclosureMode ?? 'carrier_decryptable',
    requestedAt: input.requestedAt ?? new Date().toISOString(),
  };

  assertNoForbiddenPublicValues(payload);
  return payload;
}

export function createFriendDeliveryApprovalPayload(input: FriendDeliveryApprovalInput): FriendDeliveryApprovalPayload {
  const payload: FriendDeliveryApprovalPayload = {
    friendDeliveryRequestRef: requiredText(input.friendDeliveryRequestRef, 'friendDeliveryRequestRef'),
    approvalRef: requiredText(input.approvalRef, 'approvalRef'),
    selectedAddressRef: requiredText(input.selectedAddressRef, 'selectedAddressRef'),
    consentEnvelopeRef: requiredText(input.consentEnvelopeRef, 'consentEnvelopeRef'),
    approvedClaims: input.approvedClaims ?? DEFAULT_FRIEND_DELIVERY_CLAIMS,
    approvedAt: input.approvedAt ?? new Date().toISOString(),
  };

  assertNoForbiddenPublicValues(payload);
  return payload;
}

export function buildFriendDeliveryRequestUrl(apiBaseUrl = DEFAULT_HOSTED_API_BASE_URL): string {
  return `${apiBaseUrl.replace(/\/+$/, '')}/friend-delivery/requests`;
}

export function buildFriendDeliveryApprovalUrl(apiBaseUrl = DEFAULT_HOSTED_API_BASE_URL): string {
  return `${apiBaseUrl.replace(/\/+$/, '')}/friend-delivery/approvals`;
}

export function createVeyIdTokenRequestPayload(input: VeyIdTokenRequestInput): VeyIdTokenRequestPayload {
  const payload: VeyIdTokenRequestPayload = {
    grantType: 'authorization_code',
    authorizationCodeRef: requiredVeyIdText(input.authorizationCodeRef, 'authorizationCodeRef'),
    clientId: requiredVeyIdText(input.clientId, 'clientId'),
    redirectUri: requiredVeyIdText(input.redirectUri, 'redirectUri'),
    pkceVerifier: requiredVeyIdText(input.pkceVerifier, 'pkceVerifier'),
  };
  assertNoForbiddenPublicValues(payload);
  return payload;
}

export function createVeyIdConnectionRevocationPayload(
  input: VeyIdConnectionRevocationInput,
): VeyIdConnectionRevocationPayload {
  const payload: VeyIdConnectionRevocationPayload = {
    clientId: requiredVeyIdText(input.clientId, 'clientId'),
    pairwiseSubjectAlias: requiredVeyIdText(input.pairwiseSubjectAlias, 'pairwiseSubjectAlias'),
    walletConsentRef: input.walletConsentRef,
    reason: input.reason ?? 'user_wallet_unlink',
  };
  assertNoForbiddenPublicValues(payload);
  return payload;
}

export function createVeyIdGuestCheckoutHandoffPayload(
  input: VeyIdGuestCheckoutHandoffInput,
): VeyIdGuestCheckoutHandoffPayload {
  const payload: VeyIdGuestCheckoutHandoffPayload = {
    clientId: requiredVeyIdText(input.clientId, 'clientId'),
    pairwiseSubjectAlias: requiredVeyIdText(input.pairwiseSubjectAlias, 'pairwiseSubjectAlias'),
    walletConsentRef: requiredVeyIdText(input.walletConsentRef, 'walletConsentRef'),
    addressCredentialRef: requiredVeyIdText(input.addressCredentialRef, 'addressCredentialRef'),
    accessTokenRef: requiredVeyIdText(input.accessTokenRef, 'accessTokenRef'),
    ...(input.orderRef ? { orderRef: requiredVeyIdText(input.orderRef, 'orderRef') } : {}),
  };
  assertNoForbiddenPublicValues(payload);
  return payload;
}

export function buildVeyIdTokenUrl(apiBaseUrl = DEFAULT_VEY_ID_API_BASE_URL): string {
  return `${apiBaseUrl.replace(/\/+$/, '')}/veygrit/oauth/token`;
}

export function buildVeyIdGuestCheckoutHandoffUrl(apiBaseUrl = DEFAULT_VEY_ID_API_BASE_URL): string {
  return `${apiBaseUrl.replace(/\/+$/, '')}/veygrit/guest-checkout/handoff`;
}

export function buildVeyIdConnectionRevocationUrl(apiBaseUrl = DEFAULT_VEY_ID_API_BASE_URL): string {
  return `${apiBaseUrl.replace(/\/+$/, '')}/veygrit/connections/revoke`;
}

export async function exchangeVeyIdAuthorizationCode<TResult = VeyIdTokenExchangeResult>(
  input: VeyIdTokenRequestInput,
  options: VeyIdServerOptions<VeyIdTokenRequestPayload, TResult>,
): Promise<TResult> {
  return options.transport({
    method: 'POST',
    url: buildVeyIdTokenUrl(options.apiBaseUrl),
    headers: veyIdServerHeaders(options.serverAccessToken),
    payload: createVeyIdTokenRequestPayload(input),
  });
}

export async function createVeyIdGuestCheckoutHandoff<TResult = VeyIdGuestCheckoutHandoffResult>(
  input: VeyIdGuestCheckoutHandoffInput,
  options: VeyIdServerOptions<VeyIdGuestCheckoutHandoffPayload, TResult>,
): Promise<TResult> {
  return options.transport({
    method: 'POST',
    url: buildVeyIdGuestCheckoutHandoffUrl(options.apiBaseUrl),
    headers: veyIdServerHeaders(options.serverAccessToken),
    payload: createVeyIdGuestCheckoutHandoffPayload(input),
  });
}

export async function revokeVeyIdConnection<TResult = VeyIdConnectionRevocationResult>(
  input: VeyIdConnectionRevocationInput,
  options: VeyIdServerOptions<VeyIdConnectionRevocationPayload, TResult>,
): Promise<TResult> {
  return options.transport({
    method: 'POST',
    url: buildVeyIdConnectionRevocationUrl(options.apiBaseUrl),
    headers: veyIdServerHeaders(options.serverAccessToken),
    payload: createVeyIdConnectionRevocationPayload(input),
  });
}

export async function requestFriendDelivery<TResult = FriendDeliveryRequestResult>(
  input: FriendDeliveryRequestInput,
  options: FriendDeliveryServerOptions<FriendDeliveryRequestPayload, TResult>,
): Promise<TResult> {
  return options.transport({
    method: 'POST',
    url: buildFriendDeliveryRequestUrl(options.apiBaseUrl),
    headers: friendDeliveryHeaders(options.serverAccessToken),
    payload: createFriendDeliveryRequestPayload(input),
  });
}

export async function approveFriendDelivery<TResult = FriendDeliveryApprovalResult>(
  input: FriendDeliveryApprovalInput,
  options: FriendDeliveryServerOptions<FriendDeliveryApprovalPayload, TResult>,
): Promise<TResult> {
  return options.transport({
    method: 'POST',
    url: buildFriendDeliveryApprovalUrl(options.apiBaseUrl),
    headers: friendDeliveryHeaders(options.serverAccessToken),
    payload: createFriendDeliveryApprovalPayload(input),
  });
}

function resolveWebhookSigningKey(
  options: VerifyVeygritWebhookHmacOptions,
  keyId: string | undefined,
): VeygritWebhookSigningKey | undefined {
  if (options.signingSecret) {
    return { signingSecret: options.signingSecret, status: 'active' };
  }
  if (keyId && options.signingKeys?.[keyId]) {
    return options.signingKeys[keyId];
  }
  if (keyId && options.signingSecrets?.[keyId]) {
    return { signingSecret: options.signingSecrets[keyId], status: 'active' };
  }
  return undefined;
}

async function readCallbackPayload(request: Request | AddressLoginCallbackPayload): Promise<AddressLoginCallbackPayload> {
  if (!(request instanceof Request)) {
    return request;
  }

  if (request.method === 'GET') {
    return parseAddressLoginCallback(new URL(request.url));
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await request.json()) as AddressLoginCallbackPayload;
  }

  const form = await request.formData();
  assertNoForbiddenFormData(form);
  return {
    code: stringValue(form.get('code')),
    state: stringValue(form.get('state')),
  };
}

function stringValue(value: FormDataEntryValue | null): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function assertNoForbiddenFields(value: unknown, path = '$'): void {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenFields(item, `${path}[${index}]`));
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_FIELD_PATTERN.test(key)) {
      throw new Error(`Unsafe Address Login field at ${path}.${key}`);
    }
    assertNoForbiddenFields(child, `${path}.${key}`);
  }
}

function assertNoForbiddenPublicValues(value: unknown, path = '$'): void {
  if (typeof value === 'string') {
    if (FORBIDDEN_FIELD_PATTERN.test(value)) {
      throw new Error(`Unsafe Address Login public value at ${path}`);
    }
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenPublicValues(item, `${path}[${index}]`));
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_FIELD_PATTERN.test(key)) {
      throw new Error(`Unsafe Address Login field at ${path}.${key}`);
    }
    assertNoForbiddenPublicValues(child, `${path}.${key}`);
  }
}

function requiredText(value: string | undefined, fieldName: string): string {
  if (!value || !value.trim()) {
    throw new Error(`Friend Delivery ${fieldName} is required.`);
  }
  return value;
}

function requiredVeyIdText(value: string | undefined, fieldName: string): string {
  if (!value || !value.trim()) {
    throw new Error(`Vey ID ${fieldName} is required.`);
  }
  return value;
}

function friendDeliveryHeaders(serverAccessToken: string): Record<string, string> {
  if (!serverAccessToken.trim()) {
    throw new Error('Friend Delivery serverAccessToken is required.');
  }
  return {
    authorization: `Bearer ${serverAccessToken}`,
    'content-type': 'application/json',
  };
}

function veyIdServerHeaders(serverAccessToken: string): Record<string, string> {
  if (!serverAccessToken.trim()) {
    throw new Error('Vey ID serverAccessToken is required.');
  }
  return {
    authorization: `Bearer ${serverAccessToken}`,
    'content-type': 'application/json',
  };
}

function assertExpectedStateAndIssuer(
  payload: AddressLoginCallbackPayload,
  options: Pick<VerifyAddressLoginCallbackOptions, 'expectedState' | 'allowedIssuer'>,
): void {
  if (options.expectedState && payload.state !== options.expectedState) {
    throw new Error('Address Login callback state mismatch.');
  }

  if (options.allowedIssuer && payload.issuer && payload.issuer !== options.allowedIssuer) {
    throw new Error('Address Login callback issuer is not allowed.');
  }
}

function assertExpectedVeyIdStateAndIssuer(
  payload: VeyIdCallbackPayload,
  options: Pick<VerifyAddressLoginCallbackOptions, 'expectedState' | 'allowedIssuer'>,
): void {
  if (options.expectedState && payload.state !== options.expectedState) {
    throw new Error('Vey ID callback state mismatch.');
  }

  if (options.allowedIssuer && payload.issuer && payload.issuer !== options.allowedIssuer) {
    throw new Error('Vey ID callback issuer is not allowed.');
  }
}

function assertNoForbiddenSearchParams(params: URLSearchParams): void {
  for (const [key, value] of params.entries()) {
    if (FORBIDDEN_FIELD_PATTERN.test(key) || FORBIDDEN_FIELD_PATTERN.test(value)) {
      throw new Error(`Unsafe Address Login callback parameter: ${key}`);
    }
  }
}

function assertNoForbiddenFormData(form: FormData): void {
  form.forEach((value, key) => {
    if (FORBIDDEN_FIELD_PATTERN.test(key) || (typeof value === 'string' && FORBIDDEN_FIELD_PATTERN.test(value))) {
      throw new Error(`Unsafe Address Login form field: ${key}`);
    }
  });
}

function assertSafeSigningOptions(signingSecret: string, timestampHeader: string): void {
  if (!signingSecret || !timestampHeader) {
    throw new Error('Veygrit webhook HMAC requires a signing secret and timestamp.');
  }
}

async function rejectDuplicateWebhookEvent(
  eventId: string | undefined,
  eventIdStore: VeygritWebhookEventIdStore | undefined,
): Promise<void> {
  if (!eventIdStore) return;
  if (!eventId) {
    throw new Error('Veygrit webhook event id is required for idempotency.');
  }

  if (await eventIdStore.has(eventId)) {
    throw new Error('Veygrit webhook event was already processed.');
  }
  await eventIdStore.add(eventId);
}

function parseWebhookSignatureHeader(signatureHeader: string): { keyId?: string; v1: string } {
  const parts = signatureHeader.split(',').map(part => part.trim());
  return {
    keyId: parts.find(part => part.startsWith('kid='))?.slice(4),
    v1: parts.find(part => part.startsWith('v1='))?.slice(3) ?? '',
  };
}

function webhookSigningKeyAllowsTimestamp(signingKey: VeygritWebhookSigningKey, timestampHeader: string): boolean {
  if (!signingKey.signingSecret || signingKey.status === 'retired') {
    return false;
  }
  const eventTime = Number(timestampHeader) * 1000;
  if (!Number.isFinite(eventTime)) {
    return false;
  }
  const notBefore = optionalTime(signingKey.notBefore);
  const notAfter = optionalTime(signingKey.notAfter);
  if (notBefore !== undefined && eventTime < notBefore) {
    return false;
  }
  if (notAfter !== undefined && eventTime > notAfter) {
    return false;
  }
  return true;
}

function optionalTime(value: string | number | Date | undefined): number | undefined {
  if (value === undefined) return undefined;
  const time = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(time) ? time : undefined;
}

function webhookSigningPayload(payloadText: string, timestampHeader: string): string {
  return `${timestampHeader}.${payloadText}`;
}

function timestampWithinTolerance(
  timestampHeader: string,
  now: Date | number | undefined,
  toleranceSeconds = DEFAULT_WEBHOOK_REPLAY_TOLERANCE_SECONDS,
): boolean {
  const eventTime = Number(timestampHeader);
  if (!Number.isFinite(eventTime)) return false;

  const eventMs = eventTime > 9_999_999_999 ? eventTime : eventTime * 1000;
  const nowValue = now instanceof Date
    ? now.getTime()
    : typeof now === 'number'
      ? now
      : Date.now();
  return Math.abs(nowValue - eventMs) <= toleranceSeconds * 1000;
}

async function hmacSha256Hex(signingSecret: string, payload: string): Promise<string> {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new Error('Web Crypto API is required for Veygrit webhook HMAC verification.');
  }

  const encoder = new TextEncoder();
  const key = await cryptoApi.subtle.importKey(
    'raw',
    encoder.encode(signingSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await cryptoApi.subtle.sign('HMAC', key, encoder.encode(payload));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function safeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    diff |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return diff === 0;
}

function toSearchParams(input: string | URL | URLSearchParams): URLSearchParams {
  if (input instanceof URLSearchParams) {
    return input;
  }

  if (input instanceof URL) {
    return input.searchParams;
  }

  const trimmed = input.trim();
  if (trimmed.startsWith('?')) {
    return new URLSearchParams(trimmed);
  }

  try {
    return new URL(trimmed).searchParams;
  } catch {
    return new URLSearchParams(trimmed);
  }
}
