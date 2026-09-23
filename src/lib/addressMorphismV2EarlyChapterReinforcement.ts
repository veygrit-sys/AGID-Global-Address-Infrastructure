export const ADDRESS_MORPHISM_V2_EARLY_CHAPTER_REINFORCEMENT_VERSION =
  'address-morphism-v2-early-chapter-reinforcement-v0.1';

export type EarlyChapterNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type EarlyChapterWeakness =
  | 'registration-as-form-ux'
  | 'prior-work-as-replacement-battle'
  | 'registrable-as-publicable'
  | 'axioms-as-ideal-world-assumptions'
  | 'candidate-generation-as-completeness'
  | 'distance-as-universal-identity'
  | 'argmin-as-resolution-or-pid';

export type EarlyChapterReinforcementRecord = {
  chapter: EarlyChapterNumber;
  weakness: EarlyChapterWeakness;
  invariant: string;
  failureMode: string;
  counterexample: string;
  fixtureHook: string;
  nonClaim: string;
};

export type EarlyChapterReinforcementEvaluation = {
  chapter: EarlyChapterNumber;
  reinforced: boolean;
  score: number;
  missing: string[];
};

export function buildEarlyChapterReinforcementPlan(): {
  version: string;
  records: EarlyChapterReinforcementRecord[];
  frontHalfContract: string[];
} {
  return {
    version: ADDRESS_MORPHISM_V2_EARLY_CHAPTER_REINFORCEMENT_VERSION,
    records: [
      {
        chapter: 1,
        weakness: 'registration-as-form-ux',
        invariant: 'address registration is a reference reuse and disclosure-boundary problem',
        failureMode: 'better forms still force raw address re-entry and over-collection',
        counterexample: 'two services store expressions for the same referent without a safe morphism',
        fixtureHook: 'registration bottleneck and layer-separation fixture',
        nonClaim: 'AMT is not merely a checkout or address-form optimization',
      },
      {
        chapter: 2,
        weakness: 'prior-work-as-replacement-battle',
        invariant: 'existing outputs are evidence layers, not the AMT safe referent itself',
        failureMode: 'comparison without same dataset, purpose, metric, failure taxonomy, and disclosure boundary',
        counterexample: 'geocoding, postal code, DID, VC, or ZK output used as address identity by itself',
        fixtureHook: 'related-work compatibility and fair-comparison fixture',
        nonClaim: 'AMT does not replace standards, GIS, DID, VC, ZK, or commercial APIs by assertion',
      },
      {
        chapter: 3,
        weakness: 'registrable-as-publicable',
        invariant: 'referable, registrable, resolvable, publicable, deliverable, and credentialed are distinct',
        failureMode: 'private vertical or sensitive social referent is published as a public PID',
        counterexample: 'apartment unit, shelter stay, or locker session treated as public identity',
        fixtureHook: 'registrability/publicability boundary fixture',
        nonClaim: 'not every named, reachable, or useful object should become a public address identifier',
      },
      {
        chapter: 4,
        weakness: 'axioms-as-ideal-world-assumptions',
        invariant: 'a broken required gate yields unresolved, manual review, or blocked state',
        failureMode: 'resolver returns a precise referent despite broken candidate, evidence, or privacy gate',
        counterexample: 'source freshness unknown or public projection unsafe but resolved output is published',
        fixtureHook: 'axiom gate and safe-abstention fixture',
        nonClaim: 'AMT does not assume ideal global data coverage',
      },
      {
        chapter: 5,
        weakness: 'candidate-generation-as-completeness',
        invariant: 'candidate generation records recall layers and candidate debt',
        failureMode: 'true referent is missing but the candidate set is treated as complete',
        counterexample: 'old village name, seasonal ferry island, or temporary hotel delivery omitted from sources',
        fixtureHook: 'candidate coverage certificate and source-debt fixture',
        nonClaim: 'candidate generation is not identity proof, PID issuance, or global completeness',
      },
      {
        chapter: 6,
        weakness: 'distance-as-universal-identity',
        invariant: 'structural distance is purpose- and context-scoped and may be undefined',
        failureMode: 'coordinate, string, postal, POI, or ML distance is used as a universal identity metric',
        counterexample: 'same coordinate different floors or route-incomparable logistics nodes',
        fixtureHook: 'comparability, bounded-cluster, and chain-link counterexample fixture',
        nonClaim: 'small distance alone does not prove identity',
      },
      {
        chapter: 7,
        weakness: 'argmin-as-resolution-or-pid',
        invariant: 'argmin, safe resolution, and PID issuance are separate gates',
        failureMode: 'minimum-energy candidate is accepted despite unsafe gap, quality, conflict, projection, or audit',
        counterexample: 'resolved candidate with unsafe public projection is issued as PID',
        fixtureHook: 'decision gate table and PID-boundary fixture',
        nonClaim: 'existence of a minimum-energy candidate does not imply resolution or PID issuance',
      },
    ],
    frontHalfContract: [
      'define the problem as reference reuse, not form annoyance',
      'treat prior work as evidence and compatibility layers',
      'separate referability, registrability, publicability, and deliverability',
      'make broken assumptions produce safe states',
      'expose candidate debt instead of claiming completeness',
      'use structural distance only when comparison is meaningful',
      'separate estimation, resolution, and PID issuance',
    ],
  };
}

export function evaluateEarlyChapterReinforcement(
  record: EarlyChapterReinforcementRecord,
): EarlyChapterReinforcementEvaluation {
  const missing: string[] = [];

  if (!record.invariant.trim()) missing.push('invariant');
  if (!record.failureMode.trim()) missing.push('failure-mode');
  if (!record.counterexample.trim()) missing.push('counterexample');
  if (!record.fixtureHook.trim()) missing.push('fixture-hook');
  if (!record.nonClaim.trim()) missing.push('non-claim');

  return {
    chapter: record.chapter,
    reinforced: missing.length === 0,
    score: (5 - missing.length) / 5,
    missing,
  };
}

export function auditEarlyChapterReinforcement(records = buildEarlyChapterReinforcementPlan().records): {
  complete: boolean;
  coverage: Record<EarlyChapterNumber, EarlyChapterReinforcementEvaluation>;
  weakChapters: EarlyChapterNumber[];
} {
  const coverage = Object.fromEntries(
    records.map(record => [record.chapter, evaluateEarlyChapterReinforcement(record)]),
  ) as Record<EarlyChapterNumber, EarlyChapterReinforcementEvaluation>;

  const expected: EarlyChapterNumber[] = [1, 2, 3, 4, 5, 6, 7];
  const weakChapters = expected.filter(chapter => !coverage[chapter]?.reinforced);

  return {
    complete: weakChapters.length === 0,
    coverage,
    weakChapters,
  };
}

export function earlyChapterWeaknessRequiresNonClaim(weakness: EarlyChapterWeakness): string {
  const record = buildEarlyChapterReinforcementPlan().records.find(item => item.weakness === weakness);
  return record?.nonClaim ?? 'unknown front-half weakness must not be published without a non-claim';
}
