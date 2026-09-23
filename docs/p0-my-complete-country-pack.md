# P0 Complete Country Pack: MY Malaysia

Status: completed eleventh P0 country slice.

## Scope

This pack turns `agid-open-my-gazetteer` from a placeholder P0 seed into a complete country-level gazetteer slice for public first-order administrative division coverage.

Included:

- country seed: Malaysia
- all 13 states as source-linked AGID place seeds
- all 3 federal territories as source-linked AGID place seeds
- ISO 3166-2 subdivision-code notes for every first-order division
- synthetic conformance vectors for every first-order division seed
- release gates for no raw personal addresses, source links, complete first-order coverage, and federal-territory/capital coverage

Excluded:

- raw personal addresses
- recipient records
- resident records
- parcel records
- building/unit records
- private coordinates
- imported boundary geometry
- district, mukim, road, parcel, or POI datasets
- postal routing or live geocoding
- proof witnesses, private keys, or proof secrets

## First-Order Coverage

The completed MY slice records these 16 first-order division seeds:

| Division seed | Type | ISO note |
| --- | --- | --- |
| Johor | state | MY-01 |
| Kedah | state | MY-02 |
| Kelantan | state | MY-03 |
| Melaka | state | MY-04 |
| Negeri Sembilan | state | MY-05 |
| Pahang | state | MY-06 |
| Pulau Pinang | state | MY-07 |
| Perak | state | MY-08 |
| Perlis | state | MY-09 |
| Selangor | state | MY-10 |
| Terengganu | state | MY-11 |
| Sabah | state | MY-12 |
| Sarawak | state | MY-13 |
| Kuala Lumpur | federal territory | MY-14 |
| Labuan | federal territory | MY-15 |
| Putrajaya | federal territory | MY-16 |

Kuala Lumpur is recorded as the capital federal territory seed. Melaka retains Malacca as an alternate spelling, and Pulau Pinang retains Penang / Pinang as alternate names for matching.

## Source Policy

The pack uses linked public evidence only. External datasets are not bundled.

Primary source links:

- MyGeoportal Unique Parcel Identifier land administration codes: `https://www.mygeoportal.gov.my/en/unique-parcel-identifier-upi`
- MyGeoportal Geographical Name Database guidance: `https://www.mygeoportal.gov.my/en/pdng`
- Department of Statistics Malaysia My Local Stats state and administrative district release: `https://www.dosm.gov.my/portal-main/release-content/my-local-stats--malaysia-state--administrative-district`
- OpenDOSM household and living quarters by state dataset metadata: `https://open.dosm.gov.my/data-catalogue/hh_profile_state`
- GeoNames MY administrative division listing: `https://www.geonames.org/MY/administrative-division-malaysia.html`
- GeoNames Malaysia country metadata: `https://www.geonames.org/countries/MY/malaysia.html`
- GeoNames Malaysia feature statistics: `https://www.geonames.org/statistics/malaysia.html`

## Verification

Run:

```powershell
npm run verify:p0-my-complete
npm run verify:p0-gazetteer
```

Verified properties:

- MY plan validates with zero repository-plan errors.
- MY contains exactly 16 first-order division seeds.
- MY contains exactly 13 state seeds and 3 federal territory seeds.
- Kuala Lumpur is recorded as the capital federal territory seed.
- Every MY first-order seed is source-linked and has official and GeoNames source links.
- Every MY first-order seed records an ISO 3166-2 subdivision-code note.
- Generated `manifest.json` place count matches `data/place-seed.json`.
- Generated conformance fixtures cover every first-order division and require `mustNotReturnRawAddress`.

## Residual Risk

This is a complete public first-order division seed pack, not a full address database. It does not include all administrative districts, mukim, parcels, buildings, postal routing, delivery routing, imported boundary geometry, multilingual alias expansion, or live geocoding. Approximate centroids are coarse region anchors and must not be used as precise delivery points.
