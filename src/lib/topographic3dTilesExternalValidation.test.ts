import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTopographic3dTilesExternalValidation,
  parseTopographic3dTilesValidatorReport,
} from './topographic3dTilesExternalValidation';

const digest = `sha256:${'a'.repeat(64)}` as const;

test('external validator report produces a digest-bound passing attestation', () => {
  const reportData = JSON.stringify({
    date: '2026-07-27T12:30:00.000Z',
    numErrors: 0,
    numWarnings: 0,
    numInfos: 1,
    issues: [{
      type: 'EXAMPLE_INFO',
      severity: 'INFO',
      message: 'Synthetic report fixture.',
    }],
  });
  const attestation = createTopographic3dTilesExternalValidation({
    reportData,
    reportFileName: 'cesium-validator-0.6.1.json',
    reportSha256: digest,
    tilesetFileName: 'tileset.json',
    tilesetSha256: digest,
    internalEvidenceFileName: 'tileset.evidence.json',
    internalEvidenceSha256: digest,
  });

  assert.equal(attestation.validator.version, '0.6.1');
  assert.equal(attestation.validator.licenseId, 'Apache-2.0');
  assert.deepEqual(attestation.result, {
    status: 'passed',
    policy: 'zero-errors-and-zero-warnings',
    issueCodes: [],
  });
  assert.equal(attestation.report.numInfos, 1);
});

test('external validator warnings block the strict conformance gate', () => {
  const attestation = createTopographic3dTilesExternalValidation({
    reportData: JSON.stringify({
      date: '2026-07-27T12:30:00.000Z',
      numErrors: 0,
      numWarnings: 1,
      numInfos: 0,
      issues: [{
        type: 'EXAMPLE_WARNING',
        severity: 'WARNING',
        message: 'Synthetic report fixture.',
      }],
    }),
    reportFileName: 'report.json',
    reportSha256: digest,
    tilesetFileName: 'tileset.json',
    tilesetSha256: digest,
    internalEvidenceFileName: 'tileset.evidence.json',
    internalEvidenceSha256: digest,
  });

  assert.deepEqual(attestation.result, {
    status: 'blocked',
    policy: 'zero-errors-and-zero-warnings',
    issueCodes: ['validator-warnings-present'],
  });
});

test('external validator report rejects malformed and inconsistent counts', () => {
  assert.throws(
    () => parseTopographic3dTilesValidatorReport('{'),
    /must be valid JSON/,
  );
  assert.throws(
    () => parseTopographic3dTilesValidatorReport(JSON.stringify({
      date: '2026-07-27T12:30:00.000Z',
      numErrors: 1,
      numWarnings: 0,
      numInfos: 0,
    })),
    /issue counts do not match/,
  );
});
