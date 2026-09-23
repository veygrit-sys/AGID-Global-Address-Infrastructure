# Monaco Postal Context country-pack seed

This directory is the AGID-side contract seed for the planned `agid-postal-mc` repository. It contains no upstream address rows, personal data, production geometry or claim that a synthetic fixture is deliverable.

## Current M2 audit

The 2026-08-08 Open-Licence La Poste base contains one Monaco row, `98000 MONACO`, but its geocode and geometry are blank and the official catalogue says postcode contours are not supplied. La Poste Monaco's current pages display `98020 MONACO CEDEX` as an operator-address example, not a complete allocation denominator. The reviewed 2021 BAN-derived hull GeoJSON contains 6,158 features and zero `98xxx` features.

Therefore Monaco remains `M1_metadata` and blocked under `M2_current_monaco_postcode_area_visualization`. No Principality/commune, quartier, urban-plan, address, building, road, endpoint, buffer, hull, Voronoi/raster or synthetic geometry may be promoted as a postcode area. See `docs/postal-context-monaco-m2.md`.

## Evidence layers

1. La Poste's official base supplies current ordinary assignment evidence for the Monaco rows it publishes, not postcode contours or a complete CEDEX/special-routing directory.
2. La Poste Monaco publications supply current operator examples. They are not a reusable allocation database or postal geometry.
3. Government and DPUM material proves official address/building/GIS systems exist, but no public licensed bulk release with postal membership was found.
4. Official urban-planning and IMSEE material remains regulatory/statistical context only.
5. AGID supplies a spatial index and cover relation, never source identity.

## Postcode and authority semantics

The structural form is five digits beginning with `980`. Structural validity never proves current allocation. Ordinary, CEDEX, organization, service, PO-box and historical classes remain explicit. Non-areal routing endpoints do not acquire residential polygons. Monaco remains separate from France even when one La Poste dataset distributes both scopes.

An exact building result requires an official shared identifier or reviewed crosswalk. Address points, containment, nearest footprints and plan overlays remain candidates. Resident, occupant, owner, apartment, recipient and non-public unit details never enter public artifacts.

## Maturity

The current stage is `M1_metadata`. Fixtures are synthetic conformance inputs. M2 requires a current complete rights-cleared ordinary-plus-exception denominator, real eligible Polygon/MultiPolygon surfaces, an approved immutable artifact and the verified real MC API/application area path.
