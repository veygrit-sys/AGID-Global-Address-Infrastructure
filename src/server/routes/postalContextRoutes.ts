import type { Express, Request, Response } from 'express';

import { AGID_GRID_AXIS_BITS, encodeAGID } from '../../lib/agid';
import {
  POSTAL_CONTEXT_PURPOSES,
  type PostalContextPurpose,
} from '../../lib/postalContextGraph';
import {
  POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS,
  type PostalContextPackRuntime,
} from '../../lib/postalContextPackRuntime';
import { sendAgidResult } from '../agidResult';
import {
  createConfiguredPostalContextPackStore,
  type PostalContextPackStore,
} from '../postalContextPackStore';

export type PostalContextRouteOptions = {
  store?: PostalContextPackStore;
};

type JsonRecord = Record<string, unknown>;

const UTC_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const RESOLVE_KEYS = new Set([
  'countryCode',
  'latitude',
  'longitude',
  'purpose',
  'validAt',
  'knownAt',
  'release',
]);
const RELEASE_KEYS = new Set(['mode', 'releaseId', 'manifestDigest', 'policyVersion']);

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isUtcInstant(value: unknown): value is string {
  return typeof value === 'string'
    && UTC_INSTANT.test(value)
    && Number.isFinite(Date.parse(value));
}

function isPurpose(value: unknown): value is PostalContextPurpose {
  return typeof value === 'string'
    && (POSTAL_CONTEXT_PURPOSES as readonly string[]).includes(value);
}

function privateNoStore(res: Response) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
}

function routeError(
  req: Request,
  res: Response,
  status: number,
  error: string,
  warnings: string[] = [],
) {
  privateNoStore(res);
  return sendAgidResult(req, res, {
    ok: false,
    error,
    sources: ['agid-postal-context-runtime'],
    warnings,
    cache: 'none',
  }, status);
}

function runtimeFor(
  req: Request,
  res: Response,
  store: PostalContextPackStore,
  countryCode: string,
) {
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    routeError(req, res, 400, 'Invalid country code');
    return undefined;
  }
  if (countryCode !== 'JP') {
    routeError(req, res, 404, 'Postal Context country is not supported');
    return undefined;
  }
  const runtime = store.getRuntime(countryCode);
  if (!runtime) {
    const status = store.countryStatus(countryCode);
    routeError(
      req,
      res,
      503,
      'Postal Context pack is unavailable',
      [...status.errors, ...status.warnings],
    );
    return undefined;
  }
  return runtime;
}

function releaseMatches(
  value: unknown,
  runtime: PostalContextPackRuntime,
) {
  if (value === undefined) return { valid: true, match: true };
  if (!isRecord(value) || Object.keys(value).some(key => !RELEASE_KEYS.has(key))) {
    return { valid: false, match: false };
  }
  if (value.mode === 'active') {
    return {
      valid: value.releaseId === undefined
        && value.manifestDigest === undefined
        && value.policyVersion === undefined,
      match: true,
    };
  }
  if (value.mode !== 'pinned'
    || typeof value.releaseId !== 'string'
    || typeof value.manifestDigest !== 'string'
    || !SHA256.test(value.manifestDigest)
    || typeof value.policyVersion !== 'string') {
    return { valid: false, match: false };
  }
  const release = runtime.release();
  return {
    valid: true,
    match: value.releaseId === release.releaseId
      && value.manifestDigest === release.manifestDigest
      && value.policyVersion === release.policyVersion,
  };
}

function queryInstant(value: unknown, fallback: string) {
  return isUtcInstant(value) ? value : fallback;
}

function sourceFor(runtime: PostalContextPackRuntime) {
  const release = runtime.release();
  return `agid-postal-context:${release.countryCode}:${release.releaseId}`;
}

export function registerPostalContextRoutes(
  app: Express,
  options: PostalContextRouteOptions = {},
) {
  const store = options.store ?? createConfiguredPostalContextPackStore();

  app.get('/api/postal/capabilities', (req, res) => {
    privateNoStore(res);
    return sendAgidResult(req, res, {
      ok: true,
      data: {
        version: 'postal-context-api/v0.1',
        countries: store.statuses(),
        endpoints: {
          resolve: 'POST /api/v1/postal/resolve',
          lookup: 'GET /api/v1/postal/{country}/{postalCode}',
          intersects: 'GET /api/v1/postal/intersects',
          releases: 'GET /api/v1/postal/releases/{country}',
        },
        privacy: {
          coordinateTransport: 'post-body-only',
          coordinateEcho: false,
          rawAddressInput: false,
          privateUnitRecipientInput: false,
          responseCache: 'private-no-store',
        },
        fallback: 'none-outside-verified-pack-or-lkg',
      },
      sources: ['agid-postal-context-runtime'],
      warnings: [],
      cache: 'none',
    });
  });

  app.get('/api/postal/releases/:country', (req, res) => {
    const countryCode = req.params.country.toUpperCase();
    const runtime = runtimeFor(req, res, store, countryCode);
    if (!runtime) return;
    privateNoStore(res);
    return sendAgidResult(req, res, {
      ok: true,
      data: store.countryStatus(countryCode),
      sources: [sourceFor(runtime)],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/postal/resolve', (req, res) => {
    privateNoStore(res);
    if (!isRecord(req.body) || Object.keys(req.body).some(key => !RESOLVE_KEYS.has(key))) {
      return routeError(req, res, 400, 'Invalid Postal Context resolve body');
    }
    const countryCode = typeof req.body.countryCode === 'string'
      ? req.body.countryCode.toUpperCase()
      : '';
    const runtime = runtimeFor(req, res, store, countryCode);
    if (!runtime) return;
    if (typeof req.body.latitude !== 'number'
      || !Number.isFinite(req.body.latitude)
      || req.body.latitude < -90
      || req.body.latitude > 90
      || typeof req.body.longitude !== 'number'
      || !Number.isFinite(req.body.longitude)
      || req.body.longitude < -180
      || req.body.longitude > 180
      || !isPurpose(req.body.purpose)
      || !isUtcInstant(req.body.validAt)
      || (req.body.knownAt !== undefined && !isUtcInstant(req.body.knownAt))) {
      return routeError(req, res, 400, 'Invalid Postal Context resolve input');
    }
    const release = releaseMatches(req.body.release, runtime);
    if (!release.valid) return routeError(req, res, 400, 'Invalid Postal Context release selector');
    if (!release.match) return routeError(req, res, 409, 'Pinned Postal Context release is not active');

    const resolution = runtime.resolvePublicCoordinate({
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      purpose: req.body.purpose,
      validAt: req.body.validAt,
      knownAt: typeof req.body.knownAt === 'string' ? req.body.knownAt : undefined,
    });
    if (resolution.status === 'invalid') {
      return routeError(req, res, 503, 'Postal Context runtime rejected a valid request', resolution.errors);
    }
    const agid = encodeAGID(req.body.latitude, req.body.longitude);
    return sendAgidResult(req, res, {
      ok: true,
      data: {
        ...resolution,
        validAt: req.body.validAt,
        knownAt: req.body.knownAt ?? req.body.validAt,
        agid: {
          cellId: agid.id,
          gridAxisBits: AGID_GRID_AXIS_BITS,
          role: 'spatial-reference-and-candidate-index',
          canonicalPostalGeometry: false,
        },
      },
      sources: [sourceFor(runtime)],
      warnings: resolution.warnings,
      cache: 'none',
    });
  });

  app.get('/api/postal/intersects', (req, res) => {
    privateNoStore(res);
    const countryCode = typeof req.query.country === 'string'
      ? req.query.country.toUpperCase()
      : '';
    const runtime = runtimeFor(req, res, store, countryCode);
    if (!runtime) return;
    const bbox = typeof req.query.bbox === 'string'
      ? req.query.bbox.split(',').map(Number)
      : [];
    const now = new Date().toISOString();
    const validAt = queryInstant(req.query.validAt, now);
    const knownAt = queryInstant(req.query.knownAt, validAt);
    const limit = req.query.limit === undefined
      ? POSTAL_CONTEXT_RUNTIME_QUERY_LIMITS.geometryResponseFeatures
      : Number(req.query.limit);
    if ((req.query.validAt !== undefined && !isUtcInstant(req.query.validAt))
      || (req.query.knownAt !== undefined && !isUtcInstant(req.query.knownAt))) {
      return routeError(req, res, 400, 'Invalid Postal Context intersection time');
    }
    const result = runtime.intersectsPostalBbox(bbox, validAt, knownAt, limit);
    if (result.status === 'invalid') {
      return routeError(req, res, 400, 'Invalid Postal Context intersection query', result.errors);
    }
    return sendAgidResult(req, res, {
      ok: true,
      data: { ...result, validAt, knownAt },
      sources: [sourceFor(runtime)],
      warnings: result.warnings,
      cache: 'none',
    });
  });

  app.get('/api/postal/:country/:postalCode', (req, res) => {
    privateNoStore(res);
    const countryCode = req.params.country.toUpperCase();
    const runtime = runtimeFor(req, res, store, countryCode);
    if (!runtime) return;
    const now = new Date().toISOString();
    const validAt = queryInstant(req.query.validAt, now);
    const knownAt = queryInstant(req.query.knownAt, validAt);
    if ((req.query.validAt !== undefined && !isUtcInstant(req.query.validAt))
      || (req.query.knownAt !== undefined && !isUtcInstant(req.query.knownAt))) {
      return routeError(req, res, 400, 'Invalid Postal Context lookup time');
    }
    const geometry = req.query.geometry;
    if (geometry !== undefined && geometry !== 'none' && geometry !== 'geojson') {
      return routeError(req, res, 400, 'Invalid Postal Context geometry mode');
    }
    const includeGeometry = geometry === 'geojson';
    const result = runtime.lookupPostalCode(
      req.params.postalCode,
      validAt,
      knownAt,
      includeGeometry,
    );
    if (result.status === 'invalid') {
      return routeError(req, res, 400, 'Invalid postal code', result.errors);
    }
    return sendAgidResult(req, res, {
      ok: true,
      data: { ...result, validAt, knownAt },
      sources: [sourceFor(runtime)],
      warnings: result.warnings,
      cache: 'none',
    });
  });
}
