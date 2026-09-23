import type { Express } from 'express';

import {
  createDroneDeliveryEvidenceReceipt,
  listDroneDeliveryEvidenceApiCapabilities,
  type DroneDeliveryEvidenceApiInput,
} from '../../lib/droneDeliveryEvidenceApi';
import { sendAgidResult } from '../agidResult';
import { objectBody } from '../requestParsing';

export function registerDroneDeliveryEvidenceRoutes(app: Express) {
  app.get('/api/drone-delivery-evidence/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: listDroneDeliveryEvidenceApiCapabilities(),
      confidence: 1,
      sources: ['agid-drone-delivery-evidence-api'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/drone-delivery-evidence/report', (req, res) => {
    const receipt = createDroneDeliveryEvidenceReceipt(objectBody(req.body) as DroneDeliveryEvidenceApiInput);
    const ok = receipt.validation.valid;
    sendAgidResult(req, res, {
      ok,
      data: receipt,
      error: ok ? undefined : receipt.validation.errors[0] ?? 'Drone delivery evidence receipt failed validation',
      confidence: ok ? receipt.publicApiProjection.confidence : 0.2,
      sources: ['agid-drone-delivery-evidence-api', 'delivery-reachability-report'],
      warnings: receipt.warnings,
      cache: 'none',
    }, ok ? 200 : 409);
  });
}
