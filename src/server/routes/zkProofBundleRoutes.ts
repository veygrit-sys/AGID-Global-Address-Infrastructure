import type { Express } from 'express';

import type { InMemoryZkProofBundleRegistry } from '../../lib/zkProofBundleRegistry';
import { sendAgidResult } from '../agidResult';
import { arrayOrUndefined, objectBody, objectOrUndefined } from '../requestParsing';

export function registerZkProofBundleRoutes(
  app: Express,
  zkProofBundleRegistry: InMemoryZkProofBundleRegistry,
) {
  app.post('/api/zk/proof-bundles/register', (req, res) => {
    const body = objectBody(req.body);
    const result = zkProofBundleRegistry.registerBundle({
      proofs: arrayOrUndefined(body.proofs) ?? [],
      scope: body.scope as string | undefined,
      audience: body.audience as string | undefined,
      operationId: body.operationId as string | undefined,
      expectedChallengeHash: body.expectedChallengeHash as string | undefined,
      expectedChallengeHashesByVersion: objectOrUndefined(body.expectedChallengeHashesByVersion) as Record<string, string> | undefined,
      now: body.now as string | undefined,
      metadata: objectOrUndefined(body.metadata) as any,
    });
    const ok = result.status !== 'rejected';

    sendAgidResult(req, res, {
      ok,
      data: result,
      error: ok ? undefined : result.errors[0] ?? 'ZK proof bundle registration failed',
      confidence: ok ? 1 : 0.2,
      sources: ['agid-zk-proof-bundle-registry'],
      warnings: result.warnings,
      cache: 'none',
    }, ok ? 200 : 400);
  });

  app.post('/api/zk/proof-bundles/:bundleId/verify', (req, res) => {
    const body = objectBody(req.body);
    const verification = zkProofBundleRegistry.verifyBundle(req.params.bundleId, {
      now: body.now as string | undefined,
    });
    const statusCode = verification.status === 'missing'
      ? 404
      : verification.valid
        ? 200
        : 409;

    sendAgidResult(req, res, {
      ok: verification.valid,
      data: verification,
      error: verification.valid ? undefined : verification.errors[0] ?? 'ZK proof bundle verification failed',
      confidence: verification.valid ? 1 : 0.15,
      sources: ['agid-zk-proof-bundle-registry'],
      warnings: verification.warnings,
      cache: 'none',
    }, statusCode);
  });

  app.post('/api/zk/proof-bundles/:bundleId/revoke', (req, res) => {
    const body = objectBody(req.body);
    const revoked = zkProofBundleRegistry.revokeBundle(req.params.bundleId, {
      reason: typeof body.reason === 'string' ? body.reason : 'unspecified',
      revokedAt: body.revokedAt as string | undefined,
    });

    if (!revoked) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'ZK proof bundle not found',
        sources: ['agid-zk-proof-bundle-registry'],
        warnings: [],
        cache: 'none',
      }, 404);
    }

    const verification = zkProofBundleRegistry.verifyBundle(req.params.bundleId, {
      now: (body.now as string | undefined) ?? (body.revokedAt as string | undefined),
    });
    return sendAgidResult(req, res, {
      ok: true,
      data: verification,
      confidence: 1,
      sources: ['agid-zk-proof-bundle-registry'],
      warnings: verification.warnings,
      cache: 'none',
    });
  });

  app.get('/api/zk/proof-bundles/stats', (req, res) => {
    const stats = zkProofBundleRegistry.getStats();
    sendAgidResult(req, res, {
      ok: true,
      data: stats,
      confidence: 1,
      sources: ['agid-zk-proof-bundle-registry'],
      warnings: [],
      cache: 'none',
    });
  });
}
