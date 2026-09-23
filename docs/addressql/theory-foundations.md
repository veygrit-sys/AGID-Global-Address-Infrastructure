# AddressQL Theory Foundations

Status: research draft

AddressQL should not be only a list of SQL functions.  It needs a theory stack
that explains why address queries are different from ordinary string queries and
why an adapter must declare source versions, privacy boundaries, determinism,
and non-claims.

This document defines the AddressQL Theory Map.

## Core Position

AddressQL is a database-facing query language for address facts:

```text
AddressQL = relational query semantics
          + address normalization and morphism
          + multilingual search
          + spatial and delivery predicates
          + source-versioned replay
          + privacy-preserving proof hooks
          + safe index design
```

It is compatible with AMT, AGID, ZK Address Predicates, postal theory, and
Address Communication Objects, but it remains a separate open-source query
specification.

## Research Domains

### 1. Address morphism and normalization theory

Purpose:

- parse surface address expressions;
- normalize country-specific forms;
- transform between local, international, carrier, and canonical forms;
- keep the boundary between normalization and referent resolution clear.

Formal object:

```text
N_s: E_country,locale x V_s -> A_norm
M_p: A_norm -> R_p
```

where `E` is a surface expression set, `V_s` is a source version, `A_norm` is a
normalized address expression, `p` is purpose, and `R_p` is a typed result.

AddressQL functions:

- `ADDRESS_PARSE`
- `ADDRESS_NORMALIZE`
- `ADDRESS_COMPONENT`
- `ADDRESS_CANONICAL`
- `ADDRESS_FORMAT`
- `ADDRESS_TRANSLATE`

Key non-claim:

```text
normalize(a) = normalize(b) does not by itself prove that a and b refer to the
same real-world object.
```

### 2. Address search, fuzzy matching, and multilingual recall theory

Purpose:

- search across scripts, transliterations, aliases, historical names, and typos;
- rank candidates without pretending that similarity is identity;
- expose explanations for false-positive control.

Formal object:

```text
Search(q, L, V_s) -> ranked candidate set C
```

where `q` is query input, `L` is a language/script policy, and `V_s` is a source
version.

AddressQL functions:

- `ADDRESS_MATCH`
- `ADDRESS_EXPLAIN_MATCH`
- `ADDRESS_SIMILARITY`
- `ADDRESS_SCORE`
- `ADDRESS_ISSUES`
- `ADDRESS_TRANSLATE`

The query result should carry:

```json
{
  "candidates": [],
  "score": 0.0,
  "matched_components": [],
  "missing_components": [],
  "source_version": "..."
}
```

Key non-claim:

```text
High similarity is not PID issuance, residence proof, or complete global recall.
```

### 3. Address proof and authentication theory

Purpose:

- prove address facts without exposing raw addresses;
- avoid unsafe public address hashes;
- connect database query results to proof policies.

Formal object:

```text
ProofQuery = (envelope, claim, policy, roots) -> proof bundle
Verify(proof, policy, roots) -> decision
```

AddressQL functions:

- `ADDRESS_COMMIT`
- `ADDRESS_ENVELOPE_CREATE`
- `ADDRESS_PROVE`
- `ADDRESS_VERIFY_PROOF`
- `ADDRESS_POLICY_CHECK`
- `ADDRESS_HASH`

The unsafe hash boundary is explicit:

```text
ADDRESS_HASH(normalized_address)
```

is not privacy protection.  Address spaces are often enumerable, so plain hashes
are dictionary-attackable.  Prefer:

```text
ADDRESS_COMMIT(normalized_address, salt, domain)
```

or a private HMAC index with documented key management.

Key non-claim:

```text
A valid proof can only prove the declared relation over the declared envelope.
It does not repair incorrect address resolution.
```

### 4. Geographic and delivery optimization theory

Purpose:

- answer region membership and delivery availability;
- combine coordinates, AGID regions, postal-equivalent regions, carrier service
  areas, roads, POIs, islands, exclaves, and temporary events;
- expose uncertainty and source version.

Formal object:

```text
Deliverable(a, carrier, t, V_s) -> {available, reasons, confidence}
```

AddressQL functions:

- `ADDRESS_WITHIN`
- `GEOCODE`
- `REVERSE_GEOCODE`
- `ADDRESS_DISTANCE`
- `DELIVERY_AVAILABLE`
- `DELIVERY_AREA`
- `DELIVERY_ESTIMATE`
- `DELIVERY_RISK_SCORE`

Key non-claim:

```text
Deliverability is not proof of residence, ownership, sovereignty, or final route
availability.
```

### 5. Address version management and history theory

Purpose:

- replay old query results under old source versions;
- handle changed postal codes, renamed places, merged municipalities, and
  deprecated schemas;
- keep auditability without storing raw private addresses in logs.

Formal object:

```text
F(x, V_s, t) -> y
H = (states, transitions, source_versions)
```

AddressQL functions:

- `ADDRESS_SCHEMA`
- `ADDRESS_NORMALIZE`
- `ADDRESS_MATCH`
- `POSTAL_VALIDATE`
- `ADDRESS_POLICY_CHECK`
- `ADDRESS_ACK`

Key non-claim:

```text
New source data does not erase the meaning of a previous result under a declared
source version.
```

### 6. Distributed address database theory

Purpose:

- support multiple adapters and source packs;
- support offline/local evaluation;
- use source roots and conformance levels instead of pretending all databases
  behave identically.

Formal object:

```text
S_i = (source_root_i, adapter_level_i, cache_state_i)
Merge(S_i, S_j) -> auditable compatibility state
```

AddressQL functions:

- `ADDRESS_SCHEMA`
- `POSTAL_LOOKUP`
- `DELIVERY_TOKEN_VERIFY`
- `ADDRESS_VERIFY_PROOF`
- `ADDRESS_POLICY_CHECK`
- `ADDRESS_ACK`

Key non-claim:

```text
Distributed compatibility is not global consensus on every address fact.
```

### 7. AddressQL query language theory

Purpose:

- define a minimal safe query algebra for address functions;
- let SQL and NoSQL adapters share result schemas and conformance tests;
- make determinism, source versions, and privacy boundaries first-class.

Formal object:

```text
e ::= function(args)
type(e) = R
determinism(e) in {immutable, stable_by_source_version, volatile}
policy(e) = P
```

AddressQL functions:

- `ADDRESS_PARSE`
- `ADDRESS_NORMALIZE`
- `ADDRESS_MATCH`
- `POSTAL_VALIDATE`
- `DELIVERY_AVAILABLE`
- `ADDRESS_POLICY_CHECK`
- `ADDRESS_ACK`

Required artifacts:

- BNF grammar;
- typed result schemas;
- deterministic replay tests;
- query rewrite safety rules.

### 8. Address index theory

Purpose:

- combine postal code, coordinate, administrative hierarchy, landmark, alias,
  and commitment indexes;
- support countries with no postal code and countries with weak postal systems;
- reduce search cost while controlling privacy leakage.

Formal object:

```text
I = I_postal x I_geo x I_admin x I_alias x I_landmark x I_commit
Leak(I) <= epsilon
```

AddressQL functions:

- `POSTAL_LOOKUP`
- `POSTAL_VALIDATE`
- `ADDRESS_WITHIN`
- `ADDRESS_DISTANCE`
- `ADDRESS_MATCH`
- `ADDRESS_COMMIT`

Key non-claim:

```text
Indexes improve retrieval, not truth.  Commitment indexes require salt, domain,
and key-management policy.
```

## Mathematical Foundations

| field | SQL role | AddressQL role |
| --- | --- | --- |
| set theory | Tables, rows, relations, candidate sets | Address expressions, region sets, source-versioned candidate sets |
| predicate logic | WHERE clauses, joins, constraints | within(region), deliverable(carrier), proof claim, policy allowed |
| discrete mathematics | finite structures and identifiers | component tuples, session states, country schemas |
| graph theory | dependency and network analysis | alias graph, hierarchy graph, road/POI graph, lineage graph |
| algebra | relational algebra and composition | parse -> normalize -> match -> policy_check -> ack |
| formal language theory | SQL grammar | AddressQL grammar and country address grammars |
| automata theory | parser/compiler machinery | streaming address recognizers and token/session state machines |
| computational complexity | query cost | fuzzy matching, geospatial containment, proof verification cost |
| optimization theory | query optimizer | candidate pruning, delivery partitioning, least-disclosure proof planning |
| probability theory | cost/selectivity estimates | candidate ranking, confidence, uncertain source evidence |
| statistics | histograms and plan choice | benchmark metrics, drift, recall/precision, quality reports |
| information theory | compression and encoding | ambiguity, leakage, postal-equivalent information gain |
| cryptography | encrypted DBs and commitments | commitments, proof bundles, signatures, roots, unsafe hash boundary |
| number theory | some crypto algorithms | finite-field proof-system compatibility |
| geometry | spatial databases and GIS | region membership, distance, nearest neighbor, grid references |
| topology | boundaries and connectedness | islands, exclaves, holes, adjacency, vertical reference separation |

## Query Semantics

An AddressQL function is not just a SQL UDF.  It is a typed, policy-aware,
source-versioned operator:

```text
F: X x V_s x P -> Y x E x N
```

where:

- `X` is the input domain;
- `V_s` is the source version;
- `P` is the policy context;
- `Y` is the typed output;
- `E` is explanation metadata;
- `N` is a set of non-claims.

For `stable_by_source_version` functions:

```text
F(x, V_s, P) = F(x, V_s, P)
```

must hold under replay.  If it does not, the adapter is non-conformant.

For `volatile` functions:

```text
F(x, V_s, P, t, roots) -> y
```

must include enough freshness, root, time, or token metadata to explain why the
result may change.

## Index Model

AddressQL should use multi-index retrieval:

```text
Candidates(q) =
  Union(
    PostalIndex(q),
    AdminIndex(q),
    GeoIndex(q),
    AliasIndex(q),
    LandmarkIndex(q),
    CommitmentIndex(q)
  )
```

Then:

```text
Rank(Candidates, purpose, source_version, policy)
```

is allowed to rank candidates, but not to overclaim identity.  Exact identity,
PID issuance, residence proof, and proof verification remain separate
operations.

## Country And Postal Metadata Extension

Country and postal functions are necessary because AddressQL cannot assume that
every country has the same address grammar, language policy, subdivision model,
or postal-code system.

The country layer answers:

```text
Which country profile, language policy, address schema, postal status, and
source policy should this query use?
```

Core functions:

- `COUNTRY_RESOLVE`
- `COUNTRY_ADDRESS_PROFILE`
- `COUNTRY_SUBDIVISIONS`
- `COUNTRY_LANGUAGES`
- `COUNTRY_POSTAL_STATUS`
- `COUNTRY_SOURCE_POLICY`

The postal layer answers:

```text
Is a postal code present, required, normalized, valid, suggestible, or replaceable
by a postal-equivalent operational region?
```

Core functions:

- `POSTAL_STATUS`
- `POSTAL_FORMAT`
- `POSTAL_NORMALIZE`
- `POSTAL_PARSE`
- `POSTAL_REQUIRED`
- `POSTAL_VALIDATE`
- `POSTAL_LOOKUP`
- `POSTAL_AREA`
- `POSTAL_EQUIVALENT`
- `POSTAL_SUGGEST`

The most important rule is:

```text
POSTAL_EQUIVALENT(...) creates a fallback operational region, not an official
postal code.
```

This is essential for no-postal-code countries and weak postal-code countries.
AddressQL must support native language and English address forms, but language
choice is not identity, nationality, or residence proof.

## Research Artifacts To Build Next

1. `country-postal-functions.md`
   Country functions, postal status classes, postal-equivalent fallback, and
   native language and English form workflows.

2. `addressql-bnf.md`
   AddressQL grammar, function-call grammar, claim grammar, and policy grammar.

3. `addressql-index-model.md`
   Postal/admin/geo/alias/landmark/commitment index model with leakage notes.

4. `addressql-query-cost.md`
   Cost model for parse, normalize, match, geospatial lookup, and proof verify.

5. `addressql-distributed-replay.md`
   Source-root, cache invalidation, offline replay, and adapter conformance
   rules.

6. `addressql-proof-semantics.md`
   Proof claim algebra, public signal boundary, unsafe hash counterexamples, and
   non-claims.
