import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { registerAddressQlTrustedPublicKey } from './register-addressql-trusted-public-key';

test('trusted-key registration persists only an Ed25519 public key', context => {
  const directory = mkdtempSync(join(tmpdir(), 'addressql-trust-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const { publicKey } = generateKeyPairSync('ed25519');
  const publicKeyPath = join(directory, 'reviewer-public.pem');
  const trustStorePath = join(directory, 'trust-store.json');
  writeFileSync(publicKeyPath, publicKey.export({
    type: 'spki',
    format: 'pem',
  }));

  const output = registerAddressQlTrustedPublicKey({
    trustStorePath,
    keyId: 'independent-reviewer-2026',
    publicKeyPath,
  });
  const persisted = readFileSync(trustStorePath, 'utf8');

  assert.equal(output.algorithm, 'Ed25519');
  assert.equal(output.trustedPublicKeyCount, 1);
  assert.match(persisted, /BEGIN PUBLIC KEY/);
  assert.doesNotMatch(persisted, /PRIVATE KEY/);
});

test('trusted-key registration rejects private key material', context => {
  const directory = mkdtempSync(join(tmpdir(), 'addressql-trust-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const { privateKey } = generateKeyPairSync('ed25519');
  const privateKeyPath = join(directory, 'reviewer-private.pem');
  writeFileSync(privateKeyPath, privateKey.export({
    type: 'pkcs8',
    format: 'pem',
  }));

  assert.throws(
    () => registerAddressQlTrustedPublicKey({
      trustStorePath: join(directory, 'trust-store.json'),
      keyId: 'bad-reviewer',
      publicKeyPath: privateKeyPath,
    }),
    /private keys are not accepted/,
  );
});
