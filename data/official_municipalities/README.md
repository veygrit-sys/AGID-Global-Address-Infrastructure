# AGID Official Municipality Datasets

Place normalized official municipality datasets here as:

```text
data/official_municipalities/<country-code-lowercase>.json
```

Example:

```text
data/official_municipalities/fj.json
data/official_municipalities/vu.json
data/official_municipalities/ae.json
```

These files are optional. When a file exists, `npm run export:postal-country-pack
-- --all` uses it to build the country pack locality index. When a file is
missing, the exporter keeps using safe synthetic planning fixtures.

## Import

Normalize a CSV or JSON source into this directory:

```bash
npm run import:official-municipalities -- --country=FJ --input=./official-fj-municipalities.csv --source-id=fj-official-admin-2026 --source-name="FJ official administrative divisions" --source-url=https://example.gov/source --provider="Official government or postal authority" --license="source-specific open-data terms" --retrieved-at=2026-06-20 --redistribution=allowed
```

CSV columns:

```text
officialId,name,kind,parentOfficialId,codePart,language,sourceId,geometryRef,lat,lng
```

Required columns are `officialId`, `name`, and `kind`. Use
`kind=municipality` for every official municipality. Use `town` and `block`
only when the official source provides deeper hierarchy.

## Rules

- Use official government, municipality, postal authority, statistics office,
  national GIS, or legally authorized open-data sources where possible.
- Keep the raw source files outside public packs unless redistribution is
  explicitly allowed.
- Record source URL, provider, license, retrieval date, and source version.
- Do not include personal addresses, household records, recipient names, phone
  numbers, AOID private bodies, AGID-S payloads, or proof codes.
- Use stable `officialId` values. Names may change without changing IDs.

## Minimal Dataset Shape

```json
{
  "schemaVersion": "agid-official-municipality-dataset-v0.1",
  "countryCode": "FJ",
  "generatedAt": "2026-06-20T00:00:00.000Z",
  "sourceCatalog": [
    {
      "sourceId": "fj-official-admin-2026",
      "sourceName": "FJ official administrative divisions",
      "sourceUrl": "https://example.gov/source",
      "provider": "Official government or postal authority",
      "licenseOrTerms": "source-specific open-data terms",
      "retrievedAt": "2026-06-20",
      "redistributionStatus": "allowed",
      "notes": ["normalized from official source"]
    }
  ],
  "records": [
    {
      "countryCode": "FJ",
      "officialId": "official-municipality-id",
      "name": "Official municipality name",
      "kind": "municipality",
      "codePart": "01",
      "language": "en",
      "sourceId": "fj-official-admin-2026"
    }
  ]
}
```

For deeper official hierarchies, add `kind: "town"` and `kind: "block"` with
`parentOfficialId`.
