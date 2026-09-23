# Benin Postal Context M2 review

Observed at 2026-09-02T21:28:30.369Z on the cumulative rollout branch.

## Decision

BJ is excluded from current postcode-data creation and remains `blocked`, not M2. The UPU Universal DataBase September 2025 list (file updated 20 August 2026) includes Benin among countries that do not require postal codes. The UPU Benin address sheet dated November 2025 shows `10 BP 648`, identifies `10` as the delivery post office and `BP 648` as the P.O. box, then uses locality and telephone without a postcode.

The prior repository claim of a four-digit Benin postcode was unsupported: La Poste du Bénin's agency directory lists offices, communes, locations, connectivity and categories, not postcode assignments. It has been replaced with `None`. Delivery-office identifiers, P.O. boxes, agencies, administrative areas, localities, Points, buffers, buildings and AGID cells must not be promoted to postcode or postal-area geometry.

## Sources, rights and exact-body verification

Six official response bodies were retained only in a dedicated temporary directory for inspection: La Poste agency, distribution and legal pages; the UPU Benin sheet; the UPU general addressing document; and the UPU copyright page. Every body is fixed by URL, retrieval result, byte length and SHA-256 in the country report and executable inspector. The bodies are not committed.

La Poste's pages state All Rights Reserved and do not grant dataset redistribution. UPU copyright/database terms likewise do not provide open postal-data rights. Web access is treated only as reference evidence.

## Address Context and AGID boundary

The corrected address metadata separates recipient, square number, house, street, quarter, arrondissement, delivery-office-and-P.O.-box object, locality and telephone. This allows search results to expose detailed, source-qualified civic context and an independent AGID identifier without pretending that either is a postcode. Building display still requires a separately authorized address-to-building relation.

## M2 gate

M2 would require a future competent-authority postcode release, complete assignments and exceptions, compatible processing and redistribution rights, fixed source and transformed artifacts, real Polygon/MultiPolygon records, and verified BJ API/app lookup with map fit, translucent fill, clear outline and required metadata/error states. None exists in the reviewed sources. Retry after 2026-12-02T21:28:30.369Z, following the pending-country pass, or earlier only after an official system announcement.
