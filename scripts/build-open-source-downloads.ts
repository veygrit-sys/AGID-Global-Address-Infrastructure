import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { generateAgidSdks } from './generate-agid-sdks.ts';

type ZipWriter = {
  addFile: (entryName: string, content: Buffer) => void;
  writeZip: (targetPath: string) => void;
};

const require = createRequire(import.meta.url);
const AdmZip = require('adm-zip') as new () => ZipWriter;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRootDir = join(scriptDir, '..');

export const OPEN_SOURCE_DOWNLOAD_FILES = {
  sdkPack: 'agid-sdk-pack.zip',
  specConformance: 'agid-spec-conformance.zip',
  manifest: 'agid-downloads.json',
} as const;

export type OpenSourceDownloadFile = {
  id: 'sdk-pack' | 'spec-conformance';
  fileName: string;
  href: string;
  size: number;
  sha256: string;
  generatedAt: string;
  source: 'sdk' | 'spec-conformance';
  containsRawAddressMaterial: false;
};

export type OpenSourceDownloadManifest = {
  generatedAt: string;
  policy: {
    appBundleSourceZip: false;
    excludes: string[];
    rawAddressMaterial: 'excluded-by-path-policy';
  };
  files: OpenSourceDownloadFile[];
  sourceArchive: {
    fileName: 'GitHub source archive';
    href: string;
    hostedBy: 'github';
    appBundle: false;
  };
};

type BuildDownloadsOptions = {
  rootDir?: string;
  outputDir?: string;
  generatedAt?: string;
};

type BundleConfig = {
  id: OpenSourceDownloadFile['id'];
  source: OpenSourceDownloadFile['source'];
  fileName: string;
  roots: string[];
  extraFiles?: string[];
};

const githubSourceArchiveUrl =
  'https://github.com/dawnportinfo-design/Adreess-Grid-ID/archive/refs/heads/main.zip';

const excludedPathSegments = new Set([
  '.git',
  '.cache',
  '.env',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'public/downloads',
  'target',
]);

const excludedPathPatterns = [
  /(^|[/\\])\.env($|[./\\])/i,
  /private[-_]?key/i,
  /proof[-_]?code/i,
  /raw[-_]?address/i,
  /recipient[-_]?fixture/i,
  /secret/i,
  /witness/i,
];

const excludedPolicyLabels = [
  'node_modules',
  'dist',
  'build',
  'target',
  '.git',
  '.env',
  'public/downloads',
  'raw-address paths',
  'recipient-fixture paths',
  'private-key paths',
  'proof-code paths',
  'witness paths',
  'secret paths',
];

function normalizeEntryName(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '');
}

function isExcludedPath(path: string): boolean {
  const entryName = normalizeEntryName(path);
  const segments = entryName.split('/');
  if (segments.some(segment => excludedPathSegments.has(segment))) {
    return true;
  }
  if (entryName.includes('public/downloads/')) {
    return true;
  }
  return excludedPathPatterns.some(pattern => pattern.test(entryName));
}

function assertSafeEntryName(entryName: string): void {
  if (isExcludedPath(entryName)) {
    throw new Error(`Refusing to include unsafe download entry: ${entryName}`);
  }
}

function collectFiles(rootDir: string, targetPath: string): string[] {
  if (!existsSync(targetPath) || isExcludedPath(relative(rootDir, targetPath))) {
    return [];
  }

  const stats = statSync(targetPath);
  if (stats.isFile()) {
    return [targetPath];
  }
  if (!stats.isDirectory()) {
    return [];
  }

  return readdirSync(targetPath)
    .flatMap(child => collectFiles(rootDir, join(targetPath, child)))
    .sort((a, b) => normalizeEntryName(relative(rootDir, a)).localeCompare(normalizeEntryName(relative(rootDir, b))));
}

function sdkBundleRoots(rootDir: string): string[] {
  const sdkDir = join(rootDir, 'sdk');
  if (!existsSync(sdkDir)) {
    return [];
  }
  return readdirSync(sdkDir)
    .filter(name => name.startsWith('agid-') && name !== 'agid-spec')
    .map(name => join('sdk', name))
    .sort();
}

function conformanceExtraFiles(rootDir: string): string[] {
  const sdkDir = join(rootDir, 'sdk');
  if (!existsSync(sdkDir)) {
    return [];
  }

  return readdirSync(sdkDir)
    .filter(name => name.startsWith('agid-') && name !== 'agid-spec')
    .flatMap(name => [
      join('sdk', name, 'agid-parity-vectors.json'),
      join('sdk', name, 'agid-sdk.json'),
    ])
    .filter(path => existsSync(join(rootDir, path)))
    .sort();
}

function addManifestFile(zip: ZipWriter, config: BundleConfig, generatedAt: string): void {
  const bundleManifest = {
    id: config.id,
    source: config.source,
    generatedAt,
    containsRawAddressMaterial: false,
    excludes: excludedPolicyLabels,
  };
  zip.addFile('DOWNLOAD-MANIFEST.json', Buffer.from(`${JSON.stringify(bundleManifest, null, 2)}\n`, 'utf8'));
}

function createBundle(rootDir: string, outputDir: string, config: BundleConfig, generatedAt: string): OpenSourceDownloadFile {
  const zip = new AdmZip();
  const absoluteFiles = new Set<string>();

  for (const root of config.roots) {
    for (const file of collectFiles(rootDir, join(rootDir, root))) {
      absoluteFiles.add(file);
    }
  }
  for (const file of config.extraFiles ?? []) {
    const absolutePath = join(rootDir, file);
    if (existsSync(absolutePath) && !isExcludedPath(file)) {
      absoluteFiles.add(absolutePath);
    }
  }

  for (const absolutePath of [...absoluteFiles].sort()) {
    const entryName = normalizeEntryName(relative(rootDir, absolutePath));
    assertSafeEntryName(entryName);
    zip.addFile(entryName, readFileSync(absolutePath));
  }

  addManifestFile(zip, config, generatedAt);

  const outputPath = join(outputDir, config.fileName);
  zip.writeZip(outputPath);

  return {
    id: config.id,
    fileName: config.fileName,
    href: `/downloads/${config.fileName}`,
    size: statSync(outputPath).size,
    sha256: sha256File(outputPath),
    generatedAt,
    source: config.source,
    containsRawAddressMaterial: false,
  };
}

function sha256File(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

export function buildOpenSourceDownloads(options: BuildDownloadsOptions = {}): OpenSourceDownloadManifest {
  const rootDir = options.rootDir ?? defaultRootDir;
  const outputDir = options.outputDir ?? join(rootDir, 'public', 'downloads');
  const generatedAt = options.generatedAt ?? new Date().toISOString();

  rmSync(outputDir, { force: true, recursive: true });
  mkdirSync(outputDir, { recursive: true });

  const bundleConfigs: BundleConfig[] = [
    {
      id: 'sdk-pack',
      source: 'sdk',
      fileName: OPEN_SOURCE_DOWNLOAD_FILES.sdkPack,
      roots: sdkBundleRoots(rootDir),
    },
    {
      id: 'spec-conformance',
      source: 'spec-conformance',
      fileName: OPEN_SOURCE_DOWNLOAD_FILES.specConformance,
      roots: [
        'sdk/agid-spec',
        'data/agid_resolver_conformance',
      ],
      extraFiles: conformanceExtraFiles(rootDir),
    },
  ];

  const files = bundleConfigs.map(config => createBundle(rootDir, outputDir, config, generatedAt));
  const manifest: OpenSourceDownloadManifest = {
    generatedAt,
    policy: {
      appBundleSourceZip: false,
      excludes: excludedPolicyLabels,
      rawAddressMaterial: 'excluded-by-path-policy',
    },
    files,
    sourceArchive: {
      fileName: 'GitHub source archive',
      href: githubSourceArchiveUrl,
      hostedBy: 'github',
      appBundle: false,
    },
  };

  writeFileSync(join(outputDir, OPEN_SOURCE_DOWNLOAD_FILES.manifest), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

const isCliRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isCliRun) {
  const shouldGenerateSdks = process.argv.includes('--generate-sdks');

  (async () => {
    if (shouldGenerateSdks) {
      const result = await generateAgidSdks(join(defaultRootDir, 'sdk'));
      console.log(`Generated ${result.targets.length} AGID SDK targets in ${result.outputDir}`);
    }

    const manifest = buildOpenSourceDownloads();
    const summary = manifest.files
      .map(file => `${file.fileName} ${file.size} bytes sha256=${file.sha256}`)
      .join('\n');
    console.log(`Generated open-source downloads:\n${summary}\n${OPEN_SOURCE_DOWNLOAD_FILES.manifest}`);
  })().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
