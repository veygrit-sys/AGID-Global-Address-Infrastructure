import assert from 'node:assert/strict';
import test from 'node:test';
import prefixes from '../data/namedSeaPrefixes.json';
import { decodeAGID, encodeAGID, generateFullSeaRegistry, generatePrefix } from './agid';
import { SEA_REGIONS } from './regions';

test('named seas keep their published assignments even when colliding IDs are requested in reverse order', () => {
  assert.equal(generatePrefix('SULU', true, 'Sulu Sea'), '7G');
  assert.equal(generatePrefix('TASM', true, 'Tasman Sea'), '7F');
  assert.equal(encodeAGID(-40, 160).id, '7F048D992A8C');
  const named = generateFullSeaRegistry().filter(area => area.type === 'Named Sea');
  assert.deepEqual(new Set(named.map(area => area.id)), new Set(Object.keys(prefixes)));
  assert.equal(new Set(named.map(area => area.prefix)).size, named.length);
  const expected = new Map(Object.entries(prefixes));
  for (const sea of [...SEA_REGIONS].reverse()) {
    assert.ok(sea.id);
    assert.equal(generatePrefix(sea.id, true, sea.name), expected.get(sea.id));
  }
  assert.equal(encodeAGID(-40, 160).id, '7F048D992A8C');
  assert.equal(encodeAGID(0, 0).id, '3B0200000000');
});

test('both historical Tasman Sea prefixes still decode to the original location', () => {
  const first = decodeAGID('7F048D992A8C');
  const second = decodeAGID('7G048D992A8C');
  assert.ok(first && second);
  assert.deepEqual(first.bounds, second.bounds);
  assert.deepEqual([first.face, first.qx, first.qy], [second.face, second.qx, second.qy]);
});
