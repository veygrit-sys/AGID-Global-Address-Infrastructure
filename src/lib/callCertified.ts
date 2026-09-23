import { sha256Hex } from './sha256';

export const CALL_CERTIFIED_VERSION = 'veycall-certified-v1';
export const CALL_CERTIFIED_COMMITMENT_ALGORITHM = 'sha256-domain-separated-call-certified-v1';

export const CALL_CERTIFIED_PURPOSES = [
  'identity-verification',
  'contract-confirmation',
  'customer-support',
  'fraud-alert',
  'public-service',
  'high-value-order',
  'delivery-address-change',
  'aid-casework',
] as const;

export const CALL_CERTIFIED_STATUSES = [
  'requires-identity',
  'requires-contract-binding',
  'requires-consent',
  'certified-ready',
  'active',
  'completed',
  'requires-review',
  'rejected',
  'expired',
] as const;

export const CALL_CERTIFIED_EVIDENCE_EVENTS = [
  'identity-verified',
  'address-bound',
  'contract-bound',
  'consent-captured',
  'recording-consent-captured',
  'call-started',
  'important-statement-marked',
  'operator-action',
  'contract-status-updated',
  'call-ended',
] as const;

export type CallCertifiedPurpose = typeof CALL_CERTIFIED_PURPOSES[number];
export type CallCertifiedStatus = typeof CALL_CERTIFIED_STATUSES[number];
export type CallCertifiedEvidenceEvent = typeof CALL_CERTIFIED_EVIDENCE_EVENTS[number];
export type CallCertifiedPartyRole = 'caller' | 'recipient' | 'organization-agent' | 'operator' | 'system';
export type CallCertifiedCertificationLevel = 'none' | 'identity-certified' | 'contract-certified' | 'evidence-certified';
export type CallCertifiedRetentionClass = 'none' | '30days' | '1year' | '7years' | 'custom-policy';
export type CallCertifiedComplianceJurisdiction = 'JP' | 'US' | 'EU' | 'global' | 'custom';
export type CallCertifiedTelephonyProviderFamily =
  | 'local-webrtc'
  | 'twilio-voice-like'
  | 'aws-connect-like'
  | 'genesys-like'
  | 'sip-trunk'
  | 'provider-adapter';

export type CallCertifiedPartyInput = {
  role?: string;
  veyId?: unknown;
  displayAlias?: unknown;
  kycLevel?: unknown;
  authenticated?: unknown;
  credentialCommitment?: unknown;
  addressCommitment?: unknown;
  organizationId?: unknown;
  operatorId?: unknown;
  rawName?: unknown;
  phone?: unknown;
  email?: unknown;
};

export type CallCertifiedParty = {
  role: CallCertifiedPartyRole;
  veyId: string;
  displayAlias: string;
  kycLevel: 0 | 1 | 2 | 3;
  authenticated: boolean;
  credentialCommitment: string;
  addressCommitment?: string;
  organizationId?: string;
  operatorId?: string;
};

export type CallCertifiedContractBindingInput = {
  contractId?: unknown;
  contractCommitment?: unknown;
  contractType?: unknown;
  valid?: unknown;
  effectiveAt?: unknown;
  expiresAt?: unknown;
  addressCommitment?: unknown;
  rawContract?: unknown;
};

export type CallCertifiedContractBinding = {
  contractIdAlias: string;
  contractCommitment: string;
  contractType: string;
  valid: boolean;
  effectiveAt?: string;
  expiresAt?: string;
  addressCommitment?: string;
};

export type CallCertifiedConsentInput = {
  callerConsent?: unknown;
  recipientConsent?: unknown;
  recordingConsent?: unknown;
  consentedAt?: unknown;
  consentTemplateId?: unknown;
  consentReceiptCommitment?: unknown;
};

export type CallCertifiedConsent = {
  callerConsent: boolean;
  recipientConsent: boolean;
  recordingConsent: boolean;
  consentedAt?: string;
  consentTemplateId: string;
  consentReceiptCommitment: string;
};

export type CallCertifiedComplianceInput = {
  recordingRequired?: unknown;
  consentRequired?: unknown;
  dataRetention?: unknown;
  jurisdiction?: unknown;
  legalHold?: unknown;
  sensitiveCategory?: unknown;
  encryptedRecordingRequired?: unknown;
};

export type CallCertifiedCompliance = {
  recordingRequired: boolean;
  consentRequired: boolean;
  dataRetention: CallCertifiedRetentionClass;
  jurisdiction: CallCertifiedComplianceJurisdiction;
  legalHold: boolean;
  sensitiveCategory: string;
  encryptedRecordingRequired: boolean;
};

export type CallCertifiedEvidenceInput = {
  event?: string;
  at?: unknown;
  actorRole?: string;
  safeSummary?: unknown;
  commitment?: unknown;
  signed?: unknown;
  rawTranscript?: unknown;
  recordingUrl?: unknown;
  phoneNumber?: unknown;
};

export type CallCertifiedEvidence = {
  event: CallCertifiedEvidenceEvent;
  at: string;
  actorRole: CallCertifiedPartyRole;
  safeSummary: string;
  commitment: string;
  signed: boolean;
};

export type CallCertifiedProviderInput = {
  family?: string;
  providerCallId?: unknown;
  sipCallId?: unknown;
  callUrl?: unknown;
  recordingUrl?: unknown;
};

export type CallCertifiedProvider = {
  family: CallCertifiedTelephonyProviderFamily;
  providerCallIdAlias?: string;
  sipCallIdCommitment?: string;
  callUrlAlias?: string;
  recordingEnvelopeCommitment?: string;
};

export type CallCertifiedSessionInput = {
  callId?: unknown;
  purpose?: string;
  caller?: CallCertifiedPartyInput;
  recipient?: CallCertifiedPartyInput;
  contract?: CallCertifiedContractBindingInput;
  compliance?: CallCertifiedComplianceInput;
  consent?: CallCertifiedConsentInput;
  provider?: CallCertifiedProviderInput;
  evidence?: ReadonlyArray<CallCertifiedEvidenceInput>;
  minKycLevel?: unknown;
  highRiskMode?: unknown;
  createdAt?: unknown;
  expiresAt?: unknown;
  startedAt?: unknown;
  endedAt?: unknown;
  manualReviewRequired?: unknown;
};

export type CallCertifiedPrivacyBoundary = {
  rawNameStored: false;
  rawPhoneStored: false;
  rawEmailStored: false;
  rawAddressStored: false;
  rawContractStored: false;
  rawTranscriptStored: false;
  rawRecordingUrlStored: false;
  publicSurface: 'certified-call-status-purpose-party-aliases-commitments-and-evidence-hashes-only';
};

export type CallCertifiedSession = {
  modelVersion: typeof CALL_CERTIFIED_VERSION;
  callId: string;
  status: CallCertifiedStatus;
  certificationLevel: CallCertifiedCertificationLevel;
  purpose: CallCertifiedPurpose;
  caller: CallCertifiedParty;
  recipient: CallCertifiedParty;
  contract: CallCertifiedContractBinding | null;
  compliance: CallCertifiedCompliance;
  consent: CallCertifiedConsent;
  provider: CallCertifiedProvider;
  evidence: CallCertifiedEvidence[];
  proofHash: string;
  requiredControls: string[];
  errors: string[];
  warnings: string[];
  createdAt: string;
  expiresAt: string;
  startedAt?: string;
  endedAt?: string;
  privacy: CallCertifiedPrivacyBoundary;
};

export type CallCertifiedEvidenceExport = {
  modelVersion: typeof CALL_CERTIFIED_VERSION;
  exportId: string;
  callId: string;
  status: CallCertifiedStatus;
  certificationLevel: CallCertifiedCertificationLevel;
  purpose: CallCertifiedPurpose;
  generatedAt: string;
  proofHash: string;
  pdfSections: string[];
  jsonFields: string[];
  evidenceCount: number;
  includesRecordingEnvelope: boolean;
  requiredLegalReview: boolean;
  privacy: CallCertifiedPrivacyBoundary;
  warnings: string[];
};

const DEFAULT_CREATED_AT = '2026-06-17T00:00:00.000Z';
const DEFAULT_TTL_SECONDS = 15 * 60;
const HIGH_RISK_TTL_SECONDS = 5 * 60;

const PRIVACY_BOUNDARY: CallCertifiedPrivacyBoundary = {
  rawNameStored: false,
  rawPhoneStored: false,
  rawEmailStored: false,
  rawAddressStored: false,
  rawContractStored: false,
  rawTranscriptStored: false,
  rawRecordingUrlStored: false,
  publicSurface: 'certified-call-status-purpose-party-aliases-commitments-and-evidence-hashes-only',
};

const CONTRACT_PURPOSES: CallCertifiedPurpose[] = [
  'contract-confirmation',
  'fraud-alert',
  'high-value-order',
  'delivery-address-change',
];

const HIGH_RISK_PURPOSES: CallCertifiedPurpose[] = [
  'fraud-alert',
  'public-service',
  'high-value-order',
  'aid-casework',
];

const PRIVATE_VALUE_RE = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{7,}\d|\b(?:\d{1,4}[-\s]){2,}\d{1,4}\b|recordingUrl|rawTranscript|rawContract)/i;

function clean(value: unknown, maxLength = 180) {
  const text = String(value ?? '').normalize('NFKC').trim();
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function optionalClean(value: unknown, maxLength = 180) {
  const text = clean(value, maxLength);
  return text || undefined;
}

function bool(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  const text = clean(value).toLowerCase();
  if (['true', 'yes', '1', 'on', 'required'].includes(text)) return true;
  if (['false', 'no', '0', 'off'].includes(text)) return false;
  return fallback;
}

function iso(value: unknown, fallback = DEFAULT_CREATED_AT) {
  const text = clean(value);
  return text && !Number.isNaN(Date.parse(text)) ? new Date(text).toISOString() : fallback;
}

function optionalIso(value: unknown) {
  const text = clean(value);
  return text && !Number.isNaN(Date.parse(text)) ? new Date(text).toISOString() : undefined;
}

function addSeconds(isoValue: string, seconds: number) {
  return new Date(Date.parse(isoValue) + seconds * 1000).toISOString();
}

function normalizePurpose(value: unknown): CallCertifiedPurpose {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if ((CALL_CERTIFIED_PURPOSES as readonly string[]).includes(text)) return text as CallCertifiedPurpose;
  if (text === 'credit-card-verification' || text === 'finance-verification') return 'contract-confirmation';
  if (text === 'support') return 'customer-support';
  if (text === 'delivery-change') return 'delivery-address-change';
  return 'identity-verification';
}

function normalizePartyRole(value: unknown): CallCertifiedPartyRole {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if (text === 'recipient' || text === 'organization-agent' || text === 'operator' || text === 'system') return text;
  return 'caller';
}

function normalizeKyc(value: unknown): 0 | 1 | 2 | 3 {
  const parsed = Number(clean(value));
  if (!Number.isFinite(parsed)) return 0;
  if (parsed >= 3) return 3;
  if (parsed >= 2) return 2;
  if (parsed >= 1) return 1;
  return 0;
}

function normalizeRetention(value: unknown): CallCertifiedRetentionClass {
  const text = clean(value).toLowerCase().replace(/_/g, '');
  if (text === '30days' || text === '1year' || text === '7years' || text === 'custompolicy') {
    return text === 'custompolicy' ? 'custom-policy' : text as CallCertifiedRetentionClass;
  }
  return 'none';
}

function normalizeJurisdiction(value: unknown): CallCertifiedComplianceJurisdiction {
  const text = clean(value).toUpperCase();
  if (text === 'JP' || text === 'US' || text === 'EU') return text;
  if (text === 'GLOBAL') return 'global';
  return 'custom';
}

function normalizeProviderFamily(value: unknown): CallCertifiedTelephonyProviderFamily {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if (
    text === 'twilio-voice-like'
    || text === 'aws-connect-like'
    || text === 'genesys-like'
    || text === 'sip-trunk'
    || text === 'provider-adapter'
  ) return text;
  return 'local-webrtc';
}

function safeCommitment(value: unknown, domain: string, fallbackSeed: string) {
  const text = clean(value, 240);
  if (text && !PRIVATE_VALUE_RE.test(text)) return text;
  return `${domain}:${sha256Hex(`${domain}:${fallbackSeed}:${text}`).slice(0, 32)}`;
}

function alias(value: unknown, domain: string, fallbackSeed: string) {
  const text = clean(value, 96);
  if (text && !PRIVATE_VALUE_RE.test(text)) return text;
  return `${domain}_${sha256Hex(`${domain}:${fallbackSeed}:${text}`).slice(0, 14)}`;
}

function containsPrivateMaterial(...values: unknown[]) {
  return values.some(value => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'object') return containsPrivateMaterial(JSON.stringify(value));
    return PRIVATE_VALUE_RE.test(clean(value, 500));
  });
}

function normalizeParty(input: CallCertifiedPartyInput | undefined, role: CallCertifiedPartyRole, seed: string): CallCertifiedParty {
  const partyRole = normalizePartyRole(input?.role ?? role);
  const veyId = alias(input?.veyId, `vey:${partyRole}`, seed);
  return {
    role: partyRole,
    veyId,
    displayAlias: optionalClean(input?.displayAlias, 96) ?? `${partyRole}:${veyId.slice(-8)}`,
    kycLevel: normalizeKyc(input?.kycLevel),
    authenticated: bool(input?.authenticated),
    credentialCommitment: safeCommitment(input?.credentialCommitment, 'credential', `${seed}:${partyRole}`),
    addressCommitment: optionalClean(input?.addressCommitment, 128),
    organizationId: optionalClean(input?.organizationId, 96),
    operatorId: optionalClean(input?.operatorId, 96),
  };
}

function normalizeContract(input: CallCertifiedContractBindingInput | undefined, purpose: CallCertifiedPurpose, seed: string): CallCertifiedContractBinding | null {
  const hasContract = Boolean(
    optionalClean(input?.contractId)
    || optionalClean(input?.contractCommitment)
    || optionalClean(input?.contractType)
    || CONTRACT_PURPOSES.includes(purpose),
  );
  if (!hasContract) return null;
  return {
    contractIdAlias: alias(input?.contractId, 'contract', seed),
    contractCommitment: safeCommitment(input?.contractCommitment, 'contract-commitment', seed),
    contractType: optionalClean(input?.contractType, 80) ?? purpose,
    valid: bool(input?.valid),
    effectiveAt: optionalIso(input?.effectiveAt),
    expiresAt: optionalIso(input?.expiresAt),
    addressCommitment: optionalClean(input?.addressCommitment, 128),
  };
}

function normalizeCompliance(input: CallCertifiedComplianceInput | undefined, purpose: CallCertifiedPurpose, highRiskMode: boolean): CallCertifiedCompliance {
  const highRiskPurpose = HIGH_RISK_PURPOSES.includes(purpose) || highRiskMode;
  return {
    recordingRequired: bool(input?.recordingRequired, highRiskPurpose || purpose === 'contract-confirmation'),
    consentRequired: bool(input?.consentRequired, true),
    dataRetention: normalizeRetention(input?.dataRetention),
    jurisdiction: normalizeJurisdiction(input?.jurisdiction ?? 'global'),
    legalHold: bool(input?.legalHold),
    sensitiveCategory: optionalClean(input?.sensitiveCategory, 96) ?? purpose,
    encryptedRecordingRequired: bool(input?.encryptedRecordingRequired, bool(input?.recordingRequired, highRiskPurpose)),
  };
}

function normalizeConsent(input: CallCertifiedConsentInput | undefined, seed: string): CallCertifiedConsent {
  return {
    callerConsent: bool(input?.callerConsent),
    recipientConsent: bool(input?.recipientConsent),
    recordingConsent: bool(input?.recordingConsent),
    consentedAt: optionalIso(input?.consentedAt),
    consentTemplateId: optionalClean(input?.consentTemplateId, 96) ?? 'veycall-certified-consent-v1',
    consentReceiptCommitment: safeCommitment(input?.consentReceiptCommitment, 'call-consent', seed),
  };
}

function normalizeEvidenceEvent(value: unknown): CallCertifiedEvidenceEvent {
  const text = clean(value).toLowerCase().replace(/_/g, '-');
  if ((CALL_CERTIFIED_EVIDENCE_EVENTS as readonly string[]).includes(text)) return text as CallCertifiedEvidenceEvent;
  if (text === 'recording-consent') return 'recording-consent-captured';
  if (text === 'started') return 'call-started';
  if (text === 'ended') return 'call-ended';
  return 'operator-action';
}

function normalizeEvidence(input: CallCertifiedEvidenceInput | undefined, seed: string): CallCertifiedEvidence {
  const event = normalizeEvidenceEvent(input?.event);
  const safeSummary = clean(input?.safeSummary, 140) || event;
  return {
    event,
    at: iso(input?.at),
    actorRole: normalizePartyRole(input?.actorRole ?? 'operator'),
    safeSummary: PRIVATE_VALUE_RE.test(safeSummary) ? 'redacted-evidence-summary' : safeSummary,
    commitment: safeCommitment(input?.commitment, `call-evidence:${event}`, seed),
    signed: bool(input?.signed),
  };
}

function normalizeProvider(input: CallCertifiedProviderInput | undefined, seed: string): CallCertifiedProvider {
  return {
    family: normalizeProviderFamily(input?.family),
    providerCallIdAlias: optionalClean(input?.providerCallId, 96) ? alias(input?.providerCallId, 'provider-call', seed) : undefined,
    sipCallIdCommitment: optionalClean(input?.sipCallId, 160) ? safeCommitment(input?.sipCallId, 'sip-call', seed) : undefined,
    callUrlAlias: optionalClean(input?.callUrl, 240) ? alias(input?.callUrl, 'call-url', seed) : undefined,
    recordingEnvelopeCommitment: optionalClean(input?.recordingUrl, 300) ? safeCommitment(input?.recordingUrl, 'recording-envelope', seed) : undefined,
  };
}

function requiredControls(compliance: CallCertifiedCompliance, highRiskMode: boolean) {
  const controls = [
    'both-party-identity-verification',
    'purpose-bound-call-token',
    'short-lived-call-link',
    'encrypted-api-transport',
    'operator-role-based-access-control',
    'commitment-only-call-logs',
    'tamper-evident-proof-hash',
  ];
  if (compliance.consentRequired) controls.push('caller-and-recipient-consent');
  if (compliance.recordingRequired) controls.push('recording-consent', 'encrypted-recording-envelope');
  if (compliance.legalHold || compliance.dataRetention !== 'none') controls.push('retention-policy-binding');
  if (highRiskMode) controls.push('high-risk-manual-review-or-live-challenge');
  return controls;
}

function statusFor(options: {
  caller: CallCertifiedParty;
  recipient: CallCertifiedParty;
  contract: CallCertifiedContractBinding | null;
  compliance: CallCertifiedCompliance;
  consent: CallCertifiedConsent;
  purpose: CallCertifiedPurpose;
  minKycLevel: number;
  createdAt: string;
  expiresAt: string;
  startedAt?: string;
  endedAt?: string;
  manualReviewRequired: boolean;
  errors: string[];
}) {
  const now = Date.parse(options.createdAt);
  if (Date.parse(options.expiresAt) <= now) return 'expired' as const;
  if (options.errors.length > 0) return 'rejected' as const;
  if (options.manualReviewRequired) return 'requires-review' as const;
  const identityReady = options.caller.authenticated
    && options.recipient.authenticated
    && options.caller.kycLevel >= options.minKycLevel
    && options.recipient.kycLevel >= options.minKycLevel;
  if (!identityReady) return 'requires-identity' as const;
  if (CONTRACT_PURPOSES.includes(options.purpose) && (!options.contract || !options.contract.valid)) {
    return 'requires-contract-binding' as const;
  }
  const consentReady = !options.compliance.consentRequired
    || (options.consent.callerConsent && options.consent.recipientConsent);
  const recordingConsentReady = !options.compliance.recordingRequired || options.consent.recordingConsent;
  if (!consentReady || !recordingConsentReady) return 'requires-consent' as const;
  if (options.endedAt) return 'completed' as const;
  if (options.startedAt) return 'active' as const;
  return 'certified-ready' as const;
}

function certificationLevel(status: CallCertifiedStatus, contract: CallCertifiedContractBinding | null, evidence: CallCertifiedEvidence[]) {
  if (status === 'completed' && evidence.some(item => item.event === 'call-ended') && evidence.every(item => item.signed)) {
    return 'evidence-certified';
  }
  if ((status === 'certified-ready' || status === 'active' || status === 'completed') && contract?.valid) {
    return 'contract-certified';
  }
  if (status === 'certified-ready' || status === 'active' || status === 'completed') return 'identity-certified';
  return 'none';
}

function proofHashPayload(session: Omit<CallCertifiedSession, 'proofHash'>) {
  return JSON.stringify({
    version: session.modelVersion,
    callId: session.callId,
    purpose: session.purpose,
    caller: session.caller.credentialCommitment,
    recipient: session.recipient.credentialCommitment,
    contract: session.contract?.contractCommitment,
    consent: session.consent.consentReceiptCommitment,
    evidence: session.evidence.map(item => [item.event, item.at, item.commitment, item.signed]),
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
  });
}

export function createCallCertifiedSession(input: CallCertifiedSessionInput): CallCertifiedSession {
  const purpose = normalizePurpose(input.purpose);
  const createdAt = iso(input.createdAt);
  const highRiskMode = bool(input.highRiskMode, HIGH_RISK_PURPOSES.includes(purpose));
  const expiresAt = optionalIso(input.expiresAt) ?? addSeconds(createdAt, highRiskMode ? HIGH_RISK_TTL_SECONDS : DEFAULT_TTL_SECONDS);
  const callId = alias(input.callId, 'call', `${purpose}:${createdAt}`);
  const caller = normalizeParty(input.caller, 'caller', `${callId}:caller`);
  const recipient = normalizeParty(input.recipient, 'recipient', `${callId}:recipient`);
  const contract = normalizeContract(input.contract, purpose, `${callId}:contract`);
  const compliance = normalizeCompliance(input.compliance, purpose, highRiskMode);
  const consent = normalizeConsent(input.consent, `${callId}:consent`);
  const provider = normalizeProvider(input.provider, `${callId}:provider`);
  const evidence = (input.evidence ?? []).map((item, index) => normalizeEvidence(item, `${callId}:evidence:${index}`));
  const minKycLevel = Number.isFinite(Number(clean(input.minKycLevel))) ? Math.min(3, Math.max(0, Number(clean(input.minKycLevel)))) : 1;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (containsPrivateMaterial(
    input.caller?.rawName,
    input.caller?.phone,
    input.caller?.email,
    input.recipient?.rawName,
    input.recipient?.phone,
    input.recipient?.email,
    input.contract?.rawContract,
    input.provider?.recordingUrl,
    ...(input.evidence ?? []).flatMap(item => [item.rawTranscript, item.recordingUrl, item.phoneNumber]),
  )) {
    errors.push('call-certified-input-contains-private-material');
  }
  if (compliance.recordingRequired && !compliance.encryptedRecordingRequired) {
    errors.push('call-certified-recording-requires-encrypted-envelope');
  }
  if (compliance.recordingRequired && compliance.dataRetention === 'none') {
    warnings.push('call-certified-recording-retention-policy-missing');
  }
  if (CONTRACT_PURPOSES.includes(purpose) && !contract) {
    errors.push('call-certified-contract-purpose-requires-contract-binding');
  }
  if (contract?.expiresAt && Date.parse(contract.expiresAt) <= Date.parse(createdAt)) {
    errors.push('call-certified-contract-binding-expired');
  }
  if (highRiskMode && minKycLevel < 2) {
    warnings.push('call-certified-high-risk-min-kyc-level-should-be-2-or-higher');
  }
  if (evidence.some(item => !item.signed)) {
    warnings.push('call-certified-unsigned-evidence-needs-review');
  }

  const status = statusFor({
    caller,
    recipient,
    contract,
    compliance,
    consent,
    purpose,
    minKycLevel,
    createdAt,
    expiresAt,
    startedAt: optionalIso(input.startedAt),
    endedAt: optionalIso(input.endedAt),
    manualReviewRequired: bool(input.manualReviewRequired),
    errors,
  });
  const withoutHash: Omit<CallCertifiedSession, 'proofHash'> = {
    modelVersion: CALL_CERTIFIED_VERSION,
    callId,
    status,
    certificationLevel: 'none',
    purpose,
    caller,
    recipient,
    contract,
    compliance,
    consent,
    provider,
    evidence,
    requiredControls: requiredControls(compliance, highRiskMode),
    errors,
    warnings,
    createdAt,
    expiresAt,
    startedAt: optionalIso(input.startedAt),
    endedAt: optionalIso(input.endedAt),
    privacy: PRIVACY_BOUNDARY,
  };
  const level = certificationLevel(status, contract, evidence);
  const proofHash = sha256Hex(proofHashPayload({ ...withoutHash, certificationLevel: level }));

  return {
    ...withoutHash,
    certificationLevel: level,
    proofHash,
  };
}

export function buildCallCertifiedEvidenceExport(
  session: CallCertifiedSession,
  generatedAt = DEFAULT_CREATED_AT,
): CallCertifiedEvidenceExport {
  const warnings = [...session.warnings];
  if (session.status !== 'completed') warnings.push('call-certified-export-before-call-completion');
  if (session.errors.length) warnings.push('call-certified-export-has-session-errors');
  const includesRecordingEnvelope = Boolean(session.provider.recordingEnvelopeCommitment)
    || session.compliance.recordingRequired;

  return {
    modelVersion: CALL_CERTIFIED_VERSION,
    exportId: `call_export_${sha256Hex(`${session.callId}:${session.proofHash}:${generatedAt}`).slice(0, 18)}`,
    callId: session.callId,
    status: session.status,
    certificationLevel: session.certificationLevel,
    purpose: session.purpose,
    generatedAt: iso(generatedAt),
    proofHash: session.proofHash,
    pdfSections: [
      'certification-summary',
      'party-identity-aliases',
      'purpose-and-contract-binding',
      'consent-and-recording-policy',
      'evidence-timeline',
      'proof-hash-and-retention-policy',
    ],
    jsonFields: [
      'callId',
      'status',
      'certificationLevel',
      'purpose',
      'partyCredentialCommitments',
      'contractCommitment',
      'consentReceiptCommitment',
      'evidenceCommitments',
      'proofHash',
    ],
    evidenceCount: session.evidence.length,
    includesRecordingEnvelope,
    requiredLegalReview: session.compliance.legalHold || session.purpose === 'public-service',
    privacy: PRIVACY_BOUNDARY,
    warnings,
  };
}

export function summarizeCallCertifiedControls(session: CallCertifiedSession) {
  return {
    modelVersion: CALL_CERTIFIED_VERSION,
    callId: session.callId,
    badge: session.status === 'certified-ready' || session.status === 'active' || session.status === 'completed'
      ? 'Certified Call'
      : 'Not Certified',
    operatorMessage: session.status === 'certified-ready'
      ? 'Both parties are authenticated and the call may start under the declared purpose.'
      : session.status === 'requires-consent'
        ? 'Capture caller, recipient, and recording consent before starting the call.'
        : session.status === 'requires-contract-binding'
          ? 'Bind a valid contract or procedure reference before certification.'
          : session.status === 'requires-identity'
            ? 'Both parties must authenticate with sufficient KYC level.'
            : session.status === 'completed'
              ? 'The certified call is complete and a redacted evidence export can be produced.'
              : 'Manual review or rejection state requires supervisor handling.',
    requiredControls: session.requiredControls,
    errors: session.errors,
    warnings: session.warnings,
    privacy: PRIVACY_BOUNDARY,
  };
}
