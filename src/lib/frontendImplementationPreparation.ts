import {
  getFrontendRelationships,
  getFrontendSurfaces,
  type FrontendCapabilityId,
  type FrontendEcosystemDependency,
  type FrontendRelationship,
  type FrontendSurface,
  type FrontendSurfaceId,
  type FrontendSurfaceStatus,
} from './frontendEcosystem';

export const FRONTEND_IMPLEMENTATION_PREPARATION_VERSION = 'agid-frontend-implementation-prep-v1';

export type FrontendImplementationPriority = 'P0' | 'P1' | 'P2';

export type FrontendImplementationStage =
  | 'ready-now'
  | 'needs-component-refactor'
  | 'needs-route-slot'
  | 'needs-design-pass'
  | 'implemented-with-follow-up';

export type FrontendCodeArtifactKind =
  | 'route'
  | 'screen'
  | 'component'
  | 'state-model'
  | 'event-contract'
  | 'adapter-boundary'
  | 'test'
  | 'documentation';

export type FrontendCodeArtifact = {
  kind: FrontendCodeArtifactKind;
  name: string;
  targetPath: string;
  reason: string;
};

export type FrontendProductShape =
  | 'same-app-surface'
  | 'separate-app'
  | 'embedded-component'
  | 'dashboard-module'
  | 'shared-engine-feature';

export type FrontendSourceBoundary =
  | 'open-source-core'
  | 'open-source-reference-app'
  | 'commercial-hosted-extension'
  | 'commercial-enterprise-extension'
  | 'private-deployment-option';

export type FrontendCommercialSplit = {
  productShape: FrontendProductShape;
  sourceBoundary: FrontendSourceBoundary;
  openSourceScope: string[];
  commercialScope: string[];
  separationRationale: string;
  avoidInOpenCore: string[];
};

export type FrontendPrivacyGate = {
  id: string;
  rule: string;
  blocksRelease: boolean;
};

export type FrontendImplementationPackage = {
  version: typeof FRONTEND_IMPLEMENTATION_PREPARATION_VERSION;
  surfaceId: FrontendSurfaceId;
  label: string;
  priority: FrontendImplementationPriority;
  stage: FrontendImplementationStage;
  routeStrategy: 'reuse-existing-route' | 'add-route' | 'add-dashboard-tab' | 'embedded-only';
  recommendedRoute: string | null;
  ownerLayer: FrontendSurface['layer'];
  audience: string[];
  capabilities: FrontendCapabilityId[];
  dependencies: FrontendEcosystemDependency[];
  artifacts: FrontendCodeArtifact[];
  commercialSplit: FrontendCommercialSplit;
  privacyGates: FrontendPrivacyGate[];
  testPlan: string[];
  implementationOrder: string[];
  designNotes: string[];
  relatedRelationships: FrontendRelationship[];
};

export type FrontendImplementationRoadmap = {
  version: typeof FRONTEND_IMPLEMENTATION_PREPARATION_VERSION;
  packages: FrontendImplementationPackage[];
  firstImplementationSlice: FrontendImplementationPackage[];
  sharedContracts: string[];
  routeWork: Record<string, FrontendSurfaceId[]>;
  requiredTestSuites: string[];
  warnings: string[];
};

const PRIORITY_BY_SURFACE: Record<FrontendSurfaceId, FrontendImplementationPriority> = {
  'map-workspace': 'P0',
  'address-registration': 'P0',
  'agid-address-element': 'P0',
  'pos-terminal': 'P0',
  'address-portal': 'P1',
  'address-dashboard': 'P1',
  'address-review-console': 'P1',
  'developer-console': 'P2',
  'evidence-vault': 'P1',
  'settings-and-policy': 'P0',
};

const STAGE_BY_STATUS: Record<FrontendSurfaceStatus, FrontendImplementationStage> = {
  implemented: 'implemented-with-follow-up',
  partial: 'ready-now',
  planned: 'needs-route-slot',
};

const PRIORITY_RANK: Record<FrontendImplementationPriority, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
};

const STAGE_RANK: Record<FrontendImplementationStage, number> = {
  'ready-now': 0,
  'needs-component-refactor': 1,
  'needs-route-slot': 2,
  'needs-design-pass': 3,
  'implemented-with-follow-up': 4,
};

const COMMON_SHARED_CONTRACTS = [
  'AddressIntent state machine',
  'Address Element public event contract',
  'language and locale policy propagation',
  'privacy mode and high-risk mode policy',
  'safe payload boundary: no raw AGID/AOID/address in UI events',
  'review case and audit receipt references',
];

function cloneSurfaceList(value: string[]) {
  return [...value];
}

function routeStrategyFor(surface: FrontendSurface): FrontendImplementationPackage['routeStrategy'] {
  if (!surface.route) return 'embedded-only';
  if (surface.id === 'developer-console') return 'add-dashboard-tab';
  if (surface.id === 'address-review-console') return 'add-dashboard-tab';
  if (surface.status === 'planned') return 'add-route';
  return 'reuse-existing-route';
}

function stageFor(surface: FrontendSurface): FrontendImplementationStage {
  if (surface.id === 'pos-terminal') return 'needs-component-refactor';
  if (surface.id === 'map-workspace') return 'needs-component-refactor';
  if (surface.id === 'developer-console') return 'needs-route-slot';
  return STAGE_BY_STATUS[surface.status];
}

function commercialSplitFor(surface: FrontendSurface): FrontendCommercialSplit {
  const splits: Record<FrontendSurfaceId, FrontendCommercialSplit> = {
    'map-workspace': {
      productShape: 'same-app-surface',
      sourceBoundary: 'open-source-reference-app',
      openSourceScope: [
        'local AGID map workspace',
        'grid hover/click privacy behavior',
        'address display and language-tab baseline',
        'open resolver quality states',
      ],
      commercialScope: [
        'hosted high-volume resolver cache',
        'managed proprietary geocoder adapters',
        'enterprise SLA monitoring for map/resolver latency',
      ],
      separationRationale: 'The map is the public reference experience, while high-volume hosted data and proprietary adapters can remain optional.',
      avoidInOpenCore: [
        'mandatory paid geocoding calls',
        'tracking precise high-risk AGID selections',
      ],
    },
    'address-registration': {
      productShape: 'same-app-surface',
      sourceBoundary: 'open-source-reference-app',
      openSourceScope: [
        'postal-code and AGID assisted registration flow',
        'editable correction and feedback forms',
        'local-only learning consent boundary',
        'redaction-first evidence import contract',
      ],
      commercialScope: [
        'managed OCR processing',
        'human review operations',
        'enterprise evidence retention policy',
      ],
      separationRationale: 'Registration must be auditable in OSS, but managed evidence processing and review operations are service features.',
      avoidInOpenCore: [
        'automatic upload of documents to a vendor service',
        'global shared learning from private corrections without explicit consent',
      ],
    },
    'agid-address-element': {
      productShape: 'embedded-component',
      sourceBoundary: 'open-source-core',
      openSourceScope: [
        'embeddable Address Element UI',
        'public event contract',
        'privacy-safe payload schemas',
        'EC/CMS/POS/shopping-agent integration examples',
      ],
      commercialScope: [
        'hosted analytics and conversion dashboards',
        'managed anti-abuse tuning for large merchants',
        'premium support for enterprise checkout integrations',
      ],
      separationRationale: 'The embeddable element is the adoption wedge and should be fully inspectable by integrators.',
      avoidInOpenCore: [
        'vendor-locked checkout dependencies',
        'raw AOID or recipient proof exposure in host events',
      ],
    },
    'pos-terminal': {
      productShape: 'separate-app',
      sourceBoundary: 'open-source-reference-app',
      openSourceScope: [
        'basic POS scan-to-decision flow',
        'QR/NFC intake and local validation',
        'local device diagnostics',
        'local receipts and offline queue',
      ],
      commercialScope: [
        'managed fleet device administration',
        'printer/cash-drawer/electronic-measurement certification support',
        'SLA-backed registry sync and enterprise audit retention',
      ],
      separationRationale: 'POS should be deployable separately for stores and field sites, with basic operation open and managed fleet operations commercial.',
      avoidInOpenCore: [
        'hard dependency on a hosted registry',
        'device telemetry that includes raw address or AGID-S payloads',
      ],
    },
    'address-portal': {
      productShape: 'separate-app',
      sourceBoundary: 'open-source-reference-app',
      openSourceScope: [
        'user consent and scope management',
        'connection revoke/delete/export reference flows',
        'privacy-safe Address Item display',
      ],
      commercialScope: [
        'hosted user account management',
        'enterprise deletion workflow automation',
        'managed notification delivery',
      ],
      separationRationale: 'Users need an inspectable consent UI, while hosted account operations can be a service layer.',
      avoidInOpenCore: [
        'forced centralized account identity',
        'displaying raw address material in connection lists',
      ],
    },
    'address-dashboard': {
      productShape: 'dashboard-module',
      sourceBoundary: 'commercial-hosted-extension',
      openSourceScope: [
        'minimal local/admin reference dashboard',
        'redacted webhook and terminal event viewers',
        'launch checklist schema',
      ],
      commercialScope: [
        'hosted operations dashboard',
        'SLA monitoring and log retention',
        'multi-tenant issuer/carrier administration',
      ],
      separationRationale: 'The protocol needs a reference dashboard, but large-scale operations, retention, and tenant management are commercial surface area.',
      avoidInOpenCore: [
        'multi-tenant hosted secrets',
        'long-term raw operational logs',
      ],
    },
    'address-review-console': {
      productShape: 'dashboard-module',
      sourceBoundary: 'commercial-enterprise-extension',
      openSourceScope: [
        'review case data model',
        'redacted case viewer reference',
        'manual decision receipt format',
      ],
      commercialScope: [
        'managed reviewer queues',
        'advanced Address Radar risk scoring',
        'enterprise reviewer permissions and escalation SLAs',
      ],
      separationRationale: 'Review semantics should be open, but staffed review operations and advanced risk models are commercial.',
      avoidInOpenCore: [
        'opaque fraud scoring with no reason codes',
        'reviewer access to raw evidence without scope and audit reason',
      ],
    },
    'developer-console': {
      productShape: 'dashboard-module',
      sourceBoundary: 'commercial-hosted-extension',
      openSourceScope: [
        'OpenAPI explorer reference',
        'SDK snippets',
        'webhook signature examples',
        'redaction simulator',
      ],
      commercialScope: [
        'hosted API key lifecycle',
        'usage analytics and quota management',
        'team roles for production integrations',
      ],
      separationRationale: 'Developer experience should be documented and testable, while production API-key operations are hosted-service territory.',
      avoidInOpenCore: [
        'shipping real hosted keys in examples',
        'printing private request bodies in logs',
      ],
    },
    'evidence-vault': {
      productShape: 'shared-engine-feature',
      sourceBoundary: 'private-deployment-option',
      openSourceScope: [
        'evidence envelope format',
        'local OCR candidate review UI',
        'redaction workflow',
        'encrypted attachment references',
      ],
      commercialScope: [
        'managed encrypted evidence storage',
        'retention and legal hold workflows',
        'enterprise/private deployment OCR pipelines',
      ],
      separationRationale: 'Evidence handling is privacy-critical and should be local/private by default, with managed storage only under explicit deployment policy.',
      avoidInOpenCore: [
        'automatic external OCR upload',
        'unredacted evidence sync',
      ],
    },
    'settings-and-policy': {
      productShape: 'shared-engine-feature',
      sourceBoundary: 'open-source-core',
      openSourceScope: [
        'language setting and propagation policy',
        'Mode 0-4 selection',
        'provider data-flow warnings',
        'high-risk mode defaults',
      ],
      commercialScope: [
        'enterprise policy templates',
        'organization-wide managed configuration',
        'compliance evidence exports',
      ],
      separationRationale: 'Safety-critical policy switches must be open and testable because every app surface depends on them.',
      avoidInOpenCore: [
        'hidden provider enablement',
        'separate language settings that drift between POS, map, and embedded surfaces',
      ],
    },
  };

  return {
    ...splits[surface.id],
    openSourceScope: [...splits[surface.id].openSourceScope],
    commercialScope: [...splits[surface.id].commercialScope],
    avoidInOpenCore: [...splits[surface.id].avoidInOpenCore],
  };
}

function basePrivacyGates(surface: FrontendSurface): FrontendPrivacyGate[] {
  const gates: FrontendPrivacyGate[] = surface.privacyBoundary.map((rule, index) => ({
    id: `${surface.id}:privacy-boundary:${index + 1}`,
    rule,
    blocksRelease: true,
  }));

  if (surface.capabilities.includes('language-tabs')) {
    gates.push({
      id: `${surface.id}:language-propagation`,
      rule: 'Language changes must update labels, formatting, address rendering, and child surface state.',
      blocksRelease: true,
    });
  }
  if (surface.capabilities.includes('qr-nfc-scan')) {
    gates.push({
      id: `${surface.id}:qr-nfc-no-raw-payload-storage`,
      rule: 'QR/NFC scans may create commitments, aliases, or receipts, but must not persist raw payloads.',
      blocksRelease: true,
    });
  }
  if (surface.capabilities.includes('evidence-ocr')) {
    gates.push({
      id: `${surface.id}:evidence-edit-redact-before-submit`,
      rule: 'OCR output must be editable and redactable before any verification or sync action.',
      blocksRelease: true,
    });
  }
  if (surface.capabilities.includes('developer-onboarding')) {
    gates.push({
      id: `${surface.id}:developer-logs-redacted`,
      rule: 'Developer logs and snippets must expose request IDs, schemas, and aliases, not private payload bodies.',
      blocksRelease: true,
    });
  }

  return gates;
}

function artifactsFor(surface: FrontendSurface): FrontendCodeArtifact[] {
  const bySurface: Partial<Record<FrontendSurfaceId, FrontendCodeArtifact[]>> = {
    'map-workspace': [
      {
        kind: 'component',
        name: 'MapWorkspacePanels',
        targetPath: 'src/components/map/MapWorkspacePanels.tsx',
        reason: 'Separate map, address detail, registration, and resolver quality panels around one selected-cell state.',
      },
      {
        kind: 'state-model',
        name: 'SelectedAgidCellState',
        targetPath: 'src/lib/mapWorkspaceState.ts',
        reason: 'Keep hover highlight separate from clicked AGID disclosure and address rendering.',
      },
      {
        kind: 'test',
        name: 'MapWorkspace privacy and language tests',
        targetPath: 'src/components/map/MapWorkspacePanels.test.tsx',
        reason: 'Lock hover/click behavior and language-rendering propagation.',
      },
    ],
    'address-registration': [
      {
        kind: 'component',
        name: 'AddressRegistrationStepper',
        targetPath: 'src/components/address-registration/AddressRegistrationStepper.tsx',
        reason: 'Implement import/autofill, edit/correct, verify/intent-preview as explicit steps.',
      },
      {
        kind: 'component',
        name: 'EvidenceImportStep',
        targetPath: 'src/components/address-registration/EvidenceImportStep.tsx',
        reason: 'Expose photo/PDF import, OCR candidate review, redaction, and local learning consent.',
      },
      {
        kind: 'test',
        name: 'AddressRegistrationStepper tests',
        targetPath: 'src/components/address-registration/AddressRegistrationStepper.test.tsx',
        reason: 'Verify OCR candidates remain editable and raw corrections do not leave local state.',
      },
    ],
    'agid-address-element': [
      {
        kind: 'event-contract',
        name: 'AddressElementEventMap',
        targetPath: 'src/lib/addressElementEvents.ts',
        reason: 'Define onChange, onIntentReady, onNeedsReview, onQrNfcRequested, and onFeedback payloads.',
      },
      {
        kind: 'documentation',
        name: 'Address Element host integration examples',
        targetPath: 'docs/address-element-host-integration.md',
        reason: 'Prepare EC, CMS, POS, and shopping-agent embedding examples with privacy-safe events.',
      },
      {
        kind: 'test',
        name: 'AddressElement event privacy tests',
        targetPath: 'src/lib/addressElementEvents.test.ts',
        reason: 'Reject raw AOID, raw AGID-S, recipient secret, proof code, and phone fields in public events.',
      },
    ],
    'pos-terminal': [
      {
        kind: 'component',
        name: 'PosTaskLanes',
        targetPath: 'src/components/pos/PosTaskLanes.tsx',
        reason: 'Split POS into Intake, Decision, Handoff, Devices, Queue, Reports, and Settings lanes.',
      },
      {
        kind: 'state-model',
        name: 'PosTaskLaneState',
        targetPath: 'src/lib/posTaskLanes.ts',
        reason: 'Keep scan-to-decision state deterministic across language, device, and offline states.',
      },
      {
        kind: 'test',
        name: 'POS task lane tests',
        targetPath: 'src/components/pos/PosTaskLanes.test.tsx',
        reason: 'Verify stable navigation, large decision states, device diagnostics, and language propagation.',
      },
    ],
    'address-portal': [
      {
        kind: 'component',
        name: 'PortalConnectionDetail',
        targetPath: 'src/components/portal/PortalConnectionDetail.tsx',
        reason: 'Expose scopes, revocation state, deletion, and export without showing raw address material.',
      },
      {
        kind: 'test',
        name: 'Portal connection action tests',
        targetPath: 'src/components/portal/PortalConnectionDetail.test.tsx',
        reason: 'Ensure revoke/delete/export actions operate on safe references only.',
      },
    ],
    'address-dashboard': [
      {
        kind: 'component',
        name: 'DashboardOperationsTabs',
        targetPath: 'src/components/dashboard/DashboardOperationsTabs.tsx',
        reason: 'Group API logs, webhooks, terminals, issuers, review queue, and QR used-state into stable tabs.',
      },
      {
        kind: 'test',
        name: 'Dashboard tab privacy tests',
        targetPath: 'src/components/dashboard/DashboardOperationsTabs.test.tsx',
        reason: 'Keep dashboard inputs limited to metrics, references, commitments, and status metadata.',
      },
    ],
    'address-review-console': [
      {
        kind: 'screen',
        name: 'AddressReviewConsole',
        targetPath: 'src/components/review/AddressReviewConsole.tsx',
        reason: 'Create dedicated case management for needs-review, reject, disputes, QR reuse, and issuer revocation.',
      },
      {
        kind: 'state-model',
        name: 'ReviewCaseState',
        targetPath: 'src/lib/addressReviewCases.ts',
        reason: 'Model case status, evidence refs, reason codes, audit receipts, and manual decision actions.',
      },
      {
        kind: 'test',
        name: 'Review console tests',
        targetPath: 'src/components/review/AddressReviewConsole.test.tsx',
        reason: 'Verify encrypted evidence refs and commitment-only review case transitions.',
      },
    ],
    'developer-console': [
      {
        kind: 'screen',
        name: 'DeveloperConsoleTab',
        targetPath: 'src/components/dashboard/DeveloperConsoleTab.tsx',
        reason: 'Surface API keys, webhook logs, SDK snippets, launch checklist, and redaction simulator.',
      },
      {
        kind: 'adapter-boundary',
        name: 'FrontendProviderDataFlowPreview',
        targetPath: 'src/lib/frontendProviderDataFlow.ts',
        reason: 'Show what data leaves the device/server before enabling cloud, geocoder, OCR, Ethereum, or ZK adapters.',
      },
      {
        kind: 'test',
        name: 'Developer console launch checklist tests',
        targetPath: 'src/components/dashboard/DeveloperConsoleTab.test.tsx',
        reason: 'Require webhook signature, log redaction, API-key environment split, and high-risk mode review.',
      },
    ],
    'evidence-vault': [
      {
        kind: 'component',
        name: 'EvidenceVaultPanel',
        targetPath: 'src/components/evidence/EvidenceVaultPanel.tsx',
        reason: 'Provide preview, OCR candidates, redaction, accept/edit/reject, and encrypted attachment flow.',
      },
      {
        kind: 'test',
        name: 'Evidence Vault UI privacy tests',
        targetPath: 'src/components/evidence/EvidenceVaultPanel.test.tsx',
        reason: 'Ensure evidence bytes and OCR text are local/encrypted until explicit user action.',
      },
    ],
    'settings-and-policy': [
      {
        kind: 'screen',
        name: 'SettingsPolicyCenter',
        targetPath: 'src/components/settings/SettingsPolicyCenter.tsx',
        reason: 'Unify language, mode, provider, key, device, registry, and high-risk policy choices.',
      },
      {
        kind: 'state-model',
        name: 'FrontendPolicyState',
        targetPath: 'src/lib/frontendPolicyState.ts',
        reason: 'Provide one source of truth for mode 0-4, language, provider data-flow, and high-risk defaults.',
      },
      {
        kind: 'test',
        name: 'Settings Policy Center tests',
        targetPath: 'src/components/settings/SettingsPolicyCenter.test.tsx',
        reason: 'Verify language applies to map/POS/element and provider warnings appear before enablement.',
      },
    ],
  };

  return bySurface[surface.id] ?? [
    {
      kind: 'test',
      name: `${surface.label} regression tests`,
      targetPath: `src/components/${surface.id}/${surface.id}.test.tsx`,
      reason: 'Lock privacy, language, and workflow behavior before visual expansion.',
    },
  ];
}

function testPlanFor(surface: FrontendSurface): string[] {
  const tests = [
    'Run TypeScript compile with npm run lint.',
    'Add unit tests for privacy-safe event payloads and state transitions.',
  ];

  if (surface.capabilities.includes('language-tabs')) {
    tests.push('Verify app language changes visible labels and address rendering, not only menu text.');
  }
  if (surface.capabilities.includes('qr-nfc-scan')) {
    tests.push('Verify QR/NFC payloads are converted to commitments, receipts, or aliases before persistence.');
  }
  if (surface.capabilities.includes('address-quality-decision')) {
    tests.push('Verify internal quality scores map to actionable states rather than raw score disclosure.');
  }
  if (surface.capabilities.includes('review-and-dispute')) {
    tests.push('Verify review cases use encrypted evidence refs and commitment-only identifiers.');
  }
  if (surface.capabilities.includes('developer-onboarding')) {
    tests.push('Verify API snippets, webhook logs, and launch checklist never print raw private payloads.');
  }

  return tests;
}

function implementationOrderFor(surface: FrontendSurface): string[] {
  const first = [
    `Read ${surface.label} currentRefs and confirm no unrelated refactor is required.`,
    'Add or update the shared state/event contract before changing visible UI.',
    'Write privacy and language tests before broad visual changes.',
  ];

  if (surface.id === 'address-registration') {
    return [
      ...first,
      'Build the three-step registration stepper behind existing registration entry points.',
      'Wire OCR/import output into editable candidate state.',
      'Connect verification preview to AddressIntent without exposing raw feedback outside local state.',
    ];
  }
  if (surface.id === 'pos-terminal') {
    return [
      ...first,
      'Extract task lane metadata and stable navigation state.',
      'Move device diagnostics, queue, reports, and settings into persistent lane entries.',
      'Verify scan-to-decision, recipient proof, and handoff completion remain one primary workflow.',
    ];
  }
  if (surface.id === 'settings-and-policy') {
    return [
      ...first,
      'Create one policy state for language, mode 0-4, high-risk mode, and providers.',
      'Expose provider data-flow warnings before adapter enablement.',
      'Propagate language and privacy policy into Map, POS, Address Element, Portal, and Dashboard.',
    ];
  }
  if (surface.id === 'developer-console') {
    return [
      ...first,
      'Add a dashboard tab first instead of a separate route.',
      'Show API key environment split, webhook signature status, SDK snippets, and launch checklist.',
      'Add redaction simulator with blocked raw payload examples.',
    ];
  }

  return [
    ...first,
    'Implement the smallest reusable component slice first.',
    'Connect to the existing model layer and add regression tests.',
  ];
}

function designNotesFor(surface: FrontendSurface): string[] {
  const notes = [
    'Use operator-console density for admin/POS surfaces and clearer consumer permission language for Portal/Element.',
    'Avoid marketing hero patterns, decorative cards, hidden warnings, and tiny scan controls.',
  ];

  if (surface.id === 'pos-terminal') {
    notes.push('Keep Address OK, Carrier Scan OK, Recipient Pending, and Handoff Complete as large state blocks.');
  }
  if (surface.id === 'address-registration') {
    notes.push('Use a stepper layout so OCR, postal assist, AGID assist, correction, and verification do not compete.');
  }
  if (surface.id === 'settings-and-policy') {
    notes.push('Show one language setting and one mode setting, then surface data-flow warnings per adapter.');
  }
  if (surface.layer === 'developer-ui') {
    notes.push('Prefer code snippets, launch checklist, webhook event log, and redaction simulator over decorative dashboard charts.');
  }

  return notes;
}

export function buildFrontendImplementationPackage(
  surfaceId: FrontendSurfaceId | string,
): FrontendImplementationPackage | null {
  const surface = getFrontendSurfaces().find(item => item.id === surfaceId);
  if (!surface) return null;
  const relationships = getFrontendRelationships()
    .filter(edge => edge.from === surface.id || edge.to === surface.id);

  return {
    version: FRONTEND_IMPLEMENTATION_PREPARATION_VERSION,
    surfaceId: surface.id,
    label: surface.label,
    priority: PRIORITY_BY_SURFACE[surface.id],
    stage: stageFor(surface),
    routeStrategy: routeStrategyFor(surface),
    recommendedRoute: surface.route,
    ownerLayer: surface.layer,
    audience: cloneSurfaceList(surface.audience),
    capabilities: [...surface.capabilities],
    dependencies: [...surface.dependencies],
    artifacts: artifactsFor(surface),
    commercialSplit: commercialSplitFor(surface),
    privacyGates: basePrivacyGates(surface),
    testPlan: testPlanFor(surface),
    implementationOrder: implementationOrderFor(surface),
    designNotes: designNotesFor(surface),
    relatedRelationships: relationships.map(edge => ({ ...edge })),
  };
}

export function listFrontendImplementationPackages(): FrontendImplementationPackage[] {
  return getFrontendSurfaces()
    .map(surface => buildFrontendImplementationPackage(surface.id))
    .filter((item): item is FrontendImplementationPackage => Boolean(item));
}

export function buildFrontendImplementationRoadmap(
  focus?: FrontendSurfaceId[],
): FrontendImplementationRoadmap {
  const focusSet = focus?.length ? new Set(focus) : null;
  const packages = listFrontendImplementationPackages()
    .filter(pkg => !focusSet || focusSet.has(pkg.surfaceId))
    .sort((a, b) => {
      const priorityDelta = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (priorityDelta !== 0) return priorityDelta;
      const stageDelta = STAGE_RANK[a.stage] - STAGE_RANK[b.stage];
      if (stageDelta !== 0) return stageDelta;
      return a.surfaceId.localeCompare(b.surfaceId);
    });

  const routeWork: Record<string, FrontendSurfaceId[]> = {};
  for (const pkg of packages) {
    const route = pkg.recommendedRoute ?? '(embedded)';
    routeWork[route] = [...(routeWork[route] ?? []), pkg.surfaceId];
  }

  const requiredTestSuites = [...new Set(
    packages.flatMap(pkg => pkg.artifacts)
      .filter(artifact => artifact.kind === 'test')
      .map(artifact => artifact.targetPath),
  )].sort();

  const warnings = packages
    .filter(pkg => pkg.routeStrategy === 'add-route')
    .map(pkg => `route-slot-required:${pkg.surfaceId}`);

  return {
    version: FRONTEND_IMPLEMENTATION_PREPARATION_VERSION,
    packages,
    firstImplementationSlice: packages.slice(0, 5),
    sharedContracts: [...COMMON_SHARED_CONTRACTS],
    routeWork,
    requiredTestSuites,
    warnings,
  };
}

export function validateFrontendImplementationPackages(
  packages = listFrontendImplementationPackages(),
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const surfaceIds = new Set(getFrontendSurfaces().map(surface => surface.id));
  const packageIds = new Set<FrontendSurfaceId>();

  for (const pkg of packages) {
    packageIds.add(pkg.surfaceId);
    if (pkg.artifacts.length === 0) errors.push(`missing-artifacts:${pkg.surfaceId}`);
    if (pkg.commercialSplit.openSourceScope.length === 0) errors.push(`missing-oss-scope:${pkg.surfaceId}`);
    if (!pkg.commercialSplit.separationRationale.trim()) errors.push(`missing-commercial-rationale:${pkg.surfaceId}`);
    if (pkg.privacyGates.length === 0) errors.push(`missing-privacy-gates:${pkg.surfaceId}`);
    if (pkg.testPlan.length === 0) errors.push(`missing-test-plan:${pkg.surfaceId}`);
    if (pkg.implementationOrder.length === 0) errors.push(`missing-implementation-order:${pkg.surfaceId}`);
    if (pkg.priority === 'P0' && !pkg.testPlan.some(step => /privacy|payload|raw|quality/i.test(step))) {
      errors.push(`p0-without-privacy-test:${pkg.surfaceId}`);
    }
    if (pkg.routeStrategy === 'embedded-only' && pkg.recommendedRoute) {
      errors.push(`embedded-only-with-route:${pkg.surfaceId}`);
    }
    if (pkg.routeStrategy !== 'embedded-only' && !pkg.recommendedRoute) {
      warnings.push(`routed-surface-without-route:${pkg.surfaceId}`);
    }
  }

  for (const id of surfaceIds) {
    if (!packageIds.has(id)) errors.push(`missing-package:${id}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function renderFrontendImplementationMermaid(
  packages = buildFrontendImplementationRoadmap().firstImplementationSlice,
): string {
  const lines = [
    'flowchart LR',
    '  Research["Frontend Ecosystem Research"] --> Contracts["Shared contracts"]',
  ];

  packages.forEach((pkg, index) => {
    const node = `P${index}`;
    lines.push(`  Contracts --> ${node}["${pkg.priority} ${pkg.label}<br/>${pkg.stage}"]`);
    lines.push(`  ${node} --> Tests${index}["Tests and privacy gates"]`);
  });

  lines.push('  classDef p0 fill:#fee2e2,stroke:#dc2626,color:#7f1d1d;');
  lines.push('  classDef tests fill:#ecfeff,stroke:#0891b2,color:#164e63;');
  packages.forEach((pkg, index) => {
    if (pkg.priority === 'P0') lines.push(`  class P${index} p0;`);
    lines.push(`  class Tests${index} tests;`);
  });

  return lines.join('\n');
}
