# Austria Postal Context runtime

The Austria pack connects four-digit Österreichische Post assignments to BEV
address and building identities without treating a destination location,
statistical region, route, point cluster, or administrative unit as an Austrian
Post perimeter.

```text
Österreichische Post postcode / destination evidence
  -> current or historical four-digit assignment
  -> separately licensed Post address / PAC evidence (optional)
  -> BEV Adresscode address identity + coordinate type
  -> BEV Subcode building identity or explicit crosswalk
  -> Statistik Austria official statistical PLZ region OR derived surface
  -> AT AGID cell relation
```

## Four digits are assignment evidence

The runtime canonicalizes Unicode digits to exactly four ASCII digits and
preserves leading zeroes. Österreichische Post's postcode and destination
resources are the assignment authority. The UPU Austria guide proves the
four-digit syntax, placement to the left of the locality, and code-component
description only. Syntax, the first digit, a destination location, post office,
route, or administrative unit does not prove current allocation, deliverability,
or a polygon.

Post downloadable resources are pinned individually with publication time,
current or historical scope, schema, terms, and digest. Austrian Post Address
Data, PAC, autocomplete, geodata, and house/building products remain a separate
contract partition with their own retention and redistribution rules.

## Three kinds of postal surface

The pack does not collapse geometry provenance:

- an Austrian Post perimeter is operator-official only when the pinned product
  explicitly publishes and licenses that perimeter;
- a Statistik Austria PLZ region is official statistical geometry with its own
  methodology and reference date, not an Austrian Post boundary;
- a rights-cleared BEV address-membership surface is `derived` and retains its
  members, method, exclusions, uncertainty, validity, and lineage.

Non-area, organization, route, and PO-box assignments may remain non-areal.

## Address and building precision

BEV's Address Register supplies official address identity and spelling. The
seven-digit `Adresscode` is preserved as text. A building at the address is
identified separately by its three-digit `Subcode`; the pair is not inferred
from coordinate proximity. Address coordinates, building coordinates, cadastral
parcels, and building footprints remain distinct evidence classes.

Exact building output therefore requires the same Adresscode/Subcode pair or a
reviewed explicit authoritative crosswalk. Containment and nearest-feature
matching only produce candidates. A specific BEV snapshot may be CC BY 4.0,
but its license is never generalized to BEV address search, INSPIRE downloads,
or another product.

Statistik Austria GWR microdata is restricted by its statutory access and
confidentiality rules. Public AGID artifacts exclude addressees, households,
residents, owners, occupants, dwelling records, protected GWR attributes,
delivery instructions, credentials, and contract-only Post fields.

## Administrative and cross-border guardrails

BEV administrative boundaries provide federal-state, district, municipality,
and cadastral context; they do not create postal membership. A German, Swiss,
Liechtenstein, or other cross-border routing arrangement, provider record,
syntax match, border clip, or proximity result cannot change Austrian country
identity. AT identity uses separately pinned sovereign-boundary evidence.

## Runtime state

The committed country seed is `M1_metadata`: it contains contracts and
non-production synthetic fixtures, but no upstream rows, real addresses,
personal data, or production geometry. Until a separately released M2+
descriptor passes integrity, dataset-specific rights, freshness, topology,
ambiguity, privacy, cross-border, and correction gates, Austria remains
`unconfigured`; synthetic packs are tests only.
