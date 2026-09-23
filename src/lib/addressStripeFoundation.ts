export const ADDRESS_STRIPE_FOUNDATION_VERSION = 'address-stripe-foundation-v0.1';

export type AddressStripeActor =
  | 'developer'
  | 'merchant'
  | 'wallet-user'
  | 'recipient'
  | 'carrier'
  | 'operator'
  | 'auditor';

export type AddressStripePrimitiveId =
  | 'address-login-session'
  | 'recipient-token'
  | 'address-validation-ref'
  | 'shipment-intent'
  | 'rate-quote'
  | 'carrier-allocation'
  | 'carrier-handoff'
  | 'delivery-webhook'
  | 'evidence-receipt';

export type AddressStripeBuildGateId =
  | 'no-raw-address-by-default'
  | 'wallet-consent-required'
  | 'carrier-credential-server-side'
  | 'synthetic-fixtures-only'
  | 'addressql-validation-boundary'
  | 'webhook-idempotency'
  | 'settlement-non-claim';

export type AddressStripePrimitive = {
  id: AddressStripePrimitiveId;
  publicName: string;
  stripeAnalogy: string;
  ownerLayer: 'Address Login' | 'Address Wallet' | 'AddressQL' | 'Delivery Gateway' | 'Evidence Vault';
  actors: AddressStripeActor[];
  purpose: string;
  minimalInputRefs: string[];
  safeOutputRefs: string[];
  blockedMaterial: string[];
  firstTestFixture: string;
};

export type AddressStripeBuildGate = {
  id: AddressStripeBuildGateId;
  appliesTo: AddressStripePrimitiveId[];
  rule: string;
  verificationTarget: string;
};

export type AddressStripeSdkSurface = {
  packageName: string;
  firstMethods: string[];
  quickstartShape: string;
  requiredDocs: string[];
};

export type AddressStripeFoundationPlan = {
  version: typeof ADDRESS_STRIPE_FOUNDATION_VERSION;
  thesis: string;
  primitives: AddressStripePrimitive[];
  buildGates: AddressStripeBuildGate[];
  sdkSurfaces: AddressStripeSdkSurface[];
  firstProductionBacklog: string[];
  nonClaims: string[];
};

export type AddressStripeServicePreference = 'fastest' | 'cheapest' | 'balanced' | 'risk-minimized';

export type CreateShipmentIntentInput = {
  merchantRef: string;
  recipientTokenRef: string;
  parcelProfileRef: string;
  addressValidationRef: string;
  walletConsentRef?: string;
  servicePreference?: AddressStripeServicePreference;
  requestedAt?: string;
};

export type ShipmentIntentSandboxResult = {
  version: 'shipment-intent-v0.1';
  intent_id: string;
  merchant_ref: string;
  recipient_token_ref: string;
  parcel_profile_ref: string;
  service_preference: AddressStripeServicePreference;
  address_validation_ref: string;
  wallet_consent_ref: string;
  status: 'requires_wallet_consent' | 'ready_for_rate_quote';
  required_next_action: 'request_wallet_consent' | 'quote_rates';
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

export type CreateShipmentIntentSandboxResponse =
  | {
      ok: true;
      status: 201;
      body: ShipmentIntentSandboxResult;
    }
  | {
      ok: false;
      status: 400;
      error: 'private_material_rejected' | 'bad_request';
      rejectedKeys?: string[];
      missingKeys?: string[];
    };

export const ADDRESS_STRIPE_PRIMITIVES: AddressStripePrimitive[] = [
  {
    id: 'address-login-session',
    publicName: 'Address Login Session',
    stripeAnalogy: 'Checkout Session',
    ownerLayer: 'Address Login',
    actors: ['developer', 'merchant', 'wallet-user'],
    purpose: 'Let an EC site authenticate the buyer once and receive safe identity/session refs for checkout.',
    minimalInputRefs: ['client_id', 'redirect_uri', 'scope', 'state'],
    safeOutputRefs: ['addressLoginSessionRef', 'walletUserRef', 'merchantAccountRef'],
    blockedMaterial: ['rawAddress', 'privateKey', 'proofSecret', 'recipientPhone'],
    firstTestFixture: 'address-login-session.synthetic.json',
  },
  {
    id: 'recipient-token',
    publicName: 'Recipient Token',
    stripeAnalogy: 'Customer / PaymentMethod token',
    ownerLayer: 'Address Wallet',
    actors: ['wallet-user', 'recipient', 'merchant'],
    purpose: 'Represent a recipient, friend, or delivery permission without exposing the recipient address to the buyer.',
    minimalInputRefs: ['walletUserRef', 'friendRef', 'deliveryPurpose', 'expiresAt'],
    safeOutputRefs: ['recipientTokenRef', 'consentGrantRef', 'redactionPolicyRef'],
    blockedMaterial: ['rawAddress', 'recipientName', 'recipientPhone', 'privateAccessNotes'],
    firstTestFixture: 'recipient-token.synthetic.json',
  },
  {
    id: 'address-validation-ref',
    publicName: 'Address Validation Ref',
    stripeAnalogy: 'Risk check / verification result',
    ownerLayer: 'AddressQL',
    actors: ['developer', 'merchant', 'auditor'],
    purpose: 'Expose source-versioned country, postal, and address validation results without claiming consent or delivery success.',
    minimalInputRefs: ['addressObjectRef', 'countryProfileRef', 'sourceCatalogVersion'],
    safeOutputRefs: ['addressValidationRef', 'confidenceCode', 'sourceEvidenceRef', 'requiredNextAction'],
    blockedMaterial: ['rawAddress', 'proofWitness', 'proofSecret', 'privateKey'],
    firstTestFixture: 'address-validation-ref.synthetic.json',
  },
  {
    id: 'shipment-intent',
    publicName: 'Shipment Intent',
    stripeAnalogy: 'PaymentIntent',
    ownerLayer: 'Delivery Gateway',
    actors: ['developer', 'merchant', 'wallet-user'],
    purpose: 'Capture the merchant request to ship before rate quote, carrier allocation, label creation, or settlement.',
    minimalInputRefs: ['merchantRef', 'recipientTokenRef', 'parcelProfileRef', 'servicePreference'],
    safeOutputRefs: ['shipmentIntentRef', 'requiredNextAction', 'addressValidationRef'],
    blockedMaterial: ['rawAddress', 'carrierApiKey', 'rawLabelPayload', 'proofWitness'],
    firstTestFixture: 'shipment-intent.synthetic.json',
  },
  {
    id: 'rate-quote',
    publicName: 'Rate Quote',
    stripeAnalogy: 'Quote',
    ownerLayer: 'Delivery Gateway',
    actors: ['developer', 'merchant', 'carrier'],
    purpose: 'Normalize carrier options for fastest, cheapest, balanced, or risk-minimized delivery choices.',
    minimalInputRefs: ['shipmentIntentRef', 'addressValidationRef', 'carrierCapabilityRef'],
    safeOutputRefs: ['rateQuoteRef', 'priceEstimateRef', 'etaWindowRef', 'capabilityWarnings'],
    blockedMaterial: ['carrierCredential', 'commercialRateSecret', 'rawAddress'],
    firstTestFixture: 'rate-quote.synthetic.json',
  },
  {
    id: 'carrier-allocation',
    publicName: 'Carrier Allocation',
    stripeAnalogy: 'Payment routing / authorization choice',
    ownerLayer: 'Delivery Gateway',
    actors: ['merchant', 'operator', 'carrier', 'auditor'],
    purpose: 'Select a carrier option under wallet consent, merchant policy, carrier support, and risk constraints.',
    minimalInputRefs: ['shipmentIntentRef', 'rateQuoteRef', 'walletConsentRef', 'merchantPolicyRef'],
    safeOutputRefs: ['carrierAllocationRef', 'selectedCarrierAlias', 'selectionReasonCodes'],
    blockedMaterial: ['privatePolicyBody', 'carrierCredential', 'unscopedDecryptMaterial'],
    firstTestFixture: 'carrier-allocation.synthetic.json',
  },
  {
    id: 'carrier-handoff',
    publicName: 'Carrier Handoff',
    stripeAnalogy: 'Charge capture / processor handoff',
    ownerLayer: 'Delivery Gateway',
    actors: ['carrier', 'operator', 'auditor'],
    purpose: 'Hand scoped delivery material to a server-side carrier adapter after allocation and consent gates pass.',
    minimalInputRefs: ['carrierAllocationRef', 'handoffPolicyRef', 'carrierAdapterRef'],
    safeOutputRefs: ['carrierHandoffRef', 'labelRef', 'trackingAlias'],
    blockedMaterial: ['rawLabelPayload', 'carrierApiKey', 'rawQrPayload', 'doorCode'],
    firstTestFixture: 'carrier-handoff.synthetic.json',
  },
  {
    id: 'delivery-webhook',
    publicName: 'Delivery Webhook',
    stripeAnalogy: 'Webhook Event',
    ownerLayer: 'Delivery Gateway',
    actors: ['developer', 'merchant', 'carrier', 'auditor'],
    purpose: 'Send normalized, idempotent shipment lifecycle events to merchants and apps.',
    minimalInputRefs: ['eventId', 'shipmentIntentRef', 'trackingAlias', 'signature'],
    safeOutputRefs: ['webhookDeliveryRef', 'eventFingerprint', 'nextAction'],
    blockedMaterial: ['rawCarrierPayload', 'rawAddress', 'recipientPhone', 'carrierSecret'],
    firstTestFixture: 'delivery-webhook.synthetic.json',
  },
  {
    id: 'evidence-receipt',
    publicName: 'Evidence Receipt',
    stripeAnalogy: 'Receipt / dispute evidence',
    ownerLayer: 'Evidence Vault',
    actors: ['merchant', 'operator', 'auditor'],
    purpose: 'Store redacted evidence refs for label issuance, tracking, proof, refunds, and disputes.',
    minimalInputRefs: ['shipmentIntentRef', 'eventFingerprint', 'evidenceType', 'retentionPolicyRef'],
    safeOutputRefs: ['evidenceReceiptRef', 'redactedAuditStatus', 'retentionExpiresAt'],
    blockedMaterial: ['rawPODImage', 'proofWitness', 'privateConversation', 'bankAccount'],
    firstTestFixture: 'evidence-receipt.synthetic.json',
  },
];

export const ADDRESS_STRIPE_BUILD_GATES: AddressStripeBuildGate[] = [
  {
    id: 'no-raw-address-by-default',
    appliesTo: ['address-login-session', 'recipient-token', 'shipment-intent', 'rate-quote', 'carrier-allocation', 'carrier-handoff', 'delivery-webhook', 'evidence-receipt'],
    rule: 'Public SDK, merchant callback, and OSS fixture surfaces must use refs instead of raw private address fields by default.',
    verificationTarget: 'scan fixture and SDK inputs for rawAddress, recipientPhone, private access notes, and proof witness fields.',
  },
  {
    id: 'wallet-consent-required',
    appliesTo: ['recipient-token', 'shipment-intent', 'carrier-allocation', 'carrier-handoff'],
    rule: 'Friend delivery and address-token shipping must carry a purpose-bound consent or required_next_action state.',
    verificationTarget: 'recipientTokenRef, consentGrantRef, walletConsentRef, or requiredNextAction must be present.',
  },
  {
    id: 'carrier-credential-server-side',
    appliesTo: ['rate-quote', 'carrier-allocation', 'carrier-handoff', 'delivery-webhook'],
    rule: 'Carrier credentials and commercial rate secrets are never accepted by public client SDK calls.',
    verificationTarget: 'client fixtures reject carrierApiKey, carrierCredential, and commercialRateSecret.',
  },
  {
    id: 'synthetic-fixtures-only',
    appliesTo: ['address-login-session', 'recipient-token', 'shipment-intent', 'rate-quote', 'carrier-allocation', 'carrier-handoff', 'delivery-webhook', 'evidence-receipt'],
    rule: 'Initial OSS tests use synthetic refs only and never send production carrier traffic.',
    verificationTarget: 'fixtures include localOnly=true, productionTraffic=false, and rawAddressFixtures=false.',
  },
  {
    id: 'addressql-validation-boundary',
    appliesTo: ['shipment-intent', 'rate-quote'],
    rule: 'AddressQL may provide validation refs, country profiles, postal checks, and confidence, but not wallet consent or delivery guarantees.',
    verificationTarget: 'shipment intent fixture includes addressValidationRef and non-claims.',
  },
  {
    id: 'webhook-idempotency',
    appliesTo: ['delivery-webhook', 'evidence-receipt'],
    rule: 'Webhook and evidence events must be idempotent, signed, and replay-safe before merchant integrations begin.',
    verificationTarget: 'eventId, eventFingerprint, signature, and replayWindow fields are required in webhook fixtures.',
  },
  {
    id: 'settlement-non-claim',
    appliesTo: ['carrier-handoff', 'evidence-receipt'],
    rule: 'Label creation and evidence receipt are not final settlement, liability assignment, or proof of delivery by themselves.',
    verificationTarget: 'nonClaims include settlement and delivery-proof boundaries.',
  },
];

export function buildAddressStripeFoundationPlan(): AddressStripeFoundationPlan {
  return {
    version: ADDRESS_STRIPE_FOUNDATION_VERSION,
    thesis:
      'Address Stripe begins as a ref-first address and shipping contract: developers create shipment intents with wallet-safe recipient refs, AddressQL validation refs, carrier allocation refs, and idempotent webhooks before any production carrier or raw-address flow exists.',
    primitives: ADDRESS_STRIPE_PRIMITIVES,
    buildGates: ADDRESS_STRIPE_BUILD_GATES,
    sdkSurfaces: [
      {
        packageName: '@vey/addresses',
        firstMethods: ['addressLogin.start', 'recipients.requestConsent', 'shipments.createIntent'],
        quickstartShape: 'Clerk-like login plus Stripe-like shipment intent creation.',
        requiredDocs: ['quickstart', 'React button', 'Next.js route handler', 'no raw-address policy'],
      },
      {
        packageName: '@vey/skipship',
        firstMethods: ['shipmentIntents.create', 'rates.quote', 'carrierAllocations.create', 'webhooks.verify'],
        quickstartShape: 'Stripe-like server SDK for rate, allocation, label, tracking, and evidence refs.',
        requiredDocs: ['API reference', 'sandbox carrier guide', 'webhook signing guide', 'fixture catalog'],
      },
    ],
    firstProductionBacklog: [
      'Create JSON schemas for ShipmentIntent, RateQuote, CarrierAllocation, CarrierHandoff, and DeliveryWebhook.',
      'Add a sandbox-only createShipmentIntent function that rejects raw address and carrier credential fields.',
      'Expose OpenAPI examples for EC checkout and Address Wallet friend delivery.',
      'Add webhook idempotency and signature verification fixtures.',
      'Connect AddressQL AddressValidationResult refs to ShipmentIntent without claiming delivery success.',
    ],
    nonClaims: [
      'Address Stripe is not a production carrier network until carrier contracts, credentials, settlement, and incident operations exist.',
      'AddressQL validation is not wallet consent, legal KYC, proof of residence, carrier support, or delivery guarantee.',
      'Recipient tokens and friend relationships are not raw address disclosure or proof of recipient identity.',
      'Rate quotes, allocations, labels, and evidence receipts are bounded operational states, not final settlement or liability decisions.',
    ],
  };
}

export function validateAddressStripeFoundationPlan(plan = buildAddressStripeFoundationPlan()): string[] {
  const errors: string[] = [];
  const primitiveIds = new Set(plan.primitives.map(primitive => primitive.id));
  const gateIds = new Set(plan.buildGates.map(gate => gate.id));
  const blockedMaterial = new Set(plan.primitives.flatMap(primitive => primitive.blockedMaterial));

  for (const required of [
    'address-login-session',
    'recipient-token',
    'address-validation-ref',
    'shipment-intent',
    'rate-quote',
    'carrier-allocation',
    'carrier-handoff',
    'delivery-webhook',
    'evidence-receipt',
  ] satisfies AddressStripePrimitiveId[]) {
    if (!primitiveIds.has(required)) errors.push(`missing-primitive:${required}`);
  }

  for (const required of [
    'no-raw-address-by-default',
    'wallet-consent-required',
    'carrier-credential-server-side',
    'synthetic-fixtures-only',
    'addressql-validation-boundary',
    'webhook-idempotency',
    'settlement-non-claim',
  ] satisfies AddressStripeBuildGateId[]) {
    if (!gateIds.has(required)) errors.push(`missing-build-gate:${required}`);
  }

  for (const primitive of plan.primitives) {
    if (primitive.minimalInputRefs.length === 0) errors.push(`primitive-missing-inputs:${primitive.id}`);
    if (primitive.safeOutputRefs.length === 0) errors.push(`primitive-missing-safe-outputs:${primitive.id}`);
    if (primitive.blockedMaterial.length === 0) errors.push(`primitive-missing-blocked-material:${primitive.id}`);
    if (!primitive.firstTestFixture.endsWith('.synthetic.json')) errors.push(`primitive-fixture-not-synthetic:${primitive.id}`);
  }

  for (const gate of plan.buildGates) {
    for (const primitiveId of gate.appliesTo) {
      if (!primitiveIds.has(primitiveId)) errors.push(`gate-unknown-primitive:${gate.id}:${primitiveId}`);
    }
    if (!gate.verificationTarget) errors.push(`gate-missing-verification:${gate.id}`);
  }

  for (const requiredBlocker of ['rawAddress', 'carrierApiKey', 'proofWitness', 'proofSecret']) {
    if (!blockedMaterial.has(requiredBlocker)) errors.push(`missing-blocked-material:${requiredBlocker}`);
  }

  if (!plan.sdkSurfaces.some(surface => surface.firstMethods.includes('shipments.createIntent'))) {
    errors.push('missing-address-login-shipment-intent-sdk');
  }
  if (!plan.sdkSurfaces.some(surface => surface.firstMethods.includes('webhooks.verify'))) {
    errors.push('missing-webhook-verification-sdk');
  }
  if (!plan.firstProductionBacklog.some(item => /JSON schemas/.test(item))) errors.push('missing-schema-backlog');
  if (!plan.nonClaims.some(nonClaim => /not wallet consent/i.test(nonClaim))) errors.push('missing-addressql-consent-non-claim');
  if (!plan.nonClaims.some(nonClaim => /not final settlement/i.test(nonClaim))) errors.push('missing-settlement-non-claim');

  return errors;
}

const SHIPMENT_INTENT_PRIVATE_KEYS = [
  'rawAddress',
  'raw_address',
  'recipientPhone',
  'recipient_phone',
  'recipientName',
  'carrierApiKey',
  'carrier_api_key',
  'carrierCredential',
  'commercialRateSecret',
  'proofWitness',
  'proof_witness',
  'privateKey',
  'private_key',
  'proofSecret',
  'proof_secret',
  'rawLabelPayload',
  'rawQrPayload',
  'doorCode',
];

function collectObjectKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(collectObjectKeys);
  const record = value as Record<string, unknown>;
  return [
    ...Object.keys(record),
    ...Object.values(record).flatMap(collectObjectKeys),
  ];
}

function stableRef(prefix: string, value: unknown): string {
  const json = JSON.stringify(value, Object.keys(value as object).sort());
  let hash = 2166136261;
  for (let index = 0; index < json.length; index += 1) {
    hash ^= json.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function normalizeServicePreference(value: unknown): AddressStripeServicePreference {
  if (value === 'fastest' || value === 'cheapest' || value === 'risk-minimized') return value;
  return 'balanced';
}

export function createShipmentIntentSandbox(input: Record<string, unknown>): CreateShipmentIntentSandboxResponse {
  const keys = new Set(collectObjectKeys(input));
  const rejectedKeys = SHIPMENT_INTENT_PRIVATE_KEYS.filter(key => keys.has(key));
  if (rejectedKeys.length > 0) {
    return {
      ok: false,
      status: 400,
      error: 'private_material_rejected',
      rejectedKeys,
    };
  }

  const missingKeys = ['merchantRef', 'recipientTokenRef', 'parcelProfileRef', 'addressValidationRef']
    .filter(key => typeof input[key] !== 'string' || (input[key] as string).length === 0);
  if (missingKeys.length > 0) {
    return {
      ok: false,
      status: 400,
      error: 'bad_request',
      missingKeys,
    };
  }

  const walletConsentRef = typeof input.walletConsentRef === 'string' && input.walletConsentRef.length > 0
    ? input.walletConsentRef
    : 'consent_required';
  const status = walletConsentRef === 'consent_required' ? 'requires_wallet_consent' : 'ready_for_rate_quote';
  const requiredNextAction = status === 'requires_wallet_consent' ? 'request_wallet_consent' : 'quote_rates';
  const servicePreference = normalizeServicePreference(input.servicePreference);
  const seed = {
    merchantRef: input.merchantRef,
    recipientTokenRef: input.recipientTokenRef,
    parcelProfileRef: input.parcelProfileRef,
    addressValidationRef: input.addressValidationRef,
    walletConsentRef,
    servicePreference,
    requestedAt: input.requestedAt ?? 'synthetic-time',
  };

  return {
    ok: true,
    status: 201,
    body: {
      version: 'shipment-intent-v0.1',
      intent_id: stableRef('shipintent_sandbox', seed),
      merchant_ref: input.merchantRef as string,
      recipient_token_ref: input.recipientTokenRef as string,
      parcel_profile_ref: input.parcelProfileRef as string,
      service_preference: servicePreference,
      address_validation_ref: input.addressValidationRef as string,
      wallet_consent_ref: walletConsentRef,
      status,
      required_next_action: requiredNextAction,
      privacy: {
        contains_raw_address: false,
        production_traffic: false,
        carrier_credentials_present: false,
        log_safe: true,
      },
      blocked_material: SHIPMENT_INTENT_PRIVATE_KEYS,
      local_only: true,
      non_claims: [
        'ShipmentIntent sandbox output is not a carrier label purchase.',
        'AddressQL validation is not wallet consent, proof of residence, carrier support, or delivery guarantee.',
        'Sandbox shipment intents do not send production carrier traffic.',
      ],
    },
  };
}
