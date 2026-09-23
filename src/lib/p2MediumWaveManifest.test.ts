import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import type { P2MediumGeoRepositoryPlan } from './p2MediumGeoRepositoryPlan';
import { buildP2MediumWaveManifest, P2_MEDIUM_WAVE_MANIFEST_VERSION } from './p2MediumWaveManifest';
import { buildP2MediumWavePackageSeed } from './p2MediumWavePackageSeed';

const plan = JSON.parse(
  readFileSync('data/open_geo_repositories/p2-medium-200-plan.json', 'utf8'),
) as P2MediumGeoRepositoryPlan;

test('builds a source-review-ready P2 medium wave manifest when core and fixtures exist', () => {
  const seed = buildP2MediumWavePackageSeed(plan, 1);
  const expectedFiles = new Set(seed.packages.flatMap(pkg => [
    pkg.paths.readme,
    pkg.paths.sources,
    pkg.paths.qualityGates,
    ...pkg.paths.fixtures,
  ]));
  const manifest = buildP2MediumWaveManifest(seed, path => expectedFiles.has(path));

  assert.equal(manifest.version, P2_MEDIUM_WAVE_MANIFEST_VERSION);
  assert.equal(manifest.wave, 1);
  assert.equal(manifest.packageCount, seed.packageCount);
  assert.equal(manifest.coreCompleteCount, seed.packageCount);
  assert.equal(manifest.fixtureCompleteCount, seed.packageCount);
  assert.equal(manifest.sourceReviewReadyCount, seed.packageCount);
});

test('P2 medium manifest distinguishes core incomplete from fixture incomplete', () => {
  const seed = buildP2MediumWavePackageSeed(plan, 1);
  const sample = seed.packages[0];
  const coreOnly = new Set([sample.paths.readme, sample.paths.sources, sample.paths.qualityGates]);
  const empty = new Set<string>();

  const coreOnlyManifest = buildP2MediumWaveManifest(
    { ...seed, packages: [sample], packageCount: 1 },
    path => coreOnly.has(path),
  );
  assert.equal(coreOnlyManifest.packages[0].readiness, 'fixture-incomplete');
  assert.equal(coreOnlyManifest.coreCompleteCount, 1);
  assert.equal(coreOnlyManifest.fixtureCompleteCount, 0);

  const missingManifest = buildP2MediumWaveManifest(
    { ...seed, packages: [sample], packageCount: 1 },
    path => empty.has(path),
  );
  assert.equal(missingManifest.packages[0].readiness, 'core-incomplete');
  assert.equal(missingManifest.coreCompleteCount, 0);
});

test('P2 medium manifest carries non-claims into machine-readable package records', () => {
  const seed = buildP2MediumWavePackageSeed(plan, 1);
  const manifest = buildP2MediumWaveManifest(seed, () => true);

  for (const pkg of manifest.packages) {
    assert.ok(pkg.nonClaims.some(claim => claim.includes('does not claim complete national address coverage')));
    assert.ok(pkg.nonClaims.some(claim => claim.includes('does not prove delivery, postal, legal, or cadastral authority')));
    assert.equal(pkg.coreFiles.missing.length, 0);
    assert.equal(pkg.fixtureFiles.missing.length, 0);
  }
});
