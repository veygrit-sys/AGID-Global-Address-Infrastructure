import { sha256Hex } from './sha256';

export const GOVERNANCE_VERSION = 'agid-governance-v1';
export const GOVERNANCE_COMMITMENT_ALGORITHM = 'sha256-domain-separated-governance-v1';

export const GOVERNANCE_FRAMEWORKS = [
  'GDPR',
  'CCPA',
  'HIPAA',
  'PCI-DSS',
  'SOC-2',
  'ISO-27001',
] as const;

export const GOVERNANCE_DATA_CLASSES = [
  'public',
  'internal',
  'personal',
  'sensitive-personal',
  'payment',
  'health',
  'address',
  'credential',
  'secret',
] as const;

export const GOVERNANCE_PROCESSING_PURPOSES = [
  'delivery',
  'identity',
  'support',
  'audit',
  'security',
  'payment',
  'healthcare',
  'marketing',
  'analytics',
  'research',
  'legal-hold',
] as const;

export const GOVERNANCE_AUDIT_EVENT_TYPES = [
  'user-access',
  'system-activity',
  'data-change',
  'security-event',
  'policy-change',
  'consent-change',
  'dsr-request',
  'incident',
  'corrective-action',
] as const;

export const GOVERNANCE_DSR_TYPES = [
  'access',
  'delete',
  'correct',
  'portability',
  'opt-out-sale-share',
  'restrict-processing',
  'consent-withdrawal',
] as const;

export const GOVERNANCE_DSR_STATUSES = [
  'received',
  'identity-verification-required',
  'processing',
  'fulfilled',
  'rejected',
  'expired',
  'blocked-by-legal-hold',
] as const;

export const GOVERNANCE_RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

export type GovernanceFramework = typeof GOVERNANCE_FRAMEWORKS[number];
export type GovernanceDataClass = typeof GOVERNANCE_DATA_CLASSES[number];
export type GovernanceProcessingPurpose = typeof GOVERNANCE_PROCESSING_PURPOSES[number];
export type GovernanceAuditEventType = typeof GOVERNANCE_AUDIT_EVENT_TYPES[number];
export type GovernanceDsrType = typeof GOVERNANCE_DSR_TYPES[number];
export type GovernanceDsrStatus = typeof GOVERNANCE_DSR_STATUSES[number];
export type GovernanceRiskLevel = typeof GOVERNANCE_RISK_LEVELS[number];
export type GovernanceFindingSeverity = 'info' | 'warning' | 'high' | 'critical';
export type GovernanceAccessControl = 'none' | 'rbac' | 'abac' | 'mfa-rbac' | 'break-glass';
export type GovernanceLegalBasis =
  | 'consent'
  | 'contract'
  | 'legal-obligation'
  | 'vital-interests'
  | 'public-task'
  | 'legitimate-interests'
  | 'none'
  | 'unknown';

export type GovernanceDataAssetInput = {
  assetId?: unknown;
  label?: unknown;
  dataClasses?: unknown;
  systems?: unknown;
  purposes?: unknown;
  owner?: unknown;
  region?: unknown;
  encryptedAtRest?: unknown;
  encryptedInTransit?: unknown;
  retentionDays?: unknown;
  rawPersonalDataStored?: unknown;
  thirdPartySharing?: unknown;
  consentRequired?: unknown;
  consentAvailable?: unknown;
  legalBasis?: unknown;
  deleteSupported?: unknown;
  exportSupported?: unknown;
  accessControl?: unknown;
  highRiskProcessing?: unknown;
  dataResidency?: unknown;
};

export type GovernanceDataAsset = {
  assetId: string;
  label: string;
  dataClasses: GovernanceDataClass[];
  systems: string[];
  purposes: GovernanceProcessingPurpose[];
  owner: string;
  region: string;
  encryptedAtRest: boolean;
  encryptedInTransit: boolean;
  retentionDays: number;
  rawPersonalDataStored: boolean;
  thirdPartySharing: boolean;
  consentRequired: boolean;
  consentAvailable: boolean;
  legalBasis: GovernanceLegalBasis;
  deleteSupported: boolean;
  exportSupported: boolean;
  accessControl: GovernanceAccessControl;
  highRiskProcessing: boolean;
  dataResidency?: string;
};

export type GovernanceAuditEventInput = {
  eventId?: unknown;
  eventType?: unknown;
  actorId?: unknown;
  actorRole?: unknown;
  resourceId?: unknown;
  timestamp?: unknown;
  safeSummary?: unknown;
  metadata?: unknown;
  rawPayload?: unknown;
  ipAddress?: unknown;
  userAgent?: unknown;
  signed?: unknown;
  previousHash?: unknown;
};

export type GovernanceAuditRecord = {
  eventId: string;
  eventType: GovernanceAuditEventType;
  actorAlias: string;
  actorRole: string;
  resourceCommitment: string;
  metadataCommitment: string;
  timestamp: string;
  safeSummary: string;
  signed: boolean;
  previousHash: string;
  eventHash: string;
  warnings: string[];
};

export type GovernanceAuditLog = {
  modelVersion: typeof GOVERNANCE_VERSION;
  generatedAt: string;
  records: GovernanceAuditRecord[];
  rootHash: string;
  tamperEvident: true;
  accepted: boolean;
  errors: string[];
  warnings: string[];
  privacy: GovernancePrivacyBoundary;
};

export type GovernanceDsrRequestInput = {
  requestId?: unknown;
  type?: unknown;
  subjectAlias?: unknown;
  assetIds?: unknown;
  receivedAt?: unknown;
  dueAt?: unknown;
  status?: unknown;
  identityVerified?: unknown;
  blockedByLegalHold?: unknown;
};

export type GovernanceDsrRequest = {
  requestId: string;
  type: GovernanceDsrType;
  subjectAlias: string;
  assetIds: string[];
  receivedAt: string;
  dueAt: string;
  status: GovernanceDsrStatus;
  identityVerified: boolean;
  blockedByLegalHold: boolean;
};

export type GovernanceIncidentInput = {
  incidentId?: unknown;
  detectedAt?: unknown;
  severity?: unknown;
  containsPersonalData?: unknown;
  containsSensitiveData?: unknown;
  notifiedAt?: unknown;
  rootCause?: unknown;
  correctiveActions?: unknown;
  status?: unknown;
};

export type GovernanceIncident = {
  incidentId: string;
  detectedAt: string;
  severity: GovernanceRiskLevel;
  containsPersonalData: boolean;
  containsSensitiveData: boolean;
  notifiedAt?: string;
  rootCause: string;
  correctiveActions: string[];
  status: 'open' | 'contained' | 'resolved' | 'monitoring';
};

export type GovernancePolicyInput = {
  policyId?: unknown;
  frameworks?: unknown;
  dataClasses?: unknown;
  requiredControls?: unknown;
  retentionDays?: unknown;
  reviewedAt?: unknown;
  owner?: unknown;
};

export type GovernancePolicy = {
  policyId: string;
  frameworks: GovernanceFramework[];
  dataClasses: GovernanceDataClass[];
  requiredControls: string[];
  retentionDays: number;
  reviewedAt: string;
  owner: string;
};

export type GovernanceFinding = {
  id: string;
  severity: GovernanceFindingSeverity;
  frameworks: GovernanceFramework[];
  assetId?: string;
  incidentId?: string;
  requestId?: string;
  message: string;
  action: string;
};

export type GovernanceFrameworkCoverage = {
  framework: GovernanceFramework;
  status: 'covered' | 'partial' | 'missing' | 'not-applicable';
  score: number;
  controlsPresent: string[];
  controlsMissing: string[];
};

export type GovernancePrivacyBoundary = {
  rawPersonalDataStored: false;
  rawAuditPayloadStored: false;
  rawIpAddressStored: false;
  rawUserAgentStored: false;
  publicSurface: 'aliases-commitments-policy-status-risk-and-redacted-audit-hashes-only';
};

export type GovernanceAssessmentInput = {
  generatedAt?: unknown;
  assets?: GovernanceDataAssetInput[] | unknown;
  auditEvents?: GovernanceAuditEventInput[] | unknown;
  dsrRequests?: GovernanceDsrRequestInput[] | unknown;
  incidents?: GovernanceIncidentInput[] | unknown;
  policies?: GovernancePolicyInput[] | unknown;
};

export type GovernanceAssessment = {
  modelVersion: typeof GOVERNANCE_VERSION;
  generatedAt: string;
  score: number;
  riskLevel: GovernanceRiskLevel;
  assets: GovernanceDataAsset[];
  auditLog: GovernanceAuditLog;
  dsrRequests: GovernanceDsrRequest[];
  incidents: GovernanceIncident[];
  policies: GovernancePolicy[];
  frameworkCoverage: GovernanceFrameworkCoverage[];
  findings: GovernanceFinding[];
  requiredActions: string[];
  reports: {
    complianceDashboard: true;
    auditReport: boolean;
    riskReport: boolean;
    dataProtectionMap: boolean;
    dpiaRequired: boolean;
    breachNotificationReviewRequired: boolean;
    dsrQueueOpen: number;
  };
  privacy: GovernancePrivacyBoundary;
  assessmentRoot: string;
};

export type GovernanceComplianceReport = {
  modelVersion: typeof GOVERNANCE_VERSION;
  reportId: string;
  generatedAt: string;
  score: number;
  riskLevel: GovernanceRiskLevel;
  sections: string[];
  metrics: {
    assetCount: number;
    personalDataAssetCount: number;
    sensitiveDataAssetCount: number;
    signedAuditEventPercent: number;
    openDsrRequestCount: number;
    openIncidentCount: number;
    criticalFindingCount: number;
    highFindingCount: number;
  };
  frameworkCoverage: GovernanceFrameworkCoverage[];
  requiredActions: string[];
  dpiaRequired: boolean;
  breachNotificationReviewRequired: boolean;
  privacy: GovernancePrivacyBoundary;
  reportRoot: string;
};

const DEFAULT_GENERATED_AT = '2026-06-18T00:00:00.000Z';
const MAX_OPERATIONAL_RETENTION_DAYS = 3650;
const PRIVATE_KEY_RE = /(raw.*address|address.*raw|recipient|phone|email|contact|latitude|longitude|\blat\b|\blng\b|agid|aoid|room|floor|passport|driver.?license|id.?number|secret|private.?key|token|authorization|signature)/i;
const PRIVATE_VALUE_RE = /(\bAGID[-_A-Z0-9]*\b|\bAOID[-_A-Z0-9]*\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{7,}\d|\b-?\d{1,2}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,})/i;

const PRIVACY_BOUNDARY: GovernancePrivacyBoundary = {
  rawPersonalDataStored: false,
  rawAuditPayloadStored: false,
  rawIpAddressStored: false,
  rawUserAgentStored: false,
  publicSurface: 'aliases-commitments-policy-status-risk-and-redacted-audit-hashes-only',
};

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableJson(object[key])}`)
    .join(',')}}`;
}

function clean(value: unknown, maxLength = 180) {
  return String(value ?? '')
    .replace(/\u0000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function bool(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const text = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(text)) return true;
    if (['false', '0', 'no', 'n', 'off'].includes(text)) return false;
  }
  return fallback;
}

function number(value: unknown, fallback: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function positiveInteger(value: unknown, fallback: number) {
  return Math.max(0, Math.floor(number(value, fallback)));
}

function iso(value: unknown, fallback = DEFAULT_GENERATED_AT) {
  const date = new Date(clean(value, 64) || fallback);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

function plusDays(at: string, days: number) {
  const date = new Date(at);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function arrayOfText(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(item => clean(item)).filter(Boolean);
  const text = clean(value);
  return text ? [text] : [];
}

function normalizeEnum<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  return allowed.includes(text) ? text as T[number] : fallback;
}

function normalizeFrameworks(value: unknown): GovernanceFramework[] {
  const values = arrayOfText(value)
    .map(item => item.toUpperCase().replace(/\s+/g, '-'))
    .filter((item): item is GovernanceFramework => (GOVERNANCE_FRAMEWORKS as readonly string[]).includes(item));
  return [...new Set(values)];
}

function normalizeDataClasses(value: unknown): GovernanceDataClass[] {
  const values = arrayOfText(value)
    .map(item => item.toLowerCase().replace(/_/g, '-'))
    .filter((item): item is GovernanceDataClass => (GOVERNANCE_DATA_CLASSES as readonly string[]).includes(item));
  return [...new Set(values.length ? values : ['internal' as GovernanceDataClass])];
}

function normalizePurposes(value: unknown): GovernanceProcessingPurpose[] {
  const values = arrayOfText(value)
    .map(item => item.toLowerCase().replace(/_/g, '-'))
    .filter((item): item is GovernanceProcessingPurpose => (GOVERNANCE_PROCESSING_PURPOSES as readonly string[]).includes(item));
  return [...new Set(values.length ? values : ['audit' as GovernanceProcessingPurpose])];
}

function normalizeLegalBasis(value: unknown): GovernanceLegalBasis {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if (['consent', 'contract', 'legal-obligation', 'vital-interests', 'public-task', 'legitimate-interests', 'none'].includes(text)) {
    return text as GovernanceLegalBasis;
  }
  return 'unknown';
}

function normalizeAccessControl(value: unknown): GovernanceAccessControl {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if (['rbac', 'abac', 'mfa-rbac', 'break-glass'].includes(text)) return text as GovernanceAccessControl;
  return 'none';
}

function hasPrivateMaterial(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).some(([key, nested]) => (
      PRIVATE_KEY_RE.test(key) || hasPrivateMaterial(nested)
    ));
  }
  return PRIVATE_VALUE_RE.test(clean(value, 1000));
}

function alias(value: unknown, domain: string, seed: string) {
  const text = clean(value, 120);
  if (text && !PRIVATE_VALUE_RE.test(text)) return text;
  return `${domain}_${sha256Hex(`${GOVERNANCE_COMMITMENT_ALGORITHM}:${domain}:${seed}:${text}`).slice(0, 14)}`;
}

function commitment(value: unknown, domain: string, seed: string) {
  return `${domain}:${sha256Hex(`${GOVERNANCE_COMMITMENT_ALGORITHM}:${domain}:${seed}:${stableJson(value)}`).slice(0, 40)}`;
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function isPersonalAsset(asset: GovernanceDataAsset) {
  return asset.dataClasses.some(dataClass => ['personal', 'sensitive-personal', 'address', 'credential', 'health', 'payment'].includes(dataClass));
}

function isSensitiveAsset(asset: GovernanceDataAsset) {
  return asset.dataClasses.some(dataClass => ['sensitive-personal', 'health', 'payment', 'secret', 'credential'].includes(dataClass));
}

function addFinding(findings: GovernanceFinding[], finding: GovernanceFinding) {
  if (!findings.some(item => item.id === finding.id && item.assetId === finding.assetId && item.incidentId === finding.incidentId && item.requestId === finding.requestId)) {
    findings.push(finding);
  }
}

export function classifyGovernanceDataAsset(input: GovernanceDataAssetInput = {}, index = 0): GovernanceDataAsset {
  const dataClasses = normalizeDataClasses(input.dataClasses);
  const assetSeed = clean(input.assetId, 120) || `asset:${index}`;
  const isPersonal = dataClasses.some(dataClass => ['personal', 'sensitive-personal', 'address', 'credential', 'health', 'payment'].includes(dataClass));
  return {
    assetId: alias(input.assetId, 'asset', assetSeed),
    label: clean(input.label, 120) || `Governance asset ${index + 1}`,
    dataClasses,
    systems: arrayOfText(input.systems).map(item => item.slice(0, 80)),
    purposes: normalizePurposes(input.purposes),
    owner: clean(input.owner, 80) || 'unassigned',
    region: clean(input.region, 32).toUpperCase() || 'GLOBAL',
    encryptedAtRest: bool(input.encryptedAtRest, false),
    encryptedInTransit: bool(input.encryptedInTransit, true),
    retentionDays: Math.min(MAX_OPERATIONAL_RETENTION_DAYS, positiveInteger(input.retentionDays, isPersonal ? 365 : 1095)),
    rawPersonalDataStored: bool(input.rawPersonalDataStored, false),
    thirdPartySharing: bool(input.thirdPartySharing, false),
    consentRequired: bool(input.consentRequired, isPersonal),
    consentAvailable: bool(input.consentAvailable, false),
    legalBasis: normalizeLegalBasis(input.legalBasis),
    deleteSupported: bool(input.deleteSupported, false),
    exportSupported: bool(input.exportSupported, false),
    accessControl: normalizeAccessControl(input.accessControl),
    highRiskProcessing: bool(input.highRiskProcessing, dataClasses.includes('sensitive-personal') || dataClasses.includes('health')),
    dataResidency: clean(input.dataResidency, 32).toUpperCase() || undefined,
  };
}

function normalizeAuditEventType(value: unknown): GovernanceAuditEventType {
  return normalizeEnum(value, GOVERNANCE_AUDIT_EVENT_TYPES, 'system-activity');
}

function normalizeDsrType(value: unknown): GovernanceDsrType {
  return normalizeEnum(value, GOVERNANCE_DSR_TYPES, 'access');
}

function normalizeDsrStatus(value: unknown, identityVerified: boolean, blockedByLegalHold: boolean): GovernanceDsrStatus {
  if (blockedByLegalHold) return 'blocked-by-legal-hold';
  const status = normalizeEnum(value, GOVERNANCE_DSR_STATUSES, identityVerified ? 'processing' : 'identity-verification-required');
  return status;
}

function normalizeRiskLevel(value: unknown): GovernanceRiskLevel {
  return normalizeEnum(value, GOVERNANCE_RISK_LEVELS, 'medium');
}

export function buildGovernanceAuditLog(events: GovernanceAuditEventInput[] | unknown = [], generatedAt = DEFAULT_GENERATED_AT): GovernanceAuditLog {
  const inputEvents = Array.isArray(events) ? events as GovernanceAuditEventInput[] : [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const records: GovernanceAuditRecord[] = [];
  let previousHash = 'governance-genesis';

  inputEvents.forEach((event, index) => {
    const eventId = alias(event.eventId, 'audit-event', `${index}:${generatedAt}`);
    const eventWarnings: string[] = [];
    const unsafePayload = event.rawPayload !== undefined || hasPrivateMaterial(event.rawPayload);
    const unsafeMetadata = hasPrivateMaterial(event.metadata);
    const unsafeNetwork = hasPrivateMaterial(event.ipAddress) || hasPrivateMaterial(event.userAgent);

    if (unsafePayload) {
      errors.push(`audit-event-${eventId}-raw-payload-rejected`);
      eventWarnings.push('raw-audit-payload-rejected');
    }
    if (unsafeMetadata) eventWarnings.push('private-metadata-committed-only');
    if (unsafeNetwork) eventWarnings.push('network-identifiers-committed-only');

    const safeSummary = clean(event.safeSummary, 160);
    const normalized: Omit<GovernanceAuditRecord, 'eventHash'> = {
      eventId,
      eventType: normalizeAuditEventType(event.eventType),
      actorAlias: alias(event.actorId, 'actor', eventId),
      actorRole: clean(event.actorRole, 80) || 'system',
      resourceCommitment: commitment(event.resourceId ?? `resource:${index}`, 'resource', eventId),
      metadataCommitment: commitment({
        metadata: event.metadata ?? null,
        ipAddress: event.ipAddress ?? null,
        userAgent: event.userAgent ?? null,
      }, 'audit-metadata', eventId),
      timestamp: iso(event.timestamp, generatedAt),
      safeSummary: PRIVATE_VALUE_RE.test(safeSummary) ? 'redacted-audit-summary' : (safeSummary || 'governance-audit-event'),
      signed: bool(event.signed, false),
      previousHash,
      warnings: eventWarnings,
    };
    const eventHash = sha256Hex(stableJson({
      ...normalized,
      warnings: normalized.warnings,
      version: GOVERNANCE_VERSION,
    }));
    previousHash = eventHash;
    records.push({ ...normalized, eventHash });
  });

  if (records.some(record => !record.signed)) warnings.push('unsigned-audit-events-need-review');
  const rootHash = sha256Hex(stableJson({
    version: GOVERNANCE_VERSION,
    records: records.map(record => [record.eventHash, record.previousHash, record.signed]),
  }));

  return {
    modelVersion: GOVERNANCE_VERSION,
    generatedAt: iso(generatedAt),
    records,
    rootHash,
    tamperEvident: true,
    accepted: errors.length === 0,
    errors,
    warnings,
    privacy: PRIVACY_BOUNDARY,
  };
}

function normalizeDsr(input: GovernanceDsrRequestInput = {}, index = 0, generatedAt = DEFAULT_GENERATED_AT): GovernanceDsrRequest {
  const receivedAt = iso(input.receivedAt, generatedAt);
  const identityVerified = bool(input.identityVerified, false);
  const blockedByLegalHold = bool(input.blockedByLegalHold, false);
  return {
    requestId: alias(input.requestId, 'dsr', `${index}:${receivedAt}`),
    type: normalizeDsrType(input.type),
    subjectAlias: alias(input.subjectAlias, 'subject', `${index}:${receivedAt}`),
    assetIds: arrayOfText(input.assetIds).map((item, assetIndex) => alias(item, 'asset', `${index}:${assetIndex}`)),
    receivedAt,
    dueAt: iso(input.dueAt, plusDays(receivedAt, 30)),
    status: normalizeDsrStatus(input.status, identityVerified, blockedByLegalHold),
    identityVerified,
    blockedByLegalHold,
  };
}

function normalizeIncident(input: GovernanceIncidentInput = {}, index = 0, generatedAt = DEFAULT_GENERATED_AT): GovernanceIncident {
  const severity = normalizeRiskLevel(input.severity);
  const statusText = clean(input.status).toLowerCase().replace(/_/g, '-');
  const status = ['open', 'contained', 'resolved', 'monitoring'].includes(statusText)
    ? statusText as GovernanceIncident['status']
    : 'open';
  return {
    incidentId: alias(input.incidentId, 'incident', `${index}:${generatedAt}`),
    detectedAt: iso(input.detectedAt, generatedAt),
    severity,
    containsPersonalData: bool(input.containsPersonalData, false),
    containsSensitiveData: bool(input.containsSensitiveData, false),
    notifiedAt: clean(input.notifiedAt, 64) ? iso(input.notifiedAt) : undefined,
    rootCause: clean(input.rootCause, 160) || 'unknown',
    correctiveActions: arrayOfText(input.correctiveActions),
    status,
  };
}

function normalizePolicy(input: GovernancePolicyInput = {}, index = 0, generatedAt = DEFAULT_GENERATED_AT): GovernancePolicy {
  return {
    policyId: alias(input.policyId, 'policy', `${index}:${generatedAt}`),
    frameworks: normalizeFrameworks(input.frameworks),
    dataClasses: normalizeDataClasses(input.dataClasses),
    requiredControls: arrayOfText(input.requiredControls),
    retentionDays: positiveInteger(input.retentionDays, 365),
    reviewedAt: iso(input.reviewedAt, generatedAt),
    owner: clean(input.owner, 80) || 'governance',
  };
}

function evaluateAssets(assets: GovernanceDataAsset[], findings: GovernanceFinding[]) {
  assets.forEach(asset => {
    if (asset.rawPersonalDataStored) {
      addFinding(findings, {
        id: 'raw-personal-data-storage-forbidden',
        severity: 'critical',
        frameworks: ['GDPR', 'CCPA', 'SOC-2', 'ISO-27001'],
        assetId: asset.assetId,
        message: 'Raw personal address or identity material is marked as stored.',
        action: 'Replace raw values with encrypted vault references, commitments, aliases, or short-lived local-only material.',
      });
    }
    if (isPersonalAsset(asset) && !asset.encryptedAtRest) {
      addFinding(findings, {
        id: 'personal-data-encryption-at-rest-missing',
        severity: 'high',
        frameworks: ['GDPR', 'CCPA', 'HIPAA', 'PCI-DSS', 'SOC-2', 'ISO-27001'],
        assetId: asset.assetId,
        message: 'Personal or regulated data lacks encryption at rest.',
        action: 'Enable encrypted storage and document key ownership and rotation.',
      });
    }
    if (isPersonalAsset(asset) && !asset.encryptedInTransit) {
      addFinding(findings, {
        id: 'personal-data-encryption-in-transit-missing',
        severity: 'high',
        frameworks: ['GDPR', 'CCPA', 'HIPAA', 'PCI-DSS', 'SOC-2', 'ISO-27001'],
        assetId: asset.assetId,
        message: 'Personal or regulated data lacks encrypted transport.',
        action: 'Require TLS or local-only processing for all regulated transfers.',
      });
    }
    if (isPersonalAsset(asset) && asset.accessControl === 'none') {
      addFinding(findings, {
        id: 'access-control-missing',
        severity: 'high',
        frameworks: ['GDPR', 'CCPA', 'HIPAA', 'PCI-DSS', 'SOC-2', 'ISO-27001'],
        assetId: asset.assetId,
        message: 'Personal or regulated data is not protected by RBAC, ABAC, MFA, or break-glass controls.',
        action: 'Bind access to role, purpose, staff/device posture, and audit logging.',
      });
    }
    if (isPersonalAsset(asset) && asset.legalBasis === 'unknown') {
      addFinding(findings, {
        id: 'privacy-legal-basis-missing',
        severity: 'high',
        frameworks: ['GDPR', 'CCPA'],
        assetId: asset.assetId,
        message: 'Personal data processing lacks an explicit legal basis or consent rule.',
        action: 'Declare purpose-bound legal basis and consent scope before processing.',
      });
    }
    if (asset.consentRequired && !asset.consentAvailable) {
      addFinding(findings, {
        id: 'consent-required-but-unavailable',
        severity: 'high',
        frameworks: ['GDPR', 'CCPA'],
        assetId: asset.assetId,
        message: 'The asset requires consent, but no consent receipt is available.',
        action: 'Capture a purpose-bound consent receipt or remove the processing activity.',
      });
    }
    if (isPersonalAsset(asset) && !asset.deleteSupported) {
      addFinding(findings, {
        id: 'data-subject-deletion-path-missing',
        severity: 'warning',
        frameworks: ['GDPR', 'CCPA'],
        assetId: asset.assetId,
        message: 'The asset has no deletion or revocation path for data-subject requests.',
        action: 'Add delete, revoke, or tombstone workflow with legal-hold exceptions.',
      });
    }
    if (isPersonalAsset(asset) && !asset.exportSupported) {
      addFinding(findings, {
        id: 'data-portability-export-path-missing',
        severity: 'warning',
        frameworks: ['GDPR', 'CCPA'],
        assetId: asset.assetId,
        message: 'The asset has no export path for access or portability requests.',
        action: 'Add a redacted export package with commitments and user-visible fields.',
      });
    }
    if (asset.retentionDays > 1095 && isPersonalAsset(asset)) {
      addFinding(findings, {
        id: 'personal-data-retention-too-long',
        severity: 'warning',
        frameworks: ['GDPR', 'CCPA', 'SOC-2', 'ISO-27001'],
        assetId: asset.assetId,
        message: 'Personal data retention exceeds three years without an explicit legal-hold reason.',
        action: 'Shorten retention, aggregate records, or document legal-hold scope.',
      });
    }
    if (asset.dataClasses.includes('payment') && (!asset.encryptedAtRest || asset.accessControl === 'none')) {
      addFinding(findings, {
        id: 'payment-data-pci-controls-missing',
        severity: 'critical',
        frameworks: ['PCI-DSS'],
        assetId: asset.assetId,
        message: 'Payment-related data lacks baseline encryption or access controls.',
        action: 'Do not store card data; use tokenized payment references, encryption, and least-privilege access.',
      });
    }
    if (asset.dataClasses.includes('health') && (!asset.encryptedAtRest || asset.accessControl === 'none' || !asset.encryptedInTransit)) {
      addFinding(findings, {
        id: 'health-data-hipaa-safeguards-missing',
        severity: 'critical',
        frameworks: ['HIPAA'],
        assetId: asset.assetId,
        message: 'Health-related data lacks administrative, technical, or transport safeguards.',
        action: 'Require encrypted storage/transport, access controls, audit logging, and minimum-necessary processing.',
      });
    }
  });
}

function evaluateDsrRequests(requests: GovernanceDsrRequest[], findings: GovernanceFinding[], generatedAt: string) {
  const now = Date.parse(generatedAt);
  requests.forEach(request => {
    if (!request.identityVerified && request.status !== 'fulfilled' && request.status !== 'rejected') {
      addFinding(findings, {
        id: 'dsr-identity-verification-required',
        severity: 'warning',
        frameworks: ['GDPR', 'CCPA'],
        requestId: request.requestId,
        message: 'A data-subject request is open without identity verification.',
        action: 'Verify the requester or reject the request with a documented reason.',
      });
    }
    if (Date.parse(request.dueAt) < now && !['fulfilled', 'rejected', 'blocked-by-legal-hold'].includes(request.status)) {
      addFinding(findings, {
        id: 'dsr-deadline-expired',
        severity: 'high',
        frameworks: ['GDPR', 'CCPA'],
        requestId: request.requestId,
        message: 'A data-subject request is past due.',
        action: 'Escalate to privacy operations and complete access, deletion, correction, or portability handling.',
      });
    }
  });
}

function evaluateIncidents(incidents: GovernanceIncident[], findings: GovernanceFinding[]) {
  incidents.forEach(incident => {
    if ((incident.containsPersonalData || incident.containsSensitiveData) && !incident.notifiedAt) {
      addFinding(findings, {
        id: 'breach-notification-review-required',
        severity: incident.containsSensitiveData || incident.severity === 'critical' ? 'critical' : 'high',
        frameworks: ['GDPR', 'CCPA', 'HIPAA', 'PCI-DSS', 'SOC-2', 'ISO-27001'],
        incidentId: incident.incidentId,
        message: 'A personal-data incident has no notification review timestamp.',
        action: 'Run breach-notification review, legal triage, containment, and evidence preservation.',
      });
    }
    if (incident.status !== 'resolved' && incident.correctiveActions.length === 0) {
      addFinding(findings, {
        id: 'incident-corrective-actions-missing',
        severity: incident.severity === 'critical' ? 'critical' : 'high',
        frameworks: ['SOC-2', 'ISO-27001'],
        incidentId: incident.incidentId,
        message: 'An open incident lacks corrective actions.',
        action: 'Assign remediation owners, due dates, and verification evidence.',
      });
    }
  });
}

function evaluateAuditLog(auditLog: GovernanceAuditLog, findings: GovernanceFinding[]) {
  if (!auditLog.accepted) {
    addFinding(findings, {
      id: 'audit-log-contains-raw-payload',
      severity: 'critical',
      frameworks: ['GDPR', 'CCPA', 'HIPAA', 'PCI-DSS', 'SOC-2', 'ISO-27001'],
      message: 'Audit input attempted to include raw payload material.',
      action: 'Drop raw payloads and store only commitments, redacted summaries, and signed receipts.',
    });
  }
  if (auditLog.records.length === 0) {
    addFinding(findings, {
      id: 'audit-log-missing',
      severity: 'high',
      frameworks: ['SOC-2', 'ISO-27001', 'GDPR', 'CCPA'],
      message: 'No audit events were provided for governance assessment.',
      action: 'Record user access, data changes, security events, policy changes, and DSR actions as signed, tamper-evident entries.',
    });
    return;
  }
  const unsignedCount = auditLog.records.filter(record => !record.signed).length;
  if (unsignedCount > 0) {
    addFinding(findings, {
      id: 'unsigned-audit-events',
      severity: unsignedCount === auditLog.records.length ? 'high' : 'warning',
      frameworks: ['SOC-2', 'ISO-27001'],
      message: `${unsignedCount} audit event(s) are unsigned.`,
      action: 'Require service, device, or operator signatures for governance audit records.',
    });
  }
}

function coverageFor(framework: GovernanceFramework, findings: GovernanceFinding[], applicable: boolean): GovernanceFrameworkCoverage {
  if (!applicable) {
    return {
      framework,
      status: 'not-applicable',
      score: 100,
      controlsPresent: [],
      controlsMissing: [],
    };
  }
  const relevant = findings.filter(finding => finding.frameworks.includes(framework));
  const controlsMissing = relevant.map(finding => finding.id);
  const severityPenalty = relevant.reduce((total, finding) => {
    if (finding.severity === 'critical') return total + 35;
    if (finding.severity === 'high') return total + 20;
    if (finding.severity === 'warning') return total + 8;
    return total + 2;
  }, 0);
  const score = Math.max(0, 100 - severityPenalty);
  const status = score >= 85 ? 'covered' : score >= 55 ? 'partial' : 'missing';
  return {
    framework,
    status,
    score,
    controlsPresent: [
      'commitment-only-audit-surface',
      'data-map-generated',
      'risk-findings-generated',
    ],
    controlsMissing: unique(controlsMissing),
  };
}

function riskFromScore(score: number, findings: GovernanceFinding[]): GovernanceRiskLevel {
  if (findings.some(finding => finding.severity === 'critical')) return 'critical';
  if (score < 55) return 'critical';
  if (score < 75 || findings.some(finding => finding.severity === 'high')) return 'high';
  if (score < 90 || findings.some(finding => finding.severity === 'warning')) return 'medium';
  return 'low';
}

function scoreFromFindings(findings: GovernanceFinding[]) {
  const penalty = findings.reduce((total, finding) => {
    if (finding.severity === 'critical') return total + 22;
    if (finding.severity === 'high') return total + 12;
    if (finding.severity === 'warning') return total + 4;
    return total + 1;
  }, 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

function requiredActions(findings: GovernanceFinding[]) {
  return unique(findings
    .filter(finding => finding.severity !== 'info')
    .sort((left, right) => {
      const order: Record<GovernanceFindingSeverity, number> = { critical: 0, high: 1, warning: 2, info: 3 };
      return order[left.severity] - order[right.severity];
    })
    .map(finding => finding.action));
}

export function assessGovernancePosture(input: GovernanceAssessmentInput = {}): GovernanceAssessment {
  const generatedAt = iso(input.generatedAt);
  const rawAssets = Array.isArray(input.assets) ? input.assets as GovernanceDataAssetInput[] : [];
  const rawDsrRequests = Array.isArray(input.dsrRequests) ? input.dsrRequests as GovernanceDsrRequestInput[] : [];
  const rawIncidents = Array.isArray(input.incidents) ? input.incidents as GovernanceIncidentInput[] : [];
  const rawPolicies = Array.isArray(input.policies) ? input.policies as GovernancePolicyInput[] : [];

  const assets = rawAssets.map((asset, index) => classifyGovernanceDataAsset(asset, index));
  const auditLog = buildGovernanceAuditLog(input.auditEvents, generatedAt);
  const dsrRequests = rawDsrRequests.map((request, index) => normalizeDsr(request, index, generatedAt));
  const incidents = rawIncidents.map((incident, index) => normalizeIncident(incident, index, generatedAt));
  const policies = rawPolicies.map((policy, index) => normalizePolicy(policy, index, generatedAt));
  const findings: GovernanceFinding[] = [];

  evaluateAssets(assets, findings);
  evaluateAuditLog(auditLog, findings);
  evaluateDsrRequests(dsrRequests, findings, generatedAt);
  evaluateIncidents(incidents, findings);

  const personalDataPresent = assets.some(isPersonalAsset);
  const paymentDataPresent = assets.some(asset => asset.dataClasses.includes('payment'));
  const healthDataPresent = assets.some(asset => asset.dataClasses.includes('health'));
  const sensitiveDataPresent = assets.some(isSensitiveAsset);
  const dpiaRequired = assets.some(asset => asset.highRiskProcessing || asset.thirdPartySharing || (asset.dataClasses.includes('address') && asset.purposes.includes('identity')));
  const breachNotificationReviewRequired = findings.some(finding => finding.id === 'breach-notification-review-required');
  const frameworkCoverage = GOVERNANCE_FRAMEWORKS.map(framework => coverageFor(framework, findings, (
    framework === 'HIPAA' ? healthDataPresent
      : framework === 'PCI-DSS' ? paymentDataPresent
        : framework === 'GDPR' || framework === 'CCPA' ? personalDataPresent
          : true
  )));
  const score = scoreFromFindings(findings);
  const assessmentRoot = sha256Hex(stableJson({
    version: GOVERNANCE_VERSION,
    generatedAt,
    assets: assets.map(asset => [asset.assetId, asset.dataClasses, asset.purposes]),
    auditRoot: auditLog.rootHash,
    findings: findings.map(finding => [finding.id, finding.severity, finding.assetId, finding.incidentId, finding.requestId]),
    frameworkCoverage: frameworkCoverage.map(item => [item.framework, item.status, item.score]),
  }));

  return {
    modelVersion: GOVERNANCE_VERSION,
    generatedAt,
    score,
    riskLevel: riskFromScore(score, findings),
    assets,
    auditLog,
    dsrRequests,
    incidents,
    policies,
    frameworkCoverage,
    findings,
    requiredActions: requiredActions(findings),
    reports: {
      complianceDashboard: true,
      auditReport: auditLog.records.length > 0,
      riskReport: findings.length > 0,
      dataProtectionMap: assets.length > 0,
      dpiaRequired,
      breachNotificationReviewRequired,
      dsrQueueOpen: dsrRequests.filter(request => !['fulfilled', 'rejected', 'blocked-by-legal-hold'].includes(request.status)).length,
    },
    privacy: PRIVACY_BOUNDARY,
    assessmentRoot,
  };
}

export function buildGovernanceComplianceReport(assessment: GovernanceAssessment): GovernanceComplianceReport {
  const criticalFindingCount = assessment.findings.filter(finding => finding.severity === 'critical').length;
  const highFindingCount = assessment.findings.filter(finding => finding.severity === 'high').length;
  const signedAuditEvents = assessment.auditLog.records.filter(record => record.signed).length;
  const sections = [
    'compliance-dashboard',
    'data-protection-map',
    'audit-log-integrity',
    'risk-register',
    'policy-management',
    'data-subject-rights',
  ];
  if (assessment.reports.dpiaRequired) sections.push('dpia-screening');
  if (assessment.reports.breachNotificationReviewRequired) sections.push('breach-notification-review');
  if (assessment.incidents.length > 0) sections.push('incident-management');
  const metrics = {
    assetCount: assessment.assets.length,
    personalDataAssetCount: assessment.assets.filter(isPersonalAsset).length,
    sensitiveDataAssetCount: assessment.assets.filter(isSensitiveAsset).length,
    signedAuditEventPercent: assessment.auditLog.records.length
      ? Math.round((signedAuditEvents / assessment.auditLog.records.length) * 1000) / 10
      : 0,
    openDsrRequestCount: assessment.reports.dsrQueueOpen,
    openIncidentCount: assessment.incidents.filter(incident => incident.status !== 'resolved').length,
    criticalFindingCount,
    highFindingCount,
  };
  const reportId = `gov_report_${sha256Hex(`${assessment.assessmentRoot}:${assessment.generatedAt}`).slice(0, 18)}`;
  const reportRoot = sha256Hex(stableJson({
    reportId,
    score: assessment.score,
    riskLevel: assessment.riskLevel,
    metrics,
    sections,
    requiredActions: assessment.requiredActions,
  }));
  return {
    modelVersion: GOVERNANCE_VERSION,
    reportId,
    generatedAt: assessment.generatedAt,
    score: assessment.score,
    riskLevel: assessment.riskLevel,
    sections,
    metrics,
    frameworkCoverage: assessment.frameworkCoverage,
    requiredActions: assessment.requiredActions,
    dpiaRequired: assessment.reports.dpiaRequired,
    breachNotificationReviewRequired: assessment.reports.breachNotificationReviewRequired,
    privacy: PRIVACY_BOUNDARY,
    reportRoot,
  };
}
