# Iraq M2 source review - 2026-08-28

## Result and criterion

**IQ remains M1_metadata / blocked, not M2 complete.** The starting manifest
had no named M2 stage. `M2_licensed_assignment` now formalizes its existing
five-digit, non-area, transition, jurisdiction, privacy and independent
geometry/building gates without changing any of the nine hard blockers.

It requires a current rights-cleared Iraq Post assignment release, complete
for its declared source and jurisdiction scope, immutable published data,
reproducible full-data checks and the actual AGID loader/API. Scoped coverage
must be labelled; it is not universal or national coverage. Any geometry,
civic-address or building relation has independent authority, rights and
lineage. IQ does not change boundaries or assert sovereignty.

## Current evidence

The source receipt is `reports/postal-context-m2/iq-source-review-2026-08-28.json`.
It records retrieval times, exact URLs, HTTP results, byte lengths, SHA-256,
reference editions and parser diagnostics. The engineering receipt is
`reports/postal-context-m2/iq-checks-2026-08-28.json`.

| Source | Observation | What it does not establish |
| --- | --- | --- |
| [Iraq Post](https://post.iq/) | Homepage returned 403 from this host | Current assignments or permission to bypass access controls |
| [App privacy policy](https://app.post.iq/pages/privacypolicy.html) | Policy dated 2025-05-25 verified | Public reuse of app accounts, addresses, identity or location |
| [UPU sheet](https://www.upu.int/UPU/media/upu/PostalEntitiesFiles/addressingUnit/irqEn.pdf) | One page, visually checked; 03/2005 edition and five-digit component diagram | Current release, postal area boundaries, reusable example addresses |
| [Archived announcement](https://govinfo.library.unt.edu/cpa-iraq/pressreleases/20040524_postal.html) | Body date 2004-05-25 verified | Current validity; URL date is not the document date |
| [NOGP API](https://nogp.gov.iq/ApiDocs.aspx) | Read-only, no key; CC BY 4.0 with attribution and file-specific terms | A current rights-cleared postal assignment snapshot |
| [IGP linked service](https://igp.ur.gov.iq/View.aspx?i=19488d40-7740-479f-8ee1-1a7e753f0bd8) | Government page links a public office/communications Web Map | A code-to-area assignment, a current release or reuse rights |
| [COSIT](https://cosit.gov.iq/) | Statistical portal reference retrieved | Postal assignment authority or delivery coverage |

The [NOGP policy page](https://nogp.gov.iq/POLICIES.aspx) describes conditional
reuse with privacy and information-security limits. Its detailed attachments
were not reviewed because no postal resource was selected; their review is
required before clearing an exact resource. The independently retrieved API
documentation requires checking a file's own licence document where present.
No blanket rights-denied finding is made.

NOGP discovery reported **41 datasets, 88 resources, 17 organizations and 7
categories**. These are portal totals, not postal coverage. Three bounded
searches (`postal`, `postcode`, `البريد`, page size 5) returned zero matching
datasets. No next links or downloads were followed; this is not a full catalogue
scan and does not prove absence of data elsewhere or under other terminology.

ArcGIS item metadata was checked without fetching item data, resources,
features or layers:

- StoryMap `71daa78e94c94969a080c6aecace4f57`: public, owner matches the prior
  `fatima_atlasgis` reference; last modified 2025-07-03.
- Government-linked Web Map `96035b9a8a5449358618c3353097be1d`: public,
  owner `salallaq`, last modified 2019-05-01.

Both have null licence and access-information fields. Public visibility,
government linkage, StoryMap publication and item modification time do not
establish Iraq Post deployment, assignment validity or exact reuse authority.
The existing zone-sector migration candidate remains separate and rejected by
the current five-digit parser. No geometry was generated.

## Quality, transport and reproduction

Intended assignment grain is source edition / jurisdiction / postal object /
validity, not postcode alone. The code stays a five-digit string with leading
zeroes preserved. Object types and delivery categories cannot be collapsed
into one polygon. For real input, missingness, validity, composite-key
duplicates, coverage and source-to-output reconciliation must be measured.

This review acquired **zero current assignment rows**. Assignment missing-code,
duplicate and invalid-code rates are **null / unmeasured**, not zero-percent
errors. There is no real conversion, retained data snapshot, published fixed
data artifact or verified real AGID pack. Contract and synthetic tests only
verify guard behavior. Neither postcode nor containment/nearest-building
logic supplies street numbers or explicit civic/building identity.

On this host Node failed NOGP certificate-chain verification
(`UNABLE_TO_VERIFY_LEAF_SIGNATURE`), including with the system-CA option.
Windows/.NET default certificate validation succeeded. The optional IQ-only
adapter uses this normal trust path: it disables neither TLS verification nor
host checks, follows no redirects automatically and uses no cookies or
credentials. Responses are bounded to 2 MiB. API-advertised HTTP links are
never followed; requests use explicitly allowlisted HTTPS URLs only.

```sh
node scripts/inspect-postal-context-iq-sources.mjs --windows-tls --report tmp/iq-new-review.json
npm run verify:postal-context-iraq
npm run verify:postal-context-runtime
npm run verify:postal-context-m2
```

Omit `--windows-tls` on other hosts with a valid Node trust chain. Do not
disable TLS validation. The report command refuses to overwrite a file. This
host's user npm launcher is broken; the equivalent package script targets
were executed via the installed `tsx` entrypoint, and the working system npm
CLI installed only cached locked dependencies offline. The lockfile is unchanged.

The source catalogue now keeps Iraq Post operator authority distinct from
validation readiness: a metadata-only name/URL cannot validate an address.
NOGP retains bulk-open-data availability because its public API is verified;
dated notes distinguish generic catalogue access from postal data readiness.
No other country's catalogue entries, identities or ledger records are changed.

## Unblock and next review

Obtain a lawful current Iraq Post assignment release and exact written/reusable
terms, source edition, declared jurisdiction/coverage, postal-object types,
validity, transition status, schema and source/terms digests. Preserve non-area
objects. Review all applicable file licences and detailed policy attachments,
run full-input validation and reproducible conversion, obtain approval for a
fixed data publication destination outside AGID Git, and verify its actual
AGID loader/API. Geometry and civic/building links require independent proofs.

The ledger schedules another public-reference review seven days after this
receipt, after all pending countries. That date does not authorize restricted
access, contracts or publication. No new repositories, Spaces, datasets,
paid compute/inference, production deploy or main merge were performed.
Next pending country is **IR (Iran)**; it was not started in this run.
