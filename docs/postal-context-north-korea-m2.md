# KP Postal Context M2 review — 2026-08-28

KP remains **M0_inventory / blocked**, not M2. This review adds a country-specific
promotion contract and removes an unsupported fixed postal-code format. It does
not create a repository, data release, postal polygon, address or building.
KP and KR remain separate; no KR data or territory is imported into KP.

## What the captured sources establish

- [UPU General Addressing Issues](https://www.upu.int/UPU/media/upu/documents/PostCode/General-Addressing-Issues.pdf):
  631,050 bytes, 12 physical pages, SHA-256
  `ec92fcc050958bafff17e984555b66618a263c50ffa2286d41a8d47c92d8a94d`.
  Physical pages 1, 2 and 4 were visually reviewed. KP is in the **Sep. 2025**
  not-required table on page 4. The different required-code table on page 2 is
  **Aug. 2026**. HTTP last-modified 20 August 2026 does not upgrade the KP table.
  The reference groups absent systems and systems not used; it does not prove
  permanent absence of all internal identifiers, current assignments or delivery.
- [UPU member entry](https://www.upu.int/en/universal-postal-union/about-upu/member-countries?cid=90&csid=-1):
  the actual country-detail section identifies KP independently of KR. It is
  identity evidence, not an operator API, postal dataset or territorial boundary.
- [UPU Copyright](https://www.upu.int/en/Copyright): website/document provisions
  reserve rights and describe permission and organization-limited uses. Public
  access is not an open redistribution grant for an exact KP dataset. No such
  rights-cleared artifact was obtained; no blanket ban on reference access is inferred.
- [UPU Addressing Solutions](https://www.upu.int/en/postal-solutions/programmes-services/addressing-solutions):
  the portal links the PDF and licence documents (2026.1), including contract,
  confidentiality and rates material. Discovery is not contract acceptance or
  purchased access. The portal description still says December 2025 while the
  listed file date is August 2026; actual document sections control the review.

The [source receipt](../reports/postal-context-m2/kp-source-review-2026-08-28.json)
pins successful public GETs, exact response hashes, content checks and timestamps.
Initial Node HTML requests returned 500; a bounded retry using Windows native TLS
returned 200 for all four references. TLS verification was never disabled.
HTML digests identify individual responses, not immutable national data editions;
dynamic page bytes can change. A PDF digest change requires a new page review.
No raw HTML/PDF or source row is committed. The public-only inspector is reproducible:

```sh
node scripts/inspect-postal-context-kp-sources.mjs --report NEW_REPORT.json
# Windows native TLS, if needed:
node scripts/inspect-postal-context-kp-sources.mjs --report NEW_REPORT.json --curl C:/Windows/System32/curl.exe
```

## Safe AGID integration now

KP JSON/YAML now use null postal format/regex and an empty optional placeholder.
The former `NNN-NNN` and `123-456` had no verified KP source. Native/English field
orders, names, manual input, administrative identity and all other country files
are preserved. Syntax validation returns unknown for KP instead of endorsing the
old pattern. The segmented input control is disabled; optional free text remains.
The existing global-preload `no_postal_code` category is an operational fallback
for missing syntax, not evidence of permanent national absence.

The existing all-profile input test exposed a pre-existing unsafe fallback: when
both format and regex parsing failed, descriptive text could still become a
segmented pattern. The shared control now checks safety again before returning
that fallback. A regression test covers descriptions, oversized patterns and a
safe regex fallback. No other country metadata is changed.

KP stays outside the production Postal Context country policy; no real-data
loader or route is enabled. Legacy planning-pack counts and the existing
13 first-order P0 seed definitions are unchanged and are **not** M2 postal data.
They cannot establish postal boundaries, current coverage or address/building links.

## What must happen before M2

The [KP contract](../data/postal_country_packs/kp/postal-context/repository-manifest.json)
requires a current postal-framework review and a rights-cleared, explicitly scoped
real administrative/locality release with independently licensed point/area
geometry, stable identities, native names, dates, versions and hashes. Preserve
nullable postal codes and `none` for unverified official postal geometry; separate
administrative, derived and virtual objects and their typed AGID crosswalks.

Reproducible transformation, full declared-scope validation, CRS/topology checks,
civic-address/building availability and privacy/licence review, approved immutable
data publication, remote hash verification and the actual AGID loader/API are all
still required. Display house/building details only from explicit independently
permitted relations; never infer them from a region, seed or nearby point.

Zero real assignment rows were validated **in this review**; national missing-code
and duplicate-assignment rates are unknown (`null`), not zero. This bounded search
does not prove no eligible data exists anywhere. Retry public references only
after all pending countries and the ledger's seven-day review date. Accounts,
contracts, private queries, paid jobs, new datasets/Spaces/public destinations and
production deployment require explicit authorization. No extra HF cost was incurred.

Engineering tests demonstrate fail-closed behaviour and compatibility, not M2 data.
See the [engineering receipt](../reports/postal-context-m2/kp-checks-2026-08-28.json).
The next pending country is **KR**, for a separate heartbeat.
