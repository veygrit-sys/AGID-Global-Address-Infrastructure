import { getSourceBoundaryEntriesByKind } from './sourceBoundary';

export const OPEN_SOURCE_COMPATIBILITY_VERSION = 'agid-open-source-compatibility-v1';

export type OpenSourceComponentId =
  | 'agid-aoid-public-standards'
  | 'local-resolver-address-display'
  | 'address-registration-and-element'
  | 'basic-pos-terminal'
  | 'address-portal-user-control'
  | 'privacy-security-release-gates'
  | 'zk-baseline-open-proof-relations'
  | 'developer-docs-research-and-test-vectors';

export type OpenSourceContractId =
  | 'agid-codec-test-vector-contract'
  | 'local-resolver-decision-contract'
  | 'safe-address-session-contract'
  | 'consent-scope-envelope-contract'
  | 'qr-nfc-handoff-receipt-contract'
  | 'no-raw-address-release-gate-contract'
  | 'zk-public-signal-nullifier-contract'
  | 'openapi-sdk-fixture-contract';

export type OpenSourceInteropMode = 'local-only' | 'self-hosted' | 'offline-first' | 'zk-ready';

export type OpenSourceCompatibilityContract = {
  id: OpenSourceContractId;
  label: string;
  owner: OpenSourceComponentId;
  compatibleWith: OpenSourceComponentId[];
  stableArtifacts: string[];
  publicSchema: string;
  requiredReleaseGates: string[];
  mustNotImport: string[];
  privacyBoundary: string[];
  adapterRules: string[];
};

export type OpenSourceInteropEdge = {
  from: OpenSourceComponentId;
  to: OpenSourceComponentId;
  contract: OpenSourceContractId;
  mode: OpenSourceInteropMode;
  payload: string;
  redactedByDefault: boolean;
  testRefs: string[];
};

export type OpenSourceCompatibilityManifest = {
  version: typeof OPEN_SOURCE_COMPATIBILITY_VERSION;
  principle: string;
  components: OpenSourceComponentId[];
  contracts: OpenSourceCompatibilityContract[];
  interopEdges: OpenSourceInteropEdge[];
  hardRules: string[];
};

export type OpenSourceCompatibilityValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const COMMERCIAL_BOUNDARY_IDS = [
  'hosted-registry-managed-service',
  'enterprise-console-dashboard',
  'advanced-pos-terminal-management',
  'advanced-review-radar-signal',
  'managed-evidence-vault',
  'managed-zk-proof-generation',
  'private-deployment-and-support',
  'payment-settlement-carrier-label',
  'veygrit-id-address-login',
  'postal-zone-designer-governance',
  'operations-workspace-trading-models',
  'drone-locker-ops-simulator-and-fleet',
] as const;

export const OPEN_SOURCE_COMPATIBILITY_HARD_RULES = [
  'Open-source components communicate through public contracts, schemas, fixtures, and redacted events rather than private implementation imports.',
  'Mode 0 Local Only must work with AGID codecs, Local Resolver, Address Element, Portal controls, basic POS, and no-raw-address gates without hosted services.',
  'Open-source code must not import commercial managed service modules, dashboards, hosted registries, managed ZK provers, payment settlement, or enterprise fleet code.',
  'Each compatibility contract must include test vectors, OpenAPI or schema refs, privacy release gates, and a no-raw-address boundary.',
  'Commercial services may consume OSS contracts, but OSS contracts must remain independently implementable and self-hostable.',
];

export const OPEN_SOURCE_COMPATIBILITY_CONTRACTS: OpenSourceCompatibilityContract[] = [
  {
    id: 'agid-codec-test-vector-contract',
    label: 'AGID/AOID codec and test-vector contract',
    owner: 'agid-aoid-public-standards',
    compatibleWith: [
      'local-resolver-address-display',
      'address-registration-and-element',
      'basic-pos-terminal',
      'developer-docs-research-and-test-vectors',
    ],
    stableArtifacts: [
      'sdk/agid-spec/test-vectors.json',
      'sdk/agid-spec/agid-spec.json',
      'src/lib/agid.ts',
      'src/lib/aoid.ts',
      'src/lib/agidSecureShare.ts',
    ],
    publicSchema: 'AGID encode/decode/cellBounds vectors plus AGID-S local encrypted envelope semantics.',
    requiredReleaseGates: ['cross-language-sdk-parity', 'agid-s-local-decrypt-fixtures', 'no-private-aoid-public-vectors'],
    mustNotImport: [...COMMERCIAL_BOUNDARY_IDS],
    privacyBoundary: [
      'Public vectors use synthetic coordinates and synthetic AOID descriptors only.',
      'No raw address, recipient name, phone, unit secret, proof code, or real address is a compatibility fixture.',
    ],
    adapterRules: [
      'Generated SDKs must pass the same vectors before release.',
      'Wrappers may add convenience APIs but cannot redefine AGID decode semantics.',
    ],
  },
  {
    id: 'local-resolver-decision-contract',
    label: 'Local resolver decision contract',
    owner: 'local-resolver-address-display',
    compatibleWith: [
      'address-registration-and-element',
      'basic-pos-terminal',
      'address-portal-user-control',
      'developer-docs-research-and-test-vectors',
    ],
    stableArtifacts: [
      'src/lib/agidLocalResolver.ts',
      'src/lib/addressDisplay.ts',
      'src/lib/addressValidation.ts',
      'src/lib/addressRendering.ts',
      'src/lib/languageTabs.ts',
      'src/data/address_formats/**',
    ],
    publicSchema: 'Resolved address display, language tab state, evidence classes, decision state, and next action.',
    requiredReleaseGates: ['country-format-tests', 'language-rendering-tests', 'offline-resolver-tests', 'no-user-facing-internal-score'],
    mustNotImport: [...COMMERCIAL_BOUNDARY_IDS],
    privacyBoundary: [
      'Resolver output exposes display decisions and evidence fingerprints, not raw address text or raw correction history.',
      'Internal quality scores remain non-user-facing and may only become coarse decision states.',
    ],
    adapterRules: [
      'Provider adapters must return the same decision vocabulary.',
      'Self-hosted geocoder adapters must degrade to partial or unresolved instead of fabricating certainty.',
    ],
  },
  {
    id: 'safe-address-session-contract',
    label: 'Safe address session and AddressIntent contract',
    owner: 'address-registration-and-element',
    compatibleWith: [
      'local-resolver-address-display',
      'basic-pos-terminal',
      'address-portal-user-control',
      'developer-docs-research-and-test-vectors',
    ],
    stableArtifacts: [
      'src/lib/addressElement.ts',
      'src/lib/addressElementEvents.ts',
      'src/lib/addressIntent.ts',
      'src/lib/addressRegistrationState.ts',
      'src/lib/addressRegistrationAutomation.ts',
    ],
    publicSchema: 'Safe session id, purpose, country/language state, evidence fingerprints, intent status, next action, and redacted host events.',
    requiredReleaseGates: ['privacy-safe-event-tests', 'address-intent-status-tests', 'language-propagation-tests', 'no-raw-address-host-events'],
    mustNotImport: [...COMMERCIAL_BOUNDARY_IDS],
    privacyBoundary: [
      'Raw form input can exist inside the local component only.',
      'Host events receive aliases, commitments, evidence refs, status, and next actions; no raw address leaves through the public event contract.',
    ],
    adapterRules: [
      'EC/CMS/POS/shopping-agent adapters consume the same safe event shape.',
      'External hosts cannot request unrestricted raw-address export through the Address Element event API.',
    ],
  },
  {
    id: 'consent-scope-envelope-contract',
    label: 'Consent and purpose-scope envelope contract',
    owner: 'address-portal-user-control',
    compatibleWith: [
      'address-registration-and-element',
      'basic-pos-terminal',
      'zk-baseline-open-proof-relations',
      'developer-docs-research-and-test-vectors',
    ],
    stableArtifacts: [
      'src/lib/addressPortal.ts',
      'src/lib/addressItem.ts',
      'src/lib/addressConsentEnvelope.ts',
      'src/lib/addressAccessAuth.ts',
      'src/lib/addressLink.ts',
    ],
    publicSchema: 'Address Item id, actor, scope, purpose, expiry, revocation state, export/delete state, and consent receipt commitment.',
    requiredReleaseGates: ['portal-revoke-delete-export-tests', 'scope-purpose-tests', 'consent-event-redaction-tests'],
    mustNotImport: [...COMMERCIAL_BOUNDARY_IDS],
    privacyBoundary: [
      'Consent records store scopes and commitments, not reusable raw AOID or raw address strings.',
      'Revoke/delete/export remain available without paid service dependencies.',
    ],
    adapterRules: [
      'Address Link, Address Element, and POS must honor the same scope vocabulary.',
      'Any adapter that cannot enforce scope must reject the request rather than broaden access.',
    ],
  },
  {
    id: 'qr-nfc-handoff-receipt-contract',
    label: 'QR/NFC handoff and signed receipt contract',
    owner: 'basic-pos-terminal',
    compatibleWith: [
      'address-registration-and-element',
      'address-portal-user-control',
      'privacy-security-release-gates',
      'developer-docs-research-and-test-vectors',
    ],
    stableArtifacts: [
      'src/lib/posAcceptance.ts',
      'src/lib/posRuntimePolicy.ts',
      'src/lib/posOfflineUsageLedger.ts',
      'src/lib/posPrint.ts',
      'src/lib/shippingLabelQr.ts',
      'src/lib/agidSecurePos.ts',
    ],
    publicSchema: 'Short alias, jti, expiry, scan decision, handoff status, terminal/device signature, redacted reason code, and receipt hash.',
    requiredReleaseGates: ['scan-to-decision-tests', 'offline-queue-redaction-tests', 'receipt-signature-tests', 'qr-copy-replay-tests'],
    mustNotImport: [...COMMERCIAL_BOUNDARY_IDS],
    privacyBoundary: [
      'QR/NFC payloads are consumed locally and transformed into receipt commitments.',
      'Receipt exports avoid raw address, raw AGID-S payload, PIN, proof code, and recipient secret.',
    ],
    adapterRules: [
      'Printer, scanner, NFC, cash drawer, and measuring device adapters must emit redacted device events.',
      'Offline queues synchronize conflict envelopes rather than overwriting used-state silently.',
    ],
  },
  {
    id: 'no-raw-address-release-gate-contract',
    label: 'No-raw-address release gate contract',
    owner: 'privacy-security-release-gates',
    compatibleWith: [
      'agid-aoid-public-standards',
      'local-resolver-address-display',
      'address-registration-and-element',
      'basic-pos-terminal',
      'address-portal-user-control',
      'zk-baseline-open-proof-relations',
      'developer-docs-research-and-test-vectors',
    ],
    stableArtifacts: [
      'SECURITY.md',
      'src/lib/noRawAddressReleaseScan.ts',
      'src/lib/publicPrivateSeparation.ts',
      'src/lib/securityMandatoryReleaseGate.ts',
      'scripts/verify-no-raw-address-release-suite.ts',
      'scripts/verify-external-audit-secret-scan.ts',
    ],
    publicSchema: 'Release gate report with scanned surfaces, forbidden fields, violations, warnings, and approved redaction exceptions.',
    requiredReleaseGates: ['no-raw-address-release-suite', 'secret-scan', 'high-risk-mode-tests', 'public-private-separation-tests'],
    mustNotImport: [...COMMERCIAL_BOUNDARY_IDS],
    privacyBoundary: [
      'No OSS compatibility artifact may require raw address, raw AOID, AGID-S payload, proof code, recipient secret, or private key.',
      'High-risk mode, redaction, and security fixes are not commercial-only capabilities.',
    ],
    adapterRules: [
      'New OSS adapters must declare forbidden fields and redacted event shape.',
      'Compatibility is rejected when an adapter requires plaintext central-server storage.',
    ],
  },
  {
    id: 'zk-public-signal-nullifier-contract',
    label: 'ZK public signal and nullifier compatibility contract',
    owner: 'zk-baseline-open-proof-relations',
    compatibleWith: [
      'address-portal-user-control',
      'basic-pos-terminal',
      'privacy-security-release-gates',
      'developer-docs-research-and-test-vectors',
    ],
    stableArtifacts: [
      'circuits/**',
      'src/lib/zkProofRuntime.ts',
      'src/lib/zkProofCompatibility.ts',
      'src/lib/zkProofBundleRegistry.ts',
      'src/lib/addressDuplicateNullifier.ts',
      'src/lib/aoidOwnershipProof.ts',
    ],
    publicSchema: 'Proof version, scope, challenge, public signals, validity window, domain-separated nullifier, and proof bundle manifest.',
    requiredReleaseGates: ['public-signal-leakage-tests', 'proof-bundle-compatibility-tests', 'witness-hygiene-tests', 'domain-separated-nullifier-tests'],
    mustNotImport: [...COMMERCIAL_BOUNDARY_IDS],
    privacyBoundary: [
      'Current TypeScript objects are ZK-ready envelopes unless a real prover generated the proof.',
      'Witnesses, private addresses, raw address text, raw AOID bodies, and private proof salts are never public compatibility material.',
    ],
    adapterRules: [
      'Managed prover adapters consume the public schema but cannot redefine public signals.',
      'Verifier-only adapters must reject proofs with mismatched scope, challenge, or validity window.',
    ],
  },
  {
    id: 'openapi-sdk-fixture-contract',
    label: 'OpenAPI, SDK, docs, and fixture release contract',
    owner: 'developer-docs-research-and-test-vectors',
    compatibleWith: [
      'agid-aoid-public-standards',
      'local-resolver-address-display',
      'address-registration-and-element',
      'basic-pos-terminal',
      'address-portal-user-control',
      'privacy-security-release-gates',
      'zk-baseline-open-proof-relations',
    ],
    stableArtifacts: [
      'README.md',
      'CONTRIBUTING.md',
      'LICENSE_POLICY.md',
      'DATA_LICENSES.md',
      'src/lib/openApiSpec.ts',
      'src/lib/apiEndpoints.ts',
      'sdk/agid-spec/test-vectors.json',
    ],
    publicSchema: 'OpenAPI 3.1 contract, SDK parity vectors, fixture policy, documented modes, and compatibility release notes.',
    requiredReleaseGates: ['openapi-schema-tests', 'sdk-test-vector-parity', 'data-license-review', 'claim-boundary-review'],
    mustNotImport: [...COMMERCIAL_BOUNDARY_IDS],
    privacyBoundary: [
      'Documentation fixtures use synthetic or redacted payloads only; no raw address fixture is required for interoperability.',
      'The public contract documents local-only, self-hosted, ZK-only, Ethereum-optional, and hosted modes distinctly.',
    ],
    adapterRules: [
      'All OSS adapters link to public schemas rather than private hosted behavior.',
      'Commercial documentation may extend, but not replace, the OSS compatibility contract.',
    ],
  },
];

export const OPEN_SOURCE_INTEROP_EDGES: OpenSourceInteropEdge[] = [
  {
    from: 'agid-aoid-public-standards',
    to: 'local-resolver-address-display',
    contract: 'agid-codec-test-vector-contract',
    mode: 'local-only',
    payload: 'AGID decode/cell bounds into local display and validation evidence',
    redactedByDefault: true,
    testRefs: ['src/lib/agidLocalResolver.test.ts', 'src/lib/addressDisplay.test.ts'],
  },
  {
    from: 'local-resolver-address-display',
    to: 'address-registration-and-element',
    contract: 'local-resolver-decision-contract',
    mode: 'local-only',
    payload: 'country/language display, evidence class, decision state, next action',
    redactedByDefault: true,
    testRefs: ['src/components/AddressRegistration.test.ts', 'src/lib/addressElement.test.ts'],
  },
  {
    from: 'address-registration-and-element',
    to: 'basic-pos-terminal',
    contract: 'safe-address-session-contract',
    mode: 'offline-first',
    payload: 'AddressIntent preview and safe session reference for scan-to-decision',
    redactedByDefault: true,
    testRefs: ['src/lib/addressIntent.test.ts', 'src/lib/posAcceptance.test.ts'],
  },
  {
    from: 'address-portal-user-control',
    to: 'address-registration-and-element',
    contract: 'consent-scope-envelope-contract',
    mode: 'local-only',
    payload: 'purpose scope, revocation state, and export/delete authority',
    redactedByDefault: true,
    testRefs: ['src/lib/addressPortal.test.ts', 'src/lib/addressAccessAuth.test.ts'],
  },
  {
    from: 'basic-pos-terminal',
    to: 'address-portal-user-control',
    contract: 'qr-nfc-handoff-receipt-contract',
    mode: 'offline-first',
    payload: 'signed receipt commitment, reason code, jti, and redacted terminal context',
    redactedByDefault: true,
    testRefs: ['src/lib/posOperationalControls.test.ts', 'src/lib/addressPortal.test.ts'],
  },
  {
    from: 'zk-baseline-open-proof-relations',
    to: 'basic-pos-terminal',
    contract: 'zk-public-signal-nullifier-contract',
    mode: 'zk-ready',
    payload: 'public signal schema and domain-separated nullifier for local verification',
    redactedByDefault: true,
    testRefs: ['src/lib/zkProofCompatibility.test.ts', 'src/lib/zkOnlyMode.test.ts'],
  },
  {
    from: 'privacy-security-release-gates',
    to: 'address-registration-and-element',
    contract: 'no-raw-address-release-gate-contract',
    mode: 'self-hosted',
    payload: 'forbidden field list and release gate result',
    redactedByDefault: true,
    testRefs: ['src/lib/noRawAddressReleaseScan.test.ts', 'src/lib/publicPrivateSeparation.test.ts'],
  },
  {
    from: 'developer-docs-research-and-test-vectors',
    to: 'agid-aoid-public-standards',
    contract: 'openapi-sdk-fixture-contract',
    mode: 'self-hosted',
    payload: 'OpenAPI, SDK vectors, fixture policy, and conformance docs',
    redactedByDefault: true,
    testRefs: ['src/lib/openApiSpec.test.ts', 'scripts/generate-agid-sdks.test.ts'],
  },
];

function cloneContract(contract: OpenSourceCompatibilityContract): OpenSourceCompatibilityContract {
  return {
    ...contract,
    compatibleWith: [...contract.compatibleWith],
    stableArtifacts: [...contract.stableArtifacts],
    requiredReleaseGates: [...contract.requiredReleaseGates],
    mustNotImport: [...contract.mustNotImport],
    privacyBoundary: [...contract.privacyBoundary],
    adapterRules: [...contract.adapterRules],
  };
}

function cloneEdge(edge: OpenSourceInteropEdge): OpenSourceInteropEdge {
  return {
    ...edge,
    testRefs: [...edge.testRefs],
  };
}

export function getOpenSourceCompatibilityManifest(): OpenSourceCompatibilityManifest {
  const components = getSourceBoundaryEntriesByKind('open-source')
    .map(entry => entry.id as OpenSourceComponentId);

  return {
    version: OPEN_SOURCE_COMPATIBILITY_VERSION,
    principle: 'Strengthen OSS-to-OSS compatibility by making every public AGID/AOID layer depend on stable redacted contracts, fixtures, test vectors, and local-first adapter rules rather than hosted implementation details.',
    components,
    contracts: OPEN_SOURCE_COMPATIBILITY_CONTRACTS.map(cloneContract),
    interopEdges: OPEN_SOURCE_INTEROP_EDGES.map(cloneEdge),
    hardRules: [...OPEN_SOURCE_COMPATIBILITY_HARD_RULES],
  };
}

export function summarizeOpenSourceCompatibility(manifest = getOpenSourceCompatibilityManifest()) {
  const contractOwners = new Set(manifest.contracts.map(contract => contract.owner));
  const edgeComponents = new Set<OpenSourceComponentId>();
  for (const edge of manifest.interopEdges) {
    edgeComponents.add(edge.from);
    edgeComponents.add(edge.to);
  }

  return {
    version: manifest.version,
    componentCount: manifest.components.length,
    contractCount: manifest.contracts.length,
    interopEdgeCount: manifest.interopEdges.length,
    componentsOwningContracts: contractOwners.size,
    componentsWithInteropEdges: edgeComponents.size,
    localOnlyEdges: manifest.interopEdges.filter(edge => edge.mode === 'local-only').length,
    offlineFirstEdges: manifest.interopEdges.filter(edge => edge.mode === 'offline-first').length,
    zkReadyEdges: manifest.interopEdges.filter(edge => edge.mode === 'zk-ready').length,
    allEdgesRedactedByDefault: manifest.interopEdges.every(edge => edge.redactedByDefault),
  };
}

export function buildOpenSourceCompatibilityMatrix(manifest = getOpenSourceCompatibilityManifest()) {
  return manifest.components.map(component => ({
    component,
    ownsContracts: manifest.contracts
      .filter(contract => contract.owner === component)
      .map(contract => contract.id),
    consumesContracts: manifest.contracts
      .filter(contract => contract.compatibleWith.includes(component))
      .map(contract => contract.id),
    outboundEdges: manifest.interopEdges
      .filter(edge => edge.from === component)
      .map(edge => ({ to: edge.to, contract: edge.contract, mode: edge.mode })),
    inboundEdges: manifest.interopEdges
      .filter(edge => edge.to === component)
      .map(edge => ({ from: edge.from, contract: edge.contract, mode: edge.mode })),
  }));
}

export function renderOpenSourceCompatibilityMermaid(manifest = getOpenSourceCompatibilityManifest()) {
  const lines = [
    'flowchart LR',
    '  subgraph OSS["Open-source compatibility contracts"]',
    ...manifest.contracts.map(contract => `    ${contract.id.replace(/-/g, '_')}["${contract.label}"]`),
    '  end',
  ];

  for (const edge of manifest.interopEdges) {
    lines.push(
      `  ${edge.from.replace(/-/g, '_')}["${edge.from}"] -->|${edge.mode}: ${edge.contract}| ${edge.to.replace(/-/g, '_')}["${edge.to}"]`,
    );
  }

  return lines.join('\n');
}

export function validateOpenSourceCompatibilityManifest(
  manifest = getOpenSourceCompatibilityManifest(),
): OpenSourceCompatibilityValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const componentSet = new Set(manifest.components);
  const contractSet = new Set<OpenSourceContractId>();
  const openBoundaryIds = getSourceBoundaryEntriesByKind('open-source').map(entry => entry.id);

  for (const id of openBoundaryIds) {
    if (!componentSet.has(id as OpenSourceComponentId)) errors.push(`missing-open-source-component:${id}`);
  }

  for (const component of manifest.components) {
    if (!openBoundaryIds.includes(component)) errors.push(`component-not-open-source-boundary:${component}`);
  }

  for (const contract of manifest.contracts) {
    if (contractSet.has(contract.id)) errors.push(`duplicate-contract:${contract.id}`);
    contractSet.add(contract.id);

    if (!componentSet.has(contract.owner)) errors.push(`contract-owner-not-component:${contract.id}`);
    if (!contract.compatibleWith.length) errors.push(`contract-without-consumers:${contract.id}`);
    if (!contract.stableArtifacts.length) errors.push(`contract-without-artifacts:${contract.id}`);
    if (!contract.requiredReleaseGates.length) errors.push(`contract-without-release-gates:${contract.id}`);
    if (!contract.adapterRules.length) errors.push(`contract-without-adapter-rules:${contract.id}`);
    if (!contract.privacyBoundary.some(rule => /raw address|raw AOID|AGID-S payload|private/i.test(rule))) {
      errors.push(`contract-without-private-data-boundary:${contract.id}`);
    }
    if (!contract.mustNotImport.some(item => item.includes('hosted') || item.includes('managed') || item.includes('commercial'))) {
      errors.push(`contract-without-commercial-import-ban:${contract.id}`);
    }

    for (const consumer of contract.compatibleWith) {
      if (!componentSet.has(consumer)) errors.push(`contract-consumer-not-component:${contract.id}:${consumer}`);
    }

    for (const artifact of contract.stableArtifacts) {
      if (artifact.includes('/commercial/') || artifact.includes('services/commercial')) {
        errors.push(`contract-artifact-crosses-commercial-boundary:${contract.id}:${artifact}`);
      }
    }
  }

  for (const edge of manifest.interopEdges) {
    if (!componentSet.has(edge.from)) errors.push(`edge-from-not-component:${edge.from}`);
    if (!componentSet.has(edge.to)) errors.push(`edge-to-not-component:${edge.to}`);
    if (!contractSet.has(edge.contract)) errors.push(`edge-contract-missing:${edge.contract}`);
    if (!edge.redactedByDefault) errors.push(`edge-not-redacted-by-default:${edge.from}->${edge.to}`);
    if (!edge.testRefs.length) errors.push(`edge-without-tests:${edge.from}->${edge.to}`);
  }

  const matrix = buildOpenSourceCompatibilityMatrix(manifest);
  for (const row of matrix) {
    if (!row.ownsContracts.length && !row.consumesContracts.length && !row.inboundEdges.length && !row.outboundEdges.length) {
      warnings.push(`isolated-open-source-component:${row.component}`);
    }
  }

  const hardRules = manifest.hardRules.join('\n').toLowerCase();
  for (const phrase of ['mode 0 local only', 'must not import commercial', 'no-raw-address']) {
    if (!hardRules.includes(phrase.replace(/-/g, ' ')) && !hardRules.includes(phrase)) {
      errors.push(`missing-hard-rule:${phrase}`);
    }
  }

  const requiredContracts: OpenSourceContractId[] = [
    'agid-codec-test-vector-contract',
    'local-resolver-decision-contract',
    'safe-address-session-contract',
    'consent-scope-envelope-contract',
    'qr-nfc-handoff-receipt-contract',
    'no-raw-address-release-gate-contract',
    'zk-public-signal-nullifier-contract',
    'openapi-sdk-fixture-contract',
  ];
  for (const required of requiredContracts) {
    if (!contractSet.has(required)) errors.push(`missing-required-contract:${required}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
