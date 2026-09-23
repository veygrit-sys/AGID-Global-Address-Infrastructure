import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'HotelCheckInScreen.tsx'), 'utf8');
const rootSource = readFileSync(join(here, '..', 'RootApp.tsx'), 'utf8');

test('HotelCheckInScreen exposes hotel-side QR issue and guest QR verification flow', () => {
  assert.match(source, /AGID Hotel Check-in/);
  assert.match(source, /buildHotelCheckInDeskRequest/);
  assert.match(source, /processHotelGuestQrScan/);
  assert.match(source, /completeHotelCheckIn/);
  assert.match(source, /QRCodeCanvas/);
  assert.match(source, /guestQrPayload/);
});

test('HotelCheckInScreen keeps the hotel privacy boundary visible', () => {
  assert.match(source, /ホテルQRにゲスト住所は入りません/);
  assert.match(source, /hotel QR: no guest fields/);
  assert.match(source, /PMS出力は明示操作が必要/);
  assert.match(source, /PMS export gated/);
});

test('HotelCheckInScreen clarifies hotel QR issue guest QR verify and PMS safe preview', () => {
  assert.match(source, /hotelQrIssue/);
  assert.match(source, /guestQrVerify/);
  assert.match(source, /pmsSafePreview/);
  assert.match(source, /buildSafePmsPreview/);
  assert.match(source, /pmsPreviewOnly/);
  assert.match(source, /guestAddress'\,\s*'excluded-by-default/);
  assert.match(source, /roomNumber'\,\s*'excluded-by-default/);
  assert.match(source, /phoneNumber'\,\s*'excluded-by-default/);
  assert.match(source, /roomNumberExcluded/);
  assert.match(source, /phoneNumberExcluded/);
  assert.match(source, /guestAddressExcluded/);
});

test('HotelCheckInScreen provides undo and redacted audit log for front desk mistakes', () => {
  assert.match(source, /HotelAuditEvent/);
  assert.match(source, /HotelUndoSnapshot/);
  assert.match(source, /captureUndoSnapshot/);
  assert.match(source, /undoLastAction/);
  assert.match(source, /recordAudit/);
  assert.match(source, /auditLog/);
  assert.match(source, /auditLogBody/);
  assert.match(source, /HAE-/);
  assert.match(source, /receiptId/);
  assert.match(source, /requestId/);
});

test('HotelCheckInScreen can print redacted check-in receipts and payment receipts', () => {
  assert.match(source, /buildHotelCheckInReceiptPrintDocument/);
  assert.match(source, /buildHotelPaymentReceiptPrintDocument/);
  assert.match(source, /buildHotelTaxPaymentSummary/);
  assert.match(source, /openPrintableDocument/);
  assert.match(source, /printCheckInReceipt/);
  assert.match(source, /printPaymentReceipt/);
  assert.match(source, /receiptRecipientAlias/);
  assert.match(source, /paidTaxes/);
  assert.match(source, /taxSummary\.taxPaidFormatted/);
  assert.match(source, /領収証はalias・金額・receipt rootのみを印刷します/);
  assert.match(source, /receiptPersonalPayloadExcluded/);
  assert.match(source, /receiptContactAllocationExcluded/);
  assert.doesNotMatch(source, /SignalRow label="guest address"/);
  assert.doesNotMatch(source, /SignalRow label="phone \/ room"/);
});

test('RootApp registers the hotel check-in standalone route', () => {
  assert.match(rootSource, /HotelCheckInScreen/);
  assert.match(rootSource, /window\.location\.pathname === '\/hotel'/);
  assert.match(rootSource, /<HotelCheckInScreen \/>/);
});
