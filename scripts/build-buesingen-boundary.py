#!/usr/bin/env python3
"""Build the Büsingen administrative boundary from swissBOUNDARIES3D (Python GDAL/GEOS).

Run with python3 scripts/build-buesingen-boundary.py [official-release.gpkg.zip].
The optional local archive and the default download must have the same pinned digest.
"""

import argparse
import hashlib
import json
from pathlib import Path
import shutil
from tempfile import TemporaryDirectory
from urllib.request import urlopen
from zipfile import ZipFile

from osgeo import ogr, osr

RELEASE = 'swissboundaries3d_2026-01'
SOURCE = f'https://data.geo.admin.ch/ch.swisstopo.swissboundaries3d/{RELEASE}/{RELEASE}_2056_5728.gpkg.zip'
SHA256 = '68e922353c76fa5db3cef06a32f9711c0198faa6fbd2b5bcde9edc88b0f8999f'
GPKG = 'swissBOUNDARIES3D_1_5_LV95_LN02.gpkg'
BOUNDS = [8.653, 47.679, 8.722, 47.720]
TARGET = Path(__file__).resolve().parents[1] / 'src/data/buesingenBoundary.json'


def build(path):
    ogr.UseExceptions()
    osr.UseExceptions()
    database = ogr.Open(str(path))
    layer = database.GetLayerByName('tlm_landesgebiet')
    wgs84 = osr.SpatialReference()
    wgs84.ImportFromEPSG(4326)
    wgs84.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    options = osr.CoordinateTransformationOptions()
    options.SetBallparkAllowed(False)
    options.SetDesiredAccuracy(1.0)
    transform = osr.CreateCoordinateTransformation(layer.GetSpatialRef(), wgs84, options)
    west, south, east, north = BOUNDS
    window = ogr.CreateGeometryFromWkt(
        f'POLYGON(({west} {south},{east} {south},{east} {north},{west} {north},{west} {south}))'
    )
    areas = {}
    for feature in layer:
        code = feature.GetField('icc')
        if code in ('CH', 'DE'):
            owned = feature.GetGeometryRef().Clone()
            owned.FlattenTo2D()
            owned.Transform(transform)
            if code in areas or not owned.IsValid():
                raise ValueError(f'Unexpected country geometry for {code}')
            areas[code] = owned.Intersection(window)

    # Only use the complement as Swiss territory if the source proves it.
    swiss, german = areas['CH'], areas['DE']
    if (not window.Difference(swiss.Union(german)).IsEmpty()
            or swiss.Intersection(german).GetArea() != 0):
        raise ValueError('Coverage contains a gap or overlapping national interiors')
    if (german.GetGeometryName() != 'POLYGON' or german.GetGeometryCount() != 1
            or not window.Boundary().Disjoint(german)):
        raise ValueError('Expected one complete exclave strictly inside the window')
    points = [[round(x, 9), round(y, 9)] for x, y, *_ in german.GetGeometryRef(0).GetPoints()]
    # RFC 7946 exterior orientation and a stable starting vertex across GEOS versions.
    shell = points[:-1]
    if sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(points, points[1:])) < 0:
        shell.reverse()
    start = shell.index(min(shell))
    points = shell[start:] + shell[:start] + [shell[start]]
    manifest = {
        'source_id': 'swisstopo-swissboundaries3d-buesingen',
        'source_name': 'swissBOUNDARIES3D', 'provider': 'Federal Office of Topography swisstopo',
        'attribution': 'Federal Office of Topography swisstopo',
        'source_url': SOURCE, 'source_version': 'swissBOUNDARIES3D 2026-01', 'source_sha256': SHA256,
        'coverage_region': 'Büsingen and adjacent parts of Switzerland within bounds',
        'license_or_terms': 'https://www.swisstopo.admin.ch/en/terms-of-use-free-geodata-and-geoservices',
        'redistribution_status': 'Open government data with source attribution',
        'allowed_use': 'Use, process and redistribute, including commercially, with source attribution',
        'transformed_fields': 'tlm_landesgebiet CH and DE, LV95 to WGS84, nine decimal places; shared ring stored once',
        'freshness': '2026-01 release; rebuild and verify the coverage proof before upgrading',
        'confidence_notes': 'Administrative boundaries include water. Borders and clipped coverage do not determine land, postal routes or deliverability.',
    }
    return {'manifest': manifest, 'bounds': BOUNDS, 'ring': points}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', nargs='?', type=Path)
    args = parser.parse_args()
    with TemporaryDirectory() as directory:
        archive = args.archive or Path(directory) / 'release.zip'
        if args.archive is None:
            with urlopen(SOURCE, timeout=90) as response, archive.open('wb') as output:
                shutil.copyfileobj(response, output)
        with archive.open('rb') as handle:
            if hashlib.file_digest(handle, 'sha256').hexdigest() != SHA256:
                raise ValueError('Unexpected swissBOUNDARIES3D archive digest')
        with ZipFile(archive) as zipped:
            database = Path(zipped.extract(GPKG, directory))
        data = build(database)
    # Keep source metadata readable and each position on one line.
    head = json.dumps({'manifest': data['manifest'], 'bounds': BOUNDS}, ensure_ascii=False, indent=2)
    positions = ',\n'.join('    ' + json.dumps(p) for p in data['ring'])
    TARGET.write_text(head[:-2] + ',\n  "ring": [\n' + positions + '\n  ]\n}\n', encoding='utf-8')


if __name__ == '__main__':
    main()
