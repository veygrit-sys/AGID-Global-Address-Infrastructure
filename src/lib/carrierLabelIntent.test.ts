import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildCarrierLabelIntent,
  createInMemoryCarrierLabelIntentStore,
  validateCarrierLabelIntent,
} from './carrierLabelIntent';
import { buildShippingLabelQrRecord } from './shippingLabelQr';

const createdAt = '2026-06-17T00:00:00.000Z';

test('starts a label intent at address verification', () => {
  const intent = buildCarrierLabelIntent({ createdAt, updatedAt: createdAt });

  assert.equal(intent.status, 'requires_address_verification');
  assert.equal(intent.nextAction, 'verify_address');
  assert.equal(intent.proofLevel, 'none');
  assert.equal(intent.privacy.rawAddressStored, false);
  assert.deepEqual(intent.stages.filter(stage => stage.required).map(stage => stage.key), [
    'address',
    'agid-aoid',
    'carrier',
    'label-qr',
    'carrier-scan',
    'receipt',
  ]);
});

test('moves from address and AGID/AOID checks to carrier acceptance', () => {
  const intent = buildCarrierLabelIntent({
    mode: 'server-registry',
    carrier: {
      carrierId: 'carrier-demo',
      adapter: 'easypost-compatible',
      serviceLevel: 'ground',
    },
    evidence: [
      { type: 'address-verification', status: 'passed', safeFingerprint: 'addr-cmt-1' },
      { type: 'agid-aoid-check', status: 'passed', safeFingerprint: 'agid-aoid-cmt-1' },
    ],
    createdAt,
    updatedAt: createdAt,
  });

  assert.equal(intent.status, 'requires_carrier_acceptance');
  assert.equal(intent.nextAction, 'request_carrier_acceptance');
  assert.equal(intent.proofLevel, 'address-valid');
  assert.equal(validateCarrierLabelIntent(intent).ok, true);
});

test('asks for label QR after carrier acceptance', () => {
  const intent = buildCarrierLabelIntent({
    carrier: {
      carrierId: 'carrier-demo',
      adapter: 'easypost-compatible',
      externalShipmentRef: 'shp_demo_1',
      carrierReceiptRef: 'carrier-receipt:accepted:1',
      acceptanceStatus: 'accepted',
    },
    evidence: [
      { type: 'address-verification', status: 'passed', safeFingerprint: 'addr-cmt-1' },
      { type: 'agid-aoid-check', status: 'passed', safeFingerprint: 'agid-aoid-cmt-1' },
      { type: 'carrier-acceptance', status: 'passed', receiptRef: 'carrier-receipt:accepted:1', signed: true },
    ],
    createdAt,
    updatedAt: createdAt,
  });

  assert.equal(intent.status, 'requires_label_qr');
  assert.equal(intent.nextAction, 'issue_label_qr');
  assert.equal(intent.proofLevel, 'carrier-accepted');
});

test('integrates shipping-label QR records and waits for carrier scan', () => {
  const qrRecord = buildShippingLabelQrRecord({
    waybillId: 'private-waybill-123',
    carrierId: 'carrier-demo',
    issuedAt: createdAt,
    address: {
      kind: 'agid',
      agid: 'ML01R1A0ZTR4',
      country: 'JP',
      city: 'Tokyo',
      postcode: '1000005',
    },
    recipientProofSecret: 'recipient-secret',
    recipientProofNonce: 'RECIPIENTNONCE001',
  });
  const intent = buildCarrierLabelIntent({
    carrier: {
      carrierId: 'carrier-demo',
      acceptanceStatus: 'accepted',
      carrierReceiptRef: 'carrier-receipt:accepted:2',
    },
    shippingLabelQrRecord: qrRecord,
    evidence: [
      { type: 'address-verification', status: 'passed', safeFingerprint: 'addr-cmt-1' },
      { type: 'agid-aoid-check', status: 'passed', safeFingerprint: 'agid-aoid-cmt-1' },
      { type: 'carrier-acceptance', status: 'passed', receiptRef: 'carrier-receipt:accepted:2', signed: true },
      { type: 'label-qr-issued', status: 'passed', safeFingerprint: 'label-cmt-1' },
    ],
    createdAt,
    updatedAt: createdAt,
  });

  assert.equal(intent.status, 'label_qr_ready');
  assert.equal(intent.nextAction, 'scan_label_qr');
  assert.equal(intent.label.waybillAlias, qrRecord.waybillId);
  assert.equal(intent.label.rawQrPayloadStored, false);
  assert.equal(intent.label.rawLabelPayloadStored, false);
  assert.match(intent.label.labelQrCommitment ?? '', /^labelqr_[a-f0-9]{32}$/);
  assert.equal(validateCarrierLabelIntent(intent).ok, true);
});

test('completes after signed carrier scan, recipient proof, and terminal receipt', () => {
  const intent = buildCarrierLabelIntent({
    carrier: {
      carrierId: 'carrier-demo',
      acceptanceStatus: 'accepted',
      carrierReceiptRef: 'carrier-receipt:accepted:3',
    },
    label: {
      waybillAlias: 'WBA-123456789ABC',
      waybillCommitment: 'waybill-cmt-1',
      labelQrCommitment: 'labelqr_1234567890abcdef1234567890abcdef',
    },
    evidence: [
      { type: 'address-verification', status: 'passed', safeFingerprint: 'addr-cmt-1' },
      { type: 'agid-aoid-check', status: 'passed', safeFingerprint: 'agid-aoid-cmt-1' },
      { type: 'carrier-acceptance', status: 'passed', receiptRef: 'carrier-receipt:accepted:3', signed: true },
      { type: 'label-qr-issued', status: 'passed', safeFingerprint: 'label-cmt-1' },
      { type: 'carrier-scan', status: 'passed', receiptRef: 'carrier-scan-receipt:1', signed: true },
      { type: 'recipient-proof', status: 'passed', safeFingerprint: 'recipient-proof-cmt-1' },
      { type: 'terminal-receipt', status: 'passed', receiptRef: 'terminal-receipt:1', signed: true },
    ],
    recipientProofRequired: true,
    createdAt,
    updatedAt: createdAt,
  });

  assert.equal(intent.status, 'completed');
  assert.equal(intent.nextAction, 'none');
  assert.equal(intent.proofLevel, 'delivery-completed');
  assert.equal(validateCarrierLabelIntent(intent).ok, true);
});

test('rejects private evidence and high-risk plaintext carrier use', () => {
  const privateEvidence = buildCarrierLabelIntent({
    evidence: [
      {
        type: 'address-verification',
        status: 'passed',
        rawAddress: '1 Private Street',
        proofCode: 'secret-code',
      },
    ],
    createdAt,
    updatedAt: createdAt,
  });

  assert.equal(privateEvidence.status, 'rejected');
  assert.ok(privateEvidence.errors.includes('carrier-label-intent-private-evidence-rejected'));
  assert.doesNotMatch(JSON.stringify(privateEvidence), /1 Private Street|secret-code/);

  const highRiskPlaintext = buildCarrierLabelIntent({
    highRiskMode: true,
    carrier: {
      carrierId: 'carrier-plain',
      plaintextShipmentRequired: true,
    },
    createdAt,
    updatedAt: createdAt,
  });

  assert.equal(highRiskPlaintext.status, 'rejected');
  assert.ok(highRiskPlaintext.errors.includes('carrier-label-intent-high-risk-plaintext-carrier-blocked'));
  assert.equal(validateCarrierLabelIntent(highRiskPlaintext).ok, false);
});

test('carrier acceptance policy rejects address defects, undeliverable regions, and PO Box labels', () => {
  const defect = buildCarrierLabelIntent({
    carrierPolicy: {
      rejectAddressDefect: true,
      rejectUndeliverableRegion: true,
      rejectPoBox: true,
      policyRef: 'carrier-policy:v1',
    },
    addressRisk: {
      reasonCodes: ['address-defect', 'undeliverable-region', 'po-box'],
      aoidAccessProfileConfirmed: true,
    },
    evidence: [
      { type: 'address-verification', status: 'passed', safeFingerprint: 'addr-cmt-1' },
      { type: 'carrier-policy-check', status: 'failed', code: 'policy_refused', receiptRef: 'policy:1' },
    ],
    createdAt,
    updatedAt: createdAt,
  });

  assert.equal(defect.status, 'rejected');
  assert.equal(defect.carrierPolicy.rejectAddressDefect, true);
  assert.equal(defect.carrierPolicy.rejectUndeliverableRegion, true);
  assert.equal(defect.carrierPolicy.rejectPoBox, true);
  assert.equal(defect.addressRisk.addressDefect, true);
  assert.equal(defect.addressRisk.undeliverableRegion, true);
  assert.equal(defect.addressRisk.poBox, true);
  assert.ok(defect.errors.includes('carrier-label-intent-address-defect-rejected'));
  assert.ok(defect.errors.includes('carrier-label-intent-undeliverable-region-rejected'));
  assert.ok(defect.errors.includes('carrier-label-intent-po-box-rejected'));
});

test('carrier policy and address risk participate in intent identity', () => {
  const base = {
    evidence: [
      { type: 'address-verification', status: 'passed', safeFingerprint: 'addr-cmt-1' },
    ],
    createdAt,
    updatedAt: createdAt,
  };
  const standard = buildCarrierLabelIntent(base);
  const poBoxRisk = buildCarrierLabelIntent({
    ...base,
    addressRisk: { poBox: true, aoidAccessProfileConfirmed: true },
    carrierPolicy: { rejectPoBox: true },
  });

  assert.notEqual(standard.id, poBoxRisk.id);
  assert.equal(poBoxRisk.addressRisk.poBox, true);
  assert.equal(poBoxRisk.carrierPolicy.rejectPoBox, true);
});

test('requires AOID access profile confirmation for PO Box or auto-lock label acceptance', () => {
  const missingProfile = buildCarrierLabelIntent({
    carrierPolicy: {
      requireAoidAccessProfileForPoBoxOrAutoLock: true,
    },
    addressRisk: {
      poBox: true,
      autoLock: true,
      aoidAccessProfileConfirmed: false,
    },
    createdAt,
    updatedAt: createdAt,
  });

  assert.equal(missingProfile.status, 'rejected');
  assert.ok(missingProfile.errors.includes('carrier-label-intent-aoid-access-profile-required-for-po-box-or-auto-lock'));

  const confirmedProfile = buildCarrierLabelIntent({
    carrierPolicy: {
      requireAoidAccessProfileForPoBoxOrAutoLock: true,
    },
    addressRisk: {
      poBox: true,
      aoidAccessProfileConfirmed: true,
    },
    evidence: [
      { type: 'address-verification', status: 'passed', safeFingerprint: 'addr-cmt-1' },
      { type: 'agid-aoid-check', status: 'passed', safeFingerprint: 'agid-aoid-cmt-1' },
    ],
    createdAt,
    updatedAt: createdAt,
  });

  assert.equal(confirmedProfile.status, 'requires_carrier_acceptance');
  assert.equal(confirmedProfile.addressRisk.aoidAccessProfileConfirmed, true);
  assert.equal(validateCarrierLabelIntent(confirmedProfile).ok, true);
});

test('in-memory store appends carrier evidence without changing the intent id', () => {
  const store = createInMemoryCarrierLabelIntentStore();
  const created = store.create({
    evidence: [
      { type: 'address-verification', status: 'passed', safeFingerprint: 'addr-cmt-1' },
      { type: 'agid-aoid-check', status: 'passed', safeFingerprint: 'agid-aoid-cmt-1' },
    ],
    createdAt,
    updatedAt: createdAt,
  });
  const updated = store.update(created.id, {
    appendEvidence: true,
    evidence: [
      { type: 'carrier-acceptance', status: 'passed', receiptRef: 'carrier-receipt:1', signed: true },
    ],
    carrier: {
      carrierId: 'carrier-demo',
      acceptanceStatus: 'accepted',
      carrierReceiptRef: 'carrier-receipt:1',
    },
    updatedAt: '2026-06-17T00:01:00.000Z',
  });

  assert.ok(updated);
  assert.equal(updated.id, created.id);
  assert.equal(updated.status, 'requires_label_qr');
  assert.equal(store.get(created.id)?.status, 'requires_label_qr');
});
