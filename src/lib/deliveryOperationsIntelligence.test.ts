import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildDeliveryOperationsDashboard,
  evaluateDriverWorkforce,
  optimizeDeliveryRoutes,
  summarizeDeliveryPerformance,
  type DeliveryDriverInput,
  type DeliveryStopInput,
} from './deliveryOperationsIntelligence';

const now = '2026-06-17T09:00:00.000Z';

function drivers(): DeliveryDriverInput[] {
  return [
    {
      driverId: 'DRV-COLD',
      displayName: 'Cold chain operator',
      status: 'active',
      skills: ['standard-parcel', 'cold-chain', 'nfc-pos-handoff'],
      assignedVehicleModes: ['van'],
      currentLocation: { lat: 35.6812, lng: 139.7671 },
      maxDutyMinutes: 480,
      workedMinutesToday: 60,
      rating: 4.8,
      highRiskEligible: true,
      license: {
        verified: true,
        licenseClass: 'commercial-light',
        expiresAt: '2027-06-17T00:00:00.000Z',
        verifiedAt: '2026-05-01T00:00:00.000Z',
        documentCommitment: 'lic:commitment:cold',
      },
    },
    {
      driverId: 'DRV-EXPIRED',
      displayName: 'Expired license driver',
      status: 'active',
      skills: ['standard-parcel'],
      assignedVehicleModes: ['car'],
      currentLocation: { lat: 35.6895, lng: 139.6917 },
      maxDutyMinutes: 480,
      workedMinutesToday: 30,
      license: {
        verified: true,
        expiresAt: '2025-01-01T00:00:00.000Z',
        documentCommitment: 'lic:commitment:expired',
      },
    },
    {
      driverId: 'DRV-LEAVE',
      displayName: 'Leave window driver',
      status: 'active',
      skills: ['standard-parcel', 'heavy-item'],
      assignedVehicleModes: ['truck'],
      currentLocation: { lat: 35.7, lng: 139.8 },
      maxDutyMinutes: 480,
      workedMinutesToday: 480,
      leaveWindows: [{ start: '2026-06-17T08:00:00.000Z', end: '2026-06-17T12:00:00.000Z' }],
      license: {
        verified: true,
        expiresAt: '2027-01-01T00:00:00.000Z',
        documentCommitment: 'lic:commitment:leave',
      },
    },
  ];
}

function stops(): DeliveryStopInput[] {
  return [
    {
      stopId: 'STOP-COLD',
      agid: 'ML01R1A0ZTR4',
      addressCommitment: 'addr:tokyo-cold',
      placeLabel: 'Cold parcel pickup',
      requiredSkills: ['cold-chain'],
      requiredVehicleModes: ['van'],
      serviceMinutes: 8,
      timeWindowEnd: '2026-06-17T10:00:00.000Z',
      priority: 5,
      coords: { lat: 35.684, lng: 139.774 },
      highRisk: true,
    },
    {
      stopId: 'STOP-STANDARD',
      addressCommitment: 'addr:tokyo-standard',
      placeLabel: 'Standard counter handoff',
      requiredSkills: ['standard-parcel'],
      serviceMinutes: 4,
      priority: 3,
      coords: { lat: 35.69, lng: 139.78 },
    },
  ];
}

test('workforce evaluation blocks expired licenses and active leave windows without storing raw documents', () => {
  const summary = evaluateDriverWorkforce({ drivers: drivers(), now });

  assert.equal(summary.totals.drivers, 3);
  assert.equal(summary.totals.available, 1);
  assert.equal(summary.totals.blocked, 2);
  assert.equal(summary.totals.activeLeave, 1);
  assert.equal(summary.drivers.find(driver => driver.driverId === 'DRV-EXPIRED')?.availability, 'license-blocked');
  assert.equal(summary.drivers.find(driver => driver.driverId === 'DRV-LEAVE')?.availability, 'leave');
  assert.equal(summary.privacy.rawDriverLicenseDocumentStored, false);
  assert.ok(summary.warnings.some(warning => warning.includes('license-expired')));
});

test('route optimization assigns cold-chain and POS handoff stops to the eligible driver', () => {
  const plan = optimizeDeliveryRoutes({
    drivers: drivers(),
    stops: stops(),
    now,
    objective: 'deadline-first',
    highRiskMode: true,
    traffic: [{ toStopId: 'STOP-COLD', condition: 'moderate', delayMinutes: 3 }],
  });

  assert.equal(plan.optimizationKind, 'deterministic-score-baseline');
  assert.equal(plan.routes.length, 1);
  assert.equal(plan.routes[0].driverId, 'DRV-COLD');
  assert.deepEqual(plan.routes[0].stops.map(stop => stop.stopId), ['STOP-COLD', 'STOP-STANDARD']);
  assert.equal(plan.unassignedStops.length, 0);
  assert.equal(plan.privacy.rawAddressStored, false);
  assert.equal(plan.privacy.rawAgidStored, false);
});

test('route optimization supports hotel, airport, golf course, and ski resort handoffs', () => {
  const plan = optimizeDeliveryRoutes({
    drivers: [
      {
        driverId: 'DRV-RESORT',
        displayName: 'Resort logistics driver',
        status: 'active',
        skills: [
          'standard-parcel',
          'hotel-front-desk',
          'airport-counter',
          'golf-bag-handling',
          'ski-equipment-handling',
          'snow-route',
          'heavy-item',
          'high-value',
          'nfc-pos-handoff',
        ],
        assignedVehicleModes: ['van'],
        currentLocation: { lat: 35.6812, lng: 139.7671 },
        maxDutyMinutes: 480,
        workedMinutesToday: 30,
        highRiskEligible: true,
        license: {
          verified: true,
          expiresAt: '2027-06-17T00:00:00.000Z',
        },
      },
    ],
    stops: [
      {
        stopId: 'STOP-HOTEL',
        placeLabel: 'Hotel guest luggage front desk',
        destinationKind: 'hotel',
        parcelKind: 'luggage',
        handoffPoint: 'front desk',
        coords: { lat: 35.684, lng: 139.77 },
      },
      {
        stopId: 'STOP-AIRPORT',
        placeLabel: 'Airport counter baggage handoff',
        destinationKind: 'airport',
        parcelKind: 'luggage',
        handoffPoint: 'airport counter',
        coords: { lat: 35.688, lng: 139.778 },
      },
      {
        stopId: 'STOP-GOLF',
        placeLabel: 'Golf course bag drop',
        destinationKind: 'golf-course',
        parcelKind: 'golf-bag',
        handoffPoint: 'bag drop',
        coords: { lat: 35.692, lng: 139.782 },
      },
      {
        stopId: 'STOP-SKI',
        placeLabel: 'Ski resort rental counter',
        destinationKind: 'ski-resort',
        parcelKind: 'ski-equipment',
        handoffPoint: 'rental counter',
        coords: { lat: 35.696, lng: 139.786 },
      },
    ],
    now,
    objective: 'risk-minimized',
  });

  assert.equal(plan.unassignedStops.length, 0);
  assert.deepEqual(plan.routes[0].stops.map(stop => stop.destinationKind), [
    'hotel',
    'airport',
    'golf-course',
    'ski-resort',
  ]);
  assert.ok(plan.routes[0].stops.find(stop => stop.stopId === 'STOP-GOLF')?.specialHandlingCodes.includes('golf-bag-long-item-handling'));
  assert.ok(plan.routes[0].stops.find(stop => stop.stopId === 'STOP-SKI')?.warnings.some(warning => warning.includes('seasonal-road-status-required')));
  assert.equal(plan.routes[0].stops.every(stop => stop.recipientProofRequired), true);
});

test('special delivery stops remain unassigned when dedicated resort and equipment skills are missing', () => {
  const plan = optimizeDeliveryRoutes({
    drivers: [
      {
        driverId: 'DRV-STANDARD',
        skills: ['standard-parcel'],
        assignedVehicleModes: ['van'],
        license: { verified: true, expiresAt: '2027-01-01T00:00:00.000Z' },
      },
    ],
    stops: [
      {
        stopId: 'STOP-GOLF',
        placeLabel: 'Golf course bag drop',
        destinationKind: 'golf-course',
        parcelKind: 'golf-bag',
      },
      {
        stopId: 'STOP-SKI',
        placeLabel: 'Ski resort rental counter',
        destinationKind: 'ski-resort',
        parcelKind: 'ski-equipment',
      },
    ],
    now,
  });

  assert.equal(plan.routes.length, 0);
  assert.equal(plan.unassignedStops.length, 2);
  assert.match(plan.unassignedStops.map(stop => stop.reasons.join(',')).join('\n'), /golf-bag-handling/);
  assert.match(plan.unassignedStops.map(stop => stop.reasons.join(',')).join('\n'), /ski-equipment-handling/);
});

test('route optimization leaves stops unassigned when skills, license, leave, and labor constraints fail', () => {
  const plan = optimizeDeliveryRoutes({
    drivers: [
      {
        driverId: 'DRV-NO-HAZMAT',
        skills: ['standard-parcel'],
        assignedVehicleModes: ['van'],
        maxDutyMinutes: 480,
        workedMinutesToday: 0,
        license: { verified: true, expiresAt: '2027-01-01T00:00:00.000Z' },
      },
    ],
    stops: [{
      stopId: 'STOP-HAZMAT',
      requiredSkills: ['hazmat'],
      requiredVehicleModes: ['truck'],
      coords: { lat: 35.68, lng: 139.76 },
    }],
    now,
  });

  assert.equal(plan.routes.length, 0);
  assert.equal(plan.unassignedStops.length, 1);
  assert.ok(plan.unassignedStops[0].reasons.some(reason => reason.includes('missing-skills')));
});

test('route optimization exposes real-time adjustment signals for heavy and blocked route evidence', () => {
  const plan = optimizeDeliveryRoutes({
    drivers: drivers().slice(0, 1),
    stops: stops().slice(0, 1),
    traffic: [{ toStopId: 'STOP-COLD', condition: 'heavy', delayMinutes: 20 }],
    now,
    objective: 'risk-minimized',
  });

  assert.equal(plan.routes[0].stops[0].trafficCondition, 'heavy');
  assert.ok(plan.routes[0].realtimeAdjustments.includes('recalculate-eta-and-notify-recipient'));
  assert.ok(plan.warnings.includes('real-time-adjustment-required'));
});

test('performance tracking computes completion, on-time, rating, and KPI by driver', () => {
  const summary = summarizeDeliveryPerformance({
    generatedAt: now,
    events: [
      {
        driverId: 'DRV-COLD',
        shipmentId: 'SHIP-1',
        status: 'completed',
        completedAt: '2026-06-17T09:20:00.000Z',
        onTimeDeadline: '2026-06-17T09:30:00.000Z',
        customerRating: 5,
      },
      {
        driverId: 'DRV-COLD',
        shipmentId: 'SHIP-2',
        status: 'completed',
        completedAt: '2026-06-17T10:05:00.000Z',
        onTimeDeadline: '2026-06-17T10:00:00.000Z',
        customerRating: 4,
      },
      {
        driverId: 'DRV-OTHER',
        shipmentId: 'SHIP-3',
        status: 'failed',
        exceptionCode: 'recipient-unavailable',
      },
    ],
  });

  assert.equal(summary.totals.events, 3);
  assert.equal(summary.totals.completed, 2);
  assert.equal(summary.totals.late, 1);
  assert.equal(summary.rates.completionRate, 0.667);
  assert.equal(summary.rates.onTimeRate, 0.5);
  assert.equal(summary.rates.averageCustomerRating, 4.5);
  assert.ok(summary.rates.kpiScore < 80);
  assert.ok(summary.recommendedActions.includes('review-failed-and-attempted-deliveries'));
});

test('dashboard combines workforce, route, and KPI posture with privacy boundary', () => {
  const dashboard = buildDeliveryOperationsDashboard({
    drivers: drivers(),
    stops: stops(),
    events: [
      {
        driverId: 'DRV-COLD',
        shipmentId: 'SHIP-OK',
        status: 'completed',
        completedAt: '2026-06-17T09:10:00.000Z',
        onTimeDeadline: '2026-06-17T09:20:00.000Z',
        customerRating: 5,
      },
    ],
    now,
  });

  assert.equal(dashboard.modelVersion, 'agid-delivery-operations-intelligence-v1');
  assert.equal(dashboard.workforce.totals.available, 1);
  assert.equal(dashboard.routes.routes.length, 1);
  assert.equal(dashboard.performance.rates.kpiScore, 100);
  assert.equal(dashboard.privacy.rawPreciseDriverTrajectoryPublic, false);
});
