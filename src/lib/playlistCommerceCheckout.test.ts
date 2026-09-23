import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildCheckoutWebhookCompatibilityFixture,
  buildAddressWalletSocialLoginAddressReusePlan,
  buildPlaylistCommerceMerchantParticipation,
  buildVeygritCommerceIntegrationDecisionPlan,
  buildPlaylistCommerceCheckoutRequest,
  buildPlaylistCommerceCheckoutResponse,
  validateAddressWalletSocialLoginAddressReusePlan,
  validatePlaylistCommerceMerchantParticipation,
  validateVeygritCommerceIntegrationDecisionPlan,
  validatePlaylistCommerceCheckoutRequest,
  validatePlaylistCommerceCheckoutResponse,
  type PlaylistCommerceCheckoutRequest,
} from './playlistCommerceCheckout';

test('checkout request fixtures validate for core delivery purposes', () => {
  for (const purpose of ['self_delivery', 'gift_delivery', 'hotel_delivery', 'cross_border', 'monthly_repeat'] as const) {
    const request = buildPlaylistCommerceCheckoutRequest(purpose);
    assert.deepEqual(validatePlaylistCommerceCheckoutRequest(request), [], purpose);
    assert.equal(request.wallet.consentPurpose, purpose);
    assert.ok(request.wallet.requestedClaims.includes('user_approved'));
    assert.ok(request.wallet.requestedClaims.includes('deliverable'));
    assert.ok(request.wallet.requestedClaims.includes('address_credential_valid'));
    assert.equal(request.checkoutActor.mode, 'guest');
    assert.equal(request.checkoutActor.accountRequiredBeforeCheckout, false);
    assert.deepEqual(request.checkoutActor.upgradeProviders, ['google', 'apple']);
  }
});

test('EC guest checkout can start without account creation while preserving wallet consent', () => {
  const request = buildPlaylistCommerceCheckoutRequest('self_delivery');
  const response = buildPlaylistCommerceCheckoutResponse(request);

  assert.deepEqual(validatePlaylistCommerceCheckoutRequest(request), []);
  assert.equal(request.checkoutActor.mode, 'guest');
  assert.ok(request.checkoutActor.guestCheckoutRef.startsWith('guest_checkout_'));
  assert.equal(request.checkoutActor.upgradeAvailableAfterCheckout, true);
  assert.deepEqual(request.checkoutActor.upgradeProviders, ['google', 'apple']);
  assert.ok(request.wallet.requestedClaims.includes('user_approved'));
  assert.ok(request.wallet.requestedClaims.includes('carrier_decryptable_address'));
  assert.equal(response.guestCheckoutRef, request.checkoutActor.guestCheckoutRef);
  assert.ok(response.merchantVisible.includes('guestCheckoutRef'));
  assert.ok(!response.merchantVisible.includes('saved_address_body'));
});

test('checkout request disclosure modes require matching wallet claims', () => {
  const carrier = buildPlaylistCommerceCheckoutRequest('self_delivery');
  assert.equal(carrier.disclosureMode, 'carrier_handoff');
  assert.ok(carrier.wallet.requestedClaims.includes('carrier_decryptable_address'));

  const hotel = buildPlaylistCommerceCheckoutRequest('hotel_delivery');
  assert.equal(hotel.disclosureMode, 'travel_hotel_alias');
  assert.ok(hotel.wallet.requestedClaims.includes('hotel_delivery_authorized'));

  const crossBorder = buildPlaylistCommerceCheckoutRequest('cross_border');
  assert.equal(crossBorder.disclosureMode, 'customs_minimum');
  assert.ok(crossBorder.wallet.requestedClaims.includes('customs_minimum_fields'));
});

test('checkout request rejects raw address and private material fields', () => {
  const request = buildPlaylistCommerceCheckoutRequest('gift_delivery') as PlaylistCommerceCheckoutRequest & {
    rawAddress?: string;
    proofWitness?: string;
    delivery: NonNullable<PlaylistCommerceCheckoutRequest['delivery']> & { recipientPhone?: string };
  };
  request.rawAddress = 'blocked-test-value';
  request.proofWitness = 'blocked-test-value';
  request.delivery.recipientPhone = 'blocked-test-value';

  const errors = validatePlaylistCommerceCheckoutRequest(request);

  assert.ok(errors.includes('forbidden-request-field:$.rawAddress'));
  assert.ok(errors.includes('forbidden-request-field:$.proofWitness'));
  assert.ok(errors.includes('forbidden-request-field:$.delivery.recipientPhone'));
});

test('checkout response keeps merchant view alias-only and hides private data', () => {
  const request = buildPlaylistCommerceCheckoutRequest('self_delivery');
  const response = buildPlaylistCommerceCheckoutResponse(request);

  assert.deepEqual(validatePlaylistCommerceCheckoutResponse(response), []);
  assert.equal(response.status, 'accepted');
  assert.equal(response.nextAction, 'carrier_handoff');
  assert.ok(response.orderAlias?.startsWith('order_alias_'));
  assert.ok(response.carrierHandoffRef?.startsWith('handoff_'));
  assert.ok(response.merchantVisible.includes('orderAlias'));
  assert.ok(!response.merchantVisible.includes('raw_address'));
  assert.ok(response.hiddenFromMerchant.includes('raw_address'));
  assert.ok(response.hiddenFromMerchant.includes('proof_witness'));
});

test('cross-border checkout requires manual review instead of overclaiming final compliance', () => {
  const request = buildPlaylistCommerceCheckoutRequest('cross_border');
  const response = buildPlaylistCommerceCheckoutResponse(request);

  assert.equal(response.status, 'needs_review');
  assert.equal(response.nextAction, 'manual_review');
  assert.ok(response.warnings.includes('cross-border-trade-review-required'));
  assert.ok(response.merchantVisible.includes('tradeReviewStatus'));
});

test('checkout response validation catches forbidden merchant-visible fields', () => {
  const response = buildPlaylistCommerceCheckoutResponse(buildPlaylistCommerceCheckoutRequest('self_delivery'));
  response.merchantVisible.push('raw_address');

  const errors = validatePlaylistCommerceCheckoutResponse(response);

  assert.ok(errors.includes('merchant-visible-forbidden:raw_address'));
});

test('checkout compatibility fixture links response-required webhook topics to webhook fixtures', () => {
  const fixture = buildCheckoutWebhookCompatibilityFixture();
  const webhookTopics = fixture.webhooks.map(webhook => webhook.payload.topic);

  assert.deepEqual(validatePlaylistCommerceCheckoutRequest(fixture.request), []);
  assert.deepEqual(validatePlaylistCommerceCheckoutResponse(fixture.response), []);
  assert.deepEqual(webhookTopics, ['checkout.alias_created', 'delivery.receipt_created']);
  assert.ok(fixture.webhooks.every(webhook => webhook.payload.merchantRef === fixture.request.merchantRef));
});

test('merchant can opt into Playlist Commerce and users can choose the store without login', () => {
  const participating = buildPlaylistCommerceMerchantParticipation(true);
  const privateStore = buildPlaylistCommerceMerchantParticipation(false);

  assert.deepEqual(validatePlaylistCommerceMerchantParticipation(participating), []);
  assert.equal(participating.playlistCommerceOptIn, true);
  assert.equal(participating.participationAction, 'enter_playlist_commerce');
  assert.equal(participating.directoryVisibility, 'public_no_login');
  assert.equal(participating.userLoginRequiredToChooseStore, false);
  assert.ok(participating.publicStoreFields.includes('storeDisplayName'));
  assert.ok(participating.merchantVisibleRefs.includes('playlistParticipationRef'));
  assert.ok(participating.walletControlledActions.includes('unlink_store'));
  assert.ok(participating.walletControlledActions.includes('revoke_address_reuse'));
  assert.ok(participating.hiddenFromMerchant.includes('saved_address_body'));
  assert.doesNotMatch(JSON.stringify(participating.publicStoreFields), /raw_address|recipient_phone|saved_address_body/);

  assert.deepEqual(validatePlaylistCommerceMerchantParticipation(privateStore), []);
  assert.equal(privateStore.playlistCommerceOptIn, false);
  assert.equal(privateStore.participationAction, 'stay_private');
  assert.equal(privateStore.directoryVisibility, 'unlisted');
});

test('merchant participation validation blocks login-required store choice and private public fields', () => {
  const unsafe = {
    ...buildPlaylistCommerceMerchantParticipation(true),
    userLoginRequiredToChooseStore: true,
    publicStoreFields: ['merchantRef', 'raw_address'],
  } as unknown as ReturnType<typeof buildPlaylistCommerceMerchantParticipation>;

  const errors = validatePlaylistCommerceMerchantParticipation(unsafe);

  assert.ok(errors.includes('store-choice-requires-login'));
  assert.ok(errors.includes('public-store-field-forbidden:raw_address'));
});

test('Vey ID can reuse Address Wallet saved addresses for address-entry delegation', () => {
  const plan = buildAddressWalletSocialLoginAddressReusePlan();
  const playlistPlacement = plan.integrationDecision.placements.find(placement => placement.surface === 'playlist_commerce');
  const ecPlacement = plan.integrationDecision.placements.find(placement => placement.surface === 'ec_social_login');

  assert.deepEqual(validateAddressWalletSocialLoginAddressReusePlan(plan), []);
  assert.equal(plan.loginProvider, 'vey_id');
  assert.deepEqual(plan.accountCreationProviders, ['google', 'apple']);
  assert.equal(plan.userCanSelectStoreWithoutLogin, true);
  assert.equal(plan.userCanStartCheckoutWithoutAccount, true);
  assert.equal(plan.guestCheckout.enabled, true);
  assert.equal(plan.guestCheckout.accountRequiredBeforeCheckout, false);
  assert.equal(plan.guestCheckout.walletConsentStillRequired, true);
  assert.deepEqual(plan.guestCheckout.upgradeAfterCheckoutProviders, ['google', 'apple']);
  assert.ok(plan.guestCheckout.allowedGuestActions.includes('start_checkout'));
  assert.ok(plan.guestCheckout.allowedGuestActions.includes('request_address_wallet_consent'));
  assert.ok(plan.guestCheckout.blockedGuestActions.includes('persist_wallet_address_without_consent'));
  assert.ok(plan.guestCheckout.safeMerchantRefs.includes('guestCheckoutRef'));
  assert.equal(plan.addressReuse.source, 'wallet_saved_address');
  assert.equal(plan.addressReuse.reusableAcrossMerchants, true);
  assert.equal(plan.addressReuse.requiresUserConsent, true);
  assert.equal(plan.addressReuse.consentRefRequired, true);
  assert.ok(plan.entryPoints.includes('vey_id_button'));
  assert.ok(plan.entryPoints.includes('guest_checkout_button'));
  assert.ok(plan.entryPoints.includes('checkout_address_autofill'));
  assert.ok(plan.entryPoints.includes('playlist_store_select'));
  assert.equal(playlistPlacement?.shopperCanStartShoppingWithoutLoginButton, true);
  assert.equal(playlistPlacement?.productQuestion, 'which_ec_to_use');
  assert.equal(playlistPlacement?.addressReuseMode, 'wallet_side_consent_sheet');
  assert.equal(ecPlacement?.continueWithVeygritRequiredOnEc, true);
  assert.equal(ecPlacement?.productQuestion, 'how_to_buy_at_that_ec');
  assert.equal(ecPlacement?.addressReuseMode, 'ec_side_continue_with_veygrit');
  assert.ok(plan.merchantReceives.includes('pairwiseSubjectAlias'));
  assert.ok(plan.merchantReceives.includes('recipientId'));
  assert.ok(plan.merchantReceives.includes('walletConsentRef'));
  assert.ok(plan.merchantNeverReceives.includes('saved_address_body'));
  assert.ok(plan.walletRevocationActions.includes('disconnect_merchant'));
  assert.ok(plan.walletRevocationActions.includes('disable_address_autofill'));
  assert.doesNotMatch(JSON.stringify(plan.merchantReceives), /raw_address|recipient_phone|saved_address_body|private_key/);
});

test('shipping Stripe integration decision separates Playlist Commerce from EC Social Login', () => {
  const plan = buildVeygritCommerceIntegrationDecisionPlan();
  const playlistPlacement = plan.placements.find(placement => placement.surface === 'playlist_commerce');
  const ecPlacement = plan.placements.find(placement => placement.surface === 'ec_social_login');

  assert.deepEqual(validateVeygritCommerceIntegrationDecisionPlan(plan), []);
  assert.match(plan.shippingStripePrinciple, /integrates once with Veygrit\/Skipship/);
  assert.equal(plan.defaultRecommendation, 'offer_both_as_distinct_products');
  assert.equal(playlistPlacement?.label, 'Playlist Commerce');
  assert.equal(playlistPlacement?.purpose, 'discover_and_manage_ec');
  assert.equal(playlistPlacement?.primaryActor, 'store_and_product');
  assert.equal(playlistPlacement?.startPoint, 'veygrit_wallet_app');
  assert.equal(playlistPlacement?.shopperCanChooseStoreWithoutLogin, true);
  assert.equal(playlistPlacement?.shopperCanStartShoppingWithoutLoginButton, true);
  assert.equal(playlistPlacement?.continueWithVeygritRequiredOnEc, false);
  assert.ok(playlistPlacement?.nonClaims.includes('Playlist Commerce is not EC Social Login.'));
  assert.equal(ecPlacement?.label, 'EC Social Login');
  assert.equal(ecPlacement?.purpose, 'login_and_address_autofill');
  assert.equal(ecPlacement?.primaryActor, 'user_and_account');
  assert.equal(ecPlacement?.startPoint, 'merchant_ec_site');
  assert.equal(ecPlacement?.shopperCanStartShoppingWithoutLoginButton, false);
  assert.equal(ecPlacement?.continueWithVeygritRequiredOnEc, true);
  assert.ok(ecPlacement?.implementationSurfaces.includes('Continue with Veygrit button'));
  assert.deepEqual(ecPlacement?.accountCreationProviders, ['google', 'apple']);
  assert.ok(plan.sharedRails.includes('Address Wallet'));
  assert.ok(plan.sharedRails.includes('Delivery Gateway'));
  assert.ok(plan.sharedRails.includes('Shopify'));
  assert.ok(plan.decisionRules.some(rule => /Use both/i.test(rule)));
});

test('shipping Stripe integration decision validation rejects mixed-up placement rules', () => {
  const unsafe = {
    ...buildVeygritCommerceIntegrationDecisionPlan(),
    placements: buildVeygritCommerceIntegrationDecisionPlan().placements.map(placement =>
      placement.surface === 'playlist_commerce'
        ? {
          ...placement,
          shopperCanStartShoppingWithoutLoginButton: false,
          continueWithVeygritRequiredOnEc: true,
        }
        : {
          ...placement,
          shopperCanStartShoppingWithoutLoginButton: true,
          continueWithVeygritRequiredOnEc: false,
          merchantReceives: [...placement.merchantReceives, 'raw_address'],
        },
    ),
  } as ReturnType<typeof buildVeygritCommerceIntegrationDecisionPlan>;

  const errors = validateVeygritCommerceIntegrationDecisionPlan(unsafe);

  assert.ok(errors.includes('playlist-shopping-requires-login-button'));
  assert.ok(errors.includes('playlist-must-not-require-ec-login-button'));
  assert.ok(errors.includes('ec-social-login-must-require-login-button'));
  assert.ok(errors.includes('ec-missing-continue-with-veygrit'));
  assert.ok(errors.includes('ec_social_login:merchant-receives-forbidden:raw_address'));
});

test('Vey ID address reuse validation rejects unsafe address reuse contracts', () => {
  const unsafe = {
    ...buildAddressWalletSocialLoginAddressReusePlan(),
    accountCreationProviders: ['google', 'email'],
    userCanSelectStoreWithoutLogin: false,
    userCanStartCheckoutWithoutAccount: false,
    guestCheckout: {
      ...buildAddressWalletSocialLoginAddressReusePlan().guestCheckout,
      accountRequiredBeforeCheckout: true,
      walletConsentStillRequired: false,
      upgradeAfterCheckoutProviders: ['google', 'email'],
    },
    addressReuse: {
      ...buildAddressWalletSocialLoginAddressReusePlan().addressReuse,
      requiresUserConsent: false,
    },
    merchantReceives: ['subjectAlias', 'raw_address'],
  } as unknown as ReturnType<typeof buildAddressWalletSocialLoginAddressReusePlan>;

  const errors = validateAddressWalletSocialLoginAddressReusePlan(unsafe);

  assert.ok(errors.includes('store-select-login-required'));
  assert.ok(errors.includes('account-creation-provider-must-be-google-apple-only'));
  assert.ok(errors.includes('guest-checkout-account-required'));
  assert.ok(errors.includes('guest-checkout-missing-wallet-consent'));
  assert.ok(errors.includes('guest-checkout-upgrade-provider-must-be-google-apple-only'));
  assert.ok(errors.includes('address-reuse-missing-consent'));
  assert.ok(errors.includes('merchant-receives-forbidden:raw_address'));
});

test('Playlist Commerce platform docs capture merchant participation and address reuse boundaries', () => {
  const doc = readFileSync('docs/product/playlist-commerce-platform.md', 'utf8');

  assert.match(doc, /Merchant Participation And Vey ID Address Wallet Login/);
  assert.match(doc, /public no-login directory/);
  assert.match(doc, /Users may choose the store before they sign in/);
  assert.match(doc, /Vey ID can be embedded by EC sites/);
  assert.match(doc, /Guest checkout/);
  assert.match(doc, /account is not required before checkout/i);
  assert.match(doc, /Playlist Commerce is not EC Social Login/);
  assert.match(doc, /Continue with Veygrit/);
  assert.match(doc, /which EC to use/i);
  assert.match(doc, /how to buy at that EC/i);
  assert.match(doc, /guestCheckoutRef/);
  assert.match(doc, /Google\/Apple only/);
  assert.match(doc, /pairwiseSubjectAlias/);
  assert.match(doc, /walletConsentRef/);
  assert.match(doc, /revoke_address_reuse/);
  assert.match(doc, /clear_store_preference/);
  assert.match(doc, /saved address body/);
  assert.match(doc, /not silent address sharing/i);
});
