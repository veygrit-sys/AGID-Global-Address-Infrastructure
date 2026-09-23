import type { Express } from 'express';

import {
  buildCloudDbConnectorPlan,
  buildCloudDbSyncJob,
  listCloudDbConnectorProfiles,
  type CloudDbConnectorPlanInput,
  type CloudDbSyncJobInput,
} from '../../lib/cloudDbIntegration';
import {
  listDatabaseAdapterCompatibility,
  summarizeDatabaseAdapterCompatibility,
  validateDatabaseAdapterCompatibility,
} from '../../lib/databaseAdapterCompatibility';
import { sendAgidResult } from '../agidResult';
import { objectBody, type JsonRecord } from '../requestParsing';

function optionalLayer(value: unknown): CloudDbConnectorPlanInput['layer'] {
  return value === 'AGID' || value === 'AOID' ? value : undefined;
}

function optionalString(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function cloudDbPlanInputFrom(body: JsonRecord): CloudDbConnectorPlanInput {
  return {
    providerId: String(body.providerId ?? ''),
    purpose: String(body.purpose ?? ''),
    layer: optionalLayer(body.layer),
    entityType: optionalString(body.entityType),
    payload: body.payload,
    ownerConsent: body.ownerConsent === true,
    encryptedAtRest: body.encryptedAtRest === true,
    encryptedInTransit: body.encryptedInTransit === true,
    storeRawPayload: body.storeRawPayload === true,
    region: optionalString(body.region),
  };
}

function cloudDbSyncJobInputFrom(body: JsonRecord): CloudDbSyncJobInput {
  return {
    ...cloudDbPlanInputFrom(body),
    entityType: String(body.entityType ?? ''),
    entityId: String(body.entityId ?? ''),
    action: String(body.action ?? 'update'),
    now: typeof body.now === 'number' ? body.now : undefined,
  };
}

export function registerCloudDbRoutes(app: Express) {
  app.get('/api/cloud-db/connectors', (req, res) => {
    const connectors = listCloudDbConnectorProfiles();
    sendAgidResult(req, res, {
      ok: true,
      data: {
        connectors,
        plaintextAoidStorageAllowed: false,
        dispatchMode: 'adapter-contract-before-sdk-dispatch',
      },
      confidence: 1,
      sources: ['agid-cloud-db-integration'],
      warnings: [],
      cache: 'none',
    });
  });

  app.get('/api/cloud-db/compatibility', (req, res) => {
    const adapters = listDatabaseAdapterCompatibility();
    const validation = validateDatabaseAdapterCompatibility();

    sendAgidResult(req, res, {
      ok: validation.valid,
      data: {
        summary: summarizeDatabaseAdapterCompatibility(),
        adapters,
        validation,
        plaintextAoidStorageAllowed: false,
        runtimeLedgerStoreModes: validation.runtimeLedgerStoreModes,
      },
      error: validation.valid ? undefined : validation.errors[0] ?? 'Database adapter compatibility is invalid',
      confidence: validation.valid ? 1 : 0.2,
      sources: ['agid-database-adapter-compatibility', 'agid-cloud-db-integration'],
      warnings: validation.valid ? [] : validation.errors,
      cache: 'none',
    }, validation.valid ? 200 : 500);
  });

  app.post('/api/cloud-db/plan', (req, res) => {
    const plan = buildCloudDbConnectorPlan(cloudDbPlanInputFrom(objectBody(req.body)));

    sendAgidResult(req, res, {
      ok: plan.allowed,
      data: plan,
      error: plan.allowed ? undefined : plan.errors[0] ?? 'Cloud/DB connector plan is blocked',
      confidence: plan.allowed ? 1 : 0.2,
      sources: ['agid-cloud-db-integration', 'agid-aoid-governance'],
      warnings: plan.warnings,
      cache: 'none',
    }, plan.allowed ? 200 : 400);
  });

  app.post('/api/cloud-db/sync-job', (req, res) => {
    try {
      const job = buildCloudDbSyncJob(cloudDbSyncJobInputFrom(objectBody(req.body)));

      return sendAgidResult(req, res, {
        ok: true,
        data: job,
        confidence: 1,
        sources: ['agid-cloud-db-integration', 'agid-sync-queue'],
        warnings: job.plan.warnings,
        cache: 'none',
      });
    } catch (error) {
      return sendAgidResult(req, res, {
        ok: false,
        error: error instanceof Error ? error.message : 'Cloud/DB sync job could not be built',
        sources: ['agid-cloud-db-integration'],
        warnings: ['No provider SDK request is created until the adapter contract passes.'],
        cache: 'none',
      }, 400);
    }
  });
}
