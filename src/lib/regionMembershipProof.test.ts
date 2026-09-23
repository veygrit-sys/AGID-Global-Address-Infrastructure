import assert from 'node:assert/strict';
import { test } from 'node:test';

import { encodeAGID } from './agid';
import {
  createRegionMembershipProof,
  stripPrivateRegionMembershipProofMaterial,
  verifyRegionMembershipProof,
  type RegionMembershipRegion,
} from './regionMembershipProof';

const issuerId = 'agid-region-membership-test';
const issuerSecret = 'test-only-region-membership-issuer-secret';
const challenge = 'region-membership-session-nonce-001';

const tokyoRegion: RegionMembershipRegion = {
  id: 'JP:TOKYO',
  name: 'Tokyo Metropolis',
  purpose: 'administrative',
  version: 'test-tokyo-bbox-v1',
  sourceIds: ['test-open-admin-boundary'],
  geometry: {
    type: 'bbox',
    north: 35.9,
    south: 35.5,
    west: 139.55,
    east: 139.95,
  },
};

test('proves AGID membership in Tokyo without exposing the AGID center or address', async () => {
  const agid = encodeAGID(35.6812, 139.7671).id;
  const envelope = await createRegionMembershipProof({
    issuerId,
    issuerSecret,
    subjectKind: 'AGID',
    agid,
    region: tokyoRegion,
    scope: 'tokyo-administrative-membership',
    challenge,
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 3600,
    privateMembershipSalt: 'region-membership-private-salt',
  });

  const publicEnvelope = stripPrivateRegionMembershipProofMaterial(envelope);
  const publicText = JSON.stringify(publicEnvelope);

  assert.equal(envelope.claim.membership.inside, true);
  assert.equal(envelope.claim.subjectKind, 'AGID');
  assert.equal(envelope.claim.membership.regionId, 'JP:TOKYO');
  assert.equal(envelope.claim.membership.geometryType, 'bbox');
  assert.equal(envelope.localCacheKey?.startsWith('region-membership:'), true);
  assert.equal('privateMembershipSalt' in publicEnvelope, false);
  assert.equal(publicText.includes(agid), false);
  assert.equal(publicText.includes('35.6812'), false);
  assert.equal(publicText.includes('139.7671'), false);
  assert.equal(publicText.includes('Tokyo Metropolis'), false);
  assert.equal(publicText.includes('region-membership-private-salt'), false);

  const verification = await verifyRegionMembershipProof(publicEnvelope, {
    issuerId,
    issuerSecret,
    expectedSubjectKind: 'AGID',
    expectedRegionId: 'JP:TOKYO',
    expectedScope: 'tokyo-administrative-membership',
    expectedChallenge: challenge,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.membershipAsserted, true);
  assert.equal(verification.privacyPreserved, true);
  assert.equal(verification.proofCost, 'none');
});

test('proves AOID is inside a delivery area without exposing AOID or coordinates', async () => {
  const envelope = await createRegionMembershipProof({
    issuerId,
    issuerSecret,
    subjectKind: 'AOID',
    subjectId: '05AV8TJGH8QZ6M2R',
    point: { lat: 35.68, lon: 139.76 },
    address: {
      road: 'Marunouchi',
      postcode: '100-0001',
    },
    region: {
      id: 'DELIVERY:TOKYO-CENTRAL',
      name: 'Central Tokyo delivery area',
      purpose: 'delivery-area',
      geometry: {
        type: 'circle',
        center: { lat: 35.70, lon: 139.75 },
        radiusMeters: 5000,
      },
    },
    scope: 'delivery-area-check',
    challenge,
    issuedAt: '2026-01-01T00:00:00.000Z',
    privateMembershipSalt: 'aoid-region-private-salt',
  });

  const publicEnvelope = stripPrivateRegionMembershipProofMaterial(envelope);
  const publicText = JSON.stringify(publicEnvelope);

  assert.equal(envelope.claim.subjectKind, 'AOID');
  assert.equal(envelope.claim.membership.regionPurpose, 'delivery-area');
  assert.equal(publicText.includes('05AV8TJGH8QZ6M2R'), false);
  assert.equal(publicText.includes('35.68'), false);
  assert.equal(publicText.includes('139.76'), false);
  assert.equal(publicText.includes('Marunouchi'), false);
  assert.equal(publicText.includes('100-0001'), false);
  assert.equal(publicText.includes('radiusMeters'), false);

  const verification = await verifyRegionMembershipProof(publicEnvelope, {
    issuerSecret,
    expectedSubjectKind: 'AOID',
    expectedRegionId: 'DELIVERY:TOKYO-CENTRAL',
    expectedScope: 'delivery-area-check',
    expectedChallenge: challenge,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, true);
  assert.equal(verification.privacyPreserved, true);
});

test('proves hidden point is inside a border polygon without exposing the point', async () => {
  const envelope = await createRegionMembershipProof({
    issuerId,
    issuerSecret,
    subjectKind: 'POINT',
    point: { lat: 35.0, lon: 139.0 },
    address: 'hidden border checkpoint address',
    region: {
      id: 'COUNTRY:TESTLAND',
      purpose: 'country-border',
      geometry: {
        type: 'polygon',
        rings: [[
          [138.5, 34.5],
          [139.5, 34.5],
          [139.5, 35.5],
          [138.5, 35.5],
          [138.5, 34.5],
        ]],
      },
    },
    scope: 'country-border-check',
    challenge,
    issuedAt: '2026-01-01T00:00:00.000Z',
    privateMembershipSalt: 'point-region-private-salt',
  });

  const publicEnvelope = stripPrivateRegionMembershipProofMaterial(envelope);
  const publicText = JSON.stringify(publicEnvelope);

  assert.equal(envelope.claim.membership.regionPurpose, 'country-border');
  assert.equal(envelope.claim.membership.geometryType, 'polygon');
  assert.equal(publicText.includes('35.0'), false);
  assert.equal(publicText.includes('139.0'), false);
  assert.equal(publicText.includes('hidden border checkpoint address'), false);
  assert.equal(publicText.includes('rings'), false);

  const verification = await verifyRegionMembershipProof(publicEnvelope, {
    issuerSecret,
    expectedSubjectKind: 'POINT',
    expectedRegionId: 'COUNTRY:TESTLAND',
    expectedScope: 'country-border-check',
    expectedChallenge: challenge,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, true);
});

test('rejects witnesses outside the requested region', async () => {
  await assert.rejects(
    createRegionMembershipProof({
      issuerId,
      issuerSecret,
      subjectKind: 'POINT',
      point: { lat: 34.0, lon: 139.0 },
      region: tokyoRegion,
      challenge,
      privateMembershipSalt: 'outside-region-private-salt',
    }),
    /outside/i
  );
});

test('rejects unsupported subject kinds and geometry types during proof creation', async () => {
  await assert.rejects(
    createRegionMembershipProof({
      issuerId,
      issuerSecret,
      subjectKind: 'DEVICE' as never,
      subjectId: 'hidden-device',
      point: { lat: 35.68, lon: 139.76 },
      region: tokyoRegion,
      challenge,
      privateMembershipSalt: 'invalid-subject-private-salt',
    }),
    /subjectKind/i
  );

  await assert.rejects(
    createRegionMembershipProof({
      issuerId,
      issuerSecret,
      subjectKind: 'POINT',
      point: { lat: 35.68, lon: 139.76 },
      region: {
        ...tokyoRegion,
        geometry: { type: 'line' } as never,
      },
      challenge,
      privateMembershipSalt: 'invalid-geometry-private-salt',
    }),
    /geometry type/i
  );
});

test('returns an invalid result instead of throwing for malformed public envelopes', async () => {
  const verification = await verifyRegionMembershipProof({} as never, {
    issuerSecret,
    expectedChallenge: challenge,
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, null);
  assert.equal(verification.privacyPreserved, false);
  assert.ok(verification.errors.includes('malformed-region-membership-proof'));
  assert.ok(verification.warnings.includes('verification-runtime-guarded'));
});

test('rejects expired region membership proofs', async () => {
  const envelope = await createRegionMembershipProof({
    issuerId,
    issuerSecret,
    subjectKind: 'POINT',
    point: { lat: 35.68, lon: 139.76 },
    region: tokyoRegion,
    challenge,
    issuedAt: '2026-01-01T00:00:00.000Z',
    ttlSeconds: 60,
    privateMembershipSalt: 'expired-region-private-salt',
  });

  const verification = await verifyRegionMembershipProof(stripPrivateRegionMembershipProofMaterial(envelope), {
    issuerSecret,
    expectedRegionId: 'JP:TOKYO',
    expectedChallenge: challenge,
    now: '2026-01-01T00:02:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.expired, true);
  assert.ok(verification.errors.includes('region-membership-proof-expired'));
});

test('rejects unstripped local region membership proof material as public proof', async () => {
  const envelope = await createRegionMembershipProof({
    issuerId,
    issuerSecret,
    subjectKind: 'POINT',
    point: { lat: 35.68, lon: 139.76 },
    region: tokyoRegion,
    challenge,
    issuedAt: '2026-01-01T00:00:00.000Z',
    privateMembershipSalt: 'region-membership-private-salt',
  });

  const verification = await verifyRegionMembershipProof(envelope, {
    issuerSecret,
    expectedRegionId: 'JP:TOKYO',
    expectedChallenge: challenge,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, true);
  assert.equal(verification.privacyPreserved, false);
  assert.ok(verification.errors.includes('privacy-fields-not-hidden'));
});

test('rejects tampered region membership signatures', async () => {
  const envelope = await createRegionMembershipProof({
    issuerId,
    issuerSecret,
    subjectKind: 'POINT',
    point: { lat: 35.68, lon: 139.76 },
    region: tokyoRegion,
    challenge,
    issuedAt: '2026-01-01T00:00:00.000Z',
    privateMembershipSalt: 'region-membership-private-salt',
  });

  const publicEnvelope = stripPrivateRegionMembershipProofMaterial(envelope);
  const tampered = {
    ...publicEnvelope,
    claim: {
      ...publicEnvelope.claim,
      membership: {
        ...publicEnvelope.claim.membership,
        regionId: 'JP:OSAKA',
      },
    },
  };

  const verification = await verifyRegionMembershipProof(tampered, {
    issuerSecret,
    expectedChallenge: challenge,
    now: '2026-01-01T00:10:00.000Z',
  });

  assert.equal(verification.valid, false);
  assert.equal(verification.signatureValid, false);
  assert.ok(verification.errors.includes('signature-invalid'));
});
