import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';

type OceanPlacement = {
  root: { repository: string };
  oceanRepositories: Array<{
    id: string;
    repository: string;
    childSeaRepositoryCount: number;
    childSeaRepositories: Array<{
      id: string;
      name: string;
      repository: string;
      parentOcean: string;
      sourceIds: string[];
      recordCount: number;
      storesPreciseAddress: false;
      requiredFields: string[];
    }>;
  }>;
  naturalFeaturePolicy: Record<string, {
    independentRepository: boolean;
    storage: string;
    minimumFields: string[];
    fallbackReference: string;
  }>;
};

async function readPlacement() {
  const text = await readFile(
    path.join(process.cwd(), 'data/global_entities/agid-ocean-repository-placement.json'),
    'utf8',
  );
  return JSON.parse(text) as OceanPlacement;
}

function seaById(placement: OceanPlacement) {
  return new Map(
    placement.oceanRepositories.flatMap(ocean =>
      ocean.childSeaRepositories.map(sea => [sea.id, { ocean, sea }] as const),
    ),
  );
}

test('ocean repository placement uses one root and five ocean repositories', async () => {
  const placement = await readPlacement();

  assert.equal(placement.root.repository, 'agid-ocean');
  assert.deepEqual(
    placement.oceanRepositories.map(ocean => ocean.repository),
    ['agid-pacific', 'agid-atlantic', 'agid-indian', 'agid-arctic', 'agid-southern'],
  );
});

test('ocean repository placement splits major sea areas into a maintainable repository range', async () => {
  const placement = await readPlacement();
  const seaCount = placement.oceanRepositories.reduce((sum, ocean) => sum + ocean.childSeaRepositoryCount, 0);

  assert.ok(seaCount >= 150, `expected at least 150 sea repositories, got ${seaCount}`);
  assert.ok(seaCount <= 300, `expected at most 300 sea repositories, got ${seaCount}`);
});

test('Pacific sea repositories include the requested Asian and Oceania sea areas', async () => {
  const byId = seaById(await readPlacement());

  for (const id of [
    'philippine-sea',
    'east-china-sea',
    'south-china-sea',
    'sea-of-japan',
    'bering-sea',
    'coral-sea',
    'tasman-sea',
  ]) {
    const entry = byId.get(id);
    assert.ok(entry, `${id} should exist`);
    assert.equal(entry.ocean.id, 'pacific');
    assert.equal(entry.sea.repository, `agid-pacific-${id}`);
  }
});

test('Atlantic sea repositories include the requested seas, gulfs, and straits', async () => {
  const byId = seaById(await readPlacement());

  for (const id of ['caribbean-sea', 'gulf-of-mexico', 'north-sea', 'baltic-sea', 'mediterranean-sea']) {
    const entry = byId.get(id);
    assert.ok(entry, `${id} should exist`);
    assert.equal(entry.ocean.id, 'atlantic');
    assert.equal(entry.sea.repository, `agid-atlantic-${id}`);
  }
});

test('sea repositories store natural geography references instead of precise personal addresses', async () => {
  const byId = seaById(await readPlacement());
  const coralSea = byId.get('coral-sea')?.sea;

  assert.ok(coralSea);
  assert.equal(coralSea.storesPreciseAddress, false);
  assert.ok(coralSea.requiredFields.includes('AGID'));
  assert.ok(coralSea.requiredFields.includes('boundaryOrBbox'));
  assert.ok(coralSea.requiredFields.includes('adjacentCountriesOrIslands'));
  assert.ok((coralSea.recordCount ?? 0) >= 1);
});

test('mountains, deserts, rivers, and lakes are not independent repositories', async () => {
  const placement = await readPlacement();

  for (const feature of ['mountains', 'deserts', 'rivers', 'lakes']) {
    const policy = placement.naturalFeaturePolicy[feature];
    assert.ok(policy, `${feature} policy should exist`);
    assert.equal(policy.independentRepository, false);
    assert.equal(policy.storage, 'country-or-region-natural-feature-pack');
    assert.ok(policy.minimumFields.includes('name'));
    assert.ok(policy.minimumFields.includes('bboxOrCentroid'));
  }
});
