import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ADDRESS_CREDENTIAL_VERSION,
  issueAddressCredential,
} from './addressCredential';
import {
  CREDENTIAL_ISSUER_TRUST_REGISTRY_VERSION,
  buildCredentialIssuerTrustRegistrySnapshot,
  evaluateCredentialIssuerTrust,
  verifyAddressCredentialWithIssuerTrust,
} from './credentialIssuerTrustRegistry';

const issuerId = 'agid-jp-postal-issuer';
const issuerSecret = 'test-only-trust-registry-issuer-secret';

function buildTrustedIssuerRegistry() {
  return buildCredentialIssuerTrustRegistrySnapshot({
    registryId: 'agid-credential-issuer-trust',
    registryVersion: '2026.01',
    trustPolicy: {
      allowedStatuses: ['trusted'],
      minimumTrustScore: 0.85,
      requireValidWindow: true,
      requireCredentialScopeMatch: true,
    },
    issuers: [
      {
        issuerId,
        issuerDid: 'did:kilt:agid-japan-post',
        status: 'trusted',
        trustLevel: 'official',
        credentialTypes: [ADDRESS_CREDENTIAL_VERSION],
        claimKinds: ['address-reference', 'residence', 'legal-ownership'],
        layers: ['AOID'],
        countryCodes: ['jp'],
        schemaHashes: ['schema-address-credential-v1'],
        policyVersions: ['jp-postal-policy-v1'],
        keyCommitments: ['issuer-key-commitment-public-only'],
        publicAttestationRefs: ['japan-post-official-postcode-source'],
        trustScore: 0.97,
        validFrom: '2025-01-01T00:00:00.000Z',
        validUntil: '2027-01-01T00:00:00.000Z',
        sourceIds: ['japan-post-open-data', 'agid-official-source-review'],
      },
      {
        issuerId: 'agid-suspended-community-issuer',
        issuerDid: 'did:kilt:agid-suspended-community',
        status: 'suspended',
        trustLevel: 'community',
        credentialTypes: [ADDRESS_CREDENTIAL_VERSION],
        claimKinds: ['address-reference'],
        trustScore: 0.4,
        sourceIds: ['manual-suspension-feed'],
      },
    ],
    now: '2026-01-01T00:00:00.000Z',
  });
}

async function issueTrustedJpAoidCredential() {
  return issueAddressCredential({
    issuerId,
    issuerSecret,
    layer: 'AOID',
    address: {
      country_code: 'JP',
      country: 'Japan',
      state: 'Tokyo',
      city: 'Chiyoda-ku',
      road: 'Marunouchi',
      postcode: '100-0001',
    },
    countryCode: 'JP',
    postalCode: '100-0001',
    verificationStatus: 'verified',
    verificationScore: 0.94,
    policyVersion: 'jp-postal-policy-v1',
    sourceIds: ['japan-post-open-data'],
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateSalt: 'credential-private-salt-for-issuer-trust',
  });
}

async function issueTrustedJpResidenceCredential() {
  return issueAddressCredential({
    issuerId,
    issuerSecret,
    layer: 'AOID',
    claimKind: 'residence',
    assuranceLevel: 'issuer-attested',
    evidenceCommitmentRefs: ['sha256-municipal-residence-attestation-001'],
    address: {
      country_code: 'JP',
      country: 'Japan',
      state: 'Tokyo',
      city: 'Chiyoda-ku',
      road: 'Marunouchi',
      postcode: '100-0001',
    },
    countryCode: 'JP',
    postalCode: '100-0001',
    verificationStatus: 'verified',
    verificationScore: 0.94,
    policyVersion: 'jp-postal-policy-v1',
    sourceIds: ['japan-post-open-data', 'municipal-residence-attestation'],
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateSalt: 'credential-private-salt-for-residence-issuer-trust',
  });
}

test('builds a privacy-safe credential issuer trust registry root and chain anchor', () => {
  const snapshot = buildTrustedIssuerRegistry();
  const publicText = JSON.stringify(snapshot);

  assert.equal(snapshot.modelVersion, CREDENTIAL_ISSUER_TRUST_REGISTRY_VERSION);
  assert.match(snapshot.registryRoot, /^[a-f0-9]{64}$/u);
  assert.equal(snapshot.issuerCounts.trusted, 1);
  assert.equal(snapshot.issuerCounts.suspended, 1);
  assert.equal(snapshot.issuerRecords[0].countryCodes[0], 'JP');
  assert.equal(snapshot.chainCommitment.stageId, 'credential-marketplace');
  assert.equal(snapshot.chainCommitment.entityType, 'credential-issuer');
  assert.equal(snapshot.chainCommitment.publicPayload.trustRegistryRoot, snapshot.registryRoot);
  assert.equal(snapshot.chainCommitment.publicPayload.trustPolicyHash, snapshot.trustPolicyHash);
  assert.equal(snapshot.anchorable, true);
  assert.doesNotMatch(publicText, /test-only|credential-private-salt|raw address|phone|email/iu);
});

test('accepts a credential issued by a trusted issuer within the registered scope', async () => {
  const credential = await issueTrustedJpAoidCredential();
  const snapshot = buildTrustedIssuerRegistry();

  const trust = evaluateCredentialIssuerTrust(credential, snapshot, {
    now: '2026-01-01T00:10:00.000Z',
    credentialType: ADDRESS_CREDENTIAL_VERSION,
    requiredLayer: 'AOID',
    requiredCountryCode: 'JP',
    requiredSchemaHash: 'schema-address-credential-v1',
    minimumTrustScore: 0.9,
    trustedRegistryRoots: [snapshot.registryRoot],
  });

  assert.equal(trust.trusted, true);
  assert.equal(trust.issuer?.issuerDid, 'did:kilt:agid-japan-post');
  assert.equal(trust.registryRootTrusted, true);
  assert.deepEqual(trust.errors, []);
});

test('rejects suspended, expired, or out-of-scope issuer trust before accepting a credential', async () => {
  const credential = await issueTrustedJpAoidCredential();
  const snapshot = buildTrustedIssuerRegistry();

  const countryMismatch = evaluateCredentialIssuerTrust(credential, snapshot, {
    now: '2026-01-01T00:10:00.000Z',
    requiredLayer: 'AOID',
    requiredCountryCode: 'US',
  });
  assert.equal(countryMismatch.trusted, false);
  assert.ok(countryMismatch.errors.includes('issuer-country-not-allowed'));

  const expired = evaluateCredentialIssuerTrust(credential, snapshot, {
    now: '2028-01-01T00:00:00.000Z',
    requiredLayer: 'AOID',
    requiredCountryCode: 'JP',
  });
  assert.equal(expired.trusted, false);
  assert.ok(expired.errors.includes('issuer-trust-expired'));

  const suspendedCredential = {
    ...credential,
    signature: {
      ...credential.signature,
      issuerId: 'agid-suspended-community-issuer',
    },
  };
  const suspended = evaluateCredentialIssuerTrust(suspendedCredential, snapshot, {
    now: '2026-01-01T00:10:00.000Z',
  });
  assert.equal(suspended.trusted, false);
  assert.ok(suspended.errors.includes('issuer-not-trusted'));
});

test('combines credential signature verification with issuer trust registry checks', async () => {
  const credential = await issueTrustedJpAoidCredential();
  const snapshot = buildTrustedIssuerRegistry();

  const verified = await verifyAddressCredentialWithIssuerTrust(credential, snapshot, {
    issuerSecretsById: {
      [issuerId]: issuerSecret,
    },
    now: '2026-01-01T00:10:00.000Z',
    expectedLayer: 'AOID',
    minimumCredentialScore: 0.9,
    allowedCredentialStatuses: ['verified'],
    requiredCountryCode: 'JP',
    requiredSchemaHash: 'schema-address-credential-v1',
    minimumTrustScore: 0.9,
    trustedRegistryRoots: [snapshot.registryRoot],
  });

  assert.equal(verified.valid, true);
  assert.equal(verified.credential.signatureValid, true);
  assert.equal(verified.trust.trusted, true);
  assert.deepEqual(verified.errors, []);
});

test('treats legal ownership and residence as scoped AOID credential claims', async () => {
  const credential = await issueTrustedJpResidenceCredential();
  const snapshot = buildTrustedIssuerRegistry();

  const verified = await verifyAddressCredentialWithIssuerTrust(credential, snapshot, {
    issuerSecretsById: {
      [issuerId]: issuerSecret,
    },
    now: '2026-01-01T00:10:00.000Z',
    expectedLayer: 'AOID',
    requiredClaimKind: 'residence',
    minimumAssuranceLevel: 'issuer-attested',
    minimumCredentialScore: 0.9,
    allowedCredentialStatuses: ['verified'],
    requiredCountryCode: 'JP',
    requiredSchemaHash: 'schema-address-credential-v1',
    minimumTrustScore: 0.9,
    trustedRegistryRoots: [snapshot.registryRoot],
  });

  assert.equal(verified.valid, true);
  assert.equal(verified.credential.signatureValid, true);
  assert.equal(verified.trust.trusted, true);
  assert.equal(verified.trust.issuer?.claimKinds.includes('residence'), true);

  const outOfScope = await verifyAddressCredentialWithIssuerTrust(credential, snapshot, {
    issuerSecretsById: {
      [issuerId]: issuerSecret,
    },
    now: '2026-01-01T00:10:00.000Z',
    expectedLayer: 'AOID',
    requiredClaimKind: 'delivery-eligibility',
    minimumAssuranceLevel: 'issuer-attested',
    requiredCountryCode: 'JP',
  });

  assert.equal(outOfScope.valid, false);
  assert.ok(outOfScope.errors.includes('claim-kind-mismatch'));
  assert.ok(outOfScope.errors.includes('issuer-claim-kind-not-allowed'));
});
