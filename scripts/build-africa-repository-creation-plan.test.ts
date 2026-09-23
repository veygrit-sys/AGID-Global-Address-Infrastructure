import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAfricaRepositoryCreationPlan } from './build-africa-repository-creation-plan.ts';

test('Africa repository creation plan stages continent and region indexes first', () => {
  const plan = buildAfricaRepositoryCreationPlan();

  assert.equal(plan.owner, 'dawnportinfo-design');
  assert.deepEqual(plan.summary, {
    continent: 'africa',
    rootRepository: 'agid-africa-index',
    regionRepositories: 5,
    countryParentRepositories: 61,
    childLogicalRepositories: 300,
    githubCreateNow: 6,
    dataReadyRepositories: 6,
    totalLogicalRepositories: 367,
  });
});

test('Africa repository creation plan only marks index repositories for immediate GitHub creation', () => {
  const plan = buildAfricaRepositoryCreationPlan();
  const immediate = plan.repositories.filter(repository => repository.githubCreateNow);

  assert.equal(immediate.length, 6);
  assert.deepEqual(
    immediate.map(repository => repository.kind).sort(),
    [
      'continent-index',
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

test('Africa repository creation plan keeps country and child repositories linked to parents', () => {
  const plan = buildAfricaRepositoryCreationPlan();
  const repositories = new Set(plan.repositories.map(repository => repository.repository));

  assert.equal(repositories.size, plan.repositories.length);
  assert.ok(repositories.has('agid-country-ng'));
  assert.ok(repositories.has('agid-country-ke'));
  assert.ok(repositories.has('agid-ke-nairobi-metro'));
  assert.ok(repositories.has('agid-country-dz'));
  assert.ok(repositories.has('agid-dz-algiers-metro'));
  assert.ok(repositories.has('agid-country-cd'));
  assert.ok(repositories.has('agid-cd-kinshasa-metro'));

  for (const repository of plan.repositories) {
    if (repository.parentRepository) {
      assert.ok(
        repositories.has(repository.parentRepository),
        `${repository.repository} should point to an existing parent repository`,
      );
    }
  }
});

test('Africa repository creation plan records postal-weak and public-data safety policy', () => {
  const plan = buildAfricaRepositoryCreationPlan();

  assert.match(plan.policy.ownerRequirement, /authenticated as the target owner/);
  assert.match(plan.policy.ownerRequirement, /Do not let GitHub CLI fall back/);
  assert.match(plan.policy.noRawAddress, /Do not store raw personal addresses/);
  assert.match(plan.policy.postalWeakness, /postal-code-weak/);
  assert.match(plan.policy.postalWeakness, /humanitarian delivery modes/);
  assert.match(plan.policy.heavyData, /external content-addressed packs/);
  assert.ok(
    plan.repositories
      .filter(repository => repository.kind === 'country-parent')
      .every(repository => repository.description.includes('synthetic fixtures only')),
  );
});
