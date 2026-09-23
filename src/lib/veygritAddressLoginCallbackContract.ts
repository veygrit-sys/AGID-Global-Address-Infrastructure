export const VEYGRIT_ADDRESS_LOGIN_CALLBACK_CONTRACT_VERSION = 'veygrit-address-login-callback-v0.1' as const;

export const VEYGRIT_ADDRESS_LOGIN_CANONICAL_CALLBACK_PARAMS = [
  'code',
  'state',
  'iss',
  'session_ref',
  'credential_ref',
  'proof_bundle_ref',
  'carrier_handoff_ref',
  'error',
  'error_description',
] as const;

export const VEYGRIT_ADDRESS_LOGIN_CALLBACK_PARAM_ALIASES = {
  issuer: ['issuer'],
  proofBundleRef: ['proof_ref'],
  carrierHandoffRef: ['handoff_ref'],
} as const;

export const VEYGRIT_ADDRESS_LOGIN_FORBIDDEN_CALLBACK_PARAM_EXAMPLES = [
  'raw_address',
  'address_line1',
  'recipient',
  'witness',
  'private_key',
  'proof_secret',
] as const;

export const VEYGRIT_ADDRESS_LOGIN_CALLBACK_NON_CLAIMS = [
  'Callback params are not address resolution evidence.',
  'Callback params must not contain raw address, recipient, witness, private-key, or proof-secret material.',
  'Carrier handoff refs authorize neither merchant decryption nor address storage.',
] as const;

export type VeygritAddressLoginCallbackCanonicalParam =
  (typeof VEYGRIT_ADDRESS_LOGIN_CANONICAL_CALLBACK_PARAMS)[number];

export type VeygritAddressLoginCallbackParamInput =
  | string
  | URL
  | URLSearchParams
  | Record<string, string | undefined>;

export type VeygritAddressLoginCallbackValidationOptions = {
  expectedState?: string;
  allowedIssuer?: string;
  requireCode?: boolean;
  requireSessionRef?: boolean;
  requireCredentialRef?: boolean;
  requireProofBundleRef?: boolean;
  requireCarrierHandoffRef?: boolean;
};

export type VeygritAddressLoginCallbackValidationError =
  | 'forbidden_callback_param'
  | 'unexpected_callback_param'
  | 'callback_param_alias_conflict'
  | 'state_mismatch'
  | 'issuer_mismatch'
  | 'missing_code'
  | 'missing_session_ref'
  | 'missing_credential_ref'
  | 'missing_proof_bundle_ref'
  | 'missing_carrier_handoff_ref';

export type VeygritAddressLoginCallbackNormalizedParams = Partial<
  Record<VeygritAddressLoginCallbackCanonicalParam, string>
>;

export type VeygritAddressLoginCallbackValidationResult = {
  status: 'accepted' | 'rejected';
  normalizedParams: VeygritAddressLoginCallbackNormalizedParams;
  errors: VeygritAddressLoginCallbackValidationError[];
  forbiddenParams: string[];
  unexpectedParams: string[];
  nonClaims: string[];
};

export type VeygritAddressLoginCallbackValidationVector = {
  id: string;
  endpoint: 'GET merchant callback';
  input: Record<string, string>;
  options: VeygritAddressLoginCallbackValidationOptions;
  expectedResult: 'accepted' | 'rejected';
  expectedError?: VeygritAddressLoginCallbackValidationError;
  expectedNormalizedParams?: VeygritAddressLoginCallbackNormalizedParams;
  safeInputs: string[];
};

const CALLBACK_ALIAS_TO_CANONICAL: Record<string, VeygritAddressLoginCallbackCanonicalParam> = {
  issuer: 'iss',
  proof_ref: 'proof_bundle_ref',
  handoff_ref: 'carrier_handoff_ref',
};
const FORBIDDEN_CALLBACK_MATERIAL_PATTERN = /raw.?address|address.?line|recipient|witness|private.?key|proof.?secret/i;

export function getVeygritAddressLoginAcceptedCallbackParams(): string[] {
  return [
    ...VEYGRIT_ADDRESS_LOGIN_CANONICAL_CALLBACK_PARAMS,
    ...Object.values(VEYGRIT_ADDRESS_LOGIN_CALLBACK_PARAM_ALIASES).flat(),
  ];
}

export function isForbiddenVeygritAddressLoginCallbackParam(paramName: string): boolean {
  return FORBIDDEN_CALLBACK_MATERIAL_PATTERN.test(paramName);
}

export function isForbiddenVeygritAddressLoginCallbackMaterial(value: string): boolean {
  return FORBIDDEN_CALLBACK_MATERIAL_PATTERN.test(value);
}

export function validateVeygritAddressLoginCallbackParams(
  input: VeygritAddressLoginCallbackParamInput,
  options: VeygritAddressLoginCallbackValidationOptions = {},
): VeygritAddressLoginCallbackValidationResult {
  const entries = callbackParamEntries(input);
  const acceptedParams = new Set(getVeygritAddressLoginAcceptedCallbackParams());
  const normalizedParams: VeygritAddressLoginCallbackNormalizedParams = {};
  const errors: VeygritAddressLoginCallbackValidationError[] = [];
  const forbiddenParams: string[] = [];
  const unexpectedParams: string[] = [];

  for (const [paramName, value] of entries) {
    const lowerParamName = paramName.toLowerCase();
    const canonicalParam = CALLBACK_ALIAS_TO_CANONICAL[paramName] ?? paramName;

    if (
      isForbiddenVeygritAddressLoginCallbackParam(paramName)
      || isForbiddenVeygritAddressLoginCallbackMaterial(value)
    ) {
      forbiddenParams.push(paramName);
      addOnce(errors, 'forbidden_callback_param');
      continue;
    }
    if (!acceptedParams.has(paramName)) {
      unexpectedParams.push(paramName);
      addOnce(errors, 'unexpected_callback_param');
      continue;
    }
    if (!VEYGRIT_ADDRESS_LOGIN_CANONICAL_CALLBACK_PARAMS.includes(canonicalParam as VeygritAddressLoginCallbackCanonicalParam)) {
      unexpectedParams.push(paramName);
      addOnce(errors, 'unexpected_callback_param');
      continue;
    }

    const existing = normalizedParams[canonicalParam as VeygritAddressLoginCallbackCanonicalParam];
    if (existing && existing !== value) {
      addOnce(errors, 'callback_param_alias_conflict');
      continue;
    }
    normalizedParams[canonicalParam as VeygritAddressLoginCallbackCanonicalParam] = value;

    if (lowerParamName !== paramName && isForbiddenVeygritAddressLoginCallbackParam(lowerParamName)) {
      forbiddenParams.push(paramName);
      addOnce(errors, 'forbidden_callback_param');
    }
  }

  if (options.expectedState && normalizedParams.state !== options.expectedState) addOnce(errors, 'state_mismatch');
  if (options.allowedIssuer && normalizedParams.iss !== options.allowedIssuer) addOnce(errors, 'issuer_mismatch');
  if (options.requireCode && !normalizedParams.code && !normalizedParams.error) addOnce(errors, 'missing_code');
  if (options.requireSessionRef && !normalizedParams.session_ref) addOnce(errors, 'missing_session_ref');
  if (options.requireCredentialRef && !normalizedParams.credential_ref) addOnce(errors, 'missing_credential_ref');
  if (options.requireProofBundleRef && !normalizedParams.proof_bundle_ref) addOnce(errors, 'missing_proof_bundle_ref');
  if (options.requireCarrierHandoffRef && !normalizedParams.carrier_handoff_ref) addOnce(errors, 'missing_carrier_handoff_ref');

  return {
    status: errors.length === 0 ? 'accepted' : 'rejected',
    normalizedParams,
    errors,
    forbiddenParams,
    unexpectedParams,
    nonClaims: [...VEYGRIT_ADDRESS_LOGIN_CALLBACK_NON_CLAIMS],
  };
}

function callbackParamEntries(input: VeygritAddressLoginCallbackParamInput): Array<[string, string]> {
  if (input instanceof URLSearchParams) return [...input.entries()];
  if (input instanceof URL) return [...input.searchParams.entries()];
  if (typeof input === 'string') {
    const params = input.includes('?')
      ? new URL(input, 'https://merchant.example/callback').searchParams
      : new URLSearchParams(input);
    return [...params.entries()];
  }
  return Object.entries(input).filter((entry): entry is [string, string] => typeof entry[1] === 'string');
}

function addOnce<T>(items: T[], item: T) {
  if (!items.includes(item)) items.push(item);
}
