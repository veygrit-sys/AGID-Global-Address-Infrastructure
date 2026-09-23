# Luxembourg Postal Context contract seed

This directory is the M1 metadata seed for a future Luxembourg postal-context
release. It contains no POST Luxembourg rows, CACLR rows, address points,
personal data, or production postcode geometry.

Authority remains split deliberately:

- POST Luxembourg publishes postal assignment/reference material.
- The Administration du cadastre et de la topographie (ACT) publishes CACLR
  address-reference data and BD-Adresses point geometry under CC0.
- Administrative, parcel and building geometry remains separate context.
- AGID may index and display a rights-cleared postcode surface, but never
  invent postal authority from point buffers, hulls, Voronoi cells, buildings,
  parcels, or administrative boundaries.

`L-NNNN` is stored as text so leading zeroes survive. PackUp, PO-box,
organization, route and other endpoint codes remain non-areal unless a source
expressly publishes valid postcode Polygon/MultiPolygon geometry. Synthetic
fixtures can test contracts but can never promote a real release.
