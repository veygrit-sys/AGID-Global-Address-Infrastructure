export const ADDRESS_MORPHISM_V2_CHAPTER6_STRUCTURAL_EQUIVALENCE_VERSION =
  'address-morphism-v2-chapter6-structural-equivalence-v0.1';

export type Chapter6Purpose = 'delivery' | 'identity' | 'natural_feature' | 'zk_predicate';

export type Chapter6FeatureKey =
  | 'country'
  | 'adminPath'
  | 'postalZone'
  | 'roadSegment'
  | 'building'
  | 'entrance'
  | 'unit'
  | 'coordinateCell'
  | 'naturalOrCulturalFeature'
  | 'temporalScope';

export type Chapter6StructuralFeatureVector = Partial<Record<Chapter6FeatureKey, string>>;

export type Chapter6DistanceComponent = {
  key: Chapter6FeatureKey;
  weight: number;
  mismatch: 0 | 0.5 | 1;
  contribution: number;
};

export type Chapter6StructuralDistanceResult = {
  distance: number;
  comparable: boolean;
  components: Chapter6DistanceComponent[];
  sharedDiscriminatingKeys: Chapter6FeatureKey[];
};

export type Chapter6EquivalenceDecision = {
  state: 'equivalent' | 'distinct' | 'abstain';
  distance: number;
  reasons: string[];
};

export type Chapter6Candidate = {
  id: string;
  features: Chapter6StructuralFeatureVector;
};

export type Chapter6Cluster = {
  id: string;
  memberIds: string[];
  diameter: number;
};

export const CHAPTER6_PURPOSE_WEIGHTS: Record<Chapter6Purpose, Record<Chapter6FeatureKey, number>> = {
  delivery: {
    country: 1,
    adminPath: 2,
    postalZone: 2,
    roadSegment: 4,
    building: 5,
    entrance: 5,
    unit: 4,
    coordinateCell: 2,
    naturalOrCulturalFeature: 1,
    temporalScope: 2,
  },
  identity: {
    country: 2,
    adminPath: 5,
    postalZone: 2,
    roadSegment: 2,
    building: 4,
    entrance: 2,
    unit: 3,
    coordinateCell: 1,
    naturalOrCulturalFeature: 1,
    temporalScope: 3,
  },
  natural_feature: {
    country: 1,
    adminPath: 2,
    postalZone: 0,
    roadSegment: 0,
    building: 0,
    entrance: 0,
    unit: 0,
    coordinateCell: 4,
    naturalOrCulturalFeature: 6,
    temporalScope: 2,
  },
  zk_predicate: {
    country: 4,
    adminPath: 4,
    postalZone: 3,
    roadSegment: 1,
    building: 1,
    entrance: 1,
    unit: 0,
    coordinateCell: 3,
    naturalOrCulturalFeature: 1,
    temporalScope: 2,
  },
};

const DISCRIMINATING_KEYS: Chapter6FeatureKey[] = [
  'adminPath',
  'roadSegment',
  'building',
  'entrance',
  'unit',
  'coordinateCell',
  'naturalOrCulturalFeature',
];

export function computeChapter6StructuralDistance(
  left: Chapter6StructuralFeatureVector,
  right: Chapter6StructuralFeatureVector,
  purpose: Chapter6Purpose,
): Chapter6StructuralDistanceResult {
  const weights = CHAPTER6_PURPOSE_WEIGHTS[purpose];
  const components: Chapter6DistanceComponent[] = [];
  let numerator = 0;
  let denominator = 0;
  const sharedDiscriminatingKeys: Chapter6FeatureKey[] = [];

  for (const key of Object.keys(weights) as Chapter6FeatureKey[]) {
    const weight = weights[key];
    if (weight <= 0) continue;

    const leftValue = left[key];
    const rightValue = right[key];
    if (leftValue === undefined && rightValue === undefined) continue;

    const mismatch: 0 | 0.5 | 1 =
      leftValue === undefined || rightValue === undefined ? 0.5 : leftValue === rightValue ? 0 : 1;
    const contribution = weight * mismatch;

    numerator += contribution;
    denominator += weight;
    components.push({ key, weight, mismatch, contribution });

    if (leftValue !== undefined && rightValue !== undefined && DISCRIMINATING_KEYS.includes(key)) {
      sharedDiscriminatingKeys.push(key);
    }
  }

  return {
    distance: denominator === 0 ? 1 : round(numerator / denominator),
    comparable: sharedDiscriminatingKeys.length > 0,
    components,
    sharedDiscriminatingKeys,
  };
}

export function decideChapter6StructuralEquivalence(input: {
  distanceResult: Chapter6StructuralDistanceResult;
  delta: number;
  evidenceOk: boolean;
  candidateSufficient: boolean;
}): Chapter6EquivalenceDecision {
  const reasons: string[] = [];

  if (!input.candidateSufficient) reasons.push('candidate-sufficiency-required');
  if (!input.evidenceOk) reasons.push('evidence-required');
  if (!input.distanceResult.comparable) reasons.push('structural-comparability-required');

  if (reasons.length > 0) {
    return { state: 'abstain', distance: input.distanceResult.distance, reasons };
  }

  if (input.distanceResult.distance <= input.delta) {
    return { state: 'equivalent', distance: input.distanceResult.distance, reasons };
  }

  return {
    state: 'distinct',
    distance: input.distanceResult.distance,
    reasons: ['distance-above-threshold'],
  };
}

export function buildChapter6CounterexampleFixtures() {
  return {
    samePostalDifferentBuilding: {
      left: { country: 'XX', postalZone: 'P-100', building: 'B-1', entrance: 'E-1' },
      right: { country: 'XX', postalZone: 'P-100', building: 'B-2', entrance: 'E-2' },
      nonClaim: 'postal equality does not imply referent equality',
    },
    samePoiDifferentEntrance: {
      left: { country: 'XX', naturalOrCulturalFeature: 'POI-1', entrance: 'north' },
      right: { country: 'XX', naturalOrCulturalFeature: 'POI-1', entrance: 'loading' },
      nonClaim: 'POI equality does not imply entrance equality',
    },
    sameCoordinateDifferentUnit: {
      left: { country: 'XX', coordinateCell: 'CELL-1', building: 'B-1', unit: 'U-1' },
      right: { country: 'XX', coordinateCell: 'CELL-1', building: 'B-1', unit: 'U-2' },
      nonClaim: 'coordinate-cell equality does not imply unit equality',
    },
  };
}

export function buildChapter6TransitiveChainCounterexample() {
  const candidates: Chapter6Candidate[] = [
    { id: 'r1', features: { country: 'XX', building: 'B-1', entrance: 'front' } },
    { id: 'r2', features: { country: 'XX', building: 'B-1' } },
    { id: 'r3', features: { country: 'XX', building: 'B-1', entrance: 'loading' } },
  ];

  return {
    candidates,
    purpose: 'delivery' as const,
    delta: 0.3,
    nonClaim: 'pairwise adjacent near links do not imply bounded cluster diameter',
  };
}

export function computeChapter6ClusterDiameter(
  candidates: Chapter6Candidate[],
  purpose: Chapter6Purpose,
): number {
  let diameter = 0;

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = i + 1; j < candidates.length; j += 1) {
      const distance = computeChapter6StructuralDistance(candidates[i].features, candidates[j].features, purpose).distance;
      diameter = Math.max(diameter, distance);
    }
  }

  return round(diameter);
}

export function buildChapter6BoundedClusters(
  candidates: Chapter6Candidate[],
  purpose: Chapter6Purpose,
  delta: number,
): Chapter6Cluster[] {
  const clusters: Chapter6Candidate[][] = [];

  for (const candidate of candidates) {
    const matchingCluster = clusters.find(cluster =>
      cluster.every(member => {
        const distanceResult = computeChapter6StructuralDistance(candidate.features, member.features, purpose);
        const decision = decideChapter6StructuralEquivalence({
          distanceResult,
          delta,
          evidenceOk: true,
          candidateSufficient: true,
        });
        return decision.state === 'equivalent';
      }),
    );

    if (matchingCluster) {
      matchingCluster.push(candidate);
    } else {
      clusters.push([candidate]);
    }
  }

  return clusters.map((cluster, index) => ({
    id: `cluster-${index + 1}`,
    memberIds: cluster.map(candidate => candidate.id),
    diameter: computeChapter6ClusterDiameter(cluster, purpose),
  }));
}

export function computeChapter6Entropy(probabilities: number[]): number {
  const total = probabilities.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return 0;

  return round(
    probabilities
      .map(value => value / total)
      .filter(value => value > 0)
      .reduce((entropy, value) => entropy - value * Math.log(value), 0),
  );
}

export function computeChapter6QuotientEntropy(
  clusters: Chapter6Cluster[],
  probabilityByCandidateId: Record<string, number>,
): number {
  const clusterMasses = clusters.map(cluster =>
    cluster.memberIds.reduce((sum, memberId) => sum + (probabilityByCandidateId[memberId] ?? 0), 0),
  );
  return computeChapter6Entropy(clusterMasses);
}

export function buildChapter6StructuralEquivalenceReport() {
  return {
    version: ADDRESS_MORPHISM_V2_CHAPTER6_STRUCTURAL_EQUIVALENCE_VERSION,
    purposeCount: Object.keys(CHAPTER6_PURPOSE_WEIGHTS).length,
    featureKeys: Object.keys(CHAPTER6_PURPOSE_WEIGHTS.delivery),
    executableModelKinds: [
      'purpose-relative structural distance',
      'safe equivalence decision',
      'bounded-diameter clusters',
      'transitive-near counterexample',
      'quotient entropy',
    ],
    safetyRule:
      'Structural distance can decide equivalence only when candidate sufficiency, evidence, and comparability gates pass.',
  };
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
