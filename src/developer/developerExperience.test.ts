import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildDeveloperConsole } from '../lib/developerConsole';
import { buildDeveloperExperience } from './developerExperience';

test('Developer experience builds app, workflow, primitive, API, tutorial, and scenario coverage', () => {
  const consoleModel = buildDeveloperConsole({ generatedAt: '2026-06-20T00:00:00.000Z' });
  const experience = buildDeveloperExperience(consoleModel);

  assert.ok(experience.summary.appSurfaces >= 19);
  assert.ok(experience.summary.workflowSurfaces >= 11);
  assert.ok(experience.summary.sharedPrimitives >= 17);
  assert.ok(experience.summary.apiSdkSurfaces >= 12);
  assert.ok(experience.summary.coverageRows >= 40);
  assert.equal(experience.summary.tutorialSteps, 7);
  assert.ok(experience.summary.scenarioRecipes >= 9);
  assert.ok(experience.summary.noRawReady >= experience.summary.appSurfaces);
  assert.equal(experience.summary.prReadinessSlices, 1);
});

test('Developer experience includes core app surfaces and API SDK surfaces', () => {
  const consoleModel = buildDeveloperConsole();
  const experience = buildDeveloperExperience(consoleModel);
  const ids = new Set(experience.coverageRows.map(row => row.id));

  for (const required of [
    'map-workspace',
    'address-registration',
    'address-portal',
    'pos-terminal',
    'developer-console',
    'api-resolver',
    'api-secure-qr',
    'api-zk-web3',
    'api-conformance',
  ]) {
    assert.ok(ids.has(required), `missing ${required}`);
  }
});

test('Developer experience defines a GitHub-ready Developer Console and App Shell slice', () => {
  const consoleModel = buildDeveloperConsole();
  const experience = buildDeveloperExperience(consoleModel);
  const slice = experience.prReadinessSlices.find(item => item.id === 'developer-console-app-shell');

  assert.ok(slice);
  assert.equal(slice.status, 'ready');
  assert.equal(slice.risk, 'low');
  assert.equal(slice.noRawGate, true);
  assert.match(slice.scope, /Route policy/);
  assert.ok(slice.files.includes('src/components/DeveloperConsoleScreen.tsx'));
  assert.ok(slice.files.includes('src/RootApp.tsx'));
  assert.ok(slice.files.includes('src/lib/appNavigation.ts'));
  assert.ok(slice.files.includes('src/design/agidDesignRules.ts'));
  assert.ok(slice.gates.includes('npm run verify:developer-console'));
  assert.ok(slice.gates.includes('npm run verify:app-shell'));
  assert.ok(slice.gates.includes('npm run verify:no-raw-address'));
});

test('Developer tutorial samples use commitments, aliases, receipts, and explicit no raw response flag', () => {
  const consoleModel = buildDeveloperConsole();
  const experience = buildDeveloperExperience(consoleModel);

  for (const step of experience.tutorialSteps) {
    assert.ok(step.command.length > 0, `${step.id} should include a runnable command`);
    assert.ok(step.failureRecovery.length > 0, `${step.id} should include a failure recovery step`);
    assert.match(step.failureRecovery, /fail|fails|failed|rerun|locked|review|unresolved|dead-letter|conformance|gate/i);
    assert.match(step.expectedResponse, /rawAddressReturned/);
    assert.match(step.expectedResponse, /alias|commitment|receipt|launchRoot/);
    assert.doesNotMatch(step.expectedResponse, /rawAddress"\s*:/);
    assert.doesNotMatch(step.expectedResponse, /recipient"\s*:/);
    assert.doesNotMatch(step.expectedResponse, /privateKey|proofCode|secret/);
  }
});
