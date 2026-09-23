import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildDeliveryPosSimulationCases,
  deriveDeliveryPosRequirementMap,
  simulateDeliveryPosCase,
  summarizeDeliveryPosSimulation,
} from './deliveryPosSimulation';

test('delivery POS simulation covers domestic and cross-border roles', () => {
  const cases = buildDeliveryPosSimulationCases();
  const roles = new Set(cases.flatMap(scenario => scenario.goals.map(goal => goal.role)));

  assert.equal(cases.length, 4);
  assert.ok(cases.some(scenario => scenario.kind === 'domestic'));
  assert.ok(cases.some(scenario => scenario.kind === 'cross-border'));
  assert.ok(roles.has('sender'));
  assert.ok(roles.has('receptionist'));
  assert.ok(roles.has('delivery-operator'));
  assert.ok(roles.has('recipient'));
  assert.ok(roles.has('manager'));
  assert.ok(roles.has('cross-border-reviewer'));
});

test('domestic happy path exposes scan, trust, language, handoff, and reverification screens', () => {
  const scenario = buildDeliveryPosSimulationCases()
    .find(item => item.id === 'domestic-standard-handoff');
  assert.ok(scenario);

  const result = simulateDeliveryPosCase(scenario);
  assert.equal(result.finalDecision, 'completed');
  assert.deepEqual(result.missingScreens, []);
  assert.deepEqual(result.missingButtons, []);
  assert.ok(result.visitedScreens.includes('scan-intake'));
  assert.ok(result.visitedScreens.includes('decrypt-trust'));
  assert.ok(result.visitedScreens.includes('address-resolution'));
  assert.ok(result.visitedScreens.includes('handoff'));
  assert.ok(result.visitedScreens.includes('reverification-report'));
  assert.ok(result.usedButtons.includes('switch-address-language'));
  assert.ok(result.usedButtons.includes('print-redacted-label'));
});

test('domestic exception path requires audit, diagnostics, and deferred sync controls', () => {
  const scenario = buildDeliveryPosSimulationCases()
    .find(item => item.id === 'domestic-review-device-registry');
  assert.ok(scenario);

  const result = simulateDeliveryPosCase(scenario);
  assert.equal(result.finalDecision, 'review');
  assert.deepEqual(result.missingScreens, []);
  assert.deepEqual(result.missingButtons, []);
  assert.ok(result.visitedScreens.includes('exception-audit'));
  assert.ok(result.visitedScreens.includes('device-diagnostics'));
  assert.ok(result.visitedScreens.includes('offline-sync-queue'));
  assert.ok(result.usedButtons.includes('check-registry'));
  assert.ok(result.usedButtons.includes('manager-override'));
  assert.ok(result.usedButtons.includes('run-printer-test'));
  assert.ok(result.usedButtons.includes('pair-barcode-reader'));
});

test('cross-border accepted flow keeps trade data advisory and cached', () => {
  const scenario = buildDeliveryPosSimulationCases()
    .find(item => item.id === 'cross-border-standard-handoff');
  assert.ok(scenario);

  const result = simulateDeliveryPosCase(scenario);
  assert.equal(result.finalDecision, 'completed');
  assert.deepEqual(result.missingScreens, []);
  assert.deepEqual(result.missingButtons, []);
  assert.ok(result.visitedScreens.includes('cross-border-declaration'));
  assert.ok(result.visitedScreens.includes('cross-border-risk-review'));
  assert.ok(result.usedButtons.includes('enter-hs-code'));
  assert.ok(result.usedButtons.includes('check-customs-evidence'));
  assert.ok(result.usedButtons.includes('estimate-duty'));
  assert.ok(scenario.openSourceData.includes('datasets-harmonized-system'));
  assert.ok(scenario.openSourceData.includes('wto-tariff-data'));
  assert.ok(scenario.assumptions.some(item => /not as a final customs ruling/i.test(item)));
});

test('cross-border incomplete flow holds for review and redacted audit export', () => {
  const scenario = buildDeliveryPosSimulationCases()
    .find(item => item.id === 'cross-border-customs-review');
  assert.ok(scenario);

  const result = simulateDeliveryPosCase(scenario);
  assert.equal(result.finalDecision, 'review');
  assert.deepEqual(result.missingScreens, []);
  assert.deepEqual(result.missingButtons, []);
  assert.ok(result.visitedScreens.includes('exception-audit'));
  assert.ok(result.usedButtons.includes('request-manual-address-review'));
  assert.ok(result.usedButtons.includes('mark-customs-review'));
  assert.ok(result.usedButtons.includes('export-audit-report'));
  assert.ok(scenario.surfacedGaps.some(item => /missing HS code/i.test(item)));
  assert.ok(scenario.surfacedGaps.some(item => /redact address/i.test(item)));
});

test('requirement map reveals needed screens, buttons, transitions, and OSS data', () => {
  const map = deriveDeliveryPosRequirementMap();
  const screenIds = new Set(map.screens.map(screen => screen.id));
  const buttonIds = new Set(map.buttons.map(button => button.id));

  assert.equal(map.version, 'delivery-pos-simulation-v1');
  assert.equal(map.scenarios, 4);
  assert.ok(screenIds.has('scan-intake'));
  assert.ok(screenIds.has('device-diagnostics'));
  assert.ok(screenIds.has('exception-audit'));
  assert.ok(screenIds.has('cross-border-declaration'));
  assert.ok(screenIds.has('cross-border-risk-review'));
  assert.ok(buttonIds.has('scan-qr'));
  assert.ok(buttonIds.has('scan-nfc'));
  assert.ok(buttonIds.has('accept-domestic-shipment'));
  assert.ok(buttonIds.has('hold-for-review'));
  assert.ok(buttonIds.has('manager-override'));
  assert.ok(buttonIds.has('enter-hs-code'));
  assert.ok(buttonIds.has('check-customs-evidence'));
  assert.ok(map.openSourceData.includes('datasets-harmonized-system'));
  assert.ok(map.openSourceData.includes('frankfurter-self-host'));
  assert.ok(map.transitions.length >= 20);
  assert.ok(map.gaps.some(gap => /Decision banner/i.test(gap)));
});

test('summary keeps simulation executable and gap-free at the required-control level', () => {
  const summary = summarizeDeliveryPosSimulation();

  assert.equal(summary.scenarioCount, 4);
  assert.equal(summary.domesticCount, 2);
  assert.equal(summary.crossBorderCount, 2);
  assert.equal(summary.completedCount, 2);
  assert.equal(summary.reviewCount, 2);
  assert.equal(summary.missingScreenCount, 0);
  assert.equal(summary.missingButtonCount, 0);
});
