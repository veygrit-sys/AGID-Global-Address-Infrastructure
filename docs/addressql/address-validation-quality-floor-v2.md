# Address Validation 80-Point Quality Floor

`address-validation-quality-floor-v2` turns the repository's existing
readiness contracts into one executable scorecard. It evaluates ten
engineering dimensions using five equally weighted criteria per dimension.
Every engineering dimension must score at least 80/100.

Run:

```bash
npm run verify:address-validation-quality-floor
```

The engineering dimensions are:

1. API, SDK, SQL, and portable runtime
2. country and territory format coverage
3. security and privacy boundaries
4. postal format and source-gated lookup
5. multilingual normalization safety
6. official and OSS source governance
7. official postal verification pipeline
8. privacy-preserving L4/L5 delivery reachability and signed carrier conflicts
9. freshness and correction operations
10. key lifecycle, quorum signatures, and rollback protection

The report deliberately separates engineering quality from deployment
evidence. Parser, signature verification, aggregate holdout, reachability,
expiry, and correction paths can be tested locally. They do not prove that a
country has an approved live source, an independently controlled signing key,
carrier evidence, or measured correction SLA.

The P2 engineering gate includes the offline postal-operations CLI, dynamic
runtime-adapter expiry, aggregate receipt-to-publication SLA, and automatic
country promotion or demotion recommendations. This can raise engineering
freshness operations to 100/100 while live scheduling and independently
signed operational reports remain deployment evidence.

`engineeringQualityFloorPassed` may therefore be true while
`productionEvidenceReady` remains false. Production evidence can cross the
same 80-point threshold only after the relevant country promotion records
contain approved runtime adapters and independently signed aggregate reports.

The scorecard consumes synthetic and aggregate evidence only. It does not
accept raw addresses, recipient data, precise coordinates, query logs,
production credentials, or secrets.
