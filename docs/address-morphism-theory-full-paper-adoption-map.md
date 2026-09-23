# Address Morphism Theory Full English Paper: Source Adoption and Claim Map

Date: 2026-06-06

Primary source under review: `C:/Users/kitau/Downloads/main (5).pdf`

Supporting project records:

- `docs/address-morphism-theory-paper-draft.md`
- `docs/address-morphism-theory-paper-professional-draft.md`
- `docs/address-morphism-lean-gis-cross-verification.md`
- `docs/address-morphism-theory-challenging-hypotheses-validation.md`
- `docs/address-morphism-expectation-verification-report.md`
- `docs/address-morphism-theory-unverified-items.md`
- `docs/address-morphism-paper-expression-audit.md`
- `docs/address-morphism-paper-model-diagram-gap-audit.md`
- `formal/AMTCore.lean`
- `formal/AMTPaperExtensions.lean`
- `formal/GeneratedGisCertificate.lean`

## Executive Decision

The 142-page Japanese PDF already contains the core mathematical spine of
Address Morphism Theory. A serious English paper can be written in the 80-340
page range by using the PDF as the primary theory source, but the English
version should not be a literal translation. It should be a professional
revision with stronger claim discipline.

The English paper should present AMT as:

```text
a conditional, auditable theory of address reference under partial observation,
compression, context dependence, temporal change, and source uncertainty.
```

It should not present AMT as:

```text
a universal resolver that always finds the globally correct address.
```

## Adopt Directly

These parts of `main (5).pdf` can be adopted into the English paper with
ordinary English rewriting and notation cleanup.

| PDF content | English paper treatment | Reason |
| --- | --- | --- |
| Map / address / identifier separation | Adopt as a foundational section | This is the conceptual core and prevents coordinate/PID/address confusion. |
| Address as a reference to an entity | Adopt | Central AMT definition and consistent with Lean formalization. |
| Address morphism chain | Adopt | Parsing, expansion, candidates, clustering, selection, PID issuance form the main architecture. |
| Finite candidate generation | Adopt conditionally | Lean supports candidate-soundness and missing-candidate limits. |
| Structural dissimilarity and clustering | Adopt | Strong central model; call it dissimilarity or directed cost, not metric. |
| Unresolved / ambiguous / rejected outputs | Adopt strongly | Lean verifies that non-emitting states prevent false emission. |
| PID issuance as a gated process | Adopt strongly | Lean and implementation records support gate discipline. |
| Address lineage and temporal structure | Adopt | Split/merge/rename are essential and formally supported in graph form. |
| Context-relative optimality | Adopt | Lean supports no universal optimum when contexts conflict. |
| Natural geographic referents | Adopt as an extension of referents | Implementation and GIS checks support current scope, but not global completeness. |
| Vertical reference layer | Adopt | Lean proves horizontal projection collision limits. |
| Formal verification / GIS / implementation separation | Adopt and expand | Essential for a professional paper. |

## Adopt with Modified Claims

These parts are valuable, but the English paper must weaken or sharpen the
claim.

| PDF claim or section | Required revision | Safe English claim |
| --- | --- | --- |
| "Addresses do not function as identifiers" | Too absolute | Addresses function locally, but not as globally persistent, machine-verifiable, time-stable identifiers. |
| "Delivery is the strictest test" | Delivery failures have many causes | Delivery is a useful operational evidence signal, not the only or absolute test of reference truth. |
| "Conditional completeness" | Risk of being read as universal completeness | Use "model-internal conditional well-definedness" and "conditional soundness." |
| Energy update lowers energy after success | The negative log-likelihood form gives smaller increments, not necessarily absolute decreases | High-likelihood evidence gives lower relative energy growth than competing hypotheses. |
| Probability examples | Values may be illustrative unless parameters are supplied | Mark as illustrative or provide priors, likelihoods, and temperature. |
| PID collision probability | Pair collision and birthday bound must be separated | The ideal injective PID theorem is separate from bounded hash collision analysis. |
| Natural geography homotopy invariance | Too broad if splits/merges/disappearance occur | RPID is preserved only under reference-class-preserving deformation. |
| Riemannian / metric language | Too strong for hybrid social/geographic costs | Use "hybrid state space," "directed dissimilarity," or "contextual cost." |
| "All natural names can be recognized" | Not verified | Current model supports source-bound natural/cultural referents; global coverage is an empirical program. |
| "Commercial APIs can be beaten" | Not verified | AMT can be benchmarked against commercial validators and may complement them with auditability and unresolved states. |

## Exclude from the Core AMT Paper

These topics are important, but should be treated as companion work rather than
the core AMT thesis.

| Topic | Reason | Companion target |
| --- | --- | --- |
| ZK Address Proof circuit security | AMT gives semantics; it does not prove cryptographic zero-knowledge | ZK Address Proofs from AMT |
| ZK Residence / Delivery Eligibility | Proof protocol and credential system, not core address reference theory | ZK / credential paper |
| Nullifier construction | Cryptographic protocol detail | ZK / credential paper |
| Revocation and freshness roots | Credential and proof infrastructure | ZK / credential paper |
| Proof Bundle Registry implementation | Protocol compatibility model | ZK / protocol paper |
| AGID public identifier standard | Applied public geospatial identifier | AGID/AOID application paper |
| AOID private owner/delivery operations | Private data, keys, delegation, sync, QR, inheritance | AGID/AOID application paper |
| Polkadot anchoring | Chain-specific implementation | Protocol / implementation paper |
| MCP and shopping-agent integration | Product and API integration | Applied system paper |

The core paper may include short boundary sections explaining that these are
applications of AMT, but not central claims.

## New Claims to Add to the English Paper

The following claims are supported by current verification records and should be
added explicitly.

| New claim | Evidence source | Status |
| --- | --- | --- |
| Address reference impossibility is the primary negative theorem | `formal/AMTCore.lean` | Lean-proved under non-injective observation |
| Safe PID issuance is a certified gate, not a guess | Lean + PID audit tests | Formal/implementation-supported |
| Address conservation is append-only lineage preservation, not metaphysical non-disappearance | `AMTPaperExtensions.lean` | Lean-proved for append-only graphs |
| Reference-preserving renames preserve reference class | Lean extensions | Lean-proved |
| Address compression is lossy when non-injective | Lean extensions | Lean-proved |
| No Free Lunch is context-specific, not mystical | Lean extensions | Lean-proved under strict context conflict |
| GIS validation can be bridged into Lean as a certificate | Generated GIS certificate | Lean-GIS bridge, not direct proof of geography |
| Unknown/rejected sources cannot be treated as verified | Lean extensions | Lean-proved policy gate |
| Natural/cultural feature support is source-bound | Tests + GIS validation | Implementation-supported, not globally complete |
| ZK-related code is proof-ready/envelope-level, not full ZK | ZK docs and tests | Must be stated as boundary |

## Claims That Must Remain Open

| Open issue | Why it remains open | Paper treatment |
| --- | --- | --- |
| Global address candidate recall | Requires country/region gold datasets | Empirical benchmark agenda |
| Global natural feature coverage | OSM, GeoNames, Natural Earth, UNESCO, national sources are incomplete or inconsistent | Source-bound coverage study |
| Commercial validator superiority or parity | Proprietary systems require controlled comparison | Benchmark design only |
| Live official postal API quality | Terms, rate limits, freshness, and API availability vary | Source governance model |
| Complete ZK safety | Requires actual circuits, cryptographic audits, and anonymity-set analysis | Companion paper |
| Real delivery success calibration | Requires carrier data and failure-cause separation | Operational validation |

## Recommended English Paper Framing

Use this thesis statement:

```text
Address Morphism Theory is a formal and auditable framework for transforming
ambiguous address expressions into conditional reference outcomes, persistent
identifier candidates, and lineage-aware evidence envelopes. Its central result
is not that all addresses can be solved, but that any safe address system must
model the exact conditions under which resolution is possible and abstain when
those conditions are not met.
```

Avoid this thesis statement:

```text
AMT solves every address and creates a universal identifier for all places.
```

## Target Page Plan

A polished English manuscript in the 80-340 page range should be built in three
tiers:

| Target | Approximate words | Use |
| --- | ---: | --- |
| 80-110 pages | 28,000-38,000 | Main journal-style monograph |
| 120-180 pages | 40,000-65,000 | Full technical monograph with examples and appendices |
| 200-340 pages | 70,000-120,000 | Book-length specification with implementation and data appendices |

For the current project, the best first target is 90-130 pages: large enough to
include definitions, theorems, proofs, examples, diagrams, validation tables,
and appendices, but still readable as one theory paper.
