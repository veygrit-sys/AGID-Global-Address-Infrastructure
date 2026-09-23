import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import type { P2MediumGeoRepositoryPlan } from './p2MediumGeoRepositoryPlan';
import {
  buildP2MediumWavePackageSeed,
  P2_MEDIUM_WAVE_PACKAGE_SEED_VERSION,
} from './p2MediumWavePackageSeed';

const plan = JSON.parse(
  readFileSync('data/open_geo_repositories/p2-medium-200-plan.json', 'utf8'),
) as P2MediumGeoRepositoryPlan;

test('builds P2 medium wave 1 into source-ledger-ready seed packages', () => {
  const seed = buildP2MediumWavePackageSeed(plan, 1);
  const waveOneItems = plan.items.filter(item => item.wave === 1);
  const expectedPackageCount = waveOneItems.reduce((count, item) => count + item.repositorySet.length, 0);

  assert.equal(seed.version, P2_MEDIUM_WAVE_PACKAGE_SEED_VERSION);
  assert.equal(seed.wave, 1);
  assert.equal(seed.itemCount, 25);
  assert.equal(seed.packageCount, expectedPackageCount);
  assert.equal(seed.sourceLedgerCoverage.required, expectedPackageCount);
  assert.equal(seed.sourceLedgerCoverage.present, expectedPackageCount);
  assert.deepEqual(seed.sourceLedgerCoverage.missing, []);
  assert.ok(seed.packagesByKind['license-ledger'] > 0);
  assert.ok(seed.packagesByKind['geocoder-fixtures'] > 0);
  assert.ok(seed.packagesByKind['address-candidates'] > 0);
});

test('P2 medium seed packages are metadata-first and do not overclaim country coverage', () => {
  const seed = buildP2MediumWavePackageSeed(plan, 1);

  for (const pkg of seed.packages) {
    assert.match(pkg.repository, /^agid-open-/);
    assert.match(pkg.paths.readme, new RegExp(`${pkg.repository.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/README\\.md$`));
    assert.match(pkg.paths.sources, /\/sources\.json$/);
    assert.match(pkg.paths.qualityGates, /\/quality-gates\.json$/);
    assert.ok(pkg.paths.fixtures.length > 0, `${pkg.repository} needs synthetic fixtures`);
    assert.ok(pkg.nonClaims.some(claim => claim.includes('does not claim complete national address coverage')));
    assert.ok(pkg.nonClaims.some(claim => claim.includes('does not prove delivery, postal, legal, or cadastral authority')));
    assert.ok(pkg.firstActions.some(action => action.includes('before any remote repository creation')));
    assert.notEqual(pkg.publicationState, undefined);
  }
});

test('P2 medium wave package seed supports later waves without creating empty repositories', () => {
  const seed = buildP2MediumWavePackageSeed(plan, 8);

  assert.equal(seed.wave, 8);
  assert.equal(seed.itemCount, 25);
  assert.ok(seed.packageCount >= 25);
  assert.equal(seed.sourceLedgerCoverage.present, seed.packageCount);
  assert.ok(seed.releaseGates.includes('synthetic-fixtures-first'));
  assert.ok(seed.releaseGates.includes('redistribution-review-before-import'));
});
