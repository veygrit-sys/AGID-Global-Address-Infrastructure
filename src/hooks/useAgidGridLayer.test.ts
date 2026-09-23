import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./useAgidGridLayer.ts', import.meta.url), 'utf8');

test('useAgidGridLayer enforces all-or-nothing viewport coverage', () => {
  assert.match(source, /shouldHidePartialGridForViewport/);
  assert.match(source, /clearGridLayers\(\{ preservePendingBounds: Boolean\(pendingGridBoundsRef\.current\) \}\)/);
  assert.match(source, /shouldDisplayGridResponse\(gridCells, currentViewportBounds\)/);
  assert.match(source, /gridCellsCoverBounds\(renderedGridCellsRef\.current, currentViewportBounds\)/);
});

test('useAgidGridLayer hides selected highlights when the grid is not fully visible', () => {
  assert.match(source, /syncHighlightLayers\(currentGridFrame, false\)/);
  assert.match(source, /syncHighlightLayers\(requestedGridFrame, false\)/);
});
