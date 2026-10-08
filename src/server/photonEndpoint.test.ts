import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildPhotonSearchUrl,
  DEFAULT_PHOTON_SEARCH_URL,
} from './photonEndpoint';

test('Photon URL builder keeps the public HTTPS default and encodes search input', () => {
  const url = new URL(buildPhotonSearchUrl({
    query: 'Tokyo Station',
    limit: 50,
    lat: 35.6812,
    lon: 139.7671,
  }));

  assert.equal(url.origin + url.pathname, DEFAULT_PHOTON_SEARCH_URL);
  assert.equal(url.searchParams.get('q'), 'Tokyo Station');
  assert.equal(url.searchParams.get('limit'), '20');
  assert.equal(url.searchParams.get('lat'), '35.6812');
  assert.equal(url.searchParams.get('lon'), '139.7671');
});

test('Photon URL builder permits a loopback self-hosted service', () => {
  const url = new URL(buildPhotonSearchUrl({
    endpoint: 'http://127.0.0.1:2322/api/',
    query: 'Bern',
    limit: 3,
  }));

  assert.equal(url.origin, 'http://127.0.0.1:2322');
  assert.equal(url.pathname, '/api/');
  assert.equal(url.searchParams.get('limit'), '3');
});

test('Photon URL builder blocks insecure remote and credential-bearing endpoints', () => {
  assert.throws(
    () => buildPhotonSearchUrl({ endpoint: 'http://example.com/api/', query: 'Bern' }),
    /HTTPS or loopback HTTP/,
  );
  assert.throws(
    () => buildPhotonSearchUrl({ endpoint: 'https://user:secret@example.com/api/', query: 'Bern' }),
    /without URL credentials/,
  );
  assert.throws(
    () => buildPhotonSearchUrl({ endpoint: 'https://example.com/api/?token=secret', query: 'Bern' }),
    /must not include query parameters/,
  );
});
