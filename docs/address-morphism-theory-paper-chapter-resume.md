# Address Morphism Theory Paper Chapter Resume

Generated: 2026-06-06
Reviewed: 2026-06-07

Status: core English paper resume. This document defines the compact
16-chapter structure for a journal-style or conference-style paper. For the
expanded 21-chapter Japanese theory/book structure, use
`docs/address-morphism-theory-expanded-japanese-chapter-resume.md`.

## Recommended Chapter Count

Address Morphism Theory should be organized into **16 core chapters**, plus
appendices for formal verification, implementation tests, GIS validation,
source coverage, and reproducible commands.

The current manuscript already follows a strong 16-chapter structure. This
resume keeps that structure because it separates the theory into a clean
progression:

```text
problem frame
-> related work
-> central claim
-> ontology
-> axioms
-> candidate generation
-> clustering
-> finite estimation
-> temporal history
-> probability
-> decision
-> integrated morphisms
-> main theorems
-> implementation and validation
-> natural geography
-> vertical reference
```

This order is preferable to a shorter paper because AMT combines formal
mathematics, address ontology, practical algorithms, privacy boundaries, GIS
validation, and natural-geography extensions. Compressing these topics would
make the strongest claims look less carefully bounded. The paper should be
ambitious, but its claims should remain conditional and verifiable.

## Mathematical Model and Commutative Diagram Pack

The resume should include a compact mathematical model before the chapter
summaries, then reuse it chapter by chapter. The model should be written as a
conditional framework, not as a claim of universal address solvability.

### Core Objects

Use the following objects throughout the paper:

```text
T                 time index set
E_t               address-referent entities at time t
A_t               observable address expressions at time t
G_t               geometric and GIS evidence space at time t
S_t               source evidence space at time t
H_t               historical evidence state at time t
C_t(a)            finite candidate set generated from observation a
P_t               persistent identifier space at time t
O(E_t)            resolution outcomes over E_t
```

The resolution outcome space is not only a set of entities. It must contain
safe abstention states:

```text
O(E_t) = resolved(E_t) + ambiguous + unresolved
```

This is not an implementation detail. It follows from the Lean-verified
negative result: if two distinct entities can produce the same observable
address, no condition-free total resolver can be correct for both. Therefore
`ambiguous` and `unresolved` are mathematically necessary states.

### Core Morphism Chain

The main computational structure should be written as a composition:

```text
A_t --N_t--> A_t^norm --K_t--> Fin(E_t) --Q_t--> Part(E_t)
    --B_t--> Score_t --Delta_t--> O(E_t) --I_t--> P_t + abstain
```

Where:

```text
N_t       normalizes and parses an address expression
K_t       generates a finite candidate set
Q_t       builds a bounded cluster or partition
B_t       evaluates evidence, history, quality, freshness, and risk
Delta_t   emits resolved / ambiguous / unresolved
I_t       issues a PID only for admissible resolved outputs
```

The total AMT resolver is the partial composite:

```text
R_t = I_t o Delta_t o B_t o Q_t o K_t o N_t
```

This notation should be used carefully. `R_t` is partial with respect to PID
issuance because non-admissible cases must abstain.

### Admissibility Predicate

Chapter 13 should present the certified emission gate as a predicate:

```text
IssueAdmissible_t(c, e) :=
  e in C_t(a)
  and ScoreSelectable(bestEnergy, secondEnergy, threshold, margin)
  and qualityThreshold <= qualityScore
  and freshnessAge <= freshnessLimit
  and riskScore <= riskLimit
```

The Lean model verifies the important shape of this rule:

```text
emission implies admissibility
emission implies candidate membership
missing candidate prevents emission
high energy prevents emission
low margin prevents emission
low quality prevents emission
stale freshness prevents emission
high risk prevents emission
```

The paper should say that this proves the gate discipline, not the empirical
truth of every real-world address decision.

### Structural Dissimilarity Model

Chapters 7 and 8 should define a typed structural dissimilarity:

```text
D_t(e_i, e_j) =
  w_geo   d_geo(e_i, e_j)
  + w_admin d_admin(e_i, e_j)
  + w_attr  d_attr(e_i, e_j)
  + w_kind  d_kind(e_i, e_j)
  + w_hist  d_hist(e_i, e_j)
```

The function may be asymmetric when source reliability, direction of
historical transition, or delivery evidence is asymmetric:

```text
D_t(e_i, e_j) != D_t(e_j, e_i)
```

For clustering, the paper should not require metric-space assumptions unless
they are explicitly proved. It is safer to call this a structural
dissimilarity or directed cost, then define clusters by thresholded reachability
or admissible linkage.

### Temporal Model

Chapter 9 should model address history as a transition system:

```text
tau_{t,u}: E_t -> O(E_u)
```

This map may be partial or multivalued in practice because entities can split,
merge, disappear, or be renamed. A persistent identifier should therefore refer
to an entity lineage, not only a single time-slice entity:

```text
RPID(e_t) = lineage commitment for {e_t, tau_{t,u}(e_t), ...}
```

The model should preserve the distinction between:

```text
rename          expression changes, entity persists
split           one entity becomes multiple entities
merge           multiple entities become one entity
retire          entity no longer has an active referent
reassign        expression is reused for a different entity
```

### Probability and Decision Model

Chapters 10 and 11 should define a score as a calibrated energy or posterior
surrogate:

```text
E_t(e | a, h, s) = structural_cost + source_penalty + history_penalty
                 + freshness_penalty + risk_penalty
```

Decision is made only when the best candidate is both low enough and separated
enough:

```text
best = argmin_e E_t(e | a, h, s)

Delta_t(a) =
  resolved(best)  if E(best) <= theta and E(second) - E(best) >= gamma
  ambiguous       if separation is insufficient
  unresolved      if coverage, quality, freshness, or risk gates fail
```

This aligns the mathematical model with the implementation policy: weak
evidence should not force a PID.

### Natural Geography Extension

Chapter 15 should extend the entity ontology beyond postal and building
addresses:

```text
NaturalEntity_t =
  river + waterfall + lake + pond + wetland + glacier + icefield
  + island + desert + salt_flat + grassland + forest + mountain
  + valley + cave + heritage_site + ruin + protected_area
```

Natural features should enter AMT as named referents with geometry, containment
relations, and source quality. They should not be forced into postal-address
form when no postal structure exists. The resolver may output a descriptive
address label, a natural-feature identifier, or an unresolved state.

### Vertical Reference Model

Chapter 16 should treat vertical reference as a fiber over a ground referent:

```text
V(e) = floors + rooms + entrances + lockers + units + subspaces
E_t^3D = {(e, v) | e in E_t, v in V(e)}
```

The vertical layer is not a cosmetic extension. It is necessary whenever two
referents share a footprint but differ by floor, unit, entrance, route, or
delivery access.

### Main Commutative Diagrams

The paper should include the following diagram set. Each diagram should state
its assumptions. If the assumptions fail, the intended output is not forced
commutativity; the intended output is `ambiguous` or `unresolved`.

#### Diagram 1: Core Resolution Chain

```latex
\begin{tikzcd}
A_t \arrow[r, "N_t"] \arrow[rrrrrr, bend left=20, "R_t"]
  & A_t^{norm} \arrow[r, "K_t"]
  & Fin(E_t) \arrow[r, "Q_t"]
  & Part(E_t) \arrow[r, "B_t"]
  & Score_t \arrow[r, "\Delta_t"]
  & O(E_t) \arrow[r, "I_t"]
  & P_t + abstain
\end{tikzcd}
```

Meaning: direct resolution is only the named composite of the intermediate
morphisms. The diagram commutes by definition of `R_t`, provided each internal
map is defined for the observation.

#### Diagram 2: Language and Script Stability

```latex
\begin{tikzcd}
A_t^{lang1} \arrow[r, "N_t^{lang1}"] \arrow[d, "\ell"']
  & A_t^{norm} \arrow[r, "K_t"]
  & Fin(E_t) \arrow[r, "Q_t"]
  & Part(E_t) \\
A_t^{lang2} \arrow[r, "N_t^{lang2}"']
  & A_t^{norm} \arrow[ur, "K_t"']
  &
  &
\end{tikzcd}
```

Meaning: language conversion should preserve the selected cluster only when
normalization and source coverage are compatible. This is a target property for
multilingual search, not an unconditional theorem.

#### Diagram 3: Temporal Naturality

```latex
\begin{tikzcd}
A_t \arrow[r, "R_t"] \arrow[d, "rename_{t,u}"']
  & O(E_t) \arrow[d, "\tau_{t,u}"] \arrow[r, "RPID_t"]
  & P \arrow[d, "id_P"] \\
A_u \arrow[r, "R_u"']
  & O(E_u) \arrow[r, "RPID_u"']
  & P
\end{tikzcd}
```

Meaning: a historical rename should preserve the lineage identifier when the
underlying entity persists. The square does not commute for split, merge,
retirement, or reassignment unless extra lineage rules are supplied.

#### Diagram 4: Candidate Soundness and Emission

```latex
\begin{tikzcd}
A_t \arrow[r, "K_t"] \arrow[dr, "\Delta_t"']
  & Fin(E_t) \arrow[d, "IssueAdmissible_t"] \\
  & O(E_t)
\end{tikzcd}
```

Meaning: any emitted entity must be contained in the generated candidate set.
This is one of the Lean-verified safety properties of the certified gate.

#### Diagram 5: PID Issuance Gate

```latex
\begin{tikzcd}
E_t \arrow[r, "pid_t"] \arrow[d, "admissible?"']
  & P_t \\
O(E_t) \arrow[ur, "I_t"']
  &
\end{tikzcd}
```

Meaning: PID issuance is allowed only after the entity has passed through the
resolution outcome and admissibility gate. The paper should avoid any diagram
that suggests raw strings can directly mint authoritative PIDs.

#### Diagram 6: Vertical Reference Fiber

```latex
\begin{tikzcd}
E_t^{3D} \arrow[r, "project"] \arrow[d, "route"']
  & E_t \arrow[d, "ground\_access"] \\
Route_t^{3D} \arrow[r, "forget\_vertical"']
  & Route_t
\end{tikzcd}
```

Meaning: forgetting vertical information should preserve the ground referent,
but not necessarily the deliverable route. This justifies a separate vertical
reference layer.

#### Diagram 7: Privacy-Preserving Proof Envelope

```latex
\begin{tikzcd}
private\ address \arrow[r, "commit"] \arrow[d, "AMT\ gates"']
  & commitment \arrow[d, "ZK\ proof"] \\
private\ decision\ trace \arrow[r, "public\ proof"']
  & verified\ claim
\end{tikzcd}
```

Meaning: ZK proofs can expose limited claims such as residence region, delivery
eligibility, freshness, threshold satisfaction, or ownership without revealing
the raw address. This diagram belongs in the implementation and privacy
sections, not as a replacement for the AMT resolver itself.

### Chapter Placement Map

The mathematical material should be distributed as follows:

```text
Chapter 1      non-injective observation problem and abstention states
Chapter 3      core morphism chain and partial resolver
Chapter 4      entity, expression, geometry, source, and identifier spaces
Chapter 5      axioms for finite candidates, abstention, quality, and history
Chapter 6      N_t, K_t, candidate generation, and multilingual normalization
Chapter 7      D_t and thresholded cluster construction
Chapter 8      finite estimation over candidate clusters
Chapter 9      temporal transition maps and lineage identifiers
Chapter 10     probabilistic / energy scoring model
Chapter 11     decision gate and score separation rule
Chapter 12     full commutative diagram set
Chapter 13     Lean-verified theorems and conditional main theorem
Chapter 14     implementation mapping and audit trace
Chapter 15     natural-geography entity extension
Chapter 16     vertical reference fiber model
Appendix A     Lean statements and proof names
Appendix C     GIS validation and empirical counterexample handling
```

## Chapter 1: Introduction

### Purpose

Chapter 1 should define the central problem: addresses are not reliable digital
identifiers when treated as strings or coordinates. The chapter should introduce
the separation between maps, address expressions, and identifiers, then state
the AMT hypothesis that an address is a reference to an entity.

### Core Resume

Address Morphism Theory begins from a practical failure in modern digital
systems. People repeatedly enter the same address into commerce, logistics,
registration, and identity workflows, yet the address remains ambiguous,
language-dependent, institution-dependent, and time-dependent. Conventional
systems reduce addresses either to normalized strings, postal regions, or
coordinates. Each reduction loses some essential information. A coordinate may
locate a point but cannot by itself define which social or physical entity is
being referred to. A string may be meaningful to humans but may not be unique,
stable, or complete.

The chapter should therefore introduce AMT as a theory of address reference.
Its starting hypothesis is that an address is neither a string nor a coordinate;
it is a reference to a spatial or social entity under a context, a time, and a
set of institutional conventions. The correct computational question is not
"Can this text be normalized?" but "Which entity, if any, is safely identified
by this observation under the available evidence?"

The introduction should also state the main limitation early. AMT does not
claim that every input can always be resolved. If evidence is weak, tied, stale,
or outside the candidate set, the correct output may be ambiguous or
unresolved. This safety posture is central to the theory.

### What to Claim Safely

AMT can be introduced as a conditional address-reference framework. It can
select an entity only under explicit assumptions about candidate coverage,
evidence, separation, quality, freshness, and risk. It should not be described
as a universal perfect resolver.

### Revision Notes

The chapter should keep the three-layer distinction:

```text
map -> spatial model
address -> human/institutional expression
identifier -> stable entity reference
```

The main claim should be rewritten so that ambiguous and unresolved are treated
as correct safety outputs, not as failures.

## Chapter 2: Related Work

### Purpose

Chapter 2 should explain why existing approaches are useful but incomplete. It
should compare address normalization, geocoding, postal codes, place IDs,
entity resolution, geographic ontology, and decentralized identifiers.

### Core Resume

Existing address technologies solve parts of the address problem, but none of
them fully define address identity. Address normalization maps a string to a
standardized string, but it can lose the true referent if the normalized form is
wrong or incomplete. Geocoding maps a string to a coordinate, but coordinates do
not encode the social, administrative, temporal, or vertical identity of an
entity. Postal codes organize delivery regions, but they are not universal
entity identifiers and vary greatly by country. Place IDs and coordinate codes
identify map objects or locations, but they do not by themselves resolve
multilingual, historical, or institution-dependent address expressions.

Entity resolution is closer to AMT because it recognizes that multiple
expressions can refer to the same object. However, general entity resolution
does not provide a domain-specific model for address identity, temporal address
change, delivery evidence, postal-source quality, natural geography, or
vertical reference. Geographic ontology provides classifications and spatial
relations, but it does not by itself turn ambiguous address input into a safe
candidate-bounded decision process. Decentralized identifiers define identifier
syntax and document resolution, but they do not derive the identity of a
physical or social address entity.

AMT should be positioned as a synthesis that uses these technologies as
evidence layers while adding its own identity model. Its novelty is not that it
replaces geocoding, postal sources, or ontology. Its novelty is that it treats
them as inputs to a conditional, auditable resolution process.

### What to Claim Safely

It is safe to claim that existing technologies do not, by themselves, provide a
complete theory of address identity. It is not safe to claim that AMT already
outperforms every commercial address validation provider globally.

### Revision Notes

The comparison table should distinguish "useful evidence" from "identity
definition." Many existing tools can improve AMT, but they should not be
presented as equivalent to AMT.

## Chapter 3: Central Claim

### Purpose

Chapter 3 should state the central mathematical claim in its safest form:
address reference can be modeled as a finite, candidate-bounded, evidence-scored
partial resolution process.

### Core Resume

The central claim of AMT is that address resolution can be formulated as a
morphism chain from ambiguous observation to finite candidates, then to bounded
clusters, then to a conditional decision, and finally to an identifier when the
decision is admissible. The claim is conditional. It depends on finite candidate
generation, a structural comparison function, bounded clustering, evidence
evaluation, deterministic tie-handling, and safe abstention states.

The chapter should define the minimal model:

```text
ambiguous input
-> normalized candidate set
-> structural comparison
-> bounded cluster
-> evidence and history score
-> resolved / ambiguous / unresolved
-> PID only if emission is admissible
```

The chapter should emphasize that AMT does not assert unconditional uniqueness.
When two different entities share the same observation, no total resolver can
be correct for both. This is now formally verified in Lean. Therefore the
central positive claim is not "AMT always resolves addresses"; it is "AMT gives
a structured way to resolve when conditions are sufficient and abstain when
they are not."

This chapter should also separate proof targets from engineering hypotheses.
Formal theorems can prove impossibility, candidate containment, gate shape, and
injective PID uniqueness. Production accuracy still depends on data quality,
source coverage, scoring calibration, and GIS quality.

### What to Claim Safely

The chapter can safely claim conditional computability over finite candidates.
It should avoid any wording that implies universal real-world correctness.

### Revision Notes

The central claim should explicitly include `ambiguous` and `unresolved` as
part of the model. These are necessary outputs under non-injective observation.

## Chapter 4: Address Ontology and Mathematical Structure

### Purpose

Chapter 4 should define what kinds of things addresses refer to and how those
referents should be represented mathematically.

### Core Resume

AMT needs an ontology because addresses do not refer only to simple points.
They may refer to buildings, land parcels, rooms, entrances, delivery lockers,
roads, bridges, stations, parks, rivers, lakes, islands, mountains, facilities,
temporary shelters, or social institutions. Some referents are physical, some
administrative, some social, and some virtual. A usable theory must model this
heterogeneity without collapsing everything into coordinates.

The chapter should define the entity set as time-dependent. An entity may
persist, split, merge, disappear, be renamed, or move between administrative
systems. Address identity is therefore not just equality of strings or equality
of coordinates. It is a structured relation between observations and entities
under time, context, and evidence.

The chapter should also define address expressions separately from address
entities. Multiple expressions may refer to the same entity, and the same
expression may be ambiguous between entities. This is the ontological source of
the non-injective observation problem later verified in Lean.

Finally, the chapter should define identifiers as outputs of a resolution
process, not as the same thing as the address string. A PID or RPID should be
understood as a reference handle for an entity or entity history, not as proof
that the raw input was globally unique.

### What to Claim Safely

It is safe to claim that AMT separates address expressions, entities, and
identifiers. It is not safe to claim that the ontology already enumerates every
possible real-world address referent.

### Revision Notes

The ontology should explicitly include natural and vertical entities, but it
should mark their global coverage as an implementation and data-quality task.

## Chapter 5: Axioms

### Purpose

Chapter 5 should state the minimum assumptions under which AMT can operate.
The axioms should be presented as conditions, not as universal truths about the
world.

### Core Resume

AMT depends on a small set of operational assumptions. The theory requires an
observable input space, an entity space, a candidate generator, a structural
comparison relation, a clustering rule, an evidence function, and a decision
rule that can abstain. These assumptions should be stated plainly because they
define the boundary between mathematical proof and empirical implementation.

The key axiom is finite candidate generation. For a given input and context,
the system must produce a finite set of candidates. This does not mean the
candidate set is always complete; it means the decision process is defined only
over the generated candidates. Candidate completeness is a stronger condition
and must be treated as an assumption or an empirical quality target.

Another essential axiom is safe abstention. The resolver must be able to return
ambiguous or unresolved when the evidence is insufficient. Without abstention,
the system would be forced to emit false uniqueness in cases where observations
are non-injective.

The chapter should also include assumptions about temporal updates, source
trust, and context-specific decision thresholds. These should be written as
configurable conditions rather than absolute laws.

### What to Claim Safely

It is safe to claim that AMT is well-defined under its axioms. It is not safe to
claim that the axioms are always satisfied by every real-world address dataset.

### Revision Notes

The axioms should be aligned with the verified Lean predicates: candidate
soundness, resolution outcomes, score gates, certified gated resolution, and
injective theoretical PID.

## Chapter 6: Normalization Morphism and Candidate Generation

### Purpose

Chapter 6 should define how ambiguous input becomes a finite set of candidates.
It should distinguish AMT from ordinary normalization.

### Core Resume

Traditional address normalization usually tries to produce one standardized
string. AMT should instead treat normalization as candidate expansion. The
normalization morphism maps an ambiguous observation into a finite candidate
set that may contain multiple plausible interpretations. This design prevents
early loss of the true referent when the first normalization choice is wrong.

Candidate generation should be multilingual, script-aware, postal-aware,
geography-aware, and context-aware. It may use official address formats,
postal-code metadata, open geodata, romanization, transliteration, building
names, natural-feature names, administrative hierarchy, and historical aliases.
However, each source should be treated as evidence, not as unquestionable
truth.

The chapter should explain that candidate generation is the main recall
boundary of AMT. If the true entity is not in the candidate set, no later
clustering or scoring theorem can recover it. This is why candidate coverage
must be measured, tested, and improved over time.

The chapter should also include a safe treatment of search language. Place
search should accept many languages and scripts, while remaining separate from
the user's app language and the final address display language.

### What to Claim Safely

It is safe to claim that AMT candidate generation can combine many evidence
sources. It is not safe to claim that current candidate generation has complete
worldwide recall.

### Revision Notes

This chapter should include the strongest product direction: language-flexible
search, country-specific address rules, and natural-feature candidate
generation should be separate subsystems.

## Chapter 7: Structural Dissimilarity and Cluster Construction

### Purpose

Chapter 7 should define how candidates are compared and clustered without
pretending that every comparison is a true mathematical metric.

### Core Resume

AMT compares candidates using structural dissimilarity rather than simple
string distance. Structural dissimilarity may combine location, administrative
hierarchy, address tokens, source type, entity type, vertical attributes,
delivery evidence, and context. This lets the system recognize that two
different strings may refer to the same entity, while also preventing unrelated
entities with similar text from being merged too easily.

The chapter should be careful with terminology. The implemented structural
dissimilarity should not be called a full metric unless it satisfies all metric
properties. It is safer to call it a directed or symmetric dissimilarity
function, depending on the exact construction. Tests already verify that the
implementation treats directional distance carefully by using symmetric
dissimilarity for bounded clustering.

Cluster construction should be bounded. A naive transitive closure can merge a
long chain of near-neighbor candidates into a cluster whose endpoints are far
apart. AMT should instead define cluster boundaries that reduce transitive
over-merge risk. Bounded clustering is one of the theory's practical safety
features.

### What to Claim Safely

It is safe to claim that bounded clustering reduces over-merge risk. It is not
safe to claim that clustering always reconstructs the true real-world entity.

### Revision Notes

The chapter should explicitly separate structural similarity from proof of
identity. Similarity is evidence; identity is emitted only after decision gates
are satisfied.

## Chapter 8: Candidate Clusters and Finite Estimation

### Purpose

Chapter 8 should show why AMT turns address resolution into a finite estimation
problem and how that makes computation possible.

### Core Resume

Once candidate generation and clustering are complete, AMT works over a finite
set of candidate clusters. This is a major shift from trying to solve address
identity over the entire world at once. The decision problem becomes local and
bounded: given an observation, a context, and a finite candidate cluster set,
select a best cluster if the evidence is strong enough, or abstain.

The chapter should define cluster-level evidence. Evidence can come from
source trust, postal agreement, administrative hierarchy, geographic proximity,
building evidence, natural-feature evidence, historical records, delivery
success, and negative delivery outcomes. The chapter should also explain that
canonical cluster fields should be chosen by evidence consensus rather than by
longest label or raw string dominance. This is supported by implementation
tests.

Finite estimation also gives AMT its auditability. The system can record which
candidates were generated, how they were clustered, what evidence was used,
and why the output was verified, partial, ambiguous, or unresolved. This makes
PID issuance reviewable without exposing private raw address material.

### What to Claim Safely

It is safe to claim that finite candidates make the AMT decision process
computable and auditable. It is not safe to claim that finite estimation proves
candidate completeness.

### Revision Notes

This chapter should prepare the reader for the implementation audit envelope in
Chapter 14 and the certified gated resolution theorem in Chapter 13.

## Chapter 9: History and Temporal Structure

### Purpose

Chapter 9 should model address change over time: renaming, administrative
change, building lifecycle, split, merge, disappearance, and historical aliases.

### Core Resume

Addresses are temporal objects. A street may be renamed, a municipality may
merge, a building may be demolished, a parcel may split, a postal rule may
change, and a natural feature may shift or be reclassified. AMT therefore needs
a history layer that separates current expression from persistent reference.

This chapter should define temporal entity states, transition records, and
history-sensitive identifiers. A PID may refer to a present resolved entity,
while an RPID can represent a persistent reference across controlled temporal
changes. The exact implementation may vary, but the theory should make clear
that address identity is not frozen at one timestamp.

Delivery and verification history should be treated as evidence, not as
absolute truth. Positive delivery outcomes strengthen a candidate, while
negative outcomes weaken it or trigger unresolved review. However, delivery
evidence can be context-dependent: a failed delivery may be caused by access
rules, weather, temporary closure, disaster, or carrier restrictions rather
than wrong identity.

The chapter should also support merge and split reasoning. If two identifiers
later become known to refer to the same entity, the system needs a merge
history. If one entity is divided into multiple valid referents, the system
needs a split history.

### What to Claim Safely

It is safe to claim that AMT can model temporal address transitions. It is not
safe to claim that history automatically reveals the true entity without data
quality and governance.

### Revision Notes

This chapter should connect to PID lifecycle proof, revocation/freshness proof,
and merge/split validity proofs, while keeping full cryptographic ZK claims out
of the core theorem unless circuits are implemented.

## Chapter 10: Probabilistic Model

### Purpose

Chapter 10 should quantify uncertainty. It should explain confidence, energy,
risk, entropy, and posterior-like scoring without overstating statistical
certainty.

### Core Resume

AMT operates under uncertainty. Candidate evidence may be incomplete,
conflicting, stale, or context-dependent. The probabilistic model should give a
structured way to rank candidates and measure when the system should abstain.

The chapter can define energy or negative evidence cost as a lower-is-better
quantity. The best candidate should not be selected merely because it has the
lowest energy; it should also pass a threshold and be sufficiently separated
from the second-best candidate. This is important because near ties are common
in real address data. Two buildings may share a name, two roads may have the
same local label, or one postal code may cover many locations.

Risk should be treated as a separate signal. Risk can come from weak evidence,
high entropy, stale data, low quality scores, unresolved natural geography,
privacy-sensitive vertical attributes, or hash collision budgets. The current
implementation also includes a PID collision-risk budget based on the birthday
bound for 128-bit derived hash PIDs.

The chapter should avoid implying that the probability model is already fully
calibrated globally. It should be presented as a formal decision layer that can
be calibrated and tested.

### What to Claim Safely

It is safe to claim that AMT can represent uncertainty and reject weak or tied
evidence. It is not safe to claim that the current scoring model is globally
calibrated.

### Revision Notes

This chapter should set up the score gate verified in Lean:

```text
bestEnergy <= threshold
bestEnergy + margin <= secondEnergy
```

## Chapter 11: Optimal Decision

### Purpose

Chapter 11 should define how AMT decides between verified, partial, ambiguous,
and unresolved outcomes.

### Core Resume

The optimal decision in AMT is not always a resolved identity. Sometimes the
optimal decision is to abstain. This is one of the most important conceptual
differences between AMT and ordinary geocoding. A system that always returns a
single best guess may look useful, but it can create false uniqueness. AMT
should instead optimize for safe emission.

The decision rule should combine candidate score, separation margin, evidence
strength, quality threshold, freshness, and risk budget. This creates a partial
resolver: the system emits a resolved entity only when the relevant gates pass.
Otherwise it returns ambiguous or unresolved.

Chapter 11 should introduce the practical meaning of the decision states:

```text
verified -> strong enough for PID issuance under policy
partial -> useful evidence exists, but not enough for full resolution
ambiguous -> multiple candidates are too close
unresolved -> evidence is missing, stale, risky, or outside policy
```

This chapter should also explain purpose-specific thresholds. A tourism search,
a delivery workflow, a legal registration workflow, and an emergency-response
workflow may require different confidence and privacy policies.

### What to Claim Safely

It is safe to claim that AMT decision can be purpose-specific and safety-gated.
It is not safe to claim that one global threshold works for all countries,
languages, use cases, and data sources.

### Revision Notes

Certified Gated Resolution can be discussed conceptually here, while its main
formal theorem should be stated in Chapter 13.

## Chapter 12: Integrated Structure and Commutative Diagrams

### Purpose

Chapter 12 should show how the morphism chain fits together. It should connect
normalization, clustering, history, scoring, decision, and identifier issuance.

### Core Resume

AMT is a composition of maps rather than a single function. The input address
does not jump directly to a PID. It passes through candidate generation,
structural comparison, clustering, evidence evaluation, history update,
decision, and finally identifier issuance if conditions permit.

Commutative diagrams can clarify which parts of the process should be stable
under changes of language, notation, time, and source. For example, two address
expressions in different scripts may normalize to different candidate strings
but still converge into the same cluster. A historical address and a current
address may differ as expressions while remaining connected through an RPID
history path.

The chapter should use diagrams carefully. A diagram should not imply that all
paths always commute in real data. Instead, it should specify the conditions
under which a diagram is expected to commute: sufficient source coverage,
stable entity history, compatible administrative hierarchy, and admissible
decision gates.

The integrated structure should also connect privacy. Raw inputs, private
history, and candidate labels should not be required on the public output
surface. Public envelopes should expose commitments, policy hashes, evidence
roots, workflow gates, and identifiers where appropriate.

### What to Claim Safely

It is safe to claim that AMT can be organized as a compositional morphism
chain. It is not safe to claim that every empirical data path commutes without
validation.

### Revision Notes

This chapter should help readers understand the full pipeline before the main
theorem chapter.

## Chapter 13: Main Theorems

### Purpose

Chapter 13 should collect the central formal results, explicitly separating
proved facts from empirical assumptions.

### Core Resume

The main theorem chapter should start with a negative theorem: no
condition-free perfect resolver exists under non-injective observation. If two
distinct entities produce the same observable address expression, a total
resolver that always emits one entity cannot be correct for both. This theorem
is the philosophical and mathematical center of AMT. It proves why ambiguous
and unresolved are necessary.

The chapter should then state the conditional positive theorem. Under finite
candidate generation, candidate soundness, structural clustering, sufficient
evidence, threshold separation, freshness, quality, risk budget, and deterministic
tie-handling, AMT can emit a resolved entity. If these conditions do not hold,
it should abstain.

The new Certified Gated Resolution model belongs here as a main theorem or
near-main theorem. It bundles candidate membership, score threshold, score
margin, quality threshold, freshness window, and risk budget into one
admissibility predicate. Lean verifies that emission implies the full
admissibility certificate, and that candidate absence, high energy, low margin,
low quality, stale freshness, or high risk prevents emission.

The chapter should also state PID uniqueness carefully. Theoretical PID
collision-freedom follows from an injective PID assignment. A finite hash-based
DPID is not injective by theorem and must be handled by collision-risk budgets.

### What to Claim Safely

It is safe to claim the Lean-verified formal core. It is not safe to claim
absolute correctness for all real-world inputs.

### Revision Notes

This chapter should include explicit "verified" and "requires assumption"
labels. That will make the paper much stronger.

## Chapter 14: Implementation Connection

### Purpose

Chapter 14 should connect the mathematical model to software, verification
commands, audit envelopes, GIS validation, postal-source coverage, and privacy.

### Core Resume

This chapter should explain how AMT becomes an implemented system. The
implementation should follow the same pipeline as the theory: input,
candidate generation, structural comparison, bounded clustering, evidence
consensus, history update, decision state, and PID issuance. The chapter should
also describe the verification layers currently available.

The formal layer is Lean. It verifies the impossibility of condition-free
perfect resolution, non-emitting ambiguous/unresolved states, candidate
containment, score gate shape, certified gated resolution, and injective
theoretical PID uniqueness.

The implementation-test layer verifies representative behavior around AMT
resolution, source evidence, bounded clustering, PID issuance audit, AMN public
envelopes, address quality, natural-feature rendering, official postal-source
coverage, and ZK proof-bundle compatibility.

The risk-budget layer verifies hash PID collision risk. The current 128-bit
derived PID budget for one trillion issued PIDs is below the configured risk
limit under the birthday bound.

The GIS layer verifies machine-readable boundary exports and zero hard errors
in the current validator, while warning budgets track unresolved GIS warnings.
Strict GIS validation does not yet pass because warnings remain.

The privacy layer should explain commitment-based audit envelopes. It should
not claim complete cryptographic ZK circuits unless those circuits are
implemented and audited.

### What to Claim Safely

It is safe to claim staged verification. It is not safe to merge formal proof,
implementation tests, and GIS validation into one absolute correctness claim.

### Revision Notes

This chapter should include a reproducible command appendix or refer to one.

## Chapter 15: Natural Geography, Terrain Manifolds, and State Compression

### Purpose

Chapter 15 should extend AMT beyond postal addresses and urban buildings. It
should include named natural features and terrain structures.

### Core Resume

Many important referents do not have ordinary postal addresses. Rivers, lakes,
waterfalls, islands, mountains, deserts, wetlands, grasslands, forests, ice
fields, glaciers, caves, valleys, ruins, world heritage sites, research
stations, and remote facilities may still need stable address-like reference.
AMT should treat these as first-class referents rather than forcing them into
urban postal formats.

This chapter should define natural-feature address representation as a
geo-semantic problem. A natural address may combine feature name, feature type,
coordinates or geometry, source evidence, administrative context, nearby human
settlements, and temporal stability. For example, a lake or river should be
recognized as a named geographic entity, not as a failed street address.

Terrain manifold ideas can help compress continuous geography into meaningful
units. However, these claims should be written carefully. The current
implementation tests cover representative natural-feature cases, but they do
not prove complete global recognition of every natural feature. Therefore the
chapter should distinguish the mathematical framework from current data
coverage.

The chapter should also explain why natural geography matters for islands,
mountain regions, deserts, polar areas, humanitarian logistics, field science,
disaster response, and infrastructure management.

### What to Claim Safely

It is safe to claim that AMT can model named natural features as address
referents. It is not safe to claim that every named natural feature worldwide
is already recognized.

### Revision Notes

This chapter should include a caution note: representative tests pass, global
coverage remains a data and validation task.

## Chapter 16: Vertical Reference Layer

### Purpose

Chapter 16 should show why two-dimensional address models are incomplete. It
should model floors, entrances, rooms, lockers, underground spaces, elevated
spaces, access paths, and reachability.

### Core Resume

Many address failures occur because horizontal coordinates are not enough. A
single coordinate can correspond to multiple floors, rooms, entrances,
buildings, delivery lockers, underground facilities, bridges, elevated
platforms, or restricted access areas. A two-dimensional model may identify the
right parcel or building footprint while still failing to identify the reachable
entity.

The vertical reference layer should not be reduced to a simple z-coordinate.
Real vertical reference includes floor naming, room numbering, entrance
systems, access permissions, indoor paths, locker identifiers, underground or
elevated infrastructure, and context-dependent reachability. A delivery
workflow, emergency workflow, tourism workflow, and land-registry workflow may
need different vertical information.

The chapter should define vertical candidate expansion, vertical dissimilarity,
vertical clusters, and reachability equivalence. It should also emphasize
privacy. Room number, floor, entrance, lockbox, route, and access permission
can be sensitive. Public identifiers should not reveal private vertical
attributes unless policy explicitly allows it.

The chapter should conclude that AMT becomes stronger when it treats address
reference as horizontal, vertical, temporal, contextual, and institutional. It
should also admit that vertical data is often incomplete and requires private
or permissioned sources.

### What to Claim Safely

It is safe to claim that vertical reference is necessary for many real-world
address referents. It is not safe to claim that public map data already
contains enough vertical information for complete global resolution.

### Revision Notes

This chapter should connect to ZK address proof, delivery eligibility proof,
and private address predicate proof, but full cryptographic claims should
remain outside the main theorem unless implemented.

## Recommended Appendices

The 16 chapters should be followed by appendices. These are not counted as core
chapters.

### Appendix A: Lean Formalization

Summarize the verified Lean core:

```text
no condition-free perfect resolver under non-injective observation
ambiguous and unresolved are non-emitting states
candidate-sound outputs are candidate-contained
score threshold and margin gates are checkable
certified gated resolution is checkable
injective theoretical PID has no collision
missing entity refutes candidate completeness
asymmetric dissimilarity is not symmetric
normalization collision prevents perfect normalized resolution
ground projection collision prevents vertical resolution
functional transition cannot represent one-to-many split
observation-based PID collides on same observation
public predicate collision hides private values
```

### Appendix B: Implementation Test Coverage

List the tested behaviors: address morphism resolution, source evidence,
bounded clustering, PID audit, AMN envelope, quality routing, natural-feature
rendering, address verification policy, official source coverage, ZK proof
bundle compatibility, and PID collision-risk budget.

### Appendix C: GIS Validation

Report the current GIS validation status:

```text
features: 351
hard errors: 0
warnings: 149
GDAL: ok
strict validation: not yet passed
warning budget: passed
```

### Appendix D: Reproducible Verification Commands

Include the local commands used to reproduce the currently verified claims:

```text
lean formal/AMTCore.lean
npm run verify:pid-risk
npm run verify:gis
npm run verify:gis:budget
npm run verify:postal-sources
npm run report:official-postal-sources
```

## Final Structure Summary

The paper should remain a 16-chapter work. The strongest final title structure
is:

```text
1. Introduction
2. Related Work
3. Central Claim
4. Address Ontology and Mathematical Structure
5. Axioms
6. Normalization Morphism and Candidate Generation
7. Structural Dissimilarity and Cluster Construction
8. Candidate Clusters and Finite Estimation
9. History and Temporal Structure
10. Probabilistic Model
11. Optimal Decision
12. Integrated Structure and Commutative Diagrams
13. Main Theorems
14. Implementation Connection
15. Natural Geography, Terrain Manifolds, and State Compression
16. Vertical Reference Layer
```

This structure is long, but it is justified. AMT is not only an algorithm; it
is a theory of address reference. A shorter structure would blur the difference
between ontology, formal proof, implementation tests, and data validation. The
16-chapter structure lets the paper be ambitious while keeping each claim in
the right certainty layer.
