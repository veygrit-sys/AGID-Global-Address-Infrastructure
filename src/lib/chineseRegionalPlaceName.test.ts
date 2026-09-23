import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  assessChinesePlaceNameSuggestionHoldout,
  assessChineseRegionalPlaceNameHoldout,
  auditChineseRegionalPlaceNameRecords,
  buildChinesePlaceNameCorrectionEndpointEvidence,
  buildChineseRegionalPlaceNameHoldoutPack,
  buildChineseRegionalPlaceNameQualityEvidence,
  CHINESE_PLACE_NAME_CORRECTION_ENDPOINT_EVIDENCE_VERSION,
  CHINESE_PLACE_NAME_CORRECTION_MONITOR_KEY_REGISTRY_VERSION,
  CHINESE_PLACE_NAME_HOLDOUT_SCHEMA_VERSION,
  CHINESE_PLACE_NAME_HOLDOUT_PACK_VERSION,
  CHINESE_PLACE_NAME_EVALUATION_ENGINE_VERSION,
  CHINESE_PLACE_NAME_INTAKE_SCHEMA_VERSION,
  CHINESE_PLACE_NAME_QUALITY_DIGEST_ALGORITHM,
  CHINESE_PLACE_NAME_QUALITY_EVIDENCE_VERSION,
  CHINESE_PLACE_NAME_QUALITY_GATE_VERSION,
  CHINESE_PLACE_NAME_RECORD_SET_VERSION,
  CHINESE_PLACE_NAME_REVIEW_KEY_REGISTRY_VERSION,
  CHINESE_PLACE_NAME_SUGGESTION_QUALITY_GATE_VERSION,
  CHINESE_REGIONAL_PLACE_NAME_RECORDS,
  DEFAULT_CHINESE_PLACE_NAME_QUALITY_POLICY,
  DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY,
  evaluateChinesePlaceNameSuggestionHoldout,
  evaluateChinesePlaceNameSuggestionHoldoutPack,
  evaluateChineseRegionalPlaceNameHoldout,
  evaluateChineseRegionalPlaceNameHoldoutPack,
  intakeChineseRegionalPlaceNameBatch,
  resolveChineseRegionalPlaceName,
  suggestChineseRegionalPlaceNameCandidates,
  verifyChinesePlaceNameCorrectionEndpointEvidence,
  verifyChinesePlaceNameCorrectionEndpointSignature,
  verifyChinesePlaceNameCorrectionEndpointSignatureSet,
  verifyChinesePlaceNameIndependentReview,
  verifyEd25519DetachedSignature,
  verifyChineseRegionalPlaceNameQualityEvidence,
  type ChinesePlaceNameCorrectionEndpointEvidence,
  type ChinesePlaceNameCorrectionMonitorKeyRegistry,
  type ChinesePlaceNameReviewerKeyRegistry,
  type ChineseRegionalPlaceNameBatchManifest,
  type ChineseRegionalPlaceNameRecord,
} from './chineseRegionalPlaceName';

test('resolves established regional English names instead of assuming one Chinese reading', () => {
  const cases = [
    ['HK', '沙田', 'Sha Tin'],
    ['HK', '長洲', 'Cheung Chau'],
    ['TW', '高雄市', 'Kaohsiung City'],
    ['MO', '氹仔', 'Taipa'],
    ['SG', '牛車水', 'Chinatown'],
    ['CN', '廈門市', 'Xiamen'],
  ] as const;

  for (const [countryCode, nativeName, englishName] of cases) {
    const result = resolveChineseRegionalPlaceName({ countryCode, nativeName });
    assert.equal(result.status, 'resolved');
    if (result.status === 'resolved') assert.equal(result.englishName, englishName);
  }
});

test('keeps dialect and historical readings search-only', () => {
  const result = resolveChineseRegionalPlaceName({ countryCode: 'CN', nativeName: '廈門市' });
  assert.equal(result.status, 'resolved');
  if (result.status !== 'resolved') return;

  assert.equal(result.englishName, 'Xiamen');
  assert.deepEqual(result.searchAliases, [
    {
      value: 'Amoy',
      readingTradition: 'historical Hokkien exonym',
      usage: 'search-only',
      evidenceStatus: 'curated-compatibility',
    },
  ]);
});

test('offers country-scoped one-character typo candidates without automatic correction', () => {
  const hongKong = suggestChineseRegionalPlaceNameCandidates({
    countryCode: 'HK',
    nativeName: '沙曰',
  });
  assert.equal(hongKong.status, 'suggested');
  assert.equal(hongKong.automaticCorrectionAllowed, false);
  if (hongKong.status !== 'suggested') return;
  assert.deepEqual(hongKong.candidates[0], {
    recordId: 'hk-sha-tin',
    nativeName: '沙田',
    englishName: 'Sha Tin',
    editDistance: 1,
    usage: 'candidate-only',
    automaticCorrectionAllowed: false,
  });

  const singapore = suggestChineseRegionalPlaceNameCandidates({
    countryCode: 'SG',
    nativeName: '牛車永',
  });
  assert.equal(singapore.status, 'suggested');
  if (singapore.status === 'suggested') {
    assert.equal(singapore.candidates[0]?.englishName, 'Chinatown');
    assert.ok(singapore.candidates.every(candidate => (
      candidate.usage === 'candidate-only'
      && candidate.automaticCorrectionAllowed === false
    )));
  }
});

test('does not leak typo candidates across country scopes', () => {
  const result = suggestChineseRegionalPlaceNameCandidates({
    countryCode: 'CN',
    nativeName: '沙曰',
  });
  assert.equal(result.status, 'unmatched');
  assert.deepEqual(result.candidates, []);
  assert.equal(result.automaticCorrectionAllowed, false);
});

test('keeps exact names out of the typo-correction path', () => {
  const result = suggestChineseRegionalPlaceNameCandidates({
    countryCode: 'TW',
    nativeName: '高雄市',
  });
  assert.equal(result.status, 'exact-match');
  assert.equal(result.automaticCorrectionAllowed, false);
  if (result.status === 'exact-match') {
    assert.equal(result.record.englishName, 'Kaohsiung City');
  }
});

test('rejects address-like or overly broad typo-candidate inputs', () => {
  const addressLike = suggestChineseRegionalPlaceNameCandidates({
    countryCode: 'TW',
    nativeName: '高雄市123',
  });
  assert.equal(addressLike.status, 'rejected-input');
  if (addressLike.status === 'rejected-input') {
    assert.ok(addressLike.issues.some(issue => issue.includes('without numbers')));
  }

  const broad = suggestChineseRegionalPlaceNameCandidates({
    countryCode: 'TW',
    nativeName: '高雄巿',
    maxCandidates: 100,
  });
  assert.equal(broad.status, 'rejected-input');
  assert.equal(broad.automaticCorrectionAllowed, false);
});

function suggestionHoldoutVectors() {
  return [
    { id: 'suggest-cn', countryCode: 'CN', nativeName: '廈閅市', expected: { status: 'suggested', recordId: 'cn-xiamen' } },
    { id: 'safe-cn', countryCode: 'CN', nativeName: '未知甲', expected: { status: 'no-suggestion' } },
    { id: 'suggest-tw', countryCode: 'TW', nativeName: '市庯路', expected: { status: 'suggested', recordId: 'tw-shifu-road' } },
    { id: 'safe-tw', countryCode: 'TW', nativeName: '未知乙', expected: { status: 'no-suggestion' } },
    { id: 'suggest-hk', countryCode: 'HK', nativeName: '沙曰', expected: { status: 'suggested', recordId: 'hk-sha-tin' } },
    { id: 'safe-hk', countryCode: 'HK', nativeName: '未知丙', expected: { status: 'no-suggestion' } },
    { id: 'suggest-mo', countryCode: 'MO', nativeName: '氹子', expected: { status: 'suggested', recordId: 'mo-taipa' } },
    { id: 'safe-mo', countryCode: 'MO', nativeName: '未知丁', expected: { status: 'no-suggestion' } },
    { id: 'suggest-sg', countryCode: 'SG', nativeName: '牛車永', expected: { status: 'suggested', recordId: 'sg-chinatown' } },
    { id: 'safe-sg', countryCode: 'SG', nativeName: '未知戊', expected: { status: 'no-suggestion' } },
  ] as const;
}

test('reports aggregate-only typo candidate quality across all five regions', () => {
  const report = evaluateChinesePlaceNameSuggestionHoldout({
    vectors: suggestionHoldoutVectors(),
    maxCandidates: 3,
  });

  assert.equal(report.total, 10);
  assert.equal(report.expectedSuggestions, 5);
  assert.equal(report.expectedNoSuggestions, 5);
  assert.equal(report.top1Accuracy, 1);
  assert.equal(report.topKAccuracy, 1);
  assert.equal(report.safeNoSuggestionRate, 1);
  assert.equal(report.falseSuggestionCases, 0);
  assert.equal(report.missedSuggestionCases, 0);
  assert.equal(report.countrySummaries.length, 5);
  assert.equal('vectors' in report, false);
  assert.doesNotMatch(JSON.stringify(report), /廈閅|市庯|沙曰|氹子|牛車永/);
});

test('keeps small perfect suggestion holdouts blocked under production thresholds', () => {
  const report = evaluateChinesePlaceNameSuggestionHoldout({
    vectors: suggestionHoldoutVectors(),
  });
  const blocked = assessChinesePlaceNameSuggestionHoldout(report);
  assert.equal(DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY.minimumTotal, 500);
  assert.equal(
    DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY
      .minimumExpectedSuggestionsPerCountry,
    50,
  );
  assert.equal(
    DEFAULT_CHINESE_PLACE_NAME_SUGGESTION_QUALITY_POLICY
      .minimumExpectedNoSuggestionsPerCountry,
    50,
  );
  assert.equal(blocked.status, 'blocked');
  assert.equal(blocked.eligibleForVersionedHoldoutReview, false);
  assert.equal(blocked.automaticCorrectionEnabled, false);
  assert.equal(blocked.deliveryClaimsEnabled, false);

  const boundedTestGate = assessChinesePlaceNameSuggestionHoldout(report, {
    requiredCountryCodes: ['CN', 'TW', 'HK', 'MO', 'SG'],
    minimumTotal: 10,
    minimumPerCountry: 2,
    minimumExpectedSuggestionsPerCountry: 0,
    minimumExpectedNoSuggestionsPerCountry: 0,
    minimumTop1Accuracy: 1,
    minimumTopKAccuracy: 1,
    minimumSafeNoSuggestionRate: 1,
    maximumFalseSuggestionCases: 0,
  });
  assert.equal(boundedTestGate.status, 'passed');
  assert.equal(boundedTestGate.eligibleForVersionedHoldoutReview, true);
  assert.equal(boundedTestGate.automaticCorrectionEnabled, false);
});

test('blocks suggestion holdouts that contain only safe no-suggestion cases', () => {
  const report = evaluateChinesePlaceNameSuggestionHoldout({
    records: [],
    vectors: [
      {
        id: 'cn-no-suggestion-one',
        countryCode: 'CN',
        nativeName: '未知甲地',
        expected: { status: 'no-suggestion' },
      },
      {
        id: 'cn-no-suggestion-two',
        countryCode: 'CN',
        nativeName: '未知乙地',
        expected: { status: 'no-suggestion' },
      },
      {
        id: 'tw-no-suggestion-one',
        countryCode: 'TW',
        nativeName: '未知丙地',
        expected: { status: 'no-suggestion' },
      },
      {
        id: 'tw-no-suggestion-two',
        countryCode: 'TW',
        nativeName: '未知丁地',
        expected: { status: 'no-suggestion' },
      },
    ],
  });
  const gate = assessChinesePlaceNameSuggestionHoldout(report, {
    requiredCountryCodes: ['CN', 'TW'],
    minimumTotal: 4,
    minimumPerCountry: 2,
    minimumExpectedSuggestionsPerCountry: 1,
    minimumExpectedNoSuggestionsPerCountry: 1,
    minimumTop1Accuracy: 1,
    minimumTopKAccuracy: 1,
    minimumSafeNoSuggestionRate: 1,
    maximumFalseSuggestionCases: 0,
  });

  assert.equal(report.safeNoSuggestionRate, 1);
  assert.equal(gate.status, 'blocked');
  assert.equal(
    gate.checks.find(check => check.id === 'expected-suggestion-coverage')?.status,
    'blocked',
  );
  assert.equal(
    gate.checks.find(check => check.id === 'expected-no-suggestion-coverage')?.status,
    'passed',
  );
  assert.equal(gate.eligibleForVersionedHoldoutReview, false);
  assert.equal(gate.automaticCorrectionEnabled, false);
});

test('counts unsafe typo candidates separately from missed suggestions', () => {
  const report = evaluateChinesePlaceNameSuggestionHoldout({
    vectors: [
      {
        id: 'false-suggestion',
        countryCode: 'HK',
        nativeName: '沙曰',
        expected: { status: 'no-suggestion' },
      },
      {
        id: 'missed-suggestion',
        countryCode: 'CN',
        nativeName: '未知甲',
        expected: { status: 'suggested', recordId: 'cn-xiamen' },
      },
    ],
  });
  assert.equal(report.falseSuggestionCases, 1);
  assert.equal(report.missedSuggestionCases, 1);
  assert.equal(report.safeNoSuggestionRate, 0);
  assert.equal(report.topKAccuracy, 0);
});

test('preserves Taiwan administrative suffix granularity', () => {
  const locality = resolveChineseRegionalPlaceName({ countryCode: 'TW', nativeName: '高雄' });
  const municipality = resolveChineseRegionalPlaceName({ countryCode: 'TW', nativeName: '高雄市' });
  const islandGroup = resolveChineseRegionalPlaceName({ countryCode: 'TW', nativeName: '澎湖' });
  const county = resolveChineseRegionalPlaceName({ countryCode: 'TW', nativeName: '澎湖縣' });

  assert.equal(locality.status === 'resolved' ? locality.englishName : '', 'Kaohsiung');
  assert.equal(municipality.status === 'resolved' ? municipality.englishName : '', 'Kaohsiung City');
  assert.equal(islandGroup.status === 'resolved' ? islandGroup.englishName : '', 'Penghu');
  assert.equal(county.status === 'resolved' ? county.englishName : '', 'Penghu County');
});

test('built-in place-name evidence passes provenance and privacy gates', () => {
  assert.deepEqual(auditChineseRegionalPlaceNameRecords(CHINESE_REGIONAL_PLACE_NAME_RECORDS), []);
});

test('pins official correction routes and their independent review date', () => {
  const correctionRoutes = [...new Map(
    CHINESE_REGIONAL_PLACE_NAME_RECORDS.map(record => [
      record.countryCode,
      record.source,
    ]),
  ).entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([countryCode, source]) => ({
      countryCode,
      correctionUrl: source.correctionUrl,
      correctionCheckedOn: source.correctionCheckedOn,
    }));

  assert.deepEqual(correctionRoutes, [
    {
      countryCode: 'CN',
      correctionUrl: 'https://openstd.samr.gov.cn/bzgk/std/help',
      correctionCheckedOn: '2026-07-25',
    },
    {
      countryCode: 'HK',
      correctionUrl: 'https://www.landsd.gov.hk/en/about-us/contact-us.html',
      correctionCheckedOn: '2026-07-25',
    },
    {
      countryCode: 'MO',
      correctionUrl: 'https://www.dsscu.gov.mo/zh/comment/node-56',
      correctionCheckedOn: '2026-07-25',
    },
    {
      countryCode: 'SG',
      correctionUrl: 'https://www.onemap.gov.sg/apidocs/contactus',
      correctionCheckedOn: '2026-07-25',
    },
    {
      countryCode: 'TW',
      correctionUrl: 'https://data.gov.tw/comments',
      correctionCheckedOn: '2026-07-25',
    },
  ]);
});

test('verifies fresh privacy-preserving correction endpoint snapshots', () => {
  const source = CHINESE_REGIONAL_PLACE_NAME_RECORDS.find(
    record => record.countryCode === 'TW',
  )!.source;
  const evidence = buildChinesePlaceNameCorrectionEndpointEvidence({
    correctionUrl: source.correctionUrl,
    observedAt: '2026-07-25T12:00:00.000Z',
    observerId: 'synthetic-correction-monitor',
    httpStatus: 200,
    responseContentType: 'text/html; charset=utf-8',
    responseContentSha256: 'a'.repeat(64),
    captureMethod: 'external-http-metadata-only',
    responseBodyStored: false,
    addressPayloadIncluded: false,
  });
  const result = verifyChinesePlaceNameCorrectionEndpointEvidence(source, evidence, {
    asOf: '2026-07-26T00:00:00.000Z',
    maxAgeDays: 30,
  });

  assert.equal(
    evidence.version,
    CHINESE_PLACE_NAME_CORRECTION_ENDPOINT_EVIDENCE_VERSION,
  );
  assert.match(evidence.evidenceDigest, /^[0-9a-f]{64}$/);
  assert.deepEqual(result, {
    valid: true,
    issues: [],
    sourceBound: true,
    freshnessVerified: true,
    privacyVerified: true,
  });
});

test('rejects unbound, stale, failed, or payload-retaining correction snapshots', () => {
  const source = CHINESE_REGIONAL_PLACE_NAME_RECORDS.find(
    record => record.countryCode === 'TW',
  )!.source;
  const evidence = buildChinesePlaceNameCorrectionEndpointEvidence({
    correctionUrl: source.correctionUrl,
    observedAt: '2026-07-25T12:00:00.000Z',
    observerId: 'synthetic-correction-monitor',
    httpStatus: 200,
    responseContentType: 'text/html',
    responseContentSha256: 'b'.repeat(64),
    captureMethod: 'external-http-metadata-only',
    responseBodyStored: false,
    addressPayloadIncluded: false,
  });
  const result = verifyChinesePlaceNameCorrectionEndpointEvidence(source, {
    ...evidence,
    correctionUrl: 'https://example.invalid/correction',
    observedAt: '2024-01-01T00:00:00.000Z',
    httpStatus: 503,
    responseBodyStored: true,
    addressPayloadIncluded: true,
  } as never, {
    asOf: '2026-07-26T00:00:00.000Z',
    maxAgeDays: 30,
  });

  assert.equal(result.valid, false);
  assert.equal(result.sourceBound, false);
  assert.equal(result.freshnessVerified, false);
  assert.equal(result.privacyVerified, false);
  assert.ok(result.issues.some(issue => issue.includes('exactly match')));
  assert.ok(result.issues.some(issue => issue.includes('final 2xx')));
  assert.ok(result.issues.some(issue => issue.includes('privacy declarations')));
  assert.ok(result.issues.some(issue => issue.includes('evidence is stale')));
  assert.ok(result.issues.some(issue => issue.includes('evidenceDigest: mismatch')));
});

test('rejects records carrying precise location or raw-address fields', () => {
  const unsafe = {
    ...CHINESE_REGIONAL_PLACE_NAME_RECORDS[0],
    id: 'unsafe-record',
    latitude: 22.3,
    rawAddress: 'synthetic but forbidden',
  } as ChineseRegionalPlaceNameRecord;

  const result = resolveChineseRegionalPlaceName({
    countryCode: 'CN',
    nativeName: '廣州',
    records: [unsafe],
  });

  assert.equal(result.status, 'rejected-evidence');
  if (result.status === 'rejected-evidence') {
    assert.ok(result.issues.some(issue => issue.includes('latitude')));
    assert.ok(result.issues.some(issue => issue.includes('rawAddress')));
  }
});

test('rejects conflicting delivery names for one country-scoped Han name', () => {
  const first = CHINESE_REGIONAL_PLACE_NAME_RECORDS[0];
  const conflicting = {
    ...first,
    id: 'cn-guangzhou-conflict',
    englishName: 'Canton',
  };
  const issues = auditChineseRegionalPlaceNameRecords([first, conflicting]);

  assert.ok(issues.some(issue => issue.includes('conflicting delivery names')));
});

function syntheticBatch(
  countryCode: 'TW' | 'HK',
  overrides: Partial<ChineseRegionalPlaceNameBatchManifest> = {},
): ChineseRegionalPlaceNameBatchManifest {
  const evidence = CHINESE_REGIONAL_PLACE_NAME_RECORDS.find(
    item => item.countryCode === countryCode,
  );
  assert.ok(evidence);
  const readingSystem = countryCode === 'TW'
    ? 'taiwan-established-english'
    : 'hong-kong-official-english';

  return {
    schemaVersion: CHINESE_PLACE_NAME_INTAKE_SCHEMA_VERSION,
    batchId: `${countryCode.toLowerCase()}-synthetic-intake-1`,
    countryCode,
    source: evidence.source,
    recordCount: 1,
    records: [
      {
        id: `${countryCode.toLowerCase()}-synthetic-test-locality`,
        nativeNames: ['測試鎮'],
        englishName: 'Synthetic Test Locality',
        readingSystem,
      },
    ],
    ...overrides,
  };
}

test('activates fresh approved-open-data batches for delivery rendering', () => {
  const result = intakeChineseRegionalPlaceNameBatch(syntheticBatch('TW'), {
    asOf: '2026-07-25',
  });

  assert.equal(result.status, 'accepted');
  if (result.status !== 'accepted') return;
  assert.equal(result.activation, 'delivery-rendering');
  assert.equal(result.candidateRecords.length, 1);
  assert.equal(result.deliveryRecords.length, 1);
  assert.match(result.manifestKey, /^agid-chinese-place-name-intake-v2:/);
});

test('keeps reference-only batches out of the delivery index', () => {
  const result = intakeChineseRegionalPlaceNameBatch(syntheticBatch('HK'), {
    asOf: '2026-07-25',
  });

  assert.equal(result.status, 'accepted');
  if (result.status !== 'accepted') return;
  assert.equal(result.activation, 'candidate-only');
  assert.equal(result.candidateRecords.length, 1);
  assert.deepEqual(result.deliveryRecords, []);
});

test('rejects stale source reviews and mismatched declared counts', () => {
  const batch = syntheticBatch('TW');
  const result = intakeChineseRegionalPlaceNameBatch({
    ...batch,
    recordCount: 2,
    source: {
      ...batch.source,
      checkedOn: '2024-01-01',
    },
  }, {
    asOf: '2026-07-25',
    maxSourceAgeDays: 400,
  });

  assert.equal(result.status, 'rejected');
  if (result.status !== 'rejected') return;
  assert.ok(result.issues.some(issue => issue.includes('recordCount')));
  assert.ok(result.issues.some(issue => issue.includes('source review is stale')));
});

test('rejects insecure or stale official correction routes', () => {
  const batch = syntheticBatch('TW');
  const result = intakeChineseRegionalPlaceNameBatch({
    ...batch,
    source: {
      ...batch.source,
      correctionUrl: 'http://example.invalid/corrections',
      correctionCheckedOn: '2024-01-01',
    },
  }, {
    asOf: '2026-07-25',
    maxSourceAgeDays: 400,
  });

  assert.equal(result.status, 'rejected');
  if (result.status !== 'rejected') return;
  assert.ok(result.issues.some(issue =>
    issue.includes('HTTPS source, terms, and correction URLs are required')));
  assert.ok(result.issues.some(issue => issue.includes('correction route review is stale')));
});

test('rejects forbidden location fields and existing ID collisions', () => {
  const batch = syntheticBatch('TW');
  const first = batch.records[0];
  const result = intakeChineseRegionalPlaceNameBatch({
    ...batch,
    records: [
      {
        ...first,
        id: CHINESE_REGIONAL_PLACE_NAME_RECORDS.find(item => item.countryCode === 'TW')!.id,
        coordinates: [0, 0],
      } as typeof first,
    ],
  }, {
    asOf: '2026-07-25',
  });

  assert.equal(result.status, 'rejected');
  if (result.status !== 'rejected') return;
  assert.ok(result.issues.some(issue => issue.includes('coordinates')));
  assert.ok(result.issues.some(issue => issue.includes('missing or duplicate')));
});

test('reports aggregate-only quality for country-scoped Chinese readings', () => {
  const report = evaluateChineseRegionalPlaceNameHoldout({
    vectors: [
      {
        id: 'cn-established-reading',
        countryCode: 'CN',
        nativeName: '廈門市',
        expected: { status: 'resolved', englishName: 'Xiamen' },
      },
      {
        id: 'tw-established-reading',
        countryCode: 'TW',
        nativeName: '高雄市',
        expected: { status: 'resolved', englishName: 'Kaohsiung City' },
      },
      {
        id: 'hk-cantonese-reading',
        countryCode: 'HK',
        nativeName: '沙田',
        expected: { status: 'resolved', englishName: 'Sha Tin' },
      },
      {
        id: 'wrong-region-must-defer',
        countryCode: 'HK',
        nativeName: '廈門市',
        expected: { status: 'deferred' },
      },
      {
        id: 'unknown-name-must-defer',
        countryCode: 'TW',
        nativeName: '未知測試地',
        expected: { status: 'deferred' },
      },
    ],
  });

  assert.equal(report.schemaVersion, CHINESE_PLACE_NAME_HOLDOUT_SCHEMA_VERSION);
  assert.equal(report.total, 5);
  assert.equal(report.correct, 5);
  assert.equal(report.unsafeAutomaticResolutions, 0);
  assert.equal(report.unexpectedDeferrals, 0);
  assert.equal(report.accuracy, 1);
  assert.equal(report.safeDeferralRate, 1);
  assert.deepEqual(report.countrySummaries, [
    {
      countryCode: 'CN',
      total: 1,
      resolvedExpected: 1,
      deferredExpected: 0,
      correct: 1,
      unsafeAutomaticResolutions: 0,
    },
    {
      countryCode: 'HK',
      total: 2,
      resolvedExpected: 1,
      deferredExpected: 1,
      correct: 2,
      unsafeAutomaticResolutions: 0,
    },
    {
      countryCode: 'TW',
      total: 2,
      resolvedExpected: 1,
      deferredExpected: 1,
      correct: 2,
      unsafeAutomaticResolutions: 0,
    },
  ]);
  assert.equal('vectors' in report, false);
  assert.equal('outcomes' in report, false);
  assert.doesNotMatch(JSON.stringify(report), /廈門|高雄|沙田|未知/);
});

test('counts wrong automatic readings as unsafe instead of merely inaccurate', () => {
  const report = evaluateChineseRegionalPlaceNameHoldout({
    vectors: [
      {
        id: 'wrong-expected-reading',
        countryCode: 'HK',
        nativeName: '沙田',
        expected: { status: 'resolved', englishName: 'Shatian' },
      },
      {
        id: 'unexpected-resolution',
        countryCode: 'CN',
        nativeName: '廣州',
        expected: { status: 'deferred' },
      },
    ],
  });

  assert.equal(report.correct, 0);
  assert.equal(report.incorrect, 2);
  assert.equal(report.unsafeAutomaticResolutions, 2);
  assert.equal(report.safeDeferralRate, 0);
});

test('rejects sensitive holdout fields and duplicate vector IDs before evaluation', () => {
  const sensitiveVector = {
    id: 'sensitive',
    countryCode: 'TW',
    nativeName: '測試鎮',
    expected: { status: 'deferred' },
    coordinates: [0, 0],
  };
  assert.throws(
    () => evaluateChineseRegionalPlaceNameHoldout({
      vectors: [sensitiveVector] as never,
    }),
    /forbidden fields/,
  );

  const duplicate = {
    id: 'duplicate',
    countryCode: 'TW' as const,
    nativeName: '測試鎮',
    expected: { status: 'deferred' as const },
  };
  assert.throws(
    () => evaluateChineseRegionalPlaceNameHoldout({
      vectors: [duplicate, duplicate],
    }),
    /unique and non-empty/,
  );
});

test('rejects holdout sample inflation through normalized duplicate cases', () => {
  assert.throws(
    () => evaluateChineseRegionalPlaceNameHoldout({
      vectors: [
        {
          id: 'reading-case-one',
          countryCode: 'CN',
          nativeName: '廣州',
          expected: { status: 'resolved', englishName: 'Guangzhou' },
        },
        {
          id: 'reading-case-two',
          countryCode: 'CN',
          nativeName: ' 廣州 ',
          expected: { status: 'deferred' },
        },
      ],
    }),
    /unique country and normalized input fingerprints/,
  );
  assert.throws(
    () => evaluateChinesePlaceNameSuggestionHoldout({
      vectors: [
        {
          id: 'suggestion-case-one',
          countryCode: 'HK',
          nativeName: '沙曰',
          expected: { status: 'suggested', recordId: 'hk-sha-tin' },
        },
        {
          id: 'suggestion-case-two',
          countryCode: 'HK',
          nativeName: ' 沙曰 ',
          expected: { status: 'no-suggestion' },
        },
      ],
    }),
    /unique country and normalized input fingerprints/,
  );
  assert.throws(
    () => evaluateChineseRegionalPlaceNameHoldout({
      vectors: [
        {
          id: 'empty-reading-case',
          countryCode: 'TW',
          nativeName: ' ',
          expected: { status: 'deferred' },
        },
      ],
    }),
    /nativeName must be non-empty/,
  );
});

function independentSyntheticHoldoutPack() {
  const sources = [...new Map(
    CHINESE_REGIONAL_PLACE_NAME_RECORDS
      .filter(item => item.countryCode === 'CN' || item.countryCode === 'TW')
      .map(item => [JSON.stringify(item.source), item.source]),
  ).values()];
  return buildChineseRegionalPlaceNameHoldoutPack({
    fixtureId: 'greater-china-independent-synthetic-v1',
    fixtureVersion: '2026-07-25.1',
    createdAt: '2026-07-25T14:45:00.000Z',
    curatorId: 'independent-fixture-curator',
    sources,
    vectors: [
      {
        id: 'pack-cn-established',
        countryCode: 'CN',
        nativeName: '廣州',
        expected: { status: 'resolved', englishName: 'Guangzhou' },
      },
      {
        id: 'pack-tw-safe-deferral',
        countryCode: 'TW',
        nativeName: '未知測試地',
        expected: { status: 'deferred' },
      },
    ],
    suggestionVectors: suggestionHoldoutVectors(),
  });
}

test('evaluates a versioned holdout pack with curator and evaluator separation', () => {
  const pack = independentSyntheticHoldoutPack();
  const report = evaluateChineseRegionalPlaceNameHoldoutPack({
    pack,
    evaluatorId: 'agid-local-evaluator-v1',
  });

  assert.equal(pack.version, CHINESE_PLACE_NAME_HOLDOUT_PACK_VERSION);
  assert.equal(pack.suggestionVectorCount, 10);
  assert.match(pack.fixtureDigest, /^[0-9a-f]{64}$/);
  assert.equal(report.total, 2);
  assert.equal(
    report.evaluationEngineVersion,
    CHINESE_PLACE_NAME_EVALUATION_ENGINE_VERSION,
  );
  assert.equal(report.correct, 2);
  assert.equal(report.fixture.fixtureDigest, pack.fixtureDigest);
  assert.equal(report.fixture.independenceVerified, true);
  assert.equal('vectors' in report, false);
  assert.doesNotMatch(JSON.stringify(report), /廣州|未知測試地/);
});

test('evaluates typo candidates from the same versioned independent pack', () => {
  const pack = independentSyntheticHoldoutPack();
  const report = evaluateChinesePlaceNameSuggestionHoldoutPack({
    pack,
    evaluatorId: 'agid-local-evaluator-v1',
    maxCandidates: 3,
  });
  const gate = assessChinesePlaceNameSuggestionHoldout(report, {
    requiredCountryCodes: ['CN', 'TW', 'HK', 'MO', 'SG'],
    minimumTotal: 10,
    minimumPerCountry: 2,
    minimumExpectedSuggestionsPerCountry: 0,
    minimumExpectedNoSuggestionsPerCountry: 0,
    minimumTop1Accuracy: 1,
    minimumTopKAccuracy: 1,
    minimumSafeNoSuggestionRate: 1,
    maximumFalseSuggestionCases: 0,
  });

  assert.equal(report.total, 10);
  assert.equal(
    report.evaluationEngineVersion,
    CHINESE_PLACE_NAME_EVALUATION_ENGINE_VERSION,
  );
  assert.equal(report.top1Accuracy, 1);
  assert.equal(report.fixture.fixtureDigest, pack.fixtureDigest);
  assert.equal(report.fixture.independenceVerified, true);
  assert.equal(gate.status, 'passed');
  assert.equal(gate.version, CHINESE_PLACE_NAME_SUGGESTION_QUALITY_GATE_VERSION);
  assert.deepEqual(gate.policy.requiredCountryCodes, ['CN', 'HK', 'MO', 'SG', 'TW']);
  assert.equal(gate.automaticCorrectionEnabled, false);
  assert.equal('vectors' in report, false);
  assert.doesNotMatch(JSON.stringify(report), /廈閅|市庯|沙曰|氹子|牛車永/);
});

test('rejects modified holdout packs and self-evaluation', () => {
  const pack = independentSyntheticHoldoutPack();
  const tampered = {
    ...pack,
    vectors: [
      ...pack.vectors,
      {
        id: 'injected',
        countryCode: 'HK' as const,
        nativeName: '沙田',
        expected: { status: 'resolved' as const, englishName: 'Sha Tin' },
      },
    ],
  };
  assert.throws(
    () => evaluateChineseRegionalPlaceNameHoldoutPack({
      pack: tampered,
      evaluatorId: 'agid-local-evaluator-v1',
    }),
    /fixtureDigest: mismatch/,
  );
  assert.throws(
    () => evaluateChineseRegionalPlaceNameHoldoutPack({
      pack,
      evaluatorId: pack.curatorId,
    }),
    /curator must differ/,
  );
});

test('blocks a tiny perfect holdout until country-volume gates are met', () => {
  const holdout = evaluateChineseRegionalPlaceNameHoldout({
    vectors: [
      {
        id: 'small-cn',
        countryCode: 'CN',
        nativeName: '廣州',
        expected: { status: 'resolved', englishName: 'Guangzhou' },
      },
      {
        id: 'small-unknown',
        countryCode: 'TW',
        nativeName: '未知測試地',
        expected: { status: 'deferred' },
      },
    ],
  });
  const gate = assessChineseRegionalPlaceNameHoldout(holdout);

  assert.equal(gate.version, CHINESE_PLACE_NAME_QUALITY_GATE_VERSION);
  assert.deepEqual(gate.policy.requiredCountryCodes, ['CN', 'HK', 'MO', 'SG', 'TW']);
  assert.equal(gate.status, 'blocked');
  assert.equal(gate.eligibleForIndependentReview, false);
  assert.equal(gate.checks.find(check => check.id === 'accuracy')?.status, 'passed');
  assert.equal(gate.checks.find(check => check.id === 'minimum-total')?.status, 'blocked');
  assert.equal(gate.checks.find(check => check.id === 'country-coverage')?.status, 'blocked');
  assert.equal(gate.postalLookupEnabled, false);
  assert.equal(gate.addressValidationEnabled, false);
  assert.equal(gate.deliveryClaimsEnabled, false);
});

test('passes only the synthetic quality boundary and still requires independent review', () => {
  const holdout = evaluateChineseRegionalPlaceNameHoldout({
    vectors: [
      {
        id: 'quality-cn',
        countryCode: 'CN',
        nativeName: '廣州',
        expected: { status: 'resolved', englishName: 'Guangzhou' },
      },
      {
        id: 'quality-tw',
        countryCode: 'TW',
        nativeName: '未知測試地',
        expected: { status: 'deferred' },
      },
    ],
  });
  const gate = assessChineseRegionalPlaceNameHoldout(holdout, {
    requiredCountryCodes: ['CN', 'TW'],
    minimumTotal: 2,
    minimumPerCountry: 1,
    minimumResolvedPerCountry: 0,
    minimumDeferredPerCountry: 0,
    minimumAccuracy: 1,
    minimumSafeDeferralRate: 1,
    maximumUnsafeAutomaticResolutions: 0,
  });

  assert.equal(gate.status, 'passed');
  assert.equal(gate.eligibleForIndependentReview, true);
  assert.ok(gate.checks.every(check => check.status === 'passed'));
  assert.equal(gate.deliveryClaimsEnabled, false);
  assert.match(gate.nonClaim, /independent review only/);
});

test('blocks reading holdouts that contain only safe deferrals', () => {
  const holdout = evaluateChineseRegionalPlaceNameHoldout({
    records: [],
    vectors: [
      {
        id: 'cn-deferral-one',
        countryCode: 'CN',
        nativeName: '未知甲地',
        expected: { status: 'deferred' },
      },
      {
        id: 'cn-deferral-two',
        countryCode: 'CN',
        nativeName: '未知乙地',
        expected: { status: 'deferred' },
      },
      {
        id: 'tw-deferral-one',
        countryCode: 'TW',
        nativeName: '未知丙地',
        expected: { status: 'deferred' },
      },
      {
        id: 'tw-deferral-two',
        countryCode: 'TW',
        nativeName: '未知丁地',
        expected: { status: 'deferred' },
      },
    ],
  });
  const gate = assessChineseRegionalPlaceNameHoldout(holdout, {
    requiredCountryCodes: ['CN', 'TW'],
    minimumTotal: 4,
    minimumPerCountry: 2,
    minimumResolvedPerCountry: 1,
    minimumDeferredPerCountry: 1,
    minimumAccuracy: 1,
    minimumSafeDeferralRate: 1,
    maximumUnsafeAutomaticResolutions: 0,
  });

  assert.equal(holdout.accuracy, 1);
  assert.equal(gate.status, 'blocked');
  assert.equal(
    gate.checks.find(check => check.id === 'resolved-coverage')?.status,
    'blocked',
  );
  assert.equal(
    gate.checks.find(check => check.id === 'deferred-coverage')?.status,
    'passed',
  );
  assert.equal(gate.eligibleForIndependentReview, false);
});

test('rejects policies that can hide missing country coverage', () => {
  assert.equal(DEFAULT_CHINESE_PLACE_NAME_QUALITY_POLICY.minimumTotal, 500);
  assert.equal(DEFAULT_CHINESE_PLACE_NAME_QUALITY_POLICY.minimumResolvedPerCountry, 50);
  assert.equal(DEFAULT_CHINESE_PLACE_NAME_QUALITY_POLICY.minimumDeferredPerCountry, 50);
  assert.throws(
    () => assessChineseRegionalPlaceNameHoldout(
      evaluateChineseRegionalPlaceNameHoldout({ vectors: [] }),
      {
        requiredCountryCodes: ['CN', 'TW'],
        minimumTotal: 1,
        minimumPerCountry: 1,
        minimumResolvedPerCountry: 1,
        minimumDeferredPerCountry: 1,
        minimumAccuracy: 0.99,
        minimumSafeDeferralRate: 1,
        maximumUnsafeAutomaticResolutions: 0,
      },
    ),
    /quality policy is invalid/,
  );
});

function passingSyntheticQualityReports() {
  const holdoutPack = independentSyntheticHoldoutPack();
  const holdoutReport = evaluateChineseRegionalPlaceNameHoldoutPack({
    pack: holdoutPack,
    evaluatorId: 'agid-local-evaluator-v1',
  });
  const qualityGateReport = assessChineseRegionalPlaceNameHoldout(
    holdoutReport,
    {
      requiredCountryCodes: ['CN', 'TW'],
      minimumTotal: 2,
      minimumPerCountry: 1,
      minimumResolvedPerCountry: 0,
      minimumDeferredPerCountry: 0,
      minimumAccuracy: 1,
      minimumSafeDeferralRate: 1,
      maximumUnsafeAutomaticResolutions: 0,
    },
  );
  const suggestionHoldoutReport = evaluateChinesePlaceNameSuggestionHoldoutPack({
    pack: holdoutPack,
    evaluatorId: 'agid-local-evaluator-v1',
    maxCandidates: 3,
  });
  const suggestionQualityGateReport = assessChinesePlaceNameSuggestionHoldout(
    suggestionHoldoutReport,
    {
      requiredCountryCodes: ['CN', 'TW', 'HK', 'MO', 'SG'],
      minimumTotal: 10,
      minimumPerCountry: 2,
      minimumExpectedSuggestionsPerCountry: 0,
      minimumExpectedNoSuggestionsPerCountry: 0,
      minimumTop1Accuracy: 1,
      minimumTopKAccuracy: 1,
      minimumSafeNoSuggestionRate: 1,
      maximumFalseSuggestionCases: 0,
    },
  );
  const correctionEndpointEvidence = [...new Map(
    CHINESE_REGIONAL_PLACE_NAME_RECORDS.map(record => [
      record.source.correctionUrl,
      record.source,
    ]),
  ).values()].map((source, index): ChinesePlaceNameCorrectionEndpointEvidence =>
    buildChinesePlaceNameCorrectionEndpointEvidence({
    correctionUrl: source.correctionUrl,
    observedAt: '2026-07-25T12:00:00.000Z',
    observerId: 'synthetic-correction-monitor',
    httpStatus: 200,
    responseContentType: 'text/html; charset=utf-8',
    responseContentSha256: String(index + 1).repeat(64),
    captureMethod: 'external-http-metadata-only' as const,
    responseBodyStored: false as const,
    addressPayloadIncluded: false as const,
  }));
  return {
    holdoutReport,
    qualityGateReport,
    suggestionHoldoutReport,
    suggestionQualityGateReport,
    correctionEndpointEvidence,
    holdoutPack,
  };
}

test('binds aggregate quality evidence to a deterministic SHA-256 digest', () => {
  const reports = passingSyntheticQualityReports();
  const input = {
    reportId: 'greater-china-synthetic-quality-2026-07',
    fixtureVersion: reports.holdoutPack.fixtureVersion,
    evaluatedAt: '2026-07-25T14:46:00.000Z',
    evaluatorId: 'agid-local-evaluator-v1',
    ...reports,
  };
  const first = buildChineseRegionalPlaceNameQualityEvidence(input);
  const second = buildChineseRegionalPlaceNameQualityEvidence(input);
  const verification = verifyChineseRegionalPlaceNameQualityEvidence(first, {
    evaluatedRecords: CHINESE_REGIONAL_PLACE_NAME_RECORDS,
    holdoutPack: reports.holdoutPack,
    asOf: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(first.version, CHINESE_PLACE_NAME_QUALITY_EVIDENCE_VERSION);
  assert.equal(
    first.evaluationEngineVersion,
    CHINESE_PLACE_NAME_EVALUATION_ENGINE_VERSION,
  );
  assert.equal(
    first.digestAlgorithm,
    CHINESE_PLACE_NAME_QUALITY_DIGEST_ALGORITHM,
  );
  assert.match(first.reportDigest, /^[0-9a-f]{64}$/);
  assert.equal(first.reportDigest, second.reportDigest);
  assert.equal(first.evaluatedRecordSet.version, CHINESE_PLACE_NAME_RECORD_SET_VERSION);
  assert.equal(first.evaluatedRecordSet.recordCount, CHINESE_REGIONAL_PLACE_NAME_RECORDS.length);
  assert.equal(first.evaluatedRecordSet.placeNameValuesIncluded, false);
  assert.equal(first.suggestionHoldoutReport.total, 10);
  assert.equal(first.suggestionQualityGateReport.status, 'passed');
  assert.equal(
    first.suggestionHoldoutReport.fixture.fixtureDigest,
    reports.holdoutPack.fixtureDigest,
  );
  assert.doesNotMatch(
    JSON.stringify(first),
    /廈閅|市庯|沙曰|氹子|牛車永/,
  );
  assert.equal(first.signatureStatus, 'not-attached');
  assert.equal(verification.valid, true);
  assert.equal(verification.recordSetVerified, true);
  assert.equal(verification.holdoutPackVerified, true);
  assert.equal(verification.productionPolicyVerified, false);
  assert.equal(verification.freshnessVerified, true);
  assert.equal(verification.correctionEndpointsVerified, true);
  assert.equal(verification.eligibleForExternalSignature, false);
  assert.equal(verification.independentReviewComplete, false);
  assert.equal(verification.deliveryClaimsEnabled, false);
});

test('recognizes production policy floors while keeping undersized samples blocked', () => {
  const reports = passingSyntheticQualityReports();
  const productionPolicyReports = {
    ...reports,
    qualityGateReport: assessChineseRegionalPlaceNameHoldout(
      reports.holdoutReport,
    ),
    suggestionQualityGateReport: assessChinesePlaceNameSuggestionHoldout(
      reports.suggestionHoldoutReport,
    ),
  };
  const evidence = buildChineseRegionalPlaceNameQualityEvidence({
    reportId: 'greater-china-production-policy-floor-test',
    fixtureVersion: reports.holdoutPack.fixtureVersion,
    evaluatedAt: '2026-07-25T14:46:00.000Z',
    evaluatorId: 'agid-local-evaluator-v1',
    ...productionPolicyReports,
  });
  const verification = verifyChineseRegionalPlaceNameQualityEvidence(evidence, {
    evaluatedRecords: CHINESE_REGIONAL_PLACE_NAME_RECORDS,
    holdoutPack: reports.holdoutPack,
    asOf: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.productionPolicyVerified, true);
  assert.equal(evidence.qualityGateReport.status, 'blocked');
  assert.equal(evidence.suggestionQualityGateReport.status, 'blocked');
  assert.equal(verification.eligibleForExternalSignature, false);
});

test('blocks external signing when one evaluated correction endpoint lacks evidence', () => {
  const reports = passingSyntheticQualityReports();
  const evidence = buildChineseRegionalPlaceNameQualityEvidence({
    reportId: 'greater-china-missing-correction-evidence-test',
    fixtureVersion: reports.holdoutPack.fixtureVersion,
    evaluatedAt: '2026-07-25T14:46:00.000Z',
    evaluatorId: 'agid-local-evaluator-v1',
    ...reports,
  });
  const tampered = {
    ...evidence,
    correctionEndpointEvidence: evidence.correctionEndpointEvidence.slice(1),
  };
  const verification = verifyChineseRegionalPlaceNameQualityEvidence(tampered, {
    evaluatedRecords: CHINESE_REGIONAL_PLACE_NAME_RECORDS,
    holdoutPack: reports.holdoutPack,
    asOf: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.correctionEndpointsVerified, false);
  assert.equal(verification.freshnessVerified, false);
  assert.equal(verification.eligibleForExternalSignature, false);
  assert.ok(verification.issues.some(issue => issue.includes('missing evidence')));
  assert.ok(verification.issues.some(issue => issue.includes('reportDigest: mismatch')));
});

test('expires quality evidence and source reviews relative to verification time', () => {
  const reports = passingSyntheticQualityReports();
  const evidence = buildChineseRegionalPlaceNameQualityEvidence({
    reportId: 'greater-china-expired-evidence-test',
    fixtureVersion: reports.holdoutPack.fixtureVersion,
    evaluatedAt: '2026-07-25T14:46:00.000Z',
    evaluatorId: 'agid-local-evaluator-v1',
    ...reports,
  });
  const verification = verifyChineseRegionalPlaceNameQualityEvidence(evidence, {
    evaluatedRecords: CHINESE_REGIONAL_PLACE_NAME_RECORDS,
    holdoutPack: reports.holdoutPack,
    asOf: '2027-09-01T00:00:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.freshnessVerified, false);
  assert.equal(verification.eligibleForExternalSignature, false);
  assert.ok(verification.issues.some(issue => issue.includes('older than 90 days')));
  assert.ok(verification.issues.some(issue => issue.includes('older than 400 days')));
});

test('rejects an unversioned evaluation engine before external signing', () => {
  const reports = passingSyntheticQualityReports();
  const evidence = buildChineseRegionalPlaceNameQualityEvidence({
    reportId: 'greater-china-engine-version-test',
    fixtureVersion: reports.holdoutPack.fixtureVersion,
    evaluatedAt: '2026-07-25T14:46:00.000Z',
    evaluatorId: 'agid-local-evaluator-v1',
    ...reports,
  });
  const tampered = {
    ...evidence,
    evaluationEngineVersion: 'unversioned-engine',
  } as unknown as typeof evidence;
  const verification = verifyChineseRegionalPlaceNameQualityEvidence(tampered, {
    evaluatedRecords: CHINESE_REGIONAL_PLACE_NAME_RECORDS,
    holdoutPack: reports.holdoutPack,
    asOf: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.eligibleForExternalSignature, false);
  assert.ok(verification.issues.some(issue => issue.includes('evaluationEngineVersion')));
  assert.ok(verification.issues.some(issue => issue.includes('reportDigest: mismatch')));
});

test('rejects tampered typo-candidate aggregates before external signing', () => {
  const reports = passingSyntheticQualityReports();
  const evidence = buildChineseRegionalPlaceNameQualityEvidence({
    reportId: 'greater-china-suggestion-tamper-test',
    fixtureVersion: reports.holdoutPack.fixtureVersion,
    evaluatedAt: '2026-07-25T14:46:00.000Z',
    evaluatorId: 'agid-local-evaluator-v1',
    ...reports,
  });
  const tampered = {
    ...evidence,
    suggestionHoldoutReport: {
      ...evidence.suggestionHoldoutReport,
      top1Correct: 0,
    },
  };
  const verification = verifyChineseRegionalPlaceNameQualityEvidence(tampered, {
    evaluatedRecords: CHINESE_REGIONAL_PLACE_NAME_RECORDS,
    holdoutPack: reports.holdoutPack,
    asOf: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.eligibleForExternalSignature, false);
  assert.ok(verification.issues.some(issue => issue.includes('suggestionHoldoutReport')));
  assert.ok(verification.issues.some(issue => issue.includes('reportDigest: mismatch')));
});

test('rejects internally consistent suggestion aggregates not reproduced by the holdout run', () => {
  const reports = passingSyntheticQualityReports();
  const forgedSuggestionReport = {
    ...reports.suggestionHoldoutReport,
    top1Correct: 4,
    topKCorrect: 4,
    missedSuggestionCases: 1,
    top1Accuracy: 0.8,
    topKAccuracy: 0.8,
    countrySummaries: reports.suggestionHoldoutReport.countrySummaries.map(summary => (
      summary.countryCode === 'CN'
        ? { ...summary, top1Correct: 0 }
        : summary
    )),
  };
  const forgedGate = assessChinesePlaceNameSuggestionHoldout(
    forgedSuggestionReport,
    {
      requiredCountryCodes: ['CN', 'TW', 'HK', 'MO', 'SG'],
      minimumTotal: 10,
      minimumPerCountry: 2,
      minimumExpectedSuggestionsPerCountry: 0,
      minimumExpectedNoSuggestionsPerCountry: 0,
      minimumTop1Accuracy: 0.8,
      minimumTopKAccuracy: 0.8,
      minimumSafeNoSuggestionRate: 1,
      maximumFalseSuggestionCases: 0,
    },
  );

  assert.throws(
    () => buildChineseRegionalPlaceNameQualityEvidence({
      reportId: 'greater-china-forged-suggestion-aggregate',
      fixtureVersion: reports.holdoutPack.fixtureVersion,
      evaluatedAt: '2026-07-25T14:46:00.000Z',
      evaluatorId: 'agid-local-evaluator-v1',
      ...reports,
      suggestionHoldoutReport: forgedSuggestionReport,
      suggestionQualityGateReport: forgedGate,
    }),
    /suggestion.*evaluation mismatch/,
  );
});

test('detects aggregate report tampering before external signing', () => {
  const reports = passingSyntheticQualityReports();
  const evidence = buildChineseRegionalPlaceNameQualityEvidence({
    reportId: 'greater-china-tamper-test',
    fixtureVersion: reports.holdoutPack.fixtureVersion,
    evaluatedAt: '2026-07-25T14:46:00.000Z',
    evaluatorId: 'agid-local-evaluator-v1',
    ...reports,
  });
  const tampered = {
    ...evidence,
    holdoutReport: {
      ...evidence.holdoutReport,
      accuracy: 0.5,
    },
  };
  const verification = verifyChineseRegionalPlaceNameQualityEvidence(tampered, {
    evaluatedRecords: CHINESE_REGIONAL_PLACE_NAME_RECORDS,
    holdoutPack: reports.holdoutPack,
    asOf: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.eligibleForExternalSignature, false);
  assert.ok(verification.issues.some(issue => issue.includes('aggregate counts')));
  assert.ok(verification.issues.some(issue => issue.includes('reportDigest: mismatch')));
});

test('rejects internally consistent reading aggregates not reproduced by the holdout run', () => {
  const reports = passingSyntheticQualityReports();
  const forgedHoldoutReport = {
    ...reports.holdoutReport,
    correct: 1,
    incorrect: 1,
    accuracy: 0.5,
    unsafeAutomaticResolutions: 1,
    countrySummaries: reports.holdoutReport.countrySummaries.map(summary => (
      summary.countryCode === 'CN'
        ? { ...summary, correct: 0, unsafeAutomaticResolutions: 1 }
        : summary
    )),
  };
  const forgedGate = assessChineseRegionalPlaceNameHoldout(
    forgedHoldoutReport,
    {
      requiredCountryCodes: ['CN', 'TW'],
      minimumTotal: 2,
      minimumPerCountry: 1,
      minimumResolvedPerCountry: 0,
      minimumDeferredPerCountry: 0,
      minimumAccuracy: 0.5,
      minimumSafeDeferralRate: 1,
      maximumUnsafeAutomaticResolutions: 1,
    },
  );

  assert.throws(
    () => buildChineseRegionalPlaceNameQualityEvidence({
      reportId: 'greater-china-forged-reading-aggregate',
      fixtureVersion: reports.holdoutPack.fixtureVersion,
      evaluatedAt: '2026-07-25T14:46:00.000Z',
      evaluatorId: 'agid-local-evaluator-v1',
      ...reports,
      holdoutReport: forgedHoldoutReport,
      qualityGateReport: forgedGate,
    }),
    /evaluation mismatch/,
  );
});

test('rejects malformed quality-evidence metadata without handling signing keys', () => {
  assert.throws(
    () => buildChineseRegionalPlaceNameQualityEvidence({
      reportId: 'bad id',
      fixtureVersion: '',
      evaluatedAt: '2026-07-25',
      evaluatorId: '',
      ...passingSyntheticQualityReports(),
    }),
    /quality evidence/,
  );
});

test('rejects typo gate policies whose displayed checks were not recomputed', () => {
  const reports = passingSyntheticQualityReports();
  assert.throws(
    () => buildChineseRegionalPlaceNameQualityEvidence({
      reportId: 'greater-china-suggestion-policy-mismatch',
      fixtureVersion: reports.holdoutPack.fixtureVersion,
      evaluatedAt: '2026-07-25T14:46:00.000Z',
      evaluatorId: 'agid-local-evaluator-v1',
      ...reports,
      suggestionQualityGateReport: {
        ...reports.suggestionQualityGateReport,
        policy: {
          ...reports.suggestionQualityGateReport.policy,
          minimumTop1Accuracy: 0,
        },
      },
    }),
    /suggestionQualityGateReport/,
  );
});

test('rejects reading gate policies whose displayed checks were not recomputed', () => {
  const reports = passingSyntheticQualityReports();
  assert.throws(
    () => buildChineseRegionalPlaceNameQualityEvidence({
      reportId: 'greater-china-reading-policy-mismatch',
      fixtureVersion: reports.holdoutPack.fixtureVersion,
      evaluatedAt: '2026-07-25T14:46:00.000Z',
      evaluatorId: 'agid-local-evaluator-v1',
      ...reports,
      qualityGateReport: {
        ...reports.qualityGateReport,
        policy: {
          ...reports.qualityGateReport.policy,
          minimumAccuracy: 0,
        },
      },
    }),
    /qualityGateReport/,
  );
});

const RFC_8032_EMPTY_MESSAGE_PUBLIC_KEY =
  'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';
const RFC_8032_EMPTY_MESSAGE_SIGNATURE =
  'e5564300c360ac729086e2cc806e828a'
  + '84877f1eb8e5d974d873e06522490155'
  + '5fb8821590a33bacc61e39701cf9b46b'
  + 'd25bf5f0595bbe24655141438e7a100b';

function hexToBase64Url(value: string) {
  return Buffer.from(value, 'hex').toString('base64url');
}

function publicReviewRegistry(
  status: 'trusted' | 'revoked' = 'trusted',
): ChinesePlaceNameReviewerKeyRegistry {
  return {
    version: CHINESE_PLACE_NAME_REVIEW_KEY_REGISTRY_VERSION,
    keys: [
      {
        keyId: 'independent-reviewer-rfc-vector-key',
        reviewerId: 'independent-quality-lab',
        algorithm: 'Ed25519' as const,
        purpose: 'chinese-place-name-quality-review' as const,
        publicKeyBase64Url: hexToBase64Url(RFC_8032_EMPTY_MESSAGE_PUBLIC_KEY),
        status,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2027-01-01T00:00:00.000Z',
        reviewedAt: '2026-07-01T00:00:00.000Z',
        reviewBy: '2026-10-01T00:00:00.000Z',
        registryUrl: 'https://example.invalid/agid-review-keys',
        revocationUrl: 'https://example.invalid/agid-review-keys/revocations',
      },
    ],
  };
}

function publicCorrectionMonitorRegistry(
  status: 'trusted' | 'revoked' = 'trusted',
  monitorId = 'independent-correction-monitor',
): ChinesePlaceNameCorrectionMonitorKeyRegistry {
  return {
    version: CHINESE_PLACE_NAME_CORRECTION_MONITOR_KEY_REGISTRY_VERSION,
    keys: [
      {
        keyId: 'correction-monitor-rfc-vector-key',
        monitorId,
        algorithm: 'Ed25519',
        purpose: 'correction-endpoint-observation',
        publicKeyBase64Url: hexToBase64Url(RFC_8032_EMPTY_MESSAGE_PUBLIC_KEY),
        status,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2027-01-01T00:00:00.000Z',
        reviewedAt: '2026-07-01T00:00:00.000Z',
        reviewBy: '2026-10-01T00:00:00.000Z',
        registryUrl: 'https://example.invalid/agid-correction-monitor-keys',
        revocationUrl: 'https://example.invalid/agid-correction-monitor-keys/revocations',
      },
    ],
  };
}

test('verifies an RFC 8032 Ed25519 public test vector without a private key', async () => {
  assert.equal(await verifyEd25519DetachedSignature({
    message: '',
    publicKeyBase64Url: hexToBase64Url(RFC_8032_EMPTY_MESSAGE_PUBLIC_KEY),
    signatureBase64Url: hexToBase64Url(RFC_8032_EMPTY_MESSAGE_SIGNATURE),
  }), true);
  assert.equal(await verifyEd25519DetachedSignature({
    message: 'changed',
    publicKeyBase64Url: hexToBase64Url(RFC_8032_EMPTY_MESSAGE_PUBLIC_KEY),
    signatureBase64Url: hexToBase64Url(RFC_8032_EMPTY_MESSAGE_SIGNATURE),
  }), false);
});

test('binds correction observation signatures to a trusted monitor identity', async () => {
  const source = CHINESE_REGIONAL_PLACE_NAME_RECORDS.find(
    record => record.countryCode === 'TW',
  )!.source;
  const evidence = buildChinesePlaceNameCorrectionEndpointEvidence({
    correctionUrl: source.correctionUrl,
    observedAt: '2026-07-25T12:00:00.000Z',
    observerId: 'independent-correction-monitor',
    httpStatus: 200,
    responseContentType: 'text/html',
    responseContentSha256: 'c'.repeat(64),
    captureMethod: 'external-http-metadata-only',
    responseBodyStored: false,
    addressPayloadIncluded: false,
  });
  const result = await verifyChinesePlaceNameCorrectionEndpointSignature({
    source,
    evidence,
    registry: publicCorrectionMonitorRegistry(),
    signature: {
      algorithm: 'Ed25519',
      keyId: 'correction-monitor-rfc-vector-key',
      signedAt: '2026-07-25T12:01:00.000Z',
      signatureBase64Url: hexToBase64Url(RFC_8032_EMPTY_MESSAGE_SIGNATURE),
    },
    asOf: '2026-07-25T12:02:00.000Z',
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.evidenceValid, true);
  assert.equal(result.trustValid, true);
  assert.equal(result.signatureValid, false);
  assert.equal(result.monitorId, 'independent-correction-monitor');
  assert.ok(result.issues.some(issue =>
    issue.includes('cryptographic verification failed')));
});

test('blocks revoked correction monitor keys before signature verification', async () => {
  const source = CHINESE_REGIONAL_PLACE_NAME_RECORDS.find(
    record => record.countryCode === 'TW',
  )!.source;
  const evidence = buildChinesePlaceNameCorrectionEndpointEvidence({
    correctionUrl: source.correctionUrl,
    observedAt: '2026-07-25T12:00:00.000Z',
    observerId: 'independent-correction-monitor',
    httpStatus: 200,
    responseContentType: 'text/html',
    responseContentSha256: 'd'.repeat(64),
    captureMethod: 'external-http-metadata-only',
    responseBodyStored: false,
    addressPayloadIncluded: false,
  });
  const result = await verifyChinesePlaceNameCorrectionEndpointSignature({
    source,
    evidence,
    registry: publicCorrectionMonitorRegistry('revoked'),
    signature: {
      algorithm: 'Ed25519',
      keyId: 'correction-monitor-rfc-vector-key',
      signedAt: '2026-07-25T12:01:00.000Z',
      signatureBase64Url: hexToBase64Url(RFC_8032_EMPTY_MESSAGE_SIGNATURE),
    },
    asOf: '2026-07-25T12:02:00.000Z',
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.evidenceValid, true);
  assert.equal(result.trustValid, false);
  assert.equal(result.signatureValid, false);
  assert.ok(result.issues.some(issue => issue.includes('key is revoked')));
});

test('blocks independent quality review when endpoint signatures are missing', async () => {
  const reports = passingSyntheticQualityReports();
  const qualityEvidence = buildChineseRegionalPlaceNameQualityEvidence({
    reportId: 'greater-china-correction-signature-set-missing',
    fixtureVersion: reports.holdoutPack.fixtureVersion,
    evaluatedAt: '2026-07-25T14:46:00.000Z',
    evaluatorId: 'agid-local-evaluator-v1',
    ...reports,
  });
  const result = await verifyChinesePlaceNameCorrectionEndpointSignatureSet({
    qualityEvidence,
    signatures: [],
    registry: publicCorrectionMonitorRegistry(
      'trusted',
      'synthetic-correction-monitor',
    ),
    evaluatedRecords: CHINESE_REGIONAL_PLACE_NAME_RECORDS,
    holdoutPack: reports.holdoutPack,
    asOf: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.qualityEvidenceValid, true);
  assert.equal(result.expectedEndpointCount, 5);
  assert.equal(result.verifiedEndpointCount, 0);
  assert.equal(result.allEndpointsIndependentlyObserved, false);
  assert.equal(result.eligibleForIndependentQualityReview, false);
  assert.equal(result.deliveryClaimsEnabled, false);
  assert.equal(
    result.endpointSummaries.filter(summary =>
      summary.issues.includes('independent monitor signature is missing')).length,
    5,
  );
});

test('rejects a reused public test signature within the endpoint signature set', async () => {
  const reports = passingSyntheticQualityReports();
  const qualityEvidence = buildChineseRegionalPlaceNameQualityEvidence({
    reportId: 'greater-china-correction-signature-set-invalid',
    fixtureVersion: reports.holdoutPack.fixtureVersion,
    evaluatedAt: '2026-07-25T14:46:00.000Z',
    evaluatorId: 'agid-local-evaluator-v1',
    ...reports,
  });
  const endpointEvidence = qualityEvidence.correctionEndpointEvidence[0];
  const result = await verifyChinesePlaceNameCorrectionEndpointSignatureSet({
    qualityEvidence,
    signatures: [
      {
        correctionUrl: endpointEvidence.correctionUrl,
        evidenceDigest: endpointEvidence.evidenceDigest,
        signature: {
          algorithm: 'Ed25519',
          keyId: 'correction-monitor-rfc-vector-key',
          signedAt: '2026-07-25T15:00:00.000Z',
          signatureBase64Url: hexToBase64Url(RFC_8032_EMPTY_MESSAGE_SIGNATURE),
        },
      },
    ],
    registry: publicCorrectionMonitorRegistry(
      'trusted',
      'synthetic-correction-monitor',
    ),
    evaluatedRecords: CHINESE_REGIONAL_PLACE_NAME_RECORDS,
    holdoutPack: reports.holdoutPack,
    asOf: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.verifiedEndpointCount, 0);
  assert.equal(result.allEndpointsIndependentlyObserved, false);
  assert.ok(result.issues.some(issue =>
    issue.includes('cryptographic verification failed')));
  assert.equal(
    result.endpointSummaries.filter(summary => summary.status === 'rejected').length,
    5,
  );
});

test('blocks external signature when synthetic policies are below the production floor', async () => {
  const reports = passingSyntheticQualityReports();
  const evidence = buildChineseRegionalPlaceNameQualityEvidence({
    reportId: 'greater-china-external-review-test',
    fixtureVersion: reports.holdoutPack.fixtureVersion,
    evaluatedAt: '2026-07-25T14:46:00.000Z',
    evaluatorId: 'agid-local-evaluator-v1',
    ...reports,
  });
  const result = await verifyChinesePlaceNameIndependentReview({
    evidence,
    registry: publicReviewRegistry(),
    evaluatedRecords: CHINESE_REGIONAL_PLACE_NAME_RECORDS,
    holdoutPack: reports.holdoutPack,
    signature: {
      algorithm: 'Ed25519',
      keyId: 'independent-reviewer-rfc-vector-key',
      signedAt: '2026-07-25T15:00:00.000Z',
      signatureBase64Url: hexToBase64Url(RFC_8032_EMPTY_MESSAGE_SIGNATURE),
    },
    asOf: '2026-07-25T15:14:00.000Z',
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.digestValid, true);
  assert.equal(result.trustValid, true);
  assert.equal(result.signatureValid, false);
  assert.equal(result.independentReviewComplete, false);
  assert.equal(result.deliveryClaimsEnabled, false);
  assert.ok(result.issues.some(issue => issue.includes('not eligible for external signature')));
});

test('blocks revoked reviewer keys before cryptographic verification', async () => {
  const reports = passingSyntheticQualityReports();
  const evidence = buildChineseRegionalPlaceNameQualityEvidence({
    reportId: 'greater-china-revoked-review-test',
    fixtureVersion: reports.holdoutPack.fixtureVersion,
    evaluatedAt: '2026-07-25T14:46:00.000Z',
    evaluatorId: 'agid-local-evaluator-v1',
    ...reports,
  });
  const result = await verifyChinesePlaceNameIndependentReview({
    evidence,
    registry: publicReviewRegistry('revoked'),
    evaluatedRecords: CHINESE_REGIONAL_PLACE_NAME_RECORDS,
    holdoutPack: reports.holdoutPack,
    signature: {
      algorithm: 'Ed25519',
      keyId: 'independent-reviewer-rfc-vector-key',
      signedAt: '2026-07-25T15:00:00.000Z',
      signatureBase64Url: hexToBase64Url(RFC_8032_EMPTY_MESSAGE_SIGNATURE),
    },
    asOf: '2026-07-25T15:14:00.000Z',
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.trustValid, false);
  assert.equal(result.signatureValid, false);
  assert.ok(result.issues.some(issue => issue.includes('key is revoked')));
});

test('rejects quality evidence when the evaluated record set is substituted', () => {
  const reports = passingSyntheticQualityReports();
  const evidence = buildChineseRegionalPlaceNameQualityEvidence({
    reportId: 'greater-china-record-set-substitution-test',
    fixtureVersion: reports.holdoutPack.fixtureVersion,
    evaluatedAt: '2026-07-25T14:46:00.000Z',
    evaluatorId: 'agid-local-evaluator-v1',
    ...reports,
  });
  const result = verifyChineseRegionalPlaceNameQualityEvidence(evidence, {
    evaluatedRecords: CHINESE_REGIONAL_PLACE_NAME_RECORDS.slice(1),
    holdoutPack: reports.holdoutPack,
    asOf: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(result.valid, false);
  assert.equal(result.recordSetVerified, false);
  assert.equal(result.eligibleForExternalSignature, false);
  assert.ok(result.issues.some(issue => issue.includes('supplied records do not match')));
});

test('rejects quality evidence when the holdout pack is substituted', () => {
  const reports = passingSyntheticQualityReports();
  const evidence = buildChineseRegionalPlaceNameQualityEvidence({
    reportId: 'greater-china-holdout-pack-substitution-test',
    fixtureVersion: reports.holdoutPack.fixtureVersion,
    evaluatedAt: '2026-07-25T14:45:00.000Z',
    evaluatorId: 'agid-local-evaluator-v1',
    ...reports,
  });
  const substitutedPack = {
    ...reports.holdoutPack,
    fixtureId: 'substituted-holdout-pack',
  };
  const result = verifyChineseRegionalPlaceNameQualityEvidence(evidence, {
    evaluatedRecords: CHINESE_REGIONAL_PLACE_NAME_RECORDS,
    holdoutPack: substitutedPack,
    asOf: '2026-07-26T00:00:00.000Z',
  });

  assert.equal(result.valid, false);
  assert.equal(result.holdoutPackVerified, false);
  assert.equal(result.eligibleForExternalSignature, false);
  assert.ok(result.issues.some(issue => issue.includes('holdout pack')));
});
