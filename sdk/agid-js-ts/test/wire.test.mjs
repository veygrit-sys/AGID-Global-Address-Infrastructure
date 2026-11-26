import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidAgid, normalizeAgid, normalizeAGIDCode, toAGID16, toLegacyAGID, validateAgid } from '../dist/index.js';

test('reads both formats through the built SDK package', () => {
  const legacy = 'JP05AV8TJGHD';
  const wire = 'JP05AV8TJGHD1MEQ';
  const grouped = 'jp05-av8t-jghd-1meq';
  assert.equal(toAGID16(legacy), wire);
  for (const input of [legacy, wire, grouped]) {
    assert.equal(toLegacyAGID(input), legacy);
    assert.equal(isValidAgid(input), true);
  }
  assert.equal(normalizeAGIDCode(grouped), wire);
  assert.equal(normalizeAgid(grouped), wire);
  assert.deepEqual(validateAgid(grouped), { ok: true, normalized: wire, issues: [] });
  for (const invalid of ['JP05AV8TJGHD1MER', 'JP05AV8TJGHD2MEQ', 'JP0R00000000', 'JP０5AV8TJGHD']) {
    assert.equal(normalizeAGIDCode(invalid), null);
    assert.equal(toLegacyAGID(invalid), null);
    assert.equal(isValidAgid(invalid), false);
    assert.equal(validateAgid(invalid).ok, false);
  }
});
