import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assessAddressQlMultilingualRoute,
  buildAddressQlMultilingualQualityIndex,
  summarizeAddressQlMultilingualQuality,
  validateAddressQlMultilingualQuality,
} from './addressQlMultilingualQuality';

const records = buildAddressQlMultilingualQualityIndex();

test('P3 multilingual quality covers every profile without automatic translation claims', () => {
  const summary = summarizeAddressQlMultilingualQuality(records);

  assert.equal(summary.countryCount, 276);
  assert.equal(summary.nativeFormatEnabledProfiles, 271);
  assert.equal(summary.internationalEnglishFormatEnabledProfiles, 271);
  assert.ok(summary.transliterationReviewCandidateProfiles > 200);
  assert.equal(summary.verifiedTranslationReviewCandidateProfiles, 6);
  assert.equal(summary.automaticPlaceNameTranslationEnabledProfiles, 0);
  assert.deepEqual(validateAddressQlMultilingualQuality(records), []);
});

test('Japanese and Chinese profiles expose contextual evidence without claiming M4', () => {
  const jp = records.find(record => record.countryCode === 'JP')!;
  const tw = records.find(record => record.countryCode === 'TW')!;
  const jpM4 = jp.gates.find(gate => gate.level === 'M4')!;
  const twM4 = tw.gates.find(gate => gate.level === 'M4')!;

  assert.equal(jp.highestEnabledLevel, 'M2');
  assert.equal(jp.highestReviewCandidateLevel, 'M4');
  assert.equal(jpM4.state, 'review_candidate');
  assert.ok(jpM4.observedEvidence.includes('holdout-engine:japanese-contextual-reading'));
  assert.ok(jpM4.missingEvidence.includes('independent-signature'));
  assert.equal(twM4.state, 'review_candidate');
  assert.ok(tw.adapterFamilies.includes('chinese-regional-place-name'));
  assert.equal(jp.automaticPlaceNameTranslationEnabled, false);
});

test('international English formatting remains review-required for translated place names', () => {
  const jp = records.find(record => record.countryCode === 'JP')!;
  const assessment = assessAddressQlMultilingualRoute({
    record: jp,
    sourceLanguage: 'ja',
    targetLanguage: 'en',
    purpose: 'international-shipping',
  });

  assert.equal(assessment.status, 'review_required');
  assert.equal(assessment.mode, 'international-english-formatting');
  assert.equal(assessment.formatReady, true);
  assert.equal(assessment.automaticTransformationAllowed, false);
  assert.equal(assessment.translationVerified, false);
  assert.ok(assessment.missingEvidence.includes('source-gated-place-aliases'));
});

test('identity normalization is ready while undeclared languages remain blocked', () => {
  const gt = records.find(record => record.countryCode === 'GT')!;
  const identity = assessAddressQlMultilingualRoute({
    record: gt,
    sourceLanguage: 'es',
    targetLanguage: 'es',
    purpose: 'domestic',
  });
  const undeclared = assessAddressQlMultilingualRoute({
    record: gt,
    sourceLanguage: 'ru',
    targetLanguage: 'en',
    purpose: 'international-shipping',
  });

  assert.equal(identity.status, 'ready');
  assert.equal(identity.automaticTransformationAllowed, true);
  assert.equal(identity.translationVerified, false);
  assert.equal(undeclared.status, 'blocked');
  assert.equal(undeclared.reasonCode, 'country_language_not_declared');
});

test('non-addressable profiles retain language metadata without inventing layouts', () => {
  const hm = records.find(record => record.countryCode === 'HM')!;

  assert.equal(hm.gates.find(gate => gate.level === 'M0')?.state, 'enabled');
  assert.equal(hm.gates.find(gate => gate.level === 'M1')?.state, 'not_applicable');
  assert.equal(hm.gates.find(gate => gate.level === 'M2')?.state, 'not_applicable');
  assert.equal(hm.highestEnabledLevel, 'M0');
});
