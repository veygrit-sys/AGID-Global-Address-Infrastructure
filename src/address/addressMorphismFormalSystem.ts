export const ADDRESS_MORPHISM_FORMAL_SYSTEM_VERSION = 'amt-formal-system-v1';

export type AmtClaimKind =
  | 'axiom'
  | 'definition'
  | 'lemma'
  | 'existence-theorem'
  | 'uniqueness-theorem'
  | 'impossibility-theorem'
  | 'complexity-bound'
  | 'proof-obligation';

export type AmtVerificationLevel =
  | 'lean-proved'
  | 'implementation-supported'
  | 'paper-proof'
  | 'empirical-required'
  | 'open';

export type AmtFormalClaim = {
  id: string;
  kind: AmtClaimKind;
  title: string;
  statement: string;
  dependsOn: string[];
  verification: AmtVerificationLevel;
  proofSketch: string;
  limitations: string[];
};

export type AmtComplexityBound = {
  id: string;
  operation: string;
  variables: Record<string, string>;
  time: string;
  space: string;
  notes: string[];
};

export const AMT_FORMAL_AXIOMS: AmtFormalClaim[] = [
  {
    id: 'AMT-A1',
    kind: 'axiom',
    title: 'Typed address universe',
    statement:
      'For each time t and context chi, AMT declares surface expressions S_t, addressable entities X_t, evidence Sigma_t, policy P_t, and lineage graph L_t before resolution.',
    dependsOn: [],
    verification: 'paper-proof',
    proofSketch:
      'This is a modelling axiom. It prevents an address string, coordinate, postal code, and private identifier from being silently treated as the same type.',
    limitations: ['It does not prove that real-world data sources are complete.'],
  },
  {
    id: 'AMT-A2',
    kind: 'axiom',
    title: 'Finite operational candidates',
    statement:
      'For a fixed runtime policy, candidate generation Gamma_t(u) returns a finite candidate set.',
    dependsOn: ['AMT-A1'],
    verification: 'lean-proved',
    proofSketch:
      'The Lean model represents candidates as finite lists. Selection and gate theorems operate only over finite candidate collections.',
    limitations: ['Candidate finiteness is operational; candidate completeness remains empirical.'],
  },
  {
    id: 'AMT-A3',
    kind: 'axiom',
    title: 'Explicit abstention states',
    statement:
      'A resolver may return resolved, ambiguous, unresolved, or rejected. Only resolved may carry an entity or PID candidate.',
    dependsOn: ['AMT-A1'],
    verification: 'lean-proved',
    proofSketch:
      'AMTCore.lean defines ResolutionOutcome and proves ambiguous, unresolved, and rejected resolve no entity.',
    limitations: ['UI states such as conditional review are implementation refinements, not core proof states.'],
  },
  {
    id: 'AMT-A4',
    kind: 'axiom',
    title: 'Source-bound evidence',
    statement:
      'Every evidence item used by the resolver has source, time, jurisdiction, license, coverage, and freshness metadata.',
    dependsOn: ['AMT-A1'],
    verification: 'implementation-supported',
    proofSketch:
      'Source validation tests and GIS certificate checks enforce accepted, unknown, and rejected source states.',
    limitations: ['Live upstream coverage and license drift require recurring audits.'],
  },
  {
    id: 'AMT-A5',
    kind: 'axiom',
    title: 'Context declaration',
    statement:
      'Each resolution request is evaluated under an explicit context chi, such as delivery, administration, emergency, registration, map search, or privacy proof.',
    dependsOn: ['AMT-A1'],
    verification: 'lean-proved',
    proofSketch:
      'Context no-free-lunch theorems formalize why strict optima can differ by context.',
    limitations: ['The cost model for each context is policy-defined and must be calibrated separately.'],
  },
  {
    id: 'AMT-A6',
    kind: 'axiom',
    title: 'PID issuance gate',
    statement:
      'PID-bearing output is permitted only after candidate membership, separation, quality, freshness, risk, and audit predicates pass.',
    dependsOn: ['AMT-A2', 'AMT-A3', 'AMT-A4', 'AMT-A5'],
    verification: 'lean-proved',
    proofSketch:
      'AMTCore.lean defines IssueAdmissible and proves emitted outputs recover the admissibility certificate.',
    limitations: ['Threshold values are policy and benchmark choices, not pure mathematics.'],
  },
  {
    id: 'AMT-A7',
    kind: 'axiom',
    title: 'Relational lineage',
    statement:
      'Address history is a relation or graph, not a single successor function; split, merge, rename, retirement, and successor events are first-class.',
    dependsOn: ['AMT-A1'],
    verification: 'lean-proved',
    proofSketch:
      'AMTCore.lean proves a functional transition cannot represent a one-to-many split without loss.',
    limitations: ['Real administrative histories require source-specific modelling.'],
  },
  {
    id: 'AMT-A8',
    kind: 'axiom',
    title: 'Declared tie policy',
    statement:
      'When multiple finite candidates have indistinguishable best evidence, AMT must either declare a deterministic tie policy or abstain.',
    dependsOn: ['AMT-A2', 'AMT-A3'],
    verification: 'lean-proved',
    proofSketch:
      'Score selection theorems require threshold and margin. Missing margin blocks certified emission.',
    limitations: ['Tie policies can be unfair or context-inappropriate unless reviewed.'],
  },
];

export const AMT_FORMAL_THEOREMS: AmtFormalClaim[] = [
  {
    id: 'AMT-T1',
    kind: 'impossibility-theorem',
    title: 'No condition-free perfect resolver',
    statement:
      'If distinct entities share the same observable expression, no resolver using only that expression can be correct for both.',
    dependsOn: ['AMT-A1', 'AMT-A3'],
    verification: 'lean-proved',
    proofSketch:
      'Assume both entities resolve correctly. Equality of observations makes the resolver input equal, so function equality forces the two entities equal, contradiction.',
    limitations: ['Adding evidence can resolve specific cases; the theorem rules out unconditional perfection only.'],
  },
  {
    id: 'AMT-T2',
    kind: 'existence-theorem',
    title: 'Conditional resolved outcome existence',
    statement:
      'If candidates are finite, one candidate is selected, all admissibility gates pass, and tie policy or margin is declared, then a resolved model-internal outcome exists.',
    dependsOn: ['AMT-A2', 'AMT-A3', 'AMT-A6', 'AMT-A8'],
    verification: 'paper-proof',
    proofSketch:
      'Choose the gate-passing candidate and construct resolved(x). AMT-A6 supplies admissibility and AMT-A8 excludes unresolved ties.',
    limitations: ['This is model-internal existence; it does not prove real-world truth or global candidate completeness.'],
  },
  {
    id: 'AMT-T3',
    kind: 'uniqueness-theorem',
    title: 'Separated minimizer uniqueness',
    statement:
      'If the best candidate has a strict certified margin over every other candidate under context chi, the admissible best cluster is unique.',
    dependsOn: ['AMT-A2', 'AMT-A5', 'AMT-A8'],
    verification: 'paper-proof',
    proofSketch:
      'If two different candidates were both best, their score difference would be zero, contradicting the positive separation margin.',
    limitations: ['Uniqueness can fail when the metric, score, or context changes.'],
  },
  {
    id: 'AMT-T4',
    kind: 'uniqueness-theorem',
    title: 'Injective PID uniqueness',
    statement:
      'If PID assignment is injective over reference classes, equal PID implies equal reference class.',
    dependsOn: ['AMT-A6'],
    verification: 'lean-proved',
    proofSketch:
      'Directly applies injectivity: pid(a)=pid(b) entails a=b.',
    limitations: ['Bounded hash identifiers need collision-risk analysis instead of a pure injectivity theorem.'],
  },
  {
    id: 'AMT-T5',
    kind: 'impossibility-theorem',
    title: 'Candidate omission irrecoverability',
    statement:
      'If the true entity is absent from Gamma_t(u), any candidate-sound resolver cannot emit that true entity.',
    dependsOn: ['AMT-A2', 'AMT-A6'],
    verification: 'lean-proved',
    proofSketch:
      'Candidate soundness says emitted entities are members of the candidate set. Absence of the true entity contradicts emission.',
    limitations: ['The theorem motivates candidate-recall benchmarks; it does not provide those benchmarks.'],
  },
  {
    id: 'AMT-T6',
    kind: 'impossibility-theorem',
    title: 'Projection loss blocks vertical identity',
    statement:
      'If two vertical referents share a ground projection, a resolver using only ground projection cannot recover both identities.',
    dependsOn: ['AMT-A1'],
    verification: 'lean-proved',
    proofSketch:
      'This is the no-perfect-resolver theorem applied to a non-injective projection map.',
    limitations: ['A vertical reference layer can restore distinguishability when evidence exists.'],
  },
  {
    id: 'AMT-T7',
    kind: 'existence-theorem',
    title: 'Relational lineage representation existence',
    statement:
      'Every finite set of accepted rename, split, merge, retirement, and successor events can be represented as a finite directed lineage graph.',
    dependsOn: ['AMT-A7'],
    verification: 'paper-proof',
    proofSketch:
      'Create one node for each address state and one labelled edge for each accepted event. Finite events produce a finite graph.',
    limitations: ['The theorem represents accepted events; source truth and event completeness are empirical.'],
  },
  {
    id: 'AMT-T8',
    kind: 'uniqueness-theorem',
    title: 'Reference-class PID invariance',
    statement:
      'If two address expressions are reference-equivalent and PID is derived from the reference class, then both expressions receive the same class PID.',
    dependsOn: ['AMT-A1', 'AMT-A6'],
    verification: 'lean-proved',
    proofSketch:
      'Reference equivalence gives equality of the reference target. Applying the PID-of-reference-class function preserves equality.',
    limitations: ['Implementation clusters only approximate reference equivalence and need conflict gates.'],
  },
  {
    id: 'AMT-T9',
    kind: 'impossibility-theorem',
    title: 'No absolute address under conflicting context optima',
    statement:
      'If two contexts have disjoint strict optimal renderings or resolutions, no single condition-free address output is optimal for both.',
    dependsOn: ['AMT-A5'],
    verification: 'lean-proved',
    proofSketch:
      'Assume one output is optimal for both contexts. Disjoint strict optima force it to equal two different outputs, contradiction.',
    limitations: ['Shared identifiers may still connect the context-specific renderings.'],
  },
  {
    id: 'AMT-T10',
    kind: 'existence-theorem',
    title: 'Audit replay existence under fixed inputs',
    statement:
      'If the audit envelope contains committed input, context, source versions, candidates, clusters, decision, policy, quality, and time, then the decision procedure can be replayed under the same versions.',
    dependsOn: ['AMT-A4', 'AMT-A5', 'AMT-A6'],
    verification: 'implementation-supported',
    proofSketch:
      'The replay procedure is a deterministic evaluation of the recorded pipeline fields under fixed source and policy versions.',
    limitations: ['Replay proves procedural consistency, not real-world correctness.'],
  },
];

export const AMT_COMPLEXITY_BOUNDS: AmtComplexityBound[] = [
  {
    id: 'AMT-CX1',
    operation: 'Candidate generation with indexed lookup',
    variables: {
      n: 'number of indexed address records',
      k: 'number of returned candidates',
      q: 'number of query tokens or normalized keys',
    },
    time: 'O(q log n + k)',
    space: 'O(n)',
    notes: [
      'Trie, B-tree, inverted index, or spatial index choices change constants and query terms.',
      'Without an index, a scan degrades to O(n).',
    ],
  },
  {
    id: 'AMT-CX2',
    operation: 'Pairwise structural clustering',
    variables: {
      k: 'candidate count after generation',
      d: 'number of structural distance components',
    },
    time: 'O(k^2 d)',
    space: 'O(k^2) or O(k) with streaming thresholds',
    notes: [
      'Blocking by region, postal prefix, grid, or entity type is required for large candidate sets.',
      'This is why candidate recall and candidate pruning must be evaluated together.',
    ],
  },
  {
    id: 'AMT-CX3',
    operation: 'Context scoring',
    variables: {
      k: 'candidate or cluster count',
      f: 'number of scoring features',
    },
    time: 'O(k f)',
    space: 'O(k)',
    notes: [
      'Feature extraction can dominate if it requires remote GIS or source reads.',
      'Production systems should precompute stable features and keep raw private data out of scoring logs.',
    ],
  },
  {
    id: 'AMT-CX4',
    operation: 'Lineage update',
    variables: {
      e: 'number of accepted lineage events in a batch',
      h: 'existing lineage graph size',
    },
    time: 'O(e log h)',
    space: 'O(e)',
    notes: [
      'Append-only ledgers can use content-addressed events.',
      'Split and merge checks may add local graph traversal costs.',
    ],
  },
  {
    id: 'AMT-CX5',
    operation: 'PID issuance gate',
    variables: {
      k: 'candidate or cluster count',
      g: 'number of gate predicates',
    },
    time: 'O(k + g)',
    space: 'O(1) beyond candidate and audit envelope storage',
    notes: [
      'Cryptographic proof generation is not included; that belongs to the ZK companion model.',
      'The gate is intentionally cheap compared with candidate generation and clustering.',
    ],
  },
];

export function getAddressMorphismFormalSystem() {
  return {
    version: ADDRESS_MORPHISM_FORMAL_SYSTEM_VERSION,
    axioms: AMT_FORMAL_AXIOMS,
    theorems: AMT_FORMAL_THEOREMS,
    complexity: AMT_COMPLEXITY_BOUNDS,
  };
}

export function validateAddressMorphismFormalSystem() {
  const claims = [...AMT_FORMAL_AXIOMS, ...AMT_FORMAL_THEOREMS];
  const ids = new Set<string>();
  const errors: string[] = [];

  for (const claim of claims) {
    if (ids.has(claim.id)) errors.push(`duplicate claim id: ${claim.id}`);
    ids.add(claim.id);
    if (!claim.statement.trim()) errors.push(`missing statement: ${claim.id}`);
    if (!claim.proofSketch.trim()) errors.push(`missing proof sketch: ${claim.id}`);
    for (const dependency of claim.dependsOn) {
      if (!ids.has(dependency) && !claims.some(candidate => candidate.id === dependency)) {
        errors.push(`${claim.id} depends on unknown claim ${dependency}`);
      }
    }
  }

  for (const theorem of AMT_FORMAL_THEOREMS) {
    if (theorem.limitations.length === 0) {
      errors.push(`${theorem.id} must declare limitations`);
    }
  }

  for (const bound of AMT_COMPLEXITY_BOUNDS) {
    if (!/^O\(.+\)$/.test(bound.time)) errors.push(`${bound.id} time must be Big-O`);
    if (!/^O\(.+\)/.test(bound.space)) errors.push(`${bound.id} space must be Big-O`);
  }

  return {
    valid: errors.length === 0,
    errors,
    claimCount: claims.length,
    complexityBoundCount: AMT_COMPLEXITY_BOUNDS.length,
  };
}
