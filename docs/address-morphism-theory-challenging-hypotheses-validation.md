# Address Morphism Theory Challenging Hypotheses Validation

Generated: 2026-06-06

This note validates challenging hypotheses for Address Morphism Theory (AMT)
one by one. The goal is not to make every hypothesis pass. The goal is to
separate:

```text
proved mathematical facts
implemented and tested behavior
empirical GIS or data checks
open conjectures
rejected overclaims
```

The safest paper style is to keep ambitious hypotheses, but rewrite them as
conditional claims when formal or empirical validation shows a boundary.

## Verification Commands

The following commands were run from the repository root:

```text
lean formal\AMTCore.lean
npx tsx --test src\lib\addressMorphism.test.ts src\lib\placeSearchLanguage.test.ts src\lib\naturalAddress.test.ts src\lib\mapFeatureAddress.test.ts src\lib\pidIssuanceAudit.test.ts src\lib\privateAddressPredicateProof.test.ts
npm run verify:gis
npm run verify:gis:budget
npm run verify:gis:strict
npm run verify:pid-risk
npm run verify:postal-sources
```

Observed results:

```text
Lean: passed
Targeted implementation tests: 44 passed, 0 failed
GIS normal validation: 351 features, 0 errors, 149 warnings, GDAL ok
GIS warning budget: passed, 149/149 warnings, 408/408 registered sources
GIS strict validation: failed because 149 warnings remain
PID collision risk: passed, 128 hash bits, 1e12 max issued, birthday upper bound about 1.47e-15
Postal source static check: passed, 281 address format files, 408 registered open-source ids, 89 unique postal APIs, 201 probe targets, 0 static issues
```

## Hypothesis 1: A Condition-Free Perfect Address Resolver Can Exist

### Claim Under Test

AMT might be able to resolve every observable address expression to exactly one
correct entity without any conditions.

### Verification Method

Lean formalization:

```text
no_condition_free_perfect_resolver
```

The theorem assumes two distinct entities produce the same observable address.
It then proves that no total resolver can be correct for both entities.

### Result

Rejected as an absolute hypothesis.

The negative theorem passed in Lean. If non-injective observation exists, a
condition-free perfect resolver is impossible. This means `ambiguous` and
`unresolved` are not engineering defects. They are required states.

### Paper Wording

Do not write:

```text
AMT resolves every address to a unique entity.
```

Write:

```text
AMT is a conditional address-reference framework. When the observation,
candidate set, evidence, freshness, quality, and risk gates are sufficient, it
may emit a resolved entity; otherwise it must emit ambiguous or unresolved.
```

## Hypothesis 2: Certified Gated Resolution Makes PID Emission Auditable

### Claim Under Test

A PID should only be issued after candidate generation, clustering, score
selection, quality, freshness, and risk gates have passed.

### Verification Method

Lean formalization:

```text
IssueAdmissible
issue_if_admissible_requires_conditions
issue_if_admissible_emits_candidate
missing_candidate_prevents_issue
high_energy_prevents_issue
low_margin_prevents_issue
low_quality_prevents_issue
stale_freshness_prevents_issue
high_risk_prevents_issue
```

Implementation tests:

```text
src\lib\pidIssuanceAudit.test.ts
```

### Result

Verified as an abstract safety theorem and supported by implementation tests.

Lean proves that emission implies the full admissibility certificate. It also
proves that each gate failure prevents emission. The implementation test suite
confirms that PID audit proofs cover candidate generation, clustering,
unresolved gates, history update, and PID issuance, and that unresolved results
or missing history witnesses reject proof creation.

### Limitation

Lean verifies the shape of the gate. It does not prove that every production
score, data source, or GIS boundary is empirically correct.

### Paper Wording

Write:

```text
The certified gate proves emission discipline: no PID-bearing resolved output
is emitted unless the declared gate predicates are satisfied.
```

Do not write:

```text
The gate proves the real-world address is globally correct.
```

## Hypothesis 3: Multilingual Search Can Be Identity-Stable Across Scripts

### Claim Under Test

If two expressions in different languages or scripts refer to the same place,
normalization can always preserve identity.

### Verification Method

Lean formalization:

```text
normalization_collision_prevents_perfect_resolution
```

Implementation tests:

```text
src\lib\placeSearchLanguage.test.ts
src\lib\addressMorphism.test.ts
```

### Result

Partially supported, but not as an unconditional theorem.

The implementation supports language-independent place search, script detection,
provider hints, native aliases, and accent-folded variants. It also clusters
Japanese and English variants of Tokyo Station as close candidates.

However, Lean proves that if normalization collapses two distinct entities into
the same normalized observation, no resolver over normalized observations can be
perfect for both. Therefore multilingual normalization improves recall but
cannot guarantee identity by itself.

### Paper Wording

Write:

```text
Multilingual expansion is a recall layer. Identity is decided only after
candidate, structural, evidence, and gate checks.
```

Do not write:

```text
Language normalization preserves address identity unconditionally.
```

## Hypothesis 4: Structural Dissimilarity Should Not Be Treated as a Metric

### Claim Under Test

The structural comparison function can be treated as a conventional metric.

### Verification Method

Lean formalization:

```text
asymmetric_dissimilarity_not_symmetric
```

Implementation tests:

```text
src\lib\addressMorphism.test.ts
```

### Result

Rejected as a general metric claim, supported as a directed dissimilarity
model.

Lean proves the minimal fact: if a structural cost is asymmetric for any pair,
it cannot be symmetric. Address evidence can be asymmetric because source trust,
history direction, delivery evidence, and administrative transitions may be
directional.

The implementation tests confirm that bounded clustering symmetrizes directional
distance where needed and avoids unbounded transitive chaining across distant
candidates.

### Paper Wording

Write:

```text
AMT uses structural dissimilarity or directed cost. Metric assumptions are
optional special cases and must be stated separately.
```

Do not write:

```text
D_t is always a metric.
```

## Hypothesis 5: Natural Geography Can Be Treated as Address Referents

### Claim Under Test

Named rivers, waterfalls, lakes, islands, deserts, salt lakes, wetlands,
icefields, forests, caves, valleys, ruins, and heritage sites can be displayed
as address-like referents when postal or street address evidence is absent.

### Verification Method

Lean formalization:

```text
missing_entity_refutes_candidate_completeness
```

Implementation tests:

```text
src\lib\naturalAddress.test.ts
src\lib\mapFeatureAddress.test.ts
```

GIS checks:

```text
npm run verify:gis
npm run verify:gis:budget
npm run verify:gis:strict
```

### Result

Supported as a product and ontology extension; not verified as global complete
coverage.

Implementation tests confirm rendering and feature extraction for marine
features, mountains, lakes, rivers, waterfalls, islands, archipelagos, deserts,
desert-like sparse areas, wilderness, salt lakes, ice fields, roads, bridges,
parks, ruins, world heritage labels, water labels, and Overpass feature queries.

GIS normal validation has zero hard errors and GDAL readability is ok. The
warning budget passes. Strict GIS validation fails because 149 warnings remain.

Lean also proves the coverage boundary: if a real entity is missing from its
candidate set, candidate completeness is false. Therefore the paper must not
claim full natural-geography coverage until source coverage is measured and
warnings are reduced.

### Paper Wording

Write:

```text
AMT extends the referent ontology to named natural and cultural features. The
current implementation supports tested natural-feature rendering and GIS export
validation with zero hard errors, while strict global GIS quality remains open.
```

Do not write:

```text
AMT already recognizes every named natural feature in the world.
```

## Hypothesis 6: Temporal Lineage Can Be a Simple Function

### Claim Under Test

Address history can be modeled as a function from old entities to new entities.

### Verification Method

Lean formalization:

```text
functional_transition_cannot_represent_split
```

### Result

Rejected for split history.

Lean proves that a function from a past entity to a future entity cannot
represent a one-to-many split into two distinct future entities. This confirms
that temporal AMT needs a relation, multivalued map, or outcome-valued
transition for split and merge cases.

### Paper Wording

Write:

```text
Temporal address morphisms are relation-like or outcome-valued in the general
case. Functional transitions are valid only for rename or one-to-one persistence
subcases.
```

Do not write:

```text
Every address history is a function.
```

## Hypothesis 7: Vertical Reference Can Be Omitted

### Claim Under Test

Ground footprint or coordinate identity is enough; floors, units, entrances,
rooms, lockers, and indoor routes are optional details.

### Verification Method

Lean formalization:

```text
projection_collision_prevents_vertical_resolution
```

Repository scan:

```text
rg -n "vertical|floor|unit|locker|entrance|3D|three" src docs formal
```

### Result

Rejected as an ontology claim; implementation is partial.

Lean proves that if two vertical referents share the same ground projection, a
resolver that sees only the ground projection cannot correctly recover both.
This formally supports Chapter 16's vertical reference layer.

The repository has privacy rules for unit, room, floor, entrance, and AOID
payload boundaries, plus some route and entrance logic, but the full vertical
reference fiber model is not yet implemented as a complete AMT resolver layer.

### Paper Wording

Write:

```text
Vertical reference is mathematically necessary when different referents share a
ground projection. The current system treats vertical and unit data as
privacy-sensitive and partially modeled; complete vertical resolution remains a
future implementation target.
```

Do not write:

```text
Coordinates alone are sufficient for all real-world delivery or property
identity.
```

## Hypothesis 8: Direct String-to-PID Issuance Is Safe

### Claim Under Test

A PID can be safely minted directly from an address string or normalized
observation.

### Verification Method

Lean formalization:

```text
observation_based_pid_collides_on_same_observation
injective_pid_has_no_collision
```

PID risk check:

```text
npm run verify:pid-risk
```

### Result

Rejected for direct observation-based issuance; supported for gated,
entity-level issuance with collision-risk budgeting.

Lean proves that if two distinct entities have the same observation, any PID
that is a pure function of that observation collides for those entities. Lean
also proves collision-freedom only for an injective entity-level PID assignment.

The implementation's bounded hash risk check passes for 128-bit hashes with a
maximum issued budget of 1e12, giving an upper bound of about 1.47e-15. This is
a collision-risk budget, not a mathematical injectivity proof.

### Paper Wording

Write:

```text
PID issuance must be gated and entity-level. Bounded hash PIDs require explicit
collision-risk budgets.
```

Do not write:

```text
Hashing an address string creates a globally unique address identity.
```

## Hypothesis 9: Private Address Predicates Can Be Proved Without Revealing the Address

### Claim Under Test

AMT can expose claims such as delivery-region membership, country residence,
city residence, same-address residence, freshness, or ownership without
revealing the private address.

### Verification Method

Lean formalization:

```text
predicate_proof_collision_hides_private_value
```

Implementation tests:

```text
src\lib\privateAddressPredicateProof.test.ts
```

### Result

Supported as a proof-envelope feature; not yet a universal cryptographic ZK
circuit theorem.

Lean proves the minimal privacy shape: if a public predicate maps multiple
private values to the same public claim, the public claim alone cannot identify
the private value. Implementation tests confirm delivery and residence predicate
proofs without exposing the address, stable same-address commitments only in
the same group context, rejection when the hidden address does not satisfy the
target, rejection of unstripped private material during verification, and
composition with public proof bundles.

### Limitation

The current implementation should be described as a privacy-preserving proof
envelope and compatibility model unless full cryptographic ZK circuits are
implemented and audited.

### Paper Wording

Write:

```text
Private address predicate proofs can expose limited claims while hiding raw
address material. The current implementation validates proof-envelope behavior;
full ZK circuit soundness is future work unless separately implemented.
```

Do not write:

```text
All privacy claims are already proven by production-grade ZK circuits.
```

## Overall Validation Verdict

The strongest verified shape of AMT is not an absolute resolver. It is a
conditional, candidate-bounded, evidence-gated, abstention-capable address
reference framework.

The challenging hypotheses improved the paper because several overclaims were
converted into stronger and safer statements:

```text
absolute perfect resolution -> impossible under non-injective observation
unconditional language stability -> recall layer plus gate checks
metric structural distance -> directed dissimilarity with bounded clustering
complete natural feature coverage -> supported extension with open coverage
functional temporal history -> relation/outcome transition
coordinate-only identity -> vertical reference required when projection collides
string-to-PID identity -> gated entity-level PID plus risk budget
privacy proof claims -> proof envelope now, full ZK circuit later
```

## Recommended Paper Changes

1. Add a "Challenging Hypotheses and Counterexamples" subsection near the end
   of Chapter 13.
2. Move the natural-geography coverage limitation to Chapter 15 and Appendix C.
3. Move the vertical projection theorem to Chapter 16.
4. Treat multilingual search as candidate expansion in Chapter 6, not as an
   identity-preserving theorem.
5. Treat PID issuance as gated entity-level issuance in Chapter 13 and Chapter
   14.
6. Treat private address predicates as implementation-level proof envelopes
   until cryptographic ZK circuits are implemented and audited.
