# Address Morphism Theory v2 Table Of Contents

Status: draft table of contents

Compatibility status: lossless reorganization of the current 29-chapter paper.
Every v2 chapter must preserve the claims and mathematical models listed in
`compatibility-map.md`.

## Main Paper

### 1. Why Address Registration Is Hard

Question: Why do people repeatedly type the same address, and why is that not
just a form-design problem?

Role: Defines the problem, the thesis, the reader contract, and the boundary
between addresses, maps, and identifiers.

Preserves current chapters: 1, 2, 6, 25.

### 2. 住所参照の本質と住所写像論

Question: Why do normalization, geocoding, postal codes, place IDs, and DID-like
systems not solve address identity by themselves?

Role: Turns prior work into a map of what AMT does and does not claim.

Preserves current chapters: 2, 21, 23, 25.

### 3. 住所対象と登録可能実体

Question: What is the thing an address refers to?

Role: Defines referents, registrable entities, social entities, natural
geography, cultural geography, vertical units, and temporary entities.

Preserves current chapters: 3, 4, 16.

### 4. 公理・記法・安全な棄却

Question: What minimum assumptions make address resolution computable?

Role: Gives the formal vocabulary, axiom system, refusal states, and the rule
that failed assumptions must produce abstention rather than false precision.

Preserves current chapters: 5, 6, 10, 29.

### 5. 候補生成と出典政策

Question: How does a surface expression become a finite candidate set?

Role: Defines normalization, source policy, multilingual recall, candidate
sufficiency, evidence freshness, and source-coverage limits.

Preserves current chapters: 7, 8, 10, 21.

### 6. 構造距離と住所同値類

Question: When are two address expressions close enough to refer to the same
entity?

Role: Defines structural distance, delta-clusters, quotient maps, equivalence
classes, and counterexamples to naive string or coordinate equality.

Preserves current chapters: 9, 15, 29.

### 7. 有限推定と安全解決

Question: How does AMT choose, refuse, or defer?

Role: Defines finite candidate estimation, energy minimization, deterministic
tie-breaking, unresolved states, safe PID issuance, and manual review.

Preserves current chapters: 6, 11, 14, 29.

### 8. History Graphs, PID Conservation, And Social Continuity

Question: How can an address identifier persist through renaming, relocation,
splitting, merging, and institutional change?

Role: Defines history graphs, RPID/DPID separation, lineage transitions,
deprecation, successor identifiers, and social continuity.

Preserves current chapters: 12, 13, 19.

### 9. Probability, Quality, Entropy, And Decision

Question: How should uncertainty, quality, and purpose-specific loss affect
address decisions?

Role: Defines Gibbs/MAP style scoring, Bayesian decision, entropy, quality
thresholds, reputation, and purpose-relative optimality.

Preserves current chapters: 14, 15, 17, 29.

### 10. Natural, Cultural, Vertical, And Cross-Domain References

Question: Can AMT handle places that are not ordinary street addresses?

Role: Extends AMT to seas, islands, mountains, deserts, ports, lockers, floors,
entrances, drone handoff zones, emergency shelters, and digital twins.

Preserves current chapters: 16, 24.

### 11. Protocol, Privacy, Governance, And Abuse Boundaries

Question: How can address references be used without becoming surveillance
infrastructure?

Role: Defines AMT envelopes, privacy boundaries, ZK/predicate boundaries,
governance roles, public/private projections, audit rules, and abuse controls.

Preserves current chapters: 18, 20, 22, 27, 28.

### 12. Verification, Benchmarks, Limits, And Conclusion

Question: How do we know AMT is useful, and what remains unverified?

Role: Defines reproducibility, benchmarks, comparison methods, strict
non-claims, remaining S-priority risks, and the final research program.

Preserves current chapters: 21, 23, 24, 25, 26.

## Appendices

### Appendix A. Core Notation

Symbols, sets, maps, states, and naming conventions.

### Appendix B. Theorem And Proof Registry

Definitions, propositions, lemmas, theorems, corollaries, and proof sketches.

### Appendix C. Counterexamples

Cases where naive address normalization, coordinate identity, postal-code
identity, or proof validity fails.

### Appendix D. Verification Map

Links from claims to fixtures, tests, executable models, and unverified items.

### Appendix E. Related Work Matrix

Comparison against normalization, geocoding, record linkage, place ID, GIS,
postal standards, DID, VC, ZK, and delivery verification systems.

### Appendix F. Implementation And Repository Map

How AMT connects to AGID, ZK Address Predicates, Address Login, postal-code
generation, country packs, ocean packs, and governance repositories.

### Appendix G. Commutative Diagrams

Strict, weak, conditional, and intentionally non-commutative diagrams for AMT
processing paths, including multilingual referents, postal-equivalent regions,
history successors, PID issuance, ZK boundaries, vertical privacy, anonymous
delivery, audit projection, country packs, and ocean hierarchy.

### Appendix H. Address Communication Semantics

Address Communication Object, receiver capability negotiation, ValidComm,
semantic ACK states, revocation-aware validity, leakage-bounded communication,
and failure taxonomy for treating addresses as purpose-scoped communication
objects rather than raw address broadcasts.

## Decision

The v2 main paper has 12 chapters. Extra material should not become chapter 13
unless it changes the core theory. It should become an appendix, companion
paper, or executable model first.
