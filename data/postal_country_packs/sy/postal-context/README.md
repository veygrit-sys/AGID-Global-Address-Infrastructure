# `agid-postal-sy` contract seed

Status: `M1 metadata / no production Syrian address data`

This seed defines Syria's no-postcode Postal Context boundary. It does not
contain Syrian Post data, addresses, postal-office records, production
geometry, API receipts, personal data or conflict-sensitive location records.

UPU's September 2025 list says a postcode is not required for Syria. Therefore
`postalCode` stays null. P.O. boxes, post offices, administrative boundaries,
routes, AGID cells and mathematical regions are not relabelled as official
postcodes or postal polygons.

M2 requires a current rights-cleared real dataset with explicit coverage,
edition, validity, source-row identity and SHA-256; a reproducible transform;
an approved immutable artifact; and actual SY AGID loader/API verification.
Administrative, civic-address, building and derived/virtual geometry retain
separate authority. House numbers and buildings require explicit source
relations, never containment or proximity.

The existing `data/postal_country_packs/sy` Postal Forge pack remains a
synthetic planning resource. It cannot satisfy a real-data M2 gate.
