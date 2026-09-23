import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import type { P2MediumGeoRepositoryPlan } from './p2MediumGeoRepositoryPlan';
import { buildP2MediumWavePackageSeed } from './p2MediumWavePackageSeed';
import {
  buildP2MediumWaveRepositoryFiles,
  filterP2MediumWaveRepositoryFiles,
  P2_MEDIUM_WAVE_REPOSITORY_FILES_VERSION,
} from './p2MediumWaveRepositoryFiles';

const plan = JSON.parse(
  readFileSync('data/open_geo_repositories/p2-medium-200-plan.json', 'utf8'),
) as P2MediumGeoRepositoryPlan;

const forbiddenRawMaterial = /\b(raw_address|recipient_phone|private_key|proof_witness|mnemonic|seed_phrase)\b/i;

test('builds P2 medium wave repository files from seed packages', () => {
  const seed = buildP2MediumWavePackageSeed(plan, 1);
  const files = buildP2MediumWaveRepositoryFiles(seed);

  assert.equal(P2_MEDIUM_WAVE_REPOSITORY_FILES_VERSION, 'p2-medium-wave-repository-files-v0.1');
  assert.ok(files.length > seed.packageCount * 3);
  for (const pkg of seed.packages) {
    assert.ok(files.some(file => file.path === pkg.paths.readme), `${pkg.repository} README missing`);
    assert.ok(files.some(file => file.path === pkg.paths.sources), `${pkg.repository} sources missing`);
    assert.ok(files.some(file => file.path === pkg.paths.qualityGates), `${pkg.repository} gates missing`);
  }
});

test('P2 medium generated files stay synthetic and metadata-first', () => {
  const seed = buildP2MediumWavePackageSeed(plan, 1);
  const files = buildP2MediumWaveRepositoryFiles(seed);

  for (const file of files) {
    assert.doesNotMatch(file.content, forbiddenRawMaterial, file.path);
    assert.match(file.path, /^data\/open_geo_repositories\/agid-open-/);
  }

  const sourcesFiles = files.filter(file => file.path.endsWith('/sources.json'));
  assert.ok(sourcesFiles.length > 0);
  for (const file of sourcesFiles) {
    const sources = JSON.parse(file.content) as { upstreamDataBundled: boolean; redistributionStatus: string };
    assert.equal(sources.upstreamDataBundled, false);
    assert.equal(sources.redistributionStatus, 'review-required-before-import');
  }
});

test('P2 medium README and fixtures block complete coverage and delivery claims', () => {
  const seed = buildP2MediumWavePackageSeed(plan, 1);
  const files = buildP2MediumWaveRepositoryFiles(seed);
  const samplePackage = seed.packages.find(pkg => pkg.kind !== 'license-ledger');
  assert.ok(samplePackage);

  const readme = files.find(file => file.path === samplePackage.paths.readme);
  assert.ok(readme);
  assert.match(readme.content, /P2 medium AGID open-geodata seed package/);
  assert.match(readme.content, /does not claim complete national address coverage/);
  assert.match(readme.content, /does not prove delivery, postal, legal, or cadastral authority/);

  const candidateFixture = files.find(file => file.path.endsWith('/fixtures/synthetic-candidate-conformance.json'));
  assert.ok(candidateFixture);
  assert.match(candidateFixture.content, /manual-review-on-low-confidence/);
  assert.match(candidateFixture.content, /no-delivery-or-legal-claim/);

  const confidenceFixture = files.find(file => file.path.endsWith('/fixtures/source-confidence-conformance.json'));
  assert.ok(confidenceFixture);
  assert.match(confidenceFixture.content, /missing-license-review/);
  assert.match(confidenceFixture.content, /complete-coverage-claim/);
});

test('P2 medium repository files can be narrowed to core files before fixture materialization', () => {
  const seed = buildP2MediumWavePackageSeed(plan, 1);
  const files = buildP2MediumWaveRepositoryFiles(seed);
  const coreFiles = filterP2MediumWaveRepositoryFiles(files, 'core');

  assert.equal(coreFiles.length, seed.packageCount * 3);
  assert.ok(coreFiles.every(file =>
    file.path.endsWith('/README.md')
    || file.path.endsWith('/sources.json')
    || file.path.endsWith('/quality-gates.json')));
  assert.ok(files.length > coreFiles.length);
  assert.equal(filterP2MediumWaveRepositoryFiles(files, 'all').length, files.length);
});
