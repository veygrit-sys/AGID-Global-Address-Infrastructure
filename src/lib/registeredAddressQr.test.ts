import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildRegisteredAddressQrPayload,
  buildRegisteredAddressRecord,
  buildSavedQrFromRegisteredAddress,
  formatRegisteredAddressLocationDisplay,
  parseRegisteredAddressQrPayload,
} from './registeredAddressQr';
import { buildRegisteredAddressQualitySnapshot } from './registeredAddressQuality';

function decodeQrPayload(payload: string) {
  return JSON.parse(decodeURIComponent(payload.replace(/^agid:address:/, '')));
}

function sampleQualitySnapshot() {
  return buildRegisteredAddressQualitySnapshot({
    addressElement: {
      quality: { decision: 'partial', score: 0.68, internalOnly: true },
      missingRequiredFields: [],
      warnings: ['registration-needs-operator-review'],
      autofill: {
        postalCandidateCount: 1,
        agidCandidatePresent: true,
        channels: ['postal-code', 'agid'],
      },
    },
    readiness: {
      status: 'usable',
      score: 0.7,
      publicMetadata: {
        sessionId: 'AEL-0123456789ABCDEF',
        intentId: 'AIT-0123456789ABCDEF',
        qualityDecision: 'partial',
        intentStatus: 'requires_review',
        checkSummary: { pass: 9, warning: 3, fail: 0 },
        roles: [],
        privacyBoundary: 'no-raw-address-public-metadata',
      },
    },
    reasonCodes: ['quality-decision:partial'],
  });
}

test('registered address records keep address data and round-trip through QR payloads', () => {
  const record = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Aoi Kitau',
      organization: 'AGID Lab',
      street: '1-1 Chiyoda',
      suburb: 'Chiyoda-ku',
      city: 'Tokyo',
      state: 'Tokyo',
      postcode: '1000001',
      phone: '+81 90 0000 0000',
    },
    {
      mode: 'ADDRESS',
      agid: 'JP05AV8TJGH8',
      coords: { lat: 35.6895, lon: 139.6917 },
      now: '2026-05-31T00:00:00.000Z',
    },
  );

  assert.equal(record.type, 'ADDRESS');
  assert.equal(record.id, 'JP05AV8TJGH8');
  assert.equal(record.agid, 'JP05AV8TJGH8');
  assert.equal(record.name, 'Aoi Kitau');
  assert.equal(record.address, 'AGID Lab, 1-1 Chiyoda, Chiyoda-ku, Tokyo, Tokyo 1000001, JP');
  assert.equal(record.lat, 35.6895);
  assert.equal(record.lon, 139.6917);

  const payload = buildRegisteredAddressQrPayload(record);
  const decoded = decodeQrPayload(payload);

  assert.match(payload, /^agid:address:/);
  assert.equal(decoded.audit.layer, 'AGID');
  assert.equal(decoded.audit.operation, 'qr-build');
  assert.equal(decoded.audit.outcome, 'allowed');
  assert.deepEqual(parseRegisteredAddressQrPayload(payload), record);
  assert.equal(parseRegisteredAddressQrPayload('JP05AV8TJGH8'), null);
});

test('saved location display uses structured fields without recipient or phone metadata', () => {
  const display = formatRegisteredAddressLocationDisplay({
    country: 'US',
    recipient: 'Private Person',
    phone: '+1 555 0100',
    organization: 'Example Building',
    street: '42 Example Road',
    city: 'Sample City',
    state: 'Test State',
    postcode: '00000',
    room: 'Unit 9',
  });

  assert.match(display, /Example Building/);
  assert.match(display, /Example Road/);
  assert.doesNotMatch(display, /Private Person/);
  assert.doesNotMatch(display, /555 0100/);
});

test('AOID records use an AOID id while preserving the linked AGID and map position', () => {
  const record = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Minato Receiver',
      street: '2-2 Roppongi',
      city: 'Tokyo',
      state: 'Tokyo',
      postcode: '1060032',
      suburb: 'Minato-ku',
      phone: '+81 3 0000 0000',
    },
    {
      mode: 'AOID',
      id: '05AV8TJGH8QZ6M2R',
      agid: 'JP05AV8TJGH8',
      coords: { lat: 35.66, lon: 139.73 },
      now: '2026-05-31T00:10:00.000Z',
    },
  );

  assert.equal(record.type, 'AOID');
  assert.equal(record.id, '05AV8TJGH8QZ6M2R');
  assert.equal(record.agid, 'JP05AV8TJGH8');
  assert.equal(record.name, 'Minato Receiver');
  assert.equal(record.address, '2-2 Roppongi, Minato-ku, Tokyo, Tokyo 1060032, JP');
  assert.equal(record.lat, 35.66);
  assert.equal(record.lon, 139.73);
});

test('public AOID QR parses as a public reference and cannot become an owner AOID', () => {
  const record = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Minato Receiver',
      street: '2-2 Roppongi',
      city: 'Tokyo',
      phone: '+81 3 0000 0000',
      room: '2801',
    },
    {
      mode: 'AOID',
      id: '05AV8TJGH8QZ6M2R',
      agid: 'JP05AV8TJGH8',
      coords: { lat: 35.66, lon: 139.73 },
      now: '2026-05-31T00:10:00.000Z',
    },
  );

  const payload = buildRegisteredAddressQrPayload(record, { privacy: 'public' });
  const decoded = decodeQrPayload(payload);
  const parsed = parseRegisteredAddressQrPayload(payload);

  assert.equal(decoded.audit.layer, 'AOID');
  assert.equal(decoded.audit.payloadClass, 'aoid-public-reference');
  assert.doesNotMatch(JSON.stringify(decoded), /Minato Receiver|2801|\+81 3|35\.66|139\.73/);
  assert.equal(parsed?.type, 'AOID');
  assert.equal(parsed?.id, '05AV8TJGH8QZ6M2R');
  assert.equal(parsed?.agid, 'JP05AV8TJGH8');
  assert.equal((parsed as { privacy?: unknown })?.privacy, 'public-reference');
  assert.equal((parsed as { ownerManaged?: unknown })?.ownerManaged, undefined);
  assert.equal(parsed?.recipient, undefined);
  assert.equal(parsed?.phone, undefined);
  assert.equal(parsed?.room, undefined);
  assert.equal(parsed?.lat, undefined);
  assert.equal(parsed?.lon, undefined);
});

test('malformed AOID QR payloads are rejected before local registration', () => {
  const payload = `agid:address:${encodeURIComponent(JSON.stringify({
    version: 1,
    privacy: 'full',
    record: {
      type: 'AOID',
      id: 'bad id',
      name: 'Private Receiver',
      address: 'Private Place',
      registeredAt: '2026-05-31T00:10:00.000Z',
    },
  }))}`;

  assert.equal(parseRegisteredAddressQrPayload(payload), null);
});

test('public AGID QR payloads are sanitized again when parsed', () => {
  const payload = `agid:address:${encodeURIComponent(JSON.stringify({
    version: 1,
    privacy: 'public',
    record: {
      type: 'ADDRESS',
      id: 'JP05AV8TJGH8',
      agid: 'jp05av8tjgh8',
      name: 'Private Receiver',
      address: 'Public address label',
      registeredAt: '2026-05-31T00:10:00.000Z',
      recipient: 'Private Receiver',
      phone: '+81 90 0000 0000',
      room: '2801',
    },
  }))}`;

  const parsed = parseRegisteredAddressQrPayload(payload);

  assert.equal(parsed?.agid, 'JP05AV8TJGH8');
  assert.equal(parsed?.name, 'JP05AV8TJGH8');
  assert.equal(parsed?.address, 'Public address label');
  assert.equal(parsed?.recipient, undefined);
  assert.equal(parsed?.phone, undefined);
  assert.equal(parsed?.room, undefined);
});

test('registered addresses create saved QR entries that can be searched and scanned later', () => {
  const record = buildRegisteredAddressRecord(
    {
      country: 'VN',
      recipient: 'Lan Nguyen',
      organization: 'Landmark 81',
      street: 'Nguyen Huu Canh',
      suburb: 'Ward 22',
      city: 'Ho Chi Minh City',
      postcode: '700000',
    },
    {
      mode: 'ADDRESS',
      agid: 'VN00TEST0001',
      coords: { lat: 10.794, lon: 106.7218 },
      now: '2026-05-31T00:20:00.000Z',
    },
  );
  const payload = buildRegisteredAddressQrPayload(record);
  const savedQr = buildSavedQrFromRegisteredAddress(record, payload, '2026-05-31T00:21:00.000Z');

  assert.equal(savedQr.id, 'VN00TEST0001');
  assert.equal(savedQr.address, 'Landmark 81, Nguyen Huu Canh, Ward 22, Ho Chi Minh City 700000, VN');
  assert.equal(savedQr.regionName, 'VN Registered Address');
  assert.equal(savedQr.payload, payload);
  assert.equal(savedQr.lat, 10.794);
  assert.equal(savedQr.lon, 106.7218);
});

test('public registered address saved QR metadata does not expose raw address text', () => {
  const record = buildRegisteredAddressRecord(
    {
      country: 'VN',
      recipient: 'Lan Nguyen',
      organization: 'Landmark 81',
      street: 'Nguyen Huu Canh',
      suburb: 'Ward 22',
      city: 'Ho Chi Minh City',
      postcode: '700000',
      room: '2801',
    },
    {
      mode: 'ADDRESS',
      agid: 'VN00TEST0001',
      coords: { lat: 10.794, lon: 106.7218 },
      now: '2026-05-31T00:20:00.000Z',
    },
  );
  const payload = buildRegisteredAddressQrPayload(record, { privacy: 'public' });
  const savedQr = buildSavedQrFromRegisteredAddress(record, payload, '2026-05-31T00:21:00.000Z', { privacy: 'public' });

  assert.equal(savedQr.address, 'VN00TEST0001 public address reference');
  assert.doesNotMatch(JSON.stringify(savedQr), /Lan Nguyen|Landmark 81|Nguyen Huu Canh|Ward 22|2801/);
});

test('registered address QR carries public-safe quality metadata without adding private fields', () => {
  const quality = sampleQualitySnapshot();
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
      now: '2026-05-31T00:30:00.000Z',
      quality,
    },
  );

  const payload = buildRegisteredAddressQrPayload(record, { privacy: 'public' });
  const decoded = decodeQrPayload(payload);
  const parsed = parseRegisteredAddressQrPayload(payload);

  assert.equal(decoded.addressQuality.state, 'needs-review');
  assert.equal(decoded.addressQuality.privacy.fieldValuesIncluded, false);
  assert.equal(decoded.addressQuality.privacy.recipientIncluded, false);
  assert.equal(decoded.record.quality.state, 'needs-review');
  assert.doesNotMatch(JSON.stringify(decoded.addressQuality), /Aoi Kitau|1-1 Chiyoda|1000001|\+81 90/);
  assert.equal(parsed?.quality?.state, 'needs-review');
  assert.equal(parsed?.quality?.privacy.recipientIncluded, false);
  assert.equal(parsed?.recipient, undefined);
  assert.equal(parsed?.phone, undefined);
  assert.equal(parsed?.room, undefined);
});
