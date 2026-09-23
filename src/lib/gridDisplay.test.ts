import assert from 'node:assert/strict';
import { describe,it } from 'node:test';
import {
ABSOLUTE_GRID_ANCHOR_POINTS,
ABSOLUTE_GRID_ANCHOR_VERSION,
getAbsoluteGridAnchorCell,
getAbsoluteGridAnchorMeters,
getAbsoluteGridAnchorPoint,
getCloseDistanceGridFade,
getDisplayCellSizeMeters,
getDisplayGridStep,
getEffectiveGridOpacityLevel,
getNearestAbsoluteGridAnchorPoint,
getGridRenderRange,
metricSquareCellFromCenter,
regularMetricCellFromPoint,
shouldShowDisplayGrid,
toUndirectedSegmentKey,
} from './gridDisplay';

describe('grid display shared utilities', () => {
  it('keeps display step and meter size in one shared calculation', () => {
    assert.equal(getDisplayGridStep(16), 4);
    assert.equal(getDisplayCellSizeMeters(16), 17.6);
  });

  it('keeps grid render density thresholds explicit', () => {
    assert.equal(getGridRenderRange(14), 40);
    assert.equal(getGridRenderRange(16), 70);
    assert.equal(getGridRenderRange(19), 100);
  });

  it('shows close-distance grid only when the grid switch and opacity allow it', () => {
    assert.equal(shouldShowDisplayGrid({ zoom: 18.25, isGridVisible: true, gridOpacityLevel: 3 }), true);
    assert.equal(shouldShowDisplayGrid({ zoom: 18.25, isGridVisible: false, gridOpacityLevel: 3 }), false);
    assert.equal(shouldShowDisplayGrid({ zoom: 18.25, isGridVisible: true, gridOpacityLevel: 0 }), false);
    assert.equal(getEffectiveGridOpacityLevel({ zoom: 18.25, isGridVisible: true, gridOpacityLevel: 3 }), 3);
    assert.equal(getEffectiveGridOpacityLevel({ zoom: 18.25, isGridVisible: false, gridOpacityLevel: 3 }), 0);
  });

  it('keeps close-distance grid opacity finite when saved opacity is invalid', () => {
    assert.equal(getEffectiveGridOpacityLevel({ zoom: 18.25, isGridVisible: true, gridOpacityLevel: Number.NaN }), 3);
    assert.equal(getEffectiveGridOpacityLevel({ zoom: 18.25, isGridVisible: true, gridOpacityLevel: 999 }), 5);
  });

  it('keeps far zoom grid hidden when the user turned it off', () => {
    assert.equal(shouldShowDisplayGrid({ zoom: 17.24, isGridVisible: false, gridOpacityLevel: 0 }), false);
    assert.equal(getEffectiveGridOpacityLevel({ zoom: 17.24, isGridVisible: false, gridOpacityLevel: 0 }), 0);
  });

  it('hides the close distance grid when zoomed out even if the grid toggle is enabled', () => {
    assert.equal(shouldShowDisplayGrid({ zoom: 16.5, isGridVisible: true, gridOpacityLevel: 5 }), false);
    assert.equal(getEffectiveGridOpacityLevel({ zoom: 16.5, isGridVisible: true, gridOpacityLevel: 5 }), 0);
  });

  it('fades the grid in over a narrow what3words-style close zoom band', () => {
    assert.equal(getCloseDistanceGridFade(17.25), 0);
    assert.equal(getCloseDistanceGridFade(17.75), 0.5);
    assert.equal(getCloseDistanceGridFade(18.25), 1);
  });

  it('uses one key for the same segment in either direction', () => {
    const a = [139.7671, 35.6812];
    const b = [139.7672, 35.6813];

    assert.equal(toUndirectedSegmentKey(a, b), toUndirectedSegmentKey(b, a));
  });

  it('creates right-angle metric display cells', () => {
    const cell = metricSquareCellFromCenter(35.6812, 139.7671, getDisplayCellSizeMeters(16));

    assert.equal(cell.length, 5);
    assert.equal(cell[0][1], cell[1][1]);
    assert.equal(cell[1][0], cell[2][0]);
    assert.equal(cell[2][1], cell[3][1]);
    assert.equal(cell[3][0], cell[0][0]);
  });

  it('anchors the display grid to Null Island, the equator, and the prime meridian', () => {
    const cell = regularMetricCellFromPoint(0.000001, 0.000001, 18);

    assert.equal(cell[0][0], 0);
    assert.equal(cell[0][1], 0);
  });

  it('defines absolute anchor points for global grid stability', () => {
    const ids = new Set(ABSOLUTE_GRID_ANCHOR_POINTS.map(anchor => anchor.id));

    assert.equal(ABSOLUTE_GRID_ANCHOR_VERSION, 'agid-grid-anchors-v1');
    assert.ok(ABSOLUTE_GRID_ANCHOR_POINTS.length >= 8);
    assert.ok(ids.has('null-island'));
    assert.ok(ids.has('equator-east-face'));
    assert.ok(ids.has('antimeridian-face'));
    assert.ok(ids.has('equator-west-face'));
    assert.ok(ids.has('north-pole-face'));
    assert.ok(ids.has('south-pole-face'));
    assert.ok(ids.has('web-mercator-north-limit'));
    assert.ok(ids.has('web-mercator-south-limit'));
  });

  it('keeps absolute anchor points projectable into finite grid meters', () => {
    for (const anchor of ABSOLUTE_GRID_ANCHOR_POINTS) {
      const meters = getAbsoluteGridAnchorMeters(anchor);
      assert.ok(Number.isFinite(meters.x), `${anchor.id} x should be finite`);
      assert.ok(Number.isFinite(meters.y), `${anchor.id} y should be finite`);
    }

    const origin = getAbsoluteGridAnchorPoint('null-island');
    assert.ok(origin);
    assert.deepEqual(getAbsoluteGridAnchorCell(origin, 18), {
      anchorId: 'null-island',
      col: 0,
      row: 0,
      step: 1,
      cellMeters: 4.4,
    });
  });

  it('selects the nearest absolute anchor for seams, face centers, and polar render limits', () => {
    assert.equal(getNearestAbsoluteGridAnchorPoint(0.1, 0.1).id, 'null-island');
    assert.equal(getNearestAbsoluteGridAnchorPoint(0.1, 90.1).id, 'equator-east-face');
    assert.equal(getNearestAbsoluteGridAnchorPoint(0.1, 179.9).id, 'antimeridian-face');
    assert.equal(getNearestAbsoluteGridAnchorPoint(0.1, -90.1).id, 'equator-west-face');
    assert.equal(getNearestAbsoluteGridAnchorPoint(90, 25).id, 'north-pole-face');
    assert.equal(getNearestAbsoluteGridAnchorPoint(-90, -25).id, 'south-pole-face');
    assert.equal(getNearestAbsoluteGridAnchorPoint(85.05112878, 0).id, 'web-mercator-north-limit');
    assert.equal(getNearestAbsoluteGridAnchorPoint(-85.05112878, 0).id, 'web-mercator-south-limit');
  });
});
