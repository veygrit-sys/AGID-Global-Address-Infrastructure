# AddressQL official postal multi-country sync v1

## Capability

`npm run sync:addressql-official-postal-data` retrieves selected fields from
reusable official sources and writes postcode-only AddressQL runtime adapters.
The sync currently covers these source groups:

| Source | Emitted scopes | Evidence boundary |
| --- | --- | --- |
| La Poste Base officielle des codes postaux | FR, GP, MQ, GF, RE, PM, YT, BL, MF, WF, PF, NC, MC | Ordinary commune-linked postcodes; no CEDEX or delivery-point claim |
| swisstopo official directory of towns and cities | CH, LI | Domicile-address postcodes; special and internal codes excluded |
| Posti Postal Code Data File | FI, AX | Current public postcodes; Aland is available at postcode level |
| Dataforsyningen `postnumre` API | DK | Registered postal geographies; special non-geographic codes excluded |
| ONS Postcode Directory latest field-limited API | GB, IM, JE, GG | Live postcodes only; coordinates are not requested; BT is excluded because Northern Ireland commercial reuse requires a separate licence |

The existing Japan Post sync remains available as:

```bash
npm run sync:addressql-public-postal-data
```

Together, the two commands prepare 23 country or territory scopes.

## Run

```bash
npm run sync:addressql-official-postal-data
```

Limit a run to one or more source groups:

```bash
npm run sync:addressql-official-postal-data -- --sources posti,swisstopo
```

The ONS adapter requests only `PCDS` and `DOTERM` with
`returnGeometry=false`. It verifies the live-row count and checks that the
mutable latest layer did not change during pagination. Northern Ireland `BT`
rows are counted for the exclusion audit but are not retained or emitted.

The default output is `.agid-runtime/addressql/official-postal`. It contains:

- one postcode-only file per country scope;
- an aggregate-only synthetic holdout report per scope;
- a source ledger with version, rights, coverage, attribution, update policy,
  correction route, and SHA-256 snapshot digest;
- one merged conformance runtime configuration;
- an empty trust store.

Raw API responses and archives are held only in memory and are not persisted.
The derived artifacts contain no addresses, recipients, place names, or
coordinates.

## Activation boundary

Successful sync means `data-ready`, not production-approved. The generated
adapters remain in `conformance` mode. Positive membership can be exercised
only with explicit conformance opt-in. Production `approved` mode requires:

1. an independently controlled Ed25519 reviewer key;
2. canonical adapter attestation signatures;
3. two-reviewer release quorum;
4. a monotonic signed release-ledger entry.

Partial sources return `unknown` for a set miss. They never issue an official
negative claim outside the documented coverage boundary. Postcode membership
does not prove a building, recipient, route, or delivery point.

## Scope policy

The FR adapter is an inclusive parent scope for non-Monaco rows. Explicit
French territory adapters are emitted as neutral shipping aliases for systems
that use ISO territory codes. Monaco remains separate. FI similarly includes
Aland while AX is emitted as an explicit shipping alias. This duplication is
intentional and is recorded in every scope ledger.
