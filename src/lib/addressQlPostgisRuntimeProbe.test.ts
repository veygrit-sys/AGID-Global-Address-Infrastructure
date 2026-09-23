import assert from 'node:assert/strict';
import test from 'node:test';

import {
  addressQlPostgisRuntimePreflightQuery,
  probeAddressQlPostgisRuntime,
} from './addressQlPostgisRuntimeProbe';

test('PostGIS runtime preflight reads extension metadata only', async () => {
  let observedQuery = '';
  const result = await probeAddressQlPostgisRuntime(async sql => {
    observedQuery = sql;
    return { rows: [{ extname: 'postgis', extversion: '3.5.2' }] };
  });

  assert.equal(result.status, 'available');
  assert.equal(result.extensionVersion, '3.5.2');
  assert.equal(result.containsAddressMaterial, false);
  assert.match(observedQuery, /^SELECT extname, extversion/m);
  assert.doesNotMatch(observedQuery, /INSERT|UPDATE|DELETE|COPY/i);
  assert.equal(observedQuery, addressQlPostgisRuntimePreflightQuery());
});

test('PostGIS preflight fails closed when extension metadata is missing or malformed', async () => {
  const missing = await probeAddressQlPostgisRuntime(async () => ({ rows: [] }));
  assert.deepEqual(missing, {
    version: 'addressql-postgis-runtime-preflight-v1',
    status: 'missing',
    extension: 'postgis',
    reason: 'postgis-extension-not-installed',
    dataAccess: 'extension-metadata-only',
    containsAddressMaterial: false,
  });

  const malformed = await probeAddressQlPostgisRuntime(async () => ({
    rows: [{ extname: 'postgis', extversion: 'unknown' }],
  }));
  assert.equal(malformed.status, 'blocked');
  assert.equal(malformed.reason, 'postgis-version-invalid');
});

test('PostGIS preflight masks query failures as a capability block', async () => {
  const result = await probeAddressQlPostgisRuntime(async () => {
    throw new Error('connection failed');
  });
  assert.equal(result.status, 'blocked');
  assert.equal(result.reason, 'postgis-query-failed');
  assert.equal(result.containsAddressMaterial, false);
});
