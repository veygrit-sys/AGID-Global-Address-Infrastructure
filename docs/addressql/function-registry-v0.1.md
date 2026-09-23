# AddressQL Function Registry v0.1

Status: canonical draft registry

Every function must declare phase, category, determinism, output kind, privacy
risk, compatibility boundary, and non-claim.  AddressQL keeps a bounded
surface by separating MVP functions from v0.2/v0.3 research functions.

## Determinism

| value | meaning |
| --- | --- |
| `immutable` | Same input always gives the same output without source lookup |
| `stable_by_source_version` | Same input and same source version give the same output |
| `volatile` | Output can vary by time, roots, external state, tokens, or proof state |

## Function Table

| function | phase | category | determinism | output | privacy |
| --- | --- | --- | --- | --- | --- |
| `ADDRESS_PARSE` | mvp | structure | stable_by_source_version | AddressComponents | medium |
| `ADDRESS_NORMALIZE` | mvp | structure | stable_by_source_version | NormalizedAddressExpression | medium |
| `ADDRESS_COMPONENT` | mvp | structure | stable_by_source_version | ComponentValue | medium |
| `ADDRESS_SCHEMA` | mvp | structure | stable_by_source_version | CountryAddressSchema | low |
| `COUNTRY_RESOLVE` | mvp | country_metadata | stable_by_source_version | CountryResolution | low |
| `COUNTRY_ADDRESS_PROFILE` | mvp | country_metadata | stable_by_source_version | CountryAddressProfile | low |
| `COUNTRY_SUBDIVISIONS` | v0_2 | country_metadata | stable_by_source_version | CountrySubdivisionSet | low |
| `COUNTRY_LANGUAGES` | v0_2 | country_metadata | stable_by_source_version | CountryLanguagePolicy | low |
| `COUNTRY_POSTAL_STATUS` | mvp | country_metadata | stable_by_source_version | CountryPostalStatus | low |
| `COUNTRY_SOURCE_POLICY` | mvp | country_metadata | stable_by_source_version | CountrySourcePolicy | low |
| `ADDRESS_CANONICAL` | v0_2 | international_io | stable_by_source_version | CanonicalAddressObject | medium |
| `ADDRESS_FORMAT` | v0_2 | international_io | stable_by_source_version | FormattedAddressText | medium |
| `ADDRESS_TRANSLATE` | v0_2 | international_io | stable_by_source_version | LocalizedAddressExpression | medium |
| `ADDRESS_MATCH` | mvp | matching_quality | stable_by_source_version | BooleanMatchDecision | high |
| `ADDRESS_EXPLAIN_MATCH` | mvp | matching_quality | stable_by_source_version | MatchExplanation | high |
| `ADDRESS_SIMILARITY` | mvp | matching_quality | stable_by_source_version | SimilarityScore | high |
| `ADDRESS_SCORE` | mvp | matching_quality | stable_by_source_version | QualityScore | medium |
| `ADDRESS_ISSUES` | mvp | matching_quality | stable_by_source_version | AddressIssueList | medium |
| `POSTAL_VALIDATE` | mvp | postal_geo | stable_by_source_version | PostalValidationResult | medium |
| `POSTAL_STATUS` | mvp | postal_geo | stable_by_source_version | PostalSystemStatus | low |
| `POSTAL_FORMAT` | mvp | postal_geo | stable_by_source_version | PostalCodeFormat | low |
| `POSTAL_FORMAT_VALIDATE` | mvp | postal_geo | immutable | PostalFormatValidationResult | low |
| `POSTAL_NORMALIZE` | mvp | postal_geo | stable_by_source_version | NormalizedPostalCode | low |
| `POSTAL_PARSE` | v0_2 | postal_geo | stable_by_source_version | PostalCodeComponents | low |
| `POSTAL_REQUIRED` | mvp | postal_geo | stable_by_source_version | PostalRequirementDecision | low |
| `POSTAL_EXISTS` | mvp | postal_geo | stable_by_source_version | PostalExistenceResult | low |
| `POSTAL_LOOKUP` | v0_2 | postal_geo | stable_by_source_version | PostalCandidateSet | low |
| `POSTAL_AREA` | v0_2 | postal_geo | stable_by_source_version | PostalAreaRef | low |
| `POSTAL_EQUIVALENT` | mvp | postal_geo | stable_by_source_version | PostalEquivalentRegion | medium |
| `POSTAL_SUGGEST` | v0_2 | postal_geo | stable_by_source_version | PostalSuggestionSet | medium |
| `ADDRESS_WITHIN` | mvp | postal_geo | stable_by_source_version | RegionMembershipDecision | medium |
| `GEOCODE` | v0_3 | postal_geo | stable_by_source_version | GeoCandidateSet | high |
| `REVERSE_GEOCODE` | v0_3 | postal_geo | stable_by_source_version | ReverseGeoCandidateSet | high |
| `ADDRESS_DISTANCE` | v0_2 | postal_geo | stable_by_source_version | DistanceEstimate | medium |
| `ADDRESS_TRAVEL_TIME` | v0_2 | congestion_mobility | volatile | TravelTimeEstimate | medium |
| `ADDRESS_CONGESTION_SCORE` | v0_2 | congestion_mobility | volatile | CongestionScore | medium |
| `ADDRESS_DELIVERY_DIFFICULTY` | v0_2 | congestion_mobility | volatile | DeliveryDifficultyScore | medium |
| `ADDRESS_REACHABLE_WITHIN` | v0_2 | congestion_mobility | volatile | ReachabilityDecision | medium |
| `ADDRESS_BOTTLENECKS` | v0_2 | congestion_mobility | stable_by_source_version | BottleneckSet | medium |
| `DELIVERY_AVAILABLE` | mvp | delivery | stable_by_source_version | DeliveryAvailabilityDecision | medium |
| `DELIVERY_AREA` | v0_2 | delivery | stable_by_source_version | DeliveryAreaRef | medium |
| `DELIVERY_ESTIMATE` | v0_3 | delivery | volatile | DeliveryEstimate | medium |
| `DELIVERY_RISK_SCORE` | v0_2 | delivery | stable_by_source_version | DeliveryRiskScore | medium |
| `DELIVERY_TOKEN_CREATE` | v0_2 | delivery | volatile | AddressCommunicationToken | high |
| `DELIVERY_TOKEN_VERIFY` | v0_2 | delivery | volatile | TokenVerificationDecision | medium |
| `ADDRESS_MASK` | mvp | privacy_proof | immutable | MaskedAddress | medium |
| `ADDRESS_HASH` | discouraged | privacy_proof | stable_by_source_version | UnsafeAddressHash | unsafe_by_default |
| `ADDRESS_COMMIT` | mvp | privacy_proof | immutable | AddressCommitment | medium |
| `ADDRESS_ENVELOPE_CREATE` | mvp | privacy_proof | stable_by_source_version | AMTCompatibleEnvelope | medium |
| `ADDRESS_PROVE` | mvp | privacy_proof | volatile | AddressProofBundle | high |
| `ADDRESS_VERIFY_PROOF` | mvp | privacy_proof | volatile | ProofVerificationDecision | medium |
| `ADDRESS_DISCLOSE` | v0_2 | privacy_proof | stable_by_source_version | SelectiveDisclosureResult | high |
| `ADDRESS_POLICY_CHECK` | mvp | communication | stable_by_source_version | PolicyDecision | medium |
| `ADDRESS_ACK` | mvp | communication | stable_by_source_version | SemanticAck | low |

## MVP Signatures

```sql
ADDRESS_PARSE(address_text, country?, source_version?) -> AddressComponents
ADDRESS_NORMALIZE(address_text, country, source_version?) -> NormalizedAddressExpression
ADDRESS_COMPONENT(address_or_components, component_name) -> ComponentValue
ADDRESS_SCHEMA(country, schema_version?) -> CountryAddressSchema
COUNTRY_RESOLVE(country_input, standard?, source_version?) -> CountryResolution
COUNTRY_ADDRESS_PROFILE(country, source_version?) -> CountryAddressProfile
COUNTRY_POSTAL_STATUS(country, source_version?) -> CountryPostalStatus
COUNTRY_SOURCE_POLICY(country, purpose?, source_version?) -> CountrySourcePolicy
ADDRESS_MATCH(address_a, address_b, purpose?, source_version?) -> BooleanMatchDecision
ADDRESS_EXPLAIN_MATCH(address_a, address_b, purpose?, source_version?) -> MatchExplanation
ADDRESS_SIMILARITY(address_a, address_b, purpose?, source_version?) -> SimilarityScore
ADDRESS_SCORE(address_or_envelope, purpose?, source_version?) -> QualityScore
ADDRESS_ISSUES(address_or_envelope, purpose?, source_version?) -> AddressIssueList
POSTAL_STATUS(country, source_version?) -> PostalSystemStatus
POSTAL_FORMAT(country, source_version?) -> PostalCodeFormat
POSTAL_FORMAT_VALIDATE(postal_code, country, source_version?) -> PostalFormatValidationResult
POSTAL_NORMALIZE(postal_code, country, source_version?) -> NormalizedPostalCode
POSTAL_REQUIRED(address_or_components, country, purpose?, source_version?) -> PostalRequirementDecision
POSTAL_EXISTS(postal_code, country, source_version?) -> PostalExistenceResult
POSTAL_VALIDATE(address_or_components, postal_code, country, source_version?) -> PostalValidationResult
POSTAL_EQUIVALENT(address_or_region, country, policy?, source_version?) -> PostalEquivalentRegion
ADDRESS_WITHIN(address_or_envelope, region_ref, source_version?) -> RegionMembershipDecision
DELIVERY_AVAILABLE(address_or_envelope, carrier?, service_level?, source_version?) -> DeliveryAvailabilityDecision
ADDRESS_MASK(address_or_components, level) -> MaskedAddress
ADDRESS_COMMIT(normalized_address, salt, domain) -> AddressCommitment
ADDRESS_ENVELOPE_CREATE(address_resolution_certificate, policy, source_version) -> AMTCompatibleEnvelope
ADDRESS_PROVE(envelope, claim, proof_policy) -> AddressProofBundle
ADDRESS_VERIFY_PROOF(proof_bundle, claim, verifier_policy, roots?) -> ProofVerificationDecision
ADDRESS_POLICY_CHECK(envelope_or_message, policy, receiver_capability?) -> PolicyDecision
ADDRESS_ACK(address_communication_object, receiver_capability, policy) -> SemanticAck
```

## ZK Proof Hook Boundary v0.6

`ADDRESS_PROVE` and `ADDRESS_VERIFY_PROOF` use the proof input schema defined in
[ZK Proof Hooks v0.6](zk-proof-hooks-v0.6.md).  In v0.6 these functions are
hook-ready, not circuit-complete.

Allowed public signals:

```text
challengeHash
nullifierHash
verifierPolicyHash
sourceVersion
proofExpiry
```

Required root references:

```text
issuerRoot
revocationRoot
freshnessRoot
areaRoot when the claim requires regional membership
```

The verifier hook must reject raw address text, normalized address text, precise
coordinates, witness fields, private keys, salts, proof secrets, recipient
details, and ciphertext.  A schema-only hook may accept the shape and still must
return `verified = false` because no real circuit verification happened.

Non-claim boundary:

```text
Schema acceptance is not cryptographic proof verification.
Proof verification does not prove address resolution correctness.
Deliverability is not proof of residence or identity.
```

## Congestion And Mobility Signatures

These functions import traffic congestion theory, queueing, road-network
reachability, and last-mile bottleneck analysis into AddressQL.  They are not
MVP functions because they require synthetic mobility fixtures and strict
privacy boundaries before release.

```sql
ADDRESS_TRAVEL_TIME(address_a_or_region, address_b_or_region, time?, mode?, source_version?) -> TravelTimeEstimate
ADDRESS_CONGESTION_SCORE(address_or_region, time?, mode?, source_version?) -> CongestionScore
ADDRESS_DELIVERY_DIFFICULTY(address_or_region, carrier?, service_level?, time?, source_version?) -> DeliveryDifficultyScore
ADDRESS_REACHABLE_WITHIN(origin_or_region, target_or_region, minutes, time?, mode?, source_version?) -> ReachabilityDecision
ADDRESS_BOTTLENECKS(address_or_region, radius?, mode?, source_version?) -> BottleneckSet
```

Non-claim boundary:

```text
ADDRESS_TRAVEL_TIME is not a route, SLA, or delivery guarantee.
ADDRESS_CONGESTION_SCORE is not surveillance or a safety classification.
ADDRESS_DELIVERY_DIFFICULTY is not a blacklist.
ADDRESS_REACHABLE_WITHIN is mode-, time-, source-, and policy-dependent.
ADDRESS_BOTTLENECKS may be incomplete and requires source verification.
```

## Result Schema Families

AddressQL result objects should be JSON-compatible across adapters.

| output kind | required shape | privacy boundary |
| --- | --- | --- |
| AddressComponents | country, admin/locality/street/building parts, metadata | may contain private unit fields |
| CanonicalAddressObject | version, object_kind, expression, country, quality_state, evidence, privacy | bound to `docs/specs/schemas/address-object-v0.1.schema.json`; tokenized or policy-bound before logging |
| CountryAddressProfile | field order, required components, locales, postal status, source version | metadata only; not full country data coverage |
| CountryPostalStatus | postal status, requiredness, coverage, warnings | not a guarantee of complete postal datasets |
| MatchExplanation | match, confidence, matched components, missing components, evidence, non_claims | must not expose raw private evidence |
| PostalValidationResult | version, purpose, status, confidence, source_refs, result_boundaries, privacy, non_claims | bound to `docs/specs/schemas/address-validation-result-v0.1.schema.json`; not full address identity, delivery availability, or residence proof |
| PostalSystemStatus | country, status, requiredness, format availability, coverage | not carrier availability or address identity |
| PostalCodeFormat | pattern, examples, normalization rules, source version | examples must be synthetic |
| PostalEquivalentRegion | region ref, policy, confidence, non-claims | not an official postal code |
| TravelTimeEstimate | origin, target, mode, time window, estimated minutes, confidence | not a route, SLA, or delivery guarantee |
| CongestionScore | region, time window, mode, score, drivers | area-level decision support, not person tracking |
| DeliveryDifficultyScore | address ref, carrier, service level, score, factors | must not become blacklist or hidden refusal logic |
| ReachabilityDecision | reachable, minutes, mode, time window, constraints | source-, mode-, time-, and policy-dependent |
| BottleneckSet | region, radius, mode, bottlenecks, warnings | may expose sensitive access constraints |
| DeliveryAvailabilityDecision | available, carrier, service level, reasons, source version | not residence proof |
| AMTCompatibleEnvelope | envelope version, referent commitment, state, roots, allowed predicates | not raw address disclosure |
| AddressProofBundle | proof type, claim, public signals, roots, expiry | must not store witness/private key |
| SemanticAck | ack state, message id, reasons, non_claims | not residence, ownership, or sovereignty proof |

## Unsafe Boundary

`ADDRESS_HASH` remains in the registry only to document why it is unsafe.  Plain
address hashes are dictionary-attackable and must not be marketed as privacy
protection.

Preferred:

```sql
ADDRESS_COMMIT(normalized_address, salt, domain)
```

or a private HMAC index with a documented key-management policy.

## Compatibility Boundary

AddressQL is compatible with:

- AGID for region and grid references;
- AMT for envelopes, match semantics, safe refusal, and non-claims;
- ZK Address Predicates for proof bundles;
- Address Communication Object for `ADDRESS_ACK` and token verification;
- Postal-code generation theory for postal-equivalent regions.

AddressQL does not become part of the AMT paper.  It is a separate query and
adapter specification.
