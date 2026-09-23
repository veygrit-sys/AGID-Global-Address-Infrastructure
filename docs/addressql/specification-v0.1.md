# AddressQL Specification v0.1

Status: draft

## 1. Goal

AddressQL defines a database-facing query surface for address processing.  It
standardizes function names, result shapes, source-version behavior,
determinism, privacy boundaries, and conformance tests.

AddressQL is not:

- a replacement for Address Morphism Theory;
- a new database engine;
- a claim that all addresses are globally resolvable;
- a privacy system by itself;
- a proof that a user resides at an address.

## 2. Architecture

```text
PostgreSQL / SQLite / MySQL / MongoDB / Firestore / DynamoDB
        ↓
AddressQL Adapter
        ↓
AddressQL Core Model and Function Registry
        ↓
AGID / AMT Envelope / Postal Sources / Address Communication Object
        ↓
ZK Address Predicates / Delivery / Validation / Address Login
```

## 3. Determinism

Every AddressQL function must declare one of three determinism levels.

| level | meaning | examples |
| --- | --- | --- |
| `immutable` | same input always gives same output without source lookup | `ADDRESS_MASK`, `ADDRESS_COMMIT` |
| `stable_by_source_version` | same input and same source version give same output | `ADDRESS_NORMALIZE`, `ADDRESS_MATCH`, `POSTAL_VALIDATE` |
| `volatile` | output can vary by time, registry roots, tokens, carrier state, or external proof state | `DELIVERY_ESTIMATE`, `ADDRESS_PROVE`, `ADDRESS_VERIFY_PROOF` |

This matters because database adapters must know which functions can be indexed,
cached, materialized, or safely replayed.

## 4. Function Classes

AddressQL v0.1 has nine classes:

```text
1. structure
2. country_metadata
3. matching_quality
4. postal_geo
5. congestion_mobility
6. delivery
7. privacy_proof
8. international_io
9. communication
```

The MVP should implement structure, country metadata, postal status and
validation, matching, delivery availability, commitment/envelope/proof hooks,
and semantic ACK first.

Canonical companion files:

- [Technical Stack](technical-stack.md)
- [Function Registry v0.1](function-registry-v0.1.md)
- [Country And Postal Functions](country-postal-functions.md)
- [Congestion And Mobility Functions](congestion-mobility-functions.md)
- [ZK Proof Hooks v0.6](zk-proof-hooks-v0.6.md)
- [Theory Foundations](theory-foundations.md)
- [Database/GIS/Logistics Synthesis](database-gis-logistics-synthesis.md)
- [Cross-Cutting Layers](cross-cutting-layers.md)
- [Research Plan](research-plan.md)

## 5. Core Functions

### `ADDRESS_PARSE(address_text, country?, source_version?)`

Parses a surface address expression into components.  Parsing is not identity.

### `ADDRESS_NORMALIZE(address_text, country, source_version?)`

Normalizes an address expression under a country schema and source version.
Normalization is not referent resolution.

### `ADDRESS_MATCH(address_a, address_b, purpose?, source_version?)`

Returns a purpose-relative match decision.  This must not be implemented as
string equality.

### `COUNTRY_RESOLVE(country_input, standard?, source_version?)`

Resolves localized country names, aliases, or code-like inputs to a country
reference.  Country resolution is not sovereignty adjudication.

### `COUNTRY_ADDRESS_PROFILE(country, source_version?)`

Returns address field order, required components, locale policy, and postal
status for rendering country-specific forms.

### `COUNTRY_POSTAL_STATUS(country, source_version?)`

Returns whether postal codes are official, absent, weak/partial,
carrier-specific, or require postal-equivalent fallback.

### `COUNTRY_SOURCE_POLICY(country, purpose?, source_version?)`

Returns source ranking and fallback policy for the country and purpose.  This is
evidence policy, not political recognition.

### `ADDRESS_EXPLAIN_MATCH(address_a, address_b, purpose?, source_version?)`

Returns explanation metadata:

```json
{
  "match": true,
  "confidence": 0.93,
  "matched_components": ["country", "region", "city"],
  "missing_components": ["room"],
  "evidence": ["postal", "admin", "agid"],
  "non_claims": ["not proof of residence"]
}
```

### `ADDRESS_TRAVEL_TIME(address_a_or_region, address_b_or_region, time?, mode?, source_version?)`

Returns a volatile travel-time estimate for a declared time, mode, and source
version.  It should use road-network, pedestrian-network, ferry, building-entry,
or carrier-mode evidence when available.

Non-claim: travel time is not a route, SLA, or delivery guarantee.

### `ADDRESS_CONGESTION_SCORE(address_or_region, time?, mode?, source_version?)`

Returns an area-level congestion score.  It may consider flow, density, event
surge, queue pressure, road graph bottlenecks, and facility constraints.

Non-claim: congestion score is not surveillance, residence proof, safety
classification, or legal access control.

### `ADDRESS_DELIVERY_DIFFICULTY(address_or_region, carrier?, service_level?, time?, source_version?)`

Returns a delivery-difficulty score by combining congestion, bottlenecks,
vertical access, queueing, mode constraints, carrier capability, and declared
service level.

Non-claim: delivery difficulty is operational decision support, not a blacklist
or refusal by itself.

### `ADDRESS_REACHABLE_WITHIN(origin_or_region, target_or_region, minutes, time?, mode?, source_version?)`

Returns whether a target is reachable within a time budget under a declared
mode, time window, source version, and policy context.

Non-claim: reachability is time-, mode-, source-, and policy-dependent, not
universal physical access.

### `ADDRESS_BOTTLENECKS(address_or_region, radius?, mode?, source_version?)`

Returns source-versioned bottleneck candidates such as bridges, gates, narrow
roads, rail crossings, ports, airports, lobbies, lockers, stairs, or elevators.

Non-claim: bottleneck candidates may be incomplete or time-dependent and require
source verification.

### `DELIVERY_AVAILABLE(address_or_envelope, carrier?, service_level?, source_version?)`

Returns whether the address reference is deliverable for a declared purpose,
carrier, and source version.  Deliverability is not identity verification.

### `POSTAL_STATUS(country, source_version?)`

Returns a country-level postal-system status for query planning.

### `POSTAL_FORMAT(country, source_version?)`

Returns format metadata and normalization rules.  Format validity is not
assigned-code validity.

### `POSTAL_FORMAT_VALIDATE(postal_code, country, source_version?)`

Returns whether the normalized postal code satisfies the country format only.
It does not claim that the code exists in the real postal system.

### `POSTAL_NORMALIZE(postal_code, country, source_version?)`

Normalizes postal code casing, spacing, separators, and local variants.

### `POSTAL_EXISTS(postal_code, country, source_version?)`

Returns whether the normalized code exists in the loaded source-version dataset.
If no local existence dataset is loaded, the result must be unknown/null rather
than invented.

### `POSTAL_REQUIRED(address_or_components, country, purpose?, source_version?)`

Decides whether a postal code is required for a purpose.  Requiredness is
purpose-relative.

### `POSTAL_EQUIVALENT(address_or_region, country, policy?, source_version?)`

Returns a fallback operational region for countries without useful postal codes.
It must never claim to create an official postal code.

### `ADDRESS_COMMIT(normalized_address, salt, domain)`

Creates a domain-separated address commitment.  Commitment security depends on
salt quality, domain separation, and storage policy.

### `ADDRESS_ENVELOPE_CREATE(resolution_certificate, policy, source_version)`

Creates an AMT-compatible envelope.  The envelope is not the raw address and not
a PID by itself.

### `ADDRESS_PROVE(envelope, claim, proof_policy)`

Creates a proof bundle over an envelope.  The primary public interface must be
envelope-based, not raw-address-based.

### `ADDRESS_VERIFY_PROOF(proof_bundle, claim, verifier_policy, roots?)`

Verifies a proof statement.  Verification checks the proof relation, not the
full truth of the world.

### `ADDRESS_POLICY_CHECK(envelope_or_message, policy, receiver_capability?)`

Checks least-disclosure, purpose, audience, retention, and proof boundaries.

### `ADDRESS_ACK(address_communication_object, receiver_capability, policy)`

Returns a semantic acknowledgement:

```text
received
parsed
referent_accepted
deliverable
proof_verified
rejected
expired
revoked
manual_review_required
disclosure_denied
policy_mismatch
```

ACK `deliverable` is not proof of residence, ownership, or sovereignty.

## 5.1 Canonical Function Registry

The canonical v0.1 function registry is maintained in
[Function Registry v0.1](function-registry-v0.1.md).  The registry is intentionally
around thirty functions, not hundreds.  A function is not admitted unless it
declares:

- phase;
- category;
- determinism;
- inputs;
- output kind;
- privacy risk;
- compatibility layer;
- non-claim boundary.

The registry is also represented as executable metadata in
`src/lib/addressQlResearch.ts`.

## 6. Unsafe Function Boundary

### `ADDRESS_HASH(normalized_address)`

This function is discouraged and unsafe-by-default.

Plain address hashes are dictionary-attackable because address spaces are often
guessable.  If retained, `ADDRESS_HASH` must be documented as unsuitable for
privacy protection.

Use instead:

```sql
ADDRESS_COMMIT(normalized_address, salt, domain)
```

or an HMAC-style private index controlled by a key-management policy.

## 7. Adapter Levels

| level | adapter requirement |
| --- | --- |
| L0 | function registry and JSON result schemas |
| L1 | deterministic structure and normalization functions |
| L2 | matching, scoring, postal validation, source-version tests |
| L3 | delivery availability and Address Communication Object compatibility |
| L4 | proof/envelope hooks and privacy non-claim tests |

PostgreSQL should be the first full adapter target.  SQLite should be the first
portable/local adapter target.

The detailed adapter and technology plan is maintained in
[Technical Stack](technical-stack.md).

## 8. Conformance

An AddressQL adapter is conformant only if it passes:

- function registry coverage;
- determinism declarations;
- no raw address public fixtures;
- unsafe hash warning tests;
- source-version stability tests;
- non-claim tests;
- AMT envelope compatibility tests;
- Address Communication Object ACK tests.
