import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import type { P1HighGeoRepositoryPlan } from './p1HighGeoRepositoryPlan';
import {
  buildP1HighWaveRecoverySeed,
  P1_HIGH_WAVE_RECOVERY_SEED_VERSION,
} from './p1HighWaveRecoverySeed';

const plan = JSON.parse(
  readFileSync('data/open_geo_repositories/p1-high-33-plan.json', 'utf8'),
) as P1HighGeoRepositoryPlan;

test('builds P1 high wave 1 into recovery seed packages', () => {
  const seed = buildP1HighWaveRecoverySeed(plan, 1);
  const waveOneItems = plan.items.filter(item => item.wave === 1);
  const expectedPackageCount = waveOneItems.reduce((count, item) => count + item.repositorySet.length, 0);

  assert.equal(seed.version, P1_HIGH_WAVE_RECOVERY_SEED_VERSION);
  assert.equal(seed.wave, 1);
  assert.equal(seed.itemCount, 11);
  assert.equal(seed.packageCount, expectedPackageCount);
  assert.equal(seed.manualFallbackPolicy, 'required-until-conformance-pass');
  assert.equal(seed.missingRoleCoverage.required, expectedPackageCount);
  assert.equal(seed.missingRoleCoverage.fixturedOrBlocked, expectedPackageCount);
  assert.deepEqual(seed.missingRoleCoverage.missing, []);
  assert.ok(seed.packagesByKind['license-ledger'] > 0);
  assert.ok(seed.packagesByKind['geocoder-fixtures'] > 0);
});

test('P1 high recovery packages keep one present role and three missing roles explicit', () => {
  const seed = buildP1HighWaveRecoverySeed(plan, 1);

  for (const pkg of seed.packages) {
    assert.match(pkg.repository, /^agid-open-/);
    assert.ok(pkg.presentRole.length > 0);
    assert.equal(pkg.missingRoles.length, 3);
    assert.match(pkg.paths.readme, /\/README\.md$/);
    assert.match(pkg.paths.sources, /\/sources\.json$/);
    assert.match(pkg.paths.qualityGates, /\/quality-gates\.json$/);
    assert.ok(pkg.paths.fixtures.some(path => path.endsWith('/fixtures/manual-fallback-trigger.json')) || pkg.kind === 'license-ledger');
    assert.ok(pkg.recoveryAssertions.some(assertion => assertion.includes('Exactly one local core role')));
    assert.ok(pkg.recoveryAssertions.some(assertion => assertion.includes('Manual fallback remains required')));
    assert.ok(pkg.nonClaims.some(claim => claim.includes('not a complete country or territory address dataset')));
    assert.ok(pkg.firstActions.some(action => action.includes('before any remote repository creation')));
  }
});

test('P1 high recovery seed supports all waves and blocks overclaiming before promotion', () => {
  for (const wave of [1, 2, 3]) {
    const seed = buildP1HighWaveRecoverySeed(plan, wave);

    assert.equal(seed.itemCount, 11);
    assert.ok(seed.packageCount >= 11);
    assert.equal(seed.missingRoleCoverage.fixturedOrBlocked, seed.packageCount);
    assert.ok(seed.releaseGates.includes('manual-fallback-visible'));
    assert.ok(seed.releaseGates.includes('promotion-to-p2-requires-conformance-pass'));
    assert.ok(seed.packages.every(pkg => pkg.publicationState !== undefined));
  }
});
