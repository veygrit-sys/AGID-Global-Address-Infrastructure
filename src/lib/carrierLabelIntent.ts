import { sha256Hex } from './sha256';
import type {
  ShippingLabelProofLevel,
  ShippingLabelQrRecord,
} from './shippingLabelQr';

export const CARRIER_LABEL_INTENT_VERSION = 'agid-carrier-label-intent-v1';

export const CARRIER_LABEL_INTENT_STATUSES = [
  'requires_address_verification',
  'requires_agid_aoid',
  'requires_carrier_acceptance',
  'requires_label_qr',
  'label_qr_ready',
  'recipient_proof_pending',
  'handoff_ready',
  'completed',
  'requires_review',
  'rejected',
  'expired',
] as const;

export const CARRIER_LABEL_INTENT_NEXT_ACTIONS = [
  'verify_address',
  'confirm_agid_aoid',
  'request_carrier_acceptance',
  'issue_label_qr',
  'scan_label_qr',
  'request_recipient_proof',
  'complete_handoff',
  'manual_review',
  'none',
] as const;

export const CARRIER_LABEL_INTENT_EVIDENCE_TYPES = [
  'address-verification',
  'agid-aoid-check',
  'carrier-acceptance',
  'label-qr-issued',
  'carrier-scan',
  'recipient-proof',
  'terminal-receipt',
  'revocation-check',
  'freshness-check',
  'carrier-policy-check',
  'webhook-event',
  'customs-check',
  'manual-review',
] as const;

export const CARRIER_LABEL_REJECTION_REASONS = [
  'address-defect',
  'undeliverable-region',
  'po-box',
  'auto-lock',
  'carrier-policy',
  'other',
] as const;

export type CarrierLabelIntentStatus = typeof CARRIER_LABEL_INTENT_STATUSES[number];
export type CarrierLabelIntentNextAction = typeof CARRIER_LABEL_INTENT_NEXT_ACTIONS[number];
export type CarrierLabelIntentEvidenceType = typeof CARRIER_LABEL_INTENT_EVIDENCE_TYPES[number];
export type CarrierLabelRejectionReason = typeof CARRIER_LABEL_REJECTION_REASONS[number];
export type CarrierLabelIntentEvidenceStatus = 'pending' | 'passed' | 'warning' | 'failed';
export type CarrierLabelIntentMode =
  | 'local'
  | 'server-registry'
  | 'external-carrier'
  | 'zk'
  | 'ethereum'
  | 'full';
export type CarrierLabelIntentPurpose = 'delivery' | 'return' | 'customs' | 'aid';

export type CarrierLabelIntentEvidenceInput = {
  type?: string;
  status?: string;
  code?: string;
  safeFingerprint?: string;
  receiptRef?: string;
  createdAt?: string;
  signed?: boolean;
  rawAddress?: unknown;
  recipient?: unknown;
  phone?: unknown;
  agid?: unknown;
  aoid?: unknown;
  proofCode?: unknown;
  secret?: unknown;
};

export type CarrierLabelIntentEvidence = {
  type: CarrierLabelIntentEvidenceType;
  status: CarrierLabelIntentEvidenceStatus;
  code?: string;
  safeFingerprint?: string;
  receiptRef?: string;
  createdAt: string;
  signed: boolean;
};

export type CarrierLabelIntentCarrier = {
  carrierId?: string;
  serviceLevel?: string;
  adapter?: 'agid-delivery-json-v1' | 'generic-json' | 'easypost-compatible' | 'carrier-rest-compatible';
  externalShipmentRef?: string;
  externalRateRef?: string;
  externalTrackingRef?: string;
  externalLabelRef?: string;
  carrierReceiptRef?: string;
  webhookEventRef?: string;
  acceptanceStatus?: 'pending' | 'accepted' | 'review' | 'rejected';
  plaintextShipmentRequired: boolean;
};

export type CarrierLabelAcceptancePolicy = {
  rejectAddressDefect: boolean;
  rejectUndeliverableRegion: boolean;
  rejectPoBox: boolean;
  rejectAutoLock: boolean;
  requireAoidAccessProfileForPoBoxOrAutoLock: boolean;
  policyRef?: string;
};

export type CarrierLabelAddressRisk = {
  addressDefect: boolean;
  undeliverableRegion: boolean;
  poBox: boolean;
  autoLock: boolean;
  aoidAccessProfileConfirmed: boolean;
  reasonCodes: CarrierLabelRejectionReason[];
};

export type CarrierLabelIntentLabel = {
  waybillAlias?: string;
  waybillCommitment?: string;
  labelQrCommitment?: string;
  jti?: string;
  nullifier?: string;
  issuedAt?: string;
  expiresAt?: string;
  qrModelVersion?: string;
  labelFormat?: 'qr' | 'pdf' | 'zpl' | 'png' | 'unknown';
  rawQrPayloadStored: false;
  rawLabelPayloadStored: false;
};

export type CarrierLabelIntentStage = {
  key:
    | 'address'
    | 'agid-aoid'
    | 'carrier'
    | 'label-qr'
    | 'carrier-scan'
    | 'recipient-proof'
    | 'receipt';
  label:
    | 'Address Verified'
    | 'AGID/AOID Confirmed'
    | 'Carrier Accepted'
    | 'Label QR Issued'
    | 'Carrier Scan OK'
    | 'Recipient Proof OK'
    | 'Completion Receipt';
  complete: boolean;
  required: boolean;
};

export type CarrierLabelIntentInput = {
  id?: string;
  purpose?: string;
  mode?: string;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string;
  highRiskMode?: boolean;
  recipientProofRequired?: boolean;
  addressVerified?: boolean;
  agidAoidVerified?: boolean;
  carrierAccepted?: boolean;
  labelQrIssued?: boolean;
  carrierScanVerified?: boolean;
  recipientProofVerified?: boolean;
  terminalReceiptSigned?: boolean;
  rejectedReason?: string;
  manualReviewRequired?: boolean;
  manualReviewApproved?: boolean;
  carrier?: Partial<CarrierLabelIntentCarrier>;
  carrierPolicy?: Partial<CarrierLabelAcceptancePolicy>;
  addressRisk?: Partial<CarrierLabelAddressRisk>;
  label?: Partial<CarrierLabelIntentLabel>;
  shippingLabelQrRecord?: ShippingLabelQrRecord;
  evidence?: CarrierLabelIntentEvidenceInput[];
};

export type CarrierLabelIntentPrivacy = {
  rawAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  rawRecipientStored: false;
  rawProofCodeStored: false;
  rawLabelPayloadStored: false;
  carrierApiKeyStored: false;
  publicSurface: 'intent-state-commitments-receipts-and-next-action-only';
};

export type CarrierLabelIntent = {
  modelVersion: typeof CARRIER_LABEL_INTENT_VERSION;
  id: string;
  status: CarrierLabelIntentStatus;
  purpose: CarrierLabelIntentPurpose;
  mode: CarrierLabelIntentMode;
  proofLevel: ShippingLabelProofLevel;
  nextAction: CarrierLabelIntentNextAction;
  stages: CarrierLabelIntentStage[];
  carrier: CarrierLabelIntentCarrier;
  carrierPolicy: CarrierLabelAcceptancePolicy;
  addressRisk: CarrierLabelAddressRisk;
  label: CarrierLabelIntentLabel;
  evidence: CarrierLabelIntentEvidence[];
  highRiskMode: boolean;
  recipientProofRequired: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  errors: string[];
  warnings: string[];
  privacy: CarrierLabelIntentPrivacy;
};

const DEFAULT_CREATED_AT = '2026-06-17T00:00:00.000Z';
const PRIVATE_EVIDENCE_KEYS = [
  'rawAddress',
  'recipient',
  'phone',
  'agid',
  'aoid',
  'proofCode',
  'secret',
];
const SAFE_EVIDENCE_KEYS = ['type', 'status', 'code', 'safeFingerprint', 'receiptRef', 'createdAt', 'signed'];
const PRIVATE_VALUE_RE = /(\bAGID[-_A-Z0-9]*\b|\bAOID[-_A-Z0-9]*\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{7,}\d|\b-?\d{1,2}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,})/i;
const PUBLIC_PRIVATE_VALUE_RE = /(\b(?:AGID|AOID)[-_][A-Z0-9]{6,}\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+\d[\d\s().-]{7,}\d|\b-?\d{1,2}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,})/i;

function clean(value: unknown, maxLength = 160) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function validIsoOrDefault(value: unknown, fallback = DEFAULT_CREATED_AT) {
  const text = clean(value);
  return text && !Number.isNaN(Date.parse(text)) ? text : fallback;
}

function optionalIso(value: unknown) {
  const text = clean(value);
  return text && !Number.isNaN(Date.parse(text)) ? text : undefined;
}

function normalizePurpose(value: unknown): CarrierLabelIntentPurpose {
  const text = clean(value).toLowerCase();
  if (text === 'return' || text === 'customs' || text === 'aid') return text;
  return 'delivery';
}

function normalizeMode(value: unknown): CarrierLabelIntentMode {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if (
    text === 'server-registry'
    || text === 'external-carrier'
    || text === 'zk'
    || text === 'ethereum'
    || text === 'full'
  ) return text;
  return 'local';
}

function normalizeEvidenceType(value: unknown): CarrierLabelIntentEvidenceType | undefined {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if ((CARRIER_LABEL_INTENT_EVIDENCE_TYPES as readonly string[]).includes(text)) {
    return text as CarrierLabelIntentEvidenceType;
  }
  if (text === 'address' || text === 'address-valid' || text === 'address-validation') return 'address-verification';
  if (text === 'agid' || text === 'aoid' || text === 'agid-aoid') return 'agid-aoid-check';
  if (text === 'carrier' || text === 'carrier-accepted') return 'carrier-acceptance';
  if (text === 'carrier-policy' || text === 'policy' || text === 'delivery-policy') return 'carrier-policy-check';
  if (text === 'label' || text === 'waybill' || text === 'qr') return 'label-qr-issued';
  if (text === 'recipient' || text === 'recipient-controlled') return 'recipient-proof';
  if (text === 'receipt' || text === 'handoff-complete') return 'terminal-receipt';
  return undefined;
}

function normalizeEvidenceStatus(value: unknown): CarrierLabelIntentEvidenceStatus {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if (text === 'ok' || text === 'accepted' || text === 'verified' || text === 'complete') return 'passed';
  if (text === 'review' || text === 'needs-review' || text === 'partial') return 'warning';
  if (text === 'rejected' || text === 'invalid' || text === 'error') return 'failed';
  if (text === 'pending') return 'pending';
  return 'passed';
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableJson(object[key])}`)
    .join(',')}}`;
}

function compactHash(value: unknown, prefix: string) {
  return `${prefix}_${sha256Hex(stableJson(value)).slice(0, 32)}`;
}

function hasPrivateEvidenceValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return PRIVATE_VALUE_RE.test(value);
  if (typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasPrivateEvidenceValue);
  return Object.entries(value as Record<string, unknown>).some(([key, child]) => (
    PRIVATE_EVIDENCE_KEYS.includes(key)
    || (!SAFE_EVIDENCE_KEYS.includes(key) && hasPrivateEvidenceValue(child))
  ));
}

function normalizeEvidence(
  evidence: CarrierLabelIntentEvidenceInput[] | undefined,
  now: string,
) {
  const normalized: CarrierLabelIntentEvidence[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const item of evidence ?? []) {
    if (hasPrivateEvidenceValue(item)) {
      errors.push('carrier-label-intent-private-evidence-rejected');
      continue;
    }

    const type = normalizeEvidenceType(item.type);
    if (!type) {
      warnings.push('carrier-label-intent-unknown-evidence-ignored');
      continue;
    }

    normalized.push({
      type,
      status: normalizeEvidenceStatus(item.status),
      ...(clean(item.code, 80) ? { code: clean(item.code, 80) } : {}),
      ...(clean(item.safeFingerprint, 120) ? { safeFingerprint: clean(item.safeFingerprint, 120) } : {}),
      ...(clean(item.receiptRef, 120) ? { receiptRef: clean(item.receiptRef, 120) } : {}),
      createdAt: validIsoOrDefault(item.createdAt, now),
      signed: Boolean(item.signed),
    });
  }

  return { evidence: normalized, errors: Array.from(new Set(errors)), warnings: Array.from(new Set(warnings)) };
}

function evidencePassed(evidence: readonly CarrierLabelIntentEvidence[], type: CarrierLabelIntentEvidenceType) {
  return evidence.some(item => item.type === type && item.status === 'passed');
}

function signedEvidencePassed(evidence: readonly CarrierLabelIntentEvidence[], type: CarrierLabelIntentEvidenceType) {
  return evidence.some(item => item.type === type && item.status === 'passed' && item.signed);
}

function evidenceHasFailure(evidence: readonly CarrierLabelIntentEvidence[]) {
  return evidence.some(item => item.status === 'failed');
}

function evidenceHasWarning(evidence: readonly CarrierLabelIntentEvidence[]) {
  return evidence.some(item => item.status === 'warning');
}

function evidenceHasPending(evidence: readonly CarrierLabelIntentEvidence[]) {
  return evidence.some(item => item.status === 'pending');
}

function normalizeCarrier(input?: Partial<CarrierLabelIntentCarrier>): CarrierLabelIntentCarrier {
  const adapter = clean(input?.adapter).toLowerCase() as CarrierLabelIntentCarrier['adapter'];
  const validAdapter = adapter === 'agid-delivery-json-v1'
    || adapter === 'generic-json'
    || adapter === 'easypost-compatible'
    || adapter === 'carrier-rest-compatible';
  const acceptanceStatus = clean(input?.acceptanceStatus).toLowerCase() as CarrierLabelIntentCarrier['acceptanceStatus'];
  const validAcceptance = acceptanceStatus === 'pending'
    || acceptanceStatus === 'accepted'
    || acceptanceStatus === 'review'
    || acceptanceStatus === 'rejected';

  return {
    ...(clean(input?.carrierId, 80) ? { carrierId: clean(input?.carrierId, 80) } : {}),
    ...(clean(input?.serviceLevel, 80) ? { serviceLevel: clean(input?.serviceLevel, 80) } : {}),
    ...(validAdapter ? { adapter } : {}),
    ...(clean(input?.externalShipmentRef, 120) ? { externalShipmentRef: clean(input?.externalShipmentRef, 120) } : {}),
    ...(clean(input?.externalRateRef, 120) ? { externalRateRef: clean(input?.externalRateRef, 120) } : {}),
    ...(clean(input?.externalTrackingRef, 120) ? { externalTrackingRef: clean(input?.externalTrackingRef, 120) } : {}),
    ...(clean(input?.externalLabelRef, 120) ? { externalLabelRef: clean(input?.externalLabelRef, 120) } : {}),
    ...(clean(input?.carrierReceiptRef, 120) ? { carrierReceiptRef: clean(input?.carrierReceiptRef, 120) } : {}),
    ...(clean(input?.webhookEventRef, 120) ? { webhookEventRef: clean(input?.webhookEventRef, 120) } : {}),
    ...(validAcceptance ? { acceptanceStatus } : { acceptanceStatus: 'pending' }),
    plaintextShipmentRequired: Boolean(input?.plaintextShipmentRequired),
  };
}

function normalizeCarrierPolicy(input?: Partial<CarrierLabelAcceptancePolicy>): CarrierLabelAcceptancePolicy {
  return {
    rejectAddressDefect: Boolean(input?.rejectAddressDefect),
    rejectUndeliverableRegion: Boolean(input?.rejectUndeliverableRegion),
    rejectPoBox: Boolean(input?.rejectPoBox),
    rejectAutoLock: Boolean(input?.rejectAutoLock),
    requireAoidAccessProfileForPoBoxOrAutoLock: input?.requireAoidAccessProfileForPoBoxOrAutoLock !== false,
    ...(clean(input?.policyRef, 120) ? { policyRef: clean(input?.policyRef, 120) } : {}),
  };
}

function normalizeRejectionReason(value: unknown): CarrierLabelRejectionReason | undefined {
  const text = clean(value).toLowerCase().replace(/[_\s]+/g, '-');
  if ((CARRIER_LABEL_REJECTION_REASONS as readonly string[]).includes(text)) {
    return text as CarrierLabelRejectionReason;
  }
  if (text === 'address-defects' || text === 'invalid-address' || text === 'address-incomplete') return 'address-defect';
  if (text === 'undeliverable' || text === 'delivery-impossible' || text === 'out-of-service-area') return 'undeliverable-region';
  if (text === 'pobox' || text === 'p-o-box') return 'po-box';
  if (text === 'autolock') return 'auto-lock';
  return undefined;
}

function normalizeAddressRisk(input?: Partial<CarrierLabelAddressRisk>): CarrierLabelAddressRisk {
  const reasonCodes = Array.from(new Set((input?.reasonCodes ?? [])
    .map(normalizeRejectionReason)
    .filter((reason): reason is CarrierLabelRejectionReason => Boolean(reason))));
  const has = (reason: CarrierLabelRejectionReason) => reasonCodes.includes(reason);

  return {
    addressDefect: Boolean(input?.addressDefect || has('address-defect')),
    undeliverableRegion: Boolean(input?.undeliverableRegion || has('undeliverable-region')),
    poBox: Boolean(input?.poBox || has('po-box')),
    autoLock: Boolean(input?.autoLock || has('auto-lock')),
    aoidAccessProfileConfirmed: Boolean(input?.aoidAccessProfileConfirmed),
    reasonCodes,
  };
}

function carrierPolicyErrors(
  policy: CarrierLabelAcceptancePolicy,
  risk: CarrierLabelAddressRisk,
): string[] {
  const errors: string[] = [];
  if (policy.rejectAddressDefect && risk.addressDefect) {
    errors.push('carrier-label-intent-address-defect-rejected');
  }
  if (policy.rejectUndeliverableRegion && risk.undeliverableRegion) {
    errors.push('carrier-label-intent-undeliverable-region-rejected');
  }
  if (policy.rejectPoBox && risk.poBox) {
    errors.push('carrier-label-intent-po-box-rejected');
  }
  if (policy.rejectAutoLock && risk.autoLock) {
    errors.push('carrier-label-intent-auto-lock-rejected');
  }
  if (policy.requireAoidAccessProfileForPoBoxOrAutoLock
    && (risk.poBox || risk.autoLock)
    && !risk.aoidAccessProfileConfirmed) {
    errors.push('carrier-label-intent-aoid-access-profile-required-for-po-box-or-auto-lock');
  }
  return errors;
}

function labelFromQrRecord(record?: ShippingLabelQrRecord): Partial<CarrierLabelIntentLabel> {
  if (!record) return {};
  return {
    waybillAlias: record.waybillId,
    waybillCommitment: record.waybillCommitment,
    labelQrCommitment: compactHash({
      modelVersion: record.modelVersion,
      waybillAlias: record.waybillId,
      jti: record.jti,
      nullifier: record.nullifier.value,
    }, 'labelqr'),
    jti: record.jti,
    nullifier: record.nullifier.value,
    issuedAt: record.issuedAt,
    expiresAt: record.expiresAt,
    qrModelVersion: record.modelVersion,
    labelFormat: 'qr',
  };
}

function normalizeLabel(
  label?: Partial<CarrierLabelIntentLabel>,
  record?: ShippingLabelQrRecord,
): CarrierLabelIntentLabel {
  const fromRecord = labelFromQrRecord(record);
  const merged = { ...label, ...fromRecord };

  return {
    ...(clean(merged.waybillAlias, 80) ? { waybillAlias: clean(merged.waybillAlias, 80) } : {}),
    ...(clean(merged.waybillCommitment, 120) ? { waybillCommitment: clean(merged.waybillCommitment, 120) } : {}),
    ...(clean(merged.labelQrCommitment, 120) ? { labelQrCommitment: clean(merged.labelQrCommitment, 120) } : {}),
    ...(clean(merged.jti, 80) ? { jti: clean(merged.jti, 80) } : {}),
    ...(clean(merged.nullifier, 120) ? { nullifier: clean(merged.nullifier, 120) } : {}),
    ...(optionalIso(merged.issuedAt) ? { issuedAt: optionalIso(merged.issuedAt) } : {}),
    ...(optionalIso(merged.expiresAt) ? { expiresAt: optionalIso(merged.expiresAt) } : {}),
    ...(clean(merged.qrModelVersion, 80) ? { qrModelVersion: clean(merged.qrModelVersion, 80) } : {}),
    labelFormat: merged.labelFormat ?? (merged.waybillAlias ? 'qr' : 'unknown'),
    rawQrPayloadStored: false,
    rawLabelPayloadStored: false,
  };
}

function buildIntentId(input: CarrierLabelIntentInput, createdAt: string) {
  const explicit = clean(input.id).toUpperCase();
  if (/^LIT-[A-F0-9]{16,32}$/.test(explicit)) return explicit;
  return `LIT-${sha256Hex(stableJson({
    createdAt,
    purpose: input.purpose,
    mode: input.mode,
    carrier: input.carrier,
    carrierPolicy: input.carrierPolicy,
    addressRisk: input.addressRisk,
    label: input.label,
    evidence: input.evidence?.map(item => ({
      type: item.type,
      safeFingerprint: item.safeFingerprint,
      receiptRef: item.receiptRef,
    })),
  })).slice(0, 24).toUpperCase()}`;
}

function stagesFor(input: {
  addressVerified: boolean;
  agidAoidVerified: boolean;
  carrierAccepted: boolean;
  labelQrIssued: boolean;
  carrierScanVerified: boolean;
  recipientProofRequired: boolean;
  recipientProofVerified: boolean;
  terminalReceiptSigned: boolean;
}): CarrierLabelIntentStage[] {
  return [
    { key: 'address', label: 'Address Verified', complete: input.addressVerified, required: true },
    { key: 'agid-aoid', label: 'AGID/AOID Confirmed', complete: input.agidAoidVerified, required: true },
    { key: 'carrier', label: 'Carrier Accepted', complete: input.carrierAccepted, required: true },
    { key: 'label-qr', label: 'Label QR Issued', complete: input.labelQrIssued, required: true },
    { key: 'carrier-scan', label: 'Carrier Scan OK', complete: input.carrierScanVerified, required: true },
    {
      key: 'recipient-proof',
      label: 'Recipient Proof OK',
      complete: input.recipientProofVerified,
      required: input.recipientProofRequired,
    },
    { key: 'receipt', label: 'Completion Receipt', complete: input.terminalReceiptSigned, required: true },
  ];
}

function proofLevelFor(stages: readonly CarrierLabelIntentStage[]): ShippingLabelProofLevel {
  if (stages.find(stage => stage.key === 'receipt')?.complete) return 'delivery-completed';
  if (stages.find(stage => stage.key === 'recipient-proof')?.complete) return 'recipient-controlled';
  if (stages.find(stage => stage.key === 'carrier')?.complete) return 'carrier-accepted';
  if (stages.find(stage => stage.key === 'address')?.complete) return 'address-valid';
  return 'none';
}

function statusFor(input: {
  expired: boolean;
  rejectedReason?: string;
  manualReviewRequired?: boolean;
  manualReviewApproved?: boolean;
  evidencePending: boolean;
  evidenceWarning: boolean;
  evidenceFailed: boolean;
  errors: readonly string[];
  addressVerified: boolean;
  agidAoidVerified: boolean;
  carrierAccepted: boolean;
  labelQrIssued: boolean;
  carrierScanVerified: boolean;
  recipientProofRequired: boolean;
  recipientProofVerified: boolean;
  terminalReceiptSigned: boolean;
}): CarrierLabelIntentStatus {
  if (input.expired) return 'expired';
  if (input.rejectedReason) return 'rejected';
  if (input.evidenceFailed || input.errors.length > 0) return 'rejected';
  if ((input.manualReviewRequired || input.evidenceWarning || input.evidencePending) && !input.manualReviewApproved) {
    return 'requires_review';
  }
  if (!input.addressVerified) return 'requires_address_verification';
  if (!input.agidAoidVerified) return 'requires_agid_aoid';
  if (!input.carrierAccepted) return 'requires_carrier_acceptance';
  if (!input.labelQrIssued) return 'requires_label_qr';
  if (!input.carrierScanVerified) return 'label_qr_ready';
  if (input.recipientProofRequired && !input.recipientProofVerified) return 'recipient_proof_pending';
  if (!input.terminalReceiptSigned) return 'handoff_ready';
  return 'completed';
}

function nextActionFor(status: CarrierLabelIntentStatus): CarrierLabelIntentNextAction {
  switch (status) {
    case 'requires_address_verification': return 'verify_address';
    case 'requires_agid_aoid': return 'confirm_agid_aoid';
    case 'requires_carrier_acceptance': return 'request_carrier_acceptance';
    case 'requires_label_qr': return 'issue_label_qr';
    case 'label_qr_ready': return 'scan_label_qr';
    case 'recipient_proof_pending': return 'request_recipient_proof';
    case 'handoff_ready': return 'complete_handoff';
    case 'requires_review': return 'manual_review';
    default: return 'none';
  }
}

function privacy(): CarrierLabelIntentPrivacy {
  return {
    rawAddressStored: false,
    rawAgidStored: false,
    rawAoidStored: false,
    rawRecipientStored: false,
    rawProofCodeStored: false,
    rawLabelPayloadStored: false,
    carrierApiKeyStored: false,
    publicSurface: 'intent-state-commitments-receipts-and-next-action-only',
  };
}

export function buildCarrierLabelIntent(input: CarrierLabelIntentInput = {}): CarrierLabelIntent {
  const createdAt = validIsoOrDefault(input.createdAt);
  const updatedAt = validIsoOrDefault(input.updatedAt, createdAt);
  const evidenceResult = normalizeEvidence(input.evidence, updatedAt);
  const carrier = normalizeCarrier(input.carrier);
  const carrierPolicy = normalizeCarrierPolicy(input.carrierPolicy);
  const addressRisk = normalizeAddressRisk(input.addressRisk);
  const label = normalizeLabel(input.label, input.shippingLabelQrRecord);
  const errors = [...evidenceResult.errors, ...carrierPolicyErrors(carrierPolicy, addressRisk)];
  const warnings = [...evidenceResult.warnings];
  const purpose = normalizePurpose(input.purpose);
  const mode = normalizeMode(input.mode);
  const expiresAt = optionalIso(input.expiresAt) || label.expiresAt;
  const expired = expiresAt ? Date.parse(expiresAt) <= Date.parse(updatedAt) : false;
  const highRiskMode = Boolean(input.highRiskMode || input.shippingLabelQrRecord?.riskLevel === 'high');
  const recipientProofRequired = Boolean(input.recipientProofRequired || highRiskMode);

  const addressVerified = Boolean(input.addressVerified || evidencePassed(evidenceResult.evidence, 'address-verification'));
  const agidAoidVerified = Boolean(input.agidAoidVerified || evidencePassed(evidenceResult.evidence, 'agid-aoid-check'));
  const carrierAccepted = Boolean(
    input.carrierAccepted
    || carrier.acceptanceStatus === 'accepted'
    || evidencePassed(evidenceResult.evidence, 'carrier-acceptance')
    || Boolean(carrier.carrierReceiptRef),
  );
  const labelQrIssued = Boolean(
    input.labelQrIssued
    || evidencePassed(evidenceResult.evidence, 'label-qr-issued')
    || Boolean(label.waybillAlias && label.labelQrCommitment),
  );
  const carrierScanVerified = Boolean(input.carrierScanVerified || signedEvidencePassed(evidenceResult.evidence, 'carrier-scan'));
  const recipientProofVerified = Boolean(input.recipientProofVerified || evidencePassed(evidenceResult.evidence, 'recipient-proof'));
  const terminalReceiptSigned = Boolean(input.terminalReceiptSigned || signedEvidencePassed(evidenceResult.evidence, 'terminal-receipt'));

  if (carrier.plaintextShipmentRequired && mode !== 'external-carrier') {
    warnings.push('carrier-label-intent-plaintext-carrier-requires-explicit-external-carrier-mode');
  }
  if (highRiskMode && !recipientProofRequired) {
    errors.push('carrier-label-intent-high-risk-recipient-proof-required');
  }
  if (highRiskMode && carrier.plaintextShipmentRequired) {
    errors.push('carrier-label-intent-high-risk-plaintext-carrier-blocked');
  }
  if (label.rawQrPayloadStored || label.rawLabelPayloadStored) {
    errors.push('carrier-label-intent-raw-label-payload-must-not-be-stored');
  }

  const stages = stagesFor({
    addressVerified,
    agidAoidVerified,
    carrierAccepted,
    labelQrIssued,
    carrierScanVerified,
    recipientProofRequired,
    recipientProofVerified,
    terminalReceiptSigned,
  });
  const status = statusFor({
    expired,
    rejectedReason: input.rejectedReason,
    manualReviewRequired: input.manualReviewRequired,
    manualReviewApproved: input.manualReviewApproved,
    evidencePending: evidenceHasPending(evidenceResult.evidence),
    evidenceWarning: evidenceHasWarning(evidenceResult.evidence),
    evidenceFailed: evidenceHasFailure(evidenceResult.evidence),
    errors,
    addressVerified,
    agidAoidVerified,
    carrierAccepted,
    labelQrIssued,
    carrierScanVerified,
    recipientProofRequired,
    recipientProofVerified,
    terminalReceiptSigned,
  });

  return {
    modelVersion: CARRIER_LABEL_INTENT_VERSION,
    id: buildIntentId(input, createdAt),
    status,
    purpose,
    mode,
    proofLevel: proofLevelFor(stages),
    nextAction: nextActionFor(status),
    stages,
    carrier,
    carrierPolicy,
    addressRisk,
    label,
    evidence: evidenceResult.evidence,
    highRiskMode,
    recipientProofRequired,
    createdAt,
    updatedAt,
    ...(expiresAt ? { expiresAt } : {}),
    errors: Array.from(new Set([
      ...errors,
      ...(input.rejectedReason ? [clean(input.rejectedReason)] : []),
      ...(expired ? ['carrier-label-intent-expired'] : []),
    ])),
    warnings: Array.from(new Set(warnings)),
    privacy: privacy(),
  };
}

export function validateCarrierLabelIntent(intent: CarrierLabelIntent) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (intent.modelVersion !== CARRIER_LABEL_INTENT_VERSION) errors.push('carrier-label-intent-version-mismatch');
  if (intent.privacy.rawAddressStored !== false) errors.push('carrier-label-intent-raw-address-stored');
  if (intent.privacy.rawAgidStored !== false) errors.push('carrier-label-intent-raw-agid-stored');
  if (intent.privacy.rawAoidStored !== false) errors.push('carrier-label-intent-raw-aoid-stored');
  if (intent.privacy.rawProofCodeStored !== false) errors.push('carrier-label-intent-raw-proof-stored');
  if (intent.label.rawQrPayloadStored !== false || intent.label.rawLabelPayloadStored !== false) {
    errors.push('carrier-label-intent-raw-label-payload-stored');
  }

  const publicText = [
    intent.id,
    intent.status,
    intent.nextAction,
    intent.carrier.carrierId,
    intent.carrier.serviceLevel,
    intent.carrier.externalShipmentRef,
    intent.carrier.externalTrackingRef,
    intent.label.waybillAlias,
    intent.label.waybillCommitment,
    intent.label.labelQrCommitment,
    ...intent.evidence.flatMap(item => [item.code, item.safeFingerprint, item.receiptRef]),
    ...intent.errors,
    ...intent.warnings,
  ].filter(Boolean).join('\n');
  if (PUBLIC_PRIVATE_VALUE_RE.test(publicText)) errors.push('carrier-label-intent-public-surface-contains-private-token');

  if (intent.highRiskMode && !intent.recipientProofRequired) {
    errors.push('carrier-label-intent-high-risk-recipient-proof-required');
  }
  if (intent.status === 'completed' && intent.proofLevel !== 'delivery-completed') {
    errors.push('carrier-label-intent-completed-proof-level-mismatch');
  }
  if (intent.status === 'completed' && intent.nextAction !== 'none') {
    warnings.push('carrier-label-intent-completed-should-have-no-next-action');
  }

  return {
    ok: errors.length === 0 && intent.status !== 'rejected' && intent.status !== 'expired',
    errors,
    warnings,
  };
}

export function createInMemoryCarrierLabelIntentStore() {
  const intents = new Map<string, CarrierLabelIntent>();

  return {
    create(input: CarrierLabelIntentInput) {
      const intent = buildCarrierLabelIntent(input);
      intents.set(intent.id, intent);
      return intent;
    },
    get(intentId: string) {
      return intents.get(clean(intentId).toUpperCase());
    },
    update(intentId: string, patch: CarrierLabelIntentInput & { appendEvidence?: boolean }) {
      const existing = intents.get(clean(intentId).toUpperCase());
      if (!existing) return undefined;
      const evidence = patch.appendEvidence
        ? [...existing.evidence, ...(patch.evidence ?? [])]
        : patch.evidence ?? existing.evidence;
      const updated = buildCarrierLabelIntent({
        ...existing,
        ...patch,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: patch.updatedAt ?? new Date().toISOString(),
        purpose: patch.purpose ?? existing.purpose,
        mode: patch.mode ?? existing.mode,
        evidence,
      });
      intents.set(updated.id, updated);
      return updated;
    },
    listRecent(limit = 20) {
      return Array.from(intents.values())
        .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
        .slice(0, Math.max(1, Math.min(100, limit)));
    },
  };
}
