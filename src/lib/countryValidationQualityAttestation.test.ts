import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildApprovedCountryGeographicMetadataEvaluationIndex } from './countryGeographicMetadataEvaluationCatalog';
import {
  COUNTRY_VALIDATION_QUALITY_ATTESTATION_LIMITS,
  COUNTRY_VALIDATION_REVIEWER_REGISTRY_DIGEST_ALGORITHM,
  COUNTRY_VALIDATION_REVIEWER_REGISTRY_SIGNATURE_VERSION,
  COUNTRY_VALIDATION_QUALITY_ATTESTATION_VERSION,
  countryValidationReviewerRegistryDigest,
  verifyCountryValidationReviewerRegistrySignature,
  verifyCountryValidationQualityTrustChain,
  countryValidationQualitySigningMessage,
  verifyCountryValidationQualityAttestation,
  type CountryValidationReviewerRegistryIssuerRegistry,
  type CountryValidationQualityReviewerRegistry,
} from './countryValidationQualityAttestation';
import { buildCountryValidationQualityReport } from './countryValidationQualityGate';

const RFC_8032_PUBLIC_KEY = Buffer.from(
  'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a',
  'hex',
).toString('base64url');
const RFC_8032_EMPTY_MESSAGE_SIGNATURE = Buffer.from(
  'e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e06522490155'
    + '5fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b',
  'hex',
).toString('base64url');

function registry(status: 'trusted' | 'revoked' = 'trusted'): CountryValidationQualityReviewerRegistry {
  const unsigned: Omit<CountryValidationQualityReviewerRegistry, 'registryDigest'> = {
    version: COUNTRY_VALIDATION_QUALITY_ATTESTATION_VERSION,
    digestAlgorithm: COUNTRY_VALIDATION_REVIEWER_REGISTRY_DIGEST_ALGORITHM,
    keys: [{
      keyId: 'independent-reviewer-rfc-vector',
      reviewerId: 'independent-quality-lab',
      algorithm: 'Ed25519',
      purpose: 'country-validation-quality-review',
      publicKeyBase64Url: RFC_8032_PUBLIC_KEY,
      status,
      revokedAt: status === 'revoked' ? '2026-07-25T12:30:00.000Z' : null,
      supersedesKeyId: null,
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2027-01-01T00:00:00.000Z',
      reviewedAt: '2026-07-01T00:00:00.000Z',
      reviewBy: '2026-10-01T00:00:00.000Z',
      registryUrl: 'https://example.invalid/agid-country-quality-reviewers',
      revocationUrl: 'https://example.invalid/agid-country-quality-reviewers/revocations',
    }],
  };
  return {
    ...unsigned,
    registryDigest: countryValidationReviewerRegistryDigest(unsigned),
  };
}

function report() {
  const index = buildApprovedCountryGeographicMetadataEvaluationIndex({
    now: '2026-07-25T12:00:00Z',
  });
  return buildCountryValidationQualityReport(index, 'GT', '2026-07-25T12:00:00Z');
}

test('canonicalizes reviewer registry fields independently of object insertion order', () => {
  const canonical = registry();
  const reorderedKey = Object.fromEntries(
    Object.entries(canonical.keys[0]).reverse(),
  ) as typeof canonical.keys[number];

  assert.equal(
    countryValidationReviewerRegistryDigest({
      version: canonical.version,
      keys: [reorderedKey],
    }),
    canonical.registryDigest,
  );
  assert.equal(
    canonical.digestAlgorithm,
    'sha256-country-quality-reviewer-registry-v2',
  );
});

test('rejects oversized reviewer and issuer registries before signature verification', async () => {
  const oversizedReviewerRegistry = registry();
  oversizedReviewerRegistry.keys = Array.from(
    { length: COUNTRY_VALIDATION_QUALITY_ATTESTATION_LIMITS.maxReviewerKeys + 1 },
    (_, index) => ({
      ...oversizedReviewerRegistry.keys[0],
      keyId: `reviewer-key-${index}`,
      reviewerId: `reviewer-${index}`,
    }),
  );
  oversizedReviewerRegistry.registryDigest = countryValidationReviewerRegistryDigest(
    oversizedReviewerRegistry,
  );

  const qualityResult = await verifyCountryValidationQualityAttestation({
    report: report(),
    evaluatorId: 'agid-local-evaluator',
    registry: oversizedReviewerRegistry,
    signature: {
      algorithm: 'Ed25519',
      keyId: 'reviewer-key-0',
      signedAt: '2026-07-25T13:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    asOf: '2026-07-25T13:01:00.000Z',
  });
  assert.equal(qualityResult.status, 'rejected');
  assert.equal(qualityResult.signatureValid, false);
  assert.deepEqual(qualityResult.issues, ['registry.keys: limit exceeded']);

  const oversizedIssuerRegistry: CountryValidationReviewerRegistryIssuerRegistry = {
    version: COUNTRY_VALIDATION_REVIEWER_REGISTRY_SIGNATURE_VERSION,
    keys: Array.from(
      { length: COUNTRY_VALIDATION_QUALITY_ATTESTATION_LIMITS.maxIssuerKeys + 1 },
      (_, index) => ({
        keyId: `issuer-key-${index}`,
        issuerId: `issuer-${index}`,
        algorithm: 'Ed25519',
        purpose: 'country-validation-reviewer-registry',
        publicKeyBase64Url: RFC_8032_PUBLIC_KEY,
        status: 'trusted',
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2027-01-01T00:00:00.000Z',
        reviewedAt: '2026-07-01T00:00:00.000Z',
        reviewBy: '2026-10-01T00:00:00.000Z',
        registryUrl: 'https://example.invalid/agid-registry-issuers',
        revocationUrl: 'https://example.invalid/agid-registry-issuers/revocations',
      })),
  };
  const registryResult = await verifyCountryValidationReviewerRegistrySignature({
    registry: registry(),
    issuerRegistry: oversizedIssuerRegistry,
    signature: {
      algorithm: 'Ed25519',
      keyId: 'issuer-key-0',
      signedAt: '2026-07-25T12:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    asOf: '2026-07-25T12:01:00.000Z',
  });
  assert.equal(registryResult.status, 'rejected');
  assert.equal(registryResult.signatureValid, false);
  assert.deepEqual(registryResult.issues, ['issuerRegistry.keys: limit exceeded']);
});

test('rejects oversized UTF-8 fields before digest or signature processing', async () => {
  const oversizedMultilingualId = 'é'.repeat(
    Math.floor(COUNTRY_VALIDATION_QUALITY_ATTESTATION_LIMITS.maxUtf8BytesPerField / 2) + 1,
  );
  const qualityResult = await verifyCountryValidationQualityAttestation({
    report: report(),
    evaluatorId: 'agid-local-evaluator',
    registry: registry(),
    signature: {
      algorithm: 'Ed25519',
      keyId: oversizedMultilingualId,
      signedAt: '2026-07-25T13:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    asOf: '2026-07-25T13:01:00.000Z',
  });
  assert.equal(qualityResult.status, 'rejected');
  assert.equal(qualityResult.digestBound, false);
  assert.deepEqual(qualityResult.issues, ['signature.keyId: UTF-8 byte limit exceeded']);

  const issuerRegistry: CountryValidationReviewerRegistryIssuerRegistry = {
    version: COUNTRY_VALIDATION_REVIEWER_REGISTRY_SIGNATURE_VERSION,
    keys: [{
      keyId: 'registry-issuer-rfc-vector',
      issuerId: 'agid-public-trust-maintainer',
      algorithm: 'Ed25519',
      purpose: 'country-validation-reviewer-registry',
      publicKeyBase64Url: RFC_8032_PUBLIC_KEY,
      status: 'trusted',
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2027-01-01T00:00:00.000Z',
      reviewedAt: '2026-07-01T00:00:00.000Z',
      reviewBy: '2026-10-01T00:00:00.000Z',
      registryUrl: `https://example.invalid/${'x'.repeat(
        COUNTRY_VALIDATION_QUALITY_ATTESTATION_LIMITS.maxUtf8BytesPerField,
      )}`,
      revocationUrl: 'https://example.invalid/agid-registry-issuers/revocations',
    }],
  };
  const registryResult = await verifyCountryValidationReviewerRegistrySignature({
    registry: registry(),
    issuerRegistry,
    signature: {
      algorithm: 'Ed25519',
      keyId: 'registry-issuer-rfc-vector',
      signedAt: '2026-07-25T12:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    asOf: '2026-07-25T12:01:00.000Z',
  });
  assert.equal(registryResult.status, 'rejected');
  assert.equal(registryResult.digestValid, false);
  assert.deepEqual(
    registryResult.issues,
    ['issuerRegistry.keys[0].registryUrl: UTF-8 byte limit exceeded'],
  );
});

test('rejects non-NFC trust metadata before digest or signature processing', async () => {
  const decomposedReviewerRegistry = registry();
  decomposedReviewerRegistry.keys[0].reviewerId = 'independent-quality-lab-e\u0301';
  decomposedReviewerRegistry.registryDigest = countryValidationReviewerRegistryDigest(
    decomposedReviewerRegistry,
  );
  const qualityResult = await verifyCountryValidationQualityAttestation({
    report: report(),
    evaluatorId: 'agid-local-evaluator',
    registry: decomposedReviewerRegistry,
    signature: {
      algorithm: 'Ed25519',
      keyId: 'independent-reviewer-rfc-vector',
      signedAt: '2026-07-25T13:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    asOf: '2026-07-25T13:01:00.000Z',
  });
  assert.equal(qualityResult.status, 'rejected');
  assert.equal(qualityResult.digestBound, false);
  assert.deepEqual(
    qualityResult.issues,
    ['registry.keys[0].reviewerId: NFC normalization required'],
  );

  const issuerRegistry: CountryValidationReviewerRegistryIssuerRegistry = {
    version: COUNTRY_VALIDATION_REVIEWER_REGISTRY_SIGNATURE_VERSION,
    keys: [{
      keyId: 'registry-issuer-rfc-vector',
      issuerId: 'agid-public-trust-maintainer-e\u0301',
      algorithm: 'Ed25519',
      purpose: 'country-validation-reviewer-registry',
      publicKeyBase64Url: RFC_8032_PUBLIC_KEY,
      status: 'trusted',
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2027-01-01T00:00:00.000Z',
      reviewedAt: '2026-07-01T00:00:00.000Z',
      reviewBy: '2026-10-01T00:00:00.000Z',
      registryUrl: 'https://example.invalid/agid-registry-issuers',
      revocationUrl: 'https://example.invalid/agid-registry-issuers/revocations',
    }],
  };
  const registryResult = await verifyCountryValidationReviewerRegistrySignature({
    registry: registry(),
    issuerRegistry,
    signature: {
      algorithm: 'Ed25519',
      keyId: 'registry-issuer-rfc-vector',
      signedAt: '2026-07-25T12:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    asOf: '2026-07-25T12:01:00.000Z',
  });
  assert.equal(registryResult.status, 'rejected');
  assert.equal(registryResult.digestValid, false);
  assert.deepEqual(
    registryResult.issues,
    ['issuerRegistry.keys[0].issuerId: NFC normalization required'],
  );
});

test('rejects non-ASCII technical identifiers and deeply nested metadata', async () => {
  const identifierResult = await verifyCountryValidationQualityAttestation({
    report: report(),
    evaluatorId: 'agid-local-evaluator',
    registry: registry(),
    signature: {
      algorithm: 'Ed25519',
      keyId: 'reviewer-\u0456d',
      signedAt: '2026-07-25T13:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    asOf: '2026-07-25T13:01:00.000Z',
  });
  assert.equal(identifierResult.status, 'rejected');
  assert.deepEqual(
    identifierResult.issues,
    ['signature.keyId: ASCII technical identifier required'],
  );

  let nested: Record<string, unknown> = { value: 'synthetic' };
  for (
    let depth = 0;
    depth <= COUNTRY_VALIDATION_QUALITY_ATTESTATION_LIMITS.maxMetadataDepth;
    depth += 1
  ) {
    nested = { extension: nested };
  }
  const signature = {
    algorithm: 'Ed25519' as const,
    keyId: 'independent-reviewer-rfc-vector',
    signedAt: '2026-07-25T13:00:00.000Z',
    signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
  };
  (signature as unknown as Record<string, unknown>).metadata = nested;
  const nestingResult = await verifyCountryValidationQualityAttestation({
    report: report(),
    evaluatorId: 'agid-local-evaluator',
    registry: registry(),
    signature,
    asOf: '2026-07-25T13:01:00.000Z',
  });
  assert.equal(nestingResult.status, 'rejected');
  assert.ok(nestingResult.issues.some(issue => issue.endsWith('metadata nesting limit exceeded')));
});

test('publishes a canonical signing message bound to the country holdout digest', () => {
  const message = countryValidationQualitySigningMessage({
    report: report(),
    evaluatorId: 'agid-local-evaluator',
    signature: {
      keyId: 'independent-reviewer-rfc-vector',
      signedAt: '2026-07-25T13:00:00.000Z',
    },
  });

  assert.match(message, /agid-country-validation-quality-review-ed25519-v5/);
  assert.match(message, /"countryCode":"GT"/);
  assert.match(message, /"holdoutDigest":"sha256:[0-9a-f]{64}"/);
  assert.match(message, /"evaluatorId":"agid-local-evaluator"/);
  assert.ok(!message.includes('address'));
  assert.ok(!message.includes('recipient'));
});

test('binds evaluator identity into the independent-review signing message', () => {
  const signature = {
    keyId: 'independent-reviewer-rfc-vector',
    signedAt: '2026-07-25T13:00:00.000Z',
  };
  const first = countryValidationQualitySigningMessage({
    report: report(),
    evaluatorId: 'agid-local-evaluator',
    signature,
  });
  const substituted = countryValidationQualitySigningMessage({
    report: report(),
    evaluatorId: 'substituted-evaluator',
    signature,
  });

  assert.notEqual(first, substituted);
});

test('rejects a signature that is not bound to the canonical quality report', async () => {
  const result = await verifyCountryValidationQualityAttestation({
    report: report(),
    evaluatorId: 'agid-local-evaluator',
    registry: registry(),
    signature: {
      algorithm: 'Ed25519',
      keyId: 'independent-reviewer-rfc-vector',
      signedAt: '2026-07-25T13:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    asOf: '2026-07-25T13:01:00.000Z',
  });

  assert.equal(result.digestBound, true);
  assert.equal(result.trustValid, true);
  assert.equal(result.signatureValid, false);
  assert.equal(result.independentReviewComplete, false);
  assert.equal(result.deliveryClaimsEnabled, false);
  assert.ok(result.issues.includes('signature: cryptographic verification failed'));
});

test('rejects revoked, stale, or non-independent reviewer trust', async () => {
  const staleRegistry = registry();
  staleRegistry.keys[0].reviewBy = '2026-07-24T00:00:00.000Z';
  const cases = [
    { evaluatorId: 'agid-local-evaluator', reviewerRegistry: registry('revoked') },
    { evaluatorId: 'agid-local-evaluator', reviewerRegistry: staleRegistry },
    { evaluatorId: 'independent-quality-lab', reviewerRegistry: registry() },
  ];

  for (const item of cases) {
    const result = await verifyCountryValidationQualityAttestation({
      report: report(),
      evaluatorId: item.evaluatorId,
      registry: item.reviewerRegistry,
      signature: {
        algorithm: 'Ed25519',
        keyId: 'independent-reviewer-rfc-vector',
        signedAt: '2026-07-25T13:00:00.000Z',
        signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
      },
      asOf: '2026-07-25T13:01:00.000Z',
    });

    assert.equal(result.status, 'rejected');
    assert.equal(result.trustValid, false);
    assert.equal(result.independentReviewComplete, false);
  }
});

test('rejects reports without an eligible digest before signature verification', async () => {
  const blockedReport = buildCountryValidationQualityReport(
    buildApprovedCountryGeographicMetadataEvaluationIndex({ now: '2026-08-26T00:00:00Z' }),
    'GT',
    '2026-08-26T00:00:00Z',
  );
  const result = await verifyCountryValidationQualityAttestation({
    report: blockedReport,
    evaluatorId: 'agid-local-evaluator',
    registry: registry(),
    signature: {
      algorithm: 'Ed25519',
      keyId: 'independent-reviewer-rfc-vector',
      signedAt: '2026-08-26T01:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    asOf: '2026-08-26T01:01:00.000Z',
  });

  assert.equal(result.digestBound, false);
  assert.equal(result.signatureValid, false);
  assert.equal(result.status, 'rejected');
});

test('rejects private or sensitive fields added to public attestation metadata', async () => {
  const unsafeSignature = {
    algorithm: 'Ed25519' as const,
    keyId: 'independent-reviewer-rfc-vector',
    signedAt: '2026-07-25T13:00:00.000Z',
    signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    privateKey: 'synthetic-prohibited-value',
  };
  const result = await verifyCountryValidationQualityAttestation({
    report: report(),
    evaluatorId: 'agid-local-evaluator',
    registry: registry(),
    signature: unsafeSignature,
    asOf: '2026-07-25T13:01:00.000Z',
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.signatureValid, false);
  assert.ok(result.issues.some(issue => issue.includes('signature.privateKey')));
});

test('rejects reviewer aliases or key aliases in the trust registry', async () => {
  const duplicated = registry();
  duplicated.keys.push({
    ...duplicated.keys[0],
    keyId: 'independent-reviewer-alias-key',
  });
  const result = await verifyCountryValidationQualityAttestation({
    report: report(),
    evaluatorId: 'agid-local-evaluator',
    registry: duplicated,
    signature: {
      algorithm: 'Ed25519',
      keyId: 'independent-reviewer-rfc-vector',
      signedAt: '2026-07-25T13:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    asOf: '2026-07-25T13:01:00.000Z',
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.trustValid, false);
  assert.ok(result.issues.includes('registry.keys: duplicate reviewer id'));
  assert.ok(result.issues.includes('registry.keys: duplicate public key'));
});

test('rejects inconsistent revocation and key-rotation history', async () => {
  const inconsistent = registry();
  inconsistent.keys[0].revokedAt = '2026-07-25T12:30:00.000Z';
  inconsistent.keys[0].supersedesKeyId = 'missing-predecessor';
  const result = await verifyCountryValidationQualityAttestation({
    report: report(),
    evaluatorId: 'agid-local-evaluator',
    registry: inconsistent,
    signature: {
      algorithm: 'Ed25519',
      keyId: 'independent-reviewer-rfc-vector',
      signedAt: '2026-07-25T13:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    asOf: '2026-07-25T13:01:00.000Z',
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.trustValid, false);
  assert.ok(result.issues.some(issue => issue.includes('revocation status and timestamp')));
  assert.ok(result.issues.some(issue => issue.includes('key rotation predecessor')));
});

test('rejects reviewer registry metadata changed after its digest was issued', async () => {
  const tampered = registry();
  tampered.keys[0].reviewBy = '2026-12-01T00:00:00.000Z';
  const result = await verifyCountryValidationQualityAttestation({
    report: report(),
    evaluatorId: 'agid-local-evaluator',
    registry: tampered,
    signature: {
      algorithm: 'Ed25519',
      keyId: 'independent-reviewer-rfc-vector',
      signedAt: '2026-07-25T13:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    asOf: '2026-07-25T13:01:00.000Z',
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.trustValid, false);
  assert.ok(result.issues.includes('registry.registryDigest: unsupported or mismatched'));
});

test('verifies reviewer-registry issuer trust before accepting its signature', async () => {
  const reviewerRegistry = registry();
  const issuerRegistry: CountryValidationReviewerRegistryIssuerRegistry = {
    version: COUNTRY_VALIDATION_REVIEWER_REGISTRY_SIGNATURE_VERSION,
    keys: [{
      keyId: 'registry-issuer-rfc-vector',
      issuerId: 'agid-public-trust-maintainer',
      algorithm: 'Ed25519' as const,
      purpose: 'country-validation-reviewer-registry' as const,
      publicKeyBase64Url: RFC_8032_PUBLIC_KEY,
      status: 'trusted' as const,
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2027-01-01T00:00:00.000Z',
      reviewedAt: '2026-07-01T00:00:00.000Z',
      reviewBy: '2026-10-01T00:00:00.000Z',
      registryUrl: 'https://example.invalid/agid-registry-issuers',
      revocationUrl: 'https://example.invalid/agid-registry-issuers/revocations',
    }],
  };
  const result = await verifyCountryValidationReviewerRegistrySignature({
    registry: reviewerRegistry,
    issuerRegistry,
    signature: {
      algorithm: 'Ed25519',
      keyId: 'registry-issuer-rfc-vector',
      signedAt: '2026-07-25T12:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    asOf: '2026-07-25T12:01:00.000Z',
  });

  assert.equal(result.digestValid, true);
  assert.equal(result.trustValid, true);
  assert.equal(result.signatureValid, false);
  assert.equal(result.status, 'rejected');
  assert.equal(result.issuerId, 'agid-public-trust-maintainer');
  assert.ok(result.issues.includes('signature: cryptographic verification failed'));
});

test('fails the complete quality trust chain before reviewing a report under an unverified registry', async () => {
  const reviewerRegistry = registry();
  const issuerRegistry: CountryValidationReviewerRegistryIssuerRegistry = {
    version: COUNTRY_VALIDATION_REVIEWER_REGISTRY_SIGNATURE_VERSION,
    keys: [{
      keyId: 'registry-issuer-rfc-vector',
      issuerId: 'agid-public-trust-maintainer',
      algorithm: 'Ed25519',
      purpose: 'country-validation-reviewer-registry',
      publicKeyBase64Url: RFC_8032_PUBLIC_KEY,
      status: 'trusted',
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2027-01-01T00:00:00.000Z',
      reviewedAt: '2026-07-01T00:00:00.000Z',
      reviewBy: '2026-10-01T00:00:00.000Z',
      registryUrl: 'https://example.invalid/agid-registry-issuers',
      revocationUrl: 'https://example.invalid/agid-registry-issuers/revocations',
    }],
  };
  const result = await verifyCountryValidationQualityTrustChain({
    report: report(),
    evaluatorId: 'agid-local-evaluator',
    qualitySignature: {
      algorithm: 'Ed25519',
      keyId: 'independent-reviewer-rfc-vector',
      signedAt: '2026-07-25T13:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    reviewerRegistry,
    reviewerRegistrySignature: {
      algorithm: 'Ed25519',
      keyId: 'registry-issuer-rfc-vector',
      signedAt: '2026-07-25T12:00:00.000Z',
      signatureBase64Url: RFC_8032_EMPTY_MESSAGE_SIGNATURE,
    },
    issuerRegistry,
    asOf: '2026-07-25T13:01:00.000Z',
  });

  assert.equal(result.status, 'rejected');
  assert.equal(result.reviewerRegistryVerified, false);
  assert.equal(result.qualityReportVerified, false);
  assert.equal(result.deliveryClaimsEnabled, false);
  assert.ok(result.issues.some(issue => issue.startsWith('reviewerRegistry.signature:')));
  assert.ok(result.issues.every(issue => !issue.startsWith('qualityReport.')));
});
