import {
  buildPlaylistCommerceCheckoutRequest,
  buildPlaylistCommerceCheckoutResponse,
  validatePlaylistCommerceCheckoutRequest,
  validatePlaylistCommerceCheckoutResponse,
  type PlaylistCommerceCheckoutPurpose,
  type PlaylistCommerceCheckoutRequest,
  type PlaylistCommerceCheckoutResponse,
} from './playlistCommerceCheckout';
import {
  buildPlaylistCommerceSpec,
  type PlaylistCommerceApiSurface,
  type PlaylistCommerceCapability,
} from './playlistCommerceSpec';
import {
  buildPlaylistCommerceWebhookFixtures,
  validatePlaylistCommerceWebhookEnvelope,
  type PlaylistCommerceWebhookEnvelope,
  type PlaylistCommerceWebhookTopic,
} from './playlistCommerceWebhook';

export type PlaylistCommerceSdkMethodId =
  | 'createPlaylist'
  | 'saveProduct'
  | 'sharePlaylist'
  | 'searchProducts'
  | 'getRecommendations'
  | 'listHistory'
  | 'startCheckout'
  | 'verifyWebhook'
  | 'listCapabilities'
  | 'buildTestVectors';

export type PlaylistCommerceSdkMethod = {
  id: PlaylistCommerceSdkMethodId;
  label: string;
  purpose: string;
  requestShape: string;
  responseShape: string;
  requiredApiSurface: string;
  requiredCapabilities: string[];
  publicOnly: boolean;
  forbiddenInputs: string[];
};

export type PlaylistCommerceSdkQuickstart = {
  version: 'playlist-commerce-sdk-v0.1';
  install: string;
  steps: Array<{
    id: string;
    title: string;
    code: string;
    safeNotes: string[];
  }>;
};

export type PlaylistCommerceSdkContract = {
  version: 'playlist-commerce-sdk-v0.1';
  methods: PlaylistCommerceSdkMethod[];
  apiSurfaces: PlaylistCommerceApiSurface[];
  capabilities: PlaylistCommerceCapability[];
  requiredWebhookTopics: PlaylistCommerceWebhookTopic[];
  forbiddenInputs: string[];
  nonClaims: string[];
};

export type PlaylistCommerceDiscoveryCard = {
  ref: string;
  title: string;
  kind: 'product' | 'playlist' | 'merchant';
  merchantRef?: string;
  playlistRef?: string;
  reason: string;
  safePublicFields: string[];
};

export type PlaylistCommerceHistoryItem = {
  eventRef: string;
  eventType: 'searched' | 'viewed_playlist' | 'viewed_product' | 'saved_product';
  displayTitle: string;
  targetRef: string;
  occurredAt: string;
  resumableAction: 'open_search' | 'open_playlist' | 'open_product' | 'continue_checkout';
};

export type PlaylistCommerceDiscoveryHome = {
  version: 'playlist-commerce-discovery-home-v0.1';
  query: string;
  searchResults: PlaylistCommerceDiscoveryCard[];
  recommendationShelves: Array<{
    id: string;
    title: string;
    reason: string;
    cards: PlaylistCommerceDiscoveryCard[];
  }>;
  history: PlaylistCommerceHistoryItem[];
  visibleToUserWithoutCheckoutLogin: true;
  blockedMaterial: string[];
  nonClaims: string[];
};

const SDK_FORBIDDEN_INPUTS = [
  'rawAddress',
  'raw_address',
  'recipientPhone',
  'recipient_phone',
  'privateKey',
  'private_key',
  'proofWitness',
  'proof_witness',
  'biometricTemplate',
  'biometric_template',
  'passportData',
  'roomNumber',
] as const;

export const PLAYLIST_COMMERCE_SDK_METHODS: PlaylistCommerceSdkMethod[] = [
  {
    id: 'createPlaylist',
    label: 'Create playlist',
    purpose: 'Create a purpose-based shopping playlist.',
    requestShape: 'CreatePlaylistRequest',
    responseShape: 'PlaylistRef',
    requiredApiSurface: 'playlist-sdk',
    requiredCapabilities: ['playlist.create'],
    publicOnly: true,
    forbiddenInputs: [...SDK_FORBIDDEN_INPUTS],
  },
  {
    id: 'saveProduct',
    label: 'Save product',
    purpose: 'Save a product reference into a playlist.',
    requestShape: 'SaveProductRequest',
    responseShape: 'SavedProductRef',
    requiredApiSurface: 'save-api',
    requiredCapabilities: ['playlist.saveProduct'],
    publicOnly: true,
    forbiddenInputs: [...SDK_FORBIDDEN_INPUTS],
  },
  {
    id: 'sharePlaylist',
    label: 'Share playlist',
    purpose: 'Create a scoped share link for a playlist.',
    requestShape: 'SharePlaylistRequest',
    responseShape: 'ShareLinkRef',
    requiredApiSurface: 'share-api',
    requiredCapabilities: ['playlist.share'],
    publicOnly: true,
    forbiddenInputs: [...SDK_FORBIDDEN_INPUTS],
  },
  {
    id: 'searchProducts',
    label: 'Search products',
    purpose: 'Search merchant, brand, gift, and cross-border product references.',
    requestShape: 'SearchProductsRequest',
    responseShape: 'ProductSearchResult',
    requiredApiSurface: 'search-api',
    requiredCapabilities: ['commerce.crossEcSearch', 'commerce.brandSearch'],
    publicOnly: true,
    forbiddenInputs: [...SDK_FORBIDDEN_INPUTS],
  },
  {
    id: 'getRecommendations',
    label: 'Get recommendations',
    purpose: 'Return Spotify-like recommendation shelves for playlists, products, and merchants.',
    requestShape: 'RecommendationRequest',
    responseShape: 'PlaylistCommerceDiscoveryShelf[]',
    requiredApiSurface: 'recommendation-api',
    requiredCapabilities: ['recommendation.playlist'],
    publicOnly: true,
    forbiddenInputs: [...SDK_FORBIDDEN_INPUTS],
  },
  {
    id: 'listHistory',
    label: 'List history',
    purpose: 'Return recent searches, viewed playlists, and saved product refs so the user can resume shopping.',
    requestShape: 'HistoryRequest',
    responseShape: 'PlaylistCommerceHistoryItem[]',
    requiredApiSurface: 'playlist-sdk',
    requiredCapabilities: ['playlist.saveProduct', 'commerce.crossEcSearch'],
    publicOnly: true,
    forbiddenInputs: [...SDK_FORBIDDEN_INPUTS],
  },
  {
    id: 'startCheckout',
    label: 'Start checkout',
    purpose: 'Create an alias-first checkout request that delegates address claims to Identity Wallet and Address Login.',
    requestShape: 'PlaylistCommerceCheckoutRequest',
    responseShape: 'PlaylistCommerceCheckoutResponse',
    requiredApiSurface: 'checkout-api',
    requiredCapabilities: ['checkout.oneTap', 'address.noEntryCheckout'],
    publicOnly: true,
    forbiddenInputs: [...SDK_FORBIDDEN_INPUTS],
  },
  {
    id: 'verifyWebhook',
    label: 'Verify webhook',
    purpose: 'Verify signed merchant webhook envelopes and reject private material.',
    requestShape: 'PlaylistCommerceWebhookEnvelope',
    responseShape: 'WebhookValidationResult',
    requiredApiSurface: 'merchant-webhook',
    requiredCapabilities: ['merchant.webhook'],
    publicOnly: true,
    forbiddenInputs: [...SDK_FORBIDDEN_INPUTS],
  },
  {
    id: 'listCapabilities',
    label: 'List capabilities',
    purpose: 'Expose the public capability catalog used by SDK integrations.',
    requestShape: 'void',
    responseShape: 'PlaylistCommerceCapability[]',
    requiredApiSurface: 'playlist-sdk',
    requiredCapabilities: ['developer.sdk'],
    publicOnly: true,
    forbiddenInputs: [...SDK_FORBIDDEN_INPUTS],
  },
  {
    id: 'buildTestVectors',
    label: 'Build test vectors',
    purpose: 'Return checkout and webhook fixtures for local conformance tests.',
    requestShape: 'void',
    responseShape: 'PlaylistCommerceTestVectors',
    requiredApiSurface: 'playlist-sdk',
    requiredCapabilities: ['developer.sdk'],
    publicOnly: true,
    forbiddenInputs: [...SDK_FORBIDDEN_INPUTS],
  },
];

export function buildPlaylistCommerceSdkContract(): PlaylistCommerceSdkContract {
  const spec = buildPlaylistCommerceSpec();
  return {
    version: 'playlist-commerce-sdk-v0.1',
    methods: PLAYLIST_COMMERCE_SDK_METHODS,
    apiSurfaces: spec.apiSurfaces,
    capabilities: spec.capabilities,
    requiredWebhookTopics: ['checkout.alias_created', 'delivery.receipt_created'],
    forbiddenInputs: [...SDK_FORBIDDEN_INPUTS],
    nonClaims: spec.nonClaims.map(nonClaim => nonClaim.id),
  };
}

export function validatePlaylistCommerceSdkContract(
  contract: PlaylistCommerceSdkContract = buildPlaylistCommerceSdkContract(),
): string[] {
  const errors: string[] = [];
  const apiIds = new Set(contract.apiSurfaces.map(api => api.id));
  const capabilityIds = new Set(contract.capabilities.map(capability => capability.id));

  for (const method of contract.methods) {
    if (!apiIds.has(method.requiredApiSurface)) errors.push(`method-api-missing:${method.id}:${method.requiredApiSurface}`);
    for (const capability of method.requiredCapabilities) {
      if (!capabilityIds.has(capability)) errors.push(`method-capability-missing:${method.id}:${capability}`);
    }
    if (!method.publicOnly) errors.push(`method-not-public-only:${method.id}`);
    for (const forbidden of contract.forbiddenInputs) {
      if (!method.forbiddenInputs.includes(forbidden)) errors.push(`method-missing-forbidden-input:${method.id}:${forbidden}`);
    }
  }

  for (const required of ['startCheckout', 'verifyWebhook', 'buildTestVectors'] as const) {
    if (!contract.methods.some(method => method.id === required)) errors.push(`missing-sdk-method:${required}`);
  }
  for (const required of ['not-full-marketplace', 'not-payment-processor', 'not-raw-address-store']) {
    if (!contract.nonClaims.includes(required)) errors.push(`missing-non-claim:${required}`);
  }
  for (const topic of ['checkout.alias_created', 'delivery.receipt_created'] as const) {
    if (!contract.requiredWebhookTopics.includes(topic)) errors.push(`missing-required-webhook-topic:${topic}`);
  }

  return errors;
}

export function buildPlaylistCommerceDiscoveryHome(query = 'new apartment'): PlaylistCommerceDiscoveryHome {
  const searchResults: PlaylistCommerceDiscoveryCard[] = [
    {
      ref: 'prod_ref_modular_shelf_001',
      title: 'Modular shelf starter set',
      kind: 'product',
      merchantRef: 'merchant_ref_home_001',
      playlistRef: 'pl_demo_new_life',
      reason: 'Matches saved moving and new-life playlist intent.',
      safePublicFields: ['productRef', 'merchantRef', 'playlistRef', 'title', 'reason'],
    },
    {
      ref: 'pl_ref_first_week_home_001',
      title: 'First week in a new home',
      kind: 'playlist',
      playlistRef: 'pl_demo_new_life',
      reason: 'Popular playlist for the same query theme.',
      safePublicFields: ['playlistRef', 'title', 'reason'],
    },
    {
      ref: 'merchant_ref_storage_001',
      title: 'Storage-friendly merchants',
      kind: 'merchant',
      merchantRef: 'merchant_ref_storage_001',
      reason: 'Merchant category matches organization products.',
      safePublicFields: ['merchantRef', 'title', 'reason'],
    },
  ];

  return {
    version: 'playlist-commerce-discovery-home-v0.1',
    query,
    searchResults,
    recommendationShelves: [
      {
        id: 'because-you-saved',
        title: 'Because you saved moving items',
        reason: 'Uses playlist refs and aggregate category signals, not raw address or private notes.',
        cards: searchResults.slice(0, 2),
      },
      {
        id: 'continue-playlists',
        title: 'Continue your playlists',
        reason: 'Resume public playlist and product refs from recent activity.',
        cards: [
          {
            ref: 'pl_ref_monthly_repeat_001',
            title: 'Monthly repeat essentials',
            kind: 'playlist',
            playlistRef: 'pl_demo_monthly_repeat',
            reason: 'Recently opened repeat-purchase playlist.',
            safePublicFields: ['playlistRef', 'title', 'reason'],
          },
          {
            ref: 'prod_ref_travel_adapter_001',
            title: 'Travel adapter set',
            kind: 'product',
            merchantRef: 'merchant_ref_travel_001',
            playlistRef: 'pl_demo_travel',
            reason: 'Often paired with travel-prep lists.',
            safePublicFields: ['productRef', 'merchantRef', 'playlistRef', 'title', 'reason'],
          },
        ],
      },
    ],
    history: [
      {
        eventRef: 'hist_ref_search_new_apartment_001',
        eventType: 'searched',
        displayTitle: query,
        targetRef: 'search_ref_new_apartment_001',
        occurredAt: '2026-07-07T07:35:49.982Z',
        resumableAction: 'open_search',
      },
      {
        eventRef: 'hist_ref_playlist_new_life_001',
        eventType: 'viewed_playlist',
        displayTitle: 'New life starter playlist',
        targetRef: 'pl_demo_new_life',
        occurredAt: '2026-07-07T07:40:49.982Z',
        resumableAction: 'open_playlist',
      },
      {
        eventRef: 'hist_ref_saved_lamp_001',
        eventType: 'saved_product',
        displayTitle: 'Saved desk lamp',
        targetRef: 'prod_demo_lamp',
        occurredAt: '2026-07-07T07:45:49.982Z',
        resumableAction: 'open_product',
      },
    ],
    visibleToUserWithoutCheckoutLogin: true,
    blockedMaterial: [...SDK_FORBIDDEN_INPUTS],
    nonClaims: [
      'Discovery history is not a raw behavior log export.',
      'Recommendations use safe refs and aggregate reasons, not raw address, recipient phone, proof witness, or private notes.',
      'Search and recommendation results are not price, stock, delivery, or ranking guarantees.',
    ],
  };
}

export function validatePlaylistCommerceDiscoveryHome(home: PlaylistCommerceDiscoveryHome): string[] {
  const errors: string[] = [];
  if (home.version !== 'playlist-commerce-discovery-home-v0.1') errors.push('invalid-version');
  if (!home.query) errors.push('missing-query');
  if (home.searchResults.length === 0) errors.push('missing-search-results');
  if (home.recommendationShelves.length === 0) errors.push('missing-recommendation-shelves');
  if (home.history.length === 0) errors.push('missing-history');
  if (home.visibleToUserWithoutCheckoutLogin !== true) errors.push('discovery-requires-checkout-login');
  for (const card of [...home.searchResults, ...home.recommendationShelves.flatMap(shelf => shelf.cards)]) {
    if (!card.ref || !card.title || !card.reason) errors.push(`incomplete-card:${card.ref}`);
    for (const forbidden of ['rawAddress', 'recipientPhone', 'proofWitness', 'privateKey']) {
      if (card.safePublicFields.includes(forbidden)) errors.push(`card-public-field-forbidden:${card.ref}:${forbidden}`);
    }
  }
  for (const item of home.history) {
    if (!item.eventRef.startsWith('hist_ref_')) errors.push(`history-ref-invalid:${item.eventRef}`);
    if (!item.targetRef) errors.push(`history-target-missing:${item.eventRef}`);
  }
  for (const forbidden of ['rawAddress', 'recipientPhone', 'proofWitness', 'privateKey']) {
    if (!home.blockedMaterial.includes(forbidden)) errors.push(`missing-blocked-material:${forbidden}`);
  }
  if (!home.nonClaims.some(nonClaim => /not a raw behavior log export/i.test(nonClaim))) errors.push('missing-history-non-claim');
  return errors;
}

export function createPlaylistCommerceSdkTestClient() {
  return {
    contract: buildPlaylistCommerceSdkContract(),
    searchProducts(query = 'new apartment') {
      return buildPlaylistCommerceDiscoveryHome(query).searchResults;
    },
    getRecommendations() {
      return buildPlaylistCommerceDiscoveryHome().recommendationShelves;
    },
    listHistory() {
      return buildPlaylistCommerceDiscoveryHome().history;
    },
    buildDiscoveryHome(query = 'new apartment') {
      const home = buildPlaylistCommerceDiscoveryHome(query);
      return {
        home,
        errors: validatePlaylistCommerceDiscoveryHome(home),
      };
    },
    startCheckout(purpose: PlaylistCommerceCheckoutPurpose = 'self_delivery'): {
      request: PlaylistCommerceCheckoutRequest;
      response: PlaylistCommerceCheckoutResponse;
      errors: string[];
    } {
      const request = buildPlaylistCommerceCheckoutRequest(purpose);
      const response = buildPlaylistCommerceCheckoutResponse(request);
      return {
        request,
        response,
        errors: [
          ...validatePlaylistCommerceCheckoutRequest(request),
          ...validatePlaylistCommerceCheckoutResponse(response),
        ],
      };
    },
    verifyWebhook(envelope: PlaylistCommerceWebhookEnvelope) {
      return validatePlaylistCommerceWebhookEnvelope(envelope);
    },
    buildTestVectors() {
      return {
        checkout: this.startCheckout('self_delivery'),
        discoveryHome: this.buildDiscoveryHome(),
        webhooks: buildPlaylistCommerceWebhookFixtures(),
      };
    },
  };
}

export function buildPlaylistCommerceSdkQuickstart(): PlaylistCommerceSdkQuickstart {
  return {
    version: 'playlist-commerce-sdk-v0.1',
    install: 'npm install @agid/playlist-commerce',
    steps: [
      {
        id: 'create-client',
        title: 'Create a client with a public API key',
        code: 'const client = createPlaylistCommerceClient({ apiKey: "pk_test_..." });',
        safeNotes: ['Use public or test API keys in frontend code.', 'Never pass raw address or private proof material to the SDK.'],
      },
      {
        id: 'save-product',
        title: 'Save a product reference',
        code: 'await client.saveProduct({ playlistRef, productRef, merchantRef });',
        safeNotes: ['Product refs and merchant refs are allowed.', 'Private user notes should stay scoped to the wallet or playlist owner.'],
      },
      {
        id: 'browse-discovery',
        title: 'Render discovery home',
        code: 'const discovery = client.buildDiscoveryHome("new apartment");',
        safeNotes: ['Show search results, recommendation shelves, and resumable history refs.', 'Do not expose raw behavior logs or private address material.'],
      },
      {
        id: 'start-checkout',
        title: 'Start no-address checkout',
        code: 'const checkout = await client.startCheckout({ playlistRef, purpose: "self_delivery" });',
        safeNotes: ['Checkout returns order aliases and consent references.', 'Address Login handles deliverability and carrier handoff.'],
      },
      {
        id: 'verify-webhook',
        title: 'Verify merchant webhooks',
        code: 'const result = client.verifyWebhook({ headers, payload });',
        safeNotes: ['Reject signature mismatches.', 'Reject forbidden private fields before storage or logging.'],
      },
    ],
  };
}
