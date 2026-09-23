import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname,join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'GridCanvasOverlay.tsx'), 'utf8');

test('grid canvas overlay only draws when generated cells cover the visible viewport', () => {
  assert.match(source, /const visibleBounds = getVisibleGridBounds\(viewportPoints\)/);
  assert.match(source, /const renderBounds = getPaddedGridBounds\(viewportPoints, mapInstance\.getPitch\(\)\)/);
  assert.match(source, /if \(!shouldDisplayGridResponse\(features\.gridCells, visibleBounds\)\) return;/);
});

test('grid canvas overlay paints the selected red cell before black grid lines', () => {
  assert.match(source, /findContainingGridCellPolygon\(features\.gridCells, selectedResult\)/);
  assert.ok(source.indexOf("surface.ctx.fillStyle = 'rgba(239, 68, 68, 0.45)'") < source.indexOf('surface.ctx.strokeStyle'));
});

test('grid canvas overlay redraws on map movement and zoom for fast recovery', () => {
  assert.match(source, /'move', 'moveend', 'zoom', 'zoomend'/);
  assert.match(source, /requestAnimationFrame\(\(\) => draw\(scheduledRevision\)\)/);
  assert.match(source, /data-testid="agid-grid-canvas-overlay"/);
  assert.match(source, /pointer-events-none/);
});

test('grid canvas overlay clears stale pixels before scheduling movement redraws', () => {
  assert.match(source, /ctx\.setTransform\(1, 0, 0, 1, 0, 0\)/);
  assert.match(source, /ctx\.clearRect\(0, 0, canvas\.width, canvas\.height\)/);
  assert.match(source, /const scheduleDraw = \(\) => \{\s+drawRevision \+= 1;\s+clearCanvas\(\);/s);
});

test('grid canvas overlay ignores stale animation frames after map movement', () => {
  assert.match(source, /let drawRevision = 0;/);
  assert.match(source, /const draw = \(revision: number\) => \{\s+if \(revision !== drawRevision\) return;/s);
  assert.match(source, /const scheduledRevision = drawRevision;/);
  assert.match(source, /drawRevision \+= 1;\s+if \(animationFrame\) cancelAnimationFrame\(animationFrame\);/s);
});
