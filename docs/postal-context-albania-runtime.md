# Albania Postal Context runtime

Status: `M1_metadata`

The Albania pack connects official delivery-network assignment to official
address and cadastral evidence while keeping every authority and reuse boundary
visible.

## Resolution chain

```text
Posta Shqiptare four-digit post-office / branch assignment
  -> rights-cleared National Address System membership
  -> optional derived postal surface + uncertainty
  -> same official address/cadastral object id or reviewed crosswalk
  -> ASHK cadastral building geometry
  -> AL AGID cell relation
```

The runtime preserves four digits, including leading zeroes. The UPU guide puts
the postcode on a line above the locality and explains that the Albanian code
identifies a delivery post office or branch. Syntax proves neither allocation
nor a surrounding area; a pinned Posta Shqiptare page or permitted release must
establish the current assignment.

ASIG's National Geoportal exposes separate themes for the Address System,
address buildings, cadastral parcels and buildings, administrative boundaries,
and other geospatial context. The responsible address authority and ASHK
cadastral authority remain distinct. Portal visibility or a service endpoint is
not treated as one blanket bulk redistribution license; every layer must pin its
owner, terms, endpoint, schema, coverage, vintage, CRS, and digest.

## Geometry and building ceiling

No nationwide official postcode polygon is assumed. A polygon can be derived
from rights-cleared, versioned official address membership, optionally clipped
by compatible government boundaries. It retains its algorithm, parameters,
members, omissions, source releases, validation metrics, and uncertainty and is
always labelled `derived`.

An address point or address-building feature is not automatically the same as
an ASHK cadastral building. Exact building display requires a common official
identifier or a reviewed explicit crosswalk. Parcel containment,
point-in-building, and nearest-footprint joins remain candidates. Owners,
occupants, recipients, title data, civil-status attributes, and protected
cadastral fields never enter public packs.

## Country partition

Postal evidence never determines sovereignty or legal boundaries. Albania and
Kosovo remain separate ISO country packs. Shared language, locality names,
border proximity, routing, or a nearest postal point cannot assign AL country or
AGID identity to Kosovo, Montenegro, North Macedonia, Greece, or another
neighboring territory.

## Repository and runtime boundary

The country repository owns source contracts, snapshots, rights,
normalization, lineage, derivation, validation, and release descriptors. AGID
loads a digest-pinned descriptor and serves lookup, coordinate resolution, bbox
intersection, address/building context, and AGID relations. Raw or licensed
sources and private registry fields stay outside the AGID repository.

Environment slots use `AGID_POSTAL_CONTEXT_AL_*`. Until a separately attested
M2+ descriptor exists, Albania remains `unconfigured`; synthetic packs are tests
only.
