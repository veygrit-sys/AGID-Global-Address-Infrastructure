export const ADDRESS_MORPHISM_V2_CHAPTER7_SAFE_RESOLUTION_VERSION =
  'address-morphism-v2-chapter7-safe-resolution-v0.1';

export type Chapter7DecisionState = 'resolved' | 'unresolved' | 'manual_review' | 'blocked';

export type Chapter7CandidateClass = {
  id: string;
  structuralDistance: number;
  purposeLoss: number;
  uncertainty: number;
  qualityPenalty: number;
  governanceRisk: number;
  quality: number;
  conflictRisk: number;
};

export type Chapter7EnergyWeights = {
  structuralDistance: number;
  purposeLoss: number;
  uncertainty: number;
  qualityPenalty: number;
  governanceRisk: number;
};

export type Chapter7ResolutionInput = {
  candidateClasses: Chapter7CandidateClass[];
  finiteCandidateClassSet: boolean;
  candidateSufficient: boolean;
  evidenceOk: boolean;
  publicProjectionSafe: boolean;
  lineageReady: boolean;
  revocationReady: boolean;
  auditReady: boolean;
  deterministicTieBreak: boolean;
  tieBreakSafe: boolean;
  minEnergyGap: number;
  qualityThreshold: number;
  conflictRiskThreshold: number;
  weights: Chapter7EnergyWeights;
};

export type Chapter7ResolutionDecision = {
  state: Chapter7DecisionState;
  selectedCandidateClassId?: string;
  pidIssuanceAllowed: boolean;
  energy?: number;
  energyGap?: number;
  reasons: string[];
};

export type Chapter7GateClass = 'resolution' | 'review' | 'pid';

export type Chapter7DecisionGate = {
  id: string;
  gateClass: Chapter7GateClass;
  passState: Chapter7DecisionState | 'pid_allowed';
  failState: Chapter7DecisionState | 'pid_blocked';
  formula: string;
};

export type Chapter7ResolutionCertificate = {
  decisionState: Chapter7DecisionState;
  selectedCandidateClassId?: string;
  energy?: number;
  energyGap?: number;
  resolutionCanBeUsed: boolean;
  pidCanBeIssued: boolean;
  failedReasons: string[];
  nonClaims: string[];
};

export const CHAPTER7_DEFAULT_WEIGHTS: Chapter7EnergyWeights = {
  structuralDistance: 0.35,
  purposeLoss: 0.2,
  uncertainty: 0.2,
  qualityPenalty: 0.15,
  governanceRisk: 0.1,
};

export const CHAPTER7_DECISION_GATE_TABLE: Chapter7DecisionGate[] = [
  {
    id: 'finite-candidate-class-required',
    gateClass: 'resolution',
    passState: 'resolved',
    failState: 'unresolved',
    formula: '|K_t(s,p)| < infinity and |K_t(s,p)| > 0',
  },
  {
    id: 'candidate-sufficiency-required',
    gateClass: 'resolution',
    passState: 'resolved',
    failState: 'unresolved',
    formula: 'CandidateSufficient_t(s,p)=1',
  },
  {
    id: 'evidence-required',
    gateClass: 'resolution',
    passState: 'resolved',
    failState: 'unresolved',
    formula: 'EvidenceOK_t(K,p)=1',
  },
  {
    id: 'energy-gap-below-purpose-threshold',
    gateClass: 'review',
    passState: 'resolved',
    failState: 'manual_review',
    formula: 'DeltaE >= mu_p',
  },
  {
    id: 'safe-deterministic-tie-break-required',
    gateClass: 'review',
    passState: 'resolved',
    failState: 'manual_review',
    formula: 'TieBreakSafe_t,p=1 when energies tie',
  },
  {
    id: 'quality-below-threshold',
    gateClass: 'review',
    passState: 'resolved',
    failState: 'manual_review',
    formula: 'Quality_t,p(K*) >= theta_p',
  },
  {
    id: 'conflict-risk-above-threshold',
    gateClass: 'review',
    passState: 'resolved',
    failState: 'manual_review',
    formula: 'ConflictRisk_t,p(K*) <= tau_p',
  },
  {
    id: 'public-projection-safety-required',
    gateClass: 'pid',
    passState: 'pid_allowed',
    failState: 'pid_blocked',
    formula: 'PublicProjectionSafe_t(r,p)=1',
  },
  {
    id: 'lineage-readiness-required',
    gateClass: 'pid',
    passState: 'pid_allowed',
    failState: 'pid_blocked',
    formula: 'LineageReady_t(r)=1',
  },
  {
    id: 'revocation-readiness-required',
    gateClass: 'pid',
    passState: 'pid_allowed',
    failState: 'pid_blocked',
    formula: 'RevocationReady_t(r)=1',
  },
  {
    id: 'audit-readiness-required',
    gateClass: 'pid',
    passState: 'pid_allowed',
    failState: 'pid_blocked',
    formula: 'AuditReady_t(r,p)=1',
  },
];

export function computeChapter7Energy(
  candidateClass: Chapter7CandidateClass,
  weights: Chapter7EnergyWeights = CHAPTER7_DEFAULT_WEIGHTS,
): number {
  return round(
    candidateClass.structuralDistance * weights.structuralDistance +
      candidateClass.purposeLoss * weights.purposeLoss +
      candidateClass.uncertainty * weights.uncertainty +
      candidateClass.qualityPenalty * weights.qualityPenalty +
      candidateClass.governanceRisk * weights.governanceRisk,
  );
}

export function resolveChapter7FiniteCandidateClasses(input: Chapter7ResolutionInput): Chapter7ResolutionDecision {
  if (!input.finiteCandidateClassSet) {
    return unresolved(['finite-candidate-class-required']);
  }
  if (input.candidateClasses.length === 0) {
    return unresolved(['non-empty-candidate-class-required']);
  }
  if (!input.candidateSufficient) {
    return unresolved(['candidate-sufficiency-required']);
  }
  if (!input.evidenceOk) {
    return unresolved(['evidence-required']);
  }

  const ranked = input.candidateClasses
    .map(candidateClass => ({
      candidateClass,
      energy: computeChapter7Energy(candidateClass, input.weights),
    }))
    .sort((left, right) => left.energy - right.energy || left.candidateClass.id.localeCompare(right.candidateClass.id));

  const best = ranked[0];
  const second = ranked[1];
  const energyGap = second ? round(second.energy - best.energy) : Number.POSITIVE_INFINITY;

  if (energyGap === 0 && (!input.deterministicTieBreak || !input.tieBreakSafe)) {
    return manual(best, energyGap, ['safe-deterministic-tie-break-required']);
  }

  if (energyGap > 0 && energyGap < input.minEnergyGap) {
    return manual(best, energyGap, ['energy-gap-below-purpose-threshold']);
  }

  if (best.candidateClass.quality < input.qualityThreshold) {
    return manual(best, energyGap, ['quality-below-threshold']);
  }

  if (best.candidateClass.conflictRisk > input.conflictRiskThreshold) {
    return manual(best, energyGap, ['conflict-risk-above-threshold']);
  }

  const pidIssuanceAllowed =
    input.publicProjectionSafe && input.lineageReady && input.revocationReady && input.auditReady;

  const reasons = pidIssuanceAllowed ? [] : buildPidBlockedReasons(input);

  return {
    state: 'resolved',
    selectedCandidateClassId: best.candidateClass.id,
    pidIssuanceAllowed,
    energy: best.energy,
    energyGap,
    reasons,
  };
}

export function buildChapter7PidBoundary(input: Chapter7ResolutionDecision): {
  canIssuePid: boolean;
  requiresResolved: true;
  nonClaims: string[];
} {
  return {
    canIssuePid: input.state === 'resolved' && input.pidIssuanceAllowed,
    requiresResolved: true,
    nonClaims: [
      'resolved does not imply PID issuance',
      'minimum energy does not prove global truth',
      'manual review is a safe state, not model failure',
    ],
  };
}

export function buildChapter7ResolutionCertificate(
  decision: Chapter7ResolutionDecision,
): Chapter7ResolutionCertificate {
  return {
    decisionState: decision.state,
    selectedCandidateClassId: decision.selectedCandidateClassId,
    energy: decision.energy,
    energyGap: decision.energyGap,
    resolutionCanBeUsed: decision.state === 'resolved',
    pidCanBeIssued: decision.state === 'resolved' && decision.pidIssuanceAllowed,
    failedReasons: decision.reasons,
    nonClaims: [
      'resolution certificate is not raw address disclosure',
      'resolution certificate is not a PID by itself',
      'minimum energy is not global truth',
      'manual_review and unresolved are safe outputs',
      'PID issuance requires stricter public projection, lineage, revocation, and audit gates',
    ],
  };
}

export function buildChapter7SafeResolutionReport() {
  return {
    version: ADDRESS_MORPHISM_V2_CHAPTER7_SAFE_RESOLUTION_VERSION,
    gateCount: CHAPTER7_DECISION_GATE_TABLE.length,
    executableModelKinds: [
      'finite candidate class set',
      'energy function',
      'finite argmin',
      'minimum energy gap',
      'deterministic tie break',
      'decision gate table',
      'resolution certificate',
      'manual review state',
      'unresolved state',
      'PID issuance boundary',
      'public projection safety gate',
    ],
    safetyRule:
      'AMT may resolve only over a finite sufficient candidate-class set with evidence; PID issuance is a separate stricter boundary.',
  };
}

function unresolved(reasons: string[]): Chapter7ResolutionDecision {
  return {
    state: 'unresolved',
    pidIssuanceAllowed: false,
    reasons,
  };
}

function manual(
  best: { candidateClass: Chapter7CandidateClass; energy: number },
  energyGap: number,
  reasons: string[],
): Chapter7ResolutionDecision {
  return {
    state: 'manual_review',
    selectedCandidateClassId: best.candidateClass.id,
    pidIssuanceAllowed: false,
    energy: best.energy,
    energyGap,
    reasons,
  };
}

function buildPidBlockedReasons(input: Chapter7ResolutionInput): string[] {
  const reasons: string[] = [];
  if (!input.publicProjectionSafe) reasons.push('public-projection-safety-required');
  if (!input.lineageReady) reasons.push('lineage-readiness-required');
  if (!input.revocationReady) reasons.push('revocation-readiness-required');
  if (!input.auditReady) reasons.push('audit-readiness-required');
  return reasons;
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
