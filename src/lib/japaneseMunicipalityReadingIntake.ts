import {
  isValidJapaneseLocalGovernmentCode,
  gateJapaneseContextualReadingRecords,
  validateJapaneseReadingSource,
  type JapaneseContextualReadingRecord,
  type JapaneseReadingRecordGateReason,
  type JapaneseReadingSource,
} from './japaneseContextualReading';
import { sha256Hex } from './sha256';

export const JAPANESE_MUNICIPALITY_READING_INTAKE_POLICY_VERSION =
  'jp-municipality-reading-intake-v2-2026-07-25' as const;

export const JAPANESE_MUNICIPALITY_READING_ARTIFACT_SCOPE =
  'municipality-reading-admin-code-only' as const;

export const JAPAN_ADDRESS_BASE_REGISTRY_SOURCE: JapaneseReadingSource = {
  authority: 'Digital Agency, Government of Japan',
  url: 'https://www.digital.go.jp/policies/base_registry_address',
  termsUrl:
    'https://www.digital.go.jp/resources/open_data/public_data_license_v1.0',
  version: 'Address Base Registry hierarchy documentation, reviewed 2026-07-25',
  checkedOn: '2026-07-25',
  reuseStatus: 'approved-open-data',
  correctionPath: 'https://www.digital.go.jp/contact',
};

export type JapaneseMunicipalityReadingRow = {
  rowId: string;
  municipalityCode: string;
  prefectureCode: string;
  prefectureName: string;
  municipalityName: string;
  municipalityKana: string;
  municipalityRomanized: string;
  readingSource: JapaneseReadingSource;
  administrativeKeySource: JapaneseReadingSource;
};

export type JapaneseMunicipalityReadingArtifactEvidence = {
  releaseId: string;
  retrievedOn: string;
  rowCount: number;
  canonicalRowsSha256: string;
  scope: typeof JAPANESE_MUNICIPALITY_READING_ARTIFACT_SCOPE;
};

export type JapaneseMunicipalityReadingArtifactReason =
  | 'missing-release-id'
  | 'invalid-retrieval-date'
  | 'future-retrieval-date'
  | 'stale-artifact'
  | 'invalid-artifact-scope'
  | 'invalid-artifact-row-count'
  | 'artifact-row-count-mismatch'
  | 'invalid-artifact-sha256'
  | 'artifact-sha256-mismatch';

export type JapaneseMunicipalityReadingTransitionType =
  | 'newly-established'
  | 'abolished'
  | 'name-change'
  | 'reading-change'
  | 'administrative-parent-change';

export type JapaneseMunicipalityReadingTransitionDeclaration = {
  municipalityCode: string;
  changeType: JapaneseMunicipalityReadingTransitionType;
  effectiveOn: string;
  evidence: JapaneseReadingSource;
};

export type JapaneseMunicipalityReadingTransitionReason =
  | 'previous-artifact-failed'
  | 'current-artifact-failed'
  | 'release-id-reused'
  | 'retrieval-date-regression'
  | 'duplicate-code-in-release'
  | 'duplicate-transition-declaration'
  | 'invalid-transition-code'
  | 'invalid-transition-date'
  | 'transition-effective-after-retrieval'
  | 'invalid-transition-evidence'
  | 'orphan-transition-declaration'
  | 'undeclared-new-code'
  | 'undeclared-abolished-code'
  | 'undeclared-name-change'
  | 'undeclared-reading-change'
  | 'undeclared-administrative-parent-change';

export type JapaneseMunicipalityReadingTransitionReport = {
  accepted: boolean;
  reasons: readonly JapaneseMunicipalityReadingTransitionReason[];
  counts: {
    previous: number;
    current: number;
    unchanged: number;
    newlyEstablished: number;
    abolished: number;
    nameChanges: number;
    readingChanges: number;
    administrativeParentChanges: number;
    declarations: number;
  };
};

export type JapaneseMunicipalityReadingIntakeReason =
  | 'artifact-evidence-failed'
  | 'forbidden-granularity-or-sensitive-field'
  | 'missing-row-id'
  | 'invalid-municipality-code'
  | 'invalid-municipality-check-digit'
  | 'invalid-prefecture-code'
  | 'administrative-key-prefix-mismatch'
  | 'missing-place-name'
  | 'invalid-place-name-script'
  | 'invalid-kana-script'
  | 'invalid-romanized-script'
  | 'reading-source-not-reusable'
  | 'administrative-key-source-not-reusable'
  | 'duplicate-administrative-key'
  | 'conflicting-administrative-key'
  | 'reading-record-gate-failed';

export type JapaneseMunicipalityReadingIntakeReport = {
  policyVersion: typeof JAPANESE_MUNICIPALITY_READING_INTAKE_POLICY_VERSION;
  artifactGate: {
    accepted: boolean;
    reasons: readonly JapaneseMunicipalityReadingArtifactReason[];
    computedCanonicalRowsSha256: string;
  };
  acceptedRecords: readonly JapaneseContextualReadingRecord[];
  rejected: readonly {
    rowId: string;
    municipalityCode: string;
    reasons: readonly JapaneseMunicipalityReadingIntakeReason[];
    sourceGateReasons: readonly JapaneseReadingRecordGateReason[];
  }[];
  summary: {
    total: number;
    accepted: number;
    rejected: number;
    duplicateAdministrativeKeys: number;
    conflictingAdministrativeKeys: number;
  };
};

const FORBIDDEN_INTAKE_KEYS = new Set([
  'address',
  'block',
  'building',
  'coordinates',
  'credential',
  'grid',
  'house',
  'house_number',
  'latitude',
  'longitude',
  'mesh',
  'point',
  'postcode',
  'privatekey',
  'proofsecret',
  'querylog',
  'recipient',
  'recipientname',
  'street',
]);

function normalizedText(value: unknown) {
  return String(value ?? '').normalize('NFKC').trim();
}

function normalizedCompactText(value: unknown) {
  return normalizedText(value).replace(/\s+/g, '');
}

function containsForbiddenIntakeKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, nested]) => (
    FORBIDDEN_INTAKE_KEYS.has(key.toLowerCase())
    || containsForbiddenIntakeKey(nested)
  ));
}

function semanticFingerprint(row: JapaneseMunicipalityReadingRow) {
  return [
    normalizedCompactText(row.prefectureCode),
    normalizedCompactText(row.prefectureName),
    normalizedCompactText(row.municipalityName),
    normalizedCompactText(row.municipalityKana),
    normalizedCompactText(row.municipalityRomanized).toLowerCase(),
  ].join('|');
}

function canonicalSource(source: JapaneseReadingSource) {
  return [
    normalizedText(source.authority),
    normalizedText(source.url),
    normalizedText(source.termsUrl),
    normalizedText(source.version),
    normalizedText(source.checkedOn),
    normalizedText(source.reuseStatus),
    normalizedText(source.correctionPath),
  ];
}

function canonicalArtifactRow(row: JapaneseMunicipalityReadingRow) {
  return [
    normalizedText(row.rowId),
    normalizedCompactText(row.municipalityCode),
    normalizedCompactText(row.prefectureCode),
    normalizedText(row.prefectureName),
    normalizedText(row.municipalityName),
    normalizedText(row.municipalityKana),
    normalizedText(row.municipalityRomanized),
    canonicalSource(row.readingSource),
    canonicalSource(row.administrativeKeySource),
  ];
}

export function digestJapaneseMunicipalityReadingRows(
  rows: readonly JapaneseMunicipalityReadingRow[],
) {
  const canonicalRows = rows
    .map(canonicalArtifactRow)
    .sort((left, right) => {
      const leftJson = JSON.stringify(left);
      const rightJson = JSON.stringify(right);
      if (leftJson === rightJson) return 0;
      return leftJson < rightJson ? -1 : 1;
    });
  return sha256Hex(JSON.stringify(canonicalRows));
}

function utcDay(value: string) {
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function gateJapaneseMunicipalityReadingArtifact(input: {
  rows: readonly JapaneseMunicipalityReadingRow[];
  artifact: JapaneseMunicipalityReadingArtifactEvidence;
  asOf?: string;
  maxArtifactAgeDays?: number;
}) {
  const asOf = input.asOf ?? '2026-07-25';
  const maxArtifactAgeDays = input.maxArtifactAgeDays ?? 365;
  const computedCanonicalRowsSha256 =
    digestJapaneseMunicipalityReadingRows(input.rows);
  const reasons: JapaneseMunicipalityReadingArtifactReason[] = [];

  if (!normalizedText(input.artifact.releaseId)) {
    reasons.push('missing-release-id');
  }
  const retrievedDay = utcDay(input.artifact.retrievedOn);
  const asOfDay = utcDay(asOf);
  if (retrievedDay === null || asOfDay === null) {
    reasons.push('invalid-retrieval-date');
  } else if (retrievedDay > asOfDay) {
    reasons.push('future-retrieval-date');
  } else if ((asOfDay - retrievedDay) / 86_400_000 > maxArtifactAgeDays) {
    reasons.push('stale-artifact');
  }
  if (input.artifact.scope !== JAPANESE_MUNICIPALITY_READING_ARTIFACT_SCOPE) {
    reasons.push('invalid-artifact-scope');
  }
  if (
    !Number.isSafeInteger(input.artifact.rowCount)
    || input.artifact.rowCount < 0
  ) {
    reasons.push('invalid-artifact-row-count');
  } else if (input.artifact.rowCount !== input.rows.length) {
    reasons.push('artifact-row-count-mismatch');
  }
  const expectedSha256 = normalizedCompactText(
    input.artifact.canonicalRowsSha256,
  ).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expectedSha256)) {
    reasons.push('invalid-artifact-sha256');
  } else if (expectedSha256 !== computedCanonicalRowsSha256) {
    reasons.push('artifact-sha256-mismatch');
  }

  return {
    accepted: reasons.length === 0,
    reasons: [...new Set(reasons)],
    computedCanonicalRowsSha256,
  };
}

function municipalityRowsByCode(
  rows: readonly JapaneseMunicipalityReadingRow[],
) {
  const byCode = new Map<string, JapaneseMunicipalityReadingRow>();
  const duplicateCodes = new Set<string>();
  for (const row of rows) {
    const code = normalizedCompactText(row.municipalityCode);
    if (byCode.has(code)) duplicateCodes.add(code);
    byCode.set(code, row);
  }
  return { byCode, duplicateCodes };
}

function transitionKey(
  municipalityCode: string,
  changeType: JapaneseMunicipalityReadingTransitionType,
) {
  return `${municipalityCode}|${changeType}`;
}

export function gateJapaneseMunicipalityReadingReleaseTransition(input: {
  previous: {
    rows: readonly JapaneseMunicipalityReadingRow[];
    artifact: JapaneseMunicipalityReadingArtifactEvidence;
  };
  current: {
    rows: readonly JapaneseMunicipalityReadingRow[];
    artifact: JapaneseMunicipalityReadingArtifactEvidence;
  };
  declarations: readonly JapaneseMunicipalityReadingTransitionDeclaration[];
  asOf?: string;
  maxArtifactAgeDays?: number;
  maxReviewAgeDays?: number;
}): JapaneseMunicipalityReadingTransitionReport {
  const asOf = input.asOf ?? '2026-07-25';
  const maxArtifactAgeDays = input.maxArtifactAgeDays ?? 365;
  const maxReviewAgeDays = input.maxReviewAgeDays ?? 730;
  const previousArtifactGate = gateJapaneseMunicipalityReadingArtifact({
    rows: input.previous.rows,
    artifact: input.previous.artifact,
    asOf,
    maxArtifactAgeDays,
  });
  const currentArtifactGate = gateJapaneseMunicipalityReadingArtifact({
    rows: input.current.rows,
    artifact: input.current.artifact,
    asOf,
    maxArtifactAgeDays,
  });
  const reasons: JapaneseMunicipalityReadingTransitionReason[] = [];
  if (!previousArtifactGate.accepted) reasons.push('previous-artifact-failed');
  if (!currentArtifactGate.accepted) reasons.push('current-artifact-failed');
  if (
    normalizedText(input.previous.artifact.releaseId)
    === normalizedText(input.current.artifact.releaseId)
    && previousArtifactGate.computedCanonicalRowsSha256
      !== currentArtifactGate.computedCanonicalRowsSha256
  ) {
    reasons.push('release-id-reused');
  }

  const previousRetrievedDay = utcDay(input.previous.artifact.retrievedOn);
  const currentRetrievedDay = utcDay(input.current.artifact.retrievedOn);
  if (
    previousRetrievedDay !== null
    && currentRetrievedDay !== null
    && currentRetrievedDay < previousRetrievedDay
  ) {
    reasons.push('retrieval-date-regression');
  }

  const previous = municipalityRowsByCode(input.previous.rows);
  const current = municipalityRowsByCode(input.current.rows);
  if (previous.duplicateCodes.size || current.duplicateCodes.size) {
    reasons.push('duplicate-code-in-release');
  }

  const declarations = new Map<
    string,
    JapaneseMunicipalityReadingTransitionDeclaration
  >();
  for (const declaration of input.declarations) {
    const code = normalizedCompactText(declaration.municipalityCode);
    const key = transitionKey(code, declaration.changeType);
    if (declarations.has(key)) reasons.push('duplicate-transition-declaration');
    declarations.set(key, declaration);

    if (!isValidJapaneseLocalGovernmentCode(code)) {
      reasons.push('invalid-transition-code');
    }
    const effectiveDay = utcDay(declaration.effectiveOn);
    if (effectiveDay === null) {
      reasons.push('invalid-transition-date');
    } else if (
      currentRetrievedDay !== null
      && effectiveDay > currentRetrievedDay
    ) {
      reasons.push('transition-effective-after-retrieval');
    }
    if (validateJapaneseReadingSource(declaration.evidence, {
      asOf,
      maxReviewAgeDays,
    }).length) {
      reasons.push('invalid-transition-evidence');
    }
  }

  const expectedTransitions = new Set<string>();
  let unchanged = 0;
  let newlyEstablished = 0;
  let abolished = 0;
  let nameChanges = 0;
  let readingChanges = 0;
  let administrativeParentChanges = 0;

  for (const [code, currentRow] of current.byCode) {
    const previousRow = previous.byCode.get(code);
    if (!previousRow) {
      newlyEstablished += 1;
      expectedTransitions.add(transitionKey(code, 'newly-established'));
      continue;
    }

    let changed = false;
    if (
      normalizedText(previousRow.prefectureName)
        !== normalizedText(currentRow.prefectureName)
      || normalizedCompactText(previousRow.prefectureCode)
        !== normalizedCompactText(currentRow.prefectureCode)
    ) {
      administrativeParentChanges += 1;
      changed = true;
      expectedTransitions.add(
        transitionKey(code, 'administrative-parent-change'),
      );
    }
    if (
      normalizedText(previousRow.municipalityName)
        !== normalizedText(currentRow.municipalityName)
    ) {
      nameChanges += 1;
      changed = true;
      expectedTransitions.add(transitionKey(code, 'name-change'));
    }
    if (
      normalizedText(previousRow.municipalityKana)
        !== normalizedText(currentRow.municipalityKana)
      || normalizedText(previousRow.municipalityRomanized).toLowerCase()
        !== normalizedText(currentRow.municipalityRomanized).toLowerCase()
    ) {
      readingChanges += 1;
      changed = true;
      expectedTransitions.add(transitionKey(code, 'reading-change'));
    }
    if (!changed) unchanged += 1;
  }

  for (const code of previous.byCode.keys()) {
    if (current.byCode.has(code)) continue;
    abolished += 1;
    expectedTransitions.add(transitionKey(code, 'abolished'));
  }

  for (const expected of expectedTransitions) {
    if (declarations.has(expected)) continue;
    const type = expected.slice(expected.indexOf('|') + 1);
    if (type === 'newly-established') reasons.push('undeclared-new-code');
    if (type === 'abolished') reasons.push('undeclared-abolished-code');
    if (type === 'name-change') reasons.push('undeclared-name-change');
    if (type === 'reading-change') reasons.push('undeclared-reading-change');
    if (type === 'administrative-parent-change') {
      reasons.push('undeclared-administrative-parent-change');
    }
  }
  for (const declared of declarations.keys()) {
    if (!expectedTransitions.has(declared)) {
      reasons.push('orphan-transition-declaration');
    }
  }

  const uniqueReasons = [...new Set(reasons)];
  return {
    accepted: uniqueReasons.length === 0,
    reasons: uniqueReasons,
    counts: {
      previous: previous.byCode.size,
      current: current.byCode.size,
      unchanged,
      newlyEstablished,
      abolished,
      nameChanges,
      readingChanges,
      administrativeParentChanges,
      declarations: input.declarations.length,
    },
  };
}

function hasJapanesePlaceName(value: string) {
  return /[\u3040-\u30ff\u3400-\u9fff]/u.test(value);
}

function isKana(value: string) {
  return /^[\u3040-\u30ffー・\s]+$/u.test(value);
}

function hasJapaneseScript(value: string) {
  return /[\u3040-\u30ff\u3400-\u9fff]/u.test(value);
}

export function ingestJapaneseMunicipalityReadings(input: {
  rows: readonly JapaneseMunicipalityReadingRow[];
  artifact: JapaneseMunicipalityReadingArtifactEvidence;
  asOf?: string;
  maxReviewAgeDays?: number;
  maxArtifactAgeDays?: number;
}): JapaneseMunicipalityReadingIntakeReport {
  const asOf = input.asOf ?? '2026-07-25';
  const maxReviewAgeDays = input.maxReviewAgeDays ?? 730;
  const artifactGate = gateJapaneseMunicipalityReadingArtifact({
    rows: input.rows,
    artifact: input.artifact,
    asOf,
    maxArtifactAgeDays: input.maxArtifactAgeDays,
  });
  const fingerprintsByCode = new Map<string, Set<string>>();

  for (const row of input.rows) {
    const code = normalizedCompactText(row.municipalityCode);
    if (!/^\d{6}$/.test(code)) continue;
    const fingerprints = fingerprintsByCode.get(code) ?? new Set<string>();
    fingerprints.add(semanticFingerprint(row));
    fingerprintsByCode.set(code, fingerprints);
  }

  const conflictingCodes = new Set(
    [...fingerprintsByCode.entries()]
      .filter(([, fingerprints]) => fingerprints.size > 1)
      .map(([code]) => code),
  );
  const seenCodes = new Set<string>();
  const acceptedRecords: JapaneseContextualReadingRecord[] = [];
  const rejected: JapaneseMunicipalityReadingIntakeReport['rejected'][number][] = [];
  let duplicateAdministrativeKeys = 0;
  let conflictingAdministrativeKeys = 0;

  for (const row of input.rows) {
    const rowId = normalizedText(row.rowId);
    const municipalityCode = normalizedCompactText(row.municipalityCode);
    const prefectureCode = normalizedCompactText(row.prefectureCode);
    const prefectureName = normalizedText(row.prefectureName);
    const municipalityName = normalizedText(row.municipalityName);
    const municipalityKana = normalizedText(row.municipalityKana);
    const municipalityRomanized = normalizedText(row.municipalityRomanized);
    const reasons: JapaneseMunicipalityReadingIntakeReason[] = [];
    const sourceGateReasons: JapaneseReadingRecordGateReason[] = [];

    if (!artifactGate.accepted) reasons.push('artifact-evidence-failed');
    if (containsForbiddenIntakeKey(row)) {
      reasons.push('forbidden-granularity-or-sensitive-field');
    }
    if (!rowId) reasons.push('missing-row-id');
    if (!/^\d{6}$/.test(municipalityCode)) {
      reasons.push('invalid-municipality-code');
    } else if (!isValidJapaneseLocalGovernmentCode(municipalityCode)) {
      reasons.push('invalid-municipality-check-digit');
    }
    if (!/^\d{2}$/.test(prefectureCode)) {
      reasons.push('invalid-prefecture-code');
    } else if (
      /^\d{6}$/.test(municipalityCode)
      && !municipalityCode.startsWith(prefectureCode)
    ) {
      reasons.push('administrative-key-prefix-mismatch');
    }
    if (!prefectureName || !municipalityName) {
      reasons.push('missing-place-name');
    } else if (
      !hasJapanesePlaceName(prefectureName)
      || !hasJapanesePlaceName(municipalityName)
    ) {
      reasons.push('invalid-place-name-script');
    }
    if (!municipalityKana || !isKana(municipalityKana)) {
      reasons.push('invalid-kana-script');
    }
    if (
      !municipalityRomanized
      || hasJapaneseScript(municipalityRomanized)
    ) {
      reasons.push('invalid-romanized-script');
    }

    const readingSourceReasons = validateJapaneseReadingSource(
      row.readingSource,
      { asOf, maxReviewAgeDays },
    );
    const administrativeSourceReasons = validateJapaneseReadingSource(
      row.administrativeKeySource,
      { asOf, maxReviewAgeDays },
    );
    sourceGateReasons.push(...readingSourceReasons, ...administrativeSourceReasons);
    if (
      row.readingSource.reuseStatus !== 'approved-open-data'
      || readingSourceReasons.length
    ) {
      reasons.push('reading-source-not-reusable');
    }
    if (
      row.administrativeKeySource.reuseStatus !== 'approved-open-data'
      || administrativeSourceReasons.length
    ) {
      reasons.push('administrative-key-source-not-reusable');
    }

    if (conflictingCodes.has(municipalityCode)) {
      reasons.push('conflicting-administrative-key');
      conflictingAdministrativeKeys += 1;
    } else if (seenCodes.has(municipalityCode)) {
      reasons.push('duplicate-administrative-key');
      duplicateAdministrativeKeys += 1;
    }

    const record: JapaneseContextualReadingRecord = {
      id: `jp-municipality-${municipalityCode}`,
      field: 'city',
      nativeName: municipalityName,
      readingKana: municipalityKana,
      romanizedName: municipalityRomanized,
      context: {
        state: prefectureName,
        city: municipalityName,
      },
      source: row.readingSource,
      administrativeKey: {
        scheme: 'JP-national-local-government-code',
        value: municipalityCode,
        prefectureCode,
        source: row.administrativeKeySource,
      },
    };
    const recordGate = gateJapaneseContextualReadingRecords([record], {
      asOf,
      maxReviewAgeDays,
    });
    if (recordGate.rejected.length) {
      reasons.push('reading-record-gate-failed');
      sourceGateReasons.push(...recordGate.rejected[0].reasons);
    }

    if (reasons.length) {
      rejected.push({
        rowId: rowId || 'missing-row-id',
        municipalityCode: municipalityCode || 'invalid-municipality-code',
        reasons: [...new Set(reasons)],
        sourceGateReasons: [...new Set(sourceGateReasons)],
      });
      continue;
    }

    seenCodes.add(municipalityCode);
    acceptedRecords.push(record);
  }

  return {
    policyVersion: JAPANESE_MUNICIPALITY_READING_INTAKE_POLICY_VERSION,
    artifactGate,
    acceptedRecords,
    rejected,
    summary: {
      total: input.rows.length,
      accepted: acceptedRecords.length,
      rejected: rejected.length,
      duplicateAdministrativeKeys,
      conflictingAdministrativeKeys,
    },
  };
}
