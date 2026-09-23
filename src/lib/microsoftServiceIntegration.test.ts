import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildMicrosoftIntegrationPlan,
  getMicrosoftServiceProfile,
  listMicrosoftServiceProfiles,
} from './microsoftServiceIntegration';

test('lists Microsoft service profiles needed by AGID/AOID integrations', () => {
  const ids = listMicrosoftServiceProfiles().map(profile => profile.id);

  assert.ok(ids.includes('microsoft-entra-id'));
  assert.ok(ids.includes('microsoft-entra-external-id'));
  assert.ok(ids.includes('microsoft-entra-verified-id'));
  assert.ok(ids.includes('microsoft-graph'));
  assert.ok(ids.includes('microsoft-teams'));
  assert.ok(ids.includes('sharepoint-onedrive'));
  assert.ok(ids.includes('azure-maps'));
  assert.ok(ids.includes('azure-ai-document-intelligence'));
  assert.ok(ids.includes('azure-key-vault'));
  assert.ok(ids.includes('azure-iot-hub'));
  assert.ok(ids.includes('azure-event-grid'));
  assert.ok(ids.includes('azure-communication-services'));
  assert.ok(ids.includes('azure-confidential-ledger'));
  assert.ok(ids.includes('microsoft-sentinel'));
  assert.ok(ids.includes('microsoft-defender-for-cloud'));
  assert.ok(ids.includes('azure-api-management'));
  assert.ok(ids.includes('azure-service-bus'));
  assert.ok(ids.includes('azure-sql-database'));
  assert.ok(ids.includes('azure-cosmos-db'));
  assert.ok(ids.includes('microsoft-fabric-power-bi'));
  assert.ok(ids.includes('dynamics-365-dataverse'));
  assert.equal(getMicrosoftServiceProfile(' AZURE-MAPS ')?.family, 'azure-location');
});

test('allows Teams operator alerts only as redacted event metadata', () => {
  const plan = buildMicrosoftIntegrationPlan({
    serviceId: 'microsoft-teams',
    purpose: 'teams-operator-alert',
    payloadClass: 'event-metadata',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.dataFlow.sendsPlaintextAddressToMicrosoft, false);
  assert.equal(plan.dataFlow.storesRawAddressInMicrosoft, false);
  assert.equal(plan.dataFlow.clientSecretAllowedInBrowser, false);
  assert.ok(plan.requiredControls.includes('send-only-commitments-aliases-or-redacted-summaries'));
});

test('blocks raw address notifications through Teams', () => {
  const plan = buildMicrosoftIntegrationPlan({
    serviceId: 'microsoft-teams',
    purpose: 'teams-operator-alert',
    payloadClass: 'plaintext-address',
    ownerConsent: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, false);
  assert.ok(plan.errors.includes('plaintext-payload-not-allowed-for-service'));
});

test('requires consent, TLS, and a server-side proxy for Azure Maps plaintext geocoding', () => {
  const blocked = buildMicrosoftIntegrationPlan({
    serviceId: 'azure-maps',
    purpose: 'azure-maps-geocode',
    payloadClass: 'plaintext-address',
  });

  assert.equal(blocked.allowed, false);
  assert.ok(blocked.errors.includes('owner-consent-required-for-plaintext-microsoft-processing'));
  assert.ok(blocked.errors.includes('encrypted-in-transit-required-for-plaintext-microsoft-processing'));
  assert.ok(blocked.errors.includes('server-side-proxy-required-for-plaintext-microsoft-processing'));

  const allowed = buildMicrosoftIntegrationPlan({
    serviceId: 'azure-maps',
    purpose: 'azure-maps-geocode',
    payloadClass: 'plaintext-address',
    ownerConsent: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(allowed.allowed, true);
  assert.equal(allowed.dataFlow.sendsPlaintextAddressToMicrosoft, true);
  assert.equal(allowed.dataFlow.storesRawAddressInMicrosoft, false);
  assert.ok(allowed.requiredControls.includes('ephemeral-request-no-provider-cache-assumption'));
});

test('keeps Document Intelligence server-side and warns in high-risk mode', () => {
  const plan = buildMicrosoftIntegrationPlan({
    serviceId: 'azure-ai-document-intelligence',
    purpose: 'document-ocr-address-import',
    payloadClass: 'document-image-or-pdf',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
    highRiskMode: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.dataFlow.sendsPlaintextAddressToMicrosoft, true);
  assert.equal(plan.dataFlow.highRiskModeCompatible, false);
  assert.ok(plan.warnings.includes('high-risk-mode-prefers-local-ocr-local-geocoding-or-agid-s-over-microsoft-plaintext-processing'));
});

test('requires encrypted envelopes for SharePoint evidence storage', () => {
  const plaintext = buildMicrosoftIntegrationPlan({
    serviceId: 'sharepoint-onedrive',
    purpose: 'sharepoint-evidence-vault',
    payloadClass: 'plaintext-address',
    ownerConsent: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plaintext.allowed, false);
  assert.ok(plaintext.errors.includes('plaintext-payload-not-allowed-for-service'));

  const encrypted = buildMicrosoftIntegrationPlan({
    serviceId: 'sharepoint-onedrive',
    purpose: 'sharepoint-evidence-vault',
    payloadClass: 'encrypted-aoid-envelope',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(encrypted.allowed, true);
  assert.equal(encrypted.dataFlow.sendsPlaintextAddressToMicrosoft, false);
  assert.ok(encrypted.requiredControls.includes('owner-device-encryption-before-upload'));
});

test('uses Key Vault for secret references without accepting raw secret values', () => {
  const plan = buildMicrosoftIntegrationPlan({
    serviceId: 'azure-key-vault',
    purpose: 'key-vault-secret-reference',
    payloadClass: 'secret-reference',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.dataFlow.clientSecretAllowedInBrowser, false);
  assert.ok(plan.requiredEnvVars.includes('AZURE_KEY_VAULT_URI'));
  assert.ok(plan.requiredControls.includes('store-secret-reference-not-secret-value'));
});

test('uses Entra External ID for scoped external access without address claims', () => {
  const plan = buildMicrosoftIntegrationPlan({
    serviceId: 'microsoft-entra-external-id',
    purpose: 'external-user-access',
    payloadClass: 'organization-record',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.dataFlow.sendsPlaintextAddressToMicrosoft, false);
  assert.ok(plan.requiredControls.includes('scope-based-address-access-policy'));
  assert.ok(plan.requiredControls.includes('no-address-claims-in-id-token'));
});

test('uses Entra Verified ID for credential status, not raw address storage', () => {
  const allowed = buildMicrosoftIntegrationPlan({
    serviceId: 'microsoft-entra-verified-id',
    purpose: 'address-credential-vc',
    payloadClass: 'verified-credential-status',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(allowed.allowed, true);
  assert.equal(allowed.dataFlow.storesRawAddressInMicrosoft, false);
  assert.ok(allowed.requiredControls.includes('credential-status-without-raw-address'));
  assert.ok(allowed.requiredControls.includes('issuer-trust-and-revocation-check'));

  const plaintext = buildMicrosoftIntegrationPlan({
    serviceId: 'microsoft-entra-verified-id',
    purpose: 'address-credential-vc',
    payloadClass: 'plaintext-address',
    ownerConsent: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plaintext.allowed, false);
  assert.ok(plaintext.errors.includes('plaintext-payload-not-allowed-for-service'));
});

test('uses Azure IoT Hub for terminal telemetry only after redaction', () => {
  const plan = buildMicrosoftIntegrationPlan({
    serviceId: 'azure-iot-hub',
    purpose: 'pos-device-health',
    payloadClass: 'device-telemetry',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.dataFlow.sendsPlaintextAddressToMicrosoft, false);
  assert.ok(plan.requiredControls.includes('per-device-identity-and-key-rotation'));
  assert.ok(plan.requiredControls.includes('device-telemetry-redaction'));

  const misplaced = buildMicrosoftIntegrationPlan({
    serviceId: 'microsoft-teams',
    purpose: 'teams-operator-alert',
    payloadClass: 'device-telemetry',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(misplaced.allowed, false);
  assert.ok(misplaced.errors.includes('device-telemetry-payload-requires-azure-iot-hub'));
});

test('keeps Azure Communication Services notifications address-free', () => {
  const allowed = buildMicrosoftIntegrationPlan({
    serviceId: 'azure-communication-services',
    purpose: 'sms-email-voice-notification',
    payloadClass: 'event-metadata',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(allowed.allowed, true);
  assert.ok(allowed.requiredControls.includes('no-address-in-notification-body'));
  assert.ok(allowed.requiredControls.includes('short-lived-action-link-or-alias'));

  const plaintext = buildMicrosoftIntegrationPlan({
    serviceId: 'azure-communication-services',
    purpose: 'sms-email-voice-notification',
    payloadClass: 'plaintext-address',
    ownerConsent: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plaintext.allowed, false);
  assert.ok(plaintext.errors.includes('plaintext-payload-not-allowed-for-service'));
});

test('uses Confidential Ledger as a digest-only audit anchor', () => {
  const plan = buildMicrosoftIntegrationPlan({
    serviceId: 'azure-confidential-ledger',
    purpose: 'confidential-audit-ledger',
    payloadClass: 'audit-digest',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, true);
  assert.ok(plan.requiredControls.includes('append-only-digest-or-root-only'));
  assert.ok(plan.requiredControls.includes('ledger-receipt-verification'));

  const plaintext = buildMicrosoftIntegrationPlan({
    serviceId: 'azure-confidential-ledger',
    purpose: 'confidential-audit-ledger',
    payloadClass: 'plaintext-address',
    ownerConsent: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plaintext.allowed, false);
  assert.ok(plaintext.errors.includes('plaintext-payload-not-allowed-for-service'));
});

test('routes security alerts, API gateway controls, and analytics aggregates to the right services', () => {
  const sentinel = buildMicrosoftIntegrationPlan({
    serviceId: 'microsoft-sentinel',
    purpose: 'security-threat-detection',
    payloadClass: 'security-alert',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(sentinel.allowed, true);
  assert.ok(sentinel.requiredControls.includes('security-telemetry-redaction'));

  const apim = buildMicrosoftIntegrationPlan({
    serviceId: 'azure-api-management',
    purpose: 'api-gateway-rate-limit',
    payloadClass: 'event-metadata',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(apim.allowed, true);
  assert.ok(apim.requiredControls.includes('rate-limit-and-abuse-control-policy'));
  assert.ok(apim.requiredControls.includes('request-response-body-log-redaction'));

  const analytics = buildMicrosoftIntegrationPlan({
    serviceId: 'microsoft-fabric-power-bi',
    purpose: 'analytics-dashboard',
    payloadClass: 'analytics-aggregate',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(analytics.allowed, true);
  assert.ok(analytics.requiredControls.includes('aggregate-or-bucketed-analytics-only'));
  assert.ok(analytics.requiredControls.includes('no-household-level-export'));

  const misplacedAnalytics = buildMicrosoftIntegrationPlan({
    serviceId: 'azure-event-grid',
    purpose: 'webhook-event-dispatch',
    payloadClass: 'analytics-aggregate',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(misplacedAnalytics.allowed, false);
  assert.ok(misplacedAnalytics.errors.includes('analytics-aggregate-requires-analytics-service'));
});

test('rejects unsupported service-purpose combinations', () => {
  const plan = buildMicrosoftIntegrationPlan({
    serviceId: 'azure-service-bus',
    purpose: 'azure-maps-geocode',
    payloadClass: 'event-metadata',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, false);
  assert.ok(plan.errors.includes('service-purpose-not-supported'));
});
