import assert from 'node:assert/strict';
import test from 'node:test';
import type { CanonicalAddress } from './addressRendering';
import {
  evaluateJapaneseReadingHoldout,
  gateJapaneseContextualReadingRecords,
  resolveJapaneseContextualReading,
  type JapaneseContextualReadingRecord,
} from './japaneseContextualReading';
import { buildRemainingAsianShippingAddress } from './remainingAsianShippingAddress';

function synthetic(overrides: Partial<CanonicalAddress> = {}): CanonicalAddress {
  return {
    country_code: 'JP',
    country: '',
    state: '',
    city: '',
    district: '',
    subdistrict: '',
    suburb: '',
    road: '',
    house_number: '',
    building: '',
    postcode: '',
    poi: '',
    ...overrides,
  };
}

const approvedSource = {
  authority: 'Synthetic holdout authority',
  url: 'https://example.invalid/japanese-reading-holdout',
  termsUrl: 'https://example.invalid/japanese-reading-holdout/terms',
  version: 'synthetic-v1',
  checkedOn: '2026-07-25',
  reuseStatus: 'approved-open-data' as const,
  correctionPath: 'https://example.invalid/corrections',
};

const osakaNipponbashi: JapaneseContextualReadingRecord = {
  id: 'synthetic-osaka-nipponbashi',
  field: 'subdistrict',
  nativeName: '日本橋',
  readingKana: 'ニッポンバシ',
  romanizedName: 'Nipponbashi',
  context: {
    state: '大阪府',
    city: '大阪市',
    district: '中央区',
    postcodePrefix: '542',
  },
  source: approvedSource,
};

const conflictingTokyoReading: JapaneseContextualReadingRecord = {
  id: 'synthetic-conflicting-tokyo-reading',
  field: 'subdistrict',
  nativeName: '日本橋',
  readingKana: 'ニッポンバシ',
  romanizedName: 'Nipponbashi',
  context: {
    state: '東京都',
    city: '中央区',
    postcodePrefix: '103',
  },
  source: approvedSource,
};

test('resolves the same kanji from administrative and postcode context', () => {
  const tokyo = resolveJapaneseContextualReading({
    field: 'subdistrict',
    nativeName: '日本橋',
    address: synthetic({
      state: '東京都',
      city: '中央区',
      postcode: '103-0027',
    }),
    records: [osakaNipponbashi],
  });
  assert.equal(tokyo.status, 'resolved');
  if (tokyo.status === 'resolved') assert.equal(tokyo.romanizedName, 'Nihonbashi');

  const osaka = resolveJapaneseContextualReading({
    field: 'subdistrict',
    nativeName: '日本橋',
    address: synthetic({
      state: '大阪府',
      city: '大阪市',
      district: '中央区',
      postcode: '542-0073',
    }),
    records: [osakaNipponbashi],
  });
  assert.equal(osaka.status, 'resolved');
  if (osaka.status === 'resolved') assert.equal(osaka.romanizedName, 'Nipponbashi');
});

test('does not guess a context-sensitive reading without routing context', () => {
  const resolution = resolveJapaneseContextualReading({
    field: 'subdistrict',
    nativeName: '日本橋',
    address: synthetic(),
    records: [osakaNipponbashi],
  });
  assert.equal(resolution.status, 'context-required');
});

test('rejects a known reading when the postcode context conflicts', () => {
  const resolution = resolveJapaneseContextualReading({
    field: 'subdistrict',
    nativeName: '日本橋',
    address: synthetic({
      state: '東京都',
      city: '中央区',
      postcode: '999-9999',
    }),
  });
  assert.equal(resolution.status, 'context-mismatch');
});

test('uses contextual evidence in international rendering and preserves review gates', () => {
  const resolved = buildRemainingAsianShippingAddress(synthetic({
    state: '東京都',
    city: '中央区',
    subdistrict: '日本橋',
    road: 'Synthetic-dori',
    house_number: '8',
    postcode: '1030027',
  }), 'international-shipping');
  assert.equal(resolved.normalized.subdistrict, 'Nihonbashi');
  assert.equal(
    resolved.romanizationMethods.subdistrict,
    'contextual-authoritative-reading',
  );
  assert.ok(resolved.warnings.includes('contextual_japanese_reading_applied'));
  assert.ok(!resolved.warnings.includes('japanese_reading_context_required'));

  const unresolved = buildRemainingAsianShippingAddress(synthetic({
    subdistrict: '日本橋',
    road: 'Synthetic-dori',
    house_number: '8',
  }), 'international-shipping');
  assert.equal(unresolved.normalized.subdistrict, '日本橋');
  assert.ok(unresolved.warnings.includes('japanese_reading_context_required'));
  assert.equal(unresolved.formatStatus, 'needs-review');
});

test('supports versioned caller records without storing points or personal data', () => {
  const result = buildRemainingAsianShippingAddress(synthetic({
    state: '大阪府',
    city: '大阪市',
    district: '中央区',
    subdistrict: '日本橋',
    road: 'Synthetic-dori',
    house_number: '8',
    postcode: '5420073',
  }), 'international-shipping', {
    japaneseReadingRecords: [osakaNipponbashi],
  });

  assert.equal(result.normalized.subdistrict, 'Nipponbashi');
  assert.ok(result.warnings.includes('contextual_japanese_reading_applied'));
  assert.equal('latitude' in osakaNipponbashi, false);
  assert.equal('longitude' in osakaNipponbashi, false);
});

test('reports aggregate-only holdout quality for contextual readings', () => {
  const report = evaluateJapaneseReadingHoldout({
    records: [osakaNipponbashi],
    vectors: [
      {
        id: 'tokyo-context',
        field: 'subdistrict',
        nativeName: '日本橋',
        routingContext: {
          state: '東京都',
          city: '中央区',
          postcode: '103-0000',
        },
        expected: { status: 'resolved', romanizedName: 'Nihonbashi' },
      },
      {
        id: 'osaka-context',
        field: 'subdistrict',
        nativeName: '日本橋',
        routingContext: {
          state: '大阪府',
          city: '大阪市',
          district: '中央区',
          postcode: '542-0000',
        },
        expected: { status: 'resolved', romanizedName: 'Nipponbashi' },
      },
      {
        id: 'missing-context',
        field: 'subdistrict',
        nativeName: '日本橋',
        routingContext: {},
        expected: { status: 'deferred' },
      },
      {
        id: 'postcode-conflict',
        field: 'subdistrict',
        nativeName: '日本橋',
        routingContext: {
          state: '東京都',
          city: '中央区',
          postcode: '999-0000',
        },
        expected: { status: 'deferred' },
      },
    ],
  });

  assert.deepEqual(report, {
    total: 4,
    resolvedExpected: 2,
    deferredExpected: 2,
    correct: 4,
    incorrect: 0,
    unsafeAutomaticResolutions: 0,
    unexpectedDeferrals: 0,
    accuracy: 1,
    safeDeferralRate: 1,
  });
  assert.equal('vectors' in report, false);
  assert.equal('outcomes' in report, false);
});

test('defers instead of choosing between equally specific conflicting evidence', () => {
  const resolution = resolveJapaneseContextualReading({
    field: 'subdistrict',
    nativeName: '日本橋',
    address: synthetic({
      state: '東京都',
      city: '中央区',
      postcode: '103-0000',
    }),
    records: [conflictingTokyoReading],
  });
  assert.equal(resolution.status, 'ambiguous');

  const report = evaluateJapaneseReadingHoldout({
    records: [conflictingTokyoReading],
    vectors: [{
      id: 'conflicting-evidence',
      field: 'subdistrict',
      nativeName: '日本橋',
      routingContext: {
        state: '東京都',
        city: '中央区',
        postcode: '103-0000',
      },
      expected: { status: 'deferred' },
    }],
  });
  assert.equal(report.unsafeAutomaticResolutions, 0);
  assert.equal(report.safeDeferralRate, 1);
});

test('rejects stale, weak-rights, and sensitive reading records before resolution', () => {
  const unsafe = {
    ...osakaNipponbashi,
    id: 'unsafe-reading-record',
    latitude: 35.0,
    source: {
      ...approvedSource,
      url: 'http://example.invalid/source',
      termsUrl: '',
      version: '',
      checkedOn: '2020-01-01',
      correctionPath: 'not-a-correction-path',
    },
  } as unknown as JapaneseContextualReadingRecord;
  const gate = gateJapaneseContextualReadingRecords([unsafe], {
    asOf: '2026-07-25',
    maxReviewAgeDays: 365,
  });

  assert.equal(gate.acceptedRecords.length, 0);
  assert.deepEqual(gate.rejected[0].reasons, [
    'forbidden-sensitive-field',
    'invalid-source-url',
    'invalid-terms-url',
    'missing-source-version',
    'invalid-correction-path',
    'stale-source-review',
  ]);

  const result = buildRemainingAsianShippingAddress(synthetic({
    state: '大阪府',
    city: '大阪市',
    district: '中央区',
    subdistrict: '日本橋',
    road: 'Synthetic-dori',
    house_number: '8',
    postcode: '5420073',
  }), 'international-shipping', {
    japaneseReadingRecords: [unsafe],
  });
  assert.notEqual(result.normalized.subdistrict, 'Nipponbashi');
  assert.ok(result.warnings.includes('japanese_reading_evidence_rejected'));
  assert.equal(result.formatStatus, 'needs-review');
});

test('corroborates an administrative reading across Japan Post and GSI', () => {
  const resolution = resolveJapaneseContextualReading({
    field: 'city',
    nativeName: '八幡市',
    address: synthetic({
      state: '京都府',
      city: '八幡市',
      postcode: '614-0000',
    }),
    evidencePolicy: { minimumIndependentAuthorities: 2 },
  });

  assert.equal(resolution.status, 'resolved');
  if (resolution.status === 'resolved') {
    assert.equal(resolution.romanizedName, 'Yawata-shi');
    assert.equal(resolution.authorityCount, 2);
    assert.deepEqual([...resolution.authorities].sort(), [
      'GeospatialInformationAuthorityofJapan',
      'JapanPostCo.,Ltd.',
    ]);
  }
});

test('defers when the requested independent-authority threshold is not met', () => {
  const result = buildRemainingAsianShippingAddress(synthetic({
    state: '東京都',
    city: '中央区',
    subdistrict: '日本橋',
    road: 'Synthetic-dori',
    house_number: '8',
    postcode: '1030027',
  }), 'international-shipping', {
    japaneseReadingMinimumIndependentAuthorities: 2,
  });

  assert.equal(result.normalized.subdistrict, '日本橋');
  assert.ok(
    result.warnings.includes('japanese_reading_insufficient_corroboration'),
  );
  assert.equal(result.formatStatus, 'needs-review');
});
