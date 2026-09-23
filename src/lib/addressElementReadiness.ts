import type {
  AddressElementFieldKey,
  AddressElementNextAction,
  AddressElementSession,
} from './addressElement';
import type { AddressElementHostSurface } from './addressElementEvents';

export const ADDRESS_ELEMENT_READINESS_MODEL_VERSION = 'address-element-readiness-v1';

export const ADDRESS_ELEMENT_PROFESSIONAL_ROLES = [
  'checkout-integrator',
  'addressing-specialist',
  'carrier-ops',
  'privacy-security',
  'accessibility-i18n',
  'support-review',
  'developer-platform',
] as const;

export type AddressElementProfessionalRole = typeof ADDRESS_ELEMENT_PROFESSIONAL_ROLES[number];
export type AddressElementReadinessStatus = 'ready' | 'usable' | 'needs_review' | 'blocked';
export type AddressElementReadinessCheckStatus = 'pass' | 'warning' | 'fail';

export type AddressElementReadinessCheck = {
  id: string;
  role: AddressElementProfessionalRole;
  label: string;
  status: AddressElementReadinessCheckStatus;
  evidence: string;
  action?: string;
};

export type AddressElementRoleSummary = {
  role: AddressElementProfessionalRole;
  passed: number;
  warnings: number;
  failures: number;
  status: AddressElementReadinessStatus;
};

export type AddressElementReadinessInput = {
  session: Pick<
    AddressElementSession,
    | 'id'
    | 'status'
    | 'purpose'
    | 'mode'
    | 'countryCode'
    | 'selectedLanguage'
    | 'languageTabs'
    | 'fields'
    | 'missingRequiredFields'
    | 'inputPolicy'
    | 'autofill'
    | 'scanSecurity'
    | 'quality'
    | 'evidenceForIntent'
    | 'intentPreview'
    | 'nextActions'
    | 'warnings'
    | 'privacy'
  >;
  hostSurface?: AddressElementHostSurface | string;
  addressLinkStatus?: string;
  requestedCapabilities?: readonly string[];
  grantedScopes?: readonly string[];
  hasHostEventCallbacks?: boolean;
  hasAddressLink?: boolean;
  hasQrNfcControls?: boolean;
  hasHighRiskToggle?: boolean;
  hasVisibleNextAction?: boolean;
};

export type AddressElementReadiness = {
  modelVersion: typeof ADDRESS_ELEMENT_READINESS_MODEL_VERSION;
  status: AddressElementReadinessStatus;
  score: number;
  checks: AddressElementReadinessCheck[];
  roleSummaries: AddressElementRoleSummary[];
  nextActions: string[];
  publicMetadata: {
    sessionId: string;
    intentId: string;
    elementStatus: AddressElementSession['status'];
    qualityDecision: AddressElementSession['quality']['decision'];
    scanSecurityDecision: AddressElementSession['scanSecurity']['publicDecision'];
    intentStatus: AddressElementSession['intentPreview']['status'];
    hostSurface: string;
    checkSummary: {
      pass: number;
      warning: number;
      fail: number;
    };
    roles: AddressElementRoleSummary[];
    privacyBoundary: 'address-element-no-raw-host-contract';
  };
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function roundScore(value: number) {
  return Math.round(clamp01(value) * 100) / 100;
}

function presentField(input: AddressElementReadinessInput, key: AddressElementFieldKey) {
  return input.session.fields.some(field => field.key === key && field.present);
}

function hasEvidence(input: AddressElementReadinessInput, source: string) {
  return input.session.evidenceForIntent.some(item => item.source === source);
}

function hasSelectedLanguage(input: AddressElementReadinessInput) {
  return input.session.languageTabs.some(tab => tab.language === input.session.selectedLanguage && tab.enabled);
}

function hasEnglishShippingTab(input: AddressElementReadinessInput) {
  return input.session.languageTabs.some(tab => tab.language === 'en' || tab.source === 'english-shipping');
}

function hasQrOrNfc(input: AddressElementReadinessInput) {
  return Boolean(input.hasQrNfcControls)
    || input.session.autofill.channels.includes('qr')
    || input.session.autofill.channels.includes('nfc');
}

function requiresCarrierScan(input: AddressElementReadinessInput) {
  return input.session.intentPreview.requiredEvidence.some(group => group.group === 'carrier-acceptance');
}

function hasAgidEvidence(input: AddressElementReadinessInput) {
  return input.session.autofill.agidCandidatePresent
    || hasEvidence(input, 'agid-reverse-geocode')
    || hasEvidence(input, 'agid-s');
}

function hasPostalEvidence(input: AddressElementReadinessInput) {
  return input.session.autofill.postalCandidateCount > 0 || hasEvidence(input, 'postal-api');
}

function hasPostalEvidenceOrNoPostalPolicy(input: AddressElementReadinessInput) {
  return hasPostalEvidence(input) || input.session.inputPolicy.postalCode.available === false;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function check(
  role: AddressElementProfessionalRole,
  id: string,
  label: string,
  status: AddressElementReadinessCheckStatus,
  evidence: string,
  action?: string,
): AddressElementReadinessCheck {
  return {
    role,
    id,
    label,
    status,
    evidence,
    ...(action ? { action } : {}),
  };
}

function roleStatus(summary: Pick<AddressElementRoleSummary, 'failures' | 'warnings'>): AddressElementReadinessStatus {
  if (summary.failures > 0) return 'blocked';
  if (summary.warnings > 0) return 'usable';
  return 'ready';
}

function summarizeRoles(checks: AddressElementReadinessCheck[]): AddressElementRoleSummary[] {
  return ADDRESS_ELEMENT_PROFESSIONAL_ROLES.map(role => {
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
    enter_address: 'Keep focus on required address fields until the embedded element can proceed.',
    apply_postal_suggestion: 'Let the operator review and apply the postal-code suggestion.',
    apply_agid_suggestion: 'Let the operator review and apply the AGID hint without exposing raw AGID to the host.',
    scan_qr_or_nfc: 'Enable the QR/NFC reader or route the user to the scan flow.',
    request_recipient_proof: 'Request recipient proof before handoff or submission.',
    review_address: 'Route this element state to review instead of final submission.',
    create_intent: 'Create or update the host Address Intent using safe metadata only.',
  };
  return map[action] || '';
}

function buildChecks(input: AddressElementReadinessInput): AddressElementReadinessCheck[] {
  const missingRequired = input.session.missingRequiredFields;
  const hostSurface = String(input.hostSurface || 'custom');
  const requestedCapabilities = input.requestedCapabilities ?? [];
  const grantedScopes = input.grantedScopes ?? [];
  const hasRequiredComplete = missingRequired.length === 0;
  const hasHostEvents = Boolean(input.hasHostEventCallbacks);
  const hasAddressLink = Boolean(input.hasAddressLink || input.addressLinkStatus);
  const hasVisibleNextAction = Boolean(input.hasVisibleNextAction || input.session.nextActions.some(action => action !== 'none'));
  const hasEvidenceFingerprints = input.session.evidenceForIntent.length > 0
    && input.session.evidenceForIntent.every(item => Boolean(item.safeFingerprint));
  const privacyOk = input.session.privacy.rawFieldValuesReturned === false
    && input.session.privacy.plaintextAddressServerStorage === false
    && input.session.privacy.rawAgidServerStorage === false
    && input.session.privacy.rawAoidServerStorage === false
    && input.session.privacy.rawAddressStorage === false
    && input.session.privacy.publicPayloadUsesCommitments === true
    && input.session.privacy.plaintextTransmissionAllowed === false
    && input.session.privacy.purposeLimited === true
    && input.session.inputPolicy.fieldValuesStayLocal === true
    && input.session.inputPolicy.publicEventsUseSafeMetadataOnly === true;
  const highRiskSafe = !input.session.privacy.highRiskMode
    || input.session.status !== 'blocked';
  const highRiskSecureIntake = !input.session.privacy.highRiskMode
    || input.session.scanSecurity.publicDecision === 'ok';
  const linkScopeOk = requestedCapabilities.length === 0
    || grantedScopes.length > 0
    || ['requires-proof', 'ready'].includes(String(input.addressLinkStatus || ''));

  return [
    check(
      'checkout-integrator',
      'host-event-contract',
      'Host event contract',
      hasHostEvents ? 'pass' : 'warning',
      hasHostEvents
        ? `The ${hostSurface} host can receive safe Address Element events and readiness metadata.`
        : `The ${hostSurface} host can render the element but has no safe event callback wired.`,
      hasHostEvents ? undefined : 'Wire onPublicEvent or onReadinessChange before production embedding.',
    ),
    check(
      'checkout-integrator',
      'address-link-scopes',
      'Address Link scope consent',
      linkScopeOk ? 'pass' : hasAddressLink ? 'warning' : 'fail',
      linkScopeOk
        ? 'Requested capabilities are covered by granted scopes or a proof-required state.'
        : hasAddressLink
          ? 'Address Link is present, but requested scopes are not yet granted.'
          : 'No Address Link or scope consent state is available.',
      linkScopeOk ? undefined : 'Add Address Link consent before the host uses delivery or recipient claims.',
    ),
    check(
      'addressing-specialist',
      'country-language-fields',
      'Country, language, and required fields',
      presentField(input, 'countryCode') && hasSelectedLanguage(input) && hasRequiredComplete
        ? 'pass'
        : presentField(input, 'countryCode') && hasSelectedLanguage(input)
          ? 'warning'
          : 'fail',
      hasRequiredComplete
        ? 'Country, active language, and required fields are complete.'
        : `Missing required fields: ${missingRequired.join(', ')}.`,
      hasRequiredComplete ? undefined : 'Complete missing required fields or keep the session in review.',
    ),
    check(
      'addressing-specialist',
      'assisted-addressing',
      'Postal policy and AGID assistance',
      hasPostalEvidenceOrNoPostalPolicy(input) && hasAgidEvidence(input)
        ? 'pass'
        : hasPostalEvidenceOrNoPostalPolicy(input) || hasAgidEvidence(input)
          ? 'warning'
          : 'fail',
      hasPostalEvidenceOrNoPostalPolicy(input) && hasAgidEvidence(input)
        ? input.session.inputPolicy.postalCode.available
          ? 'Postal-code evidence and AGID evidence are both available.'
          : 'The country metadata does not use postal codes, and AGID evidence is available.'
        : 'The element has only partial assisted addressing evidence.',
      hasPostalEvidenceOrNoPostalPolicy(input) && hasAgidEvidence(input) ? undefined : 'Add postal-code, no-postal policy, or AGID assistance for better address completion.',
    ),
    check(
      'carrier-ops',
      'handoff-inputs',
      'Carrier handoff inputs',
      hasQrOrNfc(input) && requiresCarrierScan(input) ? 'pass' : hasQrOrNfc(input) ? 'warning' : 'fail',
      hasQrOrNfc(input)
        ? 'QR/NFC scan controls are present for carrier or POS handoff.'
        : 'No scan controls are available for handoff.',
      hasQrOrNfc(input) ? undefined : 'Expose QR/NFC controls for POS, pickup, or carrier handoff surfaces.',
    ),
    check(
      'carrier-ops',
      'decision-state',
      'Operator decision state',
      ['ready', 'needs_review', 'blocked'].includes(input.session.status) && hasVisibleNextAction ? 'pass' : 'warning',
      `Element status is ${input.session.status}; quality decision is ${input.session.quality.decision}.`,
      hasVisibleNextAction ? undefined : 'Show an explicit next action to avoid ambiguous checkout or handoff states.',
    ),
    check(
      'privacy-security',
      'no-raw-host-contract',
      'No raw address host contract',
      privacyOk ? 'pass' : 'fail',
      privacyOk
        ? 'The element exports only states, safe fingerprints, and intent metadata.'
        : 'The element privacy boundary allows raw address material.',
      privacyOk ? undefined : 'Block host export until raw fields are removed from public metadata.',
    ),
    check(
      'privacy-security',
      'high-risk-controls',
      'High-risk mode controls',
      input.session.privacy.highRiskMode
        ? input.hasHighRiskToggle && highRiskSafe && highRiskSecureIntake ? 'pass' : 'fail'
        : input.hasHighRiskToggle ? 'pass' : 'warning',
      input.session.privacy.highRiskMode
        ? `High-risk mode is active; secure intake decision is ${input.session.scanSecurity.publicDecision}.`
        : 'Normal-risk mode is active.',
      input.session.privacy.highRiskMode && !highRiskSecureIntake
        ? 'Require AGID-S QR/NFC or commitment-only sharing before handoff.'
        : input.session.privacy.highRiskMode
          ? undefined
          : input.hasHighRiskToggle ? undefined : 'Expose a high-risk mode toggle for sensitive deployments.',
    ),
    check(
      'accessibility-i18n',
      'language-tabs',
      'Language tabs and international shipping',
      hasSelectedLanguage(input) && hasEnglishShippingTab(input) ? 'pass' : hasSelectedLanguage(input) ? 'warning' : 'fail',
      hasEnglishShippingTab(input)
        ? 'The embedded element supports local language and English international shipping display.'
        : 'English international shipping output is not clearly available.',
      hasEnglishShippingTab(input) ? undefined : 'Add an English shipping tab for international delivery hosts.',
    ),
    check(
      'accessibility-i18n',
      'compact-operability',
      'Compact operator operability',
      hasVisibleNextAction && input.session.warnings.length <= 3 ? 'pass' : hasVisibleNextAction ? 'warning' : 'fail',
      hasVisibleNextAction
        ? 'The element exposes a compact next-action state without showing internal scores.'
        : 'The element lacks a compact visible next-action state.',
      hasVisibleNextAction ? undefined : 'Show the next action inside the element shell.',
    ),
    check(
      'support-review',
      'review-routing',
      'Review routing',
      input.session.status === 'blocked' || input.session.status === 'needs_review' ? 'pass' : input.session.warnings.length > 0 ? 'warning' : 'pass',
      input.session.status === 'blocked' || input.session.status === 'needs_review'
        ? 'The element clearly routes questionable states to review or block.'
        : 'The element can proceed without manual review.',
      input.session.status === 'blocked' || input.session.status === 'needs_review' ? 'Keep the host submission disabled until review resolves.' : undefined,
    ),
    check(
      'support-review',
      'warning-codes',
      'Warning and audit reason codes',
      input.session.warnings.length > 0 || input.session.quality.decision === 'verified' ? 'pass' : 'warning',
      input.session.warnings.length > 0
        ? `Warning codes are available: ${input.session.warnings.slice(0, 4).join(', ')}.`
        : 'No warning codes are present for support.',
      input.session.warnings.length > 0 || input.session.quality.decision === 'verified' ? undefined : 'Attach review reason codes to partial sessions.',
    ),
    check(
      'developer-platform',
      'stable-identifiers',
      'Stable session and intent identifiers',
      input.session.id && input.session.intentPreview.id ? 'pass' : 'fail',
      'The element has stable identifiers for SDK events, webhooks, and logs.',
      input.session.id && input.session.intentPreview.id ? undefined : 'Generate a session before sending events.',
    ),
    check(
      'developer-platform',
      'safe-evidence-fingerprints',
      'Safe evidence fingerprints',
      hasEvidenceFingerprints ? 'pass' : input.session.evidenceForIntent.length > 0 ? 'warning' : 'fail',
      hasEvidenceFingerprints
        ? 'Every exported evidence item has a safe fingerprint.'
        : 'Evidence is missing safe fingerprints or evidence is absent.',
      hasEvidenceFingerprints ? undefined : 'Attach safe fingerprints before exporting host metadata.',
    ),
  ];
}

export function assessAddressElementReadiness(input: AddressElementReadinessInput): AddressElementReadiness {
  const checks = buildChecks(input);
  const pass = checks.filter(item => item.status === 'pass').length;
  const warning = checks.filter(item => item.status === 'warning').length;
  const fail = checks.filter(item => item.status === 'fail').length;
  const roleSummaries = summarizeRoles(checks);
  const score = roundScore((pass + warning * 0.55) / checks.length);
  const status: AddressElementReadinessStatus = input.session.status === 'blocked' || fail > 0
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
    modelVersion: ADDRESS_ELEMENT_READINESS_MODEL_VERSION,
    status,
    score,
    checks,
    roleSummaries,
    nextActions,
    publicMetadata: {
      sessionId: input.session.id,
      intentId: input.session.intentPreview.id,
      elementStatus: input.session.status,
      qualityDecision: input.session.quality.decision,
      scanSecurityDecision: input.session.scanSecurity.publicDecision,
      intentStatus: input.session.intentPreview.status,
      hostSurface: String(input.hostSurface || 'custom'),
      checkSummary: {
        pass,
        warning,
        fail,
      },
      roles: roleSummaries,
      privacyBoundary: 'address-element-no-raw-host-contract',
    },
  };
}
