import type {
  AddressElementFieldKey,
  AddressElementNextAction,
  AddressElementSession,
} from './addressElement';

export const ADDRESS_REGISTRATION_READINESS_MODEL_VERSION = 'address-registration-readiness-v1';

export const ADDRESS_REGISTRATION_PROFESSIONAL_ROLES = [
  'addressing-specialist',
  'carrier-ops',
  'privacy-security',
  'accessibility-i18n',
  'support-review',
  'developer-platform',
] as const;

export type AddressRegistrationProfessionalRole = typeof ADDRESS_REGISTRATION_PROFESSIONAL_ROLES[number];
export type AddressRegistrationReadinessStatus = 'ready' | 'usable' | 'needs_review' | 'blocked';
export type AddressRegistrationReadinessCheckStatus = 'pass' | 'warning' | 'fail';

export type AddressRegistrationReadinessCheck = {
  id: string;
  role: AddressRegistrationProfessionalRole;
  label: string;
  status: AddressRegistrationReadinessCheckStatus;
  evidence: string;
  action?: string;
};

export type AddressRegistrationRoleSummary = {
  role: AddressRegistrationProfessionalRole;
  passed: number;
  warnings: number;
  failures: number;
  status: AddressRegistrationReadinessStatus;
};

export type AddressRegistrationReadinessInput = {
  session: Pick<
    AddressElementSession,
    | 'id'
    | 'status'
    | 'quality'
    | 'missingRequiredFields'
    | 'evidenceForIntent'
    | 'intentPreview'
    | 'nextActions'
    | 'warnings'
    | 'privacy'
    | 'languageTabs'
    | 'selectedLanguage'
    | 'autofill'
    | 'fields'
  > & Partial<Pick<AddressElementSession, 'primaryIdentifier'>>;
  renderedPreview?: string;
  addressLanguageTabs?: readonly { code: string; label?: string; kind?: string }[];
  selectedAddressLanguage?: string;
  hasPostalAutofill?: boolean;
  hasAgidAutofill?: boolean;
  hasDocumentCandidate?: boolean;
  hasClosedCorrectionFeedback?: boolean;
  hasTranslationFeedback?: boolean;
  hasAoidMode?: boolean;
};

export type AddressRegistrationReadiness = {
  modelVersion: typeof ADDRESS_REGISTRATION_READINESS_MODEL_VERSION;
  status: AddressRegistrationReadinessStatus;
  score: number;
  checks: AddressRegistrationReadinessCheck[];
  roleSummaries: AddressRegistrationRoleSummary[];
  nextActions: string[];
  publicMetadata: {
    sessionId: string;
    intentId: string;
    qualityDecision: AddressElementSession['quality']['decision'];
    intentStatus: AddressElementSession['intentPreview']['status'];
    checkSummary: {
      pass: number;
      warning: number;
      fail: number;
    };
    roles: AddressRegistrationRoleSummary[];
    privacyBoundary: 'no-raw-address-public-metadata';
  };
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function roundScore(value: number) {
  return Math.round(clamp01(value) * 100) / 100;
}

function presentField(input: AddressRegistrationReadinessInput, key: AddressElementFieldKey) {
  return input.session.fields.some(field => field.key === key && field.present);
}

function hasEvidence(input: AddressRegistrationReadinessInput, source: string) {
  return input.session.evidenceForIntent.some(item => item.source === source);
}

function selectedLanguageExists(input: AddressRegistrationReadinessInput) {
  const selected = input.selectedAddressLanguage || input.session.selectedLanguage;
  const uiTabs = input.addressLanguageTabs ?? [];
  const sessionTabs = input.session.languageTabs ?? [];
  return uiTabs.some(tab => tab.code === selected)
    || sessionTabs.some(tab => tab.language === selected);
}

function hasEnglishShippingTab(input: AddressRegistrationReadinessInput) {
  const uiTabs = input.addressLanguageTabs ?? [];
  const sessionTabs = input.session.languageTabs ?? [];
  return uiTabs.some(tab => tab.code === 'en' || tab.kind === 'international')
    || sessionTabs.some(tab => tab.language === 'en' || tab.source === 'english-shipping');
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function check(
  role: AddressRegistrationProfessionalRole,
  id: string,
  label: string,
  status: AddressRegistrationReadinessCheckStatus,
  evidence: string,
  action?: string,
): AddressRegistrationReadinessCheck {
  return {
    role,
    id,
    label,
    status,
    evidence,
    ...(action ? { action } : {}),
  };
}

function roleStatus(summary: Pick<AddressRegistrationRoleSummary, 'failures' | 'warnings'>): AddressRegistrationReadinessStatus {
  if (summary.failures > 0) return 'blocked';
  if (summary.warnings > 0) return 'usable';
  return 'ready';
}

function summarizeRoles(checks: AddressRegistrationReadinessCheck[]): AddressRegistrationRoleSummary[] {
  return ADDRESS_REGISTRATION_PROFESSIONAL_ROLES.map(role => {
    const roleChecks = checks.filter(item => item.role === role);
    const summary = {
      role,
      passed: roleChecks.filter(item => item.status === 'pass').length,
      warnings: roleChecks.filter(item => item.status === 'warning').length,
      failures: roleChecks.filter(item => item.status === 'fail').length,
    };
    return {
      ...summary,
      status: roleStatus(summary),
    };
  });
}

function mapSessionNextAction(action: AddressElementNextAction) {
  const map: Partial<Record<AddressElementNextAction, string>> = {
    enter_address: 'Complete the required address fields.',
    apply_postal_suggestion: 'Review and apply the postal-code suggestion.',
    apply_agid_suggestion: 'Review and apply the AGID suggestion.',
    scan_qr_or_nfc: 'Scan QR or NFC when available.',
    request_recipient_proof: 'Request recipient proof before accepting.',
    review_address: 'Send the record to manual review.',
    create_intent: 'Create the Address Intent after review.',
  };
  return map[action] || '';
}

function buildChecks(input: AddressRegistrationReadinessInput): AddressRegistrationReadinessCheck[] {
  const missingRequired = input.session.missingRequiredFields;
  const hasPreview = Boolean(input.renderedPreview?.trim());
  const hasCountry = presentField(input, 'countryCode');
  const hasPostal = input.hasPostalAutofill || hasEvidence(input, 'postal-api');
  const hasAgid = input.hasAgidAutofill || hasEvidence(input, 'agid-reverse-geocode') || hasEvidence(input, 'agid-s');
  const agidPrimaryIdentifier = input.session.primaryIdentifier?.kind === 'agid';
  const hasDocument = Boolean(input.hasDocumentCandidate);
  const hasAnyAssistance = hasPostal || hasAgid || hasDocument || agidPrimaryIdentifier;
  const hasRequiredComplete = missingRequired.length === 0;
  const hasExplicitNextActions = input.session.nextActions.some(action => action !== 'none');
  const hasEvidenceFingerprints = input.session.evidenceForIntent.every(item => Boolean(item.safeFingerprint));
  const privacyOk = input.session.privacy.rawFieldValuesReturned === false
    && input.session.privacy.plaintextAddressServerStorage === false
    && input.session.privacy.rawAgidServerStorage === false
    && input.session.privacy.rawAoidServerStorage === false;
  const highRiskBlocked = input.session.privacy.highRiskMode && input.session.status === 'blocked';

  const checks: AddressRegistrationReadinessCheck[] = [
    check(
      'addressing-specialist',
      'country-language-preview',
      'Country, language tab, and rendered preview',
      hasCountry && selectedLanguageExists(input) && hasPreview ? 'pass' : hasCountry ? 'warning' : 'fail',
      hasCountry && hasPreview
        ? 'The registration surface has a selected country and a rendered delivery preview.'
        : 'The registration surface still lacks a country or rendered address preview.',
      hasCountry ? 'Confirm the active language tab and preview.' : 'Select a destination country first.',
    ),
    check(
      'addressing-specialist',
      'required-field-coverage',
      'Required country-format fields',
      hasRequiredComplete ? 'pass' : missingRequired.length <= 2 ? 'warning' : 'fail',
      hasRequiredComplete
        ? 'All required fields for the selected country and purpose are present.'
        : `Missing required fields: ${missingRequired.join(', ')}.`,
      hasRequiredComplete ? undefined : 'Complete missing required fields before final registration.',
    ),
    check(
      'carrier-ops',
      'carrier-usable-evidence',
      'Carrier-usable address evidence',
      agidPrimaryIdentifier || (hasPostal && hasAgid) ? 'pass' : hasAnyAssistance ? 'warning' : 'fail',
      agidPrimaryIdentifier
        ? 'AGID is the primary identifier because postal codes are not used for this destination.'
        : hasPostal && hasAgid
        ? 'Postal evidence and AGID reverse-geocode evidence are available.'
        : hasAnyAssistance
          ? 'At least one assisted evidence source is available, but carrier confidence can be improved.'
          : 'Only manual address entry is available.',
      agidPrimaryIdentifier ? 'Keep AGID, coordinate, and administrative evidence visible for review.' : hasAnyAssistance ? 'Add the missing postal or AGID evidence when possible.' : 'Use postal-code lookup, AGID hint, or document autofill.',
    ),
    check(
      'carrier-ops',
      'intent-handoff-path',
      'Intent and handoff path',
      input.session.intentPreview.status === 'verified'
        ? 'pass'
        : input.session.intentPreview.status === 'rejected' || input.session.intentPreview.status === 'expired'
          ? 'fail'
          : 'warning',
      `Address Intent status is ${input.session.intentPreview.status}.`,
      input.session.intentPreview.status === 'verified' ? undefined : 'Keep the record in review until required evidence is complete.',
    ),
    check(
      'privacy-security',
      'privacy-boundary',
      'No raw address public metadata boundary',
      privacyOk ? 'pass' : 'fail',
      privacyOk
        ? 'The Address Element session returns only field states, fingerprints, and decisions.'
        : 'The session privacy boundary allows raw address material.',
      privacyOk ? undefined : 'Stop registration export until raw fields are removed from public metadata.',
    ),
    check(
      'privacy-security',
      'high-risk-safety',
      'High-risk mode safety',
      highRiskBlocked ? 'fail' : input.session.privacy.highRiskMode ? 'warning' : 'pass',
      highRiskBlocked
        ? 'High-risk mode blocked this registration, usually because public AGID exposure is unsafe.'
        : input.session.privacy.highRiskMode
          ? 'High-risk mode is active and requires recipient proof or AGID-S style sharing.'
          : 'Normal-risk registration does not require extra high-risk gates.',
      highRiskBlocked ? 'Switch to AGID-S or commitment-only evidence.' : input.session.privacy.highRiskMode ? 'Require recipient proof before handoff.' : undefined,
    ),
    check(
      'privacy-security',
      'closed-learning',
      'Closed local correction learning',
      input.hasClosedCorrectionFeedback || input.hasTranslationFeedback ? 'pass' : 'warning',
      input.hasClosedCorrectionFeedback || input.hasTranslationFeedback
        ? 'Corrections or translation edits are available for closed-device local learning.'
        : 'No correction feedback has been captured yet.',
      input.hasClosedCorrectionFeedback || input.hasTranslationFeedback ? undefined : 'Keep the feedback controls visible after assisted autofill.',
    ),
    check(
      'accessibility-i18n',
      'language-tab-coverage',
      'Domestic and international language coverage',
      selectedLanguageExists(input) && hasEnglishShippingTab(input) ? 'pass' : selectedLanguageExists(input) ? 'warning' : 'fail',
      hasEnglishShippingTab(input)
        ? 'The selected country exposes both local language handling and international English shipping output.'
        : 'International English shipping output is not clearly available.',
      hasEnglishShippingTab(input) ? undefined : 'Add or expose an English shipping language tab for international delivery.',
    ),
    check(
      'accessibility-i18n',
      'single-screen-operability',
      'Operator-visible states',
      input.session.quality.decision === 'verified' || input.session.quality.decision === 'partial' ? 'pass' : 'warning',
      `Quality decision is ${input.session.quality.decision}; internal score is hidden from end users.`,
      input.session.quality.decision === 'needs_review' ? 'Show a review state and next action instead of exposing the score.' : undefined,
    ),
    check(
      'support-review',
      'review-actions',
      'Support and manual review next actions',
      input.session.status === 'blocked' ? 'fail' : hasExplicitNextActions || input.session.warnings.length > 0 ? 'pass' : 'warning',
      hasExplicitNextActions
        ? `Next actions are explicit: ${input.session.nextActions.join(', ')}.`
        : 'No explicit next action is available for support staff.',
      hasExplicitNextActions ? undefined : 'Provide a review, edit, scan, or create-intent next action.',
    ),
    check(
      'support-review',
      'document-and-feedback-review',
      'Document and feedback reviewability',
      hasDocument || input.hasClosedCorrectionFeedback || input.hasTranslationFeedback ? 'pass' : 'warning',
      hasDocument
        ? 'Document autofill candidate can be reviewed and applied manually.'
        : input.hasClosedCorrectionFeedback || input.hasTranslationFeedback
          ? 'User correction feedback is linked to the registration flow.'
          : 'No document or correction artifact is available yet.',
      hasDocument || input.hasClosedCorrectionFeedback || input.hasTranslationFeedback ? undefined : 'Allow document autofill or correction feedback before approval.',
    ),
    check(
      'developer-platform',
      'intent-session-ids',
      'Stable Address Element and Intent identifiers',
      input.session.id && input.session.intentPreview.id ? 'pass' : 'fail',
      'The registration flow has stable session and intent identifiers for API and webhook compatibility.',
      input.session.id && input.session.intentPreview.id ? undefined : 'Generate an Address Element session before submit.',
    ),
    check(
      'developer-platform',
      'safe-evidence-fingerprints',
      'Safe evidence fingerprints',
      hasEvidenceFingerprints && input.session.evidenceForIntent.length > 0 ? 'pass' : input.session.evidenceForIntent.length > 0 ? 'warning' : 'fail',
      hasEvidenceFingerprints
        ? 'Every evidence item has a safe fingerprint and no raw address payload.'
        : 'Evidence is missing safe fingerprints.',
      hasEvidenceFingerprints ? undefined : 'Attach safe fingerprints to evidence before exporting metadata.',
    ),
  ];

  return checks;
}

export function assessAddressRegistrationReadiness(input: AddressRegistrationReadinessInput): AddressRegistrationReadiness {
  const checks = buildChecks(input);
  const pass = checks.filter(item => item.status === 'pass').length;
  const warning = checks.filter(item => item.status === 'warning').length;
  const fail = checks.filter(item => item.status === 'fail').length;
  const roleSummaries = summarizeRoles(checks);
  const score = roundScore((pass + warning * 0.55) / checks.length);
  const status: AddressRegistrationReadinessStatus = input.session.status === 'blocked' || fail > 0
    ? input.session.status === 'blocked'
      ? 'blocked'
      : 'needs_review'
    : warning > 0
      ? 'usable'
      : 'ready';
  const nextActions = unique([
    ...checks.filter(item => item.status !== 'pass').map(item => item.action || ''),
    ...input.session.nextActions.map(mapSessionNextAction),
  ]).slice(0, 8);

  return {
    modelVersion: ADDRESS_REGISTRATION_READINESS_MODEL_VERSION,
    status,
    score,
    checks,
    roleSummaries,
    nextActions,
    publicMetadata: {
      sessionId: input.session.id,
      intentId: input.session.intentPreview.id,
      qualityDecision: input.session.quality.decision,
      intentStatus: input.session.intentPreview.status,
      checkSummary: {
        pass,
        warning,
        fail,
      },
      roles: roleSummaries,
      privacyBoundary: 'no-raw-address-public-metadata',
    },
  };
}
