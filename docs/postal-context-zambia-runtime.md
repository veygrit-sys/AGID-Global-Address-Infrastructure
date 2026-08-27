# Zambia Postal Context runtime

Status: M1_metadata. This release contains contracts, source policy, synthetic fixtures and runtime tests. It contains no current nationwide ZAMPOST or ZICTA assignment rows, customer or P.O. Box records, private-bag holders, real national addresses, personal data, production polygons, ZNSDI datasets, ZILAS records, titles, parcels or buildings.

## Evidence flow

`five-digit text -> pinned ZAMPOST/ZICTA observation or unverified -> official catchment or no canonical geometry -> province/district/locality context -> permitted operational national or civic address -> explicit address-linked building or parcel -> ZM AGID cell`

The [UPU Zambia sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/zmbEn.pdf) documents a five-digit format and routing context in January 2013. It also keeps street, rural delivery, P.O. Box, private bag, Postnet agency and poste restante objects distinct. The [ZAMPOST locations page](https://www.zampost.com.zm/index.php/locations) can support a minimized dated postal-facility observation when its terms permit; it is not treated as a bulk assignment API or service-boundary release.

## Assignment and national-address status

The [2013 National Assembly statement](https://www.parliament.gov.zm/node/609) says that 10101 was a proposal not representative of a particular location and describes phased street naming, property numbering, database and GIS work. The current [ZICTA project page](https://www.zicta.zm/services/postal-courier-regulation/projects) still describes the National Addressing and Postcode Project as a council-partnered effort to address each property. The [National E-Commerce Strategy 2023](https://www.mcti.gov.zm/wp-content/uploads/2024/01/National-E-Commerce-Strategy-2023.pdf) retains street, property, digital-address and national-postcode implementation activities. None of these pages is promoted into a complete operational public address database.

Official documents may display five-digit strings. That is an observation for the displayed address and date, not proof of a national assignment table, code history, polygon or delivery entitlement. Timeout, blocked search and empty results are unknown.

## Geometry and building gates

No rights-cleared nationwide official postcode catchment release is bundled or identified. A post-office point, routing digit, province, district, ward, pilot neighbourhood, cadastral lot, buffer, Voronoi cell, route or learned surface does not become official postal geometry.

The [ZNSDI Policy 2026](https://www.szi.gov.zm/wp-content/uploads/2026/06/NSDI_Policy.pdf) establishes custodian-led geospatial governance. Its [cadastral lots service](https://map.gov.zm/arcgis/rest/services/NSDI_Vector/CadasterNew/MapServer/0) exposes queryable parcel geometry and identifiers, while [ZILAS](https://www.mlnr.gov.zm/) provides controlled land-service context. Queryability or open-source portal software does not itself grant redistribution rights or relate a parcel to a postal or national address. Exact buildings require a stable explicit, rights-cleared operational address relation.

## Realtime generation, models and compression

Realtime operator lookup can improve freshness for a minimized permitted observation when purpose, terms, selected fields, observed time, source version and request-response digests are retained. Models may normalize, index, detect drift, prioritize review and generate uncertainty-bearing review surfaces. Geometry simplification, quantization, PMTiles and bounded-error compression are allowed only for rights-cleared inputs; modified geometry remains derived and non-canonical.

## Privacy, Hugging Face and Cloudflare

The [Zambia Data Protection Act 2021](https://www.parliament.gov.zm/sites/default/files/documents/acts/Act%20No.%203%20The%20Data%20Protection%20Act%202021_0.pdf) governs personal-data collection, use, storage, security, retention and cross-border transfer. [Data Protection Commission guidance](https://www.dataprotection.gov.zm/faq/) expressly includes location data within personal data.

Hugging Face and Cloudflare may hold rights-cleared non-personal immutable artifacts pinned to a commit or release. Recipient, holder, precise address, household, property, owner, title, delivery and query data remains gated and Zambia-hosted or transferred only under an approved lawful basis. AGID stays an independent spatial index and is never relabelled as an official Zambian postcode, parcel or administrative polygon.
