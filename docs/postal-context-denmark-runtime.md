# Denmark Postal Context runtime

Status: `M1_metadata` contract seed and synthetic runtime conformance

Country code: `DK`
Planned country repository: `agid-postal-dk`
Canonical postcode form: `NNNN`

This implementation connects a future Danish country-data repository to the
shared AGID Postal Context Graph, resolver, API routes and AGID cell output. It
does not bundle Danish postal, address or building data. All executable fixtures
are synthetic and cannot be promoted.

## Authority model

```text
PostNord four-digit assignment
  -> DAGI Postnummerinddeling MultiSurface
  -> DAR address/Husnummer UUID and Adgangspunkt
  -> explicit DAR reference to BBR or GeoDanmark building
  -> pinned GeoDanmark footprint
  -> DAGI administrative context
  -> AGID cell cover
```

PostNord maintains the public postcode system. Klimadatastyrelsen records its
postcodes and geographic divisions in DAGI. Danish municipalities maintain DAR,
the official address register. BBR is the statutory building and dwelling
register, while GeoDanmark supplies public topographic building geometry.

Each assertion retains its own provider, object identifier, version, validity,
registration time, access terms and quality. A postcode polygon does not supply
a house number or building. An access point does not become a footprint. AGID is
an index and cover, not postal or building authority.

## Official postcode geometry

DAGI `Postnummerinddeling` supplies an official `GM_Multisurface` for geographic
postcodes. A production artifact preserves:

- four-digit postcode as a string and its PostNord-defined name;
- DAGI local identifier and data-specification version;
- `ErGadepostnummer` for small road-based areas;
- geometry status, scale and CRS;
- valid-from/to and registration-from/to intervals;
- register actor, source release, digest and terms receipt.

Street postcodes in central Copenhagen and Frederiksberg may be very small and
road-based. They must not be enlarged to a municipality or city boundary.
Special, facility or P.O. Box codes absent from the pinned area release remain
non-areal. A surface generated from addresses is always `derived_geometry` and
never presented as DAGI or PostNord geometry.

The DAR needle principle assigns a house number's postcode from its access
point's location in DAGI. This provides a strong point-to-postcode consistency
check while keeping postal geometry and address identity separate.

## Address and building display

DAR gives each address and house number a UUID, structured components, status,
validity and geographic access point. Its technical standard describes whether
the point is at a door, facade, inside a linked building, preliminary, or belongs
to an installation/open-area case. TA and UF records must not be forced into a
building.

DAR can explicitly attach a house number to a BBR building and a GeoDanmark
building. Exact building output follows that source relationship. BBR supplies
building identity and approved public attributes; GeoDanmark supplies the
footprint. If only containment or nearest distance is available, the geometry
remains `candidate_building`.

## Sources, rights and transition

Primary official sources are:

- [PostNord postcode finder](https://www.postnord.dk/varktojer/find-postnummer/)
  for current individual routing validation;
- [DAGI Postnummerinddeling](https://confluence.sdfi.dk/display/DAGI/Postnummerinddeling)
  for official postcode MultiSurface and street-postcode classification;
- [Danmarks Adresseregister](https://danmarksadresser.dk/om-adresser/danmarks-adresseregister-dar)
  for official address UUIDs, access points and building references;
- [BBR](https://bbr.dk/bbr) for statutory building-object identity;
- [GeoDanmark](https://www.geodanmark.dk/home/vejledninger/geodk-2/) for
  nationwide building geometry;
- [Dataforsyningen terms](https://dataforsyningen.dk/terms) for free-geodata
  attribution and licence selection.

The optional CC BY 4.0 election for Klimadatastyrelsen free geographic data does
not apply to GeoDanmark data, which retains its own free-data terms and source
attribution. BBR distribution is field-allow-listed separately. Public artifacts
exclude resident, owner, CPR/CVR, recipient, customer, forwarding, shipment and
non-public unit fields.

Legacy Datafordeler file extracts, events and user/password endpoints are being
retired. The source adapter pins modern fildownload/entity mappings and must
complete migration before 15 January 2027 without losing object identity,
deltas, bitemporal history or rollback.

## Territory partition

`DK` covers Denmark proper. Greenland and the Faroe Islands are published as
separately governed `GL` and `FO` packs. A related PostNord routing range never
changes sovereign data ownership or AGID country partition.

## Runtime behavior

`normalizeDenmarkPostalCode` accepts Unicode-width digits and internal
whitespace, returns exactly four digits and rejects hyphens. Leading zeroes are
preserved.

The shared API supports:

```text
POST /api/postal/resolve
GET  /api/postal/DK/{postcode}
GET  /api/postal/intersects?country=DK&bbox=...
```

Geometry is omitted by default and returned only after explicit GeoJSON opt-in.
Coordinate resolution reaches building level only through a definitive DAR/BBR/
GeoDanmark graph edge. The AGID response remains evidence-aware and does not
turn cell containment into postal or building identity.

## Promotion gates

M2 requires pinned, reproducible and rights-reviewed source snapshots. M3 also
requires four-digit normalization, complete postcode classification, valid
MultiSurface topology, street-postcode preservation, DAR point containment,
100% precision for promoted building links, privacy and DK/GL/FO territory
review, successful service-transition replay and an independent holdout. M4
requires two successful refreshes through the same gates. Synthetic fixtures
never contribute to production coverage, precision or maturity.
