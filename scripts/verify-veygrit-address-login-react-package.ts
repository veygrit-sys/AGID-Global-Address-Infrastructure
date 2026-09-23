import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const GATE = 'verify-veygrit-address-login-react-package';
const ROOT = process.cwd();
const PACKAGE_DIR = resolve('sdk/veygrit-address-login-react');
const PACKAGE_NAME = '@veygrit/address-login-react';
const PACKAGE_VERSION = '0.1.0';
const EXPECTED_FILES_ALLOWLIST = ['dist', 'examples', 'README.md'] as const;
const EXPECTED_PACK_FILES = [
  'README.md',
  'dist/examples/checkout-friend-delivery/CheckoutFriendDelivery.d.ts',
  'dist/examples/checkout-friend-delivery/CheckoutFriendDelivery.js',
  'dist/examples/checkout-guest-checkout/CheckoutGuestCheckout.d.ts',
  'dist/examples/checkout-guest-checkout/CheckoutGuestCheckout.js',
  'dist/examples/merchant-visible-redaction/MerchantVisibleRedactionCard.d.ts',
  'dist/examples/merchant-visible-redaction/MerchantVisibleRedactionCard.js',
  'dist/src/index.d.ts',
  'dist/src/index.js',
  'examples/checkout-friend-delivery/CheckoutFriendDelivery.tsx',
  'examples/checkout-guest-checkout/CheckoutGuestCheckout.tsx',
  'examples/merchant-visible-redaction/MerchantVisibleRedactionCard.tsx',
  'package.json',
] as const;
const REQUIRED_README_ANCHORS = [
  'does not replace account login',
  'does not expose raw address',
  'recipient',
  'witness',
  'private-key',
  'proof-secret',
  'production secrets',
  'npm run verify:veygrit-address-login-test-helpers',
  'shared test-helper boundary',
  'npm run verify:veygrit-address-login-react',
  'npm run verify:veygrit-address-login-react-package',
  'npm run verify:veygrit-address-login-packages',
  'not a publishing, hosted-service, or production readiness claim',
] as const;
const HIGH_CONFIDENCE_SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /sk_live_[A-Za-z0-9]/,
  /pk_live_[A-Za-z0-9]/,
  /VEYGRIT_SERVER_ACCESS_TOKEN\s*=/,
  /private_key_fixture_value/i,
  /secret_fixture_value/i,
] as const;

type PackageJson = {
  name?: unknown;
  version?: unknown;
  main?: unknown;
  types?: unknown;
  exports?: unknown;
  files?: unknown;
  peerDependencies?: unknown;
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

function runNodeTool(label: string, args: string[], errors: string[]) {
  const result = spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
  });
  const stderr = typeof result.stderr === 'string' ? result.stderr.trim() : '';
  if (result.status !== 0 || result.error) {
    errors.push(`${label}:failed:${result.status ?? 'unknown'}`);
    if (result.error) errors.push(`${label}:error:${result.error.message}`);
    if (stderr) errors.push(`${label}:stderr:${stderr}`);
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

function runBuild(errors: string[]) {
  runNodeTool(
    'react-package-build',
    [join(ROOT, 'node_modules/typescript/bin/tsc'), '-p', join(PACKAGE_DIR, 'tsconfig.json')],
    errors,
  );
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
  assertEqual(packageJson.main, './dist/src/index.js', 'package.main', errors);
  assertEqual(packageJson.types, './dist/src/index.d.ts', 'package.types', errors);
  assertArrayExact(asStringArray(packageJson.files), [...EXPECTED_FILES_ALLOWLIST], 'package.files', errors);

  const exportsRoot = isRecord(packageJson.exports) && isRecord(packageJson.exports['.'])
    ? packageJson.exports['.']
    : {};
  assertEqual(exportsRoot.types, './dist/src/index.d.ts', 'package.exports.root.types', errors);
  assertEqual(exportsRoot.import, './dist/src/index.js', 'package.exports.root.import', errors);

  const peerDependencies = isRecord(packageJson.peerDependencies) ? packageJson.peerDependencies : {};
  if (typeof peerDependencies.react !== 'string') errors.push('package.peerDependencies.react:missing');
}

function validateReadme(readme: string, errors: string[]) {
  const normalizedReadme = readme.replace(/\s+/g, ' ');
  for (const anchor of REQUIRED_README_ANCHORS) {
    if (!normalizedReadme.includes(anchor)) errors.push(`README:missing:${anchor}`);
  }
}

function validatePackedFileText(path: string, errors: string[]) {
  const text = readText(join(PACKAGE_DIR, path), errors);
  for (const pattern of HIGH_CONFIDENCE_SECRET_PATTERNS) {
    if (pattern.test(text)) errors.push(`pack-file-high-confidence-secret:${path}`);
  }
}

function validateDistFiles(errors: string[]) {
  for (const filePath of EXPECTED_PACK_FILES) {
    if (filePath === 'package.json') continue;
    const absolutePath = join(PACKAGE_DIR, filePath);
    if (!existsSync(absolutePath)) errors.push(`pack-file-missing:${filePath}`);
  }
}

function validatePackSummary(packSummary: PackSummary | undefined, errors: string[]) {
  if (!packSummary) return;
  assertEqual(packSummary.name, PACKAGE_NAME, 'pack.name', errors);
  assertEqual(packSummary.version, PACKAGE_VERSION, 'pack.version', errors);
  assertEqual(packSummary.filename, 'veygrit-address-login-react-0.1.0.tgz', 'pack.filename', errors);

  const packedFiles = (packSummary.files ?? [])
    .map((file) => file.path)
    .filter((path): path is string => typeof path === 'string')
    .sort();
  assertArrayExact(packedFiles, [...EXPECTED_PACK_FILES], 'pack.files', errors);

  const tarballPath = join(PACKAGE_DIR, 'veygrit-address-login-react-0.1.0.tgz');
  if (existsSync(tarballPath)) errors.push('pack-dry-run-created-tarball');
  for (const filePath of packedFiles) validatePackedFileText(filePath, errors);
}

function run() {
  const errors: string[] = [];
  runBuild(errors);

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
