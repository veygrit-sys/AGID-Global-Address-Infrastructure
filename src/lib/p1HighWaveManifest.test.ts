import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import type { P1HighGeoRepositoryPlan } from './p1HighGeoRepositoryPlan';
import { buildP1HighWaveManifest, P1_HIGH_WAVE_MANIFEST_VERSION } from './p1HighWaveManifest';
import { buildP1HighWaveRecoverySeed } from './p1HighWaveRecoverySeed';

const plan = JSON.parse(
  readFileSync('data/open_geo_repositories/p1-high-33-plan.json', 'utf8'),
) as P1HighGeoRepositoryPlan;

test('builds a source-review-ready P1 high wave manifest when core and fixtures exist', () => {
  const seed = buildP1HighWaveRecoverySeed(plan, 1);
  const expectedFiles = new Set(seed.packages.flatMap(pkg => [
    pkg.paths.readme,
    pkg.paths.sources,
    pkg.paths.qualityGates,
    ...pkg.paths.fixtures,
  ]));
  const manifest = buildP1HighWaveManifest(seed, path => expectedFiles.has(path));

  assert.equal(manifest.version, P1_HIGH_WAVE_MANIFEST_VERSION);
  assert.equal(manifest.wave, 1);
  assert.equal(manifest.packageCount, seed.packageCount);
  assert.equal(manifest.coreCompleteCount, seed.packageCount);
  assert.equal(manifest.fixtureCompleteCount, seed.packageCount);
  assert.equal(manifest.sourceReviewReadyCount, seed.packageCount);
  assert.ok(manifest.packages.every(pkg => pkg.readiness === 'source-review-ready'));
});

test('P1 high manifest distinguishes core incomplete from fixture incomplete', () => {
  const seed = buildP1HighWaveRecoverySeed(plan, 1);
  const sample = seed.packages[0];
  const coreOnly = new Set([sample.paths.readme, sample.paths.sources, sample.paths.qualityGates]);
  const noSources = new Set([sample.paths.readme, sample.paths.qualityGates]);

  const coreOnlyManifest = buildP1HighWaveManifest(
    { ...seed, packages: [sample], packageCount: 1 },
    path => coreOnly.has(path),
  );
  assert.equal(coreOnlyManifest.packages[0].readiness, 'fixture-incomplete');
  assert.equal(coreOnlyManifest.coreCompleteCount, 1);
  assert.equal(coreOnlyManifest.fixtureCompleteCount, 0);

  const coreMissingManifest = buildP1HighWaveManifest(
    { ...seed, packages: [sample], packageCount: 1 },
    path => noSources.has(path),
  );
  assert.equal(coreMissingManifest.packages[0].readiness, 'core-incomplete');
  assert.equal(coreMissingManifest.coreCompleteCount, 0);
});

test('P1 high manifest carries non-claims into machine-readable package records', () => {
  const seed = buildP1HighWaveRecoverySeed(plan, 1);
  const manifest = buildP1HighWaveManifest(seed, () => true);

  for (const pkg of manifest.packages) {
    assert.ok(pkg.nonClaims.some(claim => claim.includes('not a complete country or territory address dataset')));
    assert.ok(pkg.nonClaims.some(claim => claim.includes('does not prove delivery availability')));
    assert.equal(pkg.coreFiles.missing.length, 0);
    assert.equal(pkg.fixtureFiles.missing.length, 0);
  }
});
