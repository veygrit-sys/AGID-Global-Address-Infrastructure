import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildManagedZkProofJob,
  collectManagedZkProofServerPrivateMaterialErrors,
  listManagedZkProofServerCapabilities,
} from './managedZkProofServer';

test('managed ZK proof server capabilities prefer client-side witness and public-only jobs', () => {
  const capabilities = listManagedZkProofServerCapabilities();

  assert.equal(capabilities.modelVersion, 'agid-managed-zk-proof-server-v1');
  assert.ok(capabilities.proofFamilies.includes('zk-delivery-eligibility'));
  assert.ok(capabilities.backends.includes('circom-snarkjs'));
  assert.ok(capabilities.backends.includes('noir'));
  assert.equal(capabilities.recommendedDefault.witnessMode, 'client-side-witness');
  assert.equal(capabilities.privacy.rawAddressAccepted, false);
  assert.equal(capabilities.privacy.rawWitnessAccepted, false);
  assert.equal(capabilities.privacy.serverHeldWitnessAllowed, false);
  assert.ok(capabilities.requiredControls.includes('verifier-key-pinning'));
});

test('managed ZK proof job builds a client-side proof request without storing witness material', () => {
  const job = buildManagedZkProofJob({
    requestedAt: '2026-06-17T00:00:00.000Z',
    tenantId: 'ngo-relief-jp',
    proofFamily: 'zk-delivery-eligibility',
    backend: 'circom-snarkjs',
    deploymentProfile: 'private-ngo',
    witnessMode: 'client-side-witness',
    publicInputs: {
      areaRoot: 'AREA-ROOT-TOKYO-RELIEF',
      issuerRoot: 'ISSUER-ROOT-NGO-2026',
    },
    commitments: {
      credentialCommitment: 'CRED-COMMITMENT-001',
      nullifierHash: 'NULLIFIER-HASH-001',
    },
    registryRoots: {
      revocationRoot: 'REVOCATION-ROOT-001',
    },
    policy: {
      domain: 'aid:eligibility:tokyo:2026',
      maxProofAgeSeconds: 600,
    },
    circuit: {
      circuitId: 'delivery-eligibility-v1',
      verifierKeyRef: 'vk://agid/delivery-eligibility/v1',
    },
    priority: 'high',
  });

  assert.equal(job.accepted, true);
  assert.equal(job.status, 'requires-client-proof');
  assert.match(job.jobId, /^MZK-[A-F0-9]{20}$/);
  assert.equal(job.artifactPolicy.storeWitness, false);
  assert.equal(job.artifactPolicy.storeRawAddress, false);
  assert.equal(job.artifactPolicy.storeRawAgid, false);
  assert.equal(job.artifactPolicy.storeRawAoid, false);
  assert.equal(job.publicStatement.circuitId, 'delivery-eligibility-v1');
  assert.equal(job.publicStatement.policyHash.length, 64);
  assert.ok(job.execution.requiredEnvVars.includes('AGID_ZK_CIRCOM_ARTIFACT_ROOT'));
  assert.ok(job.security.controls.includes('private-deployment-boundary'));
  assert.equal(job.errors.length, 0);
});

test('managed ZK proof job rejects server-held witness and raw private material', () => {
  const job = buildManagedZkProofJob({
    requestedAt: '2026-06-17T00:00:00.000Z',
    proofFamily: 'zk-address',
    witnessMode: 'server-held-witness',
    publicInputs: {
      countryRoot: 'JP-ROOT',
    },
    address: 'Tokyo private address must not be uploaded',
    rawAgid: 'JP05AV8TJGH8',
    witness: {
      lat: 35.6812,
      lon: 139.7671,
    },
  });

  assert.equal(job.accepted, false);
  assert.equal(job.status, 'rejected');
  assert.equal(job.security.serverHeldWitnessAllowed, false);
  assert.match(job.errors.join('\n'), /server-held-witness/i);
  assert.match(job.errors.join('\n'), /address.*private/i);
  assert.match(job.errors.join('\n'), /rawAgid.*private/i);
  assert.match(job.errors.join('\n'), /witness.*private/i);
});

test('managed SaaS remote encrypted witness requires confidential compute or private deployment', () => {
  const rejected = buildManagedZkProofJob({
    requestedAt: '2026-06-17T00:00:00.000Z',
    proofFamily: 'aoid-ownership',
    deploymentProfile: 'managed-saas',
    witnessMode: 'remote-encrypted-witness',
    artifactRefs: {
      encryptedWitnessRef: 's3://tenant-proof-staging/object-ref-only',
    },
    publicInputs: {
      issuerRoot: 'ISSUER-ROOT',
    },
  });

  assert.equal(rejected.accepted, false);
  assert.equal(rejected.status, 'requires-private-deployment');
  assert.match(rejected.errors.join('\n'), /confidentialCompute/i);
  assert.equal(rejected.artifactPolicy.storeWitness, false);

  const accepted = buildManagedZkProofJob({
    requestedAt: '2026-06-17T00:00:00.000Z',
    proofFamily: 'aoid-ownership',
    deploymentProfile: 'managed-saas',
    witnessMode: 'remote-encrypted-witness',
    confidentialCompute: true,
    artifactRefs: {
      encryptedWitnessRef: 's3://tenant-proof-staging/object-ref-only',
    },
    publicInputs: {
      issuerRoot: 'ISSUER-ROOT',
    },
  });

  assert.equal(accepted.accepted, true);
  assert.equal(accepted.status, 'queued');
  assert.ok(accepted.warnings.includes('remote-encrypted-witness-requires-reference-only-payload-and-short-retention'));
});

test('managed ZK proof private material collector flags proof secrets and accepts refs', () => {
  const errors = collectManagedZkProofServerPrivateMaterialErrors({
    artifactRefs: {
      encryptedWitnessRef: 'object-ref-only',
      verifierKeyRef: 'vk://agid/test',
    },
    privateInputs: {
      holderSecret: 'secret',
    },
    proofCode: '123456',
  });

  assert.match(errors.join('\n'), /privateInputs/i);
  assert.match(errors.join('\n'), /holderSecret/i);
  assert.match(errors.join('\n'), /proofCode/i);
  assert.doesNotMatch(errors.join('\n'), /encryptedWitnessRef/);
});
