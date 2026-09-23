import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';

import {
  createNyc3depParent3dTilesExternalValidation,
  NYC_3DEP_PARENT_3D_TILES_EXTERNAL_VALIDATION_SCHEMA,
  NYC_3DEP_PARENT_3D_TILES_VALIDATOR_REPORT_FILE,
} from './topographicNyc3depParent3dTilesExternalValidation';
import {
  NYC_3DEP_PARENT_3D_TILES_EVIDENCE_SCHEMA,
  NYC_3DEP_PARENT_3D_TILES_METHOD,
  type Nyc3depParent3dTilesBundle,
} from './topographicNyc3depParent3dTiles';

function sha256(value: string) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}` as const;
}

function parentFixture(): Nyc3depParent3dTilesBundle {
  const region: [number, number, number, number, number, number] = [0, 0, 1, 1, 0, 1];
  const tileset = {
    asset: {
      version: '1.1' as const,
      tilesetVersion: sha256('batch-receipt'),
    },
    geometricError: 2,
    root: {
      boundingVolume: { region },
      geometricError: 2,
      refine: 'REPLACE' as const,
      children: [{
        boundingVolume: { region },
        geometricError: 1,
        content: { uri: 'children/r0000-c0000/tileset.json' },
      }],
    },
  };
  const tilesetData = `${JSON.stringify(tileset, null, 2)}\n`;
  const manifest: Nyc3depParent3dTilesBundle['evidence']['manifest'] = {
    schemaVersion: NYC_3DEP_PARENT_3D_TILES_EVIDENCE_SCHEMA,
    method: NYC_3DEP_PARENT_3D_TILES_METHOD,
    generatedAt: '2026-07-28T04:00:00.000Z',
    batchReceiptSha256: sha256('batch-receipt'),
    root: {
      boundingRegion: region,
      geometricErrorMeters: 2,
      refine: 'REPLACE',
    },
    children: [{
      tileId: 'r0000-c0000',
      uri: 'children/r0000-c0000/tileset.json',
      boundingRegion: region,
      geometricErrorMeters: 1,
      tilesetSha256: sha256('child-tileset'),
      evidenceSha256: sha256('child-evidence'),
    }],
    privacy: {
      containsRawElevation: false,
      containsAddressData: false,
    },
    nonClaims: [],
  };
  const evidenceData = `${JSON.stringify(manifest, null, 2)}\n`;
  return {
    tileset: {
      fileName: 'tileset.json',
      mediaType: 'application/json',
      data: tilesetData,
      byteLength: new TextEncoder().encode(tilesetData).byteLength,
      sha256: sha256(tilesetData),
      tileset,
    },
    evidence: {
      fileName: 'tileset.evidence.json',
      mediaType: 'application/json',
      data: evidenceData,
      byteLength: new TextEncoder().encode(evidenceData).byteLength,
      sha256: sha256(evidenceData),
      manifest,
    },
  };
}

test('NYC parent validator attestation binds canonical parent files and child hashes', () => {
  const reportData = JSON.stringify({
    date: '2026-07-28T04:10:00.000Z',
    numErrors: 0,
    numWarnings: 0,
    numInfos: 0,
    issues: [],
  });
  const attestation = createNyc3depParent3dTilesExternalValidation({
    reportData,
    reportFileName: NYC_3DEP_PARENT_3D_TILES_VALIDATOR_REPORT_FILE,
    reportSha256: sha256(reportData),
    parentBundle: parentFixture(),
  });

  assert.equal(attestation.schemaVersion, NYC_3DEP_PARENT_3D_TILES_EXTERNAL_VALIDATION_SCHEMA);
  assert.equal(attestation.result.status, 'passed');
  assert.equal(attestation.parent.children.length, 1);
  assert.equal(attestation.privacy.containsAddressData, false);
});

test('NYC parent validator attestation fails closed on a warning, report drift, or parent tampering', () => {
  const warningReport = JSON.stringify({
    date: '2026-07-28T04:10:00.000Z',
    numErrors: 0,
    numWarnings: 1,
    numInfos: 0,
    issues: [{ severity: 'WARNING' }],
  });
  assert.equal(
    createNyc3depParent3dTilesExternalValidation({
      reportData: warningReport,
      reportFileName: NYC_3DEP_PARENT_3D_TILES_VALIDATOR_REPORT_FILE,
      reportSha256: sha256(warningReport),
      parentBundle: parentFixture(),
    }).result.status,
    'blocked',
  );
  assert.throws(
    () => createNyc3depParent3dTilesExternalValidation({
      reportData: warningReport,
      reportFileName: 'validator-report.json',
      reportSha256: sha256(warningReport),
      parentBundle: parentFixture(),
    }),
    /canonical file name/,
  );
  const parentBundle = parentFixture();
  parentBundle.evidence.data = '{}\n';
  assert.throws(
    () => createNyc3depParent3dTilesExternalValidation({
      reportData: warningReport,
      reportFileName: NYC_3DEP_PARENT_3D_TILES_VALIDATOR_REPORT_FILE,
      reportSha256: sha256(warningReport),
      parentBundle,
    }),
    /declared digest binding/,
  );
});
