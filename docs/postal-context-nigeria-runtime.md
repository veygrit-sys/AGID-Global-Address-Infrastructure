# Nigeria Postal Context runtime

Status: M1_metadata. This release contains contracts, source policy, synthetic fixtures and runtime/API tests. It contains no current nationwide NIPOST assignment mirror, live eleven-character code, real address, personal data, production polygon, census/administrative boundary, cadastral record, owner, occupant or building.

## Transition-aware evidence flow

`six-digit text -> current numeric NIPOST assignment observation -> district/delivery/locality context -> official geometry or no canonical polygon -> state/FCT/LGA/ward/EA context -> explicit civic address -> explicit address-linked building -> independent NG AGID cell`

From the scheduled effective date, a separate path is possible:

`eleven-character text -> effective-time gate -> current official NIPOST digital assignment -> State/LGA/District/Area/Building segments -> explicit official location/building relation -> independent NG AGID cell`

The current [NIPOST mail-services page](https://nipost.gov.ng/Mails/) describes the numeric postcode system for mail processing and delivery. The existing finder page does not expose a stable documented public API or a reusable nationwide assignment table.

The [National Digital Alphanumeric Postcode site](https://www.postcode.gov.ng/) schedules nationwide launch for 1 October 2026, describes an eleven-character State/LGA/District/Area/Building hierarchy and says the official developer portal is still forthcoming. On this release's observation date, 27 August 2026, eleven-character syntax is therefore prelaunch metadata. It cannot be treated as a live building assignment before the effective date or without a current official response, developer/data terms, version and digest.

## Polygon gate

No verified reusable nationwide NIPOST postcode-polygon release is bundled. A postcode string, post-office point, district, LGA, ward, enumeration area, locality, route, buffer, Voronoi cell, model output, OSM feature or AGID cell is not an official postcode polygon.

The [NPC Enumeration Area Demarcation programme](https://nationalpopulation.gov.ng/EAD) describes census/statistical EA, supervisory area, locality, ward/registration area, LGA, building and road data available to users at a cost. These layers require an exact contract, confidentiality and redistribution review and remain independent from NIPOST assignment authority.

A boundary may become a derived review surface only after the current NIPOST assignment and code generation, stable administrative identities, exact rights-cleared edition, CRS transformation, topology, exclusions, uncertainty and input/output digests are pinned. Only geometry explicitly authorized by NIPOST for the same assignment and validity can be canonical.

## Address and building display

The [Nigerian National Addressing Standard and Guidelines](https://nipost.gov.ng/wp-content/uploads/2024/09/NIGERIAN-NATIONAL-ADDRESSING-STANDARD-AND-GUIDELINES.pdf), dated July 2017, defines street naming, house/property numbering, address components, postcode logic and building-identification methodology. The [UPU Nigeria sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/ngaEn.pdf) supplies dated placement and address-type semantics. Neither is a current public address/building database or a redistribution licence; P.O. Box and PMB stay separate from a physical building address.

Exact building display requires a current official NIPOST digital assignment or a stable rights-cleared civic-address identifier plus an explicit authoritative address-to-building relation with validity and digest. Administrative or postal containment, address text, a parcel overlap, the nearest OSM footprint or a model score may rank a review candidate but cannot create a building link.

[FCT AGIS](https://fcta.gov.ng/ova_dep/abuja-geographic-information-systems/) is a jurisdiction-specific land registry, cadastre, street-naming and house-numbering system. FCT and each state/local system must remain separate controlled partitions; parcel or property data is not a national NIPOST code, official postal polygon, building relation or owner/occupant publication right.

## Realtime generation, models and compression

Realtime NIPOST lookup can improve freshness only for a minimized permitted observation with timeout, rate, provenance, selected fields, observed/effective time, response digest and cache policy. A future developer portal is not pre-authorized as a public bulk API. Models may normalize names, detect crosswalk drift and produce uncertainty-bearing non-canonical review surfaces. They cannot manufacture an official assignment, launch/effective date, boundary, civic address or building relation.

Rights-cleared polygons may be simplified, quantized and packaged as PMTiles after topology and maximum-error tests. The compressed artifact retains source rights, edition, transformation chain, uncertainty and digest; compression never upgrades authority.

## Privacy, Cloudflare and Hugging Face

The [Nigeria Data Protection Act 2023](https://ndpc.gov.ng/download/nigeria-data-protection-act-2023) and [NDPC GAID 2025](https://ndpc.gov.ng/wp-content/uploads/2025/03/NDP-ACT-GAID-2025-MARCH-20TH.pdf) govern lawful purpose, fairness, accountability, security, DPIA, retention, processors and cross-border safeguards for precise addresses, building codes, coordinates and identifiable query data.

Cloudflare and Hugging Face may hold only rights-cleared non-personal immutable artifacts pinned to releases or Hub commits. Precise private addresses, building-code relations, residents, owners, occupants, deliveries, credentials and sensitive queries remain in approved controlled infrastructure after applicable Nigerian privacy, processor and cross-border review. AGID stays an independent spatial index and never becomes a NIPOST code or exact building identifier.
