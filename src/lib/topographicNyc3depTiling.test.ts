import assert from 'node:assert/strict';
import test from 'node:test';

import {
  planNyc3depSourceTiles,
  verifyNyc3depSourceTilingPlan,
} from './topographicNyc3depTiling';

const sourceSnapshotSha256 = `sha256:${'a'.repeat(64)}` as const;

test('NYC source tiling creates deterministic block-aligned windows with shared source edges', () => {
  const input = {
    source: {
      sourceSnapshotSha256,
      imageIndex: 0,
      width: 17,
      height: 13,
      storage: 'tiled' as const,
      blockWidth: 4,
      blockHeight: 3,
    },
    maximumWindowWidth: 9,
    maximumWindowHeight: 7,
    maximumTileCount: 16,
  };
  const first = planNyc3depSourceTiles(input);
  const second = planNyc3depSourceTiles(input);

  assert.deepEqual(first, second);
  assert.equal(first.tiles.length, 4);
  assert.deepEqual(first.tiles.map(tile => tile.window), [
    { x: 0, y: 0, width: 9, height: 7 },
    { x: 8, y: 0, width: 9, height: 7 },
    { x: 0, y: 6, width: 9, height: 7 },
    { x: 8, y: 6, width: 9, height: 7 },
  ]);
  assert.equal(first.tiles[0].sharedSourceSamples.east, 7);
  assert.equal(first.tiles[0].sharedSourceSamples.south, 9);
  assert.equal(first.tiles[1].sharedSourceSamples.west, 7);
  assert.equal(first.tiles[2].sharedSourceSamples.north, 9);
  assert.deepEqual(first.tiles[3].gdalSrcwin, [8, 6, 9, 7]);
  assert.equal(first.alignment.strategy, 'tile-block-grid');
  assert.equal(first.privacy.containsCoordinates, false);
  assert.doesNotMatch(JSON.stringify(first), /recipient|room_number|delivery_instruction|private_key|proof_secret/i);
  assert.deepEqual(verifyNyc3depSourceTilingPlan(first), first);
});

test('NYC source tiling permits striped rows but blocks non-aligned, oversized, and altered plans', () => {
  const striped = planNyc3depSourceTiles({
    source: {
      sourceSnapshotSha256,
      imageIndex: 0,
      width: 10,
      height: 10,
      storage: 'striped',
      blockWidth: 10,
      blockHeight: 4,
    },
    maximumWindowWidth: 6,
    maximumWindowHeight: 9,
    maximumTileCount: 8,
  });
  assert.equal(striped.alignment.strategy, 'strip-row-grid');
  assert.equal(striped.alignment.xSamples, 1);
  assert.deepEqual(striped.tiles.map(tile => tile.window.x), [0, 5, 0, 5]);

  assert.throws(
    () => planNyc3depSourceTiles({
      source: {
        ...striped.source,
        storage: 'tiled',
        blockWidth: 8,
      },
      maximumWindowWidth: 8,
      maximumWindowHeight: 9,
      maximumTileCount: 8,
    }),
    /cannot retain a one-sample seam overlap/,
  );
  assert.throws(
    () => planNyc3depSourceTiles({
      source: striped.source,
      maximumWindowWidth: 6,
      maximumWindowHeight: 9,
      maximumTileCount: 3,
    }),
    /exceeding the maximum/,
  );
  const altered = structuredClone(striped);
  altered.tiles[0].window.width = 5;
  assert.throws(
    () => verifyNyc3depSourceTilingPlan(altered),
    /integrity check failed/,
  );
});
