import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { buildCountryRepositoryCreationPlan } from './build-country-repository-creation-plan.ts';

test('Canada repository creation plan can mark all Canada repositories for setup', () => {
  const plan = buildCountryRepositoryCreationPlan({
    countryCode: 'CA',
    owner: 'dawnportinfo-design',
    createChildrenNow: true,
  });

  assert.equal(plan.owner, 'dawnportinfo-design');
  assert.deepEqual(plan.summary, {
    countryCode: 'CA',
    countryName: 'Canada',
    parentRepository: 'agid-country-ca',
    childRepositories: 20,
    githubCreateNow: 21,
    dataReadyRepositories: 1,
    logicalOnlyRepositories: 0,
    childRepositoriesAwaitingData: 20,
    totalRepositories: 21,
  });

  assert.equal(
    plan.repositories.find(repository => repository.repository === 'agid-country-ca')?.evidenceState,
    'parent-bootstrap-ready',
  );
  assert.ok(
    plan.repositories
      .filter(repository => repository.kind === 'country-child')
      .every(repository => repository.evidenceState === 'explicit-child-setup-requested' && !repository.dataReady),
  );
});

test('Canada repository creation plan preserves parent-child reconstruction links', () => {
  const plan = buildCountryRepositoryCreationPlan({
    countryCode: 'ca',
    createChildrenNow: true,
  });
  const repositories = new Set(plan.repositories.map(repository => repository.repository));

  assert.ok(repositories.has('agid-country-ca'));
  assert.ok(repositories.has('agid-ca-ontario'));
  assert.ok(repositories.has('agid-ca-quebec'));
  assert.ok(repositories.has('agid-ca-nunavut'));
  assert.ok(repositories.has('agid-ca-arctic'));
  assert.ok(
    plan.repositories
      .filter(repository => repository.kind === 'country-child')
      .every(repository => repository.parentRepository === 'agid-country-ca'),
  );
});

test('country repository creation plan blocks unsafe data boundaries in policy', () => {
  const plan = buildCountryRepositoryCreationPlan({
    countryCode: 'CA',
    createChildrenNow: true,
  });

  assert.match(plan.policy.ownerRequirement, /Do not let GitHub CLI fall back/);
  assert.match(plan.policy.noRawAddress, /Do not store raw personal addresses/);
  assert.match(plan.policy.heavyData, /external content-addressed packs/);
  assert.match(plan.policy.childDataReadiness, /not data-ready by default/);
  assert.match(plan.policy.stagedCreation, /explicitly selected for full setup/);
});

test('country repository creation plan defaults children to logical-only setup', () => {
  const plan = buildCountryRepositoryCreationPlan({ countryCode: 'CA' });

  assert.equal(plan.summary.githubCreateNow, 1);
  assert.equal(plan.summary.dataReadyRepositories, 1);
  assert.equal(plan.summary.logicalOnlyRepositories, 20);
  assert.equal(plan.summary.childRepositoriesAwaitingData, 20);
  assert.equal(plan.repositories.filter(repository => repository.githubCreateNow).length, 1);
  assert.equal(plan.repositories.find(repository => repository.repository === 'agid-country-ca')?.githubCreateNow, true);
  assert.ok(
    plan.repositories
      .filter(repository => repository.kind === 'country-child')
      .every(repository => !repository.githubCreateNow),
  );
  assert.ok(
    plan.repositories
      .filter(repository => repository.kind === 'country-child')
      .every(repository => repository.evidenceState === 'logical-child-awaiting-data' && !repository.dataReady),
  );
});

test('country repository creation plan separates physical creation from data readiness', () => {
  const plan = buildCountryRepositoryCreationPlan({
    countryCode: 'CA',
    createChildrenNow: true,
  });

  assert.ok(plan.repositories.every(repository => repository.githubCreateNow));
  assert.equal(plan.repositories.find(repository => repository.kind === 'country-parent')?.dataReady, true);
  assert.ok(
    plan.repositories
      .filter(repository => repository.kind === 'country-child')
      .every(repository => !repository.dataReady && /publication still requires/.test(repository.creationRationale)),
  );
});

test('country repository creation plan CLI accepts positional arguments for full Canada setup', () => {
  execFileSync(
    process.execPath,
    [
      'node_modules/tsx/dist/cli.mjs',
      'scripts/build-country-repository-creation-plan.ts',
      'CA',
      'dawnportinfo-design',
      'create-children-now',
    ],
    { encoding: 'utf8' },
  );
  const generated = JSON.parse(
    readFileSync('data/global_entities/agid-ca-repository-creation-plan.json', 'utf8'),
  ) as ReturnType<typeof buildCountryRepositoryCreationPlan>;

  assert.equal(generated.summary.githubCreateNow, 21);
  assert.equal(generated.summary.dataReadyRepositories, 1);
  assert.equal(generated.summary.childRepositoriesAwaitingData, 20);
  assert.equal(generated.repositories.length, 21);
  assert.ok(generated.repositories.every(repository => repository.githubCreateNow));
  assert.ok(
    generated.repositories
      .filter(repository => repository.kind === 'country-child')
      .every(repository => !repository.dataReady),
  );
});
