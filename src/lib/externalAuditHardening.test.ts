import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  evaluateExternalAuditHardening,
  getExternalAuditHardeningPlan,
} from './externalAuditHardening';

test('defines external audit controls and packets for release, ZK, hosted, and field scopes', () => {
  const plan = getExternalAuditHardeningPlan();

  assert.equal(plan.version, 'external-audit-hardening-v1');
  assert.ok(plan.controls.length >= 10);
  assert.deepEqual(
    plan.controls.filter(control => control.priority === 'P0').map(control => control.id),
    [
      'p0-threat-model-and-security-policy',
      'p0-release-artifact-hygiene',
      'p0-privacy-and-no-raw-address-audit',
      'p0-zk-production-claim-audit',
      'p0-data-license-and-provenance-audit',
    ],
  );
  assert.ok(plan.packets.some(packet => packet.id === 'oss-release-packet'));
  assert.ok(plan.packets.some(packet => packet.id === 'production-zk-packet'));
  assert.ok(plan.publicDisclosureRules.some(rule => rule.includes('Do not publish real addresses')));
});

test('blocks an unsafe OSS or production release when audit fundamentals are missing', () => {
  const evaluation = evaluateExternalAuditHardening({
    threatModelReviewed: 'missing',
    securityPolicyPresent: false,
    secretScanClean: false,
    privateFixtureScanClean: false,
    rawAddressLogScanClean: false,
    dependencyAuditReviewed: 'missing',
    releaseChecksumsOrSignatures: false,
    reproducibleBuildNotes: false,
    dataLicenseBomComplete: false,
    privacyDpiaReviewed: 'missing',
    accessibilityAuditReviewed: 'missing',
    zkCircuitAuditReviewed: 'missing',
    publicSignalLeakageTested: false,
    witnessHygieneTested: false,
    hostedRegistryPenTestReviewed: 'missing',
    posHandoffAbuseReviewed: 'missing',
    incidentRunbookTested: false,
    auditorAccessRedacted: false,
    productionZkClaim: true,
    hostedProductionClaim: true,
  });

  assert.equal(evaluation.valid, false);
  assert.equal(evaluation.grade, 'blocked');
  assert.ok(evaluation.blockers.includes('threat-model-not-reviewed'));
  assert.ok(evaluation.blockers.includes('secret-scan-not-clean'));
  assert.ok(evaluation.blockers.includes('raw-address-log-scan-not-clean'));
  assert.ok(evaluation.blockers.includes('production-zk-claim-without-external-crypto-audit'));
  assert.ok(evaluation.blockers.includes('hosted-production-without-external-api-pentest'));
  assert.ok(evaluation.requiredScopes.includes('repository'));
  assert.ok(evaluation.requiredScopes.includes('release-artifacts'));
  assert.ok(evaluation.requiredScopes.includes('zk-cryptography'));
  assert.ok(evaluation.requiredScopes.includes('hosted-registry'));
});

test('keeps internal readiness gaps as attention items before stronger claims', () => {
  const evaluation = evaluateExternalAuditHardening({
    threatModelReviewed: 'internal-reviewed',
    securityPolicyPresent: true,
    secretScanClean: true,
    privateFixtureScanClean: true,
    rawAddressLogScanClean: true,
    dependencyAuditReviewed: 'planned',
    releaseChecksumsOrSignatures: true,
    reproducibleBuildNotes: false,
    dataLicenseBomComplete: true,
    privacyDpiaReviewed: 'planned',
    accessibilityAuditReviewed: 'planned',
    zkCircuitAuditReviewed: 'planned',
    publicSignalLeakageTested: false,
    witnessHygieneTested: false,
    hostedRegistryPenTestReviewed: 'planned',
    posHandoffAbuseReviewed: 'planned',
    incidentRunbookTested: false,
    auditorAccessRedacted: true,
    productionZkClaim: false,
    hostedProductionClaim: false,
  });

  assert.equal(evaluation.valid, true);
  assert.equal(evaluation.grade, 'attention');
  assert.ok(evaluation.warnings.includes('dependency-audit-not-reviewed'));
  assert.ok(evaluation.warnings.includes('privacy-dpia-not-reviewed'));
  assert.ok(evaluation.warnings.includes('accessibility-audit-not-reviewed'));
  assert.ok(evaluation.warnings.includes('public-signal-leakage-not-tested'));
  assert.ok(evaluation.requiredScopes.includes('accessibility'));
  assert.ok(evaluation.requiredScopes.includes('incident-response'));
});

test('accepts a fully reviewed external audit posture', () => {
  const evaluation = evaluateExternalAuditHardening({
    threatModelReviewed: 'external-reviewed',
    securityPolicyPresent: true,
    secretScanClean: true,
    privateFixtureScanClean: true,
    rawAddressLogScanClean: true,
    dependencyAuditReviewed: 'continuous',
    releaseChecksumsOrSignatures: true,
    reproducibleBuildNotes: true,
    dataLicenseBomComplete: true,
    privacyDpiaReviewed: 'external-reviewed',
    accessibilityAuditReviewed: 'external-reviewed',
    zkCircuitAuditReviewed: 'external-reviewed',
    publicSignalLeakageTested: true,
    witnessHygieneTested: true,
    hostedRegistryPenTestReviewed: 'external-reviewed',
    posHandoffAbuseReviewed: 'external-reviewed',
    incidentRunbookTested: true,
    auditorAccessRedacted: true,
    productionZkClaim: true,
    hostedProductionClaim: true,
  });

  assert.equal(evaluation.valid, true);
  assert.equal(evaluation.grade, 'ready');
  assert.equal(evaluation.score, 100);
  assert.deepEqual(evaluation.blockers, []);
  assert.deepEqual(evaluation.warnings, []);
});
