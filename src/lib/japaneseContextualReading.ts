import type { CanonicalAddress } from './addressRendering';

export type JapaneseContextualReadingField =
  | 'building'
  | 'poi'
  | 'road'
  | 'subdistrict'
  | 'district'
  | 'city'
  | 'state';

export type JapaneseReadingSource = {
  authority: string;
  url: string;
  termsUrl: string;
  version: string;
  checkedOn: string;
  reuseStatus:
    | 'reference-only-reading-evidence-no-dataset-copied'
    | 'approved-open-data';
  correctionPath: string;
};

export type JapaneseContextualReadingRecord = {
  id: string;
  field: JapaneseContextualReadingField;
  nativeName: string;
  readingKana: string;
  romanizedName: string;
  context: {
    state?: string;
    city?: string;
    district?: string;
    postcodePrefix?: string;
  };
  source: JapaneseReadingSource;
  administrativeKey?: {
    scheme: 'JP-national-local-government-code';
    value: string;
    prefectureCode: string;
    source: JapaneseReadingSource;
  };
};

export type JapaneseContextualReadingResolution =
  | {
      status: 'resolved';
      romanizedName: string;
      readingKana: string;
      record: JapaneseContextualReadingRecord;
      authorityCount: number;
      authorities: readonly string[];
      rejectedRecordIds: readonly string[];
    }
  | {
      status:
        | 'ambiguous'
        | 'context-required'
        | 'context-mismatch'
        | 'insufficient-corroboration'
        | 'unmatched';
      candidates: readonly JapaneseContextualReadingRecord[];
      rejectedRecordIds: readonly string[];
    };

export type JapaneseReadingRecordGateReason =
  | 'forbidden-sensitive-field'
  | 'missing-record-id'
  | 'missing-reading-value'
  | 'invalid-reading-script'
  | 'insufficient-routing-context'
  | 'invalid-source-url'
  | 'invalid-terms-url'
  | 'unapproved-reuse-status'
  | 'missing-source-version'
  | 'invalid-source-review-date'
  | 'future-source-review-date'
  | 'stale-source-review'
  | 'invalid-correction-path'
  | 'invalid-administrative-key';

export type JapaneseReadingRecordGateReport = {
  policyVersion: typeof JAPANESE_READING_EVIDENCE_POLICY_VERSION;
  asOf: string;
  maxReviewAgeDays: number;
  acceptedRecords: readonly JapaneseContextualReadingRecord[];
  rejected: readonly {
    recordId: string;
    reasons: readonly JapaneseReadingRecordGateReason[];
  }[];
};

export type JapaneseReadingHoldoutVector = {
  id: string;
  field: JapaneseContextualReadingField;
  nativeName: string;
  routingContext: {
    state?: string;
    city?: string;
    district?: string;
    postcode?: string;
  };
  expected:
    | { status: 'resolved'; romanizedName: string }
    | { status: 'deferred' };
};

export type JapaneseReadingHoldoutReport = {
  total: number;
  resolvedExpected: number;
  deferredExpected: number;
  correct: number;
  incorrect: number;
  unsafeAutomaticResolutions: number;
  unexpectedDeferrals: number;
  accuracy: number;
  safeDeferralRate: number;
};

export const JAPAN_POST_ROMANIZED_SOURCE: JapaneseReadingSource = {
  authority: 'Japan Post Co., Ltd.',
  url: 'https://www.post.japanpost.jp/service/search/zipcode/download/roman-zip.html',
  termsUrl: 'https://www.post.japanpost.jp/service/search/zipcode/download/readme.html',
  version: 'Romanized postcode data, 2025-06 edition',
  checkedOn: '2026-07-25',
  reuseStatus: 'approved-open-data',
  correctionPath: 'https://www.post.japanpost.jp/question/contact_us/',
};

export const GSI_GAZETTEER_SOURCE: JapaneseReadingSource = {
  authority: 'Geospatial Information Authority of Japan',
  url: 'https://www.gsi.go.jp/common/000238259.pdf',
  termsUrl: 'https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html',
  version: 'Gazetteer of Japan 2021; errata published 2026-03-24',
  checkedOn: '2026-07-25',
  reuseStatus: 'approved-open-data',
  correctionPath:
    'https://geoinfo2.gsi.go.jp/contact/Inquiry2.aspx?bcode=100515&mcode=10051501&pcode=1005',
};

export const JAPANESE_READING_EVIDENCE_POLICY_VERSION =
  'jp-reading-evidence-v1-2026-07-25' as const;

const FORBIDDEN_RECORD_KEYS = new Set([
  'rawaddress',
  'recipient',
  'recipientname',
  'latitude',
  'longitude',
  'coordinates',
  'querylog',
  'privatekey',
  'proofsecret',
  'credential',
]);

/**
 * Small evidence seeds, not a copied postcode dataset. Production ingestion can
 * append versioned records after completing the same source and rights checks.
 */
export const JAPANESE_CONTEXTUAL_READING_RECORDS:
readonly JapaneseContextualReadingRecord[] = [
  {
    id: 'jp-post-103-chuo-nihonbashi',
    field: 'subdistrict',
    nativeName: '日本橋',
    readingKana: 'ニホンバシ',
    romanizedName: 'Nihonbashi',
    context: {
      state: '東京都',
      city: '中央区',
      postcodePrefix: '103',
    },
    source: JAPAN_POST_ROMANIZED_SOURCE,
  },
  {
    id: 'jp-post-614-yawata-city',
    field: 'city',
    nativeName: '八幡市',
    readingKana: 'ヤワタシ',
    romanizedName: 'Yawata-shi',
    context: {
      state: '京都府',
      postcodePrefix: '614',
    },
    source: JAPAN_POST_ROMANIZED_SOURCE,
  },
  {
    id: 'gsi-gazetteer-2021-yawata-city',
    field: 'city',
    nativeName: '八幡市',
    readingKana: 'やわたし',
    romanizedName: 'Yawata-shi',
    context: {
      state: '京都府',
      city: '八幡市',
    },
    source: GSI_GAZETTEER_SOURCE,
  },
] as const;

const CONTEXT_SENSITIVE_JAPANESE_NAMES = new Set([
  '日本橋',
  '八幡',
  '八幡市',
  '上野',
  '神戸',
  '新田',
  '大和',
]);

function normalizedText(value: unknown) {
  return String(value ?? '').normalize('NFKC').replace(/\s+/g, '');
}

function normalizedPostcode(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

function isHttpsUrl(value: unknown) {
  try {
    return new URL(String(value ?? '')).protocol === 'https:';
  } catch {
    return false;
  }
}

function isCorrectionPath(value: unknown) {
  const path = String(value ?? '');
  return path.startsWith('mailto:') || isHttpsUrl(path);
}

function containsForbiddenRecordKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, nested]) => (
    FORBIDDEN_RECORD_KEYS.has(key.toLowerCase())
    || containsForbiddenRecordKey(nested)
  ));
}

function utcDay(value: string) {
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function calculateJapaneseLocalGovernmentCodeCheckDigit(
  firstFiveDigits: string,
) {
  if (!/^\d{5}$/.test(firstFiveDigits)) return null;
  const weights = [6, 5, 4, 3, 2];
  const weightedSum = [...firstFiveDigits].reduce(
    (sum, digit, index) => sum + Number(digit) * weights[index],
    0,
  );
  return String((11 - (weightedSum % 11)) % 10);
}

export function isValidJapaneseLocalGovernmentCode(value: string) {
  if (!/^\d{6}$/.test(value)) return false;
  return calculateJapaneseLocalGovernmentCodeCheckDigit(value.slice(0, 5))
    === value.slice(5);
}

export function validateJapaneseReadingSource(
  source: JapaneseReadingSource,
  options: {
    asOf?: string;
    maxReviewAgeDays?: number;
  } = {},
): readonly JapaneseReadingRecordGateReason[] {
  const asOf = options.asOf ?? '2026-07-25';
  const maxReviewAgeDays = options.maxReviewAgeDays ?? 730;
  const asOfDay = utcDay(asOf);
  const reasons: JapaneseReadingRecordGateReason[] = [];

  if (!isHttpsUrl(source.url)) reasons.push('invalid-source-url');
  if (!isHttpsUrl(source.termsUrl)) reasons.push('invalid-terms-url');
  if (
    source.reuseStatus !== 'approved-open-data'
    && source.reuseStatus !== 'reference-only-reading-evidence-no-dataset-copied'
  ) {
    reasons.push('unapproved-reuse-status');
  }
  if (!normalizedText(source.version)) reasons.push('missing-source-version');
  if (!isCorrectionPath(source.correctionPath)) {
    reasons.push('invalid-correction-path');
  }

  const reviewedDay = utcDay(source.checkedOn);
  if (reviewedDay === null || asOfDay === null) {
    reasons.push('invalid-source-review-date');
  } else if (reviewedDay > asOfDay) {
    reasons.push('future-source-review-date');
  } else if ((asOfDay - reviewedDay) / 86_400_000 > maxReviewAgeDays) {
    reasons.push('stale-source-review');
  }

  return [...new Set(reasons)];
}

export function gateJapaneseContextualReadingRecords(
  records: readonly JapaneseContextualReadingRecord[],
  options: {
    asOf?: string;
    maxReviewAgeDays?: number;
  } = {},
): JapaneseReadingRecordGateReport {
  const asOf = options.asOf ?? '2026-07-25';
  const maxReviewAgeDays = options.maxReviewAgeDays ?? 730;
  const acceptedRecords: JapaneseContextualReadingRecord[] = [];
  const rejected: JapaneseReadingRecordGateReport['rejected'][number][] = [];

  for (const record of records) {
    const reasons: JapaneseReadingRecordGateReason[] = [];
    if (containsForbiddenRecordKey(record)) reasons.push('forbidden-sensitive-field');
    if (!normalizedText(record.id)) reasons.push('missing-record-id');
    if (
      !normalizedText(record.nativeName)
      || !normalizedText(record.readingKana)
      || !normalizedText(record.romanizedName)
    ) {
      reasons.push('missing-reading-value');
    } else if (
      !/[\u3040-\u30ff\u3400-\u9fff]/u.test(record.nativeName)
      || !/[\u3040-\u30ff]/u.test(record.readingKana)
      || /[\u3040-\u30ff\u3400-\u9fff]/u.test(record.romanizedName)
    ) {
      reasons.push('invalid-reading-script');
    }
    if (Object.values(record.context).filter(Boolean).length < 2) {
      reasons.push('insufficient-routing-context');
    }
    reasons.push(...validateJapaneseReadingSource(record.source, {
      asOf,
      maxReviewAgeDays,
    }));
    if (record.administrativeKey) {
      if (
        !isValidJapaneseLocalGovernmentCode(record.administrativeKey.value)
        || !/^\d{2}$/.test(record.administrativeKey.prefectureCode)
        || !record.administrativeKey.value.startsWith(
          record.administrativeKey.prefectureCode,
        )
      ) {
        reasons.push('invalid-administrative-key');
      }
      reasons.push(...validateJapaneseReadingSource(
        record.administrativeKey.source,
        { asOf, maxReviewAgeDays },
      ));
    }

    if (reasons.length) {
      rejected.push({
        recordId: normalizedText(record.id) || 'missing-record-id',
        reasons: [...new Set(reasons)],
      });
    } else {
      acceptedRecords.push(record);
    }
  }

  return {
    policyVersion: JAPANESE_READING_EVIDENCE_POLICY_VERSION,
    asOf,
    maxReviewAgeDays,
    acceptedRecords,
    rejected,
  };
}

function recordSpecificity(record: JapaneseContextualReadingRecord) {
  return Object.values(record.context).filter(Boolean).length;
}

function contextMatches(
  record: JapaneseContextualReadingRecord,
  address: CanonicalAddress,
) {
  const comparisons = [
    [record.context.state, address.state],
    [record.context.city, address.city],
    [record.context.district, address.district],
  ] as const;

  for (const [expected, actual] of comparisons) {
    if (!expected) continue;
    if (!actual || normalizedText(expected) !== normalizedText(actual)) return false;
  }

  if (record.context.postcodePrefix) {
    const postcode = normalizedPostcode(address.postcode);
    if (!postcode || !postcode.startsWith(record.context.postcodePrefix)) return false;
  }
  return true;
}

function contextIsMissing(
  record: JapaneseContextualReadingRecord,
  address: CanonicalAddress,
) {
  return (
    (Boolean(record.context.state) && !normalizedText(address.state))
    || (Boolean(record.context.city) && !normalizedText(address.city))
    || (Boolean(record.context.district) && !normalizedText(address.district))
    || (Boolean(record.context.postcodePrefix) && !normalizedPostcode(address.postcode))
  );
}

export function isContextSensitiveJapanesePlaceName(value: string) {
  const name = normalizedText(value);
  return CONTEXT_SENSITIVE_JAPANESE_NAMES.has(name)
    || JAPANESE_CONTEXTUAL_READING_RECORDS.some(
      record => normalizedText(record.nativeName) === name,
    );
}

export function resolveJapaneseContextualReading(input: {
  field: JapaneseContextualReadingField;
  nativeName: string;
  address: CanonicalAddress;
  records?: readonly JapaneseContextualReadingRecord[];
  evidencePolicy?: {
    asOf?: string;
    maxReviewAgeDays?: number;
    minimumIndependentAuthorities?: number;
  };
}): JapaneseContextualReadingResolution {
  const gate = gateJapaneseContextualReadingRecords([
    ...JAPANESE_CONTEXTUAL_READING_RECORDS,
    ...(input.records ?? []),
  ], input.evidencePolicy);
  const records = gate.acceptedRecords;
  const rejectedRecordIds = gate.rejected.map(item => item.recordId);
  const nativeName = normalizedText(input.nativeName);
  const candidates = records.filter(
    record => record.field === input.field
      && normalizedText(record.nativeName) === nativeName,
  );

  if (!candidates.length) {
    return {
      status: isContextSensitiveJapanesePlaceName(input.nativeName)
        ? 'context-required'
        : 'unmatched',
      candidates: [],
      rejectedRecordIds,
    };
  }

  const matches = candidates.filter(record => contextMatches(record, input.address));
  if (!matches.length) {
    return {
      status: candidates.some(record => contextIsMissing(record, input.address))
        ? 'context-required'
        : 'context-mismatch',
      candidates,
      rejectedRecordIds,
    };
  }

  const highestSpecificity = Math.max(...matches.map(recordSpecificity));
  const strongestMatches = matches.filter(
    record => recordSpecificity(record) === highestSpecificity,
  );
  const readings = new Set(
    strongestMatches.map(record => normalizedText(record.romanizedName).toLowerCase()),
  );
  if (readings.size !== 1) {
    return { status: 'ambiguous', candidates: strongestMatches, rejectedRecordIds };
  }

  const authorities = [...new Set(
    strongestMatches.map(record => normalizedText(record.source.authority)),
  )].filter(Boolean);
  const minimumIndependentAuthorities = Math.max(
    1,
    Math.floor(input.evidencePolicy?.minimumIndependentAuthorities ?? 1),
  );
  if (authorities.length < minimumIndependentAuthorities) {
    return {
      status: 'insufficient-corroboration',
      candidates: strongestMatches,
      rejectedRecordIds,
    };
  }

  const record = strongestMatches[0];
  return {
    status: 'resolved',
    romanizedName: record.romanizedName,
    readingKana: record.readingKana,
    record,
    authorityCount: authorities.length,
    authorities,
    rejectedRecordIds,
  };
}

function holdoutAddress(
  context: JapaneseReadingHoldoutVector['routingContext'],
): CanonicalAddress {
  return {
    country_code: 'JP',
    country: '',
    state: context.state ?? '',
    city: context.city ?? '',
    district: context.district ?? '',
    subdistrict: '',
    suburb: '',
    road: '',
    house_number: '',
    building: '',
    postcode: context.postcode ?? '',
    poi: '',
  };
}

/**
 * Returns aggregate-only metrics. It intentionally does not include vector
 * inputs, place names, or per-case outcomes in the report.
 */
export function evaluateJapaneseReadingHoldout(input: {
  vectors: readonly JapaneseReadingHoldoutVector[];
  records?: readonly JapaneseContextualReadingRecord[];
  evidencePolicy?: {
    asOf?: string;
    maxReviewAgeDays?: number;
    minimumIndependentAuthorities?: number;
  };
}): JapaneseReadingHoldoutReport {
  let resolvedExpected = 0;
  let deferredExpected = 0;
  let correct = 0;
  let unsafeAutomaticResolutions = 0;
  let unexpectedDeferrals = 0;
  let safeDeferrals = 0;

  for (const vector of input.vectors) {
    const resolution = resolveJapaneseContextualReading({
      field: vector.field,
      nativeName: vector.nativeName,
      address: holdoutAddress(vector.routingContext),
      records: input.records,
      evidencePolicy: input.evidencePolicy,
    });
    const resolved = resolution.status === 'resolved';

    if (vector.expected.status === 'resolved') {
      resolvedExpected += 1;
      if (!resolved) {
        unexpectedDeferrals += 1;
        continue;
      }
      if (
        normalizedText(resolution.romanizedName).toLowerCase()
        === normalizedText(vector.expected.romanizedName).toLowerCase()
      ) {
        correct += 1;
      } else {
        unsafeAutomaticResolutions += 1;
      }
      continue;
    }

    deferredExpected += 1;
    if (resolved) {
      unsafeAutomaticResolutions += 1;
    } else {
      correct += 1;
      safeDeferrals += 1;
    }
  }

  const total = input.vectors.length;
  return {
    total,
    resolvedExpected,
    deferredExpected,
    correct,
    incorrect: total - correct,
    unsafeAutomaticResolutions,
    unexpectedDeferrals,
    accuracy: total ? correct / total : 1,
    safeDeferralRate: deferredExpected ? safeDeferrals / deferredExpected : 1,
  };
}
