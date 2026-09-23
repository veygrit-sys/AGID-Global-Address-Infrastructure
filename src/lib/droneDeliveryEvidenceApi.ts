import {
  createDeliveryReachabilityReport,
  validateDeliveryReachabilityReport,
  type DeliveryReachabilityEvidence,
  type DeliveryReachabilityProblemKind,
  type DeliveryReachabilityReport,
  type DeliveryReachabilityReportInput,
} from './deliveryReachabilityReport';
import {
  cleanText,
  stableCommitment,
  stableId,
  toIsoTimestamp,
} from './redactedWorkflowCore';

export const DRONE_DELIVERY_EVIDENCE_API_VERSION = 'drone-delivery-evidence-api-v1';

export const DRONE_DELIVERY_EVIDENCE_API_SCOPE =
  'delivery-evidence-and-reachability-only-no-flight-control' as const;

export const DRONE_DELIVERY_EVIDENCE_OUTCOMES = [
  'attempted',
  'completed',
  'cannot-reach',
  'held-for-review',
] as const;

export const DRONE_DELIVERY_EVIDENCE_DECISIONS = [
  'attach-to-handoff-report',
  'create-reachability-case',
  'queue-review-console',
  'share-restricted-operator-receipt',
] as const;

export type DroneDeliveryEvidenceOutcome = typeof DRONE_DELIVERY_EVIDENCE_OUTCOMES[number];
export type DroneDeliveryEvidenceDecision = typeof DRONE_DELIVERY_EVIDENCE_DECISIONS[number];

export type DroneDeliveryEvidenceApiInput = Omit<Partial<DeliveryReachabilityReportInput>, 'evidence'> & {
  deliveryId?: unknown;
  operatorRef?: unknown;
  missionRef?: unknown;
  accessGrantRef?: unknown;
  signedReceiptRef?: unknown;
  outcome?: unknown;
  evidence?: DeliveryReachabilityEvidence[];
};

export type DroneDeliveryEvidenceCapabilities = {
  version: typeof DRONE_DELIVERY_EVIDENCE_API_VERSION;
  scope: typeof DRONE_DELIVERY_EVIDENCE_API_SCOPE;
  endpoints: string[];
  outcomes: readonly DroneDeliveryEvidenceOutcome[];
  decisions: readonly DroneDeliveryEvidenceDecision[];
  acceptedProblemKinds: DeliveryReachabilityProblemKind[];
  publicSurface: string[];
  restrictedSurface: string[];
  notInScope: string[];
};

export type DroneDeliveryEvidenceReceipt = {
  version: typeof DRONE_DELIVERY_EVIDENCE_API_VERSION;
  scope: typeof DRONE_DELIVERY_EVIDENCE_API_SCOPE;
  receiptId: string;
  generatedAt: string;
  deliveryRef: string;
  outcome: DroneDeliveryEvidenceOutcome;
  decision: DroneDeliveryEvidenceDecision;
  nextAction: string;
  reachabilityReport: DeliveryReachabilityReport;
  validation: ReturnType<typeof validateDeliveryReachabilityReport>;
  publicApiProjection: {
    receiptId: string;
    deliveryRef: string;
    outcome: DroneDeliveryEvidenceOutcome;
    decision: DroneDeliveryEvidenceDecision;
    reportId: string;
    publicationState: DeliveryReachabilityReport['publicProjection']['publicationState'];
    problemKind: DeliveryReachabilityReport['publicProjection']['problemKind'];
    severity: DeliveryReachabilityReport['publicProjection']['severity'];
    status: DeliveryReachabilityReport['publicProjection']['status'];
    confidence: number;
    coarseAgid?: string;
    regionCode?: string;
    countryCode?: string;
    reporterClass: DeliveryReachabilityReport['publicProjection']['reporterClass'];
    evidenceClasses: string[];
    ttlSeconds: number;
    updatedAt: string;
  };
  restrictedOperatorReceipt: {
    receiptCommitment: string;
    deliveryCommitment?: string;
    operatorCommitment?: string;
    missionCommitment?: string;
    accessGrantCommitment?: string;
    signedReceiptCommitment?: string;
    reachabilityCommitment: string;
    closedFields: string[];
    sensitiveTags: string[];
  };
  guarantees: {
    autopilotCommandsEmitted: false;
    flightControlStateStored: false;
    rawAddressPublic: false;
    rawAgidPublic: false;
    rawAoidPublic: false;
    rawCoordinatesPublic: false;
    rawTelemetryPublic: false;
  };
  warnings: string[];
};

const ACCEPTED_DRONE_PROBLEMS: DeliveryReachabilityProblemKind[] = [
  'access-blocked',
  'road-closed',
  'bridge-closed',
  'unsafe-area',
  'private-access-required',
  'building-entry-failed',
  'drone-no-fly',
  'drone-landing-impossible',
  'water-crossing',
  'terrain-unreachable',
  'weather-temporary',
  'geocode-wrong',
  'delivery-refused',
  'other',
];

function cleanOutcome(value: unknown): DroneDeliveryEvidenceOutcome {
  const text = cleanText(value).toLowerCase().replace(/_/g, '-');
  return DRONE_DELIVERY_EVIDENCE_OUTCOMES.includes(text as DroneDeliveryEvidenceOutcome)
    ? text as DroneDeliveryEvidenceOutcome
    : 'attempted';
}

function cleanProblemKind(value: unknown, outcome: DroneDeliveryEvidenceOutcome): DeliveryReachabilityProblemKind {
  const text = cleanText(value).toLowerCase().replace(/_/g, '-') as DeliveryReachabilityProblemKind;
  if (ACCEPTED_DRONE_PROBLEMS.includes(text)) return text;
  if (outcome === 'completed') return 'other';
  if (outcome === 'cannot-reach') return 'drone-landing-impossible';
  return 'other';
}

function decisionFor(
  outcome: DroneDeliveryEvidenceOutcome,
  report: DeliveryReachabilityReport,
): DroneDeliveryEvidenceDecision {
  if (report.publicProjection.publicationState === 'restricted') return 'share-restricted-operator-receipt';
  if (outcome === 'cannot-reach') return 'create-reachability-case';
  if (outcome === 'held-for-review' || report.publicProjection.publicationState === 'review-first') return 'queue-review-console';
  return 'attach-to-handoff-report';
}

function nextActionFor(decision: DroneDeliveryEvidenceDecision) {
  if (decision === 'share-restricted-operator-receipt') {
    return 'store-private-operator-receipt-and-share-only-commitments-with-authorized-parties';
  }
  if (decision === 'create-reachability-case') {
    return 'create-reachability-case-and-return-to-field-or-manual-review-flow';
  }
  if (decision === 'queue-review-console') return 'queue-review-console-before-public-sharing';
  return 'attach-evidence-to-handoff-or-delivery-completion-report';
}

function commitOptional(domain: string, value: unknown) {
  const text = cleanText(value, '', 160);
  return text ? stableCommitment(domain, text, { length: 32 }) : undefined;
}

function deliveryRefFor(value: unknown, generatedAt: string) {
  return stableId('DRONEDEL', cleanText(value, '', 160) || { generatedAt }, { length: 12 });
}

export function listDroneDeliveryEvidenceApiCapabilities(): DroneDeliveryEvidenceCapabilities {
  return {
    version: DRONE_DELIVERY_EVIDENCE_API_VERSION,
    scope: DRONE_DELIVERY_EVIDENCE_API_SCOPE,
    endpoints: [
      'GET /api/drone-delivery-evidence/capabilities',
      'POST /api/drone-delivery-evidence/report',
    ],
    outcomes: DRONE_DELIVERY_EVIDENCE_OUTCOMES,
    decisions: DRONE_DELIVERY_EVIDENCE_DECISIONS,
    acceptedProblemKinds: [...ACCEPTED_DRONE_PROBLEMS],
    publicSurface: [
      'receipt id',
      'delivery ref',
      'outcome',
      'decision',
      'publication state',
      'coarse AGID',
      'country/region code',
      'evidence classes',
      'confidence',
      'TTL',
    ],
    restrictedSurface: [
      'operator receipt commitment',
      'delivery commitment',
      'mission commitment',
      'access grant commitment',
      'signed receipt commitment',
      'reachability commitment',
    ],
    notInScope: [
      'autopilot command emission',
      'flight authorization',
      'remote-control link management',
      'raw route publication',
      'raw recipient address storage',
      'raw telemetry publication',
    ],
  };
}

export function createDroneDeliveryEvidenceReceipt(
  input: DroneDeliveryEvidenceApiInput,
): DroneDeliveryEvidenceReceipt {
  const generatedAt = toIsoTimestamp(input.now);
  const outcome = cleanOutcome(input.outcome);
  const problemKind = cleanProblemKind(input.problemKind, outcome);
  const deliveryRef = deliveryRefFor(input.deliveryId, generatedAt);
  const report = createDeliveryReachabilityReport({
    ...input,
    problemKind,
    reporterType: input.reporterType || 'drone-operator',
    reporterTrusted: input.reporterTrusted ?? true,
    status: input.status || (outcome === 'completed' ? 'confirmed' : undefined),
    severity: input.severity || (outcome === 'completed' ? 'info' : undefined),
    sourceDomain: cleanText(input.sourceDomain, 'drone-delivery-evidence-api', 120),
    now: generatedAt,
  } as DeliveryReachabilityReportInput);
  const validation = validateDeliveryReachabilityReport(report);
  const decision = decisionFor(outcome, report);
  const receiptId = stableId('DRONEEVD', {
    deliveryRef,
    outcome,
    reportId: report.reportId,
    generatedAt,
  }, { length: 14 });
  const reachabilityCommitment = stableCommitment('drone.delivery.reachability', {
    reportId: report.reportId,
    inputFingerprint: report.inputFingerprint,
    publicationState: report.publicProjection.publicationState,
  }, { length: 32 });
  const receiptCommitment = stableCommitment('drone.delivery.receipt', {
    receiptId,
    deliveryRef,
    outcome,
    decision,
    reachabilityCommitment,
    generatedAt,
  }, { length: 32 });
  const warnings = [
    ...report.sharingPolicy.warnings,
    ...validation.warnings,
    ...(decision === 'share-restricted-operator-receipt' ? ['drone-evidence-restricted-to-authorized-operator-receipt'] : []),
    'drone-delivery-evidence-api-does-not-control-aircraft',
  ];

  return {
    version: DRONE_DELIVERY_EVIDENCE_API_VERSION,
    scope: DRONE_DELIVERY_EVIDENCE_API_SCOPE,
    receiptId,
    generatedAt,
    deliveryRef,
    outcome,
    decision,
    nextAction: nextActionFor(decision),
    reachabilityReport: report,
    validation,
    publicApiProjection: {
      receiptId,
      deliveryRef,
      outcome,
      decision,
      reportId: report.reportId,
      publicationState: report.publicProjection.publicationState,
      problemKind: report.publicProjection.problemKind,
      severity: report.publicProjection.severity,
      status: report.publicProjection.status,
      confidence: report.publicProjection.confidence,
      coarseAgid: report.publicProjection.coarseAgid,
      regionCode: report.publicProjection.regionCode,
      countryCode: report.publicProjection.countryCode,
      reporterClass: report.publicProjection.reporterClass,
      evidenceClasses: report.publicProjection.evidenceClasses,
      ttlSeconds: report.publicProjection.ttlSeconds,
      updatedAt: report.publicProjection.updatedAt,
    },
    restrictedOperatorReceipt: {
      receiptCommitment,
      deliveryCommitment: commitOptional('drone.delivery.id', input.deliveryId),
      operatorCommitment: commitOptional('drone.delivery.operator', input.operatorRef || input.reporterId),
      missionCommitment: commitOptional('drone.delivery.mission', input.missionRef),
      accessGrantCommitment: commitOptional('drone.delivery.access-grant', input.accessGrantRef),
      signedReceiptCommitment: commitOptional('drone.delivery.signed-receipt', input.signedReceiptRef),
      reachabilityCommitment,
      closedFields: report.restrictedProjection.closedFields,
      sensitiveTags: report.restrictedProjection.sensitiveTags,
    },
    guarantees: {
      autopilotCommandsEmitted: false,
      flightControlStateStored: false,
      rawAddressPublic: false,
      rawAgidPublic: false,
      rawAoidPublic: false,
      rawCoordinatesPublic: false,
      rawTelemetryPublic: false,
    },
    warnings: Array.from(new Set(warnings)),
  };
}
