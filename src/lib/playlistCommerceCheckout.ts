import {
  buildPlaylistCommerceWebhookFixtures,
  type PlaylistCommerceWebhookEnvelope,
} from './playlistCommerceWebhook';

export type PlaylistCommerceCheckoutPurpose =
  | 'self_delivery'
  | 'gift_delivery'
  | 'hotel_delivery'
  | 'cross_border'
  | 'monthly_repeat';

export type PlaylistCommerceCheckoutDisclosureMode =
  | 'proof_only'
  | 'carrier_handoff'
  | 'travel_hotel_alias'
  | 'customs_minimum';

export type PlaylistCommerceCheckoutItem = {
  productRef: string;
  merchantRef: string;
  quantity: number;
  playlistRef?: string;
};

export type PlaylistCommerceGuestCheckoutPolicy = {
  enabled: true;
  accountRequiredBeforeCheckout: false;
  guestSessionRefRequired: true;
  walletConsentStillRequired: true;
  upgradeAfterCheckoutProviders: Array<'google' | 'apple'>;
  allowedGuestActions: Array<
    | 'choose_public_store'
    | 'start_checkout'
    | 'request_address_wallet_consent'
    | 'create_carrier_handoff'
  >;
  blockedGuestActions: Array<
    | 'save_private_playlist'
    | 'persist_wallet_address_without_consent'
    | 'view_saved_address_body'
    | 'friend_delivery_without_recipient_approval'
  >;
  safeMerchantRefs: string[];
  blockedMaterial: string[];
};

export type PlaylistCommerceCheckoutActor =
  | {
    mode: 'guest';
    guestCheckoutRef: string;
    accountRequiredBeforeCheckout: false;
    upgradeAvailableAfterCheckout: true;
    upgradeProviders: Array<'google' | 'apple'>;
  }
  | {
    mode: 'vey_id_user';
    veyIdSessionRef: string;
    accountRequiredBeforeCheckout: false;
    upgradeAvailableAfterCheckout: false;
    upgradeProviders: Array<'google' | 'apple'>;
  };

export type PlaylistCommerceCheckoutRequest = {
  version: 'playlist-commerce-checkout-v0.1';
  requestId: string;
  merchantRef: string;
  userAlias: string;
  checkoutActor: PlaylistCommerceCheckoutActor;
  purpose: PlaylistCommerceCheckoutPurpose;
  disclosureMode: PlaylistCommerceCheckoutDisclosureMode;
  items: PlaylistCommerceCheckoutItem[];
  wallet: {
    requestedClaims: Array<'user_approved' | 'deliverable' | 'address_credential_valid' | 'not_revoked' | 'freshness' | 'carrier_decryptable_address' | 'hotel_delivery_authorized' | 'customs_minimum_fields'>;
    consentPurpose: string;
    maxCredentialAgeSeconds: number;
  };
  delivery?: {
    carrierRef?: string;
    deliveryWindowRef?: string;
    recipientAlias?: string;
    hotelAlias?: string;
  };
  testVector: true;
};

export type PlaylistCommerceCheckoutResponse = {
  version: 'playlist-commerce-checkout-response-v0.1';
  requestId: string;
  status: 'accepted' | 'needs_wallet_consent' | 'needs_review' | 'denied';
  orderAlias?: string;
  subjectAlias?: string;
  guestCheckoutRef?: string;
  consentEnvelopeRef?: string;
  carrierHandoffRef?: string;
  requiredWebhookTopics: Array<'checkout.alias_created' | 'delivery.receipt_created'>;
  merchantVisible: string[];
  hiddenFromMerchant: string[];
  nextAction: 'redirect_wallet' | 'merchant_confirm' | 'carrier_handoff' | 'manual_review' | 'deny';
  warnings: string[];
};

export type PlaylistCommerceMerchantParticipation = {
  version: 'playlist-commerce-merchant-participation-v0.1';
  merchantRef: string;
  storeDisplayName: string;
  playlistCommerceOptIn: boolean;
  directoryVisibility: 'public_no_login' | 'unlisted' | 'wallet_only';
  userLoginRequiredToChooseStore: false;
  participationAction: 'enter_playlist_commerce' | 'stay_private';
  publicStoreFields: string[];
  walletControlledActions: Array<'unlink_store' | 'revoke_address_reuse' | 'revoke_friend_delivery' | 'clear_store_preference'>;
  merchantVisibleRefs: string[];
  hiddenFromMerchant: string[];
  blockedMaterial: string[];
};

export type AddressWalletSocialLoginAddressReusePlan = {
  version: 'vey-id-address-wallet-address-reuse-v0.1';
  loginProvider: 'vey_id';
  accountCreationProviders: Array<'google' | 'apple'>;
  merchantRef: string;
  storeRef: string;
  entryPoints: Array<'guest_checkout_button' | 'vey_id_button' | 'login_button' | 'checkout_address_autofill' | 'friend_delivery' | 'playlist_store_select'>;
  userCanSelectStoreWithoutLogin: true;
  userCanStartCheckoutWithoutAccount: true;
  guestCheckout: PlaylistCommerceGuestCheckoutPolicy;
  integrationDecision: VeygritCommerceIntegrationDecisionPlan;
  addressReuse: {
    source: 'wallet_saved_address';
    reusableAcrossMerchants: true;
    requiresUserConsent: true;
    consentRefRequired: true;
    addressMaterialization: 'carrier_or_merchant_policy_bound';
  };
  merchantReceives: string[];
  merchantNeverReceives: string[];
  walletRevocationActions: Array<'disconnect_merchant' | 'revoke_consent_envelope' | 'remove_saved_address' | 'disable_address_autofill'>;
  requiredClaims: PlaylistCommerceCheckoutRequest['wallet']['requestedClaims'];
};

export type VeygritCommerceIntegrationSurface = 'playlist_commerce' | 'ec_social_login';

export type VeygritCommerceIntegrationPlacement = {
  surface: VeygritCommerceIntegrationSurface;
  label: 'Playlist Commerce' | 'EC Social Login';
  productQuestion: 'which_ec_to_use' | 'how_to_buy_at_that_ec';
  purpose: 'discover_and_manage_ec' | 'login_and_address_autofill';
  primaryActor: 'store_and_product' | 'user_and_account';
  startPoint: 'veygrit_wallet_app' | 'merchant_ec_site';
  installTarget: 'veygrit_app' | 'shopify_woocommerce_or_custom_ec';
  shopperCanChooseStoreWithoutLogin: boolean;
  shopperCanStartShoppingWithoutLoginButton: boolean;
  continueWithVeygritRequiredOnEc: boolean;
  walletAddressReuseRequiresConsent: true;
  accountCreationProviders: Array<'google' | 'apple'>;
  addressReuseMode: 'wallet_side_consent_sheet' | 'ec_side_continue_with_veygrit';
  merchantDecision: string;
  implementationSurfaces: string[];
  merchantReceives: string[];
  merchantNeverReceives: string[];
  nonClaims: string[];
};

export type VeygritCommerceIntegrationDecisionPlan = {
  version: 'veygrit-commerce-integration-decision-v0.1';
  shippingStripePrinciple: string;
  defaultRecommendation: 'offer_both_as_distinct_products';
  placements: VeygritCommerceIntegrationPlacement[];
  sharedRails: string[];
  decisionRules: string[];
  blockedConfusions: string[];
};

const FORBIDDEN_KEY_PATTERNS = [
  /raw[_-]?address/i,
  /recipient[_-]?phone/i,
  /recipient[_-]?identity/i,
  /private[_-]?key/i,
  /proof[_-]?witness/i,
  /biometric/i,
  /passport/i,
  /room[_-]?number/i,
] as const;

function collectForbiddenKeys(value: unknown, path = '$'): string[] {
  if (value === null || typeof value !== 'object') return [];
  const findings: string[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_KEY_PATTERNS.some(pattern => pattern.test(key))) findings.push(childPath);
    findings.push(...collectForbiddenKeys(child, childPath));
  }
  return findings;
}

export function buildPlaylistCommerceCheckoutRequest(
  purpose: PlaylistCommerceCheckoutPurpose = 'self_delivery',
): PlaylistCommerceCheckoutRequest {
  const baseClaims: PlaylistCommerceCheckoutRequest['wallet']['requestedClaims'] = [
    'user_approved',
    'deliverable',
    'address_credential_valid',
    'not_revoked',
    'freshness',
  ];

  const disclosureMode: PlaylistCommerceCheckoutDisclosureMode =
    purpose === 'hotel_delivery' ? 'travel_hotel_alias'
      : purpose === 'cross_border' ? 'customs_minimum'
        : purpose === 'gift_delivery' || purpose === 'self_delivery' || purpose === 'monthly_repeat' ? 'carrier_handoff'
          : 'proof_only';

  const requestedClaims = new Set(baseClaims);
  if (disclosureMode === 'carrier_handoff') requestedClaims.add('carrier_decryptable_address');
  if (disclosureMode === 'travel_hotel_alias') requestedClaims.add('hotel_delivery_authorized');
  if (disclosureMode === 'customs_minimum') requestedClaims.add('customs_minimum_fields');

  return {
    version: 'playlist-commerce-checkout-v0.1',
    requestId: `pc_checkout_${purpose}_001`,
    merchantRef: 'merchant_demo',
    userAlias: 'user_alias_demo_001',
    purpose,
    disclosureMode,
    items: [
      {
        productRef: purpose === 'monthly_repeat' ? 'prod_demo_subscription_refill' : 'prod_demo_lamp',
        merchantRef: 'merchant_demo',
        quantity: 1,
        playlistRef: purpose === 'hotel_delivery' ? 'pl_demo_travel' : 'pl_demo_new_life',
      },
    ],
    checkoutActor: {
      mode: 'guest',
      guestCheckoutRef: `guest_checkout_${purpose}_001`,
      accountRequiredBeforeCheckout: false,
      upgradeAvailableAfterCheckout: true,
      upgradeProviders: ['google', 'apple'],
    },
    wallet: {
      requestedClaims: [...requestedClaims],
      consentPurpose: purpose,
      maxCredentialAgeSeconds: purpose === 'cross_border' ? 2_592_000 : 7_776_000,
    },
    delivery: {
      carrierRef: 'carrier_demo',
      deliveryWindowRef: 'window_demo_001',
      ...(purpose === 'gift_delivery' ? { recipientAlias: 'recipient_alias_demo' } : {}),
      ...(purpose === 'hotel_delivery' ? { hotelAlias: 'hotel_alias_demo' } : {}),
    },
    testVector: true,
  };
}

export function buildPlaylistCommerceCheckoutResponse(
  request: PlaylistCommerceCheckoutRequest,
): PlaylistCommerceCheckoutResponse {
  const needsReview = request.purpose === 'cross_border';
  const orderAlias = `order_alias_${request.requestId}`;
  const carrierHandoffRef = request.disclosureMode === 'carrier_handoff' || request.disclosureMode === 'travel_hotel_alias'
    ? `handoff_${request.requestId}`
    : undefined;

  return {
    version: 'playlist-commerce-checkout-response-v0.1',
    requestId: request.requestId,
    status: needsReview ? 'needs_review' : 'accepted',
    orderAlias,
    subjectAlias: `subject_alias_${request.userAlias}`,
    ...(request.checkoutActor.mode === 'guest' ? { guestCheckoutRef: request.checkoutActor.guestCheckoutRef } : {}),
    consentEnvelopeRef: `consent_${request.requestId}`,
    carrierHandoffRef,
    requiredWebhookTopics: ['checkout.alias_created', 'delivery.receipt_created'],
    merchantVisible: [
      'requestId',
      'orderAlias',
      'subjectAlias',
      ...(request.checkoutActor.mode === 'guest' ? ['guestCheckoutRef'] : []),
      'consentEnvelopeRef',
      'deliverable',
      'deliveryStatus',
      ...(needsReview ? ['tradeReviewStatus'] : []),
    ],
    hiddenFromMerchant: [
      'raw_address',
      'recipient_phone',
      'carrier_decryptable_address',
      'proof_witness',
      'private_key',
      'biometric_template',
      'room_number',
      'passport_data',
    ],
    nextAction: needsReview ? 'manual_review' : carrierHandoffRef ? 'carrier_handoff' : 'merchant_confirm',
    warnings: needsReview ? ['cross-border-trade-review-required'] : [],
  };
}

export function validatePlaylistCommerceCheckoutRequest(request: PlaylistCommerceCheckoutRequest): string[] {
  const errors: string[] = [];
  if (request.version !== 'playlist-commerce-checkout-v0.1') errors.push('invalid-version');
  if (!request.requestId) errors.push('missing-request-id');
  if (!request.merchantRef) errors.push('missing-merchant-ref');
  if (!request.userAlias) errors.push('missing-user-alias');
  if (request.checkoutActor.accountRequiredBeforeCheckout !== false) errors.push('checkout-account-required');
  if (request.checkoutActor.upgradeProviders.join(',') !== 'google,apple') errors.push('checkout-upgrade-provider-must-be-google-apple-only');
  if (request.checkoutActor.mode === 'guest') {
    if (!request.checkoutActor.guestCheckoutRef) errors.push('guest-checkout-missing-ref');
    if (!request.checkoutActor.upgradeAvailableAfterCheckout) errors.push('guest-checkout-missing-upgrade-path');
  }
  if (request.items.length === 0) errors.push('missing-items');
  if (!request.wallet.requestedClaims.includes('user_approved')) errors.push('missing-user-approved-claim');
  if (!request.wallet.requestedClaims.includes('deliverable')) errors.push('missing-deliverable-claim');
  if (!request.wallet.requestedClaims.includes('address_credential_valid')) errors.push('missing-address-credential-valid-claim');

  if (request.disclosureMode === 'carrier_handoff' && !request.wallet.requestedClaims.includes('carrier_decryptable_address')) {
    errors.push('carrier-handoff-missing-carrier-decryptable-claim');
  }
  if (request.disclosureMode === 'travel_hotel_alias' && !request.wallet.requestedClaims.includes('hotel_delivery_authorized')) {
    errors.push('hotel-flow-missing-hotel-authorization-claim');
  }
  if (request.disclosureMode === 'customs_minimum' && !request.wallet.requestedClaims.includes('customs_minimum_fields')) {
    errors.push('cross-border-missing-customs-minimum-fields-claim');
  }

  for (const path of collectForbiddenKeys(request)) errors.push(`forbidden-request-field:${path}`);

  return errors;
}

export function validatePlaylistCommerceCheckoutResponse(response: PlaylistCommerceCheckoutResponse): string[] {
  const errors: string[] = [];
  if (response.version !== 'playlist-commerce-checkout-response-v0.1') errors.push('invalid-response-version');
  if (!response.requestId) errors.push('response-missing-request-id');
  if (response.status === 'accepted' && !response.orderAlias) errors.push('accepted-response-missing-order-alias');
  if (!response.requiredWebhookTopics.includes('checkout.alias_created')) errors.push('response-missing-checkout-webhook-topic');
  if (!response.requiredWebhookTopics.includes('delivery.receipt_created')) errors.push('response-missing-delivery-webhook-topic');
  for (const forbidden of ['raw_address', 'recipient_phone', 'proof_witness', 'private_key']) {
    if (response.merchantVisible.includes(forbidden)) errors.push(`merchant-visible-forbidden:${forbidden}`);
    if (!response.hiddenFromMerchant.includes(forbidden)) errors.push(`hidden-from-merchant-missing:${forbidden}`);
  }
  for (const path of collectForbiddenKeys(response)) {
    if (!path.includes('hiddenFromMerchant')) errors.push(`forbidden-response-field:${path}`);
  }
  return errors;
}

export function buildCheckoutWebhookCompatibilityFixture() {
  const request = buildPlaylistCommerceCheckoutRequest('self_delivery');
  const response = buildPlaylistCommerceCheckoutResponse(request);
  const webhooks = buildPlaylistCommerceWebhookFixtures().filter(fixture =>
    response.requiredWebhookTopics.includes(fixture.payload.topic as 'checkout.alias_created' | 'delivery.receipt_created'),
  );

  return { request, response, webhooks };
}

export function buildPlaylistCommerceMerchantParticipation(
  optIn = true,
): PlaylistCommerceMerchantParticipation {
  return {
    version: 'playlist-commerce-merchant-participation-v0.1',
    merchantRef: 'merchant_demo',
    storeDisplayName: 'Demo Store',
    playlistCommerceOptIn: optIn,
    directoryVisibility: optIn ? 'public_no_login' : 'unlisted',
    userLoginRequiredToChooseStore: false,
    participationAction: optIn ? 'enter_playlist_commerce' : 'stay_private',
    publicStoreFields: ['merchantRef', 'storeDisplayName', 'categoryTags', 'shippingCountryCodes', 'playlistEnabled'],
    walletControlledActions: ['unlink_store', 'revoke_address_reuse', 'revoke_friend_delivery', 'clear_store_preference'],
    merchantVisibleRefs: ['merchantRef', 'storeRef', 'playlistParticipationRef', 'storePreferenceAlias'],
    hiddenFromMerchant: [
      'raw_address',
      'recipient_phone',
      'wallet_private_notes',
      'user_identity_graph',
      'saved_address_body',
      'proof_witness',
    ],
    blockedMaterial: [
      'rawAddress',
      'recipientPhone',
      'savedAddressBody',
      'walletPrivateNotes',
      'proofWitness',
      'privateKey',
    ],
  };
}

export function buildAddressWalletSocialLoginAddressReusePlan(): AddressWalletSocialLoginAddressReusePlan {
  return {
    version: 'vey-id-address-wallet-address-reuse-v0.1',
    loginProvider: 'vey_id',
    accountCreationProviders: ['google', 'apple'],
    merchantRef: 'merchant_demo',
    storeRef: 'store_demo',
    entryPoints: ['guest_checkout_button', 'vey_id_button', 'login_button', 'checkout_address_autofill', 'friend_delivery', 'playlist_store_select'],
    userCanSelectStoreWithoutLogin: true,
    userCanStartCheckoutWithoutAccount: true,
    guestCheckout: {
      enabled: true,
      accountRequiredBeforeCheckout: false,
      guestSessionRefRequired: true,
      walletConsentStillRequired: true,
      upgradeAfterCheckoutProviders: ['google', 'apple'],
      allowedGuestActions: [
        'choose_public_store',
        'start_checkout',
        'request_address_wallet_consent',
        'create_carrier_handoff',
      ],
      blockedGuestActions: [
        'save_private_playlist',
        'persist_wallet_address_without_consent',
        'view_saved_address_body',
        'friend_delivery_without_recipient_approval',
      ],
      safeMerchantRefs: ['guestCheckoutRef', 'checkoutAlias', 'pairwiseSubjectAlias', 'recipientId', 'walletConsentRef', 'addressCredentialRef'],
      blockedMaterial: ['raw_address', 'recipient_phone', 'saved_address_body', 'proof_secret', 'private_key'],
    },
    integrationDecision: buildVeygritCommerceIntegrationDecisionPlan(),
    addressReuse: {
      source: 'wallet_saved_address',
      reusableAcrossMerchants: true,
      requiresUserConsent: true,
      consentRefRequired: true,
      addressMaterialization: 'carrier_or_merchant_policy_bound',
    },
    merchantReceives: ['pairwiseSubjectAlias', 'subjectAlias', 'recipientId', 'addressCredentialRef', 'walletConsentRef', 'deliverabilityClaim'],
    merchantNeverReceives: [
      'raw_address',
      'recipient_phone',
      'saved_address_body',
      'proof_secret',
      'private_key',
      'wallet_private_notes',
    ],
    walletRevocationActions: ['disconnect_merchant', 'revoke_consent_envelope', 'remove_saved_address', 'disable_address_autofill'],
    requiredClaims: ['user_approved', 'deliverable', 'address_credential_valid', 'not_revoked', 'freshness'],
  };
}

export function buildVeygritCommerceIntegrationDecisionPlan(): VeygritCommerceIntegrationDecisionPlan {
  return {
    version: 'veygrit-commerce-integration-decision-v0.1',
    shippingStripePrinciple: 'EC integrates once with Veygrit/Skipship, then chooses Playlist Commerce discovery, EC Social Login checkout, or both without integrating DHL/UPS directly.',
    defaultRecommendation: 'offer_both_as_distinct_products',
    placements: [
      {
        surface: 'playlist_commerce',
        label: 'Playlist Commerce',
        productQuestion: 'which_ec_to_use',
        purpose: 'discover_and_manage_ec',
        primaryActor: 'store_and_product',
        startPoint: 'veygrit_wallet_app',
        installTarget: 'veygrit_app',
        shopperCanChooseStoreWithoutLogin: true,
        shopperCanStartShoppingWithoutLoginButton: true,
        continueWithVeygritRequiredOnEc: false,
        walletAddressReuseRequiresConsent: true,
        accountCreationProviders: ['google', 'apple'],
        addressReuseMode: 'wallet_side_consent_sheet',
        merchantDecision: 'Appear in Playlist Commerce and receive playlist-attributed traffic without forcing a Vey ID login button before store selection.',
        implementationSurfaces: ['Veygrit app Store tab', 'Topics', 'Discover', 'My Stores', 'wallet-side consent sheet'],
        merchantReceives: ['merchantRef', 'storeRef', 'playlistParticipationRef', 'storePreferenceAlias', 'walletConsentRef'],
        merchantNeverReceives: ['raw_address', 'recipient_phone', 'saved_address_body', 'private_key', 'proof_secret'],
        nonClaims: [
          'Playlist Commerce is not EC Social Login.',
          'No-login store discovery is not silent address reuse.',
          'Wallet-side reuse still requires consent before delivery handoff.',
        ],
      },
      {
        surface: 'ec_social_login',
        label: 'EC Social Login',
        productQuestion: 'how_to_buy_at_that_ec',
        purpose: 'login_and_address_autofill',
        primaryActor: 'user_and_account',
        startPoint: 'merchant_ec_site',
        installTarget: 'shopify_woocommerce_or_custom_ec',
        shopperCanChooseStoreWithoutLogin: false,
        shopperCanStartShoppingWithoutLoginButton: false,
        continueWithVeygritRequiredOnEc: true,
        walletAddressReuseRequiresConsent: true,
        accountCreationProviders: ['google', 'apple'],
        addressReuseMode: 'ec_side_continue_with_veygrit',
        merchantDecision: 'Install Continue with Veygrit on checkout or account pages to use Address Wallet autofill and carrier handoff.',
        implementationSurfaces: ['Continue with Veygrit button', 'Address Login redirect', 'Shopify plugin', 'WooCommerce plugin', 'custom EC SDK'],
        merchantReceives: ['pairwiseSubjectAlias', 'recipientId', 'addressCredentialRef', 'walletConsentRef', 'carrierHandoffRef'],
        merchantNeverReceives: ['raw_address', 'recipient_phone', 'saved_address_body', 'private_key', 'proof_secret'],
        nonClaims: [
          'EC Social Login is not a store discovery directory.',
          'Google/Apple account creation is bootstrap, not proof of residence.',
          'Address autofill does not give the EC unrestricted address storage rights.',
        ],
      },
    ],
    sharedRails: ['Vey ID', 'Address Wallet', 'Friends', 'QR', 'Delivery Gateway', 'WooCommerce', 'Shopify', 'SDK'],
    decisionRules: [
      'Use Playlist Commerce when the merchant wants discovery, saved stores, public store listing, and wallet-side address reuse without a login button before shopping.',
      'Use EC Social Login when the merchant wants Continue with Veygrit inside its own checkout to remove repeated address entry.',
      'Use both when the merchant wants Veygrit discovery traffic and EC-side Address Login conversion.',
    ],
    blockedConfusions: [
      'Do not require the EC Social Login button merely to browse or choose a Playlist Commerce store.',
      'Do not treat Playlist Commerce opt-in as permission to autofill an EC checkout address.',
      'Do not call Google/Apple sign-in address verification.',
    ],
  };
}

export function validatePlaylistCommerceMerchantParticipation(settings: PlaylistCommerceMerchantParticipation): string[] {
  const errors: string[] = [];
  if (settings.version !== 'playlist-commerce-merchant-participation-v0.1') errors.push('invalid-version');
  if (!settings.merchantRef) errors.push('missing-merchant-ref');
  if (settings.playlistCommerceOptIn && settings.participationAction !== 'enter_playlist_commerce') errors.push('opt-in-not-entering');
  if (!settings.playlistCommerceOptIn && settings.directoryVisibility !== 'unlisted') errors.push('opt-out-still-listed');
  if (settings.userLoginRequiredToChooseStore !== false) errors.push('store-choice-requires-login');
  for (const action of ['unlink_store', 'revoke_address_reuse', 'clear_store_preference']) {
    if (!settings.walletControlledActions.includes(action as PlaylistCommerceMerchantParticipation['walletControlledActions'][number])) {
      errors.push(`missing-wallet-action:${action}`);
    }
  }
  for (const forbidden of ['raw_address', 'recipient_phone', 'saved_address_body', 'proof_witness']) {
    if (settings.publicStoreFields.includes(forbidden)) errors.push(`public-store-field-forbidden:${forbidden}`);
    if (!settings.hiddenFromMerchant.includes(forbidden)) errors.push(`hidden-from-merchant-missing:${forbidden}`);
  }
  for (const path of collectForbiddenKeys(settings)) {
    if (!path.includes('hiddenFromMerchant') && !path.includes('blockedMaterial')) errors.push(`forbidden-participation-field:${path}`);
  }
  return errors;
}

export function validateVeygritCommerceIntegrationDecisionPlan(plan: VeygritCommerceIntegrationDecisionPlan): string[] {
  const errors: string[] = [];
  const placements = new Map(plan.placements.map(placement => [placement.surface, placement]));
  const playlist = placements.get('playlist_commerce');
  const ec = placements.get('ec_social_login');

  if (plan.version !== 'veygrit-commerce-integration-decision-v0.1') errors.push('invalid-version');
  if (plan.defaultRecommendation !== 'offer_both_as_distinct_products') errors.push('must-offer-distinct-products');
  if (!playlist) errors.push('missing-playlist-commerce-placement');
  if (!ec) errors.push('missing-ec-social-login-placement');

  if (playlist) {
    if (playlist.productQuestion !== 'which_ec_to_use') errors.push('playlist-wrong-product-question');
    if (playlist.startPoint !== 'veygrit_wallet_app') errors.push('playlist-start-point-must-be-veygrit');
    if (playlist.installTarget !== 'veygrit_app') errors.push('playlist-install-target-must-be-veygrit-app');
    if (!playlist.shopperCanChooseStoreWithoutLogin) errors.push('playlist-store-choice-requires-login');
    if (!playlist.shopperCanStartShoppingWithoutLoginButton) errors.push('playlist-shopping-requires-login-button');
    if (playlist.continueWithVeygritRequiredOnEc) errors.push('playlist-must-not-require-ec-login-button');
    if (playlist.addressReuseMode !== 'wallet_side_consent_sheet') errors.push('playlist-address-reuse-must-be-wallet-side');
  }

  if (ec) {
    if (ec.productQuestion !== 'how_to_buy_at_that_ec') errors.push('ec-wrong-product-question');
    if (ec.startPoint !== 'merchant_ec_site') errors.push('ec-start-point-must-be-merchant-site');
    if (ec.installTarget !== 'shopify_woocommerce_or_custom_ec') errors.push('ec-install-target-must-be-plugin-or-sdk');
    if (ec.shopperCanStartShoppingWithoutLoginButton) errors.push('ec-social-login-must-require-login-button');
    if (!ec.continueWithVeygritRequiredOnEc) errors.push('ec-missing-continue-with-veygrit');
    if (ec.addressReuseMode !== 'ec_side_continue_with_veygrit') errors.push('ec-address-reuse-must-use-continue-with-veygrit');
  }

  for (const placement of plan.placements) {
    if (placement.accountCreationProviders.join(',') !== 'google,apple') {
      errors.push(`${placement.surface}:account-creation-provider-must-be-google-apple-only`);
    }
    if (!placement.walletAddressReuseRequiresConsent) errors.push(`${placement.surface}:address-reuse-missing-consent`);
    for (const forbidden of ['raw_address', 'recipient_phone', 'saved_address_body', 'private_key', 'proof_secret']) {
      if (placement.merchantReceives.includes(forbidden)) errors.push(`${placement.surface}:merchant-receives-forbidden:${forbidden}`);
      if (!placement.merchantNeverReceives.includes(forbidden)) errors.push(`${placement.surface}:missing-never-receives:${forbidden}`);
    }
  }

  for (const shared of ['Vey ID', 'Address Wallet', 'Friends', 'QR', 'Delivery Gateway', 'WooCommerce', 'Shopify', 'SDK']) {
    if (!plan.sharedRails.includes(shared)) errors.push(`missing-shared-rail:${shared}`);
  }
  if (!plan.blockedConfusions.some(confusion => /Playlist Commerce store/i.test(confusion))) {
    errors.push('missing-playlist-login-confusion-boundary');
  }
  if (!plan.blockedConfusions.some(confusion => /autofill an EC checkout address/i.test(confusion))) {
    errors.push('missing-ec-autofill-confusion-boundary');
  }

  return errors;
}

export function validateAddressWalletSocialLoginAddressReusePlan(plan: AddressWalletSocialLoginAddressReusePlan): string[] {
  const errors: string[] = [];
  if (plan.version !== 'vey-id-address-wallet-address-reuse-v0.1') errors.push('invalid-version');
  if (plan.loginProvider !== 'vey_id') errors.push('invalid-login-provider');
  if (plan.accountCreationProviders.join(',') !== 'google,apple') errors.push('account-creation-provider-must-be-google-apple-only');
  if (plan.userCanSelectStoreWithoutLogin !== true) errors.push('store-select-login-required');
  if (plan.userCanStartCheckoutWithoutAccount !== true) errors.push('guest-checkout-account-required');
  if (!plan.guestCheckout.enabled) errors.push('guest-checkout-disabled');
  if (plan.guestCheckout.accountRequiredBeforeCheckout !== false) errors.push('guest-checkout-account-required');
  if (!plan.guestCheckout.guestSessionRefRequired) errors.push('guest-checkout-missing-session-ref');
  if (!plan.guestCheckout.walletConsentStillRequired) errors.push('guest-checkout-missing-wallet-consent');
  if (plan.guestCheckout.upgradeAfterCheckoutProviders.join(',') !== 'google,apple') {
    errors.push('guest-checkout-upgrade-provider-must-be-google-apple-only');
  }
  errors.push(...validateVeygritCommerceIntegrationDecisionPlan(plan.integrationDecision).map(error => `integration-decision:${error}`));
  for (const action of ['choose_public_store', 'start_checkout', 'request_address_wallet_consent', 'create_carrier_handoff'] as const) {
    if (!plan.guestCheckout.allowedGuestActions.includes(action)) errors.push(`guest-checkout-missing-action:${action}`);
  }
  for (const blocked of ['save_private_playlist', 'persist_wallet_address_without_consent', 'view_saved_address_body']) {
    if (!plan.guestCheckout.blockedGuestActions.includes(blocked as PlaylistCommerceGuestCheckoutPolicy['blockedGuestActions'][number])) {
      errors.push(`guest-checkout-missing-blocked-action:${blocked}`);
    }
  }
  for (const visible of ['guestCheckoutRef', 'checkoutAlias', 'walletConsentRef']) {
    if (!plan.guestCheckout.safeMerchantRefs.includes(visible)) errors.push(`guest-checkout-missing-safe-ref:${visible}`);
  }
  if (plan.addressReuse.source !== 'wallet_saved_address') errors.push('address-reuse-not-wallet-saved');
  if (!plan.addressReuse.reusableAcrossMerchants) errors.push('address-not-reusable-across-merchants');
  if (!plan.addressReuse.requiresUserConsent) errors.push('address-reuse-missing-consent');
  if (!plan.addressReuse.consentRefRequired) errors.push('address-reuse-missing-consent-ref');
  for (const claim of ['user_approved', 'deliverable', 'address_credential_valid', 'not_revoked'] as const) {
    if (!plan.requiredClaims.includes(claim)) errors.push(`missing-required-claim:${claim}`);
  }
  for (const visible of ['pairwiseSubjectAlias', 'recipientId', 'addressCredentialRef', 'walletConsentRef']) {
    if (!plan.merchantReceives.includes(visible)) errors.push(`missing-merchant-safe-ref:${visible}`);
  }
  for (const hidden of ['raw_address', 'recipient_phone', 'saved_address_body', 'proof_secret', 'private_key']) {
    if (plan.merchantReceives.includes(hidden)) errors.push(`merchant-receives-forbidden:${hidden}`);
    if (!plan.merchantNeverReceives.includes(hidden)) errors.push(`merchant-never-receives-missing:${hidden}`);
  }
  for (const action of ['disconnect_merchant', 'revoke_consent_envelope', 'disable_address_autofill']) {
    if (!plan.walletRevocationActions.includes(action as AddressWalletSocialLoginAddressReusePlan['walletRevocationActions'][number])) {
      errors.push(`missing-wallet-revocation:${action}`);
    }
  }
  for (const path of collectForbiddenKeys(plan)) {
    if (!path.includes('merchantNeverReceives')) errors.push(`forbidden-address-reuse-field:${path}`);
  }
  return errors;
}
