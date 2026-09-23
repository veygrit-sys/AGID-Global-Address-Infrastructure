import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_LEGACY_BASE_PATH, API_V1_BASE_PATH, apiV1Path, rewriteApiV1RequestUrl } from './apiVersion';

test('apiV1Path normalizes public API paths to the v1 base path', () => {
  assert.equal(API_LEGACY_BASE_PATH, '/api');
  assert.equal(API_V1_BASE_PATH, '/api/v1');
  assert.equal(apiV1Path('/health'), '/api/v1/health');
  assert.equal(apiV1Path('health'), '/api/v1/health');
  assert.equal(apiV1Path('/api/health'), '/api/v1/health');
  assert.equal(apiV1Path('/api/v1/health'), '/api/v1/health');
});

test('rewriteApiV1RequestUrl keeps legacy routes while accepting v1 requests', () => {
  assert.equal(rewriteApiV1RequestUrl('/api/v1/health'), '/api/health');
  assert.equal(rewriteApiV1RequestUrl('/api/v1/openapi.json'), '/api/openapi.json');
  assert.equal(rewriteApiV1RequestUrl('/api/health'), '/api/health');
  assert.equal(rewriteApiV1RequestUrl('/assets/app.js'), '/assets/app.js');
});
