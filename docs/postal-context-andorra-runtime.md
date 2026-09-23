# Andorra Postal Context runtime

Status: `M1_metadata`

The Andorra pack connects two-operator postal assignment to government address,
parish, and topographic-building evidence while keeping contractual, geometric,
and temporal boundaries visible.

## Resolution chain

```text
current Correos / La Poste full-code assignment
  -> rights-cleared Govern d'Andorra address membership
  -> expressly Andorra-scoped licensed polygon OR derived surface + uncertainty
  -> common authoritative address/building id or reviewed crosswalk
  -> IDE Andorra topographic building geometry
  -> AD AGID cell relation
```

The runtime canonicalizes five characters and preserves the `AD` prefix. The
UPU guide says that the prefix is part of the postcode, places it before the
locality, describes parish coding, and records that La Poste and Correos provide
postal service. Format and examples prove neither current allocation nor a
full-code perimeter.

Correos publishes a licensed postcode database that expressly includes Spain
and Andorra. Its public product page is metadata, not the data license. The same
page describes a commercial polygon product using language that can be read as
Spanish national coverage, so an Andorra polygon is authoritative only when the
contract, product manifest, and artifact identify Andorra scope.

## Address and building ceiling

The Govern d'Andorra Urban Guide can search and locate postal addresses. IDE
Andorra publishes OGC services and downloadable geodata, and its 1:5,000
topographic base includes national building geometry with stated scale and
accuracy. Interactive access or a free download is not treated as unrestricted
bulk redistribution: every dataset pins producer, conditions of use, schema,
coverage, edition, CRS, public-field allow-list, and digest.

A parish boundary is administrative context, not automatically a full-code
postal polygon. Where no expressly Andorra-scoped licensed postal polygon is
available, rights-cleared versioned address membership may generate a derived
surface. It retains its algorithm, parameters, members, omissions, boundary
clips, validation metrics, and uncertainty and is always labelled `derived`.

An address point or topographic footprint is not automatically an exact
building. Exact display requires a common authoritative identifier or reviewed
explicit crosswalk. POI equality, containment, and proximity remain candidates.
Addressees, owners, residents, tenants, occupants, cadastral rights, tax data,
and protected registry fields never enter public packs.

## Country and border partition

Postal evidence never determines sovereignty or legal boundaries. Country and
border-feature classification must cite a separately pinned authority, policy,
and territorial vintage. Shared languages, routing through France or Spain,
parish names, and nearest postal features cannot assign AD country or AGID
identity outside that policy.

## Repository and runtime boundary

The country repository owns source contracts, snapshots, rights,
normalization, lineage, derivation, validation, and release descriptors. AGID
loads a digest-pinned descriptor and serves lookup, coordinate resolution, bbox
intersection, address/building context, and AGID relations. Raw or licensed
sources and private records stay outside the AGID repository.

Environment slots use `AGID_POSTAL_CONTEXT_AD_*`. Until a separately attested
M2+ descriptor exists, Andorra remains `unconfigured`; synthetic packs are tests
only.
