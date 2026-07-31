import type { Express } from 'express';
import { parseAddressText } from '../../lib/addressIntelligence';
import { assessLocalLibpostalEndpoint } from '../../lib/libpostalGateway';
import { verifyAddressCandidate } from '../../lib/addressVerificationEngine';
import {
  ADDRESS_STANDARD_LIBRARY_RESOLUTION_VERSION,
  buildAddressStandardLibraryResolution,
} from '../../lib/addressStandardLibraryResolver';
import {
  EXTERNAL_ADDRESS_VALIDATION_APPS_VERSION,
  loadExternalAddressValidatorRuntimeConfig,
  normalizeExternalAddressValidatorManifest,
  publicExternalAddressValidatorProfile,
  runExternalAddressValidators,
} from '../../lib/externalAddressValidationApps';
import {
  getHybridPolicy,
  isHybridWorkflow,
  resolveHybridRuntime,
} from '../../lib/hybridArchitecture';
import { detectOpenSourceTranslationLanguage, normalizeTranslationLanguage } from '../../lib/openSourceTranslation';
import { AGID_OPENAPI_SPEC } from '../../lib/openApiSpec';
import { AGID_AOID_GOVERNANCE_MODEL_VERSION } from '../../lib/agidAoidGovernance';
import {
  buildCredentialIssuerTrustRegistrySnapshot,
  evaluateCredentialIssuerTrust,
  verifyAddressCredentialWithIssuerTrust,
} from '../../lib/credentialIssuerTrustRegistry';
import { createInMemoryZkProofBundleRegistry } from '../../lib/zkProofBundleRegistry';
import {
  verifyFreshnessProofRootAnchor,
} from '../../lib/revocationFreshnessRootAnchoring';
import {
  buildPolkadotChainCommitment,
  buildPolkadotExtrinsicPlan,
  listPolkadotIntegrationStages,
} from '../../lib/polkadotIntegration';
import {
  createInMemoryPolkadotAdapter,
  type CreateInMemoryPolkadotAdapterOptions,
} from '../../lib/polkadotAdapter';
import {
  createAmnResolutionEnvelope,
  createInMemoryAmnRegistry,
  stripPrivateAmnEnvelopeMaterial,
} from '../../lib/addressMorphismNetwork';
import {
  handleAgidMcpRequest,
  type AgidMcpToolCallResult,
} from '../../lib/mcpServer';
import { getNearestPostalCode, getPostalCodeDBStatus } from '../../services/PostalCodeDB';
import {
  getServerAddressFormat,
  getServerAddressFormatCoverage,
} from '../addressFormatFileLoader';
import { requestIdFor, sendAgidResult } from '../agidResult';
import { arrayOrUndefined, objectOrUndefined, type JsonRecord } from '../requestParsing';
import {
  deprecatedBodyFlags,
  requireConfiguredAdminToken,
  serverPolicyEnabled,
} from '../routeSecurity';
import { registerCloudDbRoutes } from './cloudDbRoutes';
import { registerCrossBorderAuxiliaryRoutes } from './crossBorderAuxiliaryRoutes';
import { registerTaxOpenSourceRoutes } from './taxOpenSourceRoutes';
import { createInMemoryEthereumRegistryOnlyStore } from '../../lib/ethereumRegistryOnlyMode';
import { createInMemoryAgidRegistryApiStore } from '../../lib/agidRegistryApi';
import { createConfiguredAgidRegistryApiStore } from '../hostedRegistryStore';
import { registerAgidRegistryRoutes } from './agidRegistryRoutes';
import { registerAddressConnectTerminalRoutes } from './addressConnectTerminalRoutes';
import { registerAddressElementRadarRoutes } from './addressElementRadarRoutes';
import { registerAddressIntentRoutes } from './addressIntentRoutes';
import { registerAddressQualityFeedbackRoutes } from './addressQualityFeedbackRoutes';
import { registerAddressResolutionSystemRoutes } from './addressResolutionSystemRoutes';
import { createConfiguredAddressResolutionLedgerStore } from '../addressResolutionLedgerStore';
import { registerDroneDeliveryEvidenceRoutes } from './droneDeliveryEvidenceRoutes';
import { registerExternalDeliveryApiRoutes } from './externalDeliveryApiRoutes';
import { registerExternalPosRoutes } from './externalPosRoutes';
import { registerEthereumRegistryOnlyModeRoutes } from './ethereumRegistryOnlyModeRoutes';
import { registerFullZkEthereumModeRoutes } from './fullZkEthereumModeRoutes';
import { registerManagedZkProofServerRoutes } from './managedZkProofServerRoutes';
import { registerMachineAgidAoidRoutes } from './machineAgidAoidRoutes';
import { registerOracleOperaRoutes } from './oracleOperaRoutes';
import { registerPosTerminalRoutes } from './posTerminalRoutes';
import { registerPrivateDeploymentRoutes } from './privateDeploymentRoutes';
import { registerRevocationFreshnessRoutes } from './revocationFreshnessRoutes';
import { registerWarehouseLockerSimulatorRoutes } from './warehouseLockerSimulatorRoutes';
import { registerZkOnlyModeRoutes } from './zkOnlyModeRoutes';
import { registerZkProofBundleRoutes } from './zkProofBundleRoutes';

type SafeFetch = (url: string, options?: RequestInit, timeoutMs?: number, retries?: number) => Promise<Response>;

type QualityStats = Record<string, unknown>;
type ContinentQuality = Record<string, { score: number; lastChecked: number; issues: string[] }>;

export type CoreRouteDependencies = {
  publicCachedGetFetch: SafeFetch;
  connectorFetchNoCache: SafeFetch;
  qualityStats: QualityStats;
  continentQuality: ContinentQuality;
};

function trustRegistryFromBody(body: JsonRecord) {
  return body.trustRegistry ?? body.snapshot ?? body.registry;
}

function issuerTrustEvaluationOptions(body: JsonRecord) {
  return {
    now: body.now as string | undefined,
    credentialType: body.credentialType as string | undefined,
    requiredLayer: body.requiredLayer as 'AGID' | 'AOID' | undefined,
    requiredCountryCode: body.requiredCountryCode as string | null | undefined,
    requiredSchemaHash: body.requiredSchemaHash as string | null | undefined,
    minimumTrustScore: typeof body.minimumTrustScore === 'number' ? body.minimumTrustScore : undefined,
    allowedIssuerStatuses: arrayOrUndefined(body.allowedIssuerStatuses) as any,
    trustedRegistryRoots: arrayOrUndefined(body.trustedRegistryRoots) as string[] | undefined,
    maxRegistryAgeSeconds: typeof body.maxRegistryAgeSeconds === 'number' ? body.maxRegistryAgeSeconds : undefined,
  };
}

function credentialVerificationOptions(body: JsonRecord) {
  return {
    now: body.now as string | undefined,
    expectedLayer: body.expectedLayer as 'AGID' | 'AOID' | undefined,
    minimumCredentialScore: typeof body.minimumCredentialScore === 'number'
      ? body.minimumCredentialScore
      : undefined,
    allowedCredentialStatuses: arrayOrUndefined(body.allowedCredentialStatuses) as any,
    requiredCountryCode: body.requiredCountryCode as string | null | undefined,
    requiredSchemaHash: body.requiredSchemaHash as string | null | undefined,
    minimumTrustScore: typeof body.minimumTrustScore === 'number' ? body.minimumTrustScore : undefined,
    allowedIssuerStatuses: arrayOrUndefined(body.allowedIssuerStatuses) as any,
    trustedRegistryRoots: arrayOrUndefined(body.trustedRegistryRoots) as string[] | undefined,
    maxRegistryAgeSeconds: typeof body.maxRegistryAgeSeconds === 'number' ? body.maxRegistryAgeSeconds : undefined,
  };
}

function normalizeVerifyCountryCandidate(body: JsonRecord) {
  const address = objectOrUndefined(body.address) as JsonRecord | undefined;
  const targetCountries = arrayOrUndefined(body.targetCountries) as string[] | undefined;
  return String(
    body.countryCode ??
    address?.country_code ??
    address?.countryCode ??
    (targetCountries?.length === 1 ? targetCountries[0] : '') ??
    '',
  );
}

function stringFromUnknown(value: unknown) {
  if (Array.isArray(value)) return stringFromUnknown(value[0]);
  const text = typeof value === 'string' ? value.trim() : '';
  return text || undefined;
}

function booleanFromUnknown(value: unknown) {
  if (Array.isArray(value)) return booleanFromUnknown(value[0]);
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value !== 'string') return false;
  return /^(1|true|yes|y|on)$/i.test(value.trim());
}

function getLocalLibpostalSidecarConfig() {
  const endpoint = process.env.AGID_LIBPOSTAL_LOCAL_URL?.trim()
    || process.env.LIBPOSTAL_PARSE_URL?.trim()
    || '';
  const endpointPolicy = assessLocalLibpostalEndpoint(endpoint || undefined);
  const enabled = serverPolicyEnabled(process.env.AGID_LIBPOSTAL_LOCAL_ENABLED, false)
    || serverPolicyEnabled(process.env.AGID_LIBPOSTAL_ALLOW_PLAINTEXT, false);

  return {
    endpoint,
    endpointPolicy,
    enabled,
    configured: enabled && endpointPolicy.status === 'ready',
  };
}

function standardLibraryResolutionInputFromBody(body: JsonRecord) {
  const address = objectOrUndefined(body.address) as JsonRecord | undefined;
  const standardLibrary = objectOrUndefined(body.standardLibrary) as JsonRecord | undefined;
  return {
    ...(standardLibrary || {}),
    countryCode: body.countryCode as string | undefined,
    targetCountries: Array.isArray(body.targetCountries) ? body.targetCountries as string[] : undefined,
    hasPostcode: Boolean(body.hasPostcode || body.postalCode || body.postcode || address?.postcode),
    hasCoordinates: Boolean(
      body.hasCoordinates ||
      body.lat ||
      body.lon ||
      body.latitude ||
      body.longitude ||
      address?.lat ||
      address?.lon ||
      address?.latitude ||
      address?.longitude
    ),
    addressText: body.addressText as string | undefined,
    sourceLanguage: body.sourceLanguage as string | undefined,
    targetLanguage: body.targetLanguage as string | undefined,
    hasCustomTranslator: Boolean(body.hasCustomTranslator),
    needsNaturalGeographyContext: Boolean(body.needsNaturalGeographyContext),
    sparseOrRemoteArea: Boolean(body.sparseOrRemoteArea),
    allowCredentialedSources: Boolean(body.allowCredentialedSources),
    includeGlobalFallbacks: Boolean(body.includeGlobalFallbacks),
    libpostalEndpointConfigured: getLocalLibpostalSidecarConfig().configured,
  };
}

function standardLibraryResolutionInputFromQuery(query: Record<string, unknown>) {
  return {
    countryCode: stringFromUnknown(query.countryCode) || stringFromUnknown(query.cc),
    targetCountries: stringFromUnknown(query.targetCountries)
      ?.split(',')
      .map(value => value.trim())
      .filter(Boolean),
    hasPostcode: booleanFromUnknown(query.hasPostcode) || booleanFromUnknown(query.postcode),
    hasCoordinates: booleanFromUnknown(query.hasCoordinates) || booleanFromUnknown(query.coordinates),
    sourceLanguage: stringFromUnknown(query.sourceLanguage) || stringFromUnknown(query.source_language),
    targetLanguage: stringFromUnknown(query.targetLanguage) || stringFromUnknown(query.target_language),
    hasCustomTranslator: booleanFromUnknown(query.hasCustomTranslator),
    needsNaturalGeographyContext: booleanFromUnknown(query.needsNaturalGeographyContext) || booleanFromUnknown(query.natural),
    sparseOrRemoteArea: booleanFromUnknown(query.sparseOrRemoteArea) || booleanFromUnknown(query.remote),
    allowCredentialedSources: booleanFromUnknown(query.allowCredentialedSources),
    includeGlobalFallbacks: booleanFromUnknown(query.includeGlobalFallbacks),
    libpostalEndpointConfigured: getLocalLibpostalSidecarConfig().configured,
  };
}

function readServerManagedIssuerSecrets() {
  const raw = process.env.AGID_CREDENTIAL_ISSUER_SECRETS_JSON;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0)
    );
  } catch {
    return {};
  }
}

function polkadotAdapterOptionsFrom(value: unknown): CreateInMemoryPolkadotAdapterOptions {
  const input = objectOrUndefined(value) ?? {};
  return {
    networkId: typeof input.networkId === 'string' ? input.networkId : undefined,
    relayChain: input.relayChain as CreateInMemoryPolkadotAdapterOptions['relayChain'],
    parachainId: typeof input.parachainId === 'number' ? input.parachainId : undefined,
    genesisHash: typeof input.genesisHash === 'string' ? input.genesisHash : undefined,
    finalityDepth: typeof input.finalityDepth === 'number' ? input.finalityDepth : undefined,
    initialBlockNumber: typeof input.initialBlockNumber === 'number' ? input.initialBlockNumber : undefined,
    finalizedBlockNumber: typeof input.finalizedBlockNumber === 'number' ? input.finalizedBlockNumber : undefined,
  };
}

export function registerCoreApiRoutes(
  app: Express,
  { publicCachedGetFetch, connectorFetchNoCache, qualityStats, continentQuality }: CoreRouteDependencies,
) {
  const zkProofBundleRegistry = createInMemoryZkProofBundleRegistry();
  const ethereumRegistryStore = createInMemoryEthereumRegistryOnlyStore();
  const agidRegistryStore = createInMemoryAgidRegistryApiStore();
  const hostedAgidRegistryStore = createConfiguredAgidRegistryApiStore({
    defaultStorageMode: 'file',
  });
  const addressResolutionLedgerStore = createConfiguredAddressResolutionLedgerStore();
  const amnRegistry = createInMemoryAmnRegistry();
  const externalAddressValidatorRegistry = loadExternalAddressValidatorRuntimeConfig();
  const polkadotAdaptersByNetworkId = new Map<string, ReturnType<typeof createInMemoryPolkadotAdapter>>();
  const getPolkadotAdapter = (options: CreateInMemoryPolkadotAdapterOptions = {}) => {
    const networkId = options.networkId ?? 'local-mock';
    const existing = polkadotAdaptersByNetworkId.get(networkId);
    if (existing) return existing;
    const adapter = createInMemoryPolkadotAdapter({ ...options, networkId });
    polkadotAdaptersByNetworkId.set(networkId, adapter);
    return adapter;
  };

  const mcpToolHandler = async (name: string, args: JsonRecord): Promise<AgidMcpToolCallResult> => {
    switch (name) {
      case 'agid.health':
        return {
          text: 'AGID MCP server is ready.',
          structuredContent: {
            ok: true,
            data: {
              rest: true,
              mcp: true,
              openApiPath: '/api/v1/openapi.json',
              toolSurface: 'public-proofs-commitments-and-registry-roots-only',
            },
            confidence: 1,
            sources: ['agid-server'],
            warnings: [],
            cache: 'none',
          },
        };

      case 'agid.zk.proof_bundle.register': {
        const result = zkProofBundleRegistry.registerBundle({
          proofs: arrayOrUndefined(args.proofs) ?? [],
          scope: args.scope as string | undefined,
          audience: args.audience as string | undefined,
          operationId: args.operationId as string | undefined,
          expectedChallengeHash: args.expectedChallengeHash as string | undefined,
          expectedChallengeHashesByVersion: objectOrUndefined(args.expectedChallengeHashesByVersion) as Record<string, string> | undefined,
          now: args.now as string | undefined,
          metadata: objectOrUndefined(args.metadata) as any,
        });
        const ok = result.status !== 'rejected';
        return {
          isError: !ok,
          text: ok
            ? `Registered public ZK proof bundle ${result.bundleId ?? 'without bundle id'}.`
            : 'ZK proof bundle registration failed.',
          structuredContent: {
            ok,
            data: result,
            error: ok ? undefined : result.errors[0] ?? 'ZK proof bundle registration failed',
            confidence: ok ? 1 : 0.2,
            sources: ['agid-zk-proof-bundle-registry'],
            warnings: result.warnings,
            cache: 'none',
          },
        };
      }

      case 'agid.zk.proof_bundle.verify': {
        const bundleId = typeof args.bundleId === 'string' ? args.bundleId : '';
        if (!bundleId) {
          return {
            isError: true,
            text: 'Missing ZK proof bundle id.',
            structuredContent: {
              ok: false,
              error: 'missing-bundle-id',
              sources: ['agid-zk-proof-bundle-registry'],
              warnings: ['bundleId is required'],
              cache: 'none',
            },
          };
        }

        const verification = zkProofBundleRegistry.verifyBundle(bundleId, {
          now: args.now as string | undefined,
        });
        return {
          isError: !verification.valid,
          text: verification.valid
            ? `ZK proof bundle ${bundleId} is valid.`
            : `ZK proof bundle ${bundleId} is not valid.`,
          structuredContent: {
            ok: verification.valid,
            data: verification,
            error: verification.valid ? undefined : verification.errors[0] ?? 'ZK proof bundle verification failed',
            confidence: verification.valid ? 1 : 0.15,
            sources: ['agid-zk-proof-bundle-registry'],
            warnings: verification.warnings,
            cache: 'none',
          },
        };
      }

      case 'agid.zk.proof_bundle.stats': {
        const stats = zkProofBundleRegistry.getStats();
        return {
          text: 'Returned public ZK proof bundle registry statistics.',
          structuredContent: {
            ok: true,
            data: stats,
            confidence: 1,
            sources: ['agid-zk-proof-bundle-registry'],
            warnings: [],
            cache: 'none',
          },
        };
      }

      case 'agid.revocation_freshness.verify': {
        const envelope = objectOrUndefined(args.envelope) ?? objectOrUndefined(args.proof);
        const anchor = objectOrUndefined(args.anchor);
        if (!envelope || !anchor) {
          return {
            isError: true,
            text: 'Missing freshness proof envelope or anchor.',
            structuredContent: {
              ok: false,
              error: 'missing-freshness-proof-or-anchor',
              sources: ['agid-revocation-freshness-root-anchor'],
              warnings: ['envelope/proof and anchor are required'],
              cache: 'none',
            },
          };
        }

        const verification = verifyFreshnessProofRootAnchor(envelope as any, anchor as any, {
          now: args.now as string | undefined,
        });
        return {
          isError: !verification.valid,
          text: verification.valid
            ? 'Freshness proof matches the supplied public anchor.'
            : 'Freshness proof does not match the supplied public anchor.',
          structuredContent: {
            ok: verification.valid,
            data: verification,
            error: verification.valid ? undefined : verification.errors[0] ?? 'Freshness proof does not match anchor',
            confidence: verification.valid ? 1 : 0.2,
            sources: ['agid-revocation-freshness-root-anchor'],
            warnings: verification.warnings,
            cache: 'none',
          },
        };
      }

      case 'agid.credential_issuer.trust.evaluate': {
        const credential = args.credential;
        const trustRegistry = trustRegistryFromBody(args);
        if (!credential || !trustRegistry) {
          return {
            isError: true,
            text: 'Missing credential or public trust registry snapshot.',
            structuredContent: {
              ok: false,
              error: 'missing-credential-or-trust-registry',
              sources: ['agid-credential-issuer-trust-registry'],
              warnings: ['credential and trustRegistry are required'],
              cache: 'none',
            },
          };
        }

        const evaluation = evaluateCredentialIssuerTrust(credential as any, trustRegistry as any, issuerTrustEvaluationOptions(args));
        return {
          isError: !evaluation.trusted,
          text: evaluation.trusted
            ? 'Credential issuer is trusted for the requested public scope.'
            : 'Credential issuer is not trusted for the requested public scope.',
          structuredContent: {
            ok: evaluation.trusted,
            data: evaluation,
            error: evaluation.trusted ? undefined : evaluation.errors[0] ?? 'Credential issuer is not trusted',
            confidence: evaluation.trusted ? 1 : 0.25,
            sources: ['agid-credential-issuer-trust-registry'],
            warnings: evaluation.warnings,
            cache: 'none',
          },
        };
      }

      case 'agid.polkadot.stages': {
        const stages = listPolkadotIntegrationStages();
        return {
          text: 'Returned ordered AGID Polkadot integration stages.',
          structuredContent: {
            ok: true,
            data: stages,
            confidence: 1,
            sources: ['agid-polkadot-integration-plan'],
            warnings: [],
            cache: 'none',
          },
        };
      }

      default:
        return {
          isError: true,
          text: 'Unknown AGID MCP tool.',
          structuredContent: {
            ok: false,
            error: 'unknown-mcp-tool',
            sources: ['agid-mcp-server'],
            warnings: [],
            cache: 'none',
          },
        };
    }
  };

  app.get('/api/openapi.json', (_req, res) => {
    res.json(AGID_OPENAPI_SPEC);
  });

  app.post('/api/mcp', async (req, res) => {
    const response = await handleAgidMcpRequest(req.body, mcpToolHandler);
    res.status(response.httpStatus).json(response.body);
  });

  app.get('/api/health', (_req, res) => {
    console.log('[API] Health check');
    res.json({ status: 'ok' });
  });

  app.get('/api/communication/health', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: {
        rest: true,
        sse: true,
        localFirstSync: true,
        externalApiProxy: true,
        registrationAudit: true,
        aoidEncryptedSync: true,
        governanceModel: AGID_AOID_GOVERNANCE_MODEL_VERSION,
      },
      confidence: 1,
      sources: ['agid-server'],
      warnings: [],
      cache: 'none',
    });
  });

  registerOracleOperaRoutes(app, { fetcher: connectorFetchNoCache });
  registerCloudDbRoutes(app);

  app.post('/api/hybrid/quality', (req, res) => {
    const workflow = req.body?.workflow;
    if (!isHybridWorkflow(workflow)) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Unsupported hybrid workflow',
        sources: ['agid-central-quality'],
        warnings: ['workflow must be one of the AGID hybrid workflow ids'],
        cache: 'none',
      }, 400);
    }

    const confidence = Number(req.body?.centralConfidence);
    const centralConfidence = Number.isFinite(confidence)
      ? Math.max(0, Math.min(1, confidence))
      : undefined;
    const decision = resolveHybridRuntime({
      workflow,
      online: true,
      centralConfidence,
      hasLocalRecord: req.body?.hasLocalRecord === true,
      hasOpenDataPack: req.body?.hasOpenDataPack === true,
      userOptedInToSync: req.body?.userOptedInToSync === true,
    });
    const responseConfidence = {
      verified: Math.max(0.9, centralConfidence ?? 0.9),
      partial: Math.max(0.62, centralConfidence ?? 0.62),
      local: Math.max(0.42, centralConfidence ?? 0.42),
    }[decision.qualityTier];

    sendAgidResult(req, res, {
      ok: true,
      data: {
        decision,
        policy: getHybridPolicy(workflow),
      },
      confidence: responseConfidence,
      sources: ['agid-central-quality', 'hybrid-policy'],
      warnings: decision.privacyScope === 'private-record' && req.body?.userOptedInToSync !== true
        ? ['Private address sync is local-first unless the user explicitly opts in.']
        : [],
      cache: 'none',
    });
  });

  app.get('/api/jobs/:jobId/events', (req, res) => {
    const requestId = requestIdFor(req);
    const jobId = String(req.params.jobId || '').slice(0, 80);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-AGID-Request-ID': requestId,
    });

    const writeEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify({ requestId, jobId, ...(data as object) })}\n\n`);
    };

    writeEvent('ready', {
      ok: true,
      sources: ['agid-server'],
      warnings: [],
      message: 'AGID job event stream is ready.',
    });

    const heartbeat = setInterval(() => {
      writeEvent('heartbeat', { ok: true, timestamp: Date.now() });
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      res.end();
    });
  });

  app.post('/api/address/parse', async (req, res) => {
    const localSidecar = getLocalLibpostalSidecarConfig();
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    const countryCode = typeof req.body?.countryCode === 'string' ? req.body.countryCode : '';

    if (!text.trim()) {
      return res.status(400).json({ error: 'Missing address text' });
    }

    if (!localSidecar.configured) {
      const canonical = parseAddressText(text);
      if (countryCode && !canonical.country_code) canonical.country_code = countryCode.toLowerCase();
      return res.json({
        source: 'local-parser',
        available: false,
        canonical,
        components: Object.entries(canonical).map(([label, value]) => ({ label, value: String(value) })),
        warnings: localSidecar.endpointPolicy.status === 'blocked'
          ? ['libpostal parsing is blocked unless the endpoint is an absolute loopback HTTP URL without credentials.']
          : localSidecar.endpoint && !localSidecar.enabled
            ? ['local libpostal parsing is disabled; set AGID_LIBPOSTAL_LOCAL_ENABLED=true for an approved loopback sidecar.']
            : [],
      });
    }

    try {
      const response = await connectorFetchNoCache(localSidecar.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, countryCode }),
      }, 15000, 0);
      if (!response.ok) {
        const canonical = parseAddressText(text);
        if (countryCode && !canonical.country_code) canonical.country_code = countryCode.toLowerCase();
        return res.json({
          source: 'local-parser',
          available: false,
          canonical,
          components: Object.entries(canonical).map(([label, value]) => ({ label, value: String(value) })),
          warnings: ['local libpostal sidecar is unavailable; the built-in parser was used.'],
        });
      }
      const data = await response.json();
      res.json({
        source: 'libpostal',
        available: true,
        components: Array.isArray(data.components) ? data.components : data,
      });
    } catch {
      const canonical = parseAddressText(text);
      if (countryCode && !canonical.country_code) canonical.country_code = countryCode.toLowerCase();
      res.json({
        source: 'local-parser',
        available: false,
        canonical,
        components: Object.entries(canonical).map(([label, value]) => ({ label, value: String(value) })),
        warnings: ['local libpostal sidecar is unavailable; the built-in parser was used.'],
      });
    }
  });

  app.get('/api/address/verify/capabilities', (req, res) => {
    const coverage = getServerAddressFormatCoverage();
    const standardLibrary = buildAddressStandardLibraryResolution(
      standardLibraryResolutionInputFromQuery(req.query as Record<string, unknown>),
    );
    sendAgidResult(req, res, {
      ok: true,
      data: {
        modelVersion: 'address-verification-capabilities-v1',
        engine: 'AGID open-source address verification engine',
        freeOnly: true,
        standardLibraryModelVersion: ADDRESS_STANDARD_LIBRARY_RESOLUTION_VERSION,
        standardLibrary,
        addressFormatCountries: coverage.countryCodes.length,
        addressFormatFiles: coverage.fileCount,
        sourceStrategy: [
          'local-country-format-rules',
          'credential-free-official-postal-sources-when-available',
          'open-address-reference-records',
          'open-geodata-and-natural-feature-context',
          'manual-review-for-proprietary-delivery-point-gaps',
        ],
        nonGoals: [
          'Do not claim proprietary delivery-point parity where no free authoritative source exists.',
          'Do not store plaintext addresses as a condition of validation.',
        ],
      },
      confidence: 1,
      sources: ['src/data/address_formats', 'src/lib/addressVerificationEngine.ts', 'src/lib/addressStandardLibraryResolver.ts'],
      warnings: standardLibrary.warnings,
      cache: 'hit',
    });
  });

  app.get('/api/address/standard-library/capabilities', (req, res) => {
    const result = buildAddressStandardLibraryResolution(
      standardLibraryResolutionInputFromQuery(req.query as Record<string, unknown>),
    );
    sendAgidResult(req, res, {
      ok: true,
      data: result,
      confidence: result.requiresNetworkForStrongVerification ? 0.86 : 1,
      sources: [result.modelVersion, 'src/lib/addressDataLoadPlan.ts', 'src/lib/openSourceAddressResolutionStrategy.ts'],
      warnings: result.warnings,
      cache: 'none',
    });
  });

  app.post('/api/address/standard-library/resolve', (req, res) => {
    const body = (req.body ?? {}) as JsonRecord;
    const result = buildAddressStandardLibraryResolution(standardLibraryResolutionInputFromBody(body));
    sendAgidResult(req, res, {
      ok: true,
      data: result,
      confidence: result.requiresNetworkForStrongVerification ? 0.86 : 1,
      sources: [result.modelVersion, 'src/lib/addressDataLoadPlan.ts', 'src/lib/openSourceAddressResolutionStrategy.ts'],
      warnings: result.warnings,
      cache: 'none',
    });
  });

  app.get('/api/address/external-validators/capabilities', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: {
        modelVersion: EXTERNAL_ADDRESS_VALIDATION_APPS_VERSION,
        serverConfigured: externalAddressValidatorRegistry.validators.length > 0,
        validators: externalAddressValidatorRegistry.validators.map(publicExternalAddressValidatorProfile),
        importContract: {
          runtimeUrlsAcceptedFromClient: false,
          secretsAcceptedFromClient: false,
          addressPayloadsAcceptedInManifest: false,
          executionRequiresServerAllowlist: true,
          runtimeConfigEnv: 'AGID_EXTERNAL_ADDRESS_VALIDATORS_JSON',
        },
        modes: [
          'metadata-import-only',
          'server-allowlisted-execution',
          'redacted-request-by-default',
          'plaintext-external-validation-requires-explicit-opt-in',
        ],
      },
      confidence: 1,
      sources: [EXTERNAL_ADDRESS_VALIDATION_APPS_VERSION],
      warnings: [
        ...externalAddressValidatorRegistry.errors,
        ...externalAddressValidatorRegistry.warnings,
      ],
      cache: 'none',
    });
  });

  app.post('/api/address/external-validators/import', (req, res) => {
    const body = (req.body ?? {}) as JsonRecord;
    const validation = normalizeExternalAddressValidatorManifest(body.manifest ?? body);
    sendAgidResult(req, res, {
      ok: validation.accepted,
      data: {
        modelVersion: EXTERNAL_ADDRESS_VALIDATION_APPS_VERSION,
        accepted: validation.accepted,
        manifest: validation.manifest,
        execution: {
          enabled: false,
          reason: 'Imported manifests are metadata only until a matching server-side runtime config is allowlisted.',
        },
        errors: validation.errors,
      },
      confidence: validation.accepted ? 1 : 0.2,
      sources: [EXTERNAL_ADDRESS_VALIDATION_APPS_VERSION],
      warnings: validation.warnings,
      cache: 'none',
      error: validation.accepted ? undefined : validation.errors[0] ?? 'External validator manifest was rejected',
    }, validation.accepted ? 200 : 400);
  });

  app.post('/api/address/verify/external', async (req, res) => {
    const body = (req.body ?? {}) as JsonRecord;
    const deprecated = deprecatedBodyFlags(body, ['allowPlaintextToExternalValidators']);
    if (deprecated.length) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Deprecated plaintext flags are not accepted in the request body.',
        sources: [EXTERNAL_ADDRESS_VALIDATION_APPS_VERSION],
        warnings: deprecated.map(flag => `${flag} is now a server-side policy`),
        cache: 'none',
      }, 400);
    }
    const auth = requireConfiguredAdminToken(req, {
      expectedToken: process.env.AGID_EXTERNAL_VALIDATOR_CONNECTOR_TOKEN?.trim() ?? '',
      headerName: 'X-AGID-External-Validator-Token',
      missingError: 'External address validator connector token is not configured.',
      invalidError: 'External address validation requires X-AGID-External-Validator-Token.',
      missingWarning: 'set AGID_EXTERNAL_VALIDATOR_CONNECTOR_TOKEN before enabling external validation execution',
    });
    if (auth.ok === false) {
      return sendAgidResult(req, res, {
        ok: false,
        error: auth.error,
        sources: [EXTERNAL_ADDRESS_VALIDATION_APPS_VERSION],
        warnings: auth.warnings,
        cache: 'none',
      }, auth.statusCode);
    }
    const suppliedFormat = objectOrUndefined(body.format);
    const serverFormat = suppliedFormat ? null : getServerAddressFormat(normalizeVerifyCountryCandidate(body));
    const requestSources = Array.isArray(body.sources) ? body.sources : [];
    const serverFormatSources = serverFormat
      ? ['server-address-format-pack', `address-format:${serverFormat.countryCode}`]
      : [];
    const external = await runExternalAddressValidators({
      validators: externalAddressValidatorRegistry.validators,
      requestedValidatorIds: arrayOrUndefined(body.externalValidatorIds) as string[] | undefined,
      input: body,
      fetcher: connectorFetchNoCache,
      allowPlaintextToExternalValidators: serverPolicyEnabled(process.env.AGID_EXTERNAL_VALIDATOR_ALLOW_PLAINTEXT, false),
    });
    const result = verifyAddressCandidate({
      countryCode: body.countryCode as string | undefined,
      targetCountries: Array.isArray(body.targetCountries) ? body.targetCountries : undefined,
      address: body.address as any,
      addressText: body.addressText as string | undefined,
      postalCode: body.postalCode ?? body.postcode as any,
      scope: body.scope as any,
      format: (suppliedFormat || serverFormat || undefined) as any,
      countryPolicies: body.countryPolicies as any,
      postalEvidence: [
        ...(Array.isArray(body.postalEvidence) ? body.postalEvidence as any[] : []),
        ...external.postalEvidence,
      ],
      referenceRecords: [
        ...(Array.isArray(body.referenceRecords) ? body.referenceRecords as any[] : []),
        ...external.referenceRecords,
      ],
      sources: [...requestSources, ...serverFormatSources, ...external.sources],
      allowFallbackCountryFromAddress: body.allowFallbackCountryFromAddress as any,
      dataLoad: objectOrUndefined(body.dataLoad) as any,
      standardLibrary: {
        ...standardLibraryResolutionInputFromBody(body),
        libpostalEndpointConfigured: getLocalLibpostalSidecarConfig().configured,
      } as any,
    });

    sendAgidResult(req, res, {
      ok: result.status === 'verified' || result.status === 'partial',
      data: {
        verification: result,
        external: {
          modelVersion: EXTERNAL_ADDRESS_VALIDATION_APPS_VERSION,
          attempted: external.results.length,
          validators: external.results.map((item) => ({
            validatorId: item.validatorId,
            ok: item.ok,
            status: item.status,
            confidence: item.confidence,
            postalEvidenceCount: item.postalEvidence.length,
            referenceRecordCount: item.referenceRecords.length,
            sources: item.sources,
            warnings: item.warnings,
            error: item.error,
          })),
        },
      },
      confidence: result.score,
      sources: result.sources,
      warnings: [...auth.warnings, ...result.warnings, ...external.warnings],
      cache: 'none',
      error: result.status === 'country_mismatch'
        ? 'Address country is outside the selected target countries'
        : result.status === 'unsupported_country'
          ? 'Target country is not enabled for address verification'
          : result.status === 'unresolved'
            ? 'Address could not be verified from the supplied country and postal evidence'
            : undefined,
    }, result.status === 'country_mismatch' ? 409 : 200);
  });

  app.post('/api/address/verify', (req, res) => {
    const body = (req.body ?? {}) as JsonRecord;
    const suppliedFormat = objectOrUndefined(body.format);
    const serverFormat = suppliedFormat ? null : getServerAddressFormat(normalizeVerifyCountryCandidate(body));
    const requestSources = Array.isArray(body.sources) ? body.sources : [];
    const serverFormatSources = serverFormat
      ? ['server-address-format-pack', `address-format:${serverFormat.countryCode}`]
      : [];
    const result = verifyAddressCandidate({
      countryCode: body.countryCode as string | undefined,
      targetCountries: Array.isArray(body.targetCountries) ? body.targetCountries : undefined,
      address: body.address as any,
      addressText: body.addressText as string | undefined,
      postalCode: body.postalCode ?? body.postcode as any,
      scope: body.scope as any,
      format: (suppliedFormat || serverFormat || undefined) as any,
      countryPolicies: body.countryPolicies as any,
      postalEvidence: Array.isArray(body.postalEvidence) ? body.postalEvidence : undefined,
      referenceRecords: Array.isArray(body.referenceRecords) ? body.referenceRecords : undefined,
      sources: [...requestSources, ...serverFormatSources],
      allowFallbackCountryFromAddress: body.allowFallbackCountryFromAddress as any,
      dataLoad: objectOrUndefined(body.dataLoad) as any,
      standardLibrary: {
        ...standardLibraryResolutionInputFromBody(body),
        libpostalEndpointConfigured: getLocalLibpostalSidecarConfig().configured,
      } as any,
    });

    sendAgidResult(req, res, {
      ok: result.status === 'verified' || result.status === 'partial',
      data: result,
      confidence: result.score,
      sources: result.sources,
      warnings: result.warnings,
      cache: 'none',
      error: result.status === 'country_mismatch'
        ? 'Address country is outside the selected target countries'
        : result.status === 'unsupported_country'
          ? 'Target country is not enabled for address verification'
          : result.status === 'unresolved'
            ? 'Address could not be verified from the supplied country and postal evidence'
            : undefined,
    }, result.status === 'country_mismatch' ? 409 : 200);
  });

  app.post('/api/credential-issuers/trust-registry/snapshot', (req, res) => {
    const body = (req.body ?? {}) as JsonRecord;
    const snapshot = buildCredentialIssuerTrustRegistrySnapshot({
      registryId: String(body.registryId ?? body.registry_id ?? req.query.registry_id ?? ''),
      registryVersion: String(body.registryVersion ?? body.registry_version ?? req.query.registry_version ?? ''),
      issuers: arrayOrUndefined(body.issuers) as any ?? [],
      trustPolicy: body.trustPolicy as any,
      now: body.now as string | undefined,
    });

    sendAgidResult(req, res, {
      ok: snapshot.anchorable,
      data: snapshot,
      error: snapshot.anchorable ? undefined : snapshot.errors[0] ?? 'Credential issuer trust registry snapshot is not anchorable',
      confidence: snapshot.anchorable ? 1 : 0.3,
      sources: snapshot.sourceIds.length ? snapshot.sourceIds : ['agid-credential-issuer-trust-registry'],
      warnings: snapshot.warnings,
      cache: 'none',
    }, snapshot.anchorable ? 200 : 400);
  });

  app.post('/api/credential-issuers/trust-registry/evaluate', (req, res) => {
    const body = (req.body ?? {}) as JsonRecord;
    const credential = body.credential;
    const trustRegistry = trustRegistryFromBody(body);

    if (!credential || !trustRegistry) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Missing credential or trust registry snapshot',
        sources: ['agid-credential-issuer-trust-registry'],
        warnings: ['credential and trustRegistry are required'],
        cache: 'none',
      }, 400);
    }

    const evaluation = evaluateCredentialIssuerTrust(credential as any, trustRegistry as any, issuerTrustEvaluationOptions(body));

    sendAgidResult(req, res, {
      ok: evaluation.trusted,
      data: evaluation,
      error: evaluation.trusted ? undefined : evaluation.errors[0] ?? 'Credential issuer is not trusted',
      confidence: evaluation.trusted ? 1 : 0.25,
      sources: ['agid-credential-issuer-trust-registry'],
      warnings: evaluation.warnings,
      cache: 'none',
    }, evaluation.trusted ? 200 : 409);
  });

  app.post('/api/credential-issuers/trust-registry/verify-credential', async (req, res) => {
    const body = (req.body ?? {}) as JsonRecord;
    const credential = body.credential;
    const trustRegistry = trustRegistryFromBody(body);

    if (!credential || !trustRegistry) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Missing credential or trust registry snapshot',
        sources: ['agid-credential-issuer-trust-registry'],
        warnings: ['credential and trustRegistry are required'],
        cache: 'none',
      }, 400);
    }

    const issuerSecretsById = readServerManagedIssuerSecrets();
    if (Object.keys(issuerSecretsById).length === 0) {
      const trust = evaluateCredentialIssuerTrust(credential as any, trustRegistry as any, {
        ...issuerTrustEvaluationOptions(body),
        requiredLayer: (body.expectedLayer as 'AGID' | 'AOID' | undefined) ?? (body.requiredLayer as 'AGID' | 'AOID' | undefined),
      });
      const warnings = Array.from(new Set([
        ...trust.warnings,
        'server-managed-issuer-key-not-configured',
        'public-issuer-key-material-was-not-accepted',
      ]));
      return sendAgidResult(req, res, {
        ok: false,
        data: {
          modelVersion: trust.modelVersion,
          valid: false,
          trust,
          signatureVerification: {
            mode: 'server-managed',
            available: false,
          },
          errors: Array.from(new Set(['server-managed-issuer-key-not-configured', ...trust.errors])),
          warnings,
        },
        error: 'Server-managed issuer key is not configured for credential signature verification',
        confidence: 0,
        sources: ['agid-credential-issuer-trust-registry'],
        warnings,
        cache: 'none',
      }, 503);
    }

    const verification = await verifyAddressCredentialWithIssuerTrust(credential as any, trustRegistry as any, {
      ...credentialVerificationOptions(body),
      issuerSecretsById,
    });

    sendAgidResult(req, res, {
      ok: verification.valid,
      data: verification,
      error: verification.valid ? undefined : verification.errors[0] ?? 'Credential issuer trust verification failed',
      confidence: verification.valid ? 1 : 0.25,
      sources: ['agid-credential-issuer-trust-registry'],
      warnings: verification.warnings,
      cache: 'none',
    }, verification.valid ? 200 : 409);
  });

  registerZkProofBundleRoutes(app, zkProofBundleRegistry);
  registerAddressElementRadarRoutes(app);
  registerAddressIntentRoutes(app);
  registerAddressQualityFeedbackRoutes(app);
  registerAddressConnectTerminalRoutes(app);
  registerAgidRegistryRoutes(app, { store: agidRegistryStore });
  registerAgidRegistryRoutes(app, {
    store: hostedAgidRegistryStore,
    basePath: '/api/registry/hosted',
    sourceId: 'agid-hosted-registry-api',
  });
  registerAddressResolutionSystemRoutes(app, {
    registryStore: hostedAgidRegistryStore,
    ledgerStore: addressResolutionLedgerStore,
  });
  registerCrossBorderAuxiliaryRoutes(app);
  registerTaxOpenSourceRoutes(app);
  registerExternalDeliveryApiRoutes(app, { connectorFetch: connectorFetchNoCache });
  registerExternalPosRoutes(app, { connectorFetch: connectorFetchNoCache });
  registerZkOnlyModeRoutes(app);
  registerManagedZkProofServerRoutes(app);
  registerPrivateDeploymentRoutes(app);
  registerEthereumRegistryOnlyModeRoutes(app, { store: ethereumRegistryStore });
  registerFullZkEthereumModeRoutes(app, { store: ethereumRegistryStore });
  registerRevocationFreshnessRoutes(app);
  registerPosTerminalRoutes(app);
  registerDroneDeliveryEvidenceRoutes(app);
  registerWarehouseLockerSimulatorRoutes(app);
  registerMachineAgidAoidRoutes(app);

  app.post('/api/amn/resolve', (req, res) => {
    const body = (req.body ?? {}) as JsonRecord;

    try {
      const envelope = createAmnResolutionEnvelope({
        inputAddress: String(body.inputAddress ?? ''),
        candidates: (arrayOrUndefined(body.candidates) as any[] | undefined) ?? [],
        context: objectOrUndefined(body.context) as any,
        policy: objectOrUndefined(body.policy) as any,
        evidence: arrayOrUndefined(body.evidence) as any[] | undefined,
        historyUpdate: objectOrUndefined(body.historyUpdate) as any,
        proofBundleId: body.proofBundleId as string | undefined,
        issuedAt: body.issuedAt as string | undefined,
        expiresAt: body.expiresAt as string | undefined,
      });
      const publicEnvelope = stripPrivateAmnEnvelopeMaterial(envelope);
      const registration = amnRegistry.registerEnvelope(publicEnvelope);
      const ok = registration.status !== 'rejected';

      return sendAgidResult(req, res, {
        ok,
        data: {
          envelope: publicEnvelope,
          registration,
        },
        error: ok ? undefined : registration.errors[0] ?? 'AMN resolution envelope registration failed',
        confidence: ok ? publicEnvelope.claim.resolution.confidence : 0.2,
        sources: ['address-morphism-network', 'address-morphism-theory'],
        warnings: registration.warnings,
        cache: 'none',
      }, ok ? 200 : 400);
    } catch {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'AMN resolution envelope could not be created',
        sources: ['address-morphism-network'],
        warnings: ['inputAddress and at least one public candidate are required'],
        cache: 'none',
      }, 400);
    }
  });

  app.post('/api/amn/registry/:envelopeId/verify', (req, res) => {
    const verification = amnRegistry.verifyEnvelope(req.params.envelopeId);
    const statusCode = verification.errors.includes('envelope-not-registered')
      ? 404
      : verification.valid
        ? 200
        : 409;

    sendAgidResult(req, res, {
      ok: verification.valid,
      data: verification,
      error: verification.valid ? undefined : verification.errors[0] ?? 'AMN envelope verification failed',
      confidence: verification.valid ? 1 : 0.15,
      sources: ['address-morphism-network'],
      warnings: verification.warnings,
      cache: 'none',
    }, statusCode);
  });

  app.get('/api/amn/registry/stats', (req, res) => {
    sendAgidResult(req, res, {
      ok: true,
      data: amnRegistry.getStats(),
      confidence: 1,
      sources: ['address-morphism-network'],
      warnings: [],
      cache: 'none',
    });
  });

  app.get('/api/polkadot/stages', (req, res) => {
    const stages = listPolkadotIntegrationStages();
    sendAgidResult(req, res, {
      ok: true,
      data: stages,
      confidence: 1,
      sources: ['agid-polkadot-integration-plan'],
      warnings: [],
      cache: 'none',
    });
  });

  app.post('/api/polkadot/commitment', (req, res) => {
    const body = (req.body ?? {}) as JsonRecord;
    let commitment;
    let extrinsicPlan;
    try {
      commitment = buildPolkadotChainCommitment({
        stageId: body.stageId as any,
        entityType: body.entityType as any,
        entityId: String(body.entityId ?? ''),
        publicPayload: objectOrUndefined(body.publicPayload) ?? {},
        salt: body.salt as string | undefined,
      });
      extrinsicPlan = buildPolkadotExtrinsicPlan({
        stageId: commitment.stageId,
        commitment,
      });
    } catch (error) {
      return sendAgidResult(req, res, {
        ok: false,
        error: error instanceof Error ? error.message : 'Polkadot commitment could not be built',
        sources: ['agid-polkadot-integration-plan'],
        warnings: ['stageId and entityType must match the AGID Polkadot integration model'],
        cache: 'none',
      }, 400);
    }
    const ok = commitment.publishable && commitment.forbiddenFields.length === 0;

    sendAgidResult(req, res, {
      ok,
      data: { commitment, extrinsicPlan },
      error: ok ? undefined : commitment.forbiddenFields[0] ?? 'Polkadot commitment contains forbidden public payload fields',
      confidence: ok ? 1 : 0.2,
      sources: ['agid-polkadot-integration-plan'],
      warnings: Array.from(new Set([...commitment.warnings, ...extrinsicPlan.warnings])),
      cache: 'none',
    }, ok ? 200 : 400);
  });

  app.post('/api/polkadot/anchor', async (req, res) => {
    const body = (req.body ?? {}) as JsonRecord;
    const commitment = objectOrUndefined(body.commitment);
    if (!commitment) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Missing Polkadot commitment',
        sources: ['agid-polkadot-adapter'],
        warnings: ['commitment is required'],
        cache: 'none',
      }, 400);
    }

    const adapterOptions = polkadotAdapterOptionsFrom(body.adapterOptions);
    const adapter = getPolkadotAdapter(adapterOptions);
    const result = await adapter.anchorCommitment(commitment as any, {
      observedAt: body.observedAt as string | undefined,
    });

    sendAgidResult(req, res, {
      ok: result.status === 'anchored' || result.status === 'already_anchored',
      data: result,
      error: result.status === 'rejected' ? result.errors[0] ?? 'Polkadot commitment was rejected' : undefined,
      confidence: result.status === 'rejected' ? 0.2 : 1,
      sources: ['agid-polkadot-adapter'],
      warnings: result.warnings,
      cache: 'none',
    }, result.status === 'rejected' ? 409 : 200);
  });

  app.get('/api/polkadot/commitments/:commitmentId', async (req, res) => {
    const networkId = typeof req.query.networkId === 'string' ? req.query.networkId : undefined;
    const adapter = getPolkadotAdapter({ networkId });
    const record = await adapter.queryCommitment(req.params.commitmentId);
    if (!record) {
      return sendAgidResult(req, res, {
        ok: false,
        error: 'Polkadot commitment not found',
        sources: ['agid-polkadot-adapter'],
        warnings: [],
        cache: 'none',
      }, 404);
    }

    sendAgidResult(req, res, {
      ok: true,
      data: record,
      confidence: 1,
      sources: ['agid-polkadot-adapter'],
      warnings: record.warnings,
      cache: 'none',
    });
  });

  app.post('/api/polkadot/commitments/:commitmentId/finality', async (req, res) => {
    const body = (req.body ?? {}) as JsonRecord;
    const adapterBodyOptions = objectOrUndefined(body.adapterOptions) ?? {};
    const adapterOptions = polkadotAdapterOptionsFrom({
      ...adapterBodyOptions,
      networkId: (body.networkId as string | undefined) ?? adapterBodyOptions.networkId,
    });
    const adapter = getPolkadotAdapter(adapterOptions);
    const finality = await adapter.verifyFinality(req.params.commitmentId, {
      finalizedBlockNumber: typeof body.finalizedBlockNumber === 'number' ? body.finalizedBlockNumber : undefined,
      requiredConfirmations: typeof body.requiredConfirmations === 'number' ? body.requiredConfirmations : undefined,
      observedAt: body.observedAt as string | undefined,
    });
    const statusCode = finality.status === 'missing'
      ? 404
      : finality.finalized
        ? 200
        : 202;

    sendAgidResult(req, res, {
      ok: finality.status !== 'missing',
      data: finality,
      error: finality.status === 'missing' ? finality.errors[0] ?? 'Polkadot commitment not found' : undefined,
      confidence: finality.finalized ? 1 : 0.55,
      sources: ['agid-polkadot-adapter'],
      warnings: finality.warnings,
      cache: 'none',
    }, statusCode);
  });

  app.post('/api/translate', async (req, res) => {
    const endpoint = process.env.LIBRETRANSLATE_URL || process.env.ARGOS_TRANSLATE_URL || '';
    const text = typeof req.body?.q === 'string'
      ? req.body.q
      : typeof req.body?.text === 'string'
        ? req.body.text
        : '';
    const target = normalizeTranslationLanguage(req.body?.target);
    const source = detectOpenSourceTranslationLanguage(text, req.body?.source);

    if (!text.trim() || target === 'auto') {
      return res.status(400).json({ error: 'Missing text or target language' });
    }

    if (!endpoint) {
      return res.status(503).json({
        error: 'Open-source translation service not configured',
        fallback: 'client-libretranslate-compatible',
        configure: 'Set LIBRETRANSLATE_URL or ARGOS_TRANSLATE_URL to a LibreTranslate-compatible /translate endpoint.',
      });
    }

    try {
      const connectorToken = process.env.AGID_TRANSLATION_CONNECTOR_TOKEN?.trim() ?? process.env.LIBRETRANSLATE_CONNECTOR_TOKEN?.trim() ?? '';
      if (!serverPolicyEnabled(process.env.AGID_TRANSLATION_ALLOW_PLAINTEXT, false)) {
        return res.status(403).json({
          error: 'Open-source translation connector is disabled by server policy',
          configure: 'Set AGID_TRANSLATION_ALLOW_PLAINTEXT=true only for an approved translation connector.',
        });
      }

      const response = await connectorFetchNoCache(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(connectorToken ? { Authorization: `Bearer ${connectorToken}` } : {}),
        },
        body: JSON.stringify({
          q: text,
          source,
          target,
          format: 'text',
        }),
      }, 15000, 0);

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Open-source translation service failed' });
      }

      const data = await response.json();
      res.json({
        translatedText: data.translatedText || data.translation || data.text || '',
        source,
        target,
        provider: 'libretranslate-compatible',
      });
    } catch (error) {
      console.error('[API] Translation Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/data-quality/report', async (_req, res) => {
    res.json({
      timestamp: Date.now(),
      report: 'Backend AI analysis is disabled. Please trigger this check from the frontend.',
      stats: qualityStats,
      continentQuality,
    });
  });

  app.get('/api/postal-code/nearest', async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const cc = (req.query.cc as string || '').toUpperCase();

      if (Number.isNaN(lat) || Number.isNaN(lon) || !cc) {
        return res.status(400).json({ error: 'Missing or invalid lat, lon, or cc' });
      }

      const result = await getNearestPostalCode(lat, lon, cc);
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: 'No postal code found nearby' });
      }
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/postal-code/status', (_req, res) => {
    res.json(getPostalCodeDBStatus());
  });

  app.get('/api/postal-code/zippo', async (req, res) => {
    const country = (req.query.cc as string || '').toLowerCase();
    const postcode = req.query.pc as string;

    if (!country || !postcode) {
      return res.status(400).json({ error: 'Missing country code (cc) or postcode (pc)' });
    }

    try {
      const response = await publicCachedGetFetch(`https://api.zippopotam.us/${country}/${postcode}`);
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
      res.status(response.status).json({ error: 'Postal code not found in Zippopotam' });
    } catch (error) {
      console.error('Zippopotam API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
