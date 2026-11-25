import assert from 'node:assert/strict';
import { test } from 'node:test';
import vectors from '../../sdk/agid-spec/test-vectors.json';
import spec from '../../sdk/agid-spec/agid-spec.json';
import { AGID_BASE32_ALPHABET as alphabet } from './agidContract';
import {
  decodeAGID, encodeAGID, encodeAGID16, getAGIDCellKey, getRegionInfo,
  normalizeAGIDCode, toAGID16, toLegacyAGID,
} from './agid';

const checkedIds = spec.checksummedExtension.vectors.map(vector => vector.checked);

// Independent bit-at-a-time reference for testing valid CRCs on invalid bodies.
function referenceChecksum(text: string) {
  let crc = 0;
  for (const char of text) {
    crc ^= char.charCodeAt(0) << 7;
    for (let i = 0; i < 8; i++) crc = ((crc << 1) ^ ((crc & 0x4000) ? 0x4599 : 0)) & 0x7fff;
  }
  return alphabet[crc >>> 10] + alphabet[(crc >>> 5) & 31] + alphabet[crc & 31];
}

test('AGID16 preserves issued prefixes, packed fields and cell bounds in the published vectors', () => {
  for (const [index, { lat, lon, expected }] of vectors.entries()) {
    const { id, face, qx, qy, cellBounds } = expected;
    const checked = checkedIds[index];
    assert.equal(toAGID16(id), checked);
    assert.equal(toLegacyAGID(checked), id);
    assert.equal(getAGIDCellKey(checked), [face, qx, qy].join(':'));
    assert.deepEqual(decodeAGID(checked)?.bounds, cellBounds);
    assert.deepEqual(decodeAGID(checked), decodeAGID(id));
    assert.deepEqual(encodeAGID16(lat, lon), { ...encodeAGID(lat, lon), id: checked });
  }
});

test('reader preserves wire width and prefix letters; only defined display forms normalize', () => {
  const id = checkedIds[0];
  assert.equal(normalizeAGIDCode(' jp05av8tjghd '), id.slice(0, 12));
  for (const input of [id, id.toLowerCase(), '  jp05-av8t-jghd-1meq\r\n']) {
    assert.equal(normalizeAGIDCode(input), id);
    assert.equal(toLegacyAGID(input), id.slice(0, 12));
    assert.equal(toAGID16(input), null);
  }
  for (const prefix of ['IO', 'IT', 'IL', '00', 'A1']) {
    const legacy = prefix + '0200000000';
    const checked = toAGID16(legacy.toLowerCase());
    assert.ok(checked);
    assert.equal(checked.slice(0, 12), legacy);
    assert.equal(toLegacyAGID(checked), legacy);
  }
  for (const invalid of [null, 7, {}, '', id + '0', id.slice(0, 15), 'jp05av8tjgh-d1meq',
    'jp05 av8t jghd 1meq', 'jp05--av8t-jghd-1meq', 'jp05-av8t-jghd', 'jp05av8t jghd',
    'ſP05AV8TJGHD', 'ıO0200000000', 'ＪP05AV8TJGHD', 'JP05AV8TJGHＯ1MEQ']) {
    assert.equal(toLegacyAGID(invalid), null);
    assert.equal(normalizeAGIDCode(invalid), null);
    assert.equal(toAGID16(invalid), null);
  }
});

test('reader validates version, hash alphabet and packed face even with a matching checksum', () => {
  for (const body of ['JP05AV8TJGHD0', 'JP05AV8TJGHDO', 'JP05AV8TJGHĎ1', 'JP0R000000001',
    'JP0W000000001', 'JP10000000001', 'JPZZZZZZZZZZ1', 'JP05AV8TJGHU1']) {
    const validChecksum = body + referenceChecksum(body);
    assert.equal(decodeAGID(validChecksum), null);
    assert.equal(normalizeAGIDCode(validChecksum), null);
    assert.equal(toLegacyAGID(validChecksum), null);
  }
});

test('all one-character substitutions and distinct adjacent swaps in the three vectors are rejected', () => {
  for (const id of checkedIds) {
    for (let index = 0; index < id.length; index++) {
      const choices = index < 2 ? '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ' : alphabet;
      for (const character of choices) {
        if (character === id[index]) continue;
        const invalid = id.slice(0, index) + character + id.slice(index + 1);
        assert.equal(decodeAGID(invalid), null, invalid);
      }
      if (index > 0 && id[index - 1] !== id[index]) {
        const swapped = id.slice(0, index - 1) + id[index] + id[index - 1] + id.slice(index + 1);
        assert.equal(decodeAGID(swapped), null, swapped);
      }
    }
  }
});

test('old and new IDs identify identical cells on all six faces and the antimeridian', () => {
  const faces = new Set<number>();
  for (const lat of [-90, -45, 0, 45, 90]) {
    for (const lon of [-180, -135, -90, -45, 0, 45, 90, 135, 180]) {
      const legacy = encodeAGID(lat, lon);
      faces.add(legacy.face);
      const checked = encodeAGID16(lat, lon);
      assert.equal(toAGID16(legacy.id), checked.id);
      assert.equal(getAGIDCellKey(checked), getAGIDCellKey(legacy));
      assert.deepEqual(decodeAGID(checked.id), decodeAGID(legacy.id));
    }
  }
  assert.equal(faces.size, 6);
});

test('coordinate inputs reject invalid latitude and nonfinite longitude and wrap finite longitudes', () => {
  for (const reader of [getRegionInfo, encodeAGID, encodeAGID16]) {
    for (const [lat, lon] of [[NaN, 0], [-91, 0], [91, 0], [0, Infinity], [0, -Infinity], [0, NaN]]) {
      assert.throws(() => reader(lat, lon), RangeError);
    }
  }
  for (const lon of [720, 900, -900, 2 ** 53, -(2 ** 53), Number.MAX_VALUE]) {
    let wrapped = lon % 360;
    if (wrapped > 180) wrapped -= 360;
    if (wrapped < -180) wrapped += 360;
    assert.deepEqual(getRegionInfo(30, lon), getRegionInfo(30, wrapped));
    assert.equal(encodeAGID(30, lon).id, encodeAGID(30, wrapped).id);
    assert.equal(encodeAGID16(30, lon).id, encodeAGID16(30, wrapped).id);
  }
});
