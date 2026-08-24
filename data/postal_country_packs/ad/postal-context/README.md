# Andorra Postal Context contract seed

This directory is the M1 metadata seed for the future `agid-postal-ad`
country repository. It contains no Correos product rows, La Poste records,
Govern d'Andorra address results, IDE Andorra features, real addresses, or
production geometry.

The evidence chain remains explicit:

- Correos or another current operator source supplies full-code allocation.
- UPU supplies `ADNNN` format, address placement, two-operator context, and
  parish-coding semantics, not a current allocation table.
- the Govern d'Andorra Urban Guide supplies official address-search context.
- IDE Andorra supplies parish, toponym, topographic, and building layers under
  dataset-specific conditions of use.
- AGID supplies spatial indexing and cell relations, never postal assignment.

The `AD` prefix is part of the canonical postcode. A parish-coded value does
not prove that every syntactically valid full code is allocated or that an
official full-code polygon equals the parish. Correos states that its licensed
postcode database covers Spain and Andorra, while polygon authority is accepted
for Andorra only when the product manifest and contract explicitly say so.

An exact building result requires a common authoritative address/building
identifier or a reviewed crosswalk. Urban Guide points, POIs, topographic
building shapes, containment, and nearest-footprint joins remain candidates.
Public artifacts exclude addressees, residents, owners, tenants, occupants,
contact data, credentials, cadastral rights, tax data, and protected registers.

Postal evidence is not a territorial claim. Country and border-feature
classification follows a separately pinned boundary authority, policy, and
vintage; routing, language, parish names, or proximity never assign AD country
or AGID identity outside that policy.

The fixtures are synthetic runtime conformance data and cannot promote a real
release. See `repository-manifest.json` and `source-profile.json` for gates.
