import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import {
  VEYGRIT_BOUNDARY_GATE_INDEX_VERSION,
  buildVeygritBoundaryGateIndex,
  validateVeygritBoundaryGateIndex,
} from './veygritBoundaryGateIndex';

test('Veygrit boundary gate index lists every protected no-scripts surface', () => {
  const index = buildVeygritBoundaryGateIndex();
  const validation = validateVeygritBoundaryGateIndex(index);

  assert.equal(index.version, VEYGRIT_BOUNDARY_GATE_INDEX_VERSION);
  assert.equal(index.status, 'local-review-index-no-remote-mutation');
  assert.equal(validation.ok, true);
  assert.deepEqual(validation.errors, []);
  assert.deepEqual(index.gates.map(gate => gate.id), [
    'veygrit-repository-handoff',
    'veygrit-sites-contracts',
    'veygrit-id-address-login-contracts',
    'carrier-lib-delivery-contracts',
    'veygrit-ship-delivery-contracts',
    'server-carrier-route-adapters',
  ]);
  assert.ok(index.gates.every(gate => gate.remoteMutationAllowed === false));
  assert.ok(index.gates.every(gate => gate.productionTrafficAllowed === false));
});

test('Veygrit boundary gate index points to real local tests and production modules', () => {
  const index = buildVeygritBoundaryGateIndex();

  for (const gate of index.gates) {
    assert.equal(existsSync(gate.testFile), true, `${gate.testFile} should exist`);
    const testSource = readFileSync(gate.testFile, 'utf8');
    assert.match(testSource, /assertModulesDoNotImportScripts/);

    for (const modulePath of gate.protectedModules) {
      assert.equal(existsSync(modulePath), true, `${modulePath} should exist`);
      assert.ok(testSource.includes(modulePath), `${gate.testFile} should list ${modulePath}`);
    }
  }
});

test('Veygrit boundary gate index commands are wired into package scripts', () => {
  const index = buildVeygritBoundaryGateIndex();
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> };
  const scripts = packageJson.scripts ?? {};

  assert.equal(scripts['verify:veygrit-boundary-gate-index'], 'tsx --test src/lib/veygritBoundaryGateIndex.test.ts');

  for (const command of index.gates.flatMap(gate => gate.verificationCommands)) {
    const scriptName = command.replace(/^npm run /, '');
    assert.ok(scripts[scriptName], `${scriptName} should be wired in package.json`);
  }
});

test('Veygrit boundary gate index is documented for OSS review', () => {
  const index = buildVeygritBoundaryGateIndex();
  const doc = readFileSync('docs/product/veygrit-boundary-gate-index.md', 'utf8');

  assert.match(doc, /Veygrit Boundary Gate Index/);
  assert.match(doc, /local-review-index-no-remote-mutation/);
  assert.match(doc, /npm run verify:veygrit-boundary-gate-index/);
  assert.match(doc, /no-script-fixtures/);

  for (const gate of index.gates) {
    assert.match(doc, new RegExp(gate.id));
    for (const command of gate.verificationCommands) assert.match(doc, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Veygrit boundary gate index rejects unsafe or stale entries', () => {
  const index = buildVeygritBoundaryGateIndex();
  const unsafe = validateVeygritBoundaryGateIndex({
    ...index,
    gates: [
      ...index.gates,
      {
        ...index.gates[0],
        id: index.gates[0].id,
        verificationCommands: ['npm run verify:veygrit-github-handoff', 'git push origin main'],
        protectedModules: ['scripts/generated-fixture.ts'],
      },
    ],
  });

  assert.equal(unsafe.ok, false);
  assert.ok(unsafe.errors.includes('duplicate-gate:veygrit-repository-handoff'));
  assert.ok(unsafe.errors.includes('non-npm-verifier:veygrit-repository-handoff'));
  assert.ok(unsafe.errors.includes('remote-mutation-command:veygrit-repository-handoff'));
  assert.ok(unsafe.errors.some(error => error.startsWith('non-src-protected-module:')));
  assert.ok(unsafe.errors.some(error => error.startsWith('script-fixture-listed-as-production-module:')));
});
