import {
  ADDRESSQL_VERIFIER_HOOKS,
  runAddressQlVerifierHook,
  type AddressQlProofHookDecision,
} from './addressQlZkProofHooks';
import {
  verifyExternalVerifierReceipt,
  type ExternalVerifierReceiptDecision,
  type ExternalVerifierReceiptExpectation,
  type ExternalVerifierReceiptV1,
} from './addressQlExternalVerifierReceipt';
import {
  verifyVerifierLifecycle,
  type ChallengeConsumptionEvidence,
  type VerifierKeyLifecycleEvidence,
  type VerifierLifecycleDecision,
} from './addressQlVerifierLifecycle';

export type AddressQlExternalVerifierAdapterDecision = {
  status: 'accept' | 'block';
  verified: boolean;
  schemaDecision: AddressQlProofHookDecision;
  receiptDecision: ExternalVerifierReceiptDecision;
  lifecycleDecision: VerifierLifecycleDecision;
  errors: string[];
  nonClaims: string[];
};

/**
 * Composes the AddressQL public-input gate with an authenticated external
 * verifier receipt. Neither component may upgrade a failure in the other.
 */
export function runAddressQlExternalVerifierAdapter(
  receipt: ExternalVerifierReceiptV1,
  expected: ExternalVerifierReceiptExpectation,
  keyLifecycle: VerifierKeyLifecycleEvidence,
  challengeConsumption: ChallengeConsumptionEvidence,
): AddressQlExternalVerifierAdapterDecision {
  const hook = ADDRESSQL_VERIFIER_HOOKS.find(
    candidate => candidate.id === 'addressql-external-verifier-hook',
  );
  if (!hook) throw new Error('addressql-external-verifier-hook-missing');

  const schemaDecision = runAddressQlVerifierHook(expected.proofInput, hook);
  const receiptDecision = verifyExternalVerifierReceipt(receipt, expected);
  const lifecycleDecision = verifyVerifierLifecycle(
    receipt,
    expected,
    keyLifecycle,
    challengeConsumption,
  );
  const errors = [
    ...schemaDecision.errors.map(error => `schema:${error}`),
    ...receiptDecision.errors.map(error => `receipt:${error}`),
    ...lifecycleDecision.errors.map(error => `lifecycle:${error}`),
  ];
  const verified =
    schemaDecision.schemaAccepted
    && schemaDecision.hookReady
    && receiptDecision.verified
    && lifecycleDecision.verified
    && errors.length === 0;

  return {
    status: verified ? 'accept' : 'block',
    verified,
    schemaDecision,
    receiptDecision,
    lifecycleDecision,
    errors,
    nonClaims: [...new Set([
      ...schemaDecision.nonClaims,
      ...receiptDecision.nonClaims,
      ...lifecycleDecision.nonClaims,
      'Adapter acceptance is conditional on trusted authenticity, cryptographic-verification, key-status, and atomic challenge-consumption evidence.',
    ])],
  };
}
