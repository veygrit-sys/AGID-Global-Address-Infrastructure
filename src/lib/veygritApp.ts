export const VEYGRIT_APP_MODEL_VERSION = 'veygrit-address-wallet-os-v0.1';

export type VeygritAuthProvider = 'google' | 'apple';

export type VeygritMainNavId = 'home' | 'friends' | 'store' | 'my-page';

export type VeygritStoreNavId = 'topics' | 'discover' | 'my-stores';

export type VeygritNavItem = {
  id: VeygritMainNavId;
  label: string;
  routeRef: string;
  children?: Array<{
    id: VeygritStoreNavId;
    label: string;
    routeRef: string;
  }>;
};

export type VeygritAddressCard = {
  slot: 'my_address' | 'spare_address';
  addressRef: string;
  addressName: string;
  holderNameRef: string;
  useCase: string;
  status: 'verified' | 'needs_review' | 'temporary';
  carrierConversion: 'server_side_carrier_label_shape';
  poBoxSupported: boolean;
};

export type VeygritQrUseCase = {
  id: string;
  label: string;
  safePayloadRef: string;
};

export type VeygritRecentDelivery = {
  shipmentRef: string;
  trackingAlias: string;
  storeRef: string;
  status: 'created' | 'in_transit' | 'delivered';
};

export type VeygritRecentStore = {
  storeRef: string;
  displayName: string;
  category: string;
  lastUsedRef: string;
};

export type VeygritFriend = {
  friendRef: string;
  displayName: string;
  iconRef: string;
  veyId: string;
  trustState: 'trusted' | 'request_pending' | 'limited';
  visibleFields: Array<'displayName' | 'iconRef' | 'veyId' | 'trustState'>;
};

export type VeygritStoreTopic = {
  id: string;
  label: string;
  surface: 'topics';
};

export type VeygritDiscoverGenre = {
  id: string;
  label: string;
};

export type VeygritConnectedStore = {
  storeRef: string;
  displayName: string;
  platform: 'shopify' | 'woocommerce' | 'ec-cube' | 'custom' | 'marketplace';
  connectionRef: string;
  walletAddressReuse: boolean;
  disconnectAction: 'wallet_side_revoke';
};

export type VeygritMyPageItem = {
  id: 'profile' | 'payment-methods' | 'notifications' | 'help' | 'settings';
  label: string;
  routeRef: string;
};

export type VeygritIntegrationSurface = {
  id: 'playlist_commerce' | 'ec_social_login' | 'delivery_gateway';
  label: 'Playlist Commerce' | 'EC Social Login' | 'Delivery Gateway';
  startPoint: 'veygrit_app' | 'ec_site' | 'merchant_console';
  installTarget: 'veygrit_app' | 'ec_site' | 'merchant_backend';
  decisionRouteRef: string;
  primaryActionLabel: string;
  commerceEntryDescription: string;
  commerceEntryIcon: 'store' | 'key' | 'truck';
  loginRequiredBeforeBrowse: boolean;
  loginRequiredBeforeCheckout: boolean;
  addressWalletReuse: boolean;
  merchantSeesRawAddress: boolean;
  primaryValue: string;
};

export type VeygritGuestCheckoutPolicy = {
  enabled: boolean;
  accountRequiredBeforeCheckout: boolean;
  guestSessionRefRequired: boolean;
  walletConsentRequiredBeforeAddressReuse: boolean;
  optionalUpgradeProviders: VeygritAuthProvider[];
  allowedGuestActions: Array<
    | 'browse_playlist_commerce'
    | 'select_store'
    | 'start_checkout'
    | 'request_address_login'
    | 'approve_wallet_consent'
    | 'create_carrier_handoff'
  >;
  blockedGuestActions: Array<
    | 'save_address_without_account'
    | 'persist_raw_address'
    | 'view_friend_address'
    | 'bypass_wallet_consent'
    | 'receive_provider_token'
  >;
  merchantReceives: string[];
  merchantNeverReceives: string[];
};

export type VeygritAppModel = {
  version: typeof VEYGRIT_APP_MODEL_VERSION;
  brand: 'Veygrit';
  productDefinition: 'address_wallet_os';
  navigation: VeygritNavItem[];
  accountCreation: {
    allowedProviders: VeygritAuthProvider[];
    passwordSignupEnabled: boolean;
    emailPasswordSignupEnabled: boolean;
    veyIdRequiredForEcLogin: boolean;
  };
  addressEntry: {
    userForm: 'familiar_country_address_form';
    poBoxSupported: boolean;
    carrierSpecificFieldsInUserForm: boolean;
    carrierLabelConversion: 'ups_dhl_server_side_at_label_creation';
  };
  home: {
    myAddress: VeygritAddressCard[];
    spareAddress: VeygritAddressCard[];
    qr: VeygritQrUseCase[];
    recentDeliveries: VeygritRecentDelivery[];
    recentStores: VeygritRecentStore[];
  };
  friends: {
    sections: Array<'friend_list' | 'requests' | 'qr_add' | 'search_by_id'>;
    visibleFields: Array<'displayName' | 'iconRef' | 'veyId' | 'trustState'>;
    hiddenFields: Array<'addressText' | 'phoneNumber' | 'carrierPayload'>;
    examples: VeygritFriend[];
  };
  store: {
    topics: VeygritStoreTopic[];
    discoverGenres: VeygritDiscoverGenre[];
    myStores: VeygritConnectedStore[];
  };
  myPage: VeygritMyPageItem[];
  integrations: VeygritIntegrationSurface[];
  guestCheckout: VeygritGuestCheckoutPolicy;
  merchantVisibleRefs: string[];
  hiddenMaterial: string[];
  nonClaims: string[];
};

const DISCOVER_GENRES: VeygritDiscoverGenre[] = [
  { id: 'fashion', label: 'Fashion' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'food', label: 'Food' },
  { id: 'books', label: 'Books' },
  { id: 'beauty', label: 'Beauty' },
  { id: 'pharmacy', label: 'Pharmacy' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'home-goods', label: 'Home Goods' },
  { id: 'baby-kids', label: 'Baby / Kids' },
  { id: 'pets', label: 'Pets' },
  { id: 'sports', label: 'Sports' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'travel', label: 'Travel' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'groceries', label: 'Groceries' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'handmade', label: 'Handmade' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'digital-goods', label: 'Digital Goods' },
  { id: 'games', label: 'Games' },
  { id: 'music', label: 'Music' },
  { id: 'education', label: 'Education' },
  { id: 'health-care', label: 'Health Care' },
  { id: 'gifts', label: 'Gifts' },
  { id: 'automotive', label: 'Automotive' },
  { id: 'office-supplies', label: 'Office Supplies' },
  { id: 'garden', label: 'Garden' },
  { id: 'services', label: 'Services' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'local-shops', label: 'Local Shops' },
  { id: 'international-shipping', label: 'International Shipping' },
];

export function buildVeygritAppModel(): VeygritAppModel {
  return {
    version: VEYGRIT_APP_MODEL_VERSION,
    brand: 'Veygrit',
    productDefinition: 'address_wallet_os',
    navigation: [
      { id: 'home', label: 'Home', routeRef: '/veygrit#home' },
      { id: 'friends', label: 'Friends', routeRef: '/veygrit#friends' },
      {
        id: 'store',
        label: 'Store',
        routeRef: '/veygrit#store',
        children: [
          { id: 'topics', label: 'Topics', routeRef: '/veygrit#topics' },
          { id: 'discover', label: 'Discover', routeRef: '/veygrit#discover' },
          { id: 'my-stores', label: 'My Stores', routeRef: '/veygrit#my-stores' },
        ],
      },
      { id: 'my-page', label: 'My Page', routeRef: '/veygrit#my-page' },
    ],
    accountCreation: {
      allowedProviders: ['google', 'apple'],
      passwordSignupEnabled: false,
      emailPasswordSignupEnabled: false,
      veyIdRequiredForEcLogin: true,
    },
    addressEntry: {
      userForm: 'familiar_country_address_form',
      poBoxSupported: true,
      carrierSpecificFieldsInUserForm: false,
      carrierLabelConversion: 'ups_dhl_server_side_at_label_creation',
    },
    home: {
      myAddress: [
        {
          slot: 'my_address',
          addressRef: 'addr_ref_home_primary',
          addressName: 'Home',
          holderNameRef: 'self_name_ref_primary',
          useCase: 'daily_delivery',
          status: 'verified',
          carrierConversion: 'server_side_carrier_label_shape',
          poBoxSupported: true,
        },
        {
          slot: 'my_address',
          addressRef: 'addr_ref_home_secondary',
          addressName: 'Apartment',
          holderNameRef: 'self_name_ref_primary',
          useCase: 'weekend_delivery',
          status: 'needs_review',
          carrierConversion: 'server_side_carrier_label_shape',
          poBoxSupported: true,
        },
        {
          slot: 'my_address',
          addressRef: 'addr_ref_registered_billing',
          addressName: 'Billing',
          holderNameRef: 'self_name_ref_primary',
          useCase: 'merchant_profile',
          status: 'verified',
          carrierConversion: 'server_side_carrier_label_shape',
          poBoxSupported: true,
        },
      ],
      spareAddress: [
        {
          slot: 'spare_address',
          addressRef: 'addr_ref_family',
          addressName: 'Family',
          holderNameRef: 'self_name_ref_primary',
          useCase: 'family_delivery',
          status: 'verified',
          carrierConversion: 'server_side_carrier_label_shape',
          poBoxSupported: true,
        },
        {
          slot: 'spare_address',
          addressRef: 'addr_ref_work',
          addressName: 'Work',
          holderNameRef: 'self_name_ref_primary',
          useCase: 'office_delivery',
          status: 'verified',
          carrierConversion: 'server_side_carrier_label_shape',
          poBoxSupported: true,
        },
        {
          slot: 'spare_address',
          addressRef: 'addr_ref_hotel_temp',
          addressName: 'Hotel',
          holderNameRef: 'self_name_ref_primary',
          useCase: 'temporary_stay',
          status: 'temporary',
          carrierConversion: 'server_side_carrier_label_shape',
          poBoxSupported: true,
        },
      ],
      qr: [
        { id: 'store-counter', label: 'Store counter', safePayloadRef: 'qr_ref_store_counter' },
        { id: 'ec-login', label: 'EC login', safePayloadRef: 'qr_ref_ec_login' },
        { id: 'parcel-receipt', label: 'Parcel receipt', safePayloadRef: 'qr_ref_parcel_receipt' },
        { id: 'address-share', label: 'Address share', safePayloadRef: 'qr_ref_address_share' },
      ],
      recentDeliveries: [
        {
          shipmentRef: 'ship_ref_4M9H',
          trackingAlias: 'track_alias_blue',
          storeRef: 'store_ref_shopify_demo',
          status: 'in_transit',
        },
        {
          shipmentRef: 'ship_ref_7K2Q',
          trackingAlias: 'track_alias_green',
          storeRef: 'store_ref_marketplace_demo',
          status: 'delivered',
        },
      ],
      recentStores: [
        {
          storeRef: 'store_ref_shopify_demo',
          displayName: 'Northline Supply',
          category: 'Outdoor',
          lastUsedRef: 'use_ref_recent_01',
        },
        {
          storeRef: 'store_ref_books_demo',
          displayName: 'Page & Parcel',
          category: 'Books',
          lastUsedRef: 'use_ref_recent_02',
        },
      ],
    },
    friends: {
      sections: ['friend_list', 'requests', 'qr_add', 'search_by_id'],
      visibleFields: ['displayName', 'iconRef', 'veyId', 'trustState'],
      hiddenFields: ['addressText', 'phoneNumber', 'carrierPayload'],
      examples: [
        {
          friendRef: 'friend_ref_family_01',
          displayName: 'Family Member',
          iconRef: 'icon_ref_family',
          veyId: 'vey_fam_7q2m',
          trustState: 'trusted',
          visibleFields: ['displayName', 'iconRef', 'veyId', 'trustState'],
        },
        {
          friendRef: 'friend_ref_work_02',
          displayName: 'Work Contact',
          iconRef: 'icon_ref_work',
          veyId: 'vey_work_3k8p',
          trustState: 'limited',
          visibleFields: ['displayName', 'iconRef', 'veyId', 'trustState'],
        },
      ],
    },
    store: {
      topics: [
        { id: 'new', label: 'New', surface: 'topics' },
        { id: 'popular', label: 'Popular', surface: 'topics' },
        { id: 'campaign', label: 'Campaign', surface: 'topics' },
        { id: 'nearby', label: 'Nearby', surface: 'topics' },
        { id: 'editors-picks', label: "Editor's Picks", surface: 'topics' },
      ],
      discoverGenres: DISCOVER_GENRES,
      myStores: [
        {
          storeRef: 'store_ref_shopify_demo',
          displayName: 'Northline Supply',
          platform: 'shopify',
          connectionRef: 'conn_ref_wallet_store_01',
          walletAddressReuse: true,
          disconnectAction: 'wallet_side_revoke',
        },
        {
          storeRef: 'store_ref_woocommerce_demo',
          displayName: 'Everyday Market',
          platform: 'woocommerce',
          connectionRef: 'conn_ref_wallet_store_02',
          walletAddressReuse: true,
          disconnectAction: 'wallet_side_revoke',
        },
        {
          storeRef: 'store_ref_custom_demo',
          displayName: 'Direct Lab',
          platform: 'custom',
          connectionRef: 'conn_ref_wallet_store_03',
          walletAddressReuse: true,
          disconnectAction: 'wallet_side_revoke',
        },
      ],
    },
    myPage: [
      { id: 'profile', label: 'Profile', routeRef: '/veygrit#profile' },
      { id: 'payment-methods', label: 'Payment Methods', routeRef: '/veygrit#payment-methods' },
      { id: 'notifications', label: 'Notifications', routeRef: '/veygrit#notifications' },
      { id: 'help', label: 'Help', routeRef: '/veygrit#help' },
      { id: 'settings', label: 'Settings', routeRef: '/veygrit#settings' },
    ],
    integrations: [
      {
        id: 'playlist_commerce',
        label: 'Playlist Commerce',
        startPoint: 'veygrit_app',
        installTarget: 'veygrit_app',
        decisionRouteRef: '/veygrit#store',
        primaryActionLabel: 'Open Store',
        commerceEntryDescription: 'Browse Topics, Discover, and My Stores without forcing an EC login button first.',
        commerceEntryIcon: 'store',
        loginRequiredBeforeBrowse: false,
        loginRequiredBeforeCheckout: false,
        addressWalletReuse: true,
        merchantSeesRawAddress: false,
        primaryValue: 'store_discovery_and_management',
      },
      {
        id: 'ec_social_login',
        label: 'EC Social Login',
        startPoint: 'ec_site',
        installTarget: 'ec_site',
        decisionRouteRef: '/merchant-console#vey-id',
        primaryActionLabel: 'Install Vey ID',
        commerceEntryDescription: 'Add Continue with Veygrit for account login, consent, and address reuse at checkout.',
        commerceEntryIcon: 'key',
        loginRequiredBeforeBrowse: false,
        loginRequiredBeforeCheckout: true,
        addressWalletReuse: true,
        merchantSeesRawAddress: false,
        primaryValue: 'no_address_input_checkout',
      },
      {
        id: 'delivery_gateway',
        label: 'Delivery Gateway',
        startPoint: 'merchant_console',
        installTarget: 'merchant_backend',
        decisionRouteRef: '/merchant-console#delivery-gateway',
        primaryActionLabel: 'Configure gateway',
        commerceEntryDescription: 'Connect carrier handoff refs behind the merchant console without exposing wallet material.',
        commerceEntryIcon: 'truck',
        loginRequiredBeforeBrowse: false,
        loginRequiredBeforeCheckout: true,
        addressWalletReuse: true,
        merchantSeesRawAddress: false,
        primaryValue: 'one_integration_for_multiple_carriers',
      },
    ],
    guestCheckout: {
      enabled: true,
      accountRequiredBeforeCheckout: false,
      guestSessionRefRequired: true,
      walletConsentRequiredBeforeAddressReuse: true,
      optionalUpgradeProviders: ['google', 'apple'],
      allowedGuestActions: [
        'browse_playlist_commerce',
        'select_store',
        'start_checkout',
        'request_address_login',
        'approve_wallet_consent',
        'create_carrier_handoff',
      ],
      blockedGuestActions: [
        'save_address_without_account',
        'persist_raw_address',
        'view_friend_address',
        'bypass_wallet_consent',
        'receive_provider_token',
      ],
      merchantReceives: [
        'guestCheckoutRef',
        'checkoutAlias',
        'walletConsentRef',
        'carrierHandoffRef',
        'trackingAlias',
      ],
      merchantNeverReceives: [
        'raw_address',
        'phone_number',
        'provider_token',
        'carrier_credentials',
        'private_delivery_note',
        'proof_secret',
      ],
    },
    merchantVisibleRefs: ['recipientId', 'shipmentRef', 'labelRef', 'trackingAlias', 'storeRef', 'connectionRef'],
    hiddenMaterial: [
      'raw_address',
      'phone_number',
      'provider_token',
      'carrier_credentials',
      'raw_carrier_payload',
      'private_delivery_note',
      'proof_secret',
    ],
    nonClaims: [
      'No production DHL or UPS traffic is sent by this model.',
      'No carrier account credential is stored in the browser model.',
      'No raw recipient address is displayed to merchants or friends.',
    ],
  };
}

export function validateVeygritAppModel(model: VeygritAppModel): string[] {
  const errors: string[] = [];
  const navigationIds = model.navigation.map(item => item.id);
  if (navigationIds.join('>') !== 'home>friends>store>my-page') {
    errors.push(`navigation-order:${navigationIds.join('>')}`);
  }

  const store = model.navigation.find(item => item.id === 'store');
  const storeChildIds = store?.children?.map(item => item.id) ?? [];
  if (storeChildIds.join('>') !== 'topics>discover>my-stores') {
    errors.push(`store-child-order:${storeChildIds.join('>')}`);
  }

  if (model.accountCreation.allowedProviders.join(',') !== 'google,apple') {
    errors.push(`account-providers:${model.accountCreation.allowedProviders.join(',')}`);
  }
  if (model.accountCreation.passwordSignupEnabled || model.accountCreation.emailPasswordSignupEnabled) {
    errors.push('password-signup-enabled');
  }
  if (!model.accountCreation.veyIdRequiredForEcLogin) {
    errors.push('ec-login-without-vey-id');
  }
  if (model.store.discoverGenres.length !== 32) {
    errors.push(`discover-genre-count:${model.store.discoverGenres.length}`);
  }
  if (!model.addressEntry.poBoxSupported) {
    errors.push('po-box-not-supported');
  }
  if (model.addressEntry.carrierSpecificFieldsInUserForm) {
    errors.push('carrier-fields-leak-into-user-form');
  }
  if (!model.guestCheckout.enabled) {
    errors.push('guest-checkout-disabled');
  }
  if (model.guestCheckout.accountRequiredBeforeCheckout) {
    errors.push('guest-checkout-requires-account-before-checkout');
  }
  if (!model.guestCheckout.guestSessionRefRequired) {
    errors.push('guest-checkout-missing-session-ref');
  }
  if (!model.guestCheckout.walletConsentRequiredBeforeAddressReuse) {
    errors.push('guest-checkout-missing-wallet-consent');
  }
  if (model.guestCheckout.optionalUpgradeProviders.join(',') !== 'google,apple') {
    errors.push(`guest-upgrade-providers:${model.guestCheckout.optionalUpgradeProviders.join(',')}`);
  }
  for (const expected of ['guestCheckoutRef', 'checkoutAlias', 'walletConsentRef', 'carrierHandoffRef']) {
    if (!model.guestCheckout.merchantReceives.includes(expected)) {
      errors.push(`guest-checkout-missing-safe-ref:${expected}`);
    }
  }
  for (const blocked of ['raw_address', 'phone_number', 'provider_token', 'carrier_credentials', 'proof_secret']) {
    if (!model.guestCheckout.merchantNeverReceives.includes(blocked)) {
      errors.push(`guest-checkout-missing-blocked-output:${blocked}`);
    }
  }

  for (const friend of model.friends.examples) {
    if (friend.visibleFields.join(',') !== model.friends.visibleFields.join(',')) {
      errors.push(`friend-visible-field-drift:${friend.friendRef}`);
    }
  }

  for (const storeConnection of model.store.myStores) {
    if (storeConnection.disconnectAction !== 'wallet_side_revoke') {
      errors.push(`missing-wallet-side-revoke:${storeConnection.storeRef}`);
    }
    if (!storeConnection.walletAddressReuse) {
      errors.push(`store-without-wallet-reuse:${storeConnection.storeRef}`);
    }
  }

  const playlist = model.integrations.find(surface => surface.id === 'playlist_commerce');
  if (!playlist || playlist.loginRequiredBeforeBrowse || playlist.loginRequiredBeforeCheckout) {
    errors.push('playlist-commerce-guest-flow-broken');
  }
  if (!playlist?.decisionRouteRef.startsWith('/veygrit#store')) {
    errors.push('playlist-commerce-wrong-decision-route');
  }

  const ecLogin = model.integrations.find(surface => surface.id === 'ec_social_login');
  if (!ecLogin || !ecLogin.loginRequiredBeforeCheckout || ecLogin.startPoint !== 'ec_site') {
    errors.push('ec-social-login-boundary-broken');
  }
  if (!ecLogin?.decisionRouteRef.startsWith('/merchant-console#vey-id')) {
    errors.push('ec-social-login-wrong-decision-route');
  }

  const deliveryGateway = model.integrations.find(surface => surface.id === 'delivery_gateway');
  if (!deliveryGateway?.decisionRouteRef.startsWith('/merchant-console#delivery-gateway')) {
    errors.push('delivery-gateway-wrong-decision-route');
  }

  for (const integration of model.integrations) {
    if (!integration.commerceEntryDescription || integration.commerceEntryDescription.length < 24) {
      errors.push(`missing-commerce-entry-description:${integration.id}`);
    }
    if (!['store', 'key', 'truck'].includes(integration.commerceEntryIcon)) {
      errors.push(`invalid-commerce-entry-icon:${integration.id}`);
    }
    if (/rawAddress|recipientPhone|providerAccessToken|proofWitness|privateKey|proofSecret|sk_live_|ghp_/i.test(integration.commerceEntryDescription)) {
      errors.push(`unsafe-commerce-entry-description:${integration.id}`);
    }
  }

  const serialized = JSON.stringify(model);
  for (const forbiddenKey of ['rawAddress', 'recipientPhone', 'providerAccessToken', 'privateKey', 'proofWitness']) {
    if (serialized.includes(`"${forbiddenKey}"`)) {
      errors.push(`forbidden-sensitive-key:${forbiddenKey}`);
    }
  }

  return errors;
}
