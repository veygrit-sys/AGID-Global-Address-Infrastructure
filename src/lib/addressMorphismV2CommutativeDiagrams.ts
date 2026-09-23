export const ADDRESS_MORPHISM_V2_COMMUTATIVE_DIAGRAMS_VERSION =
  'address-morphism-v2-commutative-diagrams-v0.1';

export type CommutativityKind = 'strict' | 'weak' | 'conditional' | 'intentionally-non-commutative';

export type DiagramEqualizer =
  | 'same-normal-form'
  | 'same-candidate-superset'
  | 'same-referent-class'
  | 'same-resolution-state'
  | 'same-public-signal'
  | 'same-safety-decision'
  | 'must-not-invert';

export type AddressMorphismV2CommutativeDiagram = {
  id: string;
  title: string;
  chapters: number[];
  kind: CommutativityKind;
  statement: string;
  upperPath: string[];
  lowerPath: string[];
  equalizer: DiagramEqualizer;
  conditions: string[];
  nonClaims: string[];
  mermaid: string;
};

const diagram = (
  value: Omit<AddressMorphismV2CommutativeDiagram, 'mermaid'> & { mermaid?: string },
): AddressMorphismV2CommutativeDiagram => ({
  ...value,
  mermaid:
    value.mermaid ??
    `flowchart LR\n  A["${value.upperPath[0]}"] --> B["${value.upperPath.at(-1)}"]\n  A --> C["${value.lowerPath.at(
      -1,
    )}"]\n  C --> B`,
});

export const AMT_V2_COMMUTATIVE_DIAGRAMS: AddressMorphismV2CommutativeDiagram[] = [
  diagram({
    id: 'core-morphism-chain',
    title: 'Core AMT morphism chain',
    chapters: [1, 3, 4, 5, 6, 7, 12],
    kind: 'conditional',
    statement:
      'Surface expression, normalization, candidate generation, quotienting, and safe resolution commute only when axiom gates and source gates pass.',
    upperPath: ['surface expression', 'normalization', 'candidate generation', 'quotient', 'safe resolution'],
    lowerPath: ['surface expression', 'AMT axiom gates', 'resolution state'],
    equalizer: 'same-resolution-state',
    conditions: ['candidate sufficiency', 'evidence admissibility', 'finite candidate set', 'ordering decidability'],
    nonClaims: ['The chain is not a total resolver and may end in manual review or unresolved.'],
    mermaid: `flowchart LR
  S["surface expression"] --> N["normalized observation"]
  N --> C["candidate set"]
  C --> Q["quotient by structural equivalence"]
  Q --> R["safe resolution state"]
  S --> A["AMT axiom gates"]
  A --> R`,
  }),
  diagram({
    id: 'parse-normalize-square',
    title: 'Parsing and normalization square',
    chapters: [2, 4, 5],
    kind: 'strict',
    statement:
      'Direct normalization and parse-then-normalize should produce the same normal form under the same country schema version.',
    upperPath: ['surface expression', 'normalization'],
    lowerPath: ['surface expression', 'parser', 'token normalization'],
    equalizer: 'same-normal-form',
    conditions: ['same schema version', 'same token grammar', 'deterministic canonicalization'],
    nonClaims: ['The normal form is not by itself referent identity.'],
  }),
  diagram({
    id: 'multilingual-referent-square',
    title: 'Multilingual referent square',
    chapters: [2, 5, 6, 12],
    kind: 'weak',
    statement:
      'Native-language and international-language paths need not yield the same string, but should land in the same referent class when evidence supports the alias relation.',
    upperPath: ['native expression', 'native normalization', 'candidate set'],
    lowerPath: ['native expression', 'translation or romanization', 'international normalization', 'candidate set'],
    equalizer: 'same-referent-class',
    conditions: ['alias evidence', 'language tag preserved', 'source coverage for both scripts'],
    nonClaims: ['Translation increases recall; it does not prove identity by itself.'],
    mermaid: `flowchart LR
  JP["native expression"] --> JN["native normalization"]
  JN --> JC["candidate class"]
  JP --> TR["translation or romanization"]
  TR --> EN["international normalization"]
  EN --> EC["candidate class"]
  JC -. "same referent class, not same string" .- EC`,
  }),
  diagram({
    id: 'postal-agid-region-square',
    title: 'Postal-equivalent and AGID region square',
    chapters: [5, 7, 9, 12],
    kind: 'conditional',
    statement:
      'Postal zones and AGID cells commute only as region evidence when both boundaries are current, licensed, and purpose-compatible.',
    upperPath: ['address expression', 'postal zone', 'AGID region'],
    lowerPath: ['address expression', 'AGID cell set', 'postal-equivalent region'],
    equalizer: 'same-safety-decision',
    conditions: ['boundary freshness', 'license admissibility', 'region containment test', 'purpose-specific tolerance'],
    nonClaims: ['Postal codes are not universal address identifiers.'],
  }),
  diagram({
    id: 'candidate-expansion-inclusion',
    title: 'Candidate expansion inclusion diagram',
    chapters: [5, 12],
    kind: 'weak',
    statement:
      'Adding aliases, old names, and multilingual recall should produce an expanded candidate set that contains the base candidate set.',
    upperPath: ['input expression', 'base candidate generation'],
    lowerPath: ['input expression', 'alias expansion', 'expanded candidate generation'],
    equalizer: 'same-candidate-superset',
    conditions: ['expansion sources are admissible', 'deduplication is stable'],
    nonClaims: ['A larger candidate set is not a better identity decision unless later gates reduce ambiguity.'],
  }),
  diagram({
    id: 'source-aggregation-square',
    title: 'Source aggregation square',
    chapters: [5, 9, 12],
    kind: 'conditional',
    statement:
      'Merging sources before scoring and scoring before aggregation should produce the same safety decision when source weights and conflicts are fixed.',
    upperPath: ['source bundle', 'evidence merge', 'quality score', 'decision'],
    lowerPath: ['source bundle', 'per-source scoring', 'score aggregation', 'decision'],
    equalizer: 'same-safety-decision',
    conditions: ['fixed source weights', 'conflict policy', 'freshness window', 'license gate'],
    nonClaims: ['This does not assert that all sources are equally trustworthy.'],
  }),
  diagram({
    id: 'equivalence-cluster-square',
    title: 'Structural distance and graph-cluster square',
    chapters: [6, 9],
    kind: 'weak',
    statement:
      'Distance-threshold clusters and address-graph connected components should agree only after bounded-diameter and comparability gates.',
    upperPath: ['candidate pair', 'structural distance', 'delta cluster'],
    lowerPath: ['candidate pair', 'address graph edges', 'bounded connected component'],
    equalizer: 'same-referent-class',
    conditions: ['comparability gate', 'bounded diameter', 'evidence gate'],
    nonClaims: ['Near-neighbor chains are not transitive identity by default.'],
  }),
  diagram({
    id: 'history-successor-square',
    title: 'History successor and PID conservation square',
    chapters: [8, 12],
    kind: 'conditional',
    statement:
      'Address history transitions and successor PID links commute when split, merge, relocation, and deprecation events are explicitly recorded.',
    upperPath: ['old referent', 'history graph transition', 'new referent'],
    lowerPath: ['old PID', 'successor relation', 'new PID'],
    equalizer: 'same-safety-decision',
    conditions: ['typed transition event', 'lineage root update', 'no silent split or merge'],
    nonClaims: ['PID conservation does not mean the same delivery endpoint is preserved.'],
    mermaid: `flowchart LR
  OR["old referent"] --> HG["history graph transition"]
  HG --> NR["new referent"]
  OP["old PID"] --> SU["successor relation"]
  SU --> NP["new PID"]
  HG -. "lineage root" .- SU`,
  }),
  diagram({
    id: 'administrative-change-square',
    title: 'Administrative-change projection square',
    chapters: [5, 8, 12],
    kind: 'conditional',
    statement:
      'Old administrative expressions and new administrative expressions commute through the same referent only when temporal validity is explicit.',
    upperPath: ['old administrative expression', 'new administrative expression', 'referent'],
    lowerPath: ['old administrative expression', 'time-aware referent', 'new surface expression'],
    equalizer: 'same-referent-class',
    conditions: ['valid time interval', 'source version', 'history transition'],
    nonClaims: ['A renamed area is not automatically the same delivery route.'],
  }),
  diagram({
    id: 'disaster-temporary-reference-square',
    title: 'Disaster and temporary reference square',
    chapters: [1, 8, 10, 11],
    kind: 'conditional',
    statement:
      'Emergency projections and temporary references commute for reachability only, not for permanent identity.',
    upperPath: ['ordinary referent', 'emergency projection', 'temporary PID'],
    lowerPath: ['ordinary referent', 'shelter or field handoff reference', 'temporary PID'],
    equalizer: 'same-safety-decision',
    conditions: ['expiry', 'emergency purpose', 'audit boundary', 'successor or deprecation policy'],
    nonClaims: ['Temporary PIDs must not become permanent surveillance identifiers.'],
  }),
  diagram({
    id: 'natural-geography-boundary-square',
    title: 'Natural geography boundary square',
    chapters: [3, 10, 12],
    kind: 'conditional',
    statement:
      'A natural place name and a boundary/coordinate source commute only to a usable region when evidence is sufficient and boundary ambiguity is declared.',
    upperPath: ['natural place name', 'feature candidate', 'AGID region'],
    lowerPath: ['natural place name', 'boundary evidence', 'AGID region'],
    equalizer: 'same-safety-decision',
    conditions: ['feature type known', 'boundary confidence', 'source license', 'ambiguity note'],
    nonClaims: ['AMT does not claim every named natural feature has a verified global boundary.'],
  }),
  diagram({
    id: 'vertical-privacy-noncommutative',
    title: 'Vertical privacy non-commutative diagram',
    chapters: [3, 10, 11],
    kind: 'intentionally-non-commutative',
    statement:
      'Building, floor, unit, and private vertical references must not commute back from public PID to private unit attributes.',
    upperPath: ['building reference', 'private vertical reference', 'private delivery capability'],
    lowerPath: ['building reference', 'public PID', 'public projection'],
    equalizer: 'must-not-invert',
    conditions: ['non-invertible public projection', 'purpose-scoped disclosure', 'private attribute redaction'],
    nonClaims: ['Public identifiers must not reveal room, unit, household, recipient, or private vertical attributes.'],
    mermaid: `flowchart LR
  B["building reference"] --> V["private vertical reference"]
  V --> D["private delivery capability"]
  B --> P["public PID"]
  P --> PUB["public projection"]
  PUB -. "must not invert" .- V`,
  }),
  diagram({
    id: 'pid-issuance-boundary-square',
    title: 'PID issuance boundary square',
    chapters: [7, 8, 11],
    kind: 'conditional',
    statement:
      'Automatic safe resolution and manual review may issue the same PID only when the same evidence, projection, and governance gates pass.',
    upperPath: ['candidate class', 'safe resolver', 'PID'],
    lowerPath: ['candidate class', 'manual review', 'PID'],
    equalizer: 'same-safety-decision',
    conditions: ['evidence parity', 'public projection safety', 'governance approval', 'audit record'],
    nonClaims: ['A resolution certificate is not a PID by itself.'],
  }),
  diagram({
    id: 'zk-boundary-noncommutative',
    title: 'ZK proof boundary non-commutative diagram',
    chapters: [11, 12],
    kind: 'intentionally-non-commutative',
    statement:
      'AMT envelopes may commute to proof verification on public signals, but proof artifacts must not commute back to raw address or witness material.',
    upperPath: ['AMT envelope', 'commitment', 'proof statement', 'public signal'],
    lowerPath: ['AMT envelope', 'verifier policy', 'proof verification', 'public signal'],
    equalizer: 'same-public-signal',
    conditions: ['domain-separated nullifier', 'revocation root', 'freshness root', 'policy allowlist'],
    nonClaims: ['A valid ZK proof does not repair bad address resolution and must not reveal witness material.'],
    mermaid: `flowchart LR
  E["AMT envelope"] --> C["commitment"]
  C --> PS["proof statement"]
  PS --> PUB["public signal"]
  E --> VP["verifier policy"]
  VP --> VF["proof verification"]
  VF --> PUB
  PUB -. "must not invert to witness or address" .- C`,
  }),
  diagram({
    id: 'deliverability-square',
    title: 'Deliverability square',
    chapters: [7, 9, 10, 11],
    kind: 'conditional',
    statement:
      'AGID-region reachability and carrier-rule evaluation commute only for a declared carrier, time, purpose, and service level.',
    upperPath: ['referent', 'AGID region', 'delivery zone', 'deliverability decision'],
    lowerPath: ['referent', 'carrier rules', 'service-level decision'],
    equalizer: 'same-safety-decision',
    conditions: ['carrier policy version', 'time window', 'service level', 'route restrictions'],
    nonClaims: ['Deliverable is not the same as legally verified residence.'],
  }),
  diagram({
    id: 'address-login-schema-square',
    title: 'Address Login schema square',
    chapters: [1, 2, 5, 12],
    kind: 'conditional',
    statement:
      'Country-specific forms and universal schema projection commute when the country schema is versioned and field loss is declared.',
    upperPath: ['user input', 'country schema', 'normalized country address'],
    lowerPath: ['user input', 'universal schema', 'country projection'],
    equalizer: 'same-safety-decision',
    conditions: ['schema version', 'field-loss report', 'language tag', 'validation fixture'],
    nonClaims: ['A universal form does not eliminate country-specific address rules.'],
  }),
  diagram({
    id: 'anonymous-delivery-noncommutative',
    title: 'Anonymous delivery disclosure non-commutative diagram',
    chapters: [10, 11],
    kind: 'intentionally-non-commutative',
    statement:
      'Merchant approval and carrier delivery can commute on delivery eligibility while intentionally not commuting on address disclosure.',
    upperPath: ['referent', 'carrier-decryptable token', 'delivery execution'],
    lowerPath: ['referent', 'proof-only merchant token', 'merchant approval'],
    equalizer: 'same-safety-decision',
    conditions: ['carrier-only decryption', 'consent scope', 'audit log', 'expiry'],
    nonClaims: ['Merchant approval must not imply merchant access to the full delivery address.'],
  }),
  diagram({
    id: 'quality-decision-square',
    title: 'Quality and decision square',
    chapters: [5, 7, 9, 12],
    kind: 'conditional',
    statement:
      'Quality scoring and evidence gate evaluation should agree on resolved, manual-review, or unresolved states under the same policy.',
    upperPath: ['candidate class', 'quality score', 'decision'],
    lowerPath: ['candidate class', 'evidence gates', 'decision'],
    equalizer: 'same-safety-decision',
    conditions: ['same thresholds', 'same freshness policy', 'same conflict penalty', 'same purpose'],
    nonClaims: ['A high score is not enough when a hard safety gate fails.'],
  }),
  diagram({
    id: 'benchmark-oracle-square',
    title: 'Benchmark oracle square',
    chapters: [12],
    kind: 'strict',
    statement:
      'A synthetic fixture run through the implementation should match the formal oracle for the same declared claim and failure taxonomy.',
    upperPath: ['fixture', 'implementation', 'result'],
    lowerPath: ['fixture', 'formal oracle', 'expected result'],
    equalizer: 'same-safety-decision',
    conditions: ['same fixture version', 'same purpose', 'same failure taxonomy'],
    nonClaims: ['A benchmark pass is not a universal victory declaration.'],
  }),
  diagram({
    id: 'country-pack-index-square',
    title: 'Country pack and index square',
    chapters: [5, 10, 12],
    kind: 'conditional',
    statement:
      'A country pack imported through a local schema and through the AGID country index should expose the same public hierarchy when source policy gates pass.',
    upperPath: ['country pack', 'local address hierarchy', 'AMT common model'],
    lowerPath: ['country pack', 'AGID country index', 'AMT common model'],
    equalizer: 'same-safety-decision',
    conditions: ['source catalog entry', 'license policy', 'schema compatibility matrix', 'no raw private fixture'],
    nonClaims: ['Country pack presence does not mean the country is fully covered.'],
  }),
  diagram({
    id: 'ocean-hierarchy-square',
    title: 'Ocean and maritime hierarchy square',
    chapters: [3, 10, 12],
    kind: 'conditional',
    statement:
      'Port, sea, ocean, and AGID-cell paths commute only for public maritime hierarchy, not for private vessel or cargo identity.',
    upperPath: ['port reference', 'named sea', 'ocean hierarchy'],
    lowerPath: ['port reference', 'AGID cell adjacency', 'ocean hierarchy'],
    equalizer: 'same-safety-decision',
    conditions: ['maritime source boundary', 'adjacency policy', 'public feature type'],
    nonClaims: ['Maritime hierarchy does not expose private vessel, shipment, or recipient data.'],
  }),
  diagram({
    id: 'audit-projection-noncommutative',
    title: 'Audit projection non-commutative diagram',
    chapters: [8, 11, 12],
    kind: 'intentionally-non-commutative',
    statement:
      'Audit logs may preserve accountable operations while intentionally not commuting back to private address, witness, key, or recipient material.',
    upperPath: ['operation event', 'audit projection', 'accountability record'],
    lowerPath: ['operation event', 'private material', 'private reconstruction'],
    equalizer: 'must-not-invert',
    conditions: ['redaction', 'purpose-scoped actor ID', 'retention policy', 'no private material in public logs'],
    nonClaims: ['Auditability must not become public reconstruction of private address data.'],
  }),
];

export function getAddressMorphismV2CommutativeDiagrams(): AddressMorphismV2CommutativeDiagram[] {
  return AMT_V2_COMMUTATIVE_DIAGRAMS.map(item => ({ ...item }));
}

export function groupCommutativeDiagramsByKind(): Record<CommutativityKind, AddressMorphismV2CommutativeDiagram[]> {
  return AMT_V2_COMMUTATIVE_DIAGRAMS.reduce(
    (groups, item) => {
      groups[item.kind].push(item);
      return groups;
    },
    {
      strict: [],
      weak: [],
      conditional: [],
      'intentionally-non-commutative': [],
    } as Record<CommutativityKind, AddressMorphismV2CommutativeDiagram[]>,
  );
}

export function validateAddressMorphismV2CommutativeDiagrams(
  diagrams = AMT_V2_COMMUTATIVE_DIAGRAMS,
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const chapterCoverage = new Set<number>();
  const kinds = new Set<CommutativityKind>();

  for (const item of diagrams) {
    if (ids.has(item.id)) {
      errors.push(`duplicate diagram id: ${item.id}`);
    }
    ids.add(item.id);
    kinds.add(item.kind);
    item.chapters.forEach(chapter => chapterCoverage.add(chapter));

    if (!/^[a-z0-9-]+$/.test(item.id)) {
      errors.push(`${item.id}: id must be slug-like`);
    }
    if (item.chapters.length === 0 || item.chapters.some(chapter => chapter < 1 || chapter > 12)) {
      errors.push(`${item.id}: chapters must reference AMT v2 chapters 1-12`);
    }
    if (item.upperPath.length < 2 || item.lowerPath.length < 2) {
      errors.push(`${item.id}: both paths must have at least two nodes`);
    }
    if (!item.mermaid.startsWith('flowchart')) {
      errors.push(`${item.id}: mermaid must start with flowchart`);
    }
    if (item.conditions.length === 0) {
      errors.push(`${item.id}: conditions must be explicit`);
    }
    if (item.nonClaims.length === 0) {
      errors.push(`${item.id}: nonClaims must be explicit`);
    }
    if (item.kind === 'intentionally-non-commutative') {
      const boundaryText = item.nonClaims.join(' ').toLowerCase();
      if (item.equalizer !== 'must-not-invert' && !boundaryText.includes('must not')) {
        errors.push(`${item.id}: non-commutative diagrams need a must-not-invert boundary`);
      }
    }
  }

  for (let chapter = 1; chapter <= 12; chapter += 1) {
    if (!chapterCoverage.has(chapter)) {
      errors.push(`missing diagram coverage for AMT v2 chapter ${chapter}`);
    }
  }

  for (const kind of ['strict', 'weak', 'conditional', 'intentionally-non-commutative'] as const) {
    if (!kinds.has(kind)) {
      errors.push(`missing commutativity kind: ${kind}`);
    }
  }

  if (diagrams.length < 20) {
    errors.push('AMT v2 should keep at least 20 diagram candidates');
  }

  return errors;
}

