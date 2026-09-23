# Nepal (NP): federal-code review and M2 gate

Status: **M1_metadata / blocked**, not M2. Base commit:
`eabf1e9cdd4b744bf91e4005b79638d0984cd330`.
There was no NP manifest or M2 definition at that base; the new
`M2_federal_assignment_context` criterion is Nepal-specific.

## Observed sources, not assumed coverage

The [GPO public table](https://gpo.gov.np/pages/postal-code-1259614658/)
was acquired at `2026-08-28T21:19:00.693Z`: 2,355,195 bytes,
`sha256:5e2d72e065cb465a8750227b6bfa78f1916fa3c6c9b9d13ecbe81268f7c7c4a1`.
The bounded parser inspected 838 table rows: 753 local-unit rows and 84
non-assignment headings, plus the header. It found 753 distinct office codes,
seven province labels, 77 province/district keys, and 13 locality labels
repeated across different contexts. All rows passed structural checks.
751 ward counts use Devanagari digits. Explicit ranges sum arithmetically
to 6,743 candidates; **zero individual ward records were materialized**.
Counts do not independently establish national completeness or live validity.

The [Rasuwa notice](https://rasuwa.nepalpost.gov.np/content/20/a-new-postal-code-that-has-changed/)
links a 16-page federal code PDF. Its first page was visually reviewed for
separate office/ward columns. PDF creation metadata is 2025-05-16; the notice
date is preserved in Bikram Sambat. Complete PDF rows and HTML/PDF parity
were not validated. A separate Jhapa page failed direct acquisition.

The [UPU sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/nplEn.pdf)
is printed **06/2012**, while its PDF creation metadata is 2020. This historical
five-digit reference cannot override the federal table. The old Nepal Post
landing page embeds another PDF that exceeded the 4 MiB intake limit; it was
not downloaded by increasing the limit. No example address was imported.

## Rights and geometry

[Survey Department directive 2069](https://www.dos.gov.np/content/5/distritor--use-and-regulation-directory-2069/)
links an 18-page historical document. Pages 5 and 18 (printed 3 and 16) were
visually checked because legacy-font extraction is unreliable. Purpose-limited
use, restrictions on transferring source data, and a lawful attributed
value-added-product proviso are distinct. The organisation agreement is a
template, not an agreement accepted by this task. Current legal/product
applicability remains unverified; this is not a blanket open licence and must
not be assumed to govern the postal HTML table.

The [National Geoportal](https://nationalgeoportal.gov.np/) returned a 1,699-byte
viewer shell. No feature schema, geometry, postal crosswalk or layer licence
was validated. Public access to postal pages does not establish redistribution
rights. No paid product, login, contract, feature query or deployment occurred.

## Implemented boundary

- JSON/YAML format metadata accepts five or seven ASCII digits. Devanagari
  conversion is explicit in the intake helper; number coercion and mixed-script
  codes are rejected. A five-digit input remains scheme/edition-ambiguous.
- The parser preserves source-row position and raw script, treats headings
  separately, checks code uniqueness and ward prefix/start/count agreement,
  and refuses unexpected columns, layout, entities, encoding or MIME.
- Eleven country source profiles are metadata-only. Their exact IDs, URLs and
  aliases do not establish strong address validation.
- Legacy, federal local-unit, federal ward and administrative IDs have separate
  namespaces. The generic NP Postal Context runtime remains disabled.
- Postal assignment cannot prove a house number/building. Those require
  independent permitted explicit relations. Geography stays `none` without
  independently permitted source geometry and a postal crosswalk; administrative
  joins or model surfaces must be labelled `derived` or `virtual`.

## Reproduction and completion conditions

[Source receipts](../reports/postal-context-m2/np-source-review-2026-08-28.json)
bind all 11 requests: eight content-verified references/table observations,
one byte-observed viewer shell and two acquisition failures.
[Engineering checks](../reports/postal-context-m2/np-checks-2026-08-28.json)
record test commands, actual results, GitHub base proof and change audit.

```text
npm run verify:postal-context-nepal
node scripts/inspect-postal-context-np-sources.mjs --observations tmp/np-sources --report tmp/np-review.json
npm run inspect:postal-context-nepal -- --report tmp/np-live-review.json
```

Offline replay needs the original body/receipt files and verifies their bytes,
MIME, URLs, retrieval times and SHA-256 before parsing. Live drift requires a
new review. All downloaded bodies and temporary dependencies are removed after
verified publication of **code/reports only**; hashes cannot reconstruct them.

M2 still needs specific reuse/redistribution permission, a current source
edition and validity/coverage review, reproducible rights-cleared records,
an explicitly approved immutable data destination, re-download/hash checks and
actual AGID loader/API verification. Unknown validity stays null. Geometry or
civic/building expansion has its own source and permission gates.
No new repository or public data destination was created and no raw national
table, recipient, customer, owner, occupant or land-rights record is in AGID Git.

Public-source review is due after all pending countries and
`2026-09-04T21:30:32.413Z`. That date authorizes neither contract acceptance nor
publication. The next country is selected from the ledger; this run changes NP only.

## Broader regression baseline

The all-region metadata expansion found three pre-existing failures: duplicate
source-list storage first encountered in KM, missing EH/HM YAML counterparts,
and invalid BY YAML indentation. All three reproduce against 574 byte-verified
address-format files exported from the base commit, with matching failure
signatures. Those other-country files and tests are unchanged. The final
passing scoped run excludes these three test files; the full failing run and
base reproduction are recorded separately, not counted as a clean full suite.
NP itself keeps source IDs only at the canonical top level in both JSON/YAML.
