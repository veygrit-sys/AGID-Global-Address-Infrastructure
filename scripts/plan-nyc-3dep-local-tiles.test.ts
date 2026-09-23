import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { writeArrayBuffer } from 'geotiff';

import { createNyc3depSourceLedger } from '../src/lib/topographicNyc3depCaseStudy';
import { createNyc3depLocalTilePlan } from './plan-nyc-3dep-local-tiles';

async function sha256(bytes: Uint8Array) {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    Uint8Array.from(bytes).buffer,
  );
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

function createFixtureGeoTiff() {
  return writeArrayBuffer(
    new Float32Array([
      1, 2, 3, 4, 5,
      2, 3, 4, 5, 6,
      3, 4, 5, 6, 7,
      4, 5, 6, 7, 8,
      5, 6, 7, 8, 9,
    ]),
    {
      width: 5,
      height: 5,
      ModelPixelScale: [0.01, 0.01, 0],
      ModelTiepoint: [0, 0, 0, -74, 40.73, 0],
      GTModelTypeGeoKey: 2,
      GeographicTypeGeoKey: 4269,
      GTRasterTypeGeoKey: 1,
      SampleFormat: [3],
      BitsPerSample: [32],
    },
  );
}

test('NYC tile planner writes a digest-bound, raw-data-free local window plan', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-nyc-3dep-tile-plan-'));
  try {
    const assetPath = join(directory, 'nyc-dem.tif');
    const ledgerPath = join(directory, 'source-ledger.json');
    const outputPath = join(directory, 'tile-plan.json');
    const bytes = new Uint8Array(createFixtureGeoTiff());
    writeFileSync(assetPath, bytes);
    const sourceSnapshotSha256 = await sha256(bytes);
    writeFileSync(ledgerPath, JSON.stringify(createNyc3depSourceLedger({
      sourceAssetUrl: 'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage',
      metadataUrl: 'https://www.usgs.gov/ngp-standards-and-specifications/3dep-product-metadata',
      versionId: 'USGS_3DEP_13_n40w074_20260728_fixture',
      publishedAt: '2026-07-20T00:00:00.000Z',
      retrievedAt: '2026-07-28T00:00:00.000Z',
      verifiedAt: '2026-07-28T00:01:00.000Z',
      contentSha256: sourceSnapshotSha256,
      recordOrCellCount: 25,
      horizontalCrs: 'EPSG:4269',
      verticalDatum: 'NAVD88',
    })));

    const result = await createNyc3depLocalTilePlan({
      assetPath,
      ledgerPath,
      outputPath,
      generatedAt: '2026-07-28T00:02:00.000Z',
      maximumWindowWidth: 3,
      maximumWindowHeight: 6,
      maximumTileCount: 2,
    });
    const written = readFileSync(outputPath, 'utf8');

    assert.equal(result.plan.tiles.length, 2);
    assert.deepEqual(result.plan.tiles.map(tile => tile.window), [
      { x: 0, y: 0, width: 3, height: 5 },
      { x: 2, y: 0, width: 3, height: 5 },
    ]);
    assert.match(result.contentSha256, /^sha256:[a-f0-9]{64}$/);
    assert.doesNotMatch(
      written,
      /\[1,2,3|recipient|room_number|delivery_instruction|private_key|proof_secret/i,
    );
    await assert.rejects(
      () => createNyc3depLocalTilePlan({
        assetPath,
        ledgerPath,
        outputPath,
        generatedAt: '2026-07-28T00:02:00.000Z',
        maximumWindowWidth: 3,
        maximumWindowHeight: 6,
        maximumTileCount: 2,
      }),
      /EEXIST/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
