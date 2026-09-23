import {
  VEYGRIT_ADDRESS_LOGIN_CALLBACK_CONTRACT_VERSION,
  VEYGRIT_ADDRESS_LOGIN_CALLBACK_NON_CLAIMS,
  VEYGRIT_ADDRESS_LOGIN_CALLBACK_PARAM_ALIASES,
  VEYGRIT_ADDRESS_LOGIN_CANONICAL_CALLBACK_PARAMS,
  VEYGRIT_ADDRESS_LOGIN_FORBIDDEN_CALLBACK_PARAM_EXAMPLES,
  validateVeygritAddressLoginCallbackParams,
  type VeygritAddressLoginCallbackValidationVector,
} from './veygritAddressLoginCallbackContract';

export type HostedAddressLoginPrivacyPosture = {
  rawAddressAccepted: boolean;
  merchantCanDecrypt: boolean;
  witnessAccepted: boolean;
  productionCredentialAccepted: boolean;
  acceptedMaterial?: string[];
  rejectedMaterial?: string[];
};

export type HostedAddressLoginMerchantVisibleRedactionDisplayField =
  | 'pairwiseSubjectAlias'
  | 'guestCheckoutAlias'
  | 'walletConsentRef'
  | 'addressCredentialRef'
  | 'carrierHandoffRef';

export type HostedAddressLoginMerchantVisibleRedactionDisplayContract = {
  sourceFixture: 'docs/specs/fixtures/veygrit-id-core-v0.1.json#merchantVisibleRedactionDisplayContract';
  sdkPackage: '@veygrit/address-login-react';
  sdkHelper: 'createMerchantVisibleRedactionDisplayModel';
  example: 'sdk/veygrit-address-login-react/examples/merchant-visible-redaction/MerchantVisibleRedactionCard.tsx';
  boundaryGateId: 'merchant-visible-redaction';
  displayFields: HostedAddressLoginMerchantVisibleRedactionDisplayField[];
  displayRefsByField: Record<HostedAddressLoginMerchantVisibleRedactionDisplayField, string>;
  requiredNextAction: 'create-guest-order-from-refs';
  blockedClassCount: number;
  nonClaimCount: number;
  renderedMaterialPolicy: {
    copyBlockedMaterialNames: boolean;
    copyNonClaimText: boolean;
    showCountsOnly: boolean;
  };
};

export type HostedAddressLoginMerchantVisibleRedactionSourceContract = Omit<
  HostedAddressLoginMerchantVisibleRedactionDisplayContract,
  'sourceFixture'
>;

export type HostedAddressLoginMerchantVisibleRedactionHostedRefs = Record<
  HostedAddressLoginMerchantVisibleRedactionDisplayField,
  string
>;

export type HostedAddressLoginMerchantVisibleRedactionCopyPayload = {
  label: 'Hosted redaction safe refs';
  buttonLabel: 'Copy safe refs';
  successLabel: 'Copied safe refs';
  clipboardText: string;
  localOnly: true;
  productionTraffic: false;
  countsOnly: boolean;
  counts: {
    visibleRefs: number;
    blockedClasses: number;
    nonClaims: number;
  };
  displayRefs: Record<HostedAddressLoginMerchantVisibleRedactionDisplayField, string>;
};

export type HostedAddressLoginMerchantVisibleRedactionHostedRefSource = {
  source: 'hosted-address-login-synthetic-flow-refs-v0.1';
  guestCheckoutAlias: string;
  nonClaims: string[];
};

export type HostedAddressLoginMerchantVisibleRedactionClipboardCopyResult = {
  status: 'copied';
  successLabel: 'Copied safe refs';
  localOnly: true;
  productionTraffic: false;
  countsOnly: boolean;
  counts: HostedAddressLoginMerchantVisibleRedactionCopyPayload['counts'];
  clipboardTextLength: number;
};

export type HostedAddressLoginMerchantVisibleRedactionSyncResult = {
  status: 'pass' | 'fail';
  errors: string[];
  expectedContract?: HostedAddressLoginMerchantVisibleRedactionDisplayContract;
};

export type HostedAddressLoginJsonSchemaSubset = {
  $ref?: string;
  allOf?: HostedAddressLoginJsonSchemaSubset[];
  additionalProperties?: boolean | HostedAddressLoginJsonSchemaSubset;
  const?: unknown;
  contains?: HostedAddressLoginJsonSchemaSubset;
  enum?: unknown[];
  format?: string;
  items?: HostedAddressLoginJsonSchemaSubset;
  maxItems?: number;
  minItems?: number;
  minLength?: number;
  pattern?: string;
  prefixItems?: HostedAddressLoginJsonSchemaSubset[];
  properties?: Record<string, HostedAddressLoginJsonSchemaSubset>;
  required?: string[];
  type?: string | string[];
};

export type HostedAddressLoginVector = Record<string, unknown> & {
  id: string;
  endpoint: string;
};

export type HostedAddressLoginAuthorizeVector = HostedAddressLoginVector & {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  disclosureMode: 'proof_only' | 'selective_disclosure' | 'carrier_decryptable' | 'merchant_visible';
  requestedClaims: string[];
};

export type HostedAddressLoginTokenRequestVector = HostedAddressLoginVector & {
  grantType: 'authorization_code';
  code: string;
  redirectUri: string;
  clientId: string;
  codeVerifier: string;
};

export type HostedAddressLoginResultVector = HostedAddressLoginVector & {
  status: 'approved' | 'needs_review' | 'denied' | 'expired';
  subjectAlias: string;
  consentEnvelopeRef: string;
  credentialRef: string;
  proofBundleRef: string;
  publicClaims: Record<string, boolean | string | number>;
  encryptedForCarrierRef?: string;
  nextAction: 'continue_checkout' | 'carrier_handoff' | 'manual_review' | 'request_consent_again' | 'deny';
  privacy: HostedAddressLoginPrivacyPosture;
};

export type HostedAddressLoginProofVerifyRequestVector = HostedAddressLoginVector & {
  proofBundleRef: string;
  credentialRef: string;
  consentEnvelopeRef: string;
  verifierPolicyHash: string;
  challengeHash: string;
  nullifierHash?: string;
  requestedClaims: string[];
};

export type HostedAddressLoginProofVerifyResultVector = HostedAddressLoginVector & {
  verified: boolean;
  status: 'valid' | 'invalid' | 'stale' | 'revoked' | 'policy_denied';
  proofBundleRef: string;
  privacy: HostedAddressLoginPrivacyPosture;
};

export type HostedAddressLoginCarrierDecryptRequestVector = HostedAddressLoginVector & {
  carrierId: string;
  deliverySessionRef: string;
  consentEnvelopeRef: string;
  encryptedForCarrierRef: string;
  purpose: 'shipping';
  expiresAt: string;
};

export type HostedAddressLoginCarrierDecryptResultVector = HostedAddressLoginVector & {
  authorized: boolean;
  carrierId: string;
  deliverySessionRef: string;
  handoffReceiptRef: string;
  expiresAt: string;
  privacy: HostedAddressLoginPrivacyPosture;
};

export type HostedAddressLoginFriendDeliveryRequestVector = HostedAddressLoginVector & {
  purchaserSubjectAlias: string;
  friendAlias: string;
  cartRef: string;
  purpose: 'anonymous_shipping';
  requestedClaims: string[];
  disclosureMode: 'carrier_decryptable';
  requestedAt: string;
};

export type HostedAddressLoginFriendDeliveryRequestResultVector = HostedAddressLoginVector & {
  status: 'notified' | 'denied' | 'expired';
  friendDeliveryRequestRef: string;
  friendAlias: string;
  consentEnvelopeRef: string;
  notificationRef: string;
  expiresAt: string;
  privacy: HostedAddressLoginPrivacyPosture;
};

export type HostedAddressLoginFriendDeliveryApprovalVector = HostedAddressLoginVector & {
  friendDeliveryRequestRef: string;
  approvalRef: string;
  selectedAddressRef: string;
  consentEnvelopeRef: string;
  approvedClaims: string[];
  approvedAt: string;
};

export type HostedAddressLoginFriendDeliveryApprovalResultVector = HostedAddressLoginVector & {
  status: 'approved';
  friendDeliveryRequestRef: string;
  approvalRef: string;
  carrierHandoffRef: string;
  deliveryReceiptRef: string;
  publicClaims: Record<string, boolean | string | number>;
  privacy: HostedAddressLoginPrivacyPosture;
};

export type HostedAddressLoginFriendDeliveryMerchantScenarioStep = {
  id: 'checkout-select-friend' | 'server-create-request' | 'wallet-notify' | 'wallet-approve' | 'server-receive-handoff';
  actor: 'purchaser' | 'recipient' | 'address-wallet' | 'merchant' | 'carrier';
  inputRefs: string[];
  outputRefs: string[];
};

export type HostedAddressLoginFriendDeliveryMerchantScenarioVector = HostedAddressLoginVector & {
  purpose: 'anonymous_shipping';
  disclosureMode: 'carrier_decryptable_preferred';
  purchaserSubjectAlias: string;
  friendAlias: string;
  cartRef: string;
  friendDeliveryRequestRef: string;
  notificationRef: string;
  approvalRef: string;
  selectedAddressRef: string;
  consentEnvelopeRef: string;
  carrierHandoffRef: string;
  deliveryReceiptRef: string;
  merchantVisibleRefs: string[];
  purchaserNeverSees: string[];
  steps: HostedAddressLoginFriendDeliveryMerchantScenarioStep[];
};

export type HostedAddressLoginConsentRevocationRequestVector = HostedAddressLoginVector & {
  consentEnvelopeRef: string;
  reason: string;
};

export type HostedAddressLoginConsentRevocationResultVector = HostedAddressLoginVector & {
  status: 'revoked' | 'already_inactive' | 'not_found';
  consentEnvelopeRef: string;
  revoked: boolean;
  privacy: HostedAddressLoginPrivacyPosture;
};

export type HostedAddressLoginTestVectorSummary = {
  id: string;
  purpose: string;
  disclosureMode: string;
  riskLevel: string;
  expectedClaims: string[];
  expectedNextAction: string;
};

export type HostedAddressLoginScenarioVectorSummary = {
  id: string;
  purpose: string;
  disclosureMode: string;
  checkedRefs: string[];
  steps: HostedAddressLoginFriendDeliveryMerchantScenarioStep[];
  expectedNextAction: string;
};

export type HostedAddressLoginCallbackContract = {
  version: typeof VEYGRIT_ADDRESS_LOGIN_CALLBACK_CONTRACT_VERSION;
  canonicalParams: string[];
  aliases: Record<string, string[]>;
  forbiddenParams: string[];
  nonClaims: string[];
};

export type HostedAddressLoginWebhookContract = {
  algorithm: 'hmac-sha256';
  signatureHeader: 'x-veygrit-signature';
  timestampHeader: 'x-veygrit-timestamp';
  replayWindowSeconds: number;
  signedPayload: 'timestamp.payloadText';
  eventIdIdempotencyRequired: boolean;
  keyIds: string[];
  keyLifecycle: HostedAddressLoginWebhookKey[];
  nonClaims: string[];
};

export type HostedAddressLoginWebhookKey = {
  keyId: string;
  status: 'active' | 'retired';
  notBefore: string;
  notAfter: string;
};

export type HostedAddressLoginWebhookVector = HostedAddressLoginVector & {
  eventId: string;
  eventType: string;
  payloadFingerprint: string;
  timestamp: string;
  keyId: string;
  signatureHeader: string;
  expectedResult: 'accepted' | 'rejected';
  expectedError?: 'signature_mismatch' | 'duplicate_event_id' | 'timestamp_replay' | 'retired_key';
  safeInputs: string[];
};

export type HostedAddressLoginPublicTestVectorResult = {
  fixtureSet: string;
  vectors: HostedAddressLoginTestVectorSummary[];
  scenarioVectors: HostedAddressLoginScenarioVectorSummary[];
  callbackContract: HostedAddressLoginCallbackContract;
  callbackValidationVectors: VeygritAddressLoginCallbackValidationVector[];
  webhookContract: HostedAddressLoginWebhookContract;
  webhookVectors: HostedAddressLoginWebhookVector[];
  merchantVisibleRedactionDisplayContract: HostedAddressLoginMerchantVisibleRedactionDisplayContract;
  privacy: HostedAddressLoginPrivacyPosture;
  warnings?: string[];
};

export type HostedAddressLoginFixtureSet = {
  fixtureSet: string;
  nonClaims: string[];
  callbackContract: HostedAddressLoginCallbackContract;
  callbackValidationVectors: VeygritAddressLoginCallbackValidationVector[];
  webhookContract: HostedAddressLoginWebhookContract;
  privacyPosture: HostedAddressLoginPrivacyPosture;
  merchantVisibleRedactionHostedRefSource: HostedAddressLoginMerchantVisibleRedactionHostedRefSource;
  merchantVisibleRedactionDisplayContract: HostedAddressLoginMerchantVisibleRedactionDisplayContract;
  authorizeRequests: HostedAddressLoginAuthorizeVector[];
  tokenRequests: HostedAddressLoginTokenRequestVector[];
  addressLoginResults: HostedAddressLoginResultVector[];
  proofVerifyRequests: HostedAddressLoginProofVerifyRequestVector[];
  proofVerifyResults: HostedAddressLoginProofVerifyResultVector[];
  carrierDecryptRequests: HostedAddressLoginCarrierDecryptRequestVector[];
  carrierDecryptResults: HostedAddressLoginCarrierDecryptResultVector[];
  friendDeliveryRequests: HostedAddressLoginFriendDeliveryRequestVector[];
  friendDeliveryRequestResults: HostedAddressLoginFriendDeliveryRequestResultVector[];
  friendDeliveryApprovals: HostedAddressLoginFriendDeliveryApprovalVector[];
  friendDeliveryApprovalResults: HostedAddressLoginFriendDeliveryApprovalResultVector[];
  friendDeliveryMerchantScenarios: HostedAddressLoginFriendDeliveryMerchantScenarioVector[];
  consentRevocationRequests: HostedAddressLoginConsentRevocationRequestVector[];
  consentRevocationResults: HostedAddressLoginConsentRevocationResultVector[];
  webhookTestVectors: HostedAddressLoginWebhookVector[];
  testVectorResult: HostedAddressLoginPublicTestVectorResult & { endpoint: string };
};

export type HostedAddressLoginSyntheticSmokeResult = {
  status: 'pass' | 'fail';
  checkedFlows: string[];
  endpoints: string[];
  proofBundleRefs: string[];
  handoffReceiptRefs: string[];
  errors: string[];
  warnings: string[];
};

export type HostedAddressLoginWebhookKeyRotationRunbook = {
  version: 'veygrit-webhook-key-rotation-runbook-v0.1';
  activeKeyIds: string[];
  retiredKeyIds: string[];
  overlapSeconds: number;
  phases: string[];
  evidenceVectorIds: string[];
  errors: string[];
};

export const HOSTED_ADDRESS_LOGIN_FORBIDDEN_PUBLIC_KEYS = [
  'rawAddress',
  'addressLine1',
  'addressLine2',
  'street',
  'building',
  'room',
  'unit',
  'recipient',
  'phone',
  'email',
  'latitude',
  'longitude',
  'witness',
  'privateKey',
  'proofSecret',
  'productionCredential',
  'normalizedAddress',
] as const;

export const HOSTED_ADDRESS_LOGIN_MERCHANT_VISIBLE_REDACTION_DISPLAY_FIELDS = [
  'pairwiseSubjectAlias',
  'guestCheckoutAlias',
  'walletConsentRef',
  'addressCredentialRef',
  'carrierHandoffRef',
] as const satisfies readonly HostedAddressLoginMerchantVisibleRedactionDisplayField[];

const HOSTED_ADDRESS_LOGIN_MERCHANT_VISIBLE_REDACTION_SOURCE_FIXTURE =
  'docs/specs/fixtures/veygrit-id-core-v0.1.json#merchantVisibleRedactionDisplayContract';
const HOSTED_ADDRESS_LOGIN_MERCHANT_VISIBLE_REDACTION_SDK_PACKAGE = '@veygrit/address-login-react';
const HOSTED_ADDRESS_LOGIN_MERCHANT_VISIBLE_REDACTION_SDK_HELPER = 'createMerchantVisibleRedactionDisplayModel';
const HOSTED_ADDRESS_LOGIN_MERCHANT_VISIBLE_REDACTION_EXAMPLE =
  'sdk/veygrit-address-login-react/examples/merchant-visible-redaction/MerchantVisibleRedactionCard.tsx';
const HOSTED_ADDRESS_LOGIN_MERCHANT_VISIBLE_UNSAFE_REF_VALUE =
  /raw.?address|address.?line|recipient|phone|email|witness|private.?key|proof.?secret|provider.?id.?token|provider.?access.?token|provider.?refresh.?token|raw.?provider.?profile|carrier.?api.?key|production.?credential/i;

function collectKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  const record = value as Record<string, unknown>;
  return [
    ...Object.keys(record),
    ...Object.values(record).flatMap(collectKeys),
  ];
}

function assertPrivacyFalse(label: string, privacy: HostedAddressLoginPrivacyPosture | undefined, errors: string[]) {
  if (!privacy) {
    errors.push(`${label}:missing-privacy-posture`);
    return;
  }
  for (const [key, value] of Object.entries({
    rawAddressAccepted: privacy.rawAddressAccepted,
    merchantCanDecrypt: privacy.merchantCanDecrypt,
    witnessAccepted: privacy.witnessAccepted,
    productionCredentialAccepted: privacy.productionCredentialAccepted,
  })) {
    if (value !== false) errors.push(`${label}:${key}-must-be-false`);
  }
}

function hasAllClaims(actual: string[], required: string[]) {
  const set = new Set(actual);
  return required.every(claim => set.has(claim));
}

export function validateHostedAddressLoginFixtureRedaction(fixtures: HostedAddressLoginFixtureSet): string[] {
  const keys = new Set(collectKeys(fixtures));
  const errors: string[] = [];

  for (const key of HOSTED_ADDRESS_LOGIN_FORBIDDEN_PUBLIC_KEYS) {
    if (keys.has(key)) errors.push(`forbidden-public-key:${key}`);
  }

  assertPrivacyFalse('fixture-root', fixtures.privacyPosture, errors);
  for (const vector of [
    ...fixtures.addressLoginResults,
    ...fixtures.proofVerifyResults,
    ...fixtures.carrierDecryptResults,
    ...fixtures.friendDeliveryRequestResults,
    ...fixtures.friendDeliveryApprovalResults,
    ...fixtures.consentRevocationResults,
  ]) {
    assertPrivacyFalse(vector.id, vector.privacy, errors);
  }

  return errors;
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function schemaTypeMatches(type: string | string[] | undefined, value: unknown): boolean {
  if (!type) return true;
  const types = Array.isArray(type) ? type : [type];
  return types.some(candidate => {
    if (candidate === 'array') return Array.isArray(value);
    if (candidate === 'boolean') return typeof value === 'boolean';
    if (candidate === 'integer') return typeof value === 'number' && Number.isInteger(value);
    if (candidate === 'number') return typeof value === 'number' && Number.isFinite(value);
    if (candidate === 'object') return isPlainObject(value);
    if (candidate === 'string') return typeof value === 'string';
    if (candidate === 'null') return value === null;
    return true;
  });
}

function validateHostedAddressLoginJsonSchemaSubset(
  value: unknown,
  schema: HostedAddressLoginJsonSchemaSubset,
  path = '$',
): string[] {
  const errors: string[] = [];

  if (schema.$ref) {
    errors.push(`${path}:unresolved-ref:${schema.$ref}`);
    return errors;
  }
  for (const [index, child] of (schema.allOf ?? []).entries()) {
    errors.push(...validateHostedAddressLoginJsonSchemaSubset(value, child, `${path}.allOf[${index}]`));
  }
  if ('const' in schema && !sameJson(value, schema.const)) {
    errors.push(`${path}:const-mismatch`);
  }
  if (schema.enum && !schema.enum.some(option => sameJson(value, option))) {
    errors.push(`${path}:enum-mismatch`);
  }
  if (!schemaTypeMatches(schema.type, value)) {
    errors.push(`${path}:type-mismatch:${Array.isArray(schema.type) ? schema.type.join('|') : schema.type}`);
    return errors;
  }
  if (schema.format === 'date-time' && typeof value === 'string' && Number.isNaN(Date.parse(value))) {
    errors.push(`${path}:date-time-format-mismatch`);
  }
  if (schema.pattern && typeof value === 'string' && !new RegExp(schema.pattern).test(value)) {
    errors.push(`${path}:pattern-mismatch`);
  }
  if (typeof schema.minLength === 'number' && typeof value === 'string' && value.length < schema.minLength) {
    errors.push(`${path}:min-length-mismatch`);
  }
  if (Array.isArray(value)) {
    if (typeof schema.minItems === 'number' && value.length < schema.minItems) errors.push(`${path}:min-items-mismatch`);
    if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) errors.push(`${path}:max-items-mismatch`);
    schema.prefixItems?.forEach((child, index) => {
      if (index >= value.length) return;
      errors.push(...validateHostedAddressLoginJsonSchemaSubset(value[index], child, `${path}[${index}]`));
    });
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateHostedAddressLoginJsonSchemaSubset(item, schema.items as HostedAddressLoginJsonSchemaSubset, `${path}[${index}]`));
      });
    }
    if (schema.contains && !value.some(item => validateHostedAddressLoginJsonSchemaSubset(item, schema.contains as HostedAddressLoginJsonSchemaSubset, path).length === 0)) {
      errors.push(`${path}:contains-mismatch`);
    }
  }
  if (isPlainObject(value)) {
    const properties = schema.properties ?? {};
    for (const requiredKey of schema.required ?? []) {
      if (!Object.prototype.hasOwnProperty.call(value, requiredKey)) {
        errors.push(`${path}.${requiredKey}:required-missing`);
      }
    }
    for (const [key, childValue] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      if (properties[key]) {
        errors.push(...validateHostedAddressLoginJsonSchemaSubset(childValue, properties[key], childPath));
      } else if (schema.additionalProperties === false) {
        errors.push(`${childPath}:additional-property`);
      } else if (typeof schema.additionalProperties === 'object') {
        errors.push(...validateHostedAddressLoginJsonSchemaSubset(childValue, schema.additionalProperties, childPath));
      }
    }
  }

  return errors;
}

export function validateHostedAddressLoginFixtureAgainstSchema(
  fixture: unknown,
  schema: HostedAddressLoginJsonSchemaSubset,
): string[] {
  return validateHostedAddressLoginJsonSchemaSubset(fixture, schema);
}

export function validateHostedAddressLoginCallbackContract(fixtures: HostedAddressLoginFixtureSet): string[] {
  const errors: string[] = [];
  const contract = fixtures.callbackContract;

  if (!contract) return ['missing-callback-contract'];
  if (contract.version !== VEYGRIT_ADDRESS_LOGIN_CALLBACK_CONTRACT_VERSION) errors.push('callback-contract-version-mismatch');
  if (!sameJson(contract.canonicalParams, [...VEYGRIT_ADDRESS_LOGIN_CANONICAL_CALLBACK_PARAMS])) errors.push('callback-contract-canonical-params-mismatch');
  if (!sameJson(contract.aliases, VEYGRIT_ADDRESS_LOGIN_CALLBACK_PARAM_ALIASES)) errors.push('callback-contract-aliases-mismatch');
  if (!sameJson(contract.forbiddenParams, [...VEYGRIT_ADDRESS_LOGIN_FORBIDDEN_CALLBACK_PARAM_EXAMPLES])) errors.push('callback-contract-forbidden-params-mismatch');
  if (!sameJson(contract.nonClaims, [...VEYGRIT_ADDRESS_LOGIN_CALLBACK_NON_CLAIMS])) errors.push('callback-contract-non-claims-mismatch');
  if (!fixtures.testVectorResult.callbackContract || !sameJson(fixtures.testVectorResult.callbackContract, contract)) {
    errors.push('test-vector-callback-contract-mismatch');
  }

  return errors;
}

export function validateHostedAddressLoginCallbackValidationVectors(fixtures: HostedAddressLoginFixtureSet): string[] {
  const errors: string[] = [];
  const vectors = fixtures.callbackValidationVectors ?? [];

  if (!sameJson(fixtures.testVectorResult.callbackValidationVectors, vectors)) {
    errors.push('test-vector-callback-validation-vectors-mismatch');
  }
  if (!vectors.some(vector => vector.expectedResult === 'accepted')) errors.push('missing-callback-accepted-vector');
  if (!vectors.some(vector => vector.expectedError === 'state_mismatch')) errors.push('missing-callback-state-mismatch-negative');
  if (!vectors.some(vector => vector.expectedError === 'forbidden_callback_param')) errors.push('missing-callback-forbidden-param-negative');
  if (!vectors.some(vector =>
    vector.id === 'callback_private_material_param_negative'
    && vector.expectedError === 'forbidden_callback_param'
    && Object.prototype.hasOwnProperty.call(vector.input, 'private_key')
    && Object.prototype.hasOwnProperty.call(vector.input, 'proof_secret')
  )) {
    errors.push('missing-callback-private-material-negative');
  }
  if (!vectors.some(vector =>
    vector.id === 'callback_forbidden_value_negative'
    && vector.expectedError === 'forbidden_callback_param'
    && vector.input.credential_ref === 'proof_secret_fixture_value'
  )) {
    errors.push('missing-callback-forbidden-value-negative');
  }
  if (!vectors.some(vector => vector.expectedError === 'missing_code')) errors.push('missing-callback-missing-code-negative');
  if (!vectors.some(vector => vector.expectedNormalizedParams?.proof_bundle_ref === 'proof_ref_synthetic_shipping_001')) {
    errors.push('missing-callback-proof-ref-alias-positive');
  }
  if (!vectors.some(vector => vector.expectedNormalizedParams?.carrier_handoff_ref === 'handoff_ref_synthetic_shipping_001')) {
    errors.push('missing-callback-handoff-ref-alias-positive');
  }

  for (const vector of vectors) {
    const result = validateVeygritAddressLoginCallbackParams(vector.input, vector.options);
    if (result.status !== vector.expectedResult) errors.push(`${vector.id}:callback-validation-result-mismatch`);
    if (vector.expectedError && !result.errors.includes(vector.expectedError)) {
      errors.push(`${vector.id}:missing-expected-error:${vector.expectedError}`);
    }
    if (!vector.expectedError && result.errors.length > 0) {
      errors.push(`${vector.id}:unexpected-callback-validation-error:${result.errors.join(',')}`);
    }
    for (const [key, value] of Object.entries(vector.expectedNormalizedParams ?? {})) {
      if (result.normalizedParams[key as keyof typeof result.normalizedParams] !== value) {
        errors.push(`${vector.id}:normalized-param-mismatch:${key}`);
      }
    }
    if (vector.safeInputs.length < 2) errors.push(`${vector.id}:missing-safe-inputs`);
    if (/raw address lines|recipient contact data|proof witnesses|proof secrets|private keys|production credentials/i.test(vector.safeInputs.join(' '))) {
      errors.push(`${vector.id}:safe-inputs-claim-private-material`);
    }
  }

  return errors;
}

export function validateHostedAddressLoginWebhookContract(fixtures: HostedAddressLoginFixtureSet): string[] {
  const errors: string[] = [];
  const contract = fixtures.webhookContract;

  if (!contract) return ['missing-webhook-contract'];
  if (contract.algorithm !== 'hmac-sha256') errors.push('webhook-contract-algorithm-mismatch');
  if (contract.signatureHeader !== 'x-veygrit-signature') errors.push('webhook-contract-signature-header-mismatch');
  if (contract.timestampHeader !== 'x-veygrit-timestamp') errors.push('webhook-contract-timestamp-header-mismatch');
  if (contract.replayWindowSeconds !== 300) errors.push('webhook-contract-replay-window-mismatch');
  if (contract.signedPayload !== 'timestamp.payloadText') errors.push('webhook-contract-signed-payload-mismatch');
  if (contract.eventIdIdempotencyRequired !== true) errors.push('webhook-contract-idempotency-required');
  const keyIds = Array.isArray(contract.keyIds) ? contract.keyIds : [];
  const keyLifecycle = Array.isArray(contract.keyLifecycle) ? contract.keyLifecycle : [];
  if (keyIds.length === 0) errors.push('webhook-contract-missing-key-ids');
  if (keyLifecycle.length === 0) errors.push('webhook-contract-missing-key-lifecycle');
  if (!keyIds.includes('whkey_fixture_2026_07')) errors.push('webhook-contract-missing-primary-key-id');
  if (!keyIds.includes('whkey_fixture_2026_08')) errors.push('webhook-contract-missing-rotated-key-id');
  if (!keyIds.includes('whkey_fixture_2026_06')) errors.push('webhook-contract-missing-retired-key-id');
  if (!keyLifecycle.some(key => key.keyId === 'whkey_fixture_2026_07' && key.status === 'active')) {
    errors.push('webhook-contract-primary-key-not-active');
  }
  if (!keyLifecycle.some(key => key.keyId === 'whkey_fixture_2026_08' && key.status === 'active')) {
    errors.push('webhook-contract-rotated-key-not-active');
  }
  if (!keyLifecycle.some(key => key.keyId === 'whkey_fixture_2026_06' && key.status === 'retired')) {
    errors.push('webhook-contract-retired-key-not-retired');
  }
  if (!contract.nonClaims.some(nonClaim => /not address truth/i.test(nonClaim))) errors.push('webhook-contract-missing-address-truth-non-claim');
  if (!contract.nonClaims.some(nonClaim => /delivery success/i.test(nonClaim))) errors.push('webhook-contract-missing-delivery-non-claim');
  if (!fixtures.testVectorResult.webhookContract || !sameJson(fixtures.testVectorResult.webhookContract, contract)) {
    errors.push('test-vector-webhook-contract-mismatch');
  }

  const vectors = fixtures.webhookTestVectors ?? [];
  if (!sameJson(fixtures.testVectorResult.webhookVectors, vectors)) errors.push('test-vector-webhook-vectors-mismatch');
  if (!vectors.some(vector => vector.expectedResult === 'accepted')) errors.push('missing-webhook-accepted-vector');
  if (!vectors.some(vector => vector.expectedError === 'signature_mismatch')) errors.push('missing-webhook-signature-mismatch-negative');
  if (!vectors.some(vector => vector.expectedError === 'duplicate_event_id')) errors.push('missing-webhook-duplicate-event-negative');
  if (!vectors.some(vector => vector.expectedError === 'timestamp_replay')) errors.push('missing-webhook-timestamp-replay-negative');
  if (!vectors.some(vector => vector.expectedError === 'retired_key')) errors.push('missing-webhook-retired-key-negative');
  if (!vectors.some(vector => vector.id === 'webhook_rotated_key_valid' && vector.keyId === 'whkey_fixture_2026_08')) {
    errors.push('missing-webhook-rotated-key-positive');
  }

  const keyStatusById = new Map(keyLifecycle.map(key => [key.keyId, key.status]));
  const acceptedEventIds = new Set(vectors.filter(vector => vector.expectedResult === 'accepted').map(vector => vector.eventId));
  for (const vector of vectors) {
    if (!vector.eventId) errors.push(`${vector.id}:missing-event-id`);
    if (!vector.payloadFingerprint) errors.push(`${vector.id}:missing-payload-fingerprint`);
    if (!keyIds.includes(vector.keyId)) errors.push(`${vector.id}:unknown-webhook-key-id`);
    if (!vector.signatureHeader.includes(`kid=${vector.keyId}`)) errors.push(`${vector.id}:missing-kid-signature-header`);
    if (!vector.signatureHeader.includes('v1=')) errors.push(`${vector.id}:missing-v1-signature-header`);
    if (!vector.safeInputs.includes('payloadFingerprint')) errors.push(`${vector.id}:missing-safe-payload-fingerprint-input`);
    if (!vector.safeInputs.includes('keyId')) errors.push(`${vector.id}:missing-safe-key-id-input`);
    if (vector.expectedError === 'retired_key' && keyStatusById.get(vector.keyId) !== 'retired') {
      errors.push(`${vector.id}:retired-key-negative-must-use-retired-key`);
    }
    if (vector.expectedError === 'duplicate_event_id' && !acceptedEventIds.has(vector.eventId)) {
      errors.push(`${vector.id}:duplicate-event-negative-must-reuse-accepted-event-id`);
    }
  }

  return errors;
}

export function buildHostedAddressLoginMerchantVisibleRedactionDisplayContractFromCore(
  sourceContract: HostedAddressLoginMerchantVisibleRedactionSourceContract,
  hostedRefs: HostedAddressLoginMerchantVisibleRedactionHostedRefs,
): HostedAddressLoginMerchantVisibleRedactionDisplayContract {
  const displayRefsByField = Object.fromEntries(
    sourceContract.displayFields.map(field => [field, hostedRefs[field]]),
  ) as HostedAddressLoginMerchantVisibleRedactionHostedRefs;

  return {
    sourceFixture: HOSTED_ADDRESS_LOGIN_MERCHANT_VISIBLE_REDACTION_SOURCE_FIXTURE,
    sdkPackage: sourceContract.sdkPackage,
    sdkHelper: sourceContract.sdkHelper,
    example: sourceContract.example,
    boundaryGateId: sourceContract.boundaryGateId,
    displayFields: [...sourceContract.displayFields],
    displayRefsByField,
    requiredNextAction: sourceContract.requiredNextAction,
    blockedClassCount: sourceContract.blockedClassCount,
    nonClaimCount: sourceContract.nonClaimCount,
    renderedMaterialPolicy: {
      copyBlockedMaterialNames: sourceContract.renderedMaterialPolicy.copyBlockedMaterialNames,
      copyNonClaimText: sourceContract.renderedMaterialPolicy.copyNonClaimText,
      showCountsOnly: sourceContract.renderedMaterialPolicy.showCountsOnly,
    },
  };
}

export function buildExpectedHostedAddressLoginMerchantVisibleRedactionDisplayContract(
  fixtures: HostedAddressLoginFixtureSet,
  sourceContract: HostedAddressLoginMerchantVisibleRedactionSourceContract,
): HostedAddressLoginMerchantVisibleRedactionDisplayContract {
  const shippingResult = fixtures.addressLoginResults.find(result => result.id === 'result_shipping_carrier_decryptable');
  if (!shippingResult) {
    throw new Error('missing-shipping-result');
  }
  if (!shippingResult.encryptedForCarrierRef) {
    throw new Error('missing-carrier-handoff-ref');
  }

  const guestCheckoutAlias = fixtures.merchantVisibleRedactionHostedRefSource.guestCheckoutAlias;
  if (!guestCheckoutAlias.startsWith('guest_checkout_alias_synthetic_')) {
    throw new Error('guest-checkout-alias-not-synthetic');
  }

  return buildHostedAddressLoginMerchantVisibleRedactionDisplayContractFromCore(sourceContract, {
    pairwiseSubjectAlias: shippingResult.subjectAlias,
    guestCheckoutAlias,
    walletConsentRef: shippingResult.consentEnvelopeRef,
    addressCredentialRef: shippingResult.credentialRef,
    carrierHandoffRef: shippingResult.encryptedForCarrierRef,
  });
}

export function checkHostedAddressLoginMerchantVisibleRedactionContractSync(
  fixtures: HostedAddressLoginFixtureSet,
  sourceContract: HostedAddressLoginMerchantVisibleRedactionSourceContract,
): HostedAddressLoginMerchantVisibleRedactionSyncResult {
  const errors: string[] = [];
  let expectedContract: HostedAddressLoginMerchantVisibleRedactionDisplayContract | undefined;

  try {
    expectedContract = buildExpectedHostedAddressLoginMerchantVisibleRedactionDisplayContract(fixtures, sourceContract);
    if (!sameJson(fixtures.merchantVisibleRedactionDisplayContract, expectedContract)) {
      errors.push('root-contract-drift');
    }
    if (!sameJson(fixtures.testVectorResult.merchantVisibleRedactionDisplayContract, expectedContract)) {
      errors.push('test-vector-contract-drift');
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return {
    status: errors.length === 0 ? 'pass' : 'fail',
    errors,
    expectedContract,
  };
}

export function validateHostedAddressLoginMerchantVisibleRedactionDisplayContract(fixtures: HostedAddressLoginFixtureSet): string[] {
  const errors: string[] = [];
  const contract = fixtures.merchantVisibleRedactionDisplayContract;
  const shippingResult = fixtures.addressLoginResults.find(result => result.id === 'result_shipping_carrier_decryptable');

  if (!contract) return ['missing-merchant-visible-redaction-display-contract'];
  if (contract.sourceFixture !== HOSTED_ADDRESS_LOGIN_MERCHANT_VISIBLE_REDACTION_SOURCE_FIXTURE) {
    errors.push('merchant-visible-redaction-source-fixture-mismatch');
  }
  if (contract.sdkPackage !== HOSTED_ADDRESS_LOGIN_MERCHANT_VISIBLE_REDACTION_SDK_PACKAGE) {
    errors.push('merchant-visible-redaction-sdk-package-mismatch');
  }
  if (contract.sdkHelper !== HOSTED_ADDRESS_LOGIN_MERCHANT_VISIBLE_REDACTION_SDK_HELPER) {
    errors.push('merchant-visible-redaction-sdk-helper-mismatch');
  }
  if (contract.example !== HOSTED_ADDRESS_LOGIN_MERCHANT_VISIBLE_REDACTION_EXAMPLE) {
    errors.push('merchant-visible-redaction-example-mismatch');
  }
  if (contract.boundaryGateId !== 'merchant-visible-redaction') {
    errors.push('merchant-visible-redaction-boundary-gate-mismatch');
  }
  if (!sameJson(contract.displayFields, [...HOSTED_ADDRESS_LOGIN_MERCHANT_VISIBLE_REDACTION_DISPLAY_FIELDS])) {
    errors.push('merchant-visible-redaction-display-fields-mismatch');
  }
  if (contract.requiredNextAction !== 'create-guest-order-from-refs') {
    errors.push('merchant-visible-redaction-next-action-mismatch');
  }
  if (contract.blockedClassCount !== 7) errors.push('merchant-visible-redaction-blocked-count-mismatch');
  if (contract.nonClaimCount !== 1) errors.push('merchant-visible-redaction-non-claim-count-mismatch');
  if (contract.renderedMaterialPolicy.copyBlockedMaterialNames !== false) {
    errors.push('merchant-visible-redaction-copy-blocked-material-policy-mismatch');
  }
  if (contract.renderedMaterialPolicy.copyNonClaimText !== false) {
    errors.push('merchant-visible-redaction-copy-non-claim-policy-mismatch');
  }
  if (contract.renderedMaterialPolicy.showCountsOnly !== true) {
    errors.push('merchant-visible-redaction-show-counts-policy-mismatch');
  }

  const displayRefs = contract.displayFields.map(field => [field, contract.displayRefsByField[field]] as const);
  for (const [field, ref] of displayRefs) {
    if (!ref) errors.push(`merchant-visible-redaction-missing-display-ref:${field}`);
    if (ref && HOSTED_ADDRESS_LOGIN_MERCHANT_VISIBLE_UNSAFE_REF_VALUE.test(ref)) {
      errors.push(`merchant-visible-redaction-unsafe-display-ref:${field}`);
    }
  }
  if (new Set(displayRefs.map(([, ref]) => ref)).size !== displayRefs.length) {
    errors.push('merchant-visible-redaction-display-refs-not-unique');
  }

  if (!shippingResult) {
    errors.push('merchant-visible-redaction-missing-shipping-result');
  } else {
    if (contract.displayRefsByField.pairwiseSubjectAlias !== shippingResult.subjectAlias) {
      errors.push('merchant-visible-redaction-pairwise-subject-ref-mismatch');
    }
    if (contract.displayRefsByField.walletConsentRef !== shippingResult.consentEnvelopeRef) {
      errors.push('merchant-visible-redaction-wallet-consent-ref-mismatch');
    }
    if (contract.displayRefsByField.addressCredentialRef !== shippingResult.credentialRef) {
      errors.push('merchant-visible-redaction-address-credential-ref-mismatch');
    }
    if (contract.displayRefsByField.carrierHandoffRef !== shippingResult.encryptedForCarrierRef) {
      errors.push('merchant-visible-redaction-carrier-handoff-ref-mismatch');
    }
  }
  if (!contract.displayRefsByField.guestCheckoutAlias.startsWith('guest_checkout_alias_synthetic_')) {
    errors.push('merchant-visible-redaction-guest-checkout-alias-not-synthetic');
  }
  if (fixtures.merchantVisibleRedactionHostedRefSource.source !== 'hosted-address-login-synthetic-flow-refs-v0.1') {
    errors.push('merchant-visible-redaction-hosted-ref-source-id-mismatch');
  }
  if (!fixtures.merchantVisibleRedactionHostedRefSource.guestCheckoutAlias.startsWith('guest_checkout_alias_synthetic_')) {
    errors.push('merchant-visible-redaction-hosted-ref-source-guest-alias-not-synthetic');
  }
  if (contract.displayRefsByField.guestCheckoutAlias !== fixtures.merchantVisibleRedactionHostedRefSource.guestCheckoutAlias) {
    errors.push('merchant-visible-redaction-guest-checkout-source-mismatch');
  }
  if (fixtures.merchantVisibleRedactionHostedRefSource.nonClaims.length < 2) {
    errors.push('merchant-visible-redaction-hosted-ref-source-non-claims-missing');
  }
  if (!fixtures.testVectorResult.merchantVisibleRedactionDisplayContract || !sameJson(fixtures.testVectorResult.merchantVisibleRedactionDisplayContract, contract)) {
    errors.push('test-vector-merchant-visible-redaction-display-contract-mismatch');
  }

  return errors;
}

export function buildHostedAddressLoginMerchantVisibleRedactionCopyPayload(
  contract: HostedAddressLoginMerchantVisibleRedactionDisplayContract,
): HostedAddressLoginMerchantVisibleRedactionCopyPayload {
  const displayRefs = Object.fromEntries(
    contract.displayFields.map(field => [field, contract.displayRefsByField[field]]),
  ) as Record<HostedAddressLoginMerchantVisibleRedactionDisplayField, string>;
  const counts = {
    visibleRefs: contract.displayFields.length,
    blockedClasses: contract.blockedClassCount,
    nonClaims: contract.nonClaimCount,
  };

  return {
    label: 'Hosted redaction safe refs',
    buttonLabel: 'Copy safe refs',
    successLabel: 'Copied safe refs',
    clipboardText: [
      `visibleRefs: ${counts.visibleRefs}`,
      `blockedClasses: ${counts.blockedClasses}`,
      `nonClaims: ${counts.nonClaims}`,
      ...contract.displayFields.map(field => `${field}: ${displayRefs[field]}`),
    ].join('\n'),
    localOnly: true,
    productionTraffic: false,
    countsOnly: contract.renderedMaterialPolicy.showCountsOnly,
    counts,
    displayRefs,
  };
}

export async function copyHostedAddressLoginMerchantVisibleRedactionClipboardPayload(
  copyPayload: HostedAddressLoginMerchantVisibleRedactionCopyPayload,
  writeText: (text: string) => void | Promise<void>,
): Promise<HostedAddressLoginMerchantVisibleRedactionClipboardCopyResult> {
  await writeText(copyPayload.clipboardText);

  return {
    status: 'copied',
    successLabel: copyPayload.successLabel,
    localOnly: copyPayload.localOnly,
    productionTraffic: copyPayload.productionTraffic,
    countsOnly: copyPayload.countsOnly,
    counts: copyPayload.counts,
    clipboardTextLength: copyPayload.clipboardText.length,
  };
}

export function buildHostedAddressLoginPublicTestVectorResult(fixtures: HostedAddressLoginFixtureSet): HostedAddressLoginPublicTestVectorResult {
  const { endpoint: _endpoint, ...publicResult } = fixtures.testVectorResult;
  return {
    ...publicResult,
    scenarioVectors: fixtures.friendDeliveryMerchantScenarios.map(scenario => ({
      id: scenario.id,
      purpose: scenario.purpose,
      disclosureMode: scenario.disclosureMode,
      checkedRefs: [
        scenario.friendAlias,
        scenario.friendDeliveryRequestRef,
        scenario.approvalRef,
        scenario.carrierHandoffRef,
        scenario.deliveryReceiptRef,
      ],
      steps: scenario.steps,
      expectedNextAction: 'carrier_handoff',
    })),
  };
}

export function buildHostedAddressLoginWebhookKeyRotationRunbook(
  fixtures: HostedAddressLoginFixtureSet,
): HostedAddressLoginWebhookKeyRotationRunbook {
  const contract = fixtures.webhookContract;
  const keyLifecycle = Array.isArray(contract.keyLifecycle) ? contract.keyLifecycle : [];
  const activeKeys = keyLifecycle.filter(key => key.status === 'active');
  const retiredKeys = keyLifecycle.filter(key => key.status === 'retired');
  const rotatedVector = fixtures.webhookTestVectors.find(vector => vector.id === 'webhook_rotated_key_valid');
  const retiredVector = fixtures.webhookTestVectors.find(vector => vector.expectedError === 'retired_key');
  const overlapSeconds = maxActiveKeyOverlapSeconds(activeKeys);
  const errors: string[] = [];

  if (activeKeys.length < 2) errors.push('key-rotation-runbook-needs-two-active-overlap-keys');
  if (retiredKeys.length < 1) errors.push('key-rotation-runbook-needs-retired-key');
  if (overlapSeconds < contract.replayWindowSeconds) errors.push('key-rotation-overlap-shorter-than-replay-window');
  if (!rotatedVector) errors.push('key-rotation-runbook-missing-rotated-positive-vector');
  if (!retiredVector) errors.push('key-rotation-runbook-missing-retired-negative-vector');
  if (rotatedVector && !activeKeys.some(key => key.keyId === rotatedVector.keyId)) {
    errors.push('key-rotation-rotated-vector-must-use-active-key');
  }
  if (retiredVector && !retiredKeys.some(key => key.keyId === retiredVector.keyId)) {
    errors.push('key-rotation-retired-vector-must-use-retired-key');
  }

  return {
    version: 'veygrit-webhook-key-rotation-runbook-v0.1',
    activeKeyIds: activeKeys.map(key => key.keyId).sort(),
    retiredKeyIds: retiredKeys.map(key => key.keyId).sort(),
    overlapSeconds,
    phases: [
      'publish-active-key-lifecycle',
      'notify-merchants-before-overlap',
      'accept-current-and-next-active-key-during-overlap',
      'reject-retired-key-even-when-hmac-matches',
      'audit-redacted-webhook-rollout-with-event-id-idempotency',
    ],
    evidenceVectorIds: [rotatedVector?.id, retiredVector?.id].filter((id): id is string => Boolean(id)),
    errors,
  };
}

export function runHostedAddressLoginSyntheticSmoke(fixtures: HostedAddressLoginFixtureSet): HostedAddressLoginSyntheticSmokeResult {
  const errors: string[] = [];
  const warnings = [...(fixtures.testVectorResult.warnings ?? [])];
  const checkedFlows: string[] = [];

  if (fixtures.fixtureSet !== fixtures.testVectorResult.fixtureSet) {
    errors.push('fixture-set-mismatch');
  }
  if (!fixtures.nonClaims.some(nonClaim => /not production data/i.test(nonClaim))) {
    errors.push('missing-production-data-non-claim');
  }
  errors.push(...validateHostedAddressLoginFixtureRedaction(fixtures));
  errors.push(...validateHostedAddressLoginCallbackContract(fixtures));
  errors.push(...validateHostedAddressLoginCallbackValidationVectors(fixtures));
  errors.push(...validateHostedAddressLoginWebhookContract(fixtures));
  const merchantVisibleRedactionErrors = validateHostedAddressLoginMerchantVisibleRedactionDisplayContract(fixtures);
  errors.push(...merchantVisibleRedactionErrors);
  if (merchantVisibleRedactionErrors.length === 0) checkedFlows.push('merchant-visible-redaction-display-contract');

  const shippingAuth = fixtures.authorizeRequests.find(vector => vector.disclosureMode === 'carrier_decryptable');
  const proofOnlyAuth = fixtures.authorizeRequests.find(vector => vector.disclosureMode === 'proof_only');
  const shippingResult = fixtures.addressLoginResults.find(vector => vector.nextAction === 'carrier_handoff');
  const proofOnlyResult = fixtures.addressLoginResults.find(vector => vector.nextAction === 'continue_checkout');
  const friendDeliveryRequest = fixtures.friendDeliveryRequests?.[0];
  const friendDeliveryRequestResult = fixtures.friendDeliveryRequestResults?.[0];
  const friendDeliveryApproval = fixtures.friendDeliveryApprovals?.[0];
  const friendDeliveryApprovalResult = fixtures.friendDeliveryApprovalResults?.[0];
  const friendDeliveryMerchantScenario = fixtures.friendDeliveryMerchantScenarios?.[0];

  if (!shippingAuth) errors.push('missing-carrier-decryptable-authorize-vector');
  if (!proofOnlyAuth) errors.push('missing-proof-only-authorize-vector');
  if (!shippingResult) errors.push('missing-carrier-handoff-result');
  if (!proofOnlyResult) errors.push('missing-proof-only-result');
  if (!friendDeliveryRequest) errors.push('missing-friend-delivery-request');
  if (!friendDeliveryRequestResult) errors.push('missing-friend-delivery-request-result');
  if (!friendDeliveryApproval) errors.push('missing-friend-delivery-approval');
  if (!friendDeliveryApprovalResult) errors.push('missing-friend-delivery-approval-result');
  if (!friendDeliveryMerchantScenario) errors.push('missing-friend-delivery-merchant-scenario');

  if (shippingAuth && !hasAllClaims(shippingAuth.requestedClaims, ['address_credential_valid', 'deliverable', 'not_revoked', 'freshness', 'device_bound', 'carrier_decryptable_address'])) {
    errors.push('carrier-decryptable-authorize-missing-required-claims');
  }
  if (proofOnlyAuth && !hasAllClaims(proofOnlyAuth.requestedClaims, ['address_credential_valid', 'country', 'quality_threshold', 'not_revoked', 'freshness', 'device_bound'])) {
    errors.push('proof-only-authorize-missing-required-claims');
  }

  for (const auth of [shippingAuth, proofOnlyAuth].filter(Boolean) as HostedAddressLoginAuthorizeVector[]) {
    const tokenRequest = fixtures.tokenRequests.find(vector => vector.clientId === auth.clientId && vector.redirectUri === auth.redirectUri);
    if (!tokenRequest) errors.push(`${auth.id}:missing-token-request`);
    if (auth.codeChallengeMethod !== 'S256') errors.push(`${auth.id}:pkce-method-not-s256`);
    if (!auth.state || !auth.nonce) errors.push(`${auth.id}:missing-state-or-nonce`);
  }

  for (const result of [shippingResult, proofOnlyResult].filter(Boolean) as HostedAddressLoginResultVector[]) {
    const verifyRequest = fixtures.proofVerifyRequests.find(vector =>
      vector.proofBundleRef === result.proofBundleRef
      && vector.credentialRef === result.credentialRef
      && vector.consentEnvelopeRef === result.consentEnvelopeRef
    );
    const verifyResult = fixtures.proofVerifyResults.find(vector => vector.proofBundleRef === result.proofBundleRef);
    if (!verifyRequest) errors.push(`${result.id}:missing-proof-verify-request`);
    if (!verifyResult) errors.push(`${result.id}:missing-proof-verify-result`);
    if (verifyResult && (!verifyResult.verified || verifyResult.status !== 'valid')) {
      errors.push(`${result.id}:proof-not-valid`);
    }
  }

  if (shippingResult) {
    const carrierRequest = fixtures.carrierDecryptRequests.find(vector =>
      vector.consentEnvelopeRef === shippingResult.consentEnvelopeRef
      && vector.encryptedForCarrierRef === shippingResult.encryptedForCarrierRef
      && vector.purpose === 'shipping'
    );
    const carrierResult = carrierRequest
      ? fixtures.carrierDecryptResults.find(vector =>
        vector.carrierId === carrierRequest.carrierId
        && vector.deliverySessionRef === carrierRequest.deliverySessionRef
        && vector.authorized
      )
      : undefined;
    if (!shippingResult.encryptedForCarrierRef) errors.push('carrier-handoff-result-missing-encrypted-ref');
    if (!carrierRequest) errors.push('missing-carrier-decrypt-request');
    if (!carrierResult) errors.push('missing-carrier-decrypt-result');
    if (carrierResult && !carrierResult.handoffReceiptRef) errors.push('carrier-result-missing-handoff-receipt');
    checkedFlows.push('carrier-decryptable-shipping');
  }

  if (proofOnlyResult) {
    if (proofOnlyResult.encryptedForCarrierRef) errors.push('proof-only-result-must-not-include-carrier-encrypted-ref');
    checkedFlows.push('proof-only-identity');
  }

  if (friendDeliveryRequest && friendDeliveryRequestResult && friendDeliveryApproval && friendDeliveryApprovalResult) {
    if (friendDeliveryRequest.purpose !== 'anonymous_shipping') errors.push('friend-delivery-purpose-must-be-anonymous-shipping');
    if (friendDeliveryRequest.disclosureMode !== 'carrier_decryptable') errors.push('friend-delivery-disclosure-must-be-carrier-decryptable');
    if (!hasAllClaims(friendDeliveryRequest.requestedClaims, ['address_credential_valid', 'user_approved', 'deliverable', 'not_revoked', 'freshness', 'carrier_decryptable_address'])) {
      errors.push('friend-delivery-request-missing-required-claims');
    }
    if (friendDeliveryRequestResult.status !== 'notified') errors.push('friend-delivery-request-result-must-notify');
    if (friendDeliveryApproval.friendDeliveryRequestRef !== friendDeliveryRequestResult.friendDeliveryRequestRef) {
      errors.push('friend-delivery-approval-ref-mismatch');
    }
    if (friendDeliveryApprovalResult.friendDeliveryRequestRef !== friendDeliveryApproval.friendDeliveryRequestRef) {
      errors.push('friend-delivery-approval-result-ref-mismatch');
    }
    if (!friendDeliveryApprovalResult.carrierHandoffRef) errors.push('friend-delivery-approval-result-missing-carrier-handoff-ref');
    if (!friendDeliveryApprovalResult.deliveryReceiptRef) errors.push('friend-delivery-approval-result-missing-delivery-receipt-ref');
    checkedFlows.push('friend-delivery-sso-approval');
  }

  if (friendDeliveryMerchantScenario && friendDeliveryRequest && friendDeliveryRequestResult && friendDeliveryApproval && friendDeliveryApprovalResult) {
    errors.push(...validateFriendDeliveryMerchantScenarioVector(
      friendDeliveryMerchantScenario,
      friendDeliveryRequest,
      friendDeliveryRequestResult,
      friendDeliveryApproval,
      friendDeliveryApprovalResult,
    ));
    checkedFlows.push('friend-delivery-merchant-scenario');
  }

  for (const request of fixtures.consentRevocationRequests) {
    const result = fixtures.consentRevocationResults.find(vector =>
      vector.consentEnvelopeRef === request.consentEnvelopeRef
      && vector.status === 'revoked'
      && vector.revoked
    );
    if (!result) errors.push(`${request.id}:missing-revoked-result`);
  }

  const endpoints = Array.from(new Set([
    ...fixtures.authorizeRequests,
    ...fixtures.tokenRequests,
    ...fixtures.addressLoginResults,
    ...fixtures.proofVerifyRequests,
    ...fixtures.proofVerifyResults,
    ...fixtures.carrierDecryptRequests,
    ...fixtures.carrierDecryptResults,
    ...fixtures.friendDeliveryRequests,
    ...fixtures.friendDeliveryRequestResults,
    ...fixtures.friendDeliveryApprovals,
    ...fixtures.friendDeliveryApprovalResults,
    ...fixtures.friendDeliveryMerchantScenarios,
    ...fixtures.consentRevocationRequests,
    ...fixtures.consentRevocationResults,
    ...fixtures.webhookTestVectors,
    fixtures.testVectorResult,
  ].map(vector => vector.endpoint))).sort();

  return {
    status: errors.length === 0 ? 'pass' : 'fail',
    checkedFlows,
    endpoints,
    proofBundleRefs: fixtures.addressLoginResults.map(result => result.proofBundleRef),
    handoffReceiptRefs: fixtures.carrierDecryptResults.map(result => result.handoffReceiptRef),
    errors,
    warnings,
  };
}

function validateFriendDeliveryMerchantScenarioVector(
  scenario: HostedAddressLoginFriendDeliveryMerchantScenarioVector,
  request: HostedAddressLoginFriendDeliveryRequestVector,
  requestResult: HostedAddressLoginFriendDeliveryRequestResultVector,
  approval: HostedAddressLoginFriendDeliveryApprovalVector,
  approvalResult: HostedAddressLoginFriendDeliveryApprovalResultVector,
): string[] {
  const errors: string[] = [];
  const refs = new Set(scenario.steps.flatMap(step => [...step.inputRefs, ...step.outputRefs]));

  if (scenario.purpose !== 'anonymous_shipping') errors.push(`${scenario.id}:purpose-not-anonymous-shipping`);
  if (scenario.disclosureMode !== 'carrier_decryptable_preferred') errors.push(`${scenario.id}:disclosure-not-carrier-decryptable-preferred`);
  if (scenario.purchaserSubjectAlias !== request.purchaserSubjectAlias) errors.push(`${scenario.id}:purchaser-alias-mismatch`);
  if (scenario.friendAlias !== request.friendAlias || scenario.friendAlias !== requestResult.friendAlias) errors.push(`${scenario.id}:friend-alias-mismatch`);
  if (scenario.cartRef !== request.cartRef) errors.push(`${scenario.id}:cart-ref-mismatch`);
  if (scenario.friendDeliveryRequestRef !== requestResult.friendDeliveryRequestRef) errors.push(`${scenario.id}:request-ref-mismatch`);
  if (scenario.friendDeliveryRequestRef !== approval.friendDeliveryRequestRef) errors.push(`${scenario.id}:approval-request-ref-mismatch`);
  if (scenario.friendDeliveryRequestRef !== approvalResult.friendDeliveryRequestRef) errors.push(`${scenario.id}:approval-result-request-ref-mismatch`);
  if (scenario.notificationRef !== requestResult.notificationRef) errors.push(`${scenario.id}:notification-ref-mismatch`);
  if (scenario.approvalRef !== approval.approvalRef || scenario.approvalRef !== approvalResult.approvalRef) errors.push(`${scenario.id}:approval-ref-mismatch`);
  if (scenario.selectedAddressRef !== approval.selectedAddressRef) errors.push(`${scenario.id}:selected-address-ref-mismatch`);
  if (scenario.consentEnvelopeRef !== approval.consentEnvelopeRef || scenario.consentEnvelopeRef !== requestResult.consentEnvelopeRef) {
    errors.push(`${scenario.id}:consent-envelope-ref-mismatch`);
  }
  if (scenario.carrierHandoffRef !== approvalResult.carrierHandoffRef) errors.push(`${scenario.id}:carrier-handoff-ref-mismatch`);
  if (scenario.deliveryReceiptRef !== approvalResult.deliveryReceiptRef) errors.push(`${scenario.id}:delivery-receipt-ref-mismatch`);

  for (const required of [
    scenario.purchaserSubjectAlias,
    scenario.friendAlias,
    scenario.cartRef,
    scenario.friendDeliveryRequestRef,
    scenario.notificationRef,
    scenario.approvalRef,
    scenario.selectedAddressRef,
    scenario.consentEnvelopeRef,
    scenario.carrierHandoffRef,
    scenario.deliveryReceiptRef,
  ]) {
    if (!refs.has(required)) errors.push(`${scenario.id}:unlinked-ref:${required}`);
  }

  if (!scenario.merchantVisibleRefs.includes(scenario.carrierHandoffRef)) errors.push(`${scenario.id}:merchant-visible-missing-carrier-handoff-ref`);
  if (!scenario.merchantVisibleRefs.includes(scenario.deliveryReceiptRef)) errors.push(`${scenario.id}:merchant-visible-missing-delivery-receipt-ref`);
  if (!scenario.purchaserNeverSees.includes('selectedAddressRef')) errors.push(`${scenario.id}:purchaser-never-sees-missing-selected-address-ref`);
  if (!scenario.purchaserNeverSees.includes('carrierHandoffRef')) errors.push(`${scenario.id}:purchaser-never-sees-missing-carrier-handoff-ref`);

  const approveIndex = scenario.steps.findIndex(step => step.id === 'wallet-approve');
  const handoffIndex = scenario.steps.findIndex(step => step.id === 'server-receive-handoff');
  if (approveIndex < 0 || handoffIndex < 0 || approveIndex > handoffIndex) errors.push(`${scenario.id}:handoff-before-approval`);

  const publicText = JSON.stringify({
    ...scenario,
    purchaserNeverSees: [],
  });
  if (/rawAddress|recipientPhone|proofWitness|privateKey|proofSecret|sk_live/i.test(publicText)) {
    errors.push(`${scenario.id}:contains-forbidden-material`);
  }

  return errors;
}

function maxActiveKeyOverlapSeconds(keys: HostedAddressLoginWebhookKey[]): number {
  let maxOverlap = 0;
  for (const left of keys) {
    for (const right of keys) {
      if (left.keyId >= right.keyId) continue;
      const overlapStart = Math.max(Date.parse(left.notBefore), Date.parse(right.notBefore));
      const overlapEnd = Math.min(Date.parse(left.notAfter), Date.parse(right.notAfter));
      if (Number.isFinite(overlapStart) && Number.isFinite(overlapEnd) && overlapEnd > overlapStart) {
        maxOverlap = Math.max(maxOverlap, Math.floor((overlapEnd - overlapStart) / 1000));
      }
    }
  }
  return maxOverlap;
}
