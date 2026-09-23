# Czechia Postal Context runtime

Status: `M1_metadata` contract seed and synthetic runtime conformance

Country code: `CZ`
Planned country repository: `agid-postal-cz`
Canonical PSČ form: `NNN NN`

This implementation connects a future Czech country-data repository to the
shared AGID Postal Context Graph, resolver, API routes and AGID cell output. It
does not bundle Czech postal, address or building data. All executable fixtures
are synthetic and cannot be promoted.

## Authority model

The evidence path is:

```text
Česká pošta PSČ assignment
  -> RÚIAN address-place code and definition point
  -> explicit RÚIAN building-object relationship
  -> pinned RÚIAN or INSPIRE building geometry
  -> RÚIAN administrative context
  -> optional derived PSČ surface
  -> AGID cell cover
```

These are independent claims:

1. Česká pošta establishes current postal routing and publishes certified CSV
   outputs for post offices, municipality/municipality-part PSČ, address PSČ
   and locations without delivery service.
2. RÚIAN establishes territorial, address-place and building-object identity.
3. ČÚZK VFR and INSPIRE data provide geometry by feature class.
4. AGID provides an index and display cover, not postal or building authority.

A PSČ never supplies a house number or building. An address definition point
is not a footprint. A building is exact only when a source-defined parent
`Stavební objekt` code, ISKN building identifier or reviewed explicit crosswalk
links it to the address. Containment or nearest distance yields a candidate.

## Postal geometry

The official sources reviewed for this seed do not establish a freely
redistributable nationwide Česká pošta PSČ polygon product. The runtime policy
therefore uses `routing-locality-first` semantics.

An experimental surface may be generated from a pinned set of eligible RÚIAN
address points. For PSČ `c`, one possible construction is:

```text
D(c, r) = CzechTerritory ∩ union(Voronoi(a, r) for a in AddressPoints(c))
```

where `r` names the exact source release and generation parameters. The result
must be marked `derived_geometry`, served only when geometry is explicitly
requested, and carry method, release, accuracy and attribution. It is never an
official Česká pošta boundary. Hulls, interpolation and administrative clips
have the same restriction.

PSČ classes that may be non-areal include address/addressee assignments,
organizations and postal facilities. The operator's no-delivery-service output
is preserved as a classification, not turned into a delivery guarantee.

## Address and building display

The public address path preserves:

- RÚIAN address-place code;
- municipality, municipal district, municipality part and street identifiers;
- building type, descriptive/evidence number, orientation number and suffix;
- PSČ and validity date;
- S-JTSK definition point and its transformation receipt;
- explicit parent building-object code and any ISKN building identifier;
- the pinned building geometry identifier and release.

Building display is promoted only through identifier continuity. If an address
point lies inside or within the RÚIAN quality-check distance of a footprint but
no identifier relationship is present, the footprint remains
`candidate_building`. This prevents a geometric heuristic from becoming a
false exact address.

## Source and rights ledger

Primary source roles are recorded in
`data/postal_country_packs/cz/postal-context/source-profile.json`:

- [Česká pošta PSČ search](https://www.postaonline.cz/vyhledat-psc) — current
  individual PSČ/address routing validation; no polygon authority.
- [Česká pošta customer outputs](https://www.ceskaposta.cz/ke-stazeni/zakaznicke-vystupy)
  — certified downloadable assignment lists with operator-stated refresh
  schedules; redistribution is decided per artifact.
- [ČÚZK VDP RÚIAN](https://vdprefb.cuzk.gov.cz/vdp/ruian) — free public view
  and VFR download entry. VDP is informational; reference-system status remains
  distinct.
- [ČÚZK RÚIAN/VFR](https://www.cuzk.gov.cz/Uvod/Produkty-a-sluzby/RUIAN/2-Poskytovani-udaju-RUIAN-ISUI-VDP/Vymenny-format-RUIAN-%28VFR%29.aspx)
  — object relationships, identifiers, definition points, lines and polygons.
- [ČÚZK Geoportal](https://geoportal.cuzk.cz/) — RÚIAN address-place CSV,
  INSPIRE Buildings services and national territorial-boundary downloads.

RÚIAN address and boundary metadata reviewed for this seed identify CC BY 4.0
open-data terms. Every promoted artifact still pins its exact metadata record,
release, files, checksums, schema, CRS and required attribution. Postal
infrastructure, forwarding, customer, recipient and other non-public data stay
outside public artifacts.

## Runtime behavior

`normalizeCzechiaPostalCode` accepts Unicode-width digits and compact or spaced
input, then returns exactly `NNN NN`. Hyphenated input is rejected. PSČ remains
a string so leading zeroes survive.

The shared API supports:

```text
POST /api/postal/resolve
GET  /api/postal/CZ/{psc}
GET  /api/postal/intersects?country=CZ&bbox=...
```

Postal geometry is omitted by default. `geometry=geojson` is an explicit
request, but it does not change a derived surface into canonical postal
geometry. Coordinate resolution can reach building level only through a
definitive address-to-building graph edge. AGID cells remain cover/index
evidence and `canonicalPostalGeometry` stays false for derived Czech surfaces.

## Promotion gates

M2 requires pinned, reproducible and rights-reviewed source snapshots. M3 also
requires:

- exact five-digit PSČ normalization and class coverage;
- operator assignment reconciliation on an independent holdout;
- valid derived geometry with cross-border, overlap, gap and multipart checks;
- complete RÚIAN address identity and validity lineage;
- 100% precision for promoted explicit address-to-building links;
- informational-versus-reference status preservation;
- public privacy review and attribution validation;
- correction intake, immutable release manifests and rollback.

M4 requires two successful source refreshes through the same gates. Synthetic
fixtures never contribute to production coverage, precision or maturity.
