import type { ServiceOfferingId } from './openCoreProductStrategy';
import {
  getUnbuiltAppConcept,
  type UnbuiltAppConceptId,
} from './unbuiltAppConcepts';

export const P1_MATURITY_EXECUTION_PLAN_VERSION = 'agid-p1-maturity-execution-plan-v1';

export const P1_MATURITY_IDS = [
  'evidence-vault',
  'developer-platform',
  'address-connect-admin',
  'carrier-label-settlement',
] as const satisfies readonly UnbuiltAppConceptId[];

export type P1MaturityConceptId = typeof P1_MATURITY_IDS[number];

export type P1MaturityStage =
  | 'evidence-control'
  | 'developer-experience'
  | 'organization-trust'
  | 'shipping-and-settlement';

export type P1MaturitySurface = {
  conceptId: P1MaturityConceptId;
  label: string;
  stage: P1MaturityStage;
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

export type P1MaturityExecutionPlan = {
  version: typeof P1_MATURITY_EXECUTION_PLAN_VERSION;
  principle: string;
  executionOrder: P1MaturityConceptId[];
  surfaces: P1MaturitySurface[];
  sharedFoundation: string[];
  crossSurfaceStateRules: string[];
  crossSurfaceTestGates: string[];
  doNotDo: string[];
  sequenceRationale: string[];
  mermaid: string;
};

export type P1MaturityValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export const P1_MATURITY_SURFACES: P1MaturitySurface[] = [
  {
    conceptId: 'evidence-vault',
    label: 'Address Evidence Vault',
    stage: 'evidence-control',
    order: 1,
    route: '/dashboard/evidence',
    goal: 'Make photos, PDFs, waybills, public bills, and other address evidence useful without turning them into a central raw-document database.',
    mustAddScreens: [
      'local upload and import',
      'OCR candidate review',
      'candidate-to-address comparison',
      'redaction editor',
      'encrypted evidence envelope detail',
      'retention and legal-hold policy',
      'evidence attachment picker',
      'review-case evidence view',
    ],
    sharedComponents: [
      'LocalEvidenceImporter',
      'OcrCandidateReview',
      'AddressCandidateDiff',
      'RedactionEditor',
      'EvidenceEnvelopePanel',
      'RetentionPolicyControls',
      'EvidenceAttachmentPicker',
    ],
    stateContract: [
      'local_only',
      'ocr_ready',
      'redaction_required',
      'redacted',
      'encrypted',
      'attached_to_case',
      'retention_expired',
      'legal_hold',
    ],
    testGates: [
      'document import does not call external OCR by default',
      'redaction is required before managed sync',
      'OCR candidates remain editable before address registration or review attachment',
      'evidence envelope exports commitments and redacted refs, not raw files',
    ],
    privacyGates: [
      'raw files stay local or encrypted unless explicit managed evidence consent exists',
      'evidence attached to Review starts redacted and requires scoped escalation for raw access',
    ],
    freeBoundary: [
      'local file import',
      'editable OCR candidates',
      'local redaction',
      'encrypted local evidence envelope',
      'local evidence attachment to self-hosted review cases',
    ],
    paidBoundary: [
      'managed OCR compute',
      'encrypted hosted storage',
      'legal hold',
      'retention policy operations',
    ],
    services: ['address-evidence-vault', 'address-validation-service'],
    dependsOn: ['review-console', 'settings-policy-center'],
    implementationSlice: [
      'define evidence envelope schema',
      'add local import and OCR candidate review hooks',
      'connect redacted evidence refs to Review Console',
      'add retention and managed-sync consent gates',
    ],
    completionDefinition: 'A user or reviewer can attach edited, redacted, encrypted address evidence to a case without default external upload or raw document leakage.',
  },
  {
    conceptId: 'developer-platform',
    label: 'Address Developer Platform',
    stage: 'developer-experience',
    order: 2,
    route: '/dashboard/developers',
    goal: 'Unify SDKs, OpenAPI, webhooks, test vectors, Address Element snippets, and launch checks into one developer workflow.',
    mustAddScreens: [
      'API key and environment overview',
      'OpenAPI explorer',
      'webhook debugger',
      'Address Element snippets',
      'test vectors and conformance',
      'launch center',
      'redaction simulator',
      'Mode 0 self-host quickstart',
    ],
    sharedComponents: [
      'DeveloperEnvironmentSwitcher',
      'OpenApiExplorer',
      'WebhookSignatureTester',
      'AddressElementSnippetBuilder',
      'TestVectorCatalog',
      'LaunchChecklist',
      'RedactionSimulator',
    ],
    stateContract: [
      'test_mode',
      'live_ready',
      'webhook_unverified',
      'webhook_verified',
      'launch_blocked',
      'launch_ready',
      'self_hosted',
    ],
    testGates: [
      'developer console stores redacted sample payloads only',
      'webhook fixture validates timestamp and signature',
      'launch checklist blocks missing privacy controls',
      'Address Element snippets do not emit AOID secret, AGID-S payload, proof code, or recipient secret',
    ],
    privacyGates: [
      'sample payloads are generated from fixtures and never from live private request bodies',
      'test, live, local, and high-risk environments are visibly separated',
    ],
    freeBoundary: [
      'OpenAPI explorer for self-hosted APIs',
      'SDK snippets',
      'test vectors',
      'webhook signature fixtures',
      'Mode 0 quickstart',
    ],
    paidBoundary: [
      'hosted API key operations',
      'enterprise support',
      'SLA-backed webhook delivery',
    ],
    services: ['agid-address-element', 'hosted-registry-api', 'address-console-dashboard'],
    dependsOn: ['console-dashboard-maturity', 'settings-policy-center'],
    implementationSlice: [
      'add developer tab under Dashboard',
      'expose SDK and Address Element snippets from static fixtures',
      'add webhook signature tester',
      'connect launch center to privacy and P0 maturity gates',
    ],
    completionDefinition: 'A developer can self-host or integrate AGID without reading scattered docs, and can verify redaction, webhook signatures, and launch readiness from one place.',
  },
  {
    conceptId: 'address-connect-admin',
    label: 'Address Connect Admin',
    stage: 'organization-trust',
    order: 3,
    route: '/dashboard/connect',
    goal: 'Provide organization-level onboarding for issuers, carriers, NGOs, municipalities, endpoints, scopes, trust status, revocation, and key rotation without handling personal address records.',
    mustAddScreens: [
      'organization onboarding',
      'issuer registration',
      'carrier endpoint discovery',
      'scope template editor',
      'trust registry',
      'revocation status',
      'webhook subscriptions',
      'key rotation and suspension',
    ],
    sharedComponents: [
      'OrganizationOnboardingForm',
      'IssuerRegistrationPanel',
      'CarrierEndpointDiscovery',
      'ScopeTemplateEditor',
      'TrustRegistryViewer',
      'RevocationStatusPanel',
      'KeyRotationTimeline',
    ],
    stateContract: [
      'draft',
      'pending_verification',
      'active',
      'suspended',
      'revoked',
      'rotation_required',
      'endpoint_degraded',
    ],
    testGates: [
      'personal address fields are rejected from Connect records',
      'issuer status transitions require signed audit events',
      'scope templates cannot grant unspecified raw-address access',
      'key rotation changes webhook, registry, and verifier trust status consistently',
    ],
    privacyGates: [
      'Connect records contain organization metadata, endpoints, public keys, scopes, and status only',
      'issuer, carrier, and NGO trust changes produce signed audit events',
    ],
    freeBoundary: [
      'self-hosted issuer and carrier metadata schema',
      'scope templates',
      'trust registry viewer',
      'revocation status viewer',
    ],
    paidBoundary: [
      'hosted organization onboarding',
      'managed trust operations',
      'enterprise endpoint monitoring',
    ],
    services: ['hosted-registry-api', 'address-console-dashboard', 'address-radar-signal'],
    dependsOn: ['developer-platform', 'console-dashboard-maturity'],
    implementationSlice: [
      'define organization and endpoint records',
      'add issuer/carrier onboarding screens',
      'bind scope templates to Address Access/Auth policies',
      'add signed key-rotation and suspension receipts',
    ],
    completionDefinition: 'An organization can become a trusted issuer/carrier/NGO endpoint with scoped permissions, key rotation, and revocation status, without storing personal addresses in Connect.',
  },
  {
    conceptId: 'carrier-label-settlement',
    label: 'Carrier Label and Settlement',
    stage: 'shipping-and-settlement',
    order: 4,
    route: '/carrier',
    goal: 'Separate shipping labels, waybill QR, carrier acceptance, prepaid/collect-on-delivery, customs assistance, and handoff receipts from the core POS screen.',
    mustAddScreens: [
      'LabelIntent creation',
      'address and carrier decision',
      'carrier acceptance',
      'address refusal policy',
      'prepaid and collect payment gate',
      'customs and HS assist',
      'waybill QR',
      'handoff report',
      'settlement and reconciliation status',
    ],
    sharedComponents: [
      'LabelIntentForm',
      'CarrierAcceptancePanel',
      'AddressRefusalPolicyPanel',
      'PaymentGateStatus',
      'CustomsAssistPanel',
      'WaybillQrPanel',
      'HandoffReportViewer',
      'SettlementStatusTimeline',
    ],
    stateContract: [
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
    testGates: [
      'LabelIntent cannot issue a label before address decision and carrier acceptance',
      'collect and prepaid status are separate from address proof',
      'public label event contains aliases, commitments, and receipt hashes only',
      'carrier refusal reasons are normalized and do not leak private evidence',
    ],
    privacyGates: [
      'waybill QR uses short aliases and commitments by default',
      'payment, customs, and carrier events do not expose full address in public logs',
    ],
    freeBoundary: [
      'LabelIntent state model',
      'waybill QR format',
      'local carrier acceptance simulator',
      'manual payment status record',
    ],
    paidBoundary: [
      'payment network fees',
      'carrier API pass-through',
      'escrow operations',
      'merchant reconciliation',
    ],
    services: ['payment-settlement-carrier-label-service', 'address-validation-service', 'agid-pos-terminal'],
    dependsOn: ['field-handoff-app', 'address-connect-admin', 'review-console'],
    implementationSlice: [
      'define LabelIntent and waybill QR contracts',
      'add carrier route or POS-linked carrier module',
      'connect carrier refusal to Review Console',
      'add payment status as a separate gate from address proof',
    ],
    completionDefinition: 'A merchant or carrier clerk can create a label, accept or refuse it, issue a privacy-safe waybill QR, and reconcile payment without exposing private address evidence.',
  },
];

export const P1_SHARED_FOUNDATION = [
  'one evidence envelope schema for local, redacted, encrypted, attached, retained, and expired evidence states',
  'one developer launch contract for OpenAPI, SDK snippets, webhook fixtures, test vectors, redaction simulation, and Mode 0 quickstart',
  'one organization trust record for issuer, carrier, NGO, municipality, endpoint, public key, scope template, and status',
  'one LabelIntent contract for address decision, carrier acceptance, waybill QR, payment gate, customs assist, and handoff receipt',
  'one rule that P1 commercializes only managed OCR, hosted API operations, trust operations, endpoint monitoring, payment/carrier pass-through, escrow, or reconciliation',
];

export const P1_CROSS_SURFACE_STATE_RULES = [
  'Evidence Vault feeds Review with redacted evidence references, not raw files.',
  'Developer Platform publishes the fixture, schema, and launch gates used by Address Connect Admin.',
  'Address Connect Admin owns organization trust state; it never stores personal address records.',
  'Carrier Label and Settlement consumes Field handoff receipts and Connect carrier status before issuing operational label state.',
  'Carrier refusal, evidence disputes, and payment/address conflicts route back to Review Console.',
];

export const P1_CROSS_SURFACE_TEST_GATES = [
  'managed sync cannot happen before evidence redaction and explicit consent',
  'developer samples and webhook fixtures cannot be generated from live private payloads',
  'Connect records reject personal address, AOID secret, proof witness, phone, and recipient identity fields',
  'LabelIntent cannot reach label_issued before address decision and carrier acceptance',
  'payment status cannot be treated as address proof or recipient proof',
];

export const P1_DO_NOT_DO = [
  'Do not make OCR import automatically upload documents to a managed service.',
  'Do not let Developer Platform examples contain real private payloads.',
  'Do not use Address Connect Admin as a personal address directory.',
  'Do not let carrier label events publish full addresses, raw AGID-S payloads, proof codes, or private evidence.',
  'Do not merge payment success with address validity or recipient ownership.',
];

export const P1_SEQUENCE_RATIONALE = [
  'Evidence Vault comes first because Review Console needs safe evidence before human decisions mature.',
  'Developer Platform comes second because APIs, fixtures, webhooks, and launch checks must be stable before onboarding organizations.',
  'Address Connect Admin comes third because issuer/carrier trust depends on the Developer Platform schemas and Dashboard operations.',
  'Carrier Label and Settlement comes fourth because it relies on Field handoff, Connect carrier status, Review escalation, and the existing POS contracts.',
];

export function renderP1MaturityMermaid(): string {
  return [
    'flowchart LR',
    '  Review["Review Console"] --> Evidence["Address Evidence Vault"]',
    '  Dashboard["Address Console / Dashboard"] --> Developer["Address Developer Platform"]',
    '  Developer --> Connect["Address Connect Admin"]',
    '  Field["Field Handoff App"] --> Carrier["Carrier Label and Settlement"]',
    '  Connect --> Carrier',
    '  Evidence --> Review',
    '  Carrier --> ReviewConflict["Carrier Refusal / Conflict -> Review Case"]',
    '  classDef p1 fill:#f0fdf4,stroke:#16a34a,color:#14532d;',
    '  classDef dependency fill:#eff6ff,stroke:#2563eb,color:#1e3a8a;',
    '  class Evidence,Developer,Connect,Carrier p1;',
    '  class Review,Dashboard,Field,ReviewConflict dependency;',
  ].join('\n');
}

export function getP1MaturityExecutionPlan(): P1MaturityExecutionPlan {
  return {
    version: P1_MATURITY_EXECUTION_PLAN_VERSION,
    principle: 'Mature the four P1 surfaces as the extension layer above P0: Evidence makes Review safe, Developer makes integration repeatable, Connect makes organization trust governable, and Carrier makes labels and settlement operational.',
    executionOrder: [...P1_MATURITY_IDS],
    surfaces: P1_MATURITY_SURFACES.map(surface => ({
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
    sharedFoundation: [...P1_SHARED_FOUNDATION],
    crossSurfaceStateRules: [...P1_CROSS_SURFACE_STATE_RULES],
    crossSurfaceTestGates: [...P1_CROSS_SURFACE_TEST_GATES],
    doNotDo: [...P1_DO_NOT_DO],
    sequenceRationale: [...P1_SEQUENCE_RATIONALE],
    mermaid: renderP1MaturityMermaid(),
  };
}

export function getP1MaturitySurface(conceptId: P1MaturityConceptId): P1MaturitySurface | undefined {
  return getP1MaturityExecutionPlan().surfaces.find(surface => surface.conceptId === conceptId);
}

export function validateP1MaturityExecutionPlan(
  plan = getP1MaturityExecutionPlan(),
): P1MaturityValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<P1MaturityConceptId>();

  if (plan.surfaces.length !== P1_MATURITY_IDS.length) {
    errors.push(`expected-${P1_MATURITY_IDS.length}-p1-surfaces:${plan.surfaces.length}`);
  }
  if (plan.executionOrder.join('|') !== P1_MATURITY_IDS.join('|')) {
    errors.push(`unexpected-p1-order:${plan.executionOrder.join(',')}`);
  }

  for (const surface of plan.surfaces) {
    if (seen.has(surface.conceptId)) errors.push(`duplicate-p1-surface:${surface.conceptId}`);
    seen.add(surface.conceptId);

    const concept = getUnbuiltAppConcept(surface.conceptId);
    if (!concept) {
      errors.push(`unknown-concept:${surface.conceptId}`);
      continue;
    }
    if (concept.priority !== 'P1') errors.push(`concept-not-p1:${surface.conceptId}`);
    if (concept.recommendedRoute !== surface.route) {
      errors.push(`route-mismatch:${surface.conceptId}:${surface.route}:${concept.recommendedRoute}`);
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

    if (surface.mustAddScreens.length < 7) errors.push(`not-enough-screens:${surface.conceptId}`);
    if (surface.sharedComponents.length < 7) errors.push(`not-enough-components:${surface.conceptId}`);
    if (surface.stateContract.length < 6) errors.push(`not-enough-states:${surface.conceptId}`);
    if (surface.testGates.length < 4) errors.push(`not-enough-test-gates:${surface.conceptId}`);
    if (surface.privacyGates.length < 2) errors.push(`not-enough-privacy-gates:${surface.conceptId}`);
    if (!surface.freeBoundary.length) errors.push(`missing-free-boundary:${surface.conceptId}`);
    if (!surface.paidBoundary.length) errors.push(`missing-paid-boundary:${surface.conceptId}`);
    if (!surface.completionDefinition.trim()) errors.push(`missing-completion-definition:${surface.conceptId}`);
  }

  for (const id of P1_MATURITY_IDS) {
    if (!seen.has(id)) errors.push(`missing-p1-surface:${id}`);
  }

  const evidence = getP1MaturitySurface('evidence-vault');
  const developer = getP1MaturitySurface('developer-platform');
  const connect = getP1MaturitySurface('address-connect-admin');
  const carrier = getP1MaturitySurface('carrier-label-settlement');
  if (!evidence?.dependsOn.includes('review-console')) errors.push('evidence-must-depend-on-review');
  if (!developer?.dependsOn.includes('console-dashboard-maturity')) errors.push('developer-must-depend-on-dashboard');
  if (!connect?.dependsOn.includes('developer-platform')) errors.push('connect-must-depend-on-developer-platform');
  if (!carrier?.dependsOn.includes('field-handoff-app')) errors.push('carrier-must-depend-on-field');
  if (!carrier?.dependsOn.includes('address-connect-admin')) errors.push('carrier-must-depend-on-connect');

  const doNotDoText = plan.doNotDo.join(' ').toLowerCase();
  for (const phrase of ['automatically upload', 'real private payloads', 'personal address directory', 'payment success']) {
    if (!doNotDoText.includes(phrase)) errors.push(`missing-do-not-do:${phrase}`);
  }

  const gates = plan.crossSurfaceTestGates.join(' ').toLowerCase();
  for (const phrase of ['evidence redaction', 'developer samples', 'connect records', 'labelintent']) {
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
