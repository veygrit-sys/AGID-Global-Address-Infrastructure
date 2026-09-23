import type {
  PosAcceptanceReceipt,
  PosAcceptanceStatus,
} from './posAcceptance';
import {
  buildShippingLabelProofStages,
  resolveShippingLabelProofLevel,
  type ShippingLabelProofLevel,
  type ShippingLabelProofStage,
  type ShippingLabelSafetyPolicy,
} from './shippingLabelQr';

export type PosStaffRole =
  | 'cashier'
  | 'pickup-operator'
  | 'delivery-supervisor'
  | 'field-admin';

export type PosStaffPermission =
  | 'scan-pos-payload'
  | 'decrypt-agid-s'
  | 'accept-handoff'
  | 'reject-release'
  | 'override-review'
  | 'view-exception-audit'
  | 'run-device-diagnostics'
  | 'print-redacted-receipt'
  | 'open-cash-drawer'
  | 'pair-barcode-reader'
  | 'pair-measuring-instrument'
  | 'export-reverification-report';

export type PosStaffProfile = {
  role: PosStaffRole;
  label: string;
  scope: string;
  permissions: PosStaffPermission[];
};

export type PosHardwareCapabilitySnapshot = {
  checkedAt?: string;
  webHid?: boolean;
  webSerial?: boolean;
  webUsb?: boolean;
  nativeConnector?: boolean;
  keyboardWedge?: boolean;
  cashDrawerRelay?: boolean;
  measurementSerial?: boolean;
  measurementHid?: boolean;
  measurementUsb?: boolean;
  measurementProfile?: boolean;
};

export type PosDeviceKind =
  | 'receipt-printer'
  | 'cash-drawer'
  | 'barcode-reader'
  | 'measurement-instrument';

export type PosDeviceStatus = 'ready' | 'warning' | 'offline';

export type PosDeviceDiagnostic = {
  kind: PosDeviceKind;
  label: string;
  status: PosDeviceStatus;
  checkedAt: string;
  requiredPermission: PosStaffPermission;
  evidence: string[];
  operatorAction: string;
};

export type PosExceptionAuditCase = {
  caseId: string;
  receiptId: string;
  status: Extract<PosAcceptanceStatus, 'review' | 'rejected'>;
  severity: 'review' | 'block';
  createdAt: string;
  channel: PosAcceptanceReceipt['channel'];
  recordLabel: string;
  reason: string;
  operatorAction: string;
};

export type PosHandoffReverificationCheck = {
  label: string;
  state: 'pass' | 'attention' | 'fail';
  detail: string;
};

export type PosHandoffReverificationReceiptEvidence = {
  receiptId: string;
  status: PosAcceptanceStatus;
  terminalId: string;
  createdAt: string;
  scanId?: string;
  scanRole?: NonNullable<PosAcceptanceReceipt['shippingLabel']>['scanRole'];
  storePosId?: string;
  terminalSignedAt?: string;
  terminalSignatureTail?: string;
  carrierTerminalId?: string;
  carrierTerminalSignedAt?: string;
  carrierTerminalSignatureTail?: string;
  riskLevel?: NonNullable<PosAcceptanceReceipt['shippingLabel']>['riskLevel'];
  safetyMode?: ShippingLabelSafetyPolicy['mode'];
  agidSharing?: ShippingLabelSafetyPolicy['agidSharing'];
  revokeOnReceipt?: boolean;
  immediateRevocationRequired?: boolean;
  retainAddressHistory?: boolean;
  proofMethod?: NonNullable<PosAcceptanceReceipt['shippingLabel']>['proofMethod'];
  recipientChallengeVerified?: boolean;
  recipientChallengeHashTail?: string;
  recipientChallengeSignatureTail?: string;
  addressAccuracyStatus?: NonNullable<PosAcceptanceReceipt['shippingLabel']>['addressAccuracyStatus'];
};

export type PosHandoffReverificationRegistryEvidence = {
  state: PosHandoffReverificationCheck['state'];
  registryFresh: boolean;
  replayDetected: boolean;
  generatedAt: string;
  detail: string;
};

export type PosHandoffReverificationSignatureEvidence = {
  complete: boolean;
  carrier?: PosHandoffReverificationReceiptEvidence;
  recipient?: PosHandoffReverificationReceiptEvidence;
};

export type PosHandoffReverificationDecisionReason = {
  label: string;
  state: PosHandoffReverificationCheck['state'];
  reason: string;
};

export type PosHandoffReverificationHighRiskEvidence = {
  active: boolean;
  state: PosHandoffReverificationCheck['state'];
  mode: ShippingLabelSafetyPolicy['mode'];
  controls: string[];
  detail: string;
};

export type PosHandoffReverificationEvidencePackage = {
  waybillId?: string;
  carrierScanReceipt?: PosHandoffReverificationReceiptEvidence;
  recipientProofReceipt?: PosHandoffReverificationReceiptEvidence;
  revocationFreshness: PosHandoffReverificationRegistryEvidence;
  posTerminalSignatures: PosHandoffReverificationSignatureEvidence;
  highRiskSafety: PosHandoffReverificationHighRiskEvidence;
  decisionReasons: PosHandoffReverificationDecisionReason[];
};

export type PosAdvancedAuditRisk = 'low' | 'medium' | 'high' | 'critical';

export type PosAdvancedAuditMetric = {
  label: string;
  value: string;
  state: PosHandoffReverificationCheck['state'];
  detail: string;
};

export type PosAdvancedAuditTimelineEvent = {
  label: string;
  at: string;
  state: PosHandoffReverificationCheck['state'];
  detail: string;
};

export type PosAdvancedAuditReport = {
  score: number;
  risk: PosAdvancedAuditRisk;
  coverage: {
    present: number;
    total: number;
    missing: string[];
  };
  metrics: PosAdvancedAuditMetric[];
  timeline: PosAdvancedAuditTimelineEvent[];
  nextActions: string[];
  privacyPosture: {
    state: PosHandoffReverificationCheck['state'];
    detail: string;
    controls: string[];
  };
  integrityChecks: PosHandoffReverificationDecisionReason[];
};

export type PosHandoffReverificationReport = {
  reportId: string;
  status: 'cleared' | 'attention' | 'blocked';
  proofLevel: ShippingLabelProofLevel;
  proofStages: ShippingLabelProofStage[];
  generatedAt: string;
  receiptId?: string;
  checks: PosHandoffReverificationCheck[];
  evidenceSummary: PosHandoffReverificationEvidencePackage;
  advancedAudit: PosAdvancedAuditReport;
  summary: string;
};

export type PosManagementRiskSeverity = 'info' | 'warning' | 'critical';

export type PosManagementWorkspace =
  | 'decision'
  | 'staff'
  | 'devices'
  | 'audit'
  | 'report'
  | 'registry'
  | 'keys'
  | 'queue'
  | 'settings';

export type PosManagementMetric = {
  label: string;
  value: string;
  detail: string;
  tone: 'ok' | 'warning' | 'danger' | 'normal';
};

export type PosManagementRisk = {
  id: string;
  severity: PosManagementRiskSeverity;
  label: string;
  detail: string;
  action: string;
  workspace: PosManagementWorkspace;
};

export type PosManagementSnapshot = {
  snapshotId: string;
  generatedAt: string;
  terminalId: string;
  grade: 'ready' | 'attention' | 'blocked';
  summary: string;
  metrics: PosManagementMetric[];
  risks: PosManagementRisk[];
};

const STAFF_PROFILES: Record<PosStaffRole, PosStaffProfile> = {
  cashier: {
    role: 'cashier',
    label: 'Cashier',
    scope: 'Front counter scan, redacted receipt printing, and normal item release.',
    permissions: [
      'scan-pos-payload',
      'accept-handoff',
      'reject-release',
      'print-redacted-receipt',
      'open-cash-drawer',
    ],
  },
  'pickup-operator': {
    role: 'pickup-operator',
    label: 'Pickup operator',
    scope: 'QR/NFC intake, AGID-S open flow, and delivery handoff without overrides.',
    permissions: [
      'scan-pos-payload',
      'decrypt-agid-s',
      'accept-handoff',
      'reject-release',
      'print-redacted-receipt',
      'run-device-diagnostics',
      'pair-barcode-reader',
      'pair-measuring-instrument',
    ],
  },
  'delivery-supervisor': {
    role: 'delivery-supervisor',
    label: 'Delivery supervisor',
    scope: 'Review exceptions, approve supervised handoff, export reconciliation reports.',
    permissions: [
      'scan-pos-payload',
      'decrypt-agid-s',
      'accept-handoff',
      'reject-release',
      'override-review',
      'view-exception-audit',
      'run-device-diagnostics',
      'print-redacted-receipt',
      'open-cash-drawer',
      'pair-barcode-reader',
      'pair-measuring-instrument',
      'export-reverification-report',
    ],
  },
  'field-admin': {
    role: 'field-admin',
    label: 'Field admin',
    scope: 'Humanitarian or mobile site administrator with full terminal operations.',
    permissions: [
      'scan-pos-payload',
      'decrypt-agid-s',
      'accept-handoff',
      'reject-release',
      'override-review',
      'view-exception-audit',
      'run-device-diagnostics',
      'print-redacted-receipt',
      'open-cash-drawer',
      'pair-barcode-reader',
      'pair-measuring-instrument',
      'export-reverification-report',
    ],
  },
};

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function firstIssue(receipt: PosAcceptanceReceipt) {
  return receipt.errors[0]
    ?? receipt.warnings[0]
    ?? (receipt.status === 'review' ? 'manual-review-required' : 'rejected-by-pos-policy');
}

function stableShortId(seed: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(6, '0').slice(-6);
}

function safeTail(value: unknown, size = 12) {
  const cleaned = cleanText(value);
  if (!cleaned) return undefined;
  return cleaned.length <= size ? cleaned : cleaned.slice(-size);
}

function hasWaybillTerminalSignature(receipt: PosAcceptanceReceipt) {
  return Boolean(
    receipt.shippingLabel?.terminalEvidenceSignature
    && receipt.shippingLabel.terminalSignedAt,
  );
}

function chooseWaybillReceipt(
  receipts: PosAcceptanceReceipt[],
  predicate: (receipt: PosAcceptanceReceipt) => boolean,
) {
  return receipts.find((item) => predicate(item) && hasWaybillTerminalSignature(item))
    ?? receipts.find(predicate);
}

function summarizeWaybillReceiptEvidence(
  receipt: PosAcceptanceReceipt | undefined,
): PosHandoffReverificationReceiptEvidence | undefined {
  const shippingLabel = receipt?.shippingLabel;
  if (!receipt || !shippingLabel) return undefined;
  const terminalSignatureTail = safeTail(shippingLabel.terminalEvidenceSignature);
  const carrierTerminalSignatureTail = safeTail(shippingLabel.carrierTerminalSignature);
  const recipientChallengeHashTail = safeTail(shippingLabel.recipientChallengeHash);
  const recipientChallengeSignatureTail = safeTail(shippingLabel.recipientChallengeSignatureTail, 10);

  return {
    receiptId: receipt.receiptId,
    status: receipt.status,
    terminalId: receipt.terminalId,
    createdAt: receipt.createdAt,
    scanId: shippingLabel.scanId,
    scanRole: shippingLabel.scanRole,
    storePosId: shippingLabel.storePosId,
    terminalSignedAt: shippingLabel.terminalSignedAt,
    ...(terminalSignatureTail ? { terminalSignatureTail } : {}),
    ...(shippingLabel.carrierTerminalId ? { carrierTerminalId: shippingLabel.carrierTerminalId } : {}),
    ...(shippingLabel.carrierTerminalSignedAt ? { carrierTerminalSignedAt: shippingLabel.carrierTerminalSignedAt } : {}),
    ...(carrierTerminalSignatureTail ? { carrierTerminalSignatureTail } : {}),
    riskLevel: shippingLabel.riskLevel,
    safetyMode: shippingLabel.safetyPolicy.mode,
    agidSharing: shippingLabel.safetyPolicy.agidSharing,
    revokeOnReceipt: shippingLabel.safetyPolicy.revokeOnReceipt,
    immediateRevocationRequired: shippingLabel.safetyPolicy.immediateRevocationRequired,
    retainAddressHistory: shippingLabel.safetyPolicy.retainAddressHistory,
    proofMethod: shippingLabel.proofMethod,
    recipientChallengeVerified: shippingLabel.recipientChallengeVerified,
    ...(recipientChallengeHashTail ? { recipientChallengeHashTail } : {}),
    ...(recipientChallengeSignatureTail ? { recipientChallengeSignatureTail } : {}),
    addressAccuracyStatus: shippingLabel.addressAccuracyStatus,
  };
}

function buildRegistryEvidenceSummary(input: {
  registryFresh: boolean;
  replayedNullifier?: string;
  generatedAt: string;
}): PosHandoffReverificationRegistryEvidence {
  if (input.replayedNullifier) {
    return {
      state: 'fail',
      registryFresh: input.registryFresh,
      replayDetected: true,
      generatedAt: input.generatedAt,
      detail: `Used/nullifier replay detected: ${input.replayedNullifier.slice(0, 12)}...`,
    };
  }
  if (!input.registryFresh) {
    return {
      state: 'attention',
      registryFresh: false,
      replayDetected: false,
      generatedAt: input.generatedAt,
      detail: 'Freshness or revocation registry is stale; keep the receipt in deferred reconciliation.',
    };
  }
  return {
    state: 'pass',
    registryFresh: true,
    replayDetected: false,
    generatedAt: input.generatedAt,
    detail: 'Freshness window is valid and no local used/nullifier replay was found.',
  };
}

function buildHighRiskSafetyEvidence(
  receipts: PosAcceptanceReceipt[],
): PosHandoffReverificationHighRiskEvidence {
  const highRiskLabels = receipts
    .map(receipt => receipt.shippingLabel)
    .filter((label): label is NonNullable<PosAcceptanceReceipt['shippingLabel']> => (
      Boolean(label && (label.riskLevel === 'high' || label.safetyPolicy.mode === 'high-risk'))
    ));

  if (highRiskLabels.length === 0) {
    return {
      active: false,
      state: 'pass',
      mode: 'standard',
      controls: ['Standard redacted receipt policy'],
      detail: 'No high-risk waybill receipt is selected.',
    };
  }

  const missing = new Set<string>();
  for (const label of highRiskLabels) {
    if (label.safetyPolicy.mode !== 'high-risk') missing.add('high-risk safety policy');
    if (label.safetyPolicy.agidSharing !== 'agid-s-only') missing.add('AGID-S-only sharing');
    if (label.safetyPolicy.maxTtlSeconds > 5 * 60) missing.add('short expiry');
    if (!label.safetyPolicy.revokeOnReceipt || !label.safetyPolicy.immediateRevocationRequired) missing.add('immediate used/revocation');
    if (label.safetyPolicy.retainAddressHistory || label.safetyPolicy.addressHistoryPolicy !== 'not-retained') missing.add('no address history');
    if (label.carrierLocation?.precision && label.carrierLocation.precision !== 'coarse-high-risk') missing.add('widened carrier location');
  }

  const controls = [
    'No precise AGID stored in QR or receipt',
    'AGID-S-only sharing policy asserted',
    'Short expiry enforced',
    'Recipient handoff requires immediate used/nullifier revocation',
    'Address history retention disabled',
    'Carrier location is widened when captured',
  ];
  const missingList = Array.from(missing);
  return {
    active: true,
    state: missingList.length > 0 ? 'fail' : 'pass',
    mode: 'high-risk',
    controls,
    detail: missingList.length > 0
      ? `High-risk safety controls missing: ${missingList.join(', ')}.`
      : 'High-risk safety mode is active and required controls are present for local receipt evidence.',
  };
}

function auditStateScore(state: PosHandoffReverificationCheck['state']) {
  if (state === 'pass') return 100;
  if (state === 'attention') return 55;
  return 0;
}

function auditRiskFromCheckCounts(failing: number, attention: number): PosAdvancedAuditRisk {
  if (failing > 0) return 'critical';
  if (attention >= 3) return 'high';
  if (attention > 0) return 'medium';
  return 'low';
}

function auditMetricState(
  failing: number,
  attention: number,
): PosHandoffReverificationCheck['state'] {
  if (failing > 0) return 'fail';
  if (attention > 0) return 'attention';
  return 'pass';
}

function sortedAuditTimeline(events: PosAdvancedAuditTimelineEvent[]) {
  return [...events].sort((left, right) => {
    const leftTime = Date.parse(left.at);
    const rightTime = Date.parse(right.at);
    const safeLeft = Number.isFinite(leftTime) ? leftTime : Number.MAX_SAFE_INTEGER;
    const safeRight = Number.isFinite(rightTime) ? rightTime : Number.MAX_SAFE_INTEGER;
    return safeLeft - safeRight;
  });
}

function buildAdvancedAuditReport(input: {
  checks: PosHandoffReverificationCheck[];
  evidence: PosHandoffReverificationEvidencePackage;
  proofLevel: ShippingLabelProofLevel;
  receipt?: PosAcceptanceReceipt | null;
  carrierReceipt?: PosAcceptanceReceipt;
  recipientReceipt?: PosAcceptanceReceipt;
  generatedAt: string;
}): PosAdvancedAuditReport {
  const failing = input.checks.filter((check) => check.state === 'fail').length;
  const attention = input.checks.filter((check) => check.state === 'attention').length;
  const passed = input.checks.filter((check) => check.state === 'pass').length;
  const score = Math.round(
    input.checks.reduce((total, check) => total + auditStateScore(check.state), 0)
    / Math.max(1, input.checks.length),
  );
  const missing = input.checks
    .filter((check) => check.state !== 'pass')
    .map((check) => check.label);
  const receiptState = auditMetricState(
    input.checks.filter((check) => check.label === 'Receipt decision' && check.state === 'fail').length,
    input.checks.filter((check) => check.label === 'Receipt decision' && check.state === 'attention').length,
  );
  const registryState = input.evidence.revocationFreshness.state;
  const privacySignals = [
    input.checks.find((check) => check.label === 'Redaction posture'),
    input.checks.find((check) => check.label === 'High-risk safety mode'),
  ].filter((item): item is PosHandoffReverificationCheck => Boolean(item));
  const privacyState = privacySignals.some((check) => check.state === 'fail')
    ? 'fail'
    : privacySignals.some((check) => check.state === 'attention')
      ? 'attention'
      : 'pass';
  const terminalSignatureState: PosHandoffReverificationCheck['state'] = input.evidence.waybillId
    ? input.evidence.posTerminalSignatures.complete
      ? 'pass'
      : 'attention'
    : 'pass';
  const timeline = sortedAuditTimeline([
    ...(input.receipt ? [{
      label: 'Selected receipt',
      at: input.receipt.createdAt,
      state: receiptState,
      detail: `${input.receipt.receiptId} / ${input.receipt.status}`,
    }] : []),
    ...(input.carrierReceipt ? [{
      label: 'Carrier scan receipt',
      at: input.carrierReceipt.createdAt,
      state: input.evidence.carrierScanReceipt?.terminalSignatureTail ? 'pass' as const : 'attention' as const,
      detail: `${input.carrierReceipt.receiptId} / ${input.evidence.carrierScanReceipt?.scanId ?? 'scan not captured'}`,
    }] : []),
    ...(input.recipientReceipt ? [{
      label: 'Recipient proof receipt',
      at: input.recipientReceipt.createdAt,
      state: input.evidence.recipientProofReceipt?.recipientChallengeVerified ? 'pass' as const : 'attention' as const,
      detail: `${input.recipientReceipt.receiptId} / ${input.evidence.recipientProofReceipt?.proofMethod ?? 'proof method not captured'}`,
    }] : []),
    {
      label: 'Registry freshness check',
      at: input.evidence.revocationFreshness.generatedAt,
      state: registryState,
      detail: input.evidence.revocationFreshness.detail,
    },
    {
      label: 'Advanced audit generated',
      at: input.generatedAt,
      state: auditMetricState(failing, attention),
      detail: `Risk ${auditRiskFromCheckCounts(failing, attention)} / score ${score}`,
    },
  ]);

  const nextActions = input.checks
    .filter((check) => check.state !== 'pass')
    .slice(0, 6)
    .map((check) => (
      check.state === 'fail'
        ? `Resolve failed check: ${check.label}. ${check.detail}`
        : `Review attention check: ${check.label}. ${check.detail}`
    ));

  if (nextActions.length === 0) {
    nextActions.push('Archive the redacted audit report and release only after local identity policy is satisfied.');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    risk: auditRiskFromCheckCounts(failing, attention),
    coverage: {
      present: passed,
      total: input.checks.length,
      missing,
    },
    metrics: [
      {
        label: 'Checks passed',
        value: `${passed}/${input.checks.length}`,
        state: auditMetricState(failing, attention),
        detail: `${failing} failed, ${attention} attention, ${passed} passed.`,
      },
      {
        label: 'Proof level',
        value: input.proofLevel,
        state: input.evidence.waybillId && input.proofLevel !== 'delivery-completed' ? 'attention' : 'pass',
        detail: input.evidence.waybillId
          ? 'Waybill handoff should end at Delivery Completed before release.'
          : 'No waybill evidence is selected; local receipt checks are sufficient.',
      },
      {
        label: 'Registry freshness',
        value: input.evidence.revocationFreshness.registryFresh ? 'fresh' : 'stale',
        state: registryState,
        detail: input.evidence.revocationFreshness.detail,
      },
      {
        label: 'Terminal signatures',
        value: input.evidence.posTerminalSignatures.complete ? 'complete' : 'partial',
        state: terminalSignatureState,
        detail: input.evidence.waybillId
          ? 'Carrier and recipient receipt evidence must both carry terminal signatures.'
          : 'No waybill dual-signature requirement for this receipt.',
      },
    ],
    timeline,
    nextActions,
    privacyPosture: {
      state: privacyState,
      detail: privacyState === 'pass'
        ? 'Printed and exported evidence is limited to receipt ids, status values, redacted tails, and coarse operational metadata.'
        : 'Review redaction or high-risk controls before releasing this report outside the terminal.',
      controls: [
        'No raw payload storage',
        'Receipt ids and signature tails only',
        'Domain-separated nullifier evidence',
        input.evidence.highRiskSafety.active
          ? 'High-risk AGID-S-only controls'
          : 'Standard redacted receipt controls',
        'No full address, proof code, or full signature in report',
      ],
    },
    integrityChecks: [
      {
        label: 'Report evidence is redacted to tails',
        state: privacyState,
        reason: privacyState === 'pass'
          ? 'The report uses ids, status values, and signature/hash tails instead of raw payloads.'
          : 'Redaction or high-risk controls need review.',
      },
      {
        label: 'Carrier and recipient terminal signatures',
        state: terminalSignatureState,
        reason: terminalSignatureState === 'pass'
          ? 'Required terminal signature evidence is complete for the selected proof mode.'
          : 'One side of the waybill handoff is missing signed terminal evidence.',
      },
      {
        label: 'Registry freshness and revocation',
        state: registryState,
        reason: input.evidence.revocationFreshness.detail,
      },
      {
        label: 'Duplicate nullifier check',
        state: input.evidence.revocationFreshness.replayDetected ? 'fail' : 'pass',
        reason: input.evidence.revocationFreshness.replayDetected
          ? 'A repeated used/nullifier value was detected in local evidence.'
          : 'No repeated used/nullifier value was found in local evidence.',
      },
      {
        label: 'High-risk safety controls',
        state: input.evidence.highRiskSafety.state,
        reason: input.evidence.highRiskSafety.detail,
      },
    ],
  };
}

function deviceStatus(ready: boolean, warning: boolean): PosDeviceStatus {
  if (ready) return 'ready';
  return warning ? 'warning' : 'offline';
}

export function getPosStaffProfile(role: PosStaffRole): PosStaffProfile {
  return STAFF_PROFILES[role] ?? STAFF_PROFILES['pickup-operator'];
}

export function listPosStaffProfiles(): PosStaffProfile[] {
  return Object.values(STAFF_PROFILES);
}

export function hasPosStaffPermission(
  role: PosStaffRole,
  permission: PosStaffPermission,
) {
  return getPosStaffProfile(role).permissions.includes(permission);
}

export function buildPosDeviceDiagnostics(
  snapshot: PosHardwareCapabilitySnapshot = {},
): PosDeviceDiagnostic[] {
  const checkedAt = snapshot.checkedAt || new Date().toISOString();
  const connectorReady = Boolean(snapshot.nativeConnector);
  const printerReady = connectorReady || Boolean(snapshot.webSerial || snapshot.webUsb);
  const barcodeReady = snapshot.keyboardWedge !== false || Boolean(snapshot.webHid);
  const drawerReady = connectorReady || Boolean(snapshot.cashDrawerRelay && printerReady);
  const measurementReady = connectorReady || Boolean(
    snapshot.measurementProfile
    || snapshot.measurementSerial
    || snapshot.measurementHid
    || snapshot.measurementUsb,
  );
  const measurementPairable = measurementReady || Boolean(snapshot.webSerial || snapshot.webHid || snapshot.webUsb);

  return [
    {
      kind: 'receipt-printer',
      label: 'Receipt printer',
      status: deviceStatus(printerReady, Boolean(snapshot.webSerial || snapshot.webUsb)),
      checkedAt,
      requiredPermission: 'print-redacted-receipt',
      evidence: [
        connectorReady ? 'native-connector' : 'browser-connector',
        snapshot.webSerial ? 'web-serial' : 'serial-not-paired',
        snapshot.webUsb ? 'web-usb' : 'usb-not-paired',
      ],
      operatorAction: printerReady
        ? 'Print redacted receipt and keep raw address out of paper output.'
        : 'Pair a WebSerial/WebUSB printer or use the native POS connector.',
    },
    {
      kind: 'cash-drawer',
      label: 'Cash drawer',
      status: deviceStatus(drawerReady, printerReady || connectorReady),
      checkedAt,
      requiredPermission: 'open-cash-drawer',
      evidence: [
        connectorReady ? 'native-connector' : 'no-native-connector',
        snapshot.cashDrawerRelay ? 'drawer-relay-configured' : 'drawer-relay-missing',
      ],
      operatorAction: drawerReady
        ? 'Drawer open command can be audited with the receipt id.'
        : 'Use supervisor approval or pair the drawer relay before cash tender.',
    },
    {
      kind: 'barcode-reader',
      label: 'Barcode reader',
      status: barcodeReady ? 'ready' : 'warning',
      checkedAt,
      requiredPermission: 'pair-barcode-reader',
      evidence: [
        snapshot.keyboardWedge !== false ? 'keyboard-wedge-supported' : 'keyboard-wedge-disabled',
        snapshot.webHid ? 'web-hid' : 'web-hid-not-paired',
      ],
      operatorAction: barcodeReady
        ? 'Keyboard-wedge scanner can feed the manual payload field.'
        : 'Enable keyboard-wedge mode or pair a WebHID scanner.',
    },
    {
      kind: 'measurement-instrument',
      label: 'Electronic measuring instrument',
      status: deviceStatus(measurementReady, measurementPairable),
      checkedAt,
      requiredPermission: 'pair-measuring-instrument',
      evidence: [
        connectorReady ? 'native-connector' : 'browser-or-manual',
        snapshot.measurementProfile ? 'measurement-profile-configured' : 'measurement-profile-missing',
        snapshot.measurementSerial || snapshot.webSerial ? 'web-serial-measurement' : 'serial-measurement-not-paired',
        snapshot.measurementHid || snapshot.webHid ? 'web-hid-measurement' : 'hid-measurement-not-paired',
        snapshot.measurementUsb || snapshot.webUsb ? 'web-usb-measurement' : 'usb-measurement-not-paired',
      ],
      operatorAction: measurementReady
        ? 'Capture package weight, dimensions, temperature, or meter readings without storing recipient secrets.'
        : measurementPairable
          ? 'Pair a WebSerial/WebHID/WebUSB scale, dimensioner, thermometer, or meter; manual entry remains available.'
          : 'Use manual measurement entry or a native connector before enforcing measured shipping rules.',
    },
  ];
}

export function buildPosExceptionAuditCases(
  receipts: PosAcceptanceReceipt[],
): PosExceptionAuditCase[] {
  return receipts
    .filter((receipt) => receipt.status === 'review' || receipt.status === 'rejected')
    .map((receipt) => {
      const status = receipt.status as Extract<PosAcceptanceStatus, 'review' | 'rejected'>;
      const reason = firstIssue(receipt);
      return {
        caseId: `AUD-${stableShortId(`${receipt.receiptId}|${reason}`)}`,
        receiptId: receipt.receiptId,
        status,
        severity: status === 'rejected' ? 'block' : 'review',
        createdAt: receipt.createdAt,
        channel: receipt.channel,
        recordLabel: receipt.record?.label ?? 'No accepted record',
        reason,
        operatorAction: status === 'rejected'
          ? 'Do not release item; rescan or escalate to supervisor.'
          : 'Hold item until supervisor confirms redaction, recipient, and registry posture.',
      };
    });
}

export function buildPosHandoffReverificationReport(options: {
  receipt: PosAcceptanceReceipt | null;
  receipts?: PosAcceptanceReceipt[];
  staffRole: PosStaffRole;
  registryFresh: boolean;
  diagnostics: PosDeviceDiagnostic[];
  generatedAt?: string;
}): PosHandoffReverificationReport {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const receipt = options.receipt;
  const printer = options.diagnostics.find((item) => item.kind === 'receipt-printer');
  const barcode = options.diagnostics.find((item) => item.kind === 'barcode-reader');
  const cashDrawer = options.diagnostics.find((item) => item.kind === 'cash-drawer');
  const requiresCashDrawer = Boolean(receipt?.amount && receipt.amount > 0);
  const staffCanHandoff = hasPosStaffPermission(options.staffRole, 'accept-handoff');
  const staffCanOverride = hasPosStaffPermission(options.staffRole, 'override-review');
  const waybillId = receipt?.shippingLabel?.waybillId;
  const relatedWaybillReceipts = waybillId
    ? Array.from(new Map(
      [receipt, ...(options.receipts ?? [])]
        .filter((item): item is PosAcceptanceReceipt => Boolean(item?.shippingLabel?.waybillId === waybillId))
        .map(item => [item.receiptId, item]),
    ).values())
    : [];
  const carrierWaybillEvidence = relatedWaybillReceipts.some(item => item.shippingLabel?.carrierScanVerified);
  const recipientWaybillEvidence = relatedWaybillReceipts.some(item => item.shippingLabel?.recipientControlVerified);
  const addressWaybillEvidence = relatedWaybillReceipts.some(item => item.shippingLabel?.addressVerified);
  const signedCarrierWaybillEvidence = relatedWaybillReceipts.some(item => Boolean(
    item.shippingLabel?.carrierScanVerified
    && item.shippingLabel.terminalEvidenceSignature
    && item.shippingLabel.terminalSignedAt,
  ));
  const signedRecipientWaybillEvidence = relatedWaybillReceipts.some(item => Boolean(
    item.shippingLabel?.recipientControlVerified
    && item.shippingLabel.terminalEvidenceSignature
    && item.shippingLabel.terminalSignedAt,
  ));
  const completeWaybillEvidence = Boolean(
    waybillId
    && addressWaybillEvidence
    && carrierWaybillEvidence
    && recipientWaybillEvidence
    && signedCarrierWaybillEvidence
    && signedRecipientWaybillEvidence
  );
  const waybillProofStages = buildShippingLabelProofStages({
    addressVerified: addressWaybillEvidence,
    carrierScanVerified: carrierWaybillEvidence,
    recipientControlVerified: recipientWaybillEvidence,
    deliveryCompleted: completeWaybillEvidence,
  });
  const waybillProofLevel = resolveShippingLabelProofLevel(waybillProofStages);
  const recipientNullifierUses = new Map<string, number>();
  for (const item of relatedWaybillReceipts) {
    const nullifier = cleanText(item.shippingLabel?.nullifier);
    if (!nullifier || !item.shippingLabel?.recipientControlVerified) continue;
    recipientNullifierUses.set(nullifier, (recipientNullifierUses.get(nullifier) ?? 0) + 1);
  }
  const replayedNullifier = Array.from(recipientNullifierUses.entries())
    .find(([, count]) => count > 1)?.[0];
  const carrierReceipt = chooseWaybillReceipt(
    relatedWaybillReceipts,
    item => Boolean(item.shippingLabel?.carrierScanVerified),
  );
  const recipientReceipt = chooseWaybillReceipt(
    relatedWaybillReceipts,
    item => Boolean(item.shippingLabel?.recipientControlVerified),
  );
  const carrierScanReceipt = summarizeWaybillReceiptEvidence(carrierReceipt);
  const recipientProofReceipt = summarizeWaybillReceiptEvidence(recipientReceipt);
  const highRiskSafety = buildHighRiskSafetyEvidence(relatedWaybillReceipts);

  const checks: PosHandoffReverificationCheck[] = [
    {
      label: 'Receipt decision',
      state: !receipt
        ? 'fail'
        : receipt.status === 'accepted'
          ? 'pass'
          : receipt.status === 'review' && staffCanOverride
            ? 'attention'
            : 'fail',
      detail: receipt
        ? `${receipt.receiptId} / ${receipt.status}`
        : 'No handoff receipt is selected.',
    },
    {
      label: 'Registry freshness',
      state: options.registryFresh ? 'pass' : 'attention',
      detail: options.registryFresh
        ? 'Registry freshness window is valid.'
        : 'Registry is stale or unavailable; use deferred sync notes.',
    },
    {
      label: 'Staff authorization',
      state: staffCanHandoff ? 'pass' : 'fail',
      detail: `${getPosStaffProfile(options.staffRole).label} ${staffCanHandoff ? 'can' : 'cannot'} complete handoff.`,
    },
    {
      label: 'Redaction posture',
      state: receipt?.record?.rawPayloadStored === false ? 'pass' : 'attention',
      detail: receipt?.record?.rawPayloadStored === false
        ? 'Receipt stores only redacted tails and coarse metadata.'
        : 'No redacted record summary is available.',
    },
    {
      label: 'Waybill dual scan',
      state: !receipt?.shippingLabel
        ? 'pass'
        : completeWaybillEvidence
          ? 'pass'
          : carrierWaybillEvidence || recipientWaybillEvidence
            ? 'attention'
            : 'fail',
      detail: !receipt?.shippingLabel
        ? 'No waybill receipt is selected.'
        : completeWaybillEvidence
          ? 'Delivery Completed: carrier scan, recipient-control scan, timestamps, and terminal evidence signatures are present.'
          : carrierWaybillEvidence
            ? signedCarrierWaybillEvidence
              ? 'Carrier Accepted: carrier scan is present; recipient-control scan is still required.'
              : 'Carrier scan is present, but terminal evidence signature is missing.'
            : recipientWaybillEvidence
              ? signedRecipientWaybillEvidence
                ? 'Recipient Controlled: recipient-control scan is present; carrier address scan is still required.'
                : 'Recipient-control scan is present, but terminal evidence signature is missing.'
              : 'No valid carrier or recipient waybill scan evidence is available.',
    },
    {
      label: 'Waybill nullifier replay',
      state: !receipt?.shippingLabel
        ? 'pass'
        : replayedNullifier
          ? 'fail'
          : 'pass',
      detail: !receipt?.shippingLabel
        ? 'No waybill receipt is selected.'
        : replayedNullifier
          ? `Recipient nullifier was used more than once: ${replayedNullifier.slice(0, 12)}...`
          : 'No repeated recipient nullifier found in local receipt evidence.',
    },
    {
      label: 'High-risk safety mode',
      state: highRiskSafety.state,
      detail: highRiskSafety.detail,
    },
    {
      label: 'Printer readiness',
      state: printer?.status === 'ready' ? 'pass' : 'attention',
      detail: printer?.operatorAction ?? 'Printer diagnostic has not run.',
    },
    {
      label: 'Barcode reader readiness',
      state: barcode?.status === 'ready' ? 'pass' : 'attention',
      detail: barcode?.operatorAction ?? 'Barcode diagnostic has not run.',
    },
    {
      label: 'Cash drawer requirement',
      state: !requiresCashDrawer
        ? 'pass'
        : cashDrawer?.status === 'ready'
          ? 'pass'
          : 'attention',
      detail: requiresCashDrawer
        ? (cashDrawer?.operatorAction ?? 'Cash drawer diagnostic has not run.')
        : 'No cash drawer action required for this receipt.',
    },
  ];

  const failing = checks.filter((check) => check.state === 'fail').length;
  const attention = checks.filter((check) => check.state === 'attention').length;
  const status: PosHandoffReverificationReport['status'] = failing > 0
    ? 'blocked'
    : attention > 0
      ? 'attention'
      : 'cleared';
  const reportSeed = [
    receipt?.receiptId ?? 'no-receipt',
    options.staffRole,
    generatedAt,
    checks.map((check) => `${check.label}:${check.state}`).join('|'),
  ].join('|');
  const decisionReasons = checks.map((check): PosHandoffReverificationDecisionReason => ({
    label: check.label,
    state: check.state,
    reason: check.detail,
  }));
  const evidenceSummary: PosHandoffReverificationEvidencePackage = {
    ...(waybillId ? { waybillId } : {}),
    ...(carrierScanReceipt ? { carrierScanReceipt } : {}),
    ...(recipientProofReceipt ? { recipientProofReceipt } : {}),
    revocationFreshness: buildRegistryEvidenceSummary({
      registryFresh: options.registryFresh,
      replayedNullifier,
      generatedAt,
    }),
    posTerminalSignatures: {
      complete: completeWaybillEvidence,
      ...(carrierScanReceipt ? { carrier: carrierScanReceipt } : {}),
      ...(recipientProofReceipt ? { recipient: recipientProofReceipt } : {}),
    },
    highRiskSafety,
    decisionReasons,
  };
  const advancedAudit = buildAdvancedAuditReport({
    checks,
    evidence: evidenceSummary,
    proofLevel: waybillProofLevel,
    receipt,
    carrierReceipt,
    recipientReceipt,
    generatedAt,
  });

  return {
    reportId: `RVR-${stableShortId(reportSeed)}`,
    status,
    proofLevel: waybillProofLevel,
    proofStages: waybillProofStages,
    generatedAt,
    ...(receipt ? { receiptId: receipt.receiptId } : {}),
    checks,
    evidenceSummary,
    advancedAudit,
    summary: status === 'cleared'
      ? 'Handoff can be completed after final human identity check.'
      : status === 'attention'
        ? 'Handoff can continue only with documented operator review.'
        : 'Handoff must remain blocked until failed checks are resolved.',
  };
}

function countReceipts(
  receipts: PosAcceptanceReceipt[],
  status: PosAcceptanceStatus,
) {
  return receipts.filter((receipt) => receipt.status === status).length;
}

function uniqueRiskId(seed: string) {
  return `MGT-${stableShortId(seed)}`;
}

export function buildPosManagementSnapshot(options: {
  terminalId?: string;
  operatorId?: string;
  staffRole: PosStaffRole;
  receipts: PosAcceptanceReceipt[];
  latestReceipt: PosAcceptanceReceipt | null;
  registryFresh: boolean;
  diagnostics: PosDeviceDiagnostic[];
  activeSecureKeys: number;
  totalSecureKeys: number;
  syncState: 'idle' | 'loading' | 'error';
  generatedAt?: string;
}): PosManagementSnapshot {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const terminalId = cleanText(options.terminalId) || 'AGID-POS-LOCAL';
  const receipts = options.receipts;
  const accepted = countReceipts(receipts, 'accepted');
  const review = countReceipts(receipts, 'review');
  const rejected = countReceipts(receipts, 'rejected');
  const total = receipts.length;
  const deviceReady = options.diagnostics.filter((item) => item.status === 'ready').length;
  const deviceAttention = options.diagnostics.length - deviceReady;
  const exceptionCases = buildPosExceptionAuditCases(receipts);
  const blockCases = exceptionCases.filter((item) => item.severity === 'block').length;
  const staff = getPosStaffProfile(options.staffRole);
  const releaseRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const risks: PosManagementRisk[] = [];

  const pushRisk = (
    severity: PosManagementRiskSeverity,
    label: string,
    detail: string,
    action: string,
    workspace: PosManagementWorkspace,
  ) => {
    risks.push({
      id: uniqueRiskId(`${terminalId}|${label}|${detail}|${workspace}`),
      severity,
      label,
      detail,
      action,
      workspace,
    });
  };

  if (!cleanText(options.operatorId)) {
    pushRisk(
      'warning',
      'Operator identity missing',
      'Receipts cannot be tied to a staff operator.',
      'Set an operator id before production handoff.',
      'settings',
    );
  }
  if (!options.registryFresh) {
    pushRisk(
      'warning',
      'Registry freshness not confirmed',
      'Revocation, used-state, and key status may be stale.',
      'Refresh the registry or keep receipts in deferred sync mode.',
      'registry',
    );
  }
  if (options.syncState === 'error') {
    pushRisk(
      'warning',
      'Receipt sync failed',
      'Local evidence exists but server reconciliation did not complete.',
      'Retry sync and keep the local receipt queue intact.',
      'queue',
    );
  }
  if (blockCases > 0) {
    pushRisk(
      'critical',
      'Rejected cases are open',
      `${blockCases} blocked receipt(s) require escalation.`,
      'Do not release affected packages until rescanned or supervisor-cleared.',
      'audit',
    );
  }
  if (review > 0) {
    pushRisk(
      'warning',
      'Review cases are open',
      `${review} receipt(s) need supervised review.`,
      'Open the exception audit and attach a handoff report.',
      'audit',
    );
  }
  if (deviceAttention > 0) {
    pushRisk(
      deviceReady === 0 ? 'critical' : 'warning',
      'Terminal devices need attention',
      `${deviceAttention} of ${options.diagnostics.length} device check(s) are not ready.`,
      'Run diagnostics and pair printer, drawer, barcode reader, or measuring instrument as needed.',
      'devices',
    );
  }
  if (options.activeSecureKeys === 0) {
    pushRisk(
      'warning',
      'No active AGID-S key',
      'Encrypted AGID-S payloads cannot be opened on this terminal.',
      'Generate or rotate a recipient key before encrypted handoff.',
      'keys',
    );
  }
  if (options.latestReceipt?.status === 'rejected') {
    pushRisk(
      'critical',
      'Current decision is rejected',
      `${options.latestReceipt.receiptId} must remain blocked.`,
      'Rescan, verify registry state, or escalate to supervisor.',
      'decision',
    );
  } else if (options.latestReceipt?.status === 'review') {
    pushRisk(
      'warning',
      'Current decision needs review',
      `${options.latestReceipt.receiptId} is accepted only with review.`,
      'Run post-handoff reverification before release.',
      'report',
    );
  }

  const critical = risks.filter((risk) => risk.severity === 'critical').length;
  const warnings = risks.filter((risk) => risk.severity === 'warning').length;
  const grade: PosManagementSnapshot['grade'] = critical > 0
    ? 'blocked'
    : warnings > 0
      ? 'attention'
      : 'ready';

  return {
    snapshotId: `MGS-${stableShortId(`${terminalId}|${generatedAt}|${total}|${critical}|${warnings}`)}`,
    generatedAt,
    terminalId,
    grade,
    summary: grade === 'ready'
      ? 'Management posture is ready for normal handoff operations.'
      : grade === 'attention'
        ? 'Management posture is usable, but listed issues should be resolved before high-risk handoff.'
        : 'Management posture is blocked for release until critical issues are resolved.',
    metrics: [
      {
        label: 'Receipts',
        value: String(total),
        detail: `${accepted} accepted / ${review} review / ${rejected} rejected`,
        tone: rejected > 0 ? 'danger' : review > 0 ? 'warning' : total > 0 ? 'ok' : 'normal',
      },
      {
        label: 'Release rate',
        value: total > 0 ? `${releaseRate}%` : 'n/a',
        detail: total > 0 ? 'Accepted receipts in local cache' : 'No receipt history yet',
        tone: rejected > 0 ? 'danger' : review > 0 ? 'warning' : total > 0 ? 'ok' : 'normal',
      },
      {
        label: 'Devices',
        value: `${deviceReady}/${options.diagnostics.length}`,
        detail: `${deviceAttention} attention`,
        tone: deviceAttention === 0 ? 'ok' : deviceReady === 0 ? 'danger' : 'warning',
      },
      {
        label: 'Role',
        value: staff.label,
        detail: hasPosStaffPermission(options.staffRole, 'override-review') ? 'override capable' : 'standard handoff',
        tone: cleanText(options.operatorId) ? 'ok' : 'warning',
      },
      {
        label: 'Registry',
        value: options.registryFresh ? 'fresh' : 'check',
        detail: options.registryFresh ? 'Freshness window valid' : 'Use refresh or deferred sync',
        tone: options.registryFresh ? 'ok' : 'warning',
      },
      {
        label: 'AGID-S keys',
        value: `${options.activeSecureKeys}/${options.totalSecureKeys}`,
        detail: options.activeSecureKeys > 0 ? 'Active decryption keys' : 'Encrypted payloads unavailable',
        tone: options.activeSecureKeys > 0 ? 'ok' : 'warning',
      },
    ],
    risks,
  };
}

export function posOperationalStatusLabel(value: PosDeviceStatus | PosHandoffReverificationReport['status']) {
  const cleaned = cleanText(value);
  return cleaned ? cleaned.replace(/-/g, ' ').toUpperCase() : 'UNKNOWN';
}
