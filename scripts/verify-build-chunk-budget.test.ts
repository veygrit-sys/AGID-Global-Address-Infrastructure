import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./verify-build-chunk-budget.ts', import.meta.url), 'utf8');
const releaseAssetsSource = readFileSync(new URL('./verify-release-build-assets.ts', import.meta.url), 'utf8');
const ossLaunchSource = readFileSync(new URL('./verify-oss-launch.ts', import.meta.url), 'utf8');
const improvementLoopDocs = readFileSync(new URL('../docs/continuous-improvement-loop.md', import.meta.url), 'utf8');
const commercialBoundaryChangeSet = readFileSync(new URL('../docs/commercial-boundary-change-set.md', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const packageJson = readFileSync(new URL('../package.json', import.meta.url), 'utf8');

test('build chunk budget report includes build artifact freshness evidence', () => {
  assert.match(source, /mtimeMs/);
  assert.match(source, /newestAssetAgeMinutes/);
  assert.match(source, /Newest asset:/);
  assert.match(source, /age=/);
});

test('build chunk budget supports an opt-in maximum artifact age gate', () => {
  assert.match(source, /AGID_BUILD_BUDGET_MAX_AGE_MINUTES/);
  assert.match(source, /must be a non-negative number/);
  assert.match(source, /Build output is stale/);
  assert.match(source, /Max asset age:/);
});

test('release docs describe fresh-build asset budget enforcement', () => {
  assert.match(improvementLoopDocs, /npm run verify:build-chunk-budget/);
  assert.match(improvementLoopDocs, /AGID_BUILD_BUDGET_MAX_AGE_MINUTES/);
  assert.match(readme, /npm run verify:release-build-assets/);
  assert.match(readme, /build, asset-budget, and PWA checks in order/);
});

test('release build assets command fixes build, asset budget, and pwa order', () => {
  assert.match(packageJson, /"verify:release-build-assets": "tsx scripts\/verify-release-build-assets\.ts"/);
  assert.match(releaseAssetsSource, /AGID_BUILD_BUDGET_MAX_AGE_MINUTES.*'30'/);
  assert.match(releaseAssetsSource, /npm_execpath/);
  assert.match(releaseAssetsSource, /npmBaseArgs/);
  assert.match(releaseAssetsSource, /label: 'build'[\s\S]*label: 'verify:build-chunk-budget'[\s\S]*label: 'verify:pwa'/);
  assert.match(releaseAssetsSource, /shell: !npmExecPath && process\.platform === 'win32'/);
});

test('oss launch includes release build asset gates', () => {
  assert.match(ossLaunchSource, /label: 'verify:release-build-assets'/);
  assert.match(ossLaunchSource, /scripts\/verify-release-build-assets\.ts/);
});

test('oss launch includes repository owner routing boundary gate', () => {
  assert.match(ossLaunchSource, /label: 'verify:repository-owner-routing'/);
  assert.match(ossLaunchSource, /src\/lib\/repositoryOwnerRouting\.test\.ts/);
  assert.match(ossLaunchSource, /label: 'verify:commercial-boundary-review'/);
  assert.match(ossLaunchSource, /scripts\/verify-commercial-boundary-review\.ts/);
  assert.match(commercialBoundaryChangeSet, /npm run verify:oss-launch/);
  assert.match(commercialBoundaryChangeSet, /npm run verify:repository-owner-routing/);
  assert.match(commercialBoundaryChangeSet, /npm run verify:commercial-boundary-review/);
  assert.match(commercialBoundaryChangeSet, /full release gate also includes the routing check/i);
});

test('oss launch includes Veygrit Address Login package publication gate', () => {
  assert.match(ossLaunchSource, /label: 'verify:veygrit-address-login-packages'/);
  assert.match(ossLaunchSource, /scripts\/verify-veygrit-address-login-packages\.ts/);
});
