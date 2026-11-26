"""Extract the surveyed US–Canada centreline and cut a corroborated dry island.

The source is the International Boundary Commission digital boundary v1.3.
Both national metadata XML files in the ZIP specify the Open Government
Licence – Canada. It is a cartographic representation of the survey; a point
on the drawn line cannot certify a legal parcel boundary.
"""
from hashlib import file_digest
from math import isclose
from pathlib import Path

from osgeo import ogr
from shapely import from_wkb
from shapely.geometry import LineString, MultiLineString, Point, box
from shapely.ops import split, unary_union

IBC_URL = 'https://www.internationalboundarycommission.org/uploads/shapefile/us-canada-boundary-v1-3.zip'
IBC_SHA256 = 'eb327459528b87cbc27e55ccc6bfd6982562c75559823a00b6dc50c04abcaab1'

# Each of these two local sections crosses the island west/east. Northern
# Canada is checked against actual interior control pins after cutting.
SECTIONS = {
    11: 'West Line (QC/VT)',
    20: '49th Parallel (MB/ND)',
}


def load_boundary(archive: Path) -> MultiLineString:
    archive = Path(archive).resolve()
    with archive.open('rb') as stream:
        if file_digest(stream, 'sha256').hexdigest() != IBC_SHA256:
            raise ValueError('Unexpected International Boundary Commission ZIP edition')
    dataset = ogr.Open(f'/vsizip/{archive}/US-Canada_Boundary_v1.3.shp')
    layer = dataset.GetLayer()
    crs = layer.GetSpatialRef()
    crs.AutoIdentifyEPSG()
    if crs.GetAuthorityCode(None) != '4269':
        raise ValueError('Expected NAD83 coordinates in the IBC source')

    found = {}
    for feature in layer:
        number = feature['SectionNum']
        if number not in SECTIONS:
            continue
        if feature['SectionEng'] != SECTIONS[number] or number in found:
            raise ValueError(f'Unexpected IBC section {number}')
        # Apply NAD83 to WGS 84 (1), EPSG:1188. Horizontal lon/lat values
        # are unchanged for this continental-US 0-translation transformation.
        # Keep all vertices, including the IBC's intermediate geodesic points.
        found[number] = from_wkb(bytes(feature.geometry().ExportToWkb()))
    if found.keys() != SECTIONS.keys():
        raise ValueError('Missing IBC section for one of the two reviewed islands')
    return MultiLineString(found.values())


def border_for_extent(boundary: MultiLineString, bounds) -> LineString:
    """The original section vertices bracketing an island, ordered west to east."""
    west, south, east, north = bounds
    envelope = box(west, south, east, north)
    sections = [section for section in boundary.geoms if section.intersects(envelope)]
    if len(sections) != 1:
        raise ValueError('Island envelope must intersect one surveyed section')
    coords = list(sections[0].coords)
    touching = [i for i, (a, b) in enumerate(zip(coords, coords[1:]))
                if LineString([a, b]).intersects(envelope)]
    path = coords[touching[0]:touching[-1] + 2]
    if path[0][0] > path[-1][0]:
        path.reverse()
    if (path[0][0] >= west or path[-1][0] <= east
            or any(a[0] >= b[0] for a, b in zip(path, path[1:]))):
        raise ValueError('Survey line does not bracket the full island west to east')
    return LineString(path)


def split_island(island, boundary: MultiLineString, *, ca_anchor, us_anchor):
    """Cut physical land once so both country pieces share identical edge vertices.

    Independent dry anchor coordinates are in (longitude, latitude) order.
    A source conflict, a tangent or an island entirely on one side fails closed.
    """
    if island.is_empty or not island.is_valid or island.geom_type not in ('Polygon', 'MultiPolygon'):
        raise ValueError('Expected a valid surveyed island polygon')
    line = border_for_extent(boundary, island.bounds)
    coords = list(line.coords)
    sides = {'CA': [], 'US': []}
    for part in split(island, line).geoms:
        point = part.representative_point()
        for (x1, y1), (x2, y2) in zip(coords, coords[1:]):
            if x1 <= point.x <= x2:
                border_y = y1 + (point.x - x1) * (y2 - y1) / (x2 - x1)
                if point.y == border_y:
                    raise ValueError('Ambiguous country for a cut island interior')
                sides['CA' if point.y > border_y else 'US'].append(part)
                break
        else:
            raise ValueError('Island piece outside surveyed longitude extent')

    owners = {}
    for code, anchor in [('CA', ca_anchor), ('US', us_anchor)]:
        piece = unary_union(sides[code])
        if not piece.is_valid or not piece.contains(Point(*anchor)):
            raise ValueError(f'Independent {code} land control does not match the surveyed cut')
        owners[code] = piece
    if not isclose(sum(piece.area for piece in owners.values()), island.area, rel_tol=1e-12):
        raise ValueError('Survey split does not conserve island land area')
    return owners
