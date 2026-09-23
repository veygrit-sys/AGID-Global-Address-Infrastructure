import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  TOPOGRAPHIC_3D_TILES_EXTERNAL_EVIDENCE_FILE,
  TOPOGRAPHIC_3D_TILES_INTERNAL_EVIDENCE_FILE,
  TOPOGRAPHIC_3D_TILES_VALIDATOR_REPORT_FILE,
  verifyTopographic3dTilesValidatorReportFiles,
} from './verify-topographic-3d-tiles-validator-report';

function sha256(data: string) {
  return `sha256:${createHash('sha256').update(data).digest('hex')}`;
}

function writeValidatorFixture(directory: string) {
  const tilesetPath = join(directory, 'tileset.json');
  const evidencePath = join(directory, TOPOGRAPHIC_3D_TILES_INTERNAL_EVIDENCE_FILE);
  const reportPath = join(directory, TOPOGRAPHIC_3D_TILES_VALIDATOR_REPORT_FILE);
  const outputPath = join(directory, TOPOGRAPHIC_3D_TILES_EXTERNAL_EVIDENCE_FILE);
  const tilesetData = `${JSON.stringify({ asset: { version: '1.1' } })}\n`;
  const evidenceData = `${JSON.stringify({
    files: [{
      role: 'tileset',
      fileName: 'tileset.json',
      sha256: sha256(tilesetData),
    }],
  })}\n`;
  const reportData = `${JSON.stringify({
    date: '2026-07-28T03:30:00.000Z',
    numErrors: 0,
    numWarnings: 0,
    numInfos: 0,
    issues: [],
  })}\n`;
  writeFileSync(tilesetPath, tilesetData);
  writeFileSync(evidencePath, evidenceData);
  writeFileSync(reportPath, reportData);
  return { tilesetPath, evidencePath, reportPath, outputPath };
}

test('external 3D Tiles validator attestation uses pinned canonical inputs and exclusive output', () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-3d-tiles-validator-'));
  try {
    const fixture = writeValidatorFixture(directory);
    const result = verifyTopographic3dTilesValidatorReportFiles(fixture);

    assert.equal(result.result.status, 'passed');
    assert.equal(result.report.fileName, TOPOGRAPHIC_3D_TILES_VALIDATOR_REPORT_FILE);
    assert.equal(existsSync(fixture.outputPath), true);
    assert.equal(
      JSON.parse(readFileSync(fixture.outputPath, 'utf8')).input.tilesetFileName,
      'tileset.json',
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('external 3D Tiles validator attestation rejects report name drift and output overwrite', () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-3d-tiles-validator-'));
  try {
    const fixture = writeValidatorFixture(directory);
    const driftedReportPath = join(directory, 'validator-report.json');
    writeFileSync(driftedReportPath, readFileSync(fixture.reportPath));
    assert.throws(
      () => verifyTopographic3dTilesValidatorReportFiles({
        ...fixture,
        reportPath: driftedReportPath,
      }),
      /canonical file name/,
    );

    writeFileSync(fixture.outputPath, '{}\n');
    assert.throws(
      () => verifyTopographic3dTilesValidatorReportFiles(fixture),
      /must not already exist/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
