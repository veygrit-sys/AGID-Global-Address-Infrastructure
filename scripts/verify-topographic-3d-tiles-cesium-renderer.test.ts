import assert from 'node:assert/strict';
import test from 'node:test';
import { join, resolve } from 'node:path';

import {
  resolveTopographic3dTilesRendererTarget,
} from './verify-topographic-3d-tiles-cesium-renderer';

test('Cesium renderer target keeps retained 3D Tiles packages read-only', () => {
  const tilesetDirectory = resolve('tmp', 'nyc-tileset');
  const outputDirectory = resolve('tmp', 'renderer-evidence');
  assert.deepEqual(resolveTopographic3dTilesRendererTarget({
    tilesetDirectory,
    outputDirectory,
  }), {
    kind: 'retained-package',
    tilesetDirectory,
    outputDirectory,
  });
  assert.throws(
    () => resolveTopographic3dTilesRendererTarget({
      tilesetDirectory,
      outputDirectory: join(tilesetDirectory, 'renderer-evidence'),
    }),
    /outside the retained tileset package/,
  );
});

test('Cesium renderer target retains the synthetic fixture mode for conformance checks', () => {
  const outputDirectory = resolve('tmp', 'synthetic-tileset');
  assert.deepEqual(resolveTopographic3dTilesRendererTarget({ outputDirectory }), {
    kind: 'synthetic-fixture',
    outputDirectory,
  });
});
