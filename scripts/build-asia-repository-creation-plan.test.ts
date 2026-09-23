import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAsiaRepositoryCreationPlan } from './build-asia-repository-creation-plan.ts';

test('Asia repository creation plan stages continent and region indexes first', () => {
  const plan = buildAsiaRepositoryCreationPlan();

  assert.equal(plan.owner, 'dawnportinfo-design');
  assert.deepEqual(plan.summary, {
    continent: 'asia',
    rootRepository: 'agid-asia-index',
    regionRepositories: 6,
    countryParentRepositories: 50,
    childLogicalRepositories: 785,
    githubCreateNow: 7,
    dataReadyRepositories: 7,
    totalLogicalRepositories: 842,
  });
});

test('Asia repository creation plan only marks index repositories for immediate GitHub creation', () => {
  const plan = buildAsiaRepositoryCreationPlan();
  const immediate = plan.repositories.filter(repository => repository.githubCreateNow);

  assert.equal(immediate.length, 7);
  assert.equal(immediate.filter(repository => repository.kind === 'continent-index').length, 1);
  assert.equal(immediate.filter(repository => repository.kind === 'region-index').length, 6);
  assert.ok(immediate.every(repository => repository.stage === 'wave-0-index'));
  assert.ok(immediate.every(repository => repository.dataReady));
  assert.ok(plan.repositories.every(repository => repository.kind !== 'country-parent' || !repository.githubCreateNow));
  assert.ok(plan.repositories.every(repository => repository.kind !== 'country-child' || !repository.githubCreateNow));
});

test('Asia repository creation plan keeps large country and child repositories linked to parents', () => {
  const plan = buildAsiaRepositoryCreationPlan();
  const repositories = new Set(plan.repositories.map(repository => repository.repository));

  assert.equal(repositories.size, plan.repositories.length);
  assert.ok(repositories.has('agid-country-jp'));
  assert.ok(repositories.has('agid-jp-tokyo-23'));
  assert.ok(repositories.has('agid-country-cn'));
  assert.ok(repositories.has('agid-cn-shanghai-city'));
  assert.ok(repositories.has('agid-country-in'));
  assert.ok(repositories.has('agid-in-delhi-metro'));
  assert.ok(repositories.has('agid-country-tr'));
  assert.ok(repositories.has('agid-tr-istanbul'));

  for (const repository of plan.repositories) {
    if (repository.parentRepository) {
      assert.ok(
        repositories.has(repository.parentRepository),
        `${repository.repository} should point to an existing parent repository`,
      );
    }
  }
});

test('Asia repository creation plan records Caucasus, disputed-boundary, and public-data safety policy', () => {
  const plan = buildAsiaRepositoryCreationPlan();

  assert.match(plan.policy.ownerRequirement, /authenticated as the target owner/);
  assert.match(plan.policy.ownerRequirement, /Do not let GitHub CLI fall back/);
  assert.match(plan.policy.noRawAddress, /Do not store raw personal addresses/);
  assert.match(plan.policy.canonicalRegions, /AM, AZ, and GE canonical under Asia\/Caucasus/);
  assert.match(plan.policy.disputedBoundary, /technical address identifiers/);
  assert.match(plan.policy.heavyData, /external content-addressed packs/);
  assert.ok(
    plan.repositories
      .filter(repository => repository.kind === 'country-parent')
      .every(repository => !repository.dataReady && repository.description.includes('synthetic fixtures only')),
  );
});
