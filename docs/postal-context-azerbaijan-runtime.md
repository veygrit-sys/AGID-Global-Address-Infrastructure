# Azerbaijan Postal Context runtime

Status: `M1_metadata`

The Azerbaijan pack connects official postal assignment to official address
and cadastral evidence while keeping every authority and reuse boundary
visible.

## Resolution chain

```text
Azərpoçt postcode / locality assignment
  -> rights-cleared URIS address membership
  -> optional derived postal surface + uncertainty
  -> same official address/cadastral object id or reviewed crosswalk
  -> cadastral building geometry
  -> AZ AGID cell relation
```

The runtime normalizes a four-digit input to `AZNNNN`, following the UPU
addressing convention. Normalization proves only syntax. A pinned Azərpoçt
receipt or permitted release must prove that a code is allocated and current.

Azərpoçt exposes a branch, office, and index search. The State Service on
Property Issues describes the Ünvan Reyestri İnformasiya Sistemi (ÜRIS) as the
official address system containing settlements, postcodes, transport
infrastructure, and immovable-property addresses. Neither an interactive page
nor public visibility is treated as a bulk redistribution license.

## Geometry and building ceiling

No nationwide official postcode polygon is assumed. A polygon can be derived
from rights-cleared, versioned official address membership, optionally clipped
by compatible government boundaries. The artifact must retain its algorithm,
parameters, members, omissions, source releases, validation metrics, and
uncertainty and is always labelled `derived`.

An address point is not a building footprint. Exact building display requires
the same official registry/cadastral object identifier or a reviewed explicit
crosswalk. Parcel containment, point-in-building, and nearest-footprint joins
remain candidates. Owners, occupants, recipients, title data, and protected
register fields never enter public packs.

## Multipart and jurisdiction handling

Postal evidence never determines sovereignty or legal boundaries. Source
jurisdiction, validity, and territorial vintage are retained. Multipart areas
remain multipart, and no algorithm bridges the Nakhchivan exclave, a border,
an unsourced gap, or a disputed classification merely to create a visually
continuous postal surface.

## Repository and runtime boundary

The country repository owns source contracts, snapshots, rights,
normalization, lineage, derivation, validation, and release descriptors. AGID
loads a digest-pinned descriptor and serves lookup, coordinate resolution, bbox
intersection, address/building context, and AGID relations. Raw or licensed
sources and private registry fields stay outside the AGID repository.

Environment slots use `AGID_POSTAL_CONTEXT_AZ_*`. Until a separately attested
M2+ descriptor exists, Azerbaijan remains `unconfigured`; synthetic packs are
tests only.
