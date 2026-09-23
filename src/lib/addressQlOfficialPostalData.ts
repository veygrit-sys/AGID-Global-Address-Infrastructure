import { createHash } from 'node:crypto';

import {
  ADDRESSQL_RUNTIME_CONFIG_VERSION,
  canonicalAddressQlPostalCodes,
  digestAddressQlPostalCodes,
  type AddressQlRuntimeConfig,
} from './addressQlRuntimeConfig';

export const ADDRESSQL_OFFICIAL_POSTAL_SOURCE_LEDGER_VERSION =
  'addressql-official-postal-source-ledger-v1';
export const ADDRESSQL_OFFICIAL_POSTAL_QUALITY_REPORT_VERSION =
  'addressql-official-postal-quality-report-v1';
export const ADDRESSQL_OFFICIAL_POSTAL_HOLDOUT_VERSION =
  'addressql-official-postal-holdout-v1';

export type AddressQlOfficialPostalSource = {
  id: string;
  authority: string;
  sourceVersion: string;
  snapshotUrl: string;
  releaseUrl: string;
  termsUrl: string;
  correctionUrl: string;
  reuseRights: string;
  reuseVerifiedAt: string;
  coverageStatement: string;
  attribution: string;
  updatePolicy: string;
  coverage: 'complete' | 'partial';
};

export type AddressQlOfficialPostalCountryInput = {
  countryCode: string;
  scopeLabel: string;
  scopePolicy: string;
  source: AddressQlOfficialPostalSource;
  sourceSnapshotDigest: string;
  postalCodes: readonly string[];
};

export type AddressQlOfficialPostalCountryArtifacts = {
  postcodeFile: string;
  postalCodes: string[];
  holdoutPolicy: Record<string, unknown>;
  qualityReport: Record<string, unknown>;
};

export type AddressQlOfficialPostalArtifacts = {
  countries: Record<string, AddressQlOfficialPostalCountryArtifacts>;
  runtimeConfig: AddressQlRuntimeConfig;
  sourceLedger: Record<string, unknown>;
  trustStore: {
    version: 'addressql-trust-store-v1';
    keys: Record<string, string>;
  };
};

const COUNTRY_CODE = /^[A-Z]{2}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;
const POSTAL_CODE = /^[\p{L}\p{N} .-]{1,32}$/u;
const EXACT_TIMESTAMP =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const MAX_SOURCE_ROWS = 2_000_000;
const HOLDOUT_SIZE = 10_000;

function sha256(value: string | Buffer) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function exactTimestamp(value: string, label: string) {
  if (!EXACT_TIMESTAMP.test(value)) {
    throw new Error(`${label} must be an exact UTC timestamp`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is invalid`);
  return date;
}

function requiredHttps(value: string, label: string) {
  if (!value.trim() || new URL(value).protocol !== 'https:') {
    throw new Error(`${label} must be a non-empty HTTPS URL`);
  }
}

function assertSource(source: AddressQlOfficialPostalSource) {
  for (const [field, value] of Object.entries(source)) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`official postal source ${source.id || 'unknown'}.${field} is required`);
    }
  }
  for (const field of [
    'snapshotUrl',
    'releaseUrl',
    'termsUrl',
    'correctionUrl',
  ] as const) {
    requiredHttps(source[field], `official postal source ${source.id}.${field}`);
  }
  exactTimestamp(source.reuseVerifiedAt, `${source.id}.reuseVerifiedAt`);
}

function deterministicSample(
  countryCode: string,
  sourceId: string,
  values: readonly string[],
) {
  const seed = `addressql-official-postal-holdout-v1:${countryCode}:${sourceId}`;
  return {
    seed,
    values: values
      .map(value => ({ value, rank: sha256(`${seed}:${value}`) }))
      .sort((left, right) => left.rank.localeCompare(right.rank))
      .slice(0, Math.min(HOLDOUT_SIZE, values.length))
      .map(item => item.value),
  };
}

function absentMutation(value: string, official: ReadonlySet<string>) {
  for (let index = value.length - 1; index >= 0; index -= 1) {
    const current = value[index];
    const replacements = /\d/.test(current)
      ? '0123456789'
      : /[A-Z]/.test(current)
        ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        : '';
    for (const replacement of replacements) {
      if (replacement === current) continue;
      const candidate = `${value.slice(0, index)}${replacement}${value.slice(index + 1)}`;
      if (!official.has(candidate)) return candidate;
    }
  }
  return null;
}

function round(value: number) {
  return Number(value.toFixed(6));
}

function canonicalCountryPostalCodes(values: readonly string[], countryCode: string) {
  if (!values.length || values.length > MAX_SOURCE_ROWS) {
    throw new Error(`${countryCode} official postal source has an invalid row count`);
  }
  const postalCodes = canonicalAddressQlPostalCodes(values);
  if (!postalCodes.length || postalCodes.some(value => !POSTAL_CODE.test(value))) {
    throw new Error(`${countryCode} official postal source contains an invalid postcode`);
  }
  return postalCodes;
}

export function buildAddressQlOfficialPostalArtifacts(input: {
  retrievedAt: string;
  validUntil: string;
  countries: readonly AddressQlOfficialPostalCountryInput[];
}): AddressQlOfficialPostalArtifacts {
  const retrievedAt = exactTimestamp(input.retrievedAt, 'retrievedAt');
  const validUntil = exactTimestamp(input.validUntil, 'validUntil');
  if (validUntil <= retrievedAt) throw new Error('validUntil must be after retrievedAt');
  if (!input.countries.length) throw new Error('at least one official postal country is required');

  const normalizedCountries = input.countries.map(country => {
    const countryCode = country.countryCode.trim().toUpperCase();
    if (!COUNTRY_CODE.test(countryCode)) {
      throw new Error(`invalid official postal country code: ${country.countryCode}`);
    }
    if (!country.scopeLabel.trim() || !country.scopePolicy.trim()) {
      throw new Error(`${countryCode} scope label and policy are required`);
    }
    assertSource(country.source);
    if (!SHA256.test(country.sourceSnapshotDigest)) {
      throw new Error(`${countryCode} source snapshot digest must be lowercase SHA-256`);
    }
    return {
      ...country,
      countryCode,
      postalCodes: canonicalCountryPostalCodes(country.postalCodes, countryCode),
    };
  });

  if (
    new Set(normalizedCountries.map(country => country.countryCode)).size
      !== normalizedCountries.length
  ) {
    throw new Error('official postal inputs contain duplicate country scopes');
  }

  const countries: Record<string, AddressQlOfficialPostalCountryArtifacts> = {};
  const adapters: AddressQlRuntimeConfig['adapters'] = [];
  const ledgerScopes: Record<string, unknown>[] = [];

  for (const country of normalizedCountries) {
    const official = new Set(country.postalCodes);
    const sample = deterministicSample(
      country.countryCode,
      country.source.id,
      country.postalCodes,
    );
    const negativeMutations = sample.values
      .map(value => absentMutation(value, official))
      .filter((value): value is string => value !== null);
    const holdoutPolicy = {
      version: ADDRESSQL_OFFICIAL_POSTAL_HOLDOUT_VERSION,
      countryCode: country.countryCode,
      sourceId: country.source.id,
      method: 'deterministic-sha256-sample-and-shape-preserving-mutation',
      sampleSize: sample.values.length,
      seedCommitment: sha256(sample.seed),
      persistedPostalValues: false,
    };
    const qualityReport = {
      version: ADDRESSQL_OFFICIAL_POSTAL_QUALITY_REPORT_VERSION,
      countryCode: country.countryCode,
      generatedAt: input.retrievedAt,
      source: {
        id: country.source.id,
        authority: country.source.authority,
        sourceVersion: country.source.sourceVersion,
        uniquePostcodeCount: country.postalCodes.length,
        coverage: country.source.coverage,
      },
      syntheticHoldout: {
        sampleSize: sample.values.length,
        officialPositiveMatchRate: 1,
        negativeMutationSampleCount: negativeMutations.length,
        negativeMutationGenerationRate: round(
          negativeMutations.length / Math.max(1, sample.values.length),
        ),
        officialNegativeContradictionRate: 0,
      },
      scope: {
        label: country.scopeLabel,
        policy: country.scopePolicy,
      },
      privacy: {
        containsRawAddress: false,
        containsRecipientData: false,
        containsCoordinates: false,
        containsPersistedHoldoutPostcodes: false,
      },
      nonClaims: [
        'Postcode-set membership is not delivery-point validation.',
        'Partial coverage never turns a postcode-set miss into a negative claim.',
        'This aggregate report is not independently signed.',
      ],
    };
    const holdoutDigest = sha256(JSON.stringify(holdoutPolicy));
    const reportDigest = sha256(JSON.stringify(qualityReport));
    const datasetDigest = digestAddressQlPostalCodes(country.postalCodes);
    const postcodeFile =
      `countries/${country.countryCode.toLowerCase()}/${country.source.id}.postcodes.txt`;

    adapters.push({
      id: `${country.source.id}-${country.countryCode.toLowerCase()}-existence`,
      version: country.source.sourceVersion,
      mode: 'conformance',
      countryCode: country.countryCode,
      purpose: 'existence',
      coverage: country.source.coverage,
      dataFile: postcodeFile,
      evidence: {
        sourceId: country.source.id,
        sourceVersion: country.source.sourceVersion,
        reuseRights: country.source.reuseRights,
        coverageStatement: country.source.coverageStatement,
        correctionUrl: country.source.correctionUrl,
        retrievedAt: input.retrievedAt,
        validUntil: input.validUntil,
        datasetDigest,
        holdoutDigest,
        reportDigest,
        attestationKeyId: 'pending-independent-reviewer',
        attestationSignature: 'unsigned-official-source-conformance',
      },
    });
    countries[country.countryCode] = {
      postcodeFile,
      postalCodes: country.postalCodes,
      holdoutPolicy,
      qualityReport,
    };
    ledgerScopes.push({
      countryCode: country.countryCode,
      scopeLabel: country.scopeLabel,
      scopePolicy: country.scopePolicy,
      source: country.source,
      sourceSnapshotDigest: country.sourceSnapshotDigest,
      derivedDatasetDigest: datasetDigest,
      holdoutDigest,
      reportDigest,
      uniquePostcodeCount: country.postalCodes.length,
    });
  }

  return {
    countries,
    runtimeConfig: {
      version: ADDRESSQL_RUNTIME_CONFIG_VERSION,
      adapters,
    },
    sourceLedger: {
      version: ADDRESSQL_OFFICIAL_POSTAL_SOURCE_LEDGER_VERSION,
      generatedAt: input.retrievedAt,
      countryScopeCount: normalizedCountries.length,
      scopes: ledgerScopes,
      trust: {
        requiredAlgorithm: 'Ed25519',
        requiredIndependentReviewerCount: 2,
        trustedPublicKeyCount: 0,
        approvedActivation: 'blocked',
        conformanceActivation: 'ready-with-explicit-opt-in',
        reason:
          'Official data is prepared, but independently controlled reviewer keys and signatures were not supplied.',
      },
      privacy: {
        rawSnapshotsPersisted: false,
        derivedDataContainsPostcodesOnly: true,
        containsRawAddress: false,
        containsRecipientData: false,
        containsCoordinates: false,
      },
    },
    trustStore: {
      version: 'addressql-trust-store-v1',
      keys: {},
    },
  };
}

type UnknownRecord = Record<string, unknown>;

function record(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as UnknownRecord;
}

function stringField(value: UnknownRecord, field: string, label: string) {
  const output = value[field];
  if (typeof output !== 'string' || !output.trim()) {
    throw new Error(`${label}.${field} must be a non-empty string`);
  }
  return output.trim();
}

const FRENCH_TERRITORY_PREFIXES = new Map([
  ['971', 'GP'],
  ['972', 'MQ'],
  ['973', 'GF'],
  ['974', 'RE'],
  ['975', 'PM'],
  ['976', 'YT'],
  ['977', 'BL'],
  ['978', 'MF'],
  ['986', 'WF'],
  ['987', 'PF'],
  ['988', 'NC'],
]);

export function extractLaPosteOfficialPostalScopes(rows: readonly unknown[]) {
  if (!rows.length || rows.length > MAX_SOURCE_ROWS) {
    throw new Error('La Poste source has an invalid row count');
  }
  const scopes = new Map<string, Set<string>>([['FR', new Set()]]);
  for (const [index, value] of rows.entries()) {
    const row = record(value, `La Poste row ${index + 1}`);
    const postcode = stringField(row, 'code_postal', `La Poste row ${index + 1}`);
    const insee = stringField(
      row,
      'code_commune_insee',
      `La Poste row ${index + 1}`,
    );
    if (!/^\d{5}$/.test(postcode) || !/^(?:\d{5}|2[AB]\d{3})$/.test(insee)) {
      throw new Error(`La Poste row ${index + 1} has an invalid code`);
    }
    if (insee === '99138') {
      const monaco = scopes.get('MC') ?? new Set<string>();
      monaco.add(postcode);
      scopes.set('MC', monaco);
      continue;
    }
    scopes.get('FR')?.add(postcode);
    const territory = FRENCH_TERRITORY_PREFIXES.get(insee.slice(0, 3));
    if (territory) {
      const values = scopes.get(territory) ?? new Set<string>();
      values.add(postcode);
      scopes.set(territory, values);
    }
  }
  return Object.fromEntries(
    [...scopes.entries()]
      .filter(([, values]) => values.size)
      .map(([countryCode, values]) => [countryCode, [...values].sort()]),
  );
}

export function extractFinlandPostiPostalCodes(fixedWidth: string) {
  const rows = fixedWidth.split(/\r?\n/).filter(Boolean);
  if (!rows.length || rows.length > MAX_SOURCE_ROWS) {
    throw new Error('Posti PCF source has an invalid row count');
  }
  const postalCodes = new Set<string>();
  for (const [index, row] of rows.entries()) {
    if (
      row.length !== 220
      || !row.startsWith('PONOT')
      || !/^\d{8}$/.test(row.slice(5, 13))
      || !/^\d{5}$/.test(row.slice(13, 18))
      || !/^[1-8]$/.test(row.slice(110, 111))
    ) {
      throw new Error(`Posti PCF row ${index + 1} has an invalid fixed-width shape`);
    }
    postalCodes.add(row.slice(13, 18));
  }
  return [...postalCodes].sort();
}

function parseDelimited(text: string, delimiter: string) {
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
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === delimiter) {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some(Boolean)) rows.push(row);
      if (rows.length > MAX_SOURCE_ROWS) throw new Error('delimited source exceeds row limit');
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error('delimited source has an unterminated quote');
  row.push(field.replace(/\r$/, ''));
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function extractSwissOfficialPostalScopes(csv: string) {
  const rows = parseDelimited(csv.replace(/^\uFEFF/, ''), ';');
  const header = rows.shift();
  if (!header) throw new Error('swisstopo CSV has no header');
  const postcodeIndex = header.indexOf('PLZ4');
  const municipalityIndex = header.indexOf('BFS-Nr');
  const cantonIndex = header.findIndex(value => value.startsWith('Kanton'));
  if (postcodeIndex < 0 || municipalityIndex < 0 || cantonIndex < 0) {
    throw new Error('swisstopo CSV is missing required columns');
  }
  const swiss = new Set<string>();
  const liechtenstein = new Set<string>();
  for (const [index, row] of rows.entries()) {
    const postcode = row[postcodeIndex]?.trim();
    const municipality = row[municipalityIndex]?.trim();
    const canton = row[cantonIndex]?.trim();
    if (!/^\d{4}$/.test(postcode) || !/^\d{1,4}$/.test(municipality)) {
      throw new Error(`swisstopo CSV row ${index + 2} has an invalid code`);
    }
    if (!canton && /^70\d{2}$/.test(municipality)) {
      liechtenstein.add(postcode);
    } else {
      swiss.add(postcode);
    }
  }
  if (!swiss.size || !liechtenstein.size) {
    throw new Error('swisstopo CSV must contain both CH and LI scopes');
  }
  return {
    CH: [...swiss].sort(),
    LI: [...liechtenstein].sort(),
  };
}

export function extractDenmarkOfficialPostalCodes(json: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(`Dataforsyningen postcode response is invalid JSON: ${(error as Error).message}`);
  }
  if (!Array.isArray(parsed) || !parsed.length || parsed.length > MAX_SOURCE_ROWS) {
    throw new Error('Dataforsyningen postcode response has an invalid row count');
  }
  const postalCodes = new Set<string>();
  for (const [index, value] of parsed.entries()) {
    const row = record(value, `Dataforsyningen row ${index + 1}`);
    const postcode = stringField(row, 'nr', `Dataforsyningen row ${index + 1}`);
    if (!/^\d{4}$/.test(postcode)) {
      throw new Error(`Dataforsyningen row ${index + 1} has an invalid postcode`);
    }
    postalCodes.add(postcode);
  }
  return [...postalCodes].sort();
}

export type OnsOfficialPostalScopes = {
  GB: string[];
  IM: string[];
  JE: string[];
  GG: string[];
  excludedNorthernIrelandCount: number;
};

export function extractOnsOfficialPostalScopes(
  rows: readonly unknown[],
): OnsOfficialPostalScopes {
  if (!rows.length || rows.length > MAX_SOURCE_ROWS) {
    throw new Error('ONS postcode response has an invalid row count');
  }
  const scopes = {
    GB: new Set<string>(),
    IM: new Set<string>(),
    JE: new Set<string>(),
    GG: new Set<string>(),
  };
  let excludedNorthernIrelandCount = 0;

  for (const [index, value] of rows.entries()) {
    const feature = record(value, `ONS postcode feature ${index + 1}`);
    const attributes = record(
      feature.attributes,
      `ONS postcode feature ${index + 1}.attributes`,
    );
    const postcodeValue = attributes.PCDS;
    const terminationValue = attributes.DOTERM;
    if (typeof postcodeValue !== 'string' || !postcodeValue.trim()) {
      throw new Error(`ONS postcode feature ${index + 1}.PCDS is required`);
    }
    if (
      terminationValue !== null
      && terminationValue !== undefined
      && terminationValue !== ''
    ) {
      throw new Error(
        `ONS postcode feature ${index + 1} is terminated and outside the live-only query`,
      );
    }
    const postcode = postcodeValue.trim().toUpperCase().replace(/\s+/g, ' ');
    if (
      postcode !== 'GIR 0AA'
      && !/^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/.test(postcode)
    ) {
      throw new Error(`ONS postcode feature ${index + 1} has an invalid postcode`);
    }
    if (postcode.startsWith('BT')) {
      excludedNorthernIrelandCount += 1;
    } else if (postcode.startsWith('IM')) {
      scopes.IM.add(postcode);
    } else if (postcode.startsWith('JE')) {
      scopes.JE.add(postcode);
    } else if (postcode.startsWith('GY')) {
      scopes.GG.add(postcode);
    } else {
      scopes.GB.add(postcode);
    }
  }

  return {
    GB: [...scopes.GB].sort(),
    IM: [...scopes.IM].sort(),
    JE: [...scopes.JE].sort(),
    GG: [...scopes.GG].sort(),
    excludedNorthernIrelandCount,
  };
}
