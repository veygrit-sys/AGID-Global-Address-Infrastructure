# AddressQL Research Plan

Status: independent research program

AddressQL should have its own papers and mathematical models.  It should be
compatible with Address Morphism Theory, but it must not be folded into the AMT
paper.

## Research Boundary

```text
AMT asks:
  What is an address referent and when may it be safely resolved?

AddressQL asks:
  How can database systems query, validate, compare, communicate, and prove
  address facts using portable functions?
```

## AddressQL Theory Map

The detailed theory map is maintained in
[Theory Foundations](theory-foundations.md).  It separates eight research
domains:

```text
1. address morphism and normalization
2. fuzzy and multilingual address search
3. address proof and authentication
4. geographic and delivery optimization
5. address version and history management
6. distributed address databases
7. AddressQL query-language theory
8. address index theory
```

These domains are grounded in SQL-relevant mathematics: set theory, predicate
logic, discrete mathematics, graph theory, algebra, formal language theory,
automata theory, complexity, optimization, probability, statistics, information
theory, cryptography, number theory, geometry, and topology.

The implementation-oriented synthesis across database research, GIS, and
logistics is maintained in
[Database/GIS/Logistics Synthesis](database-gis-logistics-synthesis.md).  It
defines optimizer rules, spatial kernels, delivery service-area models,
handoff/ACK semantics, and privacy-preserving query boundaries.

Country and postal-specific functions are maintained in
[Country And Postal Functions](country-postal-functions.md).  This layer covers
country resolution, country address profiles, native language and English form
rendering, postal-system status, postal format and normalization, no-postal-code
fallbacks, weak postal-code handling, and postal-equivalent regions.

The executable global preload contract is maintained in
[Global Country Preload v0.7](global-country-preload-v0.7.md).  It makes every
country and territory a local AddressQL profile before live source use, while
separating verified postal validation from weak, absent, carrier-specific, or
postal-equivalent-only states.

## Cross-Cutting Layers

The cross-cutting layer plan is maintained in
[Cross-Cutting Layers](cross-cutting-layers.md).  The priority order is:

```text
1. Security / Privacy / ZK
2. Linguistics / Multilingual / NLP
3. Standards / Interoperability
4. Governance / Source Policy / Licensing
5. Temporal / Versioning
6. Developer Experience / Conformance
7. UX / Address Forms
```

## v0.2 Implementation Thesis. Rust Core Separation

v0.1 proves that AddressQL can be exposed as PostgreSQL JSONB functions.  v0.2
must prevent PostgreSQL from becoming the only implementation of the semantics.
The core logic therefore moves to `native/addressql-core`.

```text
AddressQL function semantics
        ↓
addressql-core Rust structs and pure functions
        ↓
PostgreSQL / SQLite / WASM / CLI / SDK adapters
```

Mathematical model:

\[
F_{core}: X \times V_s \to Y
\]

\[
R_{adapter}: Y \to O_{adapter}
\]

where \(F_{core}\) is the source-versioned pure function and \(R_{adapter}\)
renders the same result into JSONB, BSON, protobuf, SDK-native objects, or CLI
output.  Adapters may change serialization, but they must not change non-claims
or source-version semantics.

Executable artifacts:

- `native/addressql-core`;
- Rust typed structs;
- synthetic fixtures;
- static conformance tests;
- future pgrx/SQLite/WASM bridge contracts.

These layers sit above the database/GIS/logistics core and prevent AddressQL
from becoming merely a convenient but unsafe address function library.

## v0.7 Implementation Thesis. Global Country Preload

AddressQL must be able to answer the first country-specific questions locally:

```text
What form should be rendered?
Is native-language input available?
Is English input available?
Is a postal code required?
Is postal validation strict, weak, absent, or source-review-only?
What fallback is allowed?
What must not be claimed?
```

The preload map is:

\[
L : C \to (F_c, P_c, S_c, V_c)
\]

where \(C\) is the set of country or territory codes, \(F_c\) is the
address-format profile, \(P_c\) is the postal-status profile, \(S_c\) is source
policy, and \(V_c\) is validation readiness.

The key safety rule is:

\[
\forall c \in C,\; NonClaims(L(c)) \ne \varnothing
\]

No-postal-code countries satisfy:

\[
P_c = no\_postal\_code
  \Rightarrow POSTAL\_VALIDATE(c, x) \ne official\_postal\_code\_valid
\]

Weak postal-code countries satisfy:

\[
P_c = weak\_or\_partial
  \Rightarrow postal(c, x) \text{ is advisory unless joined with admin/spatial/delivery evidence.}
\]

Executable artifacts:

- `src/lib/addressQlGlobalCountryPreload.ts`;
- `src/lib/addressQlGlobalCountryPreload.test.ts`;
- `docs/addressql/global-country-preload-v0.7.md`;
- `npm run verify:addressql-global-preload`.

Non-claim:

```text
A preloaded country profile is not proof of complete national address coverage,
residence, identity, or carrier deliverability.
```

## v0.3 Implementation Thesis. DuckDB For Analysis And Local Verification

v0.3 adds `extensions/addressql-duckdb` as the research workbench.  PostgreSQL is
the full adapter, Rust is the shared core, and DuckDB is the fast local layer
for auditing source packs and reproducing paper results.

```text
source packs / synthetic fixtures
        ↓
DuckDB local views and macros
        ↓
postal-gap reports, fixture validation, benchmark corpus checks
```

Mathematical model:

\[
Q_{duck}: D_{local} \times V_s \to R_{analysis}
\]

where \(D_{local}\) is a local dataset such as CSV, JSON, or Parquet-style
fixtures, \(V_s\) is the source version, and \(R_{analysis}\) is an analytical
report.  The adapter is allowed to optimize local scans and aggregation, but it
must preserve AddressQL non-claims and source-version semantics.

Executable artifacts:

- `extensions/addressql-duckdb`;
- DuckDB SQL macros;
- synthetic country, postal, and address fixtures;
- postal gap reports;
- local smoke test script;
- static TypeScript conformance checks.

Non-claim:

```text
DuckDB results are local analytical evidence, not carrier production decisions
and not authoritative global postal coverage.
```

## v0.4 Implementation Thesis. API/SDK Parity

v0.4 adds TypeScript, Python, and Rust SDKs.  The purpose is to make AddressQL
usable outside SQL while preserving the same non-claims and source-version
semantics.

```text
AddressQL specification
        ↓
addressql-core / synthetic fixtures
        ↓
TypeScript SDK / Python SDK / Rust SDK
        ↓
apps, notebooks, CLI tools, database bridges
```

Mathematical model:

\[
B_{\ell}: F_{canon} \to F_{\ell}
\]

where \(F_{canon}\) is a canonical AddressQL function and \(B_{\ell}\) is the
language binding for language \(\ell \in \{TypeScript, Python, Rust\}\).
Bindings may change naming style, but they must preserve:

```text
source_version
warnings
non_claims
purpose-relative decisions
no-production-network behavior
```

Executable artifacts:

- `sdk/addressql-js-ts`;
- `sdk/addressql-py`;
- `sdk/addressql-rs`;
- SDK parity test metadata;
- local TypeScript and Python tests;
- Cargo-based Rust build path.

Non-claim:

```text
SDK availability does not imply a hosted AddressQL service, production carrier
integration, or legal address verification.
```

## v0.5 Implementation Thesis. Calcite Planner Deferred Until Dialect Pressure

v0.5 does not add a Java runtime dependency by default.  It defines the
activation gates and planner semantics for `addressql-calcite-planner`.
AddressQL should move to Apache Calcite only when the function surface becomes a
true cross-database query language rather than a set of bounded adapter
functions.

```text
AddressQL SQL text
        ↓
dialect parser and validator
        ↓
AddressQL relational algebra
        ↓
source-version, geospatial, privacy, and non-claim rewrites
        ↓
PostgreSQL / DuckDB / SQLite / MySQL / SDK adapter SQL
```

Mathematical model:

\[
P_{calcite}: Q_{AddressQL} \times C_{adapter} \times V_s \to Plan_{adapter}
\]

where \(Q_{AddressQL}\) is an AddressQL query, \(C_{adapter}\) is the target
adapter capability set, \(V_s\) is the source version, and \(Plan_{adapter}\) is
the emitted adapter-specific execution plan.  A conformant planner may rewrite
query shape, but it must preserve:

```text
determinism class
source_version
privacy boundary
volatile-delivery barriers
proof public-signal boundary
non_claims
```

Activation threshold:

```text
\left|G_{active}\right| \ge 3
```

where \(G_{active}\) is the set of active Calcite activation gates.  This keeps
the project from prematurely importing a large planner stack before PostgreSQL,
Rust core, DuckDB, and SDK parity have proven the actual dialect pressure.

Executable artifacts:

- `docs/addressql/calcite-v0.5.md`;
- `integrations/addressql-calcite`;
- activation-gate registry;
- rewrite-rule registry;
- planner non-claim tests;
- no Maven, Gradle, or Calcite runtime dependency until activation.

Non-claim:

```text
v0.5 is planner readiness, not a working Apache Calcite parser, optimizer, or
federated SQL engine.
```

## v0.6 Implementation Thesis. ZK Proof Hooks Before Real Circuits

v0.6 strengthens the privacy-proof layer without pretending to ship real ZK
circuits.  The release defines a proof input schema, verifier hook, allowed
public signals, root references, and non-claim tests for `ADDRESS_PROVE` and
`ADDRESS_VERIFY_PROOF`.

```text
AMT-compatible envelope commitment
        ↓
AddressQL proof input schema
        ↓
schema and private-material rejection
        ↓
verifier hook
        ↓
schema-only decision or external verifier receipt
```

Mathematical model:

\[
ZKVerify(E, C, P, R, S; W) = 1
\]

where \(E\) is the envelope commitment, \(C\) is the claim, \(P\) is the verifier
policy, \(R\) is the root set, \(S\) is the public signal set, and \(W\) is the
private witness.  AddressQL v0.6 implements only:

\[
SchemaOK(E,C,P,R,S) \land PublicOnly(S) \land NoPrivateMaterial(Input)
\]

Therefore:

\[
SchemaOK \not\Rightarrow ZKVerify
\]

and:

\[
ZKVerify \not\Rightarrow AddressResolutionCorrect
\]

Executable artifacts:

- `src/lib/addressQlZkProofHooks.ts`;
- `src/lib/addressQlZkProofHooks.test.ts`;
- `docs/addressql/zk-proof-hooks-v0.6.md`;
- public-signal allowlist;
- verifier-hook profile registry;
- non-claim and private-material rejection tests.

Non-claim:

```text
v0.6 is proof-hook readiness, not real circuit verification, not audited ZK,
not witness generation, and not proof of residence.
```

## Paper 1. AddressQL: Query Semantics for Structured Address Data

Scope:

- address data types;
- function classes;
- SQL/NoSQL adapter semantics;
- determinism;
- source-version stability;
- conformance levels.

Mathematical model:

\[
F : X \times V_s \to Y
\]

where \(F\) is an AddressQL function, \(X\) is input data, \(V_s\) is source
version, and \(Y\) is a typed result.

Key theorem:

If a function is declared `stable_by_source_version`, then replay under the same
source version must produce the same result or the adapter is non-conformant.

Executable artifacts:

- function registry;
- adapter conformance tests;
- deterministic replay fixtures.

## Paper 2. Address Matching and Quality Functions in AddressQL

Scope:

- `ADDRESS_MATCH`;
- `ADDRESS_EXPLAIN_MATCH`;
- `ADDRESS_SIMILARITY`;
- `ADDRESS_SCORE`;
- `ADDRESS_ISSUES`.

Mathematical model:

\[
\operatorname{Match}_p(a,b,V_s)
=
(\operatorname{decision}, \operatorname{confidence}, \operatorname{explanation})
\]

Non-claim:

High similarity is not identity, residence proof, or PID issuance.

## Paper 3. Privacy-Preserving Address Queries

Scope:

- `ADDRESS_COMMIT`;
- `ADDRESS_ENVELOPE_CREATE`;
- `ADDRESS_PROVE`;
- `ADDRESS_VERIFY_PROOF`;
- `ADDRESS_POLICY_CHECK`;
- unsafe `ADDRESS_HASH` boundary.

Mathematical model:

\[
\operatorname{ProofQuery}
=
(\operatorname{envelope}, \operatorname{claim}, \operatorname{policy}, \operatorname{roots})
\]

Unsafe boundary:

\[
H(\operatorname{normalizedAddress})
\]

is not privacy protection.  Address spaces are often enumerable.

## Paper 4. AddressQL for Delivery Eligibility and Address Communication

Scope:

- `DELIVERY_AVAILABLE`;
- `DELIVERY_TOKEN_CREATE`;
- `DELIVERY_TOKEN_VERIFY`;
- `ADDRESS_ACK`;
- Address Communication Object compatibility.

Mathematical model:

\[
\operatorname{ValidComm}(m,s,r,c,t)=1
\]

where \(m\) is an address communication object, \(s\) is sender, \(r\) is
receiver, \(c\) is capability, and \(t\) is time.

Non-claim:

ACK `deliverable` is not proof of residence, ownership, sovereignty, or identity.

## Paper 5. Congestion-Aware Address Queries and Reachability Operators

Scope:

- `ADDRESS_TRAVEL_TIME`;
- `ADDRESS_CONGESTION_SCORE`;
- `ADDRESS_DELIVERY_DIFFICULTY`;
- `ADDRESS_REACHABLE_WITHIN`;
- `ADDRESS_BOTTLENECKS`;
- traffic congestion theory, queueing, bottleneck, and delay-aware delivery
  models.

Mathematical model:

\[
T(a,b,t,m,V_s) =
  D_{network}(a,b,m,V_s)
  + Q(b,t,V_s)
  + B(path(a,b),V_s)
  + C(region(b),t,m,V_s)
\]

where \(T\) is an estimated travel-time or delivery-delay function,
\(D_{network}\) is mode-specific network distance/time, \(Q\) is queueing
delay, \(B\) is bottleneck penalty, and \(C\) is congestion pressure.

Non-claim:

```text
Travel time and difficulty are operational estimates, not delivery guarantees,
not surveillance, and not proof of residence.
```

Executable artifacts:

- synthetic congestion grid;
- bottleneck fixture;
- queueing fixture;
- distance-vs-delay counterexample;
- privacy-boundary tests for movement traces.

## Paper 6. AddressQL Adapter Conformance for SQL and NoSQL Systems

Scope:

- PostgreSQL;
- SQLite;
- MySQL;
- MongoDB;
- Firestore;
- DynamoDB;
- JSON result schemas;
- golden fixtures.

Conformance levels:

```text
L0 registry
L1 normalization
L2 matching/postal
L3 delivery/communication
L4 proof/privacy
```

## Open-Source Milestones

### Milestone 1: specification-only release

- `docs/addressql/specification-v0.1.md`
- function registry;
- JSON schemas;
- synthetic fixtures;
- no raw address fixture policy.

### Milestone 2: TypeScript reference implementation

- parser facade;
- normalization facade;
- match/explain-match fixture engine;
- policy checker;
- semantic ACK checker.

### Milestone 3: PostgreSQL prototype

- extension-like SQL wrappers;
- deterministic function labels;
- JSONB result format;
- source-version table.

### Milestone 4: SQLite/local prototype

- local-first address validation;
- offline conformance fixtures;
- no external network requirement.

### Milestone 5: proof hooks

- envelope-based proof input schema;
- proof verification stub;
- non-claim and unsafe-hash tests.

## Why This Should Be Separate

AMT should remain a theory of address referents and safe resolution.  AddressQL
should be the database query surface.  Mixing them would make the AMT paper too
implementation-heavy and make AddressQL look like a footnote rather than a
usable open-source project.

The right relationship is:

```text
AMT = theory
AGID = spatial identifier substrate
ZK Address Predicates = privacy proof layer
Address Communication Object = message semantics
AddressQL = database query and adapter layer
```
