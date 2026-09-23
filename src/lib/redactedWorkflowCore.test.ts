import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addSecondsToIso,
  cleanBoolean,
  cleanNonNegativeInteger,
  cleanNumber,
  cleanText,
  cleanTextArray,
  hasAnyPresentKey,
  stableCommitment,
  stableId,
  stableJson,
  toIsoTimestamp,
} from './redactedWorkflowCore';

test('redacted workflow core serializes objects deterministically', () => {
  assert.equal(
    stableJson({ b: 2, a: { d: 4, c: 3 } }),
    stableJson({ a: { c: 3, d: 4 }, b: 2 }),
  );
  assert.equal(stableId('RID', { b: 2, a: 1 }), stableId('RID', { a: 1, b: 2 }));
  assert.match(stableCommitment('domain', ['x', 1]), /^domain:[0-9a-f]{24}$/);
});

test('redacted workflow core normalizes primitive inputs conservatively', () => {
  assert.equal(cleanText('  hello  '), 'hello');
  assert.equal(cleanText(123, 'fallback'), 'fallback');
  assert.deepEqual(cleanTextArray([' a ', 1, 'b']), ['a', 'b']);
  assert.equal(cleanNumber('12.5', 0), 12.5);
  assert.equal(cleanNonNegativeInteger('-2', 9), 0);
  assert.equal(cleanBoolean('on'), true);
  assert.equal(cleanBoolean('off'), false);
});

test('redacted workflow core handles timestamps and private-material key checks', () => {
  assert.equal(toIsoTimestamp('2026-06-18T00:00:00Z'), '2026-06-18T00:00:00.000Z');
  assert.equal(addSecondsToIso('2026-06-18T00:00:00.000Z', 60), '2026-06-18T00:01:00.000Z');
  assert.equal(hasAnyPresentKey({ rawAddress: '', pin: null }, ['rawAddress', 'pin']), false);
  assert.equal(hasAnyPresentKey({ rawAddress: 'private' }, ['rawAddress', 'pin']), true);
});
