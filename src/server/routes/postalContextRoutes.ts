import type { Express, Request, Response } from 'express';

import { assessAgidGeography } from '../../lib/geographicAssessment';
import { AGID_GRID_AXIS_BITS, encodeAGID } from '../../lib/agid';
import {
  POSTAL_CONTEXT_PURPOSES,
  postalContextCapabilitiesForNodes,
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
import {
  PostalContextResearchCatalogError,
  loadPostalContextResearchCatalog,
  postalContextResearchCountry,
  type PostalContextResearchCatalog,
} from '../postalContextResearchCatalog';

export type PostalContextRouteOptions = {
  store?: PostalContextPackStore;
  assessPin?: typeof assessAgidGeography;
  researchCatalog?: PostalContextResearchCatalog | null;
};

type JsonRecord = Record<string, unknown>;

const UTC_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const RESOLVE_KEYS = new Set([
  'countryCode',
  'latitude',
  'accuracyMeters',
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
  const runtime = store.getRuntime(countryCode);
  const status = store.countryStatus(countryCode);
  if (!runtime && status.errors.includes('unsupported-country')) {
    routeError(req, res, 404, 'Postal Context country is not supported');
    return undefined;
  }
  if (!runtime) {
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
  let researchCatalog = options.researchCatalog;
  let researchCatalogError = '';
  if (researchCatalog === undefined) {
    try {
      researchCatalog = loadPostalContextResearchCatalog();
    } catch (error) {
      researchCatalog = null;
      researchCatalogError = error instanceof PostalContextResearchCatalogError
        ? error.code
        : 'research-catalog-unavailable';
    }
  }

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
          research: 'GET /api/v1/postal/research',
          researchCountry: 'GET /api/v1/postal/research/{country}',
        },
        research: researchCatalog ? {
          available: true,
          schemaVersion: researchCatalog.schemaVersion,
          asOf: researchCatalog.asOf,
          ledgerDigest: researchCatalog.ledger.digest,
          summary: researchCatalog.summary,
        } : {
          available: false,
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
      warnings: researchCatalogError ? [researchCatalogError] : [],
      cache: 'none',
    });
  });

  app.get('/api/postal/research', (req, res) => {
    if (!researchCatalog) {
      return routeError(
        req,
        res,
        503,
        'Postal Context research catalog is unavailable',
        researchCatalogError ? [researchCatalogError] : [],
      );
    }
    privateNoStore(res);
    return sendAgidResult(req, res, {
      ok: true,
      data: researchCatalog,
      sources: ['agid-postal-context-research-catalog'],
      warnings: Object.keys(researchCatalog.summary.evidenceIntegrityCounts)
        .filter(integrity => integrity !== 'verified')
        .map(integrity => `research-evidence-integrity:${integrity}`),
      cache: 'none',
    });
  });

  app.get('/api/postal/research/:country', (req, res) => {
    const countryCode = req.params.country.toUpperCase();
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      return routeError(req, res, 400, 'Invalid country code');
    }
    if (!researchCatalog) {
      return routeError(
        req,
        res,
        503,
        'Postal Context research catalog is unavailable',
        researchCatalogError ? [researchCatalogError] : [],
      );
    }
    const country = postalContextResearchCountry(researchCatalog, countryCode);
    if (!country) return routeError(req, res, 404, 'Postal Context research country is unknown');
    privateNoStore(res);
    return sendAgidResult(req, res, {
      ok: true,
      data: {
        ...country,
        catalog: {
          schemaVersion: researchCatalog.schemaVersion,
          asOf: researchCatalog.asOf,
          ledgerDigest: researchCatalog.ledger.digest,
        },
      },
      sources: ['agid-postal-context-research-catalog'],
      warnings: country.evidence
        .filter(item => item.integrity !== 'verified')
        .map(item => `research-evidence-integrity:${item.integrity}:${item.kind}`),
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
    if (!/^[A-Z]{2}$/.test(countryCode)) return routeError(req, res, 400, 'Invalid country code');
    if (typeof req.body.latitude !== 'number'
      || !Number.isFinite(req.body.latitude)
      || req.body.latitude < -90
      || req.body.latitude > 90
      || typeof req.body.longitude !== 'number'
      || !Number.isFinite(req.body.longitude)
      || req.body.longitude < -180
      || req.body.longitude > 180
      || (req.body.accuracyMeters !== undefined && (typeof req.body.accuracyMeters !== 'number'
        || !Number.isFinite(req.body.accuracyMeters) || req.body.accuracyMeters < 0))
      || !isPurpose(req.body.purpose)
      || !isUtcInstant(req.body.validAt)
      || (req.body.knownAt !== undefined && !isUtcInstant(req.body.knownAt))) {
      return routeError(req, res, 400, 'Invalid Postal Context resolve input');
    }
    const query = {
      latitude: req.body.latitude, longitude: req.body.longitude, purpose: req.body.purpose,
      accuracyMeters: typeof req.body.accuracyMeters === 'number' ? req.body.accuracyMeters : undefined,
      validAt: req.body.validAt, knownAt: typeof req.body.knownAt === 'string' ? req.body.knownAt : undefined,
    };
    const geography = (options.assessPin ?? assessAgidGeography)({
      kind: 'pin', lat: query.latitude, lon: query.longitude, accuracyMeters: query.accuracyMeters,
    });
    const shared = geography.surface !== 'water' && geography.regionCandidates.length > 1
      && geography.regionCandidates.includes(countryCode);
    const activeRelease = req.body.release === undefined
      || (isRecord(req.body.release) && req.body.release.mode === 'active');
    let runtime = store.getRuntime(countryCode);
    // In active mode the first installed neighbour can supply the alternatives when
    // the requested jurisdiction has no pack. Its own release identity stays intact.
    if (!runtime && shared && activeRelease && geography.regionCandidates.length <= 8) {
      runtime = geography.regionCandidates.map(code => store.getRuntime(code)).find(pack => pack !== undefined);
    }
    if (!runtime) { runtimeFor(req, res, store, countryCode); return; }
    const release = releaseMatches(req.body.release, runtime);
    if (!release.valid) return routeError(req, res, 400, 'Invalid Postal Context release selector');
    if (!release.match) return routeError(req, res, 409, 'Pinned Postal Context release is not active');
    const resolution = runtime.resolvePublicCoordinate(query);
    if (resolution.status === 'invalid') {
      return routeError(req, res, 503, 'Postal Context runtime rejected a valid request', resolution.errors);
    }
    const lookupSources = [sourceFor(runtime)];
    const regionLookups = shared ? geography.regionCandidates.map(code => {
      if (code !== runtime.countryCode && (!activeRelease || geography.regionCandidates.length > 8)) {
        return { countryCode: code, status: activeRelease ? 'query-limit' : 'not-pinned' };
      }
      const pack = code === runtime.countryCode ? runtime : store.getRuntime(code);
      if (!pack) return { countryCode: code, status: 'unavailable' };
      const regional = code === runtime.countryCode ? resolution : pack.resolvePublicCoordinate(query);
      if (code !== runtime.countryCode) lookupSources.push(sourceFor(pack));
      if (regional.status === 'invalid') return { countryCode: code, status: 'unavailable' };
      const alternatives = regional.selected ? [regional.selected, ...regional.alternatives] : regional.alternatives;
      return {
        countryCode: code, status: regional.status, releaseId: regional.release.releaseId,
        addressPointCount: regional.addressPointEvidence.candidateCount, alternatives: alternatives.slice(0, 8),
      };
    }) : undefined;
    const agid = encodeAGID(query.latitude, query.longitude);
    const otherCountry = geography.regionCandidates.length > 0 && !geography.regionCandidates.includes(countryCode);
    const conflict = geography.surface === 'water' || otherCountry;
    const mustReview = geography.status === 'needs-confirmation' || geography.regionCandidates.length > 1;
    if (shared || ((conflict || mustReview) && resolution.addressPointEvidence.matched)) {
      if (resolution.selected) resolution.alternatives = [resolution.selected, ...resolution.alternatives].slice(0, 8);
      resolution.selected = undefined;
      resolution.status = conflict ? 'conflict' : 'ambiguous';
      resolution.resolvedLevel = 'none';
      resolution.capabilities = postalContextCapabilitiesForNodes([]);
      resolution.warnings.push(conflict ? 'address-point-conflicts-with-pin-geography' : 'pin-geography-requires-disambiguation');
    }
    return sendAgidResult(req, res, {
      ok: true,
      data: {
        ...resolution,
        ...(regionLookups && { requestedCountryCode: countryCode, regionLookups }),
        pinGeography: { status: geography.status, surface: geography.surface, regionCandidates: geography.regionCandidates },
        validAt: req.body.validAt,
        knownAt: req.body.knownAt ?? req.body.validAt,
        agid: {
          cellId: agid.id,
          gridAxisBits: AGID_GRID_AXIS_BITS,
          role: 'spatial-reference-and-candidate-index',
          canonicalPostalGeometry: false,
        },
      },
      sources: lookupSources,
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
