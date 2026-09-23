import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import { join, relative } from 'node:path';

import {
  buildExternalOssGeoPostalIntegrationPlans,
} from './externalOssGeoPostalIntegration';
import {
  buildGeoOpenSourceGapStrategyReport,
} from './geoOpenSourceGapStrategy';
import {
  buildP1HighGeoRepositoryPlan,
  recoveryTrackForP1Entry,
} from './p1HighGeoRepositoryPlan';

const ADDRESS_FORMAT_ROOT = join(process.cwd(), 'src', 'data', 'address_formats');

function walkJsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walkJsonFiles(path) : path.endsWith('.json') ? [path] : [];
  });
}

function loadAddressFormats() {
  return walkJsonFiles(ADDRESS_FORMAT_ROOT).map(file => ({
    relativePath: relative(ADDRESS_FORMAT_ROOT, file),
    format: JSON.parse(readFileSync(file, 'utf8')),
  }));
}

test('builds a complete 33-item P1 high repository recovery plan from the current source catalog', () => {
  const externalPlans = buildExternalOssGeoPostalIntegrationPlans(loadAddressFormats());
  const gapReport = buildGeoOpenSourceGapStrategyReport(externalPlans, new Date('2026-07-02T00:00:00Z'));
  const p1Entries = gapReport.entries.filter(entry => entry.priority === 'P1-high');
  const plan = buildP1HighGeoRepositoryPlan(gapReport, new Date('2026-07-02T00:00:00Z'));

  assert.equal(p1Entries.length, 33);
  assert.equal(plan.targetCount, 33);
  assert.equal(plan.availableCount, 33);
  assert.equal(plan.selectedCount, 33);
  assert.equal(plan.items.length, 33);
  assert.equal(plan.waves.length, 3);
  assert.ok(plan.releaseGates.includes('one-present-core-role-must-be-named'));
  assert.ok(plan.releaseGates.includes('three-missing-core-roles-must-be-fixtured-or-blocked'));

  for (const [index, item] of plan.items.entries()) {
    assert.equal(item.rank, index + 1);
    assert.equal(item.wave, Math.ceil(item.rank / plan.waveSize));
    assert.equal(item.localCoreRoleCount, 1);
    assert.equal(item.missingCoreRoles.length, 3);
    assert.equal(item.canBundleRedistributable, false);
    assert.equal(item.manualFallback, true);
    assert.ok(item.repositorySet.length > 0, `${item.countryCode} needs at least one proposed repository`);
    assert.ok(item.definitionOfDone.some(step => step.includes('P1 high recovery package')));
    assert.ok(item.riskBoundary.some(risk => risk.includes('Manual fallback remains')));
    assert.equal(item.recoveryTrack, recoveryTrackForP1Entry(p1Entries[index]));
  }
});

test('P1 high waves stay balanced at 11 items each', () => {
  const externalPlans = buildExternalOssGeoPostalIntegrationPlans(loadAddressFormats());
  const gapReport = buildGeoOpenSourceGapStrategyReport(externalPlans, new Date('2026-07-02T00:00:00Z'));
  const plan = buildP1HighGeoRepositoryPlan(gapReport, new Date('2026-07-02T00:00:00Z'), {
    waveSize: 11,
  });

  assert.deepEqual(
    plan.waves.map(wave => wave.itemCount),
    [11, 11, 11],
  );
  assert.deepEqual(plan.waves[0].rankRange, [1, 11]);
  assert.deepEqual(plan.waves[2].rankRange, [23, 33]);
});
