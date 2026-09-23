import type { ServiceOfferingId } from './openCoreProductStrategy';
import {
  getUnbuiltAppConcept,
  type UnbuiltAppConceptId,
} from './unbuiltAppConcepts';

export const P2_MATURITY_EXECUTION_PLAN_VERSION = 'agid-p2-maturity-execution-plan-v1';

export const P2_MATURITY_IDS = [
  'drone-locker-ops',
] as const satisfies readonly UnbuiltAppConceptId[];

export type P2MaturityConceptId = typeof P2_MATURITY_IDS[number];

export type P2MaturityStage = 'evidence-reachability-api';

export type P2MaturitySurface = {
  conceptId: P2MaturityConceptId;
  label: string;
  stage: P2MaturityStage;
  order: number;
  route: string;
  goal: string;
  mustAddScreens: string[];
  sharedComponents: string[];
  stateContract: string[];
  testGates: string[];
  privacyGates: string[];
  freeBoundary: string[];
  paidBoundary: string[];
  services: ServiceOfferingId[];
  dependsOn: UnbuiltAppConceptId[];
  implementationSlice: string[];
  completionDefinition: string;
};

export type P2MaturityExecutionPlan = {
  version: typeof P2_MATURITY_EXECUTION_PLAN_VERSION;
  principle: string;
  executionOrder: P2MaturityConceptId[];
  surfaces: P2MaturitySurface[];
  sharedFoundation: string[];
  crossSurfaceStateRules: string[];
  crossSurfaceTestGates: string[];
  doNotDo: string[];
  sequenceRationale: string[];
  mermaid: string;
};

export type P2MaturityValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export const P2_MATURITY_SURFACES: P2MaturitySurface[] = [
  {
    conceptId: 'drone-locker-ops',
    label: 'Drone Delivery Evidence / Reachability API',
    stage: 'evidence-reachability-api',
    order: 1,
    route: '/api/drone-delivery-evidence',
    goal: 'Keep P2 drone work focused on delivery evidence, cannot-reach reporting, and privacy-safe reachability decisions instead of building a drone OS or flight-control surface.',
    mustAddScreens: [
      'capabilities endpoint',
      'reachability report endpoint',
      'public projection preview',
      'restricted operator receipt view',
      'cannot-reach reason picker',
      'evidence class summary',
      'manual review handoff',
      'redacted audit export',
    ],
    sharedComponents: [
      'DroneDeliveryEvidenceReceipt',
      'DeliveryReachabilityReport',
      'PublicReachabilityProjection',
      'RestrictedOperatorReceipt',
      'ReachabilityReasonCode',
      'EvidenceClassSummary',
      'ManualReviewQueueLink',
      'RedactedAuditExport',
    ],
    stateContract: [
      'attempted',
      'completed',
      'cannot-reach',
      'held-for-review',
      'reported',
      'confirmed',
      'restricted',
      'review-first',
      'expired',
    ],
    testGates: [
      'drone evidence API blocks raw addresses, raw AGID/AOID values, raw coordinates, raw telemetry, and recipient identity from public projections',
      'cannot-reach reports use normalized reason codes and coarse AGID by default',
      'signed drone telemetry is stored only as restricted commitments when precise telemetry exists',
      'high-risk drone delivery reports become restricted operator receipts instead of public telemetry',
      'API output guarantees autopilotCommandsEmitted=false and flightControlStateStored=false',
    ],
    privacyGates: [
      'public API output uses coarse zones, evidence classes, confidence, and publication state instead of exact recipient routes',
      'high-risk deliveries keep precise route, device id, coordinates, and access proof in restricted operator receipts, not public telemetry',
    ],
    freeBoundary: [
      'drone delivery evidence API schema',
      'delivery reachability report schema',
      'public/restricted projection model',
      'cannot-reach reason codes',
      'redacted operator receipt model',
      'no-flight-control test gates',
    ],
    paidBoundary: [
      'managed evidence retention',
      'certified operator integrations',
      'carrier/PUDO/drone network support',
      'review and incident response SLA',
    ],
    services: ['agid-pos-terminal', 'address-validation-service', 'address-radar-signal'],
    dependsOn: [
      'settings-policy-center',
      'field-handoff-app',
      'carrier-label-settlement',
      'address-connect-admin',
    ],
    implementationSlice: [
      'wrap DeliveryReachabilityReport into a drone-specific evidence API without exposing flight-control commands',
      'add capabilities and report endpoints before any drone operator UI',
      'connect carrier labels, field handoff receipts, and organization trust to evidence receipts without exposing raw address material',
      'treat Drone OS modules as advisory evidence sources only, not as P2 product scope',
    ],
    completionDefinition: 'Operators can submit drone delivery evidence and cannot-reach reports through a privacy-safe API that returns public projections, restricted operator receipts, confidence, TTL, and review actions without creating a drone OS or emitting flight-control commands.',
  },
];

export const P2_SHARED_FOUNDATION = [
  'one drone delivery evidence API contract for completed, attempted, cannot-reach, and held-for-review outcomes',
  'one DeliveryReachabilityReport projection model for public warnings and restricted operator receipts',
  'one privacy rule that blocks raw AGID-S payloads, raw addresses, proof witnesses, private keys, recipient identity, precise coordinates, and raw telemetry from public drone evidence streams',
  'one cannot-reach reason-code set shared with Review Console, Address Radar, Carrier Label, and Field Handoff',
  'one explicit no-flight-control boundary: no autopilot commands, no flight authorization, and no remote-control link management',
];

export const P2_CROSS_SURFACE_STATE_RULES = [
  'Settings high-risk policy and local/hosted mode apply to every drone evidence report.',
  'Address Connect Admin owns organization, endpoint, public key, and operator trust status before production evidence ingestion.',
  'Carrier Label and Field Handoff provide task context; Drone Evidence API only records reachability and evidence outcomes.',
  'Cannot-reach reports route back to Review Console or Dashboard without overwriting Field or Carrier receipts.',
  'Public projections show coarse location and evidence classes only; restricted operator receipts hold sensitive route and proof commitments.',
];

export const P2_CROSS_SURFACE_TEST_GATES = [
  'drone evidence public projection rejects raw address, raw AGID, raw AOID, AGID-S payload, proof secret, private key, recipient name, phone fields, precise coordinates, and raw telemetry',
  'high-risk drone evidence becomes restricted operator receipt instead of public route telemetry',
  'cannot-reach reports create reviewable reason-code receipts with coarse location by default',
  'delivery evidence API can run without managed IoT fleet, carrier API, Ethereum, ZK, hosted registry, or drone OS',
  'API guarantees autopilotCommandsEmitted=false and flightControlStateStored=false',
];

export const P2_DO_NOT_DO = [
  'Do not build a Drone OS, autopilot, fleet control, or flight authorization product as the P2 scope.',
  'Do not couple AGID/AOID to one proprietary drone or locker vendor.',
  'Do not publish precise high-risk routes, raw AGID-S payloads, recipient secrets, proof witnesses, private keys, phone numbers, raw telemetry, or raw addresses in public evidence.',
  'Do not treat payment status, label acceptance, or evidence receipt as flight permission.',
  'Do not add hardware-specific drone SDKs before the delivery evidence API and privacy tests are stable.',
];

export const P2_SEQUENCE_RATIONALE = [
  'Drone / Locker Operations is P2 because it depends on P0 field safety and P1 label, evidence, developer, and organization-trust maturity.',
  'Drone work should begin as delivery evidence and reachability API because OS, autopilot, and fleet control create safety, regulatory, and hardware-vendor scope risk.',
  'Cannot-reach reason codes must come before public sharing because unreachable, blocked, damaged, or unsafe delivery reports can leak sensitive location patterns.',
  'Restricted operator receipts must come before dashboards because signed drone telemetry may contain precise coordinates or route traces.',
];

export function renderP2MaturityMermaid(): string {
  return [
    'flowchart LR',
    '  Settings["Settings and Policy Center"] --> Ops["Drone Delivery Evidence / Reachability API"]',
    '  Connect["Address Connect Admin"] --> Ops',
    '  Field["Field Handoff App"] --> Ops',
    '  Carrier["Carrier Label and Settlement"] --> Ops',
    '  Ops --> Review["Review Console Incident Case"]',
    '  Ops --> Dashboard["Dashboard Evidence Health"]',
    '  Reachability["Delivery Reachability Report"] --> Ops',
    '  classDef p2 fill:#f8fafc,stroke:#64748b,color:#334155;',
    '  classDef dependency fill:#eff6ff,stroke:#2563eb,color:#1e3a8a;',
    '  class Ops,Reachability p2;',
    '  class Settings,Connect,Field,Carrier,Review,Dashboard dependency;',
  ].join('\n');
}

export function getP2MaturityExecutionPlan(): P2MaturityExecutionPlan {
  return {
    version: P2_MATURITY_EXECUTION_PLAN_VERSION,
    principle: 'Keep P2 drone work as delivery evidence and reachability APIs until P0 field safety and P1 carrier/connect contracts are stable; do not build a Drone OS, autopilot, or fleet-control product in this slice.',
    executionOrder: [...P2_MATURITY_IDS],
    surfaces: P2_MATURITY_SURFACES.map(surface => ({
      ...surface,
      mustAddScreens: [...surface.mustAddScreens],
      sharedComponents: [...surface.sharedComponents],
      stateContract: [...surface.stateContract],
      testGates: [...surface.testGates],
      privacyGates: [...surface.privacyGates],
      freeBoundary: [...surface.freeBoundary],
      paidBoundary: [...surface.paidBoundary],
      services: [...surface.services],
      dependsOn: [...surface.dependsOn],
      implementationSlice: [...surface.implementationSlice],
    })),
    sharedFoundation: [...P2_SHARED_FOUNDATION],
    crossSurfaceStateRules: [...P2_CROSS_SURFACE_STATE_RULES],
    crossSurfaceTestGates: [...P2_CROSS_SURFACE_TEST_GATES],
    doNotDo: [...P2_DO_NOT_DO],
    sequenceRationale: [...P2_SEQUENCE_RATIONALE],
    mermaid: renderP2MaturityMermaid(),
  };
}

export function getP2MaturitySurface(conceptId: P2MaturityConceptId): P2MaturitySurface | undefined {
  return getP2MaturityExecutionPlan().surfaces.find(surface => surface.conceptId === conceptId);
}

export function validateP2MaturityExecutionPlan(
  plan = getP2MaturityExecutionPlan(),
): P2MaturityValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<P2MaturityConceptId>();

  if (plan.surfaces.length !== P2_MATURITY_IDS.length) {
    errors.push(`expected-${P2_MATURITY_IDS.length}-p2-surfaces:${plan.surfaces.length}`);
  }
  if (plan.executionOrder.join('|') !== P2_MATURITY_IDS.join('|')) {
    errors.push(`unexpected-p2-order:${plan.executionOrder.join(',')}`);
  }

  for (const surface of plan.surfaces) {
    if (seen.has(surface.conceptId)) errors.push(`duplicate-p2-surface:${surface.conceptId}`);
    seen.add(surface.conceptId);

    const concept = getUnbuiltAppConcept(surface.conceptId);
    if (!concept) {
      errors.push(`unknown-concept:${surface.conceptId}`);
      continue;
    }
    if (concept.priority !== 'P2') errors.push(`concept-not-p2:${surface.conceptId}`);
    if (concept.recommendedRoute !== surface.route) {
      errors.push(`route-mismatch:${surface.conceptId}:${surface.route}:${concept.recommendedRoute}`);
    }
    for (const conceptDependency of concept.dependencies) {
      if (!surface.dependsOn.includes(conceptDependency)) {
        errors.push(`missing-concept-dependency:${surface.conceptId}:${conceptDependency}`);
      }
    }
    for (const service of surface.services) {
      if (!concept.services.includes(service)) {
        errors.push(`service-not-on-concept:${surface.conceptId}:${service}`);
      }
    }
    for (const dependency of surface.dependsOn) {
      if (!getUnbuiltAppConcept(dependency)) {
        errors.push(`unknown-dependency:${surface.conceptId}:${dependency}`);
      }
    }

    if (surface.mustAddScreens.length < 8) errors.push(`not-enough-screens:${surface.conceptId}`);
    if (surface.sharedComponents.length < 8) errors.push(`not-enough-components:${surface.conceptId}`);
    if (surface.stateContract.length < 8) errors.push(`not-enough-states:${surface.conceptId}`);
    if (surface.testGates.length < 5) errors.push(`not-enough-test-gates:${surface.conceptId}`);
    if (surface.privacyGates.length < 2) errors.push(`not-enough-privacy-gates:${surface.conceptId}`);
    if (!surface.freeBoundary.length) errors.push(`missing-free-boundary:${surface.conceptId}`);
    if (!surface.paidBoundary.length) errors.push(`missing-paid-boundary:${surface.conceptId}`);
    if (!surface.completionDefinition.trim()) errors.push(`missing-completion-definition:${surface.conceptId}`);
  }

  for (const id of P2_MATURITY_IDS) {
    if (!seen.has(id)) errors.push(`missing-p2-surface:${id}`);
  }

  const ops = getP2MaturitySurface('drone-locker-ops');
  for (const dependency of ['settings-policy-center', 'field-handoff-app', 'carrier-label-settlement', 'address-connect-admin'] as const) {
    if (!ops?.dependsOn.includes(dependency)) errors.push(`ops-must-depend-on:${dependency}`);
  }

  const doNotDoText = plan.doNotDo.join(' ').toLowerCase();
  for (const phrase of ['drone os', 'one proprietary', 'precise high-risk routes', 'flight permission']) {
    if (!doNotDoText.includes(phrase)) errors.push(`missing-do-not-do:${phrase}`);
  }

  const gates = plan.crossSurfaceTestGates.join(' ').toLowerCase();
  for (const phrase of ['drone evidence public projection rejects raw address', 'restricted operator receipt', 'cannot-reach reports create reviewable', 'without managed iot fleet']) {
    if (!gates.includes(phrase)) errors.push(`missing-cross-surface-test-gate:${phrase}`);
  }

  if (!plan.mermaid.startsWith('flowchart LR')) errors.push('missing-mermaid-flowchart');
  if (plan.sharedFoundation.length < 5) warnings.push('thin-shared-foundation');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
