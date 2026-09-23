import type { AddressElementSession } from './addressElement';
import type { AddressRegistrationReadiness } from './addressRegistrationReadiness';
import {
  type AddressQualityDecision,
  type AddressQualityDecisionState,
} from './addressQualityDecision';

export const REGISTERED_ADDRESS_QUALITY_MODEL_VERSION = 'registered-address-quality-v1';

export type RegisteredAddressQualityBand = 'high' | 'medium' | 'low' | 'blocked';

export type RegisteredAddressQualitySnapshot = {
  modelVersion: typeof REGISTERED_ADDRESS_QUALITY_MODEL_VERSION;
  state: AddressQualityDecisionState;
  label: AddressQualityDecision['label'];
  shortLabel: AddressQualityDecision['shortLabel'];
  severity: AddressQualityDecision['severity'];
  confidenceBand: RegisteredAddressQualityBand;
  reasonCodes: string[];
  sourceFlags: {
    addressElement: true;
    postalAutofill: boolean;
    agidAssistance: boolean;
    agidPrimaryIdentifier: boolean;
    documentAssistance: boolean;
    translationFeedback: boolean;
  };
  readiness: {
    status: AddressRegistrationReadiness['status'];
    intentStatus: AddressRegistrationReadiness['publicMetadata']['intentStatus'];
    checkSummary: AddressRegistrationReadiness['publicMetadata']['checkSummary'];
    privacyBoundary: AddressRegistrationReadiness['publicMetadata']['privacyBoundary'];
  };
  privacy: {
    safeForPublicQr: true;
    fieldValuesIncluded: false;
    recipientIncluded: false;
    exactCoordinatesIncluded: false;
  };
};

export type RegisteredAddressQualityInput = {
  addressElement: Pick<
    AddressElementSession,
    'quality' | 'missingRequiredFields' | 'warnings' | 'autofill'
  > & Partial<Pick<AddressElementSession, 'primaryIdentifier'>>;
  readiness: Pick<AddressRegistrationReadiness, 'status' | 'score' | 'publicMetadata'>;
  reasonCodes?: readonly string[];
  hasPostalAutofill?: boolean;
  hasAgidAssistance?: boolean;
  hasDocumentAssistance?: boolean;
  hasTranslationFeedback?: boolean;
};

const STATE_COPY: Record<AddressQualityDecisionState, Omit<AddressQualityDecision, 'state' | 'reasonCodes'>> = {
  'address-ok': {
    label: 'OK',
    shortLabel: 'OK',
    description: 'The registered address has enough evidence for normal QR handoff.',
    action: 'Use the registered address QR for normal local registration and low-risk handoff.',
    severity: 0,
  },
  'needs-review': {
    label: 'Needs Review',
    shortLabel: 'Review',
    description: 'The registered address can be kept, but should be confirmed before delivery handoff.',
    action: 'Confirm postal evidence, AGID evidence, language rendering, or operator review.',
    severity: 2,
  },
  rejected: {
    label: 'Rejected',
    shortLabel: 'Reject',
    description: 'The registered address is missing required delivery fields.',
    action: 'Complete the required address fields before using this QR for delivery.',
    severity: 3,
  },
  restricted: {
    label: 'Restricted',
    shortLabel: 'Restricted',
    description: 'The registered address is blocked by safety or privacy policy.',
    action: 'Use a privacy-preserving AGID/AOID reference or manual review instead.',
    severity: 3,
  },
};

const DEFAULT_CHECK_SUMMARY: AddressRegistrationReadiness['publicMetadata']['checkSummary'] = {
  pass: 0,
  warning: 0,
  fail: 0,
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function uniqueCodes(values: readonly string[] = []) {
  return Array.from(new Set(
    values
      .map(value => String(value).trim())
      .filter(value => value && value.length <= 96)
      .slice(0, 16),
  ));
}

function confidenceBandFor(score: number, state: AddressQualityDecisionState): RegisteredAddressQualityBand {
  if (state === 'restricted') return 'blocked';
  if (state === 'rejected') return 'low';
  if (score >= 0.82) return 'high';
  if (score >= 0.58) return 'medium';
  return 'low';
}

function stateFromInput(input: RegisteredAddressQualityInput): AddressQualityDecisionState {
  if (input.readiness.status === 'blocked' || input.addressElement.quality.decision === 'blocked') {
    return 'restricted';
  }
  if (input.addressElement.missingRequiredFields.length > 0) return 'rejected';
  if (
    input.readiness.status === 'needs_review'
    || input.readiness.status === 'usable'
    || input.addressElement.quality.decision === 'needs_review'
    || input.addressElement.quality.decision === 'partial'
    || input.addressElement.warnings.length > 0
  ) {
    return 'needs-review';
  }
  return 'address-ok';
}

export function registeredQualitySnapshotToDecision(
  snapshot: RegisteredAddressQualitySnapshot,
): AddressQualityDecision {
  const copy = STATE_COPY[snapshot.state] || STATE_COPY['needs-review'];
  return {
    state: snapshot.state,
    ...copy,
    reasonCodes: snapshot.reasonCodes.length ? snapshot.reasonCodes : ['registered-address-quality'],
  };
}

export function buildRegisteredAddressQualitySnapshot(
  input: RegisteredAddressQualityInput,
): RegisteredAddressQualitySnapshot {
  const state = stateFromInput(input);
  const copy = STATE_COPY[state];
  const score = Math.min(
    clamp01(input.readiness.score),
    clamp01(input.addressElement.quality.score),
  );
  const reasonCodes = uniqueCodes([
    ...(input.reasonCodes ?? []),
    `readiness:${input.readiness.status}`,
    `address-element:${input.addressElement.quality.decision}`,
    ...(input.addressElement.primaryIdentifier ? [`primary:${input.addressElement.primaryIdentifier.kind}`] : []),
    ...input.addressElement.missingRequiredFields.map(field => `missing:${field}`),
  ]);

  return {
    modelVersion: REGISTERED_ADDRESS_QUALITY_MODEL_VERSION,
    state,
    label: copy.label,
    shortLabel: copy.shortLabel,
    severity: copy.severity,
    confidenceBand: confidenceBandFor(score, state),
    reasonCodes,
    sourceFlags: {
      addressElement: true,
      postalAutofill: Boolean(input.hasPostalAutofill || input.addressElement.autofill.postalCandidateCount),
      agidAssistance: Boolean(input.hasAgidAssistance || input.addressElement.autofill.agidCandidatePresent),
      agidPrimaryIdentifier: input.addressElement.primaryIdentifier?.kind === 'agid',
      documentAssistance: Boolean(input.hasDocumentAssistance),
      translationFeedback: Boolean(input.hasTranslationFeedback),
    },
    readiness: {
      status: input.readiness.status,
      intentStatus: input.readiness.publicMetadata.intentStatus,
      checkSummary: input.readiness.publicMetadata.checkSummary,
      privacyBoundary: input.readiness.publicMetadata.privacyBoundary,
    },
    privacy: {
      safeForPublicQr: true,
      fieldValuesIncluded: false,
      recipientIncluded: false,
      exactCoordinatesIncluded: false,
    },
  };
}

export function sanitizeRegisteredAddressQualitySnapshot(
  value: unknown,
): RegisteredAddressQualitySnapshot | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const input = value as Partial<RegisteredAddressQualitySnapshot>;
  if (input.modelVersion !== REGISTERED_ADDRESS_QUALITY_MODEL_VERSION) return undefined;
  const state = ['address-ok', 'needs-review', 'rejected', 'restricted'].includes(String(input.state))
    ? input.state as AddressQualityDecisionState
    : 'needs-review';
  const copy = STATE_COPY[state];
  const readiness = input.readiness && typeof input.readiness === 'object'
    ? input.readiness as Partial<RegisteredAddressQualitySnapshot['readiness']>
    : {};

  return {
    modelVersion: REGISTERED_ADDRESS_QUALITY_MODEL_VERSION,
    state,
    label: copy.label,
    shortLabel: copy.shortLabel,
    severity: copy.severity,
    confidenceBand: ['high', 'medium', 'low', 'blocked'].includes(String(input.confidenceBand))
      ? input.confidenceBand as RegisteredAddressQualityBand
      : confidenceBandFor(0.5, state),
    reasonCodes: uniqueCodes(input.reasonCodes),
    sourceFlags: {
      addressElement: true,
      postalAutofill: Boolean(input.sourceFlags?.postalAutofill),
      agidAssistance: Boolean(input.sourceFlags?.agidAssistance),
      agidPrimaryIdentifier: Boolean(input.sourceFlags?.agidPrimaryIdentifier),
      documentAssistance: Boolean(input.sourceFlags?.documentAssistance),
      translationFeedback: Boolean(input.sourceFlags?.translationFeedback),
    },
    readiness: {
      status: ['ready', 'usable', 'needs_review', 'blocked'].includes(String(readiness.status))
        ? readiness.status as AddressRegistrationReadiness['status']
        : 'needs_review',
      intentStatus: typeof readiness.intentStatus === 'string' ? readiness.intentStatus as RegisteredAddressQualitySnapshot['readiness']['intentStatus'] : 'requires_review',
      checkSummary: readiness.checkSummary && typeof readiness.checkSummary === 'object'
        ? {
            pass: Number(readiness.checkSummary.pass) || 0,
            warning: Number(readiness.checkSummary.warning) || 0,
            fail: Number(readiness.checkSummary.fail) || 0,
          }
        : DEFAULT_CHECK_SUMMARY,
      privacyBoundary: 'no-raw-address-public-metadata',
    },
    privacy: {
      safeForPublicQr: true,
      fieldValuesIncluded: false,
      recipientIncluded: false,
      exactCoordinatesIncluded: false,
    },
  };
}
