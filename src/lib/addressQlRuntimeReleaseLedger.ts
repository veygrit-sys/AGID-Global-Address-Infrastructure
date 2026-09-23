import {
  createHash,
  verify,
} from 'node:crypto';
import {
  existsSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';

import {
  ADDRESSQL_RUNTIME_CONFIG_VERSION,
  loadAddressQlRuntimeConfig,
  type LoadedAddressQlRuntimeConfig,
} from './addressQlRuntimeConfig';
import {
  ADDRESSQL_TRUST_POLICY_VERSION,
  loadAddressQlTrustPolicy,
} from './addressQlTrustPolicy';

export const ADDRESSQL_RUNTIME_RELEASE_PAYLOAD_VERSION =
  'addressql-runtime-release-payload-v1';
export const ADDRESSQL_RUNTIME_RELEASE_LEDGER_VERSION =
  'addressql-runtime-release-ledger-v1';
export const ADDRESSQL_RUNTIME_RELEASE_STATE_VERSION =
  'addressql-runtime-release-state-v1';

const MAX_CONFIG_BYTES = 1024 * 1024;
const MAX_PAYLOAD_BYTES = 256 * 1024;
const MAX_LEDGER_BYTES = 512 * 1024;
const MAX_STATE_BYTES = 64 * 1024;
const MAX_SIGNATURE_BYTES = 1024;
const TECHNICAL_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/;
const SHA256 = /^sha256:[a-f0-9]{64}$/;

export type AddressQlRuntimeReleasePayload = {
  version: typeof ADDRESSQL_RUNTIME_RELEASE_PAYLOAD_VERSION;
  releaseId: string;
  sequence: number;
  previousReleaseDigest: string | null;
  configDigest: string;
  createdAt: string;
  validFrom: string;
  validUntil: string;
  minimumSignatures: number;
};

export type AddressQlRuntimeReleaseSignature = {
  keyId: string;
  reviewerId: string;
  signature: string;
};

export type AddressQlRuntimeReleaseLedger = {
  version: typeof ADDRESSQL_RUNTIME_RELEASE_LEDGER_VERSION;
  payload: AddressQlRuntimeReleasePayload;
  signatures: AddressQlRuntimeReleaseSignature[];
  releaseDigest: string;
};

export type AddressQlRuntimeReleaseState = {
  version: typeof ADDRESSQL_RUNTIME_RELEASE_STATE_VERSION;
  lastSequence: number;
  lastReleaseDigest: string;
  lastConfigDigest: string;
  updatedAt: string;
};

function sha256(value: string | Buffer) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function exactTimestamp(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new Error(`${label} must be an exact UTC timestamp`);
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`${label} is invalid`);
  return timestamp;
}

function readBoundedText(path: string, maxBytes: number, label: string) {
  const absolutePath = resolve(path);
  const stats = statSync(absolutePath);
  if (!stats.isFile() || stats.size <= 0 || stats.size > maxBytes) {
    throw new Error(`${label} must be a bounded regular file`);
  }
  return readFileSync(absolutePath, 'utf8');
}

function readJson<T>(path: string, maxBytes: number, label: string) {
  const value = JSON.parse(readBoundedText(path, maxBytes, label)) as unknown;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object`);
  }
  return value as T;
}

function assertNewOutput(path: string, label: string) {
  if (existsSync(resolve(path))) throw new Error(`${label} already exists`);
}

function configDigest(path: string) {
  const text = readBoundedText(path, MAX_CONFIG_BYTES, 'runtime config');
  const value = JSON.parse(text) as {
    version?: unknown;
    adapters?: Array<{ mode?: unknown }>;
  };
  if (
    value.version !== ADDRESSQL_RUNTIME_CONFIG_VERSION
    || !Array.isArray(value.adapters)
    || !value.adapters.length
    || value.adapters.some(adapter => adapter.mode !== 'approved')
  ) {
    throw new Error('release config must contain approved runtime adapters only');
  }
  if (/PRIVATE KEY/.test(text)) {
    throw new Error('release config must not contain private key material');
  }
  return sha256(text);
}

function validatePayload(payload: AddressQlRuntimeReleasePayload) {
  if (payload.version !== ADDRESSQL_RUNTIME_RELEASE_PAYLOAD_VERSION) {
    throw new Error('runtime release payload version is invalid');
  }
  if (!TECHNICAL_ID.test(payload.releaseId)) {
    throw new Error('runtime release id is invalid');
  }
  if (!Number.isSafeInteger(payload.sequence) || payload.sequence < 1) {
    throw new Error('runtime release sequence must be a positive safe integer');
  }
  if (
    payload.previousReleaseDigest !== null
    && !SHA256.test(payload.previousReleaseDigest)
  ) {
    throw new Error('previous release digest is invalid');
  }
  if (payload.sequence === 1 && payload.previousReleaseDigest !== null) {
    throw new Error('first runtime release must not have a previous digest');
  }
  if (payload.sequence > 1 && payload.previousReleaseDigest === null) {
    throw new Error('subsequent runtime release needs a previous digest');
  }
  if (!SHA256.test(payload.configDigest)) {
    throw new Error('runtime release config digest is invalid');
  }
  const createdAt = exactTimestamp(payload.createdAt, 'release.createdAt');
  const validFrom = exactTimestamp(payload.validFrom, 'release.validFrom');
  const validUntil = exactTimestamp(payload.validUntil, 'release.validUntil');
  if (createdAt > validFrom || validUntil <= validFrom) {
    throw new Error('runtime release validity window is invalid');
  }
  if (
    !Number.isInteger(payload.minimumSignatures)
    || payload.minimumSignatures < 2
    || payload.minimumSignatures > 10
  ) {
    throw new Error('runtime release minimumSignatures must be between 2 and 10');
  }
}

export function buildAddressQlRuntimeReleasePayload(
  payload: AddressQlRuntimeReleasePayload,
) {
  validatePayload(payload);
  return JSON.stringify({
    version: payload.version,
    releaseId: payload.releaseId,
    sequence: payload.sequence,
    previousReleaseDigest: payload.previousReleaseDigest,
    configDigest: payload.configDigest,
    createdAt: payload.createdAt,
    validFrom: payload.validFrom,
    validUntil: payload.validUntil,
    minimumSignatures: payload.minimumSignatures,
  });
}

function sortedSignatures(
  signatures: readonly AddressQlRuntimeReleaseSignature[],
) {
  return [...signatures].sort((left, right) => left.keyId.localeCompare(right.keyId));
}

function calculateReleaseDigest(
  payload: AddressQlRuntimeReleasePayload,
  signatures: readonly AddressQlRuntimeReleaseSignature[],
) {
  return sha256(JSON.stringify({
    payload: JSON.parse(buildAddressQlRuntimeReleasePayload(payload)),
    signatures: sortedSignatures(signatures),
  }));
}

function readSignature(path: string) {
  const signature = readBoundedText(
    path,
    MAX_SIGNATURE_BYTES,
    'detached release signature',
  ).trim();
  if (/PRIVATE KEY|PUBLIC KEY/.test(signature)) {
    throw new Error('release signature file must not contain key material');
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(signature)) {
    throw new Error('release signature must be base64');
  }
  const bytes = Buffer.from(signature, 'base64');
  if (bytes.length !== 64) throw new Error('Ed25519 release signature must be 64 bytes');
  return { signature, bytes };
}

export function prepareAddressQlRuntimeRelease(input: {
  configPath: string;
  releaseId: string;
  sequence: number;
  previousReleaseDigest: string | null;
  createdAt: string;
  validFrom: string;
  validUntil: string;
  minimumSignatures?: number;
  outputPath: string;
}) {
  assertNewOutput(input.outputPath, 'runtime release payload output');
  const payload: AddressQlRuntimeReleasePayload = {
    version: ADDRESSQL_RUNTIME_RELEASE_PAYLOAD_VERSION,
    releaseId: input.releaseId,
    sequence: input.sequence,
    previousReleaseDigest: input.previousReleaseDigest,
    configDigest: configDigest(input.configPath),
    createdAt: input.createdAt,
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    minimumSignatures: input.minimumSignatures ?? 2,
  };
  const canonical = buildAddressQlRuntimeReleasePayload(payload);
  writeFileSync(resolve(input.outputPath), canonical, {
    encoding: 'utf8',
    flag: 'wx',
  });
  return {
    status: 'ok' as const,
    version: ADDRESSQL_RUNTIME_RELEASE_PAYLOAD_VERSION,
    releaseId: payload.releaseId,
    sequence: payload.sequence,
    configDigest: payload.configDigest,
    payloadDigest: sha256(canonical),
    payloadPath: resolve(input.outputPath),
    minimumSignatures: payload.minimumSignatures,
    privacy: {
      containsPostalValues: false,
      containsRawAddress: false,
      containsRecipientData: false,
      containsPrivateKey: false,
    },
  };
}

export function finalizeAddressQlRuntimeRelease(input: {
  configPath: string;
  payloadPath: string;
  trustStorePath: string;
  signatures: Array<{ keyId: string; signaturePath: string }>;
  outputPath: string;
  now?: string;
}) {
  assertNewOutput(input.outputPath, 'runtime release ledger output');
  const canonical = readBoundedText(
    input.payloadPath,
    MAX_PAYLOAD_BYTES,
    'runtime release payload',
  );
  const payload = JSON.parse(canonical) as AddressQlRuntimeReleasePayload;
  if (buildAddressQlRuntimeReleasePayload(payload) !== canonical) {
    throw new Error('runtime release payload is not canonical');
  }
  if (payload.configDigest !== configDigest(input.configPath)) {
    throw new Error('runtime release payload config digest mismatch');
  }
  const trust = loadAddressQlTrustPolicy(input.trustStorePath, {
    now: input.now,
    requireV2: true,
  });
  const required = Math.max(payload.minimumSignatures, trust.minimumSignatures);
  const keyIds = new Set(input.signatures.map(item => item.keyId));
  if (keyIds.size !== input.signatures.length) {
    throw new Error('runtime release signatures must use unique reviewer keys');
  }
  if (input.signatures.length < required) {
    throw new Error(`runtime release requires at least ${required} signatures`);
  }
  const signatures = input.signatures.map(item => {
    if (!TECHNICAL_ID.test(item.keyId)) throw new Error('release signature key id is invalid');
    const key = trust.usableKeys.get(item.keyId);
    if (!key) throw new Error(`release reviewer key ${item.keyId} is not active`);
    const reviewerId = trust.records.get(item.keyId)?.reviewerId;
    if (!reviewerId) throw new Error(`release reviewer identity for ${item.keyId} is missing`);
    const detached = readSignature(item.signaturePath);
    if (!verify(null, Buffer.from(canonical, 'utf8'), key, detached.bytes)) {
      throw new Error(`release signature verification failed for ${item.keyId}`);
    }
    return {
      keyId: item.keyId,
      reviewerId,
      signature: detached.signature,
    };
  });
  if (new Set(signatures.map(item => item.reviewerId)).size !== signatures.length) {
    throw new Error('runtime release quorum requires independent reviewers');
  }
  const ledger: AddressQlRuntimeReleaseLedger = {
    version: ADDRESSQL_RUNTIME_RELEASE_LEDGER_VERSION,
    payload,
    signatures: sortedSignatures(signatures),
    releaseDigest: calculateReleaseDigest(payload, signatures),
  };
  writeFileSync(
    resolve(input.outputPath),
    `${JSON.stringify(ledger, null, 2)}\n`,
    { encoding: 'utf8', flag: 'wx' },
  );
  return {
    status: 'ok' as const,
    version: ledger.version,
    releaseId: payload.releaseId,
    sequence: payload.sequence,
    releaseDigest: ledger.releaseDigest,
    verifiedSignatureCount: signatures.length,
    minimumSignatures: required,
    ledgerPath: resolve(input.outputPath),
    trustPolicyVersion: ADDRESSQL_TRUST_POLICY_VERSION,
    privacy: {
      containsPostalValues: false,
      containsRawAddress: false,
      containsRecipientData: false,
      containsPrivateKey: false,
    },
  };
}

function readState(path: string): AddressQlRuntimeReleaseState | null {
  if (!existsSync(resolve(path))) return null;
  const state = readJson<AddressQlRuntimeReleaseState>(
    path,
    MAX_STATE_BYTES,
    'runtime release state',
  );
  if (
    state.version !== ADDRESSQL_RUNTIME_RELEASE_STATE_VERSION
    || !Number.isSafeInteger(state.lastSequence)
    || state.lastSequence < 1
    || !SHA256.test(state.lastReleaseDigest)
    || !SHA256.test(state.lastConfigDigest)
  ) {
    throw new Error('runtime release state is invalid');
  }
  exactTimestamp(state.updatedAt, 'releaseState.updatedAt');
  return state;
}

function assertNoRollback(
  payload: AddressQlRuntimeReleasePayload,
  releaseDigest: string,
  state: AddressQlRuntimeReleaseState | null,
) {
  if (!state) {
    if (payload.sequence !== 1 || payload.previousReleaseDigest !== null) {
      throw new Error('runtime release state must be bootstrapped from sequence 1');
    }
    return;
  }
  if (payload.sequence < state.lastSequence) {
    throw new Error('runtime release rollback detected');
  }
  if (payload.sequence === state.lastSequence) {
    if (releaseDigest !== state.lastReleaseDigest) {
      throw new Error('runtime release sequence equivocation detected');
    }
    return;
  }
  if (payload.sequence !== state.lastSequence + 1) {
    throw new Error('runtime release sequence gap detected');
  }
  if (payload.previousReleaseDigest !== state.lastReleaseDigest) {
    throw new Error('runtime release chain digest mismatch');
  }
}

function writeState(
  path: string,
  state: AddressQlRuntimeReleaseState,
) {
  const absolutePath = resolve(path);
  const temporaryPath = `${absolutePath}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  });
  renameSync(temporaryPath, absolutePath);
}

export function verifyAddressQlRuntimeRelease(input: {
  configPath: string;
  ledgerPath: string;
  trustStorePath: string;
  statePath: string;
  now?: string;
  advanceState?: boolean;
}) {
  const ledger = readJson<AddressQlRuntimeReleaseLedger>(
    input.ledgerPath,
    MAX_LEDGER_BYTES,
    'runtime release ledger',
  );
  if (ledger.version !== ADDRESSQL_RUNTIME_RELEASE_LEDGER_VERSION) {
    throw new Error('runtime release ledger version is invalid');
  }
  validatePayload(ledger.payload);
  const now = exactTimestamp(
    input.now ?? new Date().toISOString(),
    'releaseVerification.now',
  );
  const validFrom = Date.parse(ledger.payload.validFrom);
  const validUntil = Date.parse(ledger.payload.validUntil);
  if (now < validFrom || now > validUntil) {
    throw new Error('runtime release is outside its validity window');
  }
  if (ledger.payload.configDigest !== configDigest(input.configPath)) {
    throw new Error('runtime release config digest mismatch');
  }
  const expectedReleaseDigest = calculateReleaseDigest(
    ledger.payload,
    ledger.signatures,
  );
  if (ledger.releaseDigest !== expectedReleaseDigest) {
    throw new Error('runtime release ledger digest mismatch');
  }
  const trust = loadAddressQlTrustPolicy(input.trustStorePath, {
    now: input.now,
    requireV2: true,
  });
  const required = Math.max(
    ledger.payload.minimumSignatures,
    trust.minimumSignatures,
  );
  if (new Set(ledger.signatures.map(item => item.keyId)).size !== ledger.signatures.length) {
    throw new Error('runtime release ledger has duplicate reviewer signatures');
  }
  if (
    new Set(ledger.signatures.map(item => item.reviewerId)).size
    !== ledger.signatures.length
  ) {
    throw new Error('runtime release quorum requires independent reviewers');
  }
  if (ledger.signatures.length < required) {
    throw new Error(`runtime release ledger requires at least ${required} signatures`);
  }
  const canonical = buildAddressQlRuntimeReleasePayload(ledger.payload);
  for (const item of ledger.signatures) {
    const key = trust.usableKeys.get(item.keyId);
    if (!key) throw new Error(`release reviewer key ${item.keyId} is not active`);
    if (
      !TECHNICAL_ID.test(item.reviewerId)
      || trust.records.get(item.keyId)?.reviewerId !== item.reviewerId
    ) {
      throw new Error(`release reviewer identity mismatch for ${item.keyId}`);
    }
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(item.signature)) {
      throw new Error('runtime release ledger signature is not base64');
    }
    const signature = Buffer.from(item.signature, 'base64');
    if (
      signature.length !== 64
      || !verify(null, Buffer.from(canonical, 'utf8'), key, signature)
    ) {
      throw new Error(`runtime release ledger signature failed for ${item.keyId}`);
    }
  }
  const state = readState(input.statePath);
  assertNoRollback(ledger.payload, ledger.releaseDigest, state);
  if (
    input.advanceState
    && (
      !state
      || state.lastReleaseDigest !== ledger.releaseDigest
    )
  ) {
    writeState(input.statePath, {
      version: ADDRESSQL_RUNTIME_RELEASE_STATE_VERSION,
      lastSequence: ledger.payload.sequence,
      lastReleaseDigest: ledger.releaseDigest,
      lastConfigDigest: ledger.payload.configDigest,
      updatedAt: input.now ?? new Date().toISOString(),
    });
  }
  return {
    status: 'ok' as const,
    version: ADDRESSQL_RUNTIME_RELEASE_LEDGER_VERSION,
    releaseId: ledger.payload.releaseId,
    sequence: ledger.payload.sequence,
    releaseDigest: ledger.releaseDigest,
    configDigest: ledger.payload.configDigest,
    verifiedSignatureCount: ledger.signatures.length,
    minimumSignatures: required,
    stateAdvanced: Boolean(
      input.advanceState
      && (!state || state.lastReleaseDigest !== ledger.releaseDigest),
    ),
    rollbackProtected: true,
    privacy: {
      containsPostalValues: false,
      containsRawAddress: false,
      containsRecipientData: false,
      containsPrivateKey: false,
    },
  };
}

export function loadAddressQlQuorumApprovedRuntimeConfig(input: {
  configPath: string;
  ledgerPath: string;
  trustStorePath: string;
  statePath: string;
  now?: string;
}): LoadedAddressQlRuntimeConfig {
  const release = verifyAddressQlRuntimeRelease({
    ...input,
    advanceState: false,
  });
  const loaded = loadAddressQlRuntimeConfig({
    configPath: input.configPath,
    trustStorePath: input.trustStorePath,
    ...(input.now ? { now: input.now } : {}),
  });
  verifyAddressQlRuntimeRelease({
    ...input,
    advanceState: true,
  });
  return {
    ...loaded,
    diagnostics: {
      ...loaded.diagnostics,
      releaseLedgerVerified: true,
      releaseSequence: release.sequence,
    },
  };
}
