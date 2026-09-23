# P0 Complete Country Pack: PF French Polynesia

Status: completed thirteenth P0 country slice.

## Scope

This pack turns `agid-open-pf-gazetteer` from a placeholder P0 seed into a complete country-level gazetteer slice for public administrative subdivision coverage.

Included:

- country seed: French Polynesia
- all 5 administrative subdivisions as source-linked AGID place seeds
- Papeete as the public capital seed
- commune-count notes for each subdivision
- synthetic conformance vectors for every subdivision and the capital
- release gates for no raw personal addresses, source links, complete subdivision coverage, and deferred commune-level expansion

Excluded:

- raw personal addresses
- recipient records
- resident records
- building/unit records
- private coordinates
- imported boundary geometry
- commune and commune-associée records
- individual island/atoll records beyond the subdivision/capital slice
- postal routing or live geocoding
- proof witnesses, private keys, or proof secrets

## Administrative Subdivision Coverage

The completed PF slice records these 5 administrative subdivision seeds:

| Subdivision seed | GeoNames code note | Commune count note |
| --- | --- | --- |
| Iles du Vent | 01 | 13 communes |
| Iles Sous-le-Vent | 02 | 7 communes |
| Iles Tuamotu-Gambier | 03 | 17 communes |
| Iles Marquises | 04 | 6 communes |
| Iles Australes | 05 | 5 communes |

The pack also records:

| Settlement | AGID feature class | Coverage note |
| --- | --- | --- |
| Papeete | capital | public capital seed on Tahiti in Iles du Vent |

The next expansion layer should be a commune-level pack covering all 48 communes and, later, 98 communes associées. This seed pack deliberately stops at administrative subdivisions plus the capital so it can remain small, source-linked, and safe to publish without bundling upstream datasets.

## Source Policy

The pack uses linked public evidence only. External datasets are not bundled.

Primary source links:

- High Commission communes by archipelago presentation: `https://www.polynesie-francaise.pref.gouv.fr/Actions-de-l-Etat/Accompagnement-des-communes/Presentation`
- High Commission administrative subdivisions index: `https://www.polynesie-francaise.pref.gouv.fr/Services-de-l-Etat/Le-Haut-Commissariat/Les-subdivisions`
- ISPF legal population note: `https://www.ispf.pf/actualites/16`
- GeoNames PF administrative division listing: `https://www.geonames.org/PF/administrative-division-french-polynesia.html`
- GeoNames French Polynesia country metadata: `https://www.geonames.org/countries/PF/french-polynesia.html`
- GeoNames French Polynesia feature statistics: `https://www.geonames.org/statistics/french-polynesia.html`

## Verification

Run:

```powershell
npm run verify:p0-pf-complete
npm run verify:p0-gazetteer
```

Verified properties:

- PF plan validates with zero repository-plan errors.
- PF contains exactly 5 administrative subdivision seeds.
- PF contains exactly one Papeete capital seed.
- Every subdivision seed is source-linked and records a GeoNames administrative-code note.
- Every subdivision seed records the commune count from the prefecture source.
- Generated `manifest.json` place count matches `data/place-seed.json`.
- Generated conformance fixtures cover every subdivision and the capital and require `mustNotReturnRawAddress`.

## Residual Risk

This is a complete public administrative-subdivision seed pack, not a full address database. It does not include the 48 communes, the 98 communes associées, all islands and atolls, imported boundary geometry, postal routing, delivery routing, multilingual alias expansion, or live geocoding. Some centroids are coarse anchors for wide non-contiguous island-region groupings and must not be used as precise delivery points.
