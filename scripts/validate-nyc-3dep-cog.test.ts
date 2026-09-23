import assert from 'node:assert/strict';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { writeArrayBuffer } from 'geotiff';

import {
  parseGdalVersion,
  runNyc3depCogValidation,
  type GdalCommandRunner,
} from './validate-nyc-3dep-cog';

function writeFixtureGeoTiff(path: string) {
  writeFileSync(path, new Uint8Array(writeArrayBuffer(new Float32Array([1, 2, 3, 4]), {
    width: 2,
    height: 2,
    ModelPixelScale: [0.01, 0.01, 0],
    ModelTiepoint: [0, 0, 0, -74, 40.72, 0],
    GTModelTypeGeoKey: 2,
    GeographicTypeGeoKey: 4269,
    GTRasterTypeGeoKey: 1,
    SampleFormat: [3],
    BitsPerSample: [32],
  })));
}

const passingRunner: GdalCommandRunner = (_executable, args) => {
  if (args[0] === '--version') {
    return { status: 0, stdout: 'GDAL 3.13.0 "future"\n', stderr: '' };
  }
  return { status: 0, stdout: 'COG validation passed\n', stderr: '' };
};

test('COG validation recipe binds local bytes and a strict GDAL report', () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-cog-validator-'));
  try {
    const assetPath = join(directory, 'fixture.tif');
    writeFixtureGeoTiff(assetPath);
    const result = runNyc3depCogValidation({
      assetPath,
      rawReportFileName: 'validator.txt',
      validatedAt: '2026-07-27T17:41:00.000Z',
      runner: passingRunner,
    });
    assert.equal(result.receipt.result.status, 'passed');
    assert.equal(result.receipt.validator.gdalVersion, '3.13.0');
    assert.match(result.receipt.input.contentSha256, /^sha256:[a-f0-9]{64}$/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('COG validation refuses an unavailable validator generation and warning output', () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-cog-validator-'));
  try {
    const assetPath = join(directory, 'fixture.tif');
    writeFixtureGeoTiff(assetPath);
    assert.throws(
      () => runNyc3depCogValidation({
        assetPath,
        rawReportFileName: 'validator.txt',
        validatedAt: '2026-07-27T17:41:00.000Z',
        runner: () => ({ status: 0, stdout: 'GDAL 3.12.1\n', stderr: '' }),
      }),
      /3.13.0 or newer/,
    );
    const warnedRunner: GdalCommandRunner = (_executable, args) => args[0] === '--version'
      ? { status: 0, stdout: 'GDAL 3.13.0\n', stderr: '' }
      : { status: 0, stdout: 'WARNING: layout needs review\n', stderr: '' };
    const result = runNyc3depCogValidation({
      assetPath,
      rawReportFileName: 'validator.txt',
      validatedAt: '2026-07-27T17:41:00.000Z',
      runner: warnedRunner,
    });
    assert.equal(result.receipt.result.status, 'blocked');
    assert.equal(result.receipt.result.warningCount, 1);
    assert.equal(parseGdalVersion('GDAL 3.13.0'), '3.13.0');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
