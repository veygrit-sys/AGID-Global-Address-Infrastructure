# P0 Complete Country Pack: MH Marshall Islands

Status: completed tenth P0 country slice.

## Scope

This pack turns `agid-open-mh-gazetteer` from a placeholder P0 seed into a complete country-level gazetteer slice for public constitutional district / local-government coverage.

Included:

- country seed: Marshall Islands
- all 24 constitutional electoral districts / local-government units as source-linked AGID place seeds
- 34 base and associated atoll/island anchors under those districts
- Ralik/Ratak chain notes for every district seed
- synthetic conformance vectors for every constitutional district and atoll/island anchor seed
- release gates for no raw personal addresses, source links, full constitutional district coverage, and combined district non-splitting

Excluded:

- raw personal addresses
- recipient records
- resident records
- building/unit records
- private coordinates
- imported boundary geometry
- routing data or live geocoding
- associated uninhabited atolls and minor islets as a complete all-island layer
- proof witnesses, private keys, or proof secrets

## Constitutional District Coverage

The completed MH slice records these 24 constitutional electoral district / local-government seeds:

| District seed | Chain | Coverage note |
| --- | --- | --- |
| Ailinglaplap | Ralik | constitutional district seed |
| Ailuk | Ratak | constitutional district seed |
| Arno | Ratak | constitutional district seed |
| Aur | Ratak | constitutional district seed |
| Bikini and Kili | Ralik | combined constitutional district seed; not split |
| Ebon | Ralik | constitutional district seed |
| Enewetak and Ujelang | Ralik | combined constitutional district seed; not split |
| Jabat | Ralik | constitutional district seed |
| Jaluit | Ralik | constitutional district seed |
| Kwajalein | Ralik | constitutional district seed |
| Lae | Ralik | constitutional district seed |
| Lib | Ralik | constitutional district seed |
| Likiep | Ratak | constitutional district seed |
| Majuro | Ratak | constitutional district seed and capital atoll |
| Maloelap | Ratak | constitutional district seed |
| Mejit | Ratak | constitutional district seed |
| Mili | Ratak | constitutional district seed |
| Namdrik | Ralik | constitutional district seed; Namorik retained as alternate spelling |
| Namu | Ralik | constitutional district seed |
| Rongelap | Ralik | constitutional district seed |
| Ujae | Ralik | constitutional district seed |
| Utrik | Ratak | constitutional district seed; Utirik retained as alternate spelling |
| Wotho | Ralik | constitutional district seed |
| Wotje | Ratak | constitutional district seed |

## Atoll and Island Anchor Layer

The pack now includes a base and associated atoll/island anchor layer. These anchors do not
split the 24 constitutional district / municipality seeds; they only add public
geographic references underneath those districts.

| Constitutional district | Atoll/island anchors |
| --- | --- |
| Ailinglaplap | Ailinglaplap Atoll |
| Ailuk | Ailuk Atoll |
| Arno | Arno Atoll |
| Aur | Aur Atoll |
| Bikini and Kili | Bikini Atoll; Kili Island |
| Ebon | Ebon Atoll |
| Enewetak and Ujelang | Enewetak Atoll; Ujelang Atoll |
| Jabat | Jabat Island |
| Jaluit | Jaluit Atoll |
| Kwajalein | Kwajalein Atoll |
| Lae | Lae Atoll |
| Lib | Lib Island |
| Likiep | Likiep Atoll; Jemo Island |
| Majuro | Majuro Atoll |
| Maloelap | Maloelap Atoll |
| Mejit | Mejit Island |
| Mili | Mili Atoll; Nadikdik Atoll |
| Namdrik | Namdrik Atoll |
| Namu | Namu Atoll |
| Rongelap | Rongelap Atoll; Ailinginae Atoll; Rongerik Atoll |
| Ujae | Ujae Atoll |
| Utrik | Utrik Atoll; Taka Atoll; Bikar Atoll; Bokak Atoll |
| Wotho | Wotho Atoll |
| Wotje | Wotje Atoll; Erikub Atoll |

This is not complete all-islet coverage. The Constitution also associates
several uninhabited atolls and islands with the closest district for electoral
purposes. This slice now records the high-priority associated anchors:
Ailinginae, Bikar, Bokak, Erikub, Jemo, Nadikdik/Narikrik, Rongerik/Rongrik, and
Taka/Toke. The next expansion layer is an authoritative all-islet inventory and
a disputed/claimed-feature policy before any all-island claim.

## Source Policy

The pack uses linked public evidence only. External datasets are not bundled.

Primary source links:

- Constitution of the Republic of the Marshall Islands electoral districts: `https://rmiparliament.org/cms/?catid=87&id=134%3Athe-constitution&view=article`
- RMI Judiciary local government constitution index: `https://rmicourts.org/constitutions-of-the-local-governments-of-the-republic-of-the-marshall-islands/`
- GeoNames MH administrative division listing: `https://www.geonames.org/MH/administrative-division-marshall-islands.html`
- GeoNames Marshall Islands country metadata: `https://www.geonames.org/countries/MH/marshall-islands.html`
- Statoids Marshall Islands municipalities table: `https://statoids.com/ymh.html`

## Verification

Run:

```powershell
npm run verify:p0-mh-complete
npm run verify:p0-gazetteer
```

Verified properties:

- MH plan validates with zero repository-plan errors.
- MH contains exactly 24 constitutional district / municipality seeds.
- MH contains exactly 34 base and associated atoll/island anchor seeds.
- Bikini and Kili and Enewetak and Ujelang remain combined constitutional district seeds.
- Bikini/Kili and Enewetak/Ujelang are split only as public geographic anchors, not as municipalities.
- Majuro is recorded as the capital district seed.
- Every MH district seed is source-linked and has official and GeoNames source links.
- Every MH atoll/island anchor is source-linked and carries a no-boundary/no-delivery overclaim guard.
- Generated `manifest.json` place count matches `data/place-seed.json`.
- Generated conformance fixtures cover every district and atoll/island anchor seed and require `mustNotReturnRawAddress`.

## Residual Risk

This is a complete public constitutional district seed pack with a base
atoll/island anchor layer, not a full address database. It does not include all
minor islets, all settlements, road/path datasets, imported boundary geometry,
delivery routing, multilingual alias expansion, or live geocoding. Some
centroids are coarse region anchors for non-contiguous or atoll-wide
administrative groupings and must not be used as precise delivery points.
