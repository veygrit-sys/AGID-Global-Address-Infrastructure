import type { Express } from 'express';

import {
  buildManagedZkProofJob,
  listManagedZkProofServerCapabilities,
  type ManagedZkProofJobInput,
} from '../../lib/managedZkProofServer';
import { sendAgidResult } from '../agidResult';
import { objectBody } from '../requestParsing';

export function registerManagedZkProofServerRoutes(app: Express) {
  app.get('/api/zk/managed-proof-server/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listManagedZkProofServerCapabilities(),
      confidence: 1,
      sources: ['agid-managed-zk-proof-server'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/zk/managed-proof-server/jobs', (req, res) => {
    const job = buildManagedZkProofJob(objectBody(req.body) as ManagedZkProofJobInput);
    const statusCode = job.accepted
      ? 200
      : job.status === 'requires-private-deployment'
        ? 409
        : 400;

    sendAgidResult(req, res, {
      ok: job.accepted,
      data: job,
      error: job.accepted
        ? undefined
        : job.errors[0] ?? 'Managed ZK proof job rejected by privacy or deployment policy',
      confidence: job.accepted ? 1 : 0.2,
      sources: ['agid-managed-zk-proof-server'],
      warnings: job.warnings,
      cache: 'none',
    }, statusCode);
  });
}
