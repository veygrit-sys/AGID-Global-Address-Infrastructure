# Vietnam Postal Context

This directory is the AGID metadata and provenance contract for a future
independent `agid-postal-vn` country-data repository. It contains no current
Decision annex, national-portal rows, real addresses or production geometry.

## Current gate

The explicit target is `M2_current_five_digit_postal_area_visualization`.
Current official notices support five-digit assignments under the two-tier
administration, but the exact current annex and a reusable postal-area release
were not resolved. The official portal shell is text-search-only; its legal
page lists the 2017 decision and its linked directory advertises a 2018
Last-Modified date. Official sources also conflict on the Decision 2334 date.

VN remains `M1_metadata` and M2-blocked because:

- zero current assignment rows and zero postal polygons were validated;
- no current complete Polygon/MultiPolygon release, CRS, topology or edition
  was published and pinned;
- website attribution does not grant bulk, derivative, redistribution,
  persistence or public API rights;
- no approved immutable artifact, VN real-data runtime/API response or AGID
  app end-to-end visualization exists.

Never manufacture areas from administrative borders, office or Vpostcode
points, buffers, Voronoi cells or models. House numbers and buildings require
a separate explicit, permitted and stable address-to-building relation. Keep
postal authority, geometry authority, derivation, time, confidence and AGID
crosswalks independent.
