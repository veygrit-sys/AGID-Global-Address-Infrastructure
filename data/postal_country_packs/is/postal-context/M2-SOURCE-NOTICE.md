# Iceland M2 source and reuse notice

Release: `is-byggdastofnun-postnumer-20260830`  
Retrieved: `2026-08-30T12:20:57.000Z`  
Provider: Byggðastofnun

Required attribution:

> Byggt á gögnum frá Byggðastofnun.

The provider page permits copying, reuse and publication with source
attribution and includes a provider disclaimer. AGID records that statement as
an engineering rights receipt, not a legal opinion.

## Pinned references

- Authority page: <https://www.byggdastofnun.is/is/postthjonusta/postnumer>  
  SHA-256 `acf7bddaec9becbccbd089afed9d32bf8534db9d3c80d7fa1338139b4e2793d4`
- Metadata edition 1.0: <https://gatt.natt.is/geonetwork/srv/api/records/22e98d21-a86b-4b62-ad58-a6d17703b612>  
  SHA-256 `e62f921386a7aa386c791df6ddf6a674dac8f65f67e89c3d8c0dd4208b1bf8d3`
- WFS capabilities: <https://gis.lmi.is/geoserver/byggdastofnun/wfs?service=WFS&request=GetCapabilities&version=2.0.0>  
  SHA-256 `7e6cbb6e20840b9c08bcc5a989d2902c1088364b66a13d5897e99ae8e805dd99`
- Feature schema (`byggdastofnun:postnumer`): <https://gis.lmi.is/geoserver/byggdastofnun/wfs?service=WFS&version=2.0.0&request=DescribeFeatureType&typeNames=byggdastofnun:postnumer>  
  SHA-256 `42773759acccf197dbefc0a1a9fe594009aac1baf226666308e265bee423709b`
- GeoJSON snapshot query: <https://gis.lmi.is/geoserver/byggdastofnun/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=byggdastofnun:postnumer&outputFormat=application%2Fjson&srsName=EPSG%3A4326>  
  5,670,289 bytes; SHA-256 `5a5fb67232ce16d6023204dd45b4004930db0858e9788b78ae97a0d601d2f76a`

The metadata temporal end is `2025-05-18`, the layer update is `2024-08-19`,
and the observed correction-date range is `2010-03-16` through `2025-01-17`.
The metadata declares EPSG:8086, but the service returned degree coordinates
labelled as 8086. The fixed publication query explicitly requests EPSG:4326
and was checked against the WGS84 service bounding box.

## Reproduction and exceptions

Run:

```text
node scripts/build-postal-context-is-m2.mjs <pinned-postnumer.geojson> <output-directory> <report.json>
```

The builder verifies the source digest and 175/174 feature/code identity,
preserves null source/correction dates, does not use the colliding UUID shared
by 815/816 as an identifier, unions the two code-310 features, cleans
coordinates, repairs invalid rings deterministically, checks JSTS/shared
topology, bounds, ring closure, position limits and overlap evidence, and emits
canonical JSON with descriptor byte lengths and SHA-256 digests.

The raw WFS response, authority/metadata snapshots, addresses, buildings,
customers, recipients and land-right data are not stored in AGID Git.
