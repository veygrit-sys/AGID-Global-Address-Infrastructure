import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESS_VALIDATION_MINIMUM_SCORE,
  buildAddressValidationQualityFloorReport,
  validateAddressValidationQualityFloorReport,
} from './addressValidationQualityFloor';

test('every address-validation engineering dimension meets the 80-point floor', () => {
  const report = buildAddressValidationQualityFloorReport();

  assert.equal(report.engineeringQualityFloorPassed, true);
  assert.equal(report.engineeringDimensions.length, 10);
  for (const dimension of report.engineeringDimensions) {
    assert.ok(
      dimension.score >= ADDRESS_VALIDATION_MINIMUM_SCORE,
      `${dimension.id} scored ${dimension.score}`,
    );
    assert.equal(dimension.passed, true);
  }
  assert.deepEqual(validateAddressValidationQualityFloorReport(report), []);
});

test('production evidence remains fail-closed until independent live evidence exists', () => {
  const report = buildAddressValidationQualityFloorReport();

  assert.equal(report.productionEvidenceReady, false);
  assert.ok(report.blockingGates.includes(
    'live-official-postal-evidence:trusted-independent-key',
  ));
  assert.ok(report.blockingGates.includes(
    'live-delivery-reachability-evidence:live-carrier-report',
  ));
  assert.ok(report.blockingGates.includes(
    'live-freshness-correction-operations:signed-release-ledger',
  ));
});

test('quality report exposes synthetic and aggregate evidence only', () => {
  const report = buildAddressValidationQualityFloorReport();
  const serialized = JSON.stringify(report).toLowerCase();

  assert.equal(report.privacy.syntheticAndAggregateEvidenceOnly, true);
  assert.equal(report.privacy.containsRawAddress, false);
  assert.equal(report.privacy.containsRecipientData, false);
  assert.equal(report.privacy.containsPreciseCoordinates, false);
  assert.equal(report.privacy.containsQueryLogs, false);
  assert.doesNotMatch(serialized, /recipient name|street address|latitude|longitude/);
});
