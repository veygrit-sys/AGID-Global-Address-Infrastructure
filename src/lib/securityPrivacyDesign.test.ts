import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ANTI_SURVEILLANCE_DESIGN,
  buildSecurityPrivacyDesignPlan,
  SECURITY_PRIVACY_BASELINE,
  SECURITY_PRIVACY_DESIGN_VERSION,
  validateSecurityPrivacyPayload,
} from './securityPrivacyDesign';

test('security privacy baseline keeps AGID public and AOID private as separate invariants', () => {
  assert.equal(SECURITY_PRIVACY_BASELINE.version, SECURITY_PRIVACY_DESIGN_VERSION);
  assert.ok(SECURITY_PRIVACY_BASELINE.invariants.some(value => value.includes('AGID is public')));
  assert.ok(SECURITY_PRIVACY_BASELINE.invariants.some(value => value.includes('AOID is private')));
  assert.ok(SECURITY_PRIVACY_BASELINE.invariants.some(value => value.includes('server plaintext')));
  assert.ok(SECURITY_PRIVACY_BASELINE.invariants.some(value => value.includes('domain-separated nullifiers')));
});

test('anti-surveillance design requires private predicates without global AOID tracking', () => {
  assert.equal(ANTI_SURVEILLANCE_DESIGN.version, SECURITY_PRIVACY_DESIGN_VERSION);
  assert.ok(ANTI_SURVEILLANCE_DESIGN.privateProofPredicates.includes('resident-in-country'));
  assert.ok(ANTI_SURVEILLANCE_DESIGN.privateProofPredicates.includes('inside-delivery-zone'));
  assert.ok(ANTI_SURVEILLANCE_DESIGN.hiddenByDefault.includes('real-address'));
  assert.ok(ANTI_SURVEILLANCE_DESIGN.hiddenByDefault.includes('AOID-body'));
  assert.ok(ANTI_SURVEILLANCE_DESIGN.publicByDesign.includes('purpose-specific-commitment'));
  assert.ok(ANTI_SURVEILLANCE_DESIGN.publicByDesign.includes('domain-separated-nullifier'));
  assert.ok(ANTI_SURVEILLANCE_DESIGN.forbiddenCapabilities.includes('global-AOID-as-public-user-id'));
  assert.ok(ANTI_SURVEILLANCE_DESIGN.forbiddenCapabilities.includes('cross-purpose-nullifier-reuse'));
  assert.ok(ANTI_SURVEILLANCE_DESIGN.requiredCapabilities.includes('revocation-and-freshness-public-verification'));
  assert.ok(ANTI_SURVEILLANCE_DESIGN.censorshipResistanceOptions.includes('onion-friendly-endpoint'));
  assert.ok(ANTI_SURVEILLANCE_DESIGN.censorshipResistanceOptions.includes('offline-credential-issuance'));
});

test('public QR payload validation rejects private AOID and exact-position fields', () => {
  const result = validateSecurityPrivacyPayload({
    type: 'AOID',
    id: '05AV8TJGH8QZ6M2R',
    agid: 'JP05AV8TJGH8',
    publicHandle: 'aoid-public-handle',
    recipient: 'Private Receiver',
    phone: '+81 90 0000 0000',
    lat: 35.681236,
    lon: 139.767125,
    ownerKeyId: 'owner-key-1',
  }, {
    surface: 'public-agid-qr',
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.forbiddenFields.sort(), [
    'payload.lat',
    'payload.lon',
    'payload.ownerKeyId',
    'payload.phone',
    'payload.recipient',
  ]);
});

test('public AGID API can expose public coordinates but not private recipient or raw address text', () => {
  const safe = validateSecurityPrivacyPayload({
    agid: 'JP05AV8TJGH8',
    lat: 35.6812,
    lon: 139.7671,
    publicLabel: 'Tokyo Station',
  }, {
    surface: 'public-agid-api',
  });

  const unsafe = validateSecurityPrivacyPayload({
    agid: 'JP05AV8TJGH8',
    recipient: 'Private Receiver',
    addressText: 'private apartment address',
  }, {
    surface: 'public-agid-api',
  });

  assert.equal(safe.ok, true);
  assert.equal(unsafe.ok, false);
  assert.deepEqual(unsafe.forbiddenFields.sort(), [
    'payload.addressText',
    'payload.recipient',
  ]);
});

test('AOID sync plan blocks server persistence without encryption and owner consent', () => {
  const plan = buildSecurityPrivacyDesignPlan({
    surface: 'aoid-sync',
    includesAoid: true,
    includesRecipient: true,
    includesExactCoordinates: true,
    dataClasses: ['secret'],
    persistsServerSide: true,
    encryptedAtRest: false,
    encryptedInTransit: true,
    hasConsentProof: false,
  });

  assert.equal(plan.decision, 'block');
  assert.equal(plan.riskLevel, 'critical');
  assert.ok(plan.requiredControls.includes('owner-device-encryption-required'));
  assert.ok(plan.errors.includes('server-side-private-persistence-requires-encryption-at-rest'));
  assert.ok(plan.errors.includes('aoid-sync-requires-owner-consent-proof'));
});

test('credential-backed ZK proof plan requires issuer trust, revocation, freshness, and scoped proof', () => {
  const plan = buildSecurityPrivacyDesignPlan({
    surface: 'zk-proof-public',
    purpose: 'residence',
    dataClasses: ['sensitive'],
    includesCredential: true,
    includesZkProof: true,
    includesNullifier: true,
    hasIssuerTrust: true,
    hasRevocationCheck: true,
    hasFreshnessProof: true,
  });

  assert.equal(plan.decision, 'allow-with-controls');
  assert.ok(plan.requiredControls.includes('domain-separated-nullifier'));
  assert.ok(plan.requiredProofs.includes('issuer trust proof'));
  assert.ok(plan.requiredProofs.includes('revocation status proof'));
  assert.ok(plan.requiredProofs.includes('freshness proof'));
  assert.ok(plan.requiredProofs.includes('private residence predicate proof'));
  assert.ok(plan.requiredProofs.includes('scope-bound ZK proof envelope'));
  assert.deepEqual(plan.errors, []);
});

test('proof bundle registry blocks raw proof storage and requires compatibility checks', () => {
  const plan = buildSecurityPrivacyDesignPlan({
    surface: 'proof-bundle-registry',
    purpose: 'pid-audit',
    includesZkProof: true,
    storesRawProofs: true,
  });

  assert.equal(plan.decision, 'block');
  assert.ok(plan.requiredControls.includes('do-not-store-raw-proofs'));
  assert.ok(plan.requiredControls.includes('proof-compatibility-check'));
  assert.ok(plan.requiredProofs.includes('PID lifecycle or issuance audit proof'));
  assert.ok(plan.errors.includes('raw-zk-proofs-or-witnesses-must-not-be-stored-in-registries'));
});

test('MCP and shopping-agent access is blocked without purpose-bound consent', () => {
  const plan = buildSecurityPrivacyDesignPlan({
    surface: 'mcp-tool',
    purpose: 'agent-access',
    usesMcpOrAgent: true,
    sharesWithThirdParty: true,
    includesPlainAddress: true,
    includesRecipient: true,
    includesCredential: true,
    hasIssuerTrust: true,
    hasRevocationCheck: true,
    hasFreshnessProof: true,
  });

  assert.equal(plan.decision, 'block');
  assert.ok(plan.errors.includes('third-party-or-agent-access-requires-consent-purpose-scope-proof'));
  assert.ok(plan.errors.includes('public-or-external-surface-cannot-include-plain-address'));
  assert.ok(plan.errors.includes('public-or-external-surface-cannot-include-recipient-fields'));
});
