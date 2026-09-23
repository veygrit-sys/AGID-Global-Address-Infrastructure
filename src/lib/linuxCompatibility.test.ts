import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildLinuxCompatibilityReport } from './linuxCompatibility';

test('linux compatibility report is ready for shell-neutral scripts', () => {
  const report = buildLinuxCompatibilityReport({
    platform: 'linux',
    nodeVersion: 'v22.0.0',
    packageScripts: {
      clean: 'tsx scripts/clean-dist.ts',
      lint: 'tsc --noEmit',
    },
    files: [
      { path: 'src/lib/example.ts', content: 'export const ok = true;' },
      { path: 'scripts/example.ts', content: 'import path from "node:path";' },
    ],
  });

  assert.equal(report.status, 'ready');
  assert.equal(report.summary.fail, 0);
  assert.equal(report.checks.every(check => check.severity === 'pass'), true);
});

test('linux compatibility report blocks Unix-only clean scripts', () => {
  const report = buildLinuxCompatibilityReport({
    platform: 'linux',
    nodeVersion: 'v22.0.0',
    packageScripts: {
      clean: 'rm -rf dist',
    },
  });

  assert.equal(report.status, 'blocked');
  assert.ok(report.checks.some(check => check.id === 'clean-script' && check.severity === 'fail'));
});

test('linux compatibility report detects case-only path collisions', () => {
  const report = buildLinuxCompatibilityReport({
    platform: 'linux',
    nodeVersion: 'v22.0.0',
    packageScripts: {
      clean: 'tsx scripts/clean-dist.ts',
    },
    files: [
      { path: 'src/Foo.ts' },
      { path: 'src/foo.ts' },
    ],
  });

  assert.equal(report.status, 'blocked');
  assert.ok(report.checks.some(check => check.id === 'case-insensitive-path-collisions' && check.severity === 'fail'));
});

test('linux compatibility report rejects Windows absolute paths in runtime files', () => {
  const report = buildLinuxCompatibilityReport({
    platform: 'linux',
    nodeVersion: 'v22.0.0',
    packageScripts: {
      clean: 'tsx scripts/clean-dist.ts',
    },
    files: [
      { path: 'src/lib/bad.ts', content: 'const cache = "C:\\\\Users\\\\kitau\\\\cache";' },
    ],
  });

  assert.equal(report.status, 'blocked');
  assert.ok(report.checks.some(check => check.id === 'windows-absolute-paths' && check.severity === 'fail'));
});
