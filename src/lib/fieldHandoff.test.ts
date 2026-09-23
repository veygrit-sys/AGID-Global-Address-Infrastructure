import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  FIELD_HANDOFF_RECEIPT_SIGNATURE_ALGORITHM,
  createFieldReachabilityReport,
  detectFieldAttachmentPrivacyWarnings,
  normalizeFieldHandoffTask,
  processFieldHandoffScan,
  syncFieldHandoffReceipt,
} from './fieldHandoff';
import {
  buildShippingLabelQrPayload,
  createShippingLabelRecipientChallengeSignature,
  parseShippingLabelQrPayload,
} from './shippingLabelQr';

function demoTask(overrides = {}) {
  return {
    taskId: 'FHT-DEMO-001',
    stopAlias: 'STOP-A7K9',
    routeName: 'Field Route North',
    operatorId: 'field-op-7',
    terminalId: 'AGID-FIELD-7',
    highRiskMode: true,
    offlineMode: true,
    ...overrides,
  };
}

test('normalizes a high-risk field task with offline defaults', () => {
  const task = normalizeFieldHandoffTask(demoTask(), '2026-06-18T00:00:00.000Z');

  assert.equal(task.taskId, 'FHT-DEMO-001');
  assert.equal(task.priority, 'high');
  assert.equal(task.status, 'assigned');
  assert.equal(task.highRiskMode, true);
  assert.equal(task.offlineMode, true);
});

test('processes recipient proof into an offline handoff receipt without raw address fields', () => {
  const challenge = 'FIELD-CHALLENGE-001';
  const payload = buildShippingLabelQrPayload({
    waybillId: 'internal-waybill-123',
    jti: '0123456789ABCDEFGHJKMNPQ',
    carrierId: 'carrier-demo',
    riskLevel: 'high',
    highRiskUseCases: ['humanitarian'],
    address: {
      kind: 'agid',
      agid: 'ML01R1A0ZTR4',
      country: 'JP',
      city: 'redacted',
    },
    recipientProofSecret: 'recipient-secret',
    recipientProofMethod: 'recipient-secret-commitment',
    recipientProofNonce: 'RECIPIENTNONCE001',
    issuedAt: '2026-06-18T00:00:00.000Z',
    expiresAt: '2026-06-18T00:05:00.000Z',
  });
  const parsedRecord = parseShippingLabelQrPayload(payload);
  assert.ok(parsedRecord);
  const recipientChallengeSignature = createShippingLabelRecipientChallengeSignature({
    waybillId: parsedRecord.waybillId,
    jti: parsedRecord.jti,
    recipientSecret: 'recipient-secret',
    recipientProofMethod: parsedRecord.recipientProof.method,
    recipientProofDomain: parsedRecord.recipientProof.domain,
    recipientProofNonce: parsedRecord.recipientProof.nonce,
    challenge,
  });

  const result = processFieldHandoffScan({
    task: demoTask(),
    payload,
    recipientProofSecret: 'recipient-secret',
    recipientChallenge: challenge,
    recipientChallengeSignature,
    now: '2026-06-18T00:02:00.000Z',
  });

  assert.equal(result.task.status, 'offline_pending_sync');
  assert.equal(result.receipt.status, 'offline_pending_sync');
  assert.equal(result.receipt.decision, 'ready');
  assert.equal(result.receipt.privacy.rawAddressStored, false);
  assert.equal(result.receipt.privacy.rawAgidStored, false);
  assert.equal(result.receipt.privacy.rawAoidStored, false);
  assert.equal(result.receipt.privacy.proofSecretStored, false);
  assert.equal(result.receipt.syncState, 'queued');
  assert.match(result.receipt.offlineQueueRef, /^FHQ-/);
  assert.match(result.receipt.offlineEvidence.evidenceId, /^FHOE-/);
  assert.equal(result.receipt.offlineEvidence.queueRef, result.receipt.offlineQueueRef);
  assert.equal(result.receipt.offlineEvidence.deferredSyncRequired, true);
  assert.equal(result.receipt.offlineEvidence.conflictPolicy, 'server-conflict-creates-review-case');
  assert.equal(result.receipt.offlineEvidence.publicSurface, 'offline-queue-ref-status-and-terminal-signature-only');
  assert.ok(result.receipt.recipientProofEvidence);
  assert.match(result.receipt.recipientProofEvidence.evidenceId, /^FRPE-/);
  assert.equal(result.receipt.recipientProofEvidence.verified, true);
  assert.equal(result.receipt.recipientProofEvidence.challengeObserved, true);
  assert.equal(result.receipt.recipientProofEvidence.signatureObserved, true);
  assert.equal(result.receipt.recipientProofEvidence.storesProofSecret, false);
  assert.equal(result.receipt.recipientProofEvidence.storesProofCode, false);
  assert.match(result.receipt.signature.signatureId, /^FHS-/);
  assert.match(result.receipt.signature.receiptFingerprint, /^FHF-/);
  assert.match(result.receipt.signature.terminalSignature, /^FHTSIG-/);
  assert.equal(result.receipt.signature.recipientProofDigest, result.receipt.recipientProofEvidence.evidenceId);
  assert.equal(result.receipt.signature.signatureAlgorithm, FIELD_HANDOFF_RECEIPT_SIGNATURE_ALGORITHM);
  assert.equal(result.receipt.signature.publicSurface, 'receipt-ids-status-safe-categories-and-fingerprints-only');
  assert.ok(result.receipt.warnings.includes('high-risk-mode-redacts-precise-agid-and-address-history'));
  assert.ok(result.receipt.warnings.includes('offline-receipt-awaits-deferred-sync'));
  assert.ok(result.posReceipt.shippingLabel?.recipientControlVerified);

  const serializedReceipt = JSON.stringify(result.receipt);
  assert.equal(serializedReceipt.includes('"recipient-secret"'), false);
  assert.equal(serializedReceipt.includes('ML01R1A0ZTR4'), false);
});

test('creates cannot-reach reports as review cases using safe categories', () => {
  const result = createFieldReachabilityReport({
    task: demoTask({ status: 'arrived' }),
    reason: 'delivery-point-blocked',
    note: 'Gate closed; no private address detail stored.',
    now: '2026-06-18T00:10:00.000Z',
  });

  assert.equal(result.task.status, 'cannot_reach');
  assert.equal(result.receipt.status, 'cannot_reach');
  assert.equal(result.receipt.reachabilityReason, 'delivery-point-blocked');
  assert.match(result.receipt.reviewCaseId ?? '', /^FRC-/);
  assert.match(result.receipt.signature.reachabilityDigest ?? '', /^FRD-/);
  assert.ok(result.receipt.reachabilityEvidence);
  assert.match(result.receipt.reachabilityEvidence.evidenceId, /^FRE-/);
  assert.equal(result.receipt.reachabilityEvidence.safeCategoryOnly, true);
  assert.equal(result.receipt.reachabilityEvidence.preciseLocationStored, false);
  assert.equal(result.receipt.reachabilityEvidence.reason, 'delivery-point-blocked');
  assert.equal(result.receipt.reachabilityEvidence.reviewCaseId, result.receipt.reviewCaseId);
  assert.match(result.receipt.reachabilityEvidence.noteDigest ?? '', /^FSN-/);
  assert.equal(result.receipt.syncState, 'queued');
  assert.equal(result.receipt.privacy.preciseLocationStored, false);
  assert.equal(result.receipt.privacy.sharedReportUsesCoarseCategories, true);
});

test('turns rejected deferred sync into a review conflict instead of overwriting local state', () => {
  const result = syncFieldHandoffReceipt({
    task: demoTask({ status: 'offline_pending_sync' }),
    serverAccepted: false,
    conflictReason: 'nullifier-already-used',
    now: '2026-06-18T00:20:00.000Z',
  });

  assert.equal(result.task.status, 'sync_conflict');
  assert.equal(result.receipt.status, 'sync_conflict');
  assert.equal(result.receipt.syncState, 'conflict');
  assert.equal(result.receipt.offlineEvidence.syncState, 'conflict');
  assert.equal(result.receipt.offlineEvidence.conflictPolicy, 'server-conflict-creates-review-case');
  assert.match(result.receipt.reviewCaseId ?? '', /^FRC-/);
  assert.ok(result.receipt.warnings.some(warning => warning.includes('sync-conflict:nullifier-already-used')));
});

test('accepted deferred sync completes handoff and clears offline mode', () => {
  const result = syncFieldHandoffReceipt({
    task: demoTask({ status: 'offline_pending_sync' }),
    serverAccepted: true,
    now: '2026-06-18T00:25:00.000Z',
  });

  assert.equal(result.task.status, 'handoff_complete');
  assert.equal(result.task.offlineMode, false);
  assert.equal(result.receipt.status, 'handoff_complete');
  assert.equal(result.receipt.decision, 'complete');
  assert.equal(result.receipt.syncState, 'synced');
  assert.equal(result.receipt.offlineEvidence.syncState, 'synced');
  assert.equal(result.receipt.offlineEvidence.deferredSyncRequired, false);
  assert.match(result.receipt.signature.signatureId, /^FHS-/);
  assert.match(result.receipt.signature.terminalSignature, /^FHTSIG-/);
});

test('detects personal data risks in field photo and memo inputs before sync', () => {
  const warnings = detectFieldAttachmentPrivacyWarnings({
    photoEvidenceRef: 'photo IMG_2001 GPS 35.6812, 139.7671',
    note: '受取人: 山田 太郎 電話 090-1234-5678 〒100-0005 千代田区',
  });

  assert.ok(warnings.includes('possible-recipient-name'));
  assert.ok(warnings.includes('possible-phone-or-contact'));
  assert.ok(warnings.includes('possible-raw-address'));
  assert.ok(warnings.includes('possible-precise-location'));
  assert.ok(warnings.includes('photo-metadata-review-required'));
});

test('allows safe-category-only field memo without privacy warnings', () => {
  assert.deepEqual(detectFieldAttachmentPrivacyWarnings({
    photoEvidenceRef: '',
    note: 'delivery-point-blocked safe category only',
  }), []);
});
