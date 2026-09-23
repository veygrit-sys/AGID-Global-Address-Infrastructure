import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTopographicEnuFrame,
  enuToEcefPoint,
  geodeticToEcefPoint,
  geodeticToEnuPoint,
} from './topographicGeodesy';

test('WGS 84 origin produces an orthonormal ENU frame in EPSG:4978', () => {
  const frame = createTopographicEnuFrame(0, 0);

  assert.deepEqual(frame.origin.ecefMeters, [6_378_137, 0, 0]);
  assert.deepEqual(
    frame.enuToEcefTransform.map(value => Object.is(value, -0) ? 0 : value),
    [
      0, 1, 0, 0,
      0, 0, 1, 0,
      1, 0, 0, 0,
      6_378_137, 0, 0, 1,
    ],
  );
});

test('Tokyo geodetic coordinates round-trip through the local ENU frame', () => {
  const frame = createTopographicEnuFrame(139.58472, 35.6276);
  const source: [number, number, number] = [139.62065, 35.6568, 44.25];
  const enu = geodeticToEnuPoint(...source, frame);
  const roundTripEcef = enuToEcefPoint(enu, frame);
  const expectedEcef = geodeticToEcefPoint(...source);

  assert.ok(enu[0] > 3_000);
  assert.ok(enu[1] > 3_000);
  assert.ok(enu[2] < 44.25);
  assert.ok(Math.hypot(
    roundTripEcef[0] - expectedEcef[0],
    roundTripEcef[1] - expectedEcef[1],
    roundTripEcef[2] - expectedEcef[2],
  ) < 1e-8);
});

test('ENU conversion remains continuous across the antimeridian', () => {
  const frame = createTopographicEnuFrame(179.99, 0);
  const enu = geodeticToEnuPoint(-179.99, 0, 0, frame);

  assert.ok(enu[0] > 2_000 && enu[0] < 2_300);
  assert.ok(Math.abs(enu[1]) < 1e-8);
  assert.ok(enu[2] < 0);
});

test('geodetic conversion rejects invalid or non-finite positions', () => {
  assert.throws(
    () => geodeticToEcefPoint(181, 0, 0),
    /requires finite longitude/,
  );
  assert.throws(
    () => geodeticToEcefPoint(0, 91, 0),
    /requires finite longitude/,
  );
  assert.throws(
    () => geodeticToEcefPoint(0, 0, Number.NaN),
    /requires finite longitude/,
  );
});
