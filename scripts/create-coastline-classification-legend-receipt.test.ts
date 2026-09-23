import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { writeArrayBuffer } from 'geotiff';

import { AGID_SYNTHETIC_TOPO_SOURCE } from '../src/lib/topographicExport';
import { createCoastlineClassificationLegendReceiptFiles } from './create-coastline-classification-legend-receipt';

function sha256(bytes: Uint8Array) {
  return `sha256:${createHash('sha256').update(bytes).digest('hex')}` as const;
}

function classificationGeoTiff() {
  return writeArrayBuffer(Uint8Array.from([
    2, 1, 0,
    2, 1, 0,
    2, 1, 0,
  ]), {
    width: 3,
    height: 3,
    ModelPixelScale: [0.005, 0.005, 0],
    ModelTiepoint: [0, 0, 0, -0.0025, 0.0125, 0],
    GTModelTypeGeoKey: 2,
    GeographicTypeGeoKey: 4326,
    GTRasterTypeGeoKey: 1,
    GDAL_NODATA: '255',
    SampleFormat: [1],
    BitsPerSample: [8],
  });
}

function sourceRecord(contentSha256: `sha256:${string}`) {
  return {
    ...AGID_SYNTHETIC_TOPO_SOURCE,
    sourceId: 'synthetic-coastline-legend-cli-source',
    layerIds: ['waterways'],
    snapshotEvidence: {
      contentSha256,
      adapterVersion: 'synthetic-coastline-legend-cli-test-v1',
      verifiedAt: '2026-07-27T22:15:00.000Z',
      horizontalCrs: 'EPSG:4326',
      verticalDatum: 'not-applicable: coastline classification',
    },
  };
}

test('local coastline legend CLI creates a receipt and a separate bound-source candidate without copying inputs', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-coastline-legend-'));
  try {
    const classificationPath = join(directory, 'coastline-classification.tif');
    const legendPath = join(directory, 'public-legend.json');
    const sourcePath = join(directory, 'source-record.json');
    const receiptPath = join(directory, 'out', 'legend-receipt.json');
    const boundSourcePath = join(directory, 'out', 'bound-source-record.json');
    const classificationBytes = new Uint8Array(classificationGeoTiff());
    const legendBytes = new TextEncoder().encode(
      '{"version":"synthetic-public-legend-v1","classes":{"0":"ocean","1":"breakline","2":"land"}}',
    );
    writeFileSync(classificationPath, classificationBytes);
    writeFileSync(legendPath, legendBytes);
    writeFileSync(
      sourcePath,
      `${JSON.stringify(sourceRecord(sha256(classificationBytes)), null, 2)}\n`,
    );

    const result = await createCoastlineClassificationLegendReceiptFiles({
      sourceRecordPath: sourcePath,
      classificationGeoTiffPath: classificationPath,
      legendPath,
      legendUrl: 'https://example.test/public-coastline-legend-v1',
      legendVersion: 'synthetic-public-legend-v1',
      legendPublishedAt: '2026-01-01T00:00:00.000Z',
      bandIndex: 0,
      validatedAt: '2026-07-27T22:20:00.000Z',
      receiptOutputPath: receiptPath,
      boundSourceOutputPath: boundSourcePath,
    });
    const writtenReceipt = JSON.parse(readFileSync(receiptPath, 'utf8')) as {
      receipt: typeof result.receipt;
      receiptSha256: `sha256:${string}`;
    };
    const writtenBoundSource = JSON.parse(readFileSync(boundSourcePath, 'utf8')) as {
      snapshotEvidence: { relatedArtifactSha256: `sha256:${string}`[] };
    };

    assert.equal(writtenReceipt.receiptSha256, result.receiptSha256);
    assert.equal(
      writtenReceipt.receipt.source.classificationGeoTiffSha256,
      sha256(classificationBytes),
    );
    assert.equal(writtenReceipt.receipt.legend.contentSha256, sha256(legendBytes));
    assert.ok(
      writtenBoundSource.snapshotEvidence.relatedArtifactSha256.includes(
        sha256(legendBytes),
      ),
    );
    assert.ok(
      writtenBoundSource.snapshotEvidence.relatedArtifactSha256.includes(
        result.receiptSha256,
      ),
    );
    assert.deepEqual(
      Array.from(readFileSync(classificationPath)),
      Array.from(classificationBytes),
    );
    assert.deepEqual(Array.from(readFileSync(legendPath)), Array.from(legendBytes));
    assert.doesNotMatch(
      readFileSync(receiptPath, 'utf8'),
      /"classes"\s*:\s*\{\s*"0"/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('local coastline legend CLI rejects an unbound source snapshot and existing output', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'agid-coastline-legend-'));
  try {
    const classificationPath = join(directory, 'coastline-classification.tif');
    const legendPath = join(directory, 'public-legend.json');
    const sourcePath = join(directory, 'source-record.json');
    const receiptPath = join(directory, 'legend-receipt.json');
    const classificationBytes = new Uint8Array(classificationGeoTiff());
    writeFileSync(classificationPath, classificationBytes);
    writeFileSync(legendPath, '{"public":"legend"}');
    writeFileSync(
      sourcePath,
      JSON.stringify(sourceRecord(`sha256:${'a'.repeat(64)}`)),
    );

    await assert.rejects(
      () => createCoastlineClassificationLegendReceiptFiles({
        sourceRecordPath: sourcePath,
        classificationGeoTiffPath: classificationPath,
        legendPath,
        legendUrl: 'https://example.test/public-coastline-legend-v1',
        legendVersion: 'synthetic-public-legend-v1',
        legendPublishedAt: '2026-01-01T00:00:00.000Z',
        bandIndex: 0,
        validatedAt: '2026-07-27T22:20:00.000Z',
        receiptOutputPath: receiptPath,
      }),
      /GeoTIFF digest does not match the source snapshot/,
    );
    assert.equal(readFileSync(classificationPath).byteLength > 0, true);
    writeFileSync(receiptPath, 'already exists');
    await assert.rejects(
      () => createCoastlineClassificationLegendReceiptFiles({
        sourceRecordPath: sourcePath,
        classificationGeoTiffPath: classificationPath,
        legendPath,
        legendUrl: 'https://example.test/public-coastline-legend-v1',
        legendVersion: 'synthetic-public-legend-v1',
        legendPublishedAt: '2026-01-01T00:00:00.000Z',
        bandIndex: 0,
        validatedAt: '2026-07-27T22:20:00.000Z',
        receiptOutputPath: receiptPath,
      }),
      /must not overwrite an existing artifact/,
    );
    assert.equal(readFileSync(receiptPath, 'utf8'), 'already exists');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
