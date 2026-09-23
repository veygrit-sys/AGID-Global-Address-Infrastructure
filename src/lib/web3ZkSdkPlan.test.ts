import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getDefaultInstallSdks,
  getInstallNowDecisions,
  getWeb3ZkSdkPlan,
  getWeb3ZkSdkRole,
  getWeb3ZkSdkRolesForMode,
} from './web3ZkSdkPlan';

test('uses viem as the only default installed chain SDK', () => {
  assert.deepEqual(getDefaultInstallSdks(), ['viem']);
  assert.equal(getWeb3ZkSdkRole('viem').repositoryStatus, 'implemented');
});

test('keeps wallet, compatibility, and external SDKs optional', () => {
  const plan = getWeb3ZkSdkPlan();
  const optionalSdks = plan.roles
    .filter((role) => role.sdk !== 'viem')
    .map((role) => [role.sdk, role.installByDefault]);

  for (const [sdk, installByDefault] of optionalSdks) {
    assert.equal(installByDefault, false, `${sdk} should not enter the base app bundle`);
  }
});

test('separates ZK-only mode from Ethereum-only mode', () => {
  const zkOnly = getWeb3ZkSdkRolesForMode('mode-2-zk-only').map((role) => role.sdk);
  const ethereumOnly = getWeb3ZkSdkRolesForMode('mode-3-ethereum-registry-only').map((role) => role.sdk);

  assert.deepEqual(zkOnly, ['Circom', 'snarkjs']);
  assert.ok(ethereumOnly.includes('viem'));
  assert.ok(ethereumOnly.includes('Alloy'));
  assert.ok(!ethereumOnly.includes('Circom'));
});

test('full mode includes both chain and proof tooling without changing privacy boundaries', () => {
  const fullMode = getWeb3ZkSdkRolesForMode('mode-4-full-zk-ethereum');
  const sdkNames = fullMode.map((role) => role.sdk);

  assert.ok(sdkNames.includes('viem'));
  assert.ok(sdkNames.includes('Circom'));
  assert.ok(sdkNames.includes('snarkjs'));

  for (const role of fullMode) {
    assert.doesNotMatch(role.privacyBoundary, /publish raw address/i);
    assert.match(role.privacyBoundary, /raw|witness|commitment|predicate|allowlist|address|AGID|AOID/i);
  }
});

test('separates actual install-now tooling from app-runtime dependencies', () => {
  const installNow = getInstallNowDecisions();
  const names = installNow.map((decision) => decision.name);

  assert.deepEqual(names, ['OpenZeppelin Contracts', 'Foundry', 'Anvil']);
  for (const decision of installNow) {
    assert.equal(decision.target, 'dev-tooling');
    assert.notEqual(decision.target, 'app-runtime');
  }
});

test('documents avoid-for-now choices so SDK sprawl stays controlled', () => {
  const avoid = getWeb3ZkSdkPlan().adoption
    .filter((decision) => decision.phase === 'avoid-for-now')
    .map((decision) => decision.name);

  assert.ok(avoid.includes('ethers.js'));
  assert.ok(avoid.includes('Hardhat'));
});
