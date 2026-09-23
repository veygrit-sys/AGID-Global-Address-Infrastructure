import { createHash, createPublicKey } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ADDRESSQL_TRUST_STORE_VERSION } from '../src/lib/addressQlRuntimeConfig';

type Arguments = {
  trustStorePath: string;
  keyId: string;
  publicKeyPath: string;
};

const KEY_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/;

function parseArguments(values: readonly string[]): Arguments {
  const output: Partial<Arguments> = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    const next = values[index + 1];
    if (!['--trust-store', '--key-id', '--public-key'].includes(value)) {
      throw new Error(`unsupported argument: ${value}`);
    }
    if (!next) throw new Error(`${value} requires a value`);
    if (value === '--trust-store') output.trustStorePath = next;
    if (value === '--key-id') output.keyId = next;
    if (value === '--public-key') output.publicKeyPath = next;
    index += 1;
  }
  if (!output.trustStorePath || !output.keyId || !output.publicKeyPath) {
    throw new Error('--trust-store, --key-id, and --public-key are required');
  }
  if (!KEY_ID.test(output.keyId)) throw new Error('key id is invalid');
  return output as Arguments;
}

function parseTrustStore(path: string) {
  if (!existsSync(path)) {
    return {
      version: ADDRESSQL_TRUST_STORE_VERSION,
      keys: {} as Record<string, string>,
    };
  }
  const value = JSON.parse(readFileSync(path, 'utf8')) as {
    version?: unknown;
    keys?: unknown;
  };
  if (value.version !== ADDRESSQL_TRUST_STORE_VERSION) {
    throw new Error(`trust store version must be ${ADDRESSQL_TRUST_STORE_VERSION}`);
  }
  if (!value.keys || typeof value.keys !== 'object' || Array.isArray(value.keys)) {
    throw new Error('trust store keys must be an object');
  }
  return value as {
    version: typeof ADDRESSQL_TRUST_STORE_VERSION;
    keys: Record<string, string>;
  };
}

export function registerAddressQlTrustedPublicKey(args: Arguments) {
  const trustStorePath = resolve(args.trustStorePath);
  const publicKeyText = readFileSync(resolve(args.publicKeyPath), 'utf8');
  if (/PRIVATE KEY/.test(publicKeyText)) {
    throw new Error('private keys are not accepted');
  }
  const publicKey = createPublicKey(publicKeyText);
  if (publicKey.asymmetricKeyType !== 'ed25519') {
    throw new Error('trusted public key must be Ed25519');
  }
  const canonicalPem = publicKey.export({
    type: 'spki',
    format: 'pem',
  }).toString();
  const trustStore = parseTrustStore(trustStorePath);
  const existing = trustStore.keys[args.keyId];
  if (existing && existing !== canonicalPem) {
    throw new Error(`trusted key id ${args.keyId} is already bound to another key`);
  }
  trustStore.keys[args.keyId] = canonicalPem;
  writeFileSync(trustStorePath, `${JSON.stringify(trustStore, null, 2)}\n`, 'utf8');
  const fingerprint = createHash('sha256')
    .update(publicKey.export({ type: 'spki', format: 'der' }))
    .digest('hex');
  return {
    status: 'ok' as const,
    version: 'addressql-trusted-public-key-registration-v1',
    trustStorePath,
    keyId: args.keyId,
    algorithm: 'Ed25519',
    fingerprint: `sha256:${fingerprint}`,
    trustedPublicKeyCount: Object.keys(trustStore.keys).length,
    containsPrivateKey: false,
  };
}

function run() {
  console.log(JSON.stringify(
    registerAddressQlTrustedPublicKey(parseArguments(process.argv.slice(2))),
    null,
    2,
  ));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  run();
}
