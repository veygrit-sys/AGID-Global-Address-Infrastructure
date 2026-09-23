# Latvia Postal Context contract seed

This directory is the M1 metadata seed for the future `agid-postal-lv`
country repository. It contains no Latvijas Pasts rows, VZD address records,
cadastral contours, real addresses, or production postal geometry.

The authority chain is deliberately split:

- Latvijas Pasts supplies postcode assignment and address-membership evidence.
- The VZD State Address Register supplies civic-address identity, lifecycle,
  postcode attributes, coordinates, and explicit cadastral relations.
- VZD cadastral data supplies building external contours and their documented
  accuracy class.
- VZD administrative, village, and road geometry supplies context only.
- AGID supplies the spatial index and cell relation; it never becomes postal
  assignment evidence.

`LV-NNNN` is not assumed to be an area. Rīga directory entries may enumerate
street and house-number membership, rural entries may represent a locality or
municipality, and special organization codes can be non-areal. Any generated
surface is therefore `derived`, noncanonical, versioned, and reproducible from
an explicit complete membership set.

An address may reach building level only through a stable source-backed VZD
address/cadastral relation. Containment and nearest-footprint matches remain
candidates. Public outputs exclude recipients, residents, owners, tenants,
private-unit data, credentials, and restricted-security objects.

See `repository-manifest.json`, `source-profile.json`, and
`fixtures/latvia-synthetic.json` for the promotion contract. The synthetic
fixtures test runtime behavior only and cannot promote a real release.

## 2026-08-30 M2 review boundary

The current Latvijas Pasts page lists eleven PDF assignment books but no postcode
Polygon/MultiPolygon product; eight books were byte-pinned and three local
retrievals returned HTTP 522. VZD's current 2026-08-29 CC BY 4.0 release has
550,515 active approved postcode-bearing address Points across 693 codes and
no postcode-area layer. The books and points remain separate authorities and
no buffer, hull, Voronoi/raster cell, administrative/locality, road, parcel or
building proxy may promote this M1 seed to M2.
