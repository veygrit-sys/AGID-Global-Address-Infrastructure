import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildGoogleIntegrationPlan,
  getGoogleServiceProfile,
  listGoogleServiceProfiles,
} from './googleServiceIntegration';

test('lists Google service profiles needed by AGID/AOID integrations', () => {
  const ids = listGoogleServiceProfiles().map(profile => profile.id);

  assert.ok(ids.includes('google-identity-platform'));
  assert.ok(ids.includes('google-gmail-api'));
  assert.ok(ids.includes('google-drive-api'));
  assert.ok(ids.includes('google-calendar-api'));
  assert.ok(ids.includes('google-chat-api'));
  assert.ok(ids.includes('google-maps-address-validation'));
  assert.ok(ids.includes('google-maps-geocoding'));
  assert.ok(ids.includes('google-maps-places'));
  assert.ok(ids.includes('google-maps-routes'));
  assert.ok(ids.includes('google-cloud-document-ai'));
  assert.ok(ids.includes('google-cloud-kms'));
  assert.ok(ids.includes('google-cloud-storage'));
  assert.ok(ids.includes('google-pubsub'));
  assert.ok(ids.includes('google-cloud-run'));
  assert.ok(ids.includes('google-firestore'));
  assert.ok(ids.includes('google-bigquery'));
  assert.ok(ids.includes('firebase-cloud-messaging'));
  assert.equal(getGoogleServiceProfile(' GOOGLE-MAPS-GEOCODING ')?.family, 'maps-platform');
});

test('requires consent, TLS, and server-side proxy for Google Address Validation plaintext calls', () => {
  const blocked = buildGoogleIntegrationPlan({
    serviceId: 'google-maps-address-validation',
    purpose: 'address-validation',
    payloadClass: 'plaintext-address',
  });

  assert.equal(blocked.allowed, false);
  assert.ok(blocked.errors.includes('owner-consent-required-for-google-plaintext-processing'));
  assert.ok(blocked.errors.includes('encrypted-in-transit-required-for-google-plaintext-processing'));
  assert.ok(blocked.errors.includes('server-side-proxy-required-for-google-plaintext-processing'));

  const allowed = buildGoogleIntegrationPlan({
    serviceId: 'google-maps-address-validation',
    purpose: 'address-validation',
    payloadClass: 'plaintext-address',
    ownerConsent: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(allowed.allowed, true);
  assert.equal(allowed.dataFlow.sendsPlaintextAddressToGoogle, true);
  assert.equal(allowed.dataFlow.storesRawAddressInGoogle, false);
  assert.ok(allowed.requiredControls.includes('ephemeral-provider-request-no-canonical-storage'));
});

test('blocks raw address notifications through Gmail and Chat', () => {
  const gmail = buildGoogleIntegrationPlan({
    serviceId: 'google-gmail-api',
    purpose: 'gmail-redacted-notification',
    payloadClass: 'plaintext-address',
    ownerConsent: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  const chat = buildGoogleIntegrationPlan({
    serviceId: 'google-chat-api',
    purpose: 'chat-operator-alert',
    payloadClass: 'plaintext-address',
    ownerConsent: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(gmail.allowed, false);
  assert.equal(chat.allowed, false);
  assert.ok(gmail.errors.includes('plaintext-payload-not-allowed-for-service'));
  assert.ok(chat.errors.includes('plaintext-payload-not-allowed-for-service'));
});

test('allows Firebase push only with redacted event metadata', () => {
  const plan = buildGoogleIntegrationPlan({
    serviceId: 'firebase-cloud-messaging',
    purpose: 'push-notification',
    payloadClass: 'event-metadata',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.dataFlow.sendsPlaintextAddressToGoogle, false);
  assert.equal(plan.dataFlow.clientSecretAllowedInBrowser, false);
  assert.ok(plan.requiredControls.includes('send-only-commitments-aliases-or-redacted-summaries'));
});

test('requires encrypted envelopes for Drive or Cloud Storage evidence vaults', () => {
  const plaintextDrive = buildGoogleIntegrationPlan({
    serviceId: 'google-drive-api',
    purpose: 'drive-evidence-vault',
    payloadClass: 'document-image-or-pdf',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plaintextDrive.allowed, false);
  assert.ok(plaintextDrive.errors.includes('plaintext-payload-not-allowed-for-service'));

  const encryptedStorage = buildGoogleIntegrationPlan({
    serviceId: 'google-cloud-storage',
    purpose: 'encrypted-evidence-object',
    payloadClass: 'encrypted-aoid-envelope',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(encryptedStorage.allowed, true);
  assert.equal(encryptedStorage.dataFlow.sendsPlaintextAddressToGoogle, false);
  assert.ok(encryptedStorage.requiredControls.includes('owner-device-or-server-side-envelope-encryption-before-upload'));
});

test('allows Document AI OCR only with document controls and warns in high-risk mode', () => {
  const plan = buildGoogleIntegrationPlan({
    serviceId: 'google-cloud-document-ai',
    purpose: 'document-ocr-address-import',
    payloadClass: 'document-image-or-pdf',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
    highRiskMode: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.dataFlow.sendsDocumentImageOrPdfToGoogle, true);
  assert.equal(plan.dataFlow.highRiskModeCompatible, false);
  assert.ok(plan.warnings.includes('high-risk-mode-prefers-local-ocr-local-geocoding-or-agid-s-over-google-plaintext-processing'));
});

test('keeps route waypoints and place queries scoped to the correct Maps services', () => {
  const routes = buildGoogleIntegrationPlan({
    serviceId: 'google-maps-routes',
    purpose: 'route-eta',
    payloadClass: 'route-waypoint-addresses',
    ownerConsent: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  const wrongService = buildGoogleIntegrationPlan({
    serviceId: 'google-maps-geocoding',
    purpose: 'geocode',
    payloadClass: 'route-waypoint-addresses',
    ownerConsent: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(routes.allowed, true);
  assert.equal(wrongService.allowed, false);
  assert.ok(wrongService.errors.includes('route-waypoint-payload-requires-google-routes'));
});

test('allows KMS and Secret Manager as reference-only secret services', () => {
  const kms = buildGoogleIntegrationPlan({
    serviceId: 'google-cloud-kms',
    purpose: 'kms-key-reference',
    payloadClass: 'secret-reference',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  const secretManager = buildGoogleIntegrationPlan({
    serviceId: 'google-secret-manager',
    purpose: 'secret-reference',
    payloadClass: 'secret-reference',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(kms.allowed, true);
  assert.equal(secretManager.allowed, true);
  assert.ok(kms.requiredControls.includes('store-secret-reference-not-secret-value'));
  assert.ok(secretManager.requiredControls.includes('store-secret-reference-not-secret-value'));
});

test('rejects unsupported service-purpose combinations', () => {
  const plan = buildGoogleIntegrationPlan({
    serviceId: 'google-pubsub',
    purpose: 'geocode',
    payloadClass: 'event-metadata',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, false);
  assert.ok(plan.errors.includes('service-purpose-not-supported'));
});
