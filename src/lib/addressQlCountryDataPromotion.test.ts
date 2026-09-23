import assert from 'node:assert/strict';
import test from 'node:test';

import { ADDRESSQL_CORE_COUNTRY_REGION_CODES } from './addressQlGlobalCountryPreload';
import {
  ADDRESSQL_COUNTRY_DATA_PROMOTION_VERSION,
  buildAddressQlCountryDataPromotionIndex,
  buildAddressQlCountryDataPromotionRecord,
  summarizeAddressQlCountryDataPromotions,
  validateAddressQlCountryDataPromotions,
} from './addressQlCountryDataPromotion';

const REVIEW_TIME = '2026-07-26T00:00:00Z';

test('P2 promotion index covers every country and fails closed above L1', () => {
  const records = buildAddressQlCountryDataPromotionIndex(
    ADDRESSQL_CORE_COUNTRY_REGION_CODES,
    REVIEW_TIME,
  );
  const summary = summarizeAddressQlCountryDataPromotions(records);

  assert.equal(summary.version, ADDRESSQL_COUNTRY_DATA_PROMOTION_VERSION);
  assert.equal(summary.countryCount, 250);
  assert.deepEqual(summary.reviewCandidateCountryCodes, ['AU', 'GT', 'NZ', 'PA']);
  assert.deepEqual(summary.enabledCountryCodes, []);
  assert.deepEqual(summary.enabledByLevel, { L2: 0, L3: 0, L4: 0, L5: 0 });
  assert.deepEqual(validateAddressQlCountryDataPromotions(records), []);
});

test('GT reaches L3 independent-review candidacy without gaining live validation', () => {
  const gt = buildAddressQlCountryDataPromotionRecord('GT', REVIEW_TIME);
  const l2 = gt.targets.find(target => target.level === 'L2')!;
  const l3 = gt.targets.find(target => target.level === 'L3')!;

  assert.equal(gt.syntheticAdministrativeEvaluationEligible, true);
  assert.match(gt.syntheticHoldoutDigest || '', /^sha256:[0-9a-f]{64}$/);
  assert.equal(gt.highestReviewCandidateLevel, 'L3');
  assert.equal(gt.highestEnabledLevel, null);
  assert.equal(l2.state, 'blocked');
  assert.deepEqual(l2.approvedEvidence, []);
  assert.equal(l3.state, 'review_candidate');
  assert.deepEqual(l3.approvedEvidence, [
    'alias-policy',
    'hierarchy-version',
    'synthetic-holdout',
  ]);
  assert.deepEqual(l3.missingEvidence, [
    'approved-administrative-keys',
    'independent-signature',
    'runtime-adapter',
  ]);
  assert.equal(l3.independentAttestationVerified, false);
  assert.equal(l3.runtimeAdapterId, null);
  assert.ok(l3.sourceIds.includes('segeplan-gt-nbi-municipal-2018'));
});

test('P2 rejects forged enabled promotions with missing trust and runtime evidence', () => {
  const jp = buildAddressQlCountryDataPromotionRecord('JP', REVIEW_TIME);
  const unsafe = {
    ...jp,
    targets: jp.targets.map(target => target.level === 'L2'
      ? {
        ...target,
        state: 'enabled' as const,
      }
      : target),
  };
  const errors = validateAddressQlCountryDataPromotions([unsafe]);

  assert.ok(errors.includes('JP:L2:enabled-with-missing-evidence'));
  assert.ok(errors.includes('JP:L2:enabled-without-runtime-adapter'));
  assert.ok(errors.includes('JP:L2:enabled-without-independent-attestation'));
});

test('expired source reviews remove country candidacy automatically', () => {
  const gt = buildAddressQlCountryDataPromotionRecord('GT', '2026-08-26T00:00:00Z');
  const l3 = gt.targets.find(target => target.level === 'L3')!;

  assert.equal(gt.syntheticAdministrativeEvaluationEligible, false);
  assert.equal(gt.highestReviewCandidateLevel, null);
  assert.equal(l3.state, 'blocked');
  assert.deepEqual(l3.approvedEvidence, []);
  assert.equal(gt.reviewBy, null);
});

test('neutral scopes remain represented but cannot inherit ISO country approvals', () => {
  const scope = buildAddressQlCountryDataPromotionRecord('CL-EA', REVIEW_TIME);

  assert.equal(scope.countryCode, 'CL-EA');
  assert.equal(scope.syntheticAdministrativeEvaluationEligible, false);
  assert.equal(scope.highestReviewCandidateLevel, null);
  assert.ok(scope.targets.every(target => target.state === 'blocked'));
});
