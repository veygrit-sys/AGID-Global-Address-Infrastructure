import {
  ADDRESS_RADAR_MODEL_VERSION,
  evaluateAddressRadar,
  type AddressRadarEvaluation,
  type AddressRadarInput,
  type AddressRadarNextAction,
  type AddressRadarRiskLevel,
  type AddressRadarThresholds,
} from './addressRadar';

export const ADDRESS_SIGNAL_MODEL_VERSION = 'agid-address-signal-v1';

export const ADDRESS_SIGNAL_OUTCOMES = ['proceed', 'challenge', 'review', 'reject'] as const;
export const ADDRESS_SIGNAL_REASONS = [
  'qr-expired',
  'qr-missing-jti',
  'qr-used-before',
  'qr-reused',
  'nullifier-reused',
  'address-quality-partial',
  'address-quality-low',
  'high-value-delivery',
  'carrier-device-untrusted',
  'carrier-scan-unsigned',
  'recipient-proof-missing',
  'issuer-revoked',
  'registry-stale',
  'offline-conflict',
] as const;

export type AddressSignalOutcome = typeof ADDRESS_SIGNAL_OUTCOMES[number];
export type AddressSignalReason = typeof ADDRESS_SIGNAL_REASONS[number];

export type AddressSignalQrInput = {
  channel?: 'qr' | 'nfc' | 'barcode' | 'link';
  jti?: string;
  hasJti?: boolean;
  issuedAt?: string;
  ageSeconds?: number;
  expiresAt?: string;
  usedBefore?: boolean;
  reuseCount?: number;
  liveChallengeSigned?: boolean;
  agidSecure?: boolean;
};

export type AddressSignalInput = {
  now?: string;
  highRiskMode?: boolean;
  qr?: AddressSignalQrInput;
  nullifier?: {
    value?: string;
    reused?: boolean;
    reuseCount?: number;
  };
  addressQuality?: {
    decision?: 'verified' | 'partial' | 'needs_review' | 'blocked';
    score?: number;
  };
  delivery?: {
    declaredValueMinor?: number;
    highValueThresholdMinor?: number;
    currency?: string;
    highValueDelivery?: boolean;
  };
  carrier?: {
    scanSigned?: boolean;
    deviceTrusted?: boolean;
    deviceIdPresent?: boolean;
    terminalIdPresent?: boolean;
  };
  issuer?: {
    status?: 'active' | 'suspended' | 'revoked' | 'unknown';
    freshnessAgeSeconds?: number;
    maxFreshnessAgeSeconds?: number;
  };
  recipient?: {
    proofPresent?: boolean;
    liveChallengeSigned?: boolean;
  };
  offline?: {
    localLedgerEnabled?: boolean;
    pendingSyncCount?: number;
    conflictCount?: number;
  };
  thresholds?: Partial<AddressRadarThresholds>;
};

export type AddressSignalOperatorDecision = {
  label: 'Proceed' | 'Challenge recipient' | 'Manual review' | 'Reject';
  tone: 'ok' | 'challenge' | 'review' | 'reject';
  primaryAction: AddressRadarNextAction;
  message: string;
};

export type AddressSignalEvaluation = {
  modelVersion: typeof ADDRESS_SIGNAL_MODEL_VERSION;
  radarModelVersion: typeof ADDRESS_RADAR_MODEL_VERSION;
  outcome: AddressSignalOutcome;
  riskLevel: AddressRadarRiskLevel;
  score: number;
  reasons: AddressSignalReason[];
  matchedRuleIds: string[];
  nextActions: AddressRadarNextAction[];
  operatorDecision: AddressSignalOperatorDecision;
  evidence: {
    qrFresh: boolean;
    jtiPresent: boolean;
    nullifierFresh: boolean;
    addressQuality: 'verified' | 'partial' | 'needs_review' | 'blocked' | 'unknown';
    highValueDelivery: boolean;
    carrierTrusted: boolean;
    issuerActive: boolean;
    registryFresh: boolean;
  };
  privacy: {
    rawAddressStored: false;
    rawAgidStored: false;
    rawAoidStored: false;
    rawQrPayloadStored: false;
    storesSignalMetadataOnly: true;
    domainSeparationRequired: true;
  };
  radar: AddressRadarEvaluation;
};

const DEFAULT_HIGH_VALUE_DELIVERY_MINOR = 50000;

const RULE_REASON_MAP: Record<string, AddressSignalReason[]> = {
  'qr-expired': ['qr-expired'],
  'qr-missing-jti': ['qr-missing-jti'],
  'qr-used-before': ['qr-used-before'],
  'qr-reuse-detected': ['qr-reused'],
  'high-risk-qr-age-exceeded': ['qr-expired'],
  'aoid-nullifier-reuse': ['nullifier-reused'],
  'quality-low': ['address-quality-low'],
  'quality-partial-high-value-delivery': ['address-quality-partial', 'high-value-delivery'],
  'quality-partial': ['address-quality-partial'],
  'handoff-untrusted-carrier-device': ['carrier-device-untrusted'],
  'handoff-unsigned-carrier': ['carrier-scan-unsigned'],
  'handoff-missing-recipient-proof': ['recipient-proof-missing'],
  'registry-revoked': ['issuer-revoked'],
  'registry-stale': ['registry-stale'],
  'offline-conflict': ['offline-conflict'],
};

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function numberOrZero(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function parseTime(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function nowMs(input: AddressSignalInput) {
  return parseTime(input.now) ?? Date.now();
}

function qrAgeSeconds(input: AddressSignalInput) {
  const explicitAge = numberOrZero(input.qr?.ageSeconds);
  if (explicitAge > 0) return explicitAge;
  const issuedAt = parseTime(input.qr?.issuedAt);
  if (issuedAt === undefined) return undefined;
  return Math.max(0, Math.floor((nowMs(input) - issuedAt) / 1000));
}

function isExpired(expiresAt: unknown, now: number) {
  const expiry = parseTime(expiresAt);
  return expiry !== undefined && expiry <= now;
}

function hasDefined(values: unknown[]) {
  return values.some(value => value !== undefined);
}

function isHighValueDelivery(input: AddressSignalInput) {
  if (input.delivery?.highValueDelivery) return true;
  const declaredValue = numberOrZero(input.delivery?.declaredValueMinor);
  const threshold = numberOrZero(input.delivery?.highValueThresholdMinor) || DEFAULT_HIGH_VALUE_DELIVERY_MINOR;
  return declaredValue > 0 && declaredValue >= threshold;
}

function normalizeAddressQuality(input: AddressSignalInput): AddressSignalEvaluation['evidence']['addressQuality'] {
  const decision = input.addressQuality?.decision;
  if (decision === 'verified' || decision === 'partial' || decision === 'needs_review' || decision === 'blocked') {
    return decision;
  }
  const score = input.addressQuality?.score;
  if (typeof score !== 'number') return 'unknown';
  if (score < 0.35) return 'blocked';
  if (score < 0.65) return 'partial';
  return 'verified';
}

function toRadarInput(input: AddressSignalInput): AddressRadarInput {
  const qrAge = qrAgeSeconds(input);
  const includeHandoff = hasDefined([
    input.carrier?.scanSigned,
    input.carrier?.deviceTrusted,
    input.carrier?.deviceIdPresent,
    input.carrier?.terminalIdPresent,
    input.recipient?.proofPresent,
  ]);

  return {
    highRiskMode: input.highRiskMode,
    qr: input.qr
      ? {
          channel: input.qr.channel,
          hasJti: input.qr.hasJti ?? Boolean(input.qr.jti),
          issuedAt: input.qr.issuedAt,
          ageSeconds: qrAge,
          expiresAt: input.qr.expiresAt,
          usedBefore: input.qr.usedBefore,
          reuseCount: input.qr.reuseCount,
          liveChallengeSigned: input.qr.liveChallengeSigned ?? input.recipient?.liveChallengeSigned,
          agidSecure: input.qr.agidSecure,
        }
      : undefined,
    aoid: input.nullifier
      ? {
          nullifierReused: input.nullifier.reused,
          nullifierReuseCount: input.nullifier.reuseCount,
        }
      : undefined,
    handoff: includeHandoff
      ? {
          carrierScanSigned: input.carrier?.scanSigned,
          carrierDeviceTrusted: input.carrier?.deviceTrusted,
          recipientProofPresent: input.recipient?.proofPresent,
          deviceIdPresent: input.carrier?.deviceIdPresent,
          terminalIdPresent: input.carrier?.terminalIdPresent,
        }
      : undefined,
    delivery: input.delivery
      ? {
          highValueDelivery: input.delivery.highValueDelivery,
          declaredValueMinor: input.delivery.declaredValueMinor,
          highValueThresholdMinor: input.delivery.highValueThresholdMinor,
          currency: input.delivery.currency,
        }
      : undefined,
    registry: input.issuer
      ? {
          revoked: input.issuer.status === 'revoked' || input.issuer.status === 'suspended',
          stale: input.issuer.status === 'unknown',
          freshnessAgeSeconds: input.issuer.freshnessAgeSeconds,
          maxFreshnessAgeSeconds: input.issuer.maxFreshnessAgeSeconds,
        }
      : undefined,
    addressQuality: input.addressQuality,
    offline: input.offline,
    thresholds: input.thresholds,
  };
}

function deriveReasons(input: AddressSignalInput, radar: AddressRadarEvaluation) {
  const reasons = radar.matchedRules.flatMap(rule => RULE_REASON_MAP[rule.id] ?? []);
  if (isHighValueDelivery(input)) reasons.push('high-value-delivery');
  if (input.nullifier?.reused || numberOrZero(input.nullifier?.reuseCount) > 0) reasons.push('nullifier-reused');
  return unique(reasons);
}

function deriveOutcome(radar: AddressRadarEvaluation): AddressSignalOutcome {
  if (radar.decision === 'block') return 'reject';
  if (
    radar.nextActions.includes('require_recipient_passkey') ||
    radar.nextActions.includes('require_live_challenge') ||
    radar.nextActions.includes('request_recipient_proof') ||
    radar.nextActions.includes('require_signed_handoff')
  ) {
    return 'challenge';
  }
  if (radar.decision === 'review') return 'review';
  return 'proceed';
}

function operatorDecisionFor(outcome: AddressSignalOutcome, nextActions: AddressRadarNextAction[]): AddressSignalOperatorDecision {
  const primaryAction = nextActions[0] ?? 'allow';
  if (outcome === 'reject') {
    return {
      label: 'Reject',
      tone: 'reject',
      primaryAction,
      message: 'Do not hand off this shipment until the failed signal is resolved.',
    };
  }
  if (outcome === 'challenge') {
    return {
      label: 'Challenge recipient',
      tone: 'challenge',
      primaryAction,
      message: 'Ask for the required live proof, passkey, or signed carrier receipt before handoff.',
    };
  }
  if (outcome === 'review') {
    return {
      label: 'Manual review',
      tone: 'review',
      primaryAction,
      message: 'Send this shipment to an operator review queue before handoff.',
    };
  }
  return {
    label: 'Proceed',
    tone: 'ok',
    primaryAction: 'allow',
    message: 'Pre-delivery signals are clear for this handoff context.',
  };
}

function evidenceFor(input: AddressSignalInput): AddressSignalEvaluation['evidence'] {
  const now = nowMs(input);
  const freshnessAge = numberOrZero(input.issuer?.freshnessAgeSeconds);
  const maxFreshness = numberOrZero(input.issuer?.maxFreshnessAgeSeconds) || 900;
  return {
    qrFresh: input.qr?.expiresAt ? !isExpired(input.qr.expiresAt, now) : true,
    jtiPresent: input.qr ? input.qr.hasJti === true || Boolean(input.qr.jti) : true,
    nullifierFresh: !(input.nullifier?.reused || numberOrZero(input.nullifier?.reuseCount) > 0),
    addressQuality: normalizeAddressQuality(input),
    highValueDelivery: isHighValueDelivery(input),
    carrierTrusted: input.carrier?.deviceTrusted !== false,
    issuerActive: input.issuer ? input.issuer.status === 'active' : true,
    registryFresh: !input.issuer || freshnessAge === 0 || freshnessAge <= maxFreshness,
  };
}

export function listAddressSignalChecks() {
  return {
    modelVersion: ADDRESS_SIGNAL_MODEL_VERSION,
    radarModelVersion: ADDRESS_RADAR_MODEL_VERSION,
    outcomes: [...ADDRESS_SIGNAL_OUTCOMES],
    reasons: [...ADDRESS_SIGNAL_REASONS],
    checks: [
      'qr_expiry',
      'jti_presence',
      'nullifier_reuse',
      'address_quality',
      'high_value_delivery',
      'carrier_device_trust',
      'issuer_status',
      'registry_freshness',
      'offline_conflict',
    ],
    privacy: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      rawQrPayloadStored: false,
      storesSignalMetadataOnly: true,
      domainSeparationRequired: true,
    },
  };
}

export function evaluateAddressSignal(input: AddressSignalInput = {}): AddressSignalEvaluation {
  const radar = evaluateAddressRadar(toRadarInput(input));
  const outcome = deriveOutcome(radar);
  const nextActions: AddressRadarNextAction[] = radar.nextActions.length > 0 ? radar.nextActions : ['allow'];

  return {
    modelVersion: ADDRESS_SIGNAL_MODEL_VERSION,
    radarModelVersion: ADDRESS_RADAR_MODEL_VERSION,
    outcome,
    riskLevel: radar.riskLevel,
    score: radar.score,
    reasons: deriveReasons(input, radar),
    matchedRuleIds: radar.matchedRules.map(rule => rule.id),
    nextActions,
    operatorDecision: operatorDecisionFor(outcome, nextActions),
    evidence: evidenceFor(input),
    privacy: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      rawQrPayloadStored: false,
      storesSignalMetadataOnly: true,
      domainSeparationRequired: true,
    },
    radar,
  };
}
