import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
getGridRenderPaddingRatio,
getGridPrefetchPaddingRatio,
getGridPrefetchBounds,
getMapViewportPoints,
getPaddedGridBounds,
getVisibleGridBounds,
shouldHidePartialGridForViewport,
} from './gridViewportController';

test('map viewport controller samples the full viewport through the map projection', () => {
  const points = getMapViewportPoints({
    getCanvas: () => ({ clientWidth: 600, clientHeight: 900 }),
    unproject: ([x, y]) => ({ lng: x / 100, lat: y / 100 }),
  });

  assert.equal(points.length, 9);
  assert.deepEqual(points[0], { lng: 0, lat: 0 });
  assert.deepEqual(points[8], { lng: 3, lat: 4.5 });
});

test('map viewport controller keeps pitch-based render padding in one place', () => {
  assert.equal(getGridRenderPaddingRatio(0), 0.75);
  assert.equal(getGridRenderPaddingRatio(31), 1);
  assert.equal(getGridPrefetchPaddingRatio(0), 0.25);
  assert.equal(getGridPrefetchPaddingRatio(31), 0.35);
});

test('map viewport controller separates visible bounds from padded render bounds', () => {
  const points = [
    { lng: 10, lat: 20 },
    { lng: 11, lat: 21 },
  ];

  const visibleBounds = getVisibleGridBounds(points);
  const prefetchBounds = getGridPrefetchBounds(points, 0);
  const paddedBounds = getPaddedGridBounds(points, 0);

  assert.deepEqual(visibleBounds, [[10, 20], [11, 21]]);
  assert.ok(prefetchBounds[0][0] < visibleBounds[0][0]);
  assert.ok(prefetchBounds[0][0] > paddedBounds[0][0]);
  assert.ok(paddedBounds[0][0] < visibleBounds[0][0]);
  assert.ok(paddedBounds[1][0] > visibleBounds[1][0]);
});

test('map viewport controller identifies partial grid coverage for all-or-none rendering', () => {
  const visibleBounds: [[number, number], [number, number]] = [[0, 0], [2, 2]];
  const partialCell = [{
    geometry: {
      coordinates: [[
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ]],
    },
  }];

  assert.equal(shouldHidePartialGridForViewport(partialCell, visibleBounds), true);
  assert.equal(shouldHidePartialGridForViewport([], visibleBounds), false);
});
