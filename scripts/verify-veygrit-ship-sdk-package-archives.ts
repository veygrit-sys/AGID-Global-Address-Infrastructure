import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const jsRoot = 'sdk/veygrit-ship-js';
const phpRoot = 'sdk/veygrit-ship-php';

const expectedJsArchivePaths = [
  'README.md',
  'dist/index.d.ts',
  'dist/index.d.ts.map',
  'dist/index.js',
  'dist/index.js.map',
  'package.json',
] as const;

const remoteOrPublishCommandPattern =
  /\b(npm\s+publish|composer\s+publish|git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|sites\s+save|deploy\s+production|curl|Invoke-WebRequest|iwr|wget)\b/i;
const packagedCredentialBoundaryPattern =
  /\b(carrierCredential|carrierCredentials|carrierApiKey|commercialRateSecret|credentialSecretRef|credentialVersionRef|clientSecret|client_secret|privateKey|proofSecret|proofWitness)\b/i;

type NpmPackFile = {
  path: string;
  size: number;
};

type NpmPackResult = {
  name: string;
  version: string;
  filename: string;
  files: NpmPackFile[];
  entryCount: number;
  bundled?: unknown[];
};

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

async function runCommand(
  command: string,
  args: string[],
  options: { cwd: string },
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', chunk => {
      stdout += String(chunk);
    });
    child.stderr?.on('data', chunk => {
      stderr += String(chunk);
    });
    child.once('error', reject);
    child.once('exit', code => resolve({ exitCode: code ?? 1, stdout, stderr }));
  });
}

async function runComposerCommand(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  if (process.platform === 'win32') {
    return await runCommand('cmd.exe', ['/d', '/s', '/c', ['composer', ...args].join(' ')], { cwd: phpRoot });
  }
  return await runCommand('composer', args, { cwd: phpRoot });
}

async function runNpmPackDryRun(): Promise<NpmPackResult> {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error('Run this package archive gate through npm so npm_execpath is available.');

  const packageJson = readJson<{ version: string }>(join(jsRoot, 'package.json'));
  const expectedFilename = `veygrit-ship-${packageJson.version}.tgz`;
  const archivePath = join(jsRoot, expectedFilename);
  const existedBefore = existsSync(archivePath);

  const result = await runCommand(
    process.execPath,
    [npmCli, 'pack', '--dry-run', '--json', '--ignore-scripts'],
    { cwd: jsRoot },
  );

  assert.equal(result.exitCode, 0, `npm pack --dry-run must pass: ${result.stderr}`);
  assert.equal(existsSync(archivePath), existedBefore, 'npm pack --dry-run must not create or remove a package archive');

  const packResults = JSON.parse(result.stdout) as NpmPackResult[];
  assert.equal(packResults.length, 1, 'npm pack --dry-run must return exactly one package result');
  return packResults[0];
}

async function runComposerValidateIfAvailable(): Promise<'passed' | 'skipped'> {
  const version = await runComposerCommand(['--version']).catch(() => ({
    exitCode: 1,
    stdout: '',
    stderr: '',
  }));

  if (version.exitCode !== 0) {
    console.log('Composer not available; skipped optional composer validate after local composer.json checks.');
    return 'skipped';
  }

  const validation = await runComposerCommand(['validate', '--strict', '--no-check-publish']);
  assert.equal(validation.exitCode, 0, `composer validate must pass: ${validation.stdout}${validation.stderr}`);
  return 'passed';
}

const rootPackage = readJson<{ scripts?: Record<string, string> }>('package.json');
assert.equal(
  rootPackage.scripts?.['verify:veygrit-ship-sdk-package-archives'],
  'tsx scripts/verify-veygrit-ship-sdk-package-archives.ts',
);

const jsPackage = readJson<{ name: string; files?: string[]; scripts?: Record<string, string> }>(
  join(jsRoot, 'package.json'),
);
assert.equal(jsPackage.name, '@veygrit/ship');
assert.deepEqual(jsPackage.files, ['dist', 'README.md']);

const packResult = await runNpmPackDryRun();
assert.equal(packResult.name, '@veygrit/ship');
assert.match(packResult.filename, /^veygrit-ship-\d+\.\d+\.\d+\.tgz$/);
assert.equal(packResult.entryCount, expectedJsArchivePaths.length);
assert.equal(packResult.bundled?.length ?? 0, 0, '@veygrit/ship archive must not bundle dependencies');

const archivePaths = packResult.files.map(file => file.path).sort();
assert.deepEqual(archivePaths, [...expectedJsArchivePaths].sort());

for (const file of packResult.files) {
  assert.ok(file.size > 0, `@veygrit/ship archive entry must not be empty: ${file.path}`);
  const source = readFileSync(join(jsRoot, file.path), 'utf8');
  assert.doesNotMatch(
    source,
    remoteOrPublishCommandPattern,
    `@veygrit/ship archive entry must not contain publish, deploy, remote mutation, or network-fetch commands: ${file.path}`,
  );
  assert.doesNotMatch(
    source,
    packagedCredentialBoundaryPattern,
    `@veygrit/ship archive entry must not expose carrier credential, proof secret, witness, or private-key fields: ${file.path}`,
  );
}

const phpComposer = readJson<{
  name: string;
  readme?: string;
  scripts?: Record<string, string>;
  autoload?: { 'psr-4'?: Record<string, string> };
}>(join(phpRoot, 'composer.json'));
assert.equal(phpComposer.name, 'veygrit/ship');
assert.equal(phpComposer.readme, 'README.md');
assert.equal(phpComposer.scripts?.test, 'php tests/ClientTest.php');
assert.equal(phpComposer.autoload?.['psr-4']?.['Veygrit\\Ship\\'], 'src/');

for (const [name, command] of Object.entries(phpComposer.scripts ?? {})) {
  assert.doesNotMatch(name, /publish|deploy/i, `veygrit/ship must not define publish/deploy lifecycle script ${name}`);
  assert.doesNotMatch(command, remoteOrPublishCommandPattern, `veygrit/ship script ${name} must not mutate remotes, publish, deploy, or fetch over the network`);
}

const composerStatus = await runComposerValidateIfAvailable();
console.log(`Veygrit Ship SDK package archive checks passed (JS dry-run pack, PHP composer ${composerStatus}).`);
