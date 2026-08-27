# Seychelles postal context runtime

Seychelles is modeled as a **no-current-authoritative-postcode / National Addressing System transition** country. The runtime rejects `0000` and arbitrary four-digit values as postcodes. It keeps future postcode assignments, place-linked National Address identifiers, P.O. Boxes, islands, districts, subdistricts, parcels, buildings and AGID cells as different typed objects.

The metadata seed records the Postal Regulator's current S42 system status, the 2024 implementation decision, the 2025 Beau Vallon progress report and the April 2026 Bill approval separately. None of those publications is treated as a complete assignment database, an enacted-and-commenced schema or a postcode polygon release.

Coordinate resolution may reach building level only through an explicit rights-cleared National Address-to-building relation. NBS enumeration areas, household frames, Lands WebGIS parcels, the informational WebGIS display, OSM features and the dated 2018 building import remain context or candidates; proximity, containment and model scores do not create an exact address link.

AGID is the global fallback spatial index. A Seychelles AGID cell or future virtual postal region remains non-canonical and is never relabelled as an official postcode, National Address, district or cadastral parcel.

The checked-in M1 release contains metadata and synthetic fixtures only. It contains no production postcode, address, subscriber, parcel, owner, occupant, building or geometry rows.

Cloudflare and Hugging Face deployments may expose only immutable, digest-pinned, rights-cleared non-personal artifacts. Controlled National Address, recipient, contact, subscriber, household, parcel-person, delivery and precise query data require Seychelles Data Protection Act 2023 and cross-border review.
