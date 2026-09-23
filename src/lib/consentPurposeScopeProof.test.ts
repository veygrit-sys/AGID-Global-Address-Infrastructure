import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createConsentPurposeScopeProof,
  deriveConsentPurposeScopeRevocationHandles,
  stripPrivateConsentPurposeScopeProofMaterial,
  verifyConsentPurposeScopeProof,
  type ConsentPurposeScopeGrant,
  type ConsentPurposeScopeRevocationRegistrySnapshot,
} from './consentPurposeScopeProof';

const proofIssuerId = 'agid-consent-proof-test';
const proofIssuerSecret = 'test-only-consent-proof-issuer-secret';
const scope = 'delivery-checkout';
const challenge = 'consent-purpose-scope-nonce-001';

const grant: ConsentPurposeScopeGrant = {
  id: 'consent-grant-secret-001',
  issuerId: 'agid-consent-registry-test',
  subjectKind: 'AOID',
  subjectRef: 'aoid:private-owner-address-001',
  consentedAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T02:00:00.000Z',
  policyVersion: 'owner-consent-policy-v1',
  sourceIds: ['owner-device-consent-receipt'],
  privateSalt: 'private-consent-grant-salt',
  allowedPurposeScopes: [{
    purpose: 'delivery',
    dataScopes: ['aoid-reference', 'address-credential', 'address-quality'],
    expiresAt: '2026-01-01T01:30:00.000Z',
    maxProofTtlSeconds: 600,
  }],
};

const registry: ConsentPurposeScopeRevocationRegistrySnapshot = {
  id: 'consent-revocation-list',
  version: '2026-01-01T00:05:00Z',
  checkedAt: '2026-01-01T00:05:00.000Z',
  sourceIds: ['agid-consent-status-list'],
};

test('proves consent for a purpose and data scopes without exposing the consent body', async () => {
  const envelope = await createConsentPurposeScopeProof({
    issuerId: proofIssuerId,
    issuerSecret: proofIssuerSecret,
    grant,
    revocationRegistry: registry,
    requestedPurpose: 'delivery',
    requestedDataScopes: ['address-credential', 'aoid-reference'],
    scope,
    challenge,
    issuedAt: '2026-01-01T00:05:00.000Z',
    freshnessSeconds: 600,
    ttlSeconds: 600,
    privateProofSalt: 'consent-private-proof-salt',
  });

  const publicEnvelope = stripPrivateConsentPurposeScopeProofMaterial(envelope);
  const publicText = JSON.stringify(publicEnvelope);

  assert.equal(envelope.claim.authorization.status, 'authorized');
  assert.equal(envelope.claim.authorization.purpose, 'DELIVERY');
  assert.deepEqual(envelope.claim.authorization.dataScopes, ['ADDRESS-CREDENTIAL', 'AOID-REFERENCE']);
  assert.equal(envelope.claim.subject.kind, 'AOID');
  assert.equal(envelope.claim.revocation.status, 'not-revoked');
  assert.equal(envelope.claim.revocation.registryId, 'CONSENT-REVOCATION-LIST');
  assert.equal(envelope.claim.proofHint.zkReady, true);
  assert.equal(envelope.claim.proofHint.zkpGenerated, false);
  assert.equal(envelope.localCacheKey?.startsWith('consent-purpose-scope:'), true);
  assert.equal('privateProofSalt' in publicEnvelope, false);
  assert.equal('localCacheKey' in publicEnvelope, false);
  assert.equal(publicText.includes('consent-grant-secret-001'), false);
  assert.equal(publicText.includes('aoid:private-owner-address-001'), false);
  assert.equal(publicText.includes('private-consent-grant-salt'), false);
  assert.equal(publicText.includes('consent-private-proof-salt'), false);

  const verification = await verifyConsentPurposeScopeProof(publicEnvelope, {
    issuerId: proofIssuerId,
    issuerSecret: proofIssuerSecret,
    expectedScope: scope,
    expectedChallenge: challenge,
    expectedSubjectKind: 'AOID',
    expectedConsentIssuerId: 'agid-consent-registry-test',
    expectedPurpose: 'delivery',
    requiredDataScopes: ['aoid-reference', 'address-credential'],
    trustedRegistryIds: ['CONSENT-REVOCATION-LIST'],
    now: '2026-01-01T00:06:00.000Z',
    maxFreshnessAgeSeconds: 600,
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.expired, false);
  assert.equal(verification.stale, false);
  assert.equal(verification.authorizedAsserted, true);
  assert.equal(verification.notRevokedAsserted, true);
  assert.equal(verification.privacyPreserved, true);
  assert.equal(verification.proofCost, 'none');
});

test('rejects purpose scope escalation during proof creation', async () => {
  await assert.rejects(
    createConsentPurposeScopeProof({
      issuerId: proofIssuerId,
      issuerSecret: proofIssuerSecret,
      grant,
      revocationRegistry: registry,
      requestedPurpose: 'delivery',
      requestedDataScopes: ['aoid-reference', 'recipient-contact'],
      scope,
      challenge,
      issuedAt: '2026-01-01T00:05:00.000Z',
      privateProofSalt: 'consent-private-proof-salt',
    }),
    /not covered by the consent grant/i
  );
});

test('rejects proof creation when the consent grant appears in a revocation snapshot', async () => {
  const handles = await deriveConsentPurposeScopeRevocationHandles(grant);

  await assert.rejects(
    createConsentPurposeScopeProof({
      issuerId: proofIssuerId,
      issuerSecret: proofIssuerSecret,
      grant,
      revocationRegistry: {
        ...registry,
        revokedGrantHashes: [handles.grantHash],
      },
      requestedPurpose: 'delivery',
      requestedDataScopes: ['aoid-reference'],
      scope,
      challenge,
      issuedAt: '2026-01-01T00:05:00.000Z',
      privateProofSalt: 'consent-private-proof-salt',
    }),
    /revoked consent grant/i
  );
});

test('rejects stale consent revocation freshness windows during verification', async () => {
  const envelope = await createConsentPurposeScopeProof({
    issuerId: proofIssuerId,
    issuerSecret: proofIssuerSecret,
    grant,
    revocationRegistry: registry,
    requestedPurpose: 'delivery',
    requestedDataScopes: ['aoid-reference'],
    scope,
    challenge,
    issuedAt: '2026-01-01T00:05:00.000Z',
    freshnessSeconds: 60,
    privateProofSalt: 'consent-private-proof-salt',
  });

  const verification = await verifyConsentPurposeScopeProof(
    stripPrivateConsentPurposeScopeProofMaterial(envelope),
    {
      issuerSecret: proofIssuerSecret,
      expectedScope: scope,
      expectedChallenge: challenge,
      now: '2026-01-01T00:07:00.000Z',
      maxFreshnessAgeSeconds: 60,
    }
  );

  assert.equal(verification.valid, false);
  assert.equal(verification.expired, true);
  assert.equal(verification.stale, true);
  assert.ok(verification.errors.includes('freshness-window-expired'));
  assert.ok(verification.errors.includes('freshness-check-too-old'));
});

test('rejects tampered consent purpose scope signatures', async () => {
  const envelope = await createConsentPurposeScopeProof({
    issuerId: proofIssuerId,
    issuerSecret: proofIssuerSecret,
    grant,
    revocationRegistry: registry,
    requestedPurpose: 'delivery',
    requestedDataScopes: ['aoid-reference'],
    scope,
    challenge,
    issuedAt: '2026-01-01T00:05:00.000Z',
    freshnessSeconds: 600,
    privateProofSalt: 'consent-private-proof-salt',
  });

  const publicEnvelope = stripPrivateConsentPurposeScopeProofMaterial(envelope);
  const tampered = {
    ...publicEnvelope,
    claim: {
      ...publicEnvelope.claim,
      authorization: {
        ...publicEnvelope.claim.authorization,
        purpose: 'CLOUD-SYNC',
      },
    },
  };

  const verification = await verifyConsentPurposeScopeProof(tampered, {
    issuerSecret: proofIssuerSecret,
    expectedChallenge: challenge,
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, false);
  assert.ok(verification.errors.includes('signature-invalid'));
});

test('returns invalid instead of throwing for malformed consent purpose scope proof envelopes', async () => {
  const verification = await verifyConsentPurposeScopeProof({} as never, {
    issuerSecret: proofIssuerSecret,
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, null);
  assert.equal(verification.stale, true);
  assert.ok(verification.errors.includes('malformed-consent-purpose-scope-proof'));
});

test('rejects unstripped local consent purpose scope proof material as a public proof', async () => {
  const envelope = await createConsentPurposeScopeProof({
    issuerId: proofIssuerId,
    issuerSecret: proofIssuerSecret,
    grant,
    revocationRegistry: registry,
    requestedPurpose: 'delivery',
    requestedDataScopes: ['aoid-reference'],
    scope,
    challenge,
    issuedAt: '2026-01-01T00:05:00.000Z',
    freshnessSeconds: 600,
    privateProofSalt: 'consent-private-proof-salt',
  });

  const verification = await verifyConsentPurposeScopeProof(envelope, {
    issuerSecret: proofIssuerSecret,
    expectedScope: scope,
    expectedChallenge: challenge,
    now: '2026-01-01T00:06:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.privacyPreserved, false);
  assert.ok(verification.errors.includes('privacy-fields-not-hidden'));
});
