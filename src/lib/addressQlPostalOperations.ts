import { createHash } from 'node:crypto';

export const ADDRESSQL_POSTAL_OPERATIONS_INPUT_VERSION =
  'addressql-postal-operations-input-v1';
export const ADDRESSQL_POSTAL_OPERATIONS_REPORT_VERSION =
  'addressql-postal-operations-report-v1';

export type AddressQlPostalOperationalLevel = 'L2' | 'L3' | 'L4';
export type AddressQlPostalSourcePurpose =
  | 'postal-existence'
  | 'admin-locality-consistency'
  | 'delivery-area';

export type AddressQlPostalOperationsSource = {
  sourceId: string;
  countryCode: string;
  capabilityLevel: AddressQlPostalOperationalLevel;
  purpose: AddressQlPostalSourcePurpose;
  sourceVersion: string;
  releaseUrl: string;
  termsUrl: string;
  correctionUrl: string;
  retrievedAt: string;
  lastCheckedAt: string;
  validUntil: string;
  datasetDigest: string;
  holdoutDigest: string;
  reportDigest: string;
  adapterId: string;
  adapterMode: 'approved' | 'conformance';
  attestationVerified: boolean;
};

export type AddressQlCorrectionEvent = {
  correctionRef: string;
  countryCode: string;
  sourceId: string;
  receivedAt: string;
  publishedAt: string | null;
};

export type AddressQlPostalOperationsInput = {
  version: typeof ADDRESSQL_POSTAL_OPERATIONS_INPUT_VERSION;
  monitorIntervalHours: number;
  correctionSlaTargetHours: number;
  currentCountryLevels: Record<
    string,
    AddressQlPostalOperationalLevel | null
  >;
  sources: AddressQlPostalOperationsSource[];
  corrections: AddressQlCorrectionEvent[];
};

export type AddressQlPostalSourceMonitorState =
  | 'active'
  | 'check_due'
  | 'review_required'
  | 'expired'
  | 'invalid';

export type AddressQlPostalAdapterState =
  | 'active'
  | 'expired'
  | 'unverified'
  | 'conformance_only'
  | 'invalid';

export type AddressQlPostalSourceMonitorResult = {
  sourceId: string;
  countryCode: string;
  capabilityLevel: AddressQlPostalOperationalLevel;
  purpose: AddressQlPostalSourcePurpose;
  sourceVersion: string;
  correctionUrl: string;
  state: AddressQlPostalSourceMonitorState;
  adapterState: AddressQlPostalAdapterState;
  versionChanged: boolean;
  correctionRouteChanged: boolean;
  promotionEligible: boolean;
  hardBlocked: boolean;
  reasons: string[];
  lastCheckedAt: string;
  nextCheckAt: string | null;
  validUntil: string;
  adapterId: string;
};

export type AddressQlCorrectionSlaAggregate = {
  countryCode: string;
  sourceId: string | null;
  state: 'met' | 'breached' | 'insufficient';
  receivedCount: number;
  publishedCount: number;
  openCount: number;
  withinTargetCount: number;
  breachCount: number;
  p50Hours: number | null;
  p95Hours: number | null;
  maxHours: number | null;
  oldestOpenHours: number | null;
};

export type AddressQlCountryPromotionAction =
  | 'promotion_candidate'
  | 'demotion_required'
  | 'review_required'
  | 'hold'
  | 'blocked';

export type AddressQlCountryOperationsReport = {
  countryCode: string;
  currentLevel: AddressQlPostalOperationalLevel | null;
  recommendedLevel: AddressQlPostalOperationalLevel | null;
  highestOperationalLevel: AddressQlPostalOperationalLevel | null;
  highestPromotionEligibleLevel: AddressQlPostalOperationalLevel | null;
  action: AddressQlCountryPromotionAction;
  sourceIds: string[];
  reasons: string[];
};

export type AddressQlPostalOperationsReport = {
  version: typeof ADDRESSQL_POSTAL_OPERATIONS_REPORT_VERSION;
  generatedAt: string;
  inputVersion: typeof ADDRESSQL_POSTAL_OPERATIONS_INPUT_VERSION;
  reportDigest: string;
  sourceSummary: {
    total: number;
    active: number;
    checkDue: number;
    reviewRequired: number;
    expired: number;
    invalid: number;
    automaticallyDisabledAdapterIds: string[];
  };
  sources: AddressQlPostalSourceMonitorResult[];
  correctionSla: {
    targetHours: number;
    aggregate: AddressQlCorrectionSlaAggregate;
    byCountry: AddressQlCorrectionSlaAggregate[];
    bySource: AddressQlCorrectionSlaAggregate[];
  };
  countries: AddressQlCountryOperationsReport[];
  privacy: {
    containsRawAddress: false;
    containsRecipientData: false;
    containsPreciseCoordinates: false;
    containsCorrectionContent: false;
    containsQueryLogs: false;
    aggregateSlaOnly: true;
  };
  nonClaims: string[];
};

type PreviousSourceState = Pick<
  AddressQlPostalSourceMonitorResult,
  'sourceId' | 'sourceVersion' | 'correctionUrl'
>;

export type AddressQlPostalOperationsPreviousReport = {
  version: typeof ADDRESSQL_POSTAL_OPERATIONS_REPORT_VERSION;
  sources: PreviousSourceState[];
};

const INPUT_FIELDS = new Set([
  'version',
  'monitorIntervalHours',
  'correctionSlaTargetHours',
  'currentCountryLevels',
  'sources',
  'corrections',
]);
const SOURCE_FIELDS = new Set([
  'sourceId',
  'countryCode',
  'capabilityLevel',
  'purpose',
  'sourceVersion',
  'releaseUrl',
  'termsUrl',
  'correctionUrl',
  'retrievedAt',
  'lastCheckedAt',
  'validUntil',
  'datasetDigest',
  'holdoutDigest',
  'reportDigest',
  'adapterId',
  'adapterMode',
  'attestationVerified',
]);
const CORRECTION_FIELDS = new Set([
  'correctionRef',
  'countryCode',
  'sourceId',
  'receivedAt',
  'publishedAt',
]);
const COUNTRY_CODE = /^[A-Z]{2}$/;
const TECHNICAL_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/;
const VERSION = /^[A-Za-z0-9][A-Za-z0-9._:+/-]{0,127}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const PLACEHOLDER_VERSIONS = new Set([
  'current',
  'latest',
  'none',
  'unknown',
  'unversioned',
]);
const LEVELS: readonly AddressQlPostalOperationalLevel[] = [
  'L2',
  'L3',
  'L4',
];
const PURPOSES: readonly AddressQlPostalSourcePurpose[] = [
  'postal-existence',
  'admin-locality-consistency',
  'delivery-area',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertFields(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  label: string,
) {
  const unknown = Object.keys(value).filter(field => !allowed.has(field));
  if (unknown.length) {
    throw new Error(`${label} contains unsupported fields: ${unknown.sort().join(', ')}`);
  }
}

function requiredString(
  value: Record<string, unknown>,
  field: string,
  label: string,
) {
  const output = value[field];
  if (typeof output !== 'string' || !output.trim()) {
    throw new Error(`${label}.${field} must be a non-empty string`);
  }
  return output;
}

function boundedNumber(
  value: Record<string, unknown>,
  field: string,
  minimum: number,
  maximum: number,
) {
  const output = value[field];
  if (
    typeof output !== 'number'
    || !Number.isFinite(output)
    || output < minimum
    || output > maximum
  ) {
    throw new Error(`${field} must be between ${minimum} and ${maximum}`);
  }
  return output;
}

function parseSource(
  value: unknown,
  index: number,
): AddressQlPostalOperationsSource {
  const label = `postal operations sources[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertFields(value, SOURCE_FIELDS, label);
  const capabilityLevel = requiredString(value, 'capabilityLevel', label);
  const purpose = requiredString(value, 'purpose', label);
  const adapterMode = requiredString(value, 'adapterMode', label);
  if (!LEVELS.includes(capabilityLevel as AddressQlPostalOperationalLevel)) {
    throw new Error(`${label}.capabilityLevel must be L2, L3, or L4`);
  }
  if (!PURPOSES.includes(purpose as AddressQlPostalSourcePurpose)) {
    throw new Error(`${label}.purpose is invalid`);
  }
  if (!['approved', 'conformance'].includes(adapterMode)) {
    throw new Error(`${label}.adapterMode must be approved or conformance`);
  }
  if (typeof value.attestationVerified !== 'boolean') {
    throw new Error(`${label}.attestationVerified must be boolean`);
  }
  return {
    sourceId: requiredString(value, 'sourceId', label),
    countryCode: requiredString(value, 'countryCode', label).toUpperCase(),
    capabilityLevel:
      capabilityLevel as AddressQlPostalOperationalLevel,
    purpose: purpose as AddressQlPostalSourcePurpose,
    sourceVersion: requiredString(value, 'sourceVersion', label),
    releaseUrl: requiredString(value, 'releaseUrl', label),
    termsUrl: requiredString(value, 'termsUrl', label),
    correctionUrl: requiredString(value, 'correctionUrl', label),
    retrievedAt: requiredString(value, 'retrievedAt', label),
    lastCheckedAt: requiredString(value, 'lastCheckedAt', label),
    validUntil: requiredString(value, 'validUntil', label),
    datasetDigest: requiredString(value, 'datasetDigest', label),
    holdoutDigest: requiredString(value, 'holdoutDigest', label),
    reportDigest: requiredString(value, 'reportDigest', label),
    adapterId: requiredString(value, 'adapterId', label),
    adapterMode: adapterMode as 'approved' | 'conformance',
    attestationVerified: value.attestationVerified,
  };
}

function parseCorrection(
  value: unknown,
  index: number,
): AddressQlCorrectionEvent {
  const label = `postal operations corrections[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertFields(value, CORRECTION_FIELDS, label);
  if (value.publishedAt !== null && typeof value.publishedAt !== 'string') {
    throw new Error(`${label}.publishedAt must be a timestamp or null`);
  }
  return {
    correctionRef: requiredString(value, 'correctionRef', label),
    countryCode: requiredString(value, 'countryCode', label).toUpperCase(),
    sourceId: requiredString(value, 'sourceId', label),
    receivedAt: requiredString(value, 'receivedAt', label),
    publishedAt: typeof value.publishedAt === 'string'
      ? value.publishedAt
      : null,
  };
}

export function parseAddressQlPostalOperationsInput(
  value: unknown,
): AddressQlPostalOperationsInput {
  if (!isRecord(value)) throw new Error('postal operations input must be an object');
  assertFields(value, INPUT_FIELDS, 'postal operations input');
  if (value.version !== ADDRESSQL_POSTAL_OPERATIONS_INPUT_VERSION) {
    throw new Error(
      `postal operations input version must be ${ADDRESSQL_POSTAL_OPERATIONS_INPUT_VERSION}`,
    );
  }
  if (
    !Array.isArray(value.sources)
    || value.sources.length < 1
    || value.sources.length > 10_000
  ) {
    throw new Error('postal operations input requires 1-10000 sources');
  }
  if (!Array.isArray(value.corrections) || value.corrections.length > 100_000) {
    throw new Error('postal operations input supports at most 100000 corrections');
  }
  if (!isRecord(value.currentCountryLevels)) {
    throw new Error('postal operations currentCountryLevels must be an object');
  }
  const currentCountryLevels: AddressQlPostalOperationsInput['currentCountryLevels'] = {};
  for (const [countryCode, level] of Object.entries(value.currentCountryLevels)) {
    const normalized = countryCode.toUpperCase();
    if (!COUNTRY_CODE.test(normalized)) {
      throw new Error(`postal operations has invalid country level key ${countryCode}`);
    }
    if (level !== null && !LEVELS.includes(level as AddressQlPostalOperationalLevel)) {
      throw new Error(`postal operations has invalid current level for ${normalized}`);
    }
    currentCountryLevels[normalized] =
      level as AddressQlPostalOperationalLevel | null;
  }

  const sources = value.sources.map(parseSource);
  const corrections = value.corrections.map(parseCorrection);
  if (new Set(sources.map(source => source.sourceId)).size !== sources.length) {
    throw new Error('postal operations source ids must be unique');
  }
  if (
    new Set(corrections.map(event => event.correctionRef)).size
    !== corrections.length
  ) {
    throw new Error('postal operations correction refs must be unique');
  }
  return {
    version: ADDRESSQL_POSTAL_OPERATIONS_INPUT_VERSION,
    monitorIntervalHours: boundedNumber(
      value,
      'monitorIntervalHours',
      1,
      720,
    ),
    correctionSlaTargetHours: boundedNumber(
      value,
      'correctionSlaTargetHours',
      1,
      2_160,
    ),
    currentCountryLevels,
    sources,
    corrections,
  };
}

function exactTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    return null;
  }
  const output = Date.parse(value);
  return Number.isFinite(output) ? output : null;
}

function httpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values)].sort();
}

function roundHours(value: number) {
  return Number(value.toFixed(3));
}

function percentile(values: readonly number[], percentileValue: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(
    0,
    Math.ceil((percentileValue / 100) * sorted.length) - 1,
  );
  return roundHours(sorted[index]);
}

function previousSources(
  report?: AddressQlPostalOperationsPreviousReport,
) {
  if (!report) return new Map<string, PreviousSourceState>();
  if (report.version !== ADDRESSQL_POSTAL_OPERATIONS_REPORT_VERSION) {
    throw new Error('previous postal operations report version is unsupported');
  }
  return new Map(report.sources.map(source => [source.sourceId, source]));
}

function monitorSource(
  source: AddressQlPostalOperationsSource,
  intervalHours: number,
  now: number,
  previous?: PreviousSourceState,
): AddressQlPostalSourceMonitorResult {
  const reasons: string[] = [];
  const retrievedAt = exactTime(source.retrievedAt);
  const lastCheckedAt = exactTime(source.lastCheckedAt);
  const validUntil = exactTime(source.validUntil);
  const versionValid = (
    VERSION.test(source.sourceVersion)
    && !PLACEHOLDER_VERSIONS.has(source.sourceVersion.toLowerCase())
  );
  const purposeMatchesLevel = (
    (source.capabilityLevel === 'L2' && source.purpose === 'postal-existence')
    || (
      source.capabilityLevel === 'L3'
      && source.purpose === 'admin-locality-consistency'
    )
    || (source.capabilityLevel === 'L4' && source.purpose === 'delivery-area')
  );
  if (!COUNTRY_CODE.test(source.countryCode)) reasons.push('country-code-invalid');
  if (!TECHNICAL_ID.test(source.sourceId)) reasons.push('source-id-invalid');
  if (!TECHNICAL_ID.test(source.adapterId)) reasons.push('adapter-id-invalid');
  if (!versionValid) reasons.push('source-version-invalid');
  if (!purposeMatchesLevel) reasons.push('capability-purpose-mismatch');
  if (!httpsUrl(source.releaseUrl)) reasons.push('release-url-invalid');
  if (!httpsUrl(source.termsUrl)) reasons.push('terms-url-invalid');
  if (!httpsUrl(source.correctionUrl)) reasons.push('correction-url-invalid');
  if (
    !DIGEST.test(source.datasetDigest)
    || !DIGEST.test(source.holdoutDigest)
    || !DIGEST.test(source.reportDigest)
  ) {
    reasons.push('evidence-digest-invalid');
  }
  if (
    retrievedAt === null
    || lastCheckedAt === null
    || validUntil === null
    || validUntil <= retrievedAt
    || lastCheckedAt < retrievedAt
    || lastCheckedAt > now + 5 * 60_000
  ) {
    reasons.push('source-time-window-invalid');
  }
  const versionChanged = Boolean(
    previous && previous.sourceVersion !== source.sourceVersion,
  );
  const correctionRouteChanged = Boolean(
    previous && previous.correctionUrl !== source.correctionUrl,
  );
  if (versionChanged) reasons.push('source-version-changed');
  if (correctionRouteChanged) reasons.push('correction-route-changed');
  const nextCheckAt = lastCheckedAt === null
    ? null
    : lastCheckedAt + intervalHours * 3_600_000;
  const expired = validUntil !== null && validUntil <= now;
  const checkDue = nextCheckAt !== null && nextCheckAt <= now;
  if (expired) reasons.push('source-expired');
  if (checkDue) reasons.push('monitor-check-due');

  let adapterState: AddressQlPostalAdapterState = 'active';
  if (reasons.some(reason => reason.endsWith('-invalid') || reason.includes('mismatch'))) {
    adapterState = 'invalid';
  } else if (expired) {
    adapterState = 'expired';
  } else if (source.adapterMode === 'conformance') {
    adapterState = 'conformance_only';
    reasons.push('adapter-conformance-only');
  } else if (!source.attestationVerified) {
    adapterState = 'unverified';
    reasons.push('adapter-attestation-unverified');
  }

  let state: AddressQlPostalSourceMonitorState = 'active';
  if (adapterState === 'invalid') {
    state = 'invalid';
  } else if (expired) {
    state = 'expired';
  } else if (versionChanged || correctionRouteChanged) {
    state = 'review_required';
  } else if (checkDue) {
    state = 'check_due';
  }
  const hardBlocked = ['invalid', 'expired', 'unverified', 'conformance_only']
    .includes(adapterState);

  return {
    sourceId: source.sourceId,
    countryCode: source.countryCode,
    capabilityLevel: source.capabilityLevel,
    purpose: source.purpose,
    sourceVersion: source.sourceVersion,
    correctionUrl: source.correctionUrl,
    state,
    adapterState,
    versionChanged,
    correctionRouteChanged,
    promotionEligible: state === 'active' && adapterState === 'active',
    hardBlocked,
    reasons: uniqueSorted(reasons),
    lastCheckedAt: source.lastCheckedAt,
    nextCheckAt: nextCheckAt === null
      ? null
      : new Date(nextCheckAt).toISOString(),
    validUntil: source.validUntil,
    adapterId: source.adapterId,
  };
}

function aggregateCorrections(
  events: readonly AddressQlCorrectionEvent[],
  targetHours: number,
  now: number,
  countryCode: string,
  sourceId: string | null,
): AddressQlCorrectionSlaAggregate {
  const durations: number[] = [];
  let openCount = 0;
  let oldestOpenHours: number | null = null;
  let openBreaches = 0;

  for (const event of events) {
    if (!COUNTRY_CODE.test(event.countryCode)) {
      throw new Error(`correction ${event.correctionRef} has an invalid country`);
    }
    if (!TECHNICAL_ID.test(event.sourceId) || !DIGEST.test(event.correctionRef)) {
      throw new Error('correction event identifiers must be bounded technical references');
    }
    const receivedAt = exactTime(event.receivedAt);
    const publishedAt = event.publishedAt === null
      ? null
      : exactTime(event.publishedAt);
    if (
      receivedAt === null
      || receivedAt > now + 5 * 60_000
      || (event.publishedAt !== null && publishedAt === null)
      || (publishedAt !== null && (publishedAt < receivedAt || publishedAt > now))
    ) {
      throw new Error(`correction ${event.correctionRef} has an invalid time window`);
    }
    if (publishedAt === null) {
      openCount += 1;
      const age = roundHours((now - receivedAt) / 3_600_000);
      oldestOpenHours = oldestOpenHours === null
        ? age
        : Math.max(oldestOpenHours, age);
      if (age > targetHours) openBreaches += 1;
    } else {
      durations.push(roundHours((publishedAt - receivedAt) / 3_600_000));
    }
  }

  const publishedBreaches = durations.filter(value => value > targetHours).length;
  const breachCount = publishedBreaches + openBreaches;
  const withinTargetCount = durations.filter(value => value <= targetHours).length;
  return {
    countryCode,
    sourceId,
    state: breachCount > 0
      ? 'breached'
      : events.length && durations.length
        ? 'met'
        : 'insufficient',
    receivedCount: events.length,
    publishedCount: durations.length,
    openCount,
    withinTargetCount,
    breachCount,
    p50Hours: percentile(durations, 50),
    p95Hours: percentile(durations, 95),
    maxHours: durations.length ? Math.max(...durations) : null,
    oldestOpenHours,
  };
}

function levelRank(level: AddressQlPostalOperationalLevel | null) {
  return level === null ? 0 : Number(level.slice(1));
}

function highestLevel(
  levels: readonly AddressQlPostalOperationalLevel[],
) {
  return levels.length
    ? [...levels].sort((left, right) => levelRank(left) - levelRank(right)).at(-1)!
    : null;
}

function highestContiguousLevel(
  levels: readonly AddressQlPostalOperationalLevel[],
) {
  const available = new Set(levels);
  let highest: AddressQlPostalOperationalLevel | null = null;
  for (const level of LEVELS) {
    if (!available.has(level)) break;
    highest = level;
  }
  return highest;
}

function buildCountryReport(input: {
  countryCode: string;
  currentLevel: AddressQlPostalOperationalLevel | null;
  sources: AddressQlPostalSourceMonitorResult[];
  correctionSla: AddressQlCorrectionSlaAggregate;
  sourceSlas: AddressQlCorrectionSlaAggregate[];
}): AddressQlCountryOperationsReport {
  const sourceIds = input.sources.map(source => source.sourceId).sort();
  const hardBlocked = input.sources.filter(source => source.hardBlocked);
  const operational = input.sources.filter(source => !source.hardBlocked);
  const operationalLevels = operational.map(source => source.capabilityLevel);
  const promotionEligibleSources = input.sources.filter(source =>
    source.promotionEligible
    && input.sourceSlas.some(sla =>
      sla.sourceId === source.sourceId && sla.state === 'met'));
  const promotionEligibleLevels = input.sources
    .filter(source => promotionEligibleSources.includes(source))
    .map(source => source.capabilityLevel);
  const highestAvailableOperationalLevel = highestLevel(operationalLevels);
  const highestAvailablePromotionLevel = highestLevel(promotionEligibleLevels);
  const highestOperationalLevel = input.correctionSla.state === 'breached'
    ? null
    : highestContiguousLevel(operationalLevels);
  const highestPromotionEligibleLevel = input.correctionSla.state === 'met'
    ? highestContiguousLevel(promotionEligibleLevels)
    : null;
  const reviewRequired = input.sources.some(source =>
    source.state === 'check_due' || source.state === 'review_required');
  const reasons = [
    ...hardBlocked.map(source =>
      `source:${source.sourceId}:${source.adapterState}`),
    ...(input.correctionSla.state === 'breached'
      ? ['correction-sla:breached']
      : input.correctionSla.state === 'insufficient'
        ? ['correction-sla:insufficient']
        : []),
    ...(
      highestAvailableOperationalLevel !== highestOperationalLevel
      || (
        input.correctionSla.state === 'met'
        && highestAvailablePromotionLevel !== highestPromotionEligibleLevel
      )
        ? ['evidence-hierarchy-incomplete']
        : []
    ),
    ...input.sources
      .filter(source =>
        source.state === 'check_due' || source.state === 'review_required')
      .map(source => `source:${source.sourceId}:${source.state}`),
    ...input.sourceSlas
      .filter(sla => sla.state !== 'met')
      .map(sla => `source:${sla.sourceId}:correction-sla:${sla.state}`),
  ];

  let action: AddressQlCountryPromotionAction = 'blocked';
  let recommendedLevel: AddressQlPostalOperationalLevel | null = null;
  if (
    levelRank(input.currentLevel) > levelRank(highestOperationalLevel)
    || (input.currentLevel !== null && input.correctionSla.state === 'breached')
  ) {
    action = 'demotion_required';
    recommendedLevel = highestOperationalLevel;
  } else if (
    levelRank(highestPromotionEligibleLevel) > levelRank(input.currentLevel)
  ) {
    action = 'promotion_candidate';
    recommendedLevel = highestPromotionEligibleLevel;
  } else if (reviewRequired) {
    action = 'review_required';
    recommendedLevel = input.currentLevel;
  } else if (input.currentLevel !== null) {
    action = 'hold';
    recommendedLevel = input.currentLevel;
  }

  return {
    countryCode: input.countryCode,
    currentLevel: input.currentLevel,
    recommendedLevel,
    highestOperationalLevel,
    highestPromotionEligibleLevel,
    action,
    sourceIds,
    reasons: uniqueSorted(reasons),
  };
}

export function buildAddressQlPostalOperationsReport(
  input: AddressQlPostalOperationsInput,
  options: {
    now?: string | number | Date;
    previous?: AddressQlPostalOperationsPreviousReport;
  } = {},
): AddressQlPostalOperationsReport {
  const now = new Date(options.now ?? Date.now()).getTime();
  if (!Number.isFinite(now)) throw new Error('postal operations time is invalid');
  const generatedAt = new Date(now).toISOString();
  const previous = previousSources(options.previous);
  const sources = input.sources
    .map(source => monitorSource(
      source,
      input.monitorIntervalHours,
      now,
      previous.get(source.sourceId),
    ))
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId));
  const sourceCountries = new Map(
    input.sources.map(source => [source.sourceId, source.countryCode]),
  );
  for (const event of input.corrections) {
    const sourceCountry = sourceCountries.get(event.sourceId);
    if (!sourceCountry) {
      throw new Error(`correction ${event.correctionRef} references an unknown source`);
    }
    if (sourceCountry !== event.countryCode) {
      throw new Error(`correction ${event.correctionRef} does not match its source country`);
    }
  }

  const countryCodes = uniqueSorted([
    ...sources.map(source => source.countryCode),
    ...Object.keys(input.currentCountryLevels),
  ]);
  const byCountry = countryCodes.map(countryCode =>
    aggregateCorrections(
      input.corrections.filter(event => event.countryCode === countryCode),
      input.correctionSlaTargetHours,
      now,
      countryCode,
      null,
    ));
  const bySource = sources.map(source =>
    aggregateCorrections(
      input.corrections.filter(event => event.sourceId === source.sourceId),
      input.correctionSlaTargetHours,
      now,
      source.countryCode,
      source.sourceId,
    ));
  const aggregate = aggregateCorrections(
    input.corrections,
    input.correctionSlaTargetHours,
    now,
    '*',
    null,
  );
  const countries = countryCodes.map(countryCode =>
    buildCountryReport({
      countryCode,
      currentLevel: input.currentCountryLevels[countryCode] ?? null,
      sources: sources.filter(source => source.countryCode === countryCode),
      correctionSla: byCountry.find(item => item.countryCode === countryCode)!,
      sourceSlas: bySource.filter(item => item.countryCode === countryCode),
    }));
  const unsigned: Omit<AddressQlPostalOperationsReport, 'reportDigest'> = {
    version: ADDRESSQL_POSTAL_OPERATIONS_REPORT_VERSION,
    generatedAt,
    inputVersion: ADDRESSQL_POSTAL_OPERATIONS_INPUT_VERSION,
    sourceSummary: {
      total: sources.length,
      active: sources.filter(source => source.state === 'active').length,
      checkDue: sources.filter(source => source.state === 'check_due').length,
      reviewRequired:
        sources.filter(source => source.state === 'review_required').length,
      expired: sources.filter(source => source.state === 'expired').length,
      invalid: sources.filter(source => source.state === 'invalid').length,
      automaticallyDisabledAdapterIds: uniqueSorted(
        sources
          .filter(source => source.hardBlocked)
          .map(source => source.adapterId),
      ),
    },
    sources,
    correctionSla: {
      targetHours: input.correctionSlaTargetHours,
      aggregate,
      byCountry,
      bySource,
    },
    countries,
    privacy: {
      containsRawAddress: false as const,
      containsRecipientData: false as const,
      containsPreciseCoordinates: false as const,
      containsCorrectionContent: false as const,
      containsQueryLogs: false as const,
      aggregateSlaOnly: true as const,
    },
    nonClaims: [
      'This report recommends review actions and never enables a country capability.',
      'A declared HTTPS correction route is not proof that the remote endpoint is available.',
      'Correction SLA aggregates contain timestamps only and do not contain correction content.',
      'Postal-source readiness does not prove address existence, delivery, identity, or residence.',
    ],
  };
  return {
    ...unsigned,
    reportDigest: `sha256:${createHash('sha256')
      .update(JSON.stringify(unsigned), 'utf8')
      .digest('hex')}`,
  };
}

export function validateAddressQlPostalOperationsReport(
  report: AddressQlPostalOperationsReport,
) {
  const errors: string[] = [];
  if (report.version !== ADDRESSQL_POSTAL_OPERATIONS_REPORT_VERSION) {
    errors.push('report-version');
  }
  if (!DIGEST.test(report.reportDigest)) errors.push('report-digest');
  const { reportDigest: _digest, ...unsigned } = report;
  const expectedDigest = `sha256:${createHash('sha256')
    .update(JSON.stringify(unsigned), 'utf8')
    .digest('hex')}`;
  if (report.reportDigest !== expectedDigest) errors.push('report-digest-mismatch');
  if (report.sourceSummary.total !== report.sources.length) {
    errors.push('source-summary-total');
  }
  if (
    report.privacy.containsRawAddress
    || report.privacy.containsRecipientData
    || report.privacy.containsPreciseCoordinates
    || report.privacy.containsCorrectionContent
    || report.privacy.containsQueryLogs
    || !report.privacy.aggregateSlaOnly
  ) {
    errors.push('privacy-boundary');
  }
  for (const country of report.countries) {
    if (
      country.action === 'promotion_candidate'
      && country.highestPromotionEligibleLevel === null
    ) {
      errors.push(`${country.countryCode}:promotion-without-eligible-level`);
    }
    if (
      country.action === 'demotion_required'
      && levelRank(country.recommendedLevel) >= levelRank(country.currentLevel)
    ) {
      errors.push(`${country.countryCode}:invalid-demotion`);
    }
  }
  return uniqueSorted(errors);
}
