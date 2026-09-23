# Uzbekistan Postal Context

This directory is the AGID metadata and provenance contract for a future
independent `agid-postal-uz` country-data repository. It contains no current
UzPost raw response, address corpus or production geometry.

## Current gate

The explicit target is `M2_current_operator_postal_area_visualization`.
Current official operator bytes show that UzPost can search a six-digit index,
retrieve a response-specific ring, render a translucent polygon and fit its
map. That operator behavior is evidence, not a redistribution licence or a
complete immutable country artifact.

UZ remains `M1_metadata` and M2-blocked because:

- written bulk, derivative, persistence, redistribution and public API rights
  for the live polygon responses were not verified;
- only postcode `100000` was sampled from 1,593 office indices;
- two office-list longitude values are malformed;
- the polygon semantics, CRS, release/version and national completeness are
  not declared;
- no approved immutable artifact, UZ real-data runtime/API response or AGID
  app end-to-end visualization exists.

Never manufacture missing areas from office points, administrative borders,
buffers, Voronoi cells or models. House numbers and buildings require a
separate explicit, permitted and stable address-to-building relation. Keep
postal authority, geometry authority, derivation, time, confidence and AGID
crosswalks independent.
