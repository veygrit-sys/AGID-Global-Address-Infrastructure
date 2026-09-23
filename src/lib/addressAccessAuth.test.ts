import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_ACCESS_AUTH_VERSION,
  evaluateAddressAccess,
  getAddressAccessScopePolicy,
  listAddressAccessScopePolicies,
} from './addressAccessAuth';

const baseNow = '2026-06-17T00:00:00.000Z';

test('allows a carrier to read delivery envelope material without exposing raw address or AOID', () => {
  const decision = evaluateAddressAccess({
    actor: 'carrier',
    purpose: 'delivery',
    mode: 'server-registry',
    resource: 'agid-s-envelope',
    requestedScopes: ['delivery:read'],
    hasConsentProof: true,
    hasFreshness: true,
    hasRevocationCheck: true,
    hasDeviceTrust: true,
    hasApiKeyScope: true,
    hasAudienceBinding: true,
    hasDomainSeparation: true,
    hasEncryptedChannel: true,
    rateLimitChecked: true,
    now: baseNow,
    tokenIssuedAt: baseNow,
    tokenExpiresAt: '2026-06-17T00:10:00.000Z',
  });

  assert.equal(decision.version, ADDRESS_ACCESS_AUTH_VERSION);
  assert.equal(decision.decision, 'allow');
  assert.deepEqual(decision.allowedScopes, ['delivery:read']);
  assert.equal(decision.privacy.rawAddressAllowed, false);
  assert.equal(decision.privacy.rawAoidAllowed, false);
  assert.equal(decision.privacy.agidSPlaintextAllowed, false);
  assert.ok(decision.forbiddenDisclosures.includes('raw-address'));
});

test('challenges AGID-S decryption when device, audience, or freshness controls are missing', () => {
  const decision = evaluateAddressAccess({
    actor: 'carrier',
    purpose: 'delivery',
    mode: 'server-registry',
    resource: 'agid-s-plaintext',
    requestedScopes: ['agid-s:decrypt'],
    hasConsentProof: true,
    hasRevocationCheck: true,
    hasApiKeyScope: true,
    hasEncryptedChannel: true,
    rateLimitChecked: true,
  });

  assert.equal(decision.decision, 'challenge');
  assert.equal(decision.privacy.agidSPlaintextAllowed, false);
  assert.ok(decision.missingControls.includes('device-trust'));
  assert.ok(decision.missingControls.includes('audience-bound-token'));
  assert.ok(decision.missingControls.includes('freshness-check'));
});

test('allows AGID-S plaintext only with decrypt scope and all required controls', () => {
  const decision = evaluateAddressAccess({
    actor: 'carrier',
    purpose: 'delivery',
    mode: 'server-registry',
    resource: 'agid-s-plaintext',
    requestedScopes: ['agid-s:decrypt'],
    hasConsentProof: true,
    hasFreshness: true,
    hasRevocationCheck: true,
    hasDeviceTrust: true,
    hasIssuerTrust: true,
    hasApiKeyScope: true,
    hasAudienceBinding: true,
    hasEncryptedChannel: true,
    hasDomainSeparation: true,
    rateLimitChecked: true,
    now: baseNow,
    tokenIssuedAt: baseNow,
    tokenExpiresAt: '2026-06-17T00:04:00.000Z',
  });

  assert.equal(decision.decision, 'allow');
  assert.equal(decision.privacy.agidSPlaintextAllowed, true);
  assert.equal(decision.privacy.disclosureClass, 'private-plaintext');
  assert.equal(decision.tokenPolicy.oneTimeUseRecommended, true);
});

test('denies merchant attempts to read raw address even when a delivery scope is present', () => {
  const decision = evaluateAddressAccess({
    actor: 'merchant',
    purpose: 'delivery',
    resource: 'raw-address',
    requestedScopes: ['delivery:read', 'aoid:private-read'],
    hasConsentProof: true,
    hasFreshness: true,
    hasRevocationCheck: true,
    hasDeviceTrust: true,
    hasApiKeyScope: true,
    hasAudienceBinding: true,
    hasEncryptedChannel: true,
    manualReviewApproved: true,
  });

  assert.equal(decision.decision, 'deny');
  assert.ok(decision.reasons.includes('raw-address-is-owner-admin-only'));
  assert.ok(decision.deniedScopes.some(item => item.scope === 'aoid:private-read' && item.reason.includes('actor')));
  assert.equal(decision.privacy.rawAddressAllowed, false);
});

test('keeps private AOID owner access in review until manual approval is present', () => {
  const review = evaluateAddressAccess({
    actor: 'recipient',
    purpose: 'identity',
    mode: 'local-only',
    resource: 'aoid-private-descriptor',
    requestedScopes: ['aoid:private-read'],
    hasFreshness: true,
    hasRevocationCheck: true,
    hasAudienceBinding: true,
    hasEncryptedChannel: true,
    now: baseNow,
    tokenIssuedAt: baseNow,
    tokenExpiresAt: '2026-06-17T00:03:00.000Z',
  });

  assert.equal(review.decision, 'review');
  assert.ok(review.missingControls.includes('manual-review'));

  const allowed = evaluateAddressAccess({
    actor: 'recipient',
    purpose: 'identity',
    mode: 'local-only',
    resource: 'aoid-private-descriptor',
    requestedScopes: ['aoid:private-read'],
    hasFreshness: true,
    hasRevocationCheck: true,
    hasAudienceBinding: true,
    hasEncryptedChannel: true,
    manualReviewApproved: true,
    now: baseNow,
    tokenIssuedAt: baseNow,
    tokenExpiresAt: '2026-06-17T00:03:00.000Z',
  });

  assert.equal(allowed.decision, 'allow');
  assert.equal(allowed.privacy.rawAoidAllowed, true);
});

test('requires stronger high-risk controls for aid eligibility', () => {
  const review = evaluateAddressAccess({
    actor: 'ngo',
    purpose: 'aid',
    mode: 'server-registry',
    highRiskMode: true,
    resource: 'coarse-region',
    requestedScopes: ['aid:eligibility'],
    hasFreshness: true,
    hasRevocationCheck: true,
    hasIssuerTrust: true,
    hasDomainSeparation: true,
    hasEncryptedChannel: true,
    rateLimitChecked: true,
  });

  assert.equal(review.decision, 'review');
  assert.ok(review.missingControls.includes('zk-proof'));
  assert.ok(review.missingControls.includes('recipient-live-challenge'));
  assert.ok(review.missingControls.includes('manual-review'));

  const allowed = evaluateAddressAccess({
    actor: 'ngo',
    purpose: 'aid',
    mode: 'zk-only',
    highRiskMode: true,
    resource: 'coarse-region',
    requestedScopes: ['aid:eligibility'],
    hasFreshness: true,
    hasRevocationCheck: true,
    hasIssuerTrust: true,
    hasDomainSeparation: true,
    hasRecipientChallenge: true,
    hasEncryptedChannel: true,
    hasZkProof: true,
    manualReviewApproved: true,
    rateLimitChecked: true,
    now: baseNow,
    tokenIssuedAt: baseNow,
    tokenExpiresAt: '2026-06-17T00:02:00.000Z',
  });

  assert.equal(allowed.decision, 'allow');
  assert.equal(allowed.tokenPolicy.ttlSeconds, 180);
});

test('challenges recipient verification when the live proof is missing', () => {
  const decision = evaluateAddressAccess({
    actor: 'pos-staff',
    purpose: 'delivery',
    mode: 'local-only',
    resource: 'recipient-proof',
    requestedScopes: ['recipient:verify'],
    hasDomainSeparation: true,
    staffRoleVerified: true,
  });

  assert.equal(decision.decision, 'challenge');
  assert.ok(decision.missingControls.includes('recipient-live-challenge'));
  assert.equal(decision.privacy.rawAddressAllowed, false);
});

test('denies scope reuse across incompatible purposes', () => {
  const decision = evaluateAddressAccess({
    actor: 'merchant',
    purpose: 'delivery',
    resource: 'return-label',
    requestedScopes: ['return:label'],
    hasConsentProof: true,
    hasFreshness: true,
    hasRevocationCheck: true,
  });

  assert.equal(decision.decision, 'deny');
  assert.ok(decision.deniedScopes.some(item => item.reason === 'scope-not-allowed-for-purpose:delivery'));
});

test('documents policies and flags unknown scopes', () => {
  const policies = listAddressAccessScopePolicies();
  assert.ok(policies.length >= 10);
  assert.equal(getAddressAccessScopePolicy('recipient:verify').risk, 'high');

  const decision = evaluateAddressAccess({
    actor: 'carrier',
    purpose: 'delivery',
    resource: 'delivery-eligibility',
    requestedScopes: ['delivery:eligible', 'marketing:read'],
    hasConsentProof: true,
    hasFreshness: true,
    hasRevocationCheck: true,
    hasIssuerTrust: true,
    hasDomainSeparation: true,
    rateLimitChecked: true,
  });

  assert.equal(decision.decision, 'allow');
  assert.ok(decision.deniedScopes.some(item => item.scope === 'marketing:read' && item.reason === 'unknown-scope'));
});
