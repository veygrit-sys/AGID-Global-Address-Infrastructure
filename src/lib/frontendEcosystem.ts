export const FRONTEND_ECOSYSTEM_MODEL_VERSION = 'agid-frontend-ecosystem-v1';

export type FrontendSurfaceStatus = 'implemented' | 'partial' | 'planned';

export type FrontendSurfaceId =
  | 'map-workspace'
  | 'address-registration'
  | 'agid-address-element'
  | 'pos-terminal'
  | 'address-portal'
  | 'address-dashboard'
  | 'address-review-console'
  | 'developer-console'
  | 'evidence-vault'
  | 'settings-and-policy';

export type FrontendCapabilityId =
  | 'search-and-resolve'
  | 'address-display'
  | 'language-tabs'
  | 'address-quality-decision'
  | 'address-intent'
  | 'qr-nfc-scan'
  | 'agid-s-decrypt'
  | 'recipient-proof'
  | 'carrier-handoff'
  | 'offline-sync'
  | 'registry-freshness'
  | 'staff-device-admin'
  | 'portal-consent'
  | 'review-and-dispute'
  | 'audit-report'
  | 'developer-onboarding'
  | 'evidence-ocr'
  | 'privacy-mode';

export type FrontendEcosystemLayer =
  | 'operator-ui'
  | 'user-consent-ui'
  | 'admin-ui'
  | 'embedded-ui'
  | 'developer-ui'
  | 'shared-engine';

export type FrontendEcosystemDependency =
  | 'address-intent'
  | 'address-element'
  | 'address-terminal'
  | 'address-portal'
  | 'address-dashboard'
  | 'address-radar'
  | 'address-identity'
  | 'address-resolver'
  | 'address-feedback'
  | 'pos-operational-controls'
  | 'address-evidence-vault'
  | 'address-launch-center';

export type FrontendSurface = {
  id: FrontendSurfaceId;
  label: string;
  route: string | null;
  status: FrontendSurfaceStatus;
  layer: FrontendEcosystemLayer;
  audience: string[];
  primaryGoal: string;
  capabilities: FrontendCapabilityId[];
  dependencies: FrontendEcosystemDependency[];
  privacyBoundary: string[];
  currentRefs: string[];
  gaps: string[];
  nextSteps: string[];
};

export type FrontendRelationship = {
  from: FrontendSurfaceId;
  to: FrontendSurfaceId;
  relation:
    | 'creates-intent'
    | 'opens-review'
    | 'shares-consent-state'
    | 'feeds-dashboard'
    | 'embeds'
    | 'uses-policy'
    | 'exports-evidence';
  label: string;
  sensitiveDataPolicy: 'none' | 'commitment-only' | 'encrypted-only' | 'ephemeral-plaintext';
};

export type FrontendEcosystemSummary = {
  version: typeof FRONTEND_ECOSYSTEM_MODEL_VERSION;
  surfaces: number;
  implemented: number;
  partial: number;
  planned: number;
  requiredRoutes: string[];
  privacyCriticalSurfaces: FrontendSurfaceId[];
  highestPriorityNextSteps: string[];
  capabilityCoverage: Record<FrontendCapabilityId, FrontendSurfaceId[]>;
};

export type FrontendEcosystemValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const SURFACES: FrontendSurface[] = [
  {
    id: 'map-workspace',
    label: 'AGID Map Workspace',
    route: '/',
    status: 'implemented',
    layer: 'operator-ui',
    audience: ['general users', 'address researchers', 'operators'],
    primaryGoal: 'Search, select, inspect, and display AGID cells and address candidates on the map.',
    capabilities: ['search-and-resolve', 'address-display', 'language-tabs', 'address-quality-decision', 'privacy-mode'],
    dependencies: ['address-resolver', 'address-feedback'],
    privacyBoundary: [
      'Do not reveal clicked AGID until explicit selection.',
      'Hover may show a pale cell highlight but should not publish the AGID value.',
      'Language tabs change rendering and not only labels.',
    ],
    currentRefs: [
      'src/App.tsx',
      'src/components/GridDetailPanel.tsx',
      'src/components/SearchSidebar.tsx',
      'src/components/AddressLanguageTabs.tsx',
      'src/lib/addressDisplay.ts',
      'src/lib/addressRendering.ts',
    ],
    gaps: [
      'Map, address detail, registration, and resolver quality are still dense in a single workspace.',
      'Address quality evidence needs a clearer visual hierarchy for partial and needs-review states.',
    ],
    nextSteps: [
      'Split map detail, address display, and registration into explicit workspace panels with a shared selected-cell state.',
    ],
  },
  {
    id: 'address-registration',
    label: 'Address Registration Flow',
    route: '/',
    status: 'partial',
    layer: 'operator-ui',
    audience: ['recipients', 'operators', 'field workers'],
    primaryGoal: 'Register or correct addresses with AGID, postal-code assistance, feedback, upload/OCR, and high-risk safety.',
    capabilities: [
      'address-display',
      'language-tabs',
      'address-quality-decision',
      'address-intent',
      'registry-freshness',
      'evidence-ocr',
      'privacy-mode',
    ],
    dependencies: ['address-intent', 'address-element', 'address-feedback', 'address-evidence-vault'],
    privacyBoundary: [
      'Raw corrections are local/private by default.',
      'Feedback learning must be closed or explicitly consented.',
      'Uploaded documents must be redacted, encrypted, and editable before submission.',
    ],
    currentRefs: [
      'src/components/AddressRegistration.tsx',
      'src/components/AddressFeedbackPanel.tsx',
      'src/lib/addressDocumentReading.ts',
      'src/lib/addressFeedbackLearning.ts',
      'src/lib/addressElement.ts',
    ],
    gaps: [
      'Document upload/OCR and final correction review need one clear stepper.',
      'The learning boundary should be visible before feedback is submitted.',
    ],
    nextSteps: [
      'Create a three-step registration flow: import/autofill, user correction, verification and intent preview.',
    ],
  },
  {
    id: 'agid-address-element',
    label: 'AGID Address Element',
    route: null,
    status: 'partial',
    layer: 'embedded-ui',
    audience: ['EC developers', 'CMS operators', 'shopping agents', 'checkout users'],
    primaryGoal: 'Embeddable address intake component for postal autocomplete, AGID assist, QR/NFC, language tabs, and internal quality.',
    capabilities: [
      'address-display',
      'language-tabs',
      'address-quality-decision',
      'address-intent',
      'qr-nfc-scan',
      'privacy-mode',
    ],
    dependencies: ['address-intent', 'address-element', 'address-feedback'],
    privacyBoundary: [
      'Public component API should not return raw AOID, raw AGID-S payload, proof code, or recipient secret.',
      'Quality score stays internal; expose only actionable states.',
    ],
    currentRefs: [
      'src/components/AgidAddressElement.tsx',
      'src/lib/addressElement.ts',
      'src/lib/addressLink.ts',
      'src/lib/addressIntent.ts',
    ],
    gaps: [
      'Needs stable host integration examples for EC, CMS, POS, and shopping-agent contexts.',
      'Needs a clear public event contract and privacy-safe payload schema.',
    ],
    nextSteps: [
      'Publish an Address Element event map: onChange, onIntentReady, onNeedsReview, onQrNfcRequested, onFeedback.',
    ],
  },
  {
    id: 'pos-terminal',
    label: 'AGID POS Terminal',
    route: '/pos',
    status: 'implemented',
    layer: 'operator-ui',
    audience: ['cashiers', 'pickup staff', 'delivery handoff operators', 'humanitarian field workers'],
    primaryGoal: 'Scan QR/NFC/AGID-S, decide release/review/reject, manage devices, handoff, receipt, offline sync, and language settings.',
    capabilities: [
      'qr-nfc-scan',
      'agid-s-decrypt',
      'recipient-proof',
      'carrier-handoff',
      'offline-sync',
      'registry-freshness',
      'staff-device-admin',
      'audit-report',
      'privacy-mode',
    ],
    dependencies: ['address-terminal', 'pos-operational-controls', 'address-radar', 'address-identity', 'address-intent'],
    privacyBoundary: [
      'Receipt stores commitments, device signatures, and state, not raw QR payloads.',
      'High-risk mode should prefer AGID-S, short expiry, immediate used-state, and no address history.',
      'Language setting must apply to main screen, side menu, and all POS sections.',
    ],
    currentRefs: [
      'src/components/PosAppScreen.tsx',
      'src/components/PosTerminalPanel.tsx',
      'src/components/pos/PosTerminalSections.tsx',
      'src/lib/addressTerminal.ts',
      'src/lib/posOperationalControls.ts',
      'src/lib/agidSecurePos.ts',
    ],
    gaps: [
      'Some POS sections still behave like a large console rather than a staged task flow.',
      'Device diagnostics, audit, printer, and drawer workflows should become persistent navigation sections.',
    ],
    nextSteps: [
      'Refactor POS into task lanes: Intake, Decision, Handoff, Devices, Queue, Reports, Settings.',
    ],
  },
  {
    id: 'address-portal',
    label: 'Address Portal',
    route: '/portal',
    status: 'implemented',
    layer: 'user-consent-ui',
    audience: ['recipients', 'residents', 'aid recipients', 'business users'],
    primaryGoal: 'Let users see, revoke, and export who can use which address scopes and credentials.',
    capabilities: ['portal-consent', 'registry-freshness', 'address-intent', 'privacy-mode'],
    dependencies: ['address-portal', 'address-identity'],
    privacyBoundary: [
      'Shows organizations, scopes, status, and safe credential references only.',
      'Does not show raw address, raw AGID, raw AOID, phone number, or recipient name.',
    ],
    currentRefs: [
      'src/components/AddressPortalScreen.tsx',
      'src/lib/addressPortal.ts',
      'src/lib/addressItem.ts',
      'src/lib/addressConsentEnvelope.ts',
    ],
    gaps: [
      'Needs a connection detail route with event history, active scopes, and deletion request state.',
      'Needs clearer relationship with Address Link and consent envelopes.',
    ],
    nextSteps: [
      'Add Portal detail states: active connection, revoke confirmation, delete request, safe export, and dispute.',
    ],
  },
  {
    id: 'address-dashboard',
    label: 'Address Dashboard',
    route: '/dashboard',
    status: 'implemented',
    layer: 'admin-ui',
    audience: ['operators', 'issuer admins', 'carrier admins', 'NGO admins'],
    primaryGoal: 'Aggregate API logs, webhooks, terminals, issuers, reviews, disputes, QR usage, and privacy-safe metrics.',
    capabilities: ['review-and-dispute', 'audit-report', 'registry-freshness', 'staff-device-admin', 'privacy-mode'],
    dependencies: ['address-dashboard', 'address-radar', 'address-terminal', 'address-launch-center'],
    privacyBoundary: [
      'Dashboard accepts operational metrics, commitments, references, and status metadata only.',
      'Reject raw address, raw AGID, raw AOID, recipient names, phone numbers, proof codes, and private keys upstream.',
    ],
    currentRefs: [
      'src/components/AddressDashboardScreen.tsx',
      'src/lib/addressOperations.ts',
      'src/lib/addressRadar.ts',
      'src/lib/addressSignal.ts',
      'src/lib/addressLaunchCenter.ts',
    ],
    gaps: [
      'Needs drill-down from dashboard sections to concrete review, terminal, webhook, and issuer pages.',
      'Needs an explicit launch readiness view for production rollout.',
    ],
    nextSteps: [
      'Create Dashboard subroutes or tabs for Logs, Webhooks, Terminals, Issuers, Review Queue, Disputes, QR Usage, and Launch Center.',
    ],
  },
  {
    id: 'address-review-console',
    label: 'Address Review Console',
    route: '/dashboard',
    status: 'partial',
    layer: 'admin-ui',
    audience: ['reviewers', 'supervisors', 'carrier admins', 'public-sector admins'],
    primaryGoal: 'Review partial, rejected, disputed, suspicious, or high-risk address and handoff cases.',
    capabilities: ['review-and-dispute', 'audit-report', 'address-quality-decision', 'recipient-proof', 'carrier-handoff'],
    dependencies: ['address-radar', 'address-dashboard', 'address-identity', 'address-intent'],
    privacyBoundary: [
      'Reviewer starts from redacted evidence and escalates to sensitive fields only by scope, reason, and audit trail.',
      'Reject/approve reasons should be explainable without exposing internal fraud scores to end users.',
    ],
    currentRefs: [
      'src/lib/posDesignReview.ts',
      'src/lib/addressRadar.ts',
      'src/lib/addressSignal.ts',
      'src/lib/privacyLeakageRoleVerification.ts',
    ],
    gaps: [
      'Review queue is mostly a model and dashboard summary, not a full case-management UI.',
      'Needs actions for approve, reject, request correction, request proof, merge/split, dispute, and export report.',
    ],
    nextSteps: [
      'Add a case detail screen with evidence timeline, allowed actions, privacy scope, and signed reviewer receipt.',
    ],
  },
  {
    id: 'developer-console',
    label: 'Developer Console',
    route: '/dashboard',
    status: 'planned',
    layer: 'developer-ui',
    audience: ['developers', 'integration teams', 'enterprise admins'],
    primaryGoal: 'Manage API keys, webhooks, SDK examples, Address Element configuration, launch checklist, and adapter health.',
    capabilities: ['developer-onboarding', 'registry-freshness', 'audit-report', 'privacy-mode'],
    dependencies: ['address-launch-center', 'address-dashboard'],
    privacyBoundary: [
      'Developer logs should show request IDs, event aliases, and schema validation, not request bodies with address data.',
      'API key screen must separate test, live, local, and high-risk environments.',
    ],
    currentRefs: [
      'src/lib/openApiSpec.ts',
      'src/lib/apiEndpoints.ts',
      'src/lib/addressLaunchCenter.ts',
      'docs/hosted-registry-api.md',
    ],
    gaps: [
      'No dedicated frontend yet for API keys, webhooks, or launch readiness.',
      'Address Element and POS integration snippets are not surfaced as an in-app workflow.',
    ],
    nextSteps: [
      'Build a Developer Console tab with API keys, webhook logs, launch checklist, SDK snippets, and redaction simulator.',
    ],
  },
  {
    id: 'evidence-vault',
    label: 'Address Evidence Vault',
    route: '/',
    status: 'partial',
    layer: 'shared-engine',
    audience: ['recipients', 'reviewers', 'enterprise admins'],
    primaryGoal: 'Import photos/PDFs, OCR address candidates, redact evidence, attach encrypted proof, and allow later editing.',
    capabilities: ['evidence-ocr', 'address-quality-decision', 'review-and-dispute', 'privacy-mode'],
    dependencies: ['address-evidence-vault', 'address-feedback', 'address-intent'],
    privacyBoundary: [
      'Evidence bytes are encrypted and local/private by default.',
      'OCR output becomes editable candidate data, not an irreversible registration.',
      'AI training requires explicit consent and closed/private learning policy.',
    ],
    currentRefs: [
      'src/lib/addressEvidenceVault.ts',
      'src/lib/addressDocumentReading.ts',
      'docs/address-evidence-vault.md',
    ],
    gaps: [
      'Evidence import is not yet a polished user-visible step in registration or review.',
      'Needs preview, redaction, accept/edit/reject, and consent controls.',
    ],
    nextSteps: [
      'Add Evidence Vault UI inside Address Registration and Review Console with OCR candidate comparison.',
    ],
  },
  {
    id: 'settings-and-policy',
    label: 'Settings and Policy Center',
    route: '/',
    status: 'partial',
    layer: 'shared-engine',
    audience: ['users', 'operators', 'admins'],
    primaryGoal: 'Centralize language, privacy mode, registry mode, device connectors, API adapters, keys, and high-risk policy.',
    capabilities: ['language-tabs', 'privacy-mode', 'staff-device-admin', 'registry-freshness', 'developer-onboarding'],
    dependencies: ['address-identity', 'address-terminal', 'address-launch-center'],
    privacyBoundary: [
      'Settings must make mode choice explicit: Local Only, Server Registry, ZK Only, Ethereum Registry, Full.',
      'Provider adapters remain optional and must show what data leaves the device/server.',
    ],
    currentRefs: [
      'src/components/SettingsPanel.tsx',
      'src/lib/privacyPolicy.ts',
      'src/lib/agidRegistryApi.ts',
      'src/lib/microsoftServiceIntegration.ts',
      'src/lib/googleServiceIntegration.ts',
      'src/lib/cloudDbIntegration.ts',
    ],
    gaps: [
      'Settings are split across map/POS/adapters rather than one policy center.',
      'Provider data-flow warnings should be visible before enabling a connector.',
    ],
    nextSteps: [
      'Create a Settings and Policy Center with language, modes, providers, keys, devices, and high-risk defaults.',
    ],
  },
];

const RELATIONSHIPS: FrontendRelationship[] = [
  {
    from: 'map-workspace',
    to: 'address-registration',
    relation: 'creates-intent',
    label: 'Selected AGID cell or search result can start registration.',
    sensitiveDataPolicy: 'ephemeral-plaintext',
  },
  {
    from: 'address-registration',
    to: 'agid-address-element',
    relation: 'embeds',
    label: 'Registration should use the same embeddable Address Element model as EC/CMS.',
    sensitiveDataPolicy: 'commitment-only',
  },
  {
    from: 'agid-address-element',
    to: 'pos-terminal',
    relation: 'creates-intent',
    label: 'Element can produce AddressIntent evidence consumed by POS or checkout flows.',
    sensitiveDataPolicy: 'commitment-only',
  },
  {
    from: 'pos-terminal',
    to: 'address-review-console',
    relation: 'opens-review',
    label: 'Rejected, partial, or high-risk handoffs become review cases.',
    sensitiveDataPolicy: 'commitment-only',
  },
  {
    from: 'address-review-console',
    to: 'address-dashboard',
    relation: 'feeds-dashboard',
    label: 'Review outcomes, disputes, and audit receipts roll up to dashboard metrics.',
    sensitiveDataPolicy: 'commitment-only',
  },
  {
    from: 'address-portal',
    to: 'address-dashboard',
    relation: 'shares-consent-state',
    label: 'Revocation and consent state are visible to administrators as redacted status.',
    sensitiveDataPolicy: 'commitment-only',
  },
  {
    from: 'evidence-vault',
    to: 'address-review-console',
    relation: 'exports-evidence',
    label: 'Encrypted evidence envelopes can be attached to review cases.',
    sensitiveDataPolicy: 'encrypted-only',
  },
  {
    from: 'settings-and-policy',
    to: 'pos-terminal',
    relation: 'uses-policy',
    label: 'POS inherits language, registry mode, high-risk mode, device, and key policy.',
    sensitiveDataPolicy: 'none',
  },
  {
    from: 'settings-and-policy',
    to: 'agid-address-element',
    relation: 'uses-policy',
    label: 'Embedded Address Element uses provider, privacy, and language policy.',
    sensitiveDataPolicy: 'none',
  },
  {
    from: 'developer-console',
    to: 'address-dashboard',
    relation: 'feeds-dashboard',
    label: 'API keys, webhook health, and launch checklist feed operational status.',
    sensitiveDataPolicy: 'commitment-only',
  },
];

const REQUIRED_FRONTEND_CAPABILITIES: FrontendCapabilityId[] = [
  'search-and-resolve',
  'address-display',
  'language-tabs',
  'address-quality-decision',
  'address-intent',
  'qr-nfc-scan',
  'registry-freshness',
  'portal-consent',
  'review-and-dispute',
  'audit-report',
  'privacy-mode',
];

export function getFrontendSurfaces(): FrontendSurface[] {
  return SURFACES.map(surface => ({
    ...surface,
    audience: [...surface.audience],
    capabilities: [...surface.capabilities],
    dependencies: [...surface.dependencies],
    privacyBoundary: [...surface.privacyBoundary],
    currentRefs: [...surface.currentRefs],
    gaps: [...surface.gaps],
    nextSteps: [...surface.nextSteps],
  }));
}

export function getFrontendRelationships(): FrontendRelationship[] {
  return RELATIONSHIPS.map(relationship => ({ ...relationship }));
}

export function summarizeFrontendEcosystem(): FrontendEcosystemSummary {
  const surfaces = getFrontendSurfaces();
  const capabilityCoverage = Object.fromEntries(
    REQUIRED_FRONTEND_CAPABILITIES.map(capability => [
      capability,
      surfaces.filter(surface => surface.capabilities.includes(capability)).map(surface => surface.id),
    ]),
  ) as Record<FrontendCapabilityId, FrontendSurfaceId[]>;

  return {
    version: FRONTEND_ECOSYSTEM_MODEL_VERSION,
    surfaces: surfaces.length,
    implemented: surfaces.filter(surface => surface.status === 'implemented').length,
    partial: surfaces.filter(surface => surface.status === 'partial').length,
    planned: surfaces.filter(surface => surface.status === 'planned').length,
    requiredRoutes: surfaces
      .map(surface => surface.route)
      .filter((route): route is string => Boolean(route))
      .filter((route, index, routes) => routes.indexOf(route) === index),
    privacyCriticalSurfaces: surfaces
      .filter(surface => surface.privacyBoundary.length > 0)
      .map(surface => surface.id),
    highestPriorityNextSteps: surfaces
      .map(surface => surface.nextSteps[0])
      .filter((step): step is string => Boolean(step))
      .slice(0, 10),
    capabilityCoverage,
  };
}

export function renderFrontendEcosystemMermaid(): string {
  return [
    'flowchart LR',
    '  Map["AGID Map Workspace"] --> Registration["Address Registration"]',
    '  Registration --> Element["AGID Address Element"]',
    '  Element --> Intent["AddressIntent"]',
    '  Intent --> POS["AGID POS Terminal"]',
    '  POS --> Review["Address Review Console"]',
    '  Review --> Dashboard["Address Dashboard"]',
    '  Portal["Address Portal"] --> Dashboard',
    '  Evidence["Address Evidence Vault"] --> Review',
    '  Settings["Settings and Policy Center"] --> Map',
    '  Settings --> POS',
    '  Settings --> Element',
    '  Developer["Developer Console"] --> Dashboard',
    '  Resolver["Resolver / Registry / Adapter Layer"] --> Map',
    '  Resolver --> POS',
    '  Resolver --> Dashboard',
    '  classDef private fill:#ecfeff,stroke:#0891b2,color:#164e63;',
    '  classDef review fill:#fff7ed,stroke:#ea580c,color:#7c2d12;',
    '  classDef admin fill:#eef2ff,stroke:#4f46e5,color:#312e81;',
    '  class Portal,Element,Evidence private;',
    '  class POS,Review review;',
    '  class Dashboard,Developer admin;',
  ].join('\n');
}

export function validateFrontendEcosystem(
  surfaces = getFrontendSurfaces(),
  relationships = getFrontendRelationships(),
): FrontendEcosystemValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<FrontendSurfaceId>();

  for (const surface of surfaces) {
    if (ids.has(surface.id)) errors.push(`duplicate-surface:${surface.id}`);
    ids.add(surface.id);
    if (!surface.label.trim()) errors.push(`missing-label:${surface.id}`);
    if (!surface.primaryGoal.trim()) errors.push(`missing-primary-goal:${surface.id}`);
    if (surface.audience.length === 0) errors.push(`missing-audience:${surface.id}`);
    if (surface.capabilities.length === 0) errors.push(`missing-capability:${surface.id}`);
    if (surface.privacyBoundary.length === 0) errors.push(`missing-privacy-boundary:${surface.id}`);
    if (surface.status !== 'planned' && surface.currentRefs.length === 0) {
      errors.push(`non-planned-surface-without-current-ref:${surface.id}`);
    }
    if (surface.status !== 'implemented') {
      if (surface.gaps.length === 0) errors.push(`non-implemented-surface-without-gap:${surface.id}`);
      if (surface.nextSteps.length === 0) errors.push(`non-implemented-surface-without-next-step:${surface.id}`);
    }
  }

  for (const relationship of relationships) {
    if (!ids.has(relationship.from)) errors.push(`relationship-from-unknown:${relationship.from}`);
    if (!ids.has(relationship.to)) errors.push(`relationship-to-unknown:${relationship.to}`);
    if (relationship.sensitiveDataPolicy === 'ephemeral-plaintext') {
      warnings.push(`ephemeral-plaintext-relationship:${relationship.from}->${relationship.to}`);
    }
  }

  const routeSet = new Set(surfaces.map(surface => surface.route).filter(Boolean));
  for (const route of ['/', '/pos', '/portal', '/dashboard']) {
    if (!routeSet.has(route)) errors.push(`missing-route:${route}`);
  }

  for (const capability of REQUIRED_FRONTEND_CAPABILITIES) {
    if (!surfaces.some(surface => surface.capabilities.includes(capability))) {
      errors.push(`missing-required-capability:${capability}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
