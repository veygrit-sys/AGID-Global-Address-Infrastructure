# Armenia Postal Context runtime

Status: `M1_metadata`

The Armenia pack connects official postal-region and post-office assignment to
official real-estate address and cadastral evidence while keeping authority,
access, and reuse boundaries visible.

## Resolution chain

```text
HayPost four-digit postal-region / post-office assignment
  -> rights-cleared Cadastre Committee address membership
  -> optional derived postal surface + uncertainty
  -> same official address/cadastral object id or reviewed crosswalk
  -> National Geoportal building geometry
  -> AM AGID cell relation
```

The runtime preserves four digits, including leading zeroes. The UPU guide puts
the code to the left of the locality and describes postal-region and post-office
components. Syntax proves neither current allocation nor a surrounding area; a
pinned HayPost result, official directory, or permitted release must establish
the current assignment.

The Cadastre Committee states that real-estate addresses are registered from
authorized community decisions. Its National Geoportal includes distinct
addresses, parcels, buildings, administrative boundaries, and geographical
names. Public search, viewing, or service access is not treated as one blanket
bulk redistribution license; every layer must pin its authority, access class,
license or fee terms, endpoint, schema, coverage, territorial policy and
vintage, CRS, and digest.

## Geometry and building ceiling

No nationwide official postcode polygon is assumed. A polygon can be derived
from rights-cleared, versioned official address membership, optionally clipped
by compatible government boundaries. It retains its algorithm, parameters,
members, omissions, source releases, validation metrics, and uncertainty and is
always labelled `derived`.

An address result or cadastral parcel is not automatically a building. Exact
building display requires a common official address/cadastral object identifier
or a reviewed explicit crosswalk. Parcel containment, point-in-building, and
nearest-footprint joins remain candidates. Owners, rightsholders, occupants,
recipients, title data, restrictions, and protected registry fields never enter
public packs.

## Country and boundary partition

Postal evidence never determines sovereignty or legal boundaries. Country and
disputed-feature classification must cite a separately pinned authority,
policy, and territorial vintage. Shared language, locality names, border
proximity, routing, or a nearest postal point cannot assign AM country or AGID
identity outside that policy.

## Repository and runtime boundary

The country repository owns source contracts, snapshots, rights,
normalization, lineage, derivation, validation, and release descriptors. AGID
loads a digest-pinned descriptor and serves lookup, coordinate resolution, bbox
intersection, address/building context, and AGID relations. Raw or licensed
sources and private registry fields stay outside the AGID repository.

Environment slots use `AGID_POSTAL_CONTEXT_AM_*`. Until a separately attested
M2+ descriptor exists, Armenia remains `unconfigured`; synthetic packs are tests
only.

## M2 audit

The [2026-08-28 review](postal-context-armenia-m2.md) inspected the public
post-office directory but did not establish a current reusable data release.
AM remains M1 / blocked. Document-only sources are not validation-eligible.
Office-address fields must never label all points sharing a postcode.
