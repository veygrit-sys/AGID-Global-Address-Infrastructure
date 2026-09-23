import { addressConnectPrivateMaterialPaths } from './addressConnect';
import { ADDRESS_PRIVACY_THREAT_TEMPLATE_IDS } from './addressPrivacyThreatModelTemplates';
import { sha256Hex } from './sha256';

export const ADDRESS_LAUNCH_CENTER_MODEL_VERSION = 'agid-address-launch-center-v1';

export const ADDRESS_LAUNCH_CENTER_ENVIRONMENTS = [
  'development',
  'staging',
  'production',
] as const;

export const ADDRESS_LAUNCH_CENTER_PROFILES = [
  'standard',
  'high-risk',
  'humanitarian',
  'regulated',
] as const;

export const ADDRESS_LAUNCH_CENTER_MODES = [
  'local',
  'server',
  'zk',
  'ethereum',
  'full',
] as const;

export const ADDRESS_LAUNCH_CENTER_CATEGORIES = [
  'identity-oauth',
  'webhooks',
  'registry',
  'storage-logging',
  'duplicates',
  'high-risk',
  'errors',
  'terminal',
  'security',
  'threat-model',
] as const;

export const ADDRESS_LAUNCH_CENTER_STATUSES = [
  'ready',
  'attention',
  'blocked',
] as const;

export const ADDRESS_LAUNCH_CENTER_ITEM_STATUSES = [
  'pass',
  'warn',
  'fail',
  'not_applicable',
] as const;

export type AddressLaunchCenterEnvironment = (typeof ADDRESS_LAUNCH_CENTER_ENVIRONMENTS)[number];
export type AddressLaunchCenterProfile = (typeof ADDRESS_LAUNCH_CENTER_PROFILES)[number];
export type AddressLaunchCenterMode = (typeof ADDRESS_LAUNCH_CENTER_MODES)[number];
export type AddressLaunchCenterCategory = (typeof ADDRESS_LAUNCH_CENTER_CATEGORIES)[number];
export type AddressLaunchCenterStatus = (typeof ADDRESS_LAUNCH_CENTER_STATUSES)[number];
export type AddressLaunchCenterItemStatus = (typeof ADDRESS_LAUNCH_CENTER_ITEM_STATUSES)[number];

export type AddressLaunchCenterInput = {
  [key: string]: unknown;
  environment?: unknown;
  profile?: unknown;
  mode?: unknown;
  requiresHighRiskMode?: unknown;
  oauth?: unknown;
  webhooks?: unknown;
  registry?: unknown;
  storageLogging?: unknown;
  duplicates?: unknown;
  highRiskMode?: unknown;
  errorHandling?: unknown;
  terminal?: unknown;
  security?: unknown;
  threatModel?: unknown;
};

export type AddressLaunchCenterPrivacyBoundary = {
  rawAddressAccepted: false;
  rawAgidAccepted: false;
  rawAoidAccepted: false;
  rawApiKeyAccepted: false;
  proofCodeAccepted: false;
  launchEvidenceOnly: true;
  productionLogsMustBeRedacted: true;
};

export type AddressLaunchCenterChecklistItem = {
  id: string;
  category: AddressLaunchCenterCategory;
  label: string;
  requiredForProduction: boolean;
  summary: string;
  evidence: string[];
  remediation: string;
};

export type AddressLaunchCenterEvaluationItem = AddressLaunchCenterChecklistItem & {
  required: boolean;
  status: AddressLaunchCenterItemStatus;
  presentEvidence: string[];
  missingEvidence: string[];
};

export type AddressLaunchCenterChecklist = {
  modelVersion: typeof ADDRESS_LAUNCH_CENTER_MODEL_VERSION;
  categories: AddressLaunchCenterCategory[];
  statuses: AddressLaunchCenterStatus[];
  itemStatuses: AddressLaunchCenterItemStatus[];
  items: AddressLaunchCenterChecklistItem[];
  privacy: AddressLaunchCenterPrivacyBoundary;
  supports: {
    plaidStyleLaunchReadiness: true;
    webhookSignatureGate: true;
    revocationFreshnessGate: true;
    redactedLogGate: true;
    duplicateAoidGate: true;
    highRiskModeGate: true;
    localModeExemptions: true;
    threatModelTemplateGate: true;
  };
};

export type AddressLaunchCenterEvaluation = {
  modelVersion: typeof ADDRESS_LAUNCH_CENTER_MODEL_VERSION;
  accepted: boolean;
  status: AddressLaunchCenterStatus;
  environment: AddressLaunchCenterEnvironment;
  profile: AddressLaunchCenterProfile;
  mode: AddressLaunchCenterMode;
  launchRoot: string;
  score: number;
  items: AddressLaunchCenterEvaluationItem[];
  totals: {
    pass: number;
    warn: number;
    fail: number;
    notApplicable: number;
    required: number;
    blockedRequired: number;
  };
  nextActions: string[];
  errors: string[];
  warnings: string[];
  privacy: AddressLaunchCenterPrivacyBoundary;
};

const ADDRESS_LAUNCH_CENTER_PRIVACY: AddressLaunchCenterPrivacyBoundary = {
  rawAddressAccepted: false,
  rawAgidAccepted: false,
  rawAoidAccepted: false,
  rawApiKeyAccepted: false,
  proofCodeAccepted: false,
  launchEvidenceOnly: true,
  productionLogsMustBeRedacted: true,
};

type LaunchContext = {
  environment: AddressLaunchCenterEnvironment;
  profile: AddressLaunchCenterProfile;
  mode: AddressLaunchCenterMode;
  highRiskRequired: boolean;
};

type LaunchDefinition = AddressLaunchCenterChecklistItem & {
  applies: (context: LaunchContext) => boolean;
  required: (context: LaunchContext) => boolean;
  passes: (input: AddressLaunchCenterInput) => string[];
  warnings?: (input: AddressLaunchCenterInput) => string[];
};

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, nested]) => `${JSON.stringify(key)}:${stableJson(nested)}`).join(',')}}`;
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const text = cleanText(value) as T;
  return allowed.includes(text) ? text : fallback;
}

function bool(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function numberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function hasBoolean(section: unknown, key: string) {
  return bool(objectValue(section)[key]);
}

function hasFreshnessWithin(section: unknown, maxAgeKey: string, ageKey: string) {
  const source = objectValue(section);
  const maxAge = numberValue(source[maxAgeKey]) ?? 86_400;
  const age = numberValue(source[ageKey]);
  return age !== undefined && age >= 0 && age <= maxAge;
}

function present(section: unknown, keys: string[]) {
  return keys.filter(key => hasBoolean(section, key));
}

function modeNeedsNetwork(context: LaunchContext) {
  return context.mode !== 'local';
}

function modeNeedsWebhook(context: LaunchContext) {
  return context.mode === 'server' || context.mode === 'ethereum' || context.mode === 'full';
}

function modeNeedsOAuth(context: LaunchContext) {
  return context.mode === 'server' || context.mode === 'zk' || context.mode === 'ethereum' || context.mode === 'full';
}

function isProduction(context: LaunchContext) {
  return context.environment === 'production';
}

const CHECKLIST_DEFINITIONS: LaunchDefinition[] = [
  {
    id: 'oauth-scopes-consent',
    category: 'identity-oauth',
    label: 'OAuth scopes and consent are production-ready',
    requiredForProduction: true,
    summary: 'Every embedded Address Link / Element integration should use least-privilege scopes, a consent screen, token rotation, and duplicate connection prevention.',
    evidence: ['scopesDefined', 'consentScreenReady', 'leastPrivilegeScopes', 'tokenRotation', 'duplicateConnectionPrevention'],
    remediation: 'Define AGID scopes, show purpose-specific consent, rotate tokens, and block duplicate Address Item / AOID connections.',
    applies: modeNeedsOAuth,
    required: context => isProduction(context) && modeNeedsOAuth(context),
    passes: input => present(input.oauth, ['scopesDefined', 'consentScreenReady', 'leastPrivilegeScopes', 'tokenRotation', 'duplicateConnectionPrevention']),
  },
  {
    id: 'webhook-signature-verification',
    category: 'webhooks',
    label: 'Webhook signatures and replay protection are enforced',
    requiredForProduction: true,
    summary: 'Webhook events must be signed, timestamped, replay-protected, retried safely, and processed idempotently.',
    evidence: ['configured', 'signatureVerification', 'replayProtection', 'retryPolicy', 'deadLetterQueue', 'idempotencyKeys'],
    remediation: 'Enable HMAC or asymmetric webhook signatures, timestamp windows, retry/backoff, dead-letter queues, and idempotency keys.',
    applies: modeNeedsWebhook,
    required: context => isProduction(context) && modeNeedsWebhook(context),
    passes: input => present(input.webhooks, ['configured', 'signatureVerification', 'replayProtection', 'retryPolicy', 'deadLetterQueue', 'idempotencyKeys']),
  },
  {
    id: 'revocation-freshness-registry',
    category: 'registry',
    label: 'Revocation, freshness, issuer trust, and used-status checks are live',
    requiredForProduction: true,
    summary: 'The runtime must reject revoked credentials, stale proofs, untrusted issuers, and already-used QR/nullifier states.',
    evidence: ['revocationCheck', 'freshnessCheck', 'issuerTrustCheck', 'usedStatusCheck', 'freshnessAgeWithinMax'],
    remediation: 'Wire revocation, freshness, issuer trust, and used-status registry checks before accepting production handoffs.',
    applies: modeNeedsNetwork,
    required: context => isProduction(context) && modeNeedsNetwork(context),
    passes: (input) => [
      ...present(input.registry, ['revocationCheck', 'freshnessCheck', 'issuerTrustCheck', 'usedStatusCheck']),
      ...(hasFreshnessWithin(input.registry, 'maxFreshnessAgeSeconds', 'freshnessAgeSeconds') ? ['freshnessAgeWithinMax'] : []),
    ],
  },
  {
    id: 'redacted-storage-logs',
    category: 'storage-logging',
    label: 'Storage and logs are redacted by default',
    requiredForProduction: true,
    summary: 'Production logs must not persist raw address, AGID, AOID, proof codes, passkey secrets, or API keys.',
    evidence: ['redactionEnabled', 'retentionPolicyDays', 'auditLogEnabled', 'noRawAddressLogs', 'noRawAgidLogs', 'noRawAoidLogs', 'noProofCodeLogs'],
    remediation: 'Store commitments and public refs only, add retention windows, and enable audit logs without raw private payloads.',
    applies: () => true,
    required: isProduction,
    passes: (input) => {
      const source = objectValue(input.storageLogging);
      return [
        ...present(input.storageLogging, ['redactionEnabled', 'auditLogEnabled']),
        ...(numberValue(source.retentionPolicyDays) !== undefined ? ['retentionPolicyDays'] : []),
        ...(!bool(source.rawAddressLogs) ? ['noRawAddressLogs'] : []),
        ...(!bool(source.rawAgidLogs) ? ['noRawAgidLogs'] : []),
        ...(!bool(source.rawAoidLogs) ? ['noRawAoidLogs'] : []),
        ...(!bool(source.proofCodeLogs) ? ['noProofCodeLogs'] : []),
      ];
    },
  },
  {
    id: 'duplicate-aoid-prevention',
    category: 'duplicates',
    label: 'Duplicate AOID and Address Item prevention is enforced',
    requiredForProduction: true,
    summary: 'AOID duplicate registration, repeated Address Items, and cross-purpose nullifier reuse should be blocked before launch.',
    evidence: ['aoidDuplicateCheck', 'nullifierRequired', 'domainSeparation', 'idempotencyKeys', 'regionUniquenessPolicy'],
    remediation: 'Require nullifiers, domain separation, idempotency keys, and region uniqueness policy for AOID / Address Item registration.',
    applies: () => true,
    required: isProduction,
    passes: input => present(input.duplicates, ['aoidDuplicateCheck', 'nullifierRequired', 'domainSeparation', 'idempotencyKeys', 'regionUniquenessPolicy']),
  },
  {
    id: 'high-risk-mode',
    category: 'high-risk',
    label: 'High-risk mode is available and enforceable',
    requiredForProduction: true,
    summary: 'DV, refugee, disaster, humanitarian, and surveillance-risk workflows require AGID-S only, short expiry, reduced precision, challenge signing, and immediate revocation.',
    evidence: ['enabled', 'agidSOnly', 'shortExpiry', 'recipientChallenge', 'precisionReduction', 'immediateRevocation', 'noAddressHistoryRetention'],
    remediation: 'Enable high-risk mode with AGID-S only, short TTLs, recipient challenge signatures, reduced precision, immediate revocation, and no address history retention.',
    applies: context => context.highRiskRequired,
    required: context => context.highRiskRequired,
    passes: input => present(input.highRiskMode, ['enabled', 'agidSOnly', 'shortExpiry', 'recipientChallenge', 'precisionReduction', 'immediateRevocation', 'noAddressHistoryRetention']),
  },
  {
    id: 'typed-error-review-flow',
    category: 'errors',
    label: 'Typed errors, safe messages, and review fallback exist',
    requiredForProduction: true,
    summary: 'Operators need safe public error messages, retry/backoff, review queues, and a runbook for blocked or uncertain launch states.',
    evidence: ['typedErrors', 'safeUserMessages', 'retryBackoff', 'reviewQueue', 'operatorRunbook'],
    remediation: 'Map failures to typed errors, hide private details in messages, add retry/backoff, and route ambiguous cases to review.',
    applies: () => true,
    required: isProduction,
    passes: input => present(input.errorHandling, ['typedErrors', 'safeUserMessages', 'retryBackoff', 'reviewQueue', 'operatorRunbook']),
  },
  {
    id: 'terminal-operations',
    category: 'terminal',
    label: 'POS terminal operations are observable',
    requiredForProduction: true,
    summary: 'Staff roles, terminal diagnostics, offline queue state, registry sync, printer tests, and device health must be visible before launch.',
    evidence: ['staffRoles', 'deviceDiagnostics', 'offlineQueue', 'registrySyncVisible', 'printerTest'],
    remediation: 'Expose terminal diagnostics, staff permissions, registry sync, offline queues, and printer/device checks in the POS admin screen.',
    applies: () => true,
    required: isProduction,
    passes: input => present(input.terminal, ['staffRoles', 'deviceDiagnostics', 'offlineQueue', 'registrySyncVisible', 'printerTest']),
  },
  {
    id: 'threat-model-template-selected',
    category: 'threat-model',
    label: 'Privacy threat model template is selected and reviewed',
    requiredForProduction: true,
    summary: 'Every new address, proof, QR/NFC, webhook, registry, evidence, POS, field, or developer surface should choose the closest Address Privacy Threat Model Template before launch.',
    evidence: ['templateSelected', 'validTemplateId', 'reviewOwnerAssigned', 'misuseCasesReviewed', 'noRawAddressReviewed', 'highRiskModeReviewed', 'verificationCommandsMapped'],
    remediation: 'Select the closest Address Privacy Threat Model Template, assign a reviewer, review misuse cases, map verification commands, and record no-raw-address and high-risk-mode decisions.',
    applies: () => true,
    required: isProduction,
    passes: (input) => {
      const source = objectValue(input.threatModel);
      const templateId = cleanText(source.templateId);
      const validTemplateId = (ADDRESS_PRIVACY_THREAT_TEMPLATE_IDS as readonly string[]).includes(templateId);
      return [
        ...present(input.threatModel, ['templateSelected', 'misuseCasesReviewed', 'noRawAddressReviewed', 'highRiskModeReviewed', 'verificationCommandsMapped']),
        ...(validTemplateId ? ['validTemplateId'] : []),
        ...(cleanText(source.reviewOwner) ? ['reviewOwnerAssigned'] : []),
      ];
    },
    warnings: (input) => {
      const source = objectValue(input.threatModel);
      const templateId = cleanText(source.templateId);
      const warnings: string[] = [];
      if (!bool(source.templateSelected)) warnings.push('threat-model-template-not-selected');
      if (!(ADDRESS_PRIVACY_THREAT_TEMPLATE_IDS as readonly string[]).includes(templateId)) warnings.push('threat-model-template-id-not-recognized');
      return warnings;
    },
  },
  {
    id: 'release-security-controls',
    category: 'security',
    label: 'Release security controls are in place',
    requiredForProduction: true,
    summary: 'Public launch needs abuse control, origin checks, committed-secret scans, reproducible builds, and audit readiness.',
    evidence: ['rateLimits', 'csrfOrOriginChecks', 'secretsNotCommitted', 'reproducibleBuild', 'externalAuditReady'],
    remediation: 'Add rate limits, CSRF/origin checks, secret scanning, reproducible builds, and external audit readiness tracking.',
    applies: () => true,
    required: isProduction,
    passes: input => present(input.security, ['rateLimits', 'csrfOrOriginChecks', 'secretsNotCommitted', 'reproducibleBuild', 'externalAuditReady']),
    warnings: input => hasBoolean(input.security, 'externalAuditReady') ? [] : ['external-security-audit-not-marked-ready'],
  },
];

function buildContext(input: AddressLaunchCenterInput): LaunchContext {
  const environment = cleanEnum(
    input.environment,
    ADDRESS_LAUNCH_CENTER_ENVIRONMENTS,
    'staging',
  );
  const profile = cleanEnum(
    input.profile,
    ADDRESS_LAUNCH_CENTER_PROFILES,
    'standard',
  );
  const mode = cleanEnum(
    input.mode,
    ADDRESS_LAUNCH_CENTER_MODES,
    'server',
  );
  const highRiskRequired = bool(input.requiresHighRiskMode)
    || environment === 'production'
    || profile === 'high-risk'
    || profile === 'humanitarian'
    || profile === 'regulated';

  return {
    environment,
    profile,
    mode,
    highRiskRequired,
  };
}

function evaluateItem(definition: LaunchDefinition, input: AddressLaunchCenterInput, context: LaunchContext): AddressLaunchCenterEvaluationItem {
  const publicItem = itemForPublic(definition);
  const applies = definition.applies(context);
  const required = definition.required(context);

  if (!applies) {
    return {
      ...publicItem,
      required: false,
      status: 'not_applicable',
      presentEvidence: [],
      missingEvidence: [],
    };
  }

  const presentEvidence = Array.from(new Set(definition.passes(input)));
  const missingEvidence = definition.evidence.filter(item => !presentEvidence.includes(item));
  const status: AddressLaunchCenterItemStatus = missingEvidence.length === 0
    ? 'pass'
    : required
      ? 'fail'
      : 'warn';

  return {
    ...publicItem,
    required,
    status,
    presentEvidence,
    missingEvidence,
  };
}

function itemForPublic(definition: LaunchDefinition): AddressLaunchCenterChecklistItem {
  return {
    id: definition.id,
    category: definition.category,
    label: definition.label,
    requiredForProduction: definition.requiredForProduction,
    summary: definition.summary,
    evidence: [...definition.evidence],
    remediation: definition.remediation,
  };
}

export function listAddressLaunchCenterChecklist(): AddressLaunchCenterChecklist {
  return {
    modelVersion: ADDRESS_LAUNCH_CENTER_MODEL_VERSION,
    categories: [...ADDRESS_LAUNCH_CENTER_CATEGORIES],
    statuses: [...ADDRESS_LAUNCH_CENTER_STATUSES],
    itemStatuses: [...ADDRESS_LAUNCH_CENTER_ITEM_STATUSES],
    items: CHECKLIST_DEFINITIONS.map(itemForPublic),
    privacy: ADDRESS_LAUNCH_CENTER_PRIVACY,
    supports: {
      plaidStyleLaunchReadiness: true,
      webhookSignatureGate: true,
      revocationFreshnessGate: true,
      redactedLogGate: true,
      duplicateAoidGate: true,
      highRiskModeGate: true,
      localModeExemptions: true,
      threatModelTemplateGate: true,
    },
  };
}

export function evaluateAddressLaunchCenter(input: AddressLaunchCenterInput = {}): AddressLaunchCenterEvaluation {
  const context = buildContext(input);
  const errors = addressConnectPrivateMaterialPaths(input)
    .map(path => `private-material-not-accepted:${path}`);
  const items = CHECKLIST_DEFINITIONS.map(definition => evaluateItem(definition, input, context));
  const warningSet = new Set<string>();

  for (const definition of CHECKLIST_DEFINITIONS) {
    for (const warning of definition.warnings?.(input) ?? []) warningSet.add(warning);
  }
  if (context.mode === 'local') {
    warningSet.add('local-only-mode-skips-network-registry-and-webhook-gates');
  }
  if (errors.length > 0) {
    warningSet.add('launch-center-input-contained-private-material-and-was-not-accepted');
  }

  const totals = {
    pass: items.filter(item => item.status === 'pass').length,
    warn: items.filter(item => item.status === 'warn').length,
    fail: items.filter(item => item.status === 'fail').length,
    notApplicable: items.filter(item => item.status === 'not_applicable').length,
    required: items.filter(item => item.required).length,
    blockedRequired: items.filter(item => item.required && item.status === 'fail').length,
  };
  const accepted = errors.length === 0;
  const status: AddressLaunchCenterStatus = !accepted || totals.blockedRequired > 0
    ? 'blocked'
    : totals.warn > 0
      ? 'attention'
      : 'ready';
  const requiredPassed = items.filter(item => item.required && item.status === 'pass').length;
  const score = totals.required === 0
    ? 100
    : Math.round((requiredPassed / totals.required) * 100);
  const nextActions = items
    .filter(item => item.status === 'fail' || item.status === 'warn')
    .map(item => item.remediation);
  if (errors.length > 0) {
    nextActions.unshift('Remove raw address, raw AGID/AOID, proof code, API key, token, and secret material from Launch Center requests.');
  }

  const launchRoot = sha256Hex(stableJson({
    modelVersion: ADDRESS_LAUNCH_CENTER_MODEL_VERSION,
    environment: context.environment,
    profile: context.profile,
    mode: context.mode,
    statuses: items.map(item => ({
      id: item.id,
      status: item.status,
      presentEvidence: item.presentEvidence,
      missingEvidence: item.missingEvidence,
    })),
  }));

  return {
    modelVersion: ADDRESS_LAUNCH_CENTER_MODEL_VERSION,
    accepted,
    status,
    environment: context.environment,
    profile: context.profile,
    mode: context.mode,
    launchRoot,
    score,
    items,
    totals,
    nextActions: Array.from(new Set(nextActions)),
    errors,
    warnings: Array.from(warningSet),
    privacy: ADDRESS_LAUNCH_CENTER_PRIVACY,
  };
}
