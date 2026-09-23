# AddressQL Cross-Cutting Layers

Status: research and release-planning draft

AddressQL already has three core pillars:

```text
1. database research
2. GIS research
3. logistics research
```

These are the engine.  The following cross-cutting layers are added in priority
order so the project stays safe, interoperable, and usable.

## Priority Order

```text
1. Security / Privacy / ZK
2. Linguistics / Multilingual / NLP
3. Standards / Interoperability
4. Governance / Source Policy / Licensing
5. Temporal / Versioning
6. Developer Experience / Conformance
7. UX / Address Forms
```

The order matters.  Privacy comes before convenience.  Language coverage comes
before global UX.  Standards and governance come before broad distribution.
Temporal replay comes before certification-like claims.  Developer experience
comes before ecosystem adoption.  UX comes last because it should be powered by
the safer layers below it.

## 1. Security / Privacy / ZK

Purpose:

- prevent raw address leakage;
- keep proof generation envelope-based;
- keep `ADDRESS_HASH` discouraged and unsafe-by-default;
- define proof, public-signal, revocation, and verifier-policy boundaries.

Main functions:

- `ADDRESS_COMMIT`
- `ADDRESS_ENVELOPE_CREATE`
- `ADDRESS_PROVE`
- `ADDRESS_VERIFY_PROOF`
- `ADDRESS_POLICY_CHECK`
- `ADDRESS_HASH`

Required artifacts:

- proof input schema;
- public signal schema;
- unsafe hash counterexamples;
- no raw address fixture scan;
- verifier policy examples.

Release gates:

- proof functions must use envelope inputs;
- no witness, private key, proof secret, recipient, or raw address in public fixtures;
- `ADDRESS_POLICY_CHECK` must run before proof generation;
- `ADDRESS_HASH` remains documented as unsafe.

Non-claim:

```text
ZK verification does not repair incorrect address resolution.
```

## 2. Linguistics / Multilingual / NLP

Purpose:

- handle scripts, transliteration, aliases, abbreviations, local order,
  historical names, and native-language/English forms.

Main functions:

- `ADDRESS_PARSE`
- `ADDRESS_NORMALIZE`
- `ADDRESS_TRANSLATE`
- `ADDRESS_FORMAT`
- `COUNTRY_LANGUAGES`
- `ADDRESS_MATCH`
- `ADDRESS_EXPLAIN_MATCH`

Required artifacts:

- country language policy fixture;
- transliteration examples;
- alias graph fixture;
- multilingual false-positive counterexamples;
- dual-display form examples.

Release gates:

- language choice must not imply nationality or identity;
- translations must carry source version;
- multilingual search must expose explanation and non-claims.

Non-claim:

```text
Translation improves communication and recall; it does not prove identity.
```

## 3. Standards / Interoperability

Purpose:

- keep AddressQL compatible with existing formats and systems while remaining an
  independent open-source specification.

Compatibility surfaces:

- JSON Schema;
- OpenAPI;
- SQL signatures;
- PostgreSQL/PostGIS;
- SQLite;
- AGID;
- AMT Envelope;
- ZK Address Predicates;
- Address Communication Object;
- Address Login.

Main functions:

- `COUNTRY_RESOLVE`
- `COUNTRY_ADDRESS_PROFILE`
- `ADDRESS_SCHEMA`
- `ADDRESS_ENVELOPE_CREATE`
- `ADDRESS_ACK`
- `POSTAL_STATUS`

Release gates:

- all outputs must have JSON-compatible schemas;
- adapters must declare conformance levels;
- compatibility must be a boundary, not ownership or certification.

Non-claim:

```text
Interoperability is not certification.
```

## 4. Governance / Source Policy / Licensing

Purpose:

- rank official, open, community, AGID, carrier, and manual-review sources by
  purpose, license, freshness, and quality.

Main functions:

- `COUNTRY_SOURCE_POLICY`
- `COUNTRY_SUBDIVISIONS`
- `COUNTRY_POSTAL_STATUS`
- `POSTAL_STATUS`
- `ADDRESS_POLICY_CHECK`
- `ADDRESS_ACK`

Required artifacts:

- source policy schema;
- license attribution fields;
- source confidence taxonomy;
- disputed or ambiguous source fixture;
- manual review policy.

Release gates:

- source policy must not adjudicate sovereignty;
- third-party licenses must be declared;
- low-confidence source decisions must expose `manual_review_required`.

Non-claim:

```text
Source policy is evidence ranking, not political recognition.
```

## 5. Temporal / Versioning

Purpose:

- make source versions, valid time, transaction time, postal changes,
  administrative changes, and replay semantics first-class.

Main functions:

- `ADDRESS_SCHEMA`
- `ADDRESS_NORMALIZE`
- `ADDRESS_MATCH`
- `POSTAL_VALIDATE`
- `DELIVERY_AVAILABLE`
- `ADDRESS_ACK`

Required artifacts:

- source-version replay fixture;
- valid time and transaction time schema;
- deprecated subdivision example;
- postal-code change example;
- temporal ACK example.

Release gates:

- `stable_by_source_version` functions must replay;
- volatile functions must expose time, root, token, or freshness context;
- old results must not be silently rewritten.

Non-claim:

```text
Current source data does not erase historical validity.
```

## 6. Developer Experience / Conformance

Purpose:

- give developers repeatable tests, CLI checks, adapter levels, SDK examples, and
  copy-pasteable SQL.

Main functions:

- `ADDRESS_PARSE`
- `ADDRESS_NORMALIZE`
- `ADDRESS_MATCH`
- `POSTAL_VALIDATE`
- `DELIVERY_AVAILABLE`
- `ADDRESS_VERIFY_PROOF`
- `ADDRESS_ACK`

Required artifacts:

- conformance CLI;
- golden synthetic fixtures;
- PostgreSQL smoke tests;
- SQLite offline tests;
- SDK example suite.

Release gates:

- public tests must be synthetic;
- every adapter must declare unsupported functions;
- docs must show copy-pasteable examples.

Non-claim:

```text
Conformance tests do not certify production data quality.
```

## 7. UX / Address Forms

Purpose:

- turn country profiles, postal status, language policy, and validation results
  into safe address form behavior.

Main functions:

- `COUNTRY_RESOLVE`
- `COUNTRY_ADDRESS_PROFILE`
- `COUNTRY_LANGUAGES`
- `ADDRESS_SCHEMA`
- `POSTAL_REQUIRED`
- `POSTAL_SUGGEST`
- `ADDRESS_ISSUES`

Required artifacts:

- country selector fixture;
- native/English dual-form examples;
- no-postal-code form behavior;
- weak-postal warning copy;
- manual review state examples.

Release gates:

- forms must not invent postal codes;
- suggestions must not overwrite user intent silently;
- country ambiguity must not be guessed.

Non-claim:

```text
Form completion is not address verification.
```

## Layered Architecture

```text
UX / Address Forms
Developer Experience / Conformance
Temporal / Versioning
Governance / Source Policy / Licensing
Standards / Interoperability
Linguistics / Multilingual / NLP
Security / Privacy / ZK
DB + GIS + Logistics Core
```

This order keeps AddressQL practical while preventing the most dangerous failure
mode: a convenient global address query layer that accidentally overclaims truth
or leaks private address data.
