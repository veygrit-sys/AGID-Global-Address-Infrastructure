# Open-Source Tax Data Layer

This document defines the fully-free tax support layer for AGID/AOID POS,
cross-border delivery, and shopping-agent workflows.

## Purpose

The tax layer is decision support, not a legal tax engine. It can estimate VAT,
GST, sales tax, customs duty, and landed-cost tax hints from source-versioned
evidence. It must not produce final filing, exemption, customs, or carrier
acceptance decisions by itself.

## Default Rule

Use open-source libraries, static data packs, self-hosted adapters, or
operator-imported official evidence. Do not make free-tier SaaS APIs or
registration-only endpoints part of the critical path.

Private address data stays outside the tax layer. Tax estimation may use:

- origin country
- destination country
- coarse jurisdiction when already available locally
- product category or HS code
- taxable value and currency
- source-versioned tax-rate evidence

It must not send or persist:

- raw address text
- AGID
- AOID
- recipient name
- phone number
- private delivery instructions

## Adopted Sources

| Source | Role | Default use |
| --- | --- | --- |
| `vatnode/eu-vat-rates-data` | EU and nearby Europe VAT evidence | Static data pack for estimates |
| `node-sales-tax` | International VAT/GST/sales-tax adapter | Self-hosted/local calculation fallback |
| `open-sales-tax` | US sales-tax research and adapter | Self-hosted/manual-review evidence |
| `commerceguys/tax` | Tax model reference | Optional adapter/design reference |
| `benbucksch/eu-vat-rates` | Small EU VAT JSON reference | Fixture/fallback reference |
| `TaxFoundation worldwide corporate tax rates` | Research-only data | Not used for POS checkout taxes |

## API

List source metadata:

```http
GET /api/tax/open-source/sources?recommended=1
GET /api/tax/open-source/sources?domain=vat
GET /api/tax/open-source/sources?phase=self-host-or-cache
```

Estimate with supplied evidence:

```http
POST /api/tax/open-source/estimate
Content-Type: application/json

{
  "destinationCountry": "FR",
  "originCountry": "JP",
  "taxableAmount": 100,
  "currency": "EUR",
  "category": "standard",
  "taxEvidence": [
    {
      "sourceId": "vatnode-eu-vat-rates-data",
      "countryCode": "FR",
      "taxType": "vat",
      "rate": 0.2,
      "category": "standard",
      "confidence": "open-source",
      "evidenceUrl": "https://github.com/vatnode/eu-vat-rates-data",
      "retrievedAt": "2026-06-01T00:00:00Z"
    }
  ]
}
```

The API deliberately returns `needs-evidence` when no valid evidence is supplied.
This prevents stale hardcoded tax rates from becoming hidden product behavior.

## POS Behavior

The POS should show operator-facing states rather than exact internal scores:

- `tax-estimate-ready`
- `tax-evidence-missing`
- `tax-manual-review`
- `tax-source-stale`

US sales-tax flows should remain in estimate/manual-review unless the deployment
has reliable local boundary-level jurisdiction evidence. ZIP-only evidence is
not enough for a final tax decision.

## Update Process

1. Import static or official evidence into an internal evidence table.
2. Store source id, URL, commit or dataset version, retrieval time, country,
   jurisdiction, category, rate, effective dates, and confidence.
3. Run adapter tests before enabling the source in POS.
4. Keep final invoicing and tax filing outside the AGID core unless a deployment
   adds jurisdiction-specific review and legal accountability.
