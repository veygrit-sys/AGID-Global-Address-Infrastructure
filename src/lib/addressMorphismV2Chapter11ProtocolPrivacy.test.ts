import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_CHAPTER11_PROTOCOL_PRIVACY_VERSION,
  buildChapter11ProtocolPrivacyReport,
  chapter11IdentifierImpliesSovereignty,
  chapter11LeastDisclosurePreferred,
  chapter11ZkRepairsBadResolution,
  evaluateChapter11ProofRequest,
  isChapter11EnvelopeProofReady,
  validateChapter11AuditEvent,
  type Chapter11Envelope,
  type Chapter11ProofRequest,
  type Chapter11VerifierPolicy,
} from './addressMorphismV2Chapter11ProtocolPrivacy';

const envelope: Chapter11Envelope = {
  version: 'amt-envelope-v0.1',
  referentCommitment: 'commit:referent',
  pidCommitment: 'commit:pid',
  sourceSetVersion: 'sources:2026-07-02',
  qualityState: 'verified',
  resolutionState: 'verified',
  lineageRoot: 'lineage:abc',
  freshnessRoot: 'freshness:def',
  revocationRoot: 'revocation:ghi',
  allowedPredicates: ['within_delivery_zone', 'quality_verified', 'not_revoked', 'consent_scope_delivery'],
};

const policy: Chapter11VerifierPolicy = {
  role: 'merchant',
  purpose: 'delivery',
  allowedPredicates: ['within_delivery_zone', 'not_revoked', 'consent_scope_delivery'],
  maxDisclosure: 'proofOnly',
  maxLeakScore: 0.2,
  retentionDays: 30,
  requiresAudit: true,
  requiresRevocationRoot: true,
  allowDisputed: false,
};

const request: Chapter11ProofRequest = {
  predicate: 'within_delivery_zone',
  requestedDisclosure: 'proofOnly',
  publicSignalLeakScore: 0.05,
  nullifierScope: {
    purposeScoped: true,
    verifierScoped: true,
    epochScoped: true,
  },
  auditReady: true,
};

test('chapter 11 report records envelope, policy, leak, nullifier, audit, and non-repair models', () => {
  const report = buildChapter11ProtocolPrivacyReport();

  assert.equal(report.version, ADDRESS_MORPHISM_V2_CHAPTER11_PROTOCOL_PRIVACY_VERSION);
  assert.ok(report.executableModelKinds.includes('AMT envelope schema'));
  assert.ok(report.executableModelKinds.includes('ZK predicate boundary'));
  assert.ok(report.executableModelKinds.includes('public signal leak gate'));
  assert.ok(report.executableModelKinds.includes('scoped nullifier gate'));
  assert.ok(report.executableModelKinds.includes('ZK non-repair boundary'));
  assert.match(report.safetyRule, /AMT resolution is not cryptographic proof/);
});

test('chapter 11 allows a verified envelope with scoped proof-only predicate', () => {
  const decision = evaluateChapter11ProofRequest(envelope, policy, request);

  assert.equal(decision.state, 'allowed');
  assert.equal(decision.disclosureAllowed, 'proofOnly');
  assert.deepEqual(decision.reasons, []);
});

test('chapter 11 blocks unresolved, blocked, and non-allowed proof states', () => {
  const decision = evaluateChapter11ProofRequest({ ...envelope, resolutionState: 'unresolved' }, policy, request);

  assert.equal(isChapter11EnvelopeProofReady({ ...envelope, resolutionState: 'blocked' }, policy), false);
  assert.equal(decision.state, 'blocked');
  assert.ok(decision.reasons.includes('envelope-state-not-proof-ready'));
});

test('chapter 11 treats disputed envelopes as policy-dependent limited proof', () => {
  const disputedEnvelope = { ...envelope, resolutionState: 'disputed' as const };
  const disputedPolicy = { ...policy, allowDisputed: true };
  const decision = evaluateChapter11ProofRequest(disputedEnvelope, disputedPolicy, request);

  assert.equal(isChapter11EnvelopeProofReady(disputedEnvelope, disputedPolicy), true);
  assert.equal(decision.state, 'limited');
});

test('chapter 11 blocks predicates outside envelope or verifier policy allowlists', () => {
  const outsideEnvelope = evaluateChapter11ProofRequest(envelope, policy, {
    ...request,
    predicate: 'postal_equivalent',
  });
  const outsidePolicy = evaluateChapter11ProofRequest(envelope, policy, {
    ...request,
    predicate: 'quality_verified',
  });

  assert.equal(outsideEnvelope.state, 'blocked');
  assert.ok(outsideEnvelope.reasons.includes('predicate-not-in-envelope-allowlist'));
  assert.equal(outsidePolicy.state, 'blocked');
  assert.ok(outsidePolicy.reasons.includes('predicate-not-allowed-by-policy'));
});

test('chapter 11 blocks public signal leaks, raw disclosure, missing revocation, and unscoped nullifiers', () => {
  const unsafe = evaluateChapter11ProofRequest(
    { ...envelope, revocationRoot: undefined },
    policy,
    {
      ...request,
      requestedDisclosure: 'rawAddress',
      publicSignalLeakScore: 0.9,
      nullifierScope: { purposeScoped: true, verifierScoped: false, epochScoped: true },
    },
  );

  assert.equal(unsafe.state, 'blocked');
  assert.ok(unsafe.reasons.includes('disclosure-exceeds-policy'));
  assert.ok(unsafe.reasons.includes('public-signal-leak-above-threshold'));
  assert.ok(unsafe.reasons.includes('nullifier-scope-insufficient'));
  assert.ok(unsafe.reasons.includes('revocation-root-required'));
});

test('chapter 11 validates audit logs without raw address, witness, or private key storage', () => {
  const safe = validateChapter11AuditEvent({
    actor: 'auditor',
    action: 'verify_proof',
    purpose: 'delivery',
    disclosureLevel: 'proofOnly',
    storesRawAddress: false,
    storesWitness: false,
    storesPrivateKey: false,
  });
  const unsafe = validateChapter11AuditEvent({
    actor: 'auditor',
    action: 'verify_proof',
    purpose: 'delivery',
    disclosureLevel: 'rawAddress',
    storesRawAddress: true,
    storesWitness: true,
    storesPrivateKey: true,
  });

  assert.deepEqual(safe, []);
  assert.ok(unsafe.includes('audit-must-not-store-raw-address'));
  assert.ok(unsafe.includes('audit-must-not-store-witness'));
  assert.ok(unsafe.includes('audit-must-not-store-private-key'));
});

test('chapter 11 least disclosure prefers sufficient lower disclosure', () => {
  assert.equal(chapter11LeastDisclosurePreferred('rawAddress', 'proofOnly'), true);
  assert.equal(chapter11LeastDisclosurePreferred('proofOnly', 'rawAddress'), false);
});

test('chapter 11 preserves ZK non-repair and neutral identifier non-claims', () => {
  assert.equal(chapter11ZkRepairsBadResolution(), false);
  assert.equal(chapter11IdentifierImpliesSovereignty(), false);

  const decision = evaluateChapter11ProofRequest(envelope, policy, request);
  assert.ok(decision.nonClaims.includes('ZK proof cannot repair bad AMT resolution'));
  assert.ok(decision.nonClaims.includes('AGID or PID is not a sovereignty claim'));
  assert.ok(decision.nonClaims.includes('audit does not justify raw address storage'));
});
