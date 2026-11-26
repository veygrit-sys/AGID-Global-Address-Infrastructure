# Physical landform evidence

The standard AGID lookup classifies the physical land component and the administrative area independently. The landform source ID refers to a component of the Natural Earth 5.1.2 physical land geometry. The generator merges the split sheets of a component along matching antimeridian segments. Neither the number of disconnected administrative parts nor a bounding rectangle establishes that a place is an island.

## World layer

The generator checks the Natural Earth map unit against the corresponding physical coastline. For 117 map-unit parts with a positive area beyond that coastline, it stores the intersection with the physical land. The underlying administrative edition has 4,080 map-unit pieces after joining seams. Positive mainland cells additionally require complete coverage of the same continent in GSHHG, and cells touched by another GSHHG ocean island are excluded.

A 1/16-degree index records interiors, coastal uncertainty and hydrography. A physical land cell must avoid the mapped coastline, GSHHG inland water and the Natural Earth river network. The water hierarchy uses lakes, the islands inside them, and ponds on those islands. An affirmative inland-water result requires coverage throughout the cell or throughout the queried footprint by a selected water polygon. Cells that merely touch water can withhold landform without assigning water. Water polygons retained at full local detail are selected from bodies containing an island representative point, lakes of at least 200 km² on mapped islands, and lakes intersecting the regional review windows. Dry islands are subtracted before storing a strictly interior water shape. Features missing from these source editions and newly formed land or water can remain unrecognised.

At eight verified shared islands, AGID reports the other mapped countries on the same physical island only inside an independently corroborated GSHHG interior. A pin can still resolve its own region nearer the shore. The list reflects the presence of countries elsewhere on that island and cannot change the pin's country or select a delivery destination.

## Near European borders and other reviewed locations

The regional data cover Baarle, Büsingen, Campione, Llívia, the Vatican, San Marino, Maseru, Cabinda, Nakhchivan and Point Roberts. Each positive block comprises four by four source pixels in ESA WorldCover 2021 v200, approximately 0.000333 degrees in each direction. Every pixel in the block and a one-pixel margin must have a dry-land class. All must connect via four-neighbour dry pixels to the regional mainland reference. This excludes reservoir islets. A separate check requires continental land coverage in both shoreline sources and excludes mapped river and lake contacts. The region files record only positive dry-land blocks; a gap in this layer does not establish water or change jurisdiction.

ESA WorldCover regional data credit: © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium. The regional dry-land masks adapt the satellite land cover classification. See Zanaga et al. (2022), *ESA WorldCover 10 m 2021 v200*. [Dataset and citation](https://doi.org/10.5281/zenodo.7254221) · [Terms and attribution](https://esa-worldcover.org/en/data-access) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Physical coastlines and inland waters use GSHHG 2.3.7 by Paul Wessel and Walter H. F. Smith (2017). GSHHG-derived regional masks and geometries carry the original LGPL-3.0-or-later terms. Natural Earth land, map units and river centerlines use the public-domain 5.1.2 edition. [GSHHG project](https://www.soest.hawaii.edu/pwessel/gshhg/) · [Exact GSHHG source release](https://github.com/GenericMappingTools/gshhg-gmt/releases/tag/2.3.7) · [Included original notices and licence text](../scripts/data/national-island-points/licenses/) · [Natural Earth sources](https://github.com/nvkelso/natural-earth-vector/tree/v5.1.2/geojson) · [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/)

## Rebuild

Use Python 3.11+, GDAL with GEOS, NumPy and SciPy. The builders verify source SHA-256 values; regional COG source rectangles have individual checksums in `scripts/data/landform-worldcover-windows.json`. Raw archives and remote raster pixels are only needed when rebuilding. The standard web and CLI lookup read bundled files locally.

```sh
python3 scripts/build-global-islands.py ne_10m_admin_0_map_units.geojson ne_10m_land.geojson
python3 scripts/build-global-landforms.py ne_10m_land.geojson ne_10m_rivers_lake_centerlines.geojson gshhg-shp-2.3.7.zip
python3 scripts/build-regional-landforms.py ne_10m_land.geojson ne_10m_rivers_lake_centerlines.geojson gshhg-shp-2.3.7.zip --cache-dir /tmp/agid-worldcover
python3 scripts/build-selected-inland-waters.py gshhg-shp-2.3.7.zip
node --import tsx --test src/lib/globalIslands.test.ts
```
