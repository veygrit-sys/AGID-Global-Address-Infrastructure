import {
  getSourceBoundaryEntry,
  type SourceBoundaryEntry,
} from '../lib/sourceBoundary';

export const BACKEND_ONLY_OPEN_SOURCE_VERSION = 'agid-backend-only-open-source-v1';

export type BackendOnlyLayer =
  | 'api-route'
  | 'cli-job'
  | 'data-pack'
  | 'schema-contract'
  | 'ledger'
  | 'verifier'
  | 'adapter-contract';

export type BackendExternalNetworkPolicy =
  | 'none'
  | 'optional-user-configured'
  | 'dry-run-fixture-only';

export type BackendAccuracyTier =
  | 'deterministic'
  | 'source-backed'
  | 'candidate-scored'
  | 'manual-required';

export type BackendAccuracySignal =
  | 'schema-validation'
  | 'conformance-tests'
  | 'sdk-parity-vectors'
  | 'source-freshness'
  | 'official-source-priority'
  | 'open-data-license'
  | 'postcode-regex'
  | 'admin-hierarchy-match'
  | 'coordinate-or-agid-cell'
  | 'redacted-ledger'
  | 'no-raw-address-gate'
  | 'replay-protection'
  | 'signature-verification'
  | 'retry-policy'
  | 'confidence-reason-codes'
  | 'fallback-state';

export type BackendReadiness = 'publish-ready' | 'needs-fixture' | 'blocked';

export type BackendOnlyOpenSourceCapability = {
  id: string;
  label: string;
  purpose: string;
  layer: BackendOnlyLayer;
  sourceBoundaryIds: string[];
  currentPaths: string[];
  publicArtifacts: string[];
  backendOutputs: string[];
  noUiContract: true;
  externalNetworkPolicy: BackendExternalNetworkPolicy;
  accuracyTier: BackendAccuracyTier;
  accuracySignals: BackendAccuracySignal[];
  releaseGates: string[];
  forbiddenMaterial: string[];
  fallbackBehavior: string;
  minimumSourceEvidence: string[];
  nextBackendStep: string;
};

export type BackendOnlyOpenSourceManifest = {
  version: typeof BACKEND_ONLY_OPEN_SOURCE_VERSION;
  principle: string;
  capabilities: BackendOnlyOpenSourceCapability[];
  hardRules: string[];
};

export type BackendOnlyOpenSourceEvaluation = {
  id: string;
  readiness: BackendReadiness;
  score: number;
  errors: string[];
  warnings: string[];
  sourceBoundaries: Pick<SourceBoundaryEntry, 'id' | 'boundary' | 'license'>[];
};

const FORBIDDEN_BACKEND_MATERIAL = [
  'raw address',
  'raw AOID',
  'AGID-S payload',
  'recipient secret',
  'proof code',
  'private key',
  'PIN',
  'passport-name payload',
];

export const BACKEND_ONLY_OPEN_SOURCE_HARD_RULES = [
  'Backend-only OSS modules expose API, CLI, job, data-pack, ledger, schema, or verifier contracts; they do not depend on React screens or browser-only state.',
  'Backend-only OSS outputs use AGID, AOID reference, alias, commitment, receipt, cause code, confidence, source id, or redacted event shapes by default.',
  'No backend-only OSS capability may require raw address, raw AOID, AGID-S payload, recipient secret, proof code, PIN, private key, or passport-name payload as a public artifact.',
  'External network access must be optional, user-configured, dry-run, or fixture-based; tests must not send production traffic.',
  'Accuracy is reported as deterministic, source-backed, candidate-scored, or manual-required with reason codes and fallback behavior.',
  'Commercial connectors may consume these contracts, but the open-source backend contract must remain self-hostable and independently testable.',
];

export const BACKEND_ONLY_OPEN_SOURCE_CAPABILITIES: BackendOnlyOpenSourceCapability[] = [
  {
    id: 'backend-agid-resolver-conformance',
    label: 'AGID resolver conformance and parity vectors',
    purpose: 'Keep AGID/AOID encode, decode, cell bounds, and resolver behavior reproducible across backend runtimes and SDKs.',
    layer: 'verifier',
    sourceBoundaryIds: [
      'agid-aoid-public-standards',
      'developer-docs-research-and-test-vectors',
      'privacy-security-release-gates',
    ],
    currentPaths: [
      'src/lib/agid.ts',
      'src/lib/aoid.ts',
      'src/lib/agidResolverConformance.ts',
      'scripts/export-agid-resolver-conformance-tests.ts',
      'sdk/agid-spec/test-vectors.json',
    ],
    publicArtifacts: [
      'AGID codec vectors',
      'AOID reference vectors',
      'resolver conformance report',
      'SDK parity fixtures',
    ],
    backendOutputs: [
      'agid',
      'cell bounds',
      'sdk parity status',
      'conformance receipt',
    ],
    noUiContract: true,
    externalNetworkPolicy: 'none',
    accuracyTier: 'deterministic',
    accuracySignals: [
      'schema-validation',
      'conformance-tests',
      'sdk-parity-vectors',
      'coordinate-or-agid-cell',
      'no-raw-address-gate',
    ],
    releaseGates: [
      'sdk-test-vector-parity',
      'agid-resolver-conformance-tests',
      'no-private-aoid-public-vectors',
    ],
    forbiddenMaterial: [...FORBIDDEN_BACKEND_MATERIAL],
    fallbackBehavior: 'Reject mismatched vectors and keep the previous published spec version.',
    minimumSourceEvidence: [
      'versioned agid-spec',
      'generated parity vectors',
      'test runner receipt',
    ],
    nextBackendStep: 'Publish the conformance report as a backend artifact before each SDK release.',
  },
  {
    id: 'backend-secure-address-qr-verifier',
    label: 'Secure Address QR verifier and receipt core',
    purpose: 'Verify QR/NFC handoff envelopes and emit receipts without exposing the human-readable address body.',
    layer: 'verifier',
    sourceBoundaryIds: [
      'basic-pos-terminal',
      'address-portal-user-control',
      'privacy-security-release-gates',
    ],
    currentPaths: [
      'src/lib/secureAddressQr.ts',
      'src/lib/shippingLabelQr.ts',
      'src/lib/agidSecurePos.ts',
      'src/lib/posOfflineUsageLedger.ts',
      'src/server/posAgidSecureRegistryAdapters.ts',
    ],
    publicArtifacts: [
      'redacted QR envelope schema',
      'receipt hash schema',
      'offline mark-used fixture',
    ],
    backendOutputs: [
      'alias',
      'commitment',
      'receipt hash',
      'expiry',
      'handoff decision',
    ],
    noUiContract: true,
    externalNetworkPolicy: 'none',
    accuracyTier: 'deterministic',
    accuracySignals: [
      'schema-validation',
      'conformance-tests',
      'signature-verification',
      'replay-protection',
      'redacted-ledger',
      'no-raw-address-gate',
    ],
    releaseGates: [
      'secure-address-qr-tests',
      'qr-copy-replay-tests',
      'terminal-signature-tests',
      'offline-queue-redaction-tests',
    ],
    forbiddenMaterial: [...FORBIDDEN_BACKEND_MATERIAL],
    fallbackBehavior: 'Return a redacted cause code and require a fresh QR when expiry or replay checks fail.',
    minimumSourceEvidence: [
      'signed test envelope',
      'receipt fixture',
      'no-raw-address scan',
    ],
    nextBackendStep: 'Add registry-backed nullifier checks behind the same public receipt contract.',
  },
  {
    id: 'backend-address-resolution-pipeline',
    label: 'Address resolution pipeline API',
    purpose: 'Resolve AGID, coordinate, postcode, building, and natural feature evidence into Verified, Partial, or Manual required decisions.',
    layer: 'api-route',
    sourceBoundaryIds: [
      'local-resolver-address-display',
      'developer-docs-research-and-test-vectors',
      'privacy-security-release-gates',
    ],
    currentPaths: [
      'src/server/routes/addressResolutionSystemRoutes.ts',
      'src/lib/addressResolutionSystem.ts',
      'src/lib/addressVerificationEngine.ts',
      'src/lib/addressStandardLibraryResolver.ts',
      'src/lib/federatedResolver.ts',
    ],
    publicArtifacts: [
      'resolver decision schema',
      'country policy coverage report',
      'redacted source evidence list',
    ],
    backendOutputs: [
      'Verified / Partial / Manual required',
      'confidence reason codes',
      'source ids',
      'next action',
    ],
    noUiContract: true,
    externalNetworkPolicy: 'optional-user-configured',
    accuracyTier: 'source-backed',
    accuracySignals: [
      'schema-validation',
      'source-freshness',
      'official-source-priority',
      'postcode-regex',
      'admin-hierarchy-match',
      'coordinate-or-agid-cell',
      'confidence-reason-codes',
      'fallback-state',
      'no-raw-address-gate',
    ],
    releaseGates: [
      'address-resolution-system-tests',
      'country-format-tests',
      'provider-fallback-tests',
      'no-raw-address-release-suite',
    ],
    forbiddenMaterial: [...FORBIDDEN_BACKEND_MATERIAL],
    fallbackBehavior: 'Downgrade to Partial or Manual required instead of fabricating certainty when sources disagree.',
    minimumSourceEvidence: [
      'country format policy',
      'source freshness timestamp',
      'confidence reason code',
    ],
    nextBackendStep: 'Persist source freshness and per-provider disagreement counts in the backend ledger.',
  },
  {
    id: 'backend-country-pack-validator',
    label: 'Country pack and address-format validator',
    purpose: 'Treat YAML address formats as editable source and JSON as generated delivery artifacts with reproducible validation.',
    layer: 'data-pack',
    sourceBoundaryIds: [
      'local-resolver-address-display',
      'developer-docs-research-and-test-vectors',
      'privacy-security-release-gates',
    ],
    currentPaths: [
      'src/server/addressFormatFileLoader.ts',
      'src/data/address_formats/**',
      'scripts/sync-address-metadata.ts',
      'scripts/organize-address-formats.ts',
      'scripts/generate-address-format-yaml.ts',
    ],
    publicArtifacts: [
      'address format YAML',
      'generated address format JSON',
      'country coverage report',
      'data license notes',
    ],
    backendOutputs: [
      'country pack status',
      'postal rule status',
      'language-tab compatibility status',
      'source license status',
    ],
    noUiContract: true,
    externalNetworkPolicy: 'dry-run-fixture-only',
    accuracyTier: 'source-backed',
    accuracySignals: [
      'schema-validation',
      'source-freshness',
      'official-source-priority',
      'open-data-license',
      'postcode-regex',
      'admin-hierarchy-match',
      'fallback-state',
      'no-raw-address-gate',
    ],
    releaseGates: [
      'yaml-source-json-delivery',
      'address-format-rules-json-tests',
      'data-license-review',
      'country-pack-coverage-tests',
    ],
    forbiddenMaterial: [...FORBIDDEN_BACKEND_MATERIAL],
    fallbackBehavior: 'Keep the previous generated JSON pack when a YAML source or license review fails.',
    minimumSourceEvidence: [
      'source URL or local provenance',
      'license note',
      'generatedAt/version',
    ],
    nextBackendStep: 'Add a backend report that lists stale country packs by region shard.',
  },
  {
    id: 'backend-postal-forge-pack-generator',
    label: 'Postal Forge country-pack generator',
    purpose: 'Generate candidate postal zones and country packs without bundling heavy geodata into the app.',
    layer: 'cli-job',
    sourceBoundaryIds: [
      'local-resolver-address-display',
      'developer-docs-research-and-test-vectors',
      'privacy-security-release-gates',
    ],
    currentPaths: [
      'src/lib/agidPostalCodeEngine.ts',
      'src/lib/agidPostalCountryPack.ts',
      'src/lib/agidPostalForgeDatasetPack.ts',
      'scripts/export-agid-postal-country-pack.ts',
      'scripts/export-agid-postal-forge-oss-dataset-pack.ts',
    ],
    publicArtifacts: [
      'country pack index',
      'postal zone fixture',
      'source-license index',
      'quality gate report',
    ],
    backendOutputs: [
      'official / open-data / osm-derived / agid-generated source class',
      'zone confidence',
      'successor/deprecated code hints',
      'manual review queue',
    ],
    noUiContract: true,
    externalNetworkPolicy: 'dry-run-fixture-only',
    accuracyTier: 'candidate-scored',
    accuracySignals: [
      'schema-validation',
      'source-freshness',
      'open-data-license',
      'coordinate-or-agid-cell',
      'confidence-reason-codes',
      'fallback-state',
      'no-raw-address-gate',
    ],
    releaseGates: [
      'postal-forge-pack-tests',
      'postal-country-pack-tests',
      'source-license-index-tests',
      'manual-review-required-for-generated-zones',
    ],
    forbiddenMaterial: [...FORBIDDEN_BACKEND_MATERIAL],
    fallbackBehavior: 'Publish generated zones as candidate-scored only; keep official postal code behavior untouched.',
    minimumSourceEvidence: [
      'country shard id',
      'source class',
      'quality score',
      'manual-review flag',
    ],
    nextBackendStep: 'Run one country at a time and publish a pack diff instead of a global update.',
  },
  {
    id: 'backend-openapi-sdk-release',
    label: 'OpenAPI and SDK backend release contract',
    purpose: 'Make backend contracts consumable by generated SDKs while keeping fixtures synthetic and privacy-safe.',
    layer: 'schema-contract',
    sourceBoundaryIds: [
      'agid-aoid-public-standards',
      'developer-docs-research-and-test-vectors',
      'privacy-security-release-gates',
    ],
    currentPaths: [
      'src/lib/openApiSpec.ts',
      'src/lib/apiEndpoints.ts',
      'scripts/generate-agid-sdks.ts',
      'sdk/agid-spec/**',
      'sdk/agid-*/**',
    ],
    publicArtifacts: [
      'OpenAPI 3.1 schema',
      'SDK parity manifest',
      'safe sample request/response fixtures',
    ],
    backendOutputs: [
      'OpenAPI version',
      'SDK target matrix',
      'parity vector status',
      'breaking-change receipt',
    ],
    noUiContract: true,
    externalNetworkPolicy: 'none',
    accuracyTier: 'deterministic',
    accuracySignals: [
      'schema-validation',
      'conformance-tests',
      'sdk-parity-vectors',
      'no-raw-address-gate',
      'fallback-state',
    ],
    releaseGates: [
      'openapi-schema-tests',
      'sdk-test-vector-parity',
      'fixture-redaction-tests',
      'semver-breaking-change-review',
    ],
    forbiddenMaterial: [...FORBIDDEN_BACKEND_MATERIAL],
    fallbackBehavior: 'Block release if generated SDK fixtures diverge from the spec vectors.',
    minimumSourceEvidence: [
      'openapi schema version',
      'sdk target manifest',
      'fixture redaction receipt',
    ],
    nextBackendStep: 'Use the same backend contract to generate per-language SDK smoke tests.',
  },
  {
    id: 'backend-zk-nullifier-verifier',
    label: 'ZK verifier, freshness, and nullifier backend',
    purpose: 'Verify public proof bundles, freshness roots, and nullifiers without exposing witnesses or private address material.',
    layer: 'verifier',
    sourceBoundaryIds: [
      'zk-baseline-open-proof-relations',
      'address-portal-user-control',
      'privacy-security-release-gates',
    ],
    currentPaths: [
      'src/server/routes/zkOnlyModeRoutes.ts',
      'src/server/routes/zkProofBundleRoutes.ts',
      'src/lib/zkProofRuntime.ts',
      'src/lib/zkProofBundleRegistry.ts',
      'src/lib/addressDuplicateNullifier.ts',
      'src/lib/revocationFreshnessRootAnchoring.ts',
    ],
    publicArtifacts: [
      'public signal schema',
      'nullifier replay fixture',
      'freshness root verification report',
    ],
    backendOutputs: [
      'proof status',
      'scope',
      'challenge',
      'nullifier status',
      'freshness status',
    ],
    noUiContract: true,
    externalNetworkPolicy: 'none',
    accuracyTier: 'deterministic',
    accuracySignals: [
      'schema-validation',
      'conformance-tests',
      'replay-protection',
      'signature-verification',
      'redacted-ledger',
      'no-raw-address-gate',
    ],
    releaseGates: [
      'public-signal-leakage-tests',
      'proof-bundle-compatibility-tests',
      'domain-separated-nullifier-tests',
      'witness-hygiene-tests',
    ],
    forbiddenMaterial: [...FORBIDDEN_BACKEND_MATERIAL, 'witness'],
    fallbackBehavior: 'Reject unverifiable proof bundles and return only a scoped cause code.',
    minimumSourceEvidence: [
      'proof bundle manifest',
      'public signal schema',
      'nullifier domain',
    ],
    nextBackendStep: 'Add scheduled freshness-root audit receipts to the same backend ledger.',
  },
  {
    id: 'backend-redacted-evidence-ledger',
    label: 'Redacted evidence and audit ledger',
    purpose: 'Record address, POS, QR, connector, and resolver events as redacted receipts rather than raw personal records.',
    layer: 'ledger',
    sourceBoundaryIds: [
      'privacy-security-release-gates',
      'address-portal-user-control',
      'developer-docs-research-and-test-vectors',
    ],
    currentPaths: [
      'src/server/addressResolutionLedgerStore.ts',
      'src/lib/addressEvidenceVault.ts',
      'src/lib/redactedAuditReportViewer.ts',
      'src/lib/offlineSyncCenter.ts',
      'src/lib/publicPrivateSeparation.ts',
    ],
    publicArtifacts: [
      'redacted event schema',
      'audit receipt schema',
      'offline sync conflict fixture',
    ],
    backendOutputs: [
      'event id',
      'commitment',
      'receipt hash',
      'actor scope',
      'redacted cause code',
    ],
    noUiContract: true,
    externalNetworkPolicy: 'none',
    accuracyTier: 'source-backed',
    accuracySignals: [
      'schema-validation',
      'redacted-ledger',
      'replay-protection',
      'confidence-reason-codes',
      'fallback-state',
      'no-raw-address-gate',
    ],
    releaseGates: [
      'public-private-separation-tests',
      'redacted-audit-report-tests',
      'offline-sync-conflict-tests',
      'no-raw-address-release-suite',
    ],
    forbiddenMaterial: [...FORBIDDEN_BACKEND_MATERIAL],
    fallbackBehavior: 'Store a blocked/redacted event with next action when the input contains forbidden material.',
    minimumSourceEvidence: [
      'event schema version',
      'actor scope',
      'redaction receipt',
    ],
    nextBackendStep: 'Normalize all backend route audits to this redacted event vocabulary.',
  },
  {
    id: 'backend-connector-contracts',
    label: 'Backend connector contracts for POS, OPERA, delivery, translation, libpostal, and DB',
    purpose: 'Organize external integrations as backend contracts with per-connector auth, no-cache fetch, no unsafe retry, and redacted errors.',
    layer: 'adapter-contract',
    sourceBoundaryIds: [
      'basic-pos-terminal',
      'privacy-security-release-gates',
      'developer-docs-research-and-test-vectors',
    ],
    currentPaths: [
      'src/server/routeSecurity.ts',
      'src/server/proxySecurity.ts',
      'src/server/routes/externalPosRoutes.ts',
      'src/server/routes/externalDeliveryApiRoutes.ts',
      'src/server/routes/oracleOperaRoutes.ts',
      'src/server/routes/cloudDbRoutes.ts',
      'src/lib/externalPosIntegration.ts',
      'src/lib/externalDeliveryApi.ts',
    ],
    publicArtifacts: [
      'connector capability schema',
      'redacted error schema',
      'auth policy fixture',
      'retry policy fixture',
    ],
    backendOutputs: [
      'connector capability',
      'safe cause code',
      'sync queue state',
      'audit receipt',
    ],
    noUiContract: true,
    externalNetworkPolicy: 'optional-user-configured',
    accuracyTier: 'source-backed',
    accuracySignals: [
      'schema-validation',
      'signature-verification',
      'retry-policy',
      'redacted-ledger',
      'confidence-reason-codes',
      'fallback-state',
      'no-raw-address-gate',
    ],
    releaseGates: [
      'per-connector-auth-tests',
      'no-cache-connector-fetch',
      'no-unsafe-retry',
      'redacted-error-contract',
      'dead-letter-queue-fixture',
    ],
    forbiddenMaterial: [...FORBIDDEN_BACKEND_MATERIAL, 'Oracle raw error'],
    fallbackBehavior: 'Queue a redacted failure receipt and forbid unsafe retry when connector policy is incomplete.',
    minimumSourceEvidence: [
      'connector policy',
      'auth mode',
      'retry mode',
      'redacted error fixture',
    ],
    nextBackendStep: 'Split each connector mapper by endpoint family and bind it to this policy matrix.',
  },
  {
    id: 'backend-natural-feature-context',
    label: 'Sea, mountain, water, island, and polar context resolver',
    purpose: 'Use open geo evidence to classify non-standard delivery contexts before UI-specific display work.',
    layer: 'api-route',
    sourceBoundaryIds: [
      'local-resolver-address-display',
      'developer-docs-research-and-test-vectors',
      'privacy-security-release-gates',
    ],
    currentPaths: [
      'src/services/NatureService.ts',
      'src/services/SeaService.ts',
      'src/services/PolarService.ts',
      'src/lib/naturalAddress.ts',
      'src/lib/mapFeatureAddress.ts',
    ],
    publicArtifacts: [
      'natural feature context schema',
      'source confidence fixture',
      'manual-review reason codes',
    ],
    backendOutputs: [
      'feature class',
      'source confidence',
      'AGID cell',
      'manual review state',
    ],
    noUiContract: true,
    externalNetworkPolicy: 'dry-run-fixture-only',
    accuracyTier: 'candidate-scored',
    accuracySignals: [
      'schema-validation',
      'source-freshness',
      'open-data-license',
      'coordinate-or-agid-cell',
      'confidence-reason-codes',
      'fallback-state',
      'no-raw-address-gate',
    ],
    releaseGates: [
      'natural-address-tests',
      'sea-mountain-water-fixtures',
      'source-license-review',
      'manual-review-required-for-low-confidence',
    ],
    forbiddenMaterial: [...FORBIDDEN_BACKEND_MATERIAL],
    fallbackBehavior: 'Return Manual required with AGID and feature context when no authoritative address exists.',
    minimumSourceEvidence: [
      'feature type',
      'source class',
      'confidence reason code',
    ],
    nextBackendStep: 'Attach region-pack source freshness to natural feature candidates.',
  },
];

function cloneCapability(capability: BackendOnlyOpenSourceCapability): BackendOnlyOpenSourceCapability {
  return {
    ...capability,
    sourceBoundaryIds: [...capability.sourceBoundaryIds],
    currentPaths: [...capability.currentPaths],
    publicArtifacts: [...capability.publicArtifacts],
    backendOutputs: [...capability.backendOutputs],
    accuracySignals: [...capability.accuracySignals],
    releaseGates: [...capability.releaseGates],
    forbiddenMaterial: [...capability.forbiddenMaterial],
    minimumSourceEvidence: [...capability.minimumSourceEvidence],
  };
}

export function getBackendOnlyOpenSourceManifest(): BackendOnlyOpenSourceManifest {
  return {
    version: BACKEND_ONLY_OPEN_SOURCE_VERSION,
    principle: 'Backend-only OSS for AGID should be self-hostable, testable without production traffic, privacy-safe by default, and accurate through explicit source evidence and fallback states.',
    capabilities: BACKEND_ONLY_OPEN_SOURCE_CAPABILITIES.map(cloneCapability),
    hardRules: [...BACKEND_ONLY_OPEN_SOURCE_HARD_RULES],
  };
}

function hasForbiddenMaterialText(values: string[]) {
  const joined = values.join(' | ').toLowerCase();
  return FORBIDDEN_BACKEND_MATERIAL.some(item => joined.includes(item.toLowerCase()));
}

function boundaryFor(id: string) {
  return getSourceBoundaryEntry(id);
}

export function evaluateBackendOnlyOpenSourceCapability(
  capability: BackendOnlyOpenSourceCapability,
): BackendOnlyOpenSourceEvaluation {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  if (!capability.noUiContract) {
    errors.push('not-backend-only:no-ui-contract-required');
    score -= 35;
  }

  if (capability.currentPaths.some(path => /^src\/components\//.test(path) || /Screen\.tsx$/.test(path))) {
    errors.push('ui-path-in-backend-only-capability');
    score -= 30;
  }

  if (capability.backendOutputs.length === 0) {
    errors.push('missing-backend-outputs');
    score -= 20;
  }

  if (hasForbiddenMaterialText(capability.backendOutputs) || hasForbiddenMaterialText(capability.publicArtifacts)) {
    errors.push('forbidden-material-in-public-output');
    score -= 40;
  }

  const lowerForbidden = capability.forbiddenMaterial.map(item => item.toLowerCase());
  for (const required of ['raw address', 'private key', 'recipient secret']) {
    if (!lowerForbidden.includes(required)) {
      errors.push(`missing-forbidden-material:${required}`);
      score -= 15;
    }
  }

  if (!capability.releaseGates.length) {
    errors.push('missing-release-gates');
    score -= 25;
  }
  if (!capability.accuracySignals.includes('schema-validation')) {
    errors.push('missing-schema-validation-signal');
    score -= 20;
  }
  if (!capability.accuracySignals.includes('no-raw-address-gate')) {
    errors.push('missing-no-raw-address-signal');
    score -= 25;
  }
  if (capability.accuracySignals.length < 5) {
    warnings.push('low-accuracy-signal-count');
    score -= 8;
  }
  if (!capability.minimumSourceEvidence.length) {
    errors.push('missing-minimum-source-evidence');
    score -= 15;
  }
  if (!capability.fallbackBehavior.trim()) {
    errors.push('missing-fallback-behavior');
    score -= 15;
  }
  if (capability.externalNetworkPolicy === 'optional-user-configured'
    && !capability.accuracySignals.includes('fallback-state')) {
    warnings.push('network-capability-without-fallback-state-signal');
    score -= 8;
  }

  const sourceBoundaries: Pick<SourceBoundaryEntry, 'id' | 'boundary' | 'license'>[] = [];
  for (const boundaryId of capability.sourceBoundaryIds) {
    const boundary = boundaryFor(boundaryId);
    if (!boundary) {
      errors.push(`unknown-source-boundary:${boundaryId}`);
      score -= 25;
      continue;
    }
    sourceBoundaries.push({
      id: boundary.id,
      boundary: boundary.boundary,
      license: boundary.license,
    });
    if (boundary.boundary === 'commercial') {
      errors.push(`commercial-boundary-not-allowed:${boundaryId}`);
      score -= 35;
    }
    if (boundary.license === 'Commercial') {
      errors.push(`commercial-license-not-allowed:${boundaryId}`);
      score -= 35;
    }
  }

  const readiness: BackendReadiness = errors.length > 0
    ? 'blocked'
    : score >= 85
      ? 'publish-ready'
      : 'needs-fixture';

  return {
    id: capability.id,
    readiness,
    score: Math.max(0, Math.min(100, score)),
    errors,
    warnings,
    sourceBoundaries,
  };
}

export function evaluateBackendOnlyOpenSourceManifest(
  manifest = getBackendOnlyOpenSourceManifest(),
) {
  const evaluations = manifest.capabilities.map(evaluateBackendOnlyOpenSourceCapability);
  const errors = evaluations.flatMap(item => item.errors.map(error => `${item.id}:${error}`));
  const warnings = evaluations.flatMap(item => item.warnings.map(warning => `${item.id}:${warning}`));
  const averageScore = evaluations.length
    ? Math.round(evaluations.reduce((sum, item) => sum + item.score, 0) / evaluations.length)
    : 0;

  return {
    valid: errors.length === 0,
    version: manifest.version,
    capabilityCount: evaluations.length,
    averageScore,
    publishReadyCount: evaluations.filter(item => item.readiness === 'publish-ready').length,
    needsFixtureCount: evaluations.filter(item => item.readiness === 'needs-fixture').length,
    blockedCount: evaluations.filter(item => item.readiness === 'blocked').length,
    errors,
    warnings,
    evaluations,
  };
}

export function buildBackendOnlyOpenSourceAccuracyMatrix(
  manifest = getBackendOnlyOpenSourceManifest(),
) {
  return manifest.capabilities.map(capability => {
    const evaluation = evaluateBackendOnlyOpenSourceCapability(capability);
    return {
      id: capability.id,
      label: capability.label,
      layer: capability.layer,
      accuracyTier: capability.accuracyTier,
      readiness: evaluation.readiness,
      score: evaluation.score,
      network: capability.externalNetworkPolicy,
      signals: [...capability.accuracySignals],
      gates: [...capability.releaseGates],
      fallback: capability.fallbackBehavior,
      nextBackendStep: capability.nextBackendStep,
    };
  });
}

export function summarizeBackendOnlyOpenSource(
  manifest = getBackendOnlyOpenSourceManifest(),
) {
  const evaluation = evaluateBackendOnlyOpenSourceManifest(manifest);
  const byLayer = new Map<BackendOnlyLayer, number>();
  const byTier = new Map<BackendAccuracyTier, number>();
  for (const capability of manifest.capabilities) {
    byLayer.set(capability.layer, (byLayer.get(capability.layer) ?? 0) + 1);
    byTier.set(capability.accuracyTier, (byTier.get(capability.accuracyTier) ?? 0) + 1);
  }

  return {
    version: manifest.version,
    capabilityCount: manifest.capabilities.length,
    averageScore: evaluation.averageScore,
    publishReadyCount: evaluation.publishReadyCount,
    blockedCount: evaluation.blockedCount,
    byLayer: Object.fromEntries(byLayer.entries()) as Record<BackendOnlyLayer, number>,
    byTier: Object.fromEntries(byTier.entries()) as Record<BackendAccuracyTier, number>,
    externalNetworkOptionalCount: manifest.capabilities
      .filter(capability => capability.externalNetworkPolicy !== 'none').length,
  };
}
