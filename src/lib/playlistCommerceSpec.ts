export type PlaylistCommerceActorId =
  | 'user'
  | 'creator'
  | 'merchant'
  | 'developer'
  | 'platform'
  | 'identity-wallet'
  | 'address-login'
  | 'travel-login'
  | 'delivery-gateway'
  | 'trade-gateway';

export type PlaylistCommerceCapabilityArea =
  | 'playlist'
  | 'discovery'
  | 'social'
  | 'checkout'
  | 'identity'
  | 'delivery'
  | 'travel'
  | 'merchant'
  | 'developer'
  | 'analytics';

export type PlaylistCommerceMaturity = 'mvp' | 'hardening' | 'future';

export type PlaylistCommerceActor = {
  id: PlaylistCommerceActorId;
  label: string;
  role: string;
};

export type PlaylistCommerceCapability = {
  id: string;
  area: PlaylistCommerceCapabilityArea;
  label: string;
  purpose: string;
  actors: PlaylistCommerceActorId[];
  requires: string[];
  publicData: string[];
  privateData: string[];
  maturity: PlaylistCommerceMaturity;
};

export type PlaylistCommerceApiType = 'sdk' | 'api' | 'webhook';

export type PlaylistCommerceApiSurface = {
  id: string;
  label: string;
  type: PlaylistCommerceApiType;
  endpoint?: string;
  purpose: string;
  requiredCapabilities: string[];
  rawAddressAllowed: false;
  privateMaterialAllowed: false;
};

export type PlaylistCommerceWebhookRouteStatus = 202 | 400 | 401 | 404 | 405;

export type PlaylistCommerceWebhookRouteContract = {
  id: string;
  method: 'POST';
  path: string;
  purpose: string;
  acceptedTopics: Array<
    | 'checkout.alias_created'
    | 'delivery.receipt_created'
    | 'analytics.aggregate_ready'
  >;
  responseStatuses: Array<{
    status: PlaylistCommerceWebhookRouteStatus;
    reason: string;
    bodyFields: string[];
  }>;
  requiredControls: string[];
  redactedFields: string[];
  nonClaims: string[];
};

export type PlaylistCommerceWebhookSyntheticPingPreflight = {
  id: string;
  label: string;
  routeId: string;
  method: 'POST';
  path: string;
  openApiPath: string;
  expectedStatus: 202;
  replayExpectedStatus: 401;
  eventId: string;
  topic: 'checkout.alias_created' | 'delivery.receipt_created' | 'analytics.aggregate_ready';
  keyId: string;
  localOnly: true;
  safeCommand: string;
  safeInputs: string[];
  blockedMaterial: string[];
  nonClaims: string[];
};

export type PlaylistArchetype = {
  id: string;
  label: string;
  purpose: string;
  defaultPrivacy: 'private' | 'friends' | 'public' | 'merchant_private';
  requiredCapabilities: string[];
  identityWalletTouchpoints: string[];
};

export type PlaylistCommerceFlowStage = {
  id: string;
  actor: PlaylistCommerceActorId;
  label: string;
  requiredCapabilities: string[];
  dataVisibility: {
    user: string[];
    merchant: string[];
    carrier: string[];
    platform: string[];
    hiddenFromMerchant: string[];
    notPersisted: string[];
  };
  next: string[];
};

export type PlaylistCommerceFlow = {
  id: string;
  label: string;
  goal: string;
  stages: PlaylistCommerceFlowStage[];
};

export type PlaylistCommerceAnalyticsMetric = {
  id: string;
  label: string;
  allowedFields: string[];
  forbiddenFields: string[];
  aggregation: 'count' | 'rate' | 'rank' | 'trend' | 'cohort';
};

export type PlaylistCommerceRiskControl = {
  id: string;
  threat: string;
  control: string;
  requiredCapabilities: string[];
};

export type PlaylistCommerceNonClaim = {
  id: string;
  statement: string;
  reason: string;
};

export type PlaylistCommerceSpec = {
  version: 'playlist-commerce-v0.1';
  principle: string;
  actors: PlaylistCommerceActor[];
  archetypes: PlaylistArchetype[];
  capabilities: PlaylistCommerceCapability[];
  apiSurfaces: PlaylistCommerceApiSurface[];
  webhookRoutes: PlaylistCommerceWebhookRouteContract[];
  webhookSyntheticPing: PlaylistCommerceWebhookSyntheticPingPreflight;
  flows: PlaylistCommerceFlow[];
  analytics: PlaylistCommerceAnalyticsMetric[];
  riskControls: PlaylistCommerceRiskControl[];
  nonClaims: PlaylistCommerceNonClaim[];
  acceptanceTests: string[];
};

const SECRET_FIELDS = [
  'raw_address',
  'recipient_phone',
  'private_key',
  'proof_witness',
  'biometric_template',
  'provider_token',
  'raw_provider_profile',
  'raw_carrier_payload',
];

export const PLAYLIST_COMMERCE_ACTORS: PlaylistCommerceActor[] = [
  {
    id: 'user',
    label: 'User',
    role: 'Creates playlists, chooses products, approves wallet consent, and controls delivery or travel data.',
  },
  {
    id: 'creator',
    label: 'Creator or friend',
    role: 'Publishes or shares review, gift, travel, or lifestyle playlists without seeing private address data.',
  },
  {
    id: 'merchant',
    label: 'Merchant',
    role: 'Receives playlist-attributed traffic, checkout aliases, consented claims, and aggregate analytics.',
  },
  {
    id: 'developer',
    label: 'Developer',
    role: 'Integrates playlist, search, checkout, Address Login, and wallet SDKs.',
  },
  {
    id: 'platform',
    label: 'Playlist Commerce Platform',
    role: 'Indexes products, stores playlists, coordinates identity consent, and emits aggregate analytics.',
  },
  {
    id: 'identity-wallet',
    label: 'Identity Wallet',
    role: 'Stores credentials, address aliases, consent history, travel data, proof bundles, and delivery preferences.',
  },
  {
    id: 'address-login',
    label: 'Address Login',
    role: 'Provides no-address checkout claims, carrier-decryptable handoff, and proof-only delivery authorization.',
  },
  {
    id: 'travel-login',
    label: 'Travel Login',
    role: 'Provides hotel, airport, and travel-prep consent flows for trips and QR check-in.',
  },
  {
    id: 'delivery-gateway',
    label: 'Delivery Gateway',
    role: 'Routes approved carrier handoff references and delivery receipts.',
  },
  {
    id: 'trade-gateway',
    label: 'Trade Gateway',
    role: 'Adds cross-border eligibility, customs hints, HS-code evidence, and restricted-item review states.',
  },
];

export const PLAYLIST_COMMERCE_CAPABILITIES: PlaylistCommerceCapability[] = [
  {
    id: 'playlist.create',
    area: 'playlist',
    label: 'Create playlist',
    purpose: 'Create purpose-based shopping lists such as moving, travel, monthly repeat, and gift plans.',
    actors: ['user', 'platform'],
    requires: [],
    publicData: ['playlist_id', 'title', 'visibility'],
    privateData: ['private_notes'],
    maturity: 'mvp',
  },
  {
    id: 'playlist.saveProduct',
    area: 'playlist',
    label: 'Save product',
    purpose: 'Save items from multiple merchants into one playlist.',
    actors: ['user', 'merchant', 'platform'],
    requires: ['playlist.create'],
    publicData: ['product_ref', 'merchant_ref', 'playlist_id'],
    privateData: ['user_intent_note'],
    maturity: 'mvp',
  },
  {
    id: 'playlist.compareProducts',
    area: 'playlist',
    label: 'Compare products',
    purpose: 'Compare saved products across brands and merchants without requiring a merchant account.',
    actors: ['user', 'platform'],
    requires: ['playlist.saveProduct'],
    publicData: ['price_snapshot_ref', 'attribute_summary'],
    privateData: ['personal_ranking'],
    maturity: 'hardening',
  },
  {
    id: 'playlist.share',
    area: 'social',
    label: 'Share playlist',
    purpose: 'Share public or scoped playlists with friends, family, or followers.',
    actors: ['user', 'creator', 'platform'],
    requires: ['playlist.create'],
    publicData: ['share_link', 'visibility', 'playlist_summary'],
    privateData: ['address_alias', 'consent_history'],
    maturity: 'mvp',
  },
  {
    id: 'playlist.follow',
    area: 'social',
    label: 'Follow playlist or creator',
    purpose: 'Follow friends, influencers, brands, and review playlists.',
    actors: ['user', 'creator', 'platform'],
    requires: ['playlist.share'],
    publicData: ['follow_ref', 'creator_alias'],
    privateData: ['social_graph_edges'],
    maturity: 'future',
  },
  {
    id: 'playlist.reorder',
    area: 'playlist',
    label: 'One-tap repeat list',
    purpose: 'Rebuild a monthly or event playlist into a checkout plan.',
    actors: ['user', 'platform', 'merchant'],
    requires: ['playlist.saveProduct', 'checkout.oneTap'],
    publicData: ['playlist_id', 'checkout_plan_ref'],
    privateData: ['delivery_preferences'],
    maturity: 'hardening',
  },
  {
    id: 'commerce.crossEcSearch',
    area: 'discovery',
    label: 'Cross-EC search',
    purpose: 'Search products across merchants, brands, countries, and gift shops.',
    actors: ['user', 'platform', 'merchant'],
    requires: [],
    publicData: ['query', 'product_refs', 'merchant_refs'],
    privateData: ['personalized_query_context'],
    maturity: 'mvp',
  },
  {
    id: 'commerce.brandSearch',
    area: 'discovery',
    label: 'Brand search',
    purpose: 'Search brands and official merchant stores.',
    actors: ['user', 'merchant', 'platform'],
    requires: [],
    publicData: ['brand_ref', 'merchant_ref'],
    privateData: [],
    maturity: 'mvp',
  },
  {
    id: 'recommendation.playlist',
    area: 'discovery',
    label: 'Playlist recommendation',
    purpose: 'Recommend gift, travel, new-life, and repeat-purchase playlists.',
    actors: ['user', 'creator', 'platform'],
    requires: ['playlist.create'],
    publicData: ['playlist_ref', 'recommendation_reason'],
    privateData: ['raw_behavior_log'],
    maturity: 'future',
  },
  {
    id: 'identity.walletConsent',
    area: 'identity',
    label: 'Identity Wallet consent',
    purpose: 'Ask the wallet for purpose-bound consent before checkout, hotel delivery, gift delivery, or QR check-in.',
    actors: ['user', 'identity-wallet', 'platform'],
    requires: [],
    publicData: ['consent_envelope_ref', 'purpose', 'expiry'],
    privateData: ['credential_secret', 'proof_witness', 'private_key'],
    maturity: 'mvp',
  },
  {
    id: 'address.noEntryCheckout',
    area: 'identity',
    label: 'No-address checkout',
    purpose: 'Let a merchant receive only deliverability and checkout authorization while Address Login handles carrier-specific handoff.',
    actors: ['user', 'merchant', 'address-login', 'identity-wallet'],
    requires: ['identity.walletConsent'],
    publicData: ['subject_alias', 'deliverable', 'consent_envelope_ref'],
    privateData: ['raw_address', 'recipient_phone', 'unit_note'],
    maturity: 'mvp',
  },
  {
    id: 'checkout.oneTap',
    area: 'checkout',
    label: 'One-tap checkout',
    purpose: 'Convert a playlist or saved product into a checkout request without repeated address entry.',
    actors: ['user', 'merchant', 'platform', 'address-login'],
    requires: ['playlist.saveProduct', 'address.noEntryCheckout'],
    publicData: ['checkout_session_ref', 'order_alias', 'merchant_ref'],
    privateData: ['raw_address', 'payment_secret'],
    maturity: 'mvp',
  },
  {
    id: 'delivery.gift',
    area: 'delivery',
    label: 'Private gift delivery',
    purpose: 'Send gifts to friends or family using recipient aliases rather than visible recipient addresses.',
    actors: ['user', 'identity-wallet', 'address-login', 'delivery-gateway'],
    requires: ['identity.walletConsent', 'address.noEntryCheckout'],
    publicData: ['recipient_alias', 'delivery_authorized'],
    privateData: ['recipient_raw_address', 'recipient_phone'],
    maturity: 'hardening',
  },
  {
    id: 'delivery.hotel',
    area: 'delivery',
    label: 'Hotel delivery',
    purpose: 'Connect travel itinerary, hotel consent, and carrier handoff for trip playlists.',
    actors: ['user', 'travel-login', 'address-login', 'delivery-gateway'],
    requires: ['identity.walletConsent', 'address.noEntryCheckout'],
    publicData: ['hotel_alias', 'arrival_window', 'delivery_authorized'],
    privateData: ['room_number', 'passport_data', 'raw_address'],
    maturity: 'hardening',
  },
  {
    id: 'delivery.carrierHandoff',
    area: 'delivery',
    label: 'Carrier handoff',
    purpose: 'Give the carrier a scoped delivery reference or encrypted address only after wallet approval.',
    actors: ['address-login', 'delivery-gateway', 'merchant'],
    requires: ['address.noEntryCheckout'],
    publicData: ['handoff_ref', 'carrier_id', 'delivery_receipt_ref'],
    privateData: ['carrier_decryptable_address', 'recipient_phone'],
    maturity: 'mvp',
  },
  {
    id: 'travel.qrCheckIn',
    area: 'travel',
    label: 'QR check-in',
    purpose: 'Use trip playlists to check in at hotels, airports, events, and pickup counters.',
    actors: ['user', 'travel-login', 'identity-wallet'],
    requires: ['identity.walletConsent'],
    publicData: ['qr_session_ref', 'checkin_status'],
    privateData: ['passport_data', 'raw_itinerary_secret'],
    maturity: 'future',
  },
  {
    id: 'trade.crossBorderEligibility',
    area: 'checkout',
    label: 'Cross-border eligibility',
    purpose: 'Attach customs, restricted-item, and HS-code review states to cross-border playlist checkout.',
    actors: ['merchant', 'trade-gateway', 'platform'],
    requires: ['checkout.oneTap'],
    publicData: ['trade_review_status', 'hs_code_hint', 'country_pair'],
    privateData: ['regulated_document_payload'],
    maturity: 'future',
  },
  {
    id: 'merchant.analytics',
    area: 'analytics',
    label: 'Merchant playlist analytics',
    purpose: 'Show aggregate saves, attribution, conversion, rank, and trend without exposing private addresses or social graph.',
    actors: ['merchant', 'platform'],
    requires: ['playlist.saveProduct'],
    publicData: ['save_count', 'purchase_rate', 'playlist_rank', 'trend_window'],
    privateData: ['raw_address', 'social_graph_edges', 'recipient_identity'],
    maturity: 'mvp',
  },
  {
    id: 'developer.sdk',
    area: 'developer',
    label: 'Developer SDK',
    purpose: 'Expose playlist, search, save, share, checkout, identity wallet, and Address Login integration primitives.',
    actors: ['developer', 'platform'],
    requires: [],
    publicData: ['sdk_version', 'test_vector_ref'],
    privateData: ['production_client_secret'],
    maturity: 'mvp',
  },
  {
    id: 'merchant.webhook',
    area: 'merchant',
    label: 'Merchant webhook',
    purpose: 'Notify merchants about playlist saves, checkout aliases, delivery receipts, and aggregate conversion events.',
    actors: ['merchant', 'platform'],
    requires: ['developer.sdk'],
    publicData: ['event_id', 'event_type', 'order_alias', 'playlist_ref'],
    privateData: ['raw_address', 'proof_witness', 'private_key'],
    maturity: 'mvp',
  },
];

export const PLAYLIST_ARCHETYPES: PlaylistArchetype[] = [
  {
    id: 'wishlist',
    label: 'Wishlist',
    purpose: 'Save products for later comparison or purchase.',
    defaultPrivacy: 'private',
    requiredCapabilities: ['playlist.create', 'playlist.saveProduct', 'commerce.crossEcSearch'],
    identityWalletTouchpoints: ['optional login for sync'],
  },
  {
    id: 'gift-list',
    label: 'Gift list',
    purpose: 'Share gift ideas and send to a recipient alias without exposing the recipient address.',
    defaultPrivacy: 'friends',
    requiredCapabilities: ['playlist.share', 'delivery.gift', 'address.noEntryCheckout'],
    identityWalletTouchpoints: ['recipient alias', 'gift delivery consent', 'carrier handoff'],
  },
  {
    id: 'moving-list',
    label: 'Moving list',
    purpose: 'Group furniture, utilities, address-change tasks, and staged delivery windows.',
    defaultPrivacy: 'private',
    requiredCapabilities: ['playlist.create', 'checkout.oneTap', 'delivery.carrierHandoff'],
    identityWalletTouchpoints: ['new address credential', 'delivery window approval'],
  },
  {
    id: 'new-life-list',
    label: 'New-life list',
    purpose: 'Bundle starter goods for school, work, home, or family events.',
    defaultPrivacy: 'friends',
    requiredCapabilities: ['playlist.share', 'playlist.compareProducts', 'checkout.oneTap'],
    identityWalletTouchpoints: ['address alias', 'shared purchase approval'],
  },
  {
    id: 'travel-prep-list',
    label: 'Travel prep list',
    purpose: 'Prepare products, hotel delivery, QR check-in, and travel document tasks for a trip.',
    defaultPrivacy: 'private',
    requiredCapabilities: ['travel.qrCheckIn', 'delivery.hotel', 'checkout.oneTap'],
    identityWalletTouchpoints: ['Travel Login', 'hotel alias', 'arrival window'],
  },
  {
    id: 'monthly-repeat-list',
    label: 'Monthly repeat list',
    purpose: 'Reorder consumables and recurring purchases with one-tap approval.',
    defaultPrivacy: 'private',
    requiredCapabilities: ['playlist.reorder', 'checkout.oneTap', 'address.noEntryCheckout'],
    identityWalletTouchpoints: ['delivery preference reuse', 'fresh consent'],
  },
  {
    id: 'event-list',
    label: 'Event list',
    purpose: 'Coordinate event, party, school, campaign, or seasonal purchase plans.',
    defaultPrivacy: 'friends',
    requiredCapabilities: ['playlist.share', 'merchant.analytics', 'checkout.oneTap'],
    identityWalletTouchpoints: ['group consent boundary', 'delivery alias'],
  },
  {
    id: 'creator-review-list',
    label: 'Creator review list',
    purpose: 'Follow product collections published by creators or reviewers.',
    defaultPrivacy: 'public',
    requiredCapabilities: ['playlist.follow', 'recommendation.playlist', 'commerce.brandSearch'],
    identityWalletTouchpoints: ['optional checkout consent only'],
  },
  {
    id: 'hotel-delivery-list',
    label: 'Hotel delivery list',
    purpose: 'Ship items to a hotel during a verified stay without exposing full guest data to the merchant.',
    defaultPrivacy: 'merchant_private',
    requiredCapabilities: ['delivery.hotel', 'travel.qrCheckIn', 'address.noEntryCheckout'],
    identityWalletTouchpoints: ['Travel Login', 'hotel delivery credential', 'arrival window'],
  },
  {
    id: 'cross-border-list',
    label: 'Cross-border list',
    purpose: 'Collect international products and check customs, restrictions, and delivery eligibility.',
    defaultPrivacy: 'private',
    requiredCapabilities: ['trade.crossBorderEligibility', 'checkout.oneTap', 'address.noEntryCheckout'],
    identityWalletTouchpoints: ['country claims', 'carrier availability', 'customs minimum fields'],
  },
];

export const PLAYLIST_COMMERCE_API_SURFACES: PlaylistCommerceApiSurface[] = [
  {
    id: 'playlist-sdk',
    label: 'Playlist SDK',
    type: 'sdk',
    purpose: 'Create, edit, reorder, and render playlists in merchant or platform experiences.',
    requiredCapabilities: ['playlist.create', 'playlist.saveProduct'],
    rawAddressAllowed: false,
    privateMaterialAllowed: false,
  },
  {
    id: 'search-api',
    label: 'Search API',
    type: 'api',
    endpoint: 'POST /playlist-commerce/search',
    purpose: 'Search products, brands, gift shops, cross-border catalogs, and playlist recommendations.',
    requiredCapabilities: ['commerce.crossEcSearch', 'commerce.brandSearch'],
    rawAddressAllowed: false,
    privateMaterialAllowed: false,
  },
  {
    id: 'product-api',
    label: 'Product API',
    type: 'api',
    endpoint: 'GET /playlist-commerce/products/{productRef}',
    purpose: 'Resolve product references, merchant references, and product snapshots.',
    requiredCapabilities: ['playlist.saveProduct'],
    rawAddressAllowed: false,
    privateMaterialAllowed: false,
  },
  {
    id: 'share-api',
    label: 'Share API',
    type: 'api',
    endpoint: 'POST /playlist-commerce/playlists/{playlistId}/share',
    purpose: 'Create scoped share links for friends, families, events, or public creator playlists.',
    requiredCapabilities: ['playlist.share'],
    rawAddressAllowed: false,
    privateMaterialAllowed: false,
  },
  {
    id: 'save-api',
    label: 'Save API',
    type: 'api',
    endpoint: 'POST /playlist-commerce/playlists/{playlistId}/items',
    purpose: 'Save products from any integrated merchant into a playlist.',
    requiredCapabilities: ['playlist.saveProduct'],
    rawAddressAllowed: false,
    privateMaterialAllowed: false,
  },
  {
    id: 'recommendation-api',
    label: 'Recommendation API',
    type: 'api',
    endpoint: 'POST /playlist-commerce/recommendations',
    purpose: 'Suggest playlists, complementary products, gift sets, and travel-prep products.',
    requiredCapabilities: ['recommendation.playlist'],
    rawAddressAllowed: false,
    privateMaterialAllowed: false,
  },
  {
    id: 'checkout-api',
    label: 'Checkout API',
    type: 'api',
    endpoint: 'POST /playlist-commerce/checkout',
    purpose: 'Turn a product, playlist, or repeat list into a checkout plan with wallet-mediated delivery.',
    requiredCapabilities: ['checkout.oneTap', 'address.noEntryCheckout'],
    rawAddressAllowed: false,
    privateMaterialAllowed: false,
  },
  {
    id: 'identity-wallet-sdk',
    label: 'Identity Wallet SDK',
    type: 'sdk',
    purpose: 'Request wallet consent, address aliases, proof bundles, and travel-delivery permissions.',
    requiredCapabilities: ['identity.walletConsent'],
    rawAddressAllowed: false,
    privateMaterialAllowed: false,
  },
  {
    id: 'address-login-sdk',
    label: 'Address Login SDK',
    type: 'sdk',
    purpose: 'Request no-address checkout claims and carrier-decryptable delivery handoff references.',
    requiredCapabilities: ['address.noEntryCheckout', 'delivery.carrierHandoff'],
    rawAddressAllowed: false,
    privateMaterialAllowed: false,
  },
  {
    id: 'merchant-webhook',
    label: 'Merchant Webhook',
    type: 'webhook',
    endpoint: 'POST /webhooks/playlist-commerce',
    purpose: 'Notify merchants about save, share, checkout alias, delivery receipt, and aggregate analytics events.',
    requiredCapabilities: ['merchant.webhook'],
    rawAddressAllowed: false,
    privateMaterialAllowed: false,
  },
];

export const PLAYLIST_COMMERCE_WEBHOOK_ROUTES: PlaylistCommerceWebhookRouteContract[] = [
  {
    id: 'merchant-webhook-route',
    method: 'POST',
    path: '/webhooks/playlist-commerce',
    purpose: 'Receive signed Playlist Commerce merchant webhook events with replay, key status, topic, and redaction checks.',
    acceptedTopics: ['checkout.alias_created', 'delivery.receipt_created', 'analytics.aggregate_ready'],
    responseStatuses: [
      {
        status: 202,
        reason: 'Accepted signed event and stored event id for idempotency.',
        bodyFields: ['ok', 'eventId', 'topic', 'keyId', 'keyStatus', 'resultRef', 'errors', 'nonClaims'],
      },
      {
        status: 400,
        reason: 'Missing or malformed webhook body.',
        bodyFields: ['ok', 'errors', 'nonClaims'],
      },
      {
        status: 401,
        reason: 'Signature, timestamp, key status, topic allowlist, or idempotency check failed.',
        bodyFields: ['ok', 'eventId', 'topic', 'keyId', 'keyStatus', 'resultRef', 'errors', 'nonClaims'],
      },
      {
        status: 404,
        reason: 'Webhook route was not found.',
        bodyFields: ['ok', 'errors', 'nonClaims'],
      },
      {
        status: 405,
        reason: 'Only POST is allowed for the webhook route.',
        bodyFields: ['ok', 'errors', 'nonClaims'],
      },
    ],
    requiredControls: [
      'hmac-sha256-signature',
      'constant-time-compare',
      'timestamp-replay-window',
      'keyring-status-active-next-retired',
      'event-id-idempotency-store',
      'topic-allowlist',
      'redacted-operational-response',
    ],
    redactedFields: [
      'payload',
      'playlistRef',
      'productRef',
      'orderAlias',
      'receiptRef',
      'raw_address',
      'recipient_phone',
      'provider_token',
      'raw_provider_profile',
      'raw_carrier_payload',
      'proof_witness',
      'private_key',
      'biometric_template',
    ],
    nonClaims: [
      'not-payment-settlement',
      'not-raw-address-intake',
      'not-proof-witness-intake',
      'not-provider-token-intake',
      'not-raw-carrier-payload-intake',
      'not-merchant-identity-verification',
    ],
  },
];

export const PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT: PlaylistCommerceWebhookSyntheticPingPreflight = {
  id: 'merchant-webhook-synthetic-signed-ping',
  label: 'Synthetic signed ping',
  routeId: 'merchant-webhook-route',
  method: 'POST',
  path: '/webhooks/playlist-commerce',
  openApiPath: 'docs/specs/playlist-commerce-webhooks.openapi.yaml',
  expectedStatus: 202,
  replayExpectedStatus: 401,
  eventId: 'evt_pc_synthetic_ping_001',
  topic: 'checkout.alias_created',
  keyId: 'pc_ping_key_active',
  localOnly: true,
  safeCommand: 'npm run verify:playlist-commerce',
  safeInputs: [
    'eventId',
    'topic',
    'timestamp',
    'keyId',
    'signature',
    'orderAlias',
    'subjectAlias',
  ],
  blockedMaterial: [
    'raw_address',
    'recipient_phone',
    'provider_token',
    'raw_provider_profile',
    'raw_carrier_payload',
    'proof_witness',
    'private_key',
    'biometric_template',
    'production_webhook_secret',
  ],
  nonClaims: [
    'not-payment-settlement',
    'not-raw-address-intake',
    'not-proof-witness-intake',
    'not-provider-token-intake',
    'not-raw-carrier-payload-intake',
    'not-production-delivery-attempt',
  ],
};

export const PLAYLIST_COMMERCE_FLOWS: PlaylistCommerceFlow[] = [
  {
    id: 'no-address-playlist-checkout',
    label: 'No-address playlist checkout',
    goal: 'Move from product discovery to delivery without giving the merchant raw address data.',
    stages: [
      {
        id: 'create-playlist',
        actor: 'user',
        label: 'Create purpose playlist',
        requiredCapabilities: ['playlist.create'],
        dataVisibility: {
          user: ['playlist_title', 'items'],
          merchant: [],
          carrier: [],
          platform: ['playlist_id', 'visibility'],
          hiddenFromMerchant: ['raw_address', 'recipient_phone', 'identity_wallet_secret'],
          notPersisted: SECRET_FIELDS,
        },
        next: ['cross-ec-search'],
      },
      {
        id: 'cross-ec-search',
        actor: 'platform',
        label: 'Search across merchants and brands',
        requiredCapabilities: ['commerce.crossEcSearch', 'commerce.brandSearch'],
        dataVisibility: {
          user: ['query', 'product_results'],
          merchant: ['attribution_ref'],
          carrier: [],
          platform: ['query', 'product_refs'],
          hiddenFromMerchant: ['raw_address', 'recipient_phone', 'wallet_credentials'],
          notPersisted: SECRET_FIELDS,
        },
        next: ['save-product'],
      },
      {
        id: 'save-product',
        actor: 'user',
        label: 'Save product to playlist',
        requiredCapabilities: ['playlist.saveProduct'],
        dataVisibility: {
          user: ['product_ref', 'playlist_id'],
          merchant: ['product_saved_event', 'playlist_category'],
          carrier: [],
          platform: ['save_event', 'product_ref', 'merchant_ref'],
          hiddenFromMerchant: ['raw_address', 'recipient_phone', 'private_playlist_note'],
          notPersisted: SECRET_FIELDS,
        },
        next: ['wallet-consent'],
      },
      {
        id: 'wallet-consent',
        actor: 'identity-wallet',
        label: 'Approve checkout purpose',
        requiredCapabilities: ['identity.walletConsent', 'address.noEntryCheckout'],
        dataVisibility: {
          user: ['consent_summary', 'delivery_alias', 'disclosure_mode'],
          merchant: ['subject_alias', 'deliverable', 'consent_envelope_ref'],
          carrier: [],
          platform: ['consent_event_ref'],
          hiddenFromMerchant: ['raw_address', 'recipient_phone', 'proof_witness', 'private_key'],
          notPersisted: SECRET_FIELDS,
        },
        next: ['merchant-order-alias'],
      },
      {
        id: 'merchant-order-alias',
        actor: 'merchant',
        label: 'Merchant receives order alias',
        requiredCapabilities: ['checkout.oneTap'],
        dataVisibility: {
          user: ['order_alias', 'merchant_name'],
          merchant: ['order_alias', 'items', 'deliverable', 'payment_status'],
          carrier: [],
          platform: ['checkout_session_ref', 'order_alias'],
          hiddenFromMerchant: ['raw_address', 'recipient_phone', 'carrier_decryptable_address'],
          notPersisted: SECRET_FIELDS,
        },
        next: ['carrier-handoff'],
      },
      {
        id: 'carrier-handoff',
        actor: 'delivery-gateway',
        label: 'Carrier receives scoped handoff',
        requiredCapabilities: ['delivery.carrierHandoff'],
        dataVisibility: {
          user: ['delivery_receipt_ref'],
          merchant: ['delivery_status', 'receipt_ref'],
          carrier: ['handoff_ref', 'carrier_decryptable_address_ref', 'delivery_window'],
          platform: ['handoff_ref', 'receipt_ref'],
          hiddenFromMerchant: ['raw_address', 'recipient_phone', 'carrier_decryptable_address'],
          notPersisted: SECRET_FIELDS,
        },
        next: ['delivery-receipt'],
      },
      {
        id: 'delivery-receipt',
        actor: 'delivery-gateway',
        label: 'Delivery receipt and playlist attribution',
        requiredCapabilities: ['merchant.webhook', 'merchant.analytics'],
        dataVisibility: {
          user: ['receipt_ref', 'delivery_status'],
          merchant: ['receipt_ref', 'delivery_status', 'attribution_ref'],
          carrier: ['receipt_ref'],
          platform: ['aggregate_conversion_event'],
          hiddenFromMerchant: ['raw_address', 'recipient_phone', 'proof_witness'],
          notPersisted: SECRET_FIELDS,
        },
        next: [],
      },
    ],
  },
  {
    id: 'travel-hotel-playlist-delivery',
    label: 'Travel playlist to hotel delivery',
    goal: 'Connect travel preparation, Travel Login, hotel alias, and carrier handoff.',
    stages: [
      {
        id: 'travel-playlist',
        actor: 'user',
        label: 'Build travel-prep playlist',
        requiredCapabilities: ['playlist.create', 'delivery.hotel'],
        dataVisibility: {
          user: ['trip_alias', 'items', 'arrival_window'],
          merchant: [],
          carrier: [],
          platform: ['playlist_id', 'trip_alias'],
          hiddenFromMerchant: ['passport_data', 'room_number', 'raw_address'],
          notPersisted: SECRET_FIELDS,
        },
        next: ['travel-login-consent'],
      },
      {
        id: 'travel-login-consent',
        actor: 'travel-login',
        label: 'Approve hotel delivery and QR check-in scope',
        requiredCapabilities: ['travel.qrCheckIn', 'identity.walletConsent'],
        dataVisibility: {
          user: ['hotel_alias', 'arrival_window', 'qr_session_ref'],
          merchant: ['hotel_delivery_authorized'],
          carrier: [],
          platform: ['travel_consent_ref'],
          hiddenFromMerchant: ['passport_data', 'room_number', 'raw_address'],
          notPersisted: SECRET_FIELDS,
        },
        next: ['hotel-carrier-handoff'],
      },
      {
        id: 'hotel-carrier-handoff',
        actor: 'delivery-gateway',
        label: 'Handoff to carrier with hotel delivery reference',
        requiredCapabilities: ['delivery.carrierHandoff', 'delivery.hotel'],
        dataVisibility: {
          user: ['hotel_delivery_receipt_ref'],
          merchant: ['delivery_status'],
          carrier: ['hotel_alias', 'arrival_window', 'carrier_decryptable_address_ref'],
          platform: ['handoff_ref'],
          hiddenFromMerchant: ['raw_address', 'room_number', 'passport_data'],
          notPersisted: SECRET_FIELDS,
        },
        next: [],
      },
    ],
  },
];

export const PLAYLIST_COMMERCE_ANALYTICS: PlaylistCommerceAnalyticsMetric[] = [
  {
    id: 'playlist-save-count',
    label: 'Playlist save count',
    allowedFields: ['merchant_ref', 'product_ref', 'playlist_category', 'save_count'],
    forbiddenFields: ['raw_address', 'recipient_identity', 'social_graph_edges'],
    aggregation: 'count',
  },
  {
    id: 'playlist-purchase-rate',
    label: 'Playlist purchase rate',
    allowedFields: ['merchant_ref', 'product_ref', 'playlist_category', 'purchase_rate'],
    forbiddenFields: ['raw_address', 'recipient_phone', 'private_playlist_note'],
    aggregation: 'rate',
  },
  {
    id: 'playlist-ranking',
    label: 'Playlist ranking',
    allowedFields: ['playlist_category', 'rank', 'trend_window'],
    forbiddenFields: ['raw_address', 'identity_wallet_secret', 'proof_witness'],
    aggregation: 'rank',
  },
  {
    id: 'trend-analysis',
    label: 'Trend analysis',
    allowedFields: ['category', 'region_bucket', 'trend_window', 'save_count'],
    forbiddenFields: ['raw_address', 'fine_location', 'recipient_identity'],
    aggregation: 'trend',
  },
];

export const PLAYLIST_COMMERCE_RISK_CONTROLS: PlaylistCommerceRiskControl[] = [
  {
    id: 'no-raw-address-merchant',
    threat: 'Merchant stores or correlates raw address data through playlist checkout.',
    control: 'Use Address Login subject aliases, consent envelopes, and carrier handoff references by default.',
    requiredCapabilities: ['address.noEntryCheckout', 'delivery.carrierHandoff'],
  },
  {
    id: 'gift-abuse-review',
    threat: 'Gift delivery is used for harassment or unwanted shipments.',
    control: 'Recipient alias must be consented or policy-reviewed; high-risk gifts require wallet confirmation.',
    requiredCapabilities: ['delivery.gift', 'identity.walletConsent'],
  },
  {
    id: 'social-graph-minimization',
    threat: 'Following and sharing playlists exposes private relationships.',
    control: 'Publish creator aliases and aggregate metrics, not raw social graph edges.',
    requiredCapabilities: ['playlist.share', 'playlist.follow'],
  },
  {
    id: 'hotel-delivery-boundary',
    threat: 'Hotel delivery exposes travel or room information to merchants.',
    control: 'Travel Login provides hotel alias and arrival window; room/passport data stays wallet-side or hotel-side.',
    requiredCapabilities: ['delivery.hotel', 'travel.qrCheckIn'],
  },
  {
    id: 'cross-border-non-legal-claim',
    threat: 'Cross-border playlist checkout is mistaken for final customs or tax legal advice.',
    control: 'Trade Gateway emits review states and evidence references; final legal/compliance review remains separate.',
    requiredCapabilities: ['trade.crossBorderEligibility'],
  },
];

export const PLAYLIST_COMMERCE_NON_CLAIMS: PlaylistCommerceNonClaim[] = [
  {
    id: 'not-full-marketplace',
    statement: 'Playlist Commerce is not a full marketplace, order-management system, inventory system, or merchant-of-record by default.',
    reason: 'The core contract coordinates playlists, discovery, consent, and checkout aliases while existing merchants remain system of record.',
  },
  {
    id: 'not-payment-processor',
    statement: 'Playlist Commerce does not process payments unless a separately reviewed payment adapter is added.',
    reason: 'Payment credentials and settlement rules require a distinct security, compliance, and licensing boundary.',
  },
  {
    id: 'not-price-guarantee',
    statement: 'Product snapshots and comparisons do not guarantee final price, availability, import eligibility, or delivery time.',
    reason: 'Merchants, carriers, customs, and inventory systems remain authoritative for final terms.',
  },
  {
    id: 'not-raw-address-store',
    statement: 'The platform does not store raw address, recipient phone, proof witness, private key, or biometric template material.',
    reason: 'Address Identity Network keeps private address data in wallet/provider boundaries and uses references, aliases, and proof plans.',
  },
  {
    id: 'not-scraping-default',
    statement: 'Cross-EC search assumes merchant feeds, public catalogs, or licensed connectors rather than unauthorized scraping.',
    reason: 'A credible commercial/private commerce layer still needs lawful source policy and connector boundaries for public integration fixtures.',
  },
];

export function buildPlaylistCommerceSpec(): PlaylistCommerceSpec {
  return {
    version: 'playlist-commerce-v0.1',
    principle: 'Manage shopping by purpose, then connect discovery, consent, checkout, and delivery without exposing raw address data to merchants.',
    actors: PLAYLIST_COMMERCE_ACTORS,
    archetypes: PLAYLIST_ARCHETYPES,
    capabilities: PLAYLIST_COMMERCE_CAPABILITIES,
    apiSurfaces: PLAYLIST_COMMERCE_API_SURFACES,
    webhookRoutes: PLAYLIST_COMMERCE_WEBHOOK_ROUTES,
    webhookSyntheticPing: PLAYLIST_COMMERCE_WEBHOOK_SYNTHETIC_PING_PREFLIGHT,
    flows: PLAYLIST_COMMERCE_FLOWS,
    analytics: PLAYLIST_COMMERCE_ANALYTICS,
    riskControls: PLAYLIST_COMMERCE_RISK_CONTROLS,
    nonClaims: PLAYLIST_COMMERCE_NON_CLAIMS,
    acceptanceTests: [
      'Every public API surface forbids raw address and private proof material.',
      'No-address checkout flow includes wallet consent, Address Login, checkout alias, carrier handoff, and delivery receipt.',
      'Merchant analytics are aggregate and exclude raw address, recipient identity, and private social graph fields.',
      'Gift and hotel delivery flows have explicit privacy controls.',
      'Non-claims prevent marketplace, payment, price, legal, and raw-address overclaims.',
    ],
  };
}

export function getPlaylistCommerceFlow(id: string, spec: PlaylistCommerceSpec = buildPlaylistCommerceSpec()) {
  return spec.flows.find(flow => flow.id === id);
}

export function validatePlaylistCommerceSpec(spec: PlaylistCommerceSpec = buildPlaylistCommerceSpec()): string[] {
  const errors: string[] = [];
  const capabilityIds = new Set(spec.capabilities.map(capability => capability.id));
  const apiIds = new Set(spec.apiSurfaces.map(api => api.id));
  const actorIds = new Set(spec.actors.map(actor => actor.id));

  for (const required of [
    'playlist.create',
    'playlist.saveProduct',
    'commerce.crossEcSearch',
    'checkout.oneTap',
    'identity.walletConsent',
    'address.noEntryCheckout',
    'delivery.carrierHandoff',
    'merchant.analytics',
    'developer.sdk',
  ]) {
    if (!capabilityIds.has(required)) errors.push(`missing-capability:${required}`);
  }

  for (const required of [
    'playlist-sdk',
    'search-api',
    'product-api',
    'share-api',
    'save-api',
    'recommendation-api',
    'checkout-api',
    'identity-wallet-sdk',
    'address-login-sdk',
  ]) {
    if (!apiIds.has(required)) errors.push(`missing-api:${required}`);
  }

  for (const capability of spec.capabilities) {
    for (const actor of capability.actors) {
      if (!actorIds.has(actor)) errors.push(`unknown-actor:${capability.id}:${actor}`);
    }
    for (const required of capability.requires) {
      if (!capabilityIds.has(required)) errors.push(`unknown-capability-requirement:${capability.id}:${required}`);
    }
  }

  for (const api of spec.apiSurfaces) {
    if (api.rawAddressAllowed !== false) errors.push(`api-raw-address-allowed:${api.id}`);
    if (api.privateMaterialAllowed !== false) errors.push(`api-private-material-allowed:${api.id}`);
    for (const required of api.requiredCapabilities) {
      if (!capabilityIds.has(required)) errors.push(`api-unknown-capability:${api.id}:${required}`);
    }
  }

  for (const route of spec.webhookRoutes) {
    if (route.method !== 'POST') errors.push(`webhook-route-non-post:${route.id}`);
    if (!route.path.startsWith('/webhooks/')) errors.push(`webhook-route-path-not-webhook:${route.id}`);
    for (const required of [202, 400, 401, 404, 405] as const) {
      if (!route.responseStatuses.some(response => response.status === required)) {
        errors.push(`webhook-route-missing-status:${route.id}:${required}`);
      }
    }
    for (const required of [
      'hmac-sha256-signature',
      'constant-time-compare',
      'timestamp-replay-window',
      'keyring-status-active-next-retired',
      'event-id-idempotency-store',
      'topic-allowlist',
      'redacted-operational-response',
    ]) {
      if (!route.requiredControls.includes(required)) errors.push(`webhook-route-missing-control:${route.id}:${required}`);
    }
    for (const response of route.responseStatuses) {
      for (const forbidden of ['payload', 'raw_address', 'recipient_phone', 'proof_witness', 'private_key', 'biometric_template']) {
        if (response.bodyFields.includes(forbidden)) errors.push(`webhook-route-response-leaks-field:${route.id}:${response.status}:${forbidden}`);
      }
      if (!response.bodyFields.includes('nonClaims')) errors.push(`webhook-route-response-missing-non-claims:${route.id}:${response.status}`);
    }
    for (const required of ['payload', 'raw_address', 'proof_witness', 'private_key']) {
      if (!route.redactedFields.includes(required)) errors.push(`webhook-route-redaction-missing:${route.id}:${required}`);
    }
    for (const required of ['not-raw-address-intake', 'not-proof-witness-intake']) {
      if (!route.nonClaims.includes(required)) errors.push(`webhook-route-non-claim-missing:${route.id}:${required}`);
    }
  }

  const pingRoute = spec.webhookRoutes.find(route => route.id === spec.webhookSyntheticPing.routeId);
  if (!pingRoute) {
    errors.push(`synthetic-ping-unknown-route:${spec.webhookSyntheticPing.routeId}`);
  } else {
    if (spec.webhookSyntheticPing.path !== pingRoute.path) errors.push('synthetic-ping-route-path-mismatch');
    if (spec.webhookSyntheticPing.method !== pingRoute.method) errors.push('synthetic-ping-route-method-mismatch');
    if (!pingRoute.acceptedTopics.includes(spec.webhookSyntheticPing.topic)) errors.push('synthetic-ping-topic-not-accepted');
    if (!pingRoute.responseStatuses.some(response => response.status === spec.webhookSyntheticPing.expectedStatus)) {
      errors.push('synthetic-ping-accepted-status-missing');
    }
    if (!pingRoute.responseStatuses.some(response => response.status === spec.webhookSyntheticPing.replayExpectedStatus)) {
      errors.push('synthetic-ping-replay-status-missing');
    }
  }
  if (spec.webhookSyntheticPing.localOnly !== true) errors.push('synthetic-ping-must-be-local-only');
  if (!spec.webhookSyntheticPing.safeCommand.includes('verify:playlist-commerce')) errors.push('synthetic-ping-missing-safe-command');
  for (const forbidden of ['raw_address', 'proof_witness', 'private_key', 'production_webhook_secret']) {
    if (!spec.webhookSyntheticPing.blockedMaterial.includes(forbidden)) {
      errors.push(`synthetic-ping-blocked-material-missing:${forbidden}`);
    }
  }
  for (const forbidden of ['secret', 'private_key', 'proof_witness', 'raw_address']) {
    if (spec.webhookSyntheticPing.safeInputs.includes(forbidden)) {
      errors.push(`synthetic-ping-safe-input-leaks:${forbidden}`);
    }
  }

  for (const flow of spec.flows) {
    for (const stage of flow.stages) {
      if (!actorIds.has(stage.actor)) errors.push(`flow-unknown-actor:${flow.id}:${stage.id}:${stage.actor}`);
      for (const required of stage.requiredCapabilities) {
        if (!capabilityIds.has(required)) errors.push(`flow-unknown-capability:${flow.id}:${stage.id}:${required}`);
      }
      for (const secret of ['raw_address', 'proof_witness', 'private_key']) {
        if (!stage.dataVisibility.notPersisted.includes(secret)) {
          errors.push(`flow-secret-not-blocked:${flow.id}:${stage.id}:${secret}`);
        }
      }
    }
  }

  const noAddressFlow = getPlaylistCommerceFlow('no-address-playlist-checkout', spec);
  if (!noAddressFlow) {
    errors.push('missing-no-address-flow');
  } else {
    const flowCapabilities = new Set(noAddressFlow.stages.flatMap(stage => stage.requiredCapabilities));
    for (const required of ['identity.walletConsent', 'address.noEntryCheckout', 'checkout.oneTap', 'delivery.carrierHandoff']) {
      if (!flowCapabilities.has(required)) errors.push(`no-address-flow-missing-capability:${required}`);
    }
    if (!noAddressFlow.stages.some(stage => stage.dataVisibility.merchant.includes('order_alias'))) {
      errors.push('no-address-flow-missing-merchant-order-alias');
    }
    if (!noAddressFlow.stages.some(stage => stage.dataVisibility.carrier.includes('carrier_decryptable_address_ref'))) {
      errors.push('no-address-flow-missing-carrier-handoff-reference');
    }
    if (noAddressFlow.stages.some(stage => stage.dataVisibility.merchant.includes('raw_address'))) {
      errors.push('no-address-flow-leaks-raw-address-to-merchant');
    }
  }

  for (const metric of spec.analytics) {
    if (metric.allowedFields.some(field => metric.forbiddenFields.includes(field))) {
      errors.push(`analytics-allowed-forbidden-overlap:${metric.id}`);
    }
    for (const forbidden of ['raw_address', 'recipient_identity', 'social_graph_edges']) {
      if (metric.allowedFields.includes(forbidden)) errors.push(`analytics-forbidden-field-allowed:${metric.id}:${forbidden}`);
    }
  }

  for (const required of ['not-full-marketplace', 'not-payment-processor', 'not-raw-address-store']) {
    if (!spec.nonClaims.some(nonClaim => nonClaim.id === required)) errors.push(`missing-non-claim:${required}`);
  }

  return errors;
}

export function summarizePlaylistCommerceSpec(spec: PlaylistCommerceSpec = buildPlaylistCommerceSpec()) {
  const mvpCapabilities = spec.capabilities.filter(capability => capability.maturity === 'mvp');
  const hardeningCapabilities = spec.capabilities.filter(capability => capability.maturity === 'hardening');
  const futureCapabilities = spec.capabilities.filter(capability => capability.maturity === 'future');
  const noAddressFlow = getPlaylistCommerceFlow('no-address-playlist-checkout', spec);

  return {
    version: spec.version,
    actorCount: spec.actors.length,
    archetypeCount: spec.archetypes.length,
    capabilityCount: spec.capabilities.length,
    apiSurfaceCount: spec.apiSurfaces.length,
    webhookRouteCount: spec.webhookRoutes.length,
    webhookSyntheticPingLocalOnly: spec.webhookSyntheticPing.localOnly,
    mvpCapabilityCount: mvpCapabilities.length,
    hardeningCapabilityCount: hardeningCapabilities.length,
    futureCapabilityCount: futureCapabilities.length,
    noAddressCheckoutStageCount: noAddressFlow?.stages.length ?? 0,
    privacyBoundary: [
      'merchant receives aliases and claims, not raw address',
      'carrier receives scoped handoff only after wallet consent',
      'platform analytics are aggregate by default',
    ],
  };
}
