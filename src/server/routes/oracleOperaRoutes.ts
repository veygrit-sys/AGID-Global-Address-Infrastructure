import type { Express, Request, Response as ExpressResponse } from 'express';

import {
  ORACLE_OPERA_ADAPTER_VERSION,
  getOracleOperaConfig,
  listOracleOperaAuditEvents,
  listOracleOperaDeadLetters,
  maskOracleOperaConfig,
  recordOracleOperaAuditEvent,
  syncAddressToOracleOpera,
  type OracleOperaAddressSyncRequest,
  type OracleOperaFetch,
} from '../../services/OracleOperaService';
import { sendAgidResult } from '../agidResult';
import { objectBody, objectOrUndefined } from '../requestParsing';
import { requireConfiguredAdminToken, type RouteAdminAuthResult } from '../routeSecurity';

export type OracleOperaRouteDependencies = {
  env?: NodeJS.ProcessEnv;
  fetcher?: OracleOperaFetch;
  adminToken?: string;
};

function envString(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function envList(env: NodeJS.ProcessEnv, key: string) {
  return (envString(env, key) || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

function configuredOperaAdminToken(env: NodeJS.ProcessEnv, override?: string) {
  return override?.trim() || envString(env, 'OPERA_ADMIN_TOKEN') || envString(env, 'AGID_OPERA_ADMIN_TOKEN') || '';
}

function authorizeOperaAdmin(req: Request, env: NodeJS.ProcessEnv, adminToken?: string) {
  return requireConfiguredAdminToken(req, {
    expectedToken: configuredOperaAdminToken(env, adminToken),
    headerName: 'X-AGID-OPERA-Admin-Token',
    missingError: 'Oracle OPERA admin token is not configured.',
    invalidError: 'Oracle OPERA routes require X-AGID-OPERA-Admin-Token.',
    missingWarning: 'set OPERA_ADMIN_TOKEN before enabling Oracle OPERA routes',
  });
}

function sendOperaAuthFailure(
  req: Request,
  res: ExpressResponse,
  auth: Extract<RouteAdminAuthResult, { ok: false }>,
) {
  recordOracleOperaAuditEvent({
    operation: 'address-sync',
    outcome: 'rejected',
    requestId: req.header('X-AGID-Request-ID') || undefined,
    reasonCode: auth.statusCode === 503 ? 'OPERA_ADMIN_TOKEN_MISSING' : 'OPERA_ADMIN_TOKEN_INVALID',
    warnings: auth.warnings,
  });
  return sendAgidResult(req, res, {
    ok: false,
    error: auth.error,
    sources: [ORACLE_OPERA_ADAPTER_VERSION],
    warnings: auth.warnings,
    cache: 'none',
  }, auth.statusCode);
}

function tenantPermissionFailure(input: OracleOperaAddressSyncRequest, env: NodeJS.ProcessEnv) {
  const allowedHotels = envList(env, 'OPERA_ALLOWED_HOTEL_IDS');
  const allowedTenants = envList(env, 'OPERA_ALLOWED_TENANT_IDS');
  const configuredHotel = envString(env, 'OPERA_HOTEL_ID');
  const requestedHotel = input.hotelId || configuredHotel;
  const requestedTenant = input.tenantId;

  if (allowedHotels.length && (!requestedHotel || !allowedHotels.includes(requestedHotel))) {
    return 'Oracle OPERA hotelId is not allowed for this tenant.';
  }
  if (!allowedHotels.length && configuredHotel && input.hotelId && input.hotelId !== configuredHotel) {
    return 'Oracle OPERA hotelId does not match configured hotel.';
  }
  if (allowedTenants.length && (!requestedTenant || !allowedTenants.includes(requestedTenant))) {
    return 'Oracle OPERA tenantId is not allowed.';
  }
  return undefined;
}

function syncRequestFromBody(body: Record<string, unknown>): OracleOperaAddressSyncRequest {
  return {
    agid: typeof body.agid === 'string' ? body.agid : undefined,
    address: objectOrUndefined(body.address) ?? (typeof body.address === 'string' ? body.address : undefined),
    addressText: typeof body.addressText === 'string'
      ? body.addressText
      : typeof body.displayText === 'string'
        ? body.displayText
        : undefined,
    language: typeof body.language === 'string' ? body.language : undefined,
    countryCode: typeof body.countryCode === 'string' ? body.countryCode : undefined,
    tenantId: typeof body.tenantId === 'string' ? body.tenantId : undefined,
    profileId: typeof body.profileId === 'string' ? body.profileId : undefined,
    reservationId: typeof body.reservationId === 'string' ? body.reservationId : undefined,
    externalReferenceId: typeof body.externalReferenceId === 'string' ? body.externalReferenceId : undefined,
    propertyCode: typeof body.propertyCode === 'string' ? body.propertyCode : undefined,
    hotelId: typeof body.hotelId === 'string' ? body.hotelId : undefined,
    addressType: typeof body.addressType === 'string' ? body.addressType : undefined,
    coordinates: objectOrUndefined(body.coordinates) as OracleOperaAddressSyncRequest['coordinates'],
    confidence: typeof body.confidence === 'number' ? body.confidence : undefined,
    sources: Array.isArray(body.sources) ? body.sources.filter((value): value is string => typeof value === 'string') : undefined,
    warnings: Array.isArray(body.warnings) ? body.warnings.filter((value): value is string => typeof value === 'string') : undefined,
  };
}

export function registerOracleOperaRoutes(
  app: Express,
  { env = process.env, fetcher, adminToken }: OracleOperaRouteDependencies = {},
) {
  app.get('/api/integrations/oracle-opera/health', (req, res) => {
    const auth = authorizeOperaAdmin(req, env, adminToken);
    if (auth.ok === false) return sendOperaAuthFailure(req, res, auth);

    const health = maskOracleOperaConfig(getOracleOperaConfig(env));
    recordOracleOperaAuditEvent({
      operation: 'health',
      outcome: 'allowed',
      requestId: req.header('X-AGID-Request-ID') || undefined,
      warnings: auth.warnings,
    });
    sendAgidResult(req, res, {
      ok: true,
      data: health,
      confidence: health.liveWritesEnabled ? 0.9 : health.credentialsConfigured ? 0.72 : 0.48,
      sources: [ORACLE_OPERA_ADAPTER_VERSION, 'oracle-hospitality-integration-platform'],
      warnings: health.liveWritesEnabled
        ? []
        : [
            'Oracle OPERA writes are not live until credentials, OPERA_ADDRESS_SYNC_PATH, and OPERA_DRY_RUN=false are configured.',
          ],
      cache: 'none',
    });
  });

  app.post('/api/integrations/oracle-opera/address', async (req, res) => {
    const auth = authorizeOperaAdmin(req, env, adminToken);
    if (auth.ok === false) return sendOperaAuthFailure(req, res, auth);

    const body = objectBody(req.body);
    const input = syncRequestFromBody(body);
    if (!input.address && !input.addressText) {
      recordOracleOperaAuditEvent({
        operation: 'address-sync',
        outcome: 'rejected',
        requestId: req.header('X-AGID-Request-ID') || undefined,
        hotelId: input.hotelId,
        tenantId: input.tenantId,
        reasonCode: 'OPERA_ADDRESS_PAYLOAD_MISSING',
        warnings: auth.warnings,
      });
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Missing address or addressText for Oracle OPERA address sync',
        data: {
          adapterVersion: ORACLE_OPERA_ADAPTER_VERSION,
          expectedBody: ['agid', 'address', 'addressText', 'countryCode', 'language', 'profileId', 'reservationId'],
        },
        confidence: 0,
        sources: [ORACLE_OPERA_ADAPTER_VERSION],
        warnings: [],
        cache: 'none',
      }, 400);
    }

    const permissionError = tenantPermissionFailure(input, env);
    if (permissionError) {
      recordOracleOperaAuditEvent({
        operation: 'address-sync',
        outcome: 'rejected',
        requestId: req.header('X-AGID-Request-ID') || undefined,
        hotelId: input.hotelId,
        tenantId: input.tenantId,
        reasonCode: 'OPERA_TENANT_PERMISSION_DENIED',
        warnings: auth.warnings,
      });
      return sendAgidResult(req, res, {
        ok: false,
        error: permissionError,
        confidence: 0,
        sources: [ORACLE_OPERA_ADAPTER_VERSION],
        warnings: auth.warnings,
        cache: 'none',
      }, 403);
    }

    const result = await syncAddressToOracleOpera(input, { env, fetcher });
    const audit = recordOracleOperaAuditEvent({
      operation: 'address-sync',
      outcome: result.ok ? result.mode === 'dry-run' ? 'dry-run' : 'allowed' : result.deadLetter ? 'dead-lettered' : 'rejected',
      mode: result.mode,
      endpointKind: result.requestSummary.endpointKind,
      requestId: req.header('X-AGID-Request-ID') || undefined,
      tenantId: result.requestSummary.tenantId,
      hotelId: result.requestSummary.hotelId,
      agidHash: result.requestSummary.agidHash,
      externalReferenceHash: result.requestSummary.externalReferenceHash,
      profileIdHash: result.requestSummary.profileIdHash,
      reservationIdHash: result.requestSummary.reservationIdHash,
      status: result.response?.status,
      reasonCode: result.errorCode,
      warnings: [...auth.warnings, ...result.warnings],
    });
    return sendAgidResult(req, res, {
      ok: result.ok,
      data: {
        ...result,
        audit: {
          eventId: audit.id,
          outcome: audit.outcome,
        },
      },
      error: result.error,
      confidence: result.ok ? (result.mode === 'live' ? 0.86 : 0.62) : 0.25,
      sources: result.sources,
      warnings: result.warnings,
      cache: 'none',
    }, result.ok ? 200 : result.errorCode === 'OPERA_PREFLIGHT_VALIDATION_FAILED' ? 400 : result.errorCode === 'OPERA_RATE_LIMITED' ? 429 : 502);
  });

  app.get('/api/integrations/oracle-opera/audit', (req, res) => {
    const auth = authorizeOperaAdmin(req, env, adminToken);
    if (auth.ok === false) return sendOperaAuthFailure(req, res, auth);
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50;
    recordOracleOperaAuditEvent({
      operation: 'audit-read',
      outcome: 'allowed',
      requestId: req.header('X-AGID-Request-ID') || undefined,
      warnings: auth.warnings,
    });
    return sendAgidResult(req, res, {
      ok: true,
      data: { events: listOracleOperaAuditEvents(Number.isFinite(limit) ? limit : 50) },
      confidence: 0.95,
      sources: [ORACLE_OPERA_ADAPTER_VERSION],
      warnings: auth.warnings,
      cache: 'none',
    });
  });

  app.get('/api/integrations/oracle-opera/dead-letter', (req, res) => {
    const auth = authorizeOperaAdmin(req, env, adminToken);
    if (auth.ok === false) return sendOperaAuthFailure(req, res, auth);
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 50;
    recordOracleOperaAuditEvent({
      operation: 'dead-letter-read',
      outcome: 'allowed',
      requestId: req.header('X-AGID-Request-ID') || undefined,
      warnings: auth.warnings,
    });
    return sendAgidResult(req, res, {
      ok: true,
      data: { records: listOracleOperaDeadLetters(Number.isFinite(limit) ? limit : 50) },
      confidence: 0.95,
      sources: [ORACLE_OPERA_ADAPTER_VERSION],
      warnings: auth.warnings,
      cache: 'none',
    });
  });
}
