# Somalia postal context runtime

Somalia is modeled as an **operational-postal-service / evidence-gated-postcode** country. The Ministry of Communications and Technology says mail sending and receiving resumed in May 2025, and the Federal Cabinet approved the National Postal Policy 2025-2030 in January 2026. Those facts establish current institutional progress; they do not by themselves publish nationwide postcode assignments, delivery coverage or postal polygons.

The official Somali Bureau of Standards contact page publicly shows `BN03010` beside `P.O. Box 67`. The runtime therefore accepts the observed `AA` plus five-digit structure and normalizes it to `AA NNNNN`. It rejects the older three-digit shape, numeric-only values and P.O. Box text. This is structure validation only: a syntactically valid value is not treated as assigned, mandatory, geographic or current without an authoritative release-pinned assignment artifact.

No public authoritative postcode-to-geometry artifact was verified. Administrative units, enumeration areas, post-office points, roads, parcels, buildings, routes, buffers, Voronoi cells, model surfaces, OSM objects and AGID cells must not be presented as official postcode polygons. A later derived review surface must retain method, inputs, uncertainty, exclusions and non-canonical status.

Address display can reach premise or building level only through an explicit rights-cleared civic-address-to-building relation with stable identifiers. Postcode, P.O. Box, administrative containment, nearest road or footprint, parcel overlap and model confidence never manufacture a house number, recipient or exact building.

Every source artifact must declare federal, federal-member-state, municipal or other territorial scope. Separately governed or operated postal, address, statistical, land and infrastructure datasets are not silently merged or extrapolated to nationwide coverage.

NIRA's 11-digit identity number remains a person identifier, never a postcode, civic address or building identifier. Recipient, subscriber, household, identity, precise address, parcel-person, owner, occupant, delivery and query-log data are controlled. Cloudflare and Hugging Face may expose only immutable digest-pinned, rights-cleared non-personal artifacts; sensitive or identity-linked material remains in approved controlled infrastructure consistent with stated data-sovereignty requirements.

AGID is an independent conflict-sensitive spatial fallback. A Somali AGID cell is not an official postcode, civic address, administrative boundary, cadastral parcel, delivery entitlement or identity number. Precise AGID output is suppressed by default for sensitive use cases.

The checked-in M1 seed contains metadata and synthetic fixtures only. It contains no production postcode rows, real addresses, personal data or production geometry.
