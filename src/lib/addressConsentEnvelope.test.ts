import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_CONSENT_ENVELOPE_VERSION,
  createAddressConsentEnvelope,
  signAddressConsentEnvelope,
  stripPrivateAddressConsentEnvelopeMaterial,
  validateAddressConsentEnvelope,
  verifyAddressConsentEnvelope,
} from './addressConsentEnvelope';

const createdAt = '2026-06-17T00:00:00.000Z';

test('creates a signed delivery consent envelope without storing raw address material', async () => {
  const envelope = await createAddressConsentEnvelope({
    envelopeId: 'consent_delivery_001',
    purpose: 'delivery-delegation',
    mode: 'server-registry',
    createdAt,
    grantor: {
      role: 'grantor',
      partyId: 'recipient:alice',
      displayAlias: 'Recipient A',
      contactAlias: 'recipient-link-001',
      publicKeyRef: 'passkey:recipient:alice',
    },
    grantee: {
      role: 'carrier',
      partyId: 'carrier:agid-express',
      displayAlias: 'AGID Express',
    },
    subject: {
      kind: 'agid-s-envelope',
      subjectCommitment: 'sub_agids_delivery_001',
      agidSCommitment: 'agids_commitment_001',
      waybillCommitment: 'waybill_commitment_001',
      jti: 'jti_delivery_001',
    },
    scopes: ['delivery:read', 'recipient:verify'],
    permittedAttributes: ['delivery-eligible', 'recipient-control'],
    terms: {
      templateId: 'delivery-delegation-consent',
      templateVersion: 'v1',
      language: 'ja',
      summary: 'Carrier can use a short-lived AGID-S envelope for this handoff.',
    },
    signerSecrets: [{
      role: 'grantor',
      signerId: 'recipient:alice',
      signerSecret: 'grantor-secret',
      signedAt: createdAt,
    }],
  });

  assert.equal(envelope.version, ADDRESS_CONSENT_ENVELOPE_VERSION);
  assert.equal(envelope.status, 'active');
  assert.equal(envelope.privacy.rawAddressStored, false);
  assert.equal(envelope.privacy.rawAgidStored, false);
  assert.equal(envelope.privacy.rawAoidStored, false);
  assert.equal(envelope.terms.rawTermsStored, false);
  assert.ok(envelope.requiredControls.includes('signed-consent-required'));
  assert.ok(envelope.requiredControls.includes('domain-separated-nullifier'));
  assert.match(envelope.commitments.revocationHandle, /^revocation_[a-f0-9]{32}$/);
  assert.match(envelope.commitments.nullifier, /^nullifier_[a-f0-9]{32}$/);

  const publicEnvelope = stripPrivateAddressConsentEnvelopeMaterial(envelope);
  const publicJson = JSON.stringify(publicEnvelope);
  assert.equal('localCacheKey' in publicEnvelope, false);
  assert.doesNotMatch(publicJson, /recipient-link-001|grantor-secret/i);
  assert.equal(validateAddressConsentEnvelope(publicEnvelope).ok, true);

  const verification = await verifyAddressConsentEnvelope(publicEnvelope, {
    signerSecrets: [{
      role: 'grantor',
      signerId: 'recipient:alice',
      signerSecret: 'grantor-secret',
    }],
    expectedPurpose: 'delivery-delegation',
    requiredScopes: ['delivery:read', 'recipient:verify'],
    requiredAttributes: ['delivery-eligible'],
    expectedAudiencePartyId: 'carrier:agid-express',
    expectedSubjectCommitment: 'sub_agids_delivery_001',
    now: '2026-06-17T00:03:00.000Z',
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.active, true);
  assert.equal(verification.privacyPreserved, true);
});

test('keeps proxy pickup consent awaiting signature until the delegate signs', async () => {
  const awaitingDelegate = await createAddressConsentEnvelope({
    envelopeId: 'consent_proxy_001',
    purpose: 'proxy-pickup',
    createdAt,
    grantor: { partyId: 'recipient:holder' },
    grantee: { role: 'merchant', partyId: 'store:pickup-counter' },
    delegate: { role: 'delegate', partyId: 'delegate:family-member' },
    subject: {
      kind: 'waybill-alias',
      subjectCommitment: 'sub_waybill_proxy_001',
      waybillCommitment: 'waybill_proxy_commitment',
      jti: 'jti_proxy_001',
    },
    signerSecrets: [{
      role: 'grantor',
      signerId: 'recipient:holder',
      signerSecret: 'holder-secret',
      signedAt: createdAt,
    }],
  });

  assert.equal(awaitingDelegate.status, 'awaiting-signature');
  assert.deepEqual(awaitingDelegate.requiredSignerRoles, ['grantor', 'delegate']);

  const signed = await signAddressConsentEnvelope(awaitingDelegate, {
    role: 'delegate',
    signerId: 'delegate:family-member',
    signerSecret: 'delegate-secret',
    signedAt: '2026-06-17T00:02:00.000Z',
  });

  assert.equal(signed.status, 'active');
  assert.ok(signed.requiredControls.includes('delegate-signature-required'));

  const verification = await verifyAddressConsentEnvelope(signed, {
    signerSecrets: [
      { role: 'grantor', signerId: 'recipient:holder', signerSecret: 'holder-secret' },
      { role: 'delegate', signerId: 'delegate:family-member', signerSecret: 'delegate-secret' },
    ],
    requiredScopes: ['recipient:verify'],
    now: '2026-06-17T00:03:00.000Z',
  });
  assert.equal(verification.valid, true);
  assert.deepEqual(verification.missingSignerRoles, []);
});

test('uses high-risk aid receipt controls with short ttl and one-time nullifier', async () => {
  const envelope = await createAddressConsentEnvelope({
    envelopeId: 'consent_aid_001',
    purpose: 'aid-receipt',
    mode: 'zk-only',
    highRiskMode: true,
    ttlSeconds: 60 * 60,
    createdAt,
    grantor: { partyId: 'recipient:disaster-area-holder' },
    grantee: { role: 'ngo', partyId: 'ngo:field-team' },
    subject: {
      kind: 'address-credential',
      subjectCommitment: 'sub_aid_credential_001',
      credentialCommitment: 'credential_commitment_001',
      jti: 'jti_aid_001',
    },
    signerSecrets: [
      { role: 'grantor', signerId: 'recipient:disaster-area-holder', signerSecret: 'holder-secret', signedAt: createdAt },
      { role: 'ngo', signerId: 'ngo:field-team', signerSecret: 'ngo-secret', signedAt: createdAt },
    ],
  });

  assert.equal(envelope.status, 'active');
  assert.equal(envelope.oneTimeUse, true);
  assert.equal(envelope.timing.ttlSeconds, 600);
  assert.ok(envelope.warnings.includes('address-consent-high-risk-ttl-capped'));
  assert.ok(envelope.requiredControls.includes('high-risk-short-ttl'));
  assert.ok(envelope.requiredControls.includes('zk-compatible-public-statement'));
  assert.ok(envelope.requiredControls.includes('post-use-revocation-recommended'));

  const revoked = await verifyAddressConsentEnvelope(envelope, {
    signerSecrets: [
      { role: 'grantor', signerId: 'recipient:disaster-area-holder', signerSecret: 'holder-secret' },
      { role: 'ngo', signerId: 'ngo:field-team', signerSecret: 'ngo-secret' },
    ],
    usedNullifiers: [envelope.commitments.nullifier],
    now: '2026-06-17T00:03:00.000Z',
  });
  assert.equal(revoked.valid, false);
  assert.equal(revoked.revoked, true);
  assert.ok(revoked.errors.includes('address-consent-envelope-revoked-or-used'));
});

test('rejects envelopes that try to smuggle raw address, contact, or private terms', async () => {
  const envelope = await createAddressConsentEnvelope({
    envelopeId: 'consent_leaky_001',
    purpose: 'address-disclosure',
    createdAt,
    grantor: {
      partyId: 'recipient:leaky',
      email: 'alice@example.com',
    },
    grantee: { role: 'merchant', partyId: 'merchant:checkout' },
    subject: {
      kind: 'aoid-commitment',
      subjectCommitment: 'sub_leaky',
      rawAddress: '123 Market Street',
      aoid: 'AOID-SECRET-123456',
    },
    terms: {
      rawTermsText: 'Deliver to 123 Market Street',
    },
    metadata: {
      phone: '+1 415 555 0100',
    },
  });

  assert.equal(envelope.status, 'rejected');
  assert.ok(envelope.errors.includes('address-consent-envelope-contains-private-material'));
  assert.equal(validateAddressConsentEnvelope(envelope).ok, true);
  assert.doesNotMatch(JSON.stringify(stripPrivateAddressConsentEnvelopeMaterial(envelope)), /123 Market Street|415 555|alice@example.com/i);
});

test('detects tampered consent envelope signatures', async () => {
  const envelope = await createAddressConsentEnvelope({
    envelopeId: 'consent_tamper_001',
    purpose: 'delivery-delegation',
    createdAt,
    grantor: { partyId: 'recipient:holder' },
    grantee: { role: 'carrier', partyId: 'carrier:trusted' },
    subject: {
      kind: 'agid-s-envelope',
      subjectCommitment: 'sub_tamper',
      agidSCommitment: 'agids_tamper',
      jti: 'jti_tamper',
    },
    signerSecrets: [{
      role: 'grantor',
      signerId: 'recipient:holder',
      signerSecret: 'holder-secret',
      signedAt: createdAt,
    }],
  });

  const tampered = {
    ...envelope,
    scopes: [...envelope.scopes, 'audit:read' as const],
  };

  const verification = await verifyAddressConsentEnvelope(tampered, {
    signerSecrets: [{
      role: 'grantor',
      signerId: 'recipient:holder',
      signerSecret: 'holder-secret',
    }],
    now: '2026-06-17T00:03:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, false);
  assert.ok(verification.errors.includes('address-consent-envelope-payload-hash-mismatch'));
});
