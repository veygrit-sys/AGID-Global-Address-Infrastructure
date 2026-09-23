import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildOceaniaRepositoryCreationPlan } from './build-oceania-repository-creation-plan.ts';

test('Oceania repository creation plan stages continent and region indexes first', () => {
  const plan = buildOceaniaRepositoryCreationPlan();

  assert.equal(plan.owner, 'dawnportinfo-design');
  assert.deepEqual(plan.summary, {
    continent: 'oceania',
    rootRepository: 'agid-oceania-index',
    regionRepositories: 3,
    countryParentRepositories: 35,
    childLogicalRepositories: 21,
    githubCreateNow: 4,
    dataReadyRepositories: 4,
    totalLogicalRepositories: 60,
  });
});

test('Oceania repository creation plan only marks index repositories for immediate GitHub creation', () => {
  const plan = buildOceaniaRepositoryCreationPlan();
  const immediate = plan.repositories.filter(repository => repository.githubCreateNow);

  assert.equal(immediate.length, 4);
  assert.deepEqual(
    immediate.map(repository => repository.kind).sort(),
    ['continent-index', 'region-index', 'region-index', 'region-index'].sort(),
  );
  assert.ok(immediate.every(repository => repository.stage === 'wave-0-index'));
  assert.ok(immediate.every(repository => repository.dataReady));
  assert.ok(plan.repositories.every(repository => repository.kind !== 'country-parent' || !repository.githubCreateNow));
  assert.ok(plan.repositories.every(repository => repository.kind !== 'country-child' || !repository.githubCreateNow));
});

test('Oceania repository creation plan keeps country and Australia child repositories linked to parents', () => {
  const plan = buildOceaniaRepositoryCreationPlan();
  const repositories = new Set(plan.repositories.map(repository => repository.repository));

  assert.equal(repositories.size, plan.repositories.length);
  assert.ok(repositories.has('agid-country-au'));
  assert.ok(repositories.has('agid-au-new-south-wales'));
  assert.ok(repositories.has('agid-country-nz'));
  assert.ok(repositories.has('agid-country-pg'));
  assert.ok(repositories.has('agid-country-tv'));
  assert.ok(repositories.has('agid-country-au-at'));

  for (const repository of plan.repositories) {
    if (repository.parentRepository) {
      assert.ok(
        repositories.has(repository.parentRepository),
        `${repository.repository} should point to an existing parent repository`,
      );
    }
  }
});

test('Oceania repository creation plan records island, marine, and public-data safety policy', () => {
  const plan = buildOceaniaRepositoryCreationPlan();

  assert.match(plan.policy.ownerRequirement, /authenticated as the target owner/);
  assert.match(plan.policy.ownerRequirement, /Do not let GitHub CLI fall back/);
  assert.match(plan.policy.noRawAddress, /Do not store raw personal addresses/);
  assert.match(plan.policy.islandAndMarineBoundary, /coarse marine area references/);
  assert.match(plan.policy.heavyData, /external content-addressed packs/);
  assert.ok(
    plan.repositories
      .filter(repository => repository.kind === 'country-parent')
      .every(repository => !repository.dataReady && repository.description.includes('synthetic fixtures only')),
  );
});
