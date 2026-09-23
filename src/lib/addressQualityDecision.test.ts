import assert from 'node:assert/strict';
import { test } from 'node:test';

import { decideAddressQuality } from './addressQualityDecision';
import type { AddressTabQualityScore } from './addressTabQuality';
import type { AddressValidationResult } from './addressValidation';

const verifiedValidation: AddressValidationResult = {
  status: 'verified',
  score: 0.94,
  postalCodeValid: true,
  missingRequiredFields: [],
  warnings: [],
  checkedWith: ['official-postal', 'openaddresses'],
  quality: {
    mode: 'postal-verified',
    label: 'Verified',
    reason: 'Postal evidence agrees.',
    canAutofill: true,
    shouldOverwriteUserInput: true,
  },
  displays: {},
};

const stableTab: Pick<AddressTabQualityScore, 'decision' | 'score' | 'tier' | 'needsReverification' | 'reasons'> = {
  decision: 'show',
  score: 92,
  tier: 'stable',
  needsReverification: false,
  reasons: ['stable country, language, source, and display evidence'],
};

test('address quality decision returns Address OK for stable verified display evidence', () => {
  const decision = decideAddressQuality({
    tabQuality: stableTab,
    validation: verifiedValidation,
    displayQuality: { score: 0.9, isWeak: false },
  });

  assert.equal(decision.state, 'address-ok');
  assert.equal(decision.label, 'OK');
  assert.equal(decision.severity, 0);
});

test('address quality decision returns Needs Review for visible but limited confidence address displays', () => {
  const decision = decideAddressQuality({
    tabQuality: { ...stableTab, decision: 'warn', score: 66, tier: 'caution' },
    validation: { ...verifiedValidation, status: 'partial', score: 0.7 },
    displayQuality: { score: 0.8, isWeak: false },
  });

  assert.equal(decision.state, 'needs-review');
  assert.ok(decision.reasonCodes.includes('tab-confidence-limited'));
  assert.ok(decision.reasonCodes.includes('validation-partial'));
});

test('address quality decision returns Rejected for missing fields or invalid postcode', () => {
  const decision = decideAddressQuality({
    tabQuality: { ...stableTab, decision: 'reverify', score: 54, tier: 'low', needsReverification: true },
    validation: {
      ...verifiedValidation,
      status: 'partial',
      postalCodeValid: false,
      missingRequiredFields: ['recipient', 'street'],
      quality: {
        ...verifiedValidation.quality,
        mode: 'partial-postal',
        label: 'Partial',
      },
    },
    displayQuality: { score: 0.62, isWeak: false },
  });

  assert.equal(decision.state, 'rejected');
  assert.equal(decision.label, 'Rejected');
  assert.ok(decision.reasonCodes.includes('postal-code-invalid'));
  assert.ok(decision.reasonCodes.includes('missing-required-fields'));
});

test('address quality decision returns Restricted when the selected tab is hidden or display is weak', () => {
  const hidden = decideAddressQuality({
    tabQuality: { ...stableTab, decision: 'hide', score: 28, tier: 'hidden' },
    validation: null,
    displayQuality: { score: 0.2, isWeak: true },
  });

  assert.equal(hidden.state, 'restricted');
  assert.equal(hidden.label, 'Restricted');
  assert.ok(hidden.reasonCodes.includes('address-tab-hidden'));

  const weak = decideAddressQuality({
    tabQuality: { ...stableTab, score: 40, tier: 'low' },
    validation: verifiedValidation,
    displayQuality: { score: 0.25, isWeak: true },
  });

  assert.equal(weak.state, 'restricted');
  assert.ok(weak.reasonCodes.includes('weak-display'));
});
