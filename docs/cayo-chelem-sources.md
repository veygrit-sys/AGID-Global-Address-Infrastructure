# Cayo Chelem island review

Mexico's national island catalogue lists Cayo Chelem in Othón P. Blanco, Quintana Roo, at 18°11′34.780″ N, 87°53′10.895″ W. The national island geometry identifies it as natural coastal mangrove land, element 848. The corrected archive distributed with the version 2.0 publication contains the layer `elementos_insulares_cdtim_v2_1_2018`. Its Cayo Chelem polygon has 19 interior holes. [Official catalogue, Quintana Roo entry 35](https://snieg.inegi.org.mx/Documentos/IIN/Acuerdo_14_III_2022/catal_insular_terri_mexicano.pdf) · [Official vector data and erratum](https://www.inegi.org.mx/app/biblioteca/ficha.html?upc=889463039839)

AGID displays MX where that island polygon intersects the full-resolution GSHHG shoreline of island 6815. Elsewhere within the same footprint, Natural Earth's Belize island component and the FieldMaps Mexico polygons overlap on GSHHG land. Where the national island polygon excludes this overlap, AGID reports inconsistent source geometry and leaves the country undetermined. The GSHHG representative point at 18.188°, −87.88240989966037° falls within that difference. Nearby Ambergris Caye retains its own country attribution. Claims and postal destinations are independent of this source comparison.

## Reproduce

Run from the repository root using Python 3 and GDAL with GEOS. The script checks the SHA-256 of the source files and pack editions before clipping the original polygons. It transforms the INEGI source coordinate system into longitude and latitude using traditional GIS axis order.

```sh
python3 scripts/build-island-border-review.py world.sqlite ne_10m_admin_0_map_units.geojson 889463039839_s.zip
node --import tsx --test src/lib/islandBorderDisagreement.test.ts
```

Fuente: INEGI, Conjunto de datos del Territorio Insular Mexicano, escala 1:50 000, versión 2.0, capa corregida en 2018. AGID clips this source to the physical island. [Original archive](https://www.inegi.org.mx/contenidos/productos/prod_serv/contenidos/espanol/bvinegi/productos/geografia/terr_ins_mex/889463039839_s.zip) · [INEGI terms of free use](https://www.inegi.org.mx/contenidos/inegi/doc/terminos_info.pdf)

GSHHG 2.3.7 by Paul Wessel and Walter H. F. Smith supplies the physical shoreline under LGPL-3.0-or-later. Administrative inputs use the public-domain Natural Earth v5.1.2 map units and FieldMaps international USGS/LSIB 2025-07-29. [GSHHG sources and notices](../scripts/data/national-island-points/licenses/) · [Pack source data and rebuild](high-resolution-island-pack.md) · [Natural Earth source GeoJSON](https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_0_map_units.geojson)
