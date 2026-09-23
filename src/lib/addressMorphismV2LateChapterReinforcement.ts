export const ADDRESS_MORPHISM_V2_LATE_CHAPTER_REINFORCEMENT_VERSION =
  'address-morphism-v2-late-chapter-reinforcement-v0.1';

export type LateChapterNumber = 8 | 9 | 10 | 11 | 12;

export type LateChapterWeakness =
  | 'history-as-eternal-pid'
  | 'probability-as-truth'
  | 'cross-domain-as-example-list'
  | 'protocols-without-responsibility-boundary'
  | 'benchmark-plan-as-victory-claim';

export type LateChapterReinforcementRecord = {
  chapter: LateChapterNumber;
  weakness: LateChapterWeakness;
  invariant: string;
  failureMode: string;
  counterexample: string;
  fixtureHook: string;
  nonClaim: string;
};

export type LateChapterReinforcementEvaluation = {
  chapter: LateChapterNumber;
  reinforced: boolean;
  score: number;
  missing: string[];
};

export function buildLateChapterReinforcementPlan(): {
  version: string;
  records: LateChapterReinforcementRecord[];
  maturityPath: string[];
} {
  return {
    version: ADDRESS_MORPHISM_V2_LATE_CHAPTER_REINFORCEMENT_VERSION,
    records: [
      {
        chapter: 8,
        weakness: 'history-as-eternal-pid',
        invariant: 'lineage is preserved even when PID state changes',
        failureMode: 'silent PID reuse after split, merge, relocation, or deprecation',
        counterexample: 'delivery success is not residence proof and application alias is not PID',
        fixtureHook: 'split/merge/relocation/public-history-redaction fixtures',
        nonClaim: 'PID conservation does not mean an identifier never changes',
      },
      {
        chapter: 9,
        weakness: 'probability-as-truth',
        invariant: 'unsafe accept loss dominates manual review loss',
        failureMode: 'high posterior with missing source coverage or stale evidence',
        counterexample: 'low entropy without the true candidate in the candidate set',
        fixtureHook: 'posterior gap, entropy, expected loss, and evidence-sensitivity fixtures',
        nonClaim: 'probability and quality do not prove truth or PID eligibility',
      },
      {
        chapter: 10,
        weakness: 'cross-domain-as-example-list',
        invariant: 'referents are purpose-scoped by boundary, route, time, and privacy projection',
        failureMode: 'fuzzy, stale, or policy-dependent boundary used as fixed identity',
        counterexample: 'same coordinate with different floors or different route reachability',
        fixtureHook: 'sea, island, vertical, emergency, locker, and digital twin fixtures',
        nonClaim: 'cross-domain reachability does not prove ownership, residence, or legal identity',
      },
      {
        chapter: 11,
        weakness: 'protocols-without-responsibility-boundary',
        invariant: 'actor view is no larger than actor need for purpose and time',
        failureMode: 'merchant raw-address collection or carrier decrypt without active session',
        counterexample: 'ZK proof cannot repair unresolved AMT envelope',
        fixtureHook: 'envelope, verifier policy, nullifier, revocation, audit, and emergency fixtures',
        nonClaim: 'cryptographic proof is not address resolution and not raw-address permission',
      },
      {
        chapter: 12,
        weakness: 'benchmark-plan-as-victory-claim',
        invariant: 'claims are publishable only with scope, artifacts, tests, non-claims, and risk',
        failureMode: 'unverified universal claim or unfair commercial API comparison',
        counterexample: 'case study is not global proof and hard-error zero is not strict-warning zero',
        fixtureHook: 'claim status, benchmark readiness, fair comparison, and publication-safety fixtures',
        nonClaim: 'benchmark plans and case studies are not victory declarations',
      },
    ],
    maturityPath: [
      'written claim',
      'formal definition',
      'executable fixture',
      'failure-mode test',
      'benchmark corpus',
      'independent comparison',
      'audited implementation',
    ],
  };
}

export function evaluateLateChapterReinforcement(
  record: LateChapterReinforcementRecord,
): LateChapterReinforcementEvaluation {
  const missing: string[] = [];

  if (!record.invariant.trim()) missing.push('invariant');
  if (!record.failureMode.trim()) missing.push('failure-mode');
  if (!record.counterexample.trim()) missing.push('counterexample');
  if (!record.fixtureHook.trim()) missing.push('fixture-hook');
  if (!record.nonClaim.trim()) missing.push('non-claim');

  const score = (5 - missing.length) / 5;

  return {
    chapter: record.chapter,
    reinforced: missing.length === 0,
    score,
    missing,
  };
}

export function auditLateChapterReinforcement(records = buildLateChapterReinforcementPlan().records): {
  complete: boolean;
  coverage: Record<LateChapterNumber, LateChapterReinforcementEvaluation>;
  weakChapters: LateChapterNumber[];
} {
  const coverage = Object.fromEntries(
    records.map(record => [record.chapter, evaluateLateChapterReinforcement(record)]),
  ) as Record<LateChapterNumber, LateChapterReinforcementEvaluation>;

  const expected: LateChapterNumber[] = [8, 9, 10, 11, 12];
  const weakChapters = expected.filter(chapter => !coverage[chapter]?.reinforced);

  return {
    complete: weakChapters.length === 0,
    coverage,
    weakChapters,
  };
}

export function lateChapterWeaknessRequiresNonClaim(weakness: LateChapterWeakness): string {
  const record = buildLateChapterReinforcementPlan().records.find(item => item.weakness === weakness);
  return record?.nonClaim ?? 'unknown weakness must not be published without a non-claim';
}
