import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_NOTIFICATION_VERSION,
  buildAddressNotification,
  listAddressNotificationTemplates,
  validateAddressNotificationPlan,
} from './addressNotification';

const createdAt = '2026-06-17T00:00:00.000Z';

test('builds a safe SMS recipient-confirmation notification with alias-only action', () => {
  const plan = buildAddressNotification({
    event: 'recipient-confirmation-required',
    channel: 'sms',
    locale: 'en',
    actionAlias: 'alias:handoff:123',
    destination: {
      alias: 'recipient-channel:masked',
      rawDestination: '+1 555 010 0100',
    },
    createdAt,
  });

  assert.equal(plan.modelVersion, ADDRESS_NOTIFICATION_VERSION);
  assert.equal(plan.status, 'ready');
  assert.equal(plan.providerFamily, 'twilio-messaging-like');
  assert.equal(plan.action?.alias, 'alias:handoff:123');
  assert.equal(plan.destinationAlias, 'recipient-channel:masked');
  assert.equal(plan.privacy.addressInBody, false);
  assert.equal(plan.privacy.rawDestinationStored, false);
  assert.doesNotMatch(plan.body, /555|address|AGID|AOID/i);
  assert.ok(plan.warnings.includes('address-notification-raw-destination-is-transient-provider-boundary-only'));
  assert.equal(validateAddressNotificationPlan(plan).ok, true);
});

test('routes email notifications through the SendGrid-like provider profile', () => {
  const plan = buildAddressNotification({
    event: 'delivery-qr-expired',
    channel: 'email',
    locale: 'ja',
    actionAlias: 'alias:qr-refresh:tokyo',
    shortLink: 'https://notify.example/a/qr-refresh',
    destination: { alias: 'email-ref:masked' },
    createdAt,
  });

  assert.equal(plan.status, 'ready');
  assert.equal(plan.providerFamily, 'sendgrid-email-like');
  assert.equal(plan.locale, 'ja');
  assert.match(plan.title, /配送QR/);
  assert.equal(plan.action?.shortLink, 'https://notify.example/a/qr-refresh');
  assert.equal(validateAddressNotificationPlan(plan).ok, true);
});

test('rejects unsafe body overrides that contain raw address, coordinates, or contact data', () => {
  const plan = buildAddressNotification({
    event: 'manual-review-required',
    channel: 'email',
    actionAlias: 'alias:review:1',
    unsafeBodyOverride: 'Go to room 301 at 35.681236, 139.767125 and call +81 90 1234 5678.',
    destination: { alias: 'reviewer:masked' },
    createdAt,
  });

  assert.equal(plan.status, 'rejected');
  assert.ok(plan.errors.includes('address-notification-message-contains-private-material'));
  assert.equal(validateAddressNotificationPlan(plan).ok, false);
});

test('rejects metadata that includes private address material while keeping only a commitment', () => {
  const plan = buildAddressNotification({
    event: 'reverification-required',
    channel: 'push',
    actionAlias: 'alias:reverify:1',
    metadata: {
      rawAddress: '1 Private Street',
      aoid: 'AOID-PRIVATE',
    },
    destination: { alias: 'device:masked' },
    createdAt,
  });

  assert.equal(plan.status, 'rejected');
  assert.ok(plan.errors.includes('address-notification-metadata-contains-private-material'));
  assert.ok(plan.metadataCommitment);
  assert.doesNotMatch(JSON.stringify(plan), /1 Private Street|AOID-PRIVATE/);
});

test('high-risk notifications clamp expiry and may require review on email', () => {
  const plan = buildAddressNotification({
    event: 'aid-eligibility-review',
    channel: 'email',
    locale: 'en',
    highRiskMode: true,
    actionAlias: 'alias:aid:review',
    expiresAt: '2026-06-17T01:00:00.000Z',
    createdAt,
  });

  assert.equal(plan.status, 'review');
  assert.equal(plan.expiresAt, '2026-06-17T00:05:00.000Z');
  assert.ok(plan.requiredControls.includes('high-risk-short-ttl'));
  assert.ok(plan.warnings.includes('address-notification-expiry-clamped-to-privacy-ttl'));
});

test('actionable events require an alias or short-lived link', () => {
  const rejected = buildAddressNotification({
    event: 'delivery-qr-expiring',
    channel: 'in-app',
    destination: { alias: 'operator:masked' },
    createdAt,
  });

  assert.equal(rejected.status, 'rejected');
  assert.ok(rejected.errors.includes('address-notification-action-alias-required'));

  const ready = buildAddressNotification({
    event: 'handoff-complete',
    channel: 'in-app',
    destination: { alias: 'operator:masked' },
    createdAt,
  });

  assert.equal(ready.status, 'ready');
  assert.equal(ready.action, null);
});

test('voice and whatsapp channels use provider-specific safety notes', () => {
  const voice = buildAddressNotification({
    event: 'agid-s-key-rotation',
    channel: 'voice',
    actionAlias: 'alias:key-rotation',
    createdAt,
  });
  const whatsapp = buildAddressNotification({
    event: 'return-label-ready',
    channel: 'whatsapp',
    actionAlias: 'alias:return-label',
    createdAt,
  });

  assert.equal(voice.providerFamily, 'twilio-voice-like');
  assert.ok(voice.warnings.includes('voice-notifications-should-use-short-neutral-prompts'));
  assert.equal(whatsapp.providerFamily, 'twilio-messaging-like');
  assert.ok(whatsapp.warnings.includes('whatsapp-style-notifications-should-use-approved-templates'));
});

test('raw destination cannot be persisted and templates are enumerable', () => {
  const plan = buildAddressNotification({
    event: 'address-link-granted',
    channel: 'email',
    destination: {
      alias: 'user:masked',
      rawDestination: 'user@example.com',
      persistRawDestination: true,
    },
    createdAt,
  });

  assert.equal(plan.status, 'rejected');
  assert.ok(plan.errors.includes('address-notification-must-not-persist-raw-destination'));
  assert.doesNotMatch(JSON.stringify(plan), /user@example.com/);

  const templates = listAddressNotificationTemplates();
  assert.ok(templates.some(template => template.event === 'credential-revoked'));
});
