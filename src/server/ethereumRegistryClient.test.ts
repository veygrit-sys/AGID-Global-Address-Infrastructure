import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ETHEREUM_REGISTRY_ONLY_MODE_VERSION, type EthereumRegistryOnlyTxPlan } from '../lib/ethereumRegistryOnlyMode';
import { AgidEthereumRegistryClient } from './ethereumRegistryClient';

const configuredNullifierRegistry = '0x1234567890abcdef1234567890abcdef12345678';
const attackerControlledRegistry = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

function nullifierTxPlan(contractAddress: string | null): EthereumRegistryOnlyTxPlan {
  return {
    modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
    mode: 'ethereum-registry-only',
    operationId: 'test-contract-address-binding',
    operation: 'mark-nullifier-used',
    networkId: 'base-sepolia',
    contractRole: 'nullifier-registry',
    contractAddress,
    method: 'markNullifierUsed',
    publicArguments: {
      nullifierHash: `0x${'a'.repeat(64)}`,
      scope: 'route-client-test',
      registryKeyHash: `0x${'b'.repeat(64)}`,
    },
    callDataHash: `0x${'c'.repeat(64)}`,
    estimatedGasUnits: 50000,
    gasRequired: true,
    zkProofRequired: false,
    chainWriteRequired: true,
    executionMode: 'planned',
    observedTxHash: null,
    warnings: [],
    privacy: {
      modeVersion: ETHEREUM_REGISTRY_ONLY_MODE_VERSION,
      rawAddressStored: false,
      rawAgidStored: false,
      rawAoidStored: false,
      rawPhoneStored: false,
      rawPersonalNameStored: false,
      agidSecureCiphertextStored: false,
      zkProofRequired: false,
      publicLedgerWritten: true,
      allowedPublicMaterial: ['nullifierHash', 'scope', 'registryKeyHash'],
      forbiddenPrivateMaterial: ['raw-address', 'raw-agid', 'raw-aoid'],
      metadataLeakageRisks: [],
      mitigations: [],
    },
  };
}

test('Ethereum registry client rejects txPlan contract address substitution', async () => {
  const client = new AgidEthereumRegistryClient({
    rpcUrl: 'http://127.0.0.1:1',
    privateKey: `0x${'1'.repeat(64)}`,
    contracts: {
      'nullifier-registry': configuredNullifierRegistry,
    },
  });

  await assert.rejects(
    () => client.submitTxPlan(nullifierTxPlan(attackerControlledRegistry)),
    /nullifier-registry-contractAddress-mismatch/,
  );
});

test('Ethereum registry client requires server configured contract addresses', async () => {
  const previous = process.env.AGID_ETHEREUM_NULLIFIER_REGISTRY_ADDRESS;
  delete process.env.AGID_ETHEREUM_NULLIFIER_REGISTRY_ADDRESS;
  const client = new AgidEthereumRegistryClient({
    rpcUrl: 'http://127.0.0.1:1',
    privateKey: `0x${'1'.repeat(64)}`,
    contracts: {},
  });

  try {
    await assert.rejects(
      () => client.submitTxPlan(nullifierTxPlan(null)),
      /nullifier-registry-contractAddress-must-be-configured-on-server/,
    );
  } finally {
    if (previous === undefined) delete process.env.AGID_ETHEREUM_NULLIFIER_REGISTRY_ADDRESS;
    else process.env.AGID_ETHEREUM_NULLIFIER_REGISTRY_ADDRESS = previous;
  }
});
