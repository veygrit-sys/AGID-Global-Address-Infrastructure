# P0 Complete Country Pack: NL Netherlands

Status: completed twelfth P0 country slice.

## Scope

This pack turns `agid-open-nl-gazetteer` from a placeholder P0 seed into a complete country-level gazetteer slice for public province coverage plus Caribbean Netherlands public-body coverage.

Included:

- country seed: Netherlands
- all 12 European Netherlands provinces as source-linked AGID place seeds
- all 3 Caribbean Netherlands public bodies as source-linked AGID place seeds
- Amsterdam as the public capital seed
- synthetic conformance vectors for every province, Caribbean public body, and the capital
- release gates for no raw personal addresses, complete province/BES coverage, no BES province overclaiming, and capital coverage

Excluded:

- raw personal addresses
- recipient records
- resident records
- building/unit records
- private coordinates
- imported boundary geometry
- municipalities, neighbourhoods, streets, parcels, BAG extracts, postal routing, or live geocoding
- Aruba, Curaçao, and Sint Maarten as separate Kingdom countries
- proof witnesses, private keys, or proof secrets

## Province And BES Coverage

The completed NL slice records these 12 province seeds:

| Province seed | ISO note | Coverage note |
| --- | --- | --- |
| Drenthe | NL-DR | European Netherlands province seed |
| Flevoland | NL-FL | European Netherlands province seed |
| Friesland | NL-FR | European Netherlands province seed; Fryslân retained |
| Gelderland | NL-GE | European Netherlands province seed |
| Groningen | NL-GR | European Netherlands province seed |
| Limburg | NL-LI | European Netherlands province seed |
| Noord-Brabant | NL-NB | European Netherlands province seed |
| Noord-Holland | NL-NH | European Netherlands province seed |
| Overijssel | NL-OV | European Netherlands province seed |
| Utrecht | NL-UT | European Netherlands province seed |
| Zeeland | NL-ZE | European Netherlands province seed |
| Zuid-Holland | NL-ZH | European Netherlands province seed |

The pack also records these Caribbean Netherlands public bodies:

| Public body seed | Coverage note |
| --- | --- |
| Bonaire | public body of the Netherlands; not part of a Dutch province |
| Sint Eustatius | public body of the Netherlands; not part of a Dutch province |
| Saba | public body of the Netherlands; not part of a Dutch province |

The pack records Amsterdam as a capital seed for lookup conformance. Aruba, Curaçao, and Sint Maarten are excluded because they are separate countries within the Kingdom of the Netherlands and should be handled as separate country/region packs.

## Source Policy

The pack uses linked public evidence only. External datasets are not bundled.

Primary source links:

- Government.nl provinces page: `https://www.government.nl/themes/government-and-democracy/provinces`
- Business.gov.nl Dutch government levels page: `https://business.gov.nl/coming-to-the-netherlands/living-in-the-netherlands/dutch-life-and-personal-matters/`
- Government.nl governance of Bonaire, St Eustatius and Saba: `https://www.government.nl/themes/government-and-democracy/caribbean-parts-of-the-kingdom/governance-of-bonaire-st-eustatius-and-saba`
- Statistics Netherlands Dutch Caribbean introduction: `https://www.cbs.nl/en-gb/longread/diversen/2025/the-dutch-caribbean-15-years-after-the-dissolution-of-the-netherlands-antilles/1-introduction`
- GeoNames NL administrative division listing: `https://www.geonames.org/NL/administrative-division-netherlands.html`
- GeoNames Netherlands country metadata: `https://www.geonames.org/countries/NL/the-netherlands.html`
- GeoNames Netherlands feature statistics: `https://www.geonames.org/statistics/the-netherlands.html`

## Verification

Run:

```powershell
npm run verify:p0-nl-complete
npm run verify:p0-gazetteer
```

Verified properties:

- NL plan validates with zero repository-plan errors.
- NL contains exactly 12 province seeds.
- NL contains exactly 3 Caribbean Netherlands public-body seeds.
- Amsterdam is recorded as the capital seed.
- BES seeds are recorded as public bodies / special municipalities and do not claim Dutch province ISO codes.
- Every NL province seed is source-linked and records an ISO 3166-2 subdivision-code note.
- Generated `manifest.json` place count matches `data/place-seed.json`.
- Generated conformance fixtures cover every province, every BES public body, and the capital and require `mustNotReturnRawAddress`.

## Residual Risk

This is a complete public province/BES seed pack, not a full address database. It does not include all municipalities, all neighbourhoods, BAG building/address extracts, postal-code routing, imported boundaries, delivery routing, multilingual alias expansion, or live geocoding. Approximate centroids are coarse region anchors and must not be used as precise delivery points.
