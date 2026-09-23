import { createHash } from 'node:crypto';

import {
  ADDRESSQL_RUNTIME_CONFIG_VERSION,
  digestAddressQlPostalCodes,
  type AddressQlRuntimeConfig,
} from './addressQlRuntimeConfig';

export const ADDRESSQL_PUBLIC_POSTAL_SOURCE_LEDGER_VERSION =
  'addressql-public-postal-source-ledger-v1';
export const ADDRESSQL_PUBLIC_POSTAL_QUALITY_REPORT_VERSION =
  'addressql-public-postal-quality-report-v1';
export const ADDRESSQL_PUBLIC_POSTAL_HOLDOUT_VERSION =
  'addressql-public-postal-holdout-v1';

export type AddressQlPublicPostalSource = {
  id: string;
  role: 'official-primary' | 'oss-cross-check';
  authority: string;
  sourceVersion: string;
  archiveUrl: string;
  releaseUrl: string;
  termsUrl: string;
  correctionUrl: string;
  reuseRights: string;
  coverageStatement: string;
  attribution: string;
};

export type AddressQlPublicPostalInput = {
  retrievedAt: string;
  validUntil: string;
  japanPostSource: AddressQlPublicPostalSource;
  japanPostArchiveDigest: string;
  japanPostCsv: string;
  geoNamesSource: AddressQlPublicPostalSource;
  geoNamesArchiveDigest: string;
  geoNamesTsv: string;
};

export type AddressQlPublicPostalArtifacts = {
  japanPostPostalCodes: string[];
  geoNamesPostalCodes: string[];
  holdoutPolicy: Record<string, unknown>;
  qualityReport: Record<string, unknown>;
  sourceLedger: Record<string, unknown>;
  runtimeConfig: AddressQlRuntimeConfig;
  trustStore: {
    version: 'addressql-trust-store-v1';
    keys: Record<string, string>;
  };
};

const JP_POSTAL_CODE = /^\d{7}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const MAX_SOURCE_ROWS = 1_000_000;
const HOLDOUT_SIZE = 10_000;

function sha256(value: string | Buffer) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function exactTimestamp(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new Error(`${label} must be an exact UTC timestamp`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is invalid`);
  return date;
}

function assertSource(source: AddressQlPublicPostalSource) {
  for (const [field, value] of Object.entries(source)) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`public postal source ${source.id || 'unknown'}.${field} is required`);
    }
  }
  for (const field of ['archiveUrl', 'releaseUrl', 'termsUrl', 'correctionUrl'] as const) {
    if (new URL(source[field]).protocol !== 'https:') {
      throw new Error(`public postal source ${source.id}.${field} must use HTTPS`);
    }
  }
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some(Boolean)) rows.push(row);
      if (rows.length > MAX_SOURCE_ROWS) throw new Error('CSV source exceeds row limit');
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error('CSV source has an unterminated quoted field');
  row.push(field.replace(/\r$/, ''));
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function extractJapanPostPostalCodes(csv: string) {
  const codes = new Set<string>();
  for (const [index, row] of parseCsv(csv).entries()) {
    if (row.length < 3) throw new Error(`Japan Post CSV row ${index + 1} has too few fields`);
    const postalCode = row[2].trim();
    if (!JP_POSTAL_CODE.test(postalCode)) {
      throw new Error(`Japan Post CSV row ${index + 1} has an invalid postcode`);
    }
    codes.add(postalCode);
  }
  if (!codes.size) throw new Error('Japan Post CSV contains no postcodes');
  return [...codes].sort();
}

export function extractGeoNamesJapanPostalCodes(tsv: string) {
  const codes = new Set<string>();
  const rows = tsv.split(/\r?\n/).filter(Boolean);
  if (rows.length > MAX_SOURCE_ROWS) throw new Error('GeoNames source exceeds row limit');
  for (const [index, row] of rows.entries()) {
    const fields = row.split('\t');
    if (fields.length < 2 || fields[0] !== 'JP') {
      throw new Error(`GeoNames row ${index + 1} is not a JP postal row`);
    }
    const postalCode = fields[1].trim().replace('-', '');
    if (!JP_POSTAL_CODE.test(postalCode)) {
      throw new Error(`GeoNames row ${index + 1} has an invalid JP postcode`);
    }
    codes.add(postalCode);
  }
  if (!codes.size) throw new Error('GeoNames source contains no JP postcodes');
  return [...codes].sort();
}

function deterministicSample(values: readonly string[]) {
  return values
    .map(value => ({ value, rank: sha256(`addressql-jp-holdout-v1:${value}`) }))
    .sort((left, right) => left.rank.localeCompare(right.rank))
    .slice(0, Math.min(HOLDOUT_SIZE, values.length))
    .map(item => item.value);
}

function absentMutation(value: string, official: ReadonlySet<string>) {
  for (const offset of [7, 3, 1, 9, 5, 2, 4, 6, 8]) {
    const last = Number(value.at(-1));
    const candidate = `${value.slice(0, -1)}${(last + offset) % 10}`;
    if (!official.has(candidate)) return candidate;
  }
  return null;
}

function round(value: number) {
  return Number(value.toFixed(6));
}

export function buildAddressQlPublicPostalArtifacts(
  input: AddressQlPublicPostalInput,
): AddressQlPublicPostalArtifacts {
  assertSource(input.japanPostSource);
  assertSource(input.geoNamesSource);
  const retrievedAt = exactTimestamp(input.retrievedAt, 'retrievedAt');
  const validUntil = exactTimestamp(input.validUntil, 'validUntil');
  if (validUntil <= retrievedAt) throw new Error('validUntil must be after retrievedAt');
  if (!SHA256.test(input.japanPostArchiveDigest) || !SHA256.test(input.geoNamesArchiveDigest)) {
    throw new Error('archive digests must be lowercase SHA-256 values');
  }

  const japanPostPostalCodes = extractJapanPostPostalCodes(input.japanPostCsv);
  const geoNamesPostalCodes = extractGeoNamesJapanPostalCodes(input.geoNamesTsv);
  const official = new Set(japanPostPostalCodes);
  const oss = new Set(geoNamesPostalCodes);
  const intersection = japanPostPostalCodes.filter(code => oss.has(code)).length;
  const sample = deterministicSample(japanPostPostalCodes);
  const negativeMutations = sample
    .map(code => absentMutation(code, official))
    .filter((code): code is string => code !== null);
  const holdoutPolicy = {
    version: ADDRESSQL_PUBLIC_POSTAL_HOLDOUT_VERSION,
    countryCode: 'JP',
    method: 'deterministic-sha256-sample-and-last-digit-mutation',
    sampleSize: sample.length,
    seedCommitment: sha256('addressql-jp-holdout-v1'),
    persistedPostalValues: false,
  };
  const qualityReport = {
    version: ADDRESSQL_PUBLIC_POSTAL_QUALITY_REPORT_VERSION,
    countryCode: 'JP',
    generatedAt: input.retrievedAt,
    sources: [
      {
        id: input.japanPostSource.id,
        role: input.japanPostSource.role,
        uniquePostcodeCount: japanPostPostalCodes.length,
      },
      {
        id: input.geoNamesSource.id,
        role: input.geoNamesSource.role,
        uniquePostcodeCount: geoNamesPostalCodes.length,
      },
    ],
    sourceAgreement: {
      intersectionCount: intersection,
      officialCoveredByOssRate: round(intersection / japanPostPostalCodes.length),
      ossConfirmedByOfficialRate: round(intersection / geoNamesPostalCodes.length),
    },
    syntheticHoldout: {
      sampleSize: sample.length,
      officialPositiveMatchRate: 1,
      ossPositiveMatchRate: round(sample.filter(code => oss.has(code)).length / sample.length),
      negativeMutationSampleCount: negativeMutations.length,
      negativeMutationGenerationRate: round(negativeMutations.length / sample.length),
      ossNegativeContradictionRate: round(
        negativeMutations.filter(code => oss.has(code)).length
          / Math.max(1, negativeMutations.length),
      ),
    },
    privacy: {
      containsRawAddress: false,
      containsRecipientData: false,
      containsCoordinates: false,
      containsPersistedHoldoutPostcodes: false,
    },
    nonClaims: [
      'Postcode-set membership is not delivery-point validation.',
      'GeoNames agreement is an OSS cross-check, not postal-authority attestation.',
      'This report is aggregate evidence and is not independently signed.',
    ],
  };
  const holdoutDigest = sha256(JSON.stringify(holdoutPolicy));
  const reportDigest = sha256(JSON.stringify(qualityReport));

  const adapter = (
    source: AddressQlPublicPostalSource,
    dataFile: string,
    datasetDigest: string,
  ) => ({
    id: `${source.id}-jp-existence`,
    version: source.sourceVersion,
    mode: 'conformance' as const,
    countryCode: 'JP',
    purpose: 'existence' as const,
    coverage: 'partial' as const,
    dataFile,
    evidence: {
      sourceId: source.id,
      sourceVersion: source.sourceVersion,
      reuseRights: source.reuseRights,
      coverageStatement: source.coverageStatement,
      correctionUrl: source.correctionUrl,
      retrievedAt: input.retrievedAt,
      validUntil: input.validUntil,
      datasetDigest,
      holdoutDigest,
      reportDigest,
      attestationKeyId: 'pending-independent-reviewer',
      attestationSignature: 'unsigned-public-source-conformance',
    },
  });

  const runtimeConfig: AddressQlRuntimeConfig = {
    version: ADDRESSQL_RUNTIME_CONFIG_VERSION,
    adapters: [
      adapter(
        input.japanPostSource,
        'japan-post.postcodes.txt',
        digestAddressQlPostalCodes(japanPostPostalCodes),
      ),
      adapter(
        input.geoNamesSource,
        'geonames-jp.postcodes.txt',
        digestAddressQlPostalCodes(geoNamesPostalCodes),
      ),
    ],
  };

  const sourceLedger = {
    version: ADDRESSQL_PUBLIC_POSTAL_SOURCE_LEDGER_VERSION,
    generatedAt: input.retrievedAt,
    countryCode: 'JP',
    sources: [
      {
        ...input.japanPostSource,
        archiveDigest: input.japanPostArchiveDigest,
        derivedDatasetDigest: runtimeConfig.adapters[0].evidence.datasetDigest,
        uniquePostcodeCount: japanPostPostalCodes.length,
      },
      {
        ...input.geoNamesSource,
        archiveDigest: input.geoNamesArchiveDigest,
        derivedDatasetDigest: runtimeConfig.adapters[1].evidence.datasetDigest,
        uniquePostcodeCount: geoNamesPostalCodes.length,
      },
    ],
    trust: {
      requiredAlgorithm: 'Ed25519',
      trustedPublicKeyCount: 0,
      approvedActivation: 'blocked',
      reason:
        'No independently controlled reviewer public key and signature were supplied.',
      nextStep:
        'Register the reviewer public key in trust-store.json and sign each canonical adapter attestation payload.',
    },
    privacy: {
      rawArchivesPersisted: false,
      derivedDataContainsPostcodesOnly: true,
      containsRawAddress: false,
      containsRecipientData: false,
      containsCoordinates: false,
    },
  };

  return {
    japanPostPostalCodes,
    geoNamesPostalCodes,
    holdoutPolicy,
    qualityReport,
    sourceLedger,
    runtimeConfig,
    trustStore: {
      version: 'addressql-trust-store-v1',
      keys: {},
    },
  };
}
