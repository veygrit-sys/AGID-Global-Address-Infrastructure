export type PoiNodeType =
  | 'station'
  | 'port'
  | 'hotel'
  | 'school'
  | 'hospital'
  | 'store'
  | 'locker'
  | 'delivery_depot'
  | 'postal_office'
  | 'landmark';

export type PoiEdgeMode =
  | 'road'
  | 'walk'
  | 'rail'
  | 'ferry'
  | 'handoff'
  | 'cell-last-mile';

export type PoiSourceRef = {
  sourceId: string;
  url?: string;
  licenseStatus: 'synthetic' | 'open-review-required' | 'attribution-required' | 'approved' | 'restricted';
};

export type PoiGraphNode = {
  id: string;
  type: PoiNodeType;
  name: string;
  lat: number;
  lon: number;
  agidCellId?: string;
  serviceTags?: string[];
  trustScore?: number;
  sourceRefs: PoiSourceRef[];
};

export type PoiGraphEdge = {
  from: string;
  to: string;
  mode: PoiEdgeMode;
  travelTimeMinutes: number;
  reliability: number;
  distanceMeters?: number;
  bidirectional?: boolean;
  sourceRefs: PoiSourceRef[];
};

export type PoiDeliverabilityGraph = {
  graphId: string;
  countryCode: string;
  regionName: string;
  nodes: PoiGraphNode[];
  edges: PoiGraphEdge[];
};

export type PoiTargetCell = {
  agidCellId: string;
  centroidLat: number;
  centroidLon: number;
  precision: 'coarse' | 'settlement' | 'neighborhood' | 'facility';
};

export type PoiDeliverabilityPolicy = {
  entryNodeTypes: PoiNodeType[];
  handoffNodeTypes: PoiNodeType[];
  maxLastMileMeters: number;
  maxTravelTimeMinutes: number;
  minPathReliability: number;
  minTrustedPoiScore: number;
};

export type PoiRouteStep = {
  from: string;
  to: string;
  mode: PoiEdgeMode;
  travelTimeMinutes: number;
  reliability: number;
  distanceMeters?: number;
};

export type PoiDeliverabilityDecision = {
  status: 'deliverable' | 'manual-review' | 'not-deliverable';
  agidCellId: string;
  entryPoiId?: string;
  handoffPoiId?: string;
  nearestPoiId?: string;
  route: PoiRouteStep[];
  routeTravelTimeMinutes: number;
  routeReliability: number;
  lastMileMeters?: number;
  confidence: number;
  evidence: string[];
  warnings: string[];
};

export const DEFAULT_POI_DELIVERABILITY_POLICY: PoiDeliverabilityPolicy = {
  entryNodeTypes: ['port', 'station', 'delivery_depot', 'postal_office'],
  handoffNodeTypes: [
    'locker',
    'hotel',
    'store',
    'hospital',
    'school',
    'delivery_depot',
    'postal_office',
    'station',
    'port',
  ],
  maxLastMileMeters: 2_500,
  maxTravelTimeMinutes: 90,
  minPathReliability: 0.55,
  minTrustedPoiScore: 0.55,
};

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(value: number) {
  return value * Math.PI / 180;
}

export function distanceMeters(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function edgeCost(edge: PoiRouteStep) {
  const reliabilityPenalty = edge.reliability > 0 ? 1 / edge.reliability : 100;
  return edge.travelTimeMinutes * reliabilityPenalty;
}

function nodeTrust(node: PoiGraphNode | undefined) {
  return Math.max(0, Math.min(1, node?.trustScore ?? 0.5));
}

function sourceConfidence(sourceRefs: PoiSourceRef[]) {
  if (!sourceRefs.length) return 0;
  const scores = sourceRefs.map(source => {
    if (source.licenseStatus === 'approved') return 1;
    if (source.licenseStatus === 'attribution-required') return 0.85;
    if (source.licenseStatus === 'synthetic') return 0.65;
    if (source.licenseStatus === 'open-review-required') return 0.5;
    return 0.2;
  });
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function adjacencyFor(graph: PoiDeliverabilityGraph, extraEdges: PoiGraphEdge[] = []) {
  const adjacency = new Map<string, PoiRouteStep[]>();
  const allEdges = [...graph.edges, ...extraEdges];
  const add = (step: PoiRouteStep) => {
    adjacency.set(step.from, [...(adjacency.get(step.from) ?? []), step]);
  };

  for (const edge of allEdges) {
    add({
      from: edge.from,
      to: edge.to,
      mode: edge.mode,
      travelTimeMinutes: edge.travelTimeMinutes,
      reliability: edge.reliability,
      distanceMeters: edge.distanceMeters,
    });
    if (edge.bidirectional) {
      add({
        from: edge.to,
        to: edge.from,
        mode: edge.mode,
        travelTimeMinutes: edge.travelTimeMinutes,
        reliability: edge.reliability,
        distanceMeters: edge.distanceMeters,
      });
    }
  }

  return adjacency;
}

function shortestPath(
  graph: PoiDeliverabilityGraph,
  starts: string[],
  target: string,
  extraEdges: PoiGraphEdge[],
) {
  const adjacency = adjacencyFor(graph, extraEdges);
  const distances = new Map<string, number>();
  const previous = new Map<string, PoiRouteStep>();
  const unsettled = new Set<string>();

  for (const start of starts) {
    distances.set(start, 0);
    unsettled.add(start);
  }

  while (unsettled.size) {
    const current = [...unsettled].sort((a, b) => (distances.get(a) ?? Infinity) - (distances.get(b) ?? Infinity))[0];
    unsettled.delete(current);
    if (current === target) break;

    for (const edge of adjacency.get(current) ?? []) {
      const nextDistance = (distances.get(current) ?? Infinity) + edgeCost(edge);
      if (nextDistance < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, nextDistance);
        previous.set(edge.to, edge);
        unsettled.add(edge.to);
      }
    }
  }

  if (!distances.has(target)) return null;

  const route: PoiRouteStep[] = [];
  let cursor = target;
  while (previous.has(cursor)) {
    const edge = previous.get(cursor)!;
    route.unshift(edge);
    cursor = edge.from;
  }

  return { route, cost: distances.get(target)! };
}

export function validatePoiDeliverabilityGraph(graph: PoiDeliverabilityGraph) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const nodeIds = new Set<string>();

  if (!graph.graphId) errors.push('graphId-required');
  if (!graph.countryCode) errors.push('countryCode-required');

  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) errors.push(`duplicate-node:${node.id}`);
    nodeIds.add(node.id);
    if (!Number.isFinite(node.lat) || node.lat < -90 || node.lat > 90) errors.push(`invalid-node-lat:${node.id}`);
    if (!Number.isFinite(node.lon) || node.lon < -180 || node.lon > 180) errors.push(`invalid-node-lon:${node.id}`);
    if (!node.sourceRefs.length) warnings.push(`node-missing-source:${node.id}`);
    if (node.name.match(/\d{1,5}\s+\w+/i)) warnings.push(`node-name-looks-like-address:${node.id}`);
  }

  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.from)) errors.push(`edge-from-missing:${edge.from}`);
    if (!nodeIds.has(edge.to)) errors.push(`edge-to-missing:${edge.to}`);
    if (!Number.isFinite(edge.travelTimeMinutes) || edge.travelTimeMinutes <= 0) errors.push(`invalid-edge-time:${edge.from}->${edge.to}`);
    if (!Number.isFinite(edge.reliability) || edge.reliability < 0 || edge.reliability > 1) errors.push(`invalid-edge-reliability:${edge.from}->${edge.to}`);
    if (!edge.sourceRefs.length) warnings.push(`edge-missing-source:${edge.from}->${edge.to}`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function findNearestPoiNodes(
  graph: PoiDeliverabilityGraph,
  target: PoiTargetCell,
  nodeTypes: PoiNodeType[] = DEFAULT_POI_DELIVERABILITY_POLICY.handoffNodeTypes,
) {
  const typeSet = new Set(nodeTypes);
  return graph.nodes
    .filter(node => typeSet.has(node.type))
    .map(node => ({
      node,
      distanceMeters: distanceMeters(
        { lat: node.lat, lon: node.lon },
        { lat: target.centroidLat, lon: target.centroidLon },
      ),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export function evaluatePoiGraphDeliverability(
  graph: PoiDeliverabilityGraph,
  target: PoiTargetCell,
  policy: PoiDeliverabilityPolicy = DEFAULT_POI_DELIVERABILITY_POLICY,
): PoiDeliverabilityDecision {
  const validation = validatePoiDeliverabilityGraph(graph);
  if (!validation.valid) {
    return {
      status: 'not-deliverable',
      agidCellId: target.agidCellId,
      route: [],
      routeTravelTimeMinutes: 0,
      routeReliability: 0,
      confidence: 0,
      evidence: ['poi-graph-invalid'],
      warnings: validation.errors,
    };
  }

  const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
  const entryNodes = graph.nodes.filter(node => policy.entryNodeTypes.includes(node.type));
  const nearest = findNearestPoiNodes(graph, target, policy.handoffNodeTypes);
  const reachableHandoff = nearest.filter(item => (
    item.distanceMeters <= policy.maxLastMileMeters &&
    nodeTrust(item.node) >= policy.minTrustedPoiScore
  ));

  if (!entryNodes.length) {
    return {
      status: 'manual-review',
      agidCellId: target.agidCellId,
      nearestPoiId: nearest[0]?.node.id,
      route: [],
      routeTravelTimeMinutes: 0,
      routeReliability: 0,
      lastMileMeters: nearest[0]?.distanceMeters,
      confidence: 0.25,
      evidence: ['agid-cell-known', 'no-entry-poi'],
      warnings: ['no-entry-poi-for-region'],
    };
  }

  if (!reachableHandoff.length) {
    return {
      status: 'manual-review',
      agidCellId: target.agidCellId,
      nearestPoiId: nearest[0]?.node.id,
      route: [],
      routeTravelTimeMinutes: 0,
      routeReliability: 0,
      lastMileMeters: nearest[0]?.distanceMeters,
      confidence: 0.3,
      evidence: ['agid-cell-known', 'nearest-poi-too-far-or-untrusted'],
      warnings: ['last-mile-anchor-missing'],
    };
  }

  const targetNodeId = `target-cell:${target.agidCellId}`;
  const extraEdges: PoiGraphEdge[] = reachableHandoff.map(item => ({
    from: item.node.id,
    to: targetNodeId,
    mode: 'cell-last-mile',
    travelTimeMinutes: Math.max(1, item.distanceMeters / 700),
    reliability: Math.max(0.1, nodeTrust(item.node) * 0.9),
    distanceMeters: Math.round(item.distanceMeters),
    bidirectional: false,
    sourceRefs: item.node.sourceRefs,
  }));

  const path = shortestPath(
    graph,
    entryNodes.map(node => node.id),
    targetNodeId,
    extraEdges,
  );

  if (!path) {
    return {
      status: 'manual-review',
      agidCellId: target.agidCellId,
      nearestPoiId: reachableHandoff[0].node.id,
      route: [],
      routeTravelTimeMinutes: 0,
      routeReliability: 0,
      lastMileMeters: reachableHandoff[0].distanceMeters,
      confidence: 0.35,
      evidence: ['agid-cell-known', 'handoff-poi-nearby', 'route-missing'],
      warnings: ['route-from-entry-to-cell-missing'],
    };
  }

  const routeTravelTimeMinutes = path.route.reduce((sum, step) => sum + step.travelTimeMinutes, 0);
  const routeReliability = path.route.reduce((score, step) => score * step.reliability, 1);
  const firstRouteStep = path.route[0];
  const lastRouteStep = path.route[path.route.length - 1];
  const entryPoiId = firstRouteStep?.from;
  const handoffPoiId = lastRouteStep?.from;
  const handoffNode = nodeById.get(handoffPoiId);
  const lastMileMeters = lastRouteStep?.distanceMeters;
  const avgSourceConfidence = path.route.reduce((sum, step) => {
    const from = nodeById.get(step.from);
    const to = nodeById.get(step.to);
    return sum + sourceConfidence([...(from?.sourceRefs ?? []), ...(to?.sourceRefs ?? [])]);
  }, 0) / Math.max(1, path.route.length);

  const confidence = Math.max(0, Math.min(1, (
    routeReliability * 0.45 +
    nodeTrust(handoffNode) * 0.25 +
    avgSourceConfidence * 0.2 +
    (target.precision === 'facility' ? 0.1 : target.precision === 'neighborhood' ? 0.08 : 0.05)
  )));

  const warnings = [...validation.warnings];
  if (routeTravelTimeMinutes > policy.maxTravelTimeMinutes) warnings.push('route-time-exceeds-policy');
  if (routeReliability < policy.minPathReliability) warnings.push('route-reliability-below-policy');

  const status = warnings.includes('route-time-exceeds-policy') || warnings.includes('route-reliability-below-policy')
    ? 'manual-review'
    : 'deliverable';

  return {
    status,
    agidCellId: target.agidCellId,
    entryPoiId,
    handoffPoiId,
    nearestPoiId: reachableHandoff[0].node.id,
    route: path.route,
    routeTravelTimeMinutes,
    routeReliability,
    lastMileMeters,
    confidence,
    evidence: [
      'agid-cell-known',
      'entry-poi-linked',
      'handoff-poi-nearby',
      'route-found',
      'no-raw-address-required',
    ],
    warnings,
  };
}
