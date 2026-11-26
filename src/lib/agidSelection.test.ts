import assert from 'node:assert/strict';
import { describe,it } from 'node:test';
import { encodeAGID } from './agid';
import { decodeAgidToResult, deviceAgidSelection, getAgidCoordinates, looksLikeAGID16, restoreAgidSelection, selectedGeographyInput } from './agidSelection';

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

it('decoding a historic cell does not attach modern point evidence to the original pin', () => {
  const result = decodeAgidToResult('P304K5APK9JT124R');
  assert.ok(result);
  assert.equal(result.prefix, 'P3');
  assert.equal(result.mapUnitMatch, undefined);
  assert.equal(result.waterMatch, undefined);
  assert.equal(result.administrativeMatch, undefined);
});

it('uses the original coordinates when looking up a pin inside a border cell', () => {
  const lat = -28.9086745, lon = 28.988132;
  const pin = encodeAGID(lat, lon);
  const cell = decodeAgidToResult(pin.id)!;
  assert.notDeepEqual(getAgidCoordinates(cell), { lat, lon });
  assert.deepEqual(getAgidCoordinates(pin), { lat, lon });
  assert.deepEqual(selectedGeographyInput(cell), { kind: 'cell', id: pin.id });
});

it('restores typed IDs and both current and older saved pins without reissuing their prefixes', () => {
  const lat = -28.9086745, lon = 28.988132;
  const id = 'LS03VSRC3KE51N0V';
  const cell = decodeAgidToResult(id)!;
  const storedCell = { id, lat: cell.lat, lon: cell.lon };
  assert.equal(restoreAgidSelection(storedCell)?.coordinateSource, 'cell');
  assert.equal(restoreAgidSelection({ id, lat, lon })?.coordinateSource, 'pin');
  assert.equal(restoreAgidSelection({ id })?.id, id);
  const legacyId = 'ZA' + cell.hash;
  const legacy = restoreAgidSelection({ id: legacyId, lat, lon });
  assert.equal(legacy?.id, legacyId);
  assert.equal(legacy?.prefix, 'ZA');
  assert.equal(restoreAgidSelection({ id, lat: 48, lon: 2 })?.coordinateSource, 'cell');
  const device = deviceAgidSelection({ latitude: lat, longitude: lon, accuracy: 12 });
  assert.deepEqual(selectedGeographyInput(restoreAgidSelection(device)!), {
    kind: 'pin', lat, lon, method: 'device', accuracyMeters: 12,
  });
});
