import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  REGISTERED_ADDRESS_QUALITY_MODEL_VERSION,
  buildRegisteredAddressQualitySnapshot,
  registeredQualitySnapshotToDecision,
  sanitizeRegisteredAddressQualitySnapshot,
} from './registeredAddressQuality';

test('registered address quality snapshots keep only public-safe decision metadata', () => {
  const snapshot = buildRegisteredAddressQualitySnapshot({
    addressElement: {
      quality: { decision: 'verified', score: 0.93, internalOnly: true },
      missingRequiredFields: [],
      warnings: [],
      autofill: {
        postalCandidateCount: 1,
        agidCandidatePresent: true,
        channels: ['postal-code', 'agid'],
      },
    },
    readiness: {
      status: 'ready',
      score: 0.9,
      publicMetadata: {
        sessionId: 'AEL-0123456789ABCDEF',
        intentId: 'AIT-0123456789ABCDEF',
        qualityDecision: 'verified',
        intentStatus: 'verified',
        checkSummary: { pass: 12, warning: 0, fail: 0 },
        roles: [],
        privacyBoundary: 'no-raw-address-public-metadata',
      },
    },
    reasonCodes: ['stable-registration'],
  });

  assert.equal(snapshot.modelVersion, REGISTERED_ADDRESS_QUALITY_MODEL_VERSION);
  assert.equal(snapshot.state, 'address-ok');
  assert.equal(snapshot.confidenceBand, 'high');
  assert.equal(snapshot.sourceFlags.postalAutofill, true);
  assert.equal(snapshot.sourceFlags.agidAssistance, true);
  assert.equal(snapshot.privacy.safeForPublicQr, true);
  assert.equal(snapshot.privacy.fieldValuesIncluded, false);
  assert.equal(snapshot.privacy.recipientIncluded, false);
  assert.equal(snapshot.privacy.exactCoordinatesIncluded, false);
});

test('registered address quality marks AGID as primary when postal code is unavailable', () => {
  const snapshot = buildRegisteredAddressQualitySnapshot({
    addressElement: {
      quality: { decision: 'partial', score: 0.74, internalOnly: true },
      missingRequiredFields: [],
      warnings: ['no-postal-code-agid-primary'],
      primaryIdentifier: {
        kind: 'agid',
        label: 'AGID',
        reason: 'no-postal-code-agid-primary',
        safeFingerprint: 'agid-cmt-hk-no-postcode',
      },
      autofill: {
        postalCandidateCount: 0,
        agidCandidatePresent: true,
        channels: ['agid'],
      },
    },
    readiness: {
      status: 'usable',
      score: 0.72,
      publicMetadata: {
        sessionId: 'AEL-0123456789ABCDEF',
        intentId: 'AIT-0123456789ABCDEF',
        qualityDecision: 'partial',
        intentStatus: 'requires_review',
        checkSummary: { pass: 10, warning: 1, fail: 0 },
        roles: [],
        privacyBoundary: 'no-raw-address-public-metadata',
      },
    },
  });

  assert.equal(snapshot.sourceFlags.postalAutofill, false);
  assert.equal(snapshot.sourceFlags.agidAssistance, true);
  assert.equal(snapshot.sourceFlags.agidPrimaryIdentifier, true);
  assert.ok(snapshot.reasonCodes.includes('primary:agid'));
});

test('registered address quality maps missing delivery fields to rejected', () => {
  const snapshot = buildRegisteredAddressQualitySnapshot({
    addressElement: {
      quality: { decision: 'needs_review', score: 0.42, internalOnly: true },
      missingRequiredFields: ['street', 'city'],
      warnings: ['address-element-required-fields-missing'],
      autofill: {
        postalCandidateCount: 0,
        agidCandidatePresent: false,
        channels: ['manual'],
      },
    },
    readiness: {
      status: 'needs_review',
      score: 0.36,
      publicMetadata: {
        sessionId: 'AEL-0123456789ABCDEF',
        intentId: 'AIT-0123456789ABCDEF',
        qualityDecision: 'needs_review',
        intentStatus: 'requires_review',
        checkSummary: { pass: 4, warning: 2, fail: 1 },
        roles: [],
        privacyBoundary: 'no-raw-address-public-metadata',
      },
    },
  });
  const decision = registeredQualitySnapshotToDecision(snapshot);

  assert.equal(snapshot.state, 'rejected');
  assert.equal(snapshot.confidenceBand, 'low');
  assert.ok(snapshot.reasonCodes.includes('missing:street'));
  assert.equal(decision.label, 'Rejected');
  assert.equal(decision.severity, 3);
});

test('registered address quality sanitizer normalizes forged labels and privacy flags', () => {
  const sanitized = sanitizeRegisteredAddressQualitySnapshot({
    modelVersion: REGISTERED_ADDRESS_QUALITY_MODEL_VERSION,
    state: 'address-ok',
    label: 'Private person name',
    shortLabel: 'Private',
    severity: 3,
    confidenceBand: 'high',
    reasonCodes: ['stable-registration'],
    sourceFlags: {
      postalAutofill: true,
      agidAssistance: false,
      documentAssistance: true,
      translationFeedback: true,
    },
    readiness: {
      status: 'ready',
      intentStatus: 'verified',
      checkSummary: { pass: 12, warning: 0, fail: 0 },
      privacyBoundary: 'not-allowed',
    },
    privacy: {
      safeForPublicQr: false,
      fieldValuesIncluded: true,
      recipientIncluded: true,
      exactCoordinatesIncluded: true,
    },
  });

  assert.equal(sanitized?.label, 'OK');
  assert.equal(sanitized?.severity, 0);
  assert.equal(sanitized?.readiness.privacyBoundary, 'no-raw-address-public-metadata');
  assert.equal(sanitized?.privacy.safeForPublicQr, true);
  assert.equal(sanitized?.privacy.fieldValuesIncluded, false);
  assert.equal(sanitized?.privacy.recipientIncluded, false);
  assert.equal(sanitized?.privacy.exactCoordinatesIncluded, false);
});
