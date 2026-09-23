import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAddressInputPatchFromRegisteredQr,
  buildHotelCheckInQrPayload,
  parseAddressQrIntake,
  parseHotelCheckInQrPayload,
} from './addressQrIntake';
import {
  buildRegisteredAddressQrPayload,
  buildRegisteredAddressRecord,
} from './registeredAddressQr';

test('address QR intake converts a registered address QR into editable form fields', () => {
  const record = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Guest Example',
      organization: 'AGID Hotel',
      street: '1-2-3 Marunouchi',
      suburb: 'Chiyoda-ku',
      city: 'Tokyo',
      state: 'Tokyo',
      postcode: '1000005',
      phone: '+81 90 0000 0000',
    },
    {
      mode: 'ADDRESS',
      agid: 'JP05AV8TJGH8',
      coords: { lat: 35.681, lon: 139.767 },
      now: '2026-06-20T00:00:00.000Z',
    },
  );
  const payload = buildRegisteredAddressQrPayload(record);
  const result = parseAddressQrIntake(payload, '2026-06-20T00:01:00.000Z');

  assert.equal(result.kind, 'registered-address');
  assert.equal(result.status, 'ready');
  assert.equal(result.nextAction, 'review_and_register');
  assert.equal(result.formPatch.country, 'JP');
  assert.equal(result.formPatch.city, 'Tokyo');
  assert.equal(result.formPatch.postcode, '1000005');
  assert.equal(result.formPatch.street, '1-2-3 Marunouchi');
});

test('public AOID references do not autofill private address fields', () => {
  const record = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Private Guest',
      street: 'Private Street',
      city: 'Tokyo',
      room: '1204',
      phone: '+81 3 0000 0000',
    },
    {
      mode: 'AOID',
      id: '05AV8TJGH8QZ6M2R',
      agid: 'JP05AV8TJGH8',
      now: '2026-06-20T00:00:00.000Z',
    },
  );
  const payload = buildRegisteredAddressQrPayload(record, { privacy: 'public' });
  const result = parseAddressQrIntake(payload, '2026-06-20T00:01:00.000Z');

  assert.equal(result.kind, 'registered-address');
  assert.equal(result.status, 'needs_review');
  assert.equal(result.formPatch.recipient, '');
  assert.equal(result.formPatch.phone, '');
  assert.equal(result.formPatch.room, '');
  assert.deepEqual(result.warnings, ['public-aoid-reference-cannot-autofill-private-fields']);
});

test('hotel check-in QR creates a local session without guest address material', () => {
  const payload = buildHotelCheckInQrPayload({
    hotelAlias: 'hotel:tokyo-station-01',
    bookingAlias: 'stay-20260620-001',
    propertyName: 'Tokyo Station Hotel',
    countryCode: 'JP',
    city: 'Tokyo',
    checkInStartsAt: '2026-06-20T06:00:00.000Z',
    checkInEndsAt: '2026-06-21T06:00:00.000Z',
    requestedScopes: ['guest-address', 'recipient-proof'],
    now: '2026-06-20T00:00:00.000Z',
  });
  const session = parseHotelCheckInQrPayload(payload, '2026-06-20T07:00:00.000Z');

  assert.equal(session?.status, 'requires_guest_address');
  assert.equal(session?.nextAction, 'scan_guest_address_qr');
  assert.equal(session?.hotel.hotelAlias, 'HOTEL:TOKYO-STATION-01');
  assert.equal(session?.hotel.countryCode, 'JP');
  assert.equal(session?.privacy.storesGuestAddressInHotelQr, false);
  assert.doesNotMatch(decodeURIComponent(payload), /guestName|guestPhone|guestAddress|passportNumber|documentNumber/);
});

test('hotel check-in QR rejects expired sessions and private guest fields', () => {
  const expiredPayload = buildHotelCheckInQrPayload({
    hotelAlias: 'hotel:expired-01',
    checkInEndsAt: '2026-06-19T23:59:00.000Z',
    now: '2026-06-19T00:00:00.000Z',
  });
  assert.equal(parseHotelCheckInQrPayload(expiredPayload, '2026-06-20T00:00:00.000Z')?.status, 'expired');

  const privatePayload = `agid:hotel-checkin:${encodeURIComponent(JSON.stringify({
    modelVersion: 'agid-hotel-checkin-v1',
    version: 1,
    hotelAlias: 'hotel:bad-01',
    guestAddress: 'Private address line',
    requestedScopes: ['guest-address', 'recipient-proof'],
  }))}`;
  assert.equal(parseHotelCheckInQrPayload(privatePayload, '2026-06-20T00:00:00.000Z'), null);
});

test('registered address patch helper keeps editable fields separate from QR parsing', () => {
  const record = buildRegisteredAddressRecord(
    {
      country: 'US',
      recipient: 'Alex Visitor',
      organization: 'Front Desk',
      street: '5 Main St',
      city: 'Boston',
      state: 'MA',
      postcode: '02108',
    },
    { now: '2026-06-20T00:00:00.000Z' },
  );

  assert.deepEqual(buildAddressInputPatchFromRegisteredQr(record), {
    country: 'US',
    recipient: 'Alex Visitor',
    organization: 'Front Desk',
    street: '5 Main St',
    suburb: '',
    city: 'Boston',
    state: 'MA',
    postcode: '02108',
    phone: '',
    building: '',
    room: '',
  });
});
