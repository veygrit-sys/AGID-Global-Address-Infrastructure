import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const GATE = 'verify-vey-trade-gateway-test-vector-sdk-package';
const PACKAGE_DIR = resolve('sdk/vey-trade-gateway-test-vectors');
const PACKAGE_NAME = '@veygrit/trade-gateway-test-vectors';
const PACKAGE_VERSION = '0.1.0';
const EXPECTED_FILES_ALLOWLIST = ['dist', 'README.md'] as const;
const EXPECTED_PACK_FILES = [
  'README.md',
  'dist/index.d.ts',
  'dist/index.d.ts.map',
  'dist/index.js',
  'dist/index.js.map',
  'package.json',
] as const;
const REQUIRED_README_ANCHORS = [
  'does not accept raw address',
  'recipient',
  'witness',
  'proof-secret',
  'private-key',
  'production credential',
  'production trading material',
  'production authentication',
  'production trading execution',
  'npm run verify:vey-trade-gateway-test-vector-sdk-package',
] as const;

type PackageJson = {
  name?: unknown;
  version?: unknown;
  main?: unknown;
  types?: unknown;
  exports?: unknown;
  files?: unknown;
};

type PackSummary = {
  name?: unknown;
  version?: unknown;
  filename?: unknown;
  files?: Array<{ path?: unknown }>;
};

function readJson(path: string, errors: string[]) {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch (error) {
    errors.push(`json-read-failed:${path}:${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

function readText(path: string, errors: string[]) {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    errors.push(`text-read-failed:${path}:${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function assertEqual(actual: unknown, expected: unknown, label: string, errors: string[]) {
  if (actual !== expected) errors.push(`${label}:mismatch`);
}

function assertArrayExact(actual: readonly string[], expected: readonly string[], label: string, errors: string[]) {
  if (
    actual.length !== expected.length
    || expected.some((value, index) => actual[index] !== value)
  ) {
    errors.push(`${label}:array-mismatch`);
  }
}

function npmCliCandidates() {
  return [
    process.env.npm_execpath,
    process.env.APPDATA ? join(process.env.APPDATA, 'npm', 'node_modules', 'npm', 'bin', 'npm-cli.js') : undefined,
    process.env.ProgramFiles
      ? join(process.env.ProgramFiles, 'nodejs', 'node_modules', 'npm', 'bin', 'npm-cli.js')
      : undefined,
  ].filter((path): path is string => Boolean(path) && existsSync(path));
}

function runPackDryRun(errors: string[]) {
  const npmCli = npmCliCandidates()[0];
  const result = npmCli
    ? spawnSync(process.execPath, [npmCli, 'pack', '--dry-run', '--json'], {
      cwd: PACKAGE_DIR,
      encoding: 'utf8',
    })
    : spawnSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: PACKAGE_DIR,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
  const stdout = typeof result.stdout === 'string' ? result.stdout : '';
  const stderr = typeof result.stderr === 'string' ? result.stderr : '';

  if (result.status !== 0 || result.error) {
    errors.push(`npm-pack-dry-run-failed:${result.status ?? 'unknown'}`);
    if (result.error) errors.push(`npm-pack-dry-run-error:${result.error.message}`);
    if (stderr.trim()) errors.push(`npm-pack-dry-run-stderr:${stderr.trim()}`);
    return undefined;
  }

  try {
    const parsed = JSON.parse(stdout.trim()) as PackSummary[];
    return parsed[0];
  } catch (error) {
    errors.push(`npm-pack-dry-run-json-invalid:${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

function validatePackageMetadata(packageJson: PackageJson, errors: string[]) {
  assertEqual(packageJson.name, PACKAGE_NAME, 'package.name', errors);
  assertEqual(packageJson.version, PACKAGE_VERSION, 'package.version', errors);
  assertEqual(packageJson.main, './dist/index.js', 'package.main', errors);
  assertEqual(packageJson.types, './dist/index.d.ts', 'package.types', errors);
  assertArrayExact(
    asStringArray(packageJson.files),
    [...EXPECTED_FILES_ALLOWLIST],
    'package.files',
    errors,
  );

  const exportsRoot = isRecord(packageJson.exports) && isRecord(packageJson.exports['.'])
    ? packageJson.exports['.']
    : {};
  assertEqual(exportsRoot.types, './dist/index.d.ts', 'package.exports.root.types', errors);
  assertEqual(exportsRoot.import, './dist/index.js', 'package.exports.root.import', errors);
}

function validateReadme(readme: string, errors: string[]) {
  for (const anchor of REQUIRED_README_ANCHORS) {
    if (!readme.includes(anchor)) errors.push(`README:missing:${anchor}`);
  }
}

function validatePackSummary(packSummary: PackSummary | undefined, errors: string[]) {
  if (!packSummary) return;
  assertEqual(packSummary.name, PACKAGE_NAME, 'pack.name', errors);
  assertEqual(packSummary.version, PACKAGE_VERSION, 'pack.version', errors);
  assertEqual(packSummary.filename, 'veygrit-trade-gateway-test-vectors-0.1.0.tgz', 'pack.filename', errors);

  const packedFiles = (packSummary.files ?? [])
    .map((file) => file.path)
    .filter((path): path is string => typeof path === 'string')
    .sort();
  assertArrayExact(packedFiles, [...EXPECTED_PACK_FILES], 'pack.files', errors);

  const tarballPath = join(PACKAGE_DIR, 'veygrit-trade-gateway-test-vectors-0.1.0.tgz');
  if (existsSync(tarballPath)) errors.push('pack-dry-run-created-tarball');
}

function validateDistFiles(errors: string[]) {
  for (const filePath of EXPECTED_PACK_FILES) {
    if (filePath === 'package.json') continue;
    const absolutePath = join(PACKAGE_DIR, filePath);
    if (!existsSync(absolutePath)) errors.push(`dist-or-readme-missing:${filePath}`);
  }
}

function run() {
  const errors: string[] = [];
  const packageJson = readJson(join(PACKAGE_DIR, 'package.json'), errors) as PackageJson | undefined;
  if (packageJson) validatePackageMetadata(packageJson, errors);
  validateReadme(readText(join(PACKAGE_DIR, 'README.md'), errors), errors);
  validateDistFiles(errors);
  validatePackSummary(runPackDryRun(errors), errors);

  if (errors.length > 0) {
    console.error(`[${GATE}] status=fail errors=${errors.join(',')}`);
    process.exitCode = 1;
    return;
  }

  console.log(`[${GATE}] status=pass package=${PACKAGE_NAME}@${PACKAGE_VERSION} files=${EXPECTED_PACK_FILES.length}`);
}

run();
