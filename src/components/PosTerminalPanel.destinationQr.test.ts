import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'PosTerminalPanel.tsx'), 'utf8');

test('POS terminal exposes a delivery destination QR intake panel', () => {
  assert.match(source, /buildPosDestinationQrSummary/);
  assert.match(source, /PosDestinationQrPanel/);
  assert.match(source, /Delivery Destination QR/);
  assert.match(source, /配送先QR/);
  assert.match(source, /No raw address/);
  assert.match(source, /No recipient name/);
});

test('POS terminal fixes Scan Decision Handoff Receipt as the visible staff flow', () => {
  assert.match(source, /PosPrimaryFlowStepper/);
  assert.match(source, /Scan -> Decision -> Handoff -> Receipt/);
  assert.match(source, /primaryFlowItems/);
  assert.match(source, /sticky top-\[76px\]/);
});

test('POS terminal gives staff large accept review reject decisions', () => {
  assert.match(source, /PosStaffDecisionPanel/);
  assert.match(source, /受け取れる/);
  assert.match(source, /要確認/);
  assert.match(source, /拒否/);
  assert.match(source, /posStaffDecisionFromState/);
});

test('POS destination QR panel keeps raw address material out of visible summary labels', () => {
  assert.match(source, /Delivery eligibility/);
  assert.match(source, /Alias/);
  assert.match(source, /Receipt/);
  assert.match(source, /receiptId=\{latestReceipt\?\.receiptId/);
  assert.match(source, /type PosDestinationQrSummary/);
  assert.doesNotMatch(source, /raw address payload/i);
  assert.doesNotMatch(source, /recipient phone/i);
});

test('POS terminal exposes offline payment and delivery acceptance queues', () => {
  assert.match(source, /PosOfflineQueueVisibilityPanel/);
  assert.match(source, /Offline payment queue/);
  assert.match(source, /Offline delivery acceptance queue/);
  assert.match(source, /offlinePaymentQueueCount/);
  assert.match(source, /offlineDeliveryQueueCount/);
  assert.match(source, /setActiveWorkspace\('queue'\)/);
});
