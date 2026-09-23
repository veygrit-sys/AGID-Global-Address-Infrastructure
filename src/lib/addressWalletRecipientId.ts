export const ADDRESS_WALLET_RECIPIENT_ID_VERSION = 'address-wallet-recipient-id-v0.1';

export type AddressWalletRecipientKind = 'self' | 'friend' | 'organization' | 'locker';

export type AddressWalletRecipientStatus = 'requires_consent' | 'active' | 'revoked';

export type AddressWalletRecipientNextAction =
  | 'request_recipient_consent'
  | 'create_shipment_intent'
  | 'do_not_use';

export type AddressWalletRecipientApiSurface = {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  safeInputs: string[];
  safeOutputs: string[];
  blockedMaterial: string[];
};

export type AddressWalletRecipientBridge = {
  target: 'Address Stripe ShipmentIntent' | 'Hexaship SDK' | 'Delivery Gateway Carrier Handoff';
  mapping: string;
  boundary: string;
};

export type AddressWalletRecipientIdSpec = {
  version: typeof ADDRESS_WALLET_RECIPIENT_ID_VERSION;
  productName: 'Address Wallet Recipient ID';
  thesis: string;
  idPrefixes: Record<AddressWalletRecipientKind, string>;
  lifecycle: AddressWalletRecipientStatus[];
  apiSurfaces: AddressWalletRecipientApiSurface[];
  bridges: AddressWalletRecipientBridge[];
  blockedMaterial: string[];
  nonClaims: string[];
};

export type CreateAddressWalletRecipientInput = {
  walletSubjectAlias: string;
  relationshipRef: string;
  deliveryPurpose: 'self_checkout' | 'friend_delivery' | 'business_shipping' | 'locker_delivery';
  recipientKind: AddressWalletRecipientKind;
  consentPolicyRef?: string;
  expiresAt?: string;
  createdAt?: string;
};

export type AddressWalletRecipientSandboxBody = {
  version: typeof ADDRESS_WALLET_RECIPIENT_ID_VERSION;
  recipient_id: string;
  recipient_kind: AddressWalletRecipientKind;
  wallet_subject_alias: string;
  relationship_ref: string;
  delivery_purpose: CreateAddressWalletRecipientInput['deliveryPurpose'];
  consent_policy_ref: string;
  status: AddressWalletRecipientStatus;
  required_next_action: AddressWalletRecipientNextAction;
  shipment_intent_bridge: {
    recipientTokenRef: string;
    allowedInputField: 'recipientTokenRef';
  };
  allowed_use: Array<'shipment-intent' | 'rate-quote' | 'carrier-handoff'>;
  expires_at: string;
  privacy: {
    contains_raw_address: false;
    production_traffic: false;
    carrier_credentials_present: false;
    log_safe: true;
  };
  blocked_material: string[];
  local_only: true;
  non_claims: string[];
};

export type CreateAddressWalletRecipientResponse =
  | {
      ok: true;
      status: 201;
      body: AddressWalletRecipientSandboxBody;
    }
  | {
      ok: false;
      status: 400;
      error: 'private_material_rejected' | 'bad_request';
      rejectedKeys?: string[];
      missingKeys?: string[];
    };

export const ADDRESS_WALLET_RECIPIENT_BLOCKED_MATERIAL = [
  'rawAddress',
  'raw_address',
  'addressLine1',
  'address_line_1',
  'addressLine2',
  'address_line_2',
  'postalCode',
  'recipientName',
  'recipientPhone',
  'recipient_phone',
  'privateDeliveryNotes',
  'private_access_notes',
  'proofWitness',
  'proof_witness',
  'proofSecret',
  'proof_secret',
  'privateKey',
  'private_key',
  'carrierApiKey',
  'carrier_api_key',
  'carrierCredential',
  'commercialRateSecret',
] as const;

export function buildAddressWalletRecipientIdSpec(): AddressWalletRecipientIdSpec {
  return {
    version: ADDRESS_WALLET_RECIPIENT_ID_VERSION,
    productName: 'Address Wallet Recipient ID',
    thesis:
      'Represent a delivery recipient as a scoped wallet ID so EC, apps, and Hexaship can create shipments without storing raw address material.',
    idPrefixes: {
      self: 'aw_rec_self',
      friend: 'aw_rec_friend',
      organization: 'aw_rec_org',
      locker: 'aw_rec_locker',
    },
    lifecycle: ['requires_consent', 'active', 'revoked'],
    apiSurfaces: [
      {
        id: 'create-recipient-id',
        method: 'POST',
        path: '/v1/wallet/recipients',
        safeInputs: ['walletSubjectAlias', 'relationshipRef', 'deliveryPurpose', 'recipientKind', 'consentPolicyRef', 'expiresAt'],
        safeOutputs: ['recipient_id', 'status', 'required_next_action', 'consent_policy_ref'],
        blockedMaterial: [...ADDRESS_WALLET_RECIPIENT_BLOCKED_MATERIAL],
      },
      {
        id: 'read-recipient-id',
        method: 'GET',
        path: '/v1/wallet/recipients/{recipient_id}',
        safeInputs: ['recipient_id', 'merchantAccountRef'],
        safeOutputs: ['recipient_id', 'recipient_kind', 'relationship_ref', 'status'],
        blockedMaterial: [...ADDRESS_WALLET_RECIPIENT_BLOCKED_MATERIAL],
      },
      {
        id: 'grant-recipient-consent',
        method: 'POST',
        path: '/v1/wallet/recipients/{recipient_id}/consent',
        safeInputs: ['recipient_id', 'walletConsentRef', 'purposeRef', 'expiresAt'],
        safeOutputs: ['recipient_id', 'walletConsentRef', 'status', 'required_next_action'],
        blockedMaterial: [...ADDRESS_WALLET_RECIPIENT_BLOCKED_MATERIAL],
      },
    ],
    bridges: [
      {
        target: 'Address Stripe ShipmentIntent',
        mapping: 'ShipmentIntent.recipientTokenRef = AddressWalletRecipient.recipient_id',
        boundary: 'ShipmentIntent may store the ID, but not the selected address, phone, proof witness, or carrier credential.',
      },
      {
        target: 'Hexaship SDK',
        mapping: 'hexaship.shipments.create({ recipientId, parcelProfileRef, walletConsentRef })',
        boundary: 'SDK calls must remain ref-first and local sandbox fixtures must not include carrier production payloads.',
      },
      {
        target: 'Delivery Gateway Carrier Handoff',
        mapping: 'Carrier adapters receive scoped handoff material only after consent and allocation gates pass.',
        boundary: 'DHL/UPS connectors are server-side adapters; merchant/client code never receives carrier API credentials.',
      },
    ],
    blockedMaterial: [...ADDRESS_WALLET_RECIPIENT_BLOCKED_MATERIAL],
    nonClaims: [
      'Recipient ID is not a raw address, proof of residence, legal identity credential, or carrier delivery guarantee.',
      'AddressQL validation is not wallet consent.',
      'A recipient ID alone does not authorize marketing use, resale, or long-term address retention.',
    ],
  };
}

function collectObjectKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(collectObjectKeys);
  const record = value as Record<string, unknown>;
  return [
    ...Object.keys(record),
    ...Object.values(record).flatMap(collectObjectKeys),
  ];
}

function stableStringify(value: unknown): string {
  if (!value || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
}

function stableRef(prefix: string, value: unknown): string {
  const json = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < json.length; index += 1) {
    hash ^= json.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function isRecipientKind(value: unknown): value is AddressWalletRecipientKind {
  return value === 'self' || value === 'friend' || value === 'organization' || value === 'locker';
}

function normalizeRecipientKind(value: unknown): AddressWalletRecipientKind {
  return isRecipientKind(value) ? value : 'friend';
}

export function createAddressWalletRecipientSandbox(input: Record<string, unknown>): CreateAddressWalletRecipientResponse {
  const keys = new Set(collectObjectKeys(input));
  const rejectedKeys = ADDRESS_WALLET_RECIPIENT_BLOCKED_MATERIAL.filter(key => keys.has(key));
  if (rejectedKeys.length > 0) {
    return {
      ok: false,
      status: 400,
      error: 'private_material_rejected',
      rejectedKeys,
    };
  }

  const missingKeys = ['walletSubjectAlias', 'relationshipRef', 'deliveryPurpose']
    .filter(key => typeof input[key] !== 'string' || (input[key] as string).length === 0);
  if (missingKeys.length > 0) {
    return {
      ok: false,
      status: 400,
      error: 'bad_request',
      missingKeys,
    };
  }

  const spec = buildAddressWalletRecipientIdSpec();
  const recipientKind = normalizeRecipientKind(input.recipientKind);
  const consentPolicyRef = typeof input.consentPolicyRef === 'string' && input.consentPolicyRef.length > 0
    ? input.consentPolicyRef
    : 'consent_required';
  const status: AddressWalletRecipientStatus = consentPolicyRef === 'consent_required' ? 'requires_consent' : 'active';
  const requiredNextAction: AddressWalletRecipientNextAction = status === 'active' ? 'create_shipment_intent' : 'request_recipient_consent';
  const seed = {
    walletSubjectAlias: input.walletSubjectAlias,
    relationshipRef: input.relationshipRef,
    deliveryPurpose: input.deliveryPurpose,
    recipientKind,
    consentPolicyRef,
    expiresAt: input.expiresAt ?? 'synthetic-expiry',
  };
  const recipientId = stableRef(spec.idPrefixes[recipientKind], seed);

  return {
    ok: true,
    status: 201,
    body: {
      version: ADDRESS_WALLET_RECIPIENT_ID_VERSION,
      recipient_id: recipientId,
      recipient_kind: recipientKind,
      wallet_subject_alias: input.walletSubjectAlias as string,
      relationship_ref: input.relationshipRef as string,
      delivery_purpose: input.deliveryPurpose as CreateAddressWalletRecipientInput['deliveryPurpose'],
      consent_policy_ref: consentPolicyRef,
      status,
      required_next_action: requiredNextAction,
      shipment_intent_bridge: {
        recipientTokenRef: recipientId,
        allowedInputField: 'recipientTokenRef',
      },
      allowed_use: ['shipment-intent', 'rate-quote', 'carrier-handoff'],
      expires_at: typeof input.expiresAt === 'string' && input.expiresAt.length > 0 ? input.expiresAt : 'synthetic-expiry',
      privacy: {
        contains_raw_address: false,
        production_traffic: false,
        carrier_credentials_present: false,
        log_safe: true,
      },
      blocked_material: [...ADDRESS_WALLET_RECIPIENT_BLOCKED_MATERIAL],
      local_only: true,
      non_claims: spec.nonClaims,
    },
  };
}

export function validateAddressWalletRecipientIdSpec(spec: AddressWalletRecipientIdSpec): string[] {
  const errors: string[] = [];
  const surfaceIds = new Set(spec.apiSurfaces.map(surface => surface.id));

  if (spec.version !== ADDRESS_WALLET_RECIPIENT_ID_VERSION) errors.push('version-mismatch');
  if (!spec.thesis.includes('raw address')) errors.push('missing-raw-address-thesis');
  for (const kind of ['self', 'friend', 'organization', 'locker'] satisfies AddressWalletRecipientKind[]) {
    if (!spec.idPrefixes[kind]) errors.push(`missing-id-prefix:${kind}`);
  }
  for (const status of ['requires_consent', 'active', 'revoked'] satisfies AddressWalletRecipientStatus[]) {
    if (!spec.lifecycle.includes(status)) errors.push(`missing-lifecycle:${status}`);
  }
  for (const requiredSurface of ['create-recipient-id', 'read-recipient-id', 'grant-recipient-consent']) {
    if (!surfaceIds.has(requiredSurface)) errors.push(`missing-api-surface:${requiredSurface}`);
  }
  for (const requiredBridge of ['Address Stripe ShipmentIntent', 'Hexaship SDK', 'Delivery Gateway Carrier Handoff']) {
    if (!spec.bridges.some(bridge => bridge.target === requiredBridge)) errors.push(`missing-bridge:${requiredBridge}`);
  }
  for (const key of ['rawAddress', 'recipientPhone', 'proofWitness', 'privateKey', 'carrierApiKey']) {
    if (!spec.blockedMaterial.includes(key)) errors.push(`missing-blocked-material:${key}`);
  }
  if (!spec.nonClaims.some(nonClaim => /not wallet consent/i.test(nonClaim))) errors.push('missing-consent-boundary');
  if (!spec.nonClaims.some(nonClaim => /not a raw address/i.test(nonClaim))) errors.push('missing-raw-address-non-claim');
  if (JSON.stringify(spec.apiSurfaces.map(surface => surface.safeOutputs)).match(/rawAddress|recipientPhone|proofWitness|privateKey|carrierApiKey/)) {
    errors.push('unsafe-api-output');
  }

  return errors;
}

export function validateAddressWalletRecipientSandboxBody(body: AddressWalletRecipientSandboxBody): string[] {
  const errors: string[] = [];

  if (body.version !== ADDRESS_WALLET_RECIPIENT_ID_VERSION) errors.push('version-mismatch');
  if (!body.recipient_id.startsWith(`aw_rec_${body.recipient_kind === 'organization' ? 'org' : body.recipient_kind}`)) {
    errors.push('recipient-id-prefix-mismatch');
  }
  if (body.shipment_intent_bridge.recipientTokenRef !== body.recipient_id) errors.push('shipment-intent-bridge-mismatch');
  if (body.privacy.contains_raw_address !== false) errors.push('contains-raw-address');
  if (body.privacy.production_traffic !== false) errors.push('production-traffic');
  if (body.privacy.carrier_credentials_present !== false) errors.push('carrier-credentials-present');
  if (!body.local_only) errors.push('not-local-only');
  for (const key of ['rawAddress', 'recipientPhone', 'proofWitness', 'privateKey', 'carrierApiKey']) {
    if (!body.blocked_material.includes(key)) errors.push(`missing-blocked-material:${key}`);
  }
  if (JSON.stringify(body).match(/sk_live|proofSecretValue|privateKeyValue|carrierSecretValue/i)) {
    errors.push('unsafe-secret-like-value');
  }

  return errors;
}
