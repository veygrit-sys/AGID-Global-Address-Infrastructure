# Australia Postal Context seed

This directory is the metadata-only M1 seed for the planned
`agid-postal-au` repository. It contains contracts and synthetic conformance
fixtures, not Australia Post, G-NAF, ABS or Geoscape production records.

## Evidence model

Australia Post owns postcode allocation, delivery category and postal-address
evidence. G-NAF supplies public address identity and geocodes, but a G-NAF
postcode is not by itself Australia Post assignment or mail-deliverability
proof. ABS Postal Areas are Mesh Block approximations for statistics, not
authoritative postcode boundaries. Geoscape Buildings is a separately licensed
source whose `building_address` relation can provide an explicit building link.
AGID covers are reproducible indexes only.

```text
Australia Post postcode / PAF assignment
  + G-NAF address identity and point
  + ABS ASGS administrative context
  + ABS POA or G-NAF-derived noncanonical display surface
  + licensed Geoscape building_address relation
  -> evidence-aware Postal Context Graph
  -> optional AGID cover
```

## Non-area classes

PO Boxes, GPO Boxes, Locked Bags, Parcel Lockers, Parcel Collect, large-volume
receivers and specialist delivery codes remain routing or facility records by
default. They must not acquire a surrounding residential polygon, street
premise or building through interpolation.

## Territory boundary

G-NAF and other national sources may contain Christmas Island, Cocos (Keeling)
Islands and Norfolk Island. They are partitioned into `CX`, `CC` and `NF`
country packs before AU artifacts or indexes are built.

## Rights and privacy

Australia Post PAF/postcode products and Geoscape Buildings remain outside
public Git unless named contract rights permit publication. G-NAF use retains
its EULA, attribution, privacy obligations and the secondary-verification rule
for sending mail. Public artifacts exclude recipients, residents, owners,
customers, change-of-address data, delivery instructions and private units.

Promotion beyond M1 requires pinned rights-cleared sources, reproducible
transforms, topology and ambiguity reports, independent holdouts, correction
handling, two clean refreshes and rollback evidence.
