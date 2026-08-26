# Peru postal context runtime

Status: `M1_metadata`. This change ships contracts, source policy, synthetic fixtures and runtime tests. It contains no production postcode rows, real addresses, personal data or production geometry.

## Evidence order

`MTC release row or permitted time-bound lookup -> typed routing/locality object -> reviewed rights-cleared service evidence -> derived-review service-area geometry -> explicit civic-address-to-building relation -> AGID crosswalk`

The MTC national postcode is five digits. Digits one and two identify the department or postal region, digit three identifies a routing zone organized around transport networks, and digits four and five identify a postal district, locality, populated centre or urban concentration. The official lookup says geographic boundaries are referential.

The code is `routing-locality-first`, not polygon-first. Syntax, a department prefix, the 2018 XLSX, lookup rendering, Ubigeo, administrative boundary, locality point, cadastral parcel, buffer, interpolation, Voronoi surface or model confidence cannot create a current assignment or official postcode polygon.

## Source and licence gates

- MTC operates the official lookup. Every observation records endpoint state, permitted query, `observed_at`, `retrieved_at` and response digest; automation and cache terms are revalidated.
- The national open-data catalog publishes a dated 23 March 2018 XLSX under Open Data Commons Attribution. Production pins the file, catalog and licence snapshot, schema, attribution and digest. A dated assignment row is not automatically current and the XLSX is not a polygon release.
- Decreto Supremo 007-2011-MTC is the legal/technical framework. The 2017 MTC postal bulletin records the digit structure and 2,670-code system; neither publication is a current row or geometry release.
- UPU identifies SERPOST as the designated operator. Institutional and mailing guidance remains context.
- INEI Ubigeo, IGN referential boundaries and populated centres, GeoVivienda and COFOPRI urban/cadastral services remain separate from MTC assignment and postal geometry. Every release or layer pins its terms, edition, jurisdiction, coverage, CRS and digest.
- OSM stays in an attributed ODbL partition.

## Address and building resolution

The address model stores recipient, organization, thoroughfare, number/S/N, block, lot, urbanization or settlement, building, floor, interior, reference/point of interest, locality/populated centre, district, province, department/Constitutional Province, P.O. Box and postcode separately.

A postcode, reference, point of interest, locality, parcel, coordinate, containment or nearest construction never proves an exact address-to-building relationship. Building display requires a rights-cleared stable civic-address identifier, an explicit reviewed link to a permitted construction identifier and separately governed geometry.

## API, AGID, Cloudflare and Hugging Face

The shared API supports `POST /api/postal/resolve`, `GET /api/postal/PE/{postcode}` and `GET /api/postal/intersects?countryCode=PE&bbox=...` once a digest-pinned pack is configured through `AGID_POSTAL_CONTEXT_PE_*` variables. Cloudflare Workers can verify descriptors and shards, cache bounded responses and query a spatial index; they do not turn derived surfaces into official evidence.

Hugging Face may host only rights-cleared versioned Parquet or GeoParquet partitions. Production readers pin a Hub commit and verify shard digests. Real addresses, references, MTC query logs, cadastral and owner-linked data, credentials and restricted inputs remain gated or external.

AGID is an independent spatial index. Crosswalks preserve source identity, time, jurisdiction, evidence class and uncertainty; an AGID cell is never an MTC postcode polygon.

## Synthetic boundary

The bundled `99999` fixture is fabricated, was not checked against live MTC data and is ineligible for promotion. If it collides with a real assignment it must be replaced. Its polygon is only a synthetic derived-review service area, and its building exists solely to test separation among postal, administrative, civic-address, building, territorial and AGID evidence.
