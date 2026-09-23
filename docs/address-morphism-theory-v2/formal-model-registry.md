# AMT v2 Formal Model Registry

Status: executable model registry v0.1

This registry links Address Morphism Theory v2 chapters to executable formal
models, fixtures, and tests. It is intentionally separate from the table of
contents: the table of contents explains reading order, while this file explains
which claims are currently backed by runnable checks.

## Verified Executable Models

| chapter | title | document | model | test | status |
| ---: | --- | --- | --- | --- | --- |
| 1 | 登録困難性と参照再利用問題 | `01-why-address-registration-is-hard.md` | `src/lib/addressMorphismV2Chapter1RegistrationProblem.ts` | `src/lib/addressMorphismV2Chapter1RegistrationProblem.test.ts` | verified |
| 2 | 住所参照の本質と既存手法境界 | `02-prior-work-and-the-missing-object.md` | `src/lib/addressMorphismV2Chapter2PriorWorkBoundary.ts` | `src/lib/addressMorphismV2Chapter2PriorWorkBoundary.test.ts` | verified |
| 3 | 住所対象と登録可能実体 | `03-address-objects-and-registrable-entities.md` | `src/lib/addressMorphismV2Chapter3Model.ts` | `src/lib/addressMorphismV2Chapter3Model.test.ts` | verified |
| 4 | 公理・記法・安全な棄却 | `04-axioms-notation-and-safe-abstention.md` | `src/lib/addressMorphismV2Chapter4Axioms.ts` | `src/lib/addressMorphismV2Chapter4Axioms.test.ts` | verified |
| 5 | 候補生成と出典政策 | `05-candidate-generation-and-evidence-policy.md` | `src/lib/addressMorphismV2Chapter5CandidatePolicy.ts` | `src/lib/addressMorphismV2Chapter5CandidatePolicy.test.ts` | verified |
| 6 | 構造距離と住所同値類 | `06-structural-distance-and-equivalence-classes.md` | `src/lib/addressMorphismV2Chapter6StructuralEquivalence.ts` | `src/lib/addressMorphismV2Chapter6StructuralEquivalence.test.ts` | verified |
| 7 | 有限推定と安全解決 | `07-finite-estimation-and-safe-resolution.md` | `src/lib/addressMorphismV2Chapter7SafeResolution.ts` | `src/lib/addressMorphismV2Chapter7SafeResolution.test.ts` | verified |
| 8 | 履歴グラフ、PID保存、社会的連続性 | `08-history-graphs-pid-conservation-and-social-continuity.md` | `src/lib/addressMorphismV2Chapter8HistoryGraph.ts` | `src/lib/addressMorphismV2Chapter8HistoryGraph.test.ts` | verified |
| 9 | 確率、品質、エントロピー、意思決定 | `09-probability-quality-entropy-and-decision.md` | `src/lib/addressMorphismV2Chapter9Decision.ts` | `src/lib/addressMorphismV2Chapter9Decision.test.ts` | verified |
| 10 | 自然地理・文化地理・垂直参照・クロスドメイン参照 | `10-natural-cultural-vertical-and-cross-domain-references.md` | `src/lib/addressMorphismV2Chapter10CrossDomain.ts` | `src/lib/addressMorphismV2Chapter10CrossDomain.test.ts` | verified |
| 11 | プロトコル・プライバシー・ガバナンス・悪用境界 | `11-protocol-privacy-governance-and-abuse-boundaries.md` | `src/lib/addressMorphismV2Chapter11ProtocolPrivacy.ts` | `src/lib/addressMorphismV2Chapter11ProtocolPrivacy.test.ts` | verified |
| 12 | 検証・ベンチマーク・限界・結論 | `12-verification-benchmarks-limits-and-conclusion.md` | `src/lib/addressMorphismV2Chapter12Verification.ts` | `src/lib/addressMorphismV2Chapter12Verification.test.ts` | verified |

## Preserved Model Coverage

### Chapter 1

The executable model covers:

- repeated registration bottleneck;
- map/expression/identifier layer separation;
- reference reuse readiness gate;
- purpose scope gate;
- disclosure boundary gate;
- raw address over-collection detector;
- form UX non-claim.

### Chapter 2

The executable model covers:

- prior work output classification;
- evidence layer boundary;
- safe referent readiness gate;
- replacement-claim blocker;
- fair comparison gate;
- normalization non-identity fixture;
- coordinate non-identity fixture;
- postal-code non-identifier fixture;
- ZK non-repair fixture.

### Chapter 3

The executable model covers:

- referent set;
- registrable entity set;
- surface expression set;
- observation map;
- formal counterexamples;
- formal non-claims;
- public projection non-invertibility;
- registrability/publicability separation.

### Chapter 4

The executable model covers:

- AMT axiom gate set;
- candidate sufficiency gate;
- evidence admissibility gate;
- purpose relativity gate;
- finite candidate gate;
- structural comparability gate;
- ordering decidability gate;
- public projection safety gate;
- safe abstention rule.

### Chapter 5

The executable model covers:

- candidate generation map;
- source policy matrix;
- license admissibility gate;
- freshness gate;
- source coverage gate;
- finite candidate policy;
- candidate coverage certificate;
- source debt report;
- multilingual recall expansion;
- the non-identity rule that candidates do not prove identity.

### Chapter 6

The executable model covers:

- structural feature vector;
- purpose-relative distance weights;
- structural distance components;
- equivalence threshold;
- comparability gate;
- evidence gate;
- candidate sufficiency gate;
- bounded-diameter cluster;
- quotient entropy;
- postal equality counterexample;
- POI equality counterexample;
- coordinate-cell equality counterexample.

### Chapter 7

The executable model covers:

- finite candidate class set;
- energy function;
- finite argmin;
- minimum energy gap;
- decision gate table;
- deterministic tie-break;
- resolution certificate;
- manual review state;
- unresolved state;
- safe resolution decision;
- PID issuance boundary;
- public projection safety gate.

### Chapter 8

The executable model covers:

- history graph;
- RPID/DPID/application identifier separation;
- lineage root;
- split transition safety;
- merge transition safety;
- deprecation and successor boundary;
- social continuity evidence;
- public history projection safety;
- application identifier non-PID boundary.

### Chapter 9

The executable model covers:

- Gibbs posterior distribution;
- MAP candidate selection;
- Shannon entropy;
- ambiguity reduction;
- quality threshold gate;
- reputation update;
- purpose-relative expected loss;
- decision certificate;
- probability non-repair boundary.

### Chapter 10

The executable model covers:

- cross-domain referent schema;
- domain classifier;
- boundary kind matrix;
- vertical privacy gate;
- reachability equivalence;
- cross-domain structural distance;
- digital twin correspondence boundary;
- coordinate non-identity counterexample;
- public projection safety for non-standard references.

### Chapter 11

The executable model covers:

- AMT envelope schema;
- envelope state guard;
- ZK predicate boundary;
- verifier policy matrix;
- public signal leak gate;
- scoped nullifier gate;
- revocation root gate;
- audit without raw address;
- least disclosure rule;
- neutral identifier non-claim;
- ZK non-repair boundary.

### Chapter 12

The executable model covers:

- verification map;
- claim status classifier;
- benchmark readiness scorer;
- unsafe universal wording detector;
- non-claim requirement gate;
- raw address fixture blocker;
- fair comparison gate;
- S-priority risk register;
- case study boundary checker;
- publication safety gate.

## Pending Main Chapters

All 12 v2 main chapters now have dedicated executable formal-model registry
entries.

## Verification

Run:

```bash
npm run verify:address-morphism-v2-compatibility
```

The verification command includes the v2 compatibility test, chapter 1
registration-problem tests, chapter 2 prior-work-boundary tests, chapter 3
formal model tests, chapter 4 axiom gate tests, chapter 5 candidate policy tests,
chapter 6 structural-equivalence tests, chapter 7 safe-resolution tests,
chapter 8 history-graph tests, chapter 9 decision tests, chapter 10
cross-domain-reference tests, chapter 11 protocol/privacy tests, chapter 12
verification/benchmark/publication-safety tests, early-chapter reinforcement
audits for chapters 1 through 7, late-chapter reinforcement audits for chapters
8 through 12, and this registry's consistency tests.

## Non-Claims

This registry does not claim that AMT v2 is mathematically complete.

It records which parts of the theory already have executable checks, and which
parts remain pending. It is a publication-safety device: a chapter should not be
advertised as verified unless its claims are linked to definitions, tests,
fixtures, or a clear non-claim.
