import { buildAddressIntent, type AddressIntent, type AddressIntentEvidenceInput, type AddressIntentMode, type AddressIntentPurpose } from './addressIntent';
import {
  createAddressFeedbackContext,
  createAddressFeedbackRecord,
  recommendAddressFeedbackActions,
  type AddressFeedbackActionScore,
  type AddressFeedbackIssue,
} from './addressFeedbackLearning';
import {
  type AddressVerificationEngineResult,
  type AddressVerificationFormatLike,
  type PostalEvidenceCandidate,
  verifyAddressCandidate,
} from './addressVerificationEngine';
import {
  getAddressElementPostalCodePolicy,
  mapAddressElementFormatFieldKey,
  type AddressElementPostalCodePolicy,
} from './addressElementInputPolicy';
import type { AgidSecureTransportDecision } from './agidSecureTransport';
import { sha256Hex } from './sha256';

export const ADDRESS_ELEMENT_MODEL_VERSION = 'agid-address-element-v1';

export const ADDRESS_ELEMENT_FIELD_KEYS = [
  'recipient',
  'organization',
  'countryCode',
  'postcode',
  'state',
  'city',
  'district',
  'street',
  'houseNumber',
  'building',
  'unit',
  'phone',
  'agid',
  'aoid',
] as const;

export const ADDRESS_ELEMENT_CHANNELS = ['manual', 'postal-code', 'agid', 'qr', 'nfc', 'feedback'] as const;
export const ADDRESS_ELEMENT_STATUSES = ['empty', 'collecting', 'ready', 'needs_review', 'blocked'] as const;
export const ADDRESS_ELEMENT_NEXT_ACTIONS = [
  'enter_address',
  'apply_postal_suggestion',
  'apply_agid_suggestion',
  'scan_qr_or_nfc',
  'request_recipient_proof',
  'review_address',
  'create_intent',
  'none',
] as const;

export type AddressElementFieldKey = typeof ADDRESS_ELEMENT_FIELD_KEYS[number];
export type AddressElementChannel = typeof ADDRESS_ELEMENT_CHANNELS[number];
export type AddressElementStatus = typeof ADDRESS_ELEMENT_STATUSES[number];
export type AddressElementNextAction = typeof ADDRESS_ELEMENT_NEXT_ACTIONS[number];

export type AddressElementLanguageTab = {
  language: string;
  label?: string;
  source?: 'native' | 'english-domestic' | 'english-shipping' | 'custom' | 'browser' | 'app';
  enabled?: boolean;
};

export type AddressElementFieldInput = Partial<Record<AddressElementFieldKey, string>>;
export type AddressElementFieldPresence = Partial<Record<AddressElementFieldKey, boolean>>;

export type AddressElementAgidCandidate = {
  present?: boolean;
  agid?: string;
  exposure?: 'public' | 'agid-s' | 'commitment' | 'redacted';
  confidence?: number;
  safeFingerprint?: string;
  source?: string;
};

export type AddressElementScanCapabilities = {
  qr?: boolean;
  nfc?: boolean;
  agidSecure?: boolean;
  barcode?: boolean;
};

export type AddressElementFeedbackInput = {
  originalDisplay?: string;
  correctedDisplay?: string;
  issue?: AddressFeedbackIssue;
  severity?: 1 | 2 | 3;
  consentForLocalLearning?: boolean;
};

export type AddressElementInput = {
  id?: string;
  purpose?: AddressIntentPurpose | string;
  mode?: AddressIntentMode | string;
  countryCode?: string;
  fields?: AddressElementFieldInput;
  fieldPresence?: AddressElementFieldPresence;
  postalCandidates?: PostalEvidenceCandidate[];
  agidCandidate?: AddressElementAgidCandidate;
  languageTabs?: AddressElementLanguageTab[];
  selectedLanguage?: string;
  format?: AddressVerificationFormatLike | null;
  verification?: AddressVerificationEngineResult;
  feedback?: AddressElementFeedbackInput;
  highRiskMode?: boolean;
  scanCapabilities?: AddressElementScanCapabilities;
  now?: string;
};

export type AddressElementFieldState = {
  key: AddressElementFieldKey;
  required: boolean;
  present: boolean;
  private: boolean;
  autofillSource?: AddressElementChannel;
};

export type AddressElementQualityDecision = 'verified' | 'partial' | 'needs_review' | 'blocked';

export type AddressElementPublicDecision = 'OK' | 'Needs Review' | 'Rejected' | 'Restricted';

export type AddressElementPrimaryIdentifier = {
  kind: 'postal-code' | 'agid' | 'address-fields' | 'manual';
  label: string;
  reason: string;
  safeFingerprint?: string;
};

export type AddressElementSession = {
  modelVersion: typeof ADDRESS_ELEMENT_MODEL_VERSION;
  id: string;
  status: AddressElementStatus;
  purpose: AddressIntentPurpose;
  mode: AddressIntentMode;
  countryCode: string | null;
  selectedLanguage: string;
  languageTabs: Required<AddressElementLanguageTab>[];
  fields: AddressElementFieldState[];
  missingRequiredFields: AddressElementFieldKey[];
  primaryIdentifier: AddressElementPrimaryIdentifier;
  inputPolicy: {
    postalCode: AddressElementPostalCodePolicy;
    privateFieldKeys: AddressElementFieldKey[];
    fieldValuesStayLocal: true;
    publicEventsUseSafeMetadataOnly: true;
  };
  autofill: {
    postalCandidateCount: number;
    agidCandidatePresent: boolean;
    channels: AddressElementChannel[];
  };
  scanSecurity: {
    qrEnabled: boolean;
    nfcEnabled: boolean;
    agidSecureEnabled: boolean;
    highRiskRequiresAgidSecure: boolean;
    publicDecision: AgidSecureTransportDecision;
    privacyBoundary: 'address-element-scan-no-raw-payload';
  };
  quality: {
    decision: AddressElementQualityDecision;
    score: number;
    internalOnly: true;
    verificationStatus?: AddressVerificationEngineResult['status'];
  };
  evidenceForIntent: AddressIntentEvidenceInput[];
  intentPreview: AddressIntent;
  feedback?: {
    recordCreated: boolean;
    recordId?: string;
    suggestedActions: AddressFeedbackActionScore[];
    privacy: 'closed-device-local';
  };
  nextActions: AddressElementNextAction[];
  warnings: string[];
  privacy: {
    rawFieldValuesReturned: false;
    plaintextAddressServerStorage: false;
    rawAgidServerStorage: false;
    rawAoidServerStorage: false;
    rawAddressStorage: false;
    publicPayloadUsesCommitments: true;
    plaintextTransmissionAllowed: false;
    purposeLimited: true;
    userCorrectionLearning: 'closed-device-local';
    highRiskMode: boolean;
  };
};

const PRIVATE_FIELDS = new Set<AddressElementFieldKey>(['recipient', 'phone', 'unit', 'aoid']);

function normalizeCountryCode(value: unknown) {
  const text = String(value ?? '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(text) ? text : '';
}

function normalizePurpose(value: unknown): AddressIntentPurpose {
  return ['delivery', 'return', 'aid', 'identity', 'customs'].includes(String(value))
    ? String(value) as AddressIntentPurpose
    : 'delivery';
}

function normalizeMode(value: unknown): AddressIntentMode {
  return ['local', 'server', 'zk', 'ethereum', 'full'].includes(String(value))
    ? String(value) as AddressIntentMode
    : 'local';
}

function presentText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function fieldPresenceFrom(input: AddressElementInput): Record<AddressElementFieldKey, boolean> {
  const fields = input.fields ?? {};
  const presence = input.fieldPresence ?? {};
  return Object.fromEntries(
    ADDRESS_ELEMENT_FIELD_KEYS.map(key => [
      key,
      Boolean(presence[key] || presentText(fields[key])),
    ]),
  ) as Record<AddressElementFieldKey, boolean>;
}

function formatFieldsForRequiredMapping(format: AddressVerificationFormatLike | null | undefined) {
  const anyFormat = format as (AddressVerificationFormatLike & {
    domestic?: Record<string, { fields?: Array<{ key: string; required?: boolean }> }>;
    international?: Record<string, { fields?: Array<{ key: string; required?: boolean }> }>;
  }) | null | undefined;
  return [
    ...(anyFormat?.native?.fields ?? []),
    ...(anyFormat?.english?.fields ?? []),
    ...Object.values(anyFormat?.domestic ?? {}).flatMap(languageFormat => languageFormat.fields ?? []),
    ...Object.values(anyFormat?.international ?? {}).flatMap(languageFormat => languageFormat.fields ?? []),
  ];
}

function requiredFieldsFor(input: AddressElementInput, purpose: AddressIntentPurpose) {
  const country = normalizeCountryCode(input.countryCode || input.fields?.countryCode);
  const postalPolicy = getAddressElementPostalCodePolicy(input.format);
  const required = new Set<AddressElementFieldKey>(['countryCode']);
  const formatFields = formatFieldsForRequiredMapping(input.format);

  for (const field of formatFields) {
    if (!field.required) continue;
    const key = mapAddressElementFormatFieldKey(field.key);
    if (key === 'postcode' && !postalPolicy.available) continue;
    if (key) required.add(key);
  }

  if (purpose === 'delivery' || purpose === 'return' || purpose === 'customs') {
    if (postalPolicy.required) required.add('postcode');
    required.add('city');
    required.add('street');
  }
  if (purpose === 'identity') {
    if (postalPolicy.required) required.add('postcode');
    required.add('city');
  }
  if (country === 'JP') required.add('state');
  if (country === 'US' || country === 'CA' || country === 'AU') required.add('state');
  if (input.highRiskMode) {
    required.delete('recipient');
    required.delete('phone');
    required.delete('unit');
  }
  return required;
}

function buildCanonicalAddress(input: AddressElementInput, countryCode: string) {
  const fields = input.fields ?? {};
  return {
    country_code: countryCode,
    postcode: fields.postcode,
    state: fields.state,
    city: fields.city,
    district: fields.district,
    road: fields.street,
    house_number: fields.houseNumber,
    building: fields.building,
  };
}

function getVerification(input: AddressElementInput, countryCode: string) {
  if (input.verification) return input.verification;
  if (!countryCode && !input.postalCandidates?.length) return undefined;
  return verifyAddressCandidate({
    countryCode,
    address: buildCanonicalAddress(input, countryCode),
    postalCode: input.fields?.postcode,
    scope: 'address',
    format: input.format,
    postalEvidence: input.postalCandidates,
    sources: ['agid-address-element'],
    allowFallbackCountryFromAddress: true,
    standardLibrary: {
      sourceLanguage: input.selectedLanguage,
      targetLanguage: input.selectedLanguage,
      hasCoordinates: Boolean(input.agidCandidate?.present || input.agidCandidate?.agid),
      needsNaturalGeographyContext: false,
      sparseOrRemoteArea: false,
      libpostalEndpointConfigured: false,
    },
    systemConnection: {
      hasAgid: Boolean(input.agidCandidate?.present || input.agidCandidate?.agid),
      hasAoid: Boolean(input.fieldPresence?.aoid || input.fields?.aoid),
      purpose: input.purpose as any,
    },
  });
}

function normalizeLanguageTabs(input: AddressElementInput, countryCode: string) {
  const tabs = input.languageTabs?.length
    ? input.languageTabs
    : [
        { language: 'local', label: countryCode ? `${countryCode} local` : 'Local', source: 'native' as const },
        { language: 'en', label: 'English Shipping', source: 'english-shipping' as const },
      ];
  const selected = input.selectedLanguage?.trim() || tabs.find(tab => tab.enabled !== false)?.language || 'local';
  const withSelected = tabs.some(tab => tab.language === selected)
    ? tabs
    : [{ language: selected, label: selected.toUpperCase(), source: 'custom' as const }, ...tabs];
  return {
    selected,
    tabs: withSelected.map(tab => ({
      language: tab.language,
      label: tab.label || tab.language.toUpperCase(),
      source: tab.source || 'custom',
      enabled: tab.enabled !== false,
    })),
  };
}

function scoreToQualityDecision(score: number, status: AddressVerificationEngineResult['status'] | undefined): AddressElementQualityDecision {
  if (status === 'verified' && score >= 0.74) return 'verified';
  if (status === 'partial' || score >= 0.45) return 'partial';
  return 'needs_review';
}

function resolveScanSecurity(input: AddressElementInput): AddressElementSession['scanSecurity'] {
  const qrEnabled = Boolean(input.scanCapabilities?.qr);
  const nfcEnabled = Boolean(input.scanCapabilities?.nfc);
  const agidSecureEnabled = Boolean(
    input.scanCapabilities?.agidSecure
    || input.agidCandidate?.exposure === 'agid-s'
    || input.agidCandidate?.exposure === 'commitment',
  );
  const highRiskRequiresAgidSecure = Boolean(input.highRiskMode);
  const publicDecision: AgidSecureTransportDecision = highRiskRequiresAgidSecure && !agidSecureEnabled
    ? 'restricted'
    : highRiskRequiresAgidSecure && !(qrEnabled || nfcEnabled)
      ? 'needs-review'
      : agidSecureEnabled
        ? 'ok'
        : qrEnabled || nfcEnabled
          ? 'needs-review'
          : 'needs-review';

  return {
    qrEnabled,
    nfcEnabled,
    agidSecureEnabled,
    highRiskRequiresAgidSecure,
    publicDecision,
    privacyBoundary: 'address-element-scan-no-raw-payload',
  };
}

export function formatAddressElementPublicDecision(
  decision: AddressElementQualityDecision | string,
  language = 'en',
): string {
  const ja = language.toLowerCase().startsWith('ja');
  if (decision === 'verified') return 'OK';
  if (decision === 'blocked') return ja ? '制限' : 'Restricted';
  if (decision === 'rejected') return ja ? '拒否' : 'Rejected';
  return ja ? '要確認' : 'Needs Review';
}

function fingerprint(prefix: string, input: unknown) {
  return `${prefix}:${sha256Hex(JSON.stringify(input)).slice(0, 24)}`;
}

function hasAgidCandidate(input: AddressElementInput) {
  return Boolean(
    input.agidCandidate?.present
    || input.agidCandidate?.agid
    || input.agidCandidate?.safeFingerprint,
  );
}

function resolvePrimaryIdentifier(
  input: AddressElementInput,
  postalPolicy: AddressElementPostalCodePolicy,
  presence: Record<AddressElementFieldKey, boolean>,
): AddressElementPrimaryIdentifier {
  const agidPresent = hasAgidCandidate(input);
  const agidFingerprint = input.agidCandidate?.safeFingerprint || fingerprint('agid-primary', {
    countryCode: normalizeCountryCode(input.countryCode || input.fields?.countryCode),
    exposure: input.agidCandidate?.exposure || 'commitment',
    source: input.agidCandidate?.source || 'address-element',
    present: agidPresent,
  });

  if (!postalPolicy.available && agidPresent) {
    return {
      kind: 'agid',
      label: 'AGID',
      reason: 'no-postal-code-agid-primary',
      safeFingerprint: agidFingerprint,
    };
  }

  if (postalPolicy.available && (presence.postcode || postalPolicy.fixedValue)) {
    return {
      kind: 'postal-code',
      label: 'Postal code',
      reason: postalPolicy.required ? 'postal-code-required-primary' : 'postal-code-available-primary',
    };
  }

  if (agidPresent) {
    return {
      kind: 'agid',
      label: 'AGID',
      reason: 'agid-evidence-primary',
      safeFingerprint: agidFingerprint,
    };
  }

  if (Object.values(presence).some(Boolean)) {
    return {
      kind: 'address-fields',
      label: 'Address fields',
      reason: 'address-fields-primary',
    };
  }

  return {
    kind: 'manual',
    label: 'Manual review',
    reason: 'manual-required',
  };
}

function buildEvidence(input: AddressElementInput, options: {
  fieldStates: AddressElementFieldState[];
  verification?: AddressVerificationEngineResult;
  qualityDecision: AddressElementQualityDecision;
  qualityScore: number;
}) {
  const evidence: AddressIntentEvidenceInput[] = [];
  const presentFields = options.fieldStates.filter(field => field.present).map(field => field.key);
  if (presentFields.length > 0) {
    evidence.push({
      source: 'address-form',
      status: options.qualityDecision === 'needs_review' ? 'warning' : 'passed',
      confidence: options.qualityScore,
      safeFingerprint: fingerprint('address-element-fields', {
        countryCode: input.countryCode,
        presentFields,
        highRiskMode: Boolean(input.highRiskMode),
      }),
    });
  }

  if (input.postalCandidates?.length) {
    evidence.push({
      source: 'postal-api',
      status: options.verification?.postal.lookupSatisfied ? 'passed' : 'warning',
      confidence: Math.max(0.45, options.verification?.postal.lookupSatisfied ? 0.92 : 0.62),
      safeFingerprint: fingerprint('postal-evidence', {
        countryCode: input.countryCode,
        count: input.postalCandidates.length,
        sources: input.postalCandidates.map(candidate => candidate.source || candidate.sourceId).filter(Boolean).slice(0, 6),
      }),
    });
  }

  const agidCandidate = input.agidCandidate;
  if (agidCandidate?.present || agidCandidate?.agid || agidCandidate?.safeFingerprint) {
    evidence.push({
      source: agidCandidate?.exposure === 'agid-s' ? 'agid-s' : 'agid-reverse-geocode',
      status: agidCandidate?.confidence && agidCandidate.confidence < 0.5 ? 'warning' : 'passed',
      confidence: typeof agidCandidate?.confidence === 'number' ? Math.max(0, Math.min(1, agidCandidate.confidence)) : 0.8,
      safeFingerprint: agidCandidate?.safeFingerprint || fingerprint('agid-presence', {
        exposure: agidCandidate?.exposure || 'public',
        source: agidCandidate?.source,
        present: true,
      }),
    });
  }

  if (input.scanCapabilities?.qr) {
    evidence.push({
      source: 'shipping-label-qr',
      status: 'pending',
      confidence: 0.5,
      safeFingerprint: fingerprint('qr-channel', { enabled: true, agidSecure: Boolean(input.scanCapabilities.agidSecure) }),
    });
  }
  if (input.scanCapabilities?.agidSecure) {
    evidence.push({
      source: 'agid-s',
      status: 'pending',
      confidence: 0.55,
      safeFingerprint: fingerprint('agid-s-channel', { enabled: true }),
    });
  }
  return evidence;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function sessionId(input: AddressElementInput, countryCode: string, selectedLanguage: string, presentFields: string[]) {
  if (typeof input.id === 'string' && /^AEL-[A-F0-9]{16,32}$/.test(input.id.trim().toUpperCase())) {
    return input.id.trim().toUpperCase();
  }
  const hash = sha256Hex(JSON.stringify({
    countryCode,
    selectedLanguage,
    presentFields,
    highRiskMode: Boolean(input.highRiskMode),
    purpose: input.purpose,
    mode: input.mode,
  })).toUpperCase();
  return `AEL-${hash.slice(0, 24)}`;
}

export function buildAddressElementSession(input: AddressElementInput = {}): AddressElementSession {
  const purpose = normalizePurpose(input.purpose);
  const mode = normalizeMode(input.mode);
  const countryCode = normalizeCountryCode(input.countryCode || input.fields?.countryCode);
  const postalPolicy = getAddressElementPostalCodePolicy(input.format);
  const presence = fieldPresenceFrom(input);
  if (postalPolicy.fixedValue && !presence.postcode) {
    presence.postcode = true;
  }
  const required = requiredFieldsFor(input, purpose);
  const verification = getVerification(input, countryCode);
  const languages = normalizeLanguageTabs(input, countryCode);
  const scanSecurity = resolveScanSecurity(input);
  const fieldStates: AddressElementFieldState[] = ADDRESS_ELEMENT_FIELD_KEYS.map(key => ({
    key,
    required: required.has(key),
    present: key === 'countryCode' ? Boolean(countryCode || presence.countryCode) : presence[key],
    private: PRIVATE_FIELDS.has(key),
    autofillSource: input.postalCandidates?.length && postalPolicy.available && ['postcode', 'state', 'city', 'district'].includes(key)
      ? 'postal-code'
      : hasAgidCandidate(input) && ['agid', 'countryCode'].includes(key)
        ? 'agid'
        : undefined,
  }));
  const primaryIdentifier = resolvePrimaryIdentifier(input, postalPolicy, presence);
  const missingRequiredFields = fieldStates
    .filter(field => field.required && !field.present)
    .map(field => field.key);
  const hasRawFields = Object.values(input.fields ?? {}).some(value => presentText(value));
  const hasPublicEvidence = Boolean(
    input.postalCandidates?.length ||
    hasAgidCandidate(input),
  );
  const hasAgidEvidence = hasAgidCandidate(input);
  const presenceComplete = missingRequiredFields.length === 0;
  const publicEvidenceScore = presenceComplete && hasPublicEvidence
    ? input.postalCandidates?.length && hasAgidEvidence
      ? 0.78
      : 0.66
    : 0;
  const verificationScore = Math.max(
    verification?.score ?? 0,
    publicEvidenceScore,
    presenceComplete ? 0.62 : 0.25,
  );
  let qualityDecision = scoreToQualityDecision(verificationScore, verification?.status);
  if (!hasRawFields && presenceComplete && hasPublicEvidence && qualityDecision === 'needs_review') {
    qualityDecision = 'partial';
  }
  const warnings: string[] = [...(verification?.warnings ?? [])];
  const nextActions: AddressElementNextAction[] = [];

  if (primaryIdentifier.reason === 'no-postal-code-agid-primary') {
    warnings.push('no-postal-code-agid-primary');
  }

  if (missingRequiredFields.length > 0) {
    warnings.push('address-element-required-fields-missing');
    nextActions.push('enter_address');
  }
  if (input.postalCandidates?.length && !verification?.postal.lookupSatisfied) {
    nextActions.push('apply_postal_suggestion');
  }
  if (hasAgidCandidate(input)) {
    nextActions.push('apply_agid_suggestion');
  }
  if (input.scanCapabilities?.qr || input.scanCapabilities?.nfc) {
    nextActions.push('scan_qr_or_nfc');
  }

  if (input.highRiskMode) {
    warnings.push('high-risk-mode-enabled');
    if (input.agidCandidate?.exposure === 'public') {
      warnings.push('high-risk-mode-should-not-use-public-agid');
      qualityDecision = 'blocked';
    }
    if (scanSecurity.publicDecision === 'restricted') {
      warnings.push('high-risk-mode-requires-agid-s-or-equivalent-commitment');
      qualityDecision = 'blocked';
      nextActions.push('scan_qr_or_nfc');
    }
    if (scanSecurity.publicDecision === 'needs-review') {
      warnings.push('high-risk-mode-should-use-qr-or-nfc-secure-intake');
    }
    nextActions.push('request_recipient_proof');
  }

  if (qualityDecision === 'needs_review' || qualityDecision === 'blocked') {
    nextActions.push('review_address');
  }
  if (qualityDecision !== 'blocked' && missingRequiredFields.length === 0) {
    nextActions.push('create_intent');
  }

  const evidenceForIntent = buildEvidence(input, {
    fieldStates,
    verification,
    qualityDecision,
    qualityScore: verificationScore,
  });
  const intentPreview = buildAddressIntent({
    purpose,
    mode,
    evidence: evidenceForIntent,
    requiresCarrierScan: purpose === 'delivery' || purpose === 'return',
    requiresRecipientProof: Boolean(input.highRiskMode || purpose === 'identity' || purpose === 'aid'),
    manualReviewRequired: qualityDecision === 'needs_review' || qualityDecision === 'blocked',
    rejectedReason: qualityDecision === 'blocked' ? 'address-element-high-risk-policy-blocked' : undefined,
  });

  let feedback: AddressElementSession['feedback'];
  if (input.feedback?.originalDisplay) {
    const record = createAddressFeedbackRecord({
      source: 'address-registration',
      countryCode,
      languageTab: languages.selected,
      originalDisplay: input.feedback.originalDisplay,
      correctedDisplay: input.feedback.correctedDisplay,
      issue: input.feedback.issue || 'other',
      severity: input.feedback.severity,
      consentForLocalLearning: input.feedback.consentForLocalLearning,
      context: createAddressFeedbackContext({
        details: buildCanonicalAddress(input, countryCode) as any,
        isSea: false,
        qualityDecision,
        qualityScore: verificationScore,
        sourceIds: verification?.sources ?? [],
      }),
    });
    feedback = {
      recordCreated: true,
      recordId: record.id,
      suggestedActions: recommendAddressFeedbackActions(record),
      privacy: 'closed-device-local',
    };
  }

  const presentFields = fieldStates.filter(field => field.present).map(field => field.key);
  const status: AddressElementStatus = qualityDecision === 'blocked'
    ? 'blocked'
    : missingRequiredFields.length === ADDRESS_ELEMENT_FIELD_KEYS.filter(key => required.has(key)).length
      ? 'empty'
      : qualityDecision === 'needs_review'
        ? 'needs_review'
        : missingRequiredFields.length > 0
          ? 'collecting'
          : 'ready';
  const channels: AddressElementChannel[] = [
    presentFields.length ? 'manual' : undefined,
    input.postalCandidates?.length ? 'postal-code' : undefined,
    hasAgidCandidate(input) ? 'agid' : undefined,
    input.scanCapabilities?.qr ? 'qr' : undefined,
    input.scanCapabilities?.nfc ? 'nfc' : undefined,
    feedback ? 'feedback' : undefined,
  ].filter(Boolean) as AddressElementChannel[];

  return {
    modelVersion: ADDRESS_ELEMENT_MODEL_VERSION,
    id: sessionId(input, countryCode, languages.selected, presentFields),
    status,
    purpose,
    mode,
    countryCode: countryCode || null,
    selectedLanguage: languages.selected,
    languageTabs: languages.tabs,
    fields: fieldStates,
    missingRequiredFields,
    primaryIdentifier,
    inputPolicy: {
      postalCode: postalPolicy,
      privateFieldKeys: [...PRIVATE_FIELDS],
      fieldValuesStayLocal: true,
      publicEventsUseSafeMetadataOnly: true,
    },
    autofill: {
      postalCandidateCount: input.postalCandidates?.length ?? 0,
      agidCandidatePresent: hasAgidCandidate(input),
      channels: unique(channels),
    },
    scanSecurity,
    quality: {
      decision: qualityDecision,
      score: Math.max(0, Math.min(1, verificationScore)),
      internalOnly: true,
      ...(verification ? { verificationStatus: verification.status } : {}),
    },
    evidenceForIntent,
    intentPreview,
    ...(feedback ? { feedback } : {}),
    nextActions: unique(nextActions.length ? nextActions : ['none']),
    warnings: unique(warnings),
    privacy: {
      rawFieldValuesReturned: false,
      plaintextAddressServerStorage: false,
      rawAgidServerStorage: false,
      rawAoidServerStorage: false,
      rawAddressStorage: false,
      publicPayloadUsesCommitments: true,
      plaintextTransmissionAllowed: false,
      purposeLimited: true,
      userCorrectionLearning: 'closed-device-local',
      highRiskMode: Boolean(input.highRiskMode),
    },
  };
}

export function listAddressElementCapabilities() {
  return {
    modelVersion: ADDRESS_ELEMENT_MODEL_VERSION,
    fieldKeys: [...ADDRESS_ELEMENT_FIELD_KEYS],
    channels: [...ADDRESS_ELEMENT_CHANNELS],
    statuses: [...ADDRESS_ELEMENT_STATUSES],
    nextActions: [...ADDRESS_ELEMENT_NEXT_ACTIONS],
    supports: {
      postalCodeAutocomplete: true,
      postalCodePolicy: true,
      agidAutocomplete: true,
      countryAddressFormats: true,
      languageTabs: true,
      internalQualityDecision: true,
      correctionFeedback: true,
      qr: true,
      nfc: true,
      highRiskMode: true,
      addressIntentPreview: true,
      addressLink: true,
      hostEventContract: true,
      professionalReadiness: true,
    },
    privacy: {
      publicApiRawFieldValuesAccepted: false,
      rawFieldValuesReturned: false,
      plaintextAddressServerStorage: false,
      rawAddressStorage: false,
      publicPayloadUsesCommitments: true,
      plaintextTransmissionAllowed: false,
      purposeLimited: true,
      userCorrectionLearning: 'closed-device-local',
    },
  };
}
