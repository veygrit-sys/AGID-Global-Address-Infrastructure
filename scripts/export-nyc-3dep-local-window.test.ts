import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import test from 'node:test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createTopographicCogValidationReceipt } from '../src/lib/topographicCogValidation';

import {
  parseGeoTiffImageIndex,
  parseGeoTiffReadWindow,
  requireNyc3depLedgerBoundCogReceipt,
  readNyc3depCogValidationReceipt,
  readGeoTiffReadWindowArgument,
} from './export-nyc-3dep-local-window';

test('NYC 3DEP local-window CLI requires a bounded integer GeoTIFF window', () => {
  assert.deepEqual(parseGeoTiffReadWindow('12,34,128,256'), {
    x: 12,
    y: 34,
    width: 128,
    height: 256,
  });
  assert.throws(
    () => parseGeoTiffReadWindow('12,34,1,256'),
    /width and height at least 2/,
  );
  assert.throws(
    () => parseGeoTiffReadWindow('-1,34,128,256'),
    /four integers/,
  );
  assert.equal(
    readGeoTiffReadWindowArgument([
      'node',
      'script',
      '--window=12',
      '34',
      '128',
      '256',
    ]),
    '12,34,128,256',
  );
  assert.equal(parseGeoTiffImageIndex('1'), 1);
  assert.throws(
    () => parseGeoTiffImageIndex('-1'),
    /non-negative integer/,
  );
});

test('NYC 3DEP local-window CLI reads only a bounded hashable COG receipt', () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-nyc-3dep-cog-receipt-'));
  try {
    const receiptPath = join(directory, 'receipt.json');
    writeFileSync(receiptPath, `${JSON.stringify(createTopographicCogValidationReceipt({
      schemaVersion: 'agid-topographic-cog-validation-receipt-v0.1',
      validatedAt: '2026-07-27T18:00:00.000Z',
      validator: {
        command: 'gdal driver cog validate',
        gdalVersion: '3.13.0',
        fullCheck: 'yes',
      },
      input: {
        contentSha256: `sha256:${'a'.repeat(64)}`,
        byteLength: 1024,
      },
      rawReport: {
        fileName: 'gdal-cog-validator.txt',
        sha256: `sha256:${'b'.repeat(64)}`,
        byteLength: 64,
      },
      result: {
        status: 'passed',
        exitCode: 0,
        warningCount: 0,
        errorCount: 0,
      },
    }), null, 2)}\n`);

    const evidence = readNyc3depCogValidationReceipt(receiptPath);
    assert.match(evidence.receiptSha256, /^sha256:[a-f0-9]{64}$/);
    assert.equal(evidence.receipt.input.byteLength, 1024);
    assert.equal(evidence.receipt.validator.fullCheck, 'yes');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('NYC 3DEP local-window CLI requires the ledger to bind a supplied COG receipt', () => {
  const receiptSha256 = `sha256:${'c'.repeat(64)}` as const;
  assert.doesNotThrow(() => requireNyc3depLedgerBoundCogReceipt(
    [`sha256:${'d'.repeat(64)}`, receiptSha256],
    receiptSha256,
  ));
  assert.throws(
    () => requireNyc3depLedgerBoundCogReceipt(
      [`sha256:${'d'.repeat(64)}`],
      receiptSha256,
    ),
    /must be recorded in the source ledger/,
  );
});
