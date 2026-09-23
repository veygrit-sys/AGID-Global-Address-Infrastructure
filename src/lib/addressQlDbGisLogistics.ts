import { ADDRESSQL_FUNCTION_SPECS } from './addressQlResearch';

export const ADDRESSQL_DB_GIS_LOGISTICS_VERSION = 'addressql-db-gis-logistics-v0.1';

export type AddressQlSynthesisPillarId = 'database_research' | 'gis_research' | 'logistics_research';

export type AddressQlSynthesisCapabilityId =
  | 'typed_address_relations'
  | 'cost_based_address_optimizer'
  | 'source_versioned_transactions'
  | 'spatial_predicate_kernel'
  | 'multi_resolution_spatial_index'
  | 'network_reachability_and_map_matching'
  | 'congestion_mobility_kernel'
  | 'delivery_service_area_model'
  | 'last_mile_constraint_optimizer'
  | 'handoff_and_acknowledgement_protocol'
  | 'privacy_preserving_query_boundary';

export type AddressQlSynthesisPillar = {
  id: AddressQlSynthesisPillarId;
  title: string;
  importedWisdom: string[];
  addressQlInterpretation: string;
  primaryRisks: string[];
};

export type AddressQlSynthesisCapability = {
  id: AddressQlSynthesisCapabilityId;
  title: string;
  pillars: AddressQlSynthesisPillarId[];
  researchWisdom: string[];
  addressQlOperators: string[];
  dataStructures: string[];
  requiredArtifacts: string[];
  nonClaims: string[];
};

export type AddressQlOptimizerRule = {
  id: string;
  title: string;
  before: string;
  after: string;
  safeOnlyWhen: string[];
  blockedWhen: string[];
};

export type AddressQlSynthesisCoverage = {
  pillar: AddressQlSynthesisPillarId;
  capabilityCount: number;
  functionCount: number;
  artifactCount: number;
};

export const ADDRESSQL_SYNTHESIS_PILLARS: AddressQlSynthesisPillar[] = [
  {
    id: 'database_research',
    title: 'Database research',
    importedWisdom: [
      'relational algebra and typed operators',
      'cost-based query optimization',
      'statistics, histograms, and selectivity estimation',
      'transaction isolation and source-versioned replay',
      'materialized views, indexes, and query rewrite',
      'provenance, auditability, and conformance testing',
    ],
    addressQlInterpretation:
      'AddressQL functions must be typed, deterministic when possible, explainable, replayable by source version, and safe for adapter planners.',
    primaryRisks: [
      'volatile address functions accidentally materialized as immutable results',
      'query plans that leak sensitive address components through indexes',
      'adapter-specific behavior hidden behind the same function name',
    ],
  },
  {
    id: 'gis_research',
    title: 'GIS research',
    importedWisdom: [
      'spatial predicates such as within, contains, intersects, touches, and nearest',
      'coordinate reference systems and geodesic distance',
      'topology for islands, holes, exclaves, and connected components',
      'spatial indexes such as R-tree, GiST, grid, geohash, S2-like cells, and AGID cells',
      'map matching, reverse geocoding, and network datasets',
      'temporal GIS for events, closures, disasters, and boundary changes',
    ],
    addressQlInterpretation:
      'AddressQL must treat addresses as spatial and topological references, not only text rows.',
    primaryRisks: [
      'coordinate precision mistaken for address identity',
      'flat Euclidean distance used where network distance is required',
      'boundary uncertainty hidden from delivery or proof decisions',
    ],
  },
  {
    id: 'logistics_research',
    title: 'Logistics research',
    importedWisdom: [
      'vehicle routing, facility location, and assignment problems',
      'service areas, time windows, capacity, and SLA constraints',
      'hub-and-spoke, locker/PUDO, port, airport, and last-mile handoff models',
      'disruption handling for disasters, events, closures, and congestion',
      'proof of handoff, semantic acknowledgement, and carrier capability negotiation',
      'load balancing and delivery-risk scoring',
    ],
    addressQlInterpretation:
      'AddressQL delivery functions must answer whether a delivery action is currently feasible under declared carrier, time, risk, and handoff constraints.',
    primaryRisks: [
      'deliverable treated as guaranteed delivery',
      'carrier-specific policy exposed as universal truth',
      'logistics data used as hidden surveillance without policy and retention controls',
    ],
  },
];

export const ADDRESSQL_SYNTHESIS_CAPABILITIES: AddressQlSynthesisCapability[] = [
  {
    id: 'typed_address_relations',
    title: 'Typed address relations',
    pillars: ['database_research'],
    researchWisdom: ['relational schemas', 'domains', 'constraints', 'typed JSON results', 'null semantics'],
    addressQlOperators: ['ADDRESS_PARSE', 'ADDRESS_COMPONENT', 'ADDRESS_SCHEMA', 'ADDRESS_NORMALIZE'],
    dataStructures: ['country_schema', 'component_tuple', 'source_version_table', 'typed_result_schema'],
    requiredArtifacts: ['component schema fixture', 'null/unknown semantics fixture', 'source-version replay test'],
    nonClaims: ['A typed relation is not proof of a real-world referent.'],
  },
  {
    id: 'cost_based_address_optimizer',
    title: 'Cost-based address optimizer',
    pillars: ['database_research'],
    researchWisdom: ['selectivity estimation', 'histograms', 'join ordering', 'predicate pushdown', 'materialized views'],
    addressQlOperators: ['ADDRESS_MATCH', 'ADDRESS_SIMILARITY', 'ADDRESS_SCORE', 'POSTAL_LOOKUP', 'ADDRESS_WITHIN'],
    dataStructures: ['address_statistics', 'candidate_count_histogram', 'operator_cost_table', 'explain_plan'],
    requiredArtifacts: ['cost model fixture', 'query rewrite safety tests', 'explain output schema'],
    nonClaims: ['A cheaper query plan is not a more truthful address decision.'],
  },
  {
    id: 'source_versioned_transactions',
    title: 'Source-versioned transactions',
    pillars: ['database_research'],
    researchWisdom: ['snapshot isolation', 'temporal tables', 'provenance', 'audit logs', 'deterministic replay'],
    addressQlOperators: ['ADDRESS_SCHEMA', 'ADDRESS_NORMALIZE', 'ADDRESS_MATCH', 'POSTAL_VALIDATE', 'ADDRESS_ACK'],
    dataStructures: ['source_root', 'valid_time', 'transaction_time', 'provenance_record', 'semantic_ack'],
    requiredArtifacts: ['source-root manifest', 'historical replay fixture', 'audit-safe ACK fixture'],
    nonClaims: ['A newer source version does not invalidate all prior decisions.'],
  },
  {
    id: 'spatial_predicate_kernel',
    title: 'Spatial predicate kernel',
    pillars: ['gis_research'],
    researchWisdom: ['simple feature predicates', 'CRS policy', 'geodesic distance', 'topological validity'],
    addressQlOperators: ['ADDRESS_WITHIN', 'ADDRESS_DISTANCE', 'GEOCODE', 'REVERSE_GEOCODE'],
    dataStructures: ['region_polygon', 'boundary_uncertainty', 'crs_policy', 'spatial_predicate_result'],
    requiredArtifacts: ['polygon containment fixture', 'boundary ambiguity cases', 'CRS policy tests'],
    nonClaims: ['Spatial containment at coarse precision is not room-level address proof.'],
  },
  {
    id: 'multi_resolution_spatial_index',
    title: 'Multi-resolution spatial index',
    pillars: ['database_research', 'gis_research'],
    researchWisdom: ['R-tree/GiST', 'grid indexes', 'space-filling curves', 'coarse-to-fine candidate pruning'],
    addressQlOperators: ['ADDRESS_WITHIN', 'ADDRESS_DISTANCE', 'POSTAL_LOOKUP', 'ADDRESS_MATCH', 'ADDRESS_COMMIT'],
    dataStructures: ['postal_index', 'admin_index', 'agid_cell_index', 'landmark_index', 'commitment_index'],
    requiredArtifacts: ['multi-index fixture', 'privacy leakage budget', 'no-postal fallback search test'],
    nonClaims: ['Indexes improve retrieval and cost, not truth or identity.'],
  },
  {
    id: 'network_reachability_and_map_matching',
    title: 'Network reachability and map matching',
    pillars: ['gis_research', 'logistics_research'],
    researchWisdom: ['road graphs', 'walk/drive/ferry edges', 'map matching', 'shortest path', 'service reachability'],
    addressQlOperators: ['GEOCODE', 'REVERSE_GEOCODE', 'ADDRESS_DISTANCE', 'ADDRESS_REACHABLE_WITHIN', 'DELIVERY_AVAILABLE', 'DELIVERY_AREA'],
    dataStructures: ['road_graph', 'poi_graph', 'mode_edge', 'matched_location', 'reachability_result'],
    requiredArtifacts: ['synthetic road graph', 'island ferry fixture', 'map-matching counterexample'],
    nonClaims: ['Reachability is time- and mode-dependent, not a universal property of the address.'],
  },
  {
    id: 'congestion_mobility_kernel',
    title: 'Congestion and mobility kernel',
    pillars: ['database_research', 'gis_research', 'logistics_research'],
    researchWisdom: ['flow and density models', 'queueing theory', 'bottleneck analysis', 'cellular automata fallback', 'delay-aware route optimization'],
    addressQlOperators: ['ADDRESS_TRAVEL_TIME', 'ADDRESS_CONGESTION_SCORE', 'ADDRESS_DELIVERY_DIFFICULTY', 'ADDRESS_REACHABLE_WITHIN', 'ADDRESS_BOTTLENECKS'],
    dataStructures: ['congestion_cell', 'time_window', 'bottleneck_edge', 'queue_state', 'travel_time_estimate'],
    requiredArtifacts: ['synthetic congestion grid', 'bottleneck fixture', 'queueing fixture', 'distance-vs-delay counterexample'],
    nonClaims: ['Congestion outputs are operational estimates, not surveillance, safety classification, or delivery guarantees.'],
  },
  {
    id: 'delivery_service_area_model',
    title: 'Delivery service area model',
    pillars: ['gis_research', 'logistics_research'],
    researchWisdom: ['carrier service areas', 'time windows', 'temporary events', 'coverage polygons', 'SLA classes'],
    addressQlOperators: ['DELIVERY_AVAILABLE', 'DELIVERY_AREA', 'DELIVERY_ESTIMATE', 'DELIVERY_RISK_SCORE', 'ADDRESS_CONGESTION_SCORE', 'ADDRESS_ACK'],
    dataStructures: ['service_area', 'carrier_capability', 'time_window', 'temporary_event', 'delivery_decision'],
    requiredArtifacts: ['carrier service-area fixture', 'event closure fixture', 'delivery non-guarantee tests'],
    nonClaims: ['Serviceable now is not guaranteed delivery at all future times.'],
  },
  {
    id: 'last_mile_constraint_optimizer',
    title: 'Last-mile constraint optimizer',
    pillars: ['database_research', 'gis_research', 'logistics_research'],
    researchWisdom: ['facility location', 'assignment', 'load balancing', 'capacity constraints', 'risk-aware routing'],
    addressQlOperators: ['DELIVERY_AVAILABLE', 'DELIVERY_ESTIMATE', 'DELIVERY_RISK_SCORE', 'ADDRESS_TRAVEL_TIME', 'ADDRESS_DELIVERY_DIFFICULTY', 'ADDRESS_WITHIN', 'ADDRESS_POLICY_CHECK'],
    dataStructures: ['depot', 'locker', 'route_segment', 'capacity_bucket', 'risk_constraint'],
    requiredArtifacts: ['PUDO/locker fixture', 'capacity stress fixture', 'risk-aware policy test'],
    nonClaims: ['Optimization output is advisory unless a carrier accepts the plan.'],
  },
  {
    id: 'handoff_and_acknowledgement_protocol',
    title: 'Handoff and acknowledgement protocol',
    pillars: ['database_research', 'logistics_research'],
    researchWisdom: ['state machines', 'idempotency', 'receipts', 'semantic ACK', 'proof of handoff'],
    addressQlOperators: ['DELIVERY_TOKEN_CREATE', 'DELIVERY_TOKEN_VERIFY', 'ADDRESS_POLICY_CHECK', 'ADDRESS_ACK', 'ADDRESS_VERIFY_PROOF'],
    dataStructures: ['delivery_token', 'handoff_state', 'semantic_ack', 'idempotency_key', 'proof_receipt'],
    requiredArtifacts: ['handoff state machine', 'idempotent ACK fixture', 'proof receipt schema'],
    nonClaims: ['ACK deliverable is not proof of residence, ownership, or sovereignty.'],
  },
  {
    id: 'privacy_preserving_query_boundary',
    title: 'Privacy-preserving query boundary',
    pillars: ['database_research', 'gis_research', 'logistics_research'],
    researchWisdom: ['data minimization', 'private indexes', 'commitments', 'proof policies', 'retention limits'],
    addressQlOperators: ['ADDRESS_COMMIT', 'ADDRESS_ENVELOPE_CREATE', 'ADDRESS_PROVE', 'ADDRESS_VERIFY_PROOF', 'ADDRESS_POLICY_CHECK', 'ADDRESS_HASH'],
    dataStructures: ['commitment', 'proof_bundle', 'verifier_policy', 'public_signal', 'retention_policy'],
    requiredArtifacts: ['unsafe hash counterexample', 'proof input schema', 'policy-retention fixture'],
    nonClaims: ['Privacy-preserving query boundaries do not fix incorrect source data.'],
  },
];

export const ADDRESSQL_OPTIMIZER_RULES: AddressQlOptimizerRule[] = [
  {
    id: 'postal_before_fuzzy_match',
    title: 'Push postal/admin filters before fuzzy matching',
    before: 'ADDRESS_MATCH(address, q) over all rows',
    after: 'POSTAL_LOOKUP(q.postal) or admin filter -> ADDRESS_MATCH(candidates, q)',
    safeOnlyWhen: ['postal/admin input is present', 'source_version is fixed', 'policy permits coarse location filtering'],
    blockedWhen: ['postal system is absent or weak without fallback', 'filter would exclude aliases or historic names'],
  },
  {
    id: 'coarse_to_fine_spatial_lookup',
    title: 'Use coarse-to-fine spatial lookup',
    before: 'ADDRESS_WITHIN(address, fine_region) over all rows',
    after: 'AGID/admin coarse cell filter -> precise polygon containment',
    safeOnlyWhen: ['CRS policy is declared', 'boundary uncertainty is represented', 'fine region is source-versioned'],
    blockedWhen: ['boundary is disputed', 'precision would reveal private unit-level location'],
  },
  {
    id: 'materialize_stable_normalization',
    title: 'Materialize stable normalization by source version',
    before: 'ADDRESS_NORMALIZE(raw, country, V_s) on every query',
    after: 'stored normalized result keyed by source_version and policy-safe hash',
    safeOnlyWhen: ['function is stable_by_source_version', 'raw address is not stored in public fixtures', 'salt/key policy is documented'],
    blockedWhen: ['normalization function is volatile', 'materialized index increases privacy leakage beyond budget'],
  },
  {
    id: 'separate_delivery_estimate_from_deliverability',
    title: 'Separate serviceability from live estimate',
    before: 'DELIVERY_ESTIMATE used as the only deliverability decision',
    after: 'DELIVERY_AVAILABLE stable check -> volatile DELIVERY_ESTIMATE annotation',
    safeOnlyWhen: ['carrier capability is declared', 'time window is included', 'non-guarantee is returned'],
    blockedWhen: ['carrier policy is unavailable', 'live data would require production traffic in tests'],
  },
  {
    id: 'prefer_delay_metric_over_geometric_distance_for_delivery',
    title: 'Prefer delay-aware metric over geometric distance for delivery planning',
    before: 'ADDRESS_DISTANCE(origin, address, geodesic) used as route difficulty',
    after: 'ADDRESS_BOTTLENECKS(address) + ADDRESS_TRAVEL_TIME(origin, address, time, mode) + ADDRESS_DELIVERY_DIFFICULTY(address)',
    safeOnlyWhen: ['time window is declared', 'mode is declared', 'bottleneck source version is fixed', 'non-guarantee is returned'],
    blockedWhen: ['no network or synthetic congestion fixture exists', 'output would expose sensitive facility constraints'],
  },
  {
    id: 'proof_after_policy_check',
    title: 'Check policy before proof generation',
    before: 'ADDRESS_PROVE(envelope, claim, proof_policy) without audience check',
    after: 'ADDRESS_POLICY_CHECK(envelope, policy, receiver_capability) -> ADDRESS_PROVE',
    safeOnlyWhen: ['audience, purpose, retention, and max disclosure are declared'],
    blockedWhen: ['receiver capability is unknown', 'claim requires raw address disclosure'],
  },
];

export function buildAddressQlSynthesisCoverage(): AddressQlSynthesisCoverage[] {
  return ADDRESSQL_SYNTHESIS_PILLARS.map(pillar => {
    const capabilities = ADDRESSQL_SYNTHESIS_CAPABILITIES.filter(capability => capability.pillars.includes(pillar.id));
    const functions = new Set(capabilities.flatMap(capability => capability.addressQlOperators));
    const artifacts = capabilities.reduce((count, capability) => count + capability.requiredArtifacts.length, 0);

    return {
      pillar: pillar.id,
      capabilityCount: capabilities.length,
      functionCount: functions.size,
      artifactCount: artifacts,
    };
  });
}

export function validateAddressQlDbGisLogisticsSynthesis(): string[] {
  const errors: string[] = [];
  const functionNames = new Set(ADDRESSQL_FUNCTION_SPECS.map(spec => spec.name));
  const pillarIds = new Set(ADDRESSQL_SYNTHESIS_PILLARS.map(pillar => pillar.id));
  const coveredPillars = new Set<AddressQlSynthesisPillarId>();

  for (const capability of ADDRESSQL_SYNTHESIS_CAPABILITIES) {
    if (capability.pillars.length === 0) errors.push(`${capability.id}: missing pillar`);
    if (capability.researchWisdom.length < 3) errors.push(`${capability.id}: needs imported research wisdom`);
    if (capability.addressQlOperators.length < 4) errors.push(`${capability.id}: needs AddressQL operators`);
    if (capability.requiredArtifacts.length < 3) errors.push(`${capability.id}: needs executable artifacts`);
    if (capability.nonClaims.length === 0) errors.push(`${capability.id}: missing non-claims`);

    for (const pillar of capability.pillars) {
      if (!pillarIds.has(pillar)) errors.push(`${capability.id}: unknown pillar ${pillar}`);
      coveredPillars.add(pillar);
    }
    for (const operator of capability.addressQlOperators) {
      if (!functionNames.has(operator)) errors.push(`${capability.id}: unknown function ${operator}`);
    }
  }

  for (const pillar of ADDRESSQL_SYNTHESIS_PILLARS) {
    if (!coveredPillars.has(pillar.id)) errors.push(`uncovered pillar: ${pillar.id}`);
    if (pillar.importedWisdom.length < 5) errors.push(`${pillar.id}: needs more imported wisdom`);
    if (pillar.primaryRisks.length < 3) errors.push(`${pillar.id}: needs risk boundaries`);
  }

  if (!ADDRESSQL_SYNTHESIS_CAPABILITIES.some(capability => capability.pillars.length === 3)) {
    errors.push('at least one capability must integrate database, GIS, and logistics research');
  }
  if (!ADDRESSQL_SYNTHESIS_CAPABILITIES.some(capability => capability.id === 'privacy_preserving_query_boundary')) {
    errors.push('missing privacy-preserving query boundary');
  }
  if (ADDRESSQL_OPTIMIZER_RULES.length < 5) errors.push('needs at least five optimizer rules');

  for (const rule of ADDRESSQL_OPTIMIZER_RULES) {
    if (rule.safeOnlyWhen.length === 0) errors.push(`${rule.id}: missing safety preconditions`);
    if (rule.blockedWhen.length === 0) errors.push(`${rule.id}: missing blocked conditions`);
  }

  return errors;
}
