export const ADDRESS_MORPHISM_V2_CHAPTER4_AXIOMS_VERSION = 'address-morphism-v2-chapter4-axioms-v0.1';

export type AxiomGateId =
  | 'candidate-sufficiency'
  | 'evidence-admissibility'
  | 'purpose-relativity'
  | 'finite-candidates'
  | 'structural-comparability'
  | 'ordering-decidability'
  | 'public-projection-safety';

export type AxiomGateState = 'pass' | 'fail' | 'unknown';

export type ResolutionState =
  | 'resolved'
  | 'ambiguous'
  | 'unresolved'
  | 'source_insufficient'
  | 'candidate_insufficient'
  | 'manual_review'
  | 'invalid'
  | 'deprecated'
  | 'disputed'
  | 'restricted';

export type AxiomGate = {
  id: AxiomGateId;
  name: string;
  formula: string;
  requiredForResolved: boolean;
};

export type AxiomEvaluationInput = {
  gates: Record<AxiomGateId, AxiomGateState>;
  preferredFailureState?: Partial<Record<AxiomGateId, ResolutionState>>;
};

export type AxiomEvaluationResult = {
  canResolve: boolean;
  state: ResolutionState;
  failedOrUnknownGates: AxiomGateId[];
};

export const CHAPTER4_AXIOM_GATES: AxiomGate[] = [
  {
    id: 'candidate-sufficiency',
    name: 'Candidate sufficiency',
    formula: 'CoverageOK_t(s,p)=1 => r*_t,p(s) in C_t(s,p)',
    requiredForResolved: true,
  },
  {
    id: 'evidence-admissibility',
    name: 'Evidence admissibility',
    formula: 'Use_t(e,r,p)=1 => Admissible_t(e,p)=1',
    requiredForResolved: true,
  },
  {
    id: 'purpose-relativity',
    name: 'Purpose relativity',
    formula: 'rho_t,p(s) is evaluated under purpose p',
    requiredForResolved: true,
  },
  {
    id: 'finite-candidates',
    name: 'Finite candidates',
    formula: '|C_t(s,p)| < infinity',
    requiredForResolved: true,
  },
  {
    id: 'structural-comparability',
    name: 'Structural comparability',
    formula: 'D_t,p(r_i,r_j) is defined before equivalence is claimed',
    requiredForResolved: true,
  },
  {
    id: 'ordering-decidability',
    name: 'Ordering decidability',
    formula: 'Comparable_t(C_t(s,p),p)=1 => min_preorder C_t(s,p) exists',
    requiredForResolved: true,
  },
  {
    id: 'public-projection-safety',
    name: 'Public projection safety',
    formula: 'I(PrivateAttr(r); pi_pub(r)) <= epsilon_p',
    requiredForResolved: true,
  },
];

const DEFAULT_FAILURE_STATE: Record<AxiomGateId, ResolutionState> = {
  'candidate-sufficiency': 'candidate_insufficient',
  'evidence-admissibility': 'manual_review',
  'purpose-relativity': 'manual_review',
  'finite-candidates': 'candidate_insufficient',
  'structural-comparability': 'ambiguous',
  'ordering-decidability': 'ambiguous',
  'public-projection-safety': 'restricted',
};

export function evaluateChapter4AxiomGates(input: AxiomEvaluationInput): AxiomEvaluationResult {
  const failedOrUnknownGates = CHAPTER4_AXIOM_GATES.filter(gate => gate.requiredForResolved)
    .filter(gate => input.gates[gate.id] !== 'pass')
    .map(gate => gate.id);

  if (failedOrUnknownGates.length === 0) {
    return {
      canResolve: true,
      state: 'resolved',
      failedOrUnknownGates: [],
    };
  }

  const firstFailure = failedOrUnknownGates[0];
  const state = input.preferredFailureState?.[firstFailure] ?? DEFAULT_FAILURE_STATE[firstFailure] ?? 'unresolved';

  return {
    canResolve: false,
    state,
    failedOrUnknownGates,
  };
}

export function buildChapter4AxiomReport() {
  return {
    version: ADDRESS_MORPHISM_V2_CHAPTER4_AXIOMS_VERSION,
    gateCount: CHAPTER4_AXIOM_GATES.length,
    requiredGateCount: CHAPTER4_AXIOM_GATES.filter(gate => gate.requiredForResolved).length,
    gates: CHAPTER4_AXIOM_GATES,
    safetyRule:
      'If any required axiom gate fails or is unknown, the resolver must return abstention, review, or a restricted state instead of resolved.',
  };
}
