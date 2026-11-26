import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressFormat } from '../data/address_formats';
import { encodeAGID, encodeAGID16 } from './agid';
import { createAgidSecureToken } from './agidSecureShare';
import { generatePosSecureKeyEntry } from './agidSecurePos';
import {
  buildRegisteredAddressQrPayload,
  buildRegisteredAddressRecord,
} from './registeredAddressQr';
import {
  AGID_LOCAL_RESOLVER_VERSION,
  resolveAgidLocal,
} from './agidLocalResolver';

const jpFormat = {
  countryCode: 'JP',
  name: 'Japan',
  native: {
    addressFormat: '{{postcode}}\n{{state}}{{city}}{{street}}{{houseNumber}}\n{{organization}}',
    ordering: 'big-to-small',
    fields: [
      { key: 'countryCode', label: 'Country code', required: true },
      { key: 'postcode', label: 'Postal code', required: true },
      { key: 'state', label: 'Prefecture', required: true },
      { key: 'city', label: 'City', required: true },
    ],
  },
  english: {
    addressFormat: '{{organization}}\n{{houseNumber}} {{street}}, {{city}}, {{state}} {{postcode}}\n{{country}}',
    ordering: 'small-to-big',
    fields: [],
  },
  postalCode: {
    regex: '^\\d{3}-?\\d{4}$',
    source: 'japan-post',
    api: null,
    format: 'NNN-NNNN',
  },
  openSourceIds: ['japan-post', 'osm-nominatim'],
} satisfies AddressFormat;

function hexToBytes(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

test('resolves coordinates to a local AGID without server, ZK, or Ethereum', async () => {
  const result = await resolveAgidLocal({
    coordinates: { lat: 35.681236, lon: 139.767125 },
    addressFormat: jpFormat,
  });

  assert.equal(result.resolverVersion, AGID_LOCAL_RESOLVER_VERSION);
  assert.equal(result.mode, 'local-only');
  assert.equal(result.inputKind, 'coordinates');
  assert.equal(result.agid?.id.length, 12);
  assert.equal(result.coordinates?.lat, result.agid?.lat);
  assert.ok(result.actions.includes('do-not-send-private-fields'));
  assert.ok(result.intelligence);
});

test('resolves a public AGID query back to cell coordinates and address intelligence', async () => {
  const agid = encodeAGID(35.681236, 139.767125);
  const result = await resolveAgidLocal({
    query: agid.id,
    addressFormat: jpFormat,
  });

  assert.equal(result.inputKind, 'agid');
  assert.equal(result.agid?.id, agid.id);
  assert.equal(result.coordinates?.lat, result.agid?.lat);
  assert.ok(result.audit.some(item => item.step === 'decode-agid' && item.status === 'ok'));
});

test('parses registered address QR payloads into the same local resolver result shape', async () => {
  const agid = encodeAGID(35.685, 139.752);
  const record = buildRegisteredAddressRecord({
    country: 'JP',
    recipient: 'Test Recipient',
    organization: 'Test Building',
    street: 'Chiyoda 1-1',
    city: 'Chiyoda',
    state: 'Tokyo',
    postcode: '100-0001',
  }, {
    agid: agid.id,
    coords: { lat: agid.lat, lon: agid.lon },
    now: '2026-01-01T00:00:00.000Z',
  });
  const payload = buildRegisteredAddressQrPayload(record);
  const result = await resolveAgidLocal({
    query: payload,
    addressFormat: jpFormat,
    selectedLanguageTab: 'local',
  });

  assert.equal(result.inputKind, 'registered-address');
  assert.equal(result.registeredAddress?.id, record.id);
  assert.equal(result.agid?.id, agid.id);
  assert.equal(result.intelligence?.canonicalAddress.postcode, '100-0001');
  assert.ok(result.actions.includes('do-not-send-private-fields'));
});

test('requires a local key before opening AGID-S tokens', async () => {
  const result = await resolveAgidLocal({
    query: 'AGIDS1-INVALIDTOKEN',
  });

  assert.equal(result.inputKind, 'agid-s');
  assert.equal(result.status, 'needs-key');
  assert.ok(result.actions.includes('request-agid-s-key'));
  assert.ok(!result.agid);
});

test('opens AGID-S locally when the POS key ring contains the matching key', async () => {
  const now = Date.parse('2026-01-01T00:00:00.000Z');
  const key = generatePosSecureKeyEntry({
    keyId: 'pos-local-test',
    createdAt: new Date(now).toISOString(),
  });
  const agid = encodeAGID(35.681236, 139.767125);
  const token = await createAgidSecureToken({
    agid: agid.id,
    key: hexToBytes(key.keyMaterial),
    keyId: key.keyId,
    exp: Math.floor(now / 1000) + 300,
    purpose: 'pos',
    now,
  });

  const result = await resolveAgidLocal({
    query: token,
    addressFormat: jpFormat,
    agidSecure: {
      keyRing: [key],
      expectedPurpose: 'pos',
      now,
    },
  });

  assert.equal(result.inputKind, 'agid-s');
  assert.notEqual(result.status, 'invalid');
  assert.equal(result.secure?.opened.ok, true);
  assert.equal(result.agid?.id, agid.id);
  assert.ok(result.actions.includes('queue-server-registry-check'));
});

test('a registered legacy ID remains the lookup key when the pin now has a new prefix', async () => {
  const pin = { lat: 35.35, lon: 139.76 };
  const issued = 'JP' + encodeAGID(pin.lat, pin.lon).hash;
  const record = buildRegisteredAddressRecord({ country: 'JP' }, { agid: issued, coords: pin });
  const resolved = await resolveAgidLocal({ record, coordinates: pin, addressFormat: null });
  assert.notEqual(encodeAGID(pin.lat, pin.lon).id, issued);
  assert.equal(resolved.agid?.id, issued);
  assert.deepEqual(resolved.coordinates, pin);
  const conflicting = await resolveAgidLocal({ record, coordinates: { lat: 0, lon: 0 }, addressFormat: null });
  assert.equal(conflicting.agid?.id, issued);
  assert.ok(conflicting.warnings.includes('pin-outside-issued-cell'));
});


test('border candidates do not select a postal country, and an explicit destination survives', async () => {
  // Midpoint on the surveyed India–Pakistan boundary at Attari–Wagah.
  const boundary = { lat: 31.6039325, lon: 74.5733387 };
  const requests: string[] = [];
  const addressFormatResolver = async (code: string) => { requests.push(code); return null; };
  for (const input of [
    { coordinates: boundary },
    { query: encodeAGID(boundary.lat, boundary.lon).id },
    { query: encodeAGID16(boundary.lat, boundary.lon).id },
    { coordinates: { lat: 31.60403, lon: 74.57333, accuracyMeters: 40 } },
  ]) {
    const result = await resolveAgidLocal({ ...input, addressFormatResolver, apiAddress: { country_code: 'in' }, details: { cc: 'PK' } });
    assert.deepEqual(result.geography?.landBorder?.codes, ['IN', 'PK']);
    assert.ok(result.warnings.includes('border-country-needs-confirmation'));
    assert.equal(result.agid?.regionCode, 'BORDER_UNRESOLVED');
    assert.ok(result.actions.includes('ask-user-to-confirm'));
    assert.equal(result.intelligence?.canonicalAddress.country_code, undefined);
    assert.equal(result.geography?.deliveryRegion, null);
  }
  assert.deepEqual(requests, []);
  const selected = await resolveAgidLocal({ coordinates: boundary, countryCode: 'PK', addressFormatResolver });
  assert.deepEqual(requests, ['PK']);
  assert.equal(selected.intelligence?.canonicalAddress.country_code, 'pk');
  assert.deepEqual(selected.geography?.regionCandidates, ['IN', 'PK']);
});

test('an exclusive border interior can drive the format; a disputed interior cannot', async () => {
  const requests: string[] = [];
  const addressFormatResolver = async (code: string) => { requests.push(code); return null; };
  await resolveAgidLocal({ coordinates: { lat: 31.6049325, lon: 74.57333 }, addressFormatResolver });
  assert.deepEqual(requests, ['IN']);
  const disputed = { lat: 35.1, lon: 79.9 };
  for (const input of [
    { coordinates: disputed },
    { query: encodeAGID16(disputed.lat, disputed.lon).id },
  ]) {
    const result = await resolveAgidLocal({ ...input, addressFormatResolver });
    assert.ok(result.geography?.landBorder?.disputedAreas?.length);
    assert.deepEqual(result.geography?.regionCandidates, ['CN', 'IN']);
    assert.equal(result.intelligence?.canonicalAddress.country_code, undefined);
  }
  assert.deepEqual(requests, ['IN']);
});


test('a disk extending into the surveyed area cannot select its sole observed candidate', async () => {
  const coordinates = { lat: 42.0001, lon: 104.5001, accuracyMeters: 35 };
  const requests: string[] = [];
  const result = await resolveAgidLocal({ coordinates, addressFormatResolver: async code => { requests.push(code); return null; } });
  assert.equal(result.geography?.footprint.kind, 'device-pin');
  assert.deepEqual(result.geography?.regionCandidates, ['MN']);
  assert.equal(result.geography?.landBorder?.partialCoverage, true);
  assert.equal(result.geography.status, 'needs-confirmation');
  assert.deepEqual(requests, []);
  assert.equal(result.intelligence?.canonicalAddress.country_code, undefined);
});
