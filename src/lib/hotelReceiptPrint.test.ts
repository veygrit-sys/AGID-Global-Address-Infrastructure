import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildHotelCheckInDeskRequest,
  completeHotelCheckIn,
  processHotelGuestQrScan,
} from './hotelCheckInSystem';
import {
  buildHotelCheckInReceiptPrintDocument,
  buildHotelPaymentReceiptPrintDocument,
  buildHotelTaxPaymentSummary,
} from './hotelReceiptPrint';
import {
  buildRegisteredAddressQrPayload,
  buildRegisteredAddressRecord,
} from './registeredAddressQr';

function completedReceipt() {
  const request = buildHotelCheckInDeskRequest({
    propertyAlias: 'hotel:receipt-demo',
    propertyName: 'Receipt Demo Hotel',
    staffAlias: 'staff:front-desk',
    terminalAlias: 'terminal:hotel-01',
    bookingAlias: 'booking:safe-001',
    now: '2026-06-20T00:00:00.000Z',
  });
  const guestRecord = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Private Guest',
      street: '1-1 Private Street',
      city: 'Tokyo',
      phone: '+81 90 0000 0000',
    },
    {
      mode: 'ADDRESS',
      agid: 'JP05AV8TJGH8',
      now: '2026-06-20T00:01:00.000Z',
    },
  );
  const verified = processHotelGuestQrScan(
    request,
    buildRegisteredAddressQrPayload(guestRecord),
    '2026-06-20T00:02:00.000Z',
  );
  return completeHotelCheckIn(verified.request, verified.scan, '2026-06-20T00:03:00.000Z').receipt;
}

test('hotel check-in receipt print document is redacted', () => {
  const receipt = completedReceipt();
  const document = buildHotelCheckInReceiptPrintDocument(receipt, {
    propertyName: 'Receipt Demo Hotel',
  });

  assert.equal(document.kind, 'hotel-checkin-receipt');
  assert.match(document.html, /Hotel Check-in Receipt/);
  assert.match(document.html, /booking:safe-001/);
  assert.match(document.html, /Guest raw address/);
  assert.doesNotMatch(document.html, /Private Guest|Private Street|\+81 90|JP05AV8TJGH8/);
});

test('hotel payment receipt uses aliases and warns against private billing fields', () => {
  const receipt = completedReceipt();
  const taxSummary = buildHotelTaxPaymentSummary({
    receipt,
    receiptRecipientAlias: 'guest:alias-001',
    amount: 12800,
    taxAmount: 1164,
    currency: 'jpy',
    paymentAlias: 'payment:demo-001',
  });
  const document = buildHotelPaymentReceiptPrintDocument({
    receipt,
    propertyName: 'Receipt Demo Hotel',
    receiptRecipientAlias: 'guest:alias-001',
    amount: 12800,
    taxAmount: 1164,
    currency: 'jpy',
    paymentMethod: 'card-present',
    paymentAlias: 'payment:demo-001',
  });

  assert.equal(taxSummary.status, 'paid');
  assert.equal(taxSummary.taxPaidFormatted, '1,164 JPY');
  assert.equal(taxSummary.taxableBasisFormatted, '11,636 JPY');
  assert.match(taxSummary.effectiveTaxRateFormatted, /10/);
  assert.equal(document.kind, 'hotel-payment-receipt');
  assert.match(document.html, /Hotel Payment Receipt/);
  assert.match(document.html, /Paid Tax Summary/);
  assert.match(document.html, /Tax paid/);
  assert.match(document.html, /12,800 JPY/);
  assert.match(document.html, /guest:alias-001/);
  assert.match(document.html, /Do not type a legal name/);
  assert.doesNotMatch(document.html, /Private Guest|Private Street|\+81 90|JP05AV8TJGH8/);
});
