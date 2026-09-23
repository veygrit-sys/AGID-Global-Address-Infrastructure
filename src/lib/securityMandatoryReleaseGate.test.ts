import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  evaluateMandatorySecurityReleaseGate,
  listMandatorySecurityReleaseRequirements,
} from './securityMandatoryReleaseGate';

const VALID_BASE_INPUT = {
  releaseText: 'Public release sample stores commitments, tails, and short aliases only.',
  highRiskMode: false,
  privacyPolicy: {
    noRawAddressByDefault: true,
    rawAddressStorage: false,
    publicPayloadUsesCommitments: true,
    purposeLimited: true,
    highRiskModeReviewed: true,
    externalSharingReviewed: true,
    plaintextTransmissionAllowed: false,
    retentionDays: 14,
    maxRetentionDays: 30,
  },
  terminalSignature: {
    terminalId: 'POS-TYO-01',
    signature: 'SIG-ED25519-0123456789ABCDEF0123456789ABCDEF',
    signedAt: '2026-06-18T03:00:00.000Z',
    algorithm: 'ed25519-terminal-receipt-v1',
  },
  alias: {
    value: 'WBA-AABBCCDDEEFF',
    issuedAt: '2026-06-18T03:00:00.000Z',
    expiresAt: '2026-06-18T03:10:00.000Z',
  },
  auditLog: {
    redactionApplied: true,
    redactionVersion: 'audit-redaction-v1',
    event: {
      eventId: 'evt-redacted-001',
      action: 'handoff.completed',
      waybillAlias: 'WBA-AABBCCDDEEFF',
      addressCommitment: 'address-ref:4d96754f2bdb60b7',
      nullifierTail: 'A1B2C3D4',
      terminalId: 'POS-TYO-01',
      terminalSignatureTail: '89ABCDEF',
      outcome: 'accepted',
    },
  },
};

test('lists the mandatory security gates', () => {
  assert.deepEqual(listMandatorySecurityReleaseRequirements(), [
    'no-raw-address-test',
    'privacy-release-policy',
    'terminal-signature',
    'short-term-alias',
    'audit-log-redaction',
  ]);
});

test('blocks releases that do not declare a privacy release policy', () => {
  const result = evaluateMandatorySecurityReleaseGate({
    ...VALID_BASE_INPUT,
    privacyPolicy: undefined,
  });

  assert.equal(result.valid, false);
  assert.ok(result.requiredFailed.includes('privacy-release-policy'));
  assert.ok(result.findings.some(finding => finding.code === 'privacy-no-raw-address-default-missing'));
});

test('blocks privacy policies that allow raw address storage or plaintext transport', () => {
  const result = evaluateMandatorySecurityReleaseGate({
    ...VALID_BASE_INPUT,
    privacyPolicy: {
      noRawAddressByDefault: false,
      rawAddressStorage: true,
      publicPayloadUsesCommitments: false,
      purposeLimited: false,
      highRiskModeReviewed: false,
      externalSharingReviewed: false,
      plaintextTransmissionAllowed: true,
      retentionDays: 90,
      maxRetentionDays: 30,
    },
  });

  assert.equal(result.valid, false);
  assert.ok(result.requiredFailed.includes('privacy-release-policy'));
  assert.ok(result.findings.some(finding => finding.code === 'privacy-raw-address-storage-enabled'));
  assert.ok(result.findings.some(finding => finding.code === 'privacy-plaintext-transmission-enabled'));
  assert.ok(result.findings.some(finding => finding.code === 'privacy-retention-too-long'));
});

test('passes when no raw address, terminal signature, short alias, and audit redaction are present', () => {
  const result = evaluateMandatorySecurityReleaseGate(VALID_BASE_INPUT);

  assert.equal(result.valid, true);
  assert.equal(result.releaseBlocked, false);
  assert.deepEqual(result.requiredFailed, []);
  assert.deepEqual(result.requiredPassed, listMandatorySecurityReleaseRequirements());
});

test('blocks release text that contains raw address material', () => {
  const result = evaluateMandatorySecurityReleaseGate({
    ...VALID_BASE_INPUT,
    releaseText: '{"rawAddress":"1-2-3 Private Street, Example City"}',
  });

  assert.equal(result.valid, false);
  assert.ok(result.requiredFailed.includes('no-raw-address-test'));
  assert.ok(result.findings.some(finding => finding.code === 'no-raw-address:private-field-value:rawAddress'));
});

test('blocks operational evidence without a terminal signature', () => {
  const result = evaluateMandatorySecurityReleaseGate({
    ...VALID_BASE_INPUT,
    terminalSignature: {
      terminalId: 'POS-TYO-01',
      signedAt: '2026-06-18T03:00:00.000Z',
      algorithm: 'ed25519-terminal-receipt-v1',
    },
  });

  assert.equal(result.valid, false);
  assert.ok(result.requiredFailed.includes('terminal-signature'));
  assert.ok(result.findings.some(finding => finding.code === 'terminal-signature-missing'));
});

test('blocks high-risk aliases that live too long', () => {
  const result = evaluateMandatorySecurityReleaseGate({
    ...VALID_BASE_INPUT,
    highRiskMode: true,
    alias: {
      value: 'WBA-AABBCCDDEEFF',
      issuedAt: '2026-06-18T03:00:00.000Z',
      expiresAt: '2026-06-18T03:10:00.000Z',
    },
  });

  assert.equal(result.valid, false);
  assert.ok(result.requiredFailed.includes('short-term-alias'));
  assert.ok(result.findings.some(finding => finding.code === 'short-term-alias-ttl-too-long'));
});

test('blocks audit logs that keep raw or secret-bearing fields', () => {
  const result = evaluateMandatorySecurityReleaseGate({
    ...VALID_BASE_INPUT,
    auditLog: {
      redactionApplied: true,
      redactionVersion: 'audit-redaction-v1',
      event: {
        eventId: 'evt-leaky',
        rawAddress: '1-2-3 Private Street, Example City',
        proofCode: '123456',
        terminalSignatureTail: '89ABCDEF',
      },
    },
  });

  assert.equal(result.valid, false);
  assert.ok(result.requiredFailed.includes('audit-log-redaction'));
  assert.ok(result.findings.some(finding => finding.code.includes('audit-log-forbidden-field:$.rawAddress')));
  assert.ok(result.findings.some(finding => finding.code.includes('audit-log-forbidden-field:$.proofCode')));
});
