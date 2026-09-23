import type { AppSurfaceId } from './appNavigation';

export const ADDRESS_SURFACE_COMPATIBILITY_VERSION = 'address-surface-compatibility-v1';

export type AddressWorkflowSurfaceId = Extract<
  AppSurfaceId,
  | 'address-registration'
  | 'agid-address-element'
  | 'address-portal'
  | 'pos-terminal'
  | 'field-handoff'
  | 'address-dashboard'
  | 'address-review-console'
  | 'developer-console'
  | 'evidence-vault'
  | 'postal-zone-designer'
  | 'drone-locker-ops'
>;

export type AddressWorkflowPriority = 'P0' | 'P1' | 'P2';
export type AddressWorkflowMaturity = 'ready' | 'partial' | 'planned';

export type AddressSharedPrimitiveId =
  | 'address-intent'
  | 'safe-address-session'
  | 'registration-assistance'
  | 'address-correction-feedback'
  | 'address-verification-evidence'
  | 'consent-scope'
  | 'address-item'
  | 'qr-nfc-token'
  | 'recipient-proof'
  | 'signed-receipt'
  | 'offline-sync-envelope'
  | 'review-case'
  | 'redacted-audit-log'
  | 'developer-api-contract'
  | 'evidence-reference'
  | 'postal-zone-plan'
  | 'reachability-report';

export type AddressSharedCapabilityId =
  | 'country-language-policy'
  | 'postal-code-autofill'
  | 'agid-autofill'
  | 'address-quality-decision'
  | 'editable-correction'
  | 'local-learning-feedback'
  | 'consent-revoke-delete-export'
  | 'scope-and-purpose-control'
  | 'scan-decision-handoff-report'
  | 'qr-nfc-scan'
  | 'offline-first'
  | 'recipient-proof-flow'
  | 'reachability-reporting'
  | 'review-and-dispute'
  | 'terminal-device-state'
  | 'webhook-and-openapi'
  | 'sdk-test-vectors'
  | 'ocr-redaction'
  | 'postal-zone-governance'
  | 'device-simulator';

export type AddressSharedPrimitive = {
  id: AddressSharedPrimitiveId;
  label: string;
  moduleRefs: string[];
  contractRule: string;
  ownerSurfaces: AddressWorkflowSurfaceId[];
};

export type AddressSurfaceCompatibility = {
  id: AddressWorkflowSurfaceId;
  label: string;
  priority: AddressWorkflowPriority;
  maturity: AddressWorkflowMaturity;
  primaryWorkflow: string;
  sharedPrimitives: AddressSharedPrimitiveId[];
  capabilities: AddressSharedCapabilityId[];
  consumes: AddressSharedPrimitiveId[];
  produces: AddressSharedPrimitiveId[];
  shouldReuse: string[];
  ownsLocally: string[];
  privacyRules: string[];
  compatibilityRequirements: string[];
  nextRefactor: string;
  testsToKeep: string[];
};

export type AddressSurfaceCompatibilitySummary = {
  version: typeof ADDRESS_SURFACE_COMPATIBILITY_VERSION;
  totalSurfaces: number;
  p0Surfaces: AddressWorkflowSurfaceId[];
  partialSurfaces: AddressWorkflowSurfaceId[];
  plannedSurfaces: AddressWorkflowSurfaceId[];
  firstCriticalSlice: AddressWorkflowSurfaceId[];
  sharedPrimitiveCount: number;
  allSurfacesHaveNoRawAddressRule: boolean;
};

export type AddressSurfaceCompatibilityValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export const ADDRESS_WORKFLOW_BUILD_ORDER: AddressWorkflowSurfaceId[] = [
  'address-registration',
  'agid-address-element',
  'address-portal',
  'pos-terminal',
  'field-handoff',
  'address-dashboard',
  'address-review-console',
  'developer-console',
  'evidence-vault',
  'postal-zone-designer',
  'drone-locker-ops',
];

const SHARED_PRIMITIVES: AddressSharedPrimitive[] = [
  {
    id: 'address-intent',
    label: 'AddressIntent',
    moduleRefs: ['src/lib/addressIntent.ts'],
    contractRule: 'All workflow surfaces exchange status, evidence fingerprints, missing evidence, and next actions through AddressIntent-like state.',
    ownerSurfaces: ['address-registration', 'agid-address-element', 'pos-terminal'],
  },
  {
    id: 'safe-address-session',
    label: 'Safe Address Session',
    moduleRefs: ['src/lib/addressElement.ts', 'src/components/AgidAddressElement.tsx'],
    contractRule: 'Embeddable and registration flows may hold raw input locally, but public host events return only session state, evidence fingerprints, and intent previews.',
    ownerSurfaces: ['agid-address-element', 'address-registration'],
  },
  {
    id: 'registration-assistance',
    label: 'Registration Assistance',
    moduleRefs: ['src/lib/addressRegistrationAutomation.ts', 'src/lib/addressRegistrationState.ts'],
    contractRule: 'Postal-code and AGID assistance must create reviewable patches, never fabricated full street addresses.',
    ownerSurfaces: ['address-registration', 'agid-address-element'],
  },
  {
    id: 'address-correction-feedback',
    label: 'Closed Correction Feedback',
    moduleRefs: ['src/lib/addressFeedbackLearning.ts', 'src/lib/addressRegistrationAutomation.ts'],
    contractRule: 'Corrections and translation feedback stay closed-device-local unless a later aggregate pipeline explicitly redacts and thresholds them.',
    ownerSurfaces: ['address-registration', 'agid-address-element'],
  },
  {
    id: 'address-verification-evidence',
    label: 'Address Verification Evidence',
    moduleRefs: ['src/lib/addressVerificationEngine.ts', 'src/lib/addressValidation.ts', 'src/lib/addressMapQualityLayer.ts'],
    contractRule: 'Quality is represented as evidence and decision states; internal numeric scores are not the user-facing contract.',
    ownerSurfaces: ['address-registration', 'agid-address-element', 'pos-terminal', 'address-review-console'],
  },
  {
    id: 'consent-scope',
    label: 'Consent and Purpose Scope',
    moduleRefs: ['src/lib/addressConsentEnvelope.ts', 'src/lib/addressAccessAuth.ts'],
    contractRule: 'Every cross-surface permission uses purpose-bound scopes and can be revoked or exported by the user.',
    ownerSurfaces: ['address-portal', 'developer-console'],
  },
  {
    id: 'address-item',
    label: 'Address Item',
    moduleRefs: ['src/lib/addressItem.ts', 'src/lib/addressPortal.ts', 'src/lib/addressLink.ts'],
    contractRule: 'A durable address connection is represented by an Address Item, not by a reusable raw AOID or plaintext address.',
    ownerSurfaces: ['address-portal', 'agid-address-element'],
  },
  {
    id: 'qr-nfc-token',
    label: 'QR/NFC Token',
    moduleRefs: ['src/lib/shippingLabelQr.ts', 'src/lib/posRuntimePolicy.ts'],
    contractRule: 'QR/NFC tokens use short aliases, jti, expiry, and commitment refs instead of raw address payloads.',
    ownerSurfaces: ['pos-terminal', 'field-handoff'],
  },
  {
    id: 'recipient-proof',
    label: 'Recipient Proof',
    moduleRefs: ['src/lib/posOperationalControls.ts', 'src/lib/addressIdentity.ts'],
    contractRule: 'Recipient proof material is verified and transformed into a receipt signal; proof codes or recipient secrets are not stored.',
    ownerSurfaces: ['pos-terminal', 'field-handoff'],
  },
  {
    id: 'signed-receipt',
    label: 'Signed Receipt',
    moduleRefs: ['src/lib/posOperationalControls.ts', 'src/lib/shippingLabelQr.ts'],
    contractRule: 'Handoff, carrier scan, refusal, and review decisions produce signed receipts with terminal/device context and redacted reason codes.',
    ownerSurfaces: ['pos-terminal', 'field-handoff', 'address-review-console'],
  },
  {
    id: 'offline-sync-envelope',
    label: 'Offline Sync Envelope',
    moduleRefs: ['src/lib/addressOfflineSyncCrdt.ts', 'src/lib/syncQueue.ts', 'src/lib/posOfflineUsageLedger.ts'],
    contractRule: 'Offline updates synchronize as conflict-aware envelopes; collisions become review cases rather than silent overwrites.',
    ownerSurfaces: ['field-handoff', 'pos-terminal'],
  },
  {
    id: 'review-case',
    label: 'Review Case',
    moduleRefs: ['src/lib/addressRadar.ts', 'src/lib/addressSignal.ts', 'src/lib/posDesignReview.ts'],
    contractRule: 'Review cases carry reason codes, redacted evidence refs, and audit requirements, not raw private evidence by default.',
    ownerSurfaces: ['address-review-console', 'address-dashboard'],
  },
  {
    id: 'redacted-audit-log',
    label: 'Redacted Audit Log',
    moduleRefs: ['src/lib/addressOperations.ts', 'src/lib/addressLaunchCenter.ts', 'src/lib/securityMandatoryReleaseGate.ts'],
    contractRule: 'Administrative and developer surfaces log identifiers, hashes, receipts, roots, and statuses, never private address material.',
    ownerSurfaces: ['address-dashboard', 'developer-console', 'address-review-console'],
  },
  {
    id: 'developer-api-contract',
    label: 'Developer API Contract',
    moduleRefs: ['src/lib/openApiSpec.ts', 'src/lib/apiEndpoints.ts', 'src/lib/mcpServer.ts'],
    contractRule: 'External developers receive OpenAPI, SDK snippets, webhooks, and test vectors that exercise redacted payloads only.',
    ownerSurfaces: ['developer-console', 'agid-address-element'],
  },
  {
    id: 'evidence-reference',
    label: 'Evidence Reference',
    moduleRefs: ['src/lib/addressEvidenceVault.ts', 'src/lib/addressDocumentReading.ts', 'src/lib/addressEvidence.ts'],
    contractRule: 'Photos/PDF/OCR outputs become editable, redactable, encrypted evidence references before review or sync.',
    ownerSurfaces: ['evidence-vault', 'address-registration', 'address-review-console'],
  },
  {
    id: 'postal-zone-plan',
    label: 'Postal Zone Plan',
    moduleRefs: ['src/components/PostalCodeLab.tsx', 'docs/agid-postal-code-engine-ja.md'],
    contractRule: 'AGID postal zones are draft/governed plans with non-cross-border, privacy, capacity, and approval constraints.',
    ownerSurfaces: ['postal-zone-designer'],
  },
  {
    id: 'reachability-report',
    label: 'Reachability Report',
    moduleRefs: ['src/lib/droneDeliveryEvidenceApi.ts', 'src/lib/warehouseLockerLocalSimulator.ts', 'src/lib/lockerSystemOs.ts'],
    contractRule: 'Drone/locker/field reports publish reachability categories and restricted operator receipts, not raw telemetry or precise private traces.',
    ownerSurfaces: ['drone-locker-ops', 'field-handoff'],
  },
];

const SURFACES: AddressSurfaceCompatibility[] = [
  {
    id: 'address-registration',
    label: 'Address Registration',
    priority: 'P0',
    maturity: 'partial',
    primaryWorkflow: 'Import/autofill -> edit/correct -> verify -> create AddressIntent.',
    sharedPrimitives: [
      'address-intent',
      'safe-address-session',
      'registration-assistance',
      'address-correction-feedback',
      'address-verification-evidence',
      'evidence-reference',
    ],
    capabilities: [
      'country-language-policy',
      'postal-code-autofill',
      'agid-autofill',
      'address-quality-decision',
      'editable-correction',
      'local-learning-feedback',
      'ocr-redaction',
    ],
    consumes: ['registration-assistance', 'address-verification-evidence', 'evidence-reference'],
    produces: ['address-intent', 'safe-address-session', 'address-correction-feedback'],
    shouldReuse: [
      'AddressElement safe session and field-state model',
      'AddressIntent evidence groups and next actions',
      'addressRegistrationAutomation postal/AGID assistance helpers',
      'addressFeedbackLearning closed local feedback records',
    ],
    ownsLocally: [
      'raw form draft',
      'OCR candidate before redaction',
      'user correction before safe record creation',
    ],
    privacyRules: [
      'No raw address leaves the registration surface by default.',
      'Corrections are closed-device-local learning references unless explicitly exported.',
      'Document OCR remains editable and redacted before any sync or review handoff.',
    ],
    compatibilityRequirements: [
      'Must emit an AddressIntent preview compatible with Address Element and POS.',
      'Must use the same language tab semantics as Address Element.',
      'Must convert postal and AGID assistance into reviewable patches.',
    ],
    nextRefactor: 'Split the 2000+ line registration surface into stepper, country/language selector, assistance, evidence import, preview, and submit components.',
    testsToKeep: [
      'src/components/AddressRegistration.test.ts',
      'src/lib/addressRegistrationAutomation.test.ts',
      'src/lib/addressRegistrationState.test.ts',
    ],
  },
  {
    id: 'agid-address-element',
    label: 'AGID Address Element',
    priority: 'P0',
    maturity: 'partial',
    primaryWorkflow: 'Embedded host input -> safe session -> AddressIntent preview -> host next action.',
    sharedPrimitives: [
      'address-intent',
      'safe-address-session',
      'registration-assistance',
      'address-correction-feedback',
      'address-verification-evidence',
      'address-item',
      'developer-api-contract',
    ],
    capabilities: [
      'country-language-policy',
      'postal-code-autofill',
      'agid-autofill',
      'address-quality-decision',
      'editable-correction',
      'local-learning-feedback',
      'qr-nfc-scan',
      'scope-and-purpose-control',
      'sdk-test-vectors',
    ],
    consumes: ['registration-assistance', 'address-verification-evidence', 'consent-scope'],
    produces: ['safe-address-session', 'address-intent', 'address-item', 'developer-api-contract'],
    shouldReuse: [
      'Address Registration assistance and language-tab code',
      'AddressIntent as the only cross-host workflow object',
      'Address Link and Address Item for permissions',
      'Address Radar for risk decisions after session creation',
    ],
    ownsLocally: [
      'host-side raw input',
      'host-side private field values',
      'local widget state before safe event emission',
    ],
    privacyRules: [
      'Host events return session, evidence fingerprints, and intent only.',
      'Raw AOID, AGID-S payload, recipient, phone, unit, proof code, and recipient secret are forbidden in public events.',
    ],
    compatibilityRequirements: [
      'Must be embeddable without requiring the full AGID app shell.',
      'Must use the same status and next-action vocabulary as AddressIntent.',
      'Must expose test vectors for EC, CMS, POS, and shopping-agent hosts.',
    ],
    nextRefactor: 'Add a public Address Element event contract and host integration examples, then route the registration form through the same safe session builder.',
    testsToKeep: ['src/lib/addressElement.test.ts', 'src/lib/addressLink.test.ts', 'src/lib/addressIntent.test.ts'],
  },
  {
    id: 'address-portal',
    label: 'Address Portal',
    priority: 'P0',
    maturity: 'ready',
    primaryWorkflow: 'Connection list -> detail -> scope history -> revoke/delete/export.',
    sharedPrimitives: ['consent-scope', 'address-item', 'redacted-audit-log'],
    capabilities: ['consent-revoke-delete-export', 'scope-and-purpose-control', 'country-language-policy'],
    consumes: ['address-item', 'consent-scope', 'redacted-audit-log'],
    produces: ['consent-scope', 'redacted-audit-log'],
    shouldReuse: ['addressPortal and addressItem models', 'Address Access/Auth purpose-scope evaluation', 'Settings language policy'],
    ownsLocally: ['user-visible consent preferences', 'export request state', 'delete request state'],
    privacyRules: [
      'The user can revoke, delete, and export without paid dependencies.',
      'Connection lists show aliases, scopes, issuer, and status; they do not expose raw addresses.',
    ],
    compatibilityRequirements: [
      'Must understand Address Item refs generated by Address Element.',
      'Must show scope/purpose states used by POS, Field Handoff, and Developer APIs.',
    ],
    nextRefactor: 'Mature connection detail pages with scope timeline, revoke confirmation, export, delete, and dispute states.',
    testsToKeep: ['src/lib/addressPortal.test.ts', 'src/lib/addressItem.test.ts', 'src/lib/addressAccessAuth.test.ts'],
  },
  {
    id: 'pos-terminal',
    label: 'AGID POS Terminal',
    priority: 'P0',
    maturity: 'ready',
    primaryWorkflow: 'Scan -> Decision -> Handoff -> Report.',
    sharedPrimitives: [
      'address-intent',
      'qr-nfc-token',
      'recipient-proof',
      'signed-receipt',
      'offline-sync-envelope',
      'address-verification-evidence',
    ],
    capabilities: [
      'scan-decision-handoff-report',
      'qr-nfc-scan',
      'address-quality-decision',
      'recipient-proof-flow',
      'terminal-device-state',
      'offline-first',
      'country-language-policy',
    ],
    consumes: ['address-intent', 'qr-nfc-token', 'address-verification-evidence', 'consent-scope'],
    produces: ['recipient-proof', 'signed-receipt', 'offline-sync-envelope', 'review-case'],
    shouldReuse: ['AddressIntent status model', 'shippingLabelQr token policy', 'posOperationalControls receipts', 'Address Radar decisions'],
    ownsLocally: ['scanner runtime state', 'local used-state ledger', 'device diagnostics state'],
    privacyRules: [
      'POS stores aliases, receipts, commitments, and local used-state, not raw AGID-S payloads.',
      'High-risk mode requires short-lived QR/NFC and recipient proof before handoff completion.',
    ],
    compatibilityRequirements: [
      'Must accept AddressIntent from Registration/Element.',
      'Must route refusal, partial quality, and offline conflicts to Review Console.',
      'Must emit handoff report usable by Field Handoff and Dashboard.',
    ],
    nextRefactor: 'Keep the four primary screens as Scan, Decision, Handoff, Report and move settings/devices/audit into secondary lanes.',
    testsToKeep: ['src/lib/posOperationalControls.test.ts', 'src/lib/posUiHardening.test.ts', 'src/lib/shippingLabelQr.test.ts'],
  },
  {
    id: 'field-handoff',
    label: 'Field Handoff App',
    priority: 'P0',
    maturity: 'ready',
    primaryWorkflow: 'Assigned stop -> scan -> recipient proof -> reachability/handoff receipt -> sync.',
    sharedPrimitives: ['address-intent', 'qr-nfc-token', 'recipient-proof', 'signed-receipt', 'offline-sync-envelope', 'reachability-report'],
    capabilities: ['offline-first', 'recipient-proof-flow', 'reachability-reporting', 'qr-nfc-scan', 'scan-decision-handoff-report'],
    consumes: ['address-intent', 'qr-nfc-token', 'offline-sync-envelope'],
    produces: ['recipient-proof', 'signed-receipt', 'offline-sync-envelope', 'reachability-report', 'review-case'],
    shouldReuse: ['POS handoff state names', 'CRDT/offline envelope model', 'reachability reason codes', 'high-risk mode controls'],
    ownsLocally: ['route stop working set', 'offline queue', 'cannot-reach draft'],
    privacyRules: [
      'Reachability reports use safe categories and coarse context by default.',
      'Raw address, exact private location, and recipient identifiers are not included in shared field reports.',
      'High-risk deliveries avoid precise public AGID and erase address history after completion when configured.',
    ],
    compatibilityRequirements: [
      'Must consume POS-compatible QR/NFC tokens and receipts.',
      'Must send conflicts and cannot-reach cases to Review Console.',
    ],
    nextRefactor: 'Align mobile field states with POS Scan/Decision/Handoff/Report while keeping offline route-stop UX separate.',
    testsToKeep: ['src/lib/fieldHandoff.test.ts', 'src/lib/addressOfflineSyncCrdt.test.ts'],
  },
  {
    id: 'address-dashboard',
    label: 'Address Dashboard',
    priority: 'P0',
    maturity: 'ready',
    primaryWorkflow: 'Redacted operations overview -> logs/webhooks/terminals/issuers/review.',
    sharedPrimitives: ['redacted-audit-log', 'review-case', 'signed-receipt', 'developer-api-contract'],
    capabilities: ['review-and-dispute', 'terminal-device-state', 'webhook-and-openapi', 'scope-and-purpose-control'],
    consumes: ['redacted-audit-log', 'review-case', 'signed-receipt', 'developer-api-contract'],
    produces: ['redacted-audit-log', 'review-case'],
    shouldReuse: ['Address Operations summaries', 'Address Radar/Signal reason codes', 'Launch Center release gates'],
    ownsLocally: ['admin filters', 'redacted dashboard tab state'],
    privacyRules: [
      'Dashboard surfaces show metrics, refs, commitments, roots, receipts, statuses, and reason codes only.',
      'Admin logs must redact raw address, AGID-S ciphertext, proof material, and recipient identifiers.',
    ],
    compatibilityRequirements: [
      'Must consume POS/Field signed receipts and Review cases.',
      'Must expose Developer Console and Review Console as modules without duplicating event schemas.',
    ],
    nextRefactor: 'Split dashboard into operations tabs and make Review and Developer modules consume the same redacted event stream.',
    testsToKeep: ['src/lib/addressOperations.test.ts', 'src/lib/addressLaunchCenter.test.ts', 'src/lib/addressRadar.test.ts'],
  },
  {
    id: 'address-review-console',
    label: 'Address Review Console',
    priority: 'P0',
    maturity: 'partial',
    primaryWorkflow: 'Case queue -> redacted case detail -> decision -> signed reviewer receipt.',
    sharedPrimitives: ['review-case', 'redacted-audit-log', 'evidence-reference', 'signed-receipt', 'address-verification-evidence'],
    capabilities: ['review-and-dispute', 'address-quality-decision', 'scope-and-purpose-control', 'ocr-redaction'],
    consumes: ['review-case', 'redacted-audit-log', 'evidence-reference', 'address-verification-evidence'],
    produces: ['signed-receipt', 'redacted-audit-log', 'review-case'],
    shouldReuse: ['Address Radar reason codes', 'Address Evidence refs', 'POS refusal/report receipts', 'Address Access/Auth scoped escalation'],
    ownsLocally: ['reviewer filters', 'manual reason draft', 'escalation state'],
    privacyRules: [
      'Review starts from redacted evidence; scoped escalation requires role, purpose, and audit reason.',
      'Decision receipts use reason codes and commitments instead of copying raw evidence.',
    ],
    compatibilityRequirements: [
      'Must accept cases from POS, Field Handoff, Registration, Radar, and offline conflict sync.',
      'Must emit decisions back to Dashboard and Portal as safe status updates.',
    ],
    nextRefactor: 'Create a real review module with queue/detail/actions instead of only dashboard summary cards.',
    testsToKeep: ['src/lib/addressRadar.test.ts', 'src/lib/addressSignal.test.ts', 'src/lib/addressAccessAuth.test.ts'],
  },
  {
    id: 'developer-console',
    label: 'Developer Console',
    priority: 'P1',
    maturity: 'planned',
    primaryWorkflow: 'API keys -> OpenAPI -> webhooks -> SDK snippets -> launch checklist.',
    sharedPrimitives: ['developer-api-contract', 'redacted-audit-log', 'safe-address-session', 'consent-scope'],
    capabilities: ['webhook-and-openapi', 'sdk-test-vectors', 'scope-and-purpose-control', 'country-language-policy'],
    consumes: ['developer-api-contract', 'safe-address-session', 'consent-scope'],
    produces: ['developer-api-contract', 'redacted-audit-log'],
    shouldReuse: ['OpenAPI spec', 'Address Element capabilities', 'Launch Center gates', 'no-raw-address fixture suite'],
    ownsLocally: ['test/live environment selector', 'webhook test state', 'snippet preference'],
    privacyRules: [
      'Developer logs show request IDs, schemas, signature status, and redaction errors, not private request bodies.',
      'Examples use synthetic data and commitments only.',
    ],
    compatibilityRequirements: [
      'Must publish Address Element event contracts and POS/Portal webhook shapes.',
      'Must make Local Only, Server Registry, ZK, Ethereum, and Full modes explicit and optional.',
    ],
    nextRefactor: 'Add a dashboard developer module for API contracts, webhook debugger, SDK snippets, test vectors, and launch checks.',
    testsToKeep: ['src/lib/apiEndpoints.test.ts', 'src/lib/openApiSpec.test.ts', 'src/lib/addressLaunchCenter.test.ts'],
  },
  {
    id: 'evidence-vault',
    label: 'Evidence Vault',
    priority: 'P1',
    maturity: 'planned',
    primaryWorkflow: 'Import -> OCR candidate -> edit/redact -> encrypted evidence ref -> attach.',
    sharedPrimitives: ['evidence-reference', 'redacted-audit-log', 'review-case', 'address-verification-evidence'],
    capabilities: ['ocr-redaction', 'editable-correction', 'review-and-dispute'],
    consumes: ['address-verification-evidence', 'consent-scope'],
    produces: ['evidence-reference', 'redacted-audit-log', 'review-case'],
    shouldReuse: ['addressDocumentReading extraction', 'Evidence Vault envelope', 'Review Console evidence refs', 'Registration document import'],
    ownsLocally: ['document bytes before redaction', 'OCR text before user confirmation', 'redaction edits'],
    privacyRules: [
      'No automatic external OCR upload.',
      'Unredacted document content stays local or encrypted until explicit user action.',
    ],
    compatibilityRequirements: [
      'Must attach evidence to Registration and Review through evidence refs, not raw document text.',
      'Must respect Portal consent and retention policies.',
    ],
    nextRefactor: 'Extract document import from Registration into a reusable local Evidence Vault panel after Registration/Element contracts stabilize.',
    testsToKeep: ['src/lib/addressEvidenceVault.test.ts', 'src/lib/addressDocumentReading.test.ts', 'src/lib/addressEvidence.test.ts'],
  },
  {
    id: 'postal-zone-designer',
    label: 'Postal Zone Designer',
    priority: 'P2',
    maturity: 'planned',
    primaryWorkflow: 'Select country -> propose AGID zones -> edit/draw -> validate governance -> export draft.',
    sharedPrimitives: ['postal-zone-plan', 'redacted-audit-log', 'address-verification-evidence'],
    capabilities: ['postal-zone-governance', 'address-quality-decision', 'country-language-policy'],
    consumes: ['address-verification-evidence'],
    produces: ['postal-zone-plan', 'redacted-audit-log'],
    shouldReuse: ['Address Verification evidence quality model', 'AGID grid/cell logic', 'Postal code lab drawing-tablet event model'],
    ownsLocally: ['draft postal zone geometry', 'governance notes', 'manual edit history'],
    privacyRules: [
      'Public postal zones must satisfy anonymity, capacity, non-cross-border, and sensitive-place masking constraints.',
      'Draft zone plans store public geometry, governance metadata, and aggregate counts, not raw personal addresses.',
      'Draft zones do not claim official postal authority without approval metadata.',
    ],
    compatibilityRequirements: [
      'Must feed generated draft zones into Address Registration/Element only as assistance metadata.',
      'Must not override official postal code systems.',
    ],
    nextRefactor: 'Build this after core registration quality is stable; start as a lab using AGID grid edits and governance validation.',
    testsToKeep: ['scripts/report-agid-postal-code-engine.ts', 'src/lib/addressCoveragePolicy.test.ts'],
  },
  {
    id: 'drone-locker-ops',
    label: 'Drone / Locker Ops',
    priority: 'P2',
    maturity: 'planned',
    primaryWorkflow: 'Reachability attempt -> device/locker report -> restricted receipt -> review/dashboard.',
    sharedPrimitives: ['reachability-report', 'signed-receipt', 'offline-sync-envelope', 'review-case'],
    capabilities: ['reachability-reporting', 'device-simulator', 'offline-first', 'terminal-device-state'],
    consumes: ['address-intent', 'offline-sync-envelope', 'qr-nfc-token'],
    produces: ['reachability-report', 'signed-receipt', 'review-case'],
    shouldReuse: ['Drone delivery evidence API', 'warehouse/locker simulator', 'POS/Field receipt model', 'Review case reason codes'],
    ownsLocally: ['device simulation state', 'restricted operator receipt draft', 'cannot-reach reason draft'],
    privacyRules: [
      'This surface is not a drone OS or autopilot; it only handles delivery evidence and reachability.',
      'Public reports exclude raw telemetry, precise private coordinates, AGID-S payloads, and recipient secrets.',
    ],
    compatibilityRequirements: [
      'Must send cannot-reach and locker/device failures to Review Console.',
      'Must interoperate with POS/Field receipts without requiring drone-specific dependencies in the core app.',
    ],
    nextRefactor: 'Keep P2 scope to reachability API and MQTT/HTTP/Modbus local simulator; avoid fleet-control expansion.',
    testsToKeep: ['src/lib/droneDeliveryEvidenceApi.test.ts', 'src/lib/warehouseLockerLocalSimulator.test.ts', 'src/lib/lockerSystemOs.test.ts'],
  },
];

function clonePrimitive(primitive: AddressSharedPrimitive): AddressSharedPrimitive {
  return {
    ...primitive,
    moduleRefs: [...primitive.moduleRefs],
    ownerSurfaces: [...primitive.ownerSurfaces],
  };
}

function cloneSurface(surface: AddressSurfaceCompatibility): AddressSurfaceCompatibility {
  return {
    ...surface,
    sharedPrimitives: [...surface.sharedPrimitives],
    capabilities: [...surface.capabilities],
    consumes: [...surface.consumes],
    produces: [...surface.produces],
    shouldReuse: [...surface.shouldReuse],
    ownsLocally: [...surface.ownsLocally],
    privacyRules: [...surface.privacyRules],
    compatibilityRequirements: [...surface.compatibilityRequirements],
    testsToKeep: [...surface.testsToKeep],
  };
}

export function getAddressSharedPrimitives(): AddressSharedPrimitive[] {
  return SHARED_PRIMITIVES.map(clonePrimitive);
}

export function getAddressSurfaceCompatibilityDefinitions(): AddressSurfaceCompatibility[] {
  return SURFACES.map(cloneSurface);
}

export function getAddressSurfaceCompatibility(
  surfaceId: AddressWorkflowSurfaceId,
): AddressSurfaceCompatibility {
  const surface = SURFACES.find(item => item.id === surfaceId);
  if (!surface) throw new Error(`unknown-address-surface:${surfaceId}`);
  return cloneSurface(surface);
}

export function getAddressSurfaceBuildOrder(): AddressSurfaceCompatibility[] {
  const byId = new Map(SURFACES.map(surface => [surface.id, surface]));
  return ADDRESS_WORKFLOW_BUILD_ORDER
    .map(surfaceId => byId.get(surfaceId))
    .filter((surface): surface is AddressSurfaceCompatibility => Boolean(surface))
    .map(cloneSurface);
}

export function getSharedPrimitiveCoverage() {
  return getAddressSharedPrimitives().map(primitive => ({
    id: primitive.id,
    label: primitive.label,
    moduleRefs: [...primitive.moduleRefs],
    ownerSurfaces: [...primitive.ownerSurfaces],
    consumingSurfaces: SURFACES
      .filter(surface => surface.consumes.includes(primitive.id) || surface.sharedPrimitives.includes(primitive.id))
      .map(surface => surface.id),
    producingSurfaces: SURFACES
      .filter(surface => surface.produces.includes(primitive.id))
      .map(surface => surface.id),
  }));
}

export function summarizeAddressSurfaceCompatibility(): AddressSurfaceCompatibilitySummary {
  const surfaces = getAddressSurfaceCompatibilityDefinitions();
  return {
    version: ADDRESS_SURFACE_COMPATIBILITY_VERSION,
    totalSurfaces: surfaces.length,
    p0Surfaces: surfaces.filter(surface => surface.priority === 'P0').map(surface => surface.id),
    partialSurfaces: surfaces.filter(surface => surface.maturity === 'partial').map(surface => surface.id),
    plannedSurfaces: surfaces.filter(surface => surface.maturity === 'planned').map(surface => surface.id),
    firstCriticalSlice: ADDRESS_WORKFLOW_BUILD_ORDER.slice(0, 5),
    sharedPrimitiveCount: SHARED_PRIMITIVES.length,
    allSurfacesHaveNoRawAddressRule: surfaces.every(surface =>
      surface.privacyRules.some(rule => /raw|plaintext|private|redact|encrypted|alias|commitment/i.test(rule)),
    ),
  };
}

function hasAll<T extends string>(values: readonly T[], required: readonly T[]) {
  const set = new Set(values);
  return required.every(item => set.has(item));
}

export function validateAddressSurfaceCompatibility(
  surfaces = getAddressSurfaceCompatibilityDefinitions(),
  primitives = getAddressSharedPrimitives(),
): AddressSurfaceCompatibilityValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<AddressWorkflowSurfaceId>();
  const primitiveIds = new Set(primitives.map(primitive => primitive.id));

  for (const surface of surfaces) {
    if (ids.has(surface.id)) errors.push(`duplicate-surface:${surface.id}`);
    ids.add(surface.id);
    if (!surface.primaryWorkflow.trim()) errors.push(`missing-primary-workflow:${surface.id}`);
    if (!surface.nextRefactor.trim()) errors.push(`missing-next-refactor:${surface.id}`);
    if (surface.shouldReuse.length < 2) errors.push(`missing-code-reuse-guidance:${surface.id}`);
    if (surface.compatibilityRequirements.length < 2) errors.push(`missing-compatibility-requirements:${surface.id}`);
    if (surface.testsToKeep.length === 0) errors.push(`missing-tests:${surface.id}`);
    if (!surface.privacyRules.some(rule => /raw|plaintext|private|redact|encrypted|alias|commitment/i.test(rule))) {
      errors.push(`missing-no-raw-privacy-rule:${surface.id}`);
    }
    for (const primitive of [...surface.sharedPrimitives, ...surface.consumes, ...surface.produces]) {
      if (!primitiveIds.has(primitive)) errors.push(`unknown-primitive:${surface.id}:${primitive}`);
    }
  }

  for (const surfaceId of ADDRESS_WORKFLOW_BUILD_ORDER) {
    if (!ids.has(surfaceId)) errors.push(`missing-build-order-surface:${surfaceId}`);
  }

  const registration = surfaces.find(surface => surface.id === 'address-registration');
  const element = surfaces.find(surface => surface.id === 'agid-address-element');
  const sharedRegistrationElementCapabilities: AddressSharedCapabilityId[] = [
    'country-language-policy',
    'postal-code-autofill',
    'agid-autofill',
    'address-quality-decision',
    'editable-correction',
    'local-learning-feedback',
  ];
  if (!registration || !element) {
    errors.push('missing-registration-or-element');
  } else {
    if (!hasAll(registration.capabilities, sharedRegistrationElementCapabilities)) {
      errors.push('registration-missing-shared-input-capabilities');
    }
    if (!hasAll(element.capabilities, sharedRegistrationElementCapabilities)) {
      errors.push('element-missing-shared-input-capabilities');
    }
    if (!registration.produces.includes('address-intent') || !element.produces.includes('address-intent')) {
      errors.push('registration-element-must-produce-address-intent');
    }
  }

  const portal = surfaces.find(surface => surface.id === 'address-portal');
  if (portal && !portal.capabilities.includes('consent-revoke-delete-export')) {
    errors.push('portal-missing-consent-lifecycle');
  }

  const pos = surfaces.find(surface => surface.id === 'pos-terminal');
  if (pos && !pos.capabilities.includes('scan-decision-handoff-report')) {
    errors.push('pos-missing-primary-four-step-flow');
  }

  const field = surfaces.find(surface => surface.id === 'field-handoff');
  if (field && !field.consumes.includes('offline-sync-envelope')) {
    warnings.push('field-handoff-should-consume-offline-envelope');
  }

  const developer = surfaces.find(surface => surface.id === 'developer-console');
  if (developer && !developer.capabilities.includes('webhook-and-openapi')) {
    errors.push('developer-console-missing-api-webhook-capability');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function renderAddressSurfaceCompatibilityMermaid(
  surfaces = getAddressSurfaceBuildOrder(),
): string {
  const nodeIds: Record<AddressWorkflowSurfaceId, string> = {
    'address-registration': 'Registration',
    'agid-address-element': 'Element',
    'address-portal': 'Portal',
    'pos-terminal': 'POS',
    'field-handoff': 'Field',
    'address-dashboard': 'Dashboard',
    'address-review-console': 'Review',
    'developer-console': 'Developer',
    'evidence-vault': 'Evidence',
    'postal-zone-designer': 'PostalZones',
    'drone-locker-ops': 'DroneLocker',
  };
  const present = new Set(surfaces.map(surface => surface.id));
  const lines = [
    'flowchart LR',
    '  Core["Shared contracts<br/>AddressIntent / EvidenceRef / ConsentScope / Receipt"]',
  ];

  for (const surface of surfaces) {
    const node = nodeIds[surface.id];
    lines.push(`  Core --> ${node}["${surface.label}<br/>${surface.priority} ${surface.maturity}"]`);
  }

  const edges: Array<[AddressWorkflowSurfaceId, AddressWorkflowSurfaceId, string]> = [
    ['address-registration', 'agid-address-element', 'shared input model'],
    ['agid-address-element', 'address-portal', 'Address Item / consent'],
    ['agid-address-element', 'pos-terminal', 'AddressIntent'],
    ['pos-terminal', 'field-handoff', 'receipt / offline task'],
    ['field-handoff', 'address-review-console', 'conflict / cannot reach'],
    ['pos-terminal', 'address-dashboard', 'signed reports'],
    ['address-review-console', 'address-dashboard', 'review status'],
    ['developer-console', 'agid-address-element', 'SDK / OpenAPI'],
    ['evidence-vault', 'address-registration', 'redacted evidence ref'],
    ['postal-zone-designer', 'address-registration', 'draft zone assist'],
    ['drone-locker-ops', 'field-handoff', 'reachability report'],
  ];
  for (const [from, to, label] of edges) {
    if (present.has(from) && present.has(to)) {
      lines.push(`  ${nodeIds[from]} -->|${label}| ${nodeIds[to]}`);
    }
  }

  lines.push('  classDef p0 fill:#ecfeff,stroke:#0891b2,color:#164e63;');
  lines.push('  classDef p1 fill:#eef2ff,stroke:#4f46e5,color:#312e81;');
  lines.push('  classDef p2 fill:#f8fafc,stroke:#64748b,color:#334155;');
  for (const surface of surfaces) {
    lines.push(`  class ${nodeIds[surface.id]} ${surface.priority.toLowerCase()};`);
  }
  return lines.join('\n');
}
