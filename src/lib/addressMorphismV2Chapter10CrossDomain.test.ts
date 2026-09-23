import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_CHAPTER10_CROSS_DOMAIN_VERSION,
  areChapter10ReachEquivalent,
  buildChapter10CrossDomainReport,
  classifyChapter10Domain,
  computeChapter10CrossDomainDistance,
  evaluateChapter10DigitalRelation,
  evaluateChapter10Referent,
  isChapter10PublicProjectionSafe,
  type Chapter10Referent,
} from './addressMorphismV2Chapter10CrossDomain';

const seaReferent: Chapter10Referent = {
  id: 'sea-coral',
  domain: 'natural',
  boundaryKind: 'polygon',
  verticalKind: 'none',
  temporalKind: 'stable',
  reachabilityKind: 'maritime',
  privacyKind: 'public',
  hasCoordinateEvidence: true,
  hasNameEvidence: true,
  hasRouteEvidence: false,
  hasTemporalEvidence: true,
};

const lockerReferent: Chapter10Referent = {
  id: 'locker-session-1',
  domain: 'logistics',
  boundaryKind: 'networkNode',
  verticalKind: 'unit',
  temporalKind: 'session',
  reachabilityKind: 'carrier',
  privacyKind: 'proofOnly',
  hasCoordinateEvidence: true,
  hasNameEvidence: true,
  hasRouteEvidence: true,
  hasTemporalEvidence: true,
};

test('chapter 10 report records cross-domain referent and projection models', () => {
  const report = buildChapter10CrossDomainReport();

  assert.equal(report.version, ADDRESS_MORPHISM_V2_CHAPTER10_CROSS_DOMAIN_VERSION);
  assert.ok(report.executableModelKinds.includes('cross-domain referent schema'));
  assert.ok(report.executableModelKinds.includes('domain classifier'));
  assert.ok(report.executableModelKinds.includes('vertical privacy gate'));
  assert.ok(report.executableModelKinds.includes('digital twin correspondence boundary'));
  assert.match(report.safetyRule, /not forced into ordinary address strings/);
});

test('chapter 10 domain classifier recognizes natural, cultural, logistics, emergency, and digital inputs', () => {
  assert.equal(classifyChapter10Domain('Coral Sea maritime region'), 'natural');
  assert.equal(classifyChapter10Domain('historic market cultural district'), 'cultural');
  assert.equal(classifyChapter10Domain('locker PUDO loading gate'), 'logistics');
  assert.equal(classifyChapter10Domain('temporary evacuation shelter'), 'emergency');
  assert.equal(classifyChapter10Domain('digital twin XR venue'), 'digital');
});

test('chapter 10 evaluates sea names as usable natural references when evidence and boundary exist', () => {
  const decision = evaluateChapter10Referent(seaReferent, 'delivery');

  assert.equal(decision.state, 'usable');
  assert.equal(decision.publicProjectionSafe, true);
  assert.deepEqual(decision.reasons, []);
});

test('chapter 10 blocks private vertical unit projection for public PID', () => {
  const decision = evaluateChapter10Referent(lockerReferent, 'public_pid');

  assert.equal(isChapter10PublicProjectionSafe(lockerReferent), false);
  assert.equal(decision.state, 'blocked');
  assert.ok(decision.reasons.includes('public-projection-unsafe'));
  assert.ok(decision.nonClaims.includes('delivery reachability is not residence proof'));
});

test('chapter 10 treats logistics references as non-identity proof', () => {
  const decision = evaluateChapter10Referent({ ...lockerReferent, verticalKind: 'none', temporalKind: 'stable' }, 'identity');

  assert.equal(decision.state, 'manual_review');
  assert.ok(decision.reasons.includes('logistics-referent-is-not-identity-proof'));
});

test('chapter 10 unresolved boundary is required for identity and public PID purposes', () => {
  const unknownBoundary = { ...seaReferent, id: 'unknown-sea', boundaryKind: 'unknown' as const };
  const identityDecision = evaluateChapter10Referent(unknownBoundary, 'identity');
  const deliveryDecision = evaluateChapter10Referent(unknownBoundary, 'delivery');

  assert.equal(identityDecision.state, 'manual_review');
  assert.ok(identityDecision.reasons.includes('precise-boundary-required-for-purpose'));
  assert.equal(deliveryDecision.state, 'limited');
});

test('chapter 10 reach equivalence is purpose-relative', () => {
  const loadingDock = {
    ...lockerReferent,
    id: 'loading-dock',
    verticalKind: 'entrance' as const,
    temporalKind: 'stable' as const,
    privacyKind: 'partial' as const,
  };
  const warehouseGate = { ...loadingDock, id: 'warehouse-gate' };

  assert.equal(areChapter10ReachEquivalent(loadingDock, warehouseGate, 'delivery'), true);
  assert.equal(areChapter10ReachEquivalent(loadingDock, warehouseGate, 'identity'), false);
});

test('chapter 10 cross-domain structural distance is lower for matching domain and access profile', () => {
  const near = { ...seaReferent, id: 'sea-coral-alt' };
  const far = { ...lockerReferent, id: 'locker-alt', verticalKind: 'entrance' as const };

  assert.equal(computeChapter10CrossDomainDistance(seaReferent, near), 0);
  assert.ok(computeChapter10CrossDomainDistance(seaReferent, far) > 0.5);
});

test('chapter 10 digital representation is not physical identity by default', () => {
  const representation = evaluateChapter10DigitalRelation('representation');
  const equivalent = evaluateChapter10DigitalRelation('equivalent');

  assert.equal(representation.identityAllowed, false);
  assert.equal(equivalent.identityAllowed, true);
  assert.equal(representation.nonClaim, 'digital representation is not physical identity unless explicitly equivalent');
});

test('chapter 10 requires name or coordinate evidence before using a referent', () => {
  const decision = evaluateChapter10Referent(
    { ...seaReferent, id: 'anonymous-feature', hasNameEvidence: false, hasCoordinateEvidence: false },
    'delivery',
  );

  assert.equal(decision.state, 'unresolved');
  assert.ok(decision.reasons.includes('name-or-coordinate-evidence-required'));
});
