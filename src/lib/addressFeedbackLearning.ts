import type { AddressDetails } from '../types/address';

export type AddressFeedbackIssue =
  | 'wrong-address'
  | 'missing-field'
  | 'wrong-language'
  | 'wrong-script'
  | 'bad-order'
  | 'postal-code'
  | 'building-or-poi'
  | 'address-defect'
  | 'undeliverable-region'
  | 'po-box'
  | 'auto-lock'
  | 'unreachable'
  | 'translation'
  | 'other';

export type AddressFeedbackAction =
  | 'boost-current-language'
  | 'prefer-english-shipping'
  | 'boost-postal-evidence'
  | 'boost-map-feature'
  | 'penalize-current-display'
  | 'queue-reverification'
  | 'record-carrier-rejection'
  | 'update-deliverability-policy'
  | 'require-manual-review';

export type AddressFeedbackSource = 'agid-panel' | 'address-registration' | 'pos-terminal' | 'api';

export type AddressFeedbackPrivateMode = 'closed-local';

export type AddressFeedbackContext = {
  hasPostcode: boolean;
  hasStreet: boolean;
  hasBuilding: boolean;
  isSea: boolean;
  undeliverableRegion?: boolean;
  poBox?: boolean;
  autoLock?: boolean;
  unreachableAccess?: boolean;
  carrierRejected?: boolean;
  carrierId?: string;
  qualityDecision?: string;
  qualityScore?: number;
  sourceIds: string[];
};

export type AddressFeedbackRecord = {
  id: string;
  kind: 'address-display-feedback';
  createdAt: string;
  source: AddressFeedbackSource;
  agidTail?: string;
  countryCode?: string;
  languageTab?: string;
  originalDisplay: string;
  correctedDisplay?: string;
  issue: AddressFeedbackIssue;
  severity: 1 | 2 | 3;
  userNote?: string;
  consentForLocalLearning: boolean;
  privateMode: AddressFeedbackPrivateMode;
  context: AddressFeedbackContext;
};

export type AddressFeedbackActionScore = {
  action: AddressFeedbackAction;
  score: number;
  reason: string;
};

export type AddressFeedbackModel = {
  version: 'address-feedback-bandit-v1';
  updatedAt: string;
  samples: number;
  learningRate: number;
  weights: Record<string, number>;
  actionValues: Record<AddressFeedbackAction, { rewardMean: number; count: number }>;
  fieldReliability: Record<string, number>;
};

export type AddressFeedbackSummary = {
  modelVersion: AddressFeedbackModel['version'];
  samples: number;
  topActions: AddressFeedbackActionScore[];
  privacy: 'closed-device-local';
};

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export const ADDRESS_FEEDBACK_RECORDS_STORAGE_KEY = 'agid_address_display_feedback_records';
export const ADDRESS_FEEDBACK_MODEL_STORAGE_KEY = 'agid_address_display_feedback_model';

const ALL_ACTIONS: AddressFeedbackAction[] = [
  'boost-current-language',
  'prefer-english-shipping',
  'boost-postal-evidence',
  'boost-map-feature',
  'penalize-current-display',
  'queue-reverification',
  'record-carrier-rejection',
  'update-deliverability-policy',
  'require-manual-review',
];

const PRIVATE_FIELD_KEYS = new Set(['recipient', 'phone', 'telephone', 'email', 'name']);

function clean(value: unknown) {
  return String(value ?? '').trim();
}

function compactCode(value: unknown) {
  return clean(value).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

function normalizeCountryCode(value: unknown) {
  const code = compactCode(value);
  return /^[A-Z]{2}$/.test(code) ? code : undefined;
}

function agidTail(value: unknown) {
  const token = compactCode(value);
  return token ? token.slice(-8) : undefined;
}

function boundedSeverity(value: unknown): 1 | 2 | 3 {
  const severity = Number(value);
  if (severity >= 3) return 3;
  if (severity >= 2) return 2;
  return 1;
}

function normalizeSourceIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.map(value => clean(value)).filter(Boolean))).slice(0, 12);
}

function normalizeIssue(value: unknown): AddressFeedbackIssue {
  const issue = clean(value) as AddressFeedbackIssue;
  const allowed: AddressFeedbackIssue[] = [
    'wrong-address',
    'missing-field',
    'wrong-language',
    'wrong-script',
    'bad-order',
    'postal-code',
    'building-or-poi',
    'address-defect',
    'undeliverable-region',
    'po-box',
    'auto-lock',
    'unreachable',
    'translation',
    'other',
  ];
  return allowed.includes(issue) ? issue : 'other';
}

function createRecordId(now: Date) {
  const timestamp = Date.parse(now.toISOString()).toString(36);
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `adf_${timestamp}_${random}`;
}

function hasText(details: AddressDetails | null | undefined, keys: string[]) {
  if (!details) return false;
  return keys.some(key => clean(details[key]).length > 0);
}

function detectPrivateText(value: string) {
  const text = value.toLowerCase();
  if (/@/.test(text)) return true;
  if (/\+?\d[\d\s().-]{7,}\d/.test(text)) return true;
  return false;
}

export function createAddressFeedbackContext(options: {
  details?: AddressDetails | null;
  isSea?: boolean;
  undeliverableRegion?: boolean;
  poBox?: boolean;
  autoLock?: boolean;
  unreachableAccess?: boolean;
  carrierRejected?: boolean;
  carrierId?: string;
  qualityDecision?: string;
  qualityScore?: number;
  sourceIds?: string[];
}): AddressFeedbackContext {
  const details = options.details || null;
  const score = typeof options.qualityScore === 'number' && Number.isFinite(options.qualityScore)
    ? Math.max(0, Math.min(1, options.qualityScore))
    : undefined;

  return {
    hasPostcode: hasText(details, ['postcode', 'postalCode', 'zip', 'postal_code']),
    hasStreet: hasText(details, ['road', 'street', 'street_name', 'house_number', 'houseNumber']),
    hasBuilding: hasText(details, ['building', 'building_name', 'amenity', 'shop', 'tourism', 'name']),
    isSea: Boolean(options.isSea),
    undeliverableRegion: Boolean(options.undeliverableRegion),
    poBox: Boolean(options.poBox),
    autoLock: Boolean(options.autoLock),
    unreachableAccess: Boolean(options.unreachableAccess),
    carrierRejected: Boolean(options.carrierRejected),
    carrierId: compactCode(options.carrierId) || undefined,
    qualityDecision: clean(options.qualityDecision) || undefined,
    qualityScore: score,
    sourceIds: normalizeSourceIds(options.sourceIds),
  };
}

export function createAddressFeedbackDraftFromDisplay(options: {
  agid?: string;
  countryCode?: string;
  languageTab?: string;
  originalDisplay: string;
  details?: AddressDetails | null;
  isSea?: boolean;
  qualityDecision?: string;
  qualityScore?: number;
  undeliverableRegion?: boolean;
  poBox?: boolean;
  autoLock?: boolean;
  unreachableAccess?: boolean;
  carrierRejected?: boolean;
  carrierId?: string;
  sourceIds?: string[];
}) {
  return {
    agidTail: agidTail(options.agid),
    countryCode: normalizeCountryCode(options.countryCode),
    languageTab: clean(options.languageTab) || undefined,
    originalDisplay: clean(options.originalDisplay),
    context: createAddressFeedbackContext({
      details: options.details,
      isSea: options.isSea,
      undeliverableRegion: options.undeliverableRegion,
      poBox: options.poBox,
      autoLock: options.autoLock,
      unreachableAccess: options.unreachableAccess,
      carrierRejected: options.carrierRejected,
      carrierId: options.carrierId,
      qualityDecision: options.qualityDecision,
      qualityScore: options.qualityScore,
      sourceIds: options.sourceIds,
    }),
  };
}

export function createAddressFeedbackRecord(options: {
  source: AddressFeedbackSource;
  agid?: string;
  countryCode?: string;
  languageTab?: string;
  originalDisplay: string;
  correctedDisplay?: string;
  issue: AddressFeedbackIssue;
  severity?: 1 | 2 | 3;
  userNote?: string;
  consentForLocalLearning?: boolean;
  context?: AddressFeedbackContext;
  now?: Date;
}): AddressFeedbackRecord {
  const now = options.now || new Date();
  const originalDisplay = clean(options.originalDisplay);
  const correctedDisplay = clean(options.correctedDisplay);
  const userNote = clean(options.userNote);
  const context = options.context || createAddressFeedbackContext({});

  return {
    id: createRecordId(now),
    kind: 'address-display-feedback',
    createdAt: now.toISOString(),
    source: options.source,
    agidTail: agidTail(options.agid),
    countryCode: normalizeCountryCode(options.countryCode),
    languageTab: clean(options.languageTab) || undefined,
    originalDisplay,
    correctedDisplay: correctedDisplay || undefined,
    issue: normalizeIssue(options.issue),
    severity: boundedSeverity(options.severity),
    userNote: userNote && !detectPrivateText(userNote) ? userNote.slice(0, 280) : undefined,
    consentForLocalLearning: options.consentForLocalLearning !== false,
    privateMode: 'closed-local',
    context: {
      ...context,
      sourceIds: normalizeSourceIds(context.sourceIds),
    },
  };
}

export function createInitialAddressFeedbackModel(now: Date = new Date()): AddressFeedbackModel {
  return {
    version: 'address-feedback-bandit-v1',
    updatedAt: now.toISOString(),
    samples: 0,
    learningRate: 0.18,
    weights: {},
    actionValues: Object.fromEntries(
      ALL_ACTIONS.map(action => [action, { rewardMean: 0, count: 0 }]),
    ) as AddressFeedbackModel['actionValues'],
    fieldReliability: {
      postcode: 0.5,
      street: 0.5,
      building: 0.5,
      language: 0.5,
      deliverability: 0.5,
      access: 0.5,
    },
  };
}

export function deriveAddressFeedbackReward(record: AddressFeedbackRecord) {
  const issuePenalty = record.issue === 'other' ? 0.2 : 0.42;
  const correctionBonus = record.correctedDisplay ? 0.25 : 0;
  const severityPenalty = record.severity * 0.12;
  return Math.max(-1, Math.min(1, correctionBonus - issuePenalty - severityPenalty));
}

function featuresFor(record: AddressFeedbackRecord) {
  return [
    `issue:${record.issue}`,
    record.countryCode ? `country:${record.countryCode}` : '',
    record.languageTab ? `lang:${record.languageTab}` : '',
    record.context.hasPostcode ? 'field:postcode' : 'missing:postcode',
    record.context.hasStreet ? 'field:street' : 'missing:street',
    record.context.hasBuilding ? 'field:building' : 'missing:building',
    record.context.isSea ? 'surface:sea' : 'surface:land',
    record.context.undeliverableRegion ? 'deliverability:undeliverable-region' : '',
    record.context.poBox ? 'access:po-box' : '',
    record.context.autoLock ? 'access:auto-lock' : '',
    record.context.unreachableAccess ? 'access:unreachable' : '',
    record.context.carrierRejected ? 'carrier:rejected' : '',
    record.context.carrierId ? `carrier:${record.context.carrierId}` : '',
    record.context.qualityDecision ? `quality:${record.context.qualityDecision}` : '',
    `source:${record.source}`,
  ].filter(Boolean);
}

function actionHints(record: AddressFeedbackRecord): AddressFeedbackAction[] {
  if (record.issue === 'address-defect') return ['queue-reverification', 'require-manual-review'];
  if (record.issue === 'undeliverable-region') {
    return ['record-carrier-rejection', 'update-deliverability-policy', 'require-manual-review'];
  }
  if (record.issue === 'po-box' || record.issue === 'auto-lock' || record.issue === 'unreachable') {
    return ['record-carrier-rejection', 'update-deliverability-policy', 'require-manual-review'];
  }
  if (record.issue === 'postal-code') return ['boost-postal-evidence', 'queue-reverification'];
  if (record.issue === 'building-or-poi') return ['boost-map-feature', 'require-manual-review'];
  if (record.issue === 'wrong-language' || record.issue === 'wrong-script') {
    return ['boost-current-language', 'queue-reverification'];
  }
  if (record.issue === 'translation' || record.issue === 'bad-order') {
    return ['prefer-english-shipping', 'boost-current-language'];
  }
  if (record.issue === 'missing-field') return ['queue-reverification', 'require-manual-review'];
  return ['penalize-current-display', 'queue-reverification'];
}

export function updateAddressFeedbackModel(
  model: AddressFeedbackModel,
  record: AddressFeedbackRecord,
  now: Date = new Date(),
): AddressFeedbackModel {
  if (!record.consentForLocalLearning) {
    return { ...model, updatedAt: now.toISOString() };
  }

  const reward = deriveAddressFeedbackReward(record);
  const weights = { ...model.weights };
  for (const feature of featuresFor(record)) {
    weights[feature] = (weights[feature] || 0) + model.learningRate * reward;
  }

  const actionValues = { ...model.actionValues };
  for (const action of actionHints(record)) {
    const current = actionValues[action] || { rewardMean: 0, count: 0 };
    const count = current.count + 1;
    actionValues[action] = {
      count,
      rewardMean: current.rewardMean + (reward - current.rewardMean) / count,
    };
  }

  const fieldReliability = { ...model.fieldReliability };
  const fieldPenalty = Math.min(0.18, record.severity * 0.04);
  if (record.issue === 'postal-code') fieldReliability.postcode = Math.max(0, fieldReliability.postcode - fieldPenalty);
  if (record.issue === 'missing-field') fieldReliability.street = Math.max(0, fieldReliability.street - fieldPenalty);
  if (record.issue === 'building-or-poi') fieldReliability.building = Math.max(0, fieldReliability.building - fieldPenalty);
  if (record.issue === 'address-defect' || record.issue === 'undeliverable-region') {
    fieldReliability.deliverability = Math.max(0, (fieldReliability.deliverability ?? 0.5) - fieldPenalty);
  }
  if (record.issue === 'po-box' || record.issue === 'auto-lock' || record.issue === 'unreachable') {
    fieldReliability.access = Math.max(0, (fieldReliability.access ?? 0.5) - fieldPenalty);
  }
  if (record.issue === 'wrong-language' || record.issue === 'wrong-script' || record.issue === 'translation') {
    fieldReliability.language = Math.max(0, fieldReliability.language - fieldPenalty);
  }

  return {
    ...model,
    updatedAt: now.toISOString(),
    samples: model.samples + 1,
    weights,
    actionValues,
    fieldReliability,
  };
}

export function recommendAddressFeedbackActions(
  record: AddressFeedbackRecord,
  model: AddressFeedbackModel = createInitialAddressFeedbackModel(),
): AddressFeedbackActionScore[] {
  const hinted = new Set(actionHints(record));
  const featureWeight = featuresFor(record).reduce((total, feature) => total + (model.weights[feature] || 0), 0);

  return ALL_ACTIONS
    .map(action => {
      const value = model.actionValues[action] || { rewardMean: 0, count: 0 };
      const hintBonus = hinted.has(action) ? 0.8 : 0;
      const explorationBonus = value.count === 0 ? 0.18 : Math.min(0.16, 1 / Math.sqrt(value.count + 1));
      const score = hintBonus + explorationBonus - value.rewardMean + Math.abs(featureWeight) * 0.05;
      return {
        action,
        score,
        reason: describeAddressFeedbackAction(action, record),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

export function describeAddressFeedbackAction(action: AddressFeedbackAction, record?: AddressFeedbackRecord) {
  if (action === 'boost-current-language') return 'Prefer the selected language tab when the corrected display confirms it.';
  if (action === 'prefer-english-shipping') return 'Use international shipping English when local ordering or translation is unstable.';
  if (action === 'boost-postal-evidence') return 'Increase postal-source priority for this country or postcode pattern.';
  if (action === 'boost-map-feature') return 'Use named map features such as buildings, parks, lakes, roads, and POIs as stronger evidence.';
  if (action === 'penalize-current-display') return 'Lower confidence for the current rendered string in similar contexts.';
  if (action === 'queue-reverification') return `Queue re-verification${record?.countryCode ? ` for ${record.countryCode}` : ''}.`;
  if (action === 'record-carrier-rejection') return 'Record the carrier refusal reason as a local, non-address signal for later review.';
  if (action === 'update-deliverability-policy') return 'Update carrier deliverability and access policy for similar safe contexts.';
  return 'Require operator review before accepting this address display.';
}

function readJson<T>(storage: StorageLike | undefined, key: string, fallback: T): T {
  if (!storage) return fallback;
  try {
    const parsed = JSON.parse(storage.getItem(key) || '');
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function currentStorage(): StorageLike | undefined {
  return typeof window === 'undefined' ? undefined : window.localStorage;
}

export function loadAddressFeedbackRecords(
  storage: StorageLike | undefined = currentStorage(),
): AddressFeedbackRecord[] {
  const parsed = readJson<unknown>(storage, ADDRESS_FEEDBACK_RECORDS_STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed.filter(record => record?.kind === 'address-display-feedback') as AddressFeedbackRecord[] : [];
}

export function loadAddressFeedbackModel(
  storage: StorageLike | undefined = currentStorage(),
): AddressFeedbackModel {
  const parsed = readJson<AddressFeedbackModel | null>(storage, ADDRESS_FEEDBACK_MODEL_STORAGE_KEY, null);
  return parsed?.version === 'address-feedback-bandit-v1' ? parsed : createInitialAddressFeedbackModel();
}

export function appendAddressFeedbackRecord(
  record: AddressFeedbackRecord,
  storage: StorageLike | undefined = currentStorage(),
  limit = 300,
): AddressFeedbackSummary {
  const records = loadAddressFeedbackRecords(storage);
  records.push(record);

  const model = updateAddressFeedbackModel(loadAddressFeedbackModel(storage), record);
  if (storage) {
    storage.setItem(ADDRESS_FEEDBACK_RECORDS_STORAGE_KEY, JSON.stringify(records.slice(-limit)));
    storage.setItem(ADDRESS_FEEDBACK_MODEL_STORAGE_KEY, JSON.stringify(model));
  }

  return {
    modelVersion: model.version,
    samples: model.samples,
    topActions: recommendAddressFeedbackActions(record, model),
    privacy: 'closed-device-local',
  };
}

export function summarizeAddressFeedbackLearning(
  storage: StorageLike | undefined = currentStorage(),
): AddressFeedbackSummary {
  const records = loadAddressFeedbackRecords(storage);
  const model = loadAddressFeedbackModel(storage);
  const lastRecord = records[records.length - 1];
  const fallback = createAddressFeedbackRecord({
    source: 'agid-panel',
    originalDisplay: '',
    issue: 'other',
    consentForLocalLearning: false,
  });
  return {
    modelVersion: model.version,
    samples: model.samples,
    topActions: recommendAddressFeedbackActions(lastRecord || fallback, model),
    privacy: 'closed-device-local',
  };
}

export function stripPrivateAddressFeedbackFields<T extends Record<string, unknown>>(record: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => !PRIVATE_FIELD_KEYS.has(key)),
  ) as Partial<T>;
}
