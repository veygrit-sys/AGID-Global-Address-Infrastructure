import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildDeliveryReachabilitySharedFeed,
  createDeliveryReachabilityReport,
  validateDeliveryReachabilityReport,
} from './deliveryReachabilityReport';

test('carrier road closure report can be shared publicly without leaking private fields', () => {
  const report = createDeliveryReachabilityReport({
    problemKind: 'road-closed',
    severity: 'blocker',
    reporterType: 'carrier',
    reporterId: 'driver-123',
    reporterCredentialRef: 'carrier-credential-123',
    carrierId: 'carrier-alpha',
    deviceId: 'scanner-9',
    agid: 'ML01R1A0ZTR4',
    rawAddress: 'Private recipient street 1-2-3',
    countryCode: 'jp',
    regionCode: 'JP-13',
    publicNote: 'Main approach road is closed near the depot entrance.',
    evidence: [
      { kind: 'signed-carrier-scan', signed: true },
      { kind: 'photo-redacted', redacted: true },
    ],
    timeWindow: { observedAt: '2026-06-17T10:00:00.000Z', expectedDuration: 'hours' },
    now: '2026-06-17T10:05:00.000Z',
  });

  assert.equal(report.publicProjection.publicationState, 'public');
  assert.equal(report.publicProjection.problemKind, 'road-closed');
  assert.equal(report.publicProjection.coarseAgid, 'ML01R1A0*');
  assert.ok(report.publicProjection.confidence >= 0.8);
  assert.ok(report.restrictedProjection.closedFields.includes('rawAddress'));
  assert.ok(report.restrictedProjection.closedFields.includes('reporterId'));
  assert.ok(report.restrictedProjection.closedFields.includes('deviceId'));

  const publicJson = JSON.stringify(report.publicProjection);
  assert.doesNotMatch(publicJson, /Private recipient street/i);
  assert.doesNotMatch(publicJson, /driver-123/i);
  assert.doesNotMatch(publicJson, /scanner-9/i);

  const validation = validateDeliveryReachabilityReport(report);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
});

test('drone no-fly and landing reports stay restricted even when signed', () => {
  const report = createDeliveryReachabilityReport({
    problemKind: 'drone-no-fly',
    reporterType: 'drone-operator',
    reporterTrusted: true,
    reporterId: 'drone-ops-team-a',
    deviceId: 'drone-unit-44',
    agid: 'DR01AREA9999',
    latitude: 35.681236,
    longitude: 139.767125,
    countryCode: 'JP',
    highRiskMode: true,
    evidence: [
      {
        kind: 'signed-drone-telemetry',
        signed: true,
        containsPreciseTelemetry: true,
      },
    ],
    now: '2026-06-17T11:00:00.000Z',
  });

  assert.equal(report.publicProjection.publicationState, 'restricted');
  assert.equal(report.publicProjection.problemKind, 'access-limited');
  assert.deepEqual(report.sharingPolicy.publicAudience, []);
  assert.ok(report.restrictedProjection.audience.includes('verified-carriers'));
  assert.ok(report.restrictedProjection.closedFields.includes('preciseCoordinates'));
  assert.ok(report.restrictedProjection.sensitiveTags.includes('drone-route-sensitive'));
  assert.ok(report.restrictedProjection.sensitiveTags.includes('high-risk-mode'));

  const publicJson = JSON.stringify(report.publicProjection);
  assert.doesNotMatch(publicJson, /35\.681236/);
  assert.doesNotMatch(publicJson, /139\.767125/);
  assert.doesNotMatch(publicJson, /drone-unit-44/i);
  assert.equal(validateDeliveryReachabilityReport(report).valid, true);
});

test('public user reports require review until corroborated', () => {
  const report = createDeliveryReachabilityReport({
    problemKind: 'access-blocked',
    reporterType: 'public-user',
    agid: 'PB01FOO99999',
    publicNote: 'Gate appears locked.',
    confirmationCount: 0,
    now: '2026-06-17T12:00:00.000Z',
  });

  assert.equal(report.publicProjection.publicationState, 'review-first');
  assert.equal(report.publicProjection.problemKind, 'review-pending');
  assert.equal(report.sharingPolicy.recommendedAction, 'queue-manual-review');
  const validation = validateDeliveryReachabilityReport(report);
  assert.equal(validation.valid, true);
  assert.ok(validation.warnings.includes('manual-review-required-before-sharing'));
});

test('shared feed aggregates corroborated public-safe reachability reports', () => {
  const first = createDeliveryReachabilityReport({
    problemKind: 'bridge-closed',
    reporterType: 'public-user',
    coarseAgid: 'BRIDGE01',
    countryCode: 'US',
    confirmationCount: 2,
    evidence: [{ kind: 'photo-redacted', redacted: true }],
    now: '2026-06-17T12:00:00.000Z',
  });
  const second = createDeliveryReachabilityReport({
    problemKind: 'bridge-closed',
    reporterType: 'municipality',
    coarseAgid: 'BRIDGE01',
    countryCode: 'US',
    evidence: [{ kind: 'municipal-notice', signed: true }],
    now: '2026-06-17T12:10:00.000Z',
  });

  const feed = buildDeliveryReachabilitySharedFeed([first, second], { minReportsToPublic: 2 });

  assert.equal(feed.length, 1);
  assert.equal(feed[0].publicationState, 'public');
  assert.equal(feed[0].problemKind, 'bridge-closed');
  assert.equal(feed[0].reportCount, 2);
  assert.ok(feed[0].confidence > first.publicProjection.confidence);
  assert.ok(feed[0].reporterClasses.includes('public'));
  assert.ok(feed[0].reporterClasses.includes('public-sector'));
});
