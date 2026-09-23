import { test } from 'node:test';
import assert from 'node:assert/strict';

import { APP_SURFACES } from './appNavigation';
import {
  EXPERT_DISCIPLINES,
  getAppExpertReviews,
  getP0AppExpertReviews,
  summarizeMultidisciplinaryAppAudit,
  validateMultidisciplinaryAppAudit,
} from './appExpertAudit';

test('multidisciplinary app audit covers every registered app surface', () => {
  const reviews = getAppExpertReviews();
  const reviewedIds = reviews.map(review => review.surfaceId).sort();
  const surfaceIds = APP_SURFACES.map(surface => surface.id).sort();

  assert.deepEqual(reviewedIds, surfaceIds);
  assert.equal(validateMultidisciplinaryAppAudit(reviews).valid, true);
});

test('app audit keeps research-grade role and evidence coverage', () => {
  const reviews = getAppExpertReviews();
  const disciplineIds = new Set(EXPERT_DISCIPLINES.map(discipline => discipline.id));

  for (const review of reviews) {
    assert.ok(review.reviewerRoles.length >= 4, review.surfaceId);
    assert.ok(review.concerns.length >= 3, review.surfaceId);
    assert.ok(review.requiredExperiments.length >= 3, review.surfaceId);
    assert.ok(review.testGates.length >= 3, review.surfaceId);
    assert.ok(review.reviewerRoles.every(role => disciplineIds.has(role)), review.surfaceId);
    assert.ok(review.concerns.every(concern => disciplineIds.has(concern.discipline)), review.surfaceId);
  }
});

test('app audit prioritizes privacy-critical P0 surfaces', () => {
  const p0 = getP0AppExpertReviews();
  const ids = p0.map(review => review.surfaceId);

  for (const required of ['address-registration', 'address-portal', 'settings-policy', 'pos-terminal', 'field-handoff']) {
    assert.ok(ids.includes(required as typeof p0[number]['surfaceId']));
  }

  assert.ok(p0.every(review => review.concerns.some(concern => (
    concern.severity === 'critical' || concern.severity === 'high'
  ))));
});

test('app audit summary is intentionally strict', () => {
  const summary = summarizeMultidisciplinaryAppAudit();

  assert.equal(summary.appCount, APP_SURFACES.length);
  assert.ok(summary.p0 >= 7);
  assert.ok(summary.criticalFindings >= 8);
  assert.ok(summary.highFindings >= 20);
  assert.ok(summary.productionCandidates >= 6);
});
