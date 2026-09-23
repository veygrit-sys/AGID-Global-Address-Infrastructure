import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildEuropeRepositoryCreationPlan } from './build-europe-repository-creation-plan.ts';

test('Europe repository creation plan stages continent and region indexes first', () => {
  const plan = buildEuropeRepositoryCreationPlan();

  assert.equal(plan.owner, 'dawnportinfo-design');
  assert.deepEqual(plan.summary, {
    continent: 'europe',
    rootRepository: 'agid-europe-index',
    regionRepositories: 6,
    countryParentRepositories: 63,
    childLogicalRepositories: 541,
    githubCreateNow: 7,
    dataReadyRepositories: 7,
    totalLogicalRepositories: 611,
  });
});

test('Europe repository creation plan only marks index repositories for immediate GitHub creation', () => {
  const plan = buildEuropeRepositoryCreationPlan();
  const immediate = plan.repositories.filter(repository => repository.githubCreateNow);

  assert.equal(immediate.length, 7);
  assert.equal(immediate.filter(repository => repository.kind === 'continent-index').length, 1);
  assert.equal(immediate.filter(repository => repository.kind === 'region-index').length, 6);
  assert.ok(immediate.every(repository => repository.stage === 'wave-0-index'));
  assert.ok(immediate.every(repository => repository.dataReady));
  assert.ok(plan.repositories.every(repository => repository.kind !== 'country-parent' || !repository.githubCreateNow));
  assert.ok(plan.repositories.every(repository => repository.kind !== 'country-child' || !repository.githubCreateNow));
});

test('Europe repository creation plan keeps country and child repositories linked to parents', () => {
  const plan = buildEuropeRepositoryCreationPlan();
  const repositories = new Set(plan.repositories.map(repository => repository.repository));

  assert.equal(repositories.size, plan.repositories.length);
  assert.ok(repositories.has('agid-country-fr'));
  assert.ok(repositories.has('agid-fr-paris-metro'));
  assert.ok(repositories.has('agid-country-de'));
  assert.ok(repositories.has('agid-de-berlin-city'));
  assert.ok(repositories.has('agid-country-gb'));
  assert.ok(repositories.has('agid-gb-london'));
  assert.ok(repositories.has('agid-country-ua'));
  assert.ok(repositories.has('agid-ua-crimea'));

  for (const repository of plan.repositories) {
    if (repository.parentRepository) {
      assert.ok(
        repositories.has(repository.parentRepository),
        `${repository.repository} should point to an existing parent repository`,
      );
    }
  }
});

test('Europe repository creation plan records overseas, disputed-boundary, and public-data safety policy', () => {
  const plan = buildEuropeRepositoryCreationPlan();

  assert.match(plan.policy.ownerRequirement, /authenticated as the target owner/);
  assert.match(plan.policy.ownerRequirement, /Do not let GitHub CLI fall back/);
  assert.match(plan.policy.noRawAddress, /Do not store raw personal addresses/);
  assert.match(plan.policy.overseasBoundary, /overseas-linked territories/);
  assert.match(plan.policy.disputedBoundary, /technical address identifiers/);
  assert.match(plan.policy.heavyData, /external content-addressed packs/);
  assert.ok(
    plan.repositories
      .filter(repository => repository.kind === 'country-parent')
      .every(repository => !repository.dataReady && repository.description.includes('synthetic fixtures only')),
  );
});
