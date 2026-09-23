export const ADDRESS_INFORMATION_ENGINEERING_FOUNDATIONS_VERSION =
  'address-information-engineering-foundations-v0.1';

export type AddressInformationKind =
  | 'expression'
  | 'referent'
  | 'identifier'
  | 'source'
  | 'quality_state'
  | 'lineage'
  | 'policy'
  | 'computation'
  | 'proof'
  | 'receipt';

export type AddressInformationAxiom = {
  id: string;
  title: string;
  protects: AddressInformationKind[];
  failureMode: string;
  nonClaim: string;
};

export type AddressInformationOperation = {
  name: string;
  inputKinds: AddressInformationKind[];
  outputKinds: AddressInformationKind[];
  unsafeIfMissing: AddressInformationKind[];
  nonClaims: string[];
};

export type AddressInformationLayerContract = {
  id: string;
  inputKinds: AddressInformationKind[];
  outputKinds: AddressInformationKind[];
  failureStates: string[];
  nonClaims: string[];
};

export type AddressInformationStandardBridge = {
  standard: string;
  role:
    | 'conceptual_model'
    | 'postal_template'
    | 'spatial_semantics'
    | 'credential_proof'
    | 'identifier_resolution';
  mappedKinds: AddressInformationKind[];
  nonClaims: string[];
};

export const ADDRESS_INFORMATION_KINDS: AddressInformationKind[] = [
  'expression',
  'referent',
  'identifier',
  'source',
  'quality_state',
  'lineage',
  'policy',
  'computation',
  'proof',
  'receipt',
];

export const ADDRESS_INFORMATION_AXIOMS: AddressInformationAxiom[] = [
  {
    id: 'A1-type-separation',
    title: 'Type separation',
    protects: ['expression', 'referent', 'identifier', 'proof', 'receipt'],
    failureMode: 'normalized text, IDs, proofs, and receipts are treated as the same address object',
    nonClaim: 'A shared database row does not make expression, referent, identifier, proof, and receipt the same type.',
  },
  {
    id: 'A2-context-dependence',
    title: 'Context dependence',
    protects: ['policy', 'quality_state'],
    failureMode: 'one validation result is reused across delivery, KYC, search, and disaster response',
    nonClaim: 'There is no universal address-valid predicate for every purpose.',
  },
  {
    id: 'A3-source-bound-evidence',
    title: 'Source-bound evidence',
    protects: ['source', 'quality_state'],
    failureMode: 'source-free data is promoted to verified address evidence',
    nonClaim: 'An address claim without source, license, coverage, and freshness metadata is not verified evidence.',
  },
  {
    id: 'A4-temporal-change',
    title: 'Temporal change',
    protects: ['lineage', 'source'],
    failureMode: 'renames, splits, merges, retirements, and reassignment are flattened into one current label',
    nonClaim: 'The latest label is not a complete address history.',
  },
  {
    id: 'A5-non-injective-expressions',
    title: 'Non-injective expressions',
    protects: ['expression', 'referent'],
    failureMode: 'one postal string, coordinate neighborhood, or building name is assumed to identify exactly one referent',
    nonClaim: 'Surface expression equality is not referent identity.',
  },
  {
    id: 'A6-reachability-separation',
    title: 'Reachability separation',
    protects: ['referent', 'policy', 'quality_state'],
    failureMode: 'nearby geometry is treated as reachable delivery handoff',
    nonClaim: 'Coordinate proximity is not delivery reachability.',
  },
  {
    id: 'A7-public-projection-non-inversion',
    title: 'Public projection non-inversion',
    protects: ['identifier', 'proof', 'policy'],
    failureMode: 'public identifiers or proofs leak room, recipient, phone, witness, or access secrets',
    nonClaim: 'Public address references must not be invertible into private address material.',
  },
  {
    id: 'A8-safe-non-emission',
    title: 'Safe non-emission',
    protects: ['quality_state', 'receipt'],
    failureMode: 'ambiguous, unresolved, deprecated, or disputed records are forced into resolved outputs',
    nonClaim: 'A safe address system may refuse to emit a resolved result.',
  },
];

export const ADDRESS_INFORMATION_OPERATIONS: AddressInformationOperation[] = [
  {
    name: 'parse',
    inputKinds: ['expression', 'policy'],
    outputKinds: ['computation'],
    unsafeIfMissing: ['policy'],
    nonClaims: ['Parsing is not validation and does not identify a referent.'],
  },
  {
    name: 'normalize',
    inputKinds: ['expression', 'source'],
    outputKinds: ['expression'],
    unsafeIfMissing: ['source'],
    nonClaims: ['Normalization reduces variation; it is not referent resolution.'],
  },
  {
    name: 'candidate',
    inputKinds: ['expression', 'source', 'policy'],
    outputKinds: ['referent', 'quality_state'],
    unsafeIfMissing: ['source', 'policy'],
    nonClaims: ['Candidate generation improves recall; it does not prove identity.'],
  },
  {
    name: 'resolve',
    inputKinds: ['expression', 'source', 'lineage', 'policy'],
    outputKinds: ['referent', 'quality_state', 'receipt'],
    unsafeIfMissing: ['source', 'lineage', 'policy'],
    nonClaims: ['Resolution is purpose-relative and may safely abstain.'],
  },
  {
    name: 'render',
    inputKinds: ['referent', 'policy'],
    outputKinds: ['expression'],
    unsafeIfMissing: ['policy'],
    nonClaims: ['A rendered address is not the inverse of address resolution.'],
  },
  {
    name: 'index',
    inputKinds: ['referent', 'source', 'policy'],
    outputKinds: ['identifier', 'computation'],
    unsafeIfMissing: ['source', 'policy'],
    nonClaims: ['An index key is not proof of deliverability or residence.'],
  },
  {
    name: 'prove',
    inputKinds: ['referent', 'identifier', 'policy'],
    outputKinds: ['proof'],
    unsafeIfMissing: ['referent', 'policy'],
    nonClaims: ['A proof does not repair a bad address resolution.'],
  },
  {
    name: 'audit',
    inputKinds: ['computation', 'policy'],
    outputKinds: ['receipt'],
    unsafeIfMissing: ['policy'],
    nonClaims: ['An audit receipt records an operation; it is not raw address evidence.'],
  },
];

export const ADDRESS_INFORMATION_LAYER_CONTRACTS: AddressInformationLayerContract[] = [
  {
    id: 'mathematics-information-theory',
    inputKinds: ['expression', 'referent', 'source'],
    outputKinds: ['quality_state', 'computation'],
    failureStates: ['non_injective_observation', 'unsafe_compression'],
    nonClaims: ['Mathematical structure does not prove global address completeness.'],
  },
  {
    id: 'data-models',
    inputKinds: ['source', 'policy'],
    outputKinds: ['expression', 'referent', 'identifier', 'proof', 'receipt'],
    failureStates: ['type_confusion', 'schema_gap'],
    nonClaims: ['A common schema is not complete coverage for every country or use case.'],
  },
  {
    id: 'spatial-theory',
    inputKinds: ['referent', 'source'],
    outputKinds: ['quality_state', 'computation'],
    failureStates: ['boundary_uncertainty', 'projection_loss'],
    nonClaims: ['Coordinate equality is not address identity.'],
  },
  {
    id: 'temporal-theory',
    inputKinds: ['lineage', 'source'],
    outputKinds: ['quality_state', 'receipt'],
    failureStates: ['missing_history', 'reassignment_conflict'],
    nonClaims: ['New and old address labels do not always have a single successor relation.'],
  },
  {
    id: 'quality-theory',
    inputKinds: ['referent', 'source', 'policy'],
    outputKinds: ['quality_state'],
    failureStates: ['ambiguous', 'disputed', 'manual_required'],
    nonClaims: ['A quality score is not truth proof.'],
  },
  {
    id: 'computation-theory',
    inputKinds: ['expression', 'referent', 'source'],
    outputKinds: ['computation', 'quality_state'],
    failureStates: ['approximation_error', 'unsafe_public_example'],
    nonClaims: ['Convenient search output is not verified address evidence.'],
  },
  {
    id: 'distributed-infrastructure',
    inputKinds: ['source', 'lineage', 'policy'],
    outputKinds: ['quality_state', 'receipt'],
    failureStates: ['stale_source', 'split_brain', 'conflict_state'],
    nonClaims: ['Global consensus is not required for every address workflow.'],
  },
  {
    id: 'congestion-performance-theory',
    inputKinds: ['computation', 'policy'],
    outputKinds: ['quality_state', 'receipt'],
    failureStates: ['queue_overflow', 'degraded_mode'],
    nonClaims: ['Shortest distance is not shortest delivery time.'],
  },
];

export const ADDRESS_INFORMATION_STANDARD_BRIDGES: AddressInformationStandardBridge[] = [
  {
    standard: 'ISO 19160',
    role: 'conceptual_model',
    mappedKinds: ['expression', 'referent', 'source', 'lineage'],
    nonClaims: ['ISO conceptual modeling does not by itself resolve a referent for every use case.'],
  },
  {
    standard: 'UPU S42 / ISO 19160-4',
    role: 'postal_template',
    mappedKinds: ['expression', 'source', 'policy'],
    nonClaims: ['Postal-format validity is not referent resolution or delivery success.'],
  },
  {
    standard: 'OGC GeoSPARQL',
    role: 'spatial_semantics',
    mappedKinds: ['referent', 'source', 'computation'],
    nonClaims: ['Spatial relation semantics do not recover private vertical or internal delivery details.'],
  },
  {
    standard: 'W3C Verifiable Credentials',
    role: 'credential_proof',
    mappedKinds: ['identifier', 'proof', 'policy'],
    nonClaims: ['A credential can carry an address-derived claim but does not fix incorrect address resolution.'],
  },
  {
    standard: 'W3C DID Core',
    role: 'identifier_resolution',
    mappedKinds: ['identifier', 'policy', 'proof'],
    nonClaims: ['A DID is not a postal address, residence proof, or delivery target by itself.'],
  },
];

export function validateAddressInformationEngineeringFoundations(): string[] {
  const errors: string[] = [];
  const kindSet = new Set(ADDRESS_INFORMATION_KINDS);
  const axiomIds = new Set<string>();
  const operationNames = new Set<string>();
  const layerIds = new Set<string>();
  const standards = new Set<string>();

  for (const required of ['expression', 'referent', 'identifier', 'proof', 'receipt'] satisfies AddressInformationKind[]) {
    if (!kindSet.has(required)) errors.push(`missing-kind:${required}`);
  }

  for (const axiom of ADDRESS_INFORMATION_AXIOMS) {
    if (axiomIds.has(axiom.id)) errors.push(`duplicate-axiom:${axiom.id}`);
    axiomIds.add(axiom.id);
    if (axiom.protects.length === 0) errors.push(`axiom-missing-protects:${axiom.id}`);
    if (!axiom.failureMode || !axiom.nonClaim) errors.push(`axiom-missing-safety-text:${axiom.id}`);
  }

  for (const operation of ADDRESS_INFORMATION_OPERATIONS) {
    if (operationNames.has(operation.name)) errors.push(`duplicate-operation:${operation.name}`);
    operationNames.add(operation.name);
    if (operation.inputKinds.length === 0 || operation.outputKinds.length === 0) {
      errors.push(`operation-missing-kind:${operation.name}`);
    }
    if (operation.nonClaims.length === 0) errors.push(`operation-missing-non-claim:${operation.name}`);
    if (operation.name === 'prove' && !operation.nonClaims.some(nonClaim => /does not repair/i.test(nonClaim))) {
      errors.push('prove-missing-non-repair-boundary');
    }
    if (operation.name === 'normalize' && !operation.nonClaims.some(nonClaim => /not referent resolution/i.test(nonClaim))) {
      errors.push('normalize-missing-non-identity-boundary');
    }
  }

  for (const layer of ADDRESS_INFORMATION_LAYER_CONTRACTS) {
    if (layerIds.has(layer.id)) errors.push(`duplicate-layer:${layer.id}`);
    layerIds.add(layer.id);
    if (layer.failureStates.length < 2) errors.push(`layer-too-few-failure-states:${layer.id}`);
    if (layer.nonClaims.length === 0) errors.push(`layer-missing-non-claim:${layer.id}`);
  }

  for (const bridge of ADDRESS_INFORMATION_STANDARD_BRIDGES) {
    if (standards.has(bridge.standard)) errors.push(`duplicate-standard:${bridge.standard}`);
    standards.add(bridge.standard);
    if (bridge.mappedKinds.length < 2) errors.push(`standard-too-few-kinds:${bridge.standard}`);
    if (bridge.nonClaims.length === 0) errors.push(`standard-missing-non-claim:${bridge.standard}`);
  }

  if (ADDRESS_INFORMATION_LAYER_CONTRACTS.length !== 8) errors.push('expected-eight-layer-contracts');
  if (ADDRESS_INFORMATION_AXIOMS.length !== 8) errors.push('expected-eight-axioms');

  return errors;
}

export function buildAddressInformationEngineeringFoundationsReport() {
  return {
    version: ADDRESS_INFORMATION_ENGINEERING_FOUNDATIONS_VERSION,
    kindCount: ADDRESS_INFORMATION_KINDS.length,
    axiomCount: ADDRESS_INFORMATION_AXIOMS.length,
    operationCount: ADDRESS_INFORMATION_OPERATIONS.length,
    layerCount: ADDRESS_INFORMATION_LAYER_CONTRACTS.length,
    standardBridgeCount: ADDRESS_INFORMATION_STANDARD_BRIDGES.length,
    safetyBoundaries: {
      typeSeparation: ADDRESS_INFORMATION_AXIOMS.some(axiom => axiom.id === 'A1-type-separation'),
      nonRepairProof: ADDRESS_INFORMATION_OPERATIONS.some(operation => (
        operation.name === 'prove' && operation.nonClaims.some(nonClaim => /does not repair/i.test(nonClaim))
      )),
      safeNonEmission: ADDRESS_INFORMATION_AXIOMS.some(axiom => axiom.id === 'A8-safe-non-emission'),
      noUniversalValidation: ADDRESS_INFORMATION_AXIOMS.some(axiom => (
        axiom.id === 'A2-context-dependence' && /universal address-valid/i.test(axiom.nonClaim)
      )),
    },
    validationErrors: validateAddressInformationEngineeringFoundations(),
  };
}

