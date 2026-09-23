import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAddressRetrievalKey,
  clearAddressRetrievalCache,
  getCachedAddressRetrieval,
} from './addressRetrievalCache';

test('deduplicates concurrent address retrieval for the same rounded location and language', async () => {
  clearAddressRetrievalCache();

  let calls = 0;
  let resolveLookup: (value: { address: { city: string } }) => void = () => {};
  const lookupStarted = new Promise<{ address: { city: string } }>(resolve => {
    resolveLookup = resolve;
  });

  const lookup = async () => {
    calls += 1;
    return lookupStarted;
  };

  const first = getCachedAddressRetrieval(
    { lat: 35.6812361, lon: 139.7671251, langCode: 'ja', countryCode: 'JP' },
    lookup,
  );
  const second = getCachedAddressRetrieval(
    { lat: 35.6812362, lon: 139.7671252, langCode: 'ja', countryCode: 'jp' },
    lookup,
  );

  assert.equal(calls, 1);
  resolveLookup({ address: { city: 'Tokyo' } });

  assert.deepEqual(await first, { address: { city: 'Tokyo' } });
  assert.deepEqual(await second, { address: { city: 'Tokyo' } });
});

test('serves recent completed address retrieval from memory cache', async () => {
  clearAddressRetrievalCache();

  let calls = 0;
  const lookup = async () => {
    calls += 1;
    return { address: { city: 'Osaka' } };
  };

  const request = { lat: 34.6937378, lon: 135.5021651, langCode: 'en', countryCode: 'JP' };
  const first = await getCachedAddressRetrieval(request, lookup, { ttlMs: 60_000 });
  const second = await getCachedAddressRetrieval(request, lookup, { ttlMs: 60_000 });

  assert.equal(calls, 1);
  assert.deepEqual(first, second);
});

test('keeps high precision keys separate from normal map lookup keys', () => {
  clearAddressRetrievalCache();

  const normalKey = buildAddressRetrievalKey({
    lat: 35.68123611,
    lon: 139.76712511,
    langCode: 'ja',
    countryCode: 'JP',
  });
  const highPrecisionKey = buildAddressRetrievalKey({
    lat: 35.68123611,
    lon: 139.76712511,
    langCode: 'ja',
    countryCode: 'JP',
    highPrecision: true,
  });

  assert.notEqual(normalKey, highPrecisionKey);
});
