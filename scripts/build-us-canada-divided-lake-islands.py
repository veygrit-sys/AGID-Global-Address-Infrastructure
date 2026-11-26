#!/usr/bin/env python3
"""Build two local WGS84 island extracts. Python 3.11+, GDAL, Shapely 2, pyproj.

Usage: python3 scripts/build-us-canada-divided-lake-islands.py INPUT_DIRECTORY
The directory contains the four files in INPUTS. Missing files are downloaded
with --download. Check their complete SHA-256 digests before reading geometry.
"""
import argparse
from hashlib import file_digest
import json
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.parse import urlencode
from urllib.request import urlopen

from osgeo import ogr
from pyproj import Transformer
from shapely import force_2d, from_wkb, normalize
from shapely.geometry import Point, Polygon, box, shape
from shapely.ops import transform, unary_union

from us_canada_boundary import IBC_SHA256, IBC_URL, border_for_extent, load_boundary, split_island

ogr.UseExceptions()
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / 'src/data/usCanadaDividedLakeIslands.json'
NHD_LAYER = 'https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/12'
PROVINCE_URL = NHD_LAYER + '/query?' + urlencode(dict(
    f='geojson', outFields='OBJECTID,gnis_name,permanent_identifier', outSR=4326,
    where="gnis_name='Lake Memphremagog'"))
METIGOSHE_URL = NHD_LAYER + '/query?' + urlencode(dict(
    f='geojson', objectIds=2166435, outSR=4326,
    outFields='OBJECTID,FDATE,PERMANENT_IDENTIFIER,GNIS_NAME,FTYPE,FCODE', returnGeometry='true'))
NHN_URL = 'https://ftp.maps.canada.ca/pub/nrcan_rncan/vector/geobase_nhn_rhn/shp_en/05/nhn_rhn_05nfc00_shp_en.zip'
QUEBEC_NAME = 'https://toponymie.gouv.qc.ca/ct/ToposWeb/Fiche.aspx?no_seq=141213'
PARK_MAP = 'https://www.parkrec.nd.gov/sites/www/files/documents/Destinations/Lake%20Metigoshe/lmsp_main_map.pdf'
NAIP_ITEMS = [
    'https://planetarycomputer.microsoft.com/api/stac/v1/collections/naip/items/nd_m_4810006_nw_14_060_20190727_20191024',
    'https://planetarycomputer.microsoft.com/api/stac/v1/collections/naip/items/nd_m_4810006_nw_14_060_20220730',
    'https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer/117792',
]
INPUTS = {
    'lake-memphremagog.geojson': (PROVINCE_URL, '84f3e2f04bdaac59dca7e8910a3281d644d4ebaf0a17659f2a26c159a6fb4f3a'),
    'lake-metigoshe.geojson': (METIGOSHE_URL, '9c042b78770e6bbcdd5bc7d3f75dba13f65d8c10b1e0419eb169a8266ca93b9a'),
    'nhn_rhn_05nfc00_shp_en.zip': (NHN_URL, '65496268f960eeaa86365111f51473079e9f17e939733fa9b0169e43bcb8729b'),
    'us-canada-boundary-v1-3.zip': (IBC_URL, IBC_SHA256),
}
PROVINCE_BOUNDS = [-72.241, 45.0028, -72.227, 45.0144]
METIGOSHE_BOUNDS = [-100.3553, 48.9969, -100.3532, 48.9998]
# The source's two NHN island IDs meet along an administrative delimiter,
# which records both IDs. Neither side of this internal edge is a lake.
NHN_ISLAND = ('8b38bd674a4744e9836ce53aef56d6d2', '8180b7723f034f27882ae45e7fde1627')
NHN_LAKE = ('88e5567d67e24a169bbb7e46b5f8456f', 'eb99806862574dd38372ddd9458ee030')
NHN_DELIMITER = 'ceb341ed361c4f46861a2072b13dce9e'


def read_inputs(directory, download):
    for filename, (url, digest) in INPUTS.items():
        path = directory / filename
        if download and not path.exists():
            directory.mkdir(parents=True, exist_ok=True)
            with NamedTemporaryFile(dir=directory, delete=False) as stream:
                temporary = Path(stream.name)
            try:
                with urlopen(url, timeout=120) as response:
                    temporary.write_bytes(response.read())
                with temporary.open('rb') as stream:
                    if file_digest(stream, 'sha256').hexdigest() != digest:
                        raise ValueError(f'Unexpected download edition: {filename}')
                temporary.replace(path)
            finally:
                temporary.unlink(missing_ok=True)
        with path.open('rb') as stream:
            if file_digest(stream, 'sha256').hexdigest() != digest:
                raise ValueError(f'Unexpected source edition: {filename}')


def read_nhd(path, persistent_id):
    feature, = json.loads(path.read_text())['features']
    if feature['properties']['PERMANENT_IDENTIFIER'] != persistent_id:
        raise ValueError(f'Unexpected lake in {path}')
    lake = shape(feature['geometry'])
    if lake.geom_type != 'Polygon' or not lake.is_valid:
        raise ValueError('NHD waterbody must have a valid shoreline')
    return lake


def island_hole(lake, anchor):
    island, = (Polygon(ring) for ring in lake.interiors if Polygon(ring).contains(Point(anchor)))
    return island


def nhn_layer(dataset, layer, ids):
    features = dataset.GetLayerByName('NHN_05NFC00_2_0_' + layer)
    if features.GetSpatialRef().GetAuthorityCode(None) != '4617':
        raise ValueError('Expected NAD83(CSRS) input')
    results = []
    for identifier in ids:
        features.SetAttributeFilter(f"NID='{identifier}'")
        feature, = features
        geometry = force_2d(from_wkb(bytes(feature.geometry().ExportToWkb())))
        results.append((geometry, feature.items()))
    return results


def nhn_surfaces(archive):
    dataset = ogr.Open('/vsizip/' + str(archive.resolve()))
    island_records = nhn_layer(dataset, 'HD_ISLAND_2', NHN_ISLAND)
    lake_records = nhn_layer(dataset, 'HD_WATERBODY_2', NHN_LAKE)
    (delimiter, links), = nhn_layer(dataset, 'HN_DELIMITER_1', (NHN_DELIMITER,))
    north, south = [record[0] for record in island_records]
    if ((links['ISLANDNID1'], links['ISLANDNID2']) != NHN_ISLAND or links['TYPE'] != 4
            or links['WATBODNID1'] or links['WATBODNID2']
            or not north.intersection(south).equals(delimiter)):
        raise ValueError('Expected adjoining island pieces sharing their documented delimiter')
    if any(fields['LAKENAME_1'] != 'Metigoshe Lake' for _, fields in lake_records):
        raise ValueError('Unexpected NHN waterbody')
    island = north.union(south)
    lake = unary_union([piece for piece, _ in lake_records])
    if island.geom_type != 'Polygon' or not island.is_valid or lake.intersection(island).area:
        raise ValueError('Conflicting Canadian land / lake topology')
    # EPSG:1946 formally accepts and returns latitude,longitude.
    operation = Transformer.from_pipeline('urn:ogc:def:coordinateOperation:EPSG::1946')

    def wgs84(x, y):
        latitude, longitude = operation.transform(y, x)
        return longitude, latitude

    return transform(wgs84, island), transform(wgs84, lake)


def polygons(geometry):
    if geometry.is_empty:
        return []
    if geometry.geom_type == 'Polygon':
        return [geometry]
    if geometry.geom_type in ('MultiPolygon', 'GeometryCollection'):
        return [polygon for part in geometry.geoms for polygon in polygons(part)]
    return []


def pack(geometry):
    records = []
    for poly in sorted(polygons(geometry), key=lambda p: p.bounds):
        poly = normalize(poly)
        if not poly.is_valid:
            raise ValueError('Invalid output polygon')
        records.append({'bbox': list(poly.bounds),
                        'rings': [list(r.coords) for r in [poly.exterior, *poly.interiors]]})
    return records


def make_window(identifier, name, bounds, boundary, island, dry, wet, ca_pin, us_pin, version, credit, urls):
    frame = box(*bounds)
    if not frame.contains(island) or dry.difference(island).area or wet.intersection(dry).area:
        raise ValueError(f'Unexpected surface relationship for {identifier}')
    sides = split_island(island, boundary, ca_anchor=ca_pin, us_anchor=us_pin)
    # Keep artificial water polygon clip edges strictly outside the review window.
    west, south, east, north = bounds
    clip = box(west - .001, south - .001, east + .001, north + .001)
    owners = [dict(code=code, **record) for code, side in sides.items()
              for record in pack(side.intersection(dry))]
    return dict(id=identifier, name=name, bbox=bounds, land=pack(dry), water=pack(wet.intersection(clip)),
                owners=owners, crossesBorder=True, border=list(border_for_extent(boundary, bounds).coords),
                source='us-ca-reviewed-shorelines+' + identifier, version=version, attribution=credit,
                evidenceUrls=urls)


def build(directory):
    boundary = load_boundary(directory / 'us-canada-boundary-v1-3.zip')
    lake = read_nhd(directory / 'lake-memphremagog.geojson', '{3718B299-058F-46AA-93F6-11C7A1C3AE3D}')
    ca_pin, us_pin = (-72.23235, 45.00867), (-72.2310, 45.00431)
    province = island_hole(lake, ca_pin)
    province_window = make_window('province-island', 'Province Island / Île de la Province',
        PROVINCE_BOUNDS, boundary, province, province, lake, ca_pin, us_pin,
        'USGS NHD 2771880; IBC v1.3',
        'U.S. Geological Survey (public domain); © International Boundary Commission (Open Government Licence – Canada)',
        [PROVINCE_URL, IBC_URL, QUEBEC_NAME])

    us_lake = read_nhd(directory / 'lake-metigoshe.geojson', '143178154')
    ca_island, ca_lake = nhn_surfaces(directory / 'nhn_rhn_05nfc00_shp_en.zip')
    ca_pin, us_pin = (-100.353920, 48.999400), (-100.354330, 48.998450)
    # NHD has two disjoint holes. The mapped northern hole has only a few
    # metres of interior and 2019/2022/2023 NAIP shows a lake-like response
    # there. Withhold that whole component. NHD water through the Canadian
    # island also remains unresolved, including the surveyed boundary crossing.
    north, south = island_hole(us_lake, ca_pin), island_hole(us_lake, us_pin)
    if not north.disjoint(south) or not ca_island.contains(Point(ca_pin)):
        raise ValueError('Expected discordant northern island component')
    dry = ca_island.intersection(south)
    # Only affirmative lake polygons from both agencies can produce water.
    wet = ca_lake.intersection(us_lake)
    metigoshe_window = make_window('metigoshe-island', 'Lake Metigoshe boundary island',
        METIGOSHE_BOUNDS, boundary, ca_island, dry, wet, ca_pin, us_pin,
        'NRCan NHN 05NFC00 v2.0; USGS NHD 2166435 (2016-11-04); USDA NAIP 2019/2022/2023; IBC v1.3',
        'Natural Resources Canada and © International Boundary Commission (Open Government Licence – Canada); '
        'U.S. Geological Survey and USDA Farm Service Agency (public domain)',
        [NHN_URL, METIGOSHE_URL, IBC_URL, PARK_MAP, *NAIP_ITEMS])
    metigoshe_window['sharedIslandBasis'] = 'hydrographic-record'
    if [record['code'] for record in metigoshe_window['owners']] != ['US']:
        raise ValueError('Only the corroborated southern dry component should have an owner')
    return {'windows': [province_window, metigoshe_window]}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input_directory', type=Path)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    read_inputs(args.input_directory, args.download)
    args.output.write_text(json.dumps(build(args.input_directory), ensure_ascii=False, separators=(',', ':')) + '\n')
