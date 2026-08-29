# `agid-postal-at` contract seed

Status: `M1 metadata / assignments verified, no production postcode-area geometry`

This seed defines Austria's Postal Context authority boundary. It contains no
raw source workbook, address rows, personal data or production geometry.

The September 2026 Österreichische Post directories and RTR table agree on all
2,234 addressable four-digit postcodes. That agreement establishes current
assignment and addressability, not a perimeter. Destination localities,
districts, municipalities and address-register membership remain distinct.

A Statistik Austria postcode region can be official-statistical geometry, but
it is not an Austrian Post delivery perimeter. The reviewed public WFS and
current STATatlas configuration expose no reusable postcode layer. A derived
surface additionally requires a complete permitted stable address-to-postcode
relation and must retain its method, omissions, uncertainty and derived class.

M2 requires a pinned real Polygon/MultiPolygon artifact, rights, edition,
validity, schema, coverage and SHA-256; reproducible transformation and
validation; immutable publication; and actual AT loader/API/app verification.
The app must search a normalized postcode, fit the real area, render a
translucent fill and clear outline, expose provenance and failure states, and
support clear/re-search. Special non-area codes receive no invented polygon.
House numbers and buildings require separate permitted stable relations.
