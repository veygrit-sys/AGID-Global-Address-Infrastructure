# Bulgaria Postal Context runtime

The Bulgaria pack keeps Bulgarian Posts routing assignment, GRAO/CAIS address
identity, AGCC cadastral building evidence, NSI EKATTE administration and any
derived postal surface as separate evidence layers.

```text
Bulgarian Posts four-digit assignment or special postal endpoint
  -> optional rights-cleared membership-derived surface (noncanonical)
  -> dated EKATTE administrative context
  -> exact authorized address identifier and access point
  -> explicit cadastral building relation
  -> exact rights-cleared AGCC/INSPIRE building feature
  -> BG AGID cell relation
```

## Postal assignment and derived geometry

A pinned Bulgarian Posts page, search or transaction receipt can establish a
four-digit routing assignment, postal locality or post-office relationship at
its capture time. The code is retained as text. Syntax, a UPU addressing
example, a post-office coordinate, an EKATTE settlement and a municipality do
not establish current assignment, deliverability or geometry.

No nationwide Bulgarian Posts-authored postcode polygon distribution is assumed.
A polygon may be generated only from complete, rights-cleared and time-compatible
postcode membership with authoritative coordinates. It is always `derived`,
`canonicalPostalGeometry: false`, and retains method, members, exclusions,
uncertainty, topology, territory, coverage and validity. Settlement or
administrative boundaries, buffers, Voronoi cells, nearest-code filling and
cross-border gap filling are prohibited. PO-box, organization, dedicated and
post-office codes remain non-area without independent area evidence.

## Address, unit and building precision

GRAO's address classifier and the evolving CAIS Address Register are controlled
authorities. AGID accepts a unique address identifier and access point only from
an actual released, authorized service receipt with pinned schema, validity and
output rights. Roadmaps and project documents describe intended capabilities;
they do not prove that a production national bulk service or a particular record
exists. Municipal address decisions remain source-qualified inputs. Person,
current/permanent residence, recipient and household fields are excluded.

The AGCC cadastral map can contain building outlines, addresses, identifiers and
independent objects. Exact building display requires an explicit authorized
address-to-building relation, a common cadastral building identifier or a
reviewed authoritative crosswalk to the exact rights-cleared feature. A parcel,
independent object, containment, proximity or text match creates only a
candidate. Owner, rightsholder, legal-act, title and personal-identifier data are
never emitted. A public KAIS viewer and an INSPIRE label do not by themselves
grant bulk redistribution rights.

## EKATTE, CRS, licensing and runtime state

NSI EKATTE supplies dated districts, municipalities, mayoralties, settlements
and settlement formations. Its points and polygons add administrative context
only. The exact NSI licence version and its derivative-work conditions are
reviewed per artifact; attribution and source date are retained.

Every geometry retains its source CRS. NSI administrative distributions in
BGS2005 / UTM zone 35N (EPSG:9391), and any AGCC source CRS, are converted to
WGS84 only through reviewed, versioned transforms with original coordinates and
lineage preserved. Derived output is clipped to evidence-backed Bulgarian
territory for the same validity interval, but clipping never fills missing
postal, address or building coverage.

The committed seed is `M1_metadata`: contracts and non-production synthetic
fixtures only. It contains no Bulgarian Posts, GRAO, municipal, AGCC or NSI
source rows, no real address, no production geometry and no personal data.
Bulgaria remains `unconfigured` until a separately released M2+ descriptor
passes integrity, assignment, derivation, rights, address/building-link,
privacy, coverage, territory, CRS, freshness and correction gates.
