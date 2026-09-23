# Mozambique Postal Context runtime

Mozambique is modeled as a current eight-digit CEP system with explicit migration, authority and geometry boundaries.

## Current code

Decreto n.º 74/2024 defines eight digits separated into `NNNNN-NNN`. It covers territorial and urban variants and a capital-city specificity. The normalizer accepts eight digits with optional spacing or one grouping hyphen and emits the canonical 5-3 form.

The old Correios four-digit directory and the six-digit `NNNN-NN` structure introduced by Decreto n.º 28/2019 are legacy evidence only. The 2024 decree revoked the 2019 decree. AGID never pads or truncates these values into a current code.

## Authority transition

INCM is the postal regulator under Postal Law n.º 1/2016. Correios de Moçambique E.P. was extinguished in 2021. CORRE – Correio Expresso de Moçambique received the universal postal operator licence in 2024, while other licensed operators remain independent network actors.

Therefore:

- INCM law/table evidence controls current CEP structure and assignments;
- CORRE evidence controls its current universal-service observations;
- licensed-operator facilities do not define CEP boundaries;
- the extinguished Correios directory is historical context only.

## Geometry

The current numeric hierarchy does not itself publish canonical full-code boundary coordinates. Production geometry defaults to `none`.

A version-aligned official administrative or urban boundary can become an `official-derived` candidate only when the code table and geometry share exact identifiers, editions, CRS and validity. Buffers, office points, Voronoi surfaces, interpolation, learned models and AGID unions remain noncanonical.

## Address and building

CEP context can resolve province, urban/non-urban zone, district/city/town, administrative/municipal post, locality or bairro when source-linked. Street, house number, entrance, unit and recipient require separate evidence.

The 2019-2022 pilot reports describe georeferenced doors in limited places, but do not grant a current redistributable national address/building database. Exact building output requires a rights-cleared civic-address point and an explicit address-to-building relation.

## Hosting and privacy

Only digest-pinned, rights-cleared, minimized, non-personal artifacts may be public on Cloudflare or Hugging Face. Land-right, recipient, resident, occupant, owner, correspondence and query data remain excluded or controlled. This rule applies even while the standalone personal-data bill is still completing the legislative process.
