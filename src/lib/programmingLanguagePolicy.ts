export const PROGRAMMING_LANGUAGE_POLICY_VERSION = 'programming-language-policy-v1';

export type ProjectLanguage =
  | 'TypeScript'
  | 'Rust'
  | 'Solidity'
  | 'Circom'
  | 'Lean'
  | 'Python'
  | 'SQL'
  | 'Generated SDK';

export type LanguageDecisionDomain =
  | 'frontend-ui'
  | 'api-orchestration'
  | 'address-policy'
  | 'deterministic-geo-core'
  | 'high-volume-server-worker'
  | 'database-query'
  | 'blockchain-contract'
  | 'zk-circuit'
  | 'formal-proof'
  | 'data-science-or-doc-build'
  | 'public-sdk';

export type LanguageDecisionInput = {
  domain: LanguageDecisionDomain;
  performanceCritical?: boolean;
  deterministicNumeric?: boolean;
  browserRequired?: boolean;
  cryptographicPrimitive?: boolean;
  formalVerificationRequired?: boolean;
  highVolumeBatch?: boolean;
  crossLanguageDistribution?: boolean;
};

export type LanguageDecision = {
  domain: LanguageDecisionDomain;
  primaryLanguage: ProjectLanguage;
  allowedLanguages: ProjectLanguage[];
  refactorTrigger: string;
  reason: string;
  guardrail: string;
};

export type LanguagePolicy = {
  version: typeof PROGRAMMING_LANGUAGE_POLICY_VERSION;
  defaultLanguage: 'TypeScript';
  rule: string;
  decisions: LanguageDecision[];
};

const DECISIONS: LanguageDecision[] = [
  {
    domain: 'frontend-ui',
    primaryLanguage: 'TypeScript',
    allowedLanguages: ['TypeScript'],
    refactorTrigger: 'Do not rewrite UI to another language unless the app platform changes.',
    reason: 'React, POS screens, dashboard flows, language tabs, QR/NFC controls, and browser APIs live in the TypeScript app runtime.',
    guardrail: 'Keep UI logic thin; move deterministic heavy work behind typed library boundaries.',
  },
  {
    domain: 'api-orchestration',
    primaryLanguage: 'TypeScript',
    allowedLanguages: ['TypeScript', 'SQL', 'Rust'],
    refactorTrigger: 'Introduce Rust only after an API path is CPU-bound, batch-heavy, or needs native deterministic execution.',
    reason: 'Registry APIs, adapters, webhook handling, AddressIntent orchestration, and POS backends are I/O and policy-heavy.',
    guardrail: 'Never let adapters store raw addresses, raw AGIDs, raw AOIDs, carrier secrets, or recipient proof codes.',
  },
  {
    domain: 'address-policy',
    primaryLanguage: 'TypeScript',
    allowedLanguages: ['TypeScript', 'Rust'],
    refactorTrigger: 'Move a policy slice to Rust/WASM only when repeated tests show numeric determinism, speed, or privacy-boundary needs.',
    reason: 'Address quality, tab choice, resolver policy, radar rules, and mode selection need fast iteration and readable business logic.',
    guardrail: 'Policy decisions must remain explainable and covered by TypeScript tests even when a Rust backend is added.',
  },
  {
    domain: 'deterministic-geo-core',
    primaryLanguage: 'Rust',
    allowedLanguages: ['Rust', 'TypeScript'],
    refactorTrigger: 'Keep TypeScript fallback, but prefer Rust/WASM for grid math, ZK predicate geometry, and collision-sensitive code.',
    reason: 'AGID encode/decode, cell bounds, predicate geometry, and hidden region checks benefit from deterministic numeric behavior.',
    guardrail: 'Every Rust/WASM path must have parity vectors and a TypeScript fallback until native packages are mature.',
  },
  {
    domain: 'high-volume-server-worker',
    primaryLanguage: 'Rust',
    allowedLanguages: ['Rust', 'TypeScript', 'SQL'],
    refactorTrigger: 'Use Rust when p95/p99 latency, memory pressure, or batch size makes TypeScript workers unstable.',
    reason: 'Relayers, batch root anchoring, massive geocoding audits, Merkle builders, and hot registry workers are throughput-sensitive.',
    guardrail: 'Do not duplicate domain rules; call shared schemas and emit the same safe evidence model as TypeScript.',
  },
  {
    domain: 'database-query',
    primaryLanguage: 'SQL',
    allowedLanguages: ['SQL', 'TypeScript'],
    refactorTrigger: 'Use SQL/PostGIS/Redis/Mongo indexes when the task is filtering, joining, spatial lookup, or persistence.',
    reason: 'Database engines should own indexing, constraints, spatial filtering, cache lookups, and transactional consistency.',
    guardrail: 'Application code must not reimplement database consistency rules with ad hoc arrays at production scale.',
  },
  {
    domain: 'blockchain-contract',
    primaryLanguage: 'Solidity',
    allowedLanguages: ['Solidity', 'TypeScript'],
    refactorTrigger: 'Only put minimal public verification state on-chain: issuer, commitment, revocation, nullifier, verifier, payment.',
    reason: 'Ethereum/L2 state belongs in audited contracts; TypeScript should generate ABIs, clients, tests, and deployment scripts.',
    guardrail: 'Never put raw AGID, raw AOID, raw address, AGID-S payload, recipient identity, or tracking secrets on-chain.',
  },
  {
    domain: 'zk-circuit',
    primaryLanguage: 'Circom',
    allowedLanguages: ['Circom', 'Rust', 'TypeScript'],
    refactorTrigger: 'Use Circom/snarkjs for current practical circuits; evaluate Noir/Halo2/zkVM only behind the same witness schema.',
    reason: 'Real ZK constraints are circuit programs; TypeScript is only for witness preparation, tests, and proof orchestration.',
    guardrail: 'Circuit changes require witness tests, privacy review, and fixture parity before being treated as production proof logic.',
  },
  {
    domain: 'formal-proof',
    primaryLanguage: 'Lean',
    allowedLanguages: ['Lean', 'TypeScript', 'Python'],
    refactorTrigger: 'Use Lean for discrete impossibility/safety theorems; use GIS/tests for empirical geography and numeric claims.',
    reason: 'Address Morphism Theory needs formal proofs for abstract claims, while real-world data quality remains empirical.',
    guardrail: 'Do not claim Lean proves GIS accuracy, address truth, cryptographic security, or global data completeness.',
  },
  {
    domain: 'data-science-or-doc-build',
    primaryLanguage: 'Python',
    allowedLanguages: ['Python', 'TypeScript', 'SQL'],
    refactorTrigger: 'Use Python for PDF/document pipelines, GIS batch experiments, notebooks, and one-off analysis, not app runtime.',
    reason: 'Python has strong document/GIS/data tooling and is already used for build/verification utilities.',
    guardrail: 'Generated artifacts must be reproducible and source files must remain the canonical project material.',
  },
  {
    domain: 'public-sdk',
    primaryLanguage: 'Generated SDK',
    allowedLanguages: ['Generated SDK', 'TypeScript', 'Rust'],
    refactorTrigger: 'SDKs should be generated from the spec and test vectors; hand-edit only language idioms and packaging.',
    reason: 'AGID distribution requires parity across C, C++, Go, Java, Python, Rust, Swift, WASM, and other runtimes.',
    guardrail: 'A language SDK is not release-ready until it passes parity vectors against sdk/agid-spec/test-vectors.json.',
  },
];

export function getProgrammingLanguagePolicy(): LanguagePolicy {
  return {
    version: PROGRAMMING_LANGUAGE_POLICY_VERSION,
    defaultLanguage: 'TypeScript',
    rule: 'Default to TypeScript for product, API, policy, and orchestration. Move code out only when the domain is contract logic, ZK circuits, formal proof, deterministic numeric core, database-owned querying, generated SDK parity, or measured high-volume native workload.',
    decisions: DECISIONS,
  };
}

export function getLanguageDecision(domain: LanguageDecisionDomain): LanguageDecision {
  const decision = DECISIONS.find((item) => item.domain === domain);
  if (!decision) {
    throw new Error(`Unknown language decision domain: ${domain}`);
  }
  return decision;
}

export function recommendLanguage(input: LanguageDecisionInput): LanguageDecision {
  if (input.formalVerificationRequired) return getLanguageDecision('formal-proof');
  if (input.cryptographicPrimitive && input.domain === 'blockchain-contract') {
    return getLanguageDecision('blockchain-contract');
  }
  if (input.cryptographicPrimitive && input.domain === 'zk-circuit') {
    return getLanguageDecision('zk-circuit');
  }
  if (input.deterministicNumeric && (input.performanceCritical || input.browserRequired)) {
    return getLanguageDecision('deterministic-geo-core');
  }
  if (input.highVolumeBatch && input.performanceCritical) {
    return getLanguageDecision('high-volume-server-worker');
  }
  if (input.crossLanguageDistribution) return getLanguageDecision('public-sdk');
  return getLanguageDecision(input.domain);
}

export function shouldRefactorFromTypeScript(input: LanguageDecisionInput): boolean {
  const decision = recommendLanguage(input);
  return decision.primaryLanguage !== 'TypeScript'
    && !(decision.primaryLanguage === 'Generated SDK' && input.domain === 'public-sdk');
}
