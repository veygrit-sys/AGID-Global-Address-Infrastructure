import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateWeb3ZkEthereumRelease,
  getWeb3ZkChainProfile,
  getWeb3ZkEthereumHardeningPlan,
  redactWeb3ZkPublicPayload,
} from './web3ZkEthereumHardening';

const issuerRegistry = '0x1111111111111111111111111111111111111111';
const revocationRegistry = '0x2222222222222222222222222222222222222222';
const nullifierRegistry = '0x3333333333333333333333333333333333333333';
const zkVerifier = '0x4444444444444444444444444444444444444444';

test('hardening plan separates chain policy, ZK provenance, no-raw payloads, and release gates', () => {
  const plan = getWeb3ZkEthereumHardeningPlan();

  assert.equal(plan.version, 'web3-zk-ethereum-hardening-v1');
  assert.ok(plan.controls.some((control) => control.id === 'chain-allowlist'));
  assert.ok(plan.controls.some((control) => control.id === 'zk-proof-provenance'));
  assert.ok(plan.controls.some((control) => control.id === 'no-raw-public-payload'));
  assert.ok(plan.controls.some((control) => control.id === 'transport-and-secret-policy'));
  assert.ok(plan.releaseCommands.includes('npm run verify:web3-zk-stack'));
});

test('chain profiles allow known AGID Ethereum chains and reject unknown chains', () => {
  assert.equal(getWeb3ZkChainProfile(8453)?.slug, 'base-mainnet');
  assert.equal(getWeb3ZkChainProfile('11155111')?.slug, 'sepolia');
  assert.equal(getWeb3ZkChainProfile(999999999), null);
});

test('public payload redaction removes raw address, AGID, AOID, witness, and precise coordinate material', () => {
  const result = redactWeb3ZkPublicPayload({
    issuerAddress: '0x5555555555555555555555555555555555555555',
    commitment: 'commitment_public_hash',
    rawAddress: 'Tokyo Station 1-9-1 Marunouchi',
    rawAgid: 'AGID-SECRET-1234',
    aoid: 'AOID-SECRET-5678',
    witness: { privateInput: 'holder secret' },
    coordinates: '35.681236, 139.767125',
  });
  const serialized = JSON.stringify(result.redacted);

  assert.equal(result.safe, false);
  assert.match(result.findings.join('\n'), /private-public-payload-field:\$\.rawAddress/);
  assert.match(result.findings.join('\n'), /private-public-payload-value:\$\.coordinates/);
  assert.match(serialized, /0x5555555555555555555555555555555555555555/);
  assert.doesNotMatch(serialized, /Tokyo Station|AGID-SECRET|AOID-SECRET|holder secret|35\.681236/);
  assert.match(result.publicPayloadHash, /^[a-f0-9]{64}$/);
});

test('Mode 4 production is blocked when proof provenance, verifier, nullifier, or private payload rules are weak', () => {
  const result = evaluateWeb3ZkEthereumRelease({
    mode: 'mode-4-full-zk-ethereum',
    target: 'production',
    chainId: 8453,
    registryContracts: {
      'issuer-registry': issuerRegistry,
      'revocation-registry': revocationRegistry,
      'nullifier-registry': nullifierRegistry,
    },
    prover: {
      proofGeneratedBy: 'fixture-circuit',
      auditStatus: 'none',
      publicSignals: ['scope hash', 'raw AGID'],
      witnessStored: true,
    },
    publicPayload: {
      nullifierHash: 'zk_nullifier_public',
      addressText: '1 Main Street',
    },
    nullifierPolicy: {
      domainSeparated: false,
      replayProtected: true,
      purposeScoped: false,
      chainScoped: false,
      registryScoped: false,
    },
  });

  assert.equal(result.status, 'blocked');
  assert.ok(result.blockers.includes('missing-contract:zk-verifier'));
  assert.ok(result.blockers.includes('zk-production-proof-not-generated-by-reviewed-prover'));
  assert.ok(result.blockers.includes('forbidden-public-signal:raw AGID'));
  assert.ok(result.blockers.includes('witness-material-cannot-be-stored-or-logged'));
  assert.ok(result.blockers.includes('domain-separated-nullifier-required'));
  assert.ok(result.blockers.some((blocker) => blocker.startsWith('private-public-payload-field:')));
});

test('Mode 4 production can pass with audited ZK, configured contracts, chain policy, and public-only payloads', () => {
  const result = evaluateWeb3ZkEthereumRelease({
    mode: 'mode-4-full-zk-ethereum',
    target: 'production',
    chainId: 8453,
    registryContracts: {
      'issuer-registry': issuerRegistry,
      'revocation-registry': revocationRegistry,
      'nullifier-registry': nullifierRegistry,
      'zk-verifier': zkVerifier,
    },
    prover: {
      proofGeneratedBy: 'circom-snarkjs',
      auditStatus: 'external-audit',
      circuitId: 'agid-private-address-predicate-v1',
      verifierKeyReference: 'vk:agid-private-address-predicate-v1',
      publicSignals: [
        'predicate identifier',
        'scope hash',
        'issuer root',
        'revocation root',
        'freshness root',
        'nullifier hash',
        'proof expiry',
        'verifier key reference',
        'circuit id',
      ],
      witnessStored: false,
      witnessLogged: false,
    },
    publicPayload: {
      issuerCommitment: 'issuer_commitment_public',
      revocationRoot: 'revocation_root_public',
      nullifierHash: 'nullifier_hash_public',
      proofExpiry: '2026-01-01T01:00:00.000Z',
    },
    nullifierPolicy: {
      domainSeparated: true,
      replayProtected: true,
      purposeScoped: true,
      chainScoped: true,
      registryScoped: true,
    },
    transportPolicy: {
      connectorFetchNoCache: true,
      noUnsafeRetry: true,
      httpsOnly: true,
      gatewayAllowlist: true,
      encryptedSecretStorage: true,
      circuitBreaker: true,
      deadLetterQueue: true,
    },
    onchainEvidence: {
      required: true,
      confirmations: 12,
      observedTxHashes: ['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'],
    },
  });

  assert.equal(result.status, 'ready-for-production');
  assert.equal(result.chainProfile?.slug, 'base-mainnet');
  assert.deepEqual(result.blockers, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.controls.every((control) => control.passed), true);
});
