import assert from 'node:assert/strict';
import test from 'node:test';

import { writeArrayBuffer } from 'geotiff';

import type { TopographicSourceRecord } from './topographicExport';
import {
  createEnuToEcefTransform,
  verifyTopographic3dTilesBundle,
} from './topographic3dTiles';
import { runLocalGeoTiffWorkflow } from './topographicLocalGeoTiffWorkflow';

async function sha256(data: ArrayBuffer | string) {
  const bytes = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : new Uint8Array(data);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return `sha256:${Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')}` as const;
}

function elevationGeoTiff(pixelScaleDegrees = 0.01) {
  return writeArrayBuffer(
    new Float32Array([
      0, 1, 2,
      2, 6, 4,
      4, 5, 6,
    ]),
    {
      width: 3,
      height: 3,
      ModelPixelScale: [pixelScaleDegrees, pixelScaleDegrees, 0],
      ModelTiepoint: [0, 0, 0, 0, pixelScaleDegrees * 3, 0],
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
  digest: `sha256:${string}`,
  verticalDatum: string,
): TopographicSourceRecord {
  return {
    sourceId: '3d-tiles-evidenced-dem',
    publisher: 'AGID test publisher',
    product: '3D Tiles evidenced DEM',
    sourceUrl: 'https://example.test/source',
    termsUrl: 'https://example.test/terms',
    licenseId: 'CC-BY-4.0',
    version: '2026-07-27',
    publishedAt: '2026-07-01T00:00:00.000Z',
    retrievedAt: '2026-07-27T12:00:00.000Z',
    freshUntil: '2030-01-01T00:00:00.000Z',
    attribution: 'AGID test publisher',
    correctionUrl: 'https://example.test/corrections',
    coverage: {
      scope: 'country',
      countryCodes: ['ZZ'],
      description: 'Synthetic public test extent around the WGS 84 origin.',
    },
    layerIds: ['terrain-mesh'],
    allowedFormats: ['tiff', 'gltf', 'txt'],
    reuseStatus: 'approved',
    snapshotEvidence: {
      contentSha256: digest,
      adapterVersion: '3d-tiles-evidenced-dem-adapter-v1',
      verifiedAt: '2026-07-27T12:00:00.000Z',
      horizontalCrs: 'EPSG:4326',
      verticalDatum,
    },
  };
}

async function runWorkflow(
  verticalDatum: string,
  pixelScaleDegrees = 0.01,
) {
  const arrayBuffer = elevationGeoTiff(pixelScaleDegrees);
  return runLocalGeoTiffWorkflow({
    arrayBuffer,
    sourceRecord: sourceRecord(await sha256(arrayBuffer), verticalDatum),
    gridId: '3d-tiles-grid',
    title: '3D Tiles terrain',
    generatedAt: '2026-07-27T12:05:00.000Z',
    countryCode: 'ZZ',
    format: 'gltf',
    layerIds: ['terrain-mesh'],
    contourIntervalMeters: 2,
    meshLodStrides: [1, 2],
    meshMaxVerticalErrorMeters: 3,
  });
}

test('ENU basis maps the WGS 84 origin into a column-major ECEF transform', () => {
  const placement = createEnuToEcefTransform(0, 0);

  assert.deepEqual(placement.origin, [6_378_137, 0, 0]);
  assert.deepEqual(
    placement.transform.map(value => Object.is(value, -0) ? 0 : value),
    [
      0, 1, 0, 0,
      0, 0, 1, 0,
      1, 0, 0, 0,
      6_378_137, 0, 0, 1,
    ],
  );
});

test('EPSG:4979 LOD artifacts produce a bound coarsest-to-finest 3D Tiles hierarchy', async () => {
  const result = await runWorkflow('EPSG:4979');
  assert.equal(result.threeDTiles?.status, 'ready');
  if (result.threeDTiles?.status !== 'ready' || !result.meshLodBundle) {
    throw new Error('Expected a ready 3D Tiles bundle.');
  }
  const bundle = result.threeDTiles.bundle;
  const tileset = bundle.tileset.tileset;

  assert.equal(tileset.asset.version, '1.1');
  assert.equal(tileset.geometricError, 3);
  assert.equal(
    tileset.root.content.uri,
    '3d-tiles-grid-vectorized-terrain-lod1-s2.gltf',
  );
  assert.equal(tileset.root.geometricError, 3);
  assert.equal(tileset.root.refine, 'REPLACE');
  assert.equal(tileset.root.transform?.length, 16);
  assert.equal(
    tileset.root.children?.[0].content.uri,
    '3d-tiles-grid-vectorized-terrain-lod0-s1.gltf',
  );
  assert.equal(tileset.root.children?.[0].geometricError, 0);
  const expectedRegion = [
    0.005 * Math.PI / 180,
    0.005 * Math.PI / 180,
    0.025 * Math.PI / 180,
    0.025 * Math.PI / 180,
    0,
    6,
  ];
  tileset.root.boundingVolume.region.forEach((value, index) => {
    assert.ok(Math.abs(value - expectedRegion[index]) < 1e-15);
  });
  assert.equal(bundle.evidence.manifest.source.verticalDatum, 'EPSG:4979');
  const placementAudit =
    bundle.evidence.manifest.placement.approximationAudit;
  assert.equal(
    placementAudit.method,
    'serializer-ecef-enu-roundtrip-vs-proj4-epsg4978-corner-extrema-v0.2',
  );
  assert.equal(placementAudit.testedPositionCount, 8);
  assert.ok(placementAudit.maximumResidualMeters < 0.000001);
  assert.equal(placementAudit.maximumAllowedResidualMeters, 0.001);
  assert.equal(placementAudit.status, 'passed');
  const gltf = JSON.parse(String(bundle.contents[0].output.data));
  assert.deepEqual(gltf.nodes[0].matrix, [
    1, 0, 0, 0,
    0, 0, -1, 0,
    0, 1, 0, 0,
    0, 0, 0, 1,
  ]);
  assert.equal(gltf.asset.extras.localFrame, 'WGS84-ECEF-to-ENU');
  assert.equal(gltf.asset.extras.meshAxes, 'x-east-y-north-z-up');
  assert.equal(gltf.asset.extras.gltfAxes, 'x-east-y-up-z-south');
  assert.equal(gltf.asset.extras.verticalMode, 'ellipsoidal-height');
  assert.deepEqual(
    bundle.evidence.manifest.placement.contentCoordinates,
    {
      meshAxes: 'x-east-y-north-z-up',
      gltfAxes: 'x-east-y-up-z-south',
      gltfRootNodeMatrix: [
        1, 0, 0, 0,
        0, 0, -1, 0,
        0, 1, 0, 0,
        0, 0, 0, 1,
      ],
      runtimeConversion:
        'ogc-3d-tiles-gltf-y-up-to-z-up-x-plus-90-degrees',
    },
  );
  assert.equal(bundle.evidence.manifest.files.length, 3);
  assert.equal(
    bundle.evidence.manifest.refinement.geometricErrorMethod,
    'all-grid-point-vertical-residual-monotonic-upper-envelope-v0.1',
  );
  assert.deepEqual(
    bundle.evidence.manifest.refinement.levels.map(level => (
      level.geometricErrorMeters
    )),
    [0, 3],
  );
  const rootSseReference =
    bundle.evidence.manifest.refinement.screenSpaceReference.levels[1];
  assert.equal(rootSseReference.geometricErrorMeters, 3);
  assert.ok(rootSseReference.refinementDistanceThresholdMeters > 175);
  assert.ok(rootSseReference.refinementDistanceThresholdMeters < 176);
  assert.match(bundle.tileset.sha256, /^sha256:[a-f0-9]{64}$/);
  assert.match(bundle.evidence.sha256, /^sha256:[a-f0-9]{64}$/);
  assert.equal(result.evidence.manifest.output.threeDTiles?.status, 'ready');
  await verifyTopographic3dTilesBundle(bundle, result.meshLodBundle);
});

test('exact ECEF/ENU placement supports the largest admitted synthetic extent', async () => {
  const result = await runWorkflow('EPSG:4979', 0.025);

  assert.equal(result.output.format, 'gltf');
  assert.equal(result.threeDTiles?.status, 'ready');
  if (result.threeDTiles?.status !== 'ready') {
    throw new Error('Expected exact ECEF/ENU placement to remain ready.');
  }
  assert.ok(
    result.threeDTiles.bundle.evidence.manifest
      .placement.approximationAudit.maximumResidualMeters <= 0.001,
  );
  assert.equal(
    result.evidence.manifest.output.threeDTiles?.status,
    'ready',
  );
});

test('3D Tiles placement blocks non-ellipsoidal vertical datums without blocking glTF', async () => {
  const result = await runWorkflow('orthometric-height: test geoid');

  assert.equal(result.output.format, 'gltf');
  assert.equal(result.meshLodBundle?.artifacts.length, 2);
  assert.deepEqual(result.threeDTiles, {
    status: 'blocked',
    issues: [{
      code: 'vertical-datum-not-epsg4979',
      message:
        '3D Tiles region placement requires evidenced EPSG:4979 WGS 84 ellipsoidal heights.',
    }],
    bundle: null,
  });
  assert.deepEqual(result.evidence.manifest.output.threeDTiles, {
    status: 'blocked',
    issueCodes: ['vertical-datum-not-epsg4979'],
  });
});

test('3D Tiles verifier rejects a changed hierarchy URI', async () => {
  const result = await runWorkflow('EPSG:4979');
  if (result.threeDTiles?.status !== 'ready' || !result.meshLodBundle) {
    throw new Error('Expected a ready 3D Tiles bundle.');
  }
  const threeDTilesBundle = result.threeDTiles.bundle;
  const meshLodBundle = result.meshLodBundle;
  threeDTilesBundle.tileset.tileset.root.content.uri = 'changed.gltf';

  await assert.rejects(
    () => verifyTopographic3dTilesBundle(
      threeDTilesBundle,
      meshLodBundle,
    ),
    /tileset integrity check failed/,
  );
});

test('3D Tiles verifier rejects a self-consistent but unevidenced tile error', async () => {
  const result = await runWorkflow('EPSG:4979');
  if (result.threeDTiles?.status !== 'ready' || !result.meshLodBundle) {
    throw new Error('Expected a ready 3D Tiles bundle.');
  }
  const bundle = result.threeDTiles.bundle;
  bundle.tileset.tileset.root.geometricError = 4;
  bundle.tileset.data = `${JSON.stringify(bundle.tileset.tileset, null, 2)}\n`;
  bundle.tileset.byteLength = new TextEncoder()
    .encode(bundle.tileset.data).byteLength;
  bundle.tileset.sha256 = await sha256(bundle.tileset.data);

  await assert.rejects(
    () => verifyTopographic3dTilesBundle(
      bundle,
      result.meshLodBundle!,
    ),
    /geometric-error hierarchy binding failed/,
  );
});
