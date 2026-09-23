import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluatePoiGraphDeliverability,
  findNearestPoiNodes,
  validatePoiDeliverabilityGraph,
  type PoiDeliverabilityGraph,
} from './poiDeliverabilityGraph';

const syntheticSource = {
  sourceId: 'synthetic-poi-fixture',
  licenseStatus: 'synthetic' as const,
};

const graph: PoiDeliverabilityGraph = {
  graphId: 'synthetic-no-postcode-island-poi-graph',
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
      serviceTags: ['entry', 'freight'],
      sourceRefs: [syntheticSource],
    },
    {
      id: 'poi:ag:depot-north',
      type: 'delivery_depot',
      name: 'North Depot',
      lat: 17.642,
      lon: -61.824,
      trustScore: 0.82,
      serviceTags: ['handoff', 'carrier'],
      sourceRefs: [syntheticSource],
    },
    {
      id: 'poi:ag:locker-market',
      type: 'locker',
      name: 'Market Locker',
      lat: 17.646,
      lon: -61.818,
      trustScore: 0.78,
      serviceTags: ['handoff', 'pickup'],
      sourceRefs: [syntheticSource],
    },
    {
      id: 'poi:ag:clinic',
      type: 'hospital',
      name: 'Island Clinic',
      lat: 17.649,
      lon: -61.814,
      trustScore: 0.73,
      serviceTags: ['public-service'],
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
    {
      from: 'poi:ag:locker-market',
      to: 'poi:ag:clinic',
      mode: 'walk',
      travelTimeMinutes: 5,
      reliability: 0.74,
      bidirectional: true,
      sourceRefs: [syntheticSource],
    },
  ],
};

test('validates a public POI graph without raw recipient addresses', () => {
  const validation = validatePoiDeliverabilityGraph(graph);

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
});

test('resolves weak-address deliverability from entry POI to AGID cell through route and handoff', () => {
  const decision = evaluatePoiGraphDeliverability(graph, {
    agidCellId: 'AGID-CELL-AG-BRB-0001',
    centroidLat: 17.6465,
    centroidLon: -61.8175,
    precision: 'neighborhood',
  }, {
    entryNodeTypes: ['port'],
    handoffNodeTypes: ['locker'],
    maxLastMileMeters: 2_500,
    maxTravelTimeMinutes: 90,
    minPathReliability: 0.45,
    minTrustedPoiScore: 0.55,
  });

  assert.equal(decision.status, 'deliverable');
  assert.equal(decision.entryPoiId, 'poi:ag:main-port');
  assert.equal(decision.handoffPoiId, 'poi:ag:locker-market');
  assert.equal(decision.nearestPoiId, 'poi:ag:locker-market');
  assert.ok(decision.lastMileMeters! < 100);
  assert.ok(decision.route.length >= 3);
  assert.ok(decision.evidence.includes('no-raw-address-required'));
  assert.ok(decision.confidence > 0.55);
});

test('flags cells with no nearby trusted POI for manual review', () => {
  const decision = evaluatePoiGraphDeliverability(graph, {
    agidCellId: 'AGID-CELL-AG-OFFSHORE-9999',
    centroidLat: 17.80,
    centroidLon: -61.60,
    precision: 'coarse',
  });

  assert.equal(decision.status, 'manual-review');
  assert.ok(decision.warnings.includes('last-mile-anchor-missing'));
  assert.equal(decision.route.length, 0);
});

test('nearest POI ranking is distance based and type filtered', () => {
  const [nearest] = findNearestPoiNodes(graph, {
    agidCellId: 'AGID-CELL-AG-BRB-0002',
    centroidLat: 17.649,
    centroidLon: -61.814,
    precision: 'facility',
  }, ['hospital', 'locker']);

  assert.equal(nearest.node.id, 'poi:ag:clinic');
});
