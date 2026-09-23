import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AGID_SUPPORTED_WALLET_CHAINS,
  AGID_WALLET_CONFIG_VERSION,
  createAgidWalletConfig,
  describeAgidWalletConfig,
  getAgidWalletChainIds,
  getAgidWalletRpcUrl,
} from './agidWalletConfig';

test('declares wallet config as optional chain UI instead of the canonical server client', () => {
  const summary = describeAgidWalletConfig();

  assert.equal(summary.version, AGID_WALLET_CONFIG_VERSION);
  assert.equal(summary.defaultMode, 'optional-wallet-ui');
  assert.equal(summary.canonicalServerClient, 'viem');
});

test('supports local Anvil plus public L2 and Ethereum test/main chains', () => {
  const chainIds = getAgidWalletChainIds();

  assert.deepEqual(chainIds, AGID_SUPPORTED_WALLET_CHAINS.map((chain) => chain.id));
  assert.ok(chainIds.includes(31337));
  assert.ok(chainIds.includes(84532));
  assert.ok(chainIds.includes(8453));
});

test('allows rpc overrides without changing chain support', () => {
  assert.equal(getAgidWalletRpcUrl(31337), 'http://127.0.0.1:8545');
  assert.equal(getAgidWalletRpcUrl(31337, { 31337: 'http://127.0.0.1:9545' }), 'http://127.0.0.1:9545');
});

test('creates a wagmi config for wallet-gated registry screens', () => {
  const config = createAgidWalletConfig({
    rpcUrls: { 31337: 'http://127.0.0.1:9545' },
    enableInjectedDiscovery: false,
  });

  assert.ok(config);
  assert.deepEqual(config.chains.map((chain) => chain.id), getAgidWalletChainIds());
});

test('privacy rules reject raw location material in wallet signatures', () => {
  const summary = describeAgidWalletConfig();
  const joined = summary.privacyRules.join('\n');

  assert.match(joined, /must never include raw address text/i);
  assert.match(joined, /AGID-S ciphertext/i);
  assert.match(joined, /commitments/i);
});
