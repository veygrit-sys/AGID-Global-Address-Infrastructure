import {
  buildCountryGeographicMetadataEvaluationIndex,
  type CountryGeographicMetadataEvaluationIndex,
  type CountryGeographicMetadataSourceCandidate,
  type SyntheticAdministrativeKeyCandidate,
} from './countryGeographicMetadataEvaluationIndex';

export const GEOBOUNDARIES_OPEN_METADATA_BATCH_INTAKE_VERSION =
  'geoboundaries-open-metadata-batch-intake-v1';

export type GeoBoundariesOpenMetadataRecord = {
  countryCode: string;
  administrativeLevel: 'ADM1' | 'ADM2';
  metadataUrl: string;
  boundaryLicense: string;
  licenseSourceUrl: string;
  sourceDataUpdateDate: string;
  buildDate: string;
  reviewedAt: string;
  reviewBy: string;
};

export type GeoBoundariesOpenMetadataBatchGate = {
  countryCode: string;
  status: 'approved-for-synthetic-administrative-evaluation' | 'blocked';
  reason: string;
  sourceIds: string[];
};

export type GeoBoundariesOpenMetadataBatchResult = {
  version: typeof GEOBOUNDARIES_OPEN_METADATA_BATCH_INTAKE_VERSION;
  countryCodes: string[];
  gates: GeoBoundariesOpenMetadataBatchGate[];
  index: CountryGeographicMetadataEvaluationIndex;
  postalLookupEnabled: false;
  addressValidationEnabled: false;
  deliveryClaimsEnabled: false;
  nonClaims: string[];
};

const GEOBOUNDARIES_STEWARDSHIP_URL = 'https://github.com/wmgeolab/geoBoundaries';
const GEOBOUNDARIES_CORRECTION_URL = 'https://github.com/wmgeolab/geoBoundaries/issues';
const RECORD_FIELDS = new Set([
  'countryCode',
  'administrativeLevel',
  'metadataUrl',
  'boundaryLicense',
  'licenseSourceUrl',
  'sourceDataUpdateDate',
  'buildDate',
  'reviewedAt',
  'reviewBy',
]);

function normalizeCountryCode(value: string) {
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function uniqueSorted(values: readonly string[]) {
  return [...new Set(values)].sort();
}

function isSafeHttpsUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isTimestamp(value: string) {
  return Number.isFinite(Date.parse(value));
}

function isExplicitCcBy40(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
  return normalized === 'cc by 4.0'
    || normalized === 'creative commons attribution 4.0'
    || normalized === 'creative commons attribution 4.0 international'
    || normalized === 'creative commons attribution 4.0 (cc by 4.0)'
    || normalized === 'creative commons attribution 4.0 international (cc by 4.0)';
}

function assertMetadataOnly(record: GeoBoundariesOpenMetadataRecord) {
  const unknownField = Object.keys(record as unknown as Record<string, unknown>)
    .find(field => !RECORD_FIELDS.has(field));
  if (unknownField) {
    throw new Error(`geoBoundaries metadata record contains disallowed field ${unknownField}; raw geographic payloads are prohibited`);
  }
}

function sourceId(countryCode: string, administrativeLevel: GeoBoundariesOpenMetadataRecord['administrativeLevel']) {
  return `geoboundaries-gbopen-${countryCode.toLowerCase()}-${administrativeLevel.toLowerCase()}`;
}

function keyKind(administrativeLevel: GeoBoundariesOpenMetadataRecord['administrativeLevel']) {
  return administrativeLevel === 'ADM1' ? 'first-order-subdivision' as const : 'second-order-subdivision' as const;
}

function candidateFrom(record: GeoBoundariesOpenMetadataRecord, countryCode: string): {
  source: CountryGeographicMetadataSourceCandidate;
  key: SyntheticAdministrativeKeyCandidate;
} | null {
  if (!isExplicitCcBy40(record.boundaryLicense)) return null;
  if (!isSafeHttpsUrl(record.metadataUrl) || !isSafeHttpsUrl(record.licenseSourceUrl)) return null;
  if (!isTimestamp(record.sourceDataUpdateDate) || !isTimestamp(record.buildDate)) return null;
  if (!isTimestamp(record.reviewedAt) || !isTimestamp(record.reviewBy)) return null;

  const id = sourceId(countryCode, record.administrativeLevel);
  const administrativeKeyKind = keyKind(record.administrativeLevel);
  const sourceVersion = `geoboundaries-gbopen-${record.administrativeLevel.toLowerCase()}-build-${record.buildDate.slice(0, 10)}-source-${record.sourceDataUpdateDate.slice(0, 10)}`;

  return {
    source: {
      countryCode,
      sourceId: id,
      sourceOrigin: 'maintained-open-source',
      componentSourceIds: [],
      sourceUrl: record.metadataUrl.trim(),
      authorityEvidenceUrl: GEOBOUNDARIES_STEWARDSHIP_URL,
      authorityStatus: 'open-source-maintainer',
      sourceVersion,
      versionStatus: 'verified-current',
      reuseLicense: record.boundaryLicense.trim(),
      reuseTermsUrl: record.licenseSourceUrl.trim(),
      reuseStatus: 'reuse-approved',
      declaredScope: 'country',
      coverageStatus: 'country-or-territory-coverage-evidenced',
      correctionUrl: GEOBOUNDARIES_CORRECTION_URL,
      correctionPathStatus: 'source-specific-confirmed',
      approvalStatus: 'approved-for-synthetic-administrative-evaluation',
      approvedAdministrativeKeyKinds: [administrativeKeyKind],
      reviewedAt: record.reviewedAt,
      reviewBy: record.reviewBy,
      rawPrivateMaterialStored: false,
    },
    key: {
      keyId: `synthetic-admin-key:${countryCode.toLowerCase()}:${id}:${record.administrativeLevel.toLowerCase()}-holdout-v1`,
      countryCode,
      sourceId: id,
      keyKind: administrativeKeyKind,
      syntheticKeyToken: `synthetic:${countryCode}:geoboundaries-${record.administrativeLevel.toLowerCase()}-holdout-v1`,
      synthetic: true,
      approvalStatus: 'approved',
    },
  };
}

export function buildGeoBoundariesOpenMetadataBatchIntake(input: {
  countryCodes: readonly string[];
  metadata: readonly GeoBoundariesOpenMetadataRecord[];
  now?: string | number | Date;
}): GeoBoundariesOpenMetadataBatchResult {
  const countryCodes = uniqueSorted(input.countryCodes
    .map(normalizeCountryCode)
    .filter((countryCode): countryCode is string => countryCode !== null));
  const requestedCountryCodes = new Set(countryCodes);
  const candidates: Array<NonNullable<ReturnType<typeof candidateFrom>>> = [];
  const blockedReasons = new Map<string, string[]>();
  const seenRecordIds = new Set<string>();

  for (const record of input.metadata) {
    assertMetadataOnly(record);
    const countryCode = normalizeCountryCode(record.countryCode);
    if (!countryCode || !requestedCountryCodes.has(countryCode)) {
      throw new Error('geoBoundaries metadata countryCode must be a requested ISO 3166-1 alpha-2 country code');
    }
    const recordId = `${countryCode}:${record.administrativeLevel}`;
    if (seenRecordIds.has(recordId)) {
      throw new Error(`geoBoundaries metadata contains duplicate ${recordId} record`);
    }
    seenRecordIds.add(recordId);

    const candidate = candidateFrom(record, countryCode);
    if (!candidate) {
      const reason = !isExplicitCcBy40(record.boundaryLicense)
        ? 'explicit-cc-by-4-license-required'
        : !isSafeHttpsUrl(record.metadataUrl) || !isSafeHttpsUrl(record.licenseSourceUrl)
          ? 'metadata-and-license-evidence-urls-required'
          : !isTimestamp(record.sourceDataUpdateDate) || !isTimestamp(record.buildDate)
            ? 'source-and-build-version-timestamps-required'
            : 'review-window-timestamps-required';
      blockedReasons.set(countryCode, [...(blockedReasons.get(countryCode) || []), reason]);
      continue;
    }
    candidates.push(candidate);
  }

  const index = buildCountryGeographicMetadataEvaluationIndex({
    sources: candidates.map(candidate => candidate!.source),
    syntheticAdministrativeKeys: candidates.map(candidate => candidate!.key),
    now: input.now,
  });
  const sourceIdsByCountry = new Map<string, string[]>();
  for (const source of index.sources) {
    sourceIdsByCountry.set(source.countryCode, [...(sourceIdsByCountry.get(source.countryCode) || []), source.sourceId]);
  }
  for (const blocked of index.blockedCandidates) {
    if (blocked.countryCode && blocked.reason !== 'approved-source-required') {
      blockedReasons.set(blocked.countryCode, [...(blockedReasons.get(blocked.countryCode) || []), blocked.reason]);
    }
  }

  const gates = countryCodes.map(countryCode => {
    const sourceIds = uniqueSorted(sourceIdsByCountry.get(countryCode) || []);
    return sourceIds.length > 0
      ? {
          countryCode,
          status: 'approved-for-synthetic-administrative-evaluation' as const,
          reason: 'Every supplied open-source metadata record passed explicit CC BY 4.0, version, scope, correction, and synthetic-holdout gates.',
          sourceIds,
        }
      : {
          countryCode,
          status: 'blocked' as const,
          reason: uniqueSorted(blockedReasons.get(countryCode) || ['country-specific-metadata-not-supplied']).join(', '),
          sourceIds: [],
        };
  });

  return {
    version: GEOBOUNDARIES_OPEN_METADATA_BATCH_INTAKE_VERSION,
    countryCodes,
    gates,
    index,
    postalLookupEnabled: false,
    addressValidationEnabled: false,
    deliveryClaimsEnabled: false,
    nonClaims: [
      'The batch accepts metadata only; it rejects boundary geometry, coordinates, addresses, recipients, credentials, secrets, and query logs.',
      'Country metadata is approved only when the individual record has an explicit CC BY 4.0 license, source and build timestamps, a current review window, and a synthetic administrative holdout.',
      'This is not postal lookup, address validation, geocoding, routing, boundary adjudication, or delivery-point evidence.',
    ],
  };
}
