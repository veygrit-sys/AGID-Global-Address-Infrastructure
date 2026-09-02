import { agidFetch, type AgidApiResult } from '../lib/agidHttpClient';
import { apiV1Path } from '../lib/apiVersion';
import {
  POSTAL_CONTEXT_PURPOSES,
  type PostalContextPurpose,
} from '../lib/postalContextGraph';
import type {
  PostalContextBboxIntersectionResult,
  PostalContextPostalLookupResult,
  PostalContextPublicCoordinateResolution,
} from '../lib/postalContextPackRuntime';

export type PostalContextReleaseSelector =
  | { mode: 'active' }
  | {
      mode: 'pinned';
      releaseId: string;
      manifestDigest: string;
      policyVersion: string;
    };

export type PostalContextResolveRequest = {
  countryCode: string;
  latitude: number;
  longitude: number;
  purpose: PostalContextPurpose;
  validAt: string;
  knownAt?: string;
  release?: PostalContextReleaseSelector;
};

export type PostalContextResolveResponse = Omit<PostalContextPublicCoordinateResolution, 'status'> & {
  status: Exclude<PostalContextPublicCoordinateResolution['status'], 'invalid'>;
  validAt: string;
  knownAt: string;
  agid: {
    cellId: string;
    gridAxisBits: number;
    role: 'spatial-reference-and-candidate-index';
    canonicalPostalGeometry: false;
  };
};

export type PostalContextLookupResponse = Omit<PostalContextPostalLookupResult, 'status'> & {
  status: Exclude<PostalContextPostalLookupResult['status'], 'invalid'>;
  validAt: string;
  knownAt: string;
};

export type PostalContextIntersectResponse = Omit<PostalContextBboxIntersectionResult, 'status'> & {
  status: Exclude<PostalContextBboxIntersectionResult['status'], 'invalid'>;
  validAt: string;
  knownAt: string;
};

export type PostalContextResearchCountryResponse = {
  countryCode: string;
  name: string;
  region: string;
  status: 'pending' | 'blocked' | 'm2_verified';
  declaredStage: string;
  attempts: number;
  m2Definition: { id: string; definition: string } | null;
  lastAttempt: {
    observedAt: string | null;
    completedAt: string | null;
    result: string | null;
    summary: string | null;
    nextAction: string | null;
  } | null;
  blocker: {
    kind: string | null;
    reason: string | null;
    retryAfter: string | null;
    requiresExplicitApproval: boolean;
    unblockCondition: string | null;
  } | null;
  evidence: Array<{
    kind: string;
    path: string;
    declaredDigest: string;
    actualDigest: string | null;
    integrity: 'verified' | 'digest_mismatch' | 'missing';
  }>;
  runtimeArtifact: {
    descriptorDigest: string;
    releaseId: string;
    maturity: string;
    recordCounts: {
      nodes: number;
      assertions: number;
      features: number;
      positions: number;
    };
    sourceTypeCounts: Record<string, number>;
    geometryTypeCounts: Record<string, number>;
  } | null;
  catalog: {
    schemaVersion: string;
    asOf: string;
    ledgerDigest: string;
  };
};

export type PostalContextServiceOptions = {
  fetcher?: typeof fetch;
  timeoutMs?: number;
};

const SHA256 = /^sha256:[a-f0-9]{64}$/;
const UTC_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;

function countryCode(value: string) {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) throw new TypeError('Invalid Postal Context country code');
  return normalized;
}

function instant(value: string, field: string) {
  if (!UTC_INSTANT.test(value) || !Number.isFinite(Date.parse(value))) {
    throw new TypeError(`Invalid Postal Context ${field}`);
  }
  return value;
}

function finiteCoordinate(value: number, minimum: number, maximum: number, field: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new TypeError(`Invalid Postal Context ${field}`);
  }
  return value;
}

function releaseSelector(value: PostalContextReleaseSelector | undefined) {
  if (!value) return undefined;
  if (value.mode === 'active') return { mode: 'active' } as const;
  if (!value.releaseId.trim()
    || !SHA256.test(value.manifestDigest)
    || !value.policyVersion.trim()) {
    throw new TypeError('Invalid Postal Context pinned release');
  }
  return {
    mode: 'pinned' as const,
    releaseId: value.releaseId.trim(),
    manifestDigest: value.manifestDigest,
    policyVersion: value.policyVersion.trim(),
  };
}

function requestOptions(options: PostalContextServiceOptions) {
  return {
    fetcher: options.fetcher,
    timeoutMs: options.timeoutMs ?? 8000,
    source: 'agid-postal-context-runtime',
  };
}

export async function resolvePostalContext(
  request: PostalContextResolveRequest,
  options: PostalContextServiceOptions = {},
): Promise<AgidApiResult<PostalContextResolveResponse>> {
  const normalizedCountry = countryCode(request.countryCode);
  if (!(POSTAL_CONTEXT_PURPOSES as readonly string[]).includes(request.purpose)) {
    throw new TypeError('Invalid Postal Context purpose');
  }
  const body = {
    countryCode: normalizedCountry,
    latitude: finiteCoordinate(request.latitude, -90, 90, 'latitude'),
    longitude: finiteCoordinate(request.longitude, -180, 180, 'longitude'),
    purpose: request.purpose,
    validAt: instant(request.validAt, 'validAt'),
    ...(request.knownAt ? { knownAt: instant(request.knownAt, 'knownAt') } : {}),
    ...(request.release ? { release: releaseSelector(request.release) } : {}),
  };
  return agidFetch<PostalContextResolveResponse>(apiV1Path('/postal/resolve'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    retries: 1,
    retryUnsafe: true,
    ...requestOptions(options),
  });
}

export async function lookupPostalContext(
  input: {
    countryCode: string;
    postalCode: string;
    validAt?: string;
    knownAt?: string;
    includeGeometry?: boolean;
  },
  options: PostalContextServiceOptions = {},
): Promise<AgidApiResult<PostalContextLookupResponse>> {
  const normalizedCountry = countryCode(input.countryCode);
  const postalCode = input.postalCode.trim();
  if (!postalCode || postalCode.length > 64) throw new TypeError('Invalid Postal Context postal code');
  const query = new URLSearchParams();
  if (input.validAt) query.set('validAt', instant(input.validAt, 'validAt'));
  if (input.knownAt) query.set('knownAt', instant(input.knownAt, 'knownAt'));
  if (input.includeGeometry === true) query.set('geometry', 'geojson');
  if (input.includeGeometry === false) query.set('geometry', 'none');
  const suffix = query.size ? `?${query.toString()}` : '';
  return agidFetch<PostalContextLookupResponse>(
    `${apiV1Path(`/postal/${normalizedCountry}/${encodeURIComponent(postalCode)}`)}${suffix}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      retries: 1,
      ...requestOptions(options),
    },
  );
}

export async function getPostalContextResearchCountry(
  requestedCountryCode: string,
  options: PostalContextServiceOptions = {},
): Promise<AgidApiResult<PostalContextResearchCountryResponse>> {
  const normalizedCountry = countryCode(requestedCountryCode);
  return agidFetch<PostalContextResearchCountryResponse>(
    apiV1Path(`/postal/research/${normalizedCountry}`),
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      retries: 1,
      ...requestOptions(options),
    },
  );
}

export async function intersectPostalContext(
  input: {
    countryCode: string;
    bbox: readonly [number, number, number, number];
    validAt?: string;
    knownAt?: string;
    limit?: number;
  },
  options: PostalContextServiceOptions = {},
): Promise<AgidApiResult<PostalContextIntersectResponse>> {
  const normalizedCountry = countryCode(input.countryCode);
  if (input.bbox.length !== 4 || input.bbox.some(value => !Number.isFinite(value))) {
    throw new TypeError('Invalid Postal Context bbox');
  }
  if (input.limit !== undefined
    && (!Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 16)) {
    throw new TypeError('Invalid Postal Context intersection limit');
  }
  const query = new URLSearchParams({
    country: normalizedCountry,
    bbox: input.bbox.join(','),
  });
  if (input.validAt) query.set('validAt', instant(input.validAt, 'validAt'));
  if (input.knownAt) query.set('knownAt', instant(input.knownAt, 'knownAt'));
  if (input.limit !== undefined) query.set('limit', String(input.limit));
  return agidFetch<PostalContextIntersectResponse>(
    `${apiV1Path('/postal/intersects')}?${query.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      retries: 1,
      ...requestOptions(options),
    },
  );
}
