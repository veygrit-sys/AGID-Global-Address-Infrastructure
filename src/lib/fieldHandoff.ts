import {
  createPosAcceptanceReceipt,
  type PosAcceptanceChannel,
  type PosAcceptanceReceipt,
} from './posAcceptance';
import { sha256Hex } from './sha256';
import type { ShippingLabelRecipientProofMethod } from './shippingLabelQr';

export const FIELD_HANDOFF_APP_VERSION = 'agid-field-handoff-v1';
export const FIELD_HANDOFF_RECEIPT_SIGNATURE_ALGORITHM = 'sha256-field-handoff-receipt-fingerprint-v1';

export type FieldHandoffStatus =
  | 'assigned'
  | 'arrived'
  | 'recipient_pending'
  | 'handoff_complete'
  | 'cannot_reach'
  | 'offline_pending_sync'
  | 'sync_conflict';

export type FieldHandoffSyncState = 'local-only' | 'queued' | 'synced' | 'conflict';

export type FieldHandoffProofMethod =
  | ShippingLabelRecipientProofMethod
  | 'manual-witness';

export type FieldHandoffReachabilityReason =
  | 'no-safe-access'
  | 'recipient-unavailable'
  | 'address-needs-review'
  | 'delivery-point-blocked'
  | 'weather-or-disaster'
  | 'restricted-area'
  | 'other-safe-category';

export type FieldHandoffReceiptSignature = {
  signatureId: string;
  signatureAlgorithm: typeof FIELD_HANDOFF_RECEIPT_SIGNATURE_ALGORITHM;
  receiptFingerprint: string;
  terminalSignature: string;
  signedAt: string;
  signedBy: string;
  terminalId: string;
  offlineQueueRef: string;
  publicSurface: 'receipt-ids-status-safe-categories-and-fingerprints-only';
  recipientProofDigest?: string;
  reachabilityDigest?: string;
};

export type FieldHandoffOfflineEvidence = {
  evidenceId: string;
  queueRef: string;
  syncState: FieldHandoffSyncState;
  capturedAt: string;
  terminalId: string;
  operatorId: string;
  deferredSyncRequired: boolean;
  conflictPolicy: 'server-conflict-creates-review-case';
  publicSurface: 'offline-queue-ref-status-and-terminal-signature-only';
};

export type FieldHandoffRecipientProofEvidence = {
  evidenceId: string;
  proofMethod: FieldHandoffProofMethod;
  verified: boolean;
  challengeObserved: boolean;
  signatureObserved: boolean;
  storesProofSecret: false;
  storesProofCode: false;
  publicSurface: 'method-booleans-and-domain-separated-digest-only';
};

export type FieldHandoffReachabilityEvidence = {
  evidenceId: string;
  reason: FieldHandoffReachabilityReason;
  safeCategoryOnly: true;
  noteDigest?: string;
  reviewCaseId?: string;
  preciseLocationStored: false;
  publicSurface: 'safe-category-review-case-and-note-digest-only';
};

export type FieldHandoffTask = {
  taskId: string;
  stopAlias: string;
  status: FieldHandoffStatus;
  priority: 'standard' | 'high';
  routeName: string;
  operatorId: string;
  terminalId: string;
  highRiskMode: boolean;
  offlineMode: boolean;
  createdAt: string;
  updatedAt: string;
  lastReceiptId?: string;
  reviewCaseId?: string;
};

export type FieldHandoffTaskInput = {
  taskId?: unknown;
  stopAlias?: unknown;
  status?: unknown;
  priority?: unknown;
  routeName?: unknown;
  operatorId?: unknown;
  terminalId?: unknown;
  highRiskMode?: unknown;
  offlineMode?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type FieldScanInput = {
  task: FieldHandoffTaskInput;
  payload: string;
  channel?: PosAcceptanceChannel;
  recipientProofCode?: string;
  recipientProofSecret?: string;
  recipientProofMethod?: FieldHandoffProofMethod;
  recipientChallenge?: string;
  recipientChallengeSignature?: string;
  carrierTerminalSignature?: string;
  carrierTerminalSignedAt?: string;
  now?: string;
  usedShippingLabelNullifiers?: Iterable<string>;
};

export type FieldReachabilityInput = {
  task: FieldHandoffTaskInput;
  reason: FieldHandoffReachabilityReason;
  note?: unknown;
  now?: string;
};

export type FieldSyncInput = {
  task: FieldHandoffTaskInput;
  serverAccepted: boolean;
  conflictReason?: unknown;
  now?: string;
};

export type FieldAttachmentPrivacyWarning =
  | 'possible-recipient-name'
  | 'possible-phone-or-contact'
  | 'possible-raw-address'
  | 'possible-precise-location'
  | 'photo-metadata-review-required';

export type FieldHandoffReceipt = {
  modelVersion: typeof FIELD_HANDOFF_APP_VERSION;
  receiptId: string;
  taskId: string;
  stopAlias: string;
  status: FieldHandoffStatus;
  action:
    | 'scan-received'
    | 'arrived'
    | 'recipient-proof'
    | 'handoff-complete'
    | 'cannot-reach'
    | 'offline-sync'
    | 'sync-conflict';
  createdAt: string;
  operatorId: string;
  terminalId: string;
  highRiskMode: boolean;
  offlineMode: boolean;
  offlineQueueRef: string;
  syncState: FieldHandoffSyncState;
  posReceiptId?: string;
  reviewCaseId?: string;
  reachabilityReason?: FieldHandoffReachabilityReason;
  safeNote?: string;
  proofMethod?: FieldHandoffProofMethod;
  offlineEvidence: FieldHandoffOfflineEvidence;
  recipientProofEvidence?: FieldHandoffRecipientProofEvidence;
  reachabilityEvidence?: FieldHandoffReachabilityEvidence;
  decision: 'ready' | 'review' | 'blocked' | 'complete';
  warnings: string[];
  errors: string[];
  signature: FieldHandoffReceiptSignature;
  privacy: {
    rawPayloadStored: false;
    rawAddressStored: false;
    rawAgidStored: false;
    rawAoidStored: false;
    rawRecipientStored: false;
    preciseLocationStored: false;
    proofSecretStored: false;
    sharedReportUsesCoarseCategories: true;
  };
};

export type FieldHandoffScanResult = {
  task: FieldHandoffTask;
  receipt: FieldHandoffReceipt;
  posReceipt: PosAcceptanceReceipt;
};

function cleanText(value: unknown, fallback = '', maxLength = 96) {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.trim().replace(/[\r\n\t]+/g, ' ').replace(/[^\p{L}\p{N}\s:._/-]+/gu, '');
  return (cleaned || fallback).slice(0, maxLength);
}

export function detectFieldAttachmentPrivacyWarnings(input: {
  note?: unknown;
  photoEvidenceRef?: unknown;
}): FieldAttachmentPrivacyWarning[] {
  const text = [
    typeof input.note === 'string' ? input.note : '',
    typeof input.photoEvidenceRef === 'string' ? input.photoEvidenceRef : '',
  ].join(' ');
  const warnings = new Set<FieldAttachmentPrivacyWarning>();
  if (!text.trim()) return [];
  if (/(?:recipient|name|full\s*name|氏名|名前|宛名|受取人|担当者)\s*[:：]/i.test(text)) {
    warnings.add('possible-recipient-name');
  }
  if (/(?:\+?\d[\d\s().-]{7,}\d|電話|携帯|phone|tel|email|@)/i.test(text)) {
    warnings.add('possible-phone-or-contact');
  }
  if (/(?:〒\s*\d{3}|\b\d{3}-\d{4}\b|丁目|番地|号室|部屋|street|avenue|road|apt|suite|address)/i.test(text)) {
    warnings.add('possible-raw-address');
  }
  if (/(?:緯度|経度|latitude|longitude|\b-?\d{1,2}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}\b)/i.test(text)) {
    warnings.add('possible-precise-location');
  }
  if (typeof input.photoEvidenceRef === 'string' && input.photoEvidenceRef.trim()) {
    warnings.add('photo-metadata-review-required');
  }
  return Array.from(warnings);
}

function cleanIso(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

function isStatus(value: unknown): value is FieldHandoffStatus {
  return value === 'assigned'
    || value === 'arrived'
    || value === 'recipient_pending'
    || value === 'handoff_complete'
    || value === 'cannot_reach'
    || value === 'offline_pending_sync'
    || value === 'sync_conflict';
}

function isPriority(value: unknown): value is FieldHandoffTask['priority'] {
  return value === 'standard' || value === 'high';
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function stableId(prefix: string, payload: unknown) {
  return `${prefix}-${sha256Hex(stableJson(payload)).slice(0, 20).toUpperCase()}`;
}

function bool(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function decisionForStatus(status: FieldHandoffStatus): FieldHandoffReceipt['decision'] {
  if (status === 'handoff_complete') return 'complete';
  if (status === 'cannot_reach' || status === 'sync_conflict') return 'review';
  if (status === 'recipient_pending') return 'ready';
  return 'ready';
}

function privacyFlags(): FieldHandoffReceipt['privacy'] {
  return {
    rawPayloadStored: false,
    rawAddressStored: false,
    rawAgidStored: false,
    rawAoidStored: false,
    rawRecipientStored: false,
    preciseLocationStored: false,
    proofSecretStored: false,
    sharedReportUsesCoarseCategories: true,
  };
}

function buildReviewCaseId(task: FieldHandoffTask, reason: string, now: string) {
  return stableId('FRC', {
    taskId: task.taskId,
    stopAlias: task.stopAlias,
    reason,
    day: now.slice(0, 10),
  });
}

function syncStateForReceipt(input: {
  action: FieldHandoffReceipt['action'];
  status: FieldHandoffStatus;
  offlineMode: boolean;
}): FieldHandoffSyncState {
  if (input.action === 'sync-conflict' || input.status === 'sync_conflict') return 'conflict';
  if (input.status === 'handoff_complete' && !input.offlineMode) return 'synced';
  if (input.offlineMode || input.status === 'offline_pending_sync') return 'queued';
  return 'local-only';
}

function buildFieldReceiptSignature(input: {
  task: FieldHandoffTask;
  status: FieldHandoffStatus;
  action: FieldHandoffReceipt['action'];
  createdAt: string;
  posReceiptId?: string;
  reviewCaseId?: string;
  reachabilityReason?: FieldHandoffReachabilityReason;
  safeNote?: string;
  proofMethod?: FieldHandoffProofMethod;
  recipientProofDigest?: string;
  warnings: string[];
  errors: string[];
}): FieldHandoffReceiptSignature {
  const publicSurface = 'receipt-ids-status-safe-categories-and-fingerprints-only' as const;
  const fingerprintPayload = {
    modelVersion: FIELD_HANDOFF_APP_VERSION,
    taskId: input.task.taskId,
    stopAlias: input.task.stopAlias,
    status: input.status,
    action: input.action,
    createdAt: input.createdAt,
    operatorId: input.task.operatorId,
    terminalId: input.task.terminalId,
    highRiskMode: input.task.highRiskMode,
    offlineMode: input.task.offlineMode,
    posReceiptId: input.posReceiptId,
    reviewCaseId: input.reviewCaseId,
    reachabilityReason: input.reachabilityReason,
    safeNote: input.safeNote,
    proofMethod: input.proofMethod,
    warnings: input.warnings,
    errors: input.errors,
    publicSurface,
  };
  const receiptFingerprint = `FHF-${sha256Hex(stableJson(fingerprintPayload)).slice(0, 32).toUpperCase()}`;
  const offlineQueueRef = stableId('FHQ', {
    taskId: input.task.taskId,
    stopAlias: input.task.stopAlias,
    receiptFingerprint,
    day: input.createdAt.slice(0, 10),
  });
  const reachabilityDigest = input.reachabilityReason
    ? stableId('FRD', {
      stopAlias: input.task.stopAlias,
      reason: input.reachabilityReason,
      safeNote: input.safeNote,
      day: input.createdAt.slice(0, 10),
    })
    : undefined;
  const terminalSignature = stableId('FHTSIG', {
    receiptFingerprint,
    terminalId: input.task.terminalId,
    signedBy: input.task.operatorId,
    signedAt: input.createdAt,
    offlineQueueRef,
    publicSurface,
  });

  return {
    signatureId: stableId('FHS', {
      receiptFingerprint,
      terminalId: input.task.terminalId,
      operatorId: input.task.operatorId,
      createdAt: input.createdAt,
    }),
    signatureAlgorithm: FIELD_HANDOFF_RECEIPT_SIGNATURE_ALGORITHM,
    receiptFingerprint,
    terminalSignature,
    signedAt: input.createdAt,
    signedBy: input.task.operatorId,
    terminalId: input.task.terminalId,
    offlineQueueRef,
    publicSurface,
    ...(input.recipientProofDigest ? { recipientProofDigest: input.recipientProofDigest } : {}),
    ...(reachabilityDigest ? { reachabilityDigest } : {}),
  };
}

function buildOfflineEvidence(input: {
  task: FieldHandoffTask;
  signature: FieldHandoffReceiptSignature;
  syncState: FieldHandoffSyncState;
  status: FieldHandoffStatus;
  createdAt: string;
}): FieldHandoffOfflineEvidence {
  return {
    evidenceId: stableId('FHOE', {
      queueRef: input.signature.offlineQueueRef,
      receiptFingerprint: input.signature.receiptFingerprint,
      syncState: input.syncState,
    }),
    queueRef: input.signature.offlineQueueRef,
    syncState: input.syncState,
    capturedAt: input.createdAt,
    terminalId: input.task.terminalId,
    operatorId: input.task.operatorId,
    deferredSyncRequired: input.syncState === 'queued' || input.status === 'offline_pending_sync',
    conflictPolicy: 'server-conflict-creates-review-case',
    publicSurface: 'offline-queue-ref-status-and-terminal-signature-only',
  };
}

function buildRecipientProofEvidence(input: {
  task: FieldHandoffTask;
  posReceipt?: PosAcceptanceReceipt;
  proofMethod?: FieldHandoffProofMethod;
  recipientChallenge?: string;
  recipientChallengeSignature?: string;
  createdAt: string;
}): FieldHandoffRecipientProofEvidence | undefined {
  if (!input.proofMethod) return undefined;
  const verified = Boolean(input.posReceipt?.shippingLabel?.recipientControlVerified);
  const challengeObserved = Boolean(cleanText(input.recipientChallenge));
  const signatureObserved = Boolean(cleanText(input.recipientChallengeSignature));
  if (!verified && !challengeObserved && !signatureObserved && input.proofMethod !== 'manual-witness') return undefined;
  return {
    evidenceId: stableId('FRPE', {
      taskId: input.task.taskId,
      stopAlias: input.task.stopAlias,
      posReceiptId: input.posReceipt?.receiptId,
      proofMethod: input.proofMethod,
      verified,
      challengeObserved,
      signatureObserved,
      day: input.createdAt.slice(0, 10),
    }),
    proofMethod: input.proofMethod,
    verified,
    challengeObserved,
    signatureObserved,
    storesProofSecret: false,
    storesProofCode: false,
    publicSurface: 'method-booleans-and-domain-separated-digest-only',
  };
}

function buildReachabilityEvidence(input: {
  task: FieldHandoffTask;
  reason?: FieldHandoffReachabilityReason;
  safeNote?: string;
  reviewCaseId?: string;
  createdAt: string;
}): FieldHandoffReachabilityEvidence | undefined {
  if (!input.reason) return undefined;
  return {
    evidenceId: stableId('FRE', {
      taskId: input.task.taskId,
      stopAlias: input.task.stopAlias,
      reason: input.reason,
      reviewCaseId: input.reviewCaseId,
      day: input.createdAt.slice(0, 10),
    }),
    reason: input.reason,
    safeCategoryOnly: true,
    ...(input.safeNote ? { noteDigest: stableId('FSN', {
      reason: input.reason,
      safeNote: input.safeNote,
      day: input.createdAt.slice(0, 10),
    }) } : {}),
    ...(input.reviewCaseId ? { reviewCaseId: input.reviewCaseId } : {}),
    preciseLocationStored: false,
    publicSurface: 'safe-category-review-case-and-note-digest-only',
  };
}

export function normalizeFieldHandoffTask(
  input: FieldHandoffTaskInput = {},
  now = new Date().toISOString(),
): FieldHandoffTask {
  const taskId = cleanText(input.taskId, '', 64) || stableId('FHT', {
    stopAlias: input.stopAlias,
    routeName: input.routeName,
    operatorId: input.operatorId,
  });
  const priority = isPriority(input.priority) ? input.priority : bool(input.highRiskMode) ? 'high' : 'standard';
  const createdAt = cleanIso(input.createdAt, now);
  return {
    taskId,
    stopAlias: cleanText(input.stopAlias, `STOP-${taskId.slice(-6)}`, 64),
    status: isStatus(input.status) ? input.status : 'assigned',
    priority,
    routeName: cleanText(input.routeName, 'Local route', 72),
    operatorId: cleanText(input.operatorId, 'field-operator-local', 72),
    terminalId: cleanText(input.terminalId, 'AGID-FIELD-LOCAL', 72),
    highRiskMode: bool(input.highRiskMode, priority === 'high'),
    offlineMode: bool(input.offlineMode, true),
    createdAt,
    updatedAt: cleanIso(input.updatedAt, createdAt),
  };
}

export function buildFieldHandoffReceipt(input: {
  task: FieldHandoffTask;
  status: FieldHandoffStatus;
  action: FieldHandoffReceipt['action'];
  now?: string;
  posReceipt?: PosAcceptanceReceipt;
  reviewCaseId?: string;
  reachabilityReason?: FieldHandoffReachabilityReason;
  safeNote?: unknown;
  proofMethod?: FieldHandoffProofMethod;
  recipientChallenge?: string;
  recipientChallengeSignature?: string;
  errors?: string[];
  warnings?: string[];
}): FieldHandoffReceipt {
  const createdAt = input.now || new Date().toISOString();
  const warnings = [...(input.warnings ?? [])];
  if (input.task.highRiskMode) {
    warnings.push('high-risk-mode-redacts-precise-agid-and-address-history');
  }
  if (input.task.offlineMode && input.status !== 'sync_conflict') {
    warnings.push('offline-receipt-awaits-deferred-sync');
  }

  const receiptId = stableId('FHR', {
    taskId: input.task.taskId,
    action: input.action,
    status: input.status,
    posReceiptId: input.posReceipt?.receiptId,
    reviewCaseId: input.reviewCaseId,
    createdAt,
  });
  const errors = Array.from(new Set(input.errors ?? []));
  const uniqueWarnings = Array.from(new Set(warnings));
  const safeNote = input.safeNote ? cleanText(input.safeNote, '', 140) : '';
  const recipientProofEvidence = buildRecipientProofEvidence({
    task: input.task,
    posReceipt: input.posReceipt,
    proofMethod: input.proofMethod,
    recipientChallenge: input.recipientChallenge,
    recipientChallengeSignature: input.recipientChallengeSignature,
    createdAt,
  });
  const signature = buildFieldReceiptSignature({
    task: input.task,
    status: input.status,
    action: input.action,
    createdAt,
    posReceiptId: input.posReceipt?.receiptId,
    reviewCaseId: input.reviewCaseId,
    reachabilityReason: input.reachabilityReason,
    safeNote,
    proofMethod: input.proofMethod,
    recipientProofDigest: recipientProofEvidence?.evidenceId,
    warnings: uniqueWarnings,
    errors,
  });
  const syncState = syncStateForReceipt({
    action: input.action,
    status: input.status,
    offlineMode: input.task.offlineMode,
  });
  const offlineEvidence = buildOfflineEvidence({
    task: input.task,
    signature,
    syncState,
    status: input.status,
    createdAt,
  });
  const reachabilityEvidence = buildReachabilityEvidence({
    task: input.task,
    reason: input.reachabilityReason,
    safeNote,
    reviewCaseId: input.reviewCaseId,
    createdAt,
  });

  return {
    modelVersion: FIELD_HANDOFF_APP_VERSION,
    receiptId,
    taskId: input.task.taskId,
    stopAlias: input.task.stopAlias,
    status: input.status,
    action: input.action,
    createdAt,
    operatorId: input.task.operatorId,
    terminalId: input.task.terminalId,
    highRiskMode: input.task.highRiskMode,
    offlineMode: input.task.offlineMode,
    offlineQueueRef: signature.offlineQueueRef,
    syncState,
    ...(input.posReceipt ? { posReceiptId: input.posReceipt.receiptId } : {}),
    ...(input.reviewCaseId ? { reviewCaseId: input.reviewCaseId } : {}),
    ...(input.reachabilityReason ? { reachabilityReason: input.reachabilityReason } : {}),
    ...(safeNote ? { safeNote } : {}),
    ...(input.proofMethod ? { proofMethod: input.proofMethod } : {}),
    offlineEvidence,
    ...(recipientProofEvidence ? { recipientProofEvidence } : {}),
    ...(reachabilityEvidence ? { reachabilityEvidence } : {}),
    decision: errors.length ? 'blocked' : decisionForStatus(input.status),
    warnings: uniqueWarnings,
    errors,
    signature,
    privacy: privacyFlags(),
  };
}

export function processFieldHandoffScan(input: FieldScanInput): FieldHandoffScanResult {
  const now = input.now || new Date().toISOString();
  const task = normalizeFieldHandoffTask(input.task, now);
  const proofMethod = input.recipientProofMethod ?? 'recipient-secret-commitment';
  const posReceipt = createPosAcceptanceReceipt({
    payload: input.payload,
    channel: input.channel ?? 'qr',
    scanRole: input.recipientProofCode || input.recipientProofSecret || input.recipientChallengeSignature ? 'recipient' : 'carrier',
    recipientProofCode: input.recipientProofCode,
    recipientProofSecret: input.recipientProofSecret,
    recipientProofMethod: proofMethod === 'manual-witness' ? 'presence-only' : proofMethod,
    recipientChallenge: input.recipientChallenge,
    recipientChallengeSignature: input.recipientChallengeSignature,
    terminalId: task.terminalId,
    operatorId: task.operatorId,
    carrierTerminalId: task.terminalId,
    carrierTerminalSignature: input.carrierTerminalSignature || `FIELD-SIG-${task.terminalId}`,
    carrierTerminalSignedAt: input.carrierTerminalSignedAt || now,
    purpose: task.highRiskMode ? 'field-handoff-high-risk' : 'field-handoff',
  }, {
    now,
    requestId: task.taskId,
    usedShippingLabelNullifiers: input.usedShippingLabelNullifiers,
  });

  let nextStatus: FieldHandoffStatus = 'arrived';
  let action: FieldHandoffReceipt['action'] = 'scan-received';
  if (posReceipt.shippingLabel?.recipientControlVerified) {
    nextStatus = task.offlineMode ? 'offline_pending_sync' : 'handoff_complete';
    action = task.offlineMode ? 'offline-sync' : 'handoff-complete';
  } else if (posReceipt.shippingLabel?.carrierScanVerified || posReceipt.record || posReceipt.record?.recordType === 'AGID') {
    nextStatus = 'recipient_pending';
    action = 'arrived';
  } else if (!posReceipt.accepted) {
    nextStatus = 'recipient_pending';
    action = 'recipient-proof';
  }

  const receipt = buildFieldHandoffReceipt({
    task,
    status: nextStatus,
    action,
    now,
    posReceipt,
    proofMethod,
    recipientChallenge: input.recipientChallenge,
    recipientChallengeSignature: input.recipientChallengeSignature,
    errors: posReceipt.errors.filter(error => error !== 'carrier-terminal-signature-required' && error !== 'carrier-terminal-id-required'),
    warnings: posReceipt.warnings,
  });

  return {
    task: {
      ...task,
      status: nextStatus,
      updatedAt: now,
      lastReceiptId: receipt.receiptId,
    },
    receipt,
    posReceipt,
  };
}

export function createFieldReachabilityReport(input: FieldReachabilityInput) {
  const now = input.now || new Date().toISOString();
  const task = normalizeFieldHandoffTask(input.task, now);
  const reviewCaseId = buildReviewCaseId(task, input.reason, now);
  const receipt = buildFieldHandoffReceipt({
    task,
    status: 'cannot_reach',
    action: 'cannot-reach',
    now,
    reviewCaseId,
    reachabilityReason: input.reason,
    safeNote: input.note,
    warnings: ['reachability-report-uses-safe-category-only'],
  });
  return {
    task: {
      ...task,
      status: 'cannot_reach' as const,
      updatedAt: now,
      reviewCaseId,
      lastReceiptId: receipt.receiptId,
    },
    receipt,
  };
}

export function syncFieldHandoffReceipt(input: FieldSyncInput) {
  const now = input.now || new Date().toISOString();
  const task = normalizeFieldHandoffTask(input.task, now);
  if (!input.serverAccepted) {
    const reason = cleanText(input.conflictReason, 'server-conflict', 80);
    const reviewCaseId = buildReviewCaseId(task, reason, now);
    const receipt = buildFieldHandoffReceipt({
      task,
      status: 'sync_conflict',
      action: 'sync-conflict',
      now,
      reviewCaseId,
      warnings: [`sync-conflict:${reason}`],
    });
    return {
      task: {
        ...task,
        status: 'sync_conflict' as const,
        updatedAt: now,
        reviewCaseId,
        lastReceiptId: receipt.receiptId,
      },
      receipt,
    };
  }

  const status: FieldHandoffStatus = task.status === 'offline_pending_sync' ? 'handoff_complete' : task.status;
  const receiptTask = status === 'handoff_complete' ? { ...task, offlineMode: false } : task;
  const receipt = buildFieldHandoffReceipt({
    task: receiptTask,
    status,
    action: status === 'handoff_complete' ? 'handoff-complete' : 'offline-sync',
    now,
    warnings: ['deferred-sync-accepted'],
  });
  return {
    task: {
      ...task,
      status,
      offlineMode: false,
      updatedAt: now,
      lastReceiptId: receipt.receiptId,
    },
    receipt,
  };
}
