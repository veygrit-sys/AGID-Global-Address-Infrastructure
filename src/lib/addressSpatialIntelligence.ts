import { distanceMeters } from './poiDeliverabilityGraph';

export type SpatialPoint = {
  id: string;
  lat: number;
  lon: number;
  weight?: number;
};

export type SpatialCluster = {
  clusterId: string;
  pointIds: string[];
  centroidLat: number;
  centroidLon: number;
  radiusMeters: number;
  density: number;
};

export type SpatialClusterResult = {
  algorithm: 'k-means' | 'dbscan' | 'density';
  clusters: SpatialCluster[];
  outlierIds: string[];
};

export type VoronoiFacility = SpatialPoint & {
  facilityType: 'delivery_depot' | 'post_office' | 'locker' | 'port' | 'station' | 'handoff';
  capacity?: number;
  trustScore?: number;
};

export type VoronoiAssignment = {
  cellId: string;
  facilityId: string;
  facilityType: VoronoiFacility['facilityType'];
  distanceMeters: number;
  loadShare: number;
};

export type RoutingNode = SpatialPoint;

export type RoutingEdge = {
  from: string;
  to: string;
  costMinutes: number;
  reliability: number;
  bidirectional?: boolean;
};

export type RoutingGraph = {
  nodes: RoutingNode[];
  edges: RoutingEdge[];
};

export type RouteResult = {
  reachable: boolean;
  path: string[];
  costMinutes: number;
  reliability: number;
};

export type MapMatchCandidate = SpatialPoint & {
  candidateType: 'road' | 'building' | 'facility' | 'poi';
  sourceConfidence: number;
};

export type MapMatchResult = {
  status: 'matched' | 'manual-review' | 'unmatched';
  pointId: string;
  candidateId?: string;
  candidateType?: MapMatchCandidate['candidateType'];
  distanceMeters?: number;
  confidence: number;
  warnings: string[];
};

export type SpatialSignalSample = SpatialPoint & {
  sampleId: string;
  observedAt: string;
  deviceId?: string;
  signedDeviceId?: string;
  credentialDeviceId?: string;
};

export type SpatialAnomaly = {
  kind: 'impossible-travel' | 'speed-anomaly' | 'device-mismatch';
  severity: 'medium' | 'high' | 'critical';
  evidenceRefs: string[];
  reason: string;
};

export type ReputationInput = {
  sourceConfidence: number;
  contributorTrust: number;
  communityConfirmations: number;
  disputes: number;
  successfulReachabilityChecks: number;
  failedReachabilityChecks: number;
};

export type CacheRegionInput = {
  regionId: string;
  requestRatePerMinute: number;
  updateRatePerHour: number;
  dataSensitivity: 'public' | 'coarse' | 'restricted';
  cacheHitRate: number;
  originLatencyMs: number;
};

export type CacheRecommendation = {
  regionId: string;
  placement: 'edge-hot' | 'regional-cache' | 'origin-only';
  ttlSeconds: number;
  priorityScore: number;
  reason: string[];
};

export type CongestionInput = {
  requestRatePerMinute: number;
  serviceCapacityPerMinute: number;
  queueLength: number;
  p95LatencyMs: number;
  cacheHitRate: number;
};

export type CongestionDecision = {
  addressCongestionIndex: number;
  state: 'normal' | 'busy' | 'congested' | 'overloaded';
  rateLimitPerMinute: number;
  queuePriority: 'normal' | 'prefer-verified' | 'shed-low-priority';
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function weightedMean(points: SpatialPoint[], selector: (point: SpatialPoint) => number) {
  const totalWeight = points.reduce((sum, point) => sum + (point.weight ?? 1), 0);
  if (totalWeight <= 0) return selector(points[0]);
  return points.reduce((sum, point) => sum + selector(point) * (point.weight ?? 1), 0) / totalWeight;
}

function radiusFor(points: SpatialPoint[], centroid: SpatialPoint) {
  if (!points.length) return 0;
  return Math.max(...points.map(point => distanceMeters(point, centroid)));
}

function clusterFromPoints(clusterId: string, points: SpatialPoint[]): SpatialCluster {
  const centroid = {
    id: clusterId,
    lat: weightedMean(points, point => point.lat),
    lon: weightedMean(points, point => point.lon),
  };
  const radiusMeters = radiusFor(points, centroid);
  const area = Math.PI * Math.max(radiusMeters, 1) ** 2;
  return {
    clusterId,
    pointIds: points.map(point => point.id),
    centroidLat: centroid.lat,
    centroidLon: centroid.lon,
    radiusMeters,
    density: points.length / area,
  };
}

export function kMeansCluster(points: SpatialPoint[], k: number, iterations = 8): SpatialClusterResult {
  if (!points.length || k <= 0) return { algorithm: 'k-means', clusters: [], outlierIds: [] };
  const sorted = [...points].sort((a, b) => a.id.localeCompare(b.id));
  let centroids = sorted.slice(0, Math.min(k, sorted.length)).map(point => ({ ...point }));
  let assignments = new Map<string, number>();

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    assignments = new Map();
    for (const point of sorted) {
      const nearestIndex = centroids
        .map((centroid, index) => ({ index, distance: distanceMeters(point, centroid) }))
        .sort((a, b) => a.distance - b.distance)[0].index;
      assignments.set(point.id, nearestIndex);
    }

    centroids = centroids.map((centroid, index) => {
      const members = sorted.filter(point => assignments.get(point.id) === index);
      if (!members.length) return centroid;
      return {
        id: `centroid-${index + 1}`,
        lat: weightedMean(members, point => point.lat),
        lon: weightedMean(members, point => point.lon),
      };
    });
  }

  const clusters = centroids.map((_, index) => {
    const members = sorted.filter(point => assignments.get(point.id) === index);
    return members.length ? clusterFromPoints(`kmeans-${index + 1}`, members) : null;
  }).filter((cluster): cluster is SpatialCluster => Boolean(cluster));

  return { algorithm: 'k-means', clusters, outlierIds: [] };
}

export function dbscanCluster(points: SpatialPoint[], epsilonMeters: number, minPoints: number): SpatialClusterResult {
  const visited = new Set<string>();
  const clustered = new Set<string>();
  const outlierIds = new Set<string>();
  const clusters: SpatialCluster[] = [];

  const neighbors = (point: SpatialPoint) => points.filter(candidate => (
    distanceMeters(point, candidate) <= epsilonMeters
  ));

  for (const point of points) {
    if (visited.has(point.id)) continue;
    visited.add(point.id);
    const seed = neighbors(point);
    if (seed.length < minPoints) {
      outlierIds.add(point.id);
      continue;
    }

    const members = new Map<string, SpatialPoint>();
    const queue = [...seed];
    while (queue.length) {
      const current = queue.shift()!;
      members.set(current.id, current);
      clustered.add(current.id);
      outlierIds.delete(current.id);
      if (!visited.has(current.id)) {
        visited.add(current.id);
        const expanded = neighbors(current);
        if (expanded.length >= minPoints) {
          for (const candidate of expanded) {
            if (!members.has(candidate.id)) queue.push(candidate);
          }
        }
      }
    }
    clusters.push(clusterFromPoints(`dbscan-${clusters.length + 1}`, [...members.values()]));
  }

  for (const point of points) {
    if (!clustered.has(point.id) && !outlierIds.has(point.id)) outlierIds.add(point.id);
  }

  return { algorithm: 'dbscan', clusters, outlierIds: [...outlierIds] };
}

export function densityCluster(points: SpatialPoint[], radiusMeters: number, minPoints: number): SpatialClusterResult {
  const result = dbscanCluster(points, radiusMeters, minPoints);
  return { ...result, algorithm: 'density' };
}

export function assignVoronoiFacilities(cells: SpatialPoint[], facilities: VoronoiFacility[]): VoronoiAssignment[] {
  const assignmentCounts = new Map<string, number>();
  const assignments = cells.map(cell => {
    const nearest = facilities
      .map(facility => ({ facility, distance: distanceMeters(cell, facility) }))
      .sort((a, b) => a.distance - b.distance)[0];
    assignmentCounts.set(nearest.facility.id, (assignmentCounts.get(nearest.facility.id) ?? 0) + 1);
    return {
      cellId: cell.id,
      facilityId: nearest.facility.id,
      facilityType: nearest.facility.facilityType,
      distanceMeters: nearest.distance,
      loadShare: 0,
    };
  });

  return assignments.map(assignment => ({
    ...assignment,
    loadShare: (assignmentCounts.get(assignment.facilityId) ?? 0) / Math.max(cells.length, 1),
  }));
}

function adjacencyFor(graph: RoutingGraph) {
  const adjacency = new Map<string, RoutingEdge[]>();
  const add = (edge: RoutingEdge) => {
    adjacency.set(edge.from, [...(adjacency.get(edge.from) ?? []), edge]);
  };
  for (const edge of graph.edges) {
    add(edge);
    if (edge.bidirectional) {
      add({ ...edge, from: edge.to, to: edge.from });
    }
  }
  return adjacency;
}

export function shortestRoute(graph: RoutingGraph, startId: string, targetId: string): RouteResult {
  const adjacency = adjacencyFor(graph);
  const distances = new Map<string, number>([[startId, 0]]);
  const reliability = new Map<string, number>([[startId, 1]]);
  const previous = new Map<string, string>();
  const unsettled = new Set<string>([startId]);

  while (unsettled.size) {
    const current = [...unsettled].sort((a, b) => (distances.get(a) ?? Infinity) - (distances.get(b) ?? Infinity))[0];
    unsettled.delete(current);
    if (current === targetId) break;

    for (const edge of adjacency.get(current) ?? []) {
      const edgeCost = edge.costMinutes / Math.max(edge.reliability, 0.01);
      const nextDistance = (distances.get(current) ?? Infinity) + edgeCost;
      if (nextDistance < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, nextDistance);
        reliability.set(edge.to, (reliability.get(current) ?? 1) * clamp(edge.reliability));
        previous.set(edge.to, current);
        unsettled.add(edge.to);
      }
    }
  }

  if (!distances.has(targetId)) {
    return { reachable: false, path: [], costMinutes: Infinity, reliability: 0 };
  }

  const path = [targetId];
  let cursor = targetId;
  while (previous.has(cursor)) {
    cursor = previous.get(cursor)!;
    path.unshift(cursor);
  }

  return {
    reachable: true,
    path,
    costMinutes: distances.get(targetId)!,
    reliability: reliability.get(targetId) ?? 0,
  };
}

export function reachableWithin(graph: RoutingGraph, startId: string, maxCostMinutes: number) {
  return graph.nodes
    .map(node => ({ nodeId: node.id, route: shortestRoute(graph, startId, node.id) }))
    .filter(item => item.route.reachable && item.route.costMinutes <= maxCostMinutes)
    .map(item => item.nodeId);
}

export function mapMatchPoint(point: SpatialPoint, candidates: MapMatchCandidate[], maxSnapMeters: number): MapMatchResult {
  if (!candidates.length) {
    return { status: 'unmatched', pointId: point.id, confidence: 0, warnings: ['no-candidates'] };
  }
  const nearest = candidates
    .map(candidate => ({ candidate, distance: distanceMeters(point, candidate) }))
    .sort((a, b) => a.distance - b.distance)[0];
  if (nearest.distance > maxSnapMeters) {
    return {
      status: 'unmatched',
      pointId: point.id,
      distanceMeters: nearest.distance,
      confidence: 0,
      warnings: ['nearest-candidate-outside-snap-threshold'],
    };
  }
  const distanceConfidence = 1 - nearest.distance / Math.max(maxSnapMeters, 1);
  const confidence = clamp(distanceConfidence * nearest.candidate.sourceConfidence);
  return {
    status: confidence >= 0.5 ? 'matched' : 'manual-review',
    pointId: point.id,
    candidateId: nearest.candidate.id,
    candidateType: nearest.candidate.candidateType,
    distanceMeters: nearest.distance,
    confidence,
    warnings: confidence >= 0.5 ? [] : ['low-map-match-confidence'],
  };
}

export function detectSpatialSignalAnomalies(samples: SpatialSignalSample[], maxSpeedMetersPerSecond: number): SpatialAnomaly[] {
  const anomalies: SpatialAnomaly[] = [];
  const sorted = [...samples].sort((a, b) => String(a.observedAt).localeCompare(String(b.observedAt)));

  for (const sample of sorted) {
    if (sample.signedDeviceId && sample.deviceId && sample.signedDeviceId !== sample.deviceId) {
      anomalies.push({
        kind: 'device-mismatch',
        severity: 'critical',
        evidenceRefs: [sample.sampleId],
        reason: 'signed-device-id-does-not-match-observed-device',
      });
    }
    if (sample.credentialDeviceId && sample.deviceId && sample.credentialDeviceId !== sample.deviceId) {
      anomalies.push({
        kind: 'device-mismatch',
        severity: 'critical',
        evidenceRefs: [sample.sampleId],
        reason: 'credential-bound-device-does-not-match-observed-device',
      });
    }
  }

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    const deltaSeconds = Math.abs(Date.parse(current.observedAt) - Date.parse(previous.observedAt)) / 1_000;
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) continue;
    const speed = distanceMeters(previous, current) / deltaSeconds;
    if (speed > maxSpeedMetersPerSecond) {
      anomalies.push({
        kind: speed > maxSpeedMetersPerSecond * 3 ? 'impossible-travel' : 'speed-anomaly',
        severity: speed > maxSpeedMetersPerSecond * 3 ? 'critical' : 'high',
        evidenceRefs: [previous.sampleId, current.sampleId],
        reason: `movement-speed:${Math.round(speed)}mps`,
      });
    }
  }

  return anomalies;
}

export function computeReputationScore(input: ReputationInput) {
  const confirmationScore = clamp(input.communityConfirmations / 10);
  const disputePenalty = clamp(input.disputes / 5);
  const reachabilityTotal = input.successfulReachabilityChecks + input.failedReachabilityChecks;
  const reachabilityScore = reachabilityTotal > 0
    ? input.successfulReachabilityChecks / reachabilityTotal
    : 0.5;
  return Math.round(100 * clamp(
    input.sourceConfidence * 0.3 +
    input.contributorTrust * 0.25 +
    confirmationScore * 0.2 +
    reachabilityScore * 0.2 -
    disputePenalty * 0.25,
  ));
}

export function recommendEdgeCache(input: CacheRegionInput): CacheRecommendation {
  const demand = clamp(input.requestRatePerMinute / 1_000);
  const latency = clamp(input.originLatencyMs / 1_500);
  const updatePenalty = clamp(input.updateRatePerHour / 24);
  const sensitivityPenalty = input.dataSensitivity === 'restricted' ? 0.4 : input.dataSensitivity === 'coarse' ? 0.15 : 0;
  const missRate = 1 - clamp(input.cacheHitRate);
  const priorityScore = Math.round(100 * clamp(demand * 0.35 + latency * 0.25 + missRate * 0.25 - updatePenalty * 0.2 - sensitivityPenalty));
  const placement = priorityScore >= 65 ? 'edge-hot' : priorityScore >= 30 ? 'regional-cache' : 'origin-only';
  const ttlSeconds = placement === 'origin-only'
    ? 0
    : Math.max(60, Math.round((input.dataSensitivity === 'public' ? 3600 : 900) * (1 - updatePenalty)));

  const reason = [
    `demand:${Math.round(demand * 100)}`,
    `latency:${Math.round(latency * 100)}`,
    `miss-rate:${Math.round(missRate * 100)}`,
    `update-penalty:${Math.round(updatePenalty * 100)}`,
    `sensitivity:${input.dataSensitivity}`,
  ];

  return { regionId: input.regionId, placement, ttlSeconds, priorityScore, reason };
}

export function computeAddressCongestion(input: CongestionInput): CongestionDecision {
  const utilization = input.serviceCapacityPerMinute > 0
    ? input.requestRatePerMinute / input.serviceCapacityPerMinute
    : 1;
  const queuePressure = clamp(input.queueLength / 1_000);
  const latencyPressure = clamp(input.p95LatencyMs / 2_000);
  const cachePenalty = 1 - clamp(input.cacheHitRate);
  const addressCongestionIndex = Math.round(100 * clamp(
    utilization * 0.45 +
    queuePressure * 0.25 +
    latencyPressure * 0.2 +
    cachePenalty * 0.1,
  ));

  const state = addressCongestionIndex >= 85
    ? 'overloaded'
    : addressCongestionIndex >= 65
      ? 'congested'
      : addressCongestionIndex >= 35
        ? 'busy'
        : 'normal';
  const rateLimitPerMinute = state === 'overloaded'
    ? Math.max(1, Math.floor(input.serviceCapacityPerMinute * 0.55))
    : state === 'congested'
      ? Math.max(1, Math.floor(input.serviceCapacityPerMinute * 0.75))
      : input.serviceCapacityPerMinute;
  const queuePriority = state === 'overloaded'
    ? 'shed-low-priority'
    : state === 'congested'
      ? 'prefer-verified'
      : 'normal';

  return { addressCongestionIndex, state, rateLimitPerMinute, queuePriority };
}
