# Address Morphism Theory

## A Formal Theory of Conditional Address Reference, Lineage, Compression, and Auditable Persistent Identification

Version: full English manuscript draft v3.0
Date: 2026-06-06
Author: to be supplied

## Manuscript Status

This v3 draft is a clean full-paper manuscript reconstructed of the 142-page Japanese
AMT manuscript `main (5).pdf`, the existing English AMT drafts, Lean
formalization records, GIS validation records, and implementation validation
notes accumulated in this repository.

It is not a literal translation. It deliberately revises over-strong claims into
conditional mathematical claims, separates companion topics such as AGID/AOID
and zero-knowledge proofs, and marks empirical claims as validation targets.

The intended target is an 80-130 page first full paper. A 200-340 page
book-length version should be produced only after adding larger empirical
benchmarks, source-license appendices, case studies, and full companion
protocol specifications.

## Abstract

Addresses are among the most important interfaces between human language and
the physical world. They are used for delivery, public administration, emergency
response, land registration, utilities, taxation, identity verification,
robotics, e-commerce, and humanitarian aid. Yet address expressions are not
stable mathematical identifiers. They are compressed, language-dependent,
context-dependent, institution-dependent, and time-dependent references to
physical, social, institutional, operational, natural, and cultural entities.

This paper proposes Address Morphism Theory (AMT), a formal framework for
modeling address resolution as a chain of morphisms from surface expressions to
candidate sets, structural clusters, evidence scores, explicit non-emission
states, lineage updates, and persistent identifier candidates. The central
negative result is an address reference impossibility theorem: under
non-injective observation, lossy normalization, incomplete candidate generation,
or lossy projection, no condition-free perfect address resolver can exist. This
result motivates AMT's safety principle: a resolver must be permitted to return
`ambiguous`, `unresolved`, or `rejected` rather than emit a false precise
identifier.

AMT further models address lineage as a graph rather than a single-valued update
function; structural dissimilarity as a directed, context-dependent cost rather
than a metric; PID issuance as a certified gate rather than a best-effort guess;
natural and cultural geography as source-bound addressable referents; vertical
reference as a necessary extension beyond two-dimensional coordinates; and
address quality as an internal control signal rather than a public truth value.

The paper separates formal, empirical, implementation, and security claims.
Core impossibility and gate lemmas are formalized in Lean. GIS validation is
connected to Lean through a generated certificate recording feature count,
source count, hard error count, warning budget, and source registry checks. This
does not prove all geography in Lean; it proves the logical consequences of an
accepted GIS certificate. Implementation tests support candidate generation,
unresolved safety, PID audit envelopes, natural-feature handling, source
metadata checks, and proof-ready privacy envelopes. However, global address
coverage, commercial validator comparison, live official API quality, full ZK
cryptographic safety, and real carrier delivery calibration remain empirical or
companion-work targets.

The thesis of AMT is therefore conservative: it does not claim to solve every
address. It claims that responsible address systems must explicitly model the
conditions under which address resolution is possible, and must abstain when
those conditions are not met.

## Keywords

Address resolution, geocoding, postal address, persistent identifier, PID,
address lineage, source governance, natural geography, vertical reference,
address entropy, formal verification, GIS validation, unresolved state,
conditional soundness.

## Editorial Method

This manuscript uses `main (5).pdf` as the primary theory source and the repository verification records as claim-control evidence. It adopts the core AMT model, revises over-strong claims into conditional claims, excludes detailed ZK and AGID/AOID protocol sections from the core body, and preserves those topics only as companion-paper boundaries.

## Claim Discipline and Weak-Point Corrections

This manuscript treats AMT as a conservative mathematical and engineering theory, not as a universal claim that every address can always be resolved. The main weak points of earlier drafts are corrected as follows.

First, strong slogans are rewritten as conditional claims. An address may function as a practical identifier inside a local institution, but it is not automatically a globally stable machine identifier. Delivery is an important operational signal, but a failed delivery can be caused by absence, weather, access restrictions, carrier error, fraud, or route constraints. Address conservation is a lineage principle, not a guarantee that every historical record is preserved. The impossibility theorem applies under explicit conditions such as non-injective observation, missing candidates, lossy projection, normalization collision, or context conflict.

Second, mathematical explanations are aligned with the formulas used. If the evidence model uses a negative log-likelihood update

\[
E_{t+1}(c)=E_t(c)-T_t\log P(e_{t+1}\mid c),
\]

then \(0<P\leq1\) implies a nonnegative increment. The correct interpretation is not that successful evidence absolutely lowers energy. Rather, high-likelihood candidates receive smaller increments than low-likelihood competitors and therefore become relatively lower-energy candidates. If absolute lowering is desired, the paper must use a separate positive support-score update.

Third, PID safety separates bit-level collision risk from semantic misissuance risk. A pairwise collision probability, a birthday-bound risk for \(n\) issued identifiers, and the risk of issuing a PID to the wrong cluster are different claims. A long identifier space is necessary but not sufficient for semantic correctness.

Fourth, structural dissimilarity is not assumed to be a metric. The directed cost \(D_{\chi,t}\) may fail symmetry and the triangle inequality. The paper therefore uses "structural dissimilarity" or "directed cost" as the default term, and reserves "metric" only for explicitly constrained special cases.

Fifth, verification claims are separated by method. Lean can verify abstract impossibility, candidate omission, non-injectivity, and gate lemmas, but not the truth of global geographic data. GIS checks can validate containment, boundaries, coordinates, and warning budgets, but not institutional completeness. Implementation tests can validate algorithmic behavior, but not prove worldwide delivery reality.


## Main Body

## 1. Introduction

Addresses are among the most widely used interfaces between human language and physical space. They are used for delivery, taxation, emergency response, navigation, land registration, identity verification, utilities, disaster relief, e-commerce, robotics, and public administration. Yet an address is rarely a precise mathematical object. It is often incomplete, localized, abbreviated, translated, reused, changed by administrative reform, or dependent on the practical needs of the observer.

Modern address systems are usually implemented as engineering pipelines. A user provides a string. The system normalizes it, geocodes it, ranks candidates, and returns a coordinate or a formatted address. This works well in many ordinary cases, but it hides several structural problems. The same physical entity may have multiple address expressions. The same address expression may refer to multiple entities. A building may contain several addressable units at the same two-dimensional coordinate. A road, bridge, river, island, desert, lake, or heritage site may be a named address-like referent without being a postal delivery point. A company may move while retaining social identity. A disaster may destroy the ordinary address while the person or relief target remains addressable in another way.

These problems are not merely edge cases. They reveal that address resolution is an inference problem under compression, incomplete observation, temporal change, and social convention. A complete theory of addresses must therefore answer several questions.

1. What kind of object is an address?
2. When can an address be resolved uniquely?
3. When must the resolver abstain?
4. How should historical address changes be represented?
5. How should different observers, such as delivery, emergency, administration, and property systems, obtain different optimal address representations?
6. How can address-derived claims be proven without revealing the address itself?

Address Morphism Theory proposes an answer: an address is a compressed spatiotemporal reference protocol. It maps between human expressions, geographic entities, social entities, institutional rules, delivery networks, persistent identifiers, and private proofs. AMT is not a claim that every address can always be resolved. On the contrary, AMT begins from the impossibility of unconditional perfect resolution. It then asks what a responsible resolver must do under that impossibility.

### Running Examples

The paper uses the following recurring examples.

1. Urban unit example. "1-2-3 Central Building, 5F, Room 501" and "Central Building 501" may refer to the same unit, while "Central Building" alone may refer only to the building.
2. Lineage example. A town is renamed after an administrative merger. The old address is no longer current, but it remains meaningful for property history, postal migration, and search.
3. Natural feature example. A user searches for a lake, waterfall, island, desert, or heritage site. The target is address-like, but it may be a polygon, line, or cultural site rather than a postal endpoint.
4. Context conflict example. A delivery company wants an entrance and locker route. A fire department wants emergency access and hazard context. A tax office wants official jurisdiction. The same input can require different optimal outputs.
5. Private proof example. A user wants to prove "this address is inside Japan" or "this address is inside a delivery zone" without revealing the street, building, name, or phone number.

These examples are deliberately ordinary. AMT is not only a theory for rare edge cases; it is a theory for why ordinary address systems need ambiguity handling, lineage, context, and privacy.

## 2. Contributions

This paper makes the following contributions.

First, it defines addresses as compressed references rather than mere strings or coordinates. A postal address, postal code, AGID, AOID, PID, Plus Code, or coordinate label is interpreted as a different compression scheme over a richer space of addressable entities.

Second, it states an address reference impossibility theorem. If the observation function is non-injective, if distinct entities collapse to the same normalized representation, or if a three-dimensional entity is projected to the same two-dimensional coordinate as another entity, no resolver can be condition-free and perfect.

Third, it introduces an AMT morphism chain for practical address resolution:

```text
surface input
  -> parsing
  -> temporal and multilingual expansion
  -> candidate generation
  -> structural dissimilarity
  -> clustering
  -> evaluation
  -> unresolved / ambiguous / resolved
  -> history update
  -> PID issuance
```

Fourth, it models address history as a lineage graph. Address states may be born, renamed, split, merged, retired, reassigned, or linked to successor states. A simple function from old address to new address is insufficient because split and merge events are relational, not functional.

Fifth, it introduces context-relative address optimality. The best address representation for delivery may differ from the best representation for emergency response, legal administration, property valuation, or disaster relief. Therefore no single scoring function is universally optimal for all countries, all uses, and all data conditions.

Sixth, it connects address theory to privacy-preserving proofs. An address can be treated as a secret input that yields public predicates: residence in a country, membership in a delivery zone, ownership of an AOID credential, or satisfaction of a quality threshold. AMT thus provides a foundation for ZK Address Proof and related mechanisms.

Seventh, it describes a validation strategy combining Lean formalization, GIS experiments, address verification tests, official postal sources, open-source geographic datasets, and attack-resistant audit models.

## 3. Scope and Non-Goals

AMT is not a replacement for GIS, postal standards, cadastral systems, or geocoding APIs. It is a formal layer that explains when and how those systems can be combined. AMT does not assume that all address strings can be resolved uniquely. It also does not assume that coordinates are the final answer. A coordinate may be a useful projection, but it can lose vertical, social, legal, or delivery-relevant information.

The theory is intentionally conservative. Strong claims are stated only when they can be expressed as mathematical facts or falsifiable empirical hypotheses. In particular:

- "Addresses never disappear" is too strong. AMT instead says that recorded address states can be preserved as lineage references even when current validity expires.
- "Urbanization always increases address information" is too strong. AMT instead says that the required information for unique identification grows with the number of distinguishable targets and the required granularity.
- "The address is more fundamental than DID" is too strong as a universal claim. AMT instead says that when a system requires physical reachability, residence, delivery eligibility, disaster relief, or real-world asset reference, address reference is a necessary companion or precursor to decentralized identity.

### Comparison with Existing Approaches

| Approach | Typical output | Strength | Limitation addressed by AMT |
| --- | --- | --- | --- |
| Postal address standard | Formatted address string | Human-readable, official, jurisdiction-aware | May be ambiguous, outdated, language-dependent, or incomplete. |
| Postal code lookup | Delivery zone or locality | Compact, operationally useful | Usually cannot identify a building, unit, natural feature, or lineage state. |
| Geocoding API | Coordinate or place candidate | Practical search and ranking | Often hides uncertainty and may collapse social, vertical, and historical identity. |
| GIS database | Geometry and attributes | Strong spatial representation | Does not by itself model delivery history, proof predicates, or user-entered ambiguity. |
| Plus Code or coordinate code | Spatial code | Global and systematic | Weak social, administrative, lineage, and credential semantics. |
| DID or VC system | Cryptographic subject or credential | Strong identity and selective disclosure | Needs an address theory when claims depend on physical reachability or jurisdiction. |
| AMT | Resolution outcome, lineage, PID, proof predicate | Models ambiguity, history, context, and privacy together | Requires more governance, evidence, and validation work. |

## 4. Addressable Entities

Let \(X_t\) denote the set of addressable entities at time \(t\). An entity may be physical, social, institutional, natural, or virtual. Examples include:

- physical entities: buildings, rooms, floors, entrances, lockers, parcels, warehouses, ports, parking spaces;
- linear entities: roads, bridges, rivers, trails, railway segments;
- areal entities: lakes, islands, deserts, wetlands, forests, grasslands, parks, protected areas;
- volumetric entities: underground facilities, floors, rooms, three-dimensional delivery zones;
- social entities: companies, schools, hospitals, agencies, shops, shelters, family homes, aid centers;
- institutional entities: postal zones, administrative units, cadastral parcels, electoral districts;
- virtual or operational entities: temporary disaster addresses, delivery lockers, AOID-linked delivery endpoints.

An addressable entity is not necessarily a point. It may be a point, polyline, polygon, volume, relation, or graph node. It may also have multiple identities depending on the application. For example, a hospital is a building complex, a social institution, a delivery destination, an emergency facility, and possibly a legal entity. AMT therefore separates the entity from any single coordinate representation.

## 5. Surface Address Expressions

Let \(S\) be the space of surface address expressions. An element \(s \in S\) may be a postal address, a partial address, a natural-language place description, a postal code, a facility name, a coordinate label, a Plus Code, an AGID, an AOID reference, a PID, or a mixed expression.

Surface expressions are shaped by language, jurisdiction, culture, writing system, abbreviation, administrative history, and user intent. A robust resolver must not treat application language and search language as the same thing. The application may display Japanese, English, Arabic, or Spanish, while the search system must still expand aliases, translations, romanizations, old names, local scripts, official names, and colloquial names.

AMT defines a parsing morphism:

\[
\pi : S \to T
\]

where \(T\) is a structured token space containing language tags, address tokens, administrative hints, postal hints, natural geographic hints, facility hints, temporal hints, and coordinate hints.

At time \(t\), an expansion morphism:

\[
\epsilon_t : T \to 2^T
\]

adds aliases, old names, translated names, postal expansions, administrative successors, map-derived names, and relevant natural geography.

## 6. Address as Compression

The first core hypothesis is that an address is an information compression scheme. Let \(X\) be a universe of addressable entities and \(C\) be a code space. A compression map is:

\[
c : X \to C
\]

When \(c\) is injective, a code can in principle identify an entity uniquely. When \(c\) is non-injective, multiple entities share the same code. Postal codes, address strings, grid codes, Plus Codes, AGID, AOID, and PID can be compared as different compression schemes with different tradeoffs.

Postal codes often compress large delivery areas into short codes. They are efficient and institutionally meaningful, but they cannot usually identify a building or room. Plus Codes encode coordinate-like information and are globally systematic, but they do not directly encode social meaning, delivery history, or administrative lineage. A traditional address is human-readable and socially meaningful, but it may be ambiguous, language-dependent, and historically unstable. AGID and AOID aim to preserve more address semantics, authority, history, and proof structure, at the cost of more complex governance.

Example. Suppose a postal code covers 2,000 deliverable units. The postal code is an effective routing compression, but it cannot identify a single apartment. A room-level address adds building, floor, and unit information. A coordinate code may distinguish the building but still miss the room. A PID may be issued only after AMT confirms the candidate cluster and history state. These are not competing definitions of address; they are different compression levels.

| Representation | Compressed information | What it keeps | What it often loses |
| --- | --- | --- | --- |
| Postal code | Region or route zone | Delivery region | Unit identity, building identity, resident privacy. |
| Street address | Human-readable referent | Social and administrative meaning | Old names, aliases, vertical detail, uncertainty. |
| Coordinate code | Position | Global spatial location | Social meaning, legal status, lineage, delivery endpoint. |
| AGID | Spatial-semantic reference | Region, feature, entity, route semantics | Requires registry and evidence governance. |
| AOID | Address operation identity | Ownership, credential, delegation, proof relation | Should hide address content unless scoped disclosure is allowed. |
| PID | Resolved persistent state | Auditable resolution output | Should not be issued before ambiguity and history checks. |

### Theorem 1: Compression Collision Implies Ambiguous Decoding

Let \(c : X \to C\) be a compression map. If there exist \(x_1, x_2 \in X\) such that \(x_1 \neq x_2\) and \(c(x_1) = c(x_2)\), then no decoder \(d : C \to X\) can satisfy \(d(c(x)) = x\) for all \(x \in X\).

Proof sketch. Since \(c(x_1) = c(x_2)\), the decoder receives the same input for both entities. Therefore \(d(c(x_1)) = d(c(x_2))\). If the decoder were perfect, this value would be both \(x_1\) and \(x_2\), contradicting \(x_1 \neq x_2\). Therefore a perfect decoder cannot exist. This is the basic compression form of the address reference impossibility theorem.

### Address Entropy

If \(N\) distinguishable entities must be uniquely identified, any fixed-length binary code requires at least \(\lceil \log_2 N \rceil\) bits. This does not mean that every urban address is longer than every rural address. Rather, it means that the information required for unique identification grows with the number of distinguishable entities and the required granularity.

An address system may reduce apparent length by relying on shared context. For example, "Main Street" may be short if the city is already known, but ambiguous globally. AMT treats context as hidden information. Therefore address entropy should be measured relative to an observer, a candidate set, and a resolution task.

## 7. The Address Reference Impossibility Theorem

Let \(X\) be a set of true addressable entities and \(Y\) be a set of observations. An observation function is:

\[
O : X \to Y
\]

A resolver is:

\[
R : Y \to X
\]

A resolver is perfect with respect to \(O\) if:

\[
\forall x \in X,\quad R(O(x)) = x.
\]

### Theorem 2: Non-Injective Observation Prevents Perfect Resolution

If \(O\) is not injective, then no resolver \(R : Y \to X\) is perfect with respect to \(O\).

Proof. Since \(O\) is not injective, there exist \(x_1, x_2 \in X\) such that \(x_1 \neq x_2\) and \(O(x_1) = O(x_2)\). If \(R\) were perfect, then:

\[
R(O(x_1)) = x_1
\]

and:

\[
R(O(x_2)) = x_2.
\]

But \(O(x_1) = O(x_2)\), so the left sides are equal. Thus \(x_1 = x_2\), contradiction. Therefore no perfect resolver exists.

This theorem is the conceptual center of AMT. Address resolution cannot be made safe by pretending that every input has one correct output. A system must detect conditions under which uniqueness is not justified.

Example. If a map system stores only the normalized string "Central Building" and two buildings in different cities normalize to that same string, a resolver using only that normalized value cannot know which building was intended. If a system stores only a 2D coordinate for a tower, the first-floor shop and fifth-floor office may collapse to the same observation. The mathematical problem is the same in both cases: the observation is non-injective.

### Corollary 1: Normalization Collision

If two distinct address expressions or entities collapse to the same normalized representation, a resolver using only that normalized representation cannot distinguish them.

### Corollary 2: Projection Collision

If two distinct three-dimensional entities project to the same two-dimensional coordinate, a resolver using only the two-dimensional projection cannot distinguish them.

### Corollary 3: Postal Code Collision

If a postal code covers multiple deliverable entities, then the postal code alone cannot identify a unique entity.

### Corollary 4: Candidate Incompleteness

If the true entity is absent from the candidate set, no candidate-only resolver can return the true entity.

These corollaries are not pessimistic slogans. They are design requirements. A responsible resolver must support ambiguity, unresolved states, and evidence requests.

## 8. The AMT Morphism Chain

AMT models address resolution as a chain of morphisms:

\[
S
\xrightarrow{\pi}
T
\xrightarrow{\epsilon_t}
2^T
\xrightarrow{\Gamma_t}
2^{X_t}
\xrightarrow{D_t,\Pi_{\delta,t}}
\mathcal{C}_t
\xrightarrow{E_t}
\mathcal{O}
\xrightarrow{\iota_t}
I.
\]

The components are:

- \(S\): surface address expressions;
- \(T\): parsed address token structures;
- \(\epsilon_t\): temporal and multilingual expansion;
- \(\Gamma_t\): candidate generation;
- \(X_t\): addressable entities at time \(t\);
- \(D_t\): structural dissimilarity;
- \(\Pi_{\delta,t}\): cluster partition at threshold \(\delta\);
- \(\mathcal{C}_t\): candidate clusters;
- \(E_t\): evaluation or scoring function;
- \(\mathcal{O}\): resolution outcomes;
- \(\iota_t\): identifier issuance;
- \(I\): persistent identifiers or references, such as PID.

The resolution outcome is not a single entity by default. It is:

```text
Resolved(entity, confidence, evidence)
Ambiguous(cluster, evidence)
Unresolved(reason, required_evidence)
Rejected(reason)
```

This outcome type is essential. A resolver that always emits an entity will necessarily be wrong under the impossibility theorem whenever the observation is non-injective or the candidate set is incomplete.

Worked example. For the input "Central Building 501", parsing extracts a building token and a unit token. Expansion adds local spellings and old building names. Candidate generation returns a building, several units, and a nearby similarly named building. Structural clustering separates the nearby building from the target building. Evaluation favors Room 501 if the floor/unit evidence is fresh and source-backed. If the unit evidence is missing, the correct output may be `Ambiguous` at building level or `Unresolved(vertical_information_missing)`, not a guessed PID.

## 9. Candidate Generation

Candidate generation is the process:

\[
\Gamma_t : 2^T \to 2^{X_t}.
\]

It collects possible entities from official postal sources, administrative data, open geographic data, local maps, address format files, natural geography, building data, delivery history, user-provided hints, and known aliases.

Candidate generation is recall-oriented. It should prefer including plausible candidates over prematurely discarding them. Ranking and rejection occur later. This separation is important because candidate incompleteness can make perfect resolution impossible regardless of the scoring function.

Candidate generation should support:

- multilingual search independent of application display language;
- old and new administrative names;
- postal code and official postal source lookup;
- natural geography and named physical features;
- building, entrance, floor, room, and locker hints;
- country-specific and language-specific address formats;
- rural, island, mountain, desert, polar, and low-density contexts;
- unresolved fallback when evidence is insufficient.

Candidate generation differs from ranking. A postal lookup may return a broad area, an OSM search may return a named building, a carrier history table may return a delivery entrance, and a natural geography dataset may return a lake polygon. AMT first collects these candidates, then clusters and evaluates them. Prematurely ranking only the first geocoder result can hide the true entity before the resolver has a chance to reason about it.

## 10. Structural Dissimilarity and Clustering

A candidate set may contain multiple entities that represent the same underlying referent at different levels of granularity or from different sources. AMT introduces a structural dissimilarity:

\[
D_t : X_t \times X_t \to \mathbb{R}_{\ge 0}^k
\]

or, after weighting:

\[
d_t : X_t \times X_t \to \mathbb{R}_{\ge 0}.
\]

The components may include:

- geographic distance;
- administrative hierarchy distance;
- postal code compatibility;
- name similarity;
- language and script equivalence;
- entity type compatibility;
- vertical compatibility;
- delivery route compatibility;
- lineage compatibility;
- source reliability;
- temporal freshness.

The dissimilarity need not be symmetric. The cost of mapping a building to a room is not the same as the cost of mapping a room to a building. A coarse expression may legitimately refer to a fine entity under one context and not under another. The formal Lean artifact includes a distinction between symmetric dissimilarity and asymmetric dissimilarity.

Given a threshold \(\delta\), clustering produces:

\[
\Pi_{\delta,t}(C)
\]

where \(C \subseteq X_t\) is a finite candidate set. Each cluster represents a possible equivalence class of referents under the current evidence, time, and resolution task.

Example. "Central Building", "Central Bldg.", "Central Building 5F", and "Room 501, Central Building" may be placed in one cluster under a building-level task, but split into distinct clusters under a room-level delivery task. A lake name and a nearby park with the same name should not be clustered merely because their strings match; feature type and geometry must also matter.

| Feature | Same cluster likely when | Separate cluster likely when |
| --- | --- | --- |
| Name similarity | Same language or known alias | Same name in different cities or feature types. |
| Geometry | Same footprint or contained unit | Nearby but distinct parcels or buildings. |
| Postal relation | Same official delivery endpoint | Same postal code but many possible endpoints. |
| Vertical data | Same unit/floor evidence | Same 2D point but different floors or entrances. |
| Lineage | Official rename or successor | Reassigned name with no continuity evidence. |

## 11. Unresolved as a Safety State

AMT treats unresolved as a first-class outcome. It is not a bug or a failure of user experience. It is the correct output when the available evidence does not justify a unique resolution.

Typical unresolved conditions include:

- the true entity may be missing from the candidate set;
- candidate clusters have insufficient score margin;
- two or more clusters are equally plausible;
- the address refers to a historical or retired address state;
- vertical information is missing;
- natural geography is too broad or ambiguous;
- source data are stale;
- quality is below threshold;
- risk is above threshold;
- the requested proof predicate is too narrow and may reveal private information.

PID issuance should be blocked unless the resolver satisfies admissibility conditions. A minimal admissibility predicate includes candidate completeness evidence, cluster uniqueness, quality threshold, freshness threshold, risk threshold, and auditability.

Example. A user enters a mountain hut name in a region where several huts share similar names and the map source is stale. A normal geocoder might return the first hit. AMT should return `Unresolved(insufficient_source_freshness)` or `Ambiguous(similar_named_features)` until a better source, user hint, or official local dataset is available. This protects both navigation safety and identifier quality.

## 12. Address Lineage

Address states change. Let \(A_t\) be the set of address states at time \(t\). AMT represents address history as a directed labeled graph:

\[
L = (V, E)
\]

where vertices are address states and edges are events:

```text
Birth
Rename
Split
Merge
Move
Retire
Reassign
AdministrativeChange
PostalChange
VerticalSubdivision
CredentialUpdate
```

A strong address conservation claim, such as "addresses never disappear," is false in ordinary language. Addresses can be retired, destroyed, invalidated, or reassigned. AMT instead proposes a weaker and safer law.

### Principle: Lineage Conservation

The current validity of an address state may expire, but a recorded address state can remain available as a lineage reference if the history graph is append-only or otherwise audit-preserving.

This principle allows old addresses to remain useful for mapping, audit, disaster recovery, property history, address credential migration, and PID inheritance.

### Theorem 3: Split Cannot Be Represented by a Single-Valued Successor Function

Suppose an old address state \(a\) splits into two distinct successor states \(b_1\) and \(b_2\). If a transition function \(f\) is single-valued, then \(f(a)\) cannot be both \(b_1\) and \(b_2\) when \(b_1 \neq b_2\). Therefore split must be represented by a relation or graph, not by a simple function.

This theorem is already represented in the Lean formalization by the split representation lemma. It justifies the use of Address Lineage rather than a flat old-to-new mapping table.

Example. If "Old Town A" is split into "North A" and "South A", a table that maps old names to one new name loses information. A lineage graph can represent both successors and can attach evidence: date, legal act, source, affected postal codes, and whether old mail forwarding still exists.

| Event | Flat mapping problem | Lineage graph representation |
| --- | --- | --- |
| Rename | Usually manageable | Edge labeled `Rename`. |
| Split | One old value has multiple successors | One-to-many edges labeled `Split`. |
| Merge | Several old values become one successor | Many-to-one edges labeled `Merge`. |
| Retirement | No current successor | Edge to retired state with validity interval. |
| Reassignment | Same label reused for a different entity | New node, not same identity by default. |

## 13. Social and Institutional Continuity

Some addressable entities preserve identity through social or institutional continuity rather than strict geographic continuity. A company may move offices. A school may relocate. A hospital may merge campuses. A disaster shelter may move while serving the same relief function. A world heritage site may have a recognized cultural identity that is not reducible to a single coordinate.

AMT therefore distinguishes several identity relations:

- physical identity;
- legal identity;
- social identity;
- delivery identity;
- administrative identity;
- historical identity;
- proof identity.

These relations may agree, but they need not. A property address may change under administrative reform while the land parcel remains physically continuous. A company address may change while the corporate entity remains socially and legally continuous. A building may remain at the same coordinate while its units and delivery endpoints split.

The theory should not claim that every address is a social entity. Natural geography often depends more on physical continuity, naming conventions, and mapped extent. But AMT should allow social continuity where it matters.

Example. A company may move from Building A to Building B while retaining legal identity. A warehouse, however, may remain physically identical while the tenant changes. AMT therefore separates "same company", "same delivery endpoint", "same parcel", and "same social institution". A resolver that collapses these relations into one identifier will either over-merge or over-split.

## 14. Context-Relative Address Optimality

The best address for one observer may not be the best address for another. Let \(U_c(x,s)\) be a utility function for context \(c\), candidate \(x\), and input \(s\). Contexts may include delivery, firefighting, tax administration, cadastral registration, property search, humanitarian aid, robotics, or private proof.

The context-relative optimal candidate is:

\[
\operatorname{argmax}_{x \in C} U_c(x,s).
\]

### Theorem 4: Context Conflict Prevents Universal Optimality

If there exist contexts \(c_1\) and \(c_2\), a candidate set \(C\), and an input \(s\) such that:

\[
\operatorname{argmax}_{x \in C} U_{c_1}(x,s) \neq
\operatorname{argmax}_{x \in C} U_{c_2}(x,s),
\]

then no single context-independent candidate is optimal for both contexts.

This theorem supports an Address No Free Lunch principle: no single resolver, scoring function, or address format is universally optimal across all countries, all purposes, all data quality regimes, and all risk tolerances.

The practical conclusion is not that general-purpose resolvers are useless. It is that resolvers must expose context, thresholds, and abstention policies. A delivery resolver may prefer entrance-level precision. A fire response resolver may prefer access route and hazard data. An administrative resolver may prefer official jurisdictional hierarchy. A privacy resolver may prefer predicates over exact disclosure.

| Context | Preferred output | Why a single universal output fails |
| --- | --- | --- |
| Delivery | Entrance, locker, route, recipient authorization | A legal parcel ID may not tell a courier where to go. |
| Emergency response | Access road, hazard, nearest entrance, floor | A postal label may not include rescue-critical geometry. |
| Tax administration | Official jurisdiction and parcel relation | A colloquial building name may be insufficient. |
| Property registry | Cadastral parcel, unit, ownership boundary | A delivery endpoint may not equal a legal property. |
| Natural feature search | Feature extent and nearest settlement | A centroid coordinate may misrepresent a large lake or desert. |
| Private proof | Predicate only | Exact coordinates or street address may leak private information. |

## 15. Evidence and Evaluation

AMT evaluates a candidate by combining evidence. Let \(C_s\) be the candidate set for input \(s\). The evaluation function is:

\[
E_t : S \times X_t \times Ctx \to \mathbb{R}
\]

where \(Ctx\) is a context space.

Evidence may include:

- exact token match;
- normalized token match;
- postal code match;
- administrative hierarchy match;
- source reliability;
- official postal source coverage;
- geographic proximity;
- natural feature name match;
- building and entrance evidence;
- lineage continuity;
- delivery success history;
- rejection or return history;
- freshness;
- regional quality score;
- privacy and proof constraints.

A probabilistic implementation may convert evidence into log-likelihood ratios and then into a calibrated score. A simple form is:

\[
P(x \mid s,t,c) =
\sigma\left(
\alpha_0 +
\sum_i \alpha_i f_i(s,x,t,c)
\right)
\]

where \(f_i\) are feature functions and \(\sigma\) is the sigmoid function. This formula is not required by AMT, but it provides one concrete implementation.

Example. For "Central Building 501", exact building-name match may add evidence, matching postal code may add evidence, stale map data may reduce evidence, and missing vertical source data may block PID issuance even if the score is high. For a lake, name match and geometry source may matter more than postal code. AMT allows the evidence vector to change by entity type and context.

## 16. Address Reputation

Address reputation is the hypothesis that reachability and reliability can be estimated from history. It is not a claim that address truth is determined only by delivery outcomes. Rather, delivery outcomes are evidence about operational reachability.

Useful reputation signals include:

- successful deliveries;
- failed deliveries;
- returns;
- manual corrections;
- carrier confirmations;
- unresolved events;
- fraud reports;
- credential revocations;
- freshness of last verification.

The reputation model must defend against bias and manipulation. A high-volume urban address may receive more evidence than a rural address. A malicious actor may try to create fake delivery success. A new address may have little history. Therefore reputation must be combined with source authority, proof constraints, anomaly detection, and time decay.

Comparison. A conventional address validator may return "valid" after matching a postal database. AMT treats this as one evidence source, not final truth. A delivery history of repeated success can support reachability, but it should not override official revocation, privacy policy, or evidence that the address has been split or reassigned.

## 17. Address as a Communication Protocol

An address is not only data. It is a routing target. In that sense, a postal address, email address, IP address, telephone number, AGID, and delivery locker reference are comparable. Each represents a way to direct a network action toward a reachable endpoint.

However, AGID should not be described as identical to an IP address. An IP address primarily routes packets to network interfaces. An AGID-like address routes physical, institutional, proof, and delivery operations to addressable entities. It carries spatial semantics, lineage, quality, and potentially privacy constraints.

AMT therefore treats address as a communication protocol over physical and social space:

```text
sender intent
  -> address expression
  -> resolver
  -> route / proof / credential / identifier
  -> target action
```

The target action may be delivery, verification, registration, audit, disaster relief, robotic navigation, or private proof.

| Protocol-like object | Route target | Error mode | AMT analogy |
| --- | --- | --- | --- |
| Email address | Mailbox | Bounce, alias, forwarding | Delivery endpoint with social identity. |
| IP address | Network interface | Unreachable, reassigned, NAT | Routing target with temporal reassignment risk. |
| Phone number | Subscriber or service | Ported, disconnected, shared | Identifier with ownership and forwarding. |
| Postal address | Physical or social destination | Ambiguous, outdated, incomplete | Compressed spatial-social route target. |
| AGID | Spatial-semantic referent | Low evidence, disputed extent, stale source | Address routing and proof anchor. |
| AOID | Address operation identity | Revoked, delegated, expired, unauthorized | Ownership and credential control layer. |

## 18. Natural Geography and Non-Postal Referents

Many important address-like references are not ordinary postal addresses. A user may ask for a river, waterfall, lake, island, desert, wetland, forest, grassland, glacier, cave, valley, mountain, bridge, road, park, heritage site, archaeological site, or Antarctic research station.

AMT treats named natural and cultural features as addressable entities when they can function as references for search, navigation, display, delivery, hazard analysis, scientific annotation, or humanitarian coordination.

Natural geography introduces special issues:

- features may be linear, areal, or volumetric;
- names may be multilingual or disputed;
- boundaries may be uncertain or seasonal;
- features may cross jurisdictions;
- official postal sources may not cover them;
- coordinates may be center points rather than full extents;
- address display may need nearest administrative region or nearest settlement.

The address rendering system should therefore combine feature names, feature type, extent, administrative containment, nearby settlements, and source confidence. A lake should not be treated like a building. A desert should not be treated like a street address. An island may need both natural geography and administrative jurisdiction.

Examples:

- A lake should render with its name, feature type, country or region, and possibly nearest settlement. A single center coordinate may be misleading for a large lake.
- A river or road should render as a linear feature and may require route segment selection.
- A desert, grassland, forest, wetland, or ice field should render as an areal natural feature with extent confidence.
- A cave, waterfall, bridge, or heritage site may need access route, protected-area status, and source freshness.
- An Antarctic station should be represented as a named operational entity with polar data source metadata, not as an ordinary postal address.

| Entity type | Postal-style display is enough? | AMT display requirement |
| --- | --- | --- |
| Building | Often yes, with unit detail | Address, entrance, unit, source, vertical reference. |
| River | No | Name, segment, basin or region, nearest settlement, source. |
| Lake | No | Name, extent, region, nearest settlement, source confidence. |
| Island | Sometimes | Name, jurisdiction, archipelago, settlement, landing/access context. |
| Desert or grassland | No | Name, extent, region, protected status if relevant. |
| Heritage site | Sometimes | Official name, cultural status, administrative region, access context. |

## 19. Vertical Reference and Three-Dimensional Addresses

Two-dimensional coordinates are insufficient for many addressable entities. A building may contain multiple floors, rooms, entrances, lockers, stores, offices, elevators, restricted zones, or underground spaces. A delivery robot may need a route to a locker, not merely a latitude and longitude.

Let \(V\) be a vertical reference space. A three-dimensional address reference may be:

\[
(x, y, z, access, unit, route, permission)
\]

where \(z\) may be floor or altitude, and access may encode entrance, lock, route, and permission constraints.

Projection to two dimensions:

\[
p : X_{3D} \to X_{2D}
\]

may be non-injective. Therefore the projection collision corollary applies. If two distinct units project to the same 2D point, a 2D resolver cannot distinguish them. Vertical reference is not a UI detail. It is mathematically necessary for complete address resolution in multi-unit spaces.

Example. A shopping mall may contain a first-floor restaurant, a second-floor clinic, underground parking, and a parcel locker. All may share a 2D coordinate. For delivery, medical response, or access control, the resolver needs vertical reference and route permission. A coordinate-only system cannot safely distinguish these destinations.

## 20. AMT Resolution Algorithm

A practical AMT resolver can be expressed as follows.

```text
Input:
  surface address s
  time t
  context c
  policy thresholds theta

Procedure:
  1. Parse s into structured tokens T = pi(s).
  2. Expand T with aliases, languages, postal data, old names, and natural geography:
       T_plus = epsilon_t(T).
  3. Generate candidate entities:
       C = Gamma_t(T_plus).
  4. If C is empty, return Unresolved("no candidates").
  5. Compute structural dissimilarities D_t over C.
  6. Cluster candidates with Pi_delta,t.
  7. Score clusters and entities with E_t under context c.
  8. Check admissibility:
       candidate evidence,
       uniqueness,
       score threshold,
       score margin,
       quality,
       freshness,
       risk,
       lineage consistency.
  9. If admissibility fails, return Ambiguous or Unresolved.
 10. Update lineage and evidence history.
 11. Issue or reuse PID only if issuance conditions hold.
 12. Emit audit record, optionally as a private proof bundle.
```

This algorithm is intentionally conservative. The resolver is not rewarded for always returning something. It is rewarded for returning a justified result or abstaining when the theory says uniqueness is not justified.

Algorithm walkthrough. Consider "Central Building 501" in a delivery context.

1. Parsing separates building name, unit number, and possible floor hint.
2. Expansion adds aliases such as "Central Bldg." and local-script variants.
3. Candidate generation retrieves the building, known units, nearby similarly named buildings, and carrier delivery hints.
4. Clustering groups aliases of the same building but separates a different building with the same name.
5. Evaluation checks whether Room 501 exists, whether the entrance is known, whether the postal code agrees, and whether delivery history is fresh.
6. If unit-level evidence is strong, the resolver may issue or reuse a PID for Room 501.
7. If only building-level evidence exists, the resolver should return `Ambiguous` or `Unresolved(vertical_information_missing)`.

The same input in a tax context may stop at the legal building or parcel. The same input in a private proof context may output only a predicate proof such as "inside city delivery zone" without exposing the unit.

| Conventional pipeline | AMT pipeline |
| --- | --- |
| Normalize string and geocode. | Parse, expand, generate candidates, cluster, score, and audit. |
| Usually returns the top candidate. | May return resolved, ambiguous, unresolved, or rejected. |
| Often treats coordinate as final. | Treats coordinate as one projection among social, vertical, legal, and delivery references. |
| History is often external metadata. | Lineage is part of the resolution model. |
| Privacy is usually handled after resolution. | Private predicates can be first-class outputs. |

## 21. Verification Strategy

AMT should be validated by multiple methods. No single method is enough.

### Lean Formalization

Lean is appropriate for structural facts:

- non-injective observation prevents perfect resolution;
- missing candidates prevent complete resolution;
- ambiguous and unresolved outcomes emit no false entity;
- score selection requires thresholds;
- PID issuance requires admissibility;
- missing entity refutes candidate completeness;
- asymmetric dissimilarity is not symmetric;
- normalization collision prevents perfect resolution;
- projection collision prevents vertical resolution;
- functional transition cannot represent split;
- observation-based PID collides under identical observation;
- predicate proof collision hides private value under a non-singleton predicate.

These formal facts do not prove that the implementation is globally correct, but they protect the theory from overclaiming.

### GIS and Data Validation

GIS validation is appropriate for empirical hypotheses:

- address entropy across city, rural, island, mountain, desert, polar, and natural geography contexts;
- natural feature recognition;
- administrative lineage;
- country and language address format coverage;
- official postal source coverage;
- quality score calibration;
- source freshness and license constraints.

### Implementation Tests

Implementation tests should cover:

- candidate generation;
- clustering;
- unresolved handling;
- PID issuance audit;
- AOID ownership proof;
- region membership proof;
- revocation and freshness;
- credential issuer trust registry;
- proof bundle compatibility;
- API endpoints;
- address verification engine;
- natural geography rendering;
- postal code validation.

### Security Validation

Security validation should address:

- duplicate registration nullifiers;
- private address predicate leakage;
- proof scope collision;
- replay and freshness;
- issuer trust;
- malicious reputation updates;
- credential revocation;
- privacy threshold failure;
- open-source safety for AGID/AOID code.

## 22. Formal Semantics of Observation and Resolution

This section expands the formal core. It is included because the shortest version of the paper can make AMT look like a design pattern rather than a mathematical model. The key point is that every practical address resolver observes only a projection of the world.

Let the true addressable world at time \(t\) be:

\[
W_t = (X_t, G_t, A_t, P_t, H_t, Q_t)
\]

where:

- \(X_t\) is the set of addressable entities;
- \(G_t\) is geographic geometry and topology;
- \(A_t\) is administrative and postal authority data;
- \(P_t\) is policy and permission data;
- \(H_t\) is historical lineage data;
- \(Q_t\) is quality, freshness, and source reliability data.

An address resolver never sees \(W_t\) directly. It sees observations:

\[
O_t : W_t \to Y_t.
\]

The observation \(Y_t\) may include a surface address string, user locale, map search result, postal lookup, approximate coordinate, delivery history, or credential proof. Observation is almost always lossy. It forgets some of geometry, time, authority, vertical detail, source reliability, and user intent.

### Resolution as a Partial Certified Function

The safe resolver is not:

\[
R : Y_t \to X_t.
\]

That total function overclaims. AMT instead models resolution as:

\[
R_\theta : Y_t \times Ctx \to \mathcal{O}
\]

where \(\theta\) is a policy threshold vector and \(\mathcal{O}\) is:

```text
Resolved(entity, certificate)
Ambiguous(candidate_cluster, certificate)
Unresolved(reason, required_evidence)
Rejected(reason)
```

The certificate records which gates were satisfied. A minimal certificate contains:

- candidate generation source list;
- candidate completeness evidence;
- cluster uniqueness evidence;
- score and score margin;
- quality threshold result;
- freshness threshold result;
- lineage consistency result;
- risk threshold result;
- privacy threshold result;
- audit hash or proof bundle.

### Soundness and Completeness

AMT separates three notions that are often confused.

| Property | Meaning | Practical status |
| --- | --- | --- |
| Candidate soundness | Emitted entity belongs to the candidate set. | Formally checkable. |
| Resolution soundness | Resolved output satisfies declared gates. | Formally checkable for abstract gates. |
| World completeness | Candidate set contains the true entity. | Empirical and source-dependent. |

Lean can verify candidate soundness and gate discipline. It cannot prove that a real-world database contains every possible building, cave, locker, station, or historical address. This distinction is crucial. AMT is not weakened by admitting incomplete data; it is strengthened by refusing to pretend that incomplete data are complete.

### Observation Algebra

The observation process can be decomposed:

\[
O_t = o_k \circ \cdots \circ o_2 \circ o_1.
\]

Examples:

- normalization: removes punctuation, spacing, script differences, or honorifics;
- postal projection: maps many units into one postal code;
- coordinate projection: maps rooms and floors into a two-dimensional point;
- temporal projection: maps old and new names into a current-only view;
- policy projection: hides restricted access information;
- privacy projection: replaces exact address with a predicate.

Each projection may introduce collisions. If any projection is non-injective and later stages do not reintroduce the lost evidence, perfect recovery is impossible.

### Refinement and Evidence Addition

Evidence addition is modeled as refinement:

\[
Y_t \preceq Y'_t
\]

if \(Y'_t\) contains all evidence in \(Y_t\) plus additional information. A refined observation may reduce ambiguity, but it cannot guarantee uniqueness unless the added evidence separates all colliding candidates relevant to the task.

Example. Adding a postal code may separate two cities but not two apartments. Adding a floor may separate two shops but not two rooms on the same floor. Adding a delivery credential may prove eligibility but not disclose the exact address. The refinement needed depends on the context.

### Abstention Monotonicity

A useful safety property is abstention monotonicity. If the evidence is insufficient, adding no evidence should not turn an unresolved state into a resolved state merely because time passed or because a default fallback exists.

Informally:

```text
if gates(Y, theta) fail
and no new evidence is added
then resolution must not emit a new PID
```

This property protects the system from false precision. A resolver may become more permissive only when policy changes explicitly or evidence is refined.

## 23. Counterexample Catalogue

The following counterexamples are not marginal cases. They show why AMT requires unresolved states, lineage, context, privacy, and multiple identity relations.

### Counterexample 1: Same Normalized String, Different Entities

Two buildings in different cities may normalize to the same string, such as "Central Building". If the resolver uses only the normalized string, it cannot distinguish them. A city, postal code, coordinate, or source-specific identifier must be added.

Formal pattern:

\[
N(s_1) = N(s_2),\quad x_1 \neq x_2.
\]

Implication: string normalization is not resolution.

### Counterexample 2: Same Postal Code, Many Endpoints

A postal code may cover thousands of apartments. A resolver that emits a room-level PID from a postal code alone is fabricating evidence.

Implication: postal codes are routing compression, not full identity.

### Counterexample 3: Same Coordinate, Different Floors

A building may contain a store on the first floor, an office on the fifth floor, and a locker underground. All can share the same latitude and longitude.

Implication: two-dimensional geocoding cannot be the final model for multi-unit spaces.

### Counterexample 4: Old Address Remains Search-Relevant

An old town name may no longer be official, but residents, property documents, delivery migration, and disaster records may still use it.

Implication: current validity and historical referability are different.

### Counterexample 5: Split Address

An old administrative unit may split into two successors. A single-valued function from old address to new address cannot represent both successors.

Implication: lineage must be graph- or relation-based.

### Counterexample 6: Merge Address

Several villages may merge into one municipality. A one-to-one mapping loses predecessor identity and can break property, tax, or historical search.

Implication: address history needs many-to-one edges and validity intervals.

### Counterexample 7: Natural Feature with No Postal Endpoint

A lake, glacier, cave, desert, river, or waterfall may be a valid search target and navigation referent but not a deliverable postal endpoint.

Implication: addressable entity is broader than postal address.

### Counterexample 8: Context Conflict

For the same hospital input:

- delivery wants loading dock and entrance;
- emergency response wants fastest access and hazard route;
- administration wants legal jurisdiction;
- privacy proof wants only "inside service region".

Implication: one universal output is not context-optimal.

### Counterexample 9: Narrow Predicate Leakage

A ZK proof that says "the address is in this exact one-room region" hides the text but reveals the address by uniqueness.

Implication: privacy requires anonymity-set constraints, not only cryptographic proof syntax.

### Counterexample 10: Reputation Bias

Urban addresses may have many delivery events. Rural or island addresses may have little evidence. A naive reputation model may treat low evidence as low trust.

Implication: reputation must distinguish absence of evidence from evidence of failure.

### Counterexample Summary

| Counterexample | Failed assumption | AMT response |
| --- | --- | --- |
| Same normalized string | Strings identify entities. | Use candidates, context, and evidence. |
| Postal code collision | Postal route equals endpoint. | Treat postal code as broad compression. |
| Coordinate collision | 2D point is enough. | Add vertical reference. |
| Old address | Current name is all that matters. | Use lineage graph. |
| Split and merge | Address change is a function. | Use directed event graph. |
| Natural feature | Address means postal endpoint. | Include non-postal referents. |
| Context conflict | One output serves all uses. | Use context-relative optimality. |
| Narrow proof | ZK always preserves privacy. | Require anonymity set. |
| Reputation bias | History alone proves quality. | Use authority, freshness, and bias correction. |

## 24. Certified Gated Resolution and PID Issuance

PID issuance is one of the most important operational steps. A PID can become a durable reference, so issuing it too early can freeze ambiguity into infrastructure.

AMT defines a certified gate:

\[
G_\theta(s,t,c,C,\Pi,E,Q,H,Risk) \in \{true,false\}.
\]

A resolved PID-bearing output is admissible only when:

```text
candidate generation completed
candidate set non-empty
true entity not known missing
cluster is unique under threshold
score exceeds threshold
score margin exceeds threshold
quality exceeds threshold
freshness exceeds threshold
risk is below threshold
lineage is consistent
privacy predicate is not too narrow
audit record can be emitted
```

### Certificate Schema

The certificate should be machine-checkable. A minimal schema is:

```text
ResolutionCertificate {
  input_commitment
  time
  context
  candidate_generation_sources
  cluster_id
  score
  score_margin
  quality_score
  freshness_score
  risk_score
  lineage_event_refs
  unresolved_checks
  issuer
  proof_bundle_refs
}
```

The certificate does not need to disclose private address content. It can include commitments, hashes, Merkle roots, or proof references.

### Gated Resolution Theorem

The Lean-supported claim is not "the PID is true in the world." That would require complete external data. The claim is:

> If a resolver emits a PID under the certified gate, then the declared gate predicates were satisfied by the resolver's evidence state.

This is emission discipline. It is weaker than omniscience and stronger than an unchecked score.

### PID Reuse, Merge, and Split

PID reuse is safe only when the new observation is lineage-compatible with the old PID state. Merge and split require explicit events:

- `Reuse`: same resolved entity and evidence remains fresh;
- `Supersede`: new PID replaces old state after lineage event;
- `Split`: old PID branches to multiple successor PIDs;
- `Merge`: multiple old PIDs point to one successor state;
- `Retire`: PID remains historical but not current;
- `Quarantine`: PID is held due to conflict or attack suspicion.

### Audit Without Exposure

For privacy, audit should not require publishing the address. The system can publish:

- hash of normalized private input;
- proof that candidate generation ran;
- proof that unresolved checks passed;
- freshness root;
- revocation root;
- issuer trust root;
- quality threshold proof;
- duplicate nullifier.

This makes PID issuance auditable without turning the registry into a public address database.

## 25. Entropy, Compression, and Address Information

The compression view makes addresses comparable. Let \(X\) be a set of entities and \(C\) be a code space. Any code \(c : X \to C\) must satisfy:

\[
|C| \ge |X|
\]

if it is to be injective over \(X\). If \(|C| < |X|\), collisions are forced.

### Required Identification Bits

If a resolver must distinguish \(N\) entities, the lower bound is:

\[
\lceil \log_2 N \rceil.
\]

This lower bound is not the length of a postal address. It is the minimum information needed under an ideal binary code. Human addresses use shared context, language, hierarchy, and convention to compress more naturally.

### Context as Hidden Information

The expression "Main Street" may be enough inside a small village conversation. Globally, it is not enough. The missing information is not absent; it is hidden in context.

AMT therefore measures address information relative to:

- observer;
- candidate universe;
- task;
- granularity;
- time;
- data source;
- privacy policy.

### Comparative Compression

| Scheme | Compression target | Typical collision pattern | Human meaning | History support |
| --- | --- | --- | --- | --- |
| Postal code | Delivery region | Many endpoints per code | Medium | Institution-dependent |
| Street address | Social/postal target | Same name, missing unit, old name | High | Often informal |
| Coordinate | Spatial location | Vertical and semantic collapse | Low | Weak |
| Plus Code | Coordinate-like spatial code | Same vertical point | Low | Weak |
| AGID | Spatial-semantic entity or region | Registry-dependent | Medium to high | Designed-in |
| AOID | Operation relation | Credential collisions | Hidden by design | Designed-in |
| PID | Certified resolution state | Gate failure blocks issuance | Medium | Designed-in |

### Entropy Experiments

A practical experiment should compute:

```text
candidate_count(s, region, context)
required_bits = ceil(log2(candidate_count))
token_count(surface_address)
postal_code_bucket_size
natural_feature_collision_count
vertical_collision_count
```

The hypothesis is not "cities always have longer addresses." The safer hypothesis is:

> As the number of distinguishable targets and required granularity increase, the information required for unique resolution increases.

This form survives counterexamples such as short grid addresses in dense cities or vague place names in rural areas.

## 26. Multilingual and Multiscript Search

AMT separates application language from search language. A user interface may be Japanese while the search index must recognize Arabic, Latin, Cyrillic, Devanagari, Chinese, Korean, local romanization, old names, and official multilingual names.

### Search-Language Independence

Let \(L_{ui}\) be the display language and \(L_s\) be the set of search languages. AMT requires:

\[
L_{ui} \not= L_s
\]

in general. The display language is a UI preference. Search language is an evidence expansion policy.

### Name Expansion

Expansion should include:

- official name;
- local name;
- old name;
- short name;
- transliteration;
- romanization;
- script variant;
- administrative successor;
- map alias;
- postal alias;
- natural feature alias;
- colloquial name when source-backed.

### Identity-Stable Search

The goal is not to translate every address into one language. The goal is to preserve identity across forms:

```text
surface form A
surface form B
surface form C
  -> same candidate cluster when evidence supports equivalence
```

### Failure Modes

| Failure | Example | Mitigation |
| --- | --- | --- |
| Over-translation | Translating a proper noun into wrong common word | Keep named entities and language tags. |
| Over-merge | Same romanized name in different regions | Use administrative and geographic evidence. |
| Under-merge | Old official name not linked to new name | Add lineage expansion. |
| Script loss | Removing diacritics or kana distinction | Preserve normalized and raw forms. |
| UI coupling | Search only works in app language | Separate display language from search expansion. |

## 27. Official Sources, Postal Validation, and Open Data

Address verification quality depends on sources. AMT distinguishes source authority from source availability.

### Source Classes

| Class | Example | Use |
| --- | --- | --- |
| Official postal | National postal code files, postal APIs | Postal validation, routing hints. |
| Administrative | Government boundary and municipality data | Jurisdiction, lineage, official names. |
| Open map | OpenStreetMap, OpenAddresses, Overture-style data | Candidate generation and geometry. |
| Natural geography | gazetteers, hydrography, protected areas, polar datasets | Non-postal referents. |
| Carrier evidence | delivery success, route history | Operational reachability. |
| User evidence | correction, local hint, credential | Contextual refinement. |

### Verification Status Categories

The paper should not claim all countries are fully supported. A safer classification is:

```text
official-source-integrated
official-source-known-but-not-integrated
open-source-backed
format-only
needs-official-source
unsupported
```

### Postal Code Validation

Postal validation is not only regex. A postal code engine should check:

- syntax pattern;
- official source if available;
- current validity;
- locality compatibility;
- administrative hierarchy compatibility;
- address granularity;
- source freshness;
- license and update constraints.

### Country and Region Variation

Some countries have highly structured national address data. Some have partial, commercial, or restricted datasets. Some regions use descriptive addressing, rural routes, tribal lands, islands, polar stations, or informal settlements. A global system must therefore support both precision and abstention.

### Comparison with Commercial Validators

Commercial validators such as enterprise address verification APIs often have strong proprietary coverage, carrier integrations, and update pipelines. AMT should not claim to beat them without benchmark evidence. The claim should be:

> AMT provides a theory and open architecture for address verification, lineage, uncertainty, natural geography, and privacy proofs. It can be benchmarked against commercial validators, but superiority must be shown per country, use case, and data source.

## 28. Natural Geography Validation Model

Natural geography is essential because people search for named features, not only postal endpoints.

### Entity Classes

AMT should cover:

- rivers;
- waterfalls;
- lakes;
- ponds;
- wetlands;
- islands;
- archipelagos;
- deserts;
- salt flats;
- grasslands;
- forests;
- glaciers;
- ice fields;
- mountains;
- valleys;
- caves;
- bridges;
- roads;
- parks;
- protected areas;
- archaeological sites;
- heritage sites;
- Antarctic stations and polar camps.

### Geometry Types

| Feature | Geometry | Address rendering risk |
| --- | --- | --- |
| River | polyline or relation | Single point may choose wrong segment. |
| Lake | polygon | Center may be far from access point. |
| Island | polygon | Jurisdiction and settlement may differ. |
| Desert | polygon or fuzzy region | Boundary may be uncertain. |
| Mountain | point, ridge, area | Summit and access route differ. |
| Cave | point or entrance network | Entrance may be hidden or protected. |
| Heritage site | polygon or relation | Cultural boundary may differ from physical site. |

### Display Rule

A natural feature display should include:

```text
name
feature type
geometry kind
administrative containment
nearest settlement or access context
source
freshness
confidence
```

### Validation Protocol

A reproducible free validation protocol can:

1. sample features by class and continent;
2. verify that each feature has a name, type, and geometry;
3. verify administrative containment where possible;
4. detect missing or stale source metadata;
5. detect feature-type misclassification;
6. test multilingual aliases;
7. compare output against known public gazetteers or open map data;
8. classify warnings separately from errors.

### Why Natural Features Need AMT

A postal database may not include a desert, glacier, or river segment. A coordinate-only system may return a centroid. A map search system may return a label point. AMT treats these as partial observations and asks what the user needs: display, navigation, research annotation, disaster coordination, environmental monitoring, or delivery to a nearby facility.

## 29. Implementation Architecture

AMT maps naturally to software modules. A maintainable implementation should separate pure algorithms, data sources, service calls, UI state, and proof logic.

### Suggested Module Boundaries

| Domain | Responsibility |
| --- | --- |
| address parsing | tokenization, normalization, language tags |
| candidate generation | postal, map, natural geography, official sources |
| clustering | structural dissimilarity and equivalence classes |
| evaluation | scoring, thresholds, quality, freshness |
| lineage | historical graph and event transitions |
| identifier issuance | PID, AGID, AOID rules |
| proof system | ZK bundles, nullifiers, revocation, freshness |
| API layer | endpoints, schemas, rate limits |
| UI layer | display, selection, user consent |
| audit layer | privacy-safe logs and certificates |

### Implementation Contract

An AMT implementation should expose:

```text
parseAddress(input, context)
expandTokens(tokens, time, languagePolicy)
generateCandidates(expandedTokens, sources)
clusterCandidates(candidates, threshold)
evaluateClusters(clusters, context, policy)
decideOutcome(evaluation, gates)
issuePidIfAdmissible(outcome, certificate)
createProofBundle(predicate, witness, policy)
```

### Test Families

Tests should cover:

- string normalization collision;
- missing candidate;
- postal code broadness;
- vertical projection collision;
- split and merge lineage;
- natural feature rendering;
- multilingual alias expansion;
- context-dependent optimality;
- PID gate rejection;
- ZK predicate anonymity;
- duplicate nullifier non-linkability;
- revocation and freshness;
- issuer trust;
- address quality threshold.

### Why This Matters

If the app mixes UI, provider calls, address policy, proof generation, and registry state in one layer, AMT cannot be audited. The theory requires visible gates. The implementation should make those gates explicit and testable.

## 30. Security and Abuse Model

Address systems are security-sensitive because they connect physical reachability, identity, money, delivery, and personal safety.

### Threat Actors

| Actor | Goal |
| --- | --- |
| malicious registrant | register duplicate or false address |
| abusive merchant | infer private address from proof |
| rogue issuer | issue invalid credentials |
| malicious carrier | fake delivery success |
| data scraper | harvest addresses from registry |
| attacker with old proof | replay stale eligibility |
| colluding services | link proofs across contexts |
| spam agent | mass-query address validation |

### Threats and Mitigations

| Threat | AMT mitigation |
| --- | --- |
| false PID issuance | certified gates and unresolved state |
| duplicate registration | nullifier proof per address/AOID/region scope |
| address leakage | scoped disclosure and ZK predicates |
| stale credential | revocation and freshness root |
| proof replay | nonce, epoch, verifier challenge |
| issuer compromise | issuer trust registry and revocation |
| reputation manipulation | anomaly detection and source weighting |
| regional discrimination | separate low-data from low-quality |
| source poisoning | source reliability and cross-source checks |
| overbroad logging | privacy-safe audit format |

### Open-Source Security Claim

The source code can be public if security rests on secrets, credentials, and audited protocols, not on hidden implementation details. AMT should follow Kerckhoffs-style design:

> Algorithms, schemas, and gates may be public; private keys, witnesses, and private address contents remain secret.

### Privacy Failure Case

If a proof reveals "resident of a village with one household," it may reveal the address even though no text address is exposed. Therefore privacy analysis must include population, address count, candidate count, and adversarial background knowledge.

## 31. Benchmarking Against Address Verification Services

A serious AMT system should be compared against existing validators, but the benchmark must be fair.

### Benchmark Dimensions

| Dimension | Measurement |
| --- | --- |
| syntax validity | postal code and address format correctness |
| deliverability | carrier or postal deliverability |
| geocoding precision | coordinate or geometry accuracy |
| unit-level resolution | building/floor/room distinction |
| international coverage | country and language support |
| natural feature support | non-postal named referents |
| lineage support | old/new address mapping |
| privacy support | selective disclosure and ZK predicates |
| auditability | explainable resolution certificate |
| abstention quality | correct unresolved/ambiguous behavior |

### Expected Tradeoff

Commercial validators may outperform AMT implementations where they have proprietary delivery data and official integrations. AMT can outperform ordinary validators in theoretical breadth where it models:

- natural geography;
- lineage;
- uncertainty;
- context-relative optimality;
- privacy-preserving proofs;
- AGID/AOID/PID interaction.

However, this must be empirically measured. A responsible paper should not state "AMT beats all validators." It should state which dimensions AMT introduces and how to test them.

### Benchmark Protocol

1. Select countries across continents and address systems.
2. Sample urban, rural, island, mountain, desert, polar, and informal contexts.
3. Include valid, invalid, old, ambiguous, partial, and multilingual inputs.
4. Compare top result, candidate set, confidence, abstention, and explanation.
5. Evaluate privacy and audit features separately, because most validators do not provide them.

## 32. Case Studies

### Case Study A: Urban Multi-Unit Building

Input:

```text
Central Building 501
```

A string geocoder may return the building. A coordinate geocoder may return a point. AMT tries to determine whether the unit exists, whether the floor is known, whether the entrance or route is available, whether delivery history supports reachability, and whether PID issuance is admissible.

Possible outputs:

```text
Resolved(Room 501, certificate)
Ambiguous(Building-level cluster)
Unresolved(vertical_information_missing)
```

### Case Study B: Administrative Rename

Input:

```text
Old Town A, 3-4
```

If Old Town A was renamed after a merger, AMT expands old and new names, checks validity intervals, and links the old state to the current state through lineage. The output may reference current delivery data while preserving old address history.

### Case Study C: Island Address

An island may have a name, jurisdiction, archipelago, landing point, settlement, and postal rules. A simple coordinate is not enough. A delivery context may require access route and carrier service area. A heritage or environmental context may require protected area status.

### Case Study D: Desert or Ice Field

A desert or ice field may have fuzzy boundaries. A resolver should not pretend that the centroid is the address. It should display feature extent, region, source, confidence, and nearest access or settlement when relevant.

### Case Study E: Disaster Shelter

A disaster destroys ordinary address infrastructure. AMT can represent a temporary shelter as an addressable operational entity:

```text
AGID -> shelter location or zone
AOID -> authority controlling updates
PID -> current resolved shelter state
ZK proof -> eligibility or same-shelter membership
```

### Case Study F: Private E-Commerce Delivery

A buyer proves delivery eligibility without revealing the address to the merchant. The carrier later receives a scoped disclosure. The merchant sees only that delivery is possible and payment rules are satisfied.

This case illustrates AMT's privacy value: address verification and address disclosure can be separated.

## 33. Verification Results and Reproducibility

The current repository includes formal and implementation-oriented checks. The results should be treated as supporting evidence for the draft, not as final global validation.

### Commands Used

```text
lean formal\AMTCore.lean
npx tsx --test src\lib\addressMorphism.test.ts src\lib\placeSearchLanguage.test.ts src\lib\naturalAddress.test.ts src\lib\mapFeatureAddress.test.ts src\lib\pidIssuanceAudit.test.ts src\lib\privateAddressPredicateProof.test.ts
npm run verify:gis
npm run verify:gis:budget
npm run verify:gis:strict
npm run verify:pid-risk
npm run verify:postal-sources
```

### Observed Validation Summary

| Check | Result |
| --- | --- |
| Lean core | Passed in prior validation run. |
| Targeted implementation tests | 44 passed, 0 failed in prior validation run. |
| GIS normal validation | 351 features, 0 errors, 149 warnings in prior validation run. |
| GIS warning budget | Passed with registered-source warning budget. |
| GIS strict validation | Failed because warnings remain. |
| PID collision risk | Passed under 128-bit hash and \(10^{12}\) issue upper-bound model. |
| Postal source static check | Passed static source registration checks in prior run. |

### Interpretation

The important point is not that all validation is complete. It is that the system already distinguishes:

- formal facts;
- implementation tests;
- GIS warnings;
- strict validation failures;
- static source checks;
- empirical work still needed.

This is the correct scientific posture. A theory that exposes warnings is stronger than a system that hides uncertainty.

### Claim Status

| Claim | Current status |
| --- | --- |
| Non-injective observation blocks perfect resolution | Formal theorem. |
| Missing candidate blocks candidate-only resolution | Formal/implementation-supported. |
| Gated PID emission is auditable | Formal gate plus tests. |
| Natural geography can be represented | Implementation-supported, empirically incomplete. |
| Multilingual search can improve recall | Implementation-supported, needs broader benchmark. |
| Address entropy increases with required granularity | Mathematical lower bound, empirical work needed. |
| Commercial-validator superiority | Not claimed; benchmark required. |

## 34. Data Governance and Licensing

AMT depends on data, and data governance is part of the theory.

### License Classes

| Data type | License risk |
| --- | --- |
| official postal files | may restrict redistribution or require registration |
| open map data | license attribution and share-alike obligations may apply |
| carrier history | private and commercially sensitive |
| user corrections | privacy and consent required |
| natural geography datasets | source-specific attribution |
| credential registries | trust and revocation policy |

### Governance Principles

1. Keep source metadata with every candidate.
2. Store license and freshness separately from confidence.
3. Do not mix private carrier evidence into public open data.
4. Keep personal address material out of public registries.
5. Allow source removal or quarantine.
6. Prefer reproducible open validation where possible.
7. Mark countries and regions by support status instead of pretending uniform coverage.

### Address DAO and Rule Governance

If an Address DAO or decentralized governance model is used, it should govern rules and registries, not private address contents. Suitable governance targets include:

- rendering rules;
- source trust policies;
- proof predicate namespaces;
- issuer trust registry;
- revocation-root anchoring policy;
- translation and transliteration rules;
- country-specific schema versions.

Unsuitable public governance targets include:

- private residence data;
- hidden delivery histories;
- personal AOID secrets;
- exact private proof witnesses.

## 35. Roadmap and Open Problems

AMT remains open in several areas.

### Formal Work

- prove finite code-space collision with cardinality assumptions;
- prove context-conflict no-free-lunch theorem;
- formalize append-only lineage preservation;
- formalize equivalence-class stability under renaming;
- formalize proof-bundle domain separation;
- connect Lean theorems to executable tests.

### Empirical Work

- build a multilingual benchmark across continents;
- measure candidate entropy in urban/rural/island/desert/mountain/polar contexts;
- compare official postal source coverage;
- evaluate natural feature rendering quality;
- benchmark commercial validators where legally possible;
- measure unresolved quality, not only resolved accuracy.

### Implementation Work

- make certified gates first-class API objects;
- isolate AGID/AOID/PID modules;
- make proof bundle registry stable;
- implement privacy threshold checks;
- add source freshness dashboards;
- support country-by-country official data integration;
- expose MCP and agent-facing APIs safely.

### Research Questions

1. How should address reputation avoid structural bias against low-data regions?
2. What anonymity threshold is sufficient for private address predicates?
3. Can a global address quality score be calibrated without erasing local differences?
4. How should temporary disaster addresses expire or migrate?
5. How should natural features with disputed names be represented?
6. Can address lineage support legal evidence without becoming a public surveillance tool?

## 36. Limitations

AMT has several limitations.

First, it cannot guarantee global candidate completeness. Some countries, regions, buildings, temporary shelters, and natural features lack reliable data.

Second, official postal data are uneven. Some sources are open, some are restricted, some require registration, and some are not updated frequently.

Third, address lineage is only as good as the available history. If a historical transition was never recorded, AMT can infer possible links but cannot prove them.

Fourth, ZK address proofs require careful predicate design. A proof that reveals too narrow a region may leak the address by inference.

Fifth, reputation systems can be attacked or biased. Address reputation must not become a proxy for excluding low-data regions.

Sixth, natural geography is difficult. Feature names are multilingual, sometimes disputed, sometimes seasonal, and often represented differently across datasets.

Seventh, vertical references require building-level and access-level data that may be private or unavailable.

These limitations are not failures of the theory. They are the reason the theory requires unresolved states, evidence thresholds, freshness, audit, and privacy controls.

## 37. Discussion

AMT reframes address resolution as a controlled inference problem. Its most important practical implication is that abstention is not optional. A resolver that cannot abstain will eventually produce false precision.

The second implication is that address identity is not a single relation. Physical, social, legal, delivery, administrative, and proof identities may diverge. Systems that collapse them into one identifier will either lose information or create privacy and governance risks.

The third implication is that address systems can become privacy-preserving. A person should often be able to prove delivery eligibility, country residence, city residence, same-address membership, or disaster support eligibility without revealing a street address. This is especially important for e-commerce agents, humanitarian systems, credential marketplaces, and decentralized logistics.

The fourth implication is that AGID and AOID should be designed as layered infrastructure, not as simple address codes. AGID can serve spatial-semantic reference and routing; AOID can serve ownership, delegation, credential, and privacy proof; PID can serve persistent resolution state; ZK proof bundles can serve selective disclosure.

## 38. Conclusion

Address Morphism Theory proposes that addresses are compressed, time-dependent, context-relative, and proof-capable references to addressable entities. The theory begins with an impossibility theorem: under non-injective observation or incomplete candidates, no unconditional perfect resolver exists. This result motivates a safer architecture based on candidate generation, structural clustering, unresolved states, lineage graphs, admissible PID issuance, and private proofs.

The theory also broadens the address concept beyond postal strings and coordinates. It includes buildings, rooms, roads, bridges, mountains, rivers, lakes, islands, deserts, heritage sites, temporary shelters, social institutions, and three-dimensional spaces. It connects traditional address systems with AGID, AOID, PID, postal codes, Plus Codes, DID, and zero-knowledge credentials.

The central practical lesson is simple: a trustworthy address system must know when not to answer. It must preserve history, distinguish context, quantify uncertainty, and support privacy. AMT provides the mathematical and architectural language for building such systems.

## Appendix A. Core Notation

| Symbol | Meaning |
| --- | --- |
| \(S\) | Surface address expression space |
| \(T\) | Parsed token space |
| \(X_t\) | Addressable entities at time \(t\) |
| \(\pi\) | Parsing morphism |
| \(\epsilon_t\) | Temporal and multilingual expansion |
| \(\Gamma_t\) | Candidate generation |
| \(D_t\) | Structural dissimilarity |
| \(\Pi_{\delta,t}\) | Cluster partition at threshold \(\delta\) |
| \(E_t\) | Evaluation function |
| \(\mathcal{O}\) | Resolution outcome space |
| \(\iota_t\) | Identifier issuance morphism |
| \(L\) | Address lineage graph |
| \(P(a)\) | Public predicate over private address \(a\) |

## Appendix B. Claim Status

| Claim | Status |
| --- | --- |
| Non-injective observations prevent perfect resolution | Mathematically proven by elementary argument; direct Lean extension recommended |
| Missing candidate prevents complete resolution | Lean-supported in current formal core |
| Normalization collision prevents perfect resolution | Lean-supported in current formal core |
| Projection collision prevents vertical resolution | Lean-supported in current formal core |
| Split cannot be represented by a single-valued transition | Lean-supported in current formal core |
| Predicate proof can hide private value under non-singleton predicate | Lean-supported in current formal core |
| Address entropy grows with distinguishable target count and granularity | Mathematical lower bound plus GIS experiment needed |
| Context-relative optimality prevents universal resolver | Mathematical theorem plus evaluation experiment needed |
| Address lineage conservation | Requires append-only lineage formalization plus historical data validation |
| Address reputation | Empirical and security-sensitive; implementation validation required |

## Appendix C. Verification Command Map

This appendix records how the claims in the paper should be checked in the current implementation environment. The purpose is reproducibility. A mathematical paper can state a theorem, but an address system also needs executable checks because the theory depends on data quality, geographic coverage, source freshness, and security gates.

The verification map separates proof, static validation, empirical validation, and implementation behavior.

| Verification family | Command or method | What it checks | What it does not check |
| --- | --- | --- | --- |
| Lean formal core | `lean formal/AMTCore.lean` | Abstract impossibility, missing candidates, collision patterns, split relation discipline, predicate hiding lemmas. | Real-world source completeness, postal authority freshness, map geometry accuracy. |
| Targeted TypeScript tests | Targeted library test suite | Algorithmic behavior for candidate generation, language expansion, natural feature recognition, PID audit, and private predicate proofs. | Full global coverage and adversarial data poisoning. |
| GIS validation | `npm run verify:gis` | Open geographic data shape, feature count, geometry parsing, and basic consistency. | Legal correctness of every feature name, all disputed boundaries, all private building interiors. |
| GIS warning budget | `npm run verify:gis:budget` | Whether warnings remain within an acceptable engineering budget. | Whether the warning budget should be treated as final for a production deployment. |
| GIS strict mode | `npm run verify:gis:strict` | Whether all GIS warnings have been eliminated. | It may fail even when the dataset is usable; failure marks improvement work. |
| PID collision risk | `npm run verify:pid-risk` | Birthday-bound risk for issued identifiers under the configured hash size and issuance bound. | Semantic mis-resolution before PID issuance. |
| Postal source registry | Postal source verification script | Static integrity of registered postal source metadata, official source coverage, API metadata, and probe target lists. | Runtime availability of every external API at all times. |

The corresponding command list is:

```text
lean formal/AMTCore.lean
npx tsx --test \
  src/lib/addressMorphism.test.ts \
  src/lib/placeSearchLanguage.test.ts \
  src/lib/naturalAddress.test.ts \
  src/lib/mapFeatureAddress.test.ts \
  src/lib/pidIssuanceAudit.test.ts \
  src/lib/privateAddressPredicateProof.test.ts
npm run verify:gis
npm run verify:gis:budget
npm run verify:gis:strict
npm run verify:pid-risk
npm run verify:postal-sources
```

A claim should not be upgraded from "hypothesis" to "validated engineering claim" unless at least one command or proof artifact supports it. A claim should not be upgraded to "mathematical theorem" unless it is expressible independently of empirical data.

### Interpreting Validation Outcomes

The following interpretation rule is recommended.

1. A passing Lean proof establishes only the abstract statement as modeled.
2. A passing unit test establishes only the behavior represented by the fixtures.
3. A passing GIS validation establishes that the current dataset is structurally usable.
4. A warning budget pass establishes deployability under an explicit quality policy, not perfection.
5. A strict validation failure is not a theory failure; it is a data quality improvement queue.
6. A postal source pass establishes registry integrity, not that every country has open official data.

This prevents a common mistake: treating a working demo as proof of global address resolution. AMT explicitly rejects that conclusion. The correct conclusion is conditional: within the tested model, source set, and threshold policy, the resolver can make audited decisions and can abstain when evidence is insufficient.

### Minimum Reproducibility Bundle

A paper release should include the following artifacts:

- the Markdown source of the paper;
- the generated TeX file;
- the generated PDF;
- the Lean file and Lean toolchain version;
- the test command list and observed pass/fail summary;
- the GIS validation summary;
- the postal source registry summary;
- the PID collision-risk assumptions;
- a list of claims that remain empirical hypotheses.

Without this bundle, readers cannot tell which statements are formal, which are empirical, and which are design proposals.

## Appendix D. Lean Formalization Roadmap

The current Lean formalization should be kept intentionally small. Its value is not to encode every postal rule. Its value is to prevent the core logic from being weakened by optimistic prose.

### Core Objects

The following abstract objects are sufficient for the first formal layer.

| Object | Suggested Lean role | Paper connection |
| --- | --- | --- |
| `Entity` | Type of true addressable entities. | \(X\), \(X_t\) |
| `Observation` | Type of observed values. | \(Y\), \(Y_t\) |
| `observe : Entity -> Observation` | Observation function. | \(O\), \(O_t\) |
| `Resolver` | Function or partial function from observations to entities or outcomes. | \(R\), \(R_\theta\) |
| `CandidateSet` | Finite or set-valued candidate generator output. | \(\Gamma_t\) |
| `Outcome` | Resolved, ambiguous, unresolved, rejected. | \(\mathcal{O}\) |
| `LineageEdge` | Relation between address states. | \(L\) |
| `Predicate` | Public predicate over private address value. | \(P(a)\) |

The first Lean layer should avoid real numbers, coordinates, polygons, language rules, and cryptographic primitives. Those are better checked by tests and domain tools. Lean should formalize the discrete safety properties that must hold regardless of data source.

### Theorem Targets

| Theorem target | Formal statement shape | Why it matters |
| --- | --- | --- |
| Observation collision impossibility | If `observe x1 = observe x2` and `x1 != x2`, no resolver can be perfect for both. | Prevents unconditional perfect resolver claims. |
| Normalization collision | A non-injective normalization cannot support perfect identity recovery by itself. | Prevents string normalization from being mistaken for resolution. |
| Candidate omission | If the true entity is not in the candidate set, any resolver restricted to that set cannot return the true entity. | Forces candidate completeness evidence. |
| Split non-functionality | A one-valued successor function cannot represent one old state with two valid successors. | Justifies lineage graph. |
| Gate discipline | If a required gate fails, `Resolved` is not admissible. | Protects PID issuance. |
| Predicate non-uniqueness | If a public predicate has at least two possible private witnesses, revealing the predicate does not identify a unique witness. | Supports ZK address privacy constraints. |
| Nullifier uniqueness | For a fixed domain and secret, the nullifier is stable; for different domains, it must be separated. | Prevents cross-context proof linking. |

### Suggested Lean Module Layout

```text
formal/
  AMTCore.lean
  AMTObservation.lean
  AMTCandidates.lean
  AMTLineage.lean
  AMTGates.lean
  AMTPrivacyPredicate.lean
```

`AMTCore.lean` should contain the minimal impossibility theorem and definitions. Later modules should import the core and add one idea at a time. This keeps the proof base maintainable and avoids a large monolithic formal file.

### What Lean Should Not Try To Prove

Lean should not try to prove that OpenStreetMap contains every island, that a postal API is current, or that a commercial carrier will accept a parcel. These are empirical, legal, or operational claims. Lean should instead prove that if the source status is unknown, the resolver must not silently convert that unknown status into a resolved PID.

This distinction is central to the paper. Formal verification protects the decision logic. GIS and postal validation protect the evidence. Security review protects the adversarial surface. No single tool replaces the others.

## Appendix E. GIS, Natural Geography, and Postal Validation Protocol

AMT expands the address concept beyond postal endpoints. Therefore the validation protocol must cover natural, social, and infrastructural referents as well as postal addresses.

### Natural Feature Classes

The following classes should be treated as addressable search referents when they have stable names or map-recognized identities.

| Class | Examples | Typical geometry | Address behavior |
| --- | --- | --- | --- |
| Hydrographic line | river, stream, canal | polyline | Searchable route or feature, not necessarily deliverable. |
| Hydrographic point | waterfall, spring | point or short line | Searchable landmark, may support navigation. |
| Hydrographic area | lake, pond, reservoir, lagoon, salt lake | polygon | Searchable area, may need shoreline or access point. |
| Wetland | marsh, swamp, bog, mangrove | polygon | Searchable area, often seasonal or protected. |
| Cryosphere | glacier, ice field, ice shelf | polygon or line | Searchable natural feature, may shift over time. |
| Dryland | desert, dune field, salt flat, badland | polygon | Searchable area, often weak postal coverage. |
| Vegetation area | forest, grassland, meadow, scrubland | polygon | Searchable region, sometimes administrative or protected. |
| Terrain feature | mountain, valley, cliff, cave, canyon | point, line, polygon, or relation | Often named, may need access point. |
| Cultural heritage | ruin, monument, archaeological site, world heritage site | point, polygon, or relation | Searchable cultural referent; legal boundary may differ from common name. |
| Infrastructure | road, bridge, tunnel, station, port, lock, dam | line, point, polygon | Searchable and sometimes deliverable to access points. |

The display rule should be conservative: show the feature name and its containing locality or region when known; show geometry type and confidence internally; do not fabricate a postal address if no postal endpoint exists.

### GIS Quality Checks

The GIS validation protocol should check:

- geometry parses without fatal errors;
- required feature fields exist;
- feature type maps to an AMT entity class;
- named features can be indexed by multilingual aliases when available;
- geometry extent is plausible;
- containment hierarchy can be computed or marked unknown;
- source license is compatible with the intended use;
- warnings are counted and categorized;
- strict mode is available even if it fails during early development.

Warnings should be classified as follows.

| Warning class | Meaning | Action |
| --- | --- | --- |
| Missing optional name | Feature has geometry but lacks a display name. | Search may ignore it; geometry may still support containment. |
| Missing multilingual alias | Name exists in only one script or language. | Search quality reduction. |
| Ambiguous class | Feature type maps to multiple AMT classes. | Require disambiguation rule. |
| Weak containment | Parent region cannot be determined confidently. | Avoid high-confidence display or proof claims. |
| License caution | Source may be usable only under conditions. | Block commercial integration until reviewed. |
| Geometry anomaly | Geometry is invalid, self-intersecting, empty, or unexpectedly large. | Exclude or quarantine. |

### Postal Validation Protocol

Postal validation is different from natural feature validation. It is not enough to know that a place exists. The system must know whether an address is deliverable under a postal or carrier rule.

The protocol should distinguish:

1. format validation: the postal code shape is legal;
2. locality validation: the postal code belongs to a region or locality;
3. deliverability validation: a carrier or postal authority can deliver to the endpoint;
4. unit validation: the building, floor, room, locker, or mailbox is known;
5. freshness validation: the source is current enough for the requested use;
6. authority validation: the source is official, open, restricted, commercial, community, or derived.

The same country may support only some of these levels. A format file may validate a postal code pattern while still failing endpoint validation. AMT should expose this internally as quality and evidence levels, not as a user-facing score.

### Island, Desert, Mountain, and Remote Region Rule

Remote regions should not be treated as low quality merely because they have sparse address events. The resolver should separate:

- sparse evidence;
- negative evidence;
- weak postal coverage;
- strong natural feature recognition;
- strong official boundary recognition;
- weak delivery endpoint recognition.

For example, a named island may have high geographic recognition but low unit-level postal validation. A desert camp may have weak formal address structure but strong route and coordinate evidence. An Antarctic research station may have no ordinary civic address, yet it can be represented by station identity, operating country, coordinates, logistics route, and temporal operational status.

## Appendix G. Benchmark and Evaluation Protocol

AMT should be compared with address verification and geocoding services using a benchmark that does not hide the theory's strengths or weaknesses.

### Benchmark Dataset Families

| Dataset family | Purpose | Example cases |
| --- | --- | --- |
| Ordinary urban addresses | Baseline parsing and validation. | apartment, office, mixed-use building. |
| Rural addresses | Sparse evidence and route ambiguity. | farmhouse, rural road, village locality. |
| Island addresses | Natural containment and logistics routing. | small island, archipelago, ferry-dependent delivery. |
| Desert and dryland addresses | Weak postal structure and strong natural geography. | desert camp, salt flat, remote station. |
| Mountain and valley features | Terrain recognition. | named mountain, trailhead, valley settlement. |
| Water features | Non-postal searchable references. | lake, river, waterfall, wetland. |
| Heritage sites | Cultural and legal boundary distinction. | ruin, archaeological site, world heritage area. |
| Administrative history | Lineage and old-name search. | renamed town, merged municipality, split ward. |
| Vertical addresses | 3D distinction. | floors, basement, locker, unit. |
| Privacy proofs | Selective disclosure. | country residence, city residence, delivery eligibility. |

### Metrics

| Metric | Definition | AMT expectation |
| --- | --- | --- |
| Top-1 accuracy | Correct entity is first resolved output. | Should improve with evidence and context. |
| Top-k recall | Correct entity appears in candidate set. | Core candidate generation metric. |
| Abstention precision | Unresolved outputs are genuinely unsafe to resolve. | Should be high. |
| False-resolution rate | Resolver emits wrong resolved entity. | Must be minimized even at cost of abstention. |
| Lineage recall | Old and successor states are linked correctly. | Depends on historical data. |
| Natural feature recall | Named natural features are recognized. | Should exceed postal-only systems. |
| Vertical distinction | Units sharing a 2D coordinate are separated. | Requires vertical evidence. |
| Proof soundness | Public proof matches private predicate. | Must be enforced by circuit and registry. |
| Privacy leakage | Public proof narrows witness set too much. | Must be bounded by threshold policy. |
| Source transparency | System can explain evidence source class. | Should be stronger than opaque APIs. |

### Comparison with Commercial Validators

Commercial address validators such as Loqate, Experian, Melissa, and Smarty are strong in postal standardization, deliverability, and business workflows. AMT should not claim to beat them everywhere at once. A safer claim is:

AMT can exceed conventional validators in areas where the task requires unresolved safety, lineage, natural feature search, vertical identity, address-derived privacy proofs, and explicit source governance. It may lag commercial validators in countries where proprietary delivery databases provide higher endpoint coverage.

This is a stronger and more credible research position than claiming universal superiority. The goal is not to imitate existing validators. The goal is to provide a theory and engine that can combine official sources, open data, proof systems, and abstention discipline.

### Benchmark Reporting Rule

Every benchmark should report:

- country or region;
- source class;
- source date;
- address type;
- candidate count;
- resolved, ambiguous, unresolved, or rejected status;
- whether a PID was issued;
- whether a proof predicate was available;
- whether a natural or vertical feature was involved;
- comparison baseline.

Without these fields, a high accuracy score may hide unsafe behavior. A resolver that always returns something may appear strong while producing false precision. AMT explicitly treats false precision as a failure.

## Appendix H. Glossary

| Term | Meaning |
| --- | --- |
| Address | A compressed, context-sensitive, time-dependent reference to an addressable entity. |
| Addressable entity | A physical, social, institutional, natural, virtual, or operational object that can be referred to by an address-like expression. |
| Address expression | A surface string, code, coordinate label, identifier, or mixed input supplied by a user or system. |
| Address lineage | A directed history graph of address states and transition events. |
| Address entropy | The information required to distinguish targets under a context and candidate set. |
| AGID | Address Geographic Identifier, used for spatial-semantic reference and routing. |
| AOID | Address Operation Identifier, used for ownership, delegation, credential, and proof operations. |
| PID | Persistent Identifier issued only after AMT gates permit stable resolution. |
| Candidate generation | The process of producing possible entities from parsed and expanded address evidence. |
| Cluster | A group of candidates treated as equivalent or near-equivalent under a structural distance threshold. |
| Unresolved | A safety state meaning the resolver lacks sufficient evidence to resolve. |
| Ambiguous | A safety state meaning multiple candidates remain plausible. |
| Rejected | A state meaning the input fails required policy, source, or validity checks. |
| Structural dissimilarity | A directed distance over geographic, administrative, lexical, feature, temporal, and operational attributes. |
| Context | The task perspective, such as delivery, emergency response, administration, property, privacy proof, or search. |
| ZK Address Proof | A proof that an address satisfies a public predicate without revealing the address. |
| Delivery eligibility proof | A proof that an address or AOID is inside a deliverable region or policy scope. |
| Nullifier | A domain-separated value used to prevent duplicate registration or repeated anonymous actions without revealing identity. |
| Freshness root | A cryptographic root representing a recent accepted state of credential or source validity. |
| Revocation root | A cryptographic root representing revoked credentials or invalidated claims. |
| Source class | The authority category of evidence, such as official, postal, carrier, open-source, community, commercial, or derived. |
| False precision | Returning a specific answer when the evidence does not justify specificity. |

## Appendix I. References to Add

This draft intentionally leaves bibliographic references as a future editing task. The final paper should cite work in the following areas:

- geocoding and address normalization;
- GIS topology and spatial databases;
- postal address standards and country-specific address formats;
- OpenStreetMap and open geographic data governance;
- information theory and coding theory;
- persistent identifiers;
- decentralized identifiers and verifiable credentials;
- zero-knowledge proofs and selective disclosure credentials;
- graph models for historical geography and administrative boundary changes;
- privacy-preserving location proof systems.



## 39. Companion Boundaries: AGID/AOID and ZK Address Proofs

AMT is the core semantic theory. Applied identifier systems and cryptographic proof systems should be specified separately.

- PID is the AMT reference-class identifier.
- AGID is an application-layer public geospatial or address reference standard.
- AOID is an application-layer private owner, recipient, operation, or delivery-control reference.
- ZK Address Proofs use AMT reference classes and attributes as private witnesses, but cryptographic security requires circuits, credential policies, nullifiers, revocation, freshness, and anonymity-set analysis.

The core paper may define the boundary, but it should not claim that AGID/AOID standards or ZK protocols are completed by AMT itself.




## Appendix J. Source Adoption Map

The following appendix records how the Japanese source PDF and accumulated project records are used in this English manuscript.


## J.1 Source Adoption and Claim Map

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



## Appendix K. Mathematical Inventory

The following appendix collects the definitions, axioms, propositions, lemmas, theorems, corollaries, and counterexamples retained for the full paper.


## K.1 Mathematical Inventory

Date: 2026-06-06

This file collects the definitions, axioms, propositions, lemmas, theorems, and
corollaries that should appear in the full English AMT paper. It separates
formally verified items from empirical or programmatic claims.

## Core Notation

| Symbol | Meaning |
| --- | --- |
| \(t\) | time or version index |
| \(S_t\) | surface address-expression space at time \(t\) |
| \(X_t\) | addressable entities at time \(t\) |
| \(O_t : X_t \to S_t\) | observation or expression map |
| \(u \in S_t\) | user or system input expression |
| \(\Phi_t(u)\) | candidate generator output |
| \(N_t\) | normalized address candidate space |
| \(D_{c,t}\) | context-dependent directed structural dissimilarity |
| \(\Pi_{\delta,t}\) | clustering or partition induced by threshold \(\delta\) |
| \(\kappa_t\) | quotient or cluster projection |
| \(C_t(u)\) | candidate clusters for input \(u\) |
| \(E_t(c;u,\chi)\) | evidence or energy score for cluster \(c\) |
| \(\chi\) | context, including purpose, language, jurisdiction, and risk tolerance |
| \(\tau\) | quality, energy, or risk threshold |
| \(\Delta\) | separation margin between best and second-best clusters |
| \(Y_t(u)\) | resolution outcome |
| \(\psi_t(c)\) | PID issuance map |
| \(L_t\) | address lineage graph or ledger |
| \(Q_t\) | internal quality score |

## Definitions

### Definition 1: Addressable Entity

An addressable entity is any physical, social, institutional, operational,
natural, cultural, or virtual referent that can be the target of an address-like
expression in a declared context.

### Definition 2: Surface Address Expression

A surface address expression is any human- or machine-supplied reference string
or code, including postal address text, postal code, facility name, coordinate
label, natural place name, historical name, PID, AGID-like public reference, or
AOID-like private reference pointer.

### Definition 3: Observation Map

An observation map \(O_t : X_t \to S_t\) assigns to an entity an observable
address expression or expression class. AMT does not assume that \(O_t\) is
injective.

### Definition 4: Candidate Generator

\(\Phi_t : S_t \to \mathcal{P}_{fin}(N_t)\) maps an input expression to a finite
candidate set. Candidate finiteness is required for algorithmic selection, but
candidate completeness is an empirical property.

### Definition 5: Directed Structural Dissimilarity

\[
D_{c,t}(a,b) =
  \lambda_g d_g(a,b) +
  \lambda_a d_a(a,b) +
  \lambda_l d_l(a,b) +
  \lambda_y d_y(a,b) +
  \lambda_v d_v(a,b) +
  \lambda_h d_h(a,b)
\]

where components may include geometry, administrative hierarchy, language,
entity type, vertical reference, and history. This object should be called a
directed dissimilarity or cost, not necessarily a metric.

### Definition 6: Cluster Projection

\(\kappa_t : N_t \to \Pi_{\delta,t}\) maps normalized candidates into reference
clusters under the declared structural partition.

### Definition 7: Resolution Outcome

A resolver returns one of:

```text
resolved(entity or cluster)
ambiguous
unresolved
rejected
```

Only the resolved state may carry a PID candidate.

### Definition 8: Certified PID Issuance

PID issuance is admissible only if candidate membership, cluster separation,
quality, freshness, risk, and audit gates are satisfied.

### Definition 9: Address Lineage Graph

A lineage graph \(L_t=(V_t,E_t)\) records address states and accepted transitions,
including rename, split, merge, retirement, reassignment, and successor links.

### Definition 10: Context-Relative Optimality

A resolver is optimal in context \(\chi\) if it minimizes the declared loss,
risk, or energy function for that context. AMT does not assume that one resolver
is optimal for all contexts.

### Definition 11: Source Validation State

Each evidence source has a validation state:

```text
accepted | unknown | rejected
```

Unknown and rejected sources must not be silently promoted to verified claims.

### Definition 12: Internal Quality Score

An internal quality score \(Q_t\) is a system-side risk and confidence signal
used to hide, warn, revalidate, or accept a candidate. It is not itself a proof
of truth.

## Axioms and Assumptions

### Axiom A1: Finite Operational Candidate Set

For every resolvable input under a fixed runtime policy, \(\Phi_t(u)\) is finite.

### Axiom A2: Explicit Non-Emission States

The resolver must be able to return non-emitting states when evidence is
insufficient.

### Axiom A3: Source-Bound Evidence

Every evidence item has source, time, jurisdiction, license, coverage, and
freshness metadata.

### Axiom A4: Context Declaration

Each resolution request declares a context \(\chi\), or uses a default context
whose assumptions are documented.

### Axiom A5: PID Issuance Requires a Gate

A PID-bearing output may be emitted only after the declared gate predicates pass.

### Axiom A6: Lineage Transitions Are Relations

Address history may be relational. Split and merge events are not forced into a
single-valued successor function.

### Axiom A7: Tie-Breaking Is Declared

When a finite set has multiple minimizers under a score, deterministic selection
requires an explicit ordering or an ambiguous outcome.

## Propositions

### Proposition P1: Candidate Soundness

If an outcome emits entity \(e\) under input \(u\), then \(e\) must belong to the
candidate set or candidate cluster derived from \(\Phi_t(u)\).

Status: Lean-supported by `CandidateSound`, `OutcomeCandidateSound`, and related
membership theorems.

### Proposition P2: Missing Candidate Prevents Correct Emission

If the true entity is not in the candidate set, no candidate-only resolver can
select it.

Status: Lean-supported.

### Proposition P3: Low Quality Prevents Safe Issuance

If quality, freshness, risk, or separation gates fail, a safe resolver should not
issue a PID.

Status: Lean-supported at gate level; production calibration remains empirical.

### Proposition P4: Source Rejection Prevents Verified Claims

Unknown or rejected source status cannot support a verified address claim.

Status: Lean-supported in `AMTPaperExtensions.lean`.

### Proposition P5: Natural Feature Reference Is Type-Dependent

Natural and cultural referents require feature-type-specific representation:
point, line, polygon, volume, graph, or label.

Status: implementation-supported in current scope; global coverage remains open.

## Lemmas

### Lemma L1: Non-Emitting Outcomes Resolve No Entity

`ambiguous`, `unresolved`, and `rejected` do not resolve to any entity.

Status: Lean-proved.

### Lemma L2: Gate Failure Prevents PID Emission

Missing candidate evidence, high energy, low margin, low quality, stale
freshness, or high risk prevents admissible PID issuance.

Status: Lean-proved for the abstract gate.

### Lemma L3: Normalization Collision Blocks Perfect Resolution

If two distinct entities collapse to the same normalized observation, a resolver
that sees only the normalized observation cannot be perfect for both.

Status: Lean-proved.

### Lemma L4: Projection Collision Blocks Vertical Resolution

If two distinct vertical entities share the same horizontal projection, a
horizontal-only resolver cannot preserve their identity.

Status: Lean-proved.

### Lemma L5: Append-Only Lineage Preserves Old Nodes and Edges

If a lineage graph is extended append-only, all prior nodes, edges, and finite
traces remain present.

Status: Lean-proved.

### Lemma L6: Reference-Preserving Rename Preserves Reference Class

If a rename changes notation but not reference, the renamed expression remains in
the same reference class.

Status: Lean-proved.

### Lemma L7: Positive Evidence Monotonicity

For the simplified positive-evidence component, adding positive observations
cannot lower the positive-evidence score.

Status: Lean-proved. Production reputation models require separate calibration.

## Theorems

### Theorem T1: Address Reference Impossibility

If two distinct entities produce the same observable address expression, no
condition-free resolver that sees only that expression can be correct for both.

Status: Lean-proved as `no_condition_free_perfect_resolver`.

### Theorem T2: Compression Collision Implies No Perfect Decoder

If an address representation compresses two distinct raw entities to the same
code, no decoder using only that code can perfectly reconstruct every raw
entity.

Status: Lean-proved.

### Theorem T3: Injective PID Has No Collision

If PID assignment is injective, equal PID implies equal entity.

Status: Lean-proved. Bounded hash PID requires birthday-bound risk analysis.

### Theorem T4: Observation-Based PID Collides Under Observation Collision

If PID is a pure function of a non-injective observation, distinct entities with
the same observation receive the same PID.

Status: Lean-proved.

### Theorem T5: Function Cannot Represent Split

If one historical state splits into two successor states, a single-valued
transition function cannot represent both successors without loss.

Status: Lean-proved.

### Theorem T6: Context Conflict Prevents Absolute Address Optimality

If two contexts have conflicting strict optima, no single address rendering or
resolver is absolutely optimal for both.

Status: Lean-proved.

### Theorem T7: Accepted GIS Certificate Has No Hard Errors

If the generated GIS certificate is accepted under a zero-error budget, then the
recorded GIS error count is zero.

Status: Lean-GIS bridge; not a direct proof of all geography.

### Theorem T8: Conditional AMT Well-Definedness

Under finite candidates, declared clustering, finite scoring, tie policy or
separation margin, and successful gates, the AMT resolution pipeline produces a
well-defined model-internal outcome.

Status: theorem shape supported by Lean fragments; full pipeline is a paper
theorem assembled from assumptions.

### Theorem T9: Safe PID Issuance Discipline

If a PID-bearing output is emitted by the certified gate, the declared
admissibility predicates were satisfied.

Status: Lean-proved at gate level and implementation-supported.

### Theorem T10: AMT Does Not Imply Cryptographic Privacy

AMT may produce attributes and audit envelopes, but cryptographic privacy
requires a separate proof system, credential policy, and leakage analysis.

Status: conceptual theorem/proposition for the paper; ZK details belong to a
companion paper.

## Corollaries

### Corollary C1: Unresolved Is Theoretically Necessary

Because condition-free perfect resolution is impossible under non-injective
observation, a safe resolver requires an explicit abstention state.

### Corollary C2: Postal Codes Cannot Be Universal Identifiers

Postal codes are useful compression schemes, but because they intentionally map
many referents to one code, they cannot identify all addressable entities.

### Corollary C3: Coordinate Codes Cannot Preserve All Address Identity

Coordinate or grid codes lose social, vertical, historical, and institutional
information unless supplemented by additional attributes.

### Corollary C4: Candidate Recall Is a First-Class Evaluation Metric

Since missing candidates cannot be recovered by downstream scoring, candidate
recall must be benchmarked directly.

### Corollary C5: Quality Scores Are Control Signals, Not Truth

A quality score may drive warnings, hiding, revalidation, or threshold policies,
but it is not a standalone proof of real-world correctness.

### Corollary C6: AGID/AOID/ZK Are Applications of AMT, Not AMT Itself

Applied identifiers and proof systems may use AMT outputs, but they require
separate specifications and security claims.

## Counterexamples to Include

| Counterexample | Failed assumption | AMT response |
| --- | --- | --- |
| Same normalized string for two places | Injective observation | ambiguous or additional evidence |
| Same postal code for many endpoints | Compression as identity | candidate expansion and clustering |
| Same coordinate, different floors | 2D projection preserves identity | vertical reference layer |
| Old address still appears in documents | Current-only address model | lineage graph |
| One town splits into two | Functional history | relational lineage |
| Two municipalities merge | One-to-one history | many-to-one lineage |
| Lake or desert has no postal endpoint | Postal endpoint only | natural referent type |
| Delivery and emergency contexts disagree | Universal optimum | context-relative scoring |
| Narrow private predicate identifies user | ZK hides all inference | anonymity-set and predicate granularity policy |
| Delivery failure caused by weather | Delivery failure equals address falsehood | failure-cause evidence model |

## Verification Map

| Claim family | Lean | GIS | Implementation tests | Empirical benchmark | Security audit |
| --- | --- | --- | --- | --- | --- |
| Non-injective impossibility | yes | no | no | examples only | no |
| Candidate gates | yes | no | yes | recall needed | no |
| Structural clustering | partial | no | yes | yes needed | no |
| Lineage preservation | yes | no | partial | real history needed | no |
| Natural geography | no | partial | yes | coverage needed | no |
| Vertical reference | yes for collision | no | partial | case studies needed | no |
| PID hash collision risk | ideal theorem + script | no | yes | no | no |
| Source governance | yes for unknown/rejected | partial | yes | live source audit needed | no |
| ZK proof bundles | policy-level only | no | yes | no | full cryptographic audit needed |

## Appendix L. Extended Worked Examples

This appendix gives longer examples that can be used in a full paper draft.
They are not additional theorems. Their role is to make the abstract objects
of AMT visible: observation, normalization, candidate generation, structural
distance, clustering, evaluation, unresolved judgment, lineage, and persistent
identifier issuance.

## L.1 Urban Multi-Unit Building

Consider a building with the same street address for multiple apartments,
shops, storage rooms, and service entrances. A two-dimensional coordinate or a
street-level postal address may identify the building shell, but it may not
identify the actual delivery or occupancy endpoint.

In AMT, the initial written address is treated as an observation:

```text
123 Example Street, Room 402
```

The parsing map extracts components such as administrative area, street name,
building number, building name, floor, room, and possible entrance. The
expansion map then produces candidates:

```text
building shell
residential unit 402
office suite 402
mailroom endpoint
locker endpoint
service entrance endpoint
```

The structural distance separates these candidates by geography, hierarchy,
attributes, and type. The same footprint does not force identity, because the
vertical and social attributes differ. The clustering stage may place several
observations in the same cluster only when the evidence supports a common
referent. The resolver should not silently collapse the fourth-floor residence
and a ground-floor shop merely because they share a street address.

This example motivates the vertical reference layer. It also explains why AMT
does not define address identity as coordinate equality.

## L.2 Administrative Renaming

Suppose a municipality changes a town name after a merger. Documents, residents,
delivery records, and legacy databases may continue to contain the old address
for years. A current-only resolver may incorrectly reject the old expression.

AMT models the situation as a lineage relation:

```text
old label -> administrative change -> new label
```

The old expression and the new expression are not the same string, but they can
be connected by a historical edge. The address conservation principle should be
read in this restricted sense: a valid historical referent should be mapped,
archived, or marked as obsolete rather than erased from the model. The claim is
not that every label survives forever. The claim is that a well-governed system
should preserve enough lineage to explain why an old address and a new address
refer to the same, split, merged, or transformed target.

This example supports the paper's distinction between identity, current
rendering, and historical continuity.

## L.3 Island, Rural, and Sparse-Data Cases

In small islands, rural settlements, mountains, and sparsely mapped areas,
postal codes and road names may be less informative than local names, natural
landmarks, or administrative context. A resolver designed only for dense urban
street grids may produce false confidence.

AMT handles this by treating candidate recall as a first-class requirement.
The expansion map should include:

```text
settlement names
island names
administrative units
natural feature names
local road or trail names
known facilities
delivery depots or pickup points
```

The quality score should be internal. It may trigger revalidation, warnings, or
fallback search, but it should not be displayed to ordinary users as an
absolute truth score. A sparse-data island is not a low-quality place. It is a
place where the resolver's evidence may be incomplete.

This example supports the paper's recommendation to separate user-facing
language settings from multilingual search coverage and internal quality
assessment.

## L.4 Desert, Wetland, Ice Field, and Other Natural Referents

Addresses are often associated with buildings, but many addressable references
are natural or semi-natural: deserts, salt lakes, wetlands, ice fields, forests,
grasslands, caves, valleys, rivers, waterfalls, lakes, and heritage sites. Some
of these places have names and operational relevance even when they have no
ordinary postal endpoint.

AMT therefore treats the referent type as part of the ontology. A named lake or
desert should not be forced into a building-address schema. The resolver may
produce a natural feature referent, an access point, a nearby settlement, or an
unresolved result, depending on context.

For example, a delivery context may require a reachable access point, while a
scientific survey context may require the named natural polygon. The two tasks
are different. A universal address resolver that ignores context would
over-resolve one of them.

This example supports the address relativity principle: optimal resolution
depends on purpose.

## L.5 Bridge, Road, Tunnel, and Linear Infrastructure

Roads, bridges, tunnels, rail corridors, and rivers are linear or network-like
referents. A single name may cover a long geometry with many possible access
points. A user may ask for the bridge itself, the nearest entrance, the road
segment in a specific municipality, or a maintenance endpoint.

AMT represents this with candidate type and context:

```text
named infrastructure object
specific segment
access point
administrative subpart
maintenance or delivery endpoint
```

The same name can therefore yield different valid targets under different
evaluation functions. This is not a defect of AMT. It is one of the reasons why
unresolved and context-sensitive scoring are necessary.

## L.6 Disaster Shelter and Temporary Address

In disasters, ordinary address references can be damaged, inaccessible, or
socially obsolete. People may need temporary locations: shelters, temporary
housing, relief centers, water distribution points, and mobile clinics.

AMT can represent these as time-bounded social and operational referents:

```text
person or household -> temporary shelter relation
shelter -> operational delivery endpoint
old home address -> damaged or inaccessible status
```

The model should not erase the original home address. It should record a
temporary routing relation and its time interval. This supports humanitarian
use cases without requiring the core AMT paper to make identity-system or
zero-knowledge claims.

## L.7 Comparison With Postal Codes, Coordinates, and Plus Codes

Postal codes, coordinate systems, grid codes, and human addresses are all
compression schemes, but they compress different information.

Postal codes are excellent for regional routing but are usually many-to-one.
Coordinates are excellent for metric location but may omit social, legal,
vertical, and historical identity. Grid codes provide compact spatial
references but do not by themselves encode occupancy, authority, delivery
history, or administrative lineage. Human addresses encode social and
administrative meaning but are ambiguous and historically unstable.

AMT does not replace these schemes. It provides a theory for composing them,
detecting when one representation is insufficient, and deciding when additional
evidence or abstention is required.

## L.8 Summary of the Examples

The examples show why the AMT pipeline must include more than normalization.
Candidate generation protects recall. Structural distance prevents premature
collapse. Clustering represents practical equivalence while preserving
uncertainty. Evaluation ranks candidates under purpose-specific criteria.
Unresolved states prevent unsafe overclaiming. Lineage preserves historical
continuity. Persistent identifiers stabilize references only after admissibility
conditions have been satisfied.

## Appendix M. Expanded Proof Sketches and Formalization Notes

This appendix expands the proof sketches that appear in the main body. The
goal is not to replace a complete Lean development. The goal is to state each
argument in a form that is precise enough to be translated into formal proof
when the relevant objects are finite, typed, and explicitly bounded.

### M.1 Address Reference Impossibility

The central impossibility result is intentionally modest. It does not say that
address resolution is hopeless. It says that a condition-free perfect resolver
cannot exist when the observation map is non-injective and the resolver is
given only the observation.

Let \(E\) be a set of addressable entities and let \(O\) be the set of
observable address expressions. Let \(obs : E \to O\) be an observation map.
Assume that \(obs\) is non-injective. Then there exist two distinct entities
\(e_1, e_2 \in E\) such that \(obs(e_1) = obs(e_2)\).

Assume, for contradiction, that there exists a resolver \(r : O \to E\) that
is perfect for all entities under this observation map. Perfection means that
for every \(e \in E\), \(r(obs(e)) = e\). Applying this condition to \(e_1\)
and \(e_2\), we obtain:

```text
r(obs(e1)) = e1
r(obs(e2)) = e2
obs(e1) = obs(e2)
```

By equality substitution, \(r(obs(e_1)) = r(obs(e_2))\). Hence \(e_1 = e_2\),
contradicting the assumption that the two entities are distinct. Therefore no
such resolver exists.

This proof is fully formalizable. It needs only equality, function application,
and the definition of non-injectivity. It is also the reason why AMT treats
unresolved as a structural output rather than an implementation failure. If
two entities are observationally identical under the available evidence, a
safe system must either request more evidence, retain multiple candidates, or
abstain.

### M.2 Compression Collision

The compression theorem is a direct companion to the impossibility result. A
postal code, grid code, coordinate projection, or normalized address string may
be useful precisely because it compresses information. Compression becomes a
problem only when it is mistaken for unique identity.

Let \(c : E \to C\) be a code map from entities to a finite or compressed code
space. If \(c\) is non-injective, then there are distinct \(e_1\) and \(e_2\)
with the same code. A decoder \(d : C \to E\) cannot be perfect for both
entities, because \(d(c(e_1))\) and \(d(c(e_2))\) are the same value while the
required outputs are different.

The theorem does not criticize postal codes or coordinate codes. It clarifies
their formal role. They are valid evidence features and useful routing keys,
but they are not universal address identifiers. A correct AMT implementation
may use them heavily while still preserving the possibility that the same code
maps to several candidates.

### M.3 Candidate Incompleteness

Candidate generation is not a cosmetic preprocessing step. It is a correctness
condition. If the correct entity is not in the candidate set, then no scoring
function over that set can emit the correct entity.

Let \(C(o) \subseteq E\) be the candidate set generated for observation \(o\).
Let \(s : C(o) \to \mathbb{R}\) be any scoring function and let
\(\arg\max s\) select one of the candidates. If the true entity \(e^\*\) is not
in \(C(o)\), then the selected candidate cannot equal \(e^\*\). This remains
true no matter how sophisticated the scoring function is.

This simple fact justifies benchmarking candidate recall separately from final
ranking accuracy. In dense urban areas, a search engine may generate many
nearby candidates. In sparse regions, islands, deserts, mountains, wetlands,
ice fields, or heritage zones, the correct candidate may be absent because the
data source does not contain the feature or because the system searches only
postal endpoints. AMT therefore treats candidate expansion as a first-class
operation with its own failure mode.

### M.4 Split and Merge Cannot Be Captured by a Single Successor Function

Address history is often relational. A single old address can split into
multiple new addresses. Multiple old addresses can merge into one new address.
A function from old addresses to new addresses can represent some rename
events, but it cannot faithfully represent both split and merge as symmetric
historical information.

For a split, suppose one old node \(a\) is historically connected to two
distinct new nodes \(b\) and \(c\). A function \(f\) can assign only one value
to \(a\). If \(f(a)=b\), then it omits \(c\). If \(f(a)=c\), then it omits
\(b\). If it returns a set, then the model is no longer a simple successor
function from addresses to addresses; it has become a relation or a function
into sets. AMT therefore models lineage as a directed graph or relation.

For a merge, a function from old to new may represent many old nodes pointing
to the same new node. However, the inverse history is then not functional. A
system that must answer both "what did this old address become?" and "which
old addresses contributed to this current address?" needs a relational model.

This theorem is important because it prevents a common simplification: treating
address history as a single current-value replacement table. Replacement tables
are useful, but they are not a complete theory of address continuity.

### M.5 Context Conflict and Address Relativity

Address relativity states that the best address resolution can depend on the
observer or purpose. The claim is formalizable when a context is represented as
an evaluation function.

Let \(C\) be a set of candidates and let \(u_1, u_2 : C \to \mathbb{R}\) be two
context-specific utility functions. Suppose there exist candidates \(a,b \in C\)
such that:

```text
u1(a) > u1(b)
u2(b) > u2(a)
```

Then there is no single candidate that is strictly best for both contexts
among \(a\) and \(b\). A delivery context may prefer a locker entrance. An
emergency context may prefer a fire access point. A cadastral context may
prefer a parcel polygon. A historical context may prefer an old name node.

The theorem does not imply arbitrary relativism. It implies that the context
must be declared, and that evaluation claims must be interpreted relative to
that context. Without context, the phrase "the correct address" can be
underspecified.

### M.6 Certified Gate for PID Issuance

Persistent identifiers are valuable only if issuance is disciplined. A PID
should not be produced merely because a string was normalized. It should be
produced after the candidate set, clustering decision, unresolved gate, source
state, quality threshold, and lineage policy have satisfied declared rules.

This can be stated as a gate theorem. Let \(G\) be a predicate over a resolution
record. The record includes the observation, candidate set, selected cluster,
source states, quality signals, context, and lineage evidence. Let
`issuePID(record)` return either a PID-bearing output or a non-emitting state.
If the implementation is defined so that a PID is returned only when \(G\)
holds, then every emitted PID has passed \(G\).

The theorem sounds tautological, but it is useful because it turns a software
discipline into an audit invariant. Tests can verify that rejected source
states, unresolved results, hard GIS warnings, low quality thresholds, or
missing lineage evidence prevent PID emission. Lean can formalize the abstract
gate. Implementation tests can validate the concrete gate.

### M.7 What Lean Can and Cannot Prove

Lean can prove structural statements about the formal model: non-injectivity,
candidate omission, split relations, gate behavior, append-only lineage, and
logical consequences of declared predicates. Lean cannot prove by itself that
a real road exists, that a postal authority has updated its dataset, or that a
delivery actually succeeded. Those claims require external evidence.

The correct verification architecture is therefore hybrid:

```text
real-world source -> data certificate -> implementation check -> formal gate
```

GIS validation can check geometry consistency, source coverage, and feature
classification. Implementation tests can check parsing, candidate generation,
quality scoring, and emission gates. Lean can prove that if the checked
predicates hold, then the formal conclusion follows. This division prevents
the paper from overclaiming.

## Appendix N. Empirical and GIS Validation Protocols

This appendix describes how the claims of AMT can be tested without requiring
paid proprietary systems. It is deliberately written as a reproducibility
protocol. The aim is to make the theory falsifiable where it makes empirical
claims and formally bounded where it makes mathematical claims.

### N.1 Dataset Families

An empirical validation suite should include several dataset families rather
than a single benchmark. A city-only benchmark would overestimate performance
for rural and natural geography. A postal-only benchmark would miss bridges,
lakes, deserts, islands, caves, waterfalls, heritage sites, temporary shelters,
and vertical addresses.

A minimal open-data suite should include:

- administrative boundary data;
- official or government postal-code data where available;
- OpenStreetMap extracts for roads, buildings, natural features, and points of
  interest;
- gazetteer data for multilingual and historical names;
- manually curated case files for vertical addresses and disaster or temporary
  routing;
- synthetic collision cases designed to test impossibility and abstention.

The suite should not pretend that all countries have equal open-data quality.
Each record should carry a source state such as official, community, inferred,
stale, unknown, or rejected. This source state is part of the evidence model.

### N.2 Urban, Rural, Island, Desert, and Natural-Feature Splits

The benchmark should report separate results for at least five geographic
conditions:

```text
urban dense
rural sparse
island or remote settlement
desert, mountain, ice, or wetland region
named natural or cultural feature
```

This split matters because the meaning of a good candidate generator changes
by environment. In a city, missing a room or floor may be the main failure. In
an island or rural area, the failure may be absence of a road name or reliance
on a postal code that covers many settlements. In a desert or ice field, the
correct referent may be a named region, station, access point, or route segment
rather than a conventional address.

The benchmark should not penalize the world for being sparse. It should
measure whether the resolver recognizes uncertainty and chooses the appropriate
output state.

### N.3 Candidate Recall, Ranking Accuracy, and Abstention Quality

AMT requires multiple metrics:

- candidate recall: whether the true referent appears in the generated
  candidate set;
- top-k accuracy: whether the true referent appears among the highest-ranked
  candidates;
- emission precision: whether emitted PIDs satisfy gate conditions;
- abstention quality: whether unresolved is used when evidence is insufficient;
- lineage accuracy: whether old and new labels are connected correctly;
- natural-feature recognition: whether named non-postal features are classified
  without forcing them into building schemas;
- vertical disambiguation: whether same-footprint but different-floor or
  different-unit cases remain distinct.

A resolver can have high top-one accuracy on easy urban cases and still be
unsafe if it emits identifiers on ambiguous or low-source-quality cases. For
this reason, unresolved decisions should be evaluated explicitly.

### N.4 Falsification Conditions

The empirical claims of AMT should be falsifiable. Examples of falsifying or
weakening evidence include:

- a supposedly complete candidate generator repeatedly omits correct rural,
  island, or natural-feature referents;
- a quality gate emits PIDs despite rejected or unknown source states;
- a lineage model cannot represent real split or merge cases;
- a vertical-reference model collapses separate units that share a footprint;
- a multilingual search system depends on the UI language rather than search
  expansion;
- a natural-feature module displays unnamed or uncertain features as verified
  named places;
- an implementation claims commercial-grade address verification without a
  country-by-country benchmark.

If such evidence appears, the paper should not hide it. The correct response is
to narrow the claim, add a condition, or introduce a new failure state.

### N.5 Official Source Coverage

For postal validation, the strongest open strategy is to treat official source
coverage as a catalog rather than a binary status. Some countries publish
downloadable postal-code files. Some provide official APIs. Some provide
partial or stale data. Some provide no free official source. A high-quality
engine should record these differences rather than flattening them.

The AMT paper should therefore avoid saying "global official postal validation
is solved." A safer claim is:

```text
The framework supports official-source integration where available, records
source status explicitly, and prevents official-source claims when the source
state is unknown or rejected.
```

This statement is stronger scientifically because it can be audited.

### N.6 GIS Certificates

A GIS certificate should be a small machine-readable record containing:

- source identifier and license class;
- geometry type;
- administrative containment checks;
- topology warnings;
- coordinate reference system;
- validation date;
- hard errors and soft warnings;
- feature class and name source;
- confidence or quality state.

The certificate should not be treated as a mathematical proof of reality. It is
evidence for the formal gate. If hard errors are present, the gate should fail.
If only soft warnings are present, policy may allow emission with caution or
require revalidation depending on context.

### N.7 Reproducibility and Negative Results

A serious AMT paper should include negative results. For example, if a given
country lacks open official postal data, the paper should say so. If a natural
feature class is too noisy in a dataset, it should be marked as experimental.
If a multilingual gazetteer fails for a script pair, that failure should be
reported.

Negative results are not weaknesses. They are part of the theory's safety
model. AMT is useful precisely because it distinguishes verified resolution
from unresolved or under-evidenced resolution.

## Appendix O. Revision Notes for the Source Manuscript

This appendix records how the Japanese source manuscript should be revised
when converted into the full English paper. It is written as editorial
guidance for avoiding overclaiming while preserving the originality of the
theory.

### O.1 Claims to Preserve

The following claims are strong and should be preserved:

- address expressions are observations rather than entities themselves;
- observation can be non-injective;
- normalization cannot by itself guarantee correct reference;
- candidate generation is necessary before scoring;
- unresolved is a legitimate and necessary output;
- structural distance should combine geographic, administrative, attribute, and
  type-level information;
- address history should be represented as a graph or relation;
- vertical reference is required for same-footprint multi-unit cases;
- natural geography should be included as a referent class;
- PID issuance should be gated and auditable;
- formal verification and GIS validation must be combined rather than confused.

These claims are both original and defensible. They give AMT a clear identity
as a theory of conditional address reference.

### O.2 Claims to Weaken

Several claims in the source manuscript are valuable but should be phrased more
carefully in English.

First, delivery success should not be described as the strictest or final test
of an address. Delivery is powerful evidence, but it is context-dependent.
Failures may be caused by weather, carrier policy, building access, customs,
temporary closure, or human error. Success also does not prove legal identity.
The revised claim should be: delivery history is important evidence for
operational reachability.

Second, energy or score updates should not be said to always decrease error.
They can improve estimates under assumptions about evidence quality and model
calibration. Without those assumptions, bad evidence can move a score in the
wrong direction.

Third, probability examples should avoid unexplained numerical jumps. If a
sigmoid or likelihood-ratio update is used, parameters must be declared or the
numbers should be marked as illustrative.

Fourth, hash collision claims should distinguish mathematical injectivity from
cryptographic collision resistance. A PID based on a true injective entity map
does not collide at the model level. A finite hash can collide in principle,
but the probability can be made negligible under standard assumptions.

Fifth, claims about outperforming commercial address validators should be
converted into research goals unless a benchmark is present. The paper can say
that AMT supports dimensions not always covered by commercial validators, such
as lineage, natural geography, and formal abstention. It should not claim
victory without evidence.

### O.3 Claims to Move to Companion Papers

AGID, AOID, and zero-knowledge address proofs should not be treated as solved
inside the AMT core paper.

The AMT paper may define the semantic ingredients: addressable entities,
reference classes, candidate sets, lineage, attributes, and evidence states.
An AGID/AOID paper should define identifier syntax, registration flows,
communication behavior, ownership, audit, revocation, and governance. A
zero-knowledge paper should define credentials, circuits, nullifiers,
freshness, revocation roots, predicate leakage, anonymity sets, and proof
compatibility.

This separation makes the research stronger. AMT becomes the foundation rather
than an overloaded system specification.

### O.4 New Claims to Add

The English paper should add four new claims, all stated with appropriate
conditions.

First, address compression theory: addresses are human and institutional
compression schemes for referents. Different systems compress different
features, which explains why postal codes, coordinates, grid codes, human
addresses, and persistent identifiers have different strengths.

Second, address entropy: address complexity can be studied through required
identification bits and candidate ambiguity. This should be empirical, not an
absolute law.

Third, context-relative optimality: the best resolution depends on declared
purpose when utility functions conflict.

Fourth, certified PID issuance: persistent identifiers should be emitted only
after declared gates pass. This converts implementation behavior into an audit
invariant.

### O.5 Writing Style Rules

The full English paper should use a sober academic style. It should avoid
promotional phrases such as "world first" unless independently justified. It
should prefer "we propose", "we formalize", "we show under stated
assumptions", and "we validate by" over absolute claims.

Definitions should come before theorems. Theorems should state assumptions
clearly. Proof sketches should identify which part is formal, which part is
empirical, and which part remains future work. Examples should appear near the
formal sections they motivate, not only at the end.

Tables should be used for claim status, source adoption, verification methods,
and counterexamples. Diagrams should be used for morphism chains, lineage
graphs, and the hybrid verification architecture.

### O.6 Minimum Criteria for the 80-Page Version

An 80-page version should not be made by adding empty prose. It should include:

- a complete conceptual introduction;
- related-work positioning;
- formal definitions and notation;
- the impossibility theorem and corollaries;
- the AMT morphism chain;
- candidate generation and clustering;
- unresolved and safety states;
- lineage and conservation;
- compression and entropy;
- context-relative evaluation;
- natural geography and vertical reference;
- implementation architecture;
- verification strategy;
- counterexamples;
- proof sketches;
- empirical validation protocols;
- adoption and revision notes;
- mathematical inventory.

This is the structure implemented in the current English draft.

## Appendix P. Commutative Diagrams and Model Checklist

This appendix collects diagrams that should appear in the final paper. They are
written as textual commutative diagrams so that the manuscript remains portable
before final typesetting. In a LaTeX version, these can be converted into
`tikz-cd`, `xy`, or ordinary figure environments.

### P.1 Observation and Resolution Diagram

The first diagram separates the real entity from its observed expression. This
is the conceptual core of AMT.

```text
E_t  --obs_t-->  O_t
 |               |
 | id            | normalize
 v               v
E_t  <--resolve-- N_t
```

The diagram is not assumed to commute unconditionally. In fact, the
impossibility theorem says that when `obs_t` or normalization is non-injective,
there is no total resolver that makes the diagram commute for every entity.
The safe replacement is a partial resolver:

```text
resolve_t(n) in {entity, cluster, ambiguous, unresolved, rejected}
```

This diagram should be placed near the impossibility theorem. It visually
prevents the reader from confusing address strings with addressable entities.

### P.2 Candidate Expansion and Clustering Diagram

The operational pipeline can be summarized as:

```text
O_t --parse--> T_t --expand--> C_t --distance--> W_t --cluster--> Q_t
```

where \(T_t\) is the token or structured component space, \(C_t\) is the
candidate set, \(W_t\) is the weighted neighborhood or dissimilarity structure,
and \(Q_t\) is the cluster quotient. The important point is that scoring should
not occur before candidate recall is protected. If the correct candidate is
missing from \(C_t\), later stages cannot recover it.

This diagram should be placed before the section on structural dissimilarity.
It explains why AMT is not merely a normalization theory.

### P.3 Evidence and Gate Diagram

The certified PID pipeline should be represented as:

```text
candidate record
     |
     v
evidence envelope ---- source policy ---- quality policy
     |                       |                   |
     v                       v                   v
lineage policy --------> certified gate --------> PID or non-emission
```

The diagram makes clear that PID issuance is not a direct hash of an input
string. It is the output of a certified gate. If any hard condition fails, the
system emits unresolved, ambiguous, rejected, or needs-review instead of a
persistent identifier.

This diagram should be placed in the implementation or audit section.

### P.4 Lineage Diagram

Address history should be drawn as a graph:

```text
old_a ----rename----> new_a
old_b ----merge-----> new_a
old_c ----split-----> new_c1
old_c ----split-----> new_c2
```

A single successor function cannot capture all of these cases while preserving
both forward and backward historical explanation. The diagram should accompany
the theorem that splits require relational lineage.

### P.5 Context-Relative Evaluation Diagram

A context-relative resolver can be shown as:

```text
candidate cluster Q_t
       |
       +-- delivery utility ----> best delivery endpoint
       |
       +-- emergency utility ---> best emergency access point
       |
       +-- cadastral utility ---> best parcel or legal unit
       |
       +-- historical utility --> best lineage node
```

This diagram supports the address relativity principle. It also prevents the
paper from promising one universal optimum across all uses.

### P.6 Model Checklist for the Final Version

Before final submission, each major model component should be checked against
the following list:

- Does the paper distinguish entity, expression, observation, candidate,
  cluster, and identifier?
- Does every theorem state its assumptions?
- Does every empirical claim identify a validation method?
- Does every unresolved or rejected case have an explicit output state?
- Does the paper avoid claiming global official-source coverage where no
  official source has been verified?
- Does the natural geography model include named water, landform, vegetation,
  ice, cave, valley, heritage, and infrastructure referents without forcing
  them into postal schemas?
- Does vertical reference separate same-footprint but different-unit cases?
- Does lineage represent rename, split, merge, deprecation, and temporary
  routing?
- Does PID issuance depend on a gate rather than raw normalization?
- Does the core AMT paper stop before making cryptographic ZK claims?

If any item fails, the final paper should either repair the model or explicitly
mark the item as future work. This checklist is the practical bridge between
the mathematical theory and a maintainable implementation.
