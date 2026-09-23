# AMT v2 Compatibility Map

Status: required migration control

## Compatibility Rule

The v2 paper is not a reduced summary. It is a lossless reorganization of the
current 29-chapter Address Morphism Theory paper.

No claim, definition, axiom, theorem, counterexample, mathematical model,
implementation boundary, safety boundary, or non-claim may be deleted unless a
migration note explicitly says where it moved and why it is no longer part of
the main paper.

## 29 Chapters To 12 Chapters

| current chapter | current topic | v2 destination | preservation requirement |
| ---: | --- | ---: | --- |
| 1 | Introduction and registration difficulty | 1 | Preserve the repeated-registration problem, layer separation, and central thesis. |
| 2 | Address basics: reference, compression, communication, history | 1, 2 | Preserve reference/compression/communication/history as the motivating frame and prior-work bridge. |
| 3 | Registrable entities | 3 | Preserve the distinction between expressions and referents. |
| 4 | Surface address expressions | 3 | Preserve surface expression as observation, not identity. |
| 5 | Formal preliminaries | 4 | Preserve notation, sets, partial maps, and safe model vocabulary. |
| 6 | Address unresolvability decision | 1, 4, 7 | Preserve unresolved state as correctness, not failure. |
| 7 | AMT morphism chain | 5 | Preserve the full surface-to-referent morphism chain. |
| 8 | Candidate generation and source policy | 5 | Preserve finite candidate generation, source policy, freshness, and source limits. |
| 9 | Clusters and address equivalence classes | 6 | Preserve structural distance, clusters, equivalence classes, and quotient maps. |
| 10 | Unresolved country theory | 4, 5 | Preserve country/source insufficiency as a formal state. |
| 11 | Safe resolution and PID issuance | 7 | Preserve safe resolution, manual review, and PID issuance boundary. |
| 12 | History graph and address conservation | 8 | Preserve history graph, lineage, split/merge/deprecation, and conservation. |
| 13 | Social continuity | 8 | Preserve social continuity as bounded evidence. |
| 14 | Conflict-relative optimality | 7, 9 | Preserve purpose-relative optimality and conflict-sensitive decisions. |
| 15 | Address compression and entropy | 6, 9 | Preserve entropy, compression, and ambiguity reduction. |
| 16 | Natural geography, cultural geography, and vertical reference | 3, 10 | Preserve natural, cultural, vertical, and non-building referents. |
| 17 | Evaluation, quality, and reputation | 9 | Preserve quality, evidence scoring, and reputation as signals. |
| 18 | AMT and cryptographic extension boundary | 11 | Preserve boundary between AMT resolution and cryptographic extension. |
| 19 | PID and application identifier boundary | 8 | Preserve PID/application-ID separation. |
| 20 | Communication, registration, and audit model | 11 | Preserve communication, registration, and audit state models. |
| 21 | Verification and reproducibility | 2, 5, 12 | Preserve verification map, reproducibility, and source-coverage caveats. |
| 22 | Security, abuse, and governance | 11 | Preserve threat, abuse, governance, and safety boundaries. |
| 23 | Benchmarks and comparison | 2, 12 | Preserve benchmark method and fair-comparison non-claims. |
| 24 | Case studies | 10, 12 | Preserve case studies as bounded demonstrations, not universal proof. |
| 25 | Limitations | 1, 2, 12 | Preserve all limitations and non-claims. |
| 26 | Conclusion | 12 | Preserve the final research program and future work. |
| 27 | Address payment rails | 11 | Preserve payment-like transaction boundaries and address rail model. |
| 28 | AMT envelope and ZK predicate boundary | 11 | Preserve AMT envelope, ZK state guard, and ZK non-repair theorem. |
| 29 | Mathematical model core | 4, 6, 7, 9 | Preserve AMT tuple, axioms, existence, uniqueness, PID safety, and public projection safety. |

## Mathematical Model Preservation Checklist

The following models must appear in v2 either in the main text, appendix, or
executable model registry:

- surface expression set;
- referent/candidate set;
- evidence set;
- purpose set;
- candidate generation map;
- normalization map;
- morphism chain;
- structural distance;
- threshold `delta`;
- delta-bounded clusters;
- quotient map;
- equivalence classes;
- candidate compression;
- bottom/unresolved state;
- energy or score function;
- finite argmin existence;
- deterministic tie-breaking;
- safe resolution boundary;
- PID issuance map;
- RPID/DPID distinction;
- history graph;
- lineage root;
- successor/deprecation transitions;
- entropy and ambiguity reduction;
- quality threshold;
- reputation update;
- purpose-relative loss;
- Bayesian/Gibbs/MAP decision layer;
- source freshness and source version;
- public projection safety;
- AMT envelope;
- ZK predicate boundary;
- audit state model;
- benchmark and verification map.

## Claim Preservation Checklist

The following claims must not be lost:

- addresses are computable references, not merely strings;
- map location, address expression, and persistent identifier are distinct;
- candidate generation is a recall layer, not identity proof;
- normalization is necessary but insufficient;
- coordinates are evidence, not complete identity;
- postal codes are useful compression, not universal identifiers;
- unresolved output is a safety feature;
- source coverage limits must be explicit;
- structural identity is purpose-sensitive and evidence-backed;
- PID issuance is partial and bounded;
- history must preserve split, merge, rename, deprecation, and successor states;
- social continuity is evidence, not unrestricted truth;
- cryptographic proofs cannot repair bad resolution;
- public identifiers must not expose private address content;
- global completeness is unverified unless regionally validated.

## Migration Gate

Before any v2 chapter is treated as canonical, it must declare:

- source chapters used;
- preserved claims;
- preserved mathematical models;
- moved-to-appendix material;
- non-claims;
- executable or fixture hooks.
