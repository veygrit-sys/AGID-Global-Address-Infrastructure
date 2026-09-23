import type { AddressElementQualityDecision } from './addressElement';
import type { AddressIntent } from './addressIntent';

export const ADDRESS_RADAR_MODEL_VERSION = 'agid-address-radar-v1';

export const ADDRESS_RADAR_DECISIONS = ['allow', 'review', 'block'] as const;
export const ADDRESS_RADAR_RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export const ADDRESS_RADAR_NEXT_ACTIONS = [
  'allow',
  'manual_review',
  'reject_token',
  'reject_revoked',
  'rotate_qr',
  'rotate_device_key',
  'require_live_challenge',
  'request_recipient_proof',
  'require_recipient_passkey',
  'require_second_factor',
  'require_signed_handoff',
  'throttle_lookup',
  'queue_reverification',
  'sync_offline_ledger',
  'suspend_carrier_device',
  'quarantine_feedback',
  'require_issuer_reverification',
  'require_dual_control_review',
  'block_domain',
] as const;

export type AddressRadarDecision = typeof ADDRESS_RADAR_DECISIONS[number];
export type AddressRadarRiskLevel = typeof ADDRESS_RADAR_RISK_LEVELS[number];
export type AddressRadarNextAction = typeof ADDRESS_RADAR_NEXT_ACTIONS[number];

export type AddressRadarQrInput = {
  channel?: 'qr' | 'nfc' | 'barcode' | 'link';
  hasJti?: boolean;
  issuedAt?: string;
  ageSeconds?: number;
  expiresAt?: string;
  usedBefore?: boolean;
  reuseCount?: number;
  liveChallengeSigned?: boolean;
  agidSecure?: boolean;
};

export type AddressRadarAoidInput = {
  commitmentPresent?: boolean;
  registrationCountInRegion?: number;
  nullifierReused?: boolean;
  nullifierReuseCount?: number;
  distinctRecipientProofCount?: number;
};

export type AddressRadarLookupInput = {
  attemptsInWindow?: number;
  distinctAgidCount?: number;
  reverseLookupCount?: number;
  failedProofCount?: number;
};

export type AddressRadarHandoffInput = {
  carrierScanSigned?: boolean;
  carrierDeviceTrusted?: boolean;
  recipientProofPresent?: boolean;
  deviceIdPresent?: boolean;
  terminalIdPresent?: boolean;
  timeSkewSeconds?: number;
  coarseLocationPresent?: boolean;
  afterCompletionRescan?: boolean;
};

export type AddressRadarDeliveryInput = {
  highValueDelivery?: boolean;
  declaredValueMinor?: number;
  highValueThresholdMinor?: number;
  currency?: string;
};

export type AddressRadarRegistryInput = {
  revoked?: boolean;
  stale?: boolean;
  freshnessAgeSeconds?: number;
  maxFreshnessAgeSeconds?: number;
  issuerUnknown?: boolean;
  issuerSuspended?: boolean;
  issuerTrustScore?: number;
  issuerKeyRecentlyRotated?: boolean;
  issuerRootMismatch?: boolean;
};

export type AddressRadarAddressQualityInput = {
  decision?: AddressElementQualityDecision | 'verified' | 'partial' | 'needs_review' | 'blocked';
  score?: number;
};

export type AddressRadarInput = {
  intent?: Pick<AddressIntent, 'status' | 'purpose' | 'mode' | 'nextAction'>;
  highRiskMode?: boolean;
  qr?: AddressRadarQrInput;
  aoid?: AddressRadarAoidInput;
  lookup?: AddressRadarLookupInput;
  handoff?: AddressRadarHandoffInput;
  delivery?: AddressRadarDeliveryInput;
  registry?: AddressRadarRegistryInput;
  addressQuality?: AddressRadarAddressQualityInput;
  device?: {
    terminalTrustScore?: number;
    carrierDeviceTrustScore?: number;
    deviceKeyAgeHours?: number;
    rootOrJailbreakDetected?: boolean;
    emulatorDetected?: boolean;
    clockTamperDetected?: boolean;
    attestationMissing?: boolean;
    repeatedDeviceFailures?: number;
  };
  route?: {
    coarseRegionMismatch?: boolean;
    countryMismatch?: boolean;
    scanDistanceKm?: number;
    elapsedSincePreviousScanMinutes?: number;
    impossibleTravel?: boolean;
  };
  domain?: {
    domainSeparated?: boolean;
    scopeMismatch?: boolean;
    crossPurposeReuseDetected?: boolean;
    consentScopeMissing?: boolean;
  };
  behavior?: {
    sameDeviceDistinctRecipients?: number;
    sameRecipientDistinctDevices?: number;
    sameAoidDistinctTerminals?: number;
    carrierFailureRatePercent?: number;
    rapidRefundOrReturnCount?: number;
  };
  feedback?: {
    correctionBurstCount?: number;
    conflictingCorrectionCount?: number;
    untrustedFeedbackSource?: boolean;
    modelPoisoningSuspected?: boolean;
  };
  customs?: {
    routeCountryMismatch?: boolean;
    hsCodeMismatch?: boolean;
    declaredValueOutlier?: boolean;
    restrictedGoodsFlag?: boolean;
  };
  offline?: {
    localLedgerEnabled?: boolean;
    pendingSyncCount?: number;
    conflictCount?: number;
  };
  thresholds?: Partial<AddressRadarThresholds>;
};

export type AddressRadarThresholds = {
  lookupAttemptsReview: number;
  lookupAttemptsBlock: number;
  distinctAgidsReview: number;
  reverseLookupsReview: number;
  failedProofsReview: number;
  maxTimeSkewSeconds: number;
  maxFreshnessAgeSeconds: number;
  aoidRegistrationsReview: number;
  highRiskQrMaxAgeSeconds: number;
  highValueDeliveryMinor: number;
  lowDeviceTrustScore: number;
  maxDeviceKeyAgeHours: number;
  issuerTrustReviewScore: number;
  sameDeviceRecipientsReview: number;
  sameRecipientDevicesReview: number;
  sameAoidTerminalsReview: number;
  carrierFailureRateReviewPercent: number;
  correctionBurstReview: number;
  conflictingCorrectionsReview: number;
  impossibleTravelKmh: number;
};

export type AddressRadarRuleDefinition = {
  id: string;
  label: string;
  category:
    | 'qr-copy'
    | 'abuse'
    | 'aoid'
    | 'handoff'
    | 'registry'
    | 'quality'
    | 'offline'
    | 'device'
    | 'route'
    | 'domain'
    | 'behavior'
    | 'feedback'
    | 'customs';
  defaultSeverity: AddressRadarRiskLevel;
  defaultPoints: number;
};

export type AddressRadarRuleMatch = AddressRadarRuleDefinition & {
  points: number;
  reason: string;
  nextAction: AddressRadarNextAction;
};

export type AddressRadarEvaluation = {
  modelVersion: typeof ADDRESS_RADAR_MODEL_VERSION;
  decision: AddressRadarDecision;
  riskLevel: AddressRadarRiskLevel;
  score: number;
  matchedRules: AddressRadarRuleMatch[];
  nextActions: AddressRadarNextAction[];
  warnings: string[];
  privacy: {
    rawAddressStored: false;
    rawAgidStored: false;
    rawAoidStored: false;
    rawDeviceFingerprintStored: false;
    rawIpAddressStored: false;
    storesCommitmentsOnly: true;
    domainSeparationRequired: true;
  };
};

const RULES: AddressRadarRuleDefinition[] = [
  { id: 'qr-missing-jti', label: 'QR/NFC token has no jti', category: 'qr-copy', defaultSeverity: 'high', defaultPoints: 35 },
  { id: 'qr-expired', label: 'QR/NFC token expired', category: 'qr-copy', defaultSeverity: 'critical', defaultPoints: 95 },
  { id: 'qr-used-before', label: 'QR/NFC token was already used', category: 'qr-copy', defaultSeverity: 'critical', defaultPoints: 90 },
  { id: 'qr-reuse-detected', label: 'QR/NFC token reuse pattern detected', category: 'qr-copy', defaultSeverity: 'high', defaultPoints: 60 },
  { id: 'high-risk-missing-live-challenge', label: 'High-risk flow lacks live recipient challenge', category: 'qr-copy', defaultSeverity: 'high', defaultPoints: 55 },
  { id: 'high-risk-qr-age-exceeded', label: 'High-risk QR/NFC token is too old', category: 'qr-copy', defaultSeverity: 'critical', defaultPoints: 90 },
  { id: 'address-enumeration-velocity', label: 'Address or AGID lookup velocity is suspicious', category: 'abuse', defaultSeverity: 'high', defaultPoints: 45 },
  { id: 'address-enumeration-block', label: 'Address or AGID lookup velocity exceeds block threshold', category: 'abuse', defaultSeverity: 'critical', defaultPoints: 85 },
  { id: 'failed-proof-velocity', label: 'Recipient proof failures are clustered', category: 'abuse', defaultSeverity: 'high', defaultPoints: 45 },
  { id: 'aoid-multi-registration', label: 'Same AOID commitment appears in multiple regional registrations', category: 'aoid', defaultSeverity: 'high', defaultPoints: 50 },
  { id: 'aoid-nullifier-reuse', label: 'AOID nullifier reuse detected', category: 'aoid', defaultSeverity: 'critical', defaultPoints: 82 },
  { id: 'handoff-unsigned-carrier', label: 'Carrier scan receipt is not signed', category: 'handoff', defaultSeverity: 'high', defaultPoints: 45 },
  { id: 'handoff-untrusted-carrier-device', label: 'Carrier device is not trusted', category: 'handoff', defaultSeverity: 'high', defaultPoints: 50 },
  { id: 'handoff-missing-recipient-proof', label: 'Recipient proof is missing', category: 'handoff', defaultSeverity: 'high', defaultPoints: 40 },
  { id: 'handoff-missing-terminal-or-device', label: 'POS terminal or carrier device identity is missing', category: 'handoff', defaultSeverity: 'medium', defaultPoints: 25 },
  { id: 'handoff-time-skew', label: 'Handoff receipt time skew is suspicious', category: 'handoff', defaultSeverity: 'medium', defaultPoints: 25 },
  { id: 'handoff-rescan-after-complete', label: 'Completed handoff was scanned again', category: 'handoff', defaultSeverity: 'high', defaultPoints: 45 },
  { id: 'registry-revoked', label: 'Registry status is revoked', category: 'registry', defaultSeverity: 'critical', defaultPoints: 100 },
  { id: 'registry-stale', label: 'Registry freshness is stale', category: 'registry', defaultSeverity: 'medium', defaultPoints: 25 },
  { id: 'issuer-unknown-or-suspended', label: 'Issuer is unknown or suspended', category: 'registry', defaultSeverity: 'critical', defaultPoints: 88 },
  { id: 'issuer-low-trust', label: 'Issuer trust score is low', category: 'registry', defaultSeverity: 'high', defaultPoints: 45 },
  { id: 'issuer-root-mismatch', label: 'Issuer trust root mismatch', category: 'registry', defaultSeverity: 'critical', defaultPoints: 95 },
  { id: 'quality-low', label: 'Address quality is low or blocked', category: 'quality', defaultSeverity: 'high', defaultPoints: 45 },
  { id: 'quality-partial-high-value-delivery', label: 'Partial address quality on high-value delivery', category: 'quality', defaultSeverity: 'high', defaultPoints: 45 },
  { id: 'quality-partial', label: 'Address quality is partial', category: 'quality', defaultSeverity: 'medium', defaultPoints: 20 },
  { id: 'offline-conflict', label: 'Offline ledger conflict requires audit', category: 'offline', defaultSeverity: 'high', defaultPoints: 60 },
  { id: 'offline-sync-backlog', label: 'Offline sync backlog is growing', category: 'offline', defaultSeverity: 'medium', defaultPoints: 20 },
  { id: 'device-attestation-missing', label: 'Device attestation is missing', category: 'device', defaultSeverity: 'medium', defaultPoints: 25 },
  { id: 'device-compromised-runtime', label: 'Device runtime appears compromised', category: 'device', defaultSeverity: 'critical', defaultPoints: 92 },
  { id: 'device-low-trust', label: 'Device trust score is low', category: 'device', defaultSeverity: 'high', defaultPoints: 50 },
  { id: 'device-key-stale', label: 'Device key is stale', category: 'device', defaultSeverity: 'medium', defaultPoints: 28 },
  { id: 'device-repeated-failures', label: 'Device has repeated verification failures', category: 'device', defaultSeverity: 'high', defaultPoints: 45 },
  { id: 'route-region-mismatch', label: 'Route or coarse region does not match expected address context', category: 'route', defaultSeverity: 'high', defaultPoints: 50 },
  { id: 'route-impossible-travel', label: 'Scan timing implies impossible travel', category: 'route', defaultSeverity: 'critical', defaultPoints: 90 },
  { id: 'domain-separation-missing', label: 'Domain separation is missing', category: 'domain', defaultSeverity: 'high', defaultPoints: 55 },
  { id: 'domain-scope-mismatch', label: 'Scope or consent does not match the requested operation', category: 'domain', defaultSeverity: 'critical', defaultPoints: 88 },
  { id: 'domain-cross-purpose-reuse', label: 'Credential, nullifier, or token reused across purposes', category: 'domain', defaultSeverity: 'critical', defaultPoints: 82 },
  { id: 'behavior-recipient-device-fanout', label: 'Recipient/device relationship fanout is anomalous', category: 'behavior', defaultSeverity: 'high', defaultPoints: 45 },
  { id: 'behavior-carrier-failure-rate', label: 'Carrier or terminal failure rate is high', category: 'behavior', defaultSeverity: 'medium', defaultPoints: 30 },
  { id: 'behavior-return-refund-burst', label: 'Rapid return or refund pattern detected', category: 'behavior', defaultSeverity: 'medium', defaultPoints: 30 },
  { id: 'feedback-poisoning-risk', label: 'Feedback pattern may poison address learning', category: 'feedback', defaultSeverity: 'high', defaultPoints: 55 },
  { id: 'feedback-conflict-burst', label: 'Address correction feedback is conflicting or bursty', category: 'feedback', defaultSeverity: 'medium', defaultPoints: 30 },
  { id: 'customs-route-mismatch', label: 'Customs or route data conflicts with address context', category: 'customs', defaultSeverity: 'high', defaultPoints: 50 },
  { id: 'customs-restricted-goods', label: 'Restricted goods require manual compliance review', category: 'customs', defaultSeverity: 'critical', defaultPoints: 85 },
];

const DEFAULT_THRESHOLDS: AddressRadarThresholds = {
  lookupAttemptsReview: 30,
  lookupAttemptsBlock: 120,
  distinctAgidsReview: 24,
  reverseLookupsReview: 30,
  failedProofsReview: 5,
  maxTimeSkewSeconds: 180,
  maxFreshnessAgeSeconds: 900,
  aoidRegistrationsReview: 2,
  highRiskQrMaxAgeSeconds: 600,
  highValueDeliveryMinor: 50000,
  lowDeviceTrustScore: 0.45,
  maxDeviceKeyAgeHours: 720,
  issuerTrustReviewScore: 0.6,
  sameDeviceRecipientsReview: 8,
  sameRecipientDevicesReview: 4,
  sameAoidTerminalsReview: 4,
  carrierFailureRateReviewPercent: 8,
  correctionBurstReview: 12,
  conflictingCorrectionsReview: 3,
  impossibleTravelKmh: 180,
};

function rule(id: string) {
  const definition = RULES.find(item => item.id === id);
  if (!definition) throw new Error(`Unknown Address Radar rule: ${id}`);
  return definition;
}

function matchRule(id: string, reason: string, nextAction: AddressRadarNextAction, points?: number): AddressRadarRuleMatch {
  const definition = rule(id);
  return {
    ...definition,
    points: points ?? definition.defaultPoints,
    reason,
    nextAction,
  };
}

function numberOrZero(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function scoreOrUndefined(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : undefined;
}

function isExpired(value: unknown, now = Date.now()) {
  if (typeof value !== 'string') return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp <= now;
}

function qrAgeSeconds(qr: AddressRadarQrInput | undefined, now = Date.now()) {
  const explicitAge = numberOrZero(qr?.ageSeconds);
  if (explicitAge > 0) return explicitAge;
  if (typeof qr?.issuedAt !== 'string') return 0;
  const timestamp = Date.parse(qr.issuedAt);
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.floor((now - timestamp) / 1000));
}

function isHighValueDelivery(input: AddressRadarInput, thresholds: AddressRadarThresholds) {
  if (input.delivery?.highValueDelivery) return true;
  const declaredValue = numberOrZero(input.delivery?.declaredValueMinor);
  const threshold = numberOrZero(input.delivery?.highValueThresholdMinor) || thresholds.highValueDeliveryMinor;
  return declaredValue > 0 && declaredValue >= threshold;
}

function riskLevelForScore(score: number): AddressRadarRiskLevel {
  if (score >= 80) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

function decisionFor(score: number): AddressRadarDecision {
  if (score >= 80) return 'block';
  if (score >= 35) return 'review';
  return 'allow';
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

export function listAddressRadarRules() {
  return {
    modelVersion: ADDRESS_RADAR_MODEL_VERSION,
    rules: RULES,
    decisions: [...ADDRESS_RADAR_DECISIONS],
    riskLevels: [...ADDRESS_RADAR_RISK_LEVELS],
    nextActions: [...ADDRESS_RADAR_NEXT_ACTIONS],
    privacy: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      rawDeviceFingerprintStored: false,
      rawIpAddressStored: false,
      storesCommitmentsOnly: true,
      domainSeparationRequired: true,
    },
  };
}

export function evaluateAddressRadar(input: AddressRadarInput = {}): AddressRadarEvaluation {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(input.thresholds || {}) };
  const matches: AddressRadarRuleMatch[] = [];
  const warnings: string[] = [];

  if (input.qr) {
    if (input.qr.channel && !input.qr.hasJti) {
      matches.push(matchRule('qr-missing-jti', 'Reusable QR/NFC payloads must carry a token id for revocation and used-state checks.', 'rotate_qr'));
    }
    if (isExpired(input.qr.expiresAt)) {
      matches.push(matchRule('qr-expired', 'The presented QR/NFC token is outside its validity window.', 'rotate_qr'));
    }
    if (input.qr.usedBefore) {
      matches.push(matchRule('qr-used-before', 'The presented token is already marked used in the local or registry ledger.', 'rotate_qr'));
    }
    if (numberOrZero(input.qr.reuseCount) > 0) {
      matches.push(matchRule('qr-reuse-detected', 'Token reuse count is greater than zero, which indicates copy or replay risk.', 'rotate_qr'));
    }
    if (input.highRiskMode && !input.qr.liveChallengeSigned) {
      matches.push(matchRule('high-risk-missing-live-challenge', 'High-risk delivery or aid flows require a fresh POS challenge signed by the recipient side.', 'require_live_challenge'));
    }
    const tokenAgeSeconds = qrAgeSeconds(input.qr);
    if (input.highRiskMode && tokenAgeSeconds > thresholds.highRiskQrMaxAgeSeconds) {
      matches.push(matchRule('high-risk-qr-age-exceeded', `High-risk QR/NFC age (${tokenAgeSeconds}s) exceeds the ${thresholds.highRiskQrMaxAgeSeconds}s limit.`, 'reject_token'));
    }
  }

  const attempts = numberOrZero(input.lookup?.attemptsInWindow);
  const distinctAgids = numberOrZero(input.lookup?.distinctAgidCount);
  const reverseLookups = numberOrZero(input.lookup?.reverseLookupCount);
  if (attempts >= thresholds.lookupAttemptsBlock) {
    matches.push(matchRule('address-enumeration-block', `Lookup attempts (${attempts}) exceed the block threshold.`, 'throttle_lookup'));
  } else if (
    attempts >= thresholds.lookupAttemptsReview ||
    distinctAgids >= thresholds.distinctAgidsReview ||
    reverseLookups >= thresholds.reverseLookupsReview
  ) {
    matches.push(matchRule('address-enumeration-velocity', 'Lookup volume suggests AGID reverse lookup or address enumeration.', 'throttle_lookup'));
  }
  if (numberOrZero(input.lookup?.failedProofCount) >= thresholds.failedProofsReview) {
    matches.push(matchRule('failed-proof-velocity', 'Repeated recipient proof failures suggest guessing, replay, or user mismatch.', 'manual_review'));
  }

  if (numberOrZero(input.aoid?.registrationCountInRegion) >= thresholds.aoidRegistrationsReview) {
    matches.push(matchRule('aoid-multi-registration', 'AOID commitment appears in more registrations than the regional policy allows.', 'manual_review'));
  }
  if (input.aoid?.nullifierReused || numberOrZero(input.aoid?.nullifierReuseCount) > 0) {
    matches.push(matchRule('aoid-nullifier-reuse', 'AOID nullifier reuse breaks one-use or one-registration expectations.', 'reject_revoked'));
  }

  if (input.handoff) {
    if (!input.handoff.carrierScanSigned) {
      matches.push(matchRule('handoff-unsigned-carrier', 'Carrier scan lacks a device or carrier signature.', 'require_signed_handoff'));
    }
    if (input.handoff.carrierDeviceTrusted === false) {
      matches.push(matchRule('handoff-untrusted-carrier-device', 'Carrier device is outside the trusted device registry for this handoff context.', 'require_recipient_passkey'));
    }
    if (!input.handoff.recipientProofPresent) {
      matches.push(matchRule('handoff-missing-recipient-proof', 'Handoff cannot prove recipient control.', 'request_recipient_proof'));
    }
    if (!input.handoff.deviceIdPresent || !input.handoff.terminalIdPresent) {
      matches.push(matchRule('handoff-missing-terminal-or-device', 'Terminal or carrier device identity is absent from the receipt.', 'require_signed_handoff'));
    }
    if (Math.abs(numberOrZero(input.handoff.timeSkewSeconds)) > thresholds.maxTimeSkewSeconds) {
      matches.push(matchRule('handoff-time-skew', 'Handoff timestamps differ beyond the configured tolerance.', 'manual_review'));
    }
    if (input.handoff.afterCompletionRescan) {
      matches.push(matchRule('handoff-rescan-after-complete', 'The waybill or token was scanned after completion.', 'manual_review'));
    }
  }

  if (input.registry?.revoked) {
    matches.push(matchRule('registry-revoked', 'Credential, AGID-S token, issuer, or waybill alias is revoked.', 'reject_revoked'));
  }
  const freshnessAge = numberOrZero(input.registry?.freshnessAgeSeconds);
  const maxFreshness = input.registry?.maxFreshnessAgeSeconds ?? thresholds.maxFreshnessAgeSeconds;
  if (input.registry?.stale || (freshnessAge > 0 && freshnessAge > maxFreshness)) {
    matches.push(matchRule('registry-stale', 'Registry freshness is outside the allowed age.', 'queue_reverification'));
  }
  if (input.registry?.issuerUnknown || input.registry?.issuerSuspended) {
    matches.push(matchRule('issuer-unknown-or-suspended', 'Issuer is unknown, suspended, or outside the active trust registry.', 'require_issuer_reverification'));
  }
  const issuerTrustScore = scoreOrUndefined(input.registry?.issuerTrustScore);
  if (issuerTrustScore !== undefined && issuerTrustScore < thresholds.issuerTrustReviewScore) {
    matches.push(matchRule('issuer-low-trust', `Issuer trust score (${issuerTrustScore}) is below policy.`, 'require_issuer_reverification'));
  }
  if (input.registry?.issuerRootMismatch) {
    matches.push(matchRule('issuer-root-mismatch', 'Issuer trust root does not match the verifier registry root.', 'reject_revoked'));
  }

  const qualityScore = typeof input.addressQuality?.score === 'number' ? input.addressQuality.score : undefined;
  const qualityDecision = input.addressQuality?.decision;
  const partialQuality = qualityDecision === 'partial' || (qualityScore !== undefined && qualityScore < 0.65);
  if (qualityDecision === 'blocked' || qualityDecision === 'needs_review' || (qualityScore !== undefined && qualityScore < 0.35)) {
    matches.push(matchRule('quality-low', 'Address quality requires manual review before acceptance.', 'queue_reverification'));
  } else if (partialQuality && isHighValueDelivery(input, thresholds)) {
    matches.push(matchRule('quality-partial-high-value-delivery', 'High-value delivery cannot rely on partial address quality alone.', 'manual_review'));
  } else if (partialQuality) {
    matches.push(matchRule('quality-partial', 'Address is usable only with partial evidence.', 'manual_review'));
  }

  if (numberOrZero(input.offline?.conflictCount) > 0) {
    matches.push(matchRule('offline-conflict', 'Deferred offline ledger sync found conflicting used-state or receipt records.', 'sync_offline_ledger'));
  }
  if (numberOrZero(input.offline?.pendingSyncCount) > 50) {
    matches.push(matchRule('offline-sync-backlog', 'Offline sync backlog is large enough to reduce used-state confidence.', 'sync_offline_ledger'));
  }

  if (input.device) {
    const terminalTrust = scoreOrUndefined(input.device.terminalTrustScore);
    const carrierTrust = scoreOrUndefined(input.device.carrierDeviceTrustScore);
    if (input.device.rootOrJailbreakDetected || input.device.emulatorDetected || input.device.clockTamperDetected) {
      matches.push(matchRule('device-compromised-runtime', 'Terminal or carrier runtime shows root, emulator, or clock tamper signals.', 'suspend_carrier_device'));
    }
    if (input.device.attestationMissing) {
      matches.push(matchRule('device-attestation-missing', 'Device attestation is missing for a risk-sensitive operation.', 'require_second_factor'));
    }
    if (
      (terminalTrust !== undefined && terminalTrust < thresholds.lowDeviceTrustScore) ||
      (carrierTrust !== undefined && carrierTrust < thresholds.lowDeviceTrustScore)
    ) {
      matches.push(matchRule('device-low-trust', 'Terminal or carrier device trust score is below policy.', 'require_recipient_passkey'));
    }
    if (numberOrZero(input.device.deviceKeyAgeHours) > thresholds.maxDeviceKeyAgeHours) {
      matches.push(matchRule('device-key-stale', 'Device signing key age exceeds rotation policy.', 'rotate_device_key'));
    }
    if (numberOrZero(input.device.repeatedDeviceFailures) >= 3) {
      matches.push(matchRule('device-repeated-failures', 'Device has repeated verification failures in the recent window.', 'suspend_carrier_device'));
    }
  }

  if (input.route) {
    if (input.route.coarseRegionMismatch || input.route.countryMismatch) {
      matches.push(matchRule('route-region-mismatch', 'Coarse scan region or country conflicts with expected route context.', 'manual_review'));
    }
    const distanceKm = numberOrZero(input.route.scanDistanceKm);
    const elapsedMinutes = numberOrZero(input.route.elapsedSincePreviousScanMinutes);
    const computedKmh = elapsedMinutes > 0 ? distanceKm / (elapsedMinutes / 60) : 0;
    if (input.route.impossibleTravel || computedKmh > thresholds.impossibleTravelKmh) {
      matches.push(matchRule('route-impossible-travel', 'Scan distance and elapsed time exceed plausible handoff movement.', 'require_dual_control_review'));
    }
  }

  if (input.domain) {
    if (input.domain.domainSeparated === false) {
      matches.push(matchRule('domain-separation-missing', 'Credential, nullifier, or token lacks explicit domain separation.', 'block_domain'));
    }
    if (input.domain.scopeMismatch || input.domain.consentScopeMissing) {
      matches.push(matchRule('domain-scope-mismatch', 'Requested operation is outside the declared consent or purpose scope.', 'block_domain'));
    }
    if (input.domain.crossPurposeReuseDetected) {
      matches.push(matchRule('domain-cross-purpose-reuse', 'The same proof artifact appears across delivery, return, pickup, or aid purposes.', 'block_domain'));
    }
  }

  if (input.behavior) {
    if (
      numberOrZero(input.behavior.sameDeviceDistinctRecipients) >= thresholds.sameDeviceRecipientsReview ||
      numberOrZero(input.behavior.sameRecipientDistinctDevices) >= thresholds.sameRecipientDevicesReview ||
      numberOrZero(input.behavior.sameAoidDistinctTerminals) >= thresholds.sameAoidTerminalsReview
    ) {
      matches.push(matchRule('behavior-recipient-device-fanout', 'Device, recipient, AOID, or terminal fanout is anomalous for the recent window.', 'manual_review'));
    }
    if (numberOrZero(input.behavior.carrierFailureRatePercent) >= thresholds.carrierFailureRateReviewPercent) {
      matches.push(matchRule('behavior-carrier-failure-rate', 'Carrier or terminal failure rate exceeds review threshold.', 'manual_review'));
    }
    if (numberOrZero(input.behavior.rapidRefundOrReturnCount) >= 3) {
      matches.push(matchRule('behavior-return-refund-burst', 'Rapid return or refund events cluster around this context.', 'manual_review'));
    }
  }

  if (input.feedback) {
    if (input.feedback.modelPoisoningSuspected || input.feedback.untrustedFeedbackSource) {
      matches.push(matchRule('feedback-poisoning-risk', 'Feedback source or correction pattern is unsafe for automatic learning.', 'quarantine_feedback'));
    }
    if (
      numberOrZero(input.feedback.correctionBurstCount) >= thresholds.correctionBurstReview ||
      numberOrZero(input.feedback.conflictingCorrectionCount) >= thresholds.conflictingCorrectionsReview
    ) {
      matches.push(matchRule('feedback-conflict-burst', 'Correction feedback is too bursty or contradictory for automatic acceptance.', 'quarantine_feedback'));
    }
  }

  if (input.customs) {
    if (input.customs.routeCountryMismatch || input.customs.hsCodeMismatch || input.customs.declaredValueOutlier) {
      matches.push(matchRule('customs-route-mismatch', 'Customs, HS code, declared value, or route country evidence conflicts with address context.', 'manual_review'));
    }
    if (input.customs.restrictedGoodsFlag) {
      matches.push(matchRule('customs-restricted-goods', 'Restricted goods flag requires compliance review before handoff.', 'require_dual_control_review'));
    }
  }

  if (input.intent?.status === 'rejected' || input.intent?.status === 'expired') {
    warnings.push('address-intent-status-is-not-actionable');
  }
  if (input.highRiskMode) {
    warnings.push('high-risk-mode-minimizes-precision-and-requires-short-lived-tokens');
  }

  const score = Math.min(100, matches.reduce((total, item) => total + item.points, 0));
  const decision = decisionFor(score);
  const nextActions = unique(matches.map(match => match.nextAction));
  if (nextActions.length === 0) nextActions.push('allow');

  return {
    modelVersion: ADDRESS_RADAR_MODEL_VERSION,
    decision,
    riskLevel: riskLevelForScore(score),
    score,
    matchedRules: matches,
    nextActions,
    warnings: unique(warnings),
    privacy: {
      rawAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      rawDeviceFingerprintStored: false,
      rawIpAddressStored: false,
      storesCommitmentsOnly: true,
      domainSeparationRequired: true,
    },
  };
}
