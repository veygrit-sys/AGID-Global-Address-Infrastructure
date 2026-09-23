# Costa Rica postal context runtime

Status: `M1_metadata`. This change ships contracts, source policy, synthetic fixtures and runtime tests. It contains no production postcode rows, real addresses, personal data or production geometry.

## Core model

Costa Rica is a strong candidate for deterministic postal-polygon derivation because the five-digit postcode follows the administrative code:

```text
postcode = province[1] + canton[2] + district[2]
```

The April 2009 UPU sheet documents this structure. The UPU Costa Rica addressing-policy case study says each district received a postcode based on official administrative numbering. That evidence does not make an arbitrary district layer an official postal polygon.

For a postcode `c`, AGID may derive a candidate region only as a strict join:

```text
assignment(c, t) ⋈ district(code = c, t, release, rights)
```

Promotion to `official-derived` requires all of the following:

1. A pinned Correos de Costa Rica assignment observation.
2. An exact, versioned province/canton/district code.
3. A one-to-one code-to-district join.
4. Overlapping assignment and geometry validity.
5. Resource-level rights that permit the intended output.
6. Verified CRS, topology, coverage and source/output digests.
7. Confirmation that the object is not a special non-area or internal delivery-point object.

Failure leaves a typed non-geometric postal object; it does not trigger a guessed polygon.

## Source boundaries

- Correos de Costa Rica is assignment authority for a pinned time-bound operator observation. The interactive service is not a nationwide reusable address corpus or polygon release.
- The UPU sheet is historical format and layout evidence, not a current assignment table.
- The UPU policy case study explains district assignment and a separate internal 19-digit delivery-point code. That internal identifier is not public and must not be reconstructed.
- INEC DTA manuals provide administrative identity and codes. Pin the exact edition and resource terms.
- INEC UGED 2024 provides downloadable geostatistical district geometry. INEC explicitly notes that UGED avoids some imaginary DTA limits, so it is not automatically legal DTA geometry or operator geometry.
- SNIT/IGN is a metadata and official-layer reference. SNIT general conditions prohibit commercial use of direct or derived geographic information; public AGID output cannot silently derive from it.
- OpenStreetMap remains a separately attributed ODbL validation partition.

## Address and building display

Keep recipient, attention, organization, street, house number, neighborhood/locality, exact directions, landmark, premises/building, floor, unit, P.O. Box, province, canton, district and postcode separate.

The display chain is:

```text
coordinate
  -> permitted postcode/district evidence
  -> administrative context
  -> explicit rights-cleared civic address ID
  -> explicit reviewed civic-address-ID to building-ID relation
  -> permitted building point or footprint
  -> AGID crosswalk
```

A postcode, district, parcel, landmark, directions string, coordinate, containment or nearest feature never proves an exact address-to-building relationship. A model may rank candidates for review but cannot create missing house numbers, units, buildings, organizations, people or delivery entitlements.

## Runtime and API

The shared API supports Costa Rica once a digest-pinned runtime pack is configured:

```text
POST /api/postal/resolve
GET  /api/postal/CR/{postcode}
GET  /api/postal/intersects?countryCode=CR&bbox=...
```

Configuration is country-isolated:

```text
AGID_POSTAL_CONTEXT_CR_DESCRIPTOR_PATH=
AGID_POSTAL_CONTEXT_CR_DESCRIPTOR_DIGEST=
AGID_POSTAL_CONTEXT_CR_LKG_DESCRIPTOR_PATH=
AGID_POSTAL_CONTEXT_CR_LKG_DESCRIPTOR_DIGEST=
```

The runtime normalizes full-width digits and spaces, accepts only five digits whose province digit is `1` through `7`, and never treats syntax as assignment proof.

## Hugging Face and Cloudflare

Hugging Face may host only rights-cleared, versioned Parquet/GeoParquet partitions. Production readers pin a Hub commit and verify shard digests. Dataset Viewer is a preview; a Space is a demo, not the authoritative store. Restricted operator, UPU, SNIT, cadastral, delivery-point and address data stays private, gated or external under its terms.

Cloudflare Workers can serve the API and cache immutable digest-addressed artifacts. Large geometry belongs in R2 or another object store with a signed manifest; Durable Objects coordinate release state if required. Edge caching never changes evidence class, source rights or promotion status.

## Synthetic test boundary

The bundled `79999` fixture is fabricated, was not checked against the live operator and is ineligible for promotion. If it collides with a real assignment it must be replaced. Its polygon and building exist only to test separation of postal, administrative, address, building and AGID evidence.
