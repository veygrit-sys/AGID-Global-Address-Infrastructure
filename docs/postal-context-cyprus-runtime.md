# Cyprus Postal Context runtime

The Cyprus pack connects four-digit Cyprus Post street and locality assignments
to DLS address points and building features without treating a street range,
statistical postal sector, delivery office, administrative unit, or territorial
status as a Cyprus Post perimeter.

```text
Cyprus Post directory / street-range / API evidence
  -> current four-digit assignment
  -> domestic NNNN or international CY-NNNN presentation
  -> DLS INSPIRE Address identity + point + relationship tables
  -> explicit DLS Building relation or reviewed crosswalk
  -> CYSTAT statistical sector OR derived address-membership surface
  -> separately classified coverage / territory evidence
  -> CY AGID cell relation
```

## Four digits and the international prefix

The runtime canonicalizes Unicode digits to exactly four ASCII digits. It
accepts the UPU international `CY-NNNN` presentation but stores the canonical
postcode as `NNNN`; compact `CYNNNN` and five-digit foreign-routing values are
not silently accepted. Cyprus Post's annual directory and road/range releases
are the assignment authority. UPU syntax, a prefix, a district digit, a serving
post office, or valid digits do not prove current allocation, deliverability,
or geometry.

The open-data directory and each street/range resource are pinned separately
with CC BY 4.0 attribution, schema, reference date, coverage, and digest. Cyprus
Post's request-based API remains a controlled operational partition with its own
credentials, rate, retention, caching, and redistribution review.

## Postal surfaces remain typed

The pack does not collapse geometry provenance:

- a Cyprus Post perimeter is operator-official only when an exact pinned
  operator product explicitly publishes and licenses that perimeter;
- a CYSTAT postal sector is official statistical geometry tied to its census or
  reference date, not a current Cyprus Post boundary;
- a rights-cleared street/range or DLS address-membership surface is `derived`
  and retains members, algorithm, exclusions, uncertainty, validity, and lineage.

Organization, government-service, PO-box, route, and other non-area assignments
may remain non-areal.

## DLS address and building precision

DLS INSPIRE Addresses supplies official address points, locators, postal
descriptors, identifiers, and relationship tables. DLS INSPIRE Buildings is a
separate feature/geometry release partitioned by municipality or community.
Exact building output requires an explicit address-to-building relationship,
the same authoritative identifier, or a reviewed crosswalk. Address points,
parcel relations, footprints, containment, and nearest-feature results remain
distinct; proximity only creates a candidate.

Each Addresses, Buildings, Cadastral, and Administrative Units artifact pins
its own CC BY 4.0 metadata, layer, vintage, coverage, CRS, schema, attribution,
and digest. A portal-wide label never substitutes for dataset-level review.
Public artifacts exclude addressees, residents, owners, rightsholders,
occupants, title records, phones, delivery instructions, credentials, and
protected cadastral attributes.

## Territory, control, and service guardrails

Postal routing and legal geography are separate. CY country identity, areas in
which the Republic government exercises effective control, Cyprus Post service
coverage, the Green Line, non-government-controlled areas, Sovereign Base Areas,
and existing `CYGL`, `TRNC`, or `SBA` feature classifications remain separately
pinned assertions. A Turkish/UK/other foreign route, postcode syntax, missing
service, DLS extent, administrative polygon, or border clip cannot decide
sovereignty, recognition, control, or silently merge these feature classes.

## Runtime state

The committed country seed is `M1_metadata`: it contains contracts and
non-production synthetic fixtures, but no upstream rows, real addresses,
personal data, or production geometry. Until a separately released M2+
descriptor passes integrity, dataset-specific rights, freshness, topology,
ambiguity, privacy, coverage, territorial-policy, and correction gates, Cyprus
remains `unconfigured`; synthetic packs are tests only.
