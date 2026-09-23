import {
  createHash,
  verify,
} from 'node:crypto';
import {
  existsSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import {
  dirname,
  resolve,
} from 'node:path';

import {
  ADDRESSQL_RUNTIME_CONFIG_VERSION,
  buildAddressQlRuntimeAttestationPayload,
  loadAddressQlRuntimeConfig,
  type AddressQlRuntimeAdapterConfig,
  type AddressQlRuntimeConfig,
} from './addressQlRuntimeConfig';
import { loadAddressQlTrustPolicy } from './addressQlTrustPolicy';

export const ADDRESSQL_RUNTIME_ATTESTATION_WORKFLOW_VERSION =
  'addressql-runtime-attestation-workflow-v1';

const MAX_CONFIG_BYTES = 1024 * 1024;
const MAX_SIGNATURE_BYTES = 1024;
const KEY_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/;

export type PrepareAddressQlRuntimeAttestationOptions = {
  configPath: string;
  adapterId: string;
  keyId: string;
  outputPath: string;
  trustStorePath?: string;
  now?: string;
};

export type FinalizeAddressQlRuntimeAttestationOptions = {
  configPath: string;
  adapterId: string;
  keyId: string;
  signaturePath: string;
  trustStorePath: string;
  outputPath: string;
  now?: string;
};

type RuntimeConfigFile = AddressQlRuntimeConfig & {
  adapters: AddressQlRuntimeAdapterConfig[];
};


function readBoundedText(path: string, maxBytes: number, label: string) {
  const absolutePath = resolve(path);
  const stats = statSync(absolutePath);
  if (!stats.isFile()) throw new Error(`${label} must be a regular file`);
  if (stats.size <= 0 || stats.size > maxBytes) {
    throw new Error(`${label} exceeds its bounded size`);
  }
  return readFileSync(absolutePath, 'utf8');
}

function readRuntimeConfig(path: string): RuntimeConfigFile {
  const value = JSON.parse(
    readBoundedText(path, MAX_CONFIG_BYTES, 'runtime config'),
  ) as RuntimeConfigFile;
  if (
    value.version !== ADDRESSQL_RUNTIME_CONFIG_VERSION
    || !Array.isArray(value.adapters)
  ) {
    throw new Error('runtime config has an invalid version or adapter list');
  }
  return value;
}

function adapterById(config: RuntimeConfigFile, adapterId: string) {
  const matches = config.adapters.filter(adapter => adapter.id === adapterId);
  if (matches.length !== 1) {
    throw new Error(`runtime config must contain exactly one adapter ${adapterId}`);
  }
  return matches[0];
}

function assertKeyId(keyId: string) {
  if (!KEY_ID.test(keyId)) throw new Error('attestation key id is invalid');
}

function approvedCandidate(
  adapter: AddressQlRuntimeAdapterConfig,
  keyId: string,
  signature = 'pending-detached-signature',
): AddressQlRuntimeAdapterConfig {
  return {
    ...adapter,
    mode: 'approved',
    evidence: {
      ...adapter.evidence,
      attestationKeyId: keyId,
      attestationSignature: signature,
    },
  };
}

function payloadDigest(payload: string) {
  return `sha256:${createHash('sha256').update(payload).digest('hex')}`;
}

function assertNewOutput(path: string, label: string) {
  if (existsSync(resolve(path))) {
    throw new Error(`${label} already exists`);
  }
}

function validateInputConfig(input: {
  configPath: string;
  trustStorePath?: string;
  now?: string;
}) {
  return loadAddressQlRuntimeConfig({
    configPath: resolve(input.configPath),
    ...(input.trustStorePath
      ? { trustStorePath: resolve(input.trustStorePath) }
      : {}),
    allowConformanceAdapters: true,
    ...(input.now ? { now: input.now } : {}),
  });
}

export function prepareAddressQlRuntimeAttestation(
  options: PrepareAddressQlRuntimeAttestationOptions,
) {
  assertKeyId(options.keyId);
  assertNewOutput(options.outputPath, 'attestation payload output');
  validateInputConfig(options);
  const config = readRuntimeConfig(options.configPath);
  const adapter = adapterById(config, options.adapterId);
  if (adapter.mode !== 'conformance') {
    throw new Error('only a conformance adapter can be prepared for approval');
  }
  const candidate = approvedCandidate(adapter, options.keyId);
  const payload = buildAddressQlRuntimeAttestationPayload(candidate);
  writeFileSync(resolve(options.outputPath), payload, {
    encoding: 'utf8',
    flag: 'wx',
  });

  return {
    status: 'ok' as const,
    version: ADDRESSQL_RUNTIME_ATTESTATION_WORKFLOW_VERSION,
    adapterId: candidate.id,
    adapterVersion: candidate.version,
    countryCode: candidate.countryCode,
    purpose: candidate.purpose,
    keyId: options.keyId,
    payloadPath: resolve(options.outputPath),
    payloadDigest: payloadDigest(payload),
    signingAlgorithm: 'Ed25519' as const,
    signatureEncoding: 'base64' as const,
    privacy: {
      containsPostalValues: false,
      containsRawAddress: false,
      containsRecipientData: false,
      containsPrivateKey: false,
    },
  };
}

function readDetachedSignature(path: string) {
  const text = readBoundedText(
    path,
    MAX_SIGNATURE_BYTES,
    'detached signature',
  ).trim();
  if (/PRIVATE KEY|PUBLIC KEY/.test(text)) {
    throw new Error('detached signature file must not contain key material');
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(text)) {
    throw new Error('detached signature must be base64');
  }
  const signature = Buffer.from(text, 'base64');
  if (signature.length !== 64) {
    throw new Error('Ed25519 detached signature must be 64 bytes');
  }
  return {
    encoded: text,
    signature,
  };
}

export function finalizeAddressQlRuntimeAttestation(
  options: FinalizeAddressQlRuntimeAttestationOptions,
) {
  assertKeyId(options.keyId);
  assertNewOutput(options.outputPath, 'approved runtime config output');
  if (
    dirname(resolve(options.outputPath))
    !== dirname(resolve(options.configPath))
  ) {
    throw new Error(
      'approved runtime config output must stay beside the input config so relative data files remain stable',
    );
  }
  validateInputConfig({
    configPath: options.configPath,
    trustStorePath: options.trustStorePath,
    now: options.now,
  });
  const config = readRuntimeConfig(options.configPath);
  const adapter = adapterById(config, options.adapterId);
  if (adapter.mode !== 'conformance') {
    throw new Error('only a conformance adapter can be finalized for approval');
  }
  const trustPolicy = loadAddressQlTrustPolicy(options.trustStorePath, {
    now: options.now,
  });
  const publicKey = trustPolicy.usableKeys.get(options.keyId);
  if (!publicKey) {
    throw new Error(`trust store does not contain an active key ${options.keyId}`);
  }

  const detached = readDetachedSignature(options.signaturePath);
  const candidate = approvedCandidate(adapter, options.keyId, detached.encoded);
  const payload = buildAddressQlRuntimeAttestationPayload(candidate);
  if (!verify(null, Buffer.from(payload, 'utf8'), publicKey, detached.signature)) {
    throw new Error('detached attestation signature verification failed');
  }

  const outputConfig: RuntimeConfigFile = {
    ...config,
    adapters: config.adapters.map(item =>
      item.id === candidate.id ? candidate : item),
  };
  writeFileSync(
    resolve(options.outputPath),
    `${JSON.stringify(outputConfig, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' },
  );

  const loaded = loadAddressQlRuntimeConfig({
    configPath: resolve(options.outputPath),
    trustStorePath: resolve(options.trustStorePath),
    allowConformanceAdapters: true,
    ...(options.now ? { now: options.now } : {}),
  });
  if (!loaded.runtimeAdapters.some(item =>
    item.id === candidate.id && item.mode === 'approved')) {
    throw new Error('approved adapter was not activated after finalization');
  }

  return {
    status: 'ok' as const,
    version: ADDRESSQL_RUNTIME_ATTESTATION_WORKFLOW_VERSION,
    adapterId: candidate.id,
    adapterVersion: candidate.version,
    countryCode: candidate.countryCode,
    purpose: candidate.purpose,
    keyId: options.keyId,
    payloadDigest: payloadDigest(payload),
    approvedConfigPath: resolve(options.outputPath),
    approvedAdapterCount: loaded.diagnostics.approvedAdapterCount,
    privacy: {
      containsPostalValues: false,
      containsRawAddress: false,
      containsRecipientData: false,
      containsPrivateKey: false,
    },
  };
}
