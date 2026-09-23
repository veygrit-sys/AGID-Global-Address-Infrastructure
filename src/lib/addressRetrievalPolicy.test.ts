import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ADDRESS_RETRIEVAL_TIMEOUTS,
  withAddressLookupTimeout,
} from './addressRetrievalPolicy';

test('uses short timeouts for optional address enrichment', () => {
  assert.ok(ADDRESS_RETRIEVAL_TIMEOUTS.optionalGeoMs <= 5_000);
  assert.ok(ADDRESS_RETRIEVAL_TIMEOUTS.buildingNameMs <= 4_000);
  assert.ok(ADDRESS_RETRIEVAL_TIMEOUTS.coreReverseMs <= 12_000);
});

test('returns fallback when optional lookup exceeds its budget', async () => {
  const slowLookup = new Promise<string>(resolve => {
    setTimeout(() => resolve('late'), 50);
  });

  const result = await withAddressLookupTimeout(slowLookup, 5, 'fallback');

  assert.equal(result, 'fallback');
});

test('keeps fast optional lookup result', async () => {
  const result = await withAddressLookupTimeout(Promise.resolve('fast'), 50, 'fallback');

  assert.equal(result, 'fast');
});
