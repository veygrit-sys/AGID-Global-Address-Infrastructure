import assert from 'node:assert/strict';
import {
  generateKeyPairSync,
  sign,
} from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { type TestContext } from 'node:test';

import { createAddressQlPracticalApi } from './addressQlPracticalApi';
import {
  ADDRESSQL_RUNTIME_CONFIG_VERSION,
  ADDRESSQL_TRUST_STORE_VERSION,
  buildAddressQlRuntimeAttestationPayload,
  digestAddressQlPostalCodes,
  loadAddressQlRuntimeConfig,
  type AddressQlRuntimeAdapterConfig,
} from './addressQlRuntimeConfig';

const digest = (character: string) => `sha256:${character.repeat(64)}`;

function fixture(context: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), 'addressql-runtime-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const dataFile = 'synthetic-postcodes.txt';
  const postalCodes = ['000-0000', '999-9999'];
  writeFileSync(join(directory, dataFile), `${postalCodes.join('\n')}\n`);

  const adapter: AddressQlRuntimeAdapterConfig = {
    id: 'jp-synthetic-approved',
    version: 'fixture-v1',
    mode: 'approved',
    countryCode: 'JP',
    purpose: 'existence',
    coverage: 'complete',
    dataFile,
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
      attestationKeyId: 'fixture-reviewer',
      attestationSignature: 'pending',
    },
  };
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  adapter.evidence.attestationSignature = sign(
    null,
    Buffer.from(buildAddressQlRuntimeAttestationPayload(adapter), 'utf8'),
    privateKey,
  ).toString('base64');

  const configPath = join(directory, 'runtime-config.json');
  const trustStorePath = join(directory, 'trust-store.json');
  writeFileSync(configPath, JSON.stringify({
    version: ADDRESSQL_RUNTIME_CONFIG_VERSION,
    adapters: [adapter],
  }, null, 2));
  writeFileSync(trustStorePath, JSON.stringify({
    version: ADDRESSQL_TRUST_STORE_VERSION,
    keys: {
      'fixture-reviewer': publicKey.export({
        type: 'spki',
        format: 'pem',
      }),
    },
  }, null, 2));

  return {
    directory,
    dataFile,
    configPath,
    trustStorePath,
  };
}

test('signed runtime config loads a usable local postal-existence adapter', context => {
  const files = fixture(context);
  const loaded = loadAddressQlRuntimeConfig({
    configPath: files.configPath,
    trustStorePath: files.trustStorePath,
    now: '2026-07-26T00:00:00Z',
  });
  const api = createAddressQlPracticalApi(process.cwd(), {
    runtimeAdapters: loaded.runtimeAdapters,
    ...loaded.registryOptions,
  });
  const output = api.handle({
    method: 'POST',
    path: '/v1/postal/validate',
    body: {
      countryCode: 'JP',
      postalCode: '０００－００００',
      purpose: 'existence',
    },
  });
  const validation = output.body.validation as Record<string, unknown>;

  assert.equal(loaded.diagnostics.approvedAdapterCount, 1);
  assert.equal(validation.status, 'pass');
  assert.equal(validation.evidence_level, 'independently_attested');
  assert.doesNotMatch(JSON.stringify(output.body), /000-0000|０００－００００/);
});

test('runtime config rejects data changed after attestation', context => {
  const files = fixture(context);
  writeFileSync(join(files.directory, files.dataFile), '111-1111\n');

  assert.throws(
    () => loadAddressQlRuntimeConfig({
      configPath: files.configPath,
      trustStorePath: files.trustStorePath,
      now: '2026-07-26T00:00:00Z',
    }),
    /dataset digest mismatch/,
  );
});

test('runtime config rejects non-postcode rows before adapter activation', context => {
  const files = fixture(context);
  writeFileSync(
    join(files.directory, files.dataFile),
    'synthetic street, recipient\n',
  );

  assert.throws(
    () => loadAddressQlRuntimeConfig({
      configPath: files.configPath,
      trustStorePath: files.trustStorePath,
      now: '2026-07-26T00:00:00Z',
    }),
    /non-postcode value/,
  );
});

test('conformance runtime config requires explicit opt-in and stays non-live', context => {
  const files = fixture(context);
  const config = JSON.parse(
    readFileSync(files.configPath, 'utf8'),
  ) as { adapters: AddressQlRuntimeAdapterConfig[]; version: string };
  config.adapters[0].mode = 'conformance';
  config.adapters[0].evidence.attestationSignature = 'synthetic-signature';
  writeFileSync(files.configPath, JSON.stringify(config, null, 2));

  assert.throws(
    () => loadAddressQlRuntimeConfig({
      configPath: files.configPath,
      now: '2026-07-26T00:00:00Z',
    }),
    /requires explicit opt-in/,
  );
  const loaded = loadAddressQlRuntimeConfig({
    configPath: files.configPath,
    allowConformanceAdapters: true,
    now: '2026-07-26T00:00:00Z',
  });
  assert.equal(loaded.diagnostics.conformanceAdapterCount, 1);
  assert.equal(loaded.registryOptions.allowConformanceAdapters, true);
});

test('empty trust store keeps approved runtime data fail-closed', context => {
  const files = fixture(context);
  writeFileSync(files.trustStorePath, JSON.stringify({
    version: ADDRESSQL_TRUST_STORE_VERSION,
    keys: {},
  }, null, 2));

  assert.throws(
    () => loadAddressQlRuntimeConfig({
      configPath: files.configPath,
      trustStorePath: files.trustStorePath,
      now: '2026-07-26T00:00:00Z',
    }),
    /has no trusted attestation key/,
  );
});
