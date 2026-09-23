import assert from 'node:assert/strict';
import {
  generateKeyPairSync,
  sign,
} from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { type TestContext } from 'node:test';

import {
  finalizeAddressQlRuntimeAttestation,
  prepareAddressQlRuntimeAttestation,
} from './addressQlRuntimeAttestationWorkflow';
import {
  ADDRESSQL_RUNTIME_CONFIG_VERSION,
  ADDRESSQL_TRUST_STORE_VERSION,
  digestAddressQlPostalCodes,
  loadAddressQlRuntimeConfig,
} from './addressQlRuntimeConfig';

const digest = (character: string) => `sha256:${character.repeat(64)}`;

function fixture(context: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), 'addressql-attestation-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const postalCodes = ['000-0000', '999-9999'];
  const configPath = join(directory, 'runtime-config.json');
  const dataPath = join(directory, 'synthetic-postcodes.txt');
  const trustStorePath = join(directory, 'trust-store.json');
  const payloadPath = join(directory, 'attestation-payload.json');
  const signaturePath = join(directory, 'attestation-signature.base64');
  const approvedConfigPath = join(directory, 'runtime-config.approved.json');
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');

  writeFileSync(dataPath, `${postalCodes.join('\n')}\n`);
  writeFileSync(configPath, `${JSON.stringify({
    version: ADDRESSQL_RUNTIME_CONFIG_VERSION,
    adapters: [{
      id: 'jp-synthetic-conformance',
      version: 'fixture-v1',
      mode: 'conformance',
      countryCode: 'JP',
      purpose: 'existence',
      coverage: 'complete',
      dataFile: 'synthetic-postcodes.txt',
      evidence: {
        sourceId: 'jp-synthetic-source',
        sourceVersion: 'fixture-v1',
        reuseRights: 'Synthetic test fixture',
        coverageStatement: 'Complete only for this synthetic fixture.',
        correctionUrl: 'https://example.invalid/addressql-corrections',
        retrievedAt: '2026-07-01T00:00:00Z',
        validUntil: '2027-07-01T00:00:00Z',
        datasetDigest: digestAddressQlPostalCodes(postalCodes),
        holdoutDigest: digest('a'),
        reportDigest: digest('b'),
        attestationKeyId: 'pending-independent-reviewer',
        attestationSignature: 'unsigned-conformance',
      },
    }],
  }, null, 2)}\n`);
  writeFileSync(trustStorePath, `${JSON.stringify({
    version: ADDRESSQL_TRUST_STORE_VERSION,
    keys: {
      'independent-reviewer-2026': publicKey.export({
        type: 'spki',
        format: 'pem',
      }),
    },
  }, null, 2)}\n`);

  return {
    directory,
    configPath,
    dataPath,
    trustStorePath,
    payloadPath,
    signaturePath,
    approvedConfigPath,
    privateKey,
  };
}

test('offline payload and detached signature activate an approved adapter', context => {
  const files = fixture(context);
  const prepared = prepareAddressQlRuntimeAttestation({
    configPath: files.configPath,
    adapterId: 'jp-synthetic-conformance',
    keyId: 'independent-reviewer-2026',
    outputPath: files.payloadPath,
    now: '2026-07-26T00:00:00Z',
  });
  const payload = readFileSync(files.payloadPath);
  writeFileSync(
    files.signaturePath,
    sign(null, payload, files.privateKey).toString('base64'),
  );

  const finalized = finalizeAddressQlRuntimeAttestation({
    configPath: files.configPath,
    adapterId: 'jp-synthetic-conformance',
    keyId: 'independent-reviewer-2026',
    signaturePath: files.signaturePath,
    trustStorePath: files.trustStorePath,
    outputPath: files.approvedConfigPath,
    now: '2026-07-26T00:00:00Z',
  });
  const loaded = loadAddressQlRuntimeConfig({
    configPath: files.approvedConfigPath,
    trustStorePath: files.trustStorePath,
    now: '2026-07-26T00:00:00Z',
  });

  assert.equal(prepared.privacy.containsPrivateKey, false);
  assert.equal(finalized.approvedAdapterCount, 1);
  assert.equal(loaded.diagnostics.approvedAdapterCount, 1);
  assert.doesNotMatch(readFileSync(files.approvedConfigPath, 'utf8'), /PRIVATE KEY/);
  assert.doesNotMatch(JSON.stringify(finalized), /000-0000|999-9999/);
});

test('invalid detached signature cannot create an approved config', context => {
  const files = fixture(context);
  prepareAddressQlRuntimeAttestation({
    configPath: files.configPath,
    adapterId: 'jp-synthetic-conformance',
    keyId: 'independent-reviewer-2026',
    outputPath: files.payloadPath,
    now: '2026-07-26T00:00:00Z',
  });
  writeFileSync(files.signaturePath, Buffer.alloc(64, 7).toString('base64'));

  assert.throws(
    () => finalizeAddressQlRuntimeAttestation({
      configPath: files.configPath,
      adapterId: 'jp-synthetic-conformance',
      keyId: 'independent-reviewer-2026',
      signaturePath: files.signaturePath,
      trustStorePath: files.trustStorePath,
      outputPath: files.approvedConfigPath,
      now: '2026-07-26T00:00:00Z',
    }),
    /signature verification failed/,
  );
  assert.equal(existsSync(files.approvedConfigPath), false);
});

test('dataset changes after payload preparation fail closed', context => {
  const files = fixture(context);
  prepareAddressQlRuntimeAttestation({
    configPath: files.configPath,
    adapterId: 'jp-synthetic-conformance',
    keyId: 'independent-reviewer-2026',
    outputPath: files.payloadPath,
    now: '2026-07-26T00:00:00Z',
  });
  writeFileSync(
    files.signaturePath,
    sign(null, readFileSync(files.payloadPath), files.privateKey).toString('base64'),
  );
  writeFileSync(files.dataPath, '111-1111\n');

  assert.throws(
    () => finalizeAddressQlRuntimeAttestation({
      configPath: files.configPath,
      adapterId: 'jp-synthetic-conformance',
      keyId: 'independent-reviewer-2026',
      signaturePath: files.signaturePath,
      trustStorePath: files.trustStorePath,
      outputPath: files.approvedConfigPath,
      now: '2026-07-26T00:00:00Z',
    }),
    /dataset digest mismatch/,
  );
  assert.equal(existsSync(files.approvedConfigPath), false);
});
