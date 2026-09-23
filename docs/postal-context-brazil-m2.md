# Brazil Postal Context M2 review

Reviewed: 2026-08-31T14:18:56.294Z

Decision: **blocked / M2 unmet**
Target: `M2_current_correios_cep_assignment_and_area_visualization`

## Outcome

Brazil has a current eight-digit CEP system and a clearly identified official operator. That is not enough for M2. Correios advertises DNE as its complete official and exclusive nationwide address/CEP database, with current 2026 schedule entry V.26082 on 31 August 2026. The same page requires formal request, contractual conditions, a use commitment, payment and licensed-use restrictions. The complete release was therefore not acquired.

The Correios Busca CEP API is also not an open bulk source. Manual v1.0 states that it is for commercial-contract customers and requires a Brazilian corporate account, service 86738 and Bearer-token authentication. The public Busca CEP 1.5.8 interface is CAPTCHA-protected and is neither a fixed denominator nor a redistribution grant. No contract, registration, payment, credential, endpoint query or scraping was attempted.

The UPU Brazil sheet confirms `NNNNN-NNN` display and eight-digit normalization, but it also demonstrates why a CEP must remain a typed postal object: ordinary delivery, P.O. box, community mailbox and big-mailer/special codes are not interchangeable area features. UPU reference semantics do not supply current assignments or geometry rights.

## Area and app gate

No official, derived or virtual rights-cleared BR CEP Polygon/MultiPolygon artifact was found or acquired. DNE is advertised in TXT/MDB form and the official API documents address, locality, number-range and object attributes without geometry. IBGE CNEFE points or CEP aggregates, municipality/district/neighbourhood/census boundaries, roads, address ranges, buildings, buffers, hulls, Voronoi/raster cells, models and AGID cells are not Correios postal areas and were not promoted.

Consequently the real BR application path is deliberately disabled. There is no eligible BR postal geometry for the API to return, fit or draw with a translucent fill and clear outline. Loading, no-match, multiple, API-failure, invalid-geometry, clear and re-search behavior exists in the shared app capability, but shared code and synthetic fixtures are not BR M2 evidence. Browser E2E was not run because doing so would test only shared/synthetic behavior rather than an approved real BR artifact.

## Fixed evidence

Four official bodies were downloaded to an isolated temporary directory, checked byte-for-byte and by SHA-256, and excluded from Git:

| Source | Edition | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| [Correios DNE product/licensing page](https://www.correios.com.br/enviar/marketing-direto) | schedule through V.26082 / 2026-08-31 | 139182 | `d6c5a8305a5029f4a499fd69f4a59f47a7df8c0544755361ad21a781e0e629d5` |
| [Correios API Busca CEP manual](https://www.correios.com.br/atendimento/developers/manuais/manual-api-busca-cep) | v1.0 / 2025-10-01 | 151929 | `c6b0c5803dc5facdb08074730b8067798d035ff855f8dec8696df877d9d04007` |
| [Correios public Busca CEP](https://buscacepinter.correios.com.br/app/faixa_cep_uf_localidade/index.php) | 1.5.8 | 63519 | `3a9b8d7ec171c52311f5477e8ff2564bacb8c8acd3e379139b305b2f8ed51be7` |
| [UPU Brazil addressing sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/braEn.pdf) | 03/2012 sheet; PDF produced 2023-06-30 | 157861 | `db74529856993bc48d5eb44c3b430330b18bcfcb8fc53df2ff0c8bd7e2fd5c1c` |

The PDF has two A4 pages. Both pages rendered at 993 × 1404 pixels; six text markers, page count, non-white bounds and render SHA-256 values were validated with no detected clipping or blank-page failure.

## Unblock condition and next review

Explicit approval is required before any Correios contact, registration, contract, term acceptance, payment or authenticated API/DNE use. If authorized, obtain a current complete version-pinned denominator with written rights for AGID processing, storage, derivation, redistribution and public serving. Separately produce a fixed, reproducible and rights-cleared Polygon/MultiPolygon artifact only for area-capable CEP objects; retain streets/ranges, buildings, large users, Correios units, lockers, P.O. boxes, community mailboxes and organizations as non-area objects unless authoritative area geometry exists. Reconcile complete coverage and pass topology, normalization, API, UI and real-app rendering checks.

Do not recheck before `2026-09-07T14:18:56.294Z`, and then only after the pending-country sweep or if Correios publishes a new open fixed geometry release with compatible rights.
