# Kenya Postal Context runtime

Status: M1_metadata. This release contains contracts, source policy, synthetic fixtures and runtime tests. It contains no current Posta Kenya assignment rows, customer or P.O. Box records, MPost/e-Njiwa accounts, real NASK addresses, personal data, production polygons, Survey of Kenya datasets, Ardhisasa records, parcels or buildings.

## Evidence flow

`five-digit text -> pinned Posta delivery-post-office observation -> official catchment or no canonical geometry -> county/locality context -> permitted operational NASK or civic address -> explicit address-linked building or parcel -> KE AGID cell`

The [Posta Kenya mail-services page](https://posta.co.ke/services/services/) defines postcodes as distinct codes identifying individual post offices within postal regions. The dated [UPU Kenya sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/kenEn.pdf) describes a five-digit code below the delivery post office and gives region, distribution-centre and delivery-office digit semantics. These establish object and format context, not a complete current assignment database or postal perimeter.

## Postcode, P.O. Box, virtual address and NASK

The [Posta Kenya Customer Service Charter](https://posta.co.ke/wp-content/uploads/2023/08/CUSTOMER-SERVICE-CHARTER-2022sep-6th-2022.pdf) keeps the P.O. Box number, postcode and post-office name as separate address fields and describes MPost/e-Njiwa services separately. A pair such as `34567-00100` is therefore a box number followed by a five-digit post-office code, not one postcode. MPost registration details and box-holder identity are private service data, not evidence of a residence or building.

The [Communications Authority June 2026 status](https://www.ca.go.ke/kenya-moves-towards-national-addressing-system-stakeholders-support-bill) describes a geographically tied address for every dwelling as a National Addressing System goal while the 2025 Bill remains before Parliament. The [2023 policy](https://ict.go.ke/sites/default/files/2024-09/National%20Addressing%20Policy%20-%20March%202023.pdf) defines addressable objects, geocoding and a proposed alphanumeric NASK address. Neither publication is treated as an operational public address release.

## Geometry and building gates

No rights-cleared nationwide official postcode catchment release is bundled or identified. A post-office or Posta-property point, postcode prefix, postal region, county, constituency, ward, locality, cadastral parcel, buffer, Voronoi cell, route or learned surface does not become official postal geometry.

The [Survey of Kenya policy context](https://lands.go.ke/wp-content/uploads/2021/10/Draft-National-Land-Surveying-and-Mapping-Policy-2021.pdf) identifies the government mapping authority and property-boundary responsibilities. [Ardhisasa](https://ardhisasa.lands.go.ke/home) exposes controlled land-registration, property, survey and mapping workflows. An exact building is returned only when a rights-cleared artifact has a stable explicit operational NASK or authoritative civic-address-to-building/cadastral relation. Postcode, P.O. Box, virtual address, text matching, containment, overlap, nearest building and model score produce candidates only.

## Realtime generation, models and compression

Realtime operator lookup can improve freshness for a minimized permitted observation when purpose, terms, selected fields, observed time, source version and request-response digests are retained. Timeout, empty output or blocked access is unknown. A model may normalize, index, detect drift, prioritize review and create an uncertainty-bearing review surface. Geometry simplification, quantization, PMTiles and bounded-error compression are permitted for rights-cleared inputs, but modified surfaces remain derived and non-canonical.

## Privacy, Hugging Face and Cloudflare

Kenya [ODPC guidance](https://www.odpc.go.ke/faqs/) treats physical and postal address and location as personal data and property details as sensitive personal data. Customer, box-holder, phone, MPost, household, parcel, title, owner and query information remains purpose-limited, minimized and gated.

Hugging Face may store only rights-cleared immutable public or derived shards pinned to a commit or release. Cloudflare may serve verified metadata and permitted spatial indexes. Restricted customer and property material remains external or behind authorization. AGID stays an independent spatial index and is never relabelled as an official Kenyan postcode or administrative polygon.