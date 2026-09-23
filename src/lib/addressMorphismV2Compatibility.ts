export const ADDRESS_MORPHISM_V2_COMPATIBILITY_VERSION = 'address-morphism-v2-compatibility-v0.1';

export type SourceChapter = {
  chapter: number;
  title: string;
};

export type V2ChapterCompatibility = {
  v2Chapter: number;
  title: string;
  sourceChapters: SourceChapter[];
  preservedClaims: string[];
  preservedMathematicalModels: string[];
  requiredArtifacts: string[];
  nonClaims: string[];
};

export const CURRENT_29_CHAPTERS: SourceChapter[] = [
  { chapter: 1, title: 'Introduction: Registration difficulty' },
  { chapter: 2, title: 'Address basics: reference, compression, communication, history' },
  { chapter: 3, title: 'Registrable entities' },
  { chapter: 4, title: 'Surface address expressions' },
  { chapter: 5, title: 'Formal preliminaries' },
  { chapter: 6, title: 'Address unresolvability decision' },
  { chapter: 7, title: 'AMT morphism chain' },
  { chapter: 8, title: 'Candidate generation and source policy' },
  { chapter: 9, title: 'Clusters and address equivalence classes' },
  { chapter: 10, title: 'Unresolved country theory' },
  { chapter: 11, title: 'Safe resolution and PID issuance' },
  { chapter: 12, title: 'History graph and address conservation' },
  { chapter: 13, title: 'Social continuity' },
  { chapter: 14, title: 'Conflict-relative optimality' },
  { chapter: 15, title: 'Address compression and entropy' },
  { chapter: 16, title: 'Natural geography, cultural geography, and vertical reference' },
  { chapter: 17, title: 'Evaluation, quality, and reputation' },
  { chapter: 18, title: 'AMT and cryptographic extension boundary' },
  { chapter: 19, title: 'PID and application identifier boundary' },
  { chapter: 20, title: 'Communication, registration, and audit model' },
  { chapter: 21, title: 'Verification and reproducibility' },
  { chapter: 22, title: 'Security, abuse, and governance' },
  { chapter: 23, title: 'Benchmarks and comparison' },
  { chapter: 24, title: 'Case studies' },
  { chapter: 25, title: 'Limitations' },
  { chapter: 26, title: 'Conclusion' },
  { chapter: 27, title: 'Address payment rails' },
  { chapter: 28, title: 'AMT envelope and ZK predicate boundary' },
  { chapter: 29, title: 'Mathematical model core' },
];

export const V2_COMPATIBILITY_MAP: V2ChapterCompatibility[] = [
  {
    v2Chapter: 1,
    title: 'Why Address Registration Is Hard',
    sourceChapters: pickSources(1, 2, 6, 25),
    preservedClaims: [
      'Repeated address entry is a symptom of missing address reference theory.',
      'Map location, address expression, and persistent identifier are distinct layers.',
      'Safe unresolved output is required when assumptions fail.',
      'AMT is not a universal perfect resolver.',
    ],
    preservedMathematicalModels: [
      'surface expression to candidate set sketch',
      'purpose-relative reference model',
      'abstention bottom state',
    ],
    requiredArtifacts: [
      'problem-scope non-claim checklist',
      'introductory pipeline diagram',
    ],
    nonClaims: [
      'does not claim all addresses are currently resolvable',
      'does not replace official address authorities',
    ],
  },
  {
    v2Chapter: 2,
    title: '住所参照の本質と住所写像論',
    sourceChapters: pickSources(2, 21, 23, 25),
    preservedClaims: [
      'Normalization improves expressions but does not define referent identity.',
      'Geocoding maps to coordinates but does not solve vertical or functional referents.',
      'Postal codes compress regions but are not universal identifiers.',
      'DID and place ID systems do not independently guarantee shared referent derivation.',
    ],
    preservedMathematicalModels: [
      'prior-method limitation matrix',
      'unconditional perfect resolution impossibility statement',
    ],
    requiredArtifacts: [
      'related-work comparison matrix',
      'non-claim table for existing methods',
    ],
    nonClaims: [
      'does not dismiss existing systems',
      'does not assert AMT replaces GIS, UPU, ISO, DID, or VC standards',
    ],
  },
  {
    v2Chapter: 3,
    title: '住所対象と登録可能実体',
    sourceChapters: pickSources(3, 4, 16),
    preservedClaims: [
      'Addresses refer to entities rather than only strings or coordinates.',
      'Registrable entities include physical, social, institutional, natural, cultural, temporary, and vertical referents.',
      'Surface expressions are observations of referents, not the referents themselves.',
    ],
    preservedMathematicalModels: [
      'referent set and entity type taxonomy',
      'surface expression observation map',
      'vertical and natural referent typing',
    ],
    requiredArtifacts: [
      'registrable-entity taxonomy fixture',
      'surface-expression examples by country and language',
    ],
    nonClaims: [
      'does not treat every named place as already verified',
      'does not expose private vertical attributes by default',
    ],
  },
  {
    v2Chapter: 4,
    title: '公理・記法・安全な棄却',
    sourceChapters: pickSources(5, 6, 10, 29),
    preservedClaims: [
      'Computable address resolution requires finite candidate generation, structural maps, evidence, ordering, and refusal states.',
      'A failed axiom must produce abstention or manual review rather than false precision.',
      'Unresolved countries and weak-source regions are first-class model states.',
    ],
    preservedMathematicalModels: [
      'AMT tuple',
      'candidate sufficiency axiom',
      'purpose relativity axiom',
      'abstention safety axiom',
      'public projection safety axiom',
      'unresolved-country state model',
    ],
    requiredArtifacts: [
      'axiom dependency graph',
      'axiom-to-theorem registry',
      'unresolved-state fixture',
    ],
    nonClaims: [
      'does not silently resolve when source coverage is inadequate',
      'does not treat sparse countries as errors',
    ],
  },
  {
    v2Chapter: 5,
    title: '候補生成と出典政策',
    sourceChapters: pickSources(7, 8, 10, 21),
    preservedClaims: [
      'Candidate generation is a recall layer and must be separated from identity selection.',
      'Source policy controls which evidence can support a candidate.',
      'Multilingual expansion improves recall but cannot prove identity by itself.',
    ],
    preservedMathematicalModels: [
      'morphism chain',
      'candidate generator Gamma_t',
      'source set versioning',
      'freshness and license admissibility checks',
    ],
    requiredArtifacts: [
      'candidate-generation fixture',
      'source-policy matrix',
      'multilingual recall test vector',
    ],
    nonClaims: [
      'does not claim global candidate completeness without verification',
      'does not conflate search recall with referent equality',
    ],
  },
  {
    v2Chapter: 6,
    title: '構造距離と住所同値類',
    sourceChapters: pickSources(9, 15, 29),
    preservedClaims: [
      'Address identity is constructed through structural equivalence classes, not raw string equality.',
      'Compression and entropy measure ambiguity reduction, not absolute truth.',
      'Naive transitive-near grouping is unsafe when cluster diameter is unbounded.',
    ],
    preservedMathematicalModels: [
      'structural distance D_t',
      'threshold delta',
      'delta-bounded clusters',
      'quotient map',
      'entropy and ambiguity reduction',
    ],
    requiredArtifacts: [
      'equivalence-class model fixture',
      'cluster counterexample fixture',
      'entropy example',
    ],
    nonClaims: [
      'does not reduce all identity to geometry',
      'does not claim one universal delta works for every purpose',
    ],
  },
  {
    v2Chapter: 7,
    title: '有限推定と安全解決',
    sourceChapters: pickSources(6, 11, 14, 29),
    preservedClaims: [
      'AMT chooses, refuses, or defers over a finite candidate class set.',
      'Safe PID issuance requires sufficient purpose-relative evidence.',
      'Conflict-relative optimality is safer than absolute victory claims.',
    ],
    preservedMathematicalModels: [
      'finite candidate class set',
      'bottom candidate',
      'energy function E_t',
      'argmin existence',
      'deterministic tie-break',
      'safe PID issuance boundary',
    ],
    requiredArtifacts: [
      'finite-estimation fixture',
      'safe-resolution decision table',
      'PID issuance boundary test vector',
    ],
    nonClaims: [
      'does not issue precise PIDs for ambiguous candidates',
      'does not call manual review a model failure',
    ],
  },
  {
    v2Chapter: 8,
    title: 'History Graphs, PID Conservation, And Social Continuity',
    sourceChapters: pickSources(12, 13, 19),
    preservedClaims: [
      'Address referents change through time without losing all identity.',
      'Social continuity is evidence but must remain bounded by confidence and review rules.',
      'PID and application identifiers require different boundaries.',
    ],
    preservedMathematicalModels: [
      'history graph',
      'address conservation transitions',
      'RPID and DPID separation',
      'lineage root',
      'successor/deprecated PID states',
    ],
    requiredArtifacts: [
      'lineage ledger fixture',
      'split-merge-rename-deprecation examples',
      'PID/application-ID boundary table',
    ],
    nonClaims: [
      'does not treat continuity evidence as proof by itself',
      'does not expose historical private address content',
    ],
  },
  {
    v2Chapter: 9,
    title: 'Probability, Quality, Entropy, And Decision',
    sourceChapters: pickSources(14, 15, 17, 29),
    preservedClaims: [
      'Purpose-specific loss should shape address decisions.',
      'Quality and reputation are evidence signals, not final truth.',
      'Entropy and compression describe ambiguity and information reduction.',
    ],
    preservedMathematicalModels: [
      'Bayesian decision rule',
      'purpose-relative loss',
      'Gibbs/MAP scoring',
      'quality threshold',
      'reputation update',
      'entropy function',
    ],
    requiredArtifacts: [
      'probability-to-decision fixture',
      'quality-threshold fixture',
      'entropy benchmark',
    ],
    nonClaims: [
      'does not let scoring override hard safety gates',
      'does not treat reputation as identity proof',
    ],
  },
  {
    v2Chapter: 10,
    title: 'Natural, Cultural, Vertical, And Cross-Domain References',
    sourceChapters: pickSources(16, 24),
    preservedClaims: [
      'AMT must handle address-like references beyond ordinary buildings.',
      'Natural geography, cultural sites, ports, islands, lockers, entrances, floors, and drone handoff zones are typed referents.',
      'Case studies demonstrate model boundaries rather than universal completion.',
    ],
    preservedMathematicalModels: [
      'natural/cultural referent taxonomy',
      'bounded region model',
      'vertical reachability model',
      'cross-domain reachability equivalence',
    ],
    requiredArtifacts: [
      'vertical-reference fixture',
      'natural-geography fixture',
      'case-study compatibility table',
    ],
    nonClaims: [
      'does not claim every natural or cultural feature is globally verified',
      'does not equate virtual ownership with legal title',
    ],
  },
  {
    v2Chapter: 11,
    title: 'Protocol, Privacy, Governance, And Abuse Boundaries',
    sourceChapters: pickSources(18, 20, 22, 27, 28),
    preservedClaims: [
      'AMT is the resolution layer and cryptographic proofs are scoped layers over AMT outputs.',
      'Payment-like address flows require transaction boundaries, audit, and refusal.',
      'Governance and abuse controls are part of safe spatial identifiers.',
    ],
    preservedMathematicalModels: [
      'AMT envelope',
      'ZK predicate boundary',
      'public projection safety',
      'communication/registration/audit state model',
      'address payment rail state model',
      'governance role matrix',
    ],
    requiredArtifacts: [
      'AMT envelope compatibility fixture',
      'ZK non-repair theorem example',
      'audit event fixture',
      'governance and abuse matrix',
    ],
    nonClaims: [
      'does not claim ZK repairs bad resolution',
      'does not publish raw private address content',
      'does not force blockchain as the only registry implementation',
    ],
  },
  {
    v2Chapter: 12,
    title: 'Verification, Benchmarks, Limits, And Conclusion',
    sourceChapters: pickSources(21, 23, 24, 25, 26),
    preservedClaims: [
      'AMT must be evaluated through reproducible fixtures, benchmarks, and explicit non-claims.',
      'Case studies are evidence of method coverage, not proof of global completeness.',
      'The conclusion should state a continuing research program, not final world coverage.',
    ],
    preservedMathematicalModels: [
      'verification map',
      'benchmark comparison matrix',
      'limitation registry',
      'S-priority unverified item list',
    ],
    requiredArtifacts: [
      'verification map',
      'benchmark protocol',
      'limitations checklist',
      'final non-claim table',
    ],
    nonClaims: [
      'does not claim strict global GIS validation is complete unless verified',
      'does not claim commercial API superiority without same-condition comparison',
    ],
  },
];

function pickSources(...chapters: number[]): SourceChapter[] {
  return chapters.map(chapter => {
    const source = CURRENT_29_CHAPTERS.find(item => item.chapter === chapter);
    if (!source) {
      throw new Error(`Unknown AMT source chapter: ${chapter}`);
    }
    return source;
  });
}

export function getV2SourceCoverage(): number[] {
  return [...new Set(V2_COMPATIBILITY_MAP.flatMap(chapter => chapter.sourceChapters.map(source => source.chapter)))].sort(
    (a, b) => a - b,
  );
}

export function getMissingSourceChapters(): SourceChapter[] {
  const covered = new Set(getV2SourceCoverage());
  return CURRENT_29_CHAPTERS.filter(source => !covered.has(source.chapter));
}

export function buildV2CompatibilityReport() {
  return {
    version: ADDRESS_MORPHISM_V2_COMPATIBILITY_VERSION,
    sourceChapterCount: CURRENT_29_CHAPTERS.length,
    v2ChapterCount: V2_COMPATIBILITY_MAP.length,
    coveredSourceChapters: getV2SourceCoverage(),
    missingSourceChapters: getMissingSourceChapters(),
    chapters: V2_COMPATIBILITY_MAP,
    rule: 'The v2 paper is a lossless reorganization of the current 29-chapter AMT paper. No claim, model, non-claim, or safety boundary may be deleted without an explicit migration note.',
  };
}
