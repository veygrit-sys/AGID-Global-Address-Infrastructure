# AGID World Address Repository Architecture

This note defines the default multi-repository strategy for AGID country,
territory, disputed-area, and postal-zone data. It is intentionally a product
architecture rule, not a data dump.

## Conclusion

AGID should use a federated repository model:

- One global index repository for discovery, schemas, governance, and release
  manifests.
- One country or territory pack repository for small and medium jurisdictions.
- State, province, prefecture, or metro repositories for large or fast-changing
  jurisdictions.
- External object storage for heavy geometry, search indexes, cache artifacts,
  and building-level datasets.

GitHub should hold reviewable source data and rules. It should not become the
primary warehouse for large GIS assets or private address material.

## Recommended Repository Count

Use this split:

- Small country or territory: 1 repository.
- Medium country: 1 country repository plus optional metro repositories.
- Large federal country: 1 country index plus state or province repositories.
- Very large or high-change country: 1 country index, state/province
  repositories, and independent megacity repositories.

The split is based on population, area, administrative unit count, building
count, postal-code complexity, update frequency, expected pull request volume,
and the number of local maintainers.

## Repository Map

```text
agid-world-address-index
  countries.json
  territories.json
  disputed-areas.json
  source-license-index.json
  pack-release-manifest.json

agid-country-jp
  rules/
  sources/
  tests/
  regions/

agid-jp-13-tokyo
agid-jp-27-osaka

agid-country-us
agid-us-ca
agid-us-tx
agid-us-ny
agid-us-nyc

agid-country-cn
agid-cn-bj
agid-cn-sh
agid-cn-gd
agid-cn-shenzhen
```

## Naming Rules

Use predictable lowercase names:

- `agid-country-{iso2}` for country or territory roots.
- `agid-{iso2}-{admin1}` for state, province, prefecture, or region packs.
- `agid-{iso2}-{metro}` for megacity packs.
- `agid-area-{code}` for disputed, polar, maritime, or non-sovereign areas when
  ISO codes are insufficient.

Caucasus rule: AM, AZ, and GE are canonical under Europe / Eastern Europe for
AGID repository indexing, while source metadata may still preserve alternate
regional classifications.

## Megacity Rule

Create an independent megacity repository when at least two of these are true:

- Population is above 5 million.
- Building or POI churn is high.
- Address format has city-specific behavior.
- Local open-data sources update independently.
- Expected pull request volume would dominate the country repository.
- Search, postal, or delivery tests need city-specific fixtures.

Examples: Tokyo, New York City, London, Sao Paulo, Shanghai, Shenzhen, Delhi,
Mumbai, Jakarta, Lagos, Mexico City, Istanbul, Paris, Seoul, Hong Kong.

## Breadcrumb Data Model

AGID stores addresses as reconstructable breadcrumbs, not raw unstructured text:

```text
Country
  -> Admin1
  -> Municipality
  -> District
  -> Locality
  -> Street or route
  -> Block or parcel
  -> Building
  -> Unit
```

Each node has:

- Stable local id.
- Parent id.
- Display names by script or language.
- Source references.
- Validity interval.
- Confidence and quality score.
- Optional AGID grid reference.

Reconstruction is done by walking parent links from the leaf node to the country
root, then rendering with the country format rules and requested purpose:
domestic, international shipping, map search, POS handoff, hotel/PMS, or privacy
preserving alias.

## GitHub Data

GitHub repositories may store:

- Administrative hierarchy source files.
- Postal-code rules and public postal-code ranges.
- Address-format YAML source and generated JSON.
- AGID pack manifests and stable identifiers.
- Quality score rules.
- Source metadata, licenses, and update cadence.
- Redacted test vectors.
- Conformance fixtures.
- Pull request review notes.

GitHub repositories must not store:

- Raw personal addresses.
- Recipient names.
- Private keys, witnesses, nullifiers, or proof secrets.
- Precise private delivery coordinates.
- Unredacted QR payloads.

## External Storage

Move these out of GitHub:

- Building polygons.
- Full parcel geometry.
- High-resolution coordinate datasets.
- Raster tiles.
- PMTiles and FlatGeobuf releases.
- Search indexes.
- Generated caches.
- Bulk OpenStreetMap or Overture-derived extracts.

External objects must be addressed by content hash, source version, license,
generated timestamp, and quality profile. GitHub keeps the manifest; object
storage keeps the bytes.

## Quality Assurance

Every pack should expose:

- `quality_score`: 0 to 100.
- `source_tier`: official, open-data, osm-derived, agid-generated, or manual.
- `validation_status`: verified, partial, manual-required, deprecated.
- `coverage`: admin, postal, street, building, unit, geometry.
- `tests`: schema, format, postal, hierarchy, round-trip rendering, no-raw.

GitHub Actions should run:

- Schema validation.
- License validation.
- No raw address release scan.
- Postal-code and hierarchy consistency tests.
- Rendering round-trip tests.
- Pack size and generated artifact checks.

## Data Scale Estimates

Recommended GitHub repository sizes:

- Small country: 1 to 20 MB.
- Medium country: 20 to 100 MB.
- Large state/province pack: 50 to 250 MB.
- Country index repository: under 50 MB.

External storage estimates:

- Medium country geometry: 1 to 20 GB.
- Large country geometry and search artifacts: 20 to 500 GB.
- Global derived geometry and search cache: multi-terabyte.

## Open Source Operations

Use this maintainer model:

- Global maintainers own schema, release gates, and security policy.
- Regional maintainers own country grouping and source policy.
- Local maintainers review language, address format, and postal behavior.
- Data stewards review source licenses and update cadence.
- Security reviewers approve no-raw-address gates and privacy-sensitive changes.

Review rule:

- Data-only PRs need local maintainer review.
- Schema or renderer changes need global maintainer review.
- Source-license changes need data steward review.
- Security/privacy policy changes need security reviewer approval.

## Difficulty Rating

Use five-star ratings per pack:

- Data volume.
- Maintainability.
- Update frequency.
- Implementation difficulty.

Example:

```text
Japan:      data volume ★★★★☆, maintainability ★★★☆☆, update ★★★☆☆, difficulty ★★★★☆
United States: data volume ★★★★★, maintainability ★★★★☆, update ★★★★☆, difficulty ★★★★★
Small island territory: data volume ★☆☆☆☆, maintainability ★★☆☆☆, update ★☆☆☆☆, difficulty ★★☆☆☆
```

## Expansion Rules

Start with country repositories. Split later when one of these happens:

- Repository approaches the size budget.
- PR review becomes noisy.
- A state, province, or city has independent source cadence.
- A megacity needs separate search, building, or delivery tests.
- Overseas territories need different address rules from the parent country.
- Disputed territories require claim-policy rendering.
- Maritime, polar, mountain, or no-postal-code regions need AGID-primary models.

## Summary

The best AGID architecture is a lightweight GitHub source-of-truth plus
content-addressed external data packs. GitHub should optimize for review,
lineage, tests, and governance. Heavy GIS and search artifacts should be
published as versioned country or region packs outside the app bundle.
