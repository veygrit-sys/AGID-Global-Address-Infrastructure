# Greece Postal Context runtime

The Greece pack connects five-digit ELTA assignment evidence to separately
licensed address, building and administrative context without treating a
postcode point, statistical unit, municipality, island or cadastral parcel as
an ELTA perimeter.

```text
ELTA postcode/address lookup receipt or permitted snapshot
  -> current five-digit assignment, canonically displayed NNN NN
  -> rights-cleared municipal or national street/number identity
  -> explicit distributable address-building link or reviewed crosswalk
  -> GISCO point OR separately derived address-membership surface
  -> separately classified administration / island / service evidence
  -> GR AGID cell relation
```

## Five digits are assignment syntax

The runtime canonicalizes Unicode digits and optional whitespace to `NNN NN`.
ELTA's dedicated Postal Code and Address Finder is the operator reference; its
web result, the format, a locality, street, serving office, island route or
valid digits do not prove bulk reuse rights, delivery, an address point or
geometry. Every production receipt retains the query/result scope, capture
time, operator identity, terms and digest.

## Point, surface and non-area codes remain typed

Eurostat GISCO supplies CC BY-SA 4.0 postcode points for statistical
correspondence and warns that codes can be missing or incorrectly located and
that non-geographic codes are often excluded. A GISCO point may validate a
coarse location; it is not an ELTA boundary. Buffers, Voronoi cells, NUTS/LAU
matches, municipalities, settlements and islands are never silently promoted.

A rights-cleared surface derived from address membership remains `derived` and
retains members, method, exclusions, uncertainty, valid time and full lineage.
PO-box, organization and route assignments may remain non-areal.

## Address and building precision

Hellenic Cadastre layers, ELSTAT census-vintage street/block/building
cartography, municipal street naming and the planned National Streets and
Numbers Register remain separate sources. Exact address output needs a pinned
live identifier from a distributable source. Exact building output additionally
needs an explicit address-building relationship, common identifier or reviewed
crosswalk. A parcel, title/right record, road axis, census block, outline,
containment or nearest footprint is candidate evidence only.

Each artifact pins its own terms, attribution, schema, coverage, vintage, CRS
and digest. Public packs exclude addressees, residents, owners, rightsholders,
occupants, title and cadastral records, phones, credentials and delivery
instructions.

## Islands and administrative status

Mainland and island service, remote routing, post-office operation, regions,
regional units, municipalities, communities, settlements and Mount Athos
administrative autonomy remain separate time-stamped assertions. Postal codes
and routes never decide country identity, administrative status or legal
boundaries.

## Runtime state

The committed country seed is `M1_metadata`: it contains contracts and
non-production synthetic fixtures, but no upstream rows, real addresses,
personal data or production geometry. Greece remains `unconfigured` until a
separately released M2+ descriptor passes integrity, product-specific rights,
freshness, topology, ambiguity, privacy, coverage and correction gates.
