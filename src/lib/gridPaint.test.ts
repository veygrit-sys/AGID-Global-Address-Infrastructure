import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
getAgidGridCellFillPaint,
getAgidGridFocusFillPaint,
getAgidGridLinePaint,
getAgidHoverCellFillPaint,
getAgidHoverCellOutlinePaint,
getAgidSelectionFillPaint,
} from './gridPaint';

test('renders unselected AGID grid cells with no fill', () => {
  assert.deepEqual(
    getAgidGridCellFillPaint({
      isSatelliteOrDark: false,
      opacityMultiplier: 1,
    }),
    {
      'fill-color': '#475569',
      'fill-opacity': 0,
    }
  );

  assert.deepEqual(
    getAgidGridFocusFillPaint({
      isSatelliteOrDark: true,
      opacityMultiplier: 1,
    }),
    {
      'fill-color': '#94a3b8',
      'fill-opacity': 0,
    }
  );
});

test('keeps selected AGID cells as a red translucent fill', () => {
  assert.deepEqual(getAgidSelectionFillPaint(), {
    'fill-color': '#ef4444',
    'fill-opacity': 0.45,
  });
});

test('renders hover preview cells as a thin pale pink square without AGID text', () => {
  assert.deepEqual(getAgidHoverCellFillPaint(), {
    'fill-color': '#fdf2f8',
    'fill-opacity': 0.08,
    'fill-outline-color': 'rgba(249, 168, 212, 0)',
  });
  assert.deepEqual(getAgidHoverCellOutlinePaint(), {
    'line-color': '#f9a8d4',
    'line-width': 1.25,
    'line-opacity': 0.88,
  });
});

test('uses black regular grid lines for close w3w-style display on light maps', () => {
  assert.equal(
    getAgidGridLinePaint({
      isSatelliteOrDark: false,
      isCloseDistanceGrid: true,
    })['line-color'],
    '#111827',
  );
});
