import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildPosNfcPayload,
  createPosAcceptanceReceipt,
  previewPosAcceptanceInput,
} from './posAcceptance';
import {
  buildRegisteredAddressQrPayload,
  buildRegisteredAddressRecord,
} from './registeredAddressQr';
import {
  createAgidSecureToken,
  generateAgidSecureKey,
} from './agidSecureShare';
import {
  buildShippingLabelQrPayload,
  createShippingLabelRecipientChallengeSignature,
  parseShippingLabelQrPayload,
} from './shippingLabelQr';

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

test('POS acceptance receipts validate QR payloads without storing raw private material', () => {
  const payload = privateAddressPayload();
  const receipt = createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    terminalId: 'store-001',
    operatorId: 'cashier-a',
    purpose: 'retail-pickup',
    amount: 1200,
    currency: 'jpy',
  }, {
    now: '2026-06-07T00:01:00.000Z',
    requestId: 'req-001',
  });

  assert.equal(receipt.accepted, true);
  assert.equal(receipt.status, 'review');
  assert.equal(receipt.channel, 'qr');
  assert.equal(receipt.currency, 'JPY');
  assert.equal(receipt.record?.recordType, 'ADDRESS');
  assert.equal(receipt.record?.rawPayloadStored, false);
  assert.equal(receipt.record?.entityIdTail, 'AV8TJGH8'.slice(-6));
  assert.ok(receipt.warnings.includes('private-payload-redacted-before-receipt-storage'));
  assert.doesNotMatch(JSON.stringify(receipt), /Private Receiver|\+81 90|1-1 Chiyoda|agid:address:/);
});

test('POS acceptance unwraps AGID NFC payloads and records the NFC channel', () => {
  const payload = privateAddressPayload();
  const nfcPayload = buildPosNfcPayload(payload, {
    tagId: 'tag-001',
    terminalId: 'store-001',
    createdAt: '2026-06-07T00:02:00.000Z',
  });
  const receipt = createPosAcceptanceReceipt({
    payload: nfcPayload,
    channel: 'manual',
    terminalId: 'store-001',
  }, {
    now: '2026-06-07T00:03:00.000Z',
    requestId: 'req-002',
  });

  assert.equal(receipt.accepted, true);
  assert.equal(receipt.channel, 'nfc');
  assert.equal(receipt.record?.country, 'JP');
});

test('POS acceptance rejects unsupported payloads with actionable errors', () => {
  const receipt = createPosAcceptanceReceipt({
    payload: 'not an agid payload',
    channel: 'nfc',
  }, {
    now: '2026-06-07T00:04:00.000Z',
    requestId: 'req-003',
  });

  assert.equal(receipt.accepted, false);
  assert.equal(receipt.status, 'rejected');
  assert.deepEqual(receipt.errors, ['unsupported-or-invalid-agid-address-payload']);
  assert.ok(receipt.warnings.includes('nfc-channel-without-agid-nfc-wrapper'));
});

test('POS acceptance recognizes AGID-S and requires an authorized decryption key', async () => {
  const key = generateAgidSecureKey();
  const token = await createAgidSecureToken({
    agid: 'JP05AV8TJGH8',
    key,
    keyId: 'pos-k1',
    exp: Math.floor(Date.parse('2026-06-07T01:00:00.000Z') / 1000),
    purpose: 'pos',
    now: Date.parse('2026-06-07T00:00:00.000Z'),
  });
  const receipt = createPosAcceptanceReceipt({
    payload: buildPosNfcPayload(token, { tagId: 'tag-secure' }),
    terminalId: 'store-001',
    purpose: 'retail-pickup',
  }, {
    now: '2026-06-07T00:05:00.000Z',
    requestId: 'req-agid-s',
  });

  assert.equal(receipt.accepted, false);
  assert.equal(receipt.channel, 'nfc');
  assert.deepEqual(receipt.errors, ['agid-s-requires-decryption-key']);
  assert.doesNotMatch(JSON.stringify(receipt), /JP05AV8TJGH8/);
  assert.match(receipt.privacyNotes.join('\n'), /encrypted AGID envelope/);
});

test('POS acceptance accepts a direct public AGID after local AGID-S decryption', () => {
  const receipt = createPosAcceptanceReceipt({
    payload: 'JP05AV8TJGH8',
    channel: 'manual',
    terminalId: 'store-001',
  }, {
    now: '2026-06-07T00:06:00.000Z',
    requestId: 'req-direct-agid',
  });

  assert.equal(receipt.accepted, true);
  assert.equal(receipt.record?.recordType, 'AGID');
  assert.equal(receipt.record?.agidTail, '8TJGH8');
  assert.doesNotMatch(JSON.stringify(receipt), /agid:address:/);
});

test('POS acceptance supports shipping label carrier scan as a reviewable handoff step', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-pos-001',
    carrierId: 'carrier-a',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'handoff-pos',
    issuedAt: '2026-06-07T00:00:00.000Z',
    expiresAt: '2026-06-07T00:14:00.000Z',
  });
  const receipt = createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    terminalId: 'store-001',
    storePosId: 'store-pos-001',
    carrierTerminalId: 'courier-device-7',
    carrierTerminalSignature: 'CARRIER-SIG-ALIAS-001',
    carrierTerminalSignedAt: '2026-06-07T00:06:55.000Z',
    carrierLocationLat: 35.681236,
    carrierLocationLon: 139.767125,
    carrierLocationAccuracyMeters: 24,
    carrierLocationLabel: 'handoff desk',
    scanRole: 'carrier',
  }, {
    now: '2026-06-07T00:07:00.000Z',
    requestId: 'req-waybill-carrier',
  });

  assert.equal(receipt.accepted, true);
  assert.equal(receipt.status, 'review');
  assert.equal(receipt.record?.recordType, 'WAYBILL');
  assert.equal(receipt.shippingLabel?.scanRole, 'carrier');
  assert.match(receipt.shippingLabel?.waybillId ?? '', /^WBA-/);
  assert.equal(receipt.shippingLabel?.waybillAlias, true);
  assert.match(receipt.shippingLabel?.waybillCommitment ?? '', /^WBC-/);
  assert.match(receipt.shippingLabel?.addressReferenceCommitment ?? '', /^ARC-/);
  assert.match(receipt.shippingLabel?.jti ?? '', /^[0-9A-HJKMNP-TV-Z]{16,64}$/);
  assert.match(receipt.shippingLabel?.nullifier ?? '', /^SLN-/);
  assert.equal(receipt.shippingLabel?.riskLevel, 'standard');
  assert.equal(receipt.shippingLabel?.proofLevel, 'carrier-accepted');
  assert.equal(receipt.shippingLabel?.addressVerified, true);
  assert.equal(receipt.shippingLabel?.addressAccuracyStatus, 'partial');
  assert.equal(receipt.shippingLabel?.addressAccuracyDecision, 'review');
  assert.ok(receipt.shippingLabel?.addressAccuracySources.includes('country-address-validation'));
  assert.equal(receipt.shippingLabel?.recipientControlVerified, false);
  assert.equal(receipt.shippingLabel?.dualScanRequired, true);
  assert.match(receipt.shippingLabel?.terminalEvidenceSignature ?? '', /^TSIG-/);
  assert.equal(receipt.shippingLabel?.terminalSignedAt, '2026-06-07T00:07:00.000Z');
  assert.equal(receipt.shippingLabel?.storePosId, 'store-pos-001');
  assert.equal(receipt.shippingLabel?.carrierTerminalId, 'courier-device-7');
  assert.equal(receipt.shippingLabel?.carrierTerminalSignature, 'CARRIER-SIG-ALIAS-001');
  assert.equal(receipt.shippingLabel?.carrierTerminalSignedAt, '2026-06-07T00:06:55.000Z');
  assert.deepEqual(receipt.shippingLabel?.carrierLocation, {
    precision: 'coarse',
    latBucket: 35.68,
    lonBucket: 139.77,
    accuracyMeters: 1000,
    label: 'handoff desk',
  });
  assert.ok(receipt.warnings.includes('recipient-scan-required-for-owner-proof'));
  assert.doesNotMatch(JSON.stringify(receipt), /internalScore/);
  assert.doesNotMatch(JSON.stringify(receipt), /Private Receiver|\+81 90|1-1 Chiyoda|handoff-pos|agid:address:|JP05AV8TJGH8|wb-pos-001|Tokyo|1000001/i);
});

test('POS acceptance exposes only operational address quality, not detailed scores', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-pos-quality-001',
    carrierId: 'carrier-a',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'handoff-quality',
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
  const receipt = createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    terminalId: 'store-001',
    storePosId: 'store-pos-001',
    carrierTerminalId: 'courier-device-7',
    carrierTerminalSignature: 'CARRIER-SIG-QUALITY',
    scanRole: 'carrier',
  }, {
    now: '2026-06-07T00:07:00.000Z',
    requestId: 'req-waybill-quality',
  });

  assert.equal(receipt.shippingLabel?.addressAccuracyStatus, 'verified');
  assert.equal(receipt.shippingLabel?.addressAccuracyDecision, 'accept');
  assert.deepEqual(receipt.shippingLabel?.addressAccuracySources.sort(), [
    'address-reference',
    'agid-reverse-geocoding',
    'country-address-validation',
    'postal-code-api',
  ].sort());
  assert.doesNotMatch(JSON.stringify(receipt), /internalScore|1000001|Tokyo|JP05AV8TJGH8|handoff-quality/);
});

test('POS acceptance applies carrier refusal policy for PO Box and undeliverable regions', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-pos-policy-001',
    carrierId: 'carrier-a',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'handoff-policy',
  });
  const receipt = createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    terminalId: 'store-001',
    storePosId: 'store-pos-001',
    carrierTerminalId: 'courier-device-7',
    carrierTerminalSignature: 'CARRIER-SIG-POLICY',
    scanRole: 'carrier',
    carrierPolicy: {
      rejectPoBox: true,
      rejectUndeliverableRegion: true,
    },
    addressRisk: {
      poBox: true,
      undeliverableRegion: true,
      reasonCodes: ['po-box', 'undeliverable-region'],
    },
  }, {
    now: '2026-06-07T00:07:00.000Z',
    requestId: 'req-waybill-policy',
  });

  assert.equal(receipt.accepted, false);
  assert.equal(receipt.status, 'rejected');
  assert.ok(receipt.errors.includes('carrier-policy-rejects-po-box'));
  assert.ok(receipt.errors.includes('carrier-policy-rejects-undeliverable-region'));
  assert.ok(receipt.errors.includes('carrier-policy-requires-aoid-access-profile'));
  assert.deepEqual(
    receipt.shippingLabel?.carrierPolicyDecision?.reasons.sort(),
    ['carrier-policy', 'po-box', 'undeliverable-region'].sort(),
  );
  assert.doesNotMatch(JSON.stringify(receipt), /Private Receiver|\+81 90|1-1 Chiyoda|handoff-policy|JP05AV8TJGH8/i);
});

test('POS acceptance requires AOID access profile confirmation for auto-lock waybills', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-pos-autolock-001',
    carrierId: 'carrier-a',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'handoff-autolock',
  });
  const blocked = createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    terminalId: 'store-001',
    storePosId: 'store-pos-001',
    carrierTerminalId: 'courier-device-7',
    carrierTerminalSignature: 'CARRIER-SIG-AUTOLOCK',
    scanRole: 'carrier',
    carrierPolicy: {
      rejectAutoLock: false,
      requireAoidAccessProfileForPoBoxOrAutoLock: true,
    },
    addressRisk: {
      autoLock: true,
    },
  }, {
    now: '2026-06-07T00:07:00.000Z',
    requestId: 'req-waybill-autolock-blocked',
  });

  assert.equal(blocked.status, 'rejected');
  assert.ok(blocked.errors.includes('carrier-policy-requires-aoid-access-profile'));

  const allowed = createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    terminalId: 'store-001',
    storePosId: 'store-pos-001',
    carrierTerminalId: 'courier-device-7',
    carrierTerminalSignature: 'CARRIER-SIG-AUTOLOCK',
    scanRole: 'carrier',
    carrierPolicy: {
      rejectAutoLock: false,
      requireAoidAccessProfileForPoBoxOrAutoLock: true,
    },
    addressRisk: {
      autoLock: true,
      aoidAccessProfileConfirmed: true,
    },
  }, {
    now: '2026-06-07T00:08:00.000Z',
    requestId: 'req-waybill-autolock-allowed',
  });

  assert.notEqual(allowed.status, 'rejected');
  assert.equal(allowed.shippingLabel?.carrierPolicyDecision?.rejected, false);
});

test('POS acceptance rejects carrier waybill scans without delivery terminal signature evidence', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-pos-carrier-missing-sig',
    carrierId: 'carrier-a',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'handoff-pos',
    issuedAt: '2026-06-07T00:00:00.000Z',
    expiresAt: '2026-06-07T00:14:00.000Z',
  });
  const receipt = createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    terminalId: 'store-001',
    scanRole: 'carrier',
  }, {
    now: '2026-06-07T00:07:00.000Z',
    requestId: 'req-waybill-carrier-no-sig',
  });

  assert.equal(receipt.accepted, false);
  assert.equal(receipt.status, 'rejected');
  assert.ok(receipt.errors.includes('carrier-terminal-id-required'));
  assert.ok(receipt.errors.includes('carrier-terminal-signature-required'));
});

test('POS acceptance widens carrier location buckets for high-risk waybills', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-pos-carrier-high-location',
    carrierId: 'carrier-a',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'handoff-pos',
    riskLevel: 'high',
    issuedAt: '2026-06-07T00:00:00.000Z',
  });
  const receipt = createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    terminalId: 'store-001',
    storePosId: 'store-pos-001',
    carrierTerminalId: 'courier-device-7',
    carrierTerminalSignature: 'CARRIER-SIG-HIGH',
    carrierLocationLat: 35.681236,
    carrierLocationLon: 139.767125,
    carrierLocationAccuracyMeters: 24,
    scanRole: 'carrier',
  }, {
    now: '2026-06-07T00:01:00.000Z',
    requestId: 'req-waybill-carrier-high-location',
  });

  assert.equal(receipt.accepted, true);
  assert.equal(receipt.shippingLabel?.riskLevel, 'high');
  assert.equal(receipt.shippingLabel?.safetyPolicy.mode, 'high-risk');
  assert.equal(receipt.shippingLabel?.safetyPolicy.agidSharing, 'agid-s-only');
  assert.equal(receipt.shippingLabel?.safetyPolicy.retainAddressHistory, false);
  assert.deepEqual(receipt.shippingLabel?.carrierLocation, {
    precision: 'coarse-high-risk',
    latBucket: 35.7,
    lonBucket: 139.8,
    accuracyMeters: 10000,
  });
});

test('POS acceptance verifies recipient side of a shipping label without storing proof code', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-pos-002',
    carrierId: 'carrier-a',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'handoff-secret-code',
    issuedAt: '2026-06-07T00:00:00.000Z',
    expiresAt: '2026-06-07T00:14:00.000Z',
  });
  const receipt = createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    terminalId: 'store-001',
    scanRole: 'recipient',
    recipientProofCode: 'handoff-secret-code',
  }, {
    now: '2026-06-07T00:08:00.000Z',
    requestId: 'req-waybill-recipient',
  });

  assert.equal(receipt.accepted, true);
  assert.equal(receipt.status, 'accepted');
  assert.equal(receipt.record?.recordType, 'WAYBILL');
  assert.equal(receipt.shippingLabel?.scanRole, 'recipient');
  assert.equal(receipt.shippingLabel?.proofLevel, 'recipient-controlled');
  assert.equal(receipt.shippingLabel?.recipientControlVerified, true);
  assert.equal(receipt.shippingLabel?.packageReceiptVerified, true);
  assert.match(receipt.shippingLabel?.terminalEvidenceSignature ?? '', /^TSIG-/);
  assert.match(receipt.shippingLabel?.waybillId ?? '', /^WBA-/);
  assert.match(receipt.shippingLabel?.addressReferenceCommitment ?? '', /^ARC-/);
  assert.doesNotMatch(JSON.stringify(receipt), /handoff-secret-code|Private Receiver|\+81 90|1-1 Chiyoda|JP05AV8TJGH8|wb-pos-002|Tokyo|1000001/i);
});

test('POS acceptance allows prepaid Ethereum payment with observed tx evidence', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-pos-prepaid-eth',
    carrierId: 'carrier-a',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'prepaid-secret-code',
    issuedAt: '2026-06-07T00:00:00.000Z',
    expiresAt: '2026-06-07T00:14:00.000Z',
  });
  const receipt = createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    terminalId: 'store-001',
    scanRole: 'recipient',
    recipientProofCode: 'prepaid-secret-code',
    paymentKind: 'prepaid',
    settlementMode: 'ethereum-escrow',
    paymentStatus: 'escrowed',
    amount: 12.5,
    currency: 'usd',
    tokenSymbol: 'USDC',
    tokenContract: '0x1111111111111111111111111111111111111111',
    observedPaymentTxHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    paymentNetworkId: 'base-sepolia',
  }, {
    now: '2026-06-07T00:08:30.000Z',
    requestId: 'req-waybill-prepaid-eth',
  });

  assert.equal(receipt.accepted, true);
  assert.equal(receipt.status, 'accepted');
  assert.equal(receipt.ethereumPayment?.paymentKind, 'prepaid');
  assert.equal(receipt.ethereumPayment?.settlementMode, 'ethereum-escrow');
  assert.equal(receipt.ethereumPayment?.handoffGate.canReleasePackage, true);
  assert.equal(receipt.ethereumPayment?.txPlan?.executionMode, 'observed');
  assert.match(receipt.ethereumPayment?.publicPaymentRef ?? '', /^PEP-/);
  assert.doesNotMatch(JSON.stringify(receipt), /prepaid-secret-code|Private Receiver|\+81 90|1-1 Chiyoda|JP05AV8TJGH8|wb-pos-prepaid-eth/i);
});

test('POS acceptance keeps collect-on-delivery unpaid recipient scan in review', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-pos-cod-eth',
    carrierId: 'carrier-a',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'cod-secret-code',
    issuedAt: '2026-06-07T00:00:00.000Z',
    expiresAt: '2026-06-07T00:14:00.000Z',
  });
  const receipt = createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    terminalId: 'store-001',
    scanRole: 'recipient',
    recipientProofCode: 'cod-secret-code',
    paymentKind: 'collect-on-delivery',
    settlementMode: 'ethereum-registry',
    paymentStatus: 'requires-payment',
    amount: 2400,
    currency: 'jpy',
    tokenSymbol: 'ETH',
    paymentNetworkId: 'base-sepolia',
  }, {
    now: '2026-06-07T00:08:45.000Z',
    requestId: 'req-waybill-cod-eth',
  });

  assert.equal(receipt.accepted, true);
  assert.equal(receipt.status, 'review');
  assert.equal(receipt.shippingLabel?.recipientControlVerified, true);
  assert.equal(receipt.ethereumPayment?.paymentKind, 'collect-on-delivery');
  assert.equal(receipt.ethereumPayment?.handoffGate.canAcceptCarrierScan, true);
  assert.equal(receipt.ethereumPayment?.handoffGate.canReleasePackage, false);
  assert.equal(receipt.ethereumPayment?.requiredAction, 'collect-payment-from-recipient-before-release');
  assert.ok(receipt.warnings.includes('ethereum-payment-required-before-recipient-release'));
  assert.doesNotMatch(JSON.stringify(receipt), /cod-secret-code|Private Receiver|\+81 90|1-1 Chiyoda|JP05AV8TJGH8|wb-pos-cod-eth/i);
});

test('POS acceptance stores high-risk recipient challenge evidence without raw proof code', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-pos-high-001',
    jti: 'ABCDEFGHJKMNPQRST0123456',
    carrierId: 'carrier-a',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'high-risk-pos-code',
    riskLevel: 'high',
    issuedAt: '2026-06-07T00:10:00.000Z',
  });
  const record = parseShippingLabelQrPayload(payload);
  assert.ok(record);
  const challenge = 'WCH-POS-HIGH-RISK';
  const signature = createShippingLabelRecipientChallengeSignature({
    waybillId: record.waybillId,
    jti: record.jti,
    recipientSecret: 'high-risk-pos-code',
    recipientProofMethod: record.recipientProof.method,
    recipientProofDomain: record.recipientProof.domain,
    recipientProofNonce: record.recipientProof.nonce,
    challenge,
  });
  const receipt = createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    terminalId: 'store-001',
    scanRole: 'recipient',
    recipientProofCode: 'high-risk-pos-code',
    recipientChallenge: challenge,
    recipientChallengeSignature: signature,
  }, {
    now: '2026-06-07T00:11:00.000Z',
    requestId: 'req-waybill-high',
  });

  assert.equal(receipt.accepted, true);
  assert.equal(receipt.status, 'accepted');
  assert.equal(receipt.shippingLabel?.riskLevel, 'high');
  assert.equal(receipt.shippingLabel?.safetyPolicy.mode, 'high-risk');
  assert.equal(receipt.shippingLabel?.safetyPolicy.revokeOnReceipt, true);
  assert.equal(receipt.shippingLabel?.safetyPolicy.immediateRevocationRequired, true);
  assert.equal(receipt.shippingLabel?.safetyPolicy.addressHistoryPolicy, 'not-retained');
  assert.equal(receipt.shippingLabel?.recipientChallengeRequired, true);
  assert.equal(receipt.shippingLabel?.recipientChallengeVerified, true);
  assert.match(receipt.shippingLabel?.recipientChallengeHash ?? '', /^WCHH-/);
  assert.equal(receipt.shippingLabel?.recipientChallengeSignatureTail, signature.slice(-10));
  assert.match(receipt.privacyNotes.join('\n'), /High-risk mode is active/);
  assert.doesNotMatch(JSON.stringify(receipt), /high-risk-pos-code|WCH-POS-HIGH-RISK/);
});

test('POS acceptance rejects reused shipping label nullifier for recipient copy replay', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-pos-replay-001',
    jti: '0123456789ABCDEFGHJKMNPQ',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'replay-code',
    issuedAt: '2026-06-07T00:20:00.000Z',
  });
  const record = parseShippingLabelQrPayload(payload);
  assert.ok(record);
  const receipt = createPosAcceptanceReceipt({
    payload,
    channel: 'qr',
    scanRole: 'recipient',
    recipientProofCode: 'replay-code',
  }, {
    now: '2026-06-07T00:21:00.000Z',
    requestId: 'req-waybill-replay',
    usedShippingLabelNullifiers: [record.nullifier.value],
  });

  assert.equal(receipt.accepted, false);
  assert.equal(receipt.status, 'rejected');
  assert.ok(receipt.errors.includes('shipping-label-nullifier-already-used'));
});

test('POS acceptance rejects a shipping label recipient scan with the wrong proof code', () => {
  const payload = buildShippingLabelQrPayload({
    waybillId: 'wb-pos-003',
    addressPayload: privateAddressPayload(),
    recipientProofCode: 'right-secret',
  });
  const receipt = createPosAcceptanceReceipt({
    payload,
    channel: 'manual',
    scanRole: 'recipient',
    recipientProofCode: 'wrong-secret',
  }, {
    now: '2026-06-07T00:09:00.000Z',
    requestId: 'req-waybill-wrong',
  });

  assert.equal(receipt.accepted, false);
  assert.equal(receipt.status, 'rejected');
  assert.ok(receipt.errors.includes('recipient-proof-code-mismatch'));
});

test('POS acceptance verifies passkey, AOID credential, and NFC card recipient proof methods without storing secrets', () => {
  const cases = [
    ['passkey-webauthn', 'passkey-pos-assertion'],
    ['aoid-credential', 'aoid-pos-holder-secret'],
    ['nfc-card', 'nfc-pos-card-secret'],
  ] as const;

  for (const [method, secret] of cases) {
    const payload = buildShippingLabelQrPayload({
      waybillId: `wb-pos-${method}`,
      addressPayload: privateAddressPayload(),
      recipientProofMethod: method,
      recipientProofSecret: secret,
    });
    const receipt = createPosAcceptanceReceipt({
      payload,
      channel: method === 'nfc-card' ? 'nfc' : 'qr',
      scanRole: 'recipient',
      recipientProofMethod: method,
      recipientProofSecret: secret,
    }, {
      now: '2026-06-07T00:12:00.000Z',
      requestId: `req-waybill-${method}`,
    });

    assert.equal(receipt.accepted, true);
    assert.equal(receipt.shippingLabel?.proofMethod, method);
    assert.equal(receipt.shippingLabel?.recipientControlVerified, true);
    assert.ok(receipt.shippingLabel?.proofDomain?.includes(method));
    assert.ok(receipt.shippingLabel?.proofNonceTail);
    assert.doesNotMatch(JSON.stringify(receipt), new RegExp(secret));
  }
});

test('POS preview uses the same validation model as receipt creation', () => {
  const preview = previewPosAcceptanceInput({
    payload: privateAddressPayload(),
    channel: 'qr',
  });

  assert.equal(preview.accepted, true);
  assert.equal(preview.record?.recordType, 'ADDRESS');
  assert.equal(preview.status, 'review');
});
