import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  SHIPPING_LABEL_ADDRESS_REFERENCE_COMMITMENT_ALGORITHM,
  SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS,
  buildShippingLabelQrPayload,
  createShippingLabelRecipientChallengeSignature,
  createShippingLabelRecipientCommitment,
  mergeShippingLabelScanProofs,
  mergeShippingLabelScanProofsWithOptions,
  parseShippingLabelQrPayload,
  verifyShippingLabelScan,
} from './shippingLabelQr';
import {
  buildRegisteredAddressQrPayload,
  buildRegisteredAddressRecord,
} from './registeredAddressQr';

function privateAddressPayload() {
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

test('shipping label QR wraps an address reference without copying private address fields', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-001',
    carrierId: 'carrier-a',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'handoff-1234',
    issuedAt: '2026-06-07T00:00:00.000Z',
    expiresAt: '2026-06-07T00:15:00.000Z',
  });
  const record = parseShippingLabelQrPayload(payload);

  assert.ok(record);
  assert.match(record.waybillId, /^WBA-[0-9A-F]{12,32}$/);
  assert.match(record.waybillCommitment ?? '', /^WBC-[0-9A-F]{40}$/);
  assert.match(record.jti, /^[0-9A-HJKMNP-TV-Z]{16,64}$/);
  assert.match(record.nullifier.value, /^SLN-/);
  assert.equal(record.riskLevel, 'standard');
  assert.equal(record.safetyPolicy.mode, 'standard');
  assert.equal(record.safetyPolicy.agidSharing, 'public-agid-ok');
  assert.equal(record.safetyPolicy.retainAddressHistory, true);
  assert.equal(record.expiresAt, '2026-06-07T00:15:00.000Z');
  assert.equal(record.address.agid, undefined);
  assert.match(record.address.referenceCommitment ?? '', /^ARC-[0-9A-F]{40}$/);
  assert.equal(record.address.commitmentAlgorithm, SHIPPING_LABEL_ADDRESS_REFERENCE_COMMITMENT_ALGORITHM);
  assert.equal(record.addressAccuracy.status, 'partial');
  assert.equal(record.addressAccuracy.decision, 'review');
  assert.equal(record.addressAccuracy.scoreVisibleToUser, false);
  assert.equal('internalScore' in record.addressAccuracy, false);
  assert.equal(record.domainSeparation.carrier, SHIPPING_LABEL_DOMAIN_SEPARATION_DEFAULTS.carrier);
  assert.equal(record.recipientProof.method, 'recipient-secret-commitment');
  assert.equal(
    record.recipientProof.commitment,
    createShippingLabelRecipientCommitment({
      waybillId: record.waybillId,
      recipientSecret: 'handoff-1234',
      nonce: record.recipientProof.nonce,
      domain: record.recipientProof.domain,
      method: record.recipientProof.method,
    }),
  );
  assert.ok(record.recipientProof.domain);
  assert.ok(record.recipientProof.nonce);
  assert.doesNotMatch(payload, /Private Receiver|\+81 90|1-1 Chiyoda|JP05AV8TJGH8|WB-001|Tokyo|1000001/);
  assert.doesNotMatch(payload, /internalScore/);
  assert.doesNotMatch(payload, /handoff-1234/);
});

test('shipping label QR stores verified address quality when external evidence agrees', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-quality-001',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'quality-proof',
    addressAccuracyEvidence: {
      postalCodeApi: {
        status: 'verified',
        source: 'zipcloud',
        country: 'JP',
        city: 'Tokyo',
        postcode: '1000001',
      },
      agidReverseGeocoding: {
        status: 'verified',
        source: 'agid-reverse-geocoder',
        country: 'JP',
        city: 'Tokyo',
        postcode: '1000001',
      },
    },
  });
  const record = parseShippingLabelQrPayload(payload);
  const scan = verifyShippingLabelScan(payload, { role: 'carrier' });

  assert.ok(record);
  assert.equal(record.addressAccuracy.status, 'verified');
  assert.equal(record.addressAccuracy.decision, 'accept');
  assert.deepEqual(record.addressAccuracy.sources.sort(), [
    'address-reference',
    'agid-reverse-geocoding',
    'country-address-validation',
    'postal-code-api',
  ].sort());
  assert.equal('internalScore' in record.addressAccuracy, false);
  assert.ok(scan);
  assert.equal(scan.addressAccuracyStatus, 'verified');
  assert.equal(scan.addressAccuracyDecision, 'accept');
});

test('shipping label domain separation changes aliases, recipient commitments, and nullifiers by purpose', () => {
  const base = {
    waybillId: 'wb-domain-001',
    jti: '0123456789ABCDEFGHJKMNPQ',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'domain-secret',
    issuedAt: '2026-06-07T00:00:00.000Z',
  };
  const deliveryPayload = buildShippingLabelQrPayload(base);
  const returnPayload = buildShippingLabelQrPayload({
    ...base,
    domainSeparation: {
      waybillAlias: 'return:waybill-alias',
      waybillCommitment: 'return:waybill-commitment',
      addressReference: 'return:address-reference',
      nullifier: 'return:nullifier',
      carrier: 'return:carrier',
      recipient: 'return:recipient',
      return: 'return',
      pickup: 'pickup',
    },
  });
  const delivery = parseShippingLabelQrPayload(deliveryPayload);
  const returned = parseShippingLabelQrPayload(returnPayload);

  assert.ok(delivery);
  assert.ok(returned);
  assert.notEqual(delivery.waybillId, returned.waybillId);
  assert.notEqual(delivery.recipientProof.commitment, returned.recipientProof.commitment);
  assert.notEqual(delivery.nullifier.value, returned.nullifier.value);
  assert.equal(returned.recipientProof.domain, 'return:recipient');
  assert.equal(returned.nullifier.scope, 'return:nullifier');
});

test('shipping label recipient proof supports passkey, AOID credential, and NFC card commitments', () => {
  const methods = [
    ['passkey-webauthn', 'passkey-assertion-secret', 'recipient-passkey-proof-mismatch'],
    ['aoid-credential', 'aoid-holder-secret', 'recipient-aoid-credential-proof-mismatch'],
    ['nfc-card', 'nfc-card-secret', 'recipient-nfc-card-proof-mismatch'],
  ] as const;

  for (const [method, recipientSecret, mismatch] of methods) {
    const payload = buildShippingLabelQrPayload({
      waybillId: `wb-${method}`,
      addressPayload: privateAddressPayload(),
      recipientProofMethod: method,
      recipientProofSecret: recipientSecret,
    });
    const record = parseShippingLabelQrPayload(payload);
    assert.ok(record);
    assert.equal(record.recipientProof.method, method);
    assert.ok(record.recipientProof.domain?.includes(method));
    assert.ok(record.recipientProof.nonce);
    assert.doesNotMatch(payload, new RegExp(recipientSecret));

    const accepted = verifyShippingLabelScan(payload, {
      role: 'recipient',
      recipientProofSecret: recipientSecret,
    });
    const rejected = verifyShippingLabelScan(payload, {
      role: 'recipient',
      recipientProofSecret: `${recipientSecret}-wrong`,
    });
    assert.ok(accepted);
    assert.equal(accepted.accepted, true);
    assert.equal(accepted.ownerVerified, true);
    assert.ok(rejected);
    assert.equal(rejected.accepted, false);
    assert.ok(rejected.errors.includes(mismatch));
  }
});

test('shipping label scan requires carrier and recipient evidence before merged handoff proof', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-002',
    carrierId: 'carrier-a',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'handoff-5678',
    issuedAt: '2026-06-07T00:55:00.000Z',
    expiresAt: '2026-06-07T01:10:00.000Z',
  });
  const carrier = verifyShippingLabelScan(payload, {
    role: 'carrier',
    now: '2026-06-07T01:00:00.000Z',
  });
  const recipient = verifyShippingLabelScan(payload, {
    role: 'recipient',
    recipientProofCode: 'handoff-5678',
    now: '2026-06-07T01:01:00.000Z',
  });

  assert.ok(carrier);
  assert.ok(recipient);
  assert.equal(carrier.accepted, true);
  assert.equal(carrier.status, 'review');
  assert.equal(carrier.proofLevel, 'carrier-accepted');
  assert.ok(carrier.warnings.includes('recipient-scan-required-for-owner-proof'));
  assert.equal(recipient.accepted, true);
  assert.equal(recipient.ownerVerified, true);
  assert.equal(recipient.proofLevel, 'recipient-controlled');

  const merged = mergeShippingLabelScanProofs([carrier, recipient]);
  assert.equal(merged.proofLevel, 'recipient-controlled');
  assert.equal(merged.addressVerified, true);
  assert.equal(merged.recipientControlVerified, true);
  assert.equal(merged.addressAndOwnerVerified, true);
  assert.equal(merged.packageReceiptVerified, true);
  assert.equal(merged.deliveryCompleted, false);
  assert.equal(merged.claims.validAddressReference, true);
  assert.equal(merged.claims.recipientControl, true);
  assert.equal(merged.claims.packageReceipt, true);
  assert.equal(merged.claims.deliveryCompleted, false);

  const terminalSigned = mergeShippingLabelScanProofsWithOptions([carrier, recipient], {
    terminalSigned: true,
  });
  assert.equal(terminalSigned.proofLevel, 'delivery-completed');
  assert.equal(terminalSigned.deliveryCompleted, true);
  assert.equal(terminalSigned.claims.deliveryCompleted, true);
});

test('shipping label merged proof keeps partial carrier and recipient scans separate', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-002-partial',
    carrierId: 'carrier-a',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'handoff-partial',
    issuedAt: '2026-06-07T00:55:00.000Z',
    expiresAt: '2026-06-07T01:10:00.000Z',
  });
  const carrier = verifyShippingLabelScan(payload, {
    role: 'carrier',
    now: '2026-06-07T01:00:00.000Z',
  });
  const recipient = verifyShippingLabelScan(payload, {
    role: 'recipient',
    recipientProofCode: 'handoff-partial',
    now: '2026-06-07T01:01:00.000Z',
  });

  assert.ok(carrier);
  assert.ok(recipient);

  const carrierOnly = mergeShippingLabelScanProofs([carrier]);
  assert.equal(carrierOnly.proofLevel, 'carrier-accepted');
  assert.equal(carrierOnly.addressVerified, true);
  assert.equal(carrierOnly.packageReceiptVerified, false);
  assert.ok(carrierOnly.errors.includes('recipient-owner-proof-missing'));

  const recipientOnly = mergeShippingLabelScanProofs([recipient]);
  assert.equal(recipientOnly.proofLevel, 'recipient-controlled');
  assert.equal(recipientOnly.recipientControlVerified, true);
  assert.equal(recipientOnly.packageReceiptVerified, false);
  assert.ok(recipientOnly.errors.includes('carrier-scan-missing'));
});

test('shipping label recipient scan rejects missing or wrong recipient proof code', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-003',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'correct-code',
  });

  const missing = verifyShippingLabelScan(payload, { role: 'recipient' });
  const wrong = verifyShippingLabelScan(payload, {
    role: 'recipient',
    recipientProofCode: 'wrong-code',
  });

  assert.ok(missing);
  assert.ok(wrong);
  assert.equal(missing.accepted, false);
  assert.ok(missing.errors.includes('recipient-proof-code-required'));
  assert.equal(wrong.accepted, false);
  assert.ok(wrong.errors.includes('recipient-proof-code-mismatch'));
});

test('shipping label defaults to short expiry and rejects reused recipient nullifiers', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-ttl-001',
    jti: '0123456789ABCDEFGHJKMNPQ',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'copy-proof',
    issuedAt: '2026-06-07T02:00:00.000Z',
  });
  const record = parseShippingLabelQrPayload(payload);
  assert.ok(record);
  assert.equal(record.expiresAt, '2026-06-07T02:15:00.000Z');

  const used = verifyShippingLabelScan(payload, {
    role: 'recipient',
    recipientProofCode: 'copy-proof',
    usedNullifiers: [record.nullifier.value],
    now: '2026-06-07T02:01:00.000Z',
  });
  assert.ok(used);
  assert.equal(used.accepted, false);
  assert.ok(used.errors.includes('shipping-label-nullifier-already-used'));
});

test('high-risk shipping label requires POS challenge signature at recipient handoff', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-high-risk-001',
    jti: 'ABCDEFGHJKMNPQRST0123456',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'high-risk-proof',
    riskLevel: 'high',
    highRiskUseCases: ['domestic-violence', 'evacuation', 'refugee', 'humanitarian'],
    issuedAt: '2026-06-07T03:00:00.000Z',
  });
  const record = parseShippingLabelQrPayload(payload);
  assert.ok(record);
  assert.equal(record.expiresAt, '2026-06-07T03:05:00.000Z');
  assert.equal(record.safetyPolicy.mode, 'high-risk');
  assert.deepEqual(record.safetyPolicy.useCases, ['domestic-violence', 'evacuation', 'refugee', 'humanitarian']);
  assert.equal(record.safetyPolicy.agidSharing, 'agid-s-only');
  assert.equal(record.safetyPolicy.maxTtlSeconds, 300);
  assert.equal(record.safetyPolicy.revokeOnReceipt, true);
  assert.equal(record.safetyPolicy.immediateRevocationRequired, true);
  assert.equal(record.safetyPolicy.retainAddressHistory, false);
  assert.equal(record.safetyPolicy.addressHistoryPolicy, 'not-retained');
  assert.doesNotMatch(payload, /JP05AV8TJGH8|Private Receiver|\+81 90|1-1 Chiyoda/);

  const missing = verifyShippingLabelScan(payload, {
    role: 'recipient',
    recipientProofCode: 'high-risk-proof',
    now: '2026-06-07T03:01:00.000Z',
  });
  assert.ok(missing);
  assert.equal(missing.accepted, false);
  assert.ok(missing.errors.includes('recipient-challenge-signature-required'));

  const challenge = 'WCH-TEST-CHALLENGE';
  const signature = createShippingLabelRecipientChallengeSignature({
    waybillId: record.waybillId,
    jti: record.jti,
    recipientSecret: 'high-risk-proof',
    recipientProofMethod: record.recipientProof.method,
    recipientProofDomain: record.recipientProof.domain,
    recipientProofNonce: record.recipientProof.nonce,
    challenge,
  });
  const accepted = verifyShippingLabelScan(payload, {
    role: 'recipient',
    recipientProofCode: 'high-risk-proof',
    recipientChallenge: { challenge, signature },
    now: '2026-06-07T03:01:00.000Z',
  });
  assert.ok(accepted);
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.ownerVerified, true);
  assert.equal(accepted.recipientChallengeRequired, true);
  assert.equal(accepted.recipientChallengeVerified, true);
  assert.match(accepted.privacyNotes.join('\n'), /High-risk mode requires AGID-S-only sharing/);
});

test('shipping label scan rejects expired labels and supports direct public AGID references', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-004',
    addressPayload: 'JP05AV8TJGH8',
    recipientProofCode: 'handoff-9999',
    issuedAt: '2026-06-07T00:00:00.000Z',
    expiresAt: '2026-06-07T00:30:00.000Z',
  });
  const scan = verifyShippingLabelScan(payload, {
    role: 'carrier',
    now: '2026-06-07T00:31:00.000Z',
  });
  const record = parseShippingLabelQrPayload(payload);

  assert.ok(record);
  assert.equal(record.address.kind, 'agid');
  assert.equal(record.address.agid, undefined);
  assert.match(record.address.referenceCommitment ?? '', /^ARC-/);
  assert.doesNotMatch(payload, /JP05AV8TJGH8|wb-004/i);
  assert.ok(scan);
  assert.equal(scan.accepted, false);
  assert.ok(scan.errors.includes('shipping-label-expired'));
});
