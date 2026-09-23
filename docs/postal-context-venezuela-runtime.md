# Venezuela postal context runtime

Status: `M1_metadata`. This change ships contracts, source policy, synthetic fixtures and runtime tests. It contains no production postcode rows, real addresses, personal data or production geometry.

## Core model

The UPU May 2019 country sheet identifies IPOSTEL as Venezuela's designated operator and defines four digits: the first digit is the postal region and the remaining three identify the delivery office.

~~~text
authorized time-bound IPOSTEL observation -> typed delivery-network object
reviewed rights-cleared delivery service evidence -> derived-review service-area geometry
postal region / delivery office / route / P.O. box / locality -> non-area unless independent area evidence exists
~~~

The code is `delivery-network-first`, not polygon-first. Syntax, a search page, UPU example, INE locality, administrative boundary, cadastral parcel, buffer, interpolation, Voronoi surface or model confidence cannot create an official assignment or official polygon.

## Source boundaries

- IPOSTEL is the designated operator. Revalidate the official lookup and its exact automation, caching and reuse terms before ingestion; retain only permitted time-bound observations.
- The UPU May 2019 sheet is address-layout and code-structure evidence, not a current assignment table or reusable address corpus.
- INE populated-place material described for the 2001 census is dated locality, municipality and parish context. Obtain the exact underlying artifact before production.
- IGVSB is the national geographic, cartographic and cadastral authority. Every usable layer still needs producer, edition, jurisdiction, terms, CRS, quality and digest.
- The 2000 geography, cartography and cadastre law describes public territorial information and national/municipal roles. The statute is not itself a bulk-data licence, current dataset, address relation or building relation.
- OpenStreetMap remains a separately attributed ODbL validation partition.

## Address, building, territory and AGID

~~~text
coordinate
  -> time-bound IPOSTEL assignment observation
  -> typed postal-region / delivery-office / route / locality object
  -> reviewed derived service-area surface only with independent area evidence
  -> versioned administration and locality context
  -> rights-cleared stable civic-address ID
  -> explicit reviewed civic-address-ID to building-ID relation
  -> permitted building point or footprint
  -> AGID crosswalk
~~~

A postcode, reference, locality, parcel, coordinate, containment or nearest building never proves an exact address-to-building relationship. Territorial representations retain their source, jurisdiction, legal status and validity; postal or AGID geometry cannot resolve sovereignty or a boundary dispute.

## Runtime, Hugging Face and Cloudflare

The shared API supports `POST /api/postal/resolve`, `GET /api/postal/VE/{postcode}` and `GET /api/postal/intersects?countryCode=VE&bbox=...` once a digest-pinned pack is configured through `AGID_POSTAL_CONTEXT_VE_*` variables.

Hugging Face may host only rights-cleared, versioned Parquet or GeoParquet partitions. Production readers pin a Hub commit and verify shard digests. Real addresses, references, IPOSTEL query logs, cadastral and owner-linked data, credentials and restricted inputs remain gated or external.

Cloudflare Workers can serve the API and cache immutable digest-addressed descriptors. Geometry shards belong in R2 or another object store with signed manifests; Durable Objects may coordinate release state. Edge simplification and compression remain derived and cannot change evidence class, rights, jurisdiction or coverage.

## Synthetic boundary

The bundled `9999` fixture is fabricated, was not checked against live IPOSTEL and is ineligible for promotion. If it collides with a real assignment it must be replaced. Its polygon is only a synthetic derived-review service area, and its building exists solely to test separation among postal, administrative, civic-address, building, territorial and AGID evidence.
