import assert from 'node:assert/strict';
import {
  generateKeyPairSync,
  sign,
  type KeyObject,
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

import {
  finalizeAddressQlRuntimeRelease,
  loadAddressQlQuorumApprovedRuntimeConfig,
  prepareAddressQlRuntimeRelease,
  verifyAddressQlRuntimeRelease,
} from './addressQlRuntimeReleaseLedger';
import {
  ADDRESSQL_RUNTIME_CONFIG_VERSION,
  buildAddressQlRuntimeAttestationPayload,
  digestAddressQlPostalCodes,
  type AddressQlRuntimeAdapterConfig,
} from './addressQlRuntimeConfig';
import {
  loadAddressQlTrustPolicy,
  registerAddressQlReviewerKey,
  revokeAddressQlReviewerKey,
} from './addressQlTrustPolicy';

const NOW = '2026-07-27T00:00:00Z';
const VALID_FROM = '2026-07-26T00:00:00Z';
const VALID_UNTIL = '2027-07-26T00:00:00Z';
const digest = (character: string) => `sha256:${character.repeat(64)}`;

function writePublicKey(path: string, key: KeyObject) {
  writeFileSync(path, key.export({
    type: 'spki',
    format: 'pem',
  }));
}

function fixture(context: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), 'addressql-release-'));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const reviewerA = generateKeyPairSync('ed25519');
  const reviewerB = generateKeyPairSync('ed25519');
  const reviewerC = generateKeyPairSync('ed25519');
  const keyAPath = join(directory, 'reviewer-a.public.pem');
  const keyBPath = join(directory, 'reviewer-b.public.pem');
  const keyCPath = join(directory, 'reviewer-c.public.pem');
  const trustStorePath = join(directory, 'trust-store-v2.json');
  const configPath = join(directory, 'runtime-config.approved.json');
  const dataPath = join(directory, 'postcodes.txt');
  const statePath = join(directory, 'release-state.json');
  writePublicKey(keyAPath, reviewerA.publicKey);
  writePublicKey(keyBPath, reviewerB.publicKey);
  writePublicKey(keyCPath, reviewerC.publicKey);

  for (const [keyId, reviewerId, publicKeyPath] of [
    ['reviewer-a', 'person-a', keyAPath],
    ['reviewer-b', 'person-b', keyBPath],
  ]) {
    registerAddressQlReviewerKey({
      trustStorePath,
      keyId,
      reviewerId,
      publicKeyPath,
      validFrom: VALID_FROM,
      validUntil: VALID_UNTIL,
      addedAt: VALID_FROM,
      minimumSignatures: 2,
    });
  }

  const postalCodes = ['000-0000', '999-9999'];
  writeFileSync(dataPath, `${postalCodes.join('\n')}\n`);
  const adapter: AddressQlRuntimeAdapterConfig = {
    id: 'jp-synthetic-approved',
    version: 'fixture-v1',
    mode: 'approved',
    countryCode: 'JP',
    purpose: 'existence',
    coverage: 'complete',
    dataFile: 'postcodes.txt',
    evidence: {
      sourceId: 'jp-synthetic-source',
      sourceVersion: 'fixture-v1',
      reuseRights: 'Synthetic test fixture',
      coverageStatement: 'Complete only for this synthetic fixture.',
      correctionUrl: 'https://example.invalid/addressql-corrections',
      retrievedAt: VALID_FROM,
      validUntil: VALID_UNTIL,
      datasetDigest: digestAddressQlPostalCodes(postalCodes),
      holdoutDigest: digest('a'),
      reportDigest: digest('b'),
      attestationKeyId: 'reviewer-a',
      attestationSignature: 'pending',
    },
  };
  adapter.evidence.attestationSignature = sign(
    null,
    Buffer.from(buildAddressQlRuntimeAttestationPayload(adapter), 'utf8'),
    reviewerA.privateKey,
  ).toString('base64');
  writeFileSync(configPath, `${JSON.stringify({
    version: ADDRESSQL_RUNTIME_CONFIG_VERSION,
    adapters: [adapter],
  }, null, 2)}\n`);

  return {
    directory,
    configPath,
    trustStorePath,
    statePath,
    keyCPath,
    reviewerA,
    reviewerB,
    reviewerC,
  };
}

function release(
  files: ReturnType<typeof fixture>,
  input: {
    sequence: number;
    previousReleaseDigest: string | null;
    releaseId: string;
  },
) {
  const payloadPath = join(files.directory, `${input.releaseId}.payload.json`);
  const signatureAPath = join(files.directory, `${input.releaseId}.a.sig`);
  const signatureBPath = join(files.directory, `${input.releaseId}.b.sig`);
  const ledgerPath = join(files.directory, `${input.releaseId}.ledger.json`);
  prepareAddressQlRuntimeRelease({
    configPath: files.configPath,
    releaseId: input.releaseId,
    sequence: input.sequence,
    previousReleaseDigest: input.previousReleaseDigest,
    createdAt: VALID_FROM,
    validFrom: VALID_FROM,
    validUntil: VALID_UNTIL,
    minimumSignatures: 2,
    outputPath: payloadPath,
  });
  const payload = readFileSync(payloadPath);
  writeFileSync(
    signatureAPath,
    sign(null, payload, files.reviewerA.privateKey).toString('base64'),
  );
  writeFileSync(
    signatureBPath,
    sign(null, payload, files.reviewerB.privateKey).toString('base64'),
  );
  const finalized = finalizeAddressQlRuntimeRelease({
    configPath: files.configPath,
    payloadPath,
    trustStorePath: files.trustStorePath,
    signatures: [
      { keyId: 'reviewer-a', signaturePath: signatureAPath },
      { keyId: 'reviewer-b', signaturePath: signatureBPath },
    ],
    outputPath: ledgerPath,
    now: NOW,
  });
  return {
    payloadPath,
    signatureAPath,
    signatureBPath,
    ledgerPath,
    ...finalized,
  };
}

test('two independent reviewers activate a quorum-approved release', context => {
  const files = fixture(context);
  const first = release(files, {
    sequence: 1,
    previousReleaseDigest: null,
    releaseId: 'jp-release-1',
  });
  const loaded = loadAddressQlQuorumApprovedRuntimeConfig({
    configPath: files.configPath,
    ledgerPath: first.ledgerPath,
    trustStorePath: files.trustStorePath,
    statePath: files.statePath,
    now: NOW,
  });
  const repeated = verifyAddressQlRuntimeRelease({
    configPath: files.configPath,
    ledgerPath: first.ledgerPath,
    trustStorePath: files.trustStorePath,
    statePath: files.statePath,
    now: NOW,
    advanceState: true,
  });

  assert.equal(first.verifiedSignatureCount, 2);
  assert.equal(loaded.diagnostics.approvedAdapterCount, 1);
  assert.equal(repeated.stateAdvanced, false);
  assert.doesNotMatch(JSON.stringify(first), /000-0000|999-9999|PRIVATE KEY/);
});

test('quorum rejects one signature and revoked reviewers', context => {
  const files = fixture(context);
  const payloadPath = join(files.directory, 'single.payload.json');
  const signaturePath = join(files.directory, 'single.sig');
  const ledgerPath = join(files.directory, 'single.ledger.json');
  prepareAddressQlRuntimeRelease({
    configPath: files.configPath,
    releaseId: 'single-release',
    sequence: 1,
    previousReleaseDigest: null,
    createdAt: VALID_FROM,
    validFrom: VALID_FROM,
    validUntil: VALID_UNTIL,
    outputPath: payloadPath,
  });
  writeFileSync(
    signaturePath,
    sign(null, readFileSync(payloadPath), files.reviewerA.privateKey).toString('base64'),
  );
  assert.throws(
    () => finalizeAddressQlRuntimeRelease({
      configPath: files.configPath,
      payloadPath,
      trustStorePath: files.trustStorePath,
      signatures: [{ keyId: 'reviewer-a', signaturePath }],
      outputPath: ledgerPath,
      now: NOW,
    }),
    /at least 2 signatures/,
  );

  const valid = release(files, {
    sequence: 1,
    previousReleaseDigest: null,
    releaseId: 'before-revocation',
  });
  revokeAddressQlReviewerKey({
    trustStorePath: files.trustStorePath,
    keyId: 'reviewer-b',
    revokedAt: NOW,
    reason: 'Synthetic compromise exercise',
  });
  assert.throws(
    () => verifyAddressQlRuntimeRelease({
      configPath: files.configPath,
      ledgerPath: valid.ledgerPath,
      trustStorePath: files.trustStorePath,
      statePath: files.statePath,
      now: NOW,
    }),
    /reviewer-b is not active/,
  );
});

test('quorum counts independent reviewer identities rather than key count', context => {
  const files = fixture(context);
  registerAddressQlReviewerKey({
    trustStorePath: files.trustStorePath,
    keyId: 'reviewer-a-secondary',
    reviewerId: 'person-a',
    publicKeyPath: files.keyCPath,
    validFrom: VALID_FROM,
    validUntil: VALID_UNTIL,
    addedAt: VALID_FROM,
  });
  const payloadPath = join(files.directory, 'same-reviewer.payload.json');
  const signatureAPath = join(files.directory, 'same-reviewer.a.sig');
  const signatureCPath = join(files.directory, 'same-reviewer.c.sig');
  prepareAddressQlRuntimeRelease({
    configPath: files.configPath,
    releaseId: 'same-reviewer-release',
    sequence: 1,
    previousReleaseDigest: null,
    createdAt: VALID_FROM,
    validFrom: VALID_FROM,
    validUntil: VALID_UNTIL,
    outputPath: payloadPath,
  });
  const payload = readFileSync(payloadPath);
  writeFileSync(
    signatureAPath,
    sign(null, payload, files.reviewerA.privateKey).toString('base64'),
  );
  writeFileSync(
    signatureCPath,
    sign(null, payload, files.reviewerC.privateKey).toString('base64'),
  );

  assert.throws(
    () => finalizeAddressQlRuntimeRelease({
      configPath: files.configPath,
      payloadPath,
      trustStorePath: files.trustStorePath,
      signatures: [
        { keyId: 'reviewer-a', signaturePath: signatureAPath },
        { keyId: 'reviewer-a-secondary', signaturePath: signatureCPath },
      ],
      outputPath: join(files.directory, 'same-reviewer.ledger.json'),
      now: NOW,
    }),
    /independent reviewers/,
  );
});

test('reviewer rotation disables the replaced key and honors expiry', context => {
  const files = fixture(context);
  registerAddressQlReviewerKey({
    trustStorePath: files.trustStorePath,
    keyId: 'reviewer-c',
    reviewerId: 'person-a',
    publicKeyPath: files.keyCPath,
    validFrom: NOW,
    validUntil: VALID_UNTIL,
    addedAt: NOW,
    replacesKeyId: 'reviewer-a',
  });
  const current = loadAddressQlTrustPolicy(files.trustStorePath, { now: NOW });
  const expired = loadAddressQlTrustPolicy(files.trustStorePath, {
    now: '2028-01-01T00:00:00Z',
  });

  assert.equal(current.records.get('reviewer-a')?.status, 'rotated');
  assert.equal(current.usableKeys.has('reviewer-a'), false);
  assert.equal(current.usableKeys.has('reviewer-c'), true);
  assert.equal(expired.usableKeys.size, 0);
});

test('release chain blocks rollback, gaps, and equivocation', context => {
  const files = fixture(context);
  const first = release(files, {
    sequence: 1,
    previousReleaseDigest: null,
    releaseId: 'jp-release-1',
  });
  verifyAddressQlRuntimeRelease({
    configPath: files.configPath,
    ledgerPath: first.ledgerPath,
    trustStorePath: files.trustStorePath,
    statePath: files.statePath,
    now: NOW,
    advanceState: true,
  });
  const second = release(files, {
    sequence: 2,
    previousReleaseDigest: first.releaseDigest,
    releaseId: 'jp-release-2',
  });
  verifyAddressQlRuntimeRelease({
    configPath: files.configPath,
    ledgerPath: second.ledgerPath,
    trustStorePath: files.trustStorePath,
    statePath: files.statePath,
    now: NOW,
    advanceState: true,
  });

  assert.throws(
    () => verifyAddressQlRuntimeRelease({
      configPath: files.configPath,
      ledgerPath: first.ledgerPath,
      trustStorePath: files.trustStorePath,
      statePath: files.statePath,
      now: NOW,
    }),
    /rollback detected/,
  );
});

test('config and ledger tampering are detected', context => {
  const files = fixture(context);
  const first = release(files, {
    sequence: 1,
    previousReleaseDigest: null,
    releaseId: 'tamper-release',
  });
  const originalConfig = readFileSync(files.configPath, 'utf8');
  writeFileSync(files.configPath, `${originalConfig}\n`);
  assert.throws(
    () => verifyAddressQlRuntimeRelease({
      configPath: files.configPath,
      ledgerPath: first.ledgerPath,
      trustStorePath: files.trustStorePath,
      statePath: files.statePath,
      now: NOW,
    }),
    /config digest mismatch/,
  );
  writeFileSync(files.configPath, originalConfig);

  const ledger = JSON.parse(readFileSync(first.ledgerPath, 'utf8')) as {
    releaseDigest: string;
  };
  ledger.releaseDigest = digest('f');
  writeFileSync(first.ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
  assert.throws(
    () => verifyAddressQlRuntimeRelease({
      configPath: files.configPath,
      ledgerPath: first.ledgerPath,
      trustStorePath: files.trustStorePath,
      statePath: files.statePath,
      now: NOW,
    }),
    /ledger digest mismatch/,
  );
});
