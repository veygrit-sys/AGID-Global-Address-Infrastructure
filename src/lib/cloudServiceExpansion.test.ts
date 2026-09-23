import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildExtendedCloudIntegrationPlan,
  getExtendedCloudServiceProfile,
  listExtendedCloudProviders,
  listExtendedCloudServiceProfiles,
} from './cloudServiceExpansion';

test('lists additional cloud, edge, PaaS, and analytics provider profiles', () => {
  const providers = listExtendedCloudProviders();
  const ids = listExtendedCloudServiceProfiles().map(profile => profile.id);

  for (const provider of [
    'cloudflare',
    'oci',
    'alibaba-cloud',
    'tencent-cloud',
    'huawei-cloud',
    'ibm-cloud',
    'digitalocean',
    'vercel',
    'supabase',
    'mongodb-atlas',
    'snowflake',
    'databricks',
  ]) {
    assert.ok(providers.some(value => value === provider), `missing provider ${provider}`);
  }

  for (const id of [
    'cloudflare-workers',
    'cloudflare-r2',
    'oci-object-storage',
    'alibaba-cloud-oss',
    'tencent-cloud-scf-cloudbase',
    'ibm-key-protect',
    'vercel-blob',
    'supabase-postgres-auth-storage',
    'mongodb-atlas',
    'snowflake',
    'databricks',
  ]) {
    assert.ok(ids.some(value => value === id), `missing service ${id}`);
  }

  assert.equal(getExtendedCloudServiceProfile(' CLOUDFLARE-R2 ')?.provider, 'cloudflare');
  assert.equal(getExtendedCloudServiceProfile(' SNOWFLAKE ')?.defaultPrivacyMode, 'aggregate-only');
});

test('blocks raw plaintext address or document payloads for every extended cloud service', () => {
  for (const service of listExtendedCloudServiceProfiles()) {
    const plan = buildExtendedCloudIntegrationPlan({
      serviceId: service.id,
      purpose: service.purposes[0],
      payloadClass: 'plaintext-address',
      ownerConsent: true,
      encryptedAtRest: true,
      encryptedInTransit: true,
      serverSideOnly: true,
    });

    assert.equal(plan.allowed, false, `${service.id} must reject plaintext addresses`);
    assert.ok(plan.errors.includes('raw-payload-not-supported-by-extended-cloud-catalog'));
    assert.equal(plan.dataFlow.sendsPlaintextAddressToProvider, false);
    assert.equal(plan.dataFlow.storesRawAddressInProvider, false);
  }
});

test('allows encrypted AOID evidence envelopes only after consent and encryption gates pass', () => {
  const denied = buildExtendedCloudIntegrationPlan({
    serviceId: 'cloudflare-r2',
    purpose: 'encrypted-evidence-object',
    payloadClass: 'encrypted-aoid-envelope',
  });

  assert.equal(denied.allowed, false);
  assert.ok(denied.errors.includes('owner-consent-required-for-encrypted-extended-cloud-sync'));
  assert.ok(denied.errors.includes('encrypted-at-rest-required-for-encrypted-extended-cloud-sync'));
  assert.ok(denied.errors.includes('encrypted-in-transit-required-for-encrypted-extended-cloud-sync'));

  const allowed = buildExtendedCloudIntegrationPlan({
    serviceId: 'cloudflare-r2',
    purpose: 'encrypted-evidence-object',
    payloadClass: 'encrypted-aoid-envelope',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(allowed.allowed, true);
  assert.ok(allowed.requiredControls.includes('owner-device-or-server-side-envelope-encryption-before-upload'));
  assert.ok(allowed.requiredControls.includes('object-key-must-not-contain-raw-address'));
  assert.equal(allowed.dataFlow.sendsDocumentImageOrPdfToProvider, false);
});

test('allows public edge resolver use without private cloud sync', () => {
  const plan = buildExtendedCloudIntegrationPlan({
    serviceId: 'cloudflare-workers',
    purpose: 'edge-resolver',
    payloadClass: 'public-agid-reference',
  });

  assert.equal(plan.allowed, true);
  assert.ok(plan.requiredControls.includes('public-or-redacted-edge-data-only'));
  assert.ok(plan.requiredControls.includes('edge-log-redaction-before-emit'));
  assert.equal(plan.dataFlow.serverSideOnlyRequired, false);
});

test('requires regional residency review for private payloads on regional cloud providers', () => {
  const plan = buildExtendedCloudIntegrationPlan({
    serviceId: 'alibaba-cloud-oss',
    purpose: 'encrypted-evidence-object',
    payloadClass: 'encrypted-aoid-envelope',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, true);
  assert.ok(plan.warnings.includes('regional-data-residency-review-required:alibaba-cloud'));
});

test('keeps secret references in secret management services', () => {
  const keyProtect = buildExtendedCloudIntegrationPlan({
    serviceId: 'ibm-key-protect',
    purpose: 'secret-reference',
    payloadClass: 'secret-reference',
    serverSideOnly: true,
  });

  assert.equal(keyProtect.allowed, true);
  assert.ok(keyProtect.requiredControls.includes('store-secret-reference-not-secret-value'));
  assert.doesNotMatch(keyProtect.warnings.join(' '), /best-handled-by-secret-management/);

  const blob = buildExtendedCloudIntegrationPlan({
    serviceId: 'vercel-blob',
    purpose: 'encrypted-evidence-object',
    payloadClass: 'secret-reference',
    serverSideOnly: true,
  });

  assert.equal(blob.allowed, false);
  assert.ok(blob.errors.includes('payload-not-allowed-for-service-privacy-mode'));
  assert.ok(blob.warnings.includes('secret-reference-is-best-handled-by-secret-management-service'));
});

test('keeps analytics and lakehouse providers aggregate-only', () => {
  const snowflake = buildExtendedCloudIntegrationPlan({
    serviceId: 'snowflake',
    purpose: 'analytics-aggregate',
    payloadClass: 'analytics-aggregate',
    serverSideOnly: true,
  });

  assert.equal(snowflake.allowed, true);
  assert.ok(snowflake.requiredControls.includes('aggregate-or-differentially-private-export-only'));

  const mongodb = buildExtendedCloudIntegrationPlan({
    serviceId: 'mongodb-atlas',
    purpose: 'analytics-aggregate',
    payloadClass: 'analytics-aggregate',
    serverSideOnly: true,
  });

  assert.equal(mongodb.allowed, false);
  assert.ok(mongodb.errors.includes('service-purpose-not-supported'));
  assert.ok(mongodb.errors.includes('analytics-aggregate-requires-analytics-or-lakehouse-service'));
});

test('adds stronger warnings and controls in high-risk mode', () => {
  const plan = buildExtendedCloudIntegrationPlan({
    serviceId: 'supabase-postgres-auth-storage',
    purpose: 'metadata-ledger',
    payloadClass: 'address-commitment',
    serverSideOnly: true,
    highRiskMode: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.dataFlow.highRiskModeCompatible, false);
  assert.ok(plan.requiredControls.includes('high-risk-mode-no-precise-address-retention'));
  assert.ok(plan.requiredControls.includes('prefer-local-or-self-hosted-path-before-extra-cloud'));
  assert.ok(plan.warnings.includes('high-risk-mode-prefers-local-self-hosted-or-agid-s'));
});
