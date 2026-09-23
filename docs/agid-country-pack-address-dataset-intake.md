# AGID country pack address dataset intake

AGID country packs do not start as raw address databases. They start as a
safe, auditable dataset intake plan that records source readiness, license
status, country class, generation stage, and the minimum public files needed
before a country pack can accept derived address data.

## Intake rules

- Do not bundle personal addresses, recipients, phone numbers, proof secrets,
  private AOID bodies, or raw third-party address rows.
- Treat strong-postcode countries as supplemental validation packs, not
  replacements for official postal authorities.
- Treat no-postcode countries as postal-equivalent planning packs based on AGID
  cells, route evidence slots, locality indexes, and quality gates.
- Treat weak-postcode countries as mixed packs: official sources remain
  authoritative where they exist, and AGID planning cells fill gaps only after
  source review.
- Treat island, fragile, polar, and disaster-prone regions as safety-sensitive:
  publish coarse planning evidence first and keep precision gated.

## Generated files

Run:

```bash
npm run export:country-pack-dataset-intake
```

This writes:

- `data/postal_country_packs/dataset-intake-plan.json`
- `data/postal_country_packs/dataset-intake-plan.md`

The plan currently tracks P0 countries such as JP, US, DE, HK, AE, QA, KE, GH,
TZ, FJ, VU, and AQ, then merges in every generated Postal Zone Designer country
pack target.

## Verification

Run:

```bash
npm run verify:country-pack-dataset-intake
npm run verify:postal-country-pack
```

The verification checks that generated packs remain valid, source catalogs are
linked, and every public dataset plan keeps `containsPersonalData` and
`containsRawThirdPartyData` set to `false`.
