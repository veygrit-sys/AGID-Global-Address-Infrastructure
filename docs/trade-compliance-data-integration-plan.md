# Trade, Tariff, Customs, and Currency Data Integration Plan

Date: 2026-06-12

This plan defines whether AGID/AOID should use public tariff, trade,
customs-party, shipping, and exchange-rate data sources.

## Recommendation

Yes, AGID should introduce this area, but as an **advisory trade-compliance
evidence layer**, not as an automatic legal customs decision engine.

The best first use is:

- HS code lookup assistance;
- tariff evidence snapshots;
- landed-cost estimate inputs;
- shopping-agent warnings;
- POS export/import metadata checks;
- delivery eligibility enrichment for cross-border handoff.

The system should always distinguish:

```text
address deliverability
  != customs admissibility
  != tariff amount
  != final carrier acceptance
  != legal import/export approval
```

## Initial Sources To Adopt

| Source | Adopt? | Why |
| --- | --- | --- |
| `datasets/harmonized-system` | Yes, static first | Small offline HS code table, PDDL-licensed, useful for local suggestions |
| WTO Tariff and Trade Data | Yes, operator-imported snapshot first | Official tariff/trade evidence; use curated data packs, not scan-time API calls |
| Frankfurter self-host/local FX cache | Yes, self-host first | Open-source/local reference-rate path without public API dependency |

## Sources To Add Later

| Source | Decision | Reason |
| --- | --- | --- |
| World Bank WITS API | Reference or operator-import only | Public live API is still an operational dependency; do not make it a default fully-free source |
| UN Comtrade API | Add after API key/terms/quota review | Excellent trade statistics, but better for analytics than immediate POS clearance |
| OpenCorporates API | Add as optional enrichment | Useful for importer/exporter lookup, but rate limits and terms make it unsuitable as a default dependency |
| IMO GISIS | Link/reference first | Official maritime reference; avoid automated scraping unless access terms permit it |
| Frankfurter public API | Development/reference only | Use the self-host/local cache path for production fully-free deployments |
| exchangerate.host | Fallback only | Do not assume permanent no-key access; use only behind a provider adapter after terms are confirmed |

## Product Surfaces

### POS Terminal

Use trade-compliance data to show:

- HS code suggestion;
- origin/destination country;
- missing customs fields;
- estimated currency conversion;
- tariff evidence status;
- manual review required.

Do not block a retail transaction solely because an external trade API is down.
In the default fully-free mode, external trade APIs should not be in the scan-time path at all.
Use a `needs-review`, `source-unavailable`, or `operator-import-needed` state.

### Shopping Agent

Use the layer to decide:

- whether a product needs HS classification;
- whether import/export warnings should be shown;
- whether landed-cost estimate confidence is low;
- whether a carrier or customs document is likely required.

The agent should not claim final customs clearance.

### AGID/AOID Core

Do not put tariff data inside AGID or AOID identifiers.

AGID/AOID may reference:

- origin AGID/country;
- destination AGID/country;
- delivery zone;
- public compliance evidence ID;
- encrypted/private recipient data off-chain.

## Data Model

Recommended normalized record:

```ts
type TradeComplianceEvidence = {
  evidenceId: string;
  sourceId: string;
  sourceVersion: string;
  retrievedAt: string;
  originCountry?: string;
  destinationCountry?: string;
  hsCode?: string;
  productDescription?: string;
  tariffRate?: number;
  tariffRateUnit?: 'percent' | 'specific' | 'mixed' | 'unknown';
  currency?: string;
  exchangeRateDate?: string;
  confidence: 'high' | 'medium' | 'low' | 'unresolved';
  warnings: string[];
};
```

Never include:

- recipient name;
- phone number;
- room number;
- raw AOID;
- AGID-S ciphertext;
- full private address;
- payment card data.

## Cache Strategy

| Data | Cache style |
| --- | --- |
| HS code list | Versioned static data pack |
| WTO tariff snapshots | Versioned operator-imported static data pack |
| WITS data | Optional operator-imported snapshot after terms review |
| UN Comtrade | Optional analytics snapshot after terms/quota review |
| Frankfurter rates | Self-hosted/local FX table by base/date |
| OpenCorporates | Short-lived server cache, human review |

## Quality States

Use these states in UI/API:

- `ready`: source loaded and fields sufficient;
- `estimate`: useful but not final legal result;
- `needs-review`: classification, party, or customs fields uncertain;
- `source-unavailable`: external API unavailable;
- `unsupported-corridor`: origin/destination/product not covered;
- `do-not-automate`: legal or license boundary requires manual handling.

## Implementation Order

1. Add static HS code dataset import and checksum.
2. Add trade-compliance evidence schema and source registry.
3. Add Frankfurter self-host/local FX adapter with daily cache.
4. Add WTO snapshot import workflow.
5. Add optional WITS/UN Comtrade operator-import workflow after terms review.
6. Add POS display fields: HS suggestion, customs warning, currency estimate,
   source status.
7. Add OpenCorporates party-check connector only as a manual-review enrichment when terms allow it.

## Security and Privacy

Trade compliance must follow the existing AGID/AOID privacy rule:

- public source metadata is allowed;
- evidence IDs and source snapshots are allowed;
- recipient identity and private address details are not allowed;
- AOID data remains encrypted or local-only;
- API requests must not leak private address fields to third-party data sources.

## Legal Boundary

The UI should say:

> Customs and tariff information is an estimate or evidence reference. Final
> classification, duty, admissibility, and clearance may require carrier,
> broker, customs authority, or legal review.
