# P0 Complete Country Pack: Ireland (IE)

Status: completed as a P0 gazetteer rotation slice.

Repository prepared locally:

```text
data/open_geo_repositories/agid-open-ie-gazetteer
```

## Scope

This pack records a source-linked local-authority seed layer for Ireland. It
uses the practical 31 local authorities rather than treating the historic four
provinces as the address-routing layer.

Included:

- country seed: Ireland
- all 31 local authority seeds
- synthetic conformance vectors for every local authority seed
- no raw address, recipient, private coordinate, witness, key, or proof-secret
  data

Excluded:

- raw personal addresses
- recipient, resident, building, unit, or private coordinate data
- imported boundary geometry
- historic province layer, municipal districts, local electoral areas, postal
  records, routes, or building-level records

## Source Links

- Gov.ie local authorities publication: https://www.gov.ie/en/department-of-rural-and-community-development-and-the-gaeltacht/publications/local-authorities/
- Local Government Ireland local authority finder: https://www.localgov.ie/find-my-local-authority
- GeoNames IE administrative division listing: https://www.geonames.org/IE/administrative-division-ireland.html
- GeoNames Ireland country metadata: https://www.geonames.org/countries/IE/ireland.html

## Verification

Run:

```text
npm run verify:p0-batch-21-24-complete
npm run verify:p0-gazetteer
```

The complete-pack test verifies 31 local authority seeds, absence of historic
province overclaiming, source links, conformance fixtures, and the
no-raw-address fixture boundary.

## Residual Risk

This is not a complete address, Eircode, municipal district, electoral area, or
boundary database. It is a complete local-authority AGID seed pack. The next
improvement is a municipal district / Eircode-compatibility pack with license
review.
