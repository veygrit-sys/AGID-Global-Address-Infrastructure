import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluatePoiGraphDeliverabilityWithGeographicEvents,
  filterActiveSafeGeographicEvents,
  isGeographicEventActive,
  validateGeographicTemporalEvent,
  type GeographicTemporalEvent,
} from './geographicTemporalEvents';
import type { PoiDeliverabilityGraph } from './poiDeliverabilityGraph';

const now = new Date('2026-07-01T12:00:00Z');

const syntheticSource = {
  sourceId: 'synthetic-temporal-event-fixture',
  licenseStatus: 'synthetic' as const,
};

const graph: PoiDeliverabilityGraph = {
  graphId: 'synthetic-temporal-poi-graph',
  countryCode: 'AG',
  regionName: 'Synthetic No Postcode Island',
  nodes: [
    {
      id: 'poi:ag:main-port',
      type: 'port',
      name: 'Main Port',
      lat: 17.638,
      lon: -61.831,
      trustScore: 0.86,
      sourceRefs: [syntheticSource],
    },
    {
      id: 'poi:ag:depot-north',
      type: 'delivery_depot',
      name: 'North Depot',
      lat: 17.642,
      lon: -61.824,
      trustScore: 0.82,
      sourceRefs: [syntheticSource],
    },
    {
      id: 'poi:ag:locker-market',
      type: 'locker',
      name: 'Market Locker',
      lat: 17.646,
      lon: -61.818,
      trustScore: 0.78,
      sourceRefs: [syntheticSource],
    },
  ],
  edges: [
    {
      from: 'poi:ag:main-port',
      to: 'poi:ag:depot-north',
      mode: 'road',
      travelTimeMinutes: 9,
      reliability: 0.86,
      bidirectional: true,
      sourceRefs: [syntheticSource],
    },
    {
      from: 'poi:ag:depot-north',
      to: 'poi:ag:locker-market',
      mode: 'road',
      travelTimeMinutes: 7,
      reliability: 0.82,
      bidirectional: true,
      sourceRefs: [syntheticSource],
    },
  ],
};

function event(overrides: Partial<GeographicTemporalEvent>): GeographicTemporalEvent {
  return {
    eventId: 'evt-default',
    kind: 'congestion',
    severity: 'major',
    title: 'Temporary congestion',
    sourceClass: 'municipality',
    sourceConfidence: 0.82,
    scope: {
      countryCode: 'AG',
      agidCellPrefixes: ['AGID-CELL-AG-BRB'],
    },
    timeWindow: {
      startsAt: '2026-07-01T10:00:00Z',
      endsAt: '2026-07-01T14:00:00Z',
    },
    effect: {
      travelTimeMultiplier: 1.5,
      reliabilityMultiplier: 0.85,
      confidencePenalty: 0.05,
    },
    publicSafe: true,
    ...overrides,
  };
}

const target = {
  agidCellId: 'AGID-CELL-AG-BRB-0001',
  centroidLat: 17.6465,
  centroidLon: -61.8175,
  precision: 'neighborhood' as const,
};

const policy = {
  entryNodeTypes: ['port' as const],
  handoffNodeTypes: ['locker' as const],
  maxLastMileMeters: 2_500,
  maxTravelTimeMinutes: 25,
  minPathReliability: 0.4,
  minTrustedPoiScore: 0.55,
};

test('active congestion turns static deliverability into time-bounded manual review', () => {
  const decision = evaluatePoiGraphDeliverabilityWithGeographicEvents(graph, target, [
    event({
      eventId: 'evt-market-day-congestion',
      effect: {
        travelTimeMultiplier: 3,
        reliabilityMultiplier: 0.8,
        confidencePenalty: 0.08,
      },
    }),
  ], { now, policy });

  assert.equal(decision.status, 'manual-review');
  assert.equal(decision.temporalState, 'restricted');
  assert.ok(decision.activeEventIds.includes('evt-market-day-congestion'));
  assert.ok(decision.eventWarnings.includes('event-congestion:evt-market-day-congestion'));
  assert.ok(decision.evidence.includes('time-bounded-geographic-event-layer'));
});

test('cell-scoped public event can force manual review without raw address data', () => {
  const decision = evaluatePoiGraphDeliverabilityWithGeographicEvents(graph, target, [
    event({
      eventId: 'evt-stadium-festival',
      kind: 'public-event',
      title: 'Festival access control',
      effect: {
        deliveryRestriction: 'manual-review',
        confidencePenalty: 0.12,
      },
    }),
  ], { now, policy });

  assert.equal(decision.status, 'manual-review');
  assert.equal(decision.temporalState, 'manual-review');
  assert.ok(decision.warnings.includes('event-requires-manual-review:evt-stadium-festival'));
  assert.doesNotMatch(JSON.stringify(decision), /rawAddress|recipient/i);
});

test('disaster restriction can temporarily block delivery for a target AGID cell', () => {
  const decision = evaluatePoiGraphDeliverabilityWithGeographicEvents(graph, target, [
    event({
      eventId: 'evt-flood-block',
      kind: 'disaster',
      severity: 'blocker',
      sourceClass: 'public-safety',
      sourceConfidence: 0.95,
      effect: {
        deliveryRestriction: 'not-deliverable',
        confidencePenalty: 0.4,
      },
    }),
  ], { now, policy });

  assert.equal(decision.status, 'not-deliverable');
  assert.equal(decision.temporalState, 'blocked');
  assert.ok(decision.warnings.includes('event-blocks-delivery:evt-flood-block'));
});

test('expired and unsafe events are ignored by the active safe event filter', () => {
  const expired = event({
    eventId: 'evt-expired',
    timeWindow: {
      startsAt: '2026-06-01T10:00:00Z',
      endsAt: '2026-06-01T14:00:00Z',
    },
  });
  const unsafe = event({
    eventId: 'evt-unsafe',
    containsRawAddress: true,
  });

  assert.equal(isGeographicEventActive(expired, now), false);
  assert.equal(validateGeographicTemporalEvent(unsafe).valid, false);
  assert.deepEqual(filterActiveSafeGeographicEvents([expired, unsafe], graph, target, now), []);
});
