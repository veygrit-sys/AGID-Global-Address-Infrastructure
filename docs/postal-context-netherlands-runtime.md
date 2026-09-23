# Netherlands Postal Context runtime

Status: `M2 runtime-ready / M1 Netherlands data`

AGID can load Japan, Singapore, and the Netherlands independently. The NL
country policy adds PC6 normalization, address-range-first semantics, derived
postal-area handling, BAG address/building evidence, and synthetic conformance
fixtures without copying the shared resolver or API.

No nationwide production Netherlands pack is bundled. The lightweight country
contract is in
[`data/postal_country_packs/nl/postal-context`](../data/postal_country_packs/nl/postal-context/README.md).

## 1. PC6 is an assignment before it is a polygon

A Dutch postcode contains four digits and two letters and is displayed as
`1234 AB`. AGID accepts compact or lowercase input, applies NFKC and uppercase,
and emits exactly one space. It does not accept a hyphen or validate existence
from the pattern alone.

PostNL describes the final letters as a group of roughly 25 homes, business
premises, or PO boxes. The canonical relationship is therefore:

```text
PC6 + house number + addition
  -> postal assignment / range
  -> registered BAG address
  -> verblijfsobject, ligplaats, or standplaats
  -> one or more BAG pand objects
```

PC4 is only the four-digit coarse prefix. A PC4 match cannot select a PC6,
premise, or building.

## 2. Three independent geometry authorities

### PostNL

PostNL is authoritative for postcode assignment and delivery validation. Its
Postcode Table documents address-level and number-range products, but does not
establish official polygon geometry or public redistribution rights.

### BAG / PDOK

The Kadaster LV-BAG OGC API exposes public registered addresses, addressable
objects, and building geometry. It is unauthenticated, updated daily, and
published under Public Domain Mark 1.0. BAG evidence can raise an address to a
registered premise or linked building, but it is not postal-operator geometry
and does not guarantee deliverability.

### CBS / Esri Nederland

CBS publishes annual PC4, PC5, and PC6 GeoPackages. CBS explains that the
postcode surfaces are derived by Esri Nederland from BAG addresses and may be
distributed under CC BY 3.0 NL. AGID therefore records them as
`derived_geometry`, with CBS and Esri attribution, reporting year, version,
correction state, download digest, and access time.

The 2025 PC5/PC6 publication was corrected on 18 August 2026. A production
builder must reject an unpinned or superseded release.

Primary references:

- [PostNL postcode structure](https://www.postnl.nl/klantenservice/algemene-vragen/opbouw-postcode/)
- [PostNL addressing format](https://www.postnl.nl/en/sending/letter-or-card/addressing-tips/)
- [PostNL Postcode Table structure](https://www.postnl.nl/api/assets/blt43aa441bfc1e29f2/bltfcd225acf8c54b1e/69aad68afa2e53eeaaf76e79/postcode-table-file-structure.pdf)
- [PostNL Address Check V4](https://developer.postnl.nl/integration-with-postnl/api-overview/addresses/adrescheck-nederland/documentation-v4/)
- [PDOK BAG OGC API](https://api.pdok.nl/kadaster/bag/ogc/v2?f=html&lang=nl)
- [CBS postcode data and corrections](https://www.cbs.nl/nl-nl/dossier/nederland-regionaal/geografische-data/gegevens-per-postcode)
- [CBS postcode geometry methodology and licence](https://www.cbs.nl/nl-nl/longread/diversen/2024/statistische-gegevens-per-vierkant-en-postcode-2021-2022-2023/1-statistische-gegevens-per-vierkant-en-postcode)

## 3. Mathematical generation and compression

For a PC6 code `c`, let `A_c` be its source-backed BAG address points. A model
can generate a candidate surface by clipping a Voronoi union to a licensed land
or service boundary `B`:

\[
R_c^{model} = B \cap \bigcup_{p \in A_c} V(p).
\]

This is computationally simple and useful when an annual geometry release is
missing. It remains model geometry. It cannot replace a corrected CBS/Esri
surface or PostNL assignment evidence.

The preferred storage hierarchy is:

1. PC6 assignment and number ranges.
2. BAG address points and stable identifiers.
3. BAG addressable-object and pand relationships.
4. Versioned CBS/Esri PC6 and PC4 derived polygons.
5. AGID cell covers or sorted ranges as candidate indexes.
6. Optional learned or Voronoi geometry as a separately marked fallback.

AGID cell covers compress search but are never canonical postal geometry. Final
resolution returns the source polygon and coherent address graph path.

## 4. Address and building display

The safe join is:

```text
normalized PC6
  + huisnummer
  + huisnummertoevoeging
  + openbareruimte / woonplaats
  -> BAG nummeraanduiding
  -> addressable object
  -> pand relationship
```

A public house-number addition may be displayed when it is part of the BAG civic
address. It does not authorize occupant, recipient, phone, customer, or private
delivery information. One addressable object may relate to multiple buildings,
and one building may carry multiple addresses or postcodes; those results stay
as alternatives until resolved.

## 5. Runtime and API

The Netherlands has independent active and last-known-good pins:

```dotenv
AGID_POSTAL_CONTEXT_NL_DESCRIPTOR_PATH=C:\absolute\path\nl-descriptor.json
AGID_POSTAL_CONTEXT_NL_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
AGID_POSTAL_CONTEXT_NL_LKG_DESCRIPTOR_PATH=C:\absolute\path\nl-lkg-descriptor.json
AGID_POSTAL_CONTEXT_NL_LKG_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
```

The stable API accepts `countryCode: "NL"` and NL path parameters:

```text
GET  /api/v1/postal/capabilities
GET  /api/v1/postal/releases/NL
POST /api/v1/postal/resolve
GET  /api/v1/postal/NL/1234%20AB
GET  /api/v1/postal/intersects?country=NL&bbox=...
```

Lookup omits geometry unless requested explicitly. `intersects` may return a
licensed CBS/Esri derived polygon, while response provenance and documentation
must continue to state that it is not an official PostNL boundary.

## 6. Remaining production work

The truthful capability is “Netherlands runtime and country contract ready;
nationwide production pack not complete.” The external `agid-postal-nl`
repository must still:

1. establish PostNL table/API rights and retention policy;
2. pin BAG schema and reproducible daily or monthly snapshots;
3. ingest a corrected CBS release with both required attributions;
4. build exact PC6-address-building links without collapsing ambiguity;
5. validate PC4/PC6 topology, PO boxes, offshore/special cases, and history;
6. pass holdout, correction, privacy, freshness, and two-refresh gates.
