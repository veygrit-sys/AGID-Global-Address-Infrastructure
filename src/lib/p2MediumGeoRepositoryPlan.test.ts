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
  buildP2MediumGeoRepositoryPlan,
  stageForP2Entry,
} from './p2MediumGeoRepositoryPlan';

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

test('builds a complete 200-item P2 medium repository plan from the current source catalog', () => {
  const externalPlans = buildExternalOssGeoPostalIntegrationPlans(loadAddressFormats());
  const gapReport = buildGeoOpenSourceGapStrategyReport(externalPlans, new Date('2026-07-02T00:00:00Z'));
  const p2Entries = gapReport.entries.filter(entry => entry.priority === 'P2-medium');
  const plan = buildP2MediumGeoRepositoryPlan(gapReport, new Date('2026-07-02T00:00:00Z'));

  assert.equal(p2Entries.length, 200);
  assert.equal(plan.targetCount, 200);
  assert.equal(plan.availableCount, 200);
  assert.equal(plan.selectedCount, 200);
  assert.equal(plan.items.length, 200);
  assert.equal(plan.waves.length, 8);
  assert.ok(plan.releaseGates.includes('conformance-vectors-required'));
  assert.ok(plan.operatingPrinciples.some(principle => principle.includes('Do not create empty repositories')));

  for (const [index, item] of plan.items.entries()) {
    assert.equal(item.rank, index + 1);
    assert.equal(item.wave, Math.ceil(item.rank / plan.waveSize));
    assert.ok(item.repositorySet.length > 0, `${item.countryCode} needs at least one proposed repository`);
    assert.ok(item.definitionOfDone.some(step => step.includes('sources.json')));
    assert.ok(item.riskBoundary.some(risk => risk.includes('Do not bundle upstream sources')));
    assert.equal(item.stage, stageForP2Entry(p2Entries[index]));
  }
});

test('P2 medium waves stay balanced at 25 items each', () => {
  const externalPlans = buildExternalOssGeoPostalIntegrationPlans(loadAddressFormats());
  const gapReport = buildGeoOpenSourceGapStrategyReport(externalPlans, new Date('2026-07-02T00:00:00Z'));
  const plan = buildP2MediumGeoRepositoryPlan(gapReport, new Date('2026-07-02T00:00:00Z'), {
    targetCount: 200,
    waveSize: 25,
  });

  assert.deepEqual(
    plan.waves.map(wave => wave.itemCount),
    [25, 25, 25, 25, 25, 25, 25, 25],
  );
  assert.deepEqual(plan.waves[0].rankRange, [1, 25]);
  assert.deepEqual(plan.waves[7].rankRange, [176, 200]);
});
