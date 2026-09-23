import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildVeygritSitesBridge,
  validateVeygritSitesBridge,
} from '../src/lib/veygritSitesBridge';

type JsonObject = Record<string, unknown>;

type PresaveTask = {
  id: string;
  packageScript: string;
  cwd: string;
  args: string[];
};

function readJsonObject(path: string): JsonObject {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  assert(parsed && typeof parsed === 'object' && !Array.isArray(parsed), `${path} must contain a JSON object`);
  return parsed as JsonObject;
}

function tail(value: string): string {
  const lines = value.trim().split(/\r?\n/).filter(Boolean);
  return lines.slice(-12).join('\n');
}

const agidRoot = process.cwd();
const tsxCli = join(agidRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const bridge = buildVeygritSitesBridge();
const bridgeValidation = validateVeygritSitesBridge(bridge);
const siteAppRoot = join(bridge.codexThread.localRoot, 'work', 'veygrit-app');
const sitePackageJsonPath = join(siteAppRoot, 'package.json');
const siteBuildScriptPath = join(siteAppRoot, 'scripts', 'build-sites.mjs');

assert.equal(bridgeValidation.ok, true, `bridge validation failed: ${bridgeValidation.errors.join(', ')}`);
assert.equal(existsSync(tsxCli), true, 'tsx CLI must exist in AGID node_modules');
assert.equal(existsSync(sitePackageJsonPath), true, 'Veygrit Sites package.json must exist');
assert.equal(existsSync(siteBuildScriptPath), true, 'Veygrit Sites build script must exist');
assert.equal(
  bridge.validationGates.includes('npm run verify:veygrit-sites-presave'),
  true,
  'bridge validation gates must include the aggregate pre-save verifier',
);

const sitePackageJson = readJsonObject(sitePackageJsonPath);
const siteScripts = sitePackageJson.scripts as JsonObject | undefined;

assert.equal(sitePackageJson.name, 'veygrit-address-wallet', 'Sites package name must remain the expected Veygrit app');
assert.equal(siteScripts?.build, 'node scripts/build-sites.mjs', 'Sites app must keep the expected build command');
assert.equal(siteScripts?.['test:store-state'], 'node --test src/storeConnectionState.test.js', 'Sites app must keep the expected store-state test command');

const tasks: PresaveTask[] = [
  {
    id: 'check-ref-fixtures',
    packageScript: 'npm run check:veygrit-sites-ref-fixtures',
    cwd: agidRoot,
    args: [tsxCli, 'scripts/sync-veygrit-sites-ref-fixtures.ts', '--check'],
  },
  {
    id: 'check-transition-buttons',
    packageScript: 'npm run check:veygrit-sites-transition-buttons',
    cwd: agidRoot,
    args: [tsxCli, 'scripts/sync-veygrit-sites-transition-buttons.ts', '--check'],
  },
  {
    id: 'check-store-catalog',
    packageScript: 'npm run check:veygrit-sites-store-catalog',
    cwd: agidRoot,
    args: [tsxCli, 'scripts/sync-veygrit-sites-store-catalog.ts', '--check'],
  },
  {
    id: 'verify-link',
    packageScript: 'npm run verify:veygrit-sites-link',
    cwd: agidRoot,
    args: [tsxCli, 'scripts/verify-veygrit-sites-link.ts'],
  },
  {
    id: 'verify-store-state',
    packageScript: 'npm run verify:veygrit-sites-store-state',
    cwd: agidRoot,
    args: [tsxCli, 'scripts/verify-veygrit-sites-store-state.ts'],
  },
  {
    id: 'verify-ui-smoke',
    packageScript: 'npm run verify:veygrit-sites-ui-smoke',
    cwd: agidRoot,
    args: [tsxCli, 'scripts/verify-veygrit-sites-ui-smoke.ts'],
  },
  {
    id: 'verify-predeploy-redaction',
    packageScript: 'npm run verify:veygrit-sites-predeploy-redaction',
    cwd: agidRoot,
    args: [tsxCli, 'scripts/verify-veygrit-sites-predeploy-redaction.ts'],
  },
  {
    id: 'site-build',
    packageScript: 'cd C:/Users/kitau/Documents/Codex/2026-07-17/sites-plugin-sites-openai-bundled-veygrit/work/veygrit-app && npm run build',
    cwd: siteAppRoot,
    args: ['scripts/build-sites.mjs'],
  },
];

const passed: string[] = [];

for (const task of tasks) {
  const run = spawnSync(process.execPath, task.args, {
    cwd: task.cwd,
    encoding: 'utf8',
  });

  if (run.status !== 0) {
    console.error(JSON.stringify({
      status: 'blocked',
      verifier: 'verify-veygrit-sites-presave',
      failedTask: task.id,
      packageScript: task.packageScript,
      exitCode: run.status,
      signal: run.signal,
      spawnError: run.error ? String(run.error) : undefined,
      passedTasks: passed,
      stdoutTail: tail(run.stdout ?? ''),
      stderrTail: tail(run.stderr ?? ''),
      remediation: 'Fix the failing local Sites pre-save task before save/deploy review.',
    }));
    process.exit(run.status ?? 1);
  }

  passed.push(task.id);
}

console.log(JSON.stringify({
  status: 'pass',
  verifier: 'verify-veygrit-sites-presave',
  tasks: passed,
  sitePackage: sitePackageJson.name,
  remoteMutationAllowedThisTurn: bridge.githubConnection.remoteMutationAllowedThisTurn,
  productionDeployRequiresExplicitApproval: bridge.safetyBoundaries.productionDeployRequiresExplicitApproval,
}));
