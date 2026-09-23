# Open-Source Compatibility Contract

AGID keeps the open-source parts compatible by treating each public layer as a
contract boundary, not as an implementation detail.

The compatibility contract covers:

- AGID/AOID public standards and SDK test vectors
- Local Resolver, address display, language tabs, and basic validation
- Address Registration and AGID Address Element
- Basic POS terminal, QR/NFC intake, offline queue, and signed receipt
- Address Portal consent, revoke, delete, and export controls
- Privacy/security release gates and no-raw-address tests
- ZK-ready public signal, nullifier, and proof-bundle schemas
- OpenAPI, SDK fixtures, and public developer docs

## Rules

1. OSS modules communicate through stable schemas, redacted events, fixtures,
   and test vectors.
2. OSS core must not import commercial managed services, hosted registries,
   managed ZK provers, payment settlement, or enterprise dashboards.
3. Mode 0 Local Only must remain usable with AGID codecs, Local Resolver,
   Address Element, Portal controls, basic POS, and privacy gates.
4. Every compatibility edge is redacted by default.
5. No raw address, raw AOID, AGID-S payload, proof code, recipient secret, or
   private key is required for OSS interoperability.

## Verification

Run:

```bash
npm run verify:oss-compatibility
```

The command validates:

- all open-source source-boundary entries are represented as compatibility
  components;
- every OSS contract has stable artifacts, release gates, adapter rules, and a
  private-data boundary;
- the compatibility chain exists from AGID codecs to Local Resolver, Address
  Element, POS, Portal, and ZK-ready proof schemas;
- no OSS compatibility contract crosses into commercial paths.

The source of truth is:

- `src/lib/openSourceCompatibility.ts`
- `src/lib/sourceBoundary.ts`
- `src/lib/addressSurfaceCompatibility.ts`
- `src/lib/openCoreProductStrategy.ts`
