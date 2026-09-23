import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  VEYGRIT_APP_RELEASE_READINESS_EXPECTED_FILES,
  VEYGRIT_APP_RELEASE_READINESS_EXPECTED_SCRIPTS,
  buildVeygritAppReleaseReadinessSummary,
} from './verify-veygrit-app-release-readiness';
import {
  listVeygritAppReleaseReadinessSteps,
  runVeygritAppReleaseReadiness,
} from './run-veygrit-app-release-readiness';
import { EXPECTED_VEYGRIT_RELEASE_READINESS_DISCOVERY_SUMMARY } from '../src/lib/veygritReleaseReadinessDiscoveryContract';

function packageFixture(overrides: Record<string, string | undefined> = {}) {
  const scripts = Object.fromEntries(
    VEYGRIT_APP_RELEASE_READINESS_EXPECTED_SCRIPTS.map(script => [script.name, script.command]),
  );

  for (const [name, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete scripts[name];
    } else {
      scripts[name] = value;
    }
  }

  return JSON.stringify({ scripts });
}

function readiness(overrides: Record<string, string | undefined> = {}) {
  return buildVeygritAppReleaseReadinessSummary({
    appRoot: 'fixture/veygrit-app',
    packageJsonText: packageFixture(overrides),
    existingFiles: VEYGRIT_APP_RELEASE_READINESS_EXPECTED_FILES,
  });
}

test('Veygrit app release readiness fixture passes with exact local scripts and handoff files', () => {
  const result = readiness();

  assert.equal(result.status, 'pass');
  assert.deepEqual(result.findings, []);
  assert.equal(result.archiveCreated, false);
  assert.equal(result.remoteMutationAllowedThisTurn, false);
  assert.equal(result.productionDeployRequiresExplicitApproval, true);
});

test('Veygrit app release readiness fixture blocks a missing app script without editing live package.json', () => {
  const result = readiness({ 'check:release-readiness': undefined });

  assert.equal(result.status, 'blocked');
  assert.ok(result.findings.includes('missing-or-changed-script:check:release-readiness'));
  assert.doesNotMatch(JSON.stringify(result), /node scripts\/release-readiness\.mjs.*node scripts\/release-readiness\.mjs/);
});

test('Veygrit app release readiness fixture blocks remote mutation commands in script wiring', () => {
  const result = readiness({ build: 'git push origin main' });

  assert.equal(result.status, 'blocked');
  assert.ok(result.findings.includes('missing-or-changed-script:build'));
  assert.ok(result.findings.includes('remote-mutation-command-present:build'));
  assert.equal(result.remoteMutationAllowedThisTurn, false);
});

test('release readiness runner bundles Vey ID, Address Login, and Sites handoff gates without remote mutation', () => {
  const source = readFileSync('scripts/run-veygrit-app-release-readiness.ts', 'utf8');

  for (const expected of [
    'scripts/verify-veygrit-id-production-openapi.test.ts',
    'scripts/verify-veygrit-id-production-openapi.ts',
    'scripts/verify-veygrit-address-login-hosted.ts',
    'scripts/verify-vey-id-address-wallet-pass-export-fixture-schema.ts',
    'scripts/print-veygrit-handoff-bundle-manifest.ts',
    'scripts/verify-veygrit-sites-link.ts',
  ]) {
    assert.match(source, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(source, /--compact/);
  assert.match(source, /remoteMutationAllowedThisTurn:\s*false/);
  assert.doesNotMatch(source, /\b(git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|sites\s+save|deploy\s+production)\b/i);
});

test('release readiness runner emits a per-step JSON summary for pass and failure reporting', () => {
  const source = readFileSync('scripts/run-veygrit-app-release-readiness.ts', 'utf8');

  for (const expected of ['steps', 'failedStep', 'step-exited-nonzero', 'durationMs', 'exitCode', 'signal', 'runVeygritAppReleaseReadiness']) {
    assert.match(source, new RegExp(expected));
  }

  assert.match(source, /buildSummary\('pass'/);
  assert.match(source, /buildSummary\('blocked'/);
  assert.match(source, /steps\.filter\(step => step\.status === 'pass'\)\.map\(step => step\.label\)/);
});

test('release readiness runner dry-run failure fixture returns blocked per-step JSON by execution', () => {
  let currentTime = 1000;
  const result = runVeygritAppReleaseReadiness({
    commands: [
      { label: 'fixture pass', args: ['fixture-pass.ts'] },
      { label: 'fixture fail', args: ['fixture-fail.ts'] },
      { label: 'fixture never reached', args: ['fixture-never.ts'] },
    ],
    spawn: (_command, args) => ({
      status: args.includes('fixture-fail.ts') ? 17 : 0,
      signal: null,
    }),
    now: () => {
      currentTime += 5;
      return currentTime;
    },
  });

  assert.equal(result.status, 'blocked');
  assert.equal(result.failedStep, 'fixture fail');
  assert.equal(result.finding, 'step-exited-nonzero');
  assert.equal(result.exitCode, 17);
  assert.deepEqual(result.executed, ['fixture pass']);
  assert.deepEqual(result.steps.map(step => step.status), ['pass', 'blocked']);
  assert.equal(result.steps[0].durationMs, 5);
  assert.equal(result.steps[1].durationMs, 5);
  assert.equal(result.remoteMutationAllowedThisTurn, false);
  assert.doesNotMatch(JSON.stringify(result), /fixture never reached/);
});

test('release readiness runner lists bundled gates without executing them', () => {
  const summary = listVeygritAppReleaseReadinessSteps([
    { label: 'fixture discoverable gate', args: ['fixture-gate.ts'] },
  ]);

  assert.equal(summary.status, 'pass');
  assert.equal(summary.mode, 'list-steps');
  assert.equal(summary.remoteMutationAllowedThisTurn, false);
  assert.deepEqual(summary.steps, [
    {
      label: 'fixture discoverable gate',
      args: ['node_modules/tsx/dist/cli.mjs', 'fixture-gate.ts'],
    },
  ]);
  assert.equal(Object.hasOwn(summary, 'executed'), false);
  assert.equal(Object.hasOwn(summary.steps[0], 'durationMs'), false);
});

test('release readiness runner snapshots the default operator discovery gate list', () => {
  const summary = listVeygritAppReleaseReadinessSteps();

  assert.deepEqual(summary, EXPECTED_VEYGRIT_RELEASE_READINESS_DISCOVERY_SUMMARY);
  assert.equal(Object.hasOwn(summary, 'executed'), false);
  assert.doesNotMatch(JSON.stringify(summary), /\b(git\s+push|gh\s+pr\s+create|gh\s+repo\s+create|sites\s+save|deploy\s+production)\b/i);
});
