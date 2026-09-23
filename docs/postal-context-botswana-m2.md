# Botswana Postal Context M2 review

Observed at 2026-09-02T22:16:31.130Z on the cumulative rollout branch.

## Decision

BW is excluded from current postcode-data creation and remains `blocked`, not M2. The UPU Universal DataBase September 2025 no-postcode list, in the file updated 20 August 2026, includes Botswana. The UPU Botswana address sheet dated September 2004 shows P.O. Box and private-bag deliveries followed by locality and country without a postcode. The current BotswanaPost page likewise publishes `P.O.Box 100, Gaborone` without a postcode.

The repository's previous `AA NNN` claim was unsupported and has been replaced with `None`. P.O. boxes, private bags, plots, streets, districts, wards, villages, localities, Points, buffers, buildings and AGID cells must not be promoted to postcode or postal-area geometry.

## Sources, rights and exact-body verification

Five official response bodies were retained only in a dedicated temporary directory for inspection: the BotswanaPost current page, Botswana Government communications-ministry page, UPU Botswana sheet, UPU general addressing document and UPU copyright page. Every body is fixed by URL, retrieval result, byte length and SHA-256 in the country report and executable inspector. The bodies are not committed.

BotswanaPost displays a 2026 copyright notice and no dataset licence. UPU copyright/database terms do not provide open redistribution rights. Web access is treated only as reference evidence.

## Address Context and AGID boundary

The corrected metadata separates recipient, plot number, street or physical address, P.O.-box-or-private-bag object and locality. Search results can expose detailed, source-qualified civic context and an independent AGID identifier without pretending either is a postcode. Building display still requires a separately authorized address-to-building relation.

## M2 gate

M2 would require a future competent-authority postcode release, complete assignments and exceptions, compatible processing and redistribution rights, fixed source and transformed artifacts, real Polygon/MultiPolygon records, and verified BW API/app lookup with map fit, translucent fill, clear outline and required metadata/error states. None exists in the reviewed sources. Retry after 2026-12-02T22:16:31.130Z, following the pending-country pass, or earlier only after an official system announcement.
