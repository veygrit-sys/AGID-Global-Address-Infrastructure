export const POSTAL_SOURCE_PROMOTION_GATE_VERSION = 'postal-source-promotion-gate-v1';

export type PostalSourceKind = 'official' | 'open-source' | 'agid-derived';
export type PostalSourceRightsStatus = 'approved' | 'pending' | 'unknown' | 'prohibited';
export type PostalSourceCoverageLevel = 'metadata-only' | 'format' | 'lookup';
export type PostalSourcePromotionLevel =
  | 'blocked'
  | 'candidate-only'
  | 'evidence-backed-lookup';

export type PostalSourceEvidenceRecord = {
  countryCode: string;
  sourceId: string;
  sourceKind: PostalSourceKind;
  sourceUrl: string;
  sourceVersion: string;
  retrievedAt: string;
  maxAgeDays: number;
  contentDigest: string;
  rights: {
    status: PostalSourceRightsStatus;
    termsUrl: string;
    verifiedAt: string;
  };
  coverage: {
    level: PostalSourceCoverageLevel;
    scope: string;
    administrativeKeyLevels: string[];
  };
  correctionPath: string;
};

export type PostalSourcePromotionReason =
  | 'country-code-invalid'
  | 'source-id-missing'
  | 'source-url-invalid'
  | 'source-version-missing'
  | 'retrieval-time-invalid'
  | 'retrieval-time-in-future'
  | 'freshness-window-invalid'
  | 'source-stale'
  | 'content-digest-invalid'
  | 'reuse-prohibited'
  | 'reuse-approval-missing'
  | 'reuse-terms-url-invalid'
  | 'reuse-verification-time-invalid'
  | 'reuse-verification-time-in-future'
  | 'coverage-insufficient'
  | 'coverage-scope-missing'
  | 'administrative-key-scope-missing'
  | 'correction-path-invalid';

export type PostalSourcePromotionResult = {
  gateVersion: typeof POSTAL_SOURCE_PROMOTION_GATE_VERSION;
  countryCode: string;
  sourceId: string;
  level: PostalSourcePromotionLevel;
  reasons: PostalSourcePromotionReason[];
  ageDays?: number;
  permitsPostalLookup: boolean;
  permitsDeliverabilityClaim: false;
  nextAction: string;
};

const VERSION_PLACEHOLDERS = new Set([
  '',
  'current',
  'latest',
  'n/a',
  'none',
  'unknown',
  'unversioned',
]);

function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function parseDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function hasFixedVersion(value: string) {
  return !VERSION_PLACEHOLDERS.has(value.trim().toLowerCase());
}

function validCountryCode(value: string) {
  return /^[A-Z]{2}(?:-[A-Z0-9]{1,4})?$/.test(value.trim().toUpperCase());
}

function validDigest(value: string) {
  return /^sha256:[a-f0-9]{64}$/.test(value.trim());
}

function uniqueReasons(reasons: PostalSourcePromotionReason[]) {
  return [...new Set(reasons)];
}

function hasAdministrativeKeyScope(levels: string[]) {
  return levels.length > 0 && levels.every(level => level.trim().length > 0);
}

function resultLevel(
  reasons: PostalSourcePromotionReason[],
): PostalSourcePromotionLevel {
  if (
    reasons.includes('reuse-prohibited')
    || reasons.includes('retrieval-time-in-future')
    || reasons.includes('reuse-verification-time-in-future')
    || reasons.includes('country-code-invalid')
  ) {
    return 'blocked';
  }
  return reasons.length === 0 ? 'evidence-backed-lookup' : 'candidate-only';
}

export function evaluatePostalSourcePromotion(
  record: PostalSourceEvidenceRecord,
  options: { now?: string; futureSkewMinutes?: number } = {},
): PostalSourcePromotionResult {
  const reasons: PostalSourcePromotionReason[] = [];
  const countryCode = record.countryCode.trim().toUpperCase();
  const sourceId = record.sourceId.trim();
  const now = parseDate(options.now ?? new Date().toISOString());
  const retrievedAt = parseDate(record.retrievedAt);
  const rightsVerifiedAt = parseDate(record.rights.verifiedAt);
  const futureSkewMs = (options.futureSkewMinutes ?? 5) * 60_000;
  let ageDays: number | undefined;

  if (!validCountryCode(countryCode)) reasons.push('country-code-invalid');
  if (!sourceId) reasons.push('source-id-missing');
  if (!isHttpsUrl(record.sourceUrl)) reasons.push('source-url-invalid');
  if (!hasFixedVersion(record.sourceVersion)) reasons.push('source-version-missing');
  if (retrievedAt === undefined || now === undefined) {
    reasons.push('retrieval-time-invalid');
  } else {
    ageDays = Math.max(0, (now - retrievedAt) / 86_400_000);
    if (retrievedAt > now + futureSkewMs) reasons.push('retrieval-time-in-future');
  }

  if (!Number.isFinite(record.maxAgeDays) || record.maxAgeDays <= 0) {
    reasons.push('freshness-window-invalid');
  } else if (ageDays !== undefined && ageDays > record.maxAgeDays) {
    reasons.push('source-stale');
  }

  if (!validDigest(record.contentDigest)) reasons.push('content-digest-invalid');

  if (record.rights.status === 'prohibited') {
    reasons.push('reuse-prohibited');
  } else if (record.rights.status !== 'approved') {
    reasons.push('reuse-approval-missing');
  }
  if (!isHttpsUrl(record.rights.termsUrl)) reasons.push('reuse-terms-url-invalid');
  if (rightsVerifiedAt === undefined || now === undefined) {
    reasons.push('reuse-verification-time-invalid');
  } else if (rightsVerifiedAt > now + futureSkewMs) {
    reasons.push('reuse-verification-time-in-future');
  }

  if (record.coverage.level !== 'lookup') reasons.push('coverage-insufficient');
  if (!record.coverage.scope.trim()) reasons.push('coverage-scope-missing');
  if (!hasAdministrativeKeyScope(record.coverage.administrativeKeyLevels)) {
    reasons.push('administrative-key-scope-missing');
  }
  if (!isHttpsUrl(record.correctionPath)) reasons.push('correction-path-invalid');

  const deduplicatedReasons = uniqueReasons(reasons);
  const level = resultLevel(deduplicatedReasons);

  return {
    gateVersion: POSTAL_SOURCE_PROMOTION_GATE_VERSION,
    countryCode,
    sourceId,
    level,
    reasons: deduplicatedReasons,
    ageDays,
    permitsPostalLookup: level === 'evidence-backed-lookup',
    permitsDeliverabilityClaim: false,
    nextAction: level === 'evidence-backed-lookup'
      ? 'Use only for source-versioned postal lookup; preserve provenance and do not infer deliverability.'
      : level === 'candidate-only'
        ? 'Keep candidate presentation only and repair every listed evidence gap before enabling postal lookup.'
        : 'Exclude the source from address-validation decisions until the blocking condition is resolved.',
  };
}
