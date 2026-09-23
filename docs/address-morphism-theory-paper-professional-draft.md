# Address Morphism Theory

## A Formal Framework for Ambiguous Address Resolution, Lineage, and Persistent Spatial Reference

Version: professional manuscript draft v0.1
Date: 2026-06-06
Author: to be supplied

## Abstract

Address systems are usually implemented as practical pipelines: a user submits a string, the system normalizes it, searches a database, ranks candidates, and returns a formatted address or coordinate. This workflow is effective in ordinary cases, but it obscures a deeper theoretical problem. Address expressions are compressed, time-dependent, language-dependent, and context-dependent references to physical, social, institutional, and natural entities. They may be incomplete, translated, historically obsolete, vertically under-specified, or operationally ambiguous. As a result, address resolution is not merely string matching or coordinate lookup; it is inference under partial observation.

This paper proposes Address Morphism Theory (AMT), a formal framework for modeling address resolution as a chain of morphisms: parsing, multilingual and temporal expansion, candidate generation, structural dissimilarity evaluation, clustering, probabilistic scoring, abstention, history update, and persistent identifier issuance. The central theorem is an address reference impossibility result: under non-injective observation, lossy projection, or incomplete candidate generation, no condition-free perfect resolver can exist. This motivates a safety principle: a resolver must be allowed to return `ambiguous`, `unresolved`, or `rejected` rather than emitting a false precise identifier.

AMT also models address lineage, context-relative optimality, natural and cultural geographic referents, vertical addresses, address compression, and gated persistent identifier issuance. Applied identifier systems such as AGID and AOID, and cryptographic privacy mechanisms such as zero-knowledge address proofs, are treated in companion papers rather than as part of the core AMT paper. This paper distinguishes formal claims that can be verified in Lean from empirical claims requiring GIS, postal, benchmark, or security validation. This distinction is central: AMT does not claim universal address correctness; it claims that responsible address systems must explicitly model uncertainty, evidence, lineage, context, and identifier issuance.

## Keywords

Address resolution, geocoding, postal address, persistent identifier, address lineage, address entropy, PID, address verification, GIS, formal verification, spatial reference.

## 1. Introduction

Addresses are one of the most important interfaces between human language and the physical world. They are used in logistics, taxation, emergency response, public administration, land registration, utilities, e-commerce, humanitarian aid, robotics, and identity verification. Despite their central role, addresses are rarely precise mathematical objects. They are conventions, and conventions change across language, jurisdiction, history, culture, and operational context.

A single building may have several valid names. A single address string may refer to several places. A two-dimensional coordinate may represent an entire multi-floor building. A road, bridge, island, lake, desert, waterfall, cave, park, shrine, archaeological site, or world heritage site may be searchable and address-like even when it is not a postal endpoint. A company may move while retaining legal identity. A disaster may destroy an ordinary address while the person, shelter, or support target remains addressable through another mechanism. These cases are often treated as edge cases, but they reveal the core structure of the problem: address resolution is an inference problem under compression and partial observation.

Conventional address systems often hide this uncertainty. They return a best candidate, a coordinate, a standardized postal line, or a confidence score. These outputs are useful, but they can create false precision. A resolver that always returns a single entity may be operationally convenient and mathematically unsafe. If two different entities produce the same observation, a resolver that sees only that observation cannot be correct for both.

Address Morphism Theory begins from this limitation. It does not assume that every address can always be resolved. Instead, it asks what a resolver should do when the available evidence is insufficient. The answer is a typed resolution model: a resolver may emit a resolved entity only when admissibility conditions are satisfied; otherwise it must return an explicit non-emitting state such as `ambiguous`, `unresolved`, or `rejected`.

The theory is designed to support both mathematical reasoning and practical systems. It can describe ordinary postal validation, geocoding, natural feature search, address lineage, vertical reference, PID issuance, and audit trails. Its main contribution is not a single new identifier format. Its contribution is a formal language for explaining when address resolution is possible, when it is unsafe, and what evidence is required before a persistent identifier may be issued.

### 1.1 Research Questions

This paper addresses seven questions.

1. What kind of object is an address?
2. Under what conditions can an address expression be resolved uniquely?
3. When must a resolver abstain rather than emit a false precise result?
4. How should historical address change be represented?
5. Why can different contexts require different optimal address outputs?
6. How should core PID issuance be separated from applied identifier systems built on top of AMT?
7. How can formal verification, GIS validation, implementation tests, and security review be combined without overclaiming?

### 1.2 Running Examples

The paper uses five recurring examples.

1. Urban unit. "Central Building 501" may refer to a room, while "Central Building" may refer only to a building.
2. Administrative lineage. A municipality is merged and renamed. The old address is obsolete for current mail, but remains valid for property history, search, and archival documents.
3. Natural feature. A user searches for a lake, river, island, desert, glacier, wetland, cave, valley, waterfall, ruin, or heritage site. The referent may be a polygon, line, volume, cultural boundary, or label point rather than a postal endpoint.
4. Context conflict. A delivery company wants an entrance and locker route. A fire department wants access and hazard information. A tax office wants official jurisdiction. The same address expression has different optimal outputs.
5. Identifier layering. A public application identifier, an operational authority record, and a persistent resolved AMT entity may be related, but they should not be collapsed into a single identifier.

## 2. Contributions

This paper makes the following contributions.

First, it defines an address as a compressed, context-sensitive, time-dependent reference to an addressable entity. Postal addresses, postal codes, coordinates, coordinate codes, and PID are treated as different representation layers with different authority, persistence, and operational properties.

Second, it states and proves an address reference impossibility theorem. If observation is non-injective, if candidates are incomplete, or if projection loses necessary distinguishing information, a condition-free perfect resolver cannot exist.

Third, it defines an AMT resolution chain:

```text
surface expression
  -> parsing
  -> temporal and multilingual expansion
  -> candidate generation
  -> structural dissimilarity
  -> clustering
  -> evidence evaluation
  -> resolved / ambiguous / unresolved / rejected
  -> history update
  -> PID issuance
```

Fourth, it models safe PID issuance as a gated process rather than a best-effort guess. PID issuance requires auditable candidate coverage evidence, cluster uniqueness, quality thresholds, freshness checks, separation margins, and auditability.

Fifth, it models address lineage as a graph. Address states may be created, renamed, split, merged, retired, reassigned, or linked to successor states. Split and merge events cannot be represented adequately by a single-valued update function.

Sixth, it introduces context-relative address optimality. Delivery, emergency response, administration, property, search, humanitarian aid, and robotics may require different outputs and different risk tolerances. Therefore no single resolver is universally optimal across all use cases.

Seventh, it defines the boundary between AMT and applied extensions. AMT supplies resolved reference classes, attribute maps, quality gates, lineage, and audit envelopes. Separate companion papers should define applied identifier systems such as AGID/AOID and cryptographic protocols such as zero-knowledge address proofs.

Eighth, it separates claim types. Some claims are formal theorems. Some are implementation contracts. Some are empirical hypotheses. Some are governance assumptions. This separation is required for professional and reproducible address research.

## 3. Scope and Non-Goals

AMT is not a replacement for postal standards, GIS databases, cadastral systems, commercial validators, or geocoding APIs. It is a formal layer for composing them safely. A postal source can supply authority. A GIS source can supply geometry. A geocoder can supply candidates. A carrier can supply operational reachability. AMT specifies how these sources interact and when their evidence is insufficient.

AMT also does not claim that coordinates are unimportant. Coordinates are often useful. The claim is narrower: coordinates are projections, and projections may lose vertical, social, legal, temporal, or operational identity. Therefore a coordinate may be an output of address resolution, but it is not always the final semantic answer.

Editorial boundary note. This manuscript follows the separation policy in `docs/research-paper-volume-separation.md`: AMT I is the semantic theory, the AGID/AOID manuscript is the application identifier and operations layer, and the ZK Address Predicate manuscript is the selective-disclosure cryptographic layer. AGID/AOID and ZK may appear here only as companion-paper boundaries, not as proof obligations or implementation specifications of AMT itself.

The following claims are deliberately avoided.

- AMT does not claim that every address can be resolved.
- AMT does not claim that an implementation is globally complete.
- AMT does not claim that delivery history alone determines truth.
- AMT does not claim that addresses are universally more fundamental than identity.
- AMT does not claim to provide a complete cryptographic proof protocol; that topic is deferred to a companion paper.
- AMT does not claim that open data alone can match proprietary carrier databases in all countries.

The professional position is conditional: AMT can provide safer resolution and richer semantics when its gates, evidence models, lineage rules, and source policies are made explicit.

## 4. Related Positioning

AMT sits between several existing domains.

| Domain | Typical output | Strength | Limitation addressed by AMT |
| --- | --- | --- | --- |
| Postal addressing | Standardized address line | Official and human-readable | May be ambiguous, outdated, jurisdiction-specific, or incomplete. |
| Postal code lookup | Postal region or route | Compact and operationally useful | Usually not enough for unit, building, natural feature, or lineage identity. |
| Geocoding | Candidate place or coordinate | Practical search and ranking | May hide uncertainty and collapse vertical, historical, or social identity. |
| GIS | Geometry and attributes | Strong spatial representation | Does not by itself model user-entered ambiguity, delivery history, or identifier issuance. |
| Coordinate codes | Spatial code | Systematic and global | Weak social, legal, lineage, and delivery semantics. |
| Applied identifier systems | Public or private operational identifier | Useful for products, APIs, SDKs, and delivery workflows | Need AMT semantics before their reference, authority, and audit claims can be precise. |
| Cryptographic credential systems | Selective disclosure or proof | Strong control and privacy when properly implemented | Need address semantics before address-derived claims can be made. |
| AMT | Resolution outcome, lineage, PID, evidence envelope | Models ambiguity, history, context, and identifier issuance | Requires evidence governance and careful validation. |

The intention is not to replace these systems, but to make their composition explicit. AMT treats each system as an observation or evidence source whose authority, scope, freshness, and failure modes must be represented.

## 5. Formal Preliminaries

Let \(W_t\) denote the state of the addressable world at time \(t\). This includes entities, names, administrative rules, postal rules, delivery constraints, authority records, and historical transitions.

Let \(X_t\) denote the set of addressable entities at time \(t\). An entity may be physical, social, institutional, natural, virtual, or operational.

Examples include:

- physical entities: buildings, floors, rooms, entrances, lockers, warehouses, ports, parking spaces;
- linear entities: roads, bridges, rivers, trails, rail segments;
- areal entities: lakes, islands, deserts, wetlands, forests, grasslands, parks, protected areas;
- volumetric entities: underground facilities, floors, rooms, airspace, restricted zones;
- social entities: companies, schools, hospitals, agencies, shops, shelters, family homes;
- institutional entities: postal zones, administrative units, cadastral parcels, electoral districts;
- operational entities: temporary disaster addresses, delivery lockers, application-linked endpoints.

Let \(S\) be the space of surface expressions. A surface expression may be a postal address, a partial address, a facility name, a natural-language description, a postal code, a coordinate, a coordinate code, an application-specific address identifier, a PID, or a mixed expression.

An observation map is:

\[
O_t : X_t \to Y_t.
\]

The resolver does not see \(X_t\) directly. It sees observations in \(Y_t\), such as strings, source records, coordinates, postal lookups, map labels, carrier events, or authority records. Observation is usually lossy.

A resolver is total over observations but outcome-valued:

\[
\mathcal{O}(X_t)=
\{\texttt{resolved}(x)\mid x\in X_t\}
\cup \{\texttt{ambiguous}, \texttt{unresolved}, \texttt{rejected}\},
\]

\[
R_{c,t} : Y_t \to \mathcal{O}(X_t),
\]

where \(c\) denotes context. Context may include delivery, emergency response, administration, property, search, robotics, humanitarian aid, or audit.
Operationally this behaves like a partial resolver because only `resolved(x)` emits an entity. The other outcomes are certified non-emitting states.

The non-emitting states have distinct meanings.

| State | Meaning | PID issuance |
| --- | --- | --- |
| `resolved(x)` | Evidence supports a unique admissible entity \(x\). | Allowed if gates pass. |
| `ambiguous` | Multiple candidates remain plausible. | Blocked. |
| `unresolved` | Evidence or candidate generation is insufficient. | Blocked. |
| `rejected` | Input violates policy, validity, or trust requirements. | Blocked. |

## 6. The Address Reference Impossibility Theorem

The central formal result is simple but important. It explains why abstention is not a product choice but a theoretical requirement.

### Theorem 1: Non-Injective Observation Prevents Perfect Resolution

Let \(X\) be a set of addressable entities and let \(O : X \to Y\) be an observation map. If \(O\) is not injective, then no resolver \(R : Y \to X\) can be perfect with respect to \(O\).

### Proof

Since \(O\) is not injective, there exist \(x_1, x_2 \in X\) such that:

\[
x_1 \neq x_2
\]

and

\[
O(x_1) = O(x_2).
\]

If \(R\) were perfect, then:

\[
R(O(x_1)) = x_1
\]

and

\[
R(O(x_2)) = x_2.
\]

But \(O(x_1)=O(x_2)\), so the left-hand sides are equal. Thus \(x_1=x_2\), a contradiction. Therefore no perfect resolver exists under non-injective observation.

### Corollary 1: Normalization Collision

If two distinct address expressions or entities collapse to the same normalized string, string normalization alone cannot recover the distinction.

### Corollary 2: Postal Code Collision

If multiple endpoints share one postal code, postal code lookup alone cannot identify a single endpoint.

### Corollary 3: Projection Collision

If distinct units share the same two-dimensional coordinate, a 2D coordinate resolver cannot distinguish them without vertical or unit-level evidence.

### Corollary 4: Candidate Incompleteness

If the true entity is missing from the candidate set, a resolver restricted to that candidate set cannot return the true entity.

### Consequence

A resolver that always emits an entity will sometimes be wrong. AMT therefore treats abstention as a safety state. The resolver must be able to return `ambiguous`, `unresolved`, or `rejected` when the evidence does not justify a resolved output.

## 7. The AMT Morphism Chain

AMT models resolution as a sequence of typed transformations.

### 7.1 Parsing

The parsing morphism is:

\[
\pi : S \to T,
\]

where \(T\) is a structured token space containing language tags, address tokens, administrative hints, postal hints, natural feature hints, facility hints, temporal hints, and coordinate hints.

Parsing should not be confused with resolution. It produces evidence, not identity.

### 7.2 Expansion

At time \(t\), an expansion morphism is:

\[
\epsilon_t : T \to 2^T.
\]

Expansion may add aliases, old names, translated names, romanizations, official successors, postal expansions, local scripts, map-derived names, and natural geography terms.

Search language and application language must be separated. A user interface may be in Japanese while the search engine expands English, local-language, romanized, Arabic, Cyrillic, Chinese, or historical names.

### 7.3 Candidate Generation

Candidate generation is context- and source-policy dependent:

\[
\Gamma_{c,t} : 2^T \to 2^{X_t}.
\]

It collects candidates from official postal sources, administrative data, open geographic data, GIS sources, local maps, address format files, natural geography datasets, building data, delivery history, user hints, and known aliases.

Candidate generation is recall-oriented. It should include plausible candidates and defer exclusion to later gates. Premature ranking can remove the true entity before the resolver has enough evidence.

### 7.4 Structural Dissimilarity

AMT uses a structural dissimilarity function:

\[
D_{c,t}: X_t \times X_t \to \mathbb{R}_{\geq 0}.
\]

This is not necessarily a metric. It may be asymmetric and may violate the triangle inequality. It is better described as a directed structural cost than as a distance in the strict metric sense.

The components of \(D_{c,t}\) may include:

- geographic separation;
- administrative hierarchy mismatch;
- lexical and multilingual similarity;
- feature type compatibility;
- postal compatibility;
- vertical reference compatibility;
- delivery route compatibility;
- temporal validity;
- source authority;
- authority-record compatibility.

### 7.5 Clustering

For a threshold \(\delta\) and a candidate set \(C\subseteq X_t\), clustering returns a partition of the candidate set being considered:

\[
\Pi_{\delta,c,t}(C) \in \text{Partitions}(C).
\]

Clusters are context-dependent. A building-level cluster may group "Central Building" and "Central Bldg." A room-level delivery context may split "Central Building" from "Room 501".

### 7.6 Evaluation

Let \(K=\Pi_{\delta,c,t}(C)\) be the cluster set for candidates \(C\). Evaluation assigns scores to those candidate clusters:

\[
E_{c,t}: K \to \mathbb{R}.
\]

Lower energy or higher support may represent stronger evidence, depending on the chosen convention. The convention must be explicit. For a negative log-likelihood model, a high-likelihood event reduces relative energy compared with competitors because it creates a smaller positive increment, not necessarily because absolute energy decreases.

### 7.7 Resolution Outcome

The final decision is:

\[
\rho_{c,t}: S \to \mathcal{O}(X_t).
\]

The output may be a resolved entity only if the evidence satisfies admissibility gates.

## 8. Safe Resolution and PID Issuance

AMT distinguishes between choosing a plausible candidate and issuing a persistent identifier. PID issuance is more stringent because it creates long-lived state.

### 8.1 Admissibility Predicate

Let \(C\) be the candidate set, \(K\) the cluster set, and \(k^\*\) the best cluster. A minimal admissibility predicate is:

\[
\mathsf{Admissible}(s,k^\*) =
\mathsf{CandidateCoverageEvidence}(s,C)
\land \mathsf{ClusterUnique}(k^\*)
\land \mathsf{QualityOK}(k^\*)
\land \mathsf{Fresh}(k^\*)
\land \mathsf{RiskOK}(k^\*)
\land \mathsf{Auditable}(k^\*).
\]

If this predicate fails, the resolver may still display candidates, but it must not issue a PID.
The Lean model also contains an ideal property called `CandidateComplete`, meaning every real entity appears among the candidates generated from its own observation. In production, that ideal cannot be asserted from finite data alone, so PID issuance should require auditable candidate coverage evidence and must treat missing-source risk as `unresolved` or `ambiguous`.

### 8.2 Separation Gate

If lower energy is better, a simple gate is:

\[
E(k^\*) \leq \theta_E
\]

and

\[
E(k^\*) + m \leq E(k_2),
\]

and, separately,

\[
q(k^\*) \geq \theta_Q,
\]

where \(\theta_E\) is an energy threshold, \(m\) is a margin, \(k_2\) is the second-best cluster, \(q(k^\*)\) is a hidden or internal quality score, and \(\theta_Q\) is a quality threshold. The first two inequalities prevent PID issuance when the best cluster is too weak or insufficiently separated from a competitor; the quality gate prevents emission from low-quality evidence even when the score ordering looks decisive.

### 8.3 Certificate Schema

A PID certificate should record:

```json
{
  "input_commitment": "hash",
  "candidate_generation": "completed",
  "candidate_sources": ["official", "open-geo", "postal", "map"],
  "cluster_id": "cluster-commitment",
  "decision": "resolved",
  "quality_threshold": "policy-id",
  "freshness_root": "root",
  "risk_budget": "policy-id",
  "lineage_state": "state-id",
  "audit_hash": "hash"
}
```

The certificate should expose enough information for audit without revealing private address details unless disclosure is explicitly authorized.

### 8.4 PID Collision Risk

PID collision claims must distinguish pairwise collision probability from large-scale birthday risk. If the identifier uses a 128-bit random-or-hash-derived space, a single pair collision may be bounded by approximately \(2^{-128}\). For \(n\) issued identifiers, a birthday-bound approximation is:

\[
\frac{n(n-1)}{2 \cdot 2^{128}}.
\]

A professional paper should report both the bit length and the assumed maximum issuance volume.

## 9. Lineage, Split, Merge, and Social Continuity

Addresses change over time. A street may be renamed. A municipality may merge. A parcel may split. A building may be demolished. A shelter may be temporary. A company may move while retaining legal identity. A postal route may change while local usage remains.

AMT models address history as a directed lineage graph:

\[
G_L = (V_L, E_L).
\]

Nodes are address states. Edges are transition events such as `rename`, `split`, `merge`, `retire`, `reassign`, `successor`, or `temporary-replacement`.

### Principle: Recorded Lineage Preservation

The informal claim "addresses never disappear" is too strong. A professional formulation is:

> Recorded address states may lose current operational validity, but they can be preserved as lineage references for search, audit, property history, administrative transition, and evidence evaluation.

### Theorem 2: Split Cannot Be Represented by a Single-Valued Successor Function

If one historical address state \(a\) splits into two successor states \(b_1\) and \(b_2\), with \(b_1 \neq b_2\), then a single-valued successor function \(f(a)\) cannot represent the split without losing information.

### Proof Sketch

A function assigns exactly one value to \(a\). A split requires at least two distinct successors. Therefore the transition is relational or graph-valued, not single-valued.

### Social Continuity

AMT separates several identity relations:

- same physical site;
- same legal parcel;
- same postal endpoint;
- same delivery endpoint;
- same resident or household scope;
- same organization;
- same administrative state;
- same operational authority.

These relations may agree, but they need not. A system that collapses them into one identity relation will over-merge or over-split.

## 10. Context-Relative Optimality

Let \(U_c(x,s)\) be a utility function for context \(c\), candidate \(x\), and surface expression \(s\). Contexts may include delivery, emergency response, taxation, property, public administration, humanitarian aid, robotics, audit, or general search.

### Theorem 3: Context Conflict Prevents Universal Optimality

For a fixed admissible two-candidate set \(C=\{x,y\}\), suppose \(x\) is the unique optimum for context \(c_1\) and \(y\) is the unique optimum for context \(c_2\). In particular:

\[
U_{c_1}(x,s) > U_{c_1}(y,s)
\]

and

\[
U_{c_2}(y,s) > U_{c_2}(x,s),
\]

then no single context-independent output \(r(s)\in C\) can be optimal for both contexts on input \(s\). This is the utility-form counterpart of the Lean theorem that two distinct context-optimal renderings cannot both be represented by one absolute rendering.

### Interpretation

This theorem supports an Address No Free Lunch principle. No single resolver, scoring function, or address format is universally optimal across all countries, all purposes, all data-quality regimes, and all risk tolerances.

| Context | Preferred output | Why a universal output fails |
| --- | --- | --- |
| Delivery | Entrance, unit, route, carrier eligibility | A legal parcel may not identify the delivery path. |
| Emergency | Access route, hazard, occupancy, vertical location | A postal line may omit safety-critical information. |
| Tax administration | Official jurisdiction and parcel | A carrier endpoint may not be legally relevant. |
| Property | Parcel, unit, ownership boundary | A coordinate may not encode ownership. |
| Data-minimized workflow | Only the required operational fields | A full address disclosure may be unnecessary and unsafe. |

## 11. Address as Compression and Entropy

An address can be modeled as a compression scheme:

\[
c : X \to C.
\]

If \(c\) is injective over a target set \(X\), the code can distinguish every entity in that set. If \(c\) is non-injective, collisions are forced.

### Theorem 4: Finite Code-Space Collision

If \(|X| > |C|\), then no function \(c : X \to C\) can be injective.

### Proof

This follows from the pigeonhole principle.

### Address Entropy

For a finite candidate set \(C_s\), let \(p(x)\) be the probability that entity \(x\in C_s\) is the intended target, with \(\sum_{x\in C_s}p(x)=1\). The residual address entropy for that candidate set is:

\[
H(C_s) = -\sum_{x \in C_s} p(x)\log_2 p(x).
\]

Entropy measures uncertainty over candidate targets. It does not measure address quality by itself. A high-entropy candidate set may become low entropy after adding postal, vertical, historical, or authority evidence.

### Required Identification Bits

To uniquely identify one target among \(N\) equally likely candidates, at least:

\[
\lceil \log_2 N \rceil
\]

bits are required. This explains why a postal code can be an efficient route-level code while still being insufficient for unit-level identity.

### Professional Wording

The claim "urbanization always increases address information" is too strong. A safer formulation is:

> The amount of information required for unique address resolution tends to increase with the number of distinguishable entities and the required granularity of the context.

## 12. Natural, Cultural, and Vertical Referents

AMT treats named natural and cultural features as addressable entities when they are referents of search, navigation, planning, environmental monitoring, disaster response, or cultural documentation.

### 12.1 Natural and Cultural Classes

Relevant classes include:

- water: river, lake, pond, waterfall, wetland, marsh, bay, coast;
- terrain: mountain, valley, canyon, cave, glacier, ice field, volcano, plateau;
- drylands: desert, salt flat, steppe, savanna, grassland, barren land;
- land cover: forest, park, protected area, meadow, tundra;
- islands and coasts: island, archipelago, reef, peninsula, cape;
- cultural sites: ruins, archaeological sites, heritage sites, shrines, monuments, historic districts.

These entities may be points, lines, polygons, relations, or volumes. A map label point is not necessarily the entity. It may be only one observation of a larger referent.

### 12.2 Display Rule

If a named natural or cultural feature is address-like in the user's query or context, the resolver should display:

- local name;
- English or international name when available;
- feature type;
- geometry type;
- containing administrative region;
- source and license class;
- confidence and ambiguity status;
- nearest practical access point if relevant;
- warning if the geometry is approximate.

### 12.3 Vertical Reference

Two-dimensional coordinates are insufficient for many addressable entities. A building may contain multiple floors, rooms, entrances, lockers, offices, restricted zones, or underground spaces.

Let:

\[
P_{2D}: X_{3D} \to \mathbb{R}^2
\]

be a projection from a three-dimensional addressable entity to a two-dimensional coordinate. If \(P_{2D}\) is non-injective, projection collision applies. A resolver cannot distinguish two units that share one coordinate unless it uses additional evidence such as floor, unit, entrance, route, access permission, or vertical geometry.

## 13. Boundary to Cryptographic Extensions

AMT can support privacy-preserving systems, but this paper should not make cryptographic proof claims. The core AMT object is a resolved or unresolved address reference process. A cryptographic system may later consume AMT outputs, such as:

- a resolved reference class;
- an attribute map over jurisdiction, delivery zone, natural feature, or vertical unit;
- a quality or source-governance envelope;
- a lineage transition record;
- a PID issuance audit envelope.

Those objects can become witnesses or public commitments in a separate proof protocol. However, zero-knowledge proof soundness, credential issuer trust, revocation roots, freshness roots, nullifier domain separation, anonymity-set analysis, and proof-bundle compatibility are not established by AMT itself. They require their own cryptographic model, implementation, and audit.

The correct relationship is therefore:

```text
AMT resolves, abstains, records evidence, and issues PID envelopes.
Companion proof protocols consume AMT envelopes and prove scoped predicates.
```

This separation avoids two common mistakes. First, a mathematical theory of address resolution should not be presented as a production zero-knowledge system. Second, a zero-knowledge proof over an address predicate is unsafe unless the predicate is grounded in a well-defined address reference model. AMT supplies that reference model; the companion paper supplies the proof model.

## 14. PID and Applied Identifier Boundaries

AMT defines PID as a core theoretical output. Other identifier systems may be built on top of AMT, but their product-specific rules should be specified in companion application papers.

### 14.1 PID

PID is a persistent identifier issued only after AMT gates permit stable resolution. PID is not merely "the best guess." It is an auditable output of candidate generation, clustering, unresolved checks, history update, and issuance policy.

### 14.2 Boundary Rule

Applied identifier systems should not redefine AMT's resolution semantics. They should consume AMT outputs:

- resolved reference class;
- unresolved or ambiguous state;
- attribute map;
- lineage record;
- source and quality envelope;
- PID issuance audit envelope.

They may add their own public encoding, private authority, communication, QR, SDK, API, storage, or governance rules. Those rules belong to application papers.

### 14.3 Companion Application Papers

The recommended separation is:

| Paper | Core question | Main output |
| --- | --- | --- |
| AMT core | When is an address reference resolvable, ambiguous, unresolved, or rejectable? | Resolution model, lineage graph, PID gate, audit envelope. |
| AGID/AOID application | How should public geographic references and private operational address authority be implemented? | AGID/AOID standard, communication boundary, privacy and conformance rules. |
| ZK companion | How can AMT-derived facts be proven without revealing the address? | Address predicate proofs, nullifiers, freshness, revocation, proof bundles. |

## 15. Communication, Registration, and Audit Model

Systems built on AMT should separate communication, registration, and audit.

### 15.1 Communication

Communication should expose only what the relying party needs:

- route feasibility;
- delivery eligibility;
- region membership;
- selected disclosure payload;
- audit commitment.

Address content should remain private unless the context requires disclosure and the user or policy authorizes it.

### 15.2 Registration

Registration should include:

1. address evidence collection;
2. source classification;
3. candidate generation;
4. cluster evaluation;
5. unresolved and ambiguity gate;
6. authority binding where an applied system requires it;
7. duplicate-registration policy;
8. source freshness check;
9. audit hash creation.

### 15.3 Audit

Audit should record that the resolver followed the required path without exposing unnecessary private material. For PID issuance, the audit statement may be:

> This PID passed candidate generation, clustering, unresolved checking, history update, threshold checks, and issuance policy under policy version \(v\).

The internal input may include address text, candidate records, source records, and user-provided hints. The public output should be a policy-bound audit claim and commitment. A companion proof protocol may later turn this audit envelope into a zero-knowledge statement, but that is outside the core AMT proof burden.

## 16. Verification and Reproducibility

AMT requires multiple validation modes because no single method can validate the entire system.

### 16.1 Formal Verification

Lean or another proof assistant can verify:

- non-injective observation prevents perfect resolution;
- candidate omission prevents complete resolution;
- normalization collision prevents string-only recovery;
- projection collision prevents vertical recovery;
- split transitions require relational lineage;
- ambiguous and unresolved states do not emit entities;
- split and merge transitions require relational lineage rather than single-valued successor functions.

Lean cannot prove that a real-world database contains every building, island, cave, locker, station, or historical address. That is an empirical source-completeness claim.

### 16.2 GIS and Data Validation

GIS validation should check:

- geometry validity;
- coordinate bounds;
- polygon closure;
- duplicate identifiers;
- source availability;
- license compatibility;
- feature type consistency;
- warning budgets;
- changed-file validation.

A warning-budget pass establishes deployability under a defined policy. It does not prove global geographic correctness.

### 16.3 Implementation Tests

Implementation tests should cover:

- parsing and normalization;
- multilingual search expansion;
- candidate generation;
- cluster and unresolved outcomes;
- PID collision-risk budget;
- address verification policy;
- natural feature display;
- applied identifier communication and audit endpoints;
- companion-protocol envelope export, if implemented separately.

### 16.4 Claim Status Table

| Claim | Status | Required support |
| --- | --- | --- |
| Non-injective observation prevents perfect resolution | Formal theorem | Lean or elementary proof. |
| Candidate omission prevents complete resolution | Formal theorem | Lean or elementary proof. |
| Context conflict prevents universal optimality | Formal theorem under utility assumptions | Mathematical proof plus examples. |
| Natural features can be addressable referents | Model definition and implementation claim | GIS and search tests. |
| Multilingual expansion improves recall | Empirical hypothesis | Benchmark by language and region. |
| PID collision risk is acceptable under parameters | Engineering claim | Bit length and issuance bound. |
| Address-derived private predicates preserve privacy | Companion-paper claim | Circuit proof plus anonymity-set analysis, outside this paper. |
| AMT beats commercial validators everywhere | Not claimed | Would require broad benchmark and proprietary baselines. |

## 17. Security, Abuse, and Governance

Address systems are security-sensitive because they connect physical reachability, identity, money, delivery, and personal safety.

### 17.1 Threats

| Threat | Example | Mitigation |
| --- | --- | --- |
| False registration | Attacker registers another person's address relation. | Authority checks, source trust, audit. |
| Duplicate registration | Same address relation is registered repeatedly. | Deduplication policy and companion nullifier protocol if privacy is required. |
| Fake delivery evidence | Malicious carrier reports false success. | Signed carrier event, reputation anomaly detection, source weighting. |
| Private-data leakage | Operational logs or public records reveal sensitive address material. | Data minimization, redaction, scoped disclosure, companion privacy protocol. |
| Stale source | Old address or map evidence remains in use after change. | Source freshness and lineage checks. |
| Source poisoning | Open map data is manipulated. | Source trust tiers, multi-source confirmation, audit warnings. |
| Overconfident resolver | System returns a false precise PID. | Mandatory ambiguous/unresolved gates. |

### 17.2 Open-Source Safety

Open sourcing an address resolver can be safe only if secrets, private addresses, authority records, and issuer keys are not embedded in the codebase. The public code may include algorithms, schemas, tests, evidence-envelope interfaces, and policy logic. Private data should remain in user-controlled storage, trusted services, or explicitly scoped disclosure paths.

## 18. Benchmarking

AMT should be compared with address validators and geocoders using benchmarks that report both accuracy and safety.

### 18.1 Dataset Families

| Family | Purpose |
| --- | --- |
| Ordinary urban addresses | Baseline parsing and validation. |
| Rural addresses | Sparse evidence and route ambiguity. |
| Island addresses | Natural containment and logistics routing. |
| Desert and dryland addresses | Weak postal structure and natural geography dependence. |
| Mountain and valley addresses | Terrain and route recognition. |
| Water features | Lakes, rivers, waterfalls, wetlands. |
| Heritage sites | Cultural and legal boundaries. |
| Administrative history | Old names, mergers, splits. |
| Vertical addresses | Floors, rooms, basements, lockers. |

### 18.2 Metrics

| Metric | Definition |
| --- | --- |
| Top-1 accuracy | Correct entity is the first resolved output. |
| Top-k recall | Correct entity appears in the candidate set. |
| Abstention precision | Non-emitting outputs are genuinely unsafe to resolve. |
| False-resolution rate | Resolver emits the wrong entity. |
| Lineage recall | Old and successor states are linked correctly. |
| Natural feature recall | Named natural features are recognized. |
| Vertical distinction | Units sharing a 2D coordinate are separated. |
| Source transparency | Evidence sources are disclosed by class and freshness. |

### 18.3 Comparison Position

Commercial validators may outperform AMT implementations where they have proprietary delivery data, official integrations, and mature postal correction systems. AMT can outperform ordinary validators in theoretical breadth where the task requires unresolved safety, lineage, natural feature search, vertical identity, source governance, and explicit PID issuance discipline.

This is a stronger research position than claiming universal superiority. The goal is to provide a theory and engine that can combine official sources, open data, audit envelopes, and abstention discipline.

## 19. Case Studies

### 19.1 Urban Multi-Unit Building

Input: "Central Building 501".

A string geocoder may return the building. A coordinate geocoder may return a point. AMT parses the unit token, generates building and room candidates, checks vertical reference, evaluates postal consistency, and blocks PID issuance if the room is not sufficiently confirmed.

### 19.2 Administrative Rename

Input: old town name after municipal merger.

AMT expands old and new names, checks validity intervals, links the old address state to successor states, and returns either a current operational address, a historical lineage reference, or an unresolved state if the transition is ambiguous.

### 19.3 Island Address

An island may have a name, jurisdiction, archipelago, settlement, landing point, and postal rules. A coordinate alone is not enough. A delivery context may require access route and carrier eligibility. A heritage or environmental context may require protected area status.

### 19.4 Desert or Ice Field

A desert camp or polar station may have weak postal structure but strong natural geography. AMT treats surrounding natural entities, stations, routes, and jurisdictional references as evidence. It should avoid pretending that a centroid is a complete address.

### 19.5 Scoped E-Commerce Delivery

An e-commerce system may need to know whether a destination is deliverable before revealing the full delivery address to all parties. AMT can produce a delivery-zone classification and an audit envelope. A separate privacy or proof protocol may later hide the address from the merchant while disclosing scoped delivery details to the carrier.

## 20. Limitations

AMT has several limitations.

First, it cannot guarantee global candidate completeness. Some regions, buildings, temporary shelters, natural features, and historical addresses lack reliable data.

Second, formal verification cannot prove empirical source quality. Lean can verify logical implications, but not that a postal API is current or that OpenStreetMap contains every island.

Third, reputation and delivery history can be biased. Urban locations may have more evidence than rural, island, mountain, or disaster locations. History must be combined with authority, freshness, fairness, and anomaly checks.

Fourth, cryptographic privacy is out of scope for this paper. Zero-knowledge address proofs, selective-disclosure credentials, nullifiers, revocation, freshness roots, and anonymity-set analysis require a separate companion paper and independent implementation audit.

Fifth, governance is unavoidable. Address formats, translations, postal rules, natural feature sources, and operational policies vary by country and context.

## 21. Conclusion

Address Morphism Theory proposes a formal framework for addresses as compressed, time-dependent, and context-relative references to addressable entities. Its central theorem shows that under non-injective observation or incomplete candidates, no condition-free perfect resolver can exist. This result motivates a safer architecture based on candidate generation, structural clustering, explicit non-emitting states, lineage graphs, and gated PID issuance.

The theory reframes address resolution as a disciplined process rather than a single lookup. It explains why postal addresses, coordinates, coordinate codes, applied identifiers, and PID are not competing definitions of address, but different representation and authority layers. It also shows why professional address systems must distinguish formal theorem, empirical validation, implementation contract, and governance assumption.

The practical implication is direct: a high-quality address engine should not simply return the most plausible answer. It should know when not to answer, preserve lineage, expose evidence, respect context, minimize disclosure, and issue persistent identifiers only when the required gates are satisfied.

## Appendix A. Core Notation

| Symbol | Meaning |
| --- | --- |
| \(W_t\) | Addressable world state at time \(t\). |
| \(X_t\) | Addressable entities at time \(t\). |
| \(S\) | Surface address expressions. |
| \(T\) | Structured token space. |
| \(Y_t\) | Observation space. |
| \(\mathcal{O}(X_t)\) | Resolution outcome type over \(X_t\). |
| \(O_t\) | Observation map. |
| \(R_{c,t}\) | Contextual resolver \(Y_t\to\mathcal{O}(X_t)\). |
| \(\pi\) | Parsing morphism. |
| \(\epsilon_t\) | Expansion morphism. |
| \(\Gamma_{c,t}\) | Context- and source-policy-dependent candidate generation morphism. |
| \(D_{c,t}\) | Contextual structural dissimilarity or directed cost. |
| \(\Pi_{\delta,c,t}(C)\) | Clustering operator returning a partition of candidate set \(C\). |
| \(E_{c,t}\) | Evidence or energy function over a cluster set \(K\). |
| \(\rho_{c,t}\) | Resolution decision \(S\to\mathcal{O}(X_t)\). |
| \(G_L\) | Address lineage graph. |

## Appendix B. Reproducibility Map

The final paper should attach exact commands and versions. Suggested categories:

| Validation area | Command or artifact | What it supports | What it does not support |
| --- | --- | --- | --- |
| Lean formal core | `lean formal/AMTCore.lean` | Abstract impossibility and safety lemmas. | Real-world source completeness. |
| TypeScript tests | `npm test` or selected test scripts | Implementation behavior. | Mathematical completeness. |
| Type checking | `npm run lint` | Type-level consistency. | Runtime correctness. |
| GIS validation | `npm run verify:gis` | Geometry and catalog checks. | Global geographic truth. |
| GIS warning budget | `npm run verify:gis:budget` | Deployability under policy. | Perfect data quality. |
| PID risk | `npm run verify:pid-risk` | Collision risk under assumptions. | Semantic mis-resolution risk. |
| Postal source coverage | source coverage report | Official-source status. | Carrier-level deliverability. |

## Appendix C. Writing Rules for the Final Paper

Use conditional wording for any claim that depends on data, governance, source freshness, or implementation maturity.

Avoid:

```text
AMT always resolves the true address.
Delivery proves address truth.
PID is collision-free.
Cryptographic privacy is complete because an AMT audit envelope exists.
All natural features worldwide are recognized.
AMT beats all commercial validators.
```

Use:

```text
Under explicit candidate-generation, evidence, separation, threshold, and freshness assumptions, AMT can resolve a candidate cluster or safely abstain.
```

## Appendix D. Glossary

| Term | Meaning |
| --- | --- |
| Address | A compressed, context-sensitive, time-dependent reference to an addressable entity. |
| Addressable entity | A physical, social, institutional, natural, virtual, or operational object that can be referred to by an address-like expression. |
| Address expression | A surface string, code, coordinate label, identifier, or mixed input. |
| Address lineage | A directed graph of address states and transition events. |
| Address entropy | Uncertainty over possible addressable targets. |
| PID | Persistent Identifier issued only after AMT gates permit stable resolution. |
| Applied identifier | A product or protocol identifier built on AMT outputs, specified outside the AMT core paper. |
| Structural dissimilarity | A directed cost over geographic, administrative, lexical, feature, temporal, and operational attributes. |
| Unresolved | A safety state meaning evidence is insufficient. |
| Ambiguous | A safety state meaning multiple candidates remain plausible. |
| Rejected | A safety state meaning policy, trust, or validity checks fail. |
| False precision | Emitting a specific answer when evidence does not justify specificity. |

## Appendix E. References To Complete

The final bibliography should include sources on:

- postal address standards and country-specific address formats;
- geocoding and address normalization;
- GIS topology and spatial databases;
- OpenStreetMap and open geographic data governance;
- coordinate codes and Open Location Code;
- persistent identifiers;
- information theory and coding theory;
- historical geography and administrative boundary lineage.

## Appendix F. Executable Expectations and Failure Rewrites

AMT should treat empirical expectations as executable claims rather than as
informal optimism. Each expectation should be attached to a validation method,
a metric, a pass criterion, and a failure rewrite. If the expectation succeeds,
the paper may strengthen the applicable scope. If the expectation fails, the
paper should not hide the failure; it should convert it into a boundary
condition, counterexample, abstention rule, additional evidence requirement,
or companion-paper task.

| Expectation | Execution path | Success wording | Failure rewrite |
| --- | --- | --- | --- |
| Candidate expansion improves true-target coverage. | Measure recall@k and candidate-miss rate on country, language, rural, island, mountain, desert, polar, and natural-feature datasets. | Candidate expansion improves measured coverage in the tested scope. | Candidate completeness is source- and region-dependent; unsupported scopes must return unresolved or request additional evidence. |
| Multilingual expansion improves search recall. | Benchmark native names, translations, transliterations, old names, aliases, and dialect variants. | Multilingual expansion is a recall layer before identity resolution. | Multilingual expansion is not identity preserving; normalization collisions require structural and source gates. |
| Natural and cultural features are addressable referents. | Validate rivers, waterfalls, lakes, islands, deserts, wetlands, ice fields, caves, valleys, ruins, and heritage sites against GIS/source data. | AMT can extend the referent ontology beyond postal addresses. | Global feature recognition is not proven; natural features are source-bound referents until coverage is measured. |
| PID gates reduce false issuance. | Replay candidate, cluster, threshold, freshness, quality, history, and risk failures. | PID issuance is auditable under declared gates. | Gate passage does not prove global truth; it proves only declared procedural admissibility. |
| AMT can compete with commercial validators. | Compare against commercial APIs under identical country, address type, and task conditions. | AMT differentiates itself through explicit evidence, abstention, lineage, natural features, vertical reference, and auditability. | AMT should be described as a transparent evidence and audit layer where commercial validators outperform it on proprietary data. |
| ZK address claims preserve privacy. | Implement and audit circuits, nullifiers, scope separation, revocation, freshness, and anonymity-set thresholds. | AMT-derived attributes can feed privacy-preserving address proofs. | Until audited circuits exist, the implementation is proof-ready or envelope-based, not a complete ZK system. |

For implementation, expectation records should track:

```text
expectation id
claim
validation method
metric
pass criterion
expected outcome
observed outcome
claim status
success wording
failure wording
paper location
```

This keeps the manuscript falsifiable. A failed expectation becomes a stronger
description of AMT's limits instead of an unhandled contradiction.
