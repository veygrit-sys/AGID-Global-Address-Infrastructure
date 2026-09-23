import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildNoRawAddressComplianceKit,
  evaluateNoRawAddressCompliancePayload,
  NO_RAW_ADDRESS_COMPLIANCE_KIT_VERSION,
  validateNoRawAddressComplianceKit,
} from './noRawAddressComplianceKit';
import { NO_RAW_ADDRESS_RELEASE_SCAN_VERSION } from './noRawAddressReleaseScan';
import {
  listMandatorySecurityReleaseRequirements,
  SECURITY_MANDATORY_RELEASE_GATE_VERSION,
} from './securityMandatoryReleaseGate';

test('builds a portable no raw address compliance kit', () => {
  const kit = buildNoRawAddressComplianceKit();

  assert.equal(kit.manifest.kitId, 'no-raw-address-compliance-kit');
  assert.equal(kit.manifest.version, NO_RAW_ADDRESS_COMPLIANCE_KIT_VERSION);
  assert.equal(kit.manifest.scanVersion, NO_RAW_ADDRESS_RELEASE_SCAN_VERSION);
  assert.equal(kit.manifest.mandatoryGateVersion, SECURITY_MANDATORY_RELEASE_GATE_VERSION);
  assert.deepEqual(kit.requiredReleaseGates, listMandatorySecurityReleaseRequirements());
  assert.ok(kit.forbiddenRawFields.includes('rawAddress'));
  assert.ok(kit.forbiddenRawFields.includes('agidSCiphertext'));
  assert.ok(kit.allowedPublicSubstitutes.includes('addressCommitment'));
  assert.ok(kit.allowedPublicSubstitutes.includes('nullifierHash'));
});

test('validates the generated kit', () => {
  const validation = validateNoRawAddressComplianceKit(buildNoRawAddressComplianceKit());

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
});

test('covers the major AGID app surfaces', () => {
  const kit = buildNoRawAddressComplianceKit();
  const surfaceIds = kit.surfacePolicies.map(policy => policy.surfaceId);

  assert.ok(surfaceIds.includes('address-registration-element'));
  assert.ok(surfaceIds.includes('pos-terminal'));
  assert.ok(surfaceIds.includes('field-handoff'));
  assert.ok(surfaceIds.includes('address-portal'));
  assert.ok(surfaceIds.includes('dashboard-review-console'));
  assert.ok(surfaceIds.includes('developer-console'));
  assert.ok(surfaceIds.includes('evidence-vault'));
  assert.ok(surfaceIds.includes('hosted-registry-api-webhooks'));
  assert.ok(surfaceIds.includes('drone-locker-ops'));
  assert.ok(surfaceIds.includes('zk-ethereum-optional'));
});

test('accepts the safe public fixture and blocks the unsafe fixture', () => {
  const kit = buildNoRawAddressComplianceKit();
  const safeFixture = kit.fixtures.find(fixture => fixture.expectedValid);
  const unsafeFixture = kit.fixtures.find(fixture => !fixture.expectedValid);

  assert.ok(safeFixture);
  assert.ok(unsafeFixture);

  const safeResult = evaluateNoRawAddressCompliancePayload(safeFixture.payload);
  const unsafeResult = evaluateNoRawAddressCompliancePayload(unsafeFixture.payload);

  assert.equal(safeResult.valid, true);
  assert.equal(safeResult.gate.releaseBlocked, false);
  assert.equal(unsafeResult.valid, false);
  assert.equal(unsafeResult.gate.releaseBlocked, true);
  assert.ok(unsafeResult.scan.findings.some(finding => finding.code === 'private-field-value:rawAddress'));
  assert.ok(unsafeResult.gate.findings.some(finding => finding.code.includes('audit-log-forbidden-field:$.rawAddress')));
});

test('detects raw address leakage in arbitrary release payloads', () => {
  const result = evaluateNoRawAddressCompliancePayload({
    releaseText: '{"rawAddress":"UNSAFE_NONPUBLIC_RAW_ADDRESS_FIXTURE"}',
    terminalSignature: {
      terminalId: 'POS-AUDIT-GAMMA',
      signature: 'SIGSAFEAABBCCDD0011',
      signedAt: '2026-06-20T00:00:00.000Z',
      algorithm: 'ed25519-terminal-receipt-v1',
    },
    alias: {
      value: 'WBA-001122334455',
      ttlSeconds: 120,
    },
    auditLog: {
      redactionApplied: true,
      redactionVersion: NO_RAW_ADDRESS_COMPLIANCE_KIT_VERSION,
      event: {
        eventType: 'handoff.completed',
        waybillAlias: 'WBA-001122334455',
        addressCommitment: 'addr_commitment_synthetic_gamma',
      },
    },
  });

  assert.equal(result.valid, false);
  assert.ok(result.gate.requiredFailed.includes('no-raw-address-test'));
});
