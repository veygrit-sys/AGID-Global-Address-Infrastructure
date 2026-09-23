import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ADDRESS_COVERAGE_POLICY_IDS } from '../lib/addressCoveragePolicy';
import {
  ADDRESS_QUALITY_PUBLIC_FIXTURES,
  evaluateAddressQualityPublicFixture,
  summarizeAddressQualityPublicFixtures,
} from './addressQualityPublicFixtures';

test('address quality public fixtures cover every postal and AGID routing policy', () => {
  const summary = summarizeAddressQualityPublicFixtures();

  assert.equal(summary.total, 4);
  assert.equal(summary.allExpectedPoliciesMatch, true);
  assert.equal(summary.allSafeForPublicFixture, true);

  for (const policyId of ADDRESS_COVERAGE_POLICY_IDS) {
    assert.equal(summary.byPolicy[policyId], 1, `${policyId} should have one public fixture`);
  }

  assert.equal(summary.byQualityState.verified, 2);
  assert.equal(summary.byQualityState.partial, 1);
  assert.equal(summary.byQualityState['manual-required'], 1);
});

test('public fixtures never expose personal address material or secret material', () => {
  for (const fixture of ADDRESS_QUALITY_PUBLIC_FIXTURES) {
    assert.equal(fixture.publicDisplay.rawAddressIncluded, false);
    assert.equal(fixture.publicDisplay.privateMaterialIncluded, false);
    assert.ok(fixture.publicDisplay.allowedFields.includes('quality-state'));
    assert.ok(fixture.publicDisplay.hiddenFields.includes('address-value'));
    assert.ok(fixture.publicDisplay.hiddenFields.includes('person-name'));
    assert.ok(fixture.publicDisplay.hiddenFields.includes('contact-channel'));
    assert.ok(fixture.publicDisplay.hiddenFields.includes('secret-material'));

    const serialized = JSON.stringify({
      fixtureId: fixture.fixtureId,
      countryCode: fixture.countryCode,
      publicDisplay: fixture.publicDisplay,
      evidence: fixture.evidence,
    });
    assert.doesNotMatch(serialized, /street|house|unit|room|phone|email|private key|witness/i);
  }
});

test('fixtures document the expected operator behavior for strong, weak, and missing postal coverage', () => {
  const evaluations = ADDRESS_QUALITY_PUBLIC_FIXTURES.map(evaluateAddressQualityPublicFixture);
  const byId = new Map(evaluations.map(evaluation => [evaluation.fixtureId, evaluation]));

  assert.equal(byId.get('aqf-jp-reliable-postal-autofill')?.actualPolicyId, 'postal-reliable-api');
  assert.match(byId.get('aqf-jp-reliable-postal-autofill')?.operatorNextAction || '', /verified state/i);

  assert.equal(byId.get('aqf-ke-weak-postal-candidates')?.actualPolicyId, 'postal-weak-api');
  assert.match(byId.get('aqf-ke-weak-postal-candidates')?.operatorNextAction || '', /candidate mode/i);

  assert.equal(byId.get('aqf-hk-no-postal-geo-verified')?.actualPolicyId, 'no-postal-strong-geo');
  assert.match(byId.get('aqf-hk-no-postal-geo-verified')?.operatorNextAction || '', /AGID primary/i);

  assert.equal(byId.get('aqf-cf-no-postal-manual-required')?.actualPolicyId, 'no-postal-weak-geo');
  assert.match(byId.get('aqf-cf-no-postal-manual-required')?.operatorNextAction || '', /Manual required/i);
});
