import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_UNIFICATION_PLAN_VERSION,
  buildAddressMorphismUnificationPlan,
} from './addressMorphismUnificationPlan';

test('prepares a 29-chapter canonical unification target', () => {
  const plan = buildAddressMorphismUnificationPlan();

  assert.equal(plan.version, ADDRESS_MORPHISM_UNIFICATION_PLAN_VERSION);
  assert.equal(plan.target.canonicalChapterCount, 29);
  assert.equal(plan.target.frontmatterFile, '00-frontmatter.md');
  assert.equal(plan.target.appendixCount, 8);
  assert.equal(plan.chapters.length, 29);
  assert.equal(plan.readiness.missingCanonical, 0);
});

test('marks chapters 1-26 ready and chapters 27-29 as needing legacy and verification coverage', () => {
  const plan = buildAddressMorphismUnificationPlan();

  assert.equal(plan.readiness.readyToUnify, 26);
  assert.equal(plan.readiness.needsLegacyAndVerification, 3);

  for (const chapter of plan.chapters.slice(0, 26)) {
    assert.equal(chapter.status, 'ready-to-unify');
    assert.equal(chapter.legacyJapaneseV1Covered, true);
    assert.equal(chapter.verificationCovered, true);
  }

  for (const chapter of plan.chapters.slice(26)) {
    assert.equal(chapter.status, 'needs-legacy-and-verification');
    assert.equal(chapter.legacyJapaneseV1Covered, false);
    assert.equal(chapter.verificationCovered, false);
    assert.match(chapter.nextAction, /Create Japanese v1 coverage/);
  }
});

test('keeps derived papers and verification outputs out of blind merge scope', () => {
  const plan = buildAddressMorphismUnificationPlan();

  assert.match(plan.sourcePolicy.canonicalCurrent, /paper\/00-29/);
  assert.ok(plan.sourcePolicy.legacyReferences.some(path => path.includes('ja-v1-master')));
  assert.ok(plan.sourcePolicy.generatedOrDerivedReferences.includes('output/pdf'));
  assert.ok(plan.sourcePolicy.doNotMergeBlindly.includes('ZK predicate papers'));
  assert.ok(plan.migrationSteps.some(step => step.includes('without deleting legacy references')));
});
