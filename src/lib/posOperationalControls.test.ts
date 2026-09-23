import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildPosDeviceDiagnostics,
  buildPosExceptionAuditCases,
  buildPosHandoffReverificationReport,
  buildPosManagementSnapshot,
  getPosStaffProfile,
  hasPosStaffPermission,
} from './posOperationalControls';
import {
  POS_TERMINAL_EVIDENCE_SIGNATURE_ALGORITHM,
  type PosAcceptanceReceipt,
} from './posAcceptance';
import {
  buildShippingLabelProofStages,
  buildShippingLabelSafetyPolicy,
} from './shippingLabelQr';

function receipt(overrides: Partial<PosAcceptanceReceipt> = {}): PosAcceptanceReceipt {
  return {
    modelVersion: 'agid-pos-acceptance-v1',
    receiptId: 'POS-TEST01',
    accepted: true,
    status: 'accepted',
    channel: 'qr',
    terminalId: 'AGID-POS-001',
    operatorId: 'operator-a',
    purpose: 'retail-pickup',
    createdAt: '2026-06-08T00:00:00.000Z',
    record: {
      recordType: 'AGID',
      entityIdTail: '8TJGH8',
      agidTail: '8TJGH8',
      label: 'AGID / id:8TJGH8',
      rawPayloadStored: false,
    },
    errors: [],
    warnings: [],
    privacyNotes: ['Raw QR/NFC payload is not persisted in the POS receipt.'],
    ...overrides,
  };
}

test('POS staff profiles gate sensitive override and audit operations', () => {
  assert.equal(getPosStaffProfile('cashier').label, 'Cashier');
  assert.equal(hasPosStaffPermission('cashier', 'scan-pos-payload'), true);
  assert.equal(hasPosStaffPermission('cashier', 'override-review'), false);
  assert.equal(hasPosStaffPermission('cashier', 'pair-measuring-instrument'), false);
  assert.equal(hasPosStaffPermission('delivery-supervisor', 'override-review'), true);
  assert.equal(hasPosStaffPermission('delivery-supervisor', 'pair-measuring-instrument'), true);
  assert.equal(hasPosStaffPermission('field-admin', 'view-exception-audit'), true);
});

test('POS device diagnostics distinguish connector-backed devices from keyboard-wedge barcode input', () => {
  const diagnostics = buildPosDeviceDiagnostics({
    checkedAt: '2026-06-08T00:01:00.000Z',
    keyboardWedge: true,
  });

  assert.equal(diagnostics.find((item) => item.kind === 'receipt-printer')?.status, 'offline');
  assert.equal(diagnostics.find((item) => item.kind === 'cash-drawer')?.status, 'offline');
  assert.equal(diagnostics.find((item) => item.kind === 'barcode-reader')?.status, 'ready');
  assert.equal(diagnostics.find((item) => item.kind === 'measurement-instrument')?.status, 'offline');
});

test('POS measuring instrument diagnostics support browser pairing and native connector readiness', () => {
  const pairableDiagnostics = buildPosDeviceDiagnostics({
    checkedAt: '2026-06-08T00:01:30.000Z',
    webSerial: true,
  });
  const pairableMeter = pairableDiagnostics.find((item) => item.kind === 'measurement-instrument');

  assert.equal(pairableMeter?.status, 'warning');
  assert.ok(pairableMeter?.evidence.includes('web-serial-measurement'));
  assert.match(pairableMeter?.operatorAction ?? '', /Pair a WebSerial/u);

  const readyDiagnostics = buildPosDeviceDiagnostics({
    checkedAt: '2026-06-08T00:01:40.000Z',
    nativeConnector: true,
  });
  const readyMeter = readyDiagnostics.find((item) => item.kind === 'measurement-instrument');

  assert.equal(readyMeter?.status, 'ready');
  assert.equal(readyMeter?.requiredPermission, 'pair-measuring-instrument');
});

test('POS exception audit extracts only rejected and review-required receipts', () => {
  const cases = buildPosExceptionAuditCases([
    receipt(),
    receipt({
      receiptId: 'POS-REVIEW',
      status: 'review',
      warnings: ['private-payload-redacted-before-receipt-storage'],
    }),
    receipt({
      receiptId: 'POS-REJECT',
      accepted: false,
      status: 'rejected',
      record: undefined,
      errors: ['unsupported-or-invalid-agid-address-payload'],
    }),
  ]);

  assert.equal(cases.length, 2);
  assert.equal(cases[0].status, 'review');
  assert.equal(cases[1].severity, 'block');
  assert.match(cases[1].operatorAction, /Do not release/u);
});

test('POS handoff reverification clears only when receipt, staff, registry, and required devices pass', () => {
  const diagnostics = buildPosDeviceDiagnostics({
    checkedAt: '2026-06-08T00:02:00.000Z',
    webUsb: true,
    cashDrawerRelay: true,
    keyboardWedge: true,
  });
  const report = buildPosHandoffReverificationReport({
    receipt: receipt({ amount: 1200 }),
    staffRole: 'delivery-supervisor',
    registryFresh: true,
    diagnostics,
    generatedAt: '2026-06-08T00:03:00.000Z',
  });

  assert.equal(report.status, 'cleared');
  assert.equal(report.checks.every((check) => check.state === 'pass'), true);
  assert.equal(report.advancedAudit.score, 100);
  assert.equal(report.advancedAudit.risk, 'low');
  assert.equal(report.advancedAudit.coverage.missing.length, 0);
  assert.ok(report.advancedAudit.nextActions.some((action) => /Archive the redacted audit report/u.test(action)));
});

test('POS handoff reverification blocks rejected receipts even when devices are ready', () => {
  const diagnostics = buildPosDeviceDiagnostics({
    checkedAt: '2026-06-08T00:04:00.000Z',
    nativeConnector: true,
    cashDrawerRelay: true,
    keyboardWedge: true,
  });
  const report = buildPosHandoffReverificationReport({
    receipt: receipt({
      accepted: false,
      status: 'rejected',
      record: undefined,
      errors: ['unsupported-or-invalid-agid-address-payload'],
    }),
    staffRole: 'field-admin',
    registryFresh: true,
    diagnostics,
    generatedAt: '2026-06-08T00:05:00.000Z',
  });

  assert.equal(report.status, 'blocked');
  assert.equal(report.checks.find((check) => check.label === 'Receipt decision')?.state, 'fail');
});

test('POS handoff reverification requires both carrier and recipient waybill evidence', () => {
  const diagnostics = buildPosDeviceDiagnostics({
    checkedAt: '2026-06-08T00:05:30.000Z',
    nativeConnector: true,
    cashDrawerRelay: true,
    keyboardWedge: true,
  });
  const carrierReceipt = receipt({
    receiptId: 'POS-WB-CARRIER',
    status: 'review',
    record: {
      recordType: 'WAYBILL',
      entityIdTail: 'WB001',
      label: 'WAYBILL / id:WB001',
      rawPayloadStored: false,
    },
    shippingLabel: {
      waybillId: 'WB-001',
      waybillAlias: true,
      jti: 'JTI-CARRIER',
      nullifier: 'SLN-WB001',
      riskLevel: 'standard',
      safetyPolicy: buildShippingLabelSafetyPolicy({ riskLevel: 'standard' }),
      scanId: 'WS-CARRIER',
      scanRole: 'carrier',
      proofLevel: 'carrier-accepted',
      proofStages: buildShippingLabelProofStages({
        addressVerified: true,
        carrierScanVerified: true,
        recipientControlVerified: false,
        deliveryCompleted: false,
      }),
      addressVerified: true,
      addressAccuracyStatus: 'verified',
      addressAccuracyDecision: 'accept',
      addressAccuracySources: ['address-reference'],
      carrierScanVerified: true,
      recipientControlVerified: false,
      packageReceiptVerified: false,
      recipientChallengeRequired: false,
      recipientChallengeVerified: false,
      expiresAt: '2026-06-08T00:20:31.000Z',
      terminalEvidenceSignature: 'TSIG-CARRIER-FULL-SIGNATURE-1234567890',
      terminalEvidenceSignatureAlgorithm: POS_TERMINAL_EVIDENCE_SIGNATURE_ALGORITHM,
      terminalSignedAt: '2026-06-08T00:05:31.000Z',
      storePosId: 'AGID-POS-001',
      carrierTerminalId: 'CARRIER-DEVICE-01',
      carrierTerminalSignature: 'CARRIER-SCAN-SIGNATURE-ABCDEFGHIJ',
      carrierTerminalSignedAt: '2026-06-08T00:05:30.000Z',
      dualScanRequired: true,
      proofMethod: 'recipient-secret-commitment',
    },
    warnings: ['recipient-scan-required-for-owner-proof'],
  });
  const recipientReceipt = receipt({
    receiptId: 'POS-WB-RECIPIENT',
    record: {
      recordType: 'WAYBILL',
      entityIdTail: 'WB001',
      label: 'WAYBILL / id:WB001',
      rawPayloadStored: false,
    },
    shippingLabel: {
      waybillId: 'WB-001',
      waybillAlias: true,
      jti: 'JTI-CARRIER',
      nullifier: 'SLN-WB001',
      riskLevel: 'standard',
      safetyPolicy: buildShippingLabelSafetyPolicy({ riskLevel: 'standard' }),
      scanId: 'WS-RECIPIENT',
      scanRole: 'recipient',
      proofLevel: 'recipient-controlled',
      proofStages: buildShippingLabelProofStages({
        addressVerified: true,
        carrierScanVerified: false,
        recipientControlVerified: true,
        deliveryCompleted: false,
      }),
      addressVerified: true,
      addressAccuracyStatus: 'verified',
      addressAccuracyDecision: 'accept',
      addressAccuracySources: ['address-reference'],
      carrierScanVerified: false,
      recipientControlVerified: true,
      packageReceiptVerified: true,
      recipientChallengeRequired: false,
      recipientChallengeVerified: false,
      recipientChallengeHash: 'WCHH-RECIPIENT-CHALLENGE-HASH-1234567890',
      expiresAt: '2026-06-08T00:20:31.000Z',
      terminalEvidenceSignature: 'TSIG-RECIPIENT-FULL-SIGNATURE-ABCDEFGHIJ',
      terminalEvidenceSignatureAlgorithm: POS_TERMINAL_EVIDENCE_SIGNATURE_ALGORITHM,
      terminalSignedAt: '2026-06-08T00:05:32.000Z',
      storePosId: 'AGID-POS-001',
      dualScanRequired: true,
      proofMethod: 'recipient-secret-commitment',
    },
  });

  const partialReport = buildPosHandoffReverificationReport({
    receipt: carrierReceipt,
    receipts: [carrierReceipt],
    staffRole: 'delivery-supervisor',
    registryFresh: true,
    diagnostics,
    generatedAt: '2026-06-08T00:05:31.000Z',
  });
  assert.equal(partialReport.checks.find((check) => check.label === 'Waybill dual scan')?.state, 'attention');
  assert.equal(partialReport.proofLevel, 'carrier-accepted');
  assert.equal(partialReport.evidenceSummary.waybillId, 'WB-001');
  assert.equal(partialReport.evidenceSummary.carrierScanReceipt?.receiptId, 'POS-WB-CARRIER');
  assert.equal(partialReport.evidenceSummary.recipientProofReceipt, undefined);
  assert.equal(partialReport.evidenceSummary.revocationFreshness.state, 'pass');
  assert.equal(partialReport.evidenceSummary.posTerminalSignatures.complete, false);
  assert.equal(partialReport.advancedAudit.risk, 'medium');
  assert.ok(partialReport.advancedAudit.nextActions.some((action) => /Waybill dual scan/u.test(action)));
  assert.ok(partialReport.advancedAudit.timeline.some((event) => event.label === 'Carrier scan receipt'));
  assert.ok(partialReport.advancedAudit.integrityChecks.some((item) => item.label === 'Duplicate nullifier check'));

  const completeReport = buildPosHandoffReverificationReport({
    receipt: carrierReceipt,
    receipts: [carrierReceipt, recipientReceipt],
    staffRole: 'delivery-supervisor',
    registryFresh: true,
    diagnostics,
    generatedAt: '2026-06-08T00:05:32.000Z',
  });
  assert.equal(completeReport.checks.find((check) => check.label === 'Waybill dual scan')?.state, 'pass');
  assert.equal(completeReport.proofLevel, 'delivery-completed');
  assert.equal(completeReport.evidenceSummary.carrierScanReceipt?.carrierTerminalId, 'CARRIER-DEVICE-01');
  assert.equal(completeReport.evidenceSummary.carrierScanReceipt?.terminalSignatureTail, 'E-1234567890');
  assert.equal(completeReport.evidenceSummary.carrierScanReceipt?.carrierTerminalSignatureTail, 'E-ABCDEFGHIJ');
  assert.equal(completeReport.evidenceSummary.recipientProofReceipt?.receiptId, 'POS-WB-RECIPIENT');
  assert.equal(completeReport.evidenceSummary.recipientProofReceipt?.recipientChallengeHashTail, 'H-1234567890');
  assert.equal(completeReport.evidenceSummary.revocationFreshness.state, 'pass');
  assert.equal(completeReport.evidenceSummary.posTerminalSignatures.complete, true);
  assert.equal(completeReport.evidenceSummary.highRiskSafety.active, false);
  assert.equal(completeReport.advancedAudit.privacyPosture.state, 'pass');
  assert.ok(completeReport.advancedAudit.timeline.some((event) => event.label === 'Recipient proof receipt'));
  assert.ok(completeReport.evidenceSummary.decisionReasons.some((reason) => (
    reason.label === 'Waybill dual scan' && reason.state === 'pass'
  )));
  const serializedReport = JSON.stringify(completeReport);
  assert.doesNotMatch(serializedReport, /FULL-SIGNATURE/u);
  assert.doesNotMatch(serializedReport, /CARRIER-SCAN-SIGNATURE/u);

  const highCarrierReceipt = receipt({
    ...carrierReceipt,
    receiptId: 'POS-WB-HIGH-CARRIER',
    status: 'accepted',
    warnings: [],
    shippingLabel: {
      ...carrierReceipt.shippingLabel!,
      riskLevel: 'high',
      safetyPolicy: buildShippingLabelSafetyPolicy({ riskLevel: 'high' }),
      carrierLocation: {
        precision: 'coarse-high-risk',
        latBucket: 35.7,
        lonBucket: 139.8,
        accuracyMeters: 10000,
      },
    },
  });
  const highRecipientReceipt = receipt({
    ...recipientReceipt,
    receiptId: 'POS-WB-HIGH-RECIPIENT',
    shippingLabel: {
      ...recipientReceipt.shippingLabel!,
      riskLevel: 'high',
      safetyPolicy: buildShippingLabelSafetyPolicy({ riskLevel: 'high' }),
      recipientChallengeRequired: true,
      recipientChallengeVerified: true,
    },
  });
  const highRiskReport = buildPosHandoffReverificationReport({
    receipt: highCarrierReceipt,
    receipts: [highCarrierReceipt, highRecipientReceipt],
    staffRole: 'delivery-supervisor',
    registryFresh: true,
    diagnostics,
    generatedAt: '2026-06-08T00:05:33.000Z',
  });
  assert.equal(highRiskReport.evidenceSummary.highRiskSafety.active, true);
  assert.equal(highRiskReport.evidenceSummary.highRiskSafety.state, 'pass');
  assert.equal(highRiskReport.evidenceSummary.highRiskSafety.mode, 'high-risk');
  assert.equal(highRiskReport.checks.find((check) => check.label === 'High-risk safety mode')?.state, 'pass');
  assert.ok(highRiskReport.advancedAudit.privacyPosture.controls.includes('High-risk AGID-S-only controls'));
});

test('POS management snapshot summarizes receipts, registry, devices, keys, and risks', () => {
  const diagnostics = buildPosDeviceDiagnostics({
    checkedAt: '2026-06-08T00:06:00.000Z',
    keyboardWedge: true,
  });
  const snapshot = buildPosManagementSnapshot({
    terminalId: 'AGID-POS-001',
    operatorId: '',
    staffRole: 'pickup-operator',
    receipts: [
      receipt(),
      receipt({
        receiptId: 'POS-REVIEW',
        status: 'review',
        warnings: ['recipient-scan-required-for-owner-proof'],
      }),
      receipt({
        receiptId: 'POS-REJECT',
        accepted: false,
        status: 'rejected',
        record: undefined,
        errors: ['unsupported-or-invalid-agid-address-payload'],
      }),
    ],
    latestReceipt: receipt({
      receiptId: 'POS-REJECT',
      accepted: false,
      status: 'rejected',
      record: undefined,
      errors: ['unsupported-or-invalid-agid-address-payload'],
    }),
    registryFresh: false,
    diagnostics,
    activeSecureKeys: 0,
    totalSecureKeys: 2,
    syncState: 'error',
    generatedAt: '2026-06-08T00:07:00.000Z',
  });

  assert.equal(snapshot.grade, 'blocked');
  assert.equal(snapshot.metrics.find((item) => item.label === 'Receipts')?.value, '3');
  assert.ok(snapshot.risks.some((risk) => risk.workspace === 'audit' && risk.severity === 'critical'));
  assert.ok(snapshot.risks.some((risk) => risk.workspace === 'registry'));
  assert.ok(snapshot.risks.some((risk) => risk.workspace === 'keys'));
});

test('POS management snapshot is ready when required posture is clean', () => {
  const diagnostics = buildPosDeviceDiagnostics({
    checkedAt: '2026-06-08T00:08:00.000Z',
    nativeConnector: true,
    cashDrawerRelay: true,
    keyboardWedge: true,
  });
  const snapshot = buildPosManagementSnapshot({
    terminalId: 'AGID-POS-001',
    operatorId: 'operator-a',
    staffRole: 'delivery-supervisor',
    receipts: [receipt()],
    latestReceipt: receipt(),
    registryFresh: true,
    diagnostics,
    activeSecureKeys: 1,
    totalSecureKeys: 1,
    syncState: 'idle',
    generatedAt: '2026-06-08T00:09:00.000Z',
  });

  assert.equal(snapshot.grade, 'ready');
  assert.equal(snapshot.risks.length, 0);
  assert.equal(snapshot.metrics.find((item) => item.label === 'Registry')?.tone, 'ok');
});
