import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAdobeIntegrationPlan,
  getAdobeServiceProfile,
  listAdobeServiceProfiles,
} from './adobeServiceIntegration';

test('lists Adobe service profiles useful for AGID/AOID integration', () => {
  const ids = listAdobeServiceProfiles().map(profile => profile.id);

  assert.ok(ids.includes('adobe-pdf-services-api'));
  assert.ok(ids.includes('adobe-pdf-extract-api'));
  assert.ok(ids.includes('adobe-pdf-embed-api'));
  assert.ok(ids.includes('acrobat-sign-api'));
  assert.ok(ids.includes('adobe-commerce-api'));
  assert.ok(ids.includes('adobe-experience-manager-api'));
  assert.ok(ids.includes('adobe-experience-platform-api'));
  assert.ok(ids.includes('adobe-express-embed-sdk'));
  assert.ok(ids.includes('creative-cloud-libraries-api'));
  assert.equal(getAdobeServiceProfile(' ADOBE-COMMERCE-API ')?.family, 'commerce');
});

test('allows Adobe Commerce checkout with order aliases and commitments', () => {
  const plan = buildAdobeIntegrationPlan({
    serviceId: 'adobe-commerce-api',
    purpose: 'commerce-checkout-address-element',
    payloadClass: 'commerce-order-alias',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.dataFlow.sendsRawAddressDocumentToAdobe, false);
  assert.equal(plan.dataFlow.storesRawAddressInAdobe, false);
  assert.ok(plan.requiredControls.includes('send-only-commitments-order-aliases-or-redacted-summaries'));
});

test('blocks raw PDFs in Adobe Commerce order attributes', () => {
  const plan = buildAdobeIntegrationPlan({
    serviceId: 'adobe-commerce-api',
    purpose: 'commerce-order-handoff',
    payloadClass: 'pdf-document',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, false);
  assert.ok(plan.errors.includes('raw-document-payload-not-allowed-for-service'));
  assert.ok(plan.errors.includes('raw-pdf-or-image-requires-pdf-services-or-extract-api'));
});

test('requires consent, TLS, encrypted rest, and server-side proxy for PDF Extract address import', () => {
  const blocked = buildAdobeIntegrationPlan({
    serviceId: 'adobe-pdf-extract-api',
    purpose: 'pdf-extract-address-import',
    payloadClass: 'pdf-document',
  });

  assert.equal(blocked.allowed, false);
  assert.ok(blocked.errors.includes('owner-consent-required-for-adobe-document-processing'));
  assert.ok(blocked.errors.includes('encrypted-in-transit-required-for-adobe-document-processing'));
  assert.ok(blocked.errors.includes('server-side-proxy-required-for-adobe-document-processing'));
  assert.ok(blocked.errors.includes('encrypted-at-rest-required-for-adobe-document-processing'));

  const allowed = buildAdobeIntegrationPlan({
    serviceId: 'adobe-pdf-extract-api',
    purpose: 'pdf-extract-address-import',
    payloadClass: 'pdf-document',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(allowed.allowed, true);
  assert.equal(allowed.dataFlow.sendsRawAddressDocumentToAdobe, true);
  assert.equal(allowed.dataFlow.storesRawAddressInAdobe, false);
  assert.ok(allowed.requiredControls.includes('temporary-document-retention-policy'));
});

test('keeps high-risk document processing compatible only after local or redacted alternatives are preferred', () => {
  const plan = buildAdobeIntegrationPlan({
    serviceId: 'adobe-pdf-extract-api',
    purpose: 'pdf-extract-address-import',
    payloadClass: 'pdf-document',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
    highRiskMode: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.dataFlow.highRiskModeCompatible, false);
  assert.ok(plan.warnings.includes('high-risk-mode-prefers-local-pdf-ocr-redaction-or-agid-s-over-adobe-cloud-processing'));
});

test('supports Acrobat Sign consent envelopes with explicit document controls', () => {
  const plan = buildAdobeIntegrationPlan({
    serviceId: 'acrobat-sign-api',
    purpose: 'consent-envelope-signature',
    payloadClass: 'signature-agreement',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.dataFlow.sendsRawAddressDocumentToAdobe, true);
  assert.equal(plan.dataFlow.clientSecretAllowedInBrowser, false);
  assert.ok(plan.requiredControls.includes('purpose-scoped-signature-envelope'));
  assert.ok(plan.warnings.includes('broad-adobe-scope-requires-admin-review-and-retention-policy'));
});

test('rejects signature agreements outside Acrobat Sign', () => {
  const plan = buildAdobeIntegrationPlan({
    serviceId: 'adobe-pdf-services-api',
    purpose: 'pdf-generate-shipping-label',
    payloadClass: 'signature-agreement',
    ownerConsent: true,
    encryptedAtRest: true,
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, false);
  assert.ok(plan.errors.includes('signature-agreement-requires-acrobat-sign-api'));
});

test('allows redacted PDF Embed API viewer in browser without client secret', () => {
  const plan = buildAdobeIntegrationPlan({
    serviceId: 'adobe-pdf-embed-api',
    purpose: 'pdf-embed-redacted-viewer',
    payloadClass: 'redacted-pdf',
    encryptedInTransit: true,
    redacted: true,
  });

  assert.equal(plan.allowed, true);
  assert.equal(plan.dataFlow.serverSideOnlyRequired, false);
  assert.equal(plan.dataFlow.clientSecretAllowedInBrowser, false);
});

test('warns that Creative Cloud Libraries may not accept new integrations', () => {
  const plan = buildAdobeIntegrationPlan({
    serviceId: 'creative-cloud-libraries-api',
    purpose: 'creative-brand-assets',
    payloadClass: 'creative-asset',
    encryptedInTransit: true,
    serverSideOnly: true,
  });

  assert.equal(plan.allowed, true);
  assert.ok(plan.warnings.includes('creative-cloud-libraries-new-integrations-may-not-be-accepted-by-adobe'));
  assert.ok(plan.requiredControls.includes('no-recipient-or-private-address-in-creative-assets'));
});

test('rejects unsupported service-purpose combinations', () => {
  const plan = buildAdobeIntegrationPlan({
    serviceId: 'adobe-express-embed-sdk',
    purpose: 'commerce-order-handoff',
    payloadClass: 'creative-asset',
  });

  assert.equal(plan.allowed, false);
  assert.ok(plan.errors.includes('service-purpose-not-supported'));
});
