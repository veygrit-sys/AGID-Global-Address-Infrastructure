import assert from 'node:assert/strict';
import test from 'node:test';
import type { CanonicalAddress } from './addressRendering';
import {
  calculateJapaneseLocalGovernmentCodeCheckDigit,
  isValidJapaneseLocalGovernmentCode,
  resolveJapaneseContextualReading,
  type JapaneseReadingSource,
} from './japaneseContextualReading';
import {
  JAPAN_ADDRESS_BASE_REGISTRY_SOURCE,
  JAPANESE_MUNICIPALITY_READING_ARTIFACT_SCOPE,
  digestJapaneseMunicipalityReadingRows,
  gateJapaneseMunicipalityReadingArtifact,
  gateJapaneseMunicipalityReadingReleaseTransition,
  ingestJapaneseMunicipalityReadings,
  type JapaneseMunicipalityReadingArtifactEvidence,
  type JapaneseMunicipalityReadingRow,
  type JapaneseMunicipalityReadingTransitionDeclaration,
} from './japaneseMunicipalityReadingIntake';

const readingSource: JapaneseReadingSource = {
  authority: 'Synthetic official-reading fixture authority',
  url: 'https://example.invalid/official-reading-fixture',
  termsUrl: 'https://example.invalid/official-reading-fixture/terms',
  version: 'synthetic-reading-v1',
  checkedOn: '2026-07-25',
  reuseStatus: 'approved-open-data',
  correctionPath: 'https://example.invalid/official-reading-fixture/corrections',
};

function row(
  overrides: Partial<JapaneseMunicipalityReadingRow> = {},
): JapaneseMunicipalityReadingRow {
  return {
    rowId: 'synthetic-municipality-1',
    municipalityCode: '990001',
    prefectureCode: '99',
    prefectureName: '試験県',
    municipalityName: '合成市',
    municipalityKana: 'ごうせいし',
    municipalityRomanized: 'Gosei-shi',
    readingSource,
    administrativeKeySource: JAPAN_ADDRESS_BASE_REGISTRY_SOURCE,
    ...overrides,
  };
}

function address(): CanonicalAddress {
  return {
    country_code: 'JP',
    country: '',
    state: '試験県',
    city: '合成市',
    district: '',
    subdistrict: '',
    suburb: '',
    road: '',
    house_number: '',
    building: '',
    postcode: '',
    poi: '',
  };
}

function artifact(
  rows: readonly JapaneseMunicipalityReadingRow[],
  overrides: Partial<JapaneseMunicipalityReadingArtifactEvidence> = {},
): JapaneseMunicipalityReadingArtifactEvidence {
  return {
    releaseId: 'synthetic-municipality-reading-v1',
    retrievedOn: '2026-07-25',
    rowCount: rows.length,
    canonicalRowsSha256: digestJapaneseMunicipalityReadingRows(rows),
    scope: JAPANESE_MUNICIPALITY_READING_ARTIFACT_SCOPE,
    ...overrides,
  };
}

test('imports municipality-only readings with dual official provenance', () => {
  const rows = [row()];
  const report = ingestJapaneseMunicipalityReadings({
    rows,
    artifact: artifact(rows),
  });

  assert.equal(report.artifactGate.accepted, true);
  assert.deepEqual(report.summary, {
    total: 1,
    accepted: 1,
    rejected: 0,
    duplicateAdministrativeKeys: 0,
    conflictingAdministrativeKeys: 0,
  });
  assert.equal(report.acceptedRecords[0].administrativeKey?.value, '990001');
  assert.equal(
    report.acceptedRecords[0].administrativeKey?.source.authority,
    'Digital Agency, Government of Japan',
  );

  const resolution = resolveJapaneseContextualReading({
    field: 'city',
    nativeName: '合成市',
    address: address(),
    records: report.acceptedRecords,
  });
  assert.equal(resolution.status, 'resolved');
  if (resolution.status === 'resolved') {
    assert.equal(resolution.romanizedName, 'Gosei-shi');
  }
});

test('validates the official modulus-11 local-government check digit', () => {
  assert.equal(calculateJapaneseLocalGovernmentCodeCheckDigit('01100'), '2');
  assert.equal(calculateJapaneseLocalGovernmentCodeCheckDigit('11201'), '1');
  assert.equal(isValidJapaneseLocalGovernmentCode('011002'), true);
  assert.equal(isValidJapaneseLocalGovernmentCode('112011'), true);
  assert.equal(isValidJapaneseLocalGovernmentCode('011009'), false);
  assert.equal(calculateJapaneseLocalGovernmentCodeCheckDigit('invalid'), null);
});

test('rejects a municipality row whose check digit is invalid', () => {
  const rows = [row({ municipalityCode: '990009' })];
  const report = ingestJapaneseMunicipalityReadings({
    rows,
    artifact: artifact(rows),
  });

  assert.equal(report.acceptedRecords.length, 0);
  assert.deepEqual(report.rejected[0].reasons, [
    'invalid-municipality-check-digit',
    'reading-record-gate-failed',
  ]);
  assert.ok(
    report.rejected[0].sourceGateReasons.includes('invalid-administrative-key'),
  );
});

test('rejects coordinates, mesh keys, and address-level payload fields', () => {
  const unsafe = {
    ...row(),
    latitude: 35.0,
    mesh: 'synthetic-mesh',
    block: 'synthetic-block',
  } as unknown as JapaneseMunicipalityReadingRow;
  const rows = [unsafe];
  const report = ingestJapaneseMunicipalityReadings({
    rows,
    artifact: artifact(rows),
  });

  assert.equal(report.acceptedRecords.length, 0);
  assert.deepEqual(report.rejected[0].reasons, [
    'forbidden-granularity-or-sensitive-field',
  ]);
  assert.equal('latitude' in report.rejected[0], false);
  assert.equal('prefectureName' in report.rejected[0], false);
  assert.equal('municipalityName' in report.rejected[0], false);
});

test('rejects every row when one administrative code has conflicting readings', () => {
  const rows = [
    row({ rowId: 'conflict-a' }),
    row({
      rowId: 'conflict-b',
      municipalityKana: 'ごうせいまち',
      municipalityRomanized: 'Gosei-machi',
    }),
  ];
  const report = ingestJapaneseMunicipalityReadings({
    rows,
    artifact: artifact(rows),
  });

  assert.equal(report.acceptedRecords.length, 0);
  assert.equal(report.summary.conflictingAdministrativeKeys, 2);
  assert.ok(report.rejected.every(item => (
    item.reasons.includes('conflicting-administrative-key')
  )));
});

test('requires reusable, fresh sources for both reading and administrative key', () => {
  const rows = [row({
    readingSource: {
      ...readingSource,
      reuseStatus: 'reference-only-reading-evidence-no-dataset-copied',
    },
    administrativeKeySource: {
      ...JAPAN_ADDRESS_BASE_REGISTRY_SOURCE,
      checkedOn: '2020-01-01',
    },
  })];
  const report = ingestJapaneseMunicipalityReadings({
    rows,
    artifact: artifact(rows),
    asOf: '2026-07-25',
    maxReviewAgeDays: 365,
  });

  assert.equal(report.acceptedRecords.length, 0);
  assert.ok(report.rejected[0].reasons.includes('reading-source-not-reusable'));
  assert.ok(
    report.rejected[0].reasons.includes(
      'administrative-key-source-not-reusable',
    ),
  );
  assert.ok(report.rejected[0].sourceGateReasons.includes('stale-source-review'));
});

test('blocks the whole batch when rows change after the artifact was recorded', () => {
  const originalRows = [row()];
  const evidence = artifact(originalRows);
  const changedRows = [row({ municipalityRomanized: 'Changed-reading' })];
  const report = ingestJapaneseMunicipalityReadings({
    rows: changedRows,
    artifact: evidence,
  });

  assert.equal(report.artifactGate.accepted, false);
  assert.deepEqual(report.artifactGate.reasons, ['artifact-sha256-mismatch']);
  assert.equal(report.acceptedRecords.length, 0);
  assert.ok(report.rejected[0].reasons.includes('artifact-evidence-failed'));
  assert.equal('rows' in report.artifactGate, false);
});

test('rejects stale, miscounted, or malformed artifact evidence', () => {
  const rows = [row()];
  const gate = gateJapaneseMunicipalityReadingArtifact({
    rows,
    artifact: artifact(rows, {
      releaseId: '',
      retrievedOn: '2020-01-01',
      rowCount: 2,
      canonicalRowsSha256: 'not-a-digest',
    }),
    asOf: '2026-07-25',
    maxArtifactAgeDays: 365,
  });

  assert.equal(gate.accepted, false);
  assert.deepEqual(gate.reasons, [
    'missing-release-id',
    'stale-artifact',
    'artifact-row-count-mismatch',
    'invalid-artifact-sha256',
  ]);
  assert.match(gate.computedCanonicalRowsSha256, /^[a-f0-9]{64}$/);
});

test('produces the same artifact digest independent of input row ordering', () => {
  const first = row({ rowId: 'first', municipalityCode: '990001' });
  const second = row({ rowId: 'second', municipalityCode: '990002' });

  assert.equal(
    digestJapaneseMunicipalityReadingRows([first, second]),
    digestJapaneseMunicipalityReadingRows([second, first]),
  );
});

test('accepts a release transition when every material change is evidenced', () => {
  const previousRows = [row()];
  const currentRows = [
    row({
      municipalityName: '合成町',
      municipalityKana: 'ごうせいまち',
      municipalityRomanized: 'Gosei-machi',
    }),
    row({
      rowId: 'newly-established',
      municipalityCode: '990019',
      municipalityName: '新設市',
      municipalityKana: 'しんせつし',
      municipalityRomanized: 'Shinsetsu-shi',
    }),
  ];
  const declarations: JapaneseMunicipalityReadingTransitionDeclaration[] = [
    {
      municipalityCode: '990001',
      changeType: 'name-change',
      effectiveOn: '2026-07-25',
      evidence: readingSource,
    },
    {
      municipalityCode: '990001',
      changeType: 'reading-change',
      effectiveOn: '2026-07-25',
      evidence: readingSource,
    },
    {
      municipalityCode: '990019',
      changeType: 'newly-established',
      effectiveOn: '2026-07-25',
      evidence: readingSource,
    },
  ];
  const report = gateJapaneseMunicipalityReadingReleaseTransition({
    previous: {
      rows: previousRows,
      artifact: artifact(previousRows, {
        releaseId: 'synthetic-release-v1',
        retrievedOn: '2026-07-24',
      }),
    },
    current: {
      rows: currentRows,
      artifact: artifact(currentRows, {
        releaseId: 'synthetic-release-v2',
      }),
    },
    declarations,
  });

  assert.equal(report.accepted, true);
  assert.deepEqual(report.reasons, []);
  assert.deepEqual(report.counts, {
    previous: 1,
    current: 2,
    unchanged: 0,
    newlyEstablished: 1,
    abolished: 0,
    nameChanges: 1,
    readingChanges: 1,
    administrativeParentChanges: 0,
    declarations: 3,
  });
  assert.equal('rows' in report, false);
  assert.equal('declarations' in report, false);
});

test('blocks undeclared removals and reading changes without exposing names', () => {
  const previousRows = [
    row(),
    row({
      rowId: 'second',
      municipalityCode: '990019',
      municipalityName: '第二市',
      municipalityKana: 'だいにし',
      municipalityRomanized: 'Daini-shi',
    }),
  ];
  const currentRows = [row({ municipalityRomanized: 'Gosei City' })];
  const report = gateJapaneseMunicipalityReadingReleaseTransition({
    previous: {
      rows: previousRows,
      artifact: artifact(previousRows, {
        releaseId: 'synthetic-release-v1',
        retrievedOn: '2026-07-24',
      }),
    },
    current: {
      rows: currentRows,
      artifact: artifact(currentRows, {
        releaseId: 'synthetic-release-v2',
      }),
    },
    declarations: [],
  });

  assert.equal(report.accepted, false);
  assert.ok(report.reasons.includes('undeclared-reading-change'));
  assert.ok(report.reasons.includes('undeclared-abolished-code'));
  assert.equal(report.counts.readingChanges, 1);
  assert.equal(report.counts.abolished, 1);
  assert.equal('municipalityName' in report, false);
});

test('blocks release identifier reuse and retrieval-date regression', () => {
  const previousRows = [row()];
  const currentRows = [row({ municipalityRomanized: 'Gosei City' })];
  const report = gateJapaneseMunicipalityReadingReleaseTransition({
    previous: {
      rows: previousRows,
      artifact: artifact(previousRows, {
        releaseId: 'reused-release',
        retrievedOn: '2026-07-24',
      }),
    },
    current: {
      rows: currentRows,
      artifact: artifact(currentRows, {
        releaseId: 'reused-release',
        retrievedOn: '2026-07-23',
      }),
    },
    declarations: [],
  });

  assert.equal(report.accepted, false);
  assert.ok(report.reasons.includes('release-id-reused'));
  assert.ok(report.reasons.includes('retrieval-date-regression'));
});
