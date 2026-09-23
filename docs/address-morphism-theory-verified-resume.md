# Address Morphism Theory Verified Resume

Last updated: 2026-06-06

## Purpose

This resume summarizes Address Morphism Theory (AMT) using only claims that are
currently supported by one of the following verification paths:

- Lean formalization in `formal/AMTCore.lean`.
- GIS validation through `npm run verify:gis`.
- Implementation tests around AMT resolution, source evidence, PID issuance
  audit, and AMN public envelopes.
- Implementation tests around address quality scoring, natural-feature address
  rendering, official postal-source coverage, address verification policy, and
  ZK proof-bundle compatibility.
- The revised manuscript `main (5).pdf`, used only as source material for
  terminology and chapter intent.

The resume intentionally avoids claims that are not yet proved or empirically
validated. In particular, it does not claim that every real-world address can be
resolved uniquely without assumptions.

## Table of Contents Strategy

The strongest English resume structure is:

1. Scope and verified status
2. Core problem
3. Map, address, and identifier separation
4. AMT pipeline
5. Formal core verified in Lean
6. Algorithmic behavior verified by tests
7. Address quality and official postal source validation
8. GIS validation status
9. Privacy and audit boundary
10. Known limitations and safe wording
11. Recommended placement in the paper
12. Next validation plan

This order is safer than following the full manuscript order directly. It
starts from verified claims, then expands into implementation and paper-writing
guidance. The full manuscript can keep its broader chapters, but the public
resume should lead with what is already checked.

## Core Problem

AMT treats an address as a reference to a spatial or social entity, not merely
as a string and not merely as coordinates.

The practical problem is:

```text
Human address input is ambiguous, multilingual, incomplete, time-dependent,
and institution-dependent.
```

Therefore, address resolution should not be modeled as direct string
normalization or direct geocoding. It should be modeled as an evidence-scored
resolution process over finite candidates and clusters.

## Three-Layer Separation

The manuscript's most useful conceptual separation is:

```text
Map        -> where something is under a geodetic or spatial model
Address    -> how an entity is referred to by human and institutional systems
Identifier -> what entity is being referred to across language, notation, and time
```

Verified safe wording:

```text
AMT separates maps, addresses, and identifiers. Coordinates can provide strong
evidence, but coordinates alone do not define address identity. Address strings
can provide strong evidence, but strings alone do not define entity identity.
```

Avoid this stronger unverified wording:

```text
AMT always determines the true physical entity behind any address.
```

## AMT Pipeline

The verified implementation supports this pipeline:

```text
ambiguous input
-> candidate generation
-> structural comparison
-> bounded clustering
-> evidence and history scoring
-> verified, partial, ambiguous, or unresolved decision
-> PID issuance when the decision is strong enough
```

The important design point is that AMT has safe non-identity outputs:

```text
ambiguous
unresolved
```

These are not implementation failures. They are part of the theory. They avoid
forcing a false identifier when evidence is insufficient.

## Formal Core Verified in Lean

The Lean file `formal/AMTCore.lean` verifies a small but important formal core.

### 1. No condition-free perfect resolver under ambiguous observations

Lean verifies that if two distinct entities produce the same observable
address/input, a total resolver that returns exactly one entity cannot be
correct for both.

Safe theorem statement:

```text
If observation is not injective, no condition-free resolver can be perfectly
correct for all distinct entities sharing the same observation.
```

Consequence:

```text
AMT needs ambiguous and unresolved outputs. They are logically necessary under
non-injective observation, not merely product features.
```

### 2. Candidate soundness implies membership

Lean verifies that if a resolver is candidate-sound, then every resolved output
belongs to the generated candidate set for the same observation.

Safe theorem statement:

```text
A candidate-sound resolver does not emit an entity outside the candidate set it
was given.
```

Consequence:

```text
Candidate generation is a critical boundary. Resolution quality cannot exceed
the evidence and candidate coverage supplied to the resolver.
```

### 3. Outcome soundness for resolvers that can abstain

Lean now verifies an explicit outcome model:

```text
resolved(entity)
ambiguous
unresolved
```

For this model, Lean verifies that a resolved entity must come from the
candidate set when the outcome resolver is candidate-sound.

Safe theorem statement:

```text
If an outcome resolver emits resolved(entity), candidate soundness implies that
entity is a member of the generated candidate set for that observation.
```

Consequence:

```text
The resolver may abstain, but any emitted entity remains candidate-bounded.
```

### 4. Abstention emits no false entity

Lean verifies that `ambiguous` and `unresolved` do not resolve to any entity and
do not emit a false entity.

Safe theorem statement:

```text
Ambiguous and unresolved outcomes are non-emitting states.
```

Consequence:

```text
Abstention is a formal safety mechanism: it avoids false uniqueness instead of
pretending that weak or tied evidence identifies one entity.
```

### 5. Minimal deterministic candidate selection is candidate-contained

Lean verifies that a minimal first-candidate selector over a finite list returns
a member of that list whenever it returns a value.

Safe theorem statement:

```text
If chooseFirstCandidate(candidates) returns some entity, that entity is in
candidates.
```

Important limitation:

```text
This only proves candidate containment for a minimal selector. It does not yet
prove that the selected candidate is globally optimal under the AMT scoring
function.
```

### 6. Score threshold and margin conditions are formally checkable

Lean now verifies a simple score-selection predicate for lower-is-better energy
values:

```text
bestEnergy <= threshold
bestEnergy + margin <= secondEnergy
```

Safe theorem statements:

```text
If threshold < bestEnergy, score selection is not admissible.
If secondEnergy < bestEnergy + margin, score selection is not admissible.
```

Consequence:

```text
Near ties and over-threshold candidates can be rejected under explicit,
machine-checkable score assumptions.
```

Important limitation:

```text
This does not yet verify the full production scoring function. It verifies the
selection gate shape that the production scoring function should satisfy.
```

### 7. Certified gated resolution is formally checkable

Lean now verifies a new model called Certified Gated Resolution.

This model bundles the checks required before AMT is allowed to emit a
PID-bearing entity:

```text
selected entity is in the generated candidate list
score threshold and score margin pass
quality score meets the required threshold
freshness is inside the allowed evidence window
risk is inside the configured budget
```

Safe theorem statements:

```text
If certified gated resolution emits resolved(entity), all admissibility
conditions are present.
If the admissibility conditions are not present, certified gated resolution
abstains with unresolved.
If the entity is missing from the candidate list, emission is impossible.
If energy is too high, emission is impossible.
If the margin to the second candidate is too small, emission is impossible.
If quality is too low, emission is impossible.
If freshness is stale, emission is impossible.
If risk exceeds the configured budget, emission is impossible.
```

Consequence:

```text
AMT can now be described as a certificate-gated partial resolver. It does not
claim condition-free truth discovery; it emits only when candidate, score,
quality, freshness, and risk gates are all satisfied.
```

Important limitation:

```text
The Lean model verifies the shape of the gate. Production code must still map
real evidence scores, quality scores, freshness roots, and risk budgets into
this abstract predicate.
```

### 8. PID uniqueness requires injectivity

Lean verifies that PID collision-freedom follows from an injective PID
assignment.

Safe theorem statement:

```text
If pidOf is injective, then two entities with the same PID are equal.
```

Important limitation:

```text
The implemented hash-based PID is not mathematically injective by itself.
Hash-based PIDs require collision analysis and operational safeguards.
```

This distinction should remain explicit in the paper.

### 9. Additional challenged hypotheses now formalized

Lean now also verifies several counterexample-oriented facts that should guide
the manuscript's stronger hypotheses:

```text
If a real entity is missing from its generated candidate set, candidate
completeness is false.

If structural dissimilarity is asymmetric for one pair, it cannot be treated as
a symmetric metric without additional transformation.

If normalization collapses two distinct entities to the same normalized
observation, no normalized-observation resolver can be correct for both.

If two vertical referents share the same ground projection, a ground-only
resolver cannot recover both.

A functional time transition cannot represent a one-to-many split.

Any PID minted only as a function of an observation collides when two entities
share that observation.

If a public predicate value is shared by two distinct private values, the public
predicate alone cannot identify the private value.
```

Consequence:

```text
The most defensible AMT claim is not absolute resolution. It is conditional
resolution with explicit candidate coverage, abstention, temporal lineage,
vertical reference, gated PID issuance, and privacy-preserving predicate
boundaries.
```

## Algorithmic Behavior Verified by Tests

The AMT implementation tests currently verify the following behaviors:

### Structural comparison

- Multilingual variants of the same address can have low structural distance.
- Directional structural distance is treated carefully by using a symmetric
  dissimilarity for bounded clustering.
- Structural dissimilarity is not claimed to be a mathematical metric.

This matches the manuscript's appendix warning that the implemented structural
dissimilarity should not be described as a full metric.

### Bounded clustering

Tests verify that clustering stays bounded and does not merge a long transitive
chain of near-neighbor candidates into one distant cluster.

Safe wording:

```text
AMT clustering is bounded to reduce transitive over-merge risk.
```

Avoid:

```text
AMT clustering always reconstructs the real-world entity.
```

### Evidence consensus

Tests verify that canonical cluster fields are chosen by evidence consensus,
not by the longest label.

This is important for address safety because long parsed strings can contain
extra words, wrong administrative labels, or delivery-irrelevant text.

### PID formation

Tests verify that the current derived PID format is:

```text
AMT- + upper 128 bits of SHA-256 over canonical structural material
```

This gives deterministic implementation behavior. It should be described as a
derived hash PID, not as a formally injective theoretical PID.

The repository now includes a free local collision-risk budget check:

```text
npm run verify:pid-risk
```

Current verified budget:

```text
Hash bits: 128
Maximum issued PIDs in the configured budget: 1,000,000,000,000
Birthday-bound collision upper bound: 1.4693679385263966e-15
Configured maximum collision risk: 1e-12
Required bits for the configured risk budget: 119
Safety margin: 9 bits
Budget result: pass
```

Safe wording:

```text
The current hash-based PID is not formally injective, but it can be operated
under an explicit issuance and collision-risk budget that is checked by a free
local script.
```

### Decision states

Tests verify that:

- clear Tokyo Station evidence can produce a verified PID;
- repeated negative and positive history can move selection between candidates;
- near-tied unrelated candidates are marked ambiguous;
- weak evidence returns unresolved and no PID.

This supports the theory's main practical claim:

```text
AMT is an evidence-scored resolver with safe abstention states.
```

## Source Evidence and Natural Feature Handling

Implementation tests verify that:

- country JSON and postal open-source metadata can strengthen a candidate;
- Google libaddressinput metadata can be promoted as high-trust address-format
  evidence;
- Open Location Code can strengthen natural or no-postal-code address contexts;
- dialect or script romanization can improve search energy;
- sea and mountain context can produce a partial natural-address candidate
  without inventing a postal address.
- named lake, river, waterfall, island, archipelago, desert, desert-like sparse
  natural geography, wilderness, salt lake, and ice-field contexts can be
  rendered as natural addresses when coordinate and source evidence exist;
- normal street addresses are not replaced merely because nearby natural
  context exists.

Safe wording:

```text
AMT can incorporate postal, format, geocoding, romanization, and natural-feature
evidence as separate evidence layers.
```

Avoid:

```text
AMT already recognizes every natural feature worldwide.
```

## Address Quality and Official Postal Source Validation

Implementation tests verify internal quality scoring and verification policy
for representative urban, rural, island, mountain, desert, desert-like sparse,
lake, no-postal-code, and unresolved cases.

Verified behavior:

```text
Stable urban native address tabs can score high enough to avoid duplicate
verification.
Strong island or no-postal-code geodata can keep an address tab visible.
Sparse rural and desert contexts can be marked for re-verification rather than
forced into a false unresolved state.
Clearly unresolved address tabs can be hidden.
If every tab is hidden, the best candidate is preserved for review.
```

Address verification tests also verify that:

```text
target countries gate verification before postcode checks;
postcode-only evidence is partial until lookup evidence agrees;
strong official postal APIs can verify postal addresses;
weak postal sources cannot upgrade a deliverability-style address to verified;
no-postal-code areas can use strong geography evidence for geo verification;
reference address matches can verify street and house-level addresses.
```

Official source validation was also run:

```text
npm run verify:postal-sources
npm run report:official-postal-sources
```

Current verified source result:

```text
Address-format files: 281
Registered open-source IDs: 408
Unique postal APIs: 89
Unique postal probe targets: 201
Static postal-source issues: 0
needs-official-source: 0
no-normal-postcode: 27
country-specific official-source gaps covered by global official fallback: 109
```

Safe wording:

```text
The current repository has complete official-source status classification for
the covered address-format files, with no remaining `needs-official-source`
regions in the coverage report.
```

Required caution:

```text
Some regions still rely on global official fallback sources rather than
country-specific official or postal-operator sources. This is acceptable for
coverage classification, but it is not the same as having a country-specific
official validation API for every region.
```

## GIS Validation Status

The GIS validation command was run:

```text
npm run verify:gis
```

Current verified result:

```text
Features exported: 351
Hard geometry errors: 0
Warnings: 149
GDAL conversion/read check: ok
Registered open-source sources: 408
Generated GeoJSON: test-results/gis-validation/agid-boundary-validation.geojson
Generated QGIS project: test-results/gis-validation/AGID-gis-validation.qgs
```

Safe wording:

```text
The current GIS validation confirms that the exported boundary dataset is
machine-readable by GDAL and has no hard geometry errors in the validator.
```

Required caution:

```text
The same run reports 149 warnings, including missing polygons, duplicate IDs,
and points outside bounding boxes. These warnings require QGIS/manual review or
data correction before claiming strict global GIS validation.
```

Strict validation was also attempted:

```text
npm run verify:gis:strict
```

Current strict result:

```text
Strict GIS validation: not passed
Hard geometry errors: 0
Warnings: 149
GDAL conversion/read check: ok
```

Interpretation:

```text
The strict run verifies the present limitation: the dataset is readable and has
zero hard errors in the validator, but strict global GIS quality is not yet
proved because warnings remain.
```

To make this limitation continuously verifiable for free, the repository now
also supports a warning-budget ratchet:

```text
npm run verify:gis:budget
```

Current warning-budget result:

```text
Features: 351
Errors: 0 / 0
Warnings: 149 / 149
Registered sources: 408 / 408
Budget result: pass
Warning issue budgets:
  missing-polygon: 66
  point-outside-bbox: 64
  duplicate-id: 19
```

Safe wording:

```text
Strict GIS validation is not yet complete, but GIS warning quality is now
ratcheted: new warning types or warning-count regressions fail the free local
budget check.
```

## Privacy and Audit Boundary

AMT now has an implementation path for privacy-preserving audit envelopes.
Tests verify that PID issuance audit envelopes can prove the workflow steps:

```text
candidate generation
clustering
unresolved gate
history update
PID issuance
```

The public envelope hides:

```text
raw address input
raw candidate labels
private history roots
private candidate IDs
private audit salt
```

Safe wording:

```text
The current implementation provides commitment-based, privacy-preserving audit
envelopes that are ZK-ready.
```

Additional ZK compatibility tests verify that:

```text
proof bundles reject raw private proof material;
single-use nullifier replay is rejected;
active, expired, and revoked bundle states are detected;
scope and challenge mismatches are rejected;
cross-role collisions between nullifiers and commitments are detected;
the TypeScript layer remains an envelope/orchestration layer, while proof
predicate and circuit backends are expected to use non-TypeScript runtimes.
```

Avoid until real circuits are implemented and verified:

```text
The current implementation is a complete zero-knowledge proof system.
```

## AMN Connection

Address Morphism Network (AMN) is a protocol layer built around AMT output.
Its tested public envelope model stores policy hashes, evidence roots, workflow
gates, and public commitments rather than raw private address material.

Safe wording:

```text
AMN can expose AMT resolution as an auditable public envelope while keeping
private address material off the public registry surface.
```

This should be treated as an implementation and protocol extension, not as a
new proof of AMT's mathematical completeness.

## Claims That Are Safe to Keep

The following claims are currently well-supported:

1. Address strings and coordinates alone are insufficient as universal entity
   identifiers.
2. Non-injective observation makes condition-free perfect resolution impossible.
3. Ambiguous and unresolved outputs are necessary safety states.
4. Candidate generation and source coverage are explicit assumptions.
5. PID uniqueness is formal only under injective PID assignment.
6. Hash-based derived PIDs are deterministic and now have a configurable
   birthday-bound collision-risk budget check.
7. Certified gated resolution can make emission conditional on candidate,
   score, quality, freshness, and risk gates.
8. Bounded clustering reduces transitive over-merge risk.
9. Evidence and history can affect candidate selection.
10. Natural-feature and no-postal contexts should use geo evidence rather than
   invented postal addresses.
11. Public audit envelopes should hide raw address material.
12. Ambiguous and unresolved outcomes are formally non-emitting states.
13. Internal quality scoring can distinguish high-confidence, re-verification,
    hidden, and review-preserved address tabs in representative cases.
14. Official-source coverage classification has no remaining
    `needs-official-source` regions in the current repository report.
15. ZK proof-bundle compatibility tests reject private material, replayed
    nullifiers, mismatched scopes, and commitment/nullifier collisions.
16. GIS warnings are not yet eliminated, but their current counts are
    ratcheted by a free local warning-budget check.

## Claims That Should Be Rewritten

### Overclaim

```text
AMT can uniquely determine any address.
```

### Safer rewrite

```text
Under explicit candidate coverage, evidence quality, threshold, and tie-breaking
assumptions, AMT can deterministically select a best cluster or abstain with
ambiguous/unresolved.
```

### Overclaim

```text
PID identifies all real-world entities without collision.
```

### Safer rewrite

```text
The theoretical PID is collision-free only when the PID assignment is injective.
The implemented derived PID is a bounded hash identifier and therefore requires
collision-risk budgeting, monitoring, and fallback handling.
```

### Overclaim

```text
GIS validation proves global geographic correctness.
```

### Safer rewrite

```text
The current GIS validator confirms machine-readable exports and zero hard
geometry errors for the present dataset, while warnings remain as review and
data-quality tasks.
```

### Overclaim

```text
ZK proofs are complete.
```

### Safer rewrite

```text
The current implementation is commitment-based and ZK-ready. Full ZK claims
should be reserved for verified circuits and audited proof systems.
```

### Overclaim

```text
Every country has a country-specific official postal validation API.
```

### Safer rewrite

```text
The current repository classifies all covered regions by official-source status
and has no remaining `needs-official-source` regions in the coverage report.
Some regions still rely on global official fallback sources or no-normal-
postcode handling rather than country-specific validation APIs.
```

### Overclaim

```text
The quality score proves that an address is correct.
```

### Safer rewrite

```text
The internal quality score is a routing and risk-control signal. It can decide
whether to show, hide, caution, or re-verify an address tab, but it is not a
standalone proof of real-world address correctness.
```

## Recommended Placement in the Paper

The verified resume material should be placed in three locations.

### Introduction

Use the three-layer separation and the main problem statement:

```text
AMT studies address identity as entity reference, separating maps, address
expressions, and identifiers.
```

### Main theorem chapter

Place the Lean-backed limitation first:

```text
No condition-free perfect resolver exists under non-injective observation.
```

Then state the conditional positive result:

```text
Under finite candidate generation, candidate soundness, sufficient evidence,
and deterministic tie-breaking, AMT can select a best cluster or abstain.
```

### Implementation and validation chapter

Place:

- AMT resolver tests;
- PID audit envelope tests;
- AMN public envelope tests;
- address quality and address verification policy tests;
- natural-feature address rendering tests;
- official postal-source coverage and health reports;
- ZK proof-bundle compatibility tests;
- GIS validation report;
- known warnings and limitations.

This avoids mixing formal proof, empirical GIS validation, and product claims
as if they had the same certainty level.

## Proposed English Abstract

Address Morphism Theory (AMT) models an address as a reference to an entity
rather than as a string or a coordinate. The theory separates maps, address
expressions, and identifiers, then treats address resolution as an
evidence-scored process over finite candidates and bounded clusters. The current
formal core proves that no condition-free perfect resolver can exist when
distinct entities share the same observation, verifies candidate-bounded
outcome soundness, verifies that ambiguous and unresolved outcomes are
non-emitting abstention states, and verifies a certified gated resolution model
that permits emission only when candidate membership, score separation,
quality, freshness, and risk-budget conditions hold. Implementation tests verify bounded clustering,
evidence-consensus canonicalization, deterministic hash-based PID formation,
history-sensitive selection, internal address quality routing, official-source
coverage classification, natural-feature address rendering, birthday-bound PID
collision-risk budgeting, and safe abstention under weak or near-tied evidence.
ZK compatibility tests verify proof-bundle envelope safeguards, but not complete
cryptographic ZK circuits. GIS validation confirms machine-readable boundary
exports with zero hard geometry errors in the current validator, while strict
GIS validation does not yet pass because warnings remain for manual review; a
free warning-budget ratchet now makes those warnings continuously checkable.
AMT should therefore be presented as a conditional, verifiable address-reference
framework, not as an unconditional guarantee that all real-world addresses can
always be uniquely resolved.

## Next Validation Plan

The next verification work should be:

1. Connect the production score, quality, freshness, and risk code paths to the
   Lean certified gated resolution predicate.
2. Prove a stronger conditional optimality theorem over finite nonempty
   clusters with deterministic tie-breaking assumptions.
3. Add PID duplicate monitoring and fallback behavior for the rare case where a
   risk-budgeted hash collision is detected operationally.
4. Reduce GIS warning budgets and run strict GIS validation after fixes.
5. Add global distortion and sampling reports for AGID grid geometry.
6. Convert commitment-based audit envelopes into actual ZK circuits only after
   the circuit language and trusted setup model are selected.
7. Add regression datasets for rural, island, mountain, desert, polar,
   no-postal-code, disputed, and natural-feature cases.
8. Add live-probe validation for postal APIs where terms of service and rate
   limits allow it.

## One-Sentence Resume

AMT is a verified-by-stages address-reference framework: it cannot promise
condition-free perfect resolution, but it can safely combine candidate
generation, bounded clustering, evidence scoring, history, certified gated
resolution, abstention, PID issuance, PID collision-risk budgeting, internal quality routing,
official-source coverage classification, natural-feature address rendering, GIS
validation, warning-budget ratcheting, and privacy-preserving audit envelopes
under explicit assumptions.
