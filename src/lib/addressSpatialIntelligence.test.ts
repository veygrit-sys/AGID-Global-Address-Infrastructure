import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assignVoronoiFacilities,
  computeAddressCongestion,
  computeReputationScore,
  dbscanCluster,
  detectSpatialSignalAnomalies,
  kMeansCluster,
  mapMatchPoint,
  reachableWithin,
  recommendEdgeCache,
  shortestRoute,
  type RoutingGraph,
  type SpatialPoint,
  type VoronoiFacility,
} from './addressSpatialIntelligence';

const clusterPoints: SpatialPoint[] = [
  { id: 'north-1', lat: 17.642, lon: -61.824 },
  { id: 'north-2', lat: 17.643, lon: -61.823 },
  { id: 'south-1', lat: 17.612, lon: -61.85 },
  { id: 'south-2', lat: 17.613, lon: -61.849 },
];

test('k-means separates address points into stable spatial clusters', () => {
  const result = kMeansCluster(clusterPoints, 2, 10);

  assert.equal(result.algorithm, 'k-means');
  assert.equal(result.clusters.length, 2);
  assert.deepEqual(
    result.clusters.map(cluster => cluster.pointIds.length).sort(),
    [2, 2],
  );
  assert.ok(result.clusters.every(cluster => cluster.radiusMeters < 200));
});

test('DBSCAN groups dense address points and marks isolated outliers', () => {
  const result = dbscanCluster([
    ...clusterPoints.slice(0, 2),
    { id: 'remote', lat: 17.7, lon: -61.7 },
  ], 250, 2);

  assert.equal(result.algorithm, 'dbscan');
  assert.equal(result.clusters.length, 1);
  assert.deepEqual(result.clusters[0].pointIds.sort(), ['north-1', 'north-2']);
  assert.deepEqual(result.outlierIds, ['remote']);
});

test('Voronoi assignment maps cells to nearest depot/post office/locker', () => {
  const cells: SpatialPoint[] = [
    { id: 'cell-north', lat: 17.6425, lon: -61.8235 },
    { id: 'cell-south', lat: 17.6125, lon: -61.8495 },
  ];
  const facilities: VoronoiFacility[] = [
    { id: 'depot-north', facilityType: 'delivery_depot', lat: 17.642, lon: -61.824 },
    { id: 'locker-south', facilityType: 'locker', lat: 17.613, lon: -61.849 },
  ];

  const assignments = assignVoronoiFacilities(cells, facilities);

  assert.equal(assignments.find(item => item.cellId === 'cell-north')?.facilityId, 'depot-north');
  assert.equal(assignments.find(item => item.cellId === 'cell-south')?.facilityId, 'locker-south');
  assert.ok(assignments.every(item => item.loadShare === 0.5));
});

test('graph search returns shortest reachable delivery route', () => {
  const graph: RoutingGraph = {
    nodes: [
      { id: 'port', lat: 17.638, lon: -61.831 },
      { id: 'depot', lat: 17.642, lon: -61.824 },
      { id: 'locker', lat: 17.646, lon: -61.818 },
      { id: 'remote', lat: 17.7, lon: -61.7 },
    ],
    edges: [
      { from: 'port', to: 'depot', costMinutes: 9, reliability: 0.9, bidirectional: true },
      { from: 'depot', to: 'locker', costMinutes: 7, reliability: 0.8, bidirectional: true },
      { from: 'port', to: 'locker', costMinutes: 40, reliability: 0.5, bidirectional: true },
    ],
  };

  const route = shortestRoute(graph, 'port', 'locker');
  assert.equal(route.reachable, true);
  assert.deepEqual(route.path, ['port', 'depot', 'locker']);
  assert.ok(route.reliability < 1 && route.reliability > 0.7);
  assert.deepEqual(new Set(reachableWithin(graph, 'port', 25)), new Set(['port', 'depot', 'locker']));
});

test('map matching snaps noisy GPS point to nearest public-safe candidate', () => {
  const match = mapMatchPoint(
    { id: 'gps-1', lat: 17.6422, lon: -61.8241 },
    [
      { id: 'road-1', candidateType: 'road', lat: 17.6421, lon: -61.824, sourceConfidence: 0.9 },
      { id: 'building-1', candidateType: 'building', lat: 17.65, lon: -61.82, sourceConfidence: 0.7 },
    ],
    100,
  );

  assert.equal(match.status, 'matched');
  assert.equal(match.candidateId, 'road-1');
  assert.ok((match.distanceMeters ?? 999) < 30);
  assert.ok(match.confidence > 0.7);
});

test('spatial anomaly detection flags impossible travel and device mismatch', () => {
  const anomalies = detectSpatialSignalAnomalies([
    {
      id: 's1',
      sampleId: 's1',
      observedAt: '2026-07-01T00:00:00Z',
      lat: 35.681236,
      lon: 139.767125,
      deviceId: 'device-a',
      signedDeviceId: 'device-a',
      credentialDeviceId: 'device-a',
    },
    {
      id: 's2',
      sampleId: 's2',
      observedAt: '2026-07-01T00:01:00Z',
      lat: 34.702485,
      lon: 135.495951,
      deviceId: 'device-a',
      signedDeviceId: 'device-b',
      credentialDeviceId: 'device-a',
    },
  ], 70);

  assert.ok(anomalies.some(item => item.kind === 'impossible-travel'));
  assert.ok(anomalies.some(item => item.kind === 'device-mismatch'));
});

test('reputation, edge cache, and congestion models produce operational decisions', () => {
  const reputation = computeReputationScore({
    sourceConfidence: 0.9,
    contributorTrust: 0.8,
    communityConfirmations: 8,
    disputes: 0,
    successfulReachabilityChecks: 12,
    failedReachabilityChecks: 1,
  });
  assert.ok(reputation >= 80);

  const cache = recommendEdgeCache({
    regionId: 'agid:ag:barbuda',
    requestRatePerMinute: 1_000,
    updateRatePerHour: 1,
    dataSensitivity: 'public',
    cacheHitRate: 0.25,
    originLatencyMs: 1_200,
  });
  assert.equal(cache.placement, 'edge-hot');
  assert.ok(cache.ttlSeconds > 0);

  const congestion = computeAddressCongestion({
    requestRatePerMinute: 1_500,
    serviceCapacityPerMinute: 1_000,
    queueLength: 700,
    p95LatencyMs: 1_400,
    cacheHitRate: 0.4,
  });
  assert.equal(congestion.state, 'overloaded');
  assert.equal(congestion.queuePriority, 'shed-low-priority');
  assert.ok(congestion.rateLimitPerMinute < 1_000);
});
