import {
  collectAddressDnsPrivateMaterialErrors,
  validateAddressDnsRecord,
  type AddressDnsRecord,
} from './addressDnsRecord';
import {
  separatePublicPrivatePayload,
  validatePublicPayloadSeparation,
  type PublicPrivateCommitment,
  type PublicPrivateSeparationMode,
} from './publicPrivateSeparation';
import { sha256Hex } from './sha256';

export const FEDERATED_RESOLVER_VERSION = 'agid-federated-resolver-v1';

export type FederatedResolverMode =
  | 'local-only'
  | 'address-dns'
  | 'server-registry'
  | 'zk-proof'
  | 'ethereum-registry'
  | 'hybrid';

export type FederatedResolverSourceKind =
  | 'local-cache'
  | 'address-dns'
  | 'registry-api'
  | 'partner-resolver'
  | 'official-source'
  | 'manual-review';

export type FederatedResolverSourceStatus =
  | 'resolved'
  | 'partial'
  | 'unresolved'
  | 'error'
  | 'timeout';

export type FederatedResolverStatus =
  | 'resolved'
  | 'partial'
  | 'unresolved'
  | 'conflict'
  | 'blocked';

export type FederatedResolverDecision =
  | 'accept'
  | 'review'
  | 'reject';

export type FederatedResolverAction =
  | 'use-federated-result'
  | 'ask-operator-review'
  | 'retry-timeout-sources'
  | 'request-more-evidence'
  | 'do-not-send-private-fields'
  | 'check-conflicting-resolvers'
  | 'queue-manual-review';

export type FederatedResolverRequest = {
  version: typeof FEDERATED_RESOLVER_VERSION;
  queryId: string;
  mode: FederatedResolverMode;
  domain: string;
  createdAt: string;
  publicPayload: Record<string, unknown>;
  commitments: PublicPrivateCommitment[];
  separationAuditFingerprint: string;
};

export type FederatedResolverSourceResult = {
  sourceId: string;
  sourceKind: FederatedResolverSourceKind;
  status: FederatedResolverSourceStatus;
  confidence: number;
  trustScore: number;
  latencyMs: number;
  targetKey?: string;
  addressReferenceCommitment?: string;
  agidCommitment?: string;
  aoidCommitment?: string;
  pid?: string;
  pidCommitment?: string;
  freshnessRoot?: string;
  revocationRoot?: string;
  evidenceRoot?: string;
  addressDnsRecords?: AddressDnsRecord[];
  publicPayload?: Record<string, unknown>;
  expiresAt?: string;
  warnings: string[];
  errors: string[];
};

export type FederatedResolverSourceResponse = Partial<Omit<FederatedResolverSourceResult, 'sourceId' | 'sourceKind' | 'trustScore' | 'latencyMs' | 'warnings' | 'errors'>> & {
  warnings?: string[];
  errors?: string[];
};

export type FederatedResolverSource = {
  sourceId: string;
  sourceKind: FederatedResolverSourceKind;
  trustScore: number;
  timeoutMs?: number;
  resolve: (request: FederatedResolverRequest) => Promise<FederatedResolverSourceResponse>;
};

export type FederatedResolverConsensus = {
  status: FederatedResolverStatus;
  decision: FederatedResolverDecision;
  winningTargetKey?: string;
  confidence: number;
  agreementCount: number;
  eligibleSourceCount: number;
  quorum: number;
  quorumMet: boolean;
  conflictKeys: string[];
  supportingSourceIds: string[];
  rejectedSourceIds: string[];
};

export type FederatedResolverResult = {
  version: typeof FEDERATED_RESOLVER_VERSION;
  queryId: string;
  mode: FederatedResolverMode;
  domain: string;
  createdAt: string;
  status: FederatedResolverStatus;
  decision: FederatedResolverDecision;
  publicRequestPayload: Record<string, unknown>;
  commitments: PublicPrivateCommitment[];
  sourceResults: FederatedResolverSourceResult[];
  consensus: FederatedResolverConsensus;
  actions: FederatedResolverAction[];
  warnings: string[];
  errors: string[];
  auditFingerprint: string;
  privacy: {
    rawAddressSentToFederation: false;
    rawAgidSentToFederation: false;
    rawAoidSentToFederation: false;
    rawCoordinatesSentToFederation: false;
    privatePayloadKeptLocal: true;
    publicPayloadValidated: boolean;
  };
};

export type FederatedResolverInput = {
  payload: unknown;
  mode?: FederatedResolverMode;
  domain: string;
  salt?: string;
  now?: string;
  highRiskMode?: boolean;
  allowPublicAgid?: boolean;
  sources: FederatedResolverSource[];
  quorum?: number;
  minTrustScore?: number;
  timeoutMs?: number;
  minResolvedConfidence?: number;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function normalizeDomain(value: string) {
  return clean(value).toLowerCase().replace(/[^a-z0-9:._-]+/g, '-');
}

function parseDate(value: unknown) {
  const text = clean(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isFinite(date.getTime()) ? date : null;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, nested]) => nested !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
    .join(',')}}`;
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}

function normalizePublicValue(value: unknown) {
  const text = clean(value);
  if (!text) return '';
  return text.startsWith('0x') ? `0x${text.slice(2).toLowerCase()}` : text.toLowerCase();
}

function sourceTrust(value: unknown) {
  return clamp01(typeof value === 'number' ? value : 0.5);
}

function modeToSeparationMode(mode: FederatedResolverMode): PublicPrivateSeparationMode {
  if (mode === 'hybrid') return 'server-registry';
  return mode;
}

function queryIdFrom(publicPayload: Record<string, unknown>, domain: string, createdAt: string) {
  return `FR-${sha256Hex(stableStringify({ domain, createdAt, publicPayload })).slice(0, 20).toUpperCase()}`;
}

function addressDnsTargetKey(records: AddressDnsRecord[] | undefined) {
  for (const record of records || []) {
    const target = record.target.addressReferenceCommitment
      || record.target.agidCommitment
      || record.target.aoidCommitment
      || record.target.pidCommitment
      || record.target.pid
      || record.recordHash;
    const normalized = normalizePublicValue(target);
    if (normalized) return normalized;
  }
  return '';
}

function targetKeyFrom(result: FederatedResolverSourceResponse | FederatedResolverSourceResult) {
  return normalizePublicValue(result.targetKey)
    || normalizePublicValue(result.addressReferenceCommitment)
    || normalizePublicValue(result.agidCommitment)
    || normalizePublicValue(result.aoidCommitment)
    || normalizePublicValue(result.pidCommitment)
    || normalizePublicValue(result.pid)
    || addressDnsTargetKey(result.addressDnsRecords);
}

function isExpired(expiresAt: string | undefined, now: Date) {
  const expiry = parseDate(expiresAt);
  return Boolean(expiry && expiry.getTime() <= now.getTime());
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function sourceResultPrivateMaterialErrors(result: unknown) {
  return unique([
    ...collectAddressDnsPrivateMaterialErrors(result, 'sourceResult'),
    ...validatePublicPayloadSeparation(result).errors,
  ]);
}

function validateAddressDnsRecords(records: AddressDnsRecord[] | undefined, now: string) {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const record of records || []) {
    const validation = validateAddressDnsRecord(record, {
      now,
      requireFreshnessRoot: false,
      requireRevocationRoot: false,
    });
    errors.push(...validation.errors.map(error => `${record.recordId || record.ownerName}: ${error}`));
    warnings.push(...validation.warnings.map(warning => `${record.recordId || record.ownerName}: ${warning}`));
  }
  return { errors: unique(errors), warnings: unique(warnings) };
}

async function callSource(
  source: FederatedResolverSource,
  request: FederatedResolverRequest,
  options: { now: string; timeoutMs: number },
): Promise<FederatedResolverSourceResult> {
  const started = Date.now();
  const timeoutMs = Math.max(10, Math.floor(source.timeoutMs ?? options.timeoutMs));
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  try {
    const response = await Promise.race([
      source.resolve(request),
      new Promise<FederatedResolverSourceResponse>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error('federated-resolver-source-timeout')), timeoutMs);
      }),
    ]);
    if (timeoutHandle) clearTimeout(timeoutHandle);

    const latencyMs = Date.now() - started;
    const privateErrors = sourceResultPrivateMaterialErrors(response);
    const dnsValidation = validateAddressDnsRecords(response.addressDnsRecords, options.now);
    const errors = unique([
      ...(response.errors || []),
      ...privateErrors,
      ...dnsValidation.errors,
    ]);
    const warnings = unique([
      ...(response.warnings || []),
      ...dnsValidation.warnings,
    ]);
    const expired = isExpired(response.expiresAt, parseDate(options.now) ?? new Date());
    if (expired) errors.push('source-result-expired');

    const targetKey = targetKeyFrom(response);
    if (!targetKey && response.status === 'resolved') {
      warnings.push('resolved-source-returned-no-target-key');
    }

    return {
      sourceId: source.sourceId,
      sourceKind: source.sourceKind,
      status: errors.length > 0 ? 'error' : (response.status || (targetKey ? 'partial' : 'unresolved')),
      confidence: clamp01(response.confidence ?? 0),
      trustScore: sourceTrust(source.trustScore),
      latencyMs,
      targetKey: targetKey || undefined,
      addressReferenceCommitment: normalizePublicValue(response.addressReferenceCommitment) || undefined,
      agidCommitment: normalizePublicValue(response.agidCommitment) || undefined,
      aoidCommitment: normalizePublicValue(response.aoidCommitment) || undefined,
      pid: clean(response.pid) || undefined,
      pidCommitment: normalizePublicValue(response.pidCommitment) || undefined,
      freshnessRoot: normalizePublicValue(response.freshnessRoot) || undefined,
      revocationRoot: normalizePublicValue(response.revocationRoot) || undefined,
      evidenceRoot: normalizePublicValue(response.evidenceRoot) || undefined,
      addressDnsRecords: response.addressDnsRecords,
      publicPayload: response.publicPayload,
      expiresAt: response.expiresAt,
      warnings,
      errors: unique(errors),
    };
  } catch (error) {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    const latencyMs = Date.now() - started;
    const message = error instanceof Error ? error.message : 'source-error';
    return {
      sourceId: source.sourceId,
      sourceKind: source.sourceKind,
      status: message.includes('timeout') ? 'timeout' : 'error',
      confidence: 0,
      trustScore: sourceTrust(source.trustScore),
      latencyMs,
      warnings: [],
      errors: [message],
    };
  }
}

function eligibleResults(results: FederatedResolverSourceResult[], minTrustScore: number) {
  return results.filter(result => {
    if (!result.targetKey) return false;
    if (result.status !== 'resolved' && result.status !== 'partial') return false;
    if (result.errors.length > 0) return false;
    if (result.trustScore < minTrustScore) return false;
    return true;
  });
}

function buildConsensus(
  results: FederatedResolverSourceResult[],
  options: {
    quorum: number;
    minTrustScore: number;
    minResolvedConfidence: number;
  },
): FederatedResolverConsensus {
  const eligible = eligibleResults(results, options.minTrustScore);
  const groups = new Map<string, {
    key: string;
    count: number;
    weightedConfidence: number;
    sourceIds: string[];
  }>();

  for (const result of eligible) {
    const key = result.targetKey!;
    const group = groups.get(key) || {
      key,
      count: 0,
      weightedConfidence: 0,
      sourceIds: [],
    };
    group.count += 1;
    group.weightedConfidence += clamp01(result.confidence * result.trustScore);
    group.sourceIds.push(result.sourceId);
    groups.set(key, group);
  }

  const sorted = Array.from(groups.values())
    .sort((left, right) => {
      if (right.count !== left.count) return right.count - left.count;
      return right.weightedConfidence - left.weightedConfidence;
    });
  const top = sorted[0];
  const second = sorted[1];
  const rejectedSourceIds = results
    .filter(result => !eligible.includes(result))
    .map(result => result.sourceId);

  if (!top) {
    return {
      status: 'unresolved',
      decision: 'reject',
      confidence: 0,
      agreementCount: 0,
      eligibleSourceCount: eligible.length,
      quorum: options.quorum,
      quorumMet: false,
      conflictKeys: [],
      supportingSourceIds: [],
      rejectedSourceIds,
    };
  }

  const confidence = clamp01(top.weightedConfidence / Math.max(1, top.count));
  const quorumMet = top.count >= options.quorum;
  const tiedConflict = Boolean(second && top.count === second.count && Math.abs(top.weightedConfidence - second.weightedConfidence) < 0.05);
  const conflictKeys = sorted
    .filter(group => group.key !== top.key && group.count >= Math.max(1, options.quorum - 1))
    .map(group => group.key);

  if (tiedConflict) {
    return {
      status: 'conflict',
      decision: 'review',
      winningTargetKey: top.key,
      confidence,
      agreementCount: top.count,
      eligibleSourceCount: eligible.length,
      quorum: options.quorum,
      quorumMet,
      conflictKeys: unique([second!.key, ...conflictKeys]),
      supportingSourceIds: top.sourceIds,
      rejectedSourceIds,
    };
  }

  if (quorumMet && confidence >= options.minResolvedConfidence) {
    return {
      status: conflictKeys.length > 0 ? 'partial' : 'resolved',
      decision: conflictKeys.length > 0 ? 'review' : 'accept',
      winningTargetKey: top.key,
      confidence,
      agreementCount: top.count,
      eligibleSourceCount: eligible.length,
      quorum: options.quorum,
      quorumMet,
      conflictKeys,
      supportingSourceIds: top.sourceIds,
      rejectedSourceIds,
    };
  }

  return {
    status: 'partial',
    decision: 'review',
    winningTargetKey: top.key,
    confidence,
    agreementCount: top.count,
    eligibleSourceCount: eligible.length,
    quorum: options.quorum,
    quorumMet,
    conflictKeys,
    supportingSourceIds: top.sourceIds,
    rejectedSourceIds,
  };
}

function actionsFor(input: {
  consensus: FederatedResolverConsensus;
  results: FederatedResolverSourceResult[];
}) {
  const actions: FederatedResolverAction[] = ['do-not-send-private-fields'];
  if (input.consensus.decision === 'accept') actions.push('use-federated-result');
  if (input.consensus.decision === 'review') actions.push('ask-operator-review');
  if (input.consensus.status === 'conflict' || input.consensus.conflictKeys.length > 0) actions.push('check-conflicting-resolvers');
  if (!input.consensus.quorumMet) actions.push('request-more-evidence');
  if (input.results.some(result => result.status === 'timeout')) actions.push('retry-timeout-sources');
  if (input.consensus.decision !== 'accept') actions.push('queue-manual-review');
  return Array.from(new Set(actions));
}

export async function resolveFederatedAddress(input: FederatedResolverInput): Promise<FederatedResolverResult> {
  const mode = input.mode || 'hybrid';
  const domain = normalizeDomain(input.domain || mode);
  const createdAt = (parseDate(input.now) ?? new Date()).toISOString();
  const separation = separatePublicPrivatePayload({
    payload: input.payload,
    mode: modeToSeparationMode(mode),
    domain,
    salt: input.salt,
    now: createdAt,
    highRiskMode: input.highRiskMode,
    allowPublicAgid: input.allowPublicAgid,
  });
  const publicValidation = validatePublicPayloadSeparation(separation.publicPayload);
  const queryId = queryIdFrom(separation.publicPayload, domain, createdAt);
  const baseErrors = unique([
    ...separation.errors,
    ...publicValidation.errors,
  ]);
  const baseWarnings = unique([
    ...separation.warnings,
    ...publicValidation.warnings,
  ]);
  const request: FederatedResolverRequest = {
    version: FEDERATED_RESOLVER_VERSION,
    queryId,
    mode,
    domain,
    createdAt,
    publicPayload: separation.publicPayload,
    commitments: separation.commitments,
    separationAuditFingerprint: separation.auditFingerprint,
  };

  if (separation.blocked || !publicValidation.valid) {
    const consensus: FederatedResolverConsensus = {
      status: 'blocked',
      decision: 'reject',
      confidence: 0,
      agreementCount: 0,
      eligibleSourceCount: 0,
      quorum: input.quorum ?? 2,
      quorumMet: false,
      conflictKeys: [],
      supportingSourceIds: [],
      rejectedSourceIds: input.sources.map(source => source.sourceId),
    };
    return {
      version: FEDERATED_RESOLVER_VERSION,
      queryId,
      mode,
      domain,
      createdAt,
      status: 'blocked',
      decision: 'reject',
      publicRequestPayload: separation.publicPayload,
      commitments: separation.commitments,
      sourceResults: [],
      consensus,
      actions: actionsFor({ consensus, results: [] }),
      warnings: baseWarnings,
      errors: baseErrors,
      auditFingerprint: sha256Hex(stableStringify({ queryId, consensus, baseErrors, baseWarnings })).slice(0, 32),
      privacy: {
        rawAddressSentToFederation: false,
        rawAgidSentToFederation: false,
        rawAoidSentToFederation: false,
        rawCoordinatesSentToFederation: false,
        privatePayloadKeptLocal: true,
        publicPayloadValidated: publicValidation.valid,
      },
    };
  }

  const sourceResults = await Promise.all(input.sources.map(source => callSource(source, request, {
    now: createdAt,
    timeoutMs: input.timeoutMs ?? 750,
  })));
  const consensus = buildConsensus(sourceResults, {
    quorum: Math.max(1, Math.floor(input.quorum ?? 2)),
    minTrustScore: clamp01(input.minTrustScore ?? 0.35),
    minResolvedConfidence: clamp01(input.minResolvedConfidence ?? 0.55),
  });
  const errors = unique([
    ...baseErrors,
    ...sourceResults.flatMap(result => result.errors.map(error => `${result.sourceId}: ${error}`)),
  ]);
  const warnings = unique([
    ...baseWarnings,
    ...sourceResults.flatMap(result => result.warnings.map(warning => `${result.sourceId}: ${warning}`)),
  ]);
  const actions = actionsFor({ consensus, results: sourceResults });
  const auditFingerprint = sha256Hex(stableStringify({
    queryId,
    mode,
    domain,
    consensus,
    sourceSummaries: sourceResults.map(result => ({
      sourceId: result.sourceId,
      status: result.status,
      targetKey: result.targetKey,
      confidence: result.confidence,
      trustScore: result.trustScore,
      errors: result.errors,
    })),
  })).slice(0, 32);

  return {
    version: FEDERATED_RESOLVER_VERSION,
    queryId,
    mode,
    domain,
    createdAt,
    status: consensus.status,
    decision: consensus.decision,
    publicRequestPayload: separation.publicPayload,
    commitments: separation.commitments,
    sourceResults,
    consensus,
    actions,
    warnings,
    errors,
    auditFingerprint,
    privacy: {
      rawAddressSentToFederation: false,
      rawAgidSentToFederation: false,
      rawAoidSentToFederation: false,
      rawCoordinatesSentToFederation: false,
      privatePayloadKeptLocal: true,
      publicPayloadValidated: publicValidation.valid,
    },
  };
}

export function createStaticFederatedResolverSource(input: {
  sourceId: string;
  sourceKind?: FederatedResolverSourceKind;
  trustScore?: number;
  timeoutMs?: number;
  delayMs?: number;
  response: FederatedResolverSourceResponse;
}): FederatedResolverSource {
  return {
    sourceId: input.sourceId,
    sourceKind: input.sourceKind || 'partner-resolver',
    trustScore: input.trustScore ?? 0.7,
    timeoutMs: input.timeoutMs,
    resolve: async () => {
      if (input.delayMs && input.delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, input.delayMs));
      }
      return input.response;
    },
  };
}
