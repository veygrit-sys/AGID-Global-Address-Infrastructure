# AGID Data License Index

Last updated: 2026-09-24

This file is the top-level entry point for AGID data-license handling. It
separates software licensing from geographic, postal, map, trade, carrier,
official-source, and other external datasets.

AGID source code and AGID-owned documentation are governed by the licenses
declared in `LICENSE`, `LICENSE_POLICY.md`, package manifests, or document
front matter. Third-party data is not automatically covered by those licenses.

## Canonical Policy

- Detailed policy: `docs/data-licenses.md`
- License split and open-core policy: `LICENSE_POLICY.md`
- Security boundary: `docs/agid-security.md`
- Standard boundary: `docs/agid-standard.md`

## Source Categories

| Category | Handling rule |
| --- | --- |
| OpenStreetMap-derived data | Preserve ODbL attribution and share-alike obligations where applicable. |
| Government open data | Follow each government or agency license, attribution, and redistribution term. |
| Postal authority data and APIs | Use under source terms; do not imply official deliverability unless supported by the source. |
| Open geographic datasets | Preserve license, citation, version, and redistribution limits. |
| Space agency and Earth-observation datasets | Preserve mission, product, and provider terms; do not bundle uncertain data as redistributable. |
| Trade, tariff, customs, and carrier data | Keep terms and allowed-use metadata separate from AGID software. |
| Commercial or restricted sources | Do not bundle into public data packs unless redistribution is explicitly allowed. |

## Address OSS Stack

The operational catalog is defined in
'src/lib/openSourceAddressStack.ts' and explained in
'docs/open-source-address-stack.md'.

| Component | Handling rule |
| --- | --- |
| libpostal | MIT software; keep model and training-data provenance separate. Use only through the loopback-only sidecar for private address text. |
| Photon | Apache-2.0 software; preserve ODbL attribution and obligations for OSM-derived indexes. |
| Pelias | MIT software and an optional self-hosted geocoder; record every imported dataset license independently. |
| Overture Addresses | Treat as a versioned, source-specific, license-gated dataset. Do not treat alpha address IDs as stable AGIDs. |

## Required Manifest Fields

Every redistributable AGID data pack should include a manifest with:

- `source_id`
- `source_name`
- `source_url`
- `provider`
- `coverage_region`
- `license_or_terms`
- `retrieved_at` or `source_version`
- `redistribution_status`
- `allowed_use`
- `transformed_fields`
- `freshness`
- `confidence_notes`

## Default Rule

When license or redistribution status is unclear, the source may be referenced
as an evidence candidate, but it must not be bundled in a redistributable data
pack. In code and manifests, unclear sources should resolve to:

```text
License review required before redistribution
```

This status is compatible with research and source discovery. It is not a claim
that the data can be redistributed.
