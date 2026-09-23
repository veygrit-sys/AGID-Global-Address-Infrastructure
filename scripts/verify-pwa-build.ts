import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type WebManifestIcon = {
  src?: string;
  sizes?: string;
  type?: string;
  purpose?: string;
};

type WebManifest = {
  id?: string;
  name?: string;
  short_name?: string;
  start_url?: string;
  scope?: string;
  display?: string;
  display_override?: string[];
  theme_color?: string;
  background_color?: string;
  icons?: WebManifestIcon[];
  shortcuts?: Array<{
    name?: string;
    url?: string;
  }>;
};

export type PwaBuildVerificationResult = {
  distPath: string;
  manifest: WebManifest;
  hasServiceWorker: boolean;
  hasRegistrationScript: boolean;
  precacheBudget: {
    entries: number;
    localBytes: number;
    maxEntries: number;
    maxLocalBytes: number;
  };
  chunkBudget: {
    jsChunks: number;
    largeChunks: Array<{
      fileName: string;
      bytes: number;
      budgetId: string;
      maxBytes: number;
    }>;
  };
};

const installableDisplays = new Set(['standalone', 'fullscreen', 'minimal-ui']);
const kib = (value: number) => value * 1024;
const defaultJsChunkBudgetBytes = kib(500);
const maxPrecacheEntries = 450;
const maxPrecacheLocalBytes = kib(9 * 1024);
const countryPackPrecachePattern = /(?:^|\/)assets\/[A-Z][A-Z][A-Z_ -]*-[^"/]+\.js$/;

const knownLargeJsChunkBudgets: Array<{
  id: string;
  matches: (fileName: string) => boolean;
  maxBytes: number;
}> = [
  {
    id: 'map-shell',
    matches: fileName => fileName.startsWith('App-'),
    maxBytes: kib(800),
  },
  {
    id: 'map-renderer-vendor',
    matches: fileName => fileName.startsWith('vendor-maplibre-'),
    maxBytes: kib(1150),
  },
  {
    id: 'script-conversion-vendor',
    matches: fileName => fileName.startsWith('vendor-language-opencc-'),
    maxBytes: kib(1200),
  },
];

async function readTextIfExists(filePath: string) {
  if (!existsSync(filePath)) {
    return null;
  }
  return readFile(filePath, 'utf8');
}

type BuiltJsAsset = {
  fileName: string;
  bytes: number;
};

async function readBuiltJsAssets(distPath: string) {
  const assetsDir = path.join(distPath, 'assets');
  if (!existsSync(assetsDir)) return { text: '', chunks: [] as BuiltJsAsset[] };
  const { readdir, stat } = await import('node:fs/promises');
  const files = await readdir(assetsDir);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  const [snippets, chunks] = await Promise.all([
    Promise.all(jsFiles.map(async file => {
      try {
        return await readFile(path.join(assetsDir, file), 'utf8');
      } catch {
        return '';
      }
    })),
    Promise.all(
      jsFiles.map(async file => {
        const filePath = path.join(assetsDir, file);
        const fileStat = await stat(filePath);
        return {
          fileName: file,
          bytes: fileStat.size,
        };
      }),
    ),
  ]);
  return { text: snippets.join('\n'), chunks };
}

function getJsChunkBudget(fileName: string) {
  return knownLargeJsChunkBudgets.find(budget => budget.matches(fileName)) ?? {
    id: 'default-js-chunk',
    maxBytes: defaultJsChunkBudgetBytes,
  };
}

function validateJsChunkBudget(chunks: BuiltJsAsset[]) {
  const errors: string[] = [];
  const largeChunks: PwaBuildVerificationResult['chunkBudget']['largeChunks'] = [];

  chunks.forEach(chunk => {
    const budget = getJsChunkBudget(chunk.fileName);
    if (chunk.bytes > defaultJsChunkBudgetBytes) {
      largeChunks.push({
        fileName: chunk.fileName,
        bytes: chunk.bytes,
        budgetId: budget.id,
        maxBytes: budget.maxBytes,
      });
    }
    if (chunk.bytes > budget.maxBytes) {
      errors.push(
        `${chunk.fileName} is ${Math.round(chunk.bytes / 1024)} KiB, above ${budget.id} budget ${Math.round(budget.maxBytes / 1024)} KiB`,
      );
    }
  });

  return { errors, largeChunks };
}

function extractPrecacheUrls(serviceWorkerText: string | null) {
  return Array.from(serviceWorkerText?.matchAll(/\burl:"([^"]+)"/g) ?? [], match => match[1]);
}

async function inspectPrecacheBudget(distPath: string, serviceWorkerText: string | null) {
  const urls = extractPrecacheUrls(serviceWorkerText);
  const { stat } = await import('node:fs/promises');
  let localBytes = 0;

  for (const url of urls) {
    if (/^[a-z]+:\/\//i.test(url)) continue;
    const normalizedUrl = url.replace(/^\/+/, '');
    const filePath = path.join(distPath, normalizedUrl);
    if (!existsSync(filePath)) continue;

    const fileStat = await stat(filePath);
    localBytes += fileStat.size;
  }

  return {
    entries: urls.length,
    localBytes,
    maxEntries: maxPrecacheEntries,
    maxLocalBytes: maxPrecacheLocalBytes,
  };
}

function validatePrecacheBudget(precacheBudget: PwaBuildVerificationResult['precacheBudget']) {
  const errors: string[] = [];

  if (precacheBudget.entries > precacheBudget.maxEntries) {
    errors.push(
      `service worker precache has ${precacheBudget.entries} entries, above budget ${precacheBudget.maxEntries}`,
    );
  }

  if (precacheBudget.localBytes > precacheBudget.maxLocalBytes) {
    errors.push(
      `service worker precache is ${Math.round(precacheBudget.localBytes / 1024)} KiB, above budget ${Math.round(precacheBudget.maxLocalBytes / 1024)} KiB`,
    );
  }

  return errors;
}

function validatePrecacheContents(serviceWorkerText: string | null) {
  const errors: string[] = [];
  const urls = extractPrecacheUrls(serviceWorkerText);
  const countryPackUrls = urls.filter(url => countryPackPrecachePattern.test(url));

  if (countryPackUrls.length > 0) {
    errors.push(
      `service worker precache includes ${countryPackUrls.length} country/region pack chunks; first: ${countryPackUrls[0]}`,
    );
  }

  return errors;
}

function validateManifest(manifest: WebManifest) {
  const errors: string[] = [];
  const requiredFields: Array<keyof WebManifest> = [
    'name',
    'short_name',
    'start_url',
    'scope',
    'display',
    'theme_color',
    'background_color',
  ];

  for (const field of requiredFields) {
    if (typeof manifest[field] !== 'string' || manifest[field]?.trim() === '') {
      errors.push(`manifest.${field} is required`);
    }
  }

  if (manifest.display && !installableDisplays.has(manifest.display)) {
    errors.push(`manifest.display must be one of ${Array.from(installableDisplays).join(', ')}`);
  }
  if (manifest.display_override && !manifest.display_override.includes(manifest.display || '')) {
    errors.push('manifest.display_override should include the primary display mode');
  }

  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    errors.push('manifest.icons is required');
  } else {
    const iconSizes = new Set(manifest.icons.flatMap((icon) => icon.sizes?.split(/\s+/) ?? []));
    if (!iconSizes.has('192x192')) {
      errors.push('manifest.icons must include 192x192');
    }
    if (!iconSizes.has('512x512')) {
      errors.push('manifest.icons must include 512x512');
    }
  }
  if (!Array.isArray(manifest.shortcuts) || manifest.shortcuts.length < 2) {
    errors.push('manifest.shortcuts should expose major app routes');
  }

  return errors;
}

export async function verifyPwaBuild(
  distPath = path.join(process.cwd(), 'dist'),
): Promise<PwaBuildVerificationResult> {
  const manifestPath = path.join(distPath, 'manifest.webmanifest');
  const serviceWorkerPath = path.join(distPath, 'sw.js');
  const registrationPath = path.join(distPath, 'registerSW.js');
  const indexPath = path.join(distPath, 'index.html');

  const errors: string[] = [];
  const manifestText = await readTextIfExists(manifestPath);
  const serviceWorkerText = await readTextIfExists(serviceWorkerPath);
  const registrationText = await readTextIfExists(registrationPath);
  const indexText = await readTextIfExists(indexPath);
  const builtJsAssets = await readBuiltJsAssets(distPath);
  const builtJsText = builtJsAssets.text;
  const precacheBudget = await inspectPrecacheBudget(distPath, serviceWorkerText);

  let manifest: WebManifest = {};

  if (!manifestText) {
    errors.push('manifest.webmanifest is missing');
  } else {
    try {
      manifest = JSON.parse(manifestText) as WebManifest;
      errors.push(...validateManifest(manifest));
    } catch {
      errors.push('manifest.webmanifest is not valid JSON');
    }
  }

  if (!serviceWorkerText) {
    errors.push('service worker sw.js is missing');
  } else if (!/(precache|__WB_MANIFEST|workbox|registerRoute)/i.test(serviceWorkerText)) {
    errors.push('service worker sw.js does not look like a generated Workbox service worker');
  }

  const hasRegistrationScript =
    Boolean(registrationText?.includes('serviceWorker')) ||
    Boolean(indexText && /(registerSW|serviceWorker|sw\.js)/i.test(indexText)) ||
    /serviceWorker|registerSW|beforeinstallprompt/i.test(builtJsText);

  if (!hasRegistrationScript) {
    errors.push('service worker registration script is missing');
  }

  const chunkBudget = validateJsChunkBudget(builtJsAssets.chunks);
  errors.push(...chunkBudget.errors);
  errors.push(...validatePrecacheBudget(precacheBudget));
  errors.push(...validatePrecacheContents(serviceWorkerText));

  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }

  return {
    distPath,
    manifest,
    hasServiceWorker: true,
    hasRegistrationScript,
    precacheBudget,
    chunkBudget: {
      jsChunks: builtJsAssets.chunks.length,
      largeChunks: chunkBudget.largeChunks,
    },
  };
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const distPath = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
  const result = await verifyPwaBuild(distPath);
  console.log(
    JSON.stringify(
      {
        distPath: result.distPath,
        manifestName: result.manifest.name,
        hasServiceWorker: result.hasServiceWorker,
        hasRegistrationScript: result.hasRegistrationScript,
        precacheBudget: result.precacheBudget,
        chunkBudget: result.chunkBudget,
      },
      null,
      2,
    ),
  );
}
