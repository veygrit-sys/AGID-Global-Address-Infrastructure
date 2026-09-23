# Mauritius Postal Context contract seed

This directory contains metadata and synthetic conformance fixtures for the
planned external `agid-postal-mu` repository. It contains no copied postcode
rows, real addresses, personal data, cadastral records or production geometry.

Mauritius Post provides a current postcode finder, while Open Data Mauritius
publishes separate CC BY-SA 4.0 tables for the main island, Rodrigues and
Agalega. The reviewed format is five digits on the main island, `R` plus four
digits for Rodrigues, and `A` plus four digits for Agalega.

Those assignment tables do not publish canonical postcode boundary
coordinates. A full code therefore has `geometry: none` until separately
authorized boundary evidence exists. Postal assignments, statistical and
administrative areas, post-office points, cadastral data, civic addresses,
buildings and AGID remain separate evidence partitions.
