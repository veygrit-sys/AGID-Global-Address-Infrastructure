# P0 Gazetteer Batch 48-49 Completion

This batch completes two Sovereign Base Area public gazetteer seed packs.

## 48. Dhekelia (`XD`)

Repository folder:

```text
data/open_geo_repositories/agid-open-xd-gazetteer
```

Public anchors:

- Eastern Sovereign Base Area
- Dhekelia Area Administration Office Reference
- Dhekelia Cantonment Reference
- Agios Nikolaos Special Area of Conservation
- Cape Pyla Special Area of Conservation
- Xylotymbou-Xylophagou-Ormidhia Community Cluster Reference

Safety boundary:

- No operational-status claim
- No military-unit or facility-detail claim
- No security-status claim
- No access-right, crossing-rule, postal-validity, or delivery-availability claim
- No enclave-boundary geometry or legal advice bundled

Primary source links:

- Sovereign Base Areas Administration
- SBAA Area Administration Offices
- SBAA Local Government Reform
- SBAA Environment and SAC pages
- SBAA Declaration regarding administration of the areas
- GeoNames public place-name search cross-reference

## 49. Akrotiri (`XU`)

Repository folder:

```text
data/open_geo_repositories/agid-open-xu-gazetteer
```

Public anchors:

- Western Sovereign Base Area
- Akrotiri Area Administration Office Reference
- Episkopi Headquarters Reference
- Akrotiri Peninsula Environmental Reference
- Akrotiri Special Area of Conservation
- Avdimou-Paramali Community Cluster Reference

Safety boundary:

- No operational-status claim
- No military-function or facility-detail claim
- No security-status claim
- No access-right, crossing-rule, postal-validity, or delivery-availability claim
- No protected-area geometry, permit decision, or legal advice bundled

Primary source links:

- Sovereign Base Areas Administration
- SBAA Area Administration Offices
- SBAA Local Government Reform
- SBAA Environment and SAC pages
- SBAA Declaration regarding administration of the areas
- GeoNames public place-name search cross-reference

## Verification

Run:

```powershell
npm run verify:p0-batch-48-49-complete
npm run verify:p0-gazetteer
```

The batch-specific test checks:

- source-linked place seeds
- conformance vectors for every public anchor
- SBAA and GeoNames source links
- release gates for complete SBA public anchors
- non-claims around military operation, security, access, postal validity, delivery availability, and legal advice
