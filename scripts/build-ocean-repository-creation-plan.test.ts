import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildOceanRepositoryCreationPlan } from './build-ocean-repository-creation-plan.ts';

test('ocean repository creation plan stages root and five ocean indexes first', () => {
  const plan = buildOceanRepositoryCreationPlan();

  assert.equal(plan.owner, 'dawnportinfo-design');
  assert.deepEqual(plan.summary, {
    domain: 'ocean',
    rootRepository: 'agid-ocean',
    oceanRepositories: 5,
    seaLogicalRepositories: 160,
    githubCreateNow: 6,
    dataReadyRepositories: 6,
    totalLogicalRepositories: 166,
  });
});

test('ocean repository creation plan only marks index repositories for immediate creation', () => {
  const plan = buildOceanRepositoryCreationPlan();
  const immediate = plan.repositories.filter(repository => repository.githubCreateNow);

  assert.equal(immediate.length, 6);
  assert.deepEqual(
    immediate.map(repository => repository.kind).sort(),
    ['ocean-index', 'ocean-index', 'ocean-index', 'ocean-index', 'ocean-index', 'ocean-root-index'].sort(),
  );
  assert.ok(immediate.every(repository => repository.stage === 'wave-0-index'));
  assert.ok(immediate.every(repository => repository.dataReady));
  assert.ok(plan.repositories.every(repository => repository.kind !== 'sea-child' || !repository.githubCreateNow));
});

test('ocean repository creation plan keeps sea-area repositories linked to ocean parents', () => {
  const plan = buildOceanRepositoryCreationPlan();
  const repositories = new Set(plan.repositories.map(repository => repository.repository));

  assert.equal(repositories.size, plan.repositories.length);
  assert.ok(repositories.has('agid-pacific-philippine-sea'));
  assert.ok(repositories.has('agid-pacific-sea-of-japan'));
  assert.ok(repositories.has('agid-atlantic-mediterranean-sea'));
  assert.ok(repositories.has('agid-atlantic-gulf-of-mexico'));
  assert.ok(repositories.has('agid-indian-arabian-sea'));
  assert.ok(repositories.has('agid-arctic-greenland-sea'));
  assert.ok(repositories.has('agid-southern-ross-sea'));

  for (const repository of plan.repositories) {
    if (repository.parentRepository) {
      assert.ok(
        repositories.has(repository.parentRepository),
        `${repository.repository} should point to an existing parent repository`,
      );
    }
  }
});

test('ocean repository creation plan records public marine-data safety policies', () => {
  const plan = buildOceanRepositoryCreationPlan();

  assert.match(plan.policy.ownerRequirement, /dawnportinfo-design/);
  assert.match(plan.policy.noRawAddress, /raw personal addresses/);
  assert.match(plan.policy.noRawAddress, /private delivery coordinates/);
  assert.match(plan.policy.marineBoundary, /coarse boundaries or bounding boxes/);
  assert.match(plan.policy.eezAndDisputedPolicy, /not sovereignty claims/);
  assert.match(plan.policy.naturalFeatureBoundary, /country-or-region natural-feature packs/);
  assert.match(plan.policy.heavyData, /external content-addressed packs/);
  assert.ok(
    plan.repositories
      .filter(repository => repository.kind === 'sea-child')
      .every(repository => !repository.dataReady && repository.description.includes('coarse boundary or bbox')),
  );
});
