import type { Express } from 'express';

import {
  buildRevocationFreshnessRootAnchor,
  verifyFreshnessProofRootAnchor,
} from '../../lib/revocationFreshnessRootAnchoring';
import { sendAgidResult } from '../agidResult';
import { objectBody, objectOrUndefined } from '../requestParsing';

export function registerRevocationFreshnessRoutes(app: Express) {
  app.post('/api/revocation-freshness/anchor', async (req, res) => {
    const body = objectBody(req.body);
    const registry = objectOrUndefined(body.registry);
    if (!registry) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Missing revocation freshness registry',
        sources: ['agid-revocation-freshness-root-anchor'],
        warnings: ['registry is required'],
        cache: 'none',
      }, 400);
    }

    const anchor = await buildRevocationFreshnessRootAnchor({
      registry: registry as any,
      issuerDid: String(body.issuerDid ?? ''),
      credentialType: String(body.credentialType ?? ''),
      schemaHash: String(body.schemaHash ?? ''),
      freshnessPolicy: objectOrUndefined(body.freshnessPolicy) as any,
      now: body.now as string | undefined,
    });

    return sendAgidResult(req, res, {
      ok: anchor.anchorable,
      data: anchor,
      error: anchor.anchorable ? undefined : anchor.errors[0] ?? 'Revocation freshness root is not anchorable',
      confidence: anchor.anchorable ? 1 : 0.25,
      sources: anchor.sourceIds.length ? anchor.sourceIds : ['agid-revocation-freshness-root-anchor'],
      warnings: anchor.warnings,
      cache: 'none',
    }, anchor.anchorable ? 200 : 400);
  });

  app.post('/api/revocation-freshness/verify', (req, res) => {
    const body = objectBody(req.body);
    const envelope = objectOrUndefined(body.envelope) ?? objectOrUndefined(body.proof);
    const anchor = objectOrUndefined(body.anchor);
    if (!envelope || !anchor) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Missing freshness proof envelope or anchor',
        sources: ['agid-revocation-freshness-root-anchor'],
        warnings: ['envelope and anchor are required'],
        cache: 'none',
      }, 400);
    }

    const verification = verifyFreshnessProofRootAnchor(envelope as any, anchor as any, {
      now: body.now as string | undefined,
    });

    return sendAgidResult(req, res, {
      ok: verification.valid,
      data: verification,
      error: verification.valid ? undefined : verification.errors[0] ?? 'Freshness proof does not match anchor',
      confidence: verification.valid ? 1 : 0.2,
      sources: ['agid-revocation-freshness-root-anchor'],
      warnings: verification.warnings,
      cache: 'none',
    }, verification.valid ? 200 : 409);
  });
}
