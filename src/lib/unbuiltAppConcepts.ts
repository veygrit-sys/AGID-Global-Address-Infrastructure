import type { AppPartitionId, ServiceOfferingId } from './openCoreProductStrategy';

export const UNBUILT_APP_CONCEPTS_VERSION = 'agid-unbuilt-app-concepts-v1';

export type UnbuiltAppConceptId =
  | 'portal-maturity'
  | 'console-dashboard-maturity'
  | 'review-console'
  | 'evidence-vault'
  | 'developer-platform'
  | 'address-connect-admin'
  | 'field-handoff-app'
  | 'carrier-label-settlement'
  | 'drone-locker-ops'
  | 'settings-policy-center';

export type UnbuiltAppStatus =
  | 'partial-needs-maturity'
  | 'planned-not-started'
  | 'future-candidate';

export type UnbuiltAppShape =
  | 'mature-existing-route'
  | 'dashboard-module'
  | 'separate-app'
  | 'service-api'
  | 'embedded-or-sdk-module';

export type UnbuiltAppPriority = 'P0' | 'P1' | 'P2';

export type UnbuiltAppSourceBoundary =
  | 'open-source-reference'
  | 'open-source-core'
  | 'commercial-hosted-extension'
  | 'commercial-enterprise-extension'
  | 'mixed-open-core';

export type UnbuiltAppConcept = {
  id: UnbuiltAppConceptId;
  label: string;
  status: UnbuiltAppStatus;
  priority: UnbuiltAppPriority;
  shape: UnbuiltAppShape;
  recommendedRoute: string;
  ownedByApp: AppPartitionId | 'field-operations-app' | 'drone-locker-operations-app';
  services: ServiceOfferingId[];
  audience: string[];
  problem: string;
  coreScreens: string[];
  stateModel: string[];
  openSourceBaseline: string[];
  paidOnlyWhen: string[];
  privacyRules: string[];
  firstMilestone: string;
  testsToAdd: string[];
  dependencies: UnbuiltAppConceptId[];
};

export type UnbuiltAppSummary = {
  version: typeof UNBUILT_APP_CONCEPTS_VERSION;
  total: number;
  partial: number;
  planned: number;
  future: number;
  p0: number;
  separateApps: number;
  dashboardModules: number;
  openSourceFirst: number;
  commercialExtension: number;
};

export type UnbuiltAppValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const PRIORITY_RANK: Record<UnbuiltAppPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
};

export const UNBUILT_APP_CONCEPTS: UnbuiltAppConcept[] = [
  {
    id: 'portal-maturity',
    label: 'Address Portal maturity pass',
    status: 'partial-needs-maturity',
    priority: 'P0',
    shape: 'mature-existing-route',
    recommendedRoute: '/portal',
    ownedByApp: 'address-portal-app',
    services: ['address-portal'],
    audience: ['residents', 'recipients', 'aid recipients', 'business users'],
    problem: 'The Portal exists, but needs a full consent lifecycle rather than only a safe connection list.',
    coreScreens: [
      'connection list',
      'connection detail',
      'scope timeline',
      'revoke confirmation',
      'delete/export request',
      'high-risk connection review',
    ],
    stateModel: [
      'active',
      'requires_reverification',
      'revoked',
      'delete_requested',
      'export_ready',
      'disputed',
    ],
    openSourceBaseline: [
      'local/self-hosted consent view',
      'free revoke/delete/export',
      'safe Address Item display',
      'scope and purpose visibility',
    ],
    paidOnlyWhen: [
      'hosted account operations',
      'enterprise deletion workflow automation',
      'managed notification delivery',
    ],
    privacyRules: [
      'Do not display raw address, raw AGID, raw AOID, recipient name, phone number, or proof secret.',
      'Use aliases, credential refs, scopes, and revocation status in the UI.',
    ],
    firstMilestone: 'Add Portal detail states for scope history, revoke, delete, export, and dispute.',
    testsToAdd: [
      'portal route renders every connection state',
      'revoke/delete/export are never paywalled',
      'portal payload rejects raw address fields',
    ],
    dependencies: [],
  },
  {
    id: 'console-dashboard-maturity',
    label: 'Address Console / Dashboard maturity pass',
    status: 'partial-needs-maturity',
    priority: 'P0',
    shape: 'mature-existing-route',
    recommendedRoute: '/dashboard',
    ownedByApp: 'address-console-app',
    services: ['address-console-dashboard', 'hosted-registry-api', 'address-radar-signal'],
    audience: ['operator admins', 'issuer admins', 'carrier admins', 'NGO admins'],
    problem: 'The dashboard summarizes operations but still lacks drill-down workspaces for concrete action.',
    coreScreens: [
      'overview',
      'API logs',
      'webhook debugger',
      'issuer registry',
      'terminal fleet',
      'QR usage',
      'launch readiness',
      'privacy guardrail status',
    ],
    stateModel: [
      'ready',
      'attention',
      'blocked',
      'degraded',
      'syncing',
      'incident_open',
    ],
    openSourceBaseline: [
      'self-hosted redacted event viewer',
      'webhook signature examples',
      'launch checklist schema',
      'terminal overview',
    ],
    paidOnlyWhen: [
      'multi-tenant hosted dashboard',
      'SLA monitoring',
      'long-term log retention',
      'organization RBAC operations',
    ],
    privacyRules: [
      'Dashboard data must be metrics, references, commitments, roots, nullifiers, status, and redacted evidence refs only.',
      'Reject request bodies containing raw address, AGID-S payloads, proof codes, private keys, or recipient identifiers.',
    ],
    firstMilestone: 'Split the dashboard into tabs for logs, webhooks, issuers, terminals, review, disputes, QR usage, and launch readiness.',
    testsToAdd: [
      'dashboard tabs expose no raw address columns',
      'webhook debugger validates signatures without storing bodies',
      'launch checklist fails if privacy gates are missing',
    ],
    dependencies: [],
  },
  {
    id: 'review-console',
    label: 'Address Review Console',
    status: 'partial-needs-maturity',
    priority: 'P0',
    shape: 'dashboard-module',
    recommendedRoute: '/dashboard/review',
    ownedByApp: 'address-console-app',
    services: ['address-review-console', 'address-radar-signal', 'address-validation-service'],
    audience: ['reviewers', 'supervisors', 'carrier admins', 'public-sector admins'],
    problem: 'Partial, rejected, conflicted, or suspicious address cases need a real case-management surface.',
    coreScreens: [
      'case queue',
      'case detail',
      'evidence timeline',
      'redaction view',
      'decision receipt',
      'dispute and appeal',
    ],
    stateModel: [
      'needs_review',
      'waiting_for_correction',
      'waiting_for_recipient_proof',
      'approved',
      'rejected',
      'escalated',
      'disputed',
    ],
    openSourceBaseline: [
      'case schema',
      'redacted case viewer',
      'manual decision receipt format',
      'explainable reason codes',
    ],
    paidOnlyWhen: [
      'managed human review',
      'case SLA',
      'organization-specific escalation policy',
      'advanced risk analyst operations',
    ],
    privacyRules: [
      'Start every case from redacted evidence.',
      'Sensitive escalation requires role, scope, reason, and signed audit receipt.',
    ],
    firstMilestone: 'Build the dashboard review module with queue, detail, action buttons, and signed reviewer receipt.',
    testsToAdd: [
      'review action state machine cannot skip audit reason',
      'raw evidence is hidden until scoped escalation',
      'reject/request-proof/approve produce signed receipt stubs',
    ],
    dependencies: ['console-dashboard-maturity'],
  },
  {
    id: 'evidence-vault',
    label: 'Address Evidence Vault',
    status: 'partial-needs-maturity',
    priority: 'P1',
    shape: 'dashboard-module',
    recommendedRoute: '/dashboard/evidence',
    ownedByApp: 'address-console-app',
    services: ['address-evidence-vault', 'address-validation-service'],
    audience: ['recipients', 'reviewers', 'enterprise admins'],
    problem: 'Photos and PDFs can assist registration, but need a local-first, redaction-first evidence workflow.',
    coreScreens: [
      'upload/import',
      'OCR candidate review',
      'redaction editor',
      'encrypted envelope details',
      'retention policy',
      'evidence attachment picker',
    ],
    stateModel: [
      'local_only',
      'ocr_ready',
      'redaction_required',
      'redacted',
      'encrypted',
      'attached_to_case',
      'retention_expired',
    ],
    openSourceBaseline: [
      'local file import',
      'editable OCR candidates',
      'local redaction workflow',
      'encrypted evidence envelope format',
    ],
    paidOnlyWhen: [
      'managed OCR compute',
      'encrypted hosted storage',
      'legal hold',
      'retention policy operations',
    ],
    privacyRules: [
      'No automatic external OCR upload.',
      'Evidence is local/encrypted by default and redacted before sync.',
    ],
    firstMilestone: 'Add Evidence Vault UI to registration and review with preview, redaction, and candidate comparison.',
    testsToAdd: [
      'document import does not call external service by default',
      'redaction required before managed sync',
      'OCR candidates remain editable before registration',
    ],
    dependencies: ['review-console'],
  },
  {
    id: 'developer-platform',
    label: 'Address Developer Platform',
    status: 'planned-not-started',
    priority: 'P1',
    shape: 'dashboard-module',
    recommendedRoute: '/dashboard/developers',
    ownedByApp: 'address-console-app',
    services: ['agid-address-element', 'hosted-registry-api', 'address-console-dashboard'],
    audience: ['developers', 'integration teams', 'EC operators', 'CMS operators'],
    problem: 'SDKs, OpenAPI, webhooks, test vectors, and launch checks exist as assets but not as one developer workflow.',
    coreScreens: [
      'API keys',
      'OpenAPI explorer',
      'webhook debugger',
      'Address Element snippets',
      'test vectors',
      'launch center',
      'redaction simulator',
    ],
    stateModel: [
      'test_mode',
      'live_ready',
      'webhook_unverified',
      'webhook_verified',
      'launch_blocked',
      'launch_ready',
    ],
    openSourceBaseline: [
      'OpenAPI explorer for self-hosted APIs',
      'SDK snippets',
      'test vectors',
      'webhook signature fixture',
    ],
    paidOnlyWhen: [
      'hosted API key operations',
      'enterprise support',
      'SLA-backed webhook delivery',
    ],
    privacyRules: [
      'Show request IDs and schema errors, not raw request bodies containing private address data.',
      'Separate test, live, local, and high-risk environments.',
    ],
    firstMilestone: 'Add Developer tab under Dashboard with API keys, webhook test, SDK snippets, and launch checklist.',
    testsToAdd: [
      'developer console stores redacted sample payloads only',
      'webhook fixture validates timestamp and signature',
      'launch checklist blocks missing privacy controls',
    ],
    dependencies: ['console-dashboard-maturity'],
  },
  {
    id: 'address-connect-admin',
    label: 'Address Connect Admin',
    status: 'planned-not-started',
    priority: 'P1',
    shape: 'dashboard-module',
    recommendedRoute: '/dashboard/connect',
    ownedByApp: 'address-console-app',
    services: ['hosted-registry-api', 'address-console-dashboard', 'address-radar-signal'],
    audience: ['issuer admins', 'carrier admins', 'municipality admins', 'NGO admins'],
    problem: 'Organizations, issuers, carriers, endpoints, scopes, and trust policy need a dedicated onboarding and governance workflow.',
    coreScreens: [
      'organization onboarding',
      'issuer registration',
      'carrier endpoint discovery',
      'scope templates',
      'trust registry',
      'revocation status',
      'webhook subscriptions',
    ],
    stateModel: [
      'draft',
      'pending_verification',
      'active',
      'suspended',
      'revoked',
      'rotation_required',
    ],
    openSourceBaseline: [
      'self-hosted issuer/carrier metadata schema',
      'scope templates',
      'trust registry viewer',
      'revocation status viewer',
    ],
    paidOnlyWhen: [
      'hosted organization onboarding',
      'managed trust operations',
      'enterprise endpoint monitoring',
    ],
    privacyRules: [
      'Use organization and endpoint metadata only; do not onboard personal addresses here.',
      'Key changes require signed audit events and clear rotation status.',
    ],
    firstMilestone: 'Create Connect admin module for issuer/carrier registration, scope templates, and endpoint health.',
    testsToAdd: [
      'personal address fields are rejected from Connect records',
      'issuer status transitions require audit event',
      'scope templates cannot grant unspecified raw-address access',
    ],
    dependencies: ['developer-platform'],
  },
  {
    id: 'field-handoff-app',
    label: 'Field Handoff App',
    status: 'planned-not-started',
    priority: 'P0',
    shape: 'separate-app',
    recommendedRoute: '/field',
    ownedByApp: 'field-operations-app',
    services: ['agid-pos-terminal', 'address-radar-signal', 'address-portal'],
    audience: ['drivers', 'field workers', 'NGO teams', 'pickup agents'],
    problem: 'The POS terminal is store-centered; drivers and humanitarian teams need a mobile/offline-first handoff and reachability app.',
    coreScreens: [
      'scan task',
      'route stop detail',
      'recipient proof',
      'reachability report',
      'offline queue',
      'high-risk mode',
      'sync conflict review',
    ],
    stateModel: [
      'assigned',
      'arrived',
      'recipient_pending',
      'handoff_complete',
      'cannot_reach',
      'offline_pending_sync',
      'sync_conflict',
    ],
    openSourceBaseline: [
      'offline scan and receipt',
      'reachability report schema',
      'local used-state ledger',
      'recipient proof prompt',
    ],
    paidOnlyWhen: [
      'managed fleet sync',
      'enterprise device administration',
      'SLA-backed route task distribution',
    ],
    privacyRules: [
      'High-risk mode uses AGID-S, short expiry, no address history, and coarse location receipts.',
      'Reachability reports are shared as safe categories, not exact private residence traces.',
    ],
    firstMilestone: 'Build a separate field route with scan, recipient proof, reachability report, offline queue, and sync conflict states.',
    testsToAdd: [
      'offline handoff creates local receipt without registry dependency',
      'high-risk mode strips precise AGID from shared report',
      'sync conflicts become review cases instead of overwriting',
    ],
    dependencies: ['review-console'],
  },
  {
    id: 'carrier-label-settlement',
    label: 'Carrier Label and Settlement App',
    status: 'planned-not-started',
    priority: 'P1',
    shape: 'separate-app',
    recommendedRoute: '/carrier',
    ownedByApp: 'pos-terminal-app',
    services: ['payment-settlement-carrier-label-service', 'address-validation-service', 'agid-pos-terminal'],
    audience: ['merchants', 'carrier clerks', 'cross-border operators', 'warehouse staff'],
    problem: 'Waybill QR, carrier acceptance, prepaid/collect-on-delivery, customs support, and delivery proof need one shipping workflow.',
    coreScreens: [
      'LabelIntent creation',
      'carrier acceptance',
      'address refusal policy',
      'payment gate',
      'customs assist',
      'waybill QR',
      'handoff report',
    ],
    stateModel: [
      'requires_address',
      'validating',
      'carrier_review',
      'accepted',
      'label_issued',
      'payment_pending',
      'in_transit',
      'completed',
      'refused',
    ],
    openSourceBaseline: [
      'LabelIntent state model',
      'waybill QR format',
      'local carrier acceptance simulator',
      'manual payment status record',
    ],
    paidOnlyWhen: [
      'payment network fees',
      'carrier API pass-through',
      'escrow operations',
      'merchant reconciliation',
    ],
    privacyRules: [
      'QR uses short aliases and commitments; do not expose full address in public label events.',
      'Carrier refusal reasons are normalized without leaking private evidence.',
    ],
    firstMilestone: 'Add a carrier label route or POS module for LabelIntent, waybill QR, carrier acceptance, and payment status.',
    testsToAdd: [
      'LabelIntent cannot issue label before address decision',
      'collect/prepaid status is separate from address proof',
      'public label event contains aliases and commitments only',
    ],
    dependencies: ['field-handoff-app'],
  },
  {
    id: 'drone-locker-ops',
    label: 'Drone Delivery Evidence and Reachability API',
    status: 'future-candidate',
    priority: 'P2',
    shape: 'service-api',
    recommendedRoute: '/api/drone-delivery-evidence',
    ownedByApp: 'drone-locker-operations-app',
    services: ['agid-pos-terminal', 'address-validation-service', 'address-radar-signal'],
    audience: ['drone operators', 'carrier operations teams', 'field handoff teams', 'review console operators'],
    problem: 'Drone operations need privacy-safe delivery evidence and cannot-reach reporting, but AGID should not become a drone OS, autopilot, or fleet-control product.',
    coreScreens: [
      'capabilities endpoint',
      'reachability report endpoint',
      'public projection preview',
      'restricted operator receipt',
      'cannot-reach reason picker',
      'review queue handoff',
    ],
    stateModel: [
      'attempted',
      'completed',
      'cannot-reach',
      'held-for-review',
      'reported',
      'confirmed',
      'restricted',
    ],
    openSourceBaseline: [
      'drone delivery evidence API schema',
      'delivery reachability report schema',
      'public/restricted projection model',
      'cannot-reach reason codes',
    ],
    paidOnlyWhen: [
      'managed evidence retention',
      'certified operator integrations',
      'carrier/PUDO/drone network support',
    ],
    privacyRules: [
      'Public drone evidence must not include raw AGID-S payloads, raw address, precise coordinates, raw telemetry, or recipient secrets.',
      'Drone routes for high-risk deliveries use coarse public reporting and restricted operator receipts.',
    ],
    firstMilestone: 'Build the delivery evidence / reachability API first; keep Drone OS, autopilot, and fleet-control outside P2.',
    testsToAdd: [
      'drone evidence public projection blocks private payloads',
      'high-risk drone telemetry becomes restricted operator receipt',
      'cannot-reach report uses reason codes and coarse location by default',
    ],
    dependencies: ['field-handoff-app', 'carrier-label-settlement'],
  },
  {
    id: 'settings-policy-center',
    label: 'Settings and Policy Center',
    status: 'partial-needs-maturity',
    priority: 'P0',
    shape: 'embedded-or-sdk-module',
    recommendedRoute: '/settings',
    ownedByApp: 'map-registration-app',
    services: ['agid-resolver-service', 'address-validation-service', 'agid-pos-terminal'],
    audience: ['users', 'operators', 'admins', 'developers'],
    problem: 'Language, registry mode, privacy mode, providers, device connectors, and high-risk defaults are split across surfaces.',
    coreScreens: [
      'language and locale',
      'mode selector',
      'privacy and high-risk defaults',
      'provider adapters',
      'device connectors',
      'key references',
      'data-flow preview',
    ],
    stateModel: [
      'local_only',
      'server_registry',
      'zk_only',
      'ethereum_registry',
      'full_zk_ethereum',
      'provider_disabled',
      'provider_enabled',
    ],
    openSourceBaseline: [
      'shared settings model',
      'language propagation',
      'mode selection',
      'provider data-flow warning',
      'local device connector settings',
    ],
    paidOnlyWhen: [
      'managed provider credentials',
      'enterprise policy templates',
      'centralized device fleet policy',
    ],
    privacyRules: [
      'Every provider setting must state what leaves local mode.',
      'High-risk privacy controls are never paywalled.',
    ],
    firstMilestone: 'Create a shared settings model consumed by Map, POS, Portal, Element, and Dashboard.',
    testsToAdd: [
      'language setting propagates across app surfaces',
      'mode selector never requires paid service for local operation',
      'provider adapter displays data-flow warning before enabling',
    ],
    dependencies: [],
  },
];

export function getUnbuiltAppConcepts(): UnbuiltAppConcept[] {
  return UNBUILT_APP_CONCEPTS.map(concept => ({
    ...concept,
    services: [...concept.services],
    audience: [...concept.audience],
    coreScreens: [...concept.coreScreens],
    stateModel: [...concept.stateModel],
    openSourceBaseline: [...concept.openSourceBaseline],
    paidOnlyWhen: [...concept.paidOnlyWhen],
    privacyRules: [...concept.privacyRules],
    testsToAdd: [...concept.testsToAdd],
    dependencies: [...concept.dependencies],
  }));
}

export function summarizeUnbuiltAppConcepts(): UnbuiltAppSummary {
  const concepts = getUnbuiltAppConcepts();
  return {
    version: UNBUILT_APP_CONCEPTS_VERSION,
    total: concepts.length,
    partial: concepts.filter(concept => concept.status === 'partial-needs-maturity').length,
    planned: concepts.filter(concept => concept.status === 'planned-not-started').length,
    future: concepts.filter(concept => concept.status === 'future-candidate').length,
    p0: concepts.filter(concept => concept.priority === 'P0').length,
    separateApps: concepts.filter(concept => concept.shape === 'separate-app').length,
    dashboardModules: concepts.filter(concept => concept.shape === 'dashboard-module').length,
    openSourceFirst: concepts.filter(concept =>
      concept.openSourceBaseline.length > 0 &&
      concept.paidOnlyWhen.length > 0
    ).length,
    commercialExtension: concepts.filter(concept =>
      concept.paidOnlyWhen.some(item => /managed|hosted|SLA|fee|enterprise/i.test(item))
    ).length,
  };
}

export function getUnbuiltAppBuildOrder(): UnbuiltAppConcept[] {
  return getUnbuiltAppConcepts().sort((a, b) => {
    const priority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priority !== 0) return priority;
    return a.id.localeCompare(b.id);
  });
}

export function getUnbuiltAppConcept(id: UnbuiltAppConceptId): UnbuiltAppConcept | undefined {
  return getUnbuiltAppConcepts().find(concept => concept.id === id);
}

export function renderUnbuiltAppConceptsMermaid(): string {
  return [
    'flowchart LR',
    '  Settings["Settings and Policy Center"] --> Map["Map / Registration"]',
    '  Settings --> POS["POS Terminal"]',
    '  Settings --> Element["Address Element"]',
    '  Portal["Address Portal"] --> Console["Address Console"]',
    '  Console --> Review["Review Console"]',
    '  Review --> Evidence["Evidence Vault"]',
    '  Console --> Developer["Developer Platform"]',
    '  Developer --> Connect["Address Connect Admin"]',
    '  POS --> Field["Field Handoff App"]',
    '  Field --> Carrier["Carrier Label and Settlement"]',
    '  Field --> Devices["Drone Delivery Evidence and Reachability API"]',
    '  classDef p0 fill:#ecfeff,stroke:#0891b2,color:#164e63;',
    '  classDef admin fill:#eef2ff,stroke:#4f46e5,color:#312e81;',
    '  classDef future fill:#f8fafc,stroke:#64748b,color:#334155;',
    '  class Settings,Portal,POS,Field p0;',
    '  class Console,Review,Evidence,Developer,Connect,Carrier admin;',
    '  class Devices future;',
  ].join('\n');
}

export function validateUnbuiltAppConcepts(
  concepts = getUnbuiltAppConcepts(),
): UnbuiltAppValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<UnbuiltAppConceptId>();

  for (const concept of concepts) {
    if (ids.has(concept.id)) errors.push(`duplicate-concept:${concept.id}`);
    ids.add(concept.id);
    if (!concept.label.trim()) errors.push(`missing-label:${concept.id}`);
    if (!concept.problem.trim()) errors.push(`missing-problem:${concept.id}`);
    if (!concept.recommendedRoute.trim()) errors.push(`missing-route:${concept.id}`);
    if (concept.coreScreens.length < 4) errors.push(`not-enough-core-screens:${concept.id}`);
    if (concept.stateModel.length < 4) errors.push(`not-enough-state-model:${concept.id}`);
    if (!concept.openSourceBaseline.length) errors.push(`missing-open-source-baseline:${concept.id}`);
    if (!concept.paidOnlyWhen.length) errors.push(`missing-paid-exception-boundary:${concept.id}`);
    if (!concept.privacyRules.length) errors.push(`missing-privacy-rules:${concept.id}`);
    if (!concept.firstMilestone.trim()) errors.push(`missing-first-milestone:${concept.id}`);
    if (concept.testsToAdd.length < 2) errors.push(`not-enough-tests:${concept.id}`);
    if (concept.privacyRules.some(rule => /log raw address|store raw address|public raw address/i.test(rule))) {
      errors.push(`unsafe-privacy-rule:${concept.id}`);
    }
    if (concept.status === 'future-candidate' && concept.priority !== 'P2') {
      warnings.push(`future-candidate-not-p2:${concept.id}`);
    }
  }

  for (const concept of concepts) {
    for (const dependency of concept.dependencies) {
      if (!ids.has(dependency)) errors.push(`unknown-dependency:${concept.id}:${dependency}`);
    }
  }

  const p0 = concepts.filter(concept => concept.priority === 'P0');
  if (!p0.some(concept => concept.id === 'settings-policy-center')) {
    errors.push('missing-p0-settings-policy-center');
  }
  if (!p0.some(concept => concept.id === 'field-handoff-app')) {
    errors.push('missing-p0-field-handoff-app');
  }
  if (!concepts.some(concept => concept.recommendedRoute === '/dashboard/review')) {
    errors.push('missing-dashboard-review-route');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
