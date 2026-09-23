export const EXECUTABLE_EXPECTATION_REGISTRY_VERSION = 'executable-expectations-v1';

export const EXECUTABLE_EXPECTATION_VALIDATION_METHODS = [
  'lean',
  'gis',
  'implementation-test',
  'benchmark',
  'security-audit',
  'governance-review',
] as const;

export type ExecutableExpectationValidationMethod =
  (typeof EXECUTABLE_EXPECTATION_VALIDATION_METHODS)[number];

export const EXECUTABLE_EXPECTATION_STATUSES = [
  'proved',
  'tested',
  'empirical-pass',
  'empirical-fail',
  'open',
  'rejected',
] as const;

export type ExecutableExpectationStatus =
  (typeof EXECUTABLE_EXPECTATION_STATUSES)[number];

export type ExecutableExpectation = {
  id: string;
  claim: string;
  validationMethod: ExecutableExpectationValidationMethod;
  metric: string;
  passCriterion: string;
  expectedOutcome: string;
  status: ExecutableExpectationStatus;
  successWording: string;
  failureWording: string;
  paperLocation: string;
};

export type ExecutableExpectationObservation = {
  id: string;
  passed: boolean;
  observedOutcome: string;
  nextStatus: Extract<ExecutableExpectationStatus, 'empirical-pass' | 'empirical-fail'>;
  recommendedWording: string;
};

export type ExecutableExpectationSummary = {
  registryVersion: typeof EXECUTABLE_EXPECTATION_REGISTRY_VERSION;
  total: number;
  byStatus: Record<ExecutableExpectationStatus, number>;
  byValidationMethod: Record<ExecutableExpectationValidationMethod, number>;
  openIds: string[];
  failureRewriteIds: string[];
};

export const ADDRESS_MORPHISM_EXECUTABLE_EXPECTATIONS = [
  {
    id: 'candidate-coverage',
    claim: 'Candidate expansion should increase true-target coverage.',
    validationMethod: 'benchmark',
    metric: 'recall@k and candidate miss rate by region and feature type',
    passCriterion: 'Measured recall improves without increasing unsafe PID issuance.',
    expectedOutcome: 'Candidate generation captures more true targets in tested scopes.',
    status: 'open',
    successWording: 'Candidate expansion improves measured coverage in the tested scope.',
    failureWording:
      'Candidate completeness is source- and region-dependent; unsupported scopes must return unresolved or request additional evidence.',
    paperLocation: 'Appendix F; benchmark chapter',
  },
  {
    id: 'multilingual-recall',
    claim: 'Multilingual expansion should improve address search recall.',
    validationMethod: 'benchmark',
    metric: 'recall@k over native names, translations, transliterations, old names, aliases, and dialect variants',
    passCriterion: 'Recall improves while identity collisions remain gated.',
    expectedOutcome: 'Multilingual expansion improves recall before identity resolution.',
    status: 'open',
    successWording: 'Multilingual expansion is a recall layer before identity resolution.',
    failureWording:
      'Multilingual expansion is not identity preserving; normalization collisions require structural and source gates.',
    paperLocation: 'Candidate expansion chapter; Appendix F',
  },
  {
    id: 'equivalence-class-stability',
    claim: 'Equivalence classes should be more stable than surface address strings under reference-preserving rewrites.',
    validationMethod: 'benchmark',
    metric: 'cluster retention rate under translations, abbreviations, aliases, and old-address inputs',
    passCriterion: 'Reference-preserving variants stay in the same cluster above the configured threshold.',
    expectedOutcome: 'Reference-preserving rewrites preserve class identity in tested cases.',
    status: 'open',
    successWording: 'Reference-preserving surface changes are more stable at the equivalence-class level.',
    failureWording:
      'Split, merge, boundary change, and name reuse require class updates rather than a global stability claim.',
    paperLocation: 'Equivalence-class chapter; Appendix F',
  },
  {
    id: 'unresolved-reduces-false-issuance',
    claim: 'Unresolved outcomes should reduce false precision and false PID issuance.',
    validationMethod: 'implementation-test',
    metric: 'false issuance rate, near-tie abstention rate, low-quality abstention rate',
    passCriterion: 'Unsafe cases abstain or request more evidence instead of issuing a PID.',
    expectedOutcome: 'Unresolved is a safety state rather than a failure state.',
    status: 'tested',
    successWording: 'Unresolved suppresses false precision when evidence is insufficient.',
    failureWording:
      'High unresolved rates indicate missing evidence, thresholds, or UI confirmation; they should trigger source and gate improvements.',
    paperLocation: 'Resolution and safety-state chapters',
  },
  {
    id: 'pid-gate-auditability',
    claim: 'PID issuance gates should make resolution decisions auditable.',
    validationMethod: 'implementation-test',
    metric: 'audit envelope replay coverage for candidate generation, clustering, abstention gates, history update, and PID issuance',
    passCriterion: 'Audit replay confirms every declared gate before PID issuance.',
    expectedOutcome: 'PID issuance can be checked after the fact under declared gates.',
    status: 'tested',
    successWording: 'PID issuance is auditable under declared gates.',
    failureWording:
      'Gate passage proves declared procedural admissibility, not global real-world truth.',
    paperLocation: 'PID issuance and audit chapter; Appendix F',
  },
  {
    id: 'lineage-graph-split-merge',
    claim: 'Address history should be represented as a graph or relation rather than a single-valued function.',
    validationMethod: 'lean',
    metric: 'formal split counterexample and real split/merge case collection',
    passCriterion: 'Split or merge cases are representable without deleting prior states.',
    expectedOutcome: 'Lineage graphs represent rename, split, merge, retirement, and reassignment.',
    status: 'proved',
    successWording: 'Address lineage requires relation-like or graph-like transitions in the general case.',
    failureWording:
      'If records are missing, lineage preservation is limited to recorded states under an append-only evidence model.',
    paperLocation: 'Address Lineage chapter',
  },
  {
    id: 'address-entropy',
    claim: 'Address information need should increase with target cardinality, density, and required granularity.',
    validationMethod: 'benchmark',
    metric: 'candidate count, required identification bits, address length, token count, ambiguity rate',
    passCriterion: 'Measured ambiguity or required bits increase with target set size and granularity.',
    expectedOutcome: 'Address entropy is tied to identification burden.',
    status: 'open',
    successWording: 'Address information need grows with target cardinality, density, and required granularity.',
    failureWording:
      'Urbanization alone is not the cause; grid design, authority data, and code-space design can reduce collision risk.',
    paperLocation: 'Address compression and entropy chapter; Appendix F',
  },
  {
    id: 'context-relative-optimum',
    claim: 'Optimal address resolution should depend on the task context when utility functions conflict.',
    validationMethod: 'benchmark',
    metric: 'top-candidate disagreement and loss delta across delivery, emergency, administrative, property, and disaster contexts',
    passCriterion: 'At least one evaluated scenario has conflicting context optima.',
    expectedOutcome: 'Address optimality is context-relative under conflicting utilities.',
    status: 'open',
    successWording: 'The optimal address representation and resolution can depend on context.',
    failureWording:
      'If contexts share the same utility ordering, identical outputs are a valid special case rather than a refutation.',
    paperLocation: 'Contextual resolution chapter; Appendix F',
  },
  {
    id: 'natural-cultural-referents',
    claim: 'Named natural and cultural features can serve as address-like referents.',
    validationMethod: 'gis',
    metric: 'feature coverage, geometry validity, representative point validity, language alias coverage, source authority',
    passCriterion: 'Configured feature types validate in GIS/source benchmarks without unsafe postal invention.',
    expectedOutcome: 'AMT supports referents beyond postal addresses.',
    status: 'open',
    successWording: 'AMT can extend the referent ontology beyond postal addresses.',
    failureWording:
      'Global feature recognition is not proven; natural and cultural features are source-bound referents until coverage is measured.',
    paperLocation: 'Natural and cultural geography chapter; Appendix F',
  },
  {
    id: 'address-tab-quality-calibration',
    claim: 'Internal address-tab quality scores can drive hide, caution, re-verify, and skip-second-verification policies.',
    validationMethod: 'benchmark',
    metric: 'false positive rate, false negative rate, re-verification rate, tab-hidden fallback rate',
    passCriterion: 'Quality routing improves safety without hiding all useful candidates.',
    expectedOutcome: 'Quality scores are useful internal risk-control signals.',
    status: 'open',
    successWording: 'Quality scores can route tabs into hide, caution, re-verify, and stable states.',
    failureWording:
      'Quality scores are not truth; low-confidence scopes should request evidence or confirmation instead of exposing scores to users.',
    paperLocation: 'Quality and benchmark chapters; Appendix F',
  },
  {
    id: 'official-source-depth',
    claim: 'Official postal and administrative sources should strengthen address verification.',
    validationMethod: 'governance-review',
    metric: 'authority, license, freshness, coverage, allowedUse, live availability, and country-specific depth',
    passCriterion: 'Source metadata supports the verification use case and remains fresh enough for the policy.',
    expectedOutcome: 'Official sources strengthen country-level address verification.',
    status: 'open',
    successWording: 'Official sources increase reliability when authority, license, freshness, and coverage are sufficient.',
    failureWording:
      'Where official sources are missing, stale, or restricted, AMT must use fallback evidence, unresolved states, or lower confidence.',
    paperLocation: 'Source governance and address verification chapters',
  },
  {
    id: 'commercial-validator-competition',
    claim: 'AMT can compete with commercial address validators under well-defined conditions.',
    validationMethod: 'benchmark',
    metric: 'country-level accuracy, correction quality, deliverability depth, auditability, privacy, natural-feature support, cost control',
    passCriterion: 'AMT matches or exceeds competitors on at least the declared target dimensions.',
    expectedOutcome: 'AMT is competitive on transparency, auditability, lineage, abstention, and non-postal referents.',
    status: 'open',
    successWording:
      'AMT differentiates itself through explicit evidence, abstention, lineage, natural features, vertical reference, and auditability.',
    failureWording:
      'AMT should be described as a transparent evidence and audit layer where commercial validators outperform it on proprietary data.',
    paperLocation: 'Benchmark and limitations chapters; Appendix F',
  },
  {
    id: 'zk-address-privacy',
    claim: 'AMT-derived attributes can support privacy-preserving address proofs.',
    validationMethod: 'security-audit',
    metric: 'circuit soundness, zero-knowledge, witness leakage, nullifier separation, revocation, freshness, anonymity set size',
    passCriterion: 'Audited circuits and protocol rules preserve the declared privacy claim.',
    expectedOutcome: 'AMT attributes can feed ZK Address, Residence, and Delivery proofs.',
    status: 'open',
    successWording: 'AMT-derived attributes can feed privacy-preserving address proofs.',
    failureWording:
      'Until audited circuits exist, the implementation is proof-ready or envelope-based, not a complete ZK system.',
    paperLocation: 'ZK companion paper; Appendix F boundary note',
  },
  {
    id: 'agent-mcp-integration',
    claim: 'AGID/AOID can support shopping agents and MCP integrations.',
    validationMethod: 'implementation-test',
    metric: 'API conformance, MCP tool contract coverage, minimal disclosure, delivery eligibility flow, error handling',
    passCriterion: 'Agent requests can verify address-related claims without unnecessary private address disclosure.',
    expectedOutcome: 'Applied identifiers support agentic address and delivery workflows.',
    status: 'open',
    successWording: 'AMT-derived applied identifiers can support agentic address and delivery workflows.',
    failureWording:
      'Agent and MCP integration is an application specification and must be separated from AMT core correctness.',
    paperLocation: 'AGID/AOID application paper',
  },
] as const satisfies readonly ExecutableExpectation[];

function initialStatusCounts(): Record<ExecutableExpectationStatus, number> {
  return Object.fromEntries(
    EXECUTABLE_EXPECTATION_STATUSES.map(status => [status, 0]),
  ) as Record<ExecutableExpectationStatus, number>;
}

function initialMethodCounts(): Record<ExecutableExpectationValidationMethod, number> {
  return Object.fromEntries(
    EXECUTABLE_EXPECTATION_VALIDATION_METHODS.map(method => [method, 0]),
  ) as Record<ExecutableExpectationValidationMethod, number>;
}

export function validateExecutableExpectationRegistry(
  expectations: readonly ExecutableExpectation[] = ADDRESS_MORPHISM_EXECUTABLE_EXPECTATIONS,
) {
  const ids = new Set<string>();
  const errors: string[] = [];

  for (const expectation of expectations) {
    if (ids.has(expectation.id)) {
      errors.push(`duplicate expectation id: ${expectation.id}`);
    }
    ids.add(expectation.id);

    if (!expectation.claim.trim()) {
      errors.push(`missing claim for ${expectation.id}`);
    }
    if (!expectation.metric.trim()) {
      errors.push(`missing metric for ${expectation.id}`);
    }
    if (!expectation.passCriterion.trim()) {
      errors.push(`missing pass criterion for ${expectation.id}`);
    }
    if (!expectation.successWording.trim()) {
      errors.push(`missing success wording for ${expectation.id}`);
    }
    if (!expectation.failureWording.trim()) {
      errors.push(`missing failure wording for ${expectation.id}`);
    }
    if (!expectation.paperLocation.trim()) {
      errors.push(`missing paper location for ${expectation.id}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    ids: [...ids],
  };
}

export function summarizeExecutableExpectations(
  expectations: readonly ExecutableExpectation[] = ADDRESS_MORPHISM_EXECUTABLE_EXPECTATIONS,
): ExecutableExpectationSummary {
  const byStatus = initialStatusCounts();
  const byValidationMethod = initialMethodCounts();
  const openIds: string[] = [];
  const failureRewriteIds: string[] = [];

  for (const expectation of expectations) {
    byStatus[expectation.status] += 1;
    byValidationMethod[expectation.validationMethod] += 1;

    if (expectation.status === 'open') {
      openIds.push(expectation.id);
    }
    if (expectation.failureWording.trim().length > 0) {
      failureRewriteIds.push(expectation.id);
    }
  }

  return {
    registryVersion: EXECUTABLE_EXPECTATION_REGISTRY_VERSION,
    total: expectations.length,
    byStatus,
    byValidationMethod,
    openIds,
    failureRewriteIds,
  };
}

export function findExecutableExpectation(
  id: string,
  expectations: readonly ExecutableExpectation[] = ADDRESS_MORPHISM_EXECUTABLE_EXPECTATIONS,
) {
  return expectations.find(expectation => expectation.id === id) ?? null;
}

export function recordExecutableExpectationObservation(
  id: string,
  input: { passed: boolean; observedOutcome: string },
  expectations: readonly ExecutableExpectation[] = ADDRESS_MORPHISM_EXECUTABLE_EXPECTATIONS,
): ExecutableExpectationObservation {
  const expectation = findExecutableExpectation(id, expectations);

  if (!expectation) {
    throw new Error(`Unknown executable expectation: ${id}`);
  }
  if (!input.observedOutcome.trim()) {
    throw new Error('observedOutcome is required');
  }

  const nextStatus = input.passed ? 'empirical-pass' : 'empirical-fail';

  return {
    id,
    passed: input.passed,
    observedOutcome: input.observedOutcome,
    nextStatus,
    recommendedWording: input.passed ? expectation.successWording : expectation.failureWording,
  };
}
