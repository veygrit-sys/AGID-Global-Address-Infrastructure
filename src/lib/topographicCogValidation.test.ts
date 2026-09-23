import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TOPOGRAPHIC_COG_VALIDATION_RECEIPT_SCHEMA,
  bindPassedTopographicCogValidationEvidence,
  createTopographicCogValidationReceipt,
  parseTopographicCogValidationReceipt,
  requirePassedTopographicCogValidation,
} from './topographicCogValidation';
import type { TopographicCogValidationReceipt } from './topographicCogValidation';

const contentSha256 = `sha256:${'a'.repeat(64)}` as const;
const reportSha256 = `sha256:${'b'.repeat(64)}` as const;

function receipt(
  overrides: Record<string, unknown> = {},
): TopographicCogValidationReceipt {
  return {
    schemaVersion: TOPOGRAPHIC_COG_VALIDATION_RECEIPT_SCHEMA,
    validatedAt: '2026-07-27T17:41:00.000Z',
    validator: {
      command: 'gdal driver cog validate',
      gdalVersion: '3.13.0',
      fullCheck: 'yes',
    },
    input: { contentSha256, byteLength: 1024 },
    rawReport: {
      fileName: 'gdal-cog-validator.txt',
      sha256: reportSha256,
      byteLength: 64,
    },
    result: {
      status: 'passed',
      exitCode: 0,
      warningCount: 0,
      errorCount: 0,
    },
    ...overrides,
  } as TopographicCogValidationReceipt;
}

test('strict GDAL COG receipt binds a no-warning successful validator run', () => {
  const validated = createTopographicCogValidationReceipt(receipt());
  assert.equal(validated.result.status, 'passed');
  assert.equal(
    requirePassedTopographicCogValidation(validated, contentSha256).rawReport.sha256,
    reportSha256,
  );
});

test('COG receipts reject stale GDAL, warnings, and digest mismatch', () => {
  assert.throws(
    () => parseTopographicCogValidationReceipt(JSON.stringify(receipt({
      validator: {
        command: 'gdal driver cog validate',
        gdalVersion: '3.12.1',
        fullCheck: 'yes',
      },
    }))),
    /requires GDAL 3.13.0 or newer/,
  );
  assert.throws(
    () => parseTopographicCogValidationReceipt(JSON.stringify(receipt({
      result: {
        status: 'passed',
        exitCode: 0,
        warningCount: 1,
        errorCount: 0,
      },
    }))),
    /status does not match/,
  );
  const validated = createTopographicCogValidationReceipt(receipt());
  assert.throws(
    () => requirePassedTopographicCogValidation(
      validated,
      `sha256:${'c'.repeat(64)}`,
    ),
    /not bound to the expected GeoTIFF digest/,
  );
});

test('COG evidence carries only digest-bound validator provenance', () => {
  const evidence = bindPassedTopographicCogValidationEvidence({
    receipt: createTopographicCogValidationReceipt(receipt()),
    receiptSha256: `sha256:${'c'.repeat(64)}`,
    expectedContentSha256: contentSha256,
    expectedByteLength: 1024,
  });
  assert.deepEqual(evidence, {
    receiptSha256: `sha256:${'c'.repeat(64)}`,
    validatedAt: '2026-07-27T17:41:00.000Z',
    gdalVersion: '3.13.0',
    fullCheck: 'yes',
    rawReportSha256: reportSha256,
    rawReportByteLength: 64,
  });
  assert.throws(
    () => bindPassedTopographicCogValidationEvidence({
      receipt: createTopographicCogValidationReceipt(receipt()),
      receiptSha256: `sha256:${'c'.repeat(64)}`,
      expectedContentSha256: contentSha256,
      expectedByteLength: 1025,
    }),
    /not bound to the expected GeoTIFF byte length/,
  );
});
