import assert from 'node:assert/strict';
import { describe,it } from 'node:test';
import { encodeAGID } from './agid';
import { decodeAgidToResult, getAgidCoordinates, looksLikeAGID16 } from './agidSelection';

describe('getAgidCoordinates', () => {
  it('decodes canonical AGID ids', () => {
    const agid = encodeAGID(35.6812, 139.7671);
    const coords = getAgidCoordinates(agid);

    assert.ok(coords);
    assert.ok(Math.abs(coords.lat - 35.6812) < 0.001);
    assert.ok(Math.abs(coords.lon - 139.7671) < 0.001);
  });

  it('falls back to stored coordinates for non-decodable AGID-like selections', () => {
    assert.deepEqual(
      getAgidCoordinates({ id: 'legacy-or-special-id', lat: -33.8688, lon: 151.2093 }),
      { lat: -33.8688, lon: 151.2093 },
    );
  });

  it('returns null when neither id nor stored coordinates are usable', () => {
    assert.equal(getAgidCoordinates({ id: 'bad' }), null);
  });
});

describe('map AGID input', () => {
  it('preserves the entered prefix, 10-character hash and checked ID', () => {
    const result = decodeAgidToResult('jp05-av8t-jghd-1meq');
    assert.ok(result);
    assert.equal(result.id, 'JP05AV8TJGHD1MEQ');
    assert.equal(result.hash, '05AV8TJGHD');
    assert.deepEqual(result.bounds, decodeAgidToResult('JP05AV8TJGHD')?.bounds);
  });

  it('recognizes mistyped checked IDs and leaves place names available to search', () => {
    for (const input of ['JP05AV8TJGHD1MEA', 'jp05-av8t-jghd-1mer', 'JP05AV8TJGHD2MEQ']) {
      assert.equal(looksLikeAGID16(input), true);
      assert.equal(decodeAgidToResult(input), null);
    }
    assert.equal(looksLikeAGID16('FrankfurtAirport'), false);
  });
});
