import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

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

export type AddressLoginRedirectMode = 'browser' | 'manual';

export type AddressLoginStatus =
  | 'idle'
  | 'building_authorize_url'
  | 'redirecting'
  | 'manual_url_ready'
  | 'error';

export type AddressLoginProviderConfig = {
  publishableKey: string;
  authorizeEndpoint?: string;
  veyIdAuthorizeEndpoint?: string;
  veyIdApiBaseUrl?: string;
  redirectUri?: string;
  locale?: string;
  defaultCountryHints?: string[];
  sandbox?: boolean;
};

export type VeygritProviderProps = AddressLoginProviderConfig & {
  children?: ReactNode;
};

export type AddressLoginStartOptions = {
  purpose?: AddressLoginPurpose;
  disclosureMode?: AddressLoginDisclosureMode;
  requestedClaims?: AddressLoginClaim[];
  riskLevel?: AddressLoginRiskLevel;
  redirectUri?: string;
  state?: string;
  nonce?: string;
  locale?: string;
  countryHints?: string[];
  carrierId?: string;
  walletHint?: string;
};

export type AddressLoginAuthorizeRequest = Required<
  Pick<AddressLoginStartOptions, 'purpose' | 'disclosureMode' | 'requestedClaims' | 'riskLevel' | 'state' | 'nonce'>
> &
  Omit<AddressLoginStartOptions, 'purpose' | 'disclosureMode' | 'requestedClaims' | 'riskLevel' | 'state' | 'nonce'> & {
    publishableKey: string;
    authorizeEndpoint: string;
  };

export type AddressLoginCallbackInput = string | URL | URLSearchParams;

export type AddressLoginCallbackParseOptions = {
  expectedState?: string;
  allowedIssuer?: string;
};

export type AddressLoginAuthorizedCallback = {
  status: 'authorized';
  code: string;
  state: string;
  issuer?: string;
  sessionRef?: string;
  credentialRef?: string;
  proofRef?: string;
  handoffRef?: string;
};

export type AddressLoginErrorCallback = {
  status: 'error';
  error: string;
  errorDescription?: string;
  state?: string;
  issuer?: string;
};

export type AddressLoginCallbackResult = AddressLoginAuthorizedCallback | AddressLoginErrorCallback;

export type UseAddressLoginOptions = AddressLoginStartOptions & {
  redirectMode?: AddressLoginRedirectMode;
  onAuthorizeUrl?: (url: string, request: AddressLoginAuthorizeRequest) => void;
  onError?: (error: Error) => void;
};

export type UseAddressLoginReturn = {
  status: AddressLoginStatus;
  isReady: boolean;
  isLoading: boolean;
  authorizeUrl: string | null;
  error: Error | null;
  startAddressLogin: (overrides?: UseAddressLoginOptions) => string;
  reset: () => void;
};

export type AddressLoginButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onError'> &
  UseAddressLoginOptions & {
    label?: string;
    loadingLabel?: string;
    onAddressLoginError?: (error: Error) => void;
  };

export type VeyIdScope =
  | 'openid'
  | 'address:read'
  | 'address:autofill'
  | 'friend_delivery:request'
  | 'guest_checkout:handoff';

export type VeyIdAuthorizeOptions = {
  redirectUri?: string;
  scopes?: VeyIdScope[];
  state?: string;
  nonce?: string;
  codeChallenge: string;
  origin: string;
  loginHint?: 'google' | 'apple';
};

export type VeyIdAuthorizeRequest = Required<
  Pick<VeyIdAuthorizeOptions, 'scopes' | 'state' | 'nonce' | 'codeChallenge' | 'origin'>
> &
  Omit<VeyIdAuthorizeOptions, 'scopes' | 'state' | 'nonce' | 'codeChallenge' | 'origin'> & {
    publishableKey: string;
    authorizeEndpoint: string;
  };

export type VeyIdCallbackInput = string | URL | URLSearchParams;

export type VeyIdCallbackParseOptions = {
  expectedState?: string;
  allowedIssuer?: string;
};

export type VeyIdAuthorizedCallback = {
  status: 'authorized';
  authorizationCodeRef: string;
  state: string;
  issuer?: string;
  pairwiseSubjectAlias?: string;
  walletSessionRef?: string;
};

export type VeyIdErrorCallback = {
  status: 'error';
  error: string;
  errorDescription?: string;
  state?: string;
  issuer?: string;
};

export type VeyIdCallbackResult = VeyIdAuthorizedCallback | VeyIdErrorCallback;

export type VeyIdTokenRequestInput = {
  authorizationCodeRef: string;
  clientId: string;
  redirectUri: string;
  pkceVerifier: string;
};

export type VeyIdTokenRequestPayload = VeyIdTokenRequestInput & {
  grantType: 'authorization_code';
};

export type VeyIdConnectionRevocationInput = {
  clientId: string;
  pairwiseSubjectAlias: string;
  walletConsentRef?: string;
  reason?: 'user_wallet_unlink' | 'merchant_disconnect' | 'account_close' | 'security_event';
};

export type VeyIdConnectionRevocationPayload = Required<Pick<VeyIdConnectionRevocationInput, 'clientId' | 'pairwiseSubjectAlias' | 'reason'>> &
  Omit<VeyIdConnectionRevocationInput, 'clientId' | 'pairwiseSubjectAlias' | 'reason'>;

export type VeyIdGuestCheckoutHandoffInput = {
  clientId: string;
  pairwiseSubjectAlias: string;
  walletConsentRef: string;
  addressCredentialRef: string;
  accessTokenRef: string;
  orderRef?: string;
};

export type VeyIdGuestCheckoutHandoffPayload = VeyIdGuestCheckoutHandoffInput;

export type VeyIdGuestCheckoutHandoffPrivacy = {
  rawAddressSharedWithMerchant: false;
  rawPhoneSharedWithMerchant: false;
  globalSubjectIdExposedToMerchant: false;
  merchantCanCreateAccountSilently: false;
  carrierCredentialsSharedWithMerchant: false;
  oneTimeUse: true;
};

export type VeyIdGuestCheckoutHandoffReadyResult = {
  mode: 'ec-guest-checkout';
  status: 'ready';
  nextAction: 'create-guest-order';
  guestCheckoutAlias: string;
  walletConsentRef: string;
  addressCredentialRef: string;
  carrierHandoffRef: string;
  merchantAccountCreationRequired: false;
  ecPasswordRequired: false;
  walletLoginRequired: true;
  ttlSeconds: number;
  privacy: VeyIdGuestCheckoutHandoffPrivacy;
  warnings?: string[];
  errors?: string[];
};

export type VeyIdGuestCheckoutHandoffBlockedResult = {
  mode: 'ec-guest-checkout';
  status: 'blocked';
  nextAction: 'repair-token-exchange' | 'request-address-consent' | 'deny';
  errorCode?: 'guest_checkout_handoff_failed' | string;
  guestCheckoutAlias?: string;
  walletConsentRef?: string;
  addressCredentialRef?: string;
  carrierHandoffRef?: string;
  merchantAccountCreationRequired?: false;
  ecPasswordRequired?: false;
  walletLoginRequired?: true;
  ttlSeconds?: number;
  privacy?: VeyIdGuestCheckoutHandoffPrivacy;
  warnings?: string[];
  errors?: string[];
};

export type VeyIdGuestCheckoutHandoffResult =
  | VeyIdGuestCheckoutHandoffReadyResult
  | VeyIdGuestCheckoutHandoffBlockedResult;

export type VeyIdMerchantVisibleRedactionDisplayField =
  | 'pairwiseSubjectAlias'
  | 'guestCheckoutAlias'
  | 'walletConsentRef'
  | 'addressCredentialRef'
  | 'carrierHandoffRef';

export type VeyIdMerchantVisibleRedactionRequiredNextAction =
  | 'create-guest-order-from-refs'
  | 'request-address-wallet-consent';

export type VeyIdMerchantVisibleRedactionAffordance = {
  boundaryGateId: 'merchant-visible-redaction';
  displayFields: readonly VeyIdMerchantVisibleRedactionDisplayField[];
  displayRefs: readonly string[];
  blockedMaterial?: readonly string[];
  requiredNextAction: VeyIdMerchantVisibleRedactionRequiredNextAction;
  nonClaims?: readonly string[];
};

export type VeyIdMerchantVisibleRedactionRefs = Partial<Record<VeyIdMerchantVisibleRedactionDisplayField, string>>;

export type VeyIdMerchantVisibleRedactionDisplayRow = {
  field: VeyIdMerchantVisibleRedactionDisplayField;
  label: string;
  ref: string | null;
  status: 'visible_ref' | 'pending_wallet_consent';
};

export type VeyIdMerchantVisibleRedactionDisplayModel = {
  boundaryGateId: 'merchant-visible-redaction';
  requiredNextAction: VeyIdMerchantVisibleRedactionRequiredNextAction;
  rows: VeyIdMerchantVisibleRedactionDisplayRow[];
  visibleRefCount: number;
  blockedClassCount: number;
  nonClaimCount: number;
  consentBound: true;
};

export type GuestCheckoutHandoffTransportRequest<TPayload> = {
  url: string;
  payload: TPayload;
};

export type GuestCheckoutHandoffStatus =
  | 'idle'
  | 'creating'
  | 'ready'
  | 'blocked'
  | 'error';

export type UseGuestCheckoutHandoffOptions = {
  apiBaseUrl?: string;
  transport?: (
    request: GuestCheckoutHandoffTransportRequest<VeyIdGuestCheckoutHandoffPayload>,
  ) => Promise<VeyIdGuestCheckoutHandoffResult>;
  onError?: (error: Error) => void;
};

export type GuestCheckoutHandoffHttpTransportOptions = {
  endpoint?: string;
  fetcher?: typeof fetch;
};

export type UseGuestCheckoutHandoffReturn = {
  status: GuestCheckoutHandoffStatus;
  isLoading: boolean;
  error: Error | null;
  lastPayload: VeyIdGuestCheckoutHandoffPayload | null;
  lastResult: VeyIdGuestCheckoutHandoffResult | null;
  createGuestCheckoutHandoff: (
    input: VeyIdGuestCheckoutHandoffInput,
  ) => Promise<VeyIdGuestCheckoutHandoffResult>;
  reset: () => void;
};

export type GuestCheckoutButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onError'> &
  UseGuestCheckoutHandoffOptions & {
    input: VeyIdGuestCheckoutHandoffInput;
    label?: string;
    loadingLabel?: string;
    onGuestCheckoutReady?: (result: VeyIdGuestCheckoutHandoffResult) => void;
    onGuestCheckoutBlocked?: (result: VeyIdGuestCheckoutHandoffBlockedResult) => void;
    onGuestCheckoutError?: (error: Error) => void;
  };

const DEFAULT_GUEST_CHECKOUT_HANDOFF_ENDPOINT = '/api/veygrit/guest-checkout/handoff';

export type FriendDeliveryRequestInput = {
  purchaserSubjectAlias: string;
  friendAlias: string;
  cartRef: string;
  requestedClaims?: AddressLoginClaim[];
  requestedAt?: string;
};

export type FriendDeliveryRequestPayload = Required<
  Pick<FriendDeliveryRequestInput, 'purchaserSubjectAlias' | 'friendAlias' | 'cartRef' | 'requestedAt'>
> & {
  purpose: 'anonymous_shipping';
  requestedClaims: AddressLoginClaim[];
  disclosureMode: 'carrier_decryptable';
};

export type FriendDeliveryApprovalInput = {
  friendDeliveryRequestRef: string;
  approvalRef: string;
  selectedAddressRef: string;
  consentEnvelopeRef: string;
  approvedClaims?: AddressLoginClaim[];
  approvedAt?: string;
};

export type FriendDeliveryApprovalPayload = Required<
  Pick<
    FriendDeliveryApprovalInput,
    'friendDeliveryRequestRef' | 'approvalRef' | 'selectedAddressRef' | 'consentEnvelopeRef' | 'approvedAt'
  >
> & {
  approvedClaims: AddressLoginClaim[];
};

export type FriendDeliveryStatus =
  | 'idle'
  | 'requesting'
  | 'notified'
  | 'approving'
  | 'approved'
  | 'error';

export type FriendDeliveryRequestResult = {
  status: 'notified' | 'denied' | 'expired';
  friendDeliveryRequestRef: string;
  friendAlias: string;
  consentEnvelopeRef: string;
  notificationRef: string;
  expiresAt: string;
};

export type FriendDeliveryApprovalResult = {
  status: 'approved';
  friendDeliveryRequestRef: string;
  approvalRef: string;
  carrierHandoffRef: string;
  deliveryReceiptRef: string;
  publicClaims: Record<string, boolean | string | number>;
};

export type FriendDeliveryTransportRequest<TPayload> = {
  url: string;
  payload: TPayload;
};

export type UseFriendDeliveryOptions = {
  apiBaseUrl?: string;
  requestTransport?: (
    request: FriendDeliveryTransportRequest<FriendDeliveryRequestPayload>,
  ) => Promise<FriendDeliveryRequestResult>;
  approvalTransport?: (
    request: FriendDeliveryTransportRequest<FriendDeliveryApprovalPayload>,
  ) => Promise<FriendDeliveryApprovalResult>;
  onError?: (error: Error) => void;
};

export type UseFriendDeliveryReturn = {
  status: FriendDeliveryStatus;
  isLoading: boolean;
  error: Error | null;
  lastRequestPayload: FriendDeliveryRequestPayload | null;
  lastRequestResult: FriendDeliveryRequestResult | null;
  lastApprovalPayload: FriendDeliveryApprovalPayload | null;
  lastApprovalResult: FriendDeliveryApprovalResult | null;
  requestFriendDelivery: (input: FriendDeliveryRequestInput) => Promise<FriendDeliveryRequestResult>;
  approveFriendDelivery: (input: FriendDeliveryApprovalInput) => Promise<FriendDeliveryApprovalResult>;
  reset: () => void;
};

export type FriendDeliveryControllerSnapshot = Pick<
  UseFriendDeliveryReturn,
  | 'status'
  | 'isLoading'
  | 'error'
  | 'lastRequestPayload'
  | 'lastRequestResult'
  | 'lastApprovalPayload'
  | 'lastApprovalResult'
>;

export type FriendDeliveryController = {
  getSnapshot: () => FriendDeliveryControllerSnapshot;
  requestFriendDelivery: (input: FriendDeliveryRequestInput) => Promise<FriendDeliveryRequestResult>;
  approveFriendDelivery: (input: FriendDeliveryApprovalInput) => Promise<FriendDeliveryApprovalResult>;
  reset: () => void;
};

const DEFAULT_AUTHORIZE_ENDPOINT = 'https://login.veygrit.example/address-login/authorize';
const DEFAULT_API_BASE_URL = 'https://login.veygrit.example/api/veygrit/address-login';
const DEFAULT_VEY_ID_AUTHORIZE_ENDPOINT = 'https://login.veygrit.example/veygrit/oauth/authorize';
const DEFAULT_VEY_ID_API_BASE_URL = 'https://login.veygrit.example';
const DEFAULT_REQUESTED_CLAIMS: AddressLoginClaim[] = ['deliverable', 'not_revoked', 'freshness'];
const DEFAULT_VEY_ID_SCOPES: VeyIdScope[] = ['openid', 'address:read', 'address:autofill'];
const DEFAULT_FRIEND_DELIVERY_CLAIMS: AddressLoginClaim[] = [
  'address_credential_valid',
  'user_approved',
  'deliverable',
  'not_revoked',
  'freshness',
  'carrier_decryptable_address',
];
const MERCHANT_VISIBLE_REDACTION_FIELD_LABELS: Record<VeyIdMerchantVisibleRedactionDisplayField, string> = {
  pairwiseSubjectAlias: 'Pairwise identity',
  guestCheckoutAlias: 'Guest checkout',
  walletConsentRef: 'Wallet consent',
  addressCredentialRef: 'Address credential',
  carrierHandoffRef: 'Carrier handoff',
};
const MERCHANT_VISIBLE_REDACTION_FIELDS = new Set<VeyIdMerchantVisibleRedactionDisplayField>(
  Object.keys(MERCHANT_VISIBLE_REDACTION_FIELD_LABELS) as VeyIdMerchantVisibleRedactionDisplayField[],
);
const UNSAFE_MERCHANT_VISIBLE_REF_VALUE =
  /raw.?address|address.?line|recipient|phone|email|witness|private.?key|proof.?secret|provider.?id.?token|provider.?access.?token|provider.?refresh.?token|raw.?provider.?profile|carrier.?api.?key|production.?credential/i;

const VeygritContext = createContext<AddressLoginProviderConfig | null>(null);

export function VeygritProvider({
  children,
  publishableKey,
  authorizeEndpoint = DEFAULT_AUTHORIZE_ENDPOINT,
  veyIdAuthorizeEndpoint = DEFAULT_VEY_ID_AUTHORIZE_ENDPOINT,
  veyIdApiBaseUrl = DEFAULT_VEY_ID_API_BASE_URL,
  redirectUri,
  locale,
  defaultCountryHints = [],
  sandbox = false,
}: VeygritProviderProps): ReactElement {
  const value = useMemo(
    () => ({
      publishableKey,
      authorizeEndpoint,
      veyIdAuthorizeEndpoint,
      veyIdApiBaseUrl,
      redirectUri,
      locale,
      defaultCountryHints,
      sandbox,
    }),
    [publishableKey, authorizeEndpoint, veyIdAuthorizeEndpoint, veyIdApiBaseUrl, redirectUri, locale, defaultCountryHints, sandbox],
  );

  return createElement(VeygritContext.Provider, { value }, children);
}

export function useAddressLogin(options: UseAddressLoginOptions = {}): UseAddressLoginReturn {
  const provider = useContext(VeygritContext);
  if (!provider) {
    throw new Error('useAddressLogin must be used inside <VeygritProvider>.');
  }

  const [status, setStatus] = useState<AddressLoginStatus>('idle');
  const [authorizeUrl, setAuthorizeUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const startAddressLogin = useCallback(
    (overrides: UseAddressLoginOptions = {}) => {
      const merged = { ...options, ...overrides };

      try {
        setStatus('building_authorize_url');
        setError(null);

        const request = createAddressLoginRequest(provider, merged);
        const url = buildAddressLoginAuthorizeUrl(request);
        setAuthorizeUrl(url);
        merged.onAuthorizeUrl?.(url, request);

        if (merged.redirectMode === 'manual' || typeof window === 'undefined') {
          setStatus('manual_url_ready');
          return url;
        }

        setStatus('redirecting');
        window.location.assign(url);
        return url;
      } catch (caught) {
        const normalizedError = caught instanceof Error ? caught : new Error(String(caught));
        setError(normalizedError);
        setStatus('error');
        merged.onError?.(normalizedError);
        throw normalizedError;
      }
    },
    [provider, options],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setAuthorizeUrl(null);
    setError(null);
  }, []);

  return {
    status,
    isReady: Boolean(provider.publishableKey),
    isLoading: status === 'building_authorize_url' || status === 'redirecting',
    authorizeUrl,
    error,
    startAddressLogin,
    reset,
  };
}

export function AddressLoginButton({
  label = 'Use Address Login',
  loadingLabel = 'Opening wallet...',
  disabled,
  children,
  onClick,
  onAddressLoginError,
  className,
  purpose,
  disclosureMode,
  requestedClaims,
  riskLevel,
  redirectUri,
  state,
  nonce,
  locale,
  countryHints,
  carrierId,
  walletHint,
  redirectMode,
  onAuthorizeUrl,
  onError,
  ...buttonProps
}: AddressLoginButtonProps): ReactElement {
  const addressLogin = useAddressLogin({
    purpose,
    disclosureMode,
    requestedClaims,
    riskLevel,
    redirectUri,
    state,
    nonce,
    locale,
    countryHints,
    carrierId,
    walletHint,
    redirectMode,
    onAuthorizeUrl,
    onError: error => {
      onError?.(error);
      onAddressLoginError?.(error);
    },
  });

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) {
        return;
      }
      addressLogin.startAddressLogin();
    },
    [addressLogin, onClick],
  );

  return createElement(
    'button',
    {
      ...buttonProps,
      type: 'button',
      className,
      disabled: disabled || addressLogin.isLoading,
      onClick: handleClick,
      'data-veygrit-address-login': 'button',
      'data-veygrit-status': addressLogin.status,
    },
    children ?? (addressLogin.isLoading ? loadingLabel : label),
  );
}

export function useGuestCheckoutHandoff(
  options: UseGuestCheckoutHandoffOptions = {},
): UseGuestCheckoutHandoffReturn {
  const provider = useContext(VeygritContext);
  if (!provider) {
    throw new Error('useGuestCheckoutHandoff must be used inside <VeygritProvider>.');
  }
  assertPublishableKey(provider.publishableKey);

  const [status, setStatus] = useState<GuestCheckoutHandoffStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [lastPayload, setLastPayload] = useState<VeyIdGuestCheckoutHandoffPayload | null>(null);
  const [lastResult, setLastResult] = useState<VeyIdGuestCheckoutHandoffResult | null>(null);

  const normalizeError = useCallback(
    (caught: unknown) => {
      const normalizedError = caught instanceof Error ? caught : new Error(String(caught));
      setError(normalizedError);
      setStatus('error');
      options.onError?.(normalizedError);
      return normalizedError;
    },
    [options],
  );

  const createGuestCheckoutHandoff = useCallback(
    async (input: VeyIdGuestCheckoutHandoffInput) => {
      try {
        setStatus('creating');
        setError(null);
        const payload = createVeyIdGuestCheckoutHandoffPayload(input);
        setLastPayload(payload);
        if (!options.transport) {
          throw new Error('useGuestCheckoutHandoff requires transport to create a guest checkout handoff.');
        }
        const result = await options.transport({
          url: buildVeyIdGuestCheckoutHandoffUrl(options.apiBaseUrl ?? provider.veyIdApiBaseUrl ?? DEFAULT_VEY_ID_API_BASE_URL),
          payload,
        });
        setLastResult(result);
        setStatus(result.status === 'ready' ? 'ready' : 'blocked');
        return result;
      } catch (caught) {
        throw normalizeError(caught);
      }
    },
    [normalizeError, options, provider.veyIdApiBaseUrl],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setLastPayload(null);
    setLastResult(null);
  }, []);

  return {
    status,
    isLoading: status === 'creating',
    error,
    lastPayload,
    lastResult,
    createGuestCheckoutHandoff,
    reset,
  };
}

export function GuestCheckoutButton({
  label = 'Use wallet address',
  loadingLabel = 'Preparing checkout...',
  disabled,
  children,
  onClick,
  onGuestCheckoutReady,
  onGuestCheckoutBlocked,
  onGuestCheckoutError,
  className,
  input,
  apiBaseUrl,
  transport,
  onError,
  ...buttonProps
}: GuestCheckoutButtonProps): ReactElement {
  const guestCheckout = useGuestCheckoutHandoff({
    apiBaseUrl,
    transport,
    onError: error => {
      onError?.(error);
      onGuestCheckoutError?.(error);
    },
  });

  const handleClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) {
        return;
      }
      const result = await guestCheckout.createGuestCheckoutHandoff(input);
      if (result.status === 'ready') {
        onGuestCheckoutReady?.(result);
      } else {
        onGuestCheckoutBlocked?.(result);
      }
    },
    [guestCheckout, input, onClick, onGuestCheckoutBlocked, onGuestCheckoutReady],
  );

  return createElement(
    'button',
    {
      ...buttonProps,
      type: 'button',
      className,
      disabled: disabled || guestCheckout.isLoading,
      onClick: handleClick,
      'data-veygrit-guest-checkout': 'button',
      'data-veygrit-status': guestCheckout.status,
    },
    children ?? (guestCheckout.isLoading ? loadingLabel : label),
  );
}

export function createGuestCheckoutHandoffHttpTransport({
  endpoint = DEFAULT_GUEST_CHECKOUT_HANDOFF_ENDPOINT,
  fetcher = globalThis.fetch,
}: GuestCheckoutHandoffHttpTransportOptions = {}): NonNullable<UseGuestCheckoutHandoffOptions['transport']> {
  if (!endpoint.startsWith('/')) {
    throw new Error('Guest checkout handoff endpoint must be a same-origin relative path.');
  }
  if (!fetcher) {
    throw new Error('Guest checkout handoff transport requires fetch.');
  }

  return async ({ payload }) => {
    const response = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json() as VeyIdGuestCheckoutHandoffResult;
    if (!response.ok && result.status !== 'blocked') {
      throw new Error('Guest checkout handoff failed.');
    }
    return result;
  };
}

export function createMerchantVisibleRedactionDisplayModel(
  affordance: VeyIdMerchantVisibleRedactionAffordance,
  refs: VeyIdMerchantVisibleRedactionRefs = {},
): VeyIdMerchantVisibleRedactionDisplayModel {
  if (affordance.boundaryGateId !== 'merchant-visible-redaction') {
    throw new Error('Merchant-visible redaction display requires the merchant-visible-redaction boundary gate.');
  }

  for (const field of affordance.displayFields) {
    if (!MERCHANT_VISIBLE_REDACTION_FIELDS.has(field)) {
      throw new Error(`Unknown merchant-visible redaction display field: ${field}`);
    }
  }

  for (const field of Object.keys(refs) as VeyIdMerchantVisibleRedactionDisplayField[]) {
    if (!MERCHANT_VISIBLE_REDACTION_FIELDS.has(field)) {
      throw new Error(`Unknown merchant-visible redaction ref field: ${field}`);
    }
  }

  for (const ref of affordance.displayRefs) {
    assertSafeMerchantVisibleRef(ref);
  }

  const displayRefSet = new Set(affordance.displayRefs);
  const rows = affordance.displayFields.map(field => {
    const ref = refs[field] ?? null;
    if (ref) {
      assertSafeMerchantVisibleRef(ref);
    }
    if (ref && !displayRefSet.has(ref)) {
      throw new Error(`Merchant-visible redaction ref is not approved for display: ${field}`);
    }

    return {
      field,
      label: MERCHANT_VISIBLE_REDACTION_FIELD_LABELS[field],
      ref,
      status: ref ? 'visible_ref' : 'pending_wallet_consent',
    } satisfies VeyIdMerchantVisibleRedactionDisplayRow;
  });

  return {
    boundaryGateId: 'merchant-visible-redaction',
    requiredNextAction: affordance.requiredNextAction,
    rows,
    visibleRefCount: rows.filter(row => row.status === 'visible_ref').length,
    blockedClassCount: affordance.blockedMaterial?.length ?? 0,
    nonClaimCount: affordance.nonClaims?.length ?? 0,
    consentBound: true,
  };
}

export function useFriendDelivery(options: UseFriendDeliveryOptions = {}): UseFriendDeliveryReturn {
  const provider = useContext(VeygritContext);
  if (!provider) {
    throw new Error('useFriendDelivery must be used inside <VeygritProvider>.');
  }
  assertPublishableKey(provider.publishableKey);

  const [status, setStatus] = useState<FriendDeliveryStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [lastRequestPayload, setLastRequestPayload] = useState<FriendDeliveryRequestPayload | null>(null);
  const [lastRequestResult, setLastRequestResult] = useState<FriendDeliveryRequestResult | null>(null);
  const [lastApprovalPayload, setLastApprovalPayload] = useState<FriendDeliveryApprovalPayload | null>(null);
  const [lastApprovalResult, setLastApprovalResult] = useState<FriendDeliveryApprovalResult | null>(null);

  const normalizeError = useCallback(
    (caught: unknown) => {
      const normalizedError = caught instanceof Error ? caught : new Error(String(caught));
      setError(normalizedError);
      setStatus('error');
      options.onError?.(normalizedError);
      return normalizedError;
    },
    [options],
  );

  const requestFriendDelivery = useCallback(
    async (input: FriendDeliveryRequestInput) => {
      try {
        setStatus('requesting');
        setError(null);
        const payload = createFriendDeliveryRequestPayload(input);
        setLastRequestPayload(payload);
        if (!options.requestTransport) {
          throw new Error('useFriendDelivery requires requestTransport to send friend delivery requests.');
        }
        const result = await options.requestTransport({
          url: buildFriendDeliveryRequestUrl(options.apiBaseUrl ?? DEFAULT_API_BASE_URL),
          payload,
        });
        setLastRequestResult(result);
        setStatus(result.status === 'notified' ? 'notified' : 'error');
        return result;
      } catch (caught) {
        throw normalizeError(caught);
      }
    },
    [normalizeError, options],
  );

  const approveFriendDelivery = useCallback(
    async (input: FriendDeliveryApprovalInput) => {
      try {
        setStatus('approving');
        setError(null);
        const payload = createFriendDeliveryApprovalPayload(input);
        setLastApprovalPayload(payload);
        if (!options.approvalTransport) {
          throw new Error('useFriendDelivery requires approvalTransport to send friend delivery approvals.');
        }
        const result = await options.approvalTransport({
          url: buildFriendDeliveryApprovalUrl(options.apiBaseUrl ?? DEFAULT_API_BASE_URL),
          payload,
        });
        setLastApprovalResult(result);
        setStatus('approved');
        return result;
      } catch (caught) {
        throw normalizeError(caught);
      }
    },
    [normalizeError, options],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setLastRequestPayload(null);
    setLastRequestResult(null);
    setLastApprovalPayload(null);
    setLastApprovalResult(null);
  }, []);

  return {
    status,
    isLoading: status === 'requesting' || status === 'approving',
    error,
    lastRequestPayload,
    lastRequestResult,
    lastApprovalPayload,
    lastApprovalResult,
    requestFriendDelivery,
    approveFriendDelivery,
    reset,
  };
}

export function createFriendDeliveryController(options: UseFriendDeliveryOptions = {}): FriendDeliveryController {
  let status: FriendDeliveryStatus = 'idle';
  let error: Error | null = null;
  let lastRequestPayload: FriendDeliveryRequestPayload | null = null;
  let lastRequestResult: FriendDeliveryRequestResult | null = null;
  let lastApprovalPayload: FriendDeliveryApprovalPayload | null = null;
  let lastApprovalResult: FriendDeliveryApprovalResult | null = null;

  const snapshot = (): FriendDeliveryControllerSnapshot => ({
    status,
    isLoading: status === 'requesting' || status === 'approving',
    error,
    lastRequestPayload,
    lastRequestResult,
    lastApprovalPayload,
    lastApprovalResult,
  });

  const normalizeError = (caught: unknown) => {
    const normalizedError = caught instanceof Error ? caught : new Error(String(caught));
    error = normalizedError;
    status = 'error';
    options.onError?.(normalizedError);
    return normalizedError;
  };

  return {
    getSnapshot: snapshot,
    async requestFriendDelivery(input: FriendDeliveryRequestInput) {
      try {
        status = 'requesting';
        error = null;
        lastRequestPayload = createFriendDeliveryRequestPayload(input);
        if (!options.requestTransport) {
          throw new Error('createFriendDeliveryController requires requestTransport to send friend delivery requests.');
        }
        lastRequestResult = await options.requestTransport({
          url: buildFriendDeliveryRequestUrl(options.apiBaseUrl ?? DEFAULT_API_BASE_URL),
          payload: lastRequestPayload,
        });
        status = lastRequestResult.status === 'notified' ? 'notified' : 'error';
        return lastRequestResult;
      } catch (caught) {
        throw normalizeError(caught);
      }
    },
    async approveFriendDelivery(input: FriendDeliveryApprovalInput) {
      try {
        status = 'approving';
        error = null;
        lastApprovalPayload = createFriendDeliveryApprovalPayload(input);
        if (!options.approvalTransport) {
          throw new Error('createFriendDeliveryController requires approvalTransport to send friend delivery approvals.');
        }
        lastApprovalResult = await options.approvalTransport({
          url: buildFriendDeliveryApprovalUrl(options.apiBaseUrl ?? DEFAULT_API_BASE_URL),
          payload: lastApprovalPayload,
        });
        status = 'approved';
        return lastApprovalResult;
      } catch (caught) {
        throw normalizeError(caught);
      }
    },
    reset() {
      status = 'idle';
      error = null;
      lastRequestPayload = null;
      lastRequestResult = null;
      lastApprovalPayload = null;
      lastApprovalResult = null;
    },
  };
}

export function createAddressLoginRequest(
  provider: AddressLoginProviderConfig,
  options: UseAddressLoginOptions = {},
): AddressLoginAuthorizeRequest {
  assertPublishableKey(provider.publishableKey);

  return {
    publishableKey: provider.publishableKey,
    authorizeEndpoint: provider.authorizeEndpoint ?? DEFAULT_AUTHORIZE_ENDPOINT,
    purpose: options.purpose ?? 'shipping',
    disclosureMode: options.disclosureMode ?? 'proof_only',
    requestedClaims: options.requestedClaims ?? DEFAULT_REQUESTED_CLAIMS,
    riskLevel: options.riskLevel ?? 'standard',
    redirectUri: options.redirectUri ?? provider.redirectUri,
    state: options.state ?? createPublicNonce('state'),
    nonce: options.nonce ?? createPublicNonce('nonce'),
    locale: options.locale ?? provider.locale,
    countryHints: options.countryHints ?? provider.defaultCountryHints,
    carrierId: options.carrierId,
    walletHint: options.walletHint,
  };
}

export function buildAddressLoginAuthorizeUrl(request: AddressLoginAuthorizeRequest): string {
  assertPublishableKey(request.publishableKey);
  assertNoUnsafePublicFields(request);

  const url = new URL(request.authorizeEndpoint);
  url.searchParams.set('client_id', request.publishableKey);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'address_login');
  url.searchParams.set('purpose', request.purpose);
  url.searchParams.set('disclosure_mode', request.disclosureMode);
  url.searchParams.set('risk_level', request.riskLevel);
  url.searchParams.set('claims', request.requestedClaims.join(','));
  url.searchParams.set('state', request.state);
  url.searchParams.set('nonce', request.nonce);

  if (request.redirectUri) url.searchParams.set('redirect_uri', request.redirectUri);
  if (request.locale) url.searchParams.set('locale', request.locale);
  if (request.countryHints?.length) url.searchParams.set('country_hints', request.countryHints.join(','));
  if (request.carrierId) url.searchParams.set('carrier_id', request.carrierId);
  if (request.walletHint) url.searchParams.set('wallet_hint', request.walletHint);

  return url.toString();
}

export function createVeyIdAuthorizeRequest(
  provider: AddressLoginProviderConfig,
  options: VeyIdAuthorizeOptions,
): VeyIdAuthorizeRequest {
  assertPublishableKey(provider.publishableKey);

  const request: VeyIdAuthorizeRequest = {
    publishableKey: provider.publishableKey,
    authorizeEndpoint: provider.veyIdAuthorizeEndpoint ?? DEFAULT_VEY_ID_AUTHORIZE_ENDPOINT,
    redirectUri: options.redirectUri ?? provider.redirectUri,
    scopes: options.scopes ?? DEFAULT_VEY_ID_SCOPES,
    state: options.state ?? createPublicNonce('state'),
    nonce: options.nonce ?? createPublicNonce('nonce'),
    codeChallenge: options.codeChallenge,
    origin: options.origin,
    loginHint: options.loginHint,
  };
  assertNoUnsafePublicFields(request);
  assertNoUnsafePublicValues(request);
  return request;
}

export function buildVeyIdAuthorizeUrl(request: VeyIdAuthorizeRequest): string {
  assertPublishableKey(request.publishableKey);
  assertNoUnsafePublicFields(request);
  assertNoUnsafePublicValues(request);

  const url = new URL(request.authorizeEndpoint);
  url.searchParams.set('client_id', request.publishableKey);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', request.scopes.join(' '));
  url.searchParams.set('state', request.state);
  url.searchParams.set('nonce', request.nonce);
  url.searchParams.set('code_challenge', request.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('origin', request.origin);

  if (request.redirectUri) url.searchParams.set('redirect_uri', request.redirectUri);
  if (request.loginHint) url.searchParams.set('login_hint', request.loginHint);

  return url.toString();
}

export function createVeyIdTokenRequestPayload(input: VeyIdTokenRequestInput): VeyIdTokenRequestPayload {
  const payload: VeyIdTokenRequestPayload = {
    grantType: 'authorization_code',
    authorizationCodeRef: input.authorizationCodeRef,
    clientId: input.clientId,
    redirectUri: input.redirectUri,
    pkceVerifier: input.pkceVerifier,
  };
  assertNoUnsafePublicFields(payload);
  assertNoUnsafePublicValues(payload);
  return payload;
}

export function createVeyIdConnectionRevocationPayload(
  input: VeyIdConnectionRevocationInput,
): VeyIdConnectionRevocationPayload {
  const payload: VeyIdConnectionRevocationPayload = {
    clientId: input.clientId,
    pairwiseSubjectAlias: input.pairwiseSubjectAlias,
    walletConsentRef: input.walletConsentRef,
    reason: input.reason ?? 'user_wallet_unlink',
  };
  assertNoUnsafePublicFields(payload);
  assertNoUnsafePublicValues(payload);
  return payload;
}

export function createVeyIdGuestCheckoutHandoffPayload(
  input: VeyIdGuestCheckoutHandoffInput,
): VeyIdGuestCheckoutHandoffPayload {
  const payload: VeyIdGuestCheckoutHandoffPayload = {
    clientId: input.clientId,
    pairwiseSubjectAlias: input.pairwiseSubjectAlias,
    walletConsentRef: input.walletConsentRef,
    addressCredentialRef: input.addressCredentialRef,
    accessTokenRef: input.accessTokenRef,
    orderRef: input.orderRef,
  };
  assertNoUnsafePublicFields(payload);
  assertNoUnsafePublicValues(payload);
  return payload;
}

export function buildVeyIdTokenUrl(apiBaseUrl = DEFAULT_VEY_ID_API_BASE_URL): string {
  return buildHostedApiUrl(apiBaseUrl, '/veygrit/oauth/token');
}

export function buildVeyIdConnectionRevocationUrl(apiBaseUrl = DEFAULT_VEY_ID_API_BASE_URL): string {
  return buildHostedApiUrl(apiBaseUrl, '/veygrit/connections/revoke');
}

export function buildVeyIdGuestCheckoutHandoffUrl(apiBaseUrl = DEFAULT_VEY_ID_API_BASE_URL): string {
  return buildHostedApiUrl(apiBaseUrl, '/veygrit/guest-checkout/handoff');
}

export function createFriendDeliveryRequestPayload(input: FriendDeliveryRequestInput): FriendDeliveryRequestPayload {
  const payload: FriendDeliveryRequestPayload = {
    purchaserSubjectAlias: input.purchaserSubjectAlias,
    friendAlias: input.friendAlias,
    cartRef: input.cartRef,
    purpose: 'anonymous_shipping',
    requestedClaims: input.requestedClaims ?? DEFAULT_FRIEND_DELIVERY_CLAIMS,
    disclosureMode: 'carrier_decryptable',
    requestedAt: input.requestedAt ?? new Date().toISOString(),
  };
  assertNoUnsafePublicFields(payload);
  assertNoUnsafePublicValues(payload);
  return payload;
}

export function createFriendDeliveryApprovalPayload(input: FriendDeliveryApprovalInput): FriendDeliveryApprovalPayload {
  const payload: FriendDeliveryApprovalPayload = {
    friendDeliveryRequestRef: input.friendDeliveryRequestRef,
    approvalRef: input.approvalRef,
    selectedAddressRef: input.selectedAddressRef,
    consentEnvelopeRef: input.consentEnvelopeRef,
    approvedClaims: input.approvedClaims ?? DEFAULT_FRIEND_DELIVERY_CLAIMS,
    approvedAt: input.approvedAt ?? new Date().toISOString(),
  };
  assertNoUnsafePublicFields(payload);
  assertNoUnsafePublicValues(payload);
  return payload;
}

export function buildFriendDeliveryRequestUrl(apiBaseUrl: string): string {
  return buildHostedApiUrl(apiBaseUrl, '/friend-delivery/requests');
}

export function buildFriendDeliveryApprovalUrl(apiBaseUrl: string): string {
  return buildHostedApiUrl(apiBaseUrl, '/friend-delivery/approvals');
}

export function parseAddressLoginCallback(
  input: AddressLoginCallbackInput,
  options: AddressLoginCallbackParseOptions = {},
): AddressLoginCallbackResult {
  const params = toAddressLoginSearchParams(input);
  assertNoUnsafeCallbackParams(params);

  const state = params.get('state') ?? undefined;
  const issuer = params.get('iss') ?? params.get('issuer') ?? undefined;

  if (options.expectedState && state !== options.expectedState) {
    throw new Error('Address Login callback state mismatch.');
  }

  if (options.allowedIssuer && issuer && issuer !== options.allowedIssuer) {
    throw new Error('Address Login callback issuer is not allowed.');
  }

  const callbackError = params.get('error');
  if (callbackError) {
    return {
      status: 'error',
      error: callbackError,
      errorDescription: params.get('error_description') ?? undefined,
      state,
      issuer,
    };
  }

  const code = params.get('code');
  if (!code) {
    throw new Error('Address Login callback is missing authorization code.');
  }

  if (!state) {
    throw new Error('Address Login callback is missing state.');
  }

  return {
    status: 'authorized',
    code,
    state,
    issuer,
    sessionRef: params.get('session_ref') ?? undefined,
    credentialRef: params.get('credential_ref') ?? undefined,
    proofRef: params.get('proof_bundle_ref') ?? params.get('proof_ref') ?? undefined,
    handoffRef: params.get('carrier_handoff_ref') ?? params.get('handoff_ref') ?? undefined,
  };
}

export function parseVeyIdCallback(
  input: VeyIdCallbackInput,
  options: VeyIdCallbackParseOptions = {},
): VeyIdCallbackResult {
  const params = toAddressLoginSearchParams(input);
  assertNoUnsafeCallbackParams(params);

  const state = params.get('state') ?? undefined;
  const issuer = params.get('iss') ?? params.get('issuer') ?? undefined;

  if (options.expectedState && state !== options.expectedState) {
    throw new Error('Vey ID callback state mismatch.');
  }

  if (options.allowedIssuer && issuer && issuer !== options.allowedIssuer) {
    throw new Error('Vey ID callback issuer is not allowed.');
  }

  const callbackError = params.get('error');
  if (callbackError) {
    return {
      status: 'error',
      error: callbackError,
      errorDescription: params.get('error_description') ?? undefined,
      state,
      issuer,
    };
  }

  const authorizationCodeRef = params.get('authorization_code_ref') ?? params.get('code');
  if (!authorizationCodeRef) {
    throw new Error('Vey ID callback is missing authorizationCodeRef.');
  }

  if (!state) {
    throw new Error('Vey ID callback is missing state.');
  }

  return {
    status: 'authorized',
    authorizationCodeRef,
    state,
    issuer,
    pairwiseSubjectAlias: params.get('pairwise_subject_alias') ?? undefined,
    walletSessionRef: params.get('wallet_session_ref') ?? undefined,
  };
}

function assertPublishableKey(publishableKey: string): void {
  if (!publishableKey || !publishableKey.startsWith('pk_')) {
    throw new Error('Veygrit publishableKey must be a public key starting with "pk_".');
  }
}

function assertNoUnsafePublicFields(request: Record<string, unknown>): void {
  const unsafePattern = /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret|provider.?id.?token|provider.?access.?token|provider.?refresh.?token|raw.?provider.?profile|carrier.?api.?key|production.?credential/i;
  for (const key of Object.keys(request)) {
    if (unsafePattern.test(key)) {
      throw new Error(`Unsafe Address Login public request field: ${key}`);
    }
  }
}

function assertNoUnsafePublicValues(request: Record<string, unknown>): void {
  const unsafePattern = /raw.?address|address.?line|recipient|phone|email|witness|private.?key|proof.?secret|provider.?id.?token|provider.?access.?token|provider.?refresh.?token|raw.?provider.?profile|carrier.?api.?key|production.?credential/i;
  const stack: unknown[] = Object.values(request);
  while (stack.length) {
    const value = stack.pop();
    if (typeof value === 'string' && unsafePattern.test(value)) {
      throw new Error('Unsafe Address Login public request value.');
    }
    if (Array.isArray(value)) {
      stack.push(...value);
    } else if (value && typeof value === 'object') {
      stack.push(...Object.values(value as Record<string, unknown>));
    }
  }
}

function assertSafeMerchantVisibleRef(ref: string): void {
  if (UNSAFE_MERCHANT_VISIBLE_REF_VALUE.test(ref)) {
    throw new Error('Unsafe merchant-visible redaction ref value.');
  }
}

function buildHostedApiUrl(apiBaseUrl: string, path: string): string {
  const url = new URL(apiBaseUrl);
  url.pathname = `${url.pathname.replace(/\/$/, '')}${path}`;
  return url.toString();
}

function assertNoUnsafeCallbackParams(params: URLSearchParams): void {
  const unsafePattern = /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret|provider.?id.?token|provider.?access.?token|provider.?refresh.?token|raw.?provider.?profile|carrier.?api.?key|production.?credential/i;
  for (const [key, value] of params.entries()) {
    if (unsafePattern.test(key) || unsafePattern.test(value)) {
      throw new Error(`Unsafe Address Login callback parameter: ${key}`);
    }
  }
}

function toAddressLoginSearchParams(input: AddressLoginCallbackInput): URLSearchParams {
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

function createPublicNonce(prefix: 'state' | 'nonce'): string {
  const bytes = new Uint8Array(12);
  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  const token = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${token}`;
}
