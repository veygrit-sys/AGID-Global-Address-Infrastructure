import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildPosDestinationQrSummary } from './destinationQr';
import { buildRegisteredAddressQrPayload, buildRegisteredAddressRecord } from '../registeredAddressQr';
import { buildShippingLabelQrPayload } from '../shippingLabelQr';

function registeredAddressPayload() {
  const record = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Private Recipient',
      phone: '+81 90 0000 0000',
      street: '1-1 Chiyoda',
      city: 'Tokyo',
      state: 'Tokyo',
      postcode: '1000001',
      building: 'Private Building',
      room: '1204',
    },
    {
      agid: 'JP05AV8TJGH8',
      now: '2026-06-20T00:00:00.000Z',
    },
  );
  return buildRegisteredAddressQrPayload(record, { privacy: 'full' });
}

test('POS destination QR summary recognizes registered address QR without displaying raw address fields', () => {
  const summary = buildPosDestinationQrSummary(registeredAddressPayload(), '2026-06-20T00:01:00.000Z');

  assert.equal(summary.kind, 'registered-address');
  assert.equal(summary.status, 'ready');
  assert.equal(summary.source, 'registered-address-qr');
  assert.equal(summary.nextAction, 'accept_at_pos');
  assert.equal(summary.deliveryEligibility, 'can-accept');
  assert.equal(summary.alias, summary.primaryReference);
  assert.equal(summary.receiptHint, 'receipt-pending');
  assert.match(summary.safeDestination, /JP/);
  assert.match(summary.safeDestination, /Tokyo/);
  assert.match(summary.safeDestination, /1000001/);
  assert.equal(summary.privacy.rawAddressDisplayed, false);
  assert.equal(summary.privacy.recipientDisplayed, false);
  assert.doesNotMatch(summary.safeDestination, /Private Recipient|\+81|1-1 Chiyoda|Private Building|1204/);
  assert.doesNotMatch(summary.primaryReference, /Private Recipient|1-1 Chiyoda/);
});

test('POS destination QR summary recognizes shipping label QR as a redacted delivery destination', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-pos-destination-1',
    carrierId: 'pos-terminal-a',
    addressPayload: registeredAddressPayload(),
    recipientProofCode: 'handoff-1234',
    issuedAt: '2026-06-20T00:00:00.000Z',
    expiresAt: '2026-06-20T00:30:00.000Z',
  });

  const summary = buildPosDestinationQrSummary(payload, '2026-06-20T00:10:00.000Z');

  assert.equal(summary.kind, 'shipping-label');
  assert.equal(summary.source, 'shipping-label-qr');
  assert.match(summary.primaryReference, /^WBA-/);
  assert.equal(summary.deliveryEligibility, 'needs-review');
  assert.equal(summary.alias, summary.primaryReference);
  assert.ok(summary.evidence.some(item => item.startsWith('address-ref:')));
  assert.equal(summary.privacy.rawPayloadDisplayed, false);
  assert.doesNotMatch(summary.safeDestination, /Private Recipient|\+81|1-1 Chiyoda|JP05AV8TJGH8|handoff-1234/);
});

test('POS destination QR summary rejects expired shipping label QR', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-pos-expired-1',
    carrierId: 'pos-terminal-a',
    addressPayload: registeredAddressPayload(),
    recipientProofCode: 'handoff-1234',
    issuedAt: '2026-06-20T00:00:00.000Z',
    expiresAt: '2026-06-20T00:05:00.000Z',
  });

  const summary = buildPosDestinationQrSummary(payload, '2026-06-20T00:10:00.000Z');

  assert.equal(summary.kind, 'shipping-label');
  assert.equal(summary.status, 'expired');
  assert.equal(summary.deliveryEligibility, 'reject');
  assert.equal(summary.nextAction, 'reject_or_refresh');
  assert.ok(summary.warnings.includes('shipping-label-expired'));
});

test('POS destination QR summary keeps unsupported QR in manual review', () => {
  const summary = buildPosDestinationQrSummary('not-a-delivery-qr', '2026-06-20T00:10:00.000Z');

  assert.equal(summary.kind, 'unsupported');
  assert.equal(summary.status, 'unsupported');
  assert.equal(summary.deliveryEligibility, 'reject');
  assert.equal(summary.nextAction, 'manual_entry');
  assert.equal(summary.privacy.preciseCoordinateDisplayed, false);
});
