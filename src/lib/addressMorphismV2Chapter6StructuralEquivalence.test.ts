import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_CHAPTER6_STRUCTURAL_EQUIVALENCE_VERSION,
  buildChapter6BoundedClusters,
  buildChapter6CounterexampleFixtures,
  buildChapter6StructuralEquivalenceReport,
  buildChapter6TransitiveChainCounterexample,
  computeChapter6Entropy,
  computeChapter6QuotientEntropy,
  computeChapter6StructuralDistance,
  decideChapter6StructuralEquivalence,
} from './addressMorphismV2Chapter6StructuralEquivalence';

test('chapter 6 structural equivalence report records purpose-relative distance model', () => {
  const report = buildChapter6StructuralEquivalenceReport();

  assert.equal(report.version, ADDRESS_MORPHISM_V2_CHAPTER6_STRUCTURAL_EQUIVALENCE_VERSION);
  assert.equal(report.purposeCount, 4);
  assert.ok(report.featureKeys.includes('building'));
  assert.ok(report.executableModelKinds.includes('bounded-diameter clusters'));
  assert.ok(report.executableModelKinds.includes('quotient entropy'));
  assert.match(report.safetyRule, /candidate sufficiency/);
});

test('chapter 6 computes lower distance for matching delivery structure', () => {
  const result = computeChapter6StructuralDistance(
    { country: 'XX', adminPath: 'A/B', roadSegment: 'R-1', building: 'B-1', entrance: 'E-1' },
    { country: 'XX', adminPath: 'A/B', roadSegment: 'R-1', building: 'B-1', entrance: 'E-1' },
    'delivery',
  );

  assert.equal(result.distance, 0);
  assert.equal(result.comparable, true);
  assert.ok(result.sharedDiscriminatingKeys.includes('building'));
});

test('chapter 6 treats purpose as part of the distance definition', () => {
  const left = { country: 'XX', adminPath: 'A/B', roadSegment: 'R-1', building: 'B-1', entrance: 'front' };
  const right = { country: 'XX', adminPath: 'A/B', roadSegment: 'R-1', building: 'B-1', entrance: 'loading' };

  const delivery = computeChapter6StructuralDistance(left, right, 'delivery');
  const identity = computeChapter6StructuralDistance(left, right, 'identity');

  assert.notEqual(delivery.distance, identity.distance);
  assert.ok(delivery.distance > identity.distance);
});

test('chapter 6 equivalence abstains without evidence even when distance is small', () => {
  const distanceResult = computeChapter6StructuralDistance(
    { country: 'XX', adminPath: 'A/B', building: 'B-1' },
    { country: 'XX', adminPath: 'A/B', building: 'B-1' },
    'identity',
  );
  const decision = decideChapter6StructuralEquivalence({
    distanceResult,
    delta: 0.1,
    evidenceOk: false,
    candidateSufficient: true,
  });

  assert.equal(decision.state, 'abstain');
  assert.deepEqual(decision.reasons, ['evidence-required']);
});

test('chapter 6 equivalence abstains when structures are not comparable', () => {
  const distanceResult = computeChapter6StructuralDistance({ country: 'XX' }, { country: 'XX' }, 'delivery');
  const decision = decideChapter6StructuralEquivalence({
    distanceResult,
    delta: 0.1,
    evidenceOk: true,
    candidateSufficient: true,
  });

  assert.equal(distanceResult.comparable, false);
  assert.equal(decision.state, 'abstain');
  assert.ok(decision.reasons.includes('structural-comparability-required'));
});

test('chapter 6 marks candidates equivalent only when distance and gates pass', () => {
  const distanceResult = computeChapter6StructuralDistance(
    { country: 'XX', adminPath: 'A/B', roadSegment: 'R-1', building: 'B-1' },
    { country: 'XX', adminPath: 'A/B', roadSegment: 'R-1', building: 'B-1' },
    'delivery',
  );
  const decision = decideChapter6StructuralEquivalence({
    distanceResult,
    delta: 0.01,
    evidenceOk: true,
    candidateSufficient: true,
  });

  assert.equal(decision.state, 'equivalent');
});

test('chapter 6 keeps counterexamples for postal, POI, and coordinate equality', () => {
  const fixtures = buildChapter6CounterexampleFixtures();

  assert.match(fixtures.samePostalDifferentBuilding.nonClaim, /postal equality/);
  assert.match(fixtures.samePoiDifferentEntrance.nonClaim, /POI equality/);
  assert.match(fixtures.sameCoordinateDifferentUnit.nonClaim, /coordinate-cell equality/);
});

test('chapter 6 transitive-near counterexample has adjacent near links but distant endpoints', () => {
  const fixture = buildChapter6TransitiveChainCounterexample();
  const [r1, r2, r3] = fixture.candidates;

  const d12 = computeChapter6StructuralDistance(r1.features, r2.features, fixture.purpose).distance;
  const d23 = computeChapter6StructuralDistance(r2.features, r3.features, fixture.purpose).distance;
  const d13 = computeChapter6StructuralDistance(r1.features, r3.features, fixture.purpose).distance;

  assert.ok(d12 <= fixture.delta);
  assert.ok(d23 <= fixture.delta);
  assert.ok(d13 > fixture.delta);
});

test('chapter 6 bounded clusters avoid unsafe transitive chain merging', () => {
  const fixture = buildChapter6TransitiveChainCounterexample();
  const clusters = buildChapter6BoundedClusters(fixture.candidates, fixture.purpose, fixture.delta);

  assert.equal(clusters.length, 2);
  assert.ok(clusters.every(cluster => cluster.diameter <= fixture.delta));
  assert.deepEqual(clusters[0].memberIds, ['r1', 'r2']);
  assert.deepEqual(clusters[1].memberIds, ['r3']);
});

test('chapter 6 quotient entropy is not larger than candidate entropy', () => {
  const candidates = [
    { id: 'r1', features: { country: 'XX', building: 'B-1', entrance: 'front' } },
    { id: 'r2', features: { country: 'XX', building: 'B-1', entrance: 'front' } },
    { id: 'r3', features: { country: 'XX', building: 'B-2', entrance: 'front' } },
  ];
  const clusters = buildChapter6BoundedClusters(candidates, 'delivery', 0.01);
  const probabilities = { r1: 0.25, r2: 0.25, r3: 0.5 };

  const candidateEntropy = computeChapter6Entropy(Object.values(probabilities));
  const quotientEntropy = computeChapter6QuotientEntropy(clusters, probabilities);

  assert.ok(quotientEntropy <= candidateEntropy);
  assert.equal(clusters.length, 2);
});
