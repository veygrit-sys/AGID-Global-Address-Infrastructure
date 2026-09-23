# Address Morphism Theory:
# A Formal Model of Address Resolution, Lineage, Compression, and Private Spatial Proofs

Version: 0.3 long draft
Date: 2026-06-06
Author: to be supplied

## Abstract

Addresses are usually treated as strings, coordinates, administrative labels, or delivery instructions. This paper proposes Address Morphism Theory (AMT), a formal framework in which an address is modeled as a compressed, time-dependent, context-sensitive, and partially observable reference to physical, social, institutional, and natural geographic entities. AMT treats address resolution not as a simple string-to-coordinate conversion, but as a chain of morphisms: parsing, expansion, candidate generation, structural clustering, probabilistic evaluation, abstention, history update, and persistent identifier issuance.

The central result is an address reference impossibility theorem: under non-injective observation, incomplete candidates, or lossy projection, no condition-free perfect address resolver can exist. This theorem motivates AMT's core design principle: a resolver must be allowed to abstain, mark an input as ambiguous, request more evidence, or defer identifier issuance. The theory also introduces address compression, address entropy, address lineage graphs, context-relative optimality, address equivalence classes, and address-derived private proofs. In this view, postal addresses, postal codes, Plus Codes, AGID, AOID, PID, and address credentials are not unrelated mechanisms, but different layers of address representation and compression.

The paper further argues that addresses can serve as private inputs to zero-knowledge proofs. Instead of revealing a precise residence, a user may prove only that an address lies within a delivery region, a country, a city, a disaster relief zone, or a credential scope. AMT therefore provides a mathematical pre-theory for ZK Address Proof, ZK Residence Proof, and ZK Delivery Eligibility. The framework is supported by a small Lean formalization of core impossibility and safety lemmas, plus an implementation-oriented validation plan using GIS data, official postal sources, address format corpora, natural geography datasets, and address verification tests.

## Keywords

Address resolution, geocoding, postal address, address lineage, persistent identifier, AGID, AOID, PID, zero-knowledge proof, address compression, spatial identity, address verification, GIS, formal verification.

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

## 18. Address as a Provable Attribute Set

The second major extension is privacy. Let \(P\) be a set of public predicates over address states. Examples:

- the address lies in Japan;
- the address lies in Hokkaido;
- the address is inside a delivery zone;
- the address is inside a disaster support zone;
- the AOID credential is valid;
- the address quality score exceeds a threshold;
- the address has not been revoked;
- the user belongs to the same address group as another user.

Instead of revealing an address \(a\), a user can prove:

\[
P(a) = true
\]

without revealing \(a\). This gives rise to:

- ZK Address Proof;
- ZK Residence Proof;
- ZK Delivery Eligibility;
- AOID Ownership Proof;
- Region Membership Proof;
- Quality Threshold Proof;
- Revocation and Freshness Proof;
- Consent and Purpose Scope Proof;
- Anonymous Rate Limit Proof;
- Duplicate Registration Nullifier Proof.

### Theorem 5: Predicate Proofs Can Hide the Private Address

If a public predicate \(P\) is satisfied by at least two distinct private addresses \(a_1 \neq a_2\), then a proof that "there exists an address \(a\) such that \(P(a)\)" does not uniquely reveal the private address.

This theorem is a minimal privacy condition. It does not by itself guarantee strong zero-knowledge, but it explains why predicate granularity matters. If the predicate is too narrow and only one address satisfies it, the proof may reveal the address by inference. Therefore AMT requires privacy-preserving predicates to maintain a sufficient anonymity set.

Example. A merchant may need to know whether an order is deliverable to a carrier service area, but not the user's exact residence before checkout. A ZK Delivery Eligibility proof can reveal "deliverable = true" and a freshness root while hiding the address. Later, the actual delivery party may receive a scoped disclosure under consent. This separates eligibility proof from address disclosure.

| Proof | Public claim | Private input hidden |
| --- | --- | --- |
| ZK Address Proof | Address is inside region \(R\) | Street, unit, exact coordinate. |
| ZK Residence Proof | User has a valid residence credential | Address text, issuer-specific private data. |
| ZK Delivery Eligibility | Carrier can deliver to this endpoint | Full address until scoped disclosure. |
| AOID Ownership Proof | User controls a registered AOID secret | AOID private key and linked address. |
| Quality Threshold Proof | Address quality exceeds threshold | Raw evidence vector and private history. |

## 19. AGID, AOID, PID, and Other Address Identifiers

AMT distinguishes several identifier layers.

### Postal Code

A postal code is a jurisdictional delivery compression scheme. It is useful for routing but usually insufficient for individual entity identity.

### Plus Code and Coordinate Code

A coordinate code compresses location into a systematic spatial code. It is useful where postal addresses are missing, but it does not by itself encode social identity, delivery history, lineage, ownership, or privacy predicates.

### PID

A PID is a persistent identifier issued after candidate generation, clustering, unresolved checks, history update, and admissibility tests. It should not be emitted merely because a score is high. PID issuance should be auditable.

### AGID

An AGID is a spatial-semantic identifier for addressable entities and regions. It can support routing, registration, audit, proof anchoring, and address lineage.

### AOID

An AOID is an address ownership or address operation identity. It is closer to credential, authority, ownership, delegation, sharing, inheritance, and private proof. AOID should not expose personal address content by default. It should support local storage, credential-backed proof, revocation, freshness, and scoped disclosure.

The distinction is operational:

| Identifier | Main question answered | Example output |
| --- | --- | --- |
| Postal code | Which broad postal route or area? | A delivery zone. |
| Plus Code | Where is this approximate coordinate? | A coordinate-like spatial code. |
| PID | Which resolved address state did the resolver certify? | A persistent reference after AMT checks. |
| AGID | Which spatial-semantic entity or region is referenced? | A building, lake, route zone, or administrative area. |
| AOID | Who can operate, prove, delegate, or update this address relation? | Ownership credential, scoped proof, delegation record. |

## 20. DID and Spatial Identity

AMT does not claim that every identity is an address. Digital identities can exist without physical reachability. However, many real-world systems require spatial claims: residence, delivery, jurisdiction, property, disaster relief, regulatory region, or humanitarian eligibility.

For such systems, address reference and decentralized identity are complementary.

```text
DID
  -> cryptographic subject

AGID/AOID
  -> spatial and addressable referent

ZK Address Credential
  -> private bridge between subject and spatial predicate
```

The safe claim is:

> In identity systems that require physical reachability, residence, delivery eligibility, disaster relief, or real-world asset reference, address reference is a necessary companion layer to DID.

This formulation is strong enough to justify AMT without making the overbroad claim that addresses are universally more fundamental than identity.

Example. A DID can prove control of a cryptographic key. It cannot by itself prove that the subject lives in Hokkaido, can receive goods in a carrier zone, or is eligible for disaster support at a shelter. AMT supplies the spatial predicate layer that a DID or verifiable credential can bind to.

## 21. Natural Geography and Non-Postal Referents

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

## 22. Vertical Reference and Three-Dimensional Addresses

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

## 23. AMT Resolution Algorithm

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

## 24. Verification Strategy

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

## 25. Formal Semantics of Observation and Resolution

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

## 26. Counterexample Catalogue

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

## 27. Certified Gated Resolution and PID Issuance

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

## 28. Entropy, Compression, and Address Information

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

## 29. Multilingual and Multiscript Search

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

## 30. Official Sources, Postal Validation, and Open Data

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

## 31. Natural Geography Validation Model

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

## 32. Zero-Knowledge Address Proof Bundle Model

AMT's privacy layer is not a single proof. It is a bundle of compatible proof types.

### Proof Types

| Proof | Public output | Private witness |
| --- | --- | --- |
| ZK Address Proof | inside region or satisfies predicate | address, credential, geometry witness |
| ZK Residence Proof | resident of country/city/region | credential and address relation |
| ZK Delivery Eligibility | deliverable by carrier or zone | address and carrier policy witness |
| AOID Ownership Proof | controls AOID operation secret | AOID secret or credential |
| Duplicate Nullifier | not already registered in scope | address/AOID secret and scope |
| Revocation/Freshness Proof | credential is current | inclusion/non-inclusion witness |
| Consent Scope Proof | use is permitted | consent credential and purpose |
| Anonymous Rate Limit | within rate bound | secret identity and epoch |
| Quality Threshold Proof | quality exceeds threshold | evidence vector or committed score |

### Compatibility Requirements

Proofs should share:

- canonical commitment scheme;
- domain-separated nullifiers;
- epoch and freshness model;
- issuer trust root;
- revocation root;
- predicate namespace;
- privacy threshold policy;
- audit event type.

Without compatibility, proof systems can collide. For example, the same nullifier domain used for duplicate registration and anonymous rate limiting could create unintended linkability. AMT therefore requires domain separation:

\[
nullifier = H(domain, scope, secret)
\]

where `domain` distinguishes proof purpose.

### Privacy Threshold

A predicate is privacy-safe only if the anonymity set is large enough:

\[
|\{a \in A : P(a)=true\}| \ge k.
\]

The value of \(k\) is policy-dependent. The paper should avoid stating one universal threshold. It should say that proof predicates must be checked against a configured privacy threshold and local risk context.

### Delivery Without Early Disclosure

A private delivery workflow can be:

```text
buyer proves delivery eligibility
merchant accepts order without seeing address
carrier receives scoped disclosure only when needed
carrier proves successful delivery or failure
AOID/PID history updates under audit
```

This is not just privacy decoration. It changes address verification into a staged disclosure protocol.

### Proof Bundle Collision Risks

| Risk | Description | Mitigation |
| --- | --- | --- |
| Linkability | Same proof secret reused across purposes | Domain-separated nullifiers. |
| Narrow predicate leakage | Region contains one address | Privacy threshold proof. |
| Stale credential | Old address remains accepted | Freshness root and revocation proof. |
| Rogue issuer | Untrusted issuer creates false credential | Issuer trust registry. |
| Scope creep | Proof used beyond consent | Consent and purpose scope proof. |
| Replay | Old proof reused | Epoch, nonce, verifier challenge. |

## 33. AGID/AOID Communication, Registration, and Audit Model

AGID and AOID should not be treated as the same thing.

### AGID

AGID is a spatial-semantic reference layer. It can identify or route to:

- buildings;
- rooms;
- roads;
- bridges;
- lakes;
- rivers;
- islands;
- deserts;
- administrative regions;
- delivery zones;
- disaster sites;
- polar stations;
- heritage sites.

AGID's main question is:

> What spatial or addressable referent is being referenced?

### AOID

AOID is an address operation identity. It controls:

- ownership;
- delegation;
- sharing;
- inheritance;
- credential issuance;
- revocation;
- scoped disclosure;
- proof generation;
- address operation audit.

AOID's main question is:

> Who or what may operate this address relation under which policy?

### Communication Difference

| Function | AGID | AOID |
| --- | --- | --- |
| Spatial lookup | Primary | Indirect |
| Ownership proof | Indirect | Primary |
| Route generation | Primary | Policy-controlled |
| Credential proof | Anchor | Primary |
| Privacy disclosure | Predicate target | Controller |
| Inheritance/delegation | Possible | Primary |
| Public registry | More public | More private |

### Registration Flow

```text
surface address or feature input
candidate generation
cluster and unresolved checks
AGID referent selection
AOID credential or owner operation
duplicate nullifier check
freshness and revocation check
PID issuance or reuse
audit certificate emission
optional ZK proof bundle
```

### Open-Source Safety

To make AGID/AOID safe for open-source release:

- no hard-coded secrets;
- no private addresses in public fixtures;
- deterministic test vectors use synthetic addresses;
- proof domains are explicit;
- logs redact private address material;
- audit hashes are domain-separated;
- issuer roots and revocation roots are configurable;
- AOID private keys remain local or credential-protected.

## 34. Implementation Architecture

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

## 35. Security and Abuse Model

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

## 36. Benchmarking Against Address Verification Services

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

## 37. Case Studies

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

## 38. Verification Results and Reproducibility

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

## 39. Data Governance and Licensing

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

## 40. Roadmap and Open Problems

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

## 41. Limitations

AMT has several limitations.

First, it cannot guarantee global candidate completeness. Some countries, regions, buildings, temporary shelters, and natural features lack reliable data.

Second, official postal data are uneven. Some sources are open, some are restricted, some require registration, and some are not updated frequently.

Third, address lineage is only as good as the available history. If a historical transition was never recorded, AMT can infer possible links but cannot prove them.

Fourth, ZK address proofs require careful predicate design. A proof that reveals too narrow a region may leak the address by inference.

Fifth, reputation systems can be attacked or biased. Address reputation must not become a proxy for excluding low-data regions.

Sixth, natural geography is difficult. Feature names are multilingual, sometimes disputed, sometimes seasonal, and often represented differently across datasets.

Seventh, vertical references require building-level and access-level data that may be private or unavailable.

These limitations are not failures of the theory. They are the reason the theory requires unresolved states, evidence thresholds, freshness, audit, and privacy controls.

## 42. Discussion

AMT reframes address resolution as a controlled inference problem. Its most important practical implication is that abstention is not optional. A resolver that cannot abstain will eventually produce false precision.

The second implication is that address identity is not a single relation. Physical, social, legal, delivery, administrative, and proof identities may diverge. Systems that collapse them into one identifier will either lose information or create privacy and governance risks.

The third implication is that address systems can become privacy-preserving. A person should often be able to prove delivery eligibility, country residence, city residence, same-address membership, or disaster support eligibility without revealing a street address. This is especially important for e-commerce agents, humanitarian systems, credential marketplaces, and decentralized logistics.

The fourth implication is that AGID and AOID should be designed as layered infrastructure, not as simple address codes. AGID can serve spatial-semantic reference and routing; AOID can serve ownership, delegation, credential, and privacy proof; PID can serve persistent resolution state; ZK proof bundles can serve selective disclosure.

## 43. Conclusion

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

## Appendix F. ZK Proof Bundle Registry Specification

AMT treats address-derived proofs as a family of compatible proof bundles. A proof bundle is not only a cryptographic artifact. It is also a semantic commitment to a predicate, issuer, freshness root, revocation root, jurisdiction policy, and privacy threshold.

### Bundle Fields

```json
{
  "bundle_version": "amt-zk-bundle-1",
  "proof_type": "delivery_eligibility",
  "predicate_id": "delivery-zone:v1",
  "issuer_id": "issuer.example",
  "subject_commitment": "commitment",
  "address_commitment": "commitment",
  "public_claim": {
    "inside_region": "region-commitment-or-id",
    "eligible": true
  },
  "freshness_root": "root",
  "revocation_root": "root",
  "nullifier": "domain-separated-nullifier",
  "anonymity_set_min": 128,
  "audit_hash": "hash",
  "proof": "opaque-proof-bytes"
}
```

This schema is intentionally abstract. The proof backend may be Groth16, Plonk, STARK, Bulletproof-style range proofs, a credential selective-disclosure system, or a future proof system. The registry should identify semantics first and cryptographic backend second.

### Compatibility Rules

| Rule | Requirement | Failure if ignored |
| --- | --- | --- |
| Domain separation | Every proof type and relying party scope must have a distinct domain. | Cross-service linking or nullifier collision. |
| Predicate registry | Public predicates must be named and versioned. | Verifiers may interpret the same proof differently. |
| Issuer trust registry | Issuers must be bound to proof types and regions. | Untrusted issuers can mint invalid residence or delivery claims. |
| Freshness root | Proofs must reference a recent accepted root when freshness matters. | Old valid proofs remain usable after address change. |
| Revocation root | Revoked credentials must be excluded. | Lost, transferred, or fraudulent credentials stay valid. |
| Anonymity threshold | Predicate region must contain enough possible witnesses. | Hidden address becomes inferable by uniqueness. |
| Audit hash | The decision path must be hash-bound. | Proof may be detached from the AMT gates that created it. |

### Proof Types

| Proof type | Public statement | Private input |
| --- | --- | --- |
| `address_predicate` | Address satisfies predicate \(P\). | Address credential, AGID/AOID secret, source evidence. |
| `residence_country` | Subject resides in a specified country. | Full address, issuer credential, validity interval. |
| `residence_city` | Subject resides in a specified city. | Full address, city containment proof. |
| `same_address_resident` | Two subjects are residents of the same address or household scope. | Two credentials and scoped nullifiers. |
| `delivery_eligibility` | Subject is eligible for delivery in a service region. | Address, delivery policy, freshness data. |
| `aoid_ownership` | Subject controls an AOID secret or credential. | AOID secret key or credential. |
| `pid_audit` | PID passed the required AMT gates. | Candidate set, cluster evidence, threshold evidence, history update. |
| `quality_threshold` | Address evidence exceeds a threshold. | Internal quality score, source list, warning data. |
| `revocation_freshness` | Credential is not revoked and is fresh. | Credential witness and root membership proof. |

### Privacy Rule

A proof should be considered privacy-preserving only if the public predicate has sufficient witness multiplicity under the verifier's auxiliary knowledge. Cryptographic hiding is not enough. If the public statement uniquely identifies a single apartment, the address has effectively been disclosed.

AMT therefore recommends a privacy gate:

\[
|\{a \in A : P(a)=true\}| \ge k.
\]

The threshold \(k\) should vary by use. A public proof of country residence may need a large anonymity set. A proof for emergency aid may accept a smaller set under strict purpose limitation. A proof to a delivery carrier may eventually disclose enough information for delivery, but disclosure should occur as late and as narrowly as possible.

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
