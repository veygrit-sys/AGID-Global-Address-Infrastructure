import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyCrowdsourcedVerificationToPoiGraph,
  evaluateCrowdsourcedPoiVerification,
  type CrowdPoiEvidenceSubmission,
} from './crowdsourcedPoiVerification';
import type { PoiDeliverabilityGraph } from './poiDeliverabilityGraph';

const now = new Date('2026-07-01T00:00:00Z');

const subject = {
  poiId: 'poi:ag:locker-market',
  agidCellId: 'AGID-CELL-AG-BRB-0001',
  countryCode: 'AG',
  featureName: 'Market Locker',
};

const safeSubmissions: CrowdPoiEvidenceSubmission[] = [
  {
    submissionId: 'sub-redacted-photo-1',
    poiId: subject.poiId,
    agidCellId: subject.agidCellId,
    reporterClass: 'public-user',
    reporterBucket: 'bucket-public-a',
    evidenceKind: 'redacted-photo',
    observedAt: '2026-06-30T10:00:00Z',
    redacted: true,
  },
  {
    submissionId: 'sub-coarse-location-1',
    poiId: subject.poiId,
    agidCellId: subject.agidCellId,
    reporterClass: 'verified-local',
    reporterBucket: 'bucket-local-b',
    evidenceKind: 'coarse-location',
    observedAt: '2026-06-29T10:00:00Z',
    coarseDistanceMeters: 80,
    signed: true,
  },
  {
    submissionId: 'sub-arrival-history-1',
    poiId: subject.poiId,
    agidCellId: subject.agidCellId,
    reporterClass: 'carrier',
    reporterBucket: 'bucket-carrier-c',
    evidenceKind: 'arrival-history',
    observedAt: '2026-06-28T10:00:00Z',
    arrivalCount: 14,
    successCount: 13,
    failureCount: 1,
    signed: true,
  },
  {
    submissionId: 'sub-municipal-link-1',
    poiId: subject.poiId,
    agidCellId: subject.agidCellId,
    reporterClass: 'municipality',
    reporterBucket: 'bucket-municipality-d',
    evidenceKind: 'public-record-link',
    observedAt: '2026-06-27T10:00:00Z',
    sourceRef: 'https://example.test/public-locker-registry',
    signed: true,
  },
];

test('corroborated safe submissions become community verified without raw evidence exposure', () => {
  const result = evaluateCrowdsourcedPoiVerification(subject, safeSubmissions, { now });

  assert.equal(result.status, 'community-verified');
  assert.equal(result.communityVerified, true);
  assert.equal(result.manualReviewRequired, false);
  assert.equal(result.uniqueReporterCount, 4);
  assert.ok(result.sourceConfidence >= 0.74);
  assert.equal(result.safeEvidenceRefs.length, 4);
  assert.ok(result.safeEvidenceRefs.every(ref => ref.startsWith('crowd:')));
  assert.equal(result.privacy.publicContainsRawPhoto, false);
  assert.equal(result.privacy.publicContainsPreciseCoordinates, false);

  const publicJson = JSON.stringify(result);
  assert.doesNotMatch(publicJson, /sub-redacted-photo-1/);
  assert.doesNotMatch(publicJson, /bucket-public-a/);
  assert.doesNotMatch(publicJson, /EXIF/i);
});

test('unsafe photo or precise coordinate submissions are rejected before scoring', () => {
  const result = evaluateCrowdsourcedPoiVerification(subject, [
    {
      submissionId: 'sub-unsafe-photo',
      poiId: subject.poiId,
      reporterClass: 'public-user',
      reporterBucket: 'bucket-public-risk',
      evidenceKind: 'redacted-photo',
      observedAt: '2026-06-30T10:00:00Z',
      redacted: false,
      containsRawPhoto: true,
      containsExif: true,
      containsPreciseCoordinates: true,
    },
  ], { now });

  assert.equal(result.status, 'rejected');
  assert.equal(result.sourceConfidence, 0);
  assert.ok(result.warnings.some(warning => warning.includes('privacy-blocker')));
  assert.ok(result.warnings.some(warning => warning.includes('photo-must-be-redacted')));
});

test('conflicting reports require manual review even with positive reports', () => {
  const result = evaluateCrowdsourcedPoiVerification(subject, [
    ...safeSubmissions.slice(0, 2),
    {
      submissionId: 'sub-negative-1',
      poiId: subject.poiId,
      reporterClass: 'verified-local',
      reporterBucket: 'bucket-local-negative',
      evidenceKind: 'negative-report',
      observedAt: '2026-06-30T10:00:00Z',
      contradictsPoi: true,
    },
  ], { now });

  assert.equal(result.status, 'manual-review-required');
  assert.equal(result.manualReviewRequired, true);
  assert.ok(result.reasons.includes('conflicting-or-negative-evidence'));
});

test('community verification can update POI graph trust without adding private evidence', () => {
  const graph: PoiDeliverabilityGraph = {
    graphId: 'synthetic-community-poi-graph',
    countryCode: 'AG',
    regionName: 'Synthetic Island',
    nodes: [
      {
        id: subject.poiId,
        type: 'locker',
        name: subject.featureName,
        lat: 17.646,
        lon: -61.818,
        trustScore: 0.52,
        sourceRefs: [{ sourceId: 'synthetic-seed', licenseStatus: 'synthetic' }],
      },
    ],
    edges: [],
  };
  const result = evaluateCrowdsourcedPoiVerification(subject, safeSubmissions, { now });
  const updated = applyCrowdsourcedVerificationToPoiGraph(graph, [result]);
  const node = updated.nodes[0];

  assert.ok(node.trustScore! > graph.nodes[0].trustScore!);
  assert.ok(node.serviceTags?.includes('community-verified'));
  assert.ok(node.sourceRefs.some(source => source.sourceId === `community:${subject.poiId}`));
});
