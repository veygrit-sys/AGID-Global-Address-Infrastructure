import { sha256Hex } from './sha256';

export const ADDRESS_INTENT_MODEL_VERSION = 'agid-address-intent-v1';

export const ADDRESS_INTENT_STATUSES = [
  'requires_input',
  'verifying',
  'requires_review',
  'verified',
  'rejected',
  'expired',
] as const;

export const ADDRESS_INTENT_PURPOSES = [
  'delivery',
  'return',
  'aid',
  'identity',
  'customs',
] as const;

export const ADDRESS_INTENT_MODES = [
  'local',
  'server',
  'zk',
  'ethereum',
  'full',
] as const;

export const ADDRESS_INTENT_EVIDENCE_SOURCES = [
  'address-form',
  'postal-api',
  'agid-reverse-geocode',
  'carrier-scan',
  'recipient-proof',
  'shipping-label-qr',
  'agid-s',
  'aoid-ownership-proof',
  'address-credential',
  'zk-address-proof',
  'ethereum-registry',
  'customs-data',
  'manual-review',
] as const;

export const ADDRESS_INTENT_NEXT_ACTIONS = [
  'edit_address',
  'scan_qr',
  'request_recipient_proof',
  'manual_review',
  'wait_for_verification',
  'issue_waybill',
  'none',
] as const;

const EVIDENCE_STATUSES = ['pending', 'passed', 'failed', 'warning'] as const;
const FORBIDDEN_PRIVATE_KEYS = [
  'rawAddress',
  'addressText',
  'plaintextAddress',
  'recipient',
  'recipientName',
  'phone',
  'phoneNumber',
  'unit',
  'room',
  'rawAgid',
  'agid',
  'rawAoid',
  'aoid',
  'proofCode',
  'recipientSecret',
  'privateKey',
  'secret',
];

export type AddressIntentStatus = typeof ADDRESS_INTENT_STATUSES[number];
export type AddressIntentPurpose = typeof ADDRESS_INTENT_PURPOSES[number];
export type AddressIntentMode = typeof ADDRESS_INTENT_MODES[number];
export type AddressIntentEvidenceSource = typeof ADDRESS_INTENT_EVIDENCE_SOURCES[number];
export type AddressIntentEvidenceStatus = typeof EVIDENCE_STATUSES[number];
export type AddressIntentNextAction = typeof ADDRESS_INTENT_NEXT_ACTIONS[number];

export type AddressIntentEvidenceInput = {
  source?: string;
  status?: string;
  confidence?: number;
  code?: string;
  safeFingerprint?: string;
  createdAt?: string;
};

export type AddressIntentEvidence = {
  source: AddressIntentEvidenceSource;
  status: AddressIntentEvidenceStatus;
  confidence: number;
  code?: string;
  safeFingerprint?: string;
  createdAt: string;
};

export type AddressIntentInput = {
  id?: string;
  purpose?: string;
  mode?: string;
  evidence?: AddressIntentEvidenceInput[];
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string;
  requiresCarrierScan?: boolean;
  requiresRecipientProof?: boolean;
  manualReviewRequired?: boolean;
  manualReviewApproved?: boolean;
  rejectedReason?: string;
};

export type AddressIntentRequiredEvidenceGroup = {
  group: string;
  anyOf: AddressIntentEvidenceSource[];
};

export type AddressIntentPrivacyBoundary = {
  plaintextAddressStored: false;
  rawAgidStored: false;
  rawAoidStored: false;
  recipientProofMaterialStored: false;
  publicSurface: 'intent-status-evidence-fingerprints-and-next-action-only';
};

export type AddressIntent = {
  modelVersion: typeof ADDRESS_INTENT_MODEL_VERSION;
  id: string;
  status: AddressIntentStatus;
  purpose: AddressIntentPurpose;
  mode: AddressIntentMode;
  evidence: AddressIntentEvidence[];
  requiredEvidence: AddressIntentRequiredEvidenceGroup[];
  missingEvidence: AddressIntentRequiredEvidenceGroup[];
  nextAction: AddressIntentNextAction;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  errors: string[];
  warnings: string[];
  privacy: AddressIntentPrivacyBoundary;
};

export type AddressIntentStore = {
  create(input: AddressIntentInput): AddressIntent;
  get(intentId: string): AddressIntent | undefined;
  update(intentId: string, patch: AddressIntentInput & { appendEvidence?: boolean }): AddressIntent | undefined;
  listRecent(limit?: number): AddressIntent[];
};

function normalizePurpose(value: unknown): AddressIntentPurpose {
  return ADDRESS_INTENT_PURPOSES.includes(value as AddressIntentPurpose)
    ? value as AddressIntentPurpose
    : 'delivery';
}

function normalizeMode(value: unknown): AddressIntentMode {
  return ADDRESS_INTENT_MODES.includes(value as AddressIntentMode)
    ? value as AddressIntentMode
    : 'local';
}

function normalizeEvidenceSource(value: unknown): AddressIntentEvidenceSource | undefined {
  const normalized = typeof value === 'string'
    ? value.trim().toLowerCase().replace(/_/g, '-')
    : '';
  if (!normalized) return undefined;
  if (ADDRESS_INTENT_EVIDENCE_SOURCES.includes(normalized as AddressIntentEvidenceSource)) {
    return normalized as AddressIntentEvidenceSource;
  }
  if (normalized === 'postal' || normalized === 'postal-code-api' || normalized === 'postcode-api') return 'postal-api';
  if (normalized === 'reverse-geocode' || normalized === 'agid-reverse') return 'agid-reverse-geocode';
  if (normalized === 'carrier' || normalized === 'carrier-accepted') return 'carrier-scan';
  if (normalized === 'recipient' || normalized === 'recipient-controlled') return 'recipient-proof';
  if (normalized === 'aoid-proof' || normalized === 'aoid-ownership') return 'aoid-ownership-proof';
  if (normalized === 'credential') return 'address-credential';
  if (normalized === 'zk-proof') return 'zk-address-proof';
  if (normalized === 'ethereum' || normalized === 'registry') return 'ethereum-registry';
  return undefined;
}

function normalizeEvidenceStatus(value: unknown): AddressIntentEvidenceStatus {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase().replace(/_/g, '-') : '';
  if (normalized === 'ok' || normalized === 'accepted' || normalized === 'verified') return 'passed';
  if (normalized === 'review' || normalized === 'needs-review' || normalized === 'partial') return 'warning';
  if (normalized === 'rejected' || normalized === 'invalid') return 'failed';
  return EVIDENCE_STATUSES.includes(normalized as AddressIntentEvidenceStatus)
    ? normalized as AddressIntentEvidenceStatus
    : 'passed';
}

function clampConfidence(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : fallback;
}

function validIsoOrNow(value: unknown) {
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return value;
  return new Date().toISOString();
}

function optionalIso(value: unknown) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : undefined;
}

function findForbiddenPrivateKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findForbiddenPrivateKeys(item, `${prefix}[${index}]`));
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const findings: string[] = [];
  for (const [key, nested] of entries) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (FORBIDDEN_PRIVATE_KEYS.some(forbidden => forbidden.toLowerCase() === key.toLowerCase())) {
      findings.push(path);
    }
    findings.push(...findForbiddenPrivateKeys(nested, path));
  }
  return findings;
}

function normalizeEvidence(input: AddressIntentEvidenceInput[] | undefined, now: string) {
  const evidence: AddressIntentEvidence[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const item of input ?? []) {
    const forbiddenKeys = findForbiddenPrivateKeys(item);
    if (forbiddenKeys.length > 0) {
      warnings.push('private-evidence-fields-stripped');
    }

    const source = normalizeEvidenceSource(item.source);
    if (!source) {
      warnings.push('unknown-evidence-source-ignored');
      continue;
    }

    const status = normalizeEvidenceStatus(item.status);
    const confidence = clampConfidence(item.confidence, status === 'passed' ? 1 : status === 'pending' ? 0.5 : 0);
    const createdAt = validIsoOrNow(item.createdAt ?? now);
    const code = typeof item.code === 'string' && item.code.trim() ? item.code.trim() : undefined;
    const safeFingerprint = typeof item.safeFingerprint === 'string' && item.safeFingerprint.trim()
      ? item.safeFingerprint.trim()
      : undefined;

    evidence.push({
      source,
      status,
      confidence,
      ...(code ? { code } : {}),
      ...(safeFingerprint ? { safeFingerprint } : {}),
      createdAt,
    });
  }

  if (warnings.includes('private-evidence-fields-stripped')) {
    errors.push('raw-private-evidence-is-not-stored-by-address-intents');
  }

  return { evidence, warnings, errors };
}

function requiredEvidenceGroups(input: AddressIntentInput, purpose: AddressIntentPurpose, mode: AddressIntentMode) {
  const groups: AddressIntentRequiredEvidenceGroup[] = [];

  if (purpose === 'delivery' || purpose === 'return') {
    groups.push({
      group: 'address-reference',
      anyOf: ['address-form', 'agid-reverse-geocode', 'shipping-label-qr', 'agid-s'],
    });
    groups.push({
      group: 'address-quality',
      anyOf: ['postal-api', 'agid-reverse-geocode'],
    });
  }

  if (purpose === 'aid') {
    groups.push({
      group: 'eligibility-location',
      anyOf: ['address-credential', 'agid-reverse-geocode', 'zk-address-proof'],
    });
  }

  if (purpose === 'identity') {
    groups.push({
      group: 'identity-or-ownership',
      anyOf: ['aoid-ownership-proof', 'address-credential', 'recipient-proof', 'zk-address-proof'],
    });
  }

  if (purpose === 'customs') {
    groups.push({ group: 'address-reference', anyOf: ['address-form', 'agid-reverse-geocode'] });
    groups.push({ group: 'address-quality', anyOf: ['postal-api', 'agid-reverse-geocode'] });
    groups.push({ group: 'trade-context', anyOf: ['customs-data'] });
  }

  if (input.requiresCarrierScan) {
    groups.push({ group: 'carrier-acceptance', anyOf: ['carrier-scan', 'shipping-label-qr'] });
  }

  if (input.requiresRecipientProof) {
    groups.push({ group: 'recipient-control', anyOf: ['recipient-proof'] });
  }

  if (mode === 'zk' || mode === 'full') {
    groups.push({ group: 'private-proof', anyOf: ['zk-address-proof', 'address-credential'] });
  }

  if (mode === 'ethereum' || mode === 'full') {
    groups.push({ group: 'public-registry', anyOf: ['ethereum-registry'] });
  }

  return groups;
}

function missingEvidenceGroups(groups: AddressIntentRequiredEvidenceGroup[], evidence: AddressIntentEvidence[]) {
  return groups.filter(group => !group.anyOf.some(source =>
    evidence.some(item => item.source === source && item.status === 'passed')
  ));
}

function hasPendingEvidence(evidence: AddressIntentEvidence[]) {
  return evidence.some(item => item.status === 'pending');
}

function hasWarningEvidence(evidence: AddressIntentEvidence[]) {
  return evidence.some(item => item.status === 'warning');
}

function hasFailedRequiredEvidence(groups: AddressIntentRequiredEvidenceGroup[], evidence: AddressIntentEvidence[]) {
  return groups.some(group =>
    group.anyOf.some(source => evidence.some(item => item.source === source && item.status === 'failed')) &&
    !group.anyOf.some(source => evidence.some(item => item.source === source && item.status === 'passed'))
  );
}

function chooseNextAction(
  status: AddressIntentStatus,
  purpose: AddressIntentPurpose,
  missing: AddressIntentRequiredEvidenceGroup[],
): AddressIntentNextAction {
  if (status === 'verified') {
    return purpose === 'delivery' || purpose === 'return' || purpose === 'customs' ? 'issue_waybill' : 'none';
  }
  if (status === 'verifying') return 'wait_for_verification';
  if (status === 'requires_review') return 'manual_review';
  if (status === 'rejected' || status === 'expired') return 'none';

  if (missing.some(group => group.group === 'recipient-control')) return 'request_recipient_proof';
  if (missing.some(group => group.group === 'carrier-acceptance')) return 'scan_qr';
  if (missing.some(group => group.group === 'public-registry' || group.group === 'private-proof')) return 'scan_qr';
  return 'edit_address';
}

function buildIntentId(input: AddressIntentInput, purpose: AddressIntentPurpose, mode: AddressIntentMode, createdAt: string) {
  if (typeof input.id === 'string' && /^AIT-[A-F0-9]{16,32}$/.test(input.id.trim().toUpperCase())) {
    return input.id.trim().toUpperCase();
  }

  const hash = sha256Hex(JSON.stringify({
    purpose,
    mode,
    createdAt,
    evidence: (input.evidence ?? []).map(item => ({
      source: item.source,
      safeFingerprint: item.safeFingerprint,
      code: item.code,
    })),
  })).toUpperCase();
  return `AIT-${hash.slice(0, 24)}`;
}

function privacyBoundary(): AddressIntentPrivacyBoundary {
  return {
    plaintextAddressStored: false,
    rawAgidStored: false,
    rawAoidStored: false,
    recipientProofMaterialStored: false,
    publicSurface: 'intent-status-evidence-fingerprints-and-next-action-only',
  };
}

export function buildAddressIntent(input: AddressIntentInput = {}): AddressIntent {
  const now = new Date().toISOString();
  const createdAt = validIsoOrNow(input.createdAt ?? now);
  const updatedAt = validIsoOrNow(input.updatedAt ?? now);
  const expiresAt = optionalIso(input.expiresAt);
  const purpose = normalizePurpose(input.purpose);
  const mode = normalizeMode(input.mode);
  const id = buildIntentId(input, purpose, mode, createdAt);
  const normalizedEvidence = normalizeEvidence(input.evidence, now);
  const requiredEvidence = requiredEvidenceGroups(input, purpose, mode);
  const missingEvidence = missingEvidenceGroups(requiredEvidence, normalizedEvidence.evidence);
  const errors = [...normalizedEvidence.errors];
  const warnings = [...normalizedEvidence.warnings];

  let status: AddressIntentStatus;
  if (expiresAt && Date.parse(expiresAt) <= Date.parse(now)) {
    status = 'expired';
    errors.push('address-intent-expired');
  } else if (input.rejectedReason) {
    status = 'rejected';
    errors.push(String(input.rejectedReason));
  } else if (hasPendingEvidence(normalizedEvidence.evidence)) {
    status = 'verifying';
  } else if (
    input.manualReviewRequired ||
    hasWarningEvidence(normalizedEvidence.evidence) ||
    hasFailedRequiredEvidence(requiredEvidence, normalizedEvidence.evidence) ||
    errors.length > 0
  ) {
    status = input.manualReviewApproved ? 'verified' : 'requires_review';
  } else if (missingEvidence.length > 0) {
    status = 'requires_input';
  } else {
    status = 'verified';
  }

  const nextAction = chooseNextAction(status, purpose, missingEvidence);
  return {
    modelVersion: ADDRESS_INTENT_MODEL_VERSION,
    id,
    status,
    purpose,
    mode,
    evidence: normalizedEvidence.evidence,
    requiredEvidence,
    missingEvidence,
    nextAction,
    createdAt,
    updatedAt,
    ...(expiresAt ? { expiresAt } : {}),
    errors: Array.from(new Set(errors)),
    warnings: Array.from(new Set(warnings)),
    privacy: privacyBoundary(),
  };
}

export function listAddressIntentCapabilities() {
  return {
    modelVersion: ADDRESS_INTENT_MODEL_VERSION,
    statuses: [...ADDRESS_INTENT_STATUSES],
    purposes: [...ADDRESS_INTENT_PURPOSES],
    modes: [...ADDRESS_INTENT_MODES],
    evidenceSources: [...ADDRESS_INTENT_EVIDENCE_SOURCES],
    nextActions: [...ADDRESS_INTENT_NEXT_ACTIONS],
    privacy: privacyBoundary(),
    stateMachine: {
      requires_input: 'Collect missing address, QR, recipient, registry, or proof evidence.',
      verifying: 'Wait for asynchronous verification evidence to settle.',
      requires_review: 'Operator or back-office review is needed before the intent can continue.',
      verified: 'The current purpose has enough public or commitment evidence to continue.',
      rejected: 'The intent is blocked by explicit rejection.',
      expired: 'The intent is outside its validity window.',
    },
  };
}

export function createInMemoryAddressIntentStore(): AddressIntentStore {
  const intents = new Map<string, AddressIntent>();

  return {
    create(input) {
      const intent = buildAddressIntent(input);
      intents.set(intent.id, intent);
      return intent;
    },

    get(intentId) {
      return intents.get(intentId.trim().toUpperCase());
    },

    update(intentId, patch) {
      const existing = intents.get(intentId.trim().toUpperCase());
      if (!existing) return undefined;
      const evidence = patch.appendEvidence
        ? [...existing.evidence, ...(patch.evidence ?? [])]
        : patch.evidence ?? existing.evidence;
      const updated = buildAddressIntent({
        ...existing,
        ...patch,
        id: existing.id,
        purpose: patch.purpose ?? existing.purpose,
        mode: patch.mode ?? existing.mode,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
        evidence,
      });
      intents.set(updated.id, updated);
      return updated;
    },

    listRecent(limit = 20) {
      return Array.from(intents.values())
        .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
        .slice(0, Math.max(1, Math.min(100, limit)));
    },
  };
}
