import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
  auditOceanRepositoryAllocation,
  auditRepositoryPlacementUnit,
  auditRepositorySplitAllocation,
  flattenRepositoryPlacementData,
} from './repositorySplitAllocationAudit';

const repositoryPlacement = JSON.parse(
  readFileSync('data/global_entities/agid-repository-placement.json', 'utf8'),
);

const oceanPlacement = JSON.parse(
  readFileSync('data/global_entities/agid-ocean-repository-placement.json', 'utf8'),
);

test('global repository placement has a healthy single/split balance', () => {
  const units = flattenRepositoryPlacementData(repositoryPlacement);
  const audit = auditRepositorySplitAllocation(units);

  assert.equal(audit.summary.totalUnits, 270);
  assert.equal(audit.summary.splitUnits, 46);
  assert.equal(audit.summary.singleUnits, 223);
  assert.equal(audit.summary.polarUnits, 1);
  assert.equal(audit.summary.childRepoPlanCount, 1918);
  assert.equal(audit.summary.logicalRepoUpperBound, 2188);
  assert.equal(audit.summary.reviseFindings, 0);
});

test('watchlisted single-repo countries stay single until evidence justifies a split', () => {
  const units = flattenRepositoryPlacementData(repositoryPlacement);
  const byCode = new Map(units.map(unit => [unit.code, unit]));

  for (const code of ['AE', 'BE', 'HK', 'NZ']) {
    const finding = auditRepositoryPlacementUnit(byCode.get(code)!);
    assert.equal(finding.verdict, 'watch');
    assert.equal(finding.childCount, 0);
    assert.equal(finding.physicalStage, 'single-repo-now');
    assert.match(finding.nextAction, /Keep one public repository now/);
  }
});

test('large split countries are logical plans with staged physical GitHub creation', () => {
  const units = flattenRepositoryPlacementData(repositoryPlacement);
  const byCode = new Map(units.map(unit => [unit.code, unit]));

  for (const code of ['CN', 'IN', 'JP', 'PH', 'RU', 'TH', 'TR', 'US']) {
    const finding = auditRepositoryPlacementUnit(byCode.get(code)!);
    assert.equal(finding.verdict, 'accept');
    assert.equal(finding.physicalStage, 'parent-plus-priority-children');
    assert.ok(finding.childCount > 40);
  }
});

test('small split plans are not treated as immediate child repository creation', () => {
  const units = flattenRepositoryPlacementData(repositoryPlacement);
  const byCode = new Map(units.map(unit => [unit.code, unit]));

  for (const code of ['ET', 'NG', 'PE', 'PK', 'ZA']) {
    const finding = auditRepositoryPlacementUnit(byCode.get(code)!);
    assert.equal(finding.verdict, 'watch');
    assert.equal(finding.physicalStage, 'parent-repo-now');
    assert.ok(finding.childCount > 0 && finding.childCount <= 8);
  }
});

test('antarctica remains a single polar area pack', () => {
  const units = flattenRepositoryPlacementData(repositoryPlacement);
  const antarctica = units.find(unit => unit.code === 'AQ');

  assert.ok(antarctica);
  const finding = auditRepositoryPlacementUnit(antarctica);
  assert.equal(finding.verdict, 'accept');
  assert.equal(finding.physicalStage, 'single-repo-now');
  assert.equal(finding.childCount, 0);
});

test('ocean placement is valid and natural features stay inside packs', () => {
  const seaRepositoryCount = oceanPlacement.oceanRepositories.flatMap(
    (ocean: { childSeaRepositories: unknown[] }) => ocean.childSeaRepositories,
  ).length;

  const result = auditOceanRepositoryAllocation({
    rootRepository: oceanPlacement.root.repository,
    oceanRepositoryCount: oceanPlacement.oceanRepositories.length,
    seaRepositoryCount,
    mountainsIndependentRepository: oceanPlacement.naturalFeaturePolicy.mountains.independentRepository,
    desertsIndependentRepository: oceanPlacement.naturalFeaturePolicy.deserts.independentRepository,
  });

  assert.equal(oceanPlacement.root.repository, 'agid-ocean');
  assert.equal(oceanPlacement.oceanRepositories.length, 5);
  assert.equal(seaRepositoryCount, 160);
  assert.equal(result.verdict, 'accept');
});
