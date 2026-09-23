import type { Express } from 'express';

import type { AddressVerificationStatus } from '../../lib/addressVerificationEngine';
import type {
  PrivateAddressPredicateProofEnvelope,
  VerifyPrivateAddressPredicateRequirement,
} from '../../lib/privateAddressPredicateProof';
import {
  getZkOnlyModeCapabilities,
  verifyZkOnlyPrivateAddressPredicate,
  verifyZkOnlyProofBundle,
  type ZkOnlyVerificationSurface,
} from '../../lib/zkOnlyMode';
import { sendAgidResult } from '../agidResult';
import { arrayOrUndefined, objectBody, objectOrUndefined } from '../requestParsing';
import {
  configuredIssuerSecret,
  forbiddenRequestSecretKey,
  type RouteSecretOptions,
} from '../routeSecurity';

export type ZkOnlyModeRouteOptions = RouteSecretOptions;

function booleanOrUndefined(value: unknown) {
  return typeof value === 'boolean' ? value : undefined;
}

function numberOrUndefined(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function registerZkOnlyModeRoutes(app: Express, options: ZkOnlyModeRouteOptions = {}) {
  app.get('/api/zk/mode2/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: getZkOnlyModeCapabilities(),
      confidence: 1,
      sources: ['agid-zk-only-mode'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/zk/mode2/private-address-predicate/verify', async (req, res) => {
    const body = objectBody(req.body);
    const forbiddenSecret = forbiddenRequestSecretKey(body);
    if (forbiddenSecret) {
      return sendAgidResult(req, res, {
        ok: false,
        error: `${forbiddenSecret} is not accepted in API payloads.`,
        sources: ['agid-zk-only-mode'],
        warnings: ['configure issuer verification secrets on the server instead'],
        cache: 'none',
      }, 400);
    }
    const envelope = objectOrUndefined(body.envelope)
      ?? objectOrUndefined(body.proof);

    if (!envelope) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Mode 2 private address predicate verification requires envelope or proof.',
        sources: ['agid-zk-only-mode'],
        warnings: [],
        cache: 'none',
      }, 400);
    }
    const issuerSecret = configuredIssuerSecret(body.issuerId, options);
    if (!issuerSecret) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Issuer verification secret is not configured for Mode 2 proof verification.',
        sources: ['agid-zk-only-mode'],
        warnings: ['set AGID_ZK_ISSUER_SECRET or AGID_ZK_ISSUER_SECRET_<ISSUER_ID> on the server'],
        cache: 'none',
      }, 503);
    }

    const result = await verifyZkOnlyPrivateAddressPredicate({
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
    });

    return sendAgidResult(req, res, {
      ok: result.valid,
      data: result,
      error: result.valid ? undefined : result.errors[0] ?? 'Mode 2 private address predicate verification failed',
      confidence: result.valid ? 1 : 0.25,
      sources: ['agid-zk-only-mode'],
      warnings: result.warnings,
      cache: 'none',
    }, result.valid ? 200 : 409);
  });

  app.post('/api/zk/mode2/proof-bundle/verify', (req, res) => {
    const body = objectBody(req.body);
    const proofs = arrayOrUndefined(body.proofs) ?? [];
    const result = verifyZkOnlyProofBundle({
      proofs,
      surface: body.surface as ZkOnlyVerificationSurface | undefined,
      expectedScope: body.expectedScope as string | undefined,
      expectedChallengeHash: body.expectedChallengeHash as string | undefined,
      expectedChallengeHashesByVersion: objectOrUndefined(body.expectedChallengeHashesByVersion) as Record<string, string> | undefined,
      requireSameScope: booleanOrUndefined(body.requireSameScope),
      requireSameChallenge: booleanOrUndefined(body.requireSameChallenge),
      requireCommonValidityWindow: booleanOrUndefined(body.requireCommonValidityWindow),
      allowUnknownProofVersions: booleanOrUndefined(body.allowUnknownProofVersions),
      allowDuplicateNullifiers: booleanOrUndefined(body.allowDuplicateNullifiers),
      allowSharedCommitments: booleanOrUndefined(body.allowSharedCommitments),
      now: body.now as string | undefined,
    });

    const statusCode = proofs.length === 0
      ? 400
      : result.valid
        ? 200
        : 409;

    return sendAgidResult(req, res, {
      ok: result.valid,
      data: result,
      error: result.valid ? undefined : result.errors[0] ?? 'Mode 2 proof bundle verification failed',
      confidence: result.valid ? 1 : 0.25,
      sources: ['agid-zk-only-mode'],
      warnings: result.warnings,
      cache: 'none',
    }, statusCode);
  });
}
