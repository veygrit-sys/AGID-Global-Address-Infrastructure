import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressFormat } from '../data/address_formats';
import { encodeAGID } from './agid';
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
