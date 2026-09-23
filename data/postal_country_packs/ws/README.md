# agid-postal-pack-ws

Version: agid-postal-country-pack-v0.1
Country: Samoa (WS)
Generated at: 2026-06-20T00:00:00.000Z
Official status: draft

This is an AGID Postal Country Pack for AGID Postal Forge. It contains
AGID-created country metadata, stable locality IDs, locality aliases, landform
slots, settlement clusters, VPL seeds, postal-system priors, source metadata,
license metadata, privacy rules, and conformance test vectors.

It is not an official postal authority dataset. For mature postal countries,
this pack is a reference and compatibility layer around official postal systems,
not a replacement. For weak or no-postal countries, generated postal zones
remain simulation or draft until public authority, local review, carrier pilot,
data trust, privacy, and transition gates are satisfied.

## Files

- `manifest.json`: pack identity, required layers, counts, and safety flags.
- `agid-postal-country-pack.json`: complete generated country pack.
- `source-catalog.json`: source slots and license/reuse cautions.
- `locality-index.json`: stable non-personal locality IDs and aliases.
- `planning-cell-index.json`: synthetic AGID planning cells for postal-zone design.
- `route-evidence-index.json`: route, ferry, port, and corridor evidence slots.
- `quality-evidence-index.json`: address, boundary, route, and population quality slots.
- `official-municipality-summary.json`: official municipality source coverage status.
- `license-ledger.json`: redistribution status by source class.
- `test-vectors.json`: no-raw-address conformance examples.

## Safety Rules

- Do not store personal addresses, recipient names, phone numbers, private AOID
  bodies, AGID-S payloads, proof codes, or raw third-party datasets.
- Do not publish household-level or sensitive-facility-level public codes.
- Keep visible postal codes scoped to one municipality.
- Preserve stable locality IDs when names change.
- Keep source metadata separate from raw official or third-party datasets unless
  `DATA_LICENSES.md` explicitly allows redistribution.

## Regenerate

```bash
npm run export:postal-country-pack
```

To generate another recommended country pack:

```bash
$env:AGID_POSTAL_COUNTRY_CODE="VU"; npm run export:postal-country-pack
```

To generate every Postal Zone Designer target country pack:

```bash
npm run export:postal-country-pack:all
```
