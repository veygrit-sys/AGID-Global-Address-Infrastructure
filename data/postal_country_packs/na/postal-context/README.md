# Namibia Postal Context contract seed

This directory contains metadata and synthetic conformance fixtures for the
planned external `agid-postal-na` repository. It contains no NamPost rows,
real addresses, personal data, cadastral records or production geometry.

NamPost Phase 1 five-digit codes describe sorting and delivery infrastructure.
NamPost explicitly states that they do not cover administrative or geographic
areas, so a full code has `geometry: none` by default. Region, constituency,
parcel, civic-address point, building and AGID evidence remain separate.

Before any production release, review the source-specific terms, pin every
artifact and observation, remove personal fields, preserve ODbL separation,
and pass the promotion gates in `source-profile.json`.
