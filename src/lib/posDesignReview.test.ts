import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildPosDesignReview,
} from './posDesignReview';
import {
  buildPosDeviceDiagnostics,
  buildPosHandoffReverificationReport,
  buildPosManagementSnapshot,
  type PosStaffRole,
} from './posOperationalControls';
import type { PosAcceptanceReceipt } from './posAcceptance';

function receipt(overrides: Partial<PosAcceptanceReceipt> = {}): PosAcceptanceReceipt {
  return {
    modelVersion: 'agid-pos-acceptance-v1',
    receiptId: 'POS-DESIGN01',
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

function reviewInput(options: {
  receipt?: PosAcceptanceReceipt | null;
  operatorId?: string;
  registryFresh?: boolean;
  staffRole?: PosStaffRole;
  activeSecureKeys?: number;
  totalSecureKeys?: number;
}) {
  const latestReceipt = options.receipt === undefined ? receipt() : options.receipt;
  const diagnostics = buildPosDeviceDiagnostics({
    checkedAt: '2026-06-08T00:08:00.000Z',
    nativeConnector: true,
    cashDrawerRelay: true,
    keyboardWedge: true,
  });
  const registryFresh = options.registryFresh ?? true;
  const staffRole = options.staffRole ?? 'delivery-supervisor';
  const operatorId = options.operatorId ?? 'operator-a';
  const management = buildPosManagementSnapshot({
    terminalId: 'AGID-POS-001',
    operatorId,
    staffRole,
    receipts: latestReceipt ? [latestReceipt] : [],
    latestReceipt,
    registryFresh,
    diagnostics,
    activeSecureKeys: options.activeSecureKeys ?? 1,
    totalSecureKeys: options.totalSecureKeys ?? 1,
    syncState: 'idle',
    generatedAt: '2026-06-08T00:09:00.000Z',
  });
  const handoffReport = buildPosHandoffReverificationReport({
    receipt: latestReceipt,
    receipts: latestReceipt ? [latestReceipt] : [],
    staffRole,
    registryFresh,
    diagnostics,
    generatedAt: '2026-06-08T00:10:00.000Z',
  });
  return {
    generatedAt: '2026-06-08T00:11:00.000Z',
    terminalId: 'AGID-POS-001',
    operatorId,
    latestReceipt,
    management,
    handoffReport,
    registryFresh,
    diagnostics,
    activeSecureKeys: options.activeSecureKeys ?? 1,
    totalSecureKeys: options.totalSecureKeys ?? 1,
    syncState: 'idle' as const,
  };
}

test('POS design review prioritizes release-blocking decision clarity', () => {
  const rejected = receipt({
    accepted: false,
    status: 'rejected',
    record: undefined,
    errors: ['unsupported-or-invalid-agid-address-payload'],
  });
  const review = buildPosDesignReview(reviewInput({ receipt: rejected }));

  assert.equal(review.grade, 'blocked');
  assert.equal(review.highestPriority, 'P0');
  assert.ok(review.items.some(item => (
    item.priority === 'P0'
    && item.focus === 'decision-clarity'
    && item.workspace === 'decision'
  )));
});

test('POS design review flags trust and key visibility gaps before encrypted handoff', () => {
  const review = buildPosDesignReview(reviewInput({
    registryFresh: false,
    activeSecureKeys: 0,
    totalSecureKeys: 0,
    operatorId: '',
  }));

  assert.equal(review.grade, 'attention');
  assert.equal(review.counts.P1 >= 2, true);
  assert.ok(review.items.some(item => item.workspace === 'registry'));
  assert.ok(review.items.some(item => item.workspace === 'keys'));
  assert.ok(review.items.some(item => item.workspace === 'settings'));
  assert.equal(review.focusCounts['trust-state'] >= 2, true);
});

test('POS design review keeps a low-priority continuous-review item when posture is clean', () => {
  const review = buildPosDesignReview(reviewInput({}));

  assert.equal(review.grade, 'ready');
  assert.equal(review.highestPriority, 'P3');
  assert.equal(review.items.length, 1);
  assert.equal(review.items[0].workspace, 'admin');
  assert.match(review.headline, /usable/u);
});
