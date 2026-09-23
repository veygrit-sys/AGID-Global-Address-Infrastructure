import type { ServiceOfferingId } from './openCoreProductStrategy';
import {
  getUnbuiltAppConcept,
  type UnbuiltAppConceptId,
} from './unbuiltAppConcepts';

export const P0_MATURITY_EXECUTION_PLAN_VERSION = 'agid-p0-maturity-execution-plan-v1';

export const P0_MATURITY_IDS = [
  'settings-policy-center',
  'portal-maturity',
  'console-dashboard-maturity',
  'review-console',
  'field-handoff-app',
] as const satisfies readonly UnbuiltAppConceptId[];

export type P0MaturityConceptId = typeof P0_MATURITY_IDS[number];

export type P0MaturityStage =
  | 'foundation'
  | 'user-control'
  | 'operator-console'
  | 'case-review'
  | 'field-execution';

export type P0MaturitySurface = {
  conceptId: P0MaturityConceptId;
  label: string;
  stage: P0MaturityStage;
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
  dependsOn: P0MaturityConceptId[];
  implementationSlice: string[];
  completionDefinition: string;
};

export type P0MaturityExecutionPlan = {
  version: typeof P0_MATURITY_EXECUTION_PLAN_VERSION;
  principle: string;
  executionOrder: P0MaturityConceptId[];
  surfaces: P0MaturitySurface[];
  sharedFoundation: string[];
  crossSurfaceStateRules: string[];
  crossSurfaceTestGates: string[];
  doNotDo: string[];
  sequenceRationale: string[];
  mermaid: string;
};

export type P0MaturityValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export const P0_MATURITY_SURFACES: P0MaturitySurface[] = [
  {
    conceptId: 'settings-policy-center',
    label: 'Settings and Policy Center',
    stage: 'foundation',
    order: 1,
    route: '/settings',
    goal: 'Create one policy source for language, operating mode, provider adapters, device connectors, high-risk defaults, and data-flow warnings.',
    mustAddScreens: [
      'language and locale policy',
      'Mode 0-4 operation selector',
      'privacy and high-risk defaults',
      'provider adapter data-flow review',
      'device connector policy',
      'key reference and rotation hints',
      'policy impact preview',
    ],
    sharedComponents: [
      'PolicyModeSelector',
      'LanguagePolicyPicker',
      'ProviderDataFlowWarning',
      'HighRiskModeControls',
      'DeviceConnectorPolicyList',
      'KeyReferencePanel',
    ],
    stateContract: [
      'local_only',
      'server_registry',
      'zk_only',
      'ethereum_registry',
      'full_zk_ethereum',
      'provider_disabled',
      'provider_enabled',
      'high_risk_enabled',
    ],
    testGates: [
      'language setting propagates to Map, POS, Portal, Dashboard, and Address Element',
      'Mode 0 remains usable without Hosted Registry, ZK, Ethereum, or managed services',
      'provider adapters show outbound data categories before enabling',
      'high-risk controls stay available without a paid account',
    ],
    privacyGates: [
      'every provider must declare whether raw address, raw AGID, AOID refs, evidence refs, or commitments leave the device',
      'high-risk mode defaults to AGID-S, short expiry, coarse sharing, and no address history',
    ],
    freeBoundary: [
      'language settings',
      'local mode selection',
      'high-risk mode',
      'local device connector settings',
      'provider warning UI',
    ],
    paidBoundary: [
      'managed provider credentials',
      'enterprise policy templates',
      'centralized device fleet policy',
    ],
    services: ['agid-resolver-service', 'address-validation-service', 'agid-pos-terminal'],
    dependsOn: [],
    implementationSlice: [
      'extract shared policy schema',
      'wire current POS language setting into the shared schema',
      'add policy selectors to Portal and Dashboard without changing their domain logic',
      'add no-raw-address fixture tests for settings export payloads',
    ],
    completionDefinition: 'All primary surfaces read the same settings object and can render a privacy-safe summary of what leaves local mode.',
  },
  {
    conceptId: 'portal-maturity',
    label: 'Address Portal maturity',
    stage: 'user-control',
    order: 2,
    route: '/portal',
    goal: 'Make the Portal the user-facing control plane for consent, scope, revocation, deletion, export, dispute, and high-risk connection review.',
    mustAddScreens: [
      'connection list',
      'connection detail',
      'scope timeline',
      'revoke confirmation',
      'delete request',
      'safe export request',
      'dispute and correction request',
      'high-risk connection review',
    ],
    sharedComponents: [
      'AddressItemList',
      'ConnectionDetailDrawer',
      'ScopeTimeline',
      'RevokeDeleteExportActions',
      'HighRiskConnectionBanner',
      'SafeExportReceipt',
    ],
    stateContract: [
      'active',
      'requires_reverification',
      'revoked',
      'delete_requested',
      'export_ready',
      'disputed',
    ],
    testGates: [
      'Portal renders every connection state',
      'revoke, delete, export, and scope view are not paywalled',
      'Portal payload rejects raw address, raw AOID, raw AGID, recipient name, phone, and proof secret fields',
      'dispute actions create review-case references instead of exposing private evidence',
    ],
    privacyGates: [
      'show organizations, scopes, aliases, credential refs, and revocation status only',
      'deletion and export requests must produce redacted receipts',
    ],
    freeBoundary: [
      'connection view',
      'scope view',
      'revoke',
      'delete',
      'export',
      'dispute start',
    ],
    paidBoundary: [
      'hosted account operations',
      'enterprise deletion workflow automation',
      'managed notification delivery',
    ],
    services: ['address-portal'],
    dependsOn: ['settings-policy-center'],
    implementationSlice: [
      'turn safe connection cards into drill-down records',
      'add scope history and revocation history',
      'connect dispute starts to Review Console case IDs',
      'add export/delete receipt tests',
    ],
    completionDefinition: 'A user can understand, revoke, delete, export, or dispute every address connection without seeing or leaking private address material.',
  },
  {
    conceptId: 'console-dashboard-maturity',
    label: 'Address Console / Dashboard maturity',
    stage: 'operator-console',
    order: 3,
    route: '/dashboard',
    goal: 'Turn the dashboard from a summary page into an operator console with drill-down tabs for logs, webhooks, issuers, terminals, launch checks, and privacy guardrails.',
    mustAddScreens: [
      'overview',
      'redacted API logs',
      'webhook debugger',
      'issuer registry',
      'terminal fleet',
      'QR usage and used-state',
      'launch readiness',
      'privacy guardrail status',
    ],
    sharedComponents: [
      'ConsoleTabs',
      'RedactedEventTable',
      'WebhookDebugger',
      'IssuerRegistryPanel',
      'TerminalFleetPanel',
      'LaunchReadinessPanel',
      'PrivacyGuardrailStatus',
    ],
    stateContract: [
      'ready',
      'attention',
      'blocked',
      'degraded',
      'syncing',
      'incident_open',
    ],
    testGates: [
      'Dashboard tabs expose no raw address columns',
      'webhook debugger verifies signature and timestamp without storing raw body content',
      'launch readiness fails when privacy gates are missing',
      'terminal fleet summaries use device refs and statuses, not AGID-S payloads',
    ],
    privacyGates: [
      'metrics, references, commitments, roots, nullifiers, statuses, and redacted evidence refs are allowed',
      'raw request bodies, QR payloads, private keys, proof witnesses, and recipient identifiers are blocked',
    ],
    freeBoundary: [
      'self-hosted redacted event viewer',
      'webhook signature examples',
      'terminal overview',
      'launch checklist schema',
    ],
    paidBoundary: [
      'multi-tenant hosted dashboard',
      'SLA monitoring',
      'long-term log retention',
      'organization RBAC operations',
    ],
    services: ['address-console-dashboard', 'hosted-registry-api', 'address-radar-signal'],
    dependsOn: ['settings-policy-center'],
    implementationSlice: [
      'split existing dashboard into tabs',
      'add redacted event table contract',
      'add launch readiness checklist results',
      'route review queue summary into /dashboard/review',
    ],
    completionDefinition: 'Operators can move from a redacted health summary to the specific operational workspace without storing private address payloads.',
  },
  {
    conceptId: 'review-console',
    label: 'Address Review Console',
    stage: 'case-review',
    order: 4,
    route: '/dashboard/review',
    goal: 'Provide a redaction-first case-management surface for partial, rejected, conflicted, suspicious, or disputed address decisions.',
    mustAddScreens: [
      'case queue',
      'case detail',
      'evidence timeline',
      'redaction view',
      'decision receipt',
      'dispute and appeal',
      'merge and split review',
    ],
    sharedComponents: [
      'ReviewCaseQueue',
      'ReviewCaseDetail',
      'EvidenceTimeline',
      'RedactionGate',
      'DecisionReceiptPanel',
      'DisputeAppealPanel',
      'MergeSplitDecisionControls',
    ],
    stateContract: [
      'needs_review',
      'waiting_for_correction',
      'waiting_for_recipient_proof',
      'approved',
      'rejected',
      'escalated',
      'disputed',
    ],
    testGates: [
      'review action state machine cannot skip an audit reason',
      'raw evidence is hidden until role, scope, reason, and signed audit receipt are present',
      'approve, reject, request-proof, merge, and split produce signed receipt stubs',
      'review decisions can generate Portal notifications without leaking evidence',
    ],
    privacyGates: [
      'case detail starts from redacted evidence only',
      'sensitive escalation requires role, scope, reason, and signed audit receipt',
    ],
    freeBoundary: [
      'case schema',
      'redacted case viewer',
      'decision receipt format',
      'reason codes',
    ],
    paidBoundary: [
      'managed human review',
      'case SLA',
      'organization-specific escalation policy',
      'advanced risk analyst operations',
    ],
    services: ['address-review-console', 'address-radar-signal', 'address-validation-service'],
    dependsOn: ['console-dashboard-maturity', 'portal-maturity'],
    implementationSlice: [
      'define review case schema and state transitions',
      'add review tab under Dashboard',
      'connect Portal disputes and Field conflicts to cases',
      'add signed decision receipt fixtures',
    ],
    completionDefinition: 'Ambiguous or risky address decisions can be reviewed, explained, disputed, and audited without default raw evidence exposure.',
  },
  {
    conceptId: 'field-handoff-app',
    label: 'Field Handoff App',
    stage: 'field-execution',
    order: 5,
    route: '/field',
    goal: 'Separate mobile/offline field execution from store-centered POS so drivers, pickup staff, and humanitarian teams can scan, prove, report, and sync safely.',
    mustAddScreens: [
      'scan task',
      'route stop detail',
      'recipient proof prompt',
      'reachability report',
      'offline queue',
      'high-risk mode',
      'sync conflict review',
      'handoff receipt',
    ],
    sharedComponents: [
      'FieldScanTask',
      'RouteStopDetail',
      'RecipientProofPrompt',
      'ReachabilityReportForm',
      'OfflineQueueStatus',
      'SyncConflictReview',
      'HighRiskHandoffMode',
      'HandoffReceiptPanel',
    ],
    stateContract: [
      'assigned',
      'arrived',
      'recipient_pending',
      'handoff_complete',
      'cannot_reach',
      'offline_pending_sync',
      'sync_conflict',
    ],
    testGates: [
      'offline handoff creates local receipt without registry dependency',
      'high-risk mode strips precise AGID from shared reports',
      'sync conflicts become review cases instead of overwriting local state',
      'recipient proof prompt supports passkey, AOID credential, NFC, or proof-code adapters without logging secrets',
    ],
    privacyGates: [
      'high-risk handoff uses AGID-S, short expiry, no address history, and coarse public receipt categories',
      'reachability reports use safe categories rather than exact private residence traces',
    ],
    freeBoundary: [
      'offline scan and receipt',
      'reachability report schema',
      'local used-state ledger',
      'recipient proof prompt',
    ],
    paidBoundary: [
      'managed fleet sync',
      'enterprise device administration',
      'SLA-backed route task distribution',
    ],
    services: ['agid-pos-terminal', 'address-radar-signal', 'address-portal'],
    dependsOn: ['review-console', 'settings-policy-center'],
    implementationSlice: [
      'create /field route with mobile-first shell',
      'reuse POS scan and receipt contracts',
      'add reachability report reason codes',
      'send sync conflicts to Review Console',
    ],
    completionDefinition: 'A field worker can complete or explain a handoff offline, then sync a privacy-safe receipt or review case later.',
  },
];

export const P0_SHARED_FOUNDATION = [
  'one policy schema for language, operation mode, high-risk defaults, provider adapters, device connectors, and registry behavior',
  'one redaction contract for raw address, raw AGID, raw AOID, AGID-S payload, evidence, proof secret, and recipient identity fields',
  'one review-case schema shared by Portal disputes, Dashboard queue, POS refusals, and Field sync conflicts',
  'one receipt model for Portal actions, Dashboard operations, Review decisions, and Field handoffs',
  'one free baseline for local/self-hosted operation, with paid boundaries only for managed infrastructure, SLA, human review, retention, proof compute, or fleet operations',
];

export const P0_CROSS_SURFACE_STATE_RULES = [
  'Settings policy changes are read-only inputs for Portal, Dashboard, Review, POS, Address Element, and Field surfaces.',
  'Portal disputes create review-case references; they do not expose raw user evidence to Dashboard by default.',
  'Dashboard summarizes Review and Field state, but Review owns case decisions.',
  'Review decisions can notify Portal and Field through redacted receipts.',
  'Field handoffs can complete offline; sync conflicts must become Review cases rather than silent overwrites.',
];

export const P0_CROSS_SURFACE_TEST_GATES = [
  'all shared payloads reject rawAddress, rawAgid, rawAoid, agidSPayload, proofSecret, privateKey, recipientName, and phone fields',
  'Mode 0 Local Only works for settings, Portal viewing, POS/Field local receipt, and basic dashboard self-hosted logs',
  'high-risk controls remain free and available in Settings, Portal, Review, and Field',
  'language policy propagates across Map, POS, Portal, Dashboard, Review, and Field labels',
  'every state transition that rejects, escalates, syncs, or completes creates a redacted receipt or review-case event',
];

export const P0_DO_NOT_DO = [
  'Do not create one giant admin screen that mixes user consent, operator logs, review evidence, and field execution.',
  'Do not require Ethereum, ZK, hosted registry, or paid services for basic local operation.',
  'Do not make revoke, delete, export, high-risk mode, local scan, local decrypt, or local receipt paid.',
  'Do not store raw address, raw AOID, raw AGID-S payload, proof witness, recipient identity, private key, or phone number in shared logs.',
  'Do not let Field sync conflicts overwrite earlier receipts without a Review case.',
];

export const P0_SEQUENCE_RATIONALE = [
  'Settings must come first because language, mode, provider, privacy, and high-risk policy are cross-cutting inputs.',
  'Portal comes second because user consent and revocation must be credible before more operator surfaces are added.',
  'Dashboard comes third because it is the operational shell that links logs, terminals, issuers, webhooks, and review queues.',
  'Review comes fourth because partial, rejected, disputed, and suspicious cases need explicit case state before field teams can safely sync conflicts.',
  'Field comes fifth because mobile/offline handoff can reuse POS contracts and Review escalation instead of inventing a parallel workflow.',
];

export function renderP0MaturityMermaid(): string {
  return [
    'flowchart LR',
    '  Settings["Settings and Policy Center"] --> Portal["Address Portal"]',
    '  Settings --> Dashboard["Address Console / Dashboard"]',
    '  Portal --> Review["Review Console"]',
    '  Dashboard --> Review',
    '  Review --> Field["Field Handoff App"]',
    '  Settings --> Field',
    '  Field --> ReviewConflict["Sync Conflict -> Review Case"]',
    '  Review --> PortalNotice["Redacted Portal Notice"]',
    '  classDef p0 fill:#ecfeff,stroke:#0891b2,color:#164e63;',
    '  classDef guard fill:#fff7ed,stroke:#ea580c,color:#7c2d12;',
    '  class Settings,Portal,Dashboard,Review,Field p0;',
    '  class ReviewConflict,PortalNotice guard;',
  ].join('\n');
}

export function getP0MaturityExecutionPlan(): P0MaturityExecutionPlan {
  return {
    version: P0_MATURITY_EXECUTION_PLAN_VERSION,
    principle: 'Mature the five P0 surfaces as one privacy-preserving operations system: Settings defines policy, Portal gives user control, Dashboard gives operator visibility, Review handles ambiguity, and Field executes offline handoff safely.',
    executionOrder: [...P0_MATURITY_IDS],
    surfaces: P0_MATURITY_SURFACES.map(surface => ({
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
    sharedFoundation: [...P0_SHARED_FOUNDATION],
    crossSurfaceStateRules: [...P0_CROSS_SURFACE_STATE_RULES],
    crossSurfaceTestGates: [...P0_CROSS_SURFACE_TEST_GATES],
    doNotDo: [...P0_DO_NOT_DO],
    sequenceRationale: [...P0_SEQUENCE_RATIONALE],
    mermaid: renderP0MaturityMermaid(),
  };
}

export function getP0MaturitySurface(conceptId: P0MaturityConceptId): P0MaturitySurface | undefined {
  return getP0MaturityExecutionPlan().surfaces.find(surface => surface.conceptId === conceptId);
}

export function validateP0MaturityExecutionPlan(
  plan = getP0MaturityExecutionPlan(),
): P0MaturityValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<P0MaturityConceptId>();

  if (plan.surfaces.length !== P0_MATURITY_IDS.length) {
    errors.push(`expected-${P0_MATURITY_IDS.length}-p0-surfaces:${plan.surfaces.length}`);
  }

  if (plan.executionOrder.join('|') !== P0_MATURITY_IDS.join('|')) {
    errors.push(`unexpected-p0-order:${plan.executionOrder.join(',')}`);
  }

  for (const surface of plan.surfaces) {
    if (seen.has(surface.conceptId)) errors.push(`duplicate-p0-surface:${surface.conceptId}`);
    seen.add(surface.conceptId);

    const concept = getUnbuiltAppConcept(surface.conceptId);
    if (!concept) {
      errors.push(`unknown-concept:${surface.conceptId}`);
      continue;
    }
    if (concept.priority !== 'P0') errors.push(`concept-not-p0:${surface.conceptId}`);
    if (concept.recommendedRoute !== surface.route) {
      errors.push(`route-mismatch:${surface.conceptId}:${surface.route}:${concept.recommendedRoute}`);
    }
    for (const service of surface.services) {
      if (!concept.services.includes(service)) {
        errors.push(`service-not-on-concept:${surface.conceptId}:${service}`);
      }
    }

    if (surface.mustAddScreens.length < 6) errors.push(`not-enough-screens:${surface.conceptId}`);
    if (surface.sharedComponents.length < 5) errors.push(`not-enough-components:${surface.conceptId}`);
    if (surface.stateContract.length < 5) errors.push(`not-enough-states:${surface.conceptId}`);
    if (surface.testGates.length < 4) errors.push(`not-enough-test-gates:${surface.conceptId}`);
    if (surface.privacyGates.length < 2) errors.push(`not-enough-privacy-gates:${surface.conceptId}`);
    if (!surface.freeBoundary.length) errors.push(`missing-free-boundary:${surface.conceptId}`);
    if (!surface.paidBoundary.length) errors.push(`missing-paid-boundary:${surface.conceptId}`);
    if (!surface.completionDefinition.trim()) errors.push(`missing-completion-definition:${surface.conceptId}`);
  }

  for (const id of P0_MATURITY_IDS) {
    if (!seen.has(id)) errors.push(`missing-p0-surface:${id}`);
  }

  const settings = getP0MaturitySurface('settings-policy-center');
  const review = getP0MaturitySurface('review-console');
  const field = getP0MaturitySurface('field-handoff-app');
  if (settings?.order !== 1) errors.push('settings-must-be-first');
  if (!review?.dependsOn.includes('console-dashboard-maturity')) errors.push('review-must-depend-on-dashboard');
  if (!review?.dependsOn.includes('portal-maturity')) errors.push('review-must-depend-on-portal');
  if (!field?.dependsOn.includes('review-console')) errors.push('field-must-depend-on-review');

  const doNotDoText = plan.doNotDo.join(' ').toLowerCase();
  for (const phrase of ['raw address', 'paid services', 'local operation', 'sync conflicts']) {
    if (!doNotDoText.includes(phrase)) errors.push(`missing-do-not-do:${phrase}`);
  }

  const gates = plan.crossSurfaceTestGates.join(' ').toLowerCase();
  for (const phrase of ['mode 0', 'high-risk controls', 'language policy', 'redacted receipt']) {
    if (!gates.includes(phrase)) errors.push(`missing-cross-surface-test-gate:${phrase}`);
  }

  if (!plan.mermaid.startsWith('flowchart LR')) errors.push('missing-mermaid-flowchart');
  if (plan.sharedFoundation.length < 4) warnings.push('thin-shared-foundation');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
