import {
  parseRegisteredAddressQrPayload,
  type RegisteredAddressRecord,
} from './registeredAddressQr';
import { summarizeAgidSecureToken } from './agidSecureShare';
import {
  isValidAGIDFormat,
  normalizeAGIDInput,
} from './agidSecurity';
import {
  SHIPPING_LABEL_RECIPIENT_CHALLENGE_SIGNATURE_ALGORITHM,
  parseShippingLabelQrPayload,
  summarizeShippingLabelRecord,
  verifyShippingLabelScan,
  type ShippingLabelProofLevel,
  type ShippingLabelProofStage,
  type ShippingLabelDomainSeparation,
  type ShippingLabelRecipientChallengeProof,
  type ShippingLabelRecipientProofMethod,
  type ShippingLabelRiskLevel,
  type ShippingLabelSafetyPolicy,
  type ShippingLabelScanRole,
} from './shippingLabelQr';
import {
  evaluatePosEthereumPayment,
  hasPosEthereumPaymentSignal,
  type PosEthereumPaymentDecision,
  type PosEthereumPaymentKind,
  type PosEthereumPaymentStatus,
  type PosEthereumSettlementMode,
} from './posEthereumPayment';
import type {
  ShippingAddressAccuracyDecision,
  ShippingAddressAccuracySource,
  ShippingAddressAccuracyStatus,
} from './shippingAddressAccuracy';
import type {
  CarrierLabelAcceptancePolicy,
  CarrierLabelAddressRisk,
  CarrierLabelRejectionReason,
} from './carrierLabelIntent';
import { sha256Hex } from './sha256';

export const POS_NFC_PREFIX = 'agid:nfc:';
export const POS_ACCEPTANCE_MODEL_VERSION = 'agid-pos-acceptance-v1';
export const POS_TERMINAL_EVIDENCE_SIGNATURE_ALGORITHM = 'sha256-pos-terminal-carrier-evidence-fingerprint-v2';

export type PosAcceptanceChannel = 'qr' | 'nfc' | 'manual';
export type PosAcceptanceStatus = 'accepted' | 'rejected' | 'review';

export type PosAcceptanceInput = {
  payload: string;
  channel?: PosAcceptanceChannel;
  scanRole?: ShippingLabelScanRole;
  recipientProofCode?: string;
  recipientProofSecret?: string;
  recipientProofMethod?: ShippingLabelRecipientProofMethod;
  recipientChallenge?: string;
  recipientChallengeSignature?: string;
  recipientChallengeAlgorithm?: string;
  recipientChallengePublicKeyHint?: string;
  carrierTerminalId?: string;
  carrierTerminalSignature?: string;
  carrierTerminalSignedAt?: string;
  storePosId?: string;
  carrierLocation?: PosCarrierLocationInput;
  carrierLocationLat?: number;
  carrierLocationLon?: number;
  carrierLocationAccuracyMeters?: number;
  carrierLocationLabel?: string;
  terminalId?: string;
  operatorId?: string;
  purpose?: string;
  amount?: number;
  currency?: string;
  paymentKind?: PosEthereumPaymentKind | string;
  settlementMode?: PosEthereumSettlementMode | string;
  paymentId?: string;
  escrowId?: string;
  payerCommitment?: string;
  payeeCommitment?: string;
  paymentStatus?: PosEthereumPaymentStatus | string;
  tokenSymbol?: string;
  tokenContract?: string;
  paymentNetworkId?: string;
  paymentContractAddress?: string;
  observedPaymentTxHash?: string;
  releaseAfterHandoff?: boolean;
  highRiskPaymentMode?: boolean;
  carrierPolicy?: Partial<CarrierLabelAcceptancePolicy>;
  addressRisk?: Partial<CarrierLabelAddressRisk>;
};

export type PosCarrierLocationInput = {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lon?: number;
  lng?: number;
  accuracyMeters?: number;
  label?: string;
};

export type PosRecordSummary = {
  recordType: RegisteredAddressRecord['type'] | 'AGID' | 'WAYBILL';
  entityIdTail: string;
  agidTail?: string;
  country?: string;
  city?: string;
  postcode?: string;
  label: string;
  rawPayloadStored: false;
};

export type PosShippingLabelEvidence = {
  waybillId: string;
  waybillAlias: true;
  waybillCommitment?: string;
  addressReferenceCommitment?: string;
  jti: string;
  nullifier: string;
  riskLevel: ShippingLabelRiskLevel;
  safetyPolicy: ShippingLabelSafetyPolicy;
  scanId: string;
  scanRole: ShippingLabelScanRole;
  proofLevel: ShippingLabelProofLevel;
  proofStages: ShippingLabelProofStage[];
  addressVerified: boolean;
  addressAccuracyStatus: ShippingAddressAccuracyStatus;
  addressAccuracyDecision: ShippingAddressAccuracyDecision;
  addressAccuracySources: ShippingAddressAccuracySource[];
  carrierScanVerified: boolean;
  recipientControlVerified: boolean;
  packageReceiptVerified: boolean;
  recipientChallengeRequired: boolean;
  recipientChallengeVerified: boolean;
  recipientChallengeHash?: string;
  recipientChallengeSignatureTail?: string;
  expiresAt: string;
  terminalEvidenceSignature: string;
  terminalEvidenceSignatureAlgorithm: typeof POS_TERMINAL_EVIDENCE_SIGNATURE_ALGORITHM;
  terminalSignedAt: string;
  storePosId: string;
  carrierTerminalId?: string;
  carrierTerminalSignature?: string;
  carrierTerminalSignedAt?: string;
  carrierLocation?: PosCarrierLocationEvidence;
  dualScanRequired: boolean;
  proofMethod: ShippingLabelRecipientProofMethod;
  proofDomain?: string;
  proofNonceTail?: string;
  domainSeparation?: ShippingLabelDomainSeparation;
  carrierPolicyDecision?: PosCarrierPolicyDecision;
};

export type PosCarrierPolicyDecision = {
  applied: boolean;
  rejected: boolean;
  reasons: CarrierLabelRejectionReason[];
  policy: CarrierLabelAcceptancePolicy;
  addressRisk: CarrierLabelAddressRisk;
};

export type PosCarrierLocationEvidence = {
  precision: 'coarse' | 'coarse-high-risk';
  latBucket?: number;
  lonBucket?: number;
  accuracyMeters?: number;
  label?: string;
};

export type PosAcceptanceReceipt = {
  modelVersion: typeof POS_ACCEPTANCE_MODEL_VERSION;
  receiptId: string;
  accepted: boolean;
  status: PosAcceptanceStatus;
  channel: PosAcceptanceChannel;
  terminalId: string;
  operatorId?: string;
  purpose: string;
  amount?: number;
  currency?: string;
  createdAt: string;
  record?: PosRecordSummary;
  shippingLabel?: PosShippingLabelEvidence;
  ethereumPayment?: PosEthereumPaymentDecision;
  errors: string[];
  warnings: string[];
  privacyNotes: string[];
};

type UnwrappedPayload = {
  payload: string;
  channel: PosAcceptanceChannel;
  wrapperType: 'plain' | 'nfc-wrapper' | 'json-wrapper';
  tagId?: string;
  warnings: string[];
};

const PRIVATE_FIELD_KEYS = [
  'recipient',
  'phone',
  'street',
  'room',
  'building',
  'lat',
  'lon',
  'lng',
  'address',
];

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanBoundedText(value: unknown, maxLength = 512) {
  const cleaned = cleanText(value);
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
}

function readFiniteNumber(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return value;
}

function cleanCurrency(value: unknown) {
  const cleaned = cleanText(value).toUpperCase();
  return /^[A-Z]{3}$/.test(cleaned) ? cleaned : undefined;
}

function cleanScanRole(value: unknown): ShippingLabelScanRole {
  return value === 'recipient' ? 'recipient' : 'carrier';
}

function positiveAmount(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  if (value < 0) return undefined;
  return Math.round(value * 100) / 100;
}

function shortTail(value: unknown, size = 6) {
  const cleaned = cleanText(value);
  if (!cleaned) return '';
  return cleaned.length <= size ? cleaned : cleaned.slice(-size);
}

function normalizeCarrierAcceptancePolicy(
  input: Partial<CarrierLabelAcceptancePolicy> | undefined,
): CarrierLabelAcceptancePolicy {
  return {
    rejectAddressDefect: input?.rejectAddressDefect ?? false,
    rejectUndeliverableRegion: input?.rejectUndeliverableRegion ?? false,
    rejectPoBox: input?.rejectPoBox ?? false,
    rejectAutoLock: input?.rejectAutoLock ?? false,
    requireAoidAccessProfileForPoBoxOrAutoLock: input?.requireAoidAccessProfileForPoBoxOrAutoLock ?? true,
    ...(cleanText(input?.policyRef) ? { policyRef: cleanBoundedText(input?.policyRef, 160) } : {}),
  };
}

function normalizeAddressRisk(
  input: Partial<CarrierLabelAddressRisk> | undefined,
  shippingLabelScan: NonNullable<ReturnType<typeof verifyShippingLabelScan>> | null,
): CarrierLabelAddressRisk {
  const addressDefect = Boolean(input?.addressDefect || shippingLabelScan?.addressAccuracyStatus === 'needs-review');
  const undeliverableRegion = Boolean(input?.undeliverableRegion);
  const poBox = Boolean(input?.poBox);
  const autoLock = Boolean(input?.autoLock);
  const reasonCodes = new Set<CarrierLabelRejectionReason>(input?.reasonCodes ?? []);
  if (addressDefect) reasonCodes.add('address-defect');
  if (undeliverableRegion) reasonCodes.add('undeliverable-region');
  if (poBox) reasonCodes.add('po-box');
  if (autoLock) reasonCodes.add('auto-lock');
  return {
    addressDefect,
    undeliverableRegion,
    poBox,
    autoLock,
    aoidAccessProfileConfirmed: Boolean(input?.aoidAccessProfileConfirmed),
    reasonCodes: Array.from(reasonCodes),
  };
}

function buildCarrierPolicyDecision(
  policy: CarrierLabelAcceptancePolicy,
  addressRisk: CarrierLabelAddressRisk,
): PosCarrierPolicyDecision {
  const reasons: CarrierLabelRejectionReason[] = [];
  if (policy.rejectAddressDefect && addressRisk.addressDefect) reasons.push('address-defect');
  if (policy.rejectUndeliverableRegion && addressRisk.undeliverableRegion) reasons.push('undeliverable-region');
  if (policy.rejectPoBox && addressRisk.poBox) reasons.push('po-box');
  if (policy.rejectAutoLock && addressRisk.autoLock) reasons.push('auto-lock');
  if (
    policy.requireAoidAccessProfileForPoBoxOrAutoLock
    && (addressRisk.poBox || addressRisk.autoLock)
    && !addressRisk.aoidAccessProfileConfirmed
  ) {
    reasons.push('carrier-policy');
  }

  return {
    applied: true,
    rejected: reasons.length > 0,
    reasons: Array.from(new Set(reasons)),
    policy,
    addressRisk,
  };
}

function carrierPolicyErrors(decision: PosCarrierPolicyDecision) {
  return decision.reasons.map((reason) => {
    if (reason === 'address-defect') return 'carrier-policy-rejects-address-defect';
    if (reason === 'undeliverable-region') return 'carrier-policy-rejects-undeliverable-region';
    if (reason === 'po-box') return 'carrier-policy-rejects-po-box';
    if (reason === 'auto-lock') return 'carrier-policy-rejects-auto-lock';
    if (reason === 'carrier-policy') return 'carrier-policy-requires-aoid-access-profile';
    return 'carrier-policy-rejects-label';
  });
}

function cleanIsoTimestamp(value: unknown, fallback: string) {
  const cleaned = cleanText(value);
  if (!cleaned) return fallback;
  const parsed = Date.parse(cleaned);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : fallback;
}

function readLocationNumber(primary: unknown, secondary: unknown, min: number, max: number) {
  const value = readFiniteNumber(primary) ?? readFiniteNumber(secondary);
  return value !== undefined && value >= min && value <= max ? value : undefined;
}

function buildCarrierLocationEvidence(
  input: PosAcceptanceInput,
  riskLevel: ShippingLabelRiskLevel,
): PosCarrierLocationEvidence | undefined {
  const lat = readLocationNumber(input.carrierLocationLat, input.carrierLocation?.latitude ?? input.carrierLocation?.lat, -90, 90);
  const lon = readLocationNumber(input.carrierLocationLon, input.carrierLocation?.longitude ?? input.carrierLocation?.lon ?? input.carrierLocation?.lng, -180, 180);
  const label = cleanBoundedText(input.carrierLocationLabel || input.carrierLocation?.label, 120);
  const accuracy = readFiniteNumber(input.carrierLocationAccuracyMeters)
    ?? readFiniteNumber(input.carrierLocation?.accuracyMeters);
  if (lat === undefined && lon === undefined && !label) return undefined;

  const highRisk = riskLevel === 'high';
  const factor = highRisk ? 10 : 100;
  return {
    precision: highRisk ? 'coarse-high-risk' : 'coarse',
    ...(lat !== undefined ? { latBucket: Math.round(lat * factor) / factor } : {}),
    ...(lon !== undefined ? { lonBucket: Math.round(lon * factor) / factor } : {}),
    ...(accuracy !== undefined ? { accuracyMeters: Math.max(Math.round(accuracy), highRisk ? 10000 : 1000) } : { accuracyMeters: highRisk ? 10000 : 1000 }),
    ...(label ? { label } : {}),
  };
}

function compact<T>(values: Array<T | undefined | null | ''>) {
  return values.filter((value): value is T => Boolean(value));
}

function stableReceiptHash(value: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(7, '0');
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function createTerminalEvidenceSignature(input: {
  terminalId: string;
  operatorId?: string;
  storePosId: string;
  carrierTerminalId?: string;
  carrierTerminalSignature?: string;
  carrierTerminalSignedAt?: string;
  carrierLocation?: PosCarrierLocationEvidence;
  waybillId: string;
  waybillCommitment?: string;
  addressReferenceCommitment?: string;
  jti?: string;
  nullifier?: string;
  scanId: string;
  scanRole: ShippingLabelScanRole;
  recipientChallengeVerified?: boolean;
  domainSeparation?: ShippingLabelDomainSeparation;
  createdAt: string;
  purpose: string;
  status: PosAcceptanceStatus;
}) {
  return `TSIG-${sha256Hex(stableJson({
    algorithm: POS_TERMINAL_EVIDENCE_SIGNATURE_ALGORITHM,
    terminalId: input.terminalId,
    operatorId: input.operatorId || '',
    storePosId: input.storePosId,
    carrierTerminalId: input.carrierTerminalId || '',
    carrierTerminalSignature: input.carrierTerminalSignature || '',
    carrierTerminalSignedAt: input.carrierTerminalSignedAt || '',
    carrierLocation: input.carrierLocation || null,
    waybillId: input.waybillId,
    waybillCommitment: input.waybillCommitment || '',
    addressReferenceCommitment: input.addressReferenceCommitment || '',
    jti: input.jti || '',
    nullifier: input.nullifier || '',
    scanId: input.scanId,
    scanRole: input.scanRole,
    recipientChallengeVerified: Boolean(input.recipientChallengeVerified),
    domainSeparation: input.domainSeparation || null,
    createdAt: input.createdAt,
    purpose: input.purpose,
    status: input.status,
  })).slice(0, 32).toUpperCase()}`;
}

function buildRecipientChallengeProof(input: PosAcceptanceInput): ShippingLabelRecipientChallengeProof | undefined {
  const challenge = cleanText(input.recipientChallenge);
  const signature = cleanText(input.recipientChallengeSignature);
  if (!challenge && !signature) return undefined;
  return {
    challenge,
    signature,
    algorithm: cleanText(input.recipientChallengeAlgorithm) || SHIPPING_LABEL_RECIPIENT_CHALLENGE_SIGNATURE_ALGORITHM,
    ...(cleanText(input.recipientChallengePublicKeyHint) ? { publicKeyHint: cleanText(input.recipientChallengePublicKeyHint) } : {}),
  };
}

function hashRecipientChallenge(challenge: string) {
  return `WCHH-${sha256Hex(stableJson({
    kind: 'pos-recipient-challenge-evidence',
    challenge: cleanText(challenge),
  })).slice(0, 24).toUpperCase()}`;
}

function safeJson(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : undefined;
  } catch {
    return undefined;
  }
}

function decodeComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function readRegisteredAddressEnvelope(payload: string) {
  if (!payload.startsWith('agid:address:')) return undefined;
  return safeJson(decodeComponent(payload.slice('agid:address:'.length)));
}

function hasPrivateFieldMaterial(payload: string) {
  const envelope = readRegisteredAddressEnvelope(payload);
  const record = envelope?.record;
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false;
  return PRIVATE_FIELD_KEYS.some((key) => {
    const value = (record as Record<string, unknown>)[key];
    return typeof value === 'string'
      ? value.trim().length > 0
      : typeof value === 'number';
  });
}

function readPayloadPrivacy(payload: string) {
  const envelope = readRegisteredAddressEnvelope(payload);
  const privacy = envelope?.privacy;
  return typeof privacy === 'string' ? privacy : undefined;
}

export function buildPosNfcPayload(
  payload: string,
  options: {
    tagId?: string;
    terminalId?: string;
    createdAt?: string;
  } = {},
) {
  return `${POS_NFC_PREFIX}${encodeURIComponent(JSON.stringify({
    version: 1,
    profile: POS_ACCEPTANCE_MODEL_VERSION,
    transport: 'ndef-text',
    tagId: cleanText(options.tagId) || undefined,
    terminalId: cleanText(options.terminalId) || undefined,
    createdAt: options.createdAt || new Date().toISOString(),
    payload,
  }))}`;
}

export function unwrapPosAcceptancePayload(input: PosAcceptanceInput): UnwrappedPayload {
  const fallbackChannel = input.channel ?? 'manual';
  const raw = cleanText(input.payload);
  const warnings: string[] = [];
  if (!raw) {
    return {
      payload: '',
      channel: fallbackChannel,
      wrapperType: 'plain',
      warnings: ['payload-empty'],
    };
  }

  if (raw.startsWith(POS_NFC_PREFIX)) {
    const decoded = decodeComponent(raw.slice(POS_NFC_PREFIX.length));
    const wrapper = safeJson(decoded);
    const payload = cleanText(wrapper?.payload);
    if (!payload) warnings.push('nfc-wrapper-missing-inner-payload');
    return {
      payload,
      channel: 'nfc',
      wrapperType: 'nfc-wrapper',
      tagId: cleanText(wrapper?.tagId) || undefined,
      warnings,
    };
  }

  const jsonWrapper = safeJson(raw);
  if (jsonWrapper && typeof jsonWrapper.payload === 'string') {
    const transport = cleanText(jsonWrapper.transport).toLowerCase();
    return {
      payload: cleanText(jsonWrapper.payload),
      channel: transport.includes('nfc') ? 'nfc' : fallbackChannel,
      wrapperType: 'json-wrapper',
      tagId: cleanText(jsonWrapper.tagId) || undefined,
      warnings,
    };
  }

  return {
    payload: raw,
    channel: fallbackChannel,
    wrapperType: 'plain',
    warnings,
  };
}

function summarizeRecord(record: RegisteredAddressRecord): PosRecordSummary {
  const entityTail = shortTail(record.id);
  const agidTail = shortTail(record.agid);
  const labelParts = compact([
    record.type,
    record.country,
    record.city,
    record.postcode,
    entityTail ? `id:${entityTail}` : undefined,
  ]);

  return {
    recordType: record.type,
    entityIdTail: entityTail,
    ...(agidTail ? { agidTail } : {}),
    ...(cleanText(record.country) ? { country: cleanText(record.country) } : {}),
    ...(cleanText(record.city) ? { city: cleanText(record.city) } : {}),
    ...(cleanText(record.postcode) ? { postcode: cleanText(record.postcode) } : {}),
    label: labelParts.join(' / ') || record.type,
    rawPayloadStored: false,
  };
}

function summarizeDirectAgid(agid: string): PosRecordSummary {
  const agidTail = shortTail(agid);
  return {
    recordType: 'AGID',
    entityIdTail: agidTail,
    agidTail,
    label: `AGID / id:${agidTail}`,
    rawPayloadStored: false,
  };
}

export function createPosAcceptanceReceipt(
  input: PosAcceptanceInput,
  options: {
    now?: string;
    requestId?: string;
    usedShippingLabelNullifiers?: Iterable<string>;
  } = {},
): PosAcceptanceReceipt {
  const createdAt = options.now || new Date().toISOString();
  const unwrapped = unwrapPosAcceptancePayload(input);
  const terminalId = cleanText(input.terminalId) || 'AGID-POS-LOCAL';
  const storePosId = cleanText(input.storePosId) || terminalId;
  const operatorId = cleanText(input.operatorId);
  const purpose = cleanText(input.purpose) || 'pos-acceptance';
  const amount = positiveAmount(input.amount);
  const currency = cleanCurrency(input.currency);
  const errors: string[] = [];
  const warnings = [...unwrapped.warnings];
  const privacyNotes = [
    'Raw QR/NFC payload is not persisted in the POS receipt.',
    'Receipt stores redacted tails, short-term waybill aliases, and commitments instead of raw AGID or private address payloads.',
  ];

  if (!unwrapped.payload) errors.push('missing-payload');
  const agidSecureSummary = unwrapped.payload ? summarizeAgidSecureToken(unwrapped.payload) : null;
  const shippingLabelRecord = unwrapped.payload && !agidSecureSummary
    ? parseShippingLabelQrPayload(unwrapped.payload)
    : null;
  const shippingLabelScan = shippingLabelRecord
    ? verifyShippingLabelScan(unwrapped.payload, {
      role: cleanScanRole(input.scanRole),
      recipientProofCode: input.recipientProofCode,
      recipientProofSecret: input.recipientProofSecret,
      recipientProofMethod: input.recipientProofMethod,
      recipientChallenge: buildRecipientChallengeProof(input),
      usedNullifiers: options.usedShippingLabelNullifiers,
      now: createdAt,
    })
    : null;
  const carrierPolicyDecision = shippingLabelScan
    ? buildCarrierPolicyDecision(
      normalizeCarrierAcceptancePolicy(input.carrierPolicy),
      normalizeAddressRisk(input.addressRisk, shippingLabelScan),
    )
    : undefined;
  const record = unwrapped.payload && !agidSecureSummary && !shippingLabelRecord
    ? parseRegisteredAddressQrPayload(unwrapped.payload)
    : null;
  const directAgid = unwrapped.payload && !agidSecureSummary && !record && !shippingLabelRecord
    ? normalizeAGIDInput(unwrapped.payload)
    : null;
  const directAgidSummary = directAgid && isValidAGIDFormat(directAgid)
    ? summarizeDirectAgid(directAgid)
    : null;
  if (agidSecureSummary) {
    errors.push('agid-s-requires-decryption-key');
    privacyNotes.push('AGID-S is an encrypted AGID envelope; the AGID is not exposed until an authorized key decrypts it.');
  } else if (shippingLabelScan) {
    errors.push(...shippingLabelScan.errors);
    warnings.push(...shippingLabelScan.warnings);
    privacyNotes.push(...shippingLabelScan.privacyNotes);
    if (carrierPolicyDecision) {
      errors.push(...carrierPolicyErrors(carrierPolicyDecision));
      privacyNotes.push('Carrier acceptance policy stores only policy flags, reason codes, and commitments; it does not store raw address text, raw AGID, or recipient material.');
    }
    if (shippingLabelScan.role === 'carrier') {
      const carrierTerminalId = cleanBoundedText(input.carrierTerminalId, 120);
      const carrierTerminalSignature = cleanBoundedText(input.carrierTerminalSignature, 512);
      if (!carrierTerminalId) errors.push('carrier-terminal-id-required');
      if (!carrierTerminalSignature) errors.push('carrier-terminal-signature-required');
    }
  } else if (directAgidSummary) {
    privacyNotes.push('Direct AGID payload is accepted after local AGID-S decryption or public AGID scan.');
  } else if (unwrapped.payload && !record) {
    errors.push('unsupported-or-invalid-agid-address-payload');
  }
  if (typeof input.amount === 'number' && amount === undefined) warnings.push('invalid-amount-ignored');
  if (input.currency && !currency) warnings.push('invalid-currency-ignored');

  const ethereumPaymentSignal = hasPosEthereumPaymentSignal({
    paymentKind: input.paymentKind,
    settlementMode: input.settlementMode,
    paymentId: input.paymentId,
    escrowId: input.escrowId,
    payerCommitment: input.payerCommitment,
    payeeCommitment: input.payeeCommitment,
    tokenSymbol: input.tokenSymbol,
    tokenContract: input.tokenContract,
    observedTxHash: input.observedPaymentTxHash,
    paymentStatus: input.paymentStatus,
  });
  const ethereumPayment = ethereumPaymentSignal
    ? evaluatePosEthereumPayment({
      paymentKind: input.paymentKind,
      settlementMode: input.settlementMode,
      paymentId: input.paymentId,
      escrowId: input.escrowId,
      waybillAlias: shippingLabelScan?.waybillId ?? shippingLabelRecord?.waybillId,
      waybillCommitment: shippingLabelScan?.record.waybillCommitment ?? shippingLabelRecord?.waybillCommitment,
      payerCommitment: input.payerCommitment,
      payeeCommitment: input.payeeCommitment,
      purpose,
      amount,
      currency,
      tokenSymbol: input.tokenSymbol,
      tokenContract: input.tokenContract,
      networkId: input.paymentNetworkId,
      paymentContractAddress: input.paymentContractAddress,
      observedTxHash: input.observedPaymentTxHash,
      paymentStatus: input.paymentStatus,
      releaseAfterHandoff: input.releaseAfterHandoff,
      highRiskMode: input.highRiskPaymentMode || shippingLabelScan?.riskLevel === 'high',
    })
    : undefined;
  if (ethereumPayment) {
    errors.push(...ethereumPayment.errors);
    warnings.push(...ethereumPayment.warnings);
    privacyNotes.push('Ethereum payment mode stores only payment ids, commitments, tx plans, and tx hashes; raw address, AGID, AOID, and wallet secrets are forbidden.');
    if (!ethereumPayment.handoffGate.canAcceptCarrierScan) {
      errors.push('ethereum-payment-blocks-pos-acceptance');
    }
    if (!ethereumPayment.handoffGate.canReleasePackage) {
      warnings.push('ethereum-payment-required-before-package-release');
      if (shippingLabelScan?.role === 'recipient') {
        warnings.push('ethereum-payment-required-before-recipient-release');
      }
    }
  }

  const payloadPrivacy = readPayloadPrivacy(unwrapped.payload);
  if (payloadPrivacy === 'full' || hasPrivateFieldMaterial(unwrapped.payload)) {
    warnings.push('private-payload-redacted-before-receipt-storage');
  }
  if (unwrapped.channel === 'nfc' && unwrapped.wrapperType === 'plain') {
    warnings.push('nfc-channel-without-agid-nfc-wrapper');
  }

  const recordSummary = shippingLabelRecord
    ? summarizeShippingLabelRecord(shippingLabelRecord)
    : record
      ? summarizeRecord(record)
      : directAgidSummary;
  const paymentForcesReview = Boolean(ethereumPayment && !ethereumPayment.handoffGate.canReleasePackage);
  const accepted = errors.length === 0 && Boolean(recordSummary);
  const status: PosAcceptanceStatus = accepted
    ? (shippingLabelScan?.status === 'review' || paymentForcesReview)
      ? 'review'
      : warnings.includes('private-payload-redacted-before-receipt-storage')
      ? 'review'
      : 'accepted'
    : 'rejected';
  const hashSeed = [
    POS_ACCEPTANCE_MODEL_VERSION,
    createdAt,
    terminalId,
    operatorId,
    unwrapped.channel,
    purpose,
    recordSummary?.recordType,
    recordSummary?.entityIdTail,
    shippingLabelScan?.role,
    carrierPolicyDecision?.reasons.join(','),
    ethereumPayment?.publicPaymentRef,
    options.requestId,
  ].join('|');

  const carrierLocation = shippingLabelScan
    ? buildCarrierLocationEvidence(input, shippingLabelScan.riskLevel)
    : undefined;
  const carrierTerminalId = cleanBoundedText(input.carrierTerminalId, 120);
  const carrierTerminalSignature = cleanBoundedText(input.carrierTerminalSignature, 512);
  const carrierTerminalSignedAt = cleanIsoTimestamp(input.carrierTerminalSignedAt, createdAt);
  if (carrierLocation) {
    privacyNotes.push('Carrier location evidence is stored only as a coarse bucket; high-risk waybills use wider coarse buckets.');
  }
  if (shippingLabelScan?.record.safetyPolicy.mode === 'high-risk') {
    privacyNotes.push('High-risk mode is active: precise AGID is not stored, AGID-S-only sharing is required, receipts should be marked used immediately, and address history must not be retained.');
  }

  return {
    modelVersion: POS_ACCEPTANCE_MODEL_VERSION,
    receiptId: `POS-${stableReceiptHash(hashSeed)}`,
    accepted,
    status,
    channel: unwrapped.channel,
    terminalId,
    ...(operatorId ? { operatorId } : {}),
    purpose,
    ...(amount !== undefined ? { amount } : {}),
    ...(currency ? { currency } : {}),
    createdAt,
    ...(recordSummary ? { record: recordSummary } : {}),
    ...(shippingLabelScan ? {
      shippingLabel: {
        waybillId: shippingLabelScan.waybillId,
        waybillAlias: true,
        ...(shippingLabelScan.record.waybillCommitment ? { waybillCommitment: shippingLabelScan.record.waybillCommitment } : {}),
        ...(shippingLabelScan.record.address.referenceCommitment ? { addressReferenceCommitment: shippingLabelScan.record.address.referenceCommitment } : {}),
        jti: shippingLabelScan.jti,
        nullifier: shippingLabelScan.nullifier,
        riskLevel: shippingLabelScan.riskLevel,
        safetyPolicy: shippingLabelScan.record.safetyPolicy,
        scanId: shippingLabelScan.scanId,
        scanRole: shippingLabelScan.role,
        proofLevel: shippingLabelScan.proofLevel,
        proofStages: shippingLabelScan.proofStages,
        addressVerified: shippingLabelScan.addressVerified,
        addressAccuracyStatus: shippingLabelScan.addressAccuracyStatus,
        addressAccuracyDecision: shippingLabelScan.addressAccuracyDecision,
        addressAccuracySources: shippingLabelScan.addressAccuracySources,
        carrierScanVerified: shippingLabelScan.carrierScanVerified,
        recipientControlVerified: shippingLabelScan.ownerVerified,
        packageReceiptVerified: shippingLabelScan.packageReceiptVerified,
        recipientChallengeRequired: shippingLabelScan.recipientChallengeRequired,
        recipientChallengeVerified: shippingLabelScan.recipientChallengeVerified,
        ...(cleanText(input.recipientChallenge) ? { recipientChallengeHash: hashRecipientChallenge(input.recipientChallenge) } : {}),
        ...(cleanText(input.recipientChallengeSignature) ? { recipientChallengeSignatureTail: shortTail(input.recipientChallengeSignature, 10) } : {}),
        expiresAt: shippingLabelScan.record.expiresAt,
        terminalEvidenceSignature: createTerminalEvidenceSignature({
          terminalId,
          ...(operatorId ? { operatorId } : {}),
          storePosId,
          ...(carrierTerminalId ? { carrierTerminalId } : {}),
          ...(carrierTerminalSignature ? { carrierTerminalSignature } : {}),
          ...(carrierTerminalSignedAt ? { carrierTerminalSignedAt } : {}),
          ...(carrierLocation ? { carrierLocation } : {}),
          waybillId: shippingLabelScan.waybillId,
          ...(shippingLabelScan.record.waybillCommitment ? { waybillCommitment: shippingLabelScan.record.waybillCommitment } : {}),
          ...(shippingLabelScan.record.address.referenceCommitment ? { addressReferenceCommitment: shippingLabelScan.record.address.referenceCommitment } : {}),
          jti: shippingLabelScan.jti,
          nullifier: shippingLabelScan.nullifier,
          scanId: shippingLabelScan.scanId,
          scanRole: shippingLabelScan.role,
          recipientChallengeVerified: shippingLabelScan.recipientChallengeVerified,
          domainSeparation: shippingLabelScan.record.domainSeparation,
          createdAt,
          purpose,
          status,
        }),
        terminalEvidenceSignatureAlgorithm: POS_TERMINAL_EVIDENCE_SIGNATURE_ALGORITHM,
        terminalSignedAt: createdAt,
        storePosId,
        ...(carrierTerminalId ? { carrierTerminalId } : {}),
        ...(carrierTerminalSignature ? { carrierTerminalSignature } : {}),
        ...(carrierTerminalSignature ? { carrierTerminalSignedAt } : {}),
        ...(carrierLocation ? { carrierLocation } : {}),
        dualScanRequired: shippingLabelScan.record.requiredScans.includes('carrier')
          && shippingLabelScan.record.requiredScans.includes('recipient'),
        proofMethod: shippingLabelScan.record.recipientProof.method,
        ...(cleanText(shippingLabelScan.record.recipientProof.domain) ? { proofDomain: cleanText(shippingLabelScan.record.recipientProof.domain) } : {}),
        ...(cleanText(shippingLabelScan.record.recipientProof.nonce) ? { proofNonceTail: shortTail(shippingLabelScan.record.recipientProof.nonce, 8) } : {}),
        domainSeparation: shippingLabelScan.record.domainSeparation,
        ...(carrierPolicyDecision ? { carrierPolicyDecision } : {}),
      },
    } : {}),
    ...(ethereumPayment ? { ethereumPayment } : {}),
    errors,
    warnings: Array.from(new Set(warnings)),
    privacyNotes,
  };
}

export function previewPosAcceptanceInput(input: PosAcceptanceInput) {
  const receipt = createPosAcceptanceReceipt(input, {
    now: '1970-01-01T00:00:00.000Z',
    requestId: 'preview',
  });
  return {
    accepted: receipt.accepted,
    status: receipt.status,
    channel: receipt.channel,
    record: receipt.record,
    ...(receipt.shippingLabel ? {
      shippingLabel: {
        addressAccuracyStatus: receipt.shippingLabel.addressAccuracyStatus,
        addressAccuracyDecision: receipt.shippingLabel.addressAccuracyDecision,
        addressAccuracySources: receipt.shippingLabel.addressAccuracySources,
        carrierPolicyDecision: receipt.shippingLabel.carrierPolicyDecision,
        proofLevel: receipt.shippingLabel.proofLevel,
        proofStages: receipt.shippingLabel.proofStages,
        carrierScanVerified: receipt.shippingLabel.carrierScanVerified,
        recipientControlVerified: receipt.shippingLabel.recipientControlVerified,
        packageReceiptVerified: receipt.shippingLabel.packageReceiptVerified,
      },
    } : {}),
    ...(receipt.ethereumPayment ? {
      ethereumPayment: {
        paymentKind: receipt.ethereumPayment.paymentKind,
        settlementMode: receipt.ethereumPayment.settlementMode,
        status: receipt.ethereumPayment.status,
        requiredAction: receipt.ethereumPayment.requiredAction,
        canReleasePackage: receipt.ethereumPayment.handoffGate.canReleasePackage,
        publicPaymentRef: receipt.ethereumPayment.publicPaymentRef,
      },
    } : {}),
    errors: receipt.errors,
    warnings: receipt.warnings,
  };
}
