import test from 'node:test';
import assert from 'node:assert/strict';

import type { GeoOssGapEntry, GeoOssGapStrategyReport } from './geoOpenSourceGapStrategy';
import {
  buildP0GazetteerRepositoryPlan,
  selectNextP0GazetteerGap,
  validateP0GazetteerRepositoryPlan,
} from './p0GazetteerRepositoryRotation';

function gap(countryCode: string, countryName: string, priority: GeoOssGapEntry['priority'] = 'P0-critical'): GeoOssGapEntry {
  return {
    countryCode,
    countryName,
    continent: 'europe',
    relativePath: `${countryCode}.json`,
    regionKind: 'country-or-main-region',
    priority,
    operationalClass: 'no-postal-code-weak-geo-oss',
    manualFallback: true,
    canBundleRedistributable: false,
    localCoreRoleCount: 0,
    redistributableLocalCoreRoleCount: 0,
    missingCoreRoles: ['address', 'geocoding', 'admin-boundary', 'gazetteer'],
    presentLocalCoreRoles: [],
    reasons: ['No local core geodata.'],
    proposedOpenSourcePackages: [`agid-open-${countryCode.toLowerCase()}-gazetteer`],
    firstActions: ['Create source ledger.'],
  };
}

test('builds a source-linked Belgium gazetteer repository plan', () => {
  const plan = buildP0GazetteerRepositoryPlan(gap('BE', 'Belgium'), 2, new Date('2026-07-01T00:00:00Z'));

  assert.equal(plan.repository, 'agid-open-be-gazetteer');
  assert.equal(plan.agidCountryId, 'agid:country:BE');
  assert.ok(plan.placeSeeds.length >= 8);
  assert.ok(plan.placeSeeds.some(place => place.name === 'Brussels'));
  assert.ok(plan.releaseGates.includes('no-raw-personal-addresses'));
  assert.deepEqual(validateP0GazetteerRepositoryPlan(plan), []);
});

test('rotates to the next P0 country-or-main-region after the last prepared code', () => {
  const report: GeoOssGapStrategyReport = {
    version: 'geo-open-source-gap-strategy-v1',
    generatedAt: '2026-07-01T00:00:00Z',
    totalPlans: 3,
    gapCount: 3,
    byPriority: {
      'P0-critical': 2,
      'P1-high': 1,
      'P2-medium': 0,
      watch: 0,
    },
    byContinent: { europe: 3 },
    openSourceBuildStrategy: [],
    entries: [
      gap('AX', 'Aland Islands'),
      gap('BE', 'Belgium'),
      { ...gap('CRIM', 'Crimea'), regionKind: 'disputed-region' },
    ],
  };

  assert.equal(selectNextP0GazetteerGap(report, 'AX')?.countryCode, 'BE');
  assert.equal(selectNextP0GazetteerGap(report, 'BE')?.countryCode, 'AX');
});
