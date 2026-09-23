import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applySafeGeofenceToPoiDecision,
  evaluateSafeGeofence,
  validateSafeGeofenceZone,
  type SafeGeofenceZone,
} from './safeGeofencePolicy';
import type { PoiDeliverabilityDecision, PoiTargetCell } from './poiDeliverabilityGraph';

const now = new Date('2026-07-01T12:00:00Z');

const target: PoiTargetCell = {
  agidCellId: 'agid:ag:barbuda:codrington:cell-01',
  centroidLat: 17.642,
  centroidLon: -61.824,
  precision: 'neighborhood',
};

function zone(overrides: Partial<SafeGeofenceZone>): SafeGeofenceZone {
  return {
    zoneId: 'zone-default',
    kind: 'danger-area',
    title: 'Synthetic safe geofence',
    requiredStatus: 'manual-review',
    disclosureMode: 'coarse-only',
    scope: { agidCellPrefixes: ['agid:ag:barbuda'] },
    sourceClass: 'public-safety',
    sourceConfidence: 0.9,
    publicSafe: true,
    ...overrides,
  };
}

test('non-public private-property geofence suppresses public route/address output', () => {
  const decision = evaluateSafeGeofence({
    target,
    countryCode: 'AG',
    now,
    zones: [
      zone({
        zoneId: 'private-yard-buffer',
        kind: 'private-property',
        requiredStatus: 'non-public',
        disclosureMode: 'non-public',
      }),
    ],
  });

  assert.equal(decision.status, 'non-public');
  assert.equal(decision.deliveryAllowed, true);
  assert.equal(decision.disclosureMode, 'non-public');
  assert.deepEqual(decision.matchedZoneIds, ['private-yard-buffer']);
  assert.ok(decision.requiredControls.includes('suppress-public-address-and-route'));
  assert.ok(decision.requiredControls.includes('carrier-only-access-or-owner-consent'));
});

test('school and disaster geofences require manual review and public-safety controls', () => {
  const decision = evaluateSafeGeofence({
    target,
    countryCode: 'AG',
    now,
    zones: [
      zone({
        zoneId: 'school-buffer',
        kind: 'school-buffer',
        requiredStatus: 'manual-review',
        disclosureMode: 'coarse-only',
      }),
      zone({
        zoneId: 'flood-zone',
        kind: 'disaster-zone',
        requiredStatus: 'manual-review',
        disclosureMode: 'coarse-only',
        timeWindow: {
          startsAt: '2026-07-01T00:00:00Z',
          endsAt: '2026-07-02T00:00:00Z',
        },
      }),
    ],
  });

  assert.equal(decision.status, 'manual-review');
  assert.equal(decision.deliveryAllowed, false);
  assert.deepEqual(new Set(decision.matchedZoneIds), new Set(['school-buffer', 'flood-zone']));
  assert.ok(decision.requiredControls.includes('school-zone-handoff-policy'));
  assert.ok(decision.requiredControls.includes('public-safety-restriction-check'));
});

test('military geofence can require ZK-only delivery proof before approval', () => {
  const restrictedZone = zone({
    zoneId: 'restricted-facility',
    kind: 'military-facility',
    requiredStatus: 'zk-proof-only',
    disclosureMode: 'proof-only',
    requiresZkPredicate: 'authorized_facility_delivery',
  });

  const withoutProof = evaluateSafeGeofence({
    target,
    countryCode: 'AG',
    now,
    zones: [restrictedZone],
  });
  assert.equal(withoutProof.status, 'zk-proof-only');
  assert.equal(withoutProof.deliveryAllowed, false);
  assert.ok(withoutProof.requiredControls.includes('require-zk-geofence-proof'));
  assert.ok(withoutProof.requiredControls.includes('block-until-geofence-proof-valid'));

  const withProof = evaluateSafeGeofence({
    target,
    countryCode: 'AG',
    now,
    zones: [restrictedZone],
    proofs: [
      {
        predicate: 'authorized_facility_delivery',
        verified: true,
        notRevoked: true,
        freshnessSeconds: 120,
        maxFreshnessSeconds: 300,
        scopeMatches: true,
      },
    ],
  });

  assert.equal(withProof.status, 'zk-proof-only');
  assert.equal(withProof.deliveryAllowed, true);
  assert.ok(!withProof.requiredControls.includes('block-until-geofence-proof-valid'));
});

test('unsafe geofence definitions are rejected and do not match targets', () => {
  const unsafe = zone({
    zoneId: 'unsafe-zone',
    publicSafe: false,
    containsRawAddress: true,
    containsPrecisePrivateBoundary: true,
    containsRecipientData: true,
  });

  const validation = validateSafeGeofenceZone(unsafe);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes('zone-must-be-public-safe'));
  assert.ok(validation.errors.includes('raw-address-not-allowed'));
  assert.ok(validation.errors.includes('precise-private-boundary-not-allowed'));
  assert.ok(validation.errors.includes('recipient-data-not-allowed'));

  const decision = evaluateSafeGeofence({
    target,
    countryCode: 'AG',
    now,
    zones: [unsafe],
  });
  assert.equal(decision.status, 'deliverable');
  assert.equal(decision.deliveryAllowed, true);
  assert.deepEqual(decision.matchedZoneIds, []);
  assert.ok(decision.warnings.some(warning => warning.includes('raw-address-not-allowed')));
});

test('safe geofence can downgrade an otherwise deliverable POI decision', () => {
  const base: PoiDeliverabilityDecision = {
    status: 'deliverable',
    agidCellId: target.agidCellId,
    route: [],
    routeTravelTimeMinutes: 0,
    routeReliability: 0.9,
    confidence: 0.9,
    evidence: ['poi-route-ok'],
    warnings: [],
  };

  const geofence = evaluateSafeGeofence({
    target,
    countryCode: 'AG',
    now,
    zones: [
      zone({
        zoneId: 'school-buffer',
        kind: 'school-buffer',
        requiredStatus: 'manual-review',
        disclosureMode: 'coarse-only',
      }),
    ],
  });
  const combined = applySafeGeofenceToPoiDecision(base, geofence);

  assert.equal(combined.status, 'manual-review');
  assert.equal(combined.safeGeofenceStatus, 'manual-review');
  assert.deepEqual(combined.safeGeofenceZoneIds, ['school-buffer']);
  assert.ok(combined.evidence.includes('poi-route-ok'));
  assert.ok(combined.warnings.includes('school-zone-handoff-policy'));
});
