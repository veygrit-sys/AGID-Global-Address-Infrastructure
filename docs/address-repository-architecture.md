# AGID Country Repository Architecture

AGID country repositories are not only data buckets. They are the country-level infrastructure that lets address morphism, address translation, normalization, AGID generation, and validation improve independently.

## Core Idea

Each country or territory repository owns local address rules:

- country address model
- administrative crosswalk
- postal code and AGID crosswalk
- normalization rules
- translation rules
- validation rules
- conformance test data

AGID core owns the common graph, identifier semantics, privacy gates, and conformance contract.

```text
native country address
  -> country-specific address morphism
  -> AGID common model
  -> target-country address morphism
  -> validated target address view
```

## Example

Japan can use:

```text
Prefecture -> Municipality -> Town/Chome -> Block -> Building -> Unit
```

The United States can use:

```text
State -> City -> Street -> House Number -> Building -> Unit
```

Both are mapped into the AGID common graph without forcing Japan or the United States to adopt the same local hierarchy.

## GitHub Storage

Country repositories should keep small, reviewable, license-clear files:

- hierarchy schemas
- administrative code mappings
- postal and AGID status rules
- normalization policies
- translation and transliteration policies
- validation thresholds
- synthetic conformance fixtures

They must not store raw personal addresses, recipient records, private coordinate dumps, or private operational samples.

## External Storage

Large or sensitive data should stay outside GitHub:

- building polygons
- high-resolution coordinates
- bulk postal tables
- search indexes
- tiles
- carrier-only route packs
- private audit logs

Country repos may reference these packs by content hash, version, source, and license.

## Quality Gates

Before a country repo is publishable, it should pass:

- breadcrumb round-trip
- administrative parent-child consistency
- explicit postal or AGID status
- translation order preservation
- validation warning coverage
- synthetic conformance fixtures
- no raw personal address gate

This keeps each country independently improvable while preserving compatibility with the AGID common model.
