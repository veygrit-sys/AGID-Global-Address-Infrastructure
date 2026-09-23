# P0 Complete Country Pack: BN Brunei Darussalam

Status: completed third P0 country slice.

## Scope

This pack turns `agid-open-bn-gazetteer` from a placeholder P0 seed into a complete country-level gazetteer slice for public district coverage.

Included:

- country seed: Brunei Darussalam
- all 4 Brunei Darussalam districts as source-linked AGID place seeds
- synthetic conformance vectors for every district
- release gates for no raw personal addresses, source links, district code notes, ISO subdivision code notes, and fixture coverage

Excluded:

- raw personal addresses
- recipient records
- building/unit records
- private coordinates
- imported boundary geometry
- proof witnesses, private keys, or proof secrets

## District Coverage

The completed BN slice records these 4 district seeds:

| District | AGID feature class | GeoNames administrative code | ISO 3166-2 subdivision code |
| --- | --- | --- | --- |
| Belait | district | 01 | BN-BE |
| Brunei-Muara | district | 02 | BN-BM |
| Temburong | district | 03 | BN-TE |
| Tutong | district | 04 | BN-TU |

## Source Policy

The pack uses linked public evidence only. External datasets are not bundled.

Primary source links:

- Information Department, Prime Minister's Office, Brunei Darussalam: `https://www.information.gov.bn/SitePages/About%20Brunei%20Darussalam.aspx`
- GeoNames BN administrative division listing: `https://www.geonames.org/BN/administrative-division-brunei.html`
- GeoNames Brunei country metadata: `https://www.geonames.org/countries/BN/brunei.html`

## Verification

Run:

```powershell
npm run verify:p0-bn-complete
npm run verify:p0-gazetteer
```

Verified properties:

- BN plan validates with zero repository-plan errors.
- BN contains exactly 4 district seeds.
- Every BN district is source-linked.
- Every BN district records a GeoNames administrative code note.
- Every BN district records an ISO 3166-2 subdivision code note.
- Generated `manifest.json` place count matches `data/place-seed.json`.
- Generated conformance fixtures cover every district and require `mustNotReturnRawAddress`.

## Residual Risk

This is a complete public district seed pack, not a full address database. Mukim and village coverage, official boundary import, postal routing, multilingual alias expansion, and live geocoding require separate license review and import pipelines.
