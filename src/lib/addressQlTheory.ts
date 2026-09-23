import { ADDRESSQL_FUNCTION_SPECS } from './addressQlResearch';

export const ADDRESSQL_THEORY_VERSION = 'addressql-theory-v0.1';

export type AddressQlResearchDomainId =
  | 'address_morphism_normalization'
  | 'address_search_multilingual'
  | 'address_proof_authentication'
  | 'geo_delivery_optimization'
  | 'address_version_history'
  | 'distributed_address_database'
  | 'addressql_query_theory'
  | 'address_index_theory';

export type AddressQlMathFoundationId =
  | 'set_theory'
  | 'predicate_logic'
  | 'discrete_mathematics'
  | 'graph_theory'
  | 'algebra'
  | 'formal_language_theory'
  | 'automata_theory'
  | 'computational_complexity'
  | 'optimization_theory'
  | 'probability_theory'
  | 'statistics'
  | 'information_theory'
  | 'cryptography'
  | 'number_theory'
  | 'geometry'
  | 'topology';

export type AddressQlMathematicalFoundation = {
  id: AddressQlMathFoundationId;
  label: string;
  sqlUse: string;
  addressQlUse: string;
};

export type AddressQlTheoryDomain = {
  id: AddressQlResearchDomainId;
  title: string;
  coreQuestion: string;
  formalObject: string;
  addressQlFunctions: string[];
  mathFoundations: AddressQlMathFoundationId[];
  requiredArtifacts: string[];
  nonClaims: string[];
};

export type AddressQlTheoryCoverageRow = {
  domain: AddressQlResearchDomainId;
  functions: string[];
  mathFoundations: AddressQlMathFoundationId[];
  artifactCount: number;
};

export const ADDRESSQL_MATHEMATICAL_FOUNDATIONS: AddressQlMathematicalFoundation[] = [
  {
    id: 'set_theory',
    label: 'Set theory',
    sqlUse: 'Defines tables, rows, columns, relations, domains, and candidate sets.',
    addressQlUse: 'Defines address expression sets, candidate sets, region sets, and source-versioned result sets.',
  },
  {
    id: 'predicate_logic',
    label: 'Predicate logic',
    sqlUse: 'Defines WHERE clauses, joins, constraints, and query truth conditions.',
    addressQlUse: 'Defines address claims such as within(region), deliverable(carrier), verified(source), and policy_allowed.',
  },
  {
    id: 'discrete_mathematics',
    label: 'Discrete mathematics',
    sqlUse: 'Supports data structures, finite state machines, identifiers, and combinatorial query plans.',
    addressQlUse: 'Supports component tuples, finite country schemas, token states, and deterministic replay fixtures.',
  },
  {
    id: 'graph_theory',
    label: 'Graph theory',
    sqlUse: 'Supports graph databases, dependency graphs, lineage, and network analysis.',
    addressQlUse: 'Models aliases, administrative hierarchy, road/POI graphs, source lineage, and delivery reachability.',
  },
  {
    id: 'algebra',
    label: 'Algebra',
    sqlUse: 'Provides relational algebra and compositional query operators.',
    addressQlUse: 'Defines function composition such as parse -> normalize -> match -> policy_check -> ack.',
  },
  {
    id: 'formal_language_theory',
    label: 'Formal language theory',
    sqlUse: 'Defines query grammars and parser correctness.',
    addressQlUse: 'Defines AddressQL grammar, address component grammars, locale templates, and canonical function signatures.',
  },
  {
    id: 'automata_theory',
    label: 'Automata theory',
    sqlUse: 'Supports lexical analysis, parsing, and query compilation.',
    addressQlUse: 'Supports streaming parsers, country-specific address recognizers, and token/session state machines.',
  },
  {
    id: 'computational_complexity',
    label: 'Computational complexity',
    sqlUse: 'Evaluates query planning cost, index cost, and worst-case query behavior.',
    addressQlUse: 'Bounds fuzzy matching, multilingual recall expansion, geospatial containment, and proof verification cost.',
  },
  {
    id: 'optimization_theory',
    label: 'Optimization theory',
    sqlUse: 'Guides query optimizers, join ordering, and cost minimization.',
    addressQlUse: 'Guides source selection, candidate pruning, delivery area partitioning, and least-disclosure proof planning.',
  },
  {
    id: 'probability_theory',
    label: 'Probability theory',
    sqlUse: 'Supports selectivity estimates, uncertainty, and cost models.',
    addressQlUse: 'Supports match confidence, ambiguous candidate ranking, delivery uncertainty, and source confidence.',
  },
  {
    id: 'statistics',
    label: 'Statistics',
    sqlUse: 'Supports table statistics, histograms, query plan selection, and evaluation.',
    addressQlUse: 'Supports benchmark reporting, drift detection, recall/precision estimates, and source quality summaries.',
  },
  {
    id: 'information_theory',
    label: 'Information theory',
    sqlUse: 'Supports compression, indexing, encoding, and entropy-aware storage.',
    addressQlUse: 'Measures address ambiguity, code length, postal-equivalent information gain, and disclosure leakage.',
  },
  {
    id: 'cryptography',
    label: 'Cryptography',
    sqlUse: 'Supports encrypted databases, commitments, signatures, and private queries.',
    addressQlUse: 'Defines commitments, proof bundles, verifier policies, revocation roots, and unsafe-hash boundaries.',
  },
  {
    id: 'number_theory',
    label: 'Number theory',
    sqlUse: 'Supports some cryptographic constructions and finite-field proof systems.',
    addressQlUse: 'Supports future ZK circuit fields and proof-system compatibility, not raw address handling.',
  },
  {
    id: 'geometry',
    label: 'Geometry',
    sqlUse: 'Supports spatial databases, GIS, containment, distances, and nearest-neighbor search.',
    addressQlUse: 'Defines region membership, geocoding candidates, distance metrics, service areas, and grid references.',
  },
  {
    id: 'topology',
    label: 'Topology',
    sqlUse: 'Supports advanced spatial relations, boundaries, adjacency, holes, and connectedness.',
    addressQlUse: 'Defines boundary stability, island/exclave handling, connected delivery areas, and vertical reference separation.',
  },
];

export const ADDRESSQL_THEORY_DOMAINS: AddressQlTheoryDomain[] = [
  {
    id: 'address_morphism_normalization',
    title: 'Address morphism and normalization theory',
    coreQuestion: 'When may two surface address expressions be transformed into a common canonical form without overclaiming identity?',
    formalObject: 'N_s: E_country,locale x V_s -> A_norm plus M_p: A_norm -> typed result under purpose p.',
    addressQlFunctions: ['ADDRESS_PARSE', 'ADDRESS_NORMALIZE', 'ADDRESS_COMPONENT', 'ADDRESS_CANONICAL', 'ADDRESS_FORMAT', 'ADDRESS_TRANSLATE'],
    mathFoundations: ['set_theory', 'algebra', 'formal_language_theory', 'automata_theory', 'predicate_logic'],
    requiredArtifacts: ['country grammar registry', 'normalization replay fixtures', 'component schema JSON', 'non-identity claim tests'],
    nonClaims: ['Normalization is not referent resolution.', 'Canonical form is not public-safe by default.'],
  },
  {
    id: 'address_search_multilingual',
    title: 'Address search, fuzzy matching, and multilingual recall theory',
    coreQuestion: 'How can AddressQL expand aliases, scripts, transliterations, and typos while preserving explainability and false-positive control?',
    formalObject: 'Search(q, L, V_s) -> ranked candidate set C with recall policy rho and precision guard gamma.',
    addressQlFunctions: ['ADDRESS_MATCH', 'ADDRESS_EXPLAIN_MATCH', 'ADDRESS_SIMILARITY', 'ADDRESS_SCORE', 'ADDRESS_ISSUES', 'ADDRESS_TRANSLATE'],
    mathFoundations: ['probability_theory', 'statistics', 'information_theory', 'computational_complexity', 'graph_theory'],
    requiredArtifacts: ['multilingual synthetic corpus', 'alias graph fixtures', 'ranking explanation schema', 'false-positive counterexamples'],
    nonClaims: ['High similarity is not identity.', 'Search recall does not prove completeness of world coverage.'],
  },
  {
    id: 'address_proof_authentication',
    title: 'Address proof and authentication theory',
    coreQuestion: 'Which address facts can be proven without disclosing the address, witness, private key, or raw evidence?',
    formalObject: 'ProofQuery = (envelope, claim, policy, roots) -> proof bundle; Verify(proof, policy, roots) -> decision.',
    addressQlFunctions: ['ADDRESS_COMMIT', 'ADDRESS_ENVELOPE_CREATE', 'ADDRESS_PROVE', 'ADDRESS_VERIFY_PROOF', 'ADDRESS_POLICY_CHECK', 'ADDRESS_HASH'],
    mathFoundations: ['cryptography', 'number_theory', 'predicate_logic', 'information_theory', 'computational_complexity'],
    requiredArtifacts: ['proof input schema', 'public signal schema', 'unsafe hash tests', 'revocation/freshness root fixtures'],
    nonClaims: ['Proof validity does not prove that address resolution was correct.', 'Plain address hashes are not privacy protection.'],
  },
  {
    id: 'geo_delivery_optimization',
    title: 'Geographic and delivery optimization theory',
    coreQuestion: 'How can AddressQL answer region, route, serviceability, and delivery cost questions with declared uncertainty?',
    formalObject: 'Deliverable(a, carrier, t, V_s) -> {available, reasons, confidence} over spatial graph G and service regions R.',
    addressQlFunctions: ['ADDRESS_WITHIN', 'GEOCODE', 'REVERSE_GEOCODE', 'ADDRESS_DISTANCE', 'DELIVERY_AVAILABLE', 'DELIVERY_AREA', 'DELIVERY_ESTIMATE', 'DELIVERY_RISK_SCORE'],
    mathFoundations: ['geometry', 'topology', 'graph_theory', 'optimization_theory', 'probability_theory', 'statistics'],
    requiredArtifacts: ['synthetic service-area fixture', 'island/exclave cases', 'region containment tests', 'delivery non-guarantee tests'],
    nonClaims: ['Delivery availability is not proof of residence.', 'Distance is metric-dependent and not route availability.'],
  },
  {
    id: 'address_version_history',
    title: 'Address version management and history theory',
    coreQuestion: 'How should AddressQL replay, compare, and audit results when administrative boundaries, postal codes, names, and source data change?',
    formalObject: 'F(x, V_s, t) -> y, with history graph H = (states, transitions, source versions).',
    addressQlFunctions: ['ADDRESS_SCHEMA', 'ADDRESS_NORMALIZE', 'ADDRESS_MATCH', 'POSTAL_VALIDATE', 'ADDRESS_POLICY_CHECK', 'ADDRESS_ACK'],
    mathFoundations: ['graph_theory', 'discrete_mathematics', 'predicate_logic', 'statistics', 'computational_complexity'],
    requiredArtifacts: ['source-version replay tests', 'deprecated schema fixtures', 'history transition model', 'audit-stable result schema'],
    nonClaims: ['A current source version does not erase historical validity.', 'Replay stability is scoped to a declared source version.'],
  },
  {
    id: 'distributed_address_database',
    title: 'Distributed address database theory',
    coreQuestion: 'How can multiple adapters, source packs, registries, and edge caches serve compatible AddressQL results without centralizing all data?',
    formalObject: 'Replica state S_i with source root r_i, conformance level L_i, and merge/audit function Merge(S_i, S_j).',
    addressQlFunctions: ['ADDRESS_SCHEMA', 'POSTAL_LOOKUP', 'DELIVERY_TOKEN_VERIFY', 'ADDRESS_VERIFY_PROOF', 'ADDRESS_POLICY_CHECK', 'ADDRESS_ACK'],
    mathFoundations: ['graph_theory', 'discrete_mathematics', 'cryptography', 'statistics', 'optimization_theory', 'predicate_logic'],
    requiredArtifacts: ['adapter conformance matrix', 'source-root manifest', 'cache invalidation fixtures', 'offline ACK fixtures'],
    nonClaims: ['Distributed compatibility is not global consensus on every address.', 'Edge caches must not store raw private addresses by default.'],
  },
  {
    id: 'addressql_query_theory',
    title: 'AddressQL query language theory',
    coreQuestion: 'What is the minimal safe query algebra for structured address functions across SQL and NoSQL adapters?',
    formalObject: 'AddressQL expression e ::= function(args) with typed result R, determinism d, source version V_s, and policy boundary P.',
    addressQlFunctions: ['ADDRESS_PARSE', 'ADDRESS_NORMALIZE', 'ADDRESS_MATCH', 'POSTAL_VALIDATE', 'DELIVERY_AVAILABLE', 'ADDRESS_POLICY_CHECK', 'ADDRESS_ACK'],
    mathFoundations: ['set_theory', 'predicate_logic', 'algebra', 'formal_language_theory', 'automata_theory', 'computational_complexity', 'optimization_theory'],
    requiredArtifacts: ['BNF grammar', 'typed result schemas', 'determinism tests', 'query rewrite safety rules'],
    nonClaims: ['AddressQL is not a new database engine.', 'A query result is not stronger than its declared source and policy.'],
  },
  {
    id: 'address_index_theory',
    title: 'Address index theory',
    coreQuestion: 'How should postal codes, coordinates, administrative units, landmarks, aliases, and commitments be combined into safe and efficient indexes?',
    formalObject: 'Index I = I_postal x I_geo x I_admin x I_alias x I_landmark x I_commit with leakage budget epsilon.',
    addressQlFunctions: ['POSTAL_LOOKUP', 'POSTAL_VALIDATE', 'ADDRESS_WITHIN', 'ADDRESS_DISTANCE', 'ADDRESS_MATCH', 'ADDRESS_COMMIT'],
    mathFoundations: ['information_theory', 'geometry', 'topology', 'graph_theory', 'optimization_theory', 'cryptography', 'computational_complexity'],
    requiredArtifacts: ['multi-index fixture', 'leakage budget notes', 'postal/no-postal fallback tests', 'landmark-plus-region search examples'],
    nonClaims: ['Indexes improve retrieval, not truth.', 'Commitment indexes need key and salt policy.'],
  },
];

export function buildAddressQlTheoryCoverageMatrix(): AddressQlTheoryCoverageRow[] {
  return ADDRESSQL_THEORY_DOMAINS.map(domain => ({
    domain: domain.id,
    functions: [...domain.addressQlFunctions],
    mathFoundations: [...domain.mathFoundations],
    artifactCount: domain.requiredArtifacts.length,
  }));
}

export function validateAddressQlTheory(): string[] {
  const errors: string[] = [];
  const functionNames = new Set(ADDRESSQL_FUNCTION_SPECS.map(spec => spec.name));
  const foundationIds = new Set(ADDRESSQL_MATHEMATICAL_FOUNDATIONS.map(foundation => foundation.id));
  const domainIds = new Set<AddressQlResearchDomainId>();
  const coveredFoundations = new Set<AddressQlMathFoundationId>();

  for (const domain of ADDRESSQL_THEORY_DOMAINS) {
    if (domainIds.has(domain.id)) errors.push(`duplicate domain: ${domain.id}`);
    domainIds.add(domain.id);
    if (domain.addressQlFunctions.length < 4) errors.push(`${domain.id}: needs at least four AddressQL functions`);
    if (domain.mathFoundations.length < 4) errors.push(`${domain.id}: needs at least four mathematical foundations`);
    if (domain.requiredArtifacts.length < 3) errors.push(`${domain.id}: needs executable artifacts`);
    if (domain.nonClaims.length === 0) errors.push(`${domain.id}: missing non-claims`);
    for (const functionName of domain.addressQlFunctions) {
      if (!functionNames.has(functionName)) errors.push(`${domain.id}: unknown function ${functionName}`);
    }
    for (const foundation of domain.mathFoundations) {
      if (!foundationIds.has(foundation)) errors.push(`${domain.id}: unknown foundation ${foundation}`);
      coveredFoundations.add(foundation);
    }
  }

  for (const requiredDomain of [
    'address_morphism_normalization',
    'address_search_multilingual',
    'address_proof_authentication',
    'geo_delivery_optimization',
    'address_version_history',
    'distributed_address_database',
    'addressql_query_theory',
    'address_index_theory',
  ] as const) {
    if (!domainIds.has(requiredDomain)) errors.push(`missing requested theory domain: ${requiredDomain}`);
  }

  for (const foundation of ADDRESSQL_MATHEMATICAL_FOUNDATIONS) {
    if (!coveredFoundations.has(foundation.id)) errors.push(`unmapped mathematical foundation: ${foundation.id}`);
  }

  const queryTheory = ADDRESSQL_THEORY_DOMAINS.find(domain => domain.id === 'addressql_query_theory');
  if (!queryTheory?.mathFoundations.includes('formal_language_theory')) {
    errors.push('AddressQL query theory must include formal language theory');
  }
  if (!queryTheory?.mathFoundations.includes('predicate_logic')) {
    errors.push('AddressQL query theory must include predicate logic');
  }

  const proofTheory = ADDRESSQL_THEORY_DOMAINS.find(domain => domain.id === 'address_proof_authentication');
  if (!proofTheory?.mathFoundations.includes('cryptography')) {
    errors.push('Address proof theory must include cryptography');
  }
  if (!proofTheory?.addressQlFunctions.includes('ADDRESS_HASH')) {
    errors.push('Address proof theory must include unsafe hash boundary');
  }

  return errors;
}
