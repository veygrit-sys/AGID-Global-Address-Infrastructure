import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  evaluateAccessibilityHardening,
  getAccessibilityHardeningPlan,
} from './accessibilityHardening';

test('defines accessibility hardening gates for AGID operational surfaces', () => {
  const plan = getAccessibilityHardeningPlan();

  assert.equal(plan.version, 'accessibility-hardening-v1');
  assert.ok(plan.measures.length >= 10);
  assert.deepEqual(
    plan.measures.filter(measure => measure.priority === 'P0').map(measure => measure.id),
    [
      'p0-keyboard-primary-path',
      'p0-visible-focus',
      'p0-programmatic-status',
      'p0-contrast-and-not-color-only',
      'p0-language-direction-sync',
    ],
  );
  assert.ok(plan.releaseGates.some(gate => gate.includes('Keyboard-only')));
  assert.ok(plan.releaseGates.some(gate => gate.includes('High-risk mode')));
});

test('blocks surfaces that cannot be completed by keyboard or assistive technology', () => {
  const evaluation = evaluateAccessibilityHardening({
    surface: 'pos-terminal',
    keyboardPrimaryPath: false,
    focusVisible: false,
    focusRestoredAfterModal: false,
    decisionAnnounced: false,
    warningsProgrammatic: false,
    usesColorOnlyStatus: true,
    minimumContrastRatio: 3.2,
    languageAndDirectionSynced: false,
    reducedMotionSupported: false,
    minimumTouchTargetPx: 36,
    formErrorsLinked: false,
    mapHasKeyboardAlternative: false,
    highRiskMode: true,
    privacyRiskAnnounced: false,
    rawAddressHiddenInHighRisk: false,
  });

  assert.equal(evaluation.valid, false);
  assert.equal(evaluation.grade, 'blocked');
  assert.ok(evaluation.blockers.includes('keyboard-primary-path-blocked'));
  assert.ok(evaluation.blockers.includes('focus-indicator-missing'));
  assert.ok(evaluation.blockers.includes('decision-not-announced'));
  assert.ok(evaluation.blockers.includes('warnings-not-programmatic'));
  assert.ok(evaluation.blockers.includes('color-only-status'));
  assert.ok(evaluation.blockers.includes('contrast-below-4.5'));
  assert.ok(evaluation.blockers.includes('language-direction-not-synced'));
  assert.ok(evaluation.blockers.includes('high-risk-raw-address-visible'));
  assert.ok(evaluation.requiredSurfaces.includes('map-canvas'));
  assert.ok(evaluation.requiredSurfaces.includes('high-risk-mode'));
});

test('keeps non-blocking issues as attention items with concrete surfaces', () => {
  const evaluation = evaluateAccessibilityHardening({
    surface: 'address-registration',
    keyboardPrimaryPath: true,
    focusVisible: true,
    focusRestoredAfterModal: false,
    decisionAnnounced: true,
    warningsProgrammatic: true,
    usesColorOnlyStatus: false,
    minimumContrastRatio: 4.8,
    languageAndDirectionSynced: true,
    reducedMotionSupported: false,
    minimumTouchTargetPx: 40,
    formErrorsLinked: false,
    mapHasKeyboardAlternative: false,
    highRiskMode: true,
    privacyRiskAnnounced: false,
    rawAddressHiddenInHighRisk: true,
  });

  assert.equal(evaluation.valid, true);
  assert.equal(evaluation.grade, 'attention');
  assert.ok(evaluation.warnings.includes('focus-not-restored-after-modal'));
  assert.ok(evaluation.warnings.includes('contrast-aa-but-not-enhanced'));
  assert.ok(evaluation.warnings.includes('reduced-motion-not-supported'));
  assert.ok(evaluation.warnings.includes('touch-target-too-small:40'));
  assert.ok(evaluation.warnings.includes('form-errors-not-linked'));
  assert.ok(evaluation.warnings.includes('map-keyboard-alternative-missing'));
  assert.ok(evaluation.warnings.includes('high-risk-privacy-not-explained'));
  assert.ok(evaluation.requiredSurfaces.includes('portal-consent'));
});

test('accepts a complete accessible handoff surface', () => {
  const evaluation = evaluateAccessibilityHardening({
    surface: 'pos-terminal',
    keyboardPrimaryPath: true,
    focusVisible: true,
    focusRestoredAfterModal: true,
    decisionAnnounced: true,
    warningsProgrammatic: true,
    usesColorOnlyStatus: false,
    minimumContrastRatio: 7,
    languageAndDirectionSynced: true,
    reducedMotionSupported: true,
    minimumTouchTargetPx: 48,
    formErrorsLinked: true,
    mapHasKeyboardAlternative: true,
    highRiskMode: false,
    privacyRiskAnnounced: true,
    rawAddressHiddenInHighRisk: true,
  });

  assert.equal(evaluation.valid, true);
  assert.equal(evaluation.grade, 'ready');
  assert.equal(evaluation.score, 100);
  assert.deepEqual(evaluation.blockers, []);
  assert.deepEqual(evaluation.warnings, []);
});
