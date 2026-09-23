import {
  scanNoRawAddressReleaseText,
  NO_RAW_ADDRESS_RELEASE_SCAN_VERSION,
  type NoRawAddressScanResult,
} from './noRawAddressReleaseScan';
import {
  evaluateMandatorySecurityReleaseGate,
  listMandatorySecurityReleaseRequirements,
  SECURITY_MANDATORY_RELEASE_GATE_VERSION,
  type MandatorySecurityReleaseGateInput,
  type MandatorySecurityReleaseGateResult,
  type MandatorySecurityReleaseRequirement,
} from './securityMandatoryReleaseGate';
import { stableJson } from './redactedWorkflowCore';

export const NO_RAW_ADDRESS_COMPLIANCE_KIT_VERSION = 'no-raw-address-compliance-kit-v0.1';

export type NoRawAddressComplianceSurfaceId =
  | 'address-registration-element'
  | 'pos-terminal'
  | 'field-handoff'
  | 'address-portal'
  | 'dashboard-review-console'
  | 'developer-console'
  | 'evidence-vault'
  | 'hosted-registry-api-webhooks'
  | 'drone-locker-ops'
  | 'zk-ethereum-optional';

export type NoRawAddressComplianceFile = {
  path: string;
  role:
    | 'manifest'
    | 'kit'
    | 'surface-policies'
    | 'fixtures'
    | 'checklists'
    | 'documentation';
  mediaType: 'application/json' | 'text/markdown';
  licenseOrTerms: 'Apache-2.0';
  containsPersonalData: false;
  containsRawAddressData: false;
  containsThirdPartyData: false;
};

export type NoRawAddressSurfacePolicy = {
  surfaceId: NoRawAddressComplianceSurfaceId;
  label: string;
  defaultPrivacyMode: 'local-first' | 'redacted-server' | 'private-evidence' | 'public-proof-only';
  allowedPublicFields: string[];
  forbiddenRawFields: string[];
  requiredControls: string[];
  releaseExamples: string[];
};

export type NoRawAddressComplianceChecklist = {
  role: 'developer' | 'reviewer' | 'operator' | 'auditor';
  requiredActions: string[];
};

export type NoRawAddressComplianceFixture = {
  fixtureId: string;
  expectedValid: boolean;
  purpose: string;
  payload: MandatorySecurityReleaseGateInput;
};

export type NoRawAddressComplianceKitManifest = {
  kitId: 'no-raw-address-compliance-kit';
  version: typeof NO_RAW_ADDRESS_COMPLIANCE_KIT_VERSION;
  scanVersion: typeof NO_RAW_ADDRESS_RELEASE_SCAN_VERSION;
  mandatoryGateVersion: typeof SECURITY_MANDATORY_RELEASE_GATE_VERSION;
  generatedAt: string;
  licenseOrTerms: 'Apache-2.0';
  privacyPosition: string;
  files: NoRawAddressComplianceFile[];
  counts: {
    surfaces: number;
    fixtures: number;
    checklists: number;
    forbiddenFields: number;
    requiredGates: number;
  };
};

export type NoRawAddressComplianceKit = {
  manifest: NoRawAddressComplianceKitManifest;
  forbiddenRawFields: string[];
  allowedPublicSubstitutes: string[];
  requiredReleaseGates: MandatorySecurityReleaseRequirement[];
  surfacePolicies: NoRawAddressSurfacePolicy[];
  checklists: NoRawAddressComplianceChecklist[];
  fixtures: NoRawAddressComplianceFixture[];
};

export type NoRawAddressCompliancePayloadResult = {
  valid: boolean;
  scan: NoRawAddressScanResult;
  gate: MandatorySecurityReleaseGateResult;
};

export type NoRawAddressComplianceKitValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const GENERATED_AT = '2026-06-20T00:00:00.000Z';

export const NO_RAW_ADDRESS_COMPLIANCE_FILES: NoRawAddressComplianceFile[] = [
  {
    path: 'data/no_raw_address_compliance_kit/manifest.json',
    role: 'manifest',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
  {
    path: 'data/no_raw_address_compliance_kit/no-raw-address-compliance-kit.json',
    role: 'kit',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
  {
    path: 'data/no_raw_address_compliance_kit/surface-policies.json',
    role: 'surface-policies',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
  {
    path: 'data/no_raw_address_compliance_kit/fixtures.json',
    role: 'fixtures',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
  {
    path: 'data/no_raw_address_compliance_kit/checklists.json',
    role: 'checklists',
    mediaType: 'application/json',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
  {
    path: 'data/no_raw_address_compliance_kit/README.md',
    role: 'documentation',
    mediaType: 'text/markdown',
    licenseOrTerms: 'Apache-2.0',
    containsPersonalData: false,
    containsRawAddressData: false,
    containsThirdPartyData: false,
  },
];

export const NO_RAW_ADDRESS_FORBIDDEN_FIELDS = [
  'rawAddress',
  'addressText',
  'inputAddress',
  'recipientName',
  'phoneNumber',
  'email',
  'unitNumber',
  'roomNumber',
  'accessCode',
  'proofCode',
  'privateProofSalt',
  'credentialSecret',
  'ownerPrivateKey',
  'rawAgid',
  'rawAoid',
  'rawWaybillId',
  'agidSCiphertext',
  'agidSPlaintext',
  'decryptedAgid',
  'qrPayload',
  'nfcPayload',
  'rawPayload',
  'privateKey',
  'secret',
  'witness',
];

export const NO_RAW_ADDRESS_ALLOWED_PUBLIC_SUBSTITUTES = [
  'addressCommitment',
  'aoidCommitment',
  'agidCellCommitment',
  'shortAlias',
  'waybillAlias',
  'issuerRef',
  'credentialCommitment',
  'revocationRoot',
  'freshnessRoot',
  'nullifierHash',
  'usedStateRef',
  'terminalReceiptRoot',
  'redactedEvidenceRef',
  'coarseRegionCode',
  'publicProofSignals',
];

function commonForbiddenFields() {
  return [...NO_RAW_ADDRESS_FORBIDDEN_FIELDS];
}

export const NO_RAW_ADDRESS_SURFACE_POLICIES: NoRawAddressSurfacePolicy[] = [
  {
    surfaceId: 'address-registration-element',
    label: 'Address Registration / Address Element',
    defaultPrivacyMode: 'local-first',
    allowedPublicFields: [
      'countryCode',
      'addressQualityState',
      'languageTabs',
      'addressCommitment',
      'feedbackCategory',
    ],
    forbiddenRawFields: commonForbiddenFields(),
    requiredControls: [
      'raw input stays in local state unless explicit user action submits it',
      'public examples use synthetic addresses only',
      'feedback exports use commitments and categories, not address text',
      'language tab previews are redacted in logs',
    ],
    releaseExamples: [
      'Address Element stores addressCommitment and quality state in telemetry.',
      'Feedback event includes countryCode, issueType, and redactedEvidenceRef.',
    ],
  },
  {
    surfaceId: 'pos-terminal',
    label: 'POS Terminal',
    defaultPrivacyMode: 'redacted-server',
    allowedPublicFields: [
      'waybillAlias',
      'handoffState',
      'terminalId',
      'terminalSignatureTail',
      'addressCommitment',
      'recipientProofStatus',
    ],
    forbiddenRawFields: commonForbiddenFields(),
    requiredControls: [
      'scan to decision screens do not expose raw address in audit logs',
      'terminal receipts are signed',
      'high-risk mode uses short alias TTL',
      'QR/NFC payloads are redacted before persistence',
    ],
    releaseExamples: [
      'Handoff completed with WBA-AABBCCDDEEFF and terminal receipt root.',
      'Recipient proof passed; address text never leaves the local handoff view.',
    ],
  },
  {
    surfaceId: 'field-handoff',
    label: 'Field Handoff App',
    defaultPrivacyMode: 'local-first',
    allowedPublicFields: [
      'deliveryReachabilityState',
      'coarseRegionCode',
      'offlineQueueId',
      'nullifierHash',
      'terminalReceiptRoot',
    ],
    forbiddenRawFields: commonForbiddenFields(),
    requiredControls: [
      'offline queue stores redacted receipts only',
      'conflicts are marked review-required without dumping raw payloads',
      'coarse location is used for high-risk operations',
      'recipient proof code is never stored',
    ],
    releaseExamples: [
      'Offline receipt queued with nullifierHash and coarseRegionCode.',
      'Reachability report stores barrier type and redacted evidence reference.',
    ],
  },
  {
    surfaceId: 'address-portal',
    label: 'Address Portal',
    defaultPrivacyMode: 'local-first',
    allowedPublicFields: [
      'addressItemId',
      'scope',
      'consentState',
      'lastVerifiedAt',
      'revocationState',
      'exportRequestId',
    ],
    forbiddenRawFields: commonForbiddenFields(),
    requiredControls: [
      'portal audit shows who accessed which scope, not the address',
      'export flow redacts secrets and raw proof material',
      'delete and revoke flows operate on addressItemId or commitment',
      'scope copy uses purpose-specific labels',
    ],
    releaseExamples: [
      'User revoked delivery:read for addressItemId addr_item_synthetic_001.',
      'Export prepared with redacted credential references only.',
    ],
  },
  {
    surfaceId: 'dashboard-review-console',
    label: 'Dashboard / Review Console',
    defaultPrivacyMode: 'redacted-server',
    allowedPublicFields: [
      'reviewCaseId',
      'riskSignals',
      'addressQualityState',
      'issuerRef',
      'deviceTrustState',
      'redactedEvidenceRef',
    ],
    forbiddenRawFields: commonForbiddenFields(),
    requiredControls: [
      'review queues show reason codes before private evidence access',
      'manual reviewers need explicit purpose and role',
      'audit exports use redacted evidence references',
      'case comments are scanned before release',
    ],
    releaseExamples: [
      'Review case opened for partial quality and untrusted device signal.',
      'Issuer status changed; affected commitments queued for freshness review.',
    ],
  },
  {
    surfaceId: 'developer-console',
    label: 'Developer Console',
    defaultPrivacyMode: 'public-proof-only',
    allowedPublicFields: [
      'apiKeyTail',
      'webhookEndpointDomain',
      'testVectorId',
      'sdkVersion',
      'publicProofSchema',
    ],
    forbiddenRawFields: commonForbiddenFields(),
    requiredControls: [
      'sample payloads must be synthetic or redacted',
      'webhook logs mask payload bodies by default',
      'test vectors are scanned for raw address keys',
      'OpenAPI examples avoid precise coordinates and AGID-S ciphertext',
    ],
    releaseExamples: [
      'Webhook example emits address_intent.verified with addressCommitment only.',
      'SDK sample uses synthetic-public fixture addrvec-jp-postal-render-v1.',
    ],
  },
  {
    surfaceId: 'evidence-vault',
    label: 'Evidence Vault',
    defaultPrivacyMode: 'private-evidence',
    allowedPublicFields: [
      'evidenceCommitment',
      'redactedEvidenceRef',
      'ocrConfidenceBand',
      'issuerRef',
      'retentionPolicyId',
    ],
    forbiddenRawFields: commonForbiddenFields(),
    requiredControls: [
      'photos and PDFs are private evidence, not public fixtures',
      'OCR output is locally editable before any submission',
      'public verifier sees commitment or proof result only',
      'retention and deletion policy is explicit',
    ],
    releaseExamples: [
      'Evidence vault issued a redactedEvidenceRef and commitment.',
      'Verifier received proof of document possession without document upload.',
    ],
  },
  {
    surfaceId: 'hosted-registry-api-webhooks',
    label: 'Hosted Registry API / Webhooks',
    defaultPrivacyMode: 'redacted-server',
    allowedPublicFields: [
      'issuerRef',
      'credentialCommitment',
      'revocationRoot',
      'freshnessRoot',
      'nullifierHash',
      'usedStateRef',
      'webhookEventId',
    ],
    forbiddenRawFields: commonForbiddenFields(),
    requiredControls: [
      'registry stores commitments and roots only',
      'webhook signatures are required',
      'webhook payloads use aliases instead of raw waybill or AOID',
      'debug logs run through no-raw-address scanner',
    ],
    releaseExamples: [
      'credential.revoked includes issuerRef and revocationRoot.',
      'qr.used includes nullifierHash and short alias.',
    ],
  },
  {
    surfaceId: 'drone-locker-ops',
    label: 'Drone / Locker Ops',
    defaultPrivacyMode: 'redacted-server',
    allowedPublicFields: [
      'lockerBayAlias',
      'deviceTwinId',
      'reachabilityState',
      'handoffReceiptRoot',
      'mqttTopicAlias',
    ],
    forbiddenRawFields: commonForbiddenFields(),
    requiredControls: [
      'MQTT, HTTP, and Modbus simulator events do not carry raw addresses',
      'locker access uses short alias, QR, NFC, or passkey proof',
      'drone reachability API returns route feasibility, not private destination text',
      'device logs are signed and redacted',
    ],
    releaseExamples: [
      'Locker bay opened for lockerBayAlias LBA-AABBCCDD.',
      'Drone reachability returned blocked with barrier code and no raw address.',
    ],
  },
  {
    surfaceId: 'zk-ethereum-optional',
    label: 'ZK / Ethereum Optional Modes',
    defaultPrivacyMode: 'public-proof-only',
    allowedPublicFields: [
      'publicSignals',
      'proofHash',
      'issuerRoot',
      'revocationRoot',
      'areaRoot',
      'nullifierHash',
      'transactionHash',
    ],
    forbiddenRawFields: commonForbiddenFields(),
    requiredControls: [
      'ZK witnesses are never logged',
      'Ethereum calldata excludes AGID, AOID, raw address, and AGID-S ciphertext',
      'public signals are domain-separated',
      'local-only and server-only modes remain supported',
    ],
    releaseExamples: [
      'Verifier accepted area membership proof with nullifierHash.',
      'Registry transaction anchored revocationRoot only.',
    ],
  },
];

export const NO_RAW_ADDRESS_CHECKLISTS: NoRawAddressComplianceChecklist[] = [
  {
    role: 'developer',
    requiredActions: [
      'Use commitments, short aliases, and redacted evidence references for public state.',
      'Run npm run verify:no-raw-address-kit before publishing examples or docs.',
      'Do not add rawAddress, rawAgid, rawAoid, proofCode, privateKey, witness, or QR payload samples to fixtures.',
      'Keep raw address text in the narrowest local component state possible.',
    ],
  },
  {
    role: 'reviewer',
    requiredActions: [
      'Confirm each changed surface maps to one surface policy.',
      'Reject screenshots, docs, JSON fixtures, or API examples containing real addresses.',
      'Check high-risk mode for short TTL, terminal signature, redaction, and no precise location leakage.',
      'Verify external examples are synthetic-public or redacted-public.',
    ],
  },
  {
    role: 'operator',
    requiredActions: [
      'Inspect release gate output before enabling POS, registry, webhook, or evidence vault exports.',
      'Use review-required state for offline sync conflicts instead of exposing private payloads.',
      'Rotate aliases and keys when devices, staff, or carrier integrations change.',
      'Keep raw address access behind explicit purpose and role checks.',
    ],
  },
  {
    role: 'auditor',
    requiredActions: [
      'Sample audit logs for forbidden fields and precise coordinate leakage.',
      'Verify no public demo data contains personal address material.',
      'Confirm terminal signatures and redaction versions are present in handoff reports.',
      'Check that ZK, Ethereum, and registry modes remain optional and no-raw-address by default.',
    ],
  },
];

const SAFE_FIXTURE_PAYLOAD: MandatorySecurityReleaseGateInput = {
  releaseText: 'No raw address by default. Public release stores commitments, short aliases, roots, and redacted evidence references only.',
  highRiskMode: true,
  privacyPolicy: {
    noRawAddressByDefault: true,
    rawAddressStorage: false,
    publicPayloadUsesCommitments: true,
    purposeLimited: true,
    highRiskModeReviewed: true,
    externalSharingReviewed: true,
    plaintextTransmissionAllowed: false,
    retentionDays: 3,
    maxRetentionDays: 7,
  },
  terminalSignature: {
    terminalId: 'POS-AUDIT-ALPHA',
    signature: 'SIGSAFEAABBCCDDEEFF',
    signedAt: '2026-06-20T00:00:00.000Z',
    algorithm: 'ed25519-terminal-receipt-v1',
  },
  alias: {
    value: 'WBA-AABBCCDDEEFF',
    issuedAt: '2026-06-20T00:00:00.000Z',
    expiresAt: '2026-06-20T00:04:00.000Z',
  },
  auditLog: {
    redactionApplied: true,
    redactionVersion: NO_RAW_ADDRESS_COMPLIANCE_KIT_VERSION,
    event: {
      eventType: 'handoff.completed',
      waybillAlias: 'WBA-AABBCCDDEEFF',
      addressCommitment: 'addr_commitment_synthetic_alpha',
      issuerRef: 'issuer_ref_synthetic_alpha',
      nullifierHash: 'nullifier_hash_synthetic_alpha',
      terminalReceiptRoot: 'receipt_root_synthetic_alpha',
      outcome: 'accepted',
    },
  },
};

const UNSAFE_FIXTURE_PAYLOAD: MandatorySecurityReleaseGateInput = {
  releaseText: '{"rawAddress":"UNSAFE_NONPUBLIC_RAW_ADDRESS_FIXTURE","proofCode":"UNSAFE_NONPUBLIC_PROOF_VALUE"}',
  highRiskMode: true,
  privacyPolicy: {
    noRawAddressByDefault: false,
    rawAddressStorage: true,
    publicPayloadUsesCommitments: false,
    purposeLimited: false,
    highRiskModeReviewed: false,
    externalSharingReviewed: false,
    plaintextTransmissionAllowed: true,
    retentionDays: 90,
    maxRetentionDays: 7,
  },
  terminalSignature: {
    terminalId: 'POS-AUDIT-BETA',
    signature: 'SIGSAFEFFEEDDCCBBAA',
    signedAt: '2026-06-20T00:00:00.000Z',
    algorithm: 'ed25519-terminal-receipt-v1',
  },
  alias: {
    value: 'WBA-FFEEDDCCBBAA',
    issuedAt: '2026-06-20T00:00:00.000Z',
    expiresAt: '2026-06-20T00:04:00.000Z',
  },
  auditLog: {
    redactionApplied: false,
    redactionVersion: '',
    event: {
      eventType: 'handoff.completed',
      rawAddress: 'UNSAFE_NONPUBLIC_RAW_ADDRESS_FIXTURE',
      proofCode: 'UNSAFE_NONPUBLIC_PROOF_VALUE',
      phoneNumber: 'UNSAFE_NONPUBLIC_PHONE_VALUE',
      outcome: 'accepted',
    },
  },
};

export const NO_RAW_ADDRESS_FIXTURES: NoRawAddressComplianceFixture[] = [
  {
    fixtureId: 'no-raw-address-safe-release-v1',
    expectedValid: true,
    purpose: 'A publishable release and audit fixture using only commitments, aliases, roots, and redacted refs.',
    payload: SAFE_FIXTURE_PAYLOAD,
  },
  {
    fixtureId: 'no-raw-address-unsafe-release-v1',
    expectedValid: false,
    purpose: 'A negative fixture that must be blocked because it includes forbidden raw-address, proof-code, phone-number, and unredacted audit event fields. Values are non-real sentinel strings.',
    payload: UNSAFE_FIXTURE_PAYLOAD,
  },
];

function scanInputText(input: MandatorySecurityReleaseGateInput) {
  return [
    input.releaseText,
    input.privacyPolicy,
    input.terminalSignature,
    input.alias,
    input.auditLog?.event,
  ]
    .map(value => (typeof value === 'string' ? value : stableJson(value)))
    .filter(Boolean)
    .join('\n');
}

export function evaluateNoRawAddressCompliancePayload(
  payload: MandatorySecurityReleaseGateInput,
): NoRawAddressCompliancePayloadResult {
  const scan = scanNoRawAddressReleaseText(scanInputText(payload));
  const gate = evaluateMandatorySecurityReleaseGate({
    ...payload,
    noRawAddressScan: scan,
  });

  return {
    valid: scan.valid && gate.valid,
    scan,
    gate,
  };
}

function createManifest(generatedAt: string): NoRawAddressComplianceKitManifest {
  return {
    kitId: 'no-raw-address-compliance-kit',
    version: NO_RAW_ADDRESS_COMPLIANCE_KIT_VERSION,
    scanVersion: NO_RAW_ADDRESS_RELEASE_SCAN_VERSION,
    mandatoryGateVersion: SECURITY_MANDATORY_RELEASE_GATE_VERSION,
    generatedAt,
    licenseOrTerms: 'Apache-2.0',
    privacyPosition: 'AGID public surfaces must be no-raw-address by default: public records use commitments, short aliases, roots, nullifiers, and redacted evidence references instead of raw address, AOID, AGID-S, proof, witness, phone, or recipient material.',
    files: NO_RAW_ADDRESS_COMPLIANCE_FILES.map(file => ({ ...file })),
    counts: {
      surfaces: NO_RAW_ADDRESS_SURFACE_POLICIES.length,
      fixtures: NO_RAW_ADDRESS_FIXTURES.length,
      checklists: NO_RAW_ADDRESS_CHECKLISTS.length,
      forbiddenFields: NO_RAW_ADDRESS_FORBIDDEN_FIELDS.length,
      requiredGates: listMandatorySecurityReleaseRequirements().length,
    },
  };
}

export function buildNoRawAddressComplianceKit(input: {
  generatedAt?: string;
} = {}): NoRawAddressComplianceKit {
  return {
    manifest: createManifest(input.generatedAt || GENERATED_AT),
    forbiddenRawFields: [...NO_RAW_ADDRESS_FORBIDDEN_FIELDS],
    allowedPublicSubstitutes: [...NO_RAW_ADDRESS_ALLOWED_PUBLIC_SUBSTITUTES],
    requiredReleaseGates: listMandatorySecurityReleaseRequirements(),
    surfacePolicies: NO_RAW_ADDRESS_SURFACE_POLICIES.map(policy => ({
      ...policy,
      allowedPublicFields: [...policy.allowedPublicFields],
      forbiddenRawFields: [...policy.forbiddenRawFields],
      requiredControls: [...policy.requiredControls],
      releaseExamples: [...policy.releaseExamples],
    })),
    checklists: NO_RAW_ADDRESS_CHECKLISTS.map(checklist => ({
      ...checklist,
      requiredActions: [...checklist.requiredActions],
    })),
    fixtures: NO_RAW_ADDRESS_FIXTURES.map(fixture => ({
      ...fixture,
      payload: { ...fixture.payload },
    })),
  };
}

export function validateNoRawAddressComplianceKit(
  kit = buildNoRawAddressComplianceKit(),
): NoRawAddressComplianceKitValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (kit.manifest.version !== NO_RAW_ADDRESS_COMPLIANCE_KIT_VERSION) errors.push('version-mismatch');
  if (kit.manifest.scanVersion !== NO_RAW_ADDRESS_RELEASE_SCAN_VERSION) errors.push('scan-version-mismatch');
  if (kit.manifest.mandatoryGateVersion !== SECURITY_MANDATORY_RELEASE_GATE_VERSION) {
    errors.push('mandatory-gate-version-mismatch');
  }
  if (kit.manifest.counts.surfaces !== kit.surfacePolicies.length) errors.push('surface-count-mismatch');
  if (kit.manifest.counts.fixtures !== kit.fixtures.length) errors.push('fixture-count-mismatch');
  if (kit.manifest.counts.checklists !== kit.checklists.length) errors.push('checklist-count-mismatch');
  if (kit.manifest.counts.forbiddenFields !== kit.forbiddenRawFields.length) errors.push('forbidden-field-count-mismatch');

  for (const file of kit.manifest.files) {
    if (file.containsPersonalData !== false) errors.push(`file-personal-data-not-false:${file.path}`);
    if (file.containsRawAddressData !== false) errors.push(`file-raw-address-data-not-false:${file.path}`);
    if (file.containsThirdPartyData !== false) errors.push(`file-third-party-data-not-false:${file.path}`);
  }

  for (const requiredField of ['rawAddress', 'rawAgid', 'rawAoid', 'agidSCiphertext', 'proofCode', 'witness']) {
    if (!kit.forbiddenRawFields.includes(requiredField)) errors.push(`missing-forbidden-field:${requiredField}`);
  }

  for (const substitute of ['addressCommitment', 'waybillAlias', 'nullifierHash', 'redactedEvidenceRef']) {
    if (!kit.allowedPublicSubstitutes.includes(substitute)) errors.push(`missing-public-substitute:${substitute}`);
  }

  const requiredGates = listMandatorySecurityReleaseRequirements();
  if (stableJson(kit.requiredReleaseGates) !== stableJson(requiredGates)) errors.push('required-gates-mismatch');

  const surfaceIds = new Set<NoRawAddressComplianceSurfaceId>();
  for (const policy of kit.surfacePolicies) {
    if (surfaceIds.has(policy.surfaceId)) errors.push(`duplicate-surface:${policy.surfaceId}`);
    surfaceIds.add(policy.surfaceId);
    if (!policy.requiredControls.length) errors.push(`surface-missing-controls:${policy.surfaceId}`);
    if (!policy.forbiddenRawFields.includes('rawAddress')) errors.push(`surface-missing-raw-address-ban:${policy.surfaceId}`);
    const publicText = policy.releaseExamples.join('\n');
    const scan = scanNoRawAddressReleaseText(publicText);
    if (!scan.valid) errors.push(`surface-example-leaks-raw-address:${policy.surfaceId}`);
  }

  for (const fixture of kit.fixtures) {
    const result = evaluateNoRawAddressCompliancePayload(fixture.payload);
    if (result.valid !== fixture.expectedValid) errors.push(`fixture-expectation-mismatch:${fixture.fixtureId}`);
  }

  if (!kit.surfacePolicies.some(policy => policy.defaultPrivacyMode === 'local-first')) {
    warnings.push('no-local-first-surface');
  }
  if (!kit.surfacePolicies.some(policy => policy.surfaceId === 'zk-ethereum-optional')) {
    warnings.push('zk-ethereum-optional-surface-missing');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
