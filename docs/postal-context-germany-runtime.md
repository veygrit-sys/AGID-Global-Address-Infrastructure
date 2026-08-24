# Germany Postal Context runtime

Status: `M1 metadata and synthetic runtime conformance`

AGID can load Germany independently beside the existing country packs. The
shared resolver and API support five-digit PLZ normalization, licensed official
delivery-area polygons, non-area routing codes, official address points,
explicitly linked building geometry, administrative context and AGID cell
covers without copying restricted national data into this repository.

## 1. Canonical PLZ

```text
input -> NFKC -> remove whitespace -> exactly five digits
```

Hyphens and non-digits are rejected. PLZ stays a string so leading zeroes are
preserved. The intended resolution path is:

```text
PLZ5 + locality
  -> Deutsche Post assignment and postcode class
  -> pinned DATAFACTORY GEOCODE or BKG PLZ Polygon / MultiPolygon
  -> pinned GA or HK-DE house coordinate
  -> source-identifier-linked HU-DE footprint or LoD2-DE model
  -> VG25 administrative context
  -> AGID cell cover
```

A PLZ or postal polygon does not identify a street address, building,
recipient, resident, owner or delivery guarantee.

## 2. Source and rights boundaries

### Deutsche Post Direkt

The public Postdirekt postcode search is current assignment and locality
evidence for individual checks. DATAFACTORY BASIC and STREETCODE supply routing
and street reference data; BUILDINGS supplies addressable-building records; and
GEOCODE supplies postcode, street and building coordinates plus geocoded
postcode areas. The products have distinct contracts and update cycles.

Search access does not grant bulk extraction or geometry redistribution. A
production artifact pins product, edition, contract, permitted fields and uses,
digest and publication receipt.

### BKG Postleitzahlgebiete

BKG distributes the original Deutsche Post Direkt five-digit delivery-postcode
areas to eligible federal users after a license agreement. The source explicitly
notes that postal geometry can differ from administrative boundaries, can be
multipart, and excludes non-area codes such as large recipients. It also omits
specified Austrian areas that have a German routing code.

The polygons are authoritative delivery-area geometry only within the licensed
artifact. They are not open data and are never copied into a public AGID release
without an explicit follow-on publication right.

### GA and HK-DE address points

BKG Georeferenzierte Adressdaten (GA) supplies nationwide address information,
coordinates and administrative keys. It is derived from official house
coordinates and is restricted to eligible users. HK-DE supplies more than 22
million official house coordinates based on the state cadastres, with
state-specific details and access terms.

Every promoted address retains its product and state edition, quality class,
street, house number, PLZ, locality, administrative keys, CRS and digest. The
point is an official address position, not a building outline.

### HU-DE and LoD2-DE building geometry

HU-DE contains official ALK/DFK-derived building footprints, each with an
object identifier, AGS and building-function code. LoD2-DE contains official 3D
building models, object identifiers, a reference to a 2D building and optional
addresses. Both are state-partitioned and access-restricted at national level.

An exact building result requires a source-defined identifier or a reviewed
explicit crosswalk. AGS only identifies administrative context: matching AGS,
point containment or nearest distance alone remains candidate evidence.

### VG25 administration

BKG VG25 supplies official country, Land, Regierungsbezirk, Kreis,
Verwaltungsgemeinschaft and Gemeinde identities and boundaries. The public
dataset is versioned annually under CC BY 4.0. It provides administrative
context and clipping only; it never becomes Deutsche Post assignment or PLZ
geometry.

Official references:

- [Deutsche Post DATAFACTORY](https://www.deutschepost.de/de/d/deutsche-post-direkt/datafactory.html)
- [BKG Postleitzahlgebiete Deutschland](https://gdz.bkg.bund.de/index.php/default/postleitzahlgebiete-deutschland-plz.html)
- [BKG Georeferenzierte Adressdaten](https://gdz.bkg.bund.de/index.php/default/georeferenzierte-adressdaten-ga.html)
- [BKG Amtliche Hauskoordinaten Deutschland](https://gdz.bkg.bund.de/index.php/default/amtliche-hauskoordinaten-deutschland-hk-de.html)
- [BKG Amtliche Hausumringe Deutschland](https://gdz.bkg.bund.de/index.php/default/digitale-geodaten/sonstige-geodaten/amtliche-hausumringe-deutschland-hu-de.html)
- [BKG 3D-Gebäudemodelle LoD2 Deutschland](https://gdz.bkg.bund.de/index.php/default/3d-gebaudemodelle-lod2-deutschland-lod2-de.html)
- [BKG Verwaltungsgebiete 1:25 000](https://gdz.bkg.bund.de/index.php/default/digitale-geodaten/verwaltungsgebiete/verwaltungsgebiete-1-25-000-stand-31-12-vg25.html)

## 3. Postal geometry and mathematical validation

For delivery postcode `c`, product release `r` and rights partition `p`, licensed
official geometry is:

```text
G(c, r, p) in {Polygon, MultiPolygon}
```

The product may contain several disconnected surfaces:

```text
G(c, r, p) = union({g_i | PLZ(g_i) = c})
```

The union can accelerate lookup but never discards the original components,
source identifiers or lineage. For official address points `A(c, r)`, a release
check measures:

```text
containment(c, r) =
  |{a in A(c, r) : point(a) in or on G(c, r, p)}| / |A(c, r)|
```

Outliers retain each source independently. AGID does not move an address point,
alter a postcode or clip the official postal feature simply to improve the
score.

If licensed postal geometry cannot be published, an experimental open surface
may be generated from rights-cleared address points and a sovereign clip:

```text
D(c, r) = clip_DE intersect union({Voronoi(a) | a in A(c, r)})
```

`D` is always `derived_geometry`, opt-in and lower confidence. It never receives
Deutsche Post/BKG geometry authority and does not become an official polygon by
model training, real-time regeneration, caching or compression. A source digest
and parameters must reproduce the same derived artifact.

## 4. Address and building resolution

The safe address path is:

```text
licensed PLZ area
  -> official GA/HK-DE civic address and house coordinate
  -> source object identifier or reviewed address/building crosswalk
  -> HU-DE footprint or LoD2-DE model
```

If the identifier or crosswalk is absent, resolution stops at the official
address point and may return nearby building candidates separately. It does not
silently promote the nearest or containing building. Multiple addresses and
building parts remain separate branches.

## 5. Non-area and cross-border cases

Large-recipient, Postfach, post-office and other special routing codes can be
valid without a delivery-area surface. They are returned as organization,
facility or non-area routing records and never overwrite a premise postcode.

German routing can include exceptional foreign locations, while the licensed
BKG PLZ geometry covers German sovereign territory. Such records remain
cross-border routing evidence; foreign geometry belongs to its ISO country
pack and never receives German sovereignty or a DE AGID country partition.

## 6. Runtime configuration

```text
AGID_POSTAL_CONTEXT_DE_DESCRIPTOR_PATH=C:\absolute\path\de-descriptor.json
AGID_POSTAL_CONTEXT_DE_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
AGID_POSTAL_CONTEXT_DE_LKG_DESCRIPTOR_PATH=C:\absolute\path\de-lkg-descriptor.json
AGID_POSTAL_CONTEXT_DE_LKG_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
```

Endpoints:

```text
POST /api/postal/resolve
GET  /api/postal/DE/:postcode
GET  /api/postal/intersects?country=DE&bbox=...
```

Geometry stays opt-in with `geometry=geojson`. AGID cells are spatial indexes,
not substitutes for source postal geometry, address points or explicit building
identity.

## 7. Current completion boundary

This implementation completes the country contract, source/rights profile,
normalizer, multi-country store support, API routing, AGID integration and
synthetic conformance tests. It does not claim nationwide production coverage.
M2 requires pinned rights-reviewed source artifacts, state and product rights
matrices, reproducible transforms, postcode-class and topology validation,
explicit building links, privacy/country partition review, correction intake
and rollback.
