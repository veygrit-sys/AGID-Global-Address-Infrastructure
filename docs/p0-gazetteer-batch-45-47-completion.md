# P0 Gazetteer Batch 45-47 Completion

This note records the forty-fifth through forty-seventh P0 critical open-geodata
gazetteer repository slices.

## Completed slices

| Rank | Code | Repository | Scope | Place seeds | Public anchor vectors |
| ---: | --- | --- | --- | ---: | ---: |
| 45 | CL-DI | `agid-open-cl-di-gazetteer` | Desventuradas Islands | 7 | 6 |
| 46 | CL-SG | `agid-open-cl-sg-gazetteer` | Salas y Gomez Island | 6 | 5 |
| 47 | CP | `agid-open-cp-gazetteer` | Clipperton Island | 7 | 6 |

## Safety posture

These repositories are source-linked seed packs. They include public place-name
metadata, AGID place IDs, upstream source links, and synthetic conformance
fixtures.

They intentionally do not include:

- raw addresses or recipient records
- private coordinates or witness/proof material
- boundary geometries, maritime-boundary extracts, or cadastral parcels
- landing, mooring, public-access, route-safety, rescue, postal, or delivery
  availability claims
- legal advice about protected areas, maritime zones, permits, or jurisdiction

## Source model

- Desventuradas uses Chilean SUBPESCA, Chilean Ministry of Environment, Marine
  Regions, GeoNames, and Wikidata links.
- Salas y Gomez uses Chilean National Monuments Council, SIMBIO/MMA, Marine
  Regions, GeoNames, and Wikidata links.
- Clipperton uses the French Overseas Ministry, Legifrance, Marine Regions,
  GeoNames, and Wikidata links.

All upstream materials remain linked as metadata. No upstream datasets are
bundled.

## Verification

Run:

```bash
npm run verify:p0-batch-45-47-complete
npm run verify:p0-batch-41-44-complete
npm run verify:p0-gazetteer
npm run lint
```

