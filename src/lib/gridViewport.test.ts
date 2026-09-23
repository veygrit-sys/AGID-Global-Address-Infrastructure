import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
getViewportGridBounds,
getViewportSamplePixelCoordinates,
getViewportSpanMeters,
shouldShowGridForViewport,
} from './gridViewport';

function closeTo(actual: number, expected: number, epsilon = 1e-12) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} !== ${expected}`);
}

test('builds padded grid bounds from all visible viewport corners', () => {
  const bounds = getViewportGridBounds([
    { lng: 139.764, lat: 35.686 },
    { lng: 139.772, lat: 35.686 },
    { lng: 139.772, lat: 35.678 },
    { lng: 139.764, lat: 35.678 },
  ], 0.5);

  closeTo(bounds[0][0], 139.76);
  closeTo(bounds[0][1], 35.674);
  closeTo(bounds[1][0], 139.776);
  closeTo(bounds[1][1], 35.69);
});

test('samples corners, edge midpoints, and center so viewport grid bounds cover the full rendered map', () => {
  assert.deepEqual(getViewportSamplePixelCoordinates(600, 900), [
    [0, 0],
    [600, 0],
    [600, 900],
    [0, 900],
    [300, 0],
    [600, 450],
    [300, 900],
    [0, 450],
    [300, 450],
  ]);
});

test('uses what3words-style zoom gating by default instead of a hard 200m viewport gate', () => {
  const smallViewport = [
    { lng: 0, lat: 0 },
    { lng: 0.001, lat: 0 },
    { lng: 0.001, lat: 0.001 },
    { lng: 0, lat: 0.001 },
  ];
  const wideViewport = [
    { lng: 0, lat: 0 },
    { lng: 0.002, lat: 0 },
    { lng: 0.002, lat: 0.001 },
    { lng: 0, lat: 0.001 },
  ];
  const tallViewport = [
    { lng: 0, lat: 0 },
    { lng: 0.001, lat: 0 },
    { lng: 0.001, lat: 0.002 },
    { lng: 0, lat: 0.002 },
  ];

  const smallSpan = getViewportSpanMeters(smallViewport);

  assert.ok(smallSpan.widthMeters < 200);
  assert.ok(smallSpan.heightMeters < 200);
  assert.equal(shouldShowGridForViewport(smallViewport), true);
  assert.equal(shouldShowGridForViewport(wideViewport), true);
  assert.equal(shouldShowGridForViewport(tallViewport), true);
  assert.equal(shouldShowGridForViewport(wideViewport, 200), false);
});
