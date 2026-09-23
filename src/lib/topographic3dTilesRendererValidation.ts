export const TOPOGRAPHIC_3D_TILES_RENDERER_REPORT_SCHEMA =
  'agid-topographic-3d-tiles-renderer-report-v0.1';
export const TOPOGRAPHIC_3D_TILES_RENDERER_VALIDATION_SCHEMA =
  'agid-topographic-3d-tiles-renderer-validation-v0.1';
export const TOPOGRAPHIC_3D_TILES_RENDERER_NAME = 'CesiumJS';
export const TOPOGRAPHIC_3D_TILES_RENDERER_VERSION = '1.132';
export const TOPOGRAPHIC_3D_TILES_RENDERER_PACKAGE_VERSION = '1.132.0';
export const TOPOGRAPHIC_3D_TILES_RENDERER_PACKAGE =
  'https://www.npmjs.com/package/cesium/v/1.132.0';
export const TOPOGRAPHIC_3D_TILES_RENDERER_LICENSE = 'Apache-2.0';

const SHA256_PATTERN = /^sha256:[a-f0-9]{64}$/;

export type Topographic3dTilesRendererReport = {
  schemaVersion: typeof TOPOGRAPHIC_3D_TILES_RENDERER_REPORT_SCHEMA;
  completedAt: string;
  renderer: {
    name: typeof TOPOGRAPHIC_3D_TILES_RENDERER_NAME;
    version: string;
  };
  browser: {
    engine: 'chromium';
    version: string;
  };
  view: {
    cameraMode: 'region-center-nadir';
    heightAboveTilesetCenterMeters: number;
    maximumScreenSpaceErrorPixels: number;
    dynamicScreenSpaceError: false;
  };
  viewport: {
    width: number;
    height: number;
    devicePixelRatio: number;
    canvasWidth: number;
    canvasHeight: number;
  };
  loading: {
    tilesLoaded: boolean;
    tileLoadEvents: number;
    tileVisibleEvents: number;
    initialTilesLoadedEvents: number;
    allTilesLoadedEvents: number;
    pendingRequests: number;
    tilesProcessing: number;
  };
  rendering: {
    postRenderFrames: number;
    nonBackgroundPixels: number;
    sampledPixels: number;
    backgroundRgba: [number, number, number, number];
  };
  failures: {
    renderErrors: string[];
    tileFailures: string[];
    pageErrors: string[];
    consoleErrors: string[];
  };
};

export type Topographic3dTilesRendererValidation = {
  schemaVersion: typeof TOPOGRAPHIC_3D_TILES_RENDERER_VALIDATION_SCHEMA;
  renderer: {
      name: typeof TOPOGRAPHIC_3D_TILES_RENDERER_NAME;
      version: typeof TOPOGRAPHIC_3D_TILES_RENDERER_VERSION;
      packageVersion: typeof TOPOGRAPHIC_3D_TILES_RENDERER_PACKAGE_VERSION;
    packageUrl: typeof TOPOGRAPHIC_3D_TILES_RENDERER_PACKAGE;
    licenseId: typeof TOPOGRAPHIC_3D_TILES_RENDERER_LICENSE;
  };
  validatedAt: string;
  input: {
    tilesetFileName: string;
    tilesetSha256: `sha256:${string}`;
    internalEvidenceFileName: string;
    internalEvidenceSha256: `sha256:${string}`;
  };
  artifacts: {
    runtimeReportFileName: string;
    runtimeReportSha256: `sha256:${string}`;
    screenshotFileName: string;
    screenshotSha256: `sha256:${string}`;
  };
  observations: Topographic3dTilesRendererReport;
  result: {
    status: 'passed' | 'blocked';
    policy: 'loaded-visible-nonblank-zero-runtime-errors';
    issueCodes: string[];
  };
  nonClaims: string[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function requireObject(
  parent: Record<string, unknown>,
  field: string,
): Record<string, unknown> {
  const value = parent[field];
  if (!isObject(value)) {
    throw new Error(`Cesium renderer report ${field} must be an object.`);
  }
  return value;
}

function requireString(
  parent: Record<string, unknown>,
  field: string,
): string {
  const value = parent[field];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Cesium renderer report ${field} must be a nonempty string.`);
  }
  return value;
}

function requireBoolean(
  parent: Record<string, unknown>,
  field: string,
): boolean {
  const value = parent[field];
  if (typeof value !== 'boolean') {
    throw new Error(`Cesium renderer report ${field} must be boolean.`);
  }
  return value;
}

function requireCount(
  parent: Record<string, unknown>,
  field: string,
): number {
  const value = parent[field];
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new Error(
      `Cesium renderer report ${field} must be a nonnegative integer.`,
    );
  }
  return Number(value);
}

function requirePositiveCount(
  parent: Record<string, unknown>,
  field: string,
): number {
  const value = requireCount(parent, field);
  if (value === 0) {
    throw new Error(`Cesium renderer report ${field} must be positive.`);
  }
  return value;
}

function requireStringArray(
  parent: Record<string, unknown>,
  field: string,
): string[] {
  const value = parent[field];
  if (
    !Array.isArray(value)
    || value.some(item => typeof item !== 'string')
  ) {
    throw new Error(`Cesium renderer report ${field} must be a string array.`);
  }
  return [...value];
}

function requireDigest(value: string, field: string): `sha256:${string}` {
  if (!SHA256_PATTERN.test(value)) {
    throw new Error(`${field} must be a lowercase SHA-256 digest.`);
  }
  return value as `sha256:${string}`;
}

function parseBackgroundRgba(value: unknown): [number, number, number, number] {
  if (
    !Array.isArray(value)
    || value.length !== 4
    || value.some(channel => (
      !Number.isSafeInteger(channel)
      || Number(channel) < 0
      || Number(channel) > 255
    ))
  ) {
    throw new Error(
      'Cesium renderer report backgroundRgba must contain four byte values.',
    );
  }
  return value as [number, number, number, number];
}

export function parseTopographic3dTilesRendererReport(
  reportData: string,
): Topographic3dTilesRendererReport {
  let value: unknown;
  try {
    value = JSON.parse(reportData);
  } catch {
    throw new Error('Cesium renderer report must be valid JSON.');
  }
  if (!isObject(value)) {
    throw new Error('Cesium renderer report must be an object.');
  }
  if (value.schemaVersion !== TOPOGRAPHIC_3D_TILES_RENDERER_REPORT_SCHEMA) {
    throw new Error('Cesium renderer report schema version is unsupported.');
  }
  const completedAt = requireString(value, 'completedAt');
  if (!Number.isFinite(Date.parse(completedAt))) {
    throw new Error('Cesium renderer report completedAt must be an ISO timestamp.');
  }
  const renderer = requireObject(value, 'renderer');
  if (renderer.name !== TOPOGRAPHIC_3D_TILES_RENDERER_NAME) {
    throw new Error('Cesium renderer report renderer name is unsupported.');
  }
  const browser = requireObject(value, 'browser');
  if (browser.engine !== 'chromium') {
    throw new Error('Cesium renderer report browser engine must be chromium.');
  }
  const viewport = requireObject(value, 'viewport');
  const view = requireObject(value, 'view');
  if (view.cameraMode !== 'region-center-nadir') {
    throw new Error('Cesium renderer report cameraMode is unsupported.');
  }
  if (view.dynamicScreenSpaceError !== false) {
    throw new Error(
      'Cesium renderer report dynamicScreenSpaceError must be false.',
    );
  }
  const loading = requireObject(value, 'loading');
  const rendering = requireObject(value, 'rendering');
  const failures = requireObject(value, 'failures');
  const sampledPixels = requireCount(rendering, 'sampledPixels');
  const nonBackgroundPixels = requireCount(rendering, 'nonBackgroundPixels');
  if (nonBackgroundPixels > sampledPixels) {
    throw new Error(
      'Cesium renderer report nonBackgroundPixels cannot exceed sampledPixels.',
    );
  }
  return {
    schemaVersion: TOPOGRAPHIC_3D_TILES_RENDERER_REPORT_SCHEMA,
    completedAt: new Date(completedAt).toISOString(),
    renderer: {
      name: TOPOGRAPHIC_3D_TILES_RENDERER_NAME,
      version: requireString(renderer, 'version'),
    },
    browser: {
      engine: 'chromium',
      version: requireString(browser, 'version'),
    },
    view: {
      cameraMode: 'region-center-nadir',
      heightAboveTilesetCenterMeters: requirePositiveCount(
        view,
        'heightAboveTilesetCenterMeters',
      ),
      maximumScreenSpaceErrorPixels: requirePositiveCount(
        view,
        'maximumScreenSpaceErrorPixels',
      ),
      dynamicScreenSpaceError: false,
    },
    viewport: {
      width: requirePositiveCount(viewport, 'width'),
      height: requirePositiveCount(viewport, 'height'),
      devicePixelRatio: requirePositiveCount(viewport, 'devicePixelRatio'),
      canvasWidth: requirePositiveCount(viewport, 'canvasWidth'),
      canvasHeight: requirePositiveCount(viewport, 'canvasHeight'),
    },
    loading: {
      tilesLoaded: requireBoolean(loading, 'tilesLoaded'),
      tileLoadEvents: requireCount(loading, 'tileLoadEvents'),
      tileVisibleEvents: requireCount(loading, 'tileVisibleEvents'),
      initialTilesLoadedEvents: requireCount(
        loading,
        'initialTilesLoadedEvents',
      ),
      allTilesLoadedEvents: requireCount(loading, 'allTilesLoadedEvents'),
      pendingRequests: requireCount(loading, 'pendingRequests'),
      tilesProcessing: requireCount(loading, 'tilesProcessing'),
    },
    rendering: {
      postRenderFrames: requireCount(rendering, 'postRenderFrames'),
      nonBackgroundPixels,
      sampledPixels,
      backgroundRgba: parseBackgroundRgba(rendering.backgroundRgba),
    },
    failures: {
      renderErrors: requireStringArray(failures, 'renderErrors'),
      tileFailures: requireStringArray(failures, 'tileFailures'),
      pageErrors: requireStringArray(failures, 'pageErrors'),
      consoleErrors: requireStringArray(failures, 'consoleErrors'),
    },
  };
}

export function createTopographic3dTilesRendererValidation(input: {
  reportData: string;
  runtimeReportFileName: string;
  runtimeReportSha256: string;
  screenshotFileName: string;
  screenshotSha256: string;
  tilesetFileName: string;
  tilesetSha256: string;
  internalEvidenceFileName: string;
  internalEvidenceSha256: string;
}): Topographic3dTilesRendererValidation {
  const report = parseTopographic3dTilesRendererReport(input.reportData);
  const issueCodes: string[] = [];
  if (report.renderer.version !== TOPOGRAPHIC_3D_TILES_RENDERER_VERSION) {
    issueCodes.push('renderer-version-mismatch');
  }
  if (
    report.view.heightAboveTilesetCenterMeters !== 100
    || report.view.maximumScreenSpaceErrorPixels !== 16
  ) {
    issueCodes.push('renderer-view-contract-mismatch');
  }
  if (!report.loading.tilesLoaded) issueCodes.push('tiles-not-loaded');
  if (report.loading.tileLoadEvents === 0) issueCodes.push('no-tile-load-event');
  if (report.loading.tileLoadEvents < 2) {
    issueCodes.push('incomplete-fixture-lod-load');
  }
  if (report.loading.tileVisibleEvents === 0) {
    issueCodes.push('no-tile-visible-event');
  }
  if (report.loading.initialTilesLoadedEvents === 0) {
    issueCodes.push('initial-view-not-loaded');
  }
  if (report.loading.allTilesLoadedEvents === 0) {
    issueCodes.push('view-sse-not-satisfied');
  }
  if (
    report.loading.pendingRequests !== 0
    || report.loading.tilesProcessing !== 0
  ) {
    issueCodes.push('tile-loading-not-idle');
  }
  if (report.rendering.postRenderFrames < 2) {
    issueCodes.push('insufficient-post-render-frames');
  }
  if (report.rendering.sampledPixels === 0) {
    issueCodes.push('pixel-audit-not-completed');
  }
  if (report.rendering.nonBackgroundPixels < 1000) {
    issueCodes.push('blank-scene-canvas');
  }
  if (
    report.viewport.canvasWidth !== report.viewport.width
    || report.viewport.canvasHeight !== report.viewport.height
  ) {
    issueCodes.push('canvas-viewport-size-mismatch');
  }
  if (Object.values(report.failures).some(errors => errors.length > 0)) {
    issueCodes.push('runtime-errors-present');
  }
  return {
    schemaVersion: TOPOGRAPHIC_3D_TILES_RENDERER_VALIDATION_SCHEMA,
    renderer: {
      name: TOPOGRAPHIC_3D_TILES_RENDERER_NAME,
      version: TOPOGRAPHIC_3D_TILES_RENDERER_VERSION,
      packageVersion: TOPOGRAPHIC_3D_TILES_RENDERER_PACKAGE_VERSION,
      packageUrl: TOPOGRAPHIC_3D_TILES_RENDERER_PACKAGE,
      licenseId: TOPOGRAPHIC_3D_TILES_RENDERER_LICENSE,
    },
    validatedAt: report.completedAt,
    input: {
      tilesetFileName: input.tilesetFileName,
      tilesetSha256: requireDigest(input.tilesetSha256, 'tilesetSha256'),
      internalEvidenceFileName: input.internalEvidenceFileName,
      internalEvidenceSha256: requireDigest(
        input.internalEvidenceSha256,
        'internalEvidenceSha256',
      ),
    },
    artifacts: {
      runtimeReportFileName: input.runtimeReportFileName,
      runtimeReportSha256: requireDigest(
        input.runtimeReportSha256,
        'runtimeReportSha256',
      ),
      screenshotFileName: input.screenshotFileName,
      screenshotSha256: requireDigest(
        input.screenshotSha256,
        'screenshotSha256',
      ),
    },
    observations: report,
    result: {
      status: issueCodes.length === 0 ? 'passed' : 'blocked',
      policy: 'loaded-visible-nonblank-zero-runtime-errors',
      issueCodes,
    },
    nonClaims: [
      'The generated synthetic fixture is not evidence of production-scale tileset performance.',
      'A CesiumJS runtime pass does not replace OGC schema or external validator conformance.',
      'The pixel audit proves only that the scene canvas differs from its configured background.',
      'The test does not prove survey accuracy, source coverage, or device-wide renderer compatibility.',
    ],
  };
}
