# Sri Lanka Postal Context contract

M1 metadata only. No Sri Lanka repository, Dataset, Space, production pack or deployment was created.

The implementation keeps **postal assignment → independent geometry → address context** separate.
Sri Lanka Post describes five-digit codes; preserve leading zeros and original Sinhala, Tamil and English names.
An initial HTML post-office selector is not a versioned national assignment release.
GN, DS, district, province and census identifiers are administrative, not postal.

- `repository-manifest.json`: LK-specific real-data M2 criterion, namespaces, exception and release gates.
- `source-profile.json`: provenance, source scope, privacy exclusions and display boundaries.
- `m2-source-review.json`: reviewed response/section/option digests and bounded public GET targets.

From the AGID repository root:

```text
npm run verify:postal-context-sri-lanka
node scripts/inspect-postal-context-lk-sources.mjs --report <new-report>.json
node scripts/inspect-postal-context-lk-sources.mjs --report <new-report>.json --curl <native-curl-executable>
npm run postal-context:m2:status
```

Only initial reference HTML and administrative metadata are inspected. No form POST, feature query,
account, directory purchase, contract acceptance or personal record lookup occurs.
Checks emit aggregate counts/digests, not source option rows or feature values; unknown rights stay unknown.
Synthetic parser tests are engineering evidence, never M2 data.

LK remains disabled in the generic Postal Context runtime. Existing address form fields and five-digit
syntax are preserved; the legacy lookup-URL field points to the public HTML search, explicitly
not a machine API. The lookup is registered as a metadata-only source. No civic number or building is inferred from a postcode or AGID cell.

See [the source review](../../../../docs/postal-context-sri-lanka-m2.md) and
[the rollout ledger](../../../../docs/postal-context-m2-rollout.json).
