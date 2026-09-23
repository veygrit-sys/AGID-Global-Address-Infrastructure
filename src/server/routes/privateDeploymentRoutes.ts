import type { Express } from 'express';

import {
  buildPrivateDeploymentPlan,
  listPrivateDeploymentCapabilities,
  type PrivateDeploymentPlanInput,
} from '../../lib/privateDeployment';
import { sendAgidResult } from '../agidResult';
import { objectBody } from '../requestParsing';

export function registerPrivateDeploymentRoutes(app: Express) {
  app.get('/api/private-deployments/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listPrivateDeploymentCapabilities(),
      confidence: 1,
      sources: ['agid-private-deployment'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/private-deployments/plan', (req, res) => {
    const plan = buildPrivateDeploymentPlan(objectBody(req.body) as PrivateDeploymentPlanInput);

    sendAgidResult(req, res, {
      ok: plan.accepted,
      data: plan,
      error: plan.accepted
        ? undefined
        : plan.errors[0] ?? 'Private deployment plan rejected by privacy or witness policy',
      confidence: plan.accepted ? 1 : 0.2,
      sources: ['agid-private-deployment'],
      warnings: plan.warnings,
      cache: 'none',
    }, plan.accepted ? 200 : 400);
  });
}
