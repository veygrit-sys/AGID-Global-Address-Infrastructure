import type { Express, Request, Response } from 'express';

import {
  createInMemoryAgidRegistryApiStore,
  type AgidRegistryApiStoreAdapter,
  type AgidRegistryMutationResult,
  type AgidRegistryVerifyResult,
} from '../../lib/agidRegistryApi';
import { sendAgidResult } from '../agidResult';
import { objectBody } from '../requestParsing';
import {
  requireConfiguredAdminToken,
  verifyTerminalBodySignature,
  type RouteAdminAuthResult,
  type RouteTerminalSignatureResult,
} from '../routeSecurity';

export type AgidRegistryRouteOptions = {
  store?: AgidRegistryApiStoreAdapter;
  adminToken?: string;
  terminalSigningSecret?: string;
  basePath?: string;
  sourceId?: string;
};

function configuredAdminToken(options: AgidRegistryRouteOptions) {
  return options.adminToken ?? process.env.AGID_REGISTRY_ADMIN_TOKEN?.trim() ?? '';
}

function authorizeRegistryWrite(req: Request, options: AgidRegistryRouteOptions) {
  return requireConfiguredAdminToken(req, {
    expectedToken: configuredAdminToken(options),
    headerName: 'X-AGID-Registry-Admin-Token',
    missingError: 'Mode 1 registry admin token is not configured.',
    invalidError: 'Mode 1 registry write requires X-AGID-Registry-Admin-Token.',
    missingWarning: 'set AGID_REGISTRY_ADMIN_TOKEN before enabling Mode 1 registry writes',
  });
}

function sendMode1AuthFailure(
  req: Request,
  res: Response,
  auth: Extract<RouteAdminAuthResult, { ok: false }>,
  sourceId: string,
) {
  return sendAgidResult(req, res, {
    ok: false,
    error: auth.error,
    sources: [sourceId],
    warnings: auth.warnings,
    cache: 'none',
  }, auth.statusCode);
}

function sendMode1TerminalSignatureFailure(
  req: Request,
  res: Response,
  auth: Extract<RouteTerminalSignatureResult, { ok: false }>,
  sourceId: string,
) {
  return sendAgidResult(req, res, {
    ok: false,
    error: auth.error,
    sources: [sourceId],
    warnings: auth.warnings,
    cache: 'none',
  }, auth.statusCode);
}

function mutationStatusCode<TRecord>(result: AgidRegistryMutationResult<TRecord>) {
  if (result.status === 'duplicate') return 409;
  if (result.status === 'rejected') return 400;
  return 200;
}

function sendMode1MutationResult<TRecord>(
  req: Request,
  res: Response,
  result: AgidRegistryMutationResult<TRecord>,
  sourceId: string,
  extraWarnings: string[] = [],
) {
  const ok = result.status !== 'rejected' && result.status !== 'duplicate';
  return sendAgidResult(req, res, {
    ok,
    data: result,
    error: ok ? undefined : result.errors[0] ?? 'Mode 1 registry operation failed',
    confidence: ok ? 0.95 : 0.25,
    sources: [sourceId],
    warnings: [...extraWarnings, ...result.warnings],
    cache: 'none',
  }, mutationStatusCode(result));
}

function verifyStatusCode(result: AgidRegistryVerifyResult) {
  if (result.errors.some(error => error.includes('private material') || error.includes('raw location material'))) {
    return 400;
  }
  return result.valid ? 200 : 409;
}

export function registerAgidRegistryRoutes(app: Express, options: AgidRegistryRouteOptions = {}) {
  const store = options.store ?? createInMemoryAgidRegistryApiStore();
  const basePath = options.basePath ?? '/api/registry/mode1';
  const sourceId = options.sourceId ?? 'agid-registry-api-mode1';
  const markUsedReplayCache = new Set<string>();
  const terminalSigningSecret = options.terminalSigningSecret
    ?? process.env.AGID_REGISTRY_TERMINAL_SIGNING_SECRET?.trim()
    ?? process.env.AGID_TERMINAL_SIGNING_SECRET?.trim()
    ?? '';

  app.get(`${basePath}/capabilities`, async (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: await store.capabilities(),
      confidence: 1,
      sources: [sourceId],
      warnings: [],
      cache: 'none',
    });
  });

  app.get(`${basePath}/status`, async (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: await store.snapshot(),
      confidence: 0.95,
      sources: [sourceId],
      warnings: [],
      cache: 'none',
    });
  });

  app.get(`${basePath}/audit`, async (req, res) => {
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 100;
    sendAgidResult(req, res, {
      ok: true,
      data: {
        events: await store.auditEvents(Number.isFinite(limit) ? limit : 100),
      },
      confidence: 0.95,
      sources: [sourceId],
      warnings: [],
      cache: 'none',
    });
  });

  app.post(`${basePath}/issuer/register`, async (req, res) => {
    const auth = authorizeRegistryWrite(req, options);
    if (auth.ok === false) return sendMode1AuthFailure(req, res, auth, sourceId);

    const result = await store.registerIssuer(objectBody(req.body));
    return sendMode1MutationResult(req, res, result, sourceId, auth.warnings);
  });

  app.post(`${basePath}/revocation/revoke-commitment`, async (req, res) => {
    const auth = authorizeRegistryWrite(req, options);
    if (auth.ok === false) return sendMode1AuthFailure(req, res, auth, sourceId);

    const result = await store.revokeCommitment(objectBody(req.body));
    return sendMode1MutationResult(req, res, result, sourceId, auth.warnings);
  });

  app.post(`${basePath}/freshness/anchor`, async (req, res) => {
    const auth = authorizeRegistryWrite(req, options);
    if (auth.ok === false) return sendMode1AuthFailure(req, res, auth, sourceId);

    const result = await store.anchorFreshnessRoot(objectBody(req.body));
    return sendMode1MutationResult(req, res, result, sourceId, auth.warnings);
  });

  app.post(`${basePath}/verify`, async (req, res) => {
    const result = await store.verify(objectBody(req.body));
    return sendAgidResult(req, res, {
      ok: result.valid,
      data: result,
      error: result.valid ? undefined : result.errors[0] ?? 'Mode 1 registry verification failed',
      confidence: result.valid ? 0.95 : 0.25,
      sources: [sourceId],
      warnings: result.warnings,
      cache: 'none',
    }, verifyStatusCode(result));
  });

  app.post(`${basePath}/nullifier/mark-used`, async (req, res) => {
    const body = objectBody(req.body);
    const terminalAuth = verifyTerminalBodySignature(body, {
      expectedSecret: terminalSigningSecret,
      replayCache: markUsedReplayCache,
      operation: 'mode1:nullifier:mark-used',
      payload: {
        basePath,
        nullifierHash: body.nullifierHash,
        scope: body.scope,
      },
      missingSecretError: 'Mode 1 terminal signing secret is not configured.',
    });
    if (terminalAuth.ok === false) return sendMode1TerminalSignatureFailure(req, res, terminalAuth, sourceId);

    const {
      terminalSignature: _terminalSignature,
      signatureNonce: _signatureNonce,
      terminalNonce: _terminalNonce,
      nonce: _nonce,
      signedAt: _signedAt,
      terminalSignedAt: _terminalSignedAt,
      ...registryInput
    } = body;
    const result = await store.markNullifierUsed(registryInput);
    return sendMode1MutationResult(req, res, result, sourceId, terminalAuth.warnings);
  });
}
