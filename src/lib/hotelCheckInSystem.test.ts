import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildHotelCheckInDeskRequest,
  completeHotelCheckIn,
  HOTEL_CHECKIN_SYSTEM_MODEL_VERSION,
  processHotelGuestQrScan,
  validateHotelCheckInPayloadIsSafe,
} from './hotelCheckInSystem';
import {
  buildRegisteredAddressQrPayload,
  buildRegisteredAddressRecord,
} from './registeredAddressQr';

test('hotel desk request issues a short-lived check-in QR without guest private fields', () => {
  const request = buildHotelCheckInDeskRequest({
    propertyAlias: 'hotel:tokyo-station-01',
    propertyName: 'Tokyo Station Hotel',
    staffAlias: 'staff:front-desk-1',
    terminalAlias: 'terminal:front-01',
    bookingAlias: 'booking:stay-001',
    countryCode: 'JP',
    city: 'Tokyo',
    requestedScopes: ['guest-address', 'recipient-proof'],
    highRiskMode: true,
    ttlMinutes: 30,
    now: '2026-06-20T00:00:00.000Z',
  });

  assert.equal(request.modelVersion, HOTEL_CHECKIN_SYSTEM_MODEL_VERSION);
  assert.equal(request.status, 'issued');
  assert.equal(request.nextAction, 'show_qr_to_guest');
  assert.equal(request.expiresAt, '2026-06-20T00:10:00.000Z');
  assert.ok(request.qrPayload.startsWith('agid:hotel-checkin:'));
  assert.equal(request.privacy.hotelQrContainsGuestPrivateFields, false);
  assert.doesNotMatch(decodeURIComponent(request.qrPayload), /guestName|guestPhone|guestAddress|roomNumber|passportNumber/);
});

test('hotel desk verifies guest address QR into a redacted receipt', () => {
  const request = buildHotelCheckInDeskRequest({
    propertyAlias: 'hotel:kyoto-01',
    staffAlias: 'staff:front-desk-1',
    terminalAlias: 'terminal:front-01',
    bookingAlias: 'booking:stay-002',
    requestedScopes: ['guest-address', 'recipient-proof'],
    now: '2026-06-20T00:00:00.000Z',
  });
  const guestRecord = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Sample Guest',
      street: 'Sample Street',
      city: 'Kyoto',
      postcode: '0000000',
    },
    {
      mode: 'ADDRESS',
      agid: 'JP05AV8TJGH8',
      now: '2026-06-20T00:01:00.000Z',
    },
  );
  const guestQr = buildRegisteredAddressQrPayload(guestRecord);
  const result = processHotelGuestQrScan(request, guestQr, '2026-06-20T00:02:00.000Z');

  assert.equal(result.request.status, 'guest_verified');
  assert.equal(result.scan.decision, 'accept');
  assert.equal(result.scan.addressSignal.countryPresent, true);
  assert.equal(result.scan.addressSignal.streetPresent, true);
  assert.equal(result.receipt.action, 'guest_qr_scan');
  assert.equal(result.receipt.privacy.containsRawGuestAddress, false);
  assert.equal(result.receipt.privacy.containsRecipientName, false);
  assert.equal(validateHotelCheckInPayloadIsSafe(result.receipt).safe, true);
  assert.doesNotMatch(JSON.stringify(result.receipt), /Sample Guest|Sample Street|0000000/);
});

test('hotel desk routes public AOID references and expired sessions to review or rejection', () => {
  const request = buildHotelCheckInDeskRequest({
    propertyAlias: 'hotel:review-01',
    staffAlias: 'staff:front-desk-1',
    terminalAlias: 'terminal:front-01',
    bookingAlias: 'booking:stay-003',
    now: '2026-06-20T00:00:00.000Z',
  });
  const publicAoidRecord = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Private Guest',
      city: 'Tokyo',
      phone: '+00 000 0000',
    },
    {
      mode: 'AOID',
      id: '05AV8TJGH8QZ6M2R',
      agid: 'JP05AV8TJGH8',
      now: '2026-06-20T00:01:00.000Z',
    },
  );
  const publicAoidQr = buildRegisteredAddressQrPayload(publicAoidRecord, { privacy: 'public' });
  const review = processHotelGuestQrScan(request, publicAoidQr, '2026-06-20T00:02:00.000Z');

  assert.equal(review.request.status, 'requires_review');
  assert.equal(review.scan.decision, 'review');
  assert.equal(review.scan.addressSignal.publicAoidReferenceOnly, true);
  assert.ok(review.scan.warnings.includes('hotel-checkin-public-aoid-needs-local-review'));

  const expired = processHotelGuestQrScan(request, publicAoidQr, '2026-06-20T01:30:00.000Z');
  assert.equal(expired.request.status, 'expired');
  assert.equal(expired.scan.decision, 'reject');
});

test('hotel check-in completion requires a verified guest scan', () => {
  const request = buildHotelCheckInDeskRequest({
    propertyAlias: 'hotel:complete-01',
    staffAlias: 'staff:front-desk-1',
    terminalAlias: 'terminal:front-01',
    now: '2026-06-20T00:00:00.000Z',
  });
  const blocked = completeHotelCheckIn(request, null, '2026-06-20T00:02:00.000Z');

  assert.equal(blocked.request.status, 'requires_review');
  assert.equal(blocked.receipt.decision, 'review');

  const guestRecord = buildRegisteredAddressRecord(
    { country: 'JP', street: 'Sample Street', city: 'Osaka' },
    { mode: 'ADDRESS', now: '2026-06-20T00:01:00.000Z' },
  );
  const verified = processHotelGuestQrScan(
    request,
    buildRegisteredAddressQrPayload(guestRecord),
    '2026-06-20T00:02:00.000Z',
  );
  const completed = completeHotelCheckIn(verified.request, verified.scan, '2026-06-20T00:03:00.000Z');

  assert.equal(completed.request.status, 'completed');
  assert.equal(completed.receipt.decision, 'complete');
  assert.equal(completed.receipt.safeSubjectRef, verified.scan.safeSubjectRef);
});
