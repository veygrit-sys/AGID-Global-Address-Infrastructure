import { Buffer } from 'node:buffer';
import {
  createHash,
  verify,
  type KeyObject,
} from 'node:crypto';
import {
  readFileSync,
  realpathSync,
  statSync,
} from 'node:fs';
import {
  dirname,
  isAbsolute,
  relative,
  resolve,
} from 'node:path';

import {
  createAddressQlPostalSetAdapter,
  type AddressQlPostalSetAdapterOptions,
} from './addressQlPostalSetAdapter';
import {
  createAddressQlRuntimeAdapterRegistry,
  type AddressQlRuntimeAdapter,
  type AddressQlRuntimeAdapterEvidence,
  type AddressQlRuntimeAdapterRegistryOptions,
} from './addressQlRuntimeAdapter';
import { loadAddressQlTrustedPublicKeys } from './addressQlTrustPolicy';

export const ADDRESSQL_RUNTIME_CONFIG_VERSION = 'addressql-runtime-config-v1';
export const ADDRESSQL_TRUST_STORE_VERSION = 'addressql-trust-store-v1';

export type AddressQlRuntimeAdapterConfig = Omit<
  AddressQlPostalSetAdapterOptions,
  'postalCodes'
> & {
  dataFile: string;
};

export type AddressQlRuntimeConfig = {
  version: typeof ADDRESSQL_RUNTIME_CONFIG_VERSION;
  adapters: AddressQlRuntimeAdapterConfig[];
};

export type AddressQlTrustStore = {
  version: typeof ADDRESSQL_TRUST_STORE_VERSION;
  keys: Record<string, string>;
};

export type AddressQlRuntimeConfigLoadOptions = {
  configPath: string;
  trustStorePath?: string;
  allowConformanceAdapters?: boolean;
  now?: string | number | Date;
};

export type LoadedAddressQlRuntimeConfig = {
  runtimeAdapters: AddressQlRuntimeAdapter[];
  registryOptions: AddressQlRuntimeAdapterRegistryOptions;
  diagnostics: {
    configPath: string;
    adapterCount: number;
    approvedAdapterCount: number;
    conformanceAdapterCount: number;
    countryCodes: string[];
    releaseLedgerVerified?: boolean;
    releaseSequence?: number;
  };
};

const MAX_CONFIG_BYTES = 1024 * 1024;
const MAX_POSTAL_DATA_BYTES = 64 * 1024 * 1024;
const TECHNICAL_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/;
const POSTAL_CODE_VALUE = /^[\p{L}\p{N} .-]{1,32}$/u;
const CONFIG_FIELDS = new Set(['version', 'adapters']);
const ADAPTER_FIELDS = new Set([
  'id',
  'version',
  'mode',
  'countryCode',
  'purpose',
  'coverage',
  'dataFile',
  'evidence',
]);
const EVIDENCE_FIELDS = new Set([
  'sourceId',
  'sourceVersion',
  'reuseRights',
  'coverageStatement',
  'correctionUrl',
  'retrievedAt',
  'validUntil',
  'datasetDigest',
  'holdoutDigest',
  'reportDigest',
  'attestationKeyId',
  'attestationSignature',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertFields(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  label: string,
) {
  const unknown = Object.keys(value).filter(key => !allowed.has(key));
  if (unknown.length) {
    throw new Error(`${label} contains unsupported fields: ${unknown.sort().join(', ')}`);
  }
}

function readBoundedText(path: string, maxBytes: number, label: string) {
  const size = statSync(path).size;
  if (size <= 0 || size > maxBytes) {
    throw new Error(`${label} must be between 1 and ${maxBytes} bytes`);
  }
  return readFileSync(path, 'utf8');
}

function readBoundedJson(
  path: string,
  maxBytes: number,
  label: string,
): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readBoundedText(path, maxBytes, label));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${(error as Error).message}`);
  }
  if (!isRecord(parsed)) throw new Error(`${label} must be a JSON object`);
  return parsed;
}

function normalizePostalCode(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .toUpperCase()
    .replace(/[‐‑‒–—―]/g, '-')
    .replace(/\s+/g, ' ');
}

export function canonicalAddressQlPostalCodes(values: readonly string[]) {
  return [...new Set(values.map(normalizePostalCode).filter(Boolean))].sort();
}

export function digestAddressQlPostalCodes(values: readonly string[]) {
  const canonical = canonicalAddressQlPostalCodes(values);
  const payload = `${canonical.join('\n')}\n`;
  return `sha256:${createHash('sha256').update(payload, 'utf8').digest('hex')}`;
}

function parsePostalData(path: string) {
  const values = readBoundedText(
    path,
    MAX_POSTAL_DATA_BYTES,
    'postal data file',
  ).split(/\r?\n/);
  const canonical = canonicalAddressQlPostalCodes(values);
  if (!canonical.length) throw new Error('postal data file has no postcode rows');
  if (canonical.some(value => !POSTAL_CODE_VALUE.test(value))) {
    throw new Error('postal data file contains a non-postcode value');
  }
  return canonical;
}

export function inspectAddressQlPostalDataFile(path: string) {
  const postalCodes = parsePostalData(resolve(path));
  return {
    rowCount: postalCodes.length,
    datasetDigest: digestAddressQlPostalCodes(postalCodes),
  };
}

function localDataPath(configPath: string, dataFile: string) {
  if (!dataFile || isAbsolute(dataFile)) {
    throw new Error('adapter dataFile must be a relative path');
  }
  const configDirectory = realpathSync(dirname(configPath));
  const dataPath = realpathSync(resolve(configDirectory, dataFile));
  const relation = relative(configDirectory, dataPath);
  if (!relation || relation === '..' || relation.startsWith(`..\\`) || relation.startsWith('../')) {
    throw new Error('adapter dataFile must stay inside the runtime config directory');
  }
  return dataPath;
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

function parseEvidence(value: unknown, label: string): AddressQlRuntimeAdapterEvidence {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertFields(value, EVIDENCE_FIELDS, label);
  return {
    sourceId: requiredString(value, 'sourceId', label),
    sourceVersion: requiredString(value, 'sourceVersion', label),
    reuseRights: requiredString(value, 'reuseRights', label),
    coverageStatement: requiredString(value, 'coverageStatement', label),
    correctionUrl: requiredString(value, 'correctionUrl', label),
    retrievedAt: requiredString(value, 'retrievedAt', label),
    validUntil: requiredString(value, 'validUntil', label),
    datasetDigest: requiredString(value, 'datasetDigest', label),
    holdoutDigest: requiredString(value, 'holdoutDigest', label),
    reportDigest: requiredString(value, 'reportDigest', label),
    attestationKeyId: requiredString(value, 'attestationKeyId', label),
    attestationSignature: requiredString(value, 'attestationSignature', label),
  };
}

function parseAdapterConfig(
  value: unknown,
  index: number,
): AddressQlRuntimeAdapterConfig {
  const label = `runtime config adapters[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  assertFields(value, ADAPTER_FIELDS, label);
  const mode = requiredString(value, 'mode', label);
  const purpose = requiredString(value, 'purpose', label);
  const coverage = requiredString(value, 'coverage', label);
  if (!['approved', 'conformance'].includes(mode)) {
    throw new Error(`${label}.mode must be approved or conformance`);
  }
  if (!['existence', 'delivery'].includes(purpose)) {
    throw new Error(`${label}.purpose must be existence or delivery`);
  }
  if (!['complete', 'partial'].includes(coverage)) {
    throw new Error(`${label}.coverage must be complete or partial`);
  }
  return {
    id: requiredString(value, 'id', label),
    version: requiredString(value, 'version', label),
    mode: mode as AddressQlRuntimeAdapterConfig['mode'],
    countryCode: requiredString(value, 'countryCode', label),
    purpose: purpose as AddressQlRuntimeAdapterConfig['purpose'],
    coverage: coverage as AddressQlRuntimeAdapterConfig['coverage'],
    dataFile: requiredString(value, 'dataFile', label),
    evidence: parseEvidence(value.evidence, `${label}.evidence`),
  };
}

function loadTrustStore(
  path: string | undefined,
  now?: string | number | Date,
) {
  const keys = new Map<string, KeyObject>();
  if (!path) return keys;
  for (const [keyId, key] of loadAddressQlTrustedPublicKeys(path, { now })) {
    keys.set(keyId, key);
  }
  return keys;
}

export function buildAddressQlRuntimeAttestationPayload(
  adapter: AddressQlRuntimeAdapterConfig,
) {
  const { attestationSignature: _signature, ...evidence } = adapter.evidence;
  return JSON.stringify({
    schemaVersion: ADDRESSQL_RUNTIME_CONFIG_VERSION,
    adapter: {
      id: adapter.id,
      version: adapter.version,
      mode: adapter.mode,
      countryCode: adapter.countryCode.trim().toUpperCase(),
      purpose: adapter.purpose,
      coverage: adapter.coverage,
      dataFile: adapter.dataFile,
    },
    evidence,
  });
}

function verifyApprovedAdapter(
  adapter: AddressQlRuntimeAdapterConfig,
  trustedKeys: ReadonlyMap<string, KeyObject>,
) {
  const key = trustedKeys.get(adapter.evidence.attestationKeyId);
  if (!key) {
    throw new Error(
      `approved adapter ${adapter.id} has no trusted attestation key`,
    );
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(adapter.evidence.attestationSignature)) {
    throw new Error(`approved adapter ${adapter.id} has an invalid signature encoding`);
  }
  const signature = Buffer.from(
    adapter.evidence.attestationSignature,
    'base64',
  );
  if (
    signature.length !== 64
    || !verify(
      null,
      Buffer.from(buildAddressQlRuntimeAttestationPayload(adapter), 'utf8'),
      key,
      signature,
    )
  ) {
    throw new Error(`approved adapter ${adapter.id} failed attestation verification`);
  }
}

export function loadAddressQlRuntimeConfig(
  options: AddressQlRuntimeConfigLoadOptions,
): LoadedAddressQlRuntimeConfig {
  const configPath = resolve(options.configPath);
  const parsed = readBoundedJson(
    configPath,
    MAX_CONFIG_BYTES,
    'runtime config',
  );
  assertFields(parsed, CONFIG_FIELDS, 'runtime config');
  if (parsed.version !== ADDRESSQL_RUNTIME_CONFIG_VERSION) {
    throw new Error(
      `runtime config version must be ${ADDRESSQL_RUNTIME_CONFIG_VERSION}`,
    );
  }
  if (!Array.isArray(parsed.adapters) || !parsed.adapters.length) {
    throw new Error('runtime config adapters must be a non-empty array');
  }

  const configs = parsed.adapters.map(parseAdapterConfig);
  if (new Set(configs.map(adapter => adapter.id)).size !== configs.length) {
    throw new Error('runtime config contains duplicate adapter ids');
  }
  const trustedKeys = loadTrustStore(
    options.trustStorePath ? resolve(options.trustStorePath) : undefined,
    options.now,
  );
  const verifiedEvidence = new WeakSet<object>();
  const runtimeAdapters = configs.map(adapter => {
    if (adapter.mode === 'conformance' && !options.allowConformanceAdapters) {
      throw new Error(
        `conformance adapter ${adapter.id} requires explicit opt-in`,
      );
    }
    const postalCodes = parsePostalData(
      localDataPath(configPath, adapter.dataFile),
    );
    const actualDigest = digestAddressQlPostalCodes(postalCodes);
    if (actualDigest !== adapter.evidence.datasetDigest) {
      throw new Error(`adapter ${adapter.id} postal dataset digest mismatch`);
    }
    if (adapter.mode === 'approved') {
      verifyApprovedAdapter(adapter, trustedKeys);
      verifiedEvidence.add(adapter.evidence);
    }
    return createAddressQlPostalSetAdapter({
      ...adapter,
      postalCodes,
    });
  });

  const registryOptions: AddressQlRuntimeAdapterRegistryOptions = {
    now: options.now,
    allowConformanceAdapters: options.allowConformanceAdapters,
    verifyIndependentAttestation: evidence => verifiedEvidence.has(evidence),
  };
  const registry = createAddressQlRuntimeAdapterRegistry(
    runtimeAdapters,
    registryOptions,
  );
  if (registry.adapterCount !== runtimeAdapters.length) {
    throw new Error(
      'one or more runtime adapters failed evidence, expiry, or shape validation',
    );
  }

  return {
    runtimeAdapters,
    registryOptions,
    diagnostics: {
      configPath,
      adapterCount: registry.adapterCount,
      approvedAdapterCount: registry.approvedAdapterCount,
      conformanceAdapterCount: registry.conformanceAdapterCount,
      countryCodes: [...new Set(
        runtimeAdapters.flatMap(adapter => adapter.countryCodes),
      )].sort(),
    },
  };
}
