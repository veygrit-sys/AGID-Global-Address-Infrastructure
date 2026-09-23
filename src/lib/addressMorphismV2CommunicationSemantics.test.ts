import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  ADDRESS_MORPHISM_V2_COMMUNICATION_SEMANTICS_VERSION,
  buildAddressCommunicationSemanticsReport,
  buildSyntheticCommunicationFixtures,
  communicationNonClaims,
  evaluateAddressCommunicationObject,
  negotiateAddressCommunicationCapability,
  validateNoPrivateMaterialInCommunication,
} from './addressMorphismV2CommunicationSemantics';

const docPath = 'docs/address-morphism-theory-v2/address-communication-semantics.md';

test('communication semantics report defines the address communication layer', () => {
  const report = buildAddressCommunicationSemanticsReport();

  assert.equal(report.version, ADDRESS_MORPHISM_V2_COMMUNICATION_SEMANTICS_VERSION);
  assert.ok(report.modelKinds.includes('Address Communication Object'));
  assert.ok(report.modelKinds.includes('semantic ACK state machine'));
  assert.ok(report.modelKinds.includes('leakage-bounded communication'));
  assert.match(report.centralClaim, /least-disclosure message object/);
});

test('merchant proof-only message is valid without raw address disclosure', () => {
  const { merchantProofOnly, merchantPolicy, merchantReceiver } = buildSyntheticCommunicationFixtures();
  const decision = evaluateAddressCommunicationObject(
    merchantProofOnly,
    merchantPolicy,
    merchantReceiver,
    '2026-07-02T12:00:00.000Z',
  );

  assert.equal(decision.state, 'valid');
  assert.equal(decision.semanticAck, 'proof_verified');
  assert.deepEqual(decision.reasons, []);
  assert.ok(decision.safeFactsForReceiver.includes('claim:within_delivery_zone'));
  assert.ok(decision.safeFactsForReceiver.includes('disclosure:proofOnly'));
  assert.ok(decision.nonClaims.includes('Address communication is not raw address broadcast.'));
});

test('carrier decryptable message is valid only for a carrier receiver', () => {
  const { carrierDecryptable, carrierPolicy, carrierReceiver, merchantReceiver } = buildSyntheticCommunicationFixtures();
  const valid = evaluateAddressCommunicationObject(
    carrierDecryptable,
    carrierPolicy,
    carrierReceiver,
    '2026-07-02T12:00:00.000Z',
  );
  const invalidForMerchant = evaluateAddressCommunicationObject(
    carrierDecryptable,
    carrierPolicy,
    merchantReceiver,
    '2026-07-02T12:00:00.000Z',
  );

  assert.equal(valid.state, 'valid');
  assert.equal(valid.semanticAck, 'deliverable');
  assert.equal(invalidForMerchant.state, 'blocked');
  assert.ok(invalidForMerchant.reasons.includes('receiver-role-mismatch'));
  assert.ok(invalidForMerchant.reasons.includes('payload-not-supported-by-receiver'));
});

test('raw address and private material are blocked as unsafe communication', () => {
  const { unsafeRawLeak, merchantPolicy, merchantReceiver } = buildSyntheticCommunicationFixtures();
  const decision = evaluateAddressCommunicationObject(
    unsafeRawLeak,
    merchantPolicy,
    merchantReceiver,
    '2026-07-02T12:00:00.000Z',
  );

  assert.equal(decision.state, 'blocked');
  assert.equal(decision.semanticAck, 'disclosure_denied');
  assert.ok(decision.reasons.includes('disclosure-exceeds-policy'));
  assert.ok(decision.reasons.includes('private-material-present:rawAddress'));
  assert.ok(decision.reasons.includes('private-material-present:recipient'));
  assert.ok(decision.reasons.includes('proof-bundle-must-not-store-raw-address'));
  assert.ok(decision.reasons.includes('public-signal-name-suggests-private-material'));
});

test('expired and revoked messages produce semantic ACK failure states', () => {
  const { merchantProofOnly, merchantPolicy, merchantReceiver } = buildSyntheticCommunicationFixtures();
  const expired = evaluateAddressCommunicationObject(
    merchantProofOnly,
    merchantPolicy,
    merchantReceiver,
    '2026-07-04T00:00:00.000Z',
  );
  const revoked = evaluateAddressCommunicationObject(
    { ...merchantProofOnly, revocationStatus: 'revoked' },
    merchantPolicy,
    merchantReceiver,
    '2026-07-02T12:00:00.000Z',
  );

  assert.equal(expired.state, 'blocked');
  assert.equal(expired.semanticAck, 'expired');
  assert.ok(expired.reasons.includes('message-expired'));
  assert.equal(revoked.state, 'blocked');
  assert.equal(revoked.semanticAck, 'revoked');
  assert.ok(revoked.reasons.includes('message-revoked'));
});

test('ambiguous envelope routes to manual review instead of false precision', () => {
  const { merchantProofOnly, merchantPolicy, merchantReceiver } = buildSyntheticCommunicationFixtures();
  const decision = evaluateAddressCommunicationObject(
    { ...merchantProofOnly, envelopeState: 'ambiguous' },
    merchantPolicy,
    merchantReceiver,
    '2026-07-02T12:00:00.000Z',
  );

  assert.equal(decision.state, 'blocked');
  assert.equal(decision.semanticAck, 'manual_review_required');
  assert.ok(decision.reasons.includes('envelope-ambiguous-manual-review-required'));
});

test('capability negotiation finds mutual payload, disclosure, proof, and ACK surface', () => {
  const { merchantPolicy, merchantReceiver, carrierPolicy, carrierReceiver } = buildSyntheticCommunicationFixtures();
  const merchant = negotiateAddressCommunicationCapability(merchantPolicy, merchantReceiver);
  const carrier = negotiateAddressCommunicationCapability(carrierPolicy, carrierReceiver);

  assert.deepEqual(merchant.blockers, []);
  assert.ok(merchant.compatiblePayloadTypes.includes('proof'));
  assert.equal(merchant.maxMutualDisclosure, 'proofOnly');
  assert.ok(merchant.ackStates.includes('proof_verified'));

  assert.deepEqual(carrier.blockers, []);
  assert.ok(carrier.compatiblePayloadTypes.includes('carrier-token'));
  assert.equal(carrier.maxMutualDisclosure, 'carrierDecryptable');
  assert.ok(carrier.compatibleProofTypes.includes('carrier-encryption'));
});

test('no-private-material validator catches unsafe public-signal labels', () => {
  const { merchantProofOnly } = buildSyntheticCommunicationFixtures();
  const errors = validateNoPrivateMaterialInCommunication({
    ...merchantProofOnly,
    proofBundle: {
      ...merchantProofOnly.proofBundle,
      publicSignals: ['unit_private_hint'],
    },
  });

  assert.deepEqual(errors, ['public-signal-name-suggests-private-material']);
});

test('communication semantics non-claims preserve AMT safety boundaries', () => {
  const nonClaims = communicationNonClaims();

  assert.ok(nonClaims.includes('A semantic ACK is not proof of residence, ownership, or sovereignty.'));
  assert.ok(nonClaims.includes('Deliverability acceptance is not identity verification.'));
  assert.ok(nonClaims.includes('A valid message cannot repair bad AMT resolution.'));
});

test('communication semantics document is linked to the executable model', () => {
  const doc = readFileSync(docPath, 'utf8');

  assert.match(doc, /# AMT v2 Address Communication Semantics/);
  assert.match(doc, /Address Communication Object/);
  assert.match(doc, /Semantic ACK/);
  assert.match(doc, /ValidComm/);
  assert.match(doc, /src\/lib\/addressMorphismV2CommunicationSemantics\.ts/);
  assert.match(doc, /src\/lib\/addressMorphismV2CommunicationSemantics\.test\.ts/);
  assert.match(doc, /raw address broadcast/);
});

