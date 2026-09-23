import { ADDRESSQL_FUNCTION_SPECS } from './addressQlResearch';

export const ADDRESSQL_CONGESTION_VERSION = 'addressql-congestion-v0.1';

export type AddressQlCongestionConceptId =
  | 'flow'
  | 'density'
  | 'bottleneck'
  | 'queueing'
  | 'cellular_automata'
  | 'network_theory'
  | 'delay_optimization';

export type AddressQlCongestionWorkflowId =
  | 'last_mile_eta'
  | 'event_area_surge'
  | 'vertical_building_delay'
  | 'port_airport_gate_delay'
  | 'reachability_window';

export type AddressQlCongestionConcept = {
  id: AddressQlCongestionConceptId;
  trafficTheoryIdea: string;
  addressQlUse: string;
  functions: string[];
  requiredArtifacts: string[];
  nonClaims: string[];
};

export type AddressQlCongestionWorkflow = {
  id: AddressQlCongestionWorkflowId;
  title: string;
  queryShape: string[];
  requiredEvidence: string[];
  privacyBoundary: string;
};

export type AddressQlCongestionCoverageRow = {
  concept: AddressQlCongestionConceptId;
  functionCount: number;
  artifactCount: number;
  nonClaimCount: number;
};

export const ADDRESSQL_CONGESTION_REQUIRED_FUNCTIONS = [
  'ADDRESS_TRAVEL_TIME',
  'ADDRESS_CONGESTION_SCORE',
  'ADDRESS_DELIVERY_DIFFICULTY',
  'ADDRESS_REACHABLE_WITHIN',
  'ADDRESS_BOTTLENECKS',
] as const;

export const ADDRESSQL_CONGESTION_CONCEPTS: AddressQlCongestionConcept[] = [
  {
    id: 'flow',
    trafficTheoryIdea: 'Flow measures how many vehicles, couriers, parcels, or people pass through a network segment or facility over time.',
    addressQlUse: 'Use flow to explain why nearby addresses can have different travel time or carrier load at the same clock time.',
    functions: ['ADDRESS_TRAVEL_TIME', 'ADDRESS_CONGESTION_SCORE', 'DELIVERY_ESTIMATE'],
    requiredArtifacts: ['synthetic hourly flow table', 'edge capacity fixture', 'volatile estimate replay test'],
    nonClaims: ['Flow is an operational aggregate, not a person-level movement trace.'],
  },
  {
    id: 'density',
    trafficTheoryIdea: 'Density measures how concentrated vehicles, pedestrians, buildings, parcels, or queueing demand are in an area.',
    addressQlUse: 'Use density to score event areas, tower clusters, shopping streets, and commercial districts without claiming exact household behavior.',
    functions: ['ADDRESS_CONGESTION_SCORE', 'ADDRESS_DELIVERY_DIFFICULTY', 'ADDRESS_WITHIN'],
    requiredArtifacts: ['synthetic area density grid', 'event-area surge fixture', 'density privacy budget test'],
    nonClaims: ['Density is area-level decision support, not surveillance or resident profiling.'],
  },
  {
    id: 'bottleneck',
    trafficTheoryIdea: 'Bottlenecks are constrained edges or facilities such as bridges, gates, rail crossings, ports, airports, narrow roads, lockers, and lobbies.',
    addressQlUse: 'Use bottlenecks to explain why short geometric distance can still imply slow or difficult delivery.',
    functions: ['ADDRESS_BOTTLENECKS', 'ADDRESS_TRAVEL_TIME', 'ADDRESS_DELIVERY_DIFFICULTY'],
    requiredArtifacts: ['bridge and gate fixture', 'vertical building access fixture', 'bottleneck source-confidence schema'],
    nonClaims: ['A bottleneck candidate must not become a hidden denial rule without carrier policy and review.'],
  },
  {
    id: 'queueing',
    trafficTheoryIdea: 'Queueing theory models waiting time at service points such as delivery centers, reception desks, lockers, ports, airports, and gated entries.',
    addressQlUse: 'Use queues to separate movement time from handoff time and to model delivery delay at facilities.',
    functions: ['ADDRESS_DELIVERY_DIFFICULTY', 'ADDRESS_TRAVEL_TIME', 'DELIVERY_ESTIMATE'],
    requiredArtifacts: ['synthetic service-rate table', 'locker occupancy fixture', 'handoff waiting-time non-claim test'],
    nonClaims: ['Queue estimates are not guarantees and must expose time window and source version.'],
  },
  {
    id: 'cellular_automata',
    trafficTheoryIdea: 'Cellular automata approximate local movement and jam propagation when full route telemetry is unavailable.',
    addressQlUse: 'Use grid-level simulation as a fallback for no-live-traffic, disaster, event, island, and weak-data regions.',
    functions: ['ADDRESS_TRAVEL_TIME', 'ADDRESS_REACHABLE_WITHIN', 'ADDRESS_CONGESTION_SCORE'],
    requiredArtifacts: ['synthetic grid simulation fixture', 'blocked-cell counterexample', 'simulation parameter schema'],
    nonClaims: ['Simulation fallback is an estimate and must not be presented as observed live traffic.'],
  },
  {
    id: 'network_theory',
    trafficTheoryIdea: 'Network theory models roads, ferry links, building entrances, gates, stairs, elevators, lockers, ports, and airports as nodes and edges.',
    addressQlUse: 'Use graph reachability to distinguish near-by-coordinate from reachable-by-mode.',
    functions: ['ADDRESS_REACHABLE_WITHIN', 'ADDRESS_BOTTLENECKS', 'ADDRESS_DISTANCE', 'DELIVERY_AVAILABLE'],
    requiredArtifacts: ['mode-edge road graph fixture', 'island ferry reachability fixture', 'entrance-to-room graph fixture'],
    nonClaims: ['Reachability is mode-, time-, source-, and policy-dependent.'],
  },
  {
    id: 'delay_optimization',
    trafficTheoryIdea: 'Optimization chooses routes or handoff plans by minimizing delay, risk, user friction, or carrier cost rather than pure distance.',
    addressQlUse: 'Use delay-aware operators to rank delivery choices by expected time and bottleneck exposure.',
    functions: ['ADDRESS_TRAVEL_TIME', 'ADDRESS_DELIVERY_DIFFICULTY', 'ADDRESS_REACHABLE_WITHIN', 'DELIVERY_AVAILABLE', 'DELIVERY_ESTIMATE'],
    requiredArtifacts: ['multi-objective route ranking fixture', 'delay-vs-distance counterexample', 'carrier capability constraint test'],
    nonClaims: ['Optimized delivery choice is advisory until accepted by the carrier or verifier policy.'],
  },
];

export const ADDRESSQL_CONGESTION_WORKFLOWS: AddressQlCongestionWorkflow[] = [
  {
    id: 'last_mile_eta',
    title: 'Last-mile travel-time estimate',
    queryShape: [
      'ADDRESS_REACHABLE_WITHIN(depot, address, 45, time, mode)',
      'ADDRESS_TRAVEL_TIME(depot, address, time, mode)',
      'DELIVERY_ESTIMATE(address, carrier, service_level, time)',
    ],
    requiredEvidence: ['source-versioned road graph', 'carrier capability', 'time window', 'synthetic congestion profile'],
    privacyBoundary: 'Do not store courier or recipient traces in public fixtures.',
  },
  {
    id: 'event_area_surge',
    title: 'Event-area congestion surge',
    queryShape: [
      'ADDRESS_WITHIN(address, event_region)',
      'ADDRESS_CONGESTION_SCORE(event_region, time, mode)',
      'ADDRESS_DELIVERY_DIFFICULTY(address, carrier, service_level, time)',
    ],
    requiredEvidence: ['temporary event polygon', 'time-bounded source root', 'manual-review policy'],
    privacyBoundary: 'Event congestion must be area-level and time-bounded.',
  },
  {
    id: 'vertical_building_delay',
    title: 'Vertical and building-entry delivery delay',
    queryShape: [
      'ADDRESS_BOTTLENECKS(address, radius, walk)',
      'ADDRESS_DELIVERY_DIFFICULTY(address, carrier, service_level, time)',
      'ADDRESS_ACK(address_communication_object, receiver_capability, policy)',
    ],
    requiredEvidence: ['entrance graph', 'lobby or gate fixture', 'vertical reference policy'],
    privacyBoundary: 'Unit-level or room-level details must not be exposed unless policy permits.',
  },
  {
    id: 'port_airport_gate_delay',
    title: 'Port, airport, and controlled-gate delay',
    queryShape: [
      'ADDRESS_BOTTLENECKS(address, radius, freight)',
      'ADDRESS_TRAVEL_TIME(origin, address, time, freight)',
      'DELIVERY_AVAILABLE(address, carrier, service_level, source_version)',
    ],
    requiredEvidence: ['controlled-access POI graph', 'queueing fixture', 'carrier authorization policy'],
    privacyBoundary: 'Sensitive facility constraints should be coarse, source-declared, and policy-limited.',
  },
  {
    id: 'reachability_window',
    title: 'Reachability in a delivery time window',
    queryShape: [
      'ADDRESS_REACHABLE_WITHIN(origin, address, minutes, time, mode)',
      'ADDRESS_CONGESTION_SCORE(address, time, mode)',
      'ADDRESS_POLICY_CHECK(envelope_or_message, policy, receiver_capability)',
    ],
    requiredEvidence: ['network graph', 'congestion score fixture', 'least-disclosure policy'],
    privacyBoundary: 'Reachability proof must not reveal exact private address when region-level proof is enough.',
  },
];

export function buildAddressQlCongestionCoverage(): AddressQlCongestionCoverageRow[] {
  return ADDRESSQL_CONGESTION_CONCEPTS.map(concept => ({
    concept: concept.id,
    functionCount: concept.functions.length,
    artifactCount: concept.requiredArtifacts.length,
    nonClaimCount: concept.nonClaims.length,
  }));
}

export function validateAddressQlCongestionModel(): string[] {
  const errors: string[] = [];
  const functionNames = new Set(ADDRESSQL_FUNCTION_SPECS.map(spec => spec.name));

  for (const functionName of ADDRESSQL_CONGESTION_REQUIRED_FUNCTIONS) {
    const spec = ADDRESSQL_FUNCTION_SPECS.find(item => item.name === functionName);
    if (!spec) errors.push(`missing congestion function: ${functionName}`);
    if (spec && spec.category !== 'congestion_mobility') {
      errors.push(`${functionName}: must be congestion_mobility`);
    }
  }

  for (const concept of ADDRESSQL_CONGESTION_CONCEPTS) {
    if (concept.functions.length < 3) errors.push(`${concept.id}: needs at least three functions`);
    if (concept.requiredArtifacts.length < 3) errors.push(`${concept.id}: needs executable artifacts`);
    if (concept.nonClaims.length === 0) errors.push(`${concept.id}: missing non-claims`);
    for (const functionName of concept.functions) {
      if (!functionNames.has(functionName)) errors.push(`${concept.id}: unknown function ${functionName}`);
    }
  }

  for (const workflow of ADDRESSQL_CONGESTION_WORKFLOWS) {
    if (workflow.queryShape.length < 3) errors.push(`${workflow.id}: needs query shape`);
    if (workflow.requiredEvidence.length < 3) errors.push(`${workflow.id}: needs evidence requirements`);
    if (!/privacy|trace|policy|expose|level/i.test(workflow.privacyBoundary)) {
      errors.push(`${workflow.id}: weak privacy boundary`);
    }
  }

  if (ADDRESSQL_CONGESTION_CONCEPTS.length < 7) errors.push('needs at least seven congestion concepts');
  if (ADDRESSQL_CONGESTION_WORKFLOWS.length < 5) errors.push('needs at least five congestion workflows');

  const bottleneck = ADDRESSQL_FUNCTION_SPECS.find(spec => spec.name === 'ADDRESS_BOTTLENECKS');
  if (bottleneck?.determinism !== 'stable_by_source_version') {
    errors.push('ADDRESS_BOTTLENECKS should be source-version stable');
  }

  const volatile = ['ADDRESS_TRAVEL_TIME', 'ADDRESS_CONGESTION_SCORE', 'ADDRESS_DELIVERY_DIFFICULTY', 'ADDRESS_REACHABLE_WITHIN'];
  for (const functionName of volatile) {
    const spec = ADDRESSQL_FUNCTION_SPECS.find(item => item.name === functionName);
    if (spec?.determinism !== 'volatile') errors.push(`${functionName}: should be volatile`);
  }

  return errors;
}
