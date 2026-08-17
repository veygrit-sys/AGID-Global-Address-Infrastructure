# AGID Address Fusion Engine

The Address Fusion Engine is the common integration layer for improving AGID
address display, postcode completion, building recognition and domestic/international
address rendering. It combines evidence while keeping the original source, licence
status, observation date and confidence attached to every winning field.

This repository contains connector definitions and fusion code. It does **not**
bundle national address databases, paid postal products or cadastral records.

## Pipeline

```text
official address + postal + building + road + cadastre
+ administrative boundaries + coordinates + statistics + OSM
                         |
                         v
                 source validation
                         |
                         v
          country-aware normalization and blocking
                         |
                         v
             spatial/address candidate clustering
                         |
                         v
       field-level weighted voting and conflict capture
                         |
                         v
        AGID entity + confidence + full provenance
                         |
             +-----------+-----------+
             |                       |
             v                       v
  internal licensed view     open/public export gate
```

## Sequential confidence gates

Validation is intentionally ordered:

1. administrative hierarchy;
2. locality;
3. road;
4. building position;
5. postal zone.

A later stage cannot erase a failed earlier stage. Postal agreement therefore cannot make a geographically inconsistent building appear verified. Geography and statistics may strongly validate the administrative and locality stages, while road/building/postal confidence remains partial until matching evidence exists. Roadless rural buildings are allowed only when authoritative building or cadastral geometry and coordinates provide strong independent support. Countries without a nationwide postcode system receive an `unavailable` postal stage rather than a fabricated failure or code.

The final decision is capped when prerequisite stages fail and reports stage-level confidence, coverage, evidence IDs, blockers and review reasons.

The engine deliberately separates four evidence classes:

- **Verified** — confirmed by an authoritative address, postal or cadastral source.
- **Observed** — directly observed in an open map, building or field dataset.
- **Derived** — mechanically produced from compatible authoritative layers.
- **Inferred** — estimated from nearby roads, buildings or statistical patterns.

An inferred house number is never promoted to an address fact. AGID may show that a
building lies on a road or inside a postal zone, but an unverified number remains
unknown.

## First 102 country adapters

| Region | Countries |
| --- | --- |
| Latin America | Brazil, Mexico, Argentina, Colombia, Costa Rica, Panama |
| Europe / Caucasus | Türkiye, Georgia, Serbia, Montenegro, North Macedonia, Moldova, Ukraine, Albania, Bosnia and Herzegovina |
| Gulf | Saudi Arabia, Qatar, Bahrain, Oman |
| Asia | Malaysia, Thailand, China, India |
| Africa / Indian Ocean | South Africa, Mauritius |
| Southeast Asia expansion | Indonesia, Philippines, Vietnam, Brunei |
| South Asia / Himalaya | Bangladesh, Pakistan, Sri Lanka, Nepal, Bhutan |
| Central Asia / Caucasus | Mongolia, Kazakhstan, Uzbekistan, Armenia, Azerbaijan |
| Middle East expansion | Jordan, Kuwait |
| North / East / West / Southern Africa | Morocco, Tunisia, Egypt, Kenya, Ghana, Rwanda, Namibia, Botswana, Zambia, Zimbabwe, Tanzania, Uganda, Senegal, Cabo Verde |
| Latin America / Caribbean expansion | Peru, Ecuador, Paraguay, Dominican Republic, Jamaica, Trinidad and Tobago |
| Africa expansion II | Algeria, Libya, Ethiopia, Mozambique, Madagascar, Malawi, Angola, Cameroon, Côte d’Ivoire, Benin, Togo, Gabon, Republic of the Congo, DR Congo, Lesotho, Eswatini, Djibouti, Mauritania, The Gambia, Guinea, Sierra Leone, Liberia, Sudan |
| Central / Southeast Asia expansion II | Kyrgyzstan, Tajikistan, Laos, Cambodia, Timor-Leste |
| Middle East expansion II | Iraq, Lebanon, Iran, Palestine |
| Central America / northern South America | Bolivia, Guatemala, El Salvador, Honduras, Nicaragua, Guyana, Suriname |
| Pacific | Fiji, Papua New Guinea |

All 102 adapters declare all nine required layers: official address, postal, building,
road, cadastre, administrative boundaries, coordinates, statistics and OSM. A layer
marked `research-required` is a discovery target, not a claim that AGID may download
or redistribute it. `restricted` layers may enrich an authorised internal response
but cannot enter the public export unless the same value is independently supported
by a redistributable source.

Special rules are recorded in the adapters. Examples include Qatar's
zone/street/building model, Bahrain's block/road/building identifiers, and the
coordinate, surveying and cross-border data controls that must be reviewed before
processing data for China.

## Provenance and licence controls

Connector code is covered by this repository's software licence. Source data keeps
its own terms. Before enabling a connector:

1. record the dataset owner, exact release and retrieval date;
2. capture the licence or contract version and permitted purposes;
3. decide whether values are open, attribution-required, restricted or unknown;
4. verify retention, caching, derivative-database and cross-border restrictions;
5. store checksums and update/freshness metadata;
6. add required attribution to product and export surfaces;
7. run a jurisdiction-specific legal and security review where necessary.

OpenStreetMap-derived databases require attribution and an ODbL assessment before
redistribution. This document is an engineering control, not legal advice.

The public exporter removes fields supported only by restricted or unknown sources.
It also returns the contributing source IDs so downstream products can render the
required attribution. Public and licensed datasets should be stored separately; raw
restricted rows must not appear in logs, analytics events or model-training corpora.

## Confidence and conflict policy

Field votes combine:

- source authority;
- evidence class;
- source-type priority;
- data freshness;
- independent-source agreement.

Official verified evidence normally wins over conflicting community evidence, but
the losing value is preserved in `conflicts` for review. Confidence is not a
marketing grade. It is a reproducible signal that must be calibrated against
country-specific benchmark data.

No country may be labelled S, SS or SSS solely because many sources are connected.
Until measured benchmarks exist, its public quality grade must remain B or lower.

## Quality gates

Each country release should report at least:

| Metric | Meaning |
| --- | --- |
| Field precision / recall | Correctness and coverage for street, number, locality and postcode |
| Building match rate | Address entities linked to the correct building or entrance |
| Postcode exact-match rate | Exact domestic postcode correctness |
| Coordinate error | Median and 95th-percentile entrance/building distance |
| Translation fidelity | Native-script preservation, transliteration and delivery-line accuracy |
| Conflict rate | Records with unresolved authoritative disagreements |
| Freshness | Age and update lag of each contributing source |
| Licence coverage | Share of output fields with explicit redistribution status |
| False-invention rate | Inferred identifiers incorrectly emitted as verified; target is zero |

Recommended acceptance gates are set per country and urban/rural cohort. Benchmark
samples must include apartments, named buildings, rural routes, PO Boxes, incomplete
addresses, duplicate road names, multilingual localities and border/territorial
edge cases.

## Adding a country

1. Add a `CountrySpec` in
   `src/data/addressFusionCountries.ts`.
2. Define languages, postcode syntax and clustering radius.
3. Provide a connector candidate for every required source layer.
4. Mark uncertain access as `research-required`, never as open by assumption.
5. Add golden domestic and international examples without personal information.
6. Add benchmark tests for normalization, postcode completion, buildings and
   translation/transliteration.
7. Run:

   ```bash
   npx tsx src/lib/addressFusionEngine.test.ts
   npm run lint
   npm run build
   ```

## Ingestion boundary

Source-specific importers should emit `AddressEvidenceRecord` objects. They must be
separate from the fusion core so credentials, rate limits, licensed schemas and
jurisdiction rules remain isolated. Recommended production stages are:

- download or API capture into a quarantined source store;
- schema and coordinate-reference validation;
- PII/secrets scan and licence policy check;
- deterministic conversion to evidence records;
- fusion into internal AGID entities;
- open-export filtering;
- country benchmark and regression report;
- signed release manifest with provenance and checksums.

This boundary lets AGID improve from high-quality government and postal sources
without confusing source access with permission to redistribute or train an AI
model on the data.
