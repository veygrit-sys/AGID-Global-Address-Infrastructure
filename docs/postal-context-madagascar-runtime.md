# Madagascar Postal Context runtime

Madagascar is integrated as an external country pack, `agid-postal-mg`, consumed
by AGID through the same digest-pinned descriptor and last-known-good contract as
the other Postal Context countries. The repository seed is metadata-only and
contains synthetic conformance fixtures, not a copied national postcode list.

## Reviewed evidence boundary

| Evidence | Permitted role | Hard boundary |
| --- | --- | --- |
| Current Paositra Malagasy website | Operator identity, services, agency context and a pinned self-address observation | Not a complete current postcode register, API, boundary release or bulk-data licence |
| UPU Madagascar sheet, August 2011 | Three-digit format, placement before postal town, dated province/Fivondronana method, home and B.P. line order | Examples are not current assignments, reusable addresses or geometry |
| OpenStat Madagascar postcode artifact, 2021 | Attributed CC BY 4.0 candidate and discrepancy review | Manually collected and possibly incomplete; never operator authority |
| FTM / UN SALB administrative geometry | Versioned administrative context | Never Paositra postcode geometry or historical/current equivalence |
| MATSF territorial and land systems | Product-specific land, planning or map context | No automatic address, building, title-holder or postcode claim |
| Explicit civic address and building evidence | Building-level display after the exact relation gate | Proximity, lot text, containment and model score are insufficient |
| OSM candidates | Separate attributed ODbL partition | No official postal, land or exact-building authority |
| Law 2014-038 / CMIL | Purpose, proportionality, security, correction and retention governance | No permission to publish person-linked addresses |

## Postcode and administrative semantics

The dated UPU sheet describes a postcode `c = pdd`, where `p` refers to one of
six historical provinces and `dd` to a department/Fivondronana. AGID treats this
as dated coding semantics, not proof that a syntactically valid code remains
assigned today.

The current operator site publishes its contact address with `101 ANTANANARIVO`,
but a self-address cannot establish the complete national assignment set. A
production official assignment therefore requires a current Paositra Malagasy
artifact pinned by digest, observation time, validity and reviewed field rights.

Historical province/Fivondronana identities and current region, district,
commune or fokontany identities must be connected only by an independently
versioned, many-to-many-capable administrative crosswalk. That crosswalk remains
context and never changes postal authority.

## Geometry policy

No reviewed issuer source supplies canonical postcode boundary coordinates, so:

`G_official(c) = none`

Administrative containment, office points, locality centroids, land parcels,
buffers, Voronoi cells and AGID covers cannot create an official postal surface.
A derived candidate may be computed for search:

`R_derived(c, t, m) = f(observations_t, administrative_context_t, method_m)`

but it must retain `authority=derived`, method, parameters, cut-off time,
uncertainty, licences, lineage and validity. Overlapping candidates return
ambiguity instead of silently choosing a nearest surface.

## Address and building resolution

The display hierarchy is:

`country -> current administrative context -> locality/fokontany -> postcode`

then, only with separate evidence:

`explicit civic address point -> explicit address-building relation -> building`

Home-delivery lines and `B.P.` identifiers are separate delivery modes. A
postcode, historical department, postal town, lot string, land parcel, nearest
road or model score cannot on its own produce a door, premise, entrance or
building. Recipient, holder, resident, owner, occupant and query-history fields
are excluded from public packs.

## Runtime, realtime and hosting

The runtime normalizes only the reviewed three-digit shape. Normalization does
not prove assignment, boundary, current administration or deliverability.

Realtime queries are accepted only as bounded receipts with source URL, terms
version, digest, `observed_at`, validity and parser version. Models may rank or
detect candidates but cannot promote authority. Compression may use a minimal
perfect hash, Parquet, FlatGeobuf or PMTiles if exact codes, time, semantics,
lineage and correction paths remain recoverable.

Cloudflare and Hugging Face public hosting is limited to rights-cleared,
digest-pinned, minimized and non-personal artifacts. Restricted land, address or
building evidence remains on controlled infrastructure.

## AGID integration

AGID supplies a separate spatial cell and versioned crosswalk. It does not
convert an AGID cell into a Paositra Malagasy code or boundary and it does not
raise address resolution. The synthetic fixture proves that building resolution
is possible only through an explicit civic-address relation while postcode
lookup remains geometry-free.
