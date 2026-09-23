import {
  scanNoRawAddressReleaseText,
  type NoRawAddressScanResult,
} from './noRawAddressReleaseScan';
import {
  cleanBoolean,
  cleanText,
  stableJson,
} from './redactedWorkflowCore';

export const SECURITY_MANDATORY_RELEASE_GATE_VERSION = 'security-mandatory-release-gate-v1';

export type MandatorySecurityReleaseRequirement =
  | 'no-raw-address-test'
  | 'privacy-release-policy'
  | 'terminal-signature'
  | 'short-term-alias'
  | 'audit-log-redaction';

export type MandatorySecurityReleaseFindingSeverity = 'warning' | 'error';

export type MandatorySecurityReleaseFinding = {
  requirement: MandatorySecurityReleaseRequirement;
  severity: MandatorySecurityReleaseFindingSeverity;
  code: string;
  detail: string;
};

export type MandatorySecurityTerminalSignatureInput = {
  required?: boolean;
  terminalId?: unknown;
  signature?: unknown;
  signedAt?: unknown;
  algorithm?: unknown;
};

export type MandatorySecurityShortTermAliasInput = {
  required?: boolean;
  value?: unknown;
  issuedAt?: unknown;
  expiresAt?: unknown;
  ttlSeconds?: unknown;
  maxTtlSeconds?: unknown;
};

export type MandatorySecurityAuditLogInput = {
  required?: boolean;
  event?: unknown;
  redactionApplied?: unknown;
  redactionVersion?: unknown;
};

export type MandatorySecurityPrivacyPolicyInput = {
  required?: boolean;
  noRawAddressByDefault?: unknown;
  rawAddressStorage?: unknown;
  publicPayloadUsesCommitments?: unknown;
  purposeLimited?: unknown;
  highRiskModeReviewed?: unknown;
  externalSharingReviewed?: unknown;
  plaintextTransmissionAllowed?: unknown;
  retentionDays?: unknown;
  maxRetentionDays?: unknown;
};

export type MandatorySecurityReleaseGateInput = {
  releaseText?: unknown;
  noRawAddressScan?: NoRawAddressScanResult;
  highRiskMode?: unknown;
  privacyPolicy?: MandatorySecurityPrivacyPolicyInput;
  terminalSignature?: MandatorySecurityTerminalSignatureInput;
  alias?: MandatorySecurityShortTermAliasInput;
  auditLog?: MandatorySecurityAuditLogInput;
};

export type MandatorySecurityReleaseRequirementStatus = {
  id: MandatorySecurityReleaseRequirement;
  passed: boolean;
};

export type MandatorySecurityReleaseGateResult = {
  valid: boolean;
  releaseBlocked: boolean;
  version: typeof SECURITY_MANDATORY_RELEASE_GATE_VERSION;
  requirements: MandatorySecurityReleaseRequirementStatus[];
  requiredPassed: MandatorySecurityReleaseRequirement[];
  requiredFailed: MandatorySecurityReleaseRequirement[];
  findings: MandatorySecurityReleaseFinding[];
};

const REQUIREMENTS: MandatorySecurityReleaseRequirement[] = [
  'no-raw-address-test',
  'privacy-release-policy',
  'terminal-signature',
  'short-term-alias',
  'audit-log-redaction',
];

const SHORT_TERM_ALIAS_RE = /^(WBA|ALIAS|DREF|QRAL|AGIDAL|SHIPAL)-[0-9A-F]{8,32}$/;
const DEFAULT_ALIAS_TTL_SECONDS = 15 * 60;
const HIGH_RISK_ALIAS_TTL_SECONDS = 5 * 60;

const FORBIDDEN_AUDIT_KEYS = new Set([
  'rawAddress',
  'addressText',
  'inputAddress',
  'addressLine',
  'addressLines',
  'streetAddress',
  'buildingName',
  'deliveryInstructions',
  'recipientName',
  'phoneNumber',
  'unitNumber',
  'roomNumber',
  'floorNumber',
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
]);

function pushFinding(
  findings: MandatorySecurityReleaseFinding[],
  requirement: MandatorySecurityReleaseRequirement,
  code: string,
  detail: string,
  severity: MandatorySecurityReleaseFindingSeverity = 'error',
) {
  findings.push({
    requirement,
    severity,
    code,
    detail,
  });
}

function toSerializableText(value: unknown) {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '';
  return stableJson(value);
}

function defaultScanText(input: MandatorySecurityReleaseGateInput) {
  return [
    input.releaseText,
    input.privacyPolicy,
    input.terminalSignature,
    input.alias,
    input.auditLog?.event,
  ]
    .map(toSerializableText)
    .filter(Boolean)
    .join('\n');
}

function isOptionalControl(required: unknown) {
  return required === false;
}

function isValidIsoTimestamp(value: string) {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

function numericSeconds(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed));
  }
  return undefined;
}

function numericDays(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed));
  }
  return fallback;
}

function aliasTtlSeconds(input: MandatorySecurityShortTermAliasInput) {
  const explicit = numericSeconds(input.ttlSeconds);
  if (explicit !== undefined) return explicit;

  const issuedAt = cleanText(input.issuedAt);
  const expiresAt = cleanText(input.expiresAt);
  if (!issuedAt || !expiresAt) return undefined;
  const issuedAtMs = Date.parse(issuedAt);
  const expiresAtMs = Date.parse(expiresAt);
  if (!Number.isFinite(issuedAtMs) || !Number.isFinite(expiresAtMs)) return undefined;
  return Math.max(0, Math.round((expiresAtMs - issuedAtMs) / 1000));
}

function maxAliasTtlSeconds(input: MandatorySecurityShortTermAliasInput, highRiskMode: boolean) {
  const explicit = numericSeconds(input.maxTtlSeconds);
  if (explicit !== undefined) return Math.min(explicit, DEFAULT_ALIAS_TTL_SECONDS);
  return highRiskMode ? HIGH_RISK_ALIAS_TTL_SECONDS : DEFAULT_ALIAS_TTL_SECONDS;
}

function collectForbiddenAuditPaths(value: unknown, path = '$'): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectForbiddenAuditPaths(item, `${path}[${index}]`));
  }

  const paths: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_AUDIT_KEYS.has(key)) {
      paths.push(childPath);
      continue;
    }
    if (key === 'waybillId') {
      const waybillAlias = cleanText(child).toUpperCase();
      if (!SHORT_TERM_ALIAS_RE.test(waybillAlias)) {
        paths.push(childPath);
        continue;
      }
    }
    paths.push(...collectForbiddenAuditPaths(child, childPath));
  }
  return paths;
}

function evaluateNoRawAddress(
  input: MandatorySecurityReleaseGateInput,
  findings: MandatorySecurityReleaseFinding[],
) {
  const scan = input.noRawAddressScan ?? scanNoRawAddressReleaseText(defaultScanText(input));
  const errors = scan.findings.filter(finding => finding.severity === 'error');
  const warnings = scan.findings.filter(finding => finding.severity === 'warning');

  for (const finding of errors) {
    pushFinding(
      findings,
      'no-raw-address-test',
      `no-raw-address:${finding.code}`,
      `Line ${finding.line}: ${finding.excerpt}`,
    );
  }
  for (const finding of warnings) {
    pushFinding(
      findings,
      'no-raw-address-test',
      `no-raw-address-warning:${finding.code}`,
      `Line ${finding.line}: ${finding.excerpt}`,
      'warning',
    );
  }
}

function evaluatePrivacyReleasePolicy(
  input: MandatorySecurityReleaseGateInput,
  findings: MandatorySecurityReleaseFinding[],
) {
  const policy = input.privacyPolicy ?? {};
  if (isOptionalControl(policy.required)) return;

  const highRiskMode = cleanBoolean(input.highRiskMode, false);
  const retentionDays = numericDays(policy.retentionDays, Number.NaN);
  const maxRetentionDays = Math.min(numericDays(policy.maxRetentionDays, highRiskMode ? 7 : 30), highRiskMode ? 7 : 30);

  if (!cleanBoolean(policy.noRawAddressByDefault, false)) {
    pushFinding(
      findings,
      'privacy-release-policy',
      'privacy-no-raw-address-default-missing',
      'Privacy release policy must keep no-raw-address-by-default enabled.',
    );
  }
  if (cleanBoolean(policy.rawAddressStorage, false)) {
    pushFinding(
      findings,
      'privacy-release-policy',
      'privacy-raw-address-storage-enabled',
      'Release candidates must not enable raw address storage in shared, public, or audit payloads.',
    );
  }
  if (!cleanBoolean(policy.publicPayloadUsesCommitments, false)) {
    pushFinding(
      findings,
      'privacy-release-policy',
      'privacy-public-payload-not-commitment-based',
      'Public payloads must use commitments, references, aliases, roots, or nullifiers instead of raw address material.',
    );
  }
  if (!cleanBoolean(policy.purposeLimited, false)) {
    pushFinding(
      findings,
      'privacy-release-policy',
      'privacy-purpose-limitation-missing',
      'Release candidates must declare purpose-limited address access.',
    );
  }
  if (!cleanBoolean(policy.externalSharingReviewed, false)) {
    pushFinding(
      findings,
      'privacy-release-policy',
      'privacy-external-sharing-review-missing',
      'External sharing must be reviewed before release, including POS, OPERA, carrier, translation, and validation connectors.',
    );
  }
  if (cleanBoolean(policy.plaintextTransmissionAllowed, false)) {
    pushFinding(
      findings,
      'privacy-release-policy',
      'privacy-plaintext-transmission-enabled',
      'Plaintext raw address transmission must be disabled by server-side policy, not controlled by request bodies.',
    );
  }
  if (highRiskMode && !cleanBoolean(policy.highRiskModeReviewed, false)) {
    pushFinding(
      findings,
      'privacy-release-policy',
      'privacy-high-risk-mode-review-missing',
      'High-risk mode requires explicit privacy review before release.',
    );
  }
  if (!Number.isFinite(retentionDays)) {
    pushFinding(
      findings,
      'privacy-release-policy',
      'privacy-retention-days-missing',
      'Privacy release policy must declare retentionDays for audit and shared payloads.',
    );
  } else if (retentionDays > maxRetentionDays) {
    pushFinding(
      findings,
      'privacy-release-policy',
      'privacy-retention-too-long',
      `Retention ${retentionDays}d exceeds the mandatory ${maxRetentionDays}d limit.`,
    );
  }
}

function evaluateTerminalSignature(
  input: MandatorySecurityReleaseGateInput,
  findings: MandatorySecurityReleaseFinding[],
) {
  const terminal = input.terminalSignature ?? {};
  if (isOptionalControl(terminal.required)) return;

  const terminalId = cleanText(terminal.terminalId, '', 96);
  const signature = cleanText(terminal.signature, '', 256);
  const signedAt = cleanText(terminal.signedAt, '', 64);
  const algorithm = cleanText(terminal.algorithm, '', 96);

  if (!terminalId) {
    pushFinding(findings, 'terminal-signature', 'terminal-id-missing', 'Terminal signatures must include a terminal id.');
  }
  if (signature.length < 16) {
    pushFinding(findings, 'terminal-signature', 'terminal-signature-missing', 'Terminal evidence must include a non-empty signature.');
  }
  if (!isValidIsoTimestamp(signedAt)) {
    pushFinding(findings, 'terminal-signature', 'terminal-signed-at-invalid', 'Terminal signatures must include an ISO timestamp.');
  }
  if (!algorithm) {
    pushFinding(findings, 'terminal-signature', 'terminal-signature-algorithm-missing', 'Terminal signatures must declare the signature algorithm.');
  }
}

function evaluateShortTermAlias(
  input: MandatorySecurityReleaseGateInput,
  findings: MandatorySecurityReleaseFinding[],
) {
  const alias = input.alias ?? {};
  if (isOptionalControl(alias.required)) return;

  const value = cleanText(alias.value, '', 64).toUpperCase();
  const highRiskMode = cleanBoolean(input.highRiskMode, false);
  const ttlSeconds = aliasTtlSeconds(alias);
  const maxTtlSeconds = maxAliasTtlSeconds(alias, highRiskMode);
  const expiresAt = cleanText(alias.expiresAt);

  if (!SHORT_TERM_ALIAS_RE.test(value)) {
    pushFinding(
      findings,
      'short-term-alias',
      'short-term-alias-invalid',
      'Operational references must use a short alias such as WBA-<hex>, not raw waybill, AGID, AOID, or address text.',
    );
  }
  if (!expiresAt && ttlSeconds === undefined) {
    pushFinding(
      findings,
      'short-term-alias',
      'short-term-alias-expiry-missing',
      'Short aliases must carry an expiry or explicit TTL.',
    );
  } else if (ttlSeconds === undefined) {
    pushFinding(
      findings,
      'short-term-alias',
      'short-term-alias-expiry-invalid',
      'Short alias expiry could not be parsed.',
    );
  } else if (ttlSeconds <= 0) {
    pushFinding(
      findings,
      'short-term-alias',
      'short-term-alias-expired-or-zero-ttl',
      'Short alias TTL must be positive.',
    );
  } else if (ttlSeconds > maxTtlSeconds) {
    pushFinding(
      findings,
      'short-term-alias',
      'short-term-alias-ttl-too-long',
      `Short alias TTL ${ttlSeconds}s exceeds the mandatory ${maxTtlSeconds}s limit.`,
    );
  }
}

function evaluateAuditLogRedaction(
  input: MandatorySecurityReleaseGateInput,
  findings: MandatorySecurityReleaseFinding[],
) {
  const auditLog = input.auditLog ?? {};
  if (isOptionalControl(auditLog.required)) return;

  if (!cleanBoolean(auditLog.redactionApplied, false)) {
    pushFinding(
      findings,
      'audit-log-redaction',
      'audit-redaction-not-applied',
      'Audit events must explicitly mark redaction as applied before persistence or export.',
    );
  }
  if (!cleanText(auditLog.redactionVersion, '', 80)) {
    pushFinding(
      findings,
      'audit-log-redaction',
      'audit-redaction-version-missing',
      'Audit events must record the redaction policy version.',
    );
  }
  if (auditLog.event === undefined || auditLog.event === null) {
    pushFinding(
      findings,
      'audit-log-redaction',
      'audit-event-missing',
      'A redacted audit event is required.',
    );
    return;
  }

  for (const path of collectForbiddenAuditPaths(auditLog.event)) {
    pushFinding(
      findings,
      'audit-log-redaction',
      `audit-log-forbidden-field:${path}`,
      `Audit logs must not persist raw or secret-bearing field ${path}.`,
    );
  }

  const scan = scanNoRawAddressReleaseText(toSerializableText(auditLog.event));
  for (const finding of scan.findings.filter(item => item.severity === 'error')) {
    pushFinding(
      findings,
      'audit-log-redaction',
      `audit-log-no-raw-address:${finding.code}`,
      `Audit line ${finding.line}: ${finding.excerpt}`,
    );
  }
}

export function listMandatorySecurityReleaseRequirements(): MandatorySecurityReleaseRequirement[] {
  return [...REQUIREMENTS];
}

export function evaluateMandatorySecurityReleaseGate(
  input: MandatorySecurityReleaseGateInput,
): MandatorySecurityReleaseGateResult {
  const findings: MandatorySecurityReleaseFinding[] = [];
  evaluateNoRawAddress(input, findings);
  evaluatePrivacyReleasePolicy(input, findings);
  evaluateTerminalSignature(input, findings);
  evaluateShortTermAlias(input, findings);
  evaluateAuditLogRedaction(input, findings);

  const requiredFailed = REQUIREMENTS.filter(requirement => (
    findings.some(finding => finding.requirement === requirement && finding.severity === 'error')
  ));
  const requiredPassed = REQUIREMENTS.filter(requirement => !requiredFailed.includes(requirement));
  const requirements = REQUIREMENTS.map(id => ({
    id,
    passed: requiredPassed.includes(id),
  }));
  const valid = requiredFailed.length === 0;

  return {
    valid,
    releaseBlocked: !valid,
    version: SECURITY_MANDATORY_RELEASE_GATE_VERSION,
    requirements,
    requiredPassed,
    requiredFailed,
    findings,
  };
}
