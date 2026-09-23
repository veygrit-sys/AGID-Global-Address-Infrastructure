import assert from 'node:assert/strict';
import test from 'node:test';

import {
  PLAYLIST_COMMERCE_SDK_METHODS,
  buildPlaylistCommerceDiscoveryHome,
  buildPlaylistCommerceSdkContract,
  buildPlaylistCommerceSdkQuickstart,
  createPlaylistCommerceSdkTestClient,
  validatePlaylistCommerceDiscoveryHome,
  validatePlaylistCommerceSdkContract,
} from './playlistCommerceSdk';

test('Playlist Commerce SDK contract validates against spec capabilities and APIs', () => {
  const contract = buildPlaylistCommerceSdkContract();

  assert.deepEqual(validatePlaylistCommerceSdkContract(contract), []);
  assert.equal(contract.version, 'playlist-commerce-sdk-v0.1');
  assert.ok(contract.capabilities.length >= 20);
  assert.ok(contract.apiSurfaces.length >= 10);
});

test('SDK exposes the minimum developer methods', () => {
  const ids = new Set(PLAYLIST_COMMERCE_SDK_METHODS.map(method => method.id));

  for (const id of [
    'createPlaylist',
    'saveProduct',
    'sharePlaylist',
    'searchProducts',
    'getRecommendations',
    'listHistory',
    'startCheckout',
    'verifyWebhook',
    'listCapabilities',
    'buildTestVectors',
  ] as const) {
    assert.ok(ids.has(id), `missing ${id}`);
  }
});

test('SDK methods are public-only and forbid private address or proof material', () => {
  const contract = buildPlaylistCommerceSdkContract();

  for (const method of contract.methods) {
    assert.equal(method.publicOnly, true);
    for (const forbidden of [
      'rawAddress',
      'recipientPhone',
      'privateKey',
      'proofWitness',
      'biometricTemplate',
      'passportData',
      'roomNumber',
    ]) {
      assert.ok(method.forbiddenInputs.includes(forbidden), `${method.id} missing ${forbidden}`);
    }
  }
});

test('SDK discovery home exposes Spotify-like search, recommendations, and history without private material', () => {
  const home = buildPlaylistCommerceDiscoveryHome('coffee setup');

  assert.deepEqual(validatePlaylistCommerceDiscoveryHome(home), []);
  assert.equal(home.visibleToUserWithoutCheckoutLogin, true);
  assert.equal(home.query, 'coffee setup');
  assert.ok(home.searchResults.length >= 3);
  assert.ok(home.recommendationShelves.length >= 2);
  assert.ok(home.history.length >= 3);
  assert.ok(home.recommendationShelves.some(shelf => /Because you saved/i.test(shelf.title)));
  assert.ok(home.history.some(item => item.eventType === 'searched'));
  assert.ok(home.history.every(item => item.eventRef.startsWith('hist_ref_')));
  assert.doesNotMatch(
    JSON.stringify(home),
    /rawAddressValue|recipientPhoneValue|proofWitnessValue|privateKeyValue|raw_address_value|recipient_phone_value/i,
  );
});

test('SDK test client serves discovery results, recommendation shelves, and resumable history', () => {
  const client = createPlaylistCommerceSdkTestClient();
  const discovery = client.buildDiscoveryHome('desk setup');

  assert.deepEqual(discovery.errors, []);
  assert.equal(discovery.home.query, 'desk setup');
  assert.ok(client.searchProducts('desk setup').length >= 3);
  assert.ok(client.getRecommendations().length >= 2);
  assert.ok(client.listHistory().length >= 3);
  assert.deepEqual(client.buildTestVectors().discoveryHome.errors, []);
});

test('SDK test client connects checkout request, response, and validation', () => {
  const client = createPlaylistCommerceSdkTestClient();
  const checkout = client.startCheckout('hotel_delivery');

  assert.deepEqual(checkout.errors, []);
  assert.equal(checkout.request.purpose, 'hotel_delivery');
  assert.equal(checkout.request.disclosureMode, 'travel_hotel_alias');
  assert.equal(checkout.response.nextAction, 'carrier_handoff');
  assert.ok(checkout.response.hiddenFromMerchant.includes('room_number'));
  assert.ok(checkout.response.hiddenFromMerchant.includes('passport_data'));
});

test('SDK test vectors include signed webhooks and no-address checkout fixture', () => {
  const client = createPlaylistCommerceSdkTestClient();
  const vectors = client.buildTestVectors();

  assert.deepEqual(vectors.checkout.errors, []);
  assert.ok(vectors.webhooks.length >= 5);
  assert.ok(vectors.webhooks.every(webhook => client.verifyWebhook(webhook).length === 0));
});

test('SDK contract preserves non-claims and required webhook topics', () => {
  const contract = buildPlaylistCommerceSdkContract();

  assert.ok(contract.nonClaims.includes('not-full-marketplace'));
  assert.ok(contract.nonClaims.includes('not-payment-processor'));
  assert.ok(contract.nonClaims.includes('not-raw-address-store'));
  assert.deepEqual(contract.requiredWebhookTopics, ['checkout.alias_created', 'delivery.receipt_created']);
});

test('SDK quickstart is developer-facing and privacy-safe', () => {
  const quickstart = buildPlaylistCommerceSdkQuickstart();

  assert.equal(quickstart.version, 'playlist-commerce-sdk-v0.1');
  assert.match(quickstart.install, /npm install/);
  assert.deepEqual(quickstart.steps.map(step => step.id), [
    'create-client',
    'save-product',
    'browse-discovery',
    'start-checkout',
    'verify-webhook',
  ]);
  assert.ok(quickstart.steps.some(step => step.safeNotes.some(note => /Never pass raw address/i.test(note))));
});
