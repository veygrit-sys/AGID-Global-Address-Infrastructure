import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESSQL_PROOF_CANONICAL_CLAIM_STATEMENTS,
  ADDRESSQL_PROOF_ALLOWED_PUBLIC_SIGNAL_KEYS,
  ADDRESSQL_PROOF_INPUT_SCHEMA,
  ADDRESSQL_PROOF_NON_CLAIMS,
  ADDRESSQL_VERIFIER_HOOKS,
  ADDRESSQL_ZK_PROOF_HOOK_VERSION,
  createSyntheticAddressQlProofInput,
  runAddressQlVerifierHook,
  validateAddressQlProofInput,
  validateAddressQlZkProofHookPlan,
} from './addressQlZkProofHooks';

test('AddressQL ZK v0.6 defines proof input schema and non-claim boundaries', () => {
  assert.equal(ADDRESSQL_ZK_PROOF_HOOK_VERSION, 'addressql-zk-proof-hooks-v0.6');
  assert.deepEqual(validateAddressQlZkProofHookPlan(), []);

  const schemaPaths = new Set(ADDRESSQL_PROOF_INPUT_SCHEMA.map(field => field.path));
  for (const path of [
    'envelopeCommitment',
    'publicSignals.challengeHash',
    'publicSignals.nullifierHash',
    'publicSignals.verifierPolicyHash',
    'roots.revocationRoot',
    'roots.freshnessRoot',
    'verifierPolicy.allowedClaims',
    'proofArtifact.publicInputCommitment',
  ]) {
    assert.ok(schemaPaths.has(path), `missing schema path ${path}`);
  }

  assert.ok(ADDRESSQL_PROOF_ALLOWED_PUBLIC_SIGNAL_KEYS.includes('nullifierHash'));
  assert.ok(ADDRESSQL_PROOF_NON_CLAIMS.some(nonClaim => /not cryptographic proof verification/i.test(nonClaim)));
  assert.ok(ADDRESSQL_PROOF_NON_CLAIMS.some(nonClaim => /does not prove address resolution correctness/i.test(nonClaim)));
});

test('AddressQL ZK v0.6 accepts a safe synthetic proof input without claiming real verification', () => {
  const input = createSyntheticAddressQlProofInput();
  const errors = validateAddressQlProofInput(input);
  const decision = runAddressQlVerifierHook(input);

  assert.deepEqual(errors, []);
  assert.equal(input.claim.statement, ADDRESSQL_PROOF_CANONICAL_CLAIM_STATEMENTS.deliverable);
  assert.equal(decision.schemaAccepted, true);
  assert.equal(decision.hookReady, true);
  assert.equal(decision.verified, false);
  assert.equal(decision.cryptographicVerification, 'not_performed');
  assert.ok(decision.warnings.includes('cryptographic-verification-not-performed'));
  assert.ok(decision.nonClaims.some(nonClaim => /not proof of residence/i.test(nonClaim)));
});

test('AddressQL ZK v0.6 rejects raw address and witness-like material', () => {
  const unsafe = {
    ...createSyntheticAddressQlProofInput(),
    publicSignals: {
      ...createSyntheticAddressQlProofInput().publicSignals,
      rawAddressText: 'synthetic raw address that must never be public',
    },
    witness: {
      privateKey: 'synthetic-private-key-placeholder',
      proofSecret: 'synthetic-proof-secret-placeholder',
    },
  };

  const errors = validateAddressQlProofInput(unsafe);
  const decision = runAddressQlVerifierHook(unsafe);

  assert.ok(errors.includes('unexpected-public-signal:rawAddressText'));
  assert.ok(errors.some(error => error.includes('private-material:proofInput.publicSignals.rawAddressText')));
  assert.ok(errors.some(error => error.includes('private-material:proofInput.witness')));
  assert.ok(decision.errors.includes('hook-rejected-private-material'));
  assert.equal(decision.schemaAccepted, false);
  assert.equal(decision.verified, false);
});

test('AddressQL ZK v0.6 verifier policy must allow the requested claim', () => {
  const input = createSyntheticAddressQlProofInput({
    claim: {
      kind: 'quality_threshold',
      purpose: 'address_login',
      statement: ADDRESSQL_PROOF_CANONICAL_CLAIM_STATEMENTS.quality_threshold,
    },
    verifierPolicy: {
      ...createSyntheticAddressQlProofInput().verifierPolicy,
      allowedClaims: ['deliverable'],
    },
  });

  const errors = validateAddressQlProofInput(input);
  assert.ok(errors.includes('claim-not-allowed-by-verifier-policy'));
});

test('AddressQL ZK v0.6 rejects free-form claim statements and unknown input fields', () => {
  const input = createSyntheticAddressQlProofInput();
  const unsafe = {
    ...input,
    extraPublicContext: 'not-allowed',
    claim: {
      ...input.claim,
      statement: 'addressql:deliverable:extra',
      extra: 'not-allowed',
    },
  };

  const errors = validateAddressQlProofInput(unsafe);
  const decision = runAddressQlVerifierHook(unsafe);

  assert.ok(errors.includes('claim-statement-not-canonical'));
  assert.ok(errors.includes('unexpected-field:proofInput.extraPublicContext'));
  assert.ok(errors.includes('unexpected-field:proofInput.claim.extra'));
  assert.equal(decision.schemaAccepted, false);
  assert.equal(decision.hookReady, false);
  assert.equal(decision.verified, false);
});

test('AddressQL ZK v0.6 external verifier hook remains a hook contract, not an in-process circuit', () => {
  const input = createSyntheticAddressQlProofInput({
    proofArtifact: {
      format: 'external_verifier_receipt',
      proofCommitment: 'commitment:external-proof-receipt:synthetic:v0.6',
      publicInputCommitment: 'commitment:external-public-inputs:synthetic:v0.6',
    },
  });

  const hook = ADDRESSQL_VERIFIER_HOOKS.find(hook => hook.id === 'addressql-external-verifier-hook');
  assert.ok(hook);

  const decision = runAddressQlVerifierHook(input, hook);
  assert.equal(decision.schemaAccepted, true);
  assert.equal(decision.cryptographicVerification, 'external_required');
  assert.equal(decision.verified, false);
  assert.ok(decision.warnings.includes('external-verifier-required'));
});

test('AddressQL ZK v0.6 docs are linked and explicitly defer real circuits', () => {
  const readme = readFileSync('docs/addressql/README.md', 'utf8');
  const techStack = readFileSync('docs/addressql/technical-stack.md', 'utf8');
  const docs = readFileSync('docs/addressql/zk-proof-hooks-v0.6.md', 'utf8');

  assert.match(readme, /ZK Proof Hooks v0\.6/);
  assert.match(techStack, /addressql-proof-hooks/);
  assert.match(docs, /proof input schema/i);
  assert.match(docs, /verifier hook/i);
  assert.match(docs, /non-claim tests/i);
  assert.match(docs, /does not add real ZK circuits/i);
});
