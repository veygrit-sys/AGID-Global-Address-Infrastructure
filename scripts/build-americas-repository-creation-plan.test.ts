import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAmericasRepositoryCreationPlan } from './build-americas-repository-creation-plan.ts';

test('Americas repository creation plan stages continent and region indexes first', () => {
  const plan = buildAmericasRepositoryCreationPlan();

  assert.equal(plan.owner, 'dawnportinfo-design');
  assert.deepEqual(plan.summary, {
    continent: 'americas',
    rootRepository: 'agid-americas-index',
    regionRepositories: 8,
    countryParentRepositories: 60,
    childLogicalRepositories: 271,
    githubCreateNow: 9,
    totalLogicalRepositories: 340,
  });
});

test('Americas repository creation plan only marks index repositories for immediate GitHub creation', () => {
  const plan = buildAmericasRepositoryCreationPlan();
  const immediate = plan.repositories.filter(repository => repository.githubCreateNow);

  assert.equal(immediate.length, 9);
  assert.deepEqual(
    immediate.map(repository => repository.kind).sort(),
    [
      'continent-index',
      'region-index',
      'region-index',
      'region-index',
      'region-index',
      'region-index',
      'region-index',
      'region-index',
      'region-index',
    ].sort(),
  );
  assert.ok(immediate.every(repository => repository.stage === 'wave-0-index'));
  assert.ok(plan.repositories.every(repository => repository.kind !== 'country-child' || !repository.githubCreateNow));
});

test('Americas repository creation plan keeps country and child repositories linked to parents', () => {
  const plan = buildAmericasRepositoryCreationPlan();
  const repositories = new Set(plan.repositories.map(repository => repository.repository));

  assert.equal(repositories.size, plan.repositories.length);
  assert.ok(repositories.has('agid-country-us'));
  assert.ok(repositories.has('agid-us-california'));
  assert.ok(repositories.has('agid-country-ca'));
  assert.ok(repositories.has('agid-ca-ontario'));
  assert.ok(repositories.has('agid-country-br'));
  assert.ok(repositories.has('agid-br-sao-paulo'));

  for (const repository of plan.repositories) {
    if (repository.parentRepository) {
      assert.ok(
        repositories.has(repository.parentRepository),
        `${repository.repository} should point to an existing parent repository`,
      );
    }
  }
});

test('Americas repository creation plan records public-data safety policy', () => {
  const plan = buildAmericasRepositoryCreationPlan();

  assert.match(plan.policy.ownerRequirement, /authenticated as the target owner/);
  assert.match(plan.policy.ownerRequirement, /Do not let GitHub CLI fall back/);
  assert.match(plan.policy.noRawAddress, /Do not store raw personal addresses/);
  assert.match(plan.policy.heavyData, /external content-addressed packs/);
  assert.ok(
    plan.repositories
      .filter(repository => repository.kind === 'country-parent')
      .every(repository => repository.description.includes('synthetic fixtures only')),
  );
});
