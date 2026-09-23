# Caribbean Netherlands Postal Context M2 review

## Technical summary - current authority says no postcode system is in force

Caribbean Netherlands (`BQ`) remains `blocked` at M1. The current Rijksdienst Caribisch Nederland (RCN) postal-service page says that no postcodes exist in Bonaire, Saba or Sint Eustatius. The Universal Postal Union (UPU) independently lists those islands among territories not requiring postal codes. A 2024 Dutch government consultation proposed a future `0000AA-0999ZZ` series, but the final consultation report identifies `0000BQ` as a workaround and `0100AA` only as the first combination that might be used. These proposal identifiers are not assignments. With no valid current postcode search key, there is no finite assignment denominator or real postal Polygon/MultiPolygon for M2.

## Scope, identity and country-specific M2 definition

The review covers ISO `BQ` while preserving Bonaire, Sint Eustatius and Saba as distinct island/public-body identities. It does not merge BQ with European Netherlands, Aruba, Curaçao, Sint Maarten or the former Netherlands Antilles. The target is `M2_current_caribbean_netherlands_postcode_assignment_and_area_visualization`.

M2 requires a current in-force release from a competent Dutch authority or designated operator with every assignment, alias, validity interval, correction, exception and explicit non-area object; exact bytes, SHA-256, edition, coverage and rights compatible with AGID processing, storage, derivation, redistribution and public serving. Every drawable code must reconcile to fixed real valid Polygon/MultiPolygon geometry with explicit official/derived/virtual class, source, reference date, CRS, topology, method, confidence and exceptions.

The immutable artifact must drive the real BQ API and app: normalize a real code; expose no-code/no-match, loading, multiple, API-failure and invalid-geometry states; fit and render a translucent fill with a clear outline only for eligible geometry; support clear and re-search; and show the selected code, geometry kind, class, source, reference date and confidence. P.O. Box, route, organization, Point and other non-area objects must show type and reason without a fabricated surface. Current absence is represented as `none`; it does not complete the area-visualization milestone.

## Current government and operator evidence

The exact current RCN postal-service page gives a postcode-free address layout: recipient; street and number or P.O. Box; optional locality or neighbourhood; island name; and Dutch Caribbean. It states, `NB In Caribisch Nederland bestaan geen postcodes.` ACM's current Caribbean Netherlands supervision page identifies Flamingo Express Dutch Caribbean (`FXDC`) as the concession holder it supervises. Neither page publishes a postcode assignment or geometry dataset.

The UPU May 2014 BES sheet preserves Bonaire, Saint Eustatius and Saba as the `BES` data-set identity and records designated-operator history. Its age means operator currency comes from the current ACM page, not from the 2014 sheet. The current 12-page UPU General Addressing Issues publication has an August 2026 list of territories requiring postal codes and a September 2025 no-postcode table. The latter explicitly lists Bonaire, Saint Eustatius and Saba; BQ is not promoted from the separate European-Netherlands entry.

## Consultation evidence - proposal is not a live assignment release

The RCN announcement of 17 July 2024 expressly begins from the absence of a postcode system and describes `0000AA-0999ZZ` as a proposal. The Internetconsultatie page now says the result is published; it does not say assignments entered into force. The final consultation report, version `1.0`, dated 17 December 2024, summarizes responses and implementation considerations rather than publishing assignments.

The report records `0000BQ` and variants as website workarounds. It says combinations `0000AA` through `0000ZZ` would not be used and that `0100AA` is only the first combination that might be used. It also links fine-grained implementation to a future Caribbean Netherlands address/building registration. Consequently, the range, workaround and possible first combination are rejected as input keys, denominators and geometry authorities.

## Rights, exact-source and geometry review

Eight exact RCN, ACM, Internetconsultatie and UPU bodies totaling 1,751,301 bytes were fixed outside Git with URL, length and SHA-256. No address, recipient, P.O.-Box holder, delivery observation, feature row, coordinate or geometry was queried or copied.

RCN applies CC0 1.0 to eligible website text while saying most images cannot be reused. This supports the reference-text review but does not create or license a future postcode assignment or geometry dataset. UPU documents remain reference evidence. No resource-specific compatible right was established for a complete BQ assignment-and-geometry artifact because that artifact does not exist.

No island, public-body or administrative Polygon was promoted. The existing Netherlands country pack contains three Caribbean public-body seeds, but those are administrative/gazetteer context and cannot become BQ postal authority. Localities, neighbourhoods, offices, routes, service areas, delivery points, addresses, buildings, parcels, Points, buffers, hulls, Voronoi/raster cells, models, AGID cells and proposal scenarios are likewise prohibited proxies.

## Reproducibility and PDF inspection

The offline inspector accepts only the eight expected filenames, byte lengths and SHA-256 values. It validates current RCN no-postcode/address markers, RCN text-rights semantics, the proposal wording and status, current ACM operator identity, all three PDF page counts and the relevant consultation/UPU page markers. Missing, renamed, extra, changed or semantically drifted inputs fail closed.

Poppler rendered the UPU BES sheet, the consultation report cover and physical page 6 proposal-analysis page, and UPU physical page 4 to non-empty RGB PNGs. Their SHA-256 values are respectively `55c2b740af1995685e1f7221b954720d002f0c5f1d07cc7e7a4ad9d9fb67bd9c`, `62747e0463d909ae54c4f7510eb67d8ab75c8f10e4572b0aedbbe7e622209933`, `dec871d7ebb83a4c3c963122c775555cd9a09802b484078310468de9ae30aeef`, and `16192d1a73cc7ff9734c124088b96e4a6c1145e3aa83078e58aa934d5cca3ec6`. Page dimensions, non-white bounds and extracted text passed. Web screenshot attempts timed out or missed cache for three pages, and the local image-view helper returned Windows error 206 even through a short mapped path; no image is committed. No chart was created because plotting zero current assignments or zero eligible geometry would imply a measurable postal-area dataset that does not exist.

## Application boundary and limitations

Shared deterministic tests cover normalization, no-match, Polygon/MultiPolygon-only drawing, loading, multiple candidates, API failure, invalid geometry, bounds fit, translucent fill, visible outline, Point/non-area handling, clear and re-search. They prove the shared fail-closed capability, not a real BQ route. With no valid BQ postcode input or eligible immutable area artifact, no BQ production API, map rendering or browser E2E is claimed.

- The current no-postcode statement controls; a consultation result is not an assignment release.
- `0000BQ`, `0000AA`, `0100AA` and the proposed range are invalid as current postal keys.
- CC0-eligible government text is not a substitute for resource-specific future data rights.
- An island or public-body Polygon is administrative context, not a postal area.
- BQ identity must remain separate from European Netherlands, Aruba, Curaçao and Sint Maarten.

## Recommended next step

Keep BQ blocked and continue to Brazil (`BR`). Re-check no earlier than `2026-09-07T13:36:23.702Z`, and only after the pending-country sweep, unless a competent Dutch authority, FXDC or UPU announces in-force assignments. Provider contact, registration, authentication, agreement, payment, protected-row access, new destination, publication or deployment requires explicit approval.

## Further questions

- Which authority will publish the first in-force assignments and complete denominator?
- Will assignments be per island, neighbourhood, street, delivery point or another postal object type?
- What licence will permit fixed derived artifacts, redistribution and public serving?
- Will an operator-authorized Polygon/MultiPolygon release accompany assignments, and which non-area objects will remain typed without surfaces?
