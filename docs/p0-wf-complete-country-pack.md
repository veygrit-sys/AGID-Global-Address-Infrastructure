# P0 Complete Country Pack: WF Wallis and Futuna

Status: completed seventh P0 country slice.

## Scope

This pack turns `agid-open-wf-gazetteer` from a placeholder P0 seed into a complete country-level gazetteer slice for public chiefdom/customary-kingdom coverage.

Included:

- country seed: Wallis and Futuna
- all 3 Wallis and Futuna chiefdoms/customary kingdoms as source-linked AGID place seeds
- synthetic conformance vectors for every chiefdom
- release gates for no raw personal addresses, source links, chiefdom code notes, and fixture coverage

Excluded:

- raw personal addresses
- recipient records
- building/unit records
- private coordinates
- imported boundary geometry
- proof witnesses, private keys, or proof secrets

## Chiefdom Coverage

The completed WF slice records these 3 chiefdom/customary-kingdom seeds:

| Chiefdom | AGID feature class | GeoNames administrative code | GeoNames subentity code |
| --- | --- | --- | --- |
| Alo | chiefdom | 98611 | AL |
| Sigave | chiefdom | 98612 | SG |
| Uvea | chiefdom | 98613 | UV |

## Source Policy

The pack uses linked public evidence only. External datasets are not bundled.

Primary source links:

- French State services institutional organization page: `https://www.wallis-et-futuna.gouv.fr/Actualites/Presentation-de-Wallis-et-Futuna/Organisation-institutionnelle`
- French State services culture and heritage page: `https://www.wallis-et-futuna.gouv.fr/Actions-de-l-Etat/Culture-et-patrimoine`
- OCTA Wallis and Futuna profile: `https://www.overseas-association.eu/oct/wallis-and-futuna/`
- GeoNames WF administrative division listing: `https://www.geonames.org/WF/administrative-division-wallis-%26-futuna.html`
- GeoNames Wallis and Futuna country metadata: `https://www.geonames.org/countries/WF/wallis-and-futuna.html`

## Verification

Run:

```powershell
npm run verify:p0-wf-complete
npm run verify:p0-gazetteer
```

Verified properties:

- WF plan validates with zero repository-plan errors.
- WF contains exactly 3 chiefdom seeds.
- Every WF chiefdom is source-linked.
- Every WF chiefdom records a GeoNames administrative code note.
- Every WF chiefdom records a GeoNames subentity code note.
- Generated `manifest.json` place count matches `data/place-seed.json`.
- Generated conformance fixtures cover every chiefdom and require `mustNotReturnRawAddress`.

## Residual Risk

This is a complete public chiefdom/customary-kingdom seed pack, not a full address database. Uvea district coverage, village coverage, official boundary import, postal routing, delivery routing, multilingual alias expansion, and live geocoding require separate license review and import pipelines.
