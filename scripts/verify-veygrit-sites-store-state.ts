import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildVeygritSitesBridge } from '../src/lib/veygritSitesBridge';

type JsonObject = Record<string, unknown>;

function readJsonObject(path: string): JsonObject {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  assert(parsed && typeof parsed === 'object' && !Array.isArray(parsed), `${path} must contain a JSON object`);
  return parsed as JsonObject;
}

function tail(value: string): string {
  const lines = value.trim().split(/\r?\n/).filter(Boolean);
  return lines.slice(-12).join('\n');
}

const bridge = buildVeygritSitesBridge();
const siteAppRoot = join(bridge.codexThread.localRoot, 'work', 'veygrit-app');
const sitePackageJsonPath = join(siteAppRoot, 'package.json');
const helperPath = join(siteAppRoot, 'src', 'storeConnectionState.js');
const testPath = join(siteAppRoot, 'src', 'storeConnectionState.test.js');

assert.equal(existsSync(sitePackageJsonPath), true, 'Veygrit Sites package.json must exist');
assert.equal(existsSync(helperPath), true, 'Veygrit Sites store connection helper must exist');
assert.equal(existsSync(testPath), true, 'Veygrit Sites store connection state test must exist');

const sitePackageJson = readJsonObject(sitePackageJsonPath);
const scripts = sitePackageJson.scripts as JsonObject | undefined;

assert.equal(sitePackageJson.name, 'veygrit-address-wallet', 'Sites package name must remain the expected Veygrit app');
assert.equal(
  scripts?.['test:store-state'],
  'node --test src/storeConnectionState.test.js',
  'Sites app must expose the store-state test command',
);
assert.equal(
  bridge.validationGates.includes('npm run verify:veygrit-sites-store-state'),
  true,
  'bridge validation gates must include the AGID store-state verifier',
);

const run = spawnSync(process.execPath, ['--test', 'src/storeConnectionState.test.js'], {
  cwd: siteAppRoot,
  encoding: 'utf8',
});

if (run.status !== 0) {
  console.error(JSON.stringify({
    status: 'blocked',
    verifier: 'verify-veygrit-sites-store-state',
    packageScript: 'npm run test:store-state',
    command: 'node --test src/storeConnectionState.test.js',
    cwd: siteAppRoot,
    exitCode: run.status,
    signal: run.signal,
    spawnError: run.error ? String(run.error) : undefined,
    stdoutTail: tail(run.stdout ?? ''),
    stderrTail: tail(run.stderr ?? ''),
    remediation: 'Fix the Sites app storeConnectionState helper or test before save/deploy review.',
  }));
  process.exit(run.status ?? 1);
}

console.log(JSON.stringify({
  status: 'pass',
  verifier: 'verify-veygrit-sites-store-state',
  packageScript: 'npm run test:store-state',
  command: 'node --test src/storeConnectionState.test.js',
  sitePackage: sitePackageJson.name,
  testedFiles: [
    'src/storeConnectionState.js',
    'src/storeConnectionState.test.js',
  ],
  remoteMutationAllowedThisTurn: bridge.githubConnection.remoteMutationAllowedThisTurn,
  productionDeployRequiresExplicitApproval: bridge.safetyBoundaries.productionDeployRequiresExplicitApproval,
}));
