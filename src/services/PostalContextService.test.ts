import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { AgidApiResult } from '../lib/agidHttpClient';
import {
  getPostalContextResearchCountry,
  intersectPostalContext,
  lookupPostalContext,
  resolvePostalContext,
  type PostalContextResolveRequest,
  type PostalContextResolveResponse,
} from './PostalContextService';

const VALID_AT = '2026-08-24T00:00:00Z';
const KNOWN_AT = '2026-08-24T01:02:03.456Z';
const MANIFEST_DIGEST = `sha256:${'a'.repeat(64)}`;

const BASE_RESOLVE_REQUEST: PostalContextResolveRequest = {
  countryCode: 'JP',
  latitude: 35.681236,
  longitude: 139.767125,
  purpose: 'display',
  validAt: VALID_AT,
};

type InternalResolverKey = Extract<
  keyof PostalContextResolveRequest,
  'graph' | 'startNodeId' | 'visibility'
>;
type HasNoInternalResolverKeys = [InternalResolverKey] extends [never] ? true : false;
const HAS_NO_INTERNAL_RESOLVER_KEYS: HasNoInternalResolverKeys = true;

function agidEnvelope(status: 'unique' | 'ambiguous' | 'no_match'): AgidApiResult<PostalContextResolveResponse> {
  return {
    ok: true,
    data: {
      status,
      purpose: 'display',
      release: {
        countryCode: 'JP',
        repositoryId: 'postal-polygons-jp',
        releaseId: 'jp-2026-08-24',
        manifestDigest: MANIFEST_DIGEST,
        policyVersion: 'postal-context-policy/v0.1',
        releasedAt: VALID_AT,
        validTime: { from: VALID_AT },
      },
      countryCode: 'JP',
      resolvedLevel: status === 'unique' ? 'postal_area' : 'none',
      capabilities: {
        country: true,
        administrative: true,
        locality: true,
        postalArea: status === 'unique',
        streetOrBlock: false,
        premise: false,
        building: false,
        entrance: false,
        unit: false,
        organization: false,
        deliveryEndpoint: false,
        publicSafe: true,
      },
      alternatives: [],
      postalEvidence: [],
      addressPointEvidence: {
        matched: false,
        candidateCount: 0,
      },
      ambiguities: [],
      errors: [],
      warnings: [],
      validAt: VALID_AT,
      knownAt: VALID_AT,
      agid: {
        cellId: 'AGID7ZZZZZZZZ',
        gridAxisBits: 21,
        role: 'spatial-reference-and-candidate-index',
        canonicalPostalGeometry: false,
      },
    },
    sources: ['agid-postal-context-runtime'],
    warnings: [],
    cache: 'none',
    requestId: `req-${status}`,
  };
}

test('postal context resolve sends the normalized public POST contract to API v1', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return Response.json(agidEnvelope('unique'));
  };

  const result = await resolvePostalContext(
    {
      ...BASE_RESOLVE_REQUEST,
      countryCode: ' jp ',
      knownAt: KNOWN_AT,
      release: {
        mode: 'pinned',
        releaseId: ' jp-2026-08-24 ',
        manifestDigest: MANIFEST_DIGEST,
        policyVersion: ' postal-context-policy/v0.1 ',
      },
    },
    { fetcher, timeoutMs: 2_500 },
  );

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/v1/postal/resolve');
  assert.equal(calls[0].init?.method, 'POST');
  const headers = new Headers(calls[0].init?.headers);
  assert.equal(headers.get('accept'), 'application/json');
  assert.equal(headers.get('content-type'), 'application/json');
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
    countryCode: 'JP',
    latitude: 35.681236,
    longitude: 139.767125,
    purpose: 'display',
    validAt: VALID_AT,
    knownAt: KNOWN_AT,
    release: {
      mode: 'pinned',
      releaseId: 'jp-2026-08-24',
      manifestDigest: MANIFEST_DIGEST,
      policyVersion: 'postal-context-policy/v0.1',
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.data?.status, 'unique');
  assert.equal(result.requestId, 'req-unique');
  assert.deepEqual(result.sources, ['agid-postal-context-runtime']);
});

test('postal context resolve rejects invalid public input before fetch', async () => {
  let fetchCalls = 0;
  const fetcher: typeof fetch = async () => {
    fetchCalls += 1;
    return Response.json(agidEnvelope('unique'));
  };
  const invalidRequests: PostalContextResolveRequest[] = [
    { ...BASE_RESOLVE_REQUEST, countryCode: 'JPN' },
    { ...BASE_RESOLVE_REQUEST, latitude: Number.NaN },
    { ...BASE_RESOLVE_REQUEST, latitude: 90.000_001 },
    { ...BASE_RESOLVE_REQUEST, longitude: -180.000_001 },
    {
      ...BASE_RESOLVE_REQUEST,
      purpose: 'guess-address' as PostalContextResolveRequest['purpose'],
    },
    { ...BASE_RESOLVE_REQUEST, validAt: '2026-08-24' },
    { ...BASE_RESOLVE_REQUEST, knownAt: 'not-an-instant' },
    {
      ...BASE_RESOLVE_REQUEST,
      release: {
        mode: 'pinned',
        releaseId: 'jp-2026-08-24',
        manifestDigest: 'sha256:invalid',
        policyVersion: 'postal-context-policy/v0.1',
      },
    },
  ];

  for (const request of invalidRequests) {
    await assert.rejects(
      resolvePostalContext(request, { fetcher }),
      error => error instanceof TypeError && /^Invalid Postal Context/.test(error.message),
    );
  }
  assert.equal(fetchCalls, 0);
});

test('postal context lookup encodes the postal code as one path segment and builds its query', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return Response.json(agidEnvelope('unique'));
  };

  await lookupPostalContext(
    {
      countryCode: 'jp',
      postalCode: ' 100/0001 ?# ',
      validAt: VALID_AT,
      knownAt: KNOWN_AT,
      includeGeometry: false,
    },
    { fetcher },
  );

  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].url,
    '/api/v1/postal/JP/100%2F0001%20%3F%23'
      + '?validAt=2026-08-24T00%3A00%3A00Z'
      + '&knownAt=2026-08-24T01%3A02%3A03.456Z'
      + '&geometry=none',
  );
  assert.equal(calls[0].init?.method, 'GET');
  assert.equal(new Headers(calls[0].init?.headers).get('accept'), 'application/json');

  await lookupPostalContext(
    {
      countryCode: 'JP',
      postalCode: '100-0001',
      includeGeometry: true,
    },
    { fetcher },
  );
  assert.equal(calls.length, 2);
  assert.equal(
    calls[1].url,
    '/api/v1/postal/JP/100-0001?geometry=geojson',
  );
});

test('postal research client requests one normalized country from API v1', async () => {
  const calls: string[] = [];
  const fetcher: typeof fetch = async input => {
    calls.push(String(input));
    return Response.json({
      ok: true,
      data: { countryCode: 'PR', status: 'blocked' },
      sources: ['agid-postal-context-research-catalog'],
      warnings: [],
      cache: 'none',
      requestId: 'research-pr',
    });
  };

  const result = await getPostalContextResearchCountry(' pr ', { fetcher });
  assert.deepEqual(calls, ['/api/v1/postal/research/PR']);
  assert.equal(result.ok, true);
  assert.equal(result.data?.countryCode, 'PR');
  assert.equal(result.data?.status, 'blocked');
});

test('postal context intersects sends a bounded public bbox query and validates it first', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return Response.json(agidEnvelope('unique'));
  };

  await intersectPostalContext(
    {
      countryCode: ' jp ',
      bbox: [139.75, 35.67, 139.78, 35.7],
      validAt: VALID_AT,
      knownAt: KNOWN_AT,
      limit: 16,
    },
    { fetcher },
  );

  assert.equal(calls.length, 1);
  const requestUrl = new URL(calls[0].url, 'https://agid.test');
  assert.equal(requestUrl.pathname, '/api/v1/postal/intersects');
  assert.equal(requestUrl.searchParams.get('country'), 'JP');
  assert.equal(requestUrl.searchParams.get('bbox'), '139.75,35.67,139.78,35.7');
  assert.equal(requestUrl.searchParams.get('validAt'), VALID_AT);
  assert.equal(requestUrl.searchParams.get('knownAt'), KNOWN_AT);
  assert.equal(requestUrl.searchParams.get('limit'), '16');
  assert.equal(calls[0].init?.method, 'GET');

  await assert.rejects(
    intersectPostalContext(
      { countryCode: 'JP', bbox: [139, Number.NaN, 140, 36] },
      { fetcher },
    ),
    /Invalid Postal Context bbox/,
  );
  await assert.rejects(
    intersectPostalContext(
      { countryCode: 'JP', bbox: [139, 35, 140, 36], limit: 17 },
      { fetcher },
    ),
    /Invalid Postal Context intersection limit/,
  );
  assert.equal(calls.length, 1);
});

test('ambiguous and no-match resolutions remain successful domain results', async () => {
  const statuses = ['ambiguous', 'no_match'] as const;
  let index = 0;
  const fetcher: typeof fetch = async () => Response.json(agidEnvelope(statuses[index++]));

  const ambiguous = await resolvePostalContext(BASE_RESOLVE_REQUEST, { fetcher });
  const noMatch = await resolvePostalContext(BASE_RESOLVE_REQUEST, { fetcher });

  assert.equal(ambiguous.ok, true);
  assert.equal(ambiguous.error, undefined);
  assert.equal(ambiguous.data?.status, 'ambiguous');
  assert.equal(noMatch.ok, true);
  assert.equal(noMatch.error, undefined);
  assert.equal(noMatch.data?.status, 'no_match');
  assert.equal(index, 2);
});

test('public resolve request type and serialized payload exclude internal resolver material', async () => {
  assert.equal(HAS_NO_INTERNAL_RESOLVER_KEYS, true);
  let serializedBody: Record<string, unknown> | undefined;
  const fetcher: typeof fetch = async (_input, init) => {
    serializedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return Response.json(agidEnvelope('unique'));
  };

  await resolvePostalContext(BASE_RESOLVE_REQUEST, { fetcher });

  assert.ok(serializedBody);
  for (const internalKey of ['graph', 'startNodeId', 'visibility']) {
    assert.equal(Object.hasOwn(serializedBody, internalKey), false);
  }
});
