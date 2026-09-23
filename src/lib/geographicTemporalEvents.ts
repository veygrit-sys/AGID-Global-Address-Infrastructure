import {
  evaluatePoiGraphDeliverability,
  type PoiDeliverabilityDecision,
  type PoiDeliverabilityGraph,
  type PoiDeliverabilityPolicy,
  type PoiGraphEdge,
  type PoiGraphNode,
  type PoiTargetCell,
} from './poiDeliverabilityGraph';

export type GeographicEventKind =
  | 'congestion'
  | 'road-closure'
  | 'ferry-suspended'
  | 'disaster'
  | 'public-event'
  | 'weather'
  | 'security-restriction'
  | 'service-outage'
  | 'manual-review-zone';

export type GeographicEventSeverity = 'info' | 'minor' | 'major' | 'blocker';

export type GeographicEventSourceClass =
  | 'carrier'
  | 'municipality'
  | 'weather-service'
  | 'public-safety'
  | 'community'
  | 'ngo'
  | 'system';

export type GeographicEventScope = {
  countryCode?: string;
  regionCode?: string;
  agidCellIds?: string[];
  agidCellPrefixes?: string[];
  affectedPoiIds?: string[];
  affectedEdgeIds?: string[];
};

export type GeographicEventTimeWindow = {
  startsAt: string;
  endsAt: string;
  observedAt?: string;
};

export type GeographicEventEffect = {
  travelTimeMultiplier?: number;
  reliabilityMultiplier?: number;
  blockedEdgeIds?: string[];
  blockedPoiIds?: string[];
  deliveryRestriction?: 'none' | 'manual-review' | 'not-deliverable';
  confidencePenalty?: number;
};

export type GeographicTemporalEvent = {
  eventId: string;
  kind: GeographicEventKind;
  severity: GeographicEventSeverity;
  title: string;
  sourceClass: GeographicEventSourceClass;
  sourceConfidence: number;
  scope: GeographicEventScope;
  timeWindow: GeographicEventTimeWindow;
  effect: GeographicEventEffect;
  publicSafe: boolean;
  containsRawAddress?: boolean;
  containsPreciseCoordinates?: boolean;
  containsRecipientData?: boolean;
  containsPrivateRoute?: boolean;
};

export type GeographicTemporalEventValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type TemporalDeliverabilityDecision = PoiDeliverabilityDecision & {
  temporalState: 'normal' | 'congested' | 'restricted' | 'blocked' | 'manual-review';
  activeEventIds: string[];
  eventEvidence: string[];
  eventWarnings: string[];
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function parseTime(value: string) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function normalizedCountry(value: unknown) {
  return String(value ?? '').trim().toUpperCase();
}

function edgeId(edge: Pick<PoiGraphEdge, 'from' | 'to'>) {
  return `${edge.from}->${edge.to}`;
}

function reverseEdgeId(edge: Pick<PoiGraphEdge, 'from' | 'to'>) {
  return `${edge.to}->${edge.from}`;
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function validateGeographicTemporalEvent(event: GeographicTemporalEvent): GeographicTemporalEventValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!event.eventId) errors.push('event-id-required');
  if (!event.title) errors.push('event-title-required');
  if (!event.publicSafe) errors.push('event-must-be-public-safe');
  if (event.containsRawAddress) errors.push('raw-address-not-allowed');
  if (event.containsPreciseCoordinates) errors.push('precise-coordinates-not-allowed');
  if (event.containsRecipientData) errors.push('recipient-data-not-allowed');
  if (event.containsPrivateRoute) errors.push('private-route-not-allowed');
  if (event.sourceConfidence < 0 || event.sourceConfidence > 1) errors.push('source-confidence-out-of-range');

  const startsAt = parseTime(event.timeWindow.startsAt);
  const endsAt = parseTime(event.timeWindow.endsAt);
  if (startsAt === null) errors.push('starts-at-invalid');
  if (endsAt === null) errors.push('ends-at-invalid');
  if (startsAt !== null && endsAt !== null && startsAt >= endsAt) errors.push('time-window-invalid');
  if (!event.scope.countryCode && !event.scope.regionCode && !event.scope.agidCellIds?.length && !event.scope.agidCellPrefixes?.length && !event.scope.affectedPoiIds?.length && !event.scope.affectedEdgeIds?.length) {
    warnings.push('event-scope-is-global');
  }
  if ((event.effect.travelTimeMultiplier ?? 1) < 1) warnings.push('travel-time-multiplier-below-one');
  if ((event.effect.reliabilityMultiplier ?? 1) > 1) warnings.push('reliability-multiplier-above-one');

  return { valid: errors.length === 0, errors, warnings };
}

export function isGeographicEventActive(event: GeographicTemporalEvent, now = new Date()) {
  const startsAt = parseTime(event.timeWindow.startsAt);
  const endsAt = parseTime(event.timeWindow.endsAt);
  if (startsAt === null || endsAt === null) return false;
  const nowMs = now.getTime();
  return startsAt <= nowMs && nowMs < endsAt;
}

function scopeMatchesTarget(
  scope: GeographicEventScope,
  graph: PoiDeliverabilityGraph,
  target: PoiTargetCell,
) {
  if (scope.countryCode && normalizedCountry(scope.countryCode) !== normalizedCountry(graph.countryCode)) return false;
  if (scope.agidCellIds?.length && !scope.agidCellIds.includes(target.agidCellId)) return false;
  if (scope.agidCellPrefixes?.length && !scope.agidCellPrefixes.some(prefix => target.agidCellId.startsWith(prefix))) return false;
  return true;
}

function eventTargetsWholeCell(event: GeographicTemporalEvent) {
  return Boolean(
    event.scope.agidCellIds?.length ||
    event.scope.agidCellPrefixes?.length ||
    (!event.scope.affectedPoiIds?.length && !event.scope.affectedEdgeIds?.length),
  );
}

function eventTargetsEdge(event: GeographicTemporalEvent, edge: PoiGraphEdge) {
  const ids = new Set([
    ...(event.scope.affectedEdgeIds ?? []),
    ...(event.effect.blockedEdgeIds ?? []),
  ]);
  if (ids.has(edgeId(edge)) || ids.has(reverseEdgeId(edge))) return true;
  const poiIds = new Set(event.scope.affectedPoiIds ?? []);
  return poiIds.has(edge.from) || poiIds.has(edge.to);
}

function eventTargetsNode(event: GeographicTemporalEvent, node: PoiGraphNode) {
  const ids = new Set([
    ...(event.scope.affectedPoiIds ?? []),
    ...(event.effect.blockedPoiIds ?? []),
  ]);
  return ids.has(node.id);
}

function eventAppliesToGraphItem(event: GeographicTemporalEvent, edgeOrNode: PoiGraphEdge | PoiGraphNode) {
  if ('from' in edgeOrNode) return eventTargetsEdge(event, edgeOrNode);
  return eventTargetsNode(event, edgeOrNode);
}

function eventRouteHit(event: GeographicTemporalEvent, decision: PoiDeliverabilityDecision) {
  const edgeIds = new Set([
    ...(event.scope.affectedEdgeIds ?? []),
    ...(event.effect.blockedEdgeIds ?? []),
  ]);
  const poiIds = new Set([
    ...(event.scope.affectedPoiIds ?? []),
    ...(event.effect.blockedPoiIds ?? []),
  ]);

  return decision.route.some(step => (
    edgeIds.has(edgeId(step)) ||
    edgeIds.has(reverseEdgeId(step)) ||
    poiIds.has(step.from) ||
    poiIds.has(step.to)
  ));
}

function blockedByEvent(event: GeographicTemporalEvent, item: PoiGraphEdge | PoiGraphNode) {
  if (event.effect.deliveryRestriction === 'not-deliverable') return eventAppliesToGraphItem(event, item);
  if ('from' in item) return new Set(event.effect.blockedEdgeIds ?? []).has(edgeId(item)) || new Set(event.effect.blockedEdgeIds ?? []).has(reverseEdgeId(item));
  return new Set(event.effect.blockedPoiIds ?? []).has(item.id);
}

export function filterActiveSafeGeographicEvents(
  events: GeographicTemporalEvent[],
  graph: PoiDeliverabilityGraph,
  target: PoiTargetCell,
  now = new Date(),
) {
  return events.filter(event => (
    validateGeographicTemporalEvent(event).valid &&
    isGeographicEventActive(event, now) &&
    scopeMatchesTarget(event.scope, graph, target)
  ));
}

export function applyGeographicEventsToPoiGraph(
  graph: PoiDeliverabilityGraph,
  events: GeographicTemporalEvent[],
): PoiDeliverabilityGraph {
  const edges = graph.edges.flatMap(edge => {
    const matching = events.filter(event => eventTargetsWholeCell(event) || eventTargetsEdge(event, edge));
    if (matching.some(event => blockedByEvent(event, edge))) return [];
    if (!matching.length) return [edge];

    const travelTimeMultiplier = matching.reduce((multiplier, event) => (
      multiplier * Math.max(1, event.effect.travelTimeMultiplier ?? 1)
    ), 1);
    const reliabilityMultiplier = matching.reduce((multiplier, event) => (
      multiplier * clamp(event.effect.reliabilityMultiplier ?? 1)
    ), 1);

    return [{
      ...edge,
      travelTimeMinutes: edge.travelTimeMinutes * travelTimeMultiplier,
      reliability: clamp(edge.reliability * reliabilityMultiplier, 0.01, 1),
      sourceRefs: [
        ...edge.sourceRefs,
        ...matching.map(event => ({ sourceId: `event:${event.eventId}`, licenseStatus: 'synthetic' as const })),
      ],
    }];
  });

  const nodes = graph.nodes.map(node => {
    const matching = events.filter(event => eventTargetsWholeCell(event) || eventTargetsNode(event, node));
    if (!matching.length) return node;
    const confidencePenalty = matching.reduce((sum, event) => sum + (event.effect.confidencePenalty ?? 0), 0);
    const blocked = matching.some(event => blockedByEvent(event, node));
    return {
      ...node,
      trustScore: blocked ? 0.05 : clamp((node.trustScore ?? 0.5) - confidencePenalty),
      serviceTags: unique([
        ...(node.serviceTags ?? []),
        ...matching.map(event => `event:${event.kind}`),
        ...(blocked ? ['event-blocked'] : []),
      ]),
      sourceRefs: [
        ...node.sourceRefs,
        ...matching.map(event => ({ sourceId: `event:${event.eventId}`, licenseStatus: 'synthetic' as const })),
      ],
    };
  });

  return { ...graph, nodes, edges };
}

function temporalStateFor(
  base: PoiDeliverabilityDecision,
  activeEvents: GeographicTemporalEvent[],
): TemporalDeliverabilityDecision['temporalState'] {
  if (!activeEvents.length) return 'normal';
  if (activeEvents.some(event => event.effect.deliveryRestriction === 'not-deliverable')) return 'blocked';
  if (activeEvents.some(event => event.effect.deliveryRestriction === 'manual-review')) return 'manual-review';
  if (base.status === 'manual-review') return 'restricted';
  if (activeEvents.some(event => event.kind === 'congestion' || event.effect.travelTimeMultiplier)) return 'congested';
  return 'restricted';
}

function statusWithEvents(
  base: PoiDeliverabilityDecision['status'],
  activeEvents: GeographicTemporalEvent[],
) {
  if (activeEvents.some(event => event.effect.deliveryRestriction === 'not-deliverable')) return 'not-deliverable';
  if (activeEvents.some(event => event.effect.deliveryRestriction === 'manual-review')) return 'manual-review';
  return base;
}

export function evaluatePoiGraphDeliverabilityWithGeographicEvents(
  graph: PoiDeliverabilityGraph,
  target: PoiTargetCell,
  events: GeographicTemporalEvent[],
  options: {
    now?: Date;
    policy?: PoiDeliverabilityPolicy;
  } = {},
): TemporalDeliverabilityDecision {
  const now = options.now ?? new Date();
  const activeEvents = filterActiveSafeGeographicEvents(events, graph, target, now);
  const transformedGraph = applyGeographicEventsToPoiGraph(graph, activeEvents);
  const base = evaluatePoiGraphDeliverability(transformedGraph, target, options.policy);
  const routeHits = activeEvents.filter(event => eventRouteHit(event, base));
  const cellWideEvents = activeEvents.filter(event => eventTargetsWholeCell(event));
  const effectiveEvents = unique([...cellWideEvents, ...routeHits]);
  const confidencePenalty = effectiveEvents.reduce((sum, event) => sum + (event.effect.confidencePenalty ?? 0), 0);
  const forcedStatus = statusWithEvents(base.status, effectiveEvents);
  const eventWarnings = unique([
    ...activeEvents.flatMap(event => validateGeographicTemporalEvent(event).warnings.map(warning => `${event.eventId}:${warning}`)),
    ...effectiveEvents.map(event => (
      event.effect.deliveryRestriction === 'not-deliverable'
        ? `event-blocks-delivery:${event.eventId}`
        : event.effect.deliveryRestriction === 'manual-review'
          ? `event-requires-manual-review:${event.eventId}`
          : event.kind === 'congestion'
            ? `event-congestion:${event.eventId}`
            : `event-active:${event.eventId}`
    )),
  ]);

  return {
    ...base,
    status: forcedStatus,
    confidence: clamp(base.confidence - confidencePenalty),
    temporalState: temporalStateFor({ ...base, status: forcedStatus }, effectiveEvents),
    activeEventIds: effectiveEvents.map(event => event.eventId),
    eventEvidence: effectiveEvents.map(event => `${event.kind}:${event.severity}:${event.sourceClass}`),
    eventWarnings,
    warnings: unique([...base.warnings, ...eventWarnings]),
    evidence: unique([
      ...base.evidence,
      ...(effectiveEvents.length ? ['time-bounded-geographic-event-layer'] : []),
    ]),
  };
}
