import { agidFetch,type AgidApiResult } from '../lib/agidHttpClient';
import {
  AGID_AOID_GOVERNANCE_MODEL,
  evaluateAgidAoidOperation,
  type AgidAoidLayer,
  type AgidAoidOperation,
  type AgidAoidSurface,
} from '../lib/agidAoidGovernance';
import { apiEndpoints } from '../lib/apiEndpoints';
import { apiV1Path } from '../lib/apiVersion';

export type CommunicationHealth = {
  rest: boolean;
  sse: boolean;
  localFirstSync: boolean;
  externalApiProxy: boolean;
  registrationAudit?: boolean;
  aoidEncryptedSync?: boolean;
  governanceModel?: string;
};

export type OracleOperaIntegrationHealth = {
  adapterVersion: string;
  enabled: boolean;
  dryRun: boolean;
  credentialsConfigured: boolean;
  writePathConfigured: boolean;
  liveWritesEnabled: boolean;
  baseUrlHost?: string;
  hotelIdConfigured: boolean;
  appKeyConfigured: boolean;
  supportedOperations: string[];
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  missingEnvVars: string[];
};

export type OracleOperaAddressSyncRequest = {
  agid?: string;
  address?: Record<string, unknown> | string;
  addressText?: string;
  language?: string;
  countryCode?: string;
  profileId?: string;
  reservationId?: string;
  externalReferenceId?: string;
  propertyCode?: string;
  hotelId?: string;
  coordinates?: {
    lat?: number;
    lon?: number;
    latitude?: number;
    longitude?: number;
  };
  confidence?: number;
  sources?: string[];
  warnings?: string[];
};

export type OracleOperaAddressSyncResult = {
  ok: boolean;
  mode: 'dry-run' | 'live';
  operation: 'address-sync';
  adapterVersion: string;
  endpoint?: string;
  method: 'POST' | 'PUT' | 'PATCH';
  requestBody: Record<string, unknown>;
  response?: {
    status: number;
    ok: boolean;
    bodyReturned: boolean;
    body?: unknown;
  };
  error?: string;
  warnings: string[];
  sources: string[];
};

export type ExternalPosOperation =
  | 'sale-link'
  | 'pickup-ready'
  | 'handoff-complete'
  | 'receipt-export'
  | 'customer-note'
  | 'refund-release';

export type ExternalPosCapabilities = {
  modelVersion: string;
  serverConfigured: boolean;
  apis: Array<Record<string, unknown>>;
  importContract: Record<string, unknown>;
  privacyDefaults: Record<string, unknown>;
  operations: ExternalPosOperation[];
};

export type ExternalPosRequest = {
  operation?: ExternalPosOperation;
  posApiIds?: string[];
  apiIds?: string[];
  receipt?: Record<string, unknown>;
  posReceipt?: Record<string, unknown>;
  order?: Record<string, unknown>;
  orderId?: string;
  orderAlias?: string;
  addressReference?: Record<string, unknown>;
  address?: Record<string, unknown>;
  notes?: string;
  [key: string]: unknown;
};

export type ExternalPosRunResult = {
  modelVersion: string;
  operation: ExternalPosOperation;
  attempted: number;
  results: Array<Record<string, unknown>>;
  privacy: Record<string, unknown>;
};

export function fetchCommunicationHealth(fetcher?: typeof fetch): Promise<AgidApiResult<CommunicationHealth>> {
  return agidFetch<CommunicationHealth>(apiV1Path('/communication/health'), {
    source: 'agid-server',
    timeoutMs: 8000,
    retries: 1,
    fetcher,
  });
}

export function fetchExternalPosCapabilities(fetcher?: typeof fetch): Promise<AgidApiResult<ExternalPosCapabilities>> {
  return agidFetch<ExternalPosCapabilities>(apiEndpoints.posExternalCapabilities(), {
    source: 'external-pos-integration',
    timeoutMs: 8000,
    retries: 1,
    fetcher,
  });
}

export function runExternalPosOperation(
  request: ExternalPosRequest,
  fetcher?: typeof fetch,
): Promise<AgidApiResult<ExternalPosRunResult>> {
  return agidFetch<ExternalPosRunResult>(apiEndpoints.posExternalRequest(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    source: 'external-pos-integration',
    timeoutMs: 15000,
    retries: 0,
    fetcher,
  });
}

export function fetchOracleOperaIntegrationHealth(fetcher?: typeof fetch): Promise<AgidApiResult<OracleOperaIntegrationHealth>> {
  return agidFetch<OracleOperaIntegrationHealth>(apiV1Path('/integrations/oracle-opera/health'), {
    source: 'oracle-opera-ohip-adapter',
    timeoutMs: 8000,
    retries: 1,
    fetcher,
  });
}

export function syncAddressToOracleOpera(
  request: OracleOperaAddressSyncRequest,
  fetcher?: typeof fetch,
): Promise<AgidApiResult<OracleOperaAddressSyncResult>> {
  return agidFetch<OracleOperaAddressSyncResult>(apiV1Path('/integrations/oracle-opera/address'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    source: 'oracle-opera-ohip-adapter',
    timeoutMs: 15000,
    retries: 0,
    fetcher,
  });
}

export function getAgidAoidCommunicationGovernanceModel() {
  return AGID_AOID_GOVERNANCE_MODEL.communication;
}

export function evaluateAgidAoidCommunication(options: {
  layer: AgidAoidLayer;
  surface: AgidAoidSurface;
  operation?: AgidAoidOperation;
  payload?: unknown;
}) {
  return evaluateAgidAoidOperation({
    layer: options.layer,
    operation: options.operation ?? 'communicate',
    surface: options.surface,
    payload: options.payload,
  });
}

export function openAgidJobEventStream(
  jobId: string,
  handlers: {
    onMessage?: (event: MessageEvent) => void;
    onError?: (event: Event) => void;
    onReady?: (event: MessageEvent) => void;
    onHeartbeat?: (event: MessageEvent) => void;
  } = {},
) {
  if (typeof EventSource === 'undefined') {
    throw new Error('EventSource is not available in this environment');
  }

  const safeJobId = encodeURIComponent(jobId.trim() || 'default');
  const source = new EventSource(apiV1Path(`/jobs/${safeJobId}/events`));
  if (handlers.onMessage) source.onmessage = handlers.onMessage;
  if (handlers.onError) source.onerror = handlers.onError;
  if (handlers.onReady) source.addEventListener('ready', handlers.onReady);
  if (handlers.onHeartbeat) source.addEventListener('heartbeat', handlers.onHeartbeat);
  return source;
}
