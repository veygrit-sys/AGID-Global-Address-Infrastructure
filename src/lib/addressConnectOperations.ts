import {
  ADDRESS_CONNECT_WEBHOOK_TOPICS,
  addressConnectPrivateMaterialPaths,
  type AddressConnectWebhookTopic,
} from './addressConnect';
import {
  cleanNonNegativeInteger,
  cleanNumber,
  cleanText,
  cleanTextArray,
  stableJson,
} from './redactedWorkflowCore';
import { sha256Hex } from './sha256';

export const ADDRESS_CONNECT_OPERATIONS_MODEL_VERSION = 'agid-address-connect-operations-v1';

export const ADDRESS_CONNECT_OPERATIONAL_REQUIREMENT_CATEGORIES = [
  'webhook-operations',
  'sla',
  'monitoring',
  'log-retention',
] as const;

export const ADDRESS_CONNECT_CRITICAL_WEBHOOK_TOPICS = [
  'address_intent.verified',
  'credential.revoked',
  'revocation.updated',
  'handoff.completed',
  'qr.used',
] as const satisfies readonly AddressConnectWebhookTopic[];

export type AddressConnectOperationalRequirementCategory =
  (typeof ADDRESS_CONNECT_OPERATIONAL_REQUIREMENT_CATEGORIES)[number];

export type AddressWebhookRetryStrategy = {
  maxAttempts: number;
  initialBackoffSeconds: number;
  maxBackoffSeconds: number;
  jitter: 'none' | 'equal' | 'full';
  deadLetterAfterAttempts: number;
};

export type AddressWebhookEndpointPolicy = {
  endpointId: string;
  url: string;
  topics: AddressConnectWebhookTopic[];
  signingKeyId: string;
  signatureAlgorithm: 'hmac-sha256';
  status: 'active' | 'paused' | 'suspended';
  ackTimeoutSeconds: number;
  retry: AddressWebhookRetryStrategy;
};

export type AddressWebhookDeliverySample = {
  endpointId: string;
  topic: AddressConnectWebhookTopic;
  eventId?: string;
  deliveredAt?: string;
  statusCode?: number;
  latencyMs?: number;
  signatureVerified?: boolean;
  attempt?: number;
  errorCode?: string;
};

export type AddressSlaObjective = {
  name: string;
  targetPercent: number;
  window: 'hourly' | 'daily' | 'monthly';
  maxP95LatencyMs: number;
  maxErrorRatePercent: number;
};

export type AddressMonitoringSignal = {
  signalId: string;
  severity: 'info' | 'warning' | 'critical';
  label: string;
  detail: string;
  action: string;
};

export type AddressLogRetentionPolicy = {
  rawPayloadRetentionDays: 0;
  operationalLogRetentionDays: number;
  securityLogRetentionDays: number;
  auditLogRetentionDays: number;
  piiRedactionRequired: true;
  allowedFields: string[];
};

export type AddressConnectOperationsInput = {
  generatedAt?: unknown;
  endpoints?: unknown;
  deliveries?: unknown;
  sla?: unknown;
  retention?: unknown;
};

export type AddressConnectOperationsReport = {
  modelVersion: typeof ADDRESS_CONNECT_OPERATIONS_MODEL_VERSION;
  generatedAt: string;
  accepted: boolean;
  status: 'ready' | 'attention' | 'blocked';
  webhook: {
    activeEndpoints: number;
    pausedEndpoints: number;
    suspendedEndpoints: number;
    deliveryCount: number;
    successCount: number;
    failureCount: number;
    successRatePercent: number;
    p95LatencyMs: number;
    signatureFailureCount: number;
    retryDueCount: number;
    deadLetterCount: number;
    coveredTopics: AddressConnectWebhookTopic[];
    missingCriticalTopics: AddressConnectWebhookTopic[];
  };
  sla: {
    objective: AddressSlaObjective;
    met: boolean;
    availabilityPercent: number;
    errorRatePercent: number;
    p95LatencyMs: number;
    errorBudgetBurnRate: number;
  };
  monitoring: {
    signals: AddressMonitoringSignal[];
    pagerRequired: boolean;
  };
  logRetention: {
    policy: AddressLogRetentionPolicy;
    accepted: boolean;
    warnings: string[];
    storageBoundary: 'metadata-commitments-receipts-and-fingerprints-only';
  };
  errors: string[];
  warnings: string[];
  privacy: {
    rawPayloadStorage: false;
    rawAddressStorage: false;
    rawAgidStorage: false;
    rawAoidStorage: false;
    proofCodeStorage: false;
    fullSignatureStorage: false;
  };
  reportRoot: string;
};

export type AddressConnectOperationalRequirements = {
  modelVersion: typeof ADDRESS_CONNECT_OPERATIONS_MODEL_VERSION;
  categories: Array<{
    id: AddressConnectOperationalRequirementCategory;
    label: string;
    requirements: string[];
  }>;
  criticalWebhookTopics: AddressConnectWebhookTopic[];
  safeLogFields: string[];
  privacy: AddressConnectOperationsReport['privacy'];
};

const DEFAULT_RETRY: AddressWebhookRetryStrategy = {
  maxAttempts: 8,
  initialBackoffSeconds: 10,
  maxBackoffSeconds: 900,
  jitter: 'full',
  deadLetterAfterAttempts: 8,
};

const DEFAULT_SLA: AddressSlaObjective = {
  name: 'Address Connect hosted registry operations',
  targetPercent: 99.9,
  window: 'monthly',
  maxP95LatencyMs: 800,
  maxErrorRatePercent: 0.1,
};

const DEFAULT_RETENTION: AddressLogRetentionPolicy = {
  rawPayloadRetentionDays: 0,
  operationalLogRetentionDays: 30,
  securityLogRetentionDays: 400,
  auditLogRetentionDays: 400,
  piiRedactionRequired: true,
  allowedFields: [
    'eventId',
    'topic',
    'endpointId',
    'statusCode',
    'latencyMs',
    'attempt',
    'errorCode',
    'payloadFingerprint',
    'commitment',
    'receiptRef',
    'terminalId',
    'issuerId',
    'generatedAt',
  ],
};

const PRIVACY: AddressConnectOperationsReport['privacy'] = {
  rawPayloadStorage: false,
  rawAddressStorage: false,
  rawAgidStorage: false,
  rawAoidStorage: false,
  proofCodeStorage: false,
  fullSignatureStorage: false,
};

const UNSAFE_LOG_FIELD_KEYS = new Set([
  'address',
  'rawaddress',
  'agid',
  'rawagid',
  'aoid',
  'rawaoid',
  'payload',
  'rawpayload',
  'recipient',
  'recipientname',
  'phone',
  'phonenumber',
  'proofcode',
  'recipientsecret',
  'privatekey',
  'secret',
  'token',
  'authorization',
  'signature',
  'fullsignature',
]);

function cleanArray(value: unknown): string[] {
  return cleanTextArray(value);
}

function cleanPositiveInteger(value: unknown, fallback: number) {
  return cleanNonNegativeInteger(value, fallback);
}

function cleanTopic(value: unknown): AddressConnectWebhookTopic | null {
  const topic = cleanText(value);
  return ADDRESS_CONNECT_WEBHOOK_TOPICS.includes(topic as AddressConnectWebhookTopic)
    ? topic as AddressConnectWebhookTopic
    : null;
}

function cleanTopics(value: unknown): AddressConnectWebhookTopic[] {
  return Array.from(new Set(cleanArray(value)
    .map(topic => cleanTopic(topic))
    .filter((topic): topic is AddressConnectWebhookTopic => Boolean(topic))));
}

function retryStrategy(value: unknown): AddressWebhookRetryStrategy {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const jitterText = cleanText(source.jitter);
  const jitter = jitterText === 'none' || jitterText === 'equal' || jitterText === 'full'
    ? jitterText
    : DEFAULT_RETRY.jitter;
  const maxAttempts = Math.max(1, cleanPositiveInteger(source.maxAttempts, DEFAULT_RETRY.maxAttempts));
  const deadLetterAfterAttempts = Math.max(
    1,
    cleanPositiveInteger(source.deadLetterAfterAttempts, DEFAULT_RETRY.deadLetterAfterAttempts),
  );
  return {
    maxAttempts,
    initialBackoffSeconds: Math.max(1, cleanPositiveInteger(source.initialBackoffSeconds, DEFAULT_RETRY.initialBackoffSeconds)),
    maxBackoffSeconds: Math.max(1, cleanPositiveInteger(source.maxBackoffSeconds, DEFAULT_RETRY.maxBackoffSeconds)),
    jitter,
    deadLetterAfterAttempts: Math.min(deadLetterAfterAttempts, maxAttempts),
  };
}

function endpointPolicy(value: unknown, index: number): AddressWebhookEndpointPolicy | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const statusText = cleanText(source.status);
  const status = statusText === 'paused' || statusText === 'suspended' ? statusText : 'active';
  const signatureAlgorithmText = cleanText(source.signatureAlgorithm);
  const signatureAlgorithm = signatureAlgorithmText === 'hmac-sha256' ? signatureAlgorithmText : 'hmac-sha256';
  const endpointId = cleanText(source.endpointId ?? source.id) || `webhook-endpoint-${index + 1}`;
  return {
    endpointId,
    url: cleanText(source.url ?? source.publicBaseUrl ?? source.endpoint),
    topics: cleanTopics(source.topics ?? source.webhookTopics ?? source.subscriptions),
    signingKeyId: cleanText(source.signingKeyId ?? source.keyId),
    signatureAlgorithm,
    status,
    ackTimeoutSeconds: Math.max(1, cleanPositiveInteger(source.ackTimeoutSeconds, 5)),
    retry: retryStrategy(source.retry),
  };
}

function deliverySample(value: unknown): AddressWebhookDeliverySample | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const topic = cleanTopic(source.topic);
  const endpointId = cleanText(source.endpointId);
  if (!topic || !endpointId) return null;
  return {
    endpointId,
    topic,
    eventId: cleanText(source.eventId) || undefined,
    deliveredAt: cleanText(source.deliveredAt) || undefined,
    statusCode: cleanNumber(source.statusCode, Number.NaN),
    latencyMs: cleanNumber(source.latencyMs, Number.NaN),
    signatureVerified: source.signatureVerified === true,
    attempt: cleanPositiveInteger(source.attempt, 1),
    errorCode: cleanText(source.errorCode) || undefined,
  };
}

function slaObjective(value: unknown): AddressSlaObjective {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const windowText = cleanText(source.window);
  const window = windowText === 'hourly' || windowText === 'daily' || windowText === 'monthly'
    ? windowText
    : DEFAULT_SLA.window;
  return {
    name: cleanText(source.name) || DEFAULT_SLA.name,
    targetPercent: Math.min(100, Math.max(0, cleanNumber(source.targetPercent, DEFAULT_SLA.targetPercent))),
    window,
    maxP95LatencyMs: Math.max(1, cleanPositiveInteger(source.maxP95LatencyMs, DEFAULT_SLA.maxP95LatencyMs)),
    maxErrorRatePercent: Math.min(100, Math.max(0, cleanNumber(source.maxErrorRatePercent, DEFAULT_SLA.maxErrorRatePercent))),
  };
}

function logRetentionPolicy(value: unknown): AddressLogRetentionPolicy {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  return {
    rawPayloadRetentionDays: 0,
    operationalLogRetentionDays: cleanPositiveInteger(
      source.operationalLogRetentionDays,
      DEFAULT_RETENTION.operationalLogRetentionDays,
    ),
    securityLogRetentionDays: cleanPositiveInteger(
      source.securityLogRetentionDays,
      DEFAULT_RETENTION.securityLogRetentionDays,
    ),
    auditLogRetentionDays: cleanPositiveInteger(
      source.auditLogRetentionDays,
      DEFAULT_RETENTION.auditLogRetentionDays,
    ),
    piiRedactionRequired: true,
    allowedFields: Array.from(new Set([
      ...DEFAULT_RETENTION.allowedFields,
      ...cleanArray(source.allowedFields),
    ])),
  };
}

function requestedRawPayloadRetentionDays(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0;
  return cleanPositiveInteger((value as Record<string, unknown>).rawPayloadRetentionDays, 0);
}

function normalizedLogField(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function percentile(values: number[], percentileValue: number) {
  const sorted = values
    .filter(value => Number.isFinite(value))
    .sort((left, right) => left - right);
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[index];
}

function isDeliverySuccess(delivery: AddressWebhookDeliverySample) {
  return Boolean(
    delivery.signatureVerified
    && typeof delivery.statusCode === 'number'
    && delivery.statusCode >= 200
    && delivery.statusCode < 300,
  );
}

function signal(
  signalId: string,
  severity: AddressMonitoringSignal['severity'],
  label: string,
  detail: string,
  action: string,
): AddressMonitoringSignal {
  return { signalId, severity, label, detail, action };
}

function collectRetentionWarnings(retention: AddressLogRetentionPolicy, requestedRawPayloadDays: number) {
  const warnings: string[] = [];
  if (requestedRawPayloadDays > 0) {
    warnings.push('raw-webhook-payload-retention-must-be-zero-days');
  }
  if (retention.operationalLogRetentionDays > 90) {
    warnings.push('operational-log-retention-should-be-90-days-or-less-by-default');
  }
  if (retention.securityLogRetentionDays < 365) {
    warnings.push('security-log-retention-should-be-at-least-365-days');
  }
  if (retention.auditLogRetentionDays < 365) {
    warnings.push('audit-log-retention-should-be-at-least-365-days');
  }
  const unsafeFields = retention.allowedFields.filter(field => UNSAFE_LOG_FIELD_KEYS.has(normalizedLogField(field)));
  for (const field of unsafeFields) {
    warnings.push(`unsafe-log-field-not-accepted:${field}`);
  }
  return warnings;
}

export function buildAddressConnectOperationsReport(
  input: AddressConnectOperationsInput = {},
): AddressConnectOperationsReport {
  const privateMaterialErrors = addressConnectPrivateMaterialPaths(input)
    .map(path => `private-material-not-accepted:${path}`);
  const endpoints = (Array.isArray(input.endpoints) ? input.endpoints : [])
    .map(endpointPolicy)
    .filter((endpoint): endpoint is AddressWebhookEndpointPolicy => Boolean(endpoint));
  const deliveries = (Array.isArray(input.deliveries) ? input.deliveries : [])
    .map(deliverySample)
    .filter((delivery): delivery is AddressWebhookDeliverySample => Boolean(delivery));
  const objective = slaObjective(input.sla);
  const retention = logRetentionPolicy(input.retention);
  const retentionWarnings = collectRetentionWarnings(retention, requestedRawPayloadRetentionDays(input.retention));

  const activeEndpoints = endpoints.filter(endpoint => endpoint.status === 'active');
  const coveredTopics = Array.from(new Set(activeEndpoints.flatMap(endpoint => endpoint.topics))).sort();
  const missingCriticalTopics = ADDRESS_CONNECT_CRITICAL_WEBHOOK_TOPICS
    .filter(topic => !coveredTopics.includes(topic));
  const successCount = deliveries.filter(isDeliverySuccess).length;
  const failureCount = deliveries.length - successCount;
  const signatureFailureCount = deliveries.filter(delivery => !delivery.signatureVerified).length;
  const deadLetterCount = deliveries.filter((delivery) => {
    const endpoint = endpoints.find(item => item.endpointId === delivery.endpointId);
    const deadLetterAt = endpoint?.retry.deadLetterAfterAttempts ?? DEFAULT_RETRY.deadLetterAfterAttempts;
    return (delivery.attempt ?? 1) >= deadLetterAt
      || cleanText(delivery.errorCode).toLowerCase().includes('dead-letter');
  }).length;
  const retryDueCount = deliveries.filter(delivery => {
    if (isDeliverySuccess(delivery)) return false;
    const endpoint = endpoints.find(item => item.endpointId === delivery.endpointId);
    const maxAttempts = endpoint?.retry.maxAttempts ?? DEFAULT_RETRY.maxAttempts;
    return (delivery.attempt ?? 1) < maxAttempts;
  }).length;
  const p95LatencyMs = percentile(
    deliveries.flatMap(delivery => Number.isFinite(delivery.latencyMs) ? [delivery.latencyMs as number] : []),
    95,
  );
  const successRatePercent = deliveries.length > 0
    ? Number(((successCount / deliveries.length) * 100).toFixed(3))
    : 100;
  const errorRatePercent = Number((100 - successRatePercent).toFixed(3));
  const availabilityPercent = successRatePercent;
  const errorBudgetPercent = Math.max(0.0001, 100 - objective.targetPercent);
  const errorBudgetBurnRate = Number((errorRatePercent / errorBudgetPercent).toFixed(3));

  const signals: AddressMonitoringSignal[] = [];
  if (activeEndpoints.length === 0) {
    signals.push(signal(
      'webhook-no-active-endpoint',
      'critical',
      'No active webhook endpoint',
      'Address Connect cannot dispatch operational events without an active endpoint.',
      'register-or-reactivate-webhook-endpoint',
    ));
  }
  if (missingCriticalTopics.length > 0) {
    signals.push(signal(
      'webhook-critical-topic-coverage',
      'warning',
      'Critical webhook topics are not covered',
      `Missing topics: ${missingCriticalTopics.join(', ')}`,
      'subscribe-critical-operational-topics',
    ));
  }
  if (signatureFailureCount > 0) {
    signals.push(signal(
      'webhook-signature-failure',
      'critical',
      'Webhook signature verification failed',
      `${signatureFailureCount} delivery sample(s) failed signature verification.`,
      'rotate-keys-and-disable-affected-endpoints',
    ));
  }
  if (deadLetterCount > 0) {
    signals.push(signal(
      'webhook-dead-letter',
      'critical',
      'Webhook delivery reached dead-letter queue',
      `${deadLetterCount} delivery sample(s) exhausted retry policy.`,
      'inspect-dead-letter-queue-and-replay-idempotently',
    ));
  }
  if (retryDueCount > 0) {
    signals.push(signal(
      'webhook-retry-backlog',
      'warning',
      'Webhook retry backlog is non-empty',
      `${retryDueCount} delivery sample(s) should be retried with backoff.`,
      'process-retry-queue',
    ));
  }
  if (p95LatencyMs > objective.maxP95LatencyMs) {
    signals.push(signal(
      'sla-p95-latency',
      'warning',
      'Webhook p95 latency is above objective',
      `p95=${p95LatencyMs}ms, objective=${objective.maxP95LatencyMs}ms.`,
      'scale-dispatch-workers-or-investigate-receiver-latency',
    ));
  }
  if (errorRatePercent > objective.maxErrorRatePercent) {
    signals.push(signal(
      'sla-error-rate',
      'critical',
      'Webhook error rate is above objective',
      `errorRate=${errorRatePercent}%, objective=${objective.maxErrorRatePercent}%.`,
      'open-incident-and-protect-error-budget',
    ));
  }
  for (const warning of retentionWarnings) {
    signals.push(signal(
      `log-retention-${sha256Hex(warning).slice(0, 8)}`,
      warning.startsWith('unsafe-log-field') || warning.includes('raw-webhook-payload') ? 'critical' : 'warning',
      'Log retention policy needs review',
      warning,
      'tighten-log-retention-and-redaction-policy',
    ));
  }

  const logRetentionAccepted = retentionWarnings.every(warning => !warning.startsWith('unsafe-log-field')
    && !warning.includes('raw-webhook-payload'));
  const slaMet = availabilityPercent >= objective.targetPercent
    && errorRatePercent <= objective.maxErrorRatePercent
    && p95LatencyMs <= objective.maxP95LatencyMs;
  const accepted = privateMaterialErrors.length === 0 && logRetentionAccepted;
  const hasCritical = signals.some(item => item.severity === 'critical');
  const status = !accepted || hasCritical
    ? 'blocked'
    : !slaMet || signals.length > 0
      ? 'attention'
      : 'ready';
  const reportRoot = sha256Hex(stableJson({
    modelVersion: ADDRESS_CONNECT_OPERATIONS_MODEL_VERSION,
    endpoints: endpoints.map(endpoint => ({
      endpointId: endpoint.endpointId,
      topics: endpoint.topics,
      status: endpoint.status,
      signingKeyId: endpoint.signingKeyId,
      signatureAlgorithm: endpoint.signatureAlgorithm,
    })),
    webhook: {
      deliveryCount: deliveries.length,
      successCount,
      failureCount,
      signatureFailureCount,
      deadLetterCount,
      retryDueCount,
      p95LatencyMs,
    },
    sla: {
      objective,
      slaMet,
      availabilityPercent,
      errorRatePercent,
      errorBudgetBurnRate,
    },
    retention: {
      operationalLogRetentionDays: retention.operationalLogRetentionDays,
      securityLogRetentionDays: retention.securityLogRetentionDays,
      auditLogRetentionDays: retention.auditLogRetentionDays,
      allowedFields: retention.allowedFields,
    },
  }));

  return {
    modelVersion: ADDRESS_CONNECT_OPERATIONS_MODEL_VERSION,
    generatedAt: cleanText(input.generatedAt) || new Date().toISOString(),
    accepted,
    status,
    webhook: {
      activeEndpoints: activeEndpoints.length,
      pausedEndpoints: endpoints.filter(endpoint => endpoint.status === 'paused').length,
      suspendedEndpoints: endpoints.filter(endpoint => endpoint.status === 'suspended').length,
      deliveryCount: deliveries.length,
      successCount,
      failureCount,
      successRatePercent,
      p95LatencyMs,
      signatureFailureCount,
      retryDueCount,
      deadLetterCount,
      coveredTopics,
      missingCriticalTopics,
    },
    sla: {
      objective,
      met: slaMet,
      availabilityPercent,
      errorRatePercent,
      p95LatencyMs,
      errorBudgetBurnRate,
    },
    monitoring: {
      signals,
      pagerRequired: signals.some(item => item.severity === 'critical'),
    },
    logRetention: {
      policy: retention,
      accepted: logRetentionAccepted,
      warnings: retentionWarnings,
      storageBoundary: 'metadata-commitments-receipts-and-fingerprints-only',
    },
    errors: privateMaterialErrors,
    warnings: signals.filter(item => item.severity === 'warning').map(item => item.signalId),
    privacy: PRIVACY,
    reportRoot,
  };
}

export function listAddressConnectOperationalRequirements(): AddressConnectOperationalRequirements {
  return {
    modelVersion: ADDRESS_CONNECT_OPERATIONS_MODEL_VERSION,
    categories: [
      {
        id: 'webhook-operations',
        label: 'Webhook Operations',
        requirements: [
          'Sign every webhook with HMAC-SHA256 or a stronger profile and include key id, timestamp, and event id.',
          'Reject replayed events outside the configured timestamp tolerance.',
          'Process event ids idempotently before applying business effects.',
          'Retry only retryable delivery failures with exponential backoff and jitter.',
          'Move exhausted deliveries to a dead-letter queue with operator replay controls.',
        ],
      },
      {
        id: 'sla',
        label: 'SLA',
        requirements: [
          'Track monthly availability for hosted registry and webhook dispatch paths.',
          'Track p95 and p99 webhook acknowledgement latency separately from receiver processing time.',
          'Publish status and incident notes for production registry outages.',
          'Use error budget burn rate to decide when to pause risky releases.',
        ],
      },
      {
        id: 'monitoring',
        label: 'Monitoring',
        requirements: [
          'Alert on signature failures, dead-letter growth, retry backlog, stale revocation roots, and offline terminal queue growth.',
          'Record endpoint freshness, issuer status, terminal sync health, and registry root age.',
          'Separate security alerts from routine delivery failures.',
          'Expose operator-safe dashboard summaries without personal address payloads.',
        ],
      },
      {
        id: 'log-retention',
        label: 'Log Retention',
        requirements: [
          'Keep raw webhook payload retention at zero days by default.',
          'Store only commitments, fingerprints, receipt refs, endpoint ids, topic names, status, timing, and error codes.',
          'Never log raw addresses, raw AGID/AOID, proof codes, phone numbers, recipient names, tokens, or full signatures.',
          'Retain operational logs briefly, and retain security/audit logs long enough for incident review.',
          'Hash exported audit bundles so later review can detect tampering.',
        ],
      },
    ],
    criticalWebhookTopics: [...ADDRESS_CONNECT_CRITICAL_WEBHOOK_TOPICS],
    safeLogFields: [...DEFAULT_RETENTION.allowedFields],
    privacy: PRIVACY,
  };
}
