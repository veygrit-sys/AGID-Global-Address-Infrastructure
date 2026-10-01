import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
getAgidGridCellFillPaint,
getAgidGridFocusFillPaint,
getAgidGridLinePaint,
getAgidGridLineStyle,
getAgidHoverCellFillPaint,
getAgidHoverCellOutlinePaint,
getAgidSelectionFillPaint,
getAgidSelectionHaloPaint,
getAgidSelectionOutlinePaint,
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

test('renders selected AGID cells with only a dark outline', () => {
  assert.deepEqual(getAgidSelectionFillPaint(), {
    'fill-color': '#0f172a',
    'fill-opacity': 0,
  });
  assert.deepEqual(getAgidSelectionHaloPaint(), {
    'line-color': '#ffffff',
    'line-width': 0,
    'line-opacity': 0,
  });
  assert.deepEqual(getAgidSelectionOutlinePaint(), {
    'line-color': '#0f172a',
    'line-width': 2.25,
    'line-opacity': 1,
  });
});

test('renders hover preview cells as a subtle red square without AGID text', () => {
  assert.deepEqual(getAgidHoverCellFillPaint(), {
    'fill-color': '#ef4444',
    'fill-opacity': 0.04,
    'fill-outline-color': 'rgba(239, 68, 68, 0)',
  });
  assert.deepEqual(getAgidHoverCellOutlinePaint(), {
    'line-color': '#ef4444',
    'line-width': 0.85,
    'line-opacity': 0.55,
  });
});

test('uses neutral regular grid lines for close w3w-style display on light maps', () => {
  assert.equal(
    getAgidGridLinePaint({
      isSatelliteOrDark: false,
      isCloseDistanceGrid: true,
    })['line-color'],
    '#777777',
  );
});

test('adapts thin grid line contrast to the basemap and caps opacity', () => {
  assert.deepEqual(
    getAgidGridLineStyle({
      isSatelliteOrDark: false,
      isCloseDistanceGrid: true,
      zoom: 17.25,
      opacityMultiplier: 1,
    }),
    {
      'line-color': '#777777',
      'line-width': 0.5,
      'line-opacity': 0.34,
    },
  );

  assert.deepEqual(
    getAgidGridLineStyle({
      isSatelliteOrDark: true,
      isCloseDistanceGrid: true,
      zoom: 20,
      opacityMultiplier: 10,
    }),
    {
      'line-color': '#f1f5f9',
      'line-width': 0.85,
      'line-opacity': 0.55,
    },
  );
});
