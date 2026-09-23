import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeArrayBuffer } from 'geotiff';

import type { TopographicSourceRecord } from '../src/lib/topographicExport';
import { verifyTopographic3dTilesBundle } from '../src/lib/topographic3dTiles';
import { runLocalGeoTiffWorkflow } from '../src/lib/topographicLocalGeoTiffWorkflow';

const DEFAULT_OUTPUT_DIRECTORY = join(
  'output',
  'topographic-3d-tiles-conformance',
);

function sha256(data: ArrayBuffer | string | Uint8Array) {
  const value = typeof data === 'string'
    ? data
    : Buffer.from(
        data instanceof ArrayBuffer
          ? new Uint8Array(data)
          : data,
      );
  return `sha256:${createHash('sha256').update(value).digest('hex')}` as const;
}

function syntheticElevationGeoTiff() {
  return writeArrayBuffer(
    new Float32Array([
      0, 1, 2,
      2, 6, 4,
      4, 5, 6,
    ]),
    {
      width: 3,
      height: 3,
      ModelPixelScale: [0.01, 0.01, 0],
      ModelTiepoint: [0, 0, 0, 0, 0.03, 0],
      GTModelTypeGeoKey: 2,
      GeographicTypeGeoKey: 4326,
      GTRasterTypeGeoKey: 1,
      GDAL_NODATA: '-9999',
      SampleFormat: [3],
      BitsPerSample: [32],
    },
  );
}

function sourceRecord(
  snapshotSha256: `sha256:${string}`,
): TopographicSourceRecord {
  return {
    sourceId: 'agid-generated-3d-tiles-conformance-fixture',
    publisher: 'AGID project',
    product: 'Generated synthetic 3D Tiles conformance fixture',
    sourceUrl:
      'https://github.com/dawnportinfo-design/Address-Grid-ID/blob/main/scripts/export-topographic-3d-tiles-conformance-fixture.ts',
    termsUrl:
      'https://github.com/dawnportinfo-design/Address-Grid-ID/blob/main/LICENSE',
    licenseId: 'MIT',
    version: 'synthetic-fixture-v1',
    publishedAt: '2026-07-27T00:00:00.000Z',
    retrievedAt: '2026-07-27T12:30:00.000Z',
    freshUntil: '2030-01-01T00:00:00.000Z',
    attribution: 'AGID project',
    correctionUrl:
      'https://github.com/dawnportinfo-design/Address-Grid-ID/issues',
    coverage: {
      scope: 'country',
      countryCodes: ['ZZ'],
      description:
        'Generated synthetic 3x3 WGS 84 elevation grid around the coordinate origin.',
    },
    layerIds: ['terrain-mesh'],
    allowedFormats: ['tiff', 'gltf', 'txt'],
    reuseStatus: 'approved',
    snapshotEvidence: {
      contentSha256: snapshotSha256,
      adapterVersion: 'agid-3d-tiles-conformance-fixture-v1',
      verifiedAt: '2026-07-27T12:30:00.000Z',
      horizontalCrs: 'EPSG:4326',
      verticalDatum: 'EPSG:4979',
    },
  };
}

export async function exportTopographic3dTilesConformanceFixture(
  outputDirectory = resolve(DEFAULT_OUTPUT_DIRECTORY),
) {
  const arrayBuffer = syntheticElevationGeoTiff();
  const result = await runLocalGeoTiffWorkflow({
    arrayBuffer,
    sourceRecord: sourceRecord(sha256(arrayBuffer)),
    gridId: 'agid-3d-tiles-conformance',
    title: 'AGID synthetic 3D Tiles conformance terrain',
    generatedAt: '2026-07-27T12:30:00.000Z',
    countryCode: 'ZZ',
    format: 'gltf',
    layerIds: ['terrain-mesh'],
    contourIntervalMeters: 2,
    meshLodStrides: [1, 2],
    meshMaxVerticalErrorMeters: 3,
  });
  if (
    result.threeDTiles?.status !== 'ready'
    || !result.meshLodBundle
  ) {
    const issueCodes = result.threeDTiles?.issues
      .map(issue => issue.code)
      .join(',') ?? 'missing-3d-tiles-result';
    throw new Error(`3D Tiles conformance fixture blocked: ${issueCodes}`);
  }
  await verifyTopographic3dTilesBundle(
    result.threeDTiles.bundle,
    result.meshLodBundle,
  );
  mkdirSync(outputDirectory, { recursive: true });
  for (const artifact of result.threeDTiles.bundle.contents) {
    writeFileSync(
      join(outputDirectory, artifact.output.fileName),
      artifact.output.data,
    );
  }
  writeFileSync(
    join(outputDirectory, result.threeDTiles.bundle.tileset.fileName),
    result.threeDTiles.bundle.tileset.data,
  );
  writeFileSync(
    join(outputDirectory, result.threeDTiles.bundle.evidence.fileName),
    result.threeDTiles.bundle.evidence.data,
  );
  writeFileSync(
    join(outputDirectory, result.meshLodBundle.manifest.fileName),
    result.meshLodBundle.manifest.data,
  );
  return {
    outputDirectory,
    tilesetFileName: result.threeDTiles.bundle.tileset.fileName,
    tilesetSha256: result.threeDTiles.bundle.tileset.sha256,
    evidenceFileName: result.threeDTiles.bundle.evidence.fileName,
    evidenceSha256: result.threeDTiles.bundle.evidence.sha256,
    contentFileNames: result.threeDTiles.bundle.contents
      .map(artifact => artifact.output.fileName),
  };
}

function outputArgument() {
  const index = process.argv.indexOf('--output');
  return index >= 0 && process.argv[index + 1]
    ? resolve(process.argv[index + 1])
    : resolve(DEFAULT_OUTPUT_DIRECTORY);
}

async function main() {
  const summary = await exportTopographic3dTilesConformanceFixture(
    outputArgument(),
  );
  console.log(JSON.stringify({
    ...summary,
    outputDirectory: resolve(summary.outputDirectory),
    tilesetPath: join(summary.outputDirectory, summary.tilesetFileName),
    outputName: basename(summary.outputDirectory),
  }, null, 2));
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  await main();
}
