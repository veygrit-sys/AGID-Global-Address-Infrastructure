import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  workflowCheckoutsDisablePersistedCredentials,
  workflowAllowsVeygritSitesPresave,
  workflowReferencesVeygritSitesPresave,
} from './verify-veygrit-sites-ci-boundary';

const fixtureRoot = join(process.cwd(), 'docs', 'specs', 'fixtures', 'veygrit-sites-ci-boundary');
const readFixture = (name: string) => readFileSync(join(fixtureRoot, name), 'utf8');

test('Veygrit Sites CI boundary allows only marked multi-source presave workflows', () => {
  const workflow = readFixture('allowed-multi-source-presave.yml');

  assert.equal(workflowReferencesVeygritSitesPresave(workflow), true);
  assert.equal(workflowCheckoutsDisablePersistedCredentials(workflow), true);
  assert.equal(workflowAllowsVeygritSitesPresave(workflow), true);
});

test('Veygrit Sites CI boundary rejects unmarked presave workflows', () => {
  const workflow = readFixture('blocked-unmarked-presave.yml');

  assert.equal(workflowReferencesVeygritSitesPresave(workflow), true);
  assert.equal(workflowAllowsVeygritSitesPresave(workflow), false);
});

test('Veygrit Sites CI boundary rejects presave workflows without linked source root', () => {
  const workflow = readFixture('blocked-missing-source-root.yml');

  assert.equal(workflowAllowsVeygritSitesPresave(workflow), false);
});

test('Veygrit Sites CI boundary rejects presave workflows with any persisted checkout credentials', () => {
  const workflow = readFixture('blocked-persisted-credentials.yml');

  assert.equal(workflowCheckoutsDisablePersistedCredentials(workflow), false);
  assert.equal(workflowAllowsVeygritSitesPresave(workflow), false);
});

test('Veygrit Sites CI boundary rejects presave workflows with remote mutation commands', () => {
  const workflow = readFixture('blocked-remote-mutation.yml');

  assert.equal(workflowAllowsVeygritSitesPresave(workflow), false);
});
