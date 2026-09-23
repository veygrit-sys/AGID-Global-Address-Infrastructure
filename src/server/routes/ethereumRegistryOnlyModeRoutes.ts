import type { Express, Request } from 'express';

import {
  createInMemoryEthereumRegistryOnlyStore,
  getEthereumRegistryOnlyCapabilities,
  type EthereumIssuerRegistrationInput,
  type EthereumNullifierMarkUsedInput,
  type EthereumPaymentRecordInput,
  type EthereumRegistryOnlyResult,
  type EthereumRegistryOnlyTxPlan,
  type EthereumRevocationAnchorInput,
  type InMemoryEthereumRegistryOnlyStore,
} from '../../lib/ethereumRegistryOnlyMode';
import {
  AgidEthereumRegistryClient,
  createAgidEthereumRegistryClientFromEnv,
} from '../ethereumRegistryClient';
import { sendAgidResult } from '../agidResult';
import { objectBody } from '../requestParsing';
import { requireConfiguredAdminToken, type RouteAdminAuthResult } from '../routeSecurity';

export type EthereumRegistryOnlyModeRouteOptions = {
  store?: InMemoryEthereumRegistryOnlyStore;
  adminToken?: string;
  ethereumClient?: AgidEthereumRegistryClient;
};

function configuredAdminToken(options: EthereumRegistryOnlyModeRouteOptions) {
  return options.adminToken ?? process.env.AGID_ETHEREUM_REGISTRY_ADMIN_TOKEN?.trim() ?? '';
}

function authorizeRegistryWrite(req: Request, options: EthereumRegistryOnlyModeRouteOptions) {
  return requireConfiguredAdminToken(req, {
    expectedToken: configuredAdminToken(options),
    headerName: 'X-AGID-Ethereum-Admin-Token',
    missingError: 'Ethereum Mode 3 registry admin token is not configured.',
    invalidError: 'Ethereum Mode 3 registry write requires X-AGID-Ethereum-Admin-Token.',
    missingWarning: 'set AGID_ETHEREUM_REGISTRY_ADMIN_TOKEN before enabling Mode 3 registry writes',
  });
}

function sendMode3AuthFailure(
  req: Request,
  res: Parameters<typeof sendAgidResult>[1],
  auth: Extract<RouteAdminAuthResult, { ok: false }>,
) {
  return sendAgidResult(req, res, {
    ok: false,
    error: auth.error,
    sources: ['agid-ethereum-registry-only-mode'],
    warnings: auth.warnings,
    cache: 'none',
  }, auth.statusCode);
}

function sendMode3Result<TRecord>(
  req: Request,
  res: Parameters<typeof sendAgidResult>[1],
  result: EthereumRegistryOnlyResult<TRecord>,
  statusCode?: number,
  extraWarnings: string[] = [],
) {
  const ok = result.errors.length === 0 && result.status !== 'rejected' && result.status !== 'duplicate';
  return sendAgidResult(req, res, {
    ok,
    data: result,
    error: ok ? undefined : result.errors[0] ?? 'Ethereum Mode 3 registry operation failed',
    confidence: ok ? 0.95 : 0.25,
    sources: ['agid-ethereum-registry-only-mode'],
    warnings: [...extraWarnings, ...result.warnings],
    cache: 'none',
  }, statusCode ?? (ok ? 200 : result.status === 'duplicate' ? 409 : 400));
}

function readText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readConfirmations(value: unknown) {
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim()
      ? Number(value)
      : undefined;
  return Number.isFinite(parsed) ? Math.max(1, Math.floor(Number(parsed))) : undefined;
}

function readTxPlan(value: unknown): EthereumRegistryOnlyTxPlan | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const plan = value as Partial<EthereumRegistryOnlyTxPlan>;
  if (plan.mode !== 'ethereum-registry-only' || typeof plan.operation !== 'string') return null;
  if (typeof plan.contractRole !== 'string' || typeof plan.method !== 'string') return null;
  if (!plan.publicArguments || typeof plan.publicArguments !== 'object' || Array.isArray(plan.publicArguments)) return null;
  return plan as EthereumRegistryOnlyTxPlan;
}

function routeEthereumClient(options: EthereumRegistryOnlyModeRouteOptions) {
  return options.ethereumClient ?? createAgidEthereumRegistryClientFromEnv();
}

export function registerEthereumRegistryOnlyModeRoutes(
  app: Express,
  options: EthereumRegistryOnlyModeRouteOptions = {},
) {
  const store = options.store ?? createInMemoryEthereumRegistryOnlyStore();

  app.get('/api/ethereum/mode3/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: getEthereumRegistryOnlyCapabilities(),
      confidence: 1,
      sources: ['agid-ethereum-registry-only-mode'],
      warnings: [],
      cache: 'none',
    });
  });

  app.get('/api/ethereum/mode3/registry', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: store.getSnapshot(),
      confidence: 0.95,
      sources: ['agid-ethereum-registry-only-mode'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/ethereum/mode3/tx/submit', async (req, res) => {
    const auth = authorizeRegistryWrite(req, options);
    if (auth.ok === false) {
      return sendMode3AuthFailure(req, res, auth);
    }

    const body = objectBody(req.body);
    if ('privateKey' in body || 'signingKey' in body) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Private keys are not accepted in API payloads.',
        sources: ['agid-ethereum-registry-rpc-client'],
        warnings: ['configure AGID_ETHEREUM_PRIVATE_KEY on the server instead'],
        cache: 'none',
      }, 400);
    }
    const txPlan = readTxPlan(body.txPlan ?? body.plan);
    if (!txPlan) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'txPlan is required and must come from a Mode 3 registry operation.',
        sources: ['agid-ethereum-registry-rpc-client'],
        warnings: ['submit only public txPlan material; raw AGID/AOID/address payloads are not accepted'],
        cache: 'none',
      }, 400);
    }

    try {
      const client = routeEthereumClient(options);
      const submission = await client.submitTxPlan(txPlan, {
        requiredConfirmations: readConfirmations(body.requiredConfirmations),
      });
      return sendAgidResult(req, res, {
        ok: submission.receipt.status === 'success',
        data: {
          submission,
          registryUpdateHint: {
            observedTxHash: submission.txHash,
            repeatOriginalMode3OperationWithObservedTxHash: true,
          },
        },
        error: submission.receipt.status === 'success' ? undefined : 'Ethereum transaction did not complete successfully',
        confidence: submission.receipt.status === 'success' ? 0.98 : 0.3,
        sources: ['agid-ethereum-registry-rpc-client'],
        warnings: [...auth.warnings, ...submission.warnings],
        cache: 'none',
      }, submission.receipt.status === 'success' ? 200 : 409);
    } catch (error) {
      return sendAgidResult(req, res, {
        ok: false,
        error: error instanceof Error ? error.message : 'Ethereum registry transaction submission failed',
        sources: ['agid-ethereum-registry-rpc-client'],
        warnings: auth.warnings,
        cache: 'none',
      }, 503);
    }
  });

  app.get('/api/ethereum/mode3/tx/receipt/:txHash', async (req, res) => {
    const auth = authorizeRegistryWrite(req, options);
    if (auth.ok === false) {
      return sendMode3AuthFailure(req, res, auth);
    }

    try {
      const txHash = readText(req.params.txHash);
      const receipt = await routeEthereumClient(options).receipt(txHash);
      return sendAgidResult(req, res, {
        ok: receipt.status === 'success',
        data: {
          receipt,
          requiredConfirmations: readConfirmations(req.query.requiredConfirmations),
        },
        error: receipt.status === 'success' ? undefined : 'Ethereum transaction receipt is pending or reverted',
        confidence: receipt.status === 'success' ? 0.98 : 0.35,
        sources: ['agid-ethereum-registry-rpc-client'],
        warnings: auth.warnings,
        cache: 'none',
      }, receipt.status === 'success' ? 200 : 202);
    } catch (error) {
      return sendAgidResult(req, res, {
        ok: false,
        error: error instanceof Error ? error.message : 'Ethereum registry receipt lookup failed',
        sources: ['agid-ethereum-registry-rpc-client'],
        warnings: auth.warnings,
        cache: 'none',
      }, 503);
    }
  });

  app.post('/api/ethereum/mode3/issuer/register', (req, res) => {
    const auth = authorizeRegistryWrite(req, options);
    if (auth.ok === false) {
      return sendMode3AuthFailure(req, res, auth);
    }

    const result = store.registerIssuer(objectBody(req.body) as EthereumIssuerRegistrationInput);
    return sendMode3Result(req, res, result, undefined, auth.warnings);
  });

  app.post('/api/ethereum/mode3/revocation/anchor', (req, res) => {
    const auth = authorizeRegistryWrite(req, options);
    if (auth.ok === false) {
      return sendMode3AuthFailure(req, res, auth);
    }

    const result = store.anchorRevocationRoot(objectBody(req.body) as EthereumRevocationAnchorInput);
    return sendMode3Result(req, res, result, undefined, auth.warnings);
  });

  app.post('/api/ethereum/mode3/nullifier/mark-used', (req, res) => {
    const auth = authorizeRegistryWrite(req, options);
    if (auth.ok === false) {
      return sendMode3AuthFailure(req, res, auth);
    }

    const result = store.markNullifierUsed(objectBody(req.body) as EthereumNullifierMarkUsedInput);
    return sendMode3Result(req, res, result, undefined, auth.warnings);
  });

  app.post('/api/ethereum/mode3/payment/record', (req, res) => {
    const auth = authorizeRegistryWrite(req, options);
    if (auth.ok === false) {
      return sendMode3AuthFailure(req, res, auth);
    }

    const result = store.recordPayment(objectBody(req.body) as EthereumPaymentRecordInput);
    return sendMode3Result(req, res, result, undefined, auth.warnings);
  });
}
