import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTopographic3dTilesRendererValidation,
  parseTopographic3dTilesRendererReport,
  TOPOGRAPHIC_3D_TILES_RENDERER_REPORT_SCHEMA,
} from './topographic3dTilesRendererValidation';

const digest = `sha256:${'a'.repeat(64)}`;

function passingReport() {
  return {
    schemaVersion: TOPOGRAPHIC_3D_TILES_RENDERER_REPORT_SCHEMA,
    completedAt: '2026-07-27T14:00:00.000Z',
    renderer: {
      name: 'CesiumJS',
      version: '1.132',
    },
    browser: {
      engine: 'chromium',
      version: '140.0.0.0',
    },
    view: {
      cameraMode: 'region-center-nadir',
      heightAboveTilesetCenterMeters: 100,
      maximumScreenSpaceErrorPixels: 16,
      dynamicScreenSpaceError: false,
    },
    viewport: {
      width: 1280,
      height: 720,
      devicePixelRatio: 1,
      canvasWidth: 1280,
      canvasHeight: 720,
    },
    loading: {
      tilesLoaded: true,
      tileLoadEvents: 2,
      tileVisibleEvents: 4,
      initialTilesLoadedEvents: 1,
      allTilesLoadedEvents: 1,
      pendingRequests: 0,
      tilesProcessing: 0,
    },
    rendering: {
      postRenderFrames: 8,
      nonBackgroundPixels: 1200,
      sampledPixels: 921600,
      backgroundRgba: [5, 19, 31, 255],
    },
    failures: {
      renderErrors: [],
      tileFailures: [],
      pageErrors: [],
      consoleErrors: [],
    },
  };
}

function createValidation(report = passingReport()) {
  const reportData = JSON.stringify(report);
  return createTopographic3dTilesRendererValidation({
    reportData,
    runtimeReportFileName: 'cesium-renderer-runtime.json',
    runtimeReportSha256: digest,
    screenshotFileName: 'cesium-renderer.png',
    screenshotSha256: digest,
    tilesetFileName: 'tileset.json',
    tilesetSha256: digest,
    internalEvidenceFileName: 'tileset.evidence.json',
    internalEvidenceSha256: digest,
  });
}

test('renderer report produces a digest-bound passing validation', () => {
  const validation = createValidation();

  assert.equal(validation.renderer.version, '1.132');
  assert.equal(validation.renderer.packageVersion, '1.132.0');
  assert.equal(validation.renderer.licenseId, 'Apache-2.0');
  assert.equal(validation.observations.rendering.nonBackgroundPixels, 1200);
  assert.deepEqual(validation.result, {
    status: 'passed',
    policy: 'loaded-visible-nonblank-zero-runtime-errors',
    issueCodes: [],
  });
});

test('runtime load, pixel, and error failures block the renderer gate', () => {
  const report = passingReport();
  report.renderer.version = '1.133.0';
  report.loading.tilesLoaded = false;
  report.loading.tileVisibleEvents = 0;
  report.rendering.nonBackgroundPixels = 0;
  report.rendering.sampledPixels = 0;
  report.failures.renderErrors.push('WebGL render failed');

  const validation = createValidation(report);

  assert.equal(validation.result.status, 'blocked');
  assert.deepEqual(validation.result.issueCodes, [
    'renderer-version-mismatch',
    'tiles-not-loaded',
    'no-tile-visible-event',
    'pixel-audit-not-completed',
    'blank-scene-canvas',
    'runtime-errors-present',
  ]);
});

test('renderer report rejects malformed dimensions and pixel counts', () => {
  const malformed = passingReport();
  malformed.viewport.width = 0;
  assert.throws(
    () => parseTopographic3dTilesRendererReport(JSON.stringify(malformed)),
    /width must be positive/,
  );

  const impossible = passingReport();
  impossible.rendering.nonBackgroundPixels =
    impossible.rendering.sampledPixels + 1;
  assert.throws(
    () => parseTopographic3dTilesRendererReport(JSON.stringify(impossible)),
    /cannot exceed/,
  );
});
