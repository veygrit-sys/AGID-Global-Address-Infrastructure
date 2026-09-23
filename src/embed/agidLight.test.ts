import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeAGID } from '../lib/agid';
import { decodeAgidLight, encodeAgidLight, normalizeLon } from './agidLight';

test('light embed encoder uses the same AGID hash math as the full app encoder', () => {
  const tokyoStation = { lat: 35.681236, lon: 139.767125 };
  const full = encodeAGID(tokyoStation.lat, tokyoStation.lon);
  const light = encodeAgidLight(tokyoStation.lat, tokyoStation.lon, 'JP');

  assert.equal(light.id.length, 12);
  assert.equal(light.prefix, 'JP');
  assert.equal(light.hash, full.hash);
});

test('light embed decoder round-trips coordinates without importing the full app bundle', () => {
  const encoded = encodeAgidLight(51.5074, -0.1278, 'GB');
  const decoded = decodeAgidLight(encoded.id);

  assert.ok(decoded);
  assert.equal(decoded.prefix, 'GB');
  assert.ok(Math.abs(decoded.lat - 51.5074) < 0.0001);
  assert.ok(Math.abs(decoded.lon - -0.1278) < 0.0001);
});

test('light embed sanitizes prefixes and rejects invalid AGID ids', () => {
  assert.equal(encodeAgidLight(0, 181, 'jp-japan').prefix, 'JP');
  assert.equal(normalizeLon(181), -179);
  assert.equal(decodeAgidLight('bad'), null);
  assert.equal(decodeAgidLight('JP!!!!!!!!!!'), null);
});
