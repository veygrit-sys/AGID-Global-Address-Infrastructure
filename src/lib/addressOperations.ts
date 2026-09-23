import {
  buildCrossBorderAuxiliaryContext,
  type CrossBorderAuxiliaryDecision,
  type CrossBorderOperationMode,
  type CrossBorderUseCase,
  type ProductRiskFlag,
} from './crossBorderAuxiliaryData';
import {
  ADDRESS_CONNECT_WEBHOOK_TOPICS,
  addressConnectPrivateMaterialPaths,
  type AddressConnectWebhookTopic,
} from './addressConnect';
import {
  cleanBoolean,
  cleanNumber,
  cleanText,
  cleanTextArray,
  stableId,
  stableJson,
} from './redactedWorkflowCore';
import { sha256Hex } from './sha256';

export const ADDRESS_OPERATIONS_MODEL_VERSION = 'agid-address-operations-v1';

export const ADDRESS_IDENTITY_METHODS = [
  'aoid-credential',
  'passkey',
  'issuer-credential',
  'zk-address-proof',
  'recipient-proof',
  'nfc-card',
] as const;

export const ADDRESS_IDENTITY_CLAIMS = [
  'address-ownership',
  'residence',
  'delivery-eligibility',
] as const;

export const ADDRESS_DISPUTE_TYPES = [
  'misdelivery',
  'address-conflict',
  'same-address-claim',
  'pid-merge-split',
] as const;

export const ADDRESS_DISPUTE_STATUSES = [
  'open',
  'needs-review',
  'accepted',
  'rejected',
  'resolved',
] as const;

export const ADDRESS_REVIEW_CASE_CATEGORIES = [
  'needs-review',
  'rejected',
  'address-conflict',
  'audit',
  'terminal',
  'issuer',
] as const;

export const ADDRESS_REVIEW_CASE_STATUSES = [
  'open',
  'needs-evidence',
  'blocked',
  'rejected',
  'approved',
  'resolved',
] as const;

export const ADDRESS_REVIEW_QUEUE_LANES = [
  'needs-review-queue',
  'address-conflict-queue',
  'issuer-revocation-queue',
  'terminal-anomaly-queue',
  'radar-risk-queue',
  'audit-queue',
  'rejected-queue',
] as const;

export const ADDRESS_DASHBOARD_SECTIONS = [
  'logs',
  'link-events',
  'audit',
  'api-keys',
  'terminals',
  'issuers',
  'webhooks',
  'review-queue',
  'disputes',
  'qr-usage',
  'tax-customs',
] as const;

export type AddressIdentityMethod = (typeof ADDRESS_IDENTITY_METHODS)[number];
export type AddressIdentityClaim = (typeof ADDRESS_IDENTITY_CLAIMS)[number];
export type AddressDisputeType = (typeof ADDRESS_DISPUTE_TYPES)[number];
export type AddressDisputeStatus = (typeof ADDRESS_DISPUTE_STATUSES)[number];
export type AddressReviewCaseCategory = (typeof ADDRESS_REVIEW_CASE_CATEGORIES)[number];
export type AddressReviewCaseStatus = (typeof ADDRESS_REVIEW_CASE_STATUSES)[number];
export type AddressReviewQueueLane = (typeof ADDRESS_REVIEW_QUEUE_LANES)[number];
export type AddressDashboardSection = (typeof ADDRESS_DASHBOARD_SECTIONS)[number];

export type AddressOperationsPrivacyBoundary = {
  rawAddressAccepted: false;
  rawAgidAccepted: false;
  rawAoidAccepted: false;
  rawPasskeySecretAccepted: false;
  proofCodeAccepted: false;
  publicApiStoresPersonalData: false;
  usesCommitmentsAndRefsOnly: true;
};

export type AddressIdentityVerificationInput = {
  verificationId?: unknown;
  methods?: unknown;
  claims?: unknown;
  credentialRefs?: unknown;
  issuerCredentialRefs?: unknown;
  aoidCommitment?: unknown;
  subjectCommitment?: unknown;
  passkeyChallengeHash?: unknown;
  issuerTrustRoot?: unknown;
  revocationRoot?: unknown;
  freshnessRoot?: unknown;
  hasIssuerTrust?: unknown;
  hasRevocationCheck?: unknown;
  hasFreshnessCheck?: unknown;
  generatedAt?: unknown;
};

export type AddressIdentityVerification = {
  modelVersion: typeof ADDRESS_OPERATIONS_MODEL_VERSION;
  verificationId: string;
  accepted: boolean;
  verified: boolean;
  status: 'verified' | 'requires-review' | 'rejected';
  methods: AddressIdentityMethod[];
  claims: AddressIdentityClaim[];
  requiredEvidence: string[];
  missingEvidence: string[];
  credentialRefCount: number;
  identityRoot: string;
  errors: string[];
  warnings: string[];
  privacy: AddressOperationsPrivacyBoundary;
};

export type AddressWebhookEventInput = {
  eventId?: unknown;
  topic?: unknown;
  endpointId?: unknown;
  deliveryMode?: unknown;
  payload?: unknown;
  payloadFingerprint?: unknown;
  generatedAt?: unknown;
};

export type AddressWebhookEvent = {
  modelVersion: typeof ADDRESS_OPERATIONS_MODEL_VERSION;
  eventId: string;
  accepted: boolean;
  status: 'queued' | 'rejected';
  topic: AddressConnectWebhookTopic | null;
  endpointId: string;
  deliveryMode: 'webhook' | 'outbox' | 'local-audit';
  payloadFingerprint: string | null;
  errors: string[];
  warnings: string[];
  privacy: AddressOperationsPrivacyBoundary;
};

export type AddressDisputeCaseInput = {
  caseId?: unknown;
  type?: unknown;
  reporterRole?: unknown;
  evidenceRefs?: unknown;
  relatedIntentId?: unknown;
  relatedWaybillAlias?: unknown;
  relatedPidCommitment?: unknown;
  handoffReceiptRef?: unknown;
  pidMergeSplitTraceRef?: unknown;
  severity?: unknown;
  generatedAt?: unknown;
};

export type AddressDisputeCase = {
  modelVersion: typeof ADDRESS_OPERATIONS_MODEL_VERSION;
  caseId: string;
  accepted: boolean;
  type: AddressDisputeType | null;
  status: AddressDisputeStatus;
  severity: 'low' | 'medium' | 'high';
  reporterRole: string;
  evidenceRefs: string[];
  relatedRefs: {
    intentId?: string;
    waybillAlias?: string;
    pidCommitment?: string;
    handoffReceiptRef?: string;
    pidMergeSplitTraceRef?: string;
  };
  nextAction: string;
  errors: string[];
  warnings: string[];
  privacy: AddressOperationsPrivacyBoundary;
};

export type AddressTaxCustomsContextInput = {
  useCase?: unknown;
  originCountry?: unknown;
  destinationCountry?: unknown;
  hsCode?: unknown;
  barcode?: unknown;
  productCategory?: unknown;
  declaredValue?: unknown;
  currency?: unknown;
  riskFlags?: unknown;
  hasPostalCode?: unknown;
  hasAgid?: unknown;
  hasAoidCredential?: unknown;
  hasBusinessVatNumber?: unknown;
  hasImporterName?: unknown;
  hasExporterName?: unknown;
  mode?: unknown;
  generatedAt?: unknown;
};

export type AddressTaxCustomsContext = {
  modelVersion: typeof ADDRESS_OPERATIONS_MODEL_VERSION;
  accepted: boolean;
  contextId: string;
  decision: CrossBorderAuxiliaryDecision | null;
  status: 'ready-for-estimate' | 'needs-manual-review' | 'insufficient-data' | 'rejected';
  dashboardSignals: {
    section: AddressDashboardSection;
    reviewRequired: boolean;
    primaryReason?: string;
    dataPolicy: 'fully-free-local-first';
  };
  errors: string[];
  warnings: string[];
  privacy: AddressOperationsPrivacyBoundary;
};

export type AddressReviewCaseInput = {
  caseId?: unknown;
  category?: unknown;
  status?: unknown;
  severity?: unknown;
  owner?: unknown;
  title?: unknown;
  subjectRef?: unknown;
  evidenceRefs?: unknown;
  reason?: unknown;
  radarReasonCodes?: unknown;
  reasonCodes?: unknown;
  decision?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type AddressReviewCase = {
  modelVersion: typeof ADDRESS_OPERATIONS_MODEL_VERSION;
  caseId: string;
  category: AddressReviewCaseCategory;
  status: AddressReviewCaseStatus;
  severity: 'low' | 'medium' | 'high' | 'critical';
  owner: 'ops' | 'security' | 'support' | 'compliance' | 'platform';
  title: string;
  subjectRef: string;
  evidenceRefs: string[];
  reason: string;
  radarReasonCodes: string[];
  queueLane: AddressReviewQueueLane;
  decision:
    | 'approve'
    | 'reject'
    | 'request-evidence'
    | 'escalate'
    | 'quarantine';
  nextAction: string;
  createdAt: string;
  updatedAt: string;
  errors: string[];
  warnings: string[];
  privacy: AddressOperationsPrivacyBoundary;
};

export type AddressReviewConsoleInput = {
  generatedAt?: unknown;
  cases?: unknown;
  query?: unknown;
  categoryFilter?: unknown;
  ownerFilter?: unknown;
  selectedCaseId?: unknown;
};

export type AddressReviewConsoleTotals = {
  total: number;
  needsReview: number;
  rejected: number;
  addressConflicts: number;
  auditItems: number;
  terminalIssues: number;
  issuerIssues: number;
  issuerRevocations: number;
  terminalAnomalies: number;
  radarReasonCodes: number;
  blocked: number;
};

export type AddressReviewQueueSummary = {
  lane: AddressReviewQueueLane;
  label: string;
  count: number;
  critical: number;
  high: number;
  nextActionRefs: string[];
};

export type AddressRadarReasonCodeCount = {
  code: string;
  count: number;
  maxSeverity: AddressReviewCase['severity'];
  caseRefs: string[];
};

export type AddressReviewConsole = {
  modelVersion: typeof ADDRESS_OPERATIONS_MODEL_VERSION;
  generatedAt: string;
  accepted: boolean;
  cases: AddressReviewCase[];
  filteredCases: AddressReviewCase[];
  selectedCase: AddressReviewCase | null;
  filters: {
    query: string;
    categoryFilter: AddressReviewCaseCategory | 'all';
    ownerFilter: AddressReviewCase['owner'] | 'all';
  };
  totals: AddressReviewConsoleTotals;
  reviewQueues: AddressReviewQueueSummary[];
  radarReasonCodeCounts: AddressRadarReasonCodeCount[];
  actionQueue: Array<Pick<AddressReviewCase, 'caseId' | 'category' | 'status' | 'severity' | 'owner' | 'nextAction' | 'queueLane' | 'radarReasonCodes'>>;
  safeExport: {
    modelVersion: typeof ADDRESS_OPERATIONS_MODEL_VERSION;
    exportId: string;
    generatedAt: string;
    reviewRoot: string;
    totals: AddressReviewConsoleTotals;
    reviewQueues: AddressReviewQueueSummary[];
    radarReasonCodeCounts: AddressRadarReasonCodeCount[];
    cases: Array<Pick<AddressReviewCase, 'caseId' | 'category' | 'status' | 'severity' | 'owner' | 'subjectRef' | 'evidenceRefs' | 'radarReasonCodes' | 'queueLane' | 'decision' | 'nextAction'>>;
    privacy: AddressOperationsPrivacyBoundary;
  };
  payloadSafety: {
    safe: boolean;
    forbiddenPaths: string[];
  };
  privacy: AddressOperationsPrivacyBoundary;
};

export type AddressDashboardSnapshotInput = {
  generatedAt?: unknown;
  logs?: unknown;
  linkEvents?: unknown;
  audit?: unknown;
  apiKeys?: unknown;
  terminals?: unknown;
  issuers?: unknown;
  webhooks?: unknown;
  reviewQueue?: unknown;
  disputes?: unknown;
  qrUsage?: unknown;
  taxCustoms?: unknown;
};

export type AddressDashboardSnapshot = {
  modelVersion: typeof ADDRESS_OPERATIONS_MODEL_VERSION;
  accepted: boolean;
  generatedAt: string;
  overallStatus: 'ready' | 'attention' | 'blocked';
  sections: Array<{
    id: AddressDashboardSection;
    label: string;
    status: 'ready' | 'attention' | 'blocked';
    primaryMetric: number;
    eventCount: number;
    blockedCount: number;
    attentionCount: number;
    staleCount: number;
    lastEventAt: string | null;
    focus: string[];
    nextAction: string;
  }>;
  totals: {
    blocked: number;
    attention: number;
    ready: number;
    reviewItems: number;
    events: number;
    stale: number;
    qrUsed: number;
    webhookFailures: number;
    terminalIncidents: number;
    issuerProblems: number;
  };
  summary: {
    apiEvents: number;
    linkEvents: number;
    webhookEvents: number;
    terminalEvents: number;
    issuerEvents: number;
    reviewItems: number;
    disputeItems: number;
    qrUsed: number;
  };
  attentionFeed: Array<{
    section: AddressDashboardSection;
    status: 'attention' | 'blocked';
    reason: string;
    count: number;
    nextAction: string;
  }>;
  lastEventAt: string | null;
  errors: string[];
  warnings: string[];
  privacy: AddressOperationsPrivacyBoundary;
};

export const ADDRESS_DASHBOARD_STATUS_FILTERS = [
  'all',
  'blocked',
  'attention',
  'ready',
] as const;

export type AddressDashboardStatusFilter = (typeof ADDRESS_DASHBOARD_STATUS_FILTERS)[number];

export type AddressDashboardConsoleInput = AddressDashboardSnapshotInput & {
  query?: unknown;
  statusFilter?: unknown;
  selectedSection?: unknown;
};

export type AddressDashboardCommand = {
  section: AddressDashboardSection;
  status: 'attention' | 'blocked';
  reason: string;
  count: number;
  nextAction: string;
  owner: 'ops' | 'security' | 'support' | 'compliance' | 'platform';
};

export type AddressDashboardRunbook = {
  section: AddressDashboardSection;
  owner: AddressDashboardCommand['owner'];
  primaryAction: string;
  steps: string[];
  evidenceRefs: string[];
};

export type AddressDashboardSafeExport = {
  modelVersion: typeof ADDRESS_OPERATIONS_MODEL_VERSION;
  exportId: string;
  generatedAt: string;
  dashboardRoot: string;
  accepted: boolean;
  overallStatus: AddressDashboardSnapshot['overallStatus'];
  totals: AddressDashboardSnapshot['totals'];
  sections: Array<Pick<
    AddressDashboardSnapshot['sections'][number],
    'id' | 'status' | 'eventCount' | 'blockedCount' | 'attentionCount' | 'staleCount' | 'lastEventAt' | 'nextAction'
  >>;
  attentionFeed: AddressDashboardSnapshot['attentionFeed'];
  privacy: AddressOperationsPrivacyBoundary;
};

export type AddressDashboardConsole = {
  modelVersion: typeof ADDRESS_OPERATIONS_MODEL_VERSION;
  snapshot: AddressDashboardSnapshot;
  filters: {
    query: string;
    statusFilter: AddressDashboardStatusFilter;
  };
  filteredSections: AddressDashboardSnapshot['sections'];
  selectedSection: AddressDashboardSnapshot['sections'][number] | null;
  commandQueue: AddressDashboardCommand[];
  runbook: AddressDashboardRunbook | null;
  safeExport: AddressDashboardSafeExport;
  payloadSafety: {
    safe: boolean;
    forbiddenPaths: string[];
  };
};

const ADDRESS_OPERATIONS_PRIVACY: AddressOperationsPrivacyBoundary = {
  rawAddressAccepted: false,
  rawAgidAccepted: false,
  rawAoidAccepted: false,
  rawPasskeySecretAccepted: false,
  proofCodeAccepted: false,
  publicApiStoresPersonalData: false,
  usesCommitmentsAndRefsOnly: true,
};

function cleanArray(value: unknown): string[] {
  return cleanTextArray(value);
}

function cleanEnums<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  return Array.from(new Set(cleanArray(value).filter((item): item is T => allowed.includes(item as T))));
}

function bool(value: unknown) {
  return cleanBoolean(value);
}

function numeric(value: unknown) {
  const parsed = cleanNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function cleanRiskFlags(value: unknown): ProductRiskFlag[] {
  const allowed: ProductRiskFlag[] = [
    'battery',
    'hazmat',
    'medicine',
    'cosmetics',
    'food',
    'plant-animal',
    'controlled-dual-use',
    'high-value',
    'age-restricted',
  ];
  return cleanEnums(value, allowed);
}

function privateMaterialErrors(input: unknown) {
  return addressConnectPrivateMaterialPaths(input)
    .map(path => `private-material-not-accepted:${path}`);
}

function hasRef(value: unknown) {
  return cleanText(value).length > 0;
}

function hasAnyRef(value: unknown) {
  return cleanArray(value).length > 0;
}

export function buildAddressIdentityVerification(
  input: AddressIdentityVerificationInput = {},
): AddressIdentityVerification {
  const errors = privateMaterialErrors(input);
  const methods = cleanEnums(input.methods, ADDRESS_IDENTITY_METHODS);
  const claims = cleanEnums(input.claims, ADDRESS_IDENTITY_CLAIMS);
  const credentialRefs = cleanArray(input.credentialRefs);
  const issuerCredentialRefs = cleanArray(input.issuerCredentialRefs);
  const requiredEvidence = new Set<string>();
  const missingEvidence = new Set<string>();
  const warnings: string[] = [];

  if (methods.length === 0) missingEvidence.add('identity-method');
  if (claims.length === 0) missingEvidence.add('identity-claim');

  const hasAoidCredential = methods.includes('aoid-credential') && (credentialRefs.length > 0 || hasRef(input.aoidCommitment));
  const hasPasskey = methods.includes('passkey') && hasRef(input.passkeyChallengeHash);
  const hasIssuerCredential = methods.includes('issuer-credential') && issuerCredentialRefs.length > 0;
  const hasIssuerTrust = bool(input.hasIssuerTrust) || hasRef(input.issuerTrustRoot);
  const hasRevocation = bool(input.hasRevocationCheck) || hasRef(input.revocationRoot);
  const hasFreshness = bool(input.hasFreshnessCheck) || hasRef(input.freshnessRoot);

  for (const claim of claims) {
    if (claim === 'address-ownership') {
      requiredEvidence.add('aoid-credential-or-passkey');
      if (!hasAoidCredential && !hasPasskey) missingEvidence.add('aoid-credential-or-passkey');
      requiredEvidence.add('aoid-or-subject-commitment');
      if (!hasRef(input.aoidCommitment) && !hasRef(input.subjectCommitment)) {
        missingEvidence.add('aoid-or-subject-commitment');
      }
    }
    if (claim === 'residence') {
      requiredEvidence.add('issuer-credential');
      requiredEvidence.add('issuer-trust');
      requiredEvidence.add('revocation-check');
      requiredEvidence.add('freshness-check');
      if (!hasIssuerCredential) missingEvidence.add('issuer-credential');
      if (!hasIssuerTrust) missingEvidence.add('issuer-trust');
      if (!hasRevocation) missingEvidence.add('revocation-check');
      if (!hasFreshness) missingEvidence.add('freshness-check');
    }
    if (claim === 'delivery-eligibility') {
      requiredEvidence.add('delivery-credential-or-aoid-credential');
      requiredEvidence.add('revocation-check');
      requiredEvidence.add('freshness-check');
      if (!hasAoidCredential && !hasIssuerCredential && !methods.includes('zk-address-proof')) {
        missingEvidence.add('delivery-credential-or-aoid-credential');
      }
      if (!hasRevocation) missingEvidence.add('revocation-check');
      if (!hasFreshness) missingEvidence.add('freshness-check');
    }
  }

  if (methods.includes('zk-address-proof')) {
    warnings.push('zk-proof-verification-must-be-run-by-a-circuit-specific-verifier');
  }
  if (methods.includes('passkey') && !hasPasskey) {
    warnings.push('passkey-method-requires-challenge-hash-not-raw-passkey-secret');
  }

  const accepted = errors.length === 0;
  const verified = accepted && missingEvidence.size === 0;
  const status = !accepted ? 'rejected' : verified ? 'verified' : 'requires-review';
  const identityRoot = sha256Hex(stableJson({
    methods,
    claims,
    credentialRefs,
    issuerCredentialRefs,
    aoidCommitment: cleanText(input.aoidCommitment),
    subjectCommitment: cleanText(input.subjectCommitment),
    passkeyChallengeHash: cleanText(input.passkeyChallengeHash),
    issuerTrustRoot: cleanText(input.issuerTrustRoot),
    revocationRoot: cleanText(input.revocationRoot),
    freshnessRoot: cleanText(input.freshnessRoot),
  }));

  return {
    modelVersion: ADDRESS_OPERATIONS_MODEL_VERSION,
    verificationId: cleanText(input.verificationId) || stableId('AIV', identityRoot),
    accepted,
    verified,
    status,
    methods,
    claims,
    requiredEvidence: Array.from(requiredEvidence).sort(),
    missingEvidence: Array.from(missingEvidence).sort(),
    credentialRefCount: credentialRefs.length + issuerCredentialRefs.length,
    identityRoot,
    errors,
    warnings,
    privacy: ADDRESS_OPERATIONS_PRIVACY,
  };
}

export function buildAddressWebhookEvent(input: AddressWebhookEventInput = {}): AddressWebhookEvent {
  const errors = privateMaterialErrors(input);
  const topicText = cleanText(input.topic);
  const topic = ADDRESS_CONNECT_WEBHOOK_TOPICS.includes(topicText as AddressConnectWebhookTopic)
    ? topicText as AddressConnectWebhookTopic
    : null;
  if (!topic) errors.push('unsupported-webhook-topic');

  const endpointId = cleanText(input.endpointId);
  if (!endpointId) errors.push('endpoint-id-required');

  const warnings: string[] = [];
  const explicitFingerprint = cleanText(input.payloadFingerprint);
  const payloadFingerprint = explicitFingerprint
    || (input.payload === undefined ? '' : sha256Hex(stableJson(input.payload)).slice(0, 32));
  if (!payloadFingerprint) warnings.push('payload-fingerprint-or-public-payload-reference-recommended');

  const deliveryModeText = cleanText(input.deliveryMode);
  const deliveryMode = deliveryModeText === 'outbox' || deliveryModeText === 'local-audit'
    ? deliveryModeText
    : 'webhook';

  const accepted = errors.length === 0;
  return {
    modelVersion: ADDRESS_OPERATIONS_MODEL_VERSION,
    eventId: cleanText(input.eventId) || stableId('AWH', {
      topic,
      endpointId,
      payloadFingerprint,
      generatedAt: cleanText(input.generatedAt),
    }),
    accepted,
    status: accepted ? 'queued' : 'rejected',
    topic,
    endpointId,
    deliveryMode,
    payloadFingerprint: payloadFingerprint || null,
    errors,
    warnings,
    privacy: ADDRESS_OPERATIONS_PRIVACY,
  };
}

export function buildAddressDisputeCase(input: AddressDisputeCaseInput = {}): AddressDisputeCase {
  const errors = privateMaterialErrors(input);
  const typeText = cleanText(input.type);
  const type = ADDRESS_DISPUTE_TYPES.includes(typeText as AddressDisputeType)
    ? typeText as AddressDisputeType
    : null;
  if (!type) errors.push('unsupported-dispute-type');

  const evidenceRefs = cleanArray(input.evidenceRefs);
  const warnings: string[] = [];
  if (evidenceRefs.length === 0 && !hasRef(input.handoffReceiptRef) && !hasRef(input.pidMergeSplitTraceRef)) {
    errors.push('evidence-ref-required');
  }
  if (type === 'pid-merge-split' && !hasRef(input.relatedPidCommitment) && !hasRef(input.pidMergeSplitTraceRef)) {
    errors.push('pid-merge-split-requires-pid-commitment-or-trace-ref');
  }
  if (type === 'misdelivery' && !hasRef(input.handoffReceiptRef)) {
    warnings.push('handoff-receipt-ref-recommended-for-misdelivery-disputes');
  }

  const severityText = cleanText(input.severity);
  const severity = severityText === 'high' || severityText === 'medium' || severityText === 'low'
    ? severityText
    : type === 'misdelivery' || type === 'same-address-claim'
      ? 'high'
      : 'medium';
  const accepted = errors.length === 0;
  const nextAction = !accepted
    ? 'fix-dispute-evidence'
    : type === 'misdelivery'
      ? 'open-carrier-handoff-audit'
      : type === 'address-conflict'
        ? 'compare-address-resolution-lineage'
        : type === 'same-address-claim'
          ? 'request-independent-issuer-review'
          : 'review-pid-lineage-merge-split-proof';

  return {
    modelVersion: ADDRESS_OPERATIONS_MODEL_VERSION,
    caseId: cleanText(input.caseId) || stableId('ADC', {
      type,
      evidenceRefs,
      relatedIntentId: cleanText(input.relatedIntentId),
      relatedWaybillAlias: cleanText(input.relatedWaybillAlias),
      relatedPidCommitment: cleanText(input.relatedPidCommitment),
    }),
    accepted,
    type,
    status: accepted ? 'needs-review' : 'rejected',
    severity,
    reporterRole: cleanText(input.reporterRole) || 'operator',
    evidenceRefs: Array.from(new Set([
      ...evidenceRefs,
      cleanText(input.handoffReceiptRef),
      cleanText(input.pidMergeSplitTraceRef),
    ].filter(Boolean))),
    relatedRefs: {
      intentId: cleanText(input.relatedIntentId) || undefined,
      waybillAlias: cleanText(input.relatedWaybillAlias) || undefined,
      pidCommitment: cleanText(input.relatedPidCommitment) || undefined,
      handoffReceiptRef: cleanText(input.handoffReceiptRef) || undefined,
      pidMergeSplitTraceRef: cleanText(input.pidMergeSplitTraceRef) || undefined,
    },
    nextAction,
    errors,
    warnings,
    privacy: ADDRESS_OPERATIONS_PRIVACY,
  };
}

export function buildAddressTaxCustomsContext(
  input: AddressTaxCustomsContextInput = {},
): AddressTaxCustomsContext {
  const errors = privateMaterialErrors(input);
  const originCountry = cleanText(input.originCountry).toUpperCase();
  const destinationCountry = cleanText(input.destinationCountry).toUpperCase();
  if (!/^[A-Z]{2}$/.test(originCountry)) errors.push('origin-country-required');
  if (!/^[A-Z]{2}$/.test(destinationCountry)) errors.push('destination-country-required');

  if (errors.length > 0) {
    return {
      modelVersion: ADDRESS_OPERATIONS_MODEL_VERSION,
      accepted: false,
      contextId: stableId('ATC', input),
      decision: null,
      status: 'rejected',
      dashboardSignals: {
        section: 'tax-customs',
        reviewRequired: true,
        primaryReason: errors[0],
        dataPolicy: 'fully-free-local-first',
      },
      errors,
      warnings: [],
      privacy: ADDRESS_OPERATIONS_PRIVACY,
    };
  }

  const requestedUseCase = cleanText(input.useCase);
  const useCase: CrossBorderUseCase = requestedUseCase === 'pos-checkout'
    || requestedUseCase === 'shopping-agent'
    || requestedUseCase === 'humanitarian-handoff'
    ? requestedUseCase
    : 'cross-border-shipping';
  const requestedMode = cleanText(input.mode);
  const mode = requestedMode === 'mode-0-local-only'
    || requestedMode === 'mode-1-server-registry'
    || requestedMode === 'mode-2-zk-only'
    || requestedMode === 'mode-3-ethereum-registry-only'
    || requestedMode === 'mode-4-full-zk-ethereum'
    ? requestedMode as CrossBorderOperationMode
    : undefined;
  const riskFlags = cleanRiskFlags(input.riskFlags);
  const decision = buildCrossBorderAuxiliaryContext({
    useCase,
    originCountry,
    destinationCountry,
    product: {
      hsCode: cleanText(input.hsCode),
      barcode: cleanText(input.barcode),
      category: cleanText(input.productCategory),
      declaredValue: numeric(input.declaredValue),
      currency: cleanText(input.currency).toUpperCase(),
      riskFlags,
    },
    address: {
      hasRecipientAddress: false,
      hasPostalCode: bool(input.hasPostalCode),
      hasAgid: bool(input.hasAgid),
      hasAoidCredential: bool(input.hasAoidCredential),
    },
    party: {
      hasBusinessVatNumber: bool(input.hasBusinessVatNumber),
      hasImporterName: bool(input.hasImporterName),
      hasExporterName: bool(input.hasExporterName),
    },
    mode,
    dataPolicy: 'fully-free-local-first',
  });

  return {
    modelVersion: ADDRESS_OPERATIONS_MODEL_VERSION,
    accepted: true,
    contextId: stableId('ATC', {
      originCountry,
      destinationCountry,
      hsCode: cleanText(input.hsCode),
      declaredValue: numeric(input.declaredValue),
      currency: cleanText(input.currency).toUpperCase(),
      riskFlags,
      decisionStatus: decision.status,
    }),
    decision,
    status: decision.status,
    dashboardSignals: {
      section: 'tax-customs',
      reviewRequired: decision.status !== 'ready-for-estimate',
      primaryReason: decision.manualReviewReasons[0],
      dataPolicy: 'fully-free-local-first',
    },
    errors: [],
    warnings: decision.warnings,
    privacy: ADDRESS_OPERATIONS_PRIVACY,
  };
}

function normalizeReviewCaseCategory(value: unknown): AddressReviewCaseCategory {
  const text = cleanText(value);
  return ADDRESS_REVIEW_CASE_CATEGORIES.includes(text as AddressReviewCaseCategory)
    ? text as AddressReviewCaseCategory
    : 'needs-review';
}

function normalizeReviewCaseStatus(value: unknown, category: AddressReviewCaseCategory): AddressReviewCaseStatus {
  const text = cleanText(value);
  if (ADDRESS_REVIEW_CASE_STATUSES.includes(text as AddressReviewCaseStatus)) return text as AddressReviewCaseStatus;
  if (category === 'rejected') return 'rejected';
  if (category === 'terminal' || category === 'issuer') return 'blocked';
  return 'open';
}

function reviewOwnerFor(category: AddressReviewCaseCategory, value: unknown): AddressReviewCase['owner'] {
  const text = cleanText(value);
  if (text === 'ops' || text === 'security' || text === 'support' || text === 'compliance' || text === 'platform') return text;
  if (category === 'terminal') return 'ops';
  if (category === 'issuer') return 'compliance';
  if (category === 'audit' || category === 'rejected') return 'security';
  return 'support';
}

function reviewSeverityFor(category: AddressReviewCaseCategory, value: unknown): AddressReviewCase['severity'] {
  const text = cleanText(value);
  if (text === 'low' || text === 'medium' || text === 'high' || text === 'critical') return text;
  if (category === 'rejected' || category === 'issuer') return 'critical';
  if (category === 'address-conflict' || category === 'terminal' || category === 'audit') return 'high';
  return 'medium';
}

function reviewDecisionFor(
  category: AddressReviewCaseCategory,
  status: AddressReviewCaseStatus,
  value: unknown,
): AddressReviewCase['decision'] {
  const text = cleanText(value);
  if (text === 'approve' || text === 'reject' || text === 'request-evidence' || text === 'escalate' || text === 'quarantine') return text;
  if (status === 'rejected' || category === 'rejected') return 'reject';
  if (category === 'terminal' || category === 'issuer') return 'quarantine';
  if (category === 'audit') return 'escalate';
  if (category === 'address-conflict') return 'request-evidence';
  return 'request-evidence';
}

function reviewNextAction(category: AddressReviewCaseCategory, decision: AddressReviewCase['decision']) {
  if (decision === 'reject') return 'confirm-rejection-and-notify-safely';
  if (decision === 'quarantine' && category === 'terminal') return 'quarantine-terminal-and-require-device-diagnostics';
  if (decision === 'quarantine' && category === 'issuer') return 'suspend-issuer-and-check-revocation-root';
  if (category === 'address-conflict') return 'compare-lineage-issuer-and-handoff-evidence';
  if (category === 'audit') return 'reconcile-redacted-receipt-and-policy-log';
  if (category === 'issuer') return 'verify-issuer-trust-status-and-key-rotation';
  if (category === 'terminal') return 'review-terminal-health-offline-queue-and-signature';
  return 'request-redacted-evidence-and-operator-decision';
}

function defaultRadarReasonCodesFor(category: AddressReviewCaseCategory, reason: string) {
  const lower = reason.toLowerCase();
  const codes: string[] = [];
  if (category === 'rejected' || lower.includes('qr') || lower.includes('token')) codes.push('qr-used-before');
  if (category === 'address-conflict' || lower.includes('aoid') || lower.includes('same-address')) codes.push('aoid-multi-registration');
  if (category === 'audit' || lower.includes('sync') || lower.includes('receipt')) codes.push('offline-conflict');
  if (category === 'terminal' || lower.includes('terminal') || lower.includes('device')) codes.push('device-repeated-failures');
  if (category === 'issuer' || lower.includes('issuer') || lower.includes('revocation')) codes.push('registry-revoked');
  if (category === 'needs-review' || lower.includes('quality') || lower.includes('partial')) codes.push('quality-partial');
  return Array.from(new Set(codes));
}

function cleanRadarReasonCodes(input: AddressReviewCaseInput, category: AddressReviewCaseCategory, reason: string) {
  const explicit = cleanArray(input.radarReasonCodes).length > 0
    ? cleanArray(input.radarReasonCodes)
    : cleanArray(input.reasonCodes);
  const codes = explicit.length > 0 ? explicit : defaultRadarReasonCodesFor(category, reason);
  return Array.from(new Set(codes
    .map(item => cleanText(item, '', 72))
    .filter(Boolean)))
    .slice(0, 8);
}

function reviewQueueLaneFor(
  category: AddressReviewCaseCategory,
  status: AddressReviewCaseStatus,
  radarReasonCodes: string[],
): AddressReviewQueueLane {
  if (category === 'issuer') return 'issuer-revocation-queue';
  if (category === 'terminal') return 'terminal-anomaly-queue';
  if (category === 'address-conflict') return 'address-conflict-queue';
  if (category === 'audit') return 'audit-queue';
  if (category === 'rejected' || status === 'rejected') return 'rejected-queue';
  if (radarReasonCodes.some(code => code !== 'quality-partial')) return 'radar-risk-queue';
  return 'needs-review-queue';
}

function reviewCaseMatches(caseItem: AddressReviewCase, query: string) {
  if (!query) return true;
  const haystack = [
    caseItem.caseId,
    caseItem.category,
    caseItem.status,
    caseItem.severity,
    caseItem.owner,
    caseItem.title,
    caseItem.subjectRef,
    caseItem.reason,
    caseItem.decision,
    caseItem.nextAction,
    caseItem.queueLane,
    ...caseItem.evidenceRefs,
    ...caseItem.radarReasonCodes,
  ].join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function buildAddressReviewCase(input: AddressReviewCaseInput = {}): AddressReviewCase {
  const errors = privateMaterialErrors(input);
  const warnings: string[] = [];
  const category = normalizeReviewCaseCategory(input.category);
  const status = normalizeReviewCaseStatus(input.status, category);
  const owner = reviewOwnerFor(category, input.owner);
  const severity = reviewSeverityFor(category, input.severity);
  const decision = reviewDecisionFor(category, status, input.decision);
  const evidenceRefs = Array.from(new Set(cleanArray(input.evidenceRefs)));
  const subjectRef = cleanText(input.subjectRef, '', 96);
  if (!subjectRef) errors.push('subject-ref-required');
  if (evidenceRefs.length === 0) warnings.push('redacted-evidence-ref-recommended');
  const createdAt = cleanText(input.createdAt) || new Date().toISOString();
  const updatedAt = cleanText(input.updatedAt) || createdAt;
  const reason = cleanText(input.reason, `${category}-requires-operator-review`, 140);
  const radarReasonCodes = cleanRadarReasonCodes(input, category, reason);
  const queueLane = reviewQueueLaneFor(category, status, radarReasonCodes);
  const title = cleanText(input.title, sectionLabel(category === 'needs-review' || category === 'rejected' ? 'review-queue' : category === 'address-conflict' ? 'disputes' : category === 'audit' ? 'audit' : category === 'terminal' ? 'terminals' : 'issuers'), 120);

  return {
    modelVersion: ADDRESS_OPERATIONS_MODEL_VERSION,
    caseId: cleanText(input.caseId) || stableId('ARC', {
      category,
      subjectRef,
      evidenceRefs,
      reason,
      createdAt,
    }),
    category,
    status: errors.length > 0 ? 'rejected' : status,
    severity,
    owner,
    title,
    subjectRef,
    evidenceRefs,
    reason,
    radarReasonCodes,
    queueLane,
    decision: errors.length > 0 ? 'reject' : decision,
    nextAction: errors.length > 0 ? 'remove-private-material-and-resubmit-review-case' : reviewNextAction(category, decision),
    createdAt,
    updatedAt,
    errors,
    warnings,
    privacy: ADDRESS_OPERATIONS_PRIVACY,
  };
}

function normalizeReviewCases(value: unknown): AddressReviewCase[] {
  if (!Array.isArray(value)) return [];
  return value.map(item => buildAddressReviewCase(item as AddressReviewCaseInput));
}

function normalizeReviewCaseCategoryFilter(value: unknown): AddressReviewCaseCategory | 'all' {
  const text = cleanText(value);
  return ADDRESS_REVIEW_CASE_CATEGORIES.includes(text as AddressReviewCaseCategory)
    ? text as AddressReviewCaseCategory
    : 'all';
}

function normalizeReviewOwnerFilter(value: unknown): AddressReviewCase['owner'] | 'all' {
  const text = cleanText(value);
  return text === 'ops' || text === 'security' || text === 'support' || text === 'compliance' || text === 'platform'
    ? text
    : 'all';
}

function reviewRootFor(cases: AddressReviewCase[], generatedAt: string) {
  return sha256Hex(stableJson({
    modelVersion: ADDRESS_OPERATIONS_MODEL_VERSION,
    generatedAt,
    cases: cases.map(item => ({
      caseId: item.caseId,
      category: item.category,
      status: item.status,
      severity: item.severity,
      owner: item.owner,
      subjectRef: item.subjectRef,
      evidenceRefs: item.evidenceRefs,
      radarReasonCodes: item.radarReasonCodes,
      queueLane: item.queueLane,
      decision: item.decision,
      nextAction: item.nextAction,
    })),
  }));
}

const REVIEW_QUEUE_LABELS: Record<AddressReviewQueueLane, string> = {
  'needs-review-queue': 'Needs review',
  'address-conflict-queue': 'Address conflict',
  'issuer-revocation-queue': 'Issuer revocation',
  'terminal-anomaly-queue': 'Terminal anomaly',
  'radar-risk-queue': 'Radar risk',
  'audit-queue': 'Audit',
  'rejected-queue': 'Rejected',
};

function buildReviewQueueSummaries(cases: AddressReviewCase[]): AddressReviewQueueSummary[] {
  return ADDRESS_REVIEW_QUEUE_LANES.map((lane) => {
    const laneCases = cases.filter(item => item.queueLane === lane && item.status !== 'approved' && item.status !== 'resolved');
    return {
      lane,
      label: REVIEW_QUEUE_LABELS[lane],
      count: laneCases.length,
      critical: laneCases.filter(item => item.severity === 'critical').length,
      high: laneCases.filter(item => item.severity === 'high').length,
      nextActionRefs: Array.from(new Set(laneCases.map(item => item.nextAction))).slice(0, 4),
    };
  });
}

function severityRank(severity: AddressReviewCase['severity']) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[severity];
}

function buildRadarReasonCodeCounts(cases: AddressReviewCase[]): AddressRadarReasonCodeCount[] {
  const counts = new Map<string, AddressRadarReasonCodeCount>();
  for (const item of cases) {
    for (const code of item.radarReasonCodes) {
      const existing = counts.get(code);
      if (!existing) {
        counts.set(code, {
          code,
          count: 1,
          maxSeverity: item.severity,
          caseRefs: [item.caseId],
        });
      } else {
        existing.count += 1;
        if (severityRank(item.severity) > severityRank(existing.maxSeverity)) {
          existing.maxSeverity = item.severity;
        }
        if (!existing.caseRefs.includes(item.caseId)) existing.caseRefs.push(item.caseId);
      }
    }
  }
  return Array.from(counts.values())
    .map(item => ({ ...item, caseRefs: item.caseRefs.slice(0, 8) }))
    .sort((left, right) => (
      severityRank(right.maxSeverity) - severityRank(left.maxSeverity)
      || right.count - left.count
      || left.code.localeCompare(right.code)
    ));
}

export function buildAddressReviewConsole(input: AddressReviewConsoleInput = {}): AddressReviewConsole {
  const generatedAt = cleanText(input.generatedAt) || new Date().toISOString();
  const cases = normalizeReviewCases(input.cases);
  const query = cleanText(input.query);
  const categoryFilter = normalizeReviewCaseCategoryFilter(input.categoryFilter);
  const ownerFilter = normalizeReviewOwnerFilter(input.ownerFilter);
  const filteredCases = cases.filter(item => (
    (categoryFilter === 'all' || item.category === categoryFilter) &&
    (ownerFilter === 'all' || item.owner === ownerFilter) &&
    reviewCaseMatches(item, query)
  ));
  const selectedCaseId = cleanText(input.selectedCaseId);
  const selectedCase = filteredCases.find(item => item.caseId === selectedCaseId)
    ?? filteredCases[0]
    ?? null;
  const totals: AddressReviewConsoleTotals = {
    total: cases.length,
    needsReview: cases.filter(item => item.category === 'needs-review').length,
    rejected: cases.filter(item => item.category === 'rejected' || item.status === 'rejected').length,
    addressConflicts: cases.filter(item => item.category === 'address-conflict').length,
    auditItems: cases.filter(item => item.category === 'audit').length,
    terminalIssues: cases.filter(item => item.category === 'terminal').length,
    issuerIssues: cases.filter(item => item.category === 'issuer').length,
    issuerRevocations: cases.filter(item => item.queueLane === 'issuer-revocation-queue').length,
    terminalAnomalies: cases.filter(item => item.queueLane === 'terminal-anomaly-queue').length,
    radarReasonCodes: cases.reduce((sum, item) => sum + item.radarReasonCodes.length, 0),
    blocked: cases.filter(item => item.status === 'blocked' || item.severity === 'critical').length,
  };
  const reviewQueues = buildReviewQueueSummaries(cases);
  const radarReasonCodeCounts = buildRadarReasonCodeCounts(cases);
  const actionQueue = [...cases]
    .filter(item => item.status !== 'approved' && item.status !== 'resolved')
    .sort((left, right) => {
      return severityRank(right.severity) - severityRank(left.severity)
        || Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
    })
    .map(item => ({
      caseId: item.caseId,
      category: item.category,
      status: item.status,
      severity: item.severity,
      owner: item.owner,
      queueLane: item.queueLane,
      radarReasonCodes: item.radarReasonCodes,
      nextAction: item.nextAction,
    }));
  const reviewRoot = reviewRootFor(cases, generatedAt);
  const safeExport: AddressReviewConsole['safeExport'] = {
    modelVersion: ADDRESS_OPERATIONS_MODEL_VERSION,
    exportId: stableId('ARE', reviewRoot),
    generatedAt,
    reviewRoot,
    totals,
    reviewQueues,
    radarReasonCodeCounts,
    cases: cases.map(item => ({
      caseId: item.caseId,
      category: item.category,
      status: item.status,
      severity: item.severity,
      owner: item.owner,
      subjectRef: item.subjectRef,
      evidenceRefs: item.evidenceRefs,
      radarReasonCodes: item.radarReasonCodes,
      queueLane: item.queueLane,
      decision: item.decision,
      nextAction: item.nextAction,
    })),
    privacy: ADDRESS_OPERATIONS_PRIVACY,
  };
  const payloadSafety = validateAddressDashboardPayloadIsSafe(safeExport);

  return {
    modelVersion: ADDRESS_OPERATIONS_MODEL_VERSION,
    generatedAt,
    accepted: cases.every(item => item.errors.length === 0) && payloadSafety.safe,
    cases,
    filteredCases,
    selectedCase,
    filters: { query, categoryFilter, ownerFilter },
    totals,
    reviewQueues,
    radarReasonCodeCounts,
    actionQueue,
    safeExport,
    payloadSafety,
    privacy: ADDRESS_OPERATIONS_PRIVACY,
  };
}

function countMetric(value: unknown, keys: string[]) {
  if (Array.isArray(value)) return keys.some(key => ['total', 'count', 'events', 'eventCount', 'event_count'].includes(key))
    ? value.length
    : 0;
  if (!value || typeof value !== 'object') return 0;
  const source = value as Record<string, unknown>;
  return keys.reduce((sum, key) => {
    const item = source[key];
    if (Array.isArray(item)) return sum + item.length;
    return sum + (numeric(item) ?? 0);
  }, 0);
}

function sectionStatus(blocked: number, attention: number): 'ready' | 'attention' | 'blocked' {
  if (blocked > 0) return 'blocked';
  if (attention > 0) return 'attention';
  return 'ready';
}

function sectionLabel(section: AddressDashboardSection) {
  if (section === 'logs') return 'API Logs';
  if (section === 'link-events') return 'Address Link Events';
  if (section === 'qr-usage') return 'QR Used';
  if (section === 'api-keys') return 'API Keys';
  if (section === 'tax-customs') return 'Tax / Customs';
  return section
    .split('-')
    .map(part => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

const DASHBOARD_FOCUS: Record<AddressDashboardSection, string[]> = {
  logs: ['api-errors', 'rate-limit', 'latency'],
  'link-events': ['address-link-sessions', 'consent-events', 'abandoned-flows'],
  audit: ['redacted-logs', 'receipt-integrity', 'policy-events'],
  'api-keys': ['rotation', 'scope-drift', 'disabled-keys'],
  terminals: ['device-health', 'offline-queue', 'staff-permissions'],
  issuers: ['trust-status', 'revocation-root', 'key-rotation'],
  webhooks: ['signature-failures', 'retry-queue', 'dead-letter'],
  'review-queue': ['manual-review', 'needs-evidence', 'operator-sla'],
  disputes: ['misdelivery', 'same-address-claim', 'pid-merge-split'],
  'qr-usage': ['used-status', 'duplicate-scan', 'expired-qr'],
  'tax-customs': ['manual-review', 'hs-code', 'cross-border-risk'],
};

const DASHBOARD_NEXT_ACTIONS: Record<
AddressDashboardSection,
Record<'ready' | 'attention' | 'blocked', string>
> = {
  logs: {
    ready: 'monitor-api-logs',
    attention: 'triage-api-errors',
    blocked: 'fix-api-failures',
  },
  'link-events': {
    ready: 'monitor-link-events',
    attention: 'review-link-dropoffs',
    blocked: 'fix-link-consent-or-session-failures',
  },
  audit: {
    ready: 'monitor-audit-events',
    attention: 'review-audit-findings',
    blocked: 'fix-audit-integrity-failures',
  },
  'api-keys': {
    ready: 'monitor-api-key-scope',
    attention: 'rotate-or-review-api-keys',
    blocked: 'disable-compromised-api-keys',
  },
  terminals: {
    ready: 'monitor-terminal-fleet',
    attention: 'diagnose-terminal-sync-or-hardware',
    blocked: 'block-or-repair-terminal',
  },
  issuers: {
    ready: 'monitor-issuer-trust',
    attention: 'review-issuer-trust-state',
    blocked: 'suspend-revoked-or-untrusted-issuer',
  },
  webhooks: {
    ready: 'monitor-webhook-delivery',
    attention: 'retry-webhook-deliveries',
    blocked: 'fix-webhook-signature-or-dead-letter',
  },
  'review-queue': {
    ready: 'monitor-review-queue',
    attention: 'work-review-queue',
    blocked: 'clear-blocking-review-queue',
  },
  disputes: {
    ready: 'monitor-disputes',
    attention: 'triage-open-disputes',
    blocked: 'escalate-blocking-disputes',
  },
  'qr-usage': {
    ready: 'monitor-qr-used-status',
    attention: 'review-qr-reuse-or-expiry',
    blocked: 'block-duplicate-or-expired-qr',
  },
  'tax-customs': {
    ready: 'monitor-tax-customs',
    attention: 'review-tax-customs-context',
    blocked: 'fix-blocking-tax-customs-context',
  },
};

const DASHBOARD_OWNERS: Record<AddressDashboardSection, AddressDashboardCommand['owner']> = {
  logs: 'platform',
  'link-events': 'support',
  audit: 'security',
  'api-keys': 'security',
  terminals: 'ops',
  issuers: 'compliance',
  webhooks: 'platform',
  'review-queue': 'support',
  disputes: 'support',
  'qr-usage': 'security',
  'tax-customs': 'compliance',
};

const DASHBOARD_RUNBOOK_STEPS: Record<AddressDashboardSection, string[]> = {
  logs: ['Open rate-limit and error traces.', 'Confirm no private payload is present.', 'Escalate repeated 5xx or abuse spikes.'],
  'link-events': ['Check consent drop-off and duplicate Address Item prevention.', 'Review failed scope requests.', 'Send safe recovery flow if needed.'],
  audit: ['Verify redacted audit receipts.', 'Compare receipt digest and policy event root.', 'Escalate integrity gaps to security.'],
  'api-keys': ['Inspect key scopes and last rotation.', 'Rotate suspicious keys.', 'Disable keys with scope drift.'],
  terminals: ['Check device trust, offline queue, printer, scanner, and registry sync.', 'Quarantine untrusted terminals.', 'Require signed handoff after repair.'],
  issuers: ['Check issuer status, trust root, revocation root, and key age.', 'Suspend unknown or revoked issuers.', 'Request issuer re-verification.'],
  webhooks: ['Verify signature failures and replay windows.', 'Retry safe events with idempotency.', 'Move persistent failures to dead-letter review.'],
  'review-queue': ['Prioritize blocked and high-risk cases.', 'Keep reviewer view redacted.', 'Request additional credential or carrier evidence.'],
  disputes: ['Open the related handoff or PID lineage receipt.', 'Assign reviewer and carrier owner.', 'Record decision without raw address fields.'],
  'qr-usage': ['Check jti, expiry, used-state, and reuse count.', 'Reject copied or expired tokens.', 'Require live challenge for high-risk cases.'],
  'tax-customs': ['Review HS code, origin/destination, and restricted-goods flags.', 'Use fully-free local-first data where possible.', 'Route uncertain cases to compliance.'],
};

function newestTimestamp(left: string | null, right: string | null) {
  if (!left) return right;
  if (!right) return left;
  return Date.parse(right) > Date.parse(left) ? right : left;
}

function latestTimestamp(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    return value.reduce<string | null>((latest, item) => newestTimestamp(latest, latestTimestamp(item)), null);
  }

  const source = value as Record<string, unknown>;
  const directKeys = ['lastEventAt', 'updatedAt', 'generatedAt', 'createdAt', 'timestamp', 'time', 'lastSeenAt'];
  let latest: string | null = null;
  for (const key of directKeys) {
    const text = cleanText(source[key]);
    const millis = Date.parse(text);
    if (text && Number.isFinite(millis)) latest = newestTimestamp(latest, new Date(millis).toISOString());
  }
  for (const item of Object.values(source)) {
    latest = newestTimestamp(latest, latestTimestamp(item));
  }
  return latest;
}

function dashboardAttentionReason(
  id: AddressDashboardSection,
  status: 'attention' | 'blocked',
  blocked: number,
  attention: number,
  stale: number,
) {
  if (status === 'blocked') {
    if (blocked > 0) return `${sectionLabel(id)} has ${blocked} blocking signal(s).`;
    return `${sectionLabel(id)} is blocked by rejected dashboard input.`;
  }
  if (stale > 0) return `${sectionLabel(id)} has ${stale} stale or out-of-sync signal(s).`;
  return `${sectionLabel(id)} has ${attention} item(s) needing operator review.`;
}

export function buildAddressDashboardSnapshot(
  input: AddressDashboardSnapshotInput = {},
): AddressDashboardSnapshot {
  const errors = privateMaterialErrors(input);
  const sectionInputs: Record<AddressDashboardSection, unknown> = {
    logs: input.logs,
    'link-events': input.linkEvents,
    audit: input.audit,
    'api-keys': input.apiKeys,
    terminals: input.terminals,
    issuers: input.issuers,
    webhooks: input.webhooks,
    'review-queue': input.reviewQueue,
    disputes: input.disputes,
    'qr-usage': input.qrUsage,
    'tax-customs': input.taxCustoms,
  };
  const sections = ADDRESS_DASHBOARD_SECTIONS.map((id) => {
    const source = sectionInputs[id];
    const blocked = countMetric(source, [
      'blocked',
      'failed',
      'failures',
      'revoked',
      'conflicts',
      'invalid',
      'signatureFailures',
      'signature_failures',
      'expired',
      'reused',
      'untrusted',
      'deadLetter',
      'dead_letter',
      'rejected',
    ]);
    const attention = countMetric(source, [
      'attention',
      'pending',
      'open',
      'needsReview',
      'needs_review',
      'reviewRequired',
      'review_required',
      'delayed',
      'retrying',
      'stale',
      'offlineQueued',
      'offline_queued',
      'manualReview',
      'manual_review',
    ]);
    const stale = countMetric(source, ['stale', 'staleEvents', 'stale_events', 'outOfSync', 'out_of_sync', 'offlineQueued', 'offline_queued']);
    const eventCount = countMetric(source, [
      'total',
      'count',
      'active',
      'ready',
      'events',
      'eventCount',
      'event_count',
      'requests',
      'sessions',
      'scans',
      'used',
      'qrUsed',
      'qr_used',
      'deliveries',
    ]);
    const primaryMetric = eventCount
      || blocked
      || attention;
    const status = errors.length > 0 ? 'blocked' : sectionStatus(blocked, attention);
    const nextAction = DASHBOARD_NEXT_ACTIONS[id][status];
    return {
      id,
      label: sectionLabel(id),
      status,
      primaryMetric,
      eventCount,
      blockedCount: blocked,
      attentionCount: attention,
      staleCount: stale,
      lastEventAt: latestTimestamp(source),
      focus: DASHBOARD_FOCUS[id],
      nextAction,
    };
  });
  const reviewItems = countMetric(input.reviewQueue, ['pending', 'open', 'needsReview', 'needs_review'])
    + countMetric(input.disputes, ['pending', 'open', 'needsReview', 'needs_review']);
  const qrUsed = countMetric(input.qrUsage, ['used', 'qrUsed', 'qr_used', 'scans', 'count', 'total']);
  const totals = {
    blocked: sections.filter(section => section.status === 'blocked').length,
    attention: sections.filter(section => section.status === 'attention').length,
    ready: sections.filter(section => section.status === 'ready').length,
    reviewItems,
    events: sections.reduce((sum, section) => sum + section.eventCount, 0),
    stale: sections.reduce((sum, section) => sum + section.staleCount, 0),
    qrUsed,
    webhookFailures: countMetric(input.webhooks, ['failed', 'failures', 'signatureFailures', 'signature_failures', 'deadLetter', 'dead_letter']),
    terminalIncidents: countMetric(input.terminals, ['blocked', 'failed', 'offline', 'offlineQueued', 'offline_queued', 'conflicts', 'untrusted']),
    issuerProblems: countMetric(input.issuers, ['revoked', 'suspended', 'blocked', 'failed', 'expired', 'untrusted']),
  };
  const summary = {
    apiEvents: countMetric(input.logs, ['total', 'count', 'events', 'eventCount', 'event_count', 'requests']),
    linkEvents: countMetric(input.linkEvents, ['total', 'count', 'events', 'eventCount', 'event_count', 'sessions']),
    webhookEvents: countMetric(input.webhooks, ['total', 'count', 'events', 'eventCount', 'event_count', 'active']),
    terminalEvents: countMetric(input.terminals, ['total', 'count', 'events', 'eventCount', 'event_count', 'active']),
    issuerEvents: countMetric(input.issuers, ['total', 'count', 'events', 'eventCount', 'event_count', 'active']),
    reviewItems: countMetric(input.reviewQueue, ['pending', 'open', 'needsReview', 'needs_review']),
    disputeItems: countMetric(input.disputes, ['pending', 'open', 'needsReview', 'needs_review']),
    qrUsed,
  };
  const attentionFeed = sections
    .filter(section => section.status !== 'ready')
    .map((section) => {
      const status = section.status as 'attention' | 'blocked';
      return {
        section: section.id,
        status,
        reason: dashboardAttentionReason(
          section.id,
          status,
          section.blockedCount,
          section.attentionCount,
          section.staleCount,
        ),
        count: section.blockedCount || section.attentionCount || section.staleCount || section.primaryMetric,
        nextAction: section.nextAction,
      };
    });
  const warnings = errors.length > 0
    ? ['dashboard-input-contained-private-material-and-was-not-accepted']
    : [];
  const overallStatus = totals.blocked > 0 ? 'blocked' : totals.attention > 0 ? 'attention' : 'ready';
  const lastEventAt = sections.reduce<string | null>(
    (latest, section) => newestTimestamp(latest, section.lastEventAt),
    null,
  );

  return {
    modelVersion: ADDRESS_OPERATIONS_MODEL_VERSION,
    accepted: errors.length === 0,
    generatedAt: cleanText(input.generatedAt) || new Date().toISOString(),
    overallStatus,
    sections,
    totals,
    summary,
    attentionFeed,
    lastEventAt,
    errors,
    warnings,
    privacy: ADDRESS_OPERATIONS_PRIVACY,
  };
}

function normalizeDashboardStatusFilter(value: unknown): AddressDashboardStatusFilter {
  const text = cleanText(value);
  return ADDRESS_DASHBOARD_STATUS_FILTERS.includes(text as AddressDashboardStatusFilter)
    ? text as AddressDashboardStatusFilter
    : 'all';
}

function sectionMatchesQuery(section: AddressDashboardSnapshot['sections'][number], query: string) {
  if (!query) return true;
  const haystack = [
    section.id,
    section.label,
    section.status,
    section.nextAction,
    ...section.focus,
  ].join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function dashboardRootFor(snapshot: AddressDashboardSnapshot) {
  return sha256Hex(stableJson({
    modelVersion: snapshot.modelVersion,
    generatedAt: snapshot.generatedAt,
    overallStatus: snapshot.overallStatus,
    totals: snapshot.totals,
    sections: snapshot.sections.map(section => ({
      id: section.id,
      status: section.status,
      eventCount: section.eventCount,
      blockedCount: section.blockedCount,
      attentionCount: section.attentionCount,
      staleCount: section.staleCount,
      lastEventAt: section.lastEventAt,
      nextAction: section.nextAction,
    })),
  }));
}

export function validateAddressDashboardPayloadIsSafe(value: unknown) {
  const forbiddenPaths = addressConnectPrivateMaterialPaths(value);
  return {
    safe: forbiddenPaths.length === 0,
    forbiddenPaths,
  };
}

export function buildAddressDashboardSafeExport(
  snapshot: AddressDashboardSnapshot,
  exportId?: string,
): AddressDashboardSafeExport {
  const dashboardRoot = dashboardRootFor(snapshot);
  const safeExport: AddressDashboardSafeExport = {
    modelVersion: ADDRESS_OPERATIONS_MODEL_VERSION,
    exportId: exportId || stableId('ADE', dashboardRoot),
    generatedAt: snapshot.generatedAt,
    dashboardRoot,
    accepted: snapshot.accepted,
    overallStatus: snapshot.overallStatus,
    totals: { ...snapshot.totals },
    sections: snapshot.sections.map(section => ({
      id: section.id,
      status: section.status,
      eventCount: section.eventCount,
      blockedCount: section.blockedCount,
      attentionCount: section.attentionCount,
      staleCount: section.staleCount,
      lastEventAt: section.lastEventAt,
      nextAction: section.nextAction,
    })),
    attentionFeed: snapshot.attentionFeed.map(item => ({ ...item })),
    privacy: snapshot.privacy,
  };
  const safety = validateAddressDashboardPayloadIsSafe(safeExport);
  if (!safety.safe) {
    throw new Error(`unsafe-dashboard-export:${safety.forbiddenPaths.join(',')}`);
  }
  return safeExport;
}

function buildDashboardCommandQueue(snapshot: AddressDashboardSnapshot): AddressDashboardCommand[] {
  return snapshot.attentionFeed
    .map(item => ({
      ...item,
      owner: DASHBOARD_OWNERS[item.section],
    }))
    .sort((left, right) => {
      if (left.status !== right.status) return left.status === 'blocked' ? -1 : 1;
      return right.count - left.count;
    });
}

function buildDashboardRunbook(section: AddressDashboardSnapshot['sections'][number] | null): AddressDashboardRunbook | null {
  if (!section) return null;
  return {
    section: section.id,
    owner: DASHBOARD_OWNERS[section.id],
    primaryAction: section.nextAction,
    steps: [...DASHBOARD_RUNBOOK_STEPS[section.id]],
    evidenceRefs: section.focus.map(focus => stableId('EV', {
      section: section.id,
      focus,
      action: section.nextAction,
    })),
  };
}

export function buildAddressDashboardConsole(input: AddressDashboardConsoleInput = {}): AddressDashboardConsole {
  const snapshot = buildAddressDashboardSnapshot(input);
  const query = cleanText(input.query);
  const statusFilter = normalizeDashboardStatusFilter(input.statusFilter);
  const filteredSections = snapshot.sections.filter(section => (
    (statusFilter === 'all' || section.status === statusFilter) &&
    sectionMatchesQuery(section, query)
  ));
  const requestedSection = cleanText(input.selectedSection) as AddressDashboardSection;
  const selectedSection = filteredSections.find(section => section.id === requestedSection)
    ?? filteredSections[0]
    ?? null;
  const safeExport = buildAddressDashboardSafeExport(snapshot);

  return {
    modelVersion: ADDRESS_OPERATIONS_MODEL_VERSION,
    snapshot,
    filters: {
      query,
      statusFilter,
    },
    filteredSections,
    selectedSection,
    commandQueue: buildDashboardCommandQueue(snapshot),
    runbook: buildDashboardRunbook(selectedSection),
    safeExport,
    payloadSafety: validateAddressDashboardPayloadIsSafe(safeExport),
  };
}

export function listAddressOperationsCapabilities() {
  return {
    modelVersion: ADDRESS_OPERATIONS_MODEL_VERSION,
    identityMethods: [...ADDRESS_IDENTITY_METHODS],
    identityClaims: [...ADDRESS_IDENTITY_CLAIMS],
    webhookTopics: [...ADDRESS_CONNECT_WEBHOOK_TOPICS],
    disputeTypes: [...ADDRESS_DISPUTE_TYPES],
    disputeStatuses: [...ADDRESS_DISPUTE_STATUSES],
    reviewCaseCategories: [...ADDRESS_REVIEW_CASE_CATEGORIES],
    reviewCaseStatuses: [...ADDRESS_REVIEW_CASE_STATUSES],
    reviewQueueLanes: [...ADDRESS_REVIEW_QUEUE_LANES],
    dashboardSections: [...ADDRESS_DASHBOARD_SECTIONS],
    supports: {
      addressIdentityVerification: true,
      addressWebhooks: true,
      addressDisputes: true,
      taxCustomsContext: true,
      stripeStyleDashboardSnapshot: true,
      dashboardConsole: true,
      dashboardSafeExport: true,
      reviewConsole: true,
      reviewConsoleSafeExport: true,
      fullyFreeLocalFirstTaxCustomsDataPolicy: true,
      privateAddressMaterialRejection: true,
    },
    privacy: ADDRESS_OPERATIONS_PRIVACY,
    storageBoundary: 'commitments-public-refs-status-and-operational-metadata-only',
  };
}
