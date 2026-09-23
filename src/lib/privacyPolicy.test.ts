import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  clearPrivateLocalStorage,
  PRIVATE_STORAGE_KEYS,
  redactLogValue,
  redactSensitiveText,
  sanitizeRegisteredAddressForPublicQr,
} from './privacyPolicy';
import {
  buildRegisteredAddressQrPayload,
  buildRegisteredAddressRecord,
  parseRegisteredAddressQrPayload,
} from './registeredAddressQr';

test('public registered-address QR payload removes personal and exact-position fields', () => {
  const record = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Aoi Kitau',
      organization: 'AGID Lab',
      street: '1-1 Chiyoda',
      city: 'Tokyo',
      postcode: '1000001',
      phone: '+81 90 0000 0000',
      room: '28B',
    },
    {
      agid: 'JP05AV8TJGH8',
      coords: { lat: 35.6895, lon: 139.6917 },
      now: '2026-06-03T00:00:00.000Z',
    },
  );

  const publicRecord = sanitizeRegisteredAddressForPublicQr(record);

  assert.equal(publicRecord.id, 'JP05AV8TJGH8');
  assert.equal(publicRecord.name, 'JP05AV8TJGH8');
  assert.equal(publicRecord.country, 'JP');
  assert.equal(publicRecord.address, record.address);
  assert.equal(publicRecord.recipient, undefined);
  assert.equal(publicRecord.phone, undefined);
  assert.equal(publicRecord.room, undefined);
  assert.equal(publicRecord.lat, undefined);
  assert.equal(publicRecord.lon, undefined);

  const parsed = parseRegisteredAddressQrPayload(
    buildRegisteredAddressQrPayload(record, { privacy: 'public' }),
  );
  assert.deepEqual(parsed, publicRecord);
});

test('full registered-address QR payload preserves explicit private data for local use', () => {
  const record = buildRegisteredAddressRecord(
    {
      country: 'VN',
      recipient: 'Lan Nguyen',
      street: 'Nguyen Huu Canh',
      city: 'Ho Chi Minh City',
      phone: '+84 90 000 0000',
    },
    {
      agid: 'VN00TEST0001',
      coords: { lat: 10.794, lon: 106.7218 },
      now: '2026-06-03T00:00:00.000Z',
    },
  );

  assert.deepEqual(parseRegisteredAddressQrPayload(buildRegisteredAddressQrPayload(record)), record);
});

test('public AOID QR payload keeps the linked AGID but removes owner-only delivery fields', () => {
  const record = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Owner Receiver',
      organization: 'Private Tower',
      street: '2-2 Roppongi',
      city: 'Tokyo',
      phone: '+81 3 0000 0000',
      building: 'Private Tower',
      room: '2801',
    },
    {
      mode: 'AOID',
      id: '05AV8TJGH8QZ6M2R',
      agid: 'JP05AV8TJGH8',
      coords: { lat: 35.66, lon: 139.73 },
      now: '2026-06-03T00:00:00.000Z',
    },
  );

  const parsed = parseRegisteredAddressQrPayload(
    buildRegisteredAddressQrPayload(record, { privacy: 'public' }),
  );

  assert.equal(parsed?.type, 'AOID');
  assert.equal(parsed?.id, '05AV8TJGH8QZ6M2R');
  assert.equal(parsed?.agid, 'JP05AV8TJGH8');
  assert.equal(parsed?.name, 'JP05AV8TJGH8');
  assert.equal(parsed?.address, 'JP05AV8TJGH8');
  assert.equal((parsed as { privacy?: unknown })?.privacy, 'public-reference');
  assert.equal((parsed as { ownerManaged?: unknown })?.ownerManaged, undefined);
  assert.equal((parsed as { updatedAt?: unknown })?.updatedAt, undefined);
  assert.equal(parsed?.recipient, undefined);
  assert.equal(parsed?.phone, undefined);
  assert.equal(parsed?.building, undefined);
  assert.equal(parsed?.room, undefined);
  assert.equal(parsed?.lat, undefined);
  assert.equal(parsed?.lon, undefined);
});

test('privacy redaction removes coordinates and address-like query values from logs', () => {
  const redacted = redactSensitiveText(
    'https://nominatim.openstreetmap.org/reverse?format=json&lat=35.6895&lon=139.6917&q=Tokyo%20Station',
  );

  assert.doesNotMatch(redacted, /35\.6895/);
  assert.doesNotMatch(redacted, /139\.6917/);
  assert.doesNotMatch(redacted, /Tokyo/);
  assert.match(redacted, /\[redacted\]/);

  assert.equal(
    redactSensitiveText('lookup failed at 35.6895,139.6917'),
    'lookup failed at [coordinates]',
  );
});

test('privacy log redaction handles nested objects and private storage keys are explicit', () => {
  const value = redactLogValue({
    url: 'https://example.test/search?q=private-address&lat=1.23456',
    lat: 1.23456,
    nested: { postcode: '1000001' },
  }) as Record<string, unknown>;

  assert.equal(value.lat, '[redacted]');
  assert.deepEqual((value.nested as Record<string, unknown>).postcode, '[redacted]');
  assert.doesNotMatch(String(value.url), /private-address|1\.23456/);
  assert.ok(PRIVATE_STORAGE_KEYS.includes('agid_registered_addresses'));
});

test('private local storage clear removes only declared private keys', () => {
  const removed: string[] = [];
  const storage = {
    removeItem(key: string) {
      removed.push(key);
    },
  } as Storage;

  clearPrivateLocalStorage(storage);

  assert.deepEqual(removed, [...PRIVATE_STORAGE_KEYS]);
});
