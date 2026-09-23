# United Kingdom Postal Context runtime

Status: `M2 runtime-ready / M1 United Kingdom data / real area M2 blocked`

AGID can load Japan, Singapore, the Netherlands, and the United Kingdom
independently. The GB country policy adds outward/inward normalization,
delivery-unit-first semantics, derived postal surfaces, UPRN/address/building
evidence, and synthetic conformance fixtures without copying the shared
resolver or API.

No nationwide production GB pack is bundled. The lightweight country contract
is in
[`data/postal_country_packs/gb/postal-context`](../data/postal_country_packs/gb/postal-context/README.md).

## 1. A unit postcode is an assignment before it is a polygon

AGID accepts compact or spaced postcode input, applies NFKC and uppercase, and
emits exactly one space before the three-character inward code. `sw1a1aa`
becomes `SW1A 1AA`; `GIR0AA` becomes `GIR 0AA`. A hyphen is rejected. Syntax
normalization does not prove that Royal Mail has allocated the code or that it
is live.

The ONS describes a small-user unit postcode as a group of usually adjacent
addresses, up to 100, while a large-user postcode may belong to a single
high-volume address. The canonical graph is therefore:

```text
unit postcode
  -> Royal Mail delivery-point assignment
  -> licensed address record
  -> UPRN / addressable location
  -> exact building relation when independently evidenced
```

Area, district, and sector prefixes are routing geography only. They cannot
select a premise or building.

## 2. Independent authority layers

### Royal Mail PAF

PAF is the authoritative delivery-point address and postcode assignment source.
It is licensed data. It neither establishes public redistribution rights nor an
official boundary around a postcode.

### ONSPD and NSPL

ONS postcode products include live and terminated UK postcodes and map them to
administrative and statistical geographies. ONSPD uses the mean grid reference
of addresses within a postcode and point-in-polygon assignment. That coordinate
is useful for search and context but is not an exact delivery point, address, or
boundary.

The products are released quarterly. A build pins the release and user guide,
tracks termination status, and emits the required ONS, OS, and Royal Mail
attributions. `BT` data remains in a separate Land and Property Services rights
partition.

### OS Open UPRN

OS Open UPRN supplies a persistent identifier and coordinate reference for each
addressable location across Great Britain. It is updated every six weeks and is
available under OGL. It does not include a complete postal address or a building
footprint, so those fields cannot be inferred from the UPRN point.

### Building evidence

OS OpenMap Local can supply generalized building geometry for public context.
Nearest-point matching is only a derived candidate. Exact address-to-building
display requires an explicit licensed AddressBase/OS building relationship or
another independently authoritative public relationship.

Primary references:

- [ONS postal geography and limitations](https://www.ons.gov.uk/methodology/geography/ukgeographies/postalgeography)
- [ONS postcode products](https://www.ons.gov.uk/methodology/geography/geographicalproducts/postcodeproducts)
- [ONS geography licences](https://www.ons.gov.uk/methodology/geography/licences)
- [Royal Mail PAF and address products](https://www.royalmail.com/business/data-quality/address-data)
- [OS Open UPRN](https://www.ordnancesurvey.co.uk/products/os-open-uprn)
- [OS OpenMap Local](https://www.ordnancesurvey.co.uk/products/os-open-map-local)
- [OS Open Identifiers policy](https://www.ordnancesurvey.co.uk/products/open-mastermap-programme/open-id-policy)

## 3. Polygon generation and compression

For unit postcode `c`, let `A_c` be source-backed address points. A reproducible
candidate surface clipped to boundary `B` is:

\[
R_c^{model} = B \cap \bigcup_{p \in A_c} V(p).
\]

This is computationally straightforward, but correctness depends on point
coverage, large users, vertically stacked delivery points, PO Boxes, coastal
clipping, and changes over time. The stored record must pin inputs, algorithm,
parameters, source time, known time, and digest, and it must say
`derived_geometry`.

Preferred storage is:

1. normalized postcode assignment and live/terminated history;
2. address/delivery-point identifiers allowed by licence;
3. UPRN points and explicit address-building relationships;
4. optional versioned derived unit-postcode surfaces;
5. AGID cell covers or sorted ranges as candidate indexes;
6. original geometry for final containment checks.

AGID covers compress candidate search but never become canonical Royal Mail
geometry.

## 4. Runtime and API

The United Kingdom has independent active and last-known-good pins:

```dotenv
AGID_POSTAL_CONTEXT_GB_DESCRIPTOR_PATH=C:\absolute\path\gb-descriptor.json
AGID_POSTAL_CONTEXT_GB_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
AGID_POSTAL_CONTEXT_GB_LKG_DESCRIPTOR_PATH=C:\absolute\path\gb-lkg-descriptor.json
AGID_POSTAL_CONTEXT_GB_LKG_DESCRIPTOR_DIGEST=sha256:<64 lowercase hex characters>
```

The stable API accepts `countryCode: "GB"` and GB path parameters:

```text
GET  /api/v1/postal/capabilities
GET  /api/v1/postal/releases/GB
POST /api/v1/postal/resolve
GET  /api/v1/postal/GB/SW1A%201AA
GET  /api/v1/postal/intersects?country=GB&bbox=...
```

Postal lookup omits geometry unless `geometry=geojson` is explicit. A returned
derived surface keeps its source and quality metadata and is never presented as
a Royal Mail boundary. Coordinate resolution reaches a premise or building only
through coherent address-point and relationship evidence.

## 5. Current M2 source audit

The 2026-08-30 primary-source review confirms that ONSPD, Code-Point Open, and OS NI Postcodes are point/crosswalk products, not unit-postcode boundaries. OS Code-Point with Polygons supplies notional Great Britain extents but requires agreement-controlled access and has no Northern Ireland polygon coverage. No contract was accepted, no controlled bytes were acquired, and no point or synthetic fixture was turned into an area. See [the GB M2 review](postal-context-united-kingdom-m2.md) and the [machine-readable source report](../reports/postal-context-m2/gb-source-review-2026-08-30.json).

## 6. Remaining production work

The truthful capability is “United Kingdom runtime and country contract ready;
nationwide production pack not complete.” The external `agid-postal-gb`
repository must still:

1. establish PAF, AddressBase, OS building, and LPS rights per artifact;
2. pin quarterly ONSPD and six-weekly OS Open UPRN snapshots;
3. build live/terminated postcode and administrative crosswalk history;
4. join delivery points, UPRNs, and buildings without collapsing ambiguity;
5. generate and evaluate optional derived polygons against independent holdout;
6. validate large users, PO Boxes, BFPO, BT, offshore, and reused codes;
7. pass attribution, privacy, freshness, drift, rollback, and two-refresh gates.
