import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildDeviceDiagnosticsPrintDocument,
  buildExceptionAuditPrintDocument,
  buildHandoffReverificationPrintDocument,
  buildManagementSummaryPrintDocument,
  buildOfflineQueuePrintDocument,
  buildRedactedReceiptPrintDocument,
  buildShippingLabelSlipPrintDocument,
} from './posPrint';
import {
  POS_TERMINAL_EVIDENCE_SIGNATURE_ALGORITHM,
  type PosAcceptanceReceipt,
} from './posAcceptance';
import {
  buildPosDeviceDiagnostics,
  buildPosExceptionAuditCases,
  buildPosHandoffReverificationReport,
  buildPosManagementSnapshot,
} from './posOperationalControls';
import {
  buildShippingLabelProofStages,
  buildShippingLabelSafetyPolicy,
} from './shippingLabelQr';

function receipt(overrides: Partial<PosAcceptanceReceipt> = {}): PosAcceptanceReceipt {
  return {
    modelVersion: 'agid-pos-acceptance-v1',
    receiptId: 'POS-PRINT01',
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
      country: 'JP',
      city: 'Tokyo',
      postcode: '1000001',
      label: 'AGID / id:8TJGH8',
      rawPayloadStored: false,
    },
    errors: [],
    warnings: [],
    privacyNotes: ['Raw QR/NFC payload is not persisted in the POS receipt.'],
    ...overrides,
  };
}

function waybillReceipt(overrides: Partial<PosAcceptanceReceipt> = {}) {
  return receipt({
    record: {
      recordType: 'WAYBILL',
      entityIdTail: 'WBA-1234',
      label: 'WAYBILL / id:WBA-1234',
      rawPayloadStored: false,
    },
    shippingLabel: {
      waybillId: 'WBA-123456789ABC',
      waybillAlias: true,
      waybillCommitment: 'WBC-THIS-IS-A-PRIVATE-WAYBILL-COMMITMENT',
      addressReferenceCommitment: 'ARC-THIS-IS-A-PRIVATE-ADDRESS-COMMITMENT',
      jti: '0123456789ABCDEFGHJKMNPQ',
      nullifier: 'SLN-PRIVATE-NULLIFIER-VALUE',
      riskLevel: 'high',
      safetyPolicy: buildShippingLabelSafetyPolicy({ riskLevel: 'high' }),
      scanId: 'WS-PRINT',
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
      addressAccuracySources: ['address-reference', 'postal-code-api'],
      carrierScanVerified: true,
      recipientControlVerified: false,
      packageReceiptVerified: false,
      recipientChallengeRequired: true,
      recipientChallengeVerified: false,
      recipientChallengeHash: 'WCHH-RECIPIENT-HASH-DO-NOT-PRINT-FULL',
      expiresAt: '2026-06-08T00:15:00.000Z',
      terminalEvidenceSignature: 'TSIG-CARRIER-FULL-SIGNATURE-1234567890',
      terminalEvidenceSignatureAlgorithm: POS_TERMINAL_EVIDENCE_SIGNATURE_ALGORITHM,
      terminalSignedAt: '2026-06-08T00:02:00.000Z',
      storePosId: 'AGID-POS-001',
      carrierTerminalId: 'CARRIER-01',
      carrierTerminalSignature: 'CARRIER-PRIVATE-SIGNATURE',
      carrierTerminalSignedAt: '2026-06-08T00:01:59.000Z',
      dualScanRequired: true,
      proofMethod: 'recipient-secret-commitment',
      proofDomain: 'delivery:recipient',
      proofNonceTail: 'NONCE',
    },
    privacyNotes: [
      'Raw address and proof code are not stored.',
    ],
    ...overrides,
  });
}

test('redacted receipt print document omits private address and proof material', () => {
  const doc = buildRedactedReceiptPrintDocument(waybillReceipt());

  assert.equal(doc.kind, 'redacted-receipt');
  assert.match(doc.html, /POS-PRINT01/);
  assert.match(doc.html, /WBA-123456789ABC/);
  assert.match(doc.html, /Raw address and proof code are not stored/);
  assert.doesNotMatch(doc.html, /recipient-proof-secret|Private Receiver|\+81 90|1-1 Chiyoda/);
  assert.doesNotMatch(doc.html, /WCHH-RECIPIENT-HASH-DO-NOT-PRINT-FULL/);
});

test('shipping label slip warns that live QR payload is not reprinted', () => {
  const doc = buildShippingLabelSlipPrintDocument(waybillReceipt());

  assert.equal(doc.kind, 'shipping-label-slip');
  assert.match(doc.html, /Shipping Handoff Slip/);
  assert.match(doc.html, /live waybill QR payload is not reprinted/i);
  assert.match(doc.html, /AGID sharing/);
  assert.doesNotMatch(doc.html, /agid:waybill:/);
});

test('exception audit print is role-aware', () => {
  const cases = buildPosExceptionAuditCases([
    receipt({
      receiptId: 'POS-REJECT',
      accepted: false,
      status: 'rejected',
      errors: ['unsupported-private-payload'],
    }),
  ]);

  const cashier = buildExceptionAuditPrintDocument(cases, 'cashier');
  const supervisor = buildExceptionAuditPrintDocument(cases, 'delivery-supervisor');

  assert.match(cashier.html, /restricted count-only mode/);
  assert.doesNotMatch(cashier.html, /unsupported-private-payload/);
  assert.match(supervisor.html, /unsupported-private-payload/);
});

test('device, queue, handoff, and management print documents are generated', () => {
  const receipts = [waybillReceipt()];
  const diagnostics = buildPosDeviceDiagnostics({
    checkedAt: '2026-06-08T00:03:00.000Z',
    nativeConnector: true,
    cashDrawerRelay: true,
    keyboardWedge: true,
  });
  const report = buildPosHandoffReverificationReport({
    receipt: receipts[0],
    receipts,
    staffRole: 'delivery-supervisor',
    registryFresh: true,
    diagnostics,
    generatedAt: '2026-06-08T00:04:00.000Z',
  });
  const snapshot = buildPosManagementSnapshot({
    terminalId: 'AGID-POS-001',
    operatorId: 'operator-a',
    staffRole: 'delivery-supervisor',
    receipts,
    latestReceipt: receipts[0],
    registryFresh: true,
    diagnostics,
    activeSecureKeys: 1,
    totalSecureKeys: 1,
    syncState: 'idle',
  });

  assert.match(buildDeviceDiagnosticsPrintDocument(diagnostics, 'AGID-POS-001', 'delivery-supervisor').html, /Receipt printer/);
  assert.match(buildOfflineQueuePrintDocument(receipts, 'idle', 'AGID-POS-001').html, /Deferred Sync Summary/);
  assert.match(buildHandoffReverificationPrintDocument(report).html, /Evidence Package/);
  assert.match(buildHandoffReverificationPrintDocument(report).html, /Advanced Audit/);
  assert.match(buildHandoffReverificationPrintDocument(report).html, /Evidence Timeline/);
  assert.match(buildManagementSummaryPrintDocument(snapshot, receipts[0], report).html, /Management Summary/);
});
