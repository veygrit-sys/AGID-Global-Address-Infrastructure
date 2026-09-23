import { ADDRESSQL_FUNCTION_SPECS, type AddressQlFunctionSpec } from './addressQlResearch';

export const ADDRESSQL_SPECIFICATION_VERSION = 'addressql-specification-v0.1';

export type AddressQlAdapterLevel = 'L0_registry' | 'L1_structure' | 'L2_matching_postal' | 'L3_delivery_communication' | 'L4_proof_privacy';

export type AddressQlTechStackLayer =
  | 'specification'
  | 'reference_core'
  | 'sql_adapter'
  | 'nosql_adapter'
  | 'geospatial_data'
  | 'mobility_logistics'
  | 'proof_privacy'
  | 'planner_compiler'
  | 'conformance'
  | 'developer_tools';

export type AddressQlTechStackItem = {
  layer: AddressQlTechStackLayer;
  packageName: string;
  primaryTechnology: string;
  role: string;
  ossBoundary: string;
};

export type AddressQlAdapterTarget = {
  target: string;
  packageName: string;
  targetLevel: AddressQlAdapterLevel;
  executionModel: string;
  storageShape: string;
  firstReleaseRole: string;
  limitations: string[];
};

export type AddressQlOutputKindDefinition = {
  outputKind: string;
  resultShape: string[];
  privacyBoundary: string;
  schemaRef?: string;
};

export const ADDRESSQL_SCHEMA_BINDINGS = {
  canonicalAddressObject: 'docs/specs/schemas/address-object-v0.1.schema.json',
  postalValidationResult: 'docs/specs/schemas/address-validation-result-v0.1.schema.json',
} as const;

export type AddressQlFunctionRegistryRow = {
  name: string;
  sqlSignature: string;
  phase: AddressQlFunctionSpec['phase'];
  category: AddressQlFunctionSpec['category'];
  determinism: AddressQlFunctionSpec['determinism'];
  outputKind: string;
  privacyRisk: AddressQlFunctionSpec['privacyRisk'];
  compatibleWith: string;
};

export const ADDRESSQL_TECH_STACK: AddressQlTechStackItem[] = [
  {
    layer: 'specification',
    packageName: 'addressql-spec',
    primaryTechnology: 'Markdown, JSON Schema, SQL examples',
    role: 'Defines function contracts, result schemas, determinism rules, and adapter levels.',
    ossBoundary: 'Public specification, no private address fixtures.',
  },
  {
    layer: 'reference_core',
    packageName: 'addressql-core-js',
    primaryTechnology: 'TypeScript',
    role: 'Reference implementation for registry validation, JSON result shaping, policy checks, and synthetic fixtures.',
    ossBoundary: 'Open-source reference logic; production source data remains separately licensed.',
  },
  {
    layer: 'reference_core',
    packageName: 'addressql-core',
    primaryTechnology: 'Rust',
    role: 'Pure PostgreSQL-independent core for country, postal, normalization, matching, distance, delivery, SQLite, WASM, and SDK adapters.',
    ossBoundary: 'No PostgreSQL/PostGIS/network dependency; adapters render typed structs into JSONB, BSON, protobuf, or SDK-native outputs.',
  },
  {
    layer: 'sql_adapter',
    packageName: 'addressql-postgres',
    primaryTechnology: 'PostgreSQL SQL functions, JSONB, optional PostGIS',
    role: 'First full SQL adapter target with source-version tables and JSONB outputs.',
    ossBoundary: 'No hosted service dependency in conformance tests.',
  },
  {
    layer: 'sql_adapter',
    packageName: 'addressql-duckdb',
    primaryTechnology: 'DuckDB SQL macros, CSV/Parquet-style local fixtures, analysis views',
    role: 'Local analytics and research adapter for source-pack audits, postal-gap reports, and benchmark corpora.',
    ossBoundary: 'Read-oriented and local-first; no production traffic or private address corpora in public fixtures.',
  },
  {
    layer: 'sql_adapter',
    packageName: 'addressql-sqlite',
    primaryTechnology: 'SQLite loadable extension or WASM-backed local functions',
    role: 'Local-first adapter for offline validation, mobile, CLI, and test fixtures.',
    ossBoundary: 'Must run without external network access.',
  },
  {
    layer: 'sql_adapter',
    packageName: 'addressql-mysql',
    primaryTechnology: 'MySQL UDF/stored-function facade',
    role: 'Compatibility adapter for structure, normalization, postal, and matching functions.',
    ossBoundary: 'Proof and carrier-token functions can be delegated to SDK layer.',
  },
  {
    layer: 'nosql_adapter',
    packageName: 'addressql-nosql-sdk',
    primaryTechnology: 'MongoDB/Firestore/DynamoDB SDK wrappers',
    role: 'Provides query-safe wrappers where native custom SQL functions are unavailable.',
    ossBoundary: 'No claim of identical query planner behavior across NoSQL engines.',
  },
  {
    layer: 'geospatial_data',
    packageName: 'addressql-source-packs',
    primaryTechnology: 'AGID region refs, postal catalogs, GeoJSON/JSON source manifests',
    role: 'Supplies source-versioned evidence for postal, region, and delivery functions.',
    ossBoundary: 'Third-party data licenses remain separate and must be attributed.',
  },
  {
    layer: 'mobility_logistics',
    packageName: 'addressql-mobility-kernel',
    primaryTechnology: 'Source-versioned road graphs, synthetic congestion fixtures, queueing models',
    role: 'Defines congestion score, bottleneck, travel-time, reachability, and delivery-difficulty semantics.',
    ossBoundary: 'Public fixtures must be synthetic or open data and must not expose live user movement traces.',
  },
  {
    layer: 'proof_privacy',
    packageName: 'addressql-proof-hooks',
    primaryTechnology: 'AMT Envelope, proof policy schemas, ZK-ready proof bundle adapters',
    role: 'Provides envelope-based proof and verification surfaces without claiming audited circuits in v0.1.',
    ossBoundary: 'No raw address, witness, private key, or proof secret in public fixtures.',
  },
  {
    layer: 'developer_tools',
    packageName: 'addressql-js-ts',
    primaryTechnology: 'TypeScript',
    role: 'Web, Node.js, Address Login, and developer tooling SDK for the v0.4 parity surface.',
    ossBoundary: 'Local-first synthetic fixtures only; no hosted API dependency.',
  },
  {
    layer: 'developer_tools',
    packageName: 'addressql-py',
    primaryTechnology: 'Python',
    role: 'Research notebook, source-pack preparation, and benchmark corpus SDK.',
    ossBoundary: 'No production datasets or raw recipient fixtures in public tests.',
  },
  {
    layer: 'developer_tools',
    packageName: 'addressql-rs',
    primaryTechnology: 'Rust',
    role: 'Native SDK facade over addressql-core for adapters and high-performance embedding.',
    ossBoundary: 'Reuses addressql-core and must not fork divergent semantics.',
  },
  {
    layer: 'planner_compiler',
    packageName: 'addressql-calcite-planner',
    primaryTechnology: 'Apache Calcite, Java (deferred)',
    role: 'Deferred custom SQL dialect, relational algebra, adapter SQL emitter, and cost-based optimizer once activation gates are met.',
    ossBoundary: 'No runtime dependency until activation gates are met; no raw address, witness, or production fixture data.',
  },
  {
    layer: 'conformance',
    packageName: 'addressql-conformance',
    primaryTechnology: 'Golden fixtures, adapter matrix, node:test',
    role: 'Checks function registry coverage, determinism, unsafe-hash warnings, and non-claims.',
    ossBoundary: 'Synthetic fixtures only for public tests.',
  },
  {
    layer: 'developer_tools',
    packageName: 'addressql-cli',
    primaryTechnology: 'TypeScript CLI',
    role: 'Runs local function checks, fixture export, adapter smoke tests, and documentation generation.',
    ossBoundary: 'Local-first and no production traffic by default.',
  },
];

export const ADDRESSQL_ADAPTER_TARGETS: AddressQlAdapterTarget[] = [
  {
    target: 'PostgreSQL',
    packageName: 'addressql-postgres',
    targetLevel: 'L4_proof_privacy',
    executionModel: 'SQL functions returning JSONB plus optional PostGIS-backed region operations.',
    storageShape: 'addressql_sources, addressql_country_schema, addressql_cache, JSONB result columns.',
    firstReleaseRole: 'Primary full adapter.',
    limitations: ['Carrier live estimates remain volatile and should be stubbed in conformance.', 'Proof generation may call a local proof hook rather than run inside PostgreSQL.'],
  },
  {
    target: 'SQLite',
    packageName: 'addressql-sqlite',
    targetLevel: 'L3_delivery_communication',
    executionModel: 'Loadable extension, WASM-backed UDF, or application-defined functions.',
    storageShape: 'Local source pack tables and JSON result blobs.',
    firstReleaseRole: 'Offline/local reference adapter.',
    limitations: ['Proof hooks are verify-only or stubbed in v0.1.', 'Large global source packs may need external packaging.'],
  },
  {
    target: 'DuckDB',
    packageName: 'addressql-duckdb',
    targetLevel: 'L2_matching_postal',
    executionModel: 'SQL macros and analysis views over local CSV, JSON, or Parquet-like source packs.',
    storageShape: 'DuckDB views over synthetic fixture tables and local analytical datasets.',
    firstReleaseRole: 'Research, benchmark, and local source-pack validation adapter.',
    limitations: ['Not the primary production transaction adapter.', 'Proof hooks are out of scope in v0.3.', 'Spatial extension use is optional and must degrade to fixture-safe scalar logic.'],
  },
  {
    target: 'MySQL',
    packageName: 'addressql-mysql',
    targetLevel: 'L2_matching_postal',
    executionModel: 'Stored functions or UDF facade for deterministic functions.',
    storageShape: 'JSON results and source-version tables.',
    firstReleaseRole: 'Compatibility adapter after PostgreSQL and SQLite.',
    limitations: ['Advanced proof and communication functions likely delegate to SDK.', 'Geospatial behavior differs by deployment.'],
  },
  {
    target: 'MongoDB',
    packageName: 'addressql-nosql-sdk',
    targetLevel: 'L2_matching_postal',
    executionModel: 'SDK-side functions with optional aggregation pre/post-processing.',
    storageShape: 'BSON documents using AddressQL canonical result schemas.',
    firstReleaseRole: 'Document database compatibility target.',
    limitations: ['Not every function can run natively in aggregation pipelines.', 'Determinism must be enforced by SDK conformance.'],
  },
  {
    target: 'Firestore',
    packageName: 'addressql-nosql-sdk',
    targetLevel: 'L1_structure',
    executionModel: 'SDK-side validation and denormalized indexed fields.',
    storageShape: 'Documents with stored AddressQL outputs and source_version.',
    firstReleaseRole: 'Mobile/web app storage compatibility.',
    limitations: ['No native custom query functions.', 'Use precomputed outputs for queries.'],
  },
  {
    target: 'DynamoDB',
    packageName: 'addressql-nosql-sdk',
    targetLevel: 'L1_structure',
    executionModel: 'SDK-side normalization and key design helpers.',
    storageShape: 'Partition/sort keys plus stored AddressQL JSON outputs.',
    firstReleaseRole: 'Serverless compatibility target.',
    limitations: ['No native custom query functions.', 'Use materialized policy-safe fields.'],
  },
];

export const ADDRESSQL_OUTPUT_KIND_DEFINITIONS: AddressQlOutputKindDefinition[] = [
  { outputKind: 'AddressComponents', resultShape: ['country', 'admin parts', 'locality parts', 'street parts', 'building parts', 'metadata'], privacyBoundary: 'May contain private unit fields; apply policy before logging.' },
  { outputKind: 'NormalizedAddressExpression', resultShape: ['normalized_text', 'country', 'locale', 'source_version', 'warnings'], privacyBoundary: 'Normalized text can still be personal data.' },
  { outputKind: 'ComponentValue', resultShape: ['component', 'value', 'confidence', 'source_version'], privacyBoundary: 'Room/unit components require restricted handling.' },
  { outputKind: 'CountryAddressSchema', resultShape: ['country', 'schema_version', 'ordered_components', 'required_components', 'locale_rules'], privacyBoundary: 'Schema alone should not contain private address data.' },
  { outputKind: 'CountryResolution', resultShape: ['input', 'country_code', 'standard', 'confidence', 'source_version', 'warnings'], privacyBoundary: 'Country resolution is not sovereignty adjudication.' },
  { outputKind: 'CountryAddressProfile', resultShape: ['country', 'address_order', 'required_components', 'locales', 'postal_status', 'source_version'], privacyBoundary: 'Profile is metadata and not full address coverage.' },
  { outputKind: 'CountrySubdivisionSet', resultShape: ['country', 'level', 'subdivisions', 'source_version', 'warnings'], privacyBoundary: 'Subdivision metadata can include disputed or sensitive place names; expose source policy.' },
  { outputKind: 'CountryLanguagePolicy', resultShape: ['country', 'input_locales', 'display_locales', 'transliteration', 'source_version'], privacyBoundary: 'Language policy must not infer user identity.' },
  { outputKind: 'CountryPostalStatus', resultShape: ['country', 'status', 'requiredness', 'coverage', 'source_version', 'warnings'], privacyBoundary: 'Postal status is operational metadata and not a complete postal dataset.' },
  { outputKind: 'CountrySourcePolicy', resultShape: ['country', 'preferred_sources', 'fallback_sources', 'license_notes', 'source_version'], privacyBoundary: 'Source policy is evidence ranking, not political recognition.' },
  { outputKind: 'CanonicalAddressObject', resultShape: ['version', 'object_kind', 'expression', 'country', 'components', 'referent', 'identifiers', 'quality_state', 'evidence', 'privacy', 'validation_links'], privacyBoundary: 'Canonical address objects must be tokenized or policy-bound before logging or disclosure.', schemaRef: ADDRESSQL_SCHEMA_BINDINGS.canonicalAddressObject },
  { outputKind: 'FormattedAddressText', resultShape: ['formatted', 'country', 'locale', 'source_version'], privacyBoundary: 'Formatted output may be raw address disclosure.' },
  { outputKind: 'LocalizedAddressExpression', resultShape: ['localized_text', 'locale', 'transliteration', 'warnings'], privacyBoundary: 'Translation is not anonymization.' },
  { outputKind: 'BooleanMatchDecision', resultShape: ['match', 'confidence', 'purpose', 'source_version'], privacyBoundary: 'Match decisions can reveal relationship between records.' },
  { outputKind: 'MatchExplanation', resultShape: ['match', 'confidence', 'matched_components', 'missing_components', 'evidence', 'non_claims'], privacyBoundary: 'Explanations must avoid private evidence disclosure.' },
  { outputKind: 'SimilarityScore', resultShape: ['score', 'purpose', 'method', 'source_version'], privacyBoundary: 'Scores can support linkage and need access control.' },
  { outputKind: 'QualityScore', resultShape: ['score', 'issues', 'quality_state', 'source_version'], privacyBoundary: 'Quality is not identity verification.' },
  { outputKind: 'AddressIssueList', resultShape: ['issues', 'severity', 'repair_hints', 'non_claims'], privacyBoundary: 'Repair hints must not reveal hidden source data.' },
  { outputKind: 'PostalValidationResult', resultShape: ['version', 'purpose', 'status', 'confidence', 'source_refs', 'field_results', 'result_boundaries', 'privacy', 'non_claims'], privacyBoundary: 'Postal validity is purpose-bound and is not full address identity, delivery availability, or residence proof.', schemaRef: ADDRESSQL_SCHEMA_BINDINGS.postalValidationResult },
  { outputKind: 'PostalSystemStatus', resultShape: ['country', 'status', 'requiredness', 'format_available', 'coverage', 'source_version'], privacyBoundary: 'Postal status is not carrier availability or address identity.' },
  { outputKind: 'PostalCodeFormat', resultShape: ['country', 'pattern', 'examples', 'normalization_rules', 'source_version'], privacyBoundary: 'Format metadata is safe only if examples are synthetic.' },
  { outputKind: 'NormalizedPostalCode', resultShape: ['input', 'normalized', 'country', 'warnings', 'source_version'], privacyBoundary: 'Normalized postal code can still reveal coarse location.' },
  { outputKind: 'PostalCodeComponents', resultShape: ['country', 'components', 'normalized', 'source_version'], privacyBoundary: 'Postal components are candidates, not assigned-code proof.' },
  { outputKind: 'PostalRequirementDecision', resultShape: ['required', 'purpose', 'country', 'reasons', 'source_version'], privacyBoundary: 'Requiredness is purpose-relative and not a universal legal statement.' },
  { outputKind: 'PostalCandidateSet', resultShape: ['postal_code', 'country', 'candidate_regions', 'source_version'], privacyBoundary: 'Candidates are coarse, not household addresses.' },
  { outputKind: 'PostalAreaRef', resultShape: ['postal_code', 'country', 'region_refs', 'coverage_shape', 'source_version'], privacyBoundary: 'Postal areas may reveal coarse location and may be approximate.' },
  { outputKind: 'PostalEquivalentRegion', resultShape: ['region_ref', 'policy', 'confidence', 'source_version', 'non_claims'], privacyBoundary: 'Postal-equivalent regions are fallback operational regions, not official postal codes.' },
  { outputKind: 'PostalSuggestionSet', resultShape: ['suggestions', 'confidence', 'repair_hints', 'source_version'], privacyBoundary: 'Suggestions must not overwrite user intent without confirmation.' },
  { outputKind: 'RegionMembershipDecision', resultShape: ['within', 'region_ref', 'confidence', 'source_version'], privacyBoundary: 'Region membership can be sensitive at fine granularity.' },
  { outputKind: 'GeoCandidateSet', resultShape: ['candidates', 'precision', 'source_version', 'warnings'], privacyBoundary: 'Coordinates may be highly sensitive.' },
  { outputKind: 'ReverseGeoCandidateSet', resultShape: ['lat', 'lon', 'candidate_addresses', 'precision', 'source_version'], privacyBoundary: 'Reverse geocoding may infer private location.' },
  { outputKind: 'DistanceEstimate', resultShape: ['distance', 'unit', 'metric', 'confidence'], privacyBoundary: 'Distance does not imply route or identity.' },
  { outputKind: 'TravelTimeEstimate', resultShape: ['origin_ref', 'target_ref', 'mode', 'time_window', 'estimated_minutes', 'confidence', 'source_version'], privacyBoundary: 'Travel-time output is operational metadata and must not expose individual movement traces.' },
  { outputKind: 'CongestionScore', resultShape: ['region_ref', 'time_window', 'mode', 'score', 'drivers', 'source_version'], privacyBoundary: 'Congestion is area-level decision support, not person tracking or safety classification.' },
  { outputKind: 'DeliveryDifficultyScore', resultShape: ['address_ref', 'carrier', 'service_level', 'score', 'factors', 'non_claims'], privacyBoundary: 'Difficulty scores must not become blacklists or hidden denial rules.' },
  { outputKind: 'ReachabilityDecision', resultShape: ['reachable', 'minutes', 'mode', 'time_window', 'constraints', 'source_version'], privacyBoundary: 'Reachability can reveal operational capability and should be policy-limited.' },
  { outputKind: 'BottleneckSet', resultShape: ['region_ref', 'radius', 'mode', 'bottlenecks', 'source_version', 'warnings'], privacyBoundary: 'Bottleneck disclosure can expose sensitive facility or access constraints.' },
  { outputKind: 'DeliveryAvailabilityDecision', resultShape: ['available', 'carrier', 'service_level', 'reasons', 'source_version'], privacyBoundary: 'Deliverability is not residence proof.' },
  { outputKind: 'DeliveryAreaRef', resultShape: ['delivery_area', 'carrier', 'region_ref', 'source_version'], privacyBoundary: 'Delivery area can reveal coarse location.' },
  { outputKind: 'DeliveryEstimate', resultShape: ['days', 'price', 'currency', 'carrier', 'expires_at'], privacyBoundary: 'Live estimates are volatile and should not be overclaimed.' },
  { outputKind: 'DeliveryRiskScore', resultShape: ['score', 'risk_factors', 'non_claims'], privacyBoundary: 'Risk scores must not become blacklists.' },
  { outputKind: 'AddressCommunicationToken', resultShape: ['token_id', 'audience', 'purpose', 'expires_at', 'disclosure_level'], privacyBoundary: 'Token must not imply merchant raw-address access.' },
  { outputKind: 'TokenVerificationDecision', resultShape: ['valid', 'ack_state', 'reasons', 'non_claims'], privacyBoundary: 'Token validity cannot repair bad resolution.' },
  { outputKind: 'MaskedAddress', resultShape: ['masked', 'level', 'warnings'], privacyBoundary: 'Masking is not anonymization.' },
  { outputKind: 'UnsafeAddressHash', resultShape: ['hash', 'warning'], privacyBoundary: 'Unsafe by default; dictionary-attackable.' },
  { outputKind: 'AddressCommitment', resultShape: ['commitment', 'domain', 'algorithm', 'salt_policy'], privacyBoundary: 'Commitments need domain separation and salt policy.' },
  { outputKind: 'AMTCompatibleEnvelope', resultShape: ['envelope_version', 'referent_commitment', 'state', 'roots', 'allowed_predicates'], privacyBoundary: 'Envelope is not raw address disclosure.' },
  { outputKind: 'AddressProofBundle', resultShape: ['proof_type', 'claim', 'public_signals', 'roots', 'expires_at'], privacyBoundary: 'Proof bundle must not store witness or private keys.' },
  { outputKind: 'ProofVerificationDecision', resultShape: ['verified', 'claim', 'reasons', 'non_claims'], privacyBoundary: 'Verification proves relation only.' },
  { outputKind: 'SelectiveDisclosureResult', resultShape: ['level', 'disclosed_fields', 'redactions', 'policy_id'], privacyBoundary: 'Disclosure must not exceed policy.' },
  { outputKind: 'PolicyDecision', resultShape: ['allowed', 'reasons', 'max_disclosure', 'retention_days'], privacyBoundary: 'Policy approval is not raw address disclosure.' },
  { outputKind: 'SemanticAck', resultShape: ['ack_state', 'message_id', 'reasons', 'non_claims'], privacyBoundary: 'ACK is not residence, ownership, or sovereignty proof.' },
];

export function buildAddressQlFunctionRegistryRows(): AddressQlFunctionRegistryRow[] {
  return ADDRESSQL_FUNCTION_SPECS.map(spec => ({
    name: spec.name,
    sqlSignature: `${spec.name}(${spec.inputs.join(', ')}) -> ${spec.outputKind}`,
    phase: spec.phase,
    category: spec.category,
    determinism: spec.determinism,
    outputKind: spec.outputKind,
    privacyRisk: spec.privacyRisk,
    compatibleWith: spec.compatibleWith.join(', '),
  }));
}

export function findMissingAddressQlOutputDefinitions(): string[] {
  const defined = new Set(ADDRESSQL_OUTPUT_KIND_DEFINITIONS.map(item => item.outputKind));
  return ADDRESSQL_FUNCTION_SPECS.map(spec => spec.outputKind).filter(outputKind => !defined.has(outputKind));
}

export function validateAddressQlSpecification(): string[] {
  const errors: string[] = [];
  const layers = new Set(ADDRESSQL_TECH_STACK.map(item => item.layer));
  const adapterTargets = new Set(ADDRESSQL_ADAPTER_TARGETS.map(item => item.target));
  const outputKinds = new Set(ADDRESSQL_OUTPUT_KIND_DEFINITIONS.map(item => item.outputKind));

  for (const required of ['specification', 'reference_core', 'sql_adapter', 'nosql_adapter', 'geospatial_data', 'mobility_logistics', 'proof_privacy', 'conformance', 'developer_tools'] as const) {
    if (!layers.has(required)) errors.push(`missing tech stack layer: ${required}`);
  }

  for (const target of ['PostgreSQL', 'SQLite', 'DuckDB', 'MySQL', 'MongoDB', 'Firestore', 'DynamoDB']) {
    if (!adapterTargets.has(target)) errors.push(`missing adapter target: ${target}`);
  }

  const postgres = ADDRESSQL_ADAPTER_TARGETS.find(item => item.target === 'PostgreSQL');
  if (postgres?.targetLevel !== 'L4_proof_privacy') errors.push('PostgreSQL must be the L4 target');

  const sqlite = ADDRESSQL_ADAPTER_TARGETS.find(item => item.target === 'SQLite');
  if (sqlite?.targetLevel !== 'L3_delivery_communication') errors.push('SQLite must be the local L3 target');

  for (const spec of ADDRESSQL_FUNCTION_SPECS) {
    if (!outputKinds.has(spec.outputKind)) errors.push(`missing output definition for ${spec.outputKind}`);
  }

  if (findMissingAddressQlOutputDefinitions().length > 0) {
    errors.push('some function output kinds lack schema definitions');
  }

  const rows = buildAddressQlFunctionRegistryRows();
  if (rows.length !== ADDRESSQL_FUNCTION_SPECS.length) errors.push('function registry row count mismatch');
  if (!rows.every(row => row.sqlSignature.includes('->'))) errors.push('function registry rows need SQL signatures');

  return errors;
}
