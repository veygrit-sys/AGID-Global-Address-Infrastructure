import { ADDRESSQL_FUNCTION_SPECS } from './addressQlResearch';

export const ADDRESSQL_CROSS_CUTTING_LAYERS_VERSION = 'addressql-cross-cutting-layers-v0.1';

export type AddressQlCrossCuttingLayerId =
  | 'security_privacy_zk'
  | 'linguistics_multilingual_nlp'
  | 'standards_interoperability'
  | 'governance_source_policy'
  | 'temporal_versioning'
  | 'developer_experience_conformance'
  | 'ux_address_forms';

export type AddressQlCrossCuttingLayer = {
  id: AddressQlCrossCuttingLayerId;
  priority: number;
  title: string;
  purpose: string;
  whyNeeded: string;
  addressQlFunctions: string[];
  requiredArtifacts: string[];
  releaseGates: string[];
  nonClaims: string[];
};

export type AddressQlCrossCuttingCoverageRow = {
  id: AddressQlCrossCuttingLayerId;
  priority: number;
  functionCount: number;
  artifactCount: number;
  gateCount: number;
};

export const ADDRESSQL_CROSS_CUTTING_LAYERS: AddressQlCrossCuttingLayer[] = [
  {
    id: 'security_privacy_zk',
    priority: 1,
    title: 'Security, privacy, and ZK boundary',
    purpose: 'Keep raw addresses, commitments, proof bundles, receiver policies, and unsafe-hash behavior inside explicit privacy boundaries.',
    whyNeeded: 'AddressQL touches personal and location data.  A database function surface without privacy gates would be dangerous even if the matching logic is correct.',
    addressQlFunctions: ['ADDRESS_COMMIT', 'ADDRESS_ENVELOPE_CREATE', 'ADDRESS_PROVE', 'ADDRESS_VERIFY_PROOF', 'ADDRESS_POLICY_CHECK', 'ADDRESS_HASH'],
    requiredArtifacts: ['proof input schema', 'public signal schema', 'unsafe hash counterexamples', 'no raw address fixture scan', 'verifier policy examples'],
    releaseGates: ['ADDRESS_HASH must remain discouraged', 'proof functions must use envelope inputs', 'no witness/private key/raw address in public fixtures', 'policy check before proof generation'],
    nonClaims: ['ZK verification does not repair incorrect address resolution.', 'A commitment is not privacy-safe without salt, domain separation, and storage policy.'],
  },
  {
    id: 'linguistics_multilingual_nlp',
    priority: 2,
    title: 'Linguistics, multilingual, and NLP layer',
    purpose: 'Handle scripts, transliteration, aliases, abbreviations, local order, historical names, and native-language/English workflows.',
    whyNeeded: 'Global addresses are language-shaped.  Without this layer, AddressQL degenerates into English-centric string matching.',
    addressQlFunctions: ['ADDRESS_PARSE', 'ADDRESS_NORMALIZE', 'ADDRESS_TRANSLATE', 'ADDRESS_FORMAT', 'COUNTRY_LANGUAGES', 'ADDRESS_MATCH', 'ADDRESS_EXPLAIN_MATCH'],
    requiredArtifacts: ['country language policy fixture', 'transliteration examples', 'alias graph fixture', 'multilingual false-positive counterexamples', 'dual-display form examples'],
    releaseGates: ['language choice must not imply nationality or identity', 'translations must carry source_version', 'multilingual search must expose explanation and non-claims'],
    nonClaims: ['Translation improves communication and recall; it does not prove identity.', 'Native-language display is not proof of residence or nationality.'],
  },
  {
    id: 'standards_interoperability',
    priority: 3,
    title: 'Standards and interoperability layer',
    purpose: 'Keep AddressQL compatible with existing data formats, APIs, identity credentials, and geospatial/address standards without becoming dependent on one vendor.',
    whyNeeded: 'Open-source adoption depends on predictable schemas, adapters, and conformance surfaces that other systems can implement.',
    addressQlFunctions: ['COUNTRY_RESOLVE', 'COUNTRY_ADDRESS_PROFILE', 'ADDRESS_SCHEMA', 'ADDRESS_ENVELOPE_CREATE', 'ADDRESS_ACK', 'POSTAL_STATUS'],
    requiredArtifacts: ['JSON Schema outputs', 'OpenAPI examples', 'SQL signature registry', 'adapter conformance matrix', 'AMT/AGID/ZK compatibility notes'],
    releaseGates: ['all outputs must have JSON-compatible schemas', 'adapters must declare conformance level', 'compatibility must be documented as boundary rather than ownership'],
    nonClaims: ['Interoperability is not certification.', 'Standards mapping does not guarantee full country data coverage.'],
  },
  {
    id: 'governance_source_policy',
    priority: 4,
    title: 'Governance, source policy, and licensing layer',
    purpose: 'Rank official, open, community, AGID, carrier, and manual-review sources by purpose, license, freshness, and quality.',
    whyNeeded: 'Address data is political, licensed, uneven, and sometimes disputed.  AddressQL must expose source policy rather than hide it.',
    addressQlFunctions: ['COUNTRY_SOURCE_POLICY', 'COUNTRY_SUBDIVISIONS', 'COUNTRY_POSTAL_STATUS', 'POSTAL_STATUS', 'ADDRESS_POLICY_CHECK', 'ADDRESS_ACK'],
    requiredArtifacts: ['source policy schema', 'license attribution fields', 'source confidence taxonomy', 'disputed/ambiguous source fixture', 'manual review policy'],
    releaseGates: ['source policy must not adjudicate sovereignty', 'third-party licenses must be declared', 'low-confidence source decisions must expose manual_review_required'],
    nonClaims: ['Source policy is evidence ranking, not political recognition.', 'Official source preference is not proof that data is complete.'],
  },
  {
    id: 'temporal_versioning',
    priority: 5,
    title: 'Temporal and versioning layer',
    purpose: 'Make source versions, valid time, transaction time, postal changes, administrative changes, and replay semantics first-class.',
    whyNeeded: 'Addresses change.  A correct result today may not replay correctly without the source version and time context.',
    addressQlFunctions: ['ADDRESS_SCHEMA', 'ADDRESS_NORMALIZE', 'ADDRESS_MATCH', 'POSTAL_VALIDATE', 'DELIVERY_AVAILABLE', 'ADDRESS_ACK'],
    requiredArtifacts: ['source-version replay fixture', 'valid_time/transaction_time schema', 'deprecated subdivision example', 'postal-code change example', 'temporal ACK example'],
    releaseGates: ['stable_by_source_version functions must replay', 'volatile functions must expose time/root/token context', 'old results must not be silently rewritten'],
    nonClaims: ['Current source data does not erase historical validity.', 'Replay stability is scoped to declared source version and policy.'],
  },
  {
    id: 'developer_experience_conformance',
    priority: 6,
    title: 'Developer experience and conformance layer',
    purpose: 'Provide clear SDKs, fixtures, CLI checks, adapter levels, SQL examples, and failure explanations.',
    whyNeeded: 'Research quality is not enough for adoption.  Developers need repeatable tests and simple integration paths.',
    addressQlFunctions: ['ADDRESS_PARSE', 'ADDRESS_NORMALIZE', 'ADDRESS_MATCH', 'POSTAL_VALIDATE', 'DELIVERY_AVAILABLE', 'ADDRESS_VERIFY_PROOF', 'ADDRESS_ACK'],
    requiredArtifacts: ['conformance CLI', 'golden synthetic fixtures', 'PostgreSQL smoke tests', 'SQLite offline tests', 'SDK example suite'],
    releaseGates: ['public tests must be synthetic', 'every adapter must declare unsupported functions', 'docs must show copy-pasteable examples'],
    nonClaims: ['Conformance tests do not certify production data quality.', 'SDK parity does not imply identical database query planners.'],
  },
  {
    id: 'ux_address_forms',
    priority: 7,
    title: 'UX and address form layer',
    purpose: 'Turn country profiles, postal status, language policy, and validation results into safe form behavior.',
    whyNeeded: 'AddressQL will often be experienced through Address Login and global forms.  Poor UX can corrupt data even when the backend is correct.',
    addressQlFunctions: ['COUNTRY_RESOLVE', 'COUNTRY_ADDRESS_PROFILE', 'COUNTRY_LANGUAGES', 'ADDRESS_SCHEMA', 'POSTAL_REQUIRED', 'POSTAL_SUGGEST', 'ADDRESS_ISSUES'],
    requiredArtifacts: ['country selector fixture', 'native/English dual-form examples', 'no-postal-code form behavior', 'weak-postal warning copy', 'manual review state examples'],
    releaseGates: ['forms must not invent postal codes', 'suggestions must not overwrite user intent silently', 'country ambiguity must not be guessed'],
    nonClaims: ['Form completion is not address verification.', 'A user-selected country is not identity or nationality proof.'],
  },
];

export function buildAddressQlCrossCuttingCoverage(): AddressQlCrossCuttingCoverageRow[] {
  return ADDRESSQL_CROSS_CUTTING_LAYERS.map(layer => ({
    id: layer.id,
    priority: layer.priority,
    functionCount: layer.addressQlFunctions.length,
    artifactCount: layer.requiredArtifacts.length,
    gateCount: layer.releaseGates.length,
  }));
}

export function validateAddressQlCrossCuttingLayers(): string[] {
  const errors: string[] = [];
  const functionNames = new Set(ADDRESSQL_FUNCTION_SPECS.map(spec => spec.name));
  const priorities = ADDRESSQL_CROSS_CUTTING_LAYERS.map(layer => layer.priority);

  for (let index = 0; index < priorities.length; index += 1) {
    const expected = index + 1;
    if (priorities[index] !== expected) errors.push(`priority ${expected} is missing or out of order`);
  }

  for (const layer of ADDRESSQL_CROSS_CUTTING_LAYERS) {
    if (layer.addressQlFunctions.length < 5) errors.push(`${layer.id}: needs at least five functions`);
    if (layer.requiredArtifacts.length < 4) errors.push(`${layer.id}: needs at least four artifacts`);
    if (layer.releaseGates.length < 3) errors.push(`${layer.id}: needs at least three release gates`);
    if (layer.nonClaims.length < 2) errors.push(`${layer.id}: needs at least two non-claims`);
    for (const functionName of layer.addressQlFunctions) {
      if (!functionNames.has(functionName)) errors.push(`${layer.id}: unknown function ${functionName}`);
    }
  }

  const first = ADDRESSQL_CROSS_CUTTING_LAYERS[0];
  if (first?.id !== 'security_privacy_zk') errors.push('security/privacy/ZK must be priority 1');
  if (!first?.addressQlFunctions.includes('ADDRESS_HASH')) {
    errors.push('security/privacy/ZK must include unsafe ADDRESS_HASH boundary');
  }

  const linguistics = ADDRESSQL_CROSS_CUTTING_LAYERS.find(layer => layer.id === 'linguistics_multilingual_nlp');
  if (!linguistics?.addressQlFunctions.includes('COUNTRY_LANGUAGES')) {
    errors.push('linguistics layer must include COUNTRY_LANGUAGES');
  }

  const standards = ADDRESSQL_CROSS_CUTTING_LAYERS.find(layer => layer.id === 'standards_interoperability');
  if (!standards?.requiredArtifacts.some(artifact => artifact.includes('JSON Schema'))) {
    errors.push('standards layer must include JSON Schema artifacts');
  }

  const ux = ADDRESSQL_CROSS_CUTTING_LAYERS.at(-1);
  if (ux?.id !== 'ux_address_forms') errors.push('UX/forms must be the final applied layer');

  return errors;
}
