# Brazil postal context runtime

Status: `M1_metadata`. This change ships contracts, source policy, synthetic fixtures and runtime tests. It contains no production CEP rows, real addresses, personal data or production geometry.

## Core model

Correios defines an eight-digit CEP. Display uses `NNNNN-NNN`; the Busca CEP API query uses eight digits without punctuation. A code can identify a logradouro or number range, locality, building, large user, Correios unit, locker or pickup point, P.O. box, community mailbox, organization or another delivery object.

~~~text
authorized Correios observation or licensed DNE row -> typed CEP object
area-capable locality + reviewed rights-cleared boundary -> derived-review geometry
street/range/building/large-user/unit/locker/P.O.-box/community-mailbox/organization -> non-area object unless independent area evidence exists
~~~

The full CEP is therefore `area-or-non-area`. Syntax, API availability, a CNEFE row, a CEP aggregate, an administrative boundary, road buffer, interpolation, Voronoi surface or model confidence cannot create an official assignment or official polygon.

## Evidence and rights boundaries

- Correios Busca CEP is the official time-bound query path for authorized contract clients. Store permitted observations with service version and digests; never treat public documentation as bulk-data permission.
- DNE is a commercially licensed, purpose-limited national address and CEP reference. Keep it gated or external unless the exact licence allows an artifact.
- The pinned UPU Brazil sheet defines eight-digit and address-layout semantics, not current assignments or a reusable address corpus.
- IBGE CNEFE 2022 provides statistical address fields, CEP aggregates and geocoded points. Preserve `NV_GEO_COORD` or equivalent quality. A coordinate may be an entrance, accessible point, rural gate, earlier location, street-face midpoint or census-sector centroid.
- IBGE municipal mesh 2024 and the 2023 national cartographic base provide administrative and cartographic context, never Correios geometry.
- INDE is discovery and interoperability infrastructure. Every discovered layer retains its own producer, scope, terms and authority.
- ViaCEP and BrasilAPI remain useful third-party candidate services. OpenStreetMap stays in a separately attributed ODbL partition.

## Address, building and AGID display

The display chain is:

~~~text
coordinate
  -> authorized time-bound Correios / licensed DNE assignment evidence
  -> typed CEP object
  -> reviewed derived postal-area surface only for area-capable objects
  -> IBGE administration and CNEFE quality-classified address context
  -> rights-cleared stable civic-address ID
  -> explicit reviewed civic-address-ID to building-ID relation
  -> permitted building point or footprint
  -> AGID crosswalk
~~~

A CEP, address point, CNEFE category, parcel, coordinate, containment, interpolation or nearest building never proves an exact address-to-building relationship. A model may rank review candidates but cannot invent a house number, complement, unit, building, person, owner, occupant or delivery entitlement.

## Runtime and API

The shared API supports Brazil once a digest-pinned runtime pack is configured:

~~~text
POST /api/postal/resolve
GET  /api/postal/BR/{cep}
GET  /api/postal/intersects?countryCode=BR&bbox=...
~~~

Configuration remains country-isolated through `AGID_POSTAL_CONTEXT_BR_DESCRIPTOR_PATH`, `AGID_POSTAL_CONTEXT_BR_DESCRIPTOR_DIGEST` and last-known-good equivalents. Geometry is withheld by default and returned only when explicitly requested.

## Hugging Face and Cloudflare

Hugging Face may host only rights-cleared, versioned Parquet or GeoParquet partitions. Production readers pin a Hub commit and verify shard digests. DNE data, Correios query logs, real addresses, fine CNEFE points, credentials, owner-linked data and restricted inputs remain gated or external.

Cloudflare Workers can serve the API and cache immutable digest-addressed descriptors. Geometry shards belong in R2 or another object store with signed manifests; Durable Objects may coordinate release state. Edge simplification and compression remain derived and cannot change evidence class, rights, quality or coverage.

## Synthetic boundary

The bundled `99999-999` fixture is fabricated, was not checked against live Correios and is ineligible for promotion. If it collides with a real assignment it must be replaced. Its polygon is only a synthetic derived-review surface, and its building exists solely to test separation among postal, administrative, CNEFE-like address, building and AGID evidence.
