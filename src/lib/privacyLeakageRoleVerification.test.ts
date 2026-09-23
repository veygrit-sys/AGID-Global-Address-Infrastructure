import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  issueAddressCredential,
} from './addressCredential';
import {
  buildRegisteredAddressQrPayload,
  buildRegisteredAddressRecord,
} from './registeredAddressQr';
import {
  createPrivateAddressPredicateProof,
  stripPrivateAddressPredicateProofMaterial,
} from './privateAddressPredicateProof';
import {
  buildShippingLabelQrPayload,
} from './shippingLabelQr';
import {
  createPosAcceptanceReceipt,
} from './posAcceptance';
import {
  PRIVACY_LEAKAGE_RESEARCH_SUMMARY,
  verifyPrivacyLeakageCountermeasureRole,
} from './privacyLeakageRoleVerification';

const issuerId = 'privacy-leakage-role-test-issuer';
const issuerSecret = 'privacy-leakage-role-test-secret';
const hiddenAddress = {
  country_code: 'JP',
  country: 'Japan',
  state: 'Tokyo',
  city: 'Chiyoda-ku',
  district: 'Marunouchi',
  road: 'Marunouchi',
  house_number: '1',
  building: 'Hidden Tower',
  postcode: '100-0001',
};

function privateRegisteredAddressPayload() {
  const record = buildRegisteredAddressRecord(
    {
      country: 'JP',
      recipient: 'Private Receiver',
      phone: '+81 90 0000 0000',
      street: '1-1 Chiyoda',
      city: 'Tokyo',
      postcode: '1000001',
    },
    {
      mode: 'ADDRESS',
      agid: 'JP05AV8TJGH8',
      now: '2026-06-07T00:00:00.000Z',
    },
  );
  return buildRegisteredAddressQrPayload(record, { privacy: 'full' });
}

test('public AGID reference keeps enough role signal while hiding private fields', () => {
  const result = verifyPrivacyLeakageCountermeasureRole({
    role: 'public-agid-reference',
    payload: {
      agid: 'JP05AV8TJGH8',
      publicLabel: 'Tokyo Station public cell',
      status: 'verified',
      sourceIds: ['osm:public-feature'],
    },
  });

  assert.equal(result.decision, 'pass');
  assert.equal(result.privacySatisfied, true);
  assert.equal(result.roleSatisfied, true);
  assert.deepEqual(result.missingSignals, []);
  assert.ok(result.inferredSignals.includes('public-agid'));
  assert.ok(result.inferredSignals.includes('public-label-or-context'));
});

test('public AGID reference fails when recipient or raw address leaks', () => {
  const result = verifyPrivacyLeakageCountermeasureRole({
    role: 'public-agid-reference',
    payload: {
      agid: 'JP05AV8TJGH8',
      publicLabel: 'Tokyo Station public cell',
      status: 'verified',
      recipient: 'Private Receiver',
      rawAddress: '1-1 Chiyoda, private room',
    },
    forbiddenPlaintextValues: ['Private Receiver', '1-1 Chiyoda'],
  });

  assert.equal(result.decision, 'fail');
  assert.equal(result.privacySatisfied, false);
  assert.ok(result.leakageFindings.some(finding => finding.includes('recipient')));
  assert.ok(result.leakageFindings.some(finding => finding.includes('rawAddress')));
  assert.ok(result.leakageFindings.some(finding => finding.startsWith('forbidden-plaintext-value')));
});

test('ZK residence proof public envelope preserves predicates, scope, freshness, and revocation without leaking address', async () => {
  const credential = await issueAddressCredential({
    issuerId,
    issuerSecret,
    address: hiddenAddress,
    countryCode: 'JP',
    postalCode: '100-0001',
    layer: 'AOID',
    subjectId: 'aoid:hidden-resident',
    claimKind: 'residence',
    assuranceLevel: 'issuer-attested',
    evidenceCommitmentRefs: ['evidence:jp-residence-registry:commitment'],
    verificationStatus: 'verified',
    verificationScore: 0.94,
    sourceIds: ['japan-post', 'tokyo-open-admin-boundary'],
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateSalt: 'privacy-role-credential-private-salt',
  });
  const proof = await createPrivateAddressPredicateProof({
    issuerId,
    issuerSecret,
    credential,
    credentialIssuerSecret: issuerSecret,
    address: hiddenAddress,
    predicates: [
      { kind: 'country-resident', countryCode: 'JP' },
      { kind: 'city-resident', countryCode: 'JP', city: 'Chiyoda-ku' },
    ],
    scope: 'delivery-checkout',
    challenge: 'privacy-role-proof-challenge',
    issuedAt: '2026-01-01T00:05:00.000Z',
    ttlSeconds: 600,
    privateProofSalt: 'privacy-role-private-proof-salt',
  });
  const publicEnvelope = {
    ...stripPrivateAddressPredicateProofMaterial(proof),
    issuerTrustRoot: 'ITR-TEST-ROOT',
    revocation: {
      status: 'active',
      root: 'REV-TEST-ROOT',
    },
    freshness: {
      freshUntil: '2026-01-01T00:15:00.000Z',
    },
  };
  const result = verifyPrivacyLeakageCountermeasureRole({
    role: 'zk-residence-predicate',
    payload: publicEnvelope,
    forbiddenPlaintextValues: [
      'Marunouchi',
      'Hidden Tower',
      '100-0001',
      'privacy-role-credential-private-salt',
      'privacy-role-private-proof-salt',
      credential.claim.addressCommitment,
    ],
  });

  assert.equal(result.decision, 'pass');
  assert.equal(result.privacySatisfied, true);
  assert.equal(result.roleSatisfied, true);
  assert.equal(result.leakageFindings.length, 0);
  assert.ok(result.inferredSignals.includes('predicate-result'));
  assert.ok(result.inferredSignals.includes('freshness-window'));
  assert.ok(result.inferredSignals.includes('revocation-state'));
});

test('over-redacted ZK proof fails role sufficiency even when no private field leaks', () => {
  const result = verifyPrivacyLeakageCountermeasureRole({
    role: 'zk-residence-predicate',
    payload: {
      proofCommitment: 'PC-ONLY-NO-STATEMENT',
      revocation: { status: 'active' },
      freshness: { freshUntil: '2026-01-01T00:15:00.000Z' },
    },
  });

  assert.equal(result.decision, 'fail');
  assert.equal(result.privacySatisfied, true);
  assert.equal(result.roleSatisfied, false);
  assert.ok(result.missingSignals.includes('predicate-result'));
  assert.ok(result.missingSignals.includes('scope'));
  assert.ok(result.missingSignals.includes('challenge-hash'));
});

test('AGID-S high-risk envelope can disclose operational validity without disclosing raw AGID', () => {
  const result = verifyPrivacyLeakageCountermeasureRole({
    role: 'agid-s-high-risk-sharing',
    payload: {
      token: 'AGIDS1-0123456789ABCDEFGHJKMNPQRST',
      envelope: {
        v: 1,
        alg: 'A256GCM',
        kid: 'ngo-field-key-2026-06',
        n: 'N0NC3TOKEN',
        c: 'CIPHERTEXTTOKEN',
        t: 'AUTHTAGTOKEN',
      },
      exp: 1770000000,
      jti: '0123456789ABCDEFGHJKMNPQ',
      revocation: { status: 'active', used: false },
      safetyPolicy: {
        mode: 'high-risk',
        agidSharing: 'agid-s-only',
        retainAddressHistory: false,
        addressHistoryPolicy: 'not-retained',
      },
    },
    forbiddenPlaintextValues: ['JP05AV8TJGH8', '1-1 Chiyoda'],
  });

  assert.equal(result.decision, 'pass');
  assert.equal(result.privacySatisfied, true);
  assert.equal(result.roleSatisfied, true);
  assert.ok(result.inferredSignals.includes('encrypted-location-token'));
  assert.ok(result.inferredSignals.includes('no-history-policy'));
});

test('AGID-S high-risk envelope fails if raw AGID or exact coordinates are exposed', () => {
  const result = verifyPrivacyLeakageCountermeasureRole({
    role: 'agid-s-high-risk-sharing',
    payload: {
      token: 'AGIDS1-0123456789ABCDEFGHJKMNPQRST',
      agid: 'JP05AV8TJGH8',
      lat: 35.681236,
      lon: 139.767125,
      exp: 1770000000,
      jti: '0123456789ABCDEFGHJKMNPQ',
      revocation: { status: 'active' },
      safetyPolicy: {
        mode: 'high-risk',
        agidSharing: 'agid-s-only',
        retainAddressHistory: false,
      },
    },
  });

  assert.equal(result.decision, 'fail');
  assert.equal(result.privacySatisfied, false);
  assert.ok(result.leakageFindings.some(finding => finding.includes('payload.agid')));
  assert.ok(result.leakageFindings.some(finding => finding.includes('payload.lat')));
  assert.ok(result.leakageFindings.some(finding => finding.includes('payload.lon')));
});

test('POS handoff receipt preserves scan-to-decision signals without storing proof code', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-privacy-role-pos',
    carrierId: 'carrier-a',
    addressPayload: privateRegisteredAddressPayload(),
    recipientProofCode: 'handoff-secret-code',
    issuedAt: '2026-06-07T00:00:00.000Z',
    expiresAt: '2026-06-07T00:15:00.000Z',
  });
  const receipt = createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    scanRole: 'carrier',
    carrierTerminalId: 'carrier-device-001',
    carrierTerminalSignature: 'carrier-signature-001',
    terminalId: 'pos-terminal-001',
    storePosId: 'store-pos-001',
  }, {
    now: '2026-06-07T00:01:00.000Z',
  });
  const result = verifyPrivacyLeakageCountermeasureRole({
    role: 'delivery-pos-handoff',
    payload: receipt,
    forbiddenPlaintextValues: [
      'handoff-secret-code',
      'Private Receiver',
      '+81 90 0000 0000',
      '1-1 Chiyoda',
      'JP05AV8TJGH8',
    ],
  });

  assert.equal(result.privacySatisfied, true);
  assert.equal(result.roleSatisfied, true);
  assert.notEqual(result.decision, 'fail');
  assert.ok(result.inferredSignals.includes('carrier-handoff'));
  assert.ok(result.inferredSignals.includes('handoff-state'));
  assert.ok(result.inferredSignals.includes('terminal-receipt-signature'));
  assert.equal(JSON.stringify(receipt).includes('handoff-secret-code'), false);
});

test('POS handoff public receipt fails if proof code is accidentally attached', () => {
  const result = verifyPrivacyLeakageCountermeasureRole({
    role: 'delivery-pos-handoff',
    payload: {
      status: 'accepted',
      carrierScanVerified: true,
      recipientControlVerified: true,
      proofLevel: 'delivery-completed',
      terminalEvidenceSignature: 'TSIG-TEST',
      nullifier: 'SLN-TEST',
      recipientProofCode: 'leaked-code',
    },
    forbiddenPlaintextValues: ['leaked-code'],
  });

  assert.equal(result.decision, 'fail');
  assert.equal(result.privacySatisfied, false);
  assert.ok(result.leakageFindings.some(finding => finding.includes('recipientProofCode')));
});

test('issuer trust registry exposes issuer policy but not subject credential fields', () => {
  const safe = verifyPrivacyLeakageCountermeasureRole({
    role: 'issuer-trust-credential',
    payload: {
      issuerId: 'issuer:ngo:jp:001',
      issuerTrustRoot: 'ITR-ROOT-001',
      claimKind: 'residence',
      credentialScope: ['residence', 'delivery-eligibility'],
      revocationPolicy: {
        type: 'status-list',
        status: 'active',
      },
      policyHash: 'POLICY-HASH-001',
    },
  });
  const unsafe = verifyPrivacyLeakageCountermeasureRole({
    role: 'issuer-trust-credential',
    payload: {
      issuerId: 'issuer:ngo:jp:001',
      issuerTrustRoot: 'ITR-ROOT-001',
      claimKind: 'residence',
      revocationPolicy: { type: 'status-list' },
      subjectId: 'aoid:hidden-resident',
      addressCommitment: 'ADDR-COMMITMENT-SHOULD-NOT-BE-IN-ISSUER-REGISTRY',
    },
  });

  assert.equal(safe.decision, 'pass');
  assert.equal(safe.privacySatisfied, true);
  assert.equal(safe.roleSatisfied, true);
  assert.equal(unsafe.decision, 'fail');
  assert.equal(unsafe.privacySatisfied, false);
  assert.ok(unsafe.leakageFindings.some(finding => finding.includes('subjectId')));
  assert.ok(unsafe.leakageFindings.some(finding => finding.includes('addressCommitment')));
});

test('research summary records the verification criteria and explicit limitation', () => {
  assert.ok(PRIVACY_LEAKAGE_RESEARCH_SUMMARY.researchCriteria.includes('public-signal-sufficiency'));
  assert.ok(PRIVACY_LEAKAGE_RESEARCH_SUMMARY.researchCriteria.includes('high-risk-location-suppression'));
  assert.ok(PRIVACY_LEAKAGE_RESEARCH_SUMMARY.limitation.some(value => value.includes('cryptographic ZK circuit audit')));
});
