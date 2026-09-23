import { createHash } from 'node:crypto';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import {
  extname,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

import { exportTopographic3dTilesConformanceFixture } from './export-topographic-3d-tiles-conformance-fixture';
import {
  createTopographic3dTilesRendererValidation,
  TOPOGRAPHIC_3D_TILES_RENDERER_REPORT_SCHEMA,
} from '../src/lib/topographic3dTilesRendererValidation';

const VIEWPORT = {
  width: 1280,
  height: 720,
};
const DEFAULT_OUTPUT_DIRECTORY = resolve(
  'output',
  'topographic-3d-tiles-conformance',
);
const RUNTIME_REPORT_FILE_NAME = 'cesium-renderer-runtime.json';
const SCREENSHOT_FILE_NAME = 'cesium-renderer.png';
const VALIDATION_FILE_NAME = 'cesium-renderer-validation.json';
const CESIUM_DIRECTORY = resolve('node_modules', 'cesium', 'Build', 'Cesium');
const SYSTEM_CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const MIME_TYPES: Record<string, string> = {
  '.basis': 'application/octet-stream',
  '.bin': 'application/octet-stream',
  '.css': 'text/css; charset=utf-8',
  '.gltf': 'model/gltf+json',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ktx2': 'image/ktx2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

const HARNESS_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>AGID CesiumJS 3D Tiles renderer verification</title>
  <link rel="stylesheet" href="/cesium/Widgets/widgets.css">
  <style>
    html, body, #cesiumContainer {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: #05131f;
    }
    #status {
      position: fixed;
      z-index: 2;
      top: 12px;
      left: 12px;
      padding: 8px 10px;
      border: 1px solid #78dce8;
      border-radius: 4px;
      color: #f4f7f9;
      background: rgba(5, 19, 31, 0.88);
      font: 12px/1.35 ui-monospace, SFMono-Regular, Consolas, monospace;
    }
  </style>
  <script>window.CESIUM_BASE_URL = "/cesium/";</script>
  <script src="/cesium/Cesium.js"></script>
</head>
<body>
  <div id="cesiumContainer"></div>
  <div id="status">initializing CesiumJS</div>
  <script>
    (function () {
      "use strict";
      var backgroundRgba = [5, 19, 31, 255];
      var state = {
        status: "pending",
        completedAt: null,
        rendererVersion: String(Cesium.VERSION),
        postRenderFrames: 0,
        tileLoadEvents: 0,
        tileVisibleEvents: 0,
        initialTilesLoadedEvents: 0,
        allTilesLoadedEvents: 0,
        pendingRequests: 0,
        tilesProcessing: 0,
        tilesLoaded: false,
        nonBackgroundPixels: 0,
        sampledPixels: 0,
        backgroundRgba: backgroundRgba,
        renderErrors: [],
        tileFailures: [],
        fatalErrors: []
      };
      window.__AGID_RENDERER_SMOKE__ = state;
      var statusElement = document.getElementById("status");

      function messageOf(value) {
        return value && value.message ? String(value.message) : String(value);
      }

      function auditScenePixels(canvas) {
        var auditCanvas = document.createElement("canvas");
        auditCanvas.width = canvas.width;
        auditCanvas.height = canvas.height;
        var context = auditCanvas.getContext("2d", { willReadFrequently: true });
        if (!context) {
          throw new Error("2D pixel-audit context is unavailable.");
        }
        context.drawImage(canvas, 0, 0);
        var pixels = context.getImageData(
          0,
          0,
          auditCanvas.width,
          auditCanvas.height
        ).data;
        var nonBackgroundPixels = 0;
        for (var index = 0; index < pixels.length; index += 4) {
          var differs =
            Math.abs(pixels[index] - backgroundRgba[0]) > 2 ||
            Math.abs(pixels[index + 1] - backgroundRgba[1]) > 2 ||
            Math.abs(pixels[index + 2] - backgroundRgba[2]) > 2 ||
            Math.abs(pixels[index + 3] - backgroundRgba[3]) > 2;
          if (differs) nonBackgroundPixels += 1;
        }
        return {
          nonBackgroundPixels: nonBackgroundPixels,
          sampledPixels: auditCanvas.width * auditCanvas.height
        };
      }

      async function run() {
        var viewer;
        try {
          viewer = new Cesium.Viewer("cesiumContainer", {
            animation: false,
            baseLayer: false,
            baseLayerPicker: false,
            fullscreenButton: false,
            geocoder: false,
            globe: false,
            homeButton: false,
            infoBox: false,
            navigationHelpButton: false,
            projectionPicker: false,
            scene3DOnly: true,
            sceneModePicker: false,
            selectionIndicator: false,
            skyAtmosphere: false,
            skyBox: false,
            timeline: false,
            useBrowserRecommendedResolution: false,
            contextOptions: {
              webgl: {
                preserveDrawingBuffer: true
              }
            }
          });
          viewer.scene.backgroundColor = Cesium.Color.fromBytes(
            backgroundRgba[0],
            backgroundRgba[1],
            backgroundRgba[2],
            backgroundRgba[3]
          );
          viewer.scene.renderError.addEventListener(function (_scene, error) {
            state.renderErrors.push(messageOf(error));
          });
          viewer.scene.postRender.addEventListener(function () {
            state.postRenderFrames += 1;
          });

          var tileset = await Cesium.Cesium3DTileset.fromUrl(
            "/fixture/tileset.json",
            {
              maximumScreenSpaceError: 16,
              dynamicScreenSpaceError: false,
              skipLevelOfDetail: false
            }
          );
          tileset.tileLoad.addEventListener(function () {
            state.tileLoadEvents += 1;
          });
          tileset.tileVisible.addEventListener(function () {
            state.tileVisibleEvents += 1;
          });
          tileset.initialTilesLoaded.addEventListener(function () {
            state.initialTilesLoadedEvents += 1;
          });
          tileset.allTilesLoaded.addEventListener(function () {
            state.allTilesLoadedEvents += 1;
          });
          tileset.loadProgress.addEventListener(function (pending, processing) {
            state.pendingRequests = pending;
            state.tilesProcessing = processing;
          });
          tileset.tileFailed.addEventListener(function (failure) {
            state.tileFailures.push(
              String(failure.url) + ": " + String(failure.message)
            );
          });
          viewer.scene.primitives.add(tileset);
          var centerCartographic = Cesium.Cartographic.fromCartesian(
            tileset.boundingSphere.center
          );
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromRadians(
              centerCartographic.longitude,
              centerCartographic.latitude,
              centerCartographic.height + 100
            ),
            orientation: {
              heading: 0,
              pitch: -Cesium.Math.PI_OVER_TWO,
              roll: 0
            }
          });
          viewer.resize();
          viewer.scene.requestRender();
          statusElement.textContent = "loading generated 3D Tiles fixture";

          var readyFrame = null;
          var deadline = performance.now() + 30000;
          await new Promise(function (resolvePromise, rejectPromise) {
            function poll() {
              state.tilesLoaded = tileset.tilesLoaded;
              var loadedAndVisible =
                state.tilesLoaded &&
                state.tileLoadEvents > 0 &&
                state.tileVisibleEvents > 0 &&
                state.initialTilesLoadedEvents > 0 &&
                state.allTilesLoadedEvents > 0 &&
                state.pendingRequests === 0 &&
                state.tilesProcessing === 0;
              if (loadedAndVisible && readyFrame === null) {
                readyFrame = state.postRenderFrames;
              }
              if (
                readyFrame !== null &&
                state.postRenderFrames >= readyFrame + 2
              ) {
                resolvePromise();
                return;
              }
              if (performance.now() >= deadline) {
                rejectPromise(new Error(
                  "CesiumJS did not reach a loaded and visible idle frame."
                ));
                return;
              }
              viewer.scene.requestRender();
              setTimeout(poll, 50);
            }
            poll();
          });

          var pixelAudit = auditScenePixels(viewer.scene.canvas);
          state.nonBackgroundPixels = pixelAudit.nonBackgroundPixels;
          state.sampledPixels = pixelAudit.sampledPixels;
          state.completedAt = new Date().toISOString();
          state.status = "complete";
          statusElement.textContent =
            "loaded " + state.tileLoadEvents +
            " / visible " + state.tileVisibleEvents +
            " / non-bg pixels " + state.nonBackgroundPixels;
        } catch (error) {
          state.fatalErrors.push(messageOf(error));
          state.completedAt = new Date().toISOString();
          state.status = "failed";
          statusElement.textContent = "blocked: " + messageOf(error);
        }
      }

      run();
    }());
  </script>
</body>
</html>`;

type HarnessState = {
  status: 'pending' | 'complete' | 'failed';
  completedAt: string | null;
  rendererVersion: string;
  postRenderFrames: number;
  tileLoadEvents: number;
  tileVisibleEvents: number;
  initialTilesLoadedEvents: number;
  allTilesLoadedEvents: number;
  pendingRequests: number;
  tilesProcessing: number;
  tilesLoaded: boolean;
  nonBackgroundPixels: number;
  sampledPixels: number;
  backgroundRgba: [number, number, number, number];
  renderErrors: string[];
  tileFailures: string[];
  fatalErrors: string[];
};

function sha256(data: Buffer | string) {
  return `sha256:${createHash('sha256').update(data).digest('hex')}` as const;
}

function requestedFile(
  rootDirectory: string,
  requestedPath: string,
) {
  const normalizedRoot = resolve(rootDirectory);
  const relativePath = decodeURIComponent(requestedPath)
    .replace(/^[/\\]+/, '');
  const candidate = resolve(normalizedRoot, relativePath);
  if (
    candidate !== normalizedRoot
    && !candidate.startsWith(`${normalizedRoot}${sep}`)
  ) {
    return undefined;
  }
  return candidate;
}

function serveFile(
  response: import('node:http').ServerResponse,
  filePath: string,
) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }
  response.writeHead(200, {
    'cache-control': 'no-store',
    'content-type': MIME_TYPES[extname(filePath).toLowerCase()]
      ?? 'application/octet-stream',
  });
  createReadStream(filePath).pipe(response);
}

async function startTilesetServer(tilesetDirectory: string) {
  const server = createServer((request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { allow: 'GET, HEAD' });
      response.end();
      return;
    }
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (url.pathname === '/') {
      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-type': 'text/html; charset=utf-8',
      });
      response.end(request.method === 'HEAD' ? undefined : HARNESS_HTML);
      return;
    }
    if (url.pathname === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }
    const route = url.pathname.startsWith('/cesium/')
      ? {
          root: CESIUM_DIRECTORY,
          path: url.pathname.slice('/cesium/'.length),
        }
      : url.pathname.startsWith('/fixture/')
        ? {
            root: tilesetDirectory,
            path: url.pathname.slice('/fixture/'.length),
          }
        : undefined;
    const filePath = route
      ? requestedFile(route.root, route.path)
      : undefined;
    if (!filePath) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    if (request.method === 'HEAD') {
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        response.writeHead(404);
      } else {
        response.writeHead(200, {
          'content-type': MIME_TYPES[extname(filePath).toLowerCase()]
            ?? 'application/octet-stream',
        });
      }
      response.end();
      return;
    }
    serveFile(response, filePath);
  });
  await new Promise<void>((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise);
    server.listen(0, '127.0.0.1', () => resolvePromise());
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Cesium fixture server did not expose a TCP port.');
  }
  return {
    server,
    url: `http://127.0.0.1:${address.port}/`,
  };
}

function optionalPathArgument(flag: string) {
  const inline = process.argv.find(value => value.startsWith(`${flag}=`));
  if (inline) return resolve(inline.slice(flag.length + 1));
  const index = process.argv.indexOf(flag);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value || value.startsWith('--')) return undefined;
  return resolve(value);
}

export type Topographic3dTilesRendererTarget =
  | {
      kind: 'synthetic-fixture';
      outputDirectory: string;
    }
  | {
      kind: 'retained-package';
      tilesetDirectory: string;
      outputDirectory: string;
    };

export function resolveTopographic3dTilesRendererTarget(input: {
  tilesetDirectory?: string;
  outputDirectory?: string;
}): Topographic3dTilesRendererTarget {
  if (!input.tilesetDirectory) {
    return {
      kind: 'synthetic-fixture',
      outputDirectory: input.outputDirectory ?? DEFAULT_OUTPUT_DIRECTORY,
    };
  }
  const tilesetDirectory = resolve(input.tilesetDirectory);
  const outputDirectory = input.outputDirectory
    ?? resolve('output', 'topographic-3d-tiles-renderer');
  if (outputDirectory === tilesetDirectory || outputDirectory.startsWith(`${tilesetDirectory}${sep}`)) {
    throw new Error('Renderer validation output must be outside the retained tileset package.');
  }
  return {
    kind: 'retained-package',
    tilesetDirectory,
    outputDirectory,
  };
}

function requireNewOutputDirectory(outputDirectory: string) {
  if (existsSync(outputDirectory)) {
    throw new Error(`Renderer validation output directory must be new: ${outputDirectory}`);
  }
  mkdirSync(outputDirectory, { recursive: true });
}

function requireReadableFile(path: string, label: string) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new Error(`${label} must be an existing regular file: ${path}`);
  }
  return readFileSync(path);
}

async function main() {
  if (!existsSync(CESIUM_DIRECTORY)) {
    throw new Error(
      `Pinned CesiumJS build is missing: ${relative(process.cwd(), CESIUM_DIRECTORY)}`,
    );
  }
  const target = resolveTopographic3dTilesRendererTarget({
    tilesetDirectory: optionalPathArgument('--tileset-dir'),
    outputDirectory: optionalPathArgument('--output'),
  });
  const fixture = target.kind === 'synthetic-fixture'
    ? await exportTopographic3dTilesConformanceFixture(target.outputDirectory)
    : null;
  const tilesetDirectory = target.kind === 'synthetic-fixture'
    ? fixture!.outputDirectory
    : target.tilesetDirectory;
  const outputDirectory = target.kind === 'synthetic-fixture'
    ? fixture!.outputDirectory
    : target.outputDirectory;
  if (target.kind === 'retained-package') requireNewOutputDirectory(outputDirectory);
  const tilesetFileName = 'tileset.json';
  const evidenceFileName = 'tileset.evidence.json';
  const tilesetData = requireReadableFile(
    join(tilesetDirectory, tilesetFileName),
    '3D Tiles tileset',
  );
  const evidenceData = requireReadableFile(
    join(tilesetDirectory, evidenceFileName),
    '3D Tiles evidence sidecar',
  );
  const tilesetSha256 = sha256(tilesetData);
  const evidenceSha256 = sha256(evidenceData);
  const { server, url } = await startTilesetServer(tilesetDirectory);
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const launchOptions = (
    process.platform === 'win32' && existsSync(SYSTEM_CHROME)
  )
    ? { headless: true, executablePath: SYSTEM_CHROME }
    : { headless: true };
  const browser = await chromium.launch(launchOptions);
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(
      () => {
        const state = (
          window as typeof window & {
            __AGID_RENDERER_SMOKE__?: HarnessState;
          }
        ).__AGID_RENDERER_SMOKE__;
        return state?.status === 'complete' || state?.status === 'failed';
      },
      undefined,
      { timeout: 40000 },
    );
    const harnessState = await page.evaluate(() => (
      window as typeof window & {
        __AGID_RENDERER_SMOKE__: HarnessState;
      }
    ).__AGID_RENDERER_SMOKE__);
    const screenshotPath = join(outputDirectory, SCREENSHOT_FILE_NAME);
    await page.screenshot({
      path: screenshotPath,
      type: 'png',
      fullPage: false,
    });
    const runtimeReport = {
      schemaVersion: TOPOGRAPHIC_3D_TILES_RENDERER_REPORT_SCHEMA,
      completedAt: harnessState.completedAt,
      renderer: {
        name: 'CesiumJS',
        version: harnessState.rendererVersion,
      },
      browser: {
        engine: 'chromium',
        version: browser.version(),
      },
      view: {
        cameraMode: 'region-center-nadir',
        heightAboveTilesetCenterMeters: 100,
        maximumScreenSpaceErrorPixels: 16,
        dynamicScreenSpaceError: false,
      },
      viewport: {
        ...VIEWPORT,
        devicePixelRatio: 1,
        canvasWidth: await page.locator('#cesiumContainer canvas').evaluate(
          canvas => (canvas as HTMLCanvasElement).width,
        ),
        canvasHeight: await page.locator('#cesiumContainer canvas').evaluate(
          canvas => (canvas as HTMLCanvasElement).height,
        ),
      },
      loading: {
        tilesLoaded: harnessState.tilesLoaded,
        tileLoadEvents: harnessState.tileLoadEvents,
        tileVisibleEvents: harnessState.tileVisibleEvents,
        initialTilesLoadedEvents: harnessState.initialTilesLoadedEvents,
        allTilesLoadedEvents: harnessState.allTilesLoadedEvents,
        pendingRequests: harnessState.pendingRequests,
        tilesProcessing: harnessState.tilesProcessing,
      },
      rendering: {
        postRenderFrames: harnessState.postRenderFrames,
        nonBackgroundPixels: harnessState.nonBackgroundPixels,
        sampledPixels: harnessState.sampledPixels,
        backgroundRgba: harnessState.backgroundRgba,
      },
      failures: {
        renderErrors: [
          ...harnessState.renderErrors,
          ...harnessState.fatalErrors,
        ],
        tileFailures: harnessState.tileFailures,
        pageErrors,
        consoleErrors,
      },
    };
    const runtimeReportData = `${JSON.stringify(runtimeReport, null, 2)}\n`;
    const runtimeReportPath = join(outputDirectory, RUNTIME_REPORT_FILE_NAME);
    writeFileSync(runtimeReportPath, runtimeReportData, { flag: 'wx' });
    if (harnessState.status !== 'complete') {
      console.error(JSON.stringify({
        status: harnessState.status,
        loading: runtimeReport.loading,
        rendering: runtimeReport.rendering,
        failures: runtimeReport.failures,
      }, null, 2));
    }
    const validation = createTopographic3dTilesRendererValidation({
      reportData: runtimeReportData,
      runtimeReportFileName: RUNTIME_REPORT_FILE_NAME,
      runtimeReportSha256: sha256(runtimeReportData),
      screenshotFileName: SCREENSHOT_FILE_NAME,
      screenshotSha256: sha256(readFileSync(screenshotPath)),
      tilesetFileName,
      tilesetSha256,
      internalEvidenceFileName: evidenceFileName,
      internalEvidenceSha256: evidenceSha256,
    });
    const validationData = `${JSON.stringify(validation, null, 2)}\n`;
    const validationPath = join(outputDirectory, VALIDATION_FILE_NAME);
    writeFileSync(validationPath, validationData, { flag: 'wx' });
    console.log(JSON.stringify({
      target: target.kind,
      tilesetDirectory,
      outputDirectory,
      runtimeReportPath,
      screenshotPath,
      validationPath,
      validationSha256: sha256(validationData),
      result: validation.result,
      observations: {
        cesiumVersion: validation.observations.renderer.version,
        browserVersion: validation.observations.browser.version,
        tileLoadEvents: validation.observations.loading.tileLoadEvents,
        tileVisibleEvents: validation.observations.loading.tileVisibleEvents,
        postRenderFrames: validation.observations.rendering.postRenderFrames,
        nonBackgroundPixels:
          validation.observations.rendering.nonBackgroundPixels,
      },
    }, null, 2));
    if (validation.result.status !== 'passed') {
      process.exitCode = 1;
    }
    await context.close();
  } finally {
    await browser.close();
    await new Promise<void>((resolvePromise, rejectPromise) => {
      server.close(error => (
        error ? rejectPromise(error) : resolvePromise()
      ));
    });
  }
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  await main();
}
