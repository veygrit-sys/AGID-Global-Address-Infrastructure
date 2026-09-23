# P0 Complete Country Pack: AX Åland Islands

Status: completed first P0 country slice.

## Scope

This pack turns `agid-open-ax-gazetteer` from a placeholder P0 seed into a complete country-level gazetteer slice for public municipality coverage.

Included:

- country seed: Åland Islands
- municipality groupings for QA: Ålands landsbygd, Ålands skärgård
- all 16 municipalities as source-linked AGID place seeds
- synthetic conformance vectors for every municipality
- release gates for no raw personal addresses, source links, municipality code notes, and fixture coverage

Excluded:

- raw personal addresses
- recipient records
- building/unit records
- private coordinates
- imported boundary geometry
- proof witnesses, private keys, or proof secrets

## Municipality Coverage

The completed AX slice records these 16 municipality/capital seeds:

| Municipality | AGID feature class | Group |
| --- | --- | --- |
| Brändö | municipality | Ålands skärgård |
| Eckerö | municipality | Ålands landsbygd |
| Finström | municipality | Ålands landsbygd |
| Föglö | municipality | Ålands skärgård |
| Geta | municipality | Ålands landsbygd |
| Hammarland | municipality | Ålands landsbygd |
| Jomala | municipality | Ålands landsbygd |
| Kumlinge | municipality | Ålands skärgård |
| Kökar | municipality | Ålands skärgård |
| Lemland | municipality | Ålands landsbygd |
| Lumparland | municipality | Ålands landsbygd |
| Mariehamn | capital | Mariehamn |
| Saltvik | municipality | Ålands landsbygd |
| Sottunga | municipality | Ålands skärgård |
| Sund | municipality | Ålands landsbygd |
| Vårdö | municipality | Ålands skärgård |

## Source Policy

The pack uses linked public evidence only. External datasets are not bundled.

Primary source links:

- Government of Åland municipality page: `https://www.regeringen.ax/sa-styrs-aland/alands-kommuner`
- GeoNames AX administrative division listing: `https://www.geonames.org/AX/administrative-division-aland-islands.html`
- Statistics and Research Åland reference: `https://www.asub.ax/`

## Verification

Run:

```powershell
npm run verify:p0-ax-complete
npm run verify:p0-gazetteer
```

Verified properties:

- AX plan validates with zero repository-plan errors.
- AX contains exactly 16 municipality/capital seeds.
- Every AX municipality is source-linked.
- Every AX municipality records a GeoNames administrative code note.
- Generated `manifest.json` place count matches `data/place-seed.json`.
- Generated conformance fixtures cover every municipality and require `mustNotReturnRawAddress`.

## Residual Risk

This is a complete public municipality seed pack, not a full address database. Building-level coverage, official boundary import, postal routing, multilingual alias expansion, and live geocoding require separate license review and import pipelines.
