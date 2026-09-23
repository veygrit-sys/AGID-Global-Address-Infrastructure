import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildP0IslandCoverageAudit,
  selectNextP0IslandExpansionTarget,
} from './p0IslandCoverageAudit';

test('audits exact all-island P0 packs without overclaiming incomplete island scopes', () => {
  const audit = buildP0IslandCoverageAudit();
  const rows = new Map(audit.rows.map(row => [row.countryCode, row]));

  assert.equal(audit.summary.targetCount, 8);
  assert.equal(rows.get('PN')?.status, 'passing');
  assert.equal(rows.get('PN')?.currentIslandSeeds, 4);
  assert.equal(rows.get('KI')?.status, 'passing');
  assert.equal(rows.get('KI')?.currentIslandSeeds, 33);
  assert.equal(rows.get('KI')?.matchingGatePresent, true);
  assert.equal(rows.get('KI')?.overclaimGuardPresent, true);
});

test('keeps Faroe Islands as complete main-island coverage rather than all-islet coverage', () => {
  const row = buildP0IslandCoverageAudit().rows.find(entry => entry.countryCode === 'FO');

  assert.equal(row?.mode, 'complete-main-islands');
  assert.equal(row?.status, 'passing');
  assert.equal(row?.currentIslandSeeds, 18);
  assert.equal(row?.overclaimGuardPresent, true);
  assert.match(row?.nextSmallestImprovement ?? '', /islet\/skerry backlog/);
});

test('selects the next island-expansion target from deferred P0 island scopes', () => {
  const audit = buildP0IslandCoverageAudit();
  const deferred = audit.rows.filter(row => row.status === 'deferred');
  const next = selectNextP0IslandExpansionTarget();

  assert.ok(deferred.length >= 4);
  assert.equal(next?.countryCode, 'MH');
  assert.equal(next?.mode, 'administrative-coverage-island-expansion-needed');
  assert.equal(next?.currentIslandSeeds, 34);
  assert.match(next?.nextSmallestImprovement ?? '', /all-islet inventory/);
});
