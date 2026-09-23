export const APPLE_COMPATIBILITY_VERSION = 'apple-compatibility-v1';

export type AppleCompatibilitySeverity = 'pass' | 'warn' | 'fail';

export type AppleCompatibilityCheck = {
  id: string;
  label: string;
  severity: AppleCompatibilitySeverity;
  message: string;
  evidence: string[];
  remediation: string;
};

export type AppleCompatibilityReportStatus = 'ready' | 'attention' | 'blocked';

export type AppleCompatibilityFile = {
  path: string;
  content: string;
};

export type AppleCompatibilityInput = {
  htmlFiles?: AppleCompatibilityFile[];
  cssFiles?: AppleCompatibilityFile[];
  sourceFiles?: AppleCompatibilityFile[];
  viteConfigSource?: string;
};

export type AppleCompatibilityReport = {
  version: string;
  status: AppleCompatibilityReportStatus;
  checks: AppleCompatibilityCheck[];
  summary: {
    pass: number;
    warn: number;
    fail: number;
  };
};

function makeCheck(
  id: string,
  label: string,
  severity: AppleCompatibilitySeverity,
  message: string,
  evidence: string[],
  remediation: string,
): AppleCompatibilityCheck {
  return { id, label, severity, message, evidence, remediation };
}

function getHtml(htmlFiles: AppleCompatibilityFile[], fileName: string) {
  return htmlFiles.find(file => file.path.replace(/\\/g, '/').endsWith(fileName))?.content ?? '';
}

function checkApplePwaMeta(htmlFiles: AppleCompatibilityFile[]): AppleCompatibilityCheck {
  const indexHtml = getHtml(htmlFiles, 'index.html');
  const requiredPatterns: Array<[string, RegExp]> = [
    ['viewport-fit=cover', /name=["']viewport["'][^>]+viewport-fit=cover/i],
    ['apple-mobile-web-app-capable', /name=["']apple-mobile-web-app-capable["'][^>]+content=["']yes["']/i],
    ['apple-mobile-web-app-status-bar-style', /name=["']apple-mobile-web-app-status-bar-style["']/i],
    ['apple-mobile-web-app-title', /name=["']apple-mobile-web-app-title["']/i],
    ['apple-touch-icon', /rel=["']apple-touch-icon["']/i],
    ['theme-color', /name=["']theme-color["']/i],
    ['color-scheme', /name=["']color-scheme["']/i],
    ['format-detection', /name=["']format-detection["']/i],
  ];

  const missing = requiredPatterns
    .filter(([, pattern]) => !pattern.test(indexHtml))
    .map(([label]) => label);

  if (missing.length > 0) {
    return makeCheck(
      'apple-pwa-meta',
      'Apple PWA metadata',
      'fail',
      'The main HTML entry is missing Apple/Safari PWA metadata.',
      missing,
      'Add viewport-fit, apple-mobile-web-app, apple-touch-icon, color-scheme, and format-detection metadata.',
    );
  }

  return makeCheck(
    'apple-pwa-meta',
    'Apple PWA metadata',
    'pass',
    'The main HTML entry includes Apple/Safari PWA metadata.',
    [],
    'No action required.',
  );
}

function checkEmbedAppleMeta(htmlFiles: AppleCompatibilityFile[]): AppleCompatibilityCheck {
  const embedHtml = getHtml(htmlFiles, 'embed.html');
  const missing: string[] = [];
  if (!/name=["']viewport["'][^>]+viewport-fit=cover/i.test(embedHtml)) missing.push('viewport-fit=cover');
  if (!/name=["']color-scheme["']/i.test(embedHtml)) missing.push('color-scheme');
  if (!/name=["']format-detection["']/i.test(embedHtml)) missing.push('format-detection');

  if (missing.length > 0) {
    return makeCheck(
      'apple-embed-meta',
      'Apple embed metadata',
      'warn',
      'The lightweight embed entry is missing Safari-friendly metadata.',
      missing,
      'Add viewport-fit, color-scheme, and format-detection metadata to the embed entry.',
    );
  }

  return makeCheck(
    'apple-embed-meta',
    'Apple embed metadata',
    'pass',
    'The lightweight embed entry includes Safari-friendly metadata.',
    [],
    'No action required.',
  );
}

function checkPwaManifest(viteConfigSource: string): AppleCompatibilityCheck {
  const missing: string[] = [];
  if (!/display:\s*['"]standalone['"]/.test(viteConfigSource)) missing.push('display: standalone');
  if (!/purpose:\s*['"]any maskable['"]/.test(viteConfigSource)) missing.push('maskable icon purpose');
  if (!/includeAssets:\s*\[[^\]]*agid-logo\.png[^\]]*\]/s.test(viteConfigSource)) missing.push('include apple-touch icon asset');
  if (!/background_color:\s*['"]#0f172a['"]/.test(viteConfigSource)) missing.push('background_color');

  if (missing.length > 0) {
    return makeCheck(
      'pwa-manifest-apple-safe',
      'PWA manifest for Apple install',
      'fail',
      'The PWA manifest is missing fields that keep iOS/iPadOS install behavior predictable.',
      missing,
      'Keep standalone display, maskable icons, included icon assets, and stable background color in the VitePWA manifest.',
    );
  }

  return makeCheck(
    'pwa-manifest-apple-safe',
    'PWA manifest for Apple install',
    'pass',
    'The PWA manifest is suitable for Apple install paths.',
    [],
    'No action required.',
  );
}

function checkSafeAreaCss(cssFiles: AppleCompatibilityFile[]): AppleCompatibilityCheck {
  const css = cssFiles.map(file => file.content).join('\n');
  const missing: string[] = [];
  if (!/env\(safe-area-inset-(?:top|bottom|left|right)\)/.test(css)) missing.push('safe-area env() usage');
  if (!/(100dvh|-webkit-fill-available)/.test(css)) missing.push('Safari dynamic viewport fallback');
  if (!/overscroll-behavior/.test(css)) missing.push('overscroll containment');

  if (missing.length > 0) {
    return makeCheck(
      'safari-safe-area-css',
      'Safari safe-area and viewport CSS',
      'fail',
      'Global CSS is missing iPhone/iPad viewport and safe-area safeguards.',
      missing,
      'Use safe-area env() variables, 100dvh or -webkit-fill-available, and overscroll containment for full-screen map/POS surfaces.',
    );
  }

  return makeCheck(
    'safari-safe-area-css',
    'Safari safe-area and viewport CSS',
    'pass',
    'Global CSS includes Safari safe-area and dynamic viewport safeguards.',
    [],
    'No action required.',
  );
}

function checkAppleMapsProvider(sourceFiles: AppleCompatibilityFile[]): AppleCompatibilityCheck {
  const source = sourceFiles.map(file => file.content).join('\n');
  if (!/maps\.apple\.com/.test(source)) {
    return makeCheck(
      'apple-maps-provider',
      'Apple Maps handoff',
      'warn',
      'No Apple Maps URL handoff was found.',
      [],
      'Keep Apple Maps as a first-class navigation provider for iOS/macOS users.',
    );
  }

  return makeCheck(
    'apple-maps-provider',
    'Apple Maps handoff',
    'pass',
    'Apple Maps URL handoff is available.',
    ['maps.apple.com'],
    'No action required.',
  );
}

function checkHardwareFallbacks(sourceFiles: AppleCompatibilityFile[]): AppleCompatibilityCheck {
  const source = sourceFiles.map(file => file.content).join('\n');
  const missing: string[] = [];
  if (!/Web NFC unavailable/.test(source) || !/NDEFReader/.test(source)) missing.push('Web NFC unsupported fallback');
  if (!/QR scanner unavailable/.test(source)) missing.push('QR camera unavailable fallback');
  if (!/navigator\.share/.test(source) || !/navigator\.clipboard/.test(source)) missing.push('Safari share/clipboard fallback path');

  if (missing.length > 0) {
    return makeCheck(
      'apple-hardware-fallbacks',
      'Safari hardware/API fallbacks',
      'warn',
      'Some Apple-sensitive browser API fallback paths are not visible.',
      missing,
      'Keep QR/manual input fallback beside Web NFC, and guard share/clipboard APIs because Safari support depends on context and user gesture.',
    );
  }

  return makeCheck(
    'apple-hardware-fallbacks',
    'Safari hardware/API fallbacks',
    'pass',
    'Safari-sensitive QR, NFC, share, and clipboard paths have visible fallbacks.',
    [],
    'No action required.',
  );
}

export function buildAppleCompatibilityReport(
  input: AppleCompatibilityInput = {},
): AppleCompatibilityReport {
  const checks = [
    checkApplePwaMeta(input.htmlFiles ?? []),
    checkEmbedAppleMeta(input.htmlFiles ?? []),
    checkPwaManifest(input.viteConfigSource ?? ''),
    checkSafeAreaCss(input.cssFiles ?? []),
    checkAppleMapsProvider(input.sourceFiles ?? []),
    checkHardwareFallbacks(input.sourceFiles ?? []),
  ];

  const summary = {
    pass: checks.filter(check => check.severity === 'pass').length,
    warn: checks.filter(check => check.severity === 'warn').length,
    fail: checks.filter(check => check.severity === 'fail').length,
  };
  const status: AppleCompatibilityReportStatus =
    summary.fail > 0 ? 'blocked' : summary.warn > 0 ? 'attention' : 'ready';

  return {
    version: APPLE_COMPATIBILITY_VERSION,
    status,
    checks,
    summary,
  };
}
