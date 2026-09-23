import type { Express, Request } from 'express';

import type { AddressVerificationStatus } from '../../lib/addressVerificationEngine';
import {
  createInMemoryEthereumRegistryOnlyStore,
  type EthereumIssuerRegistrationInput,
  type EthereumNullifierMarkUsedInput,
  type EthereumPaymentRecordInput,
  type EthereumRevocationAnchorInput,
  type InMemoryEthereumRegistryOnlyStore,
} from '../../lib/ethereumRegistryOnlyMode';
import {
  getFullZkEthereumModeCapabilities,
  getFullZkEthereumRegistrySnapshot,
  verifyFullZkEthereumPrivateAddressPredicate,
} from '../../lib/fullZkEthereumMode';
import type {
  PrivateAddressPredicateProofEnvelope,
  VerifyPrivateAddressPredicateRequirement,
} from '../../lib/privateAddressPredicateProof';
import type { ZkOnlyVerificationSurface } from '../../lib/zkOnlyMode';
import { sendAgidResult } from '../agidResult';
import { arrayOrUndefined, objectBody, objectOrUndefined } from '../requestParsing';
import {
  configuredIssuerSecret,
  forbiddenRequestSecretKey,
  requireConfiguredAdminToken,
  type RouteAdminAuthResult,
  type RouteSecretOptions,
} from '../routeSecurity';

export type FullZkEthereumModeRouteOptions = RouteSecretOptions & {
  store?: InMemoryEthereumRegistryOnlyStore;
  adminToken?: string;
};

function configuredAdminToken(options: FullZkEthereumModeRouteOptions) {
  return options.adminToken ?? process.env.AGID_ETHEREUM_REGISTRY_ADMIN_TOKEN?.trim() ?? '';
}

function authorizeRegistryWrite(req: Request, options: FullZkEthereumModeRouteOptions) {
  return requireConfiguredAdminToken(req, {
    expectedToken: configuredAdminToken(options),
    headerName: 'X-AGID-Ethereum-Admin-Token',
    missingError: 'Mode 4 registry admin token is not configured.',
    invalidError: 'Mode 4 registry write requires X-AGID-Ethereum-Admin-Token.',
    missingWarning: 'set AGID_ETHEREUM_REGISTRY_ADMIN_TOKEN before enabling Mode 4 registry writes',
  });
}

function sendMode4AuthFailure(
  req: Request,
  res: Parameters<typeof sendAgidResult>[1],
  auth: Extract<RouteAdminAuthResult, { ok: false }>,
) {
  return sendAgidResult(req, res, {
    ok: false,
    error: auth.error,
    sources: ['agid-full-zk-ethereum-mode'],
    warnings: auth.warnings,
    cache: 'none',
  }, auth.statusCode);
}

function numberOrUndefined(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function registerFullZkEthereumModeRoutes(
  app: Express,
  options: FullZkEthereumModeRouteOptions = {},
) {
  const store = options.store ?? createInMemoryEthereumRegistryOnlyStore();

  app.get('/api/zk-ethereum/mode4/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: getFullZkEthereumModeCapabilities(),
      confidence: 1,
      sources: ['agid-full-zk-ethereum-mode'],
      warnings: [],
      cache: 'none',
    });
  });

  app.get('/api/zk-ethereum/mode4/registry', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: getFullZkEthereumRegistrySnapshot(store),
      confidence: 0.95,
      sources: ['agid-full-zk-ethereum-mode', 'agid-ethereum-registry-only-mode'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/zk-ethereum/mode4/private-address-predicate/verify-and-record', async (req, res) => {
    const auth = authorizeRegistryWrite(req, options);
    if (auth.ok === false) {
      return sendMode4AuthFailure(req, res, auth);
    }

    const body = objectBody(req.body);
    const forbiddenSecret = forbiddenRequestSecretKey(body);
    if (forbiddenSecret) {
      return sendAgidResult(req, res, {
        ok: false,
        error: `${forbiddenSecret} is not accepted in API payloads.`,
        sources: ['agid-full-zk-ethereum-mode'],
        warnings: ['configure issuer verification secrets on the server instead'],
        cache: 'none',
      }, 400);
    }
    const envelope = objectOrUndefined(body.envelope)
      ?? objectOrUndefined(body.proof);

    if (!envelope) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Mode 4 private address predicate flow requires envelope or proof.',
        sources: ['agid-full-zk-ethereum-mode'],
        warnings: [],
        cache: 'none',
      }, 400);
    }
    const issuerSecret = configuredIssuerSecret(body.issuerId, options);
    if (!issuerSecret) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Issuer verification secret is not configured for Mode 4 proof verification.',
        sources: ['agid-full-zk-ethereum-mode'],
        warnings: ['set AGID_ZK_ISSUER_SECRET or AGID_ZK_ISSUER_SECRET_<ISSUER_ID> on the server'],
        cache: 'none',
      }, 503);
    }

    const result = await verifyFullZkEthereumPrivateAddressPredicate({
      envelope: envelope as PrivateAddressPredicateProofEnvelope,
      surface: body.surface as ZkOnlyVerificationSurface | undefined,
      issuerId: body.issuerId as string | undefined,
      issuerSecret,
      expectedScope: body.expectedScope as string | undefined,
      expectedChallenge: body.expectedChallenge as string | undefined,
      requiredPredicates: arrayOrUndefined(body.requiredPredicates) as VerifyPrivateAddressPredicateRequirement[] | undefined,
      minimumScore: numberOrUndefined(body.minimumScore),
      allowedStatuses: arrayOrUndefined(body.allowedStatuses) as AddressVerificationStatus[] | undefined,
      now: body.now as string | undefined,
      store,
      networkId: body.networkId as string | undefined,
      issuerRegistration: objectOrUndefined(body.issuerRegistration) as EthereumIssuerRegistrationInput | undefined,
      revocationAnchor: objectOrUndefined(body.revocationAnchor) as EthereumRevocationAnchorInput | undefined,
      nullifier: objectOrUndefined(body.nullifier) as EthereumNullifierMarkUsedInput | undefined,
      payment: objectOrUndefined(body.payment) as EthereumPaymentRecordInput | undefined,
    });
    const statusCode = result.valid
      ? 200
      : result.errors.includes('nullifier-already-used')
        ? 409
        : 400;

    return sendAgidResult(req, res, {
      ok: result.valid,
      data: result,
      error: result.valid ? undefined : result.errors[0] ?? 'Mode 4 Full ZK + Ethereum flow failed',
      confidence: result.valid ? 0.98 : 0.25,
      sources: ['agid-full-zk-ethereum-mode', 'agid-zk-only-mode', 'agid-ethereum-registry-only-mode'],
      warnings: [...auth.warnings, ...result.warnings],
      cache: 'none',
    }, statusCode);
  });
}
