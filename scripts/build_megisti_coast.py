"""Cross-check ELSTAT's Megisti municipality against FieldMaps terrestrial shapes.

The caller supplies pack_polygons, an iterable encoder for polygonal OGR
geometries at the same coordinate scale as the other coastal windows.
"""
import hashlib
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZipFile

from osgeo import ogr, osr

ARCHIVE_SHA = 'b16817eb6f1a2c2527a598c3d7e6c0a16a4bc017f756d64ceedcb963d96d1174'
SOURCE = {
    'source_id': 'elstat-2021-megisti+fieldmaps-usgs-lsib',
    'source_version': 'ELSTAT Census 2021 (2024-07-09) + FieldMaps 2025-07-29',
    'source_url': 'https://www.statistics.gr/documents/20181/1194366/DHMOI_2021.zip/55e3ba79-3475-70b8-5f8a-b912eeee389c',
    'archive_sha256': ARCHIVE_SHA,
    'terms': 'https://www.statistics.gr/documents/20181/1412250/Copyright_Reuse_Policy_EN.pdf/dfacb7d1-3d9b-471f-851a-8b8b09994a74',
    'attribution': 'Hellenic Statistical Authority (ELSTAT), https://www.statistics.gr/el/digital-cartographical-data, 2021 census municipalities. AGID reprojected, clipped and intersected the data with FieldMaps coastlines. ELSTAT bears no responsibility for the result of these modifications. Based on census geography.',
}
BBOX = [29.47, 36.095, 29.67, 36.205]


def megisti_census_land(archive):
    with Path(archive).open('rb') as stream:
        if hashlib.file_digest(stream, 'sha256').hexdigest() != ARCHIVE_SHA:
            raise ValueError('Unexpected ELSTAT source hash')
    with TemporaryDirectory() as temp, ZipFile(archive) as zipped:
        for name in zipped.namelist():
            part = Path(name)
            if part.stem == 'Municipalities2021' and part.suffix in {'.shp', '.shx', '.dbf', '.prj', '.cpg'}:
                (Path(temp) / part.name).write_bytes(zipped.read(name))
        ds = ogr.Open(str(Path(temp) / 'Municipalities2021.shp'))
        layer = ds.GetLayer()
        layer.SetAttributeFilter("CODE = '6902'")
        if layer.GetFeatureCount() != 1:
            raise ValueError('Expected exactly one Megisti census municipality')
        feature = layer.GetNextFeature()
        if feature['NAME_ENG'] != 'Municipality of Megisti':
            raise ValueError('ELSTAT municipality identifier drift')
        shape = feature.GetGeometryRef().Clone()
        wgs84 = osr.SpatialReference()
        wgs84.ImportFromEPSG(4326)
        wgs84.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
        shape.Transform(osr.CoordinateTransformation(layer.GetSpatialRef(), wgs84))
        return shape


def build_megisti(archive, land_layer, ocean_layer, pack_polygons):
    # A belt outside the public window keeps clipping edges out of classification.
    w, s, e, n = BBOX
    ring = ogr.Geometry(ogr.wkbLinearRing)
    for x, y in [(w-.02,s-.02),(e+.02,s-.02),(e+.02,n+.02),(w-.02,n+.02),(w-.02,s-.02)]:
        ring.AddPoint_2D(x, y)
    clip = ogr.Geometry(ogr.wkbPolygon)
    clip.AddGeometry(ring)
    census = megisti_census_land(archive).Intersection(clip)
    # Turkey's unambiguous mainland is a separate continuous polygon. The TR
    # code on the detached polygons in this particular FieldMaps edition is
    # demonstrably wrong; use such polygons only as independent land shapes.
    mainland = None
    detached = ogr.Geometry(ogr.wkbMultiPolygon)
    kas = ogr.CreateGeometryFromWkt('POINT (29.64 36.20)')
    land_layer.SetSpatialFilter(clip)
    for feature in land_layer:
        if feature['iso_2'] != 'TR' or feature['status_nm'] != 'State':
            raise ValueError('Unreviewed FieldMaps feature at Megisti')
        for part in feature.GetGeometryRef():
            if not part.Intersects(clip):
                continue
            if part.Contains(kas):
                if mainland is not None:
                    raise ValueError('Ambiguous Turkish mainland reference')
                mainland = part.Intersection(clip)
            else:
                detached.AddGeometry(part)
    if mainland is None or census.Intersects(mainland):
        raise ValueError('Overlapping or missing mainland in Megisti sources')
    detached = detached.UnionCascaded().Intersection(clip)
    greek = census.Intersection(detached)
    # Source disagreements and unattested detached islets have neither a
    # country nor a water assignment. The ocean product must positively
    # support water and no participating terrestrial source may cover it.
    land_union = census.Union(detached).Union(mainland)
    ocean_layer.SetSpatialFilter(clip)
    water = []
    for feature in ocean_layer:
        patch = feature.GetGeometryRef().Intersection(clip).Difference(land_union)
        water.extend(pack_polygons(patch))
    surfaces = {'GR': list(pack_polygons(greek)), 'TR': list(pack_polygons(mainland)), 'water': water}
    for record in surfaces['GR']:
        record['isolatedIsland'] = True  # Only intersected, detached land can enter this layer.
    for parts in surfaces.values():
        parts.sort(key=lambda p: (p['bbox'], p['rings']))
    return {'name': 'Megisti islands and Kas coast', 'bbox': BBOX, 'surfaces': surfaces}
