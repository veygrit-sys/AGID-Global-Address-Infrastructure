import type { Express, Request, Response as ExpressResponse } from 'express';

import {
  EXTERNAL_DELIVERY_API_MODEL_VERSION,
  loadExternalDeliveryApiRuntimeConfig,
  normalizeExternalDeliveryApiManifest,
  publicExternalDeliveryApiProfile,
  readExternalDeliveryApiOperation,
  runExternalDeliveryApiOperation,
  type ExternalDeliveryApiOperation,
} from '../../lib/externalDeliveryApi';
import { sendAgidResult } from '../agidResult';
import { arrayOrUndefined, objectBody, type JsonRecord } from '../requestParsing';
import {
  deprecatedBodyFlags,
  requireConfiguredAdminToken,
  serverPolicyEnabled,
} from '../routeSecurity';

type SafeFetch = (url: string, options?: RequestInit, timeoutMs?: number, retries?: number) => Promise<globalThis.Response>;

function operationFromPathOrBody(fallback: ExternalDeliveryApiOperation | undefined, body: JsonRecord) {
  return fallback ?? readExternalDeliveryApiOperation(body.operation);
}

export function registerExternalDeliveryApiRoutes(
  app: Express,
  { connectorFetch }: { connectorFetch: SafeFetch },
) {
  const registry = loadExternalDeliveryApiRuntimeConfig();
  const connectorToken = process.env.AGID_EXTERNAL_DELIVERY_CONNECTOR_TOKEN?.trim() ?? '';

  app.get('/api/delivery/external/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: {
        modelVersion: EXTERNAL_DELIVERY_API_MODEL_VERSION,
        serverConfigured: registry.apis.length > 0,
        apis: registry.apis.map(publicExternalDeliveryApiProfile),
        importContract: {
          runtimeUrlsAcceptedFromClient: false,
          secretsAcceptedFromClient: false,
          shipmentPayloadsAcceptedInManifest: false,
          executionRequiresServerAllowlist: true,
          runtimeConfigEnv: 'AGID_EXTERNAL_DELIVERY_APIS_JSON',
        },
        privacyDefaults: {
          rawAddressSentByDefault: false,
          rawAgidSentByDefault: false,
          rawWaybillIdSentByDefault: false,
          rawLabelPayloadReturnedByDefault: false,
          plaintextCarrierCallsRequireServerPolicy: true,
        },
        operations: [
          'rate-quote',
          'service-availability',
          'shipment-create',
          'label-create',
          'tracking',
          'cancel',
          'pickup-schedule',
          'carrier-acceptance',
          'delivery-proof',
        ],
      },
      confidence: 1,
      sources: [EXTERNAL_DELIVERY_API_MODEL_VERSION],
      warnings: [...registry.errors, ...registry.warnings],
      cache: 'none',
    });
  });

  app.post('/api/delivery/external/import', (req, res) => {
    const body = objectBody(req.body);
    const validation = normalizeExternalDeliveryApiManifest(body.manifest ?? body);
    sendAgidResult(req, res, {
      ok: validation.accepted,
      data: {
        modelVersion: EXTERNAL_DELIVERY_API_MODEL_VERSION,
        accepted: validation.accepted,
        manifest: validation.manifest,
        execution: {
          enabled: false,
          reason: 'Imported delivery manifests are metadata only until a matching server-side runtime config is allowlisted.',
        },
        errors: validation.errors,
      },
      confidence: validation.accepted ? 1 : 0.2,
      sources: [EXTERNAL_DELIVERY_API_MODEL_VERSION],
      warnings: validation.warnings,
      cache: 'none',
      error: validation.accepted ? undefined : validation.errors[0] ?? 'External delivery API manifest was rejected',
    }, validation.accepted ? 200 : 400);
  });

  const handleOperation = (fallbackOperation?: ExternalDeliveryApiOperation) => async (req: Request, res: ExpressResponse) => {
    const body = objectBody(req.body);
    const deprecated = deprecatedBodyFlags(body, ['allowPlaintextToExternalDeliveryApi', 'allowLabelPayloadReturn']);
    if (deprecated.length) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Deprecated delivery connector flags are not accepted in the request body.',
        sources: [EXTERNAL_DELIVERY_API_MODEL_VERSION],
        warnings: deprecated.map(flag => `${flag} is now a server-side policy`),
        cache: 'none',
      }, 400);
    }
    const auth = requireConfiguredAdminToken(req, {
      expectedToken: connectorToken,
      headerName: 'X-AGID-External-Delivery-Token',
      missingError: 'External delivery connector token is not configured.',
      invalidError: 'External delivery connector execution requires X-AGID-External-Delivery-Token.',
      missingWarning: 'set AGID_EXTERNAL_DELIVERY_CONNECTOR_TOKEN before enabling external delivery execution',
    });
    if (auth.ok === false) {
      return sendAgidResult(req, res, {
        ok: false,
        error: auth.error,
        sources: [EXTERNAL_DELIVERY_API_MODEL_VERSION],
        warnings: auth.warnings,
        cache: 'none',
      }, auth.statusCode);
    }
    const operation = operationFromPathOrBody(fallbackOperation, body);
    if (!operation) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Missing or unsupported delivery API operation',
        data: {
          modelVersion: EXTERNAL_DELIVERY_API_MODEL_VERSION,
          supportedOperations: [
            'rate-quote',
            'service-availability',
            'shipment-create',
            'label-create',
            'tracking',
            'cancel',
            'pickup-schedule',
            'carrier-acceptance',
            'delivery-proof',
          ],
        },
        confidence: 0,
        sources: [EXTERNAL_DELIVERY_API_MODEL_VERSION],
        warnings: [],
        cache: 'none',
      }, 400);
    }

    const run = await runExternalDeliveryApiOperation({
      apis: registry.apis,
      requestedApiIds: arrayOrUndefined(body.deliveryApiIds ?? body.apiIds) as string[] | undefined,
      operation,
      input: body,
      fetcher: connectorFetch,
      allowPlaintextToExternalDeliveryApi: serverPolicyEnabled(process.env.AGID_EXTERNAL_DELIVERY_ALLOW_PLAINTEXT, false),
      allowLabelPayloadReturn: serverPolicyEnabled(process.env.AGID_EXTERNAL_DELIVERY_ALLOW_LABEL_PAYLOAD, false),
    });
    const ok = run.results.some((result) => result.ok);

    return sendAgidResult(req, res, {
      ok,
      data: {
        modelVersion: EXTERNAL_DELIVERY_API_MODEL_VERSION,
        operation,
        attempted: run.results.length,
        results: run.results,
        privacy: {
          serverAllowlistRequired: true,
          plaintextServerPolicy: serverPolicyEnabled(process.env.AGID_EXTERNAL_DELIVERY_ALLOW_PLAINTEXT, false),
          rawLabelPayloadServerPolicy: serverPolicyEnabled(process.env.AGID_EXTERNAL_DELIVERY_ALLOW_LABEL_PAYLOAD, false),
          rawAddressStoredByAgid: false,
          rawAgidStoredByAgid: false,
          rawWaybillIdStoredByAgid: false,
        },
      },
      confidence: ok ? 0.86 : 0.25,
      sources: run.sources.length ? run.sources : [EXTERNAL_DELIVERY_API_MODEL_VERSION],
      warnings: [...auth.warnings, ...run.warnings],
      cache: 'none',
      error: ok ? undefined : run.results[0]?.error ?? run.warnings[0] ?? 'No external delivery API completed the requested operation',
    }, ok ? 200 : 400);
  };

  app.post('/api/delivery/external/request', handleOperation());
  app.post('/api/delivery/external/quote', handleOperation('rate-quote'));
  app.post('/api/delivery/external/create-shipment', handleOperation('shipment-create'));
  app.post('/api/delivery/external/create-label', handleOperation('label-create'));
  app.post('/api/delivery/external/track', handleOperation('tracking'));
  app.post('/api/delivery/external/cancel', handleOperation('cancel'));
  app.post('/api/delivery/external/pickup', handleOperation('pickup-schedule'));
  app.post('/api/delivery/external/carrier-acceptance', handleOperation('carrier-acceptance'));
  app.post('/api/delivery/external/delivery-proof', handleOperation('delivery-proof'));
}
