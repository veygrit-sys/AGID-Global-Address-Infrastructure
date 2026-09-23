export const EXTERNAL_AUDIT_HARDENING_VERSION = 'external-audit-hardening-v1';

export type ExternalAuditPriority = 'P0' | 'P1' | 'P2';

export type ExternalAuditScope =
  | 'repository'
  | 'release-artifacts'
  | 'privacy-security'
  | 'zk-cryptography'
  | 'data-licenses'
  | 'accessibility'
  | 'hosted-registry'
  | 'pos-handoff'
  | 'cloud-deployment'
  | 'incident-response';

export type ExternalAuditControl = {
  id: string;
  priority: ExternalAuditPriority;
  scope: ExternalAuditScope;
  title: string;
  purpose: string;
  auditorProfile: string[];
  evidenceBundle: string[];
  automatedChecks: string[];
  manualReview: string[];
  publicReportAllowed: string[];
  privateMaterialForbidden: string[];
  blockerIfMissing: boolean;
};

export type ExternalAuditPacket = {
  id: string;
  title: string;
  scope: ExternalAuditScope[];
  requiredBefore: 'oss-release' | 'production-hosted-service' | 'production-zk-claim' | 'enterprise-deployment';
  contents: string[];
  redactions: string[];
};

export type ExternalAuditHardeningPlan = {
  version: typeof EXTERNAL_AUDIT_HARDENING_VERSION;
  principle: string;
  controls: ExternalAuditControl[];
  packets: ExternalAuditPacket[];
  recommendedCommands: string[];
  publicDisclosureRules: string[];
};

export type ExternalAuditStatus =
  | 'missing'
  | 'planned'
  | 'internal-reviewed'
  | 'external-reviewed'
  | 'continuous';

export type EvaluateExternalAuditHardeningInput = {
  threatModelReviewed: ExternalAuditStatus;
  securityPolicyPresent: boolean;
  secretScanClean: boolean;
  privateFixtureScanClean: boolean;
  rawAddressLogScanClean: boolean;
  dependencyAuditReviewed: ExternalAuditStatus;
  releaseChecksumsOrSignatures: boolean;
  reproducibleBuildNotes: boolean;
  dataLicenseBomComplete: boolean;
  privacyDpiaReviewed: ExternalAuditStatus;
  accessibilityAuditReviewed: ExternalAuditStatus;
  zkCircuitAuditReviewed: ExternalAuditStatus;
  publicSignalLeakageTested: boolean;
  witnessHygieneTested: boolean;
  hostedRegistryPenTestReviewed: ExternalAuditStatus;
  posHandoffAbuseReviewed: ExternalAuditStatus;
  incidentRunbookTested: boolean;
  auditorAccessRedacted: boolean;
  productionZkClaim: boolean;
  hostedProductionClaim: boolean;
};

export type ExternalAuditHardeningEvaluation = {
  valid: boolean;
  grade: 'ready' | 'attention' | 'blocked';
  score: number;
  requiredScopes: ExternalAuditScope[];
  blockers: string[];
  warnings: string[];
};

export const EXTERNAL_AUDIT_CONTROLS: ExternalAuditControl[] = [
  {
    id: 'p0-threat-model-and-security-policy',
    priority: 'P0',
    scope: 'repository',
    title: 'Repository threat model and security policy',
    purpose: 'External reviewers need a clear map of assets, trust boundaries, attacker inputs, invariants, and disclosure process before reviewing code.',
    auditorProfile: ['application security engineer', 'privacy engineer', 'OSS maintainer'],
    evidenceBundle: ['SECURITY.md or equivalent policy', 'repository threat model', 'asset and trust-boundary table', 'security contact and disclosure SLA'],
    automatedChecks: ['lint/typecheck', 'unit tests', 'dependency review'],
    manualReview: ['anti-surveillance invariants', 'hosted vs local trust boundaries', 'raw-address storage assumptions'],
    publicReportAllowed: ['scope', 'risk classes', 'fixed finding summaries', 'remaining non-sensitive risks'],
    privateMaterialForbidden: ['private addresses', 'AOID plaintext', 'AGID-S payloads', 'proof witnesses', 'secrets'],
    blockerIfMissing: true,
  },
  {
    id: 'p0-release-artifact-hygiene',
    priority: 'P0',
    scope: 'release-artifacts',
    title: 'Release artifact hygiene',
    purpose: 'Open-source releases must not leak secrets, private fixtures, personal documents, raw address examples, or unreproducible binaries.',
    auditorProfile: ['release engineer', 'supply-chain security reviewer', 'OSS maintainer'],
    evidenceBundle: ['release checklist', 'checksums or detached signatures', 'public test vectors', 'source-data license manifest', 'reproducible build notes'],
    automatedChecks: ['secret scan', 'private fixture scan', 'raw address log scan', 'artifact checksum verification'],
    manualReview: ['sample data provenance', 'generated PDF/image metadata', 'data pack redaction'],
    publicReportAllowed: ['artifact names', 'hashes', 'scan result summary', 'license manifest status'],
    privateMaterialForbidden: ['secret keys', 'real user addresses', 'raw logs', 'private PDFs', 'credential salts'],
    blockerIfMissing: true,
  },
  {
    id: 'p0-privacy-and-no-raw-address-audit',
    priority: 'P0',
    scope: 'privacy-security',
    title: 'Privacy and no-raw-address audit',
    purpose: 'The project must prove that public APIs, POS receipts, logs, webhooks, examples, and reports do not expose private address material.',
    auditorProfile: ['privacy engineer', 'DPO', 'application security engineer'],
    evidenceBundle: ['data classification table', 'retention matrix', 'redaction test results', 'purpose-scope table', 'high-risk-mode checklist'],
    automatedChecks: ['no raw address payload tests', 'redacted audit log tests', 'public/private separation tests'],
    manualReview: ['DPIA-style review', 'high-risk mode do-no-harm review', 'agent/MCP output review'],
    publicReportAllowed: ['controls tested', 'redaction coverage', 'retention summary', 'open remediation list'],
    privateMaterialForbidden: ['real addresses', 'recipient names', 'phone numbers', 'unit/access notes', 'exact private coordinates'],
    blockerIfMissing: true,
  },
  {
    id: 'p0-zk-production-claim-audit',
    priority: 'P0',
    scope: 'zk-cryptography',
    title: 'ZK production claim audit',
    purpose: 'No circuit, verifier, or proof flow should be called production-grade until leakage, witness hygiene, domain separation, and constraints are externally reviewed.',
    auditorProfile: ['cryptography auditor', 'ZK circuit engineer', 'protocol security engineer'],
    evidenceBundle: ['circuit ids', 'public signal schema', 'witness handling policy', 'test vectors', 'verifier key references', 'audit status table'],
    automatedChecks: ['public signal allowlist test', 'witness hygiene test', 'nullifier domain separation test', 'fixture/production wording test'],
    manualReview: ['constraint soundness', 'linkability analysis', 'toxic waste/artifact handling', 'managed prover boundary'],
    publicReportAllowed: ['circuit family', 'auditor', 'scope', 'severity counts', 'fixed finding summary'],
    privateMaterialForbidden: ['witnesses', 'private inputs', 'proving secrets', 'real credential secrets', 'raw address material'],
    blockerIfMissing: true,
  },
  {
    id: 'p0-data-license-and-provenance-audit',
    priority: 'P0',
    scope: 'data-licenses',
    title: 'Data license and provenance audit',
    purpose: 'Bundled geography, postal, map, trade, tax, carrier, and evidence data must keep source licenses, freshness, and attribution separate from AGID software.',
    auditorProfile: ['data governance lead', 'open-data licensing reviewer', 'OSS maintainer'],
    evidenceBundle: ['DATA_LICENSES.md', 'data pack manifest', 'source freshness policy', 'attribution file', 'excluded proprietary data list'],
    automatedChecks: ['manifest completeness check', 'source id coverage test', 'license file presence check'],
    manualReview: ['commercial-use restrictions', 'share-alike boundaries', 'source retirement process'],
    publicReportAllowed: ['source names', 'license classes', 'attribution status', 'known limitations'],
    privateMaterialForbidden: ['private source credentials', 'API keys', 'contract-only data', 'unlicensed scraped datasets'],
    blockerIfMissing: true,
  },
  {
    id: 'p1-accessibility-audit',
    priority: 'P1',
    scope: 'accessibility',
    title: 'Accessibility audit',
    purpose: 'Keyboard, focus, screen-reader status, contrast, language direction, and high-risk privacy narration should be independently checked before public pilots.',
    auditorProfile: ['accessibility specialist', 'UX researcher', 'front-end engineer'],
    evidenceBundle: ['keyboard flow notes', 'screen-reader notes', 'contrast report', 'language direction test', 'POS task walkthrough'],
    automatedChecks: ['accessibility hardening tests', 'language setting tests', 'side-menu stability tests'],
    manualReview: ['screen-reader scan-to-decision path', 'map keyboard alternatives', 'high-risk privacy text'],
    publicReportAllowed: ['WCAG-oriented status', 'fixed defects', 'remaining barriers'],
    privateMaterialForbidden: ['real user data in screen captures', 'actual recipient details', 'private documents'],
    blockerIfMissing: false,
  },
  {
    id: 'p1-hosted-registry-and-api-pentest',
    priority: 'P1',
    scope: 'hosted-registry',
    title: 'Hosted registry and API penetration test',
    purpose: 'Hosted issuer, revocation, freshness, nullifier, webhook, and dashboard APIs need abuse testing before production claims.',
    auditorProfile: ['API security tester', 'cloud security engineer', 'privacy engineer'],
    evidenceBundle: ['OpenAPI spec', 'auth/rate-limit policy', 'webhook signature spec', 'redacted sample events', 'abuse-case matrix'],
    automatedChecks: ['webhook signature tests', 'rate-limit tests', 'nullifier replay tests', 'no raw payload event tests'],
    manualReview: ['authorization bypass', 'tenant isolation', 'metadata leakage', 'replay and idempotency'],
    publicReportAllowed: ['API scope', 'fixed vulnerabilities', 'residual risk summary'],
    privateMaterialForbidden: ['production API keys', 'private tenant data', 'real address payloads', 'webhook secrets'],
    blockerIfMissing: false,
  },
  {
    id: 'p1-pos-handoff-abuse-audit',
    priority: 'P1',
    scope: 'pos-handoff',
    title: 'POS handoff abuse audit',
    purpose: 'QR copy, stale QR, fake carrier scan, untrusted device, offline conflict, and recipient-proof bypass should be tested with realistic operator flows.',
    auditorProfile: ['product security tester', 'logistics operator', 'field UX reviewer'],
    evidenceBundle: ['POS state machine', 'handoff receipt schema', 'offline queue policy', 'device diagnostic matrix', 'high-risk workflow'],
    automatedChecks: ['shipping label QR tests', 'POS acceptance tests', 'offline queue tests', 'redacted receipt tests'],
    manualReview: ['screen-shot QR reuse', 'device compromise simulation', 'offline sync collision handling', 'operator override trail'],
    publicReportAllowed: ['abuse cases tested', 'state-machine fixes', 'remaining operational limits'],
    privateMaterialForbidden: ['real waybills', 'recipient proofs', 'phone numbers', 'exact delivery locations'],
    blockerIfMissing: false,
  },
  {
    id: 'p2-cloud-and-private-deployment-review',
    priority: 'P2',
    scope: 'cloud-deployment',
    title: 'Cloud and private deployment review',
    purpose: 'Azure/GCP/AWS/private deployments should prove that keys, logs, queues, OCR, storage, and webhook events preserve the same privacy model.',
    auditorProfile: ['cloud security architect', 'DevOps/SRE', 'privacy engineer'],
    evidenceBundle: ['deployment diagram', 'key management policy', 'log retention policy', 'backup/restore plan', 'tenant isolation matrix'],
    automatedChecks: ['IaC policy checks', 'secret environment scan', 'log redaction tests'],
    manualReview: ['key rotation exercise', 'regional data residency', 'subprocessor inventory', 'break-glass procedure'],
    publicReportAllowed: ['architecture summary', 'control mapping', 'known deployment caveats'],
    privateMaterialForbidden: ['cloud credentials', 'tenant secrets', 'raw logs', 'private OCR documents'],
    blockerIfMissing: false,
  },
  {
    id: 'p2-incident-response-exercise',
    priority: 'P2',
    scope: 'incident-response',
    title: 'Incident response exercise',
    purpose: 'The project needs rehearsed procedures for leaked keys, leaked fixtures, revoked issuers, malicious endpoints, copied QR payloads, and privacy incidents.',
    auditorProfile: ['incident responder', 'SRE', 'privacy/legal reviewer'],
    evidenceBundle: ['incident runbook', 'severity matrix', 'contact list', 'revocation drill results', 'public advisory template'],
    automatedChecks: ['key rotation simulation', 'revocation path test', 'audit log export test'],
    manualReview: ['tabletop exercise', 'privacy notification threshold', 'rollback and data deletion procedure'],
    publicReportAllowed: ['incident class', 'remediation status', 'advisory timeline'],
    privateMaterialForbidden: ['victim details', 'private addresses', 'keys', 'exploit payloads before coordinated disclosure'],
    blockerIfMissing: false,
  },
];

export const EXTERNAL_AUDIT_PACKETS: ExternalAuditPacket[] = [
  {
    id: 'oss-release-packet',
    title: 'OSS release audit packet',
    scope: ['repository', 'release-artifacts', 'privacy-security', 'data-licenses', 'accessibility'],
    requiredBefore: 'oss-release',
    contents: [
      'threat model',
      'SECURITY.md or disclosure policy',
      'release checklist',
      'secret/private fixture/raw address scans',
      'DATA_LICENSES and attribution manifest',
      'accessibility hardening result',
    ],
    redactions: ['real addresses', 'AOID plaintext', 'AGID-S payloads', 'private PDFs', 'API keys'],
  },
  {
    id: 'production-zk-packet',
    title: 'Production ZK claim audit packet',
    scope: ['zk-cryptography', 'privacy-security', 'release-artifacts'],
    requiredBefore: 'production-zk-claim',
    contents: [
      'circuit source and circuit id',
      'public signal schema',
      'witness hygiene policy',
      'nullifier domain separation analysis',
      'verifier key reference',
      'external cryptography audit result',
    ],
    redactions: ['witnesses', 'private inputs', 'credential secrets', 'real address examples'],
  },
  {
    id: 'hosted-service-packet',
    title: 'Hosted service audit packet',
    scope: ['hosted-registry', 'cloud-deployment', 'incident-response', 'privacy-security'],
    requiredBefore: 'production-hosted-service',
    contents: [
      'OpenAPI and webhook specs',
      'auth/rate limit policy',
      'tenant isolation model',
      'log retention and redaction policy',
      'incident runbook',
      'penetration test summary',
    ],
    redactions: ['tenant secrets', 'production API keys', 'raw webhook bodies', 'private tenant data'],
  },
  {
    id: 'enterprise-field-packet',
    title: 'Enterprise / field deployment audit packet',
    scope: ['pos-handoff', 'cloud-deployment', 'incident-response', 'accessibility'],
    requiredBefore: 'enterprise-deployment',
    contents: [
      'POS handoff state machine',
      'offline conflict protocol',
      'device diagnostic matrix',
      'high-risk field checklist',
      'operator accessibility walkthrough',
      'incident tabletop notes',
    ],
    redactions: ['real waybills', 'recipient proofs', 'precise delivery locations', 'device secrets'],
  },
];

export const EXTERNAL_AUDIT_RECOMMENDED_COMMANDS = [
  'npm run verify:external-audit',
  'npm run verify:a11y',
  'npm run verify:zk-baseline',
  'npm run verify:open-core',
  'npm run lint',
];

export const EXTERNAL_AUDIT_PUBLIC_DISCLOSURE_RULES = [
  'Publish audit scope, methodology, fixed finding summaries, and residual risk without private address material.',
  'Do not publish exploit details that enable active abuse until coordinated disclosure is complete.',
  'Do not publish real addresses, AOID plaintext, AGID-S payloads, proof witnesses, API keys, or private documents.',
  'Label claims as design-only, internally tested, externally reviewed, or production-audited.',
];

function uniqueScopes(scopes: ExternalAuditScope[]) {
  return Array.from(new Set(scopes));
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function isExternalOrContinuous(status: ExternalAuditStatus) {
  return status === 'external-reviewed' || status === 'continuous';
}

function isAtLeastInternal(status: ExternalAuditStatus) {
  return status === 'internal-reviewed' || isExternalOrContinuous(status);
}

function addRequiredScope(scopes: ExternalAuditScope[], scope: ExternalAuditScope) {
  if (!scopes.includes(scope)) scopes.push(scope);
}

export function getExternalAuditHardeningPlan(): ExternalAuditHardeningPlan {
  return {
    version: EXTERNAL_AUDIT_HARDENING_VERSION,
    principle: 'External audit readiness means independent reviewers can reproduce claims, inspect trust boundaries, verify privacy and release hygiene, and report findings without receiving raw address material, secrets, witnesses, or private user evidence.',
    controls: EXTERNAL_AUDIT_CONTROLS.map(control => ({
      ...control,
      auditorProfile: [...control.auditorProfile],
      evidenceBundle: [...control.evidenceBundle],
      automatedChecks: [...control.automatedChecks],
      manualReview: [...control.manualReview],
      publicReportAllowed: [...control.publicReportAllowed],
      privateMaterialForbidden: [...control.privateMaterialForbidden],
    })),
    packets: EXTERNAL_AUDIT_PACKETS.map(packet => ({
      ...packet,
      scope: [...packet.scope],
      contents: [...packet.contents],
      redactions: [...packet.redactions],
    })),
    recommendedCommands: [...EXTERNAL_AUDIT_RECOMMENDED_COMMANDS],
    publicDisclosureRules: [...EXTERNAL_AUDIT_PUBLIC_DISCLOSURE_RULES],
  };
}

export function evaluateExternalAuditHardening(
  input: EvaluateExternalAuditHardeningInput,
): ExternalAuditHardeningEvaluation {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const requiredScopes: ExternalAuditScope[] = [];

  if (!isAtLeastInternal(input.threatModelReviewed)) {
    blockers.push('threat-model-not-reviewed');
    addRequiredScope(requiredScopes, 'repository');
  }
  if (!input.securityPolicyPresent) {
    blockers.push('security-policy-missing');
    addRequiredScope(requiredScopes, 'repository');
  }
  if (!input.secretScanClean) {
    blockers.push('secret-scan-not-clean');
    addRequiredScope(requiredScopes, 'release-artifacts');
  }
  if (!input.privateFixtureScanClean) {
    blockers.push('private-fixture-scan-not-clean');
    addRequiredScope(requiredScopes, 'release-artifacts');
  }
  if (!input.rawAddressLogScanClean) {
    blockers.push('raw-address-log-scan-not-clean');
    addRequiredScope(requiredScopes, 'privacy-security');
  }
  if (!input.releaseChecksumsOrSignatures) {
    blockers.push('release-checksums-or-signatures-missing');
    addRequiredScope(requiredScopes, 'release-artifacts');
  }
  if (!input.dataLicenseBomComplete) {
    blockers.push('data-license-bom-incomplete');
    addRequiredScope(requiredScopes, 'data-licenses');
  }
  if (!input.auditorAccessRedacted) {
    blockers.push('auditor-access-not-redacted');
    addRequiredScope(requiredScopes, 'privacy-security');
  }
  if (input.productionZkClaim && !isExternalOrContinuous(input.zkCircuitAuditReviewed)) {
    blockers.push('production-zk-claim-without-external-crypto-audit');
    addRequiredScope(requiredScopes, 'zk-cryptography');
  }
  if (input.productionZkClaim && (!input.publicSignalLeakageTested || !input.witnessHygieneTested)) {
    blockers.push('production-zk-claim-without-leakage-and-witness-tests');
    addRequiredScope(requiredScopes, 'zk-cryptography');
  }
  if (input.hostedProductionClaim && !isExternalOrContinuous(input.hostedRegistryPenTestReviewed)) {
    blockers.push('hosted-production-without-external-api-pentest');
    addRequiredScope(requiredScopes, 'hosted-registry');
  }

  if (!isAtLeastInternal(input.dependencyAuditReviewed)) {
    warnings.push('dependency-audit-not-reviewed');
    addRequiredScope(requiredScopes, 'release-artifacts');
  }
  if (!input.reproducibleBuildNotes) {
    warnings.push('reproducible-build-notes-missing');
    addRequiredScope(requiredScopes, 'release-artifacts');
  }
  if (!isAtLeastInternal(input.privacyDpiaReviewed)) {
    warnings.push('privacy-dpia-not-reviewed');
    addRequiredScope(requiredScopes, 'privacy-security');
  }
  if (!isAtLeastInternal(input.accessibilityAuditReviewed)) {
    warnings.push('accessibility-audit-not-reviewed');
    addRequiredScope(requiredScopes, 'accessibility');
  }
  if (!isAtLeastInternal(input.zkCircuitAuditReviewed)) {
    warnings.push('zk-circuit-audit-not-reviewed');
    addRequiredScope(requiredScopes, 'zk-cryptography');
  }
  if (!input.publicSignalLeakageTested) {
    warnings.push('public-signal-leakage-not-tested');
    addRequiredScope(requiredScopes, 'zk-cryptography');
  }
  if (!input.witnessHygieneTested) {
    warnings.push('witness-hygiene-not-tested');
    addRequiredScope(requiredScopes, 'zk-cryptography');
  }
  if (!isAtLeastInternal(input.posHandoffAbuseReviewed)) {
    warnings.push('pos-handoff-abuse-not-reviewed');
    addRequiredScope(requiredScopes, 'pos-handoff');
  }
  if (!input.incidentRunbookTested) {
    warnings.push('incident-runbook-not-tested');
    addRequiredScope(requiredScopes, 'incident-response');
  }
  if (input.hostedProductionClaim && !isAtLeastInternal(input.hostedRegistryPenTestReviewed)) {
    warnings.push('hosted-registry-pentest-not-reviewed');
    addRequiredScope(requiredScopes, 'hosted-registry');
  }

  const grade: ExternalAuditHardeningEvaluation['grade'] = blockers.length > 0
    ? 'blocked'
    : warnings.length > 0
      ? 'attention'
      : 'ready';

  return {
    valid: blockers.length === 0,
    grade,
    score: clampScore(100 - blockers.length * 18 - warnings.length * 5),
    requiredScopes: uniqueScopes(requiredScopes),
    blockers,
    warnings,
  };
}
