import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  evaluatePosEthereumPayment,
  hasPosEthereumPaymentSignal,
} from './posEthereumPayment';

const VALID_TX = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

test('POS Ethereum payment accepts prepaid escrow with public-only tx evidence', () => {
  const decision = evaluatePosEthereumPayment({
    paymentKind: 'prepaid',
    settlementMode: 'ethereum-escrow',
    paymentId: 'pay-prepaid-001',
    escrowId: 'escrow-prepaid-001',
    payerCommitment: 'payer_commitment_public',
    payeeCommitment: 'payee_commitment_public',
    amount: '12.50',
    currency: 'USDC',
    tokenContract: '0x1111111111111111111111111111111111111111',
    observedTxHash: VALID_TX,
    networkId: 'base-sepolia',
  });

  assert.equal(decision.accepted, true);
  assert.equal(decision.paymentKind, 'prepaid');
  assert.equal(decision.status, 'paid');
  assert.equal(decision.handoffGate.canReleasePackage, true);
  assert.equal(decision.handoffGate.reason, 'escrow-funded-release-after-handoff');
  assert.equal(decision.txPlan?.executionMode, 'observed');
  assert.equal(decision.ethereumRecord?.paymentStatus, 'authorized');
  assert.equal(decision.privacy.rawAddressStored, false);
});

test('POS Ethereum payment gates collect-on-delivery until payment is observed', () => {
  const decision = evaluatePosEthereumPayment({
    paymentKind: 'collect-on-delivery',
    settlementMode: 'ethereum-registry',
    amount: 2400,
    currency: 'JPY',
    waybillAlias: 'WBA-ONLY-ALIAS',
  });

  assert.equal(decision.accepted, true);
  assert.equal(decision.handoffGate.canAcceptCarrierScan, true);
  assert.equal(decision.handoffGate.canReleasePackage, false);
  assert.equal(decision.requiredAction, 'collect-payment-from-recipient-before-release');
  assert.ok(decision.requiredControls.includes('recipient-payment-before-release'));
  assert.equal(decision.txPlan?.operation, 'record-payment');
});

test('POS Ethereum payment rejects private material and invalid tx hashes', () => {
  const decision = evaluatePosEthereumPayment({
    paymentKind: 'prepaid',
    settlementMode: 'ethereum-registry',
    rawAddress: '1-1 Chiyoda, Tokyo',
    rawAgid: 'AGID-SECRET-123',
    privateKey: '0xsecret',
    observedTxHash: '0x1234',
    amount: '10.00',
    currency: 'ETH',
  });

  assert.equal(decision.accepted, false);
  assert.ok(decision.errors.includes('rawAddress-not-allowed-in-pos-ethereum-payment'));
  assert.ok(decision.errors.includes('rawAgid-not-allowed-in-pos-ethereum-payment'));
  assert.ok(decision.errors.includes('privateKey-not-allowed-in-pos-ethereum-payment'));
  assert.ok(decision.errors.includes('observed-payment-tx-hash-invalid'));
  assert.equal(decision.txPlan, undefined);
});

test('POS Ethereum payment signal detects explicit payment fields only', () => {
  assert.equal(hasPosEthereumPaymentSignal({ amount: 1000, currency: 'JPY' }), false);
  assert.equal(hasPosEthereumPaymentSignal({ paymentKind: 'prepaid' }), true);
  assert.equal(hasPosEthereumPaymentSignal({ observedTxHash: VALID_TX }), true);
});
