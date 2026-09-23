export const ADDRESS_MORPHISM_V2_CHAPTER3_MODEL_VERSION = 'address-morphism-v2-chapter3-model-v0.1';

export type BooleanTruth = true | false;

export type FormalDefinition = {
  id: string;
  name: string;
  symbol: string;
  formula: string;
  role: string;
};

export type FormalCounterexample = {
  id: string;
  title: string;
  refutedUniversalClaim: string;
  antecedent: {
    formula: string;
    value: true;
  };
  consequent: {
    formula: string;
    value: false;
  };
  witness: Record<string, string>;
  safetyLesson: string;
  preservedSourceChapters: number[];
};

export type FormalProposition = {
  id: string;
  title: string;
  formula: string;
  proofMode: 'counterexample' | 'definition' | 'construction';
  support: string[];
};

export type FormalNonClaim = {
  id: string;
  forbiddenUniversalClaim: string;
  blockedBy: string[];
};

export const CHAPTER3_FORMAL_DEFINITIONS: FormalDefinition[] = [
  {
    id: 'def-referent-set',
    name: 'Referent set',
    symbol: 'R_t',
    formula: 'R_t = { r | r can be referred to at time t by expressions, evidence, geometry, history, or reachability }',
    role: 'Separates the object being referred to from the text used to refer to it.',
  },
  {
    id: 'def-registrable-entity',
    name: 'Registrable entity',
    symbol: 'E_t(p)',
    formula: 'E_t(p) = { r in R_t | Reg_t(r, p) = 1 }',
    role: 'Makes registrability purpose-relative rather than absolute.',
  },
  {
    id: 'def-surface-expression',
    name: 'Surface address expression',
    symbol: 'S_t',
    formula: 'S_t = { s | s is an address-like expression produced by a human or system at time t }',
    role: 'Treats text, names, aliases, local descriptions, and coordinates as observations rather than identity.',
  },
  {
    id: 'def-observation-map',
    name: 'Observation map',
    symbol: 'O_t',
    formula: 'O_t: S_t -> Omega_t',
    role: 'Maps an expression into language, syntax, source, time, confidence, and geographic cues.',
  },
  {
    id: 'def-candidate-generator',
    name: 'Referent candidate generator',
    symbol: 'Gamma_t',
    formula: 'Gamma_t: S_t x P -> 2^(R_t)',
    role: 'Generates referent candidates rather than string variants.',
  },
  {
    id: 'def-referent-graph',
    name: 'Referent graph',
    symbol: 'G_t',
    formula: 'G_t = (R_t, L_t)',
    role: 'Models containment, adjacency, reachability, alias, history, postal, administrative, and cultural links.',
  },
  {
    id: 'def-public-projection',
    name: 'Public projection',
    symbol: 'pi_pub',
    formula: 'pi_pub: R_t -> R_t^pub',
    role: 'Drops private attributes before public identifiers, logs, or proof public signals are emitted.',
  },
  {
    id: 'def-reachability',
    name: 'Purpose-relative reachability',
    symbol: 'Reach_t',
    formula: 'Reach_t(r, actor, p) in {0, 1, bottom}',
    role: 'Separates existence from delivery, verification, legal notice, or emergency access.',
  },
];

export const CHAPTER3_FORMAL_COUNTEREXAMPLES: FormalCounterexample[] = [
  {
    id: 'same-string-different-referents',
    title: 'Same surface string can denote different referents',
    refutedUniversalClaim: 'forall s1,s2 in S_t: s1 = s2 => rho_t(s1) = rho_t(s2)',
    antecedent: {
      formula: 's1 = s2',
      value: true,
    },
    consequent: {
      formula: 'rho_t(s1) = rho_t(s2)',
      value: false,
    },
    witness: {
      s1: 'Central Station',
      s2: 'Central Station',
      'rho_t(s1)': 'central-station-city-a',
      'rho_t(s2)': 'central-station-city-b',
    },
    safetyLesson: 'String equality is not a safe identity rule; source, hierarchy, and context are required.',
    preservedSourceChapters: [3, 4],
  },
  {
    id: 'same-coordinate-different-referents',
    title: 'Same coordinate can denote different delivery referents',
    refutedUniversalClaim: 'forall r1,r2 in R_t: coord_t(r1) = coord_t(r2) => r1 = r2',
    antecedent: {
      formula: 'coord_t(r1) = coord_t(r2)',
      value: true,
    },
    consequent: {
      formula: 'r1 = r2',
      value: false,
    },
    witness: {
      r1: 'building-main-entrance',
      r2: 'building-loading-dock',
      'coord_t(r1)': '35.000000,139.000000',
      'coord_t(r2)': '35.000000,139.000000',
    },
    safetyLesson: 'Geometry is evidence, not complete referent identity, especially for vertical and functional targets.',
    preservedSourceChapters: [3, 16],
  },
  {
    id: 'no-official-address-still-reachable',
    title: 'Lack of official address does not imply unreachable',
    refutedUniversalClaim: 'forall r in R_t: OfficialAddress_t(r) = 0 => Reach_t(r, carrier, delivery) = 0',
    antecedent: {
      formula: 'OfficialAddress_t(r) = 0',
      value: true,
    },
    consequent: {
      formula: 'Reach_t(r, carrier, delivery) = 0',
      value: false,
    },
    witness: {
      r: 'island-clinic-with-pier',
      'OfficialAddress_t(r)': '0',
      'Reach_t(r, carrier, delivery)': '1 via pier + local route + AGID cell',
    },
    safetyLesson: 'Weak postal systems need fallback referents, POI graphs, route evidence, and cells rather than rejection by default.',
    preservedSourceChapters: [3, 16],
  },
  {
    id: 'official-address-not-reachable',
    title: 'Official address does not imply delivery reachability',
    refutedUniversalClaim: 'forall r in R_t: OfficialAddress_t(r) = 1 => Reach_t(r, carrier, delivery) = 1',
    antecedent: {
      formula: 'OfficialAddress_t(r) = 1',
      value: true,
    },
    consequent: {
      formula: 'Reach_t(r, carrier, delivery) = 1',
      value: false,
    },
    witness: {
      r: 'restricted-facility-mail-address',
      'OfficialAddress_t(r)': '1',
      'Reach_t(r, carrier, delivery)': '0 due to restricted access',
    },
    safetyLesson: 'Existence and officialness must be separated from purpose-specific reachability.',
    preservedSourceChapters: [3, 16],
  },
  {
    id: 'registrable-not-public',
    title: 'Registrability does not imply publicability',
    refutedUniversalClaim: 'forall r in R_t,p in P: Reg_t(r,p) = 1 => Pub_t(r, private_attribute, p) = 1',
    antecedent: {
      formula: 'Reg_t(r, delivery) = 1',
      value: true,
    },
    consequent: {
      formula: 'Pub_t(r, private_attribute, delivery) = 1',
      value: false,
    },
    witness: {
      r: 'hotel-room-temporary-delivery-target',
      private_attribute: 'room-number',
      'Reg_t(r, delivery)': '1',
      'Pub_t(r, room-number, delivery)': '0',
    },
    safetyLesson: 'Internal registration must be separated from public identifiers, logs, and public proof signals.',
    preservedSourceChapters: [3, 16],
  },
  {
    id: 'public-projection-not-invertible',
    title: 'Equal public projections need not reveal equal private referents',
    refutedUniversalClaim: 'forall r1,r2 in R_t: pi_pub(r1) = pi_pub(r2) => r1 = r2',
    antecedent: {
      formula: 'pi_pub(r1) = pi_pub(r2)',
      value: true,
    },
    consequent: {
      formula: 'r1 = r2',
      value: false,
    },
    witness: {
      r1: 'apartment-building-unit-301',
      r2: 'apartment-building-unit-802',
      'pi_pub(r1)': 'apartment-building',
      'pi_pub(r2)': 'apartment-building',
    },
    safetyLesson: 'Public projection must be intentionally many-to-one when private vertical attributes are withheld.',
    preservedSourceChapters: [3, 4, 16],
  },
];

export const CHAPTER3_FORMAL_PROPOSITIONS: FormalProposition[] = [
  {
    id: 'prop-surface-expression-non-identity',
    title: 'Surface expression equality is not referent equality',
    formula: 'not (forall s1,s2 in S_t: s1 = s2 => rho_t(s1) = rho_t(s2))',
    proofMode: 'counterexample',
    support: ['same-string-different-referents'],
  },
  {
    id: 'prop-coordinate-non-identity',
    title: 'Coordinate equality is not referent equality',
    formula: 'not (forall r1,r2 in R_t: coord_t(r1) = coord_t(r2) => r1 = r2)',
    proofMode: 'counterexample',
    support: ['same-coordinate-different-referents'],
  },
  {
    id: 'prop-registrability-purpose-relative',
    title: 'Registrability is purpose-relative',
    formula: 'exists r,p1,p2: Reg_t(r,p1) = 1 and Reg_t(r,p2) != 1',
    proofMode: 'construction',
    support: ['no-official-address-still-reachable', 'official-address-not-reachable'],
  },
  {
    id: 'prop-registrability-not-publicability',
    title: 'Registrability does not imply publicability',
    formula: 'not (forall r,p,x: Reg_t(r,p) = 1 => Pub_t(r,x,p) = 1)',
    proofMode: 'counterexample',
    support: ['registrable-not-public'],
  },
  {
    id: 'prop-public-projection-many-to-one',
    title: 'Public projection may be intentionally many-to-one',
    formula: 'exists r1,r2: r1 != r2 and pi_pub(r1) = pi_pub(r2)',
    proofMode: 'counterexample',
    support: ['public-projection-not-invertible'],
  },
];

export const CHAPTER3_FORMAL_NON_CLAIMS: FormalNonClaim[] = [
  {
    id: 'nonclaim-global-natural-cultural-completeness',
    forbiddenUniversalClaim: 'forall named natural/cultural places x: x in R_t and verified_t(x) = 1',
    blockedBy: ['def-referent-set', 'def-observation-map'],
  },
  {
    id: 'nonclaim-perfect-candidate-generation',
    forbiddenUniversalClaim: 'forall s in S_t: true_referent_t(s) in Gamma_t(s,p)',
    blockedBy: ['def-candidate-generator'],
  },
  {
    id: 'nonclaim-ordinary-address-precision-for-all-geography',
    forbiddenUniversalClaim: 'forall r in R_t^nat union R_t^cul: precision_t(r) = ordinary_street_address_precision',
    blockedBy: ['no-official-address-still-reachable'],
  },
  {
    id: 'nonclaim-public-vertical-attributes',
    forbiddenUniversalClaim: 'forall r in R_t^vert: private_vertical_attributes(r) subset public_identifier(r)',
    blockedBy: ['registrable-not-public', 'public-projection-not-invertible'],
  },
  {
    id: 'nonclaim-social-name-always-overrides-official',
    forbiddenUniversalClaim: 'forall r: social_name_score(r) > official_source_score(r)',
    blockedBy: ['def-referent-graph'],
  },
  {
    id: 'nonclaim-coordinates-postcodes-poi-unnecessary',
    forbiddenUniversalClaim: 'forall evidence e: e in {coordinates, postcodes, administrative codes, poi ids} => e is unnecessary',
    blockedBy: ['def-observation-map', 'def-referent-graph'],
  },
];

export function validateFormalCounterexample(counterexample: FormalCounterexample): string[] {
  const errors: string[] = [];
  if (counterexample.antecedent.value !== true) {
    errors.push(`${counterexample.id}: antecedent must hold`);
  }
  if (counterexample.consequent.value !== false) {
    errors.push(`${counterexample.id}: consequent must fail`);
  }
  if (Object.keys(counterexample.witness).length < 3) {
    errors.push(`${counterexample.id}: witness is too thin`);
  }
  if (counterexample.preservedSourceChapters.length === 0) {
    errors.push(`${counterexample.id}: source chapter link is required`);
  }
  return errors;
}

export function buildChapter3FormalModelReport() {
  const counterexampleIds = new Set(CHAPTER3_FORMAL_COUNTEREXAMPLES.map(counterexample => counterexample.id));
  const definitionIds = new Set(CHAPTER3_FORMAL_DEFINITIONS.map(definition => definition.id));

  return {
    version: ADDRESS_MORPHISM_V2_CHAPTER3_MODEL_VERSION,
    definitionCount: CHAPTER3_FORMAL_DEFINITIONS.length,
    counterexampleCount: CHAPTER3_FORMAL_COUNTEREXAMPLES.length,
    propositionCount: CHAPTER3_FORMAL_PROPOSITIONS.length,
    nonClaimCount: CHAPTER3_FORMAL_NON_CLAIMS.length,
    invalidCounterexamples: CHAPTER3_FORMAL_COUNTEREXAMPLES.flatMap(validateFormalCounterexample),
    unsupportedPropositions: CHAPTER3_FORMAL_PROPOSITIONS.filter(proposition =>
      proposition.support.some(id => !counterexampleIds.has(id) && !definitionIds.has(id)),
    ).map(proposition => proposition.id),
    unsupportedNonClaims: CHAPTER3_FORMAL_NON_CLAIMS.filter(nonClaim =>
      nonClaim.blockedBy.some(id => !counterexampleIds.has(id) && !definitionIds.has(id)),
    ).map(nonClaim => nonClaim.id),
  };
}
