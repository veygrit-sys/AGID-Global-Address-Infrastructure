# Jordan postal context runtime

Jordan is implemented as an independent M1 metadata country pack linked to the shared AGID postal-context runtime. This repository contains no production postcode rows, real addresses, personal data, cadastral records or production geometry. All executable examples use the synthetic code `99999` and synthetic geometry.

## Postal Code → Geometry → Address Context

The JO normalizer accepts exactly five digits after NFKC normalization and converts Arabic-Indic and Eastern Arabic-Indic digits. It preserves leading zeroes. It rejects country prefixes, hyphens and wrong lengths.

The dated UPU addressing sheet documents a five-digit code placed to the right of the locality and describes region, department, zone, sector and unit positions. It is syntax evidence dated September 2004, not current rows or geometry. Jordan's 2025 ICT and Postal Policy and explanatory material describe incomplete physical street/building addressing and a current postcode system oriented to Jordan Post carrier-route sorting. Therefore a five-digit value is modelled first as a routing/locality or postal-service object; it is never assumed to be a complete polygon or exact address.

The runtime keeps these layers distinct:

1. exact, dated Jordan Post or rights-cleared postcode assignment;
2. post office, P.O. Box or carrier-route point/non-area object;
3. exact postal-authority geometry, if a future licensed artifact supplies it;
4. optional derived routing-administrative join surface with uncertainty;
5. governorate, district/directorate, city/town/village and street context;
6. explicit rights-cleared civic address and separately linked building geometry;
7. independent AGID cell and versioned crosswalk.

Containment, nearest-office, street or village match, administrative overlap, Voronoi, interpolation and models may rank candidates. They cannot create an official postal assignment, canonical postal polygon, legal civic address, building link or delivery entitlement.

## Source and rights boundaries

- Jordan Post is the postal assignment reference. Pin the exact response, validity, schema, retrieval time, rights and digest.
- The Jordan Post Offices open-data item may support post-office and routing context. A row is not a postal polygon, civic-address coverage or delivery point.
- The Jordan Open Government Data License applies only to exact artifacts expressly published under it. Record publisher, item URL, publication/download dates, attribution, license version, schema and digest; public portal or viewer access alone is insufficient.
- RJGC is the official mapping/survey authority, but e-services are product-specific. The RJGC–Greater Amman MoU mentions numbered building points and street/context exchange under controlled institutional terms; it is not a public building/address license.
- DLS village codes are administrative/cadastral identifiers, never postcodes or buildings. Greater Amman street data is street context, not national address coverage or postcode geometry.
- The March 2026 digital postal-box initiative is retained as pilot metadata only. Until a public reviewed schema, API, privacy basis and artifact license exist, home locations and identity-linked address data remain excluded.
- OSM is an ODbL fallback validation layer and never supplies Jordan Post authority.

## Building display gate

The runtime may display a building only when a permitted civic-address record contains or links to a stable building identifier and the separately licensed geometry is valid for the requested purpose and time. It must pin provenance, rights, privacy classification, CRS and digests. Postcode containment, post-office proximity, coordinate equality, parcel overlap, street-name similarity and nearest-building logic remain candidate or validation evidence.

## API and AGID

The existing shared routes support JO once an independently signed descriptor is configured:

- `GET /api/postal/JO/{postcode}?validAt=...&geometry=geojson`
- `POST /api/postal/resolve` with `countryCode: "JO"`, coordinates, purpose and `validAt`
- the shared bbox intersection route for explicitly requested geometry

Geometry is opt-in. A returned derived surface carries derived quality and separate assignment/geometry authorities. `agid.canonicalPostalGeometry` remains false unless an exact postal-authority geometry artifact is independently verified. AGID is a spatial index, not a Jordan postcode, village code, digital mailbox or official postal boundary.

## Promotion checklist

Promotion beyond M1 requires: an exact current assignment artifact; exact item-level reuse rights; release dates and validity; stable object typing; CRS and topology validation; full source and output digests; coverage and ambiguity metrics; explicit treatment of non-area codes; privacy review; signed descriptor and rollback/LKG configuration; and tests proving that administration, offices, streets, pilot data, AGID and model output cannot be silently promoted.

## Official references

- UPU Jordan addressing sheet: https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/jorEn.pdf
- Jordan ICT and Postal Policy 2025: https://www.modee.gov.jo/EBV4.0/Root_Storage/AR/EB_News/ICTP_Policy_2025.pdf
- Jordan Post Offices open data: https://opendata.gov.jo/en/dataset/jordan-post-offices-1661-2023
- Jordan Open Government Data License v1.0: https://www.modee.gov.jo/ebv4.0/root_storage/en/eb_list_page/ogd-license_en.pdf
- Royal Jordanian Geographic Centre: https://www.rjgc.gov.jo/
- RJGC e-services: https://rjgc.gov.jo/eservices/index.php
- DLS village codes: https://opendata.gov.jo/en/dataset/dlsvillagecode-1344-2022
- Greater Amman streets: https://opendata.gov.jo/en/dataset/streets-inside-and-outside-265-2019
- Jordan Post digital-mailbox project report (Petra, 13 March 2026): https://petra.gov.jo/gweb/index.php/en/news/jordan-post-digital-mailbox-strategic-project-to-build-integrated-national-database
