import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(here, 'App.tsx'), 'utf8');
const gridHookSource = readFileSync(join(here, 'hooks', 'useAgidGridLayer.ts'), 'utf8');
const source = `${appSource}\n${gridHookSource}`;

test('does not show grid area size metrics in the user map UI', () => {
  assert.doesNotMatch(source, /Grid Area m2/);
  assert.doesNotMatch(source, /gridMetricSummary && isGridVisible/);
});

test('does not enable geography point overlays by default', () => {
  assert.match(source, /const \[isSystematicMode, setIsSystematicMode\] = useState\(\(\) => \{\s*return false;\s*\}\);/);
  assert.match(source, /const \[isRegionalMode, setIsRegionalMode\] = useState\(\(\) => \{\s*return false;\s*\}\);/);
  assert.match(source, /readMapOverlayModeDefault\('agid_nautical_mode'\)/);
  assert.match(source, /readMapOverlayModeDefault\('agid_sea_type_mode'\)/);
  assert.doesNotMatch(source, /'physical', '#10b981'/);
  assert.doesNotMatch(source, /regionalType === 'static' \? '#059669'/);
});

test('does not paint large nautical region polygons over the base map', () => {
  assert.match(source, /'nautical-regions-land-mask-layer'/);
  assert.match(source, /'nautical-regions-outline-layer'/);
  assert.doesNotMatch(source, /'nautical-regions-layer-land-mask'/);
  assert.doesNotMatch(source, /'fill-opacity': isSeaTypeMode \? 0\.3 : 0\.1/);
  assert.doesNotMatch(source, /'fill-color': \['get', 'color'\]/);
  assert.match(source, /'fill-opacity': 0/);
  assert.match(source, /'line-color': '#38bdf8'/);
});

test('keeps a manual search selection stable while the map is panned', () => {
  const dragStartBlock = source.match(/map\.current\.on\('dragstart', \(\) => \{[\s\S]*?\n    \}\);/);

  assert.ok(dragStartBlock, 'dragstart handler should exist');
  assert.doesNotMatch(dragStartBlock[0], /setIsManualSelection\(false\)/);
});

test('map move handlers read the latest manual selection state through refs', () => {
  assert.match(source, /isManualSelectionRef\.current/);
  assert.match(source, /clickedAgidRef\.current/);
  assert.match(source, /updateGridRef\.current\?\.\(/);
});

test('refreshes grid geometry after panning so black lines keep covering the viewport', () => {
  const moveEndBlock = source.match(/map\.current\.on\('moveend', \(\) => \{[\s\S]*?\n    \}\);/);

  assert.ok(moveEndBlock, 'moveend handler should exist');
  assert.match(moveEndBlock[0], /updateGridRef\.current\?\.\(result, selectedResult, 4, true\)/);
});

test('updates red highlights from the same frame as the refreshed black grid', () => {
  assert.match(source, /const syncHighlightLayers = \(frame: GridRenderFrame, showHighlight: boolean = shouldShowHighlight\)/);
  assert.match(source, /renderedGridFrameRef\.current = requestedGridFrame;[\s\S]*?syncHighlightLayers\(requestedGridFrame\);/);
});

test('draws red cell fills from rendered black grid cells below the black line layer', () => {
  assert.match(source, /findContainingGridCellPolygon/);
  assert.match(source, /renderedGridCellsRef\.current = gridCells;/);
  assert.match(source, /ensureSourceAndLayer\(selectedSourceId, 'fill', selectedData, getAgidSelectionFillPaint\(\), \{\}, undefined, `\$\{sourceId\}-layer`\)/);
});

test('keeps the black grid line layer above red cell fills after style refreshes', () => {
  const refreshGridOrderBlock = source.match(/const refreshGridOrder = \(\) => \{[\s\S]*?\n    \};/);

  assert.ok(refreshGridOrderBlock, 'refreshGridOrder should exist');
  assert.match(refreshGridOrderBlock[0], /'selected-cell-layer',\s*'agid-grid-layer',\s*'active-cell-outline-layer'/);
});

test('uses full viewport bounds and clears old partial grids before showing a refreshed grid', () => {
  assert.match(source, /getVisibleGridBounds/);
  assert.match(source, /getMapViewportPoints\(map\.current\)/);
  assert.match(source, /shouldHidePartialGridForViewport\(renderedGridCellsRef\.current, visibleBounds\)/);
  assert.match(source, /clearGridLayers\(\)/);
});

test('checks coverage against visible bounds while prefetching a larger grid for fast panning', () => {
  assert.match(source, /getPaddedGridBounds/);
  assert.match(source, /const visibleBounds = getVisibleGridBounds\(viewportPoints\)/);
  assert.match(source, /const renderBounds = getPaddedGridBounds\(viewportPoints, mapPitch\)/);
  assert.match(source, /shouldHidePartialGridForViewport\(renderedGridCellsRef\.current, visibleBounds\)/);
  assert.match(source, /shouldRefreshGridForViewport\(refreshGrid, renderedGridCellsRef\.current, visibleBounds, pendingGridBoundsRef\.current\)/);
  assert.match(source, /bounds: renderBounds/);
});

test('checks worker grid responses against the current viewport before showing grid layers', () => {
  assert.match(source, /const currentViewportBounds = getVisibleGridBounds\(getCurrentViewportPoints\(\)\)/);
  assert.match(source, /if \(!shouldDisplayGridResponse\(gridCells, currentViewportBounds\)\) \{/);
  assert.match(source, /clearGridLayers\(\);\s*syncHighlightLayers\(requestedGridFrame, false\);/);
  assert.match(source, /updateGridRef\.current\?\.\(activeResult, selectedResult, gridSize, true\)/);
});

test('hides stale partial grid while a covering refresh is already pending', () => {
  assert.match(source, /const shouldHidePartialGrid = shouldHidePartialGridForViewport\(renderedGridCellsRef\.current, visibleBounds\);/);
  assert.match(source, /clearGridLayers\(\{ preservePendingBounds: Boolean\(pendingGridBoundsRef\.current\) \}\);/);
  assert.match(source, /if \(!shouldRefreshGrid\) \{\s*if \(!shouldHidePartialGrid\) syncHighlightLayers\(highlightFrame\);\s*return;\s*\}/);
});

test('tracks pending grid request bounds to avoid replacing in-flight pan updates', () => {
  assert.match(source, /const pendingGridBoundsRef = React\.useRef<\[\[number, number\], \[number, number\]\] \| null>\(null\)/);
  assert.match(source, /pendingGridBoundsRef\.current = renderBounds/);
  assert.match(source, /pendingGridBoundsRef\.current = null/);
});

test('uses what3words-style zoom gating instead of a hard 200m viewport gate', () => {
  assert.doesNotMatch(source, /shouldShowGridForViewport\(viewportPoints\)/);
  assert.match(source, /const shouldShow = shouldShowDisplayGrid\(\{ zoom: gridZoom, isGridVisible, gridOpacityLevel \}\)/);
  assert.match(source, /shouldHidePartialGridForViewport\(renderedGridCellsRef\.current, visibleBounds\)/);
});

test('keeps checking grid coverage inside throttled pan updates', () => {
  const throttledMoveBranch = source.match(/if \(now - lastMoveUpdate < 100\) \{[\s\S]*?return;\s*\}/);

  assert.ok(throttledMoveBranch, 'throttled move branch should exist');
  assert.match(throttledMoveBranch[0], /const selectedResult = clickedAgidRef\.current \|\| undefined;/);
  assert.match(throttledMoveBranch[0], /updateGridRef\.current\?\.\(result, selectedResult, 4, false\)/);
});

test('keeps AGID display click-committed while hover and pan only update the preview square', () => {
  const moveBlock = source.match(/map\.current\.on\('move', \(\) => \{[\s\S]*?\n    \}\);/);
  const mouseMoveBlock = source.match(/map\.current\.on\('mousemove', \(e\) => \{[\s\S]*?\n    \}\);/);
  const clickBlock = source.match(/map\.current\.on\('click', \(e\) => \{[\s\S]*?\n    \}\);/);

  assert.ok(moveBlock, 'move handler should exist');
  assert.ok(mouseMoveBlock, 'mousemove handler should exist');
  assert.ok(clickBlock, 'click handler should exist');
  assert.doesNotMatch(moveBlock[0], /setClickedAgid/);
  assert.doesNotMatch(mouseMoveBlock[0], /setClickedAgid/);
  assert.match(mouseMoveBlock[0], /updateGridRef\.current\?\.\(result, clickedAgidRef\.current \|\| undefined, 4, false\)/);
  assert.match(clickBlock[0], /setClickedAgid\(result\)/);
});

test('draws hover target as a pale pink outline layer without binding it to the AGID label', () => {
  assert.match(source, /getAgidHoverCellFillPaint/);
  assert.match(source, /getAgidHoverCellOutlinePaint/);
  assert.match(source, /ensureSourceAndLayer\(`\$\{activeSourceId\}-outline`, 'line'/);
  assert.doesNotMatch(source, /properties: \{ title: activeResult\.id \}/);
});
