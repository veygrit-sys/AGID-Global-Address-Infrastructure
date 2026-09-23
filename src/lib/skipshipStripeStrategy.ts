export const SKIPSHIP_STRIPE_STRATEGY_VERSION = 'skipship-stripe-strategy-v0.1';

export type SkipshipLayerBoundary = 'oss' | 'shared-contract' | 'commercial-managed';
export type SkipshipAudience = 'developer' | 'merchant' | 'wallet-user' | 'carrier' | 'operator' | 'auditor';
export type SkipshipMoat =
  | 'address-wallet'
  | 'recipient-id'
  | 'consent-network'
  | 'addressql-validation'
  | 'carrier-connect'
  | 'settlement'
  | 'evidence-vault';

export type SkipshipProductLayer = {
  id: string;
  name: string;
  boundary: SkipshipLayerBoundary;
  audiences: SkipshipAudience[];
  purpose: string;
  firstArtifacts: string[];
  nonClaims: string[];
};

export type SkipshipApiPrimitive = {
  id: string;
  stripeAnalogy: string;
  developerSurface: string;
  purpose: string;
  blockedMaterial: string[];
  firstVersion: string;
};

export type SkipshipRevenueStream = {
  id: string;
  boundary: 'usage' | 'saas' | 'managed-ops' | 'enterprise';
  buyer: 'merchant' | 'platform' | 'carrier' | 'enterprise' | 'public-sector';
  meter: string;
  whyPay: string;
  ossBoundary: string;
};

export type SkipshipBuildPhase = {
  phase: string;
  title: string;
  exitCriteria: string[];
  verification: string[];
};

export type SkipshipCommerceIntegrationPlacement = {
  id: 'playlist-commerce' | 'ec-social-login';
  label: 'Playlist Commerce' | 'EC Social Login';
  installTarget: 'veygrit-app' | 'merchant-ec-plugin-or-sdk';
  startPoint: 'veygrit' | 'merchant-ec-site';
  productQuestion: 'which-ec-to-use' | 'how-to-buy-at-that-ec';
  loginButtonRequiredToShop: boolean;
  continueWithVeygritRequired: boolean;
  addressWalletReuse: 'wallet-side-consent' | 'ec-side-address-login';
  merchantCanEnableAlongsideShippingApi: true;
  safeOutputs: string[];
  blockedMaterial: string[];
};

export type SkipshipWebhookIdempotencyPolicy = {
  surface: 'tracking-webhook';
  eventKey: 'eventId';
  fingerprint: 'signed-normalized-body';
  replayBehavior: 'ack-same-event';
  conflictBehavior: 'reject-same-event-different-body';
  replayWindowSeconds: number;
  minimumStoreTtlDays: number;
  deadLetterAfterAttempts: number;
  blockedMaterial: string[];
  productionRequirements: string[];
};

export type SkipshipStripeStrategy = {
  version: typeof SKIPSHIP_STRIPE_STRATEGY_VERSION;
  thesis: string;
  antiThesis: string;
  moats: SkipshipMoat[];
  layers: SkipshipProductLayer[];
  apiPrimitives: SkipshipApiPrimitive[];
  commerceIntegrationPlacements: SkipshipCommerceIntegrationPlacement[];
  revenueStreams: SkipshipRevenueStream[];
  buildPhases: SkipshipBuildPhase[];
  webhookIdempotencyPolicy: SkipshipWebhookIdempotencyPolicy;
  safetyBoundaries: {
    merchantRawAddressDefault: false;
    clientCarrierCredentialsAllowed: false;
    publicFixturesUseProductionCarrierTraffic: false;
    walletFriendshipIsResidenceProof: false;
  };
  nonClaims: string[];
};

export const SKIPSHIP_PRODUCT_LAYERS: SkipshipProductLayer[] = [
  {
    id: 'shipping-api',
    name: 'Shipping API',
    boundary: 'shared-contract',
    audiences: ['developer', 'merchant'],
    purpose: 'Expose rates, shipment intents, labels, tracking, returns, pickups, and carrier allocation through one API.',
    firstArtifacts: ['OpenAPI', 'TypeScript SDK', 'sandbox carrier fixture', 'webhook schema'],
    nonClaims: ['A unified API is not a guarantee that every carrier supports every feature.'],
  },
  {
    id: 'recipient-identity',
    name: 'Recipient Identity',
    boundary: 'shared-contract',
    audiences: ['developer', 'merchant', 'wallet-user'],
    purpose: 'Let merchants ship to recipient IDs, wallet friends, permission tokens, or credential refs without default raw-address exposure.',
    firstArtifacts: ['recipient_id contract', 'wallet permission request', 'carrier handoff ref'],
    nonClaims: ['Recipient ID is not proof of residence or legal identity.'],
  },
  {
    id: 'address-wallet',
    name: 'Address Wallet',
    boundary: 'commercial-managed',
    audiences: ['wallet-user', 'merchant'],
    purpose: 'Store addresses, friends, delivery preferences, approvals, QR passes, and delivery history under user control.',
    firstArtifacts: ['friend delivery approval flow', 'Address Login SSO', 'Apple/Google Wallet QR pass plan'],
    nonClaims: ['Wallet approval is scoped to a request and does not grant merchants permanent address access.'],
  },
  {
    id: 'carrier-connect',
    name: 'Carrier Connect',
    boundary: 'commercial-managed',
    audiences: ['carrier', 'operator', 'merchant'],
    purpose: 'Operate server-side carrier credentials, adapters, capability matrices, label purchase, pickup, tracking, and returns.',
    firstArtifacts: ['sandbox adapter', 'carrier capability registry', 'manual ops adapter'],
    nonClaims: ['Carrier abstraction does not remove carrier-specific legal, service-level, or contract constraints.'],
  },
  {
    id: 'addressql-layer',
    name: 'AddressQL Layer',
    boundary: 'oss',
    audiences: ['developer', 'auditor'],
    purpose: 'Provide country profiles, postal validation, address object schemas, source-versioned checks, and non-claim gates.',
    firstArtifacts: ['PostgreSQL extension', 'DuckDB adapter', 'AddressValidationResult schema', 'synthetic fixtures'],
    nonClaims: ['AddressQL is not a complete global address database.'],
  },
  {
    id: 'merchant-console',
    name: 'Merchant Console',
    boundary: 'commercial-managed',
    audiences: ['merchant', 'operator', 'auditor'],
    purpose: 'Manage API keys, webhooks, carrier settings, logs, billing, evidence, disputes, and team permissions.',
    firstArtifacts: ['developer platform screen', 'API key model', 'webhook delivery ledger'],
    nonClaims: ['Console logs should not become a raw-address warehouse.'],
  },
  {
    id: 'settlement-ops',
    name: 'Payment / Settlement / Carrier Label Operations',
    boundary: 'commercial-managed',
    audiences: ['merchant', 'carrier', 'operator', 'auditor'],
    purpose: 'Handle label charges, adjustments, refunds, disputes, carrier invoices, taxes, and platform billing.',
    firstArtifacts: ['label intent ledger', 'settlement event schema', 'billing export contract'],
    nonClaims: ['Settlement records are financial evidence, not delivery truth by themselves.'],
  },
  {
    id: 'evidence-risk',
    name: 'Evidence Vault / Risk Layer',
    boundary: 'commercial-managed',
    audiences: ['merchant', 'operator', 'auditor'],
    purpose: 'Store redacted evidence, lifecycle receipts, delivery proof refs, fraud/risk signals, and audit trails.',
    firstArtifacts: ['redacted receipt schema', 'non-claim profile', 'risk reason code registry'],
    nonClaims: ['Risk scores must not become hidden carrier blacklists or unexplained denial rules.'],
  },
];

export const SKIPSHIP_API_PRIMITIVES: SkipshipApiPrimitive[] = [
  {
    id: 'shipment-intent',
    stripeAnalogy: 'PaymentIntent',
    developerSurface: 'skipship.shipmentIntents.create',
    purpose: 'Represent a requested shipment before rate selection, wallet approval, carrier allocation, or label purchase.',
    blockedMaterial: ['rawAddress', 'recipientPhone', 'carrierApiKey', 'proofWitness'],
    firstVersion: 'v0.2',
  },
  {
    id: 'recipient',
    stripeAnalogy: 'Customer',
    developerSurface: 'skipship.recipients.resolve',
    purpose: 'Resolve recipient IDs, wallet friends, and delivery permission tokens into scoped carrier handoff material.',
    blockedMaterial: ['rawAddressByDefault', 'privateDeliveryNotes', 'identityCredentialSecret'],
    firstVersion: 'v0.2',
  },
  {
    id: 'rate',
    stripeAnalogy: 'Quote',
    developerSurface: 'skipship.rates.create',
    purpose: 'Return normalized fastest, cheapest, and balanced options under merchant, wallet, and carrier policy.',
    blockedMaterial: ['carrierCredential', 'rawAddress', 'privatePolicyBody'],
    firstVersion: 'v0.2',
  },
  {
    id: 'label',
    stripeAnalogy: 'Charge capture / receipt',
    developerSurface: 'skipship.labels.create',
    purpose: 'Create label or QR handoff refs after carrier acceptance.',
    blockedMaterial: ['rawLabelPayload', 'rawQrPayload', 'carrierApiKey'],
    firstVersion: 'v0.3',
  },
  {
    id: 'tracking-event',
    stripeAnalogy: 'Webhook event',
    developerSurface: 'webhook: shipment.*',
    purpose: 'Normalize carrier tracking into signed, redacted lifecycle events.',
    blockedMaterial: ['rawCarrierPayloadByDefault', 'recipientPhone', 'doorCode'],
    firstVersion: 'v0.2',
  },
  {
    id: 'return-intent',
    stripeAnalogy: 'Refund / dispute flow',
    developerSurface: 'skipship.returns.create',
    purpose: 'Create return authorization, return labels, pickup choices, and lifecycle events.',
    blockedMaterial: ['privateAccessNotes', 'rawAddressByDefault'],
    firstVersion: 'v0.4',
  },
];

export const SKIPSHIP_COMMERCE_INTEGRATION_PLACEMENTS: SkipshipCommerceIntegrationPlacement[] = [
  {
    id: 'playlist-commerce',
    label: 'Playlist Commerce',
    installTarget: 'veygrit-app',
    startPoint: 'veygrit',
    productQuestion: 'which-ec-to-use',
    loginButtonRequiredToShop: false,
    continueWithVeygritRequired: false,
    addressWalletReuse: 'wallet-side-consent',
    merchantCanEnableAlongsideShippingApi: true,
    safeOutputs: ['merchantRef', 'storeRef', 'playlistParticipationRef', 'storePreferenceAlias', 'walletConsentRef'],
    blockedMaterial: ['rawAddress', 'recipientPhone', 'savedAddressBody', 'privateKey', 'proofSecret'],
  },
  {
    id: 'ec-social-login',
    label: 'EC Social Login',
    installTarget: 'merchant-ec-plugin-or-sdk',
    startPoint: 'merchant-ec-site',
    productQuestion: 'how-to-buy-at-that-ec',
    loginButtonRequiredToShop: true,
    continueWithVeygritRequired: true,
    addressWalletReuse: 'ec-side-address-login',
    merchantCanEnableAlongsideShippingApi: true,
    safeOutputs: ['pairwiseSubjectAlias', 'recipientId', 'addressCredentialRef', 'walletConsentRef', 'carrierHandoffRef'],
    blockedMaterial: ['rawAddress', 'recipientPhone', 'savedAddressBody', 'privateKey', 'proofSecret'],
  },
];

export const SKIPSHIP_REVENUE_STREAMS: SkipshipRevenueStream[] = [
  {
    id: 'shipment-api-usage',
    boundary: 'usage',
    buyer: 'merchant',
    meter: 'per shipment intent, label, tracking event, or return',
    whyPay: 'One integration replaces many carrier integrations and reduces failed deliveries.',
    ossBoundary: 'OpenAPI and SDK are public; hosted execution and carrier operations are commercial.',
  },
  {
    id: 'merchant-console-saas',
    boundary: 'saas',
    buyer: 'merchant',
    meter: 'monthly seat, environment, webhook volume, evidence retention',
    whyPay: 'Teams need keys, logs, billing, webhooks, carrier settings, and audit screens.',
    ossBoundary: 'Data models and screenshots may be public; hosted console is commercial.',
  },
  {
    id: 'carrier-connect-managed',
    boundary: 'managed-ops',
    buyer: 'platform',
    meter: 'carrier account, adapter, SLA, region, support tier',
    whyPay: 'Carrier credentials, contracts, failures, and label operations need managed responsibility.',
    ossBoundary: 'Adapter interfaces are public; credentials and live carrier operations are commercial.',
  },
  {
    id: 'wallet-network-fee',
    boundary: 'usage',
    buyer: 'merchant',
    meter: 'wallet-approved recipient delivery or friend delivery',
    whyPay: 'Checkout avoids address entry and recipient address exchange while preserving approval.',
    ossBoundary: 'Address Login specs are public; hosted wallet approvals are commercial.',
  },
  {
    id: 'enterprise-private-deployment',
    boundary: 'enterprise',
    buyer: 'enterprise',
    meter: 'deployment, SLA, audit, dedicated connectors, compliance support',
    whyPay: 'Large logistics, finance, and public-sector users need dedicated infrastructure and controls.',
    ossBoundary: 'Core specs remain public; deployment, support, and managed compliance are commercial.',
  },
];

export const SKIPSHIP_BUILD_PHASES: SkipshipBuildPhase[] = [
  {
    phase: 'v0.1',
    title: 'Safe Contract Foundation',
    exitCriteria: ['OpenAPI', 'SDK skeleton', 'synthetic fixtures', 'no raw-address gate', 'AddressValidationResult schema parity'],
    verification: ['verify:skipship-js', 'verify:delivery-gateway-carrier-api', 'verify:addressql'],
  },
  {
    phase: 'v0.2',
    title: 'Shipment Intent / Rates / Tracking',
    exitCriteria: ['shipment intent API', 'rate quote API', 'tracking webhook schema', 'sandbox carrier adapter'],
    verification: ['verify:delivery-gateway-carrier-api', 'verify:addressql-postal-validation-parity'],
  },
  {
    phase: 'v0.3',
    title: 'Address Wallet Friend Delivery',
    exitCriteria: ['Address Login SSO', 'friend approval request', 'recipient handoff ref', 'merchant callback without raw address'],
    verification: ['verify:address-login-spec', 'verify:address-wallet-friend-delivery'],
  },
  {
    phase: 'v0.4',
    title: 'Commerce Integrations',
    exitCriteria: ['Shopify-like plugin plan', 'WooCommerce-like plugin plan', 'custom EC SDK guide', 'webhook retry ledger'],
    verification: ['verify:vey-ecosystem', 'verify:developer-console'],
  },
  {
    phase: 'v0.5',
    title: 'Carrier Connect Beta',
    exitCriteria: ['three carrier adapter profiles', 'capability matrix', 'label intent ledger', 'manual ops fallback'],
    verification: ['verify:delivery-gateway-carrier-api'],
  },
  {
    phase: 'v1.0',
    title: 'Managed Shipping Network',
    exitCriteria: ['production contracts', 'billing/settlement', 'evidence vault', 'SLA', 'incident playbooks'],
    verification: ['enterprise audit checklist', 'security review', 'carrier sandbox-to-prod signoff'],
  },
];

export const SKIPSHIP_WEBHOOK_IDEMPOTENCY_POLICY: SkipshipWebhookIdempotencyPolicy = {
  surface: 'tracking-webhook',
  eventKey: 'eventId',
  fingerprint: 'signed-normalized-body',
  replayBehavior: 'ack-same-event',
  conflictBehavior: 'reject-same-event-different-body',
  replayWindowSeconds: 300,
  minimumStoreTtlDays: 30,
  deadLetterAfterAttempts: 12,
  blockedMaterial: ['rawAddress', 'recipientPhone', 'carrierSecret', 'proofWitness', 'rawTrackingPayload'],
  productionRequirements: [
    'durable event idempotency store keyed by environment and eventId',
    'HMAC or asymmetric signature verification over the normalized body',
    'timestamp replay-window check before event acceptance',
    'dead-letter queue for repeated verification or delivery failures',
    'redacted audit log with eventFingerprint and no raw carrier payload',
  ],
};

export function buildSkipshipStripeStrategy(): SkipshipStripeStrategy {
  return {
    version: SKIPSHIP_STRIPE_STRATEGY_VERSION,
    thesis:
      'Skipship is the address-native shipping infrastructure layer: developers use one API while recipient identity, wallet consent, AddressQL validation, carrier allocation, labels, tracking, returns, evidence, and settlement stay behind safe boundaries.',
    antiThesis:
      'Skipship should not be positioned as only a rate-shopping or label-printing wrapper; incumbents already cover that surface.',
    moats: ['address-wallet', 'recipient-id', 'consent-network', 'addressql-validation', 'carrier-connect', 'settlement', 'evidence-vault'],
    layers: SKIPSHIP_PRODUCT_LAYERS,
    apiPrimitives: SKIPSHIP_API_PRIMITIVES,
    commerceIntegrationPlacements: SKIPSHIP_COMMERCE_INTEGRATION_PLACEMENTS,
    revenueStreams: SKIPSHIP_REVENUE_STREAMS,
    buildPhases: SKIPSHIP_BUILD_PHASES,
    webhookIdempotencyPolicy: SKIPSHIP_WEBHOOK_IDEMPOTENCY_POLICY,
    safetyBoundaries: {
      merchantRawAddressDefault: false,
      clientCarrierCredentialsAllowed: false,
      publicFixturesUseProductionCarrierTraffic: false,
      walletFriendshipIsResidenceProof: false,
    },
    nonClaims: [
      'Skipship is not a guarantee that every carrier supports every feature.',
      'Recipient ID, wallet friendship, or checkout login is not proof of residence.',
      'Rate and ETA outputs are estimates, not carrier SLA guarantees.',
      'Public fixtures must not include raw private address, recipient, witness, private-key, proof-secret, production credential, or production carrier material.',
    ],
  };
}

export function validateSkipshipStripeStrategy(strategy = buildSkipshipStripeStrategy()): string[] {
  const errors: string[] = [];
  const layerIds = new Set(strategy.layers.map(layer => layer.id));
  const primitiveIds = new Set(strategy.apiPrimitives.map(primitive => primitive.id));
  const placements = new Map(strategy.commerceIntegrationPlacements.map(placement => [placement.id, placement]));
  const playlistPlacement = placements.get('playlist-commerce');
  const ecSocialLoginPlacement = placements.get('ec-social-login');

  for (const required of ['shipping-api', 'recipient-identity', 'address-wallet', 'carrier-connect', 'addressql-layer', 'merchant-console', 'settlement-ops', 'evidence-risk']) {
    if (!layerIds.has(required)) errors.push(`missing product layer: ${required}`);
  }
  for (const required of ['shipment-intent', 'recipient', 'rate', 'label', 'tracking-event', 'return-intent']) {
    if (!primitiveIds.has(required)) errors.push(`missing API primitive: ${required}`);
  }
  if (!strategy.moats.includes('address-wallet') || !strategy.moats.includes('addressql-validation')) {
    errors.push('strategy must name wallet and AddressQL moats');
  }
  if (!playlistPlacement) errors.push('missing Playlist Commerce integration placement');
  if (!ecSocialLoginPlacement) errors.push('missing EC Social Login integration placement');
  if (playlistPlacement) {
    if (playlistPlacement.installTarget !== 'veygrit-app') errors.push('Playlist Commerce must install in Veygrit app');
    if (playlistPlacement.loginButtonRequiredToShop) errors.push('Playlist Commerce must not require login button to shop');
    if (playlistPlacement.continueWithVeygritRequired) errors.push('Playlist Commerce must not require EC Continue with Veygrit');
    if (playlistPlacement.productQuestion !== 'which-ec-to-use') errors.push('Playlist Commerce question mismatch');
  }
  if (ecSocialLoginPlacement) {
    if (ecSocialLoginPlacement.installTarget !== 'merchant-ec-plugin-or-sdk') errors.push('EC Social Login must install on merchant EC');
    if (!ecSocialLoginPlacement.loginButtonRequiredToShop) errors.push('EC Social Login must require login button');
    if (!ecSocialLoginPlacement.continueWithVeygritRequired) errors.push('EC Social Login must require Continue with Veygrit');
    if (ecSocialLoginPlacement.productQuestion !== 'how-to-buy-at-that-ec') errors.push('EC Social Login question mismatch');
  }
  for (const placement of strategy.commerceIntegrationPlacements) {
    for (const blocked of ['rawAddress', 'recipientPhone', 'savedAddressBody', 'privateKey', 'proofSecret']) {
      if (!placement.blockedMaterial.includes(blocked)) errors.push(`${placement.id} must block ${blocked}`);
      if (placement.safeOutputs.includes(blocked)) errors.push(`${placement.id} leaks ${blocked}`);
    }
  }
  if (strategy.safetyBoundaries.merchantRawAddressDefault !== false) errors.push('merchant raw address must be false by default');
  if (strategy.safetyBoundaries.clientCarrierCredentialsAllowed !== false) errors.push('client carrier credentials must be blocked');
  if (!strategy.revenueStreams.some(stream => stream.id === 'carrier-connect-managed')) errors.push('missing managed carrier revenue stream');
  if (!strategy.buildPhases.some(phase => phase.phase === 'v1.0')) errors.push('missing v1.0 managed network phase');
  if (strategy.webhookIdempotencyPolicy.minimumStoreTtlDays < 30) errors.push('webhook idempotency ttl too short');
  if (strategy.webhookIdempotencyPolicy.replayWindowSeconds < 300) errors.push('webhook replay window too short');
  if (strategy.webhookIdempotencyPolicy.productionRequirements.length < 5) errors.push('webhook production requirements too thin');
  if (!strategy.webhookIdempotencyPolicy.blockedMaterial.includes('rawAddress')) errors.push('webhook policy must block raw address');
  if (!strategy.nonClaims.some(nonClaim => /not proof of residence/i.test(nonClaim))) errors.push('missing residence non-claim');

  return errors;
}
