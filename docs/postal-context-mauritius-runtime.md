# Mauritius Postal Context runtime

Mauritius is integrated as an external country pack, `agid-postal-mu`, consumed
by AGID through the digest-pinned descriptor and last-known-good contract. This
repository seed is metadata-only and includes synthetic conformance fixtures,
not copied government postcode rows.

## Reviewed evidence boundary

| Evidence | Permitted role | Hard boundary |
| --- | --- | --- |
| Current Mauritius Post finder | Current operator lookup and bounded row validation | No bulk licence, canonical boundary or address-building relation |
| UPU 2014 rollout report | Nationwide rollout context for Mauritius, Rodrigues and Agalega | Not a current assignment table or geometry |
| Open Data Mauritius mainland/Rodrigues/Agalega tables | Exact digest-pinned CC BY-SA 4.0 assignment reference | Separate artifacts; no canonical polygon or deliverability guarantee |
| Open Data Mauritius post-office directory | Facility identity, address and point context | Not a catchment, customer address or postcode boundary |
| Open Data Mauritius districts / Statistics Mauritius 2022 | Versioned statistical and administrative context | Districts are not administrative entities; ward/VCA editions are not postal areas |
| Cadastral Survey Act 2011 / DCDB | Controlled parcel and street-address context | No public owner, postcode, building or address-building authority |
| Explicit civic address and building evidence | Building display after the exact relation gate | Proximity, sub-locality, parcel and model score are insufficient |
| OSM candidates | Separate attributed ODbL partition | No official postal, cadastral or exact-building authority |
| Data Protection Act 2017 | Lawful-purpose, security, correction and retention governance | No permission to publish person-linked addresses or queries |

## Postcode and territory semantics

The reviewed current shapes are:

`C_main = { d1d2d3d4d5 | d1 in 1..9 }`

`C_outer = { Rdddd, Adddd }`

The main-island first digit identifies a geographical district; `R` identifies
Rodrigues and `A` identifies Agalega. The remaining characters narrow the
locality or sub-locality according to the appropriate official table. Syntax is
only a parser gate: production assignment needs a current Mauritius Post result
or an exact, digest-pinned official open-data row with explicit territory,
version, validity and rights.

Main-island, Rodrigues and Agalega artifacts remain separate. Statistical
districts, Municipal or District Council Areas, Municipal Wards, Village
Council Areas and Rodrigues local regions are versioned context. Statistics
Mauritius notes that the nine geographical districts are not administrative
entities and that ward/VCA boundaries changed between the 2011 and 2022 census
editions, so no silent postal or timeless equivalence is allowed.

## Geometry policy

The reviewed assignment artifacts contain rows, not canonical full-code
boundary coordinates:

`G_official(c) = none`

District or ward polygons, locality centroids, post-office points, cadastral
parcels, buffers, Voronoi cells and AGID covers cannot create an official postal
surface. A search-only candidate may be computed as:

`R_derived(c, t, m) = f(assignments_t, admin_context_t, observations_t, method_m)`

but it remains `authority=derived` with method, parameters, uncertainty,
licences, lineage and validity. Overlaps produce ambiguity.

## Address and building resolution

The public display hierarchy is:

`country -> territory -> statistical/admin context -> locality -> sub-locality -> postcode`

and then, only through separate evidence:

`explicit civic address point -> explicit address-building relation -> building`

A postcode row, post-office address, office point, house or unit string, census
building count, cadastral parcel, nearest road or containment result cannot on
its own produce a premise, entrance or building. Recipient, P.O. Box holder,
owner, resident, occupant and query-history fields are excluded from public
packs.

## Runtime, realtime and hosting

The runtime accepts the reviewed five-character families and preserves `A` or
`R`. Normalization does not prove assignment, geometry, administrative identity
or deliverability.

Live Mauritius Post or CKAN calls are accepted only as bounded receipts with
source URL, terms version, digest, `observed_at`, validity, territory and parser
version. Models may rank or detect candidates but cannot promote authority.
Compression may use a minimal perfect hash, Parquet, FlatGeobuf or PMTiles if
exact strings, territory, time, lineage and correction paths remain recoverable.

Cloudflare and Hugging Face public hosting is restricted to digest-pinned,
rights-cleared, CC BY-SA-compliant, minimized and non-personal artifacts.
Restricted cadastral, civic-address or building evidence stays on controlled
infrastructure.

## AGID integration

AGID supplies an independent spatial cell and versioned crosswalk. It does not
convert a cell into a Mauritius Post assignment or boundary and does not raise
address resolution. The synthetic fixture proves that postcode lookup remains
geometry-free while building display requires an explicit civic-address link.
