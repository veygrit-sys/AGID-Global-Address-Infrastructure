export const SECURITY_PRIVACY_DESIGN_VERSION = 'security-privacy-design-v1';

export type SecurityPrivacySurface =
  | 'public-agid-api'
  | 'public-agid-qr'
  | 'address-verification'
  | 'aoid-registration'
  | 'aoid-sync'
  | 'zk-proof-public'
  | 'proof-bundle-registry'
  | 'credential-issuer-registry'
  | 'revocation-freshness-anchor'
  | 'delivery-agent'
  | 'mcp-tool'
  | 'audit-log'
  | 'open-source-release';

export type SecurityPrivacyPurpose =
  | 'public-reference'
  | 'address-verification'
  | 'delivery'
  | 'residence'
  | 'ownership'
  | 'pid-audit'
  | 'quality-gate'
  | 'sync'
  | 'agent-access'
  | 'release';

export type SecurityPrivacyDataClass =
  | 'public'
  | 'pseudonymous'
  | 'sensitive'
  | 'secret';

export type SecurityPrivacyRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type SecurityPrivacyDecision = 'allow' | 'allow-with-controls' | 'manual-review' | 'block';

export type SecurityPrivacyDesignInput = {
  surface: SecurityPrivacySurface;
  purpose?: SecurityPrivacyPurpose;
  dataClasses?: SecurityPrivacyDataClass[];
  includesAoid?: boolean;
  includesPlainAddress?: boolean;
  includesRecipient?: boolean;
  includesExactCoordinates?: boolean;
  includesCredential?: boolean;
  includesZkProof?: boolean;
  includesNullifier?: boolean;
  includesRawEvidence?: boolean;
  persistsServerSide?: boolean;
  sharesWithThirdParty?: boolean;
  openSourceRelease?: boolean;
  usesMcpOrAgent?: boolean;
  logsPayload?: boolean;
  storesRawProofs?: boolean;
  encryptedAtRest?: boolean;
  encryptedInTransit?: boolean;
  hasConsentProof?: boolean;
  hasFreshnessProof?: boolean;
  hasRevocationCheck?: boolean;
  hasIssuerTrust?: boolean;
  hasProofBundleCompatibility?: boolean;
};

export type SecurityPrivacyDesignPlan = {
  version: typeof SECURITY_PRIVACY_DESIGN_VERSION;
  policyId: string;
  surface: SecurityPrivacySurface;
  purpose: SecurityPrivacyPurpose;
  dataClasses: SecurityPrivacyDataClass[];
  decision: SecurityPrivacyDecision;
  riskLevel: SecurityPrivacyRiskLevel;
  riskScore: number;
  publicDisclosure: string[];
  forbiddenFields: string[];
  requiredControls: string[];
  requiredProofs: string[];
  storagePolicy: string[];
  auditPolicy: string[];
  errors: string[];
  warnings: string[];
  nextActions: string[];
};

export type ForbiddenSecurityPrivacyFieldOptions = {
  surface?: SecurityPrivacySurface;
};

export type ForbiddenSecurityPrivacyFieldResult = {
  ok: boolean;
  surface: SecurityPrivacySurface;
  forbiddenFields: string[];
};

type SurfaceProfile = {
  defaultPurpose: SecurityPrivacyPurpose;
  baseRisk: number;
  publicDisclosure: string[];
  forbiddenFields: string[];
  requiredControls: string[];
  storagePolicy: string[];
  auditPolicy: string[];
};

const PERSONAL_FIELD_KEYS = [
  'recipient',
  'recipientName',
  'fullName',
  'phone',
  'phoneNumber',
  'room',
  'unit',
  'unitNumber',
  'apartment',
  'flat',
  'suite',
  'floor',
  'accessCode',
  'buildingAccess',
  'deliveryInstruction',
  'deliveryInstructions',
  'privateDeliveryInstruction',
  'accessInstructions',
  'privateNote',
];

const EXACT_LOCATION_FIELD_KEYS = [
  'lat',
  'lon',
  'lng',
  'latitude',
  'longitude',
  'coordinates',
  'exactCoordinates',
  'privateCoordinates',
];

const PROOF_SECRET_FIELD_KEYS = [
  'privateProofSalt',
  'privateMembershipSalt',
  'privateLifecycleSalt',
  'privateAuditSalt',
  'privateSalt',
  'privateIdentityBindingSalt',
  'identitySubjectId',
  'identityPrivateSalt',
  'credentialPrivateSalt',
  'ownerPrivateKey',
  'ownerNullifierSecret',
  'privateKeyJwk',
  'subjectSecret',
  'deviceSecret',
  'ownerSecret',
  'localCacheKey',
];

const RAW_ADDRESS_FIELD_KEYS = [
  'addressText',
  'inputAddress',
  'rawAddress',
  'rawEvidence',
  'rawCandidates',
  'rawClusters',
  'rawValidation',
  'rawSources',
  'userHistory',
  'searchHistory',
  'postalCode',
  'postcode',
];

const SYNC_SECRET_FIELD_KEYS = [
  'ownerKeyId',
  'deviceKeyId',
  'opaqueEncryptedPayload',
  'encryptedPayload',
  'privateOwnershipProof',
];

const PUBLIC_SAFE_DISCLOSURE = [
  'AGID value',
  'coarse public cell or region context',
  'public map-feature labels with source attribution',
  'confidence and unresolved/manual-review state',
];

const SURFACE_PROFILES: Record<SecurityPrivacySurface, SurfaceProfile> = {
  'public-agid-api': {
    defaultPurpose: 'public-reference',
    baseRisk: 20,
    publicDisclosure: PUBLIC_SAFE_DISCLOSURE,
    forbiddenFields: [
      ...PERSONAL_FIELD_KEYS,
      ...PROOF_SECRET_FIELD_KEYS,
      ...RAW_ADDRESS_FIELD_KEYS,
      ...SYNC_SECRET_FIELD_KEYS,
    ],
    requiredControls: [
      'strict-agid-format-validation',
      'no-store-api-cache-headers',
      'privacy-safe-log-redaction',
      'source-attribution-and-confidence',
    ],
    storagePolicy: ['transient-public-response-cache-only'],
    auditPolicy: ['record-source-ids-without-private-query-text'],
  },
  'public-agid-qr': {
    defaultPurpose: 'public-reference',
    baseRisk: 25,
    publicDisclosure: [
      'AGID value',
      'purpose-bound AOID commitment or one-time reference handle when needed',
      'public country or map-feature label',
    ],
    forbiddenFields: [
      ...PERSONAL_FIELD_KEYS,
      ...EXACT_LOCATION_FIELD_KEYS,
      ...PROOF_SECRET_FIELD_KEYS,
      ...RAW_ADDRESS_FIELD_KEYS,
      ...SYNC_SECRET_FIELD_KEYS,
    ],
    requiredControls: [
      'public-qr-redaction',
      'scan-time-private-field-rejection',
      'full-qr-trusted-device-label',
    ],
    storagePolicy: ['public-qr-records-may-be-saved-without-private-fields'],
    auditPolicy: ['public-qr-parser-must-resanitize-imported-payloads'],
  },
  'address-verification': {
    defaultPurpose: 'address-verification',
    baseRisk: 55,
    publicDisclosure: [
      'verification status',
      'score band',
      'source trust tier',
      'next actions',
    ],
    forbiddenFields: [...PROOF_SECRET_FIELD_KEYS],
    requiredControls: [
      'official-source-preference',
      'weak-source-downgrade',
      'country-mismatch-block',
      'unresolved-state-before-pid-or-aoid-binding',
    ],
    storagePolicy: ['raw-address-input-transient-by-default'],
    auditPolicy: ['store-decision-path-not-raw-address-body'],
  },
  'aoid-registration': {
    defaultPurpose: 'ownership',
    baseRisk: 75,
    publicDisclosure: [
      'purpose-bound AOID commitment if explicitly requested',
      'linked AGID only as coarse public anchor',
    ],
    forbiddenFields: [...PROOF_SECRET_FIELD_KEYS, ...SYNC_SECRET_FIELD_KEYS],
    requiredControls: [
      'device-local-default-storage',
      'aoid-ownership-proof',
      'duplicate-nullifier',
      'consent-purpose-scope',
      'public-descriptor-redaction',
    ],
    storagePolicy: [
      'plaintext-aoid-local-only',
      'server-storage-requires-owner-device-encryption',
    ],
    auditPolicy: ['audit-registration-envelope-without-recipient-phone-or-room'],
  },
  'aoid-sync': {
    defaultPurpose: 'sync',
    baseRisk: 85,
    publicDisclosure: [
      'sync status',
      'purpose-bound public reference metadata',
      'encrypted envelope metadata',
    ],
    forbiddenFields: [...PERSONAL_FIELD_KEYS, ...EXACT_LOCATION_FIELD_KEYS, ...PROOF_SECRET_FIELD_KEYS, ...RAW_ADDRESS_FIELD_KEYS],
    requiredControls: [
      'owner-consent-required',
      'owner-device-encryption-required',
      'revocation-supported',
      'plaintext-server-rejection',
    ],
    storagePolicy: [
      'encrypted-cloud-only',
      'never-store-aoid-plaintext-server-side',
    ],
    auditPolicy: ['audit-envelope-id-and-hash-only'],
  },
  'zk-proof-public': {
    defaultPurpose: 'residence',
    baseRisk: 65,
    publicDisclosure: [
      'predicate kind',
      'scope',
      'challenge hash',
      'issuer or trust root',
      'commitments and nullifiers',
    ],
    forbiddenFields: [
      ...PERSONAL_FIELD_KEYS,
      ...EXACT_LOCATION_FIELD_KEYS,
      ...PROOF_SECRET_FIELD_KEYS,
      ...RAW_ADDRESS_FIELD_KEYS,
    ],
    requiredControls: [
      'private-proof-material-stripped',
      'challenge-binding',
      'purpose-scope-binding',
      'domain-separated-nullifiers',
      'freshness-and-revocation-when-credential-backed',
    ],
    storagePolicy: ['public-proof-envelopes-only-after-stripping-local-witness-material'],
    auditPolicy: ['verify-proof-privacy-before-bundle-registration'],
  },
  'proof-bundle-registry': {
    defaultPurpose: 'pid-audit',
    baseRisk: 60,
    publicDisclosure: [
      'bundle id',
      'proof versions',
      'scope',
      'common validity window',
      'hashed commitments and nullifiers',
    ],
    forbiddenFields: [
      ...PERSONAL_FIELD_KEYS,
      ...EXACT_LOCATION_FIELD_KEYS,
      ...PROOF_SECRET_FIELD_KEYS,
      ...RAW_ADDRESS_FIELD_KEYS,
    ],
    requiredControls: [
      'do-not-store-raw-proofs',
      'proof-compatibility-check',
      'duplicate-single-use-nullifier-rejection',
      'common-validity-window-check',
    ],
    storagePolicy: ['store-proof-descriptors-and-hashes-only'],
    auditPolicy: ['record-bundle-manifest-not-witness-data'],
  },
  'credential-issuer-registry': {
    defaultPurpose: 'residence',
    baseRisk: 50,
    publicDisclosure: [
      'issuer id',
      'issuer trust tier',
      'credential type',
      'policy hash',
    ],
    forbiddenFields: [
      ...PERSONAL_FIELD_KEYS,
      ...EXACT_LOCATION_FIELD_KEYS,
      ...PROOF_SECRET_FIELD_KEYS,
      ...RAW_ADDRESS_FIELD_KEYS,
    ],
    requiredControls: [
      'issuer-key-rotation',
      'credential-type-scope-match',
      'country-or-layer-policy-check',
    ],
    storagePolicy: ['issuer-metadata-only-no-subject-records'],
    auditPolicy: ['audit-issuer-policy-version-and-source-ids'],
  },
  'revocation-freshness-anchor': {
    defaultPurpose: 'residence',
    baseRisk: 55,
    publicDisclosure: [
      'revocation root',
      'freshness root',
      'fresh-until timestamp',
      'issuer and credential type',
    ],
    forbiddenFields: [
      ...PERSONAL_FIELD_KEYS,
      ...EXACT_LOCATION_FIELD_KEYS,
      ...PROOF_SECRET_FIELD_KEYS,
      ...RAW_ADDRESS_FIELD_KEYS,
    ],
    requiredControls: [
      'max-freshness-age-policy',
      'revocation-root-commitment',
      'freshness-root-commitment',
      'chain-anchor-commitment-only',
    ],
    storagePolicy: ['root-commitments-only-no-status-list-body-in-public-anchor'],
    auditPolicy: ['audit-source-ids-and-handle-counts-only'],
  },
  'delivery-agent': {
    defaultPurpose: 'delivery',
    baseRisk: 80,
    publicDisclosure: [
      'delivery eligibility result',
      'recipient authorization result',
      'encrypted route or carrier handoff token',
    ],
    forbiddenFields: [
      ...PERSONAL_FIELD_KEYS,
      ...EXACT_LOCATION_FIELD_KEYS,
      ...PROOF_SECRET_FIELD_KEYS,
      ...RAW_ADDRESS_FIELD_KEYS,
    ],
    requiredControls: [
      'zk-delivery-eligibility-proof',
      'consent-purpose-scope',
      'carrier-handoff-minimization',
      'recipient-authentication-without-merchant-address-disclosure',
    ],
    storagePolicy: ['merchant-stores-proof-status-not-raw-address'],
    auditPolicy: ['audit-delivery-proof-id-and-consent-scope'],
  },
  'mcp-tool': {
    defaultPurpose: 'agent-access',
    baseRisk: 70,
    publicDisclosure: [
      'least-privilege tool result',
      'purpose-bound status',
      'redacted address verification summary',
    ],
    forbiddenFields: [
      ...PERSONAL_FIELD_KEYS,
      ...EXACT_LOCATION_FIELD_KEYS,
      ...PROOF_SECRET_FIELD_KEYS,
      ...RAW_ADDRESS_FIELD_KEYS,
      ...SYNC_SECRET_FIELD_KEYS,
    ],
    requiredControls: [
      'explicit-tool-purpose',
      'no-secret-tool-results',
      'redacted-agent-transcript',
      'proof-or-consent-before-private-action',
    ],
    storagePolicy: ['no-agent-persistence-of-private-address-material-by-default'],
    auditPolicy: ['audit-tool-name-purpose-and-redacted-result-hash'],
  },
  'audit-log': {
    defaultPurpose: 'pid-audit',
    baseRisk: 65,
    publicDisclosure: [
      'event type',
      'policy id',
      'redacted decision summary',
      'hashes and source ids',
    ],
    forbiddenFields: [
      ...PERSONAL_FIELD_KEYS,
      ...EXACT_LOCATION_FIELD_KEYS,
      ...PROOF_SECRET_FIELD_KEYS,
      ...RAW_ADDRESS_FIELD_KEYS,
      ...SYNC_SECRET_FIELD_KEYS,
    ],
    requiredControls: [
      'redacted-logging',
      'hash-private-references-before-log',
      'log-retention-policy',
    ],
    storagePolicy: ['store-redacted-events-only'],
    auditPolicy: ['fail-closed-when-private-fields-are-detected'],
  },
  'open-source-release': {
    defaultPurpose: 'release',
    baseRisk: 45,
    publicDisclosure: [
      'specification',
      'test vectors',
      'public fixtures',
      'license and source attribution',
    ],
    forbiddenFields: [
      ...PERSONAL_FIELD_KEYS,
      ...EXACT_LOCATION_FIELD_KEYS,
      ...PROOF_SECRET_FIELD_KEYS,
      ...RAW_ADDRESS_FIELD_KEYS,
      ...SYNC_SECRET_FIELD_KEYS,
    ],
    requiredControls: [
      'no-secret-material-in-repository',
      'public-fixture-private-field-scan',
      'sdk-parity-tests',
      'release-checksums-or-signatures',
      'third-party-data-license-boundaries',
    ],
    storagePolicy: ['public-artifacts-only'],
    auditPolicy: ['release-gate-records-test-and-scan-results'],
  },
};

const PUBLIC_OR_EXTERNAL_SURFACES = new Set<SecurityPrivacySurface>([
  'public-agid-api',
  'public-agid-qr',
  'zk-proof-public',
  'proof-bundle-registry',
  'credential-issuer-registry',
  'revocation-freshness-anchor',
  'delivery-agent',
  'mcp-tool',
  'audit-log',
  'open-source-release',
]);

function normalizeFieldKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function riskLevelForScore(score: number): SecurityPrivacyRiskLevel {
  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function decisionFor(errors: string[], warnings: string[], riskScore: number): SecurityPrivacyDecision {
  if (errors.length > 0) return 'block';
  if (riskScore >= 85) return 'manual-review';
  if (warnings.length > 0 || riskScore >= 40) return 'allow-with-controls';
  return 'allow';
}

function addUnique(target: string[], ...values: string[]) {
  for (const value of values) {
    if (value && !target.includes(value)) target.push(value);
  }
}

function profileFor(surface: SecurityPrivacySurface) {
  return SURFACE_PROFILES[surface];
}

export function buildSecurityPrivacyDesignPlan(input: SecurityPrivacyDesignInput): SecurityPrivacyDesignPlan {
  const profile = profileFor(input.surface);
  const purpose = input.purpose ?? profile.defaultPurpose;
  const dataClasses = uniqueSorted(input.dataClasses ?? ['public']) as SecurityPrivacyDataClass[];
  const requiredControls = [...profile.requiredControls];
  const requiredProofs: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const nextActions: string[] = [];
  let riskScore = profile.baseRisk;
  const isPublicOrExternal = PUBLIC_OR_EXTERNAL_SURFACES.has(input.surface);
  const privateDataPresent = Boolean(
    input.includesAoid
      || input.includesPlainAddress
      || input.includesRecipient
      || input.includesExactCoordinates
      || input.includesCredential
      || dataClasses.includes('sensitive')
      || dataClasses.includes('secret')
  );

  if (dataClasses.includes('secret')) riskScore += 20;
  if (dataClasses.includes('sensitive')) riskScore += 12;
  if (input.includesAoid) riskScore += 12;
  if (input.includesPlainAddress) riskScore += 10;
  if (input.includesRecipient) riskScore += 15;
  if (input.includesExactCoordinates) riskScore += 8;
  if (input.includesRawEvidence) riskScore += 8;
  if (input.persistsServerSide) riskScore += 12;
  if (input.sharesWithThirdParty) riskScore += 10;
  if (input.usesMcpOrAgent) riskScore += 8;
  if (input.logsPayload) riskScore += 8;
  riskScore = Math.min(100, riskScore);

  if (isPublicOrExternal && input.includesRecipient) {
    errors.push('public-or-external-surface-cannot-include-recipient-fields');
  }

  if (isPublicOrExternal && input.includesPlainAddress && input.surface !== 'address-verification') {
    errors.push('public-or-external-surface-cannot-include-plain-address');
  }

  if (isPublicOrExternal && input.includesExactCoordinates && input.surface !== 'public-agid-api') {
    warnings.push('exact-coordinates-should-be-replaced-by-agid-cell-or-commitment');
  }

  if (input.includesRawEvidence && isPublicOrExternal) {
    errors.push('raw-evidence-cannot-cross-public-or-agent-boundary');
  }

  if (input.persistsServerSide && privateDataPresent) {
    addUnique(requiredControls, 'server-side-private-data-encryption', 'retention-limit', 'delete-or-revoke-path');
    if (!input.encryptedAtRest) {
      errors.push('server-side-private-persistence-requires-encryption-at-rest');
    }
  }

  if (input.persistsServerSide && input.surface === 'aoid-sync' && !input.hasConsentProof) {
    errors.push('aoid-sync-requires-owner-consent-proof');
  }

  if (input.sharesWithThirdParty || input.usesMcpOrAgent) {
    addUnique(requiredControls, 'purpose-bound-consent', 'minimum-disclosure-response');
    if (!input.hasConsentProof) errors.push('third-party-or-agent-access-requires-consent-purpose-scope-proof');
  }

  if (input.includesAoid) {
    addUnique(requiredProofs, 'AOID ownership proof');
    addUnique(requiredControls, 'aoid-public-descriptor-redaction');
  }

  if (input.surface === 'aoid-registration') {
    addUnique(requiredProofs, 'duplicate-registration nullifier');
    if (!input.hasConsentProof) warnings.push('aoid-registration-should-bind-explicit-owner-consent');
  }

  if (input.includesCredential) {
    addUnique(requiredProofs, 'issuer trust proof', 'revocation status proof', 'freshness proof');
    if (!input.hasIssuerTrust) errors.push('credential-backed-flow-requires-issuer-trust-check');
    if (!input.hasRevocationCheck) errors.push('credential-backed-flow-requires-revocation-check');
    if (!input.hasFreshnessProof) errors.push('credential-backed-flow-requires-freshness-proof');
  }

  if (input.includesZkProof) {
    addUnique(requiredControls, 'challenge-binding', 'domain-separation', 'strip-private-proof-material');
    addUnique(requiredProofs, 'scope-bound ZK proof envelope');
    if (!input.hasProofBundleCompatibility && input.surface !== 'zk-proof-public') {
      warnings.push('proof-bundle-compatibility-should-be-checked-before-composition');
    }
  }

  if (input.includesNullifier) {
    addUnique(requiredControls, 'domain-separated-nullifier', 'single-use-or-bucket-policy');
  }

  if (input.storesRawProofs) {
    errors.push('raw-zk-proofs-or-witnesses-must-not-be-stored-in-registries');
  }

  if (input.logsPayload) {
    addUnique(requiredControls, 'privacy-safe-log-redaction');
    warnings.push('payload-logging-is-allowed-only-after-redaction-and-field-scan');
  }

  if (input.openSourceRelease || input.surface === 'open-source-release') {
    addUnique(requiredControls, 'secret-scan-before-release', 'fixture-private-field-scan');
    addUnique(nextActions, 'Run release scans against docs, examples, SDK fixtures, and data packs.');
  }

  if (purpose === 'delivery') {
    addUnique(requiredProofs, 'delivery eligibility proof');
    addUnique(requiredControls, 'merchant-carrier-data-separation');
  }

  if (purpose === 'residence') {
    addUnique(requiredProofs, 'private residence predicate proof');
  }

  if (purpose === 'pid-audit') {
    addUnique(requiredProofs, 'PID lifecycle or issuance audit proof');
  }

  if (purpose === 'quality-gate') {
    addUnique(requiredProofs, 'quality threshold proof');
  }

  if (!input.encryptedInTransit && (input.sharesWithThirdParty || input.persistsServerSide)) {
    warnings.push('network-transport-should-be-tls-or-equivalent');
  }

  addUnique(nextActions, ...requiredProofs.map(proof => `Implement or verify: ${proof}.`));

  const decision = decisionFor(errors, warnings, riskScore);
  return {
    version: SECURITY_PRIVACY_DESIGN_VERSION,
    policyId: `${SECURITY_PRIVACY_DESIGN_VERSION}:${input.surface}:${purpose}`,
    surface: input.surface,
    purpose,
    dataClasses,
    decision,
    riskLevel: riskLevelForScore(riskScore),
    riskScore,
    publicDisclosure: [...profile.publicDisclosure],
    forbiddenFields: uniqueSorted(profile.forbiddenFields.map(normalizeFieldKey)),
    requiredControls: uniqueSorted(requiredControls),
    requiredProofs: uniqueSorted(requiredProofs),
    storagePolicy: [...profile.storagePolicy],
    auditPolicy: [...profile.auditPolicy],
    errors: uniqueSorted(errors),
    warnings: uniqueSorted(warnings),
    nextActions: uniqueSorted(nextActions),
  };
}

export function findForbiddenSecurityPrivacyFields(
  value: unknown,
  options: ForbiddenSecurityPrivacyFieldOptions = {},
  path = 'payload'
): string[] {
  const surface = options.surface ?? 'public-agid-api';
  const forbidden = new Set(profileFor(surface).forbiddenFields.map(normalizeFieldKey));

  if (!value || typeof value !== 'object') return [];

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenSecurityPrivacyFields(item, options, `${path}[${index}]`));
  }

  const findings: string[] = [];
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    const nestedPath = `${path}.${key}`;
    if (forbidden.has(normalizeFieldKey(key))) {
      findings.push(nestedPath);
      continue;
    }
    findings.push(...findForbiddenSecurityPrivacyFields(nestedValue, options, nestedPath));
  }

  return findings;
}

export function validateSecurityPrivacyPayload(
  value: unknown,
  options: ForbiddenSecurityPrivacyFieldOptions = {}
): ForbiddenSecurityPrivacyFieldResult {
  const surface = options.surface ?? 'public-agid-api';
  const forbiddenFields = findForbiddenSecurityPrivacyFields(value, { surface });
  return {
    ok: forbiddenFields.length === 0,
    surface,
    forbiddenFields,
  };
}

export const SECURITY_PRIVACY_BASELINE = {
  version: SECURITY_PRIVACY_DESIGN_VERSION,
  invariants: [
    'AGID is public and integrity-focused; AOID is private and confidentiality-focused.',
    'Plain address, recipient, phone, unit, access notes, exact private coordinates, owner secrets, proof salts, and raw evidence do not cross public boundaries.',
    'Real addresses, AOID bodies, and private address history must not be stored as server plaintext.',
    'AOID is not a public tracking identifier; public flows use purpose-specific commitments and domain-separated nullifiers.',
    'Credential-backed proofs require issuer trust, freshness, and revocation checks.',
    'ZK proof bundles are composed only after scope, challenge, validity-window, private-field, and nullifier compatibility checks.',
    'MCP and shopping-agent actions must be purpose-bound and minimum-disclosure by default.',
    'Self-hosting, offline issuance, mirror distribution, and onion-friendly deployment should be supported where feasible to avoid a single surveillance chokepoint.',
  ],
} as const;

export const ANTI_SURVEILLANCE_DESIGN = {
  version: SECURITY_PRIVACY_DESIGN_VERSION,
  goal: 'Allow address-derived facts to be verified without turning AGID/AOID into a centralized address surveillance system.',
  privateProofPredicates: [
    'resident-in-country',
    'resident-in-city-or-prefecture',
    'inside-delivery-zone',
    'same-address-resident',
    'AOID-authority',
    'duplicate-prevention',
    'PID-issuance-audit',
  ],
  hiddenByDefault: [
    'real-address',
    'recipient-name',
    'phone-number',
    'unit-or-room',
    'exact-private-coordinates',
    'AOID-body',
    'private-address-history',
    'credential-witness',
  ],
  publicByDesign: [
    'predicate-id',
    'purpose-scope',
    'challenge-or-audience',
    'issuer-trust-root',
    'revocation-root',
    'freshness-window',
    'purpose-specific-commitment',
    'domain-separated-nullifier',
  ],
  forbiddenCapabilities: [
    'global-AOID-as-public-user-id',
    'cross-purpose-nullifier-reuse',
    'server-plaintext-address-store',
    'server-plaintext-AOID-store',
    'server-plaintext-history-store',
    'raw-witness-or-raw-proof-registry-storage',
    'marketing-or-identity-reuse-of-delivery-scope-proof',
  ],
  requiredCapabilities: [
    'ZK-address-proof',
    'ZK-residence-proof',
    'ZK-delivery-eligibility-proof',
    'purpose-scope-binding',
    'domain-separated-commitments',
    'domain-separated-nullifiers',
    'issuer-trust-public-verification',
    'revocation-and-freshness-public-verification',
    'owner-device-encrypted-AOID-sync',
    'reproducible-build-and-release-checksums',
    'external-security-audit-before-production-ZK-claims',
  ],
  censorshipResistanceOptions: [
    'self-hosted-server',
    'offline-credential-issuance',
    'offline-proof-presentation',
    'mirror-distribution',
    'onion-friendly-endpoint',
    'portable-open-source-data-pack',
  ],
} as const;
