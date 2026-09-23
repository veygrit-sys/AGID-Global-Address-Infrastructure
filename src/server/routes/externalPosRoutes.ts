import type { Express, Request, Response as ExpressResponse } from 'express';

import {
  EXTERNAL_POS_INTEGRATION_MODEL_VERSION,
  loadExternalPosRuntimeConfig,
  normalizeExternalPosManifest,
  publicExternalPosProfile,
  readExternalPosOperation,
  runExternalPosOperation,
  type ExternalPosOperation,
} from '../../lib/externalPosIntegration';
import { sendAgidResult } from '../agidResult';
import { arrayOrUndefined, objectBody, type JsonRecord } from '../requestParsing';
import {
  deprecatedBodyFlags,
  requireConfiguredAdminToken,
  serverPolicyEnabled,
} from '../routeSecurity';

type SafeFetch = (url: string, options?: RequestInit, timeoutMs?: number, retries?: number) => Promise<globalThis.Response>;

function operationFromPathOrBody(fallback: ExternalPosOperation | undefined, body: JsonRecord) {
  return fallback ?? readExternalPosOperation(body.operation);
}

export function registerExternalPosRoutes(
  app: Express,
  { connectorFetch }: { connectorFetch: SafeFetch },
) {
  const registry = loadExternalPosRuntimeConfig();
  const connectorToken = process.env.AGID_EXTERNAL_POS_CONNECTOR_TOKEN?.trim() ?? '';

  app.get('/api/pos/external/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: {
        modelVersion: EXTERNAL_POS_INTEGRATION_MODEL_VERSION,
        serverConfigured: registry.apis.length > 0,
        apis: registry.apis.map(publicExternalPosProfile),
        importContract: {
          runtimeUrlsAcceptedFromClient: false,
          secretsAcceptedFromClient: false,
          customerPayloadsAcceptedInManifest: false,
          executionRequiresServerAllowlist: true,
          runtimeConfigEnv: 'AGID_EXTERNAL_POS_APIS_JSON',
        },
        privacyDefaults: {
          rawAddressSentByDefault: false,
          rawCustomerSentByDefault: false,
          rawAgidSentByDefault: false,
          rawQrPayloadSentByDefault: false,
          plaintextPosCallsRequireServerPolicy: true,
        },
        operations: [
          'sale-link',
          'pickup-ready',
          'handoff-complete',
          'receipt-export',
          'customer-note',
          'refund-release',
        ],
      },
      confidence: 1,
      sources: [EXTERNAL_POS_INTEGRATION_MODEL_VERSION],
      warnings: [...registry.errors, ...registry.warnings],
      cache: 'none',
    });
  });

  app.post('/api/pos/external/import', (req, res) => {
    const body = objectBody(req.body);
    const validation = normalizeExternalPosManifest(body.manifest ?? body);
    sendAgidResult(req, res, {
      ok: validation.accepted,
      data: {
        modelVersion: EXTERNAL_POS_INTEGRATION_MODEL_VERSION,
        accepted: validation.accepted,
        manifest: validation.manifest,
        execution: {
          enabled: false,
          reason: 'Imported POS manifests are metadata only until a matching server-side runtime config is allowlisted.',
        },
        errors: validation.errors,
      },
      confidence: validation.accepted ? 1 : 0.2,
      sources: [EXTERNAL_POS_INTEGRATION_MODEL_VERSION],
      warnings: validation.warnings,
      cache: 'none',
      error: validation.accepted ? undefined : validation.errors[0] ?? 'External POS manifest was rejected',
    }, validation.accepted ? 200 : 400);
  });

  const handleOperation = (fallbackOperation?: ExternalPosOperation) => async (req: Request, res: ExpressResponse) => {
    const body = objectBody(req.body);
    const deprecated = deprecatedBodyFlags(body, ['allowPlaintextToExternalPos', 'allowRawResponseReturn']);
    if (deprecated.length) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Deprecated POS connector flags are not accepted in the request body.',
        sources: [EXTERNAL_POS_INTEGRATION_MODEL_VERSION],
        warnings: deprecated.map(flag => `${flag} is now a server-side policy`),
        cache: 'none',
      }, 400);
    }
    const auth = requireConfiguredAdminToken(req, {
      expectedToken: connectorToken,
      headerName: 'X-AGID-External-POS-Token',
      missingError: 'External POS connector token is not configured.',
      invalidError: 'External POS connector execution requires X-AGID-External-POS-Token.',
      missingWarning: 'set AGID_EXTERNAL_POS_CONNECTOR_TOKEN before enabling external POS execution',
    });
    if (auth.ok === false) {
      return sendAgidResult(req, res, {
        ok: false,
        error: auth.error,
        sources: [EXTERNAL_POS_INTEGRATION_MODEL_VERSION],
        warnings: auth.warnings,
        cache: 'none',
      }, auth.statusCode);
    }
    const operation = operationFromPathOrBody(fallbackOperation, body);
    if (!operation) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Missing or unsupported POS API operation',
        data: {
          modelVersion: EXTERNAL_POS_INTEGRATION_MODEL_VERSION,
          supportedOperations: [
            'sale-link',
            'pickup-ready',
            'handoff-complete',
            'receipt-export',
            'customer-note',
            'refund-release',
          ],
        },
        confidence: 0,
        sources: [EXTERNAL_POS_INTEGRATION_MODEL_VERSION],
        warnings: [],
        cache: 'none',
      }, 400);
    }

    const run = await runExternalPosOperation({
      apis: registry.apis,
      requestedApiIds: arrayOrUndefined(body.posApiIds ?? body.apiIds) as string[] | undefined,
      operation,
      input: body,
      fetcher: connectorFetch,
      allowPlaintextToExternalPos: serverPolicyEnabled(process.env.AGID_EXTERNAL_POS_ALLOW_PLAINTEXT, false),
      allowRawResponseReturn: serverPolicyEnabled(process.env.AGID_EXTERNAL_POS_ALLOW_RAW_RESPONSE, false),
    });
    const ok = run.results.some((result) => result.ok);

    return sendAgidResult(req, res, {
      ok,
      data: {
        modelVersion: EXTERNAL_POS_INTEGRATION_MODEL_VERSION,
        operation,
        attempted: run.results.length,
        results: run.results,
        privacy: {
          serverAllowlistRequired: true,
          plaintextServerPolicy: serverPolicyEnabled(process.env.AGID_EXTERNAL_POS_ALLOW_PLAINTEXT, false),
          rawResponseServerPolicy: serverPolicyEnabled(process.env.AGID_EXTERNAL_POS_ALLOW_RAW_RESPONSE, false),
          rawAddressStoredByAgid: false,
          rawCustomerStoredByAgid: false,
          rawAgidStoredByAgid: false,
          rawQrPayloadStoredByAgid: false,
        },
      },
      confidence: ok ? 0.86 : 0.25,
      sources: run.sources.length ? run.sources : [EXTERNAL_POS_INTEGRATION_MODEL_VERSION],
      warnings: [...auth.warnings, ...run.warnings],
      cache: 'none',
      error: ok ? undefined : run.results[0]?.error ?? run.warnings[0] ?? 'No external POS API completed the requested operation',
    }, ok ? 200 : 400);
  };

  app.post('/api/pos/external/request', handleOperation());
  app.post('/api/pos/external/sale-link', handleOperation('sale-link'));
  app.post('/api/pos/external/pickup-ready', handleOperation('pickup-ready'));
  app.post('/api/pos/external/handoff-complete', handleOperation('handoff-complete'));
  app.post('/api/pos/external/receipt-export', handleOperation('receipt-export'));
  app.post('/api/pos/external/customer-note', handleOperation('customer-note'));
  app.post('/api/pos/external/refund-release', handleOperation('refund-release'));
}
