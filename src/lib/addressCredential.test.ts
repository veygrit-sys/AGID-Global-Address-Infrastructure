import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildAddressCredentialFromVerification,
  createAddressCredentialCacheKey,
  issueAddressCredential,
  shouldRefreshAddressCredential,
  stripPrivateAddressCredentialMaterial,
  verifyAddressCredential,
} from './addressCredential';
import { verifyAddressCandidate } from './addressVerificationEngine';

const issuerSecret = 'test-only-issuer-secret';

const jpFormat = {
  countryCode: 'JP',
  name: 'Japan',
  native: {
    addressFormat: '〒{{postcode}}\n{{state}}{{city}}{{street}}{{houseNumber}}',
    fields: [
      { key: 'postcode', required: true },
      { key: 'state', required: true },
      { key: 'city', required: true },
    ],
  },
  postalCode: {
    regex: '^\\d{3}-?\\d{4}$',
    source: 'agid-country-postal-format-policy',
  },
  addressRules: {
    postalCode: { required: true, usage: 'required' as const },
    openSourceIds: ['agid-address-verification-engine'],
  },
};

test('issues a lightweight signed address credential from a verified result', async () => {
  const verification = verifyAddressCandidate({
    targetCountries: ['JP'],
    countryCode: 'JP',
    postalCode: '100-0001',
    scope: 'address',
    format: jpFormat,
    address: {
      country: 'Japan',
      state: 'Tokyo',
      city: 'Chiyoda-ku',
      road: 'Marunouchi',
      postcode: '100-0001',
    },
    postalEvidence: [{
      source: 'zipcloud',
      countryCode: 'JP',
      postalCode: '1000001',
      state: 'Tokyo',
      city: 'Chiyoda-ku',
      confidence: 0.93,
    }],
  });

  const credential = await buildAddressCredentialFromVerification({
    issuerId: 'agid-local-test',
    issuerSecret,
    verification,
    subjectId: 'pid:test:tokyo',
    issuedAt: '2026-01-01T00:00:00.000Z',
  });

  assert.equal(credential.claim.qualityBand, 'verified-high');
  assert.equal(credential.claim.verificationStatus, 'verified');
  assert.equal(credential.claim.proofHint.zkpGenerated, false);
  assert.equal(credential.claim.proofHint.zkReady, true);
  assert.equal(credential.claim.countryCode, 'JP');
  assert.equal(credential.claim.postalCodeHash?.length > 20, true);
  assert.equal(JSON.stringify(credential).includes('Marunouchi'), false);
  assert.equal(typeof credential.privateSalt, 'string');
  assert.equal(credential.localCacheKey?.startsWith('address-credential:'), true);

  const verified = await verifyAddressCredential(credential, {
    issuerId: 'agid-local-test',
    issuerSecret,
    expectedLayer: 'AGID',
    minimumScore: 0.9,
    allowedStatuses: ['verified'],
    address: {
      country_code: 'JP',
      country: 'Japan',
      state: 'Tokyo',
      city: 'Chiyoda-ku',
      road: 'Marunouchi',
      postcode: '100-0001',
    },
    now: '2026-01-01T00:01:00.000Z',
  });

  assert.equal(verified.valid, true);
  assert.equal(verified.signatureValid, true);
  assert.equal(verified.addressMatches, true);
  assert.equal(verified.proofCost, 'none');
});

test('rejects a tampered address credential signature', async () => {
  const credential = await issueAddressCredential({
    issuerId: 'agid-local-test',
    issuerSecret,
    address: {
      country_code: 'US',
      country: 'United States',
      city: 'New York',
      postcode: '10001',
      road: 'West 31st Street',
      house_number: '1',
    },
    countryCode: 'US',
    postalCode: '10001',
    verificationStatus: 'verified',
    verificationScore: 0.92,
    sourceIds: ['usps-city-state-lookup'],
    issuedAt: '2026-01-01T00:00:00.000Z',
  });

  const tampered = {
    ...credential,
    claim: {
      ...credential.claim,
      verificationScore: 0.99,
    },
  };

  const verified = await verifyAddressCredential(tampered, {
    issuerSecret,
    now: '2026-01-01T00:01:00.000Z',
  });

  assert.equal(verified.valid, false);
  assert.equal(verified.signatureValid, false);
  assert.ok(verified.errors.includes('signature-invalid'));
});

test('can strip private salt before sharing while preserving signature verification', async () => {
  const credential = await issueAddressCredential({
    issuerId: 'agid-local-test',
    issuerSecret,
    address: {
      country_code: 'FR',
      country: 'France',
      city: 'Paris',
      road: 'Rue de Rivoli',
      house_number: '99',
      postcode: '75001',
    },
    countryCode: 'FR',
    postalCode: '75001',
    verificationStatus: 'verified',
    verificationScore: 0.88,
    sourceIds: ['api-adresse-data-gouv-fr'],
    issuedAt: '2026-01-01T00:00:00.000Z',
  });

  const publicCredential = stripPrivateAddressCredentialMaterial(credential);
  assert.equal('privateSalt' in publicCredential, false);
  assert.equal('localCacheKey' in publicCredential, false);

  const signatureOnly = await verifyAddressCredential(publicCredential, {
    issuerSecret,
    now: '2026-01-01T00:01:00.000Z',
  });
  assert.equal(signatureOnly.valid, true);
  assert.equal(signatureOnly.signatureValid, true);

  const localAddressCheck = await verifyAddressCredential(credential, {
    issuerSecret,
    address: {
      country_code: 'FR',
      country: 'France',
      city: 'Paris',
      road: 'Rue de Rivoli',
      house_number: '99',
      postcode: '75001',
    },
    now: '2026-01-01T00:01:00.000Z',
  });
  assert.equal(localAddressCheck.addressMatches, true);
});

test('keeps partial results lightweight and below verified quality bands', async () => {
  const credential = await issueAddressCredential({
    issuerId: 'agid-local-test',
    issuerSecret,
    address: {
      country_code: 'JP',
      city: 'Tokyo',
      postcode: '100-0001',
    },
    countryCode: 'JP',
    postalCode: '100-0001',
    verificationStatus: 'partial',
    verificationScore: 0.62,
    issuedAt: '2026-01-01T00:00:00.000Z',
  });

  const verified = await verifyAddressCredential(credential, {
    issuerSecret,
    minimumScore: 0.7,
    allowedStatuses: ['verified'],
    now: '2026-01-01T00:01:00.000Z',
  });

  assert.equal(credential.claim.qualityBand, 'partial');
  assert.equal(credential.claim.proofHint.zkpGenerated, false);
  assert.equal(verified.valid, false);
  assert.ok(verified.errors.includes('minimum-score-not-met'));
  assert.ok(verified.errors.includes('status-not-allowed'));
});

test('creates a stable local cache key and refresh decision to avoid rebuilding every time', async () => {
  const input = {
    issuerId: 'agid-local-test',
    issuerSecret,
    address: {
      country_code: 'US',
      country: 'United States',
      city: 'New York',
      postcode: '10001',
      road: 'West 31st Street',
      house_number: '1',
    },
    countryCode: 'US',
    postalCode: '10001',
    verificationStatus: 'verified' as const,
    verificationScore: 0.92,
    sourceIds: ['usps-city-state-lookup'],
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
  };

  const firstKey = await createAddressCredentialCacheKey(input);
  const secondKey = await createAddressCredentialCacheKey({
    ...input,
    sourceIds: ['usps-city-state-lookup'],
  });
  const credential = await issueAddressCredential(input);

  assert.equal(firstKey, secondKey);
  assert.equal(credential.localCacheKey, firstKey);
  assert.equal(shouldRefreshAddressCredential(credential, {
    now: '2026-01-01T00:10:00.000Z',
    minRemainingSeconds: 300,
  }), false);
  assert.equal(shouldRefreshAddressCredential(credential, {
    now: '2026-01-01T00:59:00.000Z',
    minRemainingSeconds: 120,
  }), true);
});

test('keeps residence and legal ownership claims on the AOID credential layer', async () => {
  const credential = await issueAddressCredential({
    issuerId: 'agid-civic-residence-issuer',
    issuerSecret,
    layer: 'AOID',
    claimKind: 'residence',
    assuranceLevel: 'issuer-attested',
    evidenceCommitmentRefs: [
      'sha256-residence-attestation-commitment-001',
    ],
    address: {
      country_code: 'JP',
      country: 'Japan',
      state: 'Tokyo',
      city: 'Chiyoda-ku',
      postcode: '100-0001',
    },
    countryCode: 'JP',
    postalCode: '100-0001',
    verificationStatus: 'verified',
    verificationScore: 0.91,
    sourceIds: ['municipal-residence-attestation'],
    issuedAt: '2026-01-01T00:00:00.000Z',
  });

  assert.equal(credential.claim.layer, 'AOID');
  assert.equal(credential.claim.claimKind, 'residence');
  assert.equal(credential.claim.assuranceLevel, 'issuer-attested');
  assert.deepEqual(credential.claim.evidenceCommitmentRefs, [
    'sha256-residence-attestation-commitment-001',
  ]);
  assert.doesNotMatch(JSON.stringify(credential), /住民票|full legal name|raw deed|phone/iu);

  const verified = await verifyAddressCredential(credential, {
    issuerSecret,
    expectedLayer: 'AOID',
    requiredClaimKind: 'residence',
    minimumAssuranceLevel: 'issuer-attested',
    now: '2026-01-01T00:01:00.000Z',
  });

  assert.equal(verified.valid, true);
  assert.deepEqual(verified.errors, []);
});

test('rejects legal ownership or residence credentials that bypass the AOID evidence layer', async () => {
  await assert.rejects(
    issueAddressCredential({
      issuerId: 'agid-bad-legal-issuer',
      issuerSecret,
      layer: 'AGID',
      claimKind: 'legal-ownership',
      evidenceCommitmentRefs: ['sha256-title-attestation-commitment-001'],
      address: {
        country_code: 'US',
        country: 'United States',
        city: 'New York',
        postcode: '10001',
      },
      countryCode: 'US',
      postalCode: '10001',
      verificationStatus: 'verified',
      verificationScore: 0.95,
    }),
    /must be issued as AOID credentials/i
  );

  await assert.rejects(
    issueAddressCredential({
      issuerId: 'agid-bad-residence-issuer',
      issuerSecret,
      layer: 'AOID',
      claimKind: 'residence',
      address: {
        country_code: 'JP',
        country: 'Japan',
        city: 'Tokyo',
      },
      countryCode: 'JP',
      verificationStatus: 'verified',
      verificationScore: 0.9,
    }),
    /require at least one evidence commitment/i
  );
});
