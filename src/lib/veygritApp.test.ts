import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  VEYGRIT_APP_MODEL_VERSION,
  buildVeygritAppModel,
  validateVeygritAppModel,
} from './veygritApp';

test('Veygrit app model defines the address wallet OS navigation and account rules', () => {
  const model = buildVeygritAppModel();
  const errors = validateVeygritAppModel(model);

  assert.equal(model.version, VEYGRIT_APP_MODEL_VERSION);
  assert.equal(model.brand, 'Veygrit');
  assert.equal(model.productDefinition, 'address_wallet_os');
  assert.deepEqual(errors, []);
  assert.deepEqual(model.navigation.map(item => item.label), ['Home', 'Friends', 'Store', 'My Page']);
  assert.deepEqual(model.navigation.find(item => item.id === 'store')?.children?.map(item => item.label), [
    'Topics',
    'Discover',
    'My Stores',
  ]);
  assert.deepEqual(model.accountCreation.allowedProviders, ['google', 'apple']);
  assert.equal(model.accountCreation.passwordSignupEnabled, false);
  assert.equal(model.accountCreation.emailPasswordSignupEnabled, false);
  assert.equal(model.accountCreation.veyIdRequiredForEcLogin, true);
});

test('Veygrit keeps address entry familiar and converts carrier shape only at label creation', () => {
  const model = buildVeygritAppModel();

  assert.equal(model.addressEntry.userForm, 'familiar_country_address_form');
  assert.equal(model.addressEntry.poBoxSupported, true);
  assert.equal(model.addressEntry.carrierSpecificFieldsInUserForm, false);
  assert.equal(model.addressEntry.carrierLabelConversion, 'ups_dhl_server_side_at_label_creation');
  assert.equal(model.home.myAddress.length, 3);
  assert.equal(model.home.spareAddress.length, 3);
  assert.ok(model.home.myAddress.every(card => card.carrierConversion === 'server_side_carrier_label_shape'));
  assert.ok(model.home.spareAddress.every(card => card.poBoxSupported));
});

test('Veygrit friends and merchants only receive references and safe identity fields', () => {
  const model = buildVeygritAppModel();
  const serialized = JSON.stringify(model);

  assert.deepEqual(model.friends.visibleFields, ['displayName', 'iconRef', 'veyId', 'trustState']);
  assert.deepEqual(model.friends.hiddenFields, ['addressText', 'phoneNumber', 'carrierPayload']);
  assert.ok(model.friends.examples.every(friend => friend.visibleFields.join(',') === model.friends.visibleFields.join(',')));
  assert.deepEqual(model.merchantVisibleRefs, [
    'recipientId',
    'shipmentRef',
    'labelRef',
    'trackingAlias',
    'storeRef',
    'connectionRef',
  ]);
  assert.ok(model.hiddenMaterial.includes('raw_address'));
  assert.ok(model.hiddenMaterial.includes('provider_token'));
  assert.ok(model.hiddenMaterial.includes('carrier_credentials'));
  assert.ok(!serialized.includes('"rawAddress"'));
  assert.ok(!serialized.includes('"providerAccessToken"'));
  assert.ok(!serialized.includes('"proofWitness"'));
});

test('Veygrit separates Playlist Commerce, EC Social Login, and Delivery Gateway adoption', () => {
  const model = buildVeygritAppModel();
  const playlist = model.integrations.find(surface => surface.id === 'playlist_commerce');
  const ecLogin = model.integrations.find(surface => surface.id === 'ec_social_login');
  const delivery = model.integrations.find(surface => surface.id === 'delivery_gateway');

  assert.equal(model.store.discoverGenres.length, 32);
  assert.deepEqual(model.store.topics.map(topic => topic.label), ['New', 'Popular', 'Campaign', 'Nearby', "Editor's Picks"]);
  assert.ok(model.store.myStores.every(store => store.disconnectAction === 'wallet_side_revoke'));
  assert.equal(playlist?.startPoint, 'veygrit_app');
  assert.equal(playlist?.loginRequiredBeforeBrowse, false);
  assert.equal(playlist?.loginRequiredBeforeCheckout, false);
  assert.equal(playlist?.decisionRouteRef, '/veygrit#store');
  assert.equal(playlist?.primaryActionLabel, 'Open Store');
  assert.equal(playlist?.commerceEntryIcon, 'store');
  assert.match(playlist?.commerceEntryDescription ?? '', /without forcing an EC login/);
  assert.equal(ecLogin?.startPoint, 'ec_site');
  assert.equal(ecLogin?.loginRequiredBeforeCheckout, true);
  assert.equal(ecLogin?.decisionRouteRef, '/merchant-console#vey-id');
  assert.equal(ecLogin?.primaryActionLabel, 'Install Vey ID');
  assert.equal(ecLogin?.commerceEntryIcon, 'key');
  assert.match(ecLogin?.commerceEntryDescription ?? '', /Continue with Veygrit/);
  assert.equal(delivery?.installTarget, 'merchant_backend');
  assert.equal(delivery?.decisionRouteRef, '/merchant-console#delivery-gateway');
  assert.equal(delivery?.primaryActionLabel, 'Configure gateway');
  assert.equal(delivery?.commerceEntryIcon, 'truck');
  assert.match(delivery?.commerceEntryDescription ?? '', /carrier handoff refs/);
  assert.equal(delivery?.primaryValue, 'one_integration_for_multiple_carriers');
});

test('Veygrit guest checkout returns safe refs and blocks raw address persistence', () => {
  const model = buildVeygritAppModel();

  assert.deepEqual(validateVeygritAppModel(model), []);
  assert.equal(model.guestCheckout.enabled, true);
  assert.equal(model.guestCheckout.accountRequiredBeforeCheckout, false);
  assert.equal(model.guestCheckout.guestSessionRefRequired, true);
  assert.equal(model.guestCheckout.walletConsentRequiredBeforeAddressReuse, true);
  assert.deepEqual(model.guestCheckout.optionalUpgradeProviders, ['google', 'apple']);
  assert.ok(model.guestCheckout.allowedGuestActions.includes('browse_playlist_commerce'));
  assert.ok(model.guestCheckout.allowedGuestActions.includes('select_store'));
  assert.ok(model.guestCheckout.allowedGuestActions.includes('start_checkout'));
  assert.ok(model.guestCheckout.allowedGuestActions.includes('request_address_login'));
  assert.ok(model.guestCheckout.blockedGuestActions.includes('persist_raw_address'));
  assert.ok(model.guestCheckout.blockedGuestActions.includes('receive_provider_token'));
  assert.ok(model.guestCheckout.merchantReceives.includes('guestCheckoutRef'));
  assert.ok(model.guestCheckout.merchantReceives.includes('walletConsentRef'));
  assert.ok(model.guestCheckout.merchantReceives.includes('carrierHandoffRef'));
  assert.ok(model.guestCheckout.merchantNeverReceives.includes('raw_address'));
  assert.ok(model.guestCheckout.merchantNeverReceives.includes('provider_token'));
  assert.ok(model.guestCheckout.merchantNeverReceives.includes('proof_secret'));
});
