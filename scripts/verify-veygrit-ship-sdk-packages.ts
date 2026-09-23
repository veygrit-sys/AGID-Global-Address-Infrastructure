import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const remoteOrPublishCommandPattern =
  /\b(npm\s+publish|composer\s+publish|git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|sites\s+save|deploy\s+production|curl|Invoke-WebRequest|iwr|wget)\b/i;

const requiredReadmeAnchors = [
  'docs/ops/veygrit-ship-credential-surface-matrix.md',
  'docs/ops/veygrit-ship-sdk-release-checklist.md',
  'Do not send carrier credentials through this SDK.',
  'Guest sessions do not create, store, return, or promote carrier credential references.',
  'npm run verify:veygrit-ship-sdk-readmes',
  'npm run verify:veygrit-ship-sdk-release-checklist',
] as const;

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function assertNoPublishAutomation(scripts: Record<string, string> | undefined, label: string): void {
  for (const [name, command] of Object.entries(scripts ?? {})) {
    assert.doesNotMatch(name, /publish|deploy/i, `${label} must not define publish/deploy lifecycle script ${name}`);
    assert.doesNotMatch(command, remoteOrPublishCommandPattern, `${label} script ${name} must not mutate remotes, publish, deploy, or fetch over the network`);
  }
}

function assertReadmeBoundary(packageRoot: string, label: string): void {
  const readmePath = join(packageRoot, 'README.md');
  assert.ok(existsSync(readmePath), `${label} README.md must exist`);
  const readme = readFileSync(readmePath, 'utf8');
  for (const anchor of requiredReadmeAnchors) {
    assert.ok(readme.includes(anchor), `${label} README.md must include ${anchor}`);
  }
}

const jsRoot = 'sdk/veygrit-ship-js';
const jsPackage = readJson<{
  name: string;
  files?: string[];
  scripts?: Record<string, string>;
  publishConfig?: Record<string, unknown>;
}>(join(jsRoot, 'package.json'));
assert.equal(jsPackage.name, '@veygrit/ship');
assert.ok(jsPackage.files?.includes('README.md'), '@veygrit/ship package files must include README.md');
assert.ok(jsPackage.files?.includes('dist'), '@veygrit/ship package files must include dist');
assert.equal(jsPackage.scripts?.test, 'tsx --test test/*.test.ts');
assert.equal(jsPackage.scripts?.build, 'tsc -p tsconfig.json');
assert.equal(jsPackage.scripts?.typecheck, 'tsc --noEmit -p tsconfig.json');
assert.equal(jsPackage.publishConfig?.provenance, true);
assertNoPublishAutomation(jsPackage.scripts, '@veygrit/ship');
assertReadmeBoundary(jsRoot, '@veygrit/ship');

const phpRoot = 'sdk/veygrit-ship-php';
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
assertNoPublishAutomation(phpComposer.scripts, 'veygrit/ship');
assertReadmeBoundary(phpRoot, 'veygrit/ship');

const rootPackage = readJson<{ scripts?: Record<string, string> }>('package.json');
assert.equal(rootPackage.scripts?.['verify:veygrit-ship-sdk-readmes'], 'tsx scripts/verify-veygrit-ship-sdk-readmes.ts');
assert.equal(rootPackage.scripts?.['verify:veygrit-ship-sdk-packages'], 'tsx scripts/verify-veygrit-ship-sdk-packages.ts');
assert.equal(rootPackage.scripts?.['verify:veygrit-ship-sdk-build-hygiene'], 'tsx scripts/verify-veygrit-ship-sdk-build-hygiene.ts');
assert.equal(rootPackage.scripts?.['verify:veygrit-ship-sdk-package-archives'], 'tsx scripts/verify-veygrit-ship-sdk-package-archives.ts');
assert.equal(rootPackage.scripts?.['verify:veygrit-ship-sdk-release-checklist'], 'tsx scripts/verify-veygrit-ship-sdk-release-checklist.ts');

console.log('Veygrit Ship SDK package readiness checks passed (JS + PHP).');
