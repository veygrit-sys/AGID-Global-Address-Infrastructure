import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import type { P1HighGeoRepositoryPlan } from './p1HighGeoRepositoryPlan';
import { buildP1HighWaveRecoverySeed } from './p1HighWaveRecoverySeed';
import {
  buildP1HighWaveRepositoryFiles,
  filterP1HighWaveRepositoryFiles,
  P1_HIGH_WAVE_REPOSITORY_FILES_VERSION,
} from './p1HighWaveRepositoryFiles';

const plan = JSON.parse(
  readFileSync('data/open_geo_repositories/p1-high-33-plan.json', 'utf8'),
) as P1HighGeoRepositoryPlan;

const forbiddenRawMaterial = /\b(raw_address|recipient_phone|private_key|proof_witness|mnemonic|seed_phrase)\b/i;

test('builds P1 high wave repository files from recovery seed packages', () => {
  const seed = buildP1HighWaveRecoverySeed(plan, 1);
  const files = buildP1HighWaveRepositoryFiles(seed);

  assert.equal(P1_HIGH_WAVE_REPOSITORY_FILES_VERSION, 'p1-high-wave-repository-files-v0.1');
  assert.ok(files.length > seed.packageCount * 3);
  for (const pkg of seed.packages) {
    assert.ok(files.some(file => file.path === pkg.paths.readme), `${pkg.repository} README missing`);
    assert.ok(files.some(file => file.path === pkg.paths.sources), `${pkg.repository} sources missing`);
    assert.ok(files.some(file => file.path === pkg.paths.qualityGates), `${pkg.repository} gates missing`);
  }
});

test('P1 high generated files avoid raw address and proof-secret material', () => {
  const seed = buildP1HighWaveRecoverySeed(plan, 1);
  const files = buildP1HighWaveRepositoryFiles(seed);

  for (const file of files) {
    assert.doesNotMatch(file.content, forbiddenRawMaterial, file.path);
    assert.match(file.path, /^data\/open_geo_repositories\/agid-open-/);
  }
});

test('P1 high README and fixtures make missing-role recovery explicit', () => {
  const seed = buildP1HighWaveRecoverySeed(plan, 1);
  const files = buildP1HighWaveRepositoryFiles(seed);
  const nonLicensePackage = seed.packages.find(pkg => pkg.kind !== 'license-ledger');
  assert.ok(nonLicensePackage);

  const readme = files.find(file => file.path === nonLicensePackage.paths.readme);
  assert.ok(readme);
  assert.match(readme.content, /P1 high AGID open-geodata recovery seed/);
  assert.match(readme.content, /Present local core role/);
  assert.match(readme.content, /Missing core roles/);
  assert.match(readme.content, /not a complete country or territory address dataset/);

  assert.ok(files.some(file => file.path.endsWith('/fixtures/missing-role-recovery.json')));
  assert.ok(files.some(file => file.path.endsWith('/fixtures/manual-fallback-trigger.json')));
  assert.ok(files.some(file => file.path.endsWith('/fixtures/non-claim-conformance.json')));
});

test('P1 high sources keep upstream data out until license review', () => {
  const seed = buildP1HighWaveRecoverySeed(plan, 1);
  const files = buildP1HighWaveRepositoryFiles(seed);
  const sourcesFile = files.find(file => file.path.endsWith('/sources.json'));
  assert.ok(sourcesFile);

  const sources = JSON.parse(sourcesFile.content) as {
    sources: Array<{ ingestionStatus: string; redistributionStatus: string }>;
  };
  assert.ok(sources.sources.some(source => source.ingestionStatus === 'metadata-linked'));
  assert.ok(sources.sources.some(source => source.ingestionStatus === 'synthetic-fixture-only'));
  assert.ok(sources.sources.every(source => source.redistributionStatus !== 'bundled'));
});

test('P1 high repository files can be narrowed to core files before fixture materialization', () => {
  const seed = buildP1HighWaveRecoverySeed(plan, 1);
  const files = buildP1HighWaveRepositoryFiles(seed);
  const coreFiles = filterP1HighWaveRepositoryFiles(files, 'core');

  assert.equal(coreFiles.length, seed.packageCount * 3);
  assert.ok(coreFiles.every(file =>
    file.path.endsWith('/README.md')
    || file.path.endsWith('/sources.json')
    || file.path.endsWith('/quality-gates.json')));
  assert.ok(files.length > coreFiles.length);
  assert.equal(filterP1HighWaveRepositoryFiles(files, 'all').length, files.length);
});

test('P1 high repository files can add fixtures after core materialization', () => {
  const seed = buildP1HighWaveRecoverySeed(plan, 1);
  const files = buildP1HighWaveRepositoryFiles(seed);
  const coreFiles = filterP1HighWaveRepositoryFiles(files, 'core');
  const fixtureFiles = filterP1HighWaveRepositoryFiles(files, 'fixtures');

  assert.equal(coreFiles.length + fixtureFiles.length, files.length);
  assert.ok(fixtureFiles.length > 0);
  assert.ok(fixtureFiles.every(file => file.path.includes('/fixtures/')));
  assert.ok(fixtureFiles.some(file => file.path.endsWith('/fixtures/manual-fallback-trigger.json')));
  assert.ok(fixtureFiles.some(file => file.path.endsWith('/fixtures/non-claim-conformance.json')));
});
