#!/usr/bin/env python3
"""Rebuild four Canadian Great Lakes / St. Lawrence extracts. Python 3.11+, GDAL and Shapely 2.

Usage: python3 scripts/build_canada_freshwater_reviewed.py INPUT_DIRECTORY [--download]
Downloads are optional. Every file, including each unmodified Ontario hydro
response, is checked against the edition used for the distributed extract.
"""
import argparse
from importlib import import_module
import json
from pathlib import Path
from shutil import copyfileobj
from tempfile import NamedTemporaryFile
from urllib.parse import urlencode
from urllib.request import urlopen

from osgeo import ogr
from shapely import from_wkb, make_valid, union_all
from shapely.geometry import Point, Polygon, box, shape
from shapely.ops import split

from us_canada_boundary import IBC_SHA256, IBC_URL

common = import_module('build-northern-central-america-review')
shore = import_module('build-us-canada-shorelines')
OUTPUT = Path(__file__).resolve().parents[1] / 'src/data/canadaFreshwaterReviewed.json'
INVENTORY = 'GreatLakesIslandsInt.zip'
INVENTORY_URL = 'https://ws.gisetl.lrc.gov.on.ca/fmedatadownload/Packages/' + INVENTORY
TIGER = 'tl_2025_36089_areawater.zip'
TIGER_URL = 'https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/' + TIGER
TIGER_SHA = 'b0b99119fc3703e2dcd74f964049ef71040197fd2a0fa6be9b246a866504c7ee'
IBC = 'us-canada-boundary-v1-3.zip'
OHN = 'https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open01/MapServer/25'
ONTARIO_CREDIT = 'Contains information licensed under the Open Government Licence – Ontario. Adapted from the Ontario Ministry of Natural Resources Great Lakes Islands inventory and Ontario Hydro Network waterbodies.'

# Bboxes select where the survey can be queried. They never assign ownership
# or imply that a place outside a catalogue polygon is water.
WINDOWS = {
    'ca-flowerpot': ('Flowerpot Island, Georgian Bay', [-81.642, 45.291, -81.608, 45.310],
                     70347848, (), '5389338c27062a98472533708d61556c44468c16e29475fdcf231a1c162ee7d4',
                     'https://parks.canada.ca/amnc-nmca/on/fathomfive/visit'),
    'ca-chantry': ('Chantry Island, Lake Huron', [-81.410, 44.484, -81.397, 44.496],
                   67817948, (851100845, 851100837, 851100830, 851100808, 851100804, 851100796, 851100789),
                   '117a952b8f3114671fa17a9b45589a2c1aa6eca27594372dffbb0a66bd575219',
                   'https://www.canada.ca/en/environment-climate-change/services/migratory-bird-sanctuaries/locations/chantry-island.html'),
    'ca-beausoleil': ('Beausoleil and Little Beausoleil, Georgian Bay', [-79.850, 44.873, -79.826, 44.888],
                      320992539, (100367424, 100367414), '8138e4f3fc9df126ed7000dd434ad83a8a152ad911eb2063c16844c767423952',
                      'https://parks.canada.ca/pn-np/on/georg/visit'),
    'ca-ice-dark': ('Ice Island and Dark Island, St. Lawrence River', [-75.837, 44.449, -75.809, 44.461],
                    321973630, (), 'f531eda33bac956e51a1f32cc1b90e3e664e5169ab203e24ce95b61d73837a9c',
                    'https://www.internationalboundarycommission.org/en/maps-coordinates/coordinates.php'),
}


def hydro_request(ids):
    return OHN + '/query?' + urlencode(dict(
        where='OGF_ID IN (' + ','.join(map(str, sorted(ids))) + ')',
        outFields='OGF_ID,OFFICIAL_NAME_LABEL,PERMANENCY', orderByFields='OGF_ID', outSR=4326, f='geojson'))


def obtain(path, url, expected, download):
    if not path.exists() and download:
        with NamedTemporaryFile(dir=path.parent, delete=False) as tmp:
            temporary = Path(tmp.name)
        try:
            with urlopen(url, timeout=120) as response, temporary.open('wb') as dest:
                copyfileobj(response, dest)
            common.check(temporary, expected)
            temporary.replace(path)
        finally:
            temporary.unlink(missing_ok=True)
    common.check(path, expected)
    return path


def hydro_areas(source, frame):
    # Only a closed interior ring is evidence of an island. The uncharted side
    # of a river section, tile edge or country border is never inferred to be land.
    enclosed = [Polygon(ring).intersection(frame) for polygon in common.polygons(make_valid(source))
                for ring in polygon.interiors if box(*ring.bounds).intersects(frame)]
    return make_valid(source).intersection(frame), union_all(enclosed)


def canada_hydro(path, main_id, pond_ids, frame):
    collection = json.loads(path.read_bytes())
    rows = {f['properties']['OGF_ID']: f for f in collection['features']}
    if set(rows) != {main_id, *pond_ids} or any(f['properties']['PERMANENCY'] != 'Permanent' for f in rows.values()):
        raise ValueError(f'Unexpected permanent OHN water body records in {path.name}')
    main_water, holes = hydro_areas(shape(rows[main_id]['geometry']), frame)
    ponds = union_all([shape(rows[pid]['geometry']).intersection(frame) for pid in pond_ids])
    return main_water, holes, ponds


def us_river(archive, frame):
    ds = ogr.Open('/vsizip/' + str(archive.resolve()))
    layer = ds.GetLayer()
    layer.SetAttributeFilter("HYDROID='110763341838' AND MTFCC='H3010'")
    feature, = layer
    return hydro_areas(shore.to_wgs(feature.geometry(), shore.wgs_transform(layer)), frame)


def river_sides(archive, frame):
    ds = ogr.Open('/vsizip/' + str(archive.resolve()))
    layer = ds.GetLayer()
    layer.SetAttributeFilter('SectionNum=13')
    section, = layer
    if section['SectionEng'] != 'St. Lawrence River':
        raise ValueError('Expected St. Lawrence River section in IBC v1.3')
    line = shore.to_wgs(section.geometry(), shore.wgs_transform(layer))
    parts = list(split(frame, line).geoms)
    # Ice Island (Ontario) and Dark Island (New York) establish which
    # side is which. Map disagreement at any other island stays unassigned.
    result = {}
    for code, control in [('CA', (-75.83502, 44.45852)), ('US', (-75.8127, 44.4521))]:
        result[code], = [p for p in parts if p.contains(Point(*control))]
    if len(parts) != 2 or result['CA'].equals(result['US']):
        raise ValueError('Unexpected IBC boundary geometry in St. Lawrence window')
    return result


def reviewed_interior(geom):
    # Leave about 1–2 m inside the corroborated surface before simplification.
    # The intersection bounds simplification errors; quantization to 1e-7°
    # cannot make two formerly adjoining land/water sources overlap.
    return geom.buffer(-0.000015, join_style='mitre').simplify(0.00001).intersection(geom)


def make_window(key, record, cache, inventory, download):
    name, bbox, main_id, pond_ids, digest, reference = record
    border = key == 'ca-ice-dark'
    frame = box(*common.padded(bbox))
    hydro_url = hydro_request([main_id, *pond_ids])
    raw = obtain(cache / (key + '.geojson'), hydro_url, digest, download)
    water, holes, ponds = canada_hydro(raw, main_id, pond_ids, frame)
    shares = {'CA': holes}
    boundaries = {'CA': frame}
    version = 'Ontario Great Lakes Islands (2010-04); OHN permanent waterbody ' + str(main_id)
    attribution = ONTARIO_CREDIT
    urls = [INVENTORY_URL, hydro_url, reference, 'https://www.ontario.ca/page/open-government-licence-ontario']
    if border:
        us_water, shares['US'] = us_river(cache / TIGER, frame)
        water = water.union(us_water)
        boundaries = river_sides(cache / IBC, frame)
        version += '; TIGER/Line 2025 area hydrography; IBC digital boundary v1.3'
        attribution += ' U.S. Census Bureau TIGER/Line. Contains information licensed under the Open Government Licence – Canada (International Boundary Commission).'
        urls += [TIGER_URL, IBC_URL]

    inventory.SetSpatialFilterRect(*frame.bounds)
    transform = shore.wgs_transform(inventory)
    land, owners, outlines = [], [], []
    for f in inventory:
        geom = make_valid(shore.to_wgs(f.geometry(), transform))
        outline = geom.intersection(frame)
        outlines.append(outline)
        code = {'CAN': 'CA', 'US': 'US'}.get(f['COUNTRY'])
        label = f['CMPLX_NAME']
        if (code not in shares or f['ISL_TYPE'] not in ('Island', 'Natural')
                or 'shoal' in (label or '').lower() or f['SPLIT']):
            continue
        dry = reviewed_interior(outline.intersection(shares[code]).difference(water).difference(ponds))
        # A multipart inventory record names a whole group, not each islet.
        fields = {'name': label} if label and geom.geom_type == 'Polygon' else {}
        land.extend(common.pack(dry, kind='island', **fields))
        owners.extend(common.pack(dry.intersection(boundaries[code]), code=code))
    # Interior freshwater ponds have their own positive records. Elsewhere
    # retain uncertainty wherever the two sources draw different shorelines.
    wet = water.difference(union_all(outlines)).union(ponds)
    return dict(id=key, name=name, bbox=bbox, source='canada-island-review+' + key, version=version,
                attribution=attribution, evidenceUrls=urls, land=land, owners=owners,
                water=common.pack(reviewed_interior(wet), kind='inland'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input_directory', type=Path)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--output', type=Path, default=OUTPUT)
    args = parser.parse_args()
    ogr.UseExceptions()
    cache = args.input_directory
    cache.mkdir(parents=True, exist_ok=True)
    for filename, url, digest in [(INVENTORY, INVENTORY_URL, shore.ONTARIO_SHA),
                                  (TIGER, TIGER_URL, TIGER_SHA), (IBC, IBC_URL, IBC_SHA256)]:
        obtain(cache / filename, url, digest, args.download)
    archive = cache / INVENTORY
    inner = '/vsizip/' + str(archive.resolve()) + '/GreatLakes_islands/Great_Lakes_Islands_April2010.zip'
    inventory = ogr.Open('/vsizip/{' + inner + '}/Great_Lakes_Islands_April2010.shp')
    windows = [make_window(k, v, cache, inventory.GetLayer(), args.download) for k, v in WINDOWS.items()]
    args.output.write_text(json.dumps({'windows': windows}, separators=(',', ':'), ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
