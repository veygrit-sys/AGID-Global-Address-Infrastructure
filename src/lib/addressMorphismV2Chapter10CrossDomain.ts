export const ADDRESS_MORPHISM_V2_CHAPTER10_CROSS_DOMAIN_VERSION =
  'address-morphism-v2-chapter10-cross-domain-v0.1';

export type Chapter10Domain =
  | 'admin'
  | 'natural'
  | 'cultural'
  | 'vertical'
  | 'logistics'
  | 'emergency'
  | 'digital'
  | 'hybrid';

export type Chapter10BoundaryKind =
  | 'point'
  | 'polygon'
  | 'multipolygon'
  | 'polyline'
  | 'fuzzyRegion'
  | 'networkNode'
  | 'cellSet'
  | 'temporalZone'
  | 'unknown';

export type Chapter10VerticalKind = 'none' | 'floor' | 'unit' | 'entrance' | 'internalRoute' | 'restricted';

export type Chapter10TemporalKind = 'stable' | 'seasonal' | 'session' | 'emergencyWindow' | 'versioned';

export type Chapter10ReachabilityKind = 'adminAddress' | 'road' | 'maritime' | 'air' | 'pedestrian' | 'carrier' | 'digital';

export type Chapter10PrivacyKind = 'public' | 'partial' | 'restricted' | 'private' | 'proofOnly';

export type Chapter10DigitalRelation = 'equivalent' | 'linked' | 'representation' | 'simulation' | 'none';

export type Chapter10Referent = {
  id: string;
  domain: Chapter10Domain;
  boundaryKind: Chapter10BoundaryKind;
  verticalKind: Chapter10VerticalKind;
  temporalKind: Chapter10TemporalKind;
  reachabilityKind: Chapter10ReachabilityKind;
  privacyKind: Chapter10PrivacyKind;
  hasCoordinateEvidence: boolean;
  hasNameEvidence: boolean;
  hasRouteEvidence: boolean;
  hasTemporalEvidence: boolean;
};

export type Chapter10ResolvePurpose =
  | 'identity'
  | 'delivery'
  | 'public_pid'
  | 'emergency'
  | 'zk_predicate'
  | 'digital_twin';

export type Chapter10CrossDomainDecision = {
  state: 'usable' | 'limited' | 'manual_review' | 'unresolved' | 'blocked';
  referentId: string;
  reasons: string[];
  publicProjectionSafe: boolean;
  nonClaims: string[];
};

export type Chapter10DistanceWeights = {
  admin: number;
  geo: number;
  network: number;
  vertical: number;
  temporal: number;
  semantic: number;
  access: number;
};

export const CHAPTER10_DEFAULT_DISTANCE_WEIGHTS: Chapter10DistanceWeights = {
  admin: 0.1,
  geo: 0.2,
  network: 0.2,
  vertical: 0.15,
  temporal: 0.1,
  semantic: 0.15,
  access: 0.1,
};

export function buildChapter10CrossDomainReport() {
  return {
    version: ADDRESS_MORPHISM_V2_CHAPTER10_CROSS_DOMAIN_VERSION,
    executableModelKinds: [
      'cross-domain referent schema',
      'domain classifier',
      'boundary kind matrix',
      'vertical privacy gate',
      'reachability equivalence',
      'cross-domain structural distance',
      'digital twin correspondence boundary',
      'coordinate non-identity counterexample',
      'public projection safety for non-standard references',
    ],
    safetyRule:
      'Natural, cultural, vertical, logistics, emergency, and digital references are handled as purpose-scoped referents, not forced into ordinary address strings.',
  };
}

export function classifyChapter10Domain(input: string): Chapter10Domain {
  const normalized = input.toLowerCase();
  if (/(sea|ocean|bay|strait|island|mountain|desert|river|lake|glacier|cave)/.test(normalized)) {
    return 'natural';
  }
  if (/(heritage|temple|market|district|festival|sacred|cultural)/.test(normalized)) {
    return 'cultural';
  }
  if (/(floor|unit|suite|entrance|elevator|basement|tower)/.test(normalized)) {
    return 'vertical';
  }
  if (/(locker|pudo|port|warehouse|gate|loading|airport|drone)/.test(normalized)) {
    return 'logistics';
  }
  if (/(shelter|evacuation|disaster|temporary clinic|relief)/.test(normalized)) {
    return 'emergency';
  }
  if (/(digital twin|metaverse|xr|virtual)/.test(normalized)) {
    return 'digital';
  }
  return 'admin';
}

export function evaluateChapter10Referent(
  referent: Chapter10Referent,
  purpose: Chapter10ResolvePurpose,
): Chapter10CrossDomainDecision {
  const reasons: string[] = [];
  const publicProjectionSafe = isChapter10PublicProjectionSafe(referent);

  if (!referent.hasNameEvidence && !referent.hasCoordinateEvidence) {
    reasons.push('name-or-coordinate-evidence-required');
  }

  if (referent.boundaryKind === 'unknown' && (purpose === 'identity' || purpose === 'public_pid')) {
    reasons.push('precise-boundary-required-for-purpose');
  }

  if (referent.temporalKind === 'emergencyWindow' && purpose === 'public_pid') {
    reasons.push('emergency-window-not-public-pid');
  }

  if (referent.domain === 'logistics' && purpose === 'identity') {
    reasons.push('logistics-referent-is-not-identity-proof');
  }

  if (referent.domain === 'digital' && purpose !== 'digital_twin') {
    reasons.push('digital-referent-requires-explicit-correspondence');
  }

  if (!publicProjectionSafe && purpose === 'public_pid') {
    return decision('blocked', referent, ['public-projection-unsafe', ...reasons], publicProjectionSafe);
  }

  if (reasons.includes('name-or-coordinate-evidence-required')) {
    return decision('unresolved', referent, reasons, publicProjectionSafe);
  }

  if (reasons.length > 0) {
    return decision('manual_review', referent, reasons, publicProjectionSafe);
  }

  if (referent.boundaryKind === 'unknown' || referent.privacyKind === 'partial') {
    return decision('limited', referent, [], publicProjectionSafe);
  }

  return decision('usable', referent, [], publicProjectionSafe);
}

export function isChapter10PublicProjectionSafe(referent: Chapter10Referent): boolean {
  if (referent.privacyKind === 'private' || referent.privacyKind === 'restricted') return false;
  if (referent.verticalKind === 'unit' || referent.verticalKind === 'restricted') return false;
  if (referent.temporalKind === 'session' && referent.privacyKind !== 'proofOnly') return false;
  return true;
}

export function areChapter10ReachEquivalent(
  left: Chapter10Referent,
  right: Chapter10Referent,
  purpose: Chapter10ResolvePurpose,
): boolean {
  if (purpose === 'identity') return left.id === right.id;
  if (purpose === 'delivery') {
    return (
      left.reachabilityKind === right.reachabilityKind &&
      left.hasRouteEvidence &&
      right.hasRouteEvidence &&
      left.temporalKind !== 'emergencyWindow' &&
      right.temporalKind !== 'emergencyWindow'
    );
  }
  if (purpose === 'emergency') {
    return left.temporalKind === 'emergencyWindow' && right.temporalKind === 'emergencyWindow';
  }
  if (purpose === 'digital_twin') {
    return left.domain === 'digital' || right.domain === 'digital' || left.domain === 'hybrid' || right.domain === 'hybrid';
  }
  return false;
}

export function computeChapter10CrossDomainDistance(
  left: Chapter10Referent,
  right: Chapter10Referent,
  weights: Chapter10DistanceWeights = CHAPTER10_DEFAULT_DISTANCE_WEIGHTS,
): number {
  const components = {
    admin: left.domain === right.domain ? 0 : 1,
    geo: left.boundaryKind === right.boundaryKind ? 0 : 1,
    network: left.reachabilityKind === right.reachabilityKind ? 0 : 1,
    vertical: left.verticalKind === right.verticalKind ? 0 : 1,
    temporal: left.temporalKind === right.temporalKind ? 0 : 1,
    semantic: left.domain === right.domain && left.boundaryKind === right.boundaryKind ? 0 : 0.5,
    access: left.privacyKind === right.privacyKind ? 0 : 1,
  };

  return round(
    components.admin * weights.admin +
      components.geo * weights.geo +
      components.network * weights.network +
      components.vertical * weights.vertical +
      components.temporal * weights.temporal +
      components.semantic * weights.semantic +
      components.access * weights.access,
  );
}

export function evaluateChapter10DigitalRelation(relation: Chapter10DigitalRelation): {
  identityAllowed: boolean;
  nonClaim: string;
} {
  return {
    identityAllowed: relation === 'equivalent',
    nonClaim: 'digital representation is not physical identity unless explicitly equivalent',
  };
}

function decision(
  state: Chapter10CrossDomainDecision['state'],
  referent: Chapter10Referent,
  reasons: string[],
  publicProjectionSafe: boolean,
): Chapter10CrossDomainDecision {
  return {
    state,
    referentId: referent.id,
    reasons,
    publicProjectionSafe,
    nonClaims: [
      'coordinate evidence is not identity proof',
      'delivery reachability is not residence proof',
      'cultural name is not administrative boundary',
      'digital representation is not physical identity by default',
    ],
  };
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
