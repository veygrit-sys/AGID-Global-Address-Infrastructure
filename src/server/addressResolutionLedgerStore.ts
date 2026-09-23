import { createHash, randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type {
  AddressResolutionDecision,
  AddressResolutionMode,
  AddressResolutionStatus,
  AddressResolutionSystemResult,
} from '../lib/addressResolutionSystem';
import { assertDatabaseProductionReady } from './databaseProductionGuard';

export const ADDRESS_RESOLUTION_LEDGER_VERSION = 'address-resolution-ledger-v1';

export type AddressResolutionLedgerStorageMode = 'memory' | 'sqlite' | 'postgres' | 'redis' | 'mongodb';

export type AddressResolutionLedgerAggregateKind =
  | 'address-reference'
  | 'agid'
  | 'aoid'
  | 'credential'
  | 'pid'
  | 'delivery'
  | 'resolution';

export type AddressResolutionLedgerEventType =
  | 'resolution-recorded'
  | 'address-registered'
  | 'address-corrected'
  | 'credential-issued'
  | 'credential-revoked'
  | 'pid-issued'
  | 'pid-merged'
  | 'pid-split'
  | 'delivery-accepted'
  | 'handoff-completed'
  | 'review-requested';

export type AddressResolutionLedgerPrivacyPosture = {
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawCoordinatesStored: false;
  recipientIdentityStored: false;
  canonicalAddressStored: false;
  publicFieldsOnly: true;
};

export type AddressResolutionLedgerResolutionRecord = AddressResolutionLedgerPrivacyPosture & {
  resolutionId: string;
  mode: AddressResolutionMode;
  domain: string;
  status: AddressResolutionStatus;
  decision: AddressResolutionDecision;
  confidence: number;
  languageTag?: string;
  createdAt: string;
  auditFingerprint: string;
  warningCount: number;
  errorCount: number;
};

export type AddressResolutionLedgerCommitmentRecord = {
  commitmentId: string;
  resolutionId: string;
  commitmentKind: 'address-reference' | 'agid' | 'aoid' | 'credential' | 'other';
  commitmentHash: string;
  scope: string;
  createdAt: string;
};

export type AddressResolutionLedgerEvidenceRecord = {
  evidenceId: string;
  resolutionId: string;
  sourceKind:
    | 'address-verification'
    | 'federated-resolver'
    | 'registry'
    | 'address-dns'
    | 'internet-protocol'
    | 'agid-core'
    | 'unknown';
  sourceId: string;
  status: string;
  confidence?: number;
  evidenceHash: string;
  observedAt: string;
};

export type AddressResolutionLedgerStepRecord = {
  stepId: string;
  resolutionId: string;
  stepName:
    | 'address-verification'
    | 'federated-consensus'
    | 'registry-check'
    | 'address-dns-record'
    | 'internet-protocol-checks'
    | 'final-decision';
  status: 'passed' | 'failed' | 'skipped' | 'review';
  inputCommitment?: string;
  outputCommitment?: string;
  completedAt: string;
};

export type AddressResolutionLedgerNullifierRecord = {
  nullifierHash: string;
  resolutionId: string;
  scope: string;
  usage: string;
  usedAt: string;
  expiresAt?: string;
};

export type AddressResolutionLedgerEventRecord = AddressResolutionLedgerPrivacyPosture & {
  eventId: string;
  streamId: string;
  aggregateKind: AddressResolutionLedgerAggregateKind;
  aggregateId: string;
  eventType: AddressResolutionLedgerEventType;
  eventVersion: number;
  sequence: number;
  occurredAt: string;
  resolutionId?: string;
  actorCommitment?: string;
  causationId?: string;
  correlationId?: string;
  payloadHash: string;
  payloadJson: string;
  previousEventHash?: string;
  eventHash: string;
};

export type AddressResolutionLedgerSnapshotRecord = AddressResolutionLedgerPrivacyPosture & {
  snapshotId: string;
  streamId: string;
  aggregateKind: AddressResolutionLedgerAggregateKind;
  aggregateId: string;
  sequence: number;
  validFrom: string;
  validTo?: string;
  status: AddressResolutionStatus;
  decision: AddressResolutionDecision;
  confidence: number;
  stateHash: string;
  lastEventId: string;
  lastEventHash: string;
  resolutionId?: string;
};

export type AddressResolutionLedgerEntry = {
  resolution: AddressResolutionLedgerResolutionRecord;
  commitments: AddressResolutionLedgerCommitmentRecord[];
  evidence: AddressResolutionLedgerEvidenceRecord[];
  steps: AddressResolutionLedgerStepRecord[];
  nullifiers: AddressResolutionLedgerNullifierRecord[];
};

export type AddressResolutionLedgerWriteReceipt = AddressResolutionLedgerPrivacyPosture & {
  ledgerVersion: typeof ADDRESS_RESOLUTION_LEDGER_VERSION;
  storageMode: AddressResolutionLedgerStorageMode;
  resolutionId: string;
  streamId: string;
  temporalSequence: number;
  temporalSnapshotId: string;
  recorded: true;
  commitmentCount: number;
  evidenceCount: number;
  stepCount: number;
  nullifierCount: number;
  eventCount: number;
  snapshotCount: number;
  recordedAt: string;
};

export type AddressResolutionLedgerStats = AddressResolutionLedgerPrivacyPosture & {
  ledgerVersion: typeof ADDRESS_RESOLUTION_LEDGER_VERSION;
  storageMode: AddressResolutionLedgerStorageMode;
  resolutionCount: number;
  commitmentCount: number;
  evidenceCount: number;
  stepCount: number;
  nullifierCount: number;
  eventCount: number;
  snapshotCount: number;
};

export type AddressResolutionLedgerRecordOptions = {
  nullifierHash?: string;
  nullifierScope?: string;
  nullifierUsage?: string;
  nullifierExpiresAt?: string;
};

export type AddressResolutionLedgerEventInput = {
  streamId?: string;
  aggregateKind?: AddressResolutionLedgerAggregateKind;
  aggregateId?: string;
  eventType: AddressResolutionLedgerEventType;
  eventVersion?: number;
  occurredAt?: string;
  resolutionId?: string;
  actorCommitment?: string;
  causationId?: string;
  correlationId?: string;
  payload?: Record<string, unknown>;
};

export type AddressResolutionLedgerStoreAdapter = {
  readonly storageMode: AddressResolutionLedgerStorageMode;
  recordResolution(
    result: AddressResolutionSystemResult,
    options?: AddressResolutionLedgerRecordOptions,
  ): Promise<AddressResolutionLedgerWriteReceipt>;
  recordEvent(input: AddressResolutionLedgerEventInput): Promise<AddressResolutionLedgerEventRecord>;
  getResolution(resolutionId: string): Promise<AddressResolutionLedgerEntry | null>;
  getEventStream(streamId: string, limit?: number): Promise<AddressResolutionLedgerEventRecord[]>;
  getSnapshot(streamId: string, at?: string): Promise<AddressResolutionLedgerSnapshotRecord | null>;
  recent(limit?: number): Promise<AddressResolutionLedgerResolutionRecord[]>;
  stats(): Promise<AddressResolutionLedgerStats>;
};

export type ConfiguredAddressResolutionLedgerStoreInput = {
  storageMode?: AddressResolutionLedgerStorageMode;
  sqlitePath?: string;
  postgresUrl?: string;
  redisUrl?: string;
  redisKeyPrefix?: string;
  mongodbUrl?: string;
  mongodbDbName?: string;
  mongodbCollectionPrefix?: string;
};

const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;

const PRIVACY_POSTURE: AddressResolutionLedgerPrivacyPosture = {
  rawAddressStored: false,
  rawAgidStored: false,
  rawAoidStored: false,
  rawCoordinatesStored: false,
  recipientIdentityStored: false,
  canonicalAddressStored: false,
  publicFieldsOnly: true,
};

const FORBIDDEN_LEDGER_KEYS = [
  'address',
  'addressText',
  'canonicalAddress',
  'rawAddress',
  'agid',
  'rawAgid',
  'aoid',
  'rawAoid',
  'lat',
  'lon',
  'lng',
  'latitude',
  'longitude',
  'coordinates',
  'recipient',
  'recipientName',
  'phone',
  'email',
  'building',
  'room',
  'unit',
  'apartment',
];

const DEFAULT_SQLITE_PATH = () => process.env.AGID_ADDRESS_LEDGER_SQLITE_PATH
  || join(process.cwd(), '.agid-runtime', 'address-resolution-ledger.sqlite');

function nowIso(now = Date.now()) {
  return new Date(now).toISOString();
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFKC').trim() : '';
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Math.round(value * 10000) / 10000));
}

function hash(value: unknown) {
  return createHash('sha256')
    .update(stableStringify(value))
    .digest('hex');
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

function safeId(prefix: string, value: unknown) {
  return `${prefix}-${hash(value).slice(0, 24).toUpperCase()}`;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function cleanLimit(limit = 25) {
  return Math.max(1, Math.min(Number.isFinite(limit) ? Math.floor(limit) : 25, 200));
}

function commitmentKindFor(
  commitment: string,
  result: AddressResolutionSystemResult,
): AddressResolutionLedgerCommitmentRecord['commitmentKind'] {
  if (commitment === result.commitments.addressReferenceCommitment) return 'address-reference';
  if (commitment === result.commitments.agidCommitment) return 'agid';
  if (commitment === result.commitments.aoidCommitment) return 'aoid';
  if (commitment === result.commitments.credentialCommitment) return 'credential';
  return 'other';
}

function sourceKindFor(sourceId: string): AddressResolutionLedgerEvidenceRecord['sourceKind'] {
  const normalized = sourceId.toLowerCase();
  if (normalized.includes('verification') || normalized.includes('postal') || normalized.includes('format')) {
    return 'address-verification';
  }
  if (normalized.includes('federated') || normalized.includes('resolver')) return 'federated-resolver';
  if (normalized.includes('registry')) return 'registry';
  if (normalized.includes('address-dns')) return 'address-dns';
  if (normalized.includes('protocol') || normalized.includes('route') || normalized.includes('service')) {
    return 'internet-protocol';
  }
  if (normalized.includes('agid')) return 'agid-core';
  return 'unknown';
}

function statusToStepStatus(status: string): AddressResolutionLedgerStepRecord['status'] {
  if (status === 'resolved' || status === 'verified' || status === 'valid' || status === 'accept') return 'passed';
  if (status === 'partial' || status === 'conflict' || status === 'review') return 'review';
  if (status === 'missing' || status === 'skipped' || status === 'not-configured') return 'skipped';
  return 'failed';
}

function streamIdFor(kind: AddressResolutionLedgerAggregateKind, aggregateId: string) {
  return `arl-stream:${kind}:${hash(aggregateId).slice(0, 32)}`;
}

function primaryAggregateFor(entry: AddressResolutionLedgerEntry) {
  const addressReference = entry.commitments.find(item => item.commitmentKind === 'address-reference')?.commitmentHash;
  const agidReference = entry.commitments.find(item => item.commitmentKind === 'agid')?.commitmentHash;
  const aggregateId = addressReference || agidReference || entry.resolution.auditFingerprint || entry.resolution.resolutionId;
  const aggregateKind: AddressResolutionLedgerAggregateKind = addressReference
    ? 'address-reference'
    : agidReference
      ? 'agid'
      : 'resolution';
  return {
    aggregateKind,
    aggregateId,
    streamId: streamIdFor(aggregateKind, aggregateId),
  };
}

function createResolutionRecordedEventInput(entry: AddressResolutionLedgerEntry): AddressResolutionLedgerEventInput {
  const aggregate = primaryAggregateFor(entry);
  return {
    ...aggregate,
    eventType: 'resolution-recorded',
    eventVersion: 1,
    occurredAt: entry.resolution.createdAt,
    resolutionId: entry.resolution.resolutionId,
    correlationId: entry.resolution.auditFingerprint,
    payload: {
      mode: entry.resolution.mode,
      domain: entry.resolution.domain,
      status: entry.resolution.status,
      decision: entry.resolution.decision,
      confidence: entry.resolution.confidence,
      languageTag: entry.resolution.languageTag,
      auditFingerprint: entry.resolution.auditFingerprint,
      warningCount: entry.resolution.warningCount,
      errorCount: entry.resolution.errorCount,
      commitmentCount: entry.commitments.length,
      evidenceCount: entry.evidence.length,
      stepCount: entry.steps.length,
      nullifierCount: entry.nullifiers.length,
      commitmentKinds: unique(entry.commitments.map(item => item.commitmentKind)),
      stepStatuses: entry.steps.map(item => ({
        stepName: item.stepName,
        status: item.status,
      })),
    },
  };
}

function safeParsePayload(payloadJson: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(payloadJson);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function statusFromPayload(payload: Record<string, unknown>): AddressResolutionStatus {
  const status = clean(payload.status);
  if (
    status === 'resolved'
    || status === 'partial'
    || status === 'unresolved'
    || status === 'conflict'
    || status === 'blocked'
    || status === 'rejected'
  ) {
    return status;
  }
  return 'partial';
}

function decisionFromPayload(payload: Record<string, unknown>): AddressResolutionDecision {
  const decision = clean(payload.decision);
  if (decision === 'accept' || decision === 'review' || decision === 'reject') return decision;
  return 'review';
}

export function createAddressResolutionLedgerEventRecord(
  input: AddressResolutionLedgerEventInput,
  sequence: number,
  previousEventHash?: string,
): AddressResolutionLedgerEventRecord {
  const aggregateKind = input.aggregateKind || 'resolution';
  const aggregateId = clean(input.aggregateId) || clean(input.resolutionId) || `aggregate-${randomUUID()}`;
  const streamId = clean(input.streamId) || streamIdFor(aggregateKind, aggregateId);
  const occurredAt = clean(input.occurredAt) || nowIso();
  const payload = input.payload || {};
  const payloadJson = stableStringify(payload);
  const payloadHash = `0x${hash({
    ledgerVersion: ADDRESS_RESOLUTION_LEDGER_VERSION,
    streamId,
    aggregateKind,
    aggregateId,
    eventType: input.eventType,
    payload,
  })}`;
  const eventSeed = {
    streamId,
    aggregateKind,
    aggregateId,
    eventType: input.eventType,
    eventVersion: input.eventVersion || 1,
    sequence,
    occurredAt,
    resolutionId: clean(input.resolutionId),
    actorCommitment: clean(input.actorCommitment),
    causationId: clean(input.causationId),
    correlationId: clean(input.correlationId),
    payloadHash,
    previousEventHash: clean(previousEventHash),
  };
  const event: AddressResolutionLedgerEventRecord = {
    ...PRIVACY_POSTURE,
    eventId: safeId('ARLEV', eventSeed),
    streamId,
    aggregateKind,
    aggregateId,
    eventType: input.eventType,
    eventVersion: input.eventVersion || 1,
    sequence,
    occurredAt,
    ...(clean(input.resolutionId) ? { resolutionId: clean(input.resolutionId) } : {}),
    ...(clean(input.actorCommitment) ? { actorCommitment: clean(input.actorCommitment) } : {}),
    ...(clean(input.causationId) ? { causationId: clean(input.causationId) } : {}),
    ...(clean(input.correlationId) ? { correlationId: clean(input.correlationId) } : {}),
    payloadHash,
    payloadJson,
    ...(clean(previousEventHash) ? { previousEventHash: clean(previousEventHash) } : {}),
    eventHash: `0x${hash(eventSeed)}`,
  };

  assertNoForbiddenLedgerKeys(event);
  assertNoForbiddenLedgerKeys(payload);
  return event;
}

export function createAddressResolutionLedgerSnapshot(
  event: AddressResolutionLedgerEventRecord,
): AddressResolutionLedgerSnapshotRecord {
  const payload = safeParsePayload(event.payloadJson);
  const status = statusFromPayload(payload);
  const decision = decisionFromPayload(payload);
  const confidence = clamp01(typeof payload.confidence === 'number' ? payload.confidence : 0);
  const stateHash = `0x${hash({
    streamId: event.streamId,
    aggregateKind: event.aggregateKind,
    aggregateId: event.aggregateId,
    sequence: event.sequence,
    status,
    decision,
    confidence,
    eventHash: event.eventHash,
    payloadHash: event.payloadHash,
  })}`;
  const snapshot: AddressResolutionLedgerSnapshotRecord = {
    ...PRIVACY_POSTURE,
    snapshotId: safeId('ARLTS', {
      streamId: event.streamId,
      sequence: event.sequence,
      eventHash: event.eventHash,
    }),
    streamId: event.streamId,
    aggregateKind: event.aggregateKind,
    aggregateId: event.aggregateId,
    sequence: event.sequence,
    validFrom: event.occurredAt,
    status,
    decision,
    confidence,
    stateHash,
    lastEventId: event.eventId,
    lastEventHash: event.eventHash,
    ...(event.resolutionId ? { resolutionId: event.resolutionId } : {}),
  };

  assertNoForbiddenLedgerKeys(snapshot);
  return snapshot;
}

function assertNoForbiddenLedgerKeys(value: unknown, path: string[] = []) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenLedgerKeys(item, [...path, String(index)]));
    return;
  }

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_LEDGER_KEYS.includes(key)) {
      throw new Error(`address-resolution-ledger-forbidden-key:${[...path, key].join('.')}`);
    }
    assertNoForbiddenLedgerKeys(nested, [...path, key]);
  }
}

export function createAddressResolutionLedgerEntry(
  result: AddressResolutionSystemResult,
  options: AddressResolutionLedgerRecordOptions = {},
): AddressResolutionLedgerEntry {
  const createdAt = clean(result.createdAt) || nowIso();
  const scope = clean(options.nullifierScope) || clean(result.domain) || 'address-resolution';
  const commitments = unique(result.commitments.all || [])
    .filter(Boolean)
    .map((commitment): AddressResolutionLedgerCommitmentRecord => ({
      commitmentId: safeId('ARLC', {
        resolutionId: result.resolutionId,
        commitment,
        scope,
      }),
      resolutionId: result.resolutionId,
      commitmentKind: commitmentKindFor(commitment, result),
      commitmentHash: commitment,
      scope,
      createdAt,
    }));

  const sources = unique([
    ...result.sources,
    ...result.federated.sourceResults.map(source => source.sourceId),
    ...result.verification.sources,
  ]).filter(Boolean);

  const evidence = sources.map((sourceId): AddressResolutionLedgerEvidenceRecord => ({
    evidenceId: safeId('ARLE', {
      resolutionId: result.resolutionId,
      sourceId,
      auditFingerprint: result.auditFingerprint,
    }),
    resolutionId: result.resolutionId,
    sourceKind: sourceKindFor(sourceId),
    sourceId,
    status: result.status,
    confidence: result.confidence,
    evidenceHash: `0x${hash({
      sourceId,
      status: result.status,
      decision: result.decision,
      auditFingerprint: result.auditFingerprint,
    })}`,
    observedAt: createdAt,
  }));

  const addressCommitment = result.commitments.addressReferenceCommitment;
  const outputCommitment = result.commitments.agidCommitment || result.commitments.addressReferenceCommitment;
  const steps: AddressResolutionLedgerStepRecord[] = [
    {
      stepId: safeId('ARLS', [result.resolutionId, 'address-verification']),
      resolutionId: result.resolutionId,
      stepName: 'address-verification',
      status: statusToStepStatus(result.verification.status),
      inputCommitment: addressCommitment,
      outputCommitment: addressCommitment,
      completedAt: createdAt,
    },
    {
      stepId: safeId('ARLS', [result.resolutionId, 'federated-consensus']),
      resolutionId: result.resolutionId,
      stepName: 'federated-consensus',
      status: statusToStepStatus(result.federated.status),
      inputCommitment: addressCommitment,
      outputCommitment,
      completedAt: createdAt,
    },
    {
      stepId: safeId('ARLS', [result.resolutionId, 'registry-check']),
      resolutionId: result.resolutionId,
      stepName: 'registry-check',
      status: result.registryVerification
        ? result.registryVerification.valid ? 'passed' : 'failed'
        : 'skipped',
      inputCommitment: addressCommitment,
      outputCommitment: result.registryVerification?.freshness.root,
      completedAt: result.registryVerification?.checkedAt || createdAt,
    },
    {
      stepId: safeId('ARLS', [result.resolutionId, 'address-dns-record']),
      resolutionId: result.resolutionId,
      stepName: 'address-dns-record',
      status: result.addressDnsRecord ? 'passed' : 'skipped',
      inputCommitment: addressCommitment,
      outputCommitment: result.addressDnsRecord?.recordHash,
      completedAt: createdAt,
    },
    {
      stepId: safeId('ARLS', [result.resolutionId, 'internet-protocol-checks']),
      resolutionId: result.resolutionId,
      stepName: 'internet-protocol-checks',
      status: result.errors.length === 0 ? 'passed' : result.decision === 'review' ? 'review' : 'failed',
      inputCommitment: addressCommitment,
      outputCommitment: result.auditFingerprint,
      completedAt: createdAt,
    },
    {
      stepId: safeId('ARLS', [result.resolutionId, 'final-decision']),
      resolutionId: result.resolutionId,
      stepName: 'final-decision',
      status: result.decision === 'accept' ? 'passed' : result.decision === 'review' ? 'review' : 'failed',
      inputCommitment: addressCommitment,
      outputCommitment: result.auditFingerprint,
      completedAt: createdAt,
    },
  ];

  const nullifierHash = clean(options.nullifierHash);
  const nullifiers: AddressResolutionLedgerNullifierRecord[] = nullifierHash
    ? [{
        nullifierHash,
        resolutionId: result.resolutionId,
        scope,
        usage: clean(options.nullifierUsage) || 'address-resolution',
        usedAt: createdAt,
        ...(clean(options.nullifierExpiresAt) ? { expiresAt: clean(options.nullifierExpiresAt) } : {}),
      }]
    : [];

  const entry: AddressResolutionLedgerEntry = {
    resolution: {
      ...PRIVACY_POSTURE,
      resolutionId: result.resolutionId,
      mode: result.mode,
      domain: result.domain,
      status: result.status,
      decision: result.decision,
      confidence: clamp01(result.confidence),
      ...(clean(result.displayHints.language) ? { languageTag: clean(result.displayHints.language) } : {}),
      createdAt,
      auditFingerprint: result.auditFingerprint,
      warningCount: result.warnings.length,
      errorCount: result.errors.length,
    },
    commitments,
    evidence,
    steps,
    nullifiers,
  };

  assertNoForbiddenLedgerKeys(entry);
  return entry;
}

function writeReceipt(
  storageMode: AddressResolutionLedgerStorageMode,
  entry: AddressResolutionLedgerEntry,
  event: AddressResolutionLedgerEventRecord,
  snapshot: AddressResolutionLedgerSnapshotRecord,
): AddressResolutionLedgerWriteReceipt {
  return {
    ...PRIVACY_POSTURE,
    ledgerVersion: ADDRESS_RESOLUTION_LEDGER_VERSION,
    storageMode,
    resolutionId: entry.resolution.resolutionId,
    streamId: event.streamId,
    temporalSequence: event.sequence,
    temporalSnapshotId: snapshot.snapshotId,
    recorded: true,
    commitmentCount: entry.commitments.length,
    evidenceCount: entry.evidence.length,
    stepCount: entry.steps.length,
    nullifierCount: entry.nullifiers.length,
    eventCount: 1,
    snapshotCount: 1,
    recordedAt: nowIso(),
  };
}

abstract class BaseAddressResolutionLedgerStore implements AddressResolutionLedgerStoreAdapter {
  protected constructor(public readonly storageMode: AddressResolutionLedgerStorageMode) {}

  async recordResolution(
    result: AddressResolutionSystemResult,
    options: AddressResolutionLedgerRecordOptions = {},
  ): Promise<AddressResolutionLedgerWriteReceipt> {
    const entry = createAddressResolutionLedgerEntry(result, options);
    await this.writeEntry(entry);
    const event = await this.recordEvent(createResolutionRecordedEventInput(entry));
    const snapshot = await this.getSnapshot(event.streamId);
    if (!snapshot) {
      throw new Error('address-resolution-ledger-temporal-snapshot-not-created');
    }
    return writeReceipt(this.storageMode, entry, event, snapshot);
  }

  async recordEvent(input: AddressResolutionLedgerEventInput): Promise<AddressResolutionLedgerEventRecord> {
    const event = await this.appendEvent(input);
    await this.writeSnapshot(createAddressResolutionLedgerSnapshot(event));
    return event;
  }

  abstract getResolution(resolutionId: string): Promise<AddressResolutionLedgerEntry | null>;
  abstract getEventStream(streamId: string, limit?: number): Promise<AddressResolutionLedgerEventRecord[]>;
  abstract getSnapshot(streamId: string, at?: string): Promise<AddressResolutionLedgerSnapshotRecord | null>;
  abstract recent(limit?: number): Promise<AddressResolutionLedgerResolutionRecord[]>;
  abstract stats(): Promise<AddressResolutionLedgerStats>;
  protected abstract appendEvent(input: AddressResolutionLedgerEventInput): Promise<AddressResolutionLedgerEventRecord>;
  protected abstract writeSnapshot(snapshot: AddressResolutionLedgerSnapshotRecord): Promise<void>;
  protected abstract writeEntry(entry: AddressResolutionLedgerEntry): Promise<void>;
}

export class InMemoryAddressResolutionLedgerStore extends BaseAddressResolutionLedgerStore {
  private readonly resolutions = new Map<string, AddressResolutionLedgerResolutionRecord>();
  private readonly commitments = new Map<string, AddressResolutionLedgerCommitmentRecord>();
  private readonly evidence = new Map<string, AddressResolutionLedgerEvidenceRecord>();
  private readonly steps = new Map<string, AddressResolutionLedgerStepRecord>();
  private readonly nullifiers = new Map<string, AddressResolutionLedgerNullifierRecord>();
  private readonly events = new Map<string, AddressResolutionLedgerEventRecord>();
  private readonly streamEvents = new Map<string, string[]>();
  private readonly snapshots = new Map<string, AddressResolutionLedgerSnapshotRecord[]>();

  constructor() {
    super('memory');
  }

  async getResolution(resolutionId: string): Promise<AddressResolutionLedgerEntry | null> {
    const resolution = this.resolutions.get(resolutionId);
    if (!resolution) return null;
    return {
      resolution,
      commitments: Array.from(this.commitments.values()).filter(item => item.resolutionId === resolutionId),
      evidence: Array.from(this.evidence.values()).filter(item => item.resolutionId === resolutionId),
      steps: Array.from(this.steps.values()).filter(item => item.resolutionId === resolutionId),
      nullifiers: Array.from(this.nullifiers.values()).filter(item => item.resolutionId === resolutionId),
    };
  }

  async recent(limit = 25): Promise<AddressResolutionLedgerResolutionRecord[]> {
    return Array.from(this.resolutions.values())
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, cleanLimit(limit));
  }

  async getEventStream(streamId: string, limit = 100): Promise<AddressResolutionLedgerEventRecord[]> {
    const eventIds = this.streamEvents.get(streamId) || [];
    return eventIds
      .slice(-cleanLimit(limit))
      .map(eventId => this.events.get(eventId))
      .filter((item): item is AddressResolutionLedgerEventRecord => Boolean(item));
  }

  async getSnapshot(streamId: string, at?: string): Promise<AddressResolutionLedgerSnapshotRecord | null> {
    const snapshots = this.snapshots.get(streamId) || [];
    if (!snapshots.length) return null;
    const timestamp = clean(at);
    if (!timestamp) return snapshots[snapshots.length - 1] ?? null;
    return snapshots
      .filter(item => item.validFrom <= timestamp && (!item.validTo || item.validTo > timestamp))
      .sort((left, right) => right.sequence - left.sequence)[0] ?? null;
  }

  async stats(): Promise<AddressResolutionLedgerStats> {
    return {
      ...PRIVACY_POSTURE,
      ledgerVersion: ADDRESS_RESOLUTION_LEDGER_VERSION,
      storageMode: this.storageMode,
      resolutionCount: this.resolutions.size,
      commitmentCount: this.commitments.size,
      evidenceCount: this.evidence.size,
      stepCount: this.steps.size,
      nullifierCount: this.nullifiers.size,
      eventCount: this.events.size,
      snapshotCount: Array.from(this.snapshots.values()).reduce((sum, items) => sum + items.length, 0),
    };
  }

  protected async appendEvent(input: AddressResolutionLedgerEventInput): Promise<AddressResolutionLedgerEventRecord> {
    const streamId = clean(input.streamId) || streamIdFor(input.aggregateKind || 'resolution', clean(input.aggregateId) || clean(input.resolutionId) || 'resolution');
    const fullInput = { ...input, streamId };
    const stream = this.streamEvents.get(streamId) || [];
    const previousEvent = stream.length ? this.events.get(stream[stream.length - 1]) : undefined;
    const event = createAddressResolutionLedgerEventRecord(fullInput, stream.length + 1, previousEvent?.eventHash);
    const nextStream = [...stream, event.eventId];
    this.events.set(event.eventId, event);
    this.streamEvents.set(event.streamId, nextStream);
    return event;
  }

  protected async writeSnapshot(snapshot: AddressResolutionLedgerSnapshotRecord): Promise<void> {
    const existing = this.snapshots.get(snapshot.streamId) || [];
    const previous = existing[existing.length - 1];
    if (previous && !previous.validTo) {
      previous.validTo = snapshot.validFrom;
    }
    this.snapshots.set(snapshot.streamId, [...existing, snapshot]);
  }

  protected async writeEntry(entry: AddressResolutionLedgerEntry): Promise<void> {
    this.resolutions.set(entry.resolution.resolutionId, entry.resolution);
    entry.commitments.forEach(item => this.commitments.set(item.commitmentId, item));
    entry.evidence.forEach(item => this.evidence.set(item.evidenceId, item));
    entry.steps.forEach(item => this.steps.set(item.stepId, item));
    entry.nullifiers.forEach(item => this.nullifiers.set(item.nullifierHash, item));
  }
}

const SQLITE_SCHEMA = `
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  CREATE TABLE IF NOT EXISTS address_resolution (
    resolution_id TEXT PRIMARY KEY,
    mode TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL,
    decision TEXT NOT NULL,
    confidence REAL NOT NULL,
    language_tag TEXT,
    created_at TEXT NOT NULL,
    audit_fingerprint TEXT NOT NULL,
    warning_count INTEGER NOT NULL,
    error_count INTEGER NOT NULL,
    raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0)
  );
  CREATE TABLE IF NOT EXISTS address_commitment (
    commitment_id TEXT PRIMARY KEY,
    resolution_id TEXT NOT NULL,
    commitment_kind TEXT NOT NULL,
    commitment_hash TEXT NOT NULL,
    scope TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(commitment_hash, scope, commitment_kind)
  );
  CREATE TABLE IF NOT EXISTS resolution_evidence (
    evidence_id TEXT PRIMARY KEY,
    resolution_id TEXT NOT NULL,
    source_kind TEXT NOT NULL,
    source_id TEXT NOT NULL,
    status TEXT NOT NULL,
    confidence REAL,
    evidence_hash TEXT NOT NULL,
    observed_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS resolution_step (
    step_id TEXT PRIMARY KEY,
    resolution_id TEXT NOT NULL,
    step_name TEXT NOT NULL,
    status TEXT NOT NULL,
    input_commitment TEXT,
    output_commitment TEXT,
    completed_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS address_nullifier (
    nullifier_hash TEXT PRIMARY KEY,
    resolution_id TEXT NOT NULL,
    scope TEXT NOT NULL,
    usage TEXT NOT NULL,
    used_at TEXT NOT NULL,
    expires_at TEXT
  );
  CREATE TABLE IF NOT EXISTS address_resolution_event (
    event_id TEXT PRIMARY KEY,
    stream_id TEXT NOT NULL,
    aggregate_kind TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_version INTEGER NOT NULL,
    sequence INTEGER NOT NULL,
    occurred_at TEXT NOT NULL,
    resolution_id TEXT,
    actor_commitment TEXT,
    causation_id TEXT,
    correlation_id TEXT,
    payload_hash TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    previous_event_hash TEXT,
    event_hash TEXT NOT NULL,
    raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0),
    UNIQUE(stream_id, sequence)
  );
  CREATE TABLE IF NOT EXISTS address_temporal_snapshot (
    snapshot_id TEXT PRIMARY KEY,
    stream_id TEXT NOT NULL,
    aggregate_kind TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    valid_from TEXT NOT NULL,
    valid_to TEXT,
    status TEXT NOT NULL,
    decision TEXT NOT NULL,
    confidence REAL NOT NULL,
    state_hash TEXT NOT NULL,
    last_event_id TEXT NOT NULL,
    last_event_hash TEXT NOT NULL,
    resolution_id TEXT,
    raw_private_material_stored INTEGER NOT NULL DEFAULT 0 CHECK (raw_private_material_stored = 0)
  );
  CREATE INDEX IF NOT EXISTS address_resolution_created_at_idx ON address_resolution(created_at);
  CREATE INDEX IF NOT EXISTS address_resolution_decision_idx ON address_resolution(decision, status);
  CREATE INDEX IF NOT EXISTS address_commitment_scope_idx ON address_commitment(scope, commitment_kind);
  CREATE INDEX IF NOT EXISTS resolution_evidence_source_idx ON resolution_evidence(source_kind, source_id);
  CREATE INDEX IF NOT EXISTS address_resolution_event_stream_idx ON address_resolution_event(stream_id, sequence);
  CREATE INDEX IF NOT EXISTS address_resolution_event_hash_idx ON address_resolution_event(event_hash);
  CREATE INDEX IF NOT EXISTS address_temporal_snapshot_stream_idx ON address_temporal_snapshot(stream_id, valid_from, valid_to);
`;

export class SqliteAddressResolutionLedgerStore extends BaseAddressResolutionLedgerStore {
  private dbPromise: Promise<any> | null = null;

  constructor(private readonly databasePath = DEFAULT_SQLITE_PATH()) {
    super('sqlite');
  }

  async getResolution(resolutionId: string): Promise<AddressResolutionLedgerEntry | null> {
    const db = await this.db();
    const row = db.prepare('SELECT * FROM address_resolution WHERE resolution_id = ?').get(resolutionId);
    if (!row) return null;
    return {
      resolution: this.rowToResolution(row),
      commitments: db.prepare('SELECT * FROM address_commitment WHERE resolution_id = ? ORDER BY created_at').all(resolutionId).map((item: any) => this.rowToCommitment(item)),
      evidence: db.prepare('SELECT * FROM resolution_evidence WHERE resolution_id = ? ORDER BY observed_at').all(resolutionId).map((item: any) => this.rowToEvidence(item)),
      steps: db.prepare('SELECT * FROM resolution_step WHERE resolution_id = ? ORDER BY completed_at').all(resolutionId).map((item: any) => this.rowToStep(item)),
      nullifiers: db.prepare('SELECT * FROM address_nullifier WHERE resolution_id = ? ORDER BY used_at').all(resolutionId).map((item: any) => this.rowToNullifier(item)),
    };
  }

  async recent(limit = 25): Promise<AddressResolutionLedgerResolutionRecord[]> {
    const db = await this.db();
    return db.prepare('SELECT * FROM address_resolution ORDER BY created_at DESC LIMIT ?')
      .all(cleanLimit(limit))
      .map((item: any) => this.rowToResolution(item));
  }

  async getEventStream(streamId: string, limit = 100): Promise<AddressResolutionLedgerEventRecord[]> {
    const db = await this.db();
    return db.prepare('SELECT * FROM address_resolution_event WHERE stream_id = ? ORDER BY sequence DESC LIMIT ?')
      .all(streamId, cleanLimit(limit))
      .reverse()
      .map((item: any) => this.rowToEvent(item));
  }

  async getSnapshot(streamId: string, at?: string): Promise<AddressResolutionLedgerSnapshotRecord | null> {
    const db = await this.db();
    const timestamp = clean(at);
    const row = timestamp
      ? db.prepare(`
          SELECT * FROM address_temporal_snapshot
          WHERE stream_id = ? AND valid_from <= ? AND (valid_to IS NULL OR valid_to > ?)
          ORDER BY sequence DESC
          LIMIT 1
        `).get(streamId, timestamp, timestamp)
      : db.prepare(`
          SELECT * FROM address_temporal_snapshot
          WHERE stream_id = ?
          ORDER BY sequence DESC
          LIMIT 1
        `).get(streamId);
    return row ? this.rowToSnapshot(row) : null;
  }

  async stats(): Promise<AddressResolutionLedgerStats> {
    const db = await this.db();
    const count = (table: string) => Number(db.prepare(`SELECT COUNT(*) AS value FROM ${table}`).get().value ?? 0);
    return {
      ...PRIVACY_POSTURE,
      ledgerVersion: ADDRESS_RESOLUTION_LEDGER_VERSION,
      storageMode: this.storageMode,
      resolutionCount: count('address_resolution'),
      commitmentCount: count('address_commitment'),
      evidenceCount: count('resolution_evidence'),
      stepCount: count('resolution_step'),
      nullifierCount: count('address_nullifier'),
      eventCount: count('address_resolution_event'),
      snapshotCount: count('address_temporal_snapshot'),
    };
  }

  protected async appendEvent(input: AddressResolutionLedgerEventInput): Promise<AddressResolutionLedgerEventRecord> {
    const db = await this.db();
    const streamId = clean(input.streamId) || streamIdFor(input.aggregateKind || 'resolution', clean(input.aggregateId) || clean(input.resolutionId) || 'resolution');
    const fullInput = { ...input, streamId };
    const previous = db.prepare('SELECT * FROM address_resolution_event WHERE stream_id = ? ORDER BY sequence DESC LIMIT 1').get(streamId);
    const sequence = Number(previous?.sequence ?? 0) + 1;
    const event = createAddressResolutionLedgerEventRecord(fullInput, sequence, previous?.event_hash);
    db.prepare(`
      INSERT INTO address_resolution_event
        (event_id, stream_id, aggregate_kind, aggregate_id, event_type, event_version, sequence, occurred_at, resolution_id, actor_commitment, causation_id, correlation_id, payload_hash, payload_json, previous_event_hash, event_hash, raw_private_material_stored)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      event.eventId,
      event.streamId,
      event.aggregateKind,
      event.aggregateId,
      event.eventType,
      event.eventVersion,
      event.sequence,
      event.occurredAt,
      event.resolutionId ?? null,
      event.actorCommitment ?? null,
      event.causationId ?? null,
      event.correlationId ?? null,
      event.payloadHash,
      event.payloadJson,
      event.previousEventHash ?? null,
      event.eventHash,
    );
    return event;
  }

  protected async writeSnapshot(snapshot: AddressResolutionLedgerSnapshotRecord): Promise<void> {
    const db = await this.db();
    db.prepare(`
      UPDATE address_temporal_snapshot
      SET valid_to = ?
      WHERE stream_id = ? AND valid_to IS NULL AND sequence < ?
    `).run(snapshot.validFrom, snapshot.streamId, snapshot.sequence);
    db.prepare(`
      INSERT OR REPLACE INTO address_temporal_snapshot
        (snapshot_id, stream_id, aggregate_kind, aggregate_id, sequence, valid_from, valid_to, status, decision, confidence, state_hash, last_event_id, last_event_hash, resolution_id, raw_private_material_stored)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      snapshot.snapshotId,
      snapshot.streamId,
      snapshot.aggregateKind,
      snapshot.aggregateId,
      snapshot.sequence,
      snapshot.validFrom,
      snapshot.validTo ?? null,
      snapshot.status,
      snapshot.decision,
      snapshot.confidence,
      snapshot.stateHash,
      snapshot.lastEventId,
      snapshot.lastEventHash,
      snapshot.resolutionId ?? null,
    );
  }

  protected async writeEntry(entry: AddressResolutionLedgerEntry): Promise<void> {
    const db = await this.db();
    db.exec('BEGIN');
    try {
      db.prepare(`
        INSERT OR REPLACE INTO address_resolution
          (resolution_id, mode, domain, status, decision, confidence, language_tag, created_at, audit_fingerprint, warning_count, error_count, raw_private_material_stored)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(
        entry.resolution.resolutionId,
        entry.resolution.mode,
        entry.resolution.domain,
        entry.resolution.status,
        entry.resolution.decision,
        entry.resolution.confidence,
        entry.resolution.languageTag ?? null,
        entry.resolution.createdAt,
        entry.resolution.auditFingerprint,
        entry.resolution.warningCount,
        entry.resolution.errorCount,
      );
      db.prepare('DELETE FROM address_commitment WHERE resolution_id = ?').run(entry.resolution.resolutionId);
      db.prepare('DELETE FROM resolution_evidence WHERE resolution_id = ?').run(entry.resolution.resolutionId);
      db.prepare('DELETE FROM resolution_step WHERE resolution_id = ?').run(entry.resolution.resolutionId);
      db.prepare('DELETE FROM address_nullifier WHERE resolution_id = ?').run(entry.resolution.resolutionId);

      const insertCommitment = db.prepare(`
        INSERT OR IGNORE INTO address_commitment
          (commitment_id, resolution_id, commitment_kind, commitment_hash, scope, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      entry.commitments.forEach(item => insertCommitment.run(
        item.commitmentId,
        item.resolutionId,
        item.commitmentKind,
        item.commitmentHash,
        item.scope,
        item.createdAt,
      ));

      const insertEvidence = db.prepare(`
        INSERT OR REPLACE INTO resolution_evidence
          (evidence_id, resolution_id, source_kind, source_id, status, confidence, evidence_hash, observed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      entry.evidence.forEach(item => insertEvidence.run(
        item.evidenceId,
        item.resolutionId,
        item.sourceKind,
        item.sourceId,
        item.status,
        item.confidence ?? null,
        item.evidenceHash,
        item.observedAt,
      ));

      const insertStep = db.prepare(`
        INSERT OR REPLACE INTO resolution_step
          (step_id, resolution_id, step_name, status, input_commitment, output_commitment, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      entry.steps.forEach(item => insertStep.run(
        item.stepId,
        item.resolutionId,
        item.stepName,
        item.status,
        item.inputCommitment ?? null,
        item.outputCommitment ?? null,
        item.completedAt,
      ));

      const insertNullifier = db.prepare(`
        INSERT OR IGNORE INTO address_nullifier
          (nullifier_hash, resolution_id, scope, usage, used_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      entry.nullifiers.forEach(item => insertNullifier.run(
        item.nullifierHash,
        item.resolutionId,
        item.scope,
        item.usage,
        item.usedAt,
        item.expiresAt ?? null,
      ));
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  async close() {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    db.close();
    this.dbPromise = null;
  }

  private async db() {
    if (!this.dbPromise) this.dbPromise = this.openDb();
    return this.dbPromise;
  }

  private async openDb() {
    await mkdir(dirname(this.databasePath), { recursive: true });
    const { DatabaseSync } = await dynamicImport('node:sqlite');
    const db = new DatabaseSync(this.databasePath);
    db.exec(SQLITE_SCHEMA);
    return db;
  }

  private rowToResolution(row: any): AddressResolutionLedgerResolutionRecord {
    return {
      ...PRIVACY_POSTURE,
      resolutionId: row.resolution_id,
      mode: row.mode,
      domain: row.domain,
      status: row.status,
      decision: row.decision,
      confidence: Number(row.confidence ?? 0),
      ...(row.language_tag ? { languageTag: row.language_tag } : {}),
      createdAt: row.created_at,
      auditFingerprint: row.audit_fingerprint,
      warningCount: Number(row.warning_count ?? 0),
      errorCount: Number(row.error_count ?? 0),
    };
  }

  private rowToCommitment(row: any): AddressResolutionLedgerCommitmentRecord {
    return {
      commitmentId: row.commitment_id,
      resolutionId: row.resolution_id,
      commitmentKind: row.commitment_kind,
      commitmentHash: row.commitment_hash,
      scope: row.scope,
      createdAt: row.created_at,
    };
  }

  private rowToEvidence(row: any): AddressResolutionLedgerEvidenceRecord {
    return {
      evidenceId: row.evidence_id,
      resolutionId: row.resolution_id,
      sourceKind: row.source_kind,
      sourceId: row.source_id,
      status: row.status,
      ...(row.confidence === null || row.confidence === undefined ? {} : { confidence: Number(row.confidence) }),
      evidenceHash: row.evidence_hash,
      observedAt: row.observed_at,
    };
  }

  private rowToStep(row: any): AddressResolutionLedgerStepRecord {
    return {
      stepId: row.step_id,
      resolutionId: row.resolution_id,
      stepName: row.step_name,
      status: row.status,
      ...(row.input_commitment ? { inputCommitment: row.input_commitment } : {}),
      ...(row.output_commitment ? { outputCommitment: row.output_commitment } : {}),
      completedAt: row.completed_at,
    };
  }

  private rowToNullifier(row: any): AddressResolutionLedgerNullifierRecord {
    return {
      nullifierHash: row.nullifier_hash,
      resolutionId: row.resolution_id,
      scope: row.scope,
      usage: row.usage,
      usedAt: row.used_at,
      ...(row.expires_at ? { expiresAt: row.expires_at } : {}),
    };
  }

  private rowToEvent(row: any): AddressResolutionLedgerEventRecord {
    return {
      ...PRIVACY_POSTURE,
      eventId: row.event_id,
      streamId: row.stream_id,
      aggregateKind: row.aggregate_kind,
      aggregateId: row.aggregate_id,
      eventType: row.event_type,
      eventVersion: Number(row.event_version ?? 1),
      sequence: Number(row.sequence ?? 0),
      occurredAt: row.occurred_at,
      ...(row.resolution_id ? { resolutionId: row.resolution_id } : {}),
      ...(row.actor_commitment ? { actorCommitment: row.actor_commitment } : {}),
      ...(row.causation_id ? { causationId: row.causation_id } : {}),
      ...(row.correlation_id ? { correlationId: row.correlation_id } : {}),
      payloadHash: row.payload_hash,
      payloadJson: typeof row.payload_json === 'string' ? row.payload_json : stableStringify(row.payload_json),
      ...(row.previous_event_hash ? { previousEventHash: row.previous_event_hash } : {}),
      eventHash: row.event_hash,
    };
  }

  private rowToSnapshot(row: any): AddressResolutionLedgerSnapshotRecord {
    return {
      ...PRIVACY_POSTURE,
      snapshotId: row.snapshot_id,
      streamId: row.stream_id,
      aggregateKind: row.aggregate_kind,
      aggregateId: row.aggregate_id,
      sequence: Number(row.sequence ?? 0),
      validFrom: row.valid_from,
      ...(row.valid_to ? { validTo: row.valid_to } : {}),
      status: row.status,
      decision: row.decision,
      confidence: Number(row.confidence ?? 0),
      stateHash: row.state_hash,
      lastEventId: row.last_event_id,
      lastEventHash: row.last_event_hash,
      ...(row.resolution_id ? { resolutionId: row.resolution_id } : {}),
    };
  }
}

export class PostgresAddressResolutionLedgerStore extends BaseAddressResolutionLedgerStore {
  private poolPromise: Promise<any> | null = null;

  constructor(private readonly connectionString: string) {
    super('postgres');
  }

  async getResolution(resolutionId: string): Promise<AddressResolutionLedgerEntry | null> {
    const pool = await this.pool();
    const [resolution, commitments, evidence, steps, nullifiers] = await Promise.all([
      pool.query('SELECT * FROM address_resolution WHERE resolution_id = $1', [resolutionId]),
      pool.query('SELECT * FROM address_commitment WHERE resolution_id = $1 ORDER BY created_at', [resolutionId]),
      pool.query('SELECT * FROM resolution_evidence WHERE resolution_id = $1 ORDER BY observed_at', [resolutionId]),
      pool.query('SELECT * FROM resolution_step WHERE resolution_id = $1 ORDER BY completed_at', [resolutionId]),
      pool.query('SELECT * FROM address_nullifier WHERE resolution_id = $1 ORDER BY used_at', [resolutionId]),
    ]);
    if (!resolution.rows[0]) return null;
    return {
      resolution: this.rowToResolution(resolution.rows[0]),
      commitments: commitments.rows.map((item: any) => this.rowToCommitment(item)),
      evidence: evidence.rows.map((item: any) => this.rowToEvidence(item)),
      steps: steps.rows.map((item: any) => this.rowToStep(item)),
      nullifiers: nullifiers.rows.map((item: any) => this.rowToNullifier(item)),
    };
  }

  async recent(limit = 25): Promise<AddressResolutionLedgerResolutionRecord[]> {
    const pool = await this.pool();
    const result = await pool.query('SELECT * FROM address_resolution ORDER BY created_at DESC LIMIT $1', [cleanLimit(limit)]);
    return result.rows.map((item: any) => this.rowToResolution(item));
  }

  async getEventStream(streamId: string, limit = 100): Promise<AddressResolutionLedgerEventRecord[]> {
    const pool = await this.pool();
    const result = await pool.query(`
      SELECT * FROM address_resolution_event
      WHERE stream_id = $1
      ORDER BY sequence DESC
      LIMIT $2
    `, [streamId, cleanLimit(limit)]);
    return result.rows.reverse().map((item: any) => this.rowToEvent(item));
  }

  async getSnapshot(streamId: string, at?: string): Promise<AddressResolutionLedgerSnapshotRecord | null> {
    const pool = await this.pool();
    const timestamp = clean(at);
    const result = timestamp
      ? await pool.query(`
          SELECT * FROM address_temporal_snapshot
          WHERE stream_id = $1 AND valid_from <= $2 AND (valid_to IS NULL OR valid_to > $2)
          ORDER BY sequence DESC
          LIMIT 1
        `, [streamId, timestamp])
      : await pool.query(`
          SELECT * FROM address_temporal_snapshot
          WHERE stream_id = $1
          ORDER BY sequence DESC
          LIMIT 1
        `, [streamId]);
    return result.rows[0] ? this.rowToSnapshot(result.rows[0]) : null;
  }

  async stats(): Promise<AddressResolutionLedgerStats> {
    const pool = await this.pool();
    const [resolutions, commitments, evidence, steps, nullifiers, events, snapshots] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS value FROM address_resolution'),
      pool.query('SELECT COUNT(*)::int AS value FROM address_commitment'),
      pool.query('SELECT COUNT(*)::int AS value FROM resolution_evidence'),
      pool.query('SELECT COUNT(*)::int AS value FROM resolution_step'),
      pool.query('SELECT COUNT(*)::int AS value FROM address_nullifier'),
      pool.query('SELECT COUNT(*)::int AS value FROM address_resolution_event'),
      pool.query('SELECT COUNT(*)::int AS value FROM address_temporal_snapshot'),
    ]);
    return {
      ...PRIVACY_POSTURE,
      ledgerVersion: ADDRESS_RESOLUTION_LEDGER_VERSION,
      storageMode: this.storageMode,
      resolutionCount: Number(resolutions.rows[0]?.value ?? 0),
      commitmentCount: Number(commitments.rows[0]?.value ?? 0),
      evidenceCount: Number(evidence.rows[0]?.value ?? 0),
      stepCount: Number(steps.rows[0]?.value ?? 0),
      nullifierCount: Number(nullifiers.rows[0]?.value ?? 0),
      eventCount: Number(events.rows[0]?.value ?? 0),
      snapshotCount: Number(snapshots.rows[0]?.value ?? 0),
    };
  }

  protected async appendEvent(input: AddressResolutionLedgerEventInput): Promise<AddressResolutionLedgerEventRecord> {
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      const streamId = clean(input.streamId) || streamIdFor(input.aggregateKind || 'resolution', clean(input.aggregateId) || clean(input.resolutionId) || 'resolution');
      const fullInput = { ...input, streamId };
      await client.query('BEGIN');
      const previous = await client.query(`
        SELECT * FROM address_resolution_event
        WHERE stream_id = $1
        ORDER BY sequence DESC
        LIMIT 1
        FOR UPDATE
      `, [streamId]);
      const sequence = Number(previous.rows[0]?.sequence ?? 0) + 1;
      const event = createAddressResolutionLedgerEventRecord(fullInput, sequence, previous.rows[0]?.event_hash);
      await client.query(`
        INSERT INTO address_resolution_event
          (event_id, stream_id, aggregate_kind, aggregate_id, event_type, event_version, sequence, occurred_at, resolution_id, actor_commitment, causation_id, correlation_id, payload_hash, payload_json, previous_event_hash, event_hash, raw_private_material_stored)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, FALSE)
      `, [
        event.eventId,
        event.streamId,
        event.aggregateKind,
        event.aggregateId,
        event.eventType,
        event.eventVersion,
        event.sequence,
        event.occurredAt,
        event.resolutionId ?? null,
        event.actorCommitment ?? null,
        event.causationId ?? null,
        event.correlationId ?? null,
        event.payloadHash,
        event.payloadJson,
        event.previousEventHash ?? null,
        event.eventHash,
      ]);
      await client.query('COMMIT');
      return event;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  protected async writeSnapshot(snapshot: AddressResolutionLedgerSnapshotRecord): Promise<void> {
    const pool = await this.pool();
    await pool.query(`
      UPDATE address_temporal_snapshot
      SET valid_to = $1
      WHERE stream_id = $2 AND valid_to IS NULL AND sequence < $3
    `, [snapshot.validFrom, snapshot.streamId, snapshot.sequence]);
    await pool.query(`
      INSERT INTO address_temporal_snapshot
        (snapshot_id, stream_id, aggregate_kind, aggregate_id, sequence, valid_from, valid_to, status, decision, confidence, state_hash, last_event_id, last_event_hash, resolution_id, raw_private_material_stored)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, FALSE)
      ON CONFLICT (snapshot_id) DO UPDATE SET
        valid_to = EXCLUDED.valid_to,
        status = EXCLUDED.status,
        decision = EXCLUDED.decision,
        confidence = EXCLUDED.confidence,
        state_hash = EXCLUDED.state_hash,
        last_event_id = EXCLUDED.last_event_id,
        last_event_hash = EXCLUDED.last_event_hash,
        resolution_id = EXCLUDED.resolution_id,
        raw_private_material_stored = FALSE
    `, [
      snapshot.snapshotId,
      snapshot.streamId,
      snapshot.aggregateKind,
      snapshot.aggregateId,
      snapshot.sequence,
      snapshot.validFrom,
      snapshot.validTo ?? null,
      snapshot.status,
      snapshot.decision,
      snapshot.confidence,
      snapshot.stateHash,
      snapshot.lastEventId,
      snapshot.lastEventHash,
      snapshot.resolutionId ?? null,
    ]);
  }

  protected async writeEntry(entry: AddressResolutionLedgerEntry): Promise<void> {
    const pool = await this.pool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        INSERT INTO address_resolution
          (resolution_id, mode, domain, status, decision, confidence, language_tag, created_at, audit_fingerprint, warning_count, error_count, raw_private_material_stored)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE)
        ON CONFLICT (resolution_id) DO UPDATE SET
          mode = EXCLUDED.mode,
          domain = EXCLUDED.domain,
          status = EXCLUDED.status,
          decision = EXCLUDED.decision,
          confidence = EXCLUDED.confidence,
          language_tag = EXCLUDED.language_tag,
          created_at = EXCLUDED.created_at,
          audit_fingerprint = EXCLUDED.audit_fingerprint,
          warning_count = EXCLUDED.warning_count,
          error_count = EXCLUDED.error_count,
          raw_private_material_stored = FALSE
      `, [
        entry.resolution.resolutionId,
        entry.resolution.mode,
        entry.resolution.domain,
        entry.resolution.status,
        entry.resolution.decision,
        entry.resolution.confidence,
        entry.resolution.languageTag ?? null,
        entry.resolution.createdAt,
        entry.resolution.auditFingerprint,
        entry.resolution.warningCount,
        entry.resolution.errorCount,
      ]);
      await client.query('DELETE FROM address_commitment WHERE resolution_id = $1', [entry.resolution.resolutionId]);
      await client.query('DELETE FROM resolution_evidence WHERE resolution_id = $1', [entry.resolution.resolutionId]);
      await client.query('DELETE FROM resolution_step WHERE resolution_id = $1', [entry.resolution.resolutionId]);
      await client.query('DELETE FROM address_nullifier WHERE resolution_id = $1', [entry.resolution.resolutionId]);

      for (const item of entry.commitments) {
        await client.query(`
          INSERT INTO address_commitment
            (commitment_id, resolution_id, commitment_kind, commitment_hash, scope, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (commitment_hash, scope, commitment_kind) DO NOTHING
        `, [item.commitmentId, item.resolutionId, item.commitmentKind, item.commitmentHash, item.scope, item.createdAt]);
      }
      for (const item of entry.evidence) {
        await client.query(`
          INSERT INTO resolution_evidence
            (evidence_id, resolution_id, source_kind, source_id, status, confidence, evidence_hash, observed_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (evidence_id) DO UPDATE SET
            source_kind = EXCLUDED.source_kind,
            source_id = EXCLUDED.source_id,
            status = EXCLUDED.status,
            confidence = EXCLUDED.confidence,
            evidence_hash = EXCLUDED.evidence_hash,
            observed_at = EXCLUDED.observed_at
        `, [item.evidenceId, item.resolutionId, item.sourceKind, item.sourceId, item.status, item.confidence ?? null, item.evidenceHash, item.observedAt]);
      }
      for (const item of entry.steps) {
        await client.query(`
          INSERT INTO resolution_step
            (step_id, resolution_id, step_name, status, input_commitment, output_commitment, completed_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (step_id) DO UPDATE SET
            step_name = EXCLUDED.step_name,
            status = EXCLUDED.status,
            input_commitment = EXCLUDED.input_commitment,
            output_commitment = EXCLUDED.output_commitment,
            completed_at = EXCLUDED.completed_at
        `, [item.stepId, item.resolutionId, item.stepName, item.status, item.inputCommitment ?? null, item.outputCommitment ?? null, item.completedAt]);
      }
      for (const item of entry.nullifiers) {
        await client.query(`
          INSERT INTO address_nullifier
            (nullifier_hash, resolution_id, scope, usage, used_at, expires_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (nullifier_hash) DO NOTHING
        `, [item.nullifierHash, item.resolutionId, item.scope, item.usage, item.usedAt, item.expiresAt ?? null]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    if (!this.poolPromise) return;
    const pool = await this.poolPromise;
    await pool.end();
    this.poolPromise = null;
  }

  private async pool() {
    if (!this.poolPromise) this.poolPromise = this.openPool();
    return this.poolPromise;
  }

  private async openPool() {
    if (!this.connectionString) {
      throw new Error('AGID_ADDRESS_LEDGER_POSTGRES_URL or DATABASE_URL is required for Postgres address ledger storage.');
    }
    const { Pool } = await dynamicImport('pg');
    const pool = new Pool({ connectionString: this.connectionString });
    await pool.query(POSTGRES_SCHEMA);
    return pool;
  }

  private rowToResolution(row: any): AddressResolutionLedgerResolutionRecord {
    return {
      ...PRIVACY_POSTURE,
      resolutionId: row.resolution_id,
      mode: row.mode,
      domain: row.domain,
      status: row.status,
      decision: row.decision,
      confidence: Number(row.confidence ?? 0),
      ...(row.language_tag ? { languageTag: row.language_tag } : {}),
      createdAt: new Date(row.created_at).toISOString(),
      auditFingerprint: row.audit_fingerprint,
      warningCount: Number(row.warning_count ?? 0),
      errorCount: Number(row.error_count ?? 0),
    };
  }

  private rowToCommitment(row: any): AddressResolutionLedgerCommitmentRecord {
    return {
      commitmentId: row.commitment_id,
      resolutionId: row.resolution_id,
      commitmentKind: row.commitment_kind,
      commitmentHash: row.commitment_hash,
      scope: row.scope,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  private rowToEvidence(row: any): AddressResolutionLedgerEvidenceRecord {
    return {
      evidenceId: row.evidence_id,
      resolutionId: row.resolution_id,
      sourceKind: row.source_kind,
      sourceId: row.source_id,
      status: row.status,
      ...(row.confidence === null || row.confidence === undefined ? {} : { confidence: Number(row.confidence) }),
      evidenceHash: row.evidence_hash,
      observedAt: new Date(row.observed_at).toISOString(),
    };
  }

  private rowToStep(row: any): AddressResolutionLedgerStepRecord {
    return {
      stepId: row.step_id,
      resolutionId: row.resolution_id,
      stepName: row.step_name,
      status: row.status,
      ...(row.input_commitment ? { inputCommitment: row.input_commitment } : {}),
      ...(row.output_commitment ? { outputCommitment: row.output_commitment } : {}),
      completedAt: new Date(row.completed_at).toISOString(),
    };
  }

  private rowToNullifier(row: any): AddressResolutionLedgerNullifierRecord {
    return {
      nullifierHash: row.nullifier_hash,
      resolutionId: row.resolution_id,
      scope: row.scope,
      usage: row.usage,
      usedAt: new Date(row.used_at).toISOString(),
      ...(row.expires_at ? { expiresAt: new Date(row.expires_at).toISOString() } : {}),
    };
  }

  private rowToEvent(row: any): AddressResolutionLedgerEventRecord {
    return {
      ...PRIVACY_POSTURE,
      eventId: row.event_id,
      streamId: row.stream_id,
      aggregateKind: row.aggregate_kind,
      aggregateId: row.aggregate_id,
      eventType: row.event_type,
      eventVersion: Number(row.event_version ?? 1),
      sequence: Number(row.sequence ?? 0),
      occurredAt: new Date(row.occurred_at).toISOString(),
      ...(row.resolution_id ? { resolutionId: row.resolution_id } : {}),
      ...(row.actor_commitment ? { actorCommitment: row.actor_commitment } : {}),
      ...(row.causation_id ? { causationId: row.causation_id } : {}),
      ...(row.correlation_id ? { correlationId: row.correlation_id } : {}),
      payloadHash: row.payload_hash,
      payloadJson: typeof row.payload_json === 'string' ? row.payload_json : stableStringify(row.payload_json),
      ...(row.previous_event_hash ? { previousEventHash: row.previous_event_hash } : {}),
      eventHash: row.event_hash,
    };
  }

  private rowToSnapshot(row: any): AddressResolutionLedgerSnapshotRecord {
    return {
      ...PRIVACY_POSTURE,
      snapshotId: row.snapshot_id,
      streamId: row.stream_id,
      aggregateKind: row.aggregate_kind,
      aggregateId: row.aggregate_id,
      sequence: Number(row.sequence ?? 0),
      validFrom: new Date(row.valid_from).toISOString(),
      ...(row.valid_to ? { validTo: new Date(row.valid_to).toISOString() } : {}),
      status: row.status,
      decision: row.decision,
      confidence: Number(row.confidence ?? 0),
      stateHash: row.state_hash,
      lastEventId: row.last_event_id,
      lastEventHash: row.last_event_hash,
      ...(row.resolution_id ? { resolutionId: row.resolution_id } : {}),
    };
  }
}

export class RedisAddressResolutionLedgerStore extends BaseAddressResolutionLedgerStore {
  private clientPromise: Promise<any> | null = null;
  private readonly keyPrefix: string;

  constructor(private readonly redisUrl: string, input: { keyPrefix?: string } = {}) {
    super('redis');
    this.keyPrefix = input.keyPrefix || process.env.AGID_ADDRESS_LEDGER_REDIS_KEY_PREFIX || 'agid:address-ledger';
  }

  async getResolution(resolutionId: string): Promise<AddressResolutionLedgerEntry | null> {
    const client = await this.client();
    const raw = await client.get(this.key('resolution', resolutionId));
    return raw ? JSON.parse(raw) as AddressResolutionLedgerEntry : null;
  }

  async recent(limit = 25): Promise<AddressResolutionLedgerResolutionRecord[]> {
    const client = await this.client();
    const ids = await client.lRange(this.key('recent'), 0, cleanLimit(limit) - 1);
    const rows = await Promise.all(ids.map((id: string) => this.getResolution(id)));
    return rows.filter((entry): entry is AddressResolutionLedgerEntry => Boolean(entry)).map(entry => entry.resolution);
  }

  async getEventStream(streamId: string, limit = 100): Promise<AddressResolutionLedgerEventRecord[]> {
    const client = await this.client();
    const eventIds = await client.lRange(this.key('stream-events', streamId), -cleanLimit(limit), -1);
    const events = await Promise.all(eventIds.map(async (eventId: string) => {
      const raw = await client.get(this.key('event', eventId));
      return raw ? JSON.parse(raw) as AddressResolutionLedgerEventRecord : null;
    }));
    return events.filter((item): item is AddressResolutionLedgerEventRecord => Boolean(item));
  }

  async getSnapshot(streamId: string, at?: string): Promise<AddressResolutionLedgerSnapshotRecord | null> {
    const client = await this.client();
    const timestamp = clean(at);
    if (!timestamp) {
      const raw = await client.get(this.key('latest-snapshot', streamId));
      return raw ? JSON.parse(raw) as AddressResolutionLedgerSnapshotRecord : null;
    }
    const snapshotIds = await client.lRange(this.key('stream-snapshots', streamId), 0, -1);
    const snapshots = await Promise.all(snapshotIds.map(async (snapshotId: string) => {
      const raw = await client.get(this.key('snapshot', snapshotId));
      return raw ? JSON.parse(raw) as AddressResolutionLedgerSnapshotRecord : null;
    }));
    return snapshots
      .filter((item): item is AddressResolutionLedgerSnapshotRecord => Boolean(item))
      .filter(item => item.validFrom <= timestamp && (!item.validTo || item.validTo > timestamp))
      .sort((left, right) => right.sequence - left.sequence)[0] ?? null;
  }

  async stats(): Promise<AddressResolutionLedgerStats> {
    const client = await this.client();
    const [resolutionCount, commitmentCount, evidenceCount, stepCount, nullifierCount, eventCount, snapshotCount] = await Promise.all([
      client.sCard(this.key('resolution-ids')),
      client.get(this.key('commitment-count')),
      client.get(this.key('evidence-count')),
      client.get(this.key('step-count')),
      client.get(this.key('nullifier-count')),
      client.get(this.key('event-count')),
      client.get(this.key('snapshot-count')),
    ]);
    return {
      ...PRIVACY_POSTURE,
      ledgerVersion: ADDRESS_RESOLUTION_LEDGER_VERSION,
      storageMode: this.storageMode,
      resolutionCount: Number(resolutionCount ?? 0),
      commitmentCount: Number(commitmentCount ?? 0),
      evidenceCount: Number(evidenceCount ?? 0),
      stepCount: Number(stepCount ?? 0),
      nullifierCount: Number(nullifierCount ?? 0),
      eventCount: Number(eventCount ?? 0),
      snapshotCount: Number(snapshotCount ?? 0),
    };
  }

  protected async appendEvent(input: AddressResolutionLedgerEventInput): Promise<AddressResolutionLedgerEventRecord> {
    const client = await this.client();
    const streamId = clean(input.streamId) || streamIdFor(input.aggregateKind || 'resolution', clean(input.aggregateId) || clean(input.resolutionId) || 'resolution');
    const fullInput = { ...input, streamId };
    const previousEventId = await client.lIndex(this.key('stream-events', streamId), -1);
    const previousRaw = previousEventId ? await client.get(this.key('event', previousEventId)) : null;
    const previousEvent = previousRaw ? JSON.parse(previousRaw) as AddressResolutionLedgerEventRecord : undefined;
    const sequence = previousEvent ? previousEvent.sequence + 1 : 1;
    const event = createAddressResolutionLedgerEventRecord(fullInput, sequence, previousEvent?.eventHash);
    await client.set(this.key('event', event.eventId), JSON.stringify(event));
    await client.rPush(this.key('stream-events', event.streamId), event.eventId);
    await client.incr(this.key('event-count'));
    return event;
  }

  protected async writeSnapshot(snapshot: AddressResolutionLedgerSnapshotRecord): Promise<void> {
    const client = await this.client();
    const latestRaw = await client.get(this.key('latest-snapshot', snapshot.streamId));
    if (latestRaw) {
      const latest = JSON.parse(latestRaw) as AddressResolutionLedgerSnapshotRecord;
      if (!latest.validTo && latest.sequence < snapshot.sequence) {
        latest.validTo = snapshot.validFrom;
        await client.set(this.key('snapshot', latest.snapshotId), JSON.stringify(latest));
      }
    }
    await client.set(this.key('snapshot', snapshot.snapshotId), JSON.stringify(snapshot));
    await client.set(this.key('latest-snapshot', snapshot.streamId), JSON.stringify(snapshot));
    await client.rPush(this.key('stream-snapshots', snapshot.streamId), snapshot.snapshotId);
    await client.incr(this.key('snapshot-count'));
  }

  protected async writeEntry(entry: AddressResolutionLedgerEntry): Promise<void> {
    const client = await this.client();
    const id = entry.resolution.resolutionId;
    await client.set(this.key('resolution', id), JSON.stringify(entry));
    const isNew = await client.sAdd(this.key('resolution-ids'), id);
    if (isNew > 0) {
      await client.lPush(this.key('recent'), id);
      await client.lTrim(this.key('recent'), 0, 999);
      await Promise.all([
        client.incrBy(this.key('commitment-count'), entry.commitments.length),
        client.incrBy(this.key('evidence-count'), entry.evidence.length),
        client.incrBy(this.key('step-count'), entry.steps.length),
        client.incrBy(this.key('nullifier-count'), entry.nullifiers.length),
      ]);
    }
  }

  async close() {
    if (!this.clientPromise) return;
    const client = await this.clientPromise;
    await client.quit();
    this.clientPromise = null;
  }

  private async client() {
    if (!this.clientPromise) this.clientPromise = this.openClient();
    return this.clientPromise;
  }

  private async openClient() {
    if (!this.redisUrl) {
      throw new Error('AGID_ADDRESS_LEDGER_REDIS_URL or REDIS_URL is required for Redis address ledger storage.');
    }
    const { createClient } = await dynamicImport('redis');
    const client = createClient({ url: this.redisUrl });
    client.on('error', (error: unknown) => console.error('[agid-address-ledger-redis]', error));
    await client.connect();
    return client;
  }

  private key(kind: string, id?: string) {
    return id ? `${this.keyPrefix}:${kind}:${id}` : `${this.keyPrefix}:${kind}`;
  }
}

type MongoLedgerCollections = {
  resolutions: any;
  commitments: any;
  evidence: any;
  steps: any;
  nullifiers: any;
  events: any;
  snapshots: any;
};

export class MongoDbAddressResolutionLedgerStore extends BaseAddressResolutionLedgerStore {
  private clientPromise: Promise<any> | null = null;
  private indexesPromise: Promise<void> | null = null;
  private readonly databaseName: string;
  private readonly collectionPrefix: string;

  constructor(
    private readonly mongodbUrl: string,
    input: { dbName?: string; collectionPrefix?: string } = {},
  ) {
    super('mongodb');
    this.databaseName = input.dbName
      || process.env.AGID_ADDRESS_LEDGER_MONGODB_DB
      || process.env.MONGODB_DB
      || 'agid';
    this.collectionPrefix = input.collectionPrefix
      || process.env.AGID_ADDRESS_LEDGER_MONGODB_COLLECTION_PREFIX
      || 'address_resolution_ledger';
  }

  async getResolution(resolutionId: string): Promise<AddressResolutionLedgerEntry | null> {
    const collections = await this.collections();
    const resolution = await collections.resolutions.findOne({ resolutionId }, { projection: { _id: 0 } });
    if (!resolution) return null;
    const [commitments, evidence, steps, nullifiers] = await Promise.all([
      collections.commitments.find({ resolutionId }, { projection: { _id: 0 } }).sort({ createdAt: 1 }).toArray(),
      collections.evidence.find({ resolutionId }, { projection: { _id: 0 } }).sort({ observedAt: 1 }).toArray(),
      collections.steps.find({ resolutionId }, { projection: { _id: 0 } }).sort({ completedAt: 1 }).toArray(),
      collections.nullifiers.find({ resolutionId }, { projection: { _id: 0 } }).sort({ usedAt: 1 }).toArray(),
    ]);
    return {
      resolution: this.docToResolution(resolution),
      commitments: commitments.map((item: any) => this.docToCommitment(item)),
      evidence: evidence.map((item: any) => this.docToEvidence(item)),
      steps: steps.map((item: any) => this.docToStep(item)),
      nullifiers: nullifiers.map((item: any) => this.docToNullifier(item)),
    };
  }

  async recent(limit = 25): Promise<AddressResolutionLedgerResolutionRecord[]> {
    const collections = await this.collections();
    const rows = await collections.resolutions
      .find({}, { projection: { _id: 0 } })
      .sort({ createdAt: -1 })
      .limit(cleanLimit(limit))
      .toArray();
    return rows.map((item: any) => this.docToResolution(item));
  }

  async getEventStream(streamId: string, limit = 100): Promise<AddressResolutionLedgerEventRecord[]> {
    const collections = await this.collections();
    const rows = await collections.events
      .find({ streamId }, { projection: { _id: 0 } })
      .sort({ sequence: -1 })
      .limit(cleanLimit(limit))
      .toArray();
    return rows.reverse().map((item: any) => this.docToEvent(item));
  }

  async getSnapshot(streamId: string, at?: string): Promise<AddressResolutionLedgerSnapshotRecord | null> {
    const collections = await this.collections();
    const timestamp = clean(at);
    const query = timestamp
      ? {
          streamId,
          validFrom: { $lte: timestamp },
          $or: [
            { validTo: { $exists: false } },
            { validTo: null },
            { validTo: { $gt: timestamp } },
          ],
        }
      : { streamId };
    const row = await collections.snapshots.findOne(query, {
      projection: { _id: 0 },
      sort: { sequence: -1 },
    });
    return row ? this.docToSnapshot(row) : null;
  }

  async stats(): Promise<AddressResolutionLedgerStats> {
    const collections = await this.collections();
    const [resolutionCount, commitmentCount, evidenceCount, stepCount, nullifierCount, eventCount, snapshotCount] = await Promise.all([
      collections.resolutions.countDocuments(),
      collections.commitments.countDocuments(),
      collections.evidence.countDocuments(),
      collections.steps.countDocuments(),
      collections.nullifiers.countDocuments(),
      collections.events.countDocuments(),
      collections.snapshots.countDocuments(),
    ]);
    return {
      ...PRIVACY_POSTURE,
      ledgerVersion: ADDRESS_RESOLUTION_LEDGER_VERSION,
      storageMode: this.storageMode,
      resolutionCount,
      commitmentCount,
      evidenceCount,
      stepCount,
      nullifierCount,
      eventCount,
      snapshotCount,
    };
  }

  protected async appendEvent(input: AddressResolutionLedgerEventInput): Promise<AddressResolutionLedgerEventRecord> {
    const collections = await this.collections();
    const streamId = clean(input.streamId) || streamIdFor(input.aggregateKind || 'resolution', clean(input.aggregateId) || clean(input.resolutionId) || 'resolution');
    const fullInput = { ...input, streamId };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const previous = await collections.events.findOne(
        { streamId },
        { projection: { _id: 0 }, sort: { sequence: -1 } },
      );
      const sequence = Number(previous?.sequence ?? 0) + 1;
      const event = createAddressResolutionLedgerEventRecord(fullInput, sequence, previous?.eventHash);
      try {
        await collections.events.insertOne(event);
        return event;
      } catch (error: any) {
        if (error?.code === 11000) continue;
        throw error;
      }
    }
    throw new Error('address-resolution-ledger-mongodb-event-append-conflict');
  }

  protected async writeSnapshot(snapshot: AddressResolutionLedgerSnapshotRecord): Promise<void> {
    const collections = await this.collections();
    await collections.snapshots.updateMany(
      { streamId: snapshot.streamId, validTo: { $exists: false }, sequence: { $lt: snapshot.sequence } },
      { $set: { validTo: snapshot.validFrom } },
    );
    await collections.snapshots.replaceOne(
      { snapshotId: snapshot.snapshotId },
      snapshot,
      { upsert: true },
    );
  }

  protected async writeEntry(entry: AddressResolutionLedgerEntry): Promise<void> {
    const collections = await this.collections();
    const resolutionId = entry.resolution.resolutionId;
    await collections.resolutions.replaceOne({ resolutionId }, entry.resolution, { upsert: true });
    await Promise.all([
      collections.commitments.deleteMany({ resolutionId }),
      collections.evidence.deleteMany({ resolutionId }),
      collections.steps.deleteMany({ resolutionId }),
      collections.nullifiers.deleteMany({ resolutionId }),
    ]);

    if (entry.commitments.length) {
      await collections.commitments.bulkWrite(entry.commitments.map(item => ({
        updateOne: {
          filter: {
            commitmentHash: item.commitmentHash,
            scope: item.scope,
            commitmentKind: item.commitmentKind,
          },
          update: { $setOnInsert: item },
          upsert: true,
        },
      })), { ordered: false });
    }
    if (entry.evidence.length) {
      await collections.evidence.bulkWrite(entry.evidence.map(item => ({
        replaceOne: {
          filter: { evidenceId: item.evidenceId },
          replacement: item,
          upsert: true,
        },
      })), { ordered: false });
    }
    if (entry.steps.length) {
      await collections.steps.bulkWrite(entry.steps.map(item => ({
        replaceOne: {
          filter: { stepId: item.stepId },
          replacement: item,
          upsert: true,
        },
      })), { ordered: false });
    }
    if (entry.nullifiers.length) {
      await collections.nullifiers.bulkWrite(entry.nullifiers.map(item => ({
        updateOne: {
          filter: { nullifierHash: item.nullifierHash },
          update: { $setOnInsert: item },
          upsert: true,
        },
      })), { ordered: false });
    }
  }

  async close() {
    if (!this.clientPromise) return;
    const client = await this.clientPromise;
    await client.close();
    this.clientPromise = null;
    this.indexesPromise = null;
  }

  private async collections(): Promise<MongoLedgerCollections> {
    const client = await this.client();
    await this.ensureIndexes();
    const db = client.db(this.databaseName);
    return {
      resolutions: db.collection(this.collectionName('resolutions')),
      commitments: db.collection(this.collectionName('commitments')),
      evidence: db.collection(this.collectionName('evidence')),
      steps: db.collection(this.collectionName('steps')),
      nullifiers: db.collection(this.collectionName('nullifiers')),
      events: db.collection(this.collectionName('events')),
      snapshots: db.collection(this.collectionName('snapshots')),
    };
  }

  private async client() {
    if (!this.clientPromise) this.clientPromise = this.openClient();
    return this.clientPromise;
  }

  private async openClient() {
    if (!this.mongodbUrl) {
      throw new Error('AGID_ADDRESS_LEDGER_MONGODB_URL or MONGODB_URI is required for MongoDB address ledger storage.');
    }
    const { MongoClient } = await dynamicImport('mongodb');
    const client = new MongoClient(this.mongodbUrl, { appName: 'agid-address-resolution-ledger' });
    await client.connect();
    return client;
  }

  private async ensureIndexes() {
    if (!this.indexesPromise) this.indexesPromise = this.createIndexes();
    return this.indexesPromise;
  }

  private async createIndexes() {
    const client = await this.client();
    const db = client.db(this.databaseName);
    const collections = {
      resolutions: db.collection(this.collectionName('resolutions')),
      commitments: db.collection(this.collectionName('commitments')),
      evidence: db.collection(this.collectionName('evidence')),
      steps: db.collection(this.collectionName('steps')),
      nullifiers: db.collection(this.collectionName('nullifiers')),
      events: db.collection(this.collectionName('events')),
      snapshots: db.collection(this.collectionName('snapshots')),
    };
    await Promise.all([
      collections.resolutions.createIndex({ resolutionId: 1 }, { unique: true }),
      collections.resolutions.createIndex({ createdAt: -1 }),
      collections.resolutions.createIndex({ decision: 1, status: 1 }),
      collections.commitments.createIndex({ commitmentHash: 1, scope: 1, commitmentKind: 1 }, { unique: true }),
      collections.commitments.createIndex({ resolutionId: 1, createdAt: 1 }),
      collections.commitments.createIndex({ scope: 1, commitmentKind: 1 }),
      collections.evidence.createIndex({ evidenceId: 1 }, { unique: true }),
      collections.evidence.createIndex({ resolutionId: 1, observedAt: 1 }),
      collections.evidence.createIndex({ sourceKind: 1, sourceId: 1 }),
      collections.steps.createIndex({ stepId: 1 }, { unique: true }),
      collections.steps.createIndex({ resolutionId: 1, completedAt: 1 }),
      collections.nullifiers.createIndex({ nullifierHash: 1 }, { unique: true }),
      collections.nullifiers.createIndex({ resolutionId: 1, usedAt: 1 }),
      collections.nullifiers.createIndex({ scope: 1, usage: 1 }),
      collections.events.createIndex({ eventId: 1 }, { unique: true }),
      collections.events.createIndex({ streamId: 1, sequence: 1 }, { unique: true }),
      collections.events.createIndex({ eventHash: 1 }),
      collections.snapshots.createIndex({ snapshotId: 1 }, { unique: true }),
      collections.snapshots.createIndex({ streamId: 1, sequence: 1 }, { unique: true }),
      collections.snapshots.createIndex({ streamId: 1, validFrom: 1, validTo: 1 }),
    ]);
  }

  private collectionName(kind: keyof MongoLedgerCollections) {
    return `${this.collectionPrefix}_${kind}`;
  }

  private docToResolution(doc: any): AddressResolutionLedgerResolutionRecord {
    return {
      ...PRIVACY_POSTURE,
      resolutionId: doc.resolutionId,
      mode: doc.mode,
      domain: doc.domain,
      status: doc.status,
      decision: doc.decision,
      confidence: Number(doc.confidence ?? 0),
      ...(doc.languageTag ? { languageTag: doc.languageTag } : {}),
      createdAt: doc.createdAt,
      auditFingerprint: doc.auditFingerprint,
      warningCount: Number(doc.warningCount ?? 0),
      errorCount: Number(doc.errorCount ?? 0),
    };
  }

  private docToCommitment(doc: any): AddressResolutionLedgerCommitmentRecord {
    return {
      commitmentId: doc.commitmentId,
      resolutionId: doc.resolutionId,
      commitmentKind: doc.commitmentKind,
      commitmentHash: doc.commitmentHash,
      scope: doc.scope,
      createdAt: doc.createdAt,
    };
  }

  private docToEvidence(doc: any): AddressResolutionLedgerEvidenceRecord {
    return {
      evidenceId: doc.evidenceId,
      resolutionId: doc.resolutionId,
      sourceKind: doc.sourceKind,
      sourceId: doc.sourceId,
      status: doc.status,
      ...(doc.confidence === null || doc.confidence === undefined ? {} : { confidence: Number(doc.confidence) }),
      evidenceHash: doc.evidenceHash,
      observedAt: doc.observedAt,
    };
  }

  private docToStep(doc: any): AddressResolutionLedgerStepRecord {
    return {
      stepId: doc.stepId,
      resolutionId: doc.resolutionId,
      stepName: doc.stepName,
      status: doc.status,
      ...(doc.inputCommitment ? { inputCommitment: doc.inputCommitment } : {}),
      ...(doc.outputCommitment ? { outputCommitment: doc.outputCommitment } : {}),
      completedAt: doc.completedAt,
    };
  }

  private docToNullifier(doc: any): AddressResolutionLedgerNullifierRecord {
    return {
      nullifierHash: doc.nullifierHash,
      resolutionId: doc.resolutionId,
      scope: doc.scope,
      usage: doc.usage,
      usedAt: doc.usedAt,
      ...(doc.expiresAt ? { expiresAt: doc.expiresAt } : {}),
    };
  }

  private docToEvent(doc: any): AddressResolutionLedgerEventRecord {
    return {
      ...PRIVACY_POSTURE,
      eventId: doc.eventId,
      streamId: doc.streamId,
      aggregateKind: doc.aggregateKind,
      aggregateId: doc.aggregateId,
      eventType: doc.eventType,
      eventVersion: Number(doc.eventVersion ?? 1),
      sequence: Number(doc.sequence ?? 0),
      occurredAt: doc.occurredAt,
      ...(doc.resolutionId ? { resolutionId: doc.resolutionId } : {}),
      ...(doc.actorCommitment ? { actorCommitment: doc.actorCommitment } : {}),
      ...(doc.causationId ? { causationId: doc.causationId } : {}),
      ...(doc.correlationId ? { correlationId: doc.correlationId } : {}),
      payloadHash: doc.payloadHash,
      payloadJson: typeof doc.payloadJson === 'string' ? doc.payloadJson : stableStringify(doc.payloadJson),
      ...(doc.previousEventHash ? { previousEventHash: doc.previousEventHash } : {}),
      eventHash: doc.eventHash,
    };
  }

  private docToSnapshot(doc: any): AddressResolutionLedgerSnapshotRecord {
    return {
      ...PRIVACY_POSTURE,
      snapshotId: doc.snapshotId,
      streamId: doc.streamId,
      aggregateKind: doc.aggregateKind,
      aggregateId: doc.aggregateId,
      sequence: Number(doc.sequence ?? 0),
      validFrom: doc.validFrom,
      ...(doc.validTo ? { validTo: doc.validTo } : {}),
      status: doc.status,
      decision: doc.decision,
      confidence: Number(doc.confidence ?? 0),
      stateHash: doc.stateHash,
      lastEventId: doc.lastEventId,
      lastEventHash: doc.lastEventHash,
      ...(doc.resolutionId ? { resolutionId: doc.resolutionId } : {}),
    };
  }
}

export function createInMemoryAddressResolutionLedgerStore() {
  return new InMemoryAddressResolutionLedgerStore();
}

export function createConfiguredAddressResolutionLedgerStore(
  input: ConfiguredAddressResolutionLedgerStoreInput = {},
): AddressResolutionLedgerStoreAdapter {
  const storageMode = clean(input.storageMode || process.env.AGID_ADDRESS_LEDGER_STORE || 'memory')
    .toLowerCase() as AddressResolutionLedgerStorageMode;

  if (storageMode === 'sqlite') {
    return new SqliteAddressResolutionLedgerStore(input.sqlitePath || DEFAULT_SQLITE_PATH());
  }
  if (storageMode === 'postgres') {
    const postgresUrl = input.postgresUrl || process.env.AGID_ADDRESS_LEDGER_POSTGRES_URL || process.env.DATABASE_URL || '';
    assertDatabaseProductionReady({
      adapter: 'postgres',
      url: postgresUrl,
      serviceName: 'address resolution ledger',
      envPrefix: 'AGID_ADDRESS_LEDGER',
    });
    return new PostgresAddressResolutionLedgerStore(postgresUrl);
  }
  if (storageMode === 'redis') {
    const redisUrl = input.redisUrl || process.env.AGID_ADDRESS_LEDGER_REDIS_URL || process.env.REDIS_URL || '';
    assertDatabaseProductionReady({
      adapter: 'redis',
      url: redisUrl,
      serviceName: 'address resolution ledger',
      envPrefix: 'AGID_ADDRESS_LEDGER',
    });
    return new RedisAddressResolutionLedgerStore(
      redisUrl,
      { keyPrefix: input.redisKeyPrefix },
    );
  }
  if (storageMode === 'mongodb') {
    const mongodbUrl = input.mongodbUrl || process.env.AGID_ADDRESS_LEDGER_MONGODB_URL || process.env.MONGODB_URI || '';
    assertDatabaseProductionReady({
      adapter: 'mongodb',
      url: mongodbUrl,
      serviceName: 'address resolution ledger',
      envPrefix: 'AGID_ADDRESS_LEDGER',
    });
    return new MongoDbAddressResolutionLedgerStore(
      mongodbUrl,
      {
        dbName: input.mongodbDbName,
        collectionPrefix: input.mongodbCollectionPrefix,
      },
    );
  }
  return new InMemoryAddressResolutionLedgerStore();
}

export const POSTGRES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS address_resolution (
    resolution_id TEXT PRIMARY KEY,
    mode TEXT NOT NULL,
    domain TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('resolved', 'partial', 'unresolved', 'conflict', 'blocked', 'rejected')),
    decision TEXT NOT NULL CHECK (decision IN ('accept', 'review', 'reject')),
    confidence NUMERIC(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    language_tag TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    audit_fingerprint TEXT NOT NULL,
    warning_count INTEGER NOT NULL,
    error_count INTEGER NOT NULL,
    raw_private_material_stored BOOLEAN NOT NULL DEFAULT FALSE CHECK (raw_private_material_stored = FALSE)
  );
  CREATE TABLE IF NOT EXISTS address_commitment (
    commitment_id TEXT PRIMARY KEY,
    resolution_id TEXT NOT NULL REFERENCES address_resolution(resolution_id) ON DELETE CASCADE,
    commitment_kind TEXT NOT NULL CHECK (commitment_kind IN ('address-reference', 'agid', 'aoid', 'credential', 'other')),
    commitment_hash TEXT NOT NULL,
    scope TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    UNIQUE (commitment_hash, scope, commitment_kind)
  );
  CREATE TABLE IF NOT EXISTS resolution_evidence (
    evidence_id TEXT PRIMARY KEY,
    resolution_id TEXT NOT NULL REFERENCES address_resolution(resolution_id) ON DELETE CASCADE,
    source_kind TEXT NOT NULL,
    source_id TEXT NOT NULL,
    status TEXT NOT NULL,
    confidence NUMERIC(5,4) CHECK (confidence >= 0 AND confidence <= 1),
    evidence_hash TEXT NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL
  );
  CREATE TABLE IF NOT EXISTS resolution_step (
    step_id TEXT PRIMARY KEY,
    resolution_id TEXT NOT NULL REFERENCES address_resolution(resolution_id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped', 'review')),
    input_commitment TEXT,
    output_commitment TEXT,
    completed_at TIMESTAMPTZ NOT NULL
  );
  CREATE TABLE IF NOT EXISTS address_nullifier (
    nullifier_hash TEXT PRIMARY KEY,
    resolution_id TEXT NOT NULL REFERENCES address_resolution(resolution_id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    usage TEXT NOT NULL,
    used_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ
  );
  CREATE TABLE IF NOT EXISTS address_resolution_event (
    event_id TEXT PRIMARY KEY,
    stream_id TEXT NOT NULL,
    aggregate_kind TEXT NOT NULL CHECK (aggregate_kind IN ('address-reference', 'agid', 'aoid', 'credential', 'pid', 'delivery', 'resolution')),
    aggregate_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_version INTEGER NOT NULL CHECK (event_version >= 1),
    sequence INTEGER NOT NULL CHECK (sequence >= 1),
    occurred_at TIMESTAMPTZ NOT NULL,
    resolution_id TEXT REFERENCES address_resolution(resolution_id) ON DELETE SET NULL,
    actor_commitment TEXT,
    causation_id TEXT,
    correlation_id TEXT,
    payload_hash TEXT NOT NULL,
    payload_json JSONB NOT NULL,
    previous_event_hash TEXT,
    event_hash TEXT NOT NULL,
    raw_private_material_stored BOOLEAN NOT NULL DEFAULT FALSE CHECK (raw_private_material_stored = FALSE),
    UNIQUE (stream_id, sequence)
  );
  CREATE TABLE IF NOT EXISTS address_temporal_snapshot (
    snapshot_id TEXT PRIMARY KEY,
    stream_id TEXT NOT NULL,
    aggregate_kind TEXT NOT NULL CHECK (aggregate_kind IN ('address-reference', 'agid', 'aoid', 'credential', 'pid', 'delivery', 'resolution')),
    aggregate_id TEXT NOT NULL,
    sequence INTEGER NOT NULL CHECK (sequence >= 1),
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('resolved', 'partial', 'unresolved', 'conflict', 'blocked', 'rejected')),
    decision TEXT NOT NULL CHECK (decision IN ('accept', 'review', 'reject')),
    confidence NUMERIC(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    state_hash TEXT NOT NULL,
    last_event_id TEXT NOT NULL REFERENCES address_resolution_event(event_id) ON DELETE RESTRICT,
    last_event_hash TEXT NOT NULL,
    resolution_id TEXT REFERENCES address_resolution(resolution_id) ON DELETE SET NULL,
    raw_private_material_stored BOOLEAN NOT NULL DEFAULT FALSE CHECK (raw_private_material_stored = FALSE),
    CHECK (valid_to IS NULL OR valid_to > valid_from)
  );
  CREATE INDEX IF NOT EXISTS address_resolution_created_at_idx ON address_resolution(created_at);
  CREATE INDEX IF NOT EXISTS address_resolution_decision_idx ON address_resolution(decision, status);
  CREATE INDEX IF NOT EXISTS address_commitment_scope_idx ON address_commitment(scope, commitment_kind);
  CREATE INDEX IF NOT EXISTS resolution_evidence_source_idx ON resolution_evidence(source_kind, source_id);
  CREATE INDEX IF NOT EXISTS address_resolution_event_stream_idx ON address_resolution_event(stream_id, sequence);
  CREATE INDEX IF NOT EXISTS address_resolution_event_hash_idx ON address_resolution_event(event_hash);
  CREATE INDEX IF NOT EXISTS address_temporal_snapshot_stream_idx ON address_temporal_snapshot(stream_id, valid_from, valid_to);
`;
