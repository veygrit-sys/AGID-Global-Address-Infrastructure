import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildPlaylistCommerceWebhookFixtures,
  signPlaylistCommerceWebhookPayload,
  validatePlaylistCommerceWebhookEnvelope,
  validatePlaylistCommerceWebhookFixtures,
  type PlaylistCommerceWebhookEnvelope,
} from './playlistCommerceWebhook';

const source = readFileSync(new URL('./playlistCommerceWebhook.ts', import.meta.url), 'utf8');

test('Playlist Commerce webhook fixtures cover the merchant event lifecycle', () => {
  const fixtures = buildPlaylistCommerceWebhookFixtures();
  const topics = fixtures.map(fixture => fixture.payload.topic);

  assert.deepEqual(topics, [
    'playlist.product_saved',
    'playlist.shared',
    'checkout.alias_created',
    'delivery.receipt_created',
    'analytics.aggregate_ready',
  ]);
  assert.deepEqual(validatePlaylistCommerceWebhookFixtures(fixtures), []);
});

test('webhook fixtures are signed and header-bound', () => {
  const fixture = buildPlaylistCommerceWebhookFixtures()[2];

  assert.equal(fixture.headers['x-playlist-event-id'], fixture.payload.eventId);
  assert.equal(fixture.headers['x-playlist-topic'], fixture.payload.topic);
  assert.equal(fixture.headers['x-playlist-timestamp'], fixture.payload.createdAt);
  assert.equal(fixture.headers['x-playlist-signature'], signPlaylistCommerceWebhookPayload(fixture.payload));
});

test('webhook signer stays browser-bundle safe while matching Node HMAC output', () => {
  const fixture = buildPlaylistCommerceWebhookFixtures()[0];
  const canonicalPayload = '{"createdAt":"2026-07-01T00:00:00.000Z","eventId":"evt_pc_saved_001","merchantRef":"merchant_demo","playlistRef":"pl_demo_new_life","productRef":"prod_demo_lamp","testVector":true,"topic":"playlist.product_saved"}';
  const expected = `sha256=${createHmac('sha256', 'key').update(canonicalPayload).digest('hex')}`;

  assert.doesNotMatch(source, /node:crypto/);
  assert.equal(signPlaylistCommerceWebhookPayload(fixture.payload, 'key'), expected);
});

test('webhook validation rejects tampered signatures', () => {
  const fixture: PlaylistCommerceWebhookEnvelope = structuredClone(buildPlaylistCommerceWebhookFixtures()[0]);
  fixture.payload.productRef = 'prod_tampered';

  const errors = validatePlaylistCommerceWebhookEnvelope(fixture);

  assert.ok(errors.includes('signature-mismatch'));
});

test('webhook validation rejects private address, proof, key, provider, carrier, travel, and social fields', () => {
  const fixture = structuredClone(buildPlaylistCommerceWebhookFixtures()[1]) as PlaylistCommerceWebhookEnvelope & {
    payload: PlaylistCommerceWebhookEnvelope['payload'] & {
      rawAddress?: string;
      proofWitness?: string;
      privateKey?: string;
      providerIdToken?: string;
      rawProviderProfile?: string;
      rawCarrierPayload?: { blockedSyntheticMarker: true };
      passportData?: string;
      socialGraphEdges?: string[];
    };
  };

  fixture.payload.rawAddress = 'blocked-test-value';
  fixture.payload.proofWitness = 'blocked-test-value';
  fixture.payload.privateKey = 'blocked-test-value';
  fixture.payload.providerIdToken = 'blocked-test-value';
  fixture.payload.rawProviderProfile = 'blocked-test-value';
  fixture.payload.rawCarrierPayload = { blockedSyntheticMarker: true };
  fixture.payload.passportData = 'blocked-test-value';
  fixture.payload.socialGraphEdges = ['blocked-test-value'];
  fixture.headers['x-playlist-signature'] = signPlaylistCommerceWebhookPayload(fixture.payload);

  const errors = validatePlaylistCommerceWebhookEnvelope(fixture);

  assert.ok(errors.includes('forbidden-field:$.rawAddress'));
  assert.ok(errors.includes('forbidden-field:$.proofWitness'));
  assert.ok(errors.includes('forbidden-field:$.privateKey'));
  assert.ok(errors.includes('forbidden-field:$.providerIdToken'));
  assert.ok(errors.includes('forbidden-field:$.rawProviderProfile'));
  assert.ok(errors.includes('forbidden-field:$.rawCarrierPayload'));
  assert.ok(errors.includes('forbidden-field:$.passportData'));
  assert.ok(errors.includes('forbidden-field:$.socialGraphEdges'));
});

test('checkout and delivery webhook topics require aliases and receipt references', () => {
  const checkout = structuredClone(buildPlaylistCommerceWebhookFixtures()[2]);
  delete checkout.payload.orderAlias;
  checkout.headers['x-playlist-signature'] = signPlaylistCommerceWebhookPayload(checkout.payload);

  const delivery = structuredClone(buildPlaylistCommerceWebhookFixtures()[3]);
  delete delivery.payload.receiptRef;
  delivery.headers['x-playlist-signature'] = signPlaylistCommerceWebhookPayload(delivery.payload);

  assert.ok(validatePlaylistCommerceWebhookEnvelope(checkout).includes('checkout-event-missing-order-alias'));
  assert.ok(validatePlaylistCommerceWebhookEnvelope(delivery).includes('delivery-event-missing-receipt-ref'));
});

test('analytics webhook exposes only aggregate data', () => {
  const analytics = buildPlaylistCommerceWebhookFixtures().find(
    fixture => fixture.payload.topic === 'analytics.aggregate_ready',
  )!;

  assert.equal(analytics.payload.aggregate?.metricId, 'playlist-save-count');
  assert.equal(analytics.payload.aggregate?.playlistCategory, 'travel-prep');
  assert.equal(validatePlaylistCommerceWebhookEnvelope(analytics).length, 0);
  assert.equal('subjectAlias' in analytics.payload, false);
  assert.equal('orderAlias' in analytics.payload, false);
});
