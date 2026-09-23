import assert from 'node:assert/strict';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import test from 'node:test';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { writeArrayBuffer } from 'geotiff';

import type { TopographicSourceRecord } from './topographicExport';
import { runLocalGeoTiffWorkflow } from './topographicLocalGeoTiffWorkflow';
import { planNyc3depSourceTiles } from './topographicNyc3depTiling';
import {
  createNyc3depTileBatchReceipt,
  requireNyc3depTileBatchReadyFor3dTilesHierarchy,
  verifyNyc3depTileBatchReceipt,
} from './topographicNyc3depTileBatch';
import {
  buildNyc3depParent3dTileset,
  verifyNyc3depParent3dTileset,
} from './topographicNyc3depParent3dTiles';
import {
  NYC_3DEP_PARENT_3D_TILES_EXTERNAL_EVIDENCE_FILE,
  NYC_3DEP_PARENT_3D_TILES_VALIDATOR_REPORT_FILE,
} from './topographicNyc3depParent3dTilesExternalValidation';
import { writeNyc3depLocalTileBatch } from './topographicNyc3depBatchWriter';
import { verifyNyc3depLocalTileBatchPackage } from './topographicNyc3depBatchPackageVerifier';
import {
  verifyNyc3depParent3dTilesValidatorReportFiles,
} from '../../scripts/verify-nyc-3dep-parent-3d-tiles-validator-report';

async function sha256(arrayBuffer: ArrayBuffer) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', arrayBuffer);
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

function sourceRecord(
  digest: `sha256:${string}`,
  verticalDatum = 'test-datum',
): TopographicSourceRecord {
  return {
    sourceId: 'usgs-3dep',
    publisher: 'USGS',
    product: '3D Elevation Program',
    sourceUrl: 'https://example.test/usgs-3dep',
    termsUrl: 'https://example.test/usgs-3dep-terms',
    licenseId: 'US-PUBLIC-DOMAIN',
    version: 'test-2026-07-28',
    publishedAt: '2026-07-01T00:00:00.000Z',
    retrievedAt: '2026-07-28T00:00:00.000Z',
    freshUntil: '2030-01-01T00:00:00.000Z',
    attribution: 'USGS 3DEP test fixture',
    correctionUrl: 'https://example.test/usgs-3dep-corrections',
    coverage: {
      scope: 'country',
      countryCodes: ['US'],
      description: 'Synthetic public test extent in the United States.',
    },
    layerIds: ['terrain-mesh', 'contour-lines'],
    allowedFormats: ['tiff', 'gltf', 'geojson', 'txt'],
    reuseStatus: 'approved',
    snapshotEvidence: {
      contentSha256: digest,
      adapterVersion: 'usgs-3dep-test-adapter-v1',
      verifiedAt: '2026-07-28T00:00:00.000Z',
      horizontalCrs: 'EPSG:4326',
      verticalDatum,
      relatedArtifactSha256: [],
    },
  };
}

async function createFixture(input: {
  verticalDatum?: string;
  meshLodStrides?: readonly number[];
  meshMaxVerticalErrorMeters?: number;
} = {}) {
  const arrayBuffer = await writeArrayBuffer(
    new Float32Array([
      0, 1, 2, 3, 4,
      5, 6, 7, 8, 9,
      10, 11, 12, 13, 14,
    ]),
    {
      width: 5,
      height: 3,
      ModelPixelScale: [0.01, 0.01, 0],
      ModelTiepoint: [0, 0, 0, 0, 1, 0],
      GTModelTypeGeoKey: 2,
      GeographicTypeGeoKey: 4326,
      GTRasterTypeGeoKey: 1,
      GDAL_NODATA: '-9999',
      SampleFormat: [3],
      BitsPerSample: [32],
    },
  );
  const digest = await sha256(arrayBuffer);
  const record = sourceRecord(digest, input.verticalDatum);
  const plan = planNyc3depSourceTiles({
    source: {
      sourceSnapshotSha256: digest,
      imageIndex: 0,
      width: 5,
      height: 3,
      storage: 'striped',
      blockWidth: 5,
      blockHeight: 3,
    },
    maximumWindowWidth: 3,
    maximumWindowHeight: 4,
    maximumTileCount: 2,
  });
  const artifacts = await Promise.all(plan.tiles.map(async tile => ({
    tileId: tile.id,
    result: await runLocalGeoTiffWorkflow({
      arrayBuffer,
      sourceRecord: record,
      gridId: `nyc-batch-${tile.id}`,
      title: 'USGS 3DEP NYC batch test window',
      generatedAt: '2026-07-28T00:00:00.000Z',
      countryCode: 'US',
      format: 'gltf',
      layerIds: ['terrain-mesh', 'contour-lines'],
      contourIntervalMeters: 10,
      meshLodStrides: input.meshLodStrides ?? [1],
      meshMaxVerticalErrorMeters: input.meshMaxVerticalErrorMeters ?? 0.01,
      imageIndex: 0,
      window: tile.window,
    }),
  })));
  return { artifacts, plan };
}

test('NYC planned GeoTIFF batch binds source windows and attests exact shared source edges', async () => {
  const { artifacts, plan } = await createFixture();
  const receipt = createNyc3depTileBatchReceipt({
    generatedAt: '2026-07-28T00:05:00.000Z',
    plan,
    artifacts,
  });

  assert.equal(receipt.tiles.length, 2);
  assert.deepEqual(receipt.sharedEdges.map(edge => ({
    orientation: edge.orientation,
    sampleCount: edge.sampleCount,
  })), [{ orientation: 'east-west', sampleCount: 3 }]);
  assert.equal(receipt.source.snapshotSha256, plan.source.sourceSnapshotSha256);
  assert.equal(receipt.privacy.containsRawElevation, false);
  assert.equal(receipt.tiles.every(tile => tile.threeDTiles.status === 'blocked'), true);
  assert.doesNotMatch(JSON.stringify(receipt), /recipient|room_number|delivery_instruction|private_key|proof_secret/i);
  assert.deepEqual(verifyNyc3depTileBatchReceipt(receipt), receipt);
  assert.throws(
    () => requireNyc3depTileBatchReadyFor3dTilesHierarchy(receipt),
    /cannot build a parent 3D Tiles hierarchy/,
  );
  const directory = mkdtempSync(join(tmpdir(), 'agid-nyc-blocked-batch-'));
  try {
    const exported = await writeNyc3depLocalTileBatch({
      outputDirectory: join(directory, 'batch'),
      generatedAt: '2026-07-28T00:05:00.000Z',
      plan,
      artifacts,
    });
    assert.deepEqual(exported.parent, {
      status: 'blocked',
      blockedTileIds: ['r0000-c0000', 'r0000-c0001'],
    });
    assert.equal(existsSync(exported.manifestPath), true);
    assert.equal(existsSync(exported.receiptPath), true);
    assert.equal(existsSync(join(exported.outputDirectory, 'tileset.json')), false);
    assert.equal(
      JSON.parse(readFileSync(exported.manifestPath, 'utf8')).parent.status,
      'blocked',
    );
    assert.deepEqual(await verifyNyc3depLocalTileBatchPackage(exported.outputDirectory), {
      outputDirectory: exported.outputDirectory,
      planSha256: plan.planSha256,
      receiptSha256: JSON.parse(readFileSync(exported.manifestPath, 'utf8')).receipt.sha256,
      tileCount: 2,
      parent: {
        status: 'blocked',
        blockedTileIds: ['r0000-c0000', 'r0000-c0001'],
      },
    });
    writeFileSync(
      join(exported.outputDirectory, 'children', 'r0000-c0000', artifacts[0].result.output.fileName),
      'changed',
    );
    await assert.rejects(
      () => verifyNyc3depLocalTileBatchPackage(exported.outputDirectory),
      /does not match its recorded byte length or SHA-256/,
    );
    await assert.rejects(
      () => writeNyc3depLocalTileBatch({
        outputDirectory: exported.outputDirectory,
        generatedAt: '2026-07-28T00:05:00.000Z',
        plan,
        artifacts,
      }),
      /new empty directory/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('NYC planned GeoTIFF batch fails closed on a shared edge mismatch or missing tile', async () => {
  const { artifacts, plan } = await createFixture();
  const values = artifacts[1].result.decoded.grid.elevationsMeters as Float32Array;
  values[0] = -100;
  assert.throws(
    () => createNyc3depTileBatchReceipt({
      generatedAt: '2026-07-28T00:05:00.000Z',
      plan,
      artifacts,
    }),
    /differs at shared sample/,
  );
  assert.throws(
    () => createNyc3depTileBatchReceipt({
      generatedAt: '2026-07-28T00:05:00.000Z',
      plan,
      artifacts: [artifacts[0]],
    }),
    /exactly one artifact/,
  );
});

test('NYC ready child tilesets form a hash-bound external parent hierarchy', async () => {
  const { artifacts, plan } = await createFixture({
    verticalDatum: 'EPSG:4979',
    meshLodStrides: [1, 2],
    meshMaxVerticalErrorMeters: 3,
  });
  const receipt = createNyc3depTileBatchReceipt({
    generatedAt: '2026-07-28T00:05:00.000Z',
    plan,
    artifacts,
  });
  assert.equal(receipt.tiles.every(tile => tile.threeDTiles.status === 'ready'), true);
  const children = artifacts.map(artifact => {
    if (
      artifact.result.threeDTiles?.status !== 'ready'
      || !artifact.result.meshLodBundle
    ) {
      throw new Error('Expected ready source-backed child 3D Tiles bundles.');
    }
    return {
      tileId: artifact.tileId,
      uri: `children/${artifact.tileId}/tileset.json`,
      bundle: artifact.result.threeDTiles.bundle,
      lodBundle: artifact.result.meshLodBundle,
    };
  });
  const bundle = await buildNyc3depParent3dTileset({
    generatedAt: '2026-07-28T00:10:00.000Z',
    batchReceipt: receipt,
    children,
  });

  assert.equal(bundle.tileset.tileset.asset.version, '1.1');
  assert.equal(bundle.tileset.tileset.asset.tilesetVersion, receipt.receiptSha256);
  assert.equal(bundle.tileset.tileset.root.refine, 'REPLACE');
  assert.equal(bundle.tileset.tileset.root.children?.length, 2);
  assert.equal(
    bundle.tileset.tileset.root.children?.[0].content.uri,
    'children/r0000-c0000/tileset.json',
  );
  assert.ok(
    bundle.evidence.manifest.root.geometricErrorMeters
      > Math.max(...bundle.evidence.manifest.children.map(child => child.geometricErrorMeters)),
  );
  assert.doesNotMatch(JSON.stringify(bundle), /recipient|room_number|delivery_instruction|private_key|proof_secret/i);
  await verifyNyc3depParent3dTileset({
    generatedAt: '2026-07-28T00:10:00.000Z',
    batchReceipt: receipt,
    children,
    bundle,
  });
  const directory = mkdtempSync(join(tmpdir(), 'agid-nyc-ready-batch-'));
  try {
    const exported = await writeNyc3depLocalTileBatch({
      outputDirectory: join(directory, 'batch'),
      generatedAt: '2026-07-28T00:10:00.000Z',
      plan,
      artifacts,
    });
    assert.equal(exported.parent.status, 'ready');
    assert.equal(existsSync(join(exported.outputDirectory, 'tileset.json')), true);
    assert.equal(
      existsSync(join(exported.outputDirectory, 'children', 'r0000-c0000', 'tileset.json')),
      true,
    );
    assert.doesNotMatch(
      readFileSync(exported.manifestPath, 'utf8'),
      /recipient|room_number|delivery_instruction|private_key|proof_secret/i,
    );
    assert.equal(
      (await verifyNyc3depLocalTileBatchPackage(exported.outputDirectory)).parent.status,
      'ready',
    );
    if (exported.parent.status !== 'ready') {
      throw new Error('Expected the source-backed test batch to emit a ready parent tileset.');
    }
    const validatorReportPath = join(directory, NYC_3DEP_PARENT_3D_TILES_VALIDATOR_REPORT_FILE);
    const externalEvidencePath = join(
      directory,
      NYC_3DEP_PARENT_3D_TILES_EXTERNAL_EVIDENCE_FILE,
    );
    writeFileSync(validatorReportPath, JSON.stringify({
      date: '2026-07-28T00:11:00.000Z',
      numErrors: 0,
      numWarnings: 0,
      numInfos: 0,
      issues: [],
    }));
    const externalValidation = await verifyNyc3depParent3dTilesValidatorReportFiles({
      outputDirectory: exported.outputDirectory,
      reportPath: validatorReportPath,
      outputPath: externalEvidencePath,
    });
    assert.equal(externalValidation.result.status, 'passed');
    assert.equal(externalValidation.parent.tilesetSha256, exported.parent.tilesetSha256);
    assert.equal(existsSync(externalEvidencePath), true);
    await assert.rejects(
      () => verifyNyc3depParent3dTilesValidatorReportFiles({
        outputDirectory: exported.outputDirectory,
        reportPath: validatorReportPath,
        outputPath: join(
          exported.outputDirectory,
          NYC_3DEP_PARENT_3D_TILES_EXTERNAL_EVIDENCE_FILE,
        ),
      }),
      /outside the retained batch package/,
    );
    writeFileSync(
      join(
        exported.outputDirectory,
        'children',
        'r0000-c0000',
        artifacts[0].result.meshLodBundle!.artifacts[0].output.fileName,
      ),
      'changed-lod',
    );
    await assert.rejects(
      () => verifyNyc3depLocalTileBatchPackage(exported.outputDirectory),
      /LOD artifact 0 does not match its recorded byte length or SHA-256/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }

  await assert.rejects(
    () => buildNyc3depParent3dTileset({
      generatedAt: '2026-07-28T00:10:00.000Z',
      batchReceipt: receipt,
      children: [
        { ...children[0], uri: '../escape/tileset.json' },
        children[1],
      ],
    }),
    /safe relative path/,
  );

  bundle.tileset.tileset.root.children![0].content.uri = '../escape/tileset.json';
  await assert.rejects(
    () => verifyNyc3depParent3dTileset({
      generatedAt: '2026-07-28T00:10:00.000Z',
      batchReceipt: receipt,
      children,
      bundle,
    }),
    /integrity check failed/,
  );
});
