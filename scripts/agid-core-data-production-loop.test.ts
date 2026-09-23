import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createCoreDataProductionReport,
  flattenCoreDataUnits,
  parseCoreDataLedger,
  summarizeCoreDataProgress,
  type CoreDataPlacement,
} from './agid-core-data-production-loop';

const placement: CoreDataPlacement = {
  version: 'test-placement',
  continents: [
    {
      id: 'europe',
      order: 2,
      regions: [
        {
          id: 'western_europe',
          countries: [
            {
              code: 'DE',
              name: 'Germany',
              repository: 'agid-country-de',
              splitStrategy: 'country-index-plus-child-repositories',
              recommendedChildren: ['agid-de-by', 'agid-de-berlin'],
            },
          ],
        },
      ],
    },
    {
      id: 'asia',
      order: 1,
      regions: [
        {
          id: 'east_asia',
          countries: [
            {
              code: 'JP',
              name: 'Japan',
              repository: 'agid-country-jp',
              splitStrategy: 'single-country-or-territory-pack',
              recommendedChildren: [],
            },
            {
              code: 'CN',
              name: 'China',
              repository: 'agid-country-cn',
              splitStrategy: 'country-index-plus-child-repositories',
              recommendedChildren: ['agid-cn-bj', 'agid-cn-sh'],
            },
          ],
        },
      ],
    },
  ],
};

test('flattens core data units in Asia-first order and includes child repositories', () => {
  const units = flattenCoreDataUnits(placement);

  assert.deepEqual(
    units.map(unit => unit.repository),
    ['agid-country-jp', 'agid-country-cn', 'agid-cn-bj', 'agid-cn-sh', 'agid-country-de', 'agid-de-by', 'agid-de-berlin'],
  );
  assert.equal(units.find(unit => unit.repository === 'agid-country-cn')?.kind, 'country-index');
  assert.equal(units.find(unit => unit.repository === 'agid-cn-bj')?.parentRepository, 'agid-country-cn');
});

test('summarizes remaining counts and keeps the first in-progress unit selected', () => {
  const units = flattenCoreDataUnits(placement);
  const entries = parseCoreDataLedger([
    JSON.stringify({
      generatedAt: '2026-06-28T00:00:00.000Z',
      status: 'completed',
      unitId: 'agid-country-jp',
      repository: 'agid-country-jp',
      continent: 'asia',
      region: 'east_asia',
      countryCode: 'JP',
    }),
    JSON.stringify({
      generatedAt: '2026-06-28T00:10:00.000Z',
      status: 'started',
      unitId: 'agid-cn-bj',
      repository: 'agid-cn-bj',
      continent: 'asia',
      region: 'east_asia',
      countryCode: 'CN',
    }),
  ].join('\n'));

  const summary = summarizeCoreDataProgress(units, entries);

  assert.equal(summary.totalUnits, 7);
  assert.equal(summary.completedUnits, 1);
  assert.equal(summary.remainingUnits, 6);
  assert.equal(summary.selectedUnit?.repository, 'agid-cn-bj');
  assert.equal(summary.selectedWasAlreadyInProgress, true);
  assert.equal(summary.remainingByContinent.asia, 3);
  assert.equal(summary.remainingByContinent.europe, 3);
});

test('creates a report with the selected unit and remaining count for the ledger', () => {
  const report = createCoreDataProductionReport({
    placement,
    entries: [],
    ledgerPath: 'reports/agid-core-data-production-ledger.jsonl',
    dryRun: true,
  });

  assert.equal(report.placementVersion, 'test-placement');
  assert.equal(report.totalUnits, 7);
  assert.equal(report.remainingUnits, 7);
  assert.equal(report.selectedUnit?.repository, 'agid-country-jp');
  assert.match(report.nextAction, /remaining 7/);
});
