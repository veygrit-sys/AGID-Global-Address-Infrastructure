# Niger Postal Context contract seed

This directory contains metadata and synthetic conformance fixtures for the
planned external `agid-postal-ne` repository. It contains no Niger Poste rows,
real addresses, personal data, land records or production geometry.

Niger Poste publishes four-digit code-to-locality and region rows. The dated
UPU method describes the first digit as region and the remaining digits as post
office. Neither source publishes coordinates or postcode boundaries, so a full
code has `geometry: none` until separately authorized boundary evidence exists.
Administrative, office, land, civic-address, building and AGID evidence remain
separate.

Before production, review source-specific terms, pin every observation, remove
personal fields, preserve ODbL separation and pass the promotion gates in
`source-profile.json`.
