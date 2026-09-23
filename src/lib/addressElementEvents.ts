import type { AddressElementNextAction, AddressElementSession } from './addressElement';

export const ADDRESS_ELEMENT_EVENT_MODEL_VERSION = 'address-element-event-v1';

export const ADDRESS_ELEMENT_EVENT_TYPES = [
  'session_changed',
  'intent_preview',
  'needs_review',
  'ready',
  'blocked',
  'qr_nfc_requested',
  'link_scope_changed',
] as const;

export const ADDRESS_ELEMENT_HOST_SURFACES = [
  'ec',
  'cms',
  'pos',
  'shopping-agent',
  'registration',
  'custom',
] as const;

export type AddressElementEventType = typeof ADDRESS_ELEMENT_EVENT_TYPES[number];
export type AddressElementHostSurface = typeof ADDRESS_ELEMENT_HOST_SURFACES[number];

export type AddressElementEventMetadata = Record<string, JsonValue>;

export type AddressElementPublicEvent = {
  modelVersion: typeof ADDRESS_ELEMENT_EVENT_MODEL_VERSION;
  type: AddressElementEventType;
  surface: AddressElementHostSurface;
  sessionId: string;
  intentId: string;
  status: AddressElementSession['status'];
  qualityDecision: AddressElementSession['quality']['decision'];
  intentStatus: AddressElementSession['intentPreview']['status'];
  nextAction: AddressElementNextAction;
  timestamp: string;
  privacyBoundary: 'address-element-event-no-raw-address';
  metadata?: AddressElementEventMetadata;
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const FORBIDDEN_METADATA_KEY_PARTS = [
  'address',
  'agid',
  'aoid',
  'cipher',
  'exactlocation',
  'name',
  'phone',
  'plaintext',
  'privatekey',
  'proofcode',
  'raw',
  'recipient',
  'room',
  'secret',
  'unit',
];

function normalizeSurface(surface: AddressElementHostSurface | string | undefined): AddressElementHostSurface {
  return ADDRESS_ELEMENT_HOST_SURFACES.includes(surface as AddressElementHostSurface)
    ? surface as AddressElementHostSurface
    : 'custom';
}

function primaryNextAction(session: AddressElementSession): AddressElementNextAction {
  return session.nextActions.find(action => action !== 'none') || 'none';
}

function findForbiddenMetadataKeys(value: unknown, path: string[] = []): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenMetadataKeys(item, [...path, String(index)]));
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    const ownPath = [...path, key].join('.');
    const ownViolations = FORBIDDEN_METADATA_KEY_PARTS.some(part => normalized.includes(part))
      ? [ownPath]
      : [];
    return [...ownViolations, ...findForbiddenMetadataKeys(nested, [...path, key])];
  });
}

export function assertAddressElementEventMetadataSafe(metadata: AddressElementEventMetadata | undefined) {
  const forbidden = findForbiddenMetadataKeys(metadata);
  if (forbidden.length > 0) {
    throw new Error(`address-element-event-private-metadata:${forbidden.join(',')}`);
  }
}

export function summarizeAddressElementSessionForEvent(session: AddressElementSession): AddressElementEventMetadata {
  const required = session.fields.filter(field => field.required).length;
  const presentRequired = session.fields.filter(field => field.required && field.present).length;
  return {
    fieldStateSummary: {
      required,
      presentRequired,
      missingRequired: session.missingRequiredFields.length,
      privateFields: session.fields.filter(field => field.private).length,
    },
    evidenceSummary: {
      count: session.evidenceForIntent.length,
      sources: session.evidenceForIntent.map(item => item.source).filter(Boolean).slice(0, 12),
      allFingerprinted: session.evidenceForIntent.every(item => Boolean(item.safeFingerprint)),
    },
    languageSummary: {
      selected: session.selectedLanguage,
      tabCount: session.languageTabs.length,
      hasEnglishShipping: session.languageTabs.some(tab => tab.language === 'en' || tab.source === 'english-shipping'),
    },
    warningCodes: session.warnings.slice(0, 12),
    autofillChannels: session.autofill.channels,
    highRiskMode: session.privacy.highRiskMode,
  };
}

export function buildAddressElementPublicEvent(input: {
  type: AddressElementEventType;
  surface?: AddressElementHostSurface | string;
  session: AddressElementSession;
  timestamp?: string;
  metadata?: AddressElementEventMetadata;
}): AddressElementPublicEvent {
  const metadata = input.metadata
    ? {
        ...summarizeAddressElementSessionForEvent(input.session),
        ...input.metadata,
      }
    : summarizeAddressElementSessionForEvent(input.session);
  assertAddressElementEventMetadataSafe(metadata);
  return {
    modelVersion: ADDRESS_ELEMENT_EVENT_MODEL_VERSION,
    type: input.type,
    surface: normalizeSurface(input.surface),
    sessionId: input.session.id,
    intentId: input.session.intentPreview.id,
    status: input.session.status,
    qualityDecision: input.session.quality.decision,
    intentStatus: input.session.intentPreview.status,
    nextAction: primaryNextAction(input.session),
    timestamp: input.timestamp || new Date().toISOString(),
    privacyBoundary: 'address-element-event-no-raw-address',
    metadata,
  };
}

export function buildAddressElementPublicEvents(input: {
  surface?: AddressElementHostSurface | string;
  session: AddressElementSession;
  timestamp?: string;
}): AddressElementPublicEvent[] {
  const events: AddressElementEventType[] = ['session_changed', 'intent_preview'];
  if (input.session.status === 'ready') events.push('ready');
  if (input.session.status === 'needs_review' || input.session.quality.decision === 'needs_review') events.push('needs_review');
  if (input.session.status === 'blocked' || input.session.quality.decision === 'blocked') events.push('blocked');
  if (input.session.nextActions.includes('scan_qr_or_nfc')) events.push('qr_nfc_requested');
  return events.map(type => buildAddressElementPublicEvent({
    type,
    surface: input.surface,
    session: input.session,
    timestamp: input.timestamp,
  }));
}
